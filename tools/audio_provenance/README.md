# AI SoundStripper

A small, dependency-free tool that tells you **which provenance layers an audio
file carries** and cleanly removes the one layer that is legitimately and
losslessly removable: container metadata. Ships with a click-to-run window and
a self-contained Windows `Setup.exe` installer.

> **Scope, stated plainly:** this is a **metadata cleaner, not a watermark
> remover.** It strips Layer-1 container tags losslessly and reports Layers 2/3.
> It does **not** remove signal watermarks or model fingerprints (Layer 3) —
> those are acoustic, not removable by editing the file, and they are what
> distributor classifiers actually screen on. See the table below.

## Install on Windows (local machine)

Pick whichever fits — all of them keep the audio stream byte-for-byte and write
output in the **same format** as the input (`song.mp3` -> `song.clean.mp3`):

| You want… | Do this | Result |
|-----------|---------|--------|
| **A self-contained installer** (recommended, no Python needed) | Double-click **`AISoundStripper-Setup.exe`** | Install wizard → `Program Files\AI SoundStripper`, branded Desktop + Start Menu shortcuts, Add/Remove Programs entry, uninstaller. Bundles Python + Tcl/Tk, so the target PC needs **nothing** preinstalled. |
| **A `.bat` installer** | Double-click **`install.bat`** | Per-user install to `%LOCALAPPDATA%\AISoundStripper`, adds a `soundstrip` command to PATH, shortcuts. No admin rights. Needs Python 3 on the PC. |
| **No install at all** | Drag an audio file onto **`AI SoundStripper.bat`** (or double-click it for the window) | Runs in place next to `provenance.py`. Needs Python 3. |

After installing, double-click the **AI SoundStripper** desktop icon. The window
gives you four actions on any file:

- **Inspect** — shows the readable tags (artist/title/etc.) *and* which of the
  three provenance layers are present.
- **Strip junk + save** — removes Layer-1 container metadata losslessly.
- **Imprint tags + save** — writes honest provenance into a saved copy: Artist,
  Title, Album, Year, Genre, Comment, and a **Creation type** field
  (AI-generated / AI-assisted / Human-made / …). Audio is copied verbatim.
- **Detectors…** — opens the Layer-2/3 verifier portals, and (if `c2patool` is
  installed) verifies the C2PA manifest for real.

### The `Setup.exe` installer

`AISoundStripper-Setup.exe` is a single-file Windows installer (NSIS) that wraps
a fully self-contained `AISoundStripper.exe` — the Python interpreter and Tcl/Tk
are bundled inside, so the target PC needs **nothing** preinstalled. It installs
to `Program Files`, drops branded Desktop + Start Menu shortcuts, registers an
Add/Remove Programs entry with the icon, and ships an uninstaller.

It's built in two stages — a PyInstaller one-file `.exe`, then the NSIS wrapper:

```bash
# Linux/macOS, no Windows box required (needs: wine64, nsis):
./build_exe_wine.sh        # -> msi/AISoundStripper-Setup.exe
```

```bat
REM  On Windows (needs Python 3 + NSIS on PATH):
build_exe.bat              REM -> dist\AISoundStripper.exe
cd msi && makensis aisoundstripper.nsi    REM -> msi\AISoundStripper-Setup.exe
```

The installer and both shortcuts use a branded icon
(`msi/aisoundstripper.ico`, regenerate with `python3 msi/make_icon.py`).

## Quick start (any OS, from source)

```bash
python3 provenance.py gui                 # click-to-run window (needs tkinter)
python3 provenance.py inspect mytrack.mp3 # see tags + which layers are present
python3 provenance.py clean   mytrack.mp3 # -> mytrack.clean.mp3 (no re-encode)
python3 provenance.py clean   in.wav -o cleaned.wav

# Imprint provenance tags (writes a copy; audio copied verbatim):
python3 provenance.py tag mytrack.mp3 --artist "DuneSurfer" --title "Dans Ritme" \
        --year 2026 --genre Electronic \
        --creation-type "AI-assisted (human-edited)"   # -> mytrack.tagged.mp3
```

### Imprinting honest provenance (the constructive half)

Stripping removes junk; **tagging adds truth.** `tag` (and the GUI's *Imprint
tags* button) writes standard fields into the right native container tag, so
Explorer, players, and DAWs all read them:

| Field | MP3 (ID3v2.3) | WAV (RIFF INFO) | FLAC (Vorbis) |
|-------|---------------|-----------------|---------------|
| Title / Artist / Album | TIT2 / TPE1 / TALB | INAM / IART / IPRD | TITLE / ARTIST / ALBUM |
| Year / Genre / Comment | TYER / TCON / COMM | ICRD / IGNR / ICMT | DATE / GENRE / COMMENT |
| **Creation type** | TXXX "Creation type" | ICRT | CREATIONTYPE |

The audio stream is copied byte-for-byte — tagging never re-encodes. Re-tagging
replaces values rather than stacking duplicates.

### Layer-2 / Layer-3 detection

`inspect` reports C2PA by byte-scan, and **verifies it for real if `c2patool`
is on your PATH** (`cargo install c2patool` or grab a release binary). There is
no reliable *offline* detector for Layer 3 (SynthID / acoustic fingerprint) —
the GUI's **Detectors…** button links the vendor portals
(`contentcredentials.org/verify`, Google SynthID) instead of pretending to.

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
