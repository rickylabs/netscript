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
