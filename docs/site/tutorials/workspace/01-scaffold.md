---
layout: layouts/base.vto
title: Scaffold the team workspace
templateEngine: [vento, md]
prev: { label: "Team Workspace", href: "/tutorials/workspace/" }
next: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" }
---

# Scaffold the team workspace

In this chapter you create `my-workspace/`, a NetScript workspace with an example service and a
Postgres database, and boot it under Aspire. The auth backend, the team database, the provisioning
job and the route guards in later chapters all attach to this app.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A `my-workspace/` directory with a typed `workspace` service on its own port, a Postgres database,
and the Aspire orchestration that provisions Postgres and the Redis cache. At the end, the Aspire
dashboard at `https://localhost:18888` shows the service, database and cache running, and
`deno task check` passes.

## Before you begin

You need **[Deno](https://deno.com/) 2.x**, the **[Aspire CLI](https://aspire.dev)**, and **Docker**
running, because Aspire starts the Postgres and Redis containers. Check all three:

```sh
deno --version     # Deno 2.x
aspire --version   # the Aspire CLI
docker info        # prints engine details, not a connection error
```

Install the NetScript CLI from JSR, then confirm it is on your `PATH`:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
netscript --help
```

`netscript --help` lists the command groups `agent`, `config`, `deploy`, `init`, `contract`, `db`,
`generate`, `marketplace`, `plugin`, `service`, `ui:add`, `ui:init`, `ui:list`, `ui:update` and
`ui:remove`. If `netscript` is not found, add Deno's install directory (printed by `deno install`)
to your `PATH` and open a new terminal.

{{ comp callout { type: "tip", title: "Prefer not to install globally?" } }}
Run any command with <code>deno x jsr:@netscript/cli{{ releaseSpecifier }} &lt;command&gt;</code>.
The rest of this track uses the installed <code>netscript</code> form.
{{ /comp }}

## Step 1 — Preview the scaffold

`--dry-run` plans the scaffold and prints per-phase file and directory totals without writing to
disk:

```sh
netscript init my-workspace --service --service-name workspace --service-port 3001 --db postgres --dry-run
```

A clean dry run confirms your flags are valid. The CLI rejects bad combinations, such as an unknown
`--db` engine, before any file exists.

This track uses `--db postgres`, the recommended default. You can swap it for `mysql`, `mssql` or
`sqlite` and follow along the same way; SQLite is file-backed, so it has no Aspire container.

## Step 2 — Create `my-workspace/`

Run the same command without `--dry-run`:

```sh
netscript init my-workspace --service --service-name workspace --service-port 3001 --db postgres
cd my-workspace
```

The CLI scaffolds `my-workspace/`, formats the output with `deno fmt`, initializes a git repository,
and prints a **next steps** summary for your options.

{{ comp callout { type: "note", title: "Pinned ports in this track" } }}
This track pins the <code>workspace</code> service to port <code>3001</code> with
<code>--service-port</code>. Without a pinned port, each scaffold gets its own randomized high-range
ports.
{{ /comp }}

{{ comp.apiTable({
  caption: "netscript init options used here",
  rows: [
    { name: "--service --service-name workspace --service-port 3001", type: "example service", desc: "Include an example oRPC service named 'workspace' on port 3001. You protect it in chapter 5." },
    { name: "--db postgres", type: "database workspace", desc: "Scaffold a Postgres database workspace. The auth plugin's auth.prisma migration (chapter 2) aggregates into this primary datasource." },
    { name: "--dry-run", type: "plan only", desc: "Plan the scaffold and print totals without writing any files (Step 1)." }
  ]
}) }}

## Step 3 — Tour what you got

`my-workspace/` has this shape. The rest of the track edits these directories:

{{ comp.fileTree({ items: [
  { name: "my-workspace/", children: [
    { name: "apps/dashboard/", comment: "Fresh frontend (defineFreshApp)" },
    { name: "contracts/", comment: "Shared oRPC + Zod contracts, versioned under versions/v1/" },
    { name: "services/workspace/", comment: "The example oRPC service (src/main.ts, router.ts) — guarded in chapter 5" },
    { name: "plugins/", comment: "Plugin registry — empty until you add the auth plugin in chapter 2" },
    { name: "database/", comment: "The primary Postgres workspace; a second db is added in chapter 3" },
    { name: "aspire/", comment: "Aspire TypeScript orchestration (isolated Node runtime)" },
    { name: "appsettings.json", comment: "Infrastructure config (Services / Databases / Persistent)" },
    { name: "deno.json", comment: "Workspace root (members, tasks, dependency catalog)" },
    { name: "netscript.config.ts", comment: "Framework config (defineConfig)" }
  ] }
] }) }}

You return to two of them most: **`services/workspace/`** is the oRPC service whose routes you
protect in chapter 5, and **`plugins/`** is where the `auth` plugin lands in chapter 2. Everything
takes its types from `contracts/`, the typed seam between your services and any client.

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo, you may see a vendored
<code>packages/</code> directory. A normal JSR install doesn't have one: your project pulls
<code>@netscript/*</code> from the registry. Ignore <code>packages/</code> throughout this track.
{{ /comp }}

## Step 4 — Bring up orchestration

Aspire provisions your database and cache; you don't start containers by hand. Run it from the
`aspire/` folder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up Postgres, Redis and your `workspace` service, then prints the **Aspire
dashboard** URL and a one-time login token. Open the dashboard:

```text
https://localhost:18888
```

Leave `aspire start` running in this terminal for the rest of the track. The dashboard's resource
list shows the exact port each resource bound.

{{ comp callout { type: "important", title: "Database commands need Aspire running" } }}
The Postgres container exists only while <code>aspire start</code> is up. Run
<code>netscript db init</code>, <code>db generate</code> and <code>db seed</code>, which you use from
chapter 2 onward, <strong>after</strong> Aspire has started. Without Aspire, a db command fails fast:
there is no Postgres for it to reach.
{{ /comp }}

## Verify your progress

In a second terminal, with `aspire start` still running in the first, check the `workspace` service
and type-check the workspace:

```sh
curl http://localhost:3001/health
deno task check
```

`curl` returns a healthy JSON response and `deno task check` finishes clean.

- [ ] `netscript --help` lists the public command groups.
- [ ] `my-workspace/` exists with `services/workspace/`, `plugins/`, `database/`, and `aspire/`.
- [ ] `aspire start` is up; `postgres` and `redis` are green in the dashboard at `https://localhost:18888`.
- [ ] `curl http://localhost:3001/health` returns a healthy response.
- [ ] `deno task check` passes.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Check three things: (1) is <code>aspire start</code> still up, with <code>postgres</code> and
<code>redis</code> healthy in the dashboard? (2) is Docker running (<code>docker info</code>)? (3) did
you <code>cd aspire</code> before <code>aspire start</code>, so it found <code>apphost.mts</code>? A
failed <code>curl</code> usually means the service is still starting: wait a few seconds and retry.
{{ /comp }}

## What you built

A NetScript workspace at `my-workspace/`: a typed `workspace` service on `:3001`, shared contracts,
a Postgres database and a Redis cache, all orchestrated by Aspire and visible in one dashboard. The
service still answers anyone. Next, you add an identity layer so the app can tell a team member from
a stranger.

{{ comp.nextPrev({ prev: { label: "Team Workspace", href: "/tutorials/workspace/" }, next: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" } }) }}
