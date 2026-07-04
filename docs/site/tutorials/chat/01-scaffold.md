---
layout: layouts/base.vto
title: Scaffold the chat workspace
templateEngine: [vento, md]
prev: { label: "AI Chat", href: "/tutorials/chat/" }
next: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" }
---

# Scaffold the chat workspace

Every track starts with a real project on disk. In this chapter you create `chat-app/` — a
NetScript workspace with a Fresh frontend — add the **streams runtime** so durable chat
sessions have somewhere to live, set your model key, and boot the whole thing under Aspire.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
] }) }}

## What you will build

A `chat-app/` workspace on disk: a [Fresh](/capabilities/fresh-framework/) app, the
`streams` plugin wired for durable sessions, and Aspire orchestration. By the end the Aspire
dashboard at `:18888` shows every resource running, `ANTHROPIC_API_KEY` reaches the app
process, and the workspace type-checks. You reuse this same workspace for every later chapter.

## Before you begin

The only prerequisite is the toolchain from the [track index](/tutorials/chat/) plus an
`ANTHROPIC_API_KEY`. Confirm the CLI is installed and reachable:

```sh
netscript --help
```

You should see the public command groups: `init`, `contract`, `db`, `deploy`, `generate`,
`marketplace`, `plugin`, `service`, `ui:add`, and `ui:init`. If `netscript` is not found,
make sure Deno's install directory is on your `PATH` and open a fresh terminal.

## Step 1 — Preview the scaffold with a dry run

Before writing files, ask the CLI what it *would* create. `--dry-run` plans the scaffold and
prints totals without touching disk:

```sh
netscript init chat-app --dry-run
```

A clean dry run confirms your flags are valid and is your green light to scaffold for real.

## Step 2 — Create the workspace

Scaffold for real. This track does not need an example service — the chat route you write in
chapter 2 is the only backend — so a plain Fresh workspace is enough:

```sh
netscript init chat-app
cd chat-app
```

This writes `chat-app/`, formats the output with `deno fmt`, and initializes a git
repository. On completion the CLI prints a **next steps** summary tailored to your options.

## Step 3 — Add the streams runtime

A durable chat session is one append-only stream, addressed through the streams runtime. Add
the `streams` plugin so `@netscript/fresh/ai` has a runtime to resolve session URLs against:

```sh
netscript plugin add streams
```

{{ comp callout { type: "note", title: "Why streams, for a chat app?" } }}
<code>@netscript/fresh/ai</code> does not reimplement transport — it addresses each chat session as one durable stream under the <code>@netscript/plugin-streams-core</code> seam (the same seam <code>@netscript/fresh/streams</code> uses for live tables). No <code>streams</code> runtime means no place for the session log to live, so <code>resolveChatSnapshot</code> and the connection have nothing to read.
{{ /comp }}

## Step 4 — Set your model key

The chat route calls Anthropic directly; the adapter reads `ANTHROPIC_API_KEY` from the app
process environment. Put it where Aspire will inject it — your workspace's local environment
file (never commit a real key):

```sh
# chat-app/.env  (add .env to .gitignore if it is not already)
ANTHROPIC_API_KEY=sk-ant-...
```

{{ comp callout { type: "important", title: "The key stays server-side" } }}
<code>ANTHROPIC_API_KEY</code> is read only inside the chat <em>route</em> (server code). It is never bundled into the island or sent to the browser — the model call happens on the server, and the browser only ever sees the durable session stream through the proxy you build in chapter 2.
{{ /comp }}

## Step 5 — Bring up orchestration

Boot the whole thing under Aspire. Run it from the `aspire/` subfolder so the CLI finds
`apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire start     # starts the AppHost, the streams runtime, and the Fresh app
```

`aspire start` prints a URL and login token for the **Aspire dashboard**:

```
https://localhost:18888
```

Leave `aspire start` running in this terminal; it is your control plane for the rest of the
track.

## Verify your progress

In a second terminal, type-check the whole workspace from the project root:

```sh
deno task check
```

A clean check confirms the scaffold and plugin wiring line up.

- [ ] `netscript --help` lists the public command groups.
- [ ] `chat-app/` exists with `apps/dashboard/` and a `plugins/` entry for `streams`.
- [ ] `ANTHROPIC_API_KEY` is set in the app environment.
- [ ] `aspire start` is up; the dashboard at `:18888` lists the streams runtime and the Fresh app.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three checks cover most first-run snags: (1) is <code>aspire start</code> still up, with the streams runtime healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code> so it found <code>apphost.mts</code>?
{{ /comp }}

## What you built

A real NetScript workspace — `chat-app/` — with a Fresh app, the streams runtime for durable
sessions, and your model key wired to the app process, all orchestrated by Aspire. Next you
will wire the durable chat route that turns a prompt into a persisted, streamed reply.

{{ comp.nextPrev({ prev: { label: "AI Chat", href: "/tutorials/chat/" }, next: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" } }) }}
