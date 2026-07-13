# V3 Adversarial Evaluation — Live Flow vs Run Inspector

**Evaluator model:** moonshotai/kimi-k2.6  
**Date:** 2026-07-14  
**Bar:** `ROLLOUT-DOCTRINE.md` — *"each screen BESPOKE"*, *"NOT 'apply the Home kit uniformly' — that makes every screen look the same"*.

---

## VERDICT: **TOO SIMILAR** — Confidence: HIGH (85%)

The owner nailed it. The designer did not design two different screens; they designed **one layout template** and swapped the data + a handful of inner components. The structural skeleton, hero anatomy, grid rhythm, page header, right-rail assist, and overall composition are near-identical. The "difference" is primarily in the *middle-body widget* (journey node-list vs step timeline), but the container around it is a carbon copy. Below is the evidence, then concrete directives to genuinely separate them.

---

## 1. Layout Skeleton — SHARED GRID, SAME RHYTHM

Both screens resolve to the **same 3-zone console layout** with near-identical column widths.

| Screen | Grid class | Breakpoints |
|--------|-----------|-------------|
| **Run Inspector** | `.ns-console-grid` | 1fr → `17rem 1fr` (≥1024) → `17rem 1fr 19rem` (≥1440) |
| **Live Flow** | `.ns-flow-grid` | 1fr → `16rem 1fr` (≥1024) → `16rem 1fr 19rem` (≥1440) |

Evidence — CSS:
```css
/* ns-ext.css:778-781 */
.ns-console-grid { display: grid; gap: var(--ns-space-6); align-items: start; min-width: 0; }
@media (min-width: 1024px) { .ns-console-grid { grid-template-columns: 17rem minmax(0, 1fr); } }
@media (min-width: 1440px) { .ns-console-grid { grid-template-columns: 17rem minmax(0, 1fr) 19rem; }

/* ns-ext.css:443-445 */
.ns-flow-grid { display: grid; gap: var(--ns-space-5); align-items: start; min-width: 0; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1024px) { .ns-flow-grid { grid-template-columns: 16rem minmax(0, 1fr); } }
@media (min-width: 1440px) { .ns-flow-grid { grid-template-columns: 16rem minmax(0, 1fr) 19rem; } }
```

The designer changed `gap` from `6` to `5` and shaved 1 rem off the rail. That is **not a bespoke layout** — it is the *same template with parametric tweaks*.

**Also shared:**
- Both use `<header class="ns-page-header ns-page-header--console">` → `<div class="ns-toolbar">` with title + lede on the left, actions/seg on the right.
- Both left rails are `<aside style="min-width:0;display:grid;gap:var(--ns-space-3)">` containing filters + an entity list.
- Both main sections are `<section style="min-width:0;display:grid;gap:var(--ns-space-5)">` containing a hero + a panel.
- Both right rails are `<aside>` containing a detail card + assist card.

Prototype evidence:
- Run Inspector rail: `prototype.dc.html:869` (`aside` + filters + `ns-runtable`)
- Live Flow rail: `prototype.dc.html:1832` (`aside` + filters + flow list)
- Run Inspector main: `prototype.dc.html:914` (`section` + `ns-statstrip` + `ns-runhero` + `ns-panel`)
- Live Flow main: `prototype.dc.html:1874` (`section` + `ns-flowhero` + `ns-panel`)
- Run Inspector right rail: `prototype.dc.html:999` (`aside` + events + logstrip + assist)
- Live Flow right rail: `prototype.dc.html:1964` (`aside` + `ns-seamrail` + assist)

**Conclusion:** The skeleton is the same screen repainted twice.

---

## 2. Hero Pattern — NEAR-COPIES OF ONE ARC-GAUGE + KV PANEL

`ns-flowhero` and `ns-runhero` share the **exact 2-column band anatomy** (gauge left, body right) with only cosmetic differences.

| Property | `ns-flowhero` | `ns-runhero` | Verdict |
|----------|--------------|--------------|---------|
| Layout | `grid-template-columns: minmax(0,1fr)` → `10.5rem minmax(0,1fr)` @720px | `grid-template-columns: minmax(0,1fr)` → `9.5rem minmax(0,1fr)` @560px | Same pattern, 1 rem delta |
| Gauge | `ns-gauge` + `__spine` dot strip | `ns-gauge` only | Flow adds a spine; Run omits it |
| Body | `__top` → verdict badge + route + seg + btn | `__top` → name + status + kind badge | Same grid: name line, KV split, then footer |
| KV | `ns-kv--split` (correlation / trace / seams cleared) | `ns-kv--split` (correlation / trace / started / elapsed) | **Identical component**, swapped keys |
| Footer | `ns-splitbar` + dot legend | `ns-runstat` (3 tiles) | Only real difference |
| Tokens | same `ns-gauge__of`, `ns-gauge__label`, `ns-radius-xl`, `ns-shadow-xs` | same | Same kit |

Evidence — CSS:
```css
/* ns-ext.css:453 */
.ns-flowhero { display: grid; gap: var(--ns-space-4); padding: var(--ns-space-4) var(--ns-space-5);
  border: 1px solid var(--ns-border); border-radius: var(--ns-radius-xl); background: var(--ns-card);
  box-shadow: var(--ns-shadow-xs); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 720px) { .ns-flowhero { grid-template-columns: 10.5rem minmax(0, 1fr); } }

/* ns-ext.css:583 */
.ns-runhero { display: grid; gap: var(--ns-space-4); padding: var(--ns-space-4) var(--ns-space-5);
  border: 1px solid var(--ns-border); border-radius: var(--ns-radius-xl); background: var(--ns-card);
  box-shadow: var(--ns-shadow-xs); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 560px) { .ns-runhero { grid-template-columns: 9.5rem minmax(0, 1fr); } }
```

These are the **same rule blocks** with class names and two numeric constants changed. The designer even copy-pasted the inline comment structure.

**Doctrine violation:** The doctrine says *"ask the design question FIRST … what tailored components best showcase THIS feature"*. The answer for a **causal spatial map** should NOT default to the same 2-column arc-gauge summary band as a **dense step-timeline console**. A causal map deserves a horizontal topology / node-graph canvas feel; a console deserves a stat-strip-forward, breadcrumb + tab-row rhythm.

---

## 3. Component Palette — Shared Kit Swamped Bespoke Parts

| Component | Live Flow | Run Inspector | Shared? |
|-----------|-----------|---------------|---------|
| Page header (`ns-page-header--console` + `ns-toolbar`) | ✅ | ✅ | **YES** |
| Left rail (`aside` + filters + entity list) | ✅ | ✅ | **YES** |
| Hero band (arc gauge + KV + footer row) | `ns-flowhero` | `ns-runhero` | **Anatomy identical** |
| Main content panel (`ns-panel` with header border-bottom) | ✅ | ✅ | **YES — same inline style block** |
| Right rail detail card + assist | `ns-seamrail` + assist | events + logstrip + assist | **Assist card is shared** |
| Segmented switch (Journey / Inspector) | ✅ | ✅ | **YES** |
| `ns-kv--split` | ✅ | ✅ | **YES** |
| `ns-gauge` | ✅ | ✅ | **YES** |
| Status pills / badges | ✅ | ✅ | **YES** |
| `ns-seg` (All / Compact / JSON or Journey / Inspector) | ✅ | ✅ | **YES** |
| **Bespoke main widget** | `ns-journey--rich` (node-graph list) | `ns-step-timeline--data` | NO — genuinely different |
| `ns-statstrip` | ❌ | ✅ | NO — console strip is unique to Run |
| `ns-runtable` | ❌ | ✅ | NO — console table is unique to Run |
| `ns-fanout`, edge labels, spawn hints | ✅ | ❌ | NO — flow-unique |
| `ns-logstrip` | ❌ | ✅ | NO — run-unique |

**Problem:** The *shared* components form the **visual frame** (chrome, header, hero, rails, assist). The eye processes the frame first. Because the frame is identical, both screens read as the *same feature* before the user ever reaches the bespoke middle widget.

The designer's report claims they "composed" through a shared correlation KV + segmented switch + reciprocal deep-links. That is correct as a *navigation* story, but it is a **failure as a visual identity story** — navigation consistency does not excuse layout cloning.

---

## 4. Feature Fit — Does the DOMINANT Composition Differ?

### Live Flow (should read as: **spatial causal map / node-graph**)
Current dominant composition:
1. Vertical list of card-row nodes inside a panel (`ns-journey--rich`)
2. A small arc-gauge hero band above it
3. Right-rail properties panel (desktop)

This is **not a map**. It is a **vertical stack**. The designer added edge labels (`ns-journey__edge`) and a mini spine in the hero, but the *dominant visual* is still a top-to-bottom list in a bounded card panel — the same reading direction as a timeline. The node-graph "feel" the designer claims is achieved through caption pills and a selected-node ring, but the **layout grammar is still list-like, not graph-like**.

A causal journey should feel **horizontal or networked**, not a scrollable column. The ref mined for this was `21-flow-builder` ("node-graph canvas"), yet the implementation is a vertical list with connector lines — a weak translation.

### Run Inspector (should read as: **dense console / table-forward**)
Current dominant composition:
1. Arc-gauge hero band (same as flow)
2. Console stat strip (`ns-statstrip`)
3. Step timeline in a panel
4. Right-rail events + logs

This is closer to its feature — the stat strip and run table are console-appropriate. BUT the arc-gauge hero is the *same visual anchor* as Live Flow. When you switch between the two via the segmented control, the eye lands on the **same hero shape** and thinks "same screen, different data."

The doctrine references `11-devconsole` for the inspector: "breadcrumb + tab row + stat strip + dense table." The designer took the stat strip but **ignored the breadcrumb + tab-row chrome**, opting instead for the shared hero template.

---

## 5. Bar Check — Doctrine Compliance

`ROLLOUT-DOCTRINE.md` rule #1:
> *"What tailored components, layout, composition, data visualization, and data structure best showcase THIS feature — and how do they compose together?"*

The designer asked the question and wrote the right answer (spatial map vs vertical timeline). The **implementation betrayed the answer** by forcing both answers into the same `ns-*hero` + `ns-panel` + 3-column grid mold.

Rule #4:
> *"Reuse the shared kit + chrome for consistency … but each screen adds its OWN tailored components so no two screens read the same."*

**FAIL.** The screens DO read the same at the layout/hero level. The "own tailored components" exist only in the middle-body widget, which is below the fold on mobile and visually subordinate to the hero on desktop.

Rule #2:
> *"Mine a DIFFERENT reference each pass."*

The designer mined `04-finance-cards` for BOTH heros (arc gauge). The arc gauge is great for one, but using it for both is a reuse shortcut, not a bespoke choice. They mined `01-synergy-hr` for BOTH KV split-panels. They mined `11-devconsole` for the Run Inspector console table but **did not let that reference re-architect the top of the screen**.

---

## PRIORITIZED FAIL LIST & CONCRETE DIFFERENTIATION DIRECTIVES

### P0 — Re-architect the heroes so they do NOT mirror each other

**Live Flow hero:**
- **Kill the arc-gauge hero entirely.** A causal map should lead with a **horizontal topology summary** — a mini node-graph strip (the 5 seam nodes laid out left-to-right, not top-to-bottom) showing the *shape* of the journey at a glance.
- Replace the 2-column band with a **full-width horizontal composition**: left = route/method badge, center = the horizontal node-strip with edge connectors, right = verdict + outcome split.
- The spatial map's hero should scream "flow left-to-right." An arc gauge screams "progress to completion." Those are different mental models.

**Run Inspector hero:**
- Keep or evolve the stat strip, but **drop the arc gauge** or reduce it to a micro ring next to the run name — NOT a 10.5rem left column that mirrors the flow hero.
- Lead with **breadcrumb** (`runs › job › attempt 2`) + a **tab row** (Steps / Logs / Input / Diff) per ref 11. The hero space should be dominated by the **stat strip + breadcrumb + tab row**, not by a gauge that competes with the step timeline below.
- Make the run table the **dominant surface**, not a left-rail widget. Per ref 11, the Conduktor console puts the sortable table front-and-center with a right detail drawer. The current design buries the run table in the narrow left rail.

### P1 — Change the grid rhythm per screen

**Live Flow:**
- Abandon the 3-column console grid. A spatial map needs **more horizontal room**.
- Move to a **2-column layout**: left = collapsible seam list (not a rail, a list), center = the journey canvas with room for **horizontal fan-out**.
- On desktop ≥1440, use a **drawer that slides from the right** only when a node is selected, rather than a permanent 19rem rail that competes with the journey width.
- The journey itself should be the **largest visual element**, not a panel inside a center column.

**Run Inspector:**
- Lean IN to the console grid, but make it **table-forward**.
- Promote the run list from the left rail to a **full-width sortable console table** above the step detail.
- Use the left rail for **filters + runtime chips + a slim version list**, not for the primary data table.
- Right rail = detail drawer for the selected step/run (ref 11). Ensure the run table gets the visual weight.

### P2 — Differentiate the page header / chrome

**Live Flow header:**
- Remove the segmented switch from the header area (or make it a subtle icon toggle).
- Add a **live feed toolbar** (`ns-livedot`, follow switch, new-pill) — which it already has, but this should be the *dominant chrome*, not cluttered alongside the Journey/Inspector seg.
- The header should emphasize the **streaming / live** nature: a liveness indicator, a route filter, and a "raw trace" out-link. It should feel like a **live observability surface**, not a console admin page.

**Run Inspector header:**
- Add a **breadcrumb** (`Correlated runs › ch_3QK9… › job_4183`) as the first visual line per ref 11/12/13.
- Keep the segmented switch but move it **into the tab row** inside the main content, not in the page header where it mirrors Live Flow's switch.
- Add an **env indicator** or **version dropdown** per ref 13 if applicable (runtime version of the run).

### P3 — Ensure the dominant component is visually dominant

**Live Flow:**
- The `ns-journey--rich` should **break out of the `ns-panel` bounding box**. Panels with `border-radius-xl` and `1px solid var(--ns-border)` feel like cards. A causal map should feel like a **canvas** — full edge-to-edge within its container, with nodes floating in space.
- Make the **fan-out visual** larger and more central. The current `ns-fanout` is a small pill row under one node. If fan-out is a key feature, give it spatial room — maybe a T-junction connector that branches visibly.

**Run Inspector:**
- The step timeline is appropriate, but the compensation branch should be even more visually distinct — perhaps a **reversed color wash** on the whole right side of the timeline, not just a left border.
- The `ns-logstrip` should sit **adjacent to the timeline**, not below it in a separate rail. In a dense console, logs and steps are read together vertically.

### P4 — Shared kit audit — tighten what is truly shared

| Shared element | Keep? | Rationale |
|----------------|-------|-----------|
| `ns-page-header--console` | Yes, but **vary internal layout** | Chrome consistency is fine; internal arrangement should differ |
| `ns-assist` | Yes | Shared AI card is acceptable as a global component |
| `ns-kv--split` | Yes, but **position it differently** | Shared component, different visual weight (Flow: under hero; Run: in drawer) |
| `ns-gauge` | **NO — in at least one hero** | Remove from one screen or demote to micro size |
| `ns-panel` | Yes, but **vary border/radius treatment** | Panel chrome is fine, but don't clone the same header inline style everywhere |
| `ns-seg` | Yes | Navigation bridge between the two is correct |
| Arc-gauge-as-hero | **NO** | This is the #1 similarity trigger |

---

## Anything Else Below the Bar

1. **Mobile stacking is identical.** Both reflow to: rail → hero → main widget → right-rail stuff → assist. The doctrine requires dedicated bottom sheets for detail/actions. Live Flow does this (`ns-seamrail` collapses to sheet), but Run Inspector doesn't — its right-rail events/logs just stack below. Run Inspector on mobile should use a **bottom sheet for step detail / logs**, not a long scroll stack.

2. **`ns-panel__header` is copy-pasted across both.** Look at the inline style on both panels:
   - Run Inspector: `prototype.dc.html:955` (`padding:var(--ns-space-3-5) var(--ns-space-5);border-bottom:1px solid var(--ns-border);flex-direction:row;align-items:center;gap:var(--ns-space-3);flex-wrap:wrap`)
   - Live Flow: `prototype.dc.html:1918` (`padding:var(--ns-space-3-5) var(--ns-space-5);border-bottom:1px solid var(--ns-border);flex-direction:row;align-items:center;gap:var(--ns-space-3);flex-wrap:wrap`)
   This is character-for-character identical. If the panel headers are the same, the panels read the same.

3. **The assist card is copy-pasted.** Both right rails end with the same `ns-panel` → `ns-assist` structure with the same three `.ns-ai-chip` buttons (`Explain this failure`, `Draft a fix`, `Compare with last success`). The assist content itself is data-driven, but the **composition is identical**.

4. **Color story is identical.** Both use the same tone-tinted chip pattern (success/warning/destructive borders) for status. The doctrine allows shared kit, but when the *same accent treatment* is applied to seam-value chips (Flow) and step-datum chips (Run), the visual vocabulary collapses into one language. The Run Inspector's datum chips should lean **console/monospace-dense** (no rounded pill borders, flatter) to signal "console output" rather than "card status."

---

## Summary

The designer produced **half a bespoke design** — the inner widgets (`ns-journey--rich`, `ns-step-timeline--data`) are genuinely tailored. But the **frame, hero, grid, header, and right-rail assist** are a single template applied twice. The owner's critique is fully supported by the code evidence. To pass the bar, each screen needs its **own layout rhythm and its own hero architecture** while sharing only the low-level chrome (sidebar, topbar, tokens, pills, buttons). The arc gauge cannot anchor both screens. The 3-column console grid cannot be the universal answer.
