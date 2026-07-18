# G13/B1 — Batch B1 flagship READMEs (#815)

Lane: Claude · Fable 5 · high. Branch: `docs/815-package-readmes` @ main 56cf84b5.
Packages: fresh, fresh-ui, sdk, service, cli, aspire (mcp excluded — PR #858).

## Stop-lines (verbatim from brief)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (release:cut, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

## Inputs read
- Issue #815 full body (10-point standard) — live GitHub API.
- `.llm/harness/workflow/doc-audit.md` — Sol audit gate set; writing for executed evidence.
- Exemplar: `packages/mcp/README.md` @ origin/docs/814-mcp-readme (section order: tagline → intro → Why → Architecture(mermaid) → Install → Quick example → API tables → Docs → Compatibility → License; no emoji headers).

## Executed evidence log
(appended as work proceeds)

### Executed evidence (all commands run in this session, 2026-07-18)

**API tables from `deno doc`** — symbol lists collected per entrypoint for all six packages
(`.llm/tmp/readme-g13/*-doc.txt`); every "API at a glance" row sourced from that output, not memory.
Notably: fresh-ui `./interactive` now exports `Combobox` (added to README); service root exports
verified to include `defineService` + `createService`.

**Examples executed (exit 0, output observed):**
- fresh: `.llm/tmp/readme-g13/fresh-ex.ts` — `bindRoutePattern` + `definePage().withRoute().build()`;
  observed page keys `[page, default, handler, nav, route, hooks]` and route `href`/`safeParseSearch`/`Link` (quoted in README).
- fresh-ui: `fresh-ui-ex.ts` — `cn`, `withToast`, `getToast` (title round-trips), `stripToastFromUrl` → `/dashboard/deployments`.
- sdk: `sdk-ex.ts` — `defineServices({orders:{contract}})` yields `clients/queries/queryUtils.orders`;
  queryUtils keys `key, options, infiniteKey, infiniteOptions, mutationKey, mutationOptions` (quoted);
  `getServiceUrl('orders')` resolves from `services__orders__http__0` env.
- service: `service-ex.ts` — `defineService(router,{name:'users',port:3801,...})` started listener,
  `GET /health` returned `status: "healthy"`, `stop()` logged graceful shutdown.
- aspire: `aspire-ex.ts` — `parseAppSettings(tests/_fixtures/appsettings.json)` → `config.Name === 'test-app'`, 0 warnings.
- cli: `deno run -A --unstable-kv packages/cli/bin/netscript.ts --help` (full command tree, v0.0.1-beta.10) and
  `init my-app --db postgres --service --yes --dry-run` in scratchpad → "Would create 183 files, 44 directories", exit 0
  (console transcript quoted in README).

**Install-form accuracy (executed):**
- `deno add jsr:@netscript/sdk` (bare) FAILS: "has only pre-release versions available". Issue #815 item 6's
  unversioned canonical form is therefore inaccurate on the current pre-release line; followed the approved
  mcp exemplar instead: `deno add jsr:@netscript/<pkg>@<version>` + one-line pinning note. DRIFT recorded here.
- `deno add jsr:@netscript/sdk@0.0.1-beta.10` succeeds. 24h min-dep-age wall bites; sanctioned equivalent used:
  `deno add` rejects a `--minimum-dependency-age` flag in this Deno build, so the protocol-identical config form
  `"minimumDependencyAge":"0"` in deno.json was used; install then resolved and pinned `jsr:@netscript/sdk@0.0.1-beta.10`.

**sdk `./auto-update` / `./desktop`:** verified ABSENT from packages/sdk/deno.json exports on this branch
(main@56cf84b5) — NOT mentioned in the README, per brief. Shipped beta.10 surface only.

**Links:** all 18 docs-site URLs referenced across the six READMEs curl-verified HTTP 200 (plus jsr.io badge/doc links per existing convention).

### Gate log (self-run before handoff; Sol audit re-executes)

| Gate | Command | Scope | Result |
| --- | --- | --- | --- |
| README standard | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts <6 files> --pretty` | six touched READMEs | PASS (6/6 conform) |
| Tagline cap | `.llm/tools/validation/check-jsr-tagline-length.ts <6 files> --pretty` | six touched READMEs | PASS (checked=6 over=0) |
| docs:links | `deno task docs:links` | whole doc tree | PASS (docs=98, 0 broken links/anchors) |
| Internal wording | `grep -nEi 'harness|archetype|doctrine|#[0-9]{3}|eis-chat|VIF|CSB|evaluator|worklog|slice' <6 files>` | six touched READMEs | PASS (0 hits; removed the former sdk "#402 telemetry convention" mention) |
| fmt | `deno fmt <6 files>` | six touched READMEs | applied/clean |
| Publish assets | jsr-package-settings.json inspected — descriptions are derived from README taglines at publish by `.llm/tools/release/jsr-set-package-settings.ts`; no static file embeds README content, nothing to regenerate | — | N/A (verified) |

Baseline note: no path arguments beyond the six were gated; repo-wide `docs:readme:check` still has
pre-existing failures in untouched packages (out of B1 scope; later batches).

## Fix cycle 1 (post Sol audit FAIL — audit-b1.md), 2026-07-18

Same generator session resumed per doc-audit profile. All fixes executed in this worktree/branch.

### F1 — re-baseline + desktop/auto-update union
- `git merge origin/main` (a87570a6, Desktop Frontend wave). Three README conflicts
  (cli/fresh/sdk) resolved by UNION: restructured B1 pages kept as base, ALL main-side desktop
  content folded in (none of the stale side kept).
- Re-ran `deno doc` on the merged tree: `@netscript/fresh/desktop` (bindDesktopRpcWindow …),
  `@netscript/fresh-ui/desktop` (createDesktopChrome …), `@netscript/sdk/auto-update`
  (startAutoUpdate, createReleaseClient …), `@netscript/sdk/desktop` (createDesktopServiceClient,
  createDesktopRpcLink …); export maps re-read from merged deno.json files.
- Coverage added: fresh (Why bullet + Desktop RPC composition example + ./desktop row), fresh-ui
  (Why bullet + ./desktop row — fresh-ui/desktop was absent even from main's README), sdk (2 Why
  bullets + Desktop RPC bindings + Desktop auto-update sections + ./auto-update and ./desktop rows),
  cli (Why bullet + desktop row in command map/deploy table + Native desktop packaging section with
  package/release prepare/serve). `netscript deploy desktop --help` and `deploy desktop release
  --help` executed on the merged tree (both exit 0, subcommands observed). Internal refs from
  main-side prose (issue numbers) NOT carried over.

### F2 — CLI quick-start re-executed end-to-end (fresh scaffold, exit 0 each)
- `init my-app --db postgres --service --yes` → 183 files; `db migrate` → "completed successfully";
  `service add --name orders` → service on port 3001; `plugin install worker --name workers` →
  worker plugin on port 8091. README commands corrected to the executed forms
  (`service add --name orders`, `plugin install worker --name workers`).

### F3 — Aspire examples re-run from the fresh scaffold root
- `parseAppSettings('appsettings.json')` → Name "my-app", 0 warnings; `inspectAspire('./aspire')`
  → summary rendered. README paths updated to workspace-root appsettings.json + `aspire/` AppHost.

### F4 — cache claims corrected from source + scaffold output
- Observed scaffold default: `Engine: "Redis", Mode: "Container"` (generated appsettings.json).
- Schema default `Garnet`/`Container` (packages/aspire/config.ts CacheEntryZod defaults).
- Engine×Mode matrix rewritten per CACHE_ENGINE_MODE_MATRIX (config.ts): Redis
  Container/External/Auto; Garnet Container/Executable/External/Auto; DenoKv Local/Container/Auto.
  "any + External" and "Garnet/Auto scaffold default" claims removed. NETSCRIPT_CACHE_MODE
  verified in shouldUseContainerCache (generated apphost helper source).

### F5 — README doctests green
- Re-added the defineService `auth: { … }` preset fence (service) and a JSON import-map fence (sdk).
- Executed: `packages/sdk deno test tests/readme-doctest_test.ts` → 2 passed 0 failed (all ts fences
  typecheck under the doctest prelude, incl. the new desktop/auto-update fences; JSON fences parse);
  `packages/service deno test tests/_fixtures/readme-examples_test.ts` → 2 passed 0 failed.

### F6 — CLI Architecture diagram added
- Compact verbs → workspace → derived-wiring regeneration + deploy-router → target-adapters
  flowchart; parsed with @mermaid-js/mermaid-cli@10.9.1 (exit 0).

### Fix-cycle gate log (all re-run after fixes)
| Gate | Result |
| --- | --- |
| check-readme-standard (6 files) | PASS 6/6 |
| check-jsr-tagline-length (6 files) | PASS checked=6 over=0 |
| deno task docs:links | PASS docs=98, 0 broken |
| README doctests (sdk + service) | PASS 2+2, 0 failed |
| Mermaid parse (6 diagrams incl. new CLI) | PASS 6/6 (mermaid-cli 10.9.1) |
| Internal-wording grep (6 files) | PASS 0 hits |
| deno fmt (6 files) | clean |

## Batch B2 — plugin family (13 READMEs), 2026-07-18

Generator: Claude · Fable 5 (refresh class per #815 lane rule). Worktree
`/home/codex/repos/wt-g13-815`, branch `docs/815-package-readmes`, re-baselined first:
`git fetch origin main && git merge origin/main` → "Already up to date" (base 20758eb6).

Scope: `plugins/{ai,auth,sagas,streams,triggers,workers}`, `packages/plugin`,
`packages/plugin-{ai,auth,sagas,streams,triggers,workers}-core`. All 13 rewritten to the B1/#815
flagship shape (exemplar `packages/mcp/README.md`): tagline ≤250B → intro → Why bullets →
Architecture (mermaid where warranted) → Install → Quick example → Public surface → Docs →
Compatibility → License.

### Executed-command evidence (accuracy law)
- Fresh scaffold from published beta.10: `jsr:@netscript/cli@0.0.1-beta.10 init b2app --db postgres
  --yes` → exit 0. Then ALL SIX installs executed in it (each exit 0, output quoted in READMEs):
  `plugin install worker --name workers` (port 8091, 4 files), `saga --name sagas` (8092, 4),
  `trigger --name triggers` (8093, 5), `stream --name streams` (4437, 2), `auth --name auth`
  (8094, 1), `ai --name ai` (8095, 7 files incl. `ai/mcp/registry.ts` — README table updated to the
  observed 7-file set). Confirmed `plugin add` does NOT exist on the beta.10 CLI (`plugin --help`:
  the verb is `install <kind>` with required `--name`) — all B2 READMEs corrected from the stale
  `plugin add` forms (truthful-usage rule from #802).
- Standalone plugin CLI verbs executed against published beta.10 packages: workers `list-jobs`
  ("Found 0 worker jobs."), triggers `list` ("Found 0 trigger definitions."), streams `list-topics`
  ("0 stream topic(s) discovered."), sagas `inspect` (graceful offline degradation:
  `runtimeError: "fetch failed"`, local source scan) — outputs quoted verbatim in the Quick
  examples.
- DRIFT NOTE (transient env): `deno x` could not run the freshly REPUBLISHED beta.10 packages —
  the 24h minimum-dependency-age wall blocks them and `deno x` does not honor
  `--minimum-dependency-age` (the deno-x child-process limitation already tracked from the release
  fixes). Verbs were executed via the identical entrypoint with
  `deno run -A --minimum-dependency-age=0 jsr:@netscript/plugin-<x>@0.0.1-beta.10/cli <verb>`;
  READMEs print the canonical `deno x -A jsr:@netscript/plugin-<x>@<version>/cli <verb>` form,
  which is what users get once the wall lapses (<24h). Same wall blocked `netscript plugin ai
  --help` (child `deno x`), so no `plugin ai add …` command is printed anywhere — add-only
  resources are described via the typechecked `collectInstallArtifacts`/`resources` library
  snippet instead.
- Link fix: `durable-streams/` (linked from the old streams READMEs) is 404 on the live site;
  replaced with `capabilities/streams/` (200). All 24 docs-site URLs used across the 13 READMEs
  curl-verified 200.

### API accuracy
- `deno doc <pkg>/mod.ts` run for all 13 packages; Public-surface tables and symbol claims sourced
  from those lists + each `deno.json` exports map. Stale claims removed: plugins/ai "`--mcp` not
  included" (the beta.10 CLI ships `--mcp` and scaffolds `ai/mcp/registry.ts` by default);
  internal process vocabulary stripped (parity-checklist/verify-harness prose, issue-number refs,
  tier labels).
- Every `ts` fence typechecked in-package (extract → `deno check --unstable-kv`): 13/13 PASS.
  Four inherited fences were broken against the current tree and were fixed: streams topic
  validator (Standard Schema `Result` shape), sagas-core runtime registration (mirrors the repo's
  own `as SagaDefinition` widening; typed-DSL fence split from runtime fence), triggers-core
  webhook (async handler + declared port adapters; was relying on undeclared free identifiers),
  ai-core router (partial `router.router({chat})` never typechecked — replaced with the canonical
  full `createAiRouter` implementation from the package's own module doc).

### Gate log (Batch B2)
| Gate | Command | Result |
| --- | --- | --- |
| readme-standard (13 files) | `.llm/tools/validation/check-readme-standard.ts <13> --pretty` | PASS 13/13 conform |
| tagline cap | `.llm/tools/validation/check-jsr-tagline-length.ts <13> --pretty` | PASS checked=13 over=0 |
| docs:links | `deno task docs:links` | PASS docs=98, 0 broken |
| ts-fence typecheck | per-package extract + `deno check --unstable-kv` | PASS 13/13 |
| Mermaid parse | mermaid-cli 10.9.1 over all 11 diagrams | PASS 11/11 (streams-core, ai-core: no diagram — contract/utility) |
| Internal-wording grep | issue-number/process-vocab patterns over 13 files | PASS 0 hits |
| deno fmt | `deno fmt --check <13>` | PASS (clean after fmt) |
| check:publish-assets | `deno task check:publish-assets` | PASS exit 0 (no embedded-README drift) |
| check:assets-barrel | `deno task check:assets-barrel` | PASS exit 0 |

### B2 fix cycle 1 (post Sol audit FAIL — audit-b2.md), 2026-07-18

Same generator session resumed per doc-audit profile.

- **F1 (Streams transcript):** root cause — my original `list-topics` execution ran from the
  scratch parent dir, not the scaffold root; the audit is right that the install scaffolds a
  default notifications stream. Re-executed
  `deno run -A --minimum-dependency-age=0 jsr:@netscript/plugin-streams@0.0.1-beta.10/cli
  list-topics` from the SAME installed scaffold root (b2app): observed
  `1 stream topic(s) discovered.` with `/v1/streams/notifications/events`
  (`notifications-producer`, `streams/notifications-stream.ts`). Transcript replaced with that
  verbatim output and the intro sentence updated ("the install scaffolds a default notifications
  stream, so discovery finds it immediately").
- **F2 (bare deno add):** all 13 library install fences pinned to
  `deno add jsr:@netscript/<pkg>@<version>` (B1/MCP approved deviation); the adjacent pinning note
  normalized to the B1/MCP wording ("Pin `<version>` to match your installed CLI; …"). Corrected
  versionless scan (version checked in the token suffix after `jsr:@netscript/`): 0 bare pinnable
  specifiers remain across the 13 files.

Fix-cycle gate log (all re-run after fixes):
| Gate | Result |
| --- | --- |
| readme-standard (13) | PASS 13/13 |
| tagline cap | PASS checked=13 over=0 |
| deno task docs:links | PASS docs=98, 0 broken |
| ts-fence typecheck (touched file: plugins/streams) | PASS |
| versionless-specifier scan (13 files) | PASS 0 bare |
| internal-wording grep (13 files) | PASS 0 hits |
| deno fmt --check (13) | PASS |

## Batch B3B4

Generator: Claude · Fable 5 (refresh class), 2026-07-18. Scope: data/state family
(`packages/{database,kv,queue,cron,prisma-adapter-mysql,watchers}`) + auth family
(`packages/{auth-better-auth,auth-kv-oauth,auth-workos}`) — 9 READMEs reworked from the old
emoji-sectioned Quick Start shape to the B1/B2 flagship standard (tagline → intro → "Why teams use
it" → Architecture where warranted → pinned Install + note → Quick example → Public surface table →
Docs → Compatibility → License). First action: `git fetch origin main && git merge origin/main` —
already up to date (no baseline drift).

### Authoring decisions
- Mermaid only for real moving parts: kv (provider auto-detect → adapters → WatchableKv), queue
  (auto-discovery → backends → DLQ), watchers (strategy → filter pipeline), auth-kv-oauth (PKCE
  flow → crypto → KV store). database/cron/prisma-adapter-mysql/auth-better-auth/auth-workos:
  no diagram (contract/adapter packages). All 4 diagrams parse under mermaid-cli 11.16.0.
- Install forms pinned to `deno add jsr:@netscript/<pkg>@<version>` + the B1/MCP pinning note;
  npm/bun `npx jsr add` forms dropped per the exemplar. 0 bare pinnable specifiers (scan below).
- Public-surface tables sourced from `deno doc --unstable-kv <pkg>/mod.ts` + each `deno.json`
  exports map, not memory.

### API accuracy — corrections over the inherited text
- **auth-workos (inherited fence never typechecked):** the old example passed a raw
  `new WorkOS(...)` to `createWorkosBackend`, which fails TS2322 — `WorkosBackendOptions.workos`
  is the structural `WorkosSessionClient` port, and the repo's own wiring
  (`plugins/auth/services/src/backend-registry.ts:164-179`) adapts the SDK via
  `createWorkosCookieSession`. Fence rewritten to declare `WorkosSessionClient` + `ServiceRouter`;
  Compatibility prose corrected (package consumes the port; the auth plugin adapts
  `@workos-inc/node`).
- **kv:** documented `CACHE_PROVIDER` forcing and the reserved-not-implemented `'nitro'` provider
  id (source: `packages/kv/application/shared.ts:238-241`, `auto-detect.ts:124`).
- **cron:** documented that `node`/`temporal` provider ids are reserved and throw
  (`packages/cron/mod.ts:114-125`); Compatibility states `Deno.cron` sits behind `--unstable-cron`
  (verified: `deno eval "typeof Deno.cron"` → undefined without flag, function with it) and that
  auto-detection then falls back to the memory adapter.
- **queue:** auto-discovery order verified in source (`factory/create-queue.ts detectProvider`):
  RabbitMQ → Redis → Deno KV; PostgreSQL is explicit-pin only (kept as a backend, not in the
  discovery sentence).
- **database:** `./adapters/mysql` documented as riding `@netscript/prisma-adapter-mysql`
  (verified in `adapters/mysql.adapter.ts:17`); generated-client import in the example replaced
  with a structural `declare` (the `./generated/client/mod.ts` path is app-owned and cannot
  typecheck in-repo; `@prisma/client` exports no generated `PrismaClient` type).
- Free-identifier fences from the old READMEs (`sendWelcomeEmail`, `generateDailyReport`,
  `prisma`, `request`, `router`) made self-contained with one-line `declare`s.

### Executed examples
- Fences requiring no external infra were **run**, not just typechecked, from each package dir:
  - kv: set/get printed `Alice`; `watch` yielded `set ["users","alice"] {...}`; exit 0
    (watch-terminating run variant; declares stubbed).
  - cron: memory-adapter path printed `report generated` twice (runOnInit + trigger); exit 0.
  - watchers: fence run **verbatim**; creating `incoming/test.csv` yielded
    `create: .../incoming/test.csv`; exit 0.
  - queue: Deno KV fallback enqueue→listen printed `sent to user@example.com : Welcome to
    NetScript.`; exit 0.
- DB/auth fences need real backends (Postgres/MySQL, better-auth schema, OAuth app, WorkOS
  account): prerequisites stated explicitly above each fence; fences typecheck.

### Gate log (Batch B3B4)
| Gate | Command | Result |
| --- | --- | --- |
| readme-standard (9 files) | `check-readme-standard.ts <9> --pretty` | PASS 9/9 conform |
| tagline cap | `check-jsr-tagline-length.ts <9> --pretty` | PASS checked=9 over=0 |
| docs:links | `deno task docs:links` | PASS docs=98, 0 broken |
| ts-fence typecheck | per-package extract + `deno check --unstable-kv` | PASS 9/9 (10 fences) |
| executed examples | kv/cron/watchers/queue run transcripts above | PASS 4/4 exit 0 |
| Mermaid parse | mermaid-cli 11.16.0 over 4 diagrams | PASS 4/4 |
| Links curl-verified | 18 docs-site + 9 JSR /doc + 3 external URLs | PASS all 200 (better-auth.com 307→200 fixed to apex) |
| Internal-wording grep | issue-number/process-vocab patterns over 9 files | PASS 0 hits |
| versionless-specifier scan | bare `jsr:@netscript/*` over 9 files | PASS 0 bare |
| deno fmt --check (9) | after `deno fmt` | PASS |
| check:publish-assets | `deno task check:publish-assets` | PASS exit 0 |

Commits: 4d4babe8 (B3 data/state), 4f98aadf (B4 auth).

## Batch B5

Generator: Claude · Fable 5 (refresh class), 2026-07-18. Scope: platform/core family
(`packages/{config,contracts,runtime-config,logger,telemetry,ai,bench}`) — 7 READMEs brought to the
B1/MCP flagship standard — plus the closing cross-README consistency pass over the full set. First
action: `git fetch origin main && git merge origin/main` — already up to date (no baseline drift).

### Authoring decisions
- Section order locked to the exemplar: tagline → intro → Why teams use it → Architecture (moving
  parts only) → pinned Install + note → Quick example → Public surface → Docs → Compatibility →
  License.
- Mermaid only for real moving parts: runtime-config (versioned dir → loader → snapshot →
  watchFs reload loop), telemetry (ports → Deno-native/SDK adapters → OTLP → query read model),
  ai (composition root → registries ← self-registering provider subpaths; MCP pool → tool
  registry). config/contracts/logger: no diagram (loader/contract/utility packages, matching the
  B3 database/cron precedent). bench keeps its plain-text src/ tree.
- **bench is internal-only** (`"publish": false` in `packages/bench/deno.json`): standard applied
  minus JSR-specific items — no JSR/CI badges, no `deno add jsr:` install form or pinning note, no
  JSR doc links; kept H1 + tagline + Why + Quick example + Docs + Compatibility + License.
  Consequently bench is EXCLUDED from the readme-standard gate (a publishable-unit gate whose
  Install check requires the literal `deno add jsr:@netscript/`) and INCLUDED in the tagline,
  internal-wording, versionless-specifier, and fmt sweeps. Its old README carried internal
  vocabulary (issue number, slice/OQ decision labels, model pricing provenance) — rewritten out
  while preserving the substance (gating decision, rubric reserve, pinned-manifest confound).
- Install fences pinned `deno add jsr:@netscript/<pkg>@<version>` + canonical pinning note.
  contracts/ai quick examples import Zod via the resolvable pinned form `jsr:@zod/zod@4` (a bare
  `zod` specifier would not resolve in a consumer project; noted under contracts' Install).
- telemetry: removed the internal issue-number label from the attribute-convention section and the
  repo-relative `docs/site/...` convention link (dead on JSR); both now point at the public
  convention page. The Deno-version claim states Deno 2+ with `OTEL_DENO=true` for the default
  provider.
- ai: restructured from a 465-line feature tour to the standard shape (~250 lines) with badges,
  Why, Architecture, pinned install, executed quick example, provider/agent-loop/MCP sections, and
  a full subpath table. Corrected over the inherited text: the agent-loop fence imported `Message`
  from `./agent`, which does not export it — now imported from `@netscript/ai/contracts`; the
  provider fence called `provider.createChatClient(...)` directly, which fails strict TS (TS2722,
  the port method is optional) — now `createChatClient?.(...)`.
- runtime-config: `watchRuntimeConfig` callback must return `Promise<void>` (TS2345 with a sync
  callback) — fence uses an async callback.

### Executed examples (all run in-session, exit 0, output observed)
- config: defineConfig fence run — printed `orders postgres 3000`; `inspectConfig` variant printed
  the report summary. (`initConfig()` itself needs a project `netscript.config.ts`; the loader
  fence typechecks and its claims match the executed defineConfig output.)
- contracts: fence run verbatim — `OffsetPaginationQuerySchema.parse({ limit: '25' })` printed
  `{ limit: 25, offset: 0 }` (coercion + defaults claim observed).
- runtime-config: loader run with no runtime dir — `isFeatureEnabled(...,true)` → `true`, missing
  job override → undefined, `summarizeRuntimeConfig` printed the loaded-from message
  (empty-default startup claim observed).
- logger: fence run verbatim — printed `INF netscript·services·users Service starting` and the
  `withContext` record (category-hierarchy claim quoted in README from this output).
- telemetry: fence run — `withSpan` over `createInMemorySpanRecorder()` printed
  `42 job.import erp-sync` (comment in fence quotes this output).
- ai: fence run verbatim — `registry.dispatch('add', { a: 2, b: 3 })` printed `{ sum: 5 }`.
- bench: `deno task cli self --fake` run from packages/bench — scored summary table for both tasks
  (composite 0.793, fake-driver flag) — exit 0, matching the Quick example's description.

### Gate log (Batch B5)
| Gate | Command | Result |
| --- | --- | --- |
| readme-standard (6 publishable) | `check-readme-standard.ts <6> --pretty` | PASS 6/6 conform (bench excluded: publish:false) |
| tagline cap | `check-jsr-tagline-length.ts <7> --pretty` | PASS checked=7 over=0 (telemetry trimmed from 255 B) |
| docs:links | `deno task docs:links` | PASS docs=98, 0 broken |
| ts-fence typecheck | per-package extract + `deno check --unstable-kv` (consumer-context config for config/contracts app-code fences, which are exempt from the workspace isolatedDeclarations flag) | PASS 11/11 fences |
| executed examples | 7/7 transcripts above | PASS exit 0 |
| Mermaid parse | mermaid-cli 11.16.0 over 3 new diagrams | PASS 3/3 |
| Links curl-verified | 12 docs-site + 6 JSR /doc + 4 external URLs | PASS all 200 |
| Internal-wording grep | issue-number/process-vocab patterns over 7 files | PASS 0 hits |
| versionless-specifier scan | bare `jsr:@netscript/*` over 7 files | PASS 0 bare |
| deno fmt --check (7) | after `deno fmt` | PASS |
| check:publish-assets | `deno task check:publish-assets` | PASS exit 0 |

### Cross-README consistency pass (all 36 pages: 35 published + bench)

**Method.** Scripted structural sweep (`.llm/tmp/readme-g13-b5/sweep.ts`) over every
`packages/*/README.md` + `plugins/*/README.md`: H1/badges/tagline presence, required-section
presence and order (Install < Quick example < Docs < Compatibility < License), canonical
pinning-note wording, pinned install form, license/provenance line wording. Plus targeted greps
for contradicting sibling claims: backend discovery orders, provider lists and self-registration
claims, Deno-version statements, `## Why` heading variants, `always-current symbol list` and
`API docs on JSR` coverage. Full-set gates re-run at the end.

**Findings and fixes:**
1. **Pinning-note drift (6 B1 pages)** — aspire/cli/fresh/fresh-ui/sdk/service used
   ``Pin `<version>` (for example `0.0.1-beta.10`): …`` while the other 29 used the canonical
   B1-fix/MCP wording. Normalized the 5 library pages to
   ``Pin `<version>` to match your installed CLI; …``; the CLI page gets the semantically correct
   variant ``Pin `<version>` to the release you want to install; …`` (the CLI cannot pin to
   itself) — deliberate, recorded here. Page-specific trailing sentences preserved.
2. **`## Why` heading variants** — 6 B1 pages used "Why it stands out" vs 27 "Why teams use it".
   Normalized the 6 to "Why teams use it" (now 33). Kept the audience-fit variants: mcp
   "Why agents like it" (locked exemplar), packages/plugin "Why authors use it", bench
   "Why it exists" (internal instrument).
3. **cli Docs section** — only published page without an "API docs on JSR" line; added
   (jsr.io/@netscript/cli/doc curl-verified 200).
4. **No contradictions found** in: queue discovery order (RabbitMQ → Redis → Deno KV stated only
   on the queue page; no sibling restates it), kv redis self-registration (ai README's mirror
   claim matches kv's), provider lists, license/provenance lines (uniform), install forms
   (0 bare specifiers across 36). Observed, judged non-contradictory: example model ids differ
   across ai pages (`anthropic:claude-sonnet-4-5` vs plugin-ai-core's `anthropic:claude-sonnet-4`)
   — both are illustrative registry ids, left as authored (changing an executed B2 fence for
   cosmetics was not worth the re-verification cost); Deno-version phrasing varies with each
   package's real constraint (2+, 2.x, 2.9+ for mcp, unstable-kv for kv) — accurate per package,
   not normalized.

**Full-set gate log (after fixes):**
| Gate | Result |
| --- | --- |
| readme-standard (35 published) | PASS 35/35 conform |
| tagline cap (36) | PASS checked=36 over=0 |
| internal-wording grep (36) | PASS 0 hits |
| versionless-specifier scan (36) | PASS 0 bare |
| deno fmt --check (36) | PASS (cli README is in the repo fmt exclude list, as before) |
| docs:links | PASS docs=98, 0 broken |
| check:publish-assets | PASS exit 0 |

Commits: per-package ×7 (433fe781…9cc4c325) + consistency-pass commit.
