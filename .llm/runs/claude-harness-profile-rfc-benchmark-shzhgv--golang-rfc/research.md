# Research — claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc

Re-baseline: runs 1–3 carried in (methodology, seam analysis, sandbox matrix). Owner directive:
Go RFC + benchmark + same search pattern; Python explicitly ruled out of RFC treatment (rows +
#1679 instead).

| # | Finding | Source |
| - | ------- | ------ |
| G-1 | No `go` TaskType exists; Go rides `executable` (Rust precedent, run 2). No vocabulary decision at stake. | registry-types.ts (run-1 F16) |
| G-2 | Go 1.24.7 in-container; pure-Go binaries are static (no host deps — contrast R3-D-2 DOTNET_ROOT). 1.8 MB with `-s -w`. | empirical |
| G-3 | Official wasm targets: `GOOS=js GOARCH=wasm` + upstream `wasm_exec.js` glue (GOROOT/lib/wasm) — **works in Deno as-is** (G2 measured); `GOOS=wasip1` builds (3.1 MB) — execution needs a WASI runtime (R4-D-2). | empirical |
| G-4 | `-buildmode=c-shared` + `//export` + cgo(clang) produces a dlopen-able cdylib (1.69 MB) — works via `Deno.dlopen` (G3 measured). Hazards: full Go runtime in host process (GC/scheduler threads, signal handlers). | empirical + Go docs |
| G-5 | Sandbox row: wasip1 (official target), Hyperlight Wasm (Go listed as guest; hypervisor-gated), Landlock/bwrap (generic native row, #1685 matrix), Yaegi (interpreter; cite-only, not a sandbox product), gVisor (Go-authored container sandbox — prior art only). | series research + upstream |
| G-6 | Python row measured: python3 cold spawn 36.8 ms / 9.3 MB / 30 ms CPU (100k workload incl. ~interpreter start); CPython per-iteration compute ~100× off native ⇒ hot-path answer is monty/native — #1679's exact scope. Supports the no-Python-RFC ruling. | results-go.md probe |
| G-7 | esbuild = canonical prior art for a Go binary serving the JS ecosystem. | ecosystem |
