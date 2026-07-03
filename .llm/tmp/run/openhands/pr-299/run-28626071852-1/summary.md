# PR #299 verification — docs(streams): reconcile reference with fail-loud reality, add createServiceStreamProducer + refetchInterval

Branch: `docs/pr-d-streams-query` · model: `openrouter/qwen/qwen3.7-max` · run: [28626071852](https://github.com/rickylabs/netscript/actions/runs/28626071852)

## Summary

Per-page verification of a docs-only PR. **All gates pass and every doc claim
matches source on this branch.** No API-shape mismatches found.

## Verdict

| Gate | Result |
| --- | --- |
| Docs-only diff (`origin/main...HEAD`) | ✅ PASS — only `docs/site/capabilities/streams.md`, `docs/site/reference/streams/index.md`, `docs/site/web-layer/query.md` |
| `deno task build` (from `docs/site`) | ✅ PASS — `308 files generated in 6.54 seconds`, exit 0 |
| `deno task check:links` | ✅ PASS — `18723 internal links across 131 pages — all resolve`, exit 0 |
| `deno task check:caveats` | ✅ PASS — `30 caveat markers across 23 pages — all references resolve`, exit 0 (no Windows path-sep bug on Linux CI) |

## Per-page verification

### `docs/site/capabilities/streams.md`

- **Manifest-helper accuracy.** Lines 32-38 state `defineStreamProducer().publish()` returns a **rejected** promise and `defineStreamConsumer().subscribe()` **throws** synchronously, both with `StreamUnsupportedOperationError`. Source `plugins/streams/src/public/stream-api.ts:49-50` (`Promise.reject(unsupportedStreamOperation('stream.publish'))`) and `:65-66` (`throw unsupportedStreamOperation('stream.subscribe')`) confirm exact behavior. **PASS.**
- **Service-surface redirect.** Line 40 callout ("Status — producers write via the core package; manifest helpers fail loud") and lines 190-195 production-note redirect to `@netscript/plugin-streams-core`. Matches reference page and source. **PASS.**
- **Producer pipeline description.** Lines 23-28 reference `defineStreamSchema`, `createDurableStream`, and `createServiceStreamProducer` writing to Aspire port `:4437`. Consistent with `packages/plugin-streams-core/src/application/create-service-stream-producer.ts:71-82` and the capabilities page's own examples. **PASS.**
- **Voice / candor-register check.** `grep -niE "real and shipping today|genuine|candor"` → no matches. **PASS.** Candor-register framing absent.
- **HTTP/1.1 ~6-connection SSE caveat.** Lines 143-148 retain the "Local HTTP can limit concurrent stream consumers" warning: *"Under HTTP/1.1, browsers typically allow about six concurrent connections per origin…"* **PASS.**

### `docs/site/reference/streams/index.md`

- **Topic-authoring table.** Lines 36-43 correctly describe `defineStreamProducer` as *"the returned `publish()` **rejects** with `StreamUnsupportedOperationError`"* and `defineStreamConsumer` as *"the returned `subscribe()` **throws** `StreamUnsupportedOperationError` synchronously"*. Exact match vs. source lines `:49-50` and `:65-66`. The two are not presented as functional. **PASS.**
- **"Not yet wired" blockquote (lines 45-50).** Reiterates fail-loud behavior and points at `createDurableStream` / `createServiceStreamProducer` / `defineStreamSchema` from `@netscript/plugin-streams-core`. Consistent with capabilities page. **PASS.**
- **`createServiceStreamProducer` entry (line 136).** Signature `function createServiceStreamProducer(options): DurableStreamProducer`, description mentions `assertResolvable` default `true` and "a mis-wired Service **throws at construction** instead of silently dropping writes". Source `packages/plugin-streams-core/src/application/create-service-stream-producer.ts:71-82` confirms. **PASS.**
- **`ServiceStreamProducerOptions` entry (line 139).** "extends `DurableStreamProducerOptions`… `assertResolvable` fail-fast gate (default `true`)." Source `create-service-stream-producer.ts:15-29`: `extends DurableStreamProducerOptions<TDef>`, field `readonly assertResolvable?: boolean`, default applied at `:74`. **PASS.**
- **Exports.** `createServiceStreamProducer` (line 13) and `ServiceStreamProducerOptions` (line 25) both exported from `packages/plugin-streams-core/src/public/mod.ts`. Matches the reference's Internals section. **PASS.**
- **Documented example shape.** The code sample on the reference page (`streamPath`, `schema`, `producerId`) matches the inline JSDoc example in the source (`:51-69`) — same three fields on the options, same `producer.upsert(...)` / `await producer.flush()` usage. **PASS.**

### `docs/site/web-layer/query.md`

- **`IslandQueryOptions` table.** Lines 120-121:
  - `refetchInterval` typed `number | false`, description "Polling cadence in milliseconds… `false` disables polling. Defaults to `false`."
  - `refetchIntervalInBackground` typed `boolean`, description "Whether polling continues while the tab or window is backgrounded… Defaults to `false`."
  Source `packages/fresh/src/application/query/query-types.ts:102, 123, 128`: `refetchInterval?: number | false` and `refetchIntervalInBackground?: boolean`. **PASS** — types match exactly.
- **`refetchInterval` polling example (lines 164-195).** Uses `refetchInterval: 2_000` (valid `number`) and `refetchIntervalInBackground: true` (valid `boolean`), plus the "flip it to `false`" pattern. Both shapes are assignable against the source types. **PASS.**
- **`LoaderData` / `IslandQueryResult` API summary (lines 247-282).** No new claims to falsify; entries correspond to symbols declared in `packages/fresh/src/application/query/` and the root export. Spot-checked. **PASS.**

## Changes

Three documentation files updated:

1. `docs/site/capabilities/streams.md` — capabilities hub: fail-loud semantics for manifest helpers, production-notes redirect to core package, HTTP/1.1 connection caveat retained, candor-register phrasing absent.
2. `docs/site/reference/streams/index.md` — reference: topic-authoring table now accurately marks `defineStreamProducer`/`defineStreamConsumer` as stubs that reject/throw; `createServiceStreamProducer` and `ServiceStreamProducerOptions` added to the Internals section with correct `assertResolvable: true` default.
3. `docs/site/web-layer/query.md` — query page: `IslandQueryOptions` options table adds `refetchInterval: number | false` and `refetchIntervalInBackground: boolean` with matching `QueryIsland` polling example.

No source files, `deno.lock`, or non-docs assets touched.

## Validation

- `git diff --name-only origin/main...HEAD` → 3 doc files under `docs/site/` only.
- `cd docs/site && deno task build` → exit 0, 308 files, 6.54 s.
- `cd docs/site && deno task check:links` → exit 0, 18723 / 18723 internal links across 131 pages resolve.
- `cd docs/site && deno task check:caveats` → exit 0, 30 / 30 markers resolve on Linux CI.
- Source cross-checks: `plugins/streams/src/public/stream-api.ts`, `packages/plugin-streams-core/src/application/create-service-stream-producer.ts`, `packages/plugin-streams-core/src/public/mod.ts`, `packages/fresh/src/application/query/query-types.ts`.

## Responses to review comments

N/A — this is a fresh verification pass, no prior PR review thread to respond to.

## Remaining risks

- None identified for merge. All doc claims reconcile against source; build and link/caveat gates are green; `check:caveats` passes on Linux (the known Windows path-sep bug does not activate here).
- Minor housekeeping: if a follow-up source change ever flips `assertResolvable`'s default to `false`, both the Internals row on `reference/streams/index.md` and the capability page's `createServiceStreamProducer` blurb would need the same update. Not relevant to this PR.
