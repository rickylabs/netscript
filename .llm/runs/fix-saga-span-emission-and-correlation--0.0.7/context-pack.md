# Context Pack: Emit and correlate saga cascade spans

## Run Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                  |
| Branch         | `fix/saga-span-emission-and-correlation`                         |
| Current phase  | `implement`                                                      |
| Archetype      | `3 - Runtime/Behavior`; `5 - Plugin Package` composition overlay |
| Scope overlays | runtime + telemetry + consumer proof                             |

## Current State

S1 has re-derived the defect at locked baseline `f8b4f804`, resolved the design questions, and
locked a 19-path product ceiling plus a four-writer derivative gate table. Supervisor review added
the missing MCP export-corpus check and made the leased Flow-B runtime proof explicitly
supervisor-coordinated/author-must-not-run. PLAN-EVAL cycle 2 returned `PASS_PLAN` at evaluator
commit `81c5f874`. S2 then landed as the isolated test-only commit `2146443c`: the
baseline-compatible test compiled and produced raw exit 1 with 0 passed / 2 failed, both at the
required assertions. No product source has changed. S3 telemetry/context contract work is next.

## Completed

- Read harness, doctrine, tools, PR, RTK, JSR-audit, Archetype 3, and Archetype 5 authorities.
- Confirmed all five cascade span factories have zero production callers.
- Chose truthful emission for all five: complete surrounds the engine's persisted transition, spawn
  is an error-only bridge attempt, and no span wraps the bridge's no-op complete branch.
- Assigned compensation span ownership to `SagaCompensator` and cross-plane key ownership to the
  telemetry attribute set.
- Derived public-surface and generated-derivative implications from all four actual writers.
- Measured `check:mcp-export-corpus` green at the baseline (35 packages, 270 subpaths, 7,614
  symbols) and locked its expected post-surface-change stale result as stop/report.
- Assigned the real Flow-B runtime acceptance proof to the supervisor after lease acquisition; the
  author retains only the validator unit gate.
- Measured baseline publish/doc-lint/JSR audit behavior and locked validation expectations.
- Cleared PLAN-EVAL in a separate evaluator session after two cycles.
- Proved the defect red before product edits: missing `saga.cascade.compensate` and missing
  `netscript.correlation.id`, each by assertion.

## In Progress

- S3 telemetry/W3C contract implementation.

## Next Steps

1. Add the S3 typed common context, optional structural span-context extraction, engine result
   transport, and telemetry tests.
2. Record targeted structured check/test evidence, commit, push, and update the implementation PR
   comment before S4.
3. In S4, enforce optional compensation request fields with no fallback precedence and use a typed
   instrumentation recorder for post-handler cascade size.

## Key Decisions

| Decision                                  | Source                                | Notes                                                                                      |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Emit all five cascade factories           | `plan.md` D1–D4/D9                    | Complete is engine-owned; spawn is an error attempt, not a child lifecycle.                |
| Attribute/factory/runtime ownership split | `research.md`, `plan.md` D5–D8        | Publisher key wins cross-plane; definition rule wins saga key; downstream consumes both.   |
| Explicit W3C context handoff              | `plan.md` D7–D8                       | Direct parent survives ended/non-ambient spans.                                            |
| Compensator owns compensate span          | `plan.md` D3                          | Missing, nested, and thrown outcomes are measured at the operation owner.                  |
| No generated writes                       | four-writer inspection, `plan.md` D10 | MCP corpus is expected to move; author stops/reports rather than regenerating.             |
| Leased runtime ownership                  | supervisor review, gate 19            | REQUIRED supervisor-coordinated; author-must-not-run.                                      |
| Optional request fields, no fallback      | PLAN-EVAL cycle 2 F3b                 | Bridge supplies values; absent direct/external values remain absent and are never derived. |
| Complete transition truth                 | PLAN-EVAL cycle 2 F1                  | Emit storeless or stored; status is resolved persisted status, not a success promise.      |

## Files Changed

| Path                                                                    | Status | Notes                  |
| ----------------------------------------------------------------------- | ------ | ---------------------- |
| `.llm/runs/fix-saga-span-emission-and-correlation--0.0.7/*.md`          | new    | Harness state/evidence |
| `packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts` | new    | S2 red-before contract |

## Gates

| Gate family | Current status    | Evidence                                                                         |
| ----------- | ----------------- | -------------------------------------------------------------------------------- |
| Static      | baseline measured | package publish dry-run exit 0; doc-lint existing exit 1/nine findings           |
| Fitness     | baseline measured | JSR audit exit 0 with two existing warnings                                      |
| Runtime     | NOT_RUN           | prohibited without lease                                                         |
| Consumer    | baseline measured | MCP corpus check exit 0 now; post-change stale expected and supervisor-sequenced |
| S2 negative | PASS              | raw exit 1; 0 passed / 2 failed assertions; commit `2146443c`                    |

## Open Questions

- None. PLAN-EVAL is cleared; implementation carry-forward choices are locked in `worklog.md`.

## Drift and Debt

- Drift: local `origin/main` advanced after the owner-locked baseline; route override and missing
  RTK executable are recorded in `drift.md`.
- Debt: existing plugin-sagas-core JSR/cardinality findings are unchanged and out of scope.

## Commits

- See the draft PR's commit list and per-slice PR comments after the S1 push.
