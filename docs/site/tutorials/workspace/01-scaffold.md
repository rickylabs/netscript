---
layout: layouts/base.vto
title: Scaffold the workspace
templateEngine: [vento, md]
prev: { label: "Team Workspace", href: "/tutorials/workspace/" }
next: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" }
---

# Scaffold the workspace

Every chapter in this track adds one layer to a single app. This first chapter lays the foundation:
a real NetScript workspace on disk named `my-workspace/`, with an example service and a Postgres
database, booted under Aspire. You will not write auth yet — you will create the base that the auth
backend, the workspace database, the provisioning job, and the route guards all attach to in the
chapters that follow.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A working `my-workspace/` directory: a typed `workspace` service on its own port, a Postgres database,
the Aspire orchestration that provisions Postgres and the Redis cache, and a clean
`deno task check`. By the end you will have the Aspire dashboard open on `:18888` showing your
service, database, and cache running together — the control plane you keep up for the rest of the
track.

## Before you begin

This is the first chapter, so there is no prior project state to check — but your local toolchain must
be ready. You need **[Deno](https://deno.com/) 2.x**, the **[Aspire CLI](https://aspire.dev)**, and
**Docker** running so Aspire can start the Postgres and Redis containers. Verify all three:

```sh
deno --version     # Deno 2.x
aspire --version   # the .NET Aspire CLI
docker info        # prints engine details, not a connection error
```

Install the NetScript CLI from JSR once, then confirm it is on your `PATH`:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
netscript --help
```

`netscript --help` should list the command groups `init`, `contract`, `db`, `deploy`, `generate`,
`marketplace`, `plugin`, `service`, `ui:add`, and `ui:init`. If `netscript` is not found, make sure
Deno's install directory (printed by `deno install`) is on your `PATH`, then open a fresh terminal.

{{ comp callout { type: "tip", title: "Prefer not to install globally?" } }}
Run any command ad-hoc with <code>deno x jsr:@netscript/cli{{ releaseSpecifier }} &lt;command&gt;</code>.
The rest of this track assumes the installed <code>netscript</code> form.
{{ /comp }}

## Step 1 — Preview the scaffold

Before writing files, ask the CLI what it *would* create. `--dry-run` plans the scaffold and prints
per-phase file and directory totals without touching disk:

```sh
netscript init my-workspace --service --service-name workspace --service-port 3001 --db postgres --dry-run
```

A clean dry run validates your flag combination — it rejects bad mixes (an unknown `--db` engine, for
example) here, before any files exist. Treat a clean plan as a green light to scaffold for real.

This track uses `--db postgres`, the recommended default. The database is polyglot, so you can swap
`--db postgres` for `mysql`, `mssql`, or `sqlite` and follow along the same way (sqlite is file-backed,
so it has no Aspire container).

## Step 2 — Create `my-workspace/`

Run the same command without `--dry-run`. This track uses an example service named `workspace` on port
`3001` and a Postgres database, so you have something real to authenticate and protect later:

```sh
netscript init my-workspace --service --service-name workspace --service-port 3001 --db postgres
cd my-workspace
```

This scaffolds `my-workspace/`, formats the output with `deno fmt`, and initializes a git repository.
On completion the CLI prints a **next steps** summary tailored to your options.

{{ comp.apiTable({
  caption: "netscript init options used here",
  rows: [
    { name: "--service --service-name workspace --service-port 3001", type: "example service", desc: "Include an example oRPC service named 'workspace' on port 3001 — the service you protect in chapter 5." },
    { name: "--db postgres", type: "database workspace", desc: "Scaffold a Postgres database workspace. The auth plugin's auth.prisma migration (chapter 2) aggregates into this primary datasource." },
    { name: "--dry-run", type: "plan only", desc: "Plan the scaffold and print totals without writing any files (Step 1)." }
  ]
}) }}

## Step 3 — Tour what you got

Open `my-workspace/` and you will find this shape. These are the directories the rest of the track
edits:

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

The two pieces you will return to most: **`services/workspace/`** is the oRPC service whose routes you
protect in chapter 5, and **`plugins/`** is where the `auth` plugin lands in chapter 2. Everything
derives its types from `contracts/` — the typed seam between your services and any client.

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo you may see a vendored <code>packages/</code>
directory. A normal JSR install does not have one — your project pulls <code>@netscript/*</code> from
the registry. Ignore <code>packages/</code> throughout this track.
{{ /comp }}

## Step 4 — Bring up orchestration

This is the step that turns a folder of files into a running system. **Aspire provisions your database
and cache; you do not start containers by hand, and you run it before any `netscript db` command.**
Run it from the `aspire/` subfolder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up the Postgres database, the Redis cache, and your `workspace` service together,
then prints the **Aspire dashboard** URL and a one-time login token. Open it:

```
https://localhost:18888
```

Leave `aspire start` running in this terminal — it is your app's control plane for the entire track. The
dashboard's resource list is the authority for the exact port each resource bound.

{{ comp callout { type: "important", title: "Aspire is step 2 — database commands need it running" } }}
The Postgres container only exists while <code>aspire start</code> is up. So
<code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> — which you use from
chapter 2 onward — must run <strong>after</strong> Aspire has started, never before. A db command with
no Aspire up fails fast: there is no Postgres for it to reach.
{{ /comp }}

## Verify your progress

In a second terminal (leave `aspire start` going in the first), confirm the `workspace` service is up
and the workspace type-checks:

```sh
curl http://localhost:3001/health
deno task check
```

`curl` should return a healthy JSON response, and `deno task check` should finish clean — confirming
the scaffold, contracts, and service all line up.

- [ ] `netscript --help` lists the public command groups.
- [ ] `my-workspace/` exists with `services/workspace/`, `plugins/`, `database/`, and `aspire/`.
- [ ] `aspire start` is up; `postgres` and `redis` are green in the dashboard on `:18888`.
- [ ] `curl http://localhost:3001/health` returns a healthy response.
- [ ] `deno task check` passes.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three checks cover most first-run snags: (1) is <code>aspire start</code> still up, with
<code>postgres</code> and <code>redis</code> healthy in the dashboard? (2) is Docker running
(<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it
found <code>apphost.mts</code>? A failed <code>curl</code> usually means the service has not finished
starting — wait a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace at `my-workspace/`: a typed `workspace` service on `:3001`, shared
contracts, a Postgres database, and a Redis cache — all orchestrated by Aspire and visible in one
dashboard. This is the base. Next you add authentication on top of it.

{{ comp.nextPrev({ prev: { label: "Team Workspace", href: "/tutorials/workspace/" }, next: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" } }) }}
</content>
