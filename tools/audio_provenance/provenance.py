#!/usr/bin/env python3
"""
Audio provenance inspector + container-metadata cleaner.

WHAT THIS DOES (and what it deliberately does NOT do)
-----------------------------------------------------
"Is this AI?" data lives in three separate layers of an audio file, and they
differ enormously in how removable they are:

  Layer 1  Container metadata (ID3 / RIFF-INFO / BWF bext / MP4 atoms /
           Vorbis comments).  Human/structured tags that ride ALONGSIDE the
           audio stream.  Trivial and legitimate to remove (privacy tools do
           it daily).  ->  This script INSPECTS and STRIPS layer 1.

  Layer 2  C2PA "Content Credentials": a cryptographically SIGNED provenance
           manifest embedded in the file (JUMBF).  Tamper-evident, so it can
           only be removed wholesale, not edited.  Note: under EU AI Act
           Art. 50, machine-readable marking of AI content is slated to become
           mandatory (reported effective 2026-08-02).  ->  This script DETECTS
           and REPORTS layer 2.  It does not strip it.

  Layer 3  Signal watermarks (e.g. Google SynthID) woven into the waveform,
           PLUS the model's intrinsic statistical fingerprint (spectral tells,
           segment-stitch artifacts, machine-precise micro-timing).  Nothing
           was "added" you can subtract; it is how the audio came out.
           ->  This script does NOT remove layer 3, by design.  Distributor
           screening reads the ACOUSTICS, not the tags, so stripping metadata
           does not make AI audio pass a classifier.  The only thing that
           changes the signal enough is genuine human transformation
           (re-performing, live instrumentation, real arrangement/mix work),
           which is also what current copyright guidance rewards.

Pure standard library.  No third-party dependencies, no re-encoding: layer-1
stripping rewrites only the metadata regions and copies the audio bytes
verbatim, so there is zero generation loss and no new encoder signature.

Usage:
    python3 provenance.py inspect  IN.mp3
    python3 provenance.py clean    IN.mp3  [-o OUT.mp3]   # default: *.clean.ext
"""
from __future__ import annotations

import argparse
import os
import struct
import sys

SUPPORTED_STRIP = {".mp3", ".wav", ".flac"}
SUPPORTED_INSPECT = SUPPORTED_STRIP | {".m4a", ".mp4", ".aac", ".ogg", ".oga", ".opus", ".flac"}

# Byte signatures that, if present anywhere, indicate a C2PA / JUMBF manifest.
C2PA_SIGNATURES = (b"jumbf", b"c2pa", b"urn:uuid:", b"contentauth")


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _read(path: str) -> bytes:
    with open(path, "rb") as fh:
        return fh.read()


def _syncsafe(b: bytes) -> int:
    """Decode a 4-byte ID3 synchsafe integer (7 bits per byte)."""
    return (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3]


def _scan_c2pa(data: bytes) -> bool:
    low = data.lower()
    return any(sig in low for sig in C2PA_SIGNATURES)


# --------------------------------------------------------------------------- #
# MP3 / ID3
# --------------------------------------------------------------------------- #
def _id3v2_len(data: bytes) -> int:
    """Return total byte length of a leading ID3v2 tag, or 0 if none."""
    if len(data) < 10 or data[:3] != b"ID3":
        return 0
    size = _syncsafe(data[6:10])
    total = 10 + size
    # An optional footer (flag bit 4) adds 10 bytes.
    if data[5] & 0x10:
        total += 10
    return total


def inspect_mp3(data: bytes) -> dict:
    info: dict = {"format": "MP3 (ID3)", "layers": {}}
    tags = []

    v2 = _id3v2_len(data)
    if v2:
        # Pull frame IDs of interest from the tag body for visibility.
        body = data[10:v2]
        frames = []
        i = 0
        while i + 10 <= len(body):
            fid = body[i:i + 4]
            if not fid.strip(b"\x00") or not fid.isalnum():
                break
            fsize = struct.unpack(">I", body[i + 4:i + 8])[0]
            frames.append(fid.decode("latin-1", "replace"))
            i += 10 + fsize
            if fsize == 0:
                break
        flagged = [f for f in frames if f in ("TENC", "TSSE", "COMM", "TXXX", "WXXX")]
        tags.append(f"ID3v2 tag ({v2} bytes); frames: {', '.join(frames) or 'none'}")
        if flagged:
            tags.append(f"  provenance-relevant frames present: {', '.join(flagged)}")

    if len(data) >= 128 and data[-128:-125] == b"TAG":
        tags.append("ID3v1 trailer (128 bytes)")

    info["layers"]["1_container"] = tags or ["no ID3 tags found"]
    info["layers"]["2_c2pa"] = _scan_c2pa(data)
    return info


def clean_mp3(data: bytes) -> bytes:
    """Remove leading ID3v2 and trailing ID3v1; copy audio frames verbatim."""
    start = _id3v2_len(data)
    end = len(data)
    if end - start >= 128 and data[end - 128:end - 125] == b"TAG":
        end -= 128
    return data[start:end]


# --------------------------------------------------------------------------- #
# WAV / RIFF
# --------------------------------------------------------------------------- #
_WAV_KEEP = {b"fmt ", b"data", b"fact"}  # everything required to decode PCM


def _iter_riff(body: bytes):
    i = 0
    while i + 8 <= len(body):
        cid = body[i:i + 4]
        size = struct.unpack("<I", body[i + 4:i + 8])[0]
        payload = body[i + 8:i + 8 + size]
        yield cid, payload, size
        i += 8 + size + (size & 1)  # chunks are word-aligned


def inspect_wav(data: bytes) -> dict:
    info: dict = {"format": "WAV (RIFF)", "layers": {}}
    tags = []
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        info["layers"]["1_container"] = ["not a valid RIFF/WAVE file"]
        info["layers"]["2_c2pa"] = _scan_c2pa(data)
        return info
    for cid, _payload, size in _iter_riff(data[12:]):
        name = cid.decode("latin-1", "replace")
        if cid not in _WAV_KEEP:
            tags.append(f"metadata chunk '{name}' ({size} bytes)")
    info["layers"]["1_container"] = tags or ["no extra metadata chunks"]
    info["layers"]["2_c2pa"] = _scan_c2pa(data)
    return info


def clean_wav(data: bytes) -> bytes:
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError("not a RIFF/WAVE file")
    kept = bytearray(b"WAVE")
    for cid, payload, size in _iter_riff(data[12:]):
        if cid in _WAV_KEEP:
            kept += cid + struct.pack("<I", size) + payload
            if size & 1:
                kept += b"\x00"
    out = b"RIFF" + struct.pack("<I", len(kept)) + kept
    return out


# --------------------------------------------------------------------------- #
# FLAC
# --------------------------------------------------------------------------- #
# Metadata block types: 0 STREAMINFO, 1 PADDING, 2 APPLICATION, 3 SEEKTABLE,
# 4 VORBIS_COMMENT, 5 CUESHEET, 6 PICTURE.  Keep only the ones needed to decode.
_FLAC_KEEP_TYPES = {0, 3}  # STREAMINFO (mandatory) + SEEKTABLE (useful, neutral)
_FLAC_TYPE_NAMES = {
    0: "STREAMINFO", 1: "PADDING", 2: "APPLICATION", 3: "SEEKTABLE",
    4: "VORBIS_COMMENT", 5: "CUESHEET", 6: "PICTURE",
}


def _iter_flac_blocks(data: bytes):
    i = 4  # skip "fLaC"
    while i + 4 <= len(data):
        header = data[i]
        last = bool(header & 0x80)
        btype = header & 0x7F
        size = (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]
        payload = data[i + 4:i + 4 + size]
        yield btype, payload, last
        i += 4 + size
        if last:
            break
    yield None, data[i:], True  # remaining = framed audio


def inspect_flac(data: bytes) -> dict:
    info: dict = {"format": "FLAC", "layers": {}}
    tags = []
    if data[:4] != b"fLaC":
        info["layers"]["1_container"] = ["not a valid FLAC stream"]
        info["layers"]["2_c2pa"] = _scan_c2pa(data)
        return info
    for btype, payload, _last in _iter_flac_blocks(data):
        if btype is None:
            break
        name = _FLAC_TYPE_NAMES.get(btype, f"type {btype}")
        if btype not in _FLAC_KEEP_TYPES:
            tags.append(f"metadata block {name} ({len(payload)} bytes)")
    info["layers"]["1_container"] = tags or ["no removable metadata blocks"]
    info["layers"]["2_c2pa"] = _scan_c2pa(data)
    return info


def clean_flac(data: bytes) -> bytes:
    if data[:4] != b"fLaC":
        raise ValueError("not a FLAC stream")
    blocks = []
    audio = b""
    for btype, payload, _last in _iter_flac_blocks(data):
        if btype is None:
            audio = payload
            break
        if btype in _FLAC_KEEP_TYPES:
            blocks.append((btype, payload))
    out = bytearray(b"fLaC")
    for idx, (btype, payload) in enumerate(blocks):
        last = 0x80 if idx == len(blocks) - 1 else 0x00
        out += bytes([last | (btype & 0x7F)])
        out += bytes([(len(payload) >> 16) & 0xFF,
                      (len(payload) >> 8) & 0xFF,
                      len(payload) & 0xFF])
        out += payload
    out += audio
    return bytes(out)


# --------------------------------------------------------------------------- #
# Dispatch
# --------------------------------------------------------------------------- #
_INSPECTORS = {".mp3": inspect_mp3, ".wav": inspect_wav, ".flac": inspect_flac}
_CLEANERS = {".mp3": clean_mp3, ".wav": clean_wav, ".flac": clean_flac}


def _report(path: str, info: dict) -> None:
    print(f"\n=== {os.path.basename(path)} : {info['format']} ===")
    print("Layer 1  container metadata (removable):")
    for line in info["layers"]["1_container"]:
        print(f"    - {line}")
    c2pa = info["layers"]["2_c2pa"]
    print("Layer 2  C2PA Content Credentials:")
    print(f"    - {'DETECTED (signed provenance present)' if c2pa else 'none detected'}")
    print("Layer 3  signal watermark / model fingerprint:")
    print("    - not inspectable here; lives in the waveform, not the file "
          "structure.")
    print("      Use the SynthID detector portal / a C2PA verifier and an "
          "acoustic")
    print("      classifier to assess it.  Metadata stripping does NOT remove "
          "it.")


def cmd_inspect(path: str) -> int:
    ext = os.path.splitext(path)[1].lower()
    data = _read(path)
    inspector = _INSPECTORS.get(ext)
    if inspector:
        _report(path, inspector(data))
    else:
        print(f"\n=== {os.path.basename(path)} ===")
        print(f"Inspect-only for '{ext}'.  Container structure not parsed by "
              "this tool;")
        print("C2PA scan:",
              "DETECTED" if _scan_c2pa(data) else "none detected")
    return 0


class CleanResult:
    """Outcome of a clean operation, usable by both CLI and GUI."""
    def __init__(self, path, out, before, after, n_in, n_out):
        self.path = path
        self.out = out
        self.before = before
        self.after = after
        self.n_in = n_in
        self.n_out = n_out
        self.removed = n_in - n_out


def process_clean(path: str, out: str | None) -> CleanResult:
    """Strip Layer-1 metadata; write output; verify. Raises ValueError on bad input."""
    ext = os.path.splitext(path)[1].lower()
    cleaner = _CLEANERS.get(ext)
    if not cleaner:
        raise ValueError(
            f"Layer-1 stripping not supported for '{ext}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_STRIP))}")

    data = _read(path)
    before = _INSPECTORS[ext](data)
    cleaned = cleaner(data)

    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.clean{e}"
    with open(out, "wb") as fh:
        fh.write(cleaned)

    after = _INSPECTORS[ext](_read(out))
    return CleanResult(path, out, before, after, len(data), len(cleaned))


def cmd_clean(path: str, out: str | None) -> int:
    ext = os.path.splitext(path)[1].lower()
    if ext not in _CLEANERS:
        print(f"error: layer-1 stripping not implemented for '{ext}'. "
              f"Supported: {', '.join(sorted(SUPPORTED_STRIP))}", file=sys.stderr)
        return 2

    res = process_clean(path, out)
    if res.before["layers"]["2_c2pa"]:
        print("NOTE: a C2PA signed manifest was detected. This tool removes "
              "Layer-1\n      container metadata only; it does not strip "
              "signed provenance.\n      See EU AI Act Art. 50 before "
              "distributing AI content without it.")

    print(f"\nWrote {res.out}  ({res.n_in} -> {res.n_out} bytes; "
          f"{res.removed} bytes of metadata removed)")
    print("Verification of output:")
    _report(res.out, res.after)
    print("\nReminder: the audio stream was copied verbatim (no re-encode). "
          "That means\nLayer-3 acoustic fingerprints are unchanged by design — "
          "this is a metadata\ncleaner, not a watermark remover.")
    return 0


def cmd_gui(initial: str | None = None) -> int:
    """Minimal click-to-run window: choose a file, inspect, clean, save."""
    try:
        import tkinter as tk
        from tkinter import filedialog, scrolledtext
    except Exception as exc:  # noqa: BLE001
        print(f"error: GUI needs tkinter, which isn't available ({exc}).\n"
              "Use the CLI instead:  python provenance.py clean FILE", file=sys.stderr)
        return 2

    state = {"path": initial}

    root = tk.Tk()
    root.title("AI SoundStripper")
    root.geometry("720x560")

    header = tk.Label(root, text="AI SoundStripper",
                      font=("Segoe UI", 16, "bold"))
    header.pack(pady=(12, 0))
    tk.Label(root,
             text="Inspects AI-provenance layers and strips Layer-1 container "
                  "metadata.\nMetadata cleaner — NOT a watermark remover "
                  "(see notes below).",
             fg="#555", justify="center").pack()

    path_var = tk.StringVar(value=initial or "No file selected")
    tk.Label(root, textvariable=path_var, fg="#0a4",
             wraplength=680).pack(pady=(8, 4))

    log = scrolledtext.ScrolledText(root, height=20, wrap="word",
                                    font=("Consolas", 9))
    log.pack(fill="both", expand=True, padx=12, pady=6)

    def write(msg):
        log.insert("end", msg + "\n")
        log.see("end")
        root.update_idletasks()

    def show_report(title, info):
        write(f"=== {title} : {info['format']} ===")
        write("Layer 1  container metadata (removable):")
        for line in info["layers"]["1_container"]:
            write(f"    - {line}")
        write("Layer 2  C2PA Content Credentials: "
              + ("DETECTED" if info["layers"]["2_c2pa"] else "none detected"))
        write("Layer 3  signal watermark / model fingerprint: lives in the")
        write("    waveform, not the file. Metadata stripping does NOT remove it.")
        write("")

    def pick():
        f = filedialog.askopenfilename(
            title="Choose an audio file",
            filetypes=[("Audio", "*.mp3 *.wav *.flac *.m4a *.mp4 *.aac *.ogg"),
                       ("All files", "*.*")])
        if f:
            state["path"] = f
            path_var.set(f)
            do_inspect()

    def do_inspect():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return
        ext = os.path.splitext(p)[1].lower()
        ins = _INSPECTORS.get(ext)
        log.delete("1.0", "end")
        if ins:
            show_report(os.path.basename(p), ins(_read(p)))
        else:
            write(f"Inspect-only for '{ext}'. C2PA scan: "
                  + ("DETECTED" if _scan_c2pa(_read(p)) else "none detected") + "\n")

    def do_clean():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return
        try:
            res = process_clean(p, None)
        except ValueError as exc:
            write(f"Cannot clean: {exc}\n")
            return
        if res.before["layers"]["2_c2pa"]:
            write("NOTE: signed C2PA manifest detected; this tool does not "
                  "strip it (see EU AI Act Art. 50).")
        write(f"Saved: {res.out}")
        write(f"  {res.n_in} -> {res.n_out} bytes "
              f"({res.removed} bytes of metadata removed)")
        write("  Audio stream copied verbatim — no re-encode, same format.\n")
        show_report("output (verified)", res.after)
        write("Reminder: Layer-3 acoustic fingerprint is unchanged by design.\n")

    bar = tk.Frame(root)
    bar.pack(pady=(0, 12))
    tk.Button(bar, text="1. Upload audio…", command=pick,
              width=16).pack(side="left", padx=6)
    tk.Button(bar, text="2. Inspect", command=do_inspect,
              width=14).pack(side="left", padx=6)
    tk.Button(bar, text="3. Run (strip + save)", command=do_clean,
              width=20, bg="#1565c0", fg="white").pack(side="left", padx=6)

    if initial and os.path.isfile(initial):
        do_inspect()

    root.mainloop()
    return 0


_SUBCOMMANDS = {"inspect", "clean", "gui"}


def main(argv: list[str] | None = None) -> int:
    raw = list(sys.argv[1:]) if argv is None else list(argv)

    # No arguments at all -> launch the GUI (double-click friendly).
    if not raw:
        return cmd_gui(None)

    # A bare file path (e.g. an audio file dropped onto the .exe/.bat) -> clean.
    if len(raw) == 1 and raw[0] not in _SUBCOMMANDS and os.path.isfile(raw[0]):
        raw = ["clean", raw[0]]

    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    pi = sub.add_parser("inspect", help="report which provenance layers are present")
    pi.add_argument("file")
    pc = sub.add_parser("clean", help="strip Layer-1 container metadata (no re-encode)")
    pc.add_argument("file")
    pc.add_argument("-o", "--out", default=None, help="output path")
    pg = sub.add_parser("gui", help="launch the click-to-run window")
    pg.add_argument("file", nargs="?", default=None, help="optional file to preload")
    args = p.parse_args(raw)

    if args.cmd == "gui":
        return cmd_gui(args.file)

    if not os.path.isfile(args.file):
        print(f"error: no such file: {args.file}", file=sys.stderr)
        return 2

    if args.cmd == "inspect":
        return cmd_inspect(args.file)
    return cmd_clean(args.file, args.out)


if __name__ == "__main__":
    raise SystemExit(main())
