# Context Pack: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Research and design are locked. The reported defect reproduces at the kernel copier boundary, and
JSR 0.0.2 metadata proves the required package files exist. No implementation files have changed.
The canonical Qwen lane failure is superseded by the written owner waiver. The Opus 5 supervisor
performed PLAN-EVAL; its sole failing row was corrected and pre-approved, so implementation is
unblocked with D1–D5 unchanged.

## Completed

- Skills/doctrine/harness bootstrap.
- Clean baseline and direct zero-copy reproduction.
- Static call-graph verification and 0.0.2 published-file mapping.
- Plan/design artifacts.

## In Progress

- Implementing the locked dependency-schema slice.

## Next Steps

1. Implement the single locked slice and semantic dependency-mode integration test.
2. Run focused/unit/static/fitness gates.
3. Obtain Opus 5 supervisor slice review and IMPL-EVAL.
4. Commit locally without push/PR.

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

- None blocking implementation.

## Drift and Debt

- Drift: owner-prohibited PR/push overrides normal harness commit trail; the retired evaluator
  blocker is superseded by the Opus 5 owner waiver; userland E2E is local-path-only.
- Debt: no new architecture debt planned.

## Commits

- Local branch commits only; owner explicitly prohibited PR/push.
