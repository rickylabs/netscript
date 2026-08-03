# Auth plugin composition pattern — definitive anatomy

Source: Opus 4.8 research sub-agent of this run, 2026-07-18, over `plugins/auth`,
`packages/plugin-auth-core`, `packages/auth-{kv-oauth,workos,better-auth}`, `packages/plugin`,
`packages/cli` (install path). Paths relative to repo root at baseline `290c68ef`.

## 1. Package topology

| JSR name | Dir | Role |
|---|---|---|
| `@netscript/plugin-auth` | `plugins/auth/` | The plugin (manifest + service + streams + DB + contracts re-export + adapter CLI/scaffold) |
| `@netscript/plugin-auth-core` | `packages/plugin-auth-core/` | Provider-agnostic core: domain, ports, contracts/v1, config, presets, streams schemas, telemetry, testing |
| `@netscript/auth-kv-oauth` | `packages/auth-kv-oauth/` | Adapter — KV-backed OAuth2/OIDC relying party (wraps `@panva/oauth4webapi`) |
| `@netscript/auth-workos` | `packages/auth-workos/` | Adapter — WorkOS AuthKit (wraps `@workos-inc/node` + `jose`) |
| `@netscript/auth-better-auth` | `packages/auth-better-auth/` | Adapter — better-auth over Prisma (wraps `better-auth`) |

Dependency direction (strictly inward): plugin → core + all adapters + `@netscript/plugin`,
`plugin-streams-core`, `service`, `kv`, `telemetry` (`plugins/auth/deno.json:17-28`). Adapters →
core (port types) + their one upstream lib; never the plugin, never each other. Core → `@orpc/*`,
`zod`, `@std/assert` (`packages/plugin-auth-core/deno.json:17-22`) **plus `@netscript/service/auth`**
(re-exports `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, `Principal` —
`src/domain/mod.ts:15-22`) — core sits on the service auth kernel, not fully standalone.
`plugins/auth/contracts/v1/mod.ts:10-11` is a pure re-export of core — the plugin owns no contract.

## 2. Manifest & contribution points — three declarations, three consumers

**(a) Runtime `PluginManifest`** via `definePlugin` fluent builder
(`plugins/auth/src/public/mod.ts:23-68`):

```
definePlugin('@netscript/plugin-auth', AUTH_PLUGIN_VERSION)
  .withDisplayName('Auth').withType('api')
  .withPermissions(AUTH_SERVICE_PERMISSIONS)      // --unstable-kv,--allow-net,-env,-read,-write
  .withService({ name:'auth-api', entrypoint:'./services/src/main.ts', port:8094 })
  .withContractVersions([{ version:'v1', loader:'./contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name:'auth' }])
  .withMetadata({...}).build();
// then frozen with an extra CLI contribution:
contributions.cli = { doctorChecks: ['auth-backend'] }
```

Auth uses only `services`, `contractVersions`, `runtimeConfigTopics`, `cli.doctorChecks` — NOT
`databaseSchemas`/`streamTopics`/`migrations` (those wire through other channels, §6/§8).

**(b) Installer manifest `scaffold.plugin.json`** — static JSON read before any plugin code runs
(`PluginInstallerManifest`, `packages/plugin/src/protocol/manifest.ts:112-136`): `capabilities`
(`hasDatabaseMigrations:true, hasRoutes:true, hasBackgroundWorkers:false`), `scaffolder`
(`export:"./scaffold"`, requiredPermissions), `provider` (archetype defaults: `kind:"auth"`,
`portRangeKey:"PLUGIN_API"`, `pluginType:"utility"`, `infrastructureRequires:["db","kv"]`),
`officialSource` (first-party copy metadata: `canonicalName:"auth"`, `pluginDir:"auth"`,
`serviceEntrypoint`, `serviceConfigKey`, `servicePort:8094`, `requiresDb/Kv:true`, permissions).

**(c) Adapter connector `NetScriptPlugin`** (`plugins/auth/src/adapter/plugin.ts:15-47`) — the
seam consumed by `createPluginAdapter`: `install.configParams:['NETSCRIPT_AUTH_BACKEND']`,
`install.prismaContract:'database/auth.prisma'`, `install.wiringEntry:'@netscript/plugin-auth/services'`,
`doctor.requiredConfigKeys:['NETSCRIPT_AUTH_BACKEND']`.

Self-verification: `verify-plugin.ts:17-33` asserts expected axes via `verifyPlugin`.

## 3. The core package

Nine subpaths (`packages/plugin-auth-core/deno.json:6-16`): `.`, `./domain`, `./ports`,
`./contracts/v1`, `./telemetry`, `./streams`, `./config`, `./presets`, `./testing`. Root = curated
barrel. Owns: domain (`AuthUser`, `AuthSession`, `Account`, `Principal`, session states, Zod
schemas); ports (§4); oRPC contract v1; config (`AuthConfigSchema` `{backend, session, providers}`,
backend default `'default'`); presets (`createAuthPresetRegistry`, duplicate-guarded —
adapter packages contribute provider/backend presets); telemetry (span names, redaction, subject
hashing); streams schema (`authStreamSchema`, event types); testing fixtures. Provider-agnostic:
no provider SDK imported anywhere; defines interfaces + schemas + registry + provider-neutral
helpers (`createHmacSessionTokenCrypto` `ports/mod.ts:182`; `createAuthBackendRegistry`/
`resolveBackend` `:329,341`).

## 4. The adapter contract (provider SPI)

`AuthBackendPort` (`packages/plugin-auth-core/src/ports/mod.ts:212-241`):

```ts
export interface AuthBackendPort extends AuthenticatorPort {
  readonly name: string;                             // stable key for backend selection
  readonly providers: AuthProviderRegistryPort;      // listProviders/getProvider
  readonly sessions: AuthSessionStorePort;           // get/create/refresh/revokeSession
  readonly crypto: AuthSessionCryptoPort;            // seal/openSessionToken
  readonly principalMapper: AuthPrincipalMapperPort; // mapSessionToPrincipal
  readonly interactive?: InteractiveFlowPort;        // OPTIONAL redirect flow
  authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult;
}
```

Capability boundaries: adapters **throw `AuthBackendOperationUnsupportedError`** (`:147-163`)
rather than faking operations (WorkOS refuses create/refresh/revoke —
`packages/auth-workos/src/workos-backend.ts:91-108`).

Selection: `createAuthBackendRegistry(Map<name,port>, defaultName)` → `resolveBackend(name?)`
(`ports/mod.ts:317-355`); missing key → `AuthBackendNotFoundError`. Runtime selection env-first:
`NETSCRIPT_AUTH_BACKEND ?? appsettings.auth.backend ?? 'kv-oauth'`
(`plugins/auth/services/src/backend-registry.ts:113-126`); **single-active** — registry built with
exactly ONE entry keyed by the active name (`:106-109`); `createActiveBackend` constructs only the
selected provider, reading provider-specific env (`:128-190`).

## 5. What each adapter wraps (thinness)

Each = `createXBackend(options) → AuthBackendPort`, re-exports port types from core. `auth-workos`
wraps `@workos-inc/node` + `jose`; delegates session crypto to core's HMAC helper; README doctrine:
"NetScript's auth plugin adapts the official `@workos-inc/node` SDK to it for you"
(`packages/auth-workos/README.md:96`). `auth-better-auth` wraps `better-auth` over Prisma
(`README.md:11-13,64`). `auth-kv-oauth` wraps `@panva/oauth4webapi` — the only full interactive RP
(8 subpaths; implements `InteractiveFlowPort`). Thinness marker: adapter `deno.json` imports only
`@std/assert`; upstream via package.json `catalog:`; no cross-adapter deps.

## 6. Layer contributions (file-level map)

- **CLI**: `plugins/auth/cli.ts:16` → `createPluginAdapter(authAdapterPlugin).toCli()`
  (install/doctor/info/update/remove); `scaffold.ts:21` → `.toScaffold()`. Host doctor check
  `'auth-backend'` contributed via manifest.
- **Service (HTTP)**: `services/src/main.ts:54-84` `createAuthService(ctx)` via
  `createPluginService(router, {...}).serve()` (mandated builder chain). Router via
  `assemblePluginContractRouter(implementer, {version:'v1', namespace:'auth', handlers:authV1})`
  (`services/src/router.ts:11-18`). 5 procedures: signin/callback/signout/session/me
  (`contracts/v1/auth.contract.ts:436-459`) + mandatory base `describe` spread from
  `BASE_PLUGIN_CONTRACT_ROUTES` (`:434`). KV adapter side-effect import ordering:
  `import '@netscript/kv/redis'` precedes backend composition (`services/src/main.ts:7-8`).
- **Scaffold assets**: ONE userland file — `auth/mod.ts` typed barrel re-export, emitted by
  `authBarrelScaffolder` (`src/adapter/resources/barrel/barrel.ts:21-33`) from a type-checked stub
  with `%%AUTH_CORE_CONTRACTS%%` token; never rewritten after first scaffold (`barrel.stub.ts:13-24`).
- **Database**: ships `database/auth.prisma` (better-auth-shaped models, `auth_users` table maps)
  wired via connector `install.prismaContract` + `capabilities.hasDatabaseMigrations:true`.
- **Streams**: `streams/schema.ts:42-91` re-exports core schema + defines `authSession` entity + 5
  event types; `producer.ts` server-side emit via `plugin-streams-core` `createDurableStream` with
  W3C trace-context; `factory.ts` browser-safe TanStack-DB client factory. Exports `./streams`,
  `./streams/server`.
- **Contracts**: `./contracts` re-exports core v1 verbatim.

## 7. Naming + versioning conventions

- Plugin `@netscript/plugin-<domain>`; core `@netscript/plugin-<domain>-core`; adapters
  `@netscript/<domain>-<provider>` (drop the `plugin-` prefix). Plugin dir = bare canonical name
  (`plugins/auth/`).
- Plugin subpaths role-named (`./public`, `./plugin`, `./contracts`, `./scaffold`,
  `./adapter-cli`, `./services`, `./streams`, `./streams/server`); core subpaths layer-named.
- Contracts versioned by directory `contracts/v1/`; contract composes the base seam by object
  spread (`...BASE_PLUGIN_CONTRACT_ROUTES`) + interface `extends BasePluginContract`
  (`auth.contract.ts:410-417,434`); error map merges `BASE_PLUGIN_ERRORS` + auth-specific
  (UNAUTHORIZED 401, AUTH_PROVIDER_ERROR 502, VALIDATION_ERROR 422) (`:137-183`).
- Version single-sourced: workspace `0.0.1-beta.10`; plugin version from generated
  `src/package-metadata.generated.ts`; pinned `jsr:@netscript/x@<version>` specifiers enforced by
  `deps:check`; npm upstream deps via `catalog:` refs.

## 8. Scaffold-time story

Install modes: `netscript plugin install auth --source auto|starter|local`
(`packages/cli/src/maintainer/adapters/official-plugin-source.ts:37`); `--stub` = thin
local-import stub. **Official copy mode** = maintainer `copyOfficialPlugin`
(`packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts:54-104`): copies
`plugins/auth/` only (auth declares no `officialSource.dependencies`) — core + adapter packages
resolve from JSR; `rewritePluginDenoJsons` rewrites `@netscript/*` imports to versioned `jsr:`
specifiers; `regenerateCopiedRuntimeRegistries` refreshes registries.

A scaffolded project gets: the plugin tree (copy) or stub; the `auth/mod.ts` barrel; a
registry/appsettings entry generated from `scaffold.plugin.json` by
`normalizeScaffoldPluginMetadata` (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:207-256`);
`NETSCRIPT_AUTH_BACKEND` config key wired; Prisma contract registered; workspace `plugins/deno.json`
regenerated via `PluginRegistryScaffolder` → `generatePluginsDenoJson`
(`kernel/adapters/plugin/registry-scaffolder.ts:13,22-38`). Install/scaffold algorithms are
host-owned in `@netscript/plugin/adapter` (`packages/plugin/src/adapter/mod.ts:78-83`); the plugin
supplies only the `InstallSpec` seam.

## 9. Auth-specific bits that will NOT generalize to deploy

1. `cli.doctorChecks: readonly 'auth-backend'[]` — hardcoded literal union in the host
   (`plugin-contributions.ts:14-16`); a deploy doctor check needs the union widened, not imitated.
2. `AuthBackendPort extends AuthenticatorPort` — the per-request authn seam from
   `@netscript/service/auth` is meaningless for deploy; deploy ports shape around operations
   (build/emit/up/rollback), not request authentication.
3. **Single-active-backend selection** via one env var fits "pick one auth provider"; deploy
   plausibly needs **multiple concurrent targets** (aws + cloudflare in one project) → the
   single-active registry pattern inverts to a multi-registered map keyed per environment/target.
4. better-auth-shaped Prisma schema is a provider artifact leaking into the plugin; deploy has no
   analogous universal schema — don't assume a plugin must ship a `.prisma`.
5. `interactive?: InteractiveFlowPort` (browser redirect flow) has no deploy analog.
6. HMAC session-token crypto + cookie/session policy have no deploy counterpart.
7. Auth deliberately emits NO userland leaf sample (env-driven config, single never-rewritten
   barrel); deploy likely DOES want a user-authored leaf (target definitions) — the "single
   barrel" doctrine may not transfer.
8. `portRangeKey:'PLUGIN_API'`, `servicePort:8094`, `hasRoutes:true`, `requiresDb/Kv:true` encode
   "long-running HTTP API needing db+kv"; deploy is more CLI-tool-shaped (`hasRoutes:false`, no
   persistent port, maybe `hasBackgroundWorkers` for async deploys) — re-derive the
   provider/officialSource block, don't copy it.

## What DOES generalize cleanly

The 3-tier split and naming (`plugin-deploy` / `deploy-core` / `deploy-<provider>`); inward
dependency direction; core-owns-ports-and-registry + adapters-implement-port +
`OperationUnsupportedError` capability boundaries; the `definePlugin` builder +
`scaffold.plugin.json` + `NetScriptPlugin` connector triad;
`createPluginAdapter(connector).toCli()/.toScaffold()`; contract composition via
`...BASE_PLUGIN_CONTRACT_ROUTES` + `satisfies BasePluginContract`; `contracts/v1/` versioning;
catalog/JSR-specifier centralization; the official-source copy-mode + registry-generation install
path (host-owned, driven by `officialSource`/`provider` metadata).
