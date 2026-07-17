---
layout: layouts/base.vto
title: CLI reference
templateEngine: [vento, md]
prev: { label: "Glossary", href: "/glossary/" }
---

# CLI reference

A curated, task-grouped tour of the `netscript` commands you reach for daily. It is
the human companion to the [command reference](/reference/cli/commands/), which lists every
command, subcommand, and flag verbatim. When you need the exhaustive option spelling, go
there — this page covers the common path and the order things happen in. (The separate
[`@netscript/cli` package reference](/reference/cli/) documents the embeddable TypeScript
surface, not the terminal commands.)

{{ comp callout { type: "note", title: "One CLI, public form" } }}
Every command here uses the public <code>netscript &lt;cmd&gt;</code> form backed by the published
JSR package. The vendored <code>packages/cli/...</code> path you may see in a local-source checkout is a
contributor-only shape — a normal install has no <code>packages/</code> tree. Install once (below), then
use <code>netscript</code>.
{{ /comp }}

{{ comp callout { type: "important", title: "Database commands need Aspire running first" } }}
The <code>netscript db ...</code> commands provision and talk to your database <strong>through Aspire</strong> — Postgres is the recommended
engine, or <code>mysql</code> / <code>mssql</code> / <code>sqlite</code> when you scaffold with <code>--db</code>. Aspire is
step 2 of the everyday flow: <code>cd aspire &amp;&amp; aspire start</code> brings up Postgres and Redis via Docker and
opens the dashboard at <a href="https://localhost:18888">:18888</a> — <strong>before</strong> any <code>db init</code>,
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
    code: "# Installs a `netscript` command on your PATH\ndeno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + "\n\nnetscript --help"
  },
  {
    label: "Ad-hoc (no install)",
    lang: "bash",
    code: "# Run the same CLI without installing anything\ndeno x jsr:@netscript/cli" + releaseSpecifier + " --help"
  },
  {
    label: "Upgrade",
    lang: "bash",
    code: "# Re-run the install with --force to pull the latest published version\ndeno install --global --allow-all --force --name netscript jsr:@netscript/cli" + releaseSpecifier + ""
  }
] }) }}

{{ comp callout { type: "tip" } }}
Use <code>deno x jsr:@netscript/cli{{ releaseSpecifier }}</code> for ad-hoc runs, or install the same default export as
<code>netscript</code> when you want a PATH command.
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
    body: "cd aspire && aspire start brings up your database (Postgres is the recommended engine; or mysql/mssql/sqlite via --db) and Redis, and opens the dashboard at :18888. Do this before any db command.",
    icon: "▶"
  },
  {
    title: "3 · Database",
    body: "netscript db init / generate / seed / status — only after Aspire is up.",
    icon: "▤"
  },
  {
    title: "4 · Extend & generate",
    body: "netscript plugin install, then netscript generate plugins to wire the registry.",
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
    { name: "netscript init", type: "netscript init my-app", desc: "Create a NetScript workspace in <code>my-app/</code> — contracts, plugin registry, Fresh app, a default Redis cache, and the Aspire layer. On a terminal it prompts for anything you omit (name, database, service, cache); add <code>--dry-run</code> to preview every file without writing." },
    { name: "init (full happy path)", type: "netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes", desc: "The fully-specified, non-interactive form (<code>--yes</code>): Postgres database support (swap <code>--db postgres</code> for <code>mysql</code>, <code>mssql</code>, <code>sqlite</code>, or <code>none</code>), an example oRPC <code>users</code> service on port 3001, and the default Redis cache resource." },
    { name: "init --model-name", type: "netscript init my-app --db postgres --service --model-name Product", desc: "Name the Prisma model for the scaffolded CRUD surface. With a database engine and an example service, <code>netscript init</code> now generates a real Prisma-backed CRUD contract + handlers (authored under <code>contracts/versions/v1/</code>) and an oRPC playground landing page at <code>GET /</code>. Omit the flag and the model name is derived from the singularized service name — service <code>users</code> → model <code>User</code>; it must be a PascalCase identifier." },
    { name: "init --cache / --cache-backend", type: "netscript init my-app --cache-backend garnet", desc: "The shared cache is on by default with the <code>redis</code> backend. Pick another with <code>--cache-backend</code>: <code>redis</code> (default) or <code>garnet</code> are provisioned as Aspire container resources; <code>deno-kv</code> is app-level and needs no container. Pass <code>--cache=false</code> to scaffold without a cache." },
    { name: "init --no-aspire", type: "netscript init my-app --no-aspire", desc: "Scaffold without the .NET Aspire footprint. You start the Fresh app directly with <code>deno task --cwd apps/dashboard dev</code> and lose the dashboard + multi-resource wiring." },
    { name: "init --path / --editor", type: "netscript init my-app --path ./apps --editor zed", desc: "Place the project under a different directory and emit editor settings (<code>none</code> | <code>zed</code> | <code>vscode</code>)." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Preview before you commit to disk" } }}
<code>netscript init my-app --dry-run</code> prints every file and directory it would create and writes
nothing — a safe way to inspect the scaffold plan first.
{{ /comp }}

{{ comp callout { type: "note", title: "Interactive vs non-interactive" } }}
On a terminal, <code>netscript init</code> prompts for any option you do not pass on the command line —
the project name, database engine, example service (and its name), the frontend application name, and
the two cache questions (enable the cache, then choose <code>redis</code> | <code>garnet</code> |
<code>deno-kv</code>). For scripts and CI, pass <code>--yes</code> (accept defaults) or <code>--ci</code>
(non-interactive) to skip every prompt — both also engage automatically when stdin is not a terminal.
The defaults scaffold a Fresh + Aspire workspace with a <code>redis</code> cache and <strong>no database</strong>
unless you pass <code>--db</code>. Run <code>netscript --version</code> to print the installed CLI version.
{{ /comp }}

## Contracts

Contracts live in explicit version folders and are aggregated for typed service and client
consumers. The lifecycle surface in this release creates and discovers v1 contract modules; evolve
breaking shapes in a parallel version rather than overwriting a contract that existing consumers
still use.

{{ comp.apiTable({
  caption: "Contract workspace commands",
  rows: [
    { name: "netscript contract add", type: "netscript contract add catalog-items", desc: "Create <code>contracts/versions/v1/catalog-items.contract.ts</code> from the NetScript oRPC contract template and regenerate the v1 aggregate exports. Run it from the workspace root, or pass <code>--path &lt;workspace&gt;</code>. Existing contract files are preserved unless you pass <code>--force</code>." },
    { name: "contract add --version", type: "netscript contract add catalog-items --version v1", desc: "Select the target contract version. This release supports <code>v1</code>; parallel-version evolution is tracked separately and is not implied by <code>--force</code>." },
    { name: "netscript contract list", type: "netscript contract list", desc: "List v1 contract modules and show whether each has a matching service workspace. Pass <code>--path &lt;workspace&gt;</code> when invoking it from outside the project." }
  ]
}) }}

{{ comp callout { type: "note", title: "Contract add creates the typed starting point" } }}
<code>contract add</code> replaces the manual step of creating and exporting an initial versioned
contract file. Add your domain-specific procedures to that generated module. Route-level mutation,
handler generation, detailed JSON inspection, removal, and v2 promotion belong to the follow-up
contract-evolution surface.
{{ /comp }}

## Plugins

Plugins add capabilities — background workers, durable sagas, webhook triggers, durable
streams, and authentication. Public install adds the plugin package dependency, emits
workspace-owned glue and samples that import it, and registers its contributions; the host application never changes. After adding plugins,
regenerate the registry so the project picks them up.

{{ comp.apiTable({
  caption: "Public plugin install (netscript)",
  rows: [
    { name: "netscript plugin install", type: "netscript plugin install <kind-or-package> --name <name> [--project-root <path>]", desc: "Install a plugin dependency, emit the workspace glue that imports it, and register it with Aspire. The positional value accepts official bare aliases such as <code>workers</code> or <code>auth</code>, scoped package specs such as <code>@netscript/plugin-workers</code>, and <code>jsr:</code> package specs." },
    { name: "netscript plugin install workers", type: "netscript plugin install workers --name workers", desc: "Install the official workers plugin via its verified bare alias. The equivalent package-spec form is <code>netscript plugin install @netscript/plugin-workers --name workers</code>." },
    { name: "netscript plugin install auth", type: "netscript plugin install auth --name auth", desc: "Install the official auth plugin — the <code>auth-api</code> oRPC service on port 8094 exposing <code>/api/v1/auth/{signin,callback,signout,session,me}</code>. Pulls in <code>auth.prisma</code> and a single active backend selected by <code>NETSCRIPT_AUTH_BACKEND</code> (default <code>kv-oauth</code>). See <a href=\"/how-to/add-authentication/\">add authentication</a>." },
    { name: "netscript plugin new", type: "netscript plugin new billing", desc: "Scaffold a brand-new first-party plugin as a two-tier pair: a JSR-publishable core engine package under <code>packages/plugin-&lt;name&gt;-core/</code> (domain, ports, application, contracts, testing doubles) and a thin connector under <code>plugins/&lt;name&gt;/</code> (manifest, adapter, aspire, cli, scaffold, services) that re-exports the core contract. Scaffolds a proxy connector by default; pass <code>--feature</code> for a route-backed feature connector, and <code>--force</code> to overwrite existing files. See <a href=\"/how-to/author-a-plugin/\">author a plugin</a>." },
    { name: "netscript plugin list", type: "netscript plugin list", desc: "List the plugins registered in the current workspace." },
    { name: "netscript plugin doctor", type: "netscript plugin doctor", desc: "Check the health of installed NetScript plugins — a fast wiring sanity check." },
    { name: "netscript plugin info", type: "netscript plugin info workers", desc: "Run a plugin's published info command for details about a single plugin." },
    { name: "netscript plugin remove", type: "netscript plugin remove workers", desc: "Remove a configured plugin and update workspace registration." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Local contributor plugin scaffolding (netscript-dev)",
  rows: [
    { name: "plugin install worker", type: "deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples", desc: "Local-source contributor path for first-party worker samples against the monorepo checkout." },
    { name: "plugin install saga", type: "deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --samples", desc: "Local-source contributor path for sagas samples." },
    { name: "plugin install trigger", type: "deno run -A packages/cli/bin/netscript-dev.ts plugin install trigger --name triggers --samples", desc: "Local-source contributor path for triggers samples." },
    { name: "plugin install stream", type: "deno run -A packages/cli/bin/netscript-dev.ts plugin install stream --name streams --samples", desc: "Local-source contributor path for streams samples." },
    { name: "plugin install options", type: "--name --port --service-refs --plugin-refs --db/--no-db --samples/--no-samples --force", desc: "These framework-level install flags are shared with the public <code>netscript plugin install</code> command; <code>netscript-dev</code> uses local monorepo sources for contributor validation." }
  ]
}) }}

{{ comp callout { type: "note", title: "Public install emits glue, not copied internals" } }}
A public <code>plugin install</code> runs the plugin package's scaffolder and emits user-owned glue
such as <code>workers/mod.ts</code>, <code>workers/runtime.ts</code>, or <code>auth/mod.ts</code>.
The plugin's service, runtime, contract, and schema internals stay in the installed dependency.
Contributor workflows can still materialize full local source from a NetScript checkout. See the
<a href="/how-to/add-a-plugin/">add-a-plugin how-to</a>.
{{ /comp }}

### Authentication plugin

The `auth` plugin is a first-class official plugin scaffolded exactly like the others —
`netscript plugin install auth` installs the `@netscript/plugin-auth` dependency, emits
the user-owned `auth/mod.ts` glue barrel, registers the `auth-api` service on port 8094,
and contributes the package-provided `auth.prisma` schema to the standard `netscript db`
workflow alongside every other plugin schema. It composes **one
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
After <code>netscript plugin install auth</code>, run the normal database workflow with Aspire up:
<code>netscript db generate</code> then <code>netscript db migrate</code> picks up the auth plugin's package-provided Prisma schema
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

The database workflow uses Prisma with a Deno runtime, and the engine is **polyglot**:
`netscript init --db postgres` (the recommended default) or `mysql`, `mssql`, or `sqlite`.
Postgres, MySQL, and SQL Server each run as an Aspire container resource; **`sqlite` is
file-backed and has no Aspire container**. **All of the container-backed engines require
Aspire to be running** — Aspire provisions the database, so start it first with
`cd aspire && aspire start`. Plugin schemas (`workers`, `sagas`, `triggers`, **`auth`**)
are picked up by the same `generate` / `migrate` pass. The full task walkthrough is in the
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

{{ comp callout { type: "note", title: "Two ways to run the DB workflow: with Aspire and without" } }}
Every <code>netscript db &lt;op&gt;</code> command is <strong>Aspire-coupled</strong> — it shells out to the
Aspire AppHost, so <code>aspire</code> must be on your PATH and the apphost running. The scaffolded
workspace <em>also</em> defines <strong>aspire-less</strong> <code>deno task db:*</code> tasks
(<code>db:generate</code>, <code>db:migrate</code>, <code>db:seed</code>, <code>db:studio</code>, …) inside
<code>database/&lt;engine&gt;/</code> that run Prisma directly with no Aspire. Use the <code>deno task db:*</code>
form in deno-only or CI jobs that have no Aspire; use <code>netscript db *</code> for the orchestrated
local flow.
{{ /comp }}

{{ comp callout { type: "warning", title: "“aspire start failed: project file does not exist”" } }}
This almost always means a <code>db</code> command was run with Aspire down (or from the wrong directory).
The fix is the dev flow order: <code>cd aspire &amp;&amp; aspire start</code> first, leave it running, then run
<code>netscript db init</code> from the project root in a second terminal.
{{ /comp }}

## Code generation

After adding or changing plugins, regenerate the artifacts the project consumes so the
registry and runtime schemas stay in sync.

{{ comp.apiTable({
  caption: "Generate registries & schemas",
  rows: [
    { name: "netscript generate plugins", type: "netscript generate plugins", desc: "Generate the plugin registries from project source. Run this after every <code>plugin install</code> so the workspace picks up new contributions." },
    { name: "netscript generate runtime-schemas", type: "netscript generate runtime-schemas", desc: "Generate runtime configuration schemas from registered plugin metadata." },
    { name: "netscript generate aspire", type: "netscript generate aspire", desc: "Regenerate the Aspire AppHost helpers from <code>appsettings.json</code> without re-scaffolding the project. Pass <code>--project-root &lt;path&gt;</code> to target a workspace outside the current directory." },
  ]
}) }}

## Fresh UI

The frontend is copy-source: components are copied into your repo under
`apps/dashboard`, and the code is yours to own and edit. See
[customize Fresh UI](/how-to/customize-fresh-ui/).

{{ comp.apiTable({
  caption: "UI workspace tasks",
  rows: [
    { name: "ui:init", type: "netscript ui:init --project-root apps/dashboard", desc: "Initialize the fresh-ui design system into the dashboard app (copy-source components + tokens)." },
    { name: "ui:add", type: "netscript ui:add <item> --project-root apps/dashboard", desc: "Copy an additional fresh-ui component into your repo — you own the copied source from that point." }
  ]
}) }}

## Dev & workspace tasks

These are workspace `deno task`s, not `netscript` subcommands — the day-to-day loop once
the scaffold exists. Use `--cwd <member>` to target a specific workspace member.

{{ comp.apiTable({
  caption: "Run and gate the workspace",
  rows: [
    { name: "Run the dashboard", type: "deno task --cwd apps/dashboard dev", desc: "Start the Fresh frontend (or let <code>aspire start</code> orchestrate it for you)." },
    { name: "Run a service", type: "deno task --cwd services/users dev", desc: "Start the example <code>users</code> oRPC service on port 3001." },
    { name: "Type-check", type: "deno task check", desc: "Type-check the whole workspace." },
    { name: "Lint", type: "deno task lint", desc: "Lint the workspace sources." },
    { name: "Format", type: "deno task fmt", desc: "Apply the repo formatting (2-space, single-quote, lineWidth 100)." },
    { name: "Test", type: "deno task test", desc: "Run the workspace test suite." }
  ]
}) }}

## Deploy

Two deploy paths are wired today: the **Deno Deploy** cloud target and the pre-existing
**Windows Service** (Servy) path. See [deploy](/how-to/deploy/) for the portability story,
including the `--no-aspire` escape hatch and bare-`deno task` targets.

### Deno Deploy (cloud target)

`netscript deploy deno-deploy <op>` is a thin router over the native `deno deploy` CLI — it
shells `deno deploy …`, so that CLI must be on your PATH and authentication is delegated to it
(NetScript issues no credentials of its own).

{{ comp.apiTable({
  caption: "netscript deploy deno-deploy <op>",
  rows: [
    { name: "deno-deploy plan", type: "netscript deploy deno-deploy plan", desc: "Preflight the project for Deno Deploy (runs the unstable-API guard only; never pushes)." },
    { name: "deno-deploy up", type: "netscript deploy deno-deploy up [--prod] [--dry-run]", desc: "Push a deployment (<code>deno deploy [--prod]</code>). <code>--dry-run</code> is equivalent to <code>plan</code> and does not push." },
    { name: "deno-deploy down", type: "netscript deploy deno-deploy down", desc: "Delete the deployment." },
    { name: "deno-deploy status", type: "netscript deploy deno-deploy status", desc: "Show deployment status." },
    { name: "deno-deploy logs", type: "netscript deploy deno-deploy logs", desc: "Show deployment logs." }
  ]
}) }}

Every op shares five flags: `--org <slug>`, `--app <name>`, `--entrypoint <path>`,
`--env-file <path>`, and `--project-root <dir>`. CLI flags override the optional
`deploy.targets['deno-deploy']` config block, and flags alone are sufficient (config is optional).

{{ comp callout { type: "warning", title: "The unstable-API guard blocks `up --prod`" } }}
<code>plan</code> and <code>up</code> run a best-effort <strong>unstable-API guard</strong> that scans
<code>deno.json#unstable</code> and your entrypoint for <code>Deno.openKv</code>, <code>Deno.cron</code>,
<code>new BroadcastChannel</code>, and <code>Temporal.</code>. Deno Deploy rejects <code>--unstable-*</code>
flags, so <code>up --prod</code> <strong>refuses to push</strong> when the guard finds a violation; a preview
(non-prod) push warns but proceeds.
{{ /comp }}

{{ comp callout { type: "note", title: "docker / compose / linux are not wired yet" } }}
<code>netscript deploy docker</code> and <code>netscript deploy compose</code> command groups exist but
are <strong>not wired</strong> — they expose no runnable verbs and only print help. Bare-metal
<code>linux</code> deploy is likewise planning-only. Only the Windows Service path and
<code>deno-deploy</code> run today.
{{ /comp }}

### Windows Service (Servy)

The pre-existing Windows path builds and manages Windows Service artifacts from a deployment
manifest via Servy.

{{ comp.apiTable({
  caption: "Windows Service deployment lifecycle",
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
flag, see the command reference:

{{ comp.featureGrid({ items: [
  {
    title: "Command reference",
    body: "The exhaustive command surface — every command, subcommand, and flag verbatim.",
    href: "/reference/cli/commands/",
    icon: "≡"
  },
  {
    title: "Quickstart",
    body: "Install → init → aspire start → db → hit an endpoint, in about five minutes.",
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
