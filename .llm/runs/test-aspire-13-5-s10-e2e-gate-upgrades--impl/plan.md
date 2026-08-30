# Plan — S10 structured Aspire E2E gates

The owner ratified this bounded S10 dispatch after the epic plan's two separate PLAN-EVAL cycles. No
third ordinary PLAN-EVAL is authorized. A separate Fable IMPL-EVAL remains mandatory after Phase A.

## Architecture decisions — LOCKED

1. Doctor evaluation is data-first: preserve the JSON child report, fail on any `status: fail`, and
   retain warnings without converting them to failures.
2. One bounded `describe --follow --format Json` process writes NDJSON during Aspire start. Every
   readiness assertion consumes last-seen state from that file; S6 listener checks continue to
   require object-valued `healthReports`.
3. `ASPIRE_CLI_START_TIMEOUT` is the single positive-integer budget for describe capture and
   resource-command observation; no parallel timeout policy is introduced.
4. Cleanup always targets the exact AppHost. With `--cleanup`, normal stop is followed by force stop
   and a read-only ownership probe. The probe mirrors S7 path evidence but imports nothing from
   `.llm/tools`.
5. `runtime.resource-command` exercises the S8 typed database command and background restarts, then
   asserts the resulting topology through describe evidence. Missing runtime start produces an
   explicit durable skip receipt.
6. Process/filesystem IO stays in `runtime/` gate-edge modules; parsers and ownership predicates
   remain pure and fixture-tested. No casts, `any`, or lint suppressions are permitted.

## Open-decision sweep

- Safe to defer: exact Phase-B resource timings and real Docker IDs; the lease-backed receipts own
  those observations.
- Safe to defer: S9 gate adjacency until the stacks meet. S10 registers immediately before cleanup,
  so a later S9 integration keeps both runtime evidence gates ahead of cleanup.
- Must resolve now: none. Gate IDs, receipt paths, skip semantics, ownership evidence, and timeout
  policy are locked above.

## Slices

1. RED contract fixtures/tests and run bootstrap. Gate: focused structured test wrapper, expected
   non-zero. Files: fixtures, four runtime module skeletons, focused tests, run artifacts.
2. Doctor receipt and describe-follow convergence. Gates: focused tests, scoped check/lint/fmt,
   `quality:scan`, `arch:check`. Files: preflight/runtime gates and evidence modules.
3. Exact stop/force cleanup and S7-compatible ownership probe. Gates: focused fixtures/tests plus
   framework quality gates. Files: cleanup evidence module and cleanup gate wiring.
4. Resource-command gate class, both-tier ordering, and explicit skip receipt. Gates: focused
   fixtures/tests, suite registry/order tests, framework quality gates.
5. Docs, generated assets if needed, full Phase-A static gate matrix, #1372 update draft, and
   handoff artifacts. Gates: scoped wrappers, raw excluded-file lint/fmt, `quality:scan`,
   `arch:check`, assets/publish/emitted-samples checks, touched tests.

## Risk register

| Risk                             | Mitigation                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------- |
| NDJSON shape drift               | Fail closed per line and test last-seen convergence plus malformed input.    |
| Cleanup claims foreign resources | Exact normalized path evidence only; fixtures include foreign/unproven rows. |
| Warnings block healthy hosts     | Doctor policy records warnings but fails only explicit failures.             |
| Runtime phase absent             | Durable `SKIPPED` receipt; gate never silently disappears.                   |
| S9 not in ancestry               | Register before cleanup and record the pending stack-order reconciliation.   |

## Required gates

Archetype 6 static wrappers; raw lint/fmt for config-excluded changed files; focused tests;
`quality:scan`; `arch:check`; `check:assets-barrel`; `check:publish-assets`;
`check:emitted-samples`. Runtime and full `e2e:cli` are Phase B and prohibited here.

## Deferred scope

Phase-B dual-tier `scaffold.runtime --cleanup`, real AppHost receipts, persistent-container leak
receipt, saga compensation semantics, streams residual work, new suites, and OpenHands triggers.
