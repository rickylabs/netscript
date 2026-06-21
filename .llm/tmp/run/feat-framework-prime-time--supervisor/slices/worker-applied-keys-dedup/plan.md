# plan.md — worker-applied-keys-dedup

## Locked scope

Make the workers consumer path **exactly-once-effective** per
`docs/architecture/doctrine/08-runtime-state-failure.md:202-221`:

1. Propagate an idempotency key end-to-end: add `idempotencyKey?: string` to `JobMessage` and
   `TaskMessage`; have the trigger producer stamp it onto the message body (not just the queue
   `deduplicationId`).
2. Introduce a durable **applied-keys** port + KV-backed store and gate `processWorkerJob` /
   `processWorkerTask` / queue-trigger + task listeners on it: claim before effect, mark applied on
   success, release on failure, and emit a structured `already-applied` (skip, not failure) outcome
   on duplicate.
3. Wire the store through the worker composition roots over the **same `getKv()` handle** the rest
   of the workers runtime uses, so dedup is durable across restart and shared across replicas.
4. Observability + README delivery-guarantee declaration.

## Archetype + overlays

- **ARCHETYPE-3 (Stateful Runtime).** Gates: universal F-* family + **F-13 saga/runtime invariants**
  (idempotency/delivery-guarantee), F-3 layering (port in core, impl in plugin), F-4 inheritance
  (no new abstract base; concrete store), F-5/F-6 public-surface/JSR, F-10 test-shape,
  F-14 console-log (route new logs through the existing worker logging convention; no raw
  `console.error` in the normalizer-free path beyond existing style), F-15/F-17/F-18 barrels.
- **Overlay SCOPE-service** (deployable plugin runtime): composition-root wiring + consumer-time
  behavior. No scaffold-output change → **e2e:cli NOT required**.

## Design

### Contract first (the locked types)

**A. `JobMessage` / `TaskMessage` idempotency field**
(`packages/plugin-workers-core/src/runtime/runtime-types.ts`)

Add to both message types:
```
readonly idempotencyKey?: string;
```
Optional (back-compat: existing producers/messages without a key fall back to derived key, see B).

**B. `WorkerIdempotencyPort`** — new file
`packages/plugin-workers-core/src/ports/worker-idempotency-port.ts`, type-only, storage-agnostic:

```
/** How the applied key was resolved. */
export type WorkerIdempotencySource = 'caller' | 'message-id' | 'payload-hash';

/** Input for resolving + claiming an applied key for one delivery. */
export type WorkerIdempotencyInput = Readonly<{
  concept: 'job' | 'task';
  /** jobId or taskId. */
  targetId: string;
  /** Explicit key from the message, if present. */
  idempotencyKey?: string;
  /** Queue messageId (stable per logical message across redeliveries on KvPolling). */
  messageId?: string;
  /** Payload used for the SHA-256 fallback when no key is supplied. */
  payload?: unknown;
}>;

/** Result of claiming an applied key. */
export type WorkerIdempotencyClaim = Readonly<{
  /** false => this delivery is a duplicate of an already-applied/in-flight effect. */
  claimed: boolean;
  /** Resolved key (namespaced by concept+targetId). */
  key: string;
  source: WorkerIdempotencySource;
  /** Present and true only when a *completed* key already exists. */
  alreadyApplied: boolean;
}>;

/** Durable applied-keys store gating worker effects (at-least-once + dedup). */
export interface WorkerIdempotencyPort {
  /** Atomically claim the key for this delivery; false when already in-flight or applied. */
  claim(input: WorkerIdempotencyInput): Promise<WorkerIdempotencyClaim>;
  /** Mark the key applied for `ttlMs` after a successful effect. */
  markApplied(key: string, ttlMs: number): Promise<void>;
  /** Release the in-flight claim after a failed effect so retry can re-run. */
  release(key: string): Promise<void>;
}
```
Re-export from `packages/plugin-workers-core/src/ports/mod.ts` and from
`packages/plugin-workers-core/src/public/mod.ts` (types section).

Key resolution (locked, mirrors triggers `resolveKey`): explicit `idempotencyKey` →
`source:'caller'`; else `messageId` → `source:'message-id'`; else `sha256:` of
`JSON.stringify(payload)` via `crypto.subtle.digest` → `source:'payload-hash'`. Final stored key is
namespaced `${concept}:${targetId}:${resolved}`.

**C. KV-backed store** — new file
`plugins/workers/worker/worker-idempotency-store.ts`, `KvWorkerIdempotencyStore implements
WorkerIdempotencyPort`, constructed over the injected `@netscript/kv` `WatchableKv` (typed against
a minimal `WorkerIdempotencyKvStore` shape exposing `get`/`set(…, {expireIn})`/`delete` and optional
`atomic`). Two key spaces under prefix `['workers','idempotency']`: `active/<key>` (claim, TTL =
active window) and `applied/<key>` (completed marker, TTL = applied window). `claim()` uses
`atomic([{key:active,versionstamp:null},{key:applied,versionstamp:null}], [{type:'set',key:active,
value,expireIn:activeTtlMs}])` when `atomic` is available; when the backend lacks `atomic`
(`atomic === undefined`), fall back to a `has(applied) || has(active)` check then `set` — and the
store constructor MUST throw if neither `atomic` nor a safe sequential path is available (no silent
non-durable default). `markApplied` deletes `active`, sets `applied` with `expireIn`. `release`
deletes `active`. Defaults: `activeTtlMs = 15*60_000`, `appliedTtlMs = 24*60*60_000`, both
configurable via constructor options and env (`NETSCRIPT_WORKERS_IDEMPOTENCY_*`).

### Implementation wiring

**D. Consumer gate** (`plugins/workers/worker/job-dispatcher.ts`):
- `processWorkerJob`: after registry resolution and before `executionState.create`, call
  `idempotency.claim({concept:'job',targetId:jobId,idempotencyKey:message.idempotencyKey,
  messageId:tracedContext?…/message id,payload})`. If `!claim.claimed`: emit structured
  `already-applied` outcome (span event `worker.job.idempotent_skip` + a single info log via the
  worker's existing logging style), increment a dedup metric, and **return without creating an
  execution or running the effect**. On the success path call `markApplied(claim.key, appliedTtlMs)`;
  in the `catch` call `release(claim.key)` before `recordJobFailure`. Thread `messageId`/
  `deliveryCount` from `MessageContext` into the dispatch context.
- `processWorkerTask`: identical gate with `concept:'task'`.
- `WorkerDispatchContext` (`worker-options.ts`) gains `readonly idempotency: WorkerIdempotencyPort`
  and the dispatcher functions accept the queue `MessageContext` (messageId/deliveryCount) so the
  resolver can use `messageId`.

**E. Listener plumbing** (`plugins/workers/worker/worker.ts`, `queue-consumer.ts`): pass the queue
`MessageContext` (it already arrives as the 2nd `listen` arg) through to the dispatchers; include
`idempotency` in `dispatchContext()`. `Worker` constructor accepts
`options.idempotency: WorkerIdempotencyPort` (required) stored as a private field.

**F. Producer propagation** (`plugins/triggers/src/runtime/trigger-runtime-processor.ts:111-119`):
add `idempotencyKey: action.options.idempotencyKey ?? event.idempotencyKey ?? event.id` to the
constructed `JobMessage` body (keep the existing `deduplicationId` enqueue option as a belt-and-
braces enqueue-time guard). This is the only triggers change.

**G. Composition roots** (`plugins/workers/services/src/service-runtime.ts` +
`plugins/workers/bin/runtime.ts`): in `createWorkersServiceRuntime`, build
`new KvWorkerIdempotencyStore({ kv: store })` from the **same** `getKv()` handle and add it to the
frozen runtime; expose it on `WorkersServiceRuntime` (`router-context.ts`). In `runtime.ts`
(`startWorkerProcess`/`startCombinedProcess`) pass `idempotency: runtime.idempotency` into every
`new Worker({...})`. No new KV connection is opened — durable + shared by construction.

**H. README delivery guarantee**: `plugins/workers/README.md` (and the workers-core README) state
"at-least-once with idempotency keys (exactly-once-effective)" per doctrine 220-221.

## Open-decision sweep

- **Store substrate = `getKv()` `WatchableKv` (NOT raw `Deno.openKv`).** LOCKED — must resolve now;
  deferring would force a rewrite of the store + composition root. Rationale: workers already
  standardize on `getKv()`; sharing the handle gives durability + cross-replica for free.
- **Port lives in core, impl in plugin.** LOCKED (layering F-3; keeps `@netscript/kv` out of the
  publishable core).
- **`idempotencyKey` optional with `messageId`→`payload-hash` fallback.** LOCKED — guarantees a key
  for *every* inbound message (doctrine 214) without breaking existing producers.
- **`Worker.idempotency` is required (no in-memory default shipped).** LOCKED — doctrine + slice bar
  forbid a silent non-durable default. Tests inject a deterministic store; production injects the
  KV store.
- **Queue layer untouched.** LOCKED safe-to-defer (DLQ slice owns queue changes).

## Commit slices (ordered, each gate-able)

1. **core-contract** — add `idempotencyKey?` to `JobMessage`/`TaskMessage`
   (`runtime-types.ts`); add `WorkerIdempotencyPort` + claim/input/source types
   (`src/ports/worker-idempotency-port.ts`); re-export via `src/ports/mod.ts`, `src/runtime/mod.ts`
   (if message types re-exported), and `src/public/mod.ts`. Proves: types compile + public surface.
   Gate: `run-deno-check.ts --root packages/plugin-workers-core --ext ts` (`--unstable-kv`),
   `run-deno-lint.ts`, `run-deno-fmt.ts`. Files: `runtime-types.ts`, `ports/worker-idempotency-port.ts`,
   `ports/mod.ts`, `public/mod.ts`, `runtime/mod.ts`.
2. **core-resolver+tests** — pure key-resolution helper (caller/message-id/payload-hash, SHA-256)
   colocated with the port or in `src/runtime/`, plus unit tests (deterministic hash, precedence,
   namespacing). Proves: resolution correctness. Gate: `deno test packages/plugin-workers-core`
   targeted. Files: resolver `.ts` + `tests/runtime/worker-idempotency_test.ts`.
3. **plugin-store** — `KvWorkerIdempotencyStore` over `WatchableKv` (atomic + sequential fallback,
   TTL, claim/markApplied/release, throw-on-non-durable). Proves: durable claim semantics. Gate:
   `deno test plugins/workers` targeted with `@netscript/kv` memory adapter (first-wins claim,
   duplicate rejected, release re-enables, applied marker dedups, TTL expiry). Files:
   `plugins/workers/worker/worker-idempotency-store.ts`, `tests/.../worker-idempotency-store_test.ts`.
4. **consumer-gate** — gate `processWorkerJob`/`processWorkerTask` on claim/markApplied/release;
   thread `MessageContext`; add `idempotency` to `WorkerDispatchContext`; span event + dedup metric
   + structured already-applied outcome. Proves: no double-apply on redelivery. Gate: targeted
   dispatcher tests (redelivery double-apply prevented; failure path releases + allows retry;
   already-applied returns skip not failure). Files: `job-dispatcher.ts`, `worker-options.ts`,
   `queue-consumer.ts`, `worker.ts`, dispatcher tests.
5. **producer-propagation** — stamp `idempotencyKey` on the `JobMessage` body in
   `trigger-runtime-processor.ts`. Proves: key survives the queue boundary. Gate: targeted triggers
   test asserting message body carries the key. Files: `trigger-runtime-processor.ts`, triggers test.
6. **composition-wiring** — build `KvWorkerIdempotencyStore` in `service-runtime.ts` over `getKv()`,
   expose on `WorkersServiceRuntime` (`router-context.ts`), inject into every `new Worker(...)` in
   `bin/runtime.ts`. Proves: deployed worker is durable + shared. Gate:
   `deno check --unstable-kv` on `plugins/workers` task + targeted runtime test. Files:
   `services/src/service-runtime.ts`, `services/src/routers/router-context.ts`, `bin/runtime.ts`.
7. **docs+surface** — README delivery-guarantee statements; `deno doc` surface sanity;
   `jsr-audit` rubric on the new core exports. Proves: doctrine 220-221 + JSR. Gate:
   `publish:dry-run` (plugin-workers-core), fmt/lint, doc-score. Files: both READMEs.

(7 slices < 30.)

## Gates to run (per archetype-gate-matrix, ARCHETYPE-3 + SCOPE-service)

- Static: `deno check --unstable-kv` via `.llm/tools/run-deno-check.ts` (roots
  `packages/plugin-workers-core`, `plugins/workers`, `plugins/triggers`).
- `.llm/tools/run-deno-lint.ts` and `.llm/tools/run-deno-fmt.ts` (`--ext ts`, source only).
- `deno test` targeted: workers-core `tests/`, `plugins/workers` worker tests, `plugins/triggers`
  producer test. (F-10 test-shape, F-13 invariants.)
- `deno task publish:dry-run` for `@netscript/plugin-workers-core` (F-5/F-6, F-15/F-18 surface).
- F-1 file-size, F-14 console-log, F-16/F-17 barrels: manual/PENDING_SCRIPT with evidence.
- **e2e:cli — N/A** (no scaffold-output / generated-registry / DB-wiring change).

## Production/enterprise bar checklist

- Durable persistence: applied-keys over the shared `getKv()` handle (Deno KV / Redis / Postgres KV
  adapters) — no in-memory default shipped; store throws if the backend cannot guarantee durability.
- Error handling + idempotency: claim/markApplied/release with failure-path release; structured
  `already-applied` (skip, not failure) per doctrine 216-218.
- Observability: span event `worker.{job,task}.idempotent_skip` + a dedup counter attribute on the
  worker span; key `source` recorded.
- Graceful behavior: TTL-bounded claims (`expireIn`) auto-release if a worker crashes mid-effect, so
  a crashed claim never wedges the key permanently.
- Tests: unit (resolver, store), integration (consumer redelivery, composition wiring), failure-path
  (effect throws → release → retry re-runs; duplicate → skip).
