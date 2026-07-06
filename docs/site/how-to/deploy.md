---
layout: layouts/base.vto
title: Deploy
templateEngine: [vento, md]
prev: { label: "Build a durable chat", href: "/how-to/build-a-durable-chat/" }
next: { label: "Deploy to Deno Deploy", href: "/how-to/deploy-deno-deploy/" }
---

# Deploy a NetScript workspace

**Goal:** take the workspace you scaffolded with `netscript init` and run it somewhere
other than your laptop — a container host, a VM, or a managed platform — with clear
expectations about what the scaffold wires for you and what you still own.

This is a task recipe, not a one-click button. NetScript is in alpha, and the scaffold is
deliberately minimal about deployment: it gives you a single declarative description of every
process (`appsettings.json`), runnable Deno entrypoints with explicit permissions, the Aspire
AppHost that orchestrates them locally and can publish deployment artifacts for targets you
configure in it, and starter GitHub Actions workflows for the shipped deployment targets. The CLI
has thin deploy routers for Deno Deploy, Docker/Compose, Kubernetes, Azure, and Cloud Run, but it
does **not** generate a `Dockerfile`, a `docker-compose.yml`, or a finished cloud infrastructure
stack for you — target-specific infrastructure still lives in Aspire and your cloud account,
assembled from the verified facts below.

{{ comp callout { type: "important", title: "What is wired vs. what is manual" } }}
<strong>Wired:</strong> a declarative resource graph in <code>appsettings.json</code> (ports,
entrypoints, permissions, env vars, dependencies), runnable per-process Deno entrypoints, and
the Aspire AppHost (<code>aspire/apphost.mts</code>) for local orchestration.
<strong>Generated CI starters:</strong> <code>.github/workflows/deploy-compose-ghcr.yml</code>,
<code>.github/workflows/deploy-deno-deploy.yml</code>, and
<code>.github/workflows/deploy-bare-metal.yml</code>.
<strong>Delegated:</strong> Docker/Compose, Kubernetes, and Azure target commands call
<code>aspire publish</code>, <code>aspire deploy</code>, and <code>aspire destroy</code> against the
generated AppHost code. Aspire emits the manifests and provisions supported resources; your
cloud account, cluster credentials, registry access, and RBAC remain yours. Cloud Run follows the
Docker-image provider lane: Docker builds and pushes the image, then <code>gcloud run deploy</code>
applies it.
<strong>Manual:</strong> there is <em>no</em> generated container image, compose file, or finished
cloud infrastructure stack. <code>netscript.config.ts</code> ships an empty <code>deploy: {}</code>
block unless you configure a target. You assemble the production target yourself from the primitives
below — every one of which is a verified fact you can copy verbatim.
<br><strong>Migration (#337):</strong> Windows deploy settings now live under
<code>deploy.targets.windows</code> (previously <code>deploy.windows</code>).
{{ /comp }}

{{ comp callout { type: "tip", title: "Generated CI follows the shipped targets" } }}
The scaffolded workflows cover the deploy surfaces that ship today:
<strong>Deno Deploy</strong> (<code>netscript deploy deno-deploy up</code>),
<strong>Compose/GHCR</strong> (<code>netscript deploy compose plan</code> +
<code>netscript deploy docker up</code>), and <strong>bare metal</strong>
(<code>netscript deploy build</code>). They are intentionally starter pipelines: fill in repository
secrets, GitHub environment protection, host credentials, and target-specific configuration before
you treat them as production release jobs. See
<a href="/how-to/deploy-deno-deploy/">Deploy to Deno Deploy</a> for the managed-platform command
reference.
{{ /comp }}

{{ comp callout { type: "tip", title: "Managed deployment commands" } }}
There is now a first-class, runnable managed-platform path:
<strong><code>netscript deploy deno-deploy &lt;op&gt;</code></strong> (<code>plan</code>/<code>up</code>/
<code>status</code>/<code>logs</code>/<code>down</code>) pushes a workspace to
<a href="https://deno.com/deploy">Deno Deploy</a> over the native <code>deno deploy</code> CLI, with a
preflight guard and <code>deploy.targets['deno-deploy']</code> config. Aspire-backed targets are
also routed: <code>netscript deploy docker|compose|kubernetes|azure-aca|azure-app-service|azure-aks|cloud-run &lt;op&gt;</code>
delegates to the target adapter. See
<a href="/how-to/deploy-deno-deploy/">Deploy to Deno Deploy</a> for Deno Deploy details.
{{ /comp }}

## Before you start

You need a working, type-checked workspace and a clear idea of where it is going. If you have
not built one yet, start with [Quickstart](/quickstart/) and
the [Storefront tutorial](/tutorials/storefront/). Then confirm the workspace is healthy
locally before you try to move it:

```bash
deno task check    # type-check apps, services, contracts
deno task lint
deno task test
```

For the orchestration model that underpins everything below — why the AppHost lives in its
own `aspire/` folder, and how it provisions Postgres and Redis — read the
[Aspire explanation](/explanation/aspire/) alongside this recipe.

## The mental model: three layers

A NetScript deployment is three layers, and you choose how much of each you keep in
production:

{{ comp.featureGrid({ items: [
  {
    title: "1. Backing services",
    body: "Postgres (the recommended database; `mysql`, `mssql`, or `sqlite` are first-class alternatives via `--db`) and Redis (KV/cache — the default `--cache-backend`; `garnet` and `deno-kv` are alternatives). In dev, Aspire provisions Postgres/MySQL/SQL Server as containers (`sqlite` is file-backed, no container) and Redis as a container. In production you bring your own — managed database, managed Redis-compatible cache.",
    icon: "▣"
  },
  {
    title: "2. NetScript processes",
    body: "Each API service, plugin service, background processor, and the Fresh app is one Deno process with an entrypoint, a port, and an explicit permission set — all declared in appsettings.json.",
    icon: "◆"
  },
  {
    title: "3. Orchestration",
    body: "Aspire's AppHost wires the graph together locally. In production you can keep Aspire (it can publish a deployment manifest) or drop it and run each process yourself with your own supervisor.",
    icon: "◎"
  }
] }) }}

## Step 1 — Know your deployable units (`appsettings.json`)

`appsettings.json` is the single source of truth for *what runs*. The CLI writes it during
`netscript init` and updates it as you `netscript plugin install`. Every Aspire resource — and
every process you would deploy by hand — is described there. From a workspace with the four
first-party plugins installed, the graph looks like this:

{{ comp.apiTable({ caption: "Resources declared in appsettings.json (verified from a scaffolded workspace)", rows: [
  { name: "users", type: "service · :3000 (the scaffold default; the exact port is OS-allocated from the SERVICE range starting at 3000)", desc: "Example oRPC service. Entrypoint <code>src/main.ts</code>, runtime <code>deno</code>. RPC mounts under <code>/api/rpc/*</code>." },
  { name: "streams", type: "plugin · :4437", desc: "durable-streams runtime service. <code>RequiresDb=false</code>, <code>RequiresKv=false</code>. Real producer runtime — see Step 6." },
  { name: "workers-api", type: "plugin · :8091", desc: "Workers API. Requires DB + KV. References <code>streams</code>." },
  { name: "sagas-api", type: "plugin · :8092", desc: "Sagas API. Requires DB + KV. References <code>workers-api</code>, <code>streams</code>." },
  { name: "triggers-api", type: "plugin · :8093", desc: "Triggers API. Typed v1 oRPC contract for trigger/event introspection + management; the webhook ingress endpoint <code>POST /api/v1/webhooks/:triggerId</code> stays a raw HMAC-verifying route by design. Requires DB + KV. References <code>workers-api</code>, <code>streams</code>." },
  { name: "workers / sagas", type: "background processor", desc: "Entrypoint <code>bin/combined.ts</code>. Watch mode + telemetry on. Workers runtime pool via <code>WORKERS_CONCURRENCY</code>; sagas via <code>SAGA_CONCURRENCY</code>." },
  { name: "triggers", type: "background processor", desc: "Entrypoint <code>src/runtime/trigger-processor.ts</code>. Concurrency 10 via <code>TRIGGER_CONCURRENCY</code>." },
  { name: "dashboard", type: "app · :8010", desc: "Fresh frontend. References service <code>users</code>." },
  { name: "postgres / redis", type: "infrastructure", desc: "<code>Mode=Container</code> in dev. <code>PrimaryDatabase=postgres</code>, <code>PrimaryCache=redis</code> (the default; <code>garnet</code> via <code>--cache-backend garnet</code>)." }
] }) }}

{{ comp callout { type: "note", title: "Auth service is opt-in (port :8094)" } }}
If you add the auth plugin, a fifth API service — <code>auth-api</code> on <strong>:8094</strong>
— joins the graph. It is an oRPC service exposing five endpoints under
<code>/api/v1/auth/{signin,callback,signout,session,me}</code>, backed by one active backend
selected via <code>NETSCRIPT_AUTH_BACKEND</code> (default <code>kv-oauth</code>). Treat it as
just another deployable unit: it has an entrypoint, a port, and a permission set in
<code>appsettings.json</code> like every other process.
{{ /comp }}

Each entry carries the exact information a deploy needs: `Runtime`, `Port`, `Entrypoint`,
`Workdir`, `RequiresDb`/`RequiresKv`, the Deno `Permissions` array, the concurrency env var,
and `PluginReferences` (the wiring order). When you containerize or write systemd units, copy
these values verbatim — do not guess them.

{{ comp callout { type: "note", title: "Permissions are deployment-critical" } }}
The <code>Permissions</code> array on each resource is the exact Deno permission set that
process needs — for example <code>workers-api</code> runs with
<code>--unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run</code>,
while <code>sagas-api</code> and <code>triggers-api</code> use <code>--unstable-kv --allow-all</code>.
Reproduce these flags exactly in your run command; a missing <code>--unstable-kv</code> will
crash any DB/KV-backed process at startup.
{{ /comp }}

## Step 2 — Build and validate a release artifact

There is no opinionated build step that produces a single bundle — each Deno process runs
from source. Your "build" is therefore: cache dependencies, type-check, and (optionally)
pre-generate the database client and plugin registries so the container does not do it at
boot.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Validate",
    lang: "bash",
    code: "# From the workspace root — prove the graph is healthy before you ship it.\ndeno task check\ndeno task lint\ndeno task test"
  },
  {
    label: "Cache deps",
    lang: "bash",
    code: "# Warm the module cache so production start-up does no network fetch.\n# Cache each deployable entrypoint you intend to run.\ndeno cache services/users/src/main.ts\ndeno cache plugins/workers/services/src/main.ts\ndeno cache plugins/sagas/services/src/main.ts\ndeno cache plugins/triggers/services/src/main.ts"
  },
  {
    label: "Pre-generate",
    lang: "bash",
    code: "# Requires Aspire (and therefore Postgres) up first — see the DB callout below.\n# Bake the Prisma client + plugin registries into the artifact so boot is deterministic.\nnetscript db generate\nnetscript generate plugins"
  }
] }) }}

{{ comp callout { type: "warning", title: "Aspire is step 2: Postgres comes up before any db command" } }}
Every <code>netscript db &lt;cmd&gt;</code> talks to a live Postgres. In the scaffold that
Postgres is provisioned <strong>by Aspire</strong>. So the order is always:
<code>cd aspire &amp;&amp; aspire start</code> (which brings Postgres and Redis up)
<strong>before</strong> any <code>netscript db init</code> / <code>db generate</code> /
<code>db seed</code>. Running a DB command with no Postgres reachable — for example in an
isolated CI container — fails fast. In production, point the same commands at your managed
Postgres via <code>POSTGRES_URI</code> or <code>DATABASE_URL</code> instead of relying on
Aspire. See <a href="/how-to/database-migration/">Database migration</a> for the full sequence.
{{ /comp }}

## Step 3 — Provision backing services

In production you do **not** run Postgres and Redis as throwaway Aspire containers. You
provision them as durable, managed resources and hand their connection details to NetScript
through environment variables. NetScript reads the database URL from `POSTGRES_URI` (falling
back to `DATABASE_URL`) and normalizes engine-specific connection strings to a URL — this is
handled in `database/postgres/prisma.config.ts`.

{{ comp.apiTable({ caption: "Production environment a NetScript deployment expects", rows: [
  { name: "POSTGRES_URI", type: "string (url)", desc: "Primary Postgres connection. <code>DATABASE_URL</code> is the accepted fallback. Read by Prisma config." },
  { name: "REDIS_URI / cache url", type: "string", desc: "Redis-compatible cache endpoint for the <code>redis</code> KV/cache resource (the default backend). With <code>--cache-backend garnet</code> the key is <code>GARNET_URI</code> for the <code>garnet</code> resource (managed Redis or Garnet in prod)." },
  { name: "PORT", type: "number", desc: "Per-process listen port. Each service reads it (e.g. <code>Deno.env.get('PORT') ?? '8091'</code>) and falls back to its default." },
  { name: "OTEL_EXPORTER_OTLP_ENDPOINT", type: "string (url)", desc: "OTLP collector. Dev defaults to <code>http://localhost:4318</code> (http/protobuf) via the Aspire dashboard." },
  { name: "NETSCRIPT_SAGA_STORE", type: "kv | prisma", desc: "Durable saga store backend (mandatory when sagas run). Also settable via appsettings <code>sagas.store.backend</code>." },
  { name: "NETSCRIPT_AUTH_BACKEND", type: "string", desc: "Active auth backend if the auth plugin is installed. Default <code>kv-oauth</code>." },
  { name: "WORKERS_CONCURRENCY", type: "number", desc: "Workers runtime process pool size. Current Aspire metadata also emits <code>WORKER_CONCURRENCY</code>, but the runtime honors <code>WORKERS_CONCURRENCY</code>; set the runtime var." },
  { name: "SAGA_CONCURRENCY", type: "number", desc: "Sagas background processor concurrency (default 2)." },
  { name: "TRIGGER_CONCURRENCY", type: "number", desc: "Triggers background processor concurrency (default 10)." }
] }) }}

{{ comp callout { type: "tip", title: "appsettings.json is your config map" } }}
The <code>Otel.HttpEndpoint</code>, <code>Databases.postgres</code>, <code>Cache.redis</code> (or <code>Cache.garnet</code> when scaffolded with <code>--cache-backend garnet</code>),
and per-process <code>ConcurrencyEnvVar</code> values in <code>appsettings.json</code> tell you
every knob to externalize. Treat that file as the contract between your infrastructure and the
NetScript processes.
{{ /comp }}

{{ comp callout { type: "note", title: "Queue and saga durability backends are deploy-time choices" } }}
Two stateful subsystems pick a backend at deploy time, so decide before you ship:
<ul>
<li><strong>Queue</strong> has four backends — Deno KV, Redis, RabbitMQ, and PostgreSQL.
Auto-discovery probes RabbitMQ → Redis → Deno KV only; <strong>PostgreSQL is explicit-provider
only</strong> (<code>provider: 'postgres'</code> with <code>connection.postgres.{url, tableName}</code>).</li>
<li><strong>Sagas</strong> persist durable runtime state to <code>kv</code> or <code>prisma</code>,
selected by <code>NETSCRIPT_SAGA_STORE</code> (or appsettings). The selection is mandatory —
the runtime throws if it is unset. The Prisma path writes the <code>saga_runtime_*</code> tables.</li>
</ul>
See <a href="/capabilities/kv-queues-cron/">Queues &amp; cron</a> and
<a href="/capabilities/durable-sagas/">Durable sagas</a> for the full backend matrices.
{{ /comp }}

## Step 4 — Choose an orchestration path

This is the real fork in the road. Pick based on whether your target understands Aspire.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Keep Aspire",
    lang: "bash",
    code: "# The AppHost is a TypeScript/Node project under aspire/ (apphost.mts).\n# Locally it provisions Postgres + Redis and wires every process.\ncd aspire\naspire restore   # one-time: restore the TS AppHost SDK\naspire start       # boots the full graph; dashboard at https://localhost:18888\n\n# Aspire 13.x can publish/deploy target artifacts from the same AppHost.\nnetscript deploy kubernetes plan --project-root .\nnetscript deploy kubernetes up --project-root ."
  },
  {
    label: "Drop Aspire (--no-aspire)",
    lang: "bash",
    code: "# Scaffold without the orchestration layer, then run processes yourself.\nnetscript init my-app --no-aspire\n\n# You now own provisioning Postgres + a cache, and starting each process.\n# Bring-your-own-supervisor: systemd, a container per process, or a PaaS.\n# Start the Fresh app directly during dev:\ndeno task --cwd apps/dashboard dev"
  }
] }) }}

{{ comp callout { type: "note", title: "The AppHost is Node/TypeScript, not dotnet" } }}
<code>aspire/apphost.mts</code> is a generated <strong>TypeScript/Node</strong> AppHost
(language <code>typescript/nodejs</code>, Aspire SDK 13.x, package
<code>Aspire.Hosting.PostgreSQL</code>). It is intentionally isolated in <code>aspire/</code> so
its Node dependency graph never leaks into the Deno root. <code>netscript.config.ts</code> records
this same path under <code>aspire.appHost</code> (<code>'aspire/apphost.mts'</code>), so the
config metadata and the artifact you actually run agree. The
dashboard binds <code>:18888</code> and the OTLP collector listens on <code>:4318</code>.
{{ /comp }}

### Aspire cloud targets

The Aspire-backed target routers all share the same shape:

```bash
# Generate artifacts without applying them.
netscript deploy kubernetes plan --project-root . --output-dir .deploy/kubernetes

# Apply/provision through the validated AppHost platform integration.
netscript deploy azure-aks up --project-root . --output-dir .deploy/azure-aks

# Tear down the previously deployed target.
netscript deploy azure-aks down --project-root . --output-dir .deploy/azure-aks
```

For Kubernetes, add the Aspire Kubernetes integration to the TypeScript AppHost
(`aspire add kubernetes`, then `builder.addKubernetesEnvironment('k8s')`). Use
`publishAsKubernetesService(...)` in `aspire/apphost.mts` for per-service manifest
customization such as replicas, labels, annotations, or extra manifests. `plan`
runs `aspire publish --apphost <path> --output-path .deploy/kubernetes`; Aspire
emits a Helm chart with `Chart.yaml`, `values.yaml`, and `templates/`.

Apply the published chart with your normal cluster workflow:

```bash
kubectl config current-context
helm upgrade --install my-netscript-app .deploy/kubernetes

# Or inspect/apply rendered manifests if your release process requires kubectl.
helm template my-netscript-app .deploy/kubernetes > .deploy/kubernetes/rendered.yaml
kubectl apply -f .deploy/kubernetes/rendered.yaml
```

For Azure, configure the matching AppHost hosting integration before using the
router. The CLI validates the AppHost source contains an Azure Container Apps,
Azure App Service, or Azure Kubernetes marker before it shells
`aspire publish|deploy --apphost <path>`. Azure CLI login, subscription/location
parameters, provider feature registration, and RBAC are operator prerequisites.

For Cloud Run, configure the Docker-image provider fields:

```ts
export default defineConfig({
  // ...
  deploy: {
    targets: {
      'cloud-run': {
        registry: 'us-docker.pkg.dev/acme/prod',
        imageName: 'orders-api:latest',
      },
    },
  },
});
```

`netscript deploy cloud-run up` runs `docker build -t
<registry>/<imageName> .`, `docker push <registry>/<imageName>`, then `gcloud
run deploy <service> --image <registry>/<imageName> --quiet`.

## Step 5 — Wire generated CI and promotion

New Aspire-backed workspaces include three GitHub Actions starter workflows under
`.github/workflows/`:

{{ comp.apiTable({ caption: "Generated deployment workflows", rows: [
  { name: "deploy-compose-ghcr.yml", type: "Compose + GHCR", desc: "Restores the Aspire AppHost, emits Compose output with <code>netscript deploy compose plan</code>, builds/pushes images to GHCR, then runs <code>netscript deploy docker up</code> with <code>--clear-cache</code>." },
  { name: "deploy-deno-deploy.yml", type: "Deno Deploy", desc: "Runs workspace checks, then calls <code>netscript deploy deno-deploy up</code> using GitHub secrets and variables for the Deno Deploy token, organization, and app." },
  { name: "deploy-bare-metal.yml", type: "Bare metal", desc: "Compiles service artifacts with <code>netscript deploy build</code> on Linux and Windows runners, then uploads the output as workflow artifacts for host-specific installation." }
] }) }}

Treat the workflow `environment` input as the promotion ladder:
`development` first, then `staging`, then `production`. In GitHub, map those names to protected
environments and keep secrets environment-scoped so a staging run cannot accidentally read
production credentials. Promote the same reviewed commit through each environment; do not rebuild
from a different branch between staging and production.

{{ comp callout { type: "warning", title: "Do not persist Aspire deployment state in CI" } }}
Aspire deployment state is cached under <code>~/.aspire/deployments/{AppHostSha}/{environment}.json</code>
and may contain plaintext values entered during deployment prompts. The generated Compose/GHCR
workflow does not cache <code>~/.aspire/deployments</code> and passes <code>--clear-cache</code>
to <code>netscript deploy docker up</code>, which forwards it to <code>aspire deploy --clear-cache</code>.
Keep that behavior in CI. If you need durable values, store them in GitHub environment secrets or
your platform's secret manager, not in the Aspire deployment cache.
{{ /comp }}

## Step 6 — Run a process by hand (the bare-metal primitive)

Under every option above, the atomic unit is the same: one Deno process started from an
entrypoint with the exact permission set from `appsettings.json`. This is what a container
`CMD`, a systemd `ExecStart`, or a PaaS start command ultimately becomes. For the workers API
(`:8091`), it is:

```bash
# Run from the workspace root. Flags and entrypoint come straight from appsettings.json.
PORT=8091 \
deno run \
  --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run \
  plugins/workers/services/src/main.ts
```

The corresponding background processor (which actually executes jobs) runs its own
entrypoint:

```bash
# Workers + sagas background processors share bin/combined.ts; triggers uses its own.
WORKERS_CONCURRENCY=2 \
deno run \
  --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run \
  workers/bin/combined.ts
```

Map this pattern across every enabled resource and you have a complete, container-free
deployment. To containerize, each process becomes one image whose `CMD` is the matching
`deno run` line; orchestrate them with compose or your platform of choice, honoring the
`PluginReferences` start order (streams → workers → sagas/triggers, plus auth-api when present).

{{ comp callout { type: "warning", title: "Limits of the alpha scaffold" } }}
<ul>
<li>The CLI scaffold does not hand-author a <code>Dockerfile</code>, <code>docker-compose.yml</code>, or Kubernetes manifest. Docker/Compose, Kubernetes, and Azure artifacts are generated by Aspire from the AppHost code you configure; you write anything Aspire does not emit from the <code>appsettings.json</code> facts above.</li>
<li>Cloud Run uses the Docker-image provider lane (<code>docker build</code>, <code>docker push</code>, <code>gcloud run deploy</code>) and requires <code>registry</code> plus <code>imageName</code> in config.</li>
<li><code>netscript.config.ts</code> ships an empty <code>deploy: {}</code> block unless you configure a target. Generated workflows are starter CI definitions; you still provide registry, host, cloud, and secret-manager configuration before they are production release jobs.</li>
<li>Cluster/cloud auth, registry access, RBAC, subscriptions, regions, and provider quotas are operator prerequisites. The CLI shells to Aspire, Docker, or gcloud; it does not create credentials.</li>
<li>The <code>streams</code> service runs a <strong>real producer runtime</strong> (durable-streams over <code>@netscript/plugin-streams-core</code>, served on :4437) — deploy it as a first-class service. What is <em>not</em> production-ready is the manifest-helper layer: <code>@netscript/plugin-streams</code>'s <code>defineStreamProducer</code>/<code>defineStreamConsumer</code> <strong>throw <code>StreamUnsupportedOperationError</code></strong> by design (use <code>@netscript/plugin-streams-core</code> directly), and there is no in-process consumer <code>subscribe()</code> — consumption is HTTP/SSE.</li>
<li>The scaffold worker <code>createJobTools(ctx)</code> handler helpers (<code>trace.addEvent</code>, <code>withChildSpan</code>, <code>progress</code>) are still no-op stubs (tracked debt, fix planned). Job dispatch/execution traces still appear in Aspire automatically; for custom handler spans call <code>@netscript/telemetry</code> helpers directly.</li>
<li>DB commands assume a reachable Postgres — in CI/containers without Aspire, inject <code>POSTGRES_URI</code> yourself or the command fails fast.</li>
</ul>
<!-- caveat: arch-debt:cli-deploy-artifacts-missing -->
<!-- caveat: arch-debt:streams-manifest-helpers-unsupported -->
<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->
{{ /comp }}

## Step 7 — Verify the deployment

Once your processes are up against real backing services, hit the health endpoints to confirm
the graph is wired. These are the exact routes the local runtime exposes (substitute your
production host):

{{ comp.apiTable({ caption: "Health and liveness endpoints (verified live)", rows: [
  { name: "GET /health", type: ":8091", desc: "Workers API health." },
  { name: "GET /health/live", type: ":8092", desc: "Sagas API liveness." },
  { name: "GET /health", type: ":8093", desc: "Triggers API health (Hono)." },
  { name: "GET /api/v1/workers/jobs", type: ":8091", desc: "Lists registered worker jobs — proves the jobs registry generated." },
  { name: "GET /api/v1/sagas/sagas", type: ":8092", desc: "Lists registered sagas — proves saga metadata is in KV." },
  { name: "POST /api/v1/webhooks/inbound/generic", type: ":8093", desc: "Inbound webhook → enqueues the workers health-check job (end-to-end proof)." },
  { name: "GET /api/v1/events?limit=10", type: ":8093", desc: "Recent trigger events." },
  { name: "GET /api/v1/auth/session", type: ":8094", desc: "Auth session probe (only if the auth plugin is installed)." },
  { name: "(dashboard)", type: "https://localhost:18888", desc: "Aspire dashboard: every resource, health, logs, distributed traces (Aspire path only)." }
] }) }}

```bash
# Smoke a deployed graph (replace localhost with your host).
curl -fsS http://localhost:8091/health
curl -fsS http://localhost:8092/health/live
curl -fsS http://localhost:8093/health
curl -fsS "http://localhost:8091/api/v1/workers/jobs"
```

If every health endpoint returns and `/api/v1/workers/jobs` lists your jobs, the processes are
running with their permissions, reaching Postgres/KV, and discovering their registries — the
deployment is live.

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy to Deno Deploy",
    body: "The one runnable managed-platform path: netscript deploy deno-deploy plan/up/status/logs/down, the unstable-API guard, and deploy.targets['deno-deploy'] config.",
    href: "/how-to/deploy-deno-deploy/",
    icon: "◆"
  },
  {
    title: "How Aspire orchestrates it",
    body: "The AppHost graph, two-pass resource wiring, and why orchestration is a layer you can keep or drop.",
    href: "/explanation/aspire/",
    icon: "◎"
  },
  {
    title: "Database migration",
    body: "Run db init → generate → seed → status against Postgres — and why aspire start comes first.",
    href: "/how-to/database-migration/",
    icon: "▣"
  },
  {
    title: "Add OpenTelemetry",
    body: "Wire spans and traceparent propagation to your OTLP collector in production.",
    href: "/how-to/add-opentelemetry/",
    icon: "≋"
  }
] }) }}

For the full generated API of each deployable unit, see the reference:
[workers](/reference/workers/), [sagas](/reference/sagas/), [triggers](/reference/triggers/),
and [streams](/reference/streams/). For every CLI command grouped by workflow, see the
[CLI reference](/cli-reference/).
