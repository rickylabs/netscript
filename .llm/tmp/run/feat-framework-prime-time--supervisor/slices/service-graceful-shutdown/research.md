# Research — service-graceful-shutdown

## Scope

ONE slice from `blocker_slices.json` → key `"service-graceful-shutdown"`.

- Title: "Signal handlers + onShutdown/drain hook on the service front door"
- Severity: blocker. Wave: A. Units: `packages/service`. dependsOn: none.
- Two gaps, both `blocker`:
  - `graceful-shutdown-no-signal-handlers-in-service-builder` (category `unwired-root`)
  - `graceful-shutdown-no-onshutdown-hook-on-service-builder` (category `dropped-input`)

## Ground-truth re-baseline against current `main` (branch at `cc3b8731`)

Every cited file:line was opened and re-verified. Line numbers are CURRENT (post S2/S3/S5/OTel).

### Gap 1 — no SIGTERM/SIGINT handlers; `serve()` runs until killed (VERIFIED, unresolved)

- `packages/service/src/builder/service-listener.ts:24-72` — `startServiceListener()` is the
  whole listener owner. It creates an internal `AbortController` (line 32), bridges only the
  caller-supplied `options.signal` into it (lines 34-42), starts `Deno.serve({ port, signal:
  controller.signal, onListen })` (lines 44-60), and returns `{ app, addr, stop }` where
  `stop()` does `controller.abort()` + `await server.finished` (lines 65-71). **There is no
  `Deno.addSignalListener` for `SIGTERM`/`SIGINT`/`SIGBREAK` anywhere in this file or the
  package.** Confirmed.
- `packages/service/src/builder/service-builder-impl.ts:397-407` — `serve()` runs `ensureLogging()`,
  the `startupHooks` loop, `build()`, then `return startServiceListener(...)`. No signal wiring,
  no drain registration. Confirmed (exact lines).
- `packages/service/src/presets/define-service.ts:142` — `defineService()` ends in
  `.withHealth().serve()`; no signal wiring. Confirmed.
- Repo-wide: `addSignalListener|SIGTERM|SIGINT|SIGBREAK` appears only in plugin loops
  (`plugins/triggers/src/runtime/trigger-processor.ts`, `plugins/sagas/src/runtime/saga-runner.ts`)
  and **`plugins/streams/services/src/main.ts:141-154`**, which BYPASSES the builder with raw
  `Deno.serve(...)` and hand-rolls `Deno.addSignalListener('SIGINT'|'SIGTERM', shutdown)` calling
  `frontServer.shutdown()` + `server.stop()` (VERIFIED verbatim at lines 141-154). This is the
  proof that the builder's missing capability is being worked around in deployed code.
- `plugins/workers/services/src/main.ts:48-73` — deployed HTTP front door uses
  `createService(...).…​.serve()` with no signal handling, inheriting the gap. Confirmed (the
  chain ends `.serve()` at line 73 with only `onStartup`).

### Gap 2 — no `onShutdown()`/drain hook; runtime resources never torn down (VERIFIED, unresolved)

- `packages/service/src/builder/service-builder.ts:97` — the `ServiceBuilder` interface declares
  `onStartup(hook: () => Promise<void>)` ONLY (line 97). There is no `onShutdown`/`onStop`/`onDrain`
  counterpart in the interface (lines 59-122 fully read). Confirmed.
- `packages/service/src/builder/service-builder-impl.ts:58` — only `private startupHooks:
  Array<() => Promise<void>> = []` exists; there is no `shutdownHooks` array. `onStartup` pushes
  to it (lines 299-302). `serve()` (397-407) returns the listener handle directly with no teardown
  registration. Confirmed.
- `packages/service/src/builder/service-listener.ts:62-71` — `RunningService.stop()` aborts the
  HTTP controller and awaits `server.finished`; it invokes NO user teardown, so registered runtime
  resources (workers/sagas/DB pools) are never released. Confirmed.
- `packages/service/src/types.ts:43-50` — `ServeOptions` has only `{ port?, signal? }`; no
  `drainTimeoutMs`/`onShutdown`. Confirmed.
- `packages/service/src/presets/define-service.ts:133` — Layer-3 preset wires only `onStartup`
  (the DB connectivity hook) even when a DB is supplied; no shutdown path. Confirmed.
- `packages/plugin-workers-core/src/shutdown/shutdown-manager.ts:1-136` — a real `ShutdownManager`
  class EXISTS (priority-ordered resource registry, timeout accounting, `ShutdownReport`,
  `createAbortController`, `waitForShutdown`, `shutdown(reason, {timeoutMs})`). It is
  plugin-internal and NOT wired into `RunningService.stop()` — orphaned from the HTTP lifecycle.
  Confirmed. NOTE: this is a strong design precedent for the drain semantics we must add, but it
  lives in a plugin package and `@netscript/service` cannot depend on a plugin (layering); we
  reuse the *pattern*, not the class.

### Doctrine ground truth

- `docs/architecture/doctrine/08-runtime-state-failure.md:133-134` (§"Cancellation propagation"):
  > "`start()` returns a handle whose `stop()` aborts an internal controller and awaits drain."
  Verified verbatim (lines 133-134). The same section (135-146) requires the abort signal to flow
  to every adapter/loop and forbids a "drain() that returns immediately without flushing in-flight
  messages" (AP at line 146). This is the contract our `stop()` must satisfy: abort internal
  controller, run user teardown, AND await in-flight request drain (not just abrupt cancel).

### Deno platform ground truth (wrap-not-reinvent)

- `Deno.serve(...)` returns an `HttpServer` exposing two distinct lifecycle methods:
  - `shutdown()` — **graceful**: stops accepting new connections and resolves once in-flight
    requests finish (this is what `streams/services/src/main.ts:147` already uses).
  - aborting the `signal` passed to `Deno.serve` — **immediate**: terminates the listener at once.
  - `server.finished` — a promise that resolves when the server has fully stopped.
  The CURRENT `service-listener.ts` only uses the abort path (`controller.abort()`), giving abrupt
  termination, NOT a graceful drain. The doctrine "await drain" requirement (08:133-134) is only
  satisfied by calling `server.shutdown()` and awaiting it before/with the user teardown.
- `Deno.addSignalListener(signal, handler)` / `Deno.removeSignalListener(signal, handler)` are the
  Deno primitives for OS signals. `SIGBREAK` is Windows-only; `SIGINT`/`SIGTERM` are POSIX. On
  Windows `Deno.addSignalListener('SIGTERM', …)` throws, so signal registration must be
  platform-guarded (`Deno.build.os`). This is a real cross-platform landmine the plan must handle
  (the worktree runs on Windows; CI runs Linux).

## Existing patterns to reuse

- `ShutdownManager` (plugin-workers-core) — pattern for priority-ordered teardown + timeout +
  structured report. We mirror its shape as a small package-private helper in `@netscript/service`
  (NOT a dependency) so the service surface gains the same drain semantics without a layering
  violation.
- `service-listener.ts` already owns the `Deno.serve` lifecycle and the `stop()` contract — the
  natural home for signal registration + graceful `server.shutdown()` + teardown invocation.
- Test idiom: `tests/runtime_test.ts` already exercises `serve({ port: 0 })` + `stop()` +
  `assertRejects(fetch, TypeError)` to prove the listener closed. New tests follow this idiom.

## Public-surface / JSR considerations (F-5, F-6)

- New exports proposed: `onShutdown` builder method (extends `ServiceBuilder` interface), a
  `ShutdownContext`/`ShutdownHook` type, and an extended `ServeOptions` (`drainTimeoutMs`). All are
  package-owned structural types (no upstream re-export, no Zod) → no slow-type / AP-14 risk.
- `mod.ts` already re-exports `ServeOptions`, `RunningService`, `ServiceBuilder` — adding fields/
  methods to these existing exports does not add a new subpath. No sub-barrel change. F-18/F-16 safe.
- All new methods get TSDoc with `@example` to keep F-7 (doc-score) green.

## Drift / debt implications

- `streams/services/src/main.ts:141-154` hand-rolls signal handling because the builder lacked it.
  After this slice, that hand-roll becomes redundant. We DO NOT refactor it in this slice (out of
  scope, different unit, avoids scope creep) but record it as follow-up drift so a later slice can
  migrate streams onto `onShutdown`. No e2e scaffold output changes here.
