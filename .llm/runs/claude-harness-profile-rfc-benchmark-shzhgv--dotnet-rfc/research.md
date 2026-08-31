# Research — claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc

## Re-baseline

- Carried-in: runs 1–2 (same workload/manifest/methodology; run-1 A/B/D numbers are the
  comparison frame). Owner directive (in-session): bootsharp.com, existing C# polyglot support,
  official Microsoft solutions, a sandboxing option parallel to monty (#1679); benchmark + RFC.

## Findings — internal (the `dotnet` TaskType today)

| # | Finding | Source |
| - | ------- | ------ |
| C1 | `dotnet` is a **built-in TaskType** (closed-union member) with `DotNetRuntimeAdapter` and **three dispatch modes** in `buildDotNetCommand`: (a) `.cs` entrypoint → `dotnet run <file.cs>` (file-based, .NET 10 feature), (b) `metadata.dotnetConfig.useDotnetRun` → `dotnet run --project <dir>`, (c) otherwise → **execute the entrypoint directly** (published binary) with `dotnetConfig.runtimeArgs` support. Unlike scriptc (run 1), no vocabulary change is needed for anything this RFC proposes. | `packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:41-65` |
| C2 | Same sandbox posture as all non-deno runtimes: worker-host OS privileges (`workers-non-deno-task-sandbox-boundary`). | run-1 F11 |
| C3 | Framework-dependent apphost binaries require `DOTNET_ROOT` (or a system-installed runtime) in the worker host env — verified failure `libhostfxr.so not found` with a home-dir install until `DOTNET_ROOT` set. Deployment datum for the recipe. | empirical, this run |
| C4 | .NET SDK **9.0.317** + **10.x** side-by-side in-container; **NativeAOT publish works on Linux with clang 18** (no extra packages needed here): 1 443 680-byte binary from the benchmark task. File-based `dotnet run task.cs` works on .NET 10 (first run compiles+caches). | empirical, this run |
| C5 | C# MINSTD variant produces **exact** result identity with runs 1–2 (`acc` 846234426 / 777999478; ulong intermediates < 2^53). VmHWM self-report: framework-dependent 24.9–28 MB, NativeAOT **3.4 MB**. | empirical, this run |

## Findings — external (official + ecosystem bridges)

| # | Finding | Source |
| - | ------- | ------ |
| C6 | **Bootsharp v0.9.0** — C#→WASM ES-module embed (the wasmbuild-analogue): `[Export]`/`[Import]` on `public static partial` methods, `net10.0` + `browser-wasm` RID, `dotnet publish` → `bin/bootsharp` **full ES package with package.json**, TS declarations generated; Release builds "compile WASM with NativeAOT-LLVM and further optimize with Binaryen"; targets **Node, Deno, Bun, browsers** explicitly. OS restrictions for the NativeAOT-LLVM path not documented — resolved empirically in this run (H4 attempt). | bootsharp.com |
| C7 | **Hyperlight / Hyperlight Wasm** — Microsoft's official sandboxing play (CNCF Sandbox, 2025): embeddable Rust VMM running guests in **hypervisor micro-VMs at 1–2 ms startup** (vs ~125 ms traditional VM); Hyperlight Wasm adds Wasmtime so guests can be WASM components authored in C#, Rust, Python, JS, Go…; **two isolation layers** (WASM sandbox inside a hypervisor guest). Requires a hypervisor (KVM/mshv) — **no `/dev/kvm` in this container**, so cite-only. | opensource.microsoft.com blog 2025-03-26; github.com/hyperlight-dev/hyperlight |
| C8 | **componentize-dotnet** (Bytecode Alliance) — official-adjacent WASI P2 component toolchain for C# (NativeAOT-LLVM + wit-bindgen + wasm-tools + WASI SDK); preview (0.x-preview on NuGet); **NativeAOT-LLVM compiler currently Windows-only** (Linux/macOS "expected soon"). | bytecodealliance.org article; github.com/bytecodealliance/componentize-dotnet README |
| C9 | **DotNetIsolator** (Steve Sanderson) — the closest monty-shape for .NET: isolated .NET runtimes inside .NET via WASM. **Experimental, unsupported, explicitly "no security review", dormant since ~2023.** A pattern citation, not an adoption candidate — materially weaker maturity than monty (#1679). | github.com/SteveSandersonMS/DotNetIsolator |
| C10 | Sandboxing verdict shape for the RFC: the credible C# sandbox paths are **WASM-based** — Bootsharp/browser-wasm in-process (WASM sandbox, like run-2's wasmbuild story) today, WASI components (C8) when the toolchain leaves Windows-only preview, and **Hyperlight micro-VMs** (C7) as the Microsoft-official strong-isolation tier for hosts with hypervisor access. DotNetIsolator documents the in-process pattern but fails every maturity gate. | synthesis of C6–C9 |

## Benchmark subjects (this run)

Through the **real `DotNetRuntimeAdapter`** dispatch path (queue + direct, run-1 harness):

- **H1** `.cs` file-based (`dotnet run task.cs`, .NET 10) — the documented ergonomic default.
- **H2** framework-dependent published binary (JIT + runtime startup; direct-exec adapter mode).
- **H3** **NativeAOT** binary (direct-exec adapter mode) — the headline.
- **H3x** same AOT binary via `ExecutableRuntimeAdapter` — adapter-seam control (expect ≡ H3).
- **H4** Bootsharp ES module imported in Deno in-process (boundary, like run-2 P5) — attempted
  post-protocol; drift if the toolchain blocks on Linux.
- Cold-spawn CPU/RSS probe rows for H1/H2/H3 (run-1 methodology).

## Open questions

- Bootsharp on Linux: does the Release NativeAOT-LLVM path build, or fall back / fail? (H4
  resolves or drifts.)
- H1 steady-state cost after the first-compile cache — is file-based mode usable for anything
  hot, or docs-only convenience?
- Does the framework-dependent mode amortize (ReadyToRun? `DOTNET_TieredPGO`?) enough to matter
  vs AOT, or is AOT strictly dominant for task-shaped work?
