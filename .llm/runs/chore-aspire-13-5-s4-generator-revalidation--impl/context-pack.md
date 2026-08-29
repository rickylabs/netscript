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

Baseline is clean at `8b1e42f72`. Research/design are locked; PLAN-EVAL is N/A. The 13.5 SDK member
table is prepared with no changed/removed member. Slice 1 is ready to commit and open as a draft PR.

## Completed

- Required issue/epic, ratified research, S2 receipts, official member pages, skills, doctrine,
  archetype/gate docs, and current source were read.
- #1371 is confirmed closed by the baseline and its required env-key test exists.
- Run artifacts and member table created.

## In Progress

- Slice 1 commit/push/draft PR/commit-trail comment.

## Next Steps

1. Format/review slice 1 artifacts, commit, push explicit refspec, and open the draft PR.
2. Land config default/test, stale anchors/debt, deploy argv tests, then regeneration/full gates.
3. Hand the draft PR to the separate Fable supervisor/evaluator without marking ready.

## Key Decisions

| Decision                      | Source                          | Notes                                                        |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------ |
| No SDK member emission edit   | research §4 + member pages + S2 | All rows unchanged.                                          |
| Keep Deno workaround          | D-4                             | S12 owns adoption.                                           |
| Destroy alone carries `--yes` | S2 V12                          | Cloud adapter behavior already correct; tests need coverage. |

## Files Changed

| Path                                                           | Status | Notes                               |
| -------------------------------------------------------------- | ------ | ----------------------------------- |
| `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/` | new    | Harness artifacts and member table. |

## Gates

| Gate family | Current status | Evidence                              |
| ----------- | -------------- | ------------------------------------- |
| Static      | NOT_RUN        | final slice                           |
| Fitness     | NOT_RUN        | final slice                           |
| Runtime     | N/A locally    | no lease; S2 receipts + PR CI runtime |
| Consumer    | NOT_RUN        | final `scaffold.plugins`              |

## Open Questions

None.

## Drift and Debt

- Drift: issue/epic #1371 ownership text is stale relative to #1728; supervisor route override.
- Debt: update only the CommunityToolkit Deno/SQLite entry in slice 3.

## Commits

- See the draft PR's commit list + per-slice PR comments.
