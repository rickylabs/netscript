# RFC-5 Source Analysis — Group `celery-bullmq`

Analyst: reverse-engineering pass over the raw extracts
`celery-bullmq-raw-01-celery.md` (C1–C3) and `celery-bullmq-raw-02-bullmq.md` (B1–B14),
both under `.llm/tmp/docs/`. Every claim cites an extract anchor; anything the extracts do
not prove is marked **UNVERIFIED**. Analysis is against the current NetScript polyglot
engine (env `TASK_ID`+`TASK_PAYLOAD` in, last-JSON-line-of-stdout out, no
progress/cancel/heartbeat/attempt, `error: string|null` + `exitCode`, queue path drops
`TRACEPARENT`/`CORRELATION_ID` = bug D-4).

The two systems are complementary halves of exactly the RFC-5 problem:

- **Celery message protocol v2** (C2) is a *queue-level, language-agnostic* task envelope —
  the interop/versioning/lineage half.
- **BullMQ sandboxed processors** (B1–B14) is a *parent↔child subprocess IPC* protocol —
  the lifecycle/cancellation/progress/error half, i.e. precisely the layer where NetScript's
  polyglot runner currently has a bare `spawn → parse stdout` contract.

---

## 1. Message / verb inventory with wire shapes

### 1.1 Celery task message v2 (C2, "Task messages — Version 2")

One message kind ("execute task") carried on AMQP-style transport with three layers:

| Layer | Fields | Purpose |
|---|---|---|
| `properties` | `correlation_id` (uuid task_id), `content_type` (mimetype), `content_encoding`, optional `reply_to` | transport/serialization metadata |
| `headers` | `lang`, `task`, `id`, `root_id`, `parent_id`, `group`; optional `meth`, `shadow`, `eta`, `expires`, `retries`, `timelimit (soft, hard)`, `argsrepr`, `kwargsrepr`, `origin`, `replaced_task_nesting`, `compression` | routing + lifecycle metadata, inspectable **without decoding the body** |
| `body` | `(args, kwargs, embed{callbacks, errbacks, chain, chord})` — explicitly "only for language specific data" (Python tuple-JSON; "Java/C, etc. can use a Thrift/protobuf document as the body") | the payload proper |

Wire example (C2 "Version 2 — Example"): body is `json.dumps((args, kwargs, None))`,
headers carry `lang`/`task`/`argsrepr`/`kwargsrepr`/`origin`, properties carry
`correlation_id` + `content_type: application/json` + `content_encoding: utf-8`.

Serialization is negotiated by `content_type` MIME (C2 "Task Serialization"): `json`,
`yaml`, `pickle` (`application/x-python-serialize`), `msgpack`.

### 1.2 Celery event messages (C2, "Event Messages")

A second, separate message family for observability. "Always JSON serialized"; body is
one mapping or a **list of mappings (multiple events)** since 4.0 (batching). Mandatory
fields: `type` ("*category* and *action* separated by a dash", e.g. `task-succeeded`),
`hostname`, `clock` ("logical clock value … Lamport time-stamp"), `timestamp` (UNIX),
`utcoffset`, `pid`. Example `task-succeeded` body adds `uuid`, `retval`, `runtime`
(routing key `task.succeeded` on exchange `celeryev`, `delivery_mode: 1` i.e.
non-persistent — events are cheap and lossy by design).

### 1.3 BullMQ child→parent verbs (B1, B3, B4)

Envelope (B3): `{ cmd: ParentCommand; requestId?: string; value?: any; err?: Record<string,any> }`.
The `cmd` is a **numeric TypeScript enum ordinal on the wire** (B1 note: "The wire carries
the **integer**, not the name").

| Verb | Wire shape (B4 table) | Kind |
|---|---|---|
| `InitCompleted` | `{cmd}` | handshake ack |
| `InitFailed` | `{cmd, err: errorToJSON(err)}` | handshake nack |
| `Completed` | `{cmd, value: result ?? null}` | terminal |
| `Failed` | `{cmd, value: errorToJSON(err)}` | terminal (note: error under `value`!) |
| `Error` | `{cmd, err: errorToJSON(...)}` | protocol violation (e.g. "cannot start a not idling child process") |
| `Progress` | `{cmd, value: progress}` | fire-and-forget observability |
| `Log` | `{cmd, value: row}` | fire-and-forget observability |
| `Update` | `{cmd, value: data}` | fire-and-forget job-data mutation |
| `MoveToDelayed` / `MoveToWait` | `{cmd, value:{timestamp?, token}}` | lifecycle self-transition |
| `MoveToWaitingChildren`, `GetChildrenValues`, `GetIgnoredChildrenFailures`, `GetDependenciesCount`, `GetDependencies` | `{requestId, cmd, value?}` | request/response RPC child→parent |

### 1.4 BullMQ parent→child verbs (B2, B7, B9)

No declared interface (B3 note); observed shapes:
`{cmd: Init, value: processFile}`, `{cmd: Start, job: JobJsonSandbox, token?}`,
`{cmd: Cancel, value: signal.reason}`, `{cmd: Stop}` (handled as no-op in the B5 switch),
`{requestId, cmd: <X>Response, value}` for the five RPC replies.

### 1.5 BullMQ job payload crossing the boundary (B13)

`JobJsonSandbox = JobJson & {queueName, queueQualifiedName, prefix}` where `JobJson`
includes `id, name, data (string!), opts, progress, attemptsMade, attemptsStarted,
finishedOn?, processedOn?, timestamp, delay?, priority?, failedReason, stacktrace?,
returnvalue (string!), parent?, repeatJobKey?, debounceId?, deduplicationId?,
deferredFailure?, processedBy?, stalledCounter`. `data`/`returnvalue` are JSON-encoded
strings on the wire; `wrapJob` re-parses them (B4) — double-encoding so the envelope stays
schema-stable while the payload stays opaque.

**Contrast with NetScript today:** the polyglot task gets exactly two of these
(`TASK_ID` ≈ `id`, `TASK_PAYLOAD` ≈ `data`) and can say exactly one thing back
(`Completed`-or-`Failed`, fused into the last stdout JSON line). Every other verb row
above is a citizenship gap.

---

## 2. Lifecycle state machine as actually implemented

### 2.1 Celery task states (C3, verbatim vocabulary)

Constants: `PENDING, RECEIVED, STARTED, SUCCESS, FAILURE, REVOKED, REJECTED, RETRY, IGNORED`
(`RECEIVED` and `REJECTED` "only used in events"; `STARTED` gated by
`task_track_started`). The machine is expressed as **sets + precedence**, not as a
transition table:

- `READY_STATES = {SUCCESS, FAILURE, REVOKED}` — result exists.
- `UNREADY_STATES = {PENDING, RECEIVED, STARTED, REJECTED, RETRY}`.
- `EXCEPTION_STATES = {RETRY, FAILURE, REVOKED}`; `PROPAGATE_STATES = {FAILURE, REVOKED}` —
  i.e. **RETRY is an exception state that does not propagate**: retryable vs terminal is a
  set membership, not a boolean flag.
- `PRECEDENCE = [SUCCESS, FAILURE, None, REVOKED, STARTED, RECEIVED, REJECTED, RETRY, PENDING]`
  with `None` as the slot for *unknown/custom* states; the `state` str-subclass compares by
  precedence ("Any custom state is considered to be lower than FAILURE and SUCCESS, but
  higher than any of the other built-in states" — the doc example is literally a custom
  `'PROGRESS'` state). Precedence resolves out-of-order event arrival: a later-observed
  lower-precedence state cannot overwrite a terminal one.
- Extract-noted drift: `ALL_STATES` omits `REJECTED`/`IGNORED` even though the constants
  exist (C3 trailing note).

Notable: `PENDING` means "state is unknown (assumed pending since you know the id)" —
Celery deliberately makes *absence of information* a first-class state.

### 2.2 BullMQ child status machine (B4, B5, B7, B8)

Child-side: `ChildStatus { Idle, Started, Terminating, Errored }`.

```
(spawned) --Init--> [import processor]
    ok  → Idle,  send InitCompleted
    err → Errored, send InitFailed, process.exit(≥1)   // "zombie" prevention, B4 comment
Idle --Start(job, token)--> Started
Started --processor resolves--> send Completed → Idle   (finally: clear promise+abortController)
Started --processor rejects---> send Failed    → Idle
Started --Cancel--------------> abortController.abort(reason)  (state change only via processor outcome)
any   --SIGTERM/SIGINT--------> Terminating → await currentJobPromise → process.exit(exitCode||0)
any   --uncaughtException-----> send Failed → process.exit()  // "potentially undetermined state"
Start while ≠Idle             → send Error("cannot start a not idling child process")
```

Parent-side lifecycle (B7–B9): `retain` (pop warm child from free-list keyed by
`processFile`, else fork + `Init` handshake) → `Start` → await
`Completed`/`Failed`/`Error`/**process `exit` event** (out-of-band failure:
`'Unexpected exit code: N signal: S'`) → in `finally`, release back to the pool **only if
`exitCode === null && signalCode === null`** (a dead child is never pooled). Init failures
in `retain` are SIGKILLed and never released ("must never be released back into the free
pool, otherwise it becomes a 'zombie' that is reused for every subsequent job and fails
them instantly", B8 comment).

Two hard-won invariants are encoded here that NetScript's one-shot spawn does not yet
need but will the moment runners become reusable: (1) **init failure must be terminal for
the runner instance**, and (2) **a runner is only reusable if it verifiably did not die**.

---

## 3. Heartbeat / cancellation / deadline mechanics

### 3.1 Cancellation

- **BullMQ** (B7, B4): cooperative, message-based. Parent listens on the caller's
  `AbortSignal`; on abort it sends `{cmd: Cancel, value: signal.reason}` (try/caught —
  "Child process may have already exited"). If the signal was *already* aborted the
  handler fires immediately. Child maps this onto a per-job `AbortController` created at
  `Start`; the processor receives `(job, token, signal)` and cooperates. Cancellation
  carries a **reason** end-to-end. Forced termination is a separate, escalating path:
  `kill(child, 'SIGTERM'|'SIGKILL')` with `CHILD_KILL_TIMEOUT = 30_000` — SIGTERM first,
  timer escalates to SIGKILL if the child has not exited (B8, B9). So there are three
  distinct rungs: cooperative abort message → SIGTERM graceful drain
  (`waitForCurrentJobAndExit`) → SIGKILL.
- **Celery** (C3): `REVOKED` is a first-class terminal state in `READY_STATES` and
  `PROPAGATE_STATES` — revocation is representable in the state vocabulary. The *mechanics*
  of revoke delivery (broadcast/remote control) are **not in the extracts — UNVERIFIED**.

### 3.2 Heartbeat / liveness

- **BullMQ IPC**: there is **no heartbeat verb** in the child protocol (B1/B2 enums are
  exhaustive). Liveness is inferred from two side channels: (a) the transport's `exit` /
  `close` events (B7 exitHandler, B9 onCloseHandler), and (b) — per the B14 prose —
  Redis-side job locks that the *parent* worker extends; the whole point of sandboxing is
  that CPU-bound work "prevents BullMQ from doing job bookkeeping such as extending job
  locks, ultimately leading to 'stalled' jobs". The `stalledCounter` field in `JobJson`
  (B13) shows stall recovery is tracked per job. Lock TTLs/extension intervals are
  **UNVERIFIED** (not in extracts).
- **Celery**: task protocol has no heartbeat; the event stream's mandatory
  `timestamp`+`clock`+`hostname`+`pid` fields (C2) give an ordered liveness trace.
  Worker-level heartbeat events exist in Celery generally but are **UNVERIFIED** here
  (not in the extracts).

Lesson for NetScript: neither system makes the *task code* heartbeat. Liveness is owned by
the **runner/parent layer** (process exit events, lock extension), and the protocol only
needs enough (progress/log/state events with timestamps) for the parent to do that job.

### 3.3 Deadlines

- **Celery** (C2): declarative, in headers, set by the *producer*:
  `timelimit: (soft, hard)` — "tuple of hard and soft time limit value (int/float or None
  for no limit)", example `(3.0, 10.0)`; plus `expires` (ISO 8601) — "The message will be
  expired when the message is received and the expiration date has been exceeded" (expiry
  checked at receive time, not by the broker); plus `eta` for not-before scheduling. The
  soft/hard split implies a two-stage enforcement (warn/raise, then kill) — enforcement
  mechanics are **UNVERIFIED** in the extracts, but the *wire representation* is fully
  specified.
- **BullMQ**: no job deadline in the IPC protocol. The only timeouts in the extracts are
  protocol-internal: `RESPONSE_TIMEOUT = 5_000` (500 in test) for child→parent RPC
  (`waitResponse` rejects `TimeoutError: <cmd> timed out`, B4) and the 30 s kill
  escalation (B8). `opts` may carry more but that is **UNVERIFIED**.

---

## 4. Error taxonomy — retryable vs terminal representation

### 4.1 Celery: taxonomy by state sets (C3)

Retryable vs terminal is **not an error attribute — it is a state**: `RETRY` ∈
`EXCEPTION_STATES` but ∉ `PROPAGATE_STATES`; `FAILURE`/`REVOKED` are in both. `retries`
(current attempt count) travels in the task headers (C2), so the worker knows attempt
number without any store lookup. Error *payload* shape (tracebacks etc.) is **UNVERIFIED**
(result-backend format not in extracts). Distinct nuance: `REJECTED` (worker refused, an
event-only state) is separate from `FAILURE` (task ran and raised), and `REVOKED`
(externally cancelled) is its own terminal — three different "did not succeed" causes that
NetScript currently collapses into `success:false` + a string.

### 4.2 BullMQ: taxonomy by verb + structured serialization (B1, B4, B10, B7)

Four distinct failure verbs, distinguishing *what layer* failed:

| Verb / channel | Meaning |
|---|---|
| `InitFailed` | the runner could not even load the processor (terminal for the child process — it `process.exit`s) |
| `Failed` | the job's processor rejected / `uncaughtException` (job-level failure; child returns to Idle in the normal case, exits in the uncaught case) |
| `Error` | protocol misuse (Start while not Idle) — an infrastructure error, not a job result |
| transport `exit` event | out-of-band death → `'Unexpected exit code: N signal: S'`, with a **human-readable exit-code vocabulary** (`exitCodesErrors` map, B9: 1 = 'Uncaught Fatal Exception', 13 = 'Unfinished Top-Level Await', …; `code > 128` normalized by subtracting 128 for signal deaths) |

Serialization (B10 `errorToJSON`): copies **all own properties** of the error
(`Object.getOwnPropertyNames` — so `message`, `stack`, `name`-if-own, plus any custom
fields like `code`) through a circular-reference-safe JSON pass (`'[Circular]'`);
non-Error throwables are normalized via `toString` first. Rehydration (B7): fresh
`Error()` + `Object.assign(err, msg.value ?? msg.err)` — custom properties survive the
boundary. Init-failure rehydration is lossier: only `stack` and `message` (B9).

Retryable-vs-terminal is **not represented in the BullMQ IPC layer at all** — the parent
decides retry from `opts`/`attemptsMade` (B13) at the queue layer. What the IPC layer
contributes instead is the *self-transition escape hatch*: a job can declare "I am not
failed, reschedule me" via `MoveToDelayed{timestamp,token}` / `MoveToWait{token}` (B4) —
retry-by-request rather than retry-by-error-classification.

### 4.3 Against NetScript

Current `TaskResult {success:boolean} + error:string|null + exitCode` conflates all four
BullMQ failure layers and all three Celery non-success causes into one boolean+string.
Minimum viable taxonomy stolen from this group: **(a)** structured error object with
preserved custom properties, **(b)** failure *kind* (init vs job vs protocol vs
process-death), **(c)** retryability as an explicit state/verb, not an inference from a
string.

---

## 5. Versioning + capability negotiation

- **Celery** (C2): explicit protocol versioning exists but detection is implicit —
  "Protocol version detected by the presence of a ``task`` message header" (v2) vs all
  fields in body (v1). Field evolution inside v1 was additive with documented
  `versionadded` markers and defaults ("Defaults to 0 if not specified", "Will be an empty
  list if not provided") — tolerant-reader style. Serialization capability is negotiated
  per-message via `content_type`/`content_encoding` (+ optional `compression` header).
  Language capability via the `lang` header: "Worker may redirect the message to a worker
  that supports the language" — capability-based *routing*, not handshake.
- **BullMQ** (B1–B9): **no version field, no capability negotiation** anywhere in the IPC
  protocol. Compatibility is de-facto: numeric enum ordinals must stay stable by
  declaration order; unknown `cmd` values are ignored (`initChild` explicitly filters
  `!Object.values(ParentCommand).includes(msg.cmd)`, B9; the B5 dispatch switch simply
  falls through). That gives accidental forward-tolerance but no way for a child to say
  "I support Progress but not GetDependencies". Works only because parent and child ship
  in the same npm package version — exactly the assumption NetScript's polyglot,
  multi-repo, multi-language runners **cannot** make.
- Conformance tiers: **neither system has them.** The closest analogue is Celery's
  lang-based redirect + BullMQ's silent-ignore. RFC-5's tiered conformance is genuinely
  additive over both sources.

---

## 6. Transport + framing choices, and why

- **Celery**: broker messages (AMQP model: properties/headers/body). The *stated* reason
  for the v2 header move: "workers/intermediates can inspect the message and make
  decisions based on the headers without decoding the payload (that may be language
  specific, for example serialized by the Python specific pickle serializer)" (C2). Body
  framing negotiated by MIME `content_type`; events use a separate exchange
  (`celeryev`), always-JSON, non-persistent `delivery_mode: 1`, and batch bodies (list of
  mappings) — control-plane durability requirements deliberately differ from
  data-plane.
- **BullMQ**: one protocol, **two transport bindings behind a two-function seam**
  (B5/B6/B10): `mainBase(send, receiver)` is transport-free; `main.ts` binds it to Node
  child-process IPC (`childSend(process, msg)` — structured `process.send`, i.e. the
  runtime's own message framing, *not* stdout), `main-worker.ts` binds the same file to
  `worker_threads` `parentPort.postMessage`. `asyncSend` duck-types
  `send()` vs `postMessage()`. Consequence they exploit: **stdout/stderr stay free for
  actual logging** — `parent.stdout?.pipe(process.stdout)` (B9) pipes child stdio through
  verbatim, because the control channel is elsewhere. Framing per se (length-prefix vs
  newline) is delegated to the runtime IPC and never hand-rolled.
- Why this matters for NetScript: the current design **overloads stdout as both log
  stream and result channel** (last-JSON-line hack). BullMQ shows the value of separating
  them; but since NetScript runners are arbitrary languages without Node's `process.send`,
  the portable equivalent is NDJSON on a dedicated stream/fd (stdout-as-protocol +
  stderr-as-logs, or an inherited pipe fd), with the transport hidden behind a
  `(send, receiver)`-shaped seam exactly like B5 so a future socket/HTTP binding reuses
  the same state machine.

---

## 7. STEAL CANDIDATES for the NetScript protocol

Each: what to steal → extract citation → pillar → conformance tier
(0 = must-implement floor, 1 = standard citizen, 2 = full citizen).

1. **Envelope/payload split: metadata in the envelope, body opaque.** Task identity,
   lineage, deadlines, attempt count live in inspectable protocol fields; the payload is
   a language-owned blob (double-encoded string, as BullMQ's `data`). *Cite:* C2 v2
   "Meta-data moved to headers" rationale; B13 `data: string`. *Pillar:* interop.
   *Tier 0.*
2. **`lang` field + language-specific body.** Declare the runner language in the
   envelope so routing/diagnostics never sniff the payload; "Java/C, etc. can use a
   Thrift/protobuf document as the body". *Cite:* C2 "Support for multiple languages via
   the ``lang`` header". *Pillar:* interop. *Tier 0.*
3. **Lineage triple `correlation_id` / `root_id` / `parent_id` (+ `group`).** Celery
   carries workflow lineage in every message; this is the direct fix-shape for bug D-4 —
   `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` become mandatory envelope fields on the
   queue path, not best-effort env vars. *Cite:* C2 "``root_id`` and ``parent_id`` fields
   helps keep track of work-flows"; "``correlation_id`` replaces ``task_id``". *Pillar:*
   observability. *Tier 0.*
4. **Single symmetric message envelope `{type, requestId?, value?, error?}`.** Steal
   BullMQ's envelope shape but repair its asymmetry (§8.2): errors always under one key,
   `type` as a **string** not an ordinal. *Cite:* B3 `ChildMessage`. *Pillar:*
   communication. *Tier 0.*
5. **Structured error objects: own-property copy + circular-safe serialization +
   property-preserving rehydration.** Replaces `error: string|null`; custom fields
   (`code`, domain data) survive the boundary. *Cite:* B10 `errorToJSON` +
   `getCircularReplacer`; B7 `Object.assign(err, msg.value ?? msg.err)`. *Pillar:*
   lifecycle (error mgmt). *Tier 0.*
6. **Failure-kind taxonomy: init vs job vs protocol vs process-death.** Four distinct
   channels (`InitFailed`, `Failed`, `Error`, transport `exit`), plus a human-readable
   exit-code vocabulary and the >128 signal normalization for the death path. *Cite:*
   B1/B4 verb table; B9 `exitCodesErrors`, `code -= 128`. *Pillar:* lifecycle. *Tier 0*
   (job-vs-process split; init-vs-job split is Tier 1 with pooling).
7. **State vocabulary as sets + precedence, with a custom-state slot.** Publish
   `READY/UNREADY/EXCEPTION/PROPAGATE`-style sets so "is it terminal?" and "does it
   propagate?" are set membership; the `None` precedence slot lets adapters add states
   (Celery's own doc example is `'PROGRESS'`) without breaking ordering, and precedence
   makes out-of-order event application safe. *Cite:* C3 `PRECEDENCE`, state-class
   docstring. *Pillar:* lifecycle. *Tier 0* vocabulary, *Tier 1* precedence merge.
8. **Retryable ≠ terminal encoded in state, not string.** `RETRY ∈ EXCEPTION_STATES` but
   `∉ PROPAGATE_STATES`; `REVOKED` distinct from `FAILURE` distinct from `REJECTED`.
   *Cite:* C3 state sets. *Pillar:* lifecycle. *Tier 0.*
9. **Cancellation as a cooperative message carrying a reason, mapped to AbortSignal,
   with an escalation ladder behind it** (abort message → SIGTERM + drain → SIGKILL after
   timeout). NetScript's per-task Deno permissions already prove the parent controls
   spawn; this adds the in-flight control channel. *Cite:* B7 abort wiring; B4
   `cancel(reason)`; B5 SIGTERM→`waitForCurrentJobAndExit`; B8 `CHILD_KILL_TIMEOUT`.
   *Pillar:* lifecycle. *Tier 1* (cooperative receive), escalation ladder engine-side at
   *Tier 0*.
10. **`Progress` and `Log` as fire-and-forget protocol verbs** — closes the polyglot gap
    vs the JS-side `JobContext.reportProgress`; child keeps a local progress copy for
    synchronous read-back. *Cite:* B4 `updateProgress`/`Log` shapes. *Pillar:*
    observability. *Tier 1.*
11. **Event standard-fields contract + batching.** Every emitted event carries
    `type` (category-action string), `timestamp`, origin identity (`hostname`/`pid` ≈
    runner id), and a monotonic/Lamport `clock`; bodies may batch as a list. Maps cleanly
    onto NetScript's oRPC/zod event schemas. *Cite:* C2 "Event Messages". *Pillar:*
    observability. *Tier 1* (fields), *Tier 2* (Lamport clock, batching).
12. **Producer-declared deadlines in the envelope: `timelimit (soft, hard)`, `expires`,
    `eta`.** Soft/hard gives cooperative-then-forced; `expires` gives receive-time
    staleness discard. *Cite:* C2 headers + v1 `timelimit` example `(3.0, 10.0)`.
    *Pillar:* lifecycle. *Tier 1* (`timelimit`), *Tier 2* (`eta`/`expires`).
13. **Attempt telemetry delivered *to* the task**: `retries` in Celery headers;
    `attemptsMade`/`attemptsStarted`/`stalledCounter`/`failedReason`/`stacktrace` in
    BullMQ's job JSON — the task can behave differently on attempt 3 without asking
    anyone. *Cite:* C2 `retries`; B13 `JobJson`. *Pillar:* lifecycle. *Tier 0* (attempt
    number), *Tier 1* (prior-failure info).
14. **Init handshake for long-lived runners + zombie invariants.** `Init` →
    `InitCompleted`/`InitFailed`; failed-init child self-exits *and* the parent kills it
    and never pools it; pool release is gated on "verifiably still alive"
    (`exitCode === null && signalCode === null`); warm reuse keyed by processor identity.
    This is the upgrade path from one-shot spawn to pooled polyglot runners. *Cite:* B4
    `init()` comment, B8 `retain` comment, B7 release gate. *Pillar:* lifecycle +
    communication. *Tier 2.*
15. **Request/response sub-protocol: `requestId` correlation + per-request timeout.**
    Lets polyglot tasks *ask* the engine things (children values, KV lookups, config)
    over the same channel; every pending request has a bounded wait
    (`RESPONSE_TIMEOUT`, named-cmd timeout errors). *Cite:* B4 `waitResponse` +
    request-id generation. *Pillar:* communication. *Tier 2.*
16. **Task self-transitions as verbs** (`MoveToDelayed{timestamp}`, `MoveToWait`) — a
    task can yield "reschedule me later" as a first-class outcome distinct from success
    and failure. *Cite:* B4 verb table. *Pillar:* lifecycle. *Tier 2.*
17. **Transport-agnostic core behind a `(send, receiver)` seam.** The same dispatch state
    machine binds to process-IPC and worker-threads with two 5-line files; NetScript
    should keep the protocol state machine independent of stdio-NDJSON vs future
    socket/HTTP bindings the same way. *Cite:* B5/B6/B10. *Pillar:* communication.
    *Tier 0 design constraint* on the spec (transport bindings are profiles).
18. **Keep control channel and log stream separate** — child stdout/stderr piped through
    verbatim because protocol traffic rides a different channel; NetScript's
    last-JSON-line-of-stdout convention should become "stdout (or dedicated fd) = NDJSON
    protocol frames, stderr = human logs" at minimum. *Cite:* B9
    `parent.stdout?.pipe(...)`; B14 sandboxing rationale. *Pillar:* communication +
    observability. *Tier 0.*
19. **`shadow` / display-name field** for logs and monitors when the task name is generic
    (NetScript analogue: one generic `python-runner` task displaying per-script names).
    *Cite:* C2 `shadow`. *Pillar:* observability. *Tier 2.*
20. **`origin` (producing node) on every message** — cheap provenance for debugging
    multi-node queues. *Cite:* C2 `origin`. *Pillar:* observability. *Tier 1.*

---

## 8. Anti-patterns to avoid

1. **Numeric enum ordinals on the wire.** BullMQ serializes `cmd` as the TS enum integer
   (B1 note); meaning depends on declaration order, is unreadable in captures, and is
   hostile to non-TS implementers — fatal for a polyglot spec. Use string type tags.
2. **Inconsistent error key.** `Failed` carries the error under `value` while
   `InitFailed`/`Error` use `err` (B4 note "asymmetry preserved in the source"); the
   parent must read `msg.value ?? msg.err` "so the failure reason is never lost" (B7
   comment) — a permanent tax bought by an early inconsistency. One error key, in the
   schema, from day one.
3. **Lossy special-case rehydration.** `InitFailed` keeps only `stack`+`message` (B9)
   while `Failed` keeps all own properties — two error fidelities in one protocol.
4. **Implicit version detection by field presence.** Celery v2 is "detected by the
   presence of a ``task`` message header" (C2) — undocumentable sniffing that RFC-5's
   explicit version field supersedes. Ship `protocolVersion` explicitly.
5. **Silent-ignore of unknown commands as the only compat story.** BullMQ drops unknown
   `cmd`s (B9 filter; B5 switch fall-through) with no way to discover peer capabilities.
   Tolerant reading: yes; but pair it with declared capabilities/tier so silence is a
   choice, not ignorance.
6. **Swallowed dispatcher errors.** `catch (err) { console.error('Error handling child
   message'); }` (B5) discards the error object entirely — a protocol layer must surface
   its own faults as structured events.
7. **Language-specific serializers as first-class citizens.** `pickle`
   (`application/x-python-serialize`, C2) inside an interop protocol undermines the
   header-inspection rationale and is a deserialization attack surface. NetScript:
   JSON-only at Tier 0; anything else behind explicit negotiated content-type.
8. **Vocabulary drift between constants and sets.** `REJECTED`/`IGNORED` exist as states
   but are missing from `ALL_STATES` (C3 extract note). Generate state sets from one
   source of truth (zod enum) so the spec cannot drift from the implementation.
9. **`Math.random()` request ids** (B4). Fine within one child's 5 s RPC window, wrong
   for a spec: collisions and cross-runner ambiguity. Use UUIDs/monotonic ids and say so
   normatively.
10. **repr-based debug fields.** `argsrepr`/`kwargsrepr` (C2) leak payload contents into
    metadata in a language-specific format; prefer size-bounded, explicitly opt-in
    display fields (`shadow`-style) over automatic payload reprs.
11. **Control data on the log stream** — NetScript's own current anti-pattern, thrown
    into relief by B9's stdout piping: any library print corrupts the "last JSON line"
    result channel. The extracts show both systems keep protocol and logs on separate
    channels.
12. **Dead-child reuse (zombies).** Any future runner pool must copy BullMQ's two
    invariants (B8 retain comment, B7 release gate): kill-don't-pool on init failure, and
    verify liveness before release — learned there via production bugs; NetScript gets it
    for free by specifying it.

---

## Cross-cutting note for the RFC

Celery contributes the **envelope** (identity, lineage, lang, deadlines, states,
versioned metadata) and BullMQ contributes the **conversation** (handshake, start/cancel,
progress/log, structured errors, RPC, graceful drain) — RFC-5's single versioned protocol
is essentially: Celery-v2-shaped envelope fields carried on BullMQ-shaped
message verbs, over an NDJSON transport binding, with the explicit versioning and
capability tiers that *both* systems lack.
