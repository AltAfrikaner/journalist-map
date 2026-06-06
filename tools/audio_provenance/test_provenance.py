#!/usr/bin/env python3
"""Self-contained tests: synthesize files with metadata, strip, verify.

Each test asserts two things that matter:
  (1) the audio payload is preserved byte-for-byte (no generation loss), and
  (2) the metadata / provenance markers are actually gone.
"""
import struct
import tempfile
import os

import provenance as P


def _synth_mp3(audio: bytes) -> bytes:
    # ID3v2 tag with a TXXX (AI marker) + TSSE frame, then audio, then ID3v1.
    def frame(fid: bytes, payload: bytes) -> bytes:
        return fid + struct.pack(">I", len(payload)) + b"\x00\x00" + payload

    body = (frame(b"TXXX", b"\x00ai_tool\x00SunoBot v4\x00")
            + frame(b"TSSE", b"\x00Suno"))
    size = len(body)
    syncsafe = bytes([(size >> 21) & 0x7F, (size >> 14) & 0x7F,
                      (size >> 7) & 0x7F, size & 0x7F])
    id3v2 = b"ID3\x04\x00\x00" + syncsafe + body
    id3v1 = b"TAG" + b"\x00" * 125
    return id3v2 + audio + id3v1


def _synth_wav(audio: bytes) -> bytes:
    fmt = struct.pack("<HHIIHH", 1, 1, 8000, 8000, 1, 8)
    info = b"INFOISFT" + struct.pack("<I", 6) + b"Suno\x00\x00"  # software tag
    list_chunk = b"LIST" + struct.pack("<I", len(info)) + info
    bext = b"bext" + struct.pack("<I", 8) + b"AImadeit"
    data_chunk = b"data" + struct.pack("<I", len(audio)) + audio
    fmt_chunk = b"fmt " + struct.pack("<I", len(fmt)) + fmt
    body = b"WAVE" + fmt_chunk + list_chunk + bext + data_chunk
    return b"RIFF" + struct.pack("<I", len(body)) + body


def _synth_flac(audio: bytes) -> bytes:
    streaminfo = b"\x00" * 34  # 34-byte STREAMINFO payload (content irrelevant here)
    vorbis = b"\x20\x00\x00\x00vendor=Suno\x00\x00\x00\x00"  # VORBIS_COMMENT-ish
    out = bytearray(b"fLaC")
    # STREAMINFO (type 0, not last)
    out += bytes([0x00]) + struct.pack(">I", len(streaminfo))[1:] + streaminfo
    # VORBIS_COMMENT (type 4, last metadata block)
    out += bytes([0x80 | 4]) + struct.pack(">I", len(vorbis))[1:] + vorbis
    out += audio
    return bytes(out)


def _run(tag, raw_factory, audio, ext):
    with tempfile.TemporaryDirectory() as d:
        inp = os.path.join(d, f"in{ext}")
        with open(inp, "wb") as fh:
            fh.write(raw_factory(audio))

        # inspect should run without error
        P.cmd_inspect(inp)

        out = os.path.join(d, f"out{ext}")
        assert P.cmd_clean(inp, out) == 0
        cleaned = P._read(out)

        # (1) audio survives byte-for-byte
        assert audio in cleaned, f"{tag}: audio payload lost!"
        # (2) the planted markers are gone
        low = cleaned.lower()
        assert b"suno" not in low, f"{tag}: metadata marker survived!"
        assert b"aimadeit" not in low, f"{tag}: bext marker survived!"
        print(f"PASS {tag}: {len(raw_factory(audio))} -> {len(cleaned)} bytes, "
              f"audio intact, markers removed")


def main():
    audio = bytes(range(256)) * 8  # 2 KiB of distinctive 'audio'
    _run("MP3", _synth_mp3, audio, ".mp3")
    _run("WAV", _synth_wav, audio, ".wav")
    _run("FLAC", _synth_flac, audio, ".flac")
    print("\nALL TESTS PASSED")


if __name__ == "__main__":
    main()
