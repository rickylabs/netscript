# Feedback — S4 Service & Contract Catalog

**Screen:** `S4 Catalog` (lines ~390–483) · route `catalog`
**Intent:** "which plugin contributed this procedure, is it installed, does it serve REST+RPC, and
why is its Scalar page thin." Never a second try-it console.
**Verdict:** Correct posture (out-links to Scalar, doesn't rebuild it). Make the unique value louder.

## Working
- Provenance rows (plugin/namespace), coverage badge (`complete` / `thin · missing .describe()`),
  duality chips (REST/RPC/SDK), method badges, a not-installed group gated with `plugin-gated-view`
  teaching `netscript plugin add crons`, and a "fresh route wiring" tab (bound vs unbound routes).
- "Open in Scalar" is an out-link, not a call form — the duplication gate holds.

## Findings

### P1 `[DX]` Foreground "coverage" — it's the only-NetScript payload
The uniquely-valuable answer here is "why is my Scalar page thin" (missing `.describe()`). Right
now it's a per-row badge. Add a top-of-screen coverage summary ("4 of 17 procedures thin · 2
routes unbound") so the screen answers "what's under-documented / unwired" at a glance, then let
the table drill in. Scalar can render the spec; only NetScript knows the spec is *incomplete*.

### P1 `[DATA]` Vary the duality chips — all-three-on-every-row carries no information
If every procedure shows REST+RPC+SDK, the column is decoration. Real registries have variation:
an internal RPC-only procedure with no REST route, an SDK-excluded admin op, a REST-only webhook
receiver. Show 2–3 rows that differ so the duality column earns its place and teaches the reader
what duality means.

### P2 `[UX]` Unbound route should carry the fix, inline
`/admin/reconcile` UNBOUND (warning) is the actionable row. Pair it with the authoring hint
(`.route.ts` sidecar vs inline) right there, so "unbound" comes with "here's how to bind it" —
consistent with the gated-plugin group teaching the install command.

## Best-in-class delta
Encore's Service Catalog + API Explorer is the reference — but Explorer *calls* endpoints
(pre-filled from types). NetScript deliberately delegates that to Scalar. That's the right call
given the owner mandate, and it frees S4 to own what Encore's catalog *doesn't* show: provenance
(which plugin contributed this) and coverage (why it's thin). Lean into those two — they're the
reason this screen exists rather than being a worse Scalar.
