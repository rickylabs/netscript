---
layout: layouts/base.vto
title: Triggers & ingress
templateEngine: [vento, md]
prev: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }
next: { label: "Durable streams", href: "/capabilities/streams/" }
---

# Triggers & ingress

The **triggers** plugin is NetScript's front door for the outside world. It turns
external events — inbound webhooks, files dropped on disk, and cron schedules —
into durable background work. A trigger handler does one job: receive an event and
return a list of *actions*. The canonical action is `enqueueJob(...)`, which hands
the payload to the [workers](/capabilities/background-jobs/) plugin so the heavy
lifting happens off the request path. The HTTP call returns immediately; the job
runs durably behind it.

{{ comp.diagram({
  src: "/assets/diagrams/trigger-ingress-flow.svg",
  alt: "Trigger ingress flow: a webhook POST is verified by an HMAC check, persisted as an event, and dispatched to the handler which returns an enqueueJob action; a file-watch event is debounced and stabilised before reaching the same handler path.",
  caption: "Two ingress edges, one processor: webhook POST → HMAC verify → event store → handler → enqueueJob; file-watch → debounce + stability → handler. Both converge on the trigger processor, which retries and DLQs."
}) }}

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

## What it is

A trigger is a **declarative event source** plus a handler. NetScript ships three
authorable trigger builders from `@netscript/plugin-triggers-core/builders` —
`defineWebhook` (inbound HTTP), `defineFileWatch` (filesystem events), and
`defineScheduledTrigger` (cron). All three return a frozen *definition* the runtime
walker discovers; all three share one handler contract — `(event, context) =>
Promise<TriggerActionResult[]>` — and one runtime processor that verifies, persists,
retries, and dead-letters. Three more kinds (`queue`, `stream`, `manual`) are reserved
in the type surface but not yet executable. The processing engine itself lives in
[`@netscript/watchers`](/reference/watchers/) (file watching) and the trigger
processor/ingress runtime (`@netscript/plugin-triggers-core/runtime`).

## Learn / Do

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Ingest a webhook",
    body: "Storefront Track A, rung 05: scaffold the triggers plugin, author a webhook, POST to :8093, and watch it enqueue a job — closing the continuous-app ladder.",
    href: "/tutorials/storefront/05-shipping-webhook/",
    icon: "→"
  },
  {
    title: "Do — Add a plugin",
    body: "The how-to recipe for public plugin package dispatch and the local netscript-dev contributor path that lands canonical trigger samples under plugins/triggers/.",
    href: "/how-to/add-a-plugin/",
    icon: "◆"
  }
] }) }}

## Minimal example — a verified payment webhook

The 80% case: a webhook that verifies an HMAC signature, then fans the inbound
payment event out to a single durable job. The handler returns immediately; the
real work runs on the [workers](/capabilities/background-jobs/) plugin.

```ts
// plugins/triggers/payment-status-webhook.ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

// The workers job this webhook will enqueue (authored in plugins/workers/jobs/).
const reconcilePaymentJob = {
  id: 'reconcile-payment' as JobDefinition<'reconcile-payment'>['id'],
  name: 'Reconcile Payment',
  topic: 'default',
} satisfies JobDefinition<'reconcile-payment'>;

// Inbound POST -> enqueue a workers job. Ingress verifies the HMAC signature
// (verifier: 'hmac-sha256' + secretEnv) BEFORE this handler ever runs, so by the
// time you see the event the sender is already proven.
export const paymentStatusWebhook = defineWebhook(
  (event) => Promise.resolve([
    enqueueJob(reconcilePaymentJob, {
      payload: { raw: event.payload.body },
      idempotencyKey: event.idempotencyKey, // de-dupe sender retries
      priority: 80,
    }),
  ]),
  {
    id: 'payment-status-webhook',
    path: 'payments/status',
    verifier: 'hmac-sha256',
    secretEnv: 'PAYMENT_WEBHOOK_SECRET',
    description: 'Verified payment-status webhook that enqueues reconciliation.',
    tags: ['webhook', 'payments', 'verified'],
  },
);

export default paymentStatusWebhook;
```

## Key types first — the webhook definition

`defineWebhook(handler, spec)` takes your handler and a static `WebhookSpec`. These
are the **actual** fields the builder accepts (confirmed via `deno doc`), shown
before any prose so you can read the contract at a glance.

{{ comp.apiTable({
  caption: "WebhookSpec — the second argument to defineWebhook(handler, spec)",
  rows: [
    { name: "id", type: "string (required)", desc: "Stable identifier for the webhook definition, e.g. 'payment-status-webhook'. Branded internally as a WebhookId." },
    { name: "path", type: "string (required)", desc: "Ingress sub-path the webhook answers on, e.g. 'payments/status'. Resolved as the :triggerId route segment under /api/v1/webhooks/." },
    { name: "verifier", type: "'hmac-sha256' | 'memory' | string (required)", desc: "Verification strategy selector (WebhookVerifierKind). 'hmac-sha256' performs a real signature check; 'memory' is open (dev only); a custom string selects a verifier you wire via selectVerifier." },
    { name: "secretEnv", type: "string?", desc: "Name of the env var holding the signing secret. The runtime reads it (resolveSecret) and hands it to the verifier — the secret is never inlined in the definition." },
    { name: "description", type: "string?", desc: "Human-readable summary surfaced by inspect/registry tooling." },
    { name: "tags", type: "readonly string[]?", desc: "Free-form labels for discovery/filtering, e.g. ['webhook','payments','verified']." },
    { name: "metadata", type: "Readonly<Record<string, unknown>>?", desc: "Arbitrary structured metadata attached to the definition." }
  ]
}) }}

The handler receives a `TriggerEvent<'webhook', WebhookTriggerPayload>`. The payload
carries the captured HTTP request: `body` (parsed/raw), `headers`, `method` (always
`"POST"`), `path`, and an optional `remoteAddr`. The event envelope also surfaces
`idempotencyKey`, `traceparent`/`tracestate`, and `requestHeaders` — so de-duplicating
sender retries is a one-liner, as in the example above.

## HMAC verification — proving the sender

`verifier: 'hmac-sha256'` activates the `HmacSha256WebhookVerifier` adapter from
`@netscript/plugin-triggers-core/adapters`. Ingress hashes the raw request body with
the secret (resolved from `secretEnv`) and compares it against the signature header
*before* persisting the event or running your handler — a bad signature is rejected at
the edge. The `'memory'` verifier (`MemoryWebhookVerifier`) accepts everything and is
for local iteration only.

{{ comp.apiTable({
  caption: "HmacSha256WebhookVerifier — constructor options (from @netscript/plugin-triggers-core/adapters)",
  rows: [
    { name: "secret", type: "string?", desc: "Signing secret. Usually supplied by the runtime from the definition's secretEnv rather than hard-coded here." },
    { name: "signatureHeader", type: "string?", desc: "Header carrying the sender's HMAC signature to compare against (e.g. 'x-signature')." },
    { name: "idempotencyHeader", type: "string?", desc: "Header whose value is surfaced as the event idempotencyKey when present, so sender retries collapse." }
  ]
}) }}

{{ comp callout { type: "note", title: "How the verifier is wired" } }}
You rarely construct the adapter yourself. The webhook spec declares
<code>verifier: 'hmac-sha256'</code> and <code>secretEnv</code>, and the ingress runtime
(<code>createTriggerIngress</code>) resolves the secret and selects the verifier per
definition (its <code>verifier</code>, <code>selectVerifier</code>, and
<code>resolveSecret</code> options). The verifier's <code>verify(request)</code> returns
<code>{ ok, idempotencyKey?, reason? }</code> — <code>ok: false</code> stops the event at the edge.
{{ /comp }}

## File-watch triggers — react to dropped files

`defineFileWatch(handler, spec)` turns filesystem events into the same durable-work
pipeline. The watching primitive lives in [`@netscript/watchers`](/reference/watchers/);
the trigger builder wraps it so a dropped file becomes a handler invocation that
returns `enqueueJob` actions. Below: a CSV drop-folder that enqueues one import job per
stable file.

```ts
// plugins/triggers/product-import.ts
import { defineFileWatch, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const importProductsJob = {
  id: 'import-products' as JobDefinition<'import-products'>['id'],
  name: 'Import Products',
  topic: 'default',
} satisfies JobDefinition<'import-products'>;

// Fires once a *.csv lands in ./incoming/products and stops growing. The
// stabilityThreshold guards against half-written files on a network share:
// the watcher waits for 3 unchanged checks 1s apart before yielding the event.
export const productImportWatch = defineFileWatch(
  (event) => Promise.resolve([
    enqueueJob(importProductsJob, {
      payload: { file: event.payload.path },
      idempotencyKey: event.payload.path, // one import per file path
      priority: 50,
    }),
  ]),
  {
    id: 'product-import-watch',
    paths: ['./incoming/products'],
    patterns: ['*.csv'],
    on: ['create', 'modify'],
    stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
    description: 'Imports a product CSV the moment it lands and stabilises.',
    tags: ['file-watch', 'erp', 'import'],
  },
);

export default productImportWatch;
```

{{ comp.apiTable({
  caption: "FileWatchSpec — the second argument to defineFileWatch(handler, spec)",
  rows: [
    { name: "id", type: "string (required)", desc: "Stable identifier for the file-watch definition." },
    { name: "paths", type: "readonly string[] (required)", desc: "Directories to watch (at least one). Relative paths resolve against the process cwd." },
    { name: "patterns", type: "readonly string[] (required)", desc: "Glob patterns selecting which filenames fire, e.g. ['*.csv','sales_*.xlsx']." },
    { name: "on", type: "readonly ('create'|'modify'|'remove')[] (required)", desc: "Which filesystem lifecycle events yield to the handler (FileWatchLifecycle)." },
    { name: "ignored", type: "readonly string[]?", desc: "Glob patterns to exclude from the watch." },
    { name: "debounceMs", type: "number?", desc: "Per-file debounce window collapsing rapid successive events for the same path." },
    { name: "stabilityThreshold", type: "{ checkIntervalMs, stableChecks }?", desc: "Network-FS tolerant gate: waits for stableChecks unchanged polls (checkIntervalMs apart) so half-written files don't fire early." },
    { name: "description", type: "string?", desc: "Human-readable summary for tooling." },
    { name: "tags", type: "readonly string[]?", desc: "Free-form discovery labels." },
    { name: "metadata", type: "Readonly<Record<string, unknown>>?", desc: "Arbitrary structured metadata." }
  ]
}) }}

The handler receives a `TriggerEvent<'file-watch', FileWatchTriggerPayload>`; the
payload carries `path`, `kind` (the lifecycle event), and — when the watcher could read
them — `size`, `modifiedAt`, and `stableChecks`.

### The underlying watcher

For lower-level or standalone file watching (outside the trigger pipeline), call
`createWatcher(options)` from `@netscript/watchers` directly. It returns a `FileWatcher`
whose `watch()` is an async generator of `WatchEvent`s.

```ts
// scripts/watch-incoming.ts
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

{{ comp.apiTable({
  caption: "createWatcher(options) — WatcherOptions (from @netscript/watchers)",
  rows: [
    { name: "paths", type: "readonly string[] (required)", desc: "Directories to watch (at least one required)." },
    { name: "patterns", type: "readonly string[]?", desc: "Glob patterns for filtering files. Default ['*']." },
    { name: "events", type: "readonly EventKind[]?", desc: "Which FS events to yield ('create'|'modify'|'remove'). Default ['create']." },
    { name: "debounceMs", type: "number?", desc: "Per-file debounce in milliseconds. Default 2000." },
    { name: "contentHash", type: "boolean?", desc: "Compute a SHA-256 content hash for de-duplication. Default true." },
    { name: "processExisting", type: "boolean?", desc: "Scan existing files on startup and emit them as create events. Default false." },
    { name: "forcePolling", type: "boolean?", desc: "Force the polling strategy instead of native FS notifications. Default false (use for network paths)." },
    { name: "pollIntervalMs", type: "number?", desc: "Polling interval for the polling strategy. Minimum 500. Default 5000." },
    { name: "minFileSize", type: "number?", desc: "Skip files smaller than this many bytes. Default 0." },
    { name: "maxFileAge", type: "number?", desc: "Skip files older than this (ms); only applies during the startup scan." },
    { name: "stabilityThreshold", type: "StabilityOptions?", desc: "When set, waits for files to stop growing before yielding (network-FS tolerant)." },
    { name: "signal", type: "AbortSignal?", desc: "Abort signal for graceful shutdown of the watch loop." }
  ]
}) }}

The watcher selects the strategy for you: native OS notifications for local paths,
polling for network paths or when `forcePolling: true`, and a `HybridStrategy` that
blends both. Events pass a filter pipeline before you see them — `GlobFilter` limits
filenames, `StabilityFilter` waits for files to stop growing, and `DedupFilter` skips
repeated content hashes within its window. The concrete `NativeStrategy`,
`PollingStrategy`, and `HybridStrategy` classes are internal; construct watchers with
`createWatcher` or `new FileWatcher(...)`.

## Scheduled triggers — cron without a daemon

`defineScheduledTrigger(handler, spec)` fires a handler on a cron schedule. The spec
combines discovery metadata (`id`, `description`, `tags`, `metadata`) with the cron
`ScheduledTriggerSpec`. The scheduler runs inside the trigger processor entrypoint, not
the Hono API service.

```ts
// plugins/triggers/nightly-reconcile.ts
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const nightlyReconcileJob = {
  id: 'nightly-reconcile' as JobDefinition<'nightly-reconcile'>['id'],
  name: 'Nightly Reconcile',
  topic: 'default',
} satisfies JobDefinition<'nightly-reconcile'>;

// Runs at 02:00 UTC. backfill replays fires the scheduler missed while down.
export const nightlyReconcile = defineScheduledTrigger(
  () => Promise.resolve([enqueueJob(nightlyReconcileJob, { payload: {} })]),
  {
    id: 'nightly-reconcile',
    description: 'Nightly reconciliation sweep.',
    cron: '0 2 * * *',
    timezone: 'UTC',
    persistent: true,
    backfill: { enabled: true, windowMs: 86_400_000, policy: 'fire-once' },
  },
);

export default nightlyReconcile;
```

{{ comp.apiTable({
  caption: "Scheduled trigger spec — DefineScheduledTriggerSpec + ScheduledTriggerSpec",
  rows: [
    { name: "id", type: "string (required)", desc: "Stable identifier for the scheduled trigger definition." },
    { name: "cron", type: "CronExpression (required)", desc: "Cron expression governing when the handler fires, e.g. '0 2 * * *'." },
    { name: "timezone", type: "string?", desc: "IANA timezone the cron expression is evaluated in. Defaults to the runtime's zone." },
    { name: "persistent", type: "boolean?", desc: "Whether the schedule state survives restarts so missed fires can be reasoned about." },
    { name: "backfill", type: "TriggerBackfillSpec?", desc: "Quartz-style misfire handling: { enabled, windowMs, policy: 'fire-now'|'fire-once'|'do-nothing', maxMissedFires? } — replays fires the scheduler missed while down." },
    { name: "description", type: "string?", desc: "Human-readable summary for tooling." },
    { name: "tags", type: "readonly string[]?", desc: "Free-form discovery labels." },
    { name: "metadata", type: "Readonly<Record<string, unknown>>?", desc: "Arbitrary structured metadata." }
  ]
}) }}

## Supported trigger actions

Every trigger handler returns **actions** — declarative descriptions of what should
happen after the event is accepted. The runtime processor reads each action and
dispatches it. Exactly one action is wired end-to-end today; a second is *defined in the
type surface* but not executable, and it now **fails loud** rather than silently dropping.

{{ comp.apiTable({
  caption: "Trigger actions — what the runtime processor actually does",
  rows: [
    { name: "enqueueJob(job, opts)", type: "✅ live", desc: "Hands the payload to the workers plugin. The supported, end-to-end path — it closes the continuous-app loop (event → job → saga). opts: { payload?, idempotencyKey?, concurrencyKey?, priority? }." },
    { name: "defer(...)", type: "⛔ unsupported", desc: "Defined in the action union (DeferAction) but NOT executable. The processor throws an unsupportedOperation error and routes the message to the dead-letter queue (DLQ). There is no deferred replay — do not author a trigger that relies on defer." }
  ]
}) }}

{{ comp callout { type: "warning", title: "defer is defined-but-unsupported — it fails loud" } }}
The <code>defer</code> action exists in the trigger action union, but the runtime processor does
<strong>not</strong> implement deferred replay. When a handler emits a <code>defer</code> action, the
processor throws an <code>unsupportedOperation</code> error and routes the message to the
<strong>dead-letter queue (DLQ)</strong> — it does not silently swallow it. Build ingress flows on
<code>enqueueJob</code> only; if you need delayed work, schedule it on the
<a href="/capabilities/background-jobs/">workers</a> plugin from the enqueued job, or use a
<code>defineScheduledTrigger</code> cron rather than deferring at the trigger edge.
<!-- caveat: arch-debt:triggers-defer-unsupported -->
{{ /comp }}

## Runtime — ingress, processor, retry

The trigger runtime (`@netscript/plugin-triggers-core/runtime`) assembles the pieces
the API service and background processor use. You configure these when wiring a custom
host; the scaffold wires them for you.

{{ comp.apiTable({
  caption: "Trigger runtime entry points (from @netscript/plugin-triggers-core/runtime)",
  rows: [
    { name: "createTriggerIngress(options)", type: "→ TriggerIngressPort", desc: "Builds the webhook ingress edge. Options: { definitions, eventStore, processor, verifier, selectVerifier?, resolveSecret?, logger?, now?, createEventId? }. Verifies + persists, then hands off to the processor; responds 202 Accepted." },
    { name: "createTriggerProcessor(options)", type: "→ TriggerProcessor", desc: "Builds the processor that runs handlers and dispatches actions. Options: { idempotency, dlq, dispatchAction?, logger?, now?, random? }. Applies the retry policy and routes exhausted/unsupported events to the DLQ." },
    { name: "defaultRetryPolicy()", type: "→ TriggerRetryPolicy", desc: "The default { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, jitter } policy applied before DLQ handoff. Override per definition via the trigger's retry field." }
  ]
}) }}

{{ comp callout { type: "note", title: "Where the background work runs" } }}
The triggers API service (port <code>8093</code>) is the HTTP edge — it hosts
<code>createTriggerIngress</code> behind a raw Hono router. The actual trigger
processing — cron, file-watch, and DLQ handling — runs in a separate background
processor entrypoint at <code>plugins/triggers/src/runtime/trigger-processor.ts</code>. Aspire wires
both as resources (<code>triggers-api</code> and <code>trigger-processor</code>) when you <code>aspire start</code>.
{{ /comp }}

## Endpoints & port

The triggers API service runs on **`:8093`**. The webhook router resolves the inbound
`:triggerId` segment against your registered `defineWebhook` definitions — so a
definition with `path: 'payments/status'` is reachable at
`POST :8093/api/v1/webhooks/payments/status`.

{{ comp.apiTable({
  caption: "Triggers API — runtime surface (port 8093, Hono)",
  rows: [
    { name: "POST /api/v1/webhooks/:triggerId", type: "Hono route", desc: "Generic dispatch — :triggerId matches the path of any registered defineWebhook definition. Verifies, persists, responds 202 Accepted." },
    { name: "POST /api/v1/webhooks/inbound/generic", type: "Hono route", desc: "The scaffold's generic inbound webhook. Posting JSON here resolves trigger id 'inbound/generic' and runs its actions." },
    { name: "GET /api/v1/events?limit=10", type: "Hono route", desc: "Recent ingress events recorded by the event store." },
    { name: "GET /health", type: "Hono route", desc: "Liveness check for the triggers API service." }
  ]
}) }}

## Author + call a trigger

The simple case is one webhook that fans an inbound request out to a single job. The
advanced case validates the payload first, then enqueues. The simple case is adapted
from the scaffold's `plugins/triggers/generic-webhook.ts` sample and compiles as-is; the
advanced tab is an illustrative pattern, not scaffold code — the real
`plugins/triggers/webhook-validate-data.ts` is an accept-and-drop sample
(`() => Promise.resolve([])`) that imports no zod and enqueues no job. Every handler
returns an array of `enqueueJob` actions — the only supported trigger action.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — generic-webhook.ts",
    lang: "ts",
    code: "// plugins/triggers/generic-webhook.ts\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\n\n// A reference to the workers job this webhook will enqueue.\nconst healthCheckJob = {\n  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],\n  name: 'Workers Health Check',\n  topic: 'default',\n} satisfies JobDefinition<'workers-plugin-health-check'>;\n\n// Inbound POST -> enqueue a workers job. The HTTP call returns immediately;\n// the job runs durably on the workers plugin (:8091).\nexport const genericInboundWebhook = defineWebhook(\n  () => Promise.resolve([\n    enqueueJob(healthCheckJob, { payload: { verbose: false }, priority: 50 }),\n  ]),\n  {\n    id: 'generic-inbound-webhook',\n    path: 'inbound/generic',\n    verifier: 'memory',\n    description: 'Open webhook that enqueues the workers plugin health-check job.',\n    tags: ['webhook', 'runtime-task', 'health-check'],\n  },\n);\n\nexport default genericInboundWebhook;"
  },
  {
    label: "Advanced — validate + enqueue",
    lang: "ts",
    code: "// plugins/triggers/webhook-validate-data.ts (pattern)\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\n// Validate the inbound body before doing any work.\nconst InboundSchema = z.object({\n  userId: z.string().min(1),\n  source: z.string().default('webhook'),\n});\n\nconst createUserSettingsJob = {\n  id: 'create-user-settings' as JobDefinition<'create-user-settings'>['id'],\n  name: 'Create User Settings',\n  topic: 'default',\n} satisfies JobDefinition<'create-user-settings'>;\n\nexport const validatedInboundWebhook = defineWebhook(\n  (event) => {\n    // Parse + validate. On a bad shape, accept-and-drop (return []),\n    // or throw to reject the request.\n    const parsed = InboundSchema.safeParse(event.payload.body ?? {});\n    if (!parsed.success) return Promise.resolve([]);\n\n    // Hand the validated payload to a workers job.\n    return Promise.resolve([\n      enqueueJob(createUserSettingsJob, {\n        payload: { userId: parsed.data.userId },\n        priority: 80,\n      }),\n    ]);\n  },\n  {\n    id: 'validated-inbound-webhook',\n    path: 'validate/data',\n    verifier: 'memory',\n    description: 'Validates the body with zod, then enqueues create-user-settings.',\n    tags: ['webhook', 'validated'],\n  },\n);\n\nexport default validatedInboundWebhook;"
  },
  {
    label: "Call it — curl",
    lang: "bash",
    code: "# Triggers API runs on :8093. POST to the webhook's resolved path.\ncurl -X POST http://localhost:8093/api/v1/webhooks/inbound/generic \\\n  -H 'content-type: application/json' \\\n  -d '{\"verbose\": false}'\n\n# Watch the resulting ingress events:\ncurl 'http://localhost:8093/api/v1/events?limit=10'\n\n# The enqueued job lands on the workers plugin (:8091):\ncurl http://localhost:8091/api/v1/workers/executions?limit=10"
  }
] }) }}

## How it wires to the rest of the app

This is the last rung of the continuous-app thread. The `generic-inbound-webhook`
enqueues the workers health-check job; the `create-user-settings` job (authored in the
[background jobs](/capabilities/background-jobs/) tutorial) publishes a
`UserSettingsCreated` saga message; the saga from the
[durable workflow](/capabilities/durable-sagas/) tutorial handles it. One inbound POST
drives the whole chain — and every link is real scaffold code that compiles.

## Production notes

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>Never ship the <code>'memory'</code> verifier publicly.</strong> It accepts any POST so
you can iterate fast. Before exposing a webhook, set <code>verifier: 'hmac-sha256'</code> and a
<code>secretEnv</code> so only a sender holding the secret can enqueue work.</li>
<li><strong>The signing secret lives in env, not the definition.</strong> <code>secretEnv</code>
names the env var; the runtime resolves it (<code>resolveSecret</code>) at ingress. Keep the secret
out of source and out of the definition object.</li>
<li><strong>Return fast, work later.</strong> A handler should verify, validate, and
<code>enqueueJob</code> — not do the work inline. Webhook senders time out and retry; durable
processing belongs on the workers plugin.</li>
<li><strong>De-dupe sender retries.</strong> Pass <code>idempotencyKey</code> (the event's key, or a
stable field) to <code>enqueueJob</code> so a retried POST collapses to one job.</li>
<li><strong>File watches need stability on network shares.</strong> Set
<code>stabilityThreshold</code> so a half-written CSV does not fire mid-copy; use
<code>forcePolling</code> on the underlying watcher for network filesystems that miss native events.</li>
<li><strong>Do not reach for <code>defer</code>.</strong> It is defined-but-unsupported, throws, and
routes to the DLQ. Schedule delayed work from the enqueued workers job, or use a
<code>defineScheduledTrigger</code> instead.</li>
</ul>
{{ /comp }}

## Reference

{{ comp.xref({ key: "ref:triggers" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — triggers core reference",
    body: "The full generated API surface for the triggers unit: builders (defineWebhook / defineFileWatch / defineScheduledTrigger), runtime (ingress + processor), adapters (HMAC verifier), and the Hono router types.",
    href: "/reference/triggers/",
    icon: "≡"
  },
  {
    title: "Look up — watchers reference",
    body: "createWatcher, FileWatcher, strategies (native/polling/hybrid), and the GlobFilter / StabilityFilter / DedupFilter pipeline.",
    href: "/reference/watchers/",
    icon: "≡"
  },
  {
    title: "Do — Background jobs",
    body: "Where the enqueued work runs: defineJobHandler, worker runtimes, and the enqueue path triggers hand off to.",
    href: "/capabilities/background-jobs/",
    icon: "◆"
  },
  {
    title: "Understand — Durable sagas",
    body: "The next link in the chain: how an enqueued job's saga message advances a durable workflow.",
    href: "/capabilities/durable-sagas/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }, next: { label: "Durable streams", href: "/capabilities/streams/" } }) }}
