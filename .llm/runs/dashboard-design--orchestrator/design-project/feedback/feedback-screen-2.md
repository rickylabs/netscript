# Feedback — S2 Config Resolution & Topology Hand-off

**Screen:** `S2 Config Resolution` (lines ~158–228) · route `config`
**Intent:** declared intent vs running reality — "did my declared wiring actually connect end to end?"
**Verdict:** This is the Encore-Flow analog and should be the most polished screen; it's close.

## Working
- `ns-stackmap` capability wiring graph (nodes = capabilities, measured SVG edges), `<details>`
  tree of declared intent, per-node coverage badge (`ok` / `unwired`), cross-links out to Aspire/S4/S5.
- Shows real cross-primitive wiring (saga→worker queue, trigger→stream, stream→subscribers) —
  exactly the seam Aspire structurally cannot draw.

## Findings

### P1 `[DATA]` Reconcile the streams-telemetry story with S10
S2 marks `streams:payment-events` coverage `unwired` — "instrumentation registered but no
exporter bound." S10 separately says the stream delivery **read-model** may not be wired yet.
These are two different maturity claims about the same primitive. Align them: one sentence,
reused, about exactly what is/isn't wired for streams telemetry — otherwise the two screens
contradict each other.

### P1 `[DX]` Label the edges with what flows through them
Encore Flow's signature is that edges carry meaning — pub/sub topic names, queue names. S2's
edges are currently plain connectors. Put the carried payload/queue/topic on each edge (hover or
inline): `sagas:order.fulfillment —reserve-inventory queue→ workers:reserve-inventory`. This is
the same "seam carries a payload" idea S13 already renders; bringing it here makes the graph
answer "what connects these" not just "these connect."

### P2 `[DX]` Say what the graph reflects and offer re-resolve
Encore Flow updates live as source changes. S2 is a snapshot of the last `inspectConfig`. Add a
timestamp + "re-resolve" affordance (or a note that it re-resolves on `netscript dev` reload) so
the user isn't unsure whether they're looking at stale wiring. Add "open declaring file"
(→ `netscript.config`) since this screen is about *declared* intent.

### P2 `[UX]` Make the coverage overlay a real toggle
The prompt calls for a "Telemetry coverage" switch that tints unwired nodes. Verify it exists as
a toggle (not always-on), so the graph can be read for wiring *or* for coverage without clutter.

## Best-in-class delta
Encore Flow is "legendary" precisely because it's code-derived, live, and edge-labeled. S2 has
the code-derived graph and the coverage layer Encore lacks (a real NetScript advantage). Close
the gap on **edge semantics** and **freshness signal** and this screen beats Flow on information
density while staying complementary (capability wiring, never infra/resource health — that stays
Aspire's, which the current design correctly respects).
