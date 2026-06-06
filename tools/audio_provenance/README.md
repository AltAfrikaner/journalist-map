# AI SoundStripper

A small, dependency-free tool that tells you **which provenance layers an audio
file carries** and cleanly removes the one layer that is legitimately and
losslessly removable: container metadata. Ships with a click-to-run window and
a Windows installer.

> **Scope, stated plainly:** this is a **metadata cleaner, not a watermark
> remover.** It strips Layer-1 container tags losslessly and reports Layers 2/3.
> It does **not** remove signal watermarks or model fingerprints (Layer 3) —
> those are acoustic, not removable by editing the file, and they are what
> distributor classifiers actually screen on. See the table below.

## Install on Windows (local machine)

Pick whichever fits — all three keep the audio stream byte-for-byte and write
output in the **same format** as the input (`song.mp3` -> `song.clean.mp3`):

| You want… | Do this | Result |
|-----------|---------|--------|
| **A real `.msi` installer** | Double-click **`msi/AISoundStripper.msi`** | Standard Windows Installer. Installs to `Program Files\AI SoundStripper`, creates Desktop + Start Menu shortcuts, and registers in Add/Remove Programs. Needs Python 3 on the PC (the launcher prompts with a download link if it's missing). |
| **A `.bat` installer** | Double-click **`install.bat`** | Per-user install to `%LOCALAPPDATA%\AISoundStripper`, adds a `soundstrip` command to PATH, shortcuts. No admin rights. |
| **A true standalone `.exe`** (no Python needed) | Run **`build_exe.bat`** once on any Windows box with Python | Produces `dist\AISoundStripper.exe` — copy it anywhere and double-click. |
| **No install at all** | Drag an audio file onto **`AI SoundStripper.bat`** (or double-click it for the window) | Runs in place next to `provenance.py`. |

After installing, double-click the **AI SoundStripper** desktop icon: choose
a file → **Inspect** → **Run (strip + save)**. That's the upload → run →
download flow. The CLI is at `Program Files\AI SoundStripper\soundstrip.cmd`.

### The `.msi`

A prebuilt **`msi/AISoundStripper.msi`** is included — double-click to install.

It is a genuine Windows Installer package (verified with `msiinfo`): MajorUpgrade
handling, embedded CAB payload, Start Menu + Desktop shortcuts, Add/Remove
Programs entry. It installs the Python engine + launchers, so the target PC
needs **Python 3** (the launcher detects it and shows a download prompt if it
is absent). To rebuild from source:

```bash
cd msi && ./build_msi.sh          # Linux/macOS, needs: apt-get install wixl
# or on Windows with the WiX Toolset:  candle aisoundstripper.wxs && light aisoundstripper.wixobj
```

The installer and both shortcuts use a branded icon
(`msi/aisoundstripper.ico`, regenerate with `python3 msi/make_icon.py`).

### Self-contained `.msi` (bundles Python — no dependency on the target PC)

If you want an MSI that needs **nothing** preinstalled, there is a second,
fully-wired WiX source (`msi/aisoundstripper-standalone.wxs`) that packages a
PyInstaller one-file `AISoundStripper.exe` instead of the script. It is verified
to compile; it just needs the `.exe`, which must be built **on Windows**
(PyInstaller can't cross-compile from Linux). Two ways:

```bat
REM  All on Windows, one step (needs Python + WiX Toolset v3 on PATH):
build_standalone_msi.bat
REM  -> AISoundStripper-Standalone.msi
```

```bash
# Or split it: build the exe on Windows, then build the MSI anywhere with wixl.
#   on Windows:  pyinstaller --onefile --windowed --icon msi/aisoundstripper.ico \
#                            --name AISoundStripper --distpath msi/dist provenance.py
#   then:        ./build_standalone_msi.sh     # -> AISoundStripper-Standalone.msi
```

(If you build `AISoundStripper.exe` on Windows and hand it to me, I can produce
the standalone `.msi` here with `wixl`.)

## Quick start (any OS, from source)

```bash
python3 provenance.py gui                 # click-to-run window (needs tkinter)
python3 provenance.py inspect mytrack.mp3 # see what's in a file
python3 provenance.py clean   mytrack.mp3 # -> mytrack.clean.mp3 (no re-encode)
python3 provenance.py clean   in.wav -o cleaned.wav
```

Run the tests:

```bash
python3 test_provenance.py
```

Supported for **strip**: `.mp3` (ID3v2/ID3v1), `.wav` (RIFF chunks),
`.flac` (metadata blocks). Inspect also recognises `.m4a/.mp4/.aac/.ogg`.

## The three layers (read this before trusting any "AI remover")

"Is this AI?" data lives in three separate places, and they are *not* equally
removable:

| Layer | What it is | This tool |
|------|------------|-----------|
| **1. Container metadata** | ID3 / RIFF-INFO / BWF `bext` / MP4 atoms / Vorbis comments — tags riding *alongside* the audio | **Inspects + strips** |
| **2. C2PA Content Credentials** | A cryptographically *signed* provenance manifest (JUMBF). Tamper-evident. | **Detects + reports** (does not strip) |
| **3. Signal watermark + model fingerprint** | SynthID-style marks woven into the waveform, plus the model's intrinsic acoustic tells (spectral signature, segment-stitch artifacts, machine-precise timing) | **Not touched, by design** |

## Why this is a metadata cleaner, not a "watermark remover"

- **The audio stream is copied byte-for-byte.** No re-encoding, so there is no
  quality loss and no new encoder signature introduced — but it also means
  **Layer 3 is unchanged**.
- **Distributors screen on acoustics, not tags.** Their classifiers feed the
  waveform through a model and reject above a confidence threshold, often before
  a human listens. A metadata-clean file with an intact acoustic fingerprint
  still gets caught.
- **Layer 3 cannot be surgically subtracted.** Nothing was "added" to a
  separable channel — the fingerprint is how the audio came out. Tools that
  claim to remove it work by aggressive reprocessing (re-EQ, noise/dither,
  time/pitch micro-warp, stem split/recombine, transcode), which degrades the
  audio and loses to detector retraining; published success rates are
  unverifiable vendor claims.
- **Compliance flag (Layer 2).** Reporting indicates EU AI Act Article 50 makes
  machine-readable marking of AI-generated content mandatory from **2026-08-02**.
  Deliberately stripping signed provenance for EU distribution may be a
  compliance issue, not just a grey area. Not legal advice — verify.

## The route that actually works

If the goal is a track that both passes screening *and* is yours to register:
genuine human transformation — re-performing or re-recording elements, layering
live instrumentation or your own vocals, real arrangement and mix work in a DAW.
That changes the signal in ways no model fingerprint survives, and the
hybrid human+AI workflow is what current US Copyright Office guidance points to
for a defensible ownership claim.

## Recommended companions

- `exiftool`, `ffprobe`, `mediainfo` — deeper container inspection.
- `ffmpeg -i in.wav -map_metadata -1 -c:a copy out.wav` — stream-copy strip.
- `c2patool` — read/validate/remove C2PA manifests.
- `verify.contentauthenticity.org` and the SynthID detector portal — to see
  which of the three layers your specific generator's output actually carries.
