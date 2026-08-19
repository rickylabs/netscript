---
rfc: 0000 # assigned by a maintainer at acceptance; keep 0000 while drafting
title: scriptc task runtime adapter for Background Processing
status: Draft # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
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
Redis/RabbitMQ), and the pre-registered verdict criteria are locked in that run's `plan.md` (L1–L5)
and `drift.md` (D-2, D-5).

## Summary

Compile CPU-bound background tasks written in (restricted) TypeScript to small static native
binaries with [scriptc](https://scriptc.dev) and dispatch them through the worker plugin's existing
`executable` TaskType. Measured through the production dispatch path (queue →
`MultiRuntimeTaskExecutor` → adapter → subprocess → TaskResult), the scriptc binary removes almost
the entire per-message runtime cost of the `deno` TaskType — executor-side p50 drops from 50.6 ms to
6.8 ms (7.4×) on a 100k-iteration workload — and 17× of per-subprocess memory (43.4 MB → 2.5 MB peak
RSS). End-to-end through the queue the improvement is 40.7% (108.0 → 64.0 ms p50), because dispatch
itself costs ~57 ms and dominates the native subjects' latency. Under fanout the CPU axis separates
hardest: the deno runtime saturates all four host cores from 16 in-flight tasks (95–100% system CPU;
~57–73 ms of system CPU per message) while the scriptc binary holds the same load at ~32–37% CPU
(~11–16 ms per message, ~5×) with ≤5 MB of aggregate live subprocess memory versus ~252 MB. The
pre-registered performance criteria for "built-in defensible" **fired** (≥20% e2e and ≥5× RSS). This
RFC nevertheless recommends **phased adoption**: ship the recipe and an experimental
`customAdapters` adapter now, and gate first-class TaskType promotion on scriptc maturity milestones
(JSR support, stable npm handling, a post-0.0.x stability commitment) — the performance case is
proven; the vocabulary commitment is what should wait.

## Motivation

The `deno` TaskType is NetScript's default and only sandboxed task runtime. Its cost model is a full
`deno run` subprocess per message: V8 + TypeScript startup and a ~43 MB peak-RSS footprint per
concurrent task (cold-spawn probe median 43 400 KB, `results.md`; consistent in shape with the prior
single-machine data point in the run handover). For short, CPU-bound, high-frequency tasks — integer
transforms, checksums, encoding, parsing — the runtime tax exceeds the useful work by an order of
magnitude: the 100k-iteration workload computes in 2.2 ms in-process but costs 50.6 ms executor-side
as a deno task. RSS multiplies under fanout: 64 in-flight deno tasks hold roughly 64 × 43 MB ≈ 2.8
GB of transient subprocess memory, versus 64 × 2.4 MB ≈ 154 MB for a static native binary
(task-self-reported VmHWM, `results.md` § peak RSS).

scriptc 0.0.32 compiles a restricted-but-real TypeScript subset ("What compiles behaves
byte-for-byte like Node" — scriptc.dev) to a self-contained static binary via clang: the benchmark
workload compiled to **584 KB** and produced results identical to the Deno/V8 run on both workloads
(`bench/verify-workloads.ts`, exact cross-language equality gated in CI of the run). The team keeps
one language for task authoring — the gap Rust closes only by adding a second language — while
gaining native startup and memory behavior.

The cost of doing nothing: NetScript's answer for cheap high-frequency tasks remains "accept the
deno tax" or "leave TypeScript". Both are real costs today for the workloads above; neither needs
new framework surface to fix, which is exactly what this RFC weighs.

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

The task obeys the standard polyglot contract (input as argv + env, result as the last JSON line of
stdout) and rides the existing queue → executor → `ExecutableRuntimeAdapter` path, which dispatches
the entrypoint directly with no adapter-added overhead
(`packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:118-125`; confirmed by the B≡C
control series, `results.md`).

### If promoted to a first-class TaskType (the proposal being evaluated)

```ts
export const checksum = defineTask('checksum')
  .runtime('scriptc') // new BuilderTaskType member
  .entrypoint('./tasks/checksum.ts') // TypeScript source, not a binary
  .timeout(30_000);
```

- `netscript generate` / deploy compiles the entrypoint with the project-pinned scriptc, emitting
  per-platform binaries under a generated output dir; the dev loop can fall back to `deno`-style
  source dispatch or recompile-on-change.
- Dispatch semantics are exactly `executable` (the compiled artifact is the entrypoint).
- The compile step fails the build on scriptc static-tier violations (SC-codes below), turning the
  authoring constraints into build-time errors rather than runtime surprises.

## Reference-level explanation

### Where the seam already is

The executor is **open by construction**: `TaskDefinition.type` is `string` at the executor layer,
and `createDefaultTaskExecutor({ customAdapters })` resolves custom adapters _before_ the built-in
map (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:116-122,
184-192`).
The adapter contract is (`packages/plugin-workers-core/src/executor/executor-types.ts:106-111`):

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
registration path validates against it (`registerTask` → `TaskDefinitionSchema.parse`,
`packages/plugin-workers-core/src/registry/kv-task-registry.ts:100`):

| Site          | Symbol              | File                                                                |
| ------------- | ------------------- | ------------------------------------------------------------------- |
| Domain schema | `TaskTypeSchema`    | `packages/plugin-workers-core/src/domain/task.ts`                   |
| Registry type | `TaskExecutionType` | `packages/plugin-workers-core/src/registry/registry-types.ts:15-22` |
| Builder DSL   | `BuilderTaskType`   | `packages/plugin-workers-core/src/builders/builder-types.ts:46`     |

Consequence: a community `customAdapters` runtime works for **direct executor use** and for raw
`register()` writes (unvalidated, type-cast), but every schema-validated surface — `registerTask`,
scaffolded registries, runtime-schema generation — rejects an unknown type. A first-class `scriptc`
TaskType therefore means: extend those three sites, ship the adapter, and take ownership of a
**build step** (scaffold/deploy-time compile, per-platform binary matrix — linux-x64/arm64, macOS,
Windows per scriptc's platform support, WASI requiring Zig — plus the unsigned-binary signing hook
for platforms that require it). The dispatch layer itself needs nothing: subjects B and C in the
benchmark are the same binary through the same `ExecutableRuntimeAdapter`, and their distributions
coincide within run-to-run noise (`results.md` § verdict inputs).

### Measured behavior through the production dispatch path

Methodology (run `plan.md` L1–L4): production components end-to-end — `createQueue('tasks')` (local
Deno KV **native queue ops**, the documented default provider,
`packages/queue/factory/create-queue.ts:99-106`) → `startTaskQueueListener` → `processWorkerTask`
(registry lookup, idempotency claim, execution state) → `MultiRuntimeTaskExecutor` → adapter →
subprocess; per-series fresh KV; warmup 20 discarded, ≥300 measured; MINSTD LCG workload with exact
cross-language result equality (gated); 4-core Xeon container, manifest pinned in
`results/environment.json`.

Headline numbers (queue mode, short workload = 100k iterations, c=1, p50):

| Subject                                  | Executor-side (ms) | End-to-end (ms) |
| ---------------------------------------- | ------------------ | --------------- |
| A `deno` TaskType (sandboxed)            | 50.6               | 108.0           |
| B scriptc static binary via `executable` | 6.8                | 64.0            |
| C control (same binary as B)             | 6.8                | 65.5            |
| D Rust release binary via `executable`   | 4.9                | 63.7            |

What the full tables in `results.md` add:

- **Spawn tax vs dispatch share.** Direct-execute p50 (no queue): A 45.7 ms, B 6.1 ms, D 4.4 ms. The
  queue/dispatch layer contributes ~57 ms on top for every subject at c=1 — it dominates the native
  subjects' end-to-end (B's runtime is ~11% of its e2e) while the deno runtime tax is still ~41% of
  A's. Both statements are true at once: dispatch is the bigger absolute cost, and eliminating the
  runtime tax still moved e2e by 40.7%.
- **Throughput under fanout.** Short workload: A peaks at ~69 tasks/s (c=16, CPU-bound on ~50
  ms-of-CPU spawns across 4 cores) and _degrades_ to p50 941 ms at c=64; B/C/D reach 125–165 tasks/s
  at c=16–64 — **~2.2× the throughput of A** on identical hardware, now bounded by the KV
  queue/dispatch layer rather than the runtime (executor-side p50 stays ≤ 29 ms while e2e p50 climbs
  to ~340–370 ms at c=64: queueing delay, not execution).
- **Long-workload amortization.** At 10M iterations the runtime startup tax washes out as expected
  (A 330.5 vs B 284.3 ms e2e) — but a _compute_ gap appears instead (next section).
- **RSS.** Task self-report medians: B/C 2.4 MB, D 2.1 MB; cold-spawn probe: deno 43.4 MB (sandboxed
  and `--allow-all` within 0.3% of each other — the permission flags are not the cost), scriptc 2.5
  MB, Rust 2.2 MB. Ratio A:B ≈ **17×**.
- **CPU and aggregate memory at scale** (`results.md` § scale probe; 100 ms sampler over full reruns
  of the short-workload queue series):

  | Metric (short workload, queue mode)                | A `deno`                          | B scriptc | D Rust   |
  | -------------------------------------------------- | --------------------------------- | --------- | -------- |
  | Subprocess CPU per exec (cold-spawn user+sys, p50) | 40–50 ms                          | < 10 ms¹  | < 10 ms¹ |
  | System CPU per message (all processes, c=16–64)    | 57–73 ms                          | 11–16 ms  | ~10 ms   |
  | System CPU utilization p50 @ c=16 / c=64           | **95% / 95%** (4 cores saturated) | 32% / 37% | — / 32%  |
  | Aggregate live-subprocess RSS p95 @ c=64           | **252 MB** (10 live procs)        | ≤ 5 MB²   | ≤ 2 MB²  |

  ¹ Below GNU time's 10 ms accounting resolution. ² Native tasks live ~7 ms — far under the 100 ms
  sampling interval — so few are ever caught "live"; per-process transient RSS is the cold-spawn row
  (2.5 / 2.2 MB). The contrast with A is that deno tasks live long enough (~50 ms) to stack up under
  fanout.

  The CPU axis is the sharpest at-scale differentiator: the deno runtime **saturates the 4-core host
  from c=16** — runtime startup work, not task compute, consumes the machine — which is exactly why
  its throughput plateaus at ~69 tasks/s. The native subjects deliver 2.2× the throughput while
  leaving ~60% CPU headroom (their ceiling is queue/dispatch, not CPU). At ~5× less system CPU per
  message, the same worker host sustains roughly 5× the message rate — or the same rate on a
  fraction of the compute — before horizontal scaling is needed.

### The two-axis design space

This proposal sits in a **2-axis space** the benchmark instrumented deliberately:

**Axis 1 — authoring/compiler** (what produces the native artifact):

| Path           | Language                         | Sandbox story                                         | Static limits    | Build dep   |
| -------------- | -------------------------------- | ----------------------------------------------------- | ---------------- | ----------- |
| scriptc        | TypeScript (Node-globals subset) | compile-time capability narrowing, no runtime sandbox | SC-codes (below) | clang       |
| Rust           | Rust                             | none (full native)                                    | none             | cargo/rustc |
| `deno compile` | full Deno TypeScript             | **keeps `--allow-*` runtime permissions**             | none             | deno only   |

scriptc and Rust are complements, not competitors: scriptc keeps the team in TypeScript and turns
its restrictions into build errors; Rust is the ceiling for control and ecosystem (and is the only
path to a cdylib for FFI — scriptc has no shared-library output today). The measured split is
precise about what each buys:

- **Startup/footprint:** near-identical — B 6.8 ms / 2.5 MB vs D 4.9 ms / 2.2 MB (executor-side p50
  short, cold RSS). This is scriptc's entire win over the deno runtime, and it is ~90% of Rust's.
- **Compute:** not native — on the 10M-iteration loop, B runs 225 ms where D runs 53 ms (**4.2×**),
  and B's 225 ms matches in-process V8 JavaScript (219 ms, boundary G). scriptc's static tier
  executes JS-semantics arithmetic at JS speed; it removes the _process_ tax, not the _compute_ tax.
  WASM compiled from Rust runs the same loop at native speed (54 ms).

So: scriptc for high-frequency short tasks where startup and RSS dominate; Rust (or WASM) when the
loop itself is the cost. The gap between A and B is the price of the deno runtime; the gap between B
and D is the price of staying in TypeScript semantics. `deno compile` is the middle path that keeps
Deno APIs and the permission model at a startup/RSS cost expected between A and B (not measured here
— flagged as follow-up).

**Axis 2 — execution boundary** (how the artifact runs), microbenchmarked in
`results/raw/boundary.jsonl` (labeled DIRECT, not queue numbers):

| Boundary                              | Isolation                                                                          | Per-invocation cost (short workload, p50)      | Failure blast radius               | ABI surface                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| Subprocess (`executable`)             | OS process; worker-host privileges (debt `workers-non-deno-task-sandbox-boundary`) | 4.4–6.1 ms (D/B direct)                        | own process                        | argv/env/stdout contract                              |
| In-process WASM                       | linear-memory sandbox, capability imports                                          | 0.55 ms cold (instantiate+call) / 0.54 ms warm | trap → catchable; host survives    | wasm imports/exports                                  |
| In-process FFI (`Deno.dlopen`, C ABI) | **none** — host address space                                                      | 0.66 ms cold (open+call+close) / 0.48 ms warm  | native crash kills the worker host | C ABI, `--allow-ffi` (stable in Deno 2.9.5, verified) |
| In-process JS (floor reference)       | host isolate                                                                       | 2.18 ms (compute-only; V8-JIT loop)            | exception → catchable              | none                                                  |

The subprocess boundary is what this RFC proposes to keep: it is the only one that needs no new task
contract (argv/env/JSON-line survives unchanged), and the numbers show the remaining ~5
ms/invocation is the process boundary itself, with another ~10× available in-process — for workloads
that need it and can pay the contract change. A WASM task runtime is the natural future convergence
point of both compilers (scriptc has a WASI target — Zig-gated, `SC3002` restrictions on
sockets/child processes/signals/fs-watch; Rust compiles the identical core to a 270-byte module
here) and is the only boundary that _adds_ sandboxing while removing spawn cost — and the
measurements make it concrete: WASM runs the long workload at native speed (54.2 ms ≈ Rust's 53.1
ms) with sub-ms instantiate cost, i.e. it dominates scriptc-in-a- subprocess on **both** axes for
CPU-bound work. It is deliberately Future possibilities, not this proposal, because it requires a
new in-process task contract. FFI is measured for completeness: it is the floor (0.48 ms warm), and
it is disqualified as a general task boundary by crash coupling and the absent sandbox, not by
performance.

### Interaction with existing machinery

Queue, retry, idempotency claims, execution state, and telemetry spans are runtime-agnostic —
`processWorkerTask` and `MultiRuntimeTaskExecutor` treat every adapter identically
(`plugins/workers/worker/job-dispatcher.ts:192-260`). Two pre-existing gaps surfaced by the
benchmark affect all non-`deno` runtimes equally and are recorded as run drift, not RFC scope: the
queue path does not forward `correlationId`/`traceparent` env to task subprocesses (D-4,
contradicting the polyglot-tasks doc), and named queues collide on a shared local Deno KV database
(D-5).

## Drawbacks

1. **Authoring constraints are real and version-volatile (scriptc 0.0.x).** Node globals only — any
   `Deno.*` reference is a compile error even behind a `typeof` guard (SC0001, reproduced at
   0.0.32); `Math` transcendentals route to the `--dynamic` QuickJS island and fail static builds
   (SC2012); object spread after explicit properties is rejected (SC1090); npm-dependency support
   (`--npm-static`, provenance) is experimental; JSR is unsupported (upstream
   [vercel-labs/scriptc#173](https://github.com/vercel-labs/scriptc/issues/173), open with no
   maintainer response as of 2026-08-19). All reproduced firsthand in the run (`research.md` F3).
2. **Sandbox regression.** `deno` is the only runtime with per-task permission enforcement; a task
   without `.permissions(...)` already gets `--allow-all` (`permission-flags.ts:5`). A scriptc
   binary substitutes _compile-time capability absence_ (whatever wasn't compiled in can't run) for
   _runtime policy_, and otherwise inherits worker- host OS privileges like every external runtime —
   the accepted debt `workers-non-deno-task-sandbox-boundary` widens to another runtime. A related
   datum from this run: Deno gates `/proc` reads behind `--allow-all`, so sandboxed deno tasks
   cannot even self-observe RSS (D-6).
3. **Build-host dependency.** scriptc requires clang specifically (verified failure mode:
   `spawn clang ENOENT`); cross/WASI targets require Zig. This lands in CI images and the scaffold's
   doctor checks.
4. **Compute is JS-speed, not native.** scriptc's static tier preserves JS numeric semantics and ran
   the 10M-iteration loop at 225 ms — matching in-process V8 (219 ms), 4.2× slower than Rust (53
   ms). The win is startup + RSS, and it amortizes away on long tasks (A 330.5 vs B 284.3 ms e2e at
   10M). Additionally, dependency code that falls off the static tier runs on the `--dynamic`
   QuickJS island, which is slower than V8 — npm-heavy tasks can _regress_ vs the `deno` runtime
   (unmeasured here; deferred scope). Both bound the recipe's target to dependency-free, short,
   high-frequency tasks.
5. **Vocabulary growth.** A first-class TaskType is permanent public surface across three
   schema/type sites plus build tooling, against a doctrine verdict that already asks
   `plugin-workers-core` to _reduce_ contract cardinality (doctrine file 10, 2026-08-12).

## Rationale and alternatives

- **Recipe (`executable` + documented scriptc build): the current recommendation floor.** Works
  today, zero surface, proven by this benchmark end-to-end. Cost: manual build wiring, no
  compile-time integration, per-platform binaries are the user's problem.
- **Experimental community adapter via `customAdapters`:** viable for programmatic/embedded
  registration, blocked at every schema-validated surface by the closed type union — honest status:
  possible, second-class by design.
- **First-class `scriptc` TaskType:** three-site vocabulary change + build-step ownership; justified
  only if the measured runtime delta dominates real deployments (see Verdict).
- **`deno compile`:** keeps full Deno APIs _and_ runtime permissions; expected between A and B on
  startup/RSS. If the sandbox matters more than the last milliseconds, this — not scriptc — is the
  right native-binary path, and it deserves its own measured follow-up.
- **Wait for scriptc JSR support (#173):** would let tasks import `@netscript/*` contracts directly
  into static builds; upstream signal is currently zero (no maintainer response).
- **Do nothing:** the deno tax stands; teams with hot short tasks eat ~44 ms and ~43 MB per message,
  and the worker saturates at ~⅓ the throughput native subjects reached on the same four cores.

## Verdict (follows the pre-registered criteria)

Plan.md L5, fixed before any series ran: if B-vs-A end-to-end p50 improvement through the queue at
c=1/short is **< 20%**, recommend _recipe + experimental community adapter, not built-in_; if **≥
20%** and per-subprocess RSS ratio ≥ 5×, a built-in adapter is defensible against the drawbacks.

**Measured** (`results.md` § "Pre-registered verdict inputs"): improvement = **40.7%** (108.0 → 64.0
ms), RSS ratio = **17×** (43.4 → 2.5 MB), control clean (C = 65.5 ms), and the throughput ceiling
doubled under fanout (~69 → ~125–165 tasks/s). The performance branch for "built-in defensible"
fired — this RFC does **not** claim the data was too weak.

The recommendation is nevertheless **phased**, on the grounds the criteria explicitly reserved
(weighing against the authoring-constraint drawbacks):

1. **Now:** publish the recipe (scriptc → `executable`) in the Background Processing docs, and ship
   the ~20-line `ScriptcRuntimeAdapter` as an _experimental community adapter_ example in the
   existing how-to. Zero vocabulary commitment; users get the full measured win today.
2. **Promote to a first-class `scriptc` TaskType** when the upstream maturity gates clear: JSR
   support (vercel-labs/scriptc#173), npm handling out of experimental status, a stability
   commitment past 0.0.x, and a signed-binary story. The three-site vocabulary change and the
   build-step ownership are permanent; scriptc 0.0.32's authoring frontier (SC0001/SC2012/ SC1090)
   is not, and freezing today's constraints into scaffolds and docs is the real risk the drawbacks
   name.

If the maturity gates clear, the measured case here — already through the production dispatch path —
is the promotion's evidence base, and only the build-step design needs new work.

## Breaking changes and migration

None in the recommended form (recipe + optional community adapter): no existing surface changes. A
later first-class TaskType is additive to the unions (non-breaking for existing definitions) but
commits the project to the build-step and platform matrix permanently.

## Prior art

- NetScript: `docs/site/background-processing/how-to/add-a-task-runtime-adapter.md` (the
  `customAdapters` how-to this RFC's sketch follows), polyglot-tasks contract doc, arch-debt
  `workers-non-deno-task-sandbox-boundary`, RFC 0002's measurement-pinning conventions.
- scriptc: scriptc.dev docs (tiered compilation, differential testing vs Node), repo README
  (platform matrix, WASI, Zig).
- Ecosystem: `deno compile` (native binaries with permissions), Bun `bun build --compile`,
  pydantic/monty (issue #1679 — the same in-process-sandboxed quadrant for Python).

## Unresolved questions

- `deno compile` measured comparison (expected between A and B; would change the recipe's default
  recommendation if close to B).
- QuickJS-island regression bounds for npm-bearing tasks (needs a dependency-bearing workload).
- Whether D-4 (correlation/trace env not forwarded on the queue path) is fixed independently — it
  degrades observability for _all_ external runtimes including this one.
- scriptc maturity gates for any first-class promotion: JSR support (#173), stable `--npm-static`, a
  signed-binary story, and a stability commitment past 0.0.x.

## Future possibilities

- **WASM task runtime** — the convergence point: sandboxed like `deno`, near-native like B, no
  subprocess spawn; needs a new in-process adapter contract (imports/exports instead of argv/stdout)
  and is where scriptc's WASI target and Rust meet. The boundary microbenchmarks here are its
  feasibility data.
- **monty adapter for sandboxed Python** (issue #1679) — same seam, same in-process-sandboxed
  quadrant.
- **Build-artifact signing hook** — shared by scriptc, Rust, and `deno compile` artifacts.
- **`netscript task doctor`** — surface scriptc SC-code failures and clang/Zig presence at scaffold
  time.
