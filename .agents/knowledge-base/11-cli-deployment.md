# CLI & Windows Deployment

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Complete reference for `@netscript/cli` — the build, install, and lifecycle management package for
> deploying NetScript applications as native Windows Services.

## Overview

`packages/cli/` replaces the old monolithic `scripts/deploy-windows.ts` with a modular Windows
deployment implementation. It compiles every service to a standalone `.exe` via `deno compile`,
configures them as Windows Services through **Servy**, and manages the full lifecycle (install,
start, stop, status, logs, uninstall).

Current architecture note: deploy is still Windows-shaped (`deploy.windows`, Servy XML, Windows
runtime config, Windows env files). Do not add plugin-owned deployment metadata directly against
this shape. The next deploy refactor should introduce target adapters first, move the current
Windows behavior behind the Windows adapter, and then let plugins contribute generic deployment
capabilities such as runtime config, task assets, operator overrides, and process definitions.

```
netscript.config.ts + appsettings.json + .env.local
                    │
            loadDeployConfig()       ← three-source merge
                    │
            ResolvedConfig           ← single source of truth
           ┌────────┼───────────┐
     compile    servy XML    runtime
     (.exe)     configs      scaffold
           └────────┼───────────┘
            .deploy/windows/
            ├── bin/               ← compiled .exe binaries
            ├── config/
            │   ├── *.xml          ← Servy service configurations
            │   ├── services.json  ← service discovery manifest
            │   └── runtime/       ← hot-reload operator overrides
            └── logs/              ← empty, Servy fills at runtime
```

## Commands

All commands are run from the project root with env files loaded:

```bash
# Full build pipeline (compile + configs)
deno task deploy:build
deno task deploy:build:verbose
deno task deploy:build:skip-compile   # configs only, no compilation

# Install as Windows Services (requires admin)
deno task deploy:install

# Lifecycle management (requires admin)
deno task deploy:start
deno task deploy:stop
deno task deploy:status
deno task deploy:logs

# Teardown (requires admin)
deno task deploy:uninstall
```

Or invoke the CLI directly for fine-grained control:

```bash
deno run -A --env-file=.env.local packages/cli/src/main.ts --help
deno run -A --env-file=.env.local packages/cli/src/main.ts build --skip-compile --verbose
deno run -A --env-file=.env.local packages/cli/src/main.ts build --force-runtime-config
deno run -A --env-file=.env.local packages/cli/src/main.ts install --dry-run
deno run -A --env-file=.env.local packages/cli/src/main.ts logs users --lines 100
```

### `build` options

| Flag                     | Default             | Description                                     |
| ------------------------ | ------------------- | ----------------------------------------------- |
| `-o, --output-dir`       | `./.deploy/windows` | Deployment output root                          |
| `--no-parallel`          | parallel on         | Disable parallel compilation                    |
| `--max-concurrency`      | `4`                 | Max simultaneous compilations                   |
| `--skip-compile`         | false               | Skip `deno compile`, only regenerate configs    |
| `--force-runtime-config` | false               | Overwrite operator-edited runtime files         |
| `-v, --verbose`          | false               | Verbose output with V8 budget and per-step logs |

## Package Structure

```
packages/cli/
├── mod.ts                          ← public API barrel
├── deno.json                       ← @netscript/cli package manifest
└── src/
    ├── main.ts                     ← CLI entry point (@cliffy/command)
    ├── errors.ts                   ← typed error hierarchy + ExitCode enum
    ├── constants/
    │   ├── windows.ts              ← Servy paths, V8 profiles, compile flags
    │   ├── providers.ts            ← DB/cache provider names, ports, env vars
    │   ├── runtime.ts              ← deploy dirs, runtime topics, immutable fields
    │   └── mod.ts                  ← barrel
    ├── types/
    │   ├── compile.ts              ← CompileTarget, CompileResult, BuildResult
    │   ├── infrastructure.ts       ← DatabaseConfig, CacheConfig, InfrastructureConfig
    │   ├── manifest.ts             ← ServiceManifest, ManifestServiceEntry
    │   ├── resolved-config.ts      ← ResolvedConfig (single source of truth)
    │   ├── runtime-override.ts     ← JobOverride, SagaOverride, RuntimeTask, FeatureFlag
    │   ├── servy.ts                ← ServyServiceConfig (maps to Servy XML)
    │   └── mod.ts                  ← barrel
    ├── config/
    │   ├── loader.ts               ← loadDeployConfig() — three-source merge
    │   ├── infrastructure.ts       ← detectInfrastructure() — Docker auto-detection
    │   ├── runtime-override.ts     ← loadRuntimeOverrides() — reads runtime/*.json
    │   └── mod.ts                  ← barrel
    └── adapters/windows/
        ├── compile.ts              ← extractCompileTargets(), compileAll()
        ├── manifest.ts             ← generateServiceManifest(), topologicalSort()
        ├── runtime-config.ts       ← writeRuntimeConfig() — generates runtime/ dir
        ├── servy.ts                ← generateServyXml(), writeServyConfigs()
        ├── strategy.ts             ← buildWindowsDeployment() — orchestrates pipeline
        └── v8-profiles.ts          ← getV8Profile(), printV8BudgetSummary()
```

## Configuration Loading

`loadDeployConfig()` merges three sources. Higher items take precedence:

```
Priority  Source                              What it provides
───────────────────────────────────────────────────────────────────────
  1 (high) Environment variables (.env.local)  Connection strings, ports
  2        appsettings.json NetScript section   Service/plugin definitions, infrastructure
  3 (low)  netscript.config.ts                 Service names, worker groups, sagas config
```

### Project Root Detection

`findProjectRoot()` walks up from CWD looking for any of:

- `netscript.config.ts`
- `dotnet/AppHost/appsettings.json`
- `deno.json` with a `workspace` array

### appsettings.json Sections Used

```json
{
  "ConnectionStrings": {
    "garnet": "127.0.0.1:6379",
    "postgres": "Host=localhost;Port=5432;..."
  },
  "NetScript": {
    "Name": "test-app",
    "Version": "1.0.0",
    "Otel": { "HttpEndpoint": "http://localhost:4318" },
    "Defaults": { "Deno": { "Permissions": ["--allow-net", "--allow-env", ...] } },
    "Services": {
      "users": { "Port": 3000, "Entrypoint": "src/main.ts", "Workdir": "services/users" }
    },
    "Plugins": {
      "workers-api": { "Enabled": true, "Port": 8091, "RequiresKv": true, "RequiresDb": true }
    },
    "Workers": {
      "Enabled": true,
      "Workdir": "workers",
      "Binaries": {
        "combined": { "Entrypoint": "bin/combined.ts" },
        "worker":   { "Entrypoint": "bin/worker.ts" },
        "scheduler":{ "Entrypoint": "bin/scheduler.ts" }
      }
    },
    "Databases": {
      "netscript": { "Engine": "Postgres", "ImageTag": "18" }
    },
    "Cache": {
      "garnet": { "Engine": "Garnet" }
    }
  }
}
```

## Infrastructure Auto-Detection

`detectInfrastructure()` resolves DB and cache connection strings using this priority chain:

```
1. ConnectionStrings__{name} env var   → highest priority, set by Aspire or .env.local
2. appsettings.json ConnectionStrings  → fallback for static config
3. Docker container inspection         → for Aspire-managed containers (docker inspect)
4. Hardcoded localhost defaults        → last resort
```

### Docker Detection

When Aspire starts a PostgreSQL or Garnet container, the CLI finds it by name:

```
{COMPOSE_PROJECT_NAME}-{baseName}  →  test-app-postgres-1a2b3c
```

Then runs `docker inspect` to extract the **host port mapping** and **password** from the container
environment variables, building a proper connection string automatically.

### Supported Providers

| Type     | Providers                    | Format                                          |
| -------- | ---------------------------- | ----------------------------------------------- |
| Database | `postgres`, `mysql`, `mssql` | URI (`postgres://`) or ADO.NET (`Host=;Port=;`) |
| Cache    | `garnet`, `redis`            | URI (`garnet://`) or plain `host:port`          |

## Compile Pipeline

### CompileTarget

Every deployable unit becomes a `CompileTarget`:

```typescript
interface CompileTarget {
  name: string; // e.g. "users"
  type: 'service' | 'plugin' | 'worker' | 'app';
  entrypoint: string; // path relative to projectRoot
  workdir: string; // e.g. "services/users"
  outputName: string; // e.g. "users.exe"
  permissions: string[]; // deno compile --allow-* flags
  port?: number;
  dependsOn?: string[];
}
```

### V8 Memory Profiles

Each service type gets a tuned V8 heap allocation:

| Type      | Heap   | JIT              | Rationale                                      |
| --------- | ------ | ---------------- | ---------------------------------------------- |
| `service` | 256 MB | `--no-sparkplug` | oRPC services, no heavy compute                |
| `plugin`  | 256 MB | `--no-sparkplug` | API plugins, similar to services               |
| `worker`  | 512 MB | full JIT         | Job execution needs headroom + peak throughput |
| `app`     | 128 MB | `--no-sparkplug` | Fresh frontend, modest memory needs            |

`--no-sparkplug` disables the mid-tier Sparkplug JIT compiler, reducing startup latency and memory
at the cost of peak throughput — the right tradeoff for services that are always running.

### Topological Sort

Services are compiled and started in dependency order. `topologicalSort()` reads each target's
`dependsOn` array and returns a stable ordering where dependencies always come first.

### Parallel Compilation

`compileAll()` runs up to `maxConcurrency` (default 4) `deno compile` processes concurrently. Each
compile has a 5-minute timeout. Progress is reported to stdout.

```bash
# Example compile command generated per service:
deno compile \
  --allow-net --allow-env --allow-read --allow-sys \
  --v8-flags=--max-old-space-size=256,--no-sparkplug \
  --target=x86_64-pc-windows-msvc \
  --output=.deploy/windows/bin/users.exe \
  services/users/src/main.ts
```

## Servy Configuration

Each service gets a Servy XML config in `.deploy/windows/config/{name}.xml`.

### What Goes Into the XML

- **Service name**: `NetScript.{name}` (e.g., `NetScript.users`)
- **Executable**: absolute path to the compiled `.exe`
- **Working directory**: `{installDir}/{name}/`
- **Environment variables**: connection strings, service discovery URLs, OTEL config
- **Startup type**: `AutomaticDelayedStart` (2-second delay after system boot)
- **Log rotation**: 10 MB size limit + daily rotation, 30 days retention
- **Health monitoring**: heartbeat every 30s, restart on 3 consecutive failures
- **Recovery**: auto-restart on crash (3 attempts)

### Environment Variables Injected

```
# Database
ConnectionStrings__netscript=postgres://postgres:@localhost:5432/postgres

# Cache
ConnectionStrings__garnet=garnet://127.0.0.1:6379

# OTEL
OTEL_DENO=true
OTEL_SERVICE_NAME=users
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# Service discovery (all other services)
services__products__http__0=http://localhost:3001
services__orders__http__0=http://localhost:3002
services__workers-api__http__0=http://localhost:8091
...

# Port
PORT=3000
```

## Service Manifest

`.deploy/windows/config/services.json` is written after every build. It serves as a service
discovery and health reference for operators and tooling:

```json
{
  "name": "test-app",
  "version": "1.0.0",
  "generatedAt": "2026-02-21T15:18:59.925Z",
  "services": {
    "users": {
      "url": "http://localhost:3000",
      "health": "http://localhost:3000/health",
      "type": "service"
    },
    "workers-api": {
      "url": "http://localhost:8091",
      "health": "http://localhost:8091/health",
      "type": "plugin"
    },
    "frontend": {
      "url": "http://localhost:8000",
      "health": "http://localhost:8000/health",
      "type": "app"
    }
  },
  "infrastructure": {
    "database": "postgres://postgres:@localhost:5432/postgres",
    "cache": "garnet://127.0.0.1:6379",
    "otlp": "http://localhost:4318"
  },
  "dashboard": { "url": "http://localhost:18888" }
}
```

The `install`, `start`, `stop`, `status`, `logs`, and `uninstall` commands all read this file to
know which services exist and in what order to manage them.

## Runtime Overrides

The `.deploy/windows/config/runtime/` directory enables **hot-reloadable operator overrides**
without redeploying or recompiling. It uses a version pointer pattern:

```
runtime/
├── current               ← version pointer (always updated on build)
├── schema.json           ← JSON Schema for editor validation and autocomplete
├── jobs/
│   └── v1.0.0.json       ← job override stubs (one per compiled job)
├── sagas/
│   └── v1.0.0.json       ← saga override stubs
├── tasks/
│   └── v1.0.0.json       ← additive task stubs
└── features/
    └── v1.0.0.json       ← feature flag stubs
```

### Version Pointer (`current`)

```json
{
  "version": "1.0.0",
  "jobs": "jobs/v1.0.0.json",
  "sagas": "sagas/v1.0.0.json",
  "tasks": "tasks/v1.0.0.json",
  "features": "features/v1.0.0.json",
  "updatedAt": "2026-02-21T15:18:59.934Z"
}
```

### Job Overrides (`runtime/jobs/v1.0.0.json`)

Generated from all worker group jobs in `netscript.config.ts`. Each entry reflects the compiled
defaults so operators can see what they're changing:

```json
{
  "$schema": "../schema.json#/definitions/JobsConfig",
  "version": "1.0.0",
  "overrides": [
    {
      "id": "health-check",
      "enabled": true,
      "schedule": "*/5 * * * *",
      "timeout": 30000,
      "maxRetries": 1
    },
    {
      "id": "orders-daily-export",
      "enabled": false,
      "schedule": "*/10 * * * *",
      "timeout": 300000,
      "maxRetries": 3
    }
  ]
}
```

Overridable fields: `enabled`, `schedule`, `timeout`, `maxRetries`, `timezone`, `concurrency`.
**Immutable** (cannot be overridden): `id`, `name`, `entrypoint`.

### Feature Flags (`runtime/features/v1.0.0.json`)

```json
{
  "flags": [
    {
      "id": "enable-telemetry",
      "enabled": true,
      "description": "Send traces and metrics to OTLP endpoint"
    },
    {
      "id": "enable-health-checks",
      "enabled": true,
      "description": "Enable Servy health monitoring for services"
    },
    {
      "id": "enable-log-rotation",
      "enabled": true,
      "description": "Enable automatic log file rotation"
    },
    {
      "id": "enable-auto-restart",
      "enabled": true,
      "description": "Automatically restart failed services"
    }
  ]
}
```

### Operator Safety

- **Build without `--force-runtime-config`**: existing runtime files are **never overwritten**,
  preserving operator edits across rebuilds.
- **Build with `--force-runtime-config`**: all runtime files are reset to compiled defaults.
- `schema.json` is **always** regenerated (it's structural, not operator data).
- `current` pointer is **always** updated to point to the latest version files.

### Loading Overrides at Runtime

`loadRuntimeOverrides(configDir)` reads `runtime/current` then loads each topic file:

```typescript
import { loadRuntimeOverrides } from '@netscript/cli';

const overrides = await loadRuntimeOverrides('./.deploy/windows/config');
if (overrides) {
  const jobOverride = overrides.jobs.find((j) => j.id === 'health-check');
  if (jobOverride?.enabled === false) {
    // skip scheduling this job
  }
}
```

Returns `null` if the runtime directory doesn't exist (valid case — first build hasn't run yet).

## Error Handling

All errors extend `CLIError` and carry an `exitCode`:

| Error class            | Exit code | When thrown                                  |
| ---------------------- | --------- | -------------------------------------------- |
| `ConfigNotFoundError`  | 100       | Project root not found                       |
| `ConfigInvalidError`   | 101       | netscript.config.ts fails Zod validation     |
| `CompileError`         | 110       | `deno compile` fails for one or more targets |
| `ServyNotFoundError`   | 120       | `servy-cli.exe` not at expected path         |
| `AdminRequiredError`   | 121       | install/uninstall run without elevation      |
| `ServiceNotFoundError` | 130       | Named service not in services.json           |

```typescript
import { CLIError, ExitCode, formatError } from '@netscript/cli';

try {
  await buildWindowsDeployment(config, options);
} catch (error) {
  if (error instanceof CLIError) {
    console.error(formatError(error));
    Deno.exit(error.exitCode);
  }
  throw error; // unexpected — rethrow
}
```

## Public API (`mod.ts`)

```typescript
// Config
import { findProjectRoot, loadDeployConfig } from '@netscript/cli';
import { loadRuntimeOverrides } from '@netscript/cli';
import { detectInfrastructure } from '@netscript/cli';

// Build pipeline
import { buildWindowsDeployment } from '@netscript/cli';
import { compileAll, extractCompileTargets } from '@netscript/cli';
import { generateServyXml, writeServyConfigs } from '@netscript/cli';
import { generateServiceManifest, topologicalSort } from '@netscript/cli';
import { writeRuntimeConfig } from '@netscript/cli';
import { getV8Profile } from '@netscript/cli';

// Types
import type { BuildResult, CompileTarget, ResolvedConfig } from '@netscript/cli';
import type { CacheConfig, DatabaseConfig, InfrastructureConfig } from '@netscript/cli';
import type { FeatureFlag, JobOverride, RuntimeOverrides } from '@netscript/cli';
import type { ServiceManifest } from '@netscript/cli';

// Errors
import { CLIError, ExitCode, formatError } from '@netscript/cli';
```

## Key Files

| File                                                  | Purpose                                      |
| ----------------------------------------------------- | -------------------------------------------- |
| `packages/cli/src/main.ts`                            | CLI entry point, command registration        |
| `packages/cli/src/config/loader.ts`                   | Three-source config merge                    |
| `packages/cli/src/config/infrastructure.ts`           | DB/cache detection with Docker support       |
| `packages/cli/src/config/runtime-override.ts`         | Load operator overrides from runtime/        |
| `packages/cli/src/adapters/windows/strategy.ts`       | Full build pipeline orchestrator             |
| `packages/cli/src/adapters/windows/compile.ts`        | deno compile wrapper, parallel runner        |
| `packages/cli/src/adapters/windows/servy.ts`          | Servy XML generation                         |
| `packages/cli/src/adapters/windows/runtime-config.ts` | Write runtime/ scaffolding                   |
| `packages/cli/src/adapters/windows/manifest.ts`       | services.json generation                     |
| `packages/cli/src/adapters/windows/v8-profiles.ts`    | V8 heap profiles per service type            |
| `packages/cli/src/errors.ts`                          | CLIError hierarchy, ExitCode enum            |
| `.deploy/windows/config/runtime/current`              | Version pointer (updated each build)         |
| `.deploy/windows/config/services.json`                | Service discovery manifest                   |
| `.env.local`                                          | Local connection strings, ports (gitignored) |
| `dotnet/AppHost/appsettings.json`                     | Service topology, infrastructure config      |
| `netscript.config.ts`                                 | Worker groups, sagas, tasks (Zod-validated)  |

## Compiling the CLI Itself

The CLI can be shipped as a self-contained `deploy-cli.exe` (no Deno runtime needed on target):

```bash
deno task deploy:compile
# Produces: .deploy/windows/scripts/deploy-cli.exe
```

Defined in `packages/cli/deno.json`:

```json
{
  "tasks": {
    "build": "deno compile --allow-all --target=x86_64-pc-windows-msvc --output=../../.deploy/windows/scripts/deploy-cli src/main.ts"
  }
}
```

## Workflow: Adding a New Service to Deployment

When a new service is added to the project:

1. **Register in appsettings.json**:
   ```json
   "Services": {
     "invoices": { "Port": 3003, "Entrypoint": "src/main.ts", "Workdir": "services/invoices" }
   }
   ```

2. **Run the build**:
   ```bash
   deno task deploy:build:verbose
   ```
   The CLI auto-discovers the new service and creates `bin/invoices.exe` + `config/invoices.xml`.

3. **Reinstall services** (if already installed):
   ```bash
   deno task deploy:uninstall   # removes old set
   deno task deploy:install     # registers new set
   deno task deploy:start
   ```

## Workflow: Adjusting a Job Schedule at Runtime

Without redeploying:

1. Edit `.deploy/windows/config/runtime/jobs/v1.0.0.json`:
   ```json
   { "id": "orders-daily-export", "enabled": true, "schedule": "0 3 * * *" }
   ```

2. The workers plugin process reads overrides at startup (or on SIGHUP if implemented). No
   recompile, no reinstall needed.

3. To reset to compiled defaults:
   ```bash
   deno task deploy:build:skip-compile --force-runtime-config
   ```
