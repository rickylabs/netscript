---
layout: layouts/base.vto
title: Scaffold the dashboard
templateEngine: [vento, md]
prev: { label: "Live Dashboard", href: "/tutorials/live-dashboard/" }
next: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }
---

# Scaffold the dashboard

In this chapter you create `my-dashboard/`, the workspace that grows into the order-queue dashboard
from the [track index](/tutorials/live-dashboard/): a Fresh frontend, an `orders` service and a
Postgres database. Then you boot it under Aspire so the rest of the track has a running system.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A `my-dashboard/` workspace: shared contracts, an example `orders` service on port **3002**, a
[Fresh](/web-layer/) app and a Postgres database, all orchestrated by Aspire. At the end the Aspire
dashboard at `:18888` shows every resource running, and you know which generated directory does
what. Every later chapter builds on this workspace.

## Before you begin

You need the toolchain from the [track index](/tutorials/live-dashboard/). Confirm the CLI is
installed and reachable:

```sh
netscript --help
```

You see the public command groups: `agent`, `config`, `deploy`, `init`, `contract`, `db`,
`generate`, `marketplace`, `plugin`, `service`, `ui:add`, `ui:init`, `ui:list`, `ui:update` and
`ui:remove`. If `netscript` is not found, add Deno's install directory to your `PATH` and open a new
terminal.

## Step 1 — Preview the scaffold with a dry run

`--dry-run` plans the scaffold and prints totals without writing to disk:

```sh
netscript init my-dashboard --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline: the project root, Aspire
orchestration, contracts, the Fresh app workspace, an empty plugin registry, and optionally a
database workspace and an example service. The dry run reports file and directory totals per phase.
It also confirms your flags are valid: the CLI rejects bad combinations, such as an unknown `--db`
engine, before any file exists.

## Step 2 — Create the workspace

Scaffold for real, with an example service named `orders` on port **3002** and a Postgres database
for the dashboard to read:

```sh
netscript init my-dashboard --service --service-name orders --service-port 3002 --db postgres
cd my-dashboard
```

The CLI writes `my-dashboard/`, formats the output with `deno fmt`, initializes a git repository,
and prints a **next steps** summary for your options.

{{ comp callout { type: "note", title: "Pinned ports in this track" } }}
This track pins the <code>orders</code> service to port <code>3002</code> with
<code>--service-port</code>. Without a pinned port, each scaffold gets its own randomized high-range
ports.
{{ /comp }}

{{ comp.apiTable({
  caption: "init options this track uses (run netscript init --help for the full list)",
  rows: [
    { name: "--service --service-name orders --service-port 3002", type: "flags", desc: "Include an example oRPC service named orders on port 3002 — the read-model the dashboard consumes." },
    { name: "--db postgres", type: "flag", desc: "Scaffold a Postgres database workspace. The orders read-model is persisted here. Postgres is this track's stack; swap --db postgres for mysql, mssql, or sqlite for a different engine." },
    { name: "--dry-run", type: "flag", desc: "Plan the scaffold and print totals without writing any files (Step 1)." }
  ]
}) }}

## Step 3 — Tour what you got

The parts of `my-dashboard/` this track uses:

{{ comp.fileTree({ items: [
  { name: "apps/", children: [
    { name: "dashboard/", comment: "The Fresh frontend — defineFreshApp, your dashboard UI lives here" }
  ] },
  { name: "contracts/", comment: "Shared oRPC + Zod contracts, versioned under versions/v1/" },
  { name: "services/", children: [
    { name: "orders/", comment: "The example oRPC service (src/main.ts, router.ts, routers/)" }
  ] },
  { name: "plugins/", comment: "Plugin registry + manifests — empty until you add one" },
  { name: "aspire/", children: [
    { name: "apphost.mts", comment: "Entry point for aspire start (TypeScript/Node, not C#)" }
  ] },
  { name: "appsettings.json", comment: "Infrastructure manifest Aspire reads" },
  { name: "deno.json", comment: "Workspace root: members, tasks, dependency catalog" },
  { name: "netscript.config.ts", comment: "Framework config (defineConfig)" }
] }) }}

The two directories this track lives in:

- **`apps/dashboard/`** — your Fresh app. Its entry point is `main.ts`, which calls
  [`defineFreshApp`](/web-layer/server/#composing-the-runtime-server), and `vite.config.ts`
  configures its build. Chapters 4 and 5 add routes and islands here.
- **`services/orders/`** and **`contracts/`** — the typed read-model your dashboard reads. You read
  them in chapter 2 and consume them from the Fresh app in chapters 3–5.

The [Storefront scaffold chapter](/tutorials/storefront/01-scaffold/) describes every generated
directory.

## Step 4 — Look at the Fresh app entry point

Two files define how the Fresh app starts. You don't edit them yet; read them as orientation for
chapters 4 and 5.

The app entry point registers the KV adapter and creates the app. **Order matters:** the
Redis/Garnet KV adapter import must run *before* any code that uses KV, so it sits at the top of the
file:

```ts
// apps/dashboard/main.ts
// Register Redis/Garnet KV adapter — must run before any getKv() call.
import '@netscript/kv/redis';
import { defineFreshApp } from '@netscript/fresh/server';
import type { State } from '@app/utils.ts';

export const app = defineFreshApp<State>({ name: 'dashboard' });
```

The Vite config adds NetScript's Fresh build plugin next to the Fresh and Tailwind plugins.
`createNetScriptVitePlugin` from `@netscript/fresh/vite` tells Vite about NetScript's route manifest,
workspace aliases and watch paths:

```ts
// apps/dashboard/vite.config.ts (trimmed to the NetScript-specific wiring)
import { fresh } from '@fresh/plugin-vite';
import tailwindCSS from '@tailwindcss/vite';
import { createNetScriptVitePlugin } from '@netscript/fresh/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [
    fresh(),
    tailwindCSS(),
    createNetScriptVitePlugin({
      appRoot,
      workspaceRoot,
      aliasEntries,
      watchPaths: [/* packages, contracts, plugins */],
      routeManifest: {},
    }),
  ],
}));
```

{{ comp callout { type: "note", title: "@app/* aliases point inside your Fresh app" } }}
The Vite config registers <code>@app</code>, <code>@app/lib</code>, <code>@app/components</code>,
<code>@app/islands</code> and <code>@app/routes</code> aliases that resolve to folders inside
<code>apps/dashboard/</code>. In this track, an import like <code>@app/lib/orders.ts</code> means the
file at <code>apps/dashboard/lib/orders.ts</code>.
{{ /comp }}

## Step 5 — Bring up orchestration

Aspire provisions your database and cache, and you start it before any `netscript db` command. Run
it from the `aspire/` folder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up Postgres, the Redis cache, your `orders` service and the Fresh app, then
prints a URL and login token for the **Aspire dashboard**:

```text
https://localhost:18888
```

Leave `aspire start` running in this terminal for the rest of the track.

{{ comp callout { type: "important", title: "Database commands need Aspire running" } }}
The Postgres container exists only while <code>aspire start</code> is up. Run
<code>netscript db init</code>, <code>db generate</code> and <code>db seed</code>
<strong>after</strong> Aspire has started. You run them in chapter 2.
{{ /comp }}

## Verify your progress

In a second terminal, with `aspire start` still running in the first, check the `orders` service's
health endpoint:

```sh
curl http://localhost:3002/health
```

You get a healthy JSON response. Then type-check the workspace from the project root:

```sh
deno task check
```

A clean check confirms the scaffold, contracts, and service line up.

- [ ] `netscript --help` lists the public command groups.
- [ ] `my-dashboard/` exists with `apps/dashboard/`, `contracts/`, and `services/orders/`.
- [ ] `aspire start` is up; the dashboard at `:18888` lists `postgres`, `redis`, and `orders`.
- [ ] `curl http://localhost:3002/health` returns a healthy response.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Check three things: (1) is <code>aspire start</code> still up, with <code>postgres</code> and
<code>redis</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running
(<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it
found <code>apphost.mts</code>? A failed <code>curl</code> usually means the service is still
starting: wait a few seconds and retry.
{{ /comp }}

## What you built

A NetScript workspace, `my-dashboard/`, with a Fresh app, an `orders` service on `:3002` and a
Postgres database, all orchestrated by Aspire and visible at `:18888`. Next, you shape the `orders`
read-model that the dashboard displays.
