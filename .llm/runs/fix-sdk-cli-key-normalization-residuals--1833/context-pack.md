# Context Pack: residual Aspire key-normalization mismatches (#1833)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cli-key-normalization-residuals--1833` |
| Branch | `fix/sdk-cli-key-normalization-residuals` |
| Current phase | `plan` |
| Archetype | `2 — Integration` (SDK/Aspire); `6 — CLI/Tooling` (CLI) |
| Scope overlays | `frontend` |

## Current State

The clean issue branch is rebased on current `origin/main` (`ee0e626bb`). Research and design are
locked; PLAN-EVAL is recorded N/A. No product/test source has changed yet.

## Completed

- Loaded required harness, doctrine, PR, tools, RTK, and JSR-audit instructions.
- Reproduced the two source mismatches and confirmed the narrow pin corpus.
- Confirmed issue #1833 already carries the required labels and milestone 27 (`0.0.7`).

## In Progress

- Commit/push bootstrap and open the draft PR from the first commit.

## Next Steps

1. Add contract-first SDK character-sweep and CLI prebuild tests.
2. Run and record RED evidence.
3. Implement shared-rule reuse and run all requested gates.
4. Commit/push/comment the slice and hand off for supervisor-dispatched IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| SDK shorthand reuses its existing normalizer | plan D1 | No full-key behavior change. |
| CLI consumes Aspire's existing key builder | plan D2 | No regex copy or public SDK export. |
| Server key is untouched and guarded | plan D3 | Raw hyphenated key remains required. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-sdk-cli-key-normalization-residuals--1833/` | new | Harness bootstrap artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | worklog |
| Fitness | pending | worklog |
| Runtime | N/A | owner directive |
| Consumer | pending | worklog |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` is unavailable; direct commands and structured wrappers are the fallback.
- Debt: none created or changed.

## Commits

- See the draft PR's commit list + per-slice PR comments.

