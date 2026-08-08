# fix(docs/sdk): the golden path names three different client modules and two incompatible query APIs, and the file the quickstart points at is a CSS entry — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T5-01 · **Proposed milestone:** 0.0.6 · **Labels:** `type:fix` `area:docs` `area:cli`
`area:sdk` `priority:p0` `status:triage` · **Depends on:** none (coordinate with #1333, #1335)

## Summary

The documented path from a contract to a rendered page names three different modules for the one
data-layer file — `apps/dashboard/client.ts`, `lib/api-clients.ts`, `lib/example-service.ts` — and
only the third is ever written by a generator. The first is the scaffold's CSS hot-reload entry, so
the quickstart's closing instruction sends a first-time reader to a stylesheet. On top of that the
SDK ships two query surfaces with incompatible call signatures (`createQueryFactories` positional,
`createServiceQueryUtils` object-wrapped) and the docs teach both as "the" canonical module without
ever naming the fork. The one flag that bridges service → UI, `netscript service add --with-client`,
appears exactly once site-wide, and when it does run it writes a file whose exported symbols are all
named `exampleService*` regardless of the service. This is the seam the framework's entire pitch
depends on, and it is unfollowable today.

## Evidence

Corpus: `research/repo-audit/docs-quickstart.md` §2.1–§2.4, §3, §4 Tier-1 table;
`research/repo-audit/mcp-cli.md` §4.1; `SYNTHESIS.md` §2 (docs/discovery row), §4 T5.

Verified in the worktree at `origin/main` `fac9e339042c`:

1. `packages/cli/src/kernel/assets/app/client.ts.template` is three lines, all CSS imports
   (`import './assets/styles.css'; import './assets/design.css';`). It contains no client.
2. `docs/site/quickstart.vto:65` documents `client.ts # [owned] contract-derived client instance`
   and `:252` tells the reader to "connect its query loader to the contract-derived client in
   `apps/dashboard/client.ts`". `lib/` appears nowhere in the quickstart tree (`:57-87`).
3. The real module is `apps/<app>/lib/example-service.ts`, written from
   `packages/cli/src/kernel/assets/app/lib/example-service.ts.template` by
   `packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files.ts:66`.
   The template binds `createServiceClient` + `createQueryFactories` + `bridgeInvalidation`.
4. `lib/api-clients.ts` is written by no generator and is cited across 10 published pages:
   `docs/site/index.vto`, `services-sdk/sdk.md`, `web-layer/query.md`, `web-layer/examples.md`,
   `web-layer/interactive.md`, `web-layer/form.md`, `tutorials/storefront/06-storefront-ui.md`,
   `tutorials/live-dashboard/01-scaffold.md`, `.../03-sdk-cache-first-query.md`,
   `.../04-definePage-QueryIsland.md`.
5. Two query APIs: `createQueryFactories` at `packages/sdk/src/query/query-factory.ts:192`
   (positional `queryOptions(input, options?)`, plus the server KV tier) vs
   `createServiceQueryUtils` at `packages/sdk/src/query-client/create-service-query-utils.ts:55`
   (a remap of oRPC `createTanstackQueryUtils`, `queryOptions({ input })`, no KV tier). Dialect A is
   taught at `docs/site/services-sdk/sdk.md:92-115`; dialect B at `docs/site/web-layer/query.md:139-150`
   — both call their module "the spine" / "one module per app".
6. `--with-client` exists at
   `packages/cli/src/public/features/services/add/add-service-command.ts:37` and scaffolds
   `apps/<app>/lib/<service>.ts` via
   `packages/cli/src/kernel/adapters/service/client-scaffolder.ts:9-21,33-56`. It appears in the docs
   exactly once, at `docs/site/reference/cli/commands.md:150`.
7. **New defect found while verifying:** `client-scaffolder.ts:47` renders
   `TEMPLATE_KEYS.appLibExampleService` for *any* service name, so
   `netscript service add orders --with-client` writes `apps/<app>/lib/orders.ts` exporting
   `exampleServiceName`, `exampleServiceClient`, `exampleServiceQueries`,
   `exampleServiceListInvalidation` (template lines 8, 16, 22, 11). The generated symbol names do not
   mention the service and two services collide on meaning, not on file path.
8. Fabricated aliases in the same samples: `@contracts` (`web-layer/query.md:143`,
   `services-sdk/sdk.md:100`, `tutorials/live-dashboard/02-contract-to-service.md:112`,
   `.../03-sdk-cache-first-query.md:55`) and `@/lib/api-clients.ts` (`services-sdk/sdk.md:189,194,199`).
   The scaffold generates only `'@app/' -> './'` and `'@<projectName>/contracts'`
   (`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:62-63,125-130`).

## Current surface

- One generated data-layer module per scaffolded project: `apps/<app>/lib/example-service.ts`, using
  dialect A (`createQueryFactories`), plus `bridgeInvalidation` with a hand-written
  `(routerName, action)` string pair.
- One re-runnable path to a second module: `service add --with-client`, which reuses the same
  template verbatim and therefore emits `example*` symbol names.
- Docs teach three module names and two dialects, with two aliases that do not resolve.
- `packages/sdk/README.md:32` — the JSR landing page (`jsr-package-settings.json:6`
  `readmeSource: "readme"`) — front-loads `createServiceQueryUtils`, i.e. dialect B.

## Target contract

One name, one dialect, ratified in this issue and enforced by T5-02's gate:

1. **Module name — `apps/<app>/lib/<service>.ts`.** Rationale: it is what the CLI already writes
   (`client-scaffolder.ts:19`, `write-example-service-app-files.ts:66`); it is per-service, so a
   second service is a new file rather than a merge-edit into an aggregate; and
   `apps/<app>/client.ts` is unavailable — it is the Fresh CSS entry. `lib/api-clients.ts` is
   retired from the docs (a single aggregate module cannot be generated per-service without
   rewriting an existing file) and its 10 pages are rewritten to the per-service form.
2. **Query dialect — `createQueryFactories` (dialect A) is canonical.** Rationale: it is what the
   scaffold emits, it is the only surface with the server KV tier (`getCachedEntry`, `prefetch`,
   `invalidate`, `key`) that the cache-first loader story on `web-layer/query-bridge.md` depends on,
   and `defineServices()` already returns it. `createServiceQueryUtils` remains public and is
   documented in exactly one place, explicitly labelled as the thin oRPC/TanStack remap with no KV
   tier and a different call shape (`queryOptions({ input })`), with a one-line
   "do not mix" warning. No page outside that one may present it as the app's data-layer spine.
3. **Template naming.** `example-service.ts.template` becomes service-name-derived so
   `service add orders --with-client` emits `ordersClient` / `ordersQueries` /
   `ordersListInvalidation`, and the scaffolded default keeps working because its service name is
   substituted the same way.
4. **Discoverability.** `--with-client` is documented on the golden path: `quickstart.vto`,
   `cli-reference.md`, `services-sdk/how-to/add-a-service.md`, and `how-to/index.md`.
5. **Aliases.** Every sample uses `@app/lib/<service>.ts` and `@<project>/contracts` — the two
   aliases the scaffold actually generates.

## Acceptance

- [ ] Docs name exactly one data-layer module path, `apps/<app>/lib/<service>.ts`.
- [ ] `lib/api-clients.ts` appears in zero published pages.
- [ ] `client.ts` is documented as the CSS entry it is, in the quickstart file tree.
- [ ] The quickstart file tree shows `lib/` and its contents.
- [ ] `createQueryFactories` is the only query dialect taught on the golden path.
- [ ] Exactly one page documents `createServiceQueryUtils`, naming its differing call shape and its
      missing KV tier.
- [ ] `--with-client` is documented in quickstart, cli-reference, and add-a-service.
- [ ] `service add <name> --with-client` emits symbols derived from `<name>`, not `exampleService*`.
- [ ] `@contracts` and `@/lib/...` appear in zero code samples.
- [ ] A CLI test asserts the scaffolded client path and exported symbol names for a non-default
      service name.
- [ ] Negative gate: a docs check fails when `lib/api-clients.ts`, `apps/*/client.ts` as a client, or
      `@contracts` reappears in `docs/site/**`.
- [ ] Negative gate: a docs check fails when `createServiceQueryUtils` appears outside its one
      allow-listed page.

## Boundaries

- **#1333** owns making the default scaffolded app idiomatic and deriving its name from the project.
  This issue does not restructure the default app; it fixes the naming/dialect contract the docs and
  the client template must both honour. Coordinate the chosen module name with #1333 before either
  lands.
- **#1335** owns the repo-wide generated-surface conformance inventory. Do not re-file that
  inventory here; this is one ratified seam, not the sweep.
- **#1208** owns tutorials teaching the page builder (phase 1). Rewriting tutorial prose for the
  page-builder story is theirs; this issue only replaces the module name and query dialect where
  tutorials already cite them.
- **#1210** owns per-API deep dives and the competitive benchmark. No new per-API pages here.
- **#1332** owns DB-schema-first docs; **#1334** owns the home page's capability story. `index.vto`
  is touched here only to fix its uncompilable `lib/api-clients.ts` import.
- **#1260** owns which SDK prose enters the MCP corpus; **#1201** owns the export-surface corpus.
- Not a goal: adding a client/query generator for a second service (that is the T2 pack's
  contract-derived generator), or changing `resolveProjectRoot` (T2 pack).

## Docs/consumer proof

`docs/site/quickstart.vto` reads end-to-end as one dialect: `contract add` → `service add --with-client`
→ `apps/<app>/lib/<service>.ts` → loader → island, with every path in the file tree existing after a
real `netscript init`. `docs/site/index.vto` tab 3 compiles against the published entrypoints under
T5-02's gate. A reader who copies `services-sdk/sdk.md` and `web-layer/query.md` into the same app
gets one query key shape, not two.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from the Stage-B
docs/quickstart and MCP/CLI audits and re-verified against the worktree at `fac9e339042c`; finding 7
(`example*` symbol names from `--with-client`) is new in this pass and is not in the corpus.
