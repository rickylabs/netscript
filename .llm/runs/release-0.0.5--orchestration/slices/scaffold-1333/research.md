# Research: #1333

Baseline: `origin/main@35358886a72e93d5fc1aedb859faeea383bd1e2a` on
`feat/default-app-reference-quality`, inspected 2026-08-09.

## Live acceptance contract

Quoted verbatim from `gh issue view 1333 --repo rickylabs/netscript --json body`:

1. `Default frontend routes visibly use app-owned Fresh-UI components and interactive primitives rather than raw duplicate controls.`
2. `The canonical resource flow demonstrates route contract → typed SDK/query factory → layered page builder → QueryIsland hydration/cache-first → optimistic mutation/rollback.`
3. `Managed forms, loading/error/empty/success states, partial navigation, telemetry, and an auth-ready boundary are shown in executable starter code.`
4. `Generated DB schemas feed versioned contracts in the DB-backed example.`
5. `` `/design` and `/design/composition` are named and linked as the living design/component reference. ``
6. `` Route organization follows a coherent resource-local `(_components)`/`(_islands)` pattern comparable to eis-chat. ``
7. `Useful current examples are retained or upgraded, not deleted wholesale.`
8. `` Omitted `--app-name` derives a stable project-appropriate app name; explicit `--app-name` remains authoritative. ``
9. `Fresh scaffold golden/runtime tests verify the named app, tree, imports, advanced page flow, type-check, lint, and rendered states.`
10. `A measured agent smoke following Quickstart adopts or explicitly rejects the built-ins instead of silently hand-rolling them.`

The issue owner's follow-up comment additionally makes these implementation checks binding: an
inline `withRouteContract`; contract-derived client calls; `withResource` refined through layers;
typed `withPathParams` and `withSearchParams`; resource-local `(_components)`, `(_islands)`,
`(_shared)`, and `(_lib)`; generated-app rejection of `any`; distinct DB model/API contract/route
contract/view-model seams; executable loading/error/empty/success states; and discoverable links to
both design routes.

## Findings grounded in source

1. The current default is literal `dashboard` in
   `packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts:9`, and
   `validate-init.ts:86` selects it whenever `options.appName` is absent. Interactive init also
   offers that literal as its default. Explicit `--app-name` is already parsed by both public and
   maintainer commands.
2. The 50 app template assets total **165,796 bytes**; the complete generated CLI template barrel
   is **283,217 bytes raw / 62,035 bytes gzip**. No CLI-template byte cap exists. The separate MCP
   corpus cap is irrelevant and must not be reused as though it governed scaffold templates.
3. Current app assets contain zero occurrences of `withRouteContract`, `withResource`,
   `withPathParams`, `withSearchParams`, and `withForm`. They also contain zero auth/authorization
   boundary references. These are missing implementation mechanisms, not naming differences.
4. The optional service example already has a real typed-client/query-factory seam
   (`app/lib/example-service.ts.template`), server prefetch/dehydration, `QueryIsland`, mutations,
   a deferred partial, and telemetry. The memory island has `onMutate`/rollback; the DB-backed
   island has no `onMutate`, so the mode used by the canonical DB path does not meet row 2.
5. The DB-backed service contract already imports generated `@database/zod` schemas and aliases
   them into explicitly versioned `...SchemaV1` and `...ContractV1` exports
   (`service/contract.ts.template:11-45`). Row 4 therefore needs preservation and an integration
   proof, not a second schema-generation path.
6. The service route is already local for `(_components)`, `(_islands)`, and `(_shared)`, but its
   client/query module remains global under `app/lib/`; no resource-local `(_lib)` is generated.
7. `/design/composition` exists in the typed route seed and is linked from the design navigation;
   `/design` exists as a breadcrumb. The product home and chrome promote `/design/components`, not
   both issue-named living-reference routes. Row 5 is partial, not absent.
8. Home, dashboard, CRUD, design, telemetry, and service templates already use app-owned Fresh-UI
   imports. Row 1 is substantially present structurally; browser evidence and the canonical
   interactive resource route remain missing. It would be dishonest to claim a pre-fix RED for
   every word of this row.
9. Current runtime E2E proves that the app home returns HTML, and generated workspace gates cover
   type-check/lint. It does not render and assert the resource route's loading, empty, error,
   optimistic, rollback, and success states. Row 9 is partial.
10. Issue #1090 explicitly owns future-agent observation. Its controlled adoption experiment fixes
    brief, version, bundle, and budget, varies only app conventions, and requires six agents per
    arm with blind scoring. An implementation test or deterministic scaffold smoke cannot prove
    adoption.

## Pre-fix failure matrix

| Row | Proposed proof and concrete current result | Failure class |
| --- | --- | --- |
| 1 | Golden imports for app-owned primitives already pass; a new browser assertion that the canonical resource interaction uses those controls has no current canonical target. No honest whole-row RED exists. | qualitative + behavioral coverage gap |
| 2 | New `canonical resource flow` golden requires `withRouteContract`, query factory, layered page, hydration, DB-mode `onMutate`, saved snapshot, and `onError` restore. Current assets have zero `withRouteContract` and DB-mode `onMutate`; it fails before implementation. | compile-time/structural and behavioral |
| 3 | New route/state golden requires `withForm`, auth policy seam, named loading/error/empty/success renderers, partial navigation, and telemetry. Current assets have zero `withForm` and auth boundary; it fails. Browser state probes also have no current gate target. | structural and behavioral |
| 4 | Existing service-template test already sees `@database/zod` feeding `...SchemaV1`; add an integration test that renders DB mode and type-checks the generated seam. Expected pre-fix GREEN; this is preservation coverage, not a defect rewrite. | compile-time preservation |
| 5 | New home/chrome golden requires discoverable links labelled for `/design` and `/design/composition`. Current product navigation promotes only `/design/components`; the exact assertion fails. | structural |
| 6 | New generated-tree assertion requires `routes/examples/<resource>/(_lib)` plus the three existing local folders. Current writer generates no `(_lib)` and fails. | behavioral filesystem |
| 7 | Manifest/file-set preservation assertion for the existing dashboard, CRUD, health, telemetry, and design examples is expected pre-fix GREEN. Visual usefulness is review/browser judgment. | structural preservation + qualitative |
| 8 | Unit case `name=inventory-console`, omitted `appName`, expects a derived non-`dashboard` app; current `validateOptions` returns `dashboard`. Explicit `appName=backoffice` remains `backoffice` and is the positive authority control. | behavioral |
| 9 | Golden tree/import/state assertions and generated-app check/lint can be added immediately; the old tree fails the new advanced-flow assertions. A corrected `scaffold.runtime` browser gate must also be mutation-proven against a removed state marker/duplicate `any`. | compile-time and behavioral |
| 10 | No repository test can create observational evidence. A deterministic test would prove only emitted guidance, not agent adoption. | observational; no in-slice RED |

## Scope and cost finding

Rows 1-9 are one coherent but large CLI/frontend feature: estimated **30-40 owned files**, roughly
**2,000-3,500 changed lines**, and **4-7 engineering days** including stateful browser validation.
Most value comes from promoting and completing the existing service example rather than introducing
a second exemplar. Rows 1, 4, and 7 are primarily preservation/strengthening; rows 2, 3, 5, 6, 8,
and 9 carry the substantive delta.

Row 10 is disproportionate and observational. A single pre-registered agent smoke would cost about
one agent lane plus 30-60 minutes of scoring, but would be anecdotal and would not isolate why the
agent adopted the built-ins. The already-owned #1090 experiment costs **12 agent runs** (six per
arm), fixed budgets, artifact capture, and blind scoring—approximately 1-2 orchestration days plus
model cost. Recommendation: move row 10's closure evidence to #1090 before implementation; do not
tick it or add `Closes #1333` based on deterministic tests. Complete rows 1-9 here. If the owner will
not move row 10, #1333 must remain open after the implementation PR.

## Boundaries

- Reuse the existing generated schema, service contract, query factory, partial, telemetry, and UI
  registry paths; do not build parallel framework APIs.
- No public `@netscript/fresh`, `@netscript/fresh-ui`, SDK, contract, or service API change is
  planned. If current APIs cannot express the plan, stop and rescope rather than widening packages.
- No docs-site rewrite is planned. Generated app `AGENTS.md`/`WEB-LAYER.md` may change because they
  are scaffold output.
- No agent-adoption claim from golden, browser, or deterministic runtime tests.

