# Pass V12-fix — Extensions density tighten

**Scope:** VISUAL + LAYOUT ONLY. No route/logic/data/copy-meaning change. The bespoke
contribution-manifest idiom (provider roster + surface-grouped manifest + Surfaces lanes +
Available) is KEPT — this pass only removes the density looseness the adversarial vision gate
(58/100) flagged. The gate's table-conversion / avatar / version-timeline prescriptions were
DECLINED (they would echo the consoles, or invent data that does not exist).

Files touched:
- `render/prototype.dc.html` — Surfaces lane markup (added header meter + mount summary + slim
  footer, split mount-card into a single meta/perm row); CONTRIBUTES row markup (`__meta` →
  `__path` chip); `extLanes` JS enriched with `shareWClass` / `mountSummary` / `foot` (derived
  from existing counts — no new data).
- `render/assets/ns-ext.css` — appended a `V12-fix — DENSITY PASS` block that overrides the loose
  rules by cascade order. All rules scoped under `.ns-ext*`.

## What changed, by the 5 asks

### 1. Compact provider roster cards (`ns-extprov`)
- Vertical padding `space-2-5` → `7px` top/bottom; internal `__main` row gap `space-2` (8px) → `3px`.
- Left icon gutter tightened: glyph `2.1rem` → `1.75rem`, column gap `space-3` → `space-2-5`.
- Roster inter-card gap `space-2-5` → `space-2`.
- **Card height 88px → 59px (−33%).** The three rows (name+status / micro-bar / pips+source) now
  hug each other; every row still carries real content, none is padding.

### 2. Slim per-provider contribution micro-bar (`ns-extprov__contribbar`)
- Height `.5rem` (8px) → **4px**, dropped the track background + inset border so it reads as a slim
  segmented rule sitting directly under the name. Copper=panel / teal=command / amber=tool kept;
  a faint per-segment inset keeps segments legible at 4px.

### 3. Densify the manifest CONTRIBUTES section (`ns-extmanifest`)
- Each contribution is now a **~44px row**: surface glyph + bold name + an inline **path chip**
  (the mount path, tinted to the surface colour, ellipsised) + right-aligned perm. Title + path
  sit on one line (`nowrap`, `min-width:0`) so rows stay at 44px instead of wrapping to ~64px.
- Group header is now **sticky** (slim, uppercased, `top:0` with a light backdrop blur) so the
  surface grouping stays anchored while the list scrolls.
- KV grid row padding `space-1-5` → `space-1`; manifest section gaps tightened
  (`gap` `space-3-5`→`space-3`, groups `space-2-5`→`space-2`).

### 4. Tighten the top stat composite (`ns-exthead`)
- Cell padding `space-4/space-5` → `space-3/space-3-5`; cell gap `space-2-5` → `space-2`.
- Hero glyph `2.75rem` → `2.25rem`, hero number `3xl` → `2xl`.
- Channel bar height `1.5rem` → `1.25rem`; compat alert padding `space-2-5` → `space-2`.
- **Micro-viz preserved** — the contributions-by-surface segmented bar (click-to-filter), the
  enabled-coverage meter, the tier chips, and the compatibility alert are all intact, just denser.

### 5. Fix the Surfaces uneven-lane whitespace (`ns-extlane`)
Root cause: three equal `auto-fit` columns in one grid row with `align-items:start`; the 6-item
Panels lane (649px) forced the row band tall while the two 2-item lanes (277px each) left ~372px
empty below → a big empty lower-right region.

Fix — **2-column independent-height layout**:
- Panels lane spans the **left column** (`grid-row: 1 / span 2`, `minmax(0,1.35fr)`).
- Commands lane (row 1) and AI-tools lane (row 2) **stack in the right column** (`minmax(0,1fr)`).
- Each lane gained a **header stat**: a slim 4px share meter (fill ∝ contribution count, surface
  colour) + a monospace **mount summary** (`capabilities/* · data/*`, `⌘K palette`, `AI runtime`).
- Each lane gained a **slim dashed footer**: `↳ N <surface> from M provider(s)` (derived from the
  real per-lane counts).
- Mount-cards densified: path + perm collapsed onto one `space-between` row; per-lane redundant
  description paragraph hidden (the header meter + mount summary now carry that signal).

Result: right column height (256 + 256 + gap ≈ **525px**) now matches the Panels lane (**520px**),
so the two columns bottom-align. The empty region shrank from **~372px → ~5px**. Mobile ≤720px
collapses all three lanes to a single stacked column.

## Verification

Measured via Playwright (Chromium 1232), `deviceScaleFactor: 2`, live harness
`http://127.0.0.1:8899/prototype.dc.html`.

| Metric | Before | After |
|---|---|---|
| Provider card height | 88px | **59px (−33%)** |
| Contribution micro-bar height | 8px | **4px** |
| CONTRIBUTES row height | ~64px (wrapping) | **44px** |
| Surfaces empty lower-right | ~372px | **~5px** |
| Panels lane vs right column | 649 vs (277+277) split | **520 vs 525 (aligned)** |

Gates (all views × 1440 + 390 × light + dark):
- **Zero `{{ }}` holes** — Providers, Surfaces, mobile sheet all 0.
- **Zero console errors** — (the single 404 is a pre-existing unrelated favicon/resource fetch,
  present before this pass).
- **Zero horizontal overflow** — 22/22 checks false (3 views × 2 themes × 2 viewports + sheets).
- **16-route regression clean** — every sidebar route: 0 overflow, 0 holes, 0 errors. Appended CSS
  is scoped under `.ns-ext*` and did not leak.

Shots (overwritten in `render/_visual-reports/V12-ext-shots/`, `00-BEFORE-*` retained for compare):
Providers / Surfaces / Available × desktop 1440 + mobile 390 × light + dark, a provider selected
(triggers, both themes), and the mobile manifest bottom sheet (both themes).

## Honest gaps
- The roster cards have visible empty space to the *right* of the 4px micro-bar (the bar spans full
  width but the pips/source row is short); this is intentional breathing room, not dead space, and
  keeps the card from echoing a table. Could be filled with a right-aligned mount-count chip in a
  future pass if the gate still flags it.
- The Surfaces 2-column split assumes the Panels lane stays the tallest (it holds 6 of 10
  contributions). If the data shifted so Commands/AI-tools out-grew Panels, the right column could
  exceed the left; the `grid-row` placement is keyed to `data-kind` so it degrades gracefully
  (short lanes just leave a little space) rather than overflowing.
- CONTRIBUTES path chips ellipsise very long mount paths on narrow manifest widths; the full path
  remains in the KV grid / mount map, so no information is lost, but the chip itself truncates.
