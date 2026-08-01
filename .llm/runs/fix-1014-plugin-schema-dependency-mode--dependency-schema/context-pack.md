# Context Pack: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Research and design are locked. The reported defect reproduces at the kernel copier boundary, and
JSR 0.0.2 metadata proves the required package files exist. No implementation files have changed.
The canonical Qwen PLAN-EVAL transport failed authentication before an agentic turn, so the harness
hard stop remains in force.

## Completed

- Skills/doctrine/harness bootstrap.
- Clean baseline and direct zero-copy reproduction.
- Static call-graph verification and 0.0.2 published-file mapping.
- Plan/design artifacts.

## In Progress

- Blocked separate-session PLAN-EVAL authentication recovery or explicit owner waiver.

## Next Steps

1. Restore/login the `claude-openrouter` evaluator profile and obtain PLAN-EVAL `PASS`, or receive
   an explicit written Plan-Gate waiver from the owner.
2. Implement the single locked slice.
3. Run focused/unit/static/fitness gates, then the consumer E2E once.
4. Obtain opposite-family slice review and separate-session IMPL-EVAL.
5. Commit locally without push/PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Package metadata fragments win when present | plan D3 | Avoids placeholder shadowing. |
| Migration capability is declaration signal | plan D4 | Backward-compatible with 0.0.2. |
| Local copied-source remains fallback | plan D1/D3 | Empty local metadata remains supported. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1014-plugin-schema-dependency-mode--dependency-schema/*` | new | Harness bootstrap, research, plan, design. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | planned commands in `plan.md` |
| Fitness | pending | `quality:gate` planned |
| Runtime | baseline reproduced | zero-copy `deno eval` |
| Consumer | pending | suite ID confirmed as `scaffold.userland-install` |

## Open Questions

- Will the owner restore the approved local evaluator login, or explicitly waive the Plan-Gate for
  this run?

## Drift and Debt

- Drift: owner-prohibited PR/push overrides normal harness commit trail; canonical evaluator
  authentication is unavailable.
- Debt: no new architecture debt planned.

## Commits

- Local branch commits only; owner explicitly prohibited PR/push.
