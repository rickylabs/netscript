---
layout: layouts/base.vto
title: One message contract
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" }
next: { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" }
---

# One message contract

A chat product lives or dies on one shape: **the message**. The route that accepts it, the
job that delivers it, and the stream that broadcasts it must all agree on what a message
*is* — and in NetScript, that agreement is written exactly once, as a contract. In this
chapter you define the channel-message contract for `mini-chat/` and prove it validates
real input at runtime, before any service or job exists.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" },
  { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" },
  { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" },
  { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
] }) }}

## What you will build

A `messages` contract under `contracts/versions/v1/` — a Zod schema for a channel message,
a `send` procedure and a paginated `list` procedure built on `baseContract` from
[`@netscript/contracts`](/reference/contracts/) — registered in the `v1` aggregate, plus a
five-line script that feeds the schema good and bad input and shows you the verdict.

## Before you begin

You need the workspace from [chapter 1](/tutorials/eis-chat/01-scaffold/). Confirm the
contracts workspace is where the scaffold put it:

```sh
ls contracts/versions/v1/
```

You should see `mod.ts` — the empty version-1 aggregate. Its own header comment tells you
the move you are about to make: add a `<name>.contract.ts` file beside it and re-export it
in the `v1` object.

## Step 1 — Define the message schema and procedures

Create `contracts/versions/v1/messages.contract.ts`. The schema is plain Zod; the
procedures are built from `baseContract`, which carries NetScript's standard typed-error
map (`NOT_FOUND`, `VALIDATION_ERROR`, …) so every consumer sees the same failure
vocabulary:

```ts
// contracts/versions/v1/messages.contract.ts
import { z } from 'zod';
import { implement } from '@orpc/server';
import {
  baseContract,
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
} from '@netscript/contracts';

// The one shape everything else in this track agrees on.
export const ChannelMessageSchemaV1 = z.object({
  id: z.string().min(1).describe('Message ID'),
  channel: z.string().min(1).describe('Channel the message belongs to'),
  author: z.string().min(1).describe('Display name of the sender'),
  body: z.string().min(1).max(4000).describe('Message text'),
  sentAt: z.string().datetime().describe('ISO timestamp'),
});

// What a caller submits — the server owns id and sentAt.
export const SendMessageSchemaV1 = ChannelMessageSchemaV1.omit({
  id: true,
  sentAt: true,
});

export const MessagesContract = {
  // Accept one message. @throws VALIDATION_ERROR on bad input.
  send: baseContract
    .route({ method: 'POST', path: '/messages' })
    .input(SendMessageSchemaV1)
    .output(ChannelMessageSchemaV1),

  // Page through a channel's messages.
  list: baseContract
    .route({ method: 'GET', path: '/messages' })
    .input(OffsetPaginationQuerySchema.extend({ channel: z.string().min(1) }))
    .output(z.object({
      items: z.array(ChannelMessageSchemaV1),
      total: nonNegativeInt({ description: 'Total count' }),
      limit: paginationLimit({ description: 'Results per page' }),
      offset: paginationOffset({ description: 'Current offset' }),
    })),
};

// implement() makes the contract `.handler()`-bindable when you build a service later.
export const MessagesContractV1 = implement(MessagesContract);
```

Two things to read off this. First, `SendMessageSchemaV1` is *derived* from the message
schema with `.omit()` — the input shape can never drift from the output shape. Second,
every procedure inherits the shared error map from `baseContract`, so "what does a
validation failure look like" has one answer across your whole workspace.

{{ comp.apiTable({ caption: "The messages contract surface", rows: [
  { name: "send", type: "POST → ChannelMessageSchemaV1", desc: "Accept a message for a channel. Throws the typed VALIDATION_ERROR on bad input. The delivery worker in chapter 3 owns what happens next." },
  { name: "list", type: "GET → paginated ChannelMessageSchemaV1[]", desc: "Page through a channel's messages with the shared OffsetPaginationQuerySchema plus a channel filter." }
] }) }}

## Step 2 — Register the contract in the v1 aggregate

A contract file is reachable once the versioned `mod.ts` re-exports it. Replace the empty
aggregate:

```ts
// contracts/versions/v1/mod.ts
export * from './messages.contract.ts';

import { MessagesContractV1 } from './messages.contract.ts';

export const v1 = {
  messages: MessagesContractV1,
};
```

Now `v1.messages.*` is reachable from the `@mini-chat/contracts` barrel and the
`@mini-chat/contracts/versions/v1` subpath — which is how the scripts below, and any future
service, import it.

## Step 3 — Prove the schema at runtime

The contract is not just types — the Zod schemas validate real input at runtime. Prove it
with a script that parses one good message and one bad one:

```ts
// scripts/check-message-shape.ts
import { SendMessageSchemaV1 } from '@mini-chat/contracts/versions/v1';

// A well-formed message: parses and comes back typed.
const ok = SendMessageSchemaV1.parse({
  channel: 'general',
  author: 'ada',
  body: 'The delivery pipeline is next.',
});
console.log('accepted:', ok);

// A malformed message: empty body. safeParse reports instead of throwing.
const bad = SendMessageSchemaV1.safeParse({ channel: 'general', author: 'ada', body: '' });
console.log('rejected:', !bad.success);
```

Run it from the project root:

```sh
deno run scripts/check-message-shape.ts
```

You should see the accepted message echoed back and `rejected: true` for the empty body.
The same schema object that just ran is what the `send` procedure declares as its input —
validation is not a separate layer you might forget to wire.

## Verify your progress

The contracts workspace is part of the root `check` task, so a clean check proves the
schemas, both procedures, and the `mod.ts` registration all line up:

```sh
deno task check
```

- [ ] `contracts/versions/v1/messages.contract.ts` exists with `send` and `list` built from
      `baseContract`.
- [ ] `MessagesContractV1` is registered in `contracts/versions/v1/mod.ts` and reachable as
      `v1.messages`.
- [ ] `deno run scripts/check-message-shape.ts` prints the accepted message and
      `rejected: true`.
- [ ] `deno task check` is clean.

## What you built

The single source of truth for what a message is: `ChannelMessageSchemaV1`, a derived input
shape, and a two-procedure contract carrying NetScript's shared typed errors — registered
and proven against real input. Nothing downstream invents its own message shape now: the
worker in chapter 3 and the stream in chapter 4 both reuse this one.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" }, next: { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" } }) }}
