#!/usr/bin/env python3
"""
AI SoundStripper — Metadata tool, NOT a watermark remover.
Inspect · strip junk metadata · imprint tags · convert · snip — any format.

Requirements:
    pip install mutagen numpy Pillow
    ffmpeg / ffprobe must be on PATH  (the "Get ffmpeg" button helps)
    Optional: pip install tkinterdnd2   (enables drag-and-drop)
"""

import os, sys, re, json, shutil, struct, subprocess, tempfile, threading, time, wave
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
from pathlib import Path
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor

try:
    from mutagen import File as MutagenFile
    from mutagen.mp3 import MP3
    from mutagen.mp4 import MP4, MP4Cover
    from mutagen.flac import FLAC, Picture
    from mutagen.oggvorbis import OggVorbis
    from mutagen.id3 import ID3, APIC, TIT2, TALB, TCON, TPE1, TDRC, COMM, ID3NoHeaderError
    from mutagen.wave import WAVE
    HAS_MUTAGEN = True
except ImportError:
    HAS_MUTAGEN = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from PIL import Image, ImageTk
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_DND = True
except ImportError:
    HAS_DND = False

AUDIO_EXTS = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.mp4', '.aac',
              '.wma', '.aiff', '.aif', '.opus', '.webm', '.oga'}

def which_ffmpeg():
    for name in ('ffmpeg', 'ffmpeg.exe'):
        p = shutil.which(name)
        if p:
            return p
    return None

def which_ffprobe():
    for name in ('ffprobe', 'ffprobe.exe'):
        p = shutil.which(name)
        if p:
            return p
    return None

def run_ff(args, timeout=120):
    try:
        r = subprocess.run(args, capture_output=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr.decode(errors='replace')
    except FileNotFoundError:
        return -1, b'', 'ffmpeg/ffprobe not found on PATH'
    except subprocess.TimeoutExpired:
        return -1, b'', 'Timeout'

def get_duration_seconds(path):
    ffprobe = which_ffprobe()
    if ffprobe:
        code, out, err = run_ff([
            ffprobe, '-v', 'quiet', '-print_format', 'json',
            '-show_format', str(path)
        ])
        if code == 0:
            try:
                info = json.loads(out)
                return float(info['format']['duration'])
            except Exception:
                pass
    ext = Path(path).suffix.lower()
    if ext == '.wav':
        try:
            with wave.open(str(path), 'rb') as wf:
                return wf.getnframes() / wf.getframerate()
        except Exception:
            pass
    return None

def read_pcm_for_waveform(path, target_samples=2000):
    ffmpeg = which_ffmpeg()
    if not ffmpeg or not HAS_NUMPY:
        return None
    code, out, _ = run_ff([
        ffmpeg, '-i', str(path), '-ac', '1', '-ar', '8000',
        '-f', 's16le', '-acodec', 'pcm_s16le', 'pipe:1'
    ])
    if code != 0 or len(out) < 4:
        return None
    samples = np.frombuffer(out, dtype=np.int16).astype(np.float32)
    if len(samples) == 0:
        return None
    chunk = max(1, len(samples) // target_samples)
    n = (len(samples) // chunk) * chunk
    samples = samples[:n].reshape(-1, chunk)
    peaks = np.max(np.abs(samples), axis=1)
    mx = peaks.max()
    if mx > 0:
        peaks = peaks / mx
    return peaks


class AudioPlayer:
    """Plays audio using ffmpeg piped to a simple raw-PCM playback or via a temp wav."""

    def __init__(self):
        self._proc = None
        self._playing = False
        self._start_time = 0.0
        self._offset = 0.0
        self._lock = threading.Lock()
        self._tempfile = None

    @property
    def playing(self):
        return self._playing

    def play(self, path, start_sec=0.0):
        self.stop()
        ffmpeg = which_ffmpeg()
        if not ffmpeg:
            return False
        with self._lock:
            self._offset = start_sec
            self._start_time = time.time()
            self._playing = True
        args = [ffmpeg, '-ss', str(start_sec), '-i', str(path),
                '-f', 'wav', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', 'pipe:1']
        try:
            if sys.platform == 'win32':
                import winsound
                tf = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                self._tempfile = tf.name
                tf.close()
                args2 = [ffmpeg, '-ss', str(start_sec), '-i', str(path),
                         '-y', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', self._tempfile]
                r = subprocess.run(args2, capture_output=True, timeout=30)
                if r.returncode == 0 and os.path.getsize(self._tempfile) > 44:
                    def _play_win():
                        try:
                            winsound.PlaySound(self._tempfile, winsound.SND_FILENAME)
                        except Exception:
                            pass
                        finally:
                            with self._lock:
                                self._playing = False
                    threading.Thread(target=_play_win, daemon=True).start()
                    return True
                else:
                    self._playing = False
                    return False
            else:
                aplay = shutil.which('aplay') or shutil.which('paplay') or shutil.which('afplay')
                if not aplay:
                    for player in ('pw-play', 'sox', 'play'):
                        p = shutil.which(player)
                        if p:
                            aplay = p
                            break
                if not aplay:
                    self._playing = False
                    return False

                tf = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                self._tempfile = tf.name
                tf.close()
                args2 = [ffmpeg, '-ss', str(start_sec), '-i', str(path),
                         '-y', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', self._tempfile]
                r = subprocess.run(args2, capture_output=True, timeout=30)
                if r.returncode != 0 or os.path.getsize(self._tempfile) < 44:
                    self._playing = False
                    return False

                def _play_unix():
                    try:
                        self._proc = subprocess.Popen(
                            [aplay, self._tempfile],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                        )
                        self._proc.wait()
                    except Exception:
                        pass
                    finally:
                        with self._lock:
                            self._playing = False

                threading.Thread(target=_play_unix, daemon=True).start()
                return True
        except Exception:
            self._playing = False
            return False

    def stop(self):
        with self._lock:
            self._playing = False
        if self._proc:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=2)
            except Exception:
                try:
                    self._proc.kill()
                except Exception:
                    pass
            self._proc = None
        if sys.platform == 'win32':
            try:
                import winsound
                winsound.PlaySound(None, winsound.SND_PURGE)
            except Exception:
                pass
        if self._tempfile and os.path.exists(self._tempfile):
            try:
                os.unlink(self._tempfile)
            except Exception:
                pass
            self._tempfile = None

    def elapsed(self):
        if not self._playing:
            return 0.0
        return self._offset + (time.time() - self._start_time)


class WaveformDialog(tk.Toplevel):
    """Waveform viewer with playback, selection, and export."""

    def __init__(self, parent, filepath, on_export=None):
        super().__init__(parent)
        self.title(f"Waveform — {Path(filepath).name}")
        self.geometry("900x520")
        self.resizable(True, True)
        self.filepath = filepath
        self.on_export = on_export
        self.player = AudioPlayer()
        self.duration = get_duration_seconds(filepath) or 0
        self.peaks = None
        self.sel_start = None
        self.sel_end = None
        self._drag_start_x = None
        self._playhead_job = None

        self.transient(parent)
        self.grab_set()

        top = ttk.Frame(self, padding=6)
        top.pack(fill='x')
        ttk.Label(top, text="Drag across the waveform to select a section, then export it.",
                  font=('Segoe UI', 9)).pack()

        self.canvas = tk.Canvas(self, bg='#0a1628', height=240, cursor='crosshair')
        self.canvas.pack(fill='both', expand=True, padx=10, pady=(4, 0))
        self.canvas.bind('<ButtonPress-1>', self._on_press)
        self.canvas.bind('<B1-Motion>', self._on_drag)
        self.canvas.bind('<ButtonRelease-1>', self._on_release)
        self.canvas.bind('<Configure>', lambda e: self._draw_waveform())

        self.sel_label = ttk.Label(self, text="selection: (drag across the waveform)", font=('Segoe UI', 8))
        self.sel_label.pack(pady=(2, 4))

        ctrl = ttk.Frame(self, padding=6)
        ctrl.pack(fill='x')

        play_frame = ttk.Frame(ctrl)
        play_frame.pack(side='left')

        self.btn_play = ttk.Button(play_frame, text="▶ Play", command=self._play)
        self.btn_play.pack(side='left', padx=2)
        self.btn_play_sel = ttk.Button(play_frame, text="▶ Play Selection", command=self._play_selection)
        self.btn_play_sel.pack(side='left', padx=2)
        self.btn_stop = ttk.Button(play_frame, text="■ Stop", command=self._stop)
        self.btn_stop.pack(side='left', padx=2)

        self.time_label = ttk.Label(ctrl, text="0:00 / 0:00", font=('Consolas', 9))
        self.time_label.pack(side='left', padx=12)

        right = ttk.Frame(ctrl)
        right.pack(side='right')

        ttk.Label(right, text="Export as").pack(side='left')
        self.fmt_var = tk.StringVar(value='mp3')
        fmt_cb = ttk.Combobox(right, textvariable=self.fmt_var, values=['mp3', 'wav', 'flac', 'ogg', 'm4a'],
                              width=5, state='readonly')
        fmt_cb.pack(side='left', padx=4)

        ttk.Label(right, text="Quality").pack(side='left')
        self.qual_var = tk.StringVar(value='High')
        qual_cb = ttk.Combobox(right, textvariable=self.qual_var, values=['Low', 'Medium', 'High', 'Lossless'],
                               width=8, state='readonly')
        qual_cb.pack(side='left', padx=4)

        self.btn_export = ttk.Button(right, text="Export snippet", command=self._export)
        self.btn_export.pack(side='left', padx=8)
        ttk.Button(right, text="Close", command=self._close).pack(side='left')

        self.protocol("WM_DELETE_WINDOW", self._close)
        self.after(50, self._load_waveform)
        self._update_time()

    def _fmt_time(self, sec):
        if sec is None or sec < 0:
            sec = 0
        m = int(sec) // 60
        s = int(sec) % 60
        return f"{m}:{s:02d}"

    def _load_waveform(self):
        self.peaks = read_pcm_for_waveform(self.filepath, target_samples=2000)
        self._draw_waveform()

    def _draw_waveform(self):
        c = self.canvas
        c.delete('all')
        w = c.winfo_width()
        h = c.winfo_height()
        if w < 10 or h < 10:
            return

        if self.sel_start is not None and self.sel_end is not None:
            x1 = self.sel_start * w
            x2 = self.sel_end * w
            c.create_rectangle(x1, 0, x2, h, fill='#1a3a5c', outline='')

        if self.peaks is not None and len(self.peaks) > 0:
            mid = h / 2
            n = len(self.peaks)
            bar_w = max(1, w / n)
            for i, p in enumerate(self.peaks):
                x = i * w / n
                amp = p * (mid - 4)
                color = '#3399ff'
                if self.sel_start is not None and self.sel_end is not None:
                    frac = i / n
                    if self.sel_start <= frac <= self.sel_end:
                        color = '#66bbff'
                c.create_line(x, mid - amp, x, mid + amp, fill=color, width=max(1, bar_w * 0.8))
        else:
            c.create_text(w // 2, h // 2, text="Loading waveform...", fill='#888', font=('Segoe UI', 11))

        self.time_label.config(text=f"0:00 / {self._fmt_time(self.duration)}")

    def _on_press(self, event):
        w = self.canvas.winfo_width()
        self._drag_start_x = max(0, min(event.x / w, 1.0))
        self.sel_start = self._drag_start_x
        self.sel_end = self._drag_start_x

    def _on_drag(self, event):
        if self._drag_start_x is None:
            return
        w = self.canvas.winfo_width()
        pos = max(0, min(event.x / w, 1.0))
        self.sel_start = min(self._drag_start_x, pos)
        self.sel_end = max(self._drag_start_x, pos)
        self._draw_waveform()
        t1 = self.sel_start * self.duration
        t2 = self.sel_end * self.duration
        self.sel_label.config(text=f"selection: {self._fmt_time(t1)} → {self._fmt_time(t2)}  ({self._fmt_time(t2 - t1)})")

    def _on_release(self, event):
        self._on_drag(event)

    def _play(self):
        self._stop()
        ok = self.player.play(self.filepath, start_sec=0)
        if not ok:
            messagebox.showwarning("Playback", "Could not play audio.\nMake sure ffmpeg and a system audio player are available.", parent=self)

    def _play_selection(self):
        if self.sel_start is None or self.sel_end is None or self.sel_start >= self.sel_end:
            self._play()
            return
        self._stop()
        start_sec = self.sel_start * self.duration
        ok = self.player.play(self.filepath, start_sec=start_sec)
        if not ok:
            messagebox.showwarning("Playback", "Could not play audio.\nMake sure ffmpeg and a system audio player are available.", parent=self)

    def _stop(self):
        self.player.stop()

    def _update_time(self):
        if self.player.playing:
            elapsed = self.player.elapsed()
            self.time_label.config(text=f"{self._fmt_time(elapsed)} / {self._fmt_time(self.duration)}")
            frac = elapsed / self.duration if self.duration > 0 else 0
            self._draw_waveform()
            w = self.canvas.winfo_width()
            h = self.canvas.winfo_height()
            x = frac * w
            self.canvas.create_line(x, 0, x, h, fill='#ff4444', width=2, tags='playhead')
        if self.winfo_exists():
            self._playhead_job = self.after(50, self._update_time)

    def _export(self):
        ffmpeg = which_ffmpeg()
        if not ffmpeg:
            messagebox.showerror("Error", "ffmpeg not found on PATH.", parent=self)
            return
        fmt = self.fmt_var.get()
        ext = f'.{fmt}'
        stem = Path(self.filepath).stem

        start_sec = 0
        end_sec = self.duration
        if self.sel_start is not None and self.sel_end is not None and self.sel_end > self.sel_start:
            start_sec = self.sel_start * self.duration
            end_sec = self.sel_end * self.duration

        quality_map = {
            'mp3': {'Low': '192k', 'Medium': '256k', 'High': '320k', 'Lossless': '320k'},
            'wav': {'Low': '', 'Medium': '', 'High': '', 'Lossless': ''},
            'flac': {'Low': '5', 'Medium': '5', 'High': '8', 'Lossless': '12'},
            'ogg': {'Low': '4', 'Medium': '6', 'High': '8', 'Lossless': '10'},
            'm4a': {'Low': '128k', 'Medium': '192k', 'High': '256k', 'Lossless': '320k'},
        }

        outpath = filedialog.asksaveasfilename(
            parent=self,
            title="Export snippet",
            initialfile=f"{stem}_snippet{ext}",
            defaultextension=ext,
            filetypes=[(fmt.upper(), f'*{ext}'), ('All', '*.*')]
        )
        if not outpath:
            return

        dur = end_sec - start_sec
        args = [ffmpeg, '-y', '-ss', str(start_sec), '-t', str(dur),
                '-i', str(self.filepath)]

        q = self.qual_var.get()
        if fmt == 'mp3':
            args += ['-codec:a', 'libmp3lame', '-b:a', quality_map['mp3'][q]]
        elif fmt == 'wav':
            args += ['-codec:a', 'pcm_s16le']
        elif fmt == 'flac':
            args += ['-codec:a', 'flac', '-compression_level', quality_map['flac'][q]]
        elif fmt == 'ogg':
            args += ['-codec:a', 'libvorbis', '-q:a', quality_map['ogg'][q]]
        elif fmt == 'm4a':
            args += ['-codec:a', 'aac', '-b:a', quality_map['m4a'][q]]

        args.append(outpath)
        code, _, err = run_ff(args, timeout=120)
        if code == 0 and os.path.exists(outpath) and os.path.getsize(outpath) > 0:
            messagebox.showinfo("Exported", f"Saved: {outpath}\nDuration: {self._fmt_time(dur)}", parent=self)
        else:
            messagebox.showerror("Export failed", err[:500], parent=self)

    def _close(self):
        self._stop()
        if self._playhead_job:
            self.after_cancel(self._playhead_job)
        self.destroy()


class App(tk.Tk if not HAS_DND else TkinterDnD.Tk):
    """Main AI SoundStripper window."""

    def __init__(self):
        super().__init__()
        self.title("AI SoundStripper")
        self.geometry("860x820")
        self.minsize(700, 650)
        self.files = []
        self._cover_path = None

        self._build_ui()

    # ── UI ──────────────────────────────────────────────────────────

    def _build_ui(self):
        style = ttk.Style(self)
        style.theme_use('clam')

        hdr = ttk.Frame(self, padding=(10, 8))
        hdr.pack(fill='x')
        ttk.Label(hdr, text="AI SoundStripper", font=('Georgia', 18, 'bold'),
                  foreground='#222').pack()
        ttk.Label(hdr, text="Inspect · strip junk metadata · imprint tags · convert · snip — any format.   Metadata tool, NOT a watermark remover.",
                  font=('Segoe UI', 8), foreground='#666').pack()

        sep = ttk.Separator(hdr, orient='horizontal')
        sep.pack(fill='x', pady=(6, 0))

        # ── file list ──
        file_frame = ttk.LabelFrame(self, text="Files — add one or many", padding=6)
        file_frame.pack(fill='both', padx=10, pady=(6, 2), expand=False)

        list_and_btns = ttk.Frame(file_frame)
        list_and_btns.pack(fill='both', expand=True)

        self.file_listbox = tk.Listbox(list_and_btns, height=6, selectmode='extended',
                                       font=('Consolas', 9))
        self.file_listbox.pack(side='left', fill='both', expand=True)

        sb = ttk.Scrollbar(list_and_btns, orient='vertical', command=self.file_listbox.yview)
        sb.pack(side='left', fill='y')
        self.file_listbox.config(yscrollcommand=sb.set)

        btn_col = ttk.Frame(list_and_btns)
        btn_col.pack(side='left', padx=(6, 0))
        ttk.Button(btn_col, text="Add...", width=10, command=self._add_files).pack(pady=2)
        ttk.Button(btn_col, text="Remove", width=10, command=self._remove_files).pack(pady=2)
        ttk.Button(btn_col, text="Clear", width=10, command=self._clear_files).pack(pady=2)

        # drag-and-drop support
        if HAS_DND:
            self.file_listbox.drop_target_register(DND_FILES)
            self.file_listbox.dnd_bind('<<Drop>>', self._on_drop)
            file_frame.drop_target_register(DND_FILES)
            file_frame.dnd_bind('<<Drop>>', self._on_drop)
        else:
            drop_label = ttk.Label(file_frame,
                                   text="Tip: install tkinterdnd2 (pip install tkinterdnd2) for drag-and-drop support",
                                   font=('Segoe UI', 7), foreground='#999')
            drop_label.pack(anchor='w')

        # ── imprint provenance ──
        prov = ttk.LabelFrame(self, text="Imprint provenance", padding=6)
        prov.pack(fill='x', padx=10, pady=4)

        fields_frame = ttk.Frame(prov)
        fields_frame.pack(fill='x')

        self.tag_vars = {}
        for label_text in ('Title', 'Album', 'Artist', 'Genre', 'Year', 'Comment', 'Creation type'):
            row = ttk.Frame(fields_frame)
            row.pack(fill='x', pady=1)
            ttk.Label(row, text=label_text, width=14, anchor='e').pack(side='left')
            var = tk.StringVar()
            ttk.Entry(row, textvariable=var, width=60).pack(side='left', padx=4, fill='x', expand=True)
            self.tag_vars[label_text] = var

        btn_prov = ttk.Frame(prov)
        btn_prov.pack(fill='x', pady=(6, 0))
        ttk.Button(btn_prov, text="Clear fields", command=self._clear_tag_fields).pack(side='right')

        # ── info / log area ──
        info_frame = ttk.LabelFrame(self, text="Inspection log", padding=4)
        info_frame.pack(fill='both', padx=10, pady=4, expand=True)

        self.info_text = tk.Text(info_frame, height=10, font=('Consolas', 8),
                                 bg='#fafafa', wrap='word', state='disabled')
        self.info_text.pack(fill='both', expand=True)

        info_btn_frame = ttk.Frame(info_frame)
        info_btn_frame.pack(fill='x', pady=(4, 0))
        ttk.Button(info_btn_frame, text="Clear log", command=self._clear_log).pack(side='right')

        # ── actions ──
        act = ttk.LabelFrame(self, text="Actions", padding=6)
        act.pack(fill='x', padx=10, pady=(4, 10))

        row1 = ttk.Frame(act)
        row1.pack(fill='x', pady=2)
        self._action_btn(row1, "Inspect", self._inspect, bg='#e0e0e0')
        self._action_btn(row1, "Strip junk + save", self._strip_junk, bg='#cc3333', fg='white')
        self._action_btn(row1, "Imprint tags + save", self._imprint_tags, bg='#cc3333', fg='white')
        self._action_btn(row1, "Convert...", self._convert, bg='#e0e0e0')
        self._action_btn(row1, "Waveform / Snip...", self._waveform, bg='#e0e0e0')

        row2 = ttk.Frame(act)
        row2.pack(fill='x', pady=2)
        self._action_btn(row2, "Normalize", self._normalize, bg='#e0e0e0')
        self._action_btn(row2, "Set cover...", self._set_cover, bg='#e0e0e0')
        self._action_btn(row2, "Detectors...", self._detectors, bg='#e0e0e0')
        self._action_btn(row2, "Batch folder...", self._batch_folder, bg='#e0e0e0')
        self._action_btn(row2, "Get ffmpeg", self._get_ffmpeg, bg='#e0e0e0')

    def _action_btn(self, parent, text, cmd, bg='#e0e0e0', fg='black'):
        b = tk.Button(parent, text=text, command=cmd, bg=bg, fg=fg,
                      relief='raised', bd=1, padx=10, pady=4,
                      font=('Segoe UI', 9))
        b.pack(side='left', padx=3, expand=True, fill='x')

    # ── logging ──

    def _log(self, msg):
        self.info_text.config(state='normal')
        self.info_text.insert('end', msg + '\n')
        self.info_text.see('end')
        self.info_text.config(state='disabled')

    def _clear_log(self):
        self.info_text.config(state='normal')
        self.info_text.delete('1.0', 'end')
        self.info_text.config(state='disabled')

    def _clear_tag_fields(self):
        for var in self.tag_vars.values():
            var.set('')
        self._cover_path = None

    # ── file management ──

    def _add_files(self):
        paths = filedialog.askopenfilenames(
            title="Select audio files",
            filetypes=[("Audio files", " ".join(f'*{e}' for e in AUDIO_EXTS)),
                       ("All files", "*.*")]
        )
        for p in paths:
            if p and p not in self.files:
                self.files.append(p)
                self.file_listbox.insert('end', Path(p).name)

    def _remove_files(self):
        sel = list(self.file_listbox.curselection())
        for i in reversed(sel):
            self.file_listbox.delete(i)
            del self.files[i]

    def _clear_files(self):
        self.files.clear()
        self.file_listbox.delete(0, 'end')

    def _on_drop(self, event):
        raw = event.data
        paths = []
        if '{' in raw:
            paths = re.findall(r'\{([^}]+)\}', raw)
            remainder = re.sub(r'\{[^}]+\}', '', raw).strip()
            if remainder:
                paths.extend(remainder.split())
        else:
            paths = raw.split()

        added = 0
        for p in paths:
            p = p.strip()
            if not p:
                continue
            if os.path.isfile(p):
                ext = Path(p).suffix.lower()
                if ext in AUDIO_EXTS or ext in ('.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.aiff', '.opus'):
                    if p not in self.files:
                        self.files.append(p)
                        self.file_listbox.insert('end', Path(p).name)
                        added += 1
            elif os.path.isdir(p):
                for root, dirs, fnames in os.walk(p):
                    for fn in fnames:
                        fp = os.path.join(root, fn)
                        ext = Path(fp).suffix.lower()
                        if ext in AUDIO_EXTS and fp not in self.files:
                            self.files.append(fp)
                            self.file_listbox.insert('end', Path(fp).name)
                            added += 1
        if added:
            self._log(f"Dropped {added} file(s).")

    def _selected_files(self):
        sel = self.file_listbox.curselection()
        if sel:
            return [self.files[i] for i in sel]
        return list(self.files)

    # ── Inspect ──

    def _inspect(self):
        files = self._selected_files()
        if not files:
            self._log("No files to inspect.")
            return
        if not HAS_MUTAGEN:
            self._log("ERROR: mutagen not installed. Run: pip install mutagen")
            return
        for fp in files:
            self._log(f"\n{'='*60}")
            self._log(f"Inspecting: {Path(fp).name}")
            self._log(f"  Path: {fp}")
            self._log(f"  Size: {os.path.getsize(fp):,} bytes")
            try:
                mf = MutagenFile(fp)
                if mf is None:
                    self._log("  (mutagen could not identify this file)")
                    continue
                self._log(f"  Format: {type(mf).__name__}")
                if hasattr(mf.info, 'length'):
                    self._log(f"  Duration: {mf.info.length:.1f}s")
                if hasattr(mf.info, 'bitrate'):
                    self._log(f"  Bitrate: {mf.info.bitrate // 1000}kbps")
                if hasattr(mf.info, 'sample_rate'):
                    self._log(f"  Sample rate: {mf.info.sample_rate}Hz")
                if hasattr(mf.info, 'channels'):
                    self._log(f"  Channels: {mf.info.channels}")

                self._log("  Tags (artist / title / provenance):")
                if mf.tags:
                    for key, val in mf.tags.items():
                        if 'APIC' in str(key) or isinstance(val, bytes):
                            self._log(f"    - {key}: [binary data, {len(val) if isinstance(val, bytes) else 'image'}]")
                        else:
                            self._log(f"    - {key}:\t{val}")
                else:
                    self._log("    (no tags)")
            except Exception as exc:
                self._log(f"  Error: {exc}")

            self._inspect_layers(fp)

    def _inspect_layers(self, fp):
        ext = Path(fp).suffix.lower()
        # Layer 1: container metadata
        self._log("Layer 1  container metadata (removable):")
        if ext == '.wav':
            try:
                with open(fp, 'rb') as f:
                    riff = f.read(4)
                    if riff == b'RIFF':
                        f.seek(0)
                        data = f.read()
                        chunks = []
                        pos = 12
                        while pos < len(data) - 8:
                            chunk_id = data[pos:pos+4].decode('ascii', errors='replace')
                            chunk_sz = struct.unpack_from('<I', data, pos+4)[0]
                            if chunk_id not in ('fmt ', 'data'):
                                chunks.append(f"metadata chunk '{chunk_id}' ({chunk_sz} bytes)")
                            pos += 8 + chunk_sz + (chunk_sz % 2)
                        if chunks:
                            for c in chunks:
                                self._log(f"    - {c}")
                        else:
                            self._log("    - (clean — no extra chunks)")
            except Exception:
                self._log("    - (could not parse)")
        else:
            self._log("    - (checked via mutagen above)")

        # Layer 2: C2PA
        self._log("Layer 2  C2PA: none detected (local scan)")
        c2 = shutil.which('c2patool')
        if c2:
            code, out, err = run_ff([c2, str(fp), '--info'], timeout=10)
            if code == 0 and out:
                self._log(f"    c2patool: {out.decode(errors='replace')[:200]}")
            else:
                self._log("    c2patool: no signed manifest found")
        else:
            self._log("    c2patool: not installed (optional)")

        # Layer 3: signal watermark
        self._log("Layer 3  signal watermark / fingerprint: lives in the waveform, not the file. Metadata changes do NOT affect it.")

    # ── Strip junk ──

    def _strip_junk(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        if not HAS_MUTAGEN:
            self._log("ERROR: mutagen not installed.")
            return
        for fp in files:
            name = Path(fp).name
            try:
                mf = MutagenFile(fp)
                if mf is None:
                    self._log(f"SKIP {name}: unrecognized format")
                    continue
                if mf.tags:
                    mf.delete()
                    self._log(f"Stripped tags from {name}")
                else:
                    self._log(f"{name}: no tags to strip")

                ext = Path(fp).suffix.lower()
                if ext == '.wav':
                    self._strip_wav_chunks(fp)
            except Exception as exc:
                self._log(f"ERROR {name}: {exc}")

    def _strip_wav_chunks(self, fp):
        try:
            with open(fp, 'rb') as f:
                data = f.read()
            if data[:4] != b'RIFF' or data[8:12] != b'WAVE':
                return
            keep = bytearray(data[:12])
            pos = 12
            stripped = 0
            while pos < len(data) - 8:
                chunk_id = data[pos:pos+4]
                chunk_sz = struct.unpack_from('<I', data, pos+4)[0]
                total = 8 + chunk_sz + (chunk_sz % 2)
                if chunk_id in (b'fmt ', b'data'):
                    keep.extend(data[pos:pos+total])
                else:
                    stripped += 1
                pos += total
            if stripped:
                struct.pack_into('<I', keep, 4, len(keep) - 8)
                with open(fp, 'wb') as f:
                    f.write(keep)
                self._log(f"  Removed {stripped} extra WAV chunk(s)")
        except Exception as exc:
            self._log(f"  WAV chunk strip error: {exc}")

    # ── Imprint tags ──

    def _imprint_tags(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        if not HAS_MUTAGEN:
            self._log("ERROR: mutagen not installed.")
            return

        tags = {k: v.get().strip() for k, v in self.tag_vars.items()}

        done = 0
        for fp in files:
            name = Path(fp).name
            ext = Path(fp).suffix.lower()
            try:
                if ext == '.mp3':
                    try:
                        audio = MP3(fp, ID3=ID3)
                    except ID3NoHeaderError:
                        audio = MP3(fp)
                        audio.add_tags()
                    if not audio.tags:
                        audio.add_tags()
                    if tags['Title']:
                        audio.tags.add(TIT2(encoding=3, text=[tags['Title']]))
                    if tags['Album']:
                        audio.tags.add(TALB(encoding=3, text=[tags['Album']]))
                    if tags['Artist']:
                        audio.tags.add(TPE1(encoding=3, text=[tags['Artist']]))
                    if tags['Genre']:
                        audio.tags.add(TCON(encoding=3, text=[tags['Genre']]))
                    if tags['Year']:
                        audio.tags.add(TDRC(encoding=3, text=[tags['Year']]))
                    comment = tags.get('Comment', '')
                    creation = tags.get('Creation type', '')
                    full_comment = '; '.join(filter(None, [comment, f"creation={creation}" if creation else '']))
                    if full_comment:
                        audio.tags.add(COMM(encoding=3, lang='eng', desc='', text=[full_comment]))
                    audio.save()

                elif ext == '.flac':
                    audio = FLAC(fp)
                    if tags['Title']:   audio['title'] = tags['Title']
                    if tags['Album']:   audio['album'] = tags['Album']
                    if tags['Artist']:  audio['artist'] = tags['Artist']
                    if tags['Genre']:   audio['genre'] = tags['Genre']
                    if tags['Year']:    audio['date'] = tags['Year']
                    comment = tags.get('Comment', '')
                    creation = tags.get('Creation type', '')
                    if comment or creation:
                        audio['comment'] = '; '.join(filter(None, [comment, f"creation={creation}" if creation else '']))
                    audio.save()

                elif ext in ('.m4a', '.mp4'):
                    audio = MP4(fp)
                    if tags['Title']:   audio['\xa9nam'] = [tags['Title']]
                    if tags['Album']:   audio['\xa9alb'] = [tags['Album']]
                    if tags['Artist']:  audio['\xa9ART'] = [tags['Artist']]
                    if tags['Genre']:   audio['\xa9gen'] = [tags['Genre']]
                    if tags['Year']:    audio['\xa9day'] = [tags['Year']]
                    comment = tags.get('Comment', '')
                    creation = tags.get('Creation type', '')
                    if comment or creation:
                        audio['\xa9cmt'] = ['; '.join(filter(None, [comment, f"creation={creation}" if creation else '']))]
                    audio.save()

                elif ext == '.ogg':
                    audio = OggVorbis(fp)
                    if tags['Title']:   audio['title'] = [tags['Title']]
                    if tags['Album']:   audio['album'] = [tags['Album']]
                    if tags['Artist']:  audio['artist'] = [tags['Artist']]
                    if tags['Genre']:   audio['genre'] = [tags['Genre']]
                    if tags['Year']:    audio['date'] = [tags['Year']]
                    comment = tags.get('Comment', '')
                    creation = tags.get('Creation type', '')
                    if comment or creation:
                        audio['comment'] = ['; '.join(filter(None, [comment, f"creation={creation}" if creation else '']))]
                    audio.save()

                elif ext == '.wav':
                    audio = WAVE(fp)
                    if audio.tags is None:
                        audio.add_tags()
                    if tags['Title']:
                        audio.tags.add(TIT2(encoding=3, text=[tags['Title']]))
                    if tags['Album']:
                        audio.tags.add(TALB(encoding=3, text=[tags['Album']]))
                    if tags['Artist']:
                        audio.tags.add(TPE1(encoding=3, text=[tags['Artist']]))
                    if tags['Genre']:
                        audio.tags.add(TCON(encoding=3, text=[tags['Genre']]))
                    if tags['Year']:
                        audio.tags.add(TDRC(encoding=3, text=[tags['Year']]))
                    comment = tags.get('Comment', '')
                    creation = tags.get('Creation type', '')
                    full_comment = '; '.join(filter(None, [comment, f"creation={creation}" if creation else '']))
                    if full_comment:
                        audio.tags.add(COMM(encoding=3, lang='eng', desc='', text=[full_comment]))
                    audio.save()

                else:
                    mf = MutagenFile(fp, easy=True)
                    if mf is None:
                        self._log(f"SKIP {name}: unsupported format for tagging")
                        continue
                    if mf.tags is None:
                        mf.add_tags()
                    if tags['Title']:   mf['title'] = tags['Title']
                    if tags['Album']:   mf['album'] = tags['Album']
                    if tags['Artist']:  mf['artist'] = tags['Artist']
                    if tags['Genre']:   mf['genre'] = tags['Genre']
                    if tags['Year']:    mf['date'] = tags['Year']
                    mf.save()

                out_name = Path(fp).stem + '.tagged' + ext
                out_path = Path(fp).parent / out_name
                shutil.copy2(fp, out_path)
                self._log(f" tagged {name} -> {out_name}")
                done += 1
            except Exception as exc:
                self._log(f"ERROR {name}: {exc}")

        self._log(f"Imprint done: {done}/{len(files)} file(s). Audio copied verbatim.")

    # ── Convert ──

    def _convert(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        ffmpeg = which_ffmpeg()
        if not ffmpeg:
            self._log("ERROR: ffmpeg not found on PATH.")
            return

        fmt = simpledialog.askstring("Convert", "Target format (mp3, wav, flac, ogg, m4a, aac):",
                                     parent=self)
        if not fmt:
            return
        fmt = fmt.strip().lower().lstrip('.')

        codec_map = {
            'mp3': ['-codec:a', 'libmp3lame', '-b:a', '320k'],
            'wav': ['-codec:a', 'pcm_s16le'],
            'flac': ['-codec:a', 'flac'],
            'ogg': ['-codec:a', 'libvorbis', '-q:a', '8'],
            'm4a': ['-codec:a', 'aac', '-b:a', '256k'],
            'aac': ['-codec:a', 'aac', '-b:a', '256k'],
        }
        if fmt not in codec_map:
            self._log(f"Unsupported format: {fmt}")
            return

        done = 0
        for fp in files:
            name = Path(fp).name
            out = str(Path(fp).with_suffix(f'.{fmt}'))
            if out == fp:
                out = str(Path(fp).stem) + f'_converted.{fmt}'
                out = str(Path(fp).parent / out)
            args = [ffmpeg, '-y', '-i', str(fp)] + codec_map[fmt] + [out]
            code, _, err = run_ff(args)
            if code == 0 and os.path.exists(out) and os.path.getsize(out) > 0:
                self._log(f"Converted {name} -> {Path(out).name}")
                done += 1
            else:
                self._log(f"FAIL {name}: {err[:200]}")
        self._log(f"Conversion done: {done}/{len(files)}")

    # ── Waveform / Snip ──

    def _waveform(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        WaveformDialog(self, files[0])

    # ── Normalize ──

    def _normalize(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        ffmpeg = which_ffmpeg()
        if not ffmpeg:
            self._log("ERROR: ffmpeg not found.")
            return
        done = 0
        for fp in files:
            name = Path(fp).name
            ext = Path(fp).suffix
            out = str(Path(fp).parent / (Path(fp).stem + '.normalized' + ext))

            code, stdout, err = run_ff([
                ffmpeg, '-i', str(fp), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
                '-f', 'null', '-'
            ])
            if code != 0:
                self._log(f"FAIL analyze {name}: {err[:200]}")
                continue

            args = [ffmpeg, '-y', '-i', str(fp),
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                    out]
            code, _, err = run_ff(args)
            if code == 0 and os.path.exists(out) and os.path.getsize(out) > 0:
                self._log(f"Normalized {name} -> {Path(out).name}")
                done += 1
            else:
                self._log(f"FAIL {name}: {err[:200]}")
        self._log(f"Normalize done: {done}/{len(files)}")

    # ── Set cover ──

    def _set_cover(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return

        img_path = filedialog.askopenfilename(
            title="Select cover image",
            filetypes=[("Images", "*.jpg *.jpeg *.png *.bmp *.gif *.webp"), ("All", "*.*")]
        )
        if not img_path or not os.path.isfile(img_path):
            return

        with open(img_path, 'rb') as f:
            img_data = f.read()

        if len(img_data) == 0:
            self._log("ERROR: image file is empty.")
            return

        img_ext = Path(img_path).suffix.lower()
        if img_ext in ('.jpg', '.jpeg'):
            mime = 'image/jpeg'
            img_fmt = MP4Cover.FORMAT_JPEG
        elif img_ext == '.png':
            mime = 'image/png'
            img_fmt = MP4Cover.FORMAT_PNG
        else:
            mime = 'image/jpeg'
            img_fmt = MP4Cover.FORMAT_JPEG

        if not HAS_MUTAGEN:
            self._log("ERROR: mutagen not installed.")
            return

        done = 0
        errors = []
        for fp in files:
            name = Path(fp).name
            ext = Path(fp).suffix.lower()
            try:
                if ext == '.mp3':
                    try:
                        audio = MP3(fp, ID3=ID3)
                    except ID3NoHeaderError:
                        audio = MP3(fp)
                        audio.add_tags()
                    if audio.tags is None:
                        audio.add_tags()
                    audio.tags.delall('APIC')
                    audio.tags.add(APIC(
                        encoding=3,
                        mime=mime,
                        type=3,
                        desc='Cover',
                        data=img_data
                    ))
                    audio.save()
                    if os.path.getsize(fp) > 0:
                        self._log(f"Embedded cover into {name}")
                        done += 1
                    else:
                        errors.append(name)

                elif ext == '.flac':
                    audio = FLAC(fp)
                    audio.clear_pictures()
                    pic = Picture()
                    pic.type = 3
                    pic.mime = mime
                    pic.desc = 'Cover'
                    pic.data = img_data
                    if HAS_PIL:
                        im = Image.open(BytesIO(img_data))
                        pic.width, pic.height = im.size
                    audio.add_picture(pic)
                    audio.save()
                    if os.path.getsize(fp) > 0:
                        self._log(f"Embedded cover into {name}")
                        done += 1
                    else:
                        errors.append(name)

                elif ext in ('.m4a', '.mp4'):
                    audio = MP4(fp)
                    audio['covr'] = [MP4Cover(img_data, imageformat=img_fmt)]
                    audio.save()
                    if os.path.getsize(fp) > 0:
                        self._log(f"Embedded cover into {name}")
                        done += 1
                    else:
                        errors.append(name)

                elif ext == '.ogg':
                    audio = OggVorbis(fp)
                    import base64
                    pic = Picture()
                    pic.type = 3
                    pic.mime = mime
                    pic.desc = 'Cover'
                    pic.data = img_data
                    audio['metadata_block_picture'] = [base64.b64encode(pic.write()).decode('ascii')]
                    audio.save()
                    if os.path.getsize(fp) > 0:
                        self._log(f"Embedded cover into {name}")
                        done += 1
                    else:
                        errors.append(name)

                elif ext == '.wav':
                    ffmpeg = which_ffmpeg()
                    if not ffmpeg:
                        self._log(f"SKIP {name}: WAV cover requires ffmpeg")
                        continue
                    out = str(Path(fp).parent / (Path(fp).stem + '.cover.mp3'))
                    args = [ffmpeg, '-y', '-i', str(fp), '-i', img_path,
                            '-map', '0:a', '-map', '1:0',
                            '-codec:a', 'libmp3lame', '-b:a', '320k',
                            '-id3v2_version', '3',
                            '-metadata:s:v', 'title=Cover',
                            '-metadata:s:v', 'comment=Cover (front)',
                            out]
                    code, _, err = run_ff(args)
                    if code == 0 and os.path.exists(out) and os.path.getsize(out) > 0:
                        self._log(f"Created {Path(out).name} with cover (WAV→MP3, since WAV has no native cover support)")
                        done += 1
                    else:
                        self._log(f"SKIP {name}: set cover failed: {[err[:200]]}")
                        errors.append(name)

                else:
                    self._log(f"SKIP {name}: unsupported format for cover art ({ext})")
                    continue

            except Exception as exc:
                self._log(f"SKIP {name}: set cover failed: {[str(exc)]}")
                errors.append(name)

        self._log(f"Embedded cover into {done}/{len(files)} file(s).")
        if errors:
            self._log(f"Failed: {', '.join(errors)}")

    # ── Detectors ──

    def _detectors(self):
        files = self._selected_files()
        if not files:
            self._log("No files selected.")
            return
        ffprobe = which_ffprobe()
        for fp in files:
            name = Path(fp).name
            self._log(f"\nDetector scan: {name}")

            if ffprobe:
                code, out, _ = run_ff([ffprobe, '-v', 'quiet', '-print_format', 'json',
                                       '-show_format', '-show_streams', str(fp)])
                if code == 0:
                    try:
                        info = json.loads(out)
                        fmt = info.get('format', {})
                        self._log(f"  Format: {fmt.get('format_long_name', 'unknown')}")
                        self._log(f"  Duration: {fmt.get('duration', '?')}s")
                        self._log(f"  Bitrate: {fmt.get('bit_rate', '?')} bps")
                        for s in info.get('streams', []):
                            self._log(f"  Stream: {s.get('codec_name')} ({s.get('codec_type')})")
                        ftags = fmt.get('tags', {})
                        if ftags:
                            self._log("  Container tags:")
                            for k, v in ftags.items():
                                self._log(f"    {k}: {v}")
                    except Exception:
                        pass
            else:
                self._log("  (ffprobe not found — install ffmpeg for full detection)")

            if HAS_MUTAGEN:
                mf = MutagenFile(fp)
                if mf and mf.tags:
                    ai_keywords = ['suno', 'udio', 'ai', 'generated', 'elevenlabs',
                                   'openai', 'stable-audio', 'musicgen', 'riffusion',
                                   'soundverse', 'boomy']
                    for key, val in mf.tags.items():
                        val_str = str(val).lower()
                        for kw in ai_keywords:
                            if kw in val_str:
                                self._log(f"  ** AI provenance hint: '{kw}' found in tag '{key}': {val}")

    # ── Batch folder ──

    def _batch_folder(self):
        folder = filedialog.askdirectory(title="Select folder to batch-process")
        if not folder:
            return
        count = 0
        for fn in os.listdir(folder):
            fp = os.path.join(folder, fn)
            if os.path.isfile(fp) and Path(fp).suffix.lower() in AUDIO_EXTS:
                if fp not in self.files:
                    self.files.append(fp)
                    self.file_listbox.insert('end', Path(fp).name)
                    count += 1
        self._log(f"Added {count} file(s) from {folder}")

    # ── Get ffmpeg ──

    def _get_ffmpeg(self):
        ff = which_ffmpeg()
        fp = which_ffprobe()
        if ff:
            self._log(f"ffmpeg found: {ff}")
        else:
            self._log("ffmpeg NOT found on PATH.")
            self._log("Install:")
            self._log("  Windows: winget install ffmpeg  OR  choco install ffmpeg")
            self._log("  macOS:   brew install ffmpeg")
            self._log("  Linux:   sudo apt install ffmpeg  OR  sudo dnf install ffmpeg")
            self._log("  Manual:  https://ffmpeg.org/download.html")
        if fp:
            self._log(f"ffprobe found: {fp}")
        else:
            self._log("ffprobe NOT found.")

        c2 = shutil.which('c2patool')
        if c2:
            self._log(f"c2patool found: {c2}")
        else:
            self._log("c2patool not found (optional, for C2PA manifest inspection)")

        self._log(f"\nPython packages:")
        self._log(f"  mutagen:     {'OK' if HAS_MUTAGEN else 'MISSING — pip install mutagen'}")
        self._log(f"  numpy:       {'OK' if HAS_NUMPY else 'MISSING — pip install numpy'}")
        self._log(f"  Pillow:      {'OK' if HAS_PIL else 'MISSING — pip install Pillow'}")
        self._log(f"  tkinterdnd2: {'OK (drag-and-drop enabled)' if HAS_DND else 'MISSING — pip install tkinterdnd2 (for drag-and-drop)'}")


def main():
    app = App()
    app.mainloop()


if __name__ == '__main__':
    main()
