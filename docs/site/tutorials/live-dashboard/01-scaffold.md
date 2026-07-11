---
layout: layouts/base.vto
title: Scaffold the dashboard workspace
templateEngine: [vento, md]
prev: { label: "Live Dashboard", href: "/tutorials/live-dashboard/" }
next: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }
---

# Scaffold the dashboard workspace

Every track starts with a real project on disk. In this chapter you create `my-dashboard/` — the
workspace that will grow into the live order queue from the [track index](/tutorials/live-dashboard/):
a Fresh frontend, an `orders` service, and a Postgres database — then boot the whole thing under
Aspire so the rest of the track has a running system to build on.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A `my-dashboard/` workspace on disk: shared contracts, an example `orders` service on port **3002**,
a [Fresh](/web-layer/) app, and a Postgres database — all orchestrated by Aspire.
By the end the Aspire dashboard at `:18888` shows every resource running, and you understand which
generated directory does what. You will reuse this same workspace for every later chapter.

## Before you begin

This is the first chapter; the only prerequisite is the toolchain from the
[track index](/tutorials/live-dashboard/). Confirm the CLI is installed and reachable:

```sh
netscript --help
```

You should see the public command groups: `init`, `contract`, `db`, `deploy`, `generate`,
`marketplace`, `plugin`, `service`, `ui:add`, and `ui:init`. If `netscript` is not found, make sure
Deno's install directory is on your `PATH` and open a fresh terminal.

## Step 1 — Preview the scaffold with a dry run

Before writing files, ask the CLI what it *would* create. `--dry-run` plans the scaffold and prints
totals without touching disk:

```sh
netscript init my-dashboard --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline that lays down the project
root, Aspire orchestration, contracts, the Fresh app workspace, an empty plugin registry, and
(optionally) a database workspace and an example service. The dry run reports file and directory
totals per phase, so you see the project's shape before committing to it.

{{ comp callout { type: "note", title: "Why dry-run first?" } }}
A dry run is the cheapest way to confirm your flag combination is valid — the CLI rejects bad option mixes (an unknown <code>--db</code> engine, say) here, before any files exist. A clean dry run is your green light to scaffold for real.
{{ /comp }}

## Step 2 — Create the workspace

Scaffold for real, with an example service and a Postgres database so the dashboard has live data to
read later. This track names the example service `orders` and runs it on port **3002**:

```sh
netscript init my-dashboard --service --service-name orders --service-port 3002 --db postgres
cd my-dashboard
```

This writes `my-dashboard/`, formats the output with `deno fmt`, and initializes a git repository. On
completion the CLI prints a **next steps** summary tailored to your options — keep it handy.

{{ comp.apiTable({
  caption: "init options this track uses (run netscript init --help for the full list)",
  rows: [
    { name: "--service --service-name orders --service-port 3002", type: "flags", desc: "Include an example oRPC service named orders on port 3002 — the read-model the dashboard consumes." },
    { name: "--db postgres", type: "flag", desc: "Scaffold a Postgres database workspace. The orders read-model is persisted here. Postgres is this track's stack; swap --db postgres for mysql, mssql, or sqlite for a different engine." },
    { name: "--dry-run", type: "flag", desc: "Plan the scaffold and print totals without writing any files (Step 1)." }
  ]
}) }}

## Step 3 — Tour what you got

Open `my-dashboard/`. The shape that matters for this track:

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
  [`defineFreshApp`](/web-layer/); its build is configured by `vite.config.ts`.
  Chapters 4 and 5 add routes and islands here. This is the heart of the track.
- **`services/orders/`** and **`contracts/`** — the typed read-model your dashboard reads. You shape
  these in chapter 2, then consume them from the Fresh app in chapters 3–5.

For a guided walk through *every* generated directory, see
the [Storefront scaffold chapter](/tutorials/storefront/01-scaffold/) — this track keeps the tour short on purpose.

## Step 4 — Look at the Fresh app entry point

Before booting, read the two files that define how the Fresh app starts. You do not edit them yet —
this is orientation for chapters 4 and 5.

The app entry point registers the KV adapter and creates the app. **The order matters:** the
Redis/Garnet KV adapter import must run *before* any code that reaches for KV, so it sits at the very
top of the file:

```ts
// apps/dashboard/main.ts
// Register Redis/Garnet KV adapter — must run before any getKv() call.
import '@netscript/kv/redis';
import { defineFreshApp } from '@netscript/fresh/server';
import type { State } from '@app/utils.ts';

export const app = defineFreshApp<State>({ name: 'dashboard' });
```

The Vite config wires NetScript's Fresh build plugin alongside the Fresh and Tailwind plugins.
`createNetScriptVitePlugin` from `@netscript/fresh/vite` is what teaches Vite about NetScript's route
manifest, workspace aliases, and watch paths:

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
The Vite config registers <code>@app</code>, <code>@app/lib</code>, <code>@app/components</code>, <code>@app/islands</code>, and <code>@app/routes</code> aliases that resolve to folders inside <code>apps/dashboard/</code>. Throughout this track, an import like <code>@app/lib/api-clients.ts</code> means the file at <code>apps/dashboard/lib/api-clients.ts</code>.
{{ /comp }}

## Step 5 — Bring up orchestration

This is the step that turns a folder of files into a running system. **Aspire provisions your
database and cache; you run it before any `netscript db` command.** Run it from the `aspire/`
subfolder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up the Postgres database, the Redis cache, your `orders` service, and the Fresh
app together, then prints a URL and login token for the **Aspire dashboard**:

```
https://localhost:18888
```

Leave `aspire start` running in this terminal; it is your control plane for the rest of the track.

{{ comp callout { type: "important", title: "Aspire is step 2 — before any database command" } }}
The Postgres container only exists while <code>aspire start</code> is up. So <code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> must run <strong>after</strong> Aspire has started — never before. You will run them in chapter 2.
{{ /comp }}

## Verify your progress

In a second terminal (leave `aspire start` going in the first), confirm the `orders` service answers
its health endpoint:

```sh
curl http://localhost:3002/health
```

You should get a healthy JSON response. Then type-check the whole workspace from the project root:

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
Three checks cover most first-run snags: (1) is <code>aspire start</code> still up, with <code>postgres</code> and <code>redis</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code> so it found <code>apphost.mts</code>? A failed <code>curl</code> usually means the service is still starting — wait a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace — `my-dashboard/` — with a Fresh app, an `orders` service on `:3002`, and
a Postgres database, all orchestrated by Aspire and visible at `:18888`. Next you will shape the
`orders` read-model — the rows your operations team will eventually watch live.

{{ comp.nextPrev({ prev: { label: "Live Dashboard", href: "/tutorials/live-dashboard/" }, next: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" } }) }}
