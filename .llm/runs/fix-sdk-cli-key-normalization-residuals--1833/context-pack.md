# Context Pack: residual Aspire key-normalization mismatches (#1833)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cli-key-normalization-residuals--1833` |
| Branch | `fix/sdk-cli-key-normalization-residuals` |
| Current phase | `evaluate` (awaiting supervisor-dispatched IMPL-EVAL) |
| Archetype | `2 — Integration` (SDK/Aspire); `6 — CLI/Tooling` (CLI) |
| Scope overlays | `frontend` |

## Current State

The implementation and requested automated gates are complete. SDK shorthand reuses the #1831
normalizer, CLI deploy prebuild consumes Aspire's key builder, and the widened test corpus pins both
browser key forms while guarding the raw server path. The PR remains draft for separate evaluation.

## Completed

- Loaded required harness, doctrine, PR, tools, RTK, and JSR-audit instructions.
- Reproduced the two source mismatches and confirmed the narrow pin corpus.
- Confirmed issue #1833 already carries the required labels and milestone 27 (`0.0.7`).
- Recorded RED evidence: exit 1, 95 failures / 14 passes.
- Recorded GREEN evidence: 109 focused, 183 SDK, 91 Aspire, and 9 CLI deploy-build results passed.
- Scoped check/lint/fmt, repo check (`failedBatches: 0`), `quality:scan`, and `arch:check` passed.

## In Progress

- Commit/push implementation slice and post its structured PR comment.

## Next Steps

1. Rebase the completed slice on current `origin/main` and push.
2. Update draft PR #1835 and post the per-slice evidence comment.
3. Supervisor dispatches a separate-session IMPL-EVAL; generator does not self-certify.

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
| `packages/sdk/src/discovery/browser-env.ts` | changed | Shorthand reuses the existing normalizer. |
| `packages/sdk/tests/discovery/env-ordering_test.ts` | changed | Widened full+short pin, fixed full outputs, server/order guards. |
| `packages/cli/src/public/features/deploy/build/build-windows-prebuild.ts` | changed | Pure injection seam consumes Aspire key pairs. |
| `packages/cli/src/public/features/deploy/build/build-windows-prebuild_test.ts` | new | Semantic service/plugin environment-map contract. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | focused/scoped reports; repo check `failedBatches: 0` |
| Fitness | PASS | `quality:scan` and `arch:check` exit 0 |
| Runtime | N/A | owner directive |
| Consumer | PASS | SDK/Aspire and CLI focused suites |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; root CLI lint/fmt exclusion required established run-local config.
- Debt: none created or changed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
