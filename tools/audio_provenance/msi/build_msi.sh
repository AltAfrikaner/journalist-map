#!/usr/bin/env bash
# Build AISoundStripper.msi from source using wixl (msitools).
#
#   Linux/macOS:  sudo apt-get install -y wixl   # (package: wixl / msitools)
#                 ./build_msi.sh
#
#   The .wxs is standard WiX v3, so it also builds on Windows with the
#   WiX Toolset:  candle aisoundstripper.wxs && light aisoundstripper.wixobj
#
# Output: AISoundStripper.msi next to this script.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v wixl >/dev/null 2>&1; then
    echo "error: 'wixl' not found. Install it with:" >&2
    echo "    sudo apt-get install -y wixl wixl-data   # Debian/Ubuntu" >&2
    echo "    brew install msitools                    # macOS" >&2
    exit 1
fi

# The engine + README live one dir up; the .wxs references them via ../ .
test -f ../provenance.py || { echo "error: ../provenance.py missing" >&2; exit 1; }
test -f ../README.md     || { echo "error: ../README.md missing" >&2; exit 1; }

wixl -o AISoundStripper.msi aisoundstripper.wxs
echo "Built: $(pwd)/AISoundStripper.msi"
command -v msiinfo >/dev/null 2>&1 && msiinfo suminfo AISoundStripper.msi | sed -n '1,4p'
