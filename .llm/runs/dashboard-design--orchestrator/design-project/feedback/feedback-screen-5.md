# Feedback — S5 Plugin Control (dogfood centerpiece)

**Screen:** `S5 Plugins` (lines ~485–567) · route `plugins`
**Intent:** "what's installed, what does each plugin wire into (8–10 axes), is it healthy, is it
version-drifted." The dashboard is itself a plugin.
**Verdict:** The strongest dogfood surface. Make the contribution-axis map a navigation hub.

## Working
- Plugin list (workers/sagas/triggers/streams v1.4.0, auth v0.9.1 drift→1.0.0), status badges,
  contribution-axis map (Routes/DB/Workers/Streams/Triggers/Telemetry/Config/CLI), doctor rows
  (`ok`/`degraded`/`failed`, e.g. triggers `DLQ port degraded — no contract route`), version-drift
  row, and "Run doctor" revealing `netscript plugin doctor triggers`.

## Findings

### P1 `[DX]` Make each contribution-axis chip a deep-link — this is the hub
The axis map is the best proof of NetScript's architecture. Turn it into navigation: Routes → S4
filtered to this plugin, Workers → S7, Streams → S10, Triggers → S9, Telemetry → S2 coverage,
Config → S3. A plugin's detail becomes the spoke that reaches every screen it touches. Static
chips waste the single most differentiated component in the app.

### P1 `[DATA]` The plugin count/health must agree with S1 and S9
S1 says "12 plugins loaded / 3 doctor warnings." S5 shows 5 named plugins and (at least) the
triggers degraded row. Reconcile: show the full loaded set (or explain the delta), and make the
degraded-count on S1 equal the count of `degraded`/`failed` doctor rows here. Also: the triggers
`DLQ port degraded — no contract route` row is the *same* fact S9's gated DLQ tab and S12's
"contract routes pending" banner state — keep all three phrasings identical.

### P2 `[DX]` Show the drift remedy, not just the drift
`installed v0.9.1 → latest v1.0.0` should carry the update command (`netscript plugin update auth`
or the JSR install line) in a `code-block`, same transparency pattern as Run doctor. Drift without
a fix is a dead-end.

### P2 `[UX]` "Create from template" gated affordance must be visible-but-disabled
Per the prompt (beta.7 / #432), template-based plugin creation appears as a gated affordance. Verify
it renders (disabled + "beta.7") rather than being absent — the gap otherwise reads as "not planned."

## Best-in-class delta
Two exemplars converge here. **Appwrite**: per-capability first-class panels — S5's axis map is
NetScript's answer, and it can do something Appwrite can't: show *cross-primitive contribution* in
one view. **Directus**: names a closed taxonomy of extension shapes (Panel/Module/Layout) with an
SDK contract — S5 is where a future `.withDashboardPanel(...)` contribution would surface, so the
axis list is the natural home for "this plugin also contributes a dashboard panel." **Strapi**:
codegen-from-UI mirrors the CLI — the "Run doctor shows its CLI line" pattern is the same
philosophy; extend it to every action on this screen.
