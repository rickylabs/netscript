# Plan & Design — READY FOR REVIEW

## Locked decisions

- Preserve the existing WatchableKvBridge watch path, initial:true subscription and direct application of acknowledged initial events.
- Track whether the first batch has been processed. If it carries no initial events, call the wrapped adapter getMany once for all watched keys (or existing per-key fallback if getMany is absent). Seed full state and equality stamps before processing that batch through existing affected-key reconciliation. Emit an initial full frame even when all keys are absent or the first events equal the seed.
- Never repeat the full baseline read after initialization; subsequent change frames retain unchanged keys and existing equality/replay/deletion semantics. If the first batch includes any initial events, do no fallback read or reinterpret snapshot boundaries.
- Keep cancellation/error handling: check ended after awaited fallback reads before mutating/enqueueing, propagate read failures through stream.error, preserve iterator.return and AbortSignal cleanup.
- Document that third-party adapters may ignore initial and lack ready; fallback waits for the first batch and is best-effort current storage, not a subscription-boundary guarantee. A silent adapter cannot produce an initial frame until a batch arrives.

## Slices

S0: run plan/research/design and early draft PR. S1: adapters/denokv-bridge.ts and tests/watch-initial_test.ts (bridge_test.ts only if needed), with local regression/negative-control/quality evidence, independent slice review, normal commit/push and phase comment. Closure includes dated lesson/context; final exact-head review recorded in PR timeline after readiness to preserve reviewed SHA.

## Proof / gates

1. A wrapped Memory adapter drops initial, returns a plain AsyncIterable without ready; prepopulate multiple keys, emit first live change, assert first frame has changed + untouched + missing entries and versions. Verify one getMany of all watched keys, subsequent reads only affected keys, later updates/deletions retain others.
2. Empty/equal initial-ignored batch still produces seeded frame; optional getMany absence uses per-key reads without widening the interface.
3. Acknowledged first-party initial snapshot triggers no fallback bridge read. Cancel during held fallback suppresses enqueue; read failure reaches stream reader. Event-driven synchronization with bounded hang deadlines only; no timing sleeps.
4. Retain regression tests, restore baseline bridge and verify new fallback test(s) fail; restore fix and prove green.
5. Structured check/lint/fmt for scoped source/tests, structured KV watch/bridge unit suites, quality:gate (includes architecture/dependency checks), scoped doc-lint and JSR audit. Existing optional Redis cases without configured server are ignored/unproven, not passed. This fix changes no scaffold output or runtime wiring; no local scaffold.runtime. Coordinator owns any requested shared runtime gate.

Separate owner-selected Claude Opus 5.5/high PLAN-EVAL before code and IMPL-EVAL after. Feature rounds max 2 plan / 5 implementation, same reviewer reused, two consecutive terminal failures escalate.

## Risks / deferred scope

- Third-party watch cannot establish an acknowledged snapshot boundary: document best-effort first-batch fallback rather than claiming atomic snapshot guarantees.
- Cancellation while fallback reads await: check ended before enqueue, cover with held-read test.
- Optional batch API: preserve existing per-key fallback.
- No first batch: unchanged behavior until source emits; no speculative readiness/timeout contract added.
- Defer Redis debounce timing issue #2373, provider changes, watch port changes, list/cursor refactors, B1/B2, scaffold/runtime infrastructure.

Open decisions: none requiring rescope; live Redis backend is optional supplemental proof, not needed for third-party bridge regression. Contributor entry: existing WatchableKvBridge.watch JSDoc.
