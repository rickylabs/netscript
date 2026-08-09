# tutsweep-p2 — findings (#1208 phase 2)

Sweep of all tutorial tracks under `docs/site/tutorials/` after the phase-1 page-builder rewrite
(PR #1209: storefront ch.6, chat ch.3, live-dashboard ch.4).

Tracks swept: storefront (7 ch), chat (6 ch), live-dashboard (6 ch), workspace (6 ch),
erp-sync (5 ch), eis-chat (redirect stubs), plus `tutorials/index.md` and every track index.

Baselines before any edit — all green: `docs/site` `deno task build` exit 0 (595 files);
`check:links` 30576/214 all resolve; `check:caveats` 27/22 all resolve; root `docs:links`
docs=102 0 broken; root `docs:accuracy` PASS.

---

## FIX — in scope, narrative already supports it

### F1 · `definePage` imported from the wrong module in all three rewritten chapters

Severity: high — this is the pattern the MCP will teach.

All three phase-1 chapters wrote `import { definePage } from '@netscript/fresh/builders';`. A
scaffolded NetScript app — which every tutorial chapter 1 creates with `netscript init` — re-exports
a **`State`-typed** `definePage()` from `@app/utils.ts`, and that is what the CLI's own generated
routes import. Verified in `packages/cli/src/kernel/assets/embedded.generated.ts`: 15 occurrences of
`import { definePage } from '@app/utils.ts';` in generated route templates, and exactly one import of
`@netscript/fresh/builders` — inside the generated `utils.ts` itself
(`import { definePage as createDefinePage } from '@netscript/fresh/builders'; …
export function definePage() { return createDefinePage<State>(); }`). Asserted by
`packages/cli/src/kernel/templates/app/route-templates_test.ts:83-107`.

The rest of `docs/site` already teaches the correct import (`web-layer/fresh-ui.md:177`,
`web-layer/how-to/customize-fresh-ui.md:141,146`), and `live-dashboard/01-scaffold.md:131` already
imports `State` from `@app/utils.ts` — so live-dashboard ch.4 contradicted its own chapter 1.

### F2 · `getCachedEntry` cold-cache return value documented wrong

`live-dashboard/03-sdk-cache-first-query.md` stated twice (apiTable row + "Why KV" callout) that a
cold cache returns `undefined`. Source returns **`null`** —
`packages/sdk/src/ports/query-factory.ts:71`, `packages/sdk/src/query/query-factory.ts:132`. The
apiTable's `.key(input?)` row also marked the input optional; the signature is `key: (props) => …`.

### F3 · Port ranges and "conventional assignment" claims invalidated by `0b11ca47a` (#1211)

Severity: high. #1211 landed the same day, ~90 minutes *after* the phase-1 rewrite:

| range | documented | actual now |
| --- | --- | --- |
| SERVICE | 3000–3099 | 49152–53247 |
| APP | 8000–8099 | 53248–57343 |
| PLUGIN_API | 8091–8099 | 57344–61439 |
| INFRA_PLUGIN | 4400–4499 | 61440–65535 |

Worse than the numbers: `packages/cli/src/kernel/adapters/plugin/scaffolder.ts` now calls
`allocateScaffoldDefaultPort(projectName, resourceKey, usedPorts)`
(`packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts`) — an FNV-1a hash of the
project name over 49152–65535. Plugin and app ports are therefore per-project and unpredictable:
`workers :8091`, `sagas :8092`, `triggers :8093`, Fresh app `:8010`, streams `:4437` are no longer
what any workspace lands on.

Ports that ARE still correct, because the reader pins them: `:3001` / `:3002`
(`--service-port`, validated against `USER_PORT_RANGE` 1024–65535) and workspace `:8094`
(`export PORT=8094` in workspace ch.2).

### F4 · `tutorials/index.md` undercounted the storefront track

Said "6 chapters"; the track has 7, and `storefront/index.md:12,78` says "seven chapters".

### F5 · live-dashboard ch.5 dropped back to a hand-rolled loader one chapter after teaching `withResource`

`05-live-stream.md` defined a free function `sagasStreamSeedLoader()` in `(_shared)/stream-loaders.ts`
and never showed the page that mounts `SagasLiveIsland` ("renders wherever you mount
`SagasLiveIsland`"). Chapter 4 had just established `definePage` + `.withResource` + `.withLayer` as
the way to seed an island, and ch.5 explicitly says the island sits in a `QueryIsland` "exactly like
chapter 4's orders island".

### F6 · Scaffold chapters listed an incomplete `netscript --help` group set

`live-dashboard/01-scaffold.md` and `workspace/01-scaffold.md` omitted `agent` and `config`
(`packages/cli/src/public/features/root/public-command-tree.ts:51-99` registers agent, config,
deploy, init, contract, db, generate, marketplace, plugin, service, ui:add, ui:init).

---

## DEFER

### D1 · Full narrative re-authoring around allocated ports (dedicated follow-up, not #1210)

This slice corrected every **false claim** and replaced hardcoded unpinned ports with
resource-list lookups. What remains is deeper: several chapters were structured around a fixed
plugin port as a teaching device, and the ideal end state is a documented one-liner that resolves an
endpoint (env var or CLI) rather than `<workers-endpoint>` placeholders. That is a #1211-driven docs
slice of its own.

### D2 · storefront overrides the CLI's own `--service-port` guidance silently

`packages/cli/src/public/features/init/init-command.ts:76-79` documents `--service-port` as pinning
that "weakens `aspire start --isolated`" and recommends omitting it. The storefront track pins 3001
in ch.1 and depends on it through ch.7 without surfacing the tradeoff. Self-consistent and
deliberate — a track-wide narrative decision, not a defect.

### D3 · erp-sync and workspace demonstrate no page builder at all → #1210

Neither track builds a Fresh page: erp-sync is jobs/tasks/triggers, workspace is service routes and
authz. `workspace/05-route-authz.md` was checked specifically — its `createService(…).route('get', …)`
+ `.withAuthn()`/`.withAuthz()` is a **service** route, not a Fresh page, and `definePage` has no
equivalent for it (assertions match `packages/service/tests/auth/builder-auth_test.ts:44-63`
byte-for-byte). Giving these tracks page-builder coverage is new content, not a consistency fix.

### D4 · `ns-workers` / `ns-triggers` CLI verbs unverifiable in this worktree

Those verbs come from the published `@netscript/plugin-workers` / `@netscript/plugin-triggers`
wrappers, not vendored here (only the `-core` packages are). Additionally
`docs/site/reference/workers/index.md` (~85-95) lists `AddJobCommand` / `RunJobCommand` /
`LogsCommand` but no `TriggerCommand` / `ExecutionsCommand`, while docs use those verbs repeatedly.
Flagged as unverified, not broken.

---

## NO ACTION — checked and correct

- **No dangling `(_shared)/query-loaders.ts` reference.** The only hit,
  `web-layer/how-to/customize-fresh-ui.md:128`, describes `ui:add page --island` scaffolder output
  that `packages/cli/src/kernel/application/ui/web-scaffold.ts` still emits.
- **No hand-rolled Fresh page routes left.** The remaining `export const handler = { POST }` blocks
  (`chat/02:100-119`, `chat/04:76-91`) are JSON/streaming API endpoints, not pages.
- **`eis-chat/*.md` are intentional redirect shims** (`layout: layouts/redirect.vto`,
  `nav_hide: true`), documented in `docs/site/_plan/10-nav-ia-redesign.md`.
- **All links resolve**, including every intra-track link and the `cap:streams` /
  `cap:fresh-framework` xref keys.
- **Every builder/route/query/SDK symbol used by the rewritten chapters exists**: `withRoute`,
  `withRouteContract`, `withResource`, `withLayer`, `withLayout`, `withPolicy`, `withTelemetry`,
  `withMeta`, `build`; `createRouteReference`, `defineRouteContract`, `bindRoutePattern`,
  `paginationSearchSchema`, `fallback`; `QueryIsland`, `useIslandQuery`, `useIslandMutation`,
  `useQuery`, `useMutation`, `useLiveQuery`, `useQueryClient`, `getIslandQueryClient`,
  `hydrateFromDehydrated`, `dehydrateQueryClient`; `createServiceClient`,
  `createServiceQueryUtils`, `createQueryFactories`, `createNetScriptQueryClient`. Per-procedure
  `.key()`, `.queryOptions()`, `.mutationOptions()`, `.clientKey()`, `.getCachedEntry()` confirmed
  against `packages/sdk/src/ports/{service-query-utils,query-factory}.ts`.
- **CLI flags verified**: `netscript init --service --service-name --service-port --db --no-aspire
  --dry-run`, `netscript contract add-route --method --path --input --output --version`,
  `netscript plugin install <kind> --name --samples`, `netscript db add|init|generate|status`,
  `netscript generate plugins`, `netscript ui:add` — all match current `packages/cli` source.
- **Checklists match the commands shown**, chapter by chapter, across all six tracks.
