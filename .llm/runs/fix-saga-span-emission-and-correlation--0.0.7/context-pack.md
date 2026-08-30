# Context Pack: Emit and correlate saga cascade spans

## Run Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                  |
| Branch         | `fix/saga-span-emission-and-correlation`                         |
| Current phase  | `plan-eval`                                                      |
| Archetype      | `3 - Runtime/Behavior`; `5 - Plugin Package` composition overlay |
| Scope overlays | runtime + telemetry + consumer proof                             |

## Current State

S1 has re-derived the defect at locked baseline `f8b4f804`, resolved the design questions, and
locked a 19-path product ceiling plus a four-writer derivative gate table. Supervisor review added
the missing MCP export-corpus check and made the leased Flow-B runtime proof explicitly
supervisor-coordinated/author-must-not-run. No product or test file has changed. The next action is
independent PLAN-EVAL; S2 must not begin before that verdict.

## Completed

- Read harness, doctrine, tools, PR, RTK, JSR-audit, Archetype 3, and Archetype 5 authorities.
- Confirmed all five cascade span factories have zero production callers.
- Chose truthful emission for all five, including an error span for unsupported structural spawn.
- Assigned compensation span ownership to `SagaCompensator` and cross-plane key ownership to the
  telemetry attribute set.
- Derived public-surface and generated-derivative implications from all four actual writers.
- Measured `check:mcp-export-corpus` green at the baseline (35 packages, 270 subpaths, 7,614
  symbols) and locked its expected post-surface-change stale result as stop/report.
- Assigned the real Flow-B runtime acceptance proof to the supervisor after lease acquisition; the
  author retains only the validator unit gate.
- Measured baseline publish/doc-lint/JSR audit behavior and locked validation expectations.

## In Progress

- Separate-session PLAN-EVAL.

## Next Steps

1. Evaluator writes `plan-eval.md` and returns APPROVED or CHANGES_REQUIRED.
2. If approved, implementation author creates the S2 failing test only, runs the targeted wrapper
   against unchanged product code, records raw exit/pass/fail counts, commits, and pushes.
3. Stop at the S2 boundary unless the owner separately authorizes implementation continuation.

## Key Decisions

| Decision                                  | Source                                | Notes                                                                          |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Emit all five cascade factories           | `plan.md` D1–D4                       | Spawn is an error attempt, not a successful child lifecycle.                   |
| Attribute/factory/runtime ownership split | `research.md`, `plan.md` D5–D6        | Both correlation fields emitted with distinct meanings.                        |
| Explicit W3C context handoff              | `plan.md` D7–D8                       | Direct parent survives ended/non-ambient spans.                                |
| Compensator owns compensate span          | `plan.md` D3                          | Missing, nested, thrown, and direct paths are observable.                      |
| No generated writes                       | four-writer inspection, `plan.md` D10 | MCP corpus is expected to move; author stops/reports rather than regenerating. |
| Leased runtime ownership                  | supervisor review, gate 18            | REQUIRED supervisor-coordinated; author-must-not-run.                          |

## Files Changed

| Path                                                           | Status | Notes                 |
| -------------------------------------------------------------- | ------ | --------------------- |
| `.llm/runs/fix-saga-span-emission-and-correlation--0.0.7/*.md` | new    | S1 harness state only |

## Gates

| Gate family | Current status    | Evidence                                                                         |
| ----------- | ----------------- | -------------------------------------------------------------------------------- |
| Static      | baseline measured | package publish dry-run exit 0; doc-lint existing exit 1/nine findings           |
| Fitness     | baseline measured | JSR audit exit 0 with two existing warnings                                      |
| Runtime     | NOT_RUN           | prohibited without lease                                                         |
| Consumer    | baseline measured | MCP corpus check exit 0 now; post-change stale expected and supervisor-sequenced |

## Open Questions

- None in the author plan. PLAN-EVAL is required because the design changes explicit dependency and
  trace-context contracts.

## Drift and Debt

- Drift: local `origin/main` advanced after the owner-locked baseline; route override and missing
  RTK executable are recorded in `drift.md`.
- Debt: existing plugin-sagas-core JSR/cardinality findings are unchanged and out of scope.

## Commits

- See the draft PR's commit list and per-slice PR comments after the S1 push.
