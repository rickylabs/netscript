# Infrastructure & Aspire Orchestration

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> How .NET Aspire orchestrates all services, databases, and workers with config-driven code
> generation.

## Aspire Architecture

```
netscript.config.ts + appsettings.json
            |
    Code Generation (deno task generate)
            |
    dotnet/.generated/
    ├── Services.g.cs    # Service extension methods
    ├── Resources.g.cs   # Database/cache resources
    ├── Plugins.g.cs     # Plugin service extensions
    ├── Workers.g.cs     # Worker/scheduler modes
    └── Sagas.g.cs       # Saga processor extensions
            |
    dotnet/AppHost/Program.cs
            |
    `deno task dev` (aspire run)
            |
    Running Application (all services, DBs, workers, frontend)
```

## Configuration Sources

### appsettings.json (Primary for Aspire)

```json
{
  "ConnectionStrings": {
    "mysql": "Server=mysql03.prodague.local;Port=3306;Database=netscript;...",
    "garnet": "127.0.0.1:6379"
  },
  "NetScript": {
    "Databases": {
      "postgres": { "Engine": "Postgres", "ImageTag": "18", "Persistent": true }
    },
    "Cache": {
      "garnet": { "Engine": "Garnet", "DataPath": "data/garnet" }
    },
    "Services": {
      "users": { "Port": 3000, "Entrypoint": "src/main.ts", "Workdir": "services/users" },
      "products": { "Port": 3001, ... },
      "orders": { "Port": 3002, ..., "DependsOn": ["users", "products"] }
    },
    "Plugins": {
      "workers-api": { "Port": 8091, "RequiresKv": true, "RequiresDb": true },
      "sagas-api": { "Port": 8092, "RequiresKv": true, "RequiresDb": true }
    },
    "Workers": {
      "Binaries": {
        "combined": { "Entrypoint": "bin/combined.ts" },
        "worker": { "Entrypoint": "bin/worker.ts" },
        "scheduler": { "Entrypoint": "bin/scheduler.ts" }
        // triggers also has a plugin-owned binary: plugins/triggers/src/runtime/trigger-processor.ts
      }
    }
  }
}
```

### netscript.config.ts (Primary for Deno)

- Services, workers, sagas, tasks, databases, deployment config
- Zod-validated at load time
- Topic-based worker groups with scaling and retention

## Program.cs Resource Orchestration

```csharp
// 1. Configure OTLP for Deno native OTEL
Environment.SetEnvironmentVariable("DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL", "http://localhost:4318");

// 2. Add infrastructure
var databases = builder.AddNetScriptDatabases();    // MySQL (external) + Postgres (container)
var caches = builder.AddNetScriptCaches();          // Garnet
var kv = /* Garnet or Deno KV */;

// 3. Add services
var services = builder.AddNetScriptServices(db: primaryDb);  // users, products, orders

// 4. Add plugins
var plugins = builder.AddNetScriptPlugins(db: primaryDb, kv: kv);  // workers-api, sagas-api

// 5. Add workers
var workers = builder.AddWorkers(kv, db, services, plugins);  // Dev: combined mode

// 6. Add sagas
var sagas = builder.AddSagas(kv, db, services, plugins);  // Saga processor

// 6b. Add triggers (plugins/triggers/ — trigger processor plugin)
var triggers = builder.AddTriggers(kv, db, services, plugins);  // Trigger processor

// 7. Add frontend
var frontend = builder.AddNetScriptApps(kv, services, plugins);

// 8. Add dev tools
builder.AddPrismaStudio(primaryDb);
```

## Database Modes

| Mode          | Behavior                                                       |
| ------------- | -------------------------------------------------------------- |
| **Container** | Aspire manages Docker container (Postgres, MySQL, MSSQL)       |
| **External**  | Connection string in `ConnectionStrings` section, no container |

**Auto-detection**: If `ConnectionStrings:{name}` exists -> External mode. Otherwise -> Container
mode.

### Current Setup

- **MySQL**: External (production server at mysql03.prodague.local)
- **PostgreSQL**: Container (Postgres 18 with persistent volume)
- **Garnet**: Container by default. If `.env.local` provides `GARNET_HOST`, `GARNET_PORT`,
  `GARNET_URI`, or `ConnectionStrings__garnet`, Aspire treats it as an external cache endpoint; keep
  those values commented for container mode, or start a compatible local Garnet/Redis service
  yourself.

## Deno OpenTelemetry Integration

```csharp
// Extension method: WithDenoOpenTelemetry()
service
  .WithEnvironment("OTEL_DENO", "true")
  .WithEnvironment("OTEL_SERVICE_NAME", serviceName)
  .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")
  .WithEnvironment("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")
  .WithEnvironment("OTEL_TRACES_SAMPLER", "always_on")
  .WithEnvironment("OTEL_BSP_SCHEDULE_DELAY", "1000")
  .WithEnvironment("OTEL_METRIC_EXPORT_INTERVAL", "1000");
```

All services get OTEL configured automatically. Aspire Dashboard at port 18888 collects traces,
metrics, and logs.

## Worker Deployment Modes

### Development (Combined)

```csharp
var worker = builder.AddWorkers(kv, db, services, plugins, concurrency: 2);
// Runs: workers/bin/combined.ts (scheduler + worker in one process)
// Watch mode: --watch-hmr
```

### Production (Separated)

```csharp
var scheduler = builder.AddScheduler(kv, db, services, plugins);  // 1 instance
var worker1 = builder.AddWorker(kv, db, services, plugins, concurrency: 5);  // N instances
var worker2 = builder.AddWorker(kv, db, services, plugins, concurrency: 5);
```

### Triggers (Combined)

```csharp
var triggers = builder.AddTriggers(kv, db, services, plugins);
// Runs: plugins/triggers/src/runtime/trigger-processor.ts — the trigger processor entry point
// Uses startTriggerProcessorRuntime() from @netscript/plugin-triggers
// Consumes @netscript/runtime-config for hot-reload of trigger definitions
```

## Prisma CLI Integration

Aspire provides database connection strings to Prisma CLI:

```bash
# Via deno tasks
deno task db:init      # First-time Postgres database creation/migration
deno task db:migrate   # Apply migrations to the configured Postgres target
deno task db:seed      # Seed required runtime data
deno task db:generate  # Generate Prisma client
deno task db:status    # Inspect migration status
```

For a fresh worktree or a fresh Aspire data volume, run `deno task db:init` and `deno task db:seed`
before the first `aspire start`/`deno task dev`. Without this bootstrap step, Aspire can start
Postgres and Prisma Studio, but DB-dependent services and plugins will fail or wait because required
databases and tables do not exist yet.

## Service Reference Injection

Aspire injects service URLs as environment variables:

```
services__users__http__0=http://localhost:3000
services__products__http__0=http://localhost:3001
services__orders__http__0=http://localhost:3002
services__workers-api__http__0=http://localhost:8091
services__sagas-api__http__0=http://localhost:8092
```

Services and plugins also get references to databases, KV stores, and each other:

```csharp
service
  .WithReference(db).WaitFor(db)        // Database dependency
  .WithKvReference(kv).WaitFor(kv)      // KV store dependency
  .WithReference(users.GetEndpoint("http"))  // Service dependency
```

## Windows Deployment

```bash
deno task deploy:build                # Compile to standalone executables + generate configs
deno task deploy:build:skip-compile   # Regenerate configs only (no compilation)
deno task deploy:install              # Install Windows services via Servy (requires admin)
deno task deploy:start                # Start all services
deno task deploy:status               # Show service status
deno task deploy:logs                 # Tail service logs
deno task deploy:uninstall            # Remove services from Servy (requires admin)
```

**Process**: `deno compile` each service → Generate Servy XML configs → Write `services.json`
manifest → Scaffold `runtime/` override files

**See**: [11-cli-deployment.md](./11-cli-deployment.md) for complete reference including config
loading, infrastructure detection, V8 profiles, and runtime overrides.

## Key Files

| File                                                | Purpose                                          |
| --------------------------------------------------- | ------------------------------------------------ |
| `dotnet/AppHost/Program.cs`                         | Aspire orchestration entry point                 |
| `dotnet/AppHost/appsettings.json`                   | Infrastructure configuration                     |
| `dotnet/.generated/Services.g.cs`                   | Generated service extension methods              |
| `dotnet/.generated/Resources.g.cs`                  | Generated database/cache resources (~1060 lines) |
| `dotnet/.generated/Plugins.g.cs`                    | Generated plugin service extensions              |
| `dotnet/.generated/Workers.g.cs`                    | Generated worker/scheduler modes                 |
| `dotnet/.generated/Sagas.g.cs`                      | Generated saga processor extensions              |
| `dotnet/ServiceDefaults/Extensions.cs`              | WithDenoOpenTelemetry() extension                |
| `dotnet/AppHost/AppHost.csproj`                     | Aspire project dependencies                      |
| `plugins/triggers/src/runtime/trigger-processor.ts` | Trigger processor entry point                    |
| `plugins/triggers/mod.ts`                           | Triggers plugin definition                       |
