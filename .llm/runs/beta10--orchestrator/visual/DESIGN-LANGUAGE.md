# NetScript Dev Dashboard — visual design-language (BOLD calibration, binding for V2+)

The owner reset the bar: **push bolder.** V1 was too conservative. Study the 10 reference images in
`references/` (esp. `01-synergy-hr-desktop.png` — the fullest example) and build to THAT level of
craft — but in **NS One's identity**, not the references' palette.

## The one hard rule: adopt STRUCTURE, keep IDENTITY
- **Adopt from the refs:** layout density, "no dead space", component variety, composability,
  information hierarchy, UX story / navigation, elegant sidebar + topbar, mobile-first responsiveness,
  fluent breakpoints, condensed-yet-legible content.
- **Keep NS One's identity:** warm-cream light default + dark; the hard-offset **press shadow** (NOT
  the refs' soft-blur); `--ns-*` tokens only (no raw hex); `ns-*` class markup (round-trips to Fresh);
  DM Sans + DM Mono; the complementary-satellite doctrine (no owned waterfall/log-tail/metrics/
  resource-start-stop). Do **not** paste in the refs' purple/green/rounded-soft look.
- **Never change** routes, logic, data, features, or copy meaning. Visual + layout only. Zero `{{ }}`
  in the DOM and zero console errors after every change, both themes.

## What "bolder" means here — the reference lessons
1. **Density & composition — no dead space.** The refs pack structured content edge-to-edge: multi-
   column card grids, tight gutters, every card earning its area. Kill large empty regions; increase
   information-per-screen while staying scannable. Right-size cards to content.
2. **Component variety & composability.** The refs show a rich, reusable kit — build the NS One
   equivalents (token-driven, no SVG `{{ }}` holes; use div/CSS or post-mount JS for any geometry):
   - **KPI blocks** with a big value + a delta chip (e.g. green `+2.1%` pill) + a mini chart.
   - **Mini charts:** area, line (with a point + tooltip), bar, **radial gauge** ("10 out of 20"),
     **donut/segmented ring**, **stacked horizontal channel bar** with legend. All token-colored.
   - **Segmented time controls** (1D/1W/1M/3M/1Y) as a proper control, not plain tabs.
   - **Status pills** (Pending/Confirmed/Rejected → warning/success/destructive tones), **trend
     arrows** (up/down + %), **avatar stacks** (+N), **provenance/plugin chips**.
   - **Data rows** = icon + label + metric + trend, aligned in columns.
   Reuse these across screens so the product feels composed from one kit.
3. **Information hierarchy.** Clear altitude: page title → section headers → card titles → the hero
   number → supporting rows → footnotes. One dominant element per card. Strong type scale, quiet
   labels (mono micro-caps), loud values.
4. **Elegant chrome (top bar + side menu) — make these a signature.**
   - **Sidebar:** grouped icon nav with section labels (Overview/Capabilities/Data/System), derived
     badges, an **active-item treatment** (accent bar/pill), a collapsible icon rail, and a **profile/
     workspace card pinned at the bottom** (like the refs). Consider a compact "pinned/recent" group.
   - **Topbar:** a real header — contextual breadcrumb/title, the `local · my-app · aspire` env pill,
     a prominent **search/⌘K**, the **Open Aspire ↗** action, theme toggle — balanced and elegant,
     not a thin strip.
5. **UX story / navigation.** Lean into the 41 addressable routes: list → detail → leaf should feel
   like a guided journey; the correlation spine (`ch_3QK9dR2eZ`) is the narrative backbone; deep-links
   everywhere; breadcrumbs that tell you where you are.
6. **Mobile-first & responsive — fluent breakpoints (REQUIRED, currently missing).** The prototype is
   desktop-only today. Make it responsive: a mobile-first base that scales up. Desktop = multi-column
   grid + full sidebar; tablet = fewer columns; **mobile = single column, sidebar collapses to a
   drawer, dense cards stack, bottom-sheet patterns for detail/forms** (see `02-synergy-mobile-nav.png`
   + `06-mobile-sheets.png`). Verify breakpoints don't overflow or clip; the body never scrolls
   horizontally.

## Verify loop (both viewports)
Server: `http://127.0.0.1:8899/prototype.dc.html`. Screenshot desktop (1440×900) AND mobile
(~390×844) in both themes; **look** at the PNGs. Zero `{{ }}` / zero console errors must hold. No
horizontal body scroll at any width.

## Rollout
Establish the bar on the **shell (sidebar+topbar) + Home** first for owner sign-off, then roll the
same kit + density + responsiveness across every screen (investigation spine, capability consoles +
detail/leaf, control plane incl. topology, AI, extensions), then a final dark-mode + motion +
empty/loading/error polish. One kit, applied everywhere.
