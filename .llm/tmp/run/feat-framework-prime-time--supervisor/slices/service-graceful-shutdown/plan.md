# Plan — service-graceful-shutdown

## Locked scope

Add first-class graceful shutdown to the `@netscript/service` front door, in `packages/service`
only:

1. A **graceful-drain `stop()`**: `RunningService.stop()` must (a) abort the internal HTTP
   controller seam, (b) call `Deno.serve`'s `server.shutdown()` to stop accepting new connections
   and drain in-flight requests, (c) run user-registered shutdown hooks in reverse registration
   order, and (d) await `server.finished` — satisfying doctrine 08:133-134 ("aborts an internal
   controller and awaits drain"). Idempotent: calling `stop()` twice resolves the same report.
2. An **`onShutdown(hook)` builder method** mirroring `onStartup`, storing hooks that run during
   `stop()` (and on signal-triggered shutdown). Hooks receive a `ShutdownContext { reason }` and
   run under a bounded `drainTimeoutMs` budget; failures are collected, not thrown, so one bad hook
   cannot strand the rest (mirrors `ShutdownManager.stopResources` semantics).
3. **OS signal handlers**: `serve()` registers `SIGINT`/`SIGTERM` (and `SIGBREAK` on Windows)
   listeners that trigger the same `stop()` path, platform-guarded via `Deno.build.os`. Registered
   listeners are removed during teardown so repeated serve/stop cycles in tests don't leak
   handlers. Signal handling is **on by default** but suppressible via
   `serve({ handleSignals: false })` for embedding/test hosts.
4. **`ServeOptions` extension**: `drainTimeoutMs?` (default 30_000, mirrors ShutdownManager) and
   `handleSignals?` (default true).
5. **`defineService()` (Layer 3)** keeps wiring DB connectivity on startup AND now registers a DB
   disconnect shutdown hook when a `$queryRaw`/`$disconnect`-capable client is present (real
   teardown, not a no-op), so the one-liner preset releases the pool on shutdown.

Out of scope (explicit deferrals, safe to defer — no rework risk):

- Refactoring `plugins/streams/services/src/main.ts` off its hand-rolled signal handling (different
  unit; recorded as follow-up drift).
- Auth/RBAC (separate slice `service-auth-seam`).
- Wiring plugin runtimes (workers/sagas) into `onShutdown` at their composition roots (separate
  plugin slices; this slice only ships the seam they will consume).

## Archetype + overlays

- Primary: **ARCHETYPE-4 (Public DSL / Builder)** — builder method + materialization lifecycle.
- Overlay: **SCOPE-service**.
- Runtime gates apply (builder materializes a long-running listener).

## Contract-first design

### Contracts (define BEFORE implementation)

In `packages/service/src/types.ts`:

```ts
/** Reason a service is shutting down. */
export type ShutdownReason = 'signal' | 'manual' | 'startup-failure';

/** Context passed to shutdown hooks. */
export interface ShutdownContext {
  /** Why shutdown was triggered. */
  readonly reason: ShutdownReason;
  /** OS signal that triggered shutdown, when reason === 'signal'. */
  readonly signal?: Deno.Signal;
}

/** Async teardown hook registered via onShutdown(). */
export type ShutdownHook = (context: ShutdownContext) => Promise<void> | void;

/** Per-hook outcome captured during drain. */
export interface ShutdownHookOutcome {
  readonly ok: boolean;
  readonly error?: string;
}

/** Result of a completed shutdown. */
export interface ShutdownReport {
  readonly reason: ShutdownReason;
  /** True if the drain timeout elapsed before all hooks/requests settled. */
  readonly timedOut: boolean;
  /** Per-hook outcomes in execution order. */
  readonly hooks: readonly ShutdownHookOutcome[];
}
```

Extend existing `ServeOptions` (types.ts:44-50):

```ts
export interface ServeOptions {
  port?: number;
  signal?: AbortSignal;
  /** Max time to wait for in-flight requests + shutdown hooks. Default 30_000ms. */
  drainTimeoutMs?: number;
  /** Install SIGINT/SIGTERM(/SIGBREAK) handlers. Default true. */
  handleSignals?: boolean;
}
```

Extend `RunningService` (types.ts:32-41): `stop()` keeps its `Promise<void>` signature for back-
compat, BUT add an optional richer accessor is NOT needed — `stop()` stays `Promise<void>`;
the `ShutdownReport` is surfaced to hooks/logs only. (Locked: do not change `stop()`'s return type;
that would break every existing caller and every test. The report is internal + logged.)

### Builder interface change (service-builder.ts)

Add after `onStartup` (line 97):

```ts
/** Registers an async teardown hook run during graceful shutdown (LIFO order). */
onShutdown(hook: ShutdownHook): ServiceBuilder<TRouter>;
```

### Implementation seam

- New file `packages/service/src/builder/service-shutdown.ts` — a package-private
  `ServiceShutdownCoordinator` (NOT exported from mod.ts) modeled on `ShutdownManager`: holds the
  hook list, the internal `AbortController`, runs hooks LIFO under `drainTimeoutMs` with
  `Promise.race` timeout accounting, collects per-hook outcomes, is idempotent (memoizes the
  in-flight shutdown promise), and exposes `runShutdown(reason, signal?) => Promise<ShutdownReport>`.
  Keeping it separate honors ARCHETYPE-4 "split builder by concern" (AP-1 guard) and keeps
  `service-listener.ts` focused on `Deno.serve` mechanics.
- `service-listener.ts` gains: accept `shutdownHooks` + `drainTimeoutMs` + `handleSignals` from the
  builder; construct the coordinator; register `Deno.addSignalListener` (platform-guarded by
  `Deno.build.os`, skipping `SIGTERM`/`SIGBREAK` where unsupported) wired to
  `coordinator.runShutdown('signal', sig)`; implement `stop()` to call
  `coordinator.runShutdown('manual')` which internally: `controller.abort()` →
  `await server.shutdown()` → run hooks → `await server.finished`; remove signal listeners in a
  `finally`. Logs a structured drain banner (timedOut, failed hooks) via `@netscript/logger`.
- `service-builder-impl.ts` gains `private shutdownHooks: ShutdownHook[] = []`, an `onShutdown`
  method (push), and threads `shutdownHooks` + `options.drainTimeoutMs` + `options.handleSignals`
  into `startServiceListener(...)`. On a startup-hook failure (serve() line 401-403), any
  already-run setup is unaffected (no listener yet) — no shutdown needed, existing behavior kept.
- `define-service.ts`: when `findHealthCheckDb` resolves a client that also exposes `$disconnect`
  (Prisma), register `builder.onShutdown(async () => { await client.$disconnect(); })`. Guarded by
  capability check (`typeof client.$disconnect === 'function'`); real teardown, no no-op.

### Doctrine compliance

- 08:133-134 satisfied: `stop()` aborts internal controller AND awaits drain (`server.shutdown()` +
  `server.finished`) — not an immediate-return drain (AP at 08:146 avoided).
- Signal flow: the coordinator's internal `AbortController.signal` is the cancellation seam hooks
  can observe (passed via closure to long-running user teardown if needed); aligns with 08:135-146.
- Delivery/observability: structured shutdown log (reason, timedOut, failed hook ids) via the
  service logger — no raw `console.*` (F-14).

## Commit slices (ordered, each independently gate-able)

1. **Contracts** — add `ShutdownReason`/`ShutdownContext`/`ShutdownHook`/`ShutdownHookOutcome`/
   `ShutdownReport` types and extend `ServeOptions` in `types.ts`; re-export new types from
   `mod.ts`. Proves: types compile + publish surface stable.
   - Files: `packages/service/src/types.ts`, `packages/service/mod.ts`.
   - Gate: `run-deno-check.ts --root packages/service --ext ts` (`deno check --unstable-kv`),
     `run-deno-lint.ts`, `run-deno-fmt.ts`.
2. **Shutdown coordinator** — add `service-shutdown.ts` (`ServiceShutdownCoordinator`) with LIFO
   hooks, timeout accounting, idempotency, structured report. Proves: drain/timeout/failure-
   collection logic in isolation.
   - Files: `packages/service/src/builder/service-shutdown.ts`,
     `packages/service/tests/shutdown-coordinator_test.ts`.
   - Gate: check + lint + fmt + `deno test --allow-all packages/service/tests/shutdown-coordinator_test.ts`.
3. **Listener graceful stop + signals** — rewrite `service-listener.ts` to use the coordinator,
   call `server.shutdown()`/await drain in `stop()`, register/remove platform-guarded signal
   listeners, accept `drainTimeoutMs`/`handleSignals`/`shutdownHooks`. Proves: `stop()` drains;
   signals trigger drain; no listener leak across cycles.
   - Files: `packages/service/src/builder/service-listener.ts`,
     `packages/service/tests/runtime_test.ts` (extend).
   - Gate: check + lint + fmt + `deno test --allow-all packages/service/tests/runtime_test.ts`.
4. **Builder `onShutdown` wiring** — add `shutdownHooks` field + `onShutdown()` to interface +
   impl; thread into `serve()`. Proves: hooks run on stop and on signal, in LIFO order, failures
   collected.
   - Files: `service-builder.ts`, `service-builder-impl.ts`,
     `packages/service/tests/service-builder_test.ts` (extend).
   - Gate: check + lint + fmt + `deno test --allow-all packages/service/tests/`.
5. **Preset DB drain** — `define-service.ts` registers a `$disconnect` shutdown hook when capable.
   Proves: Layer-3 preset releases the DB pool on shutdown.
   - Files: `packages/service/src/presets/define-service.ts`,
     `packages/service/tests/runtime_test.ts` or a focused preset test.
   - Gate: check + lint + fmt + `deno test --allow-all packages/service/tests/`.
6. **Docs + README + publish surface** — TSDoc `@example` on `onShutdown` and `ServeOptions`
   fields; update package README quick-start to show `onShutdown`; verify `publish:dry-run`.
   Proves: F-6/F-7 green; README matches public API (ARCHETYPE-4 concept-of-done).
   - Files: `packages/service/README.md`, doc comments in changed files.
   - Gate: `deno publish --dry-run --allow-dirty --allow-slow-types` (via package task), fmt, lint.

(6 slices, well under 30.)

## Gates to run

- Static, every slice via wrappers: `.llm/tools/run-deno-check.ts --root packages/service --ext ts`
  (uses `deno check --unstable-kv`), `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts
  --ext ts` (exclude tests-generated none here).
- Targeted tests: `deno test --allow-all packages/service/tests/` (wrap in `rtk proxy`).
- JSR publishability: `deno task publish:dry-run` in `packages/service` (slice 6).
- Fitness (manual/PENDING_SCRIPT evidence): F-1 (file size — new files small), F-5 (public surface
  — only additive, package-owned types), F-6 (JSR — no slow types), F-7 (doc-score — `@example` on
  new surface), F-10 (test-shape — unit + integration + failure-path), F-14 (console-log — logger
  only), F-15/F-18 (no upstream re-export, no new sub-barrel).
- Runtime/Aspire: NOT required — no scaffold output changes, no generated service template change,
  no Prisma schema change. **e2e:cli is NOT run** for this slice (no scaffold output change).
- Consumer import validation (SCOPE-service): `deno check` the `plugins/workers/services` and
  `plugins/sagas/services` entrypoints still compile against the additive builder surface
  (additive-only, so expected green).

## Design

The front door already centralizes the `Deno.serve` lifecycle in `service-listener.ts`; that is the
single seam we extend, keeping the builder class thin (ARCHETYPE-4 file-boundary discipline). We add
a dedicated `ServiceShutdownCoordinator` rather than fattening the listener, mirroring the proven
`ShutdownManager` shape from `plugin-workers-core` WITHOUT taking a plugin dependency (layering law).
`stop()` moves from an abrupt `controller.abort()` to a true graceful drain (`server.shutdown()` +
hook execution + `server.finished`), which is the exact doctrine 08:133-134 contract and what the
streams service already hand-rolls. Signals are wrapped with `Deno.addSignalListener`, platform-
guarded for Windows (`SIGBREAK`) vs POSIX (`SIGTERM`/`SIGINT`) so CI (Linux) and the dev worktree
(Windows) both pass, with listeners removed on teardown to keep serve/stop test cycles leak-free.
All new public surface is additive package-owned structural types with `@example` docs, so JSR
publishability and doc-score stay green and `stop()`'s existing `Promise<void>` contract is
preserved for back-compat.
