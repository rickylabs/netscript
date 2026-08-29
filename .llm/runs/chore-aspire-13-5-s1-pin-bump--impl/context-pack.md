# Context Pack: Aspire 13.5 S1 pin bump and parity gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s1-pin-bump--impl` |
| Branch | `chore/aspire-13-5-s1-pin-bump` |
| Current phase | implement — slice 2 ready to commit |
| Archetype | `6 — CLI/tooling` |
| Scope overlays | none |

## Current State

The RED gate slice is pushed on draft PR #1727. The atomic Aspire train now uses SDK/CLI/official integrations 13.5.3, Browsers 13.5.3-preview.1.26425.3, and CommunityToolkit Deno/SQLite 13.5.0. The phase-1 GREEN receipt has fail=0 with 20 owner-tagged, non-archival deferred findings.

## Completed

- Issue #1713 and locked research decisions re-baselined.
- Harness bootstrap, Design checkpoint, archetype, gate set, and PLAN-EVAL N/A recorded.
- Phase-aware parity tool/test, task/catalog wiring, immutable manifest input, and RED receipt completed.
- Slice 1 commit `95680776…` pushed; draft PR and commit-trail comment created.
- Atomic pin edits, CI phase-1 wiring, scoped validation, quality/architecture checks, assets freshness, and GREEN receipt completed.

## In Progress

- Slice 2: commit, push, and commit-trail comment.

## Next Steps

1. Commit and push the atomic pin slice, then post its evidence.
2. Append the Browsers preview debt entry and finalize the handoff artifacts.
3. Push slice 3, post its comment, and leave the PR draft for independent evaluation.

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
| Fitness | PASS | scoped owned-file wrappers, `quality:scan`, `arch:check` |
| Runtime | CI-owned | Draft PR checks |
| Consumer | PASS | asset generation/freshness and generator assertions |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: research artifacts are absent from the implementation baseline; exact remote-ref import required.
- Debt: Browsers preview entry will be appended in slice 3.

## Commits

- `95680776…` — RED parity contract and receipt.
- Slice 2 pending commit; exact GREEN receipt is in `receipts/parity-phase1-green.json`.
