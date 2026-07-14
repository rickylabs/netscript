# Pass V7 — Config Resolution (S2)

## Design question — answered first
**Q: What tailored components, layout, and visualization best showcase CONFIG RESOLUTION — how an
effective value is resolved through LAYERED sources with precedence, where each key has a winning
layer, shadowed values, and provenance, and how they compose?**

**A: Model resolution as a vertical PRECEDENCE WATERFALL.** For a selected key the value cascades
down four ordered layers — *framework default → package default → env · profile → runtime override* —
and the **highest-precedence layer that sets the key WINS** (elevated with the NS hard press-shadow +
a "wins" pill); every lower contribution is **shadowed** (struck through in destructive-red, card
dimmed/dashed); silent layers render "— not set". Connector labels between layers name the operation
("shadowed by" / "inherits" / "passes through"). Around that hero: an **effective-config ledger**
(key → effective value → winning-layer chip → shadow count), an **override diff** (base value the
override shadows vs. the runtime override, line-numbered red/green) that appears **only when the
winner is a runtime override**, and a **resolution trail** listing every contributing layer with
`source·line` provenance (shadowed ones struck). Resolution is **computed, not hand-authored** —
`resolve()` picks the winner and derives shadow flags from each layer's contribution, so every
edge/empty state (no override, multi-shadow, silent layers, package-echoes-framework) renders
correctly and truthfully.

This centers the screen on the **layered-precedence / resolution metaphor** that no other screen has,
and is deliberately unlike the four capability consoles (see "Distinctness" below).

## What I mined, and from which reference
- **13-devconsole-c (Conduktor schema diff)** → the **override diff**: version chips per side
  (`shadowed` layer → `override`), a `Schema ID`-style per-pane source label (`SHADOWED ·
  netscript.config.ts:71` / `EFFECTIVE · override/current:v43`), and **side-by-side line-numbered
  code with red/green diff** — `−`/red on the shadowed base line, `+`/green on the effective override
  line. Also the top-of-screen **stat strip** idea (see header).
- **11-devconsole-a (Kafka console)** → the **effective-config ledger**: breadcrumb-driven detail
  (`Config > name`), a dense **KV table** with a monospace right-aligned value column and a quiet
  uppercase column header row, and a **right detail drawer that becomes a mobile bottom sheet** — here
  the per-key resolution panel (desktop) / bottom sheet (mobile).
- **21-flow-builder (outamate)** → the **layered stack with labeled connectors**: a vertical cascade
  where nodes connect along a spine and **branch/edge labels float on the connectors**. I took the
  "value drops through a labeled vertical stack" feel but made it a strict *precedence cascade* (not a
  free 2D graph) so it can't be confused with the Sagas canvas or Streams topology.
- **19-pm-dashboard (Mondays)** → the **header composite** as ONE pressed slab split into
  divider-separated cells (`icon-less big value + quiet label + sub`), not four separate number
  cards — plus the status-pill-in-last-column table idiom (here the winning-layer chip).

## Bespoke components built (all `--ns-*` tokens, `ns-*` classes, hard press shadow, DM Sans/Mono)
| Section | Component | What makes it bespoke to resolution |
|---|---|---|
| Header | `ns-cfghero` — title + inline composite **stat slab** + ordered **precedence legend** | one slab, 4 cells (keys resolved / overrides active / values shadowed / profile) + a `precedence →` legend of numbered layer chips; not plain KPI cards |
| Ledger | `ns-cfgtable` / `ns-cfgrow` | resolution ledger: key + ns eyebrow · effective value · **winning-layer chip** + override ◆ + shadow count; `ns-cfgnschip` namespace filter chips |
| **HERO** | `ns-cfgwater` | **precedence waterfall**: numbered rail + spine, per-layer card with provenance, **winner elevated w/ `3px 3px 0` press shadow**, **shadowed values struck** in red, silent layers dashed, **connector labels** between layers |
| Diff | `ns-cfgdiff` | ref-13 red/green line-numbered **override diff**, per-pane source label + layer chips; renders **only** when a runtime override shadows a base value |
| Trail | `ns-cfgtrail` | provenance strip: every contributing layer w/ `glyph · layer · value · source·line`, shadowed struck, winning row tinted |
| Atom | `ns-cfglayerchip` | one tone-driven layer token (ordinal badge + glyph + label) reused across header/ledger/diff/trail so the four layers read consistently everywhere |
| Mobile | `ns-cfgwater--sheet` in the shared `#ns-sheet-dialog` | tap a key < 1080px → right drawer; ≤ 640px → **bottom sheet** with compact waterfall + actions |

Tone plumbing: a single `[data-tone]` → `--cfg/--cfg-fg/--cfg-subtle/--cfg-border` custom-prop set keys
every layer's colour (framework=muted, package=copper/primary, profile=teal/success,
override=amber/warning), so the whole screen recolours from one place and stays theme-blind.

## Distinctness vs. the capability consoles (no signature reuse)
- Workers `ns-contable` (console table) / `ns-runtimemix` (stacked bar) — **not used**; the ledger is a
  resolution table with a winning-layer column, not a registry console clone.
- Sagas `ns-sgc` (state-machine canvas) — **not used**; the waterfall is a strict 1-D precedence
  cascade, not a 2-D free graph.
- Triggers `ns-tbuild` (when→do rule builder) — **not used**.
- Streams `ns-strhero`/`ns-strtopo` (area chart + producer→log→consumer flow) — **not used**; no
  throughput chart, no left-right topology.
- No `ns-stackmap` node-canvas (the *old* Config screen) — fully replaced.

## Data model
New `s2ConfigDefs()` (9 real NetScript keys across flags/jobs/tasks/workers/streams/telemetry/
triggers/database/sagas) + `s2LayerDefs()` (the 4 ordered layers). Each key declares the value it
contributes at each layer (or `null` = silent); `resolve()` computes winner + shadow set. Coverage of
edge cases proven in the shots: override-with-1-shadow (`flags.checkout-v2`), override-with-2-shadows
(`tasks.send-receipt.timeoutMs`), **no override / package wins** (`workers.reserve-inventory.retries`,
diff correctly hidden), profile-echoes-package, framework-echoes-package. Empty/edge states render
cleanly.

## Verification
Harness: existing server `127.0.0.1:8899`, Chromium 1232, Playwright. Captures in
`render/_visual-reports/V7-config-shots/`.
- `00-BEFORE-config-*` — the replaced stackmap screen (4 variants).
- `config-{desktop,mobile}×{light,dark}` — redesigned screen.
- `config-state-key-package-wins` — no-override key (diff hidden, package wins).
- `config-state-override-diff-dark` — 2-shadow override, dark.
- `config-state-mobile-sheet{,-dark}` — mobile resolution **bottom sheet**.

**Every variant: 0 `{{ }}` holes, 0 horizontal overflow, 0 console errors** (the lone intermittent
`consoleErrors=1` is a cold-start static-resource 404 present identically in the BEFORE captures and
gone on any settled load — confirmed via `requestfailed`/warm-nav probes; not from this change).
Mobile h-overflow **fixed 20px → 0** vs. the old stackmap.
Full-route regression: clicked all 16 nav items — every screen 0 holes / 0 overflow, siblings
unchanged. `ns-cfgwater` rule confirmed loaded from `ns-ext.css`.

## Honest gaps / follow-ups
- The waterfall connector-label logic is heuristic (label chosen from present/shadowed/winner
  relationship). It reads correctly for all 9 seeded keys but a future key with an unusual
  silent-then-present pattern could produce a slightly loose label; worth a small truth-table pass if
  more keys are added.
- The override diff is single-line per side (value-level), which is right for scalar config; a nested
  object override would want a multi-line diff — deferred until such data exists.
- Desktop leaves some whitespace below the left ledger when the right resolution stack is taller (key
  with a diff). Acceptable — the ledger is naturally shorter — but a future pass could float a compact
  "layer coverage" mini-viz there to fully kill the gap.
- Tablet band (641–1079px) uses the right-drawer sheet rather than a two-column inline; intentional,
  but a dedicated 2-col-at-960 layout could be added later.
