---
layout: layouts/base.vto
title: Orchestration with Aspire
templateEngine: [vento, md]
prev: { label: "Observability", href: "/explanation/observability/" }
next: { label: "The pure-backend auth model", href: "/explanation/auth-model/" }
---

{{ comp.breadcrumb() }}

# Orchestration with Aspire

This page explains *what* [Aspire](https://aspire.dev) does in a NetScript project, *why* it
is the second step of every workflow, and *how* a single `aspire run` brings up the entire
backing graph — Postgres, the Garnet cache, every plugin API, and every background processor —
before you touch a database command. It is understanding-oriented: read it to build the mental
model of how a NetScript app actually boots. When you want exact symbols, follow
[`reference/aspire/`](/reference/aspire/); when you want to do a specific task, see
[Database migration](/how-to/database-migration/) or [Deploy](/how-to/deploy/).

## The mental model: Aspire is the conductor, not an add-on

A NetScript project is not one process. It is a small fleet: an example oRPC service, a Fresh
dashboard, a workers API and its background worker, a sagas API and its supervisor, a triggers
API and its processor, an auth API — plus the infrastructure they all depend on, a Postgres
database and a Garnet (Redis-compatible) cache. Wiring that fleet up by hand — starting each
process in the right order, handing each one the right connection strings, and tearing it all
down again — is exactly the integration tax NetScript exists to remove.

**Aspire is the conductor.** You describe the desired graph once, declaratively, and a single
command stands the whole thing up with the wiring already resolved. The database URL the
`users` service needs, the cache endpoint the workers runtime needs, the cross-references one
plugin holds to another — Aspire computes them and injects them as environment variables so no
process has to discover its neighbours at runtime.

{{ comp callout { type: "important", title: "Aspire is step 2 — before any database command" } }}
The canonical workflow is <strong>scaffold → orchestrate → database</strong>. After
<code>netscript init</code>, you run <code>cd aspire &amp;&amp; aspire restore</code> once, then
<code>aspire run</code>. That command provisions Postgres and Garnet through Docker and brings up
every service. <strong>Only then</strong> do <code>netscript db init</code>,
<code>db generate</code>, and <code>db seed</code> work — because those commands provision and
migrate the database <em>through</em> the running AppHost. Run a db command with no Aspire up and
it fails: there is no Postgres for it to talk to. See
<a href="/how-to/database-migration/">Database migration</a> for the full sequence.
{{ /comp }}

## The AppHost: a generated TypeScript program

The heart of orchestration is the **AppHost** — a small TypeScript/Node program scaffolded into
the `aspire/` subfolder at `aspire/apphost.mts`. It is the entry point `aspire run` executes. It
is deliberately tiny: it builds an Aspire builder, hands it your project's `appsettings.json`,
and runs the resulting graph.

{{ comp.tabbedCode({ tabs: [
  {
    label: "aspire/apphost.mts (generated)",
    lang: "ts",
    code: "import { createBuilder } from './.aspire/modules/aspire.mjs';\nimport { createNetScriptAppHost } from './.helpers/index.mjs';\n\n// 1. Build an Aspire builder (SDK modules restored by `aspire restore`).\nconst builder = await createBuilder();\n\n// 2. Translate appsettings.json into a resource graph: db, cache,\n//    services, plugin APIs, background processors, apps, tools.\nawait createNetScriptAppHost(builder, '../appsettings.json');\n\n// 3. Build the graph and run it (dashboard + every resource).\nawait builder.build().run();"
  },
  {
    label: "aspire/aspire.config.json (generated)",
    lang: "json",
    code: "{\n  \"appHost\": { \"path\": \"apphost.mts\", \"language\": \"typescript/nodejs\" },\n  \"sdk\": { \"version\": \"13.4.4\" },\n  \"packages\": [\"Aspire.Hosting.PostgreSQL\"]\n}"
  }
] }) }}

Two facts about the AppHost are worth internalizing because they contradict assumptions people
carry from .NET Aspire:

1. **It is TypeScript/Node, not C#.** `aspire.config.json` declares `language: "typescript/nodejs"`
   and `appHost.path: "apphost.mts"`. The AppHost runs on an isolated Node.js runtime inside
   `aspire/` (with its own `package.json` and `.aspire/` SDK modules) precisely so that the Node
   dependency graph never leaks into the Deno workspace at the project root. You author NetScript
   in Deno; Aspire orchestrates it from a sealed-off Node corner.
2. **The graph is derived from `appsettings.json`, not hand-written.** You do not edit
   `apphost.mts` to add a service. You declare infrastructure, services, plugins, and processors
   in `appsettings.json`; `createNetScriptAppHost` reads that file and registers each resource.

{{ comp callout { type: "warning", title: "A known config divergence — trust the generated AppHost" } }}
<code>netscript.config.ts</code> still carries a legacy field
<code>aspire: { appHost: 'dotnet/AppHost' }</code>, a relic of the earlier C# AppHost shape. The
<strong>real, generated</strong> AppHost is the TypeScript <code>aspire/apphost.mts</code> described
above, configured by <code>aspire/aspire.config.json</code>. If the two ever appear to disagree,
the on-disk <code>aspire/apphost.mts</code> + <code>aspire.config.json</code> are authoritative.
Treat the <code>netscript.config.ts</code> value as cosmetic legacy until it is removed. (Use
<code>--legacy-aspire</code> at <code>init</code> time only if you explicitly want the old C#
<code>dotnet/AppHost</code> shape.)
{{ /comp }}

## What `aspire run` actually starts (and in what order)

The helper `createNetScriptAppHost` (in `aspire/.helpers/index.mts`) registers resources in a
fixed, dependency-respecting order. Each resource class has its own `register-*.mts` helper —
`register-infrastructure.mts`, `register-services.mts`, `register-plugins.mts`,
`register-background.mts`, `register-apps.mts`, `register-tools.mts` — and every one of them uses
`builder.addExecutable(...)` with the permissions, working directory, HTTP endpoint, and OTEL
environment resolved from `appsettings.json`.

```text
                          aspire run  (from aspire/)
                                 │
                                 ▼
              ┌──────────────────────────────────────────┐
              │  createNetScriptAppHost(appsettings.json) │
              └──────────────────────────────────────────┘
                                 │  registers, in order:
   ┌─────────────────────────────┼─────────────────────────────────────┐
   ▼                             ▼                                       ▼
(1) dashboard OTLP        (2) infrastructure                   (4) services
    :18888 + :4318            ├─ postgres  (Container)              └─ users  :3001
                              └─ garnet    (Container, cache)
                                 │
                                 ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │ (5) plugin APIs (two-pass: create, then wire plugin→plugin / plugin→service     │
   │     refs via getEndpoint('http') + withEnvironment())                           │
   │     workers-api :8091   sagas-api :8092   triggers-api :8093   auth-api :8094   │
   │     streams :4437                                                               │
   │ (6) background processors:  workers, sagas (bin/combined.ts);                    │
   │     triggers (src/runtime/trigger-processor.ts)                                 │
   │ (7) apps:  dashboard (Fresh)        (8) tools                                   │
   └──────────────────────────────────────────────────────────────────────────────┘
```

The order is not arbitrary. Infrastructure (database + cache) comes up first because everything
else depends on it. Services and plugin APIs are each registered in **two passes** — first every
resource is created, then a second pass wires the cross-references — because a plugin may need a
sibling plugin's HTTP endpoint or a service's URL, and those endpoints only exist once the
resources have been created. Aspire resolves each `getEndpoint('http')` and injects it with
`withEnvironment(...)`, so by the time a process starts, its neighbours' addresses are already in
its environment.

{{ comp.apiTable({
  caption: "The resource graph a single `aspire run` brings up",
  rows: [
    { name: "aspire (dashboard)", type: "http://localhost:18888", desc: "The Aspire dashboard. `aspire run` prints a login token. Live resource list, logs, structured traces, and the OTLP collector (:4318) all surface here." },
    { name: "postgres", type: "Container", desc: "Provisioned via Docker. Engine Postgres, Persistent (DataPath .data/postgres). The PrimaryDatabase that `netscript db` commands target — only reachable once Aspire is up." },
    { name: "garnet", type: "Container (cache)", desc: "Redis-compatible cache. Engine Garnet, the PrimaryCache. Backs KV/queue workloads for the runtime plugins." },
    { name: "users", type: ":3001", desc: "Example oRPC service (defineService). Routes /api/v1/users/* and the RPC surface at /api/rpc/*." },
    { name: "workers-api", type: ":8091", desc: "Workers plugin API. /api/v1/workers/{jobs,executions,tasks,seed}, trigger via POST /api/v1/workers/jobs/{id}/trigger." },
    { name: "sagas-api", type: ":8092", desc: "Sagas plugin API. /api/v1/sagas/{sagas,instances,publish} plus liveness at /health/live." },
    { name: "triggers-api", type: ":8093", desc: "Triggers plugin API (raw Hono, not oRPC). POST /api/v1/webhooks/inbound/generic, GET /api/v1/events." },
    { name: "auth-api", type: ":8094", desc: "Auth plugin oRPC service. /api/v1/auth/{signin,callback,signout,session,me} with one active backend (NETSCRIPT_AUTH_BACKEND)." },
    { name: "streams", type: ":4437", desc: "Durable-streams producer runtime (@netscript/plugin-streams-core). Served as its own Aspire Deno service; workers/auth/sagas mirror execution state into it." },
    { name: "workers / sagas / triggers", type: "background processors", desc: "Separate from the APIs: workers & sagas run from bin/combined.ts; triggers from src/runtime/trigger-processor.ts. Declared under appsettings BackgroundProcessors." }
  ]
}) }}

The full port map for every NetScript runtime resource is consolidated under
[`reference/aspire/`](/reference/aspire/) — treat that page as the canonical list and this table
as the orientation. Auth's place in the graph (a pure-backend oRPC service composing one active
adapter) is the subject of the next chapter, [The pure-backend auth model](/explanation/auth-model/).

## The dashboard at :18888

When `aspire run` finishes booting, it prints a URL and a one-time login token for the dashboard
at `http://localhost:18888`. The dashboard is the single pane of glass over the running graph:

- **Resources** — every container and executable above, with status, endpoints, and environment.
- **Console logs** — stdout/stderr per resource, so a failing background processor is one click
  away rather than buried in a terminal.
- **Structured logs and traces** — Aspire runs an OTLP collector at `http://localhost:4318`, and
  the spans and structured logs your handlers emit (see [Observability](/explanation/observability/))
  land here, correlated by `traceparent`, so a request that fans out across services is a single
  trace rather than scattered log lines.

In other words, the dashboard is where the observability story (instrumentation in your code) and
the orchestration story (Aspire knowing every resource) meet: Aspire already knows the topology,
so it can stitch the telemetry into it for free. Concretely, job dispatch, job execution,
scheduler runs, and subprocess task continuation all emit real OpenTelemetry spans that surface in
this dashboard with **no extra wiring** — the trace context is propagated into worker subprocesses
over W3C `traceparent`. (The one remaining gap is the scaffold `createJobTools(ctx)` helpers you
call *inside* a handler — `trace.addEvent`, `withChildSpan`, `progress` — which are still no-op
stubs; for custom handler spans, call `@netscript/telemetry` helpers directly. See
[Observability](/explanation/observability/) for the precise framework-vs-scaffold boundary.)

## The `--no-aspire` escape hatch

Aspire is the default and the recommended path, but it is not mandatory. The `init` command takes
a `--no-aspire` flag (`netscript init my-app --no-aspire`) that **skips scaffolding the Aspire
orchestration layer entirely**. No `aspire/` folder is generated, no AppHost is available to
provision infrastructure, and there is no Aspire dashboard. Start the generated Deno processes
directly and provide your own infrastructure connection strings.

{{ comp callout { type: "note", title: "Verified against the CLI scaffolder" } }}
<code>--no-aspire</code> maps to <code>noAspire: options.aspire === false</code> in the init
command, and the scaffold step short-circuits to an <strong>empty result</strong> (no
<code>aspire/</code> directory, no <code>apphost.mts</code>, no <code>aspire.config.json</code>)
when it is set. The default path generates the TypeScript AppHost shape; the separate
<code>--legacy-aspire</code> flag generates the older C# <code>dotnet/AppHost</code> instead. The
generated README is also Aspire-aware: with <code>--no-aspire</code> it omits any mention of
<code>aspire run</code> and <code>appsettings.json</code>, because there is no orchestration layer
to point at.
{{ /comp }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Default — with Aspire",
    lang: "bash",
    code: "netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes\n\n# Step 2: orchestration brings up Postgres + Garnet + every process.\ncd aspire && aspire restore   # once\naspire run                    # dashboard at http://localhost:18888\n\n# Step 3: database commands now work (provisioned through Aspire).\nnetscript db init --name init"
  },
  {
    label: "Escape hatch — --no-aspire",
    lang: "bash",
    code: "# Scaffold WITHOUT the orchestration layer. No aspire/ folder is created.\nnetscript init my-app --db postgres --no-aspire --yes\n\n# There is no `aspire run`. Start processes yourself:\ndeno task --cwd apps/dashboard dev\n\n# You now own infrastructure: bring your own Postgres + cache and supply\n# connection strings to each process. `netscript db` has no AppHost to\n# provision through, so manage migrations against your own database URL."
  }
] }) }}

{{ comp callout { type: "warning", title: "What you lose when you opt out" } }}
<code>--no-aspire</code> trades convenience for control. Without the orchestration layer there is
<strong>no AppHost</strong> (<code>aspire/apphost.mts</code> is not generated), <strong>no automatic
Postgres/Garnet provisioning</strong> (you bring and start your own infrastructure),
<strong>no dashboard</strong> at <code>:18888</code>, and <strong>no automatic cross-process
wiring</strong> — you become responsible for handing every process its connection strings and its
neighbours' endpoints by hand. The <code>netscript db</code> commands lose the AppHost they
provision through, so the database workflow becomes your responsibility against your own database
URL.
{{ /comp }}

**When opting out is the right call:**

- **A deploy target that does its own orchestration.** Kubernetes, Nomad, a managed PaaS, or a
  Docker Compose file you already maintain — the platform owns process lifecycle and service
  discovery, so a second orchestrator on top is redundant. This is the primary production case;
  see [Deploy](/how-to/deploy/) for portability and bare-metal patterns.
- **A constrained or air-gapped environment.** No Docker daemon, or a policy against Aspire's Node
  AppHost runtime. You run Deno processes directly against externally-managed infrastructure.
- **A single-purpose slice.** You only want the Fresh app, or one service, with no database or
  cache at all, and the full graph would be overhead.

For local development of a full multi-plugin app, opting out is almost always the wrong trade:
you would be hand-rebuilding exactly the wiring Aspire generates for free.

## Why this design, and what it costs

The honest trade-offs, because choosing Aspire as the default is an opinion:

- **A second runtime in the tree.** The AppHost is Node/TypeScript while your app is Deno. That is
  a deliberate isolation: the `aspire/` folder seals the Node dependency graph away from the Deno
  root so the two never contaminate each other. The cost is that "what runtime is this?" has two
  answers in one repo — `aspire/` is Node, everything else is Deno.
- **Docker is a hard dependency of the happy path.** `aspire run` provisions Postgres and Garnet as
  containers. No Docker daemon means the default workflow does not start — which is exactly when
  `--no-aspire` plus your own infrastructure earns its place.
- **Orchestration order is implicit.** The two-pass registration that resolves cross-references is
  powerful but invisible: you declare resources in `appsettings.json` and trust the helper to wire
  them. When something does not connect, the dashboard's resource list and console logs at
  `:18888` are the first place to look, not the AppHost source.
- **Convenience versus portability.** The single-command graph is the best possible local
  experience and the weakest possible coupling to any one deploy platform — which is why the
  framework keeps `--no-aspire` as a first-class exit, not an afterthought.

## Glossary

- **AppHost** — the program that defines and runs an Aspire resource graph. In NetScript it is the
  generated TypeScript `aspire/apphost.mts`, configured by `aspire.config.json`. See the
  [glossary](/glossary/#apphost).
- **Resource** — any node in the graph Aspire manages: a container (Postgres, Garnet) or an
  executable (a service, a plugin API, a background processor, an app).
- **OTLP** — the OpenTelemetry protocol endpoint (`http://localhost:4318`) Aspire runs so the
  dashboard can collect the spans and structured logs your handlers emit.

## Where to go next

- **Do the database workflow:** [Database migration](/how-to/database-migration/) — `db init` →
  `generate` → `seed` → `status`, and why `aspire run` must come first.
- **Understand the auth service in the graph:** [The pure-backend auth model](/explanation/auth-model/)
  — how the `auth-api` resource at `:8094` composes one active backend behind the `AuthBackendPort`.
- **Deploy without Aspire:** [Deploy](/how-to/deploy/) — the `--no-aspire` portability path,
  Docker, and bare-metal targets.
- **Reference:** the exact exported symbols and the full port map live in
  [`reference/aspire/`](/reference/aspire/).
- **Related:** [Observability](/explanation/observability/) explains the spans and logs the
  dashboard at `:18888` collects.

{{ comp.nextPrev({ prev: { label: "Observability", href: "/explanation/observability/" }, next: { label: "The pure-backend auth model", href: "/explanation/auth-model/" } }) }}
