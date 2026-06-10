"""
Audio Tool Pro — Standalone audio editor with Gumroad license activation.
Cut, convert, and visualise audio files.

Dependencies (install before running):
    pip install PyQt5 matplotlib numpy pydub requests

FFmpeg must be on your system PATH for pydub to work:
    https://ffmpeg.org/download.html

To compile to .exe:
    pip install pyinstaller
    pyinstaller --onefile --windowed --icon=icon.ico audio_tool_pro.py
"""

import sys, os, json, struct, wave, hashlib, datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Try imports — give a clear message if anything is missing
# ---------------------------------------------------------------------------
try:
    import numpy as np
    import requests
    from pydub import AudioSegment

    from PyQt5.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QLabel, QPushButton, QFileDialog, QDialog, QLineEdit, QComboBox,
        QSlider, QStatusBar, QFrame, QMessageBox, QGroupBox, QSplitter,
        QProgressBar, QAction, QMenuBar, QSpinBox, QGridLayout,
    )
    from PyQt5.QtCore import Qt, QTimer, pyqtSignal
    from PyQt5.QtGui import QFont, QIcon, QPalette, QColor, QPixmap, QPainter

    from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg
    from matplotlib.figure import Figure
except ImportError as e:
    print(f"\n  Missing dependency: {e}\n")
    print("  Install everything with:")
    print("    pip install PyQt5 matplotlib numpy pydub requests\n")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION — edit these two values after creating your Gumroad product
# ═══════════════════════════════════════════════════════════════════════════
GUMROAD_PRODUCT_ID = "YOUR_PRODUCT_ID"          # from Gumroad dashboard
APP_NAME            = "Audio Tool Pro"
APP_VERSION         = "1.0.0"
LICENSE_PATH        = os.path.join(
    os.path.expanduser("~"), ".audiotoolpro_license.json"
)


# ═══════════════════════════════════════════════════════════════════════════
# COLOUR PALETTE & STYLESHEET
# ═══════════════════════════════════════════════════════════════════════════
DARK = "#0e1117"
SURFACE = "#161b22"
CARD = "#1c2333"
BORDER = "#2a3142"
ACCENT = "#58a6ff"
ACCENT_HOVER = "#79bbff"
ACCENT_PRESS = "#3d8bd4"
TEXT = "#e6edf3"
TEXT_DIM = "#8b949e"
DANGER = "#f85149"
SUCCESS = "#3fb950"
WARN = "#d29922"
WAVE_COLOR = "#58a6ff"
WAVE_SELECT = "#3fb95066"

STYLESHEET = f"""
QMainWindow, QDialog {{
    background: {DARK};
    color: {TEXT};
}}
QWidget {{
    color: {TEXT};
    font-family: 'Segoe UI', 'Inter', sans-serif;
    font-size: 13px;
}}
QGroupBox {{
    background: {CARD};
    border: 1px solid {BORDER};
    border-radius: 8px;
    margin-top: 14px;
    padding: 16px 12px 12px 12px;
    font-weight: 600;
    font-size: 13px;
}}
QGroupBox::title {{
    subcontrol-origin: margin;
    left: 14px;
    padding: 0 6px;
    color: {ACCENT};
}}
QPushButton {{
    background: {CARD};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 8px 18px;
    font-weight: 600;
    color: {TEXT};
    min-height: 20px;
}}
QPushButton:hover {{
    background: {BORDER};
    border-color: {ACCENT};
}}
QPushButton:pressed {{
    background: {ACCENT_PRESS};
}}
QPushButton#primary {{
    background: {ACCENT};
    color: {DARK};
    border: none;
}}
QPushButton#primary:hover {{
    background: {ACCENT_HOVER};
}}
QPushButton#danger {{
    border-color: {DANGER};
    color: {DANGER};
}}
QPushButton#danger:hover {{
    background: {DANGER};
    color: {DARK};
}}
QLineEdit {{
    background: {SURFACE};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 8px 12px;
    color: {TEXT};
    selection-background-color: {ACCENT};
}}
QLineEdit:focus {{
    border-color: {ACCENT};
}}
QComboBox {{
    background: {SURFACE};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 6px 12px;
    color: {TEXT};
    min-width: 100px;
}}
QComboBox::drop-down {{
    border: none;
    width: 24px;
}}
QComboBox QAbstractItemView {{
    background: {CARD};
    border: 1px solid {BORDER};
    selection-background-color: {ACCENT};
    color: {TEXT};
}}
QSlider::groove:horizontal {{
    height: 6px;
    background: {BORDER};
    border-radius: 3px;
}}
QSlider::handle:horizontal {{
    background: {ACCENT};
    width: 16px;
    height: 16px;
    margin: -5px 0;
    border-radius: 8px;
}}
QSlider::sub-page:horizontal {{
    background: {ACCENT};
    border-radius: 3px;
}}
QStatusBar {{
    background: {SURFACE};
    border-top: 1px solid {BORDER};
    color: {TEXT_DIM};
    font-size: 12px;
}}
QProgressBar {{
    background: {SURFACE};
    border: 1px solid {BORDER};
    border-radius: 4px;
    text-align: center;
    color: {TEXT};
    height: 18px;
}}
QProgressBar::chunk {{
    background: {ACCENT};
    border-radius: 3px;
}}
QLabel#heading {{
    font-size: 22px;
    font-weight: 700;
    color: {TEXT};
}}
QLabel#subheading {{
    font-size: 13px;
    color: {TEXT_DIM};
}}
QLabel#fileinfo {{
    font-size: 12px;
    color: {ACCENT};
    padding: 4px 8px;
    background: {SURFACE};
    border-radius: 4px;
}}
QSpinBox {{
    background: {SURFACE};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 4px 8px;
    color: {TEXT};
}}
"""


# ═══════════════════════════════════════════════════════════════════════════
# GUMROAD ACTIVATION — activate-once, stores token locally
# ═══════════════════════════════════════════════════════════════════════════

def check_license() -> bool:
    """Return True if a valid local activation token exists."""
    if not os.path.exists(LICENSE_PATH):
        return False
    try:
        with open(LICENSE_PATH, "r") as f:
            data = json.load(f)
        # Verify the stored hash matches so the file hasn't been tampered with
        raw = f"{data['email']}:{data['license_key']}:{data['product_id']}"
        return data.get("hash") == hashlib.sha256(raw.encode()).hexdigest()
    except Exception:
        return False


def activate_license(email: str, license_key: str) -> tuple[bool, str]:
    """
    POST to Gumroad's license verification endpoint.
    On success, write a local token so the user never needs to activate again.
    Returns (success: bool, message: str).
    """
    try:
        r = requests.post(
            "https://api.gumroad.com/v2/licenses/verify",
            data={
                "product_id": GUMROAD_PRODUCT_ID,
                "license_key": license_key.strip(),
                "increment_uses_count": True,
            },
            timeout=15,
        )
        body = r.json()

        if body.get("success"):
            token = {
                "email": email.strip().lower(),
                "license_key": license_key.strip(),
                "product_id": GUMROAD_PRODUCT_ID,
                "activated": datetime.datetime.utcnow().isoformat(),
                "hash": hashlib.sha256(
                    f"{email.strip().lower()}:{license_key.strip()}:{GUMROAD_PRODUCT_ID}".encode()
                ).hexdigest(),
            }
            with open(LICENSE_PATH, "w") as f:
                json.dump(token, f)
            return True, "Activated successfully."

        # Gumroad returned an error
        msg = body.get("message", "Invalid license key.")
        return False, msg

    except requests.ConnectionError:
        return False, "No internet connection. Please connect and try again."
    except Exception as exc:
        return False, f"Activation error: {exc}"


class ActivationDialog(QDialog):
    """Modal dialog shown on first launch — collects email + license key."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"{APP_NAME} — Activate")
        self.setFixedSize(420, 340)
        self.setStyleSheet(STYLESHEET)
        self.activated = False

        layout = QVBoxLayout(self)
        layout.setSpacing(12)
        layout.setContentsMargins(32, 28, 32, 28)

        title = QLabel(APP_NAME)
        title.setObjectName("heading")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        sub = QLabel("Enter your license key to activate")
        sub.setObjectName("subheading")
        sub.setAlignment(Qt.AlignCenter)
        layout.addWidget(sub)

        layout.addSpacing(8)

        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Email address")
        layout.addWidget(self.email_input)

        self.key_input = QLineEdit()
        self.key_input.setPlaceholderText("License key (from your Gumroad receipt)")
        layout.addWidget(self.key_input)

        self.status_label = QLabel("")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setWordWrap(True)
        layout.addWidget(self.status_label)

        self.activate_btn = QPushButton("Activate")
        self.activate_btn.setObjectName("primary")
        self.activate_btn.setCursor(Qt.PointingHandCursor)
        self.activate_btn.clicked.connect(self._on_activate)
        layout.addWidget(self.activate_btn)

        layout.addStretch()

    def _on_activate(self):
        email = self.email_input.text().strip()
        key = self.key_input.text().strip()
        if not email or not key:
            self.status_label.setStyleSheet(f"color: {WARN};")
            self.status_label.setText("Please enter both email and license key.")
            return

        self.activate_btn.setEnabled(False)
        self.activate_btn.setText("Verifying…")
        QApplication.processEvents()

        ok, msg = activate_license(email, key)

        if ok:
            self.status_label.setStyleSheet(f"color: {SUCCESS};")
            self.status_label.setText("✓  " + msg)
            self.activated = True
            QTimer.singleShot(800, self.accept)
        else:
            self.status_label.setStyleSheet(f"color: {DANGER};")
            self.status_label.setText(msg)
            self.activate_btn.setEnabled(True)
            self.activate_btn.setText("Activate")


# ═══════════════════════════════════════════════════════════════════════════
# WAVEFORM WIDGET — matplotlib canvas with click-drag selection
# ═══════════════════════════════════════════════════════════════════════════

class WaveformCanvas(FigureCanvasQTAgg):
    """Draws the audio waveform and lets the user select a region."""

    selection_changed = pyqtSignal(float, float)  # start_sec, end_sec

    def __init__(self, parent=None):
        self.fig = Figure(facecolor=DARK, edgecolor=DARK)
        self.ax = self.fig.add_subplot(111)
        super().__init__(self.fig)
        self.setMinimumHeight(180)

        self.samples = None
        self.sample_rate = 44100
        self.duration = 0.0

        # Selection state
        self._sel_start = None
        self._sel_end = None
        self._dragging = False

        self._style_axes()
        self._draw_empty()

        self.mpl_connect("button_press_event", self._on_press)
        self.mpl_connect("motion_notify_event", self._on_move)
        self.mpl_connect("button_release_event", self._on_release)

    def _style_axes(self):
        self.ax.set_facecolor(DARK)
        for spine in self.ax.spines.values():
            spine.set_visible(False)
        self.ax.tick_params(
            colors=TEXT_DIM, labelsize=9, length=0, pad=6,
        )
        self.ax.set_yticks([])
        self.fig.subplots_adjust(left=0.02, right=0.98, top=0.95, bottom=0.18)

    def _draw_empty(self):
        self.ax.clear()
        self._style_axes()
        self.ax.text(
            0.5, 0.5, "Load an audio file to see its waveform",
            transform=self.ax.transAxes, ha="center", va="center",
            fontsize=13, color=TEXT_DIM, style="italic",
        )
        self.draw()

    def load_audio(self, samples: np.ndarray, sample_rate: int):
        self.samples = samples
        self.sample_rate = sample_rate
        self.duration = len(samples) / sample_rate
        self._sel_start = None
        self._sel_end = None
        self._redraw()

    def _redraw(self):
        self.ax.clear()
        self._style_axes()
        if self.samples is None:
            self._draw_empty()
            return

        t = np.linspace(0, self.duration, len(self.samples))

        # Down-sample for performance if longer than 200k points
        step = max(1, len(self.samples) // 200_000)
        self.ax.fill_between(
            t[::step], self.samples[::step], 0,
            color=WAVE_COLOR, alpha=0.35, linewidth=0,
        )
        self.ax.plot(t[::step], self.samples[::step], color=WAVE_COLOR, linewidth=0.5, alpha=0.8)

        self.ax.set_xlim(0, self.duration)
        mx = max(abs(self.samples.min()), abs(self.samples.max())) * 1.1 or 1
        self.ax.set_ylim(-mx, mx)
        self.ax.set_xlabel("Time (s)", fontsize=10, color=TEXT_DIM, labelpad=4)

        # Draw selection highlight
        if self._sel_start is not None and self._sel_end is not None:
            lo, hi = sorted([self._sel_start, self._sel_end])
            self.ax.axvspan(lo, hi, color=WAVE_SELECT, zorder=2)
            self.ax.axvline(lo, color=SUCCESS, linewidth=1, linestyle="--", zorder=3)
            self.ax.axvline(hi, color=DANGER, linewidth=1, linestyle="--", zorder=3)

        self.draw()

    # --- mouse events for region selection ---
    def _on_press(self, event):
        if event.inaxes != self.ax or self.samples is None:
            return
        self._dragging = True
        self._sel_start = max(0, min(event.xdata, self.duration))
        self._sel_end = self._sel_start

    def _on_move(self, event):
        if not self._dragging or event.inaxes != self.ax:
            return
        self._sel_end = max(0, min(event.xdata, self.duration))
        self._redraw()

    def _on_release(self, event):
        if not self._dragging:
            return
        self._dragging = False
        if self._sel_start is not None and self._sel_end is not None:
            lo, hi = sorted([self._sel_start, self._sel_end])
            if hi - lo > 0.01:  # ignore tiny accidental clicks
                self.selection_changed.emit(lo, hi)

    def get_selection(self) -> tuple[float, float] | None:
        if self._sel_start is None or self._sel_end is None:
            return None
        lo, hi = sorted([self._sel_start, self._sel_end])
        return (lo, hi) if hi - lo > 0.01 else None

    def clear_selection(self):
        self._sel_start = None
        self._sel_end = None
        self._redraw()


# ═══════════════════════════════════════════════════════════════════════════
# MAIN WINDOW
# ═══════════════════════════════════════════════════════════════════════════

SUPPORTED_FORMATS = "Audio Files (*.mp3 *.wav *.ogg *.flac *.aac *.m4a *.wma)"
EXPORT_FORMATS = ["mp3", "wav", "ogg", "flac", "aac"]


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{APP_NAME}  v{APP_VERSION}")
        self.setMinimumSize(900, 640)
        self.resize(1020, 700)
        self.setStyleSheet(STYLESHEET)

        self.audio: AudioSegment | None = None
        self.file_path: str = ""

        self._build_menubar()
        self._build_ui()
        self.statusBar().showMessage("Ready — load an audio file to begin.")

    # ---------------------------------------------------------------
    # UI CONSTRUCTION
    # ---------------------------------------------------------------
    def _build_menubar(self):
        bar = self.menuBar()
        file_menu = bar.addMenu("File")
        file_menu.addAction(self._action("Open…", "Ctrl+O", self._open_file))
        file_menu.addSeparator()
        file_menu.addAction(self._action("Exit", "Ctrl+Q", self.close))

        help_menu = bar.addMenu("Help")
        help_menu.addAction(self._action("About", "", self._about))

    def _action(self, text, shortcut, slot):
        a = QAction(text, self)
        if shortcut:
            a.setShortcut(shortcut)
        a.triggered.connect(slot)
        return a

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(16, 12, 16, 8)
        root.setSpacing(10)

        # ── Top bar: file info + open button ──
        top = QHBoxLayout()
        self.file_label = QLabel("No file loaded")
        self.file_label.setObjectName("fileinfo")
        top.addWidget(self.file_label, 1)

        open_btn = QPushButton("  Open File  ")
        open_btn.setObjectName("primary")
        open_btn.setCursor(Qt.PointingHandCursor)
        open_btn.clicked.connect(self._open_file)
        top.addWidget(open_btn)
        root.addLayout(top)

        # ── Waveform ──
        wave_group = QGroupBox("Waveform")
        wave_lay = QVBoxLayout(wave_group)
        wave_lay.setContentsMargins(6, 6, 6, 6)
        self.waveform = WaveformCanvas()
        self.waveform.selection_changed.connect(self._on_selection)
        wave_lay.addWidget(self.waveform)

        # Selection readout
        sel_row = QHBoxLayout()
        self.sel_label = QLabel("Click and drag on the waveform to select a region")
        self.sel_label.setObjectName("subheading")
        sel_row.addWidget(self.sel_label)
        clear_sel = QPushButton("Clear selection")
        clear_sel.clicked.connect(self._clear_selection)
        sel_row.addWidget(clear_sel)
        wave_lay.addLayout(sel_row)
        root.addWidget(wave_group, 1)

        # ── Tool panels side by side ──
        tools_row = QHBoxLayout()
        tools_row.setSpacing(10)

        # CUT panel
        cut_group = QGroupBox("Cut / Trim")
        cut_lay = QVBoxLayout(cut_group)

        cut_desc = QLabel("Select a region on the waveform, then choose an action.")
        cut_desc.setObjectName("subheading")
        cut_desc.setWordWrap(True)
        cut_lay.addWidget(cut_desc)

        cut_btns = QHBoxLayout()
        self.btn_keep = QPushButton("Keep selection")
        self.btn_keep.setObjectName("primary")
        self.btn_keep.setCursor(Qt.PointingHandCursor)
        self.btn_keep.clicked.connect(self._cut_keep)
        cut_btns.addWidget(self.btn_keep)

        self.btn_remove = QPushButton("Remove selection")
        self.btn_remove.setObjectName("danger")
        self.btn_remove.setCursor(Qt.PointingHandCursor)
        self.btn_remove.clicked.connect(self._cut_remove)
        cut_btns.addWidget(self.btn_remove)
        cut_lay.addLayout(cut_btns)
        tools_row.addWidget(cut_group)

        # CONVERT panel
        conv_group = QGroupBox("Convert / Export")
        conv_lay = QVBoxLayout(conv_group)

        fmt_row = QHBoxLayout()
        fmt_row.addWidget(QLabel("Format:"))
        self.fmt_combo = QComboBox()
        self.fmt_combo.addItems([f.upper() for f in EXPORT_FORMATS])
        fmt_row.addWidget(self.fmt_combo)
        conv_lay.addLayout(fmt_row)

        br_row = QHBoxLayout()
        br_row.addWidget(QLabel("Bitrate:"))
        self.br_combo = QComboBox()
        self.br_combo.addItems(["128k", "192k", "256k", "320k"])
        self.br_combo.setCurrentIndex(2)
        br_row.addWidget(self.br_combo)
        conv_lay.addLayout(br_row)

        sr_row = QHBoxLayout()
        sr_row.addWidget(QLabel("Sample rate:"))
        self.sr_combo = QComboBox()
        self.sr_combo.addItems(["22050", "44100", "48000", "96000"])
        self.sr_combo.setCurrentIndex(1)
        sr_row.addWidget(self.sr_combo)
        conv_lay.addLayout(sr_row)

        self.export_btn = QPushButton("  Export  ")
        self.export_btn.setObjectName("primary")
        self.export_btn.setCursor(Qt.PointingHandCursor)
        self.export_btn.clicked.connect(self._export)
        conv_lay.addWidget(self.export_btn)
        tools_row.addWidget(conv_group)

        root.addLayout(tools_row)

    # ---------------------------------------------------------------
    # FILE LOADING
    # ---------------------------------------------------------------
    def _open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Open Audio", "", SUPPORTED_FORMATS)
        if not path:
            return
        self.statusBar().showMessage(f"Loading {Path(path).name}…")
        QApplication.processEvents()
        try:
            self.audio = AudioSegment.from_file(path)
            self.file_path = path
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Could not open file:\n{e}")
            self.statusBar().showMessage("Ready")
            return

        # Prepare mono float samples for waveform
        raw = self.audio.set_channels(1).raw_data
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
        samples /= 32768.0  # normalise to -1..1

        self.waveform.load_audio(samples, self.audio.frame_rate)

        name = Path(path).name
        dur = len(self.audio) / 1000
        ch = self.audio.channels
        sr = self.audio.frame_rate
        self.file_label.setText(
            f"{name}   |   {dur:.1f}s   |   {sr} Hz   |   {'Stereo' if ch == 2 else 'Mono'}   |   "
            f"{self.audio.sample_width * 8}-bit"
        )
        self.sel_label.setText("Click and drag on the waveform to select a region")
        self.statusBar().showMessage(f"Loaded {name}")

    # ---------------------------------------------------------------
    # SELECTION HANDLING
    # ---------------------------------------------------------------
    def _on_selection(self, start: float, end: float):
        self.sel_label.setText(f"Selected: {start:.2f}s → {end:.2f}s  ({end - start:.2f}s)")
        self.sel_label.setStyleSheet(f"color: {SUCCESS};")

    def _clear_selection(self):
        self.waveform.clear_selection()
        self.sel_label.setText("Click and drag on the waveform to select a region")
        self.sel_label.setStyleSheet(f"color: {TEXT_DIM};")

    # ---------------------------------------------------------------
    # CUT TOOLS
    # ---------------------------------------------------------------
    def _require_audio(self) -> bool:
        if self.audio is None:
            QMessageBox.warning(self, "No file", "Open an audio file first.")
            return False
        return True

    def _require_selection(self) -> tuple[int, int] | None:
        sel = self.waveform.get_selection()
        if sel is None:
            QMessageBox.information(self, "No selection", "Select a region on the waveform first.")
            return None
        return int(sel[0] * 1000), int(sel[1] * 1000)  # ms

    def _cut_keep(self):
        if not self._require_audio():
            return
        bounds = self._require_selection()
        if bounds is None:
            return
        start_ms, end_ms = bounds
        self.audio = self.audio[start_ms:end_ms]
        self._reload_waveform()
        self.statusBar().showMessage(f"Trimmed to selection ({start_ms}–{end_ms} ms)")

    def _cut_remove(self):
        if not self._require_audio():
            return
        bounds = self._require_selection()
        if bounds is None:
            return
        start_ms, end_ms = bounds
        self.audio = self.audio[:start_ms] + self.audio[end_ms:]
        self._reload_waveform()
        self.statusBar().showMessage(f"Removed selection ({start_ms}–{end_ms} ms)")

    def _reload_waveform(self):
        raw = self.audio.set_channels(1).raw_data
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
        samples /= 32768.0
        self.waveform.load_audio(samples, self.audio.frame_rate)
        dur = len(self.audio) / 1000
        self.file_label.setText(
            f"{Path(self.file_path).name} (edited)   |   {dur:.1f}s   |   "
            f"{self.audio.frame_rate} Hz   |   "
            f"{'Stereo' if self.audio.channels == 2 else 'Mono'}"
        )
        self._clear_selection()

    # ---------------------------------------------------------------
    # EXPORT / CONVERT
    # ---------------------------------------------------------------
    def _export(self):
        if not self._require_audio():
            return

        fmt = EXPORT_FORMATS[self.fmt_combo.currentIndex()]
        bitrate = self.br_combo.currentText()
        sample_rate = int(self.sr_combo.currentText())

        default_name = Path(self.file_path).stem + f"_export.{fmt}"
        save_path, _ = QFileDialog.getSaveFileName(
            self, "Export Audio", default_name,
            f"{fmt.upper()} Files (*.{fmt})"
        )
        if not save_path:
            return

        self.statusBar().showMessage(f"Exporting to {fmt.upper()}…")
        QApplication.processEvents()

        try:
            audio_out = self.audio.set_frame_rate(sample_rate)
            export_params = {"format": fmt}
            if fmt == "mp3":
                export_params["bitrate"] = bitrate
            audio_out.export(save_path, **export_params)
            self.statusBar().showMessage(f"Exported: {save_path}")
            QMessageBox.information(self, "Done", f"File saved:\n{save_path}")
        except Exception as e:
            QMessageBox.critical(self, "Export error", str(e))
            self.statusBar().showMessage("Export failed")

    # ---------------------------------------------------------------
    # MISC
    # ---------------------------------------------------------------
    def _about(self):
        QMessageBox.about(
            self, "About",
            f"<h2>{APP_NAME}</h2>"
            f"<p>Version {APP_VERSION}</p>"
            f"<p>Audio editor — cut, convert, and visualise.</p>"
            f"<p style='color:{TEXT_DIM}'>Built with PyQt5, pydub, matplotlib.</p>"
        )


# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setApplicationName(APP_NAME)

    # Dark palette as Fusion base
    palette = QPalette()
    palette.setColor(QPalette.Window, QColor(DARK))
    palette.setColor(QPalette.WindowText, QColor(TEXT))
    palette.setColor(QPalette.Base, QColor(SURFACE))
    palette.setColor(QPalette.AlternateBase, QColor(CARD))
    palette.setColor(QPalette.Text, QColor(TEXT))
    palette.setColor(QPalette.Button, QColor(CARD))
    palette.setColor(QPalette.ButtonText, QColor(TEXT))
    palette.setColor(QPalette.Highlight, QColor(ACCENT))
    palette.setColor(QPalette.HighlightedText, QColor(DARK))
    app.setPalette(palette)

    # ── License gate ──
    if not check_license():
        dlg = ActivationDialog()
        if dlg.exec_() != QDialog.Accepted or not dlg.activated:
            sys.exit(0)

    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
