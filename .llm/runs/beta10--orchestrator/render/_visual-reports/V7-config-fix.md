# Pass V7-fix — Config Resolution density remediation

Adversarial vision gate scored the Config Resolution screen **68/100**
(`visual/_evals/V7-config-adversarial-vision.md`): the precedence-waterfall metaphor and
override-diff idea are genuinely bespoke, but a few sections spent real estate on generic chrome
and dead-space placeholders. This pass fixes those four concrete hits **without rebuilding the
parts that already work** (the numbered precedence rail, the namespace filter chips, the
data-driven per-key adaptation, the winning-layer chips, the resolution-trail structure).

Scope: **visual + layout only.** No route/logic/data/copy-meaning changes. All geometry is
div/CSS; no SVG `{{ }}` holes. Every fix is data-driven — verified against the override-wins key
(`flags.checkout-v2`) AND a package-wins/no-override key (`workers.reserve-inventory.retries`).

## What changed, per gate item

### 1 (TOP) — collapse non-contributing waterfall layers  ✅
The gate's highest-value hit: in partial-resolution states, `— not set` / `passes through` layers
rendered as **full-height padded rows** wasting ~30–45% of the waterfall's vertical space.

- **JS** (`prototype.dc.html`, `cfgWater` map): each layer now carries `collapsed` (`true` when the
  layer is silent — the value is not set at that layer) and a `pipNote` (`not set` / `passes
  through`). `hasProv`/`hasEdge` are suppressed for collapsed layers.
- **Markup** (desktop panel + mobile sheet waterfalls): a silent layer renders a slim
  `.ns-cfgwater__pip` (`LAYER NAME — passes through`) instead of a `.ns-cfgwater__card`. The
  contributing layers (winner + shadowed) keep their full card treatment untouched.
- **CSS** (`ns-ext.css`, Pass V7-fix block): the pip is a one-line dashed marker; its rail ord
  shrinks to a hollow dashed tick and the spine dot dims, so the eye reads "skipped" and the
  contributing cards snap together across the gap.

**Measured (desktop 1440, `workers.reserve-inventory.retries`, package wins → profile+override silent):**

| | silent-layer row height | silent dead-space total | as % of waterfall | waterfall height |
|---|---|---|---|---|
| BEFORE | 47px × 2 | 94px | 29% | 320px |
| AFTER  | 24px × 2 | 48px | 18% | 268px |

→ **silent rows 49% shorter · silent dead-space cut 49% (94px→48px) · waterfall 16% shorter overall.**
Each pip is ~33% the height of a contributing card. Override-wins state (1 silent layer, framework):
silent 47px→24px, waterfall 346px→317px.

### 2 — KPI header: denser cells + supporting micro-viz  ✅
The four KPI cells were bare single-number boxes with oversized internal padding.

- **JS** (`cfgHeadStats`): each stat carries a `viz` kind plus its data — `ticks`
  (namespace-spread bars under KEYS RESOLVED), `pips` (one dot per active override under OVERRIDES
  ACTIVE), `meter` + `meterPct` (shadowed/total meter under VALUES SHADOWED, with a new
  "N of M contributions outranked" sub), and `rankPips` (precedence-position diamonds under
  PROFILE, the active layer filled).
- **Markup**: a `.ns-cfghero__cell-figure` row places the value beside its micro-viz.
- **CSS**: cell padding reduced (`space-3 space-4` → `space-2-5 space-3-5`), value size stepped
  down (`2xl`→`xl`), and the four micro-viz primitives styled with NS tokens
  (`--ns-warning`/`--ns-success`/`--ns-primary`/`--ns-border-strong`). The precedence legend row
  is unchanged.

### 3 — override diff: framed side-by-side hunk  ✅
Was a single changed line in a wide panel. Now a real diff viewer, shown ONLY when a runtime
override wins (`cfgHasDiff` gate is unchanged).

- **JS** (`cfgDiff`): a `hunk` marker (`@@ <key> @@`) plus **three lines per pane** — a context
  line (`<ns>: {`), the changed value line (`del` on the shadowed side, `add` on the effective
  side, with `// <unit>` inline comment and string values quoted), and a trailing context line
  (`}`). Line numbers are contextual (14/15/16).
- **Markup**: pane source headers gain a colored `− SHADOWED` / `+ EFFECTIVE` tag + the source
  path; each pane renders the `@@` hunk header then its lines.
- **CSS**: red/green pane tags, primary-tinted `@@` hunk bar, dimmed context lines; the existing
  pink/green `del`/`add` backgrounds and `−`/`+` gutter markers (DM Mono) are reused.

### 4 — effective-config table: tighter rows + type-colored values  ✅
- **JS**: a `cfgValType(raw)` classifier (number→amber, string/enum→teal, boolean→copper) drives a
  `valClass` on each table row's effective value, and is reused for waterfall + trail values.
- **Markup**: the row value span uses `{{ r.valClass }}`.
- **CSS**: `.ns-cfgval--num|str|bool|none` type colors (with a `[data-theme='dark']` step-up for
  contrast); row padding reduced (`space-2-5`→`space-2`), value size `sm`→`2xs`, key size trimmed.
  The namespace filter chips and winning-layer chips are left exactly as they were.

## NS One identity
`--ns-*` tokens only (no raw hex); `ns-*` / `ns-cfg*` classes; warm-cream + `[data-theme='dark']`;
copper/teal/amber type palette from the DS scales (`--ns-copper-*`, `--ns-teal-*`, `--ns-amber-*`,
precedent set by `.ns-sgc*`/`.ns-strlive*`); hard press shadow on the winner card retained; DM Sans
/ DM Mono. CSS appended to `render/assets/ns-ext.css`. No changes to other screens' markup,
`render/support.js`, `_ns_styles.css`, or `_ds/*`.

## Verification
- **Zero `{{ }}` holes · zero real console errors · zero horizontal overflow** across all 8 Config
  variants (desktop/mobile × light/dark × override-wins/package-wins) and both mobile sheets.
  (A single pre-existing benign 404 appears intermittently on a background fetch in both the BEFORE
  baseline and AFTER; a clean page load has none — unrelated to this markup.)
- **Full 16-route regression clean** at desktop 1440 + mobile 390: every nav route renders with
  holes=0, hoverflow=0, no real console errors. No other screen was touched or regressed.

## Shots (`render/_visual-reports/V7-config-shots/`)
- `00-BEFORE-config-*` — prior baseline (kept for reference).
- `after-config-{desktop,mobile}-{light,dark}-{override,package}.png` — the required matrix
  (override-wins key shows the diff; package-wins key shows the collapsed not-set layers).
- `after-config-mobile-{light,dark}-sheet-{override,package}.png` — the mobile detail sheet.

## Honest gaps / notes
- The gate also suggested (items 5/8, "variety leverage") converting the rail into a node-graph and
  adding an inline `<textarea>` quick-override editor + docs accordion. **Deliberately not done** —
  the brief explicitly says keep the waterfall metaphor (do NOT convert to a node-graph) and this is
  a visual/layout pass, not a new-interaction pass. Adding an editable override input would change
  behavior/scope.
- The collapsed pip lands at ~33% of a contributing card (brief target ~40%); it reads cleanly at
  24px with the uppercase mono label and maximizes the density win. Could be nudged to ~28px if a
  touch more breathing room is wanted.
- `.ns-cfgwater__silent` CSS rule was retired (silent layers now use `.ns-cfgwater__pip`).
