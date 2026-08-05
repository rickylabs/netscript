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

The graph guard is implemented and its negative controls pass. Against the unchanged train graph it
fails with 21 findings: missing catalog, 18 inline JSR members, two lock instances, and the SDK's
non-v4 oRPC import.

## Next Steps

1. Commit and push the RED guard slice.
2. Align root/member manifests and oRPC source.
3. Regenerate the lock once and prove the same guard GREEN.

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
