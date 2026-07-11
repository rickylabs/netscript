---
layout: layouts/base.vto
title: Scaffold the mini chat
templateEngine: [vento, md]
prev: { label: "Mini eis-chat", href: "/tutorials/eis-chat/" }
next: { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" }
---

# Scaffold the mini chat

Every seam in this track needs a place to live. In this chapter you create `mini-chat/` — a
NetScript workspace — install the two plugins the track uses (**workers** for the delivery
job, **streams** for the live channel feed), and boot the whole thing under Aspire. At the
end, two plugin runtimes answer on their documented ports and the workspace type-checks.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" },
  { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" },
  { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" },
  { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
] }) }}

## What you will build

A `mini-chat/` workspace on disk with a shared `contracts/` workspace (empty until chapter
2), the workers plugin at `plugins/workers/`, the streams plugin at `plugins/streams/`, and
Aspire orchestration. By the end, `aspire start` is up, the workers API answers on `:8091`,
the durable-streams runtime answers on `:4437`, and `deno task check` is clean.

## Before you begin

The only prerequisite is the toolchain from the [track index](/tutorials/eis-chat/).
Confirm the CLI is installed and reachable:

```sh
netscript --help
```

You should see the public command groups, including `init`, `plugin`, `generate`, and
`contract`. If `netscript` is not found, make sure Deno's install directory is on your
`PATH` and open a fresh terminal.

## Step 1 — Preview the scaffold with a dry run

Ask the CLI what it *would* create before it writes anything. `--dry-run` plans the
scaffold and prints totals without touching disk:

```sh
netscript init mini-chat --dry-run
```

A clean dry run confirms your flags are valid. This track needs neither a database nor an
example service — the contract you author in chapter 2 is the only API surface — so plain
`init` with no extra flags is exactly right.

## Step 2 — Create the workspace

Scaffold for real, then enter it:

```sh
netscript init mini-chat
cd mini-chat
```

This writes `mini-chat/` — the project root, Aspire orchestration under `aspire/`, the
shared `contracts/` workspace (with an empty `versions/v1/` aggregate you fill in next
chapter), a Fresh app, and an empty plugin registry — formats it with `deno fmt`, and
initializes a git repository.

## Step 3 — Install the two plugins

NetScript's background capabilities arrive as plugins. Install the **workers** plugin (the
background-job engine) and the **streams** plugin (the durable-streams runtime):

```sh
netscript plugin install worker --name workers
netscript plugin install stream --name streams
```

Each install lands a plugin workspace — `plugins/workers/` and `plugins/streams/` — and
registers it with the project config and Aspire, so `aspire start` knows to boot its
runtime. The kind is singular (`worker`, `stream`); `--name` sets the workspace folder.

{{ comp callout { type: "note", title: "Why these two, for a chat app?" } }}
They are the two halves of what makes chat feel like chat. Delivery must survive being
backgrounded — a message accepted and then lost is worse than an error — so it runs as a
durable <strong>worker job</strong>. And everyone else in the channel has to <em>see</em>
the message without refreshing — so channel state is published to a durable
<strong>stream</strong> that browsers read live. eis-chat runs on exactly these seams; you
are installing the miniature versions of them.
{{ /comp }}

## Step 4 — Bring up orchestration

Boot everything under Aspire. Run it from the `aspire/` subfolder so the CLI finds
`apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire start     # starts the AppHost and every registered runtime
```

`aspire start` prints a URL and login token for the **Aspire dashboard**:

```
https://localhost:18888
```

Leave `aspire start` running in this terminal; it is your control plane for the rest of
the track. Every command from here on runs in a **second terminal**, from the `mini-chat/`
project root.

## Verify your progress

Both plugin runtimes expose a health endpoint on their documented ports. Confirm each one
answers:

```sh
curl http://localhost:8091/health   # workers API — healthy JSON
curl http://localhost:4437/health   # durable-streams runtime — healthy
```

Then type-check the whole workspace from the project root:

```sh
deno task check
```

- [ ] `netscript --help` lists the public command groups.
- [ ] `mini-chat/` exists with `contracts/`, `plugins/workers/`, `plugins/streams/`, and
      `aspire/`.
- [ ] `aspire start` is up; the dashboard at `:18888` lists the workers and streams
      runtimes.
- [ ] `curl http://localhost:8091/health` and `curl http://localhost:4437/health` both
      answer.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three checks cover most first-run snags: (1) is <code>aspire start</code> still up, with
both plugin runtimes healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is
Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before
<code>aspire start</code> so it found <code>apphost.mts</code>? A failed <code>curl</code>
usually means a runtime has not finished starting — give it a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace — `mini-chat/` — with the workers runtime on `:8091`, the
durable-streams runtime on `:4437`, and an empty contracts workspace waiting for its first
shape. Next you define that shape: the one message contract the rest of the track hangs
off.

{{ comp.nextPrev({ prev: { label: "Mini eis-chat", href: "/tutorials/eis-chat/" }, next: { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" } }) }}
