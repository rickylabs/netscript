# Worklog — feat-aspire-kv-connect-provisioner--371-372

## Design

### Contract (lands first, PR-A slice S1 — A2)

`packages/aspire/config.ts`, additive only, explicit `AspireSchema<T>` annotations preserved:

```ts
export type CacheEngine = 'Redis' | 'Garnet' | 'DenoKv';

/** Cache-specific mode; Databases keep the existing 2-value ResourceMode. */
export type CacheMode = 'Local' | 'Container' | 'Executable' | 'External' | 'Auto';

export interface CacheEntry extends BaseEntry {
  Engine: CacheEngine;         // default stays 'Garnet'
  Mode: CacheMode;             // default stays 'Container' (flips to 'Auto' in PR-B via ensureSharedCache)
  ImageTag?: string;
  Port?: number;
  DataPath?: string;
  /** dotnet-tool version pin for Executable mode (garnet-server). */
  ToolVersion?: string;
}
```

Engine×Mode validity matrix (enforced in `validateCrossReferences()`; invalid → actionable error):

| Engine \ Mode | Local | Container | Executable | External | Auto |
| ------------- | ----- | --------- | ---------- | -------- | ---- |
| Redis         | ✗     | ✓         | ✗          | ✓        | ✓ (docker→Container, else error naming Garnet) |
| Garnet        | ✗     | ✓         | ✓          | ✓        | ✓ (docker→Container, else Executable) |
| DenoKv        | ✓     | ✓         | ✗          | ✗        | ✓ (docker→DenoKv Container, else **Garnet Executable cross-fallback**) |

`Local` (DenoKv only) = unified topology: no Aspire resource, consumers use in-process
`Deno.openKv()` — the zero-config default when no Cache entry exists (feeds #349).

### Generated-output design (PR-A slice S2, PR-B slices)

`generate-register-infrastructure.ts` emits per-entry dispatch (typed matrix, one place — AP-24):

- **DenoKv Container** (port of historical `AddDenoKv`, F8):
  `addContainer(name, 'ghcr.io/denoland/denokv:<pin>')`
  `.withEndpoint({ name: 'http', targetPort: 4512, scheme: 'http' })`
  `.withBindMount(resolveDataPath(...), '/data')`
  `.withEnvironment('DENO_KV_ACCESS_TOKEN', token)` — token from `generateAccessToken()` in
  `_aspire-compat` (crypto.getRandomValues 15 bytes → base64)
  `.withContainerRuntimeArgs(['--init'])`
  `.withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])`
- **Garnet Executable** (PR-B):
  `addDotnetTool(name, 'garnet-server').withToolVersion('<pin>')`
  `.withArgs(['--port','6379','--bind','127.0.0.1','--memory','1g','--index','64m'])`
  `.withEndpoint({ name: 'tcp', targetPort: 6379, scheme: 'tcp' })`
  (fallback per plan D2: `addExecutable('dotnet', ['tool','run','garnet-server',...])` + emitted
  `.config/dotnet-tools.json`)
- **Auto** (PR-B): runtime `if (await isDockerAvailable())` branch in the *generated* file over
  the two arms above; `NETSCRIPT_CACHE_MODE` env override; logs the selected backend.
- **Local**: no resource emitted; context entry marked local so consumers skip injection.

### Consumer-injection seam (the Deploy-S4 composability requirement)

`InfrastructureContext` (template asset slot) gains:

```ts
export interface CacheWiring {
  resource: /* builder resource */;
  endpoint?: /* EndpointReference */;
  /** explicit env pairs consumers must receive, e.g. DENO_KV_ACCESS_TOKEN, GARNET_URI, CACHE_PROVIDER */
  consumerEnv: Record<string, string>;
  local: boolean; // Local mode → consumers do nothing
}
// context.cacheWiring: Map<string, CacheWiring>; primaryCacheWiring?: CacheWiring
```

One helper emitted in `_aspire-compat`:

```ts
export function withCacheReference<T>(builder: T, wiring: CacheWiring | undefined): T
// = withReference(endpoint ?? resource) + waitFor(resource) + withEnvironment for each consumerEnv pair
```

`generate-register-plugins.ts` / `generate-register-background.ts` / `generate-register-apps.ts`
each replace their inlined `withReference(...)+waitFor(...)` RequiresKv block (plugins:113-124,
background:124-135, apps:82-89) with a single `withCacheReference(...)` call. Net effect on those
three shared generators: **one-line call-site swap each, no structural change** — a future
apphost-compose weave (Deploy-S4) layers over the same call site without unwinding cache logic.
Existing `cacheEndpoints`/`primaryCacheEndpoint` context fields stay (back-compat) and are
derived from `cacheWiring`.

### CLI-side mutation (PR-B)

`workspace-mutator.ts ensureSharedCache`: default entry becomes
`{ Enabled: true, Engine: 'Garnet', Mode: 'Auto' }` (append-only `??=` semantics unchanged —
existing user entries never rewritten); engine parameter added so future plugin metadata can ask
for DenoKv (then cacheKey `kv`, satisfying the `services__kv__http__0` naming contract as
belt-and-braces alongside explicit env).

### Register-generator interaction map (for coordinator S4 pre-sequencing)

| File | This lane touches | Nature |
| ---- | ----------------- | ------ |
| `register/generate-register-infrastructure.ts` + its template asset | YES (heavy) | new dispatch + CacheWiring seam |
| `register/generate-register-plugins.ts` | YES (minimal) | swap inline RequiresKv block → `withCacheReference` call |
| `register/generate-register-background.ts` | YES (minimal) | same one-line swap |
| `register/generate-register-apps.ts` | YES (minimal) | same one-line swap |
| `register/generate-register-services.ts` | NO | untouched |
| `_aspire-compat` template | YES (additive) | `generateAccessToken`, `isDockerAvailable`, `withCacheReference` |

### Slice map

- **PR-A `feat/aspire-kv-connect-provisioner`** (Closes #371, Refs #327 #349 #364 #372)
  - S1 contract: CacheEngine+CacheMode+ToolVersion, matrix validation, schema tests
  - S2 DenoKv container arm + CacheWiring seam + `withCacheReference` + consumer swaps + generator tests
  - S3 Local mode + scaffold defaults verification + docs; static gates + scaffold smoke
- **PR-B `feat/aspire-garnet-executable`** (stacked on PR-A; Closes #372, Refs #327 #349 #371)
  - S4 Garnet dotnet-tool arm (verify addDotnetTool live FIRST; fallback D2) + tests
  - S5 Auto selection (isDockerAvailable + cross-fallback) + ensureSharedCache default flip + tests
  - S6 redis-import audit across generated RequiresKv entrypoints + docs + live aspire validation both arms
- Merge-readiness per PR: `e2e:cli run scaffold.runtime --cleanup` + IMPL-EVAL (qwen 3.7 max)

## Evidence

(appended per slice)

### Implementation status (2026-07-04)

- **S1** (97db8bf9) DONE — CacheMode union + engine×mode matrix validation + schema exports.
- **S2** (48d08fd0) DONE — DenoKv Connect container arm + `withCacheReference` seam + consumer swaps.
- **S3** (PR-A) docs DONE — engine×mode matrix + env contract + Auto/NETSCRIPT_CACHE_MODE section
  added to `packages/aspire/README.md`. (Local-mode arm itself shipped in S2.)
- **S4** (ce244d60) DONE — Garnet executable arm via D2 fallback (`ensureGarnetToolManifest` +
  `addExecutable('dotnet',['tool','run','garnet-server',…])`), tcp:6379, `GARNET_URI`/`REDIS_URI` +
  `CACHE_PROVIDER='garnet'`, `ToolVersion` pin (default `SCAFFOLD_VERSIONS.GARNET_TOOL='1.1.10'`).
- **S5** (08e70e64) DONE — `isDockerAvailable()` + `shouldUseContainerCache()` probe (+
  `NETSCRIPT_CACHE_MODE` override), engine-aware Auto arm (Docker→configured container,
  Docker-less→Garnet executable cross-fallback), `ensureSharedCache` default flipped to `Mode:'Auto'`.
- **S6** (a2f56409) DONE — redis-import audit complete (consumers self-register `@netscript/kv/redis`
  and resolve via `getKv()`→`autoDetectProvider()` on `CACHE_PROVIDER`+URI env). Audit found +
  fixed the DenoKv container env-contract gap (explicit `DENO_KV_URL` via `EndpointProperty.Url`; see
  drift). Docs added to `packages/aspire/README.md`.

### Validation coverage

- Unit/generator tests GREEN: `generate-register-infrastructure_test.ts` (10 steps incl. new S4/S5
  cases), `generators-config-infra_test.ts` (updated import assertion), `workspace-mutator_test.ts`
  (9 steps), `config_test.ts` (26 steps).
- Scoped `deno check --unstable-kv` on aspire helper templates + plugin adapters: clean.
- **PR-A E2E** `scaffold.runtime --cleanup`: **exit 0, 48 passed / 0 failed** (job bltjyeyl9).
  Validated the Garnet **Container** arm + `withCacheReference` seam on this Docker host.
- **PR-B E2E** (Auto default → Garnet **container** on this Docker host, `NETSCRIPT_CACHE_MODE`
  unset): **exit 0, 48 passed / 0 failed** (job b8dqt4cm9). Ran on S5-tip code; validates the Auto
  code path resolving to the Garnet container + live Aspire plugin/background endpoints. The S6
  DenoKv-URL fix is orthogonal to this Garnet path (DenoKv arm not exercised by the default scaffold).
- **NOT live-E2E'd on this Docker host** (flagged for separate-session eval): the Garnet
  **Executable** arm (needs Docker-less env or `NETSCRIPT_CACHE_MODE=Executable`) and the **DenoKv
  Container** arm (needs a `DenoKv`-engine scaffold). Both are unit-tested + type-checked-as-generator.
