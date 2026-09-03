# Research — re-runnable canonical resource slice generator (#1354)

## Research contract

- **Phase:** PLAN research only; no product files are changed by this run.
- **Repository baseline:** `38f2ce7358f80e4075c481b450b52e1a01c5984c` on
  `feat/cli-resource-slice-plan`.
- **Primary archetype:** Architecture Doctrine Archetype 6 (CLI tooling). The plan also identifies
  one bounded Archetype-4 Fresh export seam rather than copying Fresh route-discovery logic into the
  CLI.
- **Scope overlay:** frontend generation plus CLI command composition.
- **Harness decision:** PLAN-EVAL is required because the work changes the public command surface,
  template authority, shared-source mutation, and a package export. A separate opposite-family
  evaluator must run the Plan Protocol before implementation begins.
- **Runtime constraint:** no local app runtime, Aspire, Docker, browser, or `e2e:cli` command was
  run. Runtime proof is assigned to a hosted lane in the plan.

## Sources inspected

### Harness, doctrine, and skills

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/deno-fresh/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/jsr-audit/SKILL.md`
- `.llm/harness/workflow/activation.md`
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/workflow/lane-policy.md`
- `.llm/harness/gates/plan-gate.md`
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
- `.llm/harness/archetypes/SCOPE-frontend.md`
- `docs/architecture/doctrine/01-thesis-and-axioms.md`
- `docs/architecture/doctrine/06-archetypes.md`
- `.llm/harness/gates/static-gates.md` (the former `doctrine/05-testing.md` has **no** current
  doctrine successor; testing gates live here)
- `.llm/harness/gates/fitness-gates.md`
- `docs/architecture/doctrine/07-composition-and-extension.md`
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- `docs/architecture/doctrine/ref-migration-map.md`
- `.llm/runs/feat-workers-runtime--1592-1451/plan.md` as the required slice-plan shape reference.

> **Path currency note (harness sync, 2026-09-02).** The source list above was corrected
> against `origin/main`. Three harness files moved directory — `plan-gate.md` and
> `archetype-gate-matrix.md` into `.llm/harness/gates/`, `SCOPE-frontend.md` into
> `.llm/harness/archetypes/` — and the doctrine catalog was renumbered, so
> `01-core-principles` → `01-thesis-and-axioms`, `02-package-archetypes` → `06-archetypes`,
> `07-dependency-graph` → `07-composition-and-extension`, and both `09-anti-patterns` and
> `10-doctrine-fitness` collapse into `09-anti-patterns-and-fitness-functions.md`
> (with `ref-migration-map.md` carrying the AP/F renumbering). `doctrine/05-testing.md` and
> `doctrine/06-quality-gates.md` have **no doctrine successor**; their subject now lives in
> `.llm/harness/gates/static-gates.md` and `fitness-gates.md`. Recorded as a gap rather than
> mapped to a plausible-looking file — a fabricated citation is worse than an acknowledged one.

### Requested audit evidence

- `.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/research/repo-audit/mcp-cli.md`
  §4.2.
- `.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/research/repo-audit/web-layer.md`
  §2.1.
- Live issue `rickylabs/netscript#1354`.
- Open PR `rickylabs/netscript#1664` at inspected head `377811da85045be055059d836c524c213794a71d`.

### Focused code and public-surface inspection

- `deno doc packages/cli/mod.ts`
- `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts`
- `deno doc --filter QueryIsland packages/fresh/src/application/query/mod.ts`
- `deno doc --filter defineRouteContract packages/fresh/src/application/route/mod.ts`
- `deno doc --filter defineStatsPartial packages/fresh/src/application/builders/mod.ts`
- `deno doc packages/fresh/src/application/route/mod.ts`
- `deno doc packages/fresh/src/application/vite/vite.ts`
- Focused reads of the CLI command group, scaffold writers, route templates, template manifest,
  Fresh route-manifest implementation, and the `#1664` head versions of its owned files.

The Vite `deno doc` inspection completed but printed optional npm/Node type-resolution warnings.
That is an inspection warning, not gate evidence. The implementation lane must use the structured
doc-lint and publish gates listed in the plan.

## Re-established baseline

### B1. The `generate` group has exactly three commands

At this baseline, `packages/cli/src/public/features/generate/generate-group.ts` registers only:

1. `aspire`
2. `runtime-schemas`
3. `plugins`

There is no resource or route-slice command. The finding was established from the command group, not
inherited from the issue text.

### B2. Exactly one generated app asset mentions the builder pair

The focused asset query was:

```text
rg -l 'withResource|withRouteContract' \
  packages/cli/src/kernel/assets/app --glob '*.template'
```

It returns one file:

```text
packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template
```

That file has one `withRouteContract` call and two `withResource` calls. It is emitted only by the
one-shot init writer. No re-runnable command consumes it.

### B3. What the frozen example currently demonstrates

The init-only service example currently emits a larger demo family through
`write-example-service-app-files.ts`:

| Concern                   | Current frozen asset                                          | Current state                                                                           |
| ------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Page composition          | `routes/examples/service/index.tsx.template`                  | `definePage`, inline route contract, policy, telemetry, resources, layers, form, layout |
| Route contract schemas    | `routes/examples/service/(_lib)/route-contract.ts.template`   | path/search/form schemas, but not a Fresh sidecar                                       |
| Server cache-first loader | `routes/examples/(_shared)/service-showcase*.ts.template`     | query client, `fetchQuery`, dehydration, initial data, `cachedAt`                       |
| Hydrated query UI         | `routes/examples/(_islands)/ServiceShowcaseLab*.tsx.template` | `QueryIsland` plus compatibility `useQuery`; no `initialDataUpdatedAt`                  |
| Markup/components         | route-local `(_components)` asset family                      | hero, lab, managed form, notes, summary, layout                                         |
| Deferred partial          | `routes/partials/examples/service-summary.tsx.template`       | partial route plus deferred summary layer                                               |
| Query binding             | `routes/examples/service/(_lib)/service-query.ts.template`    | generated query factory; this template is owned by in-flight #1664                      |
| Registration              | `router.ts.template`                                          | manual `createRouteReference` aliases mixed with generated routes                       |
| State                     | `utils.ts.template`                                           | `State = Record<string, never>`                                                         |

This is evidence for the architecture, but it is not yet the exact target output. In particular:

- the contract is inline in `index.tsx`, while Fresh's discoverable sidecar for that page is
  `index.route.ts`;
- the island calls the compatibility `useQuery` alias and does not preserve server cache age with
  `initialDataUpdatedAt`;
- router aliases for the example include a manual `createRouteReference` rather than using only the
  generated route manifest; and
- the files are rendered only during init.

The new canonical planner therefore cannot merely copy the frozen files unchanged.

### B4. The seed audits are valid justification but stale as a current inventory

The requested audit sections were verified. They record the framework-available/generated-absent gap
that motivated #1354, including route contracts, resource loading, forms, streaming, state, and
registration. Their recorded zero-occurrence counts were true at their audited commit.

The current baseline has advanced: the frozen service example now contains `withResource`,
`withRouteContract`, a form, and a deferred partial. The central result remains true: those
capabilities are still absent from every re-runnable verb. The plan uses the live source baseline
above and treats the audit table as historical/measured justification, not as present-tense counts.

The Wave-6 `rickylabs/loom` result is traceable through those audit artifacts and the live #1354
body: despite receiving the registry and web-layer guidance, the consumer hand-rolled tables, direct
service calls, and a 676-line island. This run did not clone or execute the external Loom
repository; it verified the local provenance chain requested by the brief.

### B5. `ui:add` is adjacent, not the resource-slice verb

The seed issue's description of `ui:add page` as a non-data stub is also stale. On the current
branch, `web-scaffold.ts` emits a small data-screen shape. At the inspected #1664 head it also gains
an explicit `--client` path and improved service-query binding.

Its responsibility is still intentionally smaller: a UI primitive/page/island addition with registry
lifecycle behavior. It does not own a contract procedure, a typed Fresh route sidecar, `definePage`
resources/layers, a form/partial/stream composition, or the complete resource-slice reconciliation
contract. Extending it would overload the `ui` namespace and make its simple page contract
conditional on service concepts.

### B6. Fresh already owns route discovery and generated bindings

Fresh's manifest implementation recognizes a sidecar sibling of a page module. For
`routes/orders/index.tsx`, the sidecar is `routes/orders/index.route.ts`. Route-local helper
directories whose names begin with `_` or `(_...)` are ignored by discovery.

Fresh supports two declaration forms:

- inline `.withRouteContract(...)`; or
- a discoverable sidecar plus page `.withRoute(...)` against the generated typed route map.

If both are present, the inline declaration wins and the sidecar is warned/ignored. The generator
must therefore use the second form only: `index.route.ts` defines the contract, and `index.tsx`
binds the generated `appRoutes` reference. It must not emit both contract forms.

The route scanner/renderers/writers already exist in
`packages/fresh/src/application/route/manifest.ts` and are used by the Fresh Vite adapter. They are
not currently exported from the `@netscript/fresh/vite` public entrypoint. Reimplementing their
path/id derivation in the CLI would create a second route convention. A bounded public export is
therefore planned.

### B7. The CLI currently has no Fresh package dependency

`packages/cli/deno.json` does not map `@netscript/fresh`. The planned programmatic manifest adapter
therefore needs an explicit JSR workspace dependency and must prove its dependency/publish surface
with the repo's Deno toolchain. The implementation must use `deps:why`/publish wrappers, must not
hand-roll registry checks, and must not delete or reload `deno.lock`. Because Fresh is already a
workspace package, the expected lock result is no unexplained lock churn; any actual lock change is
reviewed as part of the dependency slice rather than silently accepted.

### B8. #1664's selector is a dependency, not a design prompt

At inspected head #1664 adds `--client <service>` to `ui:add` and implements these exact rules:

1. A supplied selector must match exactly one generated service client by its exported service name;
   zero and duplicate matches are distinct errors.
2. Without a selector, zero candidates fails with the client-generation prerequisite.
3. Without a selector, one candidate is accepted.
4. Without a selector, more than one candidate fails closed and lists the services plus the
   `--client` remedy.

The new resource command must consume the same resolver, messages, and candidate semantics. It may
not copy or vary that algorithm. Since the current #1664 implementation locates the logic inside
`web-scaffold.ts`, a serialized first implementation slice extracts it into one additive shared
module and leaves `web-scaffold.ts` as a consumer.

Files owned or changed by #1664 and therefore collision-sensitive are:

- `packages/cli/src/kernel/application/ui/web-scaffold.ts`
- `packages/cli/src/kernel/application/ui/web-scaffold_test.ts`
- `packages/cli/src/public/features/ui/add/add-ui-command.ts`
- `packages/cli/src/public/features/ui/add/add-ui-input.ts`
- `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template`
- `packages/cli/src/public/features/root/public-command-dependencies.ts`
- `packages/cli/src/kernel/assets/embedded.generated.ts`
- `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template`
- `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template`
- `packages/cli/e2e/src/domain/cli-surface.ts`
- `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`

The first five are the selector/service-query production surfaces called out by the brief. The
additional overlap comes from the inspected live PR diff (formatter composition, generated asset
refresh, cache-age island updates, and hosted gates). The resource plan touches all listed files
only after #1664 merges and explicitly names each later slice. It does not touch the add-ui
command/input or the service-query template. Slice F must preserve #1664's cache-age behavior while
retiring the two old island copies.

### B9. Shared app files are customized source, not replaceable templates

The current init templates establish these shapes:

- `router.ts` exposes `routePatterns`, generated `routes`, `appRoutes`, and `appRouter`; it also
  contains several manually constructed references.
- `utils.ts` defines `State = Record<string, never>`, then derives Fresh `define` and `definePage`
  from it.
- `.generated/manifest.ts` and `.generated/routes.ts` are derived artifacts seeded by init and
  regenerated by the Fresh Vite path.

A re-runnable command cannot safely render fresh copies of `router.ts` or `utils.ts` over user
edits. It needs bounded, preflighted transforms with recognizable anchors and conflict behavior. The
generated manifest files, by contrast, must be regenerated through Fresh's own writer rather than
hand-merged.

### B10. No speculative State extension is justified by the core slice

The always-on loader, island, page resources, and deferred partial do not inherently require
request-scoped `ctx.state`. Doctrine forbids speculative abstraction and accidental shared-state
coupling. The command should leave `utils.ts` byte-identical unless a selected option has a declared
request-state field. The implementation still needs a safe state-extension reconciler and tests
because the public contract promises correct extension when a variant actually needs it.

### B11. Package/public-surface audit

The CLI package remains Archetype 6 and keeps its current kernel/public split:

- command parsing and output stay in `src/public/features/generate/resource/`;
- pure planning/reconciliation belongs in `src/kernel/application/resource-slice/`;
- disk/manifest operations belong in `src/kernel/adapters/`;
- templates remain package-owned assets.

The new binary command does not require a new `packages/cli/mod.ts` library export. The planned
Fresh manifest functions do change the `@netscript/fresh/vite` public surface, so they require
explicit return types, public JSDoc, full-export-map doc lint, and publish dry-run. No new doctrine
debt is expected. The plan must not deepen the existing CLI debt entries for maintainer-mode mixing,
permissions documentation, or public API documentation completeness.

## Required emitted contract inventory

The implementation plan must cover this inventory, not just a page file:

| Output/behavior                     | Required contract                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `index.route.ts`                    | `defineRouteContract`; typed path/search schemas; discoverable Form-B sidecar                                                           |
| `index.tsx`                         | `definePage`; `.withRoute(appRoutes...)`; `.withResource`; layers; layout; meta; no presentational page JSX outside the layout callback |
| `index.layout.tsx`                  | route layout/slots using app-owned UI vocabulary                                                                                        |
| `(_components)/<resource>-view.tsx` | markup and app-owned `components/ui/mod.ts` primitives                                                                                  |
| `(_shared)/<resource>-loaders.ts`   | selected generated query factory; query client; `fetchQuery`; dehydration; `cachedAt`                                                   |
| `(_islands)/<Resource>Island.tsx`   | `QueryIsland`; `useIslandQuery`; factory `clientKey`; `initialData`; `initialDataUpdatedAt`                                             |
| partial option                      | deferred layer plus derived partial name and `routes/partials/...` route                                                                |
| form option                         | `withForm`, user-facing Zod messages, CSRF, typed redirect, span, `firstFieldError` UI                                                  |
| stream option                       | isolated `@netscript/fresh/streams` consumer                                                                                            |
| route bindings                      | Fresh-owned generated manifest/routes, then one idempotent `appRoutes` alias                                                            |
| State                               | unchanged unless an emitted variant declares a request-state field; otherwise bounded extension                                         |
| ownership                           | generator marker on each owned leaf and one-line directory-role headers                                                                 |
| results                             | preflighted `written`/`skipped`/`conflict`, `--dry-run`, explicit constrained `--force`                                                 |

## Planning conclusions

1. Add `netscript generate resource`; do not grow `ui:add` into a contract-aware workflow.
2. Start implementation only after #1664 is merged and extract its selector semantics into one
   shared module before the resource feature consumes them.
3. Replace the frozen-copy model with one pure resource-slice planner and one neutral template
   family. Init and the re-runnable command become two callers of that same authority.
4. Use Fresh sidecar Form B and expose Fresh's existing manifest writer through a documented public
   seam; do not duplicate route derivation in the CLI.
5. Preflight the entire operation. Exact generated content is skipped; divergent or unrecognized
   user content is a conflict and produces no writes. `--force` is explicit and narrowly scoped to
   positively generator-owned leaf files, never wholesale shared files.
6. Treat `router.ts`, `appRoutes`, and conditional `State` changes as bounded source transforms with
   exact-match/idempotence tests and fail-closed customized-shape behavior.
7. Keep plugin-contributed routes, a general `generate routes` command, and arbitrary AST rewriting
   outside this issue.

## Research-time validation status

| Check                                   | Status            | Notes                                                       |
| --------------------------------------- | ----------------- | ----------------------------------------------------------- |
| Requested audit sections read           | PASS              | Historical claims rebaselined against current source        |
| Generate command count                  | PASS              | Exactly three registrations                                 |
| Asset reference count                   | PASS              | Exactly one app template mentions the builder pair          |
| Focused Fresh/CLI public API inspection | PASS_WITH_WARNING | Vite doc inspection printed optional npm/Node type warnings |
| #1664 selector/ownership inspection     | PASS              | Read-only inspection of open PR head                        |
| Runtime/Aspire/Docker/browser/E2E       | NOT_RUN           | Prohibited by the planning brief                            |
| Product validation gates                | NOT_RUN           | Plan-only run; gates are assigned per slice in `plan.md`    |
