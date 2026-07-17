# V1 — Global Design-System Foundation (visual-only pass)

**Scope:** System-level visual polish only. No route, logic, data, feature, markup-text,
or markup-structure changes. Raw `ns-*` class markup preserved (round-trips to Fresh source).
Warm-cream light default + dark both retained. All edits are additive rules appended to
`assets/ns-ext.css` (which loads **last**, after `_ns_styles.css` → `proto.css`, so equal-specificity
overrides of the DS card/panel/shadow rules win legitimately without touching the generated closure).

**Files touched:** `assets/ns-ext.css` (one appended `V1 — GLOBAL DESIGN-SYSTEM FOUNDATION` block).
`proto.css` not modified — the console page-header size rule already lived there and only needed a
tracking/weight refinement, which the ns-ext override supplies. Markup not modified.

**Verification:** 16 nav screens × 2 themes = 32 captures, every iteration. `holes[]` and `errors[]`
stayed `[]` on all 32 through the final run. Zero surviving `{{ }}`, zero console errors, in both themes.
Tokens only — no raw hex introduced (the only `rgba()` values are inside shadow/highlight definitions,
matching the DS's own shadow-token convention, e.g. `--ns-shadow-* : … rgba(0,0,0,…)`).

Final screenshot outdir:
`/tmp/claude-1000/-home-codex-repos-netscript-beta10/cd2ee104-ed45-4ed4-bcca-f960c60a1d84/scratchpad/shots-final`

---

## What changed, and why

### 1. Signature "press" shadow (biggest lever)
NS One's stated identity is a **hard-offset press shadow**, but the DS shipped generic soft-blur
Material shadows (`--ns-shadow-xs: 0 1px 2px rgba(0,0,0,.05)`), which read as templated. Redefined the
entire shadow ramp (`xs`→`xl`) for **both** themes to a crisp vertical-offset + tight-spread cast so every
surface sits on the canvas with intent.
- **Light:** cast uses the warm ink (`rgba(41,37,33,…)`) at low alpha instead of pure black — sits with
  the warm-cream palette instead of graying it.
- **Dark:** deeper offset cast, paired with border + top-highlight (see #3) so raised surfaces read.
- *Before:* cards looked flat/washed, indistinguishable from the page. *After:* cards read as distinct
  instrument planes with a subtle lift.

### 2. Surface language — card + panel
- Radius `--ns-radius-xl` (12px, reads soft/marketing) → **10px** (reads instrument) on `.ns-card`,
  `.ns-panel`, and the net-new console cards (`.ns-kpi`, `.ns-assist`, `.ns-incident`, `.ns-statlink`,
  `.ns-logstrip`) so hand-built surfaces match the DS card exactly.
- Every card now carries a resting `--ns-shadow-sm/xs` and net-new console cards inherit the same, so the
  card grid on Home / Runtime / DLQ reads as a set of planes rather than outlined rectangles.
- Unified interactive feel: `.ns-card--interactive`, `.ns-kpi`, `.ns-stackmap__node` all lift to
  `--ns-shadow-md` on hover — one hover language across DS and net-new surfaces.

### 3. Border presence + dark-mode machined edge
- **Light:** card/panel resting border firmed one notch above the `rgba(0,0,0,.08)` hairline
  (`color-mix(border-strong 45%, border)`) so the press shadow lands against a real edge, not a wash.
  Calibrated to stay present-but-not-heavy on the cream canvas.
- **Dark:** the baseline borders were near-invisible (`rgba(235,228,210,.06)`) — KPI/stat cards
  dissolved into the near-black canvas. Bumped card/panel/kpi/statlink/logstrip borders to
  `--ns-border-strong` **and** added a 1px inset top-highlight (`inset 0 1px 0 rgba(235,228,210,.04)`)
  so raised surfaces catch a Linear/Vercel-style machined edge. This was the single most visible
  dark-mode fix.

### 4. Typography
- Display headings: tightened tracking to `-0.02em` on `.ns-page-header h1` for a machined feel.
- Console page-header (`--console`, used on the 16 in-shell detail views): `text-2xl` / weight 650 /
  `-0.018em` / line-height 1.15 — one clear notch below the marketing h1 but same optical intent.
- Lede: normalized to one size (`--ns-text-sm`), relaxed leading, `max-width: 68ch` — calmer measure,
  consistent across screens (was `0.925rem` and running a touch large/loose).
- Mono uppercase micro-labels (KPI labels, log heads, mini-labels, CLI labels, grounding labels)
  normalized to `0.09em` tracking so they read as one family instead of drifting per component.

### 5. Console rhythm + focus
- Three-zone `.ns-console-grid` gutter tightened one step (`space-6`→`space-5`, `space-6` at ≥1440px)
  for a denser operator feel without crowding.
- KPI intra-card rhythm tightened (`gap: space-1-5`, value `letter-spacing: -0.01em`) so the number
  dominates and the sparkline reads as a footnote — the label+value+delta read as one stat block.
- Standardized focus ring offset to 2px on the net-new interactive rows (`.ns-flowrow`, `.ns-quickcmd`,
  `.ns-seg__btn`) that previously used mixed 1px/2px/no-offset.

---

## Deliberately deferred to later per-screen clusters

These are per-screen or component-internal calls, out of scope for a system-level V1 foundation:

- **KPI value↔label vertical spacing on Runtime Config** — the big stat numbers ("2 active", "0", …)
  sit slightly loose relative to their caption; a per-screen density pass should tune the specific
  `ns-kpi`/stat markup on that screen rather than the global token.
- **Waterfall / stackmap internal density** (Run Inspector, Catalog stackmap) — proportional-bar and
  node-graph tuning is component-scoped, best done in the component's own cluster.
- **Log-stream / logstrip column widths** — the fixed grid-template columns are content-specific; leave
  to the log-surface cluster.
- **Segmented-control + toggle-switch micro-states** — these are DS primitives; any refinement belongs
  in a DS-primitive pass, not a consumer-CSS override.
- **Sparkline stroke weights per tone** — legible as-is; a data-viz cluster can calibrate stroke/opacity
  per intent color if desired.

No accessibility, contrast, or hole/error regressions were observed; the foundation holds in both
themes across all 16 nav screens.
