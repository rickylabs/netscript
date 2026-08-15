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
comments.

## Completed

- Verified branch/worktree/base/clean-tree identity and no designed upstream.
- Read the required harness, doctrine, CLI, tooling, Deno/JSR, PR, Fresh, and RTK guidance.
- Re-verified both issue contracts and all current code paths.
- Recorded compatibility, three-package public delta, JSR bar, slice plan, receipt set, and lease
  conditions.
- Committed and pushed S0, opened draft PR #1664, and advanced its single lifecycle label from
  `status:research` to `status:plan` alongside the two phase comments.

## In Progress

- Stopped before implementation while the topic orchestrator decides the proposed PLAN-EVAL
  determination.

## Next Steps

1. Topic orchestrator decides the proposed PLAN-EVAL determination.
2. If accepted, fresh opposite-family PLAN-EVAL decides the three open questions.
3. Only after PASS, begin S1 at a bounded Tier-A stop.

## Key Decisions

| Decision                                          | Source                 | Notes                                                          |
| ------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Router identity is the resource identity          | `plan.md` D1           | Manifest-derived and collision-safe.                           |
| Existing apps change only on generation           | Research compatibility | Regeneration is an explicit source migration.                  |
| Both expensive gates are lease-blocked            | Leaf brief / plan      | Run only after cheap gates are green and coordinator releases. |
| Typed bridge overload is recommended, not decided | Research/plan          | PLAN-EVAL owns the choice.                                     |

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

| Gate family | Current status                                | Evidence                     |
| ----------- | --------------------------------------------- | ---------------------------- |
| Static      | Identity PASS; product gates NOT_RUN          | `worklog.md`                 |
| Fitness     | Plan written; PLAN-EVAL pending determination | `research.md`, `plan.md`     |
| Runtime     | NOT_RUN / lease-blocked                       | `plan.md` release conditions |
| Consumer    | NOT_RUN / implementation-dependent            | `plan.md` S5                 |

## Open Questions

- SDK overload versus direct generated filter.
- Durable `run-gate.ts` route for `scaffold.runtime`.
- Package README as migration-note home under the `docs/**` prohibition.

## Drift and Debt

- Drift: issue paths/names moved; naming fixed; stale SDK comment; missing frontend reference;
  missing scaffold-runtime gate catalog entry.
- Debt: no new or updated architecture debt proposed.

## Commits

- See draft PR #1664's commit list and per-slice PR comments.
