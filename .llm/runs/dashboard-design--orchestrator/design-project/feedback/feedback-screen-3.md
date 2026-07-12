# Feedback — S3 Runtime-Config Monitor & Control ⚑ flagship

**Screen:** `S3 Runtime Config` (lines ~230–388) · route `runtime`
**Intent:** "what changed in runtime config, when, and by which version?" + gated write-back.
**Verdict:** The cheapest-to-ship differentiator and the template for every mutation in the app.
Get the read-only-vs-write honesty and the three-view causality right.

## Working
- Live override feed (append-only, `data-tone` by kind), current-state stat grid (5 topics),
  version timeline `v41 → v42 → v43 (current)`, and confirm-gated write-back that prints its exact
  CLI-equivalent (`netscript config override set flags.checkout-v2 --rollout 30`). This confirm
  dialog is the "one generator, two callers" pattern — it is reused across S5/S7/S9/S11/S12.

## Findings

### P1 `[UX][DATA]` beta.6 is read-only — don't render live write controls as operable
Per the D6 correction and #556, `@netscript/runtime-config` exposes read+watch only in beta.6;
write-back is beta.7. If the flag switches / "Enable" buttons look operable and fire a confirm,
the UI promises a write the build can't do. Fix: render them **visibly gated** ("write-back lands
in beta.7 · #556" tooltip, disabled styling) **or** keep them operable strictly against the mock
and badge the panel "preview." Choose once; this decision then propagates to every other console's
mutations (see README cross-cutting #2).

### P1 `[E2E]` The feed, the stat grid, and the version timeline must be one causal state
These are three views of the *same* override layer. A change in the feed (`checkout-v2 → 30%`)
must be reflected in the stat grid ("Feature flags: N active") and appear as the newest version
step with that diff. If they're three independent mocks, the flagship story "what changed, when,
by which version" doesn't actually connect. Wire them to one in-memory override model so a
confirmed change updates all three at once — that *is* the demo.

### P2 `[UX]` Default the diff view to Compact
The All/Compact/JSON toggle mirrors Temporal's event-history altitudes; Temporal defaults to
**Compact** because it's the human-readable view. Do the same. Keep JSON for copy-paste.

### P2 `[DX]` Disabled entities should link to their console *and* explain themselves
A disabled `job nightly-reconcile` row should link "Open in Workers (S7)" — and S7's drift panel
should point back here as the *cause* (see feedback-screen-7 P1). The override is the explanation
for S7's "scheduler disagrees"; make that round-trip explicit.

## Best-in-class delta
Appwrite is the manage-through-UI north-star: create → configure(tabs) → monitor, every mutation
confirm-gated. S3's confirm-with-CLI-equivalent is *better* than Appwrite here (Appwrite doesn't
show you the API call) — that transparency is a NetScript signature. Protect it: never hide a
mutation behind "magic," always show the line. The only thing to fix is honesty about which
mutations beta.6 can actually perform.
