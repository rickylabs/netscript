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

The graph guard is implemented and its negative controls pass. The planned catalog alignment fixes
the measured MCP/AI peer warnings, but the train has two unreported hard Zod 3 paths:
`@olli/kvdex@3.6.7` and `@tanstack/ai@0.39 -> @ag-ui/core@0.0.52`. Exactly-one-instance acceptance
cannot be earned without expanding into upstream replacement/upgrade/override decisions.

## Next Steps

1. Obtain owner rescope decision for the TanStack AI cluster and kvdex.
2. Resume the preserved partial alignment only after that decision.
3. Keep the graph guard strict; do not tick graph/lock acceptance meanwhile.

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
