# Context Pack: Zod npm alignment

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-zod-v4-npm-alignment-1295--1295` |
| Branch | `fix/zod-v4-npm-alignment-1295` |
| Current phase | `implement` |
| Archetype | cross-cutting manifests + Archetype 6 guard |
| Scope overlays | none |

## Current State

The branch is integrated with `canary/0.0.5-canary.14@2508eb8c9`. Standalone generated workspace
roots now own the Zod catalog required by local-source packages, while portable generated member
manifests keep explicit npm specifiers. The former `check:emitted-samples` RED is green, the focused
child-process suite passes, and the rescoped two-instance graph remains unchanged.

## Next Steps

1. Commit and explicitly push the coherent child-workspace repair.
2. Reconcile PR #1315 metadata and record current-SHA check state.
3. Hand off for the orchestrator-owned Qwen IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| root npm catalog | plan D1 | one Zod version home |
| D6 composed evaluation | owner rule | no duplicate local evaluator |

## Drift and Debt

- Drift: none.
- Debt: no new debt planned; publication blocked externally by #1312.

## Commits

- See draft PR commit list and per-slice comments.
