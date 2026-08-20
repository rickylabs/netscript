# RFC-5 Round-2 Analysis — Group `callback-surface`

Reverse-engineering analysis of the **child-initiated call surface** ("citizen API"): which
ecosystem operations a foreign task may invoke back against the NetScript supervisor, on which
channel, with what shapes, per conformance tier (T0 env+framed-stdout / T1 structured envelope /
T2 long-lived duplex worker).

Evidence base (round-1 raws in this directory, no new fetches):

- `temporal-durable-raw-02-hatchet-inngest-restate.md` (Restate v5+ command set, Hatchet
  dispatcher verbs, Inngest opcodes) — cited as **TD2 §x**
- `temporal-durable-raw-01-temporal.md` (activity context, heartbeat, async completion token) —
  **TD1 §x**
- `celery-bullmq-raw-02-bullmq.md` (BullMQ sandboxed-processor IPC, child-initiated verbs) —
  **B §x** (B1–B14 = its source table)
- `lambda-lsp-raw-02-lsp-base-protocol.md` (JSON-RPC base, `$/progress`, reverse requests,
  capability negotiation) — **L §x**
- `orpc-raw-02-peer-protocol-and-stdio.md` (oRPC peer frames + stdio sentinel framing) — **O §x**
- `ffi-interop-raw.md` (Bootsharp `[Import]`, wasm-bindgen imports, `syscall/js`, Deno FFI
  callbacks) — **F §x**
- `netscript-engine-audit.md` (engine reality + defect register D-1..D-14) — **AUD §x**

Claims not directly backed by a cited raw are marked **UNVERIFIED**.

---

## 1. Message / verb inventory with wire shapes — what "calling back into the host" looks like in the wild

### 1.1 BullMQ child→parent verbs — the closest existing analog to a NetScript foreign task

BullMQ's sandboxed processor is a subprocess that calls back into the parent over Node IPC with a
15-verb enum (B §1, B1 verbatim): `Completed, Error, Failed, InitFailed, InitCompleted, Log,
MoveToDelayed, MoveToWait, Progress, Update, GetChildrenValues, GetIgnoredChildrenFailures,
GetDependenciesCount, MoveToWaitingChildren, GetDependencies`. Envelope (B3):

```ts
interface ChildMessage { cmd: ParentCommand; requestId?: string; value?: any; err?: Record<string, any>; }
```

Three interaction classes coexist on the one channel (B §2):

| Class | Verbs | Shape |
| --- | --- | --- |
| Fire-and-forget events | `Progress {value}`, `Log {value}`, `Update {value}`, `Completed {value}`, `Failed {value: errorToJSON}` | no `requestId`, no reply |
| Own-lifecycle transitions | `MoveToDelayed {timestamp, token}`, `MoveToWait {token}` (fire-and-forget); `MoveToWaitingChildren {token, opts}` (request/response) | carry the **lock token** the parent supplied in `Start` |
| Child-initiated reads | `GetChildrenValues`, `GetIgnoredChildrenFailures`, `GetDependenciesCount {opts}`, `GetDependencies {opts}` | `requestId` (random 13-char base36) + parent replies `{requestId, cmd: <X>Response, value}`; child times out after `RESPONSE_TIMEOUT` = 5 000 ms (B §2 `waitResponse`) |

Parent-side handling is a switch that maps each verb to the corresponding `Job` method —
`Progress` → `await job.updateProgress(msg.value)` (which **persists to Redis**), `Log` →
`await job.log(...)`, reads → the real queue query then a correlated `*Response` (B §5). This is
the load-bearing observation for D-12: BullMQ's progress verb terminates in a durable store, not a
console.

### 1.2 Restate — every ecosystem operation is a journaled command on the task stream

Restate v5+ makes **all** citizen operations first-class protocol frames (SDK→runtime "Commands",
runtime→SDK "CompletionNotifications"; TD2 §C.3–C.4): state (`GetLazyState` 0x0402 /
`SetState` 0x0403 / `ClearState` / `GetEagerState`), durable promises (`GetPromise` 0x0409 /
`PeekPromise` / `CompletePromise`), timers (`Sleep` 0x040C), **service invocation from inside a
task** (`Call` 0x040D with `idempotency_key`, `OneWayCall` 0x040E with `invoke_time` for delayed
fire-and-forget), signalling (`SendSignal` 0x0410), attach/introspect other invocations
(`AttachInvocation` 0x0412, `GetInvocationOutput` 0x0413), and external completion
(`CompleteAwakeable` 0x0414). Correlation is `result_completion_id` per command; acks are
`CommandAckMessage {command_index}` (TD2 §C.4).

Why Restate can afford this maximalism: the channel **is** the durability journal — every command
is an entry the runtime persists and replays (TD2 §C.6). NetScript T0/T1 has no journal; copying
this vocabulary onto a non-durable stdout pipe would be cargo-culting (see §8).

### 1.3 Temporal — thin task channel, everything else via authenticated client RPC

The activity's in-band surface is deliberately tiny: `RecordActivityHeartbeat(details)` — a unary
RPC keyed by the opaque `bytes task_token`, whose **response carries the control bits**
`cancel_requested / activity_paused / activity_reset` (TD1 §3, §7.3). Completion is likewise a
unary RPC (`RespondActivityTaskCompleted/Failed/Canceled` by token, TD1 §7.3). Everything else —
starting workflows, signalling, querying — goes through the ordinary **SDK Client** (an
authenticated network API), not the task channel. The async-completion pattern proves the
token-capability model end-to-end: `activity.raise_complete_async()`; any external process later
calls `client.get_async_activity_handle(task_token).complete()/fail()/heartbeat()/
report_cancellation()` (TD1 §7.1). Identity fallback: `(namespace, workflow_id, run_id,
activity_id)` `*ById` variants (TD1 §7.3).

### 1.4 Hatchet — split verbs by channel role

Task events go worker→server as unary `SendStepActionEvent` (STARTED/COMPLETED/FAILED/CANCELLED +
`should_not_retry`), liveness is a separate worker-level `Heartbeat` RPC, cancellation arrives as
an `AssignedAction{action_type: CANCEL_STEP_RUN}` **on the same dispatch stream**, and the child
can extend its own deadline via `RefreshTimeout{task_run_external_id, increment_timeout_by}`
(additive) and release its concurrency slot early via `ReleaseSlot` (TD2 §A.1–A.2, §A.4).

### 1.5 LSP — the reverse-request and out-of-band-token patterns

- **Reverse requests** (server→client): `client/registerCapability` and
  `window/workDoneProgress/create` show a peer asking its supervisor to allocate a resource
  (a capability registration; a progress token) before using it (L §8.1, §11.9).
- **`$/progress`** is a *bidirectional notification* reported against a `ProgressToken` that is
  "different than the request ID which allows to report progress out of band and also for
  notification" (L §8). Client-initiated tokens ride in as `workDoneToken` on the request params;
  server-initiated tokens must be created via the reverse request, gated on the
  `window.workDoneProgress` client capability (L §8.1).
- **`$/` namespace rule**: implementation-dependent notifications may be ignored; unknown `$/`
  *requests* must error `MethodNotFound` (L §6) — the graceful-degradation rule for optional verbs.
- **Cancellation**: `$/cancelRequest {id}` notification; a cancelled request must still produce a
  response, advised code `RequestCancelled` (L §7).

### 1.6 Bootsharp / FFI — the in-process citizen surface (contrast case)

Bootsharp `[Import]` declares host functions the guest calls (`static partial` methods /
`[assembly: Import(typeof(IFace))]`), the host supplies implementations by assignment before
`boot()` (F §1.2–1.3). Go `syscall/js` `FuncOf` and `Deno.UnsafeCallback` show the same primitive
with explicit lifetime management (`Release()`, `close()`, `threadSafe()` for foreign-thread
wakeup) (F §3–4). Relevance: in-process (wasm/FFI) runtimes never need a wire protocol at all —
the citizen API can be a generated binding namespace — which is why the RFC surface must be
defined **as an abstract port** with two carriers (frames for subprocesses, direct binding for
in-process adapters), mirroring the auth-plugin port/adapter blueprint (AUD §4).

### 1.7 oRPC peer — the transport substrate for T2

A peer frame is `{i, t?, p}` with `MessageType REQUEST=1 | RESPONSE=2 | EVENT_ITERATOR=3 |
ABORT_SIGNAL=4`; concurrent calls multiplex over one channel by client-unique `i`; cancellation is
an `ABORT_SIGNAL` frame with the same `i`; streams are `EVENT_ITERATOR` frames with
`e: message|error|done` (O §6). The community stdio adapter binds this with sentinel framing
`\x00__ORPC__\x00` + newline delimiting, so plain `console.log` lines pass through untouched
(O §2, §4). Both `ClientPeer` and `ServerPeer` exist over the *same* channel — symmetric peers —
which is what makes supervisor→task reverse requests possible on one pipe (O §5–6).

### 1.8 NetScript today (the deficit being fixed)

Audit §5 inventories the seams an ecosystem citizen needs — enqueue, HTTP trigger, scoped KV,
durable-stream publish, SSE consume, saga verbs, execution-status readback, progress — and every
one is "currently reachable only from Deno in-process code" (AUD §5). The only child→parent signal
a foreign task has today is its **exit code plus a scavenged last-stdout-line JSON object**
(AUD §1.4, D-3); progress terminates at `console.log` even for JS (AUD §2, D-12); the subprocess
inherits the full supervisor env (AUD §1.4, D-9).

---

## 2. Mechanics — correlation, auth, and transport binding of child-initiated calls

### 2.1 Correlation models observed

| Source | Correlation primitive | Notes |
| --- | --- | --- |
| BullMQ | ad-hoc `requestId` (random base36) per read; verbs without replies carry none | 5 s hard response timeout in the child (B §2) |
| oRPC peer | `i` (client-guaranteed-unique, `SequentialIdGenerator`) on every frame; one id spans request→response→event-iterator→abort | multiplexing + streaming + cancel unified under one id (O §6) |
| LSP | JSON-RPC `id` for request/response; **separate** `ProgressToken` for out-of-band series (L §8) | tokens are allocated by whichever side initiates |
| Restate | `result_completion_id` per command; `command_index` for acks (TD2 §C.4) | index-based because the channel is a journal |
| Temporal | none in-band — the `task_token` capability *is* the correlation, carried on every RPC (TD1 §7.3) | works across processes and time (async completion) |

### 2.2 Authentication of the callback surface

- Temporal: possession of `task_token` (opaque bytes from `PollActivityTaskQueue`) authorizes
  heartbeat/completion for exactly that attempt; SDK Client operations use the normal client auth
  (TD1 §7.1, §7.3).
- BullMQ: the lock `token` handed to the child in `Start {job, token}` must accompany
  `MoveToDelayed`/`MoveToWait`/`MoveToWaitingChildren` (B §1, §2) — a per-attempt capability
  guarding state transitions.
- Hatchet: worker-level bearer token `HATCHET_CLIENT_TOKEN` (TD2 §A.3); per-task identity is
  `task_run_external_id` on each event.
- Inngest: HMAC-SHA256 request signing (`X-Inngest-Signature`, `t=timestamp&s=hex`) both
  directions (TD2 §B.2).
- LSP/BullMQ pipes: implicit — the transport (stdio/IPC) is private to the parent-child pair.

**Mapping to NetScript:** the task channel (stdio pipe) needs no auth beyond the pipe itself, but
the **loopback oRPC surface does** — any process on the host can reach a loopback port. The
Temporal pattern is the steal: the dispatcher mints a per-execution opaque token, delivers it in
the envelope (T1) or `Start` frame (T2) — never in inherited env (D-9) — and the loopback router
resolves token → `(executionId, taskId, scopes)`; every citizen call is authorized against that
scope. The `*ById` fallback (TD1 §7.3) justifies also accepting `(executionId + token)` explicitly
for external async-completion callers. Scope contents per capability: see §3.

### 2.3 Transport binding

- T0/T1 outbound frames: sentinel-prefixed lines on stdout (oRPC stdio pattern, O §4) keep
  `console.log`/`print` compatibility — the fix for D-3's "scavenge the last stdout line". Caveat
  recorded in O §4: this framing is text-only and newline-fragile; binary payloads corrupt. T1
  therefore restricts frame payloads to JSON (UTF-8); large/binary artifacts go over loopback
  HTTP, not frames.
- T1 inbound (Cancel, responses to reads): stdin, same framing. BullMQ's `main-base.ts` dispatch
  loop — a `switch` on `cmd` plus per-request `waitResponse` listeners on the same receiver
  (B §3) — is the minimal child-side implementation shape for any language.
- T2: the full oRPC peer protocol over the same stdio (or socket) — `ClientPeer` in the
  supervisor for dispatching tasks *to* the worker, `ServerPeer` in the supervisor for citizen
  calls *from* the worker (symmetric peers per O §5–6). Adding a transport "does not mean touching
  the RPC protocol" (O §5) — the port/adapter seam the auth blueprint requires (AUD §4).
- In-process adapters (wasm/FFI, future): bind the same citizen port directly as generated
  host-function bindings (Bootsharp `[Import]` shape, F §1.3); no frames involved.

---

## 3. The channel decision — PROTOCOL VERB vs LOOPBACK oRPC vs FORBIDDEN

Decision rule derived from the corpus: **an operation belongs on the task channel iff it is bound
to the identity/lifecycle of the in-flight attempt** (needs the attempt's correlation/lock token,
affects its state machine, or must survive even when networking is unavailable to the guest).
Everything else that is legitimate ecosystem access goes to the **authenticated loopback oRPC
surface**, which already exists as the workers v1 contract (AUD §3) and stays language-neutral
(plain HTTP+JSON). Evidence for the split: Temporal keeps the task channel to
heartbeat+complete+fail and routes all other citizenship through the client API (§1.3); Hatchet
splits events/heartbeat/slot-release RPCs from the dispatch stream (§1.4); BullMQ puts everything
on one pipe only because a Node child has no other authenticated path to Redis-owned state (§1.1);
Restate's everything-is-a-frame is justified only by journaling (§1.2), which NetScript T0/T1
lacks.

### 3.1 PROTOCOL VERBS (task channel)

| Verb | Direction | Tier | Why in-band (evidence) |
| --- | --- | --- | --- |
| `result` (ok/error envelope) | task→sup | T0+ | terminal lifecycle event; replaces D-3 stdout scavenging; BullMQ `Completed`/`Failed` (B §2), Restate `OutputCommandMessage` (TD2 §C.4), Hatchet `COMPLETED`/`FAILED` (TD2 §A.2) |
| `progress {value, message?, percentage?}` | task→sup | T0+ (emit-only) | attempt-scoped series; BullMQ `Progress` persists via parent (B §5); LSP `$/progress` token model (L §8); fixes D-12 (§5) |
| `log {level, line}` | task→sup | T0+ | BullMQ `Log` → `job.log` (B §5); keeps logs distinct from result/progress frames |
| `ping` / heartbeat | task→sup | T1+ | liveness for long tasks; reply carries control bits `cancel_requested`-style (TD1 §3, §7.3) — cancellation must be receivable without the guest polling HTTP |
| `cancel {reason}` | sup→task | T1+ | BullMQ `ChildCommand.Cancel` → AbortController (B §2–3); Hatchet `CANCEL_STEP_RUN` on the dispatch stream (TD2 §A.2); LSP `$/cancelRequest` semantics: cancelled work must still emit a terminal `result` (L §7) |
| `extendTimeout {by}` | task→sup, req/resp | T1+ | Hatchet `RefreshTimeout` additive semantics (TD2 §A.4); must be in-band because it mutates the attempt's deadline held by the runner |
| `checkpoint {details}` | task→sup | T1+ | Temporal heartbeat-details resume payload: "the next Activity Task can access and continue with that payload" (TD1 §3); delivered back in the next attempt's envelope |
| `init` / `initCompleted` / `initFailed` | both | T2 | BullMQ handshake incl. the zombie-child rule: a child that fails init must exit and never be pooled (B §2 `init()`, §6 `retain`) |
| `start {envelope, token}` / `shutdown` | sup→task | T2 | BullMQ `Start {job, token}` / SIGTERM→`waitForCurrentJobAndExit` drain (B §3); LSP `shutdown` (request, keep process alive for the reply) then `exit` (notification) two-phase (L §11.6–11.7) |
| `capabilities` exchange | both | T2 (static subset in T1 envelope) | LSP initialize capability negotiation (L §9, §11.1–11.4); unknown optional verbs ignored per `$/` rule (L §6) |

Notes:
- T0 has **no inbound channel** (legacy contract is env-in, framed-stdout-out), so T0 verbs are
  the emit-only subset: `result`, `progress`, `log`. Cancellation for T0 remains kill-based
  (SIGTERM grace — currently absent, D-6).
- BullMQ's own-lifecycle verbs `MoveToDelayed`/`MoveToWait`/`MoveToWaitingChildren` are **not**
  adopted as distinct verbs: their effect (reschedule/park the attempt) is representable as a
  `result` variant `{status: 'reschedule', delayUntil?...}` — NetScript's dispatcher, unlike
  BullMQ's parent, owns the queue message lifecycle end-to-end (AUD §1.2). UNVERIFIED that no
  future saga integration needs the park-while-children-run form; flagged for the RFC.
- BullMQ's read verbs (`GetChildrenValues` etc.) are deliberately **moved to loopback** (§3.2):
  BullMQ lacked an alternative channel; NetScript does not. Their `requestId`+timeout mechanics
  are still stolen for `extendTimeout` and T2 reverse requests.

### 3.2 LOOPBACK oRPC surface (authenticated, token-scoped)

All of audit §5's seams, exposed as an oRPC router the guest reaches over HTTP on
`127.0.0.1:<port>` (URL + token delivered in the envelope), callable from any language with an
HTTP client — no SDK required, per the language-agnostic goal:

| Operation | Existing seam to wrap (AUD §5) | Scope required |
| --- | --- | --- |
| `enqueueTask` / `enqueueJob` (+delay, priority, correlationId propagated) | oRPC `triggerTask`/`triggerJob`, queue surface | `enqueue` |
| `saga.signal` / `saga.query` | sagas public surface | `saga` |
| `kv.get` / `kv.set` / `kv.delete` / `kv.list` | `getKv()` — but **prefix-jailed** under `['tasks', <taskId>, ...]` (Restate precedent: per-invocation `state_map` keys, TD2 §C.4; NetScript KV is global today, AUD §5) | `kv` |
| `streams.publish {streamPath, event}` | `createDurableStream` producer | `stream:<path>` allowlist from task definition |
| `executions.get` / `executions.listBy*` | `KvExecutionState` + runs routes | `status:read` |
| `executions.complete` / `.fail` (async completion) | new; Temporal async-completion handle (TD1 §7.1) | possession of that execution's token |
| `artifacts.put` (large/binary results) | new — the escape hatch for the text-only frame limit (O §4) and D-10 buffer caps | `artifact` |

Design invariants: every route takes the per-execution token (§2.2); inputs/outputs are
zod-validated at the boundary (the existing contract already validates `triggerTask`, AUD §3);
scopes derive from the task *definition* (registry-declared capabilities), so a task cannot
self-escalate at runtime — the LSP static-vs-dynamic registration rule inverted: NetScript v1
allows **static declaration only**; dynamic capability registration (L §11.9) is deferred.

### 3.3 FORBIDDEN

| Operation | Why forbidden (evidence) |
| --- | --- |
| Reading supervisor env implicitly | D-9: `Deno.env.toObject()` base leaks everything (AUD §1.4). Envelope carries an explicit allowlisted env; inheritance opt-in per task. |
| Result via bare stdout JSON (unframed) | D-3 stdout hijack (AUD §1.4); sentinel framing exists precisely to separate logs from protocol (O §2 "Isolated messaging") |
| Direct KV outside the task prefix; direct queue mutation of other jobs' state | no analog grants this in any source: BullMQ children touch only their own job via token (B §2); Temporal activities touch only their attempt via task_token (TD1 §7.3) |
| Completing/cancelling **another** execution without its token | capability model (§2.2); `*ById` exists in Temporal but still behind client auth + namespace (TD1 §7.3) |
| Guest-initiated arbitrary reverse eval / host function registration at runtime | Bootsharp fixes the import surface at build time, host assigns pre-boot (F §1.2); wasm-bindgen imports are compile-time (F §2.2); no source allows the guest to grow its own host surface dynamically |
| Progress/heartbeat via unbounded frame flooding | Temporal throttles heartbeats (min of `0.8×heartbeatTimeout` / 30 s default, 60 s max; latest-wins retention, TD1 §3) — supervisor-side coalescing is mandatory before persistence (§5) |
| Blocking the task channel awaiting a loopback response | ordering hazard; LSP ordering rule permits reordering only when correctness is unaffected (L §10). Reads live on loopback so frames stay one-way (T0/T1). |

---

## 4. Minimal citizen API inventory per tier

### T0 — legacy env + framed stdout (emit-only citizenship)

- In: `TASK_ID`, `TASK_PAYLOAD` env (existing, AUD §1.1) + `NETSCRIPT_API_URL`,
  `NETSCRIPT_TASK_TOKEN`, `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` (un-starving D-1/D-2), on an
  **allowlisted env base** (D-9 fix).
- Out (stdout, sentinel-framed lines; anything unframed = plain log): `result`, `progress`, `log`.
- Loopback: full §3.2 surface via HTTP — this is what makes even T0 tasks citizens without any
  protocol upgrade.
- No inbound verbs. Cancellation = signal + grace (D-6 fix), timeout = kill (existing dax).

### T1 — structured envelope, duplex during one execution

Everything in T0, plus:

- In (stdin frames): `cancel {reason}`, `checkpointDetails` (previous attempt's `checkpoint`
  payload rides in the envelope instead — UNVERIFIED which placement wins; RFC decision),
  responses to `extendTimeout`.
- Out: `ping` (heartbeat; reply frame carries `cancelRequested` bit, TD1 §7.3 pattern),
  `extendTimeout {by}` (req/resp with `requestId` + client-side timeout, B §2 mechanics),
  `checkpoint {details}`.
- Envelope declares `protocolTier: 1`, attempt number (D-5 fix), deadline, and the task's granted
  loopback scopes.

### T2 — long-lived duplex worker (pooled, multi-task)

Everything in T1, restated over the oRPC peer frame protocol (`{i,t,p}`, ABORT_SIGNAL for cancel,
EVENT_ITERATOR for progress/log series; O §6), plus:

- `init/initCompleted/initFailed` handshake with the zombie rule (B §2, §6); `start` per task with
  per-attempt token; `shutdown` (drain, LSP two-phase, L §11.6–11.7).
- Capability negotiation at init (LSP model, L §9): worker announces tier, verbs, runtimes;
  supervisor announces available citizen scopes. Unknown optional verbs are ignored; unknown
  required requests error `MethodNotFound`-equivalent (L §6).
- Reverse requests supervisor→worker become possible (e.g. status probe), and citizen *reads* MAY
  optionally ride the peer channel instead of loopback HTTP since a real req/resp substrate now
  exists — but loopback remains the canonical surface so T0/T1/T2 tasks share one API.
- Slot/concurrency reporting (`releaseSlot` analog, TD2 §A.1) — UNVERIFIED need; D-11 (unenforced
  `maxConcurrency`) should be fixed supervisor-side first.

---

## 5. Progress persistence end-to-end (defect D-12)

Today: JS `ctx.reportProgress` → pool callback → `worker.ts:163-169` `console.log`, and foreign
tasks have nothing (AUD §2, D-12). The durable path that progress must join **already exists**:
every `ExecutionRecord` mutation flows through `KvExecutionState.#save` → `#onMutation` hook →
`setMutationHook(createStreamMutationHook())` → durable stream `/workers/executions` → workers SSE
`subscribe` (AUD §1.5, §3).

End-to-end design (all segments evidence-backed):

1. **Guest emits** — polyglot: `progress` frame on stdout (T0/T1) or EVENT_ITERATOR frame (T2);
   JS in-process: existing `ctx.reportProgress` unchanged. Payload after LSP's work-done shape:
   `{percentage?, message?, value?}` (L §8.1) — freeform `value` preserved because BullMQ allows
   arbitrary `JobProgress` (B §2).
2. **Runner demultiplexes** — the framed-stdout reader (D-3's replacement) routes `progress`
   frames to a dispatcher callback instead of the log buffer; exactly BullMQ's parent switch:
   `case Progress: await job.updateProgress(msg.value)` (B §5).
3. **Supervisor coalesces** — Temporal's throttle algorithm verbatim: send-then-suppress, retain
   latest, flush on timer (TD1 §3). Prevents a chatty guest from flooding KV/stream (also the
   D-10 buffer lesson).
4. **Persist via the mutation path** — new `ExecutionState.progress(id, progress)` mutation
   writing `progress` + `progressUpdatedAt` onto the record, so it transits the existing
   validated (`ExecutionRecordSchema.parse`) hook → durable stream with zero new plumbing
   (AUD §1.5). BullMQ precedent: progress is a property of the job record, not a side channel
   (B §8 `JobJson.progress`).
5. **Fan out** — `/workers/executions` durable stream consumers and workers SSE `subscribe` get
   progress for free because they already mirror record mutations (AUD §1.5, §3). The JS-side
   pool callback (`job-runner-pool.ts:46-65`) is rewired to the same `progress()` mutation, so
   Deno and polyglot tasks converge on one sink.
6. **Resume linkage** — `checkpoint` details (distinct verb, §3.1) persist on the record like
   Temporal heartbeat details and are delivered into the next attempt's envelope
   (`GetHeartbeatDetails` = "extracts the heartbeat details from the last failed attempt",
   TD1 §7.2). Progress is UI telemetry; checkpoint is resume state — the corpus keeps them on one
   heartbeat message (Temporal) but LSP separates telemetry (`$/progress`) from state; NetScript
   separates them so T0 can have progress without resume semantics.

---

## 6. Versioning + capability negotiation of the citizen surface

- Tier is declared, not sniffed: the task definition states its tier; the envelope echoes
  `protocolTier` so the guest can assert. Restate versions via content-type
  `application/vnd.restate.invocation.vX` and hard-fails mismatches with 415 (TD2 §C.1) — the
  loopback router should version the same way (contract already namespaced `workers`/`v1`,
  AUD §3).
- Optional verbs follow the LSP `$/` rule (L §6): a supervisor receiving an unknown notification
  verb ignores it; an unknown request verb gets a structured `MethodNotFound` error — this lets
  T1 guests written against a newer minor keep running on older supervisors.
- Capability grants (loopback scopes) are static per task definition in v1 (§3.2); LSP's
  dynamic `client/registerCapability` (L §11.9) is the documented future extension, with its rule
  "must not register the same capability both statically and dynamically" imported verbatim.

---

## 7. STEAL MAPPING — per pillar, per tier

Pillars = the ecosystem seams from AUD §5. Channel column applies the §3 rule.

| Pillar | Channel | T0 | T1 | T2 | Stolen from |
| --- | --- | --- | --- | --- | --- |
| P1 Enqueue (task/job/saga signal) | loopback oRPC | HTTP+token | same | same (peer channel optional) | Temporal SDK-Client separation (TD1 §7.1); Restate `Call`/`OneWayCall` shapes incl. `idempotency_key`, delayed `invoke_time` (TD2 §C.4) for the input schema |
| P2 Scoped KV | loopback oRPC | HTTP+token, prefix-jailed | same | same | Restate per-invocation `state_map`/Get/Set commands as the *shape* (TD2 §C.4); jail rationale §3.3 |
| P3 Durable-stream publish | loopback oRPC | HTTP+token, path allowlist | same | same | producer seam AUD §5; no external analog needed |
| P4 Progress / heartbeat | **task channel** | `progress` frame (emit-only) | + `ping` w/ control-bit reply, `checkpoint`, `extendTimeout` | same as EVENT_ITERATOR / req-resp frames | BullMQ `Progress`→persist (B §5); LSP `$/progress` payloads + token-out-of-band (L §8); Temporal heartbeat reply bits + throttle + details-resume (TD1 §3, §7.3); Hatchet `RefreshTimeout` additive (TD2 §A.4) |
| P5 Status query / async completion | loopback oRPC | HTTP+token | same | same | Temporal `get_async_activity_handle(task_token)` verb set complete/fail/heartbeat/report_cancellation (TD1 §7.1); Restate `AttachInvocation`/`GetInvocationOutput` as the query vocabulary (TD2 §C.4) |
| P6 Own lifecycle (result, cancel, init/shutdown) | **task channel** | `result` frame; kill-based cancel | + `cancel` frame, structured error envelope | + init handshake, drain shutdown, ABORT_SIGNAL | BullMQ Completed/Failed + `errorToJSON` + Cancel→AbortController + zombie rule (B §2–4, §6); LSP shutdown/exit two-phase (L §11.6–11.7); Hatchet `should_not_retry` flag (TD2 §A.2) for D-13's error envelope |
| Transport/framing (cross-pillar) | — | sentinel stdout lines | + stdin duplex | oRPC peer `{i,t,p}` | oRPC stdio `\x00__ORPC__\x00` (O §2–4); peer protocol + symmetric peers (O §5–6) |
| In-process adapters (future wasm/FFI) | direct binding of the same port | — | — | n/a (no frames) | Bootsharp `[Import]`/pre-boot assignment (F §1.2–1.3); explicit lifetime (`Release`/`close`) rules (F §3–4) |

---

## 8. Anti-patterns to avoid (evidence-backed)

1. **Everything-on-the-pipe (BullMQ) without a second channel.** BullMQ multiplexes reads,
   lifecycle, and events over one IPC pipe with hand-rolled `requestId` correlation, a hardcoded
   5 s response timeout, and the documented `err` vs `value` field asymmetry between `Error` and
   `Failed` (B §2 note) — accreted inconsistency from having no principled surface. NetScript has
   an oRPC contract; use it for reads.
2. **Everything-as-journal-command (Restate) without a journal.** Restate's 20+ command
   vocabulary is coherent only because the runtime persists and replays entries with ack tracking
   (TD2 §C.4, §C.6). Adopting `SetStateCommand`-style frames on a non-durable stdout pipe buys
   the complexity without the replay guarantee.
3. **Progress that dies at the edge.** The engine's own D-12 (`console.log` sink, AUD §2) and the
   inverse lesson from BullMQ (parent persists progress into the job record, B §5): a progress
   verb without a persistence path is UI theater. Route through the existing mutation hook (§5).
4. **Unthrottled heartbeat/progress persistence.** Temporal explicitly throttles and coalesces
   with latest-wins (TD1 §3); combined with D-10's unbounded-buffer lesson, never write every
   frame straight to KV + durable stream.
5. **Cancellation only via kill, or only via polling.** D-6: post-spawn abort is ignored today
   (AUD §1.4). Hatchet warns a timed-out task "will be stopped as soon as the worker is able"
   (TD2 §A.4); LSP requires cancelled requests to still respond (L §7). Tiered fix: T0
   signal+grace; T1+ in-band `cancel` with a terminal `result{status:'cancelled'}` — also curing
   D-8's status collapse.
6. **Implicit env as the API surface.** D-9 (AUD §1.4). Every corpus system passes an explicit
   envelope/payload (Temporal `Payloads`, BullMQ `JobJsonSandbox`, Restate `InputCommand`); none
   dumps the supervisor's environment into the guest. Token + URL travel in the envelope, not the
   process env inherited by grandchildren. (Partial UNVERIFIED: whether env vars vs argv vs
   stdin-first-frame is safest for token delivery per-OS — spike question; env is visible via
   `/proc/<pid>/environ` to same-user processes.)
7. **Sniffing results from logs.** D-3 (AUD §1.4) vs the oRPC adapter's sentinel design whose
   entire point is "regular console.log statements without interfering with RPC communication"
   (O §2). Never parse unframed output as protocol.
8. **Binary over the text frame channel.** The stdio adapter corrupts binary frames
   (`TextDecoder` + `.trim()`, O §4). Keep frames JSON-only; big/binary payloads take the
   loopback `artifacts` route.
9. **Letting the guest grow its own host surface.** All FFI systems fix the import surface before
   boot (F §1.2, §2.2); dynamic capability registration in LSP is opt-in, client-gated, and
   forbidden to duplicate static registrations (L §11.9). v1 citizen scopes are static,
   registry-declared.
10. **Unknown-verb hard failure.** LSP's `$/` rule (L §6) and BullMQ's init handshake ignoring
    unknown `cmd` values (B §7 `initChild`) both choose tolerance for notifications; strictness
    only for requests. Encode that asymmetry, or every supervisor upgrade breaks every deployed
    task stub.

---

## Cross-check against the defect register

| Defect | Addressed by |
| --- | --- |
| D-1/D-2 (trace/correlation starvation) | envelope fields mandatory at all tiers (§4 T0) |
| D-3 (stdout hijack) | sentinel-framed `result` verb (§3.1, §8.7) |
| D-5 (attempt) | envelope `attempt` + checkpoint redelivery (§4 T1, §5.6) |
| D-6/D-8 (abort/status) | `cancel` verb + terminal `result{status}` (§8.5) |
| D-9 (env leak) | allowlisted env base; token in envelope (§3.3, §8.6) |
| D-10 (unbounded buffers) | frames replace log-scraping; artifacts route; throttle (§8.4, §8.8) |
| D-12 (progress) | end-to-end path §5 |
| D-13 (exit-code-only success) | structured ok/error result envelope + `should_not_retry`-style flag (§7 P6) |
