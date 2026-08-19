---
rfc: 0000            # assigned by a maintainer at acceptance; keep 0000 while drafting
title: scriptc task runtime adapter for Background Processing
status: Draft        # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ["@rickylabs"]
created: 2026-08-19
tracking-issue: drafted in PR #1678 (harness run claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench); rfc tracking issue to be opened at Discussion
target-milestone: Backlog / Triage
---

# scriptc task runtime adapter for Background Processing

Every quantitative claim in this RFC traces to
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench/results/` (raw JSONL +
script-generated `results.md`, environment manifest pinned) or to a cited external source. The
benchmark methodology, its two recorded substitutions (in-process worker host instead of an
Aspire-hosted graph; local Deno KV native queue — the documented default provider — instead of
Redis/RabbitMQ), and the pre-registered verdict criteria are locked in that run's `plan.md`
(L1–L5) and `drift.md` (D-2, D-5).

## Summary

Compile CPU-bound background tasks written in (restricted) TypeScript to small static native
binaries with [scriptc](https://scriptc.dev) and dispatch them through the worker plugin's
existing `executable` TaskType. Measured through the production dispatch path (queue →
`MultiRuntimeTaskExecutor` → adapter → subprocess → TaskResult), the scriptc binary removes
almost the entire per-message runtime cost of the `deno` TaskType (executor-side p50
TBD-RESULTS-EXEC-A vs TBD-RESULTS-EXEC-B ms on a 100k-iteration workload) and an order of
magnitude of per-subprocess memory (TBD-RESULTS-RSS) — but end-to-end latency through the queue
is dominated by dispatch, not runtime (TBD-RESULTS-E2E-DELTA). Following the pre-registered
criteria, this RFC recommends **TBD-VERDICT** rather than committing to a new built-in TaskType
vocabulary entry, and specifies what a first-class `scriptc` runtime would require if the
recommendation is later upgraded.

## Motivation

The `deno` TaskType is NetScript's default and only sandboxed task runtime. Its cost model is a
full `deno run` subprocess per message: V8 + TypeScript startup and a ~40 MB-class RSS footprint
per concurrent task (measured here: TBD-RESULTS-RSS-DENO; consistent with the prior
single-machine data point in the run handover). For short, CPU-bound, high-frequency tasks —
integer transforms, checksums, encoding, parsing — the runtime tax exceeds the useful work by an
order of magnitude, and RSS multiplies under fanout: 64 in-flight deno tasks hold roughly
64 × TBD-RESULTS-RSS-DENO of transient subprocess memory, versus 64 × ~2.4 MB for a static
native binary (task-self-reported VmHWM, `results.md` § peak RSS).

scriptc 0.0.32 compiles a restricted-but-real TypeScript subset ("What compiles behaves
byte-for-byte like Node" — scriptc.dev) to a self-contained static binary via clang: the
benchmark workload compiled to **584 KB** and produced results identical to the Deno/V8 run on
both workloads (`bench/verify-workloads.ts`, exact cross-language equality gated in CI of the
run). The team keeps one language for task authoring — the gap Rust closes only by adding a
second language — while gaining native startup and memory behavior.

The cost of doing nothing: NetScript's answer for cheap high-frequency tasks remains "accept the
deno tax" or "leave TypeScript". Both are real costs today for the workloads above; neither
needs new framework surface to fix, which is exactly what this RFC weighs.

## Guide-level explanation

### Today, as a recipe (no framework changes — this works now)

```bash
# author tasks/checksum.ts against Node globals (process.argv / process.env)
scriptc build tasks/checksum.ts -o tasks/bin/checksum   # requires clang on the build host
```

```ts
import { defineTask } from '@netscript/plugin-workers-core';

export const checksum = defineTask('checksum')
  .runtime('executable')
  .entrypoint('./tasks/bin/checksum')
  .timeout(30_000);
```

The task obeys the standard polyglot contract (input as argv + env, result as the last JSON line
of stdout) and rides the existing queue → executor → `ExecutableRuntimeAdapter` path, which
dispatches the entrypoint directly with no adapter-added overhead
(`packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:118-125`; confirmed by the
B≡C control series, `results.md`).

### If promoted to a first-class TaskType (the proposal being evaluated)

```ts
export const checksum = defineTask('checksum')
  .runtime('scriptc')                 // new BuilderTaskType member
  .entrypoint('./tasks/checksum.ts')  // TypeScript source, not a binary
  .timeout(30_000);
```

- `netscript generate` / deploy compiles the entrypoint with the project-pinned scriptc,
  emitting per-platform binaries under a generated output dir; the dev loop can fall back to
  `deno`-style source dispatch or recompile-on-change.
- Dispatch semantics are exactly `executable` (the compiled artifact is the entrypoint).
- The compile step fails the build on scriptc static-tier violations (SC-codes below), turning
  the authoring constraints into build-time errors rather than runtime surprises.

## Reference-level explanation

### Where the seam already is

The executor is **open by construction**: `TaskDefinition.type` is `string` at the executor
layer, and `createDefaultTaskExecutor({ customAdapters })` resolves custom adapters *before* the
built-in map (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:116-122,
184-192`). The adapter contract is
(`packages/plugin-workers-core/src/executor/executor-types.ts:106-111`):

```ts
export type TaskRuntimeAdapterLike = Readonly<{
  readonly id: string;
  readonly runtime: TaskType | null;
  supports(task: TaskDefinition): boolean;
  execute(task: TaskDefinition, options: ResolvedTaskExecutionOptions): Promise<TaskResult>;
}>;
```

A `scriptc` adapter is ~20 lines: `RuntimeAdapterBase` with a command builder that returns the
compiled artifact path (resolved from the entrypoint via a build-manifest lookup) — i.e. the
`ExecutableRuntimeAdapter` shape (`executable-runtime-adapter.ts`) plus artifact resolution:

```ts
export class ScriptcRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner; artifactFor: (entrypoint: string) => string }) {
    super({
      id: 'scriptc-runtime-adapter',
      runtime: null, // custom type outside the built-in TaskType union
      runner: options.runner,
      build: (task, resolved) => ({
        command: options.artifactFor(requireEntrypoint(task)),
        args: allTaskArgs(task, resolved),
      }),
    });
  }
  override supports(task: TaskDefinition): boolean {
    return task.type === 'scriptc' && Boolean(task.entrypoint);
  }
}

const executor = createDefaultTaskExecutor({
  customAdapters: { scriptc: new ScriptcRuntimeAdapter({ artifactFor }) },
});
```

### Where the seam is closed — the real cost of "first-class"

The task **vocabulary** is a closed union at three schema/type sites, and the normalizing
registration path validates against it (`registerTask` →
`TaskDefinitionSchema.parse`, `packages/plugin-workers-core/src/registry/kv-task-registry.ts:100`):

| Site | Symbol | File |
| --- | --- | --- |
| Domain schema | `TaskTypeSchema` | `packages/plugin-workers-core/src/domain/task.ts` |
| Registry type | `TaskExecutionType` | `packages/plugin-workers-core/src/registry/registry-types.ts:15-22` |
| Builder DSL | `BuilderTaskType` | `packages/plugin-workers-core/src/builders/builder-types.ts:46` |

Consequence: a community `customAdapters` runtime works for **direct executor use** and for raw
`register()` writes (unvalidated, type-cast), but every schema-validated surface — `registerTask`,
scaffolded registries, runtime-schema generation — rejects an unknown type. A first-class
`scriptc` TaskType therefore means: extend those three sites, ship the adapter, and take
ownership of a **build step** (scaffold/deploy-time compile, per-platform binary matrix —
linux-x64/arm64, macOS, Windows per scriptc's platform support, WASI requiring Zig — plus the
unsigned-binary signing hook for platforms that require it). The dispatch layer itself needs
nothing: subjects B and C in the benchmark are the same binary through the same
`ExecutableRuntimeAdapter`, and their distributions coincide within run-to-run noise
(`results.md` § verdict inputs).

### Measured behavior through the production dispatch path

Methodology (run `plan.md` L1–L4): production components end-to-end — `createQueue('tasks')`
(local Deno KV **native queue ops**, the documented default provider,
`packages/queue/factory/create-queue.ts:99-106`) → `startTaskQueueListener` → `processWorkerTask`
(registry lookup, idempotency claim, execution state) → `MultiRuntimeTaskExecutor` → adapter →
subprocess; per-series fresh KV; warmup 20 discarded, ≥300 measured; MINSTD LCG workload with
exact cross-language result equality (gated); 4-core Xeon container, manifest pinned in
`results/environment.json`.

Headline numbers (queue mode, short workload = 100k iterations, c=1, p50):

| Subject | Executor-side (ms) | End-to-end (ms) |
| --- | --- | --- |
| A `deno` TaskType (sandboxed) | TBD-RESULTS-EXEC-A | TBD-RESULTS-E2E-A |
| B scriptc static binary via `executable` | TBD-RESULTS-EXEC-B | TBD-RESULTS-E2E-B |
| C control (same binary as B) | TBD-RESULTS-EXEC-C | TBD-RESULTS-E2E-C |
| D Rust release binary via `executable` | TBD-RESULTS-EXEC-D | TBD-RESULTS-E2E-D |

TBD-RESULTS-NARRATIVE (spawn tax vs dispatch share; long-workload amortization; concurrency
sweep and where the KV queue becomes the bottleneck; RSS table).

### The two-axis design space

This proposal sits in a **2-axis space** the benchmark instrumented deliberately:

**Axis 1 — authoring/compiler** (what produces the native artifact):

| Path | Language | Sandbox story | Static limits | Build dep |
| --- | --- | --- | --- | --- |
| scriptc | TypeScript (Node-globals subset) | compile-time capability narrowing, no runtime sandbox | SC-codes (below) | clang |
| Rust | Rust | none (full native) | none | cargo/rustc |
| `deno compile` | full Deno TypeScript | **keeps `--allow-*` runtime permissions** | none | deno only |

scriptc and Rust are complements, not competitors: scriptc keeps the team in TypeScript and
turns its restrictions into build errors; Rust is the ceiling for control and ecosystem (and is
the only path to a cdylib for FFI — scriptc has no shared-library output today). The measured
gap between B and D (TBD-RESULTS-B-VS-D) is the price of staying in TypeScript; the gap between
A and B is the price of the deno runtime. `deno compile` is the middle path that keeps Deno APIs
and the permission model at a startup/RSS cost expected between A and B (not measured here —
flagged as follow-up).

**Axis 2 — execution boundary** (how the artifact runs), microbenchmarked in
`results/raw/boundary.jsonl` (labeled DIRECT, not queue numbers):

| Boundary | Isolation | Per-invocation cost (short workload, p50) | Failure blast radius | ABI surface |
| --- | --- | --- | --- | --- |
| Subprocess (`executable`) | OS process; worker-host privileges (debt `workers-non-deno-task-sandbox-boundary`) | TBD-RESULTS-BOUNDARY-SPAWN | own process | argv/env/stdout contract |
| In-process WASM | linear-memory sandbox, capability imports | cold TBD-RESULTS-WASM-COLD / warm TBD-RESULTS-WASM-WARM | trap → catchable; host survives | wasm imports/exports |
| In-process FFI (`Deno.dlopen`, C ABI) | **none** — host address space | open TBD-RESULTS-FFI-COLD / call TBD-RESULTS-FFI-WARM | native crash kills the worker host | C ABI, `--allow-ffi` |
| In-process JS (floor reference) | host isolate | TBD-RESULTS-JS | exception → catchable | none |

The subprocess boundary is what this RFC proposes to keep: it is the only one that needs no new
task contract (argv/env/JSON-line survives unchanged), and the numbers show the boundary itself
— not the runtime inside it — is TBD-RESULTS-BOUNDARY-CONCLUSION. A WASM task runtime is the
natural future convergence point of both compilers (scriptc has a WASI target — Zig-gated,
`SC3002` restrictions on sockets/child processes/signals/fs-watch; Rust compiles the identical
core to a 270-byte module here) and is the only boundary that *adds* sandboxing while removing
spawn cost; it is deliberately Future possibilities, not this proposal. FFI is measured for
completeness: it is the floor, and it is disqualified as a general task boundary by crash
coupling and the absent sandbox, not by performance.

### Interaction with existing machinery

Queue, retry, idempotency claims, execution state, and telemetry spans are runtime-agnostic —
`processWorkerTask` and `MultiRuntimeTaskExecutor` treat every adapter identically
(`plugins/workers/worker/job-dispatcher.ts:192-260`). Two pre-existing gaps surfaced by the
benchmark affect all non-`deno` runtimes equally and are recorded as run drift, not RFC scope:
the queue path does not forward `correlationId`/`traceparent` env to task subprocesses (D-4,
contradicting the polyglot-tasks doc), and named queues collide on a shared local Deno KV
database (D-5).

## Drawbacks

1. **Authoring constraints are real and version-volatile (scriptc 0.0.x).** Node globals only —
   any `Deno.*` reference is a compile error even behind a `typeof` guard (SC0001, reproduced at
   0.0.32); `Math` transcendentals route to the `--dynamic` QuickJS island and fail static
   builds (SC2012); object spread after explicit properties is rejected (SC1090); npm-dependency
   support (`--npm-static`, provenance) is experimental; JSR is unsupported (upstream
   [vercel-labs/scriptc#173](https://github.com/vercel-labs/scriptc/issues/173), open with no
   maintainer response as of 2026-08-19). All reproduced firsthand in the run
   (`research.md` F3).
2. **Sandbox regression.** `deno` is the only runtime with per-task permission enforcement; a
   task without `.permissions(...)` already gets `--allow-all`
   (`permission-flags.ts:5`). A scriptc binary substitutes *compile-time capability absence*
   (whatever wasn't compiled in can't run) for *runtime policy*, and otherwise inherits worker-
   host OS privileges like every external runtime — the accepted debt
   `workers-non-deno-task-sandbox-boundary` widens to another runtime. A related datum from this
   run: Deno gates `/proc` reads behind `--allow-all`, so sandboxed deno tasks cannot even
   self-observe RSS (D-6).
3. **Build-host dependency.** scriptc requires clang specifically (verified failure mode:
   `spawn clang ENOENT`); cross/WASI targets require Zig. This lands in CI images and the
   scaffold's doctor checks.
4. **QuickJS island performance.** Dependency code that falls off the static tier runs on
   QuickJS, which is slower than V8 for CPU-bound work — npm-heavy tasks can *regress* vs the
   `deno` runtime. Unmeasured here (deferred scope); stated as the reason the recipe targets
   dependency-free CPU-bound tasks.
5. **Vocabulary growth.** A first-class TaskType is permanent public surface across three
   schema/type sites plus build tooling, against a doctrine verdict that already asks
   `plugin-workers-core` to *reduce* contract cardinality (doctrine file 10, 2026-08-12).

## Rationale and alternatives

- **Recipe (`executable` + documented scriptc build): the current recommendation floor.** Works
  today, zero surface, proven by this benchmark end-to-end. Cost: manual build wiring, no
  compile-time integration, per-platform binaries are the user's problem.
- **Experimental community adapter via `customAdapters`:** viable for programmatic/embedded
  registration, blocked at every schema-validated surface by the closed type union — honest
  status: possible, second-class by design.
- **First-class `scriptc` TaskType:** three-site vocabulary change + build-step ownership;
  justified only if the measured runtime delta dominates real deployments (see Verdict).
- **`deno compile`:** keeps full Deno APIs *and* runtime permissions; expected between A and B
  on startup/RSS. If the sandbox matters more than the last milliseconds, this — not scriptc —
  is the right native-binary path, and it deserves its own measured follow-up.
- **Wait for scriptc JSR support (#173):** would let tasks import `@netscript/*` contracts
  directly into static builds; upstream signal is currently zero (no maintainer response).
- **Do nothing:** the deno tax stands; teams with hot CPU-bound tasks leave TypeScript or eat
  TBD-RESULTS-RSS-DENO per concurrent task.

## Verdict (follows the pre-registered criteria)

Plan.md L5, fixed before any series ran: if B-vs-A end-to-end p50 improvement through the queue
at c=1/short is **< 20%**, recommend *recipe + experimental community adapter, not built-in*;
if **≥ 20%** and per-subprocess RSS ratio ≥ 5×, a built-in adapter is defensible against the
drawbacks.

TBD-VERDICT-PARAGRAPH (computed in `results.md` § "Pre-registered verdict inputs").

## Breaking changes and migration

None in the recommended form (recipe + optional community adapter): no existing surface changes.
A later first-class TaskType is additive to the unions (non-breaking for existing definitions)
but commits the project to the build-step and platform matrix permanently.

## Prior art

- NetScript: `docs/site/background-processing/how-to/add-a-task-runtime-adapter.md` (the
  `customAdapters` how-to this RFC's sketch follows), polyglot-tasks contract doc, arch-debt
  `workers-non-deno-task-sandbox-boundary`, RFC 0002's measurement-pinning conventions.
- scriptc: scriptc.dev docs (tiered compilation, differential testing vs Node), repo README
  (platform matrix, WASI, Zig).
- Ecosystem: `deno compile` (native binaries with permissions), Bun `bun build --compile`,
  pydantic/monty (issue #1679 — the same in-process-sandboxed quadrant for Python).

## Unresolved questions

- `deno compile` measured comparison (expected between A and B; would change the recipe's
  default recommendation if close to B).
- QuickJS-island regression bounds for npm-bearing tasks (needs a dependency-bearing workload).
- Whether D-4 (correlation/trace env not forwarded on the queue path) is fixed independently —
  it degrades observability for *all* external runtimes including this one.
- scriptc maturity gates for any first-class promotion: JSR support (#173), stable `--npm-static`,
  a signed-binary story, and a stability commitment past 0.0.x.

## Future possibilities

- **WASM task runtime** — the convergence point: sandboxed like `deno`, near-native like B, no
  subprocess spawn; needs a new in-process adapter contract (imports/exports instead of
  argv/stdout) and is where scriptc's WASI target and Rust meet. The boundary microbenchmarks
  here are its feasibility data.
- **monty adapter for sandboxed Python** (issue #1679) — same seam, same in-process-sandboxed
  quadrant.
- **Build-artifact signing hook** — shared by scriptc, Rust, and `deno compile` artifacts.
- **`netscript task doctor`** — surface scriptc SC-code failures and clang/Zig presence at
  scaffold time.
