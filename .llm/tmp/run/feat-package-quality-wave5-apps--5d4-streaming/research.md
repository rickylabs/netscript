# 5d4 Streaming — Research

Run: `feat/package-quality-wave5-apps--5d4-streaming` · PR #37 · phase 1 of 2: RESEARCH ONLY.

Status: skeleton created; findings appended incrementally.

## Reused from prior run

Prior trace: `.llm/tmp/run/openhands/pr-37/run-27442077218-1/`. Summary claims "no artifact files" and false completion; measured findings retained and verified/refreshed below.

- [ ] 113 combined `deno doc --lint` errors for `./defer` + `./streams` + server streaming files (refresh).
- [ ] Abort gap: `createIncrementalStreamingResponse` only calls `signal.throwIfAborted()` in `cancel`.
- [ ] Cleanup: `sse.ts` has AbortController + keepalive cleanup.
- [ ] Private-type refs: `JSXInternal`, `WatchableKv`, `KvKey`, `ComponentChildren`.
- [ ] Divergence: prior run found only 3 files importing streams packages; supervisor hint says ~27 fresh files reference plugin-streams. **VERIFY and resolve.**

## MEASURE-FIRST

### Scope

Measure directly:
- `packages/fresh/defer/mod.ts`
- `packages/fresh/streams/mod.ts`
- `packages/fresh/server/sse.ts`
- `packages/fresh/server/stream.ts`
- `packages/fresh/server/stream-error-boundary.tsx`

Also:
- `deno check --unstable-kv` over the package entrypoints.
- Over-cap inventory (F-1 layer caps) for the above surfaces.
- Private-type refs (exact symbols + sites).

### doc-lint baseline

TODO: run `deno doc --lint` per file and record counts/categories.

### deno check

TODO: run `deno check --unstable-kv` on relevant entrypoints.

### Over-cap inventory

TODO: list files > layer cap with sizes.

### Private-type refs

TODO: exact symbols, locations, proposing re-export fix.

## Abort / cleanup / backpressure audit

TODO: per-surface table:

| Surface | File(s) | AbortSignal propagation | Backpressure | Disconnect cleanup | Gap |
|---------|---------|------------------------|--------------|--------------------|-----|
| DeferIsland | `defer/` | TODO | TODO | TODO | |
| DeferPage | `defer/` | TODO | TODO | TODO | |
| policy.ts | `defer/` | TODO | TODO | TODO | |
| sse.ts | `server/` | TODO | TODO | TODO | |
| stream.ts | `server/` | TODO | TODO | TODO | |
| create-stream-db.ts | `streams/` | TODO | TODO | TODO | |

## Plugin-streams coupling map

Goal: exact exports of `@netscript/plugin-streams` and `@netscript/plugin-streams-core` consumed in `@netscript/fresh`, and resolution of the 3-vs-27 divergence.

TODO:
- [ ] grep for `@netscript/plugin-streams` imports in `packages/fresh/`.
- [ ] grep for `@netscript/plugin-streams-core` imports in `packages/fresh/`.
- [ ] grep for `sdk/streams` references (supervisor hint).
- [ ] compare with Wave 4 merged surface.
- [ ] table: consumer file → imported symbol → usage.

## Telemetry baseline

- `defer/telemetry.ts` current spans/events.
- Missing TTFB / chunk timings.
- 5d1 cross-cutting convention alignment (dependent on PR #34).

TODO: read telemetry.ts; compare with market.

## Market comparison

TODO: React 18 / Next.js streaming + Suspense, TanStack Start streaming loaders, Remix `defer`.
Sources to capture in `.llm/tmp/docs/`.

## Drift candidates

See `drift.md`. Append-only entries `D-5d4-n`.
