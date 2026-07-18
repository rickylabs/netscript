# @netscript/aspire

[![JSR](https://jsr.io/badges/@netscript/aspire)](https://jsr.io/@netscript/aspire)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**SDK-neutral Aspire diagnostics, `appsettings.json` parsing, and AppHost composition ports for
NetScript. It turns plain config data into validated resource graphs without leaking any Aspire SDK
type into your signatures.**

Orchestrating a polyglot workspace with .NET Aspire usually means writing against the Aspire SDK
directly — and then every plugin, test, and diagnostic tool inherits that dependency. This package
inverts the relationship: every function takes plain data and returns plain data. Config is parsed
and validated with Zod schemas, resource graphs are composed through a builder port, and the Aspire
SDK appears only behind an adapter at the very edge.

That contract is what lets NetScript plugins contribute Aspire resources, workspaces validate their
config before start, and composition logic run under test with an in-memory builder — all without a
.NET toolchain in the loop.

## Why it stands out

- **SDK-neutral by contract** — no Aspire SDK type appears in any public signature, so diagnostics
  and composition stay portable and testable.
- **Validated config parsing** — `parseAppSettings` reads `appsettings.json`, validates it against
  the Zod schemas on `./config`, resolves key-dependent defaults, and reports cross-reference issues
  as warnings instead of crashes.
- **AppHost composition ports** — `./application` exposes `composeAppHost`, the
  `ContributionRegistry`, deterministic port allocation, and resolver helpers that turn config
  entries into Aspire resources.
- **Pluggable builder adapter** — `./adapters` provides the `AspireTypeScriptBuilder` port that
  emits AppHost resources, plus environment-source resolution.
- **First-class test surface** — `./testing` ships `MemoryAspireBuilder`, an example contribution,
  and deterministic fixtures for plugin authors writing composition tests.
- **Environment-aware cache provisioning** — one shared cache entry provisions Garnet, Redis, or
  Deno KV as a container, a local executable, or an external connection, with an `Auto` mode that
  probes for Docker at start time.

## Architecture

```mermaid
flowchart LR
    J["appsettings.json"] --> P["parseAppSettings<br/>(Zod validation + defaults)"]
    P --> G["composeAppHost<br/>+ ContributionRegistry"]
    K["Plugin contributions"] --> G
    G --> B["Builder port"]
    B --> A["AspireTypeScriptBuilder<br/>(real AppHost)"]
    B --> M["MemoryAspireBuilder<br/>(tests)"]
```

## Install

```bash
deno add jsr:@netscript/aspire@<version>
```

Pin `<version>` (for example `0.0.1-beta.10`): bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line. Scaffolded NetScript workspaces already carry the pinned entry.

## Quick example

Validate an `appsettings.json` before composition:

```typescript
import { parseAppSettings } from '@netscript/aspire/config';

const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');

console.log(config.Name); // "test-app"
for (const warning of warnings) console.warn(warning);
```

Inspect an AppHost target and render a JSON-stable diagnostic report:

```typescript
import { inspectAspire } from '@netscript/aspire';

const report = inspectAspire('./dotnet/AppHost');
console.log(report.summary);
```

## Shared cache provisioning

A NetScript workspace provisions **one shared cache** for KV-backed queues, session stores, and rate
limiters. The `CacheEntry` config picks a backend with two axes — **`Engine`** (what speaks the
protocol) and **`Mode`** (how it is hosted) — and the generated AppHost injects the connection
environment into every consumer that declares `RequiresKv`.

| Engine × Mode                    | Provisioned as                                     | Wire protocol      |
| -------------------------------- | -------------------------------------------------- | ------------------ |
| `Garnet` / `Redis` + `Container` | Container (Garnet or `redis:7`), tcp:6379          | Redis              |
| `Garnet` + `Executable`          | `dotnet tool run garnet-server` — no Docker needed | Redis              |
| `DenoKv` + `Container`           | Container (`ghcr.io/denoland/denokv`), http:4512   | Deno KV Connect    |
| `DenoKv` + `Local`               | In-process `Deno.openKv()` — no resource           | Deno KV (embedded) |
| any + `External`                 | Connection string to a URL you supply              | As configured      |
| `Garnet` / `DenoKv` + `Auto`     | Decided at `aspire start` by a Docker probe        | Matches the arm    |

The scaffold default is `Engine: 'Garnet', Mode: 'Auto'`: with Docker present the container arm
runs; without it, the Garnet dotnet-tool executable self-provisions — so the same generated project
runs on a Docker host and on Docker-less bare metal without regeneration. Both Garnet arms speak the
Redis wire protocol, so selection is transparent to consumers. Set `NETSCRIPT_CACHE_MODE` to
`Container` or `Executable` in the AppHost environment to override the probe.

## API at a glance

| Entry           | What it gives you                                                                 |
| --------------- | --------------------------------------------------------------------------------- |
| `.`             | `inspectAspire` — the diagnostic contract                                         |
| `./config`      | `parseAppSettings` and the `NetScriptConfigSchema` Zod schema family              |
| `./schema`      | `generateAppSettingsJsonSchema` — JSON Schema for editor validation               |
| `./types`       | The plain-data type vocabulary shared by all subpaths                             |
| `./constants`   | `CONFIG_KEYS`, `OTEL_DEFAULTS`, `DEFAULT_PERMISSIONS`, and friends                |
| `./application` | `composeAppHost`, `ContributionRegistry`, `createPortAllocator`, resolvers        |
| `./adapters`    | `AspireTypeScriptBuilder`, `resolveEnvSource`                                     |
| `./testing`     | `MemoryAspireBuilder`, `ExampleAspireContribution`, contribution-context fixtures |
| `./public`      | The whole surface re-exported from one entry                                      |

The always-current symbol list is
[`deno doc jsr:@netscript/aspire@<version>`](https://jsr.io/@netscript/aspire/doc).

## Docs

- **Orchestration & runtime — Aspire in the NetScript workspace**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **Reference**:
  [rickylabs.github.io/netscript/reference/aspire/](https://rickylabs.github.io/netscript/reference/aspire/)
- **How-to — deploy locally with Aspire**:
  [rickylabs.github.io/netscript/how-to/deploy-local-aspire/](https://rickylabs.github.io/netscript/how-to/deploy-local-aspire/)
- **API docs on JSR**: [jsr.io/@netscript/aspire/doc](https://jsr.io/@netscript/aspire/doc)

## Compatibility

Runs on Deno 2.x with no .NET dependency of its own — the package handles plain data; running the
composed AppHost requires the .NET SDK and the Aspire CLI, and the Deno KV cache arms need
`--unstable-kv` on the consuming process.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
