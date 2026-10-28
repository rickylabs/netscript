---
layout: layouts/base.vto
title: Add a plugin
description: Install an official plugin, register it, and confirm it is healthy.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-a-plugin/
---

# Add a plugin

This recipe adds one of NetScript's official plugins (workers, sagas, triggers, streams or auth)
to an existing workspace, registers it with the runtime, and confirms it is healthy. Each step is
one command run from the workspace root, and [Step 4](#step-4-verify-the-plugin-is-registered)
proves the plugin landed before you write application code.

A plugin scaffolds its own workspace folder, registers itself in your runtime and, where it has
an API, runs as its own Aspire service beside your application service.
[Plugin architecture](/explanation/plugin-system/) explains the model.

## Before you start

You need:

- **A NetScript workspace** created with `netscript init`. If you don't have one, follow the
  [Quickstart](/quickstart/).
- **The `netscript` command on your path.** Install it if `netscript --help` doesn't resolve:

{{ comp.tabbedCode({ tabs: [
  { label: "Install the CLI", lang: "bash", code: "deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + "" },
  { label: "Confirm it resolves", lang: "bash", code: "netscript --help\nnetscript plugin --help" }
] }) }}

- **Aspire running, if you plan to run the plugin.** Installing and registering a plugin works
  offline. Workers, sagas and auth need a database and Redis to run: start the local stack with
  `cd aspire && aspire start`, as in [Run the stack with Aspire](/explanation/aspire/).

Commands target the current directory. Pass `--project-root <path>` to target another workspace,
and run `netscript plugin install --help` for the option list of your installed version.

## Step 1 — Choose the plugin kind

Each official plugin has a kind and a conventional installed name. Keep the conventional name:
generated registries, ports and docs assume it. Every plugin service gets a
randomized port (>= 49152).

{{ comp apiTable {
  caption: "Official plugins",
  columns: ["Kind", "Conventional name", "JSR package", "Use it for", "Reference"],
  rows: [
    ["<code>worker</code>", "<code>workers</code>", "<code>@netscript/plugin-workers</code>", "Background job scheduling, task execution and the worker API, traced through Aspire from scheduler to subprocess.", "<a href=\"/reference/workers/\">workers</a>"],
    ["<code>saga</code>", "<code>sagas</code>", "<code>@netscript/plugin-sagas</code>", "Durable saga orchestration with a <code>kv</code> or <code>prisma</code> store.", "<a href=\"/reference/sagas/\">sagas</a>"],
    ["<code>trigger</code>", "<code>triggers</code>", "<code>@netscript/plugin-triggers</code>", "Trigger ingress, scheduling and file watching over raw Hono routes.", "<a href=\"/reference/triggers/\">triggers</a>"],
    ["<code>auth</code>", "<code>auth</code>", "<code>@netscript/plugin-auth</code>", "An oRPC auth service (sign-in, callback, sign-out, session, me) with one backend: kv-oauth, WorkOS or better-auth.", "<a href=\"/capabilities/auth/\">auth</a>"],
    ["<code>stream</code>", "<code>streams</code>", "<code>@netscript/plugin-streams</code>", "Durable change-data stream producers, served as their own Aspire service.", "<a href=\"/reference/streams/\">streams</a>"]
  ]
} /}}

## Step 2 — Add the plugin

`netscript plugin install` takes an official alias (`workers`, `sagas`, `triggers`, `auth`,
`streams`) or a published package specifier. Add an official plugin by alias:

```bash
netscript plugin install workers --name workers
```

Repeat with the alias of each plugin you need. The package forms also work, for example
`netscript plugin install @netscript/plugin-workers --name workers` or an explicit `jsr:`
specifier.

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

{{ comp callout { type: "warning", title: "Auth needs a database and KV" } }}
<code>netscript plugin install auth</code> installs <code>@netscript/plugin-auth</code>, emits a user-owned <code>auth/mod.ts</code> glue barrel, registers the <code>auth-api</code> service and contributes Prisma models (<code>auth_users</code>, <code>auth_sessions</code>, <code>auth_accounts</code>, <code>auth_verifications</code>). Keep database wiring on (don't pass <code>--no-db</code>) and run the database commands in <a href="#step-3-generate-registries-and-wire-the-database">Step 3</a> so the tables exist before the service starts. <code>NETSCRIPT_AUTH_BACKEND</code> selects the backend at runtime (default <code>kv-oauth</code>); <a href="/identity-access/how-to/add-authentication/">Configure authentication</a> covers the setup.
{{ /comp }}

### KV-only installs and projection migration

Install workers, sagas or triggers with `--no-db --no-samples` to skip Prisma schema and migration
contributions. The install emits `RequiresDb: false` for both the API and the background
processor. Both processes still require KV, and their background work runs independently of the
web app.

Saga query storage is a separate choice, set with `sagas.projection.backend`:

| Value | Query model | Notes |
| --- | --- | --- |
| `kv` | KV | `retention.archiveToDb: true` adds an explicit database archive for the configured saga group; the runner requests a host Prisma client for it. The default `archiveToDb: false` keeps KV-only installs free of a database. |
| `prisma` | Prisma | Requires the host's saga Prisma delegates. Without them the API fails before listening and the runner fails before starting delivery. |
| `none` | None | Disables the instance query projection, durable saga-stream hydration and database archival. Canonical saga state stays durable. |

In `appsettings.json`, set `Sagas.Projection.Backend` on both the saga API entry in
`NetScript.Plugins` and the saga runner entry in `NetScript.BackgroundProcessors`. Generated
helpers forward it as `NETSCRIPT_SAGA_PROJECTION`, and that environment value takes precedence
over settings.

**Migration in 0.0.8:** re-run each plugin install with `--no-db --no-samples --force` and
regenerate helpers to correct existing DB-dependent metadata. Preserve your user-owned
configuration and samples when you apply the generated changes.

- Existing saga entries without a projection selector follow `Sagas.Store.Backend` (or
  `NETSCRIPT_SAGA_STORE`), and default to KV when neither is set.
- New saga installs default the projection to the selected store backend, which defaults to KV.
- With `--no-db`, select `kv` on both entries.
- Select `prisma` only when you need relational query storage. A database being available
  doesn't mean the host Prisma client contains saga models: provision the saga models and
  regenerate the host client first, then select `prisma` on both entries.

## Step 3 — Generate registries and wire the database

1. Regenerate the plugin registries so the runtime can discover the new plugin:

   ```bash
   netscript generate plugins
   ```

2. If the plugin contributes runtime configuration schemas, generate them too:

   ```bash
   netscript generate runtime-schemas
   ```

3. For plugins that contribute Prisma models (workers, sagas and auth), create the tables with
   Aspire running:

   ```bash
   netscript db init --name add-plugin
   ```

4. Generate the client:

   ```bash
   netscript db generate
   ```

5. Optionally, seed the database:

   ```bash
   netscript db seed
   ```

{{ comp callout { type: "important", title: "Start Aspire before any db command" } }}
<code>netscript db</code> talks to the database that Aspire provisions: Postgres by default, or the <code>mysql</code>, <code>mssql</code> or <code>sqlite</code> engine you chose with <code>--db</code> at scaffold time (sqlite is file-backed and has no Aspire container resource). Run <code>cd aspire &amp;&amp; aspire start</code> first. Skip the database commands only when every plugin you added is stateless.
{{ /comp }}

## Step 4 — Verify the plugin is registered

1. List the registered plugins. Each plugin you added appears in the inventory:

   ```bash
   netscript plugin list
   ```

2. Run the health check. It reports wiring problems such as a missing registration, a port
   collision or absent database tables; a clean run means the plugin is registered and wired:

   ```bash
   netscript plugin doctor
   ```

3. Optionally, inspect one plugin in detail:

   ```bash
   # Detailed info for a single installed plugin
   netscript plugin info @netscript/plugin-auth
   ```

4. Start the stack and exercise the plugin's service:

   ```bash
   # Bring the whole stack up and exercise the plugin's service
   cd aspire && aspire start
   # Aspire dashboard: https://localhost:18888
   # auth-api:         http://localhost:<auth-port> (replace with your assigned auth port)
   ```

Service-bearing plugins appear as resources in the
[Aspire dashboard](https://localhost:18888). A green resource on the plugin's assigned port
confirms the plugin is live end to end; the dashboard and the scaffold logs show the port.

## Manage plugins later

Inspect, update and remove an installed plugin without scaffolding again:

{{ comp apiTable {
  caption: "Plugin lifecycle commands",
  columns: ["Command", "Purpose"],
  rows: [
    ["<code>netscript plugin list</code>", "List installed plugins in the current workspace."],
    ["<code>netscript plugin info &lt;name&gt;</code>", "Show detailed metadata for one installed plugin."],
    ["<code>netscript plugin doctor</code>", "Health-check installed plugins and report wiring problems."],
    ["<code>netscript plugin update &lt;pkg&gt;</code>", "Dispatch the <code>update</code> verb to the plugin's own published CLI, for example <code>netscript plugin update @netscript/plugin-workers</code>. The argument is a JSR package specifier, not an installed plugin name."],
    ["<code>netscript plugin remove &lt;name&gt;</code>", "Remove an installed plugin from the workspace."]
  ]
} /}}

Run `netscript plugin --help` for the complete command set of your installed version.

## Next step

Give the plugin something to call: [Add a service](/services-sdk/how-to/add-a-service/). For
each plugin's exported API, browse the [package reference](/reference/).
