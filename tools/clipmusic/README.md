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
- **Clipchamp‑style edit features** (all baked into the render):
  - **Effects / looks**: B&W, Vintage, Sepia, Vignette, Blur, Sharpen, Chromatic,
    Film Grain, Warm, Cool, Invert, Glow.
  - **Adjust colours**: brightness / contrast / saturation sliders.
  - **Fade** in / out (video + audio).
  - **Ken Burns** slow‑zoom for still images.
  - **Slideshow**: add 2+ images/clips → crossfaded sequence with selectable
    **transitions** (fade, dissolve, wipe, slide, circle, radial…).
  - **Title** card (position + size) on top of timed lyrics.
- **Export & Share center** (full spec) — three render states (rendering →
  "Your video is ready." with thumbnail + size/duration/resolution/path →
  share enabled), a **"Download your video"** panel with *Save to your computer*
  first, then Google Drive / YouTube / TikTok / Dropbox / LinkedIn. Renders to a
  local folder first; online destinations are **V1 helpers** (open the platform
  + the export folder, never auto‑upload), are **disabled while offline**, and
  LinkedIn copies a ready‑made caption. Presets: 1080p / 4K / TikTok‑vertical /
  Square / LinkedIn / audio‑only. Cancel, Open folder, Copy path, Export again.
- **Digests everything you drop** — multiple songs are concatenated into one
  master track; multiple images/clips become a crossfaded slideshow.
- **Light & robust** — single‑pass ffmpeg, no heavy ML by default. **Hardware
  acceleration is optional and OFF by default** (CPU/libx264, most compatible);
  pick NVENC/QSV/AMF/Auto and it **auto‑falls back to CPU** if the GPU encoder
  isn't available. Set a **scratch folder** for temp/intermediate files.
- **AI Stem Split (Demucs)** — optional, local: if Demucs is installed it splits
  the track into vocals / instrumental and adds them as new timeline tracks
  (otherwise it tells you the one‑line install). Nothing is uploaded.

Lyrics format in the properties box — one cue per line: `start  end  text`
(e.g. `0  4  My first line`).

## Run from source

```bash
pip install PyQt5 numpy          # librosa optional, for real beat detection
python clipmusic.py
```
FFmpeg is auto‑downloaded on first use (or put `ffmpeg` on PATH).

## Install on Windows (no Python needed)

Download from the **clipmusic-latest** release:
- **ClipMusic-Setup.exe** — installer (Start Menu + Desktop shortcut, uninstaller).
- **ClipMusic.exe** — portable single file.

These are built automatically by the GitHub Actions workflow
(`.github/workflows/build-clipmusic.yml`) on `windows-latest` with PyInstaller +
NSIS, and published as release assets.

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
