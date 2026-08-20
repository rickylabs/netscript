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

Run 5 of the polyglot series. Runs 1–4 (#1678 scriptc, #1683 rust-workers, #1685 dotnet, #1686
golang) measured _execution_ and left the polyglot contract unchallenged. This RFC challenges it: it
specifies the **NetScript Task Protocol (NTP)** — one versioned, language-agnostic contract that
turns foreign-language tasks from black-box subprocess runners into ecosystem citizens across four
pillars: **interoperability, observability, the communication layer, and error & lifecycle
management**. Every quantitative claim traces to
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc/` (ratified 32-file
research corpus in `research-sources/`, engine audit with defect register D-1..D-14, and six
measured spikes K1–K6 in `results/results-spikes.md` — all criteria pre-registered in `plan.md`
L8/L9; **no criterion's fallback branch fired**).

## Summary

Today a polyglot task receives two env vars (`TASK_ID`, `TASK_PAYLOAD`) and answers with the last
JSON line of stdout parsed into `TaskResult {success: boolean}` — while a JS job handler enjoys
`correlationId`/`traceparent`/`reportProgress` in its `JobContext`. NTP closes that citizenship gap
with:

1. **Three conformance tiers**, computed from a conformance suite, never asserted. **T0**: today's
   contract stays valid forever; **T1**: structured one-shot (versioned envelope in, sentinel-framed
   events out, in-band cancel); **T2**: long-lived duplex worker (handshake, capability negotiation,
   per-dispatch attempt tokens).
2. **Two surfaces**: attempt-lifecycle verbs on the task channel (result, progress, log, ping,
   cancel, extendTimeout, checkpoint); everything else — enqueue, scoped KV, stream publish, status
   query, async completion, artifacts — on an **authenticated loopback oRPC surface** shared by
   every tier, gated by per-attempt capability tokens. Even a T0 shell script is a full citizen over
   plain HTTP.
3. **A closed, versioned Zod envelope** carrying trace context, attempt, deadline, and retry history
   — killing the trace-drop defect class (D-1/D-2) by construction, exactly as Faktory's closed job
   document and Celery's mandatory lineage headers do
   (`research-sources/faktory-sidekiq-analysis.md`, `celery-bullmq-analysis.md`).
4. **Structured errors + terminal-frame discipline**:
   `{errtype, message, stack?, data?,
   behavior: RETRY|PAUSE|FAIL, nextRetryDelay?}` with
   engine-side cleanse caps; process exit without a terminal frame becomes a synthesized
   `UnknownFailure` carrying the exit code as detail — never `success:false` soup (Restate's
   double-attested rule, `restate-spec-analysis.md`).
5. **Security by construction**: a reserved `NETSCRIPT_*` env namespace with a constructed
   allowlisted base env (closing D-9, the full-parent-env leak) and an opaque per-attempt token
   resolving to a supervisor-side capability record (Biscuit-shaped claims vocabulary), invalidated
   on retry for stale-attempt fencing (Temporal task-token semantics,
   `security-scoping-analysis.md`).

Measured verdict on cost (K4, through the production dispatch path, 1920/1920 executions, exact
result identity): the full T1 contract adds **+0.41 ms** worst-case to the 7.6 ms exec-wall p50 of a
Go task (bar: ≤1.0 ms), with host-side envelope validation + frame demux at **0.06–0.10 ms** (bar:
≤0.5 ms). The protocol does not eat the execution wins of runs 1–4. Like those runs, **no TaskType
vocabulary changes**: NTP is orthogonal to runtimes and rides existing seams (the K4 envelope
shipped through the unmodified `TASK_PAYLOAD` mechanism).

## Motivation

The engine audit (`research-sources/netscript-engine-audit.md`, file:line cites) found the polyglot
boundary is not merely austere but defective — a register of 14 defects including: the queue path
drops correlation/trace context the types already carry (D-1, `job-dispatcher.ts:234-240`); any
JSON-object log line can be mistaken for the result (D-3, the stdout hijack); `attempt` is hardcoded
0 so idempotent-aware tasks are impossible (D-5); a post-spawn abort never kills the child (D-6);
timeout/cancelled collapse to `failed` on persist (D-8); every subprocess inherits the full
supervisor env including secrets (D-9); and `reportProgress` — even for first-class JS jobs —
terminates at `console.log` (D-12). These defects are filed as engine bugs on their own timeline;
NTP's job is to specify the contract that makes their _classes_ impossible. Without it, "anyone can
spawn a subprocess with Deno" is a fair critique — the moat is citizenship, not spawning.

## Guide-level explanation

### Tier 0 — what you already have, plus citizenship

Nothing breaks: argv/env in, exit code out, last JSON line as the result (now Zod-validated with the
raw line kept beside the parse — D-4/D-13). Two purely additive powers:

```sh
# any language, no SDK: emit a protocol frame by prefixing the sentinel
printf '\x00NSF\x00{"v":1,"t":"progress","percent":50}\n'
# and call the citizen surface with the tokens from your env
curl -H "Authorization: Bearer $NETSCRIPT_TASK_TOKEN" \
     -X POST "$NETSCRIPT_CALLBACK_URL/v1/tasks/enqueue" -d '{"taskId":"thumbnail", ...}'
```

Frames are sentinel-prefixed NDJSON on stdout — non-frame lines stay ordinary logs, so
`console.log`/`print` never corrupt results again. The sentinel (`\x00NSF\x00`) contains NUL, which
legitimate text logs never carry; frame writes must be a single `write(2)` ≤ PIPE_BUF (4096 B),
which makes them atomic on pipes. K1 demuxed 200/200 frames across 10/10 runs from 1.25 GB/rep of
deliberately hostile output (1 MB lines, invalid UTF-8, planted sentinel-lookalikes, unsynchronized
multi-writer shredding) at ~127 MB/s.

### Tier 1 — the structured one-shot task

```json
// NETSCRIPT delivers the envelope (today's TASK_PAYLOAD mechanism, now a schema):
{
  "v": 1,
  "taskId": "resize",
  "executionId": "e-42",
  "attempt": 1,
  "deadlineMs": 1766217600000,
  "traceparent": "00-…",
  "correlationId": "…",
  "retry": { "remaining": 2, "lastFailure": { "errtype": "Net.Timeout" } },
  "payload": { "src": "s3://…" },
  "ext": {}
}
```

The task emits `started`, optional `progress`/`log` frames, and MUST end with exactly one terminal
`result` frame (`outcome: ok | error | cancelled`). Exit without a terminal frame ⇒ the engine
synthesizes `UnknownFailure` with the exit code as detail. Cancellation is in-band: the host writes
a `cancel` frame to stdin; a reader thread/goroutine plus chunk-granular checks acked in **3.5 ms
p50 (Go) / 30 ms p50 (python3)** in K5 — with SIGTERM grace → SIGKILL as the non-cooperative
backstop (Faktory's 25-of-30s pattern).

### Tier 2 — the long-lived worker

An oRPC-peer-shaped framed channel (`{i,t,p}` correlated frames, ABORT_SIGNAL, event iterators —
`orpc-analysis.md`): `init` handshake with capability negotiation (LSP-style: unknown optional
notifications ignored; unknown requests get a structured `MethodNotFound`), per-dispatch envelopes
carrying fresh attempt tokens, ping frames whose replies carry control bits (Temporal's
heartbeat-carried cancellation), checkpoint redelivery, and two-phase `shutdown`/exit with the
BullMQ zombie rule: a worker that fails `init` must exit, be killed, and never be pooled.

### The citizen surface (every tier)

`NETSCRIPT_CALLBACK_URL` + bearer tokens; plain HTTP+JSON so every language already has a client.
Verbs: enqueue (idempotency-key + delay, Restate `Call`/`OneWayCall` shapes), scoped KV
(prefix-jailed), stream publish (topic-scoped), execution status query, async completion (Temporal
detached-handle pattern), artifacts (the binary channel — frames stay text). K3 measured the
round-trip at **0.49 ms p50 (sandboxed deno) / 0.67 ms p50 (python3)** and proved the elegant part:
for deno-type tasks, exact-port `--allow-net=127.0.0.1:PORT` scoping _is_ the access gate — a
wrongly scoped task is denied by the permission system before authentication even runs.

## Reference-level explanation

### Protocol constants and registries

- Sentinel `\x00NSF\x00`; frame ≤ 4096 B (PIPE_BUF atomicity); demux MUST sentinel-scan the byte
  stream, never line-split first (K1's v1-lesson: line-anchored parsing lost 8–44 frames/rep to
  frames embedded inside another writer's unterminated >PIPE_BUF line — this rule is normative).
- Envelope/frames: closed Zod schemas, `v` = monotonic integer with a **yankable version registry**
  and echo-back (task's first structured frame echoes `v`; absence = T0 detection) — Restate's
  discipline, inverted from oRPC's versionless v1→v2 wire break. One namespaced extension bag
  (`ext`, `_`-reserved keys, Faktory `custom` semantics); string-keyed verb registry; control-signal
  id-space reserved with only CANCEL defined; vendor frame-type space fenced.
- Checkpoints (T-5 lock): ≤ 8 KB rides the next attempt's envelope; 8–256 KB arrives as an inbound
  frame (T2) or truncates to an artifact ref (T1); > 256 KB must use the artifacts route.
- Zod trap (normative, from `openapi-codegen-analysis.md`): envelope schemas are published with
  open-world semantics — zod's default `additionalProperties: false` MUST be overridden on the wire
  schemas, and payload schemas are authored to the measured cross-language portable core
  (discriminated root oneOf as the only portable union).

### Error taxonomy and lifecycle

`{errtype (dotted, ≤100 ch), message (≤1 KB), stack? (≤50 lines), data?, behavior:
RETRY|PAUSE|FAIL, nextRetryDelayMs?}`
— engine-side cleanse caps are Faktory's, the behavior enum is Restate V7's `ErrorBehavior` (PAUSE =
park-for-operator is a new persisted outcome), the failing-side delay proposal is
Temporal/Inngest's. The **coordinator decides retry** (budget + per-errtype disposition hook),
informed by the task; protocol violations are a distinct error lane from task-domain failures (Go
`syscall/js`'s two-kind split). Persisted outcomes become
`completed | failed | timeout | cancelled | paused | unknown-failure` — fixing D-7/D-8's collapse.
Lifecycle is a forward-only DAG (running → draining → terminated, Faktory's "you cannot unquiet");
deadlines are absolute epoch ms (Lambda's `Deadline-Ms` rationale: the reader may be delayed between
issuance and read).

### Security model

The subprocess env is a **constructed document**: allowlisted base + reserved `NETSCRIPT_*`
namespace (`PROTOCOL`, `TASK_ID`, `EXECUTION_ID`, `ATTEMPT`, `DEADLINE_MS`, `CALLBACK_URL`,
`TASK_TOKEN`), user-set reserved keys rejected (Lambda's reserved-variable model). K2 proved the
mechanism: `Deno.Command` `clearEnv`+`env` delivered exactly the allowlist — a planted supervisor
secret did not leak — and `/proc/*/environ` is mode 0400 (same-uid only; sandboxed deno tasks
additionally cannot read `/proc` at all). The task token is **opaque, per-attempt, invalidated on
retry**; the loopback router resolves it to a capability record (claims vocabulary:
`aud`/`exp`/`jti`/`attempt` + `enqueue-queues`/`kv-prefix`/ `stream-topics`/`progress`) with
K8s-TokenReview-style verification order and **no ID-tuple bypass on mutating verbs** (the Temporal
workaround explicitly not shipped). T2 delivers fresh tokens per dispatch frame (env is fixed at
spawn; a duplex worker serves many attempts). RFC 8693 token exchange is the reserved delegation
extension.

### Observability

Trace context (`traceparent`/`tracestate`/`correlationId` + lineage) is **envelope data** (W3C/OTel
env-carrier for T0 compat: also injected as `TRACEPARENT`/`TRACESTATE`), malformed values
ignored-never-fatal (W3C rule). Progress: frame → demux → **latest-wins throttle** (Temporal's
min(0.8×timeout, cap) shape) → an `ExecutionState.progress()` mutation → the existing mutation-hook
→ `/workers/executions` durable stream → SSE; JS `reportProgress` rewires to the same mutation so
both citizenships converge on one sink (fixing D-12 for everyone). K6 measured the chain shape at
**93.9 ms p95** steady (throttle-dominated; bar 500 ms) and **9.5× coalescing** under a 100 ev/s
burst with a bounded 84 B record — MEASURED-ON-REPLICA (drift R5-D-3): the state API has no progress
mutation yet and the durable-stream producer requires the Aspire-hosted streams service, so a
loopback sink stood in for the transport (whose real cost K3 bounds at ~0.5 ms). Resource metrics
stay host-owned (run-1's sampler precedent); tasks may piggyback `rssKb` on ping frames (Faktory
BEAT).

### Package architecture (auth-plugin blueprint)

Protocol core in `packages/plugin-workers-core` (`protocol/`: schemas, verb registry, demux state
machine, envelope builder; `testing/conformance/`: cases + verdict machine): narrow ports +
composite port + typed `*OperationUnsupportedError` + named registry resolved at the composition
root — exactly `plugin-auth-core`'s shape (`ports/mod.ts:212-355`). Transports (stdio, loopback
router glue; future socket/message-port) and per-language reference shims are sibling adapter
packages importing only from core. The seam that generalizes is the adapter map at
`multi-runtime-task-executor.ts:195-205`. oRPC's transport-free peer core — where adding a transport
is a two-line shell — is the working proof of this shape in the wild.

### Conformance suite (the tier authority)

Named cases `<tier>.<verb>.<behavior>` (gRPC naming, Autobahn wildcards: a tier is a prefix set),
**dual verdicts per case** (behavior + exit-behavior — where D-6/7/8 live), graded vocabulary
(OK/NON-STRICT/FAILED/UNIMPLEMENTED/INFORMATIONAL), **mode inversion** (reference host drives any
task binary; reference task drives the host — only the inversion gates D-3/ D-9), and a
**generated** double-indexed capability matrix as the tier declaration (CloudEvents' hand-maintained
matrix rotted in our own extract — the anti-precedent). Declared-vs-probed-vs-observed drift is a
first-class finding (our synthesis; no upstream precedent, defended here). The D-register seeds the
first fix-gate cases (e.g. `t0.result.log_line_not_hijacked`, `t0.env.no_supervisor_inheritance`).
LSP's _lack_ of an official suite — still cited via community substitutes a decade on — is the
cautionary tale: **the conformance suite is the contract**; per-language SDKs are conveniences.

### Defect map (what NTP structurally retires)

| Defects                                           | Retired by                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| D-1, D-2 (context drops)                          | context as mandatory envelope fields (+ env mirror for T0)                           |
| D-3, D-13 (stdout hijack, exit-code-only success) | sentinel frames + terminal-frame discipline + validated result with raw-beside-parse |
| D-4 (unvalidated boundary)                        | envelope/result Zod schemas + registry `payloadSchema`/`resultSchema`                |
| D-5 (attempt opacity)                             | `attempt` + retry history in envelope; token invalidation fences stale attempts      |
| D-6, D-7, D-8 (kill/timeout/status)               | cancel verbs + signal ladder; distinct persisted outcomes; conformance exit-verdicts |
| D-9 (env leak)                                    | constructed allowlisted env + reserved namespace                                     |
| D-10 (unbounded buffering)                        | frame cap + log-channel separation + artifacts route                                 |
| D-12 (progress dies at console)                   | progress verb → mutation → stream chain (both citizenships)                          |
| D-11, D-14                                        | supervisor-side fixes (out-of-scope item 10; D-14 trivial once results are frames)   |

## Drawbacks

1. A protocol is a commitment: versioned registries, conformance cases, and per-language shims all
   need maintenance the current two-env-var contract does not.
2. Sentinel framing is in-band: a task that deliberately echoes raw binary containing the exact
   sentinel + valid frame JSON can forge frames. Accepted and documented (NUL never appears in text
   logs; binary-log-heavy tasks should use T2/socket transports); the same residual holds for every
   in-band framing in the corpus.
3. The loopback surface makes the supervisor an HTTP server per host — new operational surface
   (mitigated: 127.0.0.1 bind + bearer + per-task net scoping, measured in K3).
4. T1 in-band cancel requires a reader thread in the task — a real (small) SDK-shim burden per
   language; signal-only remains legal at T0.

## Rationale and alternatives

- **Protocol-first vs SDK-first**: SDKs rot per-language; one wire contract + conformance keeps the
  moat where it belongs. (Sidekiq→Faktory is the corpus's own argument.)
- **Two surfaces vs everything-in-band**: BullMQ's single pipe was a constraint artifact; Restate's
  all-frames needs a durability journal we don't have at T0/T1. Temporal/Hatchet's split is the
  precedent; K3's sub-ms loopback removes the performance argument. T2 in-band citizen reads stay a
  fenced v2 extension (T-4 lock).
- **Sentinel-stdout vs fd-3 vs socket-first**: fd-3 is _infeasible on the Deno host_ (`Deno.Command`
  exposes no extra fds — K1/R5-D-2); sockets-first would tax T0's zero-ceremony promise. Measured
  framing overhead is ≈0.5 ms/execution total (K4).
- **Env tokens vs stdin-only**: `/proc` exposure is same-uid-only (0400) and same-uid processes
  already share the supervisor trust domain; the env-pointer keeps T0 SDK-free. T2 uses per-dispatch
  frames anyway (K2 verdict).
- **A `protocol` TaskType?** No. NTP is orthogonal to runtimes; the series' no-vocabulary precedent
  holds a fifth time (L9-4).
- **Do nothing**: the defect register keeps compounding, and the four language RFCs remain recipes
  for excellent black boxes.

## Breaking changes and migration

None at T0 — the tier exists precisely so every existing task (all four language RFC recipes, every
scaffold sample) stays conformant unchanged. Engine-side adoption is staged (each wave its own
run/PR): (1) constructed env + envelope emission + trace injection (D-1/D-2/D-9); (2) sentinel
demux + validated results + terminal discipline (D-3/D-4/D-13, T0/T1 conformance); (3) loopback
surface + tokens; (4) progress chain (D-12); (5) T2 worker mode + pool integration (#1684's oRPC
message-port pool is transport-compatible by construction).

## Prior art

Ratified corpus (32 files, `research-sources/`): Faktory/Sidekiq, Celery v2, BullMQ sandboxed
processors, AWS Lambda Runtime API, LSP, Temporal, Hatchet/Inngest/Restate, sd_notify, gRPC health,
CloudEvents, W3C trace-context/OTel env-carrier, oRPC v1/v2 (+ community stdio adapter),
NSwag/openapi-generator/JSON-Schema codegen pipelines, FFI callback channels (Bootsharp `[Import]`,
wasm-bindgen, `syscall/js`, `Deno.UnsafeCallback`), scoped-credential corpus (Lambda creds, Temporal
task tokens, K8s bound SA tokens, RFC 8693, macaroons/Biscuit), and conformance harnesses (gRPC
interop, Autobahn, CloudEvents). Runs 1–4 supply the execution baselines this protocol is measured
against.

## Unresolved questions

- Loopback survival under Docker/Aspire orchestration and Windows hosts (untested in-container —
  R5-D-5; the pattern matches Aspire's own env-injected service discovery, but that is an argument,
  not a measurement).
- The in-plugin progress chain (K6 is a replica; the implementation wave must reproduce the numbers
  through `KvExecutionState` + the real streams service, including SSE).
- T2 duplex conformance-case granularity (one session hosting many cases vs process-per-case — no
  corpus precedent).
- Grace-window semantics for fenced-out attempts (absolute rejection vs bounded final-diagnostic
  flush — K8s's 60 s deletion grace is the nearest analogue).
- UNVERIFIED register carried from research (research.md §7): Restate V5–V7 prose restatements,
  Bootsharp CancellationToken semantics, oRPC retry-plugin classification — none load-bearing for
  T0/T1.

## Future possibilities

- **Per-language citizenship addenda** revisiting RFCs 1–4 with shim sketches (owner-directed
  follow-up) — the ~100-line-shim proof of genericity per language.
- **T2 in-band citizen reads** (fenced v2 extension) and broker-mediated T2 transport.
- **Signed/attenuable tokens** (macaroon/Biscuit re-encoding of the same claims record) and RFC 8693
  delegation.
- **WASM/FFI in-process adapters** carrying the same citizen port (Bootsharp `[Import]` /
  wasm-bindgen imports / `Deno.UnsafeCallback` as the direct-binding transport).
- The **confinement RFC** (#1685 matrix) composing with per-task net scoping measured here.
