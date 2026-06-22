---
layout: layouts/base.vto
title: A verified shipping webhook
templateEngine: [vento, md]
prev: { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" }
next: { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
---

# A verified shipping webhook

In [chapter 4](/tutorials/storefront/04-checkout-saga/) your checkout saga `send`s a `create-shipment`
command and waits for a `ShipmentCreated` message. But the real signal that a parcel shipped comes
from *outside* your shop — from a carrier or payment provider posting a webhook. This chapter adds
that ingress: an HMAC-verified webhook endpoint that the provider `POST`s to, which hands each inbound
event straight to a background job. Triggers are how NetScript receives events from the world.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
] }) }}

## What you will build

You will add the `triggers` plugin, then author a webhook with `defineWebhook(...)` that is
**HMAC-SHA256 verified** against a shared secret and, on each accepted request, `enqueueJob(...)`s a
worker job to process the shipping update off the request path. You will start the triggers API on
`:8093` and `POST` a real payload to it, watching the inbound event get recorded and the job enqueued.

## Before you begin

You should have finished [chapter 4](/tutorials/storefront/04-checkout-saga/), so:

- `my-shop/` has the `products` service, the `cart` contract, and the `sagas` plugin with your
  `CheckoutSaga` and the `process-payment` worker job.
- `aspire run` is up (the dashboard answers at [http://localhost:18888](http://localhost:18888)). The
  triggers processor and its job hand-off depend on Deno KV and the workers runtime, so Aspire must be
  up before you start.

Confirm the plugins you have so far:

```sh
netscript plugin list
```

You should see `sagas` (and its `streams` dependency) from the previous chapter. You will add
`triggers` next.

## Step 1 — Add the triggers plugin

From the project root, add the official triggers plugin with its sample modules:

```sh
deno run -A packages/cli/bin/netscript-dev.ts plugin add trigger --name triggers --samples
```

This local-source contributor command lands a new workspace at `plugins/triggers/` and registers it in `netscript.config.ts`
(`./plugins/triggers/mod.ts`) and `appsettings.json`. The `--samples` flag also drops in working
webhook modules and a small `jobs/` folder you can study. Confirm it registered:

```sh
netscript plugin list
```

You should now see `triggers` alongside `sagas`.

{{ comp callout { type: "note", title: "Where the plugin really lives" } }}
The canonical install is <code>plugins/triggers/</code> — the path <code>netscript.config.ts</code> points at. You may also see a slimmer top-level <code>triggers/</code> staging copy; author and read your webhooks under <code>plugins/triggers/</code>.
{{ /comp }}

## Step 2 — Author the verified webhook

A webhook is `defineWebhook(handler, spec)` from `@netscript/plugin-triggers-core/builders`. The
handler resolves to an **array of effects**; the spec names the webhook and — for a real provider
callback — declares HMAC verification so forged requests are rejected before your handler runs.

First, a small helper that produces a typed reference to the worker job you want to enqueue. This
mirrors the playground's `localJob` helper:

```ts
// plugins/triggers/_jobs.ts
import type { JobDefinition, JobId } from '@netscript/plugin-workers-core';

export function localJob<TId extends string>(id: TId): JobDefinition<TId> {
  return Object.freeze({
    id: id as JobId<TId>,
    entrypoint: `./workers/jobs/${id}.ts`,
    name: id.split('-').filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' '),
    topic: 'default',
  });
}
```

Now the webhook itself. It verifies the inbound signature with `verifier: 'hmac-sha256'` against a
secret read from the environment, and enqueues a `process-shipping-update` job with the request
payload:

```ts
// plugins/triggers/shipping-status-webhook.ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import { localJob } from './_jobs.ts';

const processShippingJob = localJob('process-shipping-update');

export default defineWebhook(
  // The handler returns effects. Here: enqueue one job with the inbound payload.
  async (event) => [enqueueJob(processShippingJob, { payload: event.payload })],
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

Three things to read off this:

- **`defineWebhook(handler, spec)`** takes the handler first, then the static spec. The handler is an
  `async`/arrow function — never a bare `function` — and resolves to an **array of effects**.
- **`verifier: 'hmac-sha256'` + `secretEnv`** is the security seam. The triggers ingress verifies the
  request's HMAC signature against the secret named by `secretEnv` (here `WEBHOOK_SHIPPING_SECRET`)
  *before* your handler is invoked. A request that fails verification never reaches your code. For
  local experiments you can use `verifier: 'memory'` (the open, no-signature verifier), but a real
  provider callback should be `hmac-sha256`.
- **`enqueueJob(jobRef, { payload })`** is the effect that bridges to the worker system. Each effect
  the handler returns is applied after the request is accepted; this one enqueues the
  `process-shipping-update` job with the verified inbound payload.

{{ comp.apiTable({ caption: "defineWebhook spec fields", rows: [
  { name: "id", type: "string", desc: "Stable identifier for the webhook in the registry." },
  { name: "path", type: "string", desc: "URL segment the router mounts it under — here shipping/status, reached at /api/v1/webhooks/shipping/status." },
  { name: "verifier", type: "'hmac-sha256' | 'memory' | string", desc: "Signature verifier. hmac-sha256 checks the request HMAC against secretEnv; memory is the open local-dev verifier." },
  { name: "secretEnv", type: "string (optional)", desc: "Name of the env var holding the shared secret used by the hmac-sha256 verifier." },
  { name: "tags / metadata", type: "optional", desc: "Discovery metadata — not behavior. Useful for grouping and dashboards." }
] }) }}

{{ comp callout { type: "tip", title: "An effect array, not a response body" } }}
A webhook handler does not write an HTTP response itself — it returns the <em>effects</em> to run. Returning <code>[]</code> accepts the request but enqueues nothing; returning one or more <code>enqueueJob(...)</code> entries hands that many jobs to the workers runtime. This keeps inbound HTTP thin and pushes the real work onto the durable background queue.
{{ /comp }}

## Step 3 — Know which trigger actions are supported

A handler returns an array of **trigger actions** (effects). Be precise about which ones the runtime
actually dispatches today, so you do not author against a stub:

{{ comp.apiTable({ caption: "Trigger actions", rows: [
  { name: "enqueueJob(jobRef, opts)", type: "Live", desc: "Places a worker job on the queue. The supported way to turn an inbound event into durable background work." },
  { name: "defer({ until })", type: "Defined, not yet supported", desc: "The action type exists in the builder surface, but the runtime processor throws on dispatch and routes the event to the dead-letter queue. There is no deferred replay yet — do not rely on it." }
] }) }}

In other words: build with `enqueueJob(...)`. If you return a `defer(...)` action, the trigger runtime
raises an unsupported-operation error and the event lands in the DLQ rather than being scheduled —
reach for the scheduling features of the [triggers capability](/capabilities/triggers/) (cron and
file-watch triggers) when you need time-based work, not `defer`.

## Step 4 — Route shape (Hono, not oRPC)

The triggers API service is built on **raw [Hono](https://hono.dev/)**, not oRPC — deliberately.
Webhooks come from third parties posting plain JSON to a fixed path, so a typed contract would buy
nothing. The webhook router is a `new Hono()` with a `POST /:triggerId` handler: a request to
`/api/v1/webhooks/shipping/status` resolves `:triggerId` to `shipping/status`, which matches the
`path` on your webhook — so the handler runs and its effects are applied.

{{ comp callout { type: "note", title: "Why triggers are Hono and services are oRPC" } }}
oRPC gives services a typed contract shared with their clients. Webhooks have no NetScript client — the sender is a third party — so triggers expose ordinary Hono routes you can point any webhook source at. See <a href="/capabilities/triggers/">the triggers capability</a> for verifiers, scheduling, and file-watch triggers.
{{ /comp }}

## Step 5 — Set the secret and start the triggers service

The `hmac-sha256` verifier needs its secret in the environment. Set it before starting the service
(use the same value when you sign your test request):

```sh
export WEBHOOK_SHIPPING_SECRET=dev-shipping-secret
```

If `aspire run` is up it orchestrates the triggers API and its background processor for you (look for
the `triggers-api` and `triggers` resources in the [dashboard](http://localhost:18888)). To run the
API on its own during development, start it from the plugin workspace:

```sh
deno task --cwd plugins/triggers dev
```

The triggers API listens on port **`:8093`** by default. Confirm it is alive:

```sh
curl http://localhost:8093/health
```

## Verify your progress

Send an inbound request to your webhook's path. Because the webhook is `hmac-sha256`-verified, a real
sender includes a signature header computed from the body and the shared secret; the carrier's
dashboard does this for you. For local testing, point the verifier at `'memory'` temporarily, or
compute the HMAC and pass it in the signature header your provider uses. With verification satisfied:

```sh
curl -X POST http://localhost:8093/api/v1/webhooks/shipping/status \
  -H "content-type: application/json" \
  -d '{"orderId":"ord_1001","status":"shipped","trackingNumber":"1Z999"}'
```

The request resolves the trigger id `shipping/status`, your handler runs, and its single
`enqueueJob(...)` effect places the `process-shipping-update` job on the workers queue. Confirm both
sides of the hand-off:

```sh
# 1. The trigger recorded the inbound event (Hono, :8093)
curl "http://localhost:8093/api/v1/events?limit=10"

# 2. The worker job it enqueued has executed (workers API, :8091)
curl "http://localhost:8091/api/v1/workers/executions?limit=10"
```

You should see the inbound event listed by the triggers events endpoint and a fresh execution of
`process-shipping-update` in the workers executions list. One verified webhook hit, handed off to a
durable job.

- [ ] `deno run -A packages/cli/bin/netscript-dev.ts plugin add trigger --name triggers --samples` landed `plugins/triggers/`.
- [ ] `shipping-status-webhook.ts` uses `verifier: 'hmac-sha256'` with a `secretEnv`.
- [ ] `WEBHOOK_SHIPPING_SECRET` is set in the environment running the triggers service.
- [ ] `curl http://localhost:8093/health` answers.
- [ ] A verified `POST` records an event (`:8093`) and produces a worker execution (`:8091`).

{{ comp callout { type: "warning", title: "If the job does not appear" } }}
<ul>
<li>Make sure <code>aspire run</code> is up — the workers runtime and KV must be live for the enqueued job to execute.</li>
<li>Check that <code>WEBHOOK_SHIPPING_SECRET</code> is set and that your request's signature matches; a failed HMAC verification rejects the request before the handler runs.</li>
<li>Confirm the job id in <code>enqueueJob(...)</code> matches a registered worker job. An unknown id is accepted at the webhook but has nothing to run.</li>
<li>Check the <code>triggers</code> processor resource in the Aspire <a href="http://localhost:18888">dashboard</a> for errors — the background processor, not the API, drains the effects.</li>
</ul>
{{ /comp }}

## What you built

- The `triggers` plugin under `plugins/triggers/`.
- An **HMAC-SHA256 verified** webhook authored with `defineWebhook(handler, { id, path, verifier,
  secretEnv, ... })` that rejects forged requests and `enqueueJob(...)`s a `process-shipping-update`
  job on each accepted one.
- A verified inbound `POST` confirmed end to end: an event recorded on the triggers API (`:8093`) and
  a worker execution on the workers API (`:8091`).

Your storefront now spans the full arc — catalog, cart, durable checkout, and a verified webhook from
the outside world. The last chapter runs the whole thing as one orchestrated system on your machine.

{{ comp.nextPrev({ prev: { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" }, next: { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" } }) }}
