---
version: alpha
name: Terminal
description: A Charm-style TUI on a character grid. Rounded Lip Gloss panes, one Geist Mono 14/24 scale, bracketed keys and an inverse lime selection bar.
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr with variable.resolveForConsumer on
  # frame 41:297 (Light) and 41:2 (Dark). Theme = Signal, Density = Compact.
  # Keys are the --ns-* suffix.
  bg: '#fcfcfc'
  bg-dark: '#000000'
  surface: '#f9f9f9'
  surface-dark: '#191919'
  card: '#ffffff'
  card-dark: '#111111'
  muted: '#f0f0f0'
  muted-dark: '#222222'
  hover: '#f0f0f0'
  hover-dark: '#222222'
  selected: '#eef6d6'
  selected-dark: '#1f2917'
  fg: '#202020'
  fg-dark: '#eeeeee'
  muted-fg: '#646464'
  muted-fg-dark: '#b4b4b4'
  fg-subtle: '#646464'
  fg-subtle-dark: '#b4b4b4'
  inverse-fg: '#fcfcfc'
  inverse-fg-dark: '#111111'
  border: '#d9d9d9'
  border-dark: '#3a3a3a'
  border-strong: '#bbbbbb'
  border-strong-dark: '#606060'
  input-border: '#838383'
  input-border-dark: '#7b7b7b'
  ring: '#5c7c2f'
  ring-dark: '#bdee63'
  primary: '#bdee63'
  primary-dark: '#bdee63'
  primary-hover: '#b0e64c'
  primary-hover-dark: '#d4ff70'
  primary-fg: '#37401c'
  primary-fg-dark: '#111111'
  primary-text: '#5c7c2f'
  primary-text-dark: '#bde56c'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
typography:
  grid: {
    fontFamily: Geist Mono,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 24px,
    letterSpacing: 0px,
  }
  grid-strong: {
    fontFamily: Geist Mono,
    fontSize: 14px,
    fontWeight: 500,
    lineHeight: 24px,
    letterSpacing: 0px,
  }
  chrome: { fontFamily: Geist Mono, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  pane-title: { fontFamily: Geist Mono, fontSize: 14px, fontWeight: 500, lineHeight: 20px }
  help: { fontFamily: Geist Mono, fontSize: 13px, fontWeight: 600, lineHeight: 20px }
  keycap: { fontFamily: Geist Mono, fontSize: 12px, fontWeight: 500, lineHeight: 16px }
  legend: { fontFamily: Geist Mono, fontSize: 12px, fontWeight: 400, lineHeight: 20px }
rounded:
  none: 0px
  pane: 8px
spacing:
  ch: 8.4px
  line: 24px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 28px
components:
  pane: {
    backgroundColor: '{colors.bg}',
    textColor: '{colors.fg}',
    typography: '{typography.grid}',
    rounded: '{rounded.pane}',
  }
  pane-dark: {
    backgroundColor: '{colors.bg-dark}',
    textColor: '{colors.fg-dark}',
    typography: '{typography.grid}',
    rounded: '{rounded.pane}',
  }
  table-row: { textColor: '{colors.fg}', typography: '{typography.grid}', height: 24px }
  table-row-selected: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.grid}',
    height: 24px,
  }
  table-row-selected-dark: {
    backgroundColor: '{colors.primary-dark}',
    textColor: '{colors.primary-fg-dark}',
    typography: '{typography.grid}',
    height: 24px,
  }
  key-primary: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.grid}',
    rounded: '{rounded.none}',
    height: 32px,
  }
  key-primary-dark: {
    backgroundColor: '{colors.muted-dark}',
    textColor: '{colors.primary-text-dark}',
    typography: '{typography.grid}',
    rounded: '{rounded.none}',
    height: 34px,
  }
  key-default: {
    textColor: '{colors.fg}',
    typography: '{typography.grid}',
    rounded: '{rounded.none}',
    height: 34px,
  }
  key-default-dark: {
    textColor: '{colors.fg-dark}',
    typography: '{typography.grid}',
    rounded: '{rounded.none}',
    height: 34px,
  }
  key-hint: {
    backgroundColor: '{colors.muted}',
    textColor: '{colors.fg}',
    typography: '{typography.keycap}',
    height: 16px,
  }
  tab-selected: {
    backgroundColor: '{colors.hover}',
    textColor: '{colors.fg}',
    typography: '{typography.chrome}',
    height: 26px,
  }
  tab-selected-dark: {
    backgroundColor: '{colors.hover-dark}',
    textColor: '{colors.fg-dark}',
    typography: '{typography.chrome}',
    height: 26px,
  }
  status-line: {
    backgroundColor: '{colors.surface}',
    textColor: '{colors.muted-fg}',
    typography: '{typography.chrome}',
    height: 32px,
  }
  status-line-dark: {
    backgroundColor: '{colors.surface-dark}',
    textColor: '{colors.muted-fg-dark}',
    typography: '{typography.chrome}',
    height: 32px,
  }
  help-bar: {
    backgroundColor: '{colors.surface}',
    textColor: '{colors.fg}',
    typography: '{typography.help}',
    height: 33px,
  }
  status-ok: { textColor: '{colors.success-text}', typography: '{typography.grid}' }
  status-fail: { textColor: '{colors.destructive-text}', typography: '{typography.grid}' }
  prompt-field: { textColor: '{colors.fg}', typography: '{typography.grid}', height: 50px }
---

# Terminal

<!--
Format: Google Labs DESIGN.md (alpha, Apache-2.0), github.com/google-labs-code/design.md.
Values: Figma file pGRLnkPPRZJZy74evNcQBr, read-only extraction on 2026-10-27.
Names are provisional until S1 #2414.
-->

## Overview

- **Thesis:** the Orders console as a Charm-style terminal UI. Every glyph sits on a 1ch × 24px
  character grid, panes are rounded Lip Gloss boxes with their titles cut into the border, and the
  keyboard is the primary interface.
- **Signature moves:**
  1. One character grid for every table, log and metric (marker 2ch, id 12ch, customer 25ch, …), one
     Geist Mono 14/24 scale, no proportional type at all.
  2. Lip Gloss panes: 8px-rounded 1px boxes with inset titles `┤ orders · 6 of 3,182 [focused] ├`;
     the active pane (the one containing focus) gets a 2px lime border, never a glow.
  3. Inverse-video lime selection with a `▶` marker, bracketed keys `[ save ctrl+s ]` and a
     `key desc • key desc` help bar.
- **Anchor:** Charm Lip Gloss v2 and Bubbles v2 (MIT), plus the lazygit panel model (MIT: active and
  inactive border colours, selected-line background). Taken: rounded border boxes, the help-bar
  grammar, the prompt `>`, block cursor, dim descriptions, status words. Not copied: Charm's logos,
  mascots and CharmTone palette. Warp's theme schema is a token-format reference only (AGPL code not
  used).
- **Family:** Developer.
- **Best for / avoid for:** developer tools, ops and support consoles, power-user admin, anything
  keyboard-driven. Avoid consumer and first-run experiences, and touch-first screens.
- **Feel:** fast, legible, exact. First impression: "lazygit for orders".

## Colors

- **Ground and surface ladder.** Dark is the reference scheme: canvas `bg-dark` `#000000`, status
  line and help bar `surface-dark` `#191919`, key fills and the selected tab `muted-dark` `#222222`.
  Light: `#fcfcfc` canvas, `#f9f9f9` bars, `#f0f0f0` keys and selected tab.
- **Accent policy.** Lime is the only accent:
  - `primary` `#bdee63` fills the selected row (inverse video) and the light Save key;
  - `primary-text` (`#5c7c2f` / `#bde56c`) is used for pane titles, the brand, prompts `>`, tab
    indices and checked boxes;
  - `ring` (`#5c7c2f` / `#bdee63`) draws the focused pane and the selected-tab underline.
- **Status colours.** Status is a word, not a chip: `[ OK ]` `success-text`, `[WAIT]`
  `warning-text`, `[SHIP]` `info-text`, `[FAIL]` `destructive-text`, `[RFND]` `muted-fg`. Log levels
  use the same roles (`INFO`, `OK`, `ERR`, `WARN`).
- **Dark design notes.** No light slab except the intentional lime selection bar. The dark Save key
  is a `#222222` key with a `#7b7b7b` 1px edge and lime `#bde56c` text (X-06); the selected tab is
  `#222222` with a lime underline (X-05). Secondary columns are dimmed to `muted-fg`.

## Typography

| Role        | Size / line | Weight       | Used for                                              |
| ----------- | ----------- | ------------ | ----------------------------------------------------- |
| grid        | 14/24       | Regular 400  | Every table cell, log line, prompt value, legend body |
| grid-strong | 14/24       | Medium 500   | Values, totals, metric figures                        |
| chrome      | 14/20       | Regular      | Status line, tab labels                               |
| pane-title  | 14/20       | Medium       | Brand, tab label, pane titles                         |
| help        | 13/20       | SemiBold 600 | Bottom key-hint bar                                   |
| keycap      | 12/16       | Medium       | Tab indices, inline key caps                          |
| legend      | 12/20       | Regular      | Status legend under the table                         |

- One family: **Geist Mono** (OFL). Fallbacks:
  `"Geist Mono", "JetBrains Mono", "IBM Plex Mono",
  ui-monospace, monospace`. The fallback must
  cover box drawing (U+2500–257F) and the glyphs `◆ ● ▶ ▲ ▼ ✗ ⏎ •`.
- Hierarchy is dim / normal / medium, not size. Tracking is 0 on the grid so columns stay exact.
- The Signal Theme mode sets `font/sans` to Geist, but no Terminal node uses it.

## Layout

- **Character cell:** 1ch = 8.4px (Geist Mono 14px advance), line box 24px. Every fixed column is a
  whole number of ch; each table has at most one flexible `minmax(0, 1fr)` track for the remainder.
- **Chrome:** status line 32 (padding 6/12, gap 16), tab line 43 (padding 8/12, gap 4, 1px `border`
  rule), content padding 28/20/20/20 with 20px between pane rows and 16px between panes, help bar 33
  (padding 6/12, 1px top rule).
- **Panes:** padding 22/16/16/16 (the extra top clears the inset title), line gap 4 for text panes.
  Row A: metrics 784 + alerts 440. Orders pane 1240 wide, focused. Row B: detail editor 784 + log
  440.
- **Orders grid:** `grid-template-columns: 2ch 12ch 25ch minmax(0, 1fr) 17ch 10ch 18ch 12ch` at
  Geist Mono 14/24: marker, id, customer, email (the flexible track), channel, status, date and
  total (right aligned). The fixed tracks are 96ch (806.4px). Resolve the email track inside the
  Orders pane's content box: the 1240px pane minus its 16px side padding, its border (2px while
  active) and any column gaps. The earlier resolved pixel list did not fit the pane once padding,
  borders and gaps were counted; don't hard-code resolved widths, and re-resolve after a fresh
  layout export. Never shrink the type or clip a column to force the arithmetic. Every row reserves
  the marker cell (X-01). Header row in `muted-fg`, then a 1px `border` rule; rows 24 tall.
- **Other grids:** metrics 16ch / 12ch right / 3ch gap / delta / trend fill; alerts with a 6ch level
  column; log 9/6/8/10ch plus fill, single-line truncation with `…`.
- **Density:** the frames set Density `Compact` explicitly (control 32, row 44), but no Density
  variable is bound; the 24px line box governs.

## Elevation & Depth

There is no shadow, blur or tint. Following Lip Gloss and lazygit, depth is expressed by **border
weight and colour**:

| Level       | Recipe (CSS)                                                     | Applied to                                                                                                             |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ground      | `background: var(--ns-bg)`                                       | Canvas and pane interiors                                                                                              |
| Bar         | `background: var(--ns-surface)`                                  | Status line, help bar                                                                                                  |
| Pane        | `border: 1px solid var(--ns-border-strong); border-radius: 8px`  | Inactive panes                                                                                                         |
| Active pane | `border: 2px solid var(--ns-ring)` plus `[focused]` in the title | The pane that contains DOM focus (`:focus-within`); this is pane styling, not a focus indicator for the control inside |
| Selection   | `background: var(--ns-primary); color: var(--ns-primary-fg)`     | Selected row, inverse video                                                                                            |

Pane titles sit on a `bg`-filled frame (padding 0/6) over the top border, framed by `┤ ├` in
`border-strong`.

## Shapes

- Only panes are rounded (8px, the Lip Gloss `Rounded` border). Keys, tabs, keycaps, the selection
  bar and the progress bar are square.
- Theme values `radius/control` 6, `radius/input` 6 and `radius/badge` 4 belong to the shared Signal
  mode and are not used by Terminal nodes.
- Strokes: 1px pane borders, rules and key edges; 2px for the focused pane and the selected-tab
  underline.

## Components

| Component     | Variant used                                   | Anatomy and states                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key (button)  | `Terminal/Key` Primary, Default, Hint          | Primary: `[ save ctrl+s ]`, padding 4/8, lime fill in light. Dark Save: `#222222` fill, 1px `#7b7b7b` edge, `#bde56c` text (node-level exception, see Mapping). Default: 1px `border-strong` outline, brackets in `fg-subtle`, `[ cancel esc ]`. Hint: 18×16 `muted` keycap + `muted-fg` description.                                                                                                                                                                                         |
| Prompt field  | `Terminal/Prompt field` Default, Focus, Error  | A real, keyboard-reachable text control. `label:` in `muted-fg` on one 24px line, `> value` on the next with the prompt in `primary-text`; 8×16 block cursor in `primary` on the field that has DOM focus, so it is absent while focus is in another pane. The block cursor styles the caret; it never replaces the control's visible focus indicator. Error: label and prompt in `destructive-text`, `✗ expired 2026-10-15`, repair helper on the next line indented past the prompt (X-04). |
| Check / radio | `Terminal/Check`                               | `[x]` in `primary-text`, `[ ]` in `muted-fg`; `(•)` / `( )` for single choice.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Tabs          | `Terminal/Tab`                                 | `1:overview`: index in `primary-text`, label in `muted-fg`. Selected: `hover` fill, `fg` text, 2px `ring` underline (X-05).                                                                                                                                                                                                                                                                                                                                                                   |
| Table row     | Frames `Row — *`                               | 24px line on the shared grid. Selected: full-width `primary` bar, `primary-fg` text, `▶` marker. Negative totals `-210.00` in `destructive-text`.                                                                                                                                                                                                                                                                                                                                             |
| Status        | `Terminal/Status` Ok, Wait, Ship, Fail, Refund | Six-character bracketed word, colour by role; a legend line explains the codes (X-04).                                                                                                                                                                                                                                                                                                                                                                                                        |
| Metrics       | Pane `metrics · 30d`                           | Right-aligned values, ▲/▼ deltas, 12 block trend bars per line.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Notice        | Pane `alerts · 2`                              | `WARN` / `INFO` level column, message, 68% sync bar (lime fill, dithered remainder).                                                                                                                                                                                                                                                                                                                                                                                                          |
| Log           | Pane `log · tail -f`                           | Time, level, verb, id, detail; one line each, truncated with `…`.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Top bar / nav | Status line + tab line                         | `◆ northwind  ~/commerce/orders … ● live  14:32:07 UTC  maya@prod`; numbered tabs; `/ search  ? help` keycaps.                                                                                                                                                                                                                                                                                                                                                                                |
| Help bar      | `Key hints`                                    | `shift+n create order • ctrl+s save • n/p next/prev page • ⏎ open order • tab switch pane • ? more`. The `tab switch pane` hint is provisional: S3 #2416 owns the keyboard map and must specify how pane switching dispatches without taking `Tab` away from normal control-to-control navigation.                                                                                                                                                                                            |
| Dialog        | Not drawn                                      | Anchor: a composited Lip Gloss layer with a double border. Owed to #2416.                                                                                                                                                                                                                                                                                                                                                                                                                     |

Hover, pressed, disabled and the editor-focused variant are not drawn (X-03, handed to #2416 and
#2419).

## Do's and Don'ts

- **Do** put every cell on the character grid and reserve the marker column on every row, so the
  selected row cannot shift columns (X-01).
- **Do** keep one 14/24 scale across panes and dim secondary columns; this is the owner's
  readability pass ("lacks a bit readability and consistency in columns, layout").
- **Do** keep it a TUI, but tidy: rounded panes, consistent 22/16/16/16 padding, 20px gaps. The
  owner found the first version "a bit too much raw but really not bad".
- **Do** show the active pane (the one containing DOM focus) with a 2px `ring` border and a
  `[focused]` suffix, and list only that pane's keys plus global keys in the help bar (X-02). The
  pane border is pane styling; each focused control still shows its own visible focus.
- **Do** keep every editable prompt, check and key reachable by keyboard, in a logical order. Give
  each composite (table, tab line, log) a documented way in and out; use roving focus only inside
  composites that call for it (tabs, lists, table rows). Never suppress native control focus.
- **Do** give global commands modifier keys (`shift+n`, `ctrl+s`) and keep `⏎` for the focused pane.
  Labels on keys must match the help bar (`[ save ctrl+s ]`).
- **Do** explain status codes with a legend and put repair text directly under the invalid prompt
  (X-04).
- **Don't** make the selected tab or the primary key a pale slab in dark (X-05, X-06). The lime
  selection _row_ is the one intentional inverse surface.
- **Don't** add shadows, glows, gradients or proportional fonts.
- **Don't** use colour as the only status signal; every status is a word.
- **Don't** break the grid with fractional widths; size fixed columns in ch and give the leftover
  space to one `minmax(0, 1fr)` track.

## Iconography & Imagery

- No icon set. Use Unicode glyphs from the mono font: `◆ ● ▶ ▲ ▼ ✗ ⏎ •` and box drawing `┤ ├ ─`.
  Check coverage in the fallback stack.
- Charts are character art: block trend bars and a block progress bar with a dithered remainder.
- No avatars, photos or illustration.

## Motion & States

- Anchor behaviour: spinners and cursors are frame-stepped; use `steps()` timing, never easing.
  Nothing is animated in Figma; runtime is owed to #2419.
- **Active pane and DOM focus are separate.** DOM focus moves between individual controls as on any
  web page: every editable prompt, check and key is reachable by keyboard and shows a visible focus
  indicator. The pane that contains DOM focus is styled as active (2px `ring` border, `[focused]`).
  The selection bar stays on the selected row when the pane is no longer active.
- **Composites:** each table, tab line and log documents its entry and exit route (for example `Tab`
  in and out, arrows inside). Roving focus is allowed only inside composites that call for it (tab
  lists, list and table rows), never across a pane of independent fields.
- **Pane switching** (`tab switch pane` in the help bar) is provisional until S3 #2416 specifies its
  dispatch in the keyboard map. Never suppress native control focus to imitate a TUI. The PNGs show
  the static active-pane styling only; they prove no keyboard behaviour (#2419).
- Reduced motion: no cursor blink, no spinner; show a static `…`.
- Proposed hover for keys (X-06, dark): `#2a2a2a` (gray/d/4). Not drawn; owed to #2416.

## Accessibility

| Pair                                                     | Light                | Dark                |
| -------------------------------------------------------- | -------------------- | ------------------- |
| `fg` on `bg`                                             | 15.88                | 18.10               |
| `muted-fg` on `bg`                                       | 5.77                 | 10.13               |
| `primary-text` on `bg`                                   | 4.67                 | 14.59               |
| Selected row `primary-fg` on `primary`                   | 8.14                 | 14.00               |
| Focused pane `ring` on `bg` (2px)                        | 4.67                 | 15.57               |
| Dark Save: label on fill / edge on canvas / edge on fill | —                    | 11.05 / 4.96 / 3.76 |
| Status words (`success`/`destructive`/`info` text)       | 4.94 / 12.12 / 12.30 | 11.05 / 9.97 / 9.99 |

Dark Save pixels _measured_ on the frozen `renders-r7/terminal--dark.png`: fill `#222222`, edge rows
y948 and y981 `#7b7b7b`, label `#bde56c`; the round-7 review sampled the edge at 3.7588:1. The other
ratios are _(token)_ arithmetic.

- Inactive pane borders (`border-strong` 1.87:1 light) are decorative containers; the active pane
  meets 3:1. The active-pane border is not a substitute for a control's own focus indicator.
- Keyboard: every editable prompt, check and key must be reachable and operable by keyboard (WCAG
  2.1.1) in a meaningful order (2.4.3). Proof is owed to #2416 (keyboard map) and #2419 (runtime); a
  PNG cannot show it.
- Hit targets: keys 32–34 tall; tabs 24–26 (pointer use is secondary; the keyboard path is primary).
- RTL: not meaningful for a TUI grid; mirror the pane layout only. Owed to #2419.

## NetScript Mapping

| Layer              | Value                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Signal` (mode id 2:7), the same name and lime primary as the Studio Signal flavor (Codex raised the same pale-primary finding on both: X-06, S-19) |
| Base gray × accent | Neutral × Ink on the frames; the Signal Theme mode supplies gray and lime directly                                                                  |
| Density            | `Compact` (set explicitly; no Density variable bound)                                                                                               |
| Flavor             | n/a                                                                                                                                                 |
| `data-theme`       | `terminal`                                                                                                                                          |
| Language roles     | none                                                                                                                                                |

- **Node-level exceptions** (author-reported bindings): the dark Save key instance `41:231` binds
  primitives: fill `color/gray/d/3` (`#222222`), stroke `color/gray/d/10` (`#7b7b7b`), and its three
  text layers `color/lime/d/11` (`#bde56c`). Reason: X-06 needs a dark-only key treatment while
  light Save stays a lime fill, and no scheme-aware role exists. In dark these equal
  `surface/muted`, `border/input` and `primary/text`, which the YAML uses. S1 must add a
  scheme-aware key role (name owned by code) and rebind the node.
- **Component mains caught up with the frames** (fixed in the r7 pre-review pass, 2026-10-28):
  - `Terminal/Key` Primary (`39:3`) now reads `[ save ctrl+s ]`.
  - `Terminal/Tab` Selected (`39:61`) is now the non-inverted tab: a `surface/hover` fill (`#f0f0f0`
    / `#222222`), a 2px inside bottom stroke in `border/ring` (lime) and `text/fg` text.
  - The author reports both frames re-export with 0 changed pixels.
  - **Remaining drift (author-reported):** the frame keys override line-height to 24 (unbound),
    while the main binds `type/body/line` (20). The main is 28 tall; the instances are 32 / 34.
- **Figma frames:** Light `41:297` "Terminal — Orders · Light", Dark `41:2` "Terminal — Orders"
  (1280×1052). Component sets on page "Language — Terminal" (`39:2`): Key `39:15`, Prompt field
  `39:37`, Status `39:48`, Check `39:57`, Tab `39:64`. No state-sheet frame.
- **Renders:** `renders-r7/terminal--{light,dark}.png` (byte-identical to the `renders-r6/` exports
  of the same names). The light render was added in the r7 pre-review pass and shows the current
  non-inverted tab.
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/terminal--{light,dark}.png` under `.llm/runs/design-system-s4--language-review/`,
  hashed in `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`; review input commit `affd6b158`). Node ids,
  variable modes, alias and `resolveForConsumer` chains, binding and unbound counts, effect-style
  values and Figma text-style weights in this file are **reported by the Figma author and
  independently unverified**: no frozen node/variable/effect/type export accompanies the snapshot.
  Ratios marked _measured_ were sampled on exported pixels; _(token)_ ratios are resolved-variable
  arithmetic; values marked _proposed_ stay proposals until a re-render proves them; runtime
  behaviour is unproven until #2419.

## Provenance

- **Sources:** Charm Lip Gloss v2 and Bubbles v2 (`charm.land`, MIT), lazygit `docs/Config.md`
  (MIT), Warp custom-theme schema (docs only). Reference pack `inventory/reference-packs.md` §4.
- **Review rounds** (independent Codex reviewer, run `design-system-s4--language-review`): r2
  X-01…X-04; r3 X-01 closed; r4 X-04 closed; r5 X-02 closed, X-05 opened; r6 light **PASS** (on the
  r5 render), dark CHANGES_REQUESTED (X-06); r7 **PASS** in both schemes on the frozen renders, with
  X-05 and X-06 CLOSED and X-03 handed to #2416/#2419. Round 7 also asked the document to stop
  suppressing per-control focus (TD-20), which _Motion & States_ now does. Round-2 findings are
  retained, but round 2's runtime was not attested as `gpt-6-astra`/`xhigh`; the rounds whose
  runtime was attested are identified in `review/worklog.md`.
- **Owner decisions (verbatim):** "Keep terminal and let's add s Pixel one for Mistral"
  (`worklog.md`, round 2→3); "Terminal is great but lacks a bit readability and consistency in
  columns, layout, ... It's s bit too much raw but really not bad" (`brief-r5.md`), which led to the
  character-grid pass.
- **Light render drift (resolved):** the r6 light PASS was given on `renders-r5/terminal--light.png`
  (1050 tall, inverse black tab). The current frame has a `#f0f0f0` selected tab with a lime
  underline. It is now exported as `renders-r6/terminal--light.png` (1280×1052), frozen for round 7
  as `renders-r7/terminal--light.png`.
- **Provisional:** names until S1 #2414 (the shared `Signal` mode must split from Studio); the
  editor-focus variant, hover, pressed and disabled keys, and the keyboard map including pane-switch
  dispatch: #2416 (X-03); 960px width behaviour with pinned id and total columns, and keyboard
  completion: #2419 (X-03).
- **Invented fixture content:** "northwind", `maya@prod`, orders SO-10477…SO-10482, customers,
  emails, amounts, metrics, alerts, log lines, the 214/314 sync count and the AUTUMN24 code are demo
  data from the shared Orders fixture.
