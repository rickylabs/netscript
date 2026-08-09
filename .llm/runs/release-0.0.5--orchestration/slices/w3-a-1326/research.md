# Research — W3-A #1326 durable producer reconnect

## Re-baseline

- Carried-in sources: the slice `preflight.md`/`supervisor.md`, the inlined stable-cut contract,
  live issue #1326, and W2-B #1329's research, plan, PLAN-EVAL, runtime evidence, and shipped code.
- Re-derived against exact `origin/main@aa8e151e65939ecd789c82e45b22b6338a8d8ce8` on 2026-08-09.
  `HEAD`, `origin/main`, and their merge base all equal that SHA; the worktree was clean.
- `aa8e151e6` is the shipped versioned SSE/OTEL-envelope commit (GitHub PR #1395 implementing issue
  #1329). The brief's dependency SHA is correct even though the merge commit subject names PR #1395.
- Historical preparation metadata named a different branch/worktree and a Qwen evaluator. The live
  dispatch identity and mandatory Claude/Fable evaluator route supersede those fields.

## Live issue acceptance (quoted verbatim)

The live body of #1326 contains these seven unchecked rows:

1. “Initial and later transport failures enter a documented reconnect state.”
2. “Retry/backoff, cancellation, readiness, and shutdown semantics are explicit.”
3. “Buffer bounds and overflow behavior are explicit; writes are not silently lost.”
4. “The producer recovers when the stream server starts after the producer.”
5. “Tests cover initial outage, mid-session outage, recovery, event ordering, and shutdown during
   backoff.”
6. “OTEL spans/metrics expose connection state, retries, dropped/buffered events, and recovery using
   the standardized stream event envelope.”
7. “Operator messages never promise a transition the implementation cannot perform.”

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | How to verify                                                                                                                                   |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The defect is current: the constructor runs `#connect` once, failure latches `#connectError`, `#appendEvent` skips every later event, and nothing clears the error or schedules reconnect.                                                                                                                                                                                                                                                                                                                                                  | `packages/plugin-streams-core/src/application/create-durable-stream.ts`; initial-outage RED below.                                              |
| 2  | The current warning is factually false: it says writes are dropped “until reconnect,” but no reconnect transition exists.                                                                                                                                                                                                                                                                                                                                                                                                                   | Same file, connection warning and `#appendEvent`.                                                                                               |
| 3  | Buffering is unbounded before initial connection (`string[]`) and becomes unconditional drop after connection failure. `upsert`/`delete` return `void`, so the caller cannot learn that a write was rejected or lost.                                                                                                                                                                                                                                                                                                                       | Producer fields/method signatures and `StreamProducerPort`.                                                                                     |
| 4  | Mid-session append failures are not supervised. Upstream `IdempotentProducer.append()` is fire-and-forget; its failed worker removes the batch and only calls `onError(error)`, which carries neither the payload nor sequence needed for safe replay.                                                                                                                                                                                                                                                                                      | `deno doc --filter IdempotentProducer npm:@durable-streams/client@0.2.6`; cached `dist/index.js` batch worker.                                  |
| 5  | Reconstructing a new upstream producer after a failed batch cannot preserve exactly-once uncertainty: its constructor accepts an epoch but no starting sequence, while the failed instance has already advanced its private sequence.                                                                                                                                                                                                                                                                                                       | Upstream `IdempotentProducerOptions` and implementation.                                                                                        |
| 6  | The upstream `AppendOptions` declaration advertises `producerId`/`producerEpoch`/`producerSeq`, but `DurableStream.append()` 0.2.6 applies only `contentType`, `seq`, and `signal`. Building the fix on the declared producer fields would be a false gate.                                                                                                                                                                                                                                                                                 | `deno doc --filter AppendOptions`; cached client `#appendDirect`/`#sendBatch`.                                                                  |
| 7  | The upstream client exports the producer protocol header constants; the server uses the same wire names internally but does not export those constants from its 0.3.7 declaration surface. The server treats a repeated `(producerId, epoch, sequence)` as duplicate success, returns current epoch on stale-epoch 403, and reports sequence gaps on 409. A narrow adapter importing the constants from the client can therefore retain an exact serialized payload and identity until acknowledgement without inventing a second protocol. | `@durable-streams/client@0.2.6` exported `PRODUCER_*_HEADER` constants; `@durable-streams/server@0.3.7` `handleAppend` and `.d.ts` export list. |
| 8  | W2-B's envelope is sufficient and must remain authoritative: writes already capture `correlationId`, `messageId`, `traceparent`, and optional `tracestate`; replay commits only opaque control offsets; `streamClosed` is terminal. Producer reconnect needs no offset parsing or new SSE contract.                                                                                                                                                                                                                                         | `src/domain/sse-contract-v1.ts`, `src/application/stream-sse-v1.ts`, W2-B PLAN-EVAL “Contract completeness for W3-A”.                           |
| 9  | A producer write span currently ends during serialization, before network delivery. To prove one trace survives outage, the accepted-write telemetry handle must remain open across queueing, retry, and recovery and retain the same W3C headers on the serialized event.                                                                                                                                                                                                                                                                  | `src/telemetry/instrumentation.ts#publish`; `#publishHeaders`.                                                                                  |
| 10 | The telemetry package exposes tracer and meter ports plus an OTEL meter adapter; package-local fake ports can prove span events and counters without global state.                                                                                                                                                                                                                                                                                                                                                                          | `deno doc packages/telemetry/mod.ts`; `@netscript/telemetry/otel`.                                                                              |
| 11 | `create-flow-b-stream` already demonstrates how an external Deno gate registers an OTLP/HTTP provider from Aspire start metadata and queries dashboard traces. W3-A can use the same host-visible mechanism without touching #1398's missing worker mutation hook.                                                                                                                                                                                                                                                                          | `packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts`.                                                                     |
| 12 | The generated streams plugin owns publish probes, and the scaffold E2E surface already knows the exact `streams` Aspire resource and AppHost path. A focused reconnect probe can stop only that resource, start a producer probe, observe backoff, restart/wait, and query its trace.                                                                                                                                                                                                                                                       | `plugins/streams/src/e2e/probes/publish.ts`, `streams-gates.ts`, CLI E2E `runtime-gates.ts`/`cli-surface.ts`.                                   |
| 13 | #1398 remains a separate defect: worker job executions are not published because `setMutationHook` wiring is absent. The deferred `behavior.otel.stream-consumer` and `behavior.otel.traces` gates are not evidence for this slice and must not be re-enabled.                                                                                                                                                                                                                                                                              | W2-B `runtime-gate.md`/`context-pack.md`; dispatch boundary.                                                                                    |
| 14 | Current focused producer/service tests pass but do not assert reconnect, bounded buffering, mid-session failure, recovery ordering, overflow, or backoff cancellation.                                                                                                                                                                                                                                                                                                                                                                      | Baseline focused command below: 5 passed, exit 0.                                                                                               |

## Initial-outage RED reproduced before planning

A desired-behavior `deno eval` constructed the producer against a fetch that returned HTTP 400, then
brought that fetch online, wrote an event through the same producer, and awaited `flush()`. The
current producer logged that reconnect would happen, skipped the event, and rethrew the latched
initial error. Raw exit code: **1**. This is diagnostic evidence only; S1 will add named committed
tests and record an individual raw exit 1 for every required behavior before implementation.

## Baseline gates

| Gate                                                          | Raw exit | Result                                                                                                                                                                                    |
| ------------------------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused current producer/service tests                        |        0 | 5 passed; none exercises reconnect semantics.                                                                                                                                             |
| Full export-map `doc:lint`                                    |        0 | Combined total 0. The wrapper displays entrypoint-local private-type observations but deduplicates to zero combined diagnostics.                                                          |
| Raw package `deno publish --dry-run --allow-dirty --no-check` |        0 | Success; intended 26-file surface; no actual slow-type diagnostic.                                                                                                                        |
| JSR helper audit                                              |        0 | One `F-JSR-7` warning caused by counting the “Checking for slow types” banner. Per `netscript-tools`, raw dry-run output is authoritative; this is a helper false positive, not a waiver. |

## jsr-audit surface scan

- Surface scanned: `.`, `./sse`, `./telemetry`, and `./testing`, plus `deno.json` metadata, publish
  include/exclude rules, README/module docs, symbol docs, ESM shape, and raw dry-run file list.
- Current raw publish surface is clean. Planned root exports add explicit lifecycle, policy,
  receipt, outcome, and readiness types with explicit annotations/JSDoc. No new subpath is planned.
- Risks: a private transport/clock type leaking through `DurableStreamProducerOptions`, receipt
  promise outcomes inferred without explicit types, or a new symbol missing JSDoc. S1 owns the
  explicit public declarations; full-export doc lint and raw publish dry-run run after every export
  slice and again at handoff.
- The existing helper warning is recorded but cannot justify `--allow-slow-types`.

## Doctrine and debt

- Archetype 3 Runtime/Behavior is the smallest truthful profile: this package owns lifecycle, retry,
  cancellation, ordering, buffering, delivery, and telemetry. There is no frontend/service overlay
  for product design; Aspire is runtime proof, and run/README updates are harness/public contract
  evidence rather than a separate docs changeset.
- Chapter 10 does not list `plugin-streams-core` separately; new code must meet the Archetype-3 bar
  while the `-core` package remains the runtime owner under the thin-plugin split.
- Exact accepted debt 1: `packages/plugin-streams-core — AP-13 console.warn runtime reporting`. This
  issue's structured telemetry/operator-message acceptance owns removing the producer's
  `console.warn` calls. The row may be closed only if the file is console-free and structured
  reporting is proven; no other AP-13 debt is generalized from it.
- Exact accepted debt 2:
  `plugins/streams — connector SOUND convergence deferred
  (streams-connector-sound-deferred)`. It
  remains untouched and open; the reconnect runtime does not redesign the transparent proxy or
  `createPluginService` raw-route seam.

## Open questions closed by the plan

- Bounded policy: finite attempts per connection/delivery operation; exhaustion is terminal and
  visible, not an infinite background loop.
- Buffer policy: FIFO, bounded by both event count and serialized bytes, reject-newest on overflow.
- Caller knowledge: every write returns a receipt whose completion settles delivered, rejected,
  cancelled, or delivery-unknown; no accepted write vanishes without settlement.
- Shutdown: `stop()` is immediate local cancellation without `streamClosed`; `close()` is graceful
  drain plus acknowledged remote terminal close. Only successful `close()` implies `streamClosed`.
- Trace identity: one write span remains open through the outage and recovery; retries add events to
  that same span, and the serialized envelope retains its original W3C identity.
