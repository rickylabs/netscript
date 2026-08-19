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

## Gate results

(filled per slice as they land)

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
