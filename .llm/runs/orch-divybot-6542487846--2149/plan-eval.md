# PLAN-EVAL — round 1

I found nothing that blocks the plan for issue 2149.

**Evidence checked against current code:**
- **Research is current.** `research.md` is re-baselined on main `851d1ce`. Its key claims hold in the code:
  - `plugins/auth/src/adapter/plugin.ts:49` hard-codes `prismaContract: 'database/auth.prisma'`.
  - `plugins/auth/scaffold.plugin.json` sets `defaultRequiresDb`, `infrastructureRequires: ["db","kv"]` and `officialSource.requiresDb` to true no matter which backend is chosen.
  - Public install fetches the published schema fragments only when the DB check says SQL is needed (`install-plugin.ts:185-205`).
  - Local install calls `copyPluginSchemasToRootDb` with no package fragments. That function only walks `plugins/<name>/database` (`db-integration.ts:208-251`), so the plan is right to cover the source-backed path separately.
- **Selecting the backend before DB planning is the right place.** `detectPluginDbRequirement` (`db-integration.ts:79-95`) is driven by `provider.defaultRequiresDb`. Adjusting the provider from the declared selector before `planPluginInstall` reaches both install paths without checking plugin names, and existing manifests keep their behaviour.
- **Generate and doctor should stay clean.** Install writes `RequiresDb` into appsettings (`appsettings-entry-builders.ts:95,143`). The deploy-config code reads that saved value before falling back to the static `infrastructure.requires` (`deploy-config-resolvers.ts:214`, `deploy-config-background.ts:123`). Doctor and the plugin-composition check don't test the DB requirement against infrastructure.
- **Issue goals are covered:**
  - kv-oauth and workos: no Prisma contract and no database, including on a project that already has SQL.
  - better-auth: keeps the four tables, with a negative control in S2.
  - install, generate and doctor proof on a `--no-db` project in S2.
  - The add-a-plugin docs warning is updated in S2.
- **Gate checklist:**
  - Decisions are locked with reasons: no destructive table removal, and changing backend means reinstalling with `--force`.
  - No open decisions that would force rework.
  - Slices S0, S1 and S2 are ordered, under 30 files, and each names its paths and gates.
  - The risk register has mitigations.
  - The gate set is the structured check/test/lint/fmt wrappers plus `quality:gate`, JSR audit and doc-lint.
  - Deferred scope is stated: data migration, runtime switching, and issue 2108.
  - The JSR surface scan covers the one optional, typed manifest field.
- **Owner constraints are respected.** `scaffold.runtime` is marked UNPROVEN locally and left to coordinator CI. It's one leaf at feature tier with no new architecture tier, and the evaluator override is recorded word for word.

**Advisory only, not blocking:** `plugin-registry.ts:348-383` still builds `infrastructure.requires` from the unchanged static `scaffold.plugin.json`. So after a kv-oauth install, `plugin list` and doctor's metadata view will still show auth as needing `db`. Runtime and Aspire config are unaffected because the saved `RequiresDb` value wins. S2's doctor proof should confirm it doesn't report this as a problem.

VERDICT: PASS
