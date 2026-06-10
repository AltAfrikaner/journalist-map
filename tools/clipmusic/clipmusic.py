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
import shutil
import struct
import subprocess
import tempfile
import webbrowser
from dataclasses import dataclass, field

try:
    import numpy as np
    from PyQt5.QtCore import Qt, QThread, pyqtSignal, QRectF, QTimer
    from PyQt5.QtGui import (QColor, QPainter, QPen, QBrush, QFont, QLinearGradient,
                             QPixmap, QPalette)
    from PyQt5.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
        QPushButton, QFileDialog, QComboBox, QListWidget, QListWidgetItem,
        QStackedWidget, QProgressBar, QMessageBox, QLineEdit, QPlainTextEdit,
        QScrollArea, QFrame, QSizePolicy, QGridLayout, QToolButton)
except ImportError as exc:  # noqa: BLE001
    print(f"\n  Missing dependency: {exc}\n  pip install PyQt5 numpy\n")
    sys.exit(1)


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


def build_render_cmd(spec: RenderSpec, out: str) -> list:
    W, H, FPS = spec.width, spec.height, spec.fps

    if spec.audio_only:
        if spec.out_ext == "mp3":
            return ["-i", spec.audio, "-c:a", "libmp3lame", "-b:a", "320k", "-y", out]
        return ["-i", spec.audio, "-c:a", "pcm_s16le", "-y", out]

    inputs = []
    # background input is always input 0, audio is always the last input
    if spec.background and is_video(spec.background):
        inputs += ["-stream_loop", "-1", "-i", spec.background]
    elif spec.background:
        inputs += ["-loop", "1", "-framerate", str(FPS), "-i", spec.background]
    else:
        inputs += ["-f", "lavfi", "-i", f"color=c=0x0a0a0f:s={W}x{H}:r={FPS}"]
    inputs += ["-i", spec.audio]
    bg_index = 0
    audio_index = inputs.count("-i") - 1

    filt = [f"[{bg_index}:v]scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop={W}:{H},setsar=1,format=rgba[bg]"]
    last = "bg"
    vis = VISUALISERS.get(spec.visualiser, "")
    if vis:
        vchain = vis.format(W=W, H=H, FPS=FPS)
        filt.append(f"[{audio_index}:a]{vchain},format=rgba,colorchannelmixer=aa=0.6[viz]")
        filt.append(f"[{last}][viz]overlay=0:0:format=auto[comp]")
        last = "comp"
    # lyrics
    font = _font_arg()
    for i, (s0, e0, txt) in enumerate(spec.lyrics):
        if not txt.strip():
            continue
        ff = f"fontfile='{font}':" if font else ""
        dt = (f"drawtext={ff}text='{_esc_drawtext(txt)}':"
              f"fontcolor=white:fontsize={max(24, H // 22)}:box=1:boxcolor=0x000000A0:"
              f"boxborderw=14:x=(w-text_w)/2:y=h-(h/6):"
              f"enable='between(t,{s0:.2f},{e0:.2f})'")
        filt.append(f"[{last}]{dt}[ly{i}]")
        last = f"ly{i}"
    filt.append(f"[{last}]format=yuv420p[outv]")

    cmd = [*inputs, "-filter_complex", ";".join(filt),
           "-map", "[outv]", "-map", f"{audio_index}:a",
           "-c:v", spec.vcodec, "-crf", str(spec.crf), "-preset", "veryfast",
           "-c:a", spec.acodec, "-b:a", "256k", "-r", str(FPS), "-shortest",
           "-movflags", "+faststart", "-y", out]
    return cmd


class RenderWorker(QThread):
    progress = pyqtSignal(float)   # 0..1
    done = pyqtSignal(bool, str)   # ok, message/path

    def __init__(self, spec: RenderSpec, out: str):
        super().__init__()
        self.spec, self.out = spec, out

    def run(self):
        import re
        dur = probe_duration(self.spec.audio) or 1.0
        cmd = [ffmpeg_path(), "-hide_banner", "-nostdin",
               *build_render_cmd(self.spec, self.out), "-progress", "pipe:1", "-nostats"]
        try:
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 text=True, creationflags=_NO_WINDOW)
        except Exception as exc:  # noqa: BLE001
            self.done.emit(False, str(exc))
            return
        for line in p.stdout:
            m = re.match(r"out_time_ms=(\d+)", line.strip())
            if m:
                self.progress.emit(min(1.0, (int(m.group(1)) / 1e6) / dur))
        err = p.stderr.read() if p.stderr else ""
        p.wait()
        if p.returncode == 0 and os.path.exists(self.out) and os.path.getsize(self.out) > 0:
            self.progress.emit(1.0)
            self.done.emit(True, self.out)
        else:
            tail = (err.strip().splitlines() or ["render failed"])[-1]
            self.done.emit(False, tail)


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

    HEADER_W = 140
    RULER_H = 22
    ROW_H = 40

    def __init__(self, project: Project):
        super().__init__()
        self.project = project
        self.zoom = 60.0  # px/sec
        self.playhead = 0.0
        self.wave_cache = {}  # source -> peaks
        self.setMinimumHeight(180)
        self.setMouseTracking(True)

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
        if ev.x() > self.HEADER_W:
            self.playhead = min(self.project.duration, self._t(ev.x()))
            self.playhead_moved.emit(self.playhead)
            self.update()

    def mouseMoveEvent(self, ev):
        if ev.buttons() & Qt.LeftButton and ev.x() > self.HEADER_W:
            self.playhead = min(self.project.duration, self._t(ev.x()))
            self.playhead_moved.emit(self.playhead)
            self.update()

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
        for tr in self.project.tracks:
            qp.fillRect(0, y, self.HEADER_W, self.ROW_H, QColor(PANEL))
            qp.fillRect(0, y, 4, self.ROW_H, QColor(tr.color))
            qp.setPen(QPen(QColor(TEXT)))
            qp.setFont(QFont("Segoe UI", 8))
            qp.drawText(12, y + self.ROW_H // 2 + 4, tr.name)
            qp.setPen(QPen(QColor(BORDER)))
            qp.drawLine(0, y + self.ROW_H, W, y + self.ROW_H)
            for clip in tr.clips:
                cx, cw = int(self._x(clip.start)), int(clip.duration * self.zoom)
                rect = QRectF(cx, y + 4, max(cw, 6), self.ROW_H - 8)
                col = QColor(clip.color)
                qp.setBrush(QBrush(QColor(col.red(), col.green(), col.blue(), 60)))
                qp.setPen(QPen(col, 1))
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

DESTINATIONS = [
    ("Save to your computer", "computer", None, GREEN),
    ("Upload to YouTube", "youtube", "https://www.youtube.com/upload", "#ff0000"),
    ("Send to TikTok", "tiktok", "https://www.tiktok.com/upload", "#00f2ea"),
    ("Save to Google Drive", "gdrive", "https://drive.google.com", "#4285F4"),
    ("Save to Dropbox", "dropbox", "https://www.dropbox.com/home", "#0061FF"),
    ("Share to LinkedIn", "linkedin", "https://www.linkedin.com/feed", "#0A66C2"),
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
        self.bg_path = None
        self.last_render = None
        self.worker = None
        self.setAcceptDrops(True)
        self._build()
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
        for txt in ("Split", "Duplicate", "Delete"):
            b = QPushButton(txt)
            bar2.addWidget(b)
        bs = QPushButton("⚡ Beat Sync")
        bs.setStyleSheet(f"color:{AMBER};")
        bar2.addWidget(bs)
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
        bg = QPushButton("Set background image/video")
        bg.clicked.connect(self._set_background)
        v.addWidget(bg)
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
        return f

    def _props_panel(self):
        f = QFrame()
        f.setObjectName("panel")
        f.setFixedWidth(240)
        v = QVBoxLayout(f)
        v.setContentsMargins(10, 10, 10, 10)
        v.addWidget(QLabel("Visualiser", objectName="h1"))
        self.vis_combo = QComboBox()
        self.vis_combo.addItems(list(VISUALISERS.keys()))
        self.vis_combo.setCurrentText("Bars (CQT)")
        v.addWidget(self.vis_combo)
        v.addSpacing(8)
        v.addWidget(QLabel("Lyrics / text  (one line per cue:  start  end  text)",
                           objectName="dim"))
        self.lyrics_edit = QPlainTextEdit()
        self.lyrics_edit.setPlaceholderText("0  4  My first lyric line\n4  8  Second line\n8  14  Chorus")
        v.addWidget(self.lyrics_edit, 1)
        info = QLabel("Beats / BPM appear on the timeline after import.")
        info.setObjectName("dim")
        info.setWordWrap(True)
        v.addWidget(info)
        self.bpm_lbl = QLabel("BPM: —")
        self.bpm_lbl.setStyleSheet(f"color:{AMBER};")
        v.addWidget(self.bpm_lbl)
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
            if not self.bg_path:
                self._apply_background(path)

    def _load_audio(self, path):
        self.audio_path = path
        dur = probe_duration(path)
        self.project.duration = max(self.project.duration, dur)
        atrack = next(t for t in self.project.tracks if t.kind == "audio")
        atrack.clips = [Clip(path, 0, dur, os.path.basename(path), ACCENT, "audio")]
        peaks, _ = waveform_peaks(path, 1200)
        self.timeline.wave_cache[path] = peaks
        bpm, beats = detect_beats(path)
        self.project.bpm, self.project.beats = bpm, beats
        self.bpm_lbl.setText(f"BPM: {bpm:g}   ·   {len(beats)} beats")
        self._refresh_timeline()
        self._update_time()

    def _set_background(self):
        if not self._ensure_ffmpeg():
            return
        f, _ = QFileDialog.getOpenFileName(
            self, "Background", "", "Image/Video (*.jpg *.jpeg *.png *.mp4 *.mov *.mkv)")
        if f:
            self._add_media_item(f)
            self._apply_background(f)

    def _apply_background(self, path):
        self.bg_path = path
        vtrack = next(t for t in self.project.tracks if t.kind == "video")
        d = self.project.duration or probe_duration(path) or 10
        vtrack.clips = [Clip(path, 0, d, os.path.basename(path), "#3b82f6",
                             "video" if is_video(path) else "image")]
        self._refresh_timeline()
        self._update_preview()

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

    def _update_time(self):
        def f(s):
            return f"{int(s // 60)}:{int(s % 60):02d}.{int((s % 1) * 100):02d}"
        self.time_lbl.setText(f"{f(self.timeline.playhead)} / {f(self.project.duration)}")

    def _update_preview(self):
        if self.bg_path and ffmpeg_path():
            tmp = os.path.join(_user_dir(), "_preview.jpg")
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

    # ═══ EXPORT VIEW ═══
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
        body.setContentsMargins(16, 16, 16, 16)
        body.setSpacing(16)

        # center: presets + render
        center = QVBoxLayout()
        center.addWidget(QLabel("FORMAT PRESET", objectName="dim"))
        self.preset_list = QListWidget()
        for name, *_ in EXPORT_PRESETS:
            QListWidgetItem(name, self.preset_list)
        self.preset_list.setCurrentRow(0)
        center.addWidget(self.preset_list, 1)
        self.render_btn = QPushButton("⬇  Render & Export")
        self.render_btn.setObjectName("accent")
        self.render_btn.clicked.connect(self._do_render)
        center.addWidget(self.render_btn)
        self.render_bar = QProgressBar()
        self.render_bar.setValue(0)
        center.addWidget(self.render_bar)
        self.render_status = QLabel("Pick a preset, then Render & Export.", objectName="dim")
        self.render_status.setWordWrap(True)
        center.addWidget(self.render_status)
        cwrap = QFrame()
        cwrap.setLayout(center)
        body.addWidget(cwrap, 1)

        # right: destinations
        right = QVBoxLayout()
        right.addWidget(QLabel("Download / share your video", objectName="h1"))
        self.dest_btns = []
        for name, did, url, color in DESTINATIONS:
            b = QPushButton(name)
            b.setEnabled(did == "computer")
            b.clicked.connect(lambda _=False, d=did, u=url: self._share(d, u))
            b.setStyleSheet(f"text-align:left; border-left:3px solid {color};")
            right.addWidget(b)
            self.dest_btns.append((did, b))
        right.addStretch()
        priv = QLabel("Only the final MP4 you choose is shared. Source clips, stems and "
                      "project data never leave your machine. No upload starts without you.")
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

    def _goto_export(self):
        if not self.audio_path:
            QMessageBox.information(self, "Nothing to export",
                                    "Import an audio track first (that's the music).")
            return
        self.stack.setCurrentIndex(1)

    def _do_render(self):
        if not self._ensure_ffmpeg() or not self.audio_path:
            return
        row = self.preset_list.currentRow()
        name, W, H, FPS, ext, audio_only = EXPORT_PRESETS[row]
        default = os.path.splitext(os.path.basename(self.audio_path))[0] + f"_clipmusic.{ext}"
        out, _ = QFileDialog.getSaveFileName(self, "Save music video", default,
                                             f"{ext.upper()} (*.{ext})")
        if not out:
            return
        spec = RenderSpec(
            audio=self.audio_path, background=self.bg_path,
            visualiser=self.vis_combo.currentText(),
            width=W or 1920, height=H or 1080, fps=FPS or 30,
            lyrics=self._parse_lyrics(), audio_only=audio_only, out_ext=ext)
        self.render_btn.setEnabled(False)
        self.render_status.setText(f"Rendering “{name}” locally with ffmpeg…")
        self.worker = RenderWorker(spec, out)
        self.worker.progress.connect(lambda fr: self.render_bar.setValue(int(fr * 100)))
        self.worker.done.connect(self._render_done)
        self.worker.start()

    def _render_done(self, ok, msg):
        self.render_btn.setEnabled(True)
        if ok:
            self.last_render = msg
            self.render_bar.setValue(100)
            self.render_status.setText(f"✓ Your video is ready:\n{msg}")
            for did, b in self.dest_btns:
                b.setEnabled(True)
        else:
            self.render_status.setText(f"✗ Render failed: {msg}")
            QMessageBox.critical(self, "Render failed", msg)

    def _share(self, did, url):
        if did == "computer":
            if self.last_render and os.path.isdir(os.path.dirname(self.last_render)):
                folder = os.path.dirname(self.last_render)
                try:
                    if sys.platform.startswith("win"):
                        os.startfile(folder)  # type: ignore[attr-defined]
                    else:
                        webbrowser.open("file://" + folder)
                except Exception:  # noqa: BLE001
                    pass
            return
        # online: open the platform; the user uploads the rendered file manually (V1)
        QMessageBox.information(
            self, "Open " + did.title(),
            f"Your video is saved at:\n{self.last_render}\n\n{did.title()} will open in your "
            "browser. Upload the file from that folder. (Nothing is sent automatically.)")
        webbrowser.open(url)


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
