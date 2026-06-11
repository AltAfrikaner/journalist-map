#!/usr/bin/env python3
"""
ClipMusic — standalone music-video editor (Clipchamp-style, music-first).

V1 (MVP): import audio + media, see a multi-track timeline with waveform and
beat grid, choose a background + an audio-reactive visualiser + timed lyrics,
and EXPORT a real music-video MP4 — rendered locally with ffmpeg. Fully offline;
online "share" actions only open a browser (your file never auto-uploads).

Python stack per the build spec: PyQt5 + bundled ffmpeg (+ optional librosa for
beat detection). Packaged to a Windows .exe with PyInstaller.

    pip install PyQt5 numpy        (librosa optional, for beat detection)
    python clipmusic.py
"""
from __future__ import annotations

import os
import sys
import json
import time
import shutil
import struct
import subprocess
import tempfile
import webbrowser
from dataclasses import dataclass, field, replace

try:
    import numpy as np
    from PyQt5.QtCore import Qt, QThread, pyqtSignal, QRectF, QTimer, QUrl
    from PyQt5.QtGui import (QColor, QPainter, QPen, QBrush, QFont, QLinearGradient,
                             QPixmap, QPalette)
    from PyQt5.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QFileDialog, QComboBox, QListWidget, QListWidgetItem,
        QStackedWidget, QProgressBar, QMessageBox, QLineEdit, QPlainTextEdit,
        QScrollArea, QFrame, QSizePolicy, QGridLayout, QToolButton, QCheckBox,
        QSlider, QInputDialog)
except ImportError as exc:  # noqa: BLE001
    print(f"\n  Missing dependency: {exc}\n  pip install PyQt5 numpy\n")
    sys.exit(1)

try:  # audio playback for the preview transport (part of PyQt5, optional)
    from PyQt5.QtMultimedia import QMediaPlayer, QMediaContent
    _HAS_MEDIA = True
except Exception:  # noqa: BLE001
    _HAS_MEDIA = False


APP_NAME = "ClipMusic"
APP_VERSION = "1.0.0"

# ── palette (matches the prototype) ───────────────────────────────────────
DARK = "#0a0a0f"
PANEL = "#12121a"
SURFACE = "#1a1a2e"
BORDER = "#2a2a40"
ACCENT = "#00d4ff"
PURPLE = "#a855f7"
TEXT = "#e0e0e8"
DIM = "#8888a0"
GREEN = "#22c55e"
AMBER = "#f59e0b"
RED = "#ef4444"

STYLE = f"""
QWidget {{ background: {DARK}; color: {TEXT};
    font-family: 'Segoe UI','Inter',sans-serif; font-size: 12px; }}
QFrame#panel {{ background: {PANEL}; }}
QLabel#h1 {{ font-size: 15px; font-weight: 700; }}
QLabel#dim {{ color: {DIM}; }}
QPushButton {{ background: {SURFACE}; border: 1px solid {BORDER};
    border-radius: 6px; padding: 6px 12px; font-weight: 600; }}
QPushButton:hover {{ border-color: {ACCENT}; }}
QPushButton#accent {{ background: {ACCENT}; color: {DARK}; border: none; }}
QPushButton#accent:hover {{ background: #4de3ff; }}
QPushButton#purple {{ background: rgba(168,85,247,0.15); color: {PURPLE};
    border: 1px solid rgba(168,85,247,0.3); }}
QPushButton#tab {{ background: transparent; border: none; border-radius: 0;
    border-bottom: 2px solid transparent; color: {DIM}; padding: 8px 4px; font-weight: 600; }}
QPushButton#tab:checked {{ color: {ACCENT}; border-bottom: 2px solid {ACCENT}; }}
QComboBox, QLineEdit, QPlainTextEdit {{ background: {SURFACE};
    border: 1px solid {BORDER}; border-radius: 6px; padding: 5px 8px; }}
QComboBox::drop-down {{ border: none; width: 22px; }}
QComboBox QAbstractItemView {{ background: {PANEL}; border: 1px solid {BORDER};
    selection-background-color: {ACCENT}; selection-color: {DARK}; }}
QListWidget {{ background: {PANEL}; border: 1px solid {BORDER}; border-radius: 6px; }}
QListWidget::item {{ padding: 6px; border-radius: 4px; }}
QListWidget::item:selected {{ background: rgba(0,212,255,0.15); color: {ACCENT}; }}
QProgressBar {{ background: {SURFACE}; border: 1px solid {BORDER};
    border-radius: 4px; text-align: center; height: 18px; }}
QProgressBar::chunk {{ background: {ACCENT}; border-radius: 3px; }}
QScrollArea {{ border: none; }}
"""


# ═══════════════════════════════════════════════════════════════════════════
# ffmpeg engine
# ═══════════════════════════════════════════════════════════════════════════
_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def _user_dir() -> str:
    base = os.environ.get("LOCALAPPDATA") or os.path.join(
        os.path.expanduser("~"), ".local", "share")
    d = os.path.join(base, "ClipMusic")
    os.makedirs(d, exist_ok=True)
    return d


def _tool(*names):
    dirs = []
    if getattr(sys, "frozen", False):
        dirs.append(os.path.dirname(sys.executable))
    base = getattr(sys, "_MEIPASS", None)
    if base:
        dirs.append(base)
    dirs.append(os.path.dirname(os.path.abspath(__file__)))
    dirs.append(_user_dir())
    for d in dirs:
        for n in names:
            c = os.path.join(d, n)
            if os.path.isfile(c):
                return c
    for n in names:
        w = shutil.which(n)
        if w:
            return w
    return None


def ffmpeg_path():
    return _tool("ffmpeg.exe", "ffmpeg")


FFMPEG_URL = ("https://github.com/GyanD/codexffmpeg/releases/download/"
              "2026-06-04-git-c27a3b12e3/ffmpeg-2026-06-04-git-c27a3b12e3-essentials_build.zip")


def download_ffmpeg(progress=None) -> str:
    import urllib.request
    import zipfile
    dest = os.path.join(_user_dir(), "ffmpeg.exe")
    tmp = os.path.join(tempfile.gettempdir(), "clipmusic_ffmpeg.zip")

    def hook(b, bs, total):
        if progress and total > 0:
            progress(min(1.0, b * bs / total))
    urllib.request.urlretrieve(FFMPEG_URL, tmp, hook)
    with zipfile.ZipFile(tmp) as z:
        name = next(n for n in z.namelist() if n.lower().endswith("bin/ffmpeg.exe"))
        with z.open(name) as s, open(dest, "wb") as o:
            shutil.copyfileobj(s, o)
    try:
        os.remove(tmp)
    except OSError:
        pass
    return dest


def _run(args, timeout=3600):
    return subprocess.run([ffmpeg_path(), "-hide_banner", "-nostdin", *args],
                          capture_output=True, text=True, timeout=timeout,
                          creationflags=_NO_WINDOW)


def probe_duration(path: str) -> float:
    exe = ffmpeg_path()
    if not exe:
        return 0.0
    r = subprocess.run([exe, "-hide_banner", "-i", path], capture_output=True,
                       text=True, creationflags=_NO_WINDOW)
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr or "")
    if not m:
        return 0.0
    h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mn * 60 + s


def is_video(path: str) -> bool:
    exe = ffmpeg_path()
    if not exe:
        return path.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm"))
    r = subprocess.run([exe, "-hide_banner", "-i", path], capture_output=True,
                       text=True, creationflags=_NO_WINDOW)
    return "Video:" in (r.stderr or "")


def waveform_peaks(path: str, columns=900):
    """mono int16 peaks per column + duration."""
    import array
    exe = ffmpeg_path()
    if not exe:
        return [], 0.0
    rate = 8000
    r = subprocess.run([exe, "-hide_banner", "-nostdin", "-v", "quiet", "-i", path,
                        "-ac", "1", "-ar", str(rate), "-f", "s16le", "-"],
                       capture_output=True, creationflags=_NO_WINDOW)
    raw = r.stdout or b""
    sm = array.array("h")
    sm.frombytes(raw[: len(raw) // 2 * 2])
    n = len(sm)
    if n == 0:
        return [], 0.0
    dur = n / rate
    cols = max(1, min(columns, n))
    per = max(1, n // cols)
    peaks = [(min(sm[i:i + per]), max(sm[i:i + per]))
             for i in range(0, n, per) if sm[i:i + per]]
    return peaks, dur


def extract_frame(path: str, t: float, out: str, w=640) -> bool:
    r = _run(["-ss", f"{t:.3f}", "-i", path, "-frames:v", "1",
              "-vf", f"scale={w}:-2", "-y", out], timeout=30)
    return r.returncode == 0 and os.path.exists(out)


def detect_beats(path: str):
    """(bpm, [beat_times]). Uses librosa if available, else a steady fallback."""
    dur = probe_duration(path)
    try:
        import librosa
        y, sr = librosa.load(path, mono=True)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
        bpm = float(np.atleast_1d(tempo)[0])
        return round(bpm, 1), [float(b) for b in beats]
    except Exception:  # noqa: BLE001
        bpm = 120.0
        step = 60.0 / bpm
        n = int(dur / step) if dur else 0
        return bpm, [i * step for i in range(n)]


# ── visualiser presets (ffmpeg native, audio-reactive) ─────────────────────
VISUALISERS = {
    "Spectrum": "showspectrum=s={W}x{H}:mode=combined:color=intensity:scale=cbrt:fps={FPS}",
    "Bars (CQT)": "showcqt=s={W}x{H}:fps={FPS}:count=6:gamma=5",
    "Frequencies": "showfreqs=s={W}x{H}:mode=bar:ascale=log:colors=0x00d4ff|0xa855f7",
    "Waveform": "showwaves=s={W}x{H}:mode=cline:colors=0x00d4ff:scale=sqrt:draw=full",
    "None": "",
}

# ── one-click looks applied to the background/footage (ffmpeg vf) ───────────
EFFECTS = {
    "None": "",
    "Black & White": "hue=s=0",
    "Vintage": "curves=preset=vintage",
    "Sepia": "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    "Vignette": "vignette=PI/5",
    "Blur": "gblur=sigma=8",
    "Sharpen": "unsharp=5:5:1.2:5:5:0.0",
    "Chromatic": "rgbashift=rh=6:bh=-6",
    "Film Grain": "noise=alls=16:allf=t",
    "Warm": "colortemperature=temperature=8500",
    "Cool": "colortemperature=temperature=4500",
    "Invert": "negate",
    "Glow": "gblur=sigma=4,eq=brightness=0.04:saturation=1.25",
}

# crossfade styles used between multiple background clips (slideshow)
TRANSITIONS = ["fade", "fadeblack", "fadewhite", "dissolve", "wipeleft",
               "slideright", "circleopen", "smoothleft", "radial"]


def _font_arg():
    for p in (r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if os.path.isfile(p):
            return p
    return None


def _esc_drawtext(s: str) -> str:
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\u2019")


@dataclass
class RenderSpec:
    audio: str
    background: str | None
    visualiser: str
    width: int
    height: int
    fps: int
    crf: int = 20
    vcodec: str = "libx264"
    acodec: str = "aac"
    lyrics: list = field(default_factory=list)  # [(start, end, text)]
    audio_only: bool = False
    out_ext: str = "mp4"
    backgrounds: list = field(default_factory=list)  # multi-clip slideshow
    effect: str = "None"
    brightness: float = 0.0   # -0.5..0.5
    contrast: float = 1.0     # 0..2
    saturation: float = 1.0   # 0..3
    fade_in: float = 0.0
    fade_out: float = 0.0
    ken_burns: bool = False
    transition: str = "fade"
    title: str = ""
    title_pos: str = "center"
    title_size: int = 72
    hwaccel: str = "off"   # off | nvenc | qsv | amf | videotoolbox | auto
    seg_durations: list = field(default_factory=list)  # per-clip slideshow lengths
    low_memory: bool = False   # render clips to scratch then concat (low peak RAM)


def _venc_args(hw: str, crf: int) -> list:
    """Video-encoder args. CPU (libx264) is the safe default; HW is opt-in."""
    if hw == "nvenc":
        return ["-c:v", "h264_nvenc", "-preset", "p4", "-rc", "vbr", "-cq", str(crf), "-b:v", "0"]
    if hw == "qsv":
        return ["-c:v", "h264_qsv", "-global_quality", str(crf)]
    if hw == "amf":
        return ["-c:v", "h264_amf", "-rc", "cqp", "-qp_i", str(crf), "-qp_p", str(crf)]
    if hw == "videotoolbox":
        return ["-c:v", "h264_videotoolbox", "-q:v", "60"]
    return ["-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast"]


def build_render_cmd(spec: RenderSpec, out: str) -> list:
    W, H, FPS = spec.width, spec.height, spec.fps

    if spec.audio_only:
        if spec.out_ext == "mp3":
            return ["-i", spec.audio, "-c:a", "libmp3lame", "-b:a", "320k", "-y", out]
        return ["-i", spec.audio, "-c:a", "pcm_s16le", "-y", out]

    dur = probe_duration(spec.audio) or 10.0
    bgs = list(spec.backgrounds) if spec.backgrounds else (
        [spec.background] if spec.background else [])
    bgs = bgs[:8]
    inputs, filt = [], []

    def scale_crop():
        return (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
                f"crop={W}:{H},setsar=1")

    # ── background layer → [bg] ──
    if not bgs:
        inputs += ["-f", "lavfi", "-i", f"color=c=0x0a0a0f:s={W}x{H}:r={FPS}"]
        n_bg = 1
        filt.append("[0:v]format=rgba[bg]")
    elif len(bgs) == 1:
        p = bgs[0]
        if is_video(p):
            inputs += ["-stream_loop", "-1", "-t", f"{dur:.3f}", "-i", p]
        else:
            inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}", "-i", p]
        n_bg = 1
        if not is_video(p) and spec.ken_burns:
            big_w, big_h = int(W * 1.5), int(H * 1.5)
            filt.append(
                f"[0:v]scale={big_w}:{big_h}:force_original_aspect_ratio=increase,"
                f"crop={big_w}:{big_h},zoompan=z='min(zoom+0.0006,1.3)':"
                f"d={max(1, int(dur * FPS))}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"s={W}x{H}:fps={FPS},setsar=1,format=rgba[bg]")
        else:
            filt.append(f"[0:v]{scale_crop()},format=rgba[bg]")
    else:
        n = len(bgs)
        if spec.seg_durations and len(spec.seg_durations) == n:
            segdurs = [max(0.3, float(d)) for d in spec.seg_durations]
            total = sum(segdurs)
            if total < dur:                      # pad the last clip to fill the song
                segdurs[-1] += dur - total
        else:
            segdurs = [dur / n] * n
        xf = max(0.05, min(0.6, min(segdurs) / 3))
        for i, p in enumerate(bgs):
            t_in = segdurs[i] + xf
            if is_video(p):
                inputs += ["-stream_loop", "-1", "-t", f"{t_in:.3f}", "-i", p]
            else:
                inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{t_in:.3f}", "-i", p]
            filt.append(f"[{i}:v]{scale_crop()},fps={FPS},format=yuv420p,"
                        f"setpts=PTS-STARTPTS[s{i}]")
        n_bg = n
        trans = spec.transition if spec.transition in TRANSITIONS else "fade"
        prev, cum = "s0", 0.0
        for k in range(1, n):
            cum += segdurs[k - 1]
            off = max(0.05, cum - k * xf)
            lab = "bg" if k == n - 1 else f"x{k}"
            filt.append(f"[{prev}][s{k}]xfade=transition={trans}:duration={xf:.3f}:"
                        f"offset={off:.3f}[{lab}]")
            prev = lab

    inputs += ["-i", spec.audio]
    a_idx = n_bg  # audio is the input right after the background inputs

    # ── effect + colour grade ──
    post = []
    if EFFECTS.get(spec.effect):
        post.append(EFFECTS[spec.effect])
    if (abs(spec.brightness) > 1e-3 or abs(spec.contrast - 1) > 1e-3
            or abs(spec.saturation - 1) > 1e-3):
        post.append(f"eq=brightness={spec.brightness:.3f}:contrast={spec.contrast:.3f}:"
                    f"saturation={spec.saturation:.3f}")
    last = "bg"
    if post:
        filt.append(f"[bg]{','.join(post)}[bgp]")
        last = "bgp"

    # ── audio-reactive visualiser overlay ──
    vis = VISUALISERS.get(spec.visualiser, "")
    if vis:
        filt.append(f"[{a_idx}:a]{vis.format(W=W, H=H, FPS=FPS)},format=rgba,"
                    f"colorchannelmixer=aa=0.6[viz]")
        filt.append(f"[{last}][viz]overlay=0:0:format=auto[comp]")
        last = "comp"

    # ── title + timed lyrics (drawtext) ──
    font = _font_arg()
    ff = f"fontfile='{font}':" if font else ""
    draws = []
    if spec.title.strip():
        ypos = {"top": "h*0.10", "center": "(h-text_h)/2",
                "bottom": "h-(h*0.20)"}.get(spec.title_pos, "(h-text_h)/2")
        draws.append(f"drawtext={ff}text='{_esc_drawtext(spec.title)}':fontcolor=white:"
                     f"fontsize={spec.title_size}:box=1:boxcolor=0x000000B0:boxborderw=20:"
                     f"x=(w-text_w)/2:y={ypos}:enable='between(t,0,{min(5.0, dur):.2f})'")
    for s0, e0, txt in spec.lyrics:
        if not txt.strip():
            continue
        draws.append(f"drawtext={ff}text='{_esc_drawtext(txt)}':fontcolor=white:"
                     f"fontsize={max(24, H // 22)}:box=1:boxcolor=0x000000A0:boxborderw=14:"
                     f"x=(w-text_w)/2:y=h-(h/6):enable='between(t,{s0:.2f},{e0:.2f})'")
    for i, dt in enumerate(draws):
        filt.append(f"[{last}]{dt}[d{i}]")
        last = f"d{i}"

    # ── video fade + output format ──
    tail = []
    if spec.fade_in > 0:
        tail.append(f"fade=t=in:st=0:d={spec.fade_in:.2f}")
    if spec.fade_out > 0:
        tail.append(f"fade=t=out:st={max(0.0, dur - spec.fade_out):.2f}:d={spec.fade_out:.2f}")
    tail.append("format=yuv420p")
    filt.append(f"[{last}]{','.join(tail)}[outv]")

    # ── audio fade ──
    amap = f"{a_idx}:a"
    af = []
    if spec.fade_in > 0:
        af.append(f"afade=t=in:d={spec.fade_in:.2f}")
    if spec.fade_out > 0:
        af.append(f"afade=t=out:st={max(0.0, dur - spec.fade_out):.2f}:d={spec.fade_out:.2f}")
    if af:
        filt.append(f"[{a_idx}:a]{','.join(af)}[outa]")
        amap = "[outa]"

    return [*inputs, "-filter_complex", ";".join(filt),
            "-map", "[outv]", "-map", amap,
            *_venc_args(spec.hwaccel, spec.crf),
            "-c:a", spec.acodec, "-b:a", "256k", "-r", str(FPS), "-t", f"{dur:.3f}",
            "-max_muxing_queue_size", "1024", "-movflags", "+faststart", "-y", out]


class RenderWorker(QThread):
    progress = pyqtSignal(float)   # 0..1
    done = pyqtSignal(bool, str)   # ok, message/path

    def __init__(self, spec: RenderSpec, out: str, scratch: str = None):
        super().__init__()
        self.spec, self.out = spec, out
        self.scratch = scratch
        self._proc = None
        self._cancelled = False

    def cancel(self):
        self._cancelled = True
        try:
            if self._proc:
                self._proc.terminate()
        except Exception:  # noqa: BLE001
            pass

    def run(self):
        hw = self.spec.hwaccel
        # try the chosen encoder, then always fall back to CPU so a missing GPU
        # encoder never leaves the user without a video
        if hw == "auto":
            order = ["nvenc", "off"]
        elif hw == "off":
            order = ["off"]
        else:
            order = [hw, "off"]
        last = "render failed"
        for attempt in order:
            if self._cancelled:
                self.done.emit(False, "Cancelled.")
                return
            self.spec.hwaccel = attempt
            ok, msg = self._run_once()
            if ok:
                self.progress.emit(1.0)
                self.done.emit(True, msg)
                return
            if self._cancelled:
                self.done.emit(False, "Cancelled.")
                return
            last = msg
        self.done.emit(False, last)

    def _env(self):
        env = dict(os.environ)
        if self.scratch and os.path.isdir(self.scratch):
            env["TMPDIR"] = env["TEMP"] = env["TMP"] = self.scratch
        return env

    @staticmethod
    def _rm(p):
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError:
            pass

    def _ff_progress(self, cmd, dur, base, span):
        import re
        self._proc = subprocess.Popen(
            [ffmpeg_path(), "-hide_banner", "-nostdin", *cmd, "-progress", "pipe:1", "-nostats"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            creationflags=_NO_WINDOW, env=self._env())
        p = self._proc
        for line in p.stdout:
            m = re.match(r"out_time_ms=(\d+)", line.strip())
            if m:
                self.progress.emit(min(base + span,
                                       base + span * ((int(m.group(1)) / 1e6) / dur)))
        err = p.stderr.read() if p.stderr else ""
        p.wait()
        return p.returncode, err

    def _ff_simple(self, cmd):
        self._proc = subprocess.Popen(
            [ffmpeg_path(), "-hide_banner", "-nostdin", *cmd],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            creationflags=_NO_WINDOW, env=self._env())
        _o, err = self._proc.communicate()
        return self._proc.returncode, err

    def _run_once(self):
        bgs = self.spec.backgrounds
        # segment-then-concat keeps peak RAM low for many clips
        if (not self.spec.audio_only) and len(bgs) > 1 and (self.spec.low_memory or len(bgs) > 10):
            return self._run_segmented()
        return self._run_single()

    def _run_single(self):
        dur = probe_duration(self.spec.audio) or 1.0
        rc, err = self._ff_progress(build_render_cmd(self.spec, self.out), dur, 0.0, 0.99)
        if self._cancelled:
            self._rm(self.out)
            return False, "Cancelled."
        if rc == 0 and os.path.exists(self.out) and os.path.getsize(self.out) > 0:
            return True, self.out
        return False, (err.strip().splitlines() or ["render failed"])[-1]

    def _seg_vf(self, p, W, H, FPS, d, ken):
        if (not is_video(p)) and ken:
            bw, bh = int(W * 1.5), int(H * 1.5)
            return (f"scale={bw}:{bh}:force_original_aspect_ratio=increase,crop={bw}:{bh},"
                    f"zoompan=z='min(zoom+0.0006,1.3)':d={max(1, int(d * FPS))}:"
                    f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},setsar=1,format=yuv420p")
        return (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                f"setsar=1,fps={FPS},format=yuv420p")

    def _run_segmented(self):
        s = self.spec
        W, H, FPS = s.width, s.height, s.fps
        dur = probe_duration(s.audio) or 10.0
        bgs = list(s.backgrounds)
        n = len(bgs)
        if s.seg_durations and len(s.seg_durations) == n:
            segdurs = [max(0.3, float(d)) for d in s.seg_durations]
            tot = sum(segdurs)
            if tot < dur:
                segdurs[-1] += dur - tot
        else:
            segdurs = [dur / n] * n
        scratch = self.scratch if (self.scratch and os.path.isdir(self.scratch)) else tempfile.gettempdir()
        segdir = os.path.join(scratch, "_cm_segs")
        os.makedirs(segdir, exist_ok=True)
        seg_files = []
        for i, (p, d) in enumerate(zip(bgs, segdurs)):
            if self._cancelled:
                return False, "Cancelled."
            seg_out = os.path.join(segdir, f"seg{i:03d}.mp4")
            inp = (["-stream_loop", "-1", "-t", f"{d:.3f}", "-i", p] if is_video(p)
                   else ["-loop", "1", "-framerate", str(FPS), "-t", f"{d:.3f}", "-i", p])
            cmd = [*inp, "-vf", self._seg_vf(p, W, H, FPS, d, s.ken_burns),
                   "-an", "-r", str(FPS), "-t", f"{d:.3f}", "-c:v", "libx264",
                   "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-y", seg_out]
            rc, err = self._ff_simple(cmd)
            if rc != 0 or not os.path.exists(seg_out):
                return False, "segment render failed: " + (err.strip().splitlines() or [""])[-1]
            seg_files.append(seg_out)
            self.progress.emit(0.5 * (i + 1) / n)
        listf = os.path.join(segdir, "list.txt")
        with open(listf, "w", encoding="utf-8") as f:
            for sf in seg_files:
                f.write("file '%s'\n" % sf.replace("\\", "/").replace("'", "'\\''"))
        bgmp4 = os.path.join(segdir, "bg.mp4")
        rc, err = self._ff_simple(["-f", "concat", "-safe", "0", "-i", listf, "-c", "copy", "-y", bgmp4])
        if rc != 0 or not os.path.exists(bgmp4):
            rc, err = self._ff_simple(["-f", "concat", "-safe", "0", "-i", listf,
                                       "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
                                       "-pix_fmt", "yuv420p", "-y", bgmp4])
            if rc != 0:
                return False, "concat failed: " + (err.strip().splitlines() or [""])[-1]
        self.progress.emit(0.55)
        spec2 = replace(s, backgrounds=[bgmp4], seg_durations=[], ken_burns=False, low_memory=False)
        rc, err = self._ff_progress(build_render_cmd(spec2, self.out),
                                    probe_duration(s.audio) or 1.0, 0.55, 0.44)
        for sf in seg_files:
            self._rm(sf)
        self._rm(listf)
        self._rm(bgmp4)
        if self._cancelled:
            self._rm(self.out)
            return False, "Cancelled."
        if rc == 0 and os.path.exists(self.out) and os.path.getsize(self.out) > 0:
            return True, self.out
        return False, (err.strip().splitlines() or ["render failed"])[-1]


class StemWorker(QThread):
    """Run Demucs stem separation if it is installed (optional AI feature)."""
    done = pyqtSignal(bool, str, list)  # ok, message, [stem files]

    def __init__(self, audio: str):
        super().__init__()
        self.audio = audio

    def run(self):
        exe = shutil.which("demucs")
        cmd = [exe] if exe else [sys.executable, "-m", "demucs"]
        outdir = os.path.join(_user_dir(), "stems")
        os.makedirs(outdir, exist_ok=True)
        try:
            r = subprocess.run([*cmd, "--two-stems=vocals", "-o", outdir, self.audio],
                               capture_output=True, text=True, creationflags=_NO_WINDOW)
        except FileNotFoundError:
            self.done.emit(False, "Demucs is not installed (pip install demucs torch).", [])
            return
        if r.returncode != 0:
            tail = (r.stderr.strip().splitlines() or ["demucs failed"])[-1]
            self.done.emit(False, tail, [])
            return
        stem = os.path.splitext(os.path.basename(self.audio))[0]
        found = []
        for root, _d, files in os.walk(outdir):
            if stem in root:
                for f in files:
                    if f.endswith(".wav"):
                        found.append(os.path.join(root, f))
        if found:
            self.done.emit(True, "Stems created.", found)
        else:
            self.done.emit(False, "No stems produced.", [])


# ═══════════════════════════════════════════════════════════════════════════
# data model
# ═══════════════════════════════════════════════════════════════════════════
@dataclass
class Clip:
    source: str
    start: float
    duration: float
    label: str
    color: str
    kind: str  # video|audio|image|text|visualiser


@dataclass
class Track:
    name: str
    kind: str
    color: str
    clips: list = field(default_factory=list)
    muted: bool = False


@dataclass
class Project:
    tracks: list = field(default_factory=list)
    bpm: float = 120.0
    beats: list = field(default_factory=list)
    duration: float = 0.0


# ═══════════════════════════════════════════════════════════════════════════
# timeline widget (QPainter)
# ═══════════════════════════════════════════════════════════════════════════
class TimelineWidget(QWidget):
    playhead_moved = pyqtSignal(float)
    clip_selected = pyqtSignal(int, int)
    clips_changed = pyqtSignal()

    HEADER_W = 140
    RULER_H = 22
    ROW_H = 40
    EDITABLE = ("video",)

    def __init__(self, project: Project):
        super().__init__()
        self.project = project
        self.zoom = 60.0  # px/sec
        self.playhead = 0.0
        self.wave_cache = {}  # source -> peaks
        self.selected = None  # (track_idx, clip_idx)
        self._drag = None
        self.setMinimumHeight(180)
        self.setMouseTracking(True)

    def _row_at(self, y):
        if y < self.RULER_H:
            return -1
        r = (y - self.RULER_H) // self.ROW_H
        return r if 0 <= r < len(self.project.tracks) else -1

    def _clip_at(self, ti, ex):
        for ci, c in enumerate(self.project.tracks[ti].clips):
            x0, x1 = self._x(c.start), self._x(c.start + c.duration)
            if x0 - 2 <= ex <= x1 + 2:
                return ci, x0, x1
        return None

    def set_zoom(self, z):
        self.zoom = max(10.0, min(400.0, z))
        self._resize()
        self.update()

    def _resize(self):
        w = int(self.HEADER_W + self.project.duration * self.zoom + 40)
        self.setMinimumWidth(max(w, 600))

    def _x(self, t):
        return self.HEADER_W + t * self.zoom

    def _t(self, x):
        return max(0.0, (x - self.HEADER_W) / self.zoom)

    def mousePressEvent(self, ev):
        ex, ey = ev.x(), ev.y()
        ti = self._row_at(ey)
        if ti >= 0 and ex > self.HEADER_W:
            hit = self._clip_at(ti, ex)
            if hit:
                ci, x0, x1 = hit
                self.selected = (ti, ci)
                self.clip_selected.emit(ti, ci)
                if self.project.tracks[ti].kind in self.EDITABLE:
                    c = self.project.tracks[ti].clips[ci]
                    mode = "trim_l" if ex - x0 < 7 else ("trim_r" if x1 - ex < 7 else "move")
                    self._drag = (ti, ci, mode, ex, c.start, c.duration)
                self.update()
                return
        if ex > self.HEADER_W:
            self.playhead = min(self.project.duration, self._t(ex))
            self.playhead_moved.emit(self.playhead)
            self.update()

    def mouseMoveEvent(self, ev):
        if self._drag and (ev.buttons() & Qt.LeftButton):
            ti, ci, mode, grabx, s0, d0 = self._drag
            c = self.project.tracks[ti].clips[ci]
            dx = (ev.x() - grabx) / self.zoom
            if mode == "move":
                c.start = max(0.0, s0 + dx)
            elif mode == "trim_l":
                ns = max(0.0, s0 + dx)
                nd = d0 - (ns - s0)
                if nd >= 0.1:
                    c.start, c.duration = ns, nd
            elif mode == "trim_r":
                c.duration = max(0.1, d0 + dx)
            self.update()
            return
        if (ev.buttons() & Qt.LeftButton) and ev.x() > self.HEADER_W:
            self.playhead = min(self.project.duration, self._t(ev.x()))
            self.playhead_moved.emit(self.playhead)
            self.update()

    def mouseReleaseEvent(self, _ev):
        if self._drag:
            self._drag = None
            self.clips_changed.emit()

    def paintEvent(self, _ev):
        qp = QPainter(self)
        qp.setRenderHint(QPainter.Antialiasing)
        W, H = self.width(), self.height()
        qp.fillRect(0, 0, W, H, QColor(PANEL))

        # ruler
        qp.fillRect(0, 0, W, self.RULER_H, QColor(SURFACE))
        qp.setPen(QPen(QColor(DIM)))
        qp.setFont(QFont("Consolas", 7))
        sec = 0
        while self._x(sec) < W:
            x = int(self._x(sec))
            qp.drawLine(x, self.RULER_H - 6, x, self.RULER_H)
            qp.drawText(x + 2, 10, f"{sec // 60}:{sec % 60:02d}")
            sec += 1

        # beat markers
        if self.project.beats:
            for i, b in enumerate(self.project.beats):
                x = int(self._x(b))
                if x < self.HEADER_W or x > W:
                    continue
                down = (i % 4 == 0)
                qp.setPen(QPen(QColor(245, 158, 11, 90 if down else 35), 1))
                qp.drawLine(x, self.RULER_H, x, H)

        # tracks
        y = self.RULER_H
        for ti, tr in enumerate(self.project.tracks):
            qp.fillRect(0, y, self.HEADER_W, self.ROW_H, QColor(PANEL))
            qp.fillRect(0, y, 4, self.ROW_H, QColor(tr.color))
            qp.setPen(QPen(QColor(TEXT)))
            qp.setFont(QFont("Segoe UI", 8))
            qp.drawText(12, y + self.ROW_H // 2 + 4, tr.name)
            qp.setPen(QPen(QColor(BORDER)))
            qp.drawLine(0, y + self.ROW_H, W, y + self.ROW_H)
            for ci, clip in enumerate(tr.clips):
                cx, cw = int(self._x(clip.start)), int(clip.duration * self.zoom)
                rect = QRectF(cx, y + 4, max(cw, 6), self.ROW_H - 8)
                col = QColor(clip.color)
                sel = self.selected == (ti, ci)
                qp.setBrush(QBrush(QColor(col.red(), col.green(), col.blue(),
                                          110 if sel else 60)))
                qp.setPen(QPen(QColor("#ffffff") if sel else col, 2 if sel else 1))
                qp.drawRoundedRect(rect, 4, 4)
                if tr.kind == "audio":
                    self._draw_wave(qp, clip, rect)
                if tr.kind != "audio":
                    qp.setPen(QPen(QColor("#ffffffcc")))
                    qp.setFont(QFont("Segoe UI", 7))
                    qp.drawText(rect.adjusted(6, 0, -4, 0), Qt.AlignVCenter,
                                clip.label[:40])
            y += self.ROW_H

        # playhead
        px = int(self._x(self.playhead))
        qp.setPen(QPen(QColor(ACCENT), 1))
        qp.drawLine(px, 0, px, H)
        qp.setBrush(QBrush(QColor(ACCENT)))
        qp.drawPolygon(*[self._pt(px - 4, 0), self._pt(px + 4, 0), self._pt(px, 6)])
        qp.end()

    def _pt(self, x, y):
        from PyQt5.QtCore import QPoint
        return QPoint(int(x), int(y))

    def _draw_wave(self, qp, clip, rect):
        peaks = self.wave_cache.get(clip.source)
        if not peaks:
            return
        n = len(peaks)
        mid = rect.y() + rect.height() / 2
        amp = rect.height() / 2 - 2
        col = QColor(clip.color)
        qp.setPen(QPen(QColor(col.red(), col.green(), col.blue(), 200), 1))
        cols = int(rect.width())
        for i in range(cols):
            pk = peaks[int(i / max(cols, 1) * n)] if n else (0, 0)
            x = rect.x() + i
            qp.drawLine(int(x), int(mid - pk[1] / 32768 * amp),
                        int(x), int(mid - pk[0] / 32768 * amp))


# ═══════════════════════════════════════════════════════════════════════════
# main window
# ═══════════════════════════════════════════════════════════════════════════
EXPORT_PRESETS = [
    ("1080p MP4 (YouTube)", 1920, 1080, 30, "mp4", False),
    ("4K MP4", 3840, 2160, 30, "mp4", False),
    ("TikTok / Reels (Vertical)", 1080, 1920, 30, "mp4", False),
    ("Square (1:1)", 1080, 1080, 30, "mp4", False),
    ("LinkedIn Landscape", 1920, 1080, 30, "mp4", False),
    ("Audio only — MP3", 0, 0, 0, "mp3", True),
    ("Audio only — WAV", 0, 0, 0, "wav", True),
]

# "Save to your computer" is always first; online destinations are V1 helpers
# (render locally, then open the platform — never auto-upload).
DESTINATIONS = [
    {"id": "computer", "name": "Save to your computer", "color": GREEN, "net": False,
     "url": None, "subtext": "Save the rendered MP4 to a folder on your machine."},
    {"id": "gdrive", "name": "Save to Google Drive", "color": "#4285F4", "net": True,
     "url": "https://drive.google.com", "subtext": "Upload your exported video to your Drive account.",
     "msg": "Your video is ready. Google Drive will open in your browser. "
            "Drag the exported file into Drive."},
    {"id": "youtube", "name": "Upload to YouTube", "color": "#ff0000", "net": True,
     "url": "https://www.youtube.com/upload", "subtext": "Export your music video and upload it to your channel.",
     "msg": "Your video is ready. YouTube Studio will open in your browser. "
            "Upload the exported file from the folder shown."},
    {"id": "tiktok", "name": "Send to TikTok", "color": "#00f2ea", "net": True,
     "url": "https://www.tiktok.com/upload", "subtext": "Export a vertical version for TikTok.",
     "msg": "Your vertical video is ready. TikTok will open in your browser. "
            "Upload the exported file manually."},
    {"id": "dropbox", "name": "Save to Dropbox", "color": "#0061FF", "net": True,
     "url": "https://www.dropbox.com/home", "subtext": "Upload your exported music video to Dropbox.",
     "msg": "Your video is ready. Dropbox will open in your browser. "
            "Upload the exported file manually."},
    {"id": "linkedin", "name": "Share to LinkedIn", "color": "#0A66C2", "net": True,
     "url": "https://www.linkedin.com/feed/", "subtext": "Open LinkedIn and use your exported video.",
     "msg": "Your video is ready. LinkedIn will open in your browser. "
            "Add the exported file to your post."},
]


class ClipMusic(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{APP_NAME}  v{APP_VERSION}")
        self.resize(1180, 760)
        self.setStyleSheet(STYLE)
        self.project = Project(tracks=[
            Track("Video 1", "video", "#3b82f6"),
            Track("Master Audio", "audio", ACCENT),
            Track("Visualiser", "visualiser", AMBER),
            Track("Lyrics", "text", GREEN),
        ])
        self.audio_path = None
        self.audio_paths = []
        self.bg_path = None
        self.bg_paths = []
        self.last_render = None
        cfg = self._load_config()
        self.scratch_dir = cfg.get("scratch_dir") or os.path.join(
            tempfile.gettempdir(), "clipmusic_scratch")
        try:
            os.makedirs(self.scratch_dir, exist_ok=True)
        except OSError:
            self.scratch_dir = os.path.join(tempfile.gettempdir(), "clipmusic_scratch")
            os.makedirs(self.scratch_dir, exist_ok=True)
        self.low_memory = bool(cfg.get("low_memory", False))
        self._enc_idx = int(cfg.get("encoder_index", 0))
        self.worker = None
        self.player = QMediaPlayer() if _HAS_MEDIA else None
        if self.player:
            self.player.positionChanged.connect(self._on_play_pos)
            self.player.stateChanged.connect(self._on_play_state)
        self._media_loaded = None
        self._pv_t = -1
        self.play_timer = QTimer(self)
        self.play_timer.timeout.connect(self._tick)
        self.setAcceptDrops(True)
        self._build()
        self.timeline.clips_changed.connect(self._on_clips_changed)
        self.timeline.clip_selected.connect(self._on_clip_selected)
        self._refresh_timeline()

    # ---- layout ----
    def _build(self):
        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)
        self.stack.addWidget(self._editor())
        self.stack.addWidget(self._export_view())

    def _toolbar(self):
        bar = QFrame()
        bar.setObjectName("panel")
        bar.setFixedHeight(46)
        lay = QHBoxLayout(bar)
        lay.setContentsMargins(12, 6, 12, 6)
        logo = QLabel("◆ ClipMusic")
        logo.setObjectName("h1")
        logo.setStyleSheet(f"color:{ACCENT};")
        lay.addWidget(logo)
        lay.addWidget(QLabel("Music-video editor — local & offline", objectName="dim"))
        lay.addStretch()
        st = QPushButton("⚙  Settings")
        st.clicked.connect(self._open_settings)
        lay.addWidget(st)
        exp = QPushButton("Export  ▸")
        exp.setObjectName("accent")
        exp.clicked.connect(self._goto_export)
        lay.addWidget(exp)
        return bar

    def _editor(self):
        w = QWidget()
        root = QVBoxLayout(w)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)
        root.addWidget(self._toolbar())

        mid = QHBoxLayout()
        mid.setContentsMargins(8, 8, 8, 4)
        mid.setSpacing(8)
        mid.addWidget(self._media_panel(), 0)
        mid.addWidget(self._preview_panel(), 1)
        mid.addWidget(self._props_panel(), 0)
        root.addLayout(mid, 1)

        # timeline
        tl_wrap = QFrame()
        tl_wrap.setObjectName("panel")
        tl_wrap.setFixedHeight(240)
        tlv = QVBoxLayout(tl_wrap)
        tlv.setContentsMargins(8, 4, 8, 8)
        bar2 = QHBoxLayout()
        for txt, fn in (("Split", self._split_clip), ("Duplicate", self._dup_clip),
                        ("Delete", self._del_clip)):
            b = QPushButton(txt)
            b.clicked.connect(fn)
            bar2.addWidget(b)
        bar2.addWidget(QLabel(" ", objectName="dim"))
        ab = QPushButton("Analyze Beat")
        ab.clicked.connect(self._analyze_beat)
        sb = QPushButton("Set BPM")
        sb.clicked.connect(self._set_bpm)
        ctb = QPushButton("⚡ Cut to Beat")
        ctb.setStyleSheet(f"color:{AMBER}; font-weight:700;")
        ctb.clicked.connect(self._cut_to_beat)
        bar2.addWidget(ab)
        bar2.addWidget(sb)
        bar2.addWidget(ctb)
        bar2.addStretch()
        zo = QPushButton("–")
        zo.clicked.connect(lambda: self.timeline.set_zoom(self.timeline.zoom - 15))
        zi = QPushButton("+")
        zi.clicked.connect(lambda: self.timeline.set_zoom(self.timeline.zoom + 15))
        bar2.addWidget(QLabel("Zoom", objectName="dim"))
        bar2.addWidget(zo)
        bar2.addWidget(zi)
        tlv.addLayout(bar2)
        self.timeline = TimelineWidget(self.project)
        self.timeline.playhead_moved.connect(self._on_playhead)
        sc = QScrollArea()
        sc.setWidgetResizable(True)
        sc.setWidget(self.timeline)
        sc.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        tlv.addWidget(sc)
        root.addWidget(tl_wrap)
        return w

    def _media_panel(self):
        f = QFrame()
        f.setObjectName("panel")
        f.setFixedWidth(210)
        v = QVBoxLayout(f)
        v.setContentsMargins(8, 8, 8, 8)
        v.addWidget(QLabel("Media library", objectName="h1"))
        self.media_list = QListWidget()
        v.addWidget(self.media_list, 1)
        imp = QPushButton("＋ Import media")
        imp.clicked.connect(self._import_media)
        v.addWidget(imp)
        bg = QPushButton("Add background / clip")
        bg.clicked.connect(self._set_background)
        v.addWidget(bg)
        clr = QPushButton("Clear backgrounds")
        clr.clicked.connect(self._clear_backgrounds)
        v.addWidget(clr)
        v.addWidget(QLabel("Add 2+ images/clips for a crossfaded slideshow.",
                           objectName="dim"))
        stem = QPushButton("✦ AI Stem Split (Demucs)")
        stem.setObjectName("purple")
        stem.clicked.connect(self._stem_split)
        v.addWidget(stem)
        return f

    def _preview_panel(self):
        f = QFrame()
        v = QVBoxLayout(f)
        v.setContentsMargins(0, 0, 0, 0)
        top = QHBoxLayout()
        top.addWidget(QLabel("Preview", objectName="dim"))
        top.addStretch()
        self.time_lbl = QLabel("0:00.00 / 0:00.00")
        self.time_lbl.setStyleSheet(f"color:{ACCENT}; font-family:Consolas;")
        top.addWidget(self.time_lbl)
        v.addLayout(top)
        self.preview = QLabel("Import audio + a background, pick a visualiser, then Export.")
        self.preview.setAlignment(Qt.AlignCenter)
        self.preview.setStyleSheet(
            f"background:#0f0f1a; border:1px solid {BORDER}; border-radius:8px; color:{DIM};")
        self.preview.setMinimumHeight(280)
        self.preview.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        v.addWidget(self.preview, 1)
        tp = QHBoxLayout()
        tp.addStretch()
        self.play_btn = QPushButton("▶  Play")
        self.play_btn.setObjectName("accent")
        self.play_btn.clicked.connect(self._toggle_play)
        stop_btn = QPushButton("⏹  Stop")
        stop_btn.clicked.connect(self._stop_play)
        tp.addWidget(self.play_btn)
        tp.addWidget(stop_btn)
        tp.addStretch()
        if not _HAS_MEDIA:
            tp.addWidget(QLabel("(silent playhead — QtMultimedia not available)", objectName="dim"))
        v.addLayout(tp)
        return f

    def _slider(self, layout, label, lo, hi, val, fmt):
        head = QHBoxLayout()
        head.addWidget(QLabel(label, objectName="dim"))
        head.addStretch()
        vlbl = QLabel(fmt(val))
        vlbl.setStyleSheet(f"color:{ACCENT};")
        head.addWidget(vlbl)
        layout.addLayout(head)
        s = QSlider(Qt.Horizontal)
        s.setRange(lo, hi)
        s.setValue(val)
        s.valueChanged.connect(lambda v: vlbl.setText(fmt(v)))
        layout.addWidget(s)
        return s

    def _props_panel(self):
        f = QFrame()
        f.setObjectName("panel")
        f.setFixedWidth(258)
        outer = QVBoxLayout(f)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        content = QWidget()
        v = QVBoxLayout(content)
        v.setContentsMargins(10, 10, 10, 10)
        v.setSpacing(6)

        v.addWidget(QLabel("Visualiser", objectName="h1"))
        self.vis_combo = QComboBox()
        self.vis_combo.addItems(list(VISUALISERS.keys()))
        self.vis_combo.setCurrentText("Bars (CQT)")
        self.vis_combo.currentTextChanged.connect(lambda _: self._refresh_timeline())
        v.addWidget(self.vis_combo)

        v.addWidget(QLabel("Effect (look)", objectName="h1"))
        self.fx_combo = QComboBox()
        self.fx_combo.addItems(list(EFFECTS.keys()))
        v.addWidget(self.fx_combo)
        self.kb_check = QCheckBox("Ken Burns zoom (still images)")
        v.addWidget(self.kb_check)

        v.addWidget(QLabel("Adjust colours", objectName="h1"))
        self.bri = self._slider(v, "Brightness", -50, 50, 0, lambda x: f"{x/100:+.2f}")
        self.con = self._slider(v, "Contrast", 0, 200, 100, lambda x: f"{x/100:.2f}")
        self.sat = self._slider(v, "Saturation", 0, 300, 100, lambda x: f"{x/100:.2f}")

        v.addWidget(QLabel("Fade", objectName="h1"))
        self.fin = self._slider(v, "Fade in", 0, 50, 0, lambda x: f"{x/10:.1f}s")
        self.fout = self._slider(v, "Fade out", 0, 50, 0, lambda x: f"{x/10:.1f}s")

        v.addWidget(QLabel("Transition (slideshow)", objectName="h1"))
        self.trans_combo = QComboBox()
        self.trans_combo.addItems(TRANSITIONS)
        v.addWidget(self.trans_combo)

        v.addWidget(QLabel("Title", objectName="h1"))
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText("Big title (shown first 5s)")
        v.addWidget(self.title_edit)
        trow = QHBoxLayout()
        self.titlepos = QComboBox()
        self.titlepos.addItems(["Top", "Center", "Bottom"])
        self.titlepos.setCurrentText("Center")
        trow.addWidget(self.titlepos)
        v.addLayout(trow)
        self.tsize = self._slider(v, "Title size", 24, 140, 72, lambda x: f"{x}px")

        v.addWidget(QLabel("Lyrics / text", objectName="h1"))
        v.addWidget(QLabel("one line per cue:  start  end  text", objectName="dim"))
        self.lyrics_edit = QPlainTextEdit()
        self.lyrics_edit.setPlaceholderText("0  4  My first lyric line\n4  8  Second line\n8  14  Chorus")
        self.lyrics_edit.setMinimumHeight(90)
        v.addWidget(self.lyrics_edit)

        self.bpm_lbl = QLabel("BPM: —")
        self.bpm_lbl.setStyleSheet(f"color:{AMBER};")
        v.addWidget(self.bpm_lbl)
        v.addStretch()
        scroll.setWidget(content)
        outer.addWidget(scroll)
        return f

    # ---- media / import ----
    def _ensure_ffmpeg(self):
        if ffmpeg_path():
            return True
        if QMessageBox.question(self, "Install ffmpeg",
                                "ClipMusic needs ffmpeg (one-time ~100 MB download). Get it now?"
                                ) != QMessageBox.Yes:
            return False
        dlg = QProgressBar()
        dlg.setWindowTitle("Downloading ffmpeg…")
        dlg.setMaximum(100)
        dlg.resize(360, 30)
        dlg.show()
        try:
            download_ffmpeg(lambda fr: (dlg.setValue(int(fr * 100)), QApplication.processEvents()))
        except Exception as exc:  # noqa: BLE001
            dlg.close()
            QMessageBox.critical(self, "ffmpeg", str(exc))
            return False
        dlg.close()
        return True

    def _add_media_item(self, path):
        QListWidgetItem(os.path.basename(path), self.media_list).setData(Qt.UserRole, path)

    def _import_media(self):
        if not self._ensure_ffmpeg():
            return
        fs, _ = QFileDialog.getOpenFileNames(
            self, "Import media", "",
            "Media (*.mp3 *.wav *.flac *.m4a *.ogg *.aac *.mp4 *.mov *.mkv *.jpg *.jpeg *.png)")
        for f in fs:
            self._add_media_item(f)
            self._route_media(f)

    def _route_media(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in (".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"):
            self._load_audio(path)
        elif ext in (".mp4", ".mov", ".mkv", ".avi", ".webm", ".jpg", ".jpeg", ".png"):
            self._apply_background(path)

    def _load_audio(self, path):
        if path not in self.audio_paths:
            self.audio_paths.append(path)
        self.audio_path = self.audio_paths[0]
        atrack = next(t for t in self.project.tracks if t.kind == "audio")
        clips, t = [], 0.0
        for p in self.audio_paths:
            d = probe_duration(p)
            clips.append(Clip(p, t, d, os.path.basename(p), ACCENT, "audio"))
            if p not in self.timeline.wave_cache:
                self.timeline.wave_cache[p] = waveform_peaks(p, 1000)[0]
            t += d
        atrack.clips = clips
        self.project.duration = max(self.project.duration, t)
        # re-flow backgrounds across the new total duration
        if self.bg_paths:
            self._apply_background(self.bg_paths[-1])
        bpm, beats = detect_beats(self.audio_paths[0])
        self.project.bpm, self.project.beats = bpm, beats
        self.bpm_lbl.setText(f"BPM: {bpm:g}   ·   {len(beats)} beats  ·  {len(self.audio_paths)} track(s)")
        self._refresh_timeline()
        self._update_time()

    def _resolve_audio(self):
        """Return one audio path; concatenate multiple songs into the scratch dir."""
        if len(self.audio_paths) <= 1:
            return self.audio_path
        out = os.path.join(self.scratch_dir, "master_audio.wav")
        inputs = []
        for p in self.audio_paths:
            inputs += ["-i", p]
        n = len(self.audio_paths)
        fc = "".join(f"[{i}:a]" for i in range(n)) + f"concat=n={n}:v=0:a=1[a]"
        subprocess.run([ffmpeg_path(), "-hide_banner", "-nostdin", *inputs,
                        "-filter_complex", fc, "-map", "[a]", "-y", out],
                       capture_output=True, creationflags=_NO_WINDOW)
        return out if os.path.exists(out) else self.audio_path

    def _set_background(self):
        if not self._ensure_ffmpeg():
            return
        fs, _ = QFileDialog.getOpenFileNames(
            self, "Add background(s) / clip(s)", "",
            "Image/Video (*.jpg *.jpeg *.png *.mp4 *.mov *.mkv *.webm)")
        for f in fs:
            self._add_media_item(f)
            self._apply_background(f)

    def _apply_background(self, path):
        if path not in self.bg_paths:
            self.bg_paths.append(path)
        self.bg_path = self.bg_paths[0]
        vtrack = next(t for t in self.project.tracks if t.kind == "video")
        n = len(self.bg_paths)
        total = self.project.duration or probe_duration(path) or 10
        seg = total / n
        vtrack.clips = [Clip(p, i * seg, seg, os.path.basename(p), "#3b82f6",
                             "video" if is_video(p) else "image")
                        for i, p in enumerate(self.bg_paths)]
        self._refresh_timeline()
        self._update_preview()

    def _clear_backgrounds(self):
        self.bg_paths = []
        self.bg_path = None
        vtrack = next(t for t in self.project.tracks if t.kind == "video")
        vtrack.clips = []
        self._refresh_timeline()
        self.preview.setText("Backgrounds cleared. Add images/clips for the video layer.")

    def _stem_split(self):
        if not self.audio_path:
            QMessageBox.information(self, "AI Stem Split", "Import a music track first.")
            return
        if not shutil.which("demucs"):
            QMessageBox.information(
                self, "AI Stem Split",
                "Demucs (local AI stem separation) isn't installed.\n\n"
                "Install it once:\n    pip install demucs torch torchaudio\n\n"
                "Then re-run. Stems are separated 100% locally — nothing is uploaded.")
            return
        self.statusBar().showMessage("Separating stems with Demucs (local, may take a while)…")
        self._stem_worker = StemWorker(self.audio_path)
        self._stem_worker.done.connect(self._stems_done)
        self._stem_worker.start()

    def _stems_done(self, ok, msg, files):
        if not ok:
            self.statusBar().showMessage("Stem split: " + msg, 6000)
            QMessageBox.information(self, "AI Stem Split", msg)
            return
        colors = {"vocals": PURPLE, "no_vocals": "#06b6d4", "drums": "#f97316",
                  "bass": GREEN, "other": "#64748b"}
        for fpath in files:
            nm = os.path.splitext(os.path.basename(fpath))[0]
            col = colors.get(nm, PURPLE)
            d = probe_duration(fpath)
            self.timeline.wave_cache[fpath] = waveform_peaks(fpath, 1200)[0]
            self.project.tracks.append(Track(
                f"Stem: {nm}", "audio", col,
                clips=[Clip(fpath, 0, d, os.path.basename(fpath), col, "audio")]))
            self._add_media_item(fpath)
        self._refresh_timeline()
        self.statusBar().showMessage(f"Added {len(files)} stems as tracks.", 6000)

    # ---- drag & drop ----
    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()

    def dropEvent(self, e):
        for url in e.mimeData().urls():
            p = url.toLocalFile()
            if p and os.path.isfile(p):
                self._add_media_item(p)
                self._route_media(p)

    # ---- playhead / preview ----
    def _refresh_timeline(self):
        # visualiser + lyrics summary clips
        vt = next(t for t in self.project.tracks if t.kind == "visualiser")
        vt.clips = ([Clip("", 0, self.project.duration, self.vis_combo.currentText()
                          if hasattr(self, "vis_combo") else "Bars", AMBER, "visualiser")]
                    if self.project.duration else [])
        self.timeline._resize()
        self.timeline.update()

    def _on_playhead(self, t):
        self._update_time()
        self._update_preview()
        if self.player and self.player.state() == QMediaPlayer.PlayingState:
            self.player.setPosition(int(t * 1000))

    def _update_time(self):
        def f(s):
            return f"{int(s // 60)}:{int(s % 60):02d}.{int((s % 1) * 100):02d}"
        self.time_lbl.setText(f"{f(self.timeline.playhead)} / {f(self.project.duration)}")

    def _update_preview(self):
        if self.bg_path and ffmpeg_path():
            tmp = os.path.join(self.scratch_dir, "_preview.jpg")
            if extract_frame(self.bg_path, self.timeline.playhead, tmp, 720):
                pm = QPixmap(tmp)
                if not pm.isNull():
                    self.preview.setPixmap(pm.scaled(
                        self.preview.width(), self.preview.height(),
                        Qt.KeepAspectRatio, Qt.SmoothTransformation))
                    return
        if self.audio_path:
            self.preview.setText("♪  Audio loaded — the visualiser renders on Export.\n"
                                 "Add a background image/video for a preview frame.")

    # ---- lyrics parse ----
    def _parse_lyrics(self):
        out = []
        for line in self.lyrics_edit.toPlainText().splitlines():
            parts = line.strip().split(None, 2)
            if len(parts) == 3:
                try:
                    out.append((float(parts[0]), float(parts[1]), parts[2]))
                except ValueError:
                    pass
        return out

    # ── timeline clips: source of truth for the rendered video layer ──
    def _video_track(self):
        return next(t for t in self.project.tracks if t.kind == "video")

    def _video_segments(self):
        clips = sorted(self._video_track().clips, key=lambda c: c.start)
        return [(c.source, c.duration) for c in clips]

    def _selected_clip(self):
        sel = self.timeline.selected
        if not sel:
            return None
        ti, ci = sel
        if ti < len(self.project.tracks) and ci < len(self.project.tracks[ti].clips):
            return self.project.tracks[ti], ci
        return None

    def _on_clip_selected(self, ti, ci):
        try:
            c = self.project.tracks[ti].clips[ci]
            self.statusBar().showMessage(f"Selected: {c.label}  ·  {c.duration:.2f}s", 4000)
        except Exception:  # noqa: BLE001
            pass

    def _on_clips_changed(self):
        vt = self._video_track()
        if vt.clips:
            self.bg_paths = [c.source for c in sorted(vt.clips, key=lambda c: c.start)]
            self.bg_path = self.bg_paths[0]
        self._update_preview()

    def _split_clip(self):
        s = self._selected_clip()
        if not s or s[0].kind not in self.timeline.EDITABLE:
            QMessageBox.information(self, "Split", "Select a video/image clip first.")
            return
        tr, ci = s
        c = tr.clips[ci]
        p = self.timeline.playhead
        if not (c.start + 0.1 < p < c.start + c.duration - 0.1):
            QMessageBox.information(self, "Split", "Move the playhead inside the selected clip.")
            return
        left = p - c.start
        right = (c.start + c.duration) - p
        c.duration = left
        tr.clips.insert(ci + 1, Clip(c.source, p, right, c.label, c.color, c.kind))
        self.timeline.update()
        self._on_clips_changed()

    def _dup_clip(self):
        s = self._selected_clip()
        if not s:
            return
        tr, ci = s
        c = tr.clips[ci]
        tr.clips.insert(ci + 1, Clip(c.source, c.start + c.duration, c.duration,
                                     c.label, c.color, c.kind))
        self.timeline.update()
        self._on_clips_changed()

    def _del_clip(self):
        s = self._selected_clip()
        if not s:
            return
        tr, ci = s
        del tr.clips[ci]
        self.timeline.selected = None
        self.timeline.update()
        self._on_clips_changed()

    # ── beat tools ──
    def _analyze_beat(self):
        if not self.audio_path:
            QMessageBox.information(self, "Analyze Beat", "Import a song first.")
            return
        try:
            import librosa  # noqa: F401
            have = True
        except Exception:  # noqa: BLE001
            have = False
        bpm, beats = detect_beats(self._resolve_audio())
        self.project.bpm, self.project.beats = bpm, beats
        self.bpm_lbl.setText(f"BPM: {bpm:g}  ·  {len(beats)} beats")
        self._refresh_timeline()
        if have:
            QMessageBox.information(self, "Analyze Beat", f"Detected {bpm:g} BPM, {len(beats)} beats.")
        else:
            QMessageBox.information(self, "Analyze Beat",
                f"librosa isn't installed — used a steady {bpm:g} BPM grid.\n"
                "Install librosa for true detection, or use Set BPM.")

    def _set_bpm(self):
        bpm, ok = QInputDialog.getDouble(self, "Set BPM", "Beats per minute:",
                                         self.project.bpm or 120.0, 40, 300, 1)
        if not ok:
            return
        dur = self.project.duration or 60.0
        step = 60.0 / bpm
        self.project.bpm = bpm
        self.project.beats = [i * step for i in range(int(dur / step) + 1)]
        self.bpm_lbl.setText(f"BPM: {bpm:g}  ·  {len(self.project.beats)} beats (manual)")
        self._refresh_timeline()

    def _cut_to_beat(self):
        if not self.project.beats:
            QMessageBox.information(self, "Cut to Beat", "Run Analyze Beat or Set BPM first.")
            return
        if not self.bg_paths:
            QMessageBox.information(self, "Cut to Beat", "Add at least one video/image clip first.")
            return
        item, ok = QInputDialog.getItem(self, "Cut to Beat", "Change clip every:",
                                        ["Every beat", "Every 2 beats", "Every 4 beats",
                                         "Every 8 beats"], 2, False)
        if not ok:
            return
        n = {"Every beat": 1, "Every 2 beats": 2, "Every 4 beats": 4, "Every 8 beats": 8}[item]
        beats = [b for b in self.project.beats if b < self.project.duration]

        def cuts_for(step):
            c = beats[::step]
            return ([0.0] + c) if (not c or c[0] > 0.01) else c
        cuts = cuts_for(n)
        while len(cuts) > 24 and n < 64:   # keep it light: cap the segment count
            n *= 2
            cuts = cuts_for(n)
        cuts = cuts[:24]
        bounds = cuts + [self.project.duration]
        srcs = list(self.bg_paths)
        clips = []
        for i in range(len(bounds) - 1):
            d = max(0.2, bounds[i + 1] - bounds[i])
            p = srcs[i % len(srcs)]
            clips.append(Clip(p, bounds[i], d, os.path.basename(p), "#3b82f6",
                              "video" if is_video(p) else "image"))
        self._video_track().clips = clips
        self._refresh_timeline()
        QMessageBox.information(self, "Cut to Beat",
            f"Arranged {len(clips)} clips, switching every {n}-beat at {self.project.bpm:g} BPM. "
            "Drag/trim clips on the timeline to fine-tune, then Export.")

    # ── preview transport ──
    def _toggle_play(self):
        if not self.audio_path:
            QMessageBox.information(self, "Play", "Import a song first.")
            return
        if self.player:
            master = self._resolve_audio()
            if self._media_loaded != master:
                self.player.setMedia(QMediaContent(QUrl.fromLocalFile(master)))
                self._media_loaded = master
            if self.player.state() == QMediaPlayer.PlayingState:
                self.player.pause()
            else:
                self.player.setPosition(int(self.timeline.playhead * 1000))
                self.player.play()
        else:
            if self.play_timer.isActive():
                self.play_timer.stop()
                self.play_btn.setText("▶  Play")
            else:
                self._t_last = time.time()
                self.play_timer.start(50)
                self.play_btn.setText("⏸  Pause")

    def _stop_play(self):
        if self.player:
            self.player.stop()
        self.play_timer.stop()
        self.play_btn.setText("▶  Play")
        self.timeline.playhead = 0.0
        self._update_time()
        self.timeline.update()
        self._update_preview()

    def _on_play_pos(self, ms):
        t = ms / 1000.0
        self.timeline.playhead = min(self.project.duration, t)
        self.timeline.update()
        self._update_time()
        if int(t * 2) != self._pv_t:
            self._pv_t = int(t * 2)
            self._update_preview()

    def _on_play_state(self, *_):
        playing = self.player and self.player.state() == QMediaPlayer.PlayingState
        self.play_btn.setText("⏸  Pause" if playing else "▶  Play")

    def _tick(self):
        now = time.time()
        self.timeline.playhead = min(self.project.duration,
                                     self.timeline.playhead + (now - self._t_last))
        self._t_last = now
        self.timeline.update()
        self._update_time()
        if self.timeline.playhead >= self.project.duration:
            self.play_timer.stop()
            self.play_btn.setText("▶  Play")

    # ═══ SETTINGS / CONFIG ═══
    def _config_path(self):
        return os.path.join(_user_dir(), "config.json")

    def _load_config(self):
        try:
            with open(self._config_path(), encoding="utf-8") as f:
                return json.load(f)
        except Exception:  # noqa: BLE001
            return {}

    def _save_config(self):
        try:
            with open(self._config_path(), "w", encoding="utf-8") as f:
                json.dump({"scratch_dir": self.scratch_dir,
                           "low_memory": self.low_memory,
                           "encoder_index": getattr(self, "_enc_idx", 0)}, f)
        except Exception:  # noqa: BLE001
            pass

    def _open_settings(self):
        from PyQt5.QtWidgets import QDialog
        d = QDialog(self)
        d.setWindowTitle("ClipMusic Settings")
        d.setMinimumWidth(460)
        lay = QVBoxLayout(d)
        lay.addWidget(QLabel("Scratch / temp folder", objectName="h1"))
        lay.addWidget(QLabel("Where ClipMusic writes intermediate files during export. "
                             "Point this at a fast drive with free space to avoid running "
                             "out of memory on big projects.", objectName="dim"))
        row = QHBoxLayout()
        path_lbl = QLineEdit(self.scratch_dir)
        path_lbl.setReadOnly(True)
        row.addWidget(path_lbl, 1)
        browse = QPushButton("Browse…")
        row.addWidget(browse)
        lay.addLayout(row)

        def pick():
            p = QFileDialog.getExistingDirectory(d, "Choose scratch folder", self.scratch_dir)
            if p:
                path_lbl.setText(p)
        browse.clicked.connect(pick)

        lm = QCheckBox("Low-memory export (render clips one at a time, then join)")
        lm.setChecked(self.low_memory)
        lay.addWidget(lm)
        lay.addWidget(QLabel("Recommended for long songs / many clips on low-RAM PCs. "
                             "Uses hard cuts between clips.", objectName="dim"))
        lay.addSpacing(8)
        brow = QHBoxLayout()
        brow.addStretch()
        cancel = QPushButton("Cancel")
        cancel.clicked.connect(d.reject)
        ok = QPushButton("Save")
        ok.setObjectName("accent")
        ok.clicked.connect(d.accept)
        brow.addWidget(cancel)
        brow.addWidget(ok)
        lay.addLayout(brow)
        if d.exec_():
            self.scratch_dir = path_lbl.text() or self.scratch_dir
            os.makedirs(self.scratch_dir, exist_ok=True)
            self.low_memory = lm.isChecked()
            self._save_config()
            if hasattr(self, "scratch_lbl"):
                self.scratch_lbl.setText(self.scratch_dir)
                self.scratch_lbl.setToolTip(self.scratch_dir)
            if hasattr(self, "lowmem_check"):
                self.lowmem_check.setChecked(self.low_memory)

    # ═══ EXPORT & SHARE CENTER ═══
    def _default_export_dir(self):
        for base in (os.path.join(os.path.expanduser("~"), "Videos"),
                     os.path.expanduser("~")):
            if os.path.isdir(base):
                try:
                    d = os.path.join(base, "ClipMusic")
                    os.makedirs(d, exist_ok=True)
                    return d
                except OSError:
                    pass
        d = os.path.join(_user_dir(), "exports")
        os.makedirs(d, exist_ok=True)
        return d

    @staticmethod
    def _is_online():
        import socket
        try:
            socket.setdefaulttimeout(1.5)
            socket.create_connection(("1.1.1.1", 53)).close()
            return True
        except Exception:  # noqa: BLE001
            return False

    def _export_view(self):
        w = QWidget()
        root = QVBoxLayout(w)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)
        head = QFrame()
        head.setObjectName("panel")
        head.setFixedHeight(46)
        hl = QHBoxLayout(head)
        back = QPushButton("◂ Back to editor")
        back.clicked.connect(lambda: self.stack.setCurrentIndex(0))
        hl.addWidget(back)
        hl.addStretch()
        hl.addWidget(QLabel("Export & Share", objectName="h1"))
        hl.addStretch()
        hl.addWidget(QLabel("Renders locally — nothing uploads automatically", objectName="dim"))
        root.addWidget(head)

        body = QHBoxLayout()
        body.setContentsMargins(16, 14, 16, 14)
        body.setSpacing(14)

        # ── LEFT: preview thumbnail + project details + result ──
        left = QVBoxLayout()
        self.exp_thumb = QLabel("Preview")
        self.exp_thumb.setAlignment(Qt.AlignCenter)
        self.exp_thumb.setFixedHeight(150)
        self.exp_thumb.setStyleSheet(
            f"background:#0f0f1a; border:1px solid {BORDER}; border-radius:6px; color:{DIM};")
        left.addWidget(self.exp_thumb)
        left.addWidget(QLabel("Project details", objectName="dim"))
        self.exp_info = QLabel()
        self.exp_info.setObjectName("dim")
        self.exp_info.setWordWrap(True)
        left.addWidget(self.exp_info)
        # success block (hidden until complete)
        self.success_box = QFrame()
        self.success_box.setStyleSheet(
            f"background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); border-radius:6px;")
        sbl = QVBoxLayout(self.success_box)
        self.success_lbl = QLabel("✓ Your video is ready.")
        self.success_lbl.setStyleSheet(f"color:{GREEN}; font-weight:700;")
        sbl.addWidget(self.success_lbl)
        self.path_lbl = QLabel()
        self.path_lbl.setObjectName("dim")
        self.path_lbl.setWordWrap(True)
        sbl.addWidget(self.path_lbl)
        srow = QHBoxLayout()
        of = QPushButton("Open folder")
        of.clicked.connect(lambda: self._open_folder())
        cp = QPushButton("Copy path")
        cp.clicked.connect(lambda: self._copy_text(self.last_render or ""))
        srow.addWidget(of)
        srow.addWidget(cp)
        sbl.addLayout(srow)
        ea = QPushButton("Export another version")
        ea.clicked.connect(self._export_again)
        sbl.addWidget(ea)
        self.success_box.hide()
        left.addWidget(self.success_box)
        self.offline_lbl = QLabel("Online sharing is unavailable while offline. Your video "
                                  "can still be saved to your computer.")
        self.offline_lbl.setStyleSheet(f"color:{AMBER};")
        self.offline_lbl.setWordWrap(True)
        self.offline_lbl.hide()
        left.addWidget(self.offline_lbl)
        left.addStretch()
        lwrap = QFrame()
        lwrap.setObjectName("panel")
        lwrap.setFixedWidth(290)
        lwrap.setLayout(left)
        body.addWidget(lwrap)

        # ── CENTER: format presets + render ──
        center = QVBoxLayout()
        center.addWidget(QLabel("FORMAT PRESET", objectName="dim"))
        self.preset_list = QListWidget()
        for name, *_ in EXPORT_PRESETS:
            QListWidgetItem(name, self.preset_list)
        self.preset_list.setCurrentRow(0)
        self.preset_list.currentRowChanged.connect(lambda _: self._update_export_info())
        center.addWidget(self.preset_list, 1)
        center.addWidget(QLabel("ENCODER", objectName="dim"))
        self.enc_combo = QComboBox()
        self.enc_combo.addItems([
            "CPU — most compatible (default)", "NVIDIA GPU (NVENC)",
            "Intel GPU (QSV)", "AMD GPU (AMF)", "Auto-detect (GPU → CPU)"])
        self.enc_combo.setToolTip("Hardware acceleration is optional. If a GPU "
                                  "encoder isn't available, ClipMusic falls back to CPU automatically.")
        self.enc_combo.setCurrentIndex(getattr(self, "_enc_idx", 0))
        self.enc_combo.currentIndexChanged.connect(self._on_enc_changed)
        center.addWidget(self.enc_combo)
        self.lowmem_check = QCheckBox("Low-memory export (clip-by-clip, for long projects)")
        self.lowmem_check.setChecked(self.low_memory)
        self.lowmem_check.toggled.connect(self._on_lowmem_changed)
        center.addWidget(self.lowmem_check)
        scr = QHBoxLayout()
        scr.addWidget(QLabel("Scratch:", objectName="dim"))
        self.scratch_lbl = QLabel(self.scratch_dir)
        self.scratch_lbl.setObjectName("dim")
        self.scratch_lbl.setToolTip(self.scratch_dir)
        scr.addWidget(self.scratch_lbl, 1)
        sb = QPushButton("Change")
        sb.clicked.connect(self._choose_scratch)
        scr.addWidget(sb)
        center.addLayout(scr)

        self.render_btn = QPushButton("⬇  Render & Export")
        self.render_btn.setObjectName("accent")
        self.render_btn.clicked.connect(self._do_render)
        center.addWidget(self.render_btn)
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setStyleSheet(f"color:{RED}; border-color:{RED};")
        self.cancel_btn.clicked.connect(self._cancel_render)
        self.cancel_btn.hide()
        center.addWidget(self.cancel_btn)
        self.render_bar = QProgressBar()
        self.render_bar.setValue(0)
        center.addWidget(self.render_bar)
        self.render_status = QLabel("Pick a preset, then Render & Export.", objectName="dim")
        self.render_status.setWordWrap(True)
        center.addWidget(self.render_status)
        cwrap = QFrame()
        cwrap.setLayout(center)
        body.addWidget(cwrap, 1)

        # ── RIGHT: download / share destinations ──
        right = QVBoxLayout()
        right.addWidget(QLabel("Download your video", objectName="h1"))
        self.dest_btns = []
        for dest in DESTINATIONS:
            b = QPushButton(dest["name"])
            b.setEnabled(False)
            b.clicked.connect(lambda _=False, d=dest: self._share(d))
            b.setStyleSheet(f"text-align:left; border-left:3px solid {dest['color']};")
            b.setToolTip(dest["subtext"])
            right.addWidget(b)
            self.dest_btns.append((dest, b))
        self.share_hint = QLabel("Finish rendering before sharing.")
        self.share_hint.setObjectName("dim")
        right.addWidget(self.share_hint)
        right.addStretch()
        priv = QLabel("Only the final MP4 you choose is shared. Source clips, stems, project "
                      "files and AI data never leave your machine. No upload starts without you.")
        priv.setObjectName("dim")
        priv.setWordWrap(True)
        right.addWidget(priv)
        rwrap = QFrame()
        rwrap.setObjectName("panel")
        rwrap.setFixedWidth(300)
        rwrap.setLayout(right)
        body.addWidget(rwrap)

        root.addLayout(body, 1)
        return w

    def _hwaccel_value(self):
        return {0: "off", 1: "nvenc", 2: "qsv", 3: "amf", 4: "auto"}.get(
            self.enc_combo.currentIndex(), "off")

    def _on_enc_changed(self, idx):
        self._enc_idx = idx
        self._save_config()

    def _on_lowmem_changed(self, on):
        self.low_memory = bool(on)
        self._save_config()

    def _choose_scratch(self):
        d = QFileDialog.getExistingDirectory(self, "Choose scratch folder", self.scratch_dir)
        if d:
            self.scratch_dir = d
            os.makedirs(d, exist_ok=True)
            self.scratch_lbl.setText(d)
            self.scratch_lbl.setToolTip(d)
            self._save_config()

    def _goto_export(self):
        if not self.audio_path:
            QMessageBox.information(self, "Nothing to export",
                                    "Import an audio track first (that's the music).")
            return
        self.stack.setCurrentIndex(1)
        self._update_export_info()
        self._refresh_offline()

    def _update_export_info(self):
        row = max(0, self.preset_list.currentRow())
        name, W, H, FPS, ext, audio_only = EXPORT_PRESETS[row]
        dur = self.project.duration
        res = "audio only" if audio_only else f"{W}×{H} @ {FPS}fps"
        # rough size estimate (8 Mbps video + 256 kbps audio, or audio bitrate)
        bps = (256_000 if audio_only else 8_000_000 + 256_000)
        est = dur * bps / 8 / 1e6
        self.exp_info.setText(
            f"Name:  {os.path.basename(self.audio_path) if self.audio_path else '—'}\n"
            f"Duration:  {int(dur // 60)}:{int(dur % 60):02d}\n"
            f"Output:  {res}\n"
            f"Est. size:  ~{est:.0f} MB")

    def _refresh_offline(self):
        online = self._is_online()
        self.offline_lbl.setVisible(not online)
        complete = bool(self.last_render)
        for dest, b in self.dest_btns:
            enabled = complete and (not dest["net"] or online)
            b.setEnabled(enabled)

    def _set_state(self, state):
        rendering = state == "rendering"
        complete = state == "complete"
        self.render_btn.setVisible(not rendering)
        self.render_btn.setEnabled(not rendering)
        self.cancel_btn.setVisible(rendering)
        self.preset_list.setEnabled(not rendering)
        self.success_box.setVisible(complete)
        self.share_hint.setVisible(not complete)
        if complete:
            self._refresh_offline()
        else:
            for _d, b in self.dest_btns:
                b.setEnabled(False)

    def _do_render(self):
        if not self._ensure_ffmpeg() or not self.audio_path:
            return
        row = self.preset_list.currentRow()
        name, W, H, FPS, ext, audio_only = EXPORT_PRESETS[row]
        # render to the default export folder FIRST (Clipchamp-style)
        stem = os.path.splitext(os.path.basename(self.audio_path))[0]
        out = os.path.join(self._default_export_dir(),
                           f"{stem}_clipmusic_{W}x{H}.{ext}" if not audio_only
                           else f"{stem}_clipmusic.{ext}")
        base = os.path.splitext(out)[0]
        i = 2
        while os.path.exists(out):
            out = f"{base}_{i}.{ext}"
            i += 1
        segs = self._video_segments()
        spec = RenderSpec(
            audio=self._resolve_audio(), background=None,
            backgrounds=[s[0] for s in segs],
            seg_durations=[s[1] for s in segs],
            visualiser=self.vis_combo.currentText(),
            width=W or 1920, height=H or 1080, fps=FPS or 30,
            lyrics=self._parse_lyrics(), audio_only=audio_only, out_ext=ext,
            effect=self.fx_combo.currentText(),
            brightness=self.bri.value() / 100.0,
            contrast=self.con.value() / 100.0,
            saturation=self.sat.value() / 100.0,
            fade_in=self.fin.value() / 10.0, fade_out=self.fout.value() / 10.0,
            ken_burns=self.kb_check.isChecked(),
            transition=self.trans_combo.currentText(),
            title=self.title_edit.text(),
            title_pos=self.titlepos.currentText().lower(),
            title_size=self.tsize.value(),
            hwaccel=self._hwaccel_value(),
            low_memory=self.lowmem_check.isChecked())
        self._cur_preset = (name, W, H, FPS, ext, audio_only)
        self._set_state("rendering")
        self.render_bar.setValue(0)
        self.render_status.setText("Rendering your music video…")
        self.worker = RenderWorker(spec, out, self.scratch_dir)
        self.worker.progress.connect(lambda fr: self.render_bar.setValue(int(fr * 100)))
        self.worker.done.connect(self._render_done)
        self.worker.start()

    def _cancel_render(self):
        if self.worker:
            self.worker.cancel()
        self.render_status.setText("Cancelling…")

    def _render_done(self, ok, msg):
        if ok:
            self.last_render = msg
            self.render_bar.setValue(100)
            self._set_state("complete")
            self.path_lbl.setText(msg)
            sz = os.path.getsize(msg) / 1e6
            name, W, H, FPS, ext, audio_only = self._cur_preset
            res = "audio only" if audio_only else f"{W}×{H}"
            self.render_status.setText("Your video is ready.")
            self.exp_info.setText(
                f"Name:  {os.path.basename(msg)}\n"
                f"Duration:  {int(self.project.duration // 60)}:{int(self.project.duration % 60):02d}\n"
                f"Resolution:  {res}\nSize:  {sz:.1f} MB\nSaved:  {os.path.dirname(msg)}")
            self._set_thumb(msg)
        else:
            self._set_state("idle")
            if msg != "Cancelled.":
                self.render_status.setText(f"✗ Render failed: {msg}")
                QMessageBox.critical(self, "Render failed", msg)
            else:
                self.render_status.setText("Render cancelled.")

    def _set_thumb(self, video):
        ext = os.path.splitext(video)[1].lower()
        if ext in (".mp3", ".wav"):
            self.exp_thumb.setText("♪  audio file")
            return
        tmp = os.path.join(self.scratch_dir, "_exp_thumb.jpg")
        if extract_frame(video, min(1.0, self.project.duration / 2), tmp, 480):
            pm = QPixmap(tmp)
            if not pm.isNull():
                self.exp_thumb.setPixmap(pm.scaled(self.exp_thumb.width(),
                                                   self.exp_thumb.height(),
                                                   Qt.KeepAspectRatio, Qt.SmoothTransformation))

    def _open_folder(self):
        if not self.last_render:
            return
        folder = os.path.dirname(self.last_render)
        try:
            if sys.platform.startswith("win"):
                os.startfile(folder)  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", folder])
            else:
                webbrowser.open("file://" + folder)
        except Exception:  # noqa: BLE001
            pass

    def _copy_text(self, text):
        QApplication.clipboard().setText(text)
        self.statusBar().showMessage("Copied to clipboard.", 2500) if self.statusBar() else None

    def _export_again(self):
        self._set_state("idle")
        self.render_status.setText("Pick a preset, then Render & Export.")

    def _share(self, dest):
        if not self.last_render:
            return
        if dest["id"] == "computer":
            # let the user save a copy wherever they like, then open the folder
            target, _ = QFileDialog.getSaveFileName(
                self, "Save a copy", os.path.basename(self.last_render),
                f"*{os.path.splitext(self.last_render)[1]}")
            if target:
                try:
                    if os.path.abspath(target) != os.path.abspath(self.last_render):
                        shutil.copyfile(self.last_render, target)
                    self.last_render = target
                    self.path_lbl.setText(target)
                except Exception as exc:  # noqa: BLE001
                    QMessageBox.warning(self, "Save", str(exc))
            self._open_folder()
            return
        # online destination: open the platform + the local folder (V1 helper)
        if dest["id"] == "linkedin":
            caption = ("🎵 New music video, made with ClipMusic.\n"
                       "#musicvideo #music #newrelease #indiemusic")
            self._copy_text(caption)
        QMessageBox.information(self, dest["name"], dest.get("msg", "") +
                                f"\n\nFile:\n{self.last_render}")
        self._open_folder()
        webbrowser.open(dest["url"])


def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    pal = QPalette()
    pal.setColor(QPalette.Window, QColor(DARK))
    pal.setColor(QPalette.Base, QColor(SURFACE))
    pal.setColor(QPalette.Text, QColor(TEXT))
    pal.setColor(QPalette.WindowText, QColor(TEXT))
    app.setPalette(pal)
    win = ClipMusic()
    win.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
