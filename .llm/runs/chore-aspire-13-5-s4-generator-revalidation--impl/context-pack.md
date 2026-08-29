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
committed with no changed/removed member, and draft PR #1738 carries the full table. Slices 2–4
prove the TypeScript AppHost default, existing #1371 coverage, current 13.5/S12 Deno anchors, and
exact Aspire 13.5.3 deploy argv; their focused tests and fitness gates pass.

## Completed

- Required issue/epic, ratified research, S2 receipts, official member pages, skills, doctrine,
  archetype/gate docs, and current source were read.
- #1371 is confirmed closed by the baseline and its required env-key test exists.
- Run artifacts and member table created.
- Slice 1 committed/pushed as `079fbb0a2`; draft PR #1738 opened with required metadata and comment.
- Existing `generate-register-background_test.ts` proves the #1371 service-reference environment
  key, positive injection, and fail-fast paths, so no duplicate case is needed.
- Retired Aspire issue anchors are absent from the template and Aspire asset-source trees; only the
  approved CommunityToolkit Deno/SQLite debt entry was updated.
- The cloud adapter already emitted non-interactive `destroy` with both `--yes` and
  `--non-interactive`; an exact regression test now pins it. Publish/deploy remain free of `--yes`.

## In Progress

- Slice 4 commit/push/commit-trail comment.

## Next Steps

1. Regenerate assets and run the complete local gate set.
2. Reconcile the five-commit trail and draft PR metadata.
3. Hand the draft PR to the separate Fable supervisor/evaluator without marking ready.

## Key Decisions

| Decision                      | Source                          | Notes                                                        |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------ |
| No SDK member emission edit   | research §4 + member pages + S2 | All rows unchanged.                                          |
| Keep Deno workaround          | D-4                             | S12 owns adoption.                                           |
| Destroy alone carries `--yes` | S2 V12                          | Cloud adapter behavior already correct; tests need coverage. |

## Files Changed

| Path                                                                           | Status   | Notes                                          |
| ------------------------------------------------------------------------------ | -------- | ---------------------------------------------- |
| `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/`                 | new      | Harness artifacts and member table.            |
| `packages/config/src/domain/schemas/aspire-schema.ts`                          | modified | TypeScript AppHost default and documentation.  |
| `packages/config/tests/schema/netscript_config_test.ts`                        | modified | Default-path regression test.                  |
| `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`           | modified | 13.5 projection and 13.6 first-party anchors.  |
| `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`     | modified | Generated compatibility provenance.            |
| `.llm/harness/debt/arch-debt.md`                                               | modified | S12 evidence, owner, target, and closure gate. |
| `packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts`        | modified | 13.5 destroy flag provenance.                  |
| `packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target_test.ts`   | modified | Exact non-interactive destroy argv.            |
| `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`      | modified | Shared 13.5 flag provenance.                   |
| `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts` | modified | Publish/deploy contract names and exact argv.  |

## Gates

| Gate family | Current status    | Evidence                              |
| ----------- | ----------------- | ------------------------------------- |
| Static      | PASS (slices 2–4) | 40 focused tests; stale-anchor grep   |
| Fitness     | PASS (slices 2–4) | `quality:scan`; `arch:check`          |
| Runtime     | N/A locally       | no lease; S2 receipts + PR CI runtime |
| Consumer    | NOT_RUN           | final `scaffold.plugins`              |

## Open Questions

None.

## Drift and Debt

- Drift: issue/epic #1371 ownership text is stale relative to #1728; supervisor route override.
- Debt: update only the CommunityToolkit Deno/SQLite entry in slice 3.

## Commits

- See the draft PR's commit list + per-slice PR comments.
