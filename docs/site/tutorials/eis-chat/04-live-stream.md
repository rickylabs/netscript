---
layout: layouts/base.vto
title: One live stream — and the map
templateEngine: [vento, md]
prev: { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" }
next: { label: "Tutorials", href: "/tutorials/" }
---

# One live stream — and the map

Chat is only chat if the *other* people see the message without refreshing. In this final
chapter you publish channel messages into a **durable stream** and tail them live over
HTTP/SSE from a second terminal — the same producer-to-consumer path eis-chat's
notification feeds run on. Then you close the track the way it opened: with the map from
this miniature to the real architecture, and into the five deep tracks.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" },
  { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" },
  { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" },
  { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
] }) }}

## What you will build

Two small scripts: a **producer** that publishes chapter-2-shaped messages into a durable
`/channels/general` stream with `createDurableStream`, and a **tail** that reads the same
stream path over HTTP/SSE with a plain `EventSource`. The checkpoint is watching a message
you publish in one terminal appear, live, in the other.

## Before you begin

You need chapters 1–3 done and `aspire start` up. The streams runtime from chapter 1 is the
durable log both scripts talk to — confirm it answers:

```sh
curl http://localhost:4437/health
```

{{ comp callout { type: "note", title: "One runtime, two sides" } }}
The durable-streams runtime on <code>:4437</code> is a separate Aspire service. Producers
write typed entity state into a stream path; consumers read the same path over the
runtime's HTTP/SSE protocol — there is no in-process <code>subscribe()</code>. That split
is what makes the feed durable: the log outlives both the producer that wrote it and every
browser tab that was watching. See <a href="/durable-workflows/streams/">Durable
streams</a> for the full model.
{{ /comp }}

## Step 1 — Author the producer

The stream's type contract is `defineStreamSchema(...)`: collections keyed by name, each
with a schema, a type, and a primary key. You already own the right schema — the chapter-2
message contract — so the stream reuses it directly. `createDurableStream(...)` then opens
a producer for the stream path:

```ts
// scripts/broadcast-message.ts
import {
  createDurableStream,
  defineStreamSchema,
} from '@netscript/plugin-streams-core';
import { ChannelMessageSchemaV1 } from '@mini-chat/contracts/versions/v1';

// The stream's collections, locked to the SAME message schema the contract owns.
const channelStreamSchema = defineStreamSchema({
  message: {
    schema: ChannelMessageSchemaV1,
    type: 'message',
    primaryKey: 'id',
  },
});

// A singleton producer for this stream path.
const producer = createDurableStream({
  streamPath: '/channels/general',
  schema: channelStreamSchema,
  producerId: 'mini-chat-broadcast',
});

// Publish one message (pass the text as an argument).
producer.upsert('message', {
  id: crypto.randomUUID(),
  channel: 'general',
  author: 'ada',
  body: Deno.args[0] ?? 'Hello from the durable stream.',
  sentAt: new Date().toISOString(),
});

// Flush before exit so the write reaches the runtime; close removes the producer.
await producer.flush();
await producer.close();
console.log('published to /channels/general');
```

`upsert` is keyed by the collection's `primaryKey` — publishing the same `id` twice updates
the entity instead of duplicating it, which is exactly what an "edit message" would be.

## Step 2 — Author the tail

Consumption is an HTTP/SSE read of the same stream path the producer writes to.
`getStreamsUrl()` resolves the runtime's base URL; a plain `EventSource` — no client
library — reads the change feed:

```ts
// scripts/tail-channel.ts
import { getStreamsUrl } from '@netscript/plugin-streams-core';

const source = new EventSource(`${getStreamsUrl()}/channels/general`);

console.log('tailing /channels/general — Ctrl-C to stop');
source.onmessage = (event) => {
  console.log(event.data);
};
```

This is deliberately the whole consumer. A Fresh island doing a live chat feed is this same
read with rendering on top — the [AI Chat](/tutorials/chat/) and
[Live Dashboard](/tutorials/live-dashboard/) tracks build exactly that.

## Step 3 — Watch a message travel

Open the tail in your **second terminal**. Both scripts resolve the runtime address from
the environment; point them at the local runtime explicitly with the documented
`DURABLE_STREAMS_URL` override:

```sh
DURABLE_STREAMS_URL=http://localhost:4437 \
  deno run --allow-net --allow-env scripts/tail-channel.ts
```

Leave it running. In a **third terminal**, publish:

```sh
DURABLE_STREAMS_URL=http://localhost:4437 \
  deno run --allow-net --allow-env scripts/broadcast-message.ts "It moves by itself."
```

Within a moment the tail terminal prints the change event carrying your message — no
polling, no refresh. Publish again with different text and watch it land again. That
round-trip is the live half of chat, end to end.

## Verify your progress

- [ ] `curl http://localhost:4437/health` answers (streams runtime up).
- [ ] `scripts/broadcast-message.ts` publishes and exits after `flush()`/`close()`.
- [ ] The running tail prints each published message live, without restarting.
- [ ] Publishing the same `id` twice updates rather than duplicates (try it: hard-code an
      id and run twice).
- [ ] `deno task check` is clean.

## The map: from mini-chat to eis-chat

You have now built the smallest slice of what eis-chat actually is. The real application is
these same three seams, grown up and multiplied: contracts for every domain shape, durable
jobs for every piece of off-request work — import pipelines, provisioning, AI turns — and
durable streams feeding every live surface, from channel feeds to notification badges. Each
deep track picks up one seam where this on-ramp left off:

{{ comp.apiTable({
  caption: "Where each seam goes deeper",
  rows: [
    { name: "Contracts → services", type: "Storefront", desc: "Your messages contract, grown into full typed services, a durable checkout saga, and an HMAC-verified webhook. The broadest tour of the core ideas." },
    { name: "Workers → pipelines", type: "ERP Sync", desc: "Your delivery job, grown into a file-watch trigger, an import pipeline, a queue provider, a cron schedule, and polyglot tasks." },
    { name: "Streams → live UI", type: "Live Dashboard", desc: "Your tail script, grown into a Fresh page: typed SDK client, cache-first queries, a hydrated island, and a self-updating table on a durable stream." },
    { name: "Streams → durable chat", type: "AI Chat", desc: "The chat-specific deep end: a durable AI chat whose transcript and streaming markdown survive reload, on the same streams runtime you just used." },
    { name: "+ auth & access control", type: "Team Workspace", desc: "The seam this on-ramp skipped entirely: a pluggable auth backend, sessions, per-plugin data, and route-level authorization." }
  ]
}) }}

Two honest notes on what the miniature simplified. First, delivery and broadcast ran as
separate exercises here; in a full build the delivery job is what publishes to the stream,
so accepting, persisting, and broadcasting are one durable path. Second, nothing was
persisted to a database — the [Storefront](/tutorials/storefront/) and
[Team Workspace](/tutorials/workspace/) tracks add the Prisma-backed database workspace
that real message history needs. And when you reach the AI side of eis-chat, the model
layer is its own published seam — [`@netscript/ai`](/reference/ai/) — which the
[AI Chat](/tutorials/chat/) track and the [AI reference](/reference/ai/) cover.

## What you built

- A durable `/channels/general` stream whose collection schema **is** the chapter-2
  contract schema — one shape, three seams.
- A producer (`createDurableStream` → `upsert` → `flush`) and a live HTTP/SSE consumer, in
  under sixty lines combined.
- The complete NetScript on-ramp: scaffold, one contract, one worker, one stream — each
  proven by a command you ran and an output you watched.

Pick your next track from the map above, or browse the [tutorials index](/tutorials/) —
every track starts from a fresh scaffold, so `mini-chat/` can stay exactly as you built it.

{{ comp.nextPrev({ prev: { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" }, next: { label: "Tutorials", href: "/tutorials/" } }) }}
