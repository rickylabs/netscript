# Tonal style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G1, Tonal + Bloom. Each theme has its own brief; this file is all the Tonal
  builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Tonal` (`16:2`).
- **Modes for every Tonal style set and strip:** Theme set **A** (`239:7`) and Theme **Tonal**
  (`14:0`). Density Comfortable (DESIGN L323-324: Tonal controls use fixed M3 sizes, so no Tonal
  height binds Density). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Tonal `radius/card` = 28
  (it was 16).

## Builder rules (identical in every brief)

1. **Scope.** Edit only the page(s) above. Never edit a base component set, a variable, a
   collection, another theme's page or `state.json`. If something shared looks wrong, stop and
   report it.
2. **One mutation at a time.** Use `use_figma` sequentially. Read `get_metadata` of a base set
   before restyling it.
3. **Section.** Create a top-level frame named **`Style components`** below the existing crafted
   frames and kits. Inside it, add one sub-frame per category, in base order: `Actions`, `Forms`,
   `Navigation`, `Overlays`, `Data display 1`. Each has a `Doc/Section label` instance (`230:10`) and the category's
   verification strip at the end. Set the explicit modes listed above on `Style components`.
4. **Names.** `<Theme>/<base set name>` verbatim, including the size split:
   - `Tonal/Button / md`;
   - private helpers keep their dot: `Tonal/.Focus ring`.
   
   **Existing kits.** If a kit set on this page would collide with a new name, rename the kit set
   to `<Theme>/Specimen kit/<name>`. Do not move it or touch its instances: node ids stay, so the
   crafted frames are unaffected.
5. **Contract parity.** This is what makes an instance swap keep overrides.
   - **Same as the base set:** every variant property name and value, every variant combination,
     every boolean, text and instance-swap property name (with the same defaults), and every part
     layer name (`root`, `label`, `icon-start`, `focus-ring`…).
   - **You may add** theme-only parts (new layer names) and theme-only boolean properties.
   - **Never** rename, remove or retype a base property, value or part. A part the style does not
     draw stays in the tree, hidden.
   - **Undrawn states.** Where the theme's spec does not draw a state, follow this brief's
     derivation. Write `derived` in that component's description.
6. **Bindings.** Bind through Theme set variables and Scheme roles exactly as the base does:
   - core roles;
   - this theme's own language roles;
   - Theme set `radius/*`, `type/*`, `font/*` and `size/*`, and Density.
   
   **Never bind** a primitive or another theme's language roles. The only exceptions are the ones
   this brief names. Seed every bound paint with its resolved colour. Keep 1px and 2px rules on
   whole tonals. Load every font listed below before editing text.
7. **Composites.** Composites nest this theme's own style sets (`Tonal/Field` nests `Tonal/Label`
   and `Tonal/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/tonal.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/tonal/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** Material 3 Expressive on NetScript roles. Tonal containers and shape carry the
hierarchy, without borders or shadows (L272-273). Violet `primary` fills only the hero, the
selected connected item, the FAB and filled buttons; `primary-container` marks selection
(L296-299).

**A Tonal strip must read at thumbnail size as:**

- full-pill buttons in four kinds: filled violet, tonal lavender, a 1px outline, and text;
- connected groups: 48 tall, 2px gaps, 8px inner corners, the selected item a violet full pill;
- filled text fields: a grey container with the label inside and a bottom indicator, never a box;
- 8px chips, the selected chip lavender with a leading check;
- surfaces separated by container steps and 2px gaps, never by a border or a shadow;
- a 52×32 switch with an outlined off track and a check in the on thumb;
- soft 8%/12% state layers instead of colour swaps;
- sentence-case Roboto Flex, no uppercase labels.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Orders, Light / Dark | `23:277` / `25:295` | Rail and indicator, pill search with avatar, tonal bell, outlined Export, connected filter group, filter and selected chips, segmented rows, status chips, Load more (tonal), filled fields (rest, focus, error), select field, textarea with counter, checkbox and switch options group, Cancel (text) and Save (filled), sync card with wavy progress, banner, activity list, floating toolbar and FAB. **Measure here first.** |
| State sheets, Light / Dark | `47:527` / `47:857` | Four button kinds × enabled, hover 8%, pressed 12%, focus 2/2, disabled; the filled field in six states; connected pressed morph; checkbox and switch states; segmented row states. Use the live frames: the PNG export `renders-r4/states--tonal--dark.png` is stale (pale `#baa7ff` fills), the live `47:857` is correct |
| Kits | `Tonal/Button` `16:28` (`Kind` Filled, Tonal, Outlined, Text, Elevated), `Tonal/Text field` `16:86` (`State` Enabled, Focused, Error, Disabled), `Tonal/Connected button` `22:328` (`Selected` × `Position` First, Middle, Last), `Tonal/Wavy progress` `22:333` (`Progress=68`) | Geometry to copy. Rename `Tonal/Button` to `Tonal/Specimen kit/Button` before creating `Tonal/Button / *`; rename the other three to `Tonal/Specimen kit/*` too, so the kits sit in one folder. Ignore `Kind=Elevated`: DESIGN lists four kinds (L353) and forbids shadows (L389) |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/tonal--light.png`, `tonal--dark.png` | Offline reference |

## 2. Tokens the style relies on

**Fonts** (load all): Roboto Flex Regular, Medium and SemiBold; Geist Mono Regular.

| Use | Bind | Tonal value (Light / Dark) |
| --- | --- | --- |
| Filled button, selected connected item, checked controls, on switch | `primary/default` | `#6550b9` / `#6e56cf` |
| Ink on violet | `primary/fg` | `#ffffff` / `#ffffff` |
| Selection: tonal button, selected chip and row, rail indicator, floating toolbar | `primary/container` | `#ebe4ff` / `#33255b` |
| Ink on selection | `primary/on-container` | `#2f265f` / `#e2ddfe` |
| Text and outlined buttons, focused label, progress | `primary/text` | `#6550b9` / `#baa7ff` |
| Page | `surface/bg` | `#fdfcfd` / `#121113` |
| Level 1: cards, rows, KPIs, drawer | `surface/container` | `#f2eff3` / `#232225` |
| Level 2: search, connected items, options, banner, menus, dialogs, sheets | `surface/container-high` | `#eae7ec` / `#2b292d` |
| Level 3: filled fields, switch track, highlighted rows | `surface/container-highest` | `#e3dfe6` / `#323035` |
| Text | `text/fg` | `#211f26` / `#eeeef0` |
| Supporting text; field indicator; switch off outline and thumb | `text/muted` | `#605e67` / `#bab7c0` |
| Outlined button, chip and checkbox edge | `border/input` | `#84828e` / `#7c7a85` |
| Focus ring, focused field indicator | `border/ring` | `#6550b9` / `#baa7ff` |
| Error indicator, label, helper and icon | `destructive/text` | `#641723` / `#ff9592` |
| Error tonal fill | `destructive/subtle` | `#feebec` / `#3b1219` |
| Status chips | `<tone>/subtle` + `<tone>/text` | success `#e9f6e9` + `#2a7e3b` / `#1b2a1e` + `#71d083`; warning `#fff7c2` + `#4f3422` / `#302008` + `#ffca16`; info `#e6f4fe` + `#113264` / `#0d2847` + `#70b8ff` |
| Disabled fill / label (filled kinds) | `state/disabled-container` / `state/disabled-fg` | `#1c1a1f1f` / `#ededf01f`; `#1c1a1f61` / `#ededf061` |
| State layers (layer opacity) | `state/hover-opacity` / `state/pressed-opacity` / `state/disabled-opacity` | 8 / 12 / 38 |
| Float shadow (menus, popovers, floating toolbar) | `effect/shadow`, `shadow/overlay/y`, `shadow/overlay/blur` | `#0f0f1414` / `#00000080`; 0 3 8 |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` |
| Tooltip | `tooltip/bg`, `tooltip/fg`, `tooltip/border`, `tooltip/kbd` | ink chip in Light; `surface/raised` with a hairline in Dark |
| Radius (bound) | `radius/control` 999 (buttons, pills, discs); `radius/input` 4 (field top corners, tooltip, kbd); `radius/card` 28; `radius/badge` 8 (chips, status); `radius/checkbox` 2; `tabs/item-radius` 8; `nav/radius` 16; `table/row-radius` 6 | — |
| Radius (documented literals) | 32 hero and form; 24 activity ends; 20 options-group ends, menus and FAB; 4 pressed connected inner corners and options inner corners (L341-347, L452-454) | — |
| Edge widths | `border/width` (1) for outlined edges and the rest indicator; literal 2 for the focused and error indicator and the switch off outline (L346-347) | 1 / 2 |
| Sizes | `size/checkbox` 18; `size/switch/width`, `height`, `thumb` 52/32/24; `size/icon/sm`, `md`, `lg` 18/24/24; `size/avatar/md`, `lg` 40/56; `size/kbd` 20 | — |

**Documented exception: literal geometry.** Heights, paddings and the literal radii above are fixed
M3 values (L323-324, L452-454). Draw them literally; do not bind Density heights. Every colour
still binds a role.

**Text roles:**

| Role | Recipe |
| --- | --- |
| T.body | `font/sans` (Roboto Flex) + `type/body/*` (14/20 Regular +0.25) |
| T.strong | `type/strong/*` (14/20 SemiBold +0.1): button, chip and connected labels, IDs (L311-312) |
| T.body-lg | `font/sans` + `type/heading/size` and `type/heading/line` (16/24) + `type/body/style` (Regular) + `type/title/tracking` (0): field values, search label, option rows (L94, L312) |
| T.small | `type/small/*` (12/16 Regular +0.4): labels inside fields, supporting text, counters |
| T.label | `font/label` + `type/label/*` (12/16 SemiBold +0.4): eyebrows, column labels, status chips |
| T.rail / T.rail-active | `type/small/*` / the same with `type/heading/style` (Medium): rail labels, Medium when active (L378-379) |
| T.heading | `type/heading/*` (16/24 Medium +0.15): names, card, dialog and sheet titles |
| T.data / T.mono | `font/data` (Roboto Flex) + `type/small/*` for counts; `font/mono` (Geist Mono) + `type/small/*` for kbd and URLs |

Text case is sentence case everywhere (L313). The base eyebrow's UPPER text case becomes Original.

## 3. Tonal recipes (referenced by the component rows)

- **T.state: state layer.** `Tonal/.State layer` is an absolute fill-container child behind the
  label, clipped to the host shape (L355, L396).
  - Fill: the host's on-colour: `primary/fg` on filled, `primary/on-container` on tonal and
    selected, `primary/text` on outlined and text, `text/fg` on container items, rows and fields.
  - Layer opacity bound to `state/hover-opacity` (8) on hover and `state/pressed-opacity` (12) on
    pressed.
  - Never swap the fill for hover: `primary/hover` stays unused.
- **T.focus.** `Tonal/.Focus ring`: the base ring (2px `border/ring` outside stroke, 2px
  transparent gap: "Focus 2/2", L337) in the host's shape: full on pills and discs, the field's
  corners + 2 on fields (`47:527`). Name the part `focus-ring`.
- **T.disabled.** Never an opaque grey (L396-397).
  - Filled, tonal and container kinds: fill `state/disabled-container`, label and icon
    `state/disabled-fg`, layer opacity 1 (L355-356).
  - Outlined: the edge stays `border/input`, the label is `state/disabled-fg` (`47:527`).
  - Text: label `state/disabled-fg`.
  - Fields and selection controls: root layer opacity `state/disabled-opacity` (38%; L365, measured
    on `47:527`).
- **T.step: tonal elevation.** A raised or hovered surface takes the next container step instead of
  a stroke or shadow: `container` → `container-high` → `container-highest` (L328-333). No surface
  carries a stroke, and `border/default` is unused.
- **T.pill: common button.** Full radius (`radius/control`), 40 tall, padding 0/24 (16 on the icon
  side), label T.strong, icons 18 (`size/icon/sm`) (L148-175, L353-355).
- **T.connected: connected group.** Copy `Tonal/Connected button` `22:328` (L176-189, L357-358).
  - Items: 48 tall, gap 2, padding 0/20 (measured on `23:277`), fill `surface/container-high`,
    label T.strong `text/fg`, count T.data `text/muted`.
  - Corners: outer corners full, inner corners 8; pressed inner corners morph to 4 (L398).
  - Selected item: a full pill in `primary/default`, label and count `primary/fg` (theme-character
    §2.1: the base binds `text/fg`; Tonal needs `primary-fg`).
  - Position comes from the parent: the group overrides the first item's leading corners and the
    last item's trailing corners to full, the way the base Button group overrides inner corners.
- **T.chip.** 32 tall, radius `radius/badge` (8), padding 0/16 (8 on the trailing-icon side), label
  T.strong, icons 18 (L190-196, L359-360).
  - Filter chip: 1px `border/input`, label `text/muted`, trailing chevron-down.
  - Selected chip: `primary/container`, label `primary/on-container`, a leading 18px check, no edge.
- **T.field: filled field.** Copy `Tonal/Text field` `16:86` (L197-203, L361-365, L455-459).
  - 56 tall, fill `surface/container-highest`, corners `radius/input` on the top (4/4/0/0), no box
    stroke.
  - Indicator: a bottom-only INSIDE stroke (weights 0/0/1/0) in `text/muted`.
  - Theme-only part `field-label`: absolute text at (16, 8), T.small `text/fg`. `text` stays in
    the flow with padding 24/16/8/16, T.body-lg. When an instance shows `icon-start`, override the
    label's x to 52.
  - Hover: indicator `text/fg`.
  - Focus: indicator 2px `border/ring`; `field-label` `primary/text`.
  - Error: indicator 2px `destructive/text`; `field-label` `destructive/text`; trailing `icon-end`
    alert-circle 24 in `destructive/text`.
  - Error + focus: the error treatment plus T.focus.
  - Disabled: T.disabled (38%).
- **T.target: 40px state target.** Checkbox, radio and the switch thumb sit in a 40 circle
  (theme-only part `state-target`) that carries the T.state layer and T.focus (L368; spec F5).
- **T.segment: segmented list.** Items 2px apart (`table/row-gap`), inner corners 6
  (`table/row-radius`), outer corners 28 on the first and last item (L211-223, L370-372). Options
  groups (the form's checkbox and switch rows) use outer 20 and inner 4 (`23:277`).
  - Hover: the next container step.
  - Selected: `primary/container` with `primary/on-container`; selected + hover adds the T.state
    layer (`47:527`).
- **T.float.** No stroke; DROP_SHADOW `effect/shadow`, x 0, y `shadow/overlay/y` (3), blur
  `shadow/overlay/blur` (8) (L334). Used by menus, popovers, hover cards and the floating toolbar.
  Dialogs and sheets sit on the scrim with no shadow (L389).
- **T.wave: wavy progress.** A 4px wave in `primary/text` ending in a 4px `primary/text` stop dot;
  the remainder is a straight 4px `text/muted` line (L383, L405). Copy `Tonal/Wavy progress`
  `22:333`.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Tonal anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Tonal's spec does not draw. The derivation uses only the
recipes above, or M3 Expressive anatomy, which DESIGN asks to match component by component (L388).

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Tonal/Icon`, `Tonal/Spinner`, `Tonal/.Focus ring` and
`Tonal/.State layer`.

| Style set | Base set | Tonal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tonal/Icon` | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** Tonal uses the shared Lucide-style set (L412), so make no glyph copies: the `glyph` swap keeps taking `Icon/<glyph>`. **Sizes** resolve through `size/icon/*` to sm 18, md 24, lg 24: 24 in the rail, search and toolbar, 18 in buttons and chips (L412). Stroke `icon/stroke` 2 | `size/icon/*`, `text/fg` via the parent |
| `Tonal/Spinner` | `Spinner` `252:11837` | (derived from T.wave and M3's circular indicator) A round-capped arc in `primary/text`, no track. In a Button `loading` state the arc takes the label role | `primary/text` |
| `Tonal/.Focus ring` | `.Focus ring` `252:11805` | T.focus | `border/ring` |
| `Tonal/.State layer` | `.State layer` `252:11806` | T.state. Hidden by default; the host sets fill and opacity per state | `state/hover-opacity`, `state/pressed-opacity` |
| `Tonal/Button / md` | `Button / md` `253:372` | T.pill, 40 (L134). **primary** = filled: `primary/default`, label `primary/fg`; hide the base `primary/stroke`. **secondary** = tonal: `primary/container`, label `primary/on-container`. **outline** = outlined: transparent, 1px `border/input`, label `primary/text`, padding 0/24/0/16 with an icon (L162-168). **ghost** = text: no fill or edge, label `primary/text`, padding 0/16 (measured on `47:527`). **destructive** (derived from the status-chip recipe, L300-301): `destructive/subtle` fill, label `destructive/text`; a tonal error button, never a red fill. **link** (derived): the text kind with padding 0; `underline` 1px `primary/text`, shown on hover and pressed. States: hover and pressed T.state in the kind's on-colour; focus T.focus; disabled T.disabled. The base control shadow resolves to 0 under Tonal; keep it bound and never add one (L389). `loading` shows `Tonal/Spinner` | `primary/*`, `border/input`, `destructive/*`, `state/*` |
| `Tonal/Button / lg` | `Button / lg` `254:721` | As md at 48 (derived: the connected and toolbar-action height, L136, L381), padding 0/24 | as md |
| `Tonal/Button / sm` | `Button / sm` `254:371` | As md at 32 (derived: the chip height, L137), padding 0/16 (12 on the icon side), label T.strong, icons 18 | as md |
| `Tonal/Button / xs` | `Button / xs` `254:1071` | As md at 24 (derived; M3 draws nothing under 32, so xs serves only as a field addon), padding 0/12, label T.label, icons 18 | as md |
| `Tonal/Icon button / md`, `/ lg`, `/ sm`, `/ xs` | `255:262`, `255:740`, `255:501`, `255:979` | Circles (`radius/control`), W = H 40, 48, 32 and 24 (L135). Glyph 24 (`size/icon/md`) on md and lg, 18 on sm and xs. **primary** = filled (`primary/default`, `primary/fg`). **secondary** = tonal (`primary/container`, `primary/on-container`): the bell on `23:277` (L380). **outline** = 1px `border/input`, glyph `text/muted` (L394). **ghost** = standard: no container, glyph `text/muted` (the row overflow and the rail menu button). **destructive** (derived) = the tonal error kind. States as Button | as Button |
| `Tonal/Button group` | `Button group` `257:839` | T.connected (spec A3 Lang Tonal). Gap 2 instead of −1. Items are `Tonal/Button` instances (sm nests `/ sm`; md and lg nest `/ lg`, because 48 is the only documented connected height, L136), with instance overrides: fill `surface/container-high`, label `text/fg`, inner corners 8, outer corners full. `separator` hidden: the 2px gap separates. `text` part (derived): T.small `text/muted` on `surface/container-high` with 8 corners | `surface/container-high`, `text/fg` |
| `Tonal/Toggle / md`, `/ sm`, `/ lg` | `256:281`, `256:437`, `256:593` | The chip (T.chip): md 32, sm 24 (derived), lg 40 (derived). **outline** = the filter chip: 1px `border/input`, label `text/muted`, `icon-end` chevron-down (L359). **default** (derived from T.step): no edge, `surface/container-high`, label `text/fg`. **selected** (both variants) = the selected chip: `primary/container`, label `primary/on-container`, no edge, and a theme-only `check` part (18px check before `icon-start`) that exists only in the selected variants (L360). Hover and pressed T.state in the label colour; focus T.focus; disabled T.disabled | `border/input`, `primary/container`, `primary/on-container` |
| `Tonal/Icon toggle / md`, `/ sm`, `/ lg` | `276:8291`, `276:8431`, `276:8571` | (derived from `Tonal/Icon button` and the selection policy, L296-298) Circles, W = H 40, 32 and 48. Off: **default** = standard (glyph `text/muted`); **outline** = 1px `border/input`. Selected: `primary/container`, glyph `primary/on-container`, no edge. States as Toggle | as Toggle |
| `Tonal/Toggle group` | `Toggle group` `257:528` | **segmented** = T.connected (spec A5 Lang Tonal; theme-character §2.1). The track is transparent; `tabs/gap` (2), `tabs/pad` (0) and `tabs/item-radius` (8) stay bound as in the base. Items are `Tonal/Toggle` instances overridden to the connected look: md 48 and sm 40 tall (derived), fill `surface/container-high`, label `text/fg`, `check` hidden; the selected item takes `primary/default` with `primary/fg`. Draw the selected pill in the style set: `tabs/sel-bg` resolves to `primary-container`, which is wrong here. **default** and **outline**: Toggles with gap 8 (measured between the Status and Last 30 days chips on `23:277`) | `primary/*`, `tabs/*` |
| `Tonal/Action bar` | `Action bar` `258:663` | **floating** = the floating toolbar (L250-256, L381; spec §4.7): a `primary/container` full pill, 64 tall, padding 8, T.float. `count` T.strong `primary/on-container`. `separator` hidden. The actions are 48 `Tonal/Icon button / lg` ghost instances with glyphs overridden to `primary/on-container`; `close` the same. Never the base inverse slab, which would be a pale slab in dark. **inline** (derived from the selected list row, L218-223): `primary/container`, radius 6, no shadow, `count` T.strong `primary/on-container` | `primary/container`, `primary/on-container`, `effect/shadow` |
| `Tonal/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Tonal/Button / sm` ghost (text buttons) | — |
| `Tonal/Theme toggle` | `Theme toggle` `258:742` | `Tonal/Icon button / md` ghost with moon and sun at 24 | — |

**Theme-only extras (outside the 84 rows; spec §4.7).** Optional, and only after the Actions strip
passes:

- `Tonal/FAB`: 64 square, radius 20 (literal), `primary/default`, a 28px glyph in `primary/fg`, and
  a DROP_SHADOW `effect/shadow` at 0 4 10 (literal y and blur) (L257-262, L335, L382). Never a
  second FAB in a rail (L401).
- `Tonal/Floating toolbar`: `Tonal/Action bar` floating with four named 48px actions (Filter
  orders, Export orders, Copy order ID, More order actions) beside the FAB, bottom centre
  (L381-382, L402-403). Its viewport and scroll behaviour stay unproven (#2419, L407-408).

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Tonal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tonal/Label` | `Label` `278:45` | **default:** T.small `text/fg` (enabled field labels bind `fg`, L392). **eyebrow:** T.label `text/muted`, text case Original (L313). `required-mark`: `text/muted` at rest and disabled, `destructive/text` when invalid (as the base). `optional-hint`: T.small `text/muted`. **invalid:** `destructive/text`. **disabled:** `state/disabled-fg` | — |
| `Tonal/Input` | `Input` `279:312` | T.field. **md** 56 (L138). **sm** 48 (derived): `field-label` at (16, 4), `text` padding 20/16/4/16. Value T.body-lg `text/fg`; placeholder `text/muted`. `icon-start` and `icon-end` 24 in `text/muted`. States as T.field: hover, focus, invalid, invalid-focus, disabled. The theme-only `field-label` holds "Label" by default; instances override it | `surface/container-highest`, `text/muted`, `border/ring`, `primary/text`, `destructive/text` |
| `Tonal/Textarea` | `Textarea` `280:597` | T.field at a minimum of 112 (L366-367). `root` has no fill. Add a theme-only absolute `container` behind `text`: fill `surface/container-highest`, corners 4/4/0/0, a bottom-only 1px `text/muted` stroke, constraints left-right stretch, top 0, bottom offset = the `footer` height. `text` padding 24/16/8/16 with `field-label` at (16, 8). `footer` sits below the container in the flow, so `counter` (T.small `text/muted`, "Optional · 0 / 500") reads under the field as on `23:277`. `resize-handle`: an 18 grip in `text/muted` at the container's bottom-trailing corner. States as Input; focus moves the indicator, not the counter | as Input |
| `Tonal/Select` | `Select` `281:1023` | The Input recipe with a trailing `chevron` 24 in `text/muted` (Shipping method on `23:277`). **open** (derived from focus): indicator 2px `border/ring`, `field-label` `primary/text`, chevron rotated 180°, content = `Tonal/Menu content` 4px below. **invalid** as Input | as Input |
| `Tonal/Select content` | `Select content` `281:826` | `Tonal/Menu content` holding `Tonal/Menu item` `type=option` | — |
| `Tonal/Checkbox` | `Checkbox` `283:1470` | `control` 18 (`size/checkbox`), radius `radius/checkbox` (2), centred in a T.target (L368). **Unchecked:** 2px `border/input` edge, no fill (L28, L394). The crafted frames measure `muted-fg` on this outline; build with `border/input` and note the difference in the Forms strip. **Checked:** `primary/default` fill, no edge, `indicator` check 18 in `primary/fg`. **Indeterminate:** a minus in `primary/fg`. **Hover:** T.state on the target, `text/fg` when unchecked and `primary/default` when checked. **Focus:** T.focus on the target. **Invalid:** edge `destructive/text`. **Disabled:** 38%. `label` T.body-lg `text/fg`; `description` T.body `text/muted` (the options group on `23:277`) | `border/input`, `primary/*` |
| `Tonal/Radio` | `Radio` `284:1828` | (derived from Checkbox and the M3 radio) An 18 circle (`size/checkbox`) with a 2px `border/input` ring in a T.target. **Checked:** ring `primary/default` and an 8 `indicator` dot in `primary/default`. States as Checkbox | as Checkbox |
| `Tonal/Radio group` | `Radio group` `284:1885` | Nests `Tonal/Radio` | — |
| `Tonal/Switch` | `Switch` `285:2329` | 52×32 `track` (`size/switch/*`; md and sm are the same in Tonal), full radius (L368-369; `47:527`). **Off:** track `surface/container-highest` with a 2px `text/muted` INSIDE stroke; `thumb` a 16 `text/muted` ellipse, 8 from the leading edge. **On:** track `primary/default`, no stroke; `thumb` 24 (`size/switch/thumb`) in `primary/fg`, 4 from the trailing edge, with a theme-only `thumb-icon` (a 16 check in `primary/default`) centred on it. **Hover** (derived from T.target): a theme-only 40 `thumb-target` circle behind the thumb carries T.state (`text/fg` off, `primary/default` on). **Focus:** T.focus on `track`. **Invalid** (derived): track stroke 2px `destructive/text`. **Disabled:** 38%. `label` T.body-lg `text/fg`, `description` T.body `text/muted` | `surface/container-highest`, `text/muted`, `primary/*`, `size/switch/*` |
| `Tonal/Field` | `Field` `287:2656` | Nests `Tonal/Label` and `Tonal/Input`. **vertical:** the label sits inside the field (L361), so the nested `label` instance stays in the tree, hidden, and the Input's `field-label` carries the text. **horizontal:** keeps the label column. `description`: supporting text T.small `text/muted`, inset 16 (`23:277`). `error-row`: `error` T.small `destructive/text`, a full repair sentence (L364, L392), inset 16; `error-icon` hidden, because the alert icon sits in the field | — |
| `Tonal/Field set` | `Field set` `287:2743` | `legend` T.heading `text/fg`. `separator` hidden: groups separate by 16 of space, not by a rule (L323, L389) | — |
| `Tonal/Input group` | `Input group` `297:3861` | The `Tonal/Input` frame (56, filled). Addon: a 24 icon in `text/muted`, T.body-lg `text/muted` text, or a `Tonal/Icon button / md` ghost, which fits the 56 field as an M3 trailing icon. The block alignments use `Tonal/Textarea` | — |
| `Tonal/OTP slot` | `OTP slot` `301:4385` | (derived from T.field) Each slot is its own 48×56 filled field with no `field-label`; the character is T.body-lg, centred. **caret:** a 2×24 `primary/text` bar. **Focus:** indicator 2px `border/ring`. **Invalid:** indicator 2px `destructive/text`. **Disabled:** 38%. Slots never share edges | as Input |
| `Tonal/Input OTP` | `Input OTP` `301:4490` | Group gap 8 instead of −1, each slot keeping its own top corners; the separator is a minus 24 in `text/muted` | — |
| `Tonal/Slider` | `Slider` `303:5022` | (derived, M3 Expressive slider per L388) `track` 16 tall, full radius: `range` `primary/default`, the rest `primary/container`, with a 6 gap either side of the thumb. `thumb`: a 4×44 `primary/default` bar, full radius; the base ellipse becomes a frame with the same layer name. A 4 `primary/default` stop dot at the inactive end. `value-label` T.data in a `tooltip/bg` pill with `tooltip/fg`. Hover: T.state on the thumb; focus T.focus on the thumb; disabled 38%. The rounded rectangles keep their layer names | `primary/*`, `tooltip/*` |
| `Tonal/Combobox` | `Combobox` `305:5623` | `Tonal/Input` plus `Tonal/Menu content`. Chips are `Tonal/Badge` subtle with `remove` (4.5). `empty` T.body `text/muted` | — |
| `Tonal/Calendar day` | `Calendar day` `307:6154` | (derived, M3 date picker per L388) 40 circle (full radius), label T.body `text/fg`. **Hover:** T.state `text/fg`. **today:** a 1px `primary/default` ring, label `primary/text`. **single, range-start, range-end:** `primary/default` circle, label `primary/fg`. **range-middle:** a `primary/container` band, radius 0, label `primary/on-container`. **outside:** `text/muted`. **Disabled:** `state/disabled-fg`. **Focus:** T.focus | `primary/*` |
| `Tonal/Calendar` | `Calendar` `309:8620` | (derived from the dialog note, L384) `surface/container-high`, `radius/card` 28, padding 16, no stroke. Caption T.strong `text/fg`; weekdays T.small `text/fg`; nav `Tonal/Icon button / md` ghost; month select `Tonal/Select` sm | — |
| `Tonal/Date picker` | `Date picker` `313:14889` | `Tonal/Select` trigger with a calendar `icon-start` (the M3 docked picker). Open = `Tonal/Popover` holding `Tonal/Calendar` | — |
| `Tonal/Search` | `Search` `316:16426` | The search bar (L204-210, L380): `surface/container-high`, full radius, no stroke in any state (L389). **md** 56 (L139); **sm** 48 (derived). Leading search icon 24 in `text/muted`; `label` T.body-lg `text/muted`; padding 0/16 (measure `23:277`); `kbd` = `Tonal/Kbd` (4.5). Theme-only boolean `avatar` (default false) shows a trailing avatar circle in `primary/container` with initials T.label `primary/on-container`, 36 as measured on `23:277` (L380). **Hover:** T.state `text/fg`. **Focus:** T.focus. **open** (derived from T.step): `surface/container-highest` | `surface/container-high`, `text/muted`, `primary/container` |
| `Tonal/Dropzone` | `Dropzone` `319:16832` | (derived) No dashes and no edge (L389): rest `surface/container`, `radius/card` 28. `icon`: an upload glyph 24 in `primary/on-container` inside a 44 shape badge in `primary/container` (copy a KPI badge shape from `23:277`; L345-346, L377). `label` T.strong, `hint` T.small `text/muted`. **hover:** `surface/container-high`. **active:** `primary/container`, text `primary/on-container`. **uploading:** a T.wave bar. **invalid:** `destructive/subtle`, `status` `destructive/text`. **Focus:** T.focus. **Disabled:** 38% | `surface/container*`, `primary/*`, `destructive/*` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Tonal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tonal/Location marker` | `Location marker` `337:22` | (derived; `deco/marker` is false in Tonal, so it shows only where a parent forces it) A circle, sm 4 and md 6, in `primary/text`: the wave's stop dot (L383) | `primary/text` |
| `Tonal/Breadcrumb item` | `Breadcrumb item` `338:92` | (derived) Roboto Flex throughout; Tonal sets no mono breadcrumb (L308). Link T.body `text/muted`, `text/fg` on hover. Current T.strong `text/fg`. `separator` chevron-right 18 `text/muted`. Ellipsis more-horizontal 18 | — |
| `Tonal/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Tonal/Breadcrumb item` | — |
| `Tonal/Page key` | `Page key` `339:270` | (derived from `Tonal/Icon button`) 40 circles, label T.body `text/fg`. **Rest:** no container. **Hover and pressed:** T.state `text/fg`. **current:** `primary/container`, label `primary/on-container` (L296-298). **previous and next:** `Tonal/Button / sm` ghost with chevrons. **Disabled:** `state/disabled-fg`. **Ellipsis:** T.body `text/muted` | `primary/container`, `primary/on-container` |
| `Tonal/Pager tile` | `Pager tile` `339:319` | (derived from the KPI cards, L243-249) `surface/container`, `radius/card` 28, no stroke, padding 20. Hover `surface/container-high` (T.step). `direction` T.small `text/muted`; `title` T.heading `text/fg`. Focus T.focus | `surface/container*` |
| `Tonal/Pagination` | `Pagination` `339:379` | `meta` T.small `text/muted`; nests `Tonal/Page key` and `Tonal/Pager tile` | — |
| `Tonal/Tab / horizontal` | `Tab / horizontal` `342:402` | **default** and **segmented** = a T.connected item: 48 tall, `surface/container-high`, inner corners `tabs/item-radius` (8), padding 0/20, label T.strong `text/fg`, `count` = `Tonal/Badge` plain (T.data `text/muted`). **selected:** the `primary/default` full pill; label and count `primary/fg` (override the nested Badge label) (theme-character §2.1). **line** (derived, M3 primary tab per L388): no fill; the selected `indicator` is a 3px `primary/default` bar with 3px top corners under the label, label `primary/text`. `marker` hidden (`deco/marker` false). **Hover:** T.state. **Pressed:** inner corners 4 (T.connected). **Focus:** T.focus. **Disabled:** label `state/disabled-fg` | `primary/*`, `surface/container-high` |
| `Tonal/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal; segmented items stack on 2px gaps; `line` puts the 3px indicator on the inline-start edge | as horizontal |
| `Tonal/Tabs list` | `Tabs list` `343:424` | No track (`tabs/track` is transparent), gap `tabs/gap` (2), padding `tabs/pad` (0). Override the first item's leading corners and the last item's trailing corners to full (T.connected). `line`: gap 0 and no divider rule (L389) | `tabs/*` |
| `Tonal/Tabs` | `Tabs` `343:489` | Nests `Tonal/Tabs list` | — |
| `Tonal/Nav item` | `Nav item` `345:601` | **collapsed=true** = the rail item (L378-379): 80 wide, 60 tall, V-AL. A theme-only absolute `indicator` (56×32, radius `nav/radius` 16) sits behind `nav-icon` (24); `nav-label` below in T.rail `text/muted`, centred. **selected:** indicator `nav/active` (`primary-container`), icon `primary/on-container`, label T.rail-active `text/fg`. **collapsed=false** (derived from the rail indicator): a 48 row, full width, the row itself filled `nav/active` when selected with radius `nav/radius` 16; icon 24, label T.body `text/muted`, selected T.strong `primary/on-container`. **Hover:** T.state `text/fg` on the indicator or row. `count` = `Tonal/Badge` plain, no pill (as the connected counts). `chevron` 18 `text/muted`. `marker` hidden. Level 2 indents 24 | `nav/active`, `nav/radius`, `primary/on-container` |
| `Tonal/Nav group` | `Nav group` `346:611` | Group label T.label `text/muted`, sentence case; nests `Tonal/Nav item`. In the rail the label is hidden and items stack at the pitch measured on `23:277` | — |
| `Tonal/Sidebar` | `Sidebar` `347:994` | **collapsible=icon** = the navigation rail (L317; spec N4 Lang Tonal): 96 wide (L142), `surface/bg`, no trailing stroke (L389), a `Tonal/Icon button / md` ghost (panel-left) at the top, then rail items. No FAB in the rail (L378-379, L401). **expanded** (derived): a 240 `surface/container` drawer; T.step replaces the trailing rule; items are Nav item collapsed=false. **floating** (derived): the drawer at `radius/card` 28, inset 8, no shadow. **inset:** the content area is `surface/container` at `radius/card` 28 | `surface/bg`, `surface/container` |
| `Tonal/Top bar` | `Top bar` `351:1349` | No bar (L380; `topbar/rule-width` 0): fill `surface/bg`, no rule, no shadow. **Desktop:** the height hugs the 56 search plus 12 above and below (derived; the crafted search sits 24 from the frame top). `topbar-start`: `Tonal/.Brand logo`, the wordmark T.heading `text/fg`, or `Tonal/Breadcrumb`. `topbar-end`: `Tonal/Search` md with `avatar` on (the avatar slot of the bar is then hidden), the tonal bell `Tonal/Icon button / md` secondary (L380) and `Tonal/Theme toggle`. **Mobile** (derived): 64 tall (M3 top app bar), `Tonal/Sidebar toggle` lg, the search collapsed to a `Tonal/Icon button / md` ghost. **docs:** `Tonal/Navigation menu` in the start | `surface/bg` |
| `Tonal/.Brand logo` | `.Brand logo` `344:410` | (derived; Tonal draws no logo) A 40 circle in `primary/container` with the N monogram in `primary/on-container`: the avatar recipe (L413). Never the sunny shape, which is reserved for the selected order (L399-400) | `primary/container`, `primary/on-container` |
| `Tonal/Nav menu item` | `Nav menu item` `349:1036` | (derived) A 40 pill (T.pill geometry), label T.strong `text/fg`. **Hover:** T.state. **selected:** `primary/container`, label `primary/on-container`. **open:** `surface/container-high` (T.step) and the chevron rotated 180°. `marker` hidden | `primary/*` |
| `Tonal/.Nav menu link` | `.Nav menu link` `348:1108` | **highlighted:** `surface/container-highest` (the next step on the container-high viewport), radius 4. Title T.strong, description T.small `text/muted` | — |
| `Tonal/Navigation menu` | `Navigation menu` `349:1132` | The viewport is the `Tonal/Menu content` recipe | — |
| `Tonal/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) A 40 pill, T.strong `text/fg`. **Hover:** T.state. **open:** `surface/container-high` | — |
| `Tonal/Menubar` | `Menubar` `349:1236` | Root: a `surface/container` full pill, padding 4, no stroke (T.step replaces the base border). Menus are `Tonal/Menu content` | `surface/container` |
| `Tonal/Step` | `Step` `352:1355` | (derived) `indicator`: a 24 circle (`radius/control`), number T.label. **complete:** `primary/default` with a check 18 in `primary/fg`. **current:** `primary/container`, number `primary/on-container`. **upcoming:** `surface/container-high`, number `text/muted`. **error:** `destructive/subtle` with an alert 18 in `destructive/text`. **connector:** a 4px full-radius bar (T.wave weight, straight): `primary/text` when complete, `surface/container-highest` otherwise. `title` T.strong, `description` T.small `text/muted` | `primary/*`, `destructive/*` |
| `Tonal/Stepper` | `Stepper` `352:1424` | Nests `Tonal/Step` | — |
| `Tonal/Sidebar toggle` | `Sidebar toggle` `344:462` | `Tonal/Icon button / sm` and `/ lg` ghost with panel-left, menu and x at their sizes' glyph | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Tonal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tonal/.Kbd` | `.Kbd` `370:31` | Retired by the B6 build; build `Tonal/Kbd` in 4.5 instead. Every former `.Kbd` reference points at `Tonal/Kbd` | — |
| `Tonal/Menu item` | `Menu item` `371:587` | (derived from the options group on `23:277`) 48 tall (M3 list item), padding 0/12, radius 4, label T.body `text/fg`, icons 24 `text/muted`. **highlighted:** `surface/container-highest` (T.step). **destructive:** label and icon `destructive/text`; highlighted adds `destructive/subtle`. **type=option:** a theme-only absolute `checked-fill` (`primary/container`, radius 4) whose visibility binds to `checked`, present only in the option variants. Indicators: a check 18 in `text/fg` (checkbox, option), an 8 dot in `primary/default` (radio), chevron-right 24 `text/muted` (submenu). `shortcut` = `Tonal/Kbd` sm. **disabled:** `state/disabled-fg`. `loading` shows `Tonal/Spinner` | `surface/container-highest`, `destructive/*`, `primary/container` |
| `Tonal/Menu label` | `Menu label` `373:35` | T.label `text/muted`, sentence case (L313) | — |
| `Tonal/Menu separator` | `Menu separator` `373:38` | No rule (L389): `root` keeps its name as a transparent 8-tall spacer, so groups read by the gap | — |
| `Tonal/Menu group` | `Menu group` `373:248` | Nests `Tonal/Menu label` and `Tonal/Menu item` | — |
| `Tonal/Menu content` | `Menu content` `373:256` | `surface/container-high`, radius 20 (literal; the options-group ends, L343), padding 4, no stroke, T.float | `surface/container-high`, `effect/shadow` |
| `Tonal/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Tonal/Button / md` outline plus a chevron-down; `Tonal/Menu content` 4px below | — |
| `Tonal/Context menu` | `Context menu` `374:653` | The trigger area is `surface/container` at `radius/card` 28 with T.body `text/muted`; no dashes (L389) | `surface/container` |
| `Tonal/Dialog` | `Dialog` `378:743` | L384: `content` `surface/container-high`, `radius/card` 28, no stroke and no shadow (L389), padding 24 (L146). `backdrop` `surface/overlay`. `title` T.heading `text/fg`. `description` T.body `text/muted`. `close`: `Tonal/Icon button / md` ghost. Footer: `Tonal/Button / md` ghost for cancel and primary for the action, as the form footer on `23:277` | `surface/container-high`, `surface/overlay` |
| `Tonal/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a 44 shape badge (copy the banner badge on `23:277`; L345-346, L377) with a 24 glyph: default `primary/container` + `primary/on-container`; destructive `destructive/subtle` + `destructive/text`. `cancel` `Tonal/Button / md` ghost; `action` primary or destructive | `primary/container`, `destructive/*` |
| `Tonal/Sheet` | `Sheet` `379:1004` | (derived from L384) `surface/container-high`, `radius/card` 28 on the exposed corners only, no stroke on any edge, no shadow, padding 24. `handle`: the base 36×4 bar recoloured `text/muted`, full radius (the M3 drag handle). `close` `Tonal/Icon button / md` ghost. Title T.heading | `surface/container-high`, `text/muted` |
| `Tonal/Drawer` | `Drawer` `379:1150` | As Sheet; the footer buttons are `Tonal/Button / md` | — |
| `Tonal/Popover` | `Popover` `381:937` | (derived) `surface/container-high`, radius 20 (literal, as menus), padding 16, no stroke, T.float. `arrow` hidden: M3 surfaces have no arrow. `title` T.strong, `description` T.small `text/muted`, `close` `Tonal/Icon button / sm` ghost | `surface/container-high`, `effect/shadow` |
| `Tonal/Tooltip` | `Tooltip` `381:1030` | (derived, M3 plain tooltip) `tooltip/bg`, radius `radius/input` (4), 24 tall, padding 0/8, label T.small `tooltip/fg`, stroke `tooltip/border` (merged in Light, the hairline in Dark). `arrow` hidden. kbd `Tonal/Kbd` inverse | `tooltip/*` |
| `Tonal/Hover card` | `Hover card` `381:1093` | `surface/container-high`, `radius/card` 28, padding 20, T.float. Avatar: `Tonal/Avatar` md, initials (a 40 circle in `primary/container` with `primary/on-container` initials, L413). `title` T.heading, `description` T.body `text/muted`, `meta` T.small `text/muted` | `primary/container`, `primary/on-container` |
| `Tonal/Command item` | `Command item` `382:1015` | (derived from T.segment) Radius 6 (`table/row-radius`), padding 0/16; label T.strong `text/fg`; `url` T.mono `text/muted`; excerpt T.small `text/muted`. **selected:** `primary/container`, label and enter glyph `primary/on-container`; the 2px marker stroke hidden. `kind` is a status chip: 28 tall, `radius/badge` 8, `<tone>/subtle` fill, a leading 18 status icon and T.label in `<tone>/text` (L224-230, L373). `shortcut` = `Tonal/Kbd` sm | `primary/*`, `<tone>/*` |
| `Tonal/Command palette` | `Command palette` `383:1355` | The Dialog recipe. `input-row`: the search bar recipe (56 full pill in `surface/container-highest`, one step above the dialog) holding the strokeless input and a `Tonal/Kbd` "Esc"; no divider. Filters are `Tonal/Tab` segmented. Groups are items on 2px gaps (T.segment, outer 20 and inner 4). `footer` T.small `text/muted`, transparent, no rule | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Build `Tonal/Kbd`, `Tonal/Badge` and `Tonal/Avatar` first: rows in 4.2 to 4.4 now nest them.

| Style set | Base set | Tonal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tonal/Kbd` | `Kbd` `403:28` | (derived; replaces the retired `.Kbd`) **default:** `surface/container-highest`, radius `radius/input` (4, the M3 extra-small shape), no stroke (L389). H `size/kbd` (md) and `size/kbd-sm` (sm), minimum width = H. Label as the base (`font/mono` Geist Mono, `type/label` size and line, `type/caption` style and tracking) in `text/muted`. **inverse:** as the base (`tooltip/kbd`, `tooltip/border`, `tooltip/muted`); keep the stroke, because the Dark `tooltip/kbd` equals the Dark tooltip fill | `surface/container-highest`, `tooltip/*` |
| `Tonal/Kbd group` | `Kbd group` `403:96` | Nests `Tonal/Kbd`; the "+" separator in T.small `text/muted`, gap 4 as the base | — |
| `Tonal/Badge` | `Badge` `405:180` | The status chip (L224-230, L300-301, L373; `23:277`): 28 tall, radius `radius/badge` (8), padding 0/8, gap 4, label T.label in sentence case (no mono, no uppercase). Tonal leads with a status glyph, not a dot: the base `dot` part becomes an 18 Icon instance with the same layer name and the same `dot` binding, glyph per tone as on `23:277` (success circle-check, warning alert-triangle, info info, destructive alert-circle, neutral arrow-right). **subtle** (Tonal's primary style): `<tone>/subtle` fill, glyph and label `<tone>/text`; neutral is `surface/container-high` with `text/muted` (Refunded on `23:277`). **outline** (derived from the filter chip, L359, L394): transparent, 1px `border/input`, glyph and label `<tone>/text` (neutral `text/muted`). **solid** (derived): `<tone>/default` with `<tone>/fg` as the base; neutral is `surface/container-highest` with `text/fg`; never a violet fill (L296-298). **plain:** no container, padding 0, `dot` hidden, label T.data in `<tone>/text` (neutral `text/muted`): the connected-group counts. `iconStart`: an 18 glyph before the label. `remove`: an x 18 at the end in the label colour (input chips) | `<tone>/subtle`, `<tone>/text`, `surface/container-high`, `border/input`, `radius/badge` |
| `Tonal/Badge / kind` | `Badge / kind` `405:211` | (derived) The outline Badge geometry (28, `radius/badge` 8, 1px `border/input`, T.label). Label and `dot` in the base `code/syntax/*` or `text/fg` role; the `dot` stays a 6 circle, because API kinds have no status glyph | `border/input`, `code/syntax/*` |
| `Tonal/Avatar` | `Avatar` `406:95` | Circles (`radius/avatar` 999), sizes through `size/avatar/*` (24, 40, 56; L413). **initials:** `primary/container` with initials in `primary/on-container`: T.label on sm, T.strong on md and lg (`23:277`). **fallback** (derived): the same fill with a `user` glyph in `primary/on-container`. **agent** (derived; the accent policy keeps violet off avatars, L296-298): `primary/container` with the bot glyph in `primary/on-container`. **image:** clipped to the circle. Theme-only boolean `sunny` (default false) swaps the circle for the Expressive 8-point sunny shape (copy the selected row's avatar on `23:277`), reserved for the selected order (L344-345, L399-400). The fill stays the avatar's; `Tonal/Table row` selected overrides it to `primary/default` with `primary/fg` initials. `presence` = `Tonal/Avatar presence` | `size/avatar/*`, `primary/container`, `primary/on-container` |
| `Tonal/Avatar presence` | `Avatar presence` `406:43` | (derived) An 8 circle with the base status fills (`success/default`, `warning/default`, `border/strong`). The 2px OUTSIDE ring takes `card/bg` (`container`, the surface Tonal avatars sit on) instead of `surface/card` | `card/bg` |
| `Tonal/Avatar group` | `Avatar group` `406:150` | (derived) Nests `Tonal/Avatar`; overlap −8 as the base, each ring 2px `card/bg`. The count avatar is `surface/container-high` with T.label `text/fg` | `card/bg`, `surface/container-high` |
| `Tonal/Item` | `Item` `408:792` | The activity item (L342; `23:277`). **default:** `surface/container`, radius 4 (literal, the activity inner corner; `Tonal/Item group` sets the 24 ends), no stroke. **muted:** `surface/container-high`, one step up. **outline** (derived; Tonal never outlines a surface, L389): transparent at rest, `surface/container` on hover. Sizes: **default** 68 tall (measured), padding 0/16, gap 16, 40 media; **sm** 56 (the options row on `23:277`); **xs** 48 (derived). `title` T.heading `text/fg` (names, L311); `description` T.body `text/muted`. `media`: `Tonal/Avatar` md, `Tonal/.Item icon tile` or `Tonal/.Item image`. `actions`: `Tonal/Button / sm` outline. `chevron` 24 `text/muted`. `header` and `footer` T.small `text/muted`. **hover:** the next container step (T.step). **focus:** T.focus | `surface/container*` |
| `Tonal/Item group` | `Item group` `408:996` | T.segment with the activity ends (L342; `23:277`): items 2px apart, the first item's top corners and the last item's bottom corners 24 (instance overrides), inner corners 4. **separators=true:** the 2px gap is the separator; no rule (L389). **separators=false** (derived): gap 0, one continuous `surface/container` list with only the 24 outer corners | — |
| `Tonal/.Item icon tile` | `.Item icon tile` `408:82` | The KPI shape badge (L345-346, L377; 40 as measured on `23:277`) replaces the 32 square tile: an Expressive shape in `primary/container` with a 24 glyph in `primary/on-container`. Copy the shape from a secondary KPI on `23:277` | `primary/container`, `primary/on-container` |
| `Tonal/.Item image` | `.Item image` `408:85` | (derived) As the base: 40×40 at `radius/input` (4, the M3 extra-small shape) | — |
| `Tonal/Card` | `Card` `409:951` | **default** = the Tonal card (L130, L272-276, L328-333; theme-character §2.4): `card/bg` (`container`), `radius/card` (28), no stroke (`card/border-*` are 0), no shadow (R.card-shadow resolves to 0); padding 24 on md (L146) and 20 on sm (L248). Header: `eyebrow` T.label `text/muted`, sentence case; `title` T.heading `text/fg`; `description` T.body `text/muted`; `action` `Tonal/Button / sm` ghost (View all on `23:277`). `footer` drops the `card/footer` fill and the top rule (L389) and holds text and tonal buttons, as the banner actions (L377). **hover:** `surface/container-high` (T.step). **focus:** T.focus (28 + 2). **selected:** `primary/container` with `primary/on-container` text (the sync card, L298). **rule** (derived from the Recent activity section on `23:277`): no fill, rule or radius; the header (T.heading title, ghost action) sits 16 above the body; hover `surface/container` at 28 | `card/bg`, `radius/card`, `primary/container` |
| `Tonal/Stat card` | `Stat card` `409:1270` | The KPI tiles (L231-249, L374-376; `23:277`). **default** = a secondary KPI: `kpi/bg-1` (`container`), `radius/card` (28), no border (`kpi/border-*` 0), padding 20/20/16 (`kpi/pad-x` 20, L248). Head: `icon` inside a 40 shape badge (the `.Item icon tile` recipe) beside `label` in T.body `text/muted`, sentence case (measured). Value T.kpi-sm (32/40 Medium) `text/fg`. Delta (L376): a 24-tall full pill in `success/subtle` or `destructive/subtle` with an 18 arrow and T.label in `success/text` or `destructive/text`. `detail` T.small `text/muted`. No decoration: `deco/*` are false and secondary KPIs never carry a sparkline (L376, L401). **hero** = the hero KPI (L231-242, L374-375; theme-character §2.1): `primary/default`, radius 32 (literal), padding `hero/pad` (24/24/20), every text and glyph `primary/fg`: `label` T.strong, value T.kpi (45/52 Medium), delta an arrow plus T.strong with no pill. A theme-only `hero-sparkline` part, shown only on hero: an area of `primary/fg` at 18% layer opacity under a 2.5px `primary/fg` line (L375). The hero hides `icon`. Dark keeps `#6e56cf` with white (L302-303). `badge` = `Tonal/Badge` subtle | `kpi/*`, `primary/default`, `primary/fg`, `hero/pad` |
| `Tonal/Table header cell` | `Table header cell` `410:546` | The column labels (L370; `23:277`): no fill (`table/head` is transparent), height 40 (derived), label T.label `text/muted` in sentence case, not uppercase (L313). Sort glyphs arrow-up-down, arrow-up and arrow-down at 18 in `text/muted`; a sorted label is `text/fg`. **hover** (derived): T.state `text/fg` in an 8-radius shape. **focus:** T.focus | — |
| `Tonal/Table cell` | `Table cell` `410:383` | Cells of the 72 segmented row (L140, L370; `23:277`): height 72 (literal; the Density row height does not apply), padding-x 16, no rules (`table/cell-rule-width` 0). **text:** T.body `text/fg`. **strong:** T.strong `text/fg`. **mono** (IDs): T.strong `text/fg` in Roboto Flex; Tonal sets order IDs and totals in SemiBold 14/20, never mono (L312). **number:** T.strong `text/fg`, end-aligned (totals). **muted:** T.body `text/muted` (channel and date on `23:277`). **badge:** `Tonal/Badge` subtle. **avatar:** `Tonal/Avatar` md (40) with the name in T.heading `text/fg` (L311) over `secondary` in T.small `text/muted` (the email). **actions:** `Tonal/Icon button / md` ghost with more-vertical. **select:** `Tonal/Checkbox` in its 40 target | `text/*` |
| `Tonal/Table row` | `Table row` `412:1187` | The segmented list row (L211-223, L370-372; T.segment): 72 tall, `table/row-bg` (`container`), radius `table/row-radius` (6; `Tonal/Table` sets the 28 ends), no rule (`table/row-rule-width` 0). **zebra:** `table/zebra`, which equals the row fill: Tonal has no zebra. **hover:** `table/hover` (`container-high`). **selected:** `primary/container` instead of `surface/selected`; every text and glyph `primary/on-container` (L218-223, measured on `23:277`); the checkbox checked; the avatar cell's `sunny` on, with a `primary/default` fill and `primary/fg` initials (L344-345). The 2px selection-bar part stays in the tree, hidden: Tonal marks selection by fill and shape, not by a bar. **selected + hover** adds the T.state layer (`47:527`). **focus:** T.focus. **disabled:** 38%. **stacked** (derived): the same segment, padding 16, with the cells stacked under T.small `text/muted` labels | `table/*`, `primary/container`, `primary/on-container` |
| `Tonal/Table` | `Table` `413:1367` | The orders list (L319-320, L370; `23:277`). `head`: no fill or rule (`table/head` transparent, `table/head-rule-width` 0); a select-all `Tonal/Checkbox` and `Tonal/Table header cell`s. Rows 2px apart (`table/row-gap`); override the first row's top corners and the last row's bottom corners to 28 (L342, L370). `caption` T.body `text/muted`. `summary`: "Showing 6 of 3,182" in T.small `text/muted` beside a `Tonal/Button / md` secondary "Load more" with chevron-down (L320; `23:277`). **empty** and **loading** keep the base stand-ins in Tonal roles | `table/*` |
| `Tonal/Data table` | `Data table` `416:4605` | The orders section (L319-320; `23:277`). No card chrome: the nested Card becomes `Tonal/Card` rule. Toolbar: `Tonal/Search` sm; the Status and date filters as chips (`Tonal/Toggle / md` outline with chevron-down, selected with a check, L359-360); the Table and Board switch as `Tonal/Toggle group` segmented (the connected group); Columns `Tonal/Toggle / md` outline; Export `Tonal/Button / md` outline with download (L319). **selection:** `Tonal/Action bar` inline. Table `Tonal/Table`; Pagination `Tonal/Pagination`. **columns:** `Tonal/Menu content` with checkbox rows. **mobile:** stacked rows. **loading** and **empty** as the base, in Tonal roles | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from roles, which resolve to Tonal under Theme Tonal. The shared
  step already set the structure twins (`tabs/*`, `table/*`, `kpi/*`, `nav/active`,
  `card/border`).
- **Text:** `font/*` and `type/*`. The emphasized scale already equals the mode (theme-character
  §1.1).
- **Radius:** `radius/control` 999, `radius/input` 4, `radius/card` 28, `radius/badge` 8,
  `radius/checkbox` 2, `tabs/item-radius` 8, `nav/radius` 16, `table/row-radius` 6.
- **Sizes and states:**
  - `size/checkbox` 18;
  - `size/switch/*` 52/32/24;
  - `size/icon/*` 18/24/24;
  - `size/avatar/md` 40 and `lg` 56;
  - states 8/12/38 and focus 2/2.
- **Not in tokens:** control heights (fixed M3 sizes, drawn literally, L323-324) and the container
  radii 32, 24, 20 and 4 (literal until the M3 shape scale lands, #2414, L452-454).

## 6. Verification strips

For each category, build a frame `Tonal style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Tonal):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Tonal: the "before" |
| Style | The same instances swapped to the `Tonal/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Tonal/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary in hover, pressed, focus and disabled; secondary and outline in hover;
  - Icon button md in all five variants;
  - Toggle off and selected, default and outline;
  - Toggle group segmented, at rest and with the middle item pressed;
  - Button group md;
  - Action bar floating;
  - Theme toggle.
- **Forms:**
  - Input rest, hover, focus, invalid, invalid-focus and disabled (the six state-sheet fields);
  - Select;
  - Textarea;
  - Checkbox off, on and disabled;
  - Radio off and on;
  - Switch off, on, focus and disabled;
  - Slider;
  - Input OTP;
  - Search;
  - Calendar;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default, line and segmented;
  - Nav item rest and selected, collapsed and expanded;
  - Breadcrumb;
  - Pagination;
  - Top bar app desktop;
  - Sidebar collapsible=icon;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content;
  - Dropdown menu open;
  - Dialog md with scrim;
  - Alert dialog destructive;
  - Sheet bottom;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge: every tone in subtle (Tonal's primary style), plus plain;
  - Avatar: initials and agent, plus presence, plus initials with `sunny`;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- buttons are full pills in four kinds (filled, tonal, outlined, text), with no shadow;
- connected items sit on 2px gaps with 8px inner corners, and the selected item is a violet pill;
- fields are filled containers with the label inside and a bottom indicator, never boxed;
- no surface has a border or a shadow, except the 0 3 8 float on menus, popovers and the toolbar;
- states show as 8%/12% layers; a disabled filled kind is a 12% container with a 38% label;
- labels are sentence-case Roboto Flex;
- dark keeps `#6e56cf` with white on filled, selected and checked items, deep `#33255b` selection,
  and containers that lighten with height. A pale violet fill with dark ink, or an inverse slab, is
  a defect (L302-304, L390-391).

**Expected for Data display 1 (style row vs base row):**

- badges are 28px tonal chips with 8px corners and a leading status glyph, never outlined boxes
  with a square dot or mono uppercase;
- avatars are circles on `primary-container`; only the selected row's avatar is the violet sunny
  shape;
- cards and secondary KPIs are borderless `container` surfaces at 28; the hero KPI is a violet r32
  tile with white text and an area sparkline;
- table rows are 72px segments 2px apart, with 28 outer and 6 inner corners, and no head fill or
  rules; selection is `primary-container` with on-container text, with no bar;
- labels are sentence case, and IDs and totals are Roboto Flex SemiBold, never mono;
- dark keeps the `#6e56cf` hero with white, deep `#33255b` selection and containers that lighten
  with height.

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1).
  Each has the base variant count, property names and part names. The FAB and floating toolbar
  extras are optional and not counted.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited. The four
  kits are renamed `Tonal/Specimen kit/*` with their node ids unchanged, and the ledger
  `style-ledger/tonal.json` lists every set id.
