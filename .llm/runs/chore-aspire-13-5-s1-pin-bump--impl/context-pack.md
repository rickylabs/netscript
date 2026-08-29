# Context Pack: Aspire 13.5 S1 pin bump and parity gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s1-pin-bump--impl` |
| Branch | `chore/aspire-13-5-s1-pin-bump` |
| Current phase | implement — slice 1 ready to commit |
| Archetype | `6 — CLI/tooling` |
| Scope overlays | none |

## Current State

The test-first parity gate is implemented. Its focused suite passes 4/4, and the durable phase-1 repository receipt intentionally fails on exactly seven current S1-owned paths. Deferred findings are non-empty, owner-tagged, and contain no archival owner.

## Completed

- Issue #1713 and locked research decisions re-baselined.
- Harness bootstrap, Design checkpoint, archetype, gate set, and PLAN-EVAL N/A recorded.
- Phase-aware parity tool/test, task/catalog wiring, immutable manifest input, and RED receipt completed.

## In Progress

- Slice 1: commit, push, draft PR, and commit-trail comment.

## Next Steps

1. Commit and push slice 1, then open the draft PR and post evidence.
2. Land the atomic pin commit and GREEN evidence.
3. Append debt and finalize the handoff artifacts.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Target 13.5.3 train | research D-1 | No mixed Aspire trains |
| Phase-1 classes | research D-13 | Fail only scaffold constants, CI, root config |
| Runtime in CI only | implementation brief | No local AppHost or host CLI action |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/chore-aspire-13-5-s1-pin-bump--impl/` | new | Harness state and evidence |
| `.llm/tools/validation/check-aspire-version-parity.ts` | new | Phase-aware structured parity gate |
| `.llm/tools/validation/check-aspire-version-parity_test.ts` | new | Classification and phase contract tests |
| `deno.json`, `.llm/tools/gates/catalog.ts` | changed | Task and durable gate allowlist |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` | new | Exact blob imported from the draft-of-record ref |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slice 1 PASS | focused test/check/fmt; RED parity receipt expected FAIL |
| Fitness | pending | Slice 2 |
| Runtime | CI-owned | Draft PR checks |
| Consumer | pending | Slice 2 asset freshness |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: research artifacts are absent from the implementation baseline; exact remote-ref import required.
- Debt: Browsers preview entry will be appended in slice 3.

## Commits

- See the draft PR's commit list + per-slice PR comments after slice 1.
