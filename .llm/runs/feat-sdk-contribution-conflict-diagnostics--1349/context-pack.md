# Context Pack: SDK contribution conflict diagnostics

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349` |
| Branch         | `feat/sdk-contribution-conflict-diagnostics`       |
| Current phase  | `evaluate`                                         |
| Archetype      | `2 — Integration`                                  |
| Scope overlays | `none`                                             |

## Current State

The diagnostic and exact acceptance tests are implemented. `contributionId` remains the
claimant/offender; optional `conflictingContributionId` identifies the earlier owner. All requested
generator gates, clean-tree publication, and the post-commit carrier cascade pass. IMPL-EVAL
remains.

## Completed

- Required skills, harness authority, relevant doctrine, audit artifact, public docs surface, and
  focused validation/error paths were read.
- `PLAN-EVAL: N/A` recorded before source implementation.
- Focused 18/18 and full SDK 228/228 tests pass; scoped check/lint/fmt select 102 files with zero
  failures/findings.
- `deno doc --lint` A/B has zero new diagnostics; docs examples remain at `unboundName=116`.
- `quality:gate` and explicit `arch:check` pass after removing the transient new F-1 warning.
- Clean-tree SDK dry-run passes; carrier cascade updates only the MCP generated export corpus.

## In Progress

- Final evidence/generated commit and separate-session evaluation.

## Next Steps

1. Commit carrier/evidence state and verify the cascade is idempotent after that commit.
2. Run separate IMPL-EVAL.
3. Explicit-refspec push and open the non-draft PR with exact metadata/evidence.

## Key Decisions

| Decision                                                     | Source    | Notes                  |
| ------------------------------------------------------------ | --------- | ---------------------- |
| Preserve `contributionId`; add optional conflict-owner field | `plan.md` | Additive/non-breaking. |
| Report only syntactically valid ids                          | `plan.md` | No invented identity.  |

## Files Changed

| Path                                                                                 | Status    | Notes                                                |
| ------------------------------------------------------------------------------------ | --------- | ---------------------------------------------------- |
| `.llm/runs/feat-sdk-contribution-conflict-diagnostics--1349/*`                       | new       | Harness state and evidence.                          |
| `packages/sdk/src/client/errors.ts`                                                  | changed   | Additive diagnostic/error/JSON field.                |
| `packages/sdk/src/internal/client-contributions/contribution-diagnostic-id.ts`       | new       | Redaction-safe id policy.                            |
| `packages/sdk/src/internal/client-contributions/prepared-call.ts`                    | changed   | Populate offender/owner ids.                         |
| `packages/sdk/src/desktop/application/desktop-rpc-client.ts`                         | changed   | Name first supplied Desktop-incompatible descriptor. |
| `packages/sdk/tests/client-contribution-validation_test.ts`                          | changed   | Exact structured and JSON acceptance assertions.     |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | generated | Updated public export corpus and provenance.         |

## Gates

| Gate family | Current status | Evidence                             |
| ----------- | -------------- | ------------------------------------ |
| Static      | PASS           | scoped check/lint/fmt; docs examples |
| Fitness     | PASS           | quality/arch and dry-run exit 0      |
| Runtime     | PASS           | 228 passed, 0 failed/ignored         |
| Consumer    | PASS           | doc A/B delta 0; carrier exit 0      |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; non-draft PR owner override.
- Debt: none planned.

## Commits

- See the PR commit list and per-slice comments after the slice lands.
