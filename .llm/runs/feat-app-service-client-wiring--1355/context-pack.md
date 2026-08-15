# Context Pack: app-side service client/query wiring

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-app-service-client-wiring--1355`               |
| Branch         | `feat/app-service-client-wiring`                     |
| Current phase  | `plan`                                               |
| Archetype      | `2 — Integration` (SDK seam; CLI 6/Fresh 4 retained) |
| Scope overlays | `frontend`                                           |

## Current State

Phase-1 research and planning are complete at baseline `3fc0f2f92`. The old fixed export names have
already been repaired and moved, but the literal `service` key, dead invalidation, missing
all-service generator, and both cache-age omissions remain. PLAN-EVAL is proposed required. No
product implementation or expensive gate has run. Draft PR #1664 is open with both closing keywords,
milestone `0.0.7`, the required taxonomy, acceptance mappings, and structured RESEARCH and PLAN
comments. PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `7f20a34fe`, ruling direct `clientKey()`
emission and package README locations while identifying six plan-text gaps. Those gaps are amended
without product changes; a separately dispatched cycle 2 remains the hard stop.

## Completed

- Verified branch/worktree/base/clean-tree identity and no designed upstream.
- Read the required harness, doctrine, CLI, tooling, Deno/JSR, PR, Fresh, and RTK guidance.
- Re-verified both issue contracts and all current code paths.
- Recorded compatibility, three-package public delta, JSR bar, slice plan, receipt set, and lease
  conditions.
- Committed and pushed S0, opened draft PR #1664, and advanced its single lifecycle label from
  `status:research` to `status:plan` alongside the two phase comments.
- Applied the Tier-A T-1/T-2 plan repair without product, gate-catalog, lockfile, or docs changes.
- Read the cycle-1 evaluator artifact in full and accepted its direct-emit, README, owned-path, and
  whole-command flag rulings.
- Amended research, design, slices, compatibility, and exact scenarios without editing
  `packages/**`.

## In Progress

- Stopped before implementation; the cycle-1 repair awaits coordinator verification and a separate
  PLAN-EVAL cycle-2 dispatch.

## Next Steps

1. Topic orchestrator verifies the repaired plan head.
2. Coordinator separately grants and launches PLAN-EVAL cycle 2.
3. Only after cycle-2 PASS, begin S1 at a bounded Tier-A stop.

## Key Decisions

| Decision                                            | Source                 | Notes                                                          |
| --------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Router identity is the resource identity            | `plan.md` D1           | Manifest-derived and collision-safe.                           |
| Existing apps change only on generation             | Research compatibility | Regeneration is an explicit source migration.                  |
| Both expensive gates are lease-blocked              | Leaf brief / plan      | Run only after cheap gates are green and coordinator releases. |
| Direct `clientKey()` filter; no SDK overload        | PLAN-EVAL cycle 1      | Preserves SDK 0.0.6 compatibility and satisfies A6.            |
| Client generator owns `apps/<app>/lib/<service>.ts` | PLAN-EVAL cycle 1      | Init-owned showcase remains separate but shares the template.  |

## Files Changed

| Path                                                             | Status | Notes                                     |
| ---------------------------------------------------------------- | ------ | ----------------------------------------- |
| `.llm/runs/feat-app-service-client-wiring--1355/supervisor.md`   | New    | Session identity and routes.              |
| `.llm/runs/feat-app-service-client-wiring--1355/research.md`     | New    | Re-baselined findings and determinations. |
| `.llm/runs/feat-app-service-client-wiring--1355/plan.md`         | New    | Contract-first slice and gate plan.       |
| `.llm/runs/feat-app-service-client-wiring--1355/worklog.md`      | New    | Design ledger and Phase-1 record.         |
| `.llm/runs/feat-app-service-client-wiring--1355/context-pack.md` | New    | Resumption state.                         |
| `.llm/runs/feat-app-service-client-wiring--1355/drift.md`        | New    | Append-only rebaseline/reference drift.   |

## Gates

| Gate family | Current status                                       | Evidence                           |
| ----------- | ---------------------------------------------------- | ---------------------------------- |
| Static      | Identity PASS; product gates NOT_RUN                 | `worklog.md`                       |
| Fitness     | Cycle 1 `FAIL_PLAN`; amended; cycle 2 not dispatched | `plan-eval.md`, repaired artifacts |
| Runtime     | NOT_RUN / lease-blocked                              | `plan.md` release conditions       |
| Consumer    | NOT_RUN / implementation-dependent                   | `plan.md` S5                       |

## Open Questions

- None for the implementation author; cycle 2 verifies completeness rather than reopening ruled
  forks.

## Drift and Debt

- Drift: issue paths/names moved; naming fixed; stale SDK comment; missing frontend reference; and
  the initial plan misclassified `scaffold.runtime` as a catalog-backed receipt gate before Tier-A
  corrected it to the release-gate class.
- Debt: no new or updated architecture debt proposed.

## Commits

- See draft PR #1664's commit list and per-slice PR comments.
