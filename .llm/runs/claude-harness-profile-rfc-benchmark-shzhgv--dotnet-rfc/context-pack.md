# Context Pack — claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc

## State (2026-08-19, closed)

- PR **#1685** (`rfcs/0000-dotnet-task-runtime-paths.md` Draft + benchmark evidence), IMPL-EVAL
  **PASS** (OpenHands DeepSeek, run 32311880502, evaluated head 7806c7e; mirror in
  `evaluate.md`; zero blocking findings — every figure independently recomputed).
  `status:ready-merge`; merge is the owner's call.
- Headline (`results/results-dotnet.md`): 45× dispatch-mode spread in the existing `dotnet`
  TaskType — file-based 284 ms/100 MB/380 ms-CPU vs JIT 41 ms/26 MB vs **NativeAOT
  6.3 ms/3.4 MB** with native compute retained (56.5 ≈ Rust 53.1); Bootsharp on Linux verified:
  native-speed 54.0 ms in a 2.3 MB WASM-sandboxed ES module (boot 98 ms; Mono-AOT fallback;
  dashed-assembly + wasm-opt gotchas R3-D-3).
- RFC verdict: NativeAOT publish recipe (docs-only), Bootsharp as the in-process C# plane, and
  the cross-language sandbox matrix (monty #1679 / Rust-WASI / Bootsharp / Hyperlight /
  adapter-level Landlock-bwrap as the debt-closing future RFC).

## Series map

#1678 scriptc (merged) · #1683 rust-workers (merged) · #1685 dotnet (this run) · issues #1679
monty, #1680 scriptc-tracking, #1681 D-4, #1682 D-5, #1684 worker-parallelism + oRPC pool.

## Rerun

.NET SDKs 9.0.317 + 10.0.400 via dotnet-install.sh (`DOTNET_ROOT` required); wasm-tools
workload for Bootsharp. `dotnet publish -c Release [-p:PublishAot=true]` in
`bench/tasks/csharp-lcg/`; `bash bench/harness/run-all-3.sh`; `deno run --allow-read
--allow-write bench/harness/report-3.ts`. Run-1 manifest + `results/environment.json` deltas.
