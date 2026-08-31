---
rfc: 0000 # assigned by a maintainer at acceptance; keep 0000 while drafting
title: Go task runtime paths for Background Processing
status: Draft # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
created: 2026-08-19
tracking-issue: to be opened at Discussion (pattern of #1680)
target-milestone: Backlog / Triage
---

# Go task runtime paths for Background Processing

Every quantitative claim traces to
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc/results/` (script-generated
`results-go.md` + raw JSONL) or to runs 1–3 of this series (#1678 scriptc, #1683 rust-workers, #1685
dotnet) — same machine, same MINSTD workload, exact cross-language result identity asserted per rep.

## Summary

Go completes the polyglot series as **the lowest-ceremony native path measured**: a plain `go build`
binary dispatched through the existing `executable` TaskType lands in the Rust class on every axis —
executor-side **6.2 ms** p50 through the production queue path, **2.2 MB** peak RSS, **3.9 ms** cold
spawn with CPU below accounting resolution — using a toolchain that is a single static download with
no clang/cargo/SDK dependencies. Compute on the 10M-iteration kernel is 62.5 ms (≈18% over Rust's
53.1 ms — the GC runtime's price; still 3.5× faster than V8's 219 ms and 3.6× faster than scriptc's
225 ms). Both in-process bridges verified in Deno: the **official `GOOS=js GOARCH=wasm` target**
with Go's own `wasm_exec.js` glue runs the kernel at native-class speed (54.4 ms, boot 77 ms), and
`-buildmode=c-shared` loads via `Deno.dlopen` (55.7 ms) — with Go-runtime-in-a-cdylib hazards
documented. Like Rust (#1683) and unlike scriptc (#1678), **no vocabulary change is proposed**: Go
is a recipe on existing seams. The RFC also records the series' Python decision: **no Python RFC** —
the measured `python3` row (36.8 ms spawn / 9.3 MB, interpreter compute ~100× off native) confirms
its open questions are exactly monty's (#1679), already filed.

## Motivation

Teams with Go services adjacent to NetScript currently have no documented guidance for Go tasks, yet
Go is arguably the _easiest_ native task authoring path: one compiler, static binaries by default,
no build-host library dependencies (scriptc needs clang; Rust needs cargo; C#-AOT needs clang + the
SDK). Measured through the production dispatch path (queue → `MultiRuntimeTaskExecutor` →
`ExecutableRuntimeAdapter` → subprocess), all series 0 failures:

| Metric (short workload unless noted) | G1 Go binary        | Series context                                                 |
| ------------------------------------ | ------------------- | -------------------------------------------------------------- |
| Executor-wall p50, queue c=1         | **6.2 ms**          | Rust 4.9 · C#-AOT 6.3 · scriptc 6.8 · deno 50.6                |
| Cold-spawn wall / RSS                | **3.9 ms / 2.2 MB** | Rust 3.3/2.2 · scriptc 5.0/2.5 · C#-AOT 4.3/3.3 · deno 45/43.4 |
| Long-workload compute (10M)          | 62.5 ms             | Rust 53.1 · wasm 54.2 · C#-AOT 56.5 · V8 219 · scriptc 225     |
| Queue e2e p50 c=1 / c=16             | 65.0 / 121.6 ms     | run-1 dispatch analysis applies unchanged                      |

## Guide-level explanation

### The recipe (works today, zero framework change)

```bash
go build -ldflags="-s -w" -o tasks/bin/resize ./cmd/resize   # 1.8 MB static binary here
```

```ts
export const resize = defineTask('resize')
  .runtime('executable')
  .entrypoint('./tasks/bin/resize')
  .timeout(30_000);
```

Standard polyglot contract (argv/env in, last JSON line out; `CORRELATION_ID` from env). Pure-Go
binaries are static — no `DOTNET_ROOT`-style host dependency (contrast run 3's R3-D-2).

### In-process Go compute (official wasm target)

```go
//go:build js && wasm
func main() {
    js.Global().Set("resizeKernel", js.FuncOf(kernel))
    select {} // keep the runtime alive
}
```

```ts
// wasm_exec.js ships in $(go env GOROOT)/lib/wasm — Go's own glue, no third-party layer
new Function(await Deno.readTextFile('./lib/wasm_exec.js'))();
const go = new (globalThis as any).Go();
const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
go.run(instance); // registers the kernel; measured boot 77 ms
const out = (globalThis as any).resizeKernel(input); // 54.4 ms on the 10M kernel — native-class
```

Unlike Rust (wasmbuild) and C# (Bootsharp), Go's in-process story needs **no community layer**: the
compiler target and the glue are both upstream Go. The trade: `js/wasm` interop is
globals-and-callbacks (no generated typed bindings), and the module carries the Go runtime (1.7 MB
here). TinyGo can shrink modules and export plain functions but is a subset compiler — cite-only in
this run (not installed; recorded as scope).

## Reference-level explanation

### Measured bridges (results-go.md; boundary rows labeled DIRECT)

| Bridge                                              | Long-kernel p50                  | Notes                                            |
| --------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| G1 subprocess (`executable`)                        | 62.5 ms + ~5 ms spawn            | the recipe; crash-isolated                       |
| G2 in-process `js/wasm` + `wasm_exec.js`            | **54.4 ms**, boot 76.6 ms once   | WASM-sandboxed; official end-to-end              |
| G3 in-process `-buildmode=c-shared` + `Deno.dlopen` | 55.7 ms                          | no sandbox; hazards below                        |
| `GOOS=wasip1`                                       | build verified (3.1 MB artifact) | no WASI runtime in-container; execution deferred |

G3 hazards the recipe must carry (documented, not measured to failure): a c-shared Go library brings
the **entire Go runtime into the worker host process** — GC and scheduler threads outlive calls, and
Go installs **signal handlers** that can conflict with the host (V8/tokio); crashes are
process-fatal like any FFI. Prefer G2 (sandboxed, comparable speed) unless profiling demands FFI; if
FFI, the run-2 rules apply (`nonblocking: true`, plain-data boundary, K≤cores).

### Sandboxing (completing the series matrix from #1685)

Go's row mirrors Rust's: the sandbox is a **compilation target**, not a product. `GOOS=wasip1` is
upstream-official (build verified this run); **Hyperlight Wasm** lists Go among its component guest
languages (strong-isolation tier; still hypervisor-gated — cite-only, no `/dev/kvm` here);
adapter-level **Landlock/bubblewrap** confinement (the #1685 matrix's cross-cutting row) covers the
G1 subprocess like every native binary. The interpreter-shaped option (**Yaegi**, Traefik's Go
interpreter) is a pattern citation only — sandboxing is not its design goal and it fails the
maturity gates monty passes. Notably, **gVisor** — the container-sandboxing userspace kernel — is
itself written in Go: official prior art that Go and sandboxing infrastructure are well acquainted,
but it is a container-runtime tool, not a task plane.

### The Python decision (recorded here to close the series' language sweep)

No Python RFC. Rationale, with this run's measured row: `python3` spawn is unremarkable (36.8 ms /
9.3 MB — between deno and the natives) but interpreter compute is ~100× off native, so every
hot-path question collapses into "run it native or sandboxed-in-process" — which is exactly **monty
(#1679)**, already filed with a spike acceptance list, and slotted into the #1685 sandbox matrix.
The `python` TaskType exists (no vocabulary decision), and packaging recipes (venvs, `pythonConfig`)
are how-to material, not RFC material. A future RFC is warranted only if the monty spike (#1679)
graduates toward a first-class sandboxed runtime.

## Drawbacks

1. Go binaries are larger than the series' smallest (1.8 MB vs scriptc 584 KB / Rust 320 KB) —
   irrelevant at task-artifact scale, visible at fleet-registry scale.
2. GC pauses are theoretically observable in latency-critical kernels (not observed at this
   workload's p95/p99); Rust remains the determinism ceiling.
3. `js/wasm` interop is untyped globals — teams wanting typed contracts must hand-write the TS layer
   or adopt TinyGo+wit tooling (immature).
4. Same subprocess sandbox posture as all external runtimes (existing debt; matrix applies).

## Rationale and alternatives

- **A `go` TaskType?** Rejected for the same reason as scriptc's phased verdict but stronger: Go
  needs no compile-at-dispatch semantics — `executable` + a build recipe is the whole story;
  vocabulary growth would buy nothing measurable.
- **TinyGo as the primary wasm path**: deferred — upstream `js/wasm` already measured native-class;
  TinyGo's wins (size, exports) come with subset constraints; revisit if the WASM task runtime
  (series future work) lands.
- **Do nothing**: Go teams guess; the 45×-style footguns of run 3 don't exist here, but the
  in-process options (G2/G3) and their hazards are non-obvious without this data.

## Breaking changes and migration

None. Recipes on existing seams.

## Prior art

Runs 1–3 (#1678, #1683, #1685) — methodology, seam analysis, sandbox matrix; esbuild (the canonical
Go-binary-serving-a-JS-ecosystem precedent, historically used by Deno tooling); upstream Go wasm
docs; hyperlight-dev; gVisor; Yaegi.

## Unresolved questions

- `wasip1` execution numbers (needs a WASI runtime in the environment; wasmtime subprocess recipe
  candidate).
- TinyGo module size/perf on this kernel vs upstream js/wasm.
- Whether Go's GC signal usage conflicts with Deno's runtime under sustained G3 FFI load (not
  stress-tested; G2 recommended partly for this reason).

## Future possibilities

- The **WASM task runtime** (shared across all four RFCs) — Go joins via wasip1/TinyGo.
- The **confinement RFC** (#1685 matrix row) — covers G1 like every native task.
- `netscript task doctor` recipe checks (static-binary verification, ldflags hygiene).
