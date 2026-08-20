# Plan — RFC-5 polyglot task protocol (run 5)

Scope: author `rfcs/0000-polyglot-task-protocol.md` (Draft) specifying the NetScript Task
Protocol (NTP working name; final name in RFC) — the versioned, language-agnostic contract that
makes polyglot tasks ecosystem citizens — plus the measured spikes that settle its open
transport/delivery tensions, on the evidence base of `research.md` (32-file ratified corpus).
Archetype: ARCHETYPE-3-runtime-behavior + SCOPE-docs. This PR ships **docs + run-dir spike
code only**; engine implementation is follow-up waves (see out-of-scope register).

## L1 — Locked: protocol-first, three conformance tiers

- **T0 (legacy/minimal)**: today's contract stays valid forever — env in, exit code + stdout
  out. Additions are strictly opt-in emissions: sentinel-framed NDJSON lines on stdout
  (result/progress/log verbs) and the loopback citizen surface. A task that emits no frame
  behaves exactly as today (last-JSON-line parse retained as T0 fallback, now Zod-validated
  with parsed+raw dual carrier).
- **T1 (structured one-shot)**: versioned envelope in (payload + context + deadline + attempt),
  framed structured events out, OS-signal cancellation with documented drain grace; terminal-
  frame discipline.
- **T2 (long-lived duplex worker)**: oRPC-peer-shaped framed channel, init handshake +
  capability negotiation, in-band cancel/ping-reply control bits, checkpoint, two-phase
  shutdown, per-dispatch attempt tokens.
- Tier is **computed from conformance-case results**, never asserted (research.md §5).

## L2 — Locked: two-surface architecture

Attempt-lifecycle verbs ride the task channel (result, progress, log, ping, cancel,
extendTimeout, checkpoint, init/shutdown); ecosystem access (enqueue, scoped KV, stream
publish, status query, async completion, artifacts) is an authenticated **loopback oRPC
surface** shared by every tier, reusing the existing workers contracts/zod stack. Decision rule
and forbidden list per `research-sources/callback-surface-analysis.md`.

## L3 — Locked: envelope + context

`TASK_PAYLOAD` becomes a versioned closed Zod envelope: protocol version, taskId, executionId,
attempt, deadline (absolute ms), traceparent/tracestate/correlationId (+lineage), retry
context (attempt history), payload (opaque, schema-referenced), one namespaced extension bag
(`ext`, `_`-reserved keys). Kills D-1/D-2 by construction; delivery via env in T0/T1, dispatch
frame in T2. Task registry gains optional `payloadSchema`/`resultSchema` (zod, io-split);
boundary validation both directions with parsed+raw dual carrier (D-4, D-13).

## L4 — Locked: errors, lifecycle, terminal discipline

Structured error `{errtype, message, stack?, data?, behavior: RETRY|PAUSE|FAIL,
nextRetryDelay?}` with engine-side cleanse caps; retry decided by the engine (budget +
per-errtype disposition hook), informed by the task. Closed terminal set per attempt; process
exit without a terminal frame ⇒ engine-synthesized `UnknownFailure` carrying exitCode as
detail. Timeout/cancelled/failed become distinct persisted outcomes (D-7, D-8); runner-measured
duration wins (D-14). Lifecycle DAG forward-only (running→draining→terminated); control-signal
id-space reserved with only CANCEL defined (Restate R2-A).

## L5 — Locked: security model

Reserved `NETSCRIPT_*` env namespace + **constructed allowlisted base env** (D-9 dies);
`NETSCRIPT_ATTEMPT` etc. delivered (D-5 exposure). Per-attempt **opaque token** minted by the
dispatcher, invalidated on retry, resolving server-side to a capability record in the
Biscuit-shaped claims vocabulary (aud/exp/jti/attempt + enqueue-queues/kv-prefix/stream-topics/
progress); loopback verification order per `security-scoping-analysis.md` §7; no ID-tuple
bypass on mutating verbs; RFC 8693 exchange reserved as extension.

## L6 — Locked: versioning + capability negotiation

Monotonic protocol version with yankable-version registry, declared by host, echoed by task's
first structured frame (absence = T0 detection); feature evolution via capabilities with
ignore-unknown-notifications / structured-error-unknown-requests semantics; string-keyed verb
and extension registries from day one; vendor extension space fenced.

## L7 — Locked: package architecture + conformance

Auth-plugin blueprint: protocol core (schemas, ports, state machines, verb registry) in
`packages/plugin-workers-core` (new `protocol/` area + `testing/conformance/`); transports and
per-language reference shims as sibling adapter packages; adapter registry with typed
unsupported-capability errors. Conformance harness: `<tier>.<verb>.<behavior>` named cases,
dual behavior+exit verdicts, testee-task AND testee-host mode inversion, generated
double-indexed capability matrix as the tier declaration, D-register-seeded fix-gate cases.
(Spec'd normatively in the RFC; harness implementation is follow-up.)

## L8 — Spike protocol (implementation slices; pre-registered criteria)

All spikes run in the run dir, through the REAL dispatch path where applicable (run-1 harness
lineage), script-generated results, exact-correctness asserts. Subjects: Go (native class) +
python3 (interpreter class) reference testees + deno control.

| Spike | Question (tension) | Pre-registered decision criteria |
| --- | --- | --- |
| K1 frame transport | T-1: sentinel-NDJSON stdout vs dedicated fd (fd 3) vs socket; Windows note | Adopt sentinel-stdout for T0/T1 **iff** K4 overhead bar holds AND demux misroute rate = 0 across 10k adversarial log lines (binary-ish output, giant lines, interleaved writes from threads); else fd 3 primary with stdout fallback. Socket only if both fail. |
| K2 token delivery | T-2: env vs stdin-first-frame vs pointer+loopback fetch | T0/T1 = env pointer + bootstrap token (Lambda model) **iff** /proc/environ exposure is same-user-only on the container baseline (verify) — else stdin-frame for T1 and env-pointer only for T0. T2 = in-frame per-dispatch (already locked L5). |
| K3 loopback transport | T-3: 127.0.0.1 TCP vs UDS; Deno perms, container, Aspire survival | Default = TCP 127.0.0.1 with per-env random port + bearer **iff** reachable under the sandboxed deno TaskType's `--allow-net=127.0.0.1:PORT` scoping; UDS optional capability where supported. Record Windows/PowerShell reality. |
| K4 protocol overhead | T-7: envelope build + frame parse + validation cost through real dispatch | T1 framing (envelope in, ≥3 frames out incl. result) adds **≤1.0ms to exec-wall p50** for the Go short subject (6.2ms baseline, i.e. ≤16%) and **≤5% to e2e p50 c=16**; Zod envelope validation ≤0.5ms p50 host-side. Any miss ⇒ simplify envelope (drop-to-meet list pre-declared in spike doc) before widening budget. |
| K5 stdin duplex | T-6: cancel/ping-reply over stdin on python3 + Go without buffering deadlock | T1 in-band control ships **iff** both testees receive CANCEL <100ms p95 during a blocking compute loop without runtime-specific flags beyond documented setup; else T1 control stays OS-signal-only and duplex is T2-only (Restate precedent already licenses this). |
| K6 progress e2e | D-12 fix shape: frame → ExecutionState.progress() → mutation hook → stream → SSE | Progress event visible on `/workers/executions` SSE ≤500ms p95 at 10 events/s with Temporal-throttle coalescing engaged; no unbounded growth in KV record size (cap enforced). Read-only w.r.t. packages/plugins: K6 runs against a run-dir harness replica of the mutation path, NOT by editing plugin source (verified seam study; the RFC cites the measured shape). |

Failure handling: each criterion firing "else" is a recorded drift decision, not a silent
redesign.

## L9 — RFC verdict criteria (pre-registered)

The RFC's recommendation section must follow these, whatever they yield:

1. Tier semantics ship as specified **iff** K4 holds; else the RFC narrows T1 to the reduced
   envelope and says so.
2. In-band T1 cancellation included **iff** K5 passes both testees; else T1 documents
   signal-only cancellation honestly (with the Restate citation).
3. Loopback citizen surface recommended for all tiers **iff** K3 shows sandbox-compatible
   reachability; else T0 citizen access is deferred to a follow-up and the RFC ships
   channel-only citizenship.
4. No new TaskType vocabulary is proposed (protocol is orthogonal to runtimes — series
   precedent); any contrary temptation requires rescope.
5. Every normative claim either cites the corpus, a spike result, or is marked as a design
   assertion with rationale.

## Out-of-scope register (completeness probe — what this run deliberately does NOT do)

1. **Engine implementation** of the protocol (dispatcher, adapters, loopback router, token
   mint): follow-up implementation waves with their own runs/PRs; this PR is spec + evidence.
2. **Fixing defects D-1..D-14 in source**: issues to be filed (close phase); the RFC defines
   the contract that obsoletes their classes.
3. **Per-language SDK packages** beyond the two spike reference testees (Go, python3).
4. **RFCs 1–4 citizenship addenda** (owner-directed follow-up, task #27).
5. **Broker-mediated T2 transport** (RabbitMQ-native duplex) — future possibility section.
6. **Saga park/child verbs**, dynamic capability registration, signed/attenuable token
   encoding — reserved extension points, not v1.
7. **Conformance harness implementation** — normative spec + seed case list only.
8. **Web-worker pool (#1684) implementation** — the protocol's T2 is transport-compatible with
   it; integration stays in #1684.
9. **oRPC v1→v2 migration** of the workers plugin — spikes run against v1; the RFC notes v2
   deltas where they matter.

If a reviewer/evaluator believes any of these is actually the point of the request, that is a
FAIL_RESCOPE conversation, not a silent scope change.

## Gates

- G1: spikes complete per K1–K6 protocol, 0 unexplained failures, results script-generated.
- G2: RFC fmt-clean, zero TBD, every quantitative claim traced; L9 criteria honored.
- G3: run artifacts current per slice (worklog/context-pack/drift).
- G4: docs lane only — no `packages/`/`plugins/` source mutation in this PR (spike harness code
  lives in the run dir; K6 uses a replica, not plugin edits).
- Package-quality gates: N/A (G4); if any slice violates G4 it re-gates under the touched
  archetype + quality:scan/arch:check per harness rules.

## Debt implications

The RFC converts implicit debt (black-box polyglot contract) into explicit, tiered,
conformance-tested surface; D-register items become tracked issues. No new debt entries
expected from this run; any drift recorded in drift.md.

PLAN-EVAL: **required** — dispatched via `openhands` + `status:plan-eval` labels on PR #1687
after this plan lands. Hard stop before L8 spike slices until PASS.
