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

It generates a complete Fresh resource slice from one client resolved by #1664's selector, registers
the route through Fresh-derived bindings, reports `written`/`skipped`, and can be rerun without
changing a byte. Zero clients fails with the client prerequisite; more than one client without
`--client` fails closed rather than auto-picking. A missing procedure, customized shared-file shape,
or unresolved conflicting leaf fails during preflight and writes nothing.

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
- `--route` defaults to `/<resource>` and otherwise accepts a normalized static absolute route.
  #1354 rejects parameterized/catch-all patterns and any segment containing Fresh parameter syntax;
  mapping `/orders/history` is exactly `routes/orders/history/index.tsx`, with its partial at
  `routes/partials/orders/history/summary.tsx`. It is not used to infer a client or procedure.

Client resolution and procedure validation occur before filesystem mutation planning. The command
accepts the sole conventional candidate, but never scans an ambiguous set and silently picks the
first. `--client` is the only disambiguation mechanism; there is no namespace, alias, or fallback
selector.

### D3 — Select options, render candidates, check conflicts, then write

The no-silent-overwrite invariant is implemented in this exact order:

1. parse and validate all flags, select the requested options, and resolve the app/client/procedure;
2. read only marker metadata needed to calculate the effective option set; options are additive, so
   the effective set is the union of recognized prior options and the newly requested flags;
3. render every candidate leaf, shared-source transform, and Fresh-derived output into a staging
   tree; no application target has changed yet;
4. compare the complete candidate plan with current targets and classify every path as `write`,
   `skip`, or an unresolved conflict;
5. build the report for every unresolved conflict and name its available manual action; do not apply
   a per-leaf disposition;
6. for `--dry-run`, emit the complete candidate/conflict report and write no application targets;
   unresolved conflicts exit non-zero;
7. otherwise, unresolved conflicts exit non-zero with the same report and zero writes; a
   conflict-free plan applies the fully preflighted staged candidates and reports deterministic
   `written`/`skipped` paths.

Option selection therefore precedes candidate rendering, candidate rendering precedes conflict
checking, and conflict checking precedes every application write. A pre-existing edited leaf cannot
prevent the command from selecting `--form`, rendering that candidate, producing a dry-run, or
naming the remedy.

#### Ownership marker — exact format

The first line of every owned leaf is exactly one LF-terminated canonical JSON comment:

```text
// @netscript/resource-slice {"schema":1,"resource":"orders","role":"page","options":["core","form"],"bodySha256":"<64-lowercase-hex>"}
```

Keys and key order are fixed as shown; `options` are unique and lexicographically sorted.
`bodySha256` hashes the UTF-8 bytes after the marker line, including their final newline. The marker
is per-leaf provenance, not a sidecar and not an authenticity/security boundary.

- missing, malformed, unsupported-schema, wrong-resource, or wrong-role markers are unowned;
- a valid marker whose body hash matches may be compared with the canonical rendering for its
  recorded schema/options and may take an additive transition;
- a valid marker whose body hash does not match is `owned-edited` — the marker-forgery/hand-edit
  case — and is a conflict, never an automatic replacement;
- a deliberately forged marker with a recomputed matching hash is treated as owned because this is a
  user-safety convention, not a trust boundary; the plan and tests state that limitation.

#### Conflict remedy surface

An unresolved conflict produces a deterministic report, exits non-zero, and writes zero application
targets. For each conflicting path, the report names the available manual move/rename action or
`--force` when, and only when, the leaf is positively generator-owned. An unowned or `owned-edited`
leaf is never replaced, including under `--force`. Force never affects `router.ts`, `utils.ts`,
generated-app composition, another shared source, or input validation.

#### Deferred cross-file atomicity and concurrency

Process-crash/mid-rename cross-file atomicity and concurrent-invocation locking are explicitly
deferred. After full preflight succeeds and apply begins, a process crash between renames can leave
a partially written slice; two concurrent invocations are not serialized. The observable consequence
is a mix of old, new, or absent candidate files. Manual recovery is to rerun the command after the
process exits, or move/rename partial output until preflight succeeds. Closing these correctly
requires journal-store, lock, and backup/restore IO adapters that no declared slice owns; a later
issue must scope those adapters and tests. #1354 promises zero writes for any pre-apply failure, not
crash-atomic multi-file emission or concurrency serialization.

Required proof is:

1. every pre-apply failure leaves the app byte-identical: inject invalid input/client/procedure
   validation, a Fresh staging/writer failure, and a shared-source transform failure as distinct
   cases, each before the first application write;
2. a default unresolved conflict reports every path and its manual move/rename or eligible
   owned-only-force action, exits non-zero, and writes nothing;
3. an identical second run exits 0, reports every selected output as skipped, and writes zero bytes;
4. a later additive option still selects, renders, and dry-runs against an edited base leaf, naming
   manual move/rename as the remedy;
5. a valid marker with a mismatched body hash is `owned-edited`, conflicts, and is never
   automatically replaced or replaced under `--force`;
6. a positively generator-owned divergent leaf is replaced only under explicit `--force`, while all
   unrelated leaves and shared files remain byte-identical; and
7. unmarked/foreign content is unowned, conflicts, and is never replaced, including under `--force`.

### D4 — One neutral template family and one planner are authoritative

The source of truth becomes:

- one neutral asset family under `packages/cli/src/kernel/assets/resource-slice/`; and
- one pure `planResourceSlice()` application service that renders the selected variants and returns
  intended files plus shared edits.

The re-runnable command and the init example writer are two callers of that planner. The existing
service example becomes an init preset whose canonical output is exactly `generate resource` with
`--form --partial` for its fixed resource/client/procedure/route inputs. Convergence removes the
init-only page bindings `withResource('viewer')`, `withPolicy`, `withTelemetry`, the hero and notes
layers, and the viewer-gated `mutate`; none survives through a neutral-template extension point. The
preset cannot retain separate copies of the canonical page, route contract, loader, island,
view/layout, form, or partial templates.

Convergence is mandatory, not a conditional branch. Slice F may register the public command only
after the standing equivalence test proves init and the command render byte-identical canonical
roles from the same planner. If the preset cannot converge within Slice F's declared ceiling, the
slice stops for plan rescope; it may not retain a second canonical copy or activate the command.
Every later canonical-template change reruns that equivalence test.

The `service-query` template is not copied into the resource family. It remains owned by #1664 and
the resource planner consumes its selected generated module/symbol contract. Template keys removed
from the old example family must be removed from the asset manifest in the same slice so an orphan
cannot masquerade as a second authority.

#1355 owns generated app-side client/query factories, cache-key identity, and invalidation behavior;
#1664 is its in-flight delivery. #1354 consumes that output after #1664 merges and emits no parallel
client, cache-key, invalidation, or `service-query` template. A missing #1355 surface is a
prerequisite failure, not scope for this plan.

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
content-compared. They are not parsed as user-owned shared source and are not hand-merged. Missing
`.generated/manifest.ts` or `.generated/routes.ts` is a candidate create; stale generated content is
a candidate replace because the Fresh header declares it derived. A directory, symlink, unrecognized
non-generated file, or unreadable target at either path is a preflight conflict. Fresh writer errors
occur in staging under D3 and therefore before the first application write. Errors after apply
begins fall within D3's explicitly deferred crash/mid-rename scope.

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

Options are additive: omitting a previously recorded `--form`, `--partial`, or `--stream` flag keeps
that option in the effective marker-derived set. No invocation silently removes an option leaf or
shared import. Resource/option removal is deferred; manual deletion or an attempted downgrade is a
conflict with recreate, manual move/rename, or abandon guidance.

### D8 — Keep IO and rendering behind CLI boundaries

- Cliffy definitions and text/JSON output live under `src/public/features/generate/resource/`.
- Normalization, validation, output plan types, content comparison, and source-edit planning are
  pure application code under `src/kernel/application/resource-slice/`.
- Filesystem application and the Fresh manifest bridge are adapters.
- Templates contain no IO and no command parsing.
- Existing filesystem/template/output ports are reused; no `Deno.*` calls enter the application
  layer.
- After #1664 merges, generated-source formatting reuses its
  `kernel/ports/generated-source-formatter-port.ts`, Deno formatter adapter, and
  `application/scaffold/support/format-generated-files.ts`; #1354 does not add a second formatter
  seam.
- Exported Fresh functions receive explicit types/JSDoc and are re-exported only from the existing
  `@netscript/fresh/vite` entrypoint.

The CLI adds `@netscript/fresh` as an explicit package dependency. Implementation evidence uses
`deno task deps:why @netscript/fresh`, full export-map doc lint, production install, and publish
dry-run. No registry curl, reload, or lock deletion is permitted.

### D9 — Serialize every live #1664 overlap

No implementation slice begins until #1664 is merged and the implementation worktree contains its
`--client`, generated-query, formatter, and service-query changes. If it is still open, the run
stops rather than recreating its patch.

The overlap was re-derived on 2026-09-02 and rechecked after live #1664 moved from `7f076f875` to
`5bc900d80`; the intersection remained unchanged except for the Slice-G enumeration defect corrected
below. The ten currently planned source/generated overlaps are:

| #1354 slice | Shared file                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| A           | `packages/cli/src/kernel/application/ui/web-scaffold.ts`                                               |
| A           | `packages/cli/src/kernel/application/ui/web-scaffold_test.ts`                                          |
| D/F         | `packages/cli/src/kernel/assets/embedded.generated.ts`                                                 |
| E           | `packages/cli/src/public/features/root/public-command-dependencies.ts`                                 |
| F           | `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template`        |
| F           | `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template` |
| F           | `packages/cli/src/kernel/templates/app/route-templates_test.ts`                                        |
| G           | `packages/cli/e2e/src/domain/cli-surface.ts`                                                           |
| G           | `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`                                    |
| G           | `packages/cli/e2e/suites/scaffold/capability-suites.ts`                                                |

The mechanically regenerated
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is an eleventh
coordination path once Slice F activates the new CLI surface; it is listed in Slice F and is
freshness evidence only, not the command-option acceptance gate.

At the start of every slice, the supervisor re-runs `gh pr diff 1664 --name-only`, records #1664's
head SHA and the new intersection with that slice's expected touch set in `worklog.md`, and stops if
the list moved. This live head-plus-intersection record — not a cached list and not #1664's own test
set — is the serialization authority.

Slice A extracts the pure matcher into the additive
`packages/cli/src/kernel/application/resource-slice/client-selector.ts`; it imports neither UI nor
presentation. `web-scaffold.ts` consumes it so `ui:add --query` retains #1664 behavior. The
post-merge #1664 `web-scaffold_test.ts` cases are regression evidence and remain behaviorally
unchanged; new `client-selector_test.ts` cases are #1354-owned extension evidence for the extracted
zero/one/many and explicit-match contract. The two test sets are complementary, not a claim that
#1664 already tests a file it cannot contain.

The add-ui command/input and `service-query.ts.template` remain untouched. Slice F carries #1664's
`initialDataUpdatedAt` behavior into the neutral island before retiring the old copies. No #1354
worker edits an overlap concurrently with #1664; a base missing the recorded merged changes is a
hard stop.

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
| template manifest/carrier        | CLI package-generated registry             | add/remove keys in the same preflighted template-family plan            | asset consistency gate rejects drift                          |
| #1664 service-query template     | #1664                                      | consume selected output only                                            | no #1354 edits                                                |

## Open-decision sweep

| Decision                                   | Disposition                              | Resolution / owner                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New command vs `ui:add` mode               | **Resolved now**                         | D1: new `generate resource`; `ui:add --query` keeps #1664 behavior.                                                                                            |
| App/client ambiguity                       | **Resolved now**                         | D2: exact #1664 selector; sole candidate accepted, ambiguous candidates fail closed, `--client` is the only selector.                                          |
| Procedure identity                         | **Resolved now**                         | Required `--procedure`, validated before candidate rendering.                                                                                                  |
| Rerun ordering and conflict handling       | **Resolved now**                         | D3: option selection → candidate render → conflict check → write; dry-run reports conflicts, followed by manual move/rename or owned-only force.               |
| Ownership and marker-forgery behavior      | **Resolved now**                         | D3 pins the first-line JSON marker/body hash and classifies a mismatched hash as `owned-edited`.                                                               |
| Process-crash/mid-rename atomicity         | **Safe to defer**                        | D3 promises zero writes only before apply; a crash can leave a partial slice. Manual recovery is rerun or move/rename; a later issue must own the IO adapters. |
| Concurrent-invocation locking              | **Safe to defer**                        | Invocations are not serialized. A later issue must scope a lock adapter and race tests.                                                                        |
| Sidecar vs inline contract                 | **Resolved now**                         | D5: sidecar Form B only.                                                                                                                                       |
| Manifest derivation                        | **Resolved now**                         | D5: Fresh public writer; no CLI clone; missing/stale derived outputs have explicit dispositions.                                                               |
| Template authority / D4 convergence branch | **Resolved now**                         | One neutral planner; Slice F cannot activate the command unless the standing init/command equivalence gate passes. Failure requires rescope, never two copies. |
| State mutation                             | **Resolved now**                         | No speculative state; bounded conditional transform.                                                                                                           |
| #1664 moving overlap                       | **Must resolve now at each slice start** | D9: live re-diff, recorded head/intersection, then serialize or stop. No cached list is authoritative.                                                         |
| #1355 client/query ownership               | **Resolved now**                         | #1354 consumes #1355/#1664 output and does not own cache keys, invalidation, client generation, or `service-query`.                                            |
| Fresh/CLI doc-lint baseline                | **Must resolve now before Slice B**      | Capture before JSON at the post-#1664 base; compare after reports by diagnostic identity; zero new diagnostics.                                                |
| `deno.lock` result                         | **Must resolve now in Slice B**          | The slice owns a reviewed dependency-only delta if Deno changes the lock; no assumption of zero movement.                                                      |
| Root/package task additions                | **Resolved now**                         | None. All cited commands are existing root `deno.json` tasks; no slice adds a root or `packages/cli/deno.json` task.                                           |
| Plugin-contributed frontend surfaces       | **Safe to defer**                        | RFC/owner issue remains outside core #1354.                                                                                                                    |
| General-purpose `generate routes`          | **Safe to defer**                        | Only resource-registration needs are included.                                                                                                                 |
| Arbitrary AST/custom router support        | **Safe to defer**                        | Recognized shapes or fail closed with manual guidance.                                                                                                         |
| Resource/option deletion                   | **Safe to defer**                        | Options are additive; no destructive remove verb in this issue.                                                                                                |
| Runtime/browser implementation             | **Safe to defer to hosted lane**         | Repository-standard hosted `scaffold.runtime` proof; prohibited locally.                                                                                       |

All must-resolve-now items have a named pre-slice stop condition and owner. No open decision may
change the core command contract during implementation; a new rework-forcing decision returns to
PLAN-EVAL.

## Risk register

| Risk                                                           | Consequence                                                                | Mitigation / gate                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| #1664 changes again before merge                               | stale overlap list, lost selector/cache-age/formatter work                 | D9 live re-diff at every slice start; record head/intersection; hard stop on movement       |
| option selection is performed after conflict checking          | later `--form`/`--partial`/`--stream` cannot produce a candidate or remedy | D3 pins selection → render → conflict → write; dry-run test on edited base                  |
| ownership marker is copied onto edited bytes                   | hand edit is mistaken for generator output                                 | exact marker/body hash; `owned-edited` conflict; fifth proof case                           |
| process crash occurs between application renames               | mix of old, new, or absent candidate files                                 | **Deferred:** rerun or move/rename partial output; a later issue owns journal/backup IO     |
| two invocations race                                           | one preflight invalidates the other's assumptions                          | **Deferred:** not serialized; avoid concurrent runs until a later issue owns a lock adapter |
| init and command templates diverge                             | frozen example and rerunnable verb teach different architecture            | one planner; standing byte-equivalence gate; Slice F cannot activate on failure             |
| Slice D/F exceeds 18/32 files                                  | hidden scope expansion or retained duplicate assets                        | hard file ceilings; stop and rescope before touching an unlisted file                       |
| Fresh public exports add slow types/docs debt                  | publish regression                                                         | before/after doc-lint JSON, jsr-audit, `deps:prod-install`, `publish:dry-run`               |
| `@netscript/fresh` dependency changes `deno.lock` unexpectedly | unexplained dependency churn                                               | Slice B owns and reviews only the resolved dependency delta; reject unrelated lock changes  |
| command options are "proved" by MCP export corpus              | false green because corpus follows exports, not Cliffy help/options        | parser/command-tree and E2E domain tests are acceptance; corpus check is freshness only     |
| customized `router.ts`/`utils.ts` is outside recognized shapes | destructive or incorrect shared edit                                       | fail closed before apply; force cannot replace shared source; manual remedy reported        |
| hosted runtime is first place static gate wiring is discovered | slow feedback and leaked resources                                         | Slice G runs local static gate-id/suite-composition tests only; runtime remains hosted      |

## Gate-set selection

The selected set follows Archetype 6 plus the frontend/scaffold surface. Every cited `deno task`
name below exists in the root `deno.json`; this plan adds no root or package-level tasks.

- **Per-slice static:** focused tests plus structured check/lint/fmt wrappers for owned TypeScript.
- **Doctrine/quality:** `deno task quality:gate` (including `arch:check`) for framework slices; an
  explicit `deno task arch:check` may be recorded where a slice gate calls it independently.
- **Fresh/CLI public surface:** the post-#1664 implementation base captures:

  ```text
  deno task doc:lint --root packages/fresh --output .llm/runs/feat-cli-resource-slice--1354/reports/doc-lint-fresh-before.json
  deno task doc:lint --root packages/cli --output .llm/runs/feat-cli-resource-slice--1354/reports/doc-lint-cli-before.json
  ```

  Slice B/final validation emits the corresponding `*-after.json` reports with the same commands and
  compares the normalized `(entrypoint, file, code, message)` diagnostic tuples. Zero new
  diagnostics is required; the before/after paths and comparison result are recorded in
  `worklog.md`. The wrapper has no fictional baseline flag.
- **Publish/dependency:** the `jsr-audit` rubric for both packages,
  `deno task deps:why @netscript/fresh`, `deno task deps:prod-install`, and
  `deno task publish:dry-run`, plus the reviewed Slice-B lock diff.
- **Assets/generated artifacts:** `deno task check:assets-barrel`, `deno task check:publish-assets`,
  and `deno task check:emitted-samples`. The existing `deno task check:mcp-export-corpus` only
  proves its generated export corpus is current; it does not prove Cliffy option/help behavior.
- **Command behavior:** focused parser/help and public-command-tree tests plus static E2E gate-id
  and suite-composition tests. These, not the MCP corpus, observe `--client` and conflict options.
- **Runtime/browser:** only the hosted lane runs
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Local author/evaluator lanes
  do not invoke it.

## Slices, ceilings, and gates

File ceilings count created, modified, moved, and deleted files. If a slice exceeds its ceiling or
needs a shared file not listed below, stop and rescope/update the plan before editing. RTK output is
exploratory only; durable merge evidence uses the repository gate wrappers/receipts.

**Generated carrier outputs are ceiling-exempt.** `*.generated.ts` files under `packages/*/src/`
and `.llm/assets/agent-docs/*` are regenerated from tooling at every converged head and never
hand-edited. Regenerating them is a required side effect of moving a public surface (#1929 makes a
stale corpus a hard `quality` failure), not slice scope. A slice's ceiling counts hand-authored
files only; every slice that moves a public surface must still run the carrier cascade and verify
the `check:*` gates after committing.

### Slice A — share #1664's client selector (Refs #1354; partial)

**Landability:** behavior-preserving extraction that can land immediately after #1664. It does not
introduce the resource command.

**Hard prerequisite:** #1664 merged and its selector tests present in the worktree.

**File ceiling:** 4.

**Expected touch set:**

1. `packages/cli/src/kernel/application/resource-slice/client-selector.ts` — pure shared resolver;
   no UI or presentation imports.
2. `packages/cli/src/kernel/application/resource-slice/client-selector_test.ts` — #1354 extension
   cases for exact zero/one/many, explicit zero/duplicate-match, and stable diagnostics.
3. `packages/cli/src/kernel/application/ui/web-scaffold.ts` — consume the resolver; no selection
   behavior changes.
4. `packages/cli/src/kernel/application/ui/web-scaffold_test.ts` — #1664 regression cases remain
   behaviorally unchanged; remove only unit cases transferred verbatim to the extension test.

**Required gates:**

- **regression:** post-merge #1664 web-scaffold cases pass without changed expectations;
- **extension:** new client-selector cases prove extraction and the exact selector matrix;
- structured check/lint/fmt for the four files;
- `deno task arch:check`;
- diff review against #1664 proving unchanged command behavior and no edits to its command/input or
  service-query template.

### Slice B — publish and adapt Fresh manifest derivation (Refs #1354; partial)

**Landability:** a documented Fresh public seam plus a CLI adapter. No command calls it yet.

**File ceiling:** 6.

The ceiling is six because the expected touch set below enumerates exactly six files, including a
reviewed `deno.lock` slot.

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
6. `deno.lock` — owned only if adding the explicit Fresh dependency changes resolution. Review the
   exact dependency-only delta; reject unrelated churn. Do not assume zero movement.

**Required gates:**

- focused Fresh Vite/manifest and CLI adapter tests;
- structured check/lint/fmt for both package roots;
- `deno task deps:why @netscript/fresh`;
- the Gate-set selection's before/after Fresh and CLI doc-lint JSON comparison with zero new
  normalized diagnostics;
- the `jsr-audit` checklist for both packages (export/include configuration, allowed specifiers,
  public docs, slow-type risk, and publish contents);
- `deno task deps:prod-install`;
- `deno task publish:dry-run`;
- `deno task arch:check` and `deno task quality:gate`.

### Slice C — define the resource contract and safe reconciler (Refs #1354; partial)

**Landability:** pure application contracts/planning/reconciliation with fixtures. It does not
register a command or alter init.

**File ceiling:** 10.

**Expected touch set:**

1. `packages/cli/src/kernel/application/resource-slice/resource-slice-contract.ts` — normalized
   input, variants, selected client/procedure, owned-leaf metadata, result union.
2. `packages/cli/src/kernel/application/resource-slice/resource-slice-contract_test.ts` — naming,
   static nested-route-to-file/partial mapping, parameter/catch-all rejection, and variant
   invariants.
3. `packages/cli/src/kernel/application/resource-slice/plan-resource-slice.ts` — pure output plan.
4. `packages/cli/src/kernel/application/resource-slice/plan-resource-slice_test.ts` — always/form/
   partial/stream delta fixtures and forbidden-pattern assertions.
5. `packages/cli/src/kernel/application/resource-slice/reconcile-resource-slice.ts` — absent/exact/
   owned/owned-edited/unowned classification and full-preflight result.
6. `packages/cli/src/kernel/application/resource-slice/reconcile-resource-slice_test.ts` — second
   run, option-before-conflict ordering, default conflict exit, owned-only force, marker forgery,
   and pre-apply zero-write tests.
7. `packages/cli/src/kernel/application/resource-slice/reconcile-app-routes.ts` — bounded
   `appRoutes` transform.
8. `packages/cli/src/kernel/application/resource-slice/reconcile-app-routes_test.ts` — exact,
   insert, conflict, and customized-shape fixtures; the stock post-Slice-F init `router.ts` is the
   required recognized-shape/insert fixture.
9. `packages/cli/src/kernel/application/resource-slice/reconcile-state.ts` — conditional State
   transform.
10. `packages/cli/src/kernel/application/resource-slice/reconcile-state_test.ts` — both supported
    shapes and fail-closed fixtures.

**Required gates:**

- all resource-slice unit tests;
- injected validation and shared-source transform failures proving they occur before the first
  application write;
- negative generated-content scan for `any`, raw `fetch(`, handwritten query-key arrays, and manual
  response `JSON.parse`;
- structured package check/lint/fmt;
- `deno task arch:check` and `deno task quality:gate`.

**Deliberate doctrine observation:** after A+C+D, `application/resource-slice/` has 14 direct
children and `check-doctrine.ts` warns above 12. Record that WARN in Slice C evidence; it is not a
gate failure and the cohesive planner/reconciler/render surface stays together. A fifteenth direct
child requires plan rescope or a named subfolder rather than silently deepening the warning.

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

### Slice E — compose the unregistered command and preflighted apply path (Refs #1354; partial)

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
- injected invalid-input/client/procedure validation, Fresh staging/writer failure, and
  shared-source transform failure tests, each proving the app is byte-identical because failure
  occurs before the first application write;
- `--dry-run`, default non-zero conflict exit, constrained owned-only `--force`, and proof that
  `owned-edited`/unowned leaves remain unchanged even under force;
- structured CLI check/lint/fmt;
- CLI JSR audit, publish dry-run, `arch:check`, and `quality:gate`.

### Slice F — converge init and activate the command (Refs #1354; partial)

**Landability:** removes the divergent canonical copies and their now-unconsumed demo dependents,
makes init emit exactly the planner's `--form --partial` preset, then registers the command as the
second caller of that same authority. It does not extend the neutral template contract and does not
change #1664's service-query template.

**File ceiling:** 33.

The ceiling rises from 24 to 32 solely for the eight newly enumerated retired dependents/orphans.
This remains one Slice F rather than F1/F2 because init convergence, complete manifest/carrier
retirement, byte-equivalence proof, and command activation form one landability boundary; splitting
them would permit an intermediate branch state with an incomplete retire-set or an activated command
before the complete convergence gate.

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
14. `packages/cli/src/kernel/assets/manifest.ts` — remove every retired canonical/dependent key,
    including the eight items added below.
15. `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` — remove retired
    carrier fields for the complete enumerated retire-set.
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
    reference but preserve the `serviceExample` alias, now pointing to the planner's Fresh-derived
    generated route so `routes/examples/index.tsx.template` remains a surviving consumer unchanged.
21. `packages/cli/src/kernel/application/scaffold/writers/app-route-seeds.ts` — retire the
    hand-maintained manifest/routes seed once init invokes the Fresh manifest adapter after all
    routes and sidecars exist.
22. `packages/cli/src/kernel/templates/app/route-templates_test.ts` — replace seed/manual-route
    assertions with Fresh-derived Form-B assertions.
23. `packages/cli/src/kernel/templates/app/app-template-test-support.ts` — remove retired canonical
    asset exports and expose only the neutral planner fixtures plus retained demo-only assets.
24. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` —
    mechanically regenerate after CLI surface activation; freshness artifact only, not option/help
    acceptance evidence.
25. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/lab-panel.tsx.template` —
    retire the real consumer of the retired island and loader.
26. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-panel.tsx.template` —
    retire the DB consumer of the retired loader type.
27. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-panel.memory.tsx.template`
    — retire the memory consumer of the retired loader type.
28. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/page-layout.tsx.template` —
    retire after its only consumer, the old index layout, is retired.
29. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/hero.tsx.template` — retire
    after its only consumer, the old index page, is retired.
30. `packages/cli/src/kernel/assets/app/routes/examples/(_components)/notes-card.tsx.template` —
    retire after its only consumer, the old index page, is retired.
31. `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/authorization.ts.template` —
    retire after its only consumer, the old index page, is retired.
32. `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/optimistic-list-mutation.ts.template`
    — retire after its only consumers, the old showcase islands, are retired.

33. `packages/cli/src/kernel/templates/app/agent-conventions.ts` — **enumeration amendment
    (2026-09-02, supervisor, under the stop-and-amend clause below):** `serviceReferences()`
    points five conventions (`service-route-contract`, `service-island`, `service-shared`,
    `service-form`, `service-authorization`) at retired canonical templates. Re-point each to the
    planner's surviving generated output for the same canonical role, or drop the reference when
    the role no longer has a standalone file; do not add compatibility assets. Slice G still owns
    the one-screen guidance rewording and the new `agent-conventions_test.ts`; F must keep the
    existing `assertAppConventionsResolve` green against the retired set.

The three real type/import consumers are `lab-panel.tsx.template`, `summary-panel.tsx.template`, and
`summary-panel.memory.tsx.template`; they are retired above rather than adapted. The other five
added templates have no surviving consumer after the old page/layout/islands retire and are also
removed. If implementation finds any additional importer or rendered consumer of the enumerated
retire-set, stop and amend the enumeration; do not preserve a second canonical template or add an
extension point to evade the ceiling.

**Required gates:**

- init writer/app-file tests;
- command-tree/help and composed-dependency tests;
- golden equivalence by canonical role between init preset and `generate resource` output;
- proof that init calls Fresh derivation after route emission and no manual manifest seed remains;
- asset manifest/carrier consistency and no-orphan scan;
- `deno task check:assets-barrel`, `deno task check:publish-assets`, and
  `deno task check:emitted-samples`;
- `deno task check:mcp-export-corpus` for generated-corpus freshness only;
- structured CLI check/lint/fmt;
- CLI JSR audit, publish dry-run, `arch:check`, and `quality:gate`.

### Slice G — consumer guidance and hosted acceptance hook (Refs #1354; partial)

**Landability:** makes the generated-project convention point to the verb and adds the resource step
to the existing scaffold runtime suite. The author lane changes test definitions but does not run
the runtime suite locally.

**File ceiling:** 8.

**Expected touch set:**

1. `packages/cli/e2e/src/domain/cli-surface.ts` — stable first-run and rerun resource gate ids.
2. `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates.ts` — invoke the resource
   verb after init's generated client exists, select the generated list procedure, include
   `--partial`, and assert the rerun's captured output reports only skips.
3. `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates_test.ts` — exact command
   arrays, order, selected client/procedure, partial output, and stdout expectation.
4. `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` — compose the two gates after
   init/service discovery and before generated-project quality/type-check gates.
5. `packages/cli/e2e/suites/scaffold/capability-suites.ts` — add both resource gate ids to
   `RUNTIME_GATES`; composition in `scaffold-gates.ts` alone does not make them reachable from
   `scaffold.runtime`.
6. `packages/cli/src/kernel/templates/app/agent-conventions.ts` — point both rendered `AGENTS.md`
   and `WEB-LAYER.md` one-screen guidance to `generate resource` before manual construction.
7. `packages/cli/src/kernel/templates/app/agent-conventions_test.ts` — new file covering the
   rendered convention text and referenced paths. Slice F alone owns the existing
   `public-command-tree_test.ts` regression/registration edit, so no file is double-counted.

8. `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` — **enumeration amendment
   (2026-09-03, supervisor, under the captured-stdout clause below):** once
   `scaffold.resource-rerun` is reachable through `RUNTIME_GATES`, the suite-runner's
   nominal-success fake must emit the rerun gate's expected captured output
   (`Resource slice applied: 0 written, 11 skipped, 0 conflicts.`) instead of empty stdout. Update
   only that fake's stdout; no new helper, no parallel suite.

If captured-stdout assertions or runtime reachability require any file beyond this seven-file set,
stop and update the plan. Do not create a parallel suite or split the runtime command; both resource
ids must be reachable through the existing `RUNTIME_GATES` path.

**Author-lane gates (no runtime):**

- static E2E definition/unit tests only;
- direct `RUNTIME_GATES` membership/reachability assertions plus existing capability-suite and
  suite-registry regression tests; no hosted process is started;
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

- Reintroducing the init-only `viewer` resource, policy, telemetry, hero/notes layers, or
  viewer-gated mutation showcase. Stock init converges exactly to the `--form --partial` planner
  preset in #1354; any later showcase extension needs its own contract and issue rather than a
  neutral-template extension point here.
- Process-crash/mid-rename cross-file atomicity. A crash after apply begins can leave a mix of old,
  new, or absent candidate files; manual recovery is rerun or move/rename of partial output. A later
  issue must scope the journal-store and backup/restore IO adapters needed to close this safely.
- Concurrent-invocation locking. Two invocations are not serialized and can invalidate one another's
  completed preflight; operators must avoid concurrent runs until a later issue scopes a lock
  adapter and race tests.
- #1355/#1664-owned client/query generation, cache-key identity, invalidation behavior, and the
  `service-query` template; #1354 consumes their merged output only.
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
