# Research — feat-aspire-kv-connect-provisioner--371-372

Issues #371 (shared Deno KV Connect resource) + #372 (Garnet-as-executable, Docker-less bare
metal) — the two arms of one environment-aware shared-cache/queue provisioner in the Aspire
generator. Child of #327; feeds #349 (unified↔multi-process switch); sibling of #364.

## Re-baseline

- Carried-in source: issue specs #371/#372 (rickylabs/netscript, 2026-06) + eis-chat POC
  (rickylabs/eis-chat#133) + historical C# `rickylabs/netscript-start@49065681e`
  `dotnet/.generated/Resources.g.cs`.
- Re-derived against `main` @ `bd03e51d` (2026-07-03, post 0.0.1-beta.1).
- What changed vs the carried-in claims:
  - #371 says the generator "emits a no-op comment" for a `DenoKv` engine. **False on current
    main**: `DenoKv` does not exist anywhere in the cache config vocabulary. `CacheEngine` is
    `'Redis' | 'Garnet'` only (`packages/aspire/config.ts:60`). The contract slice *introduces*
    the engine, it does not un-no-op it.
  - #372 asks for `.config/dotnet-tools.json` + `dotnet tool restore` self-provisioning. The
    Aspire TS SDK 13.4.4 has **native `builder.addDotnetTool(name, packageId)`** with
    `withToolVersion` / `withArgs` / `withEndpoint` / `getEndpoint` / `waitFor` /
    `withEnvironment` — SDK-managed tool provisioning supersedes the hand-rolled manifest.
  - The redis-import gap ("bare workers/runtime.ts does not self-register") was an alpha.19-era
    observation. On current main, `plugins/workers/bin/runtime.ts:2` has
    `import '@netscript/kv/redis'` and the plugin-service template conditionally emits it when
    `provider.defaultRequiresKv` (generate-plugin-service.ts:29-32). Verify per generated
    entrypoint during impl; likely already closed.

## Findings

| #  | Finding | How to verify |
| -- | ------- | ------------- |
| 1  | Cache registration lives in `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`: `External` → `addConnectionString`; else `addContainer(name, image)` + `.withEndpoint({name:'tcp', targetPort:6379, scheme:'tcp'})` + optional bind mount; stores `caches` + `cacheEndpoints` maps | file, lines 99-135 |
| 2  | `CacheEntry` (`packages/aspire/config.ts:200-212, 439-448`): `Engine: 'Redis'\|'Garnet'`, `Mode: 'Container'\|'External'`, `ImageTag?`, `Port?`, `DataPath?`. No DenoKv, no Executable/Local/Auto, no token/tool-version seam | file |
| 3  | RequiresKv consumers get `withReference(infrastructure.primaryCacheEndpoint \|\| infrastructure.primaryCache)` + `waitFor(infrastructure.primaryCache)` in `generate-register-plugins.ts:113-124`, `generate-register-background.ts:124-135`, `generate-register-apps.ts:82-89`. No explicit cache env vars are injected today; SDK endpoint reference emits `services__<resourceName>__<endpointName>__0` | files |
| 4  | `workspace-mutator.ts:218-242 ensureSharedCache(projectRoot, cacheKey='garnet')`: `plugin add` (KV-queue plugins) force-writes `Cache.garnet={Engine:'Garnet',Mode:'Container'}` + `PrimaryCache=garnet`. Today's multi-process default = Docker-required Garnet container; env detection works only because the resource is literally named `garnet` | file |
| 5  | `@netscript/kv` `getDenoKvConnectionFromEnv()` (`packages/kv/application/shared.ts:100`) precedence: `services__kv__http__0` → `services__kv__sqlite__0` → `KV_URL` → `DENO_KV_URL`. It never reads `DENO_KV_ACCESS_TOKEN`; `Deno.openKv(url)` picks the token up from env natively | file |
| 6  | Redis/Garnet auto-detect (`packages/kv/application/auto-detect.ts:50,123`): `CACHE_PROVIDER` override, then `REDIS_URI`/`GARNET_URI` → `ConnectionStrings__redis/garnet` → `services__redis/garnet__tcp__0` etc. Unregistered-adapter throw at `shared.ts:221-226` ("Add `import '@netscript/kv/redis';`") | files |
| 7  | `@netscript/queue` `create-queue.ts`: `isKvConnect()` (http/https KV path) swaps native DenoKvAdapter → `KvPollingAdapter` (cross-process via snapshot_read/atomic_write); `getKvPathFromEnvironment()` reads `services__kv__http__0` first; Redis path via `getRedisConnectionFromEnv()` | packages/queue/factory/create-queue.ts:60,71,150 |
| 8  | Historical C# port source (`netscript-start@49065681e` Resources.g.cs): `AddDenoKv` = `ghcr.io/denoland/denokv:latest`, http endpoint targetPort 4512 (name `http`), bind mount `<apphost>/data/<name>`→`/data`, token = 15 random bytes base64 as `DENO_KV_ACCESS_TOKEN` (container + every consumer), args `--sqlite-path /data/denokv.sqlite serve`, container runtime arg `--init`; `AddKv(useRemote)` = local↔remote toggle; `WithKvReference` = endpoint ref + token env | fetched via gh api, saved locally |
| 9  | Aspire TS SDK 13.4.4 (generated `.aspire/modules/aspire.mts`): `addContainer` chain supports `withArgs`, `withContainerRuntimeArgs`, `withEnvironment`, `withEndpoint`, `withBindMount`, `getEndpoint`; `addExecutable(name, command, workdir, args)`; `addDotnetTool(name, packageId)` → `DotnetToolResourcePromise` with `withToolVersion`, `withToolPrerelease`, `withArgs`, `withEndpoint`, `withHttpEndpoint`, `getEndpoint`, `waitFor`, `withEnvironment`, `withExecutableCommand`, `withWorkingDirectory`; `addParameterWithGeneratedValue` exists for secrets | e2e scratch copy: `.llm/tmp/cli-e2e/plugin-smoke-*/aspire/.aspire/modules/aspire.mts` lines 8174-8261, 12599-12930, 19347+ |
| 10 | Generated infra template: `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-infrastructure-1.ts.template`, slots 0-9; exports `InfrastructureContext` (`databases`, `caches`, `cacheEndpoints`, `primaryDatabase`, `primaryCache`, `primaryCacheEndpoint`) | file |
| 11 | Generator unit tests exist: `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts:130-142`, `generators-service-plugin_test.ts:239-248`, fixtures in `generators-test-support.ts` | files |
| 12 | eis-chat POC (rickylabs/eis-chat#133, LIVE-VERIFIED on Docker-less Windows): garnet Running/Healthy as executable (`garnet-server --port 6379 --bind 127.0.0.1 --memory 1g --index 64m`, NuGet tool v1.1.10); consumers carried `GARNET_URI`/`REDIS_URI`/`CACHE_PROVIDER=garnet` (explicit env, not name-based detection); cross-process enqueue→listen delivery proven; hand-edits in `register-{infrastructure,plugins,background}.mts` | issue #133 |
| 13 | No pre-start hook precedent in generated AppHost (no `dotnet tool restore` anywhere); `addExecutable` precedent is pervasive (all deno processes) | Explore sweep |
| 14 | Parallel-lane collision check (2026-07-03): open PRs #364/#363/#359/#357/#356 touch NONE of `generate-register-infrastructure.ts` / `packages/aspire/config.ts` / register templates. Coordinator confirms clean split; deferred Deploy-S4 apphost-compose slice will later weave over register-services/apps/background — injection seam must stay modular | gh pr view --json files |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/aspire` `config.ts` exports (published subpath). Changes are
  additive enum values + optional fields on existing exported interfaces/schemas, all already
  annotated with explicit `AspireSchema<T>` types — no new slow-type risk. `packages/cli` changes
  are kernel-internal (templates/adapters), not on `mod.ts`; the published binary surface is
  unchanged except generated output content.
- Slow-type / surface risks: none new; keep explicit type annotations on any new exported
  schema constants (follow the existing `CacheEngineSchema` pattern).

## Open questions

1. `addDotnetTool` runtime semantics in SDK 13.4.4 (where it installs, offline behavior, arg
   pass-through) — verify against Aspire docs/MCP + a live `aspire start` during the Garnet
   slice; fallback is `addExecutable('dotnet', ['tool','run','garnet-server',...])` + emitted
   `.config/dotnet-tools.json` (the literal #372 ask).
2. Whether the generated background/app entrypoints (not just plugin services) all carry
   `import '@netscript/kv/redis'` when `RequiresKv` — verify per template during impl; add where
   missing (needed because Auto mode can select a redis-family backend on docker-less hosts).
3. Endpoint-reference env naming (`services__<name>__http__0`) — trust but verify in generated
   env at e2e time; explicit env injection (decision D4) makes correctness independent of it.
