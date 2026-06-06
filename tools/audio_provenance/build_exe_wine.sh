#!/usr/bin/env bash
# ===================================================================
# Build a REAL Windows AISoundStripper.exe on Linux via Wine, then the
# self-contained MSI. This documents/reproduces exactly how the shipped
# AISoundStripper-Standalone.msi was produced when no Windows machine
# was available.
#
# Why this exists: PyInstaller only builds for the OS it runs on, so a
# Windows .exe needs either Windows or a Windows Python under Wine.
#
# Requirements (installed on a Debian/Ubuntu box):
#   sudo apt-get install -y wine64 wine wixl icoutils
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

echo "[3/5] Installing PyInstaller into the Windows Python ..."
wine "$WINPY" -m ensurepip --upgrade >/dev/null 2>&1 || true
wine "$WINPY" -m pip install --no-warn-script-location --quiet pyinstaller

echo "[4/5] Building Windows exe (absolute paths so --icon resolves) ..."
ICON_WIN="$(wine winepath -w "$PWD/msi/aisoundstripper.ico" 2>/dev/null | tr -d '\r')"
SCRIPT_WIN="$(wine winepath -w "$PWD/provenance.py" 2>/dev/null | tr -d '\r')"
wine "$WINPY" -m PyInstaller --onefile --windowed \
    --icon "$ICON_WIN" --name AISoundStripper \
    --distpath msi/dist --workpath /tmp/wpyi-build --specpath /tmp/wpyi-spec \
    "$SCRIPT_WIN"
file msi/dist/AISoundStripper.exe
command -v wrestool >/dev/null && \
    echo "icon resources embedded: $(wrestool -l msi/dist/AISoundStripper.exe | grep -c 'type=icon')"

echo "[5/5] Packaging self-contained MSI with wixl ..."
( cd msi && wixl -o ../AISoundStripper-Standalone.msi aisoundstripper-standalone.wxs )
echo "Built: $PWD/AISoundStripper-Standalone.msi (no Python needed on target)"
