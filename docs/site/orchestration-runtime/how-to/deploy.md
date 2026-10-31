---
layout: layouts/base.vto
title: Deploy a workspace
description: Run the workspace on a container host, a VM, or a cloud target, and see what the scaffold wires for you.
templateEngine: [vento, md]
order: 105
oldUrl: /how-to/deploy/
---

# Deploy a workspace

This recipe takes the workspace you scaffolded with `netscript init` to a container host, a VM or a
managed platform, and states what the scaffold wires for you and what you still own.

The scaffold describes every process once in `appsettings.json`, gives each one a runnable Deno
entrypoint with explicit permissions, and generates the Aspire AppHost that orchestrates them
locally and publishes deployment artifacts for the targets you configure. The CLI routes deploy
commands to Deno Deploy (`netscript deploy deno-deploy <op>`) and to the Aspire-backed targets
(`netscript deploy docker|compose|kubernetes|azure-aca|azure-app-service|azure-aks|cloud-run <op>`).

| | What you get |
| --- | --- |
| **Wired** | A declarative resource graph in `appsettings.json` (ports, entrypoints, permissions, environment variables, dependencies), runnable per-process Deno entrypoints, and the Aspire AppHost (`aspire/apphost.mts`) for local orchestration. |
| **Generated CI starters** | `.github/workflows/deploy-compose-ghcr.yml`, `.github/workflows/deploy-deno-deploy.yml` and `.github/workflows/deploy-bare-metal.yml`. |
| **Delegated** | Docker/Compose, Kubernetes and Azure target commands call `aspire publish`, `aspire deploy` and `aspire destroy` against the generated AppHost; Aspire emits the manifests and provisions supported resources. Cloud Run follows the Docker-image provider lane: Docker builds and pushes the image, then `gcloud run deploy` applies it. |
| **Yours** | There is no generated `Dockerfile`, `docker-compose.yml` or finished cloud infrastructure stack. `netscript.config.ts` ships an empty `deploy: {}` block unless you configure a target. Cloud accounts, cluster credentials, registry access, RBAC, subscriptions, regions and quotas are operator prerequisites: the CLI shells out to Aspire, Docker or gcloud and creates no credentials. |

<!-- caveat: arch-debt:cli-deploy-artifacts-missing -->

Windows deploy settings live under `deploy.targets.windows` (previously `deploy.windows`).

## Prerequisites

You need a working, type-checked workspace. If you haven't built one, start with the
[Quickstart](/quickstart/) and the [Storefront tutorial](/tutorials/storefront/). The
[Aspire explanation](/explanation/aspire/) covers why the AppHost lives in its own `aspire/` folder
and how it provisions Postgres and Redis.

## The mental model: three layers

A NetScript deployment has three layers, and you choose how much of each you keep in production:

| Layer | In development | In production |
| --- | --- | --- |
| Backing services | Aspire provisions Postgres (recommended; `mysql`, `mssql` or `sqlite` via `--db`) and Redis (the default `--cache-backend`; `garnet` and `deno-kv` are alternatives) as containers. `sqlite` is file-backed and has no container. | You bring your own: a managed database and a managed Redis-compatible cache. |
| NetScript processes | Each API service, plugin service, background processor and the Fresh app is one Deno process with an entrypoint, a port and an explicit permission set, all declared in `appsettings.json`. | The same processes, started by Aspire or by your own supervisor. |
| Orchestration | Aspire's AppHost wires the graph together. | Keep Aspire, which can publish a deployment manifest, or drop it and run each process yourself. |

## Step 1 — Know your deployable units (`appsettings.json`)

`appsettings.json` is the single source of truth for what runs. The CLI writes it during
`netscript init` and updates it on every `netscript plugin install`. Every Aspire resource, and
every process you would deploy by hand, is described there. Ports are assigned at scaffold time:
read them from the scaffold output, `appsettings.json` or the Aspire dashboard. With the four
first-party plugins installed, the graph looks like this:

| Resource | Role | Notes |
| --- | --- | --- |
| `users` | service | Example oRPC service. Entrypoint `src/main.ts`, runtime `deno`. RPC mounts under `/api/rpc/*`. |
| `streams` | plugin | Durable-streams runtime service. `RequiresDb=false`, `RequiresKv=false`. The producer runtime is real; see [Durable streams](/durable-workflows/streams/). |
| `workers-api` | plugin | Workers API. Requires DB and KV. References `streams`. |
| `sagas-api` | plugin | Sagas API. Requires DB and KV. References `workers-api` and `streams`. |
| `triggers-api` | plugin | Triggers API. A typed v1 oRPC contract for trigger and event introspection and management; the webhook ingress endpoint `POST /api/v1/webhooks/:triggerId` stays a raw HMAC-verifying route. Requires DB and KV. References `workers-api` and `streams`. |
| `auth-api` | plugin, optional | Joins the graph when you add the auth plugin. An oRPC service with six endpoints under `/api/v1/auth/{signin,callback,signout,sessions/revoke,session,me}`, backed by one backend selected with `NETSCRIPT_AUTH_BACKEND` (default `kv-oauth`). |
| `workers` / `sagas` | background processor | Generated entrypoints `workers/runtime.ts` and `sagas/runtime.ts`. Watch mode and telemetry on. Workers runtime pool via `WORKERS_CONCURRENCY`; sagas via `SAGA_CONCURRENCY`. |
| `triggers` | background processor | Entrypoint `src/runtime/trigger-processor.ts`. Concurrency 10 via `TRIGGER_CONCURRENCY`. |
| `dashboard` | app | Fresh frontend. References service `users`. |
| `postgres` / `redis` | infrastructure | `Mode=Container` in development. `PrimaryDatabase=postgres`, `PrimaryCache=redis` (the default; `garnet` via `--cache-backend garnet`). |

Each entry carries what a deploy needs: `Runtime`, `Port`, `Entrypoint`, `Workdir`,
`RequiresDb`/`RequiresKv`, the Deno `Permissions` array, the concurrency environment variable and
`PluginReferences` (the wiring order). When you containerize or write systemd units, copy these
values verbatim.

{{ comp callout { type: "warning", title: "Reproduce permissions exactly" } }}
The <code>Permissions</code> array on each resource is the exact Deno permission set that process needs. For example, <code>workers-api</code> runs with <code>--unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run</code>, while <code>sagas-api</code> and <code>triggers-api</code> use <code>--unstable-kv --allow-all</code>. A missing <code>--unstable-kv</code> crashes any DB- or KV-backed process at startup.
{{ /comp }}

## Step 2 — Build and validate a release artifact

Each Deno process runs from source; there is no build step that produces a single bundle. Your
build is: validate, cache dependencies and, optionally, pre-generate the database client and
plugin registries so the container does no generation at boot.

1. Validate the workspace:

   ```bash
   # From the workspace root — prove the graph is healthy before you ship it.
   deno task check
   deno task lint
   deno task test
   ```

2. Cache each deployable entrypoint:

   ```bash
   # Warm the module cache so production start-up does no network fetch.
   # Cache each deployable entrypoint you intend to run.
   deno cache services/users/src/main.ts
   deno cache plugins/workers/services/src/main.ts
   deno cache plugins/sagas/services/src/main.ts
   deno cache plugins/triggers/services/src/main.ts
   ```

3. Pre-generate the Prisma client and plugin registries:

   ```bash
   # Requires Aspire (and therefore Postgres) up first — see the DB callout below.
   # Bake the Prisma client + plugin registries into the artifact so boot is deterministic.
   netscript db generate
   netscript generate plugins
   ```

{{ comp callout { type: "warning", title: "Database commands need a live Postgres" } }}
Every <code>netscript db &lt;cmd&gt;</code> talks to a live Postgres, which the scaffold provisions through Aspire. Run <code>cd aspire &amp;&amp; aspire start</code> before any <code>netscript db init</code>, <code>db generate</code> or <code>db seed</code>. With no Postgres reachable, for example in an isolated CI container, the command fails fast. In production, point the same commands at your managed Postgres with <code>POSTGRES_URI</code> or <code>DATABASE_URL</code>. <a href="/data-persistence/how-to/database-migration/">Database migration</a> has the full sequence.
{{ /comp }}

## Step 3 — Provision backing services

In production, provision Postgres and Redis as durable, managed resources instead of Aspire
containers, and pass their connection details to NetScript through environment variables.
NetScript reads the database URL from `POSTGRES_URI` (falling back to `DATABASE_URL`) and
normalizes engine-specific connection strings to a URL in `database/postgres/prisma.config.ts`.

{{ comp.apiTable({ caption: "Production environment a NetScript deployment expects", rows: [
  { name: "POSTGRES_URI", type: "string (url)", desc: "Primary Postgres connection. <code>DATABASE_URL</code> is the accepted fallback. Read by Prisma config." },
  { name: "REDIS_URI / cache url", type: "string", desc: "Redis-compatible cache endpoint for the <code>redis</code> KV/cache resource (the default backend). With <code>--cache-backend garnet</code> the key is <code>GARNET_URI</code> for the <code>garnet</code> resource (managed Redis or Garnet in prod)." },
  { name: "PORT", type: "number", desc: "Per-process listen port. Each service reads it and falls back to its default (assigned dynamically per project at scaffold time)." },
  { name: "OTEL_EXPORTER_OTLP_ENDPOINT", type: "string (url)", desc: "OTLP collector. The AppHost injects the allocated local collector endpoint (http/protobuf)." },
  { name: "NETSCRIPT_SAGA_STORE", type: "kv | prisma", desc: "Durable saga store backend (mandatory when sagas run). Also settable via appsettings <code>sagas.store.backend</code>." },
  { name: "NETSCRIPT_AUTH_BACKEND", type: "string", desc: "Active auth backend if the auth plugin is installed. Default <code>kv-oauth</code>." },
  { name: "WORKERS_CONCURRENCY", type: "number", desc: "Workers runtime process pool size (default 2)." },
  { name: "SAGA_CONCURRENCY", type: "number", desc: "Sagas background processor concurrency (default 2)." },
  { name: "TRIGGER_CONCURRENCY", type: "number", desc: "Triggers background processor concurrency (default 10)." }
] }) }}

The `Otel.HttpEndpoint`, `Databases.postgres`, `Cache.redis` (or `Cache.garnet` with
`--cache-backend garnet`) and per-process `ConcurrencyEnvVar` values in `appsettings.json` list
every setting to externalize. Treat that file as the contract between your infrastructure and the
NetScript processes.

{{ comp callout { type: "important", title: "Choose queue and saga backends before you ship" } }}
<strong>Queue</strong> has four backends: Deno KV, Redis, RabbitMQ and PostgreSQL. Auto-discovery probes RabbitMQ → Redis → Deno KV only; PostgreSQL is explicit-provider only (<code>provider: 'postgres'</code> with <code>connection.postgres.{url, tableName}</code>). <strong>Sagas</strong> persist durable runtime state to <code>kv</code> or <code>prisma</code>, selected by <code>NETSCRIPT_SAGA_STORE</code> (or appsettings). The selection is mandatory: the runtime throws if it is unset. The Prisma path writes the <code>saga_runtime_*</code> tables. See <a href="/data-persistence/kv-queues-cron/">Queues &amp; cron</a> and <a href="/durable-workflows/sagas/">Durable sagas</a> for the backend matrices.
{{ /comp }}

## Step 4 — Choose an orchestration path

Pick based on whether your target understands Aspire:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Keep Aspire",
    lang: "bash",
    code: "# The AppHost is a TypeScript/Node project under aspire/ (apphost.mts).\n# Locally it provisions Postgres + Redis and wires every process.\ncd aspire\naspire restore   # one-time: restore the TS AppHost SDK\naspire start       # boots the full graph; dashboard at the URL Aspire prints\n\n# Aspire 13.x can publish/deploy target artifacts from the same AppHost.\nnetscript deploy kubernetes plan --project-root .\nnetscript deploy kubernetes up --project-root ."
  },
  {
    label: "Drop Aspire (--no-aspire)",
    lang: "bash",
    code: "# Scaffold without the orchestration layer, then run processes yourself.\nnetscript init my-app --no-aspire\n\n# You now own provisioning Postgres + a cache, and starting each process.\n# Bring-your-own-supervisor: systemd, a container per process, or a PaaS.\n# Start the Fresh app directly during dev:\ndeno task --cwd apps/dashboard dev"
  }
] }) }}

`aspire/apphost.mts` is a generated TypeScript/Node AppHost (language `typescript/nodejs`, Aspire
SDK 13.x, package `Aspire.Hosting.PostgreSQL`), isolated in `aspire/` so its Node dependency graph
never leaks into the Deno root. `netscript.config.ts` records the same path under `aspire.appHost`
(`'aspire/apphost.mts'`). Aspire allocates the dashboard and OTLP endpoints at startup; use the URL Aspire prints.

### Aspire cloud targets

The Aspire-backed target routers share one shape:

```bash
# Generate artifacts without applying them.
netscript deploy kubernetes plan --project-root . --output-dir .deploy/kubernetes

# Apply/provision through the validated AppHost platform integration.
netscript deploy azure-aks up --project-root . --output-dir .deploy/azure-aks

# Tear down the previously deployed target.
netscript deploy azure-aks down --project-root . --output-dir .deploy/azure-aks
```

**Kubernetes.** Add the Aspire Kubernetes integration to the TypeScript AppHost
(`aspire add kubernetes`, then `builder.addKubernetesEnvironment('k8s')`). Use
`publishAsKubernetesService(...)` in `aspire/apphost.mts` to customize a service's manifest:
replicas, labels, annotations or extra manifests. `plan` runs
`aspire publish --apphost <path> --output-path .deploy/kubernetes`, and Aspire emits a Helm chart
with `Chart.yaml`, `values.yaml` and `templates/`. Apply it with your normal cluster workflow:

```bash
kubectl config current-context
helm upgrade --install my-netscript-app .deploy/kubernetes

# Or inspect/apply rendered manifests if your release process requires kubectl.
helm template my-netscript-app .deploy/kubernetes > .deploy/kubernetes/rendered.yaml
kubectl apply -f .deploy/kubernetes/rendered.yaml
```

**Azure.** Configure the matching AppHost hosting integration before you use the router. The CLI
checks that the AppHost source contains an Azure Container Apps, Azure App Service or Azure
Kubernetes marker before it runs `aspire publish|deploy --apphost <path>`. Azure CLI login,
subscription and location parameters, provider feature registration and RBAC are operator
prerequisites.

**Cloud Run.** Configure the Docker-image provider fields, `registry` and `imageName`:

{{ comp.codeBlock({ filename: "netscript.config.ts", lang: "ts", code: "export default defineConfig({\n  // ...\n  deploy: {\n    targets: {\n      'cloud-run': {\n        registry: 'us-docker.pkg.dev/acme/prod',\n        imageName: 'orders-api:latest',\n      },\n    },\n  },\n});\n" }) }}

`netscript deploy cloud-run up` runs `docker build -t <registry>/<imageName> .`,
`docker push <registry>/<imageName>`, then
`gcloud run deploy <service> --image <registry>/<imageName> --quiet`.

## Step 5 — Wire generated CI and promotion

New Aspire-backed workspaces include three GitHub Actions starter workflows under
`.github/workflows/`. Before you treat them as production release jobs, fill in repository
secrets, GitHub environment protection, registry, host and cloud credentials, and target-specific
configuration.

| Workflow | Target | What it does |
| --- | --- | --- |
| `deploy-compose-ghcr.yml` | Compose + GHCR | Restores the Aspire AppHost, emits Compose output with `netscript deploy compose plan`, builds and pushes images to GHCR, then runs `netscript deploy docker up` with `--clear-cache`. |
| `deploy-deno-deploy.yml` | Deno Deploy | Runs workspace checks, then calls `netscript deploy deno-deploy up` with GitHub secrets and variables for the Deno Deploy token, organization and app. |
| `deploy-bare-metal.yml` | Bare metal | Compiles service artifacts with `netscript deploy build` on Linux and Windows runners, then uploads the output as workflow artifacts for host-specific installation. |

Treat the workflow `environment` input as the promotion ladder: `development`, then `staging`,
then `production`. In GitHub, map those names to protected environments and keep secrets
environment-scoped, so a staging run can't read production credentials. Promote the same reviewed
commit through each environment; don't rebuild from a different branch between staging and
production.

{{ comp callout { type: "caution", title: "Don't persist Aspire deployment state in CI" } }}
Aspire caches deployment state under <code>~/.aspire/deployments/{AppHostSha}/{environment}.json</code>, and it may contain plaintext values entered during deployment prompts. The generated Compose/GHCR workflow doesn't cache <code>~/.aspire/deployments</code> and passes <code>--clear-cache</code> to <code>netscript deploy docker up</code>, which forwards it to <code>aspire deploy --clear-cache</code>. Keep that behavior. Store durable values in GitHub environment secrets or your platform's secret manager, not in the Aspire deployment cache.
{{ /comp }}

## Step 6 — Run a process by hand (the bare-metal primitive)

Under every option above, the unit is the same: one Deno process started from an entrypoint with
the exact permission set from `appsettings.json`. A container `CMD`, a systemd `ExecStart` or a
PaaS start command all reduce to this. For the workers API on its assigned port (for example
`49152`):

```bash
# Run from the workspace root. Flags and entrypoint come straight from appsettings.json.
# Replace 49152 with the port assigned to your workers-api service.
PORT=49152 \
deno run \
  --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run \
  plugins/workers/services/src/main.ts
```

The background processor that executes jobs runs its own entrypoint:

```bash
# Start the generated runtime entry for the chosen background processor.
WORKERS_CONCURRENCY=2 \
deno run \
  --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run \
  workers/runtime.ts
```

Repeat this for every enabled resource and you have a container-free deployment. To containerize,
make each process one image whose `CMD` is the matching `deno run` line, or use Aspire's container
publishing. Orchestrate the images with Compose or your platform, honoring the `PluginReferences`
start order: streams → workers → sagas/triggers, plus `auth-api` when present.

## Step 7 — Verify the deployment

With your processes running against real backing services, call the health endpoints to confirm
the graph is wired. These are the routes the local runtime exposes; substitute your production
host and each service's assigned port.

| Endpoint | Service | What it proves |
| --- | --- | --- |
| `GET /health` | Workers API | Workers API health. |
| `GET /health/live` | Sagas API | Sagas API liveness. |
| `GET /health` | Triggers API | Triggers API health. |
| `GET /api/v1/workers/jobs` | Workers API | Lists registered worker jobs: the jobs registry was generated. |
| `GET /api/v1/sagas/sagas` | Sagas API | Lists registered sagas: saga metadata is in KV. |
| `POST /api/v1/webhooks/inbound/generic` | Triggers API | An inbound webhook enqueues the workers health-check job. |
| `GET /api/v1/events?limit=10` | Triggers API | Recent trigger events. |
| `GET /api/v1/auth/session` | Auth API | Auth session probe, only if the auth plugin is installed. |
| `the URL Aspire prints` | Aspire dashboard | Every resource, health, logs and distributed traces (Aspire path only). |

```bash
# Smoke a deployed graph (replace ports with the ones assigned to your services).
curl -fsS http://localhost:<workers-port>/health
curl -fsS http://localhost:<sagas-port>/health/live
curl -fsS http://localhost:<triggers-port>/health
ns-workers executions --limit=10 --json
```

If every health endpoint responds and the workers CLI reports the expected executions, the processes are
running with their permissions, reaching Postgres and KV, and discovering their registries.

## Next steps

To push a stateless entrypoint to a managed platform, follow
[Deploy to Deno Deploy](/orchestration-runtime/how-to/deploy-deno-deploy/). For every command
grouped by workflow, see the [CLI cheat sheet](/cli-reference/).
