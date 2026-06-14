# DiskMap

A fast, **local-only** disk space analyzer for Windows (also Linux/macOS).
A lightweight, modern alternative to TreeSize Professional — single standalone
`.exe`, no installer required, no dependencies, **nothing ever leaves your PC**.

## Features

- **Fast concurrent scan** of any folder or drive, with live progress.
- **Interactive treemap** — click to drill in, breadcrumb to climb back out.
- **Largest files** list with size bars (click a row to reveal it in Explorer).
- **File-type breakdown** — see which extensions eat your disk.
- **Duplicate finder** — buckets by size, verifies with SHA-256, parallelised
  across all CPU cores, and reports exactly how much space is reclaimable.
- **Reports**: export full results as JSON or the largest-files list as CSV.
- **Two interfaces in one binary**: a local web UI *and* a scriptable CLI.
- **Local-only**: the UI binds to `127.0.0.1` only. No telemetry, no network.

## Quick start (Windows)

1. Copy `diskmap.exe` anywhere (Desktop is fine — no install needed).
2. **Double-click `diskmap.exe`** → a console shows a `http://127.0.0.1:8731/`
   URL and your browser opens the UI automatically.
3. Type a path (e.g. `C:\`) and click **Scan**.

### Run with Administrator rights (optional, for the fastest/deepest scans)

Right-click `diskmap.exe` → **Run as administrator**, or double-click
**`Run-DiskMap-as-Admin.bat`**. Admin lets DiskMap read protected/locked
system files that a normal user can't.

## Command line

```
diskmap                       Launch the web UI and open the browser
diskmap serve --port 8731     Launch the web UI (add --open to open browser)
diskmap scan C:\Users --dup   Scan from the terminal and print a report

Scan flags:
  --dup            also run the duplicate finder (slower)
  --top N          number of largest files to print (default 20)
  --json <file>    write the full result as JSON
  --csv  <file>    write the largest-files list as CSV
```

Examples:

```
diskmap scan D:\Media --top 30
diskmap scan C:\Users\me --dup --json report.json --csv biggest.csv
```

## Build from source

Requires Go 1.24+. No external modules.

```
./build.sh                # produces dist/diskmap.exe + linux/macOS binaries
```

The Windows `.exe` is built with `CGO_ENABLED=0` (pure Go), so it is a single
self-contained file that runs on any 64-bit Windows with no runtime to install.

## Notes & limits (vs TreeSize Professional)

- Scanning uses the Windows directory APIs. Direct **NTFS MFT** parsing (for
  WizTree-class instant scans) is a planned upgrade, not in this version.
- Cloud/server connectors (S3, Azure, SharePoint, SSH) are **not** included —
  this release is focused on fast local-disk analysis.
- The `.exe` is unsigned; Windows SmartScreen may warn on first run
  (More info → Run anyway). Code-signing is a future step.
