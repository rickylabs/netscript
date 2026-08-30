---
layout: layouts/base.vto
title: Deploy locally with Aspire
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/deploy-local-aspire/
---

# Deploy locally with Aspire

**Goal:** run your whole NetScript workspace on one machine under Aspire — scaffold the
AppHost, bring up the resource graph (Postgres, Redis, every service and background processor),
and watch it from the Aspire dashboard. This is the **local** orchestration companion to the
[Deploy](/orchestration-runtime/how-to/deploy/) recipe (which covers shipping to a remote target); for *why* the
AppHost works the way it does, read [Orchestration with Aspire](/explanation/aspire/).

{{ comp callout { type: "important", title: "The order is: scaffold → orchestrate → database" } }}
Aspire is <strong>step 2</strong>, before any database command. <code>netscript init</code> writes
the <code>aspire/</code> AppHost; <code>aspire start</code> provisions Postgres and Redis and starts
every process; <strong>only then</strong> do <code>netscript db init/generate/seed</code> work,
because those commands migrate the database <em>through</em> the running AppHost. Run a db command
with no Aspire up and it fails — there is no Postgres for it to reach. See
{{ comp.xref({ key: "cap:database", text: "Database" }) }}.
{{ /comp }}

## Prerequisites

{{ comp.apiTable({
  caption: "What you need before you start",
  rows: [
    { name: "A scaffolded workspace", type: "netscript init", desc: "Created WITHOUT --no-aspire, so the aspire/ AppHost folder exists. See the CLI reference for init flags." },
    { name: "Docker daemon running", type: "container engine", desc: "Aspire provisions Postgres and Redis as local Docker containers. No daemon = the default workflow does not start." },
    { name: "The Aspire CLI", type: "aspire (external)", desc: "The aspire restore / aspire start commands are the external Aspire CLI, run from inside aspire/ — not netscript subcommands." },
    { name: "A reachable port range", type: "ports", desc: "Dashboard :18888 (HTTPS) / :18889 (HTTP), OTLP :4318, and randomized high-range ports (49152–65535) allocated per project at scaffold time for services, plugin APIs, and frontend apps." }
  ]
}) }}

{{ comp callout { type: "note", title: "No --no-aspire" } }}
This recipe assumes the orchestration layer was scaffolded. If you ran
<code>netscript init my-app --no-aspire</code> there is <strong>no</strong> <code>aspire/</code>
folder and no <code>aspire start</code> — you start the Deno processes yourself and supply your own
infrastructure. That path is covered in the {{ comp.xref({ key: "howto:deploy", text: "Deploy" }) }}
recipe and the [Aspire explanation](/explanation/aspire/).
{{ /comp }}

## Step 1 — Confirm the AppHost was scaffolded

The AppHost is a small **TypeScript/Node** program (not C#) at `aspire/apphost.mts`, configured by
`aspire/aspire.config.json`. `netscript init` generates it; you do not hand-write it. Verify it is
on disk before going further:

```bash
# From the workspace root — these two files are the orchestration entry point.
ls aspire/apphost.mts aspire/aspire.config.json
```

`aspire.config.json` pins `language: "typescript/nodejs"`, `appHost.path: "apphost.mts"`, and the
Aspire SDK version (such as `13.5.3` for 13.5 adoption workspaces, or `13.4.6` on the default scaffold).
The Aspire CLI version and AppHost SDK version must match on the same release train (never mix CLI and SDK trains).
If you installed the Aspire CLI via npm (`npm install -g @microsoft/aspire-cli`), `aspire update --self`
is installation-method-aware and directs you to run `npm install -g @microsoft/aspire-cli@latest`.

The graph inside the AppHost is **derived from your installed
plugins** at boot via `composeAppHost` (from `@netscript/aspire/application`) — add a plugin and
its API plus background processor appear in the graph; remove it and they vanish, no edit to
`apphost.mts` required. The mechanics are in [Orchestration with Aspire](/explanation/aspire/).

{{ comp callout { type: "note", title: "Regenerate without re-scaffolding" } }}
After changing the resource graph, run <code>netscript generate aspire</code> from the workspace
root. It re-reads <code>appsettings.json</code> and regenerates the TypeScript AppHost helpers; it
does not replace the rest of the scaffold. Service mutation verbs regenerate those helpers in the
same operation:
<pre><code>netscript service ref add api users
netscript service ref remove api users
netscript service set api --port 3010 --enabled true</code></pre>
{{ /comp }}

## Step 2 — Restore the AppHost SDK (once)

The AppHost runs on its own isolated Node runtime inside `aspire/` so its dependency graph never
leaks into your Deno workspace. Restore that runtime once per machine (and after an SDK bump):

```bash
# Run from inside the aspire/ folder. One-time SDK restore.
cd aspire
aspire restore
```

## Step 3 — Start the resource graph

A single `aspire start` translates `appsettings.json` plus the plugin contributions into a coherent
resource graph and boots all of it — infrastructure first, then services, plugin APIs, and
background processors, with cross-references resolved into injected environment variables:

```bash
# Still inside aspire/. Boots the whole graph; prints the dashboard URL + a login token.
aspire start
```

When boot finishes, `aspire start` prints the dashboard address and a one-time login token. The
graph a single run stands up:

{{ comp.apiTable({
  caption: "What `aspire start` brings up (the local resource graph)",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888 / http://localhost:18889", desc: "The Aspire dashboard. Live resource list, console logs, structured logs and traces. A login token is printed on start." },
    { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint (http/protobuf) the dashboard runs; framework spans and structured logs land here automatically." },
    { name: "postgres", type: "Container", desc: "Provisioned via Docker. The database `netscript db` commands target — reachable only once Aspire is up. Postgres is the recommended engine — pass `--db postgres` at init; `--db mysql` or `--db mssql` select those engines (each also an Aspire container), or `--db sqlite` for a file-backed database with no container." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs KV/queue workloads for the runtime plugins. Swap it for `garnet` (also a container) or app-level `deno-kv` via `--cache-backend`." },
    { name: "users (example service)", type: ":49152–65535 (seeded high-range, allocated per project)", desc: "The scaffolded oRPC service, when you init with --service. OpenAPI at /api/v1/users/* and RPC at /api/rpc/*." },
    { name: "plugin APIs", type: ":49152–65535 (seeded high-range, allocated per project)", desc: "Each installed runtime plugin's HTTP API (workers, sagas, triggers, auth). Ports are allocated from the high-range to avoid collisions, not hardcoded." },
    { name: "background processors", type: "executables (no port)", desc: "Each plugin's isolated runners (workers, sagas, triggers) — separate processes, not threads inside the API." },
    { name: "dashboard (Fresh app)", type: "Assigned (>= 53248)", desc: "The scaffolded Fresh frontend, when present (allocated dynamically from the APP range at scaffold time)." }
  ]
}) }}

{{ comp callout { type: "note", title: "Listener ports are randomized at scaffold time" } }}
Stand-alone services, plugin APIs, and frontend apps are assigned stable, high-range ports (between <code>49152</code> and <code>65535</code>) at scaffold time. These are seeded by your project name to avoid conflict with other workspaces. The Aspire dashboard's resource list is the authority for the exact port each resource bound, or you can check your scaffold console output or the generated <code>appsettings.json</code>.
{{ /comp }}

## Step 4 — Initialize the database (through the running AppHost)

With Aspire up, your database engine is live and the `netscript db` commands can reach it. The
resource graph above shows Postgres — the recommended engine and the one these recipes use; if you
scaffolded with `--db mysql` / `--db mssql` you get that container instead, and `--db sqlite`
gives a file-backed database with no Aspire container. Run the commands from the
**workspace root** (a second terminal — leave `aspire start` running in the first):

```bash
# From the workspace root, with `aspire start` still up in another terminal.
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # optional: seed development data
```

These talk to the Postgres container Aspire provisioned. Outside Aspire (an isolated CI container,
say), point them at your own database via `POSTGRES_URI` / `DATABASE_URL` instead — covered in
{{ comp.xref({ key: "howto:database-migration", text: "Database & migration" }) }}.

## Step 5 — Use the dashboard

Open `https://localhost:18888`, paste the login token `aspire start` printed, and you have a single
pane over the running graph:

{{ comp.apiTable({
  caption: "Aspire dashboard surfaces",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and executable above with status, endpoints, and the resolved environment. The authority for which port each resource bound." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource — a failing background processor is one click away, not buried in a terminal." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans and structured logs your handlers emit, correlated by traceparent across services. Aspire collects them via the OTLP endpoint at :4318." }
  ]
}) }}

Because Aspire starts each resource with its `OTEL_SERVICE_NAME` and an OTLP endpoint pointed at
`http://localhost:4318`, framework-level spans (job dispatch, job execution, scheduler runs)
surface here with no extra wiring. See {{ comp.xref({ key: "explain:observability", text: "Observability" }) }}
for the framework-vs-scaffold span boundary.

## In-production pitfalls

{{ comp callout { type: "warning", title: "Aspire is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> exists to make <code>git clone</code> → one command produce a complete,
observable, correctly-wired stack on <strong>one machine</strong>. The Postgres and Redis it
starts are throwaway Docker containers for dev convenience — <strong>not</strong> your production
database or cache. For a remote target you point processes at managed infrastructure and let your
platform own lifecycle; that is the {{ comp.xref({ key: "howto:deploy", text: "Deploy" }) }} recipe.
{{ /comp }}

{{ comp callout { type: "warning", title: "Footguns when `aspire start` will not boot" } }}
<ul>
<li><strong>Docker not running.</strong> Aspire provisions Postgres + Redis through Docker; no
daemon means the default local workflow cannot start. Start Docker, or use the <code>--no-aspire</code> path
with your own infrastructure.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run
from inside <code>aspire/</code>. <code>netscript db</code> commands run from the
<strong>workspace root</strong>. Mixing them up is the most common first-run error.</li>
<li><strong>db command before <code>aspire start</code>.</strong> Every <code>netscript db</code>
command needs a live Postgres. Run it with no Aspire up and it fails fast — bring the graph up
first.</li>
<li><strong>A declared background reference cannot resolve.</strong> For each background processor
that is not explicitly disabled, the generated AppHost preflights every declared service and plugin
reference before registration. Each such declaration is required configuration, so it fails fast
when the resource is missing or when the resource exists but has no <code>http</code> endpoint; this
is a startup configuration error, not a processor failing under load. Service references use the
message template
<code>Background processor configuration error: '&lt;processor&gt;' could not resolve service
reference '&lt;ref&gt;' HTTP endpoint.</code> Plugin references use the distinct template
<code>Background processor configuration error: '&lt;processor&gt;' could not resolve plugin
reference '&lt;ref&gt;' HTTP endpoint.</code> The generated code substitutes the configured processor
and reference names for <code>&lt;processor&gt;</code> and <code>&lt;ref&gt;</code>.</li>
<li><strong>Ports in use.</strong> The dashboard wants <code>:18888</code>/<code>:18889</code> and
OTLP <code>:4318</code>; services and plugin APIs claim their assigned high-range ports (49152–65535) allocated at scaffold time. A stale prior run holding a port blocks boot — check the dashboard
resource list (or your process table) and free it.</li>
<li><strong>The AppHost is Node, your app is Deno.</strong> The two runtimes are isolated on
purpose; an <code>aspire restore</code> failure is a Node/SDK problem in <code>aspire/</code>, not
a Deno workspace problem.</li>
</ul>
{{ /comp }}

## See also

- **Why it works this way:** {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }}
  — the AppHost, plugin contributions, two-pass reference resolution, and the dashboard.
- **Ship it remotely:** {{ comp.xref({ key: "howto:deploy", text: "Deploy" }) }} — the production
  companion: deployable units, backing services, and the <code>--no-aspire</code> path.
- **The database sequence:** {{ comp.xref({ key: "cap:database", text: "Database" }) }} and
  {{ comp.xref({ key: "howto:database-migration", text: "Database & migration" }) }}.
- **Exact symbols + full port map:** {{ comp.xref({ key: "ref:aspire", text: "the Aspire reference" }) }}
  and the {{ comp.xref({ key: "cli:reference", text: "CLI reference" }) }}.
- **Non-interactive / CI execution:** {{ comp.xref({ key: "howto:detached-start-agents-ci", text: "Detached start for agents and CI" }) }}
  — structured JSON output, timeout budgets, and `--isolated` parallel mode.

{{ comp.nextPrev({ prev: { label: "Graceful shutdown", href: "/orchestration-runtime/how-to/graceful-shutdown/" }, next: { label: "Detached start for agents and CI", href: "/orchestration-runtime/how-to/detached-start-agents-ci/" } }) }}
