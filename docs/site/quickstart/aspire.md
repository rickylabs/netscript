---
layout: layouts/base.vto
title: "Aspire quickstart"
templateEngine: [vento, md]
---

# Aspire quickstart

This page shows what Aspire does for a NetScript workspace and how to work without it. A workspace
is never one process: it is a Fresh app, oRPC services, plugin APIs, background processors, a
database, and a cache. Aspire starts all of them with one command, wires them together, and shows
them in one dashboard from the first run.

## What you get

- **One command up.** `aspire start` boots the database, the cache, every service, every plugin
  API, and every background processor in dependency order. There is no docker-compose file to
  maintain.
- **Wiring.** Aspire computes connection strings and neighbour endpoints and injects them as
  environment variables before each process starts, so no process has to discover anything at
  runtime.
- **The Aspire dashboard.** It shows the live resource list, per-process console logs, and
  distributed traces. `aspire start` prints its URL and a one-time login token.
- **A TypeScript AppHost.** The orchestrator entry point is a generated TypeScript program at
  `aspire/apphost.mts`. It runs on an isolated Node runtime inside `aspire/`, so it never leaks into
  your Deno workspace, and you write no C#.

## Start the workspace

Aspire needs the external [Aspire CLI](https://aspire.dev) and a running Docker daemon, because it
provisions Postgres and Redis as local containers. The [Quickstart](/quickstart/) installs the
`netscript` CLI and walks the whole flow. The Aspire layer lives in the workspace's `aspire/` folder:
restore its SDK modules once, then start it.

```bash
netscript init my-app --db postgres

cd my-app/aspire
aspire restore   # one-time: downloads the AppHost SDK modules
aspire start     # boots Postgres + Redis + services, prints the dashboard URL
```

When the resources settle, open the dashboard URL that `aspire start` printed (conventionally
`https://localhost:18888`) and paste the login token.

> [!IMPORTANT]
> Run `netscript db init`, `db generate`, and `db seed` from the workspace root, and only after
> `aspire start` is up. They provision the database through the running AppHost; without it, there
> is no Postgres for them to reach.

## Work without Aspire

Aspire is the default, not a requirement. Scaffold with `--no-aspire` to skip the orchestration
layer: no `aspire/` folder and no dashboard. Then start the Fresh app directly:

```bash
netscript init my-app --db postgres --no-aspire
deno task --cwd apps/dashboard dev
```

You then own the infrastructure and the wiring: bring your own Postgres and cache, and give each
process its connection strings. [Orchestration with Aspire]({{ "explain:aspire" |> xref |> url }})
explains when that trade is right and what you give up.

Next: run the full local flow, including the database sequence, in
[Deploy locally with Aspire]({{ "howto:deploy-local-aspire" |> xref |> url }}).
