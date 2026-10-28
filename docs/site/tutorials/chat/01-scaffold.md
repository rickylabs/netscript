---
layout: layouts/base.vto
title: Scaffold the chat app
templateEngine: [vento, md]
prev: { label: "AI Chat", href: "/tutorials/chat/" }
next: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" }
---

# Scaffold the chat app

This chapter creates the project the whole track builds on: a NetScript workspace with a Fresh
frontend, the streams runtime that durable chat sessions live in, and your model key, all running
under Aspire.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

A `chat-app/` workspace on disk: a [Fresh](/web-layer/) app, the `streams` plugin wired for
durable sessions, and Aspire orchestration. At the end, the Aspire dashboard at `:18888` shows
every resource running, `ANTHROPIC_API_KEY` reaches the app process, and the workspace
type-checks.

## Before you begin

You need Deno, the Aspire CLI, Docker and an `ANTHROPIC_API_KEY`.

1. Confirm the toolchain:

   ```sh
   deno --version && aspire --version && docker info
   ```

   You should see a Deno 2.x version, an Aspire CLI version and Docker engine details. If any are
   missing, the [quickstart](/quickstart/) walks through installing them.

2. Install the NetScript CLI once:

   ```sh
   deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
   ```

3. Confirm the CLI is on your `PATH`:

   ```sh
   netscript --help
   ```

   You should see the public command groups: `init`, `contract`, `db`, `deploy`, `generate`,
   `marketplace`, `plugin`, `service`, `ui:add` and `ui:init`. If `netscript` is not found, add
   Deno's install directory to your `PATH` and open a new terminal.

## Step 1 — Preview the scaffold with a dry run

`--dry-run` plans the scaffold and prints totals without writing to disk:

```sh
netscript init chat-app --dry-run
```

A clean dry run confirms your flags are valid.

## Step 2 — Create the workspace

The chat route you write in chapter 2 is the only backend, so a plain Fresh workspace is enough;
you don't need an example service:

```sh
netscript init chat-app
cd chat-app
```

The CLI writes `chat-app/`, formats the output with `deno fmt`, initializes a git repository and
prints a **next steps** summary for your options.

## Step 3 — Add the streams runtime

A durable chat session is one append-only stream, addressed through the streams runtime. Add the
`streams` plugin so `@netscript/fresh/ai` has a runtime to resolve session URLs against:

```sh
netscript plugin install stream --name streams --samples
```

{{ comp callout { type: "note", title: "Why streams, for a chat app?" } }}
<code>@netscript/fresh/ai</code> does not implement its own transport. It addresses each chat session as one durable stream under the <code>@netscript/plugin-streams-core</code> seam, the same seam <code>@netscript/fresh/streams</code> uses for live tables. Without a <code>streams</code> runtime the session log has nowhere to live, and <code>resolveChatSnapshot</code> and the connection have nothing to read.
{{ /comp }}

## Step 4 — Set your model key

The chat route calls Anthropic directly, and the adapter reads `ANTHROPIC_API_KEY` from the app
process environment. Put the key in the workspace's local environment file, where Aspire injects
it:

```dotenv
# chat-app/.env  (add .env to .gitignore if it is not already)
ANTHROPIC_API_KEY=sk-ant-...
```

{{ comp callout { type: "caution", title: "Keep the key server-side and out of git" } }}
Never commit a real key. <code>ANTHROPIC_API_KEY</code> is read only inside the chat <em>route</em>, which is server code. It is never bundled into the island or sent to the browser: the model call happens on the server, and the browser only sees the durable session stream through the proxy you build in chapter 2.
{{ /comp }}

## Step 5 — Bring up orchestration

Run Aspire from the `aspire/` subfolder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire start     # starts the AppHost, the streams runtime, and the Fresh app
```

`aspire start` prints a URL and login token for the **Aspire dashboard**:

```text
https://localhost:18888
```

Leave `aspire start` running in this terminal. It is your control plane for the rest of the track.

## Verify your progress

1. Open the Aspire dashboard and check that it lists the streams runtime and the Fresh app.
2. In a second terminal, type-check the workspace from the project root:

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
Three checks cover most first-run problems: (1) is <code>aspire start</code> still up, with the streams runtime healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it found <code>apphost.mts</code>?
{{ /comp }}

## What you built

A `chat-app/` workspace with a Fresh app, the streams runtime for durable sessions and your model
key wired to the app process, all orchestrated by Aspire. Next, you wire the durable chat route
that turns a prompt into a persisted, streamed reply.

{{ comp.nextPrev({ prev: { label: "AI Chat", href: "/tutorials/chat/" }, next: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" } }) }}
