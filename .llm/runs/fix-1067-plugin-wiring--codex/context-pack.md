# Context Pack: plugin wiring and doctor truth

## Run Metadata

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Run ID         | `fix-1067-plugin-wiring--codex`               |
| Branch         | `fix/1067-plugin-wiring`                      |
| Current phase  | `implement`                                   |
| Archetype      | 6 CLI/Tooling + 5 Plugin + 3 Runtime/Behavior |
| Scope overlays | service                                       |

## Current State

Baseline and carried-in commits are verified. Contract, research, locked decisions, risks, gates,
and three commit slices are recorded. Formal PLAN-EVAL was unavailable and has been explicitly
waived after the supervisor's substantive plan review. Slice 1 is authorized.

## Completed

- Required five skills loaded in order; harness/doctrine/jsr references applied.
- `origin/main` baseline and three merged acceptance-fix hashes verified.
- Producer failure path read and reported before change.
- Plan and Design checkpoint written.

## In Progress

- Slice 1 implementation: dependency-derived reconcile and fail-fast producer discovery.

## Next Steps

1. Implement and push Slice 1 with permutation/main-red evidence.
2. Hand Slice 1 to the current opposite-family supervisor for substantive review.
3. Repeat for doctor and residual acceptance slices.

## Key Decisions

| Decision                                                                        | Source     | Notes                                                                                |
| ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Reconcile explicit and dependency-derived edges against installed resource keys | plan D1–D3 | Dependency targets resolve through manifests; no dangling refs; deterministic order. |
| Fail producer creation synchronously on missing discovery                       | plan D4–D5 | No queued/dropped write window.                                                      |
| Inject discriminated AppHost inspection                                         | plan D6–D7 | Absence and unhealthy state cannot collapse.                                         |

## Files Changed

| Path                                        | Status | Notes                              |
| ------------------------------------------- | ------ | ---------------------------------- |
| `.llm/runs/fix-1067-plugin-wiring--codex/*` | new    | Harness plan-stage artifacts only. |

## Gates

| Gate family | Current status  | Evidence                                                                                                              |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Plan        | waived/approved | live provider canary blocked; owner-authorized supervisor independently reproduced it and approved the corrected plan |
| Static      | not run         | blocked by Plan-Gate                                                                                                  |
| Fitness     | not run         | blocked by Plan-Gate                                                                                                  |
| Runtime     | not run         | blocked by Plan-Gate                                                                                                  |
| Consumer    | not run         | blocked by Plan-Gate                                                                                                  |

## Open Questions

- None blocking Slice 1.

## Drift and Debt

- Drift: owner-launched Codex supervisor, no-PR-edit boundary, and blocked formal evaluator
  recorded.
- Debt: none planned; network reachability lifecycle is explicitly deferred to 0.0.5.

## Commits

- See branch commits; PR comments remain the external supervisor’s responsibility.
