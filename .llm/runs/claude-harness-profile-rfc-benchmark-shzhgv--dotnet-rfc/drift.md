# Drift Log: dotnet task runtime paths (run 3)

## 2026-08-19 — R3-D-1: Push deferred while PR #1683 open

- Same protocol as R2-D-1; commits parked locally, ship = branch restart + cherry-pick + new PR
  after #1683 merges. **Action:** accept.

## 2026-08-19 — R3-D-2: Framework-dependent binaries fail without DOTNET_ROOT

- **What:** H2 apphost binary failed `Failed to resolve libhostfxr.so` until `DOTNET_ROOT` was
  exported (non-standard SDK location). NativeAOT binaries are immune (self-contained).
- **Severity:** minor (deployment datum; recipe must carry it). **Action:** accept.

## 2026-08-19 — R3-D-3: Bootsharp on Linux rides the Mono-AOT fallback; two recipe gotchas

- **What:** The Bootsharp 0.9.0 package bundles a **win-x64-only** NativeAOT-LLVM ilcompiler;
  Linux Release publish produced the Mono-runtime layout instead (bcl/ + dotnet/ + 2.3 MB
  module) — which still measured **native speed** (54.0 ms long ≈ Rust 53.1). Gotchas verified:
  (1) dashed `AssemblyName` breaks JSExport registration ("Missing wasm export
  '_bootsharp-lcg__GeneratedInitializer__Register_'"); (2) absent `wasm-opt` (Binaryen) skips
  final optimization with a warning.
- **Severity:** minor (recipe-relevant; perf ceiling to re-test when LLVM ships for linux-x64)
- **Action:** accept — recorded in RFC drawbacks/unresolved.

## 2026-08-19 — R3-D-4: Hyperlight unmeasurable in-container

- **What:** No `/dev/kvm`; Hyperlight (hypervisor micro-VMs) is cite-only in the RFC's
  sandbox matrix. **Severity:** minor (scope). **Action:** accept.
