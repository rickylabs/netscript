# PLAN-EVAL — fix-stream-db-recovery-2079--urgent-canary

- Plan evaluator session: opencode CLI evaluator session, 2026-10-07 (fresh independent session; generator is gpt-6.1-sol high, OpenAI family — evaluator is opencode-go/glm-5.3-flash, distinct session and vendor family; independence invariant satisfied)
- Route: requested `opencode-go/glm-5.3-flash` (owner-explicit, effort max, per `supervisor.md`); observed opencode-go/glm-5.3-flash in this session; no fallback
- Workload tier: feature (plan-protocol repair policy: max two cycles; evaluator edits a fixable plan on cycle two — not needed)
- Exact HEAD: `d1848c4e1847c17e98ea58854ad85234b562bcee` (branch `fix/stream-db-recovery-2079`; parent `6f6cbdf030d7595d1730272d0a74aedd66625069` is verified current `main` tip; the only branch commit records run design — no source divergence from main)
- Run: fix-stream-db-recovery-2079--urgent-canary (issue #2079)
- Surface / archetype: `packages/fresh` stream factory + designed recovery adapter; ARCHETYPE-3 (runtime/behavior)
- Scope overlays: frontend consumer contract overlay (browser gates N/A — no page/component change)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; run is fresh off current `main` (supervisor baseline equals verified `main` tip; no carried-in plan). Load-bearing findings independently spot-checked against the tree and installed upstream source (see sweep below); all hold for the locked installs (`@durable-streams/state@0.3.1`, `@durable-streams/client@0.2.6` — the 0.3.1↔0.3.2 `stream-db.ts` delta is one cast, so 0.3.2-cache readings apply; client 0.2.6 read directly). |
| Decisions locked                        | PASS   | `plan.md` final three plan paragraphs + `worklog.md` `## Design`: lifetime retention of one StreamDB/collections; supervision only at the public read seam (native `DurableStream` instance passed into upstream `createStreamDB({stream, state})`, which the source publicly supports); no private SDK/second dispatcher; owned preload/stop/dispose with close delegation and recovery-controller cancellation; owned reconnect options with validation rules; inner fetch `maxRetries: 0` (public `backoffOptions.maxRetries` exists and defaults to `Infinity` — verified, so zeroing is required and feasible for one owned budget); empty-batch liveness semantics; checkpoint advances only after subscribed batch callback returns successfully with no cancellation; failure classification (transport/missing-stream/429/5xx recoverable; auth, schema/protocol/payload, invalid/expired offset, intentional `closed` terminal; `streamClosed: true` finishes, clean nonterminal close may retry); exhaustion rejects the supervised closed promise, startup exhaustion rejects preload; named internal state enum; identity = source URL + existing collection IDs; stop is aborting+idempotent; no new logs. |
| Open-decision sweep                     | PASS   | Evaluator-run sweep below — no unflagged decision forces rework when deferred. |
| Commit slices (< 30, gate + files each) | PASS   | 3 ordered slices in `plan.md` ("Slices"), each < 30 files: (1) contracts + recovery adapter + focused lifecycle/validation tests naming factory file, adapter, existing regression file (`create-stream-db_test.ts`), streams entry exports, proved by structured check/test/lint/fmt wrappers + per-test mutations; (2) real isolated server fixture + killed-child recovery and negative control in existing runtime tests, proved by runtime tests; (3) docs/JSDoc + generated carriers + package/consumer validation + mandatory independent IMPL-EVAL + current-head CI, no merge. Ordering follows the Archetype-3 slice shape (state/contracts → runner/supervisor proof → consumer integration). |
| Risk register                           | PASS   | Named risks + mitigations in `plan.md` final paragraph (resubscribe duplicates → post-callback checkpoint; stale mounted collections → identity regression; nested retries → inner zero-retry; auth/protocol retry loop → classification negative tests; cancellation timer leak → stop test; observer exceptions → terminal, not transport; kill-test flake → read-ready handshake + bounded eventual assertions). Independent risk analysis found no unnamed risk: the upstream seam merges subscriber-callback exceptions into the session error path, which is exactly the covered observer-exception risk given the wrapper owns the callback seam. |
| Gate set selected                       | PASS   | Per archetype-gate matrix (Arch 3 + overlays), scripted: scoped structured check/lint/fmt wrappers; package `doc-lint` (covers `src/runtime/streams/mod.ts`); `fresh publish dry-run`; `quality:gate` (= `quality:scan` + `arch:check`); carriers/export corpus; owned stream DB type-consumer fixture (`check:streams-types`, exists at `packages/fresh/tests/type-fixtures/`); plugin adapter compatibility (stream factories unchanged, additive-only compat proof); runtime gate list (kill, startup missing-stream recovery, bounded exhaustion, permanent failure, stop during backoff/active read, checkpoint); browser gate N/A with reason; CLI runtime CI deferred to existing label policy. "Missing Docker recorded honestly" contingency noted; the planned fixture needs no Docker (in-process/child Deno server, OS-bound port — repo precedent using `DurableStreamTestServer` exists under `plugins/streams/tests/`). |
| Deferred scope explicit                 | PASS   | Explicit: no UI status/liveness hook (deferred; issue lists it only as an example, and a later getter is additive — no rework), no full-log replay/stream-recreation policy (fail closed when retained offset rejected), shared dependency maintenance deferred to a separate owner PR, plugin factories untouched, no Docker/scaffold scope. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Applied to the planned surface in `plan.md` ("JSR planned-surface audit"): export map unchanged; named owned types added through the existing `@netscript/fresh/streams` export barrel (verified in `packages/fresh/deno.json` export map); explicit readonly signatures + JSDoc examples; no upstream re-export or private-type leak; slow-type detection via publish dry-run + entry doc lint; risks named before slicing. Manual evidence (Phase A reporting: PASS with manual evidence at plan stage). |

## Open-decision sweep (evaluator-run)

Findings, all safe to defer (none would force rework):

1. Numeric default values for `maxRetries`/`initialDelayMs`/`maxDelayMs` are not pinned — names, validation rules (`nonnegative integer retries`, `finite positive delays`, `max >= initial`), and the bounded/capped behavior are locked; concrete constants are option-shaped and slice-1 tests parameterize over them.
2. Jitter in the owned backoff is unspecified — deterministic capped exponential is actually preferable for the planned delay-cap tests; upstream full jitter remains an implementation nuance.
3. Supervision does not extend to custom-`createStreamDB` factories (passthrough stays compatible) — explicitly locked, matches the issue's scope at `createNetScriptStreamDB`, and the existing regression test pins custom-factory behavior.
4. Exact shape of close delegation on the owned handle — internal additive detail; the public contract stays the same interface shape plus optional owned hooks.
5. Status/liveness getter — deferred with an explicit no-rework rationale.

## Upstream spot-check evidence (public seams, installed source)

- `state` `stream-db.ts`: one-shot consumer via `consumerStarted` latch set in `startConsumer` (first `preload`) and never reset; failure routes only to `dispatcher.rejectAll`; collections are stable (`gcTime: 0`, no cleanup) — the permanent-silence diagnosis and "reopen read sessions, never rebuild collections" design are correct.
- `CreateStreamDBOptions.stream` accepts a pre-existing `DurableStream` to reuse — the wrap-the-instance route needs no private access and no second dispatcher.
- `client` `stream.ts`: `stream()` merges handle-level `backoffOptions` (constructed via `StreamOptions.backoffOptions`) and passes per-call `offset` + `signal` through to the session — resume injection at the `stream` method is publicly implementable. Note for implementation: inner zero-retry must be set at `DurableStream` construction (handle-level), which the plan's owned-construction route already does.
- `client` `response.ts`: `subscribeJson` awaits the subscriber (sync/async) and routes exceptions into the session's error path; `#ensureNoConsumption` binds one subscription per response — "first response subscription/closed seam" checkpoint interception is implementable, and per-session resume matches sequential-session semantics.
- `client` `types.ts`/`error.ts`: public error taxonomy (`FetchError.status`, `DurableStreamError.code`: `NOT_FOUND`, `RATE_LIMITED`, `BUSY`, `UNAUTHORIZED`, `PARSE_ERROR`, `STREAM_CLOSED`, …) supports the locked retryable-vs-terminal classification, and `streamClosed` metadata is public on batches/responses.
- `@durable-streams/server` `DurableStreamTestServer({ dataDir })` → `FileBackedStreamStore`: the killed-child fixture (kill child, restart endpoint on a fresh OS-bound port with the same store dir, retained event log, resumed offset without full replay) is implementable with public fixtures; negative control = recovery disabled.

Priority-scope check against issue #2079: the ask is bounded restart/reconnect/backoff/resume so a browser StreamDB cannot go permanently silent; the plan's automatic bounded supervision with terminal exhaustion surfacing through the supervised closed/preload promises covers the primary ask; the explicitly deferred status hook is one of the issue's optional examples and is additive later.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

N/A — all boxes checked.

## Notes

- Hard stop respected: no source files modified, no branch/worktree/PR changes made during this evaluation; workspace clean apart from run artifacts.
- PLAN-EVAL repair policy (feature tier): cycle 1 of max 2; PASS on first cycle, no plan edits needed; nothing preserved-corrected.
- Implementation must not begin before the generator picks this verdict up; IMPL-EVAL remains mandatory and independent (slice 3 names it; owner explicit route noted in `supervisor.md`).
