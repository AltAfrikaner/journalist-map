#!/usr/bin/env bash
# Build the SELF-CONTAINED AISoundStripper-Standalone.msi from an already-built
# Windows exe, using wixl (msitools). Use this when the exe was produced
# elsewhere (e.g. PyInstaller on Windows) and you want the MSI built on
# Linux/macOS.
#
#   1) Put the bundled exe at:  msi/dist/AISoundStripper.exe
#   2) ./build_standalone_msi.sh
#
# Output: AISoundStripper-Standalone.msi (needs no Python on the target PC).
set -euo pipefail
cd "$(dirname "$0")"

EXE="msi/dist/AISoundStripper.exe"
if [ ! -f "$EXE" ]; then
    echo "error: $EXE not found." >&2
    echo "Build it first (on Windows): " >&2
    echo "  pyinstaller --onefile --windowed --icon msi/aisoundstripper.ico \\" >&2
    echo "              --name AISoundStripper --distpath msi/dist provenance.py" >&2
    echo "Then copy msi/dist/AISoundStripper.exe here and re-run." >&2
    exit 1
fi
command -v wixl >/dev/null 2>&1 || { echo "error: install wixl (apt-get install wixl)"; exit 1; }

( cd msi && wixl -o ../AISoundStripper-Standalone.msi aisoundstripper-standalone.wxs )
echo "Built: $(pwd)/AISoundStripper-Standalone.msi"
command -v msiinfo >/dev/null 2>&1 && msiinfo suminfo AISoundStripper-Standalone.msi | sed -n '1,4p'
