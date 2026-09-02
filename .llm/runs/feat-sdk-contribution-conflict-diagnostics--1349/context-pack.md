# Context Pack: SDK contribution conflict diagnostics

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349` |
| Branch         | `feat/sdk-contribution-conflict-diagnostics`       |
| Current phase  | `impl-eval` — PASS                                |
| Archetype      | `2 — Integration`                                  |
| Scope overlays | `none`                                             |

## Current State

The diagnostic and exact acceptance tests are implemented. `contributionId` remains the
claimant/offender; optional `conflictingContributionId` identifies the earlier owner. All requested
generator gates, clean-tree publication, and the post-commit carrier cascade pass. IMPL-EVAL
passed in a separate native Claude/Fable 5 medium session and is current for source HEAD
`88065c3c3`.

## Completed

- Required skills, harness authority, relevant doctrine, audit artifact, public docs surface, and
  focused validation/error paths were read.
- `PLAN-EVAL: N/A` recorded before source implementation.
- Focused 19/19 and full SDK 229/229 tests pass; scoped check/lint/fmt select 102 files with zero
  failures/findings.
- `deno doc --lint` A/B has zero new diagnostics; docs examples remain at `unboundName=116`.
- `quality:gate` and explicit `arch:check` pass after removing the transient new F-1 warning.
- Clean-tree SDK dry-run passes; carrier cascade updates only the MCP generated export corpus.
- IMPL-EVAL PASS at `88065c3c3`; both initial low observations were remediated and independently
  verified with no current findings.

## In Progress

- Commit the evaluator verdict artifact, then publish the branch and PR.

## Next Steps

1. Commit the final `evaluate.md`/context closeout artifact.
2. Explicit-refspec push and open the non-draft PR with exact metadata/evidence.

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
| Runtime     | PASS           | 229 passed, 0 failed/ignored         |
| Consumer    | PASS           | doc A/B delta 0; carrier exit 0      |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; non-draft PR owner override; doubly-invalid precedence was restored and
  pinned after the first evaluator pass.
- Debt: none planned.

## Commits

- `672b67b61` — public diagnostic addition, validation paths, exact tests, and run bootstrap.
- `365955dac` — generated public-surface carrier and clean-tree evidence.
- `88065c3c3` — restore/pin baseline doubly-invalid rejection precedence.
