# Context Pack: browser full-key discovery normalization (#1824)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Current phase | `implement` |
| Archetype | `2 — Integration` |
| Scope overlays | `frontend` (browser environment-key contract) |

## Current State

The branch is based exactly on current `origin/main`. Research confirms the SDK browser full
key and Aspire full key diverge for invalid resource-name characters; shorthand and server keys are
separate contracts and remain unchanged. The locked implementation is a private SDK normalizer with
an Aspire-source citation and a test-only cross-package agreement guard in the SDK suite.

## Completed

- Harness, doctrine, PR, tools, rtk, jsr-audit, and Claude-manager instructions loaded.
- Archetype 2 and frontend/browser overlay selected.
- Doctrine verdicts and relevant debt reviewed.
- `PLAN-EVAL: N/A` recorded before implementation.

## In Progress

- Slice 1: the first review blocker is remediated; rerun RED and request review cycle 2.

## Next Steps

1. Obtain independent slice review, commit/push, and open the requested draft PR.
2. Implement the private SDK normalizer and run all required gates.
3. Run separate-session native Claude/Fable IMPL-EVAL.

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
| `packages/aspire/tests/helpers_test.ts` | unchanged | Existing Aspire normalization tests remain the authority. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | RED captured | `red-contract.json`, exit 1, 5 passed / 6 failed / 4 unique expected failures; checked run. |
| Fitness | pending | `quality:scan` and `arch:check` planned. |
| Runtime | N/A | Owner directive; no runtime processes permitted. |
| Consumer | pending | Cross-package agreement test. |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; exact current Codex identity not exposed.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
