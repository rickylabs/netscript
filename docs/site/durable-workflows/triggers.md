---
layout: layouts/base.vto
title: Event triggers
templateEngine: [vento, md]
order: 2
---

# Event triggers

This page covers the **triggers** plugin, which turns inbound webhooks, files dropped on disk, and
cron schedules into durable background work. A trigger handler receives an event and returns a list
of *actions*. The usual action is `enqueueJob(...)`, which hands the payload to the
[workers](/background-processing/workers/) plugin. The HTTP call returns immediately, and the job
runs durably behind it.

{{ comp.diagram({
  src: "/assets/diagrams/trigger-ingress-flow.svg",
  alt: "Trigger ingress flow: a webhook POST is verified by an HMAC check, persisted as an event, and dispatched to the handler which returns an enqueueJob action; a file-watch event is debounced and stabilised before reaching the same handler path.",
  caption: "Two ingress edges, one processor: webhook POST → HMAC verify → event store → handler → enqueueJob; file-watch → debounce + stability → handler. Both converge on the trigger processor, which retries and DLQs."
}) }}

Ingress has to absorb two common failures. A payment provider retries the same webhook five times
because your handler took too long, or a half-written CSV fires an import mid-copy on a network
share. `idempotencyKey` collapses sender retries, and `stabilityThreshold` waits out the
half-written file.

## What it is

A trigger is a declarative event source plus a handler. `@netscript/plugin-triggers-core/builders`
ships three builders: `defineWebhook` (inbound HTTP), `defineFileWatch` (filesystem events), and
`defineScheduledTrigger` (cron). Each returns a frozen *definition* that the runtime walker
discovers. All three share one handler contract, `(event, context) =>
Promise<TriggerActionResult[]>`, and one runtime processor that verifies, persists, retries, and
dead-letters. Three more kinds (`queue`, `stream`, `manual`) are reserved in the type surface but
not yet executable. File watching runs on [`@netscript/watchers`](/reference/watchers/); ingress
and processing run on `@netscript/plugin-triggers-core/runtime`. Add the plugin with
[Add a plugin](/orchestration-runtime/how-to/add-a-plugin/).

{{ comp callout { type: "important", title: "Webhook ingress is a raw route" } }}
Like <a href="/services-sdk/services/">services</a>, <a href="/background-processing/workers/">workers</a> and <a href="/durable-workflows/sagas/">sagas</a>, the triggers API serves a <strong>typed v1 oRPC contract</strong> to describe triggers, list and fetch triggers and events, fire a trigger, test a webhook, preview a schedule, enable or disable a trigger, and subscribe to an SSE event stream. The <strong>webhook ingress endpoint</strong> (<code>POST /api/v1/webhooks/:triggerId</code>, plus a legacy <code>GET /api/v1/events</code>) is the exception: it is a raw, signature-verifying route, because it verifies an HMAC over the raw request bytes, which oRPC's Zod body parsing does not allow. Any third-party sender can POST to the plain URL without a NetScript client.
{{ /comp }}

## Minimal example — a verified payment webhook

This webhook verifies an HMAC signature, then hands the payment event to one durable job. The
handler returns immediately; the work runs on the [workers](/background-processing/workers/)
plugin.

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

## The webhook definition

`defineWebhook(handler, spec)` takes your handler and a static `WebhookSpec` with these fields:

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

`retry` belongs to the returned definition, not this builder spec. See
[per-trigger retry policy](#per-trigger-retry-policy) for the supported override and discovery limit.

The handler receives a `TriggerEvent<'webhook', WebhookTriggerPayload>`. The payload carries the
captured HTTP request: `body` (parsed/raw), `headers`, `method` (always `"POST"`), `path`, and an
optional `remoteAddr`. The event envelope also carries `idempotencyKey`,
`traceparent`/`tracestate`, and `requestHeaders`, so the example above de-duplicates sender retries
in one line.

## HMAC verification

`verifier: 'hmac-sha256'` activates the `HmacSha256WebhookVerifier` adapter from
`@netscript/plugin-triggers-core/adapters`. Ingress hashes the raw request body with the secret
resolved from `secretEnv`, and compares the result with the signature header *before* it persists
the event or runs your handler, so a bad signature is rejected at the edge. The `'memory'` verifier
(`MemoryWebhookVerifier`) accepts everything and is for local iteration only.

{{ comp.apiTable({
  caption: "HmacSha256WebhookVerifier — constructor options (from @netscript/plugin-triggers-core/adapters)",
  rows: [
    { name: "secret", type: "string?", desc: "Signing secret. Usually supplied by the runtime from the definition's secretEnv rather than hard-coded here." },
    { name: "signatureHeader", type: "string?", desc: "Header carrying the sender's HMAC signature to compare against (e.g. 'x-signature')." },
    { name: "idempotencyHeader", type: "string?", desc: "Header whose value is surfaced as the event idempotencyKey when present, so sender retries collapse." }
  ]
}) }}

You rarely construct the adapter yourself. The webhook spec declares `verifier: 'hmac-sha256'` and
`secretEnv`, and the ingress runtime (`createTriggerIngress`) resolves the secret and selects the
verifier per definition through its `verifier`, `selectVerifier`, and `resolveSecret` options. The
verifier's `verify(request)` returns `{ ok, idempotencyKey?, reason? }`; `ok: false` stops the
event at the edge.

## File-watch triggers

`defineFileWatch(handler, spec)` feeds filesystem events into the same durable-work pipeline. It
wraps the watching primitive from [`@netscript/watchers`](/reference/watchers/), so a dropped file
becomes a handler call that returns `enqueueJob` actions. This drop folder enqueues one import job
per stable CSV file:

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

`retry` belongs to the returned definition, not this builder spec. See
[per-trigger retry policy](#per-trigger-retry-policy) for the supported override and discovery limit.

The handler receives a `TriggerEvent<'file-watch', FileWatchTriggerPayload>`. The payload carries
`path`, `kind` (the lifecycle event), and, when the watcher could read them, `size`, `modifiedAt`,
and `stableChecks`.

File-watch triggers default to **in-flight deduplication**: their completed deduplication TTL is
`0`, rather than the 24-hour default for webhook and scheduled triggers. Concurrent observations
of the same change share an active claim, so only one handler runs. Once processing completes,
another observation is eligible again, even if its metadata is unchanged.

When both modification time and size are available, the adapter sets `event.idempotencyKey` to a
bounded SHA-256 identity of `(triggerId, path, kind, modifiedAt, size)`. A different path, lifecycle
kind, modification time, size, or trigger gets a different key. When either metadata field is
missing, each observation gets a UUID key; identical payloads cannot establish that two changes
are duplicates. Callback timestamps and process-local event counters are not change identities.
An explicit `deduplication.ttlMs` on a composed `FileWatchDefinition` overrides the default;
`deduplication.key(event)` retains precedence over the adapter key.

The CSV example deliberately sets the worker action's key to the path for one import per file
path within the worker's deduplication window. To enqueue work for each distinct change, use
`event.idempotencyKey`, or omit the action key to inherit it. Worker deduplication and the
underlying watcher's debounce, stability, and content-hash filters have their own policies.

### The underlying watcher

For standalone file watching outside the trigger pipeline, call `createWatcher(options)` from
`@netscript/watchers`. It returns a `FileWatcher` whose `watch()` is an async generator of
`WatchEvent`s.

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
    { name: "debounceMs", type: "number?", desc: "Per-file debounce in milliseconds. Default 0 (disabled)." },
    { name: "contentHash", type: "boolean?", desc: "Compute a SHA-256 content hash for de-duplication. Default true." },
    { name: "processExisting", type: "boolean?", desc: "Scan existing files on startup and emit them as create events. Default false." },
    { name: "forcePolling", type: "boolean?", desc: "Force the polling strategy instead of native FS notifications. Default false (use for network paths)." },
    { name: "pollIntervalMs", type: "number?", desc: "Polling interval for the polling strategy. Minimum 500. Default 5000." },
    { name: "minFileSize", type: "number?", desc: "Skip files smaller than this many bytes. Default 0." },
    { name: "maxFileAge", type: "number?", desc: "Skip files older than this (ms); only applies during the startup scan when processExisting is true." },
    { name: "stabilityThreshold", type: "StabilityOptions?", desc: "When set, waits for files to stop growing before yielding (network-FS tolerant)." },
    { name: "signal", type: "AbortSignal?", desc: "Abort signal for graceful shutdown of the watch loop." }
  ]
}) }}

The watcher picks a strategy: native OS notifications for local paths, polling for network paths or
when `forcePolling: true`, and a `HybridStrategy` that blends both. Events then pass a filter
pipeline:

| Filter | Effect |
| --- | --- |
| `GlobFilter` | Limits events to matching filenames. |
| `DebounceFilter` | Collapses rapid bursts of events per path. |
| `StabilityFilter` | Waits for files to stop growing. |
| `DedupFilter` | Skips repeated content hashes within its window. |

The `NativeStrategy`, `PollingStrategy`, and `HybridStrategy` classes are internal. Construct
watchers with `createWatcher` or `new FileWatcher(...)`.

## Scheduled triggers — cron without a daemon

`defineScheduledTrigger(handler, spec)` fires a handler on a cron schedule. The spec combines
discovery metadata (`id`, `description`, `tags`, `metadata`) with the cron `ScheduledTriggerSpec`.
The scheduler runs inside the trigger processor entrypoint, not the Hono API service.

```ts
// plugins/triggers/nightly-reconcile.ts
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const nightlyReconcileJob = {
  id: 'nightly-reconcile' as JobDefinition<'nightly-reconcile'>['id'],
  name: 'Nightly Reconcile',
  topic: 'default',
} satisfies JobDefinition<'nightly-reconcile'>;

// Runs at 02:00 UTC while the trigger runtime is active.
export const nightlyReconcile = defineScheduledTrigger(
  () => Promise.resolve([enqueueJob(nightlyReconcileJob, { payload: {} })]),
  {
    id: 'nightly-reconcile',
    description: 'Nightly reconciliation sweep.',
    cron: '0 2 * * *',
    timezone: 'UTC',
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
    { name: "description", type: "string?", desc: "Human-readable summary for tooling." },
    { name: "tags", type: "readonly string[]?", desc: "Free-form discovery labels." },
    { name: "metadata", type: "Readonly<Record<string, unknown>>?", desc: "Arbitrary structured metadata." }
  ]
}) }}

`DefineScheduledTriggerSpec` likewise does not accept `retry`. Use the same
[definition-level retry override](#per-trigger-retry-policy) as webhook and file-watch triggers.

## Per-trigger retry policy

The processor reads `TriggerDefinition.retry`, a full `TriggerRetryPolicy`; if it is absent, it
uses `defaultRetryPolicy()`. The three builder specs (`WebhookSpec`, `FileWatchSpec`, and
`DefineScheduledTriggerSpec`) currently expose no `retry` input and do not copy one into their
results. Adding it to a builder's second argument is not a supported override.

Keep the builder result private and export only the configured definition. All five required
policy fields are explicit because a definition policy replaces the default; it is not merged:

```ts
// triggers/retrying-webhook.ts
import { defineWebhook } from '@netscript/plugin-triggers-core/builders';
import type { TriggerRetryPolicy } from '@netscript/plugin-triggers-core/domain';

const retryPolicy = Object.freeze({
  maxAttempts: 4,
  initialDelayMs: 250,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
}) satisfies TriggerRetryPolicy;

const base = defineWebhook(
  () => Promise.resolve([]), // Replace with the handler that enqueues your work.
  { id: 'retrying-webhook', path: 'retrying', verifier: 'memory' },
);

// Export one definition per id; exporting base as well could overwrite this policy.
export default Object.freeze({ ...base, retry: retryPolicy }) satisfies typeof base;
```

The `'memory'` verifier is only for local development; use HMAC verification for external callers.
Put the module directly in `triggers/` and run `netscript generate plugins` to refresh the runtime
registry. That registry loads the default export, so the override reaches the processor. Static
contribution discovery recognizes direct exported builder calls and does not list this wrapped
export in its contribution counts. A manual barrel fallback must explicitly re-export a default
as a named export (`export { default as retryingWebhook } from './retrying-webhook.ts'`);
`export *` omits defaults. The generated runtime registry is the normal path.

## Supported trigger actions

Every trigger handler returns **actions** that describe what happens after the event is accepted.
The runtime processor reads and dispatches each one. Jobs enqueue immediately; deferred events are
persisted and replayed when their due time arrives.

{{ comp.apiTable({
  caption: "Trigger actions — what the runtime processor actually does",
  rows: [
    { name: "enqueueJob(job, opts)", type: "live", desc: "Hands the payload to the workers plugin, which continues the event → job → saga chain. opts: { payload?, idempotencyKey?, concurrencyKey?, priority? }." },
    { name: "defer({ until })", type: "live", desc: "Persists the processed event for one-shot replay at or after the ISO timestamp. Pending records survive runtime restarts; successful replay removes the record." }
  ]
}) }}

Deferred replay is durable and at-least-once. The runtime persists the event before it reports
`deferred`, resolves the current trigger definition after a restart, and deletes the record only
after a successful replay. Keep handlers idempotent: a crash after dispatch but before record
deletion replays the event again. Use `defer` for one-shot replay and a `defineScheduledTrigger`
cron for recurring work.

## Runtime — ingress, processor, retry

The trigger runtime (`@netscript/plugin-triggers-core/runtime`) assembles the pieces that the API
service and background processor use. The scaffold wires them; you configure them only when you
wire a custom host.

{{ comp.apiTable({
  caption: "Trigger runtime entry points (from @netscript/plugin-triggers-core/runtime)",
  rows: [
    { name: "createTriggerIngress(options)", type: "→ TriggerIngressPort", desc: "Builds the webhook ingress edge. Options: { definitions, eventStore, processor, verifier, selectVerifier?, resolveSecret?, logger?, now?, createEventId? }. Verifies + persists, then hands off to the processor; responds 202 Accepted." },
    { name: "createTriggerProcessor(options)", type: "→ TriggerProcessor", desc: "Builds the processor that runs handlers and dispatches actions. Options: { idempotency, dlq, dispatchAction?, logger?, now?, random? }. Applies the retry policy and routes exhausted/unsupported events to the DLQ." },
    { name: "defaultRetryPolicy()", type: "→ TriggerRetryPolicy", desc: "The default { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, jitter } policy applied before DLQ handoff. Override per definition via the trigger's retry field." }
  ]
}) }}

The triggers API service exposes a typed oRPC management contract and hosts `createTriggerIngress` behind a raw Hono
router. Cron, file-watch, and DLQ processing run in a separate background processor entrypoint,
`plugins/triggers/src/runtime/trigger-processor.ts`. `aspire start` runs both as resources,
`triggers-api` and `trigger-processor`.

## Endpoints

The triggers API service runs on its assigned port. The webhook router resolves the inbound
`:triggerId` segment against your registered `defineWebhook` definitions, so a definition with
`path: 'payments/status'` answers at `POST /api/v1/webhooks/payments/status`.

{{ comp.apiTable({
  caption: "Triggers API — runtime surface (Hono, on its assigned port)",
  rows: [
    { name: "POST /api/v1/webhooks/:triggerId", type: "Hono route", desc: "Generic dispatch — :triggerId matches the path of any registered defineWebhook definition. Verifies, persists, responds 202 Accepted." },
    { name: "POST /api/v1/webhooks/inbound/generic", type: "Hono route", desc: "The scaffold's generic inbound webhook. Posting JSON here resolves trigger id 'inbound/generic' and runs its actions." },
    { name: "GET /api/v1/events?limit=10", type: "Hono route", desc: "Recent ingress events recorded by the event store." },
    { name: "GET /health", type: "Hono route", desc: "Liveness check for the triggers API service." }
  ]
}) }}

## Author and call a trigger

The simple tab sends an inbound request to one job; it is adapted from the scaffold's
`plugins/triggers/generic-webhook.ts` sample and compiles as-is. The advanced tab validates the
payload first, then enqueues. It is an illustrative pattern, not scaffold code: the real
`plugins/triggers/webhook-validate-data.ts` is an accept-and-drop sample
(`() => Promise.resolve([])`) that imports no zod and enqueues no job.

{{ comp callout { type: "note", title: "Install ns-workers once" } }}
<code>ns-workers</code> is a name <em>you</em> give the workers plugin's CLI; the scaffold does not create it. Install it once, globally, and the <code>ns-workers</code> command below works as written:
<pre><code class="language-bash">deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli</code></pre>
Without the install, run <code>deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli &lt;verb …&gt;</code> in place of <code>ns-workers &lt;verb …&gt;</code>.
{{ /comp }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — generic-webhook.ts",
    lang: "ts",
    code: "// plugins/triggers/generic-webhook.ts\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\n\n// A reference to the workers job this webhook will enqueue.\nconst healthCheckJob = {\n  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],\n  name: 'Workers Health Check',\n  topic: 'default',\n} satisfies JobDefinition<'workers-plugin-health-check'>;\n\n// Inbound POST -> enqueue a workers job. The HTTP call returns immediately;\n// the job runs durably on the workers plugin (assigned port).\nexport const genericInboundWebhook = defineWebhook(\n  () => Promise.resolve([\n    enqueueJob(healthCheckJob, { payload: { verbose: false }, priority: 50 }),\n  ]),\n  {\n    id: 'generic-inbound-webhook',\n    path: 'inbound/generic',\n    verifier: 'memory',\n    description: 'Open webhook that enqueues the workers plugin health-check job.',\n    tags: ['webhook', 'runtime-task', 'health-check'],\n  },\n);\n\nexport default genericInboundWebhook;"
  },
  {
    label: "Advanced — validate + enqueue",
    lang: "ts",
    code: "// plugins/triggers/webhook-validate-data.ts (pattern)\nimport { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\nimport type { JobDefinition } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\n// Validate the inbound body before doing any work.\nconst InboundSchema = z.object({\n  userId: z.string().min(1),\n  source: z.string().default('webhook'),\n});\n\nconst createUserSettingsJob = {\n  id: 'create-user-settings' as JobDefinition<'create-user-settings'>['id'],\n  name: 'Create User Settings',\n  topic: 'default',\n} satisfies JobDefinition<'create-user-settings'>;\n\nexport const validatedInboundWebhook = defineWebhook(\n  (event) => {\n    // Parse + validate. On a bad shape, accept-and-drop (return []),\n    // or throw to reject the request.\n    const parsed = InboundSchema.safeParse(event.payload.body ?? {});\n    if (!parsed.success) return Promise.resolve([]);\n\n    // Hand the validated payload to a workers job.\n    return Promise.resolve([\n      enqueueJob(createUserSettingsJob, {\n        payload: { userId: parsed.data.userId },\n        priority: 80,\n      }),\n    ]);\n  },\n  {\n    id: 'validated-inbound-webhook',\n    path: 'validate/data',\n    verifier: 'memory',\n    description: 'Validates the body with zod, then enqueues create-user-settings.',\n    tags: ['webhook', 'validated'],\n  },\n);\n\nexport default validatedInboundWebhook;"
  },
  {
    label: "Call it — curl",
    lang: "bash",
    code: "# Triggers API runs on its assigned port. POST to the webhook's resolved path.\n# Replace <triggers-port> with your assigned triggers API port.\ncurl -X POST \"$TRIGGERS_URL/api/v1/webhooks/inbound/generic\" \\\n  -H 'content-type: application/json' \\\n  -d '{\"verbose\": false}'\n\n# Watch the resulting ingress events:\ndeno x -A jsr:@netscript/plugin-triggers" + releaseSpecifier + "/cli events --limit=10 --json\n\n# The enqueued job lands on the workers plugin (on its assigned port):\nns-workers executions --limit=10 --json"
  }
] }) }}

## How it wires to the rest of the app

One inbound POST drives the scaffold's whole chain, and every link is scaffold code that compiles.
The `generic-inbound-webhook` enqueues the workers health-check job. The `create-user-settings`
job, from the [background jobs](/background-processing/workers/) page, publishes a
`UserSettingsCreated` saga message, and the [saga](/durable-workflows/sagas/) handles it.

## Production notes

{{ comp callout { type: "caution", title: "Never ship the memory verifier" } }}
The <code>'memory'</code> verifier accepts any POST. Before you expose a webhook, set <code>verifier: 'hmac-sha256'</code> and a <code>secretEnv</code>, so only a sender that holds the secret can enqueue work. Keep the secret in the environment variable that <code>secretEnv</code> names, never in source or in the definition object; the runtime resolves it at ingress with <code>resolveSecret</code>.
{{ /comp }}

- **Return fast, work later.** A handler verifies, validates, and calls `enqueueJob`; it does not
  do the work inline. Webhook senders time out and retry, so durable processing belongs on the
  workers plugin.
- **De-duplicate sender retries.** Pass `idempotencyKey`, the event's key or a stable field, to
  `enqueueJob`, so a retried POST collapses to one job.
- **Stabilize file watches on network shares.** Set `stabilityThreshold` so a half-written CSV does
  not fire mid-copy. Use `forcePolling` on the underlying watcher for network filesystems that miss
  native events.

## Next steps

Build a verified shipping webhook end to end in the
[storefront tutorial](/tutorials/storefront/05-shipping-webhook/). The full API is in the
{{ comp.xref({ key: "ref:triggers", text: "triggers reference" }) }}.
