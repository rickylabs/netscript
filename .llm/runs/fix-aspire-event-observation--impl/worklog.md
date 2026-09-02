# Implementation Worklog — #1906 slice 1

## Status

- 2026-09-02 — Activated the harness implementation lane at `7a3fcecb3` on
  `fix/aspire-event-observation`; read #1906, the implementation brief, and the required harness,
  Aspire, PR, tooling, RTK, and doctrine navigation.
- 2026-09-02 — Confirmed the owned tree was clean except for the supervisor-created untracked run
  directory. RTK is unavailable on this host, so read-only Git inspection uses raw non-paging Git
  and gate verdicts will use the required structured Deno wrappers.
- 2026-09-02 — The checked-in Aspire skill lacks the issue-cited resource-observation section. The
  issue, implementation brief, and supervisor addenda therefore provide the controlling contract for
  this slice: scoped `aspire describe <resource> --follow --format Json`, no AppHost injection, no
  one-shot lifecycle handles, subscription before induction, buffered NDJSON, and deterministic
  child termination.
- 2026-09-02 — Implemented and verified the bounded slice. A pre-commit review caught the fixture at
  524 LOC; the baseline was tightened to one scoped snapshot per resource, bringing the file to 490
  LOC without debt or scope expansion. Final required gates passed after that change.

## Plan-Gate disposition

`PLAN-EVAL: N/A` for this implementation lane: #1906 plus the supervisor brief/addenda lock the API,
accepted NDJSON container shapes, sequencing, cleanup rules, bounded file scope, and exact
verification. There is no architecture choice left for this lane to resolve. IMPL-EVAL remains a
separate-session supervisor responsibility; this lane will not self-certify.

## Design

### Surface and domain vocabulary

- Internal E2E surface: `watchResourceUpdates(appHost, resourceName)` returns a closable
  subscription with `waitFor(predicate, ceilingMs)`.
- `ResourceUpdate` retains the raw NDJSON line and the single scoped resource object so errors and
  predicates stay evidence-rich without widening the undocumented schema.
- The parser accepts only the two brief-approved line containers: `{ resources: [...] }` and a
  single resource object. A missing/mismatched scoped resource, malformed JSON, or any other shape
  fails immediately with the raw line.
- `waitFor` is sequential and consumptive: it scans buffered updates first, advances past every
  examined update, then awaits new input. This prevents recovery waits from matching an earlier
  healthy event while preserving events received between subscription and induction.

### Ports and lifecycle

- The real process edge is `Deno.Command('aspire', ...)`, scoped with the positional resource and
  `--follow --format Json`. Tests inject a `Deno.Command` that emits synthetic NDJSON; no Aspire
  runtime is required.
- The subscription owns stdout parsing, stderr capture, process-exit reporting, notification of
  waiters, and idempotent close. Parse/stream failure terminates the child immediately; caller
  `finally` blocks close it on all other paths.

### Transition and attribution split

- The follow stream detects aggregate health departure and recovery. One subscription is opened
  before the listener is closed and remains active through reopen, so both directions are push
  observed.
- If an event carries the target `healthReports` entry, D-101 asserts its structured failure code
  directly. Otherwise it takes exactly one scoped snapshot after the unhealthy transition and
  performs the same structured-code-first assertion there. The snapshot attributes an already
  observed transition; it never discovers one and is never polled.
- PR #1907's opposite-family live audit confirmed Aspire 13.5.3 follow mode emits NDJSON
  single-resource objects with `state` and evaluated `healthStatus`; the observed sample did not
  carry `healthReports`. D-101 therefore takes the confirmed aggregate-event detector path followed
  by one scoped snapshot for per-check attribution. The defensive envelope parser remains for the
  documented snapshot container, and an unfamiliar line still fails loudly with its raw text.

### Constants

- Any stream wait duration is named and commented as a test-failure ceiling only: it bounds a hung
  test and is never an assumed Aspire transition schedule.
- Existing controller acknowledgement timing remains outside resource-state observation and is
  retained; its constants will be documented as controller-protocol failure ceilings/sampling.

### Commit slice and proving gates

1. Add the resource-state subscription, synthetic-NDJSON unit tests, and rewire only D-101 in both
   directions; update this worklog. Prove with the scoped check wrapper, affected unit tests, and
   scoped format wrapper required by the brief. Do not run local `e2e:cli`; CI owns live schema
   proof because the Aspire supervisor holds the runtime lease.

### Deferred scope and contributor path

- All other Bucket A/C sites, a regression scanner, live schema confirmation, and issue-wide
  completion remain follow-up work under #1906.
- A follow-up adopter imports `watchResourceUpdates`, subscribes before inducing a change, awaits a
  precise resource predicate under a failure ceiling, and closes in `finally`; it does not add a
  poll loop or an AppHost subscriber.

## Gate evidence

| Gate                | Result                 | Evidence                                                                                                                                                                    |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped source check | PASS                   | `deno run --allow-read --allow-run --allow-write .llm/tools/run-deno-check.ts --root packages/cli/e2e/src --ext ts` — 136 files, 2 batches, 0 failed batches, 0 occurrences |
| Affected unit tests | PASS                   | `deno test --allow-all --no-lock` on `resource-state-stream_test.ts`, `listener-unreachable-fixture_test.ts`, and `listener-readiness-gates_test.ts` — 14 passed, 0 failed  |
| Scoped format check | PASS                   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts` — 192/192 files processed, 0 failed batches, 0 findings                     |
| Live follow schema  | PASS (external audit)  | PR #1907 observed single-resource NDJSON objects with `state` and evaluated `healthStatus` on Aspire 13.5.3; no per-check `healthReports` appeared in the sample            |
| Full `e2e:cli`      | NOT RUN by instruction | The local runtime lease is held by the Aspire supervisor; CI is the D-101 live-stream proof surface                                                                         |

### Non-vacuity

`resource subscription ceiling rejects when the predicate never matches` feeds a valid Healthy
event, waits for Unhealthy, and wraps `waitFor` in `assertRejects`. It passed in the affected-test
run. If `waitFor` returned silently instead of rejecting at the failure ceiling, `assertRejects`
would fail the test; the same test also asserts the follower was killed after expiry.

## Implementation result

- The follower command is resource-scoped: `aspire describe <resource> --follow --format Json`.
- The stdout reader is attached before `watchResourceUpdates` resolves; sequential waits consume
  buffered events and cannot rematch the initial Healthy event during recovery.
- Malformed/unrecognized lines carry their raw input in the thrown error. Parse errors, predicate
  errors, and ceiling expiry terminate the child, while fixture callers also close in `finally`.
- D-101 now observes both induced directions from one pre-induction subscription. The structured
  failure code remains authoritative, with the wording-tolerant description fallback used only when
  the data bag has no code.
- No other Bucket A/C site and no product source changed.
