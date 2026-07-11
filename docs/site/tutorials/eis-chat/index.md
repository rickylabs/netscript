---
layout: layouts/base.vto
title: Mini eis-chat
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" }
---

# Mini eis-chat

This is the **on-ramp track**: one sitting, one small application, and the whole NetScript
spine — a contract, a background worker, and a live stream — each in its smallest working
form. If you have never touched NetScript, start here; every other track assumes more time
and goes deeper.

The premise is real. **eis-chat** is a production chat application built on NetScript —
projects and channels, durable message delivery, background import pipelines, and live
notification streams. The five deep tutorial tracks each borrow one seam of its build
discipline and grow it into a full application. This track builds the *smallest slice of
what eis-chat actually is*: a message shape everyone agrees on, a delivery job that survives
being backgrounded, and a channel feed the browser can watch live.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" },
  { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" },
  { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" },
  { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
] }) }}

## What you will build

A `mini-chat/` workspace whose message shape is a typed contract, whose delivery runs as a
durable background job you can trigger and audit over HTTP, and whose channel state is a
durable stream you can tail live from a second terminal. No database, no auth, no frontend
work — every checkpoint is a command you run and an output you see. Done in a single
sitting.

## Before you begin

You need the standard NetScript toolchain — Deno, the Aspire CLI, and Docker. Confirm it:

```sh
deno --version && aspire --version && docker info
```

You should see a Deno 2.x version, an Aspire CLI version, and Docker engine details. If any
are missing, the [quickstart](/quickstart/) walks through installing them. Install the
NetScript CLI once:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

## The arc: scaffold → contract → worker → stream

Each chapter adds exactly one seam, in the order a real NetScript application grows:

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>mini-chat/</code> with <code>netscript init</code>, install the <code>workers</code> and <code>streams</code> plugins, and boot everything under Aspire — two runtimes answering on <code>:8091</code> and <code>:4437</code>.",
    href: "/tutorials/eis-chat/01-scaffold/"
  },
  {
    title: "2 · One message contract",
    body: "Define the channel-message shape once, as an oRPC + Zod contract on <code>baseContract</code> from <code>@netscript/contracts</code> — then prove the schema validates real input at runtime.",
    href: "/tutorials/eis-chat/02-message-contract/"
  },
  {
    title: "3 · One delivery worker",
    body: "Author a <code>deliver-message</code> job with <code>defineJobHandler</code>, trigger it over the workers API, and read the structured result off the executions feed.",
    href: "/tutorials/eis-chat/03-deliver-worker/"
  },
  {
    title: "4 · One live stream — and the map",
    body: "Publish channel messages into a durable stream with <code>createDurableStream</code>, tail them live over HTTP/SSE from a second terminal, then map what you built onto eis-chat's full architecture.",
    href: "/tutorials/eis-chat/04-live-stream/"
  }
] }) }}

{{ comp callout { type: "note", title: "What this track deliberately leaves out" } }}
Everything the deep tracks own: no database or Prisma schema, no auth, no sagas, no Fresh
UI, no deploy chapter. The point of the on-ramp is the spine — contract, worker, stream —
in its smallest observable form. Chapter 4 closes with a map that tells you exactly which
deep track picks up each seam.
{{ /comp }}

## What you built

By the end you own the three moves every NetScript application is made of: a **contract**
as the single source of truth for a shape, a **durable job** for work that must not die
with a request, and a **durable stream** for state the outside world watches live — plus a
map from this miniature to eis-chat's full architecture and the five deep tracks.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" } }) }}
