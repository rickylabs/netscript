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

Slices 1-3 are pushed on draft PR #1740. Slice 4 makes plugin and infrastructure host-port pins
explicit-only.

## Completed

- Required issue, parent research/plan, doctrine, skills, and S2 receipt intake.
- RED fitness contract committed and pushed as `e83659d78`.
- D-14 sagas slice committed and pushed as `24817a404` with JSR evidence.
- Contribution slice committed and pushed as `aae91586b`.

## In Progress

- Sagas publisher, compatibility export, CLI/probe discovery, manifest, sample, and README updates.

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
