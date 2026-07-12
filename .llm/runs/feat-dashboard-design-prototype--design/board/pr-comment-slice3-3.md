# Slice 3.3 — Local render gate + host-env equivalence layer

**Commit:** d96c334b

**Trigger (owner):** "most still looks ugly … you really need to find a way to preview the output otherwise you work in the dark."

**The render gate (new, permanent):** local http.server over the exact canvas bundle + Edge headless screenshots (920px and 1440px), console captured via `--enable-logging=stderr`. All **48 surfaces** (44 cards + 4 screens) triaged before any fix was written. This loop is now mandatory before any canvas upload — slice 3.2's overlay fix had shipped as "fixed" without ever rendering.

**Root causes found:**

1. **React string-`style` throw (blank cards).** EmptyState/Toast/CommandPalette previews passed Preact-style string `style` props; React 19 throws and unmounts the story → blank card. The 3.2 stages never rendered (drift **D6**). Fixed: object styles; ModelSelector OPEN story got a stage too (dropdown was clipped by `.ds-cell`).
2. **Missing box-sizing preflight.** Zero `box-sizing` rules exist in the closure *or anywhere in `registry/**/*.css`* — the registry silently depends on the host app's Tailwind preflight. Caused Input/FormField/Textarea right-edge bleed. Framework half routed to #509.
3. **D5 is a closed set.** The 7 L3 blocks' Tailwind utilities total ~60 distinct classes (extracted from the runtime). Fixed properly: a **host-env equivalence layer** in `closure.ts` — preflight subset + all ~60 utilities, tokens-mapped, media variants included. This is what a scaffolded Fresh app's Tailwind generates, so it restores real-app fidelity for cards *and* screens; marked for deletion once #509 converts the blocks to semantic `ns-*`.
4. **proto.css responsiveness:** waterfall tick labels garbled at any narrow *panel* width → `container: ns-waterfall / inline-size` + `@container ≤46rem` endpoint-only ticks; StatsGrid's viewport `xl:grid-cols-4` crammed 4 columns into the 28rem inspector rail → capped to 2 in `ns-rail-grid`.

**Verified by re-shoot (24 cards + 3 screens × 2 widths):** EmptyState/Toast/CommandPalette/ModelSelector fully render; DataTable is a real table (dividers, badges, footer); StatsGrid grids properly; input bleed gone; screen-02 axis reads `0 ms … 1.12 s`; screen-03 endpoint table columnar; screen-04 stats 2×2. No preflight regressions across sentinel cards.

**Gates:** `design:sync build`+`check` PASS — idempotence `628396f31065`, parity 44/44, raw-hex 0/0, render-blank 44/0. Scoped fmt/lint/check on `tools/design-sync` clean.

**Canvas:** `_ns_styles.css` + 4 `_preview/*.js` (`plan_…_cedc9c41c89e`) and `screens/proto.css` (`plan_…_1186fca9a929`) re-uploaded.

**#509 coordination:** findings (box-sizing dependency, D5 `ns-*` conversion, StatsGrid container queries, Skeleton rebuild, ThemeToggle default-theme, SectionDivider rule, CodeBlock clip) messaged to the fresh-ui agent with an explicit no-overlap contract — it owns `packages/fresh-ui`; this run owns `tools/design-sync` + `resources/design/dashboard`. When its registry work lands, `design:sync build` regenerates the closure and the host-env layer shrinks to just the preflight, then gets removed.

Owner: refresh the pane — the formerly blank/collapsed cards and screens 02–04 should now match the local shots.
