# Plan — a re-runnable verb that generates the canonical resource slice (#1354)

## Plan Gate

**PLAN-EVAL required.** This plan changes a public CLI command tree, establishes a canonical
template authority, reconciles customized application source, adds a CLI package dependency, and
exports a Fresh manifest facility. Before any implementation slice starts, a separate
opposite-family evaluator must execute `.llm/harness/evaluator/plan-protocol.md` and return `PASS`.
This planning session cannot self-certify that gate.

## Outcome

Ship one re-runnable command:

```text
netscript generate resource <resource> \
  --app <app> \
  --procedure <procedure> \
  [--client <service>] \
  [--route <route>] \
  [--form] [--partial] [--stream] \
  [--dry-run] [--force] [--project-root <path>]
```

It generates a complete Fresh resource slice from an existing generated service/query client,
registers the route through Fresh-derived bindings, reports `written`/`skipped`, and can be rerun
without changing a byte. A missing procedure, ambiguous client, customized shared-file shape, or
conflicting leaf fails during preflight and writes nothing.

The canonical demonstration command includes `--partial`; `--form` and `--stream` are composable
extensions. Each option is independently re-runnable and owns only its declared delta.

## Scope and doctrine verdict

- **Primary package/archetype:** `packages/cli`, Archetype 6.
- **Bounded secondary surface:** `packages/fresh` Archetype 4, only to publish its existing route
  manifest writer through `@netscript/fresh/vite`.
- **Doctrine verdict:** **Keep** the Archetype-6 public-command/kernel/adapters/assets split. Do not
  move business logic into Cliffy command callbacks and do not import CLI public features from the
  kernel.
- **Contract order:** input/result and resource-plan contracts first; pure planner/reconcilers
  second; adapters/templates third; public command last.
- **Expected doctrine debt:** none. If a safe shared-file transform proves impossible for a common
  customized shape, fail closed or record explicit debt; do not conceal it with a whole-file
  rewrite.

## Locked decisions

### D1 — Add a new `generate resource` subcommand

The verb is `netscript generate resource`, registered alongside the three existing `generate`
commands. It is not an extension of `ui:add`.

`ui:add` owns small UI/registry additions. The new verb starts from a named contract procedure and
owns a vertical web slice: typed route sidecar, server query resource, page layers, cache-aware
island, optional form/partial/stream, route bindings, and safe reconciliation. Folding that into
`ui:add` would make a simple page command depend on service contracts and would create ambiguous
rerun behavior for existing `ui:add` output.

The new command reuses app-root resolution from #1356 and the query-client selector from #1664; it
does not introduce another app or client selection mechanism.

### D2 — Lock resource, app, procedure, client, and route identities

- `<resource>` is a normalized kebab-case resource identifier and the source for Pascal/camel
  symbols. Invalid or empty normalization fails.
- `--app` uses the existing app resolver. Its current single-app behavior remains; ambiguity is
  fail-closed. `--project-root` exists for tests and established CLI composition, not as a second
  app selector.
- `--procedure` is required and must resolve from the selected generated client's typed procedure
  inventory before output planning. A missing procedure error names both procedure and client and
  produces zero writes.
- `--client` adopts #1664's exact selector and default:
  - zero candidates: fail with the existing client-generation prerequisite;
  - exactly one candidate and no flag: use it;
  - multiple candidates and no flag: fail closed, list services, and show `--client`;
  - a flag must match exactly one exported service name; zero/duplicate matches are distinct
    failures.
- `--route` defaults to `/<resource>` and otherwise accepts a normalized absolute Fresh route
  pattern. It is not used to infer a client or procedure.

Client resolution and procedure validation occur before filesystem mutation planning. The command
never scans candidates and silently picks the first.

### D3 — Preflight the complete operation; never silently destroy edits

Every run follows one transaction-like sequence:

1. resolve app/client/procedure and validate all input;
2. render every selected leaf in memory;
3. classify each target as `write`, `skip`, or `conflict`;
4. plan shared-source transforms and Fresh-derived manifest updates in memory/a temporary staging
   root;
5. if any conflict or unsupported shape exists, report all known conflicts and write nothing;
6. for `--dry-run`, report the plan and write nothing;
7. otherwise apply the already validated plan and report deterministic `written`/`skipped` paths.

Leaf semantics are:

| Existing target                                                                                                                 | Default                                    | With `--force`                             |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| absent                                                                                                                          | write                                      | write                                      |
| byte-identical                                                                                                                  | skip                                       | skip                                       |
| byte-identical to the marker's recognized previous option set, and the requested option set is an additive generator transition | replace with the newly rendered owned leaf | replace with the newly rendered owned leaf |
| positively resource-generator-owned but divergent                                                                               | conflict, no writes                        | replace that leaf only                     |
| unmarked or foreign-owned                                                                                                       | conflict, no writes                        | still conflict                             |

Every owned leaf has a stable marker containing generator id, resource id, role, template schema
version, and selected option set. For an additive option transition, the reconciler rerenders the
recorded prior option set and updates the leaf without force only when the existing bytes exactly
match that prior rendering. A hand edit therefore does not lose its protection merely because the
marker remains: a mismatch still requires explicit `--force`. An unmarked pre-existing file is never
adopted or overwritten, even with `--force`.

`--force` never bypasses client/procedure validation and never authorizes whole-file replacement of
`router.ts`, `utils.ts`, or any other shared source. This is the hand-edit preservation guarantee.

Required proof:

- first run reports written files;
- identical second run exits 0, reports every selected output as skipped, and writes zero bytes;
- edit one owned leaf, rerun without force, and assert non-zero plus a byte-for-byte unchanged app;
- rerun with force and assert only that marked leaf changes;
- put foreign content at a target and assert both default and force fail with zero writes;
- cause a late shared-source conflict and assert no earlier planned leaf was written.

### D4 — One neutral template family and one planner are authoritative

The source of truth becomes:

- one neutral asset family under `packages/cli/src/kernel/assets/resource-slice/`; and
- one pure `planResourceSlice()` application service that renders the selected variants and returns
  intended files plus shared edits.

The re-runnable command and the init example writer are two callers of that planner. The existing
service example becomes an init preset supplying resource/client/procedure/route and the desired
options. It may retain clearly demonstration-only telemetry or mutation embellishments outside the
canonical family, but it cannot retain separate copies of the canonical page, route contract,
loader, island, view/layout, form, or partial templates.

The `service-query` template is not copied into the resource family. It remains owned by #1664 and
the resource planner consumes its selected generated module/symbol contract. Template keys removed
from the old example family must be removed from the asset manifest in the same slice so an orphan
cannot masquerade as a second authority.

The template schema version is internal reconciliation metadata, not a public migration engine.
Changing generated content increments it and makes divergent old owned files an explicit conflict
unless the user supplies `--force`.

### D5 — Use Fresh sidecar Form B and Fresh-owned manifest derivation

For a resource directory `routes/<segments>/index.tsx`, the planner emits
`routes/<segments>/index.route.ts`. That sidecar calls `defineRouteContract`; the page does not call
`withRouteContract`. Instead it calls `.withRoute(appRoutes.<alias>)`.

After staging the sidecar, the CLI invokes the public Fresh route-manifest writer to derive
`.generated/manifest.ts` and `.generated/routes.ts`. It does not copy `routePathToId`, scan rules,
or renderer logic into `packages/cli`.

The bounded Fresh public seam is exact: `resolveNetScriptRouteManifestOptions`,
`discoverNetScriptRoutes`, `writeNetScriptRouteManifestSync`, and their
input/result/discovered-route types. Discovery supplies the route's canonical `routeKeyPath` for the
appRoutes property chain. The CLI does not export or call Fresh's page-module rewrite pass; it owns
only the new generated page leaf and must not rewrite unrelated pages.

The CLI then performs one bounded `router.ts` transform:

- the file must contain the standard generated-route imports and a recognizable
  `export const appRoutes = { ... } as const` object;
- the resource alias value is a property chain into `generatedRoutes`, never an inline
  `createRouteReference`;
- an exact alias/value is skipped;
- an absent alias is inserted once at the stable appRoutes anchor;
- an existing alias with another value, a different alias resolving the same new route id, or an
  unsupported customized object shape is a conflict;
- unrelated imports, comments, properties, formatting, and user routes are preserved;
- neither default nor `--force` replaces the whole file.

Fresh-generated files are explicitly derived outputs. They are produced through Fresh's writer and
content-compared. They are not parsed as user-owned shared source and are not hand-merged.

### D6 — State extension is conditional and bounded

The always-on core and the three specified options do not receive a synthetic request-state field
solely to exercise the mechanism. They leave `utils.ts` byte-identical unless a future/selected
variant's contract declares `requiredState`.

When a selected variant declares request state, the reconciler accepts only these known app shapes:

- `export type State = Record<string, never>;`, which is converted once to an exported interface
  containing the generated property; or
- an existing `export interface State { ... }`, into which one marked property is inserted.

An exact property/type is skipped. A same-name/different-type property, type alias with another
shape, intersection/extension the reconciler cannot prove safe, or missing State declaration is a
conflict before any write. The transform preserves all unrelated content and never replaces
`utils.ts`, including under `--force`.

Tests prove the core, form, partial, and stream plans do not change `utils.ts`; separate unit
fixtures prove the two supported extension shapes and all fail-closed cases.

### D7 — Lock the emitted file contract

For resource `orders` at `/orders`, the canonical output is:

| Selection   | Target                                                      | Responsibility                                                               |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| always      | `apps/<app>/routes/orders/index.route.ts`                   | typed `defineRouteContract` sidecar                                          |
| always      | `apps/<app>/routes/orders/index.tsx`                        | `definePage`, route binding, resource, layers, layout, meta; no view markup  |
| always      | `apps/<app>/routes/orders/index.layout.tsx`                 | route layout/slot composition                                                |
| always      | `apps/<app>/routes/orders/(_components)/orders-view.tsx`    | presentational composition using app-owned UI primitives                     |
| always      | `apps/<app>/routes/orders/(_islands)/OrdersIsland.tsx`      | `QueryIsland`, `useIslandQuery`, factory `clientKey`, initial data/cache age |
| always      | `apps/<app>/routes/orders/(_shared)/orders-loaders.ts`      | selected query factory, query client, `fetchQuery`, dehydration, `cachedAt`  |
| `--form`    | `apps/<app>/routes/orders/(_components)/orders-form.tsx`    | field UI and `firstFieldError`                                               |
| `--form`    | `apps/<app>/routes/orders/(_lib)/orders-form.ts`            | Zod contract/copy and pure form helpers                                      |
| `--partial` | `apps/<app>/routes/orders/(_components)/orders-summary.tsx` | deferred summary component                                                   |
| `--partial` | `apps/<app>/routes/partials/orders/summary.tsx`             | `definePartial`/partial response using derived name                          |
| `--stream`  | `apps/<app>/routes/orders/(_islands)/OrdersStream.tsx`      | isolated `@netscript/fresh/streams` consumer                                 |

Directory-role ownership headers are emitted in the first generated file in each selected helper
directory: `(_components)` markup only; `(_islands)` hydration only; `(_shared)` loaders and shared
types; `(_lib)` route-local pure contracts/helpers. Each individual leaf also carries the machine
ownership marker used by reconciliation.

The page binds:

- one read `.withResource` to the cache-first loader;
- one markup layer to the view;
- form, deferred-summary, and stream layers only when their flags are selected;
- a layout and meta description;
- no raw table or reusable-registry equivalent when an app-owned UI primitive is available.

The cache path is contract-derived and contains no raw `fetch`, handwritten query-key array, `any`,
or manual JSON parsing. The island uses the selected query factory's `clientKey`, passes
`initialData`, and passes `initialDataUpdatedAt: cachedAt`.

Each optional flag adds only its declared leaves plus deterministic imports/builder calls in the
already owned page/view where necessary. Running one option later updates an existing owned leaf
without force only when that leaf is byte-identical to the canonical rendering recorded by its
previous option marker. Any hand edit makes the transition a conflict. It never affects another
option's leaves. Dry-run names every addition and exact canonical transition before mutation.

### D8 — Keep IO and rendering behind CLI boundaries

- Cliffy definitions and text/JSON output live under `src/public/features/generate/resource/`.
- Normalization, validation, output plan types, content comparison, and source-edit planning are
  pure application code under `src/kernel/application/resource-slice/`.
- Filesystem application and the Fresh manifest bridge are adapters.
- Templates contain no IO and no command parsing.
- Existing filesystem/template/output ports are reused; no `Deno.*` calls enter the application
  layer.
- Exported Fresh functions receive explicit types/JSDoc and are re-exported only from the existing
  `@netscript/fresh/vite` entrypoint.

The CLI adds `@netscript/fresh` as an explicit package dependency. Implementation evidence uses
`deno task deps:why @netscript/fresh`, full export-map doc lint, production install, and publish
dry-run. No registry curl, reload, or lock deletion is permitted.

### D9 — Serialize all #1664 overlap

No implementation slice begins until #1664 is merged and the implementation worktree contains its
`--client` contract and service-query changes. If it is still open, the run stops rather than
recreating its patch.

The selector extraction overlaps:

- `packages/cli/src/kernel/application/ui/web-scaffold.ts`
- `packages/cli/src/kernel/application/ui/web-scaffold_test.ts`

into the additive shared file `packages/cli/src/kernel/application/ui/query-client-selector.ts` and
its test. The add-ui command/input and `service-query.ts.template` remain untouched. The supervisor
must serialize this slice after #1664 and rebase before it starts.

The inspected #1664 diff also overlaps later planned files. They are serialized after its merge:

- Slice D/F: `packages/cli/src/kernel/assets/embedded.generated.ts`;
- Slice E: `packages/cli/src/public/features/root/public-command-dependencies.ts`;
- Slice F:
  `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template`
  and its `.memory.tsx.template` sibling; convergence must carry #1664's `initialDataUpdatedAt` fix
  into the neutral island rather than delete the behavior;
- Slice G: `packages/cli/e2e/src/domain/cli-surface.ts` and
  `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`.

No #1354 worker edits any of these files concurrently with #1664. A base missing its merged changes
is a hard stop, not a request to recreate them.

### D10 — Every implementation slice is partial issue work

Every slice PR/body uses `Refs #1354`, states its remaining scope, and leaves #1354 open. No slice
claims the entire acceptance contract. Only the later umbrella/landing coordination may decide issue
closure after all hosted acceptance evidence exists.

### D11 — Runtime proof belongs to the hosted lane

Author and evaluator worktrees run static/unit/package gates only. They do not start a local app or
invoke Aspire, Docker, a browser, or `e2e:cli`.

After all code slices are assembled, the hosted merge-readiness lane runs the single one-pass
scaffold command required by repository policy, with cleanup, and reports its raw exit code. It also
owns the generated-app runtime/browser proof. A hosted failure returns to the smallest owning slice;
it is not worked around by an out-of-brief local launch.

## Shared-file mutation matrix

| Shared/derived file              | Owner/coordination                         | Planned behavior                                                        | Customized behavior                                           |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `generate-group.ts`              | #1354 command slice                        | register `resource` exactly once                                        | duplicate/name collision fails command-tree test              |
| `public-command-dependencies.ts` | #1354 command slice                        | add typed dependencies required by the command                          | composition test catches missing/duplicate binding            |
| `web-scaffold.ts`                | #1664 then serialized #1354 selector slice | consume extracted exact selector                                        | no behavioral rewrite in extraction                           |
| `router.ts` in generated app     | user-owned shared source                   | bounded appRoutes insertion using generated route property chain        | unsupported/conflicting shape fails preflight; never replaced |
| `.generated/manifest.ts`         | Fresh-derived                              | regenerate through Fresh writer, content-compare                        | generated file is regenerated, not hand-merged                |
| `.generated/routes.ts`           | Fresh-derived                              | regenerate through Fresh writer, content-compare                        | generated file is regenerated, not hand-merged                |
| `utils.ts` in generated app      | user-owned shared source                   | unchanged unless declared state requirement; bounded property insertion | unsupported/conflicting shape fails preflight; never replaced |
| template manifest/carrier        | CLI package-generated registry             | add/remove keys atomically with template family                         | asset consistency gate rejects drift                          |
| #1664 service-query template     | #1664                                      | consume selected output only                                            | no #1354 edits                                                |

## Open-decision sweep

| Candidate decision                      | Locked now?     | Resolution                                                             |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| New command vs `ui:add` mode            | Yes             | new `generate resource` command                                        |
| App/client ambiguity                    | Yes             | existing app resolver plus exact #1664 fail-closed selector            |
| Procedure identity                      | Yes             | required `--procedure`, validated before write planning                |
| Rerun/force semantics                   | Yes             | full preflight; exact skip; conflict default; force only marked leaves |
| Sidecar vs inline contract              | Yes             | sidecar Form B only                                                    |
| Manifest derivation                     | Yes             | Fresh public writer; no CLI clone                                      |
| Template authority                      | Yes             | neutral family + one planner, consumed by init and command             |
| State mutation                          | Yes             | no speculative state; bounded conditional transform                    |
| Plugin-contributed frontend surfaces    | No, safe defer  | RFC/issue dependency remains outside core #1354                        |
| General-purpose `generate routes`       | No, safe defer  | only resource-registration needs are included                          |
| Arbitrary AST/custom router support     | No, safe defer  | recognized shapes or fail closed with manual guidance                  |
| Deleting a resource                     | No, safe defer  | no destructive remove verb in this issue                               |
| Runtime/browser implementation strategy | No local choice | hosted lane uses repository-standard scaffold/runtime proof            |

No unresolved decision can change the core command contract or first implementation slice. The
separate PLAN-EVAL may reject a locked decision; any such change requires updating this plan before
implementation.

## Slices, ceilings, and gates

File ceilings count created, modified, moved, and deleted files. If a slice exceeds its ceiling or
needs a shared file not listed below, stop and rescope/update the plan before editing. RTK output is
exploratory only; durable merge evidence uses the repository gate wrappers/receipts.

### Slice A — share #1664's client selector (Refs #1354; partial)

**Landability:** behavior-preserving extraction that can land immediately after #1664. It does not
introduce the resource command.

**Hard prerequisite:** #1664 merged and its selector tests present in the worktree.

**File ceiling:** 4.

**Expected touch set:**

1. `packages/cli/src/kernel/application/ui/query-client-selector.ts` — new shared resolver.
2. `packages/cli/src/kernel/application/ui/query-client-selector_test.ts` — exact zero/one/many,
   explicit zero/duplicate-match, and stable diagnostic tests.
3. `packages/cli/src/kernel/application/ui/web-scaffold.ts` — consume the resolver; no selection
   behavior changes.
4. `packages/cli/src/kernel/application/ui/web-scaffold_test.ts` — retain integration coverage,
   removing only unit cases moved to the resolver test.

**Required gates:**

- focused selector and web-scaffold unit tests;
- structured check/lint/fmt for the four files;
- `deno task arch:check`;
- diff review against #1664 proving unchanged command behavior and no edits to its command/input or
  service-query template.

### Slice B — publish and adapt Fresh manifest derivation (Refs #1354; partial)

**Landability:** a documented Fresh public seam plus a CLI adapter. No command calls it yet.

**File ceiling:** 6.

**Expected touch set:**

1. `packages/fresh/src/application/vite/vite.ts` — re-export exactly
   `resolveNetScriptRouteManifestOptions`, `discoverNetScriptRoutes`,
   `writeNetScriptRouteManifestSync`, and their input/result/discovered-route types; do not expose
   the page-module rewrite pass.
2. `packages/fresh/src/application/vite/vite.test.ts` — public-entrypoint/manifest-write contract.
3. `packages/cli/deno.json` — explicit `@netscript/fresh` dependency mapping.
4. `packages/cli/src/kernel/adapters/scaffold/fresh-route-manifest.ts` — CLI adapter around the
   Fresh writer.
5. `packages/cli/src/kernel/adapters/scaffold/fresh-route-manifest_test.ts` — temp-fixture content
   comparison and sidecar discovery tests; no server start.
6. `deno.lock` — expected unchanged; count it if Deno produces a justified reviewed change. Any
   unexplained churn fails the slice.

**Required gates:**

- focused Fresh Vite/manifest and CLI adapter tests;
- structured check/lint/fmt for both package roots;
- `deno task deps:why @netscript/fresh`;
- `deno task doc:lint --root packages/fresh --pretty`;
- the `jsr-audit` checklist for both packages (export/include configuration, allowed specifiers,
  public docs, slow-type risk, and publish contents);
- `deno task deps:prod-install`;
- `deno task publish:dry-run`;
- `deno task arch:check` and `deno task quality:gate`.

### Slice C — define the resource contract and safe reconciler (Refs #1354; partial)

**Landability:** pure application contracts/planning/reconciliation with fixtures. It does not
register a command or alter init.

**File ceiling:** 11.

**Expected touch set:**

1. `packages/cli/src/kernel/application/resource-slice/resource-slice-contract.ts` — normalized
   input, variants, selected client/procedure, owned-leaf metadata, result union.
2. `packages/cli/src/kernel/application/resource-slice/resource-slice-contract_test.ts` — naming,
   route, and variant invariants.
3. `packages/cli/src/kernel/application/resource-slice/plan-resource-slice.ts` — pure output plan.
4. `packages/cli/src/kernel/application/resource-slice/plan-resource-slice_test.ts` — always/form/
   partial/stream delta fixtures and forbidden-pattern assertions.
5. `packages/cli/src/kernel/application/resource-slice/reconcile-resource-slice.ts` — absent/exact/
   owned-divergent/foreign classification and atomic preflight result.
6. `packages/cli/src/kernel/application/resource-slice/reconcile-resource-slice_test.ts` — second
   run, dry-run, force boundary, and late-conflict zero-write plan tests.
7. `packages/cli/src/kernel/application/resource-slice/reconcile-app-routes.ts` — bounded
   `appRoutes` transform.
8. `packages/cli/src/kernel/application/resource-slice/reconcile-app-routes_test.ts` — exact,
   insert, conflict, and customized-shape fixtures.
9. `packages/cli/src/kernel/application/resource-slice/reconcile-state.ts` — conditional State
   transform.
10. `packages/cli/src/kernel/application/resource-slice/reconcile-state_test.ts` — both supported
    shapes and fail-closed fixtures.
11. `packages/cli/src/kernel/application/resource-slice/README.md` — ownership boundary and the pure
    plan/apply contract for maintainers; not end-user prose.

**Required gates:**

- all resource-slice unit tests;
- negative generated-content scan for `any`, raw `fetch(`, handwritten query-key arrays, and manual
  response `JSON.parse`;
- structured package check/lint/fmt;
- `deno task arch:check` and `deno task quality:gate`.

### Slice D — establish the canonical template family (Refs #1354; partial)

**Landability:** assets and golden rendering tests wired to the pure planner. Init still uses its
old copies until Slice F, so this slice must be followed by F before the feature is considered
complete; it is independently safe because no public command selects the new family yet.

**File ceiling:** 18.

**Expected touch set:**

1. `packages/cli/src/kernel/assets/resource-slice/index.route.ts.template`
2. `packages/cli/src/kernel/assets/resource-slice/index.tsx.template`
3. `packages/cli/src/kernel/assets/resource-slice/index.layout.tsx.template`
4. `packages/cli/src/kernel/assets/resource-slice/(_components)/resource-view.tsx.template`
5. `packages/cli/src/kernel/assets/resource-slice/(_islands)/ResourceIsland.tsx.template`
6. `packages/cli/src/kernel/assets/resource-slice/(_shared)/resource-loaders.ts.template`
7. `packages/cli/src/kernel/assets/resource-slice/(_components)/resource-form.tsx.template`
8. `packages/cli/src/kernel/assets/resource-slice/(_lib)/resource-form.ts.template`
9. `packages/cli/src/kernel/assets/resource-slice/(_components)/resource-summary.tsx.template`
10. `packages/cli/src/kernel/assets/resource-slice/partials/summary.tsx.template`
11. `packages/cli/src/kernel/assets/resource-slice/(_islands)/ResourceStream.tsx.template`
12. `packages/cli/src/kernel/assets/manifest.ts` — canonical keys; no duplicate old authority yet
    removed until Slice F.
13. `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` — typed carrier.
14. `packages/cli/src/kernel/application/resource-slice/render-resource-slice.ts` — render adapter
    orchestration against the pure plan.
15. `packages/cli/src/kernel/application/resource-slice/render-resource-slice_test.ts` — exact
    golden outputs and option deltas.
16. `packages/cli/src/kernel/assets/resource-slice/README.md` — template variables, ownership
    markers, and directory-role header contract.
17. `packages/cli/src/kernel/application/resource-slice/plan-resource-slice_test.ts` — extend the
    Slice-C fixture to assert the real rendered asset roster.
18. `packages/cli/src/kernel/assets/embedded.generated.ts` — regenerate the checked-in asset carrier
    from the manifest; never hand-edit it.

**Required gates:**

- resource render/golden tests for core and each independent option;
- `deno task check:assets-barrel` and `deno task check:publish-assets`;
- `deno task check:emitted-samples`;
- consumer-shaped type-check fixture using generated query factories, without starting a server;
- structured CLI check/lint/fmt;
- JSR audit for `packages/cli`, publish dry-run, `arch:check`, and `quality:gate`.

### Slice E — compose the unregistered command and atomic apply path (Refs #1354; partial)

**Landability:** implements and tests the command using the already tested planner, selector, and
adapters, but deliberately does not register it in the public `generate` group. The command remains
unreachable until Slice F converges init and activates it, so this slice cannot expose a second
template authority.

**File ceiling:** 6.

**Expected touch set:**

1. `packages/cli/src/public/features/generate/resource/generate-resource-input.ts` — public input
   and flag mapping.
2. `packages/cli/src/public/features/generate/resource/generate-resource.ts` — application
   orchestration: resolve, validate, plan, preflight, dry-run/apply, result.
3. `packages/cli/src/public/features/generate/resource/generate-resource_test.ts` — in-memory/temp
   integration including missing procedure and zero-write conflicts.
4. `packages/cli/src/public/features/generate/resource/generate-resource-command.ts` — Cliffy
   command/help/options.
5. `packages/cli/src/public/features/generate/resource/generate-resource-command_test.ts` — parse,
   help, selector forwarding, JSON/text result, and exit behavior.
6. `packages/cli/src/public/features/root/public-command-dependencies.ts` — add the typed resource
   command dependency bundle and construct it from existing filesystem/template/app-root ports plus
   the Fresh manifest adapter.

**Required gates:**

- focused feature, parser, and composition tests;
- twice-run temp-project test proving second run writes zero and exits 0;
- missing-procedure/ambiguous-client/foreign-target/late-router-conflict zero-write tests;
- `--dry-run` and constrained `--force` tests;
- structured CLI check/lint/fmt;
- `deno task check:mcp-export-corpus` if CLI help is part of the exported corpus;
- CLI JSR audit, publish dry-run, `arch:check`, and `quality:gate`.

### Slice F — converge init and activate the command (Refs #1354; partial)

**Landability:** removes the divergent canonical copies, makes init call the planner preset, then
registers the command as the second caller of that same authority. It does not change
telemetry/demo-only files or #1664's service-query template.

**File ceiling:** 23.

**Expected touch set:**

1. `packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files.ts` —
   delegate canonical slice files to the planner; retain only demo-only additions.
2. `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts` — pass planner inputs
   and selected client/procedure binding.
3. `packages/cli/src/kernel/application/scaffold/writers/write-app-files_test.ts` — prove init and
   command render identical canonical roles.
4. `packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template` — remove old
   canonical copy.
5. `packages/cli/src/kernel/assets/app/routes/examples/service/index.layout.tsx.template` — remove
   old canonical copy.
6. `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/route-contract.ts.template` —
   remove old canonical copy; do not touch sibling `service-query.ts.template`.
7. `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template` —
   remove DB canonical-loader copy.
8. `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.memory.ts.template`
   — remove memory canonical-loader copy after the preset supplies its binding.
9. `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template` —
   remove DB canonical-island copy.
10. `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template`
    — remove memory canonical-island copy.
11. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/managed-form.tsx.template` —
    remove canonical form copy.
12. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-card.tsx.template` —
    remove canonical summary copy.
13. `packages/cli/src/kernel/assets/app/routes/partials/examples/service-summary.tsx.template` —
    remove canonical partial copy.
14. `packages/cli/src/kernel/assets/manifest.ts` — remove retired keys.
15. `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` — remove retired
    carrier fields.
16. `packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files_test.ts` —
    focused init-preset/source-authority proof (create if absent; otherwise use the existing focused
    writer test and update this plan before implementation).
17. `packages/cli/src/public/features/generate/generate-group.ts` — fourth registration, performed
    only after the init caller has converged in this slice.
18. `packages/cli/src/public/features/root/public-command-tree_test.ts` — exact command/help
    visibility, composed-dependency proof, and generated convention integrity.
19. `packages/cli/src/kernel/assets/embedded.generated.ts` — regenerate after retiring the old
    canonical keys; preserve all unrelated embedded assets.
20. `packages/cli/src/kernel/assets/app/router.ts.template` — remove the init-only manual service
    reference and alias the planner's Fresh-derived generated route.
21. `packages/cli/src/kernel/application/scaffold/writers/app-route-seeds.ts` — retire the
    hand-maintained manifest/routes seed once init invokes the Fresh manifest adapter after all
    routes and sidecars exist.
22. `packages/cli/src/kernel/templates/app/route-templates_test.ts` — replace seed/manual-route
    assertions with Fresh-derived Form-B assertions.
23. `packages/cli/src/kernel/templates/app/app-template-test-support.ts` — remove retired canonical
    asset exports and expose only the neutral planner fixtures plus retained demo-only assets.

If the current example's demo-only hero, notes, authorization, optimistic mutation, or telemetry
still consumes types formerly housed in a retired canonical template, adapt that demo-only caller
inside the files above or split a follow-up slice after updating this plan; do not preserve a second
page/loader/island template to avoid the ceiling.

**Required gates:**

- init writer/app-file tests;
- command-tree/help and composed-dependency tests;
- golden equivalence by canonical role between init preset and `generate resource` output;
- proof that init calls Fresh derivation after route emission and no manual manifest seed remains;
- asset manifest/carrier consistency and no-orphan scan;
- `check:assets-barrel`, `check:publish-assets`, `check:emitted-samples`;
- structured CLI check/lint/fmt;
- CLI JSR audit, publish dry-run, `arch:check`, and `quality:gate`.

### Slice G — consumer guidance and hosted acceptance hook (Refs #1354; partial)

**Landability:** makes the generated-project convention point to the verb and adds the resource step
to the existing scaffold runtime suite. The author lane changes test definitions but does not run
the runtime suite locally.

**File ceiling:** 6.

**Expected touch set:**

1. `packages/cli/e2e/src/domain/cli-surface.ts` — stable first-run and rerun resource gate ids.
2. `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates.ts` — invoke the resource
   verb after init's generated client exists, select the generated list procedure, include
   `--partial`, and assert the rerun's captured output reports only skips.
3. `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates_test.ts` — exact command
   arrays, order, selected client/procedure, partial output, and stdout expectation.
4. `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` — compose the two gates after
   init/service discovery and before generated-project quality/type-check gates.
5. `packages/cli/src/kernel/templates/app/agent-conventions.ts` — point both rendered `AGENTS.md`
   and `WEB-LAYER.md` one-screen guidance to `generate resource` before manual construction.
6. `packages/cli/src/public/features/root/public-command-tree_test.ts` — assert the rendered
   convention text and referenced paths remain valid.

If the existing E2E gate model cannot assert captured stdout without a seventh shared change, stop
and update the plan; do not create a parallel suite or split the runtime command.

**Author-lane gates (no runtime):**

- static E2E definition/unit tests only;
- generated guidance template tests;
- structured CLI check/lint/fmt;
- asset/publish checks, CLI JSR audit, `arch:check`, and `quality:gate`.

**Hosted merge-readiness gate:**

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

The hosted report must include the raw exit code and failing suite/test names, if any. It must prove
client selection, resource generation, generated-project check/lint, identical second run with zero
writes, and cleanup. Hosted runtime/browser proof is attached there; no local lane substitutes a
split command.

## Slice order and concurrency

```text
#1664 merged
    |
    +--> A: shared selector --------+
    |                               |
    +--> B: Fresh manifest seam ----+--> C: contracts/reconcilers --> D: templates
                                                                      |
                                                                      v
                                                               E: unregistered command
                                                                      |
                                                                      v
                                                               F: init convergence + activation
                                                                      |
                                                                      v
                                                               G: hosted acceptance hook
```

- A and B may run in parallel only after #1664 has merged; they touch disjoint files.
- C depends on A's selector contract and B's manifest adapter shape.
- D, E, F, then G are ordered. E remains unregistered; F converges init before activating the public
  command, so no landed state exposes two template authorities. The slices share
  planner/assets/command/init acceptance surfaces.
- Keep work in progress bounded to one shared-file slice and one disjoint leaf slice. The supervisor
  serializes every listed shared file.

## Merge-readiness evidence set

Before the assembled branch is called merge-ready, collect:

1. PLAN-EVAL `PASS` from the separate evaluator.
2. Per-slice focused tests and structured check/lint/fmt evidence.
3. `arch:check` and `quality:gate` after each framework/package slice.
4. Full-export-map doc lint for Fresh and CLI where relevant.
5. JSR audits for both touched packages, `deps:why` for the new dependency, production install, and
   publish dry-run.
6. Asset/carrier, emitted-sample, and MCP export-corpus checks where their inputs change.
7. Raw git diff/status review proving no unrelated run artifacts, lock churn, or #1664-owned
   service-query/add-ui edits.
8. Review-thread gate before final push/merge coordination.
9. The one hosted `scaffold.runtime` run above; no author-lane runtime command.
10. A final acceptance matrix mapping every #1354 checkbox to a test or hosted receipt.

## Explicitly deferred

- Plugin-contributed route/SDK surface inclusion pending its RFC/owner issue.
- A standalone general `generate routes` verb.
- Service-side procedure/resource generation.
- Resource deletion or rollback command.
- Migration of arbitrary customized `router.ts`/`utils.ts` syntax. Unsupported shapes receive
  fail-closed diagnostics and a manual patch description.
- Expansion of the Fresh manifest export beyond functions/types already used by its Vite adapter.
- Changes to #1664's add-ui command/input or service-query template.

## Evaluator challenge checklist

The PLAN-EVAL reviewer should try to falsify, at minimum:

- that the neutral template family truly eliminates two canonical copies;
- that optional flags can be added later without silently overwriting page edits;
- that the all-or-nothing preflight remains true when Fresh manifest generation or router
  reconciliation fails late;
- that #1664's exact ambiguity behavior is shared rather than reproduced;
- that a public Fresh export is smaller/safer than a CLI-side manifest clone;
- that the router property-chain derivation handles parameterized/nested routes without guessing;
- that no selected core option actually requires State;
- that Slice F can remove old canonical assets without swallowing demo-only behavior;
- that every implementation slice is landable under its ceiling and references #1354 only as partial
  work;
- that hosted proof covers the prohibited runtime gates without asking author lanes to run them.
