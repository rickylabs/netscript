# Context Pack: SDK contribution conflict diagnostics

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349` |
| Branch         | `feat/sdk-contribution-conflict-diagnostics`       |
| Current phase  | `gate`                                             |
| Archetype      | `2 — Integration`                                  |
| Scope overlays | `none`                                             |

## Current State

The diagnostic and exact acceptance tests are implemented. `contributionId` remains the
claimant/offender; optional `conflictingContributionId` identifies the earlier owner. Primary SDK,
docs, quality, and architecture gates pass; clean-tree publish/cascade and separate IMPL-EVAL
remain.

## Completed

- Required skills, harness authority, relevant doctrine, audit artifact, public docs surface, and
  focused validation/error paths were read.
- `PLAN-EVAL: N/A` recorded before source implementation.
- Focused 18/18 and full SDK 228/228 tests pass; scoped check/lint/fmt select 102 files with zero
  failures/findings.
- `deno doc --lint` A/B has zero new diagnostics; docs examples remain at `unboundName=116`.
- `quality:gate` and explicit `arch:check` pass after removing the transient new F-1 warning.

## In Progress

- Clean-tree publication, post-commit carrier cascade, and separate-session evaluation.

## Next Steps

1. Commit the reviewed implementation/gate state.
2. Run clean-tree dry-run and post-commit carrier cascade; commit any evidence/generated outputs.
3. Run separate IMPL-EVAL, explicit-refspec push, and open the non-draft PR with exact metadata.

## Key Decisions

| Decision                                                     | Source    | Notes                  |
| ------------------------------------------------------------ | --------- | ---------------------- |
| Preserve `contributionId`; add optional conflict-owner field | `plan.md` | Additive/non-breaking. |
| Report only syntactically valid ids                          | `plan.md` | No invented identity.  |

## Files Changed

| Path                                                                           | Status  | Notes                                                |
| ------------------------------------------------------------------------------ | ------- | ---------------------------------------------------- |
| `.llm/runs/feat-sdk-contribution-conflict-diagnostics--1349/*`                 | new     | Harness state and evidence.                          |
| `packages/sdk/src/client/errors.ts`                                            | changed | Additive diagnostic/error/JSON field.                |
| `packages/sdk/src/internal/client-contributions/contribution-diagnostic-id.ts` | new     | Redaction-safe id policy.                            |
| `packages/sdk/src/internal/client-contributions/prepared-call.ts`              | changed | Populate offender/owner ids.                         |
| `packages/sdk/src/desktop/application/desktop-rpc-client.ts`                   | changed | Name first supplied Desktop-incompatible descriptor. |
| `packages/sdk/tests/client-contribution-validation_test.ts`                    | changed | Exact structured and JSON acceptance assertions.     |

## Gates

| Gate family | Current status                          | Evidence                             |
| ----------- | --------------------------------------- | ------------------------------------ |
| Static      | PASS                                    | scoped check/lint/fmt; docs examples |
| Fitness     | PASS except clean-tree dry-run pending  | quality/arch exit 0                  |
| Runtime     | PASS                                    | 228 passed, 0 failed/ignored         |
| Consumer    | PASS except post-commit cascade pending | doc A/B delta 0                      |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; non-draft PR owner override.
- Debt: none planned.

## Commits

- See the PR commit list and per-slice comments after the slice lands.
