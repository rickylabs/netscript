# Context Pack: NetScript Database Architecture and Prisma 8 RFC

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`          |
| Branch         | `docs/database-architecture-rfc`                        |
| Current phase  | `research`                                              |
| Archetype      | Docs-only RFC describing future A1/A2/A4/A5/A6 surfaces |
| Scope overlays | `SCOPE-docs.md`                                         |

## Current State

A clean-break database architecture RFC run is activated from current `origin/main`. Issue #313 is
carried in as historical evidence but its compatibility-first solution is explicitly superseded. The
canonical RFC has not been authored; research and PLAN-EVAL come first.

## Completed

- Loaded current repository, RFC process, harness, PR, doctrine-navigation, and docs-profile rules.
- Created an isolated worktree/branch from `origin/main` @ `cd7205293`.
- Read GitHub issue #313 and its comments through the connected GitHub surface.
- Selected mandatory PLAN-EVAL and the owner-directed Fable 5 high final refinement override.

## In Progress

- Bootstrap commit/draft PR, then current-state and upstream research.

## Next Steps

1. Publish the bootstrap review surface.
2. Audit current NetScript DB code, generated assets, public APIs, CI, issues, and debt.
3. Audit Prisma 8/Next primary sources and market prior art.
4. Lock architecture and Design checkpoint, then obtain PLAN-EVAL PASS.
5. Author and evaluate the RFC.

## Key Decisions

| Decision                       | Source          | Notes                                                                         |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------- |
| No backward compatibility      | Owner directive | Migration safety is required; runtime compatibility shims are not.            |
| NetScript owns its DB concepts | Initial plan    | Prisma remains an adapter/engine target, not the framework-facing vocabulary. |
| Fable 5 high is last           | Owner directive | Final gate includes refinement, not only critique.                            |

## Files Changed

| Path                                                      | Status | Notes                                   |
| --------------------------------------------------------- | ------ | --------------------------------------- |
| `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/` | new    | Harness provenance and resumable state. |

## Gates

| Gate family | Current status | Evidence                            |
| ----------- | -------------- | ----------------------------------- |
| Static      | pending        | Bootstrap inspection follows.       |
| Fitness     | pending        | Research/archetype mapping follows. |
| Runtime     | N/A            | Docs-only RFC run.                  |
| Consumer    | pending        | RFC not authored.                   |

## Open Questions

- All public architecture decisions remain open until research is complete.

## Drift and Debt

- Drift: #313 compatibility-first architecture is superseded; final-gate effort is owner-overridden.
- Debt: pending targeted ledger scan.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
