# Feedback — S1 Home / Dashboard Shell

**Screen:** `S1 Home` (lines ~82–157) · route `home`
**Intent:** "is my NetScript app wired the way I declared it, and where do I jump to fix it."
**Verdict:** Solid launcher; sharpen severity coherence and the "what just happened" gap.

## Working
- Six only-NetScript stat cards, each a deep-link to its owning screen (12 plugins, 3 doctor
  warnings, 2 unbound routes, 4 disabled overrides, 1 pending migration, 1 scheduler drift).
- ⌘K palette + contributed-panels strip (`DashboardPanelContribution`) — the dogfood proof
  that the dashboard is itself a plugin. Keep this; it's a differentiator.

## Findings

### P1 `[DATA]` Severity of the scheduler-drift card must match S7
Home renders "1 scheduler drift" as **warning**, but S7's drift panel renders
`nightly-reconcile: live scheduler disagrees` as **failed** (`data-state='failed'`). The same
fact cannot be warning on home and failed on the console. Pick one severity (it's a
config-vs-reality mismatch → warning is defensible; a job that should fire and doesn't →
failed). Whatever you pick, both screens read it from one source. Same audit for the "3 doctor
warnings" count vs the actual degraded rows on S5.

### P1 `[DATA]` "12 plugins loaded" must reconcile with S5's list
S5 names 5 plugins (workers, sagas, triggers, streams, auth). Home claims 12 loaded. Either
show all 12 somewhere (add runtime-config, db, kv, the dashboard plugin itself, …) or change the
count. A number the user can't drill into reads as slop.

### P2 `[UX]` Add a compact "what just happened" teaser
Home answers "what's wired" but not "what just changed" — the first question after behavior
shifts. Add a 3–5 item cross-capability strip (top override from S3 + latest run event from S6)
that **deep-links** rather than re-rendering those feeds. This mirrors Appwrite's project
Overview, which pairs the capability grid with recent activity. Guard the duplication gate: a
teaser that out-links, never an owned feed.

### P3 `[DX]` Surface the reciprocal Aspire link + local identity
The prompt wants the UI to note "Aspire links back here via its own NetScript Dashboard resource
URL," and Encore's dev-dash earns trust by stating it auto-launched on `encore run` at a fixed
port. Add a one-line "launched by `netscript dev` · Aspire ⇄ this dashboard" hint near the
"Open Aspire Dashboard" button so the satellite relationship is explicit and bidirectional.

## Best-in-class delta
Encore dev-dash (`localhost:9400`, live on `encore run`) and Appwrite Overview (capability grid +
recent activity). S1 already nails "grid of only-what-we-know facts, each a jump." The two gaps
vs. those exemplars: a recency signal (Appwrite) and an explicit auto-launch/round-trip identity
(Encore). Neither requires new owned surfaces — both are teasers/links.
