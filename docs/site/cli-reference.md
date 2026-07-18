---
layout: layouts/base.vto
title: CLI reference
templateEngine: [vento, md]
prev: { label: "Glossary", href: "/glossary/" }
---

# CLI reference

This is the cheat-sheet: which `netscript` command we reach for, grouped by task. Each
section lists the everyday spelling and stops there — every flag, subcommand, and
extended verb lives in the [command reference](/reference/cli/commands/), and the
embeddable TypeScript surface is on the [`@netscript/cli` package page]({{ "ref:cli" |> xref }}).
Every command here uses the public `netscript <cmd>` form backed by the published JSR
package; the vendored `packages/cli/...` path you may see in a local-source checkout is a
contributor-only shape.

{{ comp callout { type: "important", title: "Database commands need Aspire running first" } }}
The <code>netscript db ...</code> commands provision and talk to your database <strong>through Aspire</strong>.
<code>cd aspire &amp;&amp; aspire start</code> brings up Postgres and Redis via Docker and opens the dashboard at
<a href="https://localhost:18888">:18888</a> — do this <strong>before</strong> any <code>db</code> command
(<code>sqlite</code> is the file-backed exception with no container). Run a <code>db</code> command with Aspire
down and it fails to find the database — the “aspire start failed: project file does not exist” error almost
always means exactly this. See the <a href="/data-persistence/how-to/database-migration/">database &amp; migration how-to</a>.
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

`netscript --version` prints the installed CLI version; `netscript --help` and
`netscript <group> --help` (for example `netscript db --help`) show the exact flag
spelling your installed version ships.

## The everyday flow

Most sessions follow the same shape, and the order matters: **Aspire (step 2) must be up
before any `db` command (step 3).**

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "netscript init lays down the whole workspace — contracts, an example service, plugins, and the Aspire layer.",
    icon: "◆"
  },
  {
    title: "2 · Orchestrate",
    body: "cd aspire && aspire start brings up your database and Redis, and opens the dashboard at :18888. Do this before any db command.",
    icon: "▶"
  },
  {
    title: "3 · Database",
    body: "netscript db init / generate / migrate / seed — only after Aspire is up.",
    icon: "▤"
  },
  {
    title: "4 · Extend & generate",
    body: "netscript plugin install, then netscript generate plugins to wire the registry.",
    icon: "✶"
  }
] }) }}

## Scaffold a workspace

{{ comp.apiTable({
  caption: "netscript init",
  rows: [
    { name: "Create a workspace", type: "netscript init my-app", desc: "Scaffold everything — contracts, plugin registry, Fresh app, a default Redis cache, and the Aspire layer. On a terminal it prompts for whatever you omit (name, database, service, cache)." },
    { name: "Preview first", type: "netscript init my-app --dry-run", desc: "Print every file and directory the scaffold would create, and write nothing." },
    { name: "Fully specified, no prompts", type: "netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes", desc: "Postgres database support, an example oRPC <code>users</code> service on port 3001, defaults for the rest. <code>--yes</code> accepts defaults, <code>--ci</code> is non-interactive; both engage automatically when stdin is not a terminal." },
    { name: "Pick a database engine", type: "netscript init my-app --db postgres", desc: "<code>postgres</code> (recommended), <code>mysql</code>, <code>mssql</code>, <code>sqlite</code>, or <code>none</code> — the default is no database unless you pass <code>--db</code>." },
    { name: "Skip Aspire", type: "netscript init my-app --no-aspire", desc: "Scaffold without the .NET Aspire footprint; start the Fresh app directly with <code>deno task --cwd apps/dashboard dev</code>." },
    { name: "Tune the rest", type: "--cache-backend garnet · --model-name Product · --path ./apps · --editor zed", desc: "Cache backend (<code>redis</code> default, <code>garnet</code>, or app-level <code>deno-kv</code>; <code>--cache=false</code> for none), the Prisma model name for the scaffolded CRUD surface, the target directory, and editor settings." }
  ]
}) }}

Every `init` flag — including `--app-name`, `--no-git`, `--force`, `--json`, and
`--from <preset>` — is spelled out in the [command reference](/reference/cli/commands/).

## Run & iterate

These are workspace `deno task`s, not `netscript` subcommands — the day-to-day loop once
the scaffold exists.

{{ comp.apiTable({
  caption: "Run and gate the workspace",
  rows: [
    { name: "Orchestrate everything", type: "cd aspire && aspire start", desc: "Bring up the database, Redis, services, and plugin processors, with the dashboard at :18888." },
    { name: "Run the dashboard alone", type: "deno task --cwd apps/dashboard dev", desc: "Start the Fresh frontend directly (or let <code>aspire start</code> orchestrate it)." },
    { name: "Run a service alone", type: "deno task --cwd services/users dev", desc: "Start the example <code>users</code> oRPC service on port 3001." },
    { name: "Check, lint, test", type: "deno task check · deno task lint · deno task fmt · deno task test", desc: "Type-check, lint, format, and test the whole workspace." }
  ]
}) }}

## Services & contracts

A NetScript workspace is contract-first: you define an oRPC contract, then a service
implements it.

{{ comp.apiTable({
  caption: "Services and contracts",
  rows: [
    { name: "Add a service", type: "netscript service add --name orders --port 3002", desc: "Add a service workspace member, its v1 contract, and the Aspire registration." },
    { name: "Add a contract", type: "netscript contract add catalog-items", desc: "Create <code>contracts/versions/v1/catalog-items.contract.ts</code> from the oRPC contract template and regenerate the v1 aggregate exports." },
    { name: "Add a route + handler", type: "netscript contract add-route · netscript service add-handler", desc: "Append a typed procedure to a contract, then bind it with a compiling service handler stub." },
    { name: "See what exists", type: "netscript service list · netscript contract list · netscript contract inspect <name>", desc: "List services, list v1 contract modules (and whether each has a matching service), and inspect a contract's procedures and schemas." },
    { name: "Regenerate Aspire helpers", type: "netscript service generate", desc: "Regenerate the Aspire helper files from your service configuration." }
  ]
}) }}

The full groups — `service set` / `remove` / `ref add`, `contract remove` /
`version add`, and every flag — are in the [command reference](/reference/cli/commands/).

## Plugins

Plugins add capabilities — background workers, durable sagas, webhook triggers, durable
streams, authentication. Public install adds the plugin package dependency, emits
workspace-owned glue that imports it, and registers its contributions; the plugin's
internals stay in the installed dependency.

{{ comp.apiTable({
  caption: "Plugin lifecycle",
  rows: [
    { name: "Install an official plugin", type: "netscript plugin install workers --name workers", desc: "Bare aliases (<code>workers</code>, <code>auth</code>, …), scoped specs (<code>@netscript/plugin-workers</code>), and <code>jsr:</code> specs all work. After auth, pick the runtime backend with <code>NETSCRIPT_AUTH_BACKEND</code> — see <a href=\"/identity-access/how-to/add-authentication/\">add authentication</a>." },
    { name: "Wire the registry", type: "netscript generate plugins", desc: "Regenerate the plugin registries from project source. Run this after every <code>plugin install</code>." },
    { name: "Check health", type: "netscript plugin list · netscript plugin doctor · netscript plugin info workers", desc: "List registered plugins, run the wiring sanity check, and show a single plugin's details." },
    { name: "Author your own", type: "netscript plugin new billing", desc: "Scaffold a new two-tier plugin: a JSR-publishable core package plus a thin connector. See <a href=\"/orchestration-runtime/how-to/author-a-plugin/\">author a plugin</a>." },
    { name: "Discover & maintain", type: "netscript marketplace search <query> · netscript plugin update <name> · netscript plugin remove <name>", desc: "Search the plugin marketplace, re-pin and regenerate an installed plugin, or remove one and update workspace registration." }
  ]
}) }}

The extended verbs — `plugin sync`, `enable` / `disable` / `setup`, `item-add`, and the
`plugin auth` backend/provider/session subcommands — are in the
[command reference](/reference/cli/commands/).

## Database

The database workflow uses Prisma with a Deno runtime, and every command below requires
Aspire to be running first (`cd aspire && aspire start`) — `sqlite` being the file-backed
exception. Plugin schemas (`workers`, `sagas`, `triggers`, `auth`) are picked up by the
same `generate` / `migrate` pass. The walkthrough is the
[database & migration how-to]({{ "howto:database-migration" |> xref }}).

{{ comp.apiTable({
  caption: "Database workflow (Aspire must be running)",
  rows: [
    { name: "Initialize + first migration", type: "netscript db init --name init", desc: "Initialize database tooling and create the named migration." },
    { name: "Generate the client", type: "netscript db generate", desc: "Generate the Deno-runtime Prisma client (and zod) — including plugin schemas such as <code>auth.prisma</code>." },
    { name: "Migrate & seed", type: "netscript db migrate · netscript db seed", desc: "Apply migrations (including each plugin's contributed schema), then run the workspace seed scripts." },
    { name: "Inspect", type: "netscript db status · netscript db studio", desc: "Show migration/tooling status, or open the database studio for browsing data." },
    { name: "Recover", type: "netscript db introspect · netscript db reset", desc: "Introspect the configured database, or reset it back to a clean state." },
    { name: "Multiple databases", type: "netscript db add <engine> · netscript db list", desc: "Add a second database workspace to an existing project and list registered targets." }
  ]
}) }}

The scaffolded workspace also defines Aspire-less `deno task db:*` tasks
(`db:generate`, `db:migrate`, `db:seed`, `db:studio`, …) inside `database/<engine>/` that
run Prisma directly — the form to use in deno-only or CI jobs. The target-management and
migration-history verbs (`db deploy`, `validate`, `resolve`, `remove`) are in the
[command reference](/reference/cli/commands/).

## Generate

After adding or changing plugins or configuration, regenerate the artifacts the project
consumes.

{{ comp.apiTable({
  caption: "Code generation",
  rows: [
    { name: "Plugin registries", type: "netscript generate plugins", desc: "Regenerate the plugin registries from project source — the post-install step." },
    { name: "Runtime config schemas", type: "netscript generate runtime-schemas", desc: "Generate JSON Schema files for runtime configuration topics." },
    { name: "Aspire helpers", type: "netscript generate aspire", desc: "Regenerate the Aspire AppHost helpers from <code>appsettings.json</code> without re-scaffolding." }
  ]
}) }}

Related: `netscript config inspect` / `get` / `set` read and write the resolved project
configuration, and `netscript config override` manages versioned runtime overrides — the
full subcommand table is in the [command reference](/reference/cli/commands/).

## Fresh UI

The frontend is copy-source: components are copied into your repo under
`apps/dashboard`, and the code is yours to own and edit. See
[customize Fresh UI]({{ "howto:customize-fresh-ui" |> xref }}).

{{ comp.apiTable({
  caption: "UI registry commands",
  rows: [
    { name: "Initialize the design system", type: "netscript ui:init --project-root apps/dashboard", desc: "Copy the fresh-ui components and tokens into the dashboard app." },
    { name: "Add a component", type: "netscript ui:add <item> --project-root apps/dashboard", desc: "Copy an additional registry item — you own the copied source from that point." },
    { name: "List & maintain", type: "netscript ui:list · netscript ui:update · netscript ui:remove <name>", desc: "List registry items, update only files you have not modified, or remove a copied item." }
  ]
}) }}

## Deploy

Two deploy paths are wired today: the **Deno Deploy** cloud target and the
**Windows Service** (Servy) path. `netscript deploy docker` and `deploy compose` exist as
command groups but are not wired — they only print help. See
[deploy]({{ "howto:deploy" |> xref }}) for the portability story.

{{ comp.apiTable({
  caption: "Deploy commands",
  rows: [
    { name: "Deno Deploy: preflight", type: "netscript deploy deno-deploy plan", desc: "Run the unstable-API guard (scans for <code>Deno.openKv</code>, <code>Deno.cron</code>, <code>BroadcastChannel</code>, <code>Temporal</code>) without pushing. The same guard <strong>blocks</strong> <code>up --prod</code> on a violation; a preview push warns but proceeds." },
    { name: "Deno Deploy: lifecycle", type: "netscript deploy deno-deploy up [--prod] · down · status · logs", desc: "Push, delete, and inspect the deployment. A thin router over the native <code>deno deploy</code> CLI — it must be on your PATH and handles authentication." },
    { name: "Windows Service: build", type: "netscript deploy build", desc: "Build the Windows Service deployment artifacts from a deployment manifest via Servy." },
    { name: "Windows Service: lifecycle", type: "netscript deploy install · start · stop · status · logs · upgrade · uninstall", desc: "Install, run, inspect, upgrade, and remove Windows Services from the manifest." }
  ]
}) }}

The shared flags (`--org`, `--app`, `--entrypoint`, `--env-file`, `--project-root`), the
planning-only cloud targets, and the artifact-copy verbs are in the
[command reference](/reference/cli/commands/).

## Agent tooling

{{ comp.apiTable({
  caption: "AI agent commands",
  rows: [
    { name: "Install agent tooling", type: "netscript agent init", desc: "Install NetScript MCP and skills for detected agent hosts (<code>--host claude</code>, <code>vscode</code>, or <code>all</code>)." },
    { name: "Run the MCP server", type: "netscript agent mcp", desc: "Start the NetScript MCP server over standard input/output." }
  ]
}) }}

See [Agent tooling](/ai/agent-tooling/) for the mental model.

## The full surface

This page is the curated common path. For every command, every subcommand, and every
flag — spelled exactly as the installed CLI prints it — go to the
[command reference](/reference/cli/commands/); for the embeddable package API, the
[`@netscript/cli` package page]({{ "ref:cli" |> xref }}).

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
    href: "/data-persistence/how-to/database-migration/",
    icon: "▤"
  },
  {
    title: "@netscript/cli package",
    body: "The generated package reference — the embeddable TypeScript surface, not the command tree.",
    href: "/reference/cli/",
    icon: "◇"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Glossary", href: "/glossary/" } }) }}
