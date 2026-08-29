# Context Pack: Aspire 13.5 generator re-validation (S4)

## Run Metadata

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| Run ID         | `chore-aspire-13-5-s4-generator-revalidation--impl` |
| Branch         | `chore/aspire-13-5-s4-generator-revalidation`       |
| Current phase  | `implement`                                         |
| Archetype      | `6 — CLI / Tooling`                                 |
| Scope overlays | none                                                |

## Current State

Baseline is `8b1e42f72`. Research/design are locked; PLAN-EVAL is N/A. The 13.5 SDK member table is
committed with no changed/removed member, and draft PR #1738 carries the full table. Slice 2 changes
the schema default to the generated TypeScript AppHost path; its focused tests and fitness gates
pass.

## Completed

- Required issue/epic, ratified research, S2 receipts, official member pages, skills, doctrine,
  archetype/gate docs, and current source were read.
- #1371 is confirmed closed by the baseline and its required env-key test exists.
- Run artifacts and member table created.
- Slice 1 committed/pushed as `079fbb0a2`; draft PR #1738 opened with required metadata and comment.
- Existing `generate-register-background_test.ts` proves the #1371 service-reference environment
  key, positive injection, and fail-fast paths, so no duplicate case is needed.

## In Progress

- Slice 2 commit/push/commit-trail comment.

## Next Steps

1. Land the stale anchors/debt and deploy argv slices.
2. Regenerate assets and run the complete local gate set.
3. Hand the draft PR to the separate Fable supervisor/evaluator without marking ready.

## Key Decisions

| Decision                      | Source                          | Notes                                                        |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------ |
| No SDK member emission edit   | research §4 + member pages + S2 | All rows unchanged.                                          |
| Keep Deno workaround          | D-4                             | S12 owns adoption.                                           |
| Destroy alone carries `--yes` | S2 V12                          | Cloud adapter behavior already correct; tests need coverage. |

## Files Changed

| Path                                                           | Status   | Notes                                         |
| -------------------------------------------------------------- | -------- | --------------------------------------------- |
| `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/` | new      | Harness artifacts and member table.           |
| `packages/config/src/domain/schemas/aspire-schema.ts`          | modified | TypeScript AppHost default and documentation. |
| `packages/config/tests/schema/netscript_config_test.ts`        | modified | Default-path regression test.                 |

## Gates

| Gate family | Current status | Evidence                              |
| ----------- | -------------- | ------------------------------------- |
| Static      | PASS (slice 2) | 18 focused tests                      |
| Fitness     | PASS (slice 2) | `quality:scan`; `arch:check`          |
| Runtime     | N/A locally    | no lease; S2 receipts + PR CI runtime |
| Consumer    | NOT_RUN        | final `scaffold.plugins`              |

## Open Questions

None.

## Drift and Debt

- Drift: issue/epic #1371 ownership text is stale relative to #1728; supervisor route override.
- Debt: update only the CommunityToolkit Deno/SQLite entry in slice 3.

## Commits

- See the draft PR's commit list + per-slice PR comments.
