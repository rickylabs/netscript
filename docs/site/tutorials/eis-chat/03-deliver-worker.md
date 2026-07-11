---
layout: layouts/base.vto
title: One delivery worker
templateEngine: [vento, md]
prev: { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" }
next: { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
---

# One delivery worker

Accepting a message and delivering it are different jobs. Delivery fans out — persistence,
notifications, unread counters — and none of it belongs on the request path: a chat app
that loses an accepted message because a process restarted mid-request has failed at the
one thing it exists to do. In this chapter you author `mini-chat`'s delivery step as a
**durable background job**, trigger it over the workers API, and read its structured result
off the executions feed.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/eis-chat/01-scaffold/" },
  { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" },
  { label: "3 · Delivery worker", href: "/tutorials/eis-chat/03-deliver-worker/" },
  { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" }
] }) }}

## What you will build

A `deliver-message` job under `plugins/workers/jobs/` that validates its payload **with the
contract schema from chapter 2**, stamps the server-owned fields (`id`, `sentAt`), and
returns the finished message as a structured result — plus the two commands that prove it:
one `curl` to trigger an execution, one `curl` to audit it.

## Before you begin

You need chapters [1](/tutorials/eis-chat/01-scaffold/) and
[2](/tutorials/eis-chat/02-message-contract/) done: the workers plugin installed, `aspire
start` up, and the messages contract registered. Confirm the workers API is healthy:

```sh
curl http://localhost:8091/health
```

If it does not answer, return to chapter 1 — do not start over.

## Step 1 — Author the delivery job

A NetScript job is a function wrapped by `defineJobHandler`, given a stable `id`, and
exported as the module default. Inside the handler you receive a `ctx` carrying the
payload, do the work, and return a result built with `createSuccessResult` /
`createFailureResult`. Create the job under the workers plugin:

```ts
// plugins/workers/jobs/deliver-message.ts
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { SendMessageSchemaV1 } from '@mini-chat/contracts/versions/v1';

const handler = defineJobHandler(async (ctx) => {
  // 1. Validate the inbound payload with the SAME schema the contract declares.
  const parsed = SendMessageSchemaV1.safeParse(ctx.payload ?? {});
  if (!parsed.success) {
    return createFailureResult(`Not a valid message: ${parsed.error.message}`);
  }

  // 2. Stamp the server-owned fields. This is where a fuller delivery step
  //    would persist the message and fan out notifications.
  const message = {
    id: crypto.randomUUID(),
    ...parsed.data,
    sentAt: new Date().toISOString(),
  };

  // 3. Return a structured result. The runtime records it on the execution.
  return await Promise.resolve(createSuccessResult({ delivered: message }));
});

export default Object.assign(handler, { id: 'deliver-message' });
```

The three things to read off this: the payload is validated by the **contract's own
schema** — the job cannot quietly accept a shape the API would reject; the handler is an
`async` arrow function; and the stable `id` is attached with `Object.assign` so the runtime
registry addresses the job by a predictable string rather than its filename.

{{ comp callout { type: "tip", title: "Jobs do one thing" } }}
This handler validates, stamps, and reports — and stops. In the full eis-chat delivery
pipeline the follow-on steps (persist, notify, update counters) are their own units, each
small and independently retryable. One job is enough to prove the seam; chapter 4 adds the
broadcast half.
{{ /comp }}

## Step 2 — Register the job

The runtime addresses jobs through a generated registry that maps each `id` to its handler.
Generate the plugin registries from the project root:

```sh
netscript generate plugins
```

This scans `plugins/workers/jobs` and writes the registry the running runtime loads. After
this, `deliver-message` is addressable.

{{ comp callout { type: "note", title: "Restart the runtime after generating" } }}
If <code>aspire start</code> was already up when you generated the registry, restart it (or
let it hot-reload) so the workers runtime picks up the new job.
{{ /comp }}

## Step 3 — Trigger a delivery

The workers API can trigger any registered job directly — no service required. Send it a
message payload:

```sh
curl -X POST http://localhost:8091/api/v1/workers/jobs/deliver-message/trigger \
  -H 'content-type: application/json' \
  -d '{ "payload": { "channel": "general", "author": "ada", "body": "First durable delivery." } }'
```

The trigger returns quickly, because the work runs in the background — that is the point.
The request path's only obligation is to hand the message to something durable.

## Verify your progress

Confirm the execution actually ran by reading the executions feed:

```sh
curl 'http://localhost:8091/api/v1/workers/executions?limit=10'
```

Expected: a completed `deliver-message` run whose result carries your message under
`delivered` — with a generated `id` and `sentAt` stamped alongside the `channel`, `author`,
and `body` you sent. Now prove the contract is doing its job: trigger again with an empty
`body` and watch the same feed record a **failed** execution with your "Not a valid
message" error.

```sh
curl -X POST http://localhost:8091/api/v1/workers/jobs/deliver-message/trigger \
  -H 'content-type: application/json' \
  -d '{ "payload": { "channel": "general", "author": "ada", "body": "" } }'
```

- [ ] `plugins/workers/jobs/deliver-message.ts` exists and validates with
      `SendMessageSchemaV1`.
- [ ] `netscript generate plugins` ran, and the runtime was restarted.
- [ ] The executions feed shows a completed `deliver-message` run with the stamped message
      in its result.
- [ ] The empty-body trigger shows up as a failed execution with the validation error.
- [ ] `deno task check` is clean.

{{ comp callout { type: "warning", title: "If the job never runs" } }}
<ul>
<li><strong>Aspire isn't up</strong> — the workers runtime is an Aspire resource. Start
<code>aspire start</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered</strong> — re-run <code>netscript generate
plugins</code> so <code>deliver-message</code> is in the generated registry, then restart
Aspire.</li>
<li><strong>Wrong id in the URL</strong> — the trigger path uses the job's stable
<code>id</code> (<code>deliver-message</code>), not its filename.</li>
</ul>
{{ /comp }}

## What you built

A durable `deliver-message` job that enforces the chapter-2 contract at the seam where it
matters, triggered and audited entirely over the documented workers API. An accepted
message now survives the request that carried it. What it cannot do yet is *reach anyone* —
that is the live stream, next.

{{ comp.nextPrev({ prev: { label: "2 · Message contract", href: "/tutorials/eis-chat/02-message-contract/" }, next: { label: "4 · Live stream", href: "/tutorials/eis-chat/04-live-stream/" } }) }}
