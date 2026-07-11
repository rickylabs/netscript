# Context Pack: `@netscript/ai/skills`

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `feat-246-skill-loader--codex` |
| Branch         | `feat/246-skill-loader-port`   |
| Current phase  | implement                      |
| Archetype      | `2 - Integration`              |
| Scope overlays | none                           |

## Current State

Plan and Design are locked at baseline `955b4abf`; PLAN-EVAL is explicitly owner-waived. No source
implementation has begun.

## Completed

- Full issue read, package/public-surface research, doctrine selection, JSR risk scan, plan/design.

## In Progress

- Slice 1: loader contract, parser, source adapter, matching, and tests.

## Next Steps

1. Implement slice 1 and run targeted gates.
2. Complete package/doc/publish gates and update evidence.
3. Commit, push, and hand off for separate IMPL-EVAL.

## Key Decisions

| Decision                          | Source     | Notes                                                 |
| --------------------------------- | ---------- | ----------------------------------------------------- |
| Strict blessed frontmatter subset | plan D2    | No YAML production dependency.                        |
| Summary-only matching             | plan D1/D4 | Preserves progressive disclosure.                     |
| Optional semantic path            | plan D6    | Disabled/missing provider performs no embedding call. |

## Files Changed

| Path                                       | Status | Notes                          |
| ------------------------------------------ | ------ | ------------------------------ |
| `.llm/runs/feat-246-skill-loader--codex/*` | new    | Harness plan/design artifacts. |

## Gates

| Gate family | Current status | Evidence                            |
| ----------- | -------------- | ----------------------------------- |
| Static      | NOT_RUN        | implementation pending              |
| Fitness     | NOT_RUN        | implementation pending              |
| Runtime     | N/A            | effect-free in-memory behavior only |
| Consumer    | NOT_RUN        | new subpath/package check pending   |

## Open Questions

- None.

## Drift and Debt

- Drift: owner-waived PLAN-EVAL; older path mapped to `packages/ai`.
- Debt: none planned.

## Commits

- No PR by explicit user instruction; commit/push evidence will be recorded here.
