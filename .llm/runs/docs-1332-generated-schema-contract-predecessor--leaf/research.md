# Research — docs-1332-generated-schema-contract-predecessor--leaf

## Re-baseline

- Carried-in source: owner implementation brief for issue #1332, including locked plan-v2
  decisions and the prior separate PLAN-EVAL correction to D7.
- Re-derived against `origin/main` @ `da40fbfe377a9e728f190056771298100297a8f8` on 2026-08-10.
- `git fetch origin`, `git status --short --branch`, `git rev-parse origin/main HEAD`, and
  `git merge-base HEAD origin/main` all confirm the requested branch is clean and exactly based on
  the requested SHA.
- The live GitHub issue has eight unchecked acceptance boxes, milestone 0.0.6, and the expected
  legacy `area:contracts` issue label. No PR exists for this head branch at bootstrap.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The generated CRUD barrel exports `<Model>Schema`, `<Model>CreateInput`, and `<Model>UpdateInput`; it never exports `*ModelSchema`. | `packages/database/scripts/fix-zod-imports.ts:75-129`; `packages/database/tests/zod-crud-barrel_test.ts` |
| 2 | `@database/zod` is a generated import-map alias with distinct root and `contracts/` relative targets. | `packages/cli/src/kernel/templates/workspace/deno-json.ts:44-50`; `packages/cli/src/kernel/application/scaffold/workspace-init.ts:12-19` |
| 3 | The existing compile precedent asserts the contracts alias only as text while compiling through the root alias. | `packages/cli/src/kernel/adapters/service/scaffolder_test.ts:140-154,195-219` |
| 4 | Current homepage tab 3 passes route-search input directly to a numeric contract input and omits the generated `apps/dashboard/lib/users.ts` construction. | `docs/site/index.vto`; `packages/fresh/src/application/builders/define-page/types.ts:318-337,396` |
| 5 | `.withSearchParams(...)` resolves the route-search output before a loader reads `ctx.search`; generated route templates use it. | `packages/fresh/src/application/builders/define-page/types.ts:318-325`; `packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template:28` |
| 6 | `createServiceClient` and `createQueryFactories` are exported from public SDK subpaths, and `getCachedEntry` is server-only because it requires a registered cache provider. | `deno doc --filter createServiceClient @netscript/sdk/client`; `deno doc --filter createQueryFactories @netscript/sdk/query`; `packages/sdk/src/cache/cache-provider.ts:60-70` |
| 7 | The generated client/query module shape is already canonical in the scaffold asset. | `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template` |
| 8 | Quickstart and storefront tutorial pages already teach generated-schema narrowing and the DB-less counter-case accurately. | `docs/site/quickstart.vto:101-121`; `docs/site/tutorials/storefront/02-catalog-service.md:83-137`; `docs/site/tutorials/storefront/03-cart-contracts.md:135` |
| 9 | The current contract explanation contains absolute DB-less claims that contradict the generated-schema path, and the cross-link matrix is mostly absent. | `docs/site/explanation/contracts.md`; `docs/site/data-persistence/database.md`; `docs/site/web-layer/{route,server,builders}.md` |
| 10 | Homepage rendered-output invariants are fixed: two named `main h2` headings and exactly five destination links. | `docs/site/_plugins/check-rendered-output.ts` |

## Doctrine and current-state boundary

- This leaf describes the current public surfaces of `@netscript/database`, `@netscript/contracts`,
  `@netscript/sdk`, `@netscript/fresh`, and the generated CLI workspace. Those claims will be
  checked against code and `deno doc`, not inferred from doctrine targets.
- Doctrine A1/A2/A3/A14 apply editorially: make the boundary and its progressive path explicit,
  preserve the smallest useful example, and prove examples with executable checks.
- Current doctrine verdicts remain unchanged: database `Refactor`, Fresh `Restructure`, SDK `Keep`,
  contracts `Keep`, CLI `Restructure`. This docs-only leaf makes no compliance claim and does not
  change or deepen package architecture debt.

## jsr-audit surface scan (package/plugin waves)

- N/A. No package/plugin source or export map changes. Public symbols described by the docs are
  verified through `deno doc`, `deno why`, checked fixtures, and published entrypoint imports.

## Open questions

- None that can force rework. The owner brief locks tab placement, relation composition, alias
  targets, fixture paths, search coercion, cross-link set, gate set, and PR lifecycle.
