---
layout: layouts/base.vto
title: A verified shipping webhook
templateEngine: [vento, md]
prev: { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" }
next: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" }
---

# A verified shipping webhook

In this chapter you accept events from outside your shop. A carrier reports that a parcel shipped by
posting a webhook; you add an HMAC-verified webhook endpoint for it that hands each inbound event to a
background job. Triggers are how NetScript receives events from external systems.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
  { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
] }) }}

## What you will build

A webhook written with `defineWebhook(...)`, **HMAC-SHA256 verified** against a shared secret, that
calls `enqueueJob(...)` for each accepted request so a worker job processes the shipping update off
the request path. At the end you `POST` a payload to the triggers API and see the inbound event
recorded and the job run.

## Before you begin

You should have finished [chapter 4](/tutorials/storefront/04-checkout-saga/), so:

- `my-shop/` has the `products` service, the `cart` contract, and the `sagas` plugin with your
  `CheckoutSaga` and the `process-payment` worker job;
- `aspire start` is up (the dashboard answers at [https://localhost:18888](https://localhost:18888)).
  The triggers processor and its job hand-off depend on Deno KV and the workers runtime.

## Step 1 — Check the triggers plugin

Chapter 4 installed the official triggers plugin with its sample modules. Confirm it is registered:

```sh
netscript plugin list
```

The list shows `workers`, `sagas`, `triggers` and `streams`. If `triggers` is missing, install it
from the project root:

```sh
netscript plugin install trigger --name triggers --samples
```

The plugin is a workspace at `plugins/triggers/`, registered in `netscript.config.ts`
(`./plugins/triggers/mod.ts`) and `appsettings.json`. `--samples` adds working webhook modules and a
small `jobs/` folder to study.

{{ comp callout { type: "note", title: "Where the plugin lives" } }}
The canonical install is <code>plugins/triggers/</code>, the path <code>netscript.config.ts</code>
points at. You may also see a slimmer top-level <code>triggers/</code> staging copy; write and read
your webhooks under <code>plugins/triggers/</code>.
{{ /comp }}

## Step 2 — Author the shipping-update job and the verified webhook

The webhook hands each inbound event to a background job, so generate that job first.

{{ comp callout { type: "note", title: "ns-workers and ns-triggers are shorthands you install once" } }}
<code>ns-workers</code> and <code>ns-triggers</code> are names <em>you</em> give the workers and
triggers plugin CLIs; the scaffold doesn't create them. Install them once, globally, and every
shorthand command on this page works as written:
<pre><code class="language-bash">deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
deno install -gArf -n ns-triggers jsr:@netscript/plugin-triggers{{ releaseSpecifier }}/cli</code></pre>
To skip the install, run each <code>ns-&lt;plugin&gt; &lt;verb …&gt;</code> as
<code>deno x -A jsr:@netscript/plugin-&lt;plugin&gt;{{ releaseSpecifier }}/cli &lt;verb …&gt;</code>.
{{ /comp }}

```sh
ns-workers add job process-shipping-update
```

Extend the generated payload schema with `orderId`, `status` and `trackingNumber`, then replace the
starter handler body with the validation and application logic. A real integration would advance the
order; this one validates and records the update:

```ts
// workers/jobs/process-shipping-update.ts
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';
import { z } from 'zod';

const PayloadSchema = z.object({
  orderId: z.string().min(1),
  status: z.string().min(1),
  trackingNumber: z.string().optional(),
});

const handler = defineJobHandler(async (ctx) => {
  const update = PayloadSchema.parse(ctx.payload ?? {});
  // ... advance the order / notify the customer ...
  return createSuccessResult(update);
});

export default Object.assign(handler, { id: 'process-shipping-update' });
```

Then generate the webhook and its worker-job action with the triggers CLI. The CLI's `add-webhook`
verb is written as `add webhook` on the command line:

```sh
ns-triggers add webhook shipping-status-webhook \
  --path=shipping/status \
  --job=process-shipping-update \
  --verifier=hmac-sha256 \
  --secret-env=WEBHOOK_SHIPPING_SECRET \
  --description="Receives carrier shipping-status callbacks and enqueues a processing job." \
  --tags=webhook,shipping,saga
```

The command writes `triggers/shipping-status-webhook-trigger.ts` and recompiles the generated
trigger registry. The definition uses `defineWebhook(handler, spec)` from
`@netscript/plugin-triggers-core/builders`: the handler resolves to an **array of effects**, and the
spec names the webhook and declares HMAC verification, so forged requests are rejected before your
handler runs. The job reference is an inline object typed with `satisfies JobDefinition`. The
relevant shape:

```ts
// triggers/shipping-status-webhook-trigger.ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

// A typed reference to the worker job authored above.
const processShippingJob = {
  id: 'process-shipping-update' as JobDefinition<'process-shipping-update'>['id'],
  name: 'Process Shipping Update',
  topic: 'default',
} satisfies JobDefinition<'process-shipping-update'>;

export default defineWebhook(
  // The handler returns effects. Here: enqueue one job with the inbound payload.
  (event) => Promise.resolve([enqueueJob(processShippingJob, { payload: event.payload })]),
  {
    id: 'shipping-status-webhook',
    path: 'shipping/status',
    verifier: 'hmac-sha256',
    secretEnv: 'WEBHOOK_SHIPPING_SECRET',
    description: 'Receives carrier shipping-status callbacks and enqueues a processing job.',
    tags: ['webhook', 'shipping', 'saga'],
    metadata: {
      direction: 'inbound',
      pipeline: 'shipment-fulfillment',
      provider: 'carrier',
    },
  },
);
```

Three things to notice:

- **`defineWebhook(handler, spec)`** takes the handler first, then the static spec. The handler
  resolves to an **array of effects**: return a `Promise` of the effect array, never a bare
  `function`-keyword declaration.
- **`verifier: 'hmac-sha256'` with `secretEnv`** is the security seam. The triggers ingress checks
  the request's HMAC signature against the secret named by `secretEnv` (here
  `WEBHOOK_SHIPPING_SECRET`) *before* it invokes your handler, so a request that fails verification
  never reaches your code.
- **`enqueueJob(jobRef, { payload })`** is the effect that bridges to the worker system. Effects run
  after the request is accepted; this one enqueues `process-shipping-update` with the verified
  inbound payload.

{{ comp.apiTable({ caption: "defineWebhook spec fields", rows: [
  { name: "id", type: "string", desc: "Stable identifier for the webhook in the registry." },
  { name: "path", type: "string", desc: "URL segment the router mounts it under — here shipping/status, reached at /api/v1/webhooks/shipping/status." },
  { name: "verifier", type: "'hmac-sha256' | 'memory' | string", desc: "Signature verifier. hmac-sha256 checks the request HMAC against secretEnv; memory is the open local-dev verifier." },
  { name: "secretEnv", type: "string (optional)", desc: "Name of the env var holding the shared secret used by the hmac-sha256 verifier." },
  { name: "tags / metadata", type: "optional", desc: "Discovery metadata — not behavior. Useful for grouping and dashboards." }
] }) }}

{{ comp callout { type: "tip", title: "An effect array, not a response body" } }}
A webhook handler doesn't write an HTTP response; it returns the <em>effects</em> to run. Returning
<code>[]</code> accepts the request and enqueues nothing; each <code>enqueueJob(...)</code> entry hands
one job to the workers runtime. Inbound HTTP stays thin and the real work runs on the durable
background queue.
{{ /comp }}

## Step 3 — Choose immediate work or one-shot replay

A handler returns an array of **trigger actions** (effects). The runtime dispatches these two:

{{ comp.apiTable({ caption: "Trigger actions", rows: [
  { name: "enqueueJob(jobRef, opts)", type: "Live", desc: "Places a worker job on the queue. The supported way to turn an inbound event into durable background work." },
  { name: "defer({ until })", type: "Live", desc: "Persists the event and replays its handler once at or after the ISO timestamp, surviving runtime restarts." }
] }) }}

Use `enqueueJob(...)` when the work is ready now, and `defer({ until })` when the same event should
be processed once more at a future instant. Deferred delivery is at-least-once, so keep the handler
idempotent. For recurring work, use cron scheduling.

## Step 4 — Route shape (raw webhook ingress)

The triggers service serves a typed v1 oRPC contract for trigger and event introspection and
management, but the **webhook ingress endpoint** is a **raw route**, not an oRPC procedure. The
sender is a third party with no NetScript client, posting plain JSON to a fixed path, and the
endpoint verifies an HMAC signature over the raw request bytes, so a typed contract adds nothing.

The ingress handler resolves a `POST /:triggerId` path: a request to
`/api/v1/webhooks/shipping/status` resolves `:triggerId` to `shipping/status`, which matches your
webhook's `path`, so the handler runs and its effects are applied. See
[the triggers capability](/durable-workflows/triggers/) for verifiers, scheduling and file-watch
triggers.

## Step 5 — Set the secret and start the triggers service

The `hmac-sha256` verifier reads its secret from the environment. Set it before you start the
service, and use the same value when you sign your test request:

```sh
export WEBHOOK_SHIPPING_SECRET=dev-shipping-secret
```

Under `aspire start`, Aspire runs the triggers API and its background processor: look for the
`triggers-api` and `triggers` resources in the [dashboard](https://localhost:18888). To run the API on
its own during development, start it from the plugin workspace:

```sh
deno task --cwd plugins/triggers dev
```

The triggers API listens on a host port Aspire allocates at start. Read the `triggers-api` endpoint
from the [Aspire dashboard](/explanation/aspire/) resource list and confirm it is alive:

```sh
curl <triggers-endpoint>/health
```

The commands below write `<triggers-endpoint>` for that value.

## Verify your progress

Because the webhook is `hmac-sha256`-verified, a real sender includes an **`x-hub-signature-256`**
header: a hex HMAC-SHA256 of the raw body under the shared secret, optionally prefixed with
`sha256=`. The carrier's dashboard computes it for you.

{{ comp callout { type: "caution", title: "The memory verifier accepts unsigned requests" } }}
For a quick local smoke test you can set <code>verifier</code> to <code>'memory'</code>, the open,
no-signature verifier, so a bare <code>POST</code> is accepted. Switch back to
<code>'hmac-sha256'</code> before the endpoint receives anything real.
{{ /comp }}

1. Send an inbound request to your webhook's path, with verification satisfied:

   ```sh
   curl -X POST <triggers-endpoint>/api/v1/webhooks/shipping/status \
     -H "content-type: application/json" \
     -d '{"orderId":"ord_1001","status":"shipped","trackingNumber":"1Z999"}'
   ```

   An accepted request returns **`202`**. The request resolves the trigger id `shipping/status`,
   your handler runs, and its `enqueueJob(...)` effect places `process-shipping-update` on the
   workers queue.

2. Confirm both sides of the hand-off:

   ```sh
   # 1. The trigger recorded the inbound event (Hono ingress)
   curl "<triggers-endpoint>/api/v1/events?limit=10"

   # 2. The worker job it enqueued has executed (workers API; the CLI resolves it)
   ns-workers executions --limit=10 --json
   ```

   The triggers events endpoint lists the inbound event, and the workers executions list shows a new
   execution of `process-shipping-update`.

- [ ] `netscript plugin list` shows `triggers`, installed at `plugins/triggers/`.
- [ ] `triggers/shipping-status-webhook-trigger.ts` uses `verifier: 'hmac-sha256'` with a `secretEnv`.
- [ ] `WEBHOOK_SHIPPING_SECRET` is set in the environment running the triggers service.
- [ ] `curl <triggers-endpoint>/health` answers.
- [ ] A verified `POST` records an event on the triggers API and produces a worker execution.

{{ comp callout { type: "tip", title: "If the job doesn't appear" } }}
<ul>
<li><strong>Aspire isn't running.</strong> The workers runtime and KV must be live for the enqueued
job to run.</li>
<li><strong>The signature doesn't match.</strong> Check that <code>WEBHOOK_SHIPPING_SECRET</code> is
set and matches your request's signature; a failed HMAC check rejects the request before the handler
runs.</li>
<li><strong>Unknown job id.</strong> The id in <code>enqueueJob(...)</code> must match a registered
worker job. The webhook accepts an unknown id, but there is nothing to run.</li>
<li><strong>Processor errors.</strong> The background processor, not the API, applies the effects.
Check the <code>triggers</code> resource in the Aspire
<a href="https://localhost:18888">dashboard</a>.</li>
</ul>
{{ /comp }}

## What you built

An **HMAC-SHA256 verified** webhook, written with `defineWebhook(handler, { id, path, verifier,
secretEnv, ... })`, that rejects forged requests and enqueues a `process-shipping-update` job for
each accepted one. You confirmed the hand-off end to end: an event recorded on the triggers API and a
worker execution on the workers API. The backend now covers catalog, cart, durable checkout and
verified ingress. Next, you give it a storefront page.

{{ comp.nextPrev({ prev: { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" }, next: { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" } }) }}
