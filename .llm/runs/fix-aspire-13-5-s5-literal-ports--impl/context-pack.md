# Context Pack: Aspire 13.5 S5 literal ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s5-literal-ports--impl` |
| Branch | `fix/aspire-13-5-s5-literal-ports` |
| Current phase | `implement` |
| Archetype | `5 - Plugin` + `6 - CLI/tooling` |
| Scope overlays | Aspire contribution, scaffold, E2E, JSR |

## Current State

Slices 1-5 are pushed on draft PR #1740. Slice 6 is complete and locally validated; its final
commit/push and PR evidence update are the only remaining implementation-lane actions.

## Completed

- Required issue, parent research/plan, doctrine, skills, and S2 receipt intake.
- RED fitness contract committed and pushed as `e83659d78`.
- D-14 sagas slice committed and pushed as `24817a404` with JSR evidence.
- Contribution slice committed and pushed as `aae91586b`.
- Plugin/infrastructure opt-in pin slice committed and pushed as `8aee17462`.
- Describe-derived E2E probe slice committed and pushed as `732337435`.
- Final static, JSR, plugin, asset, doctrine, and `scaffold.plugins` gates are green/baseline.

## In Progress

- Commit/push slice 6 and post the final draft-PR evidence trail.

## Next Steps

1. Commit and push slice 6 with `receipts/06-final-gates.txt`.
2. Update PR acceptance evidence and hand the draft to the independent Fable 5 supervisor.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No endpoint is a non-retryable rejected publish | parent D-14 | Public type unchanged. |
| Runtime evidence comes from CI | owner directive | S2 receipts are current live evidence. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/validation/check-aspire-host-ports.ts` | changed | Contribution rules/default roots. |
| `.llm/tools/validation/check-aspire-host-ports_test.ts` | changed | RED contribution and literal-grep tests. |
| `.llm/runs/fix-aspire-13-5-s5-literal-ports--impl/` | new | Harness evidence and resumability. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | green; exact literal grep has only D-14 compatibility assertions | slice 6 receipt |
| Fitness | green across contributions and generated host ports | slices 3-4, 6 receipts |
| Runtime | CI deferred | S2 live receipts + future CI `scaffold.runtime` |
| Consumer | sagas JSR baseline re-proven | slices 2 and 6 receipts |
| Scaffold | `scaffold.plugins` 17/17 | slice 6 receipt |

## Open Questions

- None. Locked owner contract resolves older issue wording conflicts.

## Drift and Debt

- Drift: naming-only D-16 discrepancy recorded in `drift.md`.
- Debt: deprecated export removal draft targets 0.0.8.

## Commits

- Slices 1-5: `e83659d78`, `24817a404`, `aae91586b`, `8aee17462`, `732337435`.
- Slice 6 is ready to commit; see the draft PR's per-slice comments for the evidence trail.
