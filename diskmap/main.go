// DiskMap — a fast, local-only disk space analyzer.
//
// Modes:
//   diskmap                       launch the web UI and open the browser
//   diskmap serve [--port N]      launch the web UI without opening a browser
//   diskmap scan <path> [flags]   scan from the command line, print a report
//
// Everything runs locally. The web UI binds to 127.0.0.1 only.
package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		// No args (e.g. double-clicked on Windows): launch UI + browser.
		if err := Serve(8731, true); err != nil {
			fatal(err)
		}
		return
	}

	switch os.Args[1] {
	case "serve":
		fs := flag.NewFlagSet("serve", flag.ExitOnError)
		port := fs.Int("port", 8731, "localhost port to bind")
		open := fs.Bool("open", false, "open the default browser")
		_ = fs.Parse(os.Args[2:])
		if err := Serve(*port, *open); err != nil {
			fatal(err)
		}
	case "scan":
		runScan(os.Args[2:])
	case "-h", "--help", "help":
		usage()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", os.Args[1])
		usage()
		os.Exit(2)
	}
}

func runScan(args []string) {
	fs := flag.NewFlagSet("scan", flag.ExitOnError)
	jsonOut := fs.String("json", "", "write full result as JSON to this file")
	csvOut := fs.String("csv", "", "write largest-files list as CSV to this file")
	dedup := fs.Bool("dup", false, "also run the duplicate finder (slower)")
	top := fs.Int("top", 20, "how many largest files to print")

	// Allow the path either before or after flags (Go's flag package stops at
	// the first positional arg, so we pull a leading path out ourselves).
	var path string
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		path = args[0]
		args = args[1:]
	}
	_ = fs.Parse(args)
	if path == "" {
		path = fs.Arg(0)
	}
	if path == "" {
		fmt.Fprintln(os.Stderr, "usage: diskmap scan <path> [--dup] [--json file] [--csv file] [--top N]")
		os.Exit(2)
	}

	prog := &progress{}
	done := make(chan *ScanResult, 1)
	var scanErr error
	go func() {
		res, err := Scan(path, *dedup, prog)
		scanErr = err
		done <- res
	}()

	// Live progress ticker on the same line.
	ticker := newTicker()
	res := waitWithProgress(done, prog, ticker)
	if scanErr != nil {
		fatal(scanErr)
	}

	fmt.Printf("\nScanned: %s\n", path)
	fmt.Printf("Total size : %s\n", humanBytes(res.TotalSize))
	fmt.Printf("Files      : %s\n", commas(res.TotalFiles))
	fmt.Printf("Folders    : %s\n", commas(res.TotalDirs))
	if res.Skipped > 0 {
		fmt.Printf("Skipped    : %s (permission denied / unreadable)\n", commas(res.Skipped))
	}
	fmt.Printf("Elapsed    : %.2fs\n", res.Elapsed)

	fmt.Printf("\nTop %d largest files:\n", *top)
	for i, f := range res.Largest {
		if i >= *top {
			break
		}
		fmt.Printf("  %10s  %s\n", humanBytes(f.Size), f.Path)
	}

	fmt.Printf("\nLargest file types:\n")
	for i, e := range res.Extensions {
		if i >= 10 {
			break
		}
		fmt.Printf("  %-10s %10s  (%s files)\n", e.Ext, humanBytes(e.Size), commas(e.Count))
	}

	if *dedup {
		var wasted int64
		for _, g := range res.Duplicates {
			wasted += g.Wasted
		}
		fmt.Printf("\nDuplicates : %d groups, %s reclaimable\n", len(res.Duplicates), humanBytes(wasted))
		for i, g := range res.Duplicates {
			if i >= 10 {
				break
			}
			fmt.Printf("  %s wasted (%d copies of %s):\n", humanBytes(g.Wasted), len(g.Files), humanBytes(g.Size))
			for _, f := range g.Files {
				fmt.Printf("      %s\n", f.Path)
			}
		}
	}

	if *jsonOut != "" {
		writeJSON(*jsonOut, res)
		fmt.Printf("\nWrote JSON report: %s\n", *jsonOut)
	}
	if *csvOut != "" {
		writeCSV(*csvOut, res)
		fmt.Printf("Wrote CSV report : %s\n", *csvOut)
	}
}

func writeJSON(path string, res *ScanResult) {
	f, err := os.Create(path)
	if err != nil {
		fatal(err)
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(res); err != nil {
		fatal(err)
	}
}

func writeCSV(path string, res *ScanResult) {
	f, err := os.Create(path)
	if err != nil {
		fatal(err)
	}
	defer f.Close()
	w := csv.NewWriter(f)
	defer w.Flush()
	_ = w.Write([]string{"size_bytes", "size_human", "path"})
	files := append([]FileRef(nil), res.Largest...)
	sort.Slice(files, func(i, j int) bool { return files[i].Size > files[j].Size })
	for _, fr := range files {
		_ = w.Write([]string{strconv.FormatInt(fr.Size, 10), humanBytes(fr.Size), fr.Path})
	}
}

func usage() {
	fmt.Print(`DiskMap — fast, local-only disk space analyzer

USAGE
  diskmap                      Launch the web UI and open your browser
  diskmap serve [--port N]     Launch the web UI (use --open to open browser)
  diskmap scan <path> [flags]  Scan a folder from the command line

SCAN FLAGS
  --dup            also run the duplicate finder (slower)
  --top N          number of largest files to print (default 20)
  --json <file>    write the full result as JSON
  --csv  <file>    write the largest-files list as CSV

Everything runs on your machine. The web UI binds to 127.0.0.1 only.
`)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "error:", err)
	os.Exit(1)
}
