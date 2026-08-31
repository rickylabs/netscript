# Plan — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

## Profile

- **Archetype:** ARCHETYPE-3-runtime-behavior (investigation of `@netscript/plugin-workers-core`
  executor/dispatch behavior; no framework source changes) + **SCOPE-docs** overlay (RFC
  deliverable; `archetypes/README.md` maps RFCs to SCOPE-docs).
- **Doctrine verdict (file 10, 2026-08-12):** `packages/plugin-workers-core` = 3/Refactor;
  `plugins/workers` = 5/Refactor. This run reads those surfaces and must not deepen violations —
  trivially satisfied because it modifies neither.
- **Debt in scope (read-only):** `workers-non-deno-task-sandbox-boundary` (DEBT_ACCEPTED — the
  RFC's security section is built on it), `PLUGIN-RUNTIME-ADAPTER-RELOCATION` (#172d),
  `CRON-SUBSYSTEM-DUP` (RFC-adjacent), `workers-private-type-ref-1655`.
- **Anti-patterns watched:** AP-11/AP-12 (bench harness owns its clock explicitly — bench code is
  run-dir throwaway but still avoids hidden globals), AP-25 n/a (no published runtime code).

## Gate set (from `gates/archetype-gate-matrix.md` + SCOPE-docs)

| Gate | Applicability | Evidence |
| --- | --- | --- |
| F-1..F-19 fitness gates | **n/a** — no `packages/`/`plugins/` source modified (matrix keys on owned surfaces) | worklog note + `git diff --stat` vs main showing only `.llm/runs/` + `rfcs/` |
| Static gates | Scoped to bench code: `deno check --unstable-kv` on run-dir harness | worklog table |
| Runtime gates (Arch-3) | The benchmark IS the runtime gate: start/stop/cancel of Worker + listener exercised; timeout + failure paths observed in protocol | results + worklog |
| SCOPE-docs: source alignment | Every RFC prescriptive claim → doctrine/RFC/code/measurement | claims-trace pass in worklog |
| SCOPE-docs: scope separation | RFC = target-state proposal, clearly marked Draft; current-state facts cited to code | RFC front-matter + prose |
| SCOPE-docs: link integrity | All local paths in RFC + run docs exist | link-check pass |
| SCOPE-docs: terminology | Names match doctrine + glossary (TaskType, TaskRuntimeAdapterLike, …) | review pass |
| Doc lint | `deno task doc:lint` if it covers `rfcs/` (verify; else markdown lint via fmt check scoped) | worklog table |
| jsr-audit | **N/A** — no package surface change (recorded per plan-gate) | this row |
| Release-gate class | **n/a** — not a release cut; no scaffold/publish surface touched | this row |

## Architecture decisions — LOCKED

- **L1 Dispatch-path substitution.** Benchmark drives the production dispatch path in-process:
  `createQueue<TaskMessage>('tasks')` (local Deno KV **native queue ops** — the documented default
  provider) → `Worker` task listener → `processWorkerTask` → `createDefaultTaskExecutor()` →
  adapter → subprocess. Aspire hosting and RabbitMQ/Redis backends are out of reach in this
  container (drift D-2); the substitution and its bias are stated in RFC methodology +
  threats-to-validity. *Rationale:* F14–F17 — the code path is identical; only hosting/backends
  differ.
- **L2 Subjects.** A `deno` TaskType (`.permissions` minimal), B scriptc static binary via
  `executable`, C the **same binary** as B via `executable` (control — proves the seam adds no
  scriptc-specific cost; B≡C is a sanity gate), D Rust release binary via `executable` (native
  ceiling). A–D run through the queue AND in a labeled direct-`execute()` series (dispatch-tax
  isolation). E in-process WASM (Rust `wasm32-unknown-unknown`; scriptc WASI blocked by missing
  Zig — recorded) and F in-process FFI (`Deno.dlopen`, Rust cdylib, C ABI) are **labeled direct
  microbenchmarks**, never presented as queue numbers; an in-process pure-JS row is included as
  the floor reference.
- **L3 Workload.** MINSTD LCG (`state = state * 48271 % 2147483647`), short = 1e5 iters, long =
  1e7 iters. *Rationale:* product < 2^53 so f64 (JS/scriptc) and u64 (Rust/WASM) agree **exactly**
  — cross-language identical outputs are gateable. The naive `1103515245`-multiplier LCG from the
  smoke test exceeds 2^53 and would diverge between JS float and Rust integer math; rejected.
  Each task self-reports `vmHwm` from `/proc/self/status` in its result JSON (identical extra work
  in every subject; scriptc fs support verified in S4 before protocol runs).
- **L4 Measurement seam.** A decorating `TaskExecutorLike` wrapper (implements
  `supports`/`execute`, delegates to `createDefaultTaskExecutor()`) captures per-execution
  `TaskResult.duration` + wall timestamps; an `executionState` mutation hook captures
  enqueue→complete end-to-end latency. Zero framework modification; the wrapper sits exactly on
  the seam the RFC proposes to extend. Enqueue timestamp taken immediately before
  `queue.enqueue()` resolves the message id.
- **L5 Pre-registered verdict criteria** (so the RFC verdict cannot be post-hoc): compare B vs A
  through-queue end-to-end p50 at c=1. If the improvement is **< 20%** on the short workload
  (dispatch dominates the spawn tax), the RFC recommends *documented recipe + experimental
  community adapter via `customAdapters`, not a built-in TaskType*. If **≥ 20%** on short AND the
  per-subprocess RSS ratio (A/B) stays ≥ 5×, a built-in adapter is defensible and the RFC weighs
  it against the authoring-constraint drawbacks. Executor-side `duration` and fanout RSS are
  reported alongside; long-workload deltas are expected small (compute-bound) and are reported as
  the bound on spawn-tax amortization.
- **L6 Placement.** All bench code + raw results in the run dir (`bench/`, `results/`);
  `packages/bench` untouched (agent self-bench instrument, not a perf harness). RFC at
  `rfcs/0000-scriptc-task-runtime-adapter.md`, status Draft, number 0000 while drafting.
- **L7 PLAN-EVAL: N/A.** The owner handover fixes contract, subjects, protocol, deliverable, and
  acceptance; owner scope additions (Rust, WASM/FFI, #1679) were given directly in-session. The
  remaining decisions are measurement mechanics (this plan locks them). No framework source is
  touched, no multi-PR wave. Per lane-policy 2026-08-08 owner decision, a ceremonial evaluator
  session is not created; IMPL-EVAL remains mandatory and separate.

## Open-decision sweep

| Decision | Status |
| --- | --- |
| Fresh-KV isolation mechanism per series (env path override vs fresh process per series) | **safe to defer** to S5 — mechanics; gate: series-start assertion that queue + execution state are empty |
| Task-listener delivery concurrency under Deno KV `listenQueue` (affects where the c-sweep saturates) | **safe to defer** — it is itself a measured finding, reported either way |
| Long-workload sweep levels {1,4} vs all four | **resolved now:** {1,4} — 4 physical cores; a CPU-saturated 10M-iter loop at c≥16 measures queueing of a saturated CPU, not runtime differences; rationale recorded in results.md |
| `Deno.dlopen` flag surface in Deno 2.9 (`--allow-ffi`, unstable?) | **safe to defer** to S7 — verified empirically before any RFC claim cites it |
| Whether `deno task doc:lint` covers `rfcs/` | **safe to defer** to S9 — if not, scoped fmt/link checks are the gate, recorded |

None of the deferred items can force rework of earlier slices: they are contained in the slice
that resolves them.

## Risk register

| Risk | Mitigation |
| --- | --- |
| R1 Deno KV queue throughput caps the c-sweep before runtimes differentiate | Direct-execute series isolates dispatch overhead; the cap itself is an RFC finding (queue-bound vs runtime-bound) |
| R2 Shared-tenancy CPU noise (cloud container) | Fixed iteration counts; report percentiles not means; interleave subject order within each series batch; environment manifest pins machine identity |
| R3 Cross-language numeric divergence | L3 MINSTD; S4 gate: identical JSON for fixed (seed, n) across A–F |
| R4 KV state bleed between series | Fresh KV path per series + empty-state assertion (open-decision 1) |
| R5 scriptc static tier rejects `/proc/self/status` read or other harness needs | S4 smoke verifies before protocol; fallback: external `/proc/<pid>/status` VmHWM sampler taken at completion |
| R6 Disk allowance exhausted by cargo artifacts | `--release` only, `cargo clean` intermediates, keep final binaries; scratchpad for build dirs |
| R7 300-sample × long-workload series runtime | Time-boxed estimate ~25 min total; long sweep reduced per open-decision 3; warmup 20 everywhere |

## Debt implications

None created. `workers-non-deno-task-sandbox-boundary` is cited, not modified; if the RFC is
accepted later, its implementation would extend that debt's scope note (recorded in RFC
Drawbacks).

## Commit slices

Numbering continues the PR checklist (S1 bootstrap, S2 research — landed).

| Slice | Proves | Gate | Files |
| --- | --- | --- | --- |
| S3 | Plan & Design locked | plan-gate self-check + PLAN-EVAL: N/A recorded | `plan.md`, `worklog.md` (## Design), PR body/comment |
| S4 | Workloads are correct + identical across subjects | `verify-workloads.ts` prints identical result JSON for fixed (seed,n) for A/B/C/D variants + E/F cores; scriptc/rust binaries build; sizes recorded | `bench/tasks/*` (lcg-core, task-deno, task-scriptc, rust crate), `bench/verify-workloads.ts` |
| S5 | Real dispatch path boots + measures in-container | 10-exec smoke through queue on subjects A and C; measuring wrapper + mutation hook produce parseable records; clean stop | `bench/harness/*` (worker-boot, measuring-executor, series-runner, stats) |
| S6 | The headline numbers | Completeness: all planned series ≥300 measured (warmup 20 discarded); sanity: B≈C within noise; raw JSONL + env manifest committed | `results/raw/*.jsonl`, `results/environment.json` |
| S7 | Execution-boundary floor numbers | E/F produce the L3-identical result value; flags recorded; labeled direct | `bench/boundary/*`, `results/raw/boundary*.jsonl` |
| S8 | Analysis matches raw data | `results.md` tables generated by script from raw JSONL (no hand-typed numbers); percentile definitions stated | `results/results.md`, `bench/harness/report.ts` |
| S9 | The RFC | SCOPE-docs gates (alignment, links, terminology) + doc/fmt lint + claims-trace (every number → run-dir path or citation) | `rfcs/0000-scriptc-task-runtime-adapter.md` |
| S10 | Run closure | worklog gate table complete; context-pack current; PR DoD boxes updated truthfully; IMPL-EVAL handoff posted | run-dir artifacts, PR |

## Deferred scope

- Aspire-hosted / RabbitMQ / Redis benchmark tiers (needs Docker + Aspire host).
- npm-dependency-heavy workload (scriptc `--dynamic` quickjs tier vs V8) — stated as drawback with
  cited reasoning, not measured here.
- Windows/macOS binary matrix, signing hook implementation, `deno compile` measured series
  (discussed qualitatively in RFC alternatives; `deno compile` startup is expected between A and B
  and is flagged as follow-up measurement).
- scriptc WASI-target numbers (blocked: no Zig in container).
- monty spike (#1679) — separate issue.
- Any framework implementation of the adapter (would be a WSL Codex slice in a future run per
  CLAUDE.md supervisor rules).

## jsr-audit

N/A — no package/plugin public surface is planned or changed (bench code is run-dir-local; RFC is
documentation).
