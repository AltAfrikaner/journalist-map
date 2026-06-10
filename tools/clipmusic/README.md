# ClipMusic

A standalone, **music‑video** editor — Clipchamp‑style layout, purpose‑built for
turning a song + footage/images into a finished music video. Runs **100% locally
and offline**; online "share" actions only open a browser (your file never
auto‑uploads).

Built on the spec's **Python stack** (PyQt5 + bundled ffmpeg + PyInstaller),
which cross‑builds to a Windows `.exe`.

## What works today (V1)

- **Clipchamp‑style UI** — media library · video preview · visualiser/lyrics
  properties · multi‑track timeline (video / audio / visualiser / lyrics) with
  waveform, beat‑grid and playhead.
- **Import** audio, video, images (file picker **or drag‑and‑drop**).
- **Beat / BPM grid** on the timeline (librosa if installed; steady fallback
  otherwise).
- **Real export** — renders an actual music‑video **MP4** with ffmpeg:
  background image/video + an **audio‑reactive visualiser** (Spectrum, CQT bars,
  Frequencies, Waveform) + **timed lyric overlays**. Also audio‑only MP3/WAV.
- **Export & Share center** — presets (1080p / 4K / TikTok‑vertical / Square /
  LinkedIn / audio‑only), local‑first render with progress, and platform
  destinations (YouTube/TikTok/Drive/Dropbox/LinkedIn) that open in the browser
  after the file is saved. Nothing uploads without you.

Lyrics format in the properties box — one cue per line: `start  end  text`
(e.g. `0  4  My first line`).

## Run from source

```bash
pip install PyQt5 numpy          # librosa optional, for real beat detection
python clipmusic.py
```
FFmpeg is auto‑downloaded on first use (or put `ffmpeg` on PATH).

## Build the Windows .exe

```bat
pip install pyinstaller PyQt5 numpy windnd
pyinstaller --onefile --windowed --name ClipMusic --hidden-import windnd clipmusic.py
```
(or the Wine cross‑build used for the other tools). ffmpeg is fetched on first
run, keeping the installer small.

## Roadmap (from the build spec)

- **V2:** Demucs stem separation, MusicGen, Real‑ESRGAN upscale, MediaPipe smart
  reframe, genre templates, direct platform uploads (OAuth).
- **V3:** beat‑sync auto‑cut montage, AI arrangement, plugin effects.

## Design rules (non‑negotiable)

Render locally first · save the MP4 before any share · only the final MP4 ever
leaves the machine · works fully offline · no login for local export · AI runs
locally · the UI stays as simple as Clipchamp · **music videos, not general
video editing**.
