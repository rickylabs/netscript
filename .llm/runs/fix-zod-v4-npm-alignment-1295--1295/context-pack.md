# Context Pack: Zod npm alignment

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-zod-v4-npm-alignment-1295--1295` |
| Branch | `fix/zod-v4-npm-alignment-1295` |
| Current phase | `plan` |
| Archetype | cross-cutting manifests + Archetype 6 guard |
| Scope overlays | none |

## Current State

Live #1295 is reproduced on train baseline `44d2635e1`; plan is locked for RED guard then alignment.

## Next Steps

1. Commit/push plan and open draft PR against `canary/0.0.5-canary.13`.
2. Record composed D6 PLAN-EVAL.
3. Implement RED guard, then catalog/lock alignment.

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
