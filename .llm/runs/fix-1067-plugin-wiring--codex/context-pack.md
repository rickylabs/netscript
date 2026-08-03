# Context Pack: plugin wiring and doctor truth

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1067-plugin-wiring--codex` |
| Branch | `fix/1067-plugin-wiring` |
| Current phase | `plan-eval` |
| Archetype | 6 CLI/Tooling + 5 Plugin + 3 Runtime/Behavior |
| Scope overlays | service |

## Current State

Baseline and carried-in commits are verified. Contract, research, locked decisions, risks, gates,
and three commit slices are recorded. No implementation source has changed. PLAN-EVAL is the hard
stop.

## Completed

- Required five skills loaded in order; harness/doctrine/jsr references applied.
- `origin/main` baseline and three merged acceptance-fix hashes verified.
- Producer failure path read and reported before change.
- Plan and Design checkpoint written.

## In Progress

- Separate-session open-model PLAN-EVAL is blocked before launch by an absent OpenRouter credential.

## Next Steps

1. Restore the `claude-openrouter` evaluator credential, or obtain an explicit owner waiver naming
   an authorized harness fallback.
2. Obtain `PASS` from the bound open-model formal evaluator.
3. Implement and push Slice 1, with opposite-family slice review and main-red evidence.
4. Repeat for doctor and residual acceptance slices.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Reconcile declared edges against installed resource keys | plan D1–D2 | No dangling refs; deterministic order. |
| Fail producer creation synchronously on missing discovery | plan D4–D5 | No queued/dropped write window. |
| Inject discriminated AppHost inspection | plan D6–D7 | Absence and unhealthy state cannot collapse. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1067-plugin-wiring--codex/*` | new | Harness plan-stage artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | blocked | live provider canary: `credential: absent`, `auth_required`; evaluator not launched |
| Static | not run | blocked by Plan-Gate |
| Fitness | not run | blocked by Plan-Gate |
| Runtime | not run | blocked by Plan-Gate |
| Consumer | not run | blocked by Plan-Gate |

## Open Questions

- Owner action: restore evaluator credentials or explicitly authorize a named fallback/waiver.

## Drift and Debt

- Drift: owner-launched Codex supervisor, no-PR-edit boundary, and blocked formal evaluator recorded.
- Debt: none planned; network reachability lifecycle is explicitly deferred to 0.0.5.

## Commits

- See branch commits; PR comments remain the external supervisor’s responsibility.
