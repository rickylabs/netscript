# RFC-5 analysis — group `temporal-durable` (Temporal, Hatchet, Inngest, Restate)

Analyst pass over:

- `/home/user/netscript/.llm/tmp/docs/temporal-durable-raw-01-temporal.md` ("T-extract")
- `/home/user/netscript/.llm/tmp/docs/temporal-durable-raw-02-hatchet-inngest-restate.md` ("HIR-extract")

Analyzed against the current NetScript polyglot engine: env `TASK_ID` + `TASK_PAYLOAD` in, last
JSON stdout line parsed as `TaskResult {success:boolean}+bag` out; queue path drops
`TRACEPARENT`/`CORRELATION_ID` (bug D-4); no progress/cancel/heartbeat/attempt; `error:
string|null` + `exitCode` only; one-shot spawn; JS-side `JobContext` already has
correlationId/traceparent/tracestate/reportProgress — the citizenship gap is polyglot-only.

Anything not directly quotable from the extracts is marked UNVERIFIED.

---

## 1. Message / verb inventory with wire shapes

### 1.1 Temporal — unary gRPC verbs keyed by an opaque task token

(T-extract §7.3, `workflowservice/v1/request_response.proto`.)

| Verb | Direction | Key fields |
| --- | --- | --- |
| `PollActivityTaskQueue` | worker → server, long-poll | req: `namespace`, `task_queue`, `identity`, `worker_instance_key`, deployment options. resp: `task_token` (bytes), `activity_id`, `activity_type`, `header` (map<string,Payload>), `input` (Payloads), **`heartbeat_details`** (Payloads — checkpoint from prior attempt), `scheduled_time`, `current_attempt_scheduled_time`, `started_time`, **`attempt` (int32)**, all three timeouts as Durations, `retry_policy`, `priority`, `activity_run_id` |
| `RecordActivityTaskHeartbeat` (+`ById`) | worker → server, unary | req: `task_token`, `details` (Payloads), `identity`. resp: **`cancel_requested`, `activity_paused`, `activity_reset`** (bools) |
| `RespondActivityTaskCompleted` (+`ById`) | worker → server | `task_token`, `result` (Payloads), `identity` |
| `RespondActivityTaskFailed` (+`ById`) | worker → server | `task_token`, `failure` (structured `Failure`), `identity`, **`last_heartbeat_details`** |
| `RespondActivityTaskCanceled` (+`ById`) | worker → server | `task_token`, `details` (Payloads) |

Every user datum crosses as `Payload { map<string,bytes> metadata; bytes data }` /
`Payloads { repeated Payload }` (T-extract §6.2) — never a language type. Metadata carries an
`encoding` key with values like `json/plain`, `binary/plain`, `binary/null`, `json/protobuf`,
`binary/protobuf` (T-extract §6.3). `Header` and `Memo` are `map<string, Payload>` (§6.2) —
the header map is how per-invocation context (e.g. trace propagation) rides beside the input.

Async completion detaches identity from the connection: a captured `task_token` (or the tuple
Namespace+WorkflowId+ActivityId) lets an *external* process later call
`complete()/fail()/heartbeat()/report_cancellation()` (T-extract §7.1).

### 1.2 Hatchet — one server-push gRPC stream + unary event reports

(HIR-extract §A.1–A.2, `dispatcher.proto`.)

| Verb | Direction | Shape |
| --- | --- | --- |
| `Register` | worker → server, unary | `worker_name`, **`actions` (repeated string — declared capabilities)**, `slots` (local concurrency), `labels`, `runtime_info` |
| `Listen` / `ListenV2` | server → worker, **stream** | `AssignedAction`: tenant/workflow/job/task ids, `action_id`, **`action_type` enum: `START_STEP_RUN`, `CANCEL_STEP_RUN`, `START_GET_GROUP_KEY`, `START_BATCH`**, `action_payload` (string), **`retry_count`**, `additional_metadata`, priority, parent/child/batch fields |
| `Heartbeat` | worker → server, unary | `worker_id`, `heartbeat_at` — worker-level liveness only, no payload |
| `SendStepActionEvent` | worker → server, unary | ids + `event_timestamp`, **`event_type` enum: `STARTED`, `COMPLETED`, `FAILED`, `ACKNOWLEDGED`, `CANCELLED`**, `event_payload` (string), `retry_count`, **`should_not_retry`** |
| `RefreshTimeout` | worker → server | `task_run_external_id`, `increment_timeout_by` (duration string) — additive deadline extension |
| `ReleaseSlot` | worker → server | frees a concurrency slot mid-task |
| `Unsubscribe`, `UpsertWorkerLabels`, `GetVersion`, `PutOverridesData` | worker → server | lifecycle / metadata utilities |

Cancellation is an **`AssignedAction` with `action_type = CANCEL_STEP_RUN` on the same
delivery stream** (HIR-extract §A.2 note), not a heartbeat-reply bit.

### 1.3 Inngest — pure HTTP callback, three endpoints

(HIR-extract §B.)

| Verb | Shape |
| --- | --- |
| Sync/registration | SDK `POST`s config to `/fn/register`: `{ appName, sdk: "inngest-js:v1.0.0", v, functions: [{id, triggers, steps, concurrency, rateLimit, debounce}] }` (§B.5) |
| Call Request | executor `POST`s to SDK URL `?fnId=...` with `{ event(s), steps: {hash: {data|error}}, ctx: { run_id, attempt, stack, ... } }` (§B.3) |
| Introspection | `GET` — function count, **capability flags**, schema-versioned, signed or unsigned (§B.1) |

Response protocol is status-code multiplexed (§B.4): `200` = final return value; `206 Partial
Content` = array of step opcodes `{id: sha1, op: StepRun|StepPlanned|StepError|Sleep|
WaitForEvent|InvokeFunction|AiGateway|Gateway, opts}`; `400/500` + JSON
`{name, message, stack}` = error, with retryability in headers (`X-Inngest-No-Retry`,
`Retry-After`).

### 1.4 Restate — length-prefixed message stream over one HTTP POST

(HIR-extract §C.)

Invocation: `POST /invoke/{serviceName}/{handlerName}`; content-type
`application/vnd.restate.invocation.vX` carries the protocol version (§C.1). v5+ vocabulary
(§C.3–C.4) splits into three families:

- **Core frames** (0x0000+): `StartMessage` (invocation id, `known_entries`, eager `state_map`,
  `retry_count_since_last_stored_entry`, `random_seed`, `idempotency_key`),
  `SuspensionMessage`, `ErrorMessage` (`code`, `message`, `stacktrace`,
  `related_command_index/name/type`, `next_retry_delay`, `ErrorBehavior`), `EndMessage`,
  `CommandAckMessage`, `ProposeRunCompletionMessage`(+Ack), `AwaitingOnMessage`.
- **Commands** (0x0400+, SDK → runtime intents): input/output, get/set/clear state, promises,
  `SleepCommandMessage`, `CallCommandMessage` / `OneWayCallCommandMessage` (with headers,
  idempotency key), `RunCommandMessage`, attach/get-invocation-output, awakeables,
  `SendSignalCommandMessage`.
- **CompletionNotifications** (0x8000+, runtime → SDK results) paired to commands by
  `completion_id`, each a oneof `Void | Value | Failure`; plus `SignalNotificationMessage`
  (0xFBFF).

Custom/extension entries use type codes `>= 0xFC00` (§C.2).

---

## 2. Lifecycle state machine as actually implemented

### 2.1 Temporal activity attempt

From T-extract §1, §2, §7:

```
Scheduled --(worker long-polls, wins task)--> Started(attempt N)
Started --RespondActivityTaskCompleted--> Completed  (event in workflow history)
Started --RespondActivityTaskFailed(Failure, last_heartbeat_details)--> Failed
        --(retry policy permits)--> Scheduled(attempt N+1, heartbeat_details replayed)
Started --heartbeat resp cancel_requested + RespondActivityTaskCanceled--> Canceled
Started --StartToClose breach / Heartbeat breach--> TimedOut --> retry per policy
Scheduled --ScheduleToStart breach--> TimedOut (non-retryable by design)
any --ScheduleToClose breach--> TimedOut (terminal across all attempts)
Started --raise_complete_async--> DetachedPending --(external handle complete/fail)--> terminal
```

Key implementation facts: attempts are numbered and the worker is told its attempt number
(`attempt` field in the poll response); each retry "start[s] from the initial state, unless
your code uses Heartbeat details payloads for checkpointing" (T-extract §1); the paused/reset
states also exist and are delivered as heartbeat-response bits (§7.3).

### 2.2 Hatchet step run

From HIR-extract §A.2 event enums (the state machine is expressed *as the event vocabulary*
the worker reports): assigned → `ACKNOWLEDGED` → `STARTED` → `COMPLETED` | `FAILED`
(`should_not_retry` optional) | `CANCELLED`. Server-side scheduling timeout cancels tasks that
wait > 5 min in queue; execution timeout marks running tasks failed after 60 s default
(§A.4). Quoted caveat: "A timed out task does not guarantee that the task will be stopped
immediately" — server-side state can lead worker-side reality.

### 2.3 Inngest run

Function-level state machine is externalized into the request/response cycle (§B.3–B.4): each
step boundary terminates the HTTP exchange; the executor re-invokes the whole function with
the memoized `steps` map and the SDK short-circuits completed steps. States per request:
respond 200 (done), 206 (new step ops → executor persists, schedules next call), 4xx/5xx
(failed this attempt; `ctx.attempt` counts).

### 2.4 Restate invocation

Explicit two-phase machine (§C.6): **Replaying** (runtime streams stored journal; runtime is
source-of-truth) → **Processing** (SDK becomes journal source-of-truth, emits new
commands). The stream MUST terminate with exactly one of `SuspensionMessage` (pause, resume
later when an awaited completion arrives), `ErrorMessage` (transient failure → runtime
retries reusing the journal), or `EndMessage` (done). "An implicit close without a terminal
message is treated as an unknown failure." Terminal *application* failure is not
`ErrorMessage` but an `OutputCommandMessage` carrying the `Failure` variant — the
transient/terminal split is structural, encoded in *which message type* ends the stream.

---

## 3. Heartbeat / cancellation / deadline mechanics

### 3.1 Heartbeats

- **Temporal**: per-task heartbeat RPC carrying arbitrary `details` Payloads; three distinct
  jobs multiplexed onto it: (a) liveness against `heartbeatTimeout`; (b) checkpointing —
  details of the last failed attempt are handed to the next attempt via
  `GetHeartbeatDetails` / poll-response `heartbeat_details` (T-extract §3, §7.2–7.3); (c) the
  **response carries server → worker control** (`cancel_requested`, `activity_paused`,
  `activity_reset`). Client-side throttle: min(`heartbeatTimeout * 0.8` or default 30 s,
  max 60 s); the worker suppresses intermediate heartbeats but retains and resends the
  latest (§3).
- **Hatchet**: worker-level unary heartbeat with just `worker_id` + timestamp, "not per-task
  progress; carries no details payload" (§A.2); secondary source says every 4 s on V2
  (marked secondary in the extract — treat as UNVERIFIED cadence).
- **Inngest**: none — liveness is the HTTP request lifetime (§D ledger).
- **Restate**: no heartbeat verb; per-entry `CommandAckMessage`/`EntryAckMessage` plus
  `AwaitingOnMessage` serve as progress/durability signals (§D ledger, §C.4).

### 3.2 Cancellation delivery

Three distinct patterns in one group:

1. **Piggyback on heartbeat reply** (Temporal): "Activities that don't Heartbeat can't receive
   a Cancellation" (T-extract §3). Cost: cancellation latency = heartbeat interval; benefit:
   zero extra channel, works over unary RPC.
2. **Same-stream control action** (Hatchet): `CANCEL_STEP_RUN` arrives as an `AssignedAction`
   on the existing `ListenV2` stream (§A.2). Immediate, but requires a persistent stream.
3. **Not in extracted material** for Inngest and Restate legacy doc (§D notes both as "not in
   the extracted spec/material"). Restate v5+ has `SendSignalCommandMessage` /
   `SignalNotificationMessage` which look signal-capable, but the extract does not state that
   cancellation uses them — UNVERIFIED.

### 3.3 Deadlines

- Temporal's four-timeout decomposition (T-extract §2) is the most precise vocabulary in the
  group: Schedule-To-Start (queue latency detector, non-retryable by design), Start-To-Close
  (per-attempt), Schedule-To-Close (across all retries), Heartbeat (liveness granularity).
  "At least one of Start-To-Close or Schedule-To-Close must be set." The worker is *told* its
  timeouts and computed `Deadline` in `ActivityInfo` (§7.2), so task code can budget itself.
- Hatchet: two timeouts (scheduling 5 min, execution 60 s defaults) plus **worker-initiated
  additive extension** via `RefreshTimeout("15s")` (§A.4) — the only system in the group where
  the running task can push its own deadline out.
- Inngest: `Retry-After` header lets the *failing* side dictate the next-attempt delay (§B.4);
  Temporal's `next_retry_delay` on `ApplicationFailure` (T-extract §5) and Restate's
  `next_retry_delay` on `ErrorMessage` (§C.4) are the same idea in-body.

---

## 4. Error taxonomy — retryable vs terminal representation

Four different encodings of the same distinction:

| System | Mechanism | Where it lives |
| --- | --- | --- |
| Temporal | `ApplicationFailure.non_retryable` bool (default false) + retry-policy `non_retryable_error_types` matched against `ApplicationFailure.type` string; `next_retry_delay` override | structured `Failure` message: `message`, `stack_trace`, `source` (SDK origin), nested `cause` chain, `details` payload (T-extract §5) |
| Hatchet | `should_not_retry` optional bool on the `FAILED` `StepActionEvent` (SDK `NonRetryableError` maps to it) | flat event field (HIR §A.2) |
| Inngest | HTTP status + `X-Inngest-No-Retry: true|false` header; `Retry-After` implies retryable | body `{name, message, stack}` (HIR §B.4) |
| Restate v5+ | *which terminal message*: `ErrorMessage` (transient → runtime retries, with `code`, `next_retry_delay`, `ErrorBehavior`, and blame pointers `related_command_index/name/type`) vs `OutputCommandMessage{failure}` (terminal application failure) (HIR §C.4, §C.6) | structural |

Shared invariants worth extracting:

- **Errors are structured objects, never bare strings**: every system carries at minimum
  name/type + message + optional stack; Temporal adds a `cause` chain and machine-matchable
  `type`; Temporal's Go SDK auto-wraps plain errors into `ApplicationError` (T-extract §5) —
  i.e., the *protocol* guarantees structure even when user code is lazy.
- **Retryability defaults to true** everywhere; terminality is the explicit opt-in
  (`non_retryable=false` default; Hatchet/Inngest flags are opt-in).
- **The failing side may propose the retry delay** (three of four systems).
- Temporal's `TimeoutFailure` attaches the **last heartbeat details** so the failure object
  itself carries the resume checkpoint (T-extract §5), and `RespondActivityTaskFailed`
  carries `last_heartbeat_details` alongside the `Failure` (§7.3).

---

## 5. Versioning + capability negotiation

- **Restate** is the most rigorous: protocol version in the content-type
  (`application/vnd.restate.invocation.vX`); "The SDK MUST return back the same content-type";
  `415` for unsupported versions; an explicit `ServiceProtocolVersion` enum with **yanked
  versions (V3, V4)** — versions can be recalled (HIR §C.1, §C.3). Discovery endpoint
  negotiates the *manifest* schema version separately via `Accept` /
  response `content-type` (§C.1). Extension space is reserved by type-code range
  (`>= 0xFC00` custom entries) with a standard `REQUIRES_ACK` flag (§C.2).
- **Inngest**: SDK self-identifies in every exchange (`X-Inngest-Sdk: inngest-js:v1.2.3`);
  request/response protocol version header `X-Inngest-Req-Version: 2`; introspection endpoint
  returns **capability flags** with its own schema versioning; sync payload carries a spec
  version `"v": "0.1"` (HIR §B.1–B.2, §B.5).
- **Hatchet**: worker declares its capabilities at `Register` time as `actions` (repeated
  string) plus `runtime_info` and `labels`; a `GetVersion` RPC exists; two stream generations
  (`Listen`/`ListenV2`) coexist with client-side fallback (HIR §A.1–A.2).
- **Temporal**: encoding negotiation is per-payload via metadata (`encoding` key, §6.3), not
  per-connection; worker versioning fields exist but the extracted proto shows
  `worker_version_capabilities` / `WorkerVersionStamp` marked deprecated in favor of
  deployment options (§7.3) — churn in this area; the durable pattern is the per-payload
  self-describing envelope. Restate's `x-restate-server: <sdk-name>/<sdk-version>` response
  header (§C.1) is the observability twin of Inngest's `X-Inngest-Sdk`.

---

## 6. Transport + framing choices, and why

Ledger from HIR §D plus extract detail:

| System | Choice | Trade recorded in extracts |
| --- | --- | --- |
| Temporal | worker-pull long-poll + unary RPCs; opaque `task_token` correlates everything | no persistent stream needed; cancellation latency bounded by heartbeat interval; async completion possible because identity (token) is data, not a connection |
| Hatchet | persistent server-push gRPC stream for delivery + control; unary for reports | immediate dispatch and immediate cancel on one channel; requires stream lifecycle management (register/heartbeat/unsubscribe, V2 fallback to V1) |
| Inngest | plain HTTP callbacks; the *worker is a URL*; all state re-sent every call | zero infrastructure on the worker beyond an HTTP handler; works on serverless; cost = re-shipping memoized state each step and no mid-flight channel (no heartbeat, no extracted cancel) |
| Restate | single POST opening a framed bidi byte stream (HTTP/2 full duplex, with request/response fallback mode) | fine-grained journaled protocol with suspension; explicitly degrades: mid-invocation `CompletionMessage`s "require the HTTP/2 full-duplex mode" — the protocol names its degraded mode instead of pretending one transport fits all (§C.1) |

Framing where custom: Restate uses a 64-bit header — 16-bit type, 16-bit flags, 32-bit length
(§C.2). Temporal/Hatchet inherit gRPC framing. Inngest multiplexes semantics onto HTTP status
codes (200/206/4xx/5xx) + headers.

Relevant to NetScript's constraint set (subprocess stdio, one-shot spawn, Deno host): the
group demonstrates that **the protocol vocabulary is separable from the transport**. Temporal
proves polling+unary suffices if identity is a token and control rides replies; Inngest
proves a dumb request/response worker can still be a full citizen if the envelope carries
attempt/context and errors are structured; Restate proves a version-negotiated framed stream
can coexist with a degraded request/response mode of the *same* protocol.

---

## 7. STEAL CANDIDATES for the NetScript polyglot task protocol

Pillars: interop / observability / communication / lifecycle. Tiers: 0 = must-implement
minimum for conformance, 1 = standard citizenship, 2 = advanced/optional.

**S1. Self-describing payload envelope with an `encoding` metadata map** — Temporal `Payload
{metadata, data}` + encoding vocabulary `json/plain`, `binary/plain`, `binary/null`
(T-extract §6.2–6.3). Replace "last JSON line of stdout" as the only data shape with an
envelope whose metadata names the encoding; JSON stays the tier-0 default, binary becomes
possible later without a version break. *Pillar: interop. Tier 0 (envelope + json/plain),
Tier 2 (binary/other encodings).*

**S2. Structured failure object with `type`, `message`, `stack_trace`, `source`, nested
`cause`, `details`, and `non_retryable`** — Temporal `Failure`/`ApplicationFailure`
(T-extract §5). Directly replaces `error: string|null`. Adopt the Go-SDK rule that the
adapter auto-wraps any bare error/nonzero-exit into a structured failure so structure is
guaranteed even from tier-0 tasks (T-extract §5, Go note). *Pillar: lifecycle (+
observability via `source`/stack). Tier 0: `{type, message, non_retryable}`; Tier 1: `cause`
chain, `stack_trace`, `details`.*

**S3. Retryability as an explicit flag defaulting to retryable, matched by error *type*
string** — `non_retryable` default false + `non_retryable_error_types` policy matching
(T-extract §4–5); Hatchet's flat `should_not_retry` (HIR §A.2) is the minimal wire form and
fine for tier 0. *Pillar: lifecycle. Tier 0.*

**S4. Failing side proposes `next_retry_delay` / `Retry-After`** — Temporal
`ApplicationFailure.next_retry_delay` (T §5), Inngest `Retry-After` (HIR §B.4), Restate
`ErrorMessage.next_retry_delay` (HIR §C.4). Lets a polyglot task that hit a rate limit tell
the queue when to try again. *Pillar: lifecycle. Tier 1.*

**S5. Attempt number + prior-attempt checkpoint delivered INTO the task** — poll response
`attempt` + `heartbeat_details`; `GetHeartbeatDetails` "extracts the heartbeat details from
the last failed attempt" (T-extract §7.2–7.3). NetScript env should grow `TASK_ATTEMPT` and a
checkpoint blob from the previous failed attempt; heartbeat/progress emissions become that
checkpoint. This is the single highest-leverage Temporal idea: progress reporting and
resume-from-checkpoint are the *same* message. *Pillar: lifecycle + communication. Tier 1
(attempt number could even be Tier 0 — it's one env var).*

**S6. Heartbeat replies carry control bits (`cancel_requested`, plus reserved
paused/reset)** — `RecordActivityTaskHeartbeatResponse` (T-extract §7.3). For NetScript's
one-shot subprocess model this is the cheapest cancellation channel that exists: the task
emits a heartbeat line on stdout, the host answers on stdin (or the task's next heartbeat
read) with cancel/pause bits — no second socket, no signal-handling contract beyond "read the
reply". Accept the documented cost: "Activities that don't Heartbeat can't receive a
Cancellation" (T §3) — tier-0 tasks simply remain uncancellable-cooperatively, which is
exactly the tiered-conformance story. *Pillar: communication + lifecycle. Tier 1; Hatchet's
push-stream `CANCEL_STEP_RUN` (HIR §A.2) is the Tier 2 upgrade if a persistent adapter
channel exists.*

**S7. Client-side heartbeat throttling with retain-latest semantics** — min(0.8×timeout,
caps), suppress but retain latest, resend after timer (T-extract §3). Put this in the
NetScript *adapter/port packages*, not in every task: tasks can heartbeat every loop
iteration; the adapter dedupes. *Pillar: communication. Tier 1 (adapter-side, invisible to
task authors).*

**S8. Deadline vocabulary: per-attempt vs across-all-retries, told to the task** — Temporal's
Start-To-Close vs Schedule-To-Close split and `ActivityInfo.Deadline` handed to the task
(T-extract §2, §7.2). NetScript should pass `TASK_DEADLINE` (and timeout config) into the
subprocess env so polyglot tasks can budget; the engine already enforces from outside.
*Pillar: lifecycle. Tier 1. Hatchet's additive `RefreshTimeout` (HIR §A.4) is a Tier 2 verb.*

**S9. Protocol version in the media type + echo-back rule + yankable version enum** — Restate
`application/vnd.restate.invocation.vX`, "SDK MUST return back the same content-type", `415`
on mismatch, enum with yanked V3/V4 (HIR §C.1, §C.3). For NetScript: first protocol line/env
(`NS_TASK_PROTOCOL=1`) declared by host, echoed by task in its first structured output; a
task that echoes nothing is tier-0 legacy (current last-JSON-line behavior). Versions must be
enumerable and *revocable*. *Pillar: interop. Tier 0 (the negotiation IS the tier detector).*

**S10. Capability declaration at registration + introspection with capability flags** —
Hatchet `Register.actions` (HIR §A.2) and Inngest's introspection endpoint returning
"capability flags" with schema versioning, plus SDK self-identification
`X-Inngest-Sdk: name:vSEMVER` (HIR §B.1–B.2). NetScript: task manifest declares
`capabilities: ["heartbeat", "cancel", "progress", "checkpoint"]`; adapter identifies itself
(name+semver, like `x-restate-server`, HIR §C.1) in every result envelope for observability.
*Pillar: interop + observability. Tier 0 (declare), Tier 1 (introspect).*

**S11. Header/metadata map on the input envelope for context propagation** — Temporal
`Header { map<string, Payload> }` beside `input` in the poll response (T-extract §6.2, §7.3);
Restate `InputCommandMessage.headers` and `CallCommandMessage.headers` (HIR §C.4). This is
the D-4 fix generalized: `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` travel in a *named
context map* that every queue provider must round-trip verbatim, instead of ad-hoc env vars
that individual paths forget. *Pillar: observability + interop. Tier 0 — this closes bug D-4
by construction.*

**S12. Event-vocabulary lifecycle reporting (`ACKNOWLEDGED`/`STARTED`/`COMPLETED`/`FAILED`/
`CANCELLED`) with timestamps** — Hatchet `StepActionEvent` (HIR §A.2). Even for a one-shot
subprocess, letting the task emit `STARTED` (and the adapter emit `ACKNOWLEDGED`) turns
NetScript's binary spawn/exit into an observable timeline; events carry `event_timestamp` and
`retry_count`. *Pillar: observability. Tier 1.*

**S13. Terminal-message discipline: a stream/process must end with exactly one of
{success-output, structured-error, (suspension)} and "implicit close … is treated as an
unknown failure"** — Restate §C.6. NetScript translation: subprocess exit without a terminal
protocol message = a distinct `UnknownFailure` type (not a parse error, not success=false
soup), preserving `exitCode` as a detail. *Pillar: lifecycle. Tier 0.*

**S14. Named degraded transport mode** — Restate's explicit full-duplex vs request/response
stream modes of the same protocol (HIR §C.1). NetScript should name its modes the same way:
mode "oneshot-stdio" (current), mode "duplex-stdio" (stdin control channel), rather than
implying one protocol implies one transport. *Pillar: interop. Tier structure itself —
this is the design pattern that makes tiers 0/1/2 coherent.*

**S15. Detachable completion token** — Temporal task token + external async completion handle
with `complete()/fail()/heartbeat()` (T-extract §7.1). Tier 2 for NetScript: a polyglot task
could hand off its token so completion arrives from another process/service — enables
webhook-style long tasks without holding a subprocess alive. *Pillar: lifecycle. Tier 2.*

---

## 8. Anti-patterns to avoid (as evidenced in the extracts)

**A1. Worker-level-only heartbeat.** Hatchet's `Heartbeat` proves worker liveness but carries
no per-task details (HIR §A.2) — so it cannot do checkpointing or per-task progress, and
Hatchet needed separate verbs (`RefreshTimeout`, step events) to compensate. Temporal's
per-task details-carrying heartbeat does three jobs with one verb. If NetScript adds a
heartbeat, make it per-task and payload-carrying from day one.

**A2. Retryability inferred rather than declared.** NetScript's current
`{success:boolean, error:string|null, exitCode}` forces the engine to guess. Every system in
the group made retryability an explicit, defaulted field (§4 above). String-matching error
messages is the failure mode this prevents.

**A3. Unbounded default retries without the terminal opt-out plumbed through.** Temporal's
Maximum Attempts default is ∞ (T-extract §4); that is safe *only because* `non_retryable`
exists and is honored end-to-end. Don't copy the ∞ default without also shipping S3.

**A4. Assuming delivered = durable.** Restate: "the SDK MUST NOT assume that every journal
entry previously sent on the same message stream has been correctly stored" (HIR §C.6).
NetScript adapters must not treat an emitted progress/heartbeat line as persisted; the ack
(`CommandAckMessage` / `EntryAckMessage` pattern) exists precisely because streams lie.

**A5. Assuming timeout = task stopped.** Hatchet documents it: "A timed out task does not
guarantee that the task will be stopped immediately" (HIR §A.4). NetScript's engine kills the
subprocess, but the *protocol* must still model "server marked failed while process still
running" — the CANCELLED/FAILED event from a zombie attempt needs an attempt/`retry_count`
discriminator (Hatchet events carry `retry_count`; Temporal keys by `task_token`) so a stale
attempt cannot complete a newer one. NetScript's current protocol has no attempt identity at
all — this race is unrepresentable today and would become live the moment retries are added.

**A6. Versioning by deprecated-field churn instead of by protocol version.** Temporal's
worker-versioning fields show three generations of deprecated fields in one message
(`worker_version_capabilities` deprecated, `WorkerVersionStamp` deprecated, `Deployment`
deprecated — T-extract §7.3). Contrast Restate's clean version enum with yanked versions.
Negotiate a protocol version (S9); don't accrete parallel deprecated fields inside v1
messages.

**A7. Multiplexing semantics onto transport status codes alone.** Inngest's 200/206/400/500 +
header scheme (HIR §B.4) is compact but couples meaning to HTTP; NetScript's equivalent trap
is overloading process `exitCode` as protocol semantics. Exit codes should corroborate, never
carry, the verdict — the structured terminal message does (S13).

**A8. Cancellation as an afterthought.** Two of four extracted systems have no extracted
cancellation channel at all (Inngest; Restate legacy doc — §D ledger). Once a protocol ships
without a cancel path, retrofitting one forces a new transport mode. NetScript should reserve
the control-reply channel (S6) in v1 even if tier-0 tasks ignore it.

**A9. Context that only some paths propagate.** NetScript's D-4 (queue path drops
TRACEPARENT/CORRELATION_ID) is exactly the class of bug the Header-map pattern (S11)
eliminates: Temporal's `Header` rides inside the task message itself through every hop, so no
individual queue path can "forget" it. Keeping trace context as loose env vars alongside the
payload re-creates D-4 for every future queue provider.

---

## Open questions

1. Restate cancellation: v5+ `SendSignalCommandMessage`/`SignalNotificationMessage` look like
   the cancel path but the extract never says so — needs the current Restate docs
   (the `docs.restate.dev/references/service-protocol` fetch failed) to confirm before citing
   Restate as a cancellation precedent. UNVERIFIED.
2. Hatchet heartbeat cadence (4 s) and listen-fallback behavior come from a secondary source
   (deepwiki) — verify against Hatchet SDK source before hard-coding comparable defaults.
3. Whether Temporal's `activity_paused`/`activity_reset` semantics (beyond the bits existing)
   are worth a NetScript analog is undetermined — the extract shows the wire bits and a doc
   mention of "pause, and reset" but not their state machine. UNVERIFIED semantics.
4. For NetScript's stdio transport: does a stdin-based control reply (S6) interact safely with
   runtimes that buffer stdin (e.g. Python default buffering)? Not answerable from these
   extracts — needs a prototype per adapter language.
