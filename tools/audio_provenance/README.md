# Audio Provenance Inspector + Metadata Cleaner

A small, dependency-free CLI that tells you **which provenance layers an audio
file carries** and cleanly removes the one layer that is legitimately and
losslessly removable: container metadata.

## Quick start

```bash
# See what's in a file
python3 provenance.py inspect mytrack.mp3

# Strip container metadata into mytrack.clean.mp3 (same format, no re-encode)
python3 provenance.py clean mytrack.mp3
python3 provenance.py clean mytrack.wav -o cleaned.wav
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
