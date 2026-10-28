---
layout: layouts/base.vto
title: Graceful shutdown
description: Drain requests, jobs, and connections on SIGTERM, and run teardown hooks.
templateEngine: [vento, md]
order: 108
oldUrl: /how-to/graceful-shutdown/
---

# Graceful shutdown

This recipe drains in-flight requests and jobs, runs teardown hooks and closes database and queue
connections when your app receives `SIGINT` or `SIGTERM`, so a deploy or {{ comp.kbd({ text: "Ctrl+C" }) }}
never drops work mid-flight.

## Prerequisites

- **`@netscript/service`**: `createService().onShutdown().serve()` drains requests, and
  `createRuntimeHost()` puts the whole app under one budget.
- **`@netscript/plugin-workers-core/shutdown`**: `ShutdownManager` drains worker and scheduler
  resources; the worker runtime also exposes a `runtime.shutdown` handle.
- **`@netscript/queue`**, if you consume a queue: `MessageQueue.listen(handler, { signal })` and
  `stop()` let an `AbortSignal` stop consumption gracefully.
- **A long-running entrypoint**: a service or worker process, started with `deno run` or
  `aspire start`, that needs to stop cleanly.

## Step 1 — Drain a service with `.onShutdown()`

For a service, you don't call `Deno.addSignalListener` yourself. `serve()` installs `SIGINT` and
`SIGTERM` handlers (`SIGINT` and `SIGBREAK` on Windows) and drains in-flight HTTP requests before the
process exits. Add `.onShutdown(hook)` to close what the framework doesn't own: your database
client, an external connection, a flush buffer. Each `ShutdownHook` receives a `ShutdownContext`
(`reason`, optional `signal`) and runs during the drain in LIFO order (last registered, first to
run).

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
    port: 3001, // note: your scaffold's port will differ
    drainTimeoutMs: 10_000, // wait up to 10s for in-flight work
    handleSignals: true,    // SIGINT/SIGTERM (SIGBREAK on Windows) — the default
  });

// In tests or a supervisor, trigger the same drain manually:
await running.stop();
```

`drainTimeoutMs` (default `30_000`) bounds the drain. When it elapses, the service stops anyway and
the returned `ShutdownReport` records `timedOut: true` plus a `ShutdownHookOutcome` per hook.
`running.stop()` runs the same drain with reason `'manual'`. Both paths are idempotent, so a double
{{ comp.kbd({ text: "Ctrl+C" }) }} doesn't run hooks twice.

{{ comp.apiTable({
  caption: "Shutdown contract (@netscript/service)",
  rows: [
    { kind: "method", name: ".onShutdown(hook)", type: "ServiceBuilder method", desc: "Registers an async teardown ShutdownHook. Hooks run LIFO during the drain." },
    { kind: "type", name: "ShutdownHook", type: "(context: ShutdownContext) => Promise<void> | void", desc: "Your teardown callback. Throwing is captured, not fatal — it lands in the report as a failed hook." },
    { kind: "interface", name: "ShutdownContext", type: "{ reason: ShutdownReason; signal?: Deno.Signal }", desc: "signal is set only when reason is 'signal'." },
    { kind: "type", name: "ShutdownReason", type: "'signal' | 'manual' | 'startup-failure'", desc: "An OS signal, a manual stop() call, or a failed startup hook." },
    { kind: "interface", name: "ShutdownReport", type: "{ reason; timedOut: boolean; hooks: readonly ShutdownHookOutcome[] }", desc: "Returned by stop(); timedOut is true when the drain budget elapsed first." }
  ]
}) }}

## Step 2 — Configure the drain budget via `serve()`

The drain budget and signal behavior are `ServeOptions` keys. Pass an external `AbortSignal` to stop
the listener without an OS signal, from a parent controller, a test harness or a higher-level
orchestrator.

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
  .serve({ port: 3001, signal: controller.signal, drainTimeoutMs: 15_000 }); // note: your scaffold's port will differ

// Anywhere in the parent: triggers the same bounded drain.
controller.abort();
```

## Step 3 — Drain a worker runtime

The worker runtime carries its own `ShutdownManager` and exposes it as `runtime.shutdown`. It
pre-registers its worker (priority `20`) and, when present, its scheduler (priority `30`);
higher-priority resources stop first. Register your own long-lived resources, such as a queue
consumer or a connection pool, and call `runtime.shutdown.shutdown(reason)` to stop them all under
one bounded budget.

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
Unlike a service's <code>serve()</code>, the worker runtime does <strong>not</strong> register OS signal handlers. A worker entrypoint without <code>Deno.addSignalListener</code> is killed ungracefully. Add the listener and route the signal into <code>runtime.shutdown.shutdown()</code>, or into <code>host.shutdown()</code> for a combined app (<a href="#step-5-compose-the-whole-app-under-one-budget">Step 5</a>). Deno doesn't deliver <code>SIGTERM</code> on Windows, so listen for <code>SIGBREAK</code> there; the service listener already does this for its own signals.
{{ /comp }}

You can also build a standalone `ShutdownManager`. Its `createAbortController()` returns an
`AbortController` that aborts the moment shutdown starts: pass that signal to
`queue.listen(handler, { signal })` so consumption stops cleanly, and `register()` each resource
you want stopped (higher `priority` stops first).

{{ comp.apiTable({
  caption: "ShutdownManager (@netscript/plugin-workers-core/shutdown)",
  rows: [
    { kind: "method", name: "register(resource)", type: "(ShutdownResource) => void", desc: "Adds a resource: { id, priority?, stop(reason?) }. Higher priority stops first; default 0." },
    { kind: "method", name: "shutdown(reason?, options?)", type: "=> Promise<ShutdownReport>", desc: "Stops all registered resources concurrently under timeoutMs (default 30_000); idempotent — returns the same report on repeat calls." },
    { kind: "method", name: "createAbortController()", type: "=> AbortController", desc: "An AbortController that aborts when shutdown begins. Pass its .signal to queue.listen({ signal })." },
    { kind: "method", name: "waitForShutdown()", type: "=> Promise<void>", desc: "Resolves once shutdown has started — await it to gate your own cleanup." },
    { name: "state", type: "'running' | 'shutting-down' | 'stopped'", desc: "Current lifecycle state." }
  ]
}) }}

## Step 4 — Stop a queue consumer cleanly

A `MessageQueue` consumer is a long-running `listen()` loop. Stop it without dropping a message
mid-process in one of two ways: pass an `AbortSignal` to `listen()`, or call `queue.stop()`, which
lets in-flight messages finish. An `AbortSignal` from a `ShutdownManager` ties consumption directly
to your drain.

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

## Step 5 — Compose the whole app under one budget

Use `createRuntimeHost()` when one process owns a service, workers, a queue consumer and a database
connection. Each callback invokes the resource's existing drain; the host adds no teardown logic of
its own, only one phase order, one deadline and one report.

```ts
import { createRuntimeHost } from '@netscript/service';

const host = createRuntimeHost({
  timeoutMs: 15_000,
  drains: [
    { id: 'api', phase: 'service', drain: () => service.stop() },
    { id: 'jobs', phase: 'workers', drain: () => workers.stop('shutdown') },
    { id: 'messages', phase: 'queue', drain: () => queue.stop() },
    { id: 'primary-db', phase: 'database', drain: () => database.disconnect() },
  ],
});

// Route the process signal or supervisor request into the same idempotent operation.
const report = await host.shutdown('SIGTERM');
```

The fixed phase order is `service → workers → queue → database`, so the app stops accepting work
before draining processors and closes storage last. Registration order is stable inside a phase. A
rejected drain is reported as `failed` and later drains still run. If the shared budget expires, the
active drain is `timed-out`, remaining drains are `skipped`, and `shutdown()` returns without waiting
indefinitely for the slow resource.

{{ comp.apiTable({
  caption: "App-wide runtime host (@netscript/service)",
  rows: [
    { kind: "function", name: "createRuntimeHost(options)", type: "=> RuntimeHost", desc: "Composes existing drains using one timeoutMs budget (default 30_000)." },
    { kind: "type", name: "RuntimeHostDrain", type: "{ id; phase; drain(reason?) }", desc: "Calls one existing resource drain in the service, workers, queue, or database phase." },
    { kind: "method", name: "host.shutdown(reason?)", type: "=> Promise<RuntimeHostShutdownReport>", desc: "Runs once, returns the same promise on repeat calls, and never waits beyond the shared budget." },
    { kind: "type", name: "RuntimeHostShutdownReport", type: "{ reason?; timedOut; outcomes }", desc: "Ordered stopped, failed, timed-out, or skipped outcomes for every registered resource." }
  ]
}) }}

## In-production pitfalls

{{ comp callout { type: "warning", title: "Keep the budget under the kill grace period" } }}
Both <code>drainTimeoutMs</code> and the host's <code>timeoutMs</code> default to <code>30_000</code>. If your orchestrator sends <code>SIGKILL</code> sooner (Kubernetes <code>terminationGracePeriodSeconds</code> defaults to 30 seconds), in-flight work is cut off. Pick a budget comfortably under the grace period.
{{ /comp }}

Close the database in the host's `database` phase for a combined app, or call `db.$disconnect()`
inside `.onShutdown()` for a service-only process, never at module scope. Both run after in-flight
requests drain; disconnecting earlier breaks requests still being served.

A throwing hook doesn't abort the drain: a rejected `ShutdownHook` is recorded as a failed
`ShutdownHookOutcome`, not re-thrown. Inspect the returned `ShutdownReport`, or the logged warning,
to catch teardown failures.

## Next step

Decide how much in-flight work a drain waits on with
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/). The
[`@netscript/service` reference](/reference/service/) has the full shutdown contract.
