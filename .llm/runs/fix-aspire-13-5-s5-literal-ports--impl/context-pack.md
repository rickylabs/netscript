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

Slices 1-4 are pushed on draft PR #1740. Slice 5 removes deterministic E2E probe ports and resolves
plugin resource endpoints from the running AppHost's `aspire describe` `urls[].url` contract.

## Completed

- Required issue, parent research/plan, doctrine, skills, and S2 receipt intake.
- RED fitness contract committed and pushed as `e83659d78`.
- D-14 sagas slice committed and pushed as `24817a404` with JSR evidence.
- Contribution slice committed and pushed as `aae91586b`.
- Plugin/infrastructure opt-in pin slice committed and pushed as `8aee17462`.

## In Progress

- Slice 5 is validated and ready to commit; slice 6 regeneration and final gates remain.

## Next Steps

1. Commit and push slice 5 with its receipt and PR trail comment.
2. Regenerate embedded/publish assets, make the exact literal grep green, and run final gates.

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
| Static | E2E subtree green; repo cleanup pending | slice 5 receipt |
| Fitness | contribution/infrastructure checks green | slices 3-4 receipts |
| Runtime | CI deferred | S2 live receipts + future CI `scaffold.runtime` |
| Consumer | sagas JSR baseline proven | slice 2 JSR evidence |

## Open Questions

- None. Locked owner contract resolves older issue wording conflicts.

## Drift and Debt

- Drift: naming-only D-16 discrepancy recorded in `drift.md`.
- Debt: deprecated export removal draft targets 0.0.8.

## Commits

- See the draft PR's commit list + per-slice PR comments.
