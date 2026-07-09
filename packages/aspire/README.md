# @netscript/aspire

[![JSR](https://jsr.io/badges/@netscript/aspire)](https://jsr.io/@netscript/aspire)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**SDK-neutral Aspire diagnostics, `appsettings.json` parsing, and AppHost composition ports for
NetScript. It turns plain config data into validated resource graphs without leaking any Aspire SDK
type into your signatures.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/aspire

# Node.js / Bun
npx jsr add @netscript/aspire
bunx jsr add @netscript/aspire
```

### Usage

```typescript
import { inspectAspire } from '@netscript/aspire';

// Inspect an AppHost target and render a JSON-stable diagnostic report.
const report = inspectAspire('./dotnet/AppHost');

console.log(report.summary);
console.log(report.details);
```

Validating an `appsettings.json` file before composition uses the `config` subpath:

```typescript
import { parseAppSettings } from '@netscript/aspire/config';

const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');

console.log(config.Name); // "test-app"
for (const warning of warnings) console.warn(warning);
```

---

## 📦 Key Capabilities

- **SDK-neutral by contract**: Every function takes plain data and returns plain data. No Aspire SDK
  type appears in any public signature, so diagnostics and composition stay testable.
- **Validated config parsing**: `parseAppSettings` reads `appsettings.json`, validates it against
  Zod schemas (`@netscript/aspire/schema`), resolves key-dependent defaults, and reports
  cross-reference issues.
- **AppHost composition ports**: `@netscript/aspire/application` exposes `composeAppHost`, the
  `ContributionRegistry`, deterministic port allocation, and resolver helpers that turn config
  entries into Aspire resources.
- **Pluggable builder adapter**: `@netscript/aspire/adapters` provides the `AspireTypeScriptBuilder`
  port that emits AppHost resources, plus environment-source resolution.
- **First-class test surface**: `@netscript/aspire/testing` ships an in-memory builder, the
  `AspireNSPluginContribution` base class, and deterministic fixtures for plugin authors writing
  composition tests.

---

## 🗄️ Shared cache provisioning

A NetScript workspace provisions **one shared cache** for KV-backed queues, session stores, and rate
limiters. The `CacheEntry` config picks a backend with two axes — **`Engine`** (what speaks the
protocol) and **`Mode`** (how it is hosted). The generated AppHost turns that entry into an Aspire
resource and injects the connection env into every consumer that declares `RequiresKv`.

### Engine × Mode matrix

| Engine × Mode                    | Provisioned as                                                                | Wire protocol       | Injected env                                                             |
| -------------------------------- | ----------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `Garnet` / `Redis` + `Container` | `addContainer` (Garnet `ghcr.io/microsoft/garnet`, Redis `redis:7`), tcp:6379 | Redis               | `GARNET_URI` / `REDIS_URI` (host:port), `CACHE_PROVIDER=garnet`\|`redis` |
| `Garnet` + `Executable`          | `addExecutable('dotnet', ['tool','run','garnet-server',…])` — no Docker       | Redis               | `GARNET_URI` (host:port), `CACHE_PROVIDER=garnet`                        |
| `DenoKv` + `Container`           | `addContainer` (`ghcr.io/denoland/denokv`), http:4512                         | Deno KV Connect     | `DENO_KV_URL`, `DENO_KV_ACCESS_TOKEN`, `CACHE_PROVIDER=denokv`           |
| `DenoKv` + `Local`               | in-process `Deno.openKv()` — no resource                                      | Deno KV (embedded)  | _(none — in-process)_                                                    |
| any + `External`                 | `addConnectionString` to a URL you supply                                     | as configured       | connection string                                                        |
| `Garnet` / `DenoKv` + `Auto`     | **decided at `aspire start`** (see below)                                     | Redis or KV Connect | matches the resolved arm                                                 |

### `Auto` — environment-aware selection (default)

The scaffold default is `Engine: 'Garnet', Mode: 'Auto'`. `Auto` defers the hosting choice to
**AppHost start time** so the same generated project runs on a Docker host and on Docker-less bare
metal without regeneration:

- **Docker present** → the configured container backend (`Garnet` → Garnet container, `DenoKv` →
  Deno KV Connect container).
- **Docker absent** → the **Garnet dotnet-tool executable** (`garnet-server`, self-provisioned into
  `.config/dotnet-tools.json` and `dotnet tool restore`d), so bare metal needs only the .NET SDK.

Because both Garnet arms speak the Redis wire protocol, KV consumers connect identically either way
— selection is transparent to userland.

Override the probe with **`NETSCRIPT_CACHE_MODE`** in the AppHost environment: `Container` forces
the container arm, `Executable` forces the dotnet-tool arm. Unset (or any other value) uses the
runtime `docker info` probe.

The Garnet tool version is pinned (via `CacheEntry.ToolVersion`, defaulting to the CLI's
`SCAFFOLD_VERSIONS.GARNET_TOOL`); the executable arm additionally needs the .NET SDK and, for the
Deno KV path, the `--unstable-kv` flag on the consuming Deno process.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/aspire/](https://rickylabs.github.io/netscript/reference/aspire/)
- **Orchestration & Runtime**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **Deploy locally with Aspire**:
  [rickylabs.github.io/netscript/how-to/deploy-local-aspire/](https://rickylabs.github.io/netscript/how-to/deploy-local-aspire/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
