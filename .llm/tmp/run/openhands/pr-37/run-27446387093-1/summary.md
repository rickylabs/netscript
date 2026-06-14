# OpenHands Run Summary — 5d4 Streaming Phase 1 (RESEARCH ONLY)

## Summary

Completed Phase 1 research for **Wave 5d sub-gate 4/6 (`@netscript/fresh` streaming)**. Scope: `packages/fresh/defer/`, `packages/fresh/streams/`, `server/sse.ts`, `server/stream.ts`, `server/stream-error-boundary.tsx`. Reused and verified the prior run's measured findings, resolved the 3-vs-27 plugin-streams divergence, and committed the research artifacts.

## Changes

- Refreshed and committed `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/research.md`:
  - MEASURE-FIRST table with per-entrypoint `deno doc --lint` counts.
  - Per-file private-type-ref symbol inventory.
  - Abort/cleanup/backpressure audit table for all scoped surfaces.
  - Plugin-streams coupling map resolving the 3-vs-27 divergence.
  - Telemetry baseline and market comparison (React 18/Next.js, Remix `defer`, TanStack Start).
- Refreshed and committed `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/drift.md` with entries D-5d4-1 through D-5d4-5.
- Committed refreshed raw doc-lint outputs for traceability.
- Commit: `584b8ff` on branch `feat/package-quality-wave5-apps-5d4-streaming`.

## Validation

### MEASURE-FIRST table

| Entrypoint | total doc-lint errors | missing-jsdoc | private-type-ref |
|------------|----------------------:|--------------:|-----------------:|
| `packages/fresh/defer/mod.ts` | 60 | 46 | 14 |
| `packages/fresh/streams/mod.ts` | 32 | 8 | 24 |
| `packages/fresh/server/sse.ts` | 3 | 0 | 3 |
| `packages/fresh/server/stream.ts` | 7 | 4 | 3 |
| `packages/fresh/server/stream-error-boundary.tsx` | 11 | 5 | 6 |
| **Combined** | **113** | **63** | **50** |

`deno check --unstable-kv` over the same entrypoints exits 0 (only Deno "No matching files found" warning, no type errors).

### Abort/cleanup/backpressure audit table

| Surface | File(s) | AbortSignal propagation | Disconnect cleanup | Backpressure | Gap |
|---------|---------|------------------------|--------------------|--------------|-----|
| DeferIsland | `defer/DeferIsland.tsx` | None (client form submit) | No effect teardown | N/A | Could abort in-flight fetch on unmount |
| DeferPage | `defer/DeferPage.tsx` | None in `prewarmPartial` fetch | No abort/timeout/concurrency ceiling | None | No AbortSignal/timeout on prewarm fetch |
| Deferred | `defer/Deferred.tsx` | N/A (Suspense-only) | N/A | N/A | No async lifecycle to clean up |
| policy | `defer/policy.ts` | N/A | N/A | N/A | No runtime lifecycle |
| SSE | `server/sse.ts` | Local `AbortController`; not merged with request signal | `cancel()` aborts controller and clears keepalive timer | `enqueue()` exceptions caught; no explicit strategy | Should accept request `AbortSignal` and `highWaterMark` |
| KV watch SSE | `server/sse.ts` | Local controller + `kv.watch({ signal })` | Cancels via signal; clears timer | None explicit | Non-AbortError rejection path needs audit |
| renderToStream | `server/stream.ts` | Caller `options.signal` forwarded to `renderStream.cancel()` | Removes listener; calls `cancel()` | Delegated to Preact stream | Does not pass `signal` into `renderToReadableStream` itself |
| createStreamingResponse | `server/stream.ts` | Caller `options.signal` | Same as renderToStream | Same as renderToStream | No request-signal auto-wire |
| createIncrementalStreamingResponse | `server/stream.ts` | Caller `options.signal` | Only `signal.throwIfAborted()` in `cancel` | None; chunks settled via `Promise.race` can pile up | **Critical gap**: signal never checked during streaming; no abort of pending chunk renders |
| create-stream-db | `streams/create-stream-db.ts` | N/A | N/A | N/A | Transport owned by `@durable-streams/state` / plugin-streams-core |

### Reused from prior trace

Reused `.llm/tmp/run/openhands/pr-37/run-27442077218-1/` measured findings:
- 113 combined `deno doc --lint` errors (verified and refreshed above).
- `createIncrementalStreamingResponse` only calls `signal.throwIfAborted()` in `cancel` (verified).
- `sse.ts` has `AbortController` + keepalive cleanup (verified).
- Private-type refs: `JSXInternal`/`JSXInternal.Element`, `ComponentChildren`, `WatchableKv`, `KvKey` (verified and expanded).
- The prior run's claim of committed artifacts was false; this run created/committed them.

### Divergence resolved

The "3 vs ~27" plugin-streams reference divergence is resolved:
- Inside `@netscript/fresh` only **1 source file** (`streams/create-stream-db.ts`) imports from a streams package (`@netscript/plugin-streams-core`).
- The **~27** figure is the repo-wide count of direct `@netscript/plugin-streams-core` references across `packages/` and `plugins/`, not files inside `@netscript/fresh`.

## Remaining gaps (Phase 2 design)

1. Design exact public-type fixes for `JSXInternal`, `WatchableKv`, `KvKey`, `ComponentChildren` without umbrella drift.
2. Propose abort/backpressure integration for `createIncrementalStreamingResponse` and `createSSEStream`.
3. Define TTFB/chunk-timing span vocabulary aligned with 5d1 telemetry conventions.
4. Decide whether `@netscript/fresh/streams` should route through `sdk/streams` or keep direct `plugin-streams-core` import.
5. F-1 layer-cap split candidates: `server/sse.ts` (408 lines), `defer/DeferPage.tsx` (264), `defer/DeferIsland.tsx` (240).

RESEARCH COMPLETE — READY FOR DESIGN TRIGGER

@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=800 use harness

PHASE 2 of 2 — DESIGN + PLAN for [5d4 streaming]. Authority docs on this branch: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d4-plan.md` + BINDING umbrella `plan.md` in the same dir. REUSE the committed phase-1 research at `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/research.md` — do not re-derive it. Deliver `design.md` + `plan.md` + `context-pack.md` and update `drift.md` (entries `D-5d4-n`), committed to this branch per the handover's expected-output spec; `plan.md` MUST end with: Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger. WRITE-EARLY CONTRACT: create skeleton files within your first ~15 actions, append incrementally, consolidate at ~60% budget. Hard rules: PLAN only — zero implementation; no lockfile changes; no `deno cache --reload`. On success END your summary with this exact PLAN-EVAL trigger block (on failure: blockers, no trigger):

@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

PLAN-EVAL (separate evaluator session) for [5d4 streaming] per `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/archetype-gate-matrix.md`: evaluate `research.md`/`design.md`/`plan.md` in `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/` on this branch against the BINDING umbrella plan. Commit `plan-eval.md` to that run dir. Your summary MUST end with the verdict line `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` plus numbered findings. Evaluation only — zero implementation, zero plan edits.
