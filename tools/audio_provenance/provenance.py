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


def _user_data_dir() -> str:
    """Per-user, writable dir for tools we fetch at runtime (e.g. ffmpeg)."""
    base = os.environ.get("LOCALAPPDATA") or os.path.join(
        os.path.expanduser("~"), ".local", "share")
    d = os.path.join(base, "AISoundStripper")
    os.makedirs(d, exist_ok=True)
    return d


def _tool_path(*names):
    """Find a helper binary: next to the frozen exe, in the PyInstaller bundle,
    beside this script, the per-user data dir, or on PATH."""
    dirs = []
    if getattr(sys, "frozen", False):
        dirs.append(os.path.dirname(sys.executable))
    base = getattr(sys, "_MEIPASS", None)
    if base:
        dirs.append(base)
    dirs.append(os.path.dirname(os.path.abspath(__file__)))
    try:
        dirs.append(_user_data_dir())
    except Exception:  # noqa: BLE001
        pass
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


# Pinned ffmpeg build fetched on first use when not already present (keeps the
# installer small). gyan.dev keeps old releases, so this URL stays valid.
FFMPEG_DOWNLOAD_URL = (
    "https://github.com/GyanD/codexffmpeg/releases/download/"
    "2026-06-04-git-c27a3b12e3/ffmpeg-2026-06-04-git-c27a3b12e3-essentials_build.zip")


def download_ffmpeg(progress=None) -> str:
    """Fetch ffmpeg.exe into the per-user data dir. progress(fraction) optional.

    One-time ~100 MB download; afterwards _tool_path() finds it automatically.
    """
    import tempfile
    import urllib.request
    import zipfile
    dest = os.path.join(_user_data_dir(), "ffmpeg.exe")
    tmpzip = os.path.join(tempfile.gettempdir(), "aiss_ffmpeg_dl.zip")

    def hook(blocks, bs, total):
        if progress and total > 0:
            progress(min(1.0, (blocks * bs) / total))

    urllib.request.urlretrieve(FFMPEG_DOWNLOAD_URL, tmpzip, hook)
    with zipfile.ZipFile(tmpzip) as z:
        name = next(n for n in z.namelist() if n.lower().endswith("bin/ffmpeg.exe"))
        with z.open(name) as src, open(dest, "wb") as out:
            shutil.copyfileobj(src, out)
    try:
        os.remove(tmpzip)
    except OSError:
        pass
    return dest


def ensure_ffmpeg(progress=None) -> str | None:
    existing = ffmpeg_path()
    return existing if existing else download_ffmpeg(progress)


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


# Convert targets and how each quality tier maps to encoder settings.
# Quality tiers (friendly names users pick from a dropdown):
QUALITY_TIERS = ["HD / Max", "High", "Standard", "Small"]
CONVERT_TARGETS = ["mp3", "m4a", "aac", "ogg", "opus", "flac", "wav", "aiff"]

# Per-format, per-tier ffmpeg args. Lossy tiers = bitrate; lossless = bit depth.
_CONVERT_QUALITY = {
    ".mp3":  {"HD / Max": ["-c:a", "libmp3lame", "-b:a", "320k"],
              "High":     ["-c:a", "libmp3lame", "-b:a", "256k"],
              "Standard": ["-c:a", "libmp3lame", "-b:a", "192k"],
              "Small":    ["-c:a", "libmp3lame", "-b:a", "128k"]},
    ".m4a":  {"HD / Max": ["-c:a", "aac", "-b:a", "320k"],
              "High":     ["-c:a", "aac", "-b:a", "256k"],
              "Standard": ["-c:a", "aac", "-b:a", "192k"],
              "Small":    ["-c:a", "aac", "-b:a", "128k"]},
    ".ogg":  {"HD / Max": ["-c:a", "libvorbis", "-q:a", "9"],
              "High":     ["-c:a", "libvorbis", "-q:a", "7"],
              "Standard": ["-c:a", "libvorbis", "-q:a", "5"],
              "Small":    ["-c:a", "libvorbis", "-q:a", "3"]},
    ".opus": {"HD / Max": ["-c:a", "libopus", "-b:a", "256k"],
              "High":     ["-c:a", "libopus", "-b:a", "160k"],
              "Standard": ["-c:a", "libopus", "-b:a", "128k"],
              "Small":    ["-c:a", "libopus", "-b:a", "96k"]},
    ".flac": {"HD / Max": ["-c:a", "flac", "-sample_fmt", "s32", "-compression_level", "8"],
              "High":     ["-c:a", "flac", "-compression_level", "8"],
              "Standard": ["-c:a", "flac", "-compression_level", "5"],
              "Small":    ["-c:a", "flac", "-compression_level", "12"]},
    ".wav":  {"HD / Max": ["-c:a", "pcm_s24le"], "High": ["-c:a", "pcm_s24le"],
              "Standard": ["-c:a", "pcm_s16le"], "Small": ["-c:a", "pcm_s16le"]},
    ".aiff": {"HD / Max": ["-c:a", "pcm_s24be"], "High": ["-c:a", "pcm_s24be"],
              "Standard": ["-c:a", "pcm_s16be"], "Small": ["-c:a", "pcm_s16be"]},
}
_CONVERT_QUALITY[".aac"] = _CONVERT_QUALITY[".m4a"]


def convert_audio(path: str, target_ext: str, out: str | None = None,
                  quality: str = "High") -> str:
    target_ext = target_ext if target_ext.startswith(".") else "." + target_ext
    table = _CONVERT_QUALITY.get(target_ext)
    if not table:
        raise ValueError(f"convert target '{target_ext}' not supported. "
                         f"Choose from: {', '.join(CONVERT_TARGETS)}")
    args = table.get(quality) or table["High"]
    if out is None:
        root = os.path.splitext(path)[0]
        # avoid overwriting the source when ext is unchanged
        out = root + target_ext
        if os.path.abspath(out) == os.path.abspath(path):
            out = root + ".converted" + target_ext
    r = _run_ffmpeg(["-i", path, *args, out])
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


# Containers that can reliably embed a cover image.
COVER_CONTAINERS = {".mp3", ".flac", ".m4a", ".mp4", ".m4b"}


def set_cover(path: str, image: str, out: str | None = None,
              to_ext: str | None = None) -> str:
    """Embed a cover image. If the source container can't hold art (e.g. WAV),
    pass to_ext='.flac' to write a lossless cover-bearing copy instead."""
    src_ext = os.path.splitext(path)[1].lower()
    ext = (to_ext or src_ext).lower()
    if not ext.startswith("."):
        ext = "." + ext
    if ext not in COVER_CONTAINERS:
        raise ValueError(f"{ext} cannot embed cover art (use mp3/flac/m4a)")
    if out is None:
        root = os.path.splitext(path)[0]
        out = f"{root}.cover{ext}"
        if os.path.abspath(out) == os.path.abspath(path):
            out = f"{root}.cover.out{ext}"
    aenc = ["-c:a", "copy"] if ext == src_ext else _CONVERT_QUALITY[ext]["High"]
    args = ["-i", path, "-i", image, "-map", "0:a", "-map", "1:0", *aenc,
            "-c:v", "copy", "-disposition:v:0", "attached_pic"]
    if ext == ".mp3":
        args += ["-id3v2_version", "3", "-metadata:s:v:0", "title=Album cover",
                 "-metadata:s:v:0", "comment=Cover (front)"]
    args.append(out)
    r = _run_ffmpeg(args)
    if r.returncode != 0 or not os.path.exists(out) or os.path.getsize(out) == 0:
        if os.path.exists(out) and os.path.getsize(out) == 0:
            try:
                os.remove(out)  # don't leave a 0-byte file behind
            except OSError:
                pass
        tail = ((r.stderr or "").strip().splitlines() or ["unknown error"])[-1]
        raise ValueError(f"cover embed failed: {tail}")
    return out


def extract_cover(path: str, out: str | None = None) -> str:
    if out is None:
        out = os.path.splitext(path)[0] + ".cover.jpg"
    r = _run_ffmpeg(["-i", path, "-an", "-map", "0:v", "-c:v", "copy", out])
    if r.returncode != 0:
        raise ValueError("no embedded cover found, or extract failed")
    return out


def waveform_peaks(path: str, columns: int = 760):
    """Decode any format to mono PCM (via ffmpeg) and return (peaks, duration).

    peaks is a list of (min, max) int16 pairs, one per display column; duration
    is in seconds. Used to draw a waveform for visual snipping.
    """
    import array
    exe = ffmpeg_path()
    if not exe:
        raise ValueError("waveform needs ffmpeg")
    rate = 8000
    r = subprocess.run([exe, "-nostdin", "-v", "quiet", "-i", path,
                        "-ac", "1", "-ar", str(rate), "-f", "s16le", "-"],
                       capture_output=True, timeout=120, creationflags=_NO_WINDOW)
    samples = array.array("h")
    raw = r.stdout or b""
    samples.frombytes(raw[: len(raw) // 2 * 2])
    n = len(samples)
    if n == 0:
        raise ValueError("could not decode audio for the waveform")
    duration = n / rate
    columns = max(1, min(columns, n))
    per = max(1, n // columns)
    peaks = []
    for i in range(0, n, per):
        chunk = samples[i:i + per]
        if chunk:
            peaks.append((min(chunk), max(chunk)))
    return peaks, duration


def snip_audio(path: str, start: float, end: float, target_ext: str | None = None,
               quality: str = "High", out: str | None = None) -> str:
    """Save the [start, end] second section, encoded to target_ext (default: same)."""
    if end <= start:
        raise ValueError("empty selection — drag to choose a section first")
    ext = (target_ext or os.path.splitext(path)[1]).lower()
    if not ext.startswith("."):
        ext = "." + ext
    enc = (_CONVERT_QUALITY.get(ext) or {}).get(quality) \
        or (_CONVERT_QUALITY.get(ext) or {}).get("High") or ["-c", "copy"]
    if out is None:
        out = f"{os.path.splitext(path)[0]}.snip{ext}"
        if os.path.abspath(out) == os.path.abspath(path):
            out = f"{os.path.splitext(path)[0]}.snip.out{ext}"
    r = _run_ffmpeg(["-ss", f"{start:.3f}", "-i", path, "-t", f"{end - start:.3f}",
                     *enc, out])
    if r.returncode != 0:
        raise ValueError(f"snip failed: {(r.stderr or '').strip().splitlines()[-1:]}")
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


def cmd_install_ffmpeg() -> int:
    if have_ffmpeg():
        print(f"ffmpeg already available: {ffmpeg_path()}")
        return 0
    print("Downloading ffmpeg (~100 MB, one-time)...")
    last = [-1]

    def prog(frac):
        pct = int(frac * 100)
        if pct != last[0] and pct % 5 == 0:
            last[0] = pct
            print(f"  {pct}%", end="\r", flush=True)
    try:
        dest = download_ffmpeg(prog)
    except Exception as exc:  # noqa: BLE001
        print(f"\nffmpeg download failed: {exc}", file=sys.stderr)
        return 2
    print(f"\nInstalled ffmpeg -> {dest}")
    return 0


def cmd_edit(op: str, path: str, out: str | None, **kw) -> int:
    if not ffmpeg_path():
        print("error: this needs ffmpeg. Run:  provenance.py install-ffmpeg  "
              "(one-time ~100 MB), or put ffmpeg on PATH.", file=sys.stderr)
        return 2
    try:
        if op == "convert":
            res = convert_audio(path, kw["to"], out, kw.get("quality", "High"))
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
    """Modern click-to-run window: inspect, strip, imprint, convert, snip."""
    try:
        import tkinter as tk
        from tkinter import filedialog, scrolledtext, ttk, messagebox
    except Exception as exc:  # noqa: BLE001
        print(f"error: GUI needs tkinter, which isn't available ({exc}).\n"
              "Use the CLI instead:  python provenance.py clean FILE", file=sys.stderr)
        return 2

    init_files = [initial] if initial and os.path.isfile(initial) else []
    state = {"files": list(init_files)}

    try:  # optional native drag-and-drop of files
        from tkinterdnd2 import DND_FILES, TkinterDnD
        root = TkinterDnD.Tk()
        _dnd = True
    except Exception:  # noqa: BLE001
        root = tk.Tk()
        _dnd = False
    root.title("AI SoundStripper")
    root.geometry("860x800")
    root.minsize(780, 660)

    # ---------- modern flat theme ----------
    BG, INK, MUTE = "#f4f5f7", "#111827", "#6b7280"
    ACCENT, ACCENT_D, GREEN, GREEN_D = "#2563eb", "#1d4ed8", "#16a34a", "#15803d"
    root.configure(bg=BG)
    style = ttk.Style()
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass
    style.configure(".", font=("Segoe UI", 10), background=BG, foreground=INK)
    style.configure("TFrame", background=BG)
    style.configure("TLabel", background=BG, foreground=INK)
    style.configure("Muted.TLabel", background=BG, foreground=MUTE, font=("Segoe UI", 9))
    style.configure("Head.TLabel", background=BG, foreground=INK,
                    font=("Segoe UI Semibold", 17))
    style.configure("TLabelframe", background=BG)
    style.configure("TLabelframe.Label", background=BG, foreground=INK,
                    font=("Segoe UI Semibold", 10))
    style.configure("TButton", background="#e5e7eb", foreground=INK, borderwidth=0,
                    padding=(10, 7), font=("Segoe UI", 9))
    style.map("TButton", background=[("active", "#d1d5db"), ("pressed", "#cbd5e1")])
    style.configure("Accent.TButton", background=ACCENT, foreground="white")
    style.map("Accent.TButton", background=[("active", ACCENT_D), ("pressed", ACCENT_D)])
    style.configure("Green.TButton", background=GREEN, foreground="white")
    style.map("Green.TButton", background=[("active", GREEN_D), ("pressed", GREEN_D)])
    style.configure("TCombobox", fieldbackground="white")
    style.configure("TEntry", fieldbackground="white")

    # ---------- header ----------
    head = ttk.Frame(root)
    head.pack(fill="x", pady=(12, 2))
    ttk.Label(head, text="AI SoundStripper", style="Head.TLabel").pack()
    ttk.Label(head, text="Inspect  •  strip junk metadata  •  imprint tags  •  "
              "convert  •  snip — any format.    Metadata tool, NOT a watermark "
              "remover.", style="Muted.TLabel").pack()

    # ---------- file list ----------
    ff_text = ("  Files — add one or many (or drag files here)  " if _dnd
               else "  Files — add one or many  ")
    ff = ttk.Labelframe(root, text=ff_text, padding=10)
    ff.pack(fill="x", padx=16, pady=(10, 6))
    lbf = ttk.Frame(ff)
    lbf.pack(side="left", fill="both", expand=True)
    files_list = tk.Listbox(lbf, height=4, selectmode="extended", activestyle="none",
                            font=("Consolas", 9), borderwidth=1, relief="solid",
                            highlightthickness=0, bg="white")
    sb = ttk.Scrollbar(lbf, orient="vertical", command=files_list.yview)
    files_list.configure(yscrollcommand=sb.set)
    files_list.pack(side="left", fill="both", expand=True)
    sb.pack(side="left", fill="y")
    fb = ttk.Frame(ff)
    fb.pack(side="left", padx=(10, 0), fill="y")
    ttk.Button(fb, text="Add…", width=10, command=lambda: pick()).pack(pady=2)
    ttk.Button(fb, text="Remove", width=10, command=lambda: remove_sel()).pack(pady=2)
    ttk.Button(fb, text="Clear", width=10, command=lambda: clear_files()).pack(pady=2)
    if _dnd:
        def _on_drop(event):
            for f in root.tk.splitlist(event.data):
                if os.path.isfile(f) and f not in state["files"]:
                    state["files"].append(f)
            refresh_files()
            if len(state["files"]) == 1:
                files_list.selection_set(0)
                do_inspect()
        files_list.drop_target_register(DND_FILES)
        files_list.dnd_bind("<<Drop>>", _on_drop)

    # ---------- tag form ----------
    tf = ttk.Labelframe(root, text="  Imprint provenance tags (saved as a copy; "
                        "audio untouched)  ", padding=10)
    tf.pack(fill="x", padx=16, pady=6)
    field_vars: dict = {}
    for idx, key in enumerate(TAG_FIELDS):
        r, c = divmod(idx, 2)
        ttk.Label(tf, text=TAG_LABELS[key], width=12, anchor="e").grid(
            row=r, column=c * 2, sticky="e", padx=(4, 6), pady=4)
        var = tk.StringVar()
        field_vars[key] = var
        if key == "creation_type":
            ttk.Combobox(tf, textvariable=var, values=CREATION_TYPE_CHOICES,
                         width=30).grid(row=r, column=c * 2 + 1, sticky="w", pady=4)
        else:
            ttk.Entry(tf, textvariable=var, width=32).grid(
                row=r, column=c * 2 + 1, sticky="w", pady=4)
    ttk.Button(tf, text="Clear fields", command=lambda: clear_tags()).grid(
        row=4, column=3, sticky="e", pady=(8, 0))

    # ---------- log ----------
    log_head = ttk.Frame(root)
    log_head.pack(fill="x", padx=16, pady=(2, 0))
    ttk.Label(log_head, text="Output", style="Muted.TLabel").pack(side="left")
    ttk.Button(log_head, text="Clear fields",
               command=lambda: log.delete("1.0", "end")).pack(side="right")
    log = scrolledtext.ScrolledText(root, height=8, wrap="word", font=("Consolas", 9),
                                    borderwidth=1, relief="solid", bg="white")
    log.pack(fill="both", expand=True, padx=16, pady=(2, 6))

    def write(msg):
        log.insert("end", msg + "\n")
        log.see("end")
        root.update_idletasks()

    # ---------- helpers ----------
    def fill_form(tags):
        for key in TAG_FIELDS:
            field_vars[key].set(tags.get(key, ""))

    def collect_tags():
        return {key: field_vars[key].get() for key in TAG_FIELDS}

    def clear_tags():
        for key in TAG_FIELDS:
            field_vars[key].set("")

    def refresh_files():
        files_list.delete(0, "end")
        for f in state["files"]:
            files_list.insert("end", "  " + os.path.basename(f))

    def sel_files():
        idxs = files_list.curselection()
        if idxs:
            return [state["files"][i] for i in idxs]
        return list(state["files"])

    def remove_sel():
        for i in sorted(files_list.curselection(), reverse=True):
            del state["files"][i]
        refresh_files()

    def clear_files():
        state["files"].clear()
        refresh_files()

    def pick():
        fs = filedialog.askopenfilenames(
            title="Choose audio file(s) — Ctrl/Shift-click for many",
            filetypes=[("Audio", "*.mp3 *.wav *.flac *.m4a *.mp4 *.aac *.ogg "
                        "*.opus *.aiff *.wma"), ("All files", "*.*")])
        if not fs:
            return
        for f in fs:
            if f not in state["files"]:
                state["files"].append(f)
        refresh_files()
        if len(state["files"]) == 1:
            files_list.selection_set(0)
            do_inspect()
        else:
            write(f"{len(state['files'])} files in the list. Highlight some "
                  "(or none = all), then pick an action.\n")

    def ensure_ff():
        if have_ffmpeg():
            return True
        if not messagebox.askyesno(
                "Install ffmpeg",
                "This feature needs ffmpeg, which isn't installed yet.\n\n"
                "Download it now? (one-time, ~100 MB, saved for next time)"):
            return False
        win = tk.Toplevel(root)
        win.title("Downloading ffmpeg…")
        win.configure(bg=BG)
        win.geometry("440x110")
        ttk.Label(win, text="Downloading ffmpeg…").pack(pady=(16, 6))
        pb = ttk.Progressbar(win, length=400, maximum=100)
        pb.pack()
        lbl = ttk.Label(win, text="0%", style="Muted.TLabel")
        lbl.pack(pady=4)
        win.update()

        def prog(frac):
            pb["value"] = frac * 100
            lbl.config(text=f"{int(frac * 100)}%")
            win.update()
        try:
            download_ffmpeg(prog)
        except Exception as exc:  # noqa: BLE001
            win.destroy()
            messagebox.showerror("ffmpeg download failed", str(exc))
            return False
        win.destroy()
        write("ffmpeg installed — convert / snip / any-format features enabled.\n")
        return True

    def _ensure_ff_for(files, native):
        if any(os.path.splitext(f)[1].lower() not in native for f in files) \
                and not have_ffmpeg():
            return ensure_ff()
        return True

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
                write(f"        - {d}")
        else:
            write("Layer 2  C2PA: none detected (local scan)")
        _, ext_detail = detect_c2pa_external(path)
        if ext_detail:
            write(f"         {ext_detail}")
        write("Layer 3  signal watermark / fingerprint: lives in the waveform, not "
              "the file. Metadata changes do NOT affect it.\n")

    def primary():
        fs = sel_files()
        return fs[0] if fs else None

    def do_inspect():
        p = primary()
        if not p:
            write("Add a file first.\n")
            return
        ext = os.path.splitext(p)[1].lower()
        if ext not in _INSPECTORS and not have_ffmpeg() and not ensure_ff():
            write(f"'{ext}' needs ffmpeg to read; skipped.\n")
            return
        log.delete("1.0", "end")
        info = inspect_any(p)
        fill_form(info.get("tags", {}))
        show_report(os.path.basename(p), info, p)

    def do_clean():
        fs = sel_files()
        if not fs:
            write("Add a file first.\n")
            return
        _ensure_ff_for(fs, set(_CLEANERS))
        ok = 0
        for p in fs:
            try:
                res = process_clean(p, None)
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(p)}: {exc}")
                continue
            write(f"  stripped {os.path.basename(p)} -> {os.path.basename(res.out)} "
                  f"({res.removed} bytes removed)")
            ok += 1
        write(f"Strip done: {ok}/{len(fs)} file(s). Audio copied verbatim.\n")

    def do_tag():
        fs = sel_files()
        if not fs:
            write("Add a file first.\n")
            return
        tags = collect_tags()
        if not any(v.strip() for v in tags.values()):
            write("Fill at least one tag field first (e.g. Artist / Title).\n")
            return
        _ensure_ff_for(fs, set(_TAG_WRITERS))
        ok = 0
        for p in fs:
            try:
                out_path, _i, _n, _w = process_tag(p, tags, None)
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(p)}: {exc}")
                continue
            write(f"  tagged {os.path.basename(p)} -> {os.path.basename(out_path)}")
            ok += 1
        _save_default_tags(tags)
        write(f"Imprint done: {ok}/{len(fs)} file(s). Audio copied verbatim.\n")

    def _edit_files():
        fs = sel_files()
        if not fs:
            messagebox.showinfo("Add files", "Add a file first.")
            return None
        if not ensure_ff():
            return None
        return fs

    def do_normalize():
        fs = _edit_files()
        if not fs:
            return
        ok = 0
        for p in fs:
            try:
                out = normalize_audio(p)
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(p)}: {exc}")
                continue
            write(f"  {os.path.basename(p)} -> {os.path.basename(out)}")
            ok += 1
        write(f"Normalized {ok}/{len(fs)} file(s) to -14 LUFS. Re-encoded.\n")

    def do_cover():
        fs = _edit_files()
        if not fs:
            return
        img = filedialog.askopenfilename(
            title="Choose a cover image (applied to all)",
            filetypes=[("Images", "*.jpg *.jpeg *.png"), ("All files", "*.*")])
        if not img:
            return
        ok = 0
        for p in fs:
            ext = os.path.splitext(p)[1].lower()
            try:
                if ext in COVER_CONTAINERS:
                    out = set_cover(p, img)
                else:  # WAV/AIFF/etc. can't hold art — save a lossless FLAC copy
                    out = set_cover(p, img, to_ext=".flac")
                    write(f"  ({ext} can't embed a cover — wrote a FLAC copy with art)")
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(p)}: {exc}")
                continue
            write(f"  cover -> {os.path.basename(out)}")
            ok += 1
        write(f"Embedded cover into {ok}/{len(fs)} file(s).\n")

    def do_batch():
        folder = filedialog.askdirectory(title="Choose a folder to process")
        if not folder:
            return
        tags = collect_tags()
        action = "tag" if any(v.strip() for v in tags.values()) else "clean"
        msg = ("Apply the tag-form values to EVERY supported file in:\n"
               if action == "tag" else
               "Strip metadata from EVERY supported file in:\n") + folder + " ?"
        if not messagebox.askyesno(f"Batch {action}", msg):
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
                    o, _i, _n, _w = process_tag(f, tags, None)
                    write(f"  tagged   {os.path.basename(f)} -> {os.path.basename(o)}")
                ok += 1
            except Exception as exc:  # noqa: BLE001
                write(f"  SKIP {os.path.basename(f)}: {exc}")
        write(f"Batch done: {ok}/{len(files)} files.\n")

    def do_get_ffmpeg():
        if have_ffmpeg():
            write(f"ffmpeg already installed: {ffmpeg_path()}\n")
        else:
            ensure_ff()

    # ---------- Convert window ----------
    def open_convert():
        fs = sel_files()
        if not fs:
            messagebox.showinfo("Convert", "Add a file first.")
            return
        win = tk.Toplevel(root)
        win.title("Convert")
        win.configure(bg=BG)
        win.geometry("440x250")
        win.transient(root)
        ttk.Label(win, text=f"Convert {len(fs)} selected file(s)",
                  style="Head.TLabel").pack(pady=(16, 6))
        grid = ttk.Frame(win)
        grid.pack(pady=6)
        ttk.Label(grid, text="Format").grid(row=0, column=0, sticky="e", padx=8, pady=8)
        fmtv = tk.StringVar(value="mp3")
        ttk.Combobox(grid, textvariable=fmtv, values=CONVERT_TARGETS, width=12,
                     state="readonly").grid(row=0, column=1, sticky="w")
        ttk.Label(grid, text="Quality").grid(row=1, column=0, sticky="e", padx=8, pady=8)
        qv = tk.StringVar(value="High")
        ttk.Combobox(grid, textvariable=qv, values=QUALITY_TIERS, width=12,
                     state="readonly").grid(row=1, column=1, sticky="w")
        ttk.Label(win, text="Re-encodes the audio (a quality step). For lossless "
                  "output pick wav or flac.", style="Muted.TLabel", wraplength=390,
                  justify="center").pack(pady=(2, 6))

        def run():
            if not ensure_ff():
                return
            ok = 0
            for p in fs:
                try:
                    o = convert_audio(p, fmtv.get(), None, qv.get())
                except Exception as exc:  # noqa: BLE001
                    write(f"  SKIP {os.path.basename(p)}: {exc}")
                    continue
                write(f"  {os.path.basename(p)} -> {os.path.basename(o)}")
                ok += 1
            write(f"Converted {ok}/{len(fs)} to {fmtv.get().upper()} ({qv.get()}).\n")
            messagebox.showinfo("Convert", f"Converted {ok}/{len(fs)} file(s).")
            win.destroy()
        btns = ttk.Frame(win)
        btns.pack(fill="x", padx=18, pady=(6, 14))
        ttk.Button(btns, text="Convert", style="Accent.TButton",
                   command=run).pack(side="right")
        ttk.Button(btns, text="Cancel", command=win.destroy).pack(side="right", padx=8)

    # ---------- Waveform / snip window ----------
    def open_waveform():
        fs = sel_files()
        if not fs:
            messagebox.showinfo("Waveform", "Add a file first.")
            return
        if not ensure_ff():
            return
        p = fs[0]
        W, H = 900, 220
        try:
            peaks, dur = waveform_peaks(p, W)
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Waveform", str(exc))
            return
        win = tk.Toplevel(root)
        win.title(f"Waveform — {os.path.basename(p)}")
        win.configure(bg=BG)
        win.geometry(f"{W + 40}x{H + 150}")
        win.transient(root)
        ttk.Label(win, text="Drag across the waveform to select a section, then "
                  "export it.", style="Muted.TLabel").pack(pady=(12, 4))
        canvas = tk.Canvas(win, width=W, height=H, bg="white", highlightthickness=1,
                           highlightbackground="#cbd5e1", cursor="tcross")
        canvas.pack(padx=20)
        sel = {"a": None, "b": None}
        sel_lbl = ttk.Label(win, text="selection: (drag across the waveform)",
                            style="Muted.TLabel")
        sel_lbl.pack(pady=6)

        def t_of(x):
            return max(0.0, min(1.0, x / W)) * dur

        def redraw():
            canvas.delete("all")
            mid = H // 2
            if sel["a"] is not None and sel["b"] is not None:
                canvas.create_rectangle(min(sel["a"], sel["b"]), 0,
                                        max(sel["a"], sel["b"]), H, outline="",
                                        fill="#fde68a")
            canvas.create_line(0, mid, W, mid, fill="#e5e7eb")
            n = len(peaks)
            for i, (mn, mx) in enumerate(peaks):
                x = int(i / n * W)
                canvas.create_line(x, mid - int(mx / 32768 * (mid - 3)),
                                   x, mid - int(mn / 32768 * (mid - 3)), fill="#2563eb")
            for key in ("a", "b"):
                if sel[key] is not None:
                    canvas.create_line(sel[key], 0, sel[key], H, fill="#d97706", width=2)

        def upd():
            if sel["a"] is None or sel["b"] is None:
                sel_lbl.config(text="selection: (drag across the waveform)")
            else:
                a, b = t_of(min(sel["a"], sel["b"])), t_of(max(sel["a"], sel["b"]))
                sel_lbl.config(text=f"selection:   {a:.2f}s  to  {b:.2f}s    "
                               f"(length {b - a:.2f}s)")

        def press(ev):
            x = max(0, min(W, ev.x))
            sel["a"], sel["b"] = x, x
            redraw()
            upd()

        def drag(ev):
            if sel["a"] is None:
                return
            sel["b"] = max(0, min(W, ev.x))
            redraw()
            upd()
        canvas.bind("<ButtonPress-1>", press)
        canvas.bind("<B1-Motion>", drag)
        canvas.bind("<ButtonRelease-1>", drag)
        redraw()

        # ----- playback (hear the track / selection before cutting) -----
        def _play(wav):
            try:
                import winsound
                winsound.PlaySound(wav, winsound.SND_FILENAME | winsound.SND_ASYNC)
            except Exception:  # noqa: BLE001  (non-Windows)
                try:
                    os.startfile(wav)  # type: ignore[attr-defined]
                except Exception:  # noqa: BLE001
                    messagebox.showinfo("Playback", "Audio preview needs Windows.")

        def _stop():
            try:
                import winsound
                winsound.PlaySound(None, winsound.SND_PURGE)
            except Exception:  # noqa: BLE001
                pass

        def play_all():
            tmp = os.path.join(_user_data_dir(), "_preview_all.wav")
            try:
                r = _run_ffmpeg(["-i", p, "-ac", "2", "-c:a", "pcm_s16le", tmp])
                if r.returncode != 0:
                    raise ValueError("decode failed")
            except Exception as exc:  # noqa: BLE001
                messagebox.showerror("Playback", str(exc))
                return
            _play(tmp)

        def play_sel():
            if sel["a"] is None or sel["b"] is None or abs(sel["b"] - sel["a"]) < 2:
                messagebox.showinfo("Playback", "Drag to select a section first.")
                return
            a, b = t_of(min(sel["a"], sel["b"])), t_of(max(sel["a"], sel["b"]))
            tmp = os.path.join(_user_data_dir(), "_preview_sel.wav")
            try:
                snip_audio(p, a, b, "wav", "High", tmp)
            except Exception as exc:  # noqa: BLE001
                messagebox.showerror("Playback", str(exc))
                return
            _play(tmp)

        play_row = ttk.Frame(win)
        play_row.pack(fill="x", padx=20, pady=(8, 0))
        ttk.Button(play_row, text="Play selection", command=play_sel).pack(side="left")
        ttk.Button(play_row, text="Play whole track", command=play_all).pack(
            side="left", padx=6)
        ttk.Button(play_row, text="Stop", command=_stop).pack(side="left")
        win.protocol("WM_DELETE_WINDOW", lambda: (_stop(), win.destroy()))

        ctrl = ttk.Frame(win)
        ctrl.pack(fill="x", padx=20, pady=14)
        ttk.Label(ctrl, text="Export as").pack(side="left")
        efmt = tk.StringVar(value="mp3")
        ttk.Combobox(ctrl, textvariable=efmt, values=["mp3", "wav", "flac", "m4a", "ogg"],
                     width=7, state="readonly").pack(side="left", padx=6)
        ttk.Label(ctrl, text="Quality").pack(side="left", padx=(8, 0))
        eq = tk.StringVar(value="High")
        ttk.Combobox(ctrl, textvariable=eq, values=QUALITY_TIERS, width=11,
                     state="readonly").pack(side="left", padx=6)

        def export():
            if sel["a"] is None or sel["b"] is None or abs(sel["b"] - sel["a"]) < 2:
                messagebox.showinfo("Snip", "Drag across the waveform to select a "
                                    "section first.")
                return
            a, b = t_of(min(sel["a"], sel["b"])), t_of(max(sel["a"], sel["b"]))
            try:
                out = snip_audio(p, a, b, efmt.get(), eq.get())
            except Exception as exc:  # noqa: BLE001
                messagebox.showerror("Snip", str(exc))
                return
            write(f"Snippet [{a:.2f}s to {b:.2f}s] -> {os.path.basename(out)} "
                  f"({efmt.get()} {eq.get()})\n")
            messagebox.showinfo("Saved snippet", out)
        ttk.Button(ctrl, text="Close", command=win.destroy).pack(side="right")
        ttk.Button(ctrl, text="Export snippet", style="Accent.TButton",
                   command=export).pack(side="right", padx=8)

    # ---------- Detectors window ----------
    def do_detectors():
        import webbrowser
        fs = sel_files()
        p = fs[0] if fs else None
        win = tk.Toplevel(root)
        win.title("Layer 2 / 3 — verify provenance")
        win.configure(bg=BG)
        win.geometry("600x470")
        win.transient(root)
        ttk.Label(win, text="Layer 2 — C2PA Content Credentials",
                  style="Head.TLabel").pack(anchor="w", padx=16, pady=(14, 4))
        box = scrolledtext.ScrolledText(win, height=8, wrap="word",
                                        font=("Consolas", 9), bg="white",
                                        borderwidth=1, relief="solid")
        box.pack(fill="x", padx=16)
        if p and os.path.isfile(p):
            present, details = c2pa_local(_read(p))
            if present:
                box.insert("end", f"Signed C2PA manifest FOUND in {os.path.basename(p)}:\n")
                for d in details:
                    box.insert("end", f"  - {d}\n")
            else:
                box.insert("end", f"No C2PA manifest in {os.path.basename(p)} "
                           "(local scan).\n")
            if _c2patool_path():
                _, detail = detect_c2pa_external(p)
                box.insert("end", f"\nVerified with bundled c2patool -> {detail}\n")
        else:
            box.insert("end", "Add a file first, then reopen this window.\n")
        box.configure(state="disabled")
        ttk.Label(win, text="Most music (incl. AI tracks from Suno / Udio) carries NO "
                  "Content Credentials —\n'none detected' is the normal, correct "
                  "answer.", style="Muted.TLabel").pack(anchor="w", padx=16, pady=(8, 0))
        ttk.Button(win, text="Open online verifier (optional second opinion)",
                   command=lambda: webbrowser.open(DETECTOR_VERIFY_URL)).pack(
                       anchor="w", padx=16, pady=6)
        ttk.Label(win, text="Layer 3 — SynthID / acoustic fingerprint",
                  style="Head.TLabel").pack(anchor="w", padx=16, pady=(10, 4))
        ttk.Label(win, text="No public, self-serve detector exists for AI-audio "
                  "watermarks. They live in the\nwaveform, not the file, so nothing "
                  "here can read or remove them.",
                  style="Muted.TLabel").pack(anchor="w", padx=16)
        ttk.Button(win, text="How SynthID works (info only)",
                   command=lambda: webbrowser.open(DETECTOR_SYNTHID_INFO)).pack(
                       anchor="w", padx=16, pady=(6, 12))

    # ---------- action bar (aligned grid) ----------
    actions = ttk.Labelframe(root, text="  Actions  ", padding=10)
    actions.pack(fill="x", padx=16, pady=(0, 14))
    buttons = [
        ("Inspect", do_inspect, "TButton"),
        ("Strip junk + save", do_clean, "Accent.TButton"),
        ("Imprint tags + save", do_tag, "Green.TButton"),
        ("Convert…", open_convert, "TButton"),
        ("Waveform / Snip…", open_waveform, "TButton"),
        ("Normalize", do_normalize, "TButton"),
        ("Set cover…", do_cover, "TButton"),
        ("Detectors…", do_detectors, "TButton"),
        ("Batch folder…", do_batch, "TButton"),
        ("Get ffmpeg", do_get_ffmpeg, "TButton"),
    ]
    cols = 5
    for i, (label, cmd, st) in enumerate(buttons):
        r, c = divmod(i, cols)
        ttk.Button(actions, text=label, command=cmd, style=st).grid(
            row=r, column=c, sticky="ew", padx=4, pady=4)
    for c in range(cols):
        actions.columnconfigure(c, weight=1, uniform="act")

    # ---------- init ----------
    defaults = _load_default_tags()
    if defaults:
        fill_form(defaults)
    refresh_files()
    if state["files"]:
        files_list.selection_set(0)
        do_inspect()

    root.mainloop()
    return 0



_SUBCOMMANDS = {"inspect", "clean", "tag", "gui", "convert", "trim",
                "normalize", "snip", "cover", "extract-cover", "install-ffmpeg"}


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
    pcv.add_argument("--to", required=True, help="target: mp3/m4a/aac/ogg/opus/flac/wav/aiff")
    pcv.add_argument("--quality", default="High", choices=QUALITY_TIERS,
                     help="HD / Max, High, Standard, or Small")
    pcv.add_argument("-o", "--out", default=None)
    ptr = sub.add_parser("trim", help="cut a section (ffmpeg; lossless stream copy)")
    ptr.add_argument("file")
    ptr.add_argument("--start", default=None, help="start time, e.g. 0:30 or 12.5")
    ptr.add_argument("--end", default=None, help="end time, e.g. 1:45")
    ptr.add_argument("-o", "--out", default=None)
    pnm = sub.add_parser("normalize", help="loudness-normalize to -14 LUFS (ffmpeg; re-encodes)")
    pnm.add_argument("file")
    pnm.add_argument("-o", "--out", default=None)
    psn = sub.add_parser("snip", help="save a section [start,end] seconds (ffmpeg)")
    psn.add_argument("file")
    psn.add_argument("--start", type=float, required=True, help="start time in seconds")
    psn.add_argument("--end", type=float, required=True, help="end time in seconds")
    psn.add_argument("--to", default=None, help="output format (default: same as input)")
    psn.add_argument("--quality", default="High", choices=QUALITY_TIERS)
    psn.add_argument("-o", "--out", default=None)
    pco = sub.add_parser("cover", help="embed a cover image (ffmpeg; lossless)")
    pco.add_argument("file")
    pco.add_argument("--image", required=True, help="path to JPG/PNG cover")
    pco.add_argument("-o", "--out", default=None)
    pxc = sub.add_parser("extract-cover", help="save the embedded cover image (ffmpeg)")
    pxc.add_argument("file")
    pxc.add_argument("-o", "--out", default=None)

    sub.add_parser("install-ffmpeg", help="download ffmpeg for any-format + editing")
    pg = sub.add_parser("gui", help="launch the click-to-run window")
    pg.add_argument("file", nargs="?", default=None, help="optional file to preload")
    args = p.parse_args(raw)

    if args.cmd == "gui":
        return cmd_gui(args.file)
    if args.cmd == "install-ffmpeg":
        return cmd_install_ffmpeg()

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
        return cmd_edit("convert", args.file, args.out, to=args.to, quality=args.quality)
    if args.cmd == "trim":
        return cmd_edit("trim", args.file, args.out, start=args.start, end=args.end)
    if args.cmd == "normalize":
        return cmd_edit("normalize", args.file, args.out)
    if args.cmd == "snip":
        if not ffmpeg_path():
            print("error: snip needs ffmpeg. Run:  provenance.py install-ffmpeg",
                  file=sys.stderr)
            return 2
        try:
            out = snip_audio(args.file, args.start, args.end, args.to,
                             args.quality, args.out)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
        print(f"Wrote {out}  (section {args.start:.2f}s -> {args.end:.2f}s)")
        return 0
    if args.cmd == "cover":
        return cmd_edit("cover", args.file, args.out, image=args.image)
    if args.cmd == "extract-cover":
        return cmd_edit("extract-cover", args.file, args.out)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
