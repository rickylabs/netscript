# Evaluation: W3-A #1326 — DurableStreamProducer bounded reconnect (PR #1402)

## Metadata

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326`                           |
| Target         | `packages/plugin-streams-core` + focused streams E2E gate                 |
| Archetype      | `3 — Runtime/Behavior`                                                    |
| Scope overlays | none (Aspire runtime validation in-plan)                                  |
| Evaluator      | Claude · Fable 5 · medium, separate session, 2026-08-09                   |
| Generator      | Codex · GPT-5.6 Sol · medium (`/home/codex/repos/ns005-w3a`, not entered) |
| Head / base    | `331be727e` vs `origin/main@3f41a3639` (merge-base `aa8e151e6`)           |

## Verdict

`PASS`

All seven live #1326 acceptance rows are truthfully evidenced; the RED classes are genuinely
separate and reproduce exactly as recorded; the decisive quality evidence is the package-scoped
pair and the aggregates are disclosed as non-decisive; the #1329 envelope and the #1398 deferral
are respected; both accepted debts are cited and neither is deepened. Findings below are minor and
non-blocking; two merge-path conditions are recorded for the orchestrator.

## Question 1 — silent loss removed, not relocated

Verified in source and by executed tests, not from the worklog:

- **Overflow is reject-newest with an immediate, settled receipt.**
  `durable-stream-producer-queue.ts:61-90` — count/byte bounds checked before admission; rejection
  returns `accepted: false` with an already-settled `completion` and fires
  `lifecycle.finish({status:'rejected'})`, which ends the span and increments `WRITES_REJECTED`
  (`instrumentation.ts:186-210` → `producer-metrics.ts:132-144`). No accepted entry is ever
  evicted.
- **Every accepted write settles exactly once.** All settlement funnels through `queue.settle`
  (`durable-stream-producer-queue.ts:101-114`, `settled` guard) → `lifecycle.finish` →
  `recordOutcome`. Drop paths are metered, not only the happy path — executed proof:
  `tests/telemetry/durable-stream-producer-telemetry_test.ts:172-229` asserts `WRITES_REJECTED`
  on overflow, `WRITES_DROPPED` on stop-cancellation, and `DELIVERY_UNKNOWN` on retry exhaustion;
  ran green in my re-execution (`deno test --no-lock --allow-all packages/plugin-streams-core/tests/`
  → exit 0, 29 passed / 0 failed).
- **Terminal honesty on exhaustion/stop.** `durable-stream-producer-supervisor.ts:181-202,412-432` —
  attempted active write settles `delivery-unknown`, unattempted queued writes settle `cancelled`,
  later writes reject; nothing is silently discarded. Callers that ignore receipts still get
  `flush()` rejection on any non-delivered outcome (`supervisor.ts:160-173`) plus metrics/spans.
- **Exact replay preserved.** Transport retries byte-identical body and `(producerId, epoch, seq)`
  tuple (`durable-stream-producer-transport.ts:60-91`); asserted at
  `durable-stream-producer-telemetry_test.ts:148-151` and by the real-server idempotency test under
  `plugins/streams/tests/service/`.

## Question 2 — can the decisive gate fail?

`verify-producer-reconnect.ts` + `plugins/streams/src/e2e/probes/producer-reconnect.ts` read in
full. The gate has six independent throw points, each reachable: (1) `waitForStreamsOffline` throws
if the stopped resource stays reachable; (2) the probe throws unless the producer reaches a real
`backoff` state within 10 s (`producer-reconnect.ts:127-140`); (3) all three receipts must settle
`delivered`; (4) read-back must return exactly `outage-1 → outage-2 → outage-3` FIFO
(`reconnectSnapshotResult`, hard mismatch error); (5) the dashboard trace with the trace id
extracted from the *server-side read-back event's* `traceparent` must contain
buffered/retry/recovered/settled events and `netscript.outcome=delivered`
(`verify-producer-reconnect.ts:40-66`); (6) captured — not synthetic — OTLP metric payloads must
show positive `retries`/`recoveries`/`writes_delivered` for the exact producer id + stream path.

Executed pre-fix-class failure exists: the S5 recorded RED (raw exit 1 — producer never entered
backoff while the stopped resource's DCP proxy stayed reachable, before `requestTimeoutMs`
existed; drift.md entry "Real stopped-resource proxy requires a per-request timeout"). That is
this exact gate failing on a real defective state, so the gate demonstrably can fail. Against
pre-fix `main` the probe cannot even compile (uses `state`/receipts) and the underlying behavior
fails the four S1 behavioral REDs I re-executed (below). I did not re-run the serialized
`scaffold.runtime` suite (token protocol: one authorized run, released at S7); the S7 raw-exit-0
`passed=79 failed=0 skipped=2` record is accepted with the gate-code verification above.

## Question 3 — RED classes genuinely behavioral and distinct (re-executed)

At S1 commit `11ee98e22` (scratch worktree, run 2026-08-09):

- Four behavioral REDs, run **separately** by filter — each raw exit 1 on its own runtime
  `AssertionError`, zero TypeScript diagnostics:
  - initial outage → "initial outage must not remain latched after the server becomes available"
    (and the pre-fix false warning `Skipping event ... producer connection failed` printed live);
  - mid-session outage → "mid-session batch failure must retain the failed in-flight write";
  - recovery → "recovery must deliver the write that was accepted while connecting";
  - FIFO → "FIFO must retain the exact order of writes across reconnect".
  Two distinct pre-fix mechanisms are exercised as cycle 2 required: initial-outage/recovery start
  offline (latched `#connectError`); mid-session/FIFO start **online** and fail through
  unsupervised upstream batch loss (`installControlledStreamsFetch(true)`, append 503).
- Four API-absence fixtures at
  `.llm/runs/.../w3-a-1326/red-fixtures/producer-api-absence/` (present at S1, removed at S2 per
  plan), each checked individually — each raw exit 1 with **only** its named TS2339: `accepted`,
  `completion`, `stop`, `waitUntilReady`. No shared or unrelated diagnostic.
- At head all four behavioral tests pass as runtime tests
  (`--filter 'BEHAVIORAL'` → 4 passed / 0 failed); none became compile-time.

## Question 4 — #1329 envelope respected

- Diff-wide scan of added lines for offset parse/compare/arithmetic: zero hits. The only matches
  are OTLP metric-number coercion in the E2E gate, `parseNonNegativeInteger` on the **producer
  epoch header** of a 403 stale-epoch response (`durable-stream-producer-transport.ts:96-99` —
  the upstream idempotency tuple, not an SSE offset), and the probe's `?offset=-1` request
  parameter, which matches the pre-existing read-back convention on main
  (`plugins/streams/services/src/proxy_test.ts:98`, `sse-contract_conformance_test.ts:108`).
- No file under `src/domain/sse-contract-v1.ts`, `src/application/stream-sse-v1.ts`, or any
  `bindStreamEventSourceV1` surface is touched (diff stat). No parallel readiness/heartbeat/
  terminal semantics: producer lifecycle is a new producer-side concept; `streamClosed` is reached
  only via acknowledged `close()` (`supervisor.ts:220-260`), and README states offsets remain
  consumer-owned opaque tokens.

## Question 5 — #1326 acceptance rows

Proven / not proven statement is at the end of this file. `Closes #1326` is correct: the PR fully
resolves the issue; no other issue is claimed closed.

## Question 6 — gate integrity

- **No new escape hatches.** Grep over added product-diff lines for
  `deno-lint-ignore | @ts-ignore | @ts-expect-error | as unknown as | any` → zero hits outside
  `.llm/runs/**`.
- **Decisive package-scoped pair re-executed at head:**
  - `scan-code-quality.ts --root packages/plugin-streams-core/src` → exit 0,
    `findings:[] allowCount:0`.
  - `check-doctrine.ts --root packages/plugin-streams-core` → exit 0, `FAIL=0 WARN=0 INFO=1`
    (INFO A9: pre-existing missing `docs/architecture.md`).
- **Aggregates recorded as non-decisive, not claimed as coverage** — PR body, S3/S6 comments and
  `worklog.md` all state the roots omit this package and #1403 owns the gap. Verified wording, not
  just presence.
- **Scoped wrappers re-executed at head:** check/lint/fmt each 43 files, exit 0, zero findings.
- **F-14 reproduced:** `grep -rn 'console\.' src/` → exactly one match, a JSDoc example at
  `src/diagnostics/inspect-stream-topic.ts:42`; zero executable uses.
- **Debts:** AP-13 producer row closed narrowly in `arch-debt.md` with passing-gate evidence
  (reproduced above) — valid closure, no broader AP-13 waiver implied; `plugins/streams`
  connector-convergence debt untouched (arch-debt diff touches only the AP-13 row). Neither debt
  deepened.
- **JSR:** audit helper exit 0, 43 files, 4 exports, sole warning is the known dry-run banner
  count (disclosed, drift-recorded); detached consumer fixture
  `tests/type-fixtures/producer-consumer_type.ts` re-checked with its no-workspace config → exit 0.
- **`deno.lock`** absent from the diff; no dependency/manifest change.

## Question 7 — #1398 deferral untouched

`otel-gates.ts` diff only inserts the new `behavior.streams.producer-reconnect` gate;
`BEHAVIOR_OTEL_STREAM_CONSUMER`/`BEHAVIOR_OTEL_TRACES` definitions unchanged, still excluded from
`RUNTIME_GATES` (`capability-suites.ts`), and `suite-registry_test.ts` still asserts both absent
from the runtime suite. S7 recorded exactly `skipped=2`, matching the deferral. Not re-enabled,
not widened.

## Findings (by severity)

### MINOR-1 — rejection reason mislabeled during graceful-close drain

`close()` sets `#accepted = false` immediately, but the lifecycle transition to `stopping` happens
only after drain (`durable-stream-producer-supervisor.ts:205-226`). A write arriving during the
drain window is rejected via `stateRejection(state)` while state is still `ready`/`connecting`, so
it reports reason `producer-failed` instead of a stopping-class reason
(`create-durable-stream.ts:131-132,251-261`). The rejection is explicit and metered — no loss —
but the reason string misdescribes a healthy closing producer. Fix candidate for a follow-up
slice; not blocking.

### MINOR-2 — non-retryable transport failure on an attempted write settles as `delivery-unknown: retry-exhausted`

`#failActive` maps every non-aborted failure to reason `retry-exhausted`
(`durable-stream-producer-supervisor.ts:412-423`), including first-attempt non-retryable protocol
rejections (e.g. 409 without expected-seq, 4xx). Conservative and explicit — never a false
`delivered` — but the reason string is inaccurate for the non-retryable branch and the
`delivery-unknown` class is stronger than needed when the server positively refused the append.
Semantics remain safe; not blocking.

### OBSERVATION-1 — CI at head is entirely SKIPPED (draft-PR design)

`gh pr view 1402 --json statusCheckRollup` → every check `COMPLETED/SKIPPED`. This is the repo's
intended draft behavior (`ci.yml:56,109,181,245,318` gate on `draft == false`), so no repository
CI lane has yet executed this branch. My local re-execution covers the package-scoped lanes;
`ready_for_review` must still produce a green CI run before merge.

### OBSERVATION-2 — live #1326 acceptance checkboxes remain unchecked

All seven `- [ ]` rows on the live issue are unchecked. The close-gate (protocol rule 12,
`netscript-pr`) requires them checked with linked evidence before `status:ready-merge`/merge; the
mirror contract needs the evidence comment/label sequencing to be honored at ready time. Merge-path
obligation for the orchestrator, not an implementation defect.

### OBSERVATION-3 — main moved two commits past the branch base

Merge-base is `aa8e151e6`; `origin/main@3f41a3639` adds #1400/#1401 (MCP host CLI, agent MCP
docs) — no file overlap with this diff. No rebase required for correctness; standard merge
freshness applies.

### OBSERVATION-4 — cosmetic

`src/ports/stream-producer-port.ts` places its `import type` block at the bottom of the file.
Legal, lint/fmt-clean; style only.

## Process verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 3 `PASS` (owner-ratified third cycle, recorded in drift); S1 commit `11ee98e22` postdates repair `e26c28db6` |
| Design section exists in worklog       | PASS   | `worklog.md` "## Design", recorded before product code |
| Commit slices match design plan        | PASS   | S0–S7 in commit list = plan slice table; per-slice PR comments present |
| Each slice has a passing gate          | PASS   | Per-slice comments carry raw exits; decisive ones re-executed here |
| Evaluator separation                   | PASS   | Generator Codex/GPT-5.6 Sol (supervisor.md); this verdict is a separate Claude · Fable 5 session — canonical opposite-family route |
| SKILL chapters in briefs               | PASS   | `implement.md:7`, `brief-launch.md:7` |
| Serialized expensive gate discipline   | PASS   | Request S6 / grant ledger row 59 / exactly one run / release recorded |
| Leak hygiene                           | PASS   | `leak-report.md` committed; foreign `redis-jfgcbtaf` untouched |

## #1326 acceptance rows — proven / not proven

| # | Row | Verdict | Decisive evidence |
| - | --- | ------- | ----------------- |
| 1 | Initial and later transport failures enter a documented reconnect state | **Proven** | Exported finite lifecycle (`producer-contract-v1.ts:1-13`), README contract section, behavioral tests re-executed green at head |
| 2 | Retry/backoff, cancellation, readiness, and shutdown semantics are explicit | **Proven** | D2 policy types + `waitUntilReady`/`stop`/`close` contract; contract tests (stop-during-backoff, readiness, close-after-abort) in the 29-green suite |
| 3 | Buffer bounds and overflow behavior explicit; writes not silently lost | **Proven** | Dual-bound reject-newest with settled receipts (`queue.ts:61-90`); rejected/dropped/unknown metric assertions executed |
| 4 | Producer recovers when the stream server starts after the producer | **Proven** | Behavioral recovery test (RED at S1, green at head, both re-executed); real Aspire stopped-then-started gate PASS in serialized S7 run |
| 5 | Tests cover initial outage, mid-session outage, recovery, ordering, shutdown during backoff | **Proven** | Four distinct behavioral REDs re-executed individually + stop-during-backoff runtime test; distinctness verified per Question 3 |
| 6 | OTEL spans/metrics expose connection state, retries, dropped/buffered events, recovery, using the standardized envelope | **Proven** (with disclosed narrowing) | Span-event/metric wiring verified in source and unit tests; real proof = dashboard trace + captured-forwarded OTLP metrics (Aspire 13.4 has no metric query API — drift-recorded, no synthetic metric accepted) |
| 7 | Operator messages never promise a transition the implementation cannot perform | **Proven** | The false "until reconnect" warning is gone; F-14 reproduced independently: zero executable `console.*` in `src/` |

No row is merely observational: rows 1–5 and 7 have executed negative evidence (REDs I re-ran, or
the removed-warning grep), and row 6's real-runtime half is an executed gate whose failure mode was
demonstrated during S5.

## Conditions for the orchestrator (merge path, outside this verdict's blocking scope)

1. Flip to ready and obtain the non-draft green CI run (OBSERVATION-1).
2. Honor the close-gate: check the seven #1326 acceptance boxes with linked evidence (or let the
   mirror do it with correct label/push sequencing) before `status:ready-merge` (OBSERVATION-2).
