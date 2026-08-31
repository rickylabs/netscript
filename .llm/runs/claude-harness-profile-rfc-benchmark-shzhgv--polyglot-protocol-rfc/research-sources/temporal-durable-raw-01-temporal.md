# RFC-5 source extract — Temporal activity protocol (group: temporal-durable)

Fetch date: 2026-08-20. Aggregator extract; faithful quotes / close paraphrase only.

Sources fetched for this file:

- https://docs.temporal.io/activities
- https://docs.temporal.io/encyclopedia/detecting-activity-failures
- https://docs.temporal.io/encyclopedia/retry-policies
- https://docs.temporal.io/references/failures
- https://docs.temporal.io/dataconversion
- https://docs.temporal.io/develop/python/asynchronous-activity-completion
- https://docs.temporal.io/develop/go/failure-detection
- https://raw.githubusercontent.com/temporalio/api/master/temporal/api/common/v1/message.proto
- https://raw.githubusercontent.com/temporalio/api/master/temporal/api/workflowservice/v1/request_response.proto
- https://raw.githubusercontent.com/temporalio/sdk-go/master/internal/activity.go
- https://raw.githubusercontent.com/temporalio/sdk-go/master/converter/metadata.go
- https://raw.githubusercontent.com/temporalio/sdk-go/master/converter/codec.go

---

## 1. Activity model (docs.temporal.io/activities)

- An Activity is "a normal function or method that executes a single, well-defined action
  (either short or long running)". Examples given: calling a service, transcoding media,
  sending an email.
- "Activity code can be non-deterministic"; Activities should be idempotent.
- Lifecycle as documented:
  1. "Workflow code orchestrates the execution of Activities, persisting the results."
  2. "Activity Functions are executed by Worker Processes."
  3. On finish, "the Worker sends the results back to the Temporal Service as part of the
     `ActivityTaskCompleted` Event."
  4. "This Event is added to the Workflow Execution's Event History."
- On failure: "any future attempt will start from the initial state, unless your code uses
  Heartbeat details payloads for checkpointing."
- Activity kinds named on the page: standard (workflow-orchestrated) Activities, Local
  Activities, and Standalone Activities (invoked directly via the SDK Client without a
  Workflow).

## 2. Timeouts (docs.temporal.io/encyclopedia/detecting-activity-failures)

| Timeout | Meaning | Default |
| --- | --- | --- |
| Schedule-To-Start | Max time from Activity Task being scheduled to a Worker picking it up | ∞ (infinity); non-retryable by design |
| Start-To-Close | Max duration of a *single* Activity Task Execution (per attempt) | Same as Schedule-To-Close; "strongly recommended" to set explicitly |
| Schedule-To-Close | Max time from first scheduling through final completion, spanning all retries | ∞ (infinity) |
| Heartbeat | Max time allowed between consecutive Activity Heartbeats | (unset by default; if breached the Activity Task fails and retries) |

- "At least one of Start-To-Close or Schedule-To-Close must be set."
- Start-To-Close applies independently to each retry attempt. Primary use: "detect when a
  Worker crashes after it has started executing an Activity Task."
- Schedule-To-Start use cases: detect crashed Workers or slow Task Queue processing.

## 3. Heartbeat mechanics

- Definition: Activity Heartbeats are "a ping from the Worker that is executing the Activity
  to the Temporal Service", signaling progress and Worker liveness.
- **Heartbeat details for resume**: "If an Activity Task Execution times out due to a missed
  Heartbeat, the next Activity Task can access and continue with that payload."
- **Heartbeat-carried cancellation**: "Activity Cancellations are delivered to Activities from
  the Temporal Service when they Heartbeat. Activities that don't Heartbeat can't receive a
  Cancellation."
- **Throttling**: the Worker throttles heartbeats using the *minimum* of:
  - `heartbeatTimeout * 0.8` (if a heartbeat timeout is provided) or
    `defaultHeartbeatThrottleInterval`, and
  - `maxHeartbeatThrottleInterval`.
  Documented defaults: `defaultHeartbeatThrottleInterval` = 30 seconds,
  `maxHeartbeatThrottleInterval` = 60 seconds.
  Behavior: Worker sends a Heartbeat → sets a throttle timer → suppresses subsequent
  Heartbeats while retaining the latest → resends the latest after the timer fires.

## 4. Retry Policy (docs.temporal.io/encyclopedia/retry-policies)

Five properties and defaults:

1. Initial Interval — default `1 second`
2. Backoff Coefficient — default `2.0`
3. Maximum Interval — default `100 × Initial Interval`
4. Maximum Attempts — default `∞` (unlimited)
5. Non-Retryable Errors — default empty list

Retry interval formula (quoted): "The smaller of two values: The Initial Interval multiplied
by the Backoff Coefficient raised to the power of the number of retries" or "the Maximum
Interval".

Activities retry automatically by default; Workflows do not. Rationale quoted: "Workflow code
must be deterministic to support replay, and failure-prone or non-deterministic
operations … should be placed in Activities, which have built-in retry support."

## 5. Failure taxonomy (docs.temporal.io/references/failures)

Seven failure types:

1. `ApplicationFailure` — application-specific failures raised by user code in Workflows,
   Activities, and Nexus Handlers.
2. `CancelledFailure` — cancellation of Workflows, Activities, or Nexus Operations.
3. `TimeoutFailure` — timeout of Activities or Workflows; for Activities the **last heartbeat
   details are attached**.
4. `ActivityFailure` — delivered when an Activity fails; carries Activity metadata with the
   real failure in `cause`.
5. `ChildWorkflowFailure` — child workflow metadata with reason in `cause`.
6. `TerminatedFailure` — workflow terminated; surfaced to waiting child/client code.
7. `ServerFailure` — errors originating in the Temporal Service itself.

`ApplicationFailure` fields:

- `type` — error's type name (this is what `non_retryable_error_types` matches against)
- `message`
- `non_retryable` — boolean, default `false`
- `details` — custom payload
- `cause` — nested failure
- `next_retry_delay` — override for the computed retry interval

Base `Failure` proto shape (all failures extend it):

- `string message`
- `string stack_trace`
- `string source` — SDK origin identifier
- `Failure cause` — nested failure
- `Payload encoded_attributes` — message/stack_trace encoded via the Failure Converter

Go SDK note (docs.temporal.io/develop/go/failure-detection): "If the Activity returns an error
as `errors.New()` or `fmt.Errorf()`, that error is converted into `*temporal.ApplicationError`."
Non-retryable construction: `temporal.NewNonRetryableApplicationError("error message", details)`.
Discrimination uses `errors.As()` across `ApplicationError`, `CanceledError`, `TimeoutError`,
`PanicError`; timeout kind via `TimeoutType()` with values `ScheduleToStart`, `StartToClose`,
`Heartbeat`.

## 6. Payload / data converter abstraction

### 6.1 Concept (docs.temporal.io/dataconversion)

- Data Converter is "an SDK component that handle[s] the serialization and encoding of data
  entering and exiting a Temporal Service."
- A Payload is "binary data such as input and output from Activities and Workflows" and
  "contain[s] metadata that describe their data type or other parameters for use by custom
  encoders/converters."
- Encoding happens automatically on input; decoding requires explicit application logic.
- Extension points named: default Data Converter, custom Payload Converter, custom Codec
  (for encryption/compression).

### 6.2 Wire shape (temporal/api/common/v1/message.proto)

```protobuf
message Payload {
    map<string,bytes> metadata = 1;
    bytes data = 2;
    repeated ExternalPayloadDetails external_payloads = 3;

    message ExternalPayloadDetails {
        int64 size_bytes = 1;
    }
}

message Payloads {
    repeated Payload payloads = 1;
}

message ActivityType { string name = 1; }
message WorkflowType { string name = 1; }

message RetryPolicy {
    google.protobuf.Duration initial_interval = 1;
    double backoff_coefficient = 2;
    google.protobuf.Duration maximum_interval = 3;
    int32 maximum_attempts = 4;
    repeated string non_retryable_error_types = 5;
}

message Header { map<string, Payload> fields = 1; }
message Memo   { map<string, Payload> fields = 1; }
```

### 6.3 Encoding metadata vocabulary (sdk-go/converter/metadata.go)

Metadata keys:

- `MetadataEncoding` = `"encoding"`
- `MetadataMessageType` = `"messageType"`

Encoding values:

- `MetadataEncodingBinary`    = `"binary/plain"`
- `MetadataEncodingJSON`      = `"json/plain"`
- `MetadataEncodingNil`       = `"binary/null"`
- `MetadataEncodingProtoJSON` = `"json/protobuf"`
- `MetadataEncodingProto`     = `"binary/protobuf"`

### 6.4 Payload Codec + remote codec server (sdk-go/converter/codec.go)

```go
type PayloadCodec interface {
    Encode([]*commonpb.Payload) ([]*commonpb.Payload, error)
    Decode([]*commonpb.Payload) ([]*commonpb.Payload, error)
}
```

Both methods receive non-nil slices and must not mutate their inputs.

Remote codec HTTP contract:

- Paths: `/encode` and `/decode`
- Method: POST only
- Request `Content-Type: application/json`; body is the JSON-serialized `commonpb.Payloads`
  message (an object with a `payloads` array)
- Response `Content-Type: application/json`, HTTP 200 on success, body is JSON-serialized
  `commonpb.Payloads` with the transformed array
- Errors: HTTP error status with the error message in the response body
- `RemotePayloadCodecOptions` carries an optional `ModifyRequest` callback to customize the
  outgoing HTTP request (e.g. add auth headers)

## 7. Task tokens and the activity worker RPCs

### 7.1 Async completion (docs.temporal.io/develop/python/asynchronous-activity-completion)

- Task token obtained via `activity.info().task_token`.
- `activity.raise_complete_async()` marks the Activity for asynchronous completion.
- External system obtains a handle: `client.get_async_activity_handle(task_token=captured_token)`.
- Handle operations: `complete()`, `fail()`, `heartbeat()`, `report_cancellation()`.
- Alternative identification instead of a task token: Namespace + Workflow Id + Activity Id.

### 7.2 Go ActivityInfo (sdk-go/internal/activity.go)

```go
type ActivityInfo struct {
    TaskToken                 []byte
    WorkflowType              *WorkflowType
    WorkflowNamespace         string  // Deprecated
    WorkflowExecution         WorkflowExecution
    ActivityID                string
    ActivityRunID             string
    ActivityType              ActivityType
    TaskQueue                 string
    Namespace                 string
    HeartbeatTimeout          time.Duration
    ScheduleToCloseTimeout    time.Duration
    StartToCloseTimeout       time.Duration
    ScheduledTime             time.Time
    StartedTime               time.Time
    Deadline                  time.Time
    Attempt                   int32
    IsLocalActivity           bool
    Priority                  Priority
    RetryPolicy               *RetryPolicy
}

func RecordActivityHeartbeat(ctx context.Context, details ...interface{})
func HasHeartbeatDetails(ctx context.Context) bool
func GetHeartbeatDetails(ctx context.Context, d ...interface{}) error

type RegisterActivityOptions struct {
    Name                          string
    DisableAlreadyRegisteredCheck bool
    SkipInvalidStructFunctions    bool
}
```

`RecordActivityHeartbeat` doc note: details provided are visible to workflows receiving a
`TimeoutError` (TimeoutType/Details). "Heartbeat responses may also deliver server requests
such as activity cancellation, pause, and reset to the activity context."

`GetHeartbeatDetails` extracts the heartbeat details from the *last failed attempt* — the
resume-from-checkpoint path.

### 7.3 Worker-facing gRPC shapes (temporal/api/workflowservice/v1/request_response.proto)

```protobuf
PollActivityTaskQueueRequest {
  string namespace = 1;
  temporal.api.taskqueue.v1.TaskQueue task_queue = 2;
  string poller_group_id = 10;
  string identity = 3;
  string worker_instance_key = 8;
  string worker_control_task_queue = 9;
  temporal.api.taskqueue.v1.TaskQueueMetadata task_queue_metadata = 4;
  temporal.api.common.v1.WorkerVersionCapabilities worker_version_capabilities = 5 [deprecated];
  temporal.api.deployment.v1.WorkerDeploymentOptions deployment_options = 6;
  reserved 7;
}

PollActivityTaskQueueResponse {
  bytes task_token = 1;
  string workflow_namespace = 2;
  WorkflowType workflow_type = 3;
  WorkflowExecution workflow_execution = 4;
  ActivityType activity_type = 5;
  string activity_id = 6;
  Header header = 7;
  Payloads input = 8;
  Payloads heartbeat_details = 9;
  google.protobuf.Timestamp scheduled_time = 10;
  google.protobuf.Timestamp current_attempt_scheduled_time = 11;
  google.protobuf.Timestamp started_time = 12;
  int32 attempt = 13;
  google.protobuf.Duration schedule_to_close_timeout = 14;
  google.protobuf.Duration start_to_close_timeout = 15;
  google.protobuf.Duration heartbeat_timeout = 16;
  RetryPolicy retry_policy = 17;
  temporal.api.taskqueue.v1.PollerScalingDecision poller_scaling_decision = 18;
  Priority priority = 19;
  string activity_run_id = 20;
  repeated temporal.api.taskqueue.v1.PollerGroupInfo poller_group_infos = 21;
}

RecordActivityTaskHeartbeatRequest {
  bytes task_token = 1;
  Payloads details = 2;
  string identity = 3;
  string namespace = 4;
  string resource_id = 5;
}

RecordActivityTaskHeartbeatResponse {
  bool cancel_requested = 1;
  bool activity_paused = 2;
  bool activity_reset = 3;
}

RecordActivityTaskHeartbeatByIdRequest {
  string namespace = 1; string workflow_id = 2; string run_id = 3;
  string activity_id = 4; Payloads details = 5; string identity = 6;
  string resource_id = 7;
}
RecordActivityTaskHeartbeatByIdResponse { bool cancel_requested = 1; bool activity_paused = 2; bool activity_reset = 3; }

RespondActivityTaskCompletedRequest {
  bytes task_token = 1;
  Payloads result = 2;
  string identity = 3;
  string namespace = 4;
  string resource_id = 8;
  WorkerVersionStamp worker_version = 5 [deprecated];
  temporal.api.deployment.v1.Deployment deployment = 6 [deprecated];
  temporal.api.deployment.v1.WorkerDeploymentOptions deployment_options = 7;
}

RespondActivityTaskCompletedByIdRequest {
  string namespace = 1; string workflow_id = 2; string run_id = 3;
  string activity_id = 4; Payloads result = 5; string identity = 6;
  string resource_id = 7;
}

RespondActivityTaskFailedRequest {
  bytes task_token = 1;
  temporal.api.failure.v1.Failure failure = 2;
  string identity = 3;
  string namespace = 4;
  string resource_id = 9;
  Payloads last_heartbeat_details = 5;
  WorkerVersionStamp worker_version = 6 [deprecated];
  temporal.api.deployment.v1.Deployment deployment = 7 [deprecated];
  temporal.api.deployment.v1.WorkerDeploymentOptions deployment_options = 8;
}

RespondActivityTaskFailedByIdRequest {
  string namespace = 1; string workflow_id = 2; string run_id = 3;
  string activity_id = 4; Failure failure = 5; string identity = 6;
  Payloads last_heartbeat_details = 7; string resource_id = 8;
}

RespondActivityTaskCanceledRequest {
  bytes task_token = 1;
  Payloads details = 2;
  string identity = 3;
  string namespace = 4;
  string resource_id = 8;
  WorkerVersionStamp worker_version = 5 [deprecated];
  temporal.api.deployment.v1.Deployment deployment = 6 [deprecated];
  temporal.api.deployment.v1.WorkerDeploymentOptions deployment_options = 7;
}

RespondActivityTaskCanceledByIdRequest {
  string namespace = 1; string workflow_id = 2; string run_id = 3;
  string activity_id = 4; Payloads details = 5; string identity = 6;
  WorkerDeploymentOptions deployment_options = 7; string resource_id = 8;
}
```

Shape observations recorded without interpretation:

- The heartbeat is a **request/response RPC whose response carries control bits**
  (`cancel_requested`, `activity_paused`, `activity_reset`) — cancellation rides the heartbeat
  reply, matching the doc statement in §3.
- Task dispatch is **long-poll shaped** (`PollActivityTaskQueue` returns one task), not a
  server-push stream.
- Identity of an in-flight attempt is the opaque `bytes task_token`; the `*ById` variants
  substitute `(namespace, workflow_id, run_id, activity_id)`.
- All user data crosses as `Payloads` (metadata map + bytes), never as language types.
