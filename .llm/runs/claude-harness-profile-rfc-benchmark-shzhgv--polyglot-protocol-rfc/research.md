# Research — RFC-5 polyglot task protocol (run 5)

Corpus: `research-sources/` (32 files — raw extracts + reverse-engineering analyses + engine
audit). Method: two workflow rounds, Opus 5 medium **aggregators** (faithful primary-source
collection only) → Fable **analysts** (reverse-engineering against NetScript context), plus a
Fable local engine audit and an adversarial completeness critic between rounds. All 25 agents
succeeded; every claim below cites a corpus file. Round 2 was driven by the critic's gap list
(security/token scoping, task→engine callback surface, Restate ratification, conformance
precedent) — the completeness-probe correction from the runs-1–4 miss, applied.

## 1. Engine audit — what the seam actually is today

`research-sources/netscript-engine-audit.md` (file:line cites throughout). Two-tier citizenship
confirmed and sharpened:

- Queue task path passes **only** `env: {TASK_ID, TASK_PAYLOAD?}` + `timeout` to the executor
  (`job-dispatcher.ts:234-240`) although `TaskMessage` carries correlation/trace fields and
  `TaskExecutionOptions` has slots for all of them. Result = `parseJsonLastLine` of fully
  buffered stdout; non-JSON/array/empty → silent null, unvalidated.
- JS `JobContext` has `correlationId/traceparent/tracestate/reportProgress` — but
  `reportProgress` terminates at `console.log` (`worker.ts:163-169`), so even the first-class
  citizen's progress never persists.
- `TaskDefinitionSchema` has **no payloadSchema/resultSchema**; nothing validates either
  direction of the boundary.
- Auth plugin blueprint extracted: composite `AuthBackendPort` aggregating narrow ports +
  optional capability, typed `*OperationUnsupportedError`, named `Map` registry with `'default'`
  resolved at composition root, sibling adapter packages importing only from core
  (`plugin-auth-core/ports/mod.ts:212-355`). This is the package shape RFC-5 copies; the seam to
  generalize is the adapter map at `multi-runtime-task-executor.ts:195-205`.
- Ecosystem seams a citizen needs (audit §5): queue enqueue, scoped KV, durable-stream publish,
  progress/heartbeat, status readback (`KvExecutionState.listBy*`); execution mutations already
  flow through `setMutationHook(createStreamMutationHook())` → `/workers/executions` stream →
  SSE — the persistence path progress should join (zero new fan-out plumbing).

### Defect register (D-1..D-14, full detail in audit §6)

| ID | Defect (file:line in audit) |
| --- | --- |
| D-1 | Task path drops correlation/trace/signal from execute options (the run-1 D-4 lineage) |
| D-2 | Polyglot-job path drops correlationId |
| D-3 | stdout hijack: any JSON-object last line becomes the result |
| D-4 | No per-task payload/result schemas; boundary unvalidated both directions |
| D-5 | `attempt` hardcoded 0; `maxRetries` never drives a retry loop |
| D-6 | Abort after spawn never kills the child |
| D-7 | Timeout classified by error-message string sniff |
| D-8 | Runner `timeout`/`cancelled` collapsed to `failed` on persist |
| D-9 | Full `Deno.env.toObject()` inherited by every subprocess (secret leakage) |
| D-10 | Unbounded stdout buffering copied into KV/stream on failure |
| D-11 | `maxConcurrency` (default 1) never enforced by listener or executor |
| D-12 | Progress is console-only; no foreign-task channel, no persistence |
| D-13 | Success = exit-code-0 only; stderr truncated to first line <200 chars |
| D-14 | `complete()` discards runner-measured duration |

Ruling carried from supervisor.md: these are bugs to file/fix on their own timeline; the RFC
standardizes the contract that makes their classes impossible, it does not hostage them.

## 2. Cross-corpus convergence — the protocol skeleton the sources agree on

Eight independent ecosystems converge on the same shape (each point multi-attested):

1. **Protocol bytes never ride the payload channel.** Lambda: metadata in headers, opaque body;
   LSP: Content-Length framing; BullMQ: control on IPC, stdout piped verbatim; oRPC stdio:
   sentinel-prefixed NDJSON lines, unprefixed lines stay logs. NetScript's last-JSON-line
   contract is the anti-pattern every source designed out (`orpc-analysis.md`,
   `lambda-lsp-analysis.md`, `celery-bullmq-analysis.md`).
2. **Trace/correlation context is envelope data, not env courtesy.** Faktory closed envelope +
   one namespaced `custom` bag; Celery lineage triple (correlation_id/root_id/parent_id) as
   mandatory headers; Temporal/Restate named header map round-tripped verbatim; OTel env-carrier
   RC (TRACEPARENT/TRACESTATE/BAGGAGE) legitimizes spawn-time injection. D-1/D-2 die by
   construction (`faktory-sidekiq-analysis.md`, `lifecycle-standards-analysis.md`).
3. **Structured errors with engine-side normalization; retryability decided by the coordinator,
   informed by the task.** Faktory 4-tuple with cleanse caps; Lambda/LSP phase split (init vs
   run) + open dotted type vocabulary; Temporal `non_retryable` flag defaulting retryable +
   failing-side `next_retry_delay`; Restate V7 `ErrorBehavior RETRY/PAUSE/FAIL` (PAUSE = park
   for operator — a state our outcome register lacks). Nobody trusts a bare string
   (`temporal-durable-analysis.md`, `restate-spec-analysis.md`).
4. **Terminal-frame discipline.** Restate (double-attested, ratified round 2): closed terminal
   set; process exit without a terminal frame = engine-synthesized distinct UnknownFailure
   carrying exitCode as detail — never `success:false` soup. Exit codes corroborate, never
   carry the verdict (`restate-spec-analysis.md`).
5. **Capabilities over version handshakes.** LSP deprecated its version handshake for
   capabilities with ignore-unknown-never-fail; Lambda kept one date-literal path version since
   2018; Deno FFI `optional?: true` is the runtime capability primitive; Restate contributes the
   yanked-version registry + echo-back (SHOULD-level refusal). oRPC's missing version field →
   hard v1/v2 wire break is the counter-example (`lambda-lsp-analysis.md`, `orpc-analysis.md`).
6. **Heartbeat replies are the cheap control channel.** Faktory BEAT → quiet/terminate; Temporal
   heartbeat response → cancel_requested bits (+ checkpoint details replayed into next attempt).
   Non-heartbeating tier-0 tasks are uncancellable cooperatively **by design** — Restate's
   request/response mode proves in-band cancel cannot reach a mid-flight non-duplex handler, so
   T0/T1 keep OS signals as the only cancel path, stated honestly
   (`temporal-durable-analysis.md`, `restate-spec-analysis.md`).
7. **Lifecycle is a forward-only DAG with verifiable drain.** Faktory running→quiet→terminate;
   LSP shutdown-then-exit with exit-code witness; BullMQ zombie-child invariants (failed init
   must exit AND be killed AND never pooled); sd_notify READY/STOPPING with per-state deadlines
   the child can extend (`lifecycle-standards-analysis.md`).
8. **Absolute deadlines, delivered.** Lambda Deadline-Ms (absolute, because workers may be
   frozen between issuance and read); Celery producer-declared (soft,hard)/expires; Faktory
   reserve_for lease with synthesized ReservationExpired through the normal failure path.

## 3. The two-surface architecture (round-2 callback-surface ruling)

`callback-surface-analysis.md` derives the decision rule the RFC adopts:

- **Protocol verbs on the task channel** iff bound to the in-flight attempt's lifecycle:
  result, progress, log, ping/heartbeat, cancel, extendTimeout, checkpoint, init/shutdown.
- **Authenticated loopback oRPC surface** (plain HTTP+JSON, any language) for ecosystem access:
  enqueue, scoped KV, stream publish, status query, async completion, artifacts. Temporal (thin
  task channel + client for everything else) and Hatchet are the precedent; BullMQ's
  everything-on-one-pipe was a constraint artifact, not a design.
- **Even Tier-0 tasks become citizens**: emit-only framed verbs on stdout + the full loopback
  surface — no protocol upgrade required for ecosystem access.
- **D-12 fix end-to-end**: progress frame → runner demux → new `ExecutionState.progress()`
  mutation → existing mutation-hook → `/workers/executions` durable stream → SSE; JS pool
  `reportProgress` rewired to the same mutation. Temporal's throttle algorithm (latest-wins,
  min(0.8×timeout, 30s)) rate-limits persistence.
- **Forbidden list** (grounded in defects): env inheritance (D-9), unframed stdout results
  (D-3), KV outside the task's prefix jail, cross-execution mutation without that execution's
  token, guest-initiated host-surface growth, unthrottled persistence (D-10), binary over the
  text frame channel (stdio adapter corrupts it — artifacts route instead).

## 4. Security/token scoping (round-2, previously zero-evidence pillar)

`security-scoping-analysis.md`:

- **Reserved `NETSCRIPT_*` env namespace + constructed allowlisted base env** (Lambda
  reserved-variable model) closes D-9 and delivers `ATTEMPT` (D-5's missing exposure) in the
  same move: the subprocess env becomes an enumerated document, not an inherited snapshot.
- **Env-pointer pattern**: env carries `NETSCRIPT_CALLBACK_URL` + bootstrap token only; real
  per-attempt credential material lives behind the loopback endpoint (TTL/rotation
  server-side). Per-environment random bearer as SSRF fence.
- **Opaque per-attempt token, invalidated on retry** (Temporal task-token semantics) with a
  supervisor-side capability record shaped in the K8s/Biscuit claims vocabulary
  (aud/exp/jti/attempt + enqueue-queues/kv-prefix/stream-topics/progress) — so a later
  signed/attenuable encoding is a re-encoding, not a redesign. K8s TokenReview discipline:
  even signed tokens need the live (executionId, attempt) check, which yields stale-attempt
  fencing for free. No ID-tuple completion bypass on mutating verbs (Temporal's documented
  workaround is the exact hole not to ship).
- **Tier boundary forced by sources**: T0/T1 = credential-per-spawn via env (process ≈
  attempt); T2 duplex = per-attempt tokens in each dispatch frame, env carries only the
  worker-identity bootstrap. RFC 8693 token-exchange reserved as the future
  delegation/downscope verb.

## 5. Contracts, codegen, and conformance

- **Typed contracts** (`openapi-codegen-analysis.md`): portable JSON Schema core is small
  (no `not`, composition limited per target; zod emits `additionalProperties:false` by default —
  a trap that would silently close our envelopes; discriminated root oneOf is the sole portable
  union). Pipeline: zod (io-split input/output schemas) → `z.toJSONSchema` (draft-2020-12,
  committed canonical schema) → per-language CI-generated types (typify /
  datamodel-code-generator / NJsonSchema-class). Result-as-envelope `{outcome, meta, payload}`
  replaces payload-with-success-flag. Parsed+raw dual carrier (keep bounded raw line beside
  parsed result) for debuggable schema mismatches. NSwag's PrepareRequest hook precedent → one
  mandatory context-injection chokepoint in every dispatch route, conformance-tested for
  traceparent presence.
- **Conformance harness** (`conformance-harness-analysis.md`): named cases
  `<tier>.<verb>.<behavior>` (gRPC naming + Autobahn wildcards → tier = prefix set); dual
  verdict per case (behavior + behaviorExit — exactly where D-6/7/8 live); **mode inversion**
  (reference host drives any task binary AND reference task drives the host — only the
  inversion gates D-3/D-9); generated double-indexed capability matrix as THE tier declaration
  (CloudEvents' hand-maintained table rotted in the extract itself); declared-vs-probed-vs-
  observed drift as a first-class finding (our synthesis — no direct precedent, defend
  explicitly); frozen reference driver per protocol release + N/N-1 window + nightly compat
  lane. D-register seeds the first fix-gate cases directly. LSP's *absence* of a suite is the
  cautionary tale ratifying "the conformance suite IS the contract".
- **oRPC alignment** (`orpc-analysis.md`): transport-free peer core `{i,t,p}` +
  REQUEST/RESPONSE/EVENT_ITERATOR/ABORT_SIGNAL is the T2 substrate (adding a transport is ~2
  lines and never touches the protocol — the port/adapter proof in the wild); the community
  stdio adapter's sentinel framing is the T0/T1 stdout fix but is text-only and
  trim-mutating — binary stays on the artifacts route; v1↔v2 wire break + magic-number registry
  are the versioning lessons we invert (version field + string-keyed registries from day one).
  Owner note: test against v1 (current dep), spec against v2 semantics where they diverge.

## 6. Tension register → plan L-locks (decided in plan.md, spiked where measurable)

| # | Tension | Evidence state |
| --- | --- | --- |
| T-1 | T0/T1 frame transport: sentinel-NDJSON stdout vs extra fd vs `NETSCRIPT_NOTIFY` socket | Sources motivate env-named channels; stdout-vs-fd unsettled → **spike** (incl. Windows/PowerShell reality) |
| T-2 | Token delivery: env (visible in /proc/environ same-user) vs stdin-first-frame vs pointer+loopback fetch | UNVERIFIED which is safest per tier → **spike** |
| T-3 | Loopback transport: 127.0.0.1 TCP vs UDS | Corpus silent (private pipes or real networks) → **spike** incl. Deno perm flags / container / Aspire survival |
| T-4 | T2 reads in-band (Hatchet/Restate) vs canonical loopback for all tiers | Analysis leans canonical-loopback; decide in plan |
| T-5 | Checkpoint redelivery placement: envelope vs inbound frame vs artifacts ref | RFC decision; interacts with size caps |
| T-6 | Duplex stdin control on runtimes that buffer stdin (Python) | Needs per-language probe → **spike** |
| T-7 | Protocol overhead budget vs run-1..4 baselines (6ms exec-wall class) | **spike** through the real dispatch path — the series' own bar |
| T-8 | D-11 slot accounting protocol-visible vs supervisor-only | Defer to supervisor-side fix; revisit in T2 |

## 7. UNVERIFIED register (carried into the RFC honestly)

Restate: echo-back restatement for V5-V7 prose, SDK cancel obligations + cancelled terminal
frame, abort-timeout backstop (U1-U7 in `restate-spec-analysis.md`). Bootsharp
CancellationToken semantics (sitemap-only). oRPC retry-plugin classification + v2 `inferable`.
Faktory HELLO hard-reject. Celery revoke transport. Macaroons paper formals (mechanics covered
via libmacaroons/Biscuit spec). LSP no-official-suite claim (continued-citation evidence).
Autobahn HTML report design (source-reconstructed). Each is cited as UNVERIFIED where used;
none is load-bearing for a tier-0/1 core decision.

## 8. Re-baseline vs runs 1–4

Runs 1–4 stand as the execution-layer evidence (dispatch tax, per-runtime recipes, in-process
bridges); RFC-5 changes none of their numbers. What changes: their RFCs' "polyglot contract"
sections become Tier-0 of this protocol, and each gains a citizenship addendum post-RFC-5
(owner directive, task #27). The queue tax (~55-60ms local floor) measured there is the
protocol's latency context: a task-channel frame adds work in the µs-ms band and must be
budgeted against the 6ms exec-wall class, not the e2e floor (T-7 spike).
