# RFC-5 source extract — Hatchet / Inngest / Restate worker + step protocols

Fetch date: 2026-08-20. Aggregator extract; faithful quotes / close paraphrase only.

Sources fetched for this file:

- https://docs.hatchet.run/v1/workers
- https://docs.hatchet.run/home/timeouts
- https://raw.githubusercontent.com/hatchet-dev/hatchet/main/api-contracts/dispatcher/dispatcher.proto
- https://raw.githubusercontent.com/inngest/inngest/main/docs/SDK_SPEC.md
- https://raw.githubusercontent.com/restatedev/service-protocol/main/service-invocation-protocol.md (archived copy of the protocol document)
- https://raw.githubusercontent.com/restatedev/restate/main/service-protocol/dev/restate/service/protocol.proto (current protocol proto)
- https://raw.githubusercontent.com/restatedev/service-protocol/main/README.md (archival notice only)

---

# A. Hatchet — gRPC dispatcher protocol (streaming-shaped)

## A.1 Service definition (api-contracts/dispatcher/dispatcher.proto)

```proto
service Dispatcher {
    rpc Register(WorkerRegisterRequest) returns (WorkerRegisterResponse) {}
    rpc Listen(WorkerListenRequest) returns (stream AssignedAction) {}
    rpc ListenV2(WorkerListenRequest) returns (stream AssignedAction) {}
    rpc Heartbeat(HeartbeatRequest) returns (HeartbeatResponse) {}
    rpc SubscribeToWorkflowEvents(SubscribeToWorkflowEventsRequest) returns (stream WorkflowEvent) {}
    rpc SubscribeToWorkflowRuns(stream SubscribeToWorkflowRunsRequest) returns (stream WorkflowRunEvent) {}
    rpc SendStepActionEvent(StepActionEvent) returns (ActionEventResponse) {}
    rpc SendBatchActionEvent(BatchActionEvent) returns (ActionEventResponse) {}
    rpc SendGroupKeyActionEvent(GroupKeyActionEvent) returns (ActionEventResponse) {}
    rpc PutOverridesData(OverridesData) returns (OverridesDataResponse) {}
    rpc Unsubscribe(WorkerUnsubscribeRequest) returns (WorkerUnsubscribeResponse) {}
    rpc RefreshTimeout(RefreshTimeoutRequest) returns (RefreshTimeoutResponse) {}
    rpc ReleaseSlot(ReleaseSlotRequest) returns (ReleaseSlotResponse) {}
    rpc RestoreEvictedTask(RestoreEvictedTaskRequest) returns (RestoreEvictedTaskResponse) {}
    rpc UpsertWorkerLabels(UpsertWorkerLabelsRequest) returns (UpsertWorkerLabelsResponse) {}
    rpc GetVersion(GetVersionRequest) returns (GetVersionResponse) {}
}
```

## A.2 Message inventory (field names/numbers as extracted)

**WorkerRegisterRequest**
- `worker_name` (string, 1)
- `actions` (repeated string, 2)
- `services` (repeated string, 3)
- `slots` (optional int32, 4)
- `labels` (map, 5)
- `webhook_id` (optional string, 6)
- `runtime_info` (optional RuntimeInfo, 7)
- `slot_config` (map, 9)

**AssignedAction** (server → worker, on the `Listen`/`ListenV2` stream)
- fields 1–13: `tenant_id`, `workflow_run_id`, `get_group_key_run_id`, `job_id`, `job_name`,
  `job_run_id`, `task_id`, `task_run_external_id`, `action_id`, `action_type`,
  `action_payload`, `task_name`, `retry_count`
- optional fields 14–20: `additional_metadata`, `child_workflow_index`, `child_workflow_key`,
  `parent_workflow_run_id`, `priority`, `workflow_id`, `workflow_version_id`
- optional fields 21–28: `durable_task_invocation_count`, `triggering_event_external_id`,
  `triggering_event_key`, `batchId`, `batchSize`, `batchIndex`, `batchStartPayload`, `batchKey`

**ActionType enum**: `START_STEP_RUN` (0), `CANCEL_STEP_RUN` (1), `START_GET_GROUP_KEY` (2),
`START_BATCH` (3).
→ Cancellation is a **dispatched action on the same stream**, not a reply to a heartbeat.

**StepActionEvent** (worker → server, unary)
- `worker_id`, `job_id`, `job_run_id`, `task_id`, `task_run_external_id`, `action_id` (1–6)
- `event_timestamp` (google.protobuf.Timestamp, 7)
- `event_type` (StepActionEventType, 8)
- `event_payload` (string, 9)
- `retry_count` (optional, 10), `should_not_retry` (optional, 11)

**StepActionEventType enum**: `STEP_EVENT_TYPE_UNKNOWN` (0), `STARTED` (1), `COMPLETED` (2),
`FAILED` (3), `ACKNOWLEDGED` (4), `CANCELLED` (5).
→ `should_not_retry` on a `FAILED` event is Hatchet's non-retryable-error flag (SDK
`NonRetryableError` maps to this).

**GroupKeyActionEvent**: `worker_id`, `workflow_run_id`, `get_group_key_run_id`, `action_id`
(1–4), `event_timestamp` (5), `event_type` (GroupKeyActionEventType, 6), `event_payload` (7).

**WorkerListenRequest**: `worker_id` (string, 1).

**HeartbeatRequest**: `worker_id` (string, 1), `heartbeat_at` (Timestamp, 2).
→ Heartbeat is **worker-level liveness**, not per-task progress; carries no details payload.

**OverridesData**: `task_run_external_id` (1), `path` (2), `value` (3), `caller_filename` (4).

**RefreshTimeoutRequest**: `task_run_external_id` (1), `increment_timeout_by` (string, 2).

**ReleaseSlotRequest**: `task_run_external_id` (1).

Custom entries note from the search-derived SDK description (deepwiki, secondary source):
the worker opens `listenV2()` with fallback to `listen()`, a dedicated worker thread sends a
heartbeat every 4 seconds (V2 only), the dispatcher pushes `AssignedAction` messages on the
stream, the worker replies with completion events, and gracefully unsubscribes on shutdown.
(Marked secondary — not from Hatchet's own docs.)

## A.3 Worker semantics (docs.hatchet.run/v1/workers)

- Workers are long-running processes that "register themselves with Hatchet to start receiving
  and executing tasks"; many workers can register identical tasks and Hatchet "distributes work
  across all of them, allowing for simple horizontal scaling."
- **Slots**: "if `slots` is set to 5, the worker will run up to five tasks concurrently at any
  time. Any additional tasks wait in the queue until a slot opens up." Default slot count 100.
  "Slots are a **local** limit"; a task can consume multiple slots via configurable slot cost.
- Auth: `HATCHET_CLIENT_TOKEN`; self-hosted without TLS sets `HATCHET_CLIENT_TLS_STRATEGY=none`.
  Transport is gRPC.
- Heartbeat appears in normal worker logs as "sending heartbeat".

## A.4 Timeouts (docs.hatchet.run/home/timeouts)

- **Scheduling timeout** — how long a task waits in the queue before cancellation. Default
  **5 minutes**.
- **Execution timeout** — how long a task may run after starting. Default **60 seconds**.
- Duration string format: decimal numbers with unit suffixes `ms`, `s`, `m`, `h`; "Components
  are summed. For example: `10s` means 10 seconds… `1h30m` means 1 hour 30 minutes."
  Valid: `10s`, `1h30m`, `42m30s`, `1.5h`. Bare numbers and negatives are rejected. The Python
  SDK additionally accepts `datetime.timedelta`.
- `refresh_timeout()` extends execution time **additively**: calling `refresh_timeout("15s")`
  with 30s remaining yields 45s total. May be called multiple times. (Wire form:
  `RefreshTimeoutRequest.increment_timeout_by`.)
- "Timeouts in Hatchet are treated as failures and the task will be retried if specified."
- Caveat quoted: "A timed out task does not guarantee that the task will be stopped
  immediately. The task will be stopped as soon as the worker is able to stop the task."

---

# B. Inngest — HTTP-callback-shaped SDK spec

Source: `inngest/inngest` repo, `docs/SDK_SPEC.md`.

## B.1 Endpoints

- **Sync / registration**: `PUT` to the SDK's own endpoint; the SDK then `POST`s to Inngest's
  `/fn/register`. SDK responds `{ message, modified }`. Payload includes app name, function IDs
  in composite form, triggers, and step configs.
- **Function execution (Call Request)**: `POST` to the SDK endpoint with an `fnId` query
  parameter. Body carries the event(s), memoized step results, and execution context.
- **Introspection / health**: `GET` — returns function count, capability flags, and
  authenticated metadata; supports signed and unsigned requests with schema versioning.
- Composite function ID format: `"appId-functionId"`.

## B.2 Headers

| Header | Purpose / format |
| --- | --- |
| `X-Inngest-Sdk` | `sdk-name:vSEMVER`, e.g. `inngest-js:v1.2.3` |
| `X-Inngest-Signature` | HMAC-SHA256 validation: `t=timestamp&s=hex_signature` |
| `X-Inngest-Req-Version` | must be `2` in responses |
| `X-Inngest-Server-Kind` | `dev` or `cloud` |
| `X-Inngest-No-Retry` | `true` for non-retriable errors; `false` otherwise |
| `Retry-After` | RFC 9110 format or ISO 8601 timestamp |

Auth: verify HMAC-SHA256 of (body + timestamp) against the `s` value of `X-Inngest-Signature`.
Signing key format `signkey-prod-<hex>`; the hashed key is sent as `Authorization: Bearer`.
`INNGEST_SIGNING_KEY_FALLBACK` is retried on primary-key failure. With `INNGEST_DEV` set,
signature verification is optional.

## B.3 Call Request body

```json
{
  "event": { "name": "...", "data": {}, "ts": 0, "id": "..." },
  "events": [ /* array of events */ ],
  "steps": { "hash_id": { "data": ... } | { "error": ... } },
  "ctx": {
    "run_id": "...",
    "attempt": 0,
    "disable_immediate_execution": false,
    "use_api": false,
    "stack": { "stack": [...], "current": 0 }
  }
}
```

`steps` is the **memoized step-result map keyed by step hash** — the replay mechanism: the
executor re-invokes the whole function over HTTP and the SDK short-circuits already-completed
steps from this map.

## B.4 Responses and opcodes

- **200** — body is the function's return value (function finished).
- **206 Partial Content** — array of step objects reporting new step operations:

```json
[
  {
    "id": "sha1_hex_hash",
    "op": "StepPlanned|StepRun|StepError|Sleep|WaitForEvent|InvokeFunction|AiGateway|Gateway",
    "displayName": "optional_label",
    "opts": { /* operation-specific config */ }
  }
]
```

Opcodes as documented:
- `StepRun` / `StepPlanned` — execute user code (immediate, or deferred to a later request)
- `StepError` — step failed
- `Sleep` — delay with duration (time string or ISO 8601)
- `WaitForEvent` — await event by name with optional CEL expression
- `InvokeFunction` — call another function by composite ID
- `AiGateway` — route AI inference through the provider gateway
- `Gateway` — HTTP fetch with retries

- **Error response (400 or 500)**:

```json
{ "name": "ErrorName", "message": "Human-readable message", "stack": "optional_stack_trace" }
```

Retry semantics:
- Retriable: `500` + `X-Inngest-No-Retry: false`
- Non-retriable: `400` + `X-Inngest-No-Retry: true`
- Custom delay: `Retry-After` header, which implies `No-Retry: false`

## B.5 Sync (function config) payload shape

```json
{
  "appName": "app_id",
  "sdk": "inngest-js:v1.0.0",
  "v": "0.1",
  "functions": [
    {
      "id": "app_id-fn_id",
      "name": "Display Name",
      "triggers": [
        { "event": "user.signup", "expression": "event.data.plan == 'premium'" },
        { "cron": "0 0 * * *" }
      ],
      "steps": {
        "step": { "id": "step", "runtime": { "type": "http", "url": "https://..." } }
      },
      "concurrency": { "limit": 10, "key": "event.data.user_id" },
      "rateLimit": { "limit": 5, "period": "1h" },
      "debounce": { "period": "5s" }
    }
  ]
}
```

Shape note (no interpretation added): the worker is addressed as an **HTTP URL registered with
the executor**; every step boundary is a fresh HTTP request/response with the accumulated
memoized state re-sent. This is callback-shaped, not stream-shaped.

---

# C. Restate — service invocation protocol (stream-shaped, HTTP/2 bidi with request/response fallback)

## C.1 Transport

- Invocation is always `POST /invoke/{serviceName}/{handlerName}` (an arbitrary path prefix is
  allowed).
- Content-type carries the protocol version: `application/vnd.restate.invocation.vX`.
  "The SDK MUST return back the same content-type in the successful response case."
- Status codes: `200` stream ready; `404` service or handler not found; `415` unsupported
  content-type version.
- Optional response header for observability: `x-restate-server: <sdk-name>/<sdk-version>`.
- Two stream modes:
  - **Full duplex (HTTP/2)** — "Messages are sent back and forth on the same stream at the same
    time."
  - **Request/Response stream (fallback)** — "Messages are sent from runtime to service
    deployment, and later from service deployment to runtime."
  `CompletionMessage`s from the runtime mid-invocation require the HTTP/2 full-duplex mode.
- **Discovery**: `GET`/`POST` at the `/discovery` path. The request's `Accept` header lists the
  supported manifest versions, e.g. `application/vnd.restate.endpointmanifest.v2+json`; the
  response `content-type` names the chosen version. Schema:
  `endpoint_manifest_schema.json`.

## C.2 Framing

64-bit frame header:
- message type — 16 bits (MSB)
- reserved/flags — 16 bits, type specific
- length — 32 bits, serialized message byte length excluding the header

Flag bits on entry headers:
- bit A `0x8000` — `REQUIRES_ACK`
- bit C `0x0001` — `COMPLETED` (completable entries only)

Custom entries use type codes `>= 0xFC00` and support `REQUIRES_ACK`.

## C.3 Protocol versions (from `dev/restate/service/protocol.proto`, ServiceProtocolVersion enum)

```
SERVICE_PROTOCOL_VERSION_UNSPECIFIED = 0
V1 = 1
V2 = 2
V3 = 3   (yanked)
V4 = 4   (yanked)
V5 = 5
V6 = 6
V7 = 7
```

The v5+ generation renames journal "entries" into **Commands** (SDK→runtime intents),
**CompletionNotifications** (runtime→SDK results), and **Signals**.

## C.4 Current (v5+) message inventory with type codes

Core frames (`0x0000 + n`):

| Message | Code | Fields |
| --- | --- | --- |
| `StartMessage` | 0x0000 | `bytes id`, `string debug_id`, `uint32 known_entries`, `repeated StateEntry state_map`, `bool partial_state`, `string key`, `uint32 retry_count_since_last_stored_entry`, `uint64 duration_since_last_stored_entry`, `uint64 random_seed`, `optional string scope`, `optional string limit_key`, `optional string idempotency_key` |
| `SuspensionMessage` | 0x0001 | `Future awaiting_on` |
| `ErrorMessage` | 0x0002 | `uint32 code`, `string message`, `string stacktrace`, `optional uint32 related_command_index`, `optional string related_command_name`, `optional uint32 related_command_type`, `optional uint64 next_retry_delay`, `ErrorBehavior behavior` |
| `EndMessage` | 0x0003 | (no fields) |
| `CommandAckMessage` | 0x0004 | `uint32 command_index` |
| `ProposeRunCompletionMessage` | 0x0005 | `uint32 result_completion_id`, oneof result: `bytes value` \| `Failure failure` |
| `AwaitingOnMessage` | 0x0006 | `Future awaiting_on`, `bool executing_side_effects` |
| `ProposeRunCompletionAckMessage` | 0x0007 | `uint32 completion_id` |

Commands (`0x0400 + n`) and their completion notifications (`0x8000 + n`):

| Command | Code | Fields | Notification | Code | Fields |
| --- | --- | --- | --- | --- | --- |
| `InputCommandMessage` | 0x0400 | `repeated Header headers`, `Value value`, `string name` | — | — | — |
| `OutputCommandMessage` | 0x0401 | oneof result: `Value value` \| `Failure failure`, `string name` | — | — | — |
| `GetLazyStateCommandMessage` | 0x0402 | `bytes key`, `uint32 result_completion_id`, `string name` | `GetLazyStateCompletionNotificationMessage` | 0x8002 | `uint32 completion_id`, oneof result: `Void void` \| `Value value` |
| `SetStateCommandMessage` | 0x0403 | `bytes key`, `Value value`, `string name` | — | — | — |
| `ClearStateCommandMessage` | 0x0404 | `bytes key`, `string name` | — | — | — |
| `ClearAllStateCommandMessage` | 0x0405 | `string name` | — | — | — |
| `GetLazyStateKeysCommandMessage` | 0x0406 | `uint32 result_completion_id`, `string name` | `GetLazyStateKeysCompletionNotificationMessage` | 0x8006 | `uint32 completion_id`, `StateKeys state_keys` |
| `GetEagerStateCommandMessage` | 0x0407 | `bytes key`, oneof result: `Void void` \| `Value value`, `string name` | — | — | — |
| `GetEagerStateKeysCommandMessage` | 0x0408 | `StateKeys value`, `string name` | — | — | — |
| `GetPromiseCommandMessage` | 0x0409 | `string key`, `uint32 result_completion_id`, `string name` | `GetPromiseCompletionNotificationMessage` | 0x8009 | `uint32 completion_id`, oneof result: `Value value` \| `Failure failure` |
| `PeekPromiseCommandMessage` | 0x040A | `string key`, `uint32 result_completion_id`, `string name` | `PeekPromiseCompletionNotificationMessage` | 0x800A | `uint32 completion_id`, oneof: `Void` \| `Value` \| `Failure` |
| `CompletePromiseCommandMessage` | 0x040B | `string key`, oneof completion: `Value completion_value` \| `Failure completion_failure`, `uint32 result_completion_id`, `string name` | `CompletePromiseCompletionNotificationMessage` | 0x800B | `uint32 completion_id`, oneof: `Void` \| `Failure` |
| `SleepCommandMessage` | 0x040C | `uint64 wake_up_time`, `uint32 result_completion_id`, `string name` | `SleepCompletionNotificationMessage` | 0x800C | `uint32 completion_id`, `Void void` |
| `CallCommandMessage` | 0x040D | `string service_name`, `string handler_name`, `bytes parameter`, `repeated Header headers`, `string key`, `optional string idempotency_key`, `optional string scope`, `optional string limit_key`, `uint32 invocation_id_notification_idx`, `uint32 result_completion_id`, `string name` | `CallCompletionNotificationMessage` | 0x800D | `uint32 completion_id`, oneof: `Value` \| `Failure` |
| `OneWayCallCommandMessage` | 0x040E | `string service_name`, `string handler_name`, `bytes parameter`, `uint64 invoke_time`, `repeated Header headers`, `string key`, `optional string idempotency_key`, `optional string scope`, `optional string limit_key`, `uint32 invocation_id_notification_idx`, `string name` | `CallInvocationIdCompletionNotificationMessage` | 0x800E | `uint32 completion_id`, `string invocation_id` |
| `SendSignalCommandMessage` | 0x0410 | `string target_invocation_id`, oneof signal_id: `uint32 idx` \| `string name`, oneof result: `Void` \| `Value` \| `Failure`, `string entry_name` | — | — | — |
| `RunCommandMessage` | 0x0411 | `uint32 result_completion_id`, `string name` | `RunCompletionNotificationMessage` | 0x8011 | `uint32 completion_id`, oneof: `Value` \| `Failure` |
| `AttachInvocationCommandMessage` | 0x0412 | oneof target: `string invocation_id` \| `IdempotentRequestTarget` \| `WorkflowTarget`, `uint32 result_completion_id`, `string name` | `AttachInvocationCompletionNotificationMessage` | 0x8012 | `uint32 completion_id`, oneof: `Value` \| `Failure` |
| `GetInvocationOutputCommandMessage` | 0x0413 | oneof target as above, `uint32 result_completion_id`, `string name` | `GetInvocationOutputCompletionNotificationMessage` | 0x8013 | `uint32 completion_id`, oneof: `Void` \| `Value` \| `Failure` |
| `CompleteAwakeableCommandMessage` | 0x0414 | `string awakeable_id`, oneof result: `Value` \| `Failure`, `string name` | — | — | — |
| — | — | — | `SignalNotificationMessage` | 0xFBFF | oneof signal_id: `uint32 idx` \| `string name`, oneof result: `Void` \| `Value` \| `Failure` |

## C.5 Legacy (v1–v4) entry inventory — from the archived service-protocol document

Kept because most published Restate docs and third-party writeups still describe this vocabulary.

| Message | Code | Completable | Note |
| --- | --- | --- | --- |
| `StartMessage` | 0x0000 | No | bootstraps invocation with known entries + state map |
| `CompletionMessage` | 0x0001 | — | runtime notifies entry completion result |
| `ErrorMessage` | 0x0003 | — | signals invocation failure |
| `EntryAckMessage` | 0x0004 | — | runtime confirms entry persistence |
| `InputEntryMessage` | 0x0400 | No | invocation input |
| `OutputEntryMessage` | 0x0401 | No | invocation output or terminal failure |
| `GetStateEntryMessage` | 0x0800 | Yes | read state value |
| `SetStateEntryMessage` | 0x0800 | No | persist key/value (as extracted) |
| `ClearStateEntryMessage` | 0x0801 | No | |
| `ClearAllStateEntryMessage` | 0x0802 | No | |
| `GetStateKeysEntryMessage` | 0x0804 | Yes | |
| `GetPromiseEntryMessage` | 0x0808 | Yes | |
| `PeekPromiseEntryMessage` | 0x0809 | Yes | |
| `CompletePromiseEntryMessage` | 0x080A | Yes | |
| `SleepEntryMessage` | 0x0C00 | Yes | timer |
| `CallEntryMessage` | 0x0C01 | Yes | service-to-service invocation (fallible) |
| `OneWayCallEntryMessage` | 0x0C02 | No | fire-and-forget (fallible) |
| `AwakeableEntryMessage` | 0x0C03 | Yes | arbitrarily completable result container |
| `CompleteAwakeableEntryMessage` | 0x0C04 | No | (fallible) |
| `RunEntryMessage` | 0x0C05 | No | run non-deterministic code, persist result |
| `CancelInvocationEntryMessage` | 0x0C06 | No | (fallible) |
| `GetCallInvocationIdEntryMessage` | 0x0C07 | Yes | (fallible) |
| `AttachInvocationEntryMessage` | 0x0C08 | Yes | (fallible) |
| `GetInvocationOutputEntryMessage` | 0x0C09 | Yes | (fallible) |
| `SuspensionMessage` | — | — | SDK indicates which journal entries it awaits |
| `EndMessage` | — | — | successful termination |

## C.6 State machine, suspension, retries

- **Replaying phase**: runtime sends stored journal entries; SDK replays without creating new
  entries. "Runtime controls journal source-of-truth and ordering."
- **Processing phase**: SDK generates new journal entries in its chosen order and becomes the
  journal source-of-truth. The runtime cannot create entries but can send `CompletionMessage`
  (HTTP/2 full-duplex only) or `EntryAckMessage`.
- **Suspension**: when awaiting completions the SDK sends a `SuspensionMessage` containing the
  incomplete entry indices and closes the stream. The runtime resumes the invocation when at
  least one indexed entry completes. "The stream must terminate with `SuspensionMessage`,
  `ErrorMessage`, or `EndMessage`."
- **Retries**: the runtime retries invocations per its policy after transient failures, reusing
  the previously stored journal. Quoted caution: "the SDK MUST NOT assume that every journal
  entry previously sent on the same message stream has been correctly stored."
- **Errors**: signalled via `ErrorMessage` as the final stream message; an implicit close
  without a terminal message is treated as an unknown failure. Terminal application failure is
  expressed as an `OutputEntryMessage`/`OutputCommandMessage` with the failure variant.
  In v5+, `ErrorMessage` additionally carries `next_retry_delay` and an `ErrorBehavior`.

---

# D. Transport shape ledger (recording only, no analysis)

| System | Task delivery | Progress/liveness | Cancellation channel | Result channel |
| --- | --- | --- | --- | --- |
| Temporal | long-poll RPC `PollActivityTaskQueue` (worker pulls) | `RecordActivityTaskHeartbeat` unary RPC with `details` Payloads | reply bits on the heartbeat response (`cancel_requested`, `activity_paused`, `activity_reset`) | `RespondActivityTaskCompleted/Failed/Canceled` unary RPCs keyed by `task_token` |
| Hatchet | server-push gRPC stream `ListenV2` → `AssignedAction` | separate `Heartbeat` unary RPC, worker-level | `AssignedAction` with `action_type = CANCEL_STEP_RUN` on the same stream | `SendStepActionEvent` unary RPC with `event_type` COMPLETED/FAILED/CANCELLED |
| Inngest | executor `POST`s to the SDK's HTTP URL per step boundary | none (request/response lifetime) | (not in the extracted spec) | HTTP status: 200 = final value, 206 = step opcodes, 400/500 = error with `X-Inngest-No-Retry` |
| Restate | runtime `POST /invoke/{svc}/{handler}` opening a message stream | `CommandAckMessage` / `EntryAckMessage` per entry | (not in the extracted material) | `OutputCommandMessage` + `EndMessage` on the stream, or `SuspensionMessage` to pause |
