---
layout: layouts/base.vto
title: Add a plugin
templateEngine: [vento, md]
prev:
  label: How-to guides
  href: /how-to/
next:
  label: Add a service
  href: /how-to/add-a-service/
---

# Add a plugin

**Goal:** add one of NetScript's official plugins — **workers**, **sagas**,
**triggers**, **streams**, or **auth** — to an existing workspace, register it with the
runtime, and confirm it is wired up and healthy.

This is a task-oriented recipe. It assumes you already have a NetScript workspace (created
with `netscript init`) and that the `netscript` command is on your path. Each step is a
single command you run from your workspace root; the [Verify](#step-4--verify-the-plugin-is-registered)
step proves the plugin landed before you write a line of application code. For the exact
APIs each plugin exposes, follow the [reference links](#reference) at the end — this guide
adds the plugin; the reference documents its surface.

{{ comp callout { type: "note", title: "Plugins compose; they do not replace your service" } }}
A plugin is an <strong>installable capability</strong> — a background-job runtime, a saga
orchestrator, an auth service — that scaffolds its own workspace folder, registers itself in
your runtime, and (where applicable) runs as its own Aspire service on a dedicated port. Your
application service and your plugins run side by side. See
<a href="/explanation/plugin-system/">Plugin architecture</a> for the design behind the model.
{{ /comp }}

## Before you start

You need:

- **An existing NetScript workspace.** If you do not have one yet, create it first with
  `netscript init` — walk through the [Quickstart](/quickstart/) or the
  [tutorials index](/tutorials/).
- **The `netscript` command on your path.** Run `netscript --help` to confirm it resolves,
  and `netscript plugin --help` for the exact option spelling in your installed version. If
  the command is missing, install it:

{{ comp.tabbedCode({ tabs: [
  { label: "Install the CLI", lang: "bash", code: "deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + "" },
  { label: "Confirm it resolves", lang: "bash", code: "netscript --help\nnetscript plugin --help" }
] }) }}

- **Aspire up if you plan to run the plugin.** Adding and registering a plugin is offline,
  but several plugins (workers, sagas, auth) need a database and Redis to actually run. The
  database is Postgres by default (or `mysql` / `mssql` / `sqlite`, chosen at scaffold time
  with `--db`). Bring
  the local stack up first — `cd aspire && aspire start` — exactly as in
  [Run the stack with Aspire](/explanation/aspire/). You do **not** need it up just to
  scaffold and register.

{{ comp callout { type: "tip", title: "Run commands from the workspace root" } }}
Every command below runs from your workspace root. To target a different project, pass
<code>--project-root &lt;path&gt;</code> — it defaults to the current directory. Run
<code>netscript plugin install --help</code> for the version-accurate option list before you rely
on any flag.
{{ /comp }}

## Step 1 — Choose the plugin kind

Each official plugin has a *kind* you pass to the command and a conventional installed
*name*. Use the conventional name unless you have a specific reason to differ — generated
registries, ports, and docs all assume it.

{{ comp apiTable {
  caption: "Official plugins",
  columns: ["Kind", "Conventional name", "JSR package", "Default port", "Reference"],
  rows: [
    ["<code>worker</code>", "<code>workers</code>", "<code>@netscript/plugin-workers</code>", "8091", "<a href=\"/reference/workers/\">workers</a>"],
    ["<code>saga</code>", "<code>sagas</code>", "<code>@netscript/plugin-sagas</code>", "8092", "<a href=\"/reference/sagas/\">sagas</a>"],
    ["<code>trigger</code>", "<code>triggers</code>", "<code>@netscript/plugin-triggers</code>", "8093", "<a href=\"/reference/triggers/\">triggers</a>"],
    ["<code>auth</code>", "<code>auth</code>", "<code>@netscript/plugin-auth</code>", "8094", "<a href=\"/capabilities/auth/\">auth</a>"],
    ["<code>stream</code>", "<code>streams</code>", "<code>@netscript/plugin-streams</code>", "4437", "<a href=\"/reference/streams/\">streams</a>"]
  ]
} /}}

Pick the kind for the capability you need:

- **workers** — background job scheduling, task execution, and worker API endpoints. Fully
  traced through Aspire (scheduler → queue → worker → subprocess). See
  [Background jobs](/capabilities/background-jobs/).
- **sagas** — durable saga orchestration and long-running workflow APIs, with a selectable
  durable store (`kv` or `prisma`). See [Durable sagas](/capabilities/durable-sagas/).
- **triggers** — trigger ingress, scheduling, and file watching over raw Hono routes. See
  [Triggers](/capabilities/triggers/).
- **auth** — an oRPC auth service (sign-in, callback, sign-out, session, me) backed by a
  single selectable backend (kv-oauth, WorkOS, or better-auth). See
  [Authentication](/capabilities/auth/).
- **streams** — durable, change-data stream producers served as their own Aspire service.
  See [Streams](/capabilities/streams/).

{{ comp callout { type: "note", title: "auth is a first-class official plugin" } }}
Auth is now added the same way as workers, sagas, triggers, and streams — through
<code>netscript plugin install auth</code>. It installs the <code>@netscript/plugin-auth</code>
dependency, emits a user-owned <code>auth/mod.ts</code> glue barrel, registers the
<code>auth-api</code> service on port <strong>8094</strong>, and contributes its package-provided
Prisma models. The active backend is selected at runtime with
<code>NETSCRIPT_AUTH_BACKEND</code> (default <code>kv-oauth</code>). See
<a href="/how-to/add-authentication/">Configure authentication</a> for the backend setup.
{{ /comp }}

## Step 2 — Add the plugin

In the public `netscript` CLI, `plugin install` accepts either an official bare alias
(`workers`, `sagas`, `triggers`, `auth`, `streams`) or a published plugin package specifier
such as `@netscript/plugin-workers`. Add an official plugin by alias:

```bash
netscript plugin install workers --name workers
```

Repeat with the matching alias for the other plugins: `sagas`, `triggers`, `auth`, and
`streams`. The package-spec forms also work, for example
`netscript plugin install @netscript/plugin-workers --name workers` or an explicit `jsr:`
specifier. Run `netscript plugin install --help` for the version-accurate surface.

### Useful options

Run `netscript plugin install --help` for the full, version-accurate list. The public
`netscript plugin install` command takes the plugin alias or package specifier and applies
the workspace-level install flags before invoking the plugin-owned scaffolder:

{{ comp apiTable {
  caption: "netscript plugin install — options",
  columns: ["Option", "What it does"],
  rows: [
    ["<code>--name &lt;name&gt;</code>", "Plugin workspace and config key, for example <code>workers</code>."],
    ["<code>--project-root &lt;path&gt;</code>", "Target a workspace other than the current directory."],
    ["<code>--port &lt;port&gt;</code>", "Override the plugin service port."],
    ["<code>--db &lt;engine&gt;</code> / <code>--no-db</code>", "Provision or target a database engine, or skip database wiring."],
    ["<code>--samples</code> / <code>--no-samples</code>", "Include or skip user-owned sample stubs."],
    ["<code>--jsr-url &lt;specifier&gt;</code> / <code>--local-path &lt;path&gt;</code>", "Use an explicit JSR package or local plugin package directory."],
    ["<code>--force</code>", "Overwrite generated files if they already exist."]
  ]
} /}}

{{ comp callout { type: "note", title: "Contributor CLI uses local sources" } }}
The local contributor command
<code>deno run -A packages/cli/bin/netscript-dev.ts plugin install &lt;kind&gt;</code>
accepts the same framework-level install flags, but resolves against the monorepo checkout
instead of the globally installed public CLI. Always run <code>netscript plugin install --help</code>
for the option list your installed version actually exposes.
{{ /comp }}

{{ comp callout { type: "warning", title: "auth needs a database and KV" } }}
The auth plugin sets <code>requiresDb</code> and <code>requiresKv</code>, and contributes its
own Prisma models (<code>auth_users</code>, <code>auth_sessions</code>,
<code>auth_accounts</code>, <code>auth_verifications</code>). Keep DB wiring on (do not pass
<code>--no-db</code>) and run the database steps in
<a href="#step-3--generate-registries-and-wire-the-database">Step 3</a> so its tables exist
before the service starts.
{{ /comp }}

## Step 3 — Generate registries and wire the database

After adding plugins, regenerate the plugin registries so the runtime can discover them:

```bash
netscript generate plugins
```

If a plugin contributes runtime configuration schemas, also run:

```bash
netscript generate runtime-schemas
```

Plugins that contribute Prisma models (workers, sagas, and **auth**) need their tables
created. With Aspire already running (`cd aspire && aspire start`), apply migrations and
generate the client:

{{ comp.tabbedCode({ tabs: [
  { label: "Initialize + migrate", lang: "bash", code: "netscript db init --name add-plugin" },
  { label: "Generate client", lang: "bash", code: "netscript db generate" },
  { label: "Seed (optional)", lang: "bash", code: "netscript db seed" }
] }) }}

{{ comp callout { type: "note", title: "Aspire is step 2, the database is step 3" } }}
<code>netscript db</code> talks to the database that Aspire provisions — Postgres by
default, or <code>mysql</code> / <code>mssql</code> / <code>sqlite</code> if you chose a
different engine with <code>--db</code> at scaffold time (sqlite is file-backed, so it has no
Aspire container resource). Always
<code>cd aspire &amp;&amp; aspire start</code> <strong>before</strong> any <code>db</code>
command — see <a href="/explanation/aspire/">Run the stack with Aspire</a>. Skip these
database steps only when every plugin you added is stateless.
{{ /comp }}

## Step 4 — Verify the plugin is registered

List the registered plugins to confirm your new plugin appears:

```bash
netscript plugin list
```

You should see your plugin in the inventory — for example, `workers`, `sagas`, `triggers`,
`auth`, and `streams` if you added all five. Then run the health check:

```bash
netscript plugin doctor
```

`plugin doctor` checks installed NetScript plugin health and reports wiring problems
(missing registration, port collisions, absent database tables). A clean run means the
plugin is registered, wired, and ready to use.

{{ comp.tabbedCode({ tabs: [
  { label: "Inspect one plugin", lang: "bash", code: "# Detailed info for a single installed plugin\nnetscript plugin info @netscript/plugin-auth" },
  { label: "Run the service", lang: "bash", code: "# Bring the whole stack up and exercise the plugin's service\ncd aspire && aspire start\n# Aspire dashboard: http://localhost:18888\n# auth-api:         http://localhost:8094" }
] }) }}

{{ comp callout { type: "tip", title: "Confirm in the Aspire dashboard" } }}
Service-bearing plugins appear as resources in the Aspire dashboard at
<a href="http://localhost:18888"><code>http://localhost:18888</code></a> once
<code>aspire start</code> is up. A green resource on the plugin's port (workers
<code>:8091</code>, sagas <code>:8092</code>, triggers <code>:8093</code>, auth
<code>:8094</code>, streams <code>:4437</code>) confirms the plugin is live end to end.
{{ /comp }}

## Manage plugins later

Once a plugin is installed you can inspect, update, and remove it without re-scaffolding:

{{ comp apiTable {
  caption: "Plugin lifecycle commands",
  columns: ["Command", "Purpose"],
  rows: [
    ["<code>netscript plugin list</code>", "List installed plugins in the current workspace."],
    ["<code>netscript plugin info &lt;name&gt;</code>", "Show detailed metadata for one installed plugin."],
    ["<code>netscript plugin doctor</code>", "Health-check installed plugins and report wiring problems."],
    ["<code>netscript plugin update &lt;pkg&gt;</code>", "Dispatches the <code>update</code> verb to the plugin's own published CLI (e.g. <code>netscript plugin update @netscript/plugin-workers</code>). The argument is a JSR package specifier, not an installed plugin name."],
    ["<code>netscript plugin remove &lt;name&gt;</code>", "Remove an installed plugin from the workspace."]
  ]
} /}}

Run `netscript plugin --help` for the complete, version-accurate command set.

## Reference

{{ comp featureGrid {
  columns: 3,
  items: [
    { title: "workers", body: "Background jobs, scheduling, task execution.", href: "/reference/workers/" },
    { title: "sagas", body: "Durable saga orchestration (kv | prisma store).", href: "/reference/sagas/" },
    { title: "triggers", body: "Trigger ingress, scheduling, file watching.", href: "/reference/triggers/" },
    { title: "auth", body: "oRPC auth service with a selectable backend.", href: "/capabilities/auth/" },
    { title: "streams", body: "Durable change-data stream producers.", href: "/reference/streams/" },
    { title: "All packages", body: "Browse the full package and plugin index.", href: "/reference/" }
  ]
} /}}

### Where to go next

- **Build on the plugin you just added.** Next up:
  [Add a service](/how-to/add-a-service/) to give the plugin something to call, or
  [Configure authentication](/how-to/add-authentication/) if you added the auth plugin.
- **Understand the model.** Read [Plugin architecture](/explanation/plugin-system/) for
  the design behind installable capabilities, ports, and runtime registration.
- **Browse capabilities.** The [capabilities](/capabilities/) section maps each plugin to the
  problem it solves, with runnable examples.
