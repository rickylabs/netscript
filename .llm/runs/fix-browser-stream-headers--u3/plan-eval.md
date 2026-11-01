# PLAN-EVAL Verdict — U3 caller-provided stream headers (fix/browser-stream-headers @ `1582e1c9e`)

## Verdict: **PASS**

## Scope/type decision
Feature-tier PLAN-EVAL (this session: glm-ai/glm-5.3, provider_default — distinct from the Fable generator family). Plan + root addendum read in full; addendum governs conflicts and is applied. Forwarding primitive only — no issuer/login/pairing/token-URL/generic-proxy/disable-browser design reopened; S16 and ordinary-browser/CEF authentication remain excluded, separate work.

## Plan-gate checklist (all boxes checked — `gates/plan-gate.md`)
- [x] **Research present and current** — `.llm/runs/fix-browser-stream-headers--u3/research.md` exists (76 lines), re-baselined at HEAD `1582e1c9e`; load-bearing rows spot-checked against current tree (below).
- [x] **Decisions locked** — absence-only legacy (`options.headers === undefined ? getStreamsAuth() : options.headers`), replace-not-merge, per-header `string | (() => MaybePromise<string>)` reusing native `HeadersRecord`, `null` = compile error, no serializer/copy/eager resolution; rationale cites native resolver (`client@0.2.7` `resolveHeaders` awaited per `#buildRequest`; `#buildRequest` at dist 3082-3090 confirmed in packet).
- [x] **Open-decision sweep** — §8's three "must resolve now" items (port widening, two new test owners + temp-dir compiler-control shape, permission-scoped env-denied) are all explicitly resolved by the root addendum (accept widening with migration note; accept owners/temp-dir; accept `Deno.test` env-denied scope). No unflagged deferred decision forces rework.
- [x] **Commit slices** — C1→C2→C3 ordered; each names proofs, files, and proving gates. Native 15-path table is **superseded** by the addendum's normative footprint (below) — correctly reconciled, not contradictory.
- [x] **Risk register** — §6 (JSR slow types under `isolatedDeclarations`, browser consumer fixtures, `docs/site/reference/fresh/index.md` as stop/rescope, workers temp-file workspace-resolution preflight with owned fallback), §1 port migration risk with explicit external serializing-adapter break + migration statement. Honest: research.md:36-39 states the widening is a source compatibility risk, not universally nonbreaking.
- [x] **Gate set** — focused leaf test/check/doc-lint/publish:dry-run/docs gates plus final `quality:gate` and full CLI E2E (`scaffold.runtime --cleanup`), explicitly **not waived**, all UNRUN/proposed.
- [x] **Deferred scope explicit** — U1/U2/U4/sagas/triggers/auth/versions/releases/locks/issuer/TTL/workspaces excluded; rollback via revert of C1–C3 (§7).
- [x] **jsr-audit rubric applied** — slow-type risk named for the widened port (npm type under `isolatedDeclarations`); no new exported symbol → no new doc-lint symbol; JSDoc budgeted; workers publish proves `@durable-streams/client` via `package.json` catalog (`catalog:` line 3 confirmed).

## Direct source spot-checks (load-bearing claims verified)
- `create-stream-db.ts:74` `headers: Record<string, string>`; `:150` `headers: getStreamsAuth()`; `:168` `...input.streamOptions` spreads by reference — packet matches source byte-for-byte (212-line file).
- `create-stream-db_test.ts` = **exactly 336 physical lines** (verified); addendum's 336+210=546 > doctrine test boundary — extraction is required, not optional.
- Doctrine boundary confirmed: `09-anti-patterns-and-fitness-functions.md:268` ("no `_test.ts` exceeds 500 LOC") and `04-modules-and-helpers.md:178` (~300 flag / ~500 boundary). ≤480 aim is compliant. (The "F10" label is not literal in doctrine text; the substantive 500-line test limit it cites is real and correctly applied.)
- `stream-url-resolver.ts`: `getStreamsAuth` throws on denied env with no secret; `buildStreamUrl(path, baseUrl)` with explicit `baseUrl` never calls `getStreamsUrl()` — plan's env-denied shapes are semantically accurate.
- `plugins/workers/deno.json` declares `@std/async` (^1) → bounded `delay(25)` long-poll, no zero-delay busy loop; `factory-discovery_test.ts:23-38` save/restore env pattern and `:17-21` public-handle shape checks exist as cited.
- `packages/fresh/tests/_fixtures/` exists (`stream-db-server.ts` present) — extraction target is real; new `tests/streamdb-headers-contract_test.ts` enters the authored `test`/`fmt` discovery (`./tests`, `./tests/_fixtures`) and stays excluded from publish (deno.json publish excludes `tests/`).
- `streamdb-consumer-deno.json`: `isolatedDeclarations: true`, `workspace: []`, `@netscript/fresh/streams → ../../src/runtime/streams/mod.ts` resolves relative to config — child `--no-lock` vs parent `--frozen` distinction is real and correctly kept separate.

## NetScript documentation tool call + index qualification
`search_docs` ("createNetScriptStreamDB streamOptions headers reconnect durable streams factory") **does** return a streams page — `pages/durable-workflows/streams` (plus `pages/reference/plugin-streams-core`). This qualifies the plan's older "no streams-factory page" claim: no *Fresh factory-API* page exists, but the durable-workflows streams guide is indexed. Substantively harmless — that page documents the SSE binding's header limits, not Fresh StreamDB factory header/recovery semantics, so local-source authority stands, and the page is already owner 9's docs target gated by `docs:links`/`docs:accuracy`/`docs:snippets`. Recorded as qualification, not a gap.

## Normative footprint (approved bounds)
- **9 product/test/doc owners**: `create-stream-db.ts` (+18/−8), `plugins/workers/streams/factory.ts` (+12/−2), `create-stream-db_test.ts` (extraction/imports only, assertions unchanged), NEW `tests/streamdb-headers-contract_test.ts` (**≤480 physical lines**, all new runtime + compiler controls), NEW `tests/_fixtures/stream-db-test-runtime.ts` (extracted `startReferenceServer`, fixed `import.meta.url` anchors only), `type-fixtures/streamdb-wrapper_type.ts` (positive only), NEW `plugins/workers/tests/streams/factory-headers_test.ts` (real requests + compiler control), `live-query-consumer_type.ts` (positive only), `docs/site/durable-workflows/streams.md` (+18).
- **Total 22** prospective (9 + 8 current run owners + 5 reserved review owners). **Incidental `mod.ts` comment owner DROPPED** per addendum (stale "plugin factories call this" comment may remain; not a blocker).
- **Conditional 23rd** (`docs/site/reference/fresh/index.md`) pre-authorized ONLY on a retained, real `docs:exports-drift`/`docs:accuracy` parity failure with receipt — no speculative edit.
- Unchanged by design: `stream-db-recovery-adapter.ts`, `_fixtures/stream-db-server.ts`, `streamdb-consumer-deno.json`, all deno.json/package.json/locks.

## Risk/negative-test adequacy
Real native request/poll/reconnect rotation (v1→v2→v3 at retained checkpoint `!== '-1'`, collection identity, `live`→`stopped`), lazy callbacks (zero calls before first request; counters unchanged after construction), explicit `{}` replaces env auth / absent selects legacy, env-denied explicit-success + absent-denial, plain `Error` terminal vs `TypeError` recoverable bounded by `maxRetries`, no ambient fallback, `sanitizeOps`/`sanitizeResources`/exit sanitizers retained, cleanup on all paths. Paired compiler controls: 1 positive + 3 negatives (`1`, `() => 1`, whole-map) fail TS2322 with `MaybePromise<string>`/`HeadersRecord`, without TS2307/TS2305, no cast/suppression/`any`, temp dirs removed in `finally` and outside default discovery/publish. Existing assertions not weakened. No hand-written transport. Adequate.

## Exclusions and remaining conditions
- All quality/publish/docs/consumer/full-CLI-E2E merge gates remain **UNRUN/proposed**; no implemented result or current-source CI acceptance is claimed for proposed code.
- Root must read this actual PASS before C1; this verdict authorizes the plan only — not implementation, not release. No new debt entry; widening recorded as drift.
- No true plan gaps found. One documentation qualification (stale search-index claim, above) noted for `worklog.md`; it does not require a plan edit cycle.

**Tool/source coverage:** 3 packets read complete, no truncation (188/969/455 lines); direct reads: `mod.ts` (1-60 of 98), `create-stream-db.ts` (1-200 of 212), `create-stream-db_test.ts` (all 336), `factory-discovery_test.ts` (all 38), `research.md` (all 76); doctrine 04:178, 09:20/203/243/268; 1 MCP doc call (`search_docs`) + packet-cited native excerpts. Coverage sufficient for verdict.