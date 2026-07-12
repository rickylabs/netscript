# Feedback — S13 Live Flow ⚑ flagship #2

**Screen:** `S13 Live Flow` (lines 1241–1349) · route `flows`
**Intent:** "what did this request cause, and where did it stop?" — one request's causal journey
across framework seams, live, with the payload at every seam.
**Verdict:** The strongest differentiator in the whole dashboard, and the flow≠waterfall gate
**holds** (semantic node chain, not a span gantt). Fixes are about the failed variant, the live
tail, and the shared fixture.

## Working
- Three-zone console: left flow list (route/status filters, live `sse` dot, Follow toggle,
  "N new flows" pill, curl empty-state), center `ns-journey` causal chain (prim badge
  http/contract/worker/saga/stream + name + status + payload-at-seam `<details>`), right seam-detail
  KV (primitive/owner/queue-topic/correlation) + out-links (Aspire trace, Run Inspector, Scalar,
  Streams).
- "Raw timing lives in Aspire" + per-node "View raw trace in Aspire ↗" — duplication gate holds.
- "flow assembled by correlation join — boundary events land in beta.7" — honest about beta.6
  correlation-join fidelity vs the beta.7 boundary-event instrumentation (#557).

## Findings

### P1 `[UX]` Render the FAILED variant — "where did it stop" is the money shot
The prompt explicitly requires a failed flow where the job node is `failed · attempt 2 of 3,
retrying` and **the chain visibly stops there**. That single frame is the screen's entire promise
("where did it stop?"). Verify `seedFlows()` includes a halted chain (the `data-halted` attribute
exists in the markup — confirm a node actually sets it), not only all-success journeys. A Live Flow
that only ever shows green chains fails its own thesis.

### P1 `[UX]` The in-progress tail node must pulse (and fall back under reduced-motion)
Live behavior is the point: as seam events stream in (SSE), the last node should subtly pulse to
say "still going." Verify the pulsing tail exists and that `prefers-reduced-motion` degrades it to
a static badge. The `tick()` sim already advances nodes worker→saga→stream — make that visible.

### P1 `[E2E]` The pinned flow is the canonical journey — spine = a real correlation ID
The center chain is the spine of the whole app, and the POC proves the spine is a **correlation
ID**, not a synthetic `ord_7f3k` (see `POC-ground-truth.md` §1). The framework already assembles
this exact chain: a trigger event's `publishSaga` action → the saga instance (via
`SAGA_MESSAGE_MAP`) → the worker executions (via `listExecutionsByCorrelationId`). Render a **real
mapped journey**: `POST /webhooks/stripe` → `trigger event {correlationId = ch_3Q…}` →
`publishSaga PaymentWebhookReceived` → `saga PaymentWebhookSaga` → `job reserve-inventory` →
`stream payment-events`, with the **same correlation ID** flowing across S6/S8/S10 so every
out-link ("Open run", "Open saga instance", "Open trigger event", "Open Streams console") lands on
the *same* entity. This is README cross-cutting #1 and it matters most here — S13's entire value is
*continuity* across seams, and the POC shows that continuity is achievable with real data.

### P2 `[DATA]` Delivery outcome must agree with S10
S13's stream node should not claim "3/3 delivered" if S10's canonical `msg_88f` shows a failed
subscriber. Pick one outcome for the canonical message across both screens (see feedback-screen-10
P1).

### P2 `[UX]` Verify the filters actually narrow the list
Route (all / /api/orders / /api/payments) and status (all / live / completed / failed) selects
should filter `s13Flows`. Confirm selecting "failed" surfaces the halted flow from P1 — that's the
natural path a debugging dev takes.

## Best-in-class delta
Encore's distributed tracing is a **waterfall**; S13 is deliberately its opposite — a causal
*seam* narrative Encore's span view can't express ("this API call triggered job X, which advanced
saga Y to step 3, which published to Z with 3 subscribers"). That's the Encore-Flow-meets-tracing
idea taken one step further than Encore itself ships. The gate discipline (out-link the moment raw
timing matters, NetScript vocabulary not OTLP jargon) is exactly right — protect it. The only way
this screen loses is if it (a) never shows a stopped chain, (b) doesn't feel live, or (c) its
out-links don't actually connect to the same run elsewhere. All three are the P1s above.
