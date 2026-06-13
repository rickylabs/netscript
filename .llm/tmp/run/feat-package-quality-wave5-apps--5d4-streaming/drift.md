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

## D-5d4-7: clock / timer port question (RESOLVED)

- **What:** Abort/cleanup tests need deterministic control of timers, but no shared clock port exists in `@netscript/fresh` today.
- **Source:** `server/sse.ts` uses `setInterval`-style heartbeat logic (or equivalent watch polling); `defer/telemetry.ts` uses `performance.now`.
- **Expected:** A doctrine-aligned adapter would accept a clock port rather than call `setInterval`/`Date.now` directly.
- **Actual:** Current code may inline timer / time reads; exact call sites to be verified during slice 2.
- **Severity:** minor.
- **Resolution:** Supervisor decided to lock the default — use a **local fake-timer/clock test helper inside `packages/fresh`** for stream tests, and promote it to a shared `./testing` utility **only if a later unit (5d5/5d6) needs it**.
- **Action:** recorded as locked decision `L-5d4-7` in `plan.md`; update the drift entry to RESOLVED; implement the local helper during slice 3/4 if needed.
- **Evidence:** design.md §Ports / adapters, plan.md §Locked Decisions (L-5d4-7) and §Open-Decision Sweep.

## D-5d4-8: root `deno.json` excludes entire `@netscript/fresh` package from JSR publish

- **What:** `packages/fresh/` is listed in the root `deno.json` `"exclude"` array, which blocks JSR publishing with `error[excluded-module]` on every module reachable from the package exports.
- **Source:** `/home/runner/work/netscript/netscript/deno.json` line 12; committed dry-run artifact `jsr-dry-run-package-fresh.txt` shows 58 `excluded-module` findings.
- **Expected:** A publishable workspace member is not excluded at the workspace root; file-level filtering is done by the package's own `publish.include/exclude`.
- **Actual:** 58 publishability errors prevent a clean `deno publish --dry-run` for `@netscript/fresh`.
- **Severity:** blocking.
- **Resolution:** Locked decision `L-5d4-8` — remove `packages/fresh/` from root `deno.json` `exclude`; rely on `packages/fresh/deno.json` `publish.include/exclude` for publish filtering.
- **Action:** Slice 7 removes the root exclusion and verifies root tasks still resolve fresh; dry-run must report 0 `excluded-module` errors.
- **Evidence:** design.md §JSR-audit findings; plan.md §Commit Slices (Slice 1) and §JSR-Audit / Over-Cap Budget Reconciliation.

## D-5d4-9: JSR slow-type findings in `form/` and `query/` surface files

- **What:** Package-level `deno publish --dry-run` reports 4 `missing-explicit-return-type` slow-type errors in files outside the streaming core: `form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, and `query/query-island.tsx`.
- **Source:** Committed dry-run artifact `jsr-dry-run-package-fresh.txt`.
- **Expected:** All exported public API symbols have explicit return types (JSR "No slow types" requirement).
- **Actual:** 4 exported functions rely on inferred return types.
- **Severity:** blocking for JSR F-6 gate.
- **Resolution:** Locked decision `L-5d4-9` — fix the 4 slow types inside 5d4 as a fresh-wide publishability sweep (one-line explicit return types, no behavior change).
- **Action:** Slice 9 adds explicit return types and re-runs `deno publish --dry-run --allow-dirty` until clean.
- **Evidence:** design.md §JSR-audit findings; plan.md §JSR-Audit / Over-Cap Budget Reconciliation.

## D-5d4-10: upstream type leakage through `@netscript/fresh/streams` public surface

- **What:** `deno doc --lint` attributes 32 upstream errors (`@tanstack/react-db` and `@durable-streams/state`) to `@netscript/fresh` because its `streams/` surface re-exports or exposes upstream types with private/internal references and missing JSDoc.
- **Source:** Committed artifact `doc-lint-raw.txt`; upstream `.d.ts` files under `/home/runner/.cache/deno/npm/`.
- **Expected:** Public package surface wraps or aliases upstream dependencies; consumers do not depend on internal upstream types.
- **Actual:** Raw upstream types leak through the public API, producing `private-type-ref` (24) and `missing-jsdoc` (8) errors counted against `@netscript/fresh`.
- **Severity:** blocking for F-5/F-7.
- **Resolution:** Slice 6 wraps the upstream query/DB helpers with local public types and JSDoc. If wrapping is infeasible for a symbol, stop re-exporting it and record debt.
- **Action:** Implement local wrappers in `streams/mod.ts` / `streams/create-stream-db.ts`; re-run `deno doc --lint` on `packages/fresh/streams/mod.ts` until 0 upstream-related errors remain.
- **Evidence:** plan.md §Doc-Lint Budget Reconciliation (Slice 6 bucket) and §Commit Slices (Slice 6).
