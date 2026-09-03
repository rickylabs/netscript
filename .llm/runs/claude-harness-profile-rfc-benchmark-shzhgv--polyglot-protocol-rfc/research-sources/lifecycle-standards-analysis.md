# RFC-5 Reverse-Engineering Analysis — group `lifecycle-standards`

Analyst pass over the extracts in `lifecycle-standards-raw-1.md` (systemd sd_notify, gRPC Health
Checking) and `lifecycle-standards-raw-2.md` (CloudEvents v1.0.2 core + JSON format + distributed
tracing extension, W3C Trace Context, OTel env-carrier RC, OTel SDK env vars, OTLP exporter
config). Every claim below cites its extract; anything not directly supported is marked
UNVERIFIED. Analysis is against the current NetScript polyglot engine: env `TASK_ID` +
`TASK_PAYLOAD` in, last-JSON-line-of-stdout out (`TaskResult {success:boolean}` + bag),
`error: string|null` + `exitCode`, queue path drops `TRACEPARENT`/`CORRELATION_ID` (bug D-4),
no progress/cancel/heartbeat/attempt, one-shot spawn.

---

## 1. Message / verb inventory with wire shapes

### 1.1 systemd sd_notify (raw-1, Source 1)

One verb, many assignments. The entire protocol is a **single upstream message type**: a datagram
of "newline-separated variable assignments, similar in style to an environment block", sent to the
`AF_UNIX`/`AF_VSOCK` socket named by `$NOTIFY_SOCKET`, whole payload as one `SOCK_DGRAM` datagram,
accompanied by `SCM_CREDENTIALS` (raw-1 §"Message format"). There are no replies except via the
explicit `BARRIER=1` synchronization message.

Assignment vocabulary is a flat key=value namespace (raw-1 table), grouped by function:

| Group | Keys | Wire shape |
|---|---|---|
| Lifecycle state | `READY=1`, `RELOADING=1`, `STOPPING=1` | boolean; only `1` defined (`READY=0` explicitly undefined) |
| Timestamps | `MONOTONIC_USEC=…` | decimal microseconds, CLOCK_MONOTONIC |
| Human status | `STATUS=…` | free-form UTF-8 single line |
| Errors | `ERRNO=…` (decimal int), `BUSERROR=…` (D-Bus error id string), `VARLINKERROR=…` (Varlink error id), `EXIT_STATUS=…` (int, informational only) |
| Identity | `MAINPID=…`, `MAINPIDFDID=…`, `MAINPIDFD=1` | PID / pidfd inode / attached-fd reference |
| Watchdog | `WATCHDOG=1` (ping), `WATCHDOG=trigger` (force action), `WATCHDOG_USEC=…` (runtime reset of timeout) |
| Deadline extension | `EXTEND_TIMEOUT_USEC=…` | decimal µs, extends the *current* state's timeout (start/stop/reload) |
| Restart control | `RESTART_RESET=1` | resets restart counter/backoff |
| FD store | `FDSTORE=1`, `FDSTOREREMOVE=1`, `FDNAME=…` (≤255 chars, no control chars, no `:`), `FDPOLL=0` | fds attached to the datagram, max 253 |
| Sync | `BARRIER=1` | MUST be sent alone, exactly one attached fd |

Key wire property: **unknown assignments are safely ignored** — "new keys may be added without
breaking older managers" (raw-1, notes). Forward compatibility is achieved without any version
field at all.

### 1.2 gRPC Health Checking (raw-1, Source 2)

Two verbs, two messages, one enum — reproduced verbatim in the extract:

- `Check(HealthCheckRequest) returns (HealthCheckResponse)` — unary poll.
- `Watch(HealthCheckRequest) returns (stream HealthCheckResponse)` — server-streaming; server
  sends current status immediately, then a new message on every status change.
- `HealthCheckRequest { string service = 1; }` — empty string `""` = whole-server health.
- `HealthCheckResponse.ServingStatus`: `UNKNOWN=0`, `SERVING=1`, `NOT_SERVING=2`,
  `SERVICE_UNKNOWN=3` (Watch-only).
- Transport-status split: registered service → gRPC `OK` with payload status; unregistered name →
  gRPC `NOT_FOUND`. Health-of-the-thing and success-of-the-query are separate channels.

### 1.3 CloudEvents v1.0.2 (raw-2, Sources 3–4)

Not verbs — a **context envelope** contract:

- REQUIRED: `id` (String, unique per `source`; `source`+`id` = dedup key), `source`
  (URI-reference), `specversion` (`"1.0"`, major.minor only), `type` (String, reverse-DNS
  prefixed, "used for routing, observability, policy enforcement").
- OPTIONAL: `datacontenttype` (RFC 2046; absent ⇒ implied `application/json` in JSON format),
  `dataschema` (URI; "incompatible changes … SHOULD be reflected by a different URI"), `subject`,
  `time` (RFC 3339).
- Extensions: any number, same naming rules (lowercase a–z0–9, SHOULD ≤20 chars), same type
  system, serialized as **top-level JSON properties** (raw-2 §JSON format).
- JSON envelope media type `application/cloudevents+json`; batch is a JSON array with media type
  `application/cloudevents-batch+json` and is a *separate, optional* format.
- `data` vs `data_base64` are mutually exclusive; `null` data is distinct from absent data;
  a string `data` member MUST NOT be re-parsed as a JSON document.
- Binary-mode HTTP: attributes become `ce-*` headers, payload stays raw (raw-2 examples).

### 1.4 W3C Trace Context (raw-2, Source 6)

Two headers, fixed grammar:

- `traceparent` = `version "-" trace-id "-" parent-id "-" trace-flags`; version `00`; `ff`
  forbidden; trace-id 32 lowercase hex (all-zero invalid), parent-id 16 lowercase hex (all-zero
  invalid), flags 2 hex with bit 0 = sampled, bit 1 = random-trace-id. Invalid trace-id ⇒ ignore
  the whole header; invalid parent-id ⇒ ignore the header.
- `tracestate` = comma-separated `key=value` list, max 32 members, values printable ASCII minus
  `,`/`=`, ≥512 chars SHOULD be propagated, modified keys move left, vendors SHOULD NOT delete
  keys they didn't create, oversize entries (>128 chars) removed first.

### 1.5 OTel env carrier + SDK/OTLP env vars (raw-2, Sources 7–9)

- Env-carrier key normalization: uppercase, non-alphanumerics→`_`, digit-leading names prefixed
  `_`, pattern `^[A-Z_][A-Z0-9_]*$`; so `traceparent`→`TRACEPARENT`, `tracestate`→`TRACESTATE`,
  `baggage`→`BAGGAGE`. Carrier MUST be format-agnostic and treat values as opaque strings;
  propagators own parsing. (Spec status: Release Candidate.)
- SDK config is itself an env-var protocol: `OTEL_SDK_DISABLED`, `OTEL_SERVICE_NAME`,
  `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_PROPAGATORS` (default `tracecontext,baggage`), sampler vars,
  BSP batching knobs, attribute limits, exporter selection per signal, and the full
  `OTEL_EXPORTER_OTLP_*` endpoint/protocol/TLS/headers/timeout/compression family with
  signal-specific overrides and documented path-append rules (`/v1/traces` etc.).

---

## 2. Lifecycle state machine as the systems actually implement it

### 2.1 systemd's implied service state machine (raw-1, Source 1)

The extract never draws the machine, but the assignment vocabulary defines it precisely:

```
spawned ──READY=1──▶ running ──STOPPING=1──▶ stopping ──exit──▶ done
              ▲          │
              └RELOADING=1┘   (reload finishes with another READY=1)
```

Observations grounded in the extract:

- **States are announced by the child, not inferred by the parent.** The manager learns
  "startup finished" only from `READY=1`; "shutting down" only from `STOPPING=1`. NetScript today
  has zero equivalents — spawn success is silently assumed to mean ready.
- **Only positive transitions exist.** `READY=0` is undefined; you cannot "un-ready". Failure is
  expressed on a *separate axis* (`ERRNO=`/`BUSERROR=`/exit status), not as a state assignment.
- **Each pending transition has a timeout, and the child can extend it** (`EXTEND_TIMEOUT_USEC=`
  applies to "the current state (start/stop/reload)").
- **The protocol is degrade-to-noop.** `sd_notify` returns 0 when `$NOTIFY_SOCKET` is unset — an
  unsupervised process calling the API is a documented no-op, so instrumented binaries run
  unchanged outside the supervisor. This is the single most transferable design property in the
  whole group for NetScript Tier-0 conformance.
- Delivery is fire-and-forget: success means *enqueued*, not *processed*; `BARRIER=1` exists as an
  explicit opt-in synchronization point.

### 2.2 gRPC health's state machine (raw-1, Source 2)

Per-service status register with four values; transitions are unconstrained by the spec (a server
"may choose to reply unhealthy because it is not ready to take requests, it is shutting down or
some other reason"). What's implemented, per the doc:

- Server maintains an explicit registry: every service name registered manually, plus the `""`
  key for aggregate health.
- `Watch` is edge-triggered after an initial level read: immediate current status, then one
  message per change.
- **Absence is a defined state**: `SERVICE_UNKNOWN` for a name Watch can't find yet, `NOT_FOUND`
  gRPC status for Check on unregistered names, and clients must "handle the case where server
  does not have the Health service" at all. The state machine budgets for partial deployment.

### 2.3 CloudEvents / trace-context

No lifecycle machine — these are envelope/propagation standards. Their contribution to lifecycle
is identity (`source`+`id` dedup contract, raw-2 §`id`) and causality (`traceparent` parent-id
chaining), which is what lets *external* systems reconstruct a lifecycle from an event stream.

### 2.4 Mapping to NetScript's actual machine

Current polyglot lifecycle is degenerate: `spawned → exited`, with the result inferred from exit
code + last stdout line. Every standard in this group splits that into (a) child-announced states,
(b) supervisor-enforced deadlines per state, (c) an error axis orthogonal to the state axis.
That three-way split is the shape RFC-5's lifecycle pillar should adopt.

---

## 3. Heartbeat / cancellation / deadline mechanics

### 3.1 Heartbeats (systemd watchdog — the only true heartbeat in the group)

- Liveness is **child-push, not parent-poll**: the child sends `WATCHDOG=1` periodically;
  requires `WatchdogSec=` armed on the supervisor side (raw-1 table). The interval contract is
  configured out-of-band; the child can *renegotiate at runtime* with `WATCHDOG_USEC=`.
- The child can also request its own execution: `WATCHDOG=trigger` "immediately trigger the
  configured watchdog action" — a self-report of "I am wedged, kill me". No NetScript analog
  exists; it is a cheap, high-value verb.
- gRPC health is the inverse model: parent-poll (`Check` + client-set deadline) or
  parent-subscribe (`Watch` stream). The client-side rule "declare the server unhealthy if the
  rpc is not finished after some amount of time" makes **timeout-equals-unhealthy** a normative
  client obligation, not an implementation choice.

### 3.2 Deadlines

- gRPC: "a deadline should be set on the rpc" — deadline lives with the *caller*, always.
- systemd: deadlines are *per lifecycle state* (start/stop/reload timeouts), and the child holds
  an escape hatch: `EXTEND_TIMEOUT_USEC=` lets a slow-but-alive task buy time incrementally
  instead of the supervisor choosing one giant static timeout. This "lease renewal" model is
  directly stealable for long polyglot tasks.
- OTLP: every exporter call has `OTEL_EXPORTER_OTLP_TIMEOUT` default 10s (raw-2, Source 9) —
  timeouts are configuration surface with documented defaults, not code constants.

### 3.3 Cancellation

- **Nothing in this group defines a downstream cancellation verb.** sd_notify is
  child→supervisor only (systemd cancels by signal, which is outside the extracted text —
  UNVERIFIED here); gRPC health only reports status; CloudEvents/trace-context carry no control
  flow. The closest artifacts are cooperative-shutdown *announcements*: `STOPPING=1` (child tells
  parent it is winding down) and `NOT_SERVING` (server tells clients to drain).
- Consequence for RFC-5: the supervisor→task cancellation channel must be designed from other
  source groups or first principles; what this group contributes is the *acknowledgement*
  vocabulary (a task that receives cancel should answer with a STOPPING-like state so the
  supervisor can distinguish "cancelling gracefully" from "ignoring me", plus a per-state stop
  deadline after which escalation to kill is legitimate).

---

## 4. Error taxonomy — retryable vs terminal representation

No source in this group carries an explicit `retryable: boolean`. Each encodes the distinction
structurally:

- **systemd** (raw-1): errors are *coded, multi-namespace, machine-readable*: `ERRNO=` (numeric
  errno), `BUSERROR=` (reverse-DNS D-Bus error identifier, e.g.
  `org.freedesktop.DBus.Error.TimedOut`), `VARLINKERROR=` (Varlink id), `EXIT_STATUS=`
  (informational). Retry policy lives entirely on the supervisor side (restart counters,
  backoff), and the child gets exactly one verb into that policy: `RESTART_RESET=1` resets the
  restart counter/backoff — i.e. "I am healthy now, forgive prior failures". The taxonomy is
  namespaced-code + supervisor-owned-policy + child-hint.
- **gRPC health** (raw-1): a three-way split doing the retryable/terminal work implicitly:
  `NOT_SERVING` (exists, don't send work — a *retryable-later* condition), `NOT_FOUND` (name
  unregistered — config/addressing error, terminal for that request), client-timeout (unknown
  liveness — retry against another backend). `UNKNOWN=0` as the proto zero-value means an
  unset/default status can never be confused with an asserted healthy one.
- **W3C trace-context** (raw-2): error handling is *ignore-and-regenerate*: invalid trace-id or
  parent-id ⇒ "vendors MUST ignore the entire header". Malformed observability metadata never
  fails the request — a normative severity ordering (work > telemetry) RFC-5 should copy verbatim
  for its trace fields.
- **CloudEvents** (raw-2): no error model, but `source`+`id` duplicate semantics ("consumers MAY
  assume that Events with identical source and id are duplicates") is the substrate that makes
  at-least-once retry *safe* — a retry taxonomy without a dedup key is incomplete.

Against NetScript's `error: string|null` + `exitCode`: the composite steal is a structured error
object with (a) a namespaced, reverse-DNS-style code (BUSERROR pattern), (b) a human message
(STATUS pattern: single-line, free-form, for humans only), (c) an explicit retryable/terminal
discriminator that this group shows everyone needs and nobody standardized — RFC-5 must define it
itself, and can, because unlike systemd, NetScript's supervisor and protocol are co-designed.

---

## 5. Versioning + capability negotiation

Four distinct strategies appear, one per source family:

1. **No version, ignore-unknown** (sd_notify): forward compatibility purely via "unknown
   assignments are ignored". Capability negotiation is *environmental presence*: `$NOTIFY_SOCKET`
   set ⇒ protocol available; absent ⇒ no-op. Zero handshake round-trips.
2. **Version-in-every-message** (CloudEvents `specversion`, REQUIRED, `"1.0"`, patch-invisible;
   batch constraint: all events in a batch share one `specversion`). Schema evolution of the
   payload is delegated to `dataschema` URIs ("incompatible changes SHOULD be reflected by a
   different URI") — envelope version and payload schema version are deliberately separate axes.
3. **Version-prefix with parse-forward rule** (traceparent): 2-hex version field leading the
   value; version `ff` forbidden. (The extract states version 00 is specified; the
   parse-higher-versions-as-00 forward rule is in the full W3C spec but not in the extract —
   UNVERIFIED here.)
4. **Package-versioned service + graceful absence** (gRPC health `grpc.health.v1`): version in
   the namespace; negotiation replaced by the client obligation to tolerate the service being
   entirely absent, and `SERVICE_UNKNOWN`/`NOT_FOUND` for partial registration.

Notable negative result: **no source performs runtime capability negotiation** (no
handshake/hello exchange). All five achieve interop with declare-and-tolerate: env presence,
ignore-unknown-keys, per-message version stamp, or tolerate-absence. For RFC-5's tiered
conformance this is strong evidence that Tier 0 can be handshake-free: version stamped on each
message + unknown-field tolerance + supervisor infers tier from which messages the task actually
emits (a task that never sends a hello is Tier 0 by observation, exactly like a service that
never calls sd_notify).

---

## 6. Transport + framing choices, and why

| Source | Transport | Framing | Why (as stated/derivable from extract) |
|---|---|---|---|
| sd_notify | `AF_UNIX` `SOCK_DGRAM` (path, `@`abstract, or `vsock:CID:PORT`), addressed via env var | one datagram = one message; newline-separated k=v inside | datagram atomicity gives message framing for free (no stream reassembly); `SCM_CREDENTIALS` gives kernel-verified sender identity; env-var addressing makes the channel discoverable and optional; vsock extends the same contract across VM boundaries |
| gRPC health | in-band gRPC service on the same server | protobuf unary + server-stream | explicit rationale verbatim: same format as a normal rpc; rich semantics (per-service status); reuses existing auth/billing/quota so the server controls access to health data |
| CloudEvents | transport-agnostic; per-protocol bindings | structured mode (whole event in body, `application/cloudevents+json`) vs binary mode (attributes as `ce-*` metadata, payload raw) vs batch (JSON array, separate media type, optional) | lets intermediaries route on metadata without parsing payloads (binary mode / `subject` rationale in extract); JSON format is the mandatory baseline ("All implementations MUST support the JSON format") |
| trace-context | HTTP headers (case-insensitive single-word name for cross-protocol portability) | fixed-grammar ABNF string | interop across protocols; strict grammar makes validation cheap and ignore-on-invalid safe |
| OTel env carrier | process environment | opaque string values under normalized keys | "environment variables propagate context across process boundaries where network protocols do not apply — batch systems, CI/CD, and command-line tools"; carrier stays format-agnostic; MUST NOT spawn children to propagate |
| OTLP exporter | gRPC :4317 or HTTP :4318, selected by `OTEL_EXPORTER_OTLP_PROTOCOL` (`grpc`, `http/protobuf`, `http/json`) | protobuf or JSON over the chosen transport | transport is *configuration*, one wire schema; per-signal endpoint/protocol overrides |

Synthesis for NetScript: the group cleanly splits **spawn-time context injection = environment**
(OTel carrier legitimizes exactly the `TASK_ID`/`TASK_PAYLOAD`+`TRACEPARENT` pattern NetScript
already half-has) from **runtime messaging = a discoverable, message-framed channel whose address
arrives in an env var and whose absence downgrades to no-op** (sd_notify). NetScript's current
"last JSON line of stdout" is a self-framed message channel too — NDJSON on stdout/stderr or on a
socket named by env var both satisfy the sd_notify shape; the datagram lesson is *one line = one
complete message, atomically*, never multi-line framing.

---

## 7. STEAL CANDIDATES for the NetScript protocol

Each: what to steal, extract citation, NetScript pillar, conformance tier.

- **S1 — Env-var channel discovery with documented no-op degradation.** Supervisor sets e.g.
  `NETSCRIPT_NOTIFY` (fd/socket/pipe address); SDK verbs return "not supervised" (sd_notify
  returns 0) when absent, so instrumented task code runs unchanged under bare `deno run`/`python`.
  [raw-1 §Return-value semantics, §`$NOTIFY_SOCKET` contract] — Pillar: communication —
  **Tier 0** (the *contract* that absence is safe is what makes higher tiers optional).
- **S2 — Flat k=v / single-JSON-object event messages with mandatory ignore-unknown-keys.**
  Adding protocol keys must never break older supervisors or older SDKs. [raw-1 "unknown
  assignments are ignored, so new keys may be added without breaking older managers"; mirrors
  CloudEvents extension attributes, raw-2] — Pillar: interop — **Tier 0** (normative parser rule).
- **S3 — Child-announced lifecycle verbs `READY` / `STOPPING` (+ per-state deadlines).**
  Distinguish spawned-vs-ready (matters once tasks warm up runtimes/models) and
  draining-vs-wedged on cancel. Only positive transitions; failure stays on the error axis.
  [raw-1 state table; `READY=0` undefined] — Pillar: lifecycle — **Tier 1**.
- **S4 — Watchdog heartbeat: child-push `WATCHDOG=1` + runtime-tunable interval + self-kill
  `WATCHDOG=trigger`.** Gives NetScript hang detection for long polyglot tasks with zero polling
  infrastructure; the task saying "I'm wedged, restart me" is a verb no ad-hoc design thinks of.
  [raw-1 table: `WATCHDOG=1`, `WATCHDOG=trigger`, `WATCHDOG_USEC=`] — Pillar: lifecycle —
  **Tier 2**.
- **S5 — Deadline extension as lease renewal (`EXTEND_TIMEOUT_USEC`).** Progress-reporting tasks
  buy bounded time increments instead of the queue provider guessing one static visibility
  timeout; composes naturally with `reportProgress` parity for polyglot. [raw-1 table] —
  Pillar: lifecycle — **Tier 2**.
- **S6 — Namespaced structured error codes + separate human `STATUS` line + child restart hint.**
  Replace `error: string|null` with `{code: "dev.netscript.task.Timeout"-style reverse-DNS id,
  message, retryable}`; reverse-DNS code namespace per BUSERROR/CloudEvents `type`; keep the
  human free-form string as a distinct field, never parsed. `RESTART_RESET` shows the child may
  *hint* retry policy but the supervisor owns it. [raw-1 `ERRNO=`/`BUSERROR=`/`STATUS=`/
  `RESTART_RESET=1`; raw-2 CloudEvents `type` reverse-DNS constraint] — Pillar: lifecycle —
  **Tier 0** for the result envelope's error shape (terminal result), Tier 1 for mid-run error
  events.
- **S7 — CloudEvents-shaped event envelope: `id`, `source`, `specversion`, `type`, `time`, and
  the `source`+`id` dedup contract.** Make every protocol message (progress, log, state change,
  result) a typed event with producer-unique id — this is what makes queue-level at-least-once
  delivery and result dedup safe, and makes NetScript events forwardable to any CloudEvents
  consumer for free. [raw-2 Source 3 REQUIRED attributes, `id` dedup quote] — Pillar: interop +
  observability — **Tier 1** (Tier 0 result envelope carries `specversion` + `type` only).
- **S8 — Version-in-every-message, major.minor, patch-invisible; payload schema versioned
  separately by URI/`dataschema`.** One `specversion`-like field on the envelope; task-payload
  contracts (zod schemas on the oRPC surface) version independently — matches CloudEvents' split
  exactly and avoids coupling protocol bumps to task-schema bumps. [raw-2 `specversion` +
  `dataschema` constraints] — Pillar: interop — **Tier 0**.
- **S9 — OTel env-carrier normalization for context injection — fixes D-4 by standard.** Inject
  `TRACEPARENT`, `TRACESTATE`, `BAGGAGE` (exact normalized names derived in the extract) on
  *every* spawn path including the queue path; treat values as opaque strings in the carrier;
  propagate NetScript's `correlationId` as a `baggage`/`tracestate` entry rather than a bespoke
  var (UNVERIFIED which of the two is the better fit — baggage semantics are not in these
  extracts). [raw-2 Source 7 normalization + opaque-value MUSTs] — Pillar: observability —
  **Tier 0** (pure supervisor-side; zero task cooperation needed).
- **S10 — Multi-hop trace rule from the CloudEvents tracing extension.** For queued tasks:
  message-level trace metadata carries the *originating* trace of the transmission, not
  per-hop spans; per-hop context rides the protocol/env layer. Directly answers how
  `traceparent` should behave across enqueue→dequeue→spawn without conflating the two layers.
  [raw-2 Source 5 usage rules] — Pillar: observability — **Tier 0/1** (supervisor-side rule).
- **S11 — Ignore-and-continue on malformed telemetry fields.** Invalid `traceparent` ⇒ drop the
  field (optionally regenerate), never fail the task; strict ABNF-style validation makes
  "invalid" cheap to decide. [raw-2 Source 6: "vendors MUST ignore the entire header"] —
  Pillar: observability — **Tier 0** (normative supervisor behavior).
- **S12 — Health/status query shape for long-running or Tier-2 workers: per-unit status registry,
  `""` aggregate key, `UNKNOWN` zero value, Watch = level-then-edges, tolerate-absence client
  rule, timeout-means-unhealthy.** The right shape for the workers HTTP surface (oRPC) to expose
  task/worker health to Aspire and LB-style consumers; also the model for a future `Watch`-style
  progress stream (initial snapshot then deltas). [raw-1 Source 2, verbatim proto + client
  obligations] — Pillar: observability + communication — **Tier 2** (protocol), with the
  *client-side* tolerate-absence rule normative from **Tier 0**.
- **S13 — Structured-vs-binary content modes for task payload/result.** `datacontenttype` +
  `data`/`data_base64` mutual exclusion, implied `application/json`, and "never double-encode
  JSON as a string" give NetScript a standards-tested answer for non-JSON polyglot outputs
  (binary artifacts, text blobs) instead of forcing everything through the JSON-line result bag.
  [raw-2 Source 4 §3.1] — Pillar: interop — **Tier 1**.
- **S14 — Timeouts/endpoints as documented-default configuration, per-signal overridable.** The
  OTLP pattern (base var + specific override + documented default + path-append rules) is the
  template for NetScript protocol knobs (heartbeat interval, notify address, result-size limits)
  living in `.llm/tools/agentic/config/`-style single-home config rather than code constants.
  [raw-2 Source 9] — Pillar: communication — **Tier 1**.

## 8. Anti-patterns to avoid (grounded in what the standards forbid or conspicuously avoid)

- **A1 — Boolean-flag state with undefined negatives, copied naively.** systemd defines only
  `READY=1` and leaves `READY=0` undefined — fine for an append-only ratchet, but NetScript
  should not express *failure* as a state value at all; keep the error axis separate (systemd
  does: `ERRNO`, exit status). Do not invent `READY=false`.
- **A2 — Treating enqueue as delivery.** sd_notify's return "indicates only that the message was
  enqueued properly, not that the service manager successfully processed it" [raw-1]. RFC-5 SDK
  verbs must document the same, and offer an explicit BARRIER-like sync verb rather than
  pretending sends are confirmed.
- **A3 — Multi-message framing / partial messages.** The whole sd_notify payload is one datagram;
  `BARRIER=1` MUST be sent alone [raw-1]. Never let a NetScript protocol message span stdout
  lines, and never mix a sync verb with other assignments in one message.
- **A4 — Failing work on malformed telemetry.** trace-context mandates ignore-on-invalid
  [raw-2 S6]. A polyglot task must never fail because its `TRACEPARENT` was garbage.
- **A5 — Double-encoding JSON as strings, and conflating null with absent.** The JSON format
  spec explicitly forbids re-parsing a string `data` member and distinguishes `"data": null`
  from missing `data` [raw-2 S4]. NetScript's result-bag parsing must preserve both rules.
- **A6 — Wildcards and clever matching in registries.** gRPC health: "just do exact matching of
  the service name without support of any kind of wildcard matching" [raw-1]; extensions are
  out-of-band agreements. Keep NetScript task-type/health keys exact-match.
- **A7 — Zero-value that means something.** gRPC reserves `UNKNOWN=0` so a default-initialized
  status can't masquerade as `SERVING`. Any NetScript enum (state, error class) must reserve the
  zero/default member for "unknown", never for "success".
- **A8 — Version fields that churn on patch releases.** CloudEvents `specversion` hides patch
  numbers [raw-2 S3]; traceparent forbids `ff` [raw-2 S6]. Don't stamp full semver on the wire;
  don't allocate sentinel-ambiguous version values.
- **A9 — Format-aware carriers.** The OTel env carrier MUST treat values as opaque strings
  [raw-2 S7]. NetScript's queue providers (KV/Redis/RabbitMQ) must pass protocol/trace fields
  through untouched — no parsing, no rewriting in the transport layer. (D-4 is the *dropping*
  variant of this sin.)
- **A10 — Mutating others' propagation state.** tracestate: vendors "SHOULD NOT delete keys that
  were not generated by them"; modified keys move left; bounded at 32 entries with documented
  truncation order [raw-2 S6]. Any NetScript-owned entry in shared metadata must follow the same
  hygiene, and shared maps need explicit size bounds + truncation rules from day one.
- **A11 — Unbounded free-form status displacing structured fields.** `STATUS=` is single-line,
  human-only [raw-1]. Do not let a human-readable status string become the field automation
  parses — that is exactly the current `error: string|null` hole being escaped.

---

### Open questions (carried to synthesis)

- Downstream cancellation verb: absent from every source here; needs input from other source
  groups (job-queue systems, agent protocols) or first-principles design; this group only
  supplies the acknowledgement side (`STOPPING`-like ack + stop deadline + escalation).
- `correlationId` propagation home: `baggage` vs `tracestate` entry vs bespoke env var — baggage
  spec text not in these extracts (UNVERIFIED which is semantically correct).
- traceparent forward-parse rule for versions >00 is asserted in the full W3C spec but not
  present in the extract (UNVERIFIED here); matters if RFC-5 copies the version-prefix pattern.
- Whether NetScript's notify channel should be stdout-NDJSON (zero new fds, but competes with
  task's own stdout) vs a dedicated fd/socket named by env var (sd_notify shape, clean
  separation, more per-language SDK work) — the extracts motivate the env-named-channel shape
  but do not settle the stdout trade-off.
