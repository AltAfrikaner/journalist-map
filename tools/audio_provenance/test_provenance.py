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


def _run_tag(tag, raw_factory, audio, ext):
    """Write provenance tags, read them back, assert round-trip + audio intact."""
    want = {
        "title": "Dans Ritme", "artist": "DuneSurfer",
        "album": "Desert Sessions", "year": "2026", "genre": "Electronic",
        "comment": "made in a DAW", "creation_type": "AI-assisted (human-edited)",
    }
    with tempfile.TemporaryDirectory() as d:
        inp = os.path.join(d, f"in{ext}")
        with open(inp, "wb") as fh:
            fh.write(raw_factory(audio))

        out, n_in, n_out, written = P.process_tag(inp, want, os.path.join(d, f"out{ext}"))
        blob = P._read(out)

        # (1) audio survives byte-for-byte
        assert audio in blob, f"{tag}-tag: audio payload lost!"
        # (2) every field round-trips through the real container format
        for k, v in want.items():
            assert written.get(k) == v, (
                f"{tag}-tag: field {k!r} got {written.get(k)!r}, expected {v!r}")
        # (3) re-tagging replaces (not duplicates) — write again, still one value
        out2, _, _, written2 = P.process_tag(out, {"artist": "Someone Else"},
                                              os.path.join(d, f"re{ext}"))
        assert written2.get("artist") == "Someone Else", f"{tag}-tag: retag failed"
        assert audio in P._read(out2), f"{tag}-tag: audio lost on retag"
        print(f"PASS {tag}-tag: 7 fields round-tripped, audio intact, retag clean")


def _tone_wav(path):
    """Synthesize a real 1s WAV via ffmpeg (for the universal-engine tests)."""
    import subprocess
    subprocess.run([P.ffmpeg_path(), "-nostdin", "-y", "-f", "lavfi",
                    "-i", "sine=frequency=440:duration=1", "-c:a", "pcm_s16le", path],
                   capture_output=True, check=True)


def _run_ffmpeg_formats():
    """Universal (ffmpeg) path: convert, tag, strip, batch for M4A/OGG."""
    if not P.have_ffmpeg():
        print("SKIP ffmpeg tests (ffmpeg not installed)")
        return
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "tone.wav")
        _tone_wav(wav)

        # convert WAV -> M4A and OGG (re-encode)
        m4a = P.convert_audio(wav, "m4a", os.path.join(d, "t.m4a"))
        ogg = P.convert_audio(wav, "ogg", os.path.join(d, "t.ogg"))
        assert os.path.getsize(m4a) > 0 and os.path.getsize(ogg) > 0

        # tag M4A: standard fields persist; creation_type folded into comment
        _o, _i, _n, w = P.process_tag(m4a, {"artist": "DuneSurfer", "title": "Tone",
                                            "creation_type": "AI-generated"},
                                      os.path.join(d, "t2.m4a"))
        assert w.get("artist") == "DuneSurfer", f"M4A artist lost: {w}"
        assert "AI-generated" in (w.get("comment", "")), f"M4A creation_type lost: {w}"

        # tag OGG: Vorbis keeps the dedicated creation_type field
        _o, _i, _n, w = P.process_tag(ogg, {"artist": "DuneSurfer",
                                            "creation_type": "AI-generated"},
                                      os.path.join(d, "t2.ogg"))
        assert w.get("artist") == "DuneSurfer", f"OGG artist lost: {w}"
        assert w.get("creation_type") == "AI-generated", f"OGG creation_type lost: {w}"

        # strip removes container metadata (ffmpeg path)
        res = P.process_clean(os.path.join(d, "t2.ogg"), os.path.join(d, "t3.ogg"))
        assert not P.ffmpeg_read_tags(res.out).get("artist"), "OGG strip failed"

        # batch: folder of two wavs -> clean all
        import shutil as _sh
        _sh.copy(wav, os.path.join(d, "a.wav"))
        _sh.copy(wav, os.path.join(d, "b.wav"))
        rc = P.cmd_batch(d, "clean", {}, recursive=False)
        assert rc == 0 and os.path.exists(os.path.join(d, "a.clean.wav"))

        # cover art: m4a in place, and WAV -> lossless FLAC copy (was the 0-byte bug)
        import subprocess
        import shutil as _sh2
        img = os.path.join(d, "c.jpg")
        subprocess.run([P.ffmpeg_path(), "-nostdin", "-y", "-f", "lavfi",
                        "-i", "color=c=blue:s=120x120:d=1", "-frames:v", "1", img],
                       capture_output=True, check=True)
        cm = P.set_cover(m4a, img, os.path.join(d, "cov.m4a"))
        cf = P.set_cover(wav, img, os.path.join(d, "cov.flac"), to_ext=".flac")
        assert os.path.getsize(cm) > 0 and os.path.getsize(cf) > 0, "cover output is empty!"
        ffprobe = _sh2.which("ffprobe")
        if ffprobe:
            for f in (cm, cf):
                r = subprocess.run([ffprobe, "-v", "error", "-select_streams", "v",
                                    "-show_entries", "stream=codec_name", "-of",
                                    "csv=p=0", f], capture_output=True, text=True)
                assert r.stdout.strip(), f"no embedded cover in {f}"
        print("PASS ffmpeg: convert + tag (M4A/OGG) + strip + batch + cover")


def main():
    audio = bytes(range(256)) * 8  # 2 KiB of distinctive 'audio'
    _run("MP3", _synth_mp3, audio, ".mp3")
    _run("WAV", _synth_wav, audio, ".wav")
    _run("FLAC", _synth_flac, audio, ".flac")
    _run_tag("MP3", _synth_mp3, audio, ".mp3")
    _run_tag("WAV", _synth_wav, audio, ".wav")
    _run_tag("FLAC", _synth_flac, audio, ".flac")
    _run_ffmpeg_formats()
    print("\nALL TESTS PASSED")


if __name__ == "__main__":
    main()
