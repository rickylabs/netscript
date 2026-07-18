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
