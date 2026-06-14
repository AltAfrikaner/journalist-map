package main

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"runtime"
	"sort"
	"sync"
)

// DupGroup is a set of files with identical content.
type DupGroup struct {
	Hash   string    `json:"hash"`
	Size   int64     `json:"size"`   // size of one copy
	Wasted int64     `json:"wasted"` // (count-1) * size
	Files  []FileRef `json:"files"`
}

// FindDuplicates groups files by identical content. It first buckets by exact
// size (cheap), then hashes only files that share a size with at least one
// other file. Hashing is parallelised across CPU cores.
func FindDuplicates(files []FileRef) []DupGroup {
	// Bucket by size; only sizes with >1 file (and >0 bytes) can be dupes.
	bySize := map[int64][]FileRef{}
	for _, f := range files {
		if f.Size > 0 {
			bySize[f.Size] = append(bySize[f.Size], f)
		}
	}

	var candidates []FileRef
	for _, group := range bySize {
		if len(group) > 1 {
			candidates = append(candidates, group...)
		}
	}
	if len(candidates) == 0 {
		return nil
	}

	// Hash candidates in parallel.
	type hashed struct {
		ref  FileRef
		hash string
	}
	jobs := make(chan FileRef, len(candidates))
	out := make(chan hashed, len(candidates))
	var wg sync.WaitGroup
	workers := runtime.NumCPU()
	if workers < 1 {
		workers = 1
	}
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for f := range jobs {
				h, err := hashFile(f.Path)
				if err != nil {
					continue
				}
				out <- hashed{ref: f, hash: h}
			}
		}()
	}
	go func() {
		for _, f := range candidates {
			jobs <- f
		}
		close(jobs)
	}()
	go func() { wg.Wait(); close(out) }()

	byHash := map[string][]FileRef{}
	sizeOf := map[string]int64{}
	for h := range out {
		byHash[h.hash] = append(byHash[h.hash], h.ref)
		sizeOf[h.hash] = h.ref.Size
	}

	var groups []DupGroup
	for h, refs := range byHash {
		if len(refs) < 2 {
			continue
		}
		size := sizeOf[h]
		groups = append(groups, DupGroup{
			Hash:   h[:16], // short hash is plenty for display
			Size:   size,
			Wasted: int64(len(refs)-1) * size,
			Files:  refs,
		})
	}
	// Biggest waste first.
	sort.Slice(groups, func(i, j int) bool { return groups[i].Wasted > groups[j].Wasted })
	if len(groups) > 200 {
		groups = groups[:200]
	}
	return groups
}

func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
