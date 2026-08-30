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

Slice 1 is establishing the RED fitness contract from a clean `origin/main` baseline.

## Completed

- Required issue, parent research/plan, doctrine, skills, and S2 receipt intake.

## In Progress

- Host-port checker extension and exact S5 literal grep test.

## Next Steps

1. Record RED output, commit, push, and open the draft PR.
2. Implement the D-14 sagas slice.

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
| Static | RED pending | slice 1 receipt |
| Fitness | RED pending | slice 1 receipt |
| Runtime | CI deferred | S2 live receipts + future CI `scaffold.runtime` |
| Consumer | pending | slice 2 JSR evidence |

## Open Questions

- None. Locked owner contract resolves older issue wording conflicts.

## Drift and Debt

- Drift: naming-only D-16 discrepancy recorded in `drift.md`.
- Debt: deprecated export removal draft targets 0.0.8.

## Commits

- See the draft PR's commit list + per-slice PR comments.
