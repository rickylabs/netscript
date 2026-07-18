---
layout: layouts/base.vto
title: "Aspire quickstart"
templateEngine: [vento, md]
---

# Aspire quickstart

A NetScript workspace is never one process — it is a Fresh app, oRPC services, plugin APIs,
background processors, a database, and a cache. Aspire is how we make that whole fleet start with
**one command**, wired together, with a real dashboard from the first run. This page is the
shortest path to seeing it; the [main Quickstart](/quickstart/) covers installing the CLI and the
scaffold in more detail.

{{ comp callout { type: "important", title: "Alpha" } }}
NetScript is alpha software and the API is subject to change. Pin versions in real projects.
{{ /comp }}

## What you get

- **One workspace, one command up.** `aspire start` boots the database, the cache, every service,
  every plugin API, and every background processor — in dependency order, no docker-compose to
  babysit.
- **Multi-resource wiring, resolved for you.** Connection strings and neighbour endpoints are
  computed and injected as environment variables before each process starts, so nothing has to
  discover anything at runtime.
- **The Aspire dashboard.** Live resource list, per-process console logs, and distributed traces
  in one place — `aspire start` prints its URL and a one-time login token.
- **A TypeScript AppHost — not .NET authoring.** The orchestrator entry point is a generated
  TypeScript program at `aspire/apphost.mts`, running on an isolated Node runtime inside
  `aspire/` so it never leaks into your Deno workspace. You write no C#.

{{ comp callout { type: "note", title: "Prerequisites" } }}
<strong><a href="https://docs.deno.com">Deno</a> 2.x</strong> and the <code>netscript</code> CLI
(install steps in the <a href="/quickstart/">Quickstart</a>), the external
<strong><a href="https://learn.microsoft.com/dotnet/aspire/">.NET Aspire</a> CLI</strong>, and a
running <strong>Docker</strong> daemon — Aspire provisions Postgres and Redis as local containers.
{{ /comp }}

## The commands

Scaffold a workspace, then bring it up. The Aspire layer lives in its own `aspire/` folder;
restore its SDK modules once, then start:

```bash
netscript init my-app --db postgres

cd my-app/aspire
aspire restore   # one-time: downloads the AppHost SDK modules
aspire start     # boots Postgres + Redis + services, prints the dashboard URL
```

When boot settles, open the dashboard URL `aspire start` printed (conventionally
`https://localhost:18888`) and paste the login token. Every resource, its logs, and its traces are
one click away.

{{ comp callout { type: "note", title: "Database commands come after" } }}
<code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> run from the
<strong>workspace root</strong> only once <code>aspire start</code> is up — they provision the
database <em>through</em> the running AppHost. With no Aspire up there is no Postgres for them to
reach.
{{ /comp }}

## Prefer no orchestration?

Aspire is the default, not a requirement. Scaffold with `--no-aspire` to skip the orchestration
layer entirely — no `aspire/` folder, no dashboard — and start the Fresh app directly:

```bash
netscript init my-app --db postgres --no-aspire
deno task --cwd apps/dashboard dev
```

You take over infrastructure and wiring yourself: bring your own Postgres and cache, hand each
process its connection strings. When that trade is the right call — and what exactly you give
up — is covered in [Orchestration with Aspire]({{ "explain:aspire" |> xref |> url }}).

## Where next

- **Step-by-step recipe:** [Deploy locally with Aspire]({{ "howto:deploy-local-aspire" |> xref |> url }}) —
  the full local flow, including the database sequence and first-run footguns.
- **Why it works this way:** [Orchestration with Aspire]({{ "explain:aspire" |> xref |> url }}) —
  the AppHost, plugin contributions, and the resource graph.
- **Exact symbols and the port map:** [the Aspire reference]({{ "ref:aspire" |> xref |> url }}) and
  the [CLI reference]({{ "cli:reference" |> xref |> url }}).
