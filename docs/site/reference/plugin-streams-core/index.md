---
layout: layouts/base.vto
title: '@netscript/plugin-streams-core'
---

# `@netscript/plugin-streams-core`

Schema, producer, config, telemetry, testing, and diagnostics primitives for NetScript streams. This
page is written against the package's public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

Publishing change events sounds trivial until it has to be safe: typed payloads, idempotent appends,
one producer per stream path, and a clean flush on shutdown. `defineStreamSchema` declares the
collections a stream carries with standard-schema validation and a configured primary key;
`createDurableStream` returns a path-singleton producer whose `upsert`/`delete` appends are
idempotent and auto-claimed; and the diagnostics helpers inspect a schema or resolve the stream
endpoint without opening a socket.

This is the layer the deployable [`@netscript/plugin-streams`](/reference/streams/) service builds
on, and the layer the other NetScript plugins use when they project entities — executions, saga
instances, sessions — into durable topics.

## Exports

| Export specifier                                      | Module                   | Exports | Purpose                                                                                                                              |
| ----------------------------------------------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/plugin-streams-core`                      | `./mod.ts`               | 62      | Schema definition, the durable producer, endpoint resolution, diagnostics, and the v1 producer port vocabulary (documented below).   |
| `@netscript/plugin-streams-core/admin`                | `./admin.ts`             | 1       | Upstream whole-stream administrative adapter; helpers and versioned contracts live in the root.                                      |
| `@netscript/plugin-streams-core/sse`                  | `./src/sse/mod.ts`       | 33      | The single versioned authority for the stream SSE wire contract: named-frame parsing, validated consumer outcomes, and replay state. |
| `@netscript/plugin-streams-core/telemetry`            | `./src/telemetry/mod.ts` | 33      | Telemetry registration, span names, attribute keys, and the meter/counter/gauge ports used by reconnect metrics.                     |
| `@netscript/plugin-streams-core/testing`              | `./src/testing/mod.ts`   | 4       | An in-memory producer and a small schema fixture for tests that must not open network sockets.                                       |
| `@netscript/plugin-streams-core/integration/commands` | `./commands.ts`          | 18      | Checked producer-delivery sink for the service command relay.                                                                        |

Export counts are the symbol counts `deno doc` reports for each entrypoint; a few domain types are
re-exported through more than one subpath.

## Root surface (`@netscript/plugin-streams-core`)

### Schema definition

| Symbol                          | Kind       | Description                                                               |
| ------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `defineStreamSchema`            | function   | Define a type-safe durable stream schema.                                 |
| `StreamStateDefinition`         | type alias | Input map accepted by `defineStreamSchema`.                               |
| `StateSchema`                   | type alias | Schema map returned by `defineStreamSchema`.                              |
| `CollectionDefinition`          | interface  | A single collection definition inside a durable stream schema.            |
| `CollectionEventHelpers`        | interface  | Helper methods attached to collections by `@durable-streams/state`.       |
| `CollectionWithHelpers`         | type alias | Collection definition after durable-streams helper methods are attached.  |
| `StreamStandardSchema`          | interface  | Package-owned Standard Schema surface used by durable stream collections. |
| `StreamSchemaIssue`             | interface  | One validation issue returned by a Standard Schema validator.             |
| `StreamSchemaValidationOptions` | interface  | Validation options accepted by Standard Schema validators.                |
| `StreamSchemaValidationResult`  | type alias | Result returned by a Standard Schema validator.                           |

### Producers

| Symbol                         | Kind       | Description                                                               |
| ------------------------------ | ---------- | ------------------------------------------------------------------------- |
| `createDurableStream`          | function   | Create or reuse a compatible durable stream producer for one stream path. |
| `createServiceStreamProducer`  | function   | Create a durable stream producer from a backend Service.                  |
| `DurableStreamProducer`        | class      | Server-side writer for a named durable stream.                            |
| `DurableStreamProducerOptions` | interface  | Options accepted by `DurableStreamProducer`.                              |
| `ServiceStreamProducerOptions` | type alias | Options accepted by `createServiceStreamProducer`.                        |

`createDurableStream` is a **path singleton**: two calls for the same stream path with compatible
options return the same producer rather than opening a second writer.

### Events

| Symbol         | Kind       | Description                                                                |
| -------------- | ---------- | -------------------------------------------------------------------------- |
| `ChangeEvent`  | interface  | Entity change event emitted by durable stream producers.                   |
| `ControlEvent` | interface  | Control event emitted by durable streams for non-entity lifecycle changes. |
| `StateEvent`   | type alias | Durable stream event union.                                                |
| `Operation`    | type alias | State Protocol operation names supported by durable streams.               |

### Endpoint resolution and diagnostics

| Symbol                        | Kind      | Description                                                    |
| ----------------------------- | --------- | -------------------------------------------------------------- |
| `getStreamsUrl`               | function  | Resolve the base URL of the durable streams server.            |
| `getStreamsAuth`              | function  | Resolve authentication headers for the durable streams server. |
| `buildStreamUrl`              | function  | Build the full stream URL for a NetScript stream path.         |
| `inspectStreamTopic`          | function  | Inspect a stream schema and optional producer metadata.        |
| `StreamTopicInspectionInput`  | interface | Input accepted by `inspectStreamTopic`.                        |
| `StreamTopicInspectionReport` | interface | Diagnostic report returned by `inspectStreamTopic`.            |

`inspectStreamTopic` is a pure diagnostic: it reports on a schema and optional producer metadata
without connecting to the streams server.

### Producer port contract (v1)

The `*V1` names are the versioned port contract a producer implementation satisfies and a supervisor
consumes. They describe write acceptance, delivery outcome, reconnection, and buffering as data,
which is what lets the retry policy live outside the transport.

| Symbol                                        | Kind       | Description                                                                   |
| --------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `StreamProducerPort`                          | interface  | Port implemented by stream producers that publish State Protocol changes.     |
| `StreamProducerTransportPort`                 | interface  | Durable-stream protocol edge consumed by the producer supervisor.             |
| `StreamProducerClockPort`                     | interface  | Clock edge used by reconnect backoff.                                         |
| `StreamProducerRandomPort`                    | interface  | Randomness edge used only to jitter reconnect delays.                         |
| `StreamProducerIdentityV1`                    | interface  | Exact producer identity retained across an append retry.                      |
| `StreamProducerConnectInputV1`                | interface  | Connection input for the durable stream transport edge.                       |
| `StreamProducerAppendInputV1`                 | interface  | Append input retained byte-for-byte until acknowledgement.                    |
| `StreamProducerCloseInputV1`                  | interface  | Terminal close input using the next sequence in the same producer epoch.      |
| `StreamProducerAcknowledgementV1`             | interface  | Acknowledgement returned by an append or terminal close.                      |
| `StreamProducerStateSnapshotV1`               | interface  | Snapshot of producer readiness and buffered work.                             |
| `StreamProducerReadinessOptionsV1`            | interface  | Options for waiting on the next ready transition.                             |
| `StreamProducerBufferPolicyV1`                | interface  | Dual queue bounds for accepted durable stream writes.                         |
| `StreamProducerReconnectPolicyV1`             | interface  | Finite retry policy used for connection and delivery attempts.                |
| `StreamProducerTransportFailureV1`            | interface  | Transport failure understood by the application supervisor.                   |
| `StreamProducerTransportFailureKindV1`        | type alias | Stable failure categories translated by the durable-stream transport adapter. |
| `StreamProducerTransportResultV1`             | type alias | Result of one transport operation without policy or retry decisions.          |
| `StreamProducerLifecycleStateV1`              | type alias | One legal lifecycle state for a reconnecting durable stream producer.         |
| `STREAM_PRODUCER_LIFECYCLE_STATES_V1`         | variable   | Legal lifecycle states for a reconnecting durable stream producer.            |
| `DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1`    | variable   | Default bounded producer buffer policy.                                       |
| `DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1` | variable   | Default bounded reconnect policy.                                             |

### Write outcomes

| Symbol                            | Kind       | Description                                                               |
| --------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `StreamWriteContextV1`            | interface  | Per-write correlation and message identity accepted by stream producers.  |
| `StreamWriteReceiptV1`            | interface  | Immediate acceptance plus eventual terminal outcome for one write.        |
| `StreamWriteOutcomeV1`            | type alias | Terminal outcome of one durable stream write.                             |
| `StreamWriteRejectionReasonV1`    | type alias | Reasons a producer rejects a write before accepting it.                   |
| `StreamWriteCancellationReasonV1` | type alias | Reasons an accepted write is cancelled before its first delivery attempt. |
| `StreamWriteUnknownReasonV1`      | type alias | Reasons an attempted write cannot be reported as delivered or rejected.   |

A write returns a **receipt**, not a boolean: acceptance is immediate, and the terminal outcome —
delivered, rejected, cancelled, or unknown — settles later. `unknown` is a distinct outcome rather
than a failure, because a producer that lost its connection mid-append cannot honestly report either
success or rejection.

## Bounded streams: retention and trim

`StreamRetentionPolicyV1` is a create-time policy accepted by `DurableStreamProducerOptions` and
`StreamProducerConnectInputV1`:

```ts
import type { StreamRetentionPolicyV1 } from '@netscript/plugin-streams-core';

const ttl: StreamRetentionPolicyV1 = { kind: 'ttl', ttlSeconds: 604800 };
const expiry: StreamRetentionPolicyV1 = { kind: 'expires-at', expiresAt: '2030-10-08T00:00:00Z' };
```

TTL must be a positive safe integer; expiry must be valid RFC3339 with a timezone. Construction
validates and copies the policy before connecting. The adapter uses the upstream create options
`ttlSeconds` / `expiresAt`, sending `Stream-TTL` / `Stream-Expires-At` only on PUT. On the shipped
server, TTL is a sliding inactivity window renewed by reads and appends; HEAD and reopening with PUT
do not renew it. TTL cannot bound a continuously active stream. Use absolute expiry or rotating day
segments for a hard bound. Absolute expiry does not slide. Both expire the whole stream. Omitted
retention keeps current behavior. Retention participates in singleton compatibility; rotate segment
paths to change an existing server policy.

| Symbol                         | Kind       | Description                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| `StreamRetentionPolicyV1`      | type alias | Mutually exclusive create-time TTL or absolute expiry.                            |
| `StreamAdminPort`              | interface  | Versioned whole-stream `head` and `delete` requests.                              |
| `StreamAdminInputV1`           | interface  | Resolved URL, service headers, finite timeout, and optional cancellation.         |
| `StreamHeadV1`                 | interface  | Content type, opaque offset, ETag, cache control, and durable EOF state.          |
| `StreamDeletionV1`             | interface  | Typed successful deletion result (`deleted: boolean`).                            |
| `StreamAdminOptionsV1`         | interface  | Helper cancellation, timeout, administrative port, and instrumentation overrides. |
| `headDurableStream`            | function   | Return metadata or `null` for an absent stream.                                   |
| `deleteDurableStream`          | function   | Return `true` when deleted or `false` when already absent.                        |
| `StreamAdminSpanV1`            | interface  | Minimal administrative span lifecycle.                                            |
| `StreamAdminInstrumentationV1` | interface  | Narrow telemetry port satisfied by `StreamsInstrumentation`.                      |
| `StreamAdminError`             | class      | Typed failure thrown by administrative helpers.                                   |
| `DurableStreamAdmin`           | class      | Upstream `DurableStream.head` / `delete` adapter, exported from `./admin`.        |

The port returns the existing `StreamProducerTransportResultV1<T>`. Authorization failures are
`unauthorized`, request deadlines are `timeout`, caller cancellation is `aborted`, transient
transport/server failures are `retryable`, and other client failures are `non-retryable`. Helpers
throw `StreamAdminError` retaining that failure; absence is a successful `null`/`false` result.
Requests default to 5,000 ms and perform one attempt, leaving retry policy to background workers.
The shared failure union now includes `unauthorized` and `timeout`; exhaustive consumers must handle
these new categories. Producer adapters still report retryable request failures as `retryable`;
`timeout` alone does not opt a custom producer transport into retries. Both helpers emit client
spans through `StreamsInstrumentation` (`stream.head`, `stream.delete`).

Use these helpers in background workers or triggers under a service identity resolved by
`buildStreamUrl` and `getStreamsAuth`. The app is an interface and need not remain open.
`DurableStreamProducer.delete(collection, key)` appends a tombstone; it does not reclaim stream
storage. Stop a segment's producer before deleting it to prevent a reconnect from recreating it.
Offset trim and server-side listing remain future protocol capabilities. The
[stream retention how-to](/durable-workflows/how-to/bound-stream-retention/) pairs server retention
with a scheduled trigger and background deletion worker, including day-baseline guidance.

## The SSE contract (`@netscript/plugin-streams-core/sse`)

The `./sse` subpath is the single runtime authority for NetScript's versioned stream SSE envelope.
It distinguishes the **wire** event names the durable-stream server emits from the **consumer**
event names a validated binding delivers, so a consumer never branches on an unvalidated frame.

| Symbol                               | Kind       | Description                                                                      |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------- |
| `STREAM_SSE_CONTRACT_V1`             | variable   | Single runtime authority for NetScript's versioned stream SSE envelope.          |
| `STREAM_SSE_PROTOCOL_VERSION_V1`     | variable   | Version identifier for the first NetScript stream SSE consumer contract.         |
| `STREAM_SSE_WIRE_EVENT_NAMES_V1`     | variable   | Actual event names emitted by the durable-stream SSE wire protocol.              |
| `STREAM_SSE_CONSUMER_EVENT_NAMES_V1` | variable   | Validated outcomes delivered by the NetScript SSE consumer binding.              |
| `parseStreamSseEventV1`              | function   | Parse a named SSE frame through the single v1 contract authority.                |
| `bindStreamEventSourceV1`            | function   | Bind named `data` and `control` listeners using schema-validated v1 outcomes.    |
| `createStreamSseReplayStateV1`       | function   | Create an empty or caller-seeded v1 replay snapshot.                             |
| `reduceStreamSseReplayStateV1`       | function   | Apply one valid frame while committing replay progress only on a control frame.  |
| `StreamEventSourceV1`                | interface  | Minimal native `EventSource` surface used at the browser edge and in tests.      |
| `StreamEventSourceBindingV1`         | interface  | Disposable browser binding and immutable replay snapshot accessor.               |
| `StreamSseReplayStateV1`             | interface  | Replay snapshot consumed by reconnect policy without owning that policy.         |
| `StreamSseOffsetV1`                  | type alias | A server-owned replay token — opaque, never parsed or incremented by a consumer. |

Replay progress commits **only on a control frame**: `reduceStreamSseReplayStateV1` applies a valid
data frame without advancing the committed offset, so a consumer that reconnects mid-batch replays
from the last acknowledged control point rather than skipping the tail of an interrupted batch.
Errors are normalized into `StreamSseErrorPayloadV1` and never advance replay state.

## Telemetry and testing

`@netscript/plugin-streams-core/telemetry` exposes `streamsInstrumentation` — a registration object
matching the minimal contract NetScript telemetry hosts understand — plus `StreamSpanNames`,
`StreamAttributes`, and `StreamProducerMetricNames`. The meter, counter, gauge, tracer, and span
ports are declared here as interfaces, so a producer emits reconnect metrics without importing an
OpenTelemetry SDK.

`@netscript/plugin-streams-core/testing` provides `MemoryStreamProducer` (records
`MemoryStreamEvent`s instead of opening a socket) and `createStreamTopicFixture` (a small schema
with one `execution` collection). Tests written against these run without network permissions.

## Related pages

- [`@netscript/plugin-streams`](/reference/streams/) — the deployable streams plugin and service.
- [`@netscript/plugin-workers-core`](/reference/plugin-workers-core/) and
  [`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/) — both project their records into
  durable topics through this producer.

---

Back to the [reference overview](/reference/).

## Checked command sink

`createStreamCommandOutboxSink` uses the existing `StreamProducerPort` with an explicit
upsert/delete payload envelope. Stable outbox message identity and correlation are passed through
the supported context and serialized in State Protocol headers. Existing producer instrumentation
owns W3C context and the producer owns all buffering/retries. The sink awaits `delivered`
completion; FIFO acceptance, rejection, cancellation and delivery-unknown cannot settle. Native
duplicate acknowledgements count as delivery. Relay redelivery starts a new producer operation with
the same message identity, so downstream processing must be independently idempotent. Cancellation
is cooperative around completion; the supplied producer retains lifecycle and permission ownership.

| Symbol                          | Kind       | Description                                          |
| ------------------------------- | ---------- | ---------------------------------------------------- |
| `createStreamCommandOutboxSink` | function   | Compose a checked existing-producer delivery sink.   |
| `StreamCommandSinkOptions`      | type alias | Relay registry identity and consumer-owned producer. |
| `CommandJson`                   | type alias | Service-owned canonical decoded payload.             |
| `CommandTraceContext`           | type alias | Service-owned validated W3C fields.                  |
| `CommandOutboxDelivery`         | type alias | Service-owned decoded delivery.                      |
| `CommandOutboxSink`             | interface  | Service-owned documented acceptance boundary.        |
| `CommandOutboxAcceptance`       | type alias | Service-owned normalized identity/time.              |
