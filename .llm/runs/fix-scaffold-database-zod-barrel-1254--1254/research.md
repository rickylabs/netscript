# Research — #1254 database Zod barrel

## Re-baseline

- Live issue #1254 read first; re-derived at `origin/main` `3a267aef1`.
- Branch was created from fetched main. The inherited one-line `deno.lock` modification remains
  unrelated and excluded.

## Findings

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | Root and contracts import maps both point `@database/zod` at primary-model `crud.ts`. | `workspace/deno-json.ts`; `application/scaffold/workspace-init.ts` |
| 2 | The complete models barrel exports every `*Schema`, but not template-required `*CreateInput` / `*UpdateInput` aliases. | Issue body; contract template; `writeCrudZodBarrel` |
| 3 | A path-only change would break the existing database contract template. | `contract.ts.template` imports all three names from `@database/zod`. |
| 4 | Generated Zod post-processing already owns Deno compatibility and the narrow `crud.ts` alias barrel. | `packages/database/scripts/fix-zod-imports.ts` |
| 5 | Focused workspace and contract scaffolder tests already assert the old path. | `workspace/generators_test.ts`; `service/scaffolder_test.ts` |

## JSR audit surface scan

- `@netscript/cli`: internal scaffold generator and tests; no exported symbol/config delta.
- `@netscript/database`: planned behavior change stays behind existing `fixZodImports`; no new
  public symbol or export entrypoint.
- Final full-export doc lint and per-package publish dry-runs retained.

## Open questions

- None blocking. Preserve `crud.ts` as the named narrow primary CRUD surface while making the
  complete barrel contract-compatible for every model.

