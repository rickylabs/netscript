# Plan — claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc

## Profile

ARCHETYPE-3-runtime-behavior (worker runtime parallelism investigation; no framework source
changes) + SCOPE-docs (RFC deliverable). Doctrine verdict + debt context identical to run 1
(plugin-workers-core 3/Refactor; workers 5/Refactor; `workers-non-deno-task-sandbox-boundary`).

## Gate set

Same shape as run 1: fitness gates n/a (no `packages/`/`plugins/` source); scoped static checks
on run-dir bench code; SCOPE-docs gates (claims-trace, link integrity, terminology, fmt) on the
RFC; runtime evidence = the parallelism suite itself.

## Decisions — LOCKED

- **L1 Reuse run-1 baseline.** Same MINSTD workload, same environment manifest (deltas recorded),
  run-1 subject-D/E/F/G numbers cited rather than re-measured. New measurements are
  parallelism-specific (P1–P5, K ∈ {1,2,4,8}).
- **L2 Zero-dependency Rust.** Parallel cdylib uses `std::thread` (no rayon) so the suite is
  hermetic to registry availability; recorded, revisitable.
- **L3 Owner-directed scope → PLAN-EVAL: N/A.** Same justification class as run 1 L7 (owner
  fixed intent, deliverable, and emphasis in-session; remaining decisions are measurement
  mechanics). IMPL-EVAL mandatory, separate session, cloud route, on the new PR.
- **L4 Push policy.** No push to `claude/harness-profile-rfc-benchmark-shzhgv` while PR #1678
  awaits merge (its IMPL-EVAL PASS is head-pinned). Work commits locally; after #1678 merges the
  branch restarts from `origin/main`, RFC-2 commits replay, new draft PR opens. (Exception
  granted by owner review 2026-08-19: the CPU/RAM scale-probe amendment to run 1 DOES push to
  #1678 pre-merge — owner asked for it in review.)
- **L5 Pre-registered framing for the verdict.** The RFC recommends a Rust integration tier only
  where measurements show ≥2× throughput or ≥2× latency improvement for the representative
  CPU-bound workload *without* regressing event-loop liveness (P4 jitter < 10 ms p99 while
  compute runs). Options that fail the liveness bar (blocking FFI on the main isolate) can only
  be recommended behind worker/task boundaries. Maintenance-heavy options (direct rusty_v8 /
  deno_core embedding, R1/R2 cadence+archival facts) require a capability the paved roads cannot
  deliver at all — not merely a speed delta — to be recommended.

## Risk register

| Risk | Mitigation |
| --- | --- |
| crates.io / wasm-bindgen unreachable | L2 std::thread; P5 downgrade-to-drift path |
| 4-core container noise during parallel runs | percentiles, K≤8, machine idle, interleaved reps |
| Doc-vs-code finding (R9) contested | claim rests on greps + file:line quoted in research; phrased as reconciliation need, not blame |
| #1678 merge timing blocks shipping | L4 deferred-push protocol; work is complete locally either way |

## Commit slices

| Slice | Proves | Gate | Files |
| --- | --- | --- | --- |
| T1 | Run bootstrap + research + plan | artifacts complete | run-dir supervisor/research/plan/worklog |
| T2 | Parallel workloads correct | identical acc across P1–P4 at every K | `bench/parallel/` (crate + verify) |
| T3 | Parallelism suite numbers | all P-series ≥ planned reps, results-p.md script-generated | `bench/parallel/run-parallel.ts`, `results/` |
| T4 | wasmbuild pipeline verdict | P5 built or drift recorded | `bench/parallel/wasmbuild-attempt/` or drift |
| T5 | The RFC | SCOPE-docs gates + claims-trace | `rfcs/0000-rust-workers-integration.md` |
| T6 | Close + ship per L4 | gates table, context-pack, new PR + IMPL-EVAL handoff | run dir, PR |

## Deferred scope

Actual implementation of any recommended tier; monty (#1679); Aspire-hosted parallel measurements;
Node-API addon build experiment (cited, not built — nodeModulesDir friction recorded);
deno_core embedding prototype (analyzed on R1/R2 facts, not built).
