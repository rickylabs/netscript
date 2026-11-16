# Plan

## Locked scope and contracts

Resolve #2630 and #2631 together. No merge/publication, no saga transport modifications, no Redis Streams dependency.

1. ChildHealthProcessOptions gains hostname (default loopback, explicit override), drainTimeoutMs (35 s total including up to 5 s reserved for cleanup), bounded onShutdown hooks, and exitOnShutdown (default true for process ownership; false for embedded/tests). Preserve the one-second observable fatal-health grace. Exit 0 clean, 1 fatal/cleanup failure, 2 drain timeout. The default work drain is 30 s; cleanupTimeoutMs defaults to min(5 s, one fifth of the total). The total bound includes closing the health listener; the pre-existing one-second fatal-observation grace precedes this bound.
2. Service signal shutdown ends the process with the same exit-code vocabulary after drain and resource cleanup. Manual stop and external cancellation remain embeddable; an explicit exitOnSignal option lets a host retain process ownership. Shutdown hook failures are nonzero. Hooks are attempted on timeout rather than skipped; a cleanup phase reserved within the existing 30 s total (default min(5 s, one fifth of total)) prevents one hook from hanging process termination. A timed-out work-drain hook cannot prevent remaining resource cleanups from being invoked. Existing LIFO ordering and idempotency remain.
3. Close process-owned shared KV (and its Redis client/subscriber) on executable-role signal shutdown. Add explicit cleanup callbacks to generated background glue. Generated host bootstrap tracks only DB clients it actually acquired and provides an idempotent disposal callback; never resolve an unused DB merely to close it. Add optional disposal to PluginServiceContext so generated service entrypoints can register owner-provided cleanup. Native caller-owned contexts stay untouched unless their host explicitly supplies disposal.
4. Prisma cleanup covers every acquired client, deduplicated by identity, not only the health-check client. Standard sagas background wiring must dispose its acquired host DB context as well as shared KV. Implement at composition roots; do not close opaque caller resources from generic library stop methods.
5. OTel's SIGTERM flush must not Deno.exit ahead of the runtime drain. Its shutdown remains bounded and listener removal is retained.

## Design and slices

S1: subprocess regressions with real Redis proving retained handles and distinct clean/timeout exits; child bind address tests. S2: process contracts/lifecycle and service signal ownership, scoped gates. S3: generated role cleanup/ownership and docs, generator tests. S4: one full scaffold.runtime smoke with cleanup, gate/evaluation handoff.
No speculative lifecycle registry or new dependency; prefer callback contracts and existing shutdown hooks, Promise.withResolvers/AbortSignal/AsyncDisposableStack where useful.

## Gates and risks

Structured focused test/check/lint/fmt, affected package tests, quality:gate, JSR audits/doc-lint with baseline comparison, release:preflight, docs:accuracy. Full one-pass CLI scaffold.runtime E2E at the end because generated runtime glue changes. Leak-check and teardown preview before owned cleanup; preserve all foreign resources.
Risk: closing embedded shared resources -> process ownership and explicit disposal callbacks. Risk: hanging cleanup -> bounded cleanup, nonzero exit. Risk: fatal health disappearing -> retain existing grace before cleanup. Risk: losing in-flight work -> close stores after runtime drain, not at signal receipt. The deadline is measured monotonically from shutdown admission; no cleanup may reset it. A timed-out cleanup yields exit 2 rather than claiming handles closed.
No existing debt deepened; no broad refactor. Deferred: workers pause/delivery-budget feature, saga SSE log, all other milestone fixes.
