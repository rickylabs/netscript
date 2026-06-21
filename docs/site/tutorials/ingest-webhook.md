---
layout: layouts/base.vto
title: Ingest a webhook
templateEngine: [vento, md]
prev: { label: "4 · A durable workflow", href: "/tutorials/durable-workflow/" }
next: null
---

# Tutorial 5 · Ingest a webhook

This is the final rung of the NetScript learning ladder. By the end you will have an HTTP endpoint
the outside world can `POST` to, and that endpoint will hand work straight to the background-job
system you built in [Tutorial 3](/tutorials/background-jobs/). That closes the loop: an inbound
request becomes a durable job, the job publishes a saga message, and the saga from
[Tutorial 4](/tutorials/durable-workflow/) completes the workflow — all from one webhook hit.

Triggers are how NetScript receives events from the world. The triggers plugin runs its own API on
port **`:8093`** and — unlike services, workers, and sagas — it speaks **raw [Hono](https://hono.dev/)
routes, not oRPC**. That difference is deliberate: webhooks come from third parties (Stripe, GitHub,
your own systems) that send plain JSON to a fixed path, so the triggers service exposes ordinary HTTP
you can point any sender at. The full generated API lives at [`/reference/triggers/`](/reference/triggers/).

{{ comp.learningPath({ steps: [
  { label: "Quickstart", href: "/quickstart/" },
  { label: "1 · First workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · Durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## In this step you will

- Add the **triggers** plugin to your workspace under `plugins/triggers/`.
- Author a webhook with `defineWebhook(...)` that enqueues a worker job on each inbound request.
- Learn which **trigger actions** are supported today (`enqueueJob` is live; `defer` is not).
- Start the triggers API on `:8093` and `POST` a real payload to it.
- Watch the webhook hand off to the worker job from Tutorial 3, completing the continuous app.

## Before you begin

This rung builds on the app you have grown across the ladder. You should already have:

- A workspace from [Tutorial 1](/tutorials/first-workspace/) with `aspire run` healthy.
- The **workers** plugin from [Tutorial 3](/tutorials/background-jobs/), including the
  `workers-plugin-health-check` job — the webhook will enqueue it.
- The **sagas** plugin from [Tutorial 4](/tutorials/durable-workflow/) (optional for this rung, but it
  is what makes the full choreography visible).

{{ comp callout { type: "important", title: "Aspire must be running first" } }}
As on every rung, your database and cache only exist while <code>aspire run</code> is up (started from the <code>aspire/</code> folder — see <a href="/tutorials/first-workspace/">Tutorial 1</a>). The triggers processor and its job hand-off depend on Deno KV and the workers runtime, so bring Aspire up <strong>before</strong> running any <code>netscript db</code> command or starting the triggers service.
{{ /comp }}

## Step 1 — Add the triggers plugin

From the project root, add the official triggers plugin with its sample modules:

```sh
netscript plugin add trigger --samples
```

This lands a new workspace at `plugins/triggers/` and registers it in `netscript.config.ts`
(`./plugins/triggers/mod.ts`) and `appsettings.json`. The `--samples` flag also drops in working
webhook modules — `generic-webhook.ts` and `webhook-validate-data.ts` — plus a small `jobs/` folder
of trigger-driven jobs you can study.

Confirm it registered:

```sh
netscript plugin list
```

You should see `triggers` alongside the `workers` and `sagas` plugins you added on earlier rungs.

{{ comp callout { type: "note", title: "Where the plugin really lives" } }}
The canonical install is <code>plugins/triggers/</code> — that is the path <code>netscript.config.ts</code> points at and <code>appsettings.json</code> uses as the plugin <code>Workdir</code>. You may also see a slimmer top-level <code>triggers/</code> directory; that is a background-processor staging copy. Author and read your webhooks under <code>plugins/triggers/</code>.
{{ /comp }}

## Step 2 — Read the sample webhook

Open the sample at `plugins/triggers/generic-webhook.ts`. This is the canonical "turn an inbound
request into a background job" pattern, and it is the shape you will copy for your own webhooks.

{{ comp.tabbedCode({ tabs: [
  {
    label: "plugins/triggers/generic-webhook.ts",
    lang: "ts",
    code: "import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\n\n// A reference to the worker job we want to enqueue (from Tutorial 3).\nconst workersHealthCheckJob = {\n  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],\n  name: 'Workers Health Check',\n  topic: 'default',\n} satisfies JobDefinition<'workers-plugin-health-check'>;\n\nexport const genericInboundWebhook = defineWebhook(\n  // The handler returns an array of effects. Here: enqueue one worker job.\n  () =>\n    Promise.resolve([\n      enqueueJob(workersHealthCheckJob, {\n        payload: { verbose: false },\n        priority: 50,\n      }),\n    ]),\n  {\n    id: 'generic-inbound-webhook',\n    path: 'inbound/generic',\n    verifier: 'memory',\n    description: 'Open webhook that enqueues the workers plugin health-check job.',\n    tags: ['webhook', 'runtime-task', 'health-check'],\n  },\n);\n\nexport default genericInboundWebhook;"
  }
] }) }}

Three things to read off this:

- **`defineWebhook(handler, options)`** comes from `@netscript/plugin-triggers-core/builders`. The
  handler is an `async`/arrow function — never a bare `function` — that resolves to an **array of
  effects**.
- **`enqueueJob(jobRef, { payload, priority })`** is the effect that bridges to the worker system.
  Each effect the handler returns is applied after the request is accepted; this one enqueues the
  `workers-plugin-health-check` job you authored in [Tutorial 3](/tutorials/background-jobs/).
- The **`options`** object names the webhook: `id` is its stable identifier, `path` is the URL segment
  the router mounts it under (`inbound/generic`), `verifier: 'memory'` selects the signature verifier
  (the in-memory/open verifier for local dev), and `tags` are metadata for discovery.

{{ comp callout { type: "tip", title: "An effect array, not a response body" } }}
A webhook handler does not write an HTTP response itself — it returns the <em>effects</em> to run. Returning <code>[]</code> (as the sibling <code>webhook-validate-data.ts</code> sample does) accepts the request but enqueues nothing. Returning one or more <code>enqueueJob(...)</code> entries hands that many jobs to the workers runtime. This keeps inbound HTTP thin and pushes the real work onto the durable background queue.
{{ /comp }}

## Step 3 — Know which trigger actions are supported

A handler returns an array of **trigger actions** (effects). It is worth being precise about which
ones the runtime actually dispatches today, so you do not author against a stub:

{{ comp apiTable {
  caption: "Trigger actions",
  columns: ["Action", "Status", "What it does"],
  rows: [
    ["enqueueJob(jobRef, opts)", "Live", "Places a worker job on the queue. This is the supported way to turn an inbound event into durable background work."],
    ["defer({ until })", "Defined, not yet supported", "The action type exists in the builder surface, but the runtime processor throws on dispatch and routes the event to the dead-letter queue. There is no deferred replay yet — do not rely on it."]
  ]
} /}}

In other words: build with `enqueueJob(...)`. If you return a `defer(...)` action, the trigger
runtime processor raises an unsupported-operation error and the event lands in the DLQ rather than
being scheduled for later — so reach for the [scheduling features of the triggers
capability](/capabilities/triggers/) (cron and file-watch triggers) when you need time-based work,
not `defer`.

{{ comp callout { type: "note", title: "Why this distinction matters" } }}
NetScript fails loud rather than silently dropping work. A <code>defer(...)</code> action is not quietly ignored — the processor <strong>throws</strong> and the event is DLQ'd, so you will see it rather than wonder why nothing ran. When the deferred-replay path lands, this note will change; until then, treat <code>enqueueJob</code> as the one live action.
{{ /comp }}

## Step 4 — Understand the route (Hono, not oRPC)

The triggers API service is built on **raw Hono**, which is why its routes look different from the
oRPC services and the workers/sagas APIs. Inside `plugins/triggers/services/src/router.ts` the
service simply mounts two Hono sub-apps:

{{ comp.tabbedCode({ tabs: [
  {
    label: "plugins/triggers/services/src/router.ts",
    lang: "ts",
    code: "// The triggers service mounts plain Hono routers — no oRPC contract layer.\napp.route('/api/v1/events', createEventsRouter({ eventStore }));\napp.route('/api/v1/webhooks', createWebhookRouter({ ingress }));"
  }
] }) }}

The webhook router is a `new Hono()` with a `POST /:triggerId` handler. When a request arrives at
`/api/v1/webhooks/inbound/generic`, Hono resolves `:triggerId` to `inbound/generic`, which matches the
`path` on your `genericInboundWebhook` definition — so the handler runs and its effects are applied.

{{ comp callout { type: "note", title: "Why triggers are Hono and services are oRPC" } }}
oRPC gives services a typed contract shared with their clients. Webhooks have no NetScript client — the sender is a third party posting arbitrary JSON to a fixed path — so a contract would buy nothing. Triggers therefore expose ordinary Hono routes you can point any webhook source at. See <a href="/capabilities/triggers/">the triggers capability</a> for the full picture.
{{ /comp }}

## Step 5 — Start the triggers service

If `aspire run` is up, it orchestrates the triggers API and its background processor for you (look for
the `triggers-api` and `triggers` resources in the [dashboard](http://localhost:18888)). To run the
API on its own during development, start it from the plugin workspace:

```sh
deno task --cwd plugins/triggers dev
```

The triggers API listens on port **`:8093`** by default (resolved from `PORT`, falling back to the
plugin's default port). Confirm it is alive:

```sh
curl http://localhost:8093/health
```

## Step 6 — Verify: POST a webhook and watch the job run

Send a real inbound request to your webhook's path. The body is plain JSON — this is a raw Hono route,
so any HTTP client works:

```sh
curl -X POST http://localhost:8093/api/v1/webhooks/inbound/generic \
  -H "content-type: application/json" \
  -d '{"event":"ping","source":"tutorial"}'
```

The request resolves the trigger id `inbound/generic`, your handler runs, and its single
`enqueueJob(...)` effect places the `workers-plugin-health-check` job on the workers queue.

Now confirm both sides of the hand-off:

```sh
# 1. The trigger recorded the inbound event (Hono, :8093)
curl "http://localhost:8093/api/v1/events?limit=10"

# 2. The worker job it enqueued has executed (workers API, :8091)
curl "http://localhost:8091/api/v1/workers/executions?limit=10"
```

You should see the inbound event listed by the triggers events endpoint, and a fresh execution of
`workers-plugin-health-check` in the workers executions list. If you also have the saga from
Tutorial 4 wired to the `create-user-settings` job, that worker run is what publishes
`UserSettingsCreated` — and your saga completes. One webhook hit, end to end.

{{ comp callout { type: "warning", title: "If the job does not appear" } }}
<ul>
<li>Make sure <code>aspire run</code> is up — the workers runtime and KV must be live for the enqueued job to execute.</li>
<li>Confirm the job id in <code>enqueueJob(...)</code> matches a registered worker job (<code>workers-plugin-health-check</code> from <a href="/tutorials/background-jobs/">Tutorial 3</a>). An unknown id is accepted at the webhook but has nothing to run.</li>
<li>Check the <code>triggers</code> processor resource in the Aspire <a href="http://localhost:18888">dashboard</a> for errors — the background processor, not the API, is what drains the effects.</li>
<li>If you returned a <code>defer(...)</code> action by mistake, look in the dead-letter queue — that action is not yet supported and is DLQ'd rather than scheduled.</li>
</ul>
{{ /comp }}

## What you built

A complete, event-driven path through the whole app:

```
POST :8093/api/v1/webhooks/inbound/generic   (Hono trigger)
        │  defineWebhook handler returns [ enqueueJob(...) ]
        ▼
workers job  workers-plugin-health-check     (:8091, Tutorial 3)
        │  create-user-settings publishes UserSettingsCreated
        ▼
saga  UserSettingsCreated handler            (:8092, Tutorial 4)
        │  returns [ sagaComplete(...) ]
        ▼
workflow complete
```

You added the triggers plugin under `plugins/triggers/`, authored a webhook with `defineWebhook(...)`
that calls `enqueueJob(...)`, served it as a raw Hono route on `:8093`, and watched a single inbound
`POST` ripple through the worker and saga you built on earlier rungs. That is the continuous-app
thread the whole ladder was building — closed.

## Where to go next

You have finished the tutorials ladder. From here, branch into reference-style and task-oriented docs:

- **Solve a specific task** → the [How-to guides](/how-to/) — recipes for adding plugins, running
  migrations, deploying, wiring OpenTelemetry, and more.
- **See every capability** → the [Capabilities hub](/capabilities/), including the
  [Triggers capability](/capabilities/triggers/) for verifiers, scheduling, and file-watch triggers
  beyond webhooks.
- **Look up the generated API** → the [`triggers` reference](/reference/triggers/) for the full
  `defineWebhook` surface, the Hono route table, and the events store.
- **Understand the model** → [The plugin model](/explanation/plugin-model/) and
  [Durable workflows](/explanation/durable-workflows/).
- **Add a user identity layer** → the new [Authentication capability](/capabilities/authentication/)
  if your webhooks need to attribute inbound events to signed-in users.
