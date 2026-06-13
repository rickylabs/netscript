# Drift — 5d4-streaming

Append-only. Reality vs RFC/doctrine/plan divergences.

## D-5d4-1: prior run artifacts missing / completion claims false

The previous OpenHands run at `.llm/tmp/run/openhands/pr-37/run-27442077218-1/` hit the 500-iteration limit and produced no `research.md`, `design.md`, `plan.md`, `drift.md`, or `context-pack.md` files in the 5d4 run directory. Its `summary.md` claimed these artifacts were created and committed, which is false. Its *measured* findings (113 doc-lint errors, abort/cleanup gaps, private-type refs, 3-vs-27 streams coupling divergence) are real and are reused/verified in this run.

## D-5d4-2: 3-vs-27 plugin-streams coupling divergence (RESOLVED)

- Only `streams/create-stream-db.ts` inside `@netscript/fresh` imports from a streams package (`@netscript/plugin-streams-core`).
- The ~27 figure is the repo-wide count of direct `@netscript/plugin-streams-core` references across `packages/` and `plugins/`, not files inside `@netscript/fresh`.
- The supervisor hint likely meant "freshly authored streaming-surface files" rather than the `@netscript/fresh` package.

## D-5d4-3: private-type refs

Symbols leaking private/internal types into public API (measured via `deno doc --lint`):
- `JSXInternal` / `JSXInternal.Element` from `DeferPageProps.component` (type inferred from `JSX.Element` resolves to `JSXInternal.Element`).
- `WatchableKv` from `server/sse.ts` (`createKvWatchSSE` options).
- `KvKey` from `server/sse.ts` (`createKvWatchSSE` / `createKvPrefixWatchSSE` signatures).

Proposed fix direction (design phase):
- Re-export `WatchableKv` and `KvKey` from a public `@netscript/kv` subpath and import them into `@netscript/fresh/server/sse` through that public surface.
- Replace `component?: JSX.Element` in `DeferPageProps` with a framework-owned serializable type or accept `ComponentChildren` and document serialization constraints.

## D-5d4-4: abort/cleanup gaps

- `createIncrementalStreamingResponse` checks `signal` only in `cancel`; does not abort pending chunk renders mid-flight.
- `createSSEStream` owns a local `AbortController` but does not combine it with a request-level `AbortSignal`.
- `prewarmPartial` fires `fetch()` without abort or concurrency ceiling.
- No surface implements `ReadableStream` backpressure strategy.

## D-5d4-5: telemetry convention dependency on 5d1

- `defer/telemetry.ts` span names and attributes (`defer.prewarm.dispatch`, `stream.render`, etc.) are local to this package.
- 5d1 (PR #34) owns the cross-cutting telemetry vocabulary; any new TTFB/chunk telemetry should defer to that convention or be updated after merge.

## D-5d4-6: plan-phase doctrine verdict mismatch

- **What:** `@netscript/fresh` is marked **Restructure** in doctrine file 10, but 5d4 does not own the full restructure.
- **Source:** `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
- **Expected:** A restructure wave would migrate folders and split `builders/mod.ts` before streaming work.
- **Actual:** 5d4 only fixes streaming-related surface/lifecycle issues and keeps the existing folder layout.
- **Severity:** minor.
- **Action:** accept and record debt in `arch-debt.md` if the plan is approved; do not deepen existing violations.
- **Evidence:** plan.md §Current Doctrine Verdict, design.md §Doctrine baseline.

## D-5d4-7: open clock / timer port question

- **What:** Abort/cleanup tests need deterministic control of timers, but no shared clock port exists in `@netscript/fresh` today.
- **Source:** `server/sse.ts` uses `setInterval`-style heartbeat logic (or equivalent watch polling); `defer/telemetry.ts` uses `performance.now`.
- **Expected:** A doctrine-aligned adapter would accept a clock port rather than call `setInterval`/`Date.now` directly.
- **Actual:** Current code may inline timer / time reads; exact call sites to be verified during slice 2.
- **Severity:** minor (significant if timers are inlined in non-adapter files).
- **Action:** fix in slice 2 if call sites are in adapter files; record debt if the change is larger than one slice.
- **Evidence:** design.md §Ports / adapters, plan.md slice 2.
