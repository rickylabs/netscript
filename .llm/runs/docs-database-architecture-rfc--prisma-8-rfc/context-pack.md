# Context Pack: NetScript Database Architecture and Prisma 8 RFC

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`          |
| Branch         | `docs/database-architecture-rfc`                        |
| Current phase  | `rfc-authoring`                                         |
| Archetype      | Docs-only RFC describing future A1/A4/A3/A2/A2/A6 graph |
| Scope overlays | `SCOPE-docs.md`                                         |

## Current State

A clean-break database architecture RFC run is active. Issue #313 is historical evidence; its
compatibility-first solution is superseded. Native Fable 5 medium PLAN-EVAL cycle 2 session
`f3286656-7d0f-4da2-a22d-32897a5e6482` passed commit `383170bbc`. Canonical RFC authorship is
unblocked but not yet complete. Current-main commit `01e096049` is recorded as nonblocking
CI/gate-tooling drift.

## Completed

- Loaded current repository, RFC process, harness, PR, doctrine-navigation, and docs-profile rules.
- Created an isolated worktree/branch from `origin/main` @ `cd7205293`.
- Read GitHub issue #313 and its comments through the connected GitHub surface.
- Selected mandatory PLAN-EVAL and the owner-directed Fable 5 high final refinement override.
- Completed the research corpus, D-01–D-47 lock, prospective JSR audit, and architecture synthesis.
- Preserved cycle 1 `FAIL_PLAN`, corrected the task finding to 42 keys per generated engine
  workspace, and obtained cycle 2 `PASS`.

## In Progress

- Slice 3 canonical RFC authorship from the evaluator-approved architecture.

## Next Steps

1. Author the complete canonical RFC from D-01–D-47 and the W0–W11 implementation waves.
2. Perform the root personal source/doctrine/architecture review.
3. Run Qwen 3.8 Max as the focused post-draft review.
4. Run Grok 4.6 high as the whole-RFC adversarial review.
5. Apply author/editor dispositions for every actionable finding.
6. Run one final Fable 5 high substantive refinement.
7. Run mechanical checks only, then commit/push and update the PR trail.

## Key Decisions

| Decision                       | Source          | Notes                                                                                              |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| No backward compatibility      | Owner directive | Migration safety is required; runtime compatibility shims are not.                                 |
| NetScript owns its DB concepts | Initial plan    | Prisma remains an adapter/engine target, not the framework-facing vocabulary.                      |
| Exact future package graph     | Plan lock       | A1 contract → A4 definition → A3 runtime → A2 control → A2 Prisma PostgreSQL adapter → A6 testkit. |
| Fable 5 high is last           | Owner directive | Final gate includes refinement, not only critique.                                                 |

## Files Changed

| Path                                                      | Status | Notes                                   |
| --------------------------------------------------------- | ------ | --------------------------------------- |
| `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/` | new    | Harness provenance and resumable state. |

## Gates

| Gate family | Current status | Evidence                           |
| ----------- | -------------- | ---------------------------------- |
| Static      | pending        | Bootstrap inspection follows.      |
| Fitness     | plan PASS      | Cycle 2 `plan-eval.md`; D-01–D-47. |
| Runtime     | N/A            | Docs-only RFC run.                 |
| Consumer    | in progress    | RFC authorship unblocked.          |

## Open Questions

- No must-resolve-now architecture decision remains; pre-implementation decisions stay assigned to
  their W1/W3/W4/W5/W7/W10 gates.

## Drift and Debt

- Drift: #313 compatibility-first architecture is superseded; final-gate effort is owner-overridden.
- Debt: pending targeted ledger scan.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
