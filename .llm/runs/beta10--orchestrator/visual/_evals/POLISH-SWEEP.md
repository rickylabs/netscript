# Final polish sweep — deferred gate prescriptions (apply after the breadth pass)

Each screen was accepted at its gate score with concrete residuals deferred here. The sweep re-gates
every screen and applies the genuinely valuable items (skip subjective/gold-plating).

## Triggers (gate 55 → fix → 62)
- Rule builder → optional full node-graph (source → diamond condition → action) [ref 21] (debatable)
- Firing-history rows → segmented 24h outcome bars vs sparklines [ref 11] (preference)
- Webhook test box → syntax-highlighted editor + docs accordion [ref 11] (gold-plating)
- Schedule next-fire cards → vertical timeline ribbon w/ duration bars [ref 19]

## Streams (gate 72)
- Throughput card → time-range pills (1m/5m/15m/1h) + pin crosshair readout + reclaim whitespace [ref 04]  ← valuable
- Live event tail → filter bar (quick-search + show-from + add-JS-filter drawer) [ref 11]  ← valuable (consistency w/ Triggers)
- Selected-message panel → accordion sections / denser; fan-out delivery → 4-col table [ref 12]  ← valuable
- Consumer-lag stat → radial gauge (lag vs retention) [ref 04] (debatable)
- Lag heatmap → finer grid + x-axis labels + gradient legend [ref 12] (minor)

## Config Resolution (gate 68 → fix → concrete hits resolved)
- Precedence rail → optional node-graph pipeline [ref 21] (declined — waterfall metaphor is stronger; revisit only if desired)
- Right panel → inline quick-override <textarea> editor + docs accordion [ref 11] (out of visual-only scope; needs interactivity)
- Category filter chips → connected tab bar [ref 11] (declined — chips are fine)

## Migrations (gate 62 → node/header density fix)
- Migration ledger → inline per-row DDL diff expander [ref 13] (declined — dense table + drawer already cover it)
- Pending rail "what will change" → tabbed impact-docs accordion [ref 11] (gold-plating)
- DDL diff → full code-editor chrome (file tabs, line numbers) [ref 11] (declined — diff is intentionally secondary)
- Version-chain per-node author avatars + preflight-step pipeline [ref 19] (no author/step data — would invent data)

## Dead-Letter Queues (gate 62 — ACCEPTED on verified density; gate over-reached)
Only trivially-valid residuals (do in sweep):
- Frame the inspector payload JSON in a bordered code block (light border + key/string color) [ref 11]
- Connect the retry-history timeline dots with line segments showing elapsed interval [ref 19]
- Tighten inspector vertical whitespace; fill the shorter right rail (a top-sources mini-list)
DECLINED (gate was wrong): remove the failed-message checkboxes (breaks bulk triage — core feature);
queue-health fill-meters → semicircular gauges (kept horizontal ON PURPOSE so DLQ ≠ Migrations arc gauge);
"How triage works" → tabbed docs (gold-plating). Note: gate under-credited existing micro-viz
(by-queue split bar, exhausted pips, arrival sparkbar, cluster severity left-borders).

## Catalog (gate 62 — ACCEPTED on verified quality; gate over-reached OFF-DOCTRINE)
Only valid residual (sweep): tighten the "7 CONTRACTS REGISTERED" stat into a glued borderless metadata
strip (REGISTERED / PROCEDURES / VERSIONS / COMPATIBILITY) under the title [ref 13]; nudge transport-reach bars.
DECLINED — the gate prescribed changes that VIOLATE the design language / variety mandate:
- green `#22c55e` primary buttons + green upsell banner [ref 07] → RAW HEX, off the copper/teal/amber palette
- centered modal replacing the mobile bottom sheet → the whole system uses bottom sheets BY INTENT (owner ask)
- convert the grouped registry rail → a generic Confluent-style table → kills the explorer idiom + echoes the consoles
- add a side-by-side schema DIFF viewer → Config Resolution owns the diff pattern; Catalog steered away ON PURPOSE
- "Add JS filter" code-drawer query language → gold-plating (search + kind/method/coverage chips already live-filter)
Note: gate is now applying a fixed generic wishlist to strong screens; MUST filter against NS One + variety.
