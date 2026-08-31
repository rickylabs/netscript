// G3 — Go c-shared cdylib for Deno.dlopen (FFI row). The exported symbol carries the whole Go
// runtime (GC, scheduler threads, signal handlers) into the host process — the RFC documents
// those hazards; this measures the cost.
package main

import "C"

//export LcgRun
func LcgRun(n, seed uint64) uint64 {
	state := seed
	var acc uint64
	for i := uint64(0); i < n; i++ {
		state = state * 48271 % 2147483647
		acc = (acc + state) % 1000000007
	}
	return acc
}

func main() {}
