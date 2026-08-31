# Context Pack: browser full-key discovery normalization (#1824)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Current phase | `gate` |
| Archetype | `2 — Integration` |
| Scope overlays | `frontend` (browser environment-key contract) |

## Current State

The branch started at baseline `dea449911`; `origin/main` advanced during review without touching
this slice. Draft PR #1831 is open. The SDK browser builder now applies Aspire's exact resource-name
identifier normalization through a private helper; shorthand and server code are untouched. Every
owner-requested local gate is green, and Slice 2 awaits independent review before commit.

## Completed

- Harness, doctrine, PR, tools, rtk, jsr-audit, and Claude-manager instructions loaded.
- Archetype 2 and frontend/browser overlay selected.
- Doctrine verdicts and relevant debt reviewed.
- `PLAN-EVAL: N/A` recorded before implementation.
- Slice 1 signed/pushed as `e5dd8dbc5`; draft PR #1831 opened with the requested metadata.
- Canonical RED captured and all Slice 2 gates passed.

## In Progress

- Slice 2: independent opposite-family slice review before sign-off commit.

## Next Steps

1. Obtain Slice 2 review PASS, commit, push, and post the slice comment.
2. Run separate-session native Claude/Fable IMPL-EVAL and address any findings.
3. Update the draft PR body and final run artifacts without marking ready for review.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No production SDK↔Aspire dependency | doctrine and package manifests | Cross-package coupling exists only in tests. |
| Aspire regex is the contract authority | `build-vite-env-var-name.ts` | SDK comment names the source. |
| Server and shorthand functions remain untouched | issue #1824 and user scope | Exact regression guards. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-sdk-browser-full-key-normalization--impl/*` | new | Harness record. |
| `packages/sdk/tests/discovery/env-ordering_test.ts` | changed | SDK contract and regression guards. |
| `packages/sdk/src/discovery/browser-env.ts` | changed | Private Aspire-compatible browser resource-name normalization. |
| `packages/aspire/tests/helpers_test.ts` | unchanged | Existing Aspire normalization tests remain the authority. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Contract 11/11; SDK 86/86; Aspire 91/91; scoped check/lint/fmt exit 0; root check exit 0 with `failedBatches: 0`. |
| Fitness | PASS | `quality:scan` and `arch:check` exit 0. |
| Runtime | N/A | Owner directive; no runtime processes permitted. |
| Consumer | PASS | Cross-package full-key agreement test exit 0. |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; exact current Codex identity not exposed.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
