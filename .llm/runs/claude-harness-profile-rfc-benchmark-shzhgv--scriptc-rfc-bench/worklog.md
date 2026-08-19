# Worklog — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

## Design

Design checkpoint per ARCHETYPE-3 expectations, adapted to an investigation run: the "runtime"
being designed is the benchmark harness (run-dir throwaway, but held to explicit state/lifecycle/
cancellation standards); the RFC documents a *proposed* runtime surface without implementing it.

### 1. Public surface

Run-dir bench harness (not published, invoked via `deno run` from repo root):

- `bench/verify-workloads.ts` — builds all task variants, executes each once with fixed
  `(seed=42, n=1e5)`, asserts byte-identical result JSON (minus per-run fields), prints a
  correctness table. Gate for S4.
- `bench/harness/run-series.ts` — CLI: `--subject A|B|C|D --workload short|long --mode queue|direct
  --concurrency N --warmup 20 --measure 300 --out results/raw/<series>.jsonl`. One series per
  invocation, fresh process per series (KV isolation).
- `bench/boundary/run-boundary.ts` — E (WASM instantiate+call), F (`Deno.dlopen` cdylib), G
  (in-process JS floor); `--out results/raw/boundary.jsonl`.
- `bench/harness/report.ts` — reads `results/raw/*.jsonl`, emits `results/results.md` (all tables
  script-generated; no hand-typed numbers).
- Workload task entrypoints: `bench/tasks/task-deno.ts` (subject A), `bench/tasks/task-scriptc.ts`
  → compiled `task-scriptc-native` (subjects B/C), `bench/tasks/rust-lcg/` cargo crate →
  `task-rust-native` (D), `liblcg.so` cdylib (F), `lcg.wasm` (E).

RFC public surface (documented, not implemented): `defineTask('x').runtime('scriptc')` sketch,
`TaskRuntimeAdapterLike` implementation sketch, `createDefaultTaskExecutor({ customAdapters })`
registration — quoted from F16 research, verified against source.

### 2. Domain vocabulary

```ts
type SubjectId = 'A-deno' | 'B-scriptc' | 'C-executable-control' | 'D-rust';
type BoundaryId = 'E-wasm' | 'F-ffi' | 'G-inprocess-js';
type WorkloadId = 'short' | 'long'; // 1e5 | 1e7 MINSTD iterations
type SeriesMode = 'queue' | 'direct'; // through Worker+KV queue vs executor.execute()
type ExecutionSample = {
  seq: number; subject: SubjectId; workload: WorkloadId; mode: SeriesMode; concurrency: number;
  enqueuedAt: number; completedAt: number; endToEndMs: number;  // queue mode
  executorDurationMs: number;                                   // TaskResult.duration
  exitCode: number; resultAcc: string; vmHwmKb: number | null;  // task-self-reported
};
type SeriesManifest = { deno: string; scriptc: string; clang: string; rustc: string; cpu: string;
  cores: number; kernel: string; queueProvider: 'deno-kv-native'; ts: string };
```

### 3. Ports

- `TaskExecutorLike` (from `plugins/workers/src/cli/local-runtime-backend.ts` shape /
  `plugin-workers-core` executor contract) — the measuring decorator implements it and delegates
  to `createDefaultTaskExecutor()`. This is the only seam the harness owns.
- `KvExecutionState.setMutationHook` — completion-event capture (same hook the stream plugin
  uses in `bin/runtime.ts:92`).
- Clock: `performance.now()` captured at the two boundaries (pre-enqueue, mutation-hook
  complete); monotonic, explicit, passed—not ambient—in the sample assembler (AP-12 hygiene).

### 4. Constants

- `MINSTD_MULTIPLIER = 48271`, `MINSTD_MODULUS = 2147483647`, `SEED = 42` — shared across every
  language variant; the exactness argument (product < 2^53) recorded in plan L3.
- `SHORT_ITERS = 100_000`, `LONG_ITERS = 10_000_000`.
- `WARMUP = 20`, `MEASURE = 300`, `CONCURRENCY_LEVELS = [1, 4, 16, 64]` (short), `[1, 4]` (long).
- `QUEUE_NAME = 'tasks'` (the production queue name the router uses).
- Subject/boundary ids as above — no string literals in harness logic.

### 5. Commit slices

As enumerated in plan.md §Commit slices (S3–S10), ordered, each with its named gate. Files listed
there; every file traces to a §1/§2 concept.

### 6. Deferred scope

Plan.md §Deferred scope (Aspire tier, npm-heavy workload, non-Linux matrix, WASI-scriptc, monty
#1679, framework implementation).

### 7. Contributor path

To add a benchmark subject later (e.g. `deno compile` binary): drop an entrypoint/binary under
`bench/tasks/`, add one `SubjectId` member + one task-definition factory in
`bench/harness/subjects.ts`, run `verify-workloads.ts` (correctness gate), then
`run-series.ts --subject <new>`. To re-run everything on another machine: `bench/README.md`
(written in S5) lists the exact command sequence; comparability requires the manifest pins to
match (plan R2).

### Lifecycle/cancellation design (Arch-3 expectations)

- Worker boot: `KvTaskRegistry`/`KvExecutionState`/`KvWorkerIdempotencyStore` over a **fresh KV
  path per series**; task definitions registered explicitly; `Worker.start()`; series runner
  awaits listener readiness before enqueueing.
- Stop path: after the last completion, `worker.stop()` + KV close + temp-dir removal; the series
  runner exits non-zero if stop hangs past a deadline (supervised by the harness, not left to
  Deno exit).
- Failure path: per-message timeout uses the production `timeout` field; a failed/timeout sample
  is recorded with its status, never silently dropped; series aborts after >2% failure rate
  (protocol-invalidating, reported).
- Cancellation: series runner traps SIGINT → aborts worker via its AbortController → partial
  JSONL flushed with a `truncated: true` trailer record.

## PLAN-EVAL

**N/A** — recorded per plan.md L7: owner handover + in-session owner additions fix contract,
subjects, protocol, deliverable, and acceptance; remaining decisions are measurement mechanics
locked in plan.md; no framework source; no multi-PR wave. IMPL-EVAL remains mandatory and will run
in a separate session (cloud draft→ready automation route per supervisor.md).

## Slice log

### S1 — bootstrap (9764bf7)

Run dir + supervisor identity + drift D-1..D-3. Gate: n/a (scaffolding).

### S2 — research (e78e550, 2e636ff, b5b0af6)

`research.md` F1–F17; firsthand scriptc verification; dispatch-path map; #1679 filed and linked.
Gate: findings verifiable by quoted file:line / commands (spot-checkable).

### S4 — workloads + correctness gate

Files: `bench/tasks/task-deno.ts` (A), `bench/tasks/task-scriptc.ts` (B/C source),
`bench/tasks/rust-lcg/` (D bin + cdylib + wasm lib), `bench/verify-workloads.ts`.
Binaries land in gitignored `bench/tasks/build/` (reproducible from committed sources).

Gate run (first attempt, 2026-08-19):

```text
A-deno / B-C-scriptc / D-rust / E-wasm-core — short acc=846234426, long acc=777999478 — all OK
task-scriptc-native 584192 B · task-rust-native 319760 B · liblcg.so 316984 B · lcg.wasm 270 B
S4 gate: PASS
```

Notes: scriptc binary grew from 422 KB (smoke) to 584 KB with `node:fs` linked in. scriptc
compiled the `/proc/self/status` read statically without complaint (R5 retired). Slice review
(A1): numeric-exactness argument verified against all four sources (constants + loop identical;
u64/f64 intermediates < 2^53); contract compliance (argv+env in, last-JSON-line out,
CORRELATION_ID passthrough) checked per variant.

### S5 — bench harness through the real dispatch path

Files: `bench/harness/run-series.ts` (series runner: queue + direct modes, fresh-KV isolation,
measuring executor decorator, mutation-hook completion capture, SIGINT/deadline lifecycle),
`bench/harness/rss-probe.ts` (cold-spawn peak RSS via `/usr/bin/time -v`).

Findings & fixes during the slice (all recorded as drift):

1. `Worker.start()` parks on the jobs listener for the worker's lifetime (worker.ts:196-204) —
   first hang; fixed by not awaiting.
2. **D-5**: on shared local Deno KV, the Worker's jobs listener steals 'tasks' messages (single
   KV queue per database, envelope has no queue name) — second hang, message lost. Fix: harness
   boots `startTaskQueueListener` + `processWorkerTask` with contexts mirrored verbatim from
   `worker.ts:315-349`; listener/dispatcher/executor/queue/state remain production code.
3. **D-4**: queue path forwards no correlation/trace context to task subprocesses
   (job-dispatcher.ts:234) — doc/behavior mismatch, confirmed empirically.
4. **D-6**: Deno gates `/proc` reads behind `--allow-all` → sandboxed subject A cannot
   self-report VmHWM; external rss-probe added (with an `A-deno-allow-all` production-default
   variant).
5. Registry `TaskDefinition` is the full domain shape — `maxConcurrency` defaults to **1** and
   would have silently capped the c-sweep; set to 128, `maxRetries` 0.

Smoke evidence (queue mode, c=1, warmup 2 + measure 8, exit 0, 0 failures):

```text
C-executable-control short: executorWall ≈ 7-8 ms, endToEnd ≈ 48-95 ms, vmHwm ≈ 2.4 MB
A-deno              short: executorWall ≈ 49-50 ms, endToEnd ≈ 88-128 ms
D-rust direct mode  short: executorWall ≈ 5.5 ms (e2e ≈ executor, as expected)
acc = 846234426 everywhere (matches S4 reference)
```

`deno check --unstable-kv` clean on the runner. Slice review (A1): context mirror
compared field-by-field against `worker.ts` builders; measuring decorator verified to add only
a Map write per execution; enqueue window logic re-checked for the c>1 case.

### S6–S8 — protocol run, boundary microbenchmarks, results

Protocol: 32 series (queue: 4 subjects × short×{1,4,16,64} + long×{1,4}; direct: 4 × 2 workloads
× c=1), 320 executions each (20 warmup discarded), **0 failures across 10 240 executions**;
cold-spawn RSS probe 30×4. Boundary: E-wasm / F-ffi / G-inprocess-js, warm+cold, both workloads,
result identity asserted inline. `results/results.md` generated by `report.ts` — headline:
B-vs-A queue e2e p50 short c=1 = 108.0 → 64.0 ms (**40.7%**), executor-side 50.6 → 6.8 ms
(7.4×), RSS 43.4 → 2.5 MB (**17×**), throughput ceiling 69 → 125-154 tasks/s; scriptc compute ≈
V8-JS speed (long: B 225 ms ≈ G 219 ms vs D 53 ms; wasm 54 ms ≈ native). Pre-registered
"built-in defensible" branch fired.

### S9 — RFC

`rfcs/0000-scriptc-task-runtime-adapter.md` (Draft): every TBD marker replaced from results.md;
verdict follows plan L5 with the reserved drawback-weighing → **phased adoption** (recipe +
experimental customAdapters now; first-class TaskType gated on scriptc maturity: #173 JSR,
stable npm handling, post-0.0.x stability, signing story). Slice review (A1): numbers
cross-checked against results.md; implementation-path study verified against source (three
closed-union sites + `registerTask` schema validation); no framework source touched.

## Gate results

(filled per slice as they land)

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| S4 | Cross-variant result identity + builds | PASS | verify-workloads output above; rerun command in file header |
| S5 | Queue-path smoke (10 execs, A + C) + direct smoke (D) + typecheck | PASS | see S5 notes below |
| S6 | Protocol completeness: 32/32 series, ≥300 measured each, 0 failures, summaries present | PASS | run-all.sh log (`failed=0`); `results/raw/` 24 queue + 8 direct series + rss-probe |
| S6 | Sanity B≈C (same binary) | PASS | e2e p50 short c=1: B 64.0 vs C 65.5 ms (≈2%, noise floor) |
| S7 | Boundary results correctness (acc identity inline-asserted) + flag check | PASS | run-boundary.jsonl `ok:true` on every record; `Deno.dlopen` verified working with `--allow-ffi` alone on stable 2.9.5 (open decision closed) |
| S8 | results.md fully script-generated from raw JSONL | PASS | `report.ts` output "32 series"; no hand-typed numbers in results.md |
| S9 | RFC claims-trace: zero TBD markers; spot-check vs results.md | PASS | `grep -n TBD` empty; 15+ figures cross-checked against results.md tables |
| S9 | SCOPE-docs link integrity (all local paths resolve) | PASS | scripted path check: "ALL LOCAL PATHS RESOLVE" |
| S9 | Markdown fmt (scoped, single file) | PASS | `deno fmt --check rfcs/0000-scriptc-task-runtime-adapter.md` clean (RFC 0002 is fmt-clean precedent; template itself is not) |
| S9 | doc:lint | N/A | `deno task doc:lint` is the package `deno doc` lint (run-deno-doc-lint.ts --root packages/...), does not cover rfcs/ markdown — open decision resolved |
| S9 | Fitness gates F-1..F-19 / quality:scan / arch:check | N/A | no `packages/`/`plugins/` source modified — diff vs main touches only `.llm/runs/` + `rfcs/` |
