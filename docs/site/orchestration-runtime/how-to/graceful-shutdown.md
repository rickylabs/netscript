---
layout: layouts/base.vto
title: Graceful shutdown
templateEngine: [vento, md]
order: 105
oldUrl: /how-to/graceful-shutdown/
---

# Graceful shutdown

Drain in-flight requests and jobs, run teardown hooks, and close DB/queue
connections when your app receives `SIGINT`/`SIGTERM` — so a deploy or `Ctrl+C`
never drops work mid-flight.

## Prerequisites

{{ comp.apiTable({
  caption: "What you need",
  rows: [
    { name: "@netscript/service", type: "package", desc: "Provides createService().onShutdown().serve() — signal handling and request draining live here." },
    { name: "@netscript/plugin-workers-core/shutdown", type: "subpath export", desc: "ShutdownManager for draining worker/scheduler resources; the worker runtime also exposes a runtime.shutdown handle." },
    { name: "@netscript/queue", type: "package (if you consume a queue)", desc: "MessageQueue.listen(handler, { signal }) + stop() let an AbortSignal stop consumption gracefully." },
    { name: "A long-running entrypoint", type: "main.ts", desc: "A service or worker process you start with deno run / aspire start that needs to stop cleanly." }
  ]
}) }}

{{ comp callout { type: "note", title: "Signals are wired for you (services)" } }}
You do <strong>not</strong> call <code>Deno.addSignalListener</code> yourself for a
service. <code>serve()</code> installs <code>SIGINT</code>/<code>SIGTERM</code> (or
<code>SIGINT</code>/<code>SIGBREAK</code> on Windows) automatically and drains the HTTP
listener before the process exits. You only register <em>what to tear down</em> via
<code>.onShutdown()</code>.
{{ /comp }}

## Step 1 — Drain a service with `.onShutdown()`

`serve()` already drains in-flight HTTP requests. Add `.onShutdown(hook)` to close
the things the framework does not own — your database client, an external connection,
a flush buffer. Each `ShutdownHook` receives a `ShutdownContext` (`reason`, optional
`signal`) and runs during the drain, in LIFO order (last registered, first to run).

```ts
// services/users/src/main.ts
import { createService } from '@netscript/service';
import { router } from './router.ts';
import { db } from '@database';

const running = await createService(router, { name: 'users', version: '1.0.0' })
  .withRPC()
  .withHealth()
  .onShutdown(async ({ reason, signal }) => {
    // reason: 'signal' | 'manual' | 'startup-failure'
    audit.record({ event: 'shutdown', reason, signal });
    await db.$disconnect();
  })
  .serve({
    port: 3001,
    drainTimeoutMs: 10_000, // wait up to 10s for in-flight work
    handleSignals: true,    // SIGINT/SIGTERM (SIGBREAK on Windows) — the default
  });

// In tests or a supervisor, trigger the same drain manually:
await running.stop();
```

The drain is bounded by `drainTimeoutMs` (default `30_000`). When it elapses the
service stops anyway and the returned `ShutdownReport` records `timedOut: true` plus a
per-hook `ShutdownHookOutcome`. `running.stop()` runs the identical drain with reason
`'manual'`; both paths are idempotent, so a double `Ctrl+C` will not double-run hooks.

{{ comp.apiTable({
  caption: "Shutdown contract (@netscript/service)",
  rows: [
    { name: ".onShutdown(hook)", type: "ServiceBuilder method", desc: "Registers an async teardown ShutdownHook. Hooks run LIFO during the drain." },
    { name: "ShutdownHook", type: "(context: ShutdownContext) => Promise<void> | void", desc: "Your teardown callback. Throwing is captured, not fatal — it lands in the report as a failed hook." },
    { name: "ShutdownContext", type: "{ reason: ShutdownReason; signal?: Deno.Signal }", desc: "signal is set only when reason is 'signal'." },
    { name: "ShutdownReason", type: "'signal' | 'manual' | 'startup-failure'", desc: "An OS signal, a manual stop() call, or a failed startup hook." },
    { name: "ShutdownReport", type: "{ reason; timedOut: boolean; hooks: readonly ShutdownHookOutcome[] }", desc: "Returned by stop(); timedOut is true when the drain budget elapsed first." }
  ]
}) }}

## Step 2 — Configure the drain budget via `serve()`

The drain budget and signal behavior are `ServeOptions` keys. Pass an external
`AbortSignal` to stop the listener from anywhere — a parent controller, a test
harness, or a higher-level orchestrator — without an OS signal.

{{ comp.apiTable({
  caption: "ServeOptions — shutdown-relevant keys",
  rows: [
    { name: "drainTimeoutMs", type: "number?", desc: "Max time to wait for in-flight requests and shutdown hooks before forcing exit. Defaults to 30_000." },
    { name: "handleSignals", type: "boolean?", desc: "Install SIGINT/SIGTERM (or SIGBREAK) handlers. Defaults to true — set false only if a parent process owns signals." },
    { name: "signal", type: "AbortSignal?", desc: "External signal that stops the listener (and runs the drain) when aborted. Reason is reported as 'manual'." },
    { name: "port", type: "number?", desc: "Preferred listener port; 0 for an ephemeral port." }
  ]
}) }}

```ts
// supervisor.ts — stop a service from a parent AbortController
const controller = new AbortController();

const running = await createService(router, { name: 'users' })
  .withRPC()
  .serve({ port: 3001, signal: controller.signal, drainTimeoutMs: 15_000 });

// Anywhere in the parent: triggers the same bounded drain.
controller.abort();
```

## Step 3 — Drain a worker runtime

The worker runtime carries its own `ShutdownManager` and exposes it as
`runtime.shutdown`. The runtime pre-registers its worker (priority `20`) and, when
present, its scheduler (priority `30`); higher-priority resources stop first. Register
your own long-lived resources — a queue consumer, a connection pool — and call
`runtime.shutdown.shutdown(reason)` to stop them all under one bounded budget.

```ts
// workers/src/main.ts — drain workers + a queue consumer on signal
import { ShutdownManager } from '@netscript/plugin-workers-core/shutdown';

// runtime.shutdown is a RuntimeShutdownManager: { register, shutdown }
runtime.shutdown.register({
  id: 'queue-consumer',
  priority: 10, // stops after worker (20) and scheduler (30)
  stop: async () => {
    await queue.stop(); // let in-flight messages ack before exiting
  },
});

// Workers do NOT auto-install signal handlers — wire them yourself:
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  Deno.addSignalListener(signal, () => {
    void runtime.shutdown.shutdown(signal);
  });
}
```

{{ comp callout { type: "important", title: "Workers need their own signal wiring" } }}
Unlike a service's <code>serve()</code>, the worker runtime does <strong>not</strong>
register OS signal handlers for you. Add <code>Deno.addSignalListener</code> in your
worker entrypoint and route the signal into <code>runtime.shutdown.shutdown()</code>.
On Windows, listen for <code>SIGBREAK</code> instead of <code>SIGTERM</code> (the
service listener already does this internally for its own signals).
{{ /comp }}

You can also build a standalone `ShutdownManager` directly. Its `createAbortController()`
returns an `AbortController` that aborts the moment shutdown starts — feed that signal
into `queue.listen(handler, { signal })` so consumption stops cleanly, and `register()`
each resource you want stopped (higher `priority` stops first).

{{ comp.apiTable({
  caption: "ShutdownManager (@netscript/plugin-workers-core/shutdown)",
  rows: [
    { name: "register(resource)", type: "(ShutdownResource) => void", desc: "Adds a resource: { id, priority?, stop(reason?) }. Higher priority stops first; default 0." },
    { name: "shutdown(reason?, options?)", type: "=> Promise<ShutdownReport>", desc: "Stops all registered resources concurrently under timeoutMs (default 30_000); idempotent — returns the same report on repeat calls." },
    { name: "createAbortController()", type: "=> AbortController", desc: "An AbortController that aborts when shutdown begins. Pass its .signal to queue.listen({ signal })." },
    { name: "waitForShutdown()", type: "=> Promise<void>", desc: "Resolves once shutdown has started — await it to gate your own cleanup." },
    { name: "state", type: "'running' | 'shutting-down' | 'stopped'", desc: "Current lifecycle state." }
  ]
}) }}

## Step 4 — Stop a queue consumer cleanly

A `MessageQueue` consumer is a long-running `listen()` loop. Two ways to stop it
without dropping a message mid-process: pass an `AbortSignal` to `listen()`, or call
`queue.stop()` (which lets in-flight messages finish before shutting down). Wiring the
`AbortSignal` from a `ShutdownManager` ties consumption directly to your drain.

{{ comp.tabbedCode({ tabs: [
  {
    label: "AbortSignal from the manager",
    lang: "ts",
    code: "// workers/src/consumer.ts — stop consuming when shutdown begins\nimport { ShutdownManager } from '@netscript/plugin-workers-core/shutdown';\n\nconst manager = new ShutdownManager({ timeoutMs: 15_000 });\nconst { signal } = manager.createAbortController();\n\n// listen() returns when the signal aborts; in-flight messages ack/nack first.\nawait queue.listen(\n  async (message, ctx) => {\n    await handle(message);\n    await ctx.ack();\n  },\n  { signal, concurrency: 5 },\n);"
  },
  {
    label: "Explicit stop()",
    lang: "ts",
    code: "// workers/src/consumer.ts — drain via stop()\n// stop() halts the listen loop and lets in-flight messages complete.\nawait queue.stop();"
  }
] }) }}

## In-production pitfalls

{{ comp callout { type: "warning", title: "Footguns before you ship" } }}
<ul>
<li><strong>Set <code>drainTimeoutMs</code> below your platform's kill grace.</strong>
The drain defaults to <code>30_000</code>. If your orchestrator sends <code>SIGKILL</code>
sooner (Kubernetes <code>terminationGracePeriodSeconds</code> defaults to 30s), in-flight
work is cut off — pick a budget comfortably under the grace period.</li>
<li><strong>Workers do not auto-handle signals.</strong> Only a service's
<code>serve()</code> installs <code>SIGINT</code>/<code>SIGTERM</code>. A standalone
worker entrypoint that omits <code>Deno.addSignalListener</code> will be killed
ungracefully — register the listener and route it into
<code>runtime.shutdown.shutdown()</code>.</li>
<li><strong>Use <code>SIGBREAK</code>, not <code>SIGTERM</code>, on Windows.</strong>
Deno does not deliver <code>SIGTERM</code> on Windows; the service listener already
uses <code>SIGBREAK</code> internally, but your own worker signal wiring must too.</li>
<li><strong>A throwing hook does not abort the drain.</strong> A
<code>ShutdownHook</code> that rejects is captured as a failed
<code>ShutdownHookOutcome</code> in the report, not re-thrown — inspect the returned
<code>ShutdownReport</code> (or the logged warning) to catch teardown failures.</li>
<li><strong>Close the DB in a hook, not at module scope.</strong> Call
<code>db.$disconnect()</code> inside <code>.onShutdown()</code> so it runs <em>after</em>
in-flight requests drain — disconnecting earlier breaks requests still being served.</li>
</ul>
{{ /comp }}

{{ comp callout { type: "important", title: "No single app-wide shutdown orchestrator yet" } }}
{{ comp.badge({ status: "planned", label: "Planned" }) }} The framework drains <strong>each runtime
independently</strong>: <code>serve()</code> drains a service, <code>ShutdownManager</code>
drains workers, <code>queue.stop()</code> drains a consumer. There is <strong>no</strong>
single top-level <code>host.shutdown()</code> that orchestrates a service + its workers +
its queue + its DB together under one budget. Until that lands, <em>you</em> compose them:
register every long-lived resource with the worker runtime's
<code>runtime.shutdown</code>, and put service-owned teardown in <code>.onShutdown()</code>.
Co-locating a service and workers in one process means wiring both drains in the same
entrypoint by hand.
<!-- caveat: arch-debt:runtime-app-wide-shutdown-orchestrator -->
{{ /comp }}

## See also

{{ comp.xref({ key: "ref:service" }) }}

{{ comp.xref({ key: "cap:background-jobs" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/service",
    body: "The full shutdown contract: onShutdown, ServeOptions (drainTimeoutMs, handleSignals, signal), ShutdownReport, and the running.stop() drain.",
    href: "/reference/service/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/workers",
    body: "ShutdownManager, the runtime.shutdown handle, and the worker/scheduler resources it pre-registers.",
    href: "/reference/workers/",
    icon: "≡"
  },
  {
    title: "Do — Tune the worker runtime",
    body: "Recipe: concurrency, retry, and the runtime knobs that decide how much in-flight work a drain has to wait on.",
    href: "/background-processing/how-to/tune-worker-runtime/",
    icon: "◆"
  },
  {
    title: "Understand — The durability model",
    body: "Why queue messages and saga steps survive a restart — the guarantees a clean drain protects.",
    href: "/explanation/durability-model/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Run a polyglot task", href: "/background-processing/how-to/run-a-polyglot-task/" }, next: { label: "Deploy locally with Aspire", href: "/orchestration-runtime/how-to/deploy-local-aspire/" } }) }}
