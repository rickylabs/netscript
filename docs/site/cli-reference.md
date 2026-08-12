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

## Mutation and regeneration map

Use this map before a command that writes. “Source of truth” is the declaration the command owns;
generated artifacts can be deleted and rebuilt from it unless the row says the command creates
workspace-owned source. “Preview” is deliberately explicit: do not assume every mutating command
accepts `--dry-run`.

| Command | Source of truth mutated | Generated artifacts | Runtime consumers | Preview |
| --- | --- | --- | --- | --- |
| `netscript init` | New workspace choices and root configuration | Entire workspace, app/service/plugin/database skeletons, Aspire graph | Deno tasks, Fresh app, services, plugin runtimes, Aspire | `--dry-run` |
| `netscript config set` | Generated `aspire/appsettings.json` value | None beyond the configuration write | AppHost generator and resources reading the setting | No |
| `netscript contract add` / `netscript contract add-route` | Workspace-owned versioned contract source | Version aggregate exports | Service handlers, SDK clients, OpenAPI/RPC routers | No |
| `netscript contract version add` / `netscript contract remove` | Versioned contract source | Version and root aggregate exports | Service and SDK imports | No |
| `netscript service add` / `netscript service set` / `netscript service remove` | Service workspace plus `aspire/appsettings.json` | Contract aggregates, optional `apps/<app>/lib/<service>.ts` via `--with-client`, and Aspire helper files | AppHost resource graph, typed callers | No |
| `netscript service ref add` / `netscript service ref remove` | Caller `ServiceReferences` in `aspire/appsettings.json` | Aspire helper files | AppHost environment/reference injection | No |
| `netscript db add` / `netscript db remove` | Database target configuration and workspace membership | Aspire configuration and AppHost helpers | Prisma tasks, services, Aspire resources | No |
| `netscript db init` / `netscript db migrate` | Prisma schema and migration history | Migration directories and generated client inputs | Prisma engine and application repositories | No; database operation |
| `netscript db generate` | Prisma schema, including plugin contributions | Prisma client and Zod output | Services, plugins, repositories | No |
| `netscript plugin install` / `netscript plugin update` / `netscript plugin remove` | Plugin dependency and host registration | Workspace glue, plugin registries, Aspire helpers | AppHost and plugin service/runtime discovery | `install --dry-run`; others no |
| `netscript generate plugins` | Installed plugin manifests and project source | `.netscript/generated` plugin registries | Plugin host and generated imports | `--dry-run` |
| `netscript generate runtime-schemas` | Runtime topic declarations | Runtime-config JSON Schema files | Editors, validators, runtime override tooling | `--dry-run` |
| `netscript generate aspire` | `aspire/appsettings.json` | AppHost helper files | Aspire AppHost | No |
| `netscript ui:init` / `netscript ui:add` | Registry selection | Workspace-owned components, pages, islands, styles, and tokens | Fresh app and its Vite build | No |
| `netscript ui:update` / `netscript ui:remove` | Installed registry inventory and unmodified copied files | Updated or removed copy-source UI files | Fresh app and its Vite build | No |
| `netscript deploy build` / target `plan` | Deployment manifest plus project entrypoints | Target deployment artifacts or an emitted plan | Target runtime or service manager | `plan` is non-deploying |
| `netscript deploy up` / `deploy install` / lifecycle verbs | Deployment target or service-manager state | Provider/service-manager state; target-dependent local artifacts | Deployed services | Target-dependent; check `--help` |

Read commands (`list`, `get`, `inspect`, `status`, `logs`, `doctor`) are omitted because they do not
mutate project or provider state. Commands that invoke an external database or cloud provider say
so in the final column; a filesystem-only `--dry-run` would not safely model those effects.

## Scaffold a workspace

{{ comp.apiTable({
  caption: "netscript init",
  rows: [
    { name: "Create a workspace", type: "netscript init my-app", desc: "Scaffold everything — contracts, plugin registry, Fresh app, a default Redis cache, and the Aspire layer. On a terminal it prompts for whatever you omit (name, database, service, cache)." },
    { name: "Preview first", type: "netscript init my-app --dry-run", desc: "Print every file and directory the scaffold would create, and write nothing." },
    { name: "Fully specified, no prompts", type: "netscript init my-app --db postgres --service --service-name users --yes", desc: "Postgres database support, an example oRPC <code>users</code> service on its assigned port, defaults for the rest. <code>--yes</code> accepts defaults, <code>--ci</code> is non-interactive; both engage automatically when stdin is not a terminal." },
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
    { name: "Run a service alone", type: "deno task --cwd services/users dev", desc: "Start the example <code>users</code> oRPC service on its assigned port." },
    { name: "Check, lint, test", type: "deno task check · deno task lint · deno task fmt · deno task test", desc: "Type-check, lint, format, and test the whole workspace." }
  ]
}) }}

## Services & contracts

A NetScript workspace is contract-first: you define an oRPC contract, then a service
implements it.

{{ comp.apiTable({
  caption: "Services and contracts",
  rows: [
    { name: "Add a service", type: "netscript service add --name orders --port 3002 --with-client", desc: "Add a service workspace member, its v1 contract, the Aspire registration, and apps/<app>/lib/orders.ts with a typed client and query factories." },
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
    { name: "Discover & maintain", type: "netscript marketplace search <query> · netscript plugin update <name> · netscript plugin remove <name>", desc: "Search the plugin marketplace, re-pin and regenerate an installed plugin, or remove one and update workspace registration." },
    { name: "Configure the AI plugin", type: "netscript plugin ai <verb> [...args]", desc: "Configure AI tools, agents, models, providers, and MCP servers. A pass-through: every argument after the verb is forwarded verbatim to the installed <code>@netscript/plugin-ai</code> CLI, so its verbs are documented by that plugin, not here. Only <code>--project-root</code> is consumed by NetScript." }
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

Deploy carries several paths: the **Deno Deploy** cloud target, the **OS service** (Servy)
path, the **container and cloud targets** routed through Aspire, and two packaging verbs
for shipping a binary. `netscript deploy list` prints every registered target with the
operations it advertises — start there rather than guessing. See
[deploy]({{ "howto:deploy" |> xref }}) for the portability story.

{{ comp.apiTable({
  caption: "Deploy commands",
  rows: [
    { name: "Discover targets", type: "netscript deploy list [--json]", desc: "List every registered deploy target with its label and advertised operations. <code>--json</code> emits machine-readable descriptors." },
    { name: "Deno Deploy: preflight", type: "netscript deploy deno-deploy plan", desc: "Run the unstable-API guard (scans for <code>Deno.openKv</code>, <code>Deno.cron</code>, <code>BroadcastChannel</code>, <code>Temporal</code>) without pushing. The same guard <strong>blocks</strong> <code>up --prod</code> on a violation; a preview push warns but proceeds." },
    { name: "Deno Deploy: lifecycle", type: "netscript deploy deno-deploy up [--prod] · down · status · logs", desc: "Push, delete, and inspect the deployment. A thin router over the native <code>deno deploy</code> CLI — it must be on your PATH and handles authentication." },
    { name: "OS service: build", type: "netscript deploy build", desc: "Compile services and generate the deployment artifacts from a deployment manifest via Servy." },
    { name: "OS service: lifecycle", type: "netscript deploy install · start · stop · status · logs · upgrade · uninstall", desc: "Register, run, inspect, upgrade, and remove OS services from the manifest." },
    { name: "Containers: Docker & Compose", type: "netscript deploy docker <verb> · netscript deploy compose <verb>", desc: "Aspire-backed container targets. Both expose <code>plan · up · down · status · logs</code> — the bare group prints help, as every command group does, but the verbs run against a real adapter." },
    { name: "Cloud targets", type: "netscript deploy kubernetes · azure-aca · azure-app-service · azure-aks · cloud-run", desc: "Aspire-backed cloud targets, each exposing <code>plan · up · down</code>. See the <a href=\"/reference/cli/commands/\">command reference</a> for why their verb list is shorter." },
    { name: "Package a desktop app", type: "netscript deploy desktop package · netscript deploy desktop release", desc: "Package an enabled desktop app into native Deno Desktop formats for the host OS/arch by default (or an explicit target), and prepare, sign, and serve a native release." },
    { name: "Package the CLI", type: "netscript deploy package-cli", desc: "Compile the NetScript CLI into a self-shippable Windows <code>.exe</code>. Flags: <code>-o, --output-dir &lt;dir&gt;</code> (default <code>./.deploy/windows</code>), <code>--target &lt;triple&gt;</code> (default <code>x86_64-pc-windows-msvc</code>), <code>--no-bundle</code>, <code>-v, --verbose</code>." }
  ]
}) }}

The shared flags (`--org`, `--app`, `--entrypoint`, `--env-file`, `--project-root`), the
per-target verb flags, and the artifact-copy verbs are in the
[command reference](/reference/cli/commands/).

## Agent tooling

{{ comp.apiTable({
  caption: "AI agent commands",
  rows: [
    { name: "Install agent tooling", type: "netscript agent init", desc: "Install NetScript MCP, consumer tools, and skills. Use <code>--editor none|zed|vscode</code> to apply editor-native setup to a new or existing project; one existing editor directory is detected by default. Use <code>--host claude|vscode|all</code> for agent hosts and <code>--with-docs</code> for the exact-version offline corpus." },
    { name: "Run the MCP server", type: "netscript agent mcp", desc: "Start the NetScript MCP server over standard input/output." },
    { name: "Record drift", type: "netscript agent drift record --resource <name> --summary <text>", desc: "Record an evidence-gated drift note after a fresh successful diagnostic pass. The record is rejected unless the evidence for <code>--resource</code> is present on disk, so it cannot be written from memory. <code>--details &lt;text&gt;</code> is optional." }
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
