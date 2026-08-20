---
rfc: 0000 # assigned by a maintainer at acceptance; keep 0000 while drafting
title: NetScript Task Protocol — ecosystem citizenship for polyglot tasks
status: Draft # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
created: 2026-08-20
tracking-issue: to be opened at Discussion (pattern of #1680)
target-milestone: Backlog / Triage
---

# NetScript Task Protocol — ecosystem citizenship for polyglot tasks

## Summary

This RFC specifies the **NetScript Task Protocol (NTP)**: one versioned, language-agnostic contract
between the worker engine and task processes, plus the packages, ports, schemas, and engine
refactors that implement it. Today a polyglot task receives two env vars (`TASK_ID`, `TASK_PAYLOAD`)
and answers with the last JSON line of stdout parsed into `TaskResult { success: boolean }` — a
black-box runner contract — while a JS job handler gets
`correlationId`/`traceparent`/`reportProgress` in its `JobContext`. NTP replaces that gap with:

- a **closed, versioned envelope** (Zod-defined) delivered to every task, carrying payload, trace
  context, attempt, deadline, and retry history;
- **sentinel-framed NDJSON events** on stdout (`started`/`progress`/`log`/`result`) with a
  byte-stream demux, so results are structured and logs can never corrupt them;
- an **authenticated loopback citizen surface** (oRPC over `127.0.0.1`) through which any task in
  any language can enqueue tasks, use scoped KV, publish stream events, query status, and complete
  asynchronously — gated by per-attempt capability tokens;
- **three conformance tiers** (T0 legacy-forever, T1 structured one-shot, T2 long-lived duplex
  worker) whose achievement is **computed by a conformance suite**, never asserted;
- a **port/adapter package architecture** following the `plugin-auth-core` blueprint, and a staged
  five-wave engine integration plan that structurally retires defect classes D-1..D-10/D-12/D-13
  from the engine audit.

Every quantitative claim traces to the run directory
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc/` (32-file ratified
corpus, engine audit, six pre-registered spikes K1–K6 — all resolved on their primary criteria; see
[Appendix A](#appendix-a--measured-evidence)). Headline cost: the full T1 contract adds **+0.41 ms**
to the 7.6 ms exec-wall p50 of a Go task through the production dispatch path, with host-side
validation + demux at 0.06–0.10 ms. **No TaskType vocabulary changes** — the series precedent holds
a fifth time.

## Motivation

### Current baseline

The engine audit (`research-sources/netscript-engine-audit.md`, file:line cites) established what
the polyglot boundary actually is:

- `processWorkerTask` passes **only** `env: { TASK_ID, TASK_PAYLOAD? }` and `timeout` to the
  executor (`plugins/workers/worker/job-dispatcher.ts:234-240`), although `TaskMessage` carries
  `correlationId`/`traceparent`/`tracestate` and `TaskExecutionOptions` has fields for all of them
  (D-1). The polyglot-job path drops `correlationId` too (D-2).
- `DaxProcessRunner` builds the subprocess env from the **full supervisor env**
  (`...Deno.env.toObject()`, `dax-process-runner.ts:89-98`) — secrets included (D-9) — and parses
  the result as the **last JSON-object line of stdout** (`:178-189`): any chatty dependency can
  hijack the result channel (D-3); non-JSON output silently becomes `null`; nothing validates either
  boundary direction (D-4).
- `attempt` is hardcoded `0` and `maxRetries` never drives a retry loop (D-5); a post-spawn abort
  never kills the child (D-6); timeouts are detected by message string-sniffing (D-7) and collapsed
  to `failed` on persist (D-8); stdout is buffered unbounded (D-10); `success` is exit-code-0 alone
  with stderr truncated to one line (D-13).
- Even the first-class citizen is short-changed: `JobContext.reportProgress` terminates at
  `console.log` (`plugins/workers/worker/worker.ts:163-169`) and never reaches the
  `/workers/executions` durable stream (D-12).

### User problem

Runs 1–4 (#1678, #1683, #1685, #1686) proved polyglot _execution_ is excellent — a Go or Rust task
costs ~6 ms and ~2 MB through the real dispatch path. But "anyone can spawn a subprocess with Deno"
is a fair critique of what ships today: a foreign task cannot report progress, be cancelled
cooperatively, distinguish retryable from terminal failure, know its attempt number, carry a trace,
log freely, or touch the ecosystem (queues, KV, streams) it runs inside. The differentiator
NetScript can own is **citizenship** — and it must be one generic contract, not four per-language
ones, because the executor seam already proved that generic contracts are what let languages be
added with zero engine change.

### Goals

1. One wire protocol + one HTTP citizen surface any language can implement with stdlib tools.
2. Total backward compatibility: every existing task remains valid forever (Tier 0).
3. Structural retirement of the audit defect classes, not spot fixes.
4. Protocol cost that does not erode the runs-1–4 execution wins (measured bar: ≤1 ms).
5. Type safety end-to-end: payload/result schemas declared once (Zod), enforced at the boundary,
   propagated to TS types and to generated foreign-language types.
6. A conformance suite as the compatibility authority (tier = computed test outcome).

### Non-goals

- Implementing the engine changes in this PR (staged waves; see
  [Staged implementation plan](#staged-implementation-plan-and-issue-decomposition)).
- Fixing defects D-1..D-14 in source here (filed as engine bugs; the protocol makes their classes
  impossible).
- New TaskTypes, broker-mediated T2 transport, saga park verbs, signed/attenuable token encodings,
  dynamic capability registration (reserved extensions; see
  [Future possibilities](#future-possibilities)).
- Per-language SDK packages beyond reference shims (citizenship addenda revisit RFCs 1–4).

## Terminology

| Term                | Meaning                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Envelope**        | The versioned, Zod-validated document delivered to a task at dispatch (via `NETSCRIPT_PAYLOAD` for T0/T1, via a dispatch frame for T2). |
| **Frame**           | One sentinel-prefixed NDJSON message on the task channel (`\x00NSF\x00` + JSON + `\n`), written with a single `write(2)` ≤ PIPE_BUF.    |
| **Task channel**    | The frame stream between engine and task: stdout (task→engine) and stdin (engine→task) for T0/T1; a duplex peer channel for T2.         |
| **Citizen surface** | The authenticated loopback oRPC HTTP surface exposing ecosystem verbs (enqueue, KV, streams, status, async completion, artifacts).      |
| **Attempt token**   | Opaque per-execution-attempt bearer credential, invalidated on retry, resolving server-side to a capability record.                     |
| **Tier (T0/T1/T2)** | A named conformance profile computed from conformance-case outcomes.                                                                    |
| **Terminal frame**  | Exactly-one `result` frame per attempt; exit without one ⇒ engine-synthesized `unknown-failure`.                                        |
| **Shim**            | A ~100-line per-language helper implementing frame writing, envelope parsing, and the control reader. Convenience, not contract.        |

## Guide-level explanation

### Declaring a task (TypeScript side — the only side most users touch)

`defineTask` gains schema and capability steps; the existing builder generics
(`TaskBuilder<TId, TConfigured, TPayload, TResult>`, today pinned to `unknown`) become bound:

```ts
import { defineTask } from '@netscript/plugin-workers-core';
import { z } from 'zod';

const ResizeInput = z.object({ src: z.string().url(), width: z.number().int().max(4096) });
const ResizeOutput = z.object({ url: z.string().url(), bytes: z.number().int() });

export const resize = defineTask('resize')
  .runtime('executable')
  .entrypoint('./tasks/bin/resize') // plain `go build` binary — recipe from RFC #1686
  .payloadSchema(ResizeInput) // NEW: binds TPayload = z.infer<typeof ResizeInput>
  .resultSchema(ResizeOutput) // NEW: binds TResult; result frame validated against it
  .capabilities(['progress', 'enqueue:thumbnail-sweep', 'kv:resize/']) // NEW: citizen scopes
  .timeout(30_000)
  .build();
```

Nothing else changes for the author: dispatch, retries, and persistence flow through the same
`tasks` queue and `MultiRuntimeTaskExecutor`. What changes is what the task receives and what the
platform can prove about it.

### Writing the task — Tier 0 (any language, zero SDK)

T0 is today's contract plus two purely additive powers. A shell script is a full citizen:

```sh
#!/bin/sh
# result: still just the last JSON line (now Zod-validated, raw kept beside the parse)
# NEW power 1: emit protocol frames by prefixing the sentinel — logs stay logs
printf '\000NSF\000{"v":1,"t":"progress","percent":50}\n'
# NEW power 2: call the citizen surface with env-delivered credentials
curl -s -H "Authorization: Bearer $NETSCRIPT_TASK_TOKEN" \
  -X POST "$NETSCRIPT_CALLBACK_URL/v1/enqueue" \
  -d '{"taskId":"thumbnail-sweep","payload":{"batch":"2026-08-20"}}'
echo '{"url":"s3://out/img.png","bytes":18234}'
```

### Writing the task — Tier 1 (structured one-shot; Go, with the reference shim)

```go
package main

import ntp "netscript.dev/shims/go/ntp" // reference shim: ~100 lines, vendorable

func main() {
	task := ntp.MustStart() // parses envelope from NETSCRIPT_PAYLOAD, emits `started`,
	                        // spawns the stdin control reader (cancel), wires SIGTERM
	var in ResizeInput
	task.BindPayload(&in) // typed: generated from the registry JSON Schema (see codegen)

	for i := 0; i < steps; i++ {
		if task.Cancelled() { // in-band cancel acked in 3.5 ms p50 (spike K5)
			task.Cancel("halfway", ntp.Checkpoint{"step": i})
			return
		}
		task.Progress(i*100/steps, "resizing")
		// ... work ...
	}
	task.OK(ResizeOutput{URL: out, Bytes: n}) // terminal frame; process may exit
}
```

The same program with no shim is ~30 lines of stdlib code: read one env var, JSON-decode, write
sentinel-prefixed lines, read stdin lines on a goroutine. Python is symmetric
(`plugins/workers/shims/python/ntp.py`; the K5 spike task _is_ the skeleton).

### What the platform now shows

Progress frames flow to the execution record and out the existing `/workers/executions` durable
stream to SSE — the same sink `ctx.reportProgress` is rewired to, so JS jobs and polyglot tasks
converge (fixes D-12 for both). Failures are structured (`errtype`, `behavior`, stack) instead of a
truncated stderr line. Timeout, cancelled, and paused become distinct persisted outcomes. Traces
continue across the queue because context rides **inside the envelope** — a queue provider cannot
drop it (fixes D-1/D-2 by construction).

## Reference-level explanation

### Architecture and ownership

Following the `plugin-auth-core` blueprint (narrow ports + composite port + typed
unsupported-capability errors + named registry resolved at the composition root —
`packages/plugin-auth-core/src/ports/mod.ts:212-355`):

```text
packages/plugin-workers-core/src/protocol/          # NEW — the protocol core (no I/O)
  mod.ts             # public surface (re-exported via plugin-workers-core mod + JSR)
  versions.ts        # PROTOCOL_VERSIONS registry: {v, status: 'active'|'yanked'}[]
  schemas.ts         # Zod: EnvelopeV1, FrameV1 (discriminated union), StructuredErrorV1,
                     #      OutcomeV1, CapabilityRecordV1, HelloV1/InitV1 (T2)
  frames.ts          # SENTINEL, FRAME_MAX_BYTES, writeFrame() budget guard, frame builders
  demux.ts           # SentinelDemux — byte-stream state machine (K1 v2 reference impl)
  env.ts             # constructTaskEnv() — allowlist builder + NETSCRIPT_* reserved registry
  ports.ts           # narrow ports + composite TaskProtocolBackendPort + registry factory
  tokens.ts          # TokenMinterPort / TokenVerifierPort + verification algorithm types
  errors.ts          # ProtocolViolationError, ProtocolOperationUnsupportedError, errtype consts
packages/plugin-workers-core/src/testing/conformance/   # NEW — the tier authority
  cases/             # named cases: t0.*, t1.*, t2.* (seeded from the D-register)
  driver.ts          # testee-task AND testee-host mode-inversion drivers
  verdicts.ts        # dual verdict (behavior + behaviorExit), matrix emitter (generated)
packages/plugin-workers-core/src/contracts/v1/
  citizen.contract-schemas.ts   # NEW — Zod schemas for the citizen surface
  citizen.contracts.ts          # NEW — oRPC contract (assembled like workers.contracts.ts)
packages/plugin-workers-core/src/state/
  token-store.ts     # NEW — KV-backed TokenMinter/Verifier adapter (capability records)
  execution-state.ts # MODIFIED — adds progress() mutation (see engine integration)
plugins/workers/worker/
  protocol-executor.ts  # NEW — withTaskProtocol() executor decorator (K4-proven shape)
plugins/workers/services/src/routers/
  citizen.ts         # NEW — loopback router; bound 127.0.0.1 only, bearer-gated
plugins/workers/shims/
  go/ ntp.go         # NEW — reference shims (scaffold-copied assets, conformance-gated in CI;
  python/ ntp.py     #        NOT published packages in v1 — see Rationale)
  csharp/ Ntp.cs
  rust/ ntp.rs
```

Doctrine placement: the protocol core is pure contract + pure functions (ARCHETYPE-1-style surface
inside `plugin-workers-core`); the decorator, router, and token store are runtime behavior under the
existing workers plugin archetype. No new workspace package is required in v1 — a standalone
`@netscript/task-protocol` extraction is deliberately deferred until a second consumer exists (see
Rationale).

### Wire schemas (normative)

The Zod sources are the single source of truth; JSON Schema (draft-2020-12, via `z.toJSONSchema`) is
committed beside them for foreign-language codegen. Wire objects are **open-world**: zod's
`additionalProperties: false` default MUST be overridden (`.loose()`), with unknown members
preserved and ignored — the measured cross-language portable core
(`research-sources/openapi-codegen-analysis.md`) forbids closed objects on the wire.

```ts
// packages/plugin-workers-core/src/protocol/schemas.ts
import { z } from 'zod';

export const PROTOCOL_VERSION = 1;

/** Delivered via NETSCRIPT_PAYLOAD (T0/T1) or the T2 dispatch frame. Closed vocabulary,
 * one namespaced extension bag; `_`-prefixed ext keys are reserved for NetScript. */
export const EnvelopeV1 = z.looseObject({
  v: z.literal(PROTOCOL_VERSION),
  taskId: z.string().min(1),
  executionId: z.string().min(1),
  attempt: z.int().min(0), // fixes D-5 exposure
  deadlineMs: z.int().positive(), // absolute epoch ms (Lambda rationale)
  traceparent: z.string().optional(), // W3C; malformed ⇒ ignored, never fatal
  tracestate: z.string().optional(),
  correlationId: z.string().optional(),
  retry: z.looseObject({
    remaining: z.int().min(0),
    lastFailure: StructuredErrorV1.pick({ errtype: true, message: true }).optional(),
    checkpoint: z.unknown().optional(), // ≤ 8 KB serialized (T-5 rule)
  }).optional(),
  payload: z.unknown(), // opaque; validated against the task's
  // registered payloadSchema when present
  ext: z.record(z.string(), z.unknown()).default({}),
});
export type EnvelopeV1 = z.infer<typeof EnvelopeV1>;

export const StructuredErrorV1 = z.looseObject({
  errtype: z.string().max(100), // dotted, e.g. 'Net.Timeout' — engine
  message: z.string().max(1024), //   cleanse caps are Faktory's, enforced
  stack: z.array(z.string()).max(50).optional(), //   host-side, never trusted from the task
  data: z.unknown().optional(),
  behavior: z.enum(['RETRY', 'PAUSE', 'FAIL']).default('RETRY'), // Restate ErrorBehavior
  nextRetryDelayMs: z.int().positive().optional(),
});

const FrameBase = {
  v: z.literal(PROTOCOL_VERSION),
  ext: z.record(z.string(), z.unknown()).optional(),
};

/** Task → engine frames (stdout channel). Discriminated on `t`. */
export const TaskFrameV1 = z.discriminatedUnion('t', [
  z.looseObject({ ...FrameBase, t: z.literal('started'), pv: z.int().optional() }), // pv echoes
  z.looseObject({
    ...FrameBase,
    t: z.literal('progress'), // version
    percent: z.number().min(0).max(100).optional(),
    message: z.string().max(256).optional(),
    detail: z.unknown().optional(),
  }),
  z.looseObject({
    ...FrameBase,
    t: z.literal('log'),
    severity: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    message: z.string().max(4000),
  }),
  z.looseObject({ ...FrameBase, t: z.literal('ping'), rssKb: z.int().optional() }),
  z.looseObject({
    ...FrameBase,
    t: z.literal('result'), // TERMINAL
    outcome: z.enum(['ok', 'error', 'cancelled']),
    value: z.unknown().optional(), // validated against resultSchema when 'ok'
    error: StructuredErrorV1.optional(), // required when 'error'
    checkpoint: z.unknown().optional(),
  }), // persisted for redelivery when 'cancelled'
]);
export type TaskFrameV1 = z.infer<typeof TaskFrameV1>;

/** Engine → task frames (stdin channel, T1+). Control-signal ids 2–15 reserved (only
 * CANCEL defined in v1 — Restate R2-A: reserve the space before you need it). */
export const HostFrameV1 = z.discriminatedUnion('t', [
  z.looseObject({
    ...FrameBase,
    t: z.literal('cancel'),
    reason: z.string().max(256).optional(),
    graceMs: z.int().positive().optional(),
  }),
  z.looseObject({
    ...FrameBase,
    t: z.literal('pong'),
    cancelRequested: z.boolean().default(false), // Temporal: control rides the ping reply
    deadlineMs: z.int().optional(),
  }), // deadline extension delivery
]);
```

Framing constants and the write rule (normative):

```ts
// packages/plugin-workers-core/src/protocol/frames.ts
export const SENTINEL = new Uint8Array([0x00, 0x4e, 0x53, 0x46, 0x00]); // "\0NSF\0"
export const FRAME_MAX_BYTES = 4096; // PIPE_BUF: a frame MUST be one write(2) ≤ this budget,
// which makes it atomic on POSIX pipes.
```

**Demux rule (normative, from spike K1):** the engine MUST scan the raw byte stream for the sentinel
and treat sentinel→newline spans as frame candidates — it MUST NOT split lines first. A frame may be
embedded inside another writer's unterminated >PIPE_BUF log line; line-anchored parsing measurably
loses frames (8–44/200 per K1-v1 rep). `SentinelDemux` in `demux.ts` is the reference state machine
(log mode ⇄ frame mode, partial-sentinel carry across chunk boundaries, sentinel+invalid-JSON ⇒ log
line + `malformed-sentinel` diagnostic, frame overflow ⇒ log). It processed 1.25 GB/rep of
adversarial output at ~127 MB/s with 200/200 recovery.

### Ports (the auth-blueprint shape, concrete)

```ts
// packages/plugin-workers-core/src/protocol/ports.ts
import type { CapabilityRecordV1, EnvelopeV1, HostFrameV1, TaskFrameV1 } from './schemas.ts';

/** Task-channel transport: how frames physically move for one execution attempt. */
export type FrameTransportPort = Readonly<{
  readonly id: string; // 'stdio' (v1 default) | future: 'peer-socket', 'message-port'
  open(attempt: AttemptHandle): Promise<TaskChannel>;
}>;

export type TaskChannel = Readonly<{
  readonly frames: AsyncIterable<TaskFrameV1>; // demuxed task→engine frames
  readonly logs: AsyncIterable<TaskLogLine>; // non-frame output, severity-tagged
  send(frame: HostFrameV1): Promise<void>; // engine→task; rejects if unsupported (T0)
  close(): Promise<void>;
}>;

/** Attempt-scoped credentials. Opaque token; capability record lives server-side. */
export type TokenMinterPort = Readonly<{
  mint(record: CapabilityRecordV1): Promise<{ token: string; expiresAt: number }>;
  invalidateAttempt(executionId: string, attempt: number): Promise<void>; // retry fencing
}>;
export type TokenVerifierPort = Readonly<{
  /** Full verification algorithm — see “Token verification” below. Returns the record or a
   * typed denial; NEVER accepts (executionId, attempt) tuples in place of the token. */
  verify(token: string, need: CapabilityCheck): Promise<CapabilityRecordV1>;
}>;

/** Progress persistence: throttled latest-wins writes onto the execution record. */
export type ProgressSinkPort = Readonly<{
  report(executionId: string, p: { percent?: number; message?: string; atMs: number }): void;
}>;

/** Optional capability — large/binary payloads; frames stay text (D-10). */
export type ArtifactStorePort = Readonly<{
  put(scope: ArtifactScope, blob: ReadableStream<Uint8Array>): Promise<{ ref: string }>;
  get(ref: string): Promise<ReadableStream<Uint8Array>>;
}>;

/** Composite backend, aggregating narrow ports; optional members follow the auth pattern
 * (absence ⇒ ProtocolOperationUnsupportedError with a stable code, never undefined
 * behavior). */
export type TaskProtocolBackendPort = Readonly<{
  readonly id: string;
  readonly transport: FrameTransportPort;
  readonly tokens: Readonly<{ minter: TokenMinterPort; verifier: TokenVerifierPort }>;
  readonly progress: ProgressSinkPort;
  readonly artifacts?: ArtifactStorePort; // optional capability
}>;

/** Named registry resolved at the composition root — mirrors createAuthBackendRegistry. */
export function createTaskProtocolRegistry(
  backends: ReadonlyMap<string, TaskProtocolBackendPort>, // must contain 'default'
): TaskProtocolRegistry;
```

`ProtocolOperationUnsupportedError` and `ProtocolViolationError` are typed (`errors.ts`), with
stable `errtype` constants (`Protocol.Unsupported`, `Protocol.BadEnvelope`,
`Protocol.MalformedFrame`, `Protocol.TerminalMissing`, `Protocol.FrameOverflow`) — protocol
violations are a distinct error lane from task-domain failures and are never retry-eligible by
default.

### Engine integration — exact seams, what is refactored, what is preserved

The integration is a **decorator around the existing executor**, not an adapter rewrite — spike K4
proved this shape end-to-end through the unmodified dispatch path at +0.41 ms.

```ts
// plugins/workers/worker/protocol-executor.ts (NEW)
export function withTaskProtocol(
  inner: WorkerTaskExecutor, // createDefaultTaskExecutor() — unchanged
  deps: { registry: TaskProtocolRegistry; taskRegistry: TaskRegistryPort },
): WorkerTaskExecutor {
  return {
    supports: (t) => inner.supports(t),
    async execute(task, options) {
      const backend = deps.registry.resolve(task); // 'default' unless overridden
      const envelope = buildEnvelope(task, options); // Zod-validated pre-spawn
      const { token } = await backend.tokens.minter.mint(capabilityRecordFor(task, envelope));
      const env = constructTaskEnv({ envelope, token, base: task.env, allow: options.env });
      const result = await inner.execute(task, { ...options, env });
      return interpretOutcome(task, result, backend); // demux + validate + map
    },
  };
}
```

Per-seam plan (every touched file, with its defect linkage):

| Seam (file:line today)                                                                                      | Change                                                                                                                                                                                                                                                                                    | Defects retired |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `plugins/workers/worker/job-dispatcher.ts:234-240`                                                          | `processWorkerTask` threads `correlationId`, `traceparent`, `tracestate`, `signal`, `attempt`, `executionId`, `deadlineMs` from the message/record into `TaskExecutionOptions` (fields mostly exist; three are added — see type diff below)                                               | D-1, D-5        |
| `plugins/workers/worker/job-execution.ts:24`                                                                | polyglot-job path forwards `correlationId`                                                                                                                                                                                                                                                | D-2             |
| `packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-98`                            | `buildEnvironment()` **replaced** by `constructTaskEnv()`: allowlisted base (no `Deno.env.toObject()` spread), reserved `NETSCRIPT_*` namespace injected, user-set reserved keys rejected at registry time. `clearEnv`-equivalent delivery proven leak-free in spike K2                   | D-9             |
| `dax-process-runner.ts:171-189`                                                                             | `parseJsonLastLine` **demoted, not deleted**: it becomes the T0 fallback _inside_ `interpretOutcome()` — run only when the demux saw no `result` frame; its parse is Zod-checked with the bounded raw line kept beside it (`resultRaw`)                                                   | D-3, D-4, D-13  |
| `dax-process-runner.ts:39-49`                                                                               | abort wiring: post-spawn `signal.aborted` sends `cancel` frame (T1+), then SIGTERM after `graceMs`, then SIGKILL; child handle actually killed                                                                                                                                            | D-6             |
| `dax-process-runner.ts:84` + `job-dispatcher.ts:247,315`                                                    | timeout/cancel classified by **error type**, not message sniffing; `KvExecutionState.complete()` persists `timeout`/`cancelled`/`paused`/`unknown-failure` as distinct statuses; runner-measured duration wins                                                                            | D-7, D-8, D-14  |
| `packages/plugin-workers-core/src/state/execution-state.ts`                                                 | NEW `progress(executionId, {percent, message, atMs})` mutation → `#save(record,'updated')` → existing `setMutationHook` → `createStreamMutationHook` → `/workers/executions` stream → SSE. Latest-wins throttle (min(0.8×timeout, 30 s), Temporal shape) lives in the sink, not the state | D-12            |
| `plugins/workers/worker/worker.ts:163-169`                                                                  | `ctx.reportProgress` rewired from `console.log` to the same `progress()` mutation — JS and polyglot citizenship converge on one sink                                                                                                                                                      | D-12            |
| `packages/plugin-workers-core/src/domain/task.ts:177` (`TaskDefinitionSchema`) + `builders/task-builder.ts` | additive fields: `payloadSchema?`, `resultSchema?` (serialized JSON Schema in the registry; Zod at the builder), `capabilities?: string[]`. `registerTask` validation extends accordingly                                                                                                 | D-4             |
| `plugins/workers/services/src/routers/` + `router.ts:11-18`                                                 | NEW `citizen.ts` router assembled from `citizen.contracts.ts` via the existing `assemblePluginContractRouter` seam; bound to `127.0.0.1:<random>` with a per-boot SSRF bearer (spike K3 pattern)                                                                                          | —               |
| `packages/plugin-workers-core/src/executor/executor-types.ts:60-73`                                         | `TaskExecutionOptions` gains `attempt?: number`, `executionId?: string`, `deadlineMs?: number` (additive, optional — no adapter breaks)                                                                                                                                                   | D-1, D-5        |
| `executor-types.ts:90-104` (`TaskResult`)                                                                   | additive: `outcome?: TaskOutcomeV1` (typed union below), `resultRaw?: string` (bounded), `status` widened to the new vocabulary. Existing fields untouched — every current consumer keeps compiling                                                                                       | D-8, D-13       |

**Preserved unchanged:** `MultiRuntimeTaskExecutor` and its adapter map
(`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:195-205`), every
`RuntimeAdapterBase` subclass, the queue listener (`queue-consumer.ts`), `createQueue` providers,
and the registry storage layout. The decorator composes at the same place the run-1–5 measuring
executor did — which is exactly why K4 could measure it without engine edits.

### Type safety

```ts
// The outcome union replaces success-boolean archaeology (additive on TaskResult):
export type TaskOutcomeV1 =
  | { kind: 'ok'; value: unknown; validated: boolean } // value typed via resultSchema
  | { kind: 'error'; error: StructuredErrorV1 }
  | { kind: 'cancelled'; checkpoint?: unknown }
  | { kind: 'timeout' }
  | { kind: 'paused'; error: StructuredErrorV1 } // behavior: PAUSE
  | { kind: 'unknown-failure'; exitCode: number; resultRaw?: string }; // no terminal frame
```

- **Builder generics become real.** `payloadSchema(S)` returns
  `TaskBuilder<TId, C, z.infer<S>, TResult>`; `resultSchema(R)` binds `TResult`. The existing
  type-state (`'entrypoint-set' | 'handler-set'`) is untouched, so `build()` constraints keep
  working. `triggerTask` and `ExecutionRecord.result` consumers can narrow through
  `TaskDefinition<TId, TPayload, TResult>` where today they hold `unknown`.
- **Frames are a discriminated union** (`t`), so engine handlers are exhaustive `switch`es with an
  explicit unknown arm (required by the open-world rule).
- **Foreign-language types are generated, not hand-written**: registry stores
  `z.toJSONSchema(payloadSchema, { io: 'input' })` and the result schema with `io: 'output'`
  (input/output duality — never one shared schema); CI generates Go (`typify`-class), Python
  (`datamodel-code-generator`), C# (NJsonSchema) types into the shims' example projects. Schemas are
  authored to the measured portable core: discriminated root `oneOf` is the only portable union; no
  `not`; composition limited (`openapi-codegen-analysis.md`).

### The citizen surface (oRPC contract)

```ts
// packages/plugin-workers-core/src/contracts/v1/citizen.contract-schemas.ts (excerpt)
export const CitizenCredentialsResponse = z.object({
  taskToken: z.string(), // attempt token (rotates on retry)
  expiresInS: z.int().positive(),
  attempt: z.int().min(0),
});
export const CitizenEnqueueInput = z.object({
  taskId: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  delayMs: z.int().min(0).optional(), // Restate OneWayCall invoke_time shape
});
```

| Route                                           | Verb             | Capability required            | Notes                                                                                                    |
| ----------------------------------------------- | ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `GET /v1/credentials`                           | credential fetch | bootstrap token                | env carries the pointer + bootstrap token; real material stays server-side (Lambda pattern, spike K2/K3) |
| `POST /v1/enqueue`                              | enqueue task     | `enqueue:<taskId               | prefix>`                                                                                                 |
| `GET/PUT /v1/kv/*`                              | scoped KV        | `kv:<prefix>`                  | prefix-jailed onto `getKv()`                                                                             |
| `POST /v1/streams/publish`                      | stream publish   | `stream:<topic>`               | topic-scoped                                                                                             |
| `GET /v1/executions/:id`                        | status query     | own-execution or `status:read` | `KvExecutionState.get/listBy*`                                                                           |
| `POST /v1/executions/:id/complete\|fail`        | async completion | own attempt token only         | Temporal detached-handle; **no ID-tuple bypass**                                                         |
| `POST /v1/artifacts` / `GET /v1/artifacts/:ref` | binary channel   | `artifacts`                    | optional capability                                                                                      |

Transport: TCP `127.0.0.1` with a per-boot random port, canonical for **all tiers** (T-4 lock;
in-band T2 citizen reads are a fenced v2 extension). For deno-type tasks, exact-port
`--allow-net=127.0.0.1:<port>` _is_ the access gate — measured: wrong scope is `NotCapable`-denied
before auth runs; round-trip 0.49 ms p50 sandboxed (K3). UDS is a named optional capability only
(Deno `fetch` cannot speak it; `SUN_LEN` forbids deep workspace paths).

### Security model

Reserved env namespace (delivered by `constructTaskEnv()`; user-set reserved keys rejected at
registration):

```text
NETSCRIPT_PROTOCOL=1            NETSCRIPT_TASK_ID           NETSCRIPT_EXECUTION_ID
NETSCRIPT_ATTEMPT               NETSCRIPT_DEADLINE_MS       NETSCRIPT_PAYLOAD   (the envelope)
NETSCRIPT_CALLBACK_URL          NETSCRIPT_BOOT_TOKEN        NETSCRIPT_TASK_TOKEN (T0/T1)
```

The base env is a **constructed document** (allowlist + task-declared `env` + these), never an
inherited snapshot — spike K2 proved delivery is exact and leak-free (planted supervisor secret
contained; `/proc/*/environ` is 0400 same-uid-only, and sandboxed deno tasks cannot read `/proc` at
all).

Capability record + verification algorithm (normative order, K8s-TokenReview discipline):

```ts
export const CapabilityRecordV1 = z.looseObject({
  jti: z.string(),
  aud: z.string(), // supervisor instance binding
  executionId: z.string(),
  attempt: z.int().min(0),
  exp: z.int(), // TTL floor 600 s, default 3600 s
  caps: z.array(z.string()), // 'progress' | 'enqueue:x' | 'kv:p/' |
}); // 'stream:t' | 'artifacts' | 'status:read'
```

1. Loopback transport gate (bind is `127.0.0.1`; reject otherwise).
2. Bearer present, record exists, `exp` not passed (401 vocabulary from K3).
3. **Liveness + fencing**: `(executionId, attempt)` must be the _current, running_ attempt — token
   invalidated on retry; a stale attempt's progress/completion is rejected.
4. `aud` matches this supervisor instance.
5. All-must-pass capability check for the requested verb (Biscuit semantics).
6. No identification fallback: mutating verbs accept the token only.
7. Audit log per request — enabling later tightening of declared scopes to observed usage.

T2 changes only delivery: env carries the **worker-identity bootstrap** token; each dispatch frame
carries a fresh attempt token (env is fixed at spawn; a duplex worker serves many attempts). RFC
8693 token exchange is the reserved delegation verb.

### Lifecycle and error semantics

Attempt state machine (engine-side, persisted vocabulary in parentheses):

```text
dispatched ──▶ running ──▶ completed        (completed)
                 │  │
                 │  ├─ result{error,behavior:RETRY} ─▶ retrying → new attempt (failed + retry)
                 │  ├─ result{error,behavior:FAIL}  ─▶ failed
                 │  ├─ result{error,behavior:PAUSE} ─▶ paused        (park for operator)
                 │  ├─ result{cancelled}            ─▶ cancelled
                 │  ├─ deadline exceeded            ─▶ timeout       (grace → SIGKILL ladder)
                 │  └─ exit w/o terminal frame      ─▶ unknown-failure (exitCode as detail)
```

- Terminal-frame discipline: exactly one `result` per attempt; extras are protocol violations (first
  wins, violation logged). Exit-without-terminal is **engine-synthesized** `unknown-failure` — never
  inferred success/failure soup (Restate, double-attested).
- Retry is decided by the **engine** (budget + per-`errtype` disposition hook), informed by the task
  (`behavior`, `nextRetryDelayMs`). Protocol violations are never retry-eligible by default.
- Cancellation ladder: `cancel` frame (T1+, acked 3.5 ms p50 Go / 30 ms python3 — K5) → SIGTERM at
  `graceMs` → SIGKILL. T0 tasks are signal-only **by design** (a non-duplex channel provably cannot
  deliver in-band cancel mid-flight — Restate request/response precedent).
- Deadlines are absolute epoch ms; the engine delivers extensions via `pong.deadlineMs` (Hatchet
  RefreshTimeout, additive).
- Checkpoints: ≤ 8 KB rides `retry.checkpoint` in the next envelope; 8–256 KB via inbound frame (T2)
  or artifact ref (T1); > 256 KB artifacts-only (T-5 caps, protocol constants).

### T2 — long-lived worker mode

T2 reuses the oRPC standard-server-peer frame shape (`{i,t,p}` correlated frames, ABORT_SIGNAL,
event iterators) so a future transport is a two-line shell, per the measured oRPC architecture. v1
specifies:

1. `init` handshake: worker sends `hello { pv, capabilities: string[] }`; engine replies with
   accepted capabilities (LSP semantics: unknown optional notifications ignored; unknown requests
   get structured `MethodNotFound`). **Version negotiation**: engine declares `pv`; worker echoes;
   no echo ⇒ T0/T1 detection. The version registry carries a `yanked` bit.
2. Dispatch: each task is an envelope frame with a fresh attempt token.
3. Liveness: `ping`/`pong` with control bits; missed-ping budget (4×15 s default) marks the worker
   suspect and re-queues its leases.
4. Shutdown: two-phase `shutdown` → drain → exit-0 witness; **zombie rule** (BullMQ): a worker that
   fails `init` must exit, be killed, and never be pooled; released back to a pool only if
   verifiably alive.

The #1684 web-worker pool is transport-compatible by construction (its oRPC message-port protocol is
the same peer shape over a different channel).

### Conformance suite (the tier authority)

- Case identity: `<tier>.<verb>.<behavior>` (gRPC naming; Autobahn wildcards — a tier is the prefix
  set `t0.*` ∪ … ∪ `tN.*`). D-register seeds the first fix-gate cases:
  `t0.result.log_line_not_hijacked` (D-3), `t0.env.no_supervisor_inheritance` (D-9),
  `t1.cancel.acked_during_blocking_compute` (D-6/K5), `t1.exit.timeout_status_distinct` (D-7/D-8),
  `t1.trace.envelope_context_survives_queue` (D-1).
- **Dual verdict** per case: `behavior` + `behaviorExit`
  (OK/NON-STRICT/FAILED/UNIMPLEMENTED/INFORMATIONAL) — the exit axis is where D-6/7/8 lived.
- **Mode inversion**: `deno task conformance:tasks -- --testee-task "<cmd>"` (reference host drives
  any binary; pytest-lsp-style command spec, zero NetScript imports required) and `--testee-host`
  (reference task drives a host implementation) — only the inversion gates the host-side defects.
- The capability matrix is **generated** from verdicts (double-indexed JSON + JUnit for CI);
  declared-vs-probed-vs-observed drift is a first-class finding. Tier N is achieved iff all
  non-excluded `t0..tN.*` cases pass. CI: PR lane runs t0/t1 + host inversion; nightly runs the full
  testee×tier×version matrix with an N/N-1 version window.

### Extension model

1. **`ext` bag** on every envelope/frame: open, per-key namespaced, `_`-prefixed keys reserved for
   NetScript. Unknown keys are preserved, never fatal.
2. **Verbs**: string-keyed registry. Unknown _notification_ frames are ignored with a diagnostic;
   unknown _request_ frames (T2) get `MethodNotFound`. Vendor verbs must be `x-`-prefixed.
3. **Capabilities**: string-keyed, namespaced (`netscript.*` reserved); negotiated at T2 init,
   declared in the registry for T0/T1; the conformance matrix is their declaration surface.
4. **Versions**: monotonic integer, yankable registry, host-declared + task-echoed; a version bump
   is required for any change to closed vocabularies (frame `t` values, outcome kinds, error
   `behavior`s); everything else extends via 1–3.
5. **Transports**: implement `FrameTransportPort`; the protocol core never changes (`stdio` ships in
   v1; `peer-socket` and `message-port` are the anticipated seconds).
6. **Backends**: implement `TaskProtocolBackendPort` and register under a name — the same override
   path `customAdapters` gives runtimes today.

### Edge cases (normative resolutions)

| Case                                                      | Resolution                                                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Crash mid-frame (partial sentinel span at EOF)            | span counted `malformed-sentinel`; attempt ends `unknown-failure` (no terminal frame)                                        |
| Duplicate `result` frames                                 | first wins; subsequent ⇒ `Protocol.TerminalMissing` violation logged, ignored                                                |
| `result` frame + non-zero exit                            | frame wins (it is the contract); exit code recorded as corroborating detail                                                  |
| Log line containing the exact sentinel + valid frame JSON | indistinguishable by design (in-band framing residual); documented; binary-log-heavy tasks should use T2/socket transport    |
| Frame > `FRAME_MAX_BYTES`                                 | overflow ⇒ logged as `Protocol.FrameOverflow`, content demoted to log; writers must chunk via progress `detail` or artifacts |
| Queue redelivery races a live attempt                     | attempt tokens fence: the stale attempt's mutations are rejected at verification step 3                                      |
| Clock skew on absolute deadlines                          | deadlines are host-authored and host-enforced; tasks treat them as advisory; skew cannot extend a lease                      |
| Malformed `traceparent`                                   | ignored, never fatal (W3C rule); execution proceeds untraced                                                                 |
| `payloadSchema` validation failure                        | dispatch fails **before spawn** with `Protocol.BadEnvelope` (`behavior: FAIL`) — an authoring error, not a retryable fault   |
| T0 task that emits no frames and no JSON line             | `outcome: ok` with `value: null` iff exit 0 (today's semantics, preserved verbatim)                                          |

### Staged implementation plan and issue decomposition

Each wave is one run/PR with its own gates; the protocol core (schemas/demux/env/ports) lands first
and is consumed incrementally. Bars cite the spike numbers they must reproduce.

| Wave                     | Scope                                                                                                                                     | Retires                             | Acceptance bar                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| W1 `protocol-core`       | `protocol/` module (schemas, frames, demux, env, ports, errors, versions) + unit/property tests; no engine wiring                         | —                                   | K1 demux corpus replayed as unit fixtures: 200/200 frames, misroute 0; fmt/lint/quality/arch gates                             |
| W2 `dispatch-context`    | options threading (D-1/D-2/D-5 seams), `constructTaskEnv`, envelope emission, `withTaskProtocol` decorator mounted; T0 fallback preserved | D-1, D-2, D-5, D-9                  | K4 bar re-run in-plugin: ≤1.0 ms exec-wall delta on the Go subject; `t0.*` conformance green incl. `no_supervisor_inheritance` |
| W3 `structured-outcomes` | demux in `interpretOutcome`, outcome union, status vocabulary, abort/kill ladder, error cleanse caps                                      | D-3, D-4, D-6, D-7, D-8, D-13, D-14 | `t1.*` result/exit cases green; K5 cancel bar (<100 ms p95) reproduced in-plugin                                               |
| W4 `citizen-surface`     | citizen contracts + router, token store (mint/verify/fence), progress mutation + throttle + stream chain, `reportProgress` rewire         | D-12                                | K6 chain re-measured **in-plugin incl. SSE** (replica caveat discharged); K3 auth cases green; scoped-KV jail property tests   |
| W5 `t2-worker`           | peer channel, init/negotiation, ping control, two-phase shutdown, pool integration with #1684                                             | —                                   | `t2.*` cases green; zombie-rule fault injection; soak: 24 h worker, zero leaked processes (`agentic:leak-check` clean)         |

Cross-wave: conformance harness grows with each wave (it is each wave's acceptance instrument);
shims (`plugins/workers/shims/*`) land with W3 and are CI-gated from then on; the D-register issues
are filed at RFC Discussion so waves close them with `Fixes #N`.

## Drawbacks

1. **Commitment surface**: versioned registries, conformance cases, and four reference shims are
   ongoing maintenance the two-env-var contract never needed. Mitigation: the conformance suite is
   the contract; shims are deliberately ~100 lines and CI-gated, not published SDKs.
2. **In-band framing residual**: a task that deliberately echoes raw bytes containing the exact
   sentinel + valid frame JSON forges frames. Accepted and documented (NUL never occurs in text
   logs); T2/socket is the escape hatch. Every in-band protocol in the corpus carries the same
   residual.
3. **The supervisor becomes an HTTP server per host** (loopback only, bearer-gated, per-task
   net-scoped — measured; but still new operational surface and new audit duty).
4. **T1 in-band cancel needs a reader thread** in the task — a real per-language shim burden;
   signal-only T0 remains legal forever.
5. **Additive type debt**: `TaskResult` carries both the legacy fields and `outcome` until a major
   version retires the former.

## Rationale and alternatives

- **Protocol-first vs SDK-first.** SDKs rot per-language and multiply the contract; a wire
  protocol + conformance suite keeps one source of truth (Sidekiq→Faktory is this exact lesson, from
  the corpus).
- **Decorator vs adapter rewrite.** Wrapping the executor (`withTaskProtocol`) preserves every
  adapter and the run-1–4 baselines, and K4 measured the wrapper's full cost at +0.41 ms. Rewriting
  `RuntimeAdapterBase` was rejected: it couples protocol evolution to seven adapter subclasses and
  forfeits the T0 guarantee.
- **Two surfaces vs everything-in-band.** BullMQ's single pipe was a constraint artifact (Node
  child, no other channel); Restate's all-frames model needs a durability journal T0/T1 lack.
  Temporal/Hatchet's thin-channel + client split is the precedent; K3's sub-ms loopback removes the
  performance objection. T2 in-band reads stay a fenced v2 extension (T-4).
- **Sentinel-stdout vs fd-3 vs socket-first for T0/T1.** fd-3 is infeasible on the Deno host
  (`Deno.Command` exposes no extra fds — measured, R5-D-2); socket-first would tax T0's
  zero-ceremony promise and exclude `fetch`-less contexts. Sentinel framing measured clean through
  12.5 GB of adversarial output.
- **Env-delivered tokens vs stdin-only.** `/proc` exposure is same-uid-only (0400), and same-uid
  processes already share the supervisor trust domain; the env pointer keeps T0 SDK-free. T2 uses
  per-dispatch frames regardless (K2 verdict).
- **In-core protocol module vs a new `@netscript/task-protocol` package.** Deferred extraction:
  exactly one consumer exists today (the workers plugin); premature extraction creates a publish
  surface with no second client. The module is written import-clean (no I/O, no plugin imports) so
  extraction is mechanical when #1684 or an external SDK needs it. This mirrors how auth kept ports
  in `plugin-auth-core`.
- **Published shim packages vs scaffold assets.** v1 ships shims as conformance-gated scaffold
  assets: publishing Go modules/PyPI/NuGet packages creates four release trains before the protocol
  has field feedback. Revisit at the citizenship addenda.
- **A `protocol` TaskType?** No — NTP is orthogonal to runtimes; series precedent (5×).
- **Do nothing.** The defect register keeps compounding and the four language RFCs stay recipes for
  excellent black boxes.

## Breaking changes and migration

**None at T0** — the tier exists so every existing task (all four language-RFC recipes, every
scaffold sample, every `deno`/`python`/`dotnet`/`shell` task) remains conformant unchanged: same env
vars (the legacy names are kept alongside the `NETSCRIPT_*` namespace for one major), same
last-JSON-line fallback, same exit-code semantics. All engine-visible type changes are additive
(`TaskExecutionOptions` optional fields; `TaskResult.outcome`/`resultRaw`; `TaskDefinitionSchema`
optional fields). The env allowlist (W2) is the one behavioral change tasks could observe (they stop
inheriting unrelated supervisor vars); it ships behind a per-task `envPassthrough: true` escape
hatch for one minor with a deprecation diagnostic, then becomes the default. Waves land behind the
registry seam; each is independently revertible.

## Prior art

Ratified 32-file corpus (`research-sources/`): Faktory/Sidekiq (closed envelope, BEAT control
channel, cleanse caps), Celery v2 (lineage headers), BullMQ sandboxed processors (child IPC, zombie
rules), AWS Lambda Runtime API (env bootstrap, reserved namespace, absolute deadlines), LSP
(capability negotiation, `$/` tiering, two-phase shutdown), Temporal (task tokens, heartbeat-carried
cancellation, checkpoint redelivery, throttle), Hatchet/Inngest/Restate (retry disposition, terminal
discipline, yankable versions), sd_notify/gRPC-health/CloudEvents/ W3C-trace-context (lifecycle +
envelope standards), oRPC v1/v2 (+ community stdio adapter's sentinel framing),
NSwag/openapi-generator/JSON-Schema pipelines (portable core, context- injection chokepoint), FFI
callback channels, scoped-credential corpus (Lambda creds, K8s bound SA tokens, RFC 8693,
macaroons/Biscuit), and conformance harnesses (gRPC interop, Autobahn, CloudEvents). In-repo: the
auth-plugin port blueprint, RFC 0001's contract/adapter structure, and runs 1–4's execution
baselines.

## Unresolved questions

- Loopback survival under Docker/Aspire orchestration and on Windows hosts (untested in-container —
  R5-D-5; the pattern matches Aspire's env-injected service discovery, but that is an argument, not
  a measurement). W2 must measure it.
- The in-plugin progress chain: K6 measured a replica (state API lacks the mutation; streams service
  not bootable in-container). W4 discharges the caveat, SSE included.
- T2 conformance-case granularity (one long-lived session hosting many cases vs process-per-case) —
  no corpus precedent; decide in W5's plan.
- Grace-window semantics for fenced-out attempts (absolute rejection vs bounded final diagnostic
  flush; K8s's 60 s deletion grace is the nearest analogue).
- Exact `capabilities` string grammar for KV prefixes and enqueue patterns (glob vs literal prefix)
  — decide in W4 with the jail property tests.
- UNVERIFIED register carried from research (research.md §7): Restate V5–V7 prose restatements,
  Bootsharp CancellationToken semantics, oRPC retry-plugin classification — none load-bearing for
  T0/T1.

## Future possibilities

- **Citizenship addenda for RFCs 1–4** (owner-directed follow-up): per-language shim deep dives —
  the ~100-line proof of genericity per language.
- **`@netscript/task-protocol` extraction** once a second consumer exists; published shim packages
  per language after field feedback.
- **T2 in-band citizen reads** (fenced v2 extension), broker-mediated T2 transport, and a
  `peer-socket` `FrameTransportPort` for binary-log-heavy tasks.
- **Signed/attenuable tokens** (macaroon/Biscuit re-encoding of the same capability record) and RFC
  8693 delegation; per-request audit-driven scope tightening.
- **WASM/FFI in-process adapters** carrying the same citizen port (Bootsharp `[Import]`,
  wasm-bindgen imports, `Deno.UnsafeCallback` as direct-binding transports).
- The **confinement RFC** (#1685 matrix) composing Landlock/bwrap with the per-task net scoping
  measured here; `netscript task doctor` protocol checks.

## Appendix A — measured evidence

All spikes pre-registered in `plan.md` L8 with iff-branched criteria; **no fallback branch fired**.
Script-generated detail: `results/results-spikes.md`; raw: `results/raw/k*.jsonl`.

| Spike | Question                                     | Result (criterion)                                                                                                                                              |
| ----- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1    | Frame transport under adversarial logs       | 200/200 frames, 10/10 reps, Go+python3, 1.25 GB/rep hostile output, ~127 MB/s; sentinel-scan rule derived; fd-3 infeasible on Deno host (bar: misroute 0 — met) |
| K2    | Token delivery + constructed env             | allowlist exact, canary secret contained, `/proc` environ 0400; stdin-frame verified (bar: same-uid-only exposure — met)                                        |
| K3    | Loopback transport                           | sandboxed deno 0.49 ms p50 under exact-port scoping; wrong scope NotCapable-denied; python3 0.67 ms; UDS demoted (bar: sandbox-reachable — met)                 |
| K4    | Protocol overhead through REAL dispatch path | +0.41 ms exec-wall worst case (bar ≤1.0); host validate+demux 0.06–0.10 ms (bar ≤0.5); e2e c=16 delta negative (bar ≤5%); 1920/1920, exact result identity      |
| K5    | In-band cancel during blocking compute       | Go 3.5/5.8 ms p50/p95, python3 30.2/43.1 ms, 60/60 cancelled, no special flags (bar <100 ms p95 — met)                                                          |
| K6    | Progress chain (replica)                     | 93.9 ms p95 steady @10 ev/s (bar ≤500); 9.5× burst coalescing; 82–84 B bounded record; MEASURED-ON-REPLICA (W4 discharges)                                      |

Engine audit: `research-sources/netscript-engine-audit.md` (defect register D-1..D-14, file:line).
Research synthesis + tension register + UNVERIFIED register: `research.md`.
