# IMPL-EVAL (delta) — PASS

Delta `85ca65cc4..be6a4d471` = 5 commits, `packages/cli/CHANGELOG.md` only (23+/10−, 3 hunks, all in the 0.0.7 section). All facts verified against `origin/main` (`3a794be67`) code — note the PR head is behind main, so claims were checked via `git show origin/main:…`, which is where the folded merges landed.

## Verified findings (all resolved)

1. **KV template clause — now true.** `packages/cli/src/kernel/assets/plugins/service-context.ts.template` (main) imports `createPluginServiceContext` from `@netscript/plugin/sdk` and `getKv` from `@netscript/kv`, delegating to the host context — matching the reword ("takes its lazy KV from `createPluginServiceContext` … instead of emitting a per-project copy"). `createLazyKv` remains published (`packages/kv/application/lazy-kv.ts:91`, re-exported in `packages/kv/application/mod.ts:27`), so the adjacent claim stays true.
2. **Telemetry resolver — now concrete.** `packages/mcp/src/domain/telemetry-endpoint.ts` — `resolveTelemetryEndpoint` chain is exactly explicit value → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → running AppHost (`aspirePs.readDashboardUrl()`, source `aspire_ps`) → `DEFAULT_TELEMETRY_ENDPOINT`. The changelog parenthetical matches 1:1; the internal `D-17` id is gone.
3. **Skills claim — no longer overstated.** `skills/canonical-tree-references_test.ts` (main) asserts shipped SKILL.md bodies must not reference the derived `.claude/skills/` mirror; the reword ("no longer references the derived `.claude/` mirror and resolves to the canonical `.agents/skills/` tree") states exactly what the guard proves. "Every skill body" claim removed.
4. **TanStack Query phrasing — no longer a pin.** `packages/fresh/tests/query-hydration-version-compat_test.ts` type-checks `src/application/query/hydration.ts` against `['5.101.0', '5.102.8']` via the fixture `packages/fresh/tests/type-fixtures/query-hydration-5.102.8-deno.json`. "Keeps readonly query hydration verified against TanStack Query 5.102.x" is a net-state fact. (The "readonly" adjective is pre-delta, prior-eval-accepted text — out of delta scope.)
5. **#1944 bullet accurate.** `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts` — `getEnvironment`/`getAppsettings` resolvers awaited once at assembly (`Promise.all`, `factory.ts:122-127`), DB via `memoizeAsyncResolver`, KV via `LazyPluginServiceKv`; docstring states the same. Matches "caller-owned async environment and `getAppsettings` resolvers, resolved once at assembly while the DB and KV adapters stay lazy and memoized".
6. **#1942 bullet accurate.** `packages/cli/src/public/features/deploy/target/target-deploy-command.ts` — `emit` verb (line 20) + description (line 32); fail-fast invariant at lines 55–61 errors on `advertisedWithoutRoute`; tests `router routes emit straight to the registry-resolved adapter` and `router exposes every operation advertised by each default target` confirm routing + the omission guard.
7. **#1943 bullet accurate.** `packages/fresh/deno.json:22` maps `./vite` → `src/application/vite/vite.ts`, which re-exports exactly `discoverNetScriptRoutes`, `resolveNetScriptRouteManifestOptions`, `writeNetScriptRouteManifestSync` from `../route/manifest.ts`.
8. **#1948 bullet accurate.** `packages/cli/src/kernel/assets/resource-slice/` exists on main (index.layout/route/index templates, `partials/`, `(_components)`/`(_islands)`/`(_lib)`/`(_shared)`, README declaring the "single neutral asset authority"); `RESOURCE_SLICE_VARIANTS = ['core','form','partial','stream']` (`resource-slice-contract.ts:3-8`); `renderResourceSlice(plan, …)` renders planned leaves — plan-driven per the pure planner, consistent with the README; no references in `packages/cli/src/public` or `commands` → "no command wires it yet" is true (README: "Init does not consume this family until Slice F").

## Format gates

- **Line length:** 0 lines > 100 cols in the whole file.
- **`git diff --check 85ca65cc4..be6a4d471`:** exit 0, clean.
- **No unrelated rewrap:** delta confined to 3 hunks in the 0.0.7 section; all context lines byte-identical.
- **`deno task check:publish-assets` on head `be6a4d471`:** exit 0 (the `msgpackr-extract` nodeModulesDir line is an informational warning; the task completed).

Scratch worktree `/tmp/pr1949-eval` removed; PR and supervisor worktree untouched.
