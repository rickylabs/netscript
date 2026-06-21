---
layout: layouts/base.vto
title: Triggers & ingress
templateEngine: [vento, md]
prev: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }
next: { label: "Durable streams", href: "/capabilities/streams/" }
---

# Triggers & ingress

The **triggers** plugin is NetScript's front door for the outside world. It turns
inbound HTTP — webhooks, callbacks, third-party event posts — into durable
background work. A trigger handler does one job: receive a request and return a
list of *effects*. The canonical effect is `enqueueJob(...)`, which hands the
payload to the [workers](/capabilities/background-jobs/) plugin so the heavy
lifting happens off the request path. The HTTP call returns immediately; the job
runs durably behind it.

This closes the continuous-app loop. A webhook lands on the triggers service, it
`enqueueJob`s a workers job, that job publishes a saga message, and the
[saga](/capabilities/durable-sagas/) advances a workflow — all from one inbound
POST.

{{ comp callout { type: "important", title: "Triggers speak raw Hono, not oRPC" } }}
Unlike <a href="/capabilities/services/">services</a>, <a href="/capabilities/background-jobs/">workers</a>,
and <a href="/capabilities/durable-sagas/">sagas</a> — which all serve oRPC routers — the triggers
API service mounts <strong>raw <a href="https://hono.dev">Hono</a> routes</strong>. The webhook router is a plain
<code>new Hono()</code> with <code>app.post('/:triggerId', …)</code>, dispatched to a
<code>TriggerIngressPort</code>. This is deliberate: webhook senders post arbitrary, often
non-JSON-RPC shapes, so the ingress edge stays unopinionated HTTP. Do not expect an oRPC client
or typed RPC contract here.
{{ /comp }}

## The shape of a trigger

A trigger lives in your project at `plugins/triggers/` and is authored with
`defineWebhook(...)` from `@netscript/plugin-triggers-core/builders`. The handler
is a function returning a promise of effects; the second argument is the
definition's metadata — its `id`, the `path` it answers on, the `verifier`
strategy, and `tags`.

{{ comp.apiTable({
  caption: "defineWebhook(handler, definition) — the definition object",
  items: [
    { name: "handler", type: "(ctx) => Promise<Effect[]>", desc: "Receives the request context; returns an array of effects (typically enqueueJob calls). Return [] to accept-and-drop." },
    { name: "id", type: "string", desc: "Stable identifier for the webhook definition, e.g. 'generic-inbound-webhook'." },
    { name: "path", type: "string", desc: "The ingress sub-path the webhook answers on, e.g. 'inbound/generic'. Resolved as the :triggerId route segment." },
    { name: "verifier", type: "'memory' | …", desc: "Signature/verification strategy. The scaffold sample uses 'memory' (open, dev-friendly)." },
    { name: "tags", type: "string[]", desc: "Free-form labels for discovery/filtering, e.g. ['webhook','runtime-task','health-check']." },
    { name: "description", type: "string?", desc: "Human-readable summary surfaced by inspect/registry tooling." }
  ]
}) }}

## Supported trigger actions

A trigger handler returns **effects** — declarative descriptions of what should
happen after the request is accepted. The runtime processor reads each effect and
dispatches it. Exactly one effect is wired end-to-end today; a second is *defined
in the type surface* but not yet executable, and it now **fails loud** rather than
silently dropping.

{{ comp.apiTable({
  caption: "Trigger effects — what the runtime processor actually does",
  items: [
    { name: "enqueueJob(job, opts)", type: "✅ live", desc: "Hands the payload to the workers plugin. This is the supported, end-to-end path — it closes the continuous-app loop (webhook → job → saga). Use this for all real ingress work." },
    { name: "defer(...)", type: "⛔ unsupported", desc: "Defined in the builder surface but NOT executable. The runtime processor throws an unsupportedOperation error and routes the message to the dead-letter queue (DLQ). There is no deferred replay — do not author a trigger that relies on defer." }
  ]
}) }}

{{ comp callout { type: "warning", title: "defer is defined-but-unsupported — it fails loud" } }}
The <code>defer</code> action exists in the trigger builder types, but the runtime processor does
<strong>not</strong> implement deferred replay. When a handler emits a <code>defer</code> effect, the
processor throws an <code>unsupportedOperation</code> error and routes the message to the
<strong>dead-letter queue (DLQ)</strong> — it does not silently swallow it. Build ingress flows on
<code>enqueueJob</code> only; if you need delayed work, schedule it on the
<a href="/capabilities/background-jobs/">workers</a> plugin from the enqueued job rather than deferring
at the trigger edge.
{{ /comp }}

## Endpoints & port

The triggers API service runs on **`:8093`**. The webhook router resolves the
inbound `:triggerId` segment against your registered `defineWebhook` definitions —
so a definition with `path: 'inbound/generic'` is reachable at
`POST :8093/api/v1/webhooks/inbound/generic`.

{{ comp.apiTable({
  caption: "Triggers API — runtime surface (port 8093, Hono)",
  items: [
    { name: "POST /api/v1/webhooks/inbound/generic", type: "Hono route", desc: "The scaffold's generic inbound webhook. Posting JSON here resolves trigger id 'inbound/generic' and runs its effects." },
    { name: "POST /api/v1/webhooks/:triggerId", type: "Hono route", desc: "Generic dispatch — :triggerId matches the path of any registered defineWebhook definition." },
    { name: "GET /api/v1/events?limit=10", type: "Hono route", desc: "Recent ingress events recorded by the event store." },
    { name: "GET /health", type: "Hono route", desc: "Liveness check for the triggers API service." }
  ]
}) }}

{{ comp callout { type: "note", title: "Where the background work runs" } }}
The triggers API service (port <code>8093</code>) is the HTTP edge. The actual trigger
processing — cron, file-watch, and KV-backed ingress — runs in a separate background
processor entrypoint at <code>plugins/triggers/src/runtime/trigger-processor.ts</code>. Aspire wires
both as resources (<code>triggers-api</code> and <code>trigger-processor</code>) when you <code>aspire run</code>.
{{ /comp }}

## File watchers

File-based triggers use the same runtime idea as webhooks: detect an external
event, normalize it, and hand durable work to the rest of the system. The
watching primitive itself lives in [`@netscript/watchers`](/reference/watchers/),
not in the Hono API service. Its 80% path is `createWatcher(options)`, which
returns a `FileWatcher`; `watch()` is an async generator that yields normalized
`WatchEvent` objects until you stop it or abort its signal.

```ts
import { createWatcher } from "@netscript/watchers";

const watcher = createWatcher({
  paths: ["./incoming"],
  patterns: ["*.csv"],
  events: ["create", "modify"],
  stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
});

for await (const event of watcher.watch()) {
  console.log(`${event.kind}: ${event.path}`);
}
```

The watcher selects the strategy for you: native OS notifications for local
paths with polling fallback, polling for network paths, or polling immediately
when `forcePolling: true` is set. Events pass through a filter pipeline before
you see them: `GlobFilter` limits filenames, `StabilityFilter` waits for files
to stop growing, and `DedupFilter` skips repeated content hashes within its
window. The concrete `NativeStrategy`, `PollingStrategy`, and `HybridStrategy`
classes are internal; construct watchers with `createWatcher` or `new
FileWatcher(...)` instead.

## Author a trigger

The simple case is one webhook that fans an inbound request out to a single job.
The advanced case validates the payload first, then enqueues. The simple case is
adapted from the scaffold's `plugins/triggers/generic-webhook.ts` sample and
compiles as-is; the advanced tab is an illustrative pattern, not scaffold code —
the real `plugins/triggers/webhook-validate-data.ts` is an accept-and-drop sample
(`() => Promise.resolve([])`) that imports no zod and enqueues no job. Note that
every handler returns an array of `enqueueJob` effects — the only supported
trigger action.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — generic-webhook.ts",
    lang: "ts",
    code: "// plugins/triggers/generic-webhook.ts\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\n\n// A reference to the workers job this webhook will enqueue.\nconst healthCheckJob = {\n  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],\n  name: 'Workers Health Check',\n  topic: 'default',\n} satisfies JobDefinition<'workers-plugin-health-check'>;\n\n// Inbound POST -> enqueue a workers job. The HTTP call returns immediately;\n// the job runs durably on the workers plugin (:8091).\nexport const genericInboundWebhook = defineWebhook(\n  () => Promise.resolve([\n    enqueueJob(healthCheckJob, { payload: { verbose: false }, priority: 50 }),\n  ]),\n  {\n    id: 'generic-inbound-webhook',\n    path: 'inbound/generic',\n    verifier: 'memory',\n    description: 'Open webhook that enqueues the workers plugin health-check job.',\n    tags: ['webhook', 'runtime-task', 'health-check'],\n  },\n);\n\nexport default genericInboundWebhook;"
  },
  {
    label: "Advanced — validate + enqueue",
    lang: "ts",
    code: "// plugins/triggers/webhook-validate-data.ts (pattern)\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\n// Validate the inbound body before doing any work.\nconst InboundSchema = z.object({\n  userId: z.string().min(1),\n  source: z.string().default('webhook'),\n});\n\nconst createUserSettingsJob = {\n  id: 'create-user-settings' as JobDefinition<'create-user-settings'>['id'],\n  name: 'Create User Settings',\n  topic: 'default',\n} satisfies JobDefinition<'create-user-settings'>;\n\nexport const validatedInboundWebhook = defineWebhook(\n  async (ctx) => {\n    // Parse + validate. On a bad shape, accept-and-drop (return []),\n    // or throw to reject the request.\n    const parsed = InboundSchema.safeParse(await ctx.json?.() ?? {});\n    if (!parsed.success) return [];\n\n    // Hand the validated payload to a workers job.\n    return [\n      enqueueJob(createUserSettingsJob, {\n        payload: { userId: parsed.data.userId },\n        priority: 80,\n      }),\n    ];\n  },\n  {\n    id: 'validated-inbound-webhook',\n    path: 'validate/data',\n    verifier: 'memory',\n    description: 'Validates the body with zod, then enqueues create-user-settings.',\n    tags: ['webhook', 'validated'],\n  },\n);\n\nexport default validatedInboundWebhook;"
  },
  {
    label: "Call it — curl",
    lang: "bash",
    code: "# Triggers API runs on :8093. POST to the webhook's resolved path.\ncurl -X POST http://localhost:8093/api/v1/webhooks/inbound/generic \\\n  -H 'content-type: application/json' \\\n  -d '{\"verbose\": false}'\n\n# Watch the resulting ingress events:\ncurl 'http://localhost:8093/api/v1/events?limit=10'\n\n# The enqueued job lands on the workers plugin (:8091):\ncurl http://localhost:8091/api/v1/workers/executions?limit=10"
  }
] }) }}

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>The <code>'memory'</code> verifier is open.</strong> The scaffold sample accepts any
POST so you can iterate fast. Before exposing a webhook publicly, swap in a real verifier
(HMAC signature check) so only the intended sender can enqueue work.</li>
<li><strong>Return fast, work later.</strong> A handler should validate and <code>enqueueJob</code>,
not do the work inline — webhook senders time out and retry. Durable processing belongs on the
workers plugin.</li>
<li><strong>The job reference must exist.</strong> <code>enqueueJob</code> targets a job by id; if no
workers job with that id is registered, the enqueue resolves to nothing useful. Author the job in
<code>plugins/workers/jobs/</code> first.</li>
<li><strong>Don't reach for <code>defer</code>.</strong> It is defined-but-unsupported and throws +
routes to the DLQ. Schedule delayed work from the enqueued workers job instead.</li>
</ul>
{{ /comp }}

## How it wires to the rest of the app

This is the last rung of the continuous-app thread. The `generic-inbound-webhook`
enqueues the workers health-check job; the `create-user-settings` job (authored in
the [background jobs](/capabilities/background-jobs/) tutorial) publishes a
`UserSettingsCreated` saga message; the saga from the
[durable workflow](/capabilities/durable-sagas/) tutorial handles it. One inbound
POST drives the whole chain — and every link is real scaffold code that compiles.

## Learn / Do / Reference

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Ingest a webhook",
    body: "The tutorial rung: scaffold the triggers plugin, author a webhook, POST to :8093, and watch it enqueue a job — closing the continuous-app ladder.",
    href: "/tutorials/ingest-webhook/",
    icon: "→"
  },
  {
    title: "Do — Add a plugin",
    body: "The how-to recipe for `netscript plugin add trigger --samples`, which lands the canonical samples under plugins/triggers/.",
    href: "/how-to/add-a-plugin/",
    icon: "◆"
  },
  {
    title: "Reference — triggers API",
    body: "The full generated API surface for the triggers unit: builders, ingress ports, and the Hono router types.",
    href: "/reference/triggers/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }, next: { label: "Durable streams", href: "/capabilities/streams/" } }) }}
