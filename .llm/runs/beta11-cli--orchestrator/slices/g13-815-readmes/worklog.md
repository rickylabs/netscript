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
