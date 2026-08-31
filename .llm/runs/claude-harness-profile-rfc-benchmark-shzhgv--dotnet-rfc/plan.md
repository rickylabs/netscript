# Plan — claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc

## Profile

ARCHETYPE-3-runtime-behavior (DotNetRuntimeAdapter dispatch behavior; no framework source
changes) + SCOPE-docs (RFC). Doctrine/debt context as runs 1–2.

## Gate set

As runs 1–2: fitness n/a (no `packages/`/`plugins/` source); scoped `deno check` on harness
deltas; SCOPE-docs gates + fmt on the RFC; suite completeness + correctness identity as runtime
evidence.

## Decisions — LOCKED

- **L1 Continuity.** Run-1 harness reused (copied + subject-swapped), MINSTD workload, warmup 20
  / measure 300 (H1: 100 — per-exec cost expected high), same percentile definitions; run-1 A/B/D
  rows are the comparison frame, cited not re-measured.
- **L2 Adapter-true dispatch.** H1–H3 go through the **`DotNetRuntimeAdapter`** (the RFC's
  subject), exercising its `.cs`/direct-exec modes; H3x is the `ExecutableRuntimeAdapter`
  control (expected ≡ H3, proving the seam adds nothing — run-1 B≡C pattern).
- **L3 Sandboxing study is qualitative + one empirical spike (H4 Bootsharp).** Hyperlight is
  cite-only (no `/dev/kvm`); componentize-dotnet cite-only (NativeAOT-LLVM Windows-only);
  DotNetIsolator cite-only (unmaintained, no security review). Recorded as scope, not drift —
  the container cannot host them and the RFC says so.
- **L4 Push policy.** Hold commits locally until PR #1683 merges; then branch restart +
  cherry-pick + new PR (run-2 protocol, proven).
- **L5 Pre-registered verdict criteria.** (a) If NativeAOT (H3) lands within 2× of run-1's
  native subjects on executor-wall p50 AND ≥5× under H2 on cold-spawn RSS, the RFC's primary
  recommendation is a **NativeAOT publish recipe for the existing `dotnet` TaskType** (docs-only;
  no new surface). (b) H1 (file-based) is recommended only for dev ergonomics unless its
  steady-state per-exec cost is within 3× of H2. (c) Bootsharp becomes the recommended in-process
  C# plane only if H4 builds on Linux and runs within 3× of run-2's wasmbuild number (53.9 ms);
  otherwise it is Future-possibilities with the build-host constraint stated. (d) Any first-class
  framework change requires a capability the recipes cannot deliver (runs-1/2 bar) — none is
  anticipated since `dotnet` is already first-class.

## Risk register

| Risk | Mitigation |
| --- | --- |
| H1 first-run compile pollutes series | warmup 20 absorbs; steady-state reported; first-run noted separately if visible in raw |
| DOTNET_ROOT env dependency breaks queue-mode subprocesses | worker-host env passes through runProcess (run-1 F17); verified in smoke |
| Bootsharp Linux build fails (NativeAOT-LLVM) | timeboxed attempt; drift + cite; criteria (c) handles absence |
| Series time (H1 slow) | H1 measure=100, short/c=1 only |

## Commit slices

| Slice | Proves | Gate | Files |
| --- | --- | --- | --- |
| U1 | Bootstrap + research + plan | artifacts complete | run-dir docs |
| U2 | C# variants correct + built (fd/aot/file-based) | exact acc identity vs runs 1–2 | bench/tasks/* |
| U3 | Protocol through dotnet adapter | completeness + H3≡H3x control + 0 failures | bench/harness/*, results/raw |
| U4 | Bootsharp verdict | H4 built+measured or drift | bench/bootsharp*/ or drift |
| U5 | RFC | SCOPE-docs gates + claims trace | rfcs/0000-dotnet-task-runtime-paths.md |
| U6 | Ship per L4 | gates table, context pack, new PR + IMPL-EVAL | run dir, PR |

## Deferred scope

Hyperlight spike (no hypervisor), componentize-dotnet spike (Windows-only compiler), WASI
preview tracking, ReadyToRun/PGO variants of H2, dotnetConfig.runtimeArgs matrix, monty-style
C# interpreter hunt beyond DotNetIsolator.

## PLAN-EVAL

**N/A** — owner-directed scope in-session (bootsharp + official solutions + sandbox + benchmark
+ RFC named explicitly); mechanics locked here; no framework source. IMPL-EVAL mandatory on the
ship PR.
