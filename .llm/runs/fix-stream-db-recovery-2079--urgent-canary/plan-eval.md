# PLAN-EVAL — fix-stream-db-recovery-2079--urgent-canary (cycle two, re-steered)

- Plan evaluator session: opencode CLI evaluator session, 2026-10-07 cycle two (same independent evaluator session re-steered per feature-tier policy; generator gpt-6.1-sol high, OpenAI family — evaluator opencode-go/glm-5.3-flash independence invariant still satisfied)
- Route: requested `opencode-go/glm-5.3-flash` (owner-explicit, effort max, per `supervisor.md`); observed opencode-go/glm-5.3-flash; no fallback
- Workload tier: feature (repair policy: max two cycles; evaluator may edit a fixable plan on cycle two — see verdict note)
- Exact HEAD: `58933e57c488e87764ffd45c7c3978ab257bc348` (branch `fix/stream-db-recovery-2079`; first-pass round-1 evaluated `d1848c4e`; intervening commits `9f2da9c3d` + `58933e57` touch run artifacts only — verified with `--stat`; the WIP recovery-adapter source under `packages/fresh/src/runtime/streams/`, `packages/fresh/deno.json`, and `deno.lock` is uncommitted working-tree state, was not committed, not evaluated here, and must stay so until a gated slice)
- Run: fix-stream-db-recovery-2079--urgent-canary (issue #2079)
- Surface / archetype: `packages/fresh` stream factory + designed recovery adapter; ARCHETYPE-3 (runtime/behavior)
- Scope overlays: frontend consumer contract overlay (browser gates N/A — no page/component change)
- Round-1 report preserved verbatim as `plan-eval-round1.md` before writing this final report

## Revised decision under review (bounded to the changed decision)

Round-1's locked seam (supervising the first response `subscribeJson`/`closed`) is withdrawn: implementation probes showed native `closed` can settle before batch processing. The revised plan locks a different public seam: each native finite session is consumed through `StreamResponse.json()`'s completion promise (direct parse rejection), native `live:false` prevents prefetch beyond catch-up, and after the first up-to-date catch-up the public `StreamOptions.params` bag supplies `live=long-poll` for each subsequent finite read. Checkpoint advances only after `json()` resolves AND the owned batch callback returns successfully with no cancellation; final session metadata (offset/cursor/upToDate/streamClosed) is read from public getters after resolution; native `closed` is attached only as a no-op rejection guard, never used to choose resume.

## Independent verification against installed `@durable-streams/client@0.2.6` (public seams)

| Resteer-required check | Result | Source evidence (installed client 0.2.6) |
| ---------------------- | ------ | ---------------------------------------- |
| Withdrawn-seam race is real | CONFIRMED | `response.ts` `#createResponseStream` pull: for a non-SSE up-to-date first response, `#markClosed()` + `controller.close()` run at ENQUEUE time (before any consumer has read, parsed, or invoked a callback); `cancel()` also marks closed. `closed` is a session-lifecycle signal, not a batch-completion signal — round-1 design was unsound and the withdrawal is source-justified. |
| Native `json()` completion + catch-up drain | CONFIRMED | `response.ts` 918–959: async accumulator; reads responses until the response that was already `upToDate` when parsing started (prefetch-race-safe capture); parses with direct `DurableStreamError(PARSE_ERROR)` throw — rejection surfaces on `json()` itself, never only via `closed`; all parsed items accumulate into one array → one batch per finite read; sets `#stopAfterUpToDate`. |
| `live:false` prevents prefetch beyond catch-up | CONFIRMED | `stream-response-state.ts` `shouldContinueLive` (66–72): unconditional `false` for `liveMode === false` (plus `stopAfterUpToDate` and `streamClosed` guards); `response.ts` pull tail therefore closes the internal stream after the single response — a `live:false` session is exactly one bounded request/response. Catch-up json() resolves at the up-to-date boundary. |
| Public `params` bag → `live=long-poll`, appended after offset | CONFIRMED | `stream-api.ts` 133–147: first request sets `?offset` first, then applies `options.params` via `searchParams.set` — insertion order `offset` then params. `fetchNext` re-resolves params per request (only relevant post-first-read, which `live:false` sessions don't reach). |
| live/params ordering (no conflict/duplicate) | CONFIRMED | `stream-api.ts` 139–141: the native first request NEVER sets a live param ("Never set live on the initial request"); a live-less session therefore yields deterministic `?offset=…&live=long-poll` from the params bag alone; `searchParams.set` semantics mean no duplicate or conflicting encoding. |
| Final metadata after json() resolves | CONFIRMED | `StreamResponse` public getters (`upToDate`, `streamClosed`, `offset`, `cursor`) reflect `StreamResponseState` transitions; header-absent fields preserve current values (`withResponseMetadata` `update.offset ?? this.offset`) — the "empty upToDate response preserves offset/cursor" rule in the plan matches native preservation semantics. |
| Native finite/read cancellation | CONFIRMED | `stream-api.ts` 153–160 chains the caller `AbortSignal` (with `once`) into the internal controller; per-request controllers (`#requestAbortController`) cover in-flight reads; `StreamResponse.cancel()` aborts; fetch-side abort maps through `FetchBackoffAbortError` → `DurableStreamError`. Stop cancels the pending read and the owned clock — the plan's stop semantics are implementable. |
| Collection identity / single budget | CONFIRMED | Unchanged from round 1: same collection objects (supervisor only reopens read sessions); `DurableStream.stream()` merges handle-level `backoffOptions` into every `stream()` call (verified `stream.ts`), so the constructor-level inner `maxRetries: 0` applies per finite read — one owned budget, no native retry multiplication. |
| Dispatcher commit ordering (one callback per finite read) | CONFIRMED (feasible) | `@durable-streams/state` `stream-db.ts`: the consumer's `subscribeJson` callback sets `lastConsumedOffset` before processing and marks up-to-date on `batch.upToDate` — synthesizing one batch per finite read with the session's final offset is compatible with upstream committed-batch semantics; post-startup resumed sessions are idempotent via `dispatcher.ready`. |
| `closed` guard-only usage | CONFIRMED (feasible) | Attaching a no-op catch to `closed` prevents unhandled rejection without influencing resume decisions — json() resolution/`#markClosed` under json() consumption settle the promise on the consumer path anyway. |

## Plan-gate consequence

- The prior verdict's eight passing boxes are unaffected: slices, gates, risk register, jsr-audit surface, deferred scope, and research currency are unchanged except for the revised seam paragraph (plan.md `## Revised load-bearing seam`) — the same slice set already covers the adapter implementing this shape; file count still far below 30; no new public contract beyond the already-audited owned types (status getter, reconnect options), since `json()`/`live`/`params` are existing public client options consumed at the adapter level.
- Evaluator-run open-decision sweep on the changed decision only: none remain — long-poll empty/timeout semantics, in-session termination shape, params ordering, cancellation path, and metadata resume are all determined by verified public behavior above. The plan explicitly states "No owner choice or upstream patch needed if this public seam passes independent review" — it does.
- Risk register gains no new unnamed item; the withdrawn-seam risk (rely on `closed` for completion) is structurally eliminated rather than merely mitigated.
- WIP source: not reviewed (plan review only); it must remain uncommitted until the slice is gated, and the eventual slice commits must match the verified plan shape.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

N/A.

## Notes

- Feature-tier cycle-two policy: the evaluator may edit a fixable plan; no edit was needed — the revised seam paragraph is already precise on ordering, metadata, checkpoint ordering, terminal behavior, and stop semantics, and every named behavior is source-verifiable in the installed public client 0.2.6.
- Round-1 PASS finding (public-surface, gate set, jsr-audit, slices, risks, deferrals) stands; this cycle adds only the seam-soundness confirmation that round 1 lacked. Round-1's only conditional risk — whether the public seam could support checkpoint ordering — is now positively answered.
- Hard stop still respected: no branch/worktree/PR changes; no source edits by the evaluator; writes limited to run artifacts inside the checkout.
- Implementation may proceed only through the gated slice discipline already locked by the plan (structured wrappers, per-test mutations, independent IMPL-EVAL, no merge without current-head CI).
