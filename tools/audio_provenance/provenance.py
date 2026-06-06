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

MP3/WAV/FLAC use a pure standard-library path: no dependencies, no re-encoding
(layer-1 stripping rewrites only the metadata regions and copies the audio bytes
verbatim, so there is zero generation loss). Any OTHER format (m4a/ogg/opus/...)
and audio editing (convert/trim/normalize/cover) route through ffmpeg if it is
available (bundled in the Windows installer); metadata ops there still use
stream-copy, so they remain lossless.

It can also IMPRINT honest provenance: write standard tags (artist, title,
album, year, genre, comment) plus a "creation type" field (e.g. AI-generated /
AI-assisted / human-made) that other software reads. Writing accurate
provenance is the constructive complement to stripping junk metadata.

Usage:
    python3 provenance.py inspect  IN.mp3
    python3 provenance.py clean    IN.mp3  [-o OUT.mp3]   # default: *.clean.ext
    python3 provenance.py tag      IN.mp3  --artist "..." --title "..." \\
                                   --creation-type "AI-assisted (human-edited)"
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import struct
import subprocess
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


# Tokens that mark genuinely useful strings inside a C2PA/JUMBF manifest.
_C2PA_HINTS = (
    "c2pa.", "claim", "generator", "softwareagent", "urn:uuid", "contentauth",
    "signer", "issuer", "sha256", "ps256", "es256", "adobe", "openai", "sora",
    "firefly", "stability", "midjourney", "leonardo", "suno", "udio", "elevenlabs",
)


def c2pa_local(data: bytes):
    """Offline C2PA check. Returns (present, details).

    No external tool needed: if a manifest is present we pull readable strings
    from the JUMBF region (claim generator, signer, action labels) so the user
    sees *what* signed it, not just yes/no.
    """
    low = data.lower()
    hits = [h for h in (low.find(s) for s in C2PA_SIGNATURES) if h != -1]
    if not hits:
        return False, []
    idx = min(hits)
    region = data[max(0, idx - 64): idx + 8192]
    details, seen = [], set()
    for m in re.findall(rb"[\x20-\x7e]{5,}", region):
        t = m.decode("ascii", "replace").strip()
        tl = t.lower()
        if any(k in tl for k in _C2PA_HINTS) and t not in seen and len(t) <= 80:
            seen.add(t)
            details.append(t)
    return True, details[:8]


# External detectors for the layers this script cannot read on its own.
# Layer 2 (C2PA) CAN be verified locally if `c2patool` is installed.
# Layer 3 (SynthID / acoustic) has no reliable offline detector; we link the
# vendor portals rather than pretend to detect it.
# Only ONE genuinely-working public tool: the Content Credentials verifier
# (upload a file, it reads any C2PA manifest). The SynthID link is INFO only —
# there is no public self-serve audio detector — so it is labelled as such.
DETECTOR_VERIFY_URL = "https://contentcredentials.org/verify"
DETECTOR_SYNTHID_INFO = "https://deepmind.google/science/synthid/"


def _tool_path(*names):
    """Find a helper binary: next to the frozen exe, in the PyInstaller bundle,
    beside this script, or on PATH. Pass candidates, e.g. 'ffmpeg.exe','ffmpeg'."""
    dirs = []
    if getattr(sys, "frozen", False):
        dirs.append(os.path.dirname(sys.executable))
    base = getattr(sys, "_MEIPASS", None)
    if base:
        dirs.append(base)
    dirs.append(os.path.dirname(os.path.abspath(__file__)))
    for d in dirs:
        for n in names:
            cand = os.path.join(d, n)
            if os.path.isfile(cand):
                return cand
    for n in names:
        found = shutil.which(n)
        if found:
            return found
    return None


def _c2patool_path():
    return _tool_path("c2patool.exe", "c2patool")


def ffmpeg_path():
    return _tool_path("ffmpeg.exe", "ffmpeg")


def detect_c2pa_external(path: str):
    """Verify the C2PA manifest with c2patool (bundled or on PATH).

    Returns (found, detail): found is True/False/None (None = inconclusive,
    tool absent), detail is a human-readable one-liner or None.
    """
    exe = _c2patool_path()
    if not exe:
        return None, None
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)  # no console flash on Windows
    try:
        r = subprocess.run([exe, path], capture_output=True, text=True,
                           timeout=30, creationflags=flags)
    except Exception as exc:  # noqa: BLE001
        return None, f"c2patool present but failed to run ({exc})"
    blob = ((r.stdout or "") + "\n" + (r.stderr or "")).lower()
    if "no claim" in blob or "no manifest" in blob or "not found" in blob:
        return False, "c2patool: no signed manifest found"
    if r.returncode == 0 and (r.stdout or "").strip():
        gen = ""
        try:
            j = json.loads(r.stdout)
            gen = j.get("claim_generator", "") or ""
            gen = gen.split()[0] if gen else ""
        except Exception:  # noqa: BLE001
            pass
        return True, "c2patool: signed manifest present" + (f" (generator: {gen})" if gen else "")
    first = (r.stdout or r.stderr or "").strip().splitlines()
    return None, "c2patool: " + (first[0] if first else "ran, inconclusive")


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
    info["tags"] = _read_tags_mp3(data)
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
    info["tags"] = _read_tags_wav(data)
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
    info["tags"] = _read_tags_flac(data)
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
# Reading & writing human metadata tags  (the "imprint" feature)
# --------------------------------------------------------------------------- #
# Canonical, user-facing fields (display order). Each maps to the correct native
# tag per container so Explorer / players / DAWs read them. Audio is never
# touched: tagging rewrites only the metadata region and copies samples verbatim.
TAG_FIELDS = ["title", "artist", "album", "year", "genre", "comment", "creation_type"]
TAG_LABELS = {
    "title": "Title", "artist": "Artist", "album": "Album", "year": "Year",
    "genre": "Genre", "comment": "Comment", "creation_type": "Creation type",
}
# Honest provenance values offered in the GUI dropdown (free text also allowed).
CREATION_TYPE_CHOICES = [
    "", "Human-made", "AI-assisted (human-edited)", "AI-generated",
    "Sample-based", "Cover / arrangement", "Field recording",
]

# Saved tag preset (so you don't retype Artist / Creation-type every track).
_PRESET_PATH = os.path.join(os.path.expanduser("~"), ".aisoundstripper_tags.json")


def _load_default_tags() -> dict:
    try:
        with open(_PRESET_PATH, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        return {k: d.get(k, "") for k in TAG_FIELDS}
    except Exception:  # noqa: BLE001
        return {}


def _save_default_tags(tags: dict) -> None:
    try:
        keep = {k: tags.get(k, "") for k in TAG_FIELDS if tags.get(k, "").strip()}
        with open(_PRESET_PATH, "w", encoding="utf-8") as fh:
            json.dump(keep, fh)
    except Exception:  # noqa: BLE001
        pass


# ----- ID3v2 (MP3) --------------------------------------------------------- #
_ID3_TEXT = {"title": "TIT2", "artist": "TPE1", "album": "TALB",
             "year": "TYER", "genre": "TCON"}          # plain text frames
_ID3_TEXT_READ = {v: k for k, v in _ID3_TEXT.items()}
_ID3_TEXT_READ["TDRC"] = "year"                         # v2.4 recording time


def _id3_decode(enc: int, raw: bytes) -> str:
    # Decode FIRST, then drop nulls: trimming raw bytes would split a UTF-16 pair.
    try:
        if enc == 1:
            s = raw.decode("utf-16", "replace")
        elif enc == 2:
            s = raw.decode("utf-16-be", "replace")
        elif enc == 3:
            s = raw.decode("utf-8", "replace")
        else:
            s = raw.decode("latin-1", "replace")
    except Exception:  # noqa: BLE001
        s = raw.decode("latin-1", "replace")
    return s.replace("\x00", "").strip()


def _id3_split_desc(enc: int, raw: bytes):
    """Split a (description, value) pair separated by the encoding's null."""
    if enc in (1, 2):  # UTF-16: terminator is 0x0000 on a 2-byte boundary
        for j in range(0, len(raw) - 1, 2):
            if raw[j] == 0 and raw[j + 1] == 0:
                return _id3_decode(enc, raw[:j]), _id3_decode(enc, raw[j + 2:])
        return "", _id3_decode(enc, raw)
    idx = raw.find(b"\x00")
    if idx == -1:
        return "", _id3_decode(enc, raw)
    return _id3_decode(enc, raw[:idx]), _id3_decode(enc, raw[idx + 1:])


def _read_tags_mp3(data: bytes) -> dict:
    tags: dict = {}
    v2 = _id3v2_len(data)
    if not v2:
        return tags
    body = data[10:v2]
    i = 0
    while i + 10 <= len(body):
        fid = body[i:i + 4]
        if not fid.isalnum():
            break
        fsize = struct.unpack(">I", body[i + 4:i + 8])[0]
        payload = body[i + 10:i + 10 + fsize]
        name = fid.decode("latin-1", "replace")
        i += 10 + fsize
        if fsize == 0 or not payload:
            continue
        if name in _ID3_TEXT_READ:
            tags[_ID3_TEXT_READ[name]] = _id3_decode(payload[0], payload[1:])
        elif name == "COMM" and len(payload) >= 4:
            _, txt = _id3_split_desc(payload[0], payload[4:])  # skip lang(3)
            if txt:
                tags["comment"] = txt
        elif name == "TXXX":
            desc, val = _id3_split_desc(payload[0], payload[1:])
            if desc.strip().lower() in ("creation type", "creationtype", "provenance"):
                tags["creation_type"] = val
            elif val:
                tags.setdefault("_" + (desc or "note"), val)
        elif name in ("TSSE", "TENC"):
            tags.setdefault("software", _id3_decode(payload[0], payload[1:]))
    return tags


def _synchsafe_encode(n: int) -> bytes:
    return bytes([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f])


def _id3_frame(fid: str, payload: bytes) -> bytes:
    return fid.encode("latin-1") + struct.pack(">I", len(payload)) + b"\x00\x00" + payload


def _write_tags_mp3(data: bytes, tags: dict) -> bytes:
    audio = clean_mp3(data)  # strip any existing ID3v2/ID3v1 first
    frames = b""
    for key, fid in _ID3_TEXT.items():
        val = tags.get(key, "").strip()
        if val:
            frames += _id3_frame(fid, b"\x01" + val.encode("utf-16"))  # 0x01 = UTF-16+BOM
    com = tags.get("comment", "").strip()
    if com:
        frames += _id3_frame("COMM", b"\x01eng" + b"\xff\xfe\x00\x00" + com.encode("utf-16"))
    ct = tags.get("creation_type", "").strip()
    if ct:
        frames += _id3_frame("TXXX", b"\x01" + "Creation type".encode("utf-16")
                             + b"\x00\x00" + ct.encode("utf-16"))
    if not frames:
        return audio
    return b"ID3\x03\x00\x00" + _synchsafe_encode(len(frames)) + frames + audio


# ----- WAV / RIFF INFO ----------------------------------------------------- #
_RIFF_INFO = {"title": b"INAM", "artist": b"IART", "album": b"IPRD",
              "year": b"ICRD", "genre": b"IGNR", "comment": b"ICMT",
              "creation_type": b"ICRT"}  # ICRT: nonstandard but valid INFO key
_RIFF_INFO_READ = {v: k for k, v in _RIFF_INFO.items()}
_RIFF_INFO_READ[b"ISFT"] = "software"


def _read_tags_wav(data: bytes) -> dict:
    tags: dict = {}
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        return tags
    for cid, payload, _size in _iter_riff(data[12:]):
        if cid == b"LIST" and payload[:4] == b"INFO":
            for sid, sval, _ss in _iter_riff(payload[4:]):
                txt = sval.split(b"\x00", 1)[0].decode("utf-8", "replace")
                key = _RIFF_INFO_READ.get(sid)
                if key:
                    tags[key] = txt
                elif txt:
                    tags.setdefault("_" + sid.decode("latin-1", "replace"), txt)
    return tags


def _riff_info_chunk(tags: dict) -> bytes:
    body = b"INFO"
    for key, cid in _RIFF_INFO.items():
        val = tags.get(key, "").strip()
        if not val:
            continue
        text = val.encode("utf-8") + b"\x00"
        body += cid + struct.pack("<I", len(text)) + text
        if len(text) & 1:
            body += b"\x00"
    if body == b"INFO":
        return b""
    out = b"LIST" + struct.pack("<I", len(body)) + body
    if len(body) & 1:
        out += b"\x00"
    return out


def _write_tags_wav(data: bytes, tags: dict) -> bytes:
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError("not a RIFF/WAVE file")
    chunks = [(cid, payload) for cid, payload, _s in _iter_riff(data[12:])
              if not (cid == b"LIST" and payload[:4] == b"INFO")]  # drop old INFO
    info = _riff_info_chunk(tags)
    kept = bytearray(b"WAVE")
    inserted = False
    for cid, payload in chunks:
        if cid == b"data" and info and not inserted:
            kept += info
            inserted = True
        kept += cid + struct.pack("<I", len(payload)) + payload
        if len(payload) & 1:
            kept += b"\x00"
    if info and not inserted:
        kept += info
    return b"RIFF" + struct.pack("<I", len(kept)) + bytes(kept)


# ----- FLAC / Vorbis comment ----------------------------------------------- #
_VORBIS = {"title": "TITLE", "artist": "ARTIST", "album": "ALBUM",
           "year": "DATE", "genre": "GENRE", "comment": "COMMENT",
           "creation_type": "CREATIONTYPE"}
_VORBIS_READ = {v: k for k, v in _VORBIS.items()}


def _read_tags_flac(data: bytes) -> dict:
    tags: dict = {}
    if data[:4] != b"fLaC":
        return tags
    for btype, payload, _last in _iter_flac_blocks(data):
        if btype is None:
            break
        if btype != 4:
            continue
        try:
            pos = struct.unpack("<I", payload[:4])[0] + 4  # skip vendor
            count = struct.unpack("<I", payload[pos:pos + 4])[0]
            pos += 4
            for _ in range(count):
                ln = struct.unpack("<I", payload[pos:pos + 4])[0]
                pos += 4
                entry = payload[pos:pos + ln].decode("utf-8", "replace")
                pos += ln
                if "=" in entry:
                    k, v = entry.split("=", 1)
                    key = _VORBIS_READ.get(k.upper())
                    if key:
                        tags[key] = v
                    elif v:
                        tags.setdefault("_" + k, v)
        except Exception:  # noqa: BLE001
            pass
    return tags


def _write_tags_flac(data: bytes, tags: dict) -> bytes:
    if data[:4] != b"fLaC":
        raise ValueError("not a FLAC stream")
    blocks = []
    audio = b""
    for btype, payload, _last in _iter_flac_blocks(data):
        if btype is None:
            audio = payload
            break
        if btype != 4:  # drop any existing VORBIS_COMMENT; we re-add a fresh one
            blocks.append((btype, payload))
    vendor = b"AI SoundStripper"
    vc = struct.pack("<I", len(vendor)) + vendor
    entries = [f"{vk}={tags[key].strip()}".encode("utf-8")
               for key, vk in _VORBIS.items() if tags.get(key, "").strip()]
    vc += struct.pack("<I", len(entries))
    for e in entries:
        vc += struct.pack("<I", len(e)) + e
    blocks.append((4, vc))
    out = bytearray(b"fLaC")
    for idx, (btype, payload) in enumerate(blocks):
        last = 0x80 if idx == len(blocks) - 1 else 0x00
        out += bytes([last | (btype & 0x7f)])
        out += bytes([(len(payload) >> 16) & 0xff, (len(payload) >> 8) & 0xff,
                      len(payload) & 0xff])
        out += payload
    out += audio
    return bytes(out)


# --------------------------------------------------------------------------- #
# Dispatch
# --------------------------------------------------------------------------- #
_INSPECTORS = {".mp3": inspect_mp3, ".wav": inspect_wav, ".flac": inspect_flac}
_CLEANERS = {".mp3": clean_mp3, ".wav": clean_wav, ".flac": clean_flac}
_TAG_READERS = {".mp3": _read_tags_mp3, ".wav": _read_tags_wav, ".flac": _read_tags_flac}
_TAG_WRITERS = {".mp3": _write_tags_mp3, ".wav": _write_tags_wav, ".flac": _write_tags_flac}
SUPPORTED_TAG = set(_TAG_WRITERS)


def read_tags(ext: str, data: bytes) -> dict:
    fn = _TAG_READERS.get(ext)
    return fn(data) if fn else {}


def process_tag(path: str, tags: dict, out: str | None = None):
    """Write metadata tags; audio copied verbatim. Returns (out, n_in, n_out, written)."""
    ext = os.path.splitext(path)[1].lower()
    tags = {k: v for k, v in tags.items() if v}
    n_in = os.path.getsize(path)
    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.tagged{e}"
    writer = _TAG_WRITERS.get(ext)
    if writer:  # native, lossless
        tagged = writer(_read(path), tags)
        with open(out, "wb") as fh:
            fh.write(tagged)
        return out, n_in, len(tagged), read_tags(ext, _read(out))
    if ffmpeg_path() and ext in FFMPEG_AUDIO_EXTS:  # universal via ffmpeg (stream copy)
        ffmpeg_write_tags(path, tags, out)
        return out, n_in, os.path.getsize(out), ffmpeg_read_tags(out)
    raise ValueError(f"tag writing not supported for '{ext}'. "
                     f"Native: {', '.join(sorted(SUPPORTED_TAG))}; "
                     "other formats need ffmpeg (bundled in the installer).")


def inspect_any(path: str) -> dict:
    """Inspect any file: native parser if we have one, else ffmpeg-read tags."""
    ext = os.path.splitext(path)[1].lower()
    ins = _INSPECTORS.get(ext)
    if ins:
        return ins(_read(path))
    data = _read(path)
    info = {"format": ext.lstrip(".").upper() + (" (via ffmpeg)" if ffmpeg_path() else ""),
            "layers": {"1_container": [], "2_c2pa": _scan_c2pa(data)}, "tags": {}}
    if ffmpeg_path():
        tags = ffmpeg_read_tags(path)
        info["tags"] = tags
        info["layers"]["1_container"] = (
            [f"{len(tags)} metadata field(s) read via ffmpeg"] if tags
            else ["no readable container metadata"])
    else:
        info["layers"]["1_container"] = [f"install ffmpeg to read '{ext}' files"]
    return info


# --------------------------------------------------------------------------- #
# ffmpeg engine: universal support for "any sound file" + audio editing
# --------------------------------------------------------------------------- #
# MP3/WAV/FLAC are handled natively above (pure-Python, guaranteed zero re-encode).
# Everything else routes through bundled ffmpeg. Metadata ops use `-c copy`
# (stream copy = lossless, no re-encode); convert/normalize re-encode by nature.
FFMPEG_AUDIO_EXTS = {
    ".m4a", ".mp4", ".m4b", ".aac", ".ogg", ".oga", ".opus", ".aiff", ".aif",
    ".aifc", ".wma", ".alac", ".ac3", ".amr", ".mka", ".wv", ".ape", ".mp3",
    ".wav", ".flac",
}
# ffmpeg's generic metadata keys <-> our canonical fields.
_FFM_META = {"title": "title", "artist": "artist", "album": "album",
             "year": "date", "genre": "genre", "comment": "comment",
             "creation_type": "creation_type"}
_FFM_META_READ = {v: k for k, v in _FFM_META.items()}
_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def have_ffmpeg() -> bool:
    return ffmpeg_path() is not None


def _run_ffmpeg(args: list[str], timeout: int = 300):
    exe = ffmpeg_path()
    if not exe:
        raise ValueError("ffmpeg is not available (install it, or use the installer "
                         "which bundles it). Native MP3/WAV/FLAC still work without it.")
    return subprocess.run([exe, "-nostdin", "-y", *args], capture_output=True,
                          text=True, timeout=timeout, creationflags=_NO_WINDOW)


# Container plumbing that ffmpeg prints but which isn't a user tag.
_FFM_NOISE = {"major_brand", "minor_version", "compatible_brands", "encoder",
              "handler_name", "vendor_id", "duration", "creation_time", "bitrate",
              "start", "encoder_options", "language", "track", "disc"}


def ffmpeg_read_tags(path: str) -> dict:
    """Read container metadata from any format by parsing `ffmpeg -i` (>=4-space
    indented entries are real tags; 'Duration'/'Stream' lines are 2-space)."""
    exe = ffmpeg_path()
    if not exe:
        return {}
    r = subprocess.run([exe, "-nostdin", "-i", path], capture_output=True,
                       text=True, timeout=60, creationflags=_NO_WINDOW)
    tags = {}
    for line in (r.stderr or "").splitlines():
        m = re.match(r"^\s{4,}([A-Za-z0-9_\-]+)\s*:\s*(.+?)\s*$", line)
        if not m:
            continue
        k, v = m.group(1).lower(), m.group(2)
        if k in _FFM_NOISE or not v:
            continue
        canon = _FFM_META_READ.get(k)
        if canon:
            tags.setdefault(canon, v)
        else:
            tags.setdefault("_" + k, v)
    return tags


# MP4-family containers only accept a fixed atom set and silently drop unknown
# keys like creation_type, so we fold it into the comment there to keep it.
_MP4_FAMILY = {".m4a", ".mp4", ".m4b", ".aac"}


def ffmpeg_write_tags(path: str, tags: dict, out: str) -> None:
    ext = os.path.splitext(path)[1].lower()
    tags = dict(tags)
    if ext in _MP4_FAMILY and tags.get("creation_type"):
        base = tags.get("comment", "")
        tags["comment"] = (f"{base} | " if base else "") + \
            f"Creation type: {tags['creation_type']}"
    args = ["-i", path, "-map_metadata", "0", "-c", "copy"]
    for key, ffk in _FFM_META.items():
        if tags.get(key):
            args += ["-metadata", f"{ffk}={tags[key]}"]
    args.append(out)
    r = _run_ffmpeg(args)
    if r.returncode != 0:
        raise ValueError(f"ffmpeg tag write failed: {(r.stderr or '').strip().splitlines()[-1:]}")


def ffmpeg_strip(path: str, out: str) -> None:
    r = _run_ffmpeg(["-i", path, "-map_metadata", "-1", "-map_chapters", "-1",
                     "-c", "copy", out])
    if r.returncode != 0:
        raise ValueError(f"ffmpeg strip failed: {(r.stderr or '').strip().splitlines()[-1:]}")


# Sensible per-target encoder defaults for the convert feature.
_CONVERT_ARGS = {
    ".mp3": ["-c:a", "libmp3lame", "-q:a", "2"],
    ".m4a": ["-c:a", "aac", "-b:a", "256k"],
    ".aac": ["-c:a", "aac", "-b:a", "256k"],
    ".ogg": ["-c:a", "libvorbis", "-q:a", "6"],
    ".opus": ["-c:a", "libopus", "-b:a", "160k"],
    ".flac": ["-c:a", "flac"],
    ".wav": ["-c:a", "pcm_s16le"],
    ".aiff": ["-c:a", "pcm_s16be"],
}


def convert_audio(path: str, target_ext: str, out: str | None = None) -> str:
    target_ext = target_ext if target_ext.startswith(".") else "." + target_ext
    if target_ext not in _CONVERT_ARGS:
        raise ValueError(f"convert target '{target_ext}' not supported. "
                         f"Choose from: {', '.join(sorted(_CONVERT_ARGS))}")
    if out is None:
        out = os.path.splitext(path)[0] + target_ext
    r = _run_ffmpeg(["-i", path, *_CONVERT_ARGS[target_ext], out])
    if r.returncode != 0:
        raise ValueError(f"convert failed: {(r.stderr or '').strip().splitlines()[-1:]}")
    return out


def trim_audio(path: str, start: str | None, end: str | None,
               out: str | None = None) -> str:
    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.trim{e}"
    args = []
    if start:
        args += ["-ss", start]
    if end:
        args += ["-to", end]
    args += ["-i", path, "-c", "copy", out]  # stream copy = lossless trim
    r = _run_ffmpeg(args)
    if r.returncode != 0:  # fall back to a re-encode if copy can't cut cleanly
        r = _run_ffmpeg([*(["-ss", start] if start else []),
                         *(["-to", end] if end else []), "-i", path, out])
        if r.returncode != 0:
            raise ValueError(f"trim failed: {(r.stderr or '').strip().splitlines()[-1:]}")
    return out


def normalize_audio(path: str, out: str | None = None) -> str:
    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.norm{e}"
    r = _run_ffmpeg(["-i", path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", out])
    if r.returncode != 0:
        raise ValueError(f"normalize failed: {(r.stderr or '').strip().splitlines()[-1:]}")
    return out


def set_cover(path: str, image: str, out: str | None = None) -> str:
    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.cover{e}"
    ext = os.path.splitext(path)[1].lower()
    args = ["-i", path, "-i", image, "-map", "0:a", "-map", "1:v", "-c", "copy",
            "-disposition:v", "attached_pic"]
    if ext == ".mp3":
        args += ["-id3v2_version", "3", "-metadata:s:v", "title=Album cover",
                 "-metadata:s:v", "comment=Cover (front)"]
    args.append(out)
    r = _run_ffmpeg(args)
    if r.returncode != 0:
        raise ValueError(f"set cover failed: {(r.stderr or '').strip().splitlines()[-1:]}")
    return out


def extract_cover(path: str, out: str | None = None) -> str:
    if out is None:
        out = os.path.splitext(path)[0] + ".cover.jpg"
    r = _run_ffmpeg(["-i", path, "-an", "-map", "0:v", "-c:v", "copy", out])
    if r.returncode != 0:
        raise ValueError("no embedded cover found, or extract failed")
    return out


def _format_tags(tags: dict) -> list[str]:
    """Human-readable lines for the tags found in a file (values, not just IDs)."""
    if not tags:
        return ["(no readable artist/title/etc. tags)"]
    lines = []
    for key in TAG_FIELDS:
        if tags.get(key):
            lines.append(f"{TAG_LABELS[key]+':':<16}{tags[key]}")
    for key, val in tags.items():
        if key in TAG_FIELDS:
            continue
        label = "Software:" if key == "software" else (key.lstrip("_") + ":")
        lines.append(f"{label:<16}{val}")
    return lines


def _report(path: str, info: dict) -> None:
    print(f"\n=== {os.path.basename(path)} : {info['format']} ===")
    print("Tags (artist / title / provenance):")
    for line in _format_tags(info.get("tags", {})):
        print(f"    - {line}")
    print("Layer 1  container metadata (removable):")
    for line in info["layers"]["1_container"]:
        print(f"    - {line}")
    print("Layer 2  C2PA Content Credentials:")
    present, details = c2pa_local(_read(path))
    if present:
        print("    - signed manifest present (local scan)")
        for d in details:
            print(f"        · {d}")
    else:
        print("    - none detected (local scan)")
    _, ext_detail = detect_c2pa_external(path)
    if ext_detail:
        print(f"    - {ext_detail}")
    print("Layer 3  signal watermark / model fingerprint:")
    print("    - not inspectable here; lives in the waveform, not the file "
          "structure.")
    print("      Use the SynthID detector portal / a C2PA verifier and an "
          "acoustic")
    print("      classifier to assess it.  Metadata stripping does NOT remove "
          "it.")


def cmd_inspect(path: str) -> int:
    _report(path, inspect_any(path))
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
    n_in = os.path.getsize(path)
    before = inspect_any(path)
    if out is None:
        root, e = os.path.splitext(path)
        out = f"{root}.clean{e}"
    cleaner = _CLEANERS.get(ext)
    if cleaner:  # native, lossless
        cleaned = cleaner(_read(path))
        with open(out, "wb") as fh:
            fh.write(cleaned)
        n_out = len(cleaned)
    elif ffmpeg_path() and ext in FFMPEG_AUDIO_EXTS:  # universal via ffmpeg (stream copy)
        ffmpeg_strip(path, out)
        n_out = os.path.getsize(out)
    else:
        raise ValueError(
            f"Layer-1 stripping not supported for '{ext}'. "
            f"Native: {', '.join(sorted(SUPPORTED_STRIP))}; "
            "other formats need ffmpeg (bundled in the installer).")
    after = inspect_any(out)
    return CleanResult(path, out, before, after, n_in, n_out)


def cmd_clean(path: str, out: str | None) -> int:
    ext = os.path.splitext(path)[1].lower()
    if ext not in _CLEANERS and not (ffmpeg_path() and ext in FFMPEG_AUDIO_EXTS):
        print(f"error: layer-1 stripping not available for '{ext}'. "
              f"Native: {', '.join(sorted(SUPPORTED_STRIP))}; other formats need "
              "ffmpeg.", file=sys.stderr)
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


def cmd_tag(path: str, tags: dict, out: str | None) -> int:
    if not any(v.strip() for v in tags.values()):
        print("error: nothing to write — give at least one of "
              "--title/--artist/--album/--year/--genre/--comment/--creation-type",
              file=sys.stderr)
        return 2
    try:
        out_path, n_in, n_out, written = process_tag(path, tags, out)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    print(f"\nWrote {out_path}  ({n_in} -> {n_out} bytes; audio copied verbatim)")
    print("Tags now in the file:")
    for line in _format_tags(written):
        print(f"    - {line}")
    return 0


# Extensions we can act on (native always; the rest once ffmpeg is present).
def supported_exts() -> set:
    exts = set(SUPPORTED_STRIP)
    if ffmpeg_path():
        exts |= FFMPEG_AUDIO_EXTS
    return exts


def iter_audio_files(folder: str, recursive: bool):
    exts = supported_exts()
    if recursive:
        for dirpath, _dirs, files in os.walk(folder):
            for f in sorted(files):
                if os.path.splitext(f)[1].lower() in exts:
                    yield os.path.join(dirpath, f)
    else:
        for f in sorted(os.listdir(folder)):
            full = os.path.join(folder, f)
            if os.path.isfile(full) and os.path.splitext(f)[1].lower() in exts:
                yield full


def cmd_batch(folder: str, action: str, tags: dict, recursive: bool) -> int:
    files = list(iter_audio_files(folder, recursive))
    if not files:
        print(f"No supported audio files found in {folder}", file=sys.stderr)
        return 2
    ok = fail = 0
    for f in files:
        try:
            if action == "clean":
                res = process_clean(f, None)
                print(f"  stripped  {os.path.basename(f)} -> {os.path.basename(res.out)}")
            else:
                out, _ni, _no, _w = process_tag(f, tags, None)
                print(f"  tagged    {os.path.basename(f)} -> {os.path.basename(out)}")
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  SKIP      {os.path.basename(f)}: {exc}")
            fail += 1
    print(f"\nBatch {action}: {ok} done, {fail} skipped, in {folder}")
    return 0 if ok else 2


def cmd_edit(op: str, path: str, out: str | None, **kw) -> int:
    if not ffmpeg_path():
        print("error: audio editing needs ffmpeg (bundled in the installer; or "
              "install it on PATH).", file=sys.stderr)
        return 2
    try:
        if op == "convert":
            res = convert_audio(path, kw["to"], out)
        elif op == "trim":
            res = trim_audio(path, kw.get("start"), kw.get("end"), out)
        elif op == "normalize":
            res = normalize_audio(path, out)
        elif op == "cover":
            res = set_cover(path, kw["image"], out)
        elif op == "extract-cover":
            res = extract_cover(path, out)
        else:
            print(f"unknown edit op {op}", file=sys.stderr)
            return 2
    except (ValueError, KeyError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    note = "" if op in ("trim", "cover", "extract-cover") else \
        "  (re-encoded — this op changes the audio stream)"
    print(f"Wrote {res}{note}")
    return 0


def cmd_gui(initial: str | None = None) -> int:
    """Click-to-run window: inspect, strip, and imprint provenance tags."""
    try:
        import tkinter as tk
        from tkinter import filedialog, scrolledtext, ttk, simpledialog, messagebox
    except Exception as exc:  # noqa: BLE001
        print(f"error: GUI needs tkinter, which isn't available ({exc}).\n"
              "Use the CLI instead:  python provenance.py clean FILE", file=sys.stderr)
        return 2

    state = {"path": initial}

    root = tk.Tk()
    root.title("AI SoundStripper")
    root.geometry("760x720")

    tk.Label(root, text="AI SoundStripper",
             font=("Segoe UI", 16, "bold")).pack(pady=(12, 0))
    tk.Label(root,
             text="Inspect provenance layers • strip Layer-1 junk metadata • "
                  "imprint honest tags.\nMetadata tool — NOT a watermark remover "
                  "(see notes below).",
             fg="#555", justify="center").pack()

    path_var = tk.StringVar(value=initial or "No file selected")
    tk.Label(root, textvariable=path_var, fg="#0a4", wraplength=720).pack(pady=(8, 4))

    # --- tag form (the "imprint" feature) --------------------------------- #
    form = tk.LabelFrame(root, text="Imprint provenance tags "
                         "(written into a saved copy; audio untouched)",
                         padx=10, pady=8)
    form.pack(fill="x", padx=12, pady=(2, 4))
    field_vars: dict = {}
    for idx, key in enumerate(TAG_FIELDS):
        r, c = divmod(idx, 2)
        tk.Label(form, text=TAG_LABELS[key], width=12, anchor="e").grid(
            row=r, column=c * 2, sticky="e", padx=(4, 4), pady=3)
        var = tk.StringVar()
        field_vars[key] = var
        if key == "creation_type":
            ttk.Combobox(form, textvariable=var, values=CREATION_TYPE_CHOICES,
                         width=26).grid(row=r, column=c * 2 + 1, sticky="w", pady=3)
        else:
            tk.Entry(form, textvariable=var, width=29).grid(
                row=r, column=c * 2 + 1, sticky="w", pady=3)

    log = scrolledtext.ScrolledText(root, height=14, wrap="word",
                                    font=("Consolas", 9))
    log.pack(fill="both", expand=True, padx=12, pady=6)

    def write(msg):
        log.insert("end", msg + "\n")
        log.see("end")
        root.update_idletasks()

    def fill_form(tags):
        for key in TAG_FIELDS:
            field_vars[key].set(tags.get(key, ""))

    def collect_tags():
        return {key: field_vars[key].get() for key in TAG_FIELDS}

    def show_report(title, info, path):
        write(f"=== {title} : {info['format']} ===")
        write("Tags (artist / title / provenance):")
        for line in _format_tags(info.get("tags", {})):
            write(f"    - {line}")
        write("Layer 1  container metadata (removable):")
        for line in info["layers"]["1_container"]:
            write(f"    - {line}")
        present, details = c2pa_local(_read(path))
        if present:
            write("Layer 2  C2PA: signed manifest present (local scan)")
            for d in details:
                write(f"        · {d}")
        else:
            write("Layer 2  C2PA: none detected (local scan)")
        _, ext_detail = detect_c2pa_external(path)
        if ext_detail:
            write(f"         {ext_detail}")
        write("Layer 3  signal watermark / model fingerprint: lives in the")
        write("    waveform, not the file. Metadata changes do NOT affect it.")
        write("")

    def pick():
        f = filedialog.askopenfilename(
            title="Choose an audio file",
            filetypes=[("Audio", "*.mp3 *.wav *.flac *.m4a *.mp4 *.aac *.ogg "
                        "*.opus *.aiff *.wma"), ("All files", "*.*")])
        if f:
            state["path"] = f
            path_var.set(f)
            do_inspect()

    def do_inspect():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return
        log.delete("1.0", "end")
        info = inspect_any(p)  # native parser, or ffmpeg for other formats
        fill_form(info.get("tags", {}))
        show_report(os.path.basename(p), info, p)

    def do_clean():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return
        try:
            res = process_clean(p, None)
        except ValueError as exc:
            write(f"Cannot strip: {exc}\n")
            return
        if res.before["layers"]["2_c2pa"]:
            write("NOTE: signed C2PA manifest detected; this tool does not "
                  "strip it (see EU AI Act Art. 50).")
        write(f"Saved: {res.out}")
        write(f"  {res.n_in} -> {res.n_out} bytes "
              f"({res.removed} bytes of metadata removed)")
        write("  Audio stream copied verbatim — no re-encode, same format.\n")
        show_report("output (verified)", res.after, res.out)
        write("Reminder: Layer-3 acoustic fingerprint is unchanged by design.\n")

    def do_tag():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return
        tags = collect_tags()
        if not any(v.strip() for v in tags.values()):
            write("Fill at least one tag field first (e.g. Artist / Title).\n")
            return
        try:
            out_path, n_in, n_out, written = process_tag(p, tags, None)
        except ValueError as exc:
            write(f"Cannot tag: {exc}\n")
            return
        write(f"Imprinted tags -> {out_path}")
        write(f"  {n_in} -> {n_out} bytes; audio copied verbatim.\n")
        _save_default_tags(tags)  # remember as preset
        show_report("tagged (verified)", inspect_any(out_path), out_path)

    # ---- audio editing (ffmpeg) ---------------------------------------- #
    def _need_file():
        p = state["path"]
        if not p or not os.path.isfile(p):
            write("Pick a file first.\n")
            return None
        if not have_ffmpeg():
            write("This action needs ffmpeg (bundled in the installer).\n")
            return None
        return p

    def do_convert():
        p = _need_file()
        if not p:
            return
        fmt = simpledialog.askstring("Convert", "Target format "
                                     "(mp3 / wav / flac / m4a / ogg / opus / aiff):",
                                     parent=root)
        if not fmt:
            return
        try:
            out = convert_audio(p, fmt.strip().lower())
        except ValueError as exc:
            write(f"Convert failed: {exc}\n")
            return
        write(f"Converted -> {out}  (re-encoded: this changes the audio stream)\n")

    def do_normalize():
        p = _need_file()
        if not p:
            return
        try:
            out = normalize_audio(p)
        except ValueError as exc:
            write(f"Normalize failed: {exc}\n")
            return
        write(f"Normalized to -14 LUFS -> {out}  (re-encoded)\n")

    def do_cover():
        p = _need_file()
        if not p:
            return
        img = filedialog.askopenfilename(title="Choose a cover image",
                                         filetypes=[("Images", "*.jpg *.jpeg *.png"),
                                                    ("All files", "*.*")])
        if not img:
            return
        try:
            out = set_cover(p, img)
        except ValueError as exc:
            write(f"Set cover failed: {exc}\n")
            return
        write(f"Embedded cover -> {out}  (audio copied verbatim)\n")

    def do_batch():
        folder = filedialog.askdirectory(title="Choose a folder to process")
        if not folder:
            return
        action = "tag" if any(v.strip() for v in collect_tags().values()) else "clean"
        if action == "tag":
            if not messagebox.askyesno("Batch tag", "Apply the tag-form values to "
                                       "EVERY supported file in:\n" + folder + " ?"):
                return
        else:
            if not messagebox.askyesno("Batch strip", "Strip metadata from EVERY "
                                       "supported file in:\n" + folder +
                                       " ?\n(Tag fields are empty, so this strips.)"):
                return
        write(f"Batch {action} in {folder} ...")
        files = list(iter_audio_files(folder, recursive=False))
        ok = 0
        for f in files:
            try:
                if action == "clean":
                    r = process_clean(f, None)
                    write(f"  stripped {os.path.basename(f)} -> {os.path.basename(r.out)}")
                else:
                    o, _i, _n, _w = process_tag(f, collect_tags(), None)
                    write(f"  tagged   {os.path.basename(f)} -> {os.path.basename(o)}")
                ok += 1
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(f)}: {exc}")
        write(f"Batch done: {ok}/{len(files)} files.\n")

    def do_detectors():
        import webbrowser
        win = tk.Toplevel(root)
        win.title("Layer 2 / 3 — verify provenance")
        win.geometry("600x460")

        # --- Layer 2: scan THIS file locally, right now ---------------------
        tk.Label(win, text="Layer 2 — C2PA Content Credentials",
                 font=("Segoe UI", 11, "bold")).pack(anchor="w", padx=12, pady=(12, 2))
        box = scrolledtext.ScrolledText(win, height=8, wrap="word",
                                        font=("Consolas", 9))
        box.pack(fill="x", padx=12)
        p = state["path"]
        if p and os.path.isfile(p):
            present, details = c2pa_local(_read(p))
            if present:
                box.insert("end", f"Signed C2PA manifest FOUND in "
                                  f"{os.path.basename(p)}:\n")
                for d in details:
                    box.insert("end", f"  - {d}\n")
                if not details:
                    box.insert("end", "  (present, but no readable generator strings)\n")
            else:
                box.insert("end", f"No C2PA manifest in {os.path.basename(p)} "
                                  "(local scan).\n")
            if _c2patool_path():
                _, detail = detect_c2pa_external(p)
                box.insert("end", f"\nVerified with bundled c2patool -> {detail}\n")
            else:
                box.insert("end", "\n(Local string scan only; bundled c2patool "
                                  "not found.)\n")
        else:
            box.insert("end", "No file loaded - click 'Upload...' first, then "
                              "reopen this window.\n")
        box.configure(state="disabled")
        tk.Label(win, text="Most music files (incl. AI tracks from Suno / Udio) "
                 "carry NO Content\nCredentials - 'none detected' here is the "
                 "normal, correct answer.",
                 justify="left", fg="#777").pack(anchor="w", padx=12, pady=(6, 0))
        tk.Button(win, text="Second opinion: open the online verifier (optional)",
                  command=lambda: webbrowser.open(DETECTOR_VERIFY_URL),
                  width=52).pack(anchor="w", padx=12, pady=(4, 2))
        tk.Label(win, text="Note: that website often shows 'unknown error' for "
                 "files that simply have\nno credentials - that is the site's "
                 "quirk, not a problem with your file.",
                 justify="left", fg="#a40").pack(anchor="w", padx=12)

        # --- Layer 3: be honest, no working detector exists ----------------
        tk.Label(win, text="Layer 3 — SynthID / acoustic fingerprint",
                 font=("Segoe UI", 11, "bold")).pack(anchor="w", padx=12, pady=(12, 2))
        tk.Label(win, text="No public, self-serve detector exists for AI-audio "
                 "watermarks or model\nfingerprints. They live in the waveform, not "
                 "the file, so nothing here — or in\nany metadata tool — can read or "
                 "remove them. The link below explains how\nSynthID works; it is "
                 "information, NOT a working detector.",
                 justify="left", fg="#444").pack(anchor="w", padx=12)
        tk.Button(win, text="How SynthID works (info only)",
                  command=lambda: webbrowser.open(DETECTOR_SYNTHID_INFO),
                  width=36).pack(anchor="w", padx=12, pady=(6, 12))

    bar = tk.Frame(root)
    bar.pack(pady=(0, 2))
    tk.Button(bar, text="1. Upload…", command=pick, width=11).pack(side="left", padx=4)
    tk.Button(bar, text="2. Inspect", command=do_inspect, width=11).pack(side="left", padx=4)
    tk.Button(bar, text="Strip junk + save", command=do_clean,
              width=16, bg="#1565c0", fg="white").pack(side="left", padx=4)
    tk.Button(bar, text="Imprint tags + save", command=do_tag,
              width=18, bg="#2e7d32", fg="white").pack(side="left", padx=4)
    tk.Button(bar, text="Detectors…", command=do_detectors,
              width=11).pack(side="left", padx=4)

    # Second row: ffmpeg-powered editing + batch (works on any format).
    ff = have_ffmpeg()
    bar2 = tk.Frame(root)
    bar2.pack(pady=(0, 8))
    st = "normal" if ff else "disabled"
    suffix = "" if ff else "  (needs ffmpeg)"
    tk.Button(bar2, text="Convert…", command=do_convert, width=10, state=st).pack(side="left", padx=4)
    tk.Button(bar2, text="Normalize", command=do_normalize, width=10, state=st).pack(side="left", padx=4)
    tk.Button(bar2, text="Set cover…", command=do_cover, width=10, state=st).pack(side="left", padx=4)
    tk.Button(bar2, text="Batch folder…", command=do_batch, width=13).pack(side="left", padx=4)
    tk.Label(bar2, text="(edits any format" + suffix + ")", fg="#888").pack(side="left", padx=6)

    # Prefill the form from a saved preset (overwritten by a file's own tags).
    defaults = _load_default_tags()
    if defaults:
        fill_form(defaults)

    if initial and os.path.isfile(initial):
        do_inspect()

    root.mainloop()
    return 0


_SUBCOMMANDS = {"inspect", "clean", "tag", "gui", "convert", "trim",
                "normalize", "cover", "extract-cover"}


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
    pc.add_argument("file", help="audio file, or a folder for batch mode")
    pc.add_argument("-o", "--out", default=None, help="output path")
    pc.add_argument("-r", "--recursive", action="store_true", help="recurse into subfolders (batch)")

    def add_tag_args(sp):
        sp.add_argument("--title", default="")
        sp.add_argument("--artist", default="")
        sp.add_argument("--album", default="")
        sp.add_argument("--year", default="")
        sp.add_argument("--genre", default="")
        sp.add_argument("--comment", default="")
        sp.add_argument("--creation-type", dest="creation_type", default="",
                        help="e.g. 'AI-generated', 'AI-assisted (human-edited)', 'Human-made'")

    pt = sub.add_parser("tag", help="imprint provenance tags (no re-encode)")
    pt.add_argument("file", help="audio file, or a folder for batch mode")
    add_tag_args(pt)
    pt.add_argument("-o", "--out", default=None, help="output path")
    pt.add_argument("-r", "--recursive", action="store_true", help="recurse into subfolders (batch)")

    pcv = sub.add_parser("convert", help="convert to another format (ffmpeg; re-encodes)")
    pcv.add_argument("file")
    pcv.add_argument("--to", required=True, help="target ext: mp3/wav/flac/m4a/ogg/opus/aiff")
    pcv.add_argument("-o", "--out", default=None)
    ptr = sub.add_parser("trim", help="cut a section (ffmpeg; lossless stream copy)")
    ptr.add_argument("file")
    ptr.add_argument("--start", default=None, help="start time, e.g. 0:30 or 12.5")
    ptr.add_argument("--end", default=None, help="end time, e.g. 1:45")
    ptr.add_argument("-o", "--out", default=None)
    pnm = sub.add_parser("normalize", help="loudness-normalize to -14 LUFS (ffmpeg; re-encodes)")
    pnm.add_argument("file")
    pnm.add_argument("-o", "--out", default=None)
    pco = sub.add_parser("cover", help="embed a cover image (ffmpeg; lossless)")
    pco.add_argument("file")
    pco.add_argument("--image", required=True, help="path to JPG/PNG cover")
    pco.add_argument("-o", "--out", default=None)
    pxc = sub.add_parser("extract-cover", help="save the embedded cover image (ffmpeg)")
    pxc.add_argument("file")
    pxc.add_argument("-o", "--out", default=None)

    pg = sub.add_parser("gui", help="launch the click-to-run window")
    pg.add_argument("file", nargs="?", default=None, help="optional file to preload")
    args = p.parse_args(raw)

    if args.cmd == "gui":
        return cmd_gui(args.file)

    # Batch mode: clean/tag accept a directory.
    if args.cmd in ("clean", "tag") and os.path.isdir(args.file):
        tags = {k: getattr(args, k) for k in TAG_FIELDS} if args.cmd == "tag" else {}
        return cmd_batch(args.file, args.cmd, tags, args.recursive)

    if not os.path.isfile(args.file):
        print(f"error: no such file: {args.file}", file=sys.stderr)
        return 2

    if args.cmd == "inspect":
        return cmd_inspect(args.file)
    if args.cmd == "tag":
        tags = {k: getattr(args, k) for k in TAG_FIELDS}
        return cmd_tag(args.file, tags, args.out)
    if args.cmd == "clean":
        return cmd_clean(args.file, args.out)
    if args.cmd == "convert":
        return cmd_edit("convert", args.file, args.out, to=args.to)
    if args.cmd == "trim":
        return cmd_edit("trim", args.file, args.out, start=args.start, end=args.end)
    if args.cmd == "normalize":
        return cmd_edit("normalize", args.file, args.out)
    if args.cmd == "cover":
        return cmd_edit("cover", args.file, args.out, image=args.image)
    if args.cmd == "extract-cover":
        return cmd_edit("extract-cover", args.file, args.out)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
