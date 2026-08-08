# Repo audit — published documentation surface (Quickstart / CLI reference / conceptual pages)

Baseline: worktree `/home/codex/repos/netscript-fable5-remediation-plan`, branch
`plan/fable5-remediation-roadmap`, `origin/main` @ `fac9e339042c`, 2026-08-08. Read-only audit.
All CLI behaviour below was executed against the local source CLI
(`deno run --allow-all packages/cli/bin/netscript.ts …`, prints `Version: 0.0.4`).

---

## 0. Where the docs live

| Surface | Location | Build |
| --- | --- | --- |
| Public docs site | `docs/site/` (Lume 2.5.4) | `docs/site/deno.json` tasks `build` / `verify` / `serve`; `_config.ts:59-63` sets `location = https://rickylabs.github.io/netscript/`, `src: '.'`, `dest: '_site'` |
| Site deploy | `.github/workflows/pages.yml` | build → `check:links` → `check:caveats` → Pages |
| Architecture doctrine | `docs/architecture/doctrine/` | not published |
| Roadmap | `docs/ROADMAP.md` | not published |
| Repo-root prose | `README.md` (350 lines), `CONTRIBUTING.md`, `GOVERNANCE.md`, `SUPPORT.md`, `SECURITY.md` | — |
| Per-package prose | `packages/*/README.md` (30/30 present), `plugins/*/README.md` (6/6 present) | JSR readme source per `jsr-package-settings.json:defaults.readmeSource="readme"` |

There is **no `www/`, `apps/`, or `examples/` directory** in the worktree, although root
`deno.json:3-9` declares `apps/*` and `examples/*` as workspace members. The workspace globs are
dead.

### Page tree (published `docs/site`, `_plan/` excluded — Lume ignores `_`-prefixed dirs)

- Front door: `index.vto`, `why.vto`, `concepts.vto`, `quickstart.vto`, `quickstart/aspire.md`,
  `cli-reference.md`, `glossary.md`, `how-to/index.md`
- Nine "Build" pillars (`_data.ts:82-96`): `web-layer/` (21 pages), `services-sdk/` (7),
  `background-processing/` (7), `durable-workflows/` (6), `ai/` (8), `data-persistence/` (7),
  `identity-access/` (6), `orchestration-runtime/` (12), `observability/` (4)
- `tutorials/` — 5 live tracks (storefront 7ch, workspace 6ch, erp-sync 5ch, live-dashboard 6ch,
  chat 6ch) + `tutorials/eis-chat/*` = 5 `nav_hide` redirect shims to `/tutorials/chat/`
- `explanation/` — 9 pages
- `reference/` — 32 package pages
- `capabilities/` — **16 pages, all of them `layout: layouts/redirect.vto` shims** (legacy IA);
  `capabilities/index.md` redirects to `/`

---

## 1. What exists and works

These are real and verified, and should be preserved in any rewrite:

1. **CLI group inventory is accurate.** `cli-reference.md` and `reference/cli/commands.md` match the
   executed `netscript --help` tree for `agent · config · deploy · init · contract · db · generate ·
   marketplace · plugin · service · ui:add/init/list/update/remove`
   (`packages/cli/src/public/features/root/public-command-tree.ts:51-109`).
2. **`init` flag table is exact.** Every flag in `reference/cli/commands.md:30-47` matches
   `netscript init --help` verbatim, including `--from <preset>`, `--service-port`, `--cache-backend`.
3. **MCP tool surface is exact.** `quickstart.vto:260-271` claims "21 bounded tools in seven task
   families" and lists them; `packages/mcp/src/domain/tool-types.ts:3` `TOOL_NAMES` contains exactly
   those 21 names in the same spelling.
4. **`web-layer/query-bridge.md` is the strongest page on the site.** Its server/client key-tier
   split, the `@netscript/sdk/cache` side-effect-import explanation, and the `clientKey()` falsy-input
   trap are all verified against `packages/sdk/src/query/query-factory.ts:140-155` and
   `packages/sdk/src/ports/query-key.ts:34`. Its raw `fetch` snippets are deliberately the "bare
   Fresh" counter-example, not guidance.
5. **`services-sdk/sdk.md` teaches the correct SDK path** (`createServiceClient` +
   `createQueryFactories`, matching `packages/cli/src/kernel/assets/app/lib/example-service.ts.template`).
6. **Aspire-first ordering is stated everywhere** (`cli-reference.md:18-25`, `quickstart.vto:145-166`,
   `how-to/index.md:19-26`) and matches reality.
7. **Link/anchor hygiene is clean.** `deno task docs:links` → `docs=102 broken-links=0
   broken-anchors=0 orphans=0`. `_config.ts:86` makes the Lume `xref` filter throw on an unknown key,
   so the site build is itself a link checker.
8. **`releaseSpecifier` is derived, not hardcoded** — `docs/site/_data.ts:17,30-33` imports
   `packages/cli/deno.json` and emits `@0.0.4`, so install snippets cannot drift from the release train.
9. **`/api/docs` Scalar claim is true** (`packages/service/src/presets/define-service.ts:17`,
   `packages/service/src/primitives/openapi.ts:13-14,127`).
10. **`useLiveQuery` and `@netscript/sdk/collections`**, both cited as preferred paths in
    `how-to/index.md:36-40`, exist (`packages/fresh/src/application/query/hooks.ts:178`;
    `packages/sdk/deno.json:12`).

---

## 2. Gaps, classified

### 2.1 The quickstart sends the reader to a CSS file for the typed client — **docs/discovery failure** (P0)

`quickstart.vto:65` documents the workspace tree as:

```
│   ├── client.ts                          # [owned] contract-derived client instance
```

and `quickstart.vto:252` closes the "build a feature" loop with:

> you connect its query loader to the contract-derived client in `apps/dashboard/client.ts`

The scaffold's `app/client.ts.template`
(`packages/cli/src/kernel/assets/app/client.ts.template`) is, in full:

```ts
// Import CSS files here for hot module reloading to work.
import './assets/styles.css';
import './assets/design.css';
```

The actual contract-derived client is `apps/<app>/lib/example-service.ts`
(`packages/cli/src/kernel/assets/app/lib/example-service.ts.template`, written by
`packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files.ts:66`). The
`lib/` directory **does not appear anywhere in the quickstart's file tree** (`quickstart.vto:57-87`),
so the single most important owned directory in the vertical slice is invisible on the front door.

### 2.2 Three mutually incompatible names for the one data-layer module — **docs/discovery failure** (P0)

| Name used | Where | Reality |
| --- | --- | --- |
| `apps/dashboard/client.ts` | `quickstart.vto:65,252` | CSS entry (§2.1) |
| `lib/api-clients.ts` | `index.vto:64`; `services-sdk/sdk.md:92,97,189,194,199`; `web-layer/query.md:140,176,226,284`; `web-layer/examples.md:40,69`; `web-layer/interactive.md:85,92`; `web-layer/form.md:112`; `tutorials/storefront/06-storefront-ui.md:127,182,276,338`; `tutorials/live-dashboard/03-sdk-cache-first-query.md:28,54,79,131` | **never emitted by any generator** |
| `lib/example-service.ts` | `web-layer/fresh-ui.md:181`, `web-layer/index.md` | what the CLI actually writes |

`lib/api-clients.ts` is the docs' de-facto convention (17+ citations across the home page, four
pillar pages and two tutorials) and no CLI command creates it. A first-time reader who follows the
front door finds neither of the two names the docs give them.

### 2.3 Two incompatible query APIs are both taught as "the" canonical path — **API/type-system seam** (P0)

The SDK ships two query surfaces with **different call signatures**:

- `createQueryFactories` (`packages/sdk/src/query/query-factory.ts:191`) →
  `queryOptions(input, options?)` positional, key `[resource, action, { input }]`, plus the
  server KV tier (`getCachedEntry`, `prefetch`, `invalidate`, `key`).
- `createServiceQueryUtils` (`packages/sdk/src/query-client/create-service-query-utils.ts:55-64`) —
  a thin remap of oRPC's `createTanstackQueryUtils` → `queryOptions({ input })` object-wrapped, **no
  KV tier at all**.
- `defineServices()` (L3 preset) wraps `createServiceQueryUtils`
  (`packages/sdk/src/presets/define-services.ts:120`) and returns `{ clients, queryFactories,
  queryUtils }`, i.e. both shapes at once.

The docs fork along this seam without ever naming the fork:

- Story A (`services-sdk/sdk.md:97-115`, `web-layer/query-bridge.md`, `index.vto:64`, the scaffold
  template): `createQueryFactories`, `queryOptions({ limit: 20 })`.
- Story B (`web-layer/query.md:140-165,176-185`, `web-layer/examples.md:40,69`,
  `web-layer/interactive.md:85-92`): `createServiceQueryUtils`, `queryOptions({ input: {} })`.

Both pages call their version "the single module" / "one module per app". Copy Story B's
`queryOptions({ input: {…} })` into Story A's factory and the input is silently the object
`{ input: … }` — a wrong query key and a wrong request body, with no type error at the doc level.

### 2.4 `netscript service add --with-client` — the one flag that bridges service→UI is effectively undocumented — **docs/discovery failure** (P0)

`--with-client` scaffolds `apps/<app>/lib/<service>.ts` with the typed client + query factories
(`packages/cli/src/public/features/services/add/add-service-command.ts:37`,
`packages/cli/src/kernel/adapters/service/client-scaffolder.ts:19,45-49`).

It appears **exactly once** in the entire docs site: one table cell in
`reference/cli/commands.md:150`. It is absent from `cli-reference.md`, from
`services-sdk/how-to/add-a-service.md` (326 lines, zero mentions of `--with-client`,
`client.ts`, `createServiceClient`, or `query-loaders`), and from `quickstart.vto`, whose feature
loop runs the bare `netscript service add --name orders` (`quickstart.vto:206`) and then tells the
reader to wire the client by hand against a path that does not exist (§2.1).

### 2.5 `ui:add page --island` generates a counter and an empty object — **scaffold/generation failure** (P0)

`quickstart.vto:243-252` presents `netscript ui:add page orders --island` as the generator that
"supplies a compiling composition and correct file layout" for a data screen, and `ui:add --help`
markets it as "the Fresh page + island + query-loader **triad** for a data screen".

`packages/cli/src/kernel/application/ui/web-scaffold.ts:26-38` actually emits:

- `routes/orders/index.tsx` — `definePage()` with `.withLayer('orders', () => <OrdersIsland/>, () => ({}))`:
  no loader, no route search params, no contract.
- `routes/orders/(_islands)/OrdersIsland.tsx` — `signalIslandTemplate` (line 67-69), i.e. a
  `useSignal(0)` **counter button**. Not a `QueryIsland`.
- `routes/orders/(_shared)/query-loaders.ts` — literally
  `export const queryLoaders = {} as const;`

There is no generated path from contract → typed client → loader → island anywhere in the CLI. The
"canonical vertical slice" the docs promise is 100% hand-written by the reader, and the docs never
say so.

### 2.6 CLI reference facts that are stale against the executed CLI — **docs/discovery failure** (P1)

| Claim | Location | Reality |
| --- | --- | --- |
| "`netscript deploy docker` and `deploy compose` … are not wired — they only print help" | `cli-reference.md:247-250` | Both expose `plan · up · down · status · logs`; implemented by `AspireComposeDeployTarget` (`packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:58,105,124`, 228 lines) |
| Mutation map writes `aspire/appsettings.json` (5 rows) | `cli-reference.md:92,95,96,97,103` | `appsettings.json` is at the **project root** (`packages/cli/src/kernel/constants/scaffold/scaffold-files.ts:8`; `.../services/configure/mutate-service-config.ts:57`; `.../config/project/project-config-command.ts:102`) |
| "Each target below shares the same three-verb lifecycle — `plan`, `up`, `down`" | `reference/cli/commands.md:209-225` | true for kubernetes / azure-* / cloud-run; docker and compose add `status` + `logs` |
| "`deno task check` checks `.ts` files under `apps/`, `services/`, and `contracts/`; type-check generated `.tsx` files directly" + manual `deno check --unstable-kv "…tsx"` workaround | `quickstart.vto:246-250` | The scaffolded runner covers **12 source roots** and `EXTENSIONS = {ts, tsx, mts}` (`packages/cli/src/kernel/templates/workspace/quality-runner.ts:15-30`). The workaround is obsolete. |
| `--help` "lists the public command groups: `agent`, `config`, `contract`, `db`, `deploy`, `generate`, `init`, `marketplace`, `plugin`, `service`, and the `ui:*` family (`ui:list`, `ui:add`, `ui:update`, `ui:remove`)" — used as a verification checkbox | `quickstart.vto:39,176` | `ui:init` is also listed by the real `--help`; the checkbox does not match the output it asks the reader to confirm |
| "The scaffold reports **183 files, 44 directories**" | `README.md:41` | Directly contradicted by `quickstart.vto:51` ("treat the printed result—not a static number in this guide—as the authority"); the counts vary with `--db/--service/--editor` |
| `jsr:@netscript/cli@<version>` literal placeholder | `README.md:35` | The site derives the specifier automatically (`_data.ts:30-33`); the README does not |

Commands with **no documentation anywhere** in `docs/site` (verified by grep):
`netscript agent drift`, `netscript plugin ai`, `netscript plugin scaffold`
(only cross-referenced, never explained as a distinct verb from `plugin new`),
`netscript deploy desktop` (`package`/`release`), `netscript deploy package-cli`,
`netscript deploy list`, `netscript config list`.

### 2.7 Fabricated import aliases in code samples — **docs/discovery failure** (P1)

The scaffold defines exactly two app-level aliases
(`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:62-63,127`):

```
'@app/'                  -> './'
'@<projectName>/contracts' -> '../../contracts/mod.ts'
```

Docs use two aliases that are never generated:

- `@contracts` — `web-layer/query.md:142`, `services-sdk/sdk.md:99`,
  `tutorials/live-dashboard/02-contract-to-service.md`, `.../03-sdk-cache-first-query.md`
- `@/lib/api-clients.ts` — `services-sdk/sdk.md:189,194,199`

`index.vto:64` and `services-sdk/how-to/add-a-service.md` use the correct `@app/` and
`@my-app/contracts` forms, so the site is internally inconsistent as well as wrong.

### 2.8 Nothing in CI validates docs prose against the code — **docs/discovery failure** (P1, structural)

- `.github/workflows/pages.yml:4-10` triggers **only** on `push` to `main` with
  `paths: docs/site/**`. A CLI/SDK change never rebuilds or re-link-checks the site.
- `deno task docs:accuracy` PASSes today. It is a hardcoded-needle checker:
  `requireText`/`forbidText` over a fixed list of 8 preferred paths and 19 mutation-family strings
  (`.llm/tools/docs/check-accuracy-and-discoverability.ts:12-19,152-174`). It asserts that the string
  `` `netscript service add `` appears in `cli-reference.md` — not that anything it says is true. It
  cannot catch §2.1–§2.7.
- `check-exports-drift.ts` (invoked by `docs:accuracy`) is real code-derived verification but covers
  **only 8 reference pages**: `fresh-ui, plugin, config, contracts, queue, sdk, service, telemetry`
  (`.llm/tools/docs/check-exports-drift.ts:17-80`). The other 24 reference pages and all 200+ guide
  pages are unverified.
- The only executed doc examples in the repo are `packages/service/README.md`'s, via
  `packages/service/tests/_fixtures/readme-examples_test.ts` (wired into `coverage:functions` in
  root `deno.json:47`). **No `docs/site` code block is ever compiled or run.**

### 2.9 Reference-tree coverage holes vs the publish gate — **docs/discovery failure** (P2)

`publish-readiness.ts:302-306` requires `docs/site/reference/<segment>/index.md` per publishable
member, where `<segment>` is the part after `@netscript/`
(`.llm/tools/release/publish-readiness.ts:411-415`). Two problems:

1. The gate runs **only for first-publish packages** (`publish-readiness.ts:159-193` → `newPackages`
   → `auditFirstPublish`), so it has never checked the existing tree.
2. The tree does not follow the convention. `@netscript/plugin-sagas` documents at
   `/reference/sagas/` (`docs/site/reference/sagas/index.md:3` `title: "@netscript/plugin-sagas"`),
   not `/reference/plugin-sagas/`. Same for streams/triggers/workers. A first publish under the
   current gate would demand a path the IA does not use.
3. Four **publishable** packages have no reference page at all:
   `@netscript/plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`,
   `plugin-workers-core` (their `deno.json` `publish` key is an object, not `false`; contrast
   `packages/bench/deno.json:33` `"publish": false` which correctly has no page). `plugin-ai-core`
   and `plugin-auth-core` do have pages, so the omission is inconsistent, not policy.

### 2.10 README staleness — **docs/discovery failure** (P2)

All 36 package/plugin READMEs exist. 21 of 30 `packages/*/README.md` and 4 of 6
`plugins/*/README.md` have not been touched since a single bulk commit on **2026-07-18** — including
`packages/sdk/README.md` (2026-07-18 21:17), the package at the centre of §2.3. `packages/sdk/README.md:32`
still front-loads `createServiceQueryUtils` as the TanStack story while the scaffold and
`services-sdk/sdk.md` front-load `createQueryFactories`, so the fork of §2.3 is mirrored on JSR
(`jsr-package-settings.json` sets `readmeSource: "readme"`, so this README **is** the JSR landing page).

Root `README.md` last touched 2026-08-04 (`595726075`); its specific defects are in §2.6.

### 2.11 Port-and-URL messaging is not consistent — **docs/discovery failure** (P2)

`quickstart.vto:141` states categorically "There is no application or service port to memorise";
`init --help` warns that `--service-port` "weakens `aspire start --isolated`". Yet
`cli-reference.md:20-21`, `how-to/index.md:22`, and `tutorials/live-dashboard/01-scaffold.md:212`
give the dashboard as a literal `:18888`, and `tutorials/live-dashboard/01-scaffold.md:70` pins
`--service-port 3002`. The `identity-access/*` pages hardcode `http://localhost:8094`
(6 occurrences) — that one is legitimate (`plugins/auth/src/constants.ts:13`
`AUTH_API_DEFAULT_PORT = 8094`), but nothing on the page says why it is exempt from the "ports are
dynamic" rule. Commit `595726075` was already a "fixed-port prose sweep after randomized scaffold
ports"; these are its survivors.

### 2.12 Not a framework gap — **product-expectation outside framework scope**

- Windows guidance in `quickstart.vto:311` is explicitly labelled source-derived and unexecuted.
  That disclosure is correct behaviour, not a defect.
- The `capabilities/` redirect shims and `tutorials/eis-chat/` shims are deliberate URL preservation
  (`docs/site/_plan/10-nav-ia-redesign.md:80`). Leave them.

---

## 3. The golden path (`init → scaffold → plugins → db → run`), completeness verdict

| Step | Documented | Verdict |
| --- | --- | --- |
| Install CLI | `quickstart.vto:18-39` | Complete and correct (incl. the `--minimum-dependency-age=0` release-day trap) |
| `init` | `quickstart.vto:41-51` | Correct commands; **file tree is wrong** (§2.1) |
| `agent init` | `quickstart.vto:91-97` | Correct |
| Aspire start | `quickstart.vto:121-143` | Best-in-class: covers TTY vs non-TTY, `aspire describe --format Json`, MCP `list_api_services`, and explicitly warns off `get_app_status`/`doctor` |
| db init/generate/seed | `quickstart.vto:145-166` | Correct and correctly ordered |
| Verify | `quickstart.vto:168-188` | Good, one checkbox mismatches real `--help` (§2.6) |
| **contract → service → handler** | `quickstart.vto:199-212` | Correct commands, but stops at a `Not implemented` throw |
| **service → typed client** | — | **MISSING** (§2.4). No page on the golden path names `--with-client` or `lib/example-service.ts` |
| **client → page/island** | `quickstart.vto:240-252` | **BROKEN** (§2.1, §2.5). Points at a CSS file; the generator emits a counter and `{}` |
| plugins | `quickstart.vto:254` | One sentence (`plugin install worker --name workers`) — correct, thin |
| Agent/MCP surface | `quickstart.vto:256-272` | Accurate (§1.3) |

**Net: the golden path breaks exactly at the seam the framework's whole pitch depends on** — the
step from a compiling handler stub to a typed page reading it. Steps 1-6 are executable; steps 7-9
are not.

**What a first-time agent or human cannot discover from the docs at all:**

1. That `netscript service add --with-client` exists (§2.4).
2. Which of the two SDK query APIs to use, or that there are two (§2.3).
3. Where the scaffolded typed client actually lives (§2.1, §2.2).
4. That `ui:add page --island` produces a counter and an empty loader, not a data screen (§2.5).
5. `agent drift`, `plugin ai`, `deploy desktop`, `deploy package-cli`, `config list`, `deploy list` (§2.6).
6. That `deploy docker`/`compose` are wired (docs say the opposite) (§2.6).

**Where docs teach service-direct calls instead of the SDK path:** almost nowhere, and this is a
strength. The only raw `fetch` against a service URL is `web-layer/query-bridge.md:33,47`, which is
an explicit "what bare Fresh makes you write" counter-example. `identity-access/auth.md:166` drives
the auth REST surface by `fetch` against a hardcoded `localhost:8094`, which is defensible (auth
sign-in is a browser redirect flow, not an RPC), but it is presented without that justification.
The real problem is the inverse: the SDK path is taught in **two contradictory dialects** (§2.3) and
anchored on a file that does not exist (§2.2).

---

## 4. Pages requiring rewrite for a "canonical vertical slice" story

Tier 1 — must be rewritten; they are the slice:

| Page | Why |
| --- | --- |
| `docs/site/quickstart.vto` | §2.1 (tree + `client.ts`), §2.4 (`--with-client`), §2.5 (`ui:add` overclaim), §2.6 (`deno task check` workaround, `--help` checkbox). Needs a real contract→client→loader→island section. |
| `docs/site/index.vto` | Tab 3 (`:64`) imports `@app/lib/api-clients.ts`, a file no generator writes (§2.2). The home page's single code proof of the thesis is uncompilable. |
| `docs/site/cli-reference.md` | §2.6 rows 1-2 (docker/compose "not wired", 5× `aspire/appsettings.json`); missing `--with-client` in the services table. |
| `docs/site/services-sdk/sdk.md` | Canonical dialect A source; must declare the A-vs-B rule (§2.3) and drop the `@/` alias (§2.7). |
| `docs/site/services-sdk/how-to/add-a-service.md` | 326 lines that never reach a client or a page; the recipe that most obviously should end in the slice. |
| `docs/site/web-layer/query.md` | Dialect B (`:140-165`); its `lib/api-clients.ts` module is the canonical-looking one and is the wrong API. |
| `docs/site/web-layer/examples.md` | Dialect B (`:40,69`), sold as "the shortest path from a contract to a rendered island". |
| `docs/site/web-layer/interactive.md` | Dialect B (`:85,92`). |
| `docs/site/web-layer/form.md` | Dialect B import (`:112`). |

Tier 2 — must be reconciled once the slice is fixed:

| Page | Why |
| --- | --- |
| `docs/site/reference/cli/commands.md` | Add `agent drift`, `plugin ai`, `deploy desktop`/`package-cli`/`list`, `config list`; fix the "three verbs" claim (§2.6). |
| `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` | Hand-builds `lib/api-clients.ts`; must either use `--with-client` or say why it is hand-written. |
| `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md` | The closest thing to a canonical slice today — promote or align. |
| `docs/site/tutorials/live-dashboard/01-scaffold.md` | Pins `--service-port 3002` and `:18888` against the dynamic-port doctrine (§2.11). |
| `docs/site/tutorials/storefront/06-storefront-ui.md` | 4× `lib/api-clients.ts` (§2.2). |
| `docs/site/tutorials/live-dashboard/02-contract-to-service.md` | `@contracts` alias (§2.7). |
| `docs/site/web-layer/query-bridge.md` | Accurate today, but its `ordersQueryUtils` naming must match whichever module name wins. |
| `docs/site/concepts.vto` | §4 asserts "A server page can call the contract-derived SDK, hydrate TanStack Query state" — true of the framework, false of anything the CLI generates (§2.5). |
| `docs/site/how-to/index.md` | Preferred-paths table should name the client module and `--with-client`. |
| `README.md` | §2.6 (183/44 counts, `<version>` placeholder); add the client/page hop to "One contract, four moves". |
| `packages/sdk/README.md` | §2.10 — this is the JSR landing page and it leads with dialect B. |
| `docs/site/reference/plugin-sagas-core|plugin-streams-core|plugin-triggers-core|plugin-workers-core/index.md` | Do not exist (§2.9). |

Tier 3 — tooling, not prose:

- `.llm/tools/docs/check-accuracy-and-discoverability.ts` — replace needle-matching with
  code-derived assertions (scaffold-emitted paths, `--help` group list, alias map).
- `.llm/tools/docs/check-exports-drift.ts` — extend from 8 to all 32 reference pages.
- `.github/workflows/pages.yml` — add `packages/**` to the trigger paths, or add a docs job to
  `ci.yml`, so a CLI change re-validates the site.
- Add a docs code-block compile gate on the model of
  `packages/service/tests/_fixtures/readme-examples_test.ts`.
