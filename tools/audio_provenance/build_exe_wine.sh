#!/usr/bin/env bash
# ===================================================================
# Build a REAL Windows AISoundStripper.exe on Linux via Wine, then wrap it
# in a single Setup.exe installer (NSIS). This documents/reproduces exactly
# how the shipped AISoundStripper-Setup.exe was produced when no Windows
# machine was available.
#
# Why this exists: PyInstaller only builds for the OS it runs on, so a
# Windows .exe needs either Windows or a Windows Python under Wine.
#
# Requirements (installed on a Debian/Ubuntu box):
#   sudo apt-get install -y wine64 wine nsis icoutils
# Network: github.com + pypi.org reachable (python.org may be blocked;
# we fetch CPython from the python-build-standalone GitHub releases,
# which include Tcl/Tk so the tkinter GUI works).
# ===================================================================
set -euo pipefail
cd "$(dirname "$0")"

PBS_TAG="${PBS_TAG:-20241016}"
PBS_VER="${PBS_VER:-3.12.7}"
PBS_URL="https://github.com/astral-sh/python-build-standalone/releases/download/${PBS_TAG}/cpython-${PBS_VER}+${PBS_TAG}-x86_64-pc-windows-msvc-install_only.tar.gz"

export WINEARCH=win64
export WINEPREFIX="${WINEPREFIX:-$HOME/.winep-aisoundstripper}"
export WINEDEBUG=-all
export WINEDLLOVERRIDES="mscoree,mshtml="

WINPY_DIR="${WINPY_DIR:-$HOME/winpy-aisoundstripper}"
WINPY="$WINPY_DIR/python/python.exe"

echo "[1/5] Initializing Wine prefix at $WINEPREFIX ..."
command -v wine >/dev/null || { echo "install wine64/wine first"; exit 1; }
[ -d "$WINEPREFIX" ] || wineboot --init >/dev/null 2>&1 || true

echo "[2/5] Fetching Windows CPython (with Tcl/Tk) ..."
if [ ! -f "$WINPY" ]; then
    mkdir -p "$WINPY_DIR"
    curl -fsSL -o "$WINPY_DIR/winpy.tar.gz" "$PBS_URL"
    tar -xzf "$WINPY_DIR/winpy.tar.gz" -C "$WINPY_DIR"
fi
wine "$WINPY" --version

echo "[3/5] Installing PyInstaller + tkinterdnd2 into the Windows Python ..."
wine "$WINPY" -m ensurepip --upgrade >/dev/null 2>&1 || true
wine "$WINPY" -m pip install --no-warn-script-location --quiet pyinstaller tkinterdnd2

echo "[3b/5] Fetching c2patool.exe to ship beside the app (offline C2PA) ..."
mkdir -p msi/vendor
C2PATOOL_VER="${C2PATOOL_VER:-v0.9.12}"
if [ ! -f msi/vendor/c2patool.exe ]; then
    curl -fsSL -o /tmp/c2patool.zip \
        "https://github.com/contentauth/c2patool/releases/download/${C2PATOOL_VER}/c2patool-${C2PATOOL_VER}-x86_64-pc-windows-msvc.zip"
    ( cd /tmp && rm -rf c2pt && mkdir c2pt && cd c2pt && unzip -oq /tmp/c2patool.zip )
    cp "$(find /tmp/c2pt -iname c2patool.exe | head -1)" msi/vendor/c2patool.exe
fi
# NOTE: ffmpeg is NOT bundled (it is ~100 MB, which bloats the installer past
# typical download limits). The app fetches it on first use of an any-format /
# editing feature, into %LOCALAPPDATA%\AISoundStripper (see download_ffmpeg()).

echo "[4/5] Building Windows exe (plain onefile; c2patool ships beside it) ..."
ICON_WIN="$(wine winepath -w "$PWD/msi/aisoundstripper.ico" 2>/dev/null | tr -d '\r')"
SCRIPT_WIN="$(wine winepath -w "$PWD/provenance.py" 2>/dev/null | tr -d '\r')"
wine "$WINPY" -m PyInstaller --onefile --windowed \
    --icon "$ICON_WIN" --name AISoundStripper \
    --collect-all tkinterdnd2 \
    --distpath msi/dist --workpath /tmp/wpyi-build --specpath /tmp/wpyi-spec \
    "$SCRIPT_WIN"
file msi/dist/AISoundStripper.exe
command -v wrestool >/dev/null && \
    echo "icon resources embedded: $(wrestool -l msi/dist/AISoundStripper.exe | grep -c 'type=icon')"

echo "[5/5] Building the Setup.exe installer (NSIS) ..."
# Requires: apt-get install nsis
command -v makensis >/dev/null || { echo "install nsis first (apt-get install nsis)"; exit 1; }
( cd msi && makensis aisoundstripper.nsi >/dev/null )
echo "Built: $PWD/msi/AISoundStripper-Setup.exe (no Python needed on target)"
