---
layout: layouts/base.vto
title: CLI reference
templateEngine: [vento, md]
prev: { label: "Glossary", href: "/glossary/" }
---

{{ comp.breadcrumb() }}

# CLI reference

A curated, task-grouped tour of the `netscript` commands you reach for daily. It is
the human companion to the **generated** [`/reference/cli/`](/reference/cli/), which
lists every command, subcommand, and flag verbatim from the published surface. When you
need the exhaustive option spelling, go there — this page covers the common path and the
order things happen in.

{{ comp callout { type: "note", title: "One CLI, public form" } }}
Every command here uses the public <code>netscript &lt;cmd&gt;</code> form backed by the published
JSR package. The vendored <code>packages/cli/...</code> path you may see in a local-source checkout is a
contributor-only shape — a normal install has no <code>packages/</code> tree. Install once (below), then
just type <code>netscript</code>.
{{ /comp }}

{{ comp callout { type: "important", title: "Database commands need Aspire running first" } }}
The <code>netscript db ...</code> commands provision and talk to Postgres <strong>through Aspire</strong>. Aspire is
step 2 of the everyday flow: <code>cd aspire &amp;&amp; aspire run</code> brings up Postgres and Garnet via Docker and
opens the dashboard at <a href="http://localhost:18888">:18888</a> — <strong>before</strong> any <code>db init</code>,
<code>db generate</code>, <code>db seed</code>, or <code>db status</code>. Run a <code>db</code> command with Aspire down and it fails to
find the database. See the <a href="/how-to/database-migration/">database &amp; migration how-to</a>.
{{ /comp }}

## Install

The CLI is published to JSR as `@netscript/cli`. Install it globally for a tidy
`netscript` command on your PATH, or run it ad-hoc with no install at all.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Global install",
    lang: "bash",
    code: "# Installs a `netscript` command on your PATH\ndeno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts\n\nnetscript --help"
  },
  {
    label: "Ad-hoc (no install)",
    lang: "bash",
    code: "# Run the same CLI without installing anything\ndeno run -A jsr:@netscript/cli/bin/netscript.ts --help"
  },
  {
    label: "Upgrade",
    lang: "bash",
    code: "# Re-run the install with --force to pull the latest published version\ndeno install --global --allow-all --force --name netscript jsr:@netscript/cli/bin/netscript.ts"
  }
] }) }}

{{ comp callout { type: "tip" } }}
Install the spec exactly as shown — <code>jsr:@netscript/cli/bin/netscript.ts</code>, not the bare
<code>jsr:@netscript/cli/bin</code>. The trailing <code>/bin/netscript.ts</code> is the executable entrypoint.
{{ /comp }}

## The everyday flow

Most sessions follow the same shape: scaffold a workspace, bring up Aspire, run the
database workflow, then iterate. The commands below are grouped to mirror that order —
and the order matters: **Aspire (step 2) must be up before any `db` command (step 3).**

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "netscript init lays down the whole workspace — contracts, an example service, plugins, and the Aspire layer.",
    icon: "◆"
  },
  {
    title: "2 · Orchestrate",
    body: "cd aspire && aspire run brings up Postgres and Garnet and opens the dashboard at :18888. Do this before any db command.",
    icon: "▶"
  },
  {
    title: "3 · Database",
    body: "netscript db init / generate / seed / status — only after Aspire is up.",
    icon: "▤"
  },
  {
    title: "4 · Extend & generate",
    body: "netscript plugin add, then netscript generate plugins to wire the registry.",
    icon: "✶"
  }
] }) }}

## Scaffold & project

`netscript init` is the one command that creates a complete workspace: shared oRPC
contracts, an optional example service, a Fresh frontend, the plugin registry, and the
Aspire orchestration files. The flags below match the verified scaffold run.

{{ comp.apiTable({
  caption: "Scaffold a workspace",
  rows: [
    { name: "netscript init", type: "netscript init my-app", desc: "Create a NetScript workspace in <code>my-app/</code> — contracts, plugin registry, Fresh app, and the Aspire layer. Add <code>--dry-run</code> to preview every file without writing." },
    { name: "init (full happy path)", type: "netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes", desc: "The fully-specified form: Postgres database support, an example oRPC <code>users</code> service on port 3001, non-interactive (<code>--yes</code>)." },
    { name: "init --no-aspire", type: "netscript init my-app --no-aspire", desc: "Scaffold without the .NET Aspire footprint. You start the Fresh app directly with <code>deno task --cwd apps/dashboard dev</code> and lose the dashboard + multi-resource wiring." },
    { name: "init --path / --editor", type: "netscript init my-app --path ./apps --editor zed", desc: "Place the project under a different directory and emit editor settings (<code>none</code> | <code>zed</code> | <code>vscode</code>)." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Preview before you commit to disk" } }}
<code>netscript init my-app --dry-run</code> prints every file and directory it would create and writes
nothing — a safe way to inspect the scaffold plan first.
{{ /comp }}

## Plugins

Plugins add capabilities — background workers, durable sagas, webhook triggers, durable
streams, and authentication. Each one lands as a canonical install under `plugins/<name>/`
and registers its contributions; the host application never changes. After adding plugins,
regenerate the registry so the project picks them up.

{{ comp.apiTable({
  caption: "Add and manage plugins",
  rows: [
    { name: "netscript plugin add", type: "netscript plugin add worker --samples", desc: "Add a plugin and register it in the workspace. Kinds: <code>worker</code> → <code>workers</code> (:8091), <code>saga</code> → <code>sagas</code> (:8092), <code>trigger</code> → <code>triggers</code> (:8093), <code>auth</code> → <code>auth</code> (:8094), <code>stream</code> → <code>streams</code> (:4437). <code>--samples</code> includes runnable example modules." },
    { name: "netscript plugin add auth", type: "netscript plugin add auth", desc: "Add the first-class <code>auth</code> plugin — the <code>auth-api</code> oRPC service on port 8094 exposing <code>/api/v1/auth/{signin,callback,signout,session,me}</code>. Pulls in <code>auth.prisma</code> (migrated like any other plugin schema) and a single active backend selected by <code>NETSCRIPT_AUTH_BACKEND</code> (default <code>kv-oauth</code>). See <a href=\"/how-to/add-authentication/\">add authentication</a>." },
    { name: "plugin add (options)", type: "netscript plugin add saga --name sagas --port 8092 --service-refs users", desc: "Tune the install: <code>--name</code>, <code>--port</code>, <code>--service-refs</code>, <code>--plugin-refs</code>, <code>--db &lt;engine&gt;</code> / <code>--no-db</code>, <code>--samples</code> / <code>--no-samples</code>, <code>--force</code>." },
    { name: "netscript plugin list", type: "netscript plugin list", desc: "List the plugins registered in the current workspace." },
    { name: "netscript plugin doctor", type: "netscript plugin doctor", desc: "Check the health of installed NetScript plugins — a fast wiring sanity check." },
    { name: "netscript plugin info", type: "netscript plugin info workers", desc: "Run a plugin's published info command for details about a single plugin." },
    { name: "netscript plugin remove", type: "netscript plugin remove workers", desc: "Remove a configured plugin and update workspace registration." }
  ]
}) }}

{{ comp callout { type: "note", title: "Plugins live under plugins/<name>/" } }}
A <code>plugin add</code> installs into <code>plugins/workers</code>, <code>plugins/sagas</code>, <code>plugins/triggers</code>,
<code>plugins/auth</code>, or <code>plugins/streams</code> — the canonical, config-referenced location.
<code>netscript.config.ts</code> points only at <code>./plugins/&lt;name&gt;/mod.ts</code>. See the
<a href="/how-to/add-a-plugin/">add-a-plugin how-to</a>.
{{ /comp }}

### Authentication plugin

The `auth` plugin is a first-class official plugin scaffolded exactly like the others —
`netscript plugin add auth` installs `plugins/auth/`, registers the `auth-api` service on
port 8094, and contributes `plugins/auth/database/auth.prisma`, which is migrated by the
standard `netscript db` workflow alongside every other plugin schema. It composes **one
active backend** at a time, chosen at runtime by the `NETSCRIPT_AUTH_BACKEND` env var.

{{ comp.apiTable({
  caption: "Auth backend selection (NETSCRIPT_AUTH_BACKEND)",
  rows: [
    { name: "kv-oauth (default)", type: "NETSCRIPT_AUTH_BACKEND=kv-oauth", desc: "The default and the only interactive backend — full OAuth/OIDC redirect flow with KV-backed sessions. Needs provider env (<code>NETSCRIPT_AUTH_CLIENT_ID</code>, <code>NETSCRIPT_AUTH_CLIENT_SECRET</code>, <code>NETSCRIPT_AUTH_ISSUER</code>, <code>NETSCRIPT_AUTH_REDIRECT_URI</code>, …)." },
    { name: "workos", type: "NETSCRIPT_AUTH_BACKEND=workos", desc: "Non-interactive AuthKit backend — set <code>WORKOS_API_KEY</code>, <code>WORKOS_CLIENT_ID</code>, <code>WORKOS_COOKIE_PASSWORD</code>. The <code>signin</code>/<code>callback</code> endpoints return a typed unsupported-operation error (no interactive flow)." },
    { name: "better-auth", type: "NETSCRIPT_AUTH_BACKEND=better-auth", desc: "Non-interactive Prisma-backed backend — set <code>BETTER_AUTH_SECRET</code> and <code>DB_PROVIDER</code>. Like WorkOS, the interactive endpoints are unsupported." }
  ]
}) }}

{{ comp callout { type: "note", title: "Auth migrates like any other plugin schema" } }}
After <code>netscript plugin add auth</code>, run the normal database workflow with Aspire up:
<code>netscript db generate</code> then <code>netscript db migrate</code> picks up <code>plugins/auth/database/auth.prisma</code>
(the better-auth-shaped <code>auth_users</code>, <code>auth_sessions</code>, <code>auth_accounts</code>, <code>auth_verifications</code>
tables) exactly like the other plugins. Only the <code>better-auth</code> backend reads these tables —
<code>kv-oauth</code> stores sessions in KV and <code>workos</code> is stateless. Full env table and happy-path setup
are in <a href="/how-to/add-authentication/">add authentication</a>; the architecture is in
<a href="/explanation/auth-model/">the auth model</a>.
{{ /comp }}

## Services & contracts

A NetScript workspace is contract-first: you define an oRPC contract, then a service
implements it. The example `users` service runs on port 3001 and serves its RPC surface
at `/api/rpc/*`.

{{ comp.apiTable({
  caption: "Services and contracts",
  rows: [
    { name: "netscript service add", type: "netscript service add orders --service-port 3002", desc: "Add a new service workspace member and wire its contract. The example <code>users</code> service serves <code>/api/v1/users/*</code> (and oRPC at <code>/api/rpc/*</code>) on port 3001." },
    { name: "netscript service list", type: "netscript service list", desc: "List the services configured in the workspace." },
    { name: "netscript service generate", type: "netscript service generate", desc: "Regenerate the Aspire helper files from your service configuration." },
    { name: "netscript contract add", type: "netscript contract add orders", desc: "Add a versioned oRPC contract (<code>oc.route().input(zod).output(zod)</code> + <code>implement()</code>) to the <code>contracts/</code> workspace." },
    { name: "netscript contract list", type: "netscript contract list", desc: "List the contracts available in the workspace." }
  ]
}) }}

## Database

The database workflow uses Prisma with a Deno runtime. **All of these require Aspire to
be running** — Aspire provisions Postgres, so start it first with `cd aspire && aspire
run`. Plugin schemas (`workers`, `sagas`, `triggers`, **`auth`**) are picked up by the
same `generate` / `migrate` pass. The full task walkthrough is in the
[database & migration how-to](/how-to/database-migration/).

{{ comp.apiTable({
  caption: "Database workflow (Aspire must be running)",
  rows: [
    { name: "netscript db init", type: "netscript db init --name init", desc: "Initialize database tooling and create the named migration. Requires Aspire up — it provisions Postgres through the AppHost." },
    { name: "netscript db generate", type: "netscript db generate", desc: "Run database code generation — the Deno-runtime Prisma client (and zod) into <code>database/postgres/schema/.generated</code>. Includes plugin schemas such as <code>auth.prisma</code>." },
    { name: "netscript db migrate", type: "netscript db migrate", desc: "Apply migrations against the provisioned database — including each plugin's contributed schema (e.g. the <code>auth_*</code> tables from <code>auth.prisma</code>)." },
    { name: "netscript db seed", type: "netscript db seed", desc: "Run the workspace seed scripts to populate initial data." },
    { name: "netscript db status", type: "netscript db status", desc: "Show database migration / tooling status." },
    { name: "netscript db studio", type: "netscript db studio", desc: "Open the database studio tool for browsing data." },
    { name: "netscript db introspect / reset", type: "netscript db reset", desc: "Introspect the configured database, or reset it back to a clean state." }
  ]
}) }}

{{ comp callout { type: "warning", title: "“aspire start failed: project file does not exist”" } }}
This almost always means a <code>db</code> command was run with Aspire down (or from the wrong directory).
The fix is the dev flow order: <code>cd aspire &amp;&amp; aspire run</code> first, leave it running, then run
<code>netscript db init</code> from the project root in a second terminal.
{{ /comp }}

## Code generation

After adding or changing plugins, regenerate the artifacts the project consumes so the
registry and runtime schemas stay in sync.

{{ comp.apiTable({
  caption: "Generate registries & schemas",
  rows: [
    { name: "netscript generate plugins", type: "netscript generate plugins", desc: "Generate the plugin registries from project source. Run this after every <code>plugin add</code> so the workspace picks up new contributions." },
    { name: "netscript generate runtime-schemas", type: "netscript generate runtime-schemas", desc: "Generate runtime configuration schemas from registered plugin metadata." }
  ]
}) }}

## Fresh UI

The frontend is copy-source: components are copied into your repo under
`apps/dashboard`, and the code is yours to own and edit. See
[customize Fresh UI](/how-to/customize-fresh-ui/).

{{ comp.apiTable({
  caption: "UI workspace tasks",
  rows: [
    { name: "ui:init", type: "deno task --cwd apps/dashboard ui:init", desc: "Initialize the fresh-ui design system into the dashboard app (copy-source components + tokens)." },
    { name: "ui:add", type: "deno task --cwd apps/dashboard ui:add", desc: "Copy an additional fresh-ui component into your repo — you own the copied source from that point." }
  ]
}) }}

## Dev & workspace tasks

These are workspace `deno task`s, not `netscript` subcommands — the day-to-day loop once
the scaffold exists. Use `--cwd <member>` to target a specific workspace member.

{{ comp.apiTable({
  caption: "Run and gate the workspace",
  rows: [
    { name: "Run the dashboard", type: "deno task --cwd apps/dashboard dev", desc: "Start the Fresh frontend (or let <code>aspire run</code> orchestrate it for you)." },
    { name: "Run a service", type: "deno task --cwd services/users dev", desc: "Start the example <code>users</code> oRPC service on port 3001." },
    { name: "Type-check", type: "deno task check", desc: "Type-check the whole workspace." },
    { name: "Lint", type: "deno task lint", desc: "Lint the workspace sources." },
    { name: "Format", type: "deno task fmt", desc: "Apply the repo formatting (2-space, single-quote, lineWidth 100)." },
    { name: "Test", type: "deno task test", desc: "Run the workspace test suite." }
  ]
}) }}

## Deploy

Deployment commands build and manage Windows Service artifacts from a deployment
manifest. See [deploy](/how-to/deploy/) for the portability story, including the
`--no-aspire` escape hatch and bare-`deno task` targets.

{{ comp.apiTable({
  caption: "Deployment lifecycle",
  rows: [
    { name: "netscript deploy build", type: "netscript deploy build", desc: "Build the Windows Service deployment artifacts." },
    { name: "netscript deploy package-cli", type: "netscript deploy package-cli", desc: "Compile a standalone deployment CLI artifact." },
    { name: "netscript deploy install / start / stop", type: "netscript deploy install", desc: "Install, start, and stop Windows Services from a deployment manifest." },
    { name: "netscript deploy status / logs", type: "netscript deploy status", desc: "Show service status and print deployment logs." },
    { name: "netscript deploy upgrade / uninstall", type: "netscript deploy upgrade", desc: "Upgrade an installed deployment, or uninstall the services entirely." }
  ]
}) }}

## The full surface

This page is curated for the common path. For every command, every subcommand, and every
flag — generated directly from the published package — see the reference:

{{ comp.featureGrid({ items: [
  {
    title: "Generated CLI reference",
    body: "The exhaustive, always-current command surface — every flag and subcommand, from the @netscript/cli package.",
    href: "/reference/cli/",
    icon: "≡"
  },
  {
    title: "Quickstart",
    body: "Install → init → aspire run → db → hit an endpoint, in about five minutes.",
    href: "/quickstart/",
    icon: "▸"
  },
  {
    title: "Database & migration",
    body: "The full db workflow, with the Aspire-up dependency spelled out step by step.",
    href: "/how-to/database-migration/",
    icon: "▤"
  },
  {
    title: "Add authentication",
    body: "Add the auth plugin, pick a backend via NETSCRIPT_AUTH_BACKEND, migrate auth.prisma, and wire the kv-oauth happy path.",
    href: "/how-to/add-authentication/",
    icon: "🔑"
  }
] }) }}

{{ comp callout { type: "tip", title: "Discover flags in your installed version" } }}
The flags here are the common ones. For the exact spelling in <em>your</em> installed CLI, run
<code>netscript --help</code> or <code>netscript &lt;group&gt; --help</code> (for example <code>netscript db --help</code>).
{{ /comp }}

{{ comp.nextPrev({ prev: { label: "Glossary", href: "/glossary/" } }) }}
