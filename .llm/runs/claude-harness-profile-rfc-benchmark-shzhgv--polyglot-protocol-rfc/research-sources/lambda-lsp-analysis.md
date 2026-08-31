# RFC-5 analysis — group `lambda-lsp`

Analyst pass over the faithful extracts:

- `lambda-lsp-raw-01-lambda-runtime-api.md` (AWS Lambda custom Runtime API + bootstrap contract +
  env surface) — cited below as **[L1 §n]**.
- `lambda-lsp-raw-02-lsp-base-protocol.md` (LSP 3.17 base protocol + lifecycle, 3.18 delta) —
  cited below as **[L2 §n]**.

Analyzed against the current NetScript polyglot engine: env-only input (`TASK_ID` +
`TASK_PAYLOAD`), result = last JSON line of stdout parsed into `TaskResult {success:boolean}+bag`,
queue path drops `TRACEPARENT`/`CORRELATION_ID` (bug D-4), no progress/cancel/heartbeat/attempt
info, `error: string|null` + `exitCode` only, one-shot spawn, while the JS-side `JobContext`
already has correlationId/traceparent/tracestate/reportProgress. The citizenship gap is
polyglot-only.

Anything not directly supported by the extracts is marked **UNVERIFIED**.

---

## 1. Message / verb inventory with wire shapes

### 1.1 Lambda Runtime API (worker-pulls-over-HTTP model)

Four endpoints total — the whole worker protocol is a triad plus an init-error escape hatch
[L1 §2]:

| Verb | Wire shape | Direction |
|---|---|---|
| `GET /{ver}/runtime/invocation/next` | Long-poll. **Body** = raw invocation payload (opaque JSON). **All metadata in response headers**: `Lambda-Runtime-Aws-Request-Id`, `Lambda-Runtime-Deadline-Ms` (absolute Unix ms), `Lambda-Runtime-Invoked-Function-Arn`, `Lambda-Runtime-Trace-Id` (X-Ray `Root=…;Parent=…;Sampled=…`), `Lambda-Runtime-Client-Context`, `Lambda-Runtime-Cognito-Identity` [L1 §2.1] | worker → platform (pull) |
| `POST /{ver}/runtime/invocation/{AwsRequestId}/response` | Body = raw result payload, **no envelope**; correlation via request id **in the path** [L1 §2.2]. Streaming variant: `Lambda-Runtime-Function-Response-Mode: streaming` + `Transfer-Encoding: chunked`, errors-midstream via HTTP **trailers** `Lambda-Runtime-Function-Error-Type` / `-Error-Body` (base64) [L1 §3.4] | worker → platform |
| `POST /{ver}/runtime/init/error` | Header `Lambda-Runtime-Function-Error-Type: <category.reason>` (free-form string, recommended dotted format); body `{errorMessage, errorType, stackTrace: string[]}` [L1 §2.3] | worker → platform |
| `POST /{ver}/runtime/invocation/{AwsRequestId}/error` | Same header + body shape as init error [L1 §2.4] | worker → platform |

Response codes on the error endpoints carry platform-side lifecycle semantics: `202 Accepted`
normally; `500` = "Container error. Non-recoverable state. Runtime should exit promptly"
[L1 §2.3, §2.4] — i.e. the *platform's status code* instructs the worker's lifecycle.

Bootstrapping is env-only: `AWS_LAMBDA_RUNTIME_API` (host:port), `_HANDLER`, `LAMBDA_TASK_ROOT`
[L1 §3.2]; the entrypoint contract is "an executable file named `bootstrap`", with a
well-known error (`Runtime.InvalidEntrypoint`) when absent [L1 §3.1].

### 1.2 LSP base protocol (bidirectional JSON-RPC over a byte stream)

Three message kinds, all JSON-RPC 2.0 [L2 §4]:

- `RequestMessage {jsonrpc:"2.0", id: integer|string, method, params?}` — "Every processed
  request must send a response back."
- `ResponseMessage {id, result? (REQUIRED on success, MUST NOT exist on error), error?:
  ResponseError {code:int, message:string, data?:LSPAny}}`
- `NotificationMessage {method, params?}` — "must not send a response back. They work like
  events."

Base-protocol verbs relevant to RFC-5 (lifecycle set in spec order [L2 §11]):

| Verb | Kind | Shape |
|---|---|---|
| `initialize` | request, client→server, exactly once | `InitializeParams {processId: int\|null, clientInfo?, locale?, initializationOptions?: LSPAny, capabilities: ClientCapabilities, trace?, workspaceFolders?}` → `InitializeResult {capabilities: ServerCapabilities, serverInfo?}`; error data `InitializeError {retry: boolean}` [L2 §11.1–11.3] |
| `initialized` | notification, once | empty params [L2 §11.5] |
| `client/registerCapability` / `unregisterCapability` | request, server→client | `{registrations: [{id, method, registerOptions?}]}` [L2 §11.9] |
| `shutdown` | request | no params; result `null` [L2 §11.6] |
| `exit` | notification | no params; exit code 0 iff shutdown seen first [L2 §11.7] |
| `$/cancelRequest` | notification, bidirectional | `CancelParams {id}` [L2 §7] |
| `$/progress` | notification, bidirectional | `ProgressParams<T> {token: ProgressToken, value: T}`; work-done payloads `begin/report/end` [L2 §8] |
| `$/setTrace` / `$/logTrace` | notifications | `SetTraceParams {value: TraceValue}` [L2 §11.8] |

The `$/` prefix is a formal extension namespace: implementation-dependent messages that receivers
"are free to ignore" (notifications) or must reject with `MethodNotFound` (requests) [L2 §6].

---

## 2. Lifecycle state machine (as actually implemented)

### 2.1 Lambda: init phase → invoke loop, platform-managed

States, per the bootstrap contract [L1 §3.2–3.3]:

1. **Init** (once per environment instance): read env (`_HANDLER`, `LAMBDA_TASK_ROOT`,
   `AWS_LAMBDA_RUNTIME_API`) → load handler + run static/global code → on failure call
   `/runtime/init/error` **and exit immediately**. "Initialization counts towards billed
   execution time and timeout" [L1 §3.2].
2. **Loop** (steps in mandated order [L1 §3.3]): GET `/next` → propagate trace header to
   `_X_AMZN_TRACE_ID` → build context object from env + headers → invoke handler → POST
   `/response` (or `/error`) → cleanup → repeat.
3. **Frozen between events**: "the runtime process might be frozen for several seconds" while
   long-polling `/next` — hence "Do not set a timeout on the GET request" [L1 §2.1].
4. **Terminal on 500**: any 500 from response/error endpoints = "Runtime should exit promptly"
   [L1 §2.3–2.4].

Key structural property: **the worker owns the loop; the platform owns the lifecycle**. The
environment is reused across invocations (warm state, "create static resources … once, and reuse
them for multiple invocations" [L1 §3.2]) — the exact opposite of NetScript's one-shot spawn.
Concurrency is an opt-in variant of the same machine: N workers each independently running the
same pull loop, bounded by `AWS_LAMBDA_MAX_CONCURRENCY`, correlated purely by request id
[L1 §3.5].

### 2.2 LSP: strict client-managed handshake → operating → two-step teardown

"The lifecycle of a server is managed by the client" [L2 §11]. States:

1. **Pre-init**: server started, no `initialize` yet. Requests → error `-32002
   ServerNotInitialized`; notifications dropped **except `exit`** (so a stuck pre-init server can
   still be killed cleanly) [L2 §11.1].
2. **Initializing**: after `initialize` arrives, before `InitializeResult` is sent. Both sides
   gagged except a whitelist (server may send `window/showMessage`, `window/logMessage`,
   `telemetry/event`, and `$/progress` on the client-provided `workDoneToken` only) [L2 §11.1].
   `initialize` "may only be sent once".
3. **Operating**: after client sends `initialized` (once). Dynamic capability
   (de)registration allowed [L2 §11.5, §11.9].
4. **Shutting down**: `shutdown` request = "shut down, but do not exit (otherwise the response
   might not be delivered correctly)". After it, only `exit` is legal from the client; late
   requests → `InvalidRequest` [L2 §11.6].
5. **Exit**: `exit` notification; process exit code 0 iff `shutdown` was received first,
   else 1 — the exit code itself encodes whether teardown was orderly [L2 §11.7].
6. **Orphan-detection backstop**: `InitializeParams.processId` — "If the parent process is not
   alive then the server should exit" [L2 §11.1].

Ordering discipline: responses "in roughly the same order as the requests", reorder only when
"this reordering doesn't affect the correctness of the responses" [L2 §10].

---

## 3. Heartbeat / cancellation / deadline mechanics

### 3.1 Deadline (Lambda)

- Deadline is delivered **per invocation** as an **absolute wall-clock timestamp**
  (`Lambda-Runtime-Deadline-Ms`, "Unix time milliseconds") rather than a relative timeout
  [L1 §2.1]. This survives clock-independent process freezes (the environment can be frozen for
  seconds between invocations [L1 §2.1]) — a relative "you have 30s" would be wrong after a
  freeze; an absolute deadline is not.
- There is **no cancel verb and no heartbeat verb** in the Runtime API extract. Enforcement is
  external: the platform simply stops waiting at the deadline. The worker can *cooperate* by
  reading the deadline, but the platform doesn't depend on it. UNVERIFIED beyond extract: what
  Lambda does to the process at deadline (freeze vs kill) is not stated in the extract.

### 3.2 Cancellation (LSP)

- Cooperative, id-addressed, best-effort: `$/cancelRequest {id}` [L2 §7]. Because it is in the
  `$/` namespace it is *explicitly optional* — a single-threaded server "is free to ignore" it
  [L2 §6]. Graceful degradation is designed into the namespace.
- The cancelled request "still needs to return … It can not be left open / hanging" — the
  response slot must always be filled, with `RequestCancelled (-32800)` advised [L2 §7]. This
  keeps the requester's bookkeeping simple: every id resolves exactly once, cancelled or not.
- Cancellation composes with streaming: on error `RequestCancelled`, already-delivered partial
  results "the client is free to use … but should make clear that the request got canceled and
  may be incomplete"; on any other error the partials must be discarded [L2 §8.2].
- Work-done progress is cancelled implicitly "by simply canceling the corresponding request"
  [L2 §8.1] — no second cancellation channel for progress.

### 3.3 Heartbeat / liveness

- **Neither protocol has an explicit heartbeat verb.** Lambda's liveness signal is implicit in
  the pull loop itself (a worker that calls `/next` is alive); LSP's liveness backstop is
  `processId` parent-watching [L2 §11.1] plus the fact that requests always resolve. `$/progress`
  can serve as a de-facto liveness signal for long operations but is not specified as one
  (that reading is inference, flagging as **UNVERIFIED-as-intent**; the wire mechanics are
  verified [L2 §8]).

### 3.4 Progress (LSP)

- One generic verb (`$/progress`) multiplexes two semantics via **token, not request id**:
  work-done progress (UI: `begin`/`report`/`end`, optional `percentage`, optional `cancellable`
  hint) and partial-result streaming [L2 §8]. "The token is different than the request ID which
  allows to report progress out of band and also for notification" [L2 §8].
- Capability is signalled **per request instance** by the mere presence of
  `workDoneToken`/`partialResultToken` in params — no global capability bit needed for the
  client→server direction [L2 §8.1]. Server-*initiated* progress does need a client capability
  (`window.workDoneProgress`) and a `window/workDoneProgress/create` request; a created token is
  single-use ("one begin, many report and one end") [L2 §8.1].
- Streaming contract: with partial results, the whole result goes through n `$/progress`
  appends and "The final response has to be empty in terms of result values" — one
  authoritative interpretation, no replace-vs-append ambiguity [L2 §8.2].

---

## 4. Error taxonomy — retryable vs terminal representation

### 4.1 Lambda: three orthogonal axes

1. **Phase axis** (which endpoint): `init/error` vs `invocation/{id}/error` distinguishes
   "environment is broken" from "this invocation failed" [L1 §2.3–2.4]. Init failure mandates
   exit; invocation failure returns to the loop.
2. **Type axis** (open string, recommended shape): header
   `Lambda-Runtime-Function-Error-Type` with recommended `<category.reason>` dotted format —
   `Runtime.NoSuchHandler`, `Runtime.ConfigInvalid`, `Runtime.UnknownReason` — but "Lambda
   accepts any string" [L1 §2.3]. A *recommended vocabulary with an open set*: interoperable
   without being a closed enum. The body carries the human/debug payload
   (`errorMessage`, `errorType`, `stackTrace[]`).
3. **Severity axis** (platform response code): `202` = recorded; `500` = "Non-recoverable
   state. Runtime should exit promptly" [L1 §2.3–2.4]. Terminality is expressed by the
   **platform's reply to the error report**, not by the worker's self-diagnosis.

Note what's absent: **the extract shows no explicit retryable/terminal flag from the worker's
side**. Retry policy lives in the platform; the worker only classifies (`errorType`) and the
platform decides. Attempt count is likewise absent from the Runtime API surface in the extract
(**recorded as absent**).

### 4.2 LSP: numeric code ranges partition ownership; specific codes drive client behavior

- Reserved ranges partition the code space by owner: JSON-RPC codes (`-32700…-32600` parse/
  invalid/method-not-found/params/internal), JSON-RPC reserved range (`-32099…-32000`, holding
  `ServerNotInitialized -32002`, `UnknownErrorCode -32001`), LSP reserved range
  (`-32899…-32800`) [L2 §5]. Range reservation is the versioning story for error codes.
- Retry semantics are attached to **specific codes plus negotiated client behavior**:
  - `ContentModified (-32801)`: result stale because state changed; client capability
    `general.staleRequestSupport.retryOnContentModified: string[]` declares *per-method* which
    requests the client will auto-retry on this code [L2 §5, §11.2]. Retryability is a
    **client-declared, per-method contract keyed on an error code** — not a boolean on the error.
  - `RequestCancelled (-32800)` vs `ServerCancelled (-32802)`: who cancelled is distinguishable
    [L2 §5].
  - `RequestFailed (-32803)`: "syntactically correct" but failed — separates transport/protocol
    faults from domain failures [L2 §5].
  - Init-time: `InitializeError {retry: boolean}` — the one place LSP puts an explicit retry
    flag on the wire, mediated by a human ("user selects retry or cancel") [L2 §11.3].
- Structured extra info rides in `error.data?: LSPAny` — an open extension slot per error
  [L2 §4].

### 4.3 Contrast with NetScript today

NetScript's `error: string|null` + `exitCode` conflates all four things these protocols separate:
phase (init vs run), classification (type string), severity/terminality (who decides retry), and
debug payload (stack). Both source protocols agree on the split: **machine-routable code/type +
human message + optional structured data**, with retry policy resolved by the *coordinator*, not
self-asserted by the failing worker.

---

## 5. Versioning + capability negotiation

### 5.1 Lambda: date-versioned URL prefix, header-based feature opt-in

- The API version is a **date literal in the path** (`/2018-06-01/…`), with an OpenAPI spec
  published for it [L1 §1]. The version has not needed to change since 2018 — new features
  arrived without a v2: streaming via *request headers* (`Lambda-Runtime-Function-Response-Mode:
  streaming`) [L1 §3.4], concurrency via an *env variable* (`AWS_LAMBDA_MAX_CONCURRENCY`) that
  absent simply means "old behavior" [L1 §1, §3.5]. Feature negotiation is "platform sets env /
  worker sets header"; no handshake round-trip exists at all.
- Env-var capability signalling: `AWS_LAMBDA_INITIALIZATION_TYPE`
  (`on-demand`/`provisioned-concurrency`/`snap-start`/`lambda-managed-instances`) tells the
  worker *what kind of lifecycle it is in* [L1 §4]; `AWS_LAMBDA_LOG_FORMAT` tells it the required
  log format [L1 §3.5].

### 5.2 LSP: no version handshake — capabilities replaced it

- Explicit and instructive: `InitializeErrorCodes.unknownProtocolVersion` is **deprecated** —
  "This initialize error got replaced by client capabilities. There is no version handshake in
  version 3.0x" [L2 §11.3]. LSP tried version negotiation and abandoned it for per-feature
  capability negotiation.
- Mechanics: one `initialize` round-trip exchanges `ClientCapabilities` ⇄ `ServerCapabilities`
  [L2 §9, §11.1–11.4]. Rules that make it robust:
  - "Clients should ignore server capabilities they don't understand (e.g. the initialize
    request shouldn't fail in this case)" [L2 §9] — unknown = ignore, never fail.
  - Defaults are backwards-compatible: `positionEncodings` omitted ⇒ `['utf-16']`; the server
    must pick from the client's offered set (a real *negotiation*, not just announcement)
    [L2 §11.2, §11.4].
  - Capability values are graded: `boolean | Options | RegistrationOptions` — from "I can" to
    "I can, configured thus" [L2 §11.4].
  - `experimental?: LSPAny` escape hatch on both sides [L2 §11.2, §11.4].
  - Spec-level `@since 3.16.0/3.17.0` annotations date every field — additive-only evolution.
- **Dynamic registration** extends negotiation past init: server may register/unregister
  capabilities at runtime, only where the client opted in via `dynamicRegistration`, and must
  not double-register the same capability statically and dynamically [L2 §11.9].
- Per-request micro-negotiation: progress/partial-result support is signalled by token presence
  in each request's params, "no specific client capability" needed [L2 §8.1].

---

## 6. Transport + framing choices, and why

### 6.1 Lambda: worker-pull HTTP over loopback

- Plain HTTP/1.1 on a loopback host:port from env, "no TLS, no auth token on the runtime API
  itself" [L1 §1]. Why it works: the trust boundary is the execution environment itself;
  transport security would buy nothing inside it.
- **Pull, not push**: the platform never connects into the worker; the worker long-polls
  `/next`. Consequences visible in the extract: no server socket inside the worker (any language
  that can make an HTTP GET can be a runtime), natural backpressure (worker asks when ready),
  freeze-tolerance (the poll just parks) [L1 §2.1], and concurrency = just more parallel pulls
  correlated by id [L1 §3.5].
- **Metadata in headers, payload in body**: the event/result body stays opaque bytes with no
  envelope; all protocol metadata (id, deadline, trace) rides in headers, and correlation ids
  ride in the URL path [L1 §2.1–2.2]. The platform never needs to parse user payloads, and the
  payload format is unconstrained (streaming chunks included [L1 §3.4]).
- Errors-after-stream-start use HTTP **trailers** — the framing layer's own late-metadata
  mechanism — rather than in-band sentinels [L1 §3.4].

### 6.2 LSP: length-prefixed JSON-RPC over a raw byte stream

- `Content-Length` (required) + optional `Content-Type`, ASCII headers, `\r\n\r\n`, then UTF-8
  JSON body [L2 §1–2]. Chosen for stdio-class transports where nothing else frames messages;
  the header block is deliberately "comparable to HTTP" and HTTP-semantics-conformant (RFC7230)
  [L2 §1].
- Strictness where cheap, tolerance where history demands: only `utf-8` is supported and other
  charsets "should respond with an error", yet the legacy misspelling `utf8` must be accepted
  [L2 §2].
- JSON-RPC 2.0 gives the three-kind message model, id-based correlation over a single
  full-duplex stream, and bidirectionality (server→client requests like
  `client/registerCapability` need no second channel) [L2 §4, §11.9].
- One server per client: "the protocol currently assumes that one server serves one tool"
  [L2 §9] — multiplexing tenants is explicitly out of scope, which keeps ids simple.

### 6.3 Relevance to NetScript

NetScript's current "framing" is *last JSON line of stdout* — an in-band convention on a channel
shared with arbitrary user logging. Both sources refuse exactly that: Lambda by moving the
protocol off stdout entirely (loopback HTTP; stdout stays a pure log channel), LSP by
length-prefixed framing that makes message boundaries independent of content. Either fix removes
the "user prints a JSON-looking line and corrupts the result" failure class.

---

## 7. STEAL CANDIDATES for the NetScript polyglot task protocol

Each: what to steal → citation → pillar → conformance tier (0 = mandatory floor for every
polyglot task, 1 = standard citizen, 2 = full citizen / optional richness).

**S1. Env-bootstrap into a versioned local control endpoint (keep stdout for logs).**
Steal Lambda's exact bootstrap shape: the engine passes `NETSCRIPT_RUNTIME_API=host:port` (plus
existing `TASK_ID`) in env; the task talks to
`http://{api}/{version}/task/{taskId}/…`. Version as a path literal, per Lambda's
`/2018-06-01/` [L1 §1]. This is the single move that unlocks every other candidate without
breaking Tier-0 tasks (which may ignore the endpoint entirely and keep the current
stdout-JSON contract as a degraded mode). Pillar: **communication** (enables all four).
Tier: endpoint presence is Tier 0 platform-side; *using* it is Tier 1+.

**S2. Metadata-in-headers / payload-opaque split, correlation id in the path.**
Result/error submissions POST to `/task/{taskId}/result` with the payload as opaque body and all
protocol data in headers/path, mirroring `/runtime/invocation/{AwsRequestId}/response`
[L1 §2.1–2.2]. The engine never parses user payload to route it; large payloads stop being
squeezed through a stdout line. Pillar: **interop + communication**. Tier: 1.

**S3. Absolute deadline delivered to the task: `Deadline-Ms` semantics.**
Hand every polyglot task an absolute Unix-ms deadline (env var for Tier 0, header on the
`/next`-style fetch for Tier 1+), copying `Lambda-Runtime-Deadline-Ms` [L1 §2.1] including the
absolute-not-relative rationale (robust under queue latency and process freezes). Tasks can
budget and self-abort cleanly before the engine kills them. Pillar: **lifecycle**. Tier: 0
(inject) / 1 (task honors it).

**S4. Trace propagation as a mandated loop step, not an optional nicety.**
Lambda makes "propagate the tracing header" step 2 of the processing loop and names the exact
env var to set (`_X_AMZN_TRACE_ID` from `Lambda-Runtime-Trace-Id`) [L1 §2.1, §3.3]. NetScript
fix for D-4: `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` are **protocol-mandated injections on
every path including the queue path**, and conformance Tier 0 *tests* their presence. This is
the direct cure for bug D-4 and closes the JS/polyglot citizenship gap on tracing. Pillar:
**observability**. Tier: 0.

**S5. Structured error report: phase-split endpoints + `<category.reason>` type + body
`{errorMessage, errorType, stackTrace[]}`.**
Replace `error: string|null` with Lambda's error contract [L1 §2.3–2.4]: separate init-error
vs run-error reporting; open-but-recommended dotted type vocabulary
(`Task.Timeout`, `Runtime.InvalidEntrypoint`-style well-known values [L1 §3.1]); structured
body with stack. Combine with LSP's `data?: LSPAny` open slot [L2 §4]. Pillar: **lifecycle +
observability**. Tier: 0 for the shape (a Tier-0 task's non-JSON death still maps into it
engine-side); Tier 1 for tasks self-reporting through it.

**S6. Retry decided by coordinator, expressed via code + negotiated per-method retry list.**
Steal LSP's `staleRequestSupport.retryOnContentModified: string[]` pattern [L2 §11.2]:
retryability is *not* a boolean the failing worker asserts; the error carries a
**classification code**, and the engine's policy (declared per task-type/queue) maps codes →
retry/terminal. Also steal the tripartite cancel distinction
`RequestCancelled` / `ServerCancelled` / `RequestFailed` [L2 §5] so "engine cancelled" vs
"task aborted itself" vs "task ran and failed" are distinct terminal states. Pillar:
**lifecycle**. Tier: 1.

**S7. `$/`-style optional-verb namespace with defined ignore semantics.**
Adopt LSP's rule verbatim [L2 §6]: optional protocol messages live under a reserved prefix;
receivers may ignore optional notifications and must answer unknown requests with a defined
`MethodNotFound`-equivalent. This *is* the tiered-conformance mechanism at the wire level: Tier
0 tasks ignore everything optional and remain conformant. Pillar: **interop**. Tier: 0 (the
rule), enabling 1/2 (the verbs).

**S8. Token-based generic progress with begin/report/end + percentage, distinct from
request id.**
Lift `$/progress` + `ProgressToken` + `WorkDoneProgressBegin/Report/End` [L2 §8, §8.1] as
`POST /task/{taskId}/progress {token?, kind, message?, percentage?}`. Token-not-id lets one task
report multiple concurrent progress streams; `begin` carries a mandatory human title
(observability UX for the dashboard). This gives polyglot tasks parity with JS-side
`JobContext.reportProgress`. Pillar: **observability**. Tier: 2 (Tier 1 may allow a minimal
`report`-only form; exact split is a design choice).

**S9. Partial-result streaming with the "final response must be empty" rule.**
For tasks that emit incremental results, copy LSP's discipline [L2 §8.2]: partials append via
progress-token notifications, the terminal result is empty, and error-code-dependent rules say
when delivered partials may be kept (`RequestCancelled` ⇒ usable-but-incomplete, otherwise
discard). Alternatively (large single result) Lambda's chunked-response + trailer-error variant
[L1 §3.4]. Pillar: **communication**. Tier: 2.

**S10. Cooperative cancellation that always resolves.**
`$/cancelRequest` semantics [L2 §7]: engine signals cancel (delivered when the task polls, or
via the control endpoint); the task **must still produce a terminal report** ("can not be left
open / hanging"), with a distinct cancelled code. Engine keeps SIGKILL as the non-cooperative
backstop after grace — mirroring how LSP lets single-threaded servers ignore cancel [L2 §6]
without breaking the requester's bookkeeping. Pillar: **lifecycle**. Tier: 1 (receive +
terminate), 2 (graceful partial results per S9).

**S11. Capability exchange instead of protocol-version haggling.**
LSP deprecated its version handshake in favor of capabilities [L2 §11.3] — steal the
conclusion, not just the mechanism. NetScript: version the *envelope* coarsely (path literal,
S1) and negotiate *features* via a task-manifest/hello capability object with LSP's rules:
unknown capabilities ignored never fatal [L2 §9], backwards-compatible defaults (omitted =
Tier-0 behavior, like `positionEncodings` defaulting to utf-16 [L2 §11.2/§11.4]), graded values
`boolean | Options` [L2 §11.4], `experimental` escape hatch [L2 §11.2]. Conformance tier then
*is* a named capability profile. Pillar: **interop**. Tier: 0 (defaulting rules), 1
(declaration).

**S12. Two-step teardown + exit-code semantics + orphan backstop.**
From LSP: `shutdown` (finish/flush, respond, don't exit) then `exit`, with exit code 0 iff
shutdown was seen [L2 §11.6–11.7] — gives NetScript a *verifiable* graceful-drain contract for
long-running/pooled workers, where the exit code itself witnesses orderly teardown. Add the
`processId`/parent-alive rule [L2 §11.1] so an orphaned polyglot worker self-terminates when
the engine dies. Pillar: **lifecycle**. Tier: 2 (pooled/persistent workers); one-shot Tier 0
tasks keep plain exit.

**S13. Pull-loop worker reuse with id-correlated concurrency (the road past one-shot spawn).**
Lambda's whole architecture: warm environment, init-once, then a `GET /next` loop, scaled to N
concurrent pulls bounded by an env-var limit and correlated purely by per-invocation ids
[L1 §3.2–3.3, §3.5, §1]. This is the blueprint for NetScript "persistent polyglot workers":
amortize interpreter/VM startup, keep the engine push-free (works behind any queue provider —
KV/Redis/RabbitMQ stay engine-side), get backpressure for free. The extract's four "must"
rules for concurrent runtimes (concurrent `/next`, concurrent responses, thread-safe state,
unique request ids [L1 §3.5]) become NetScript's Tier-2 conformance checklist verbatim.
Pillar: **lifecycle + communication**. Tier: 2.

**S14. Platform-status-code as lifecycle instruction.**
`500` on a report endpoint means "non-recoverable, exit promptly" [L1 §2.3–2.4]: the engine can
command a misbehaving/obsolete worker to die through the response to its own submission — no
separate control channel needed. Pillar: **lifecycle**. Tier: 1.

**S15. Well-known entrypoint + well-known error for its absence.**
`bootstrap` + `Runtime.InvalidEntrypoint` [L1 §3.1]: NetScript adapters per language declare a
canonical entrypoint contract, and a missing/broken entrypoint maps to a *named* error type
rather than a bare nonzero exit. Also steal `AWS_LAMBDA_INITIALIZATION_TYPE`-style env
(`NETSCRIPT_EXECUTION_MODE=one-shot|pooled|…` [cf. L1 §4]) so one adapter binary serves every
tier and knows which lifecycle it's in. Pillar: **interop**. Tier: 0.

**S16. Message-documentation convention as the spec's own format.**
LSP documents every message as: capability path → request (method + typed params + progress
support flags) → response (result, partial result, error.data) [L2 §9]. Adopt this as the
RFC-5 spec template, with zod schemas as the normative shapes (NetScript already runs
oRPC + zod on the workers HTTP surface — the protocol schemas belong in the same contract
package). `@since`-style annotations on every field for additive evolution [L2 §11.2].
Pillar: **interop**. Tier: n/a (spec authoring practice).

---

## 8. Anti-patterns to avoid (visible in or warned by the extracts)

**A1. In-band result on a shared log channel.** Neither protocol puts protocol frames on
stdout. NetScript's last-JSON-line convention has no equivalent in either source; both chose
out-of-band control (loopback HTTP [L1 §1]) or explicit framing (`Content-Length` [L2 §1])
precisely so payload bytes can never be confused with protocol bytes. Do not carry the stdout
convention into the new protocol as anything but a Tier-0 legacy/degraded mode.

**A2. Protocol-version handshakes.** LSP's own deprecation note is the warning:
`unknownProtocolVersion` "got replaced by client capabilities. There is no version handshake"
[L2 §11.3]. Don't build a version-negotiation round-trip; version the envelope statically (path
literal per Lambda [L1 §1]) and negotiate features.

**A3. Failing on unknown fields/capabilities.** LSP: "the initialize request shouldn't fail"
on capabilities the client doesn't understand [L2 §9]; `$/` messages are ignorable [L2 §6].
Zod schemas for the protocol envelope must be open (passthrough/ignore-unknown), not strict —
strict envelope schemas would make every additive protocol evolution a breaking change across
language adapters.

**A4. Closed error enums — and fully free-form error strings.** Both extremes fail. Lambda's
"accepts any string" but "recommend `<category.reason>`" [L1 §2.3] plus LSP's *reserved numeric
ranges* [L2 §5] show the workable middle: reserved well-known values with a documented open
extension space. NetScript's current single free string is one extreme; don't over-correct to a
sealed enum that per-language adapters can't extend.

**A5. Worker-asserted retryability.** Neither protocol lets the failing process declare "retry
me" as a bare boolean (LSP's lone `retry` flag is init-only and human-mediated [L2 §11.3]).
Classification on the wire, policy in the coordinator (§4). A worker-set `retryable: true`
invites infinite-retry loops the engine can't reason about.

**A6. Relative timeouts.** `Lambda-Runtime-Deadline-Ms` is absolute [L1 §2.1] because the
process may be frozen/delayed between issuance and reading. Queue-transported relative TTLs go
stale; always ship absolute deadlines (and accept the clock-skew caveat locally — skew handling
is UNVERIFIED/not addressed in either extract).

**A7. Cancellation that abandons the request.** "A request that got canceled still needs to
return … can not be left open / hanging" [L2 §7]. A cancel design where the engine just stops
listening leaks state machines; every attempt must reach exactly one terminal record, cancelled
included.

**A8. Second channels for things the main channel can express.** LSP cancels progress by
cancelling its request [L2 §8.1]; Lambda commands worker death via a status code on an existing
call [L1 §2.3] and reports mid-stream errors via trailers on the existing response [L1 §3.4].
Resist adding a dedicated socket/verb for each new concern.

**A9. Conflating shutdown and exit.** LSP splits them because exiting on `shutdown` races the
delivery of the shutdown *response* [L2 §11.6]. For pooled workers, a single "die now" signal
loses the flush/ack step and makes graceful drain unverifiable.

**A10. Push-into-worker designs.** UNVERIFIED as an explicit warning in the extracts, but the
Lambda design choice is loud: workers pull [L1 §2.1, §3.5]. Requiring polyglot tasks to run a
server the engine connects into raises the conformance floor for every language and inverts
backpressure. Keep push-free; the engine is the only server.

**A11. Ignoring ordering correctness under concurrency.** LSP permits reordering "as long as
this reordering doesn't affect the correctness of the responses" [L2 §10]; Lambda's concurrent
variant demands thread-safe handling + unique-id correlation [L1 §3.5]. A Tier-2 pooled-worker
spec must state its ordering guarantees explicitly, or provider-level differences (KV vs
RabbitMQ ack semantics) will surface as adapter-specific races.

**A12. Letting one worker serve two masters.** "The protocol currently assumes that one server
serves one tool" [L2 §9]. Don't design the persistent-worker tier to be shared across engines/
queues in v1; id-spaces and lifecycle ownership stay simple when there is exactly one
coordinator per worker.

---

## Open questions (for the synthesis step)

1. Lambda-side deadline *enforcement* behavior (freeze vs kill at `Deadline-Ms`) is not in the
   extract — does NetScript's grace-then-SIGKILL need a third state (freeze/suspend) for
   pooled workers? UNVERIFIED territory.
2. Attempt/retry count is absent from the Lambda Runtime API surface in the extract; LSP has
   none. Other source groups (queue protocols?) should supply the attempt-metadata precedent —
   this group offers no wire precedent for `attempt`/`maxAttempts`.
3. Tier boundary for progress: is a minimal `report`-only progress verb Tier 1 or Tier 2? LSP's
   per-request token-presence signalling [L2 §8.1] suggests it can be per-invocation opt-in and
   thus cheap enough for Tier 1.
4. LSP's dynamic capability registration [L2 §11.9] — worth a Tier-2 analogue (worker announces
   new task-type handlers at runtime), or scope creep for RFC-5?
5. Clock-skew handling for absolute deadlines across hosts (queue path) — neither extract
   addresses it.
