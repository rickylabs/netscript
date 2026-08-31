//go:build js && wasm

// G2 — official GOOS=js GOARCH=wasm target: registers lcgRun on globalThis via syscall/js
// (the official glue path, wasm_exec.js). Kernel identical to every prior variant.
package main

import "syscall/js"

func runLcg(n, seed uint64) uint64 {
	state := seed
	var acc uint64
	for i := uint64(0); i < n; i++ {
		state = state * 48271 % 2147483647
		acc = (acc + state) % 1000000007
	}
	return acc
}

func main() {
	js.Global().Set("lcgRun", js.FuncOf(func(this js.Value, args []js.Value) any {
		n := uint64(args[0].Float())
		seed := uint64(args[1].Float())
		return float64(runLcg(n, seed))
	}))
	select {} // keep the Go runtime alive for calls
}
