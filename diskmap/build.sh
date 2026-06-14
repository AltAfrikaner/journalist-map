#!/usr/bin/env bash
# Build standalone, dependency-free binaries for DiskMap.
# Produces a Windows .exe plus Linux/macOS binaries. No cgo, no external deps.
set -euo pipefail
cd "$(dirname "$0")"

OUT="dist"
mkdir -p "$OUT"
VERSION="${1:-1.0.0}"
LDFLAGS="-s -w"   # strip symbols → smaller binary

echo "Building DiskMap v$VERSION ..."

# Windows (the primary target) — single self-contained .exe
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "$LDFLAGS" -o "$OUT/diskmap.exe" .
echo "  -> $OUT/diskmap.exe"

# Linux + macOS (handy for testing / cross-platform use)
CGO_ENABLED=0 GOOS=linux   GOARCH=amd64 go build -trimpath -ldflags "$LDFLAGS" -o "$OUT/diskmap-linux"   .
CGO_ENABLED=0 GOOS=darwin  GOARCH=arm64 go build -trimpath -ldflags "$LDFLAGS" -o "$OUT/diskmap-macos"   .
echo "  -> $OUT/diskmap-linux, $OUT/diskmap-macos"

# Ship the admin-launch helper next to the Windows exe.
cp "Run-DiskMap-as-Admin.bat" "$OUT/" 2>/dev/null || true

# Checksums so users can verify integrity.
( cd "$OUT" && sha256sum diskmap.exe diskmap-linux diskmap-macos > SHA256SUMS.txt )

echo "Done. Artifacts in ./$OUT :"
ls -lh "$OUT"
