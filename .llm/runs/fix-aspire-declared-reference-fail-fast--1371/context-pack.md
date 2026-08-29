# Context Pack: emitted fail-fast for declared background references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-declared-reference-fail-fast--1371` |
| Branch | `fix/aspire-declared-reference-fail-fast` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

The branch began clean at `3b32d1628584749af4dd6e97fd331c24e84f0b9e`. Research confirms both reference kinds silently drop missing/unresolved endpoints. PLAN-EVAL is N/A by admitted design. Slice 1 tests are now RED through the structured wrapper: 3 passed, 6 failed as expected.

## Completed

- Harness/skill/doctrine bootstrap and base verification.
- Bounded research, locked design, gate selection, and drift note.
- RED emitted-module tests covering raw-key parity, positive service/plugin binding, missing resources, unresolved endpoints, and pre-registration ordering.

## In Progress

- Fresh Tier-A review of the RED-first test slice.

## Next Steps

1. Obtain fresh Tier-A slice review, commit/push/comment, and open the draft PR.
2. Implement fail-fast, run all final-head gates, review, commit, atomically push, and update the draft PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preflight before `addExecutable` | plan D1 | Stronger than only ordering before returned-map insertion. |
| Exact deterministic message | plan D2 | Asserted as contract. |
| Raw key preserved | plan D3 | Compared to SDK consumer builder. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-aspire-declared-reference-fail-fast--1371/` | new | Harness state and evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | EXPECTED RED | Focused wrapper exit 1; 3 passed / 6 failed. |
| Fitness | NOT_RUN | Final-head gate set pending. |
| Runtime | N/A | No runtime lease; emitted-module execution only. |
| Consumer | RED test passes | Emitted service/plugin key equals SDK `createServerServiceEnvKey('workers-api')`; underscore form absent. |

## Open Questions

- None.

## Drift and Debt

- Drift: requested `implementation-gate.md` absent; canonical static gate used.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
