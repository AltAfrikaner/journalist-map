package main

import (
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
	"sync/atomic"
	"time"
)

// Node represents a file or directory in the scanned tree.
type Node struct {
	Name     string  `json:"name"`
	Path     string  `json:"path"`
	IsDir    bool    `json:"dir"`
	Size     int64   `json:"size"`  // logical size in bytes (recursive for dirs)
	Files    int64   `json:"files"` // number of files (recursive for dirs)
	Modified int64   `json:"mtime"` // unix seconds
	Children []*Node `json:"children,omitempty"`
}

// ExtStat aggregates files of a single extension.
type ExtStat struct {
	Ext   string `json:"ext"`
	Size  int64  `json:"size"`
	Count int64  `json:"count"`
}

// FileRef is a lightweight reference to a single file, used for the
// "largest files" and duplicate-finder passes.
type FileRef struct {
	Path string `json:"path"`
	Size int64  `json:"size"`
}

// ScanResult is the full payload returned by a scan.
type ScanResult struct {
	Root      *Node     `json:"root"`
	TotalSize int64     `json:"totalSize"`
	TotalFiles int64    `json:"totalFiles"`
	TotalDirs int64     `json:"totalDirs"`
	Skipped   int64     `json:"skipped"` // entries that could not be read (perm denied etc.)
	Elapsed   float64   `json:"elapsedSeconds"`
	Largest   []FileRef `json:"largest"`
	Extensions []ExtStat `json:"extensions"`
	Duplicates []DupGroup `json:"duplicates"`
}

// progress is updated live during a scan so the UI/CLI can show activity.
type progress struct {
	files int64
	dirs  int64
	bytes int64
}

func (p *progress) snapshot() (int64, int64, int64) {
	return atomic.LoadInt64(&p.files), atomic.LoadInt64(&p.dirs), atomic.LoadInt64(&p.bytes)
}

// Scan walks root and builds a complete size-annotated tree.
// dedup controls whether the (slower) duplicate-finder pass runs.
func Scan(root string, dedup bool, prog *progress) (*ScanResult, error) {
	start := time.Now()
	root = filepath.Clean(root)

	nodes := map[string]*Node{}
	rootNode := &Node{Name: displayName(root), Path: root, IsDir: true}
	nodes[root] = rootNode

	var allFiles []FileRef
	extMap := map[string]*ExtStat{}
	res := &ScanResult{Root: rootNode}

	walkFn := func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			atomic.AddInt64(&res.Skipped, 1)
			if d != nil && d.IsDir() {
				return fs.SkipDir // can't read this dir, skip its subtree
			}
			return nil
		}
		if path == root {
			return nil
		}
		parent := nodes[filepath.Dir(path)]
		if parent == nil {
			// Parent was skipped; ignore orphan.
			return nil
		}
		if d.IsDir() {
			n := &Node{Name: d.Name(), Path: path, IsDir: true}
			nodes[path] = n
			parent.Children = append(parent.Children, n)
			atomic.AddInt64(&res.TotalDirs, 1)
			if prog != nil {
				atomic.AddInt64(&prog.dirs, 1)
			}
			return nil
		}
		info, ierr := d.Info()
		if ierr != nil {
			atomic.AddInt64(&res.Skipped, 1)
			return nil
		}
		size := info.Size()
		f := &Node{Name: d.Name(), Path: path, Size: size, Files: 1, Modified: info.ModTime().Unix()}
		parent.Children = append(parent.Children, f)
		allFiles = append(allFiles, FileRef{Path: path, Size: size})

		ext := strings.ToLower(filepath.Ext(path))
		if ext == "" {
			ext = "(none)"
		}
		e := extMap[ext]
		if e == nil {
			e = &ExtStat{Ext: ext}
			extMap[ext] = e
		}
		e.Size += size
		e.Count++

		atomic.AddInt64(&res.TotalFiles, 1)
		if prog != nil {
			atomic.AddInt64(&prog.files, 1)
			atomic.AddInt64(&prog.bytes, size)
		}
		return nil
	}

	if err := filepath.WalkDir(root, walkFn); err != nil {
		return nil, err
	}

	// Roll sizes/counts up the tree from leaves to root.
	computeSizes(rootNode)
	res.TotalSize = rootNode.Size

	// Largest files (top 100).
	sort.Slice(allFiles, func(i, j int) bool { return allFiles[i].Size > allFiles[j].Size })
	if len(allFiles) > 100 {
		res.Largest = append([]FileRef(nil), allFiles[:100]...)
	} else {
		res.Largest = allFiles
	}

	// Extension breakdown, largest first.
	for _, e := range extMap {
		res.Extensions = append(res.Extensions, *e)
	}
	sort.Slice(res.Extensions, func(i, j int) bool { return res.Extensions[i].Size > res.Extensions[j].Size })

	if dedup {
		res.Duplicates = FindDuplicates(allFiles)
	}

	res.Elapsed = time.Since(start).Seconds()
	return res, nil
}

// computeSizes recursively sums child sizes/file-counts into each directory,
// and sorts children largest-first so the treemap and tree render nicely.
func computeSizes(n *Node) {
	if !n.IsDir {
		return
	}
	var size, files int64
	for _, c := range n.Children {
		computeSizes(c)
		size += c.Size
		files += c.Files
	}
	n.Size = size
	n.Files = files
	sort.Slice(n.Children, func(i, j int) bool { return n.Children[i].Size > n.Children[j].Size })
}

// prune trims the tree for transport: drops nodes below minSize and caps the
// number of children per directory so the JSON payload stays small for the UI.
// The original (full) tree is left untouched; a deep copy is returned.
func prune(n *Node, minSize int64, maxChildren int) *Node {
	cp := &Node{Name: n.Name, Path: n.Path, IsDir: n.IsDir, Size: n.Size, Files: n.Files, Modified: n.Modified}
	if !n.IsDir {
		return cp
	}
	count := 0
	for _, c := range n.Children {
		if c.Size < minSize {
			continue
		}
		cp.Children = append(cp.Children, prune(c, minSize, maxChildren))
		count++
		if count >= maxChildren {
			break
		}
	}
	return cp
}

func displayName(p string) string {
	base := filepath.Base(p)
	if base == "." || base == string(filepath.Separator) || base == "" {
		return p
	}
	return p // show the full root path for clarity
}
