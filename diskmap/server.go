package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"time"
)

//go:embed web/*
var webFS embed.FS

// Serve starts the local-only web UI on 127.0.0.1:port and (optionally) opens
// the default browser. Nothing is exposed beyond localhost.
func Serve(port int, open bool) error {
	mux := http.NewServeMux()

	uiFS, err := fs.Sub(webFS, "web")
	if err != nil {
		return err
	}
	mux.Handle("/", http.FileServer(http.FS(uiFS)))

	mux.HandleFunc("/api/scan", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Query().Get("path")
		if path == "" {
			http.Error(w, "missing path", http.StatusBadRequest)
			return
		}
		dedup := r.URL.Query().Get("dedup") == "1"
		res, err := Scan(path, dedup, nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Trim the tree for transport: drop nodes < 0.05% of total, cap children.
		minSize := res.TotalSize / 2000
		pruned := *res
		pruned.Root = prune(res.Root, minSize, 200)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(pruned)
	})

	mux.HandleFunc("/api/roots", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(listRoots())
	})

	// /api/open reveals a path in the OS file manager (local convenience).
	mux.HandleFunc("/api/open", func(w http.ResponseWriter, r *http.Request) {
		revealInFileManager(r.URL.Query().Get("path"))
		w.WriteHeader(http.StatusNoContent)
	})

	addr := fmt.Sprintf("127.0.0.1:%d", port)
	url := "http://" + addr + "/"
	srv := &http.Server{Addr: addr, Handler: mux}

	var once sync.Once
	ready := make(chan struct{})
	go func() {
		// Give the listener a moment, then open the browser.
		for i := 0; i < 50; i++ {
			if _, err := http.Get(url + "favicon.ico"); err == nil {
				break
			}
			time.Sleep(50 * time.Millisecond)
		}
		once.Do(func() { close(ready) })
		if open {
			openBrowser(url)
		}
	}()

	fmt.Printf("DiskMap is running at %s  (local only — press Ctrl+C to stop)\n", url)
	return srv.ListenAndServe()
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func revealInFileManager(path string) {
	if path == "" {
		return
	}
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", "/select,", path)
	case "darwin":
		cmd = exec.Command("open", "-R", path)
	default:
		cmd = exec.Command("xdg-open", path)
	}
	_ = cmd.Start()
}

// listRoots returns sensible starting points for the path picker.
func listRoots() []string {
	if runtime.GOOS == "windows" {
		var roots []string
		for c := 'A'; c <= 'Z'; c++ {
			d := string(c) + ":\\"
			if _, err := os.Stat(d); err == nil {
				roots = append(roots, d)
			}
		}
		return roots
	}
	home, _ := os.UserHomeDir()
	roots := []string{"/"}
	if home != "" {
		roots = append(roots, home)
	}
	return roots
}
