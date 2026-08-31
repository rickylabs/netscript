---
rfc: 0000 # assigned by a maintainer at acceptance; keep 0000 while drafting
title: Efficient and sandboxed C#/.NET task paths for Background Processing
status: Draft # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
created: 2026-08-19
tracking-issue: to be opened at Discussion (pattern of #1680)
target-milestone: Backlog / Triage
---

# Efficient and sandboxed C#/.NET task paths for Background Processing

Every quantitative claim traces to
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc/results/` (script-generated
`results-dotnet.md` + raw JSONL + environment deltas) or to runs 1–2 of this series (scriptc RFC,
merged #1678; rust-workers RFC, #1683) — same machine, same MINSTD workload, same methodology, exact
cross-language result identity asserted per rep.

## Summary

Unlike scriptc (run 1), C# needs **no vocabulary change**: `dotnet` is already a built-in TaskType
whose `DotNetRuntimeAdapter` has three dispatch modes — and the measurements show the mode choice
spans **45×**. The documented ergonomic default (`.cs` entrypoint → `dotnet run`) costs 284 ms
executor-side and ~100 MB per message; a published framework-dependent binary costs 41 ms / 25 MB; a
**NativeAOT** publish costs **6.3 ms / 3.4 MB** — scriptc-class startup with, unlike scriptc,
**native-class compute** (10M-iteration kernel: 56.5 ms ≈ Rust 53.1 ms, where scriptc runs 225 ms).
This makes NativeAOT C# the strongest polyglot-task profile measured in this series. In-process,
**Bootsharp 0.9.0** compiled the same kernel into a 2.3 MB WASM-sandboxed ES module that Deno runs
at native speed (54.0 ms, boot 98 ms) — the C# equivalent of run-2's wasmbuild story, verified on
Linux via the Mono-AOT fallback. The RFC recommends: a **NativeAOT publish recipe** as the
production default for `dotnet` tasks (docs only), Bootsharp as the in-process C# compute plane, and
a **cross-language sandboxing matrix** (owner-requested) that positions Microsoft's Hyperlight
micro-VMs and adapter-level Landlock/bubblewrap confinement as the paths that could actually close
the `workers-non-deno-task-sandbox-boundary` debt.

## Motivation

The `dotnet` TaskType ships today with dispatch modes whose cost differences are undocumented and
enormous (measured through the production queue → `MultiRuntimeTaskExecutor` →
`DotNetRuntimeAdapter` path; `results-dotnet.md`):

| Mode (all through the real dotnet adapter)                      | exec-wall p50 short | cold-spawn RSS | CPU/exec |
| --------------------------------------------------------------- | ------------------- | -------------- | -------- |
| H1 `.cs` file-based (`dotnet run task.cs`, .NET 10, warm cache) | **284.4 ms**        | ~100 MB        | 380 ms   |
| H2 published framework-dependent binary (JIT)                   | 41.0 ms             | 26 MB          | 30 ms    |
| H3 published **NativeAOT** binary                               | **6.3 ms**          | 3.3 MB         | < 10 ms¹ |

¹ below GNU time's 10 ms accounting resolution.

A team following the current docs' most convenient path pays 45× the executor cost and ~30× the
memory of what the same TaskType delivers with one publish flag. For comparison with run 1's
subjects on identical hardware: H3 (6.3 ms / 3.4 MB) sits between scriptc (6.8 ms / 2.5 MB) and Rust
(4.9 ms / 2.2 MB) on startup — and on the compute-bound long workload it stays native (56.5 ms ≈
Rust 53.1 / wasm 54.2) where scriptc drops to V8 speed (225 ms). C# is the only managed language in
this series that gets **both** halves.

## Guide-level explanation

### The recipe this RFC standardizes (works today, zero framework change)

```bash
dotnet publish -c Release -p:PublishAot=true -o tasks/bin/etl   # needs clang on the build host
```

```ts
export const etl = defineTask('etl')
  .runtime('dotnet') // existing TaskType; adapter direct-exec mode dispatches the binary
  .entrypoint('./tasks/bin/etl/etl-task')
  .timeout(60_000);
```

Standard polyglot contract (argv/env in, last JSON line out). Deployment notes the recipe must carry
(all measured/verified): `DOTNET_ROOT` must resolve for framework-dependent binaries (H2 fails
`libhostfxr.so not found` on non-standard installs; NativeAOT binaries are self-contained and
immune); `.cs` file-based mode is a dev-loop convenience, never a production dispatch mode (45×);
`dotnetConfig.useDotnetRun` likewise.

### The in-process C# compute plane (Bootsharp)

```xml
<TargetFramework>net10.0</TargetFramework>
<RuntimeIdentifier>browser-wasm</RuntimeIdentifier>
<AssemblyName>PricingKernel</AssemblyName> <!-- no dashes: dashed names break export registration -->
<PackageReference Include="Bootsharp" Version="*-*"/>
```

```csharp
public static partial class Pricing
{
    public static void Main() { }
    [Export] public static double Simulate(double n, double seed) => /* kernel */;
}
```

```ts
import bootsharp, { Pricing } from './bin/bootsharp/index.mjs';
await bootsharp.boot(); // 98 ms measured
const result = Pricing.simulate(n, seed); // native speed, WASM-sandboxed, typed
```

`dotnet publish` emits a complete ES package (2.3 MB here) with TypeScript declarations — the C#
analogue of run-2's wasmbuild route, and it composes the same way with job handlers.

## Reference-level explanation

### Adapter reality (no changes proposed)

`buildDotNetCommand` (`packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:41-65`)
already routes: `.cs` → `dotnet run <file>`; `dotnetConfig.useDotnetRun` → `dotnet run
--project`;
otherwise → direct execution of the entrypoint with `runtimeArgs`. H3 vs the H3x
`ExecutableRuntimeAdapter` control measured 6.3 vs 6.4 ms — the adapter seam adds nothing; the
entire cost story is the publish mode. Queue-path numbers (e2e p50 short c=1: H3 63.2 ms vs run-1
A-deno 108.0) inherit run-1's dispatch analysis unchanged.

### Measured summary (all series 0 failures; ≥300 measured, H1 100)

Queue e2e p50 (short, c=1): H1 330.7 / H2 93.9 / H3 **63.2** / H3x 60.2 ms; at c=16: H2 205.9 / H3
114.4 ms (matching run-1's native subjects' queue-bound profile). Direct long: H2 90.7 / H3 56.5 ms.
Bootsharp in-process long: 54.0 ms p50 (p95 54.7), boot 98.4 ms once per host.

### Official-solution landscape (owner ask: "check official solutions from Microsoft")

| Path                                            | Who owns it                       | Status                                                                                        | Fit                                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NativeAOT (`PublishAot`)                        | Microsoft, supported              | GA; **works on Linux in-container with clang** (verified)                                     | The production task recipe (above)                                                                                                                                    |
| .NET browser-wasm runtime + wasm-tools workload | Microsoft, supported              | GA; Mono-AOT on Linux                                                                         | What Bootsharp builds on                                                                                                                                              |
| **Hyperlight / Hyperlight Wasm**                | Microsoft OSS, CNCF Sandbox       | Experimental; hypervisor micro-VMs, 1–2 ms startup, WASM-component guests (C#, Rust, JS, Py…) | The strong-isolation tier — **two layers** (WASM sandbox inside a hypervisor guest); needs `/dev/kvm`-class access (absent in this container — cite-only, unmeasured) |
| componentize-dotnet (Bytecode Alliance)         | BCA + Microsoft contributors      | Preview; **NativeAOT-LLVM compiler currently win-x64 only** (Linux "soon")                    | The WASI-component future; blocked for our build hosts today                                                                                                          |
| DotNetIsolator                                  | Individual experiment (Sanderson) | Dormant since ~2023, "no security review"                                                     | Pattern citation only — fails every maturity gate monty passes                                                                                                        |

Bootsharp itself is **community** (elringus, 796★, MIT) layered on the official runtime — the same
relationship wasmbuild has to Rust's wasm-bindgen. Linux builds fall back from NativeAOT-LLVM
(win-only, bundled `runtime.win-x64` ilcompiler observed in the package) to the Mono-AOT path —
which still measured native-speed on this kernel; the fallback is a bundle-size/perf ceiling to
re-test when LLVM lands on Linux. Recipe gotchas (verified): dashed assembly names break
`GeneratedInitializer` export registration; absent `wasm-opt` (Binaryen) skips final optimization
with a warning.

### Cross-language sandboxing matrix (owner-requested; completes the series)

| Task language        | In-process sandboxed plane                                                                                                     | Subprocess sandbox                                                              | Strong isolation                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------- |
| TypeScript (deno)    | — (isolate is the runtime)                                                                                                     | **built-in `.permissions()`** — still the only runtime-enforced per-task policy | —                                      |
| TypeScript (scriptc) | (WASI target, Zig-gated)                                                                                                       | Landlock/bwrap (below)                                                          | Hyperlight (WASM component)            |
| Python               | **monty** (#1679) — capability host functions                                                                                  | Landlock/bwrap                                                                  | Hyperlight                             |
| Rust                 | **WASM/WASI** — first-class target; run-2 measured native speed in-sandbox; wasmtime subprocess with per-task `--dir` preopens | Landlock/bwrap                                                                  | **Hyperlight** (Rust-native guest SDK) |
| C#                   | **Bootsharp / browser-wasm** (this run: native speed, 2.3 MB); componentize-dotnet WASI when Linux-capable                     | Landlock/bwrap                                                                  | **Hyperlight Wasm**                    |

The cross-cutting row is the last column's complement: **adapter-level OS confinement**. Landlock
(unprivileged LSM, kernel 5.13+, fs + network-port allowlists) and bubblewrap (unprivileged
user-namespaces) can wrap _any_ spawned task subprocess — Rust, scriptc, and C#-AOT alike — giving
every native task a `.permissions()`-analogue at the `RuntimeAdapterBase`/`ProcessRunner` seam. The
2025–26 agent-sandboxing landscape consolidated on exactly these primitives (Codex ships
Landlock+seccomp by default; Claude Code uses bubblewrap). This is the first credible path to
**closing** the `workers-non-deno-task-sandbox-boundary` debt rather than re-documenting it;
per-language sandboxes above are then stronger opt-ins over that floor. Scoped here as a named
future possibility — it deserves its own RFC with its own measurements (confinement overhead per
spawn).

## Drawbacks

1. **Build-host toolchain weight.** NativeAOT needs clang + the .NET SDK in CI (heavier than
   scriptc's clang-only); Bootsharp adds the wasm-tools workload; version pins matter
   (wasm-bindgen-style exact-pin friction appears here as the Bootsharp/workload coupling).
2. **Same sandbox posture as every external runtime** for the subprocess recipe (host OS privileges;
   existing debt), until the matrix's confinement work exists.
3. **Bootsharp maturity**: 0.9.x community project; Linux currently rides the Mono-AOT fallback;
   dashed-assembly and wasm-opt gotchas are real but recipe-documentable.
4. **H1/H2 footguns stay shipped**: the expensive modes remain valid adapter inputs; the recipe and
   docs must carry the numbers, since nothing in the type system prevents a 284 ms/message
   configuration.

## Rationale and alternatives

- **Do nothing:** teams keep discovering the 45× spread empirically; C# tasks stay associated with
  "slow" when the same TaskType is two flags from scriptc-class dispatch.
- **First-class `scriptc`-style vocabulary work:** unnecessary — `dotnet` is already first-class;
  everything here is docs + publish configuration. (The series' vocabulary analysis lives in the
  scriptc RFC.)
- **Blazor/raw wasm workloads instead of Bootsharp:** Blazor is UI-framework-shaped; raw
  `wasm-experimental` interop is what Bootsharp automates (bindings, package, TS types) — using it
  directly re-implements Bootsharp per project.
- **Wait for componentize-dotnet:** right shape (WASI components feed Hyperlight too), wrong timing
  (win-only compiler); revisit when Linux lands — tracked as an unresolved question.

## Breaking changes and migration

None. Recipes + docs; existing task definitions keep working (including the slow modes).

## Prior art

- This series: scriptc RFC (merged #1678 — dispatch-path methodology, vocabulary analysis),
  rust-workers RFC (#1683 — compute-plane pattern, wasmbuild precedent, oRPC pool protocol), #1679
  (monty), #1684 (runner-modes reconciliation).
- Microsoft: NativeAOT docs, Hyperlight (opensource.microsoft.com 2025-03-26), browser-wasm runtime;
  Bytecode Alliance componentize-dotnet; elringus/bootsharp.
- Landlock (docs.kernel.org), bubblewrap, extrasafe/Sandlock (arxiv 2605.26298) for the confinement
  row.

## Unresolved questions

- Bootsharp NativeAOT-LLVM on Linux: bundle size/perf delta vs the measured Mono-AOT fallback once
  the LLVM compiler ships for linux-x64 (same trigger unblocks componentize-dotnet).
- Adapter-level Landlock/bwrap confinement: overhead per spawn, policy schema (mirror
  `WorkerTaskPermissions`?), and whether it lives in `ProcessRunner` or a wrapping adapter — future
  RFC.
- Hyperlight evaluation needs a KVM-capable host; unmeasured here by construction.
- ReadyToRun/tiered-PGO middle ground for H2-shaped deployments that can't take AOT constraints
  (reflection-heavy dependencies).

## Future possibilities

- **The confinement RFC** (matrix row above) — the debt-closing move for all native runtimes.
- **WASM task runtime** (shared with runs 1–2): Bootsharp/WASI modules as queue-dispatched sandboxed
  tasks once an in-process task contract exists; Hyperlight as its strong-isolation backend on
  capable hosts.
- **`netscript task doctor`**: surface publish-mode cost classes (flag an H1-shaped production
  config), `DOTNET_ROOT` resolution, clang presence.
- **monty (#1679)** completes the same story for Python.
