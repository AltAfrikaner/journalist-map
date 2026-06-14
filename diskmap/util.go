package main

import (
	"fmt"
	"strconv"
	"time"
)

// humanBytes renders a byte count as a human-readable string (KB/MB/GB...).
func humanBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// commas inserts thousands separators into an integer.
func commas(n int64) string {
	s := strconv.FormatInt(n, 10)
	neg := false
	if len(s) > 0 && s[0] == '-' {
		neg = true
		s = s[1:]
	}
	var out []byte
	for i, c := range []byte(s) {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, c)
	}
	if neg {
		return "-" + string(out)
	}
	return string(out)
}

type ticker struct{ t *time.Ticker }

func newTicker() *ticker { return &ticker{t: time.NewTicker(200 * time.Millisecond)} }

// waitWithProgress blocks until the scan result arrives, printing live counts.
func waitWithProgress(done <-chan *ScanResult, prog *progress, tk *ticker) *ScanResult {
	defer tk.t.Stop()
	for {
		select {
		case res := <-done:
			return res
		case <-tk.t.C:
			files, dirs, bytes := prog.snapshot()
			fmt.Printf("\rScanning... %s files, %s folders, %s   ",
				commas(files), commas(dirs), humanBytes(bytes))
		}
	}
}
