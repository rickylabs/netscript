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

The branch was re-based from its original `8b1e42f72` baseline onto current `origin/main` at
`13878a80a` before final regeneration. Research/design are locked; PLAN-EVAL is N/A. The 13.5 SDK
member table has no changed/removed member, and draft PR #1738 carries the full table. All five
slices and their local gates are complete; external IMPL-EVAL remains intentionally separate.

## Completed

- Required issue/epic, ratified research, S2 receipts, official member pages, skills, doctrine,
  archetype/gate docs, and current source were read.
- #1371 is confirmed closed by the baseline and its required env-key test exists.
- Run artifacts and member table created.
- Slice 1 opened draft PR #1738 with the required metadata and full member-table comment.
- Existing `generate-register-background_test.ts` proves the #1371 service-reference environment
  key, positive injection, and fail-fast paths, so no duplicate case is needed.
- Retired Aspire issue anchors are absent from the template and Aspire asset-source trees; only the
  approved CommunityToolkit Deno/SQLite debt entry was updated.
- The cloud adapter already emitted non-interactive `destroy` with both `--yes` and
  `--non-interactive`; an exact regression test now pins it. Publish/deploy remain free of `--yes`.
- Asset regeneration, 65-file type-check, seven-file lint/format, 300 tests, CLI JSR audit,
  `quality:scan`, `arch:check`, and `scaffold.plugins` (17/17) all pass after the upstream rebase.

## In Progress

- External Fable slice review and separate-session IMPL-EVAL handoff.

## Next Steps

1. Run the external Fable slice review and separate-session IMPL-EVAL.
2. Resolve any evaluator findings with new evidence before changing PR status.
3. Let the supervisor own any later ready transition; this implementation session does not.

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
| `packages/cli/src/kernel/assets/embedded.generated.ts`                         | modified | Regenerated compatibility asset.               |

## Gates

| Gate family | Current status | Evidence                              |
| ----------- | -------------- | ------------------------------------- |
| Static      | PASS           | 65-file check; lint/fmt; 300 tests    |
| Fitness     | PASS           | CLI JSR; `quality:scan`; `arch:check` |
| Runtime     | N/A locally    | no lease; S2 receipts + PR CI runtime |
| Consumer    | PASS           | `scaffold.plugins` 17/17              |

## Open Questions

None.

## Drift and Debt

- Drift: issue/epic #1371 ownership text is stale relative to #1728; supervisor route override.
- Debt: update only the CommunityToolkit Deno/SQLite entry in slice 3.

## Commits

- Rebased slice SHAs: `ca80c26b4`, `ab2318fb2`, `aec266d4e`, `eff0548a2`; see the draft PR's
  reconciliation and per-slice comments.
