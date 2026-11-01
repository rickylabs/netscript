# Filigrane style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G5, Filigrane + Terminal. Each theme has its own brief; this file is all the
  Filigrane builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Filigrane` (`37:6`).
- **Modes for every Filigrane style set and strip:** Theme set **A** (`239:7`) and Theme
  **Filigrane** (`2:6`). Density Comfortable: Filigrane binds no Density variable and keeps a fixed,
  generous rhythm (DESIGN L309-310). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Filigrane `icon/stroke` =
  1.5.

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
   - `Filigrane/Button / md`;
   - private helpers keep their dot: `Filigrane/.Focus ring`.
   
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
   whole pixels. Load every font listed below before editing text.
7. **Composites.** Composites nest this theme's own style sets (`Filigrane/Field` nests `Filigrane/Label`
   and `Filigrane/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/filigrane.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/filigrane/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** An operations screen typeset like a printed page: light Newsreader numerals over a calm
Hanken Grotesk UI, held together by hairlines instead of boxes or shadows, with one tomato accent
(L224-232).

**A Filigrane strip must read at thumbnail size as:**

- no boxes: fields are underlines, tabs are underlines on a hairline baseline, floats are hairline
  rectangles;
- square everywhere; the only circle is the 32px avatar;
- an ink Solid button in light and a `#7c7b74` hairline button in dark, never tomato;
- Hanken Grotesk for everything you scan or operate, Newsreader Light only for numbers and
  one-sentence statements, sentence case, no all-caps;
- tomato only as a 3px margin bar, a 1px top rule or `primary-text` (eyebrow, numerals, links);
- the Origami double ring on focus: a 2px ring outside a 3px paper gap;
- no shadows, cards, fills or tints.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Orders, Light / Dark | `38:9` / `38:309` | Header, Solid, Outline and Link buttons, tabs, table rows (checkbox, margin bar, status glyph), form fields (rest, focus, error), select, checkboxes, notice, activity list. **Measure here first.** There is no state sheet: hover, pressed and disabled are derived (§3) |
| App header, header Search | `89:887`, `89:906` | Top bar, nav underline, the 220×28 underline search, the hairline avatar |
| Notice, Activity | `38:285` (layer `Pull quote`), `38:294` (layer `The wire`) | The Alert dialog recipe (1px `primary` top rule, serif sentence) and rule-separated lists |
| Section rules | `38:215`, `38:235`, `38:263` (light); `38:479`, `38:486`, `38:494` (dark) | The whole-pixel hairline build (F.hair) and the numbered Field set legend |
| Kits | Button `37:22`, Field `37:44`, Status `37:60`, Tab `37:67`, Checkbox `37:72` (Checked `37:69`) | Geometry to copy. Rename to `Filigrane/Specimen kit/*` before creating the same names |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/filigrane--light.png`, `filigrane--dark.png` | Offline reference. The pixel measurements in this brief come from these |

## 2. Tokens the style relies on

**Fonts** (load all): Newsreader Light; Hanken Grotesk Regular and Medium. Filigrane sets nothing in
mono (L281-282): rebind every base T.mono part (breadcrumb, shortcut, kbd, url) to F.data, so IBM
Plex Mono (`font/mono`) never renders. Load IBM Plex Mono Regular only if a nested base instance
still shows it while you work.

| Use | Bind | Filigrane value (Light / Dark) |
| --- | --- | --- |
| Ground, the only surface (L246-248) | `surface/bg` | `#f9f9f8` / `#111110` |
| Ink text | `text/fg` | `#21201c` / `#eeeeec` |
| Muted text: field labels, unselected tabs and nav, helpers, counts | `text/muted` | `#63635e` / `#d2d0ca` (dark is brightened, L260) |
| Solid button and checked box: fill / label and check / edge | `action/primary-bg` / `action/primary-fg` / `action/primary-border` | `#21201c` / `#fdfdfc` / `#21201c`; dark `#00000000` / `#eeeeec` / `#7c7b74` |
| Interactive edges: field underline, outline button, unchecked box, header search | `border/input` | `#82827c` / `#7c7b74` |
| Hover edge (base field and checkbox recipe) | `border/control` | `#21201c` / `#7c7b74` |
| Focus ring and focused underline | `border/ring` | `#21201c` / `#7c7b74` (never a white perimeter, L367-368) |
| Header rule | `border/subtle` | `#e9e8e6` / `#2a2a28` |
| Row rules, panel top rules, kbd edge | `border/default` | `#dad9d6` / `#62605b` |
| Structural rules: tab baseline, section rules, float perimeters | `border/strong` | `#bcbbb5` / `#62605b` |
| Accent bar and accent rule: margin bar, notice top rule | `primary/default` | `#d13415` / `#e54d2e` |
| Accent text: eyebrow, section numerals, links | `primary/text` | `#d13415` / `#ff977d` |
| Error underline / error text | `destructive/default` / `destructive/text` | `#e5484d`; `#641723` / `#ff9592` |
| Selected-tab underline (structure twin) | `tabs/sel-border` | `#21201c` / `#eeeeec` after the shared step |
| Tab track, selected tab fill, nav active fill (structure twins) | `tabs/track`, `tabs/sel-bg`, `nav/active` | `#00000000` after the shared step |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` |
| Edge widths | literal 1 for every hairline (`border/width` is 1); 2 for focused and invalid underlines, the selected-tab underline and the ring; 3 for the margin bar (L333-335) | 1 / 2 / 3 |
| Radius | 0 everywhere. Every Theme `radius/*` is 0 after the shared step, except `radius/avatar` 999 for the 32px avatar (L327-328) | — |
| **Never bind** | `primary/*` on a button or checkbox fill (tomato is not an action colour, L253-256, L382); `surface/card`, `surface/raised`, `surface/muted`, `surface/selected`, `surface/inverse` and `tooltip/*` (no cards, tints or inverse chips, L323, L383; dark `surface/inverse` is a `#eeeeec` slab) | — |

Filigrane has no language roles (L430); it uses core roles plus `action/primary-*`. No primitive is
bound anywhere (map: 0 primitive bindings).

**Text roles:**

| Role | Recipe |
| --- | --- |
| F.heading | `font/heading` (Newsreader) + `type/heading/*` (Light 24/32, −0.2). One-sentence statements only (L270, L281) |
| F.lead | `font/sans` + literal size 17, line 28, `type/body/style` (Regular), tracking 0. Field values, tab labels, form and dialog titles (L87, L271). No Theme variable holds 17/28 |
| F.body | T.body: `font/sans` + `type/body/*` (15/24). Checkbox labels, descriptions, notice body (L272) |
| F.strong | T.strong: `type/strong/*` (15/24 Medium). Amounts, counts, card titles (L96-102) |
| F.data | T.data: `font/data` + `type/small/*` (14/20). Nav, menu items, search label, kbd, URLs (L273) |
| F.button | `font/sans` + `type/small/size` (14) + `type/caption/line` (16) + `type/label/style` (Regular) + `type/label/tracking` (+0.2). Buttons and links (L103-109, L274) |
| F.label | T.label: `font/label` + `type/label/*` (13/18 Regular, +0.2). Field labels, eyebrow, section numerals, footnotes, menu labels (L275) |
| F.caption | T.caption: `font/sans` + `type/caption/*` (12/16 Regular, +0.1). Helpers, tab counts, status words (L276) |

Text case is always original: sentence case, never UPPER, no italics (L282). Nothing is below 12px
(L284).

## 3. Filigrane recipes (referenced by the component rows)

- **F.hair: whole-pixel hairline.** Every rule and underline is one opaque paint on a whole pixel
  (L369-375, map):
  - an absolute rectangle (height 1 or 2, constraints left-right × bottom) with a bound fill; or
  - a frame with a 1px INSIDE bottom stroke, as the section rules `38:215` are built (a 2px rect
    whose `border-strong` paint is a 1px INSIDE bottom stroke).
  
  Never a centred 1px stroke and never a 1px rect centred in a taller row: it lands on y + 0.5 and
  splits into two half-intensity rows. Check `absoluteTransform` for a whole y. Seed every bound
  paint with its resolved colour: a stale paint on a 0.5px offset renders the dark search underline
  as `#080808` (L369-371). Render check: the field underline is one row, `#82827c` light and
  `#7c7b74` dark.
- **F.underline: underline field** (L342-343, L164-181; render `38:9` fields at y1020-1226).
  - No box: root has no fill, no stroke and radius 0.
  - Theme-only part `underline`: F.hair, 1px `border/input`, the bottom row of the field.
  - Value F.lead `text/fg`; placeholder `text/muted`.
  - md is 37 tall (L168). Render: the value's cap top sits 26px above the underline. Measure the
    padding on kit `37:44`.
  - **Focus:** the underline becomes 2px `border/ring`, so the field grows to 38 (L176-181); fill
    `surface/bg`; `Filigrane/.Focus ring` around the field box, not around the label. Render: ring
    rows y1161-1162 and y1207-1208 around a field at y1166-1203.
  - Theme-only `caret`, hidden by default (theme-only boolean `caret`, default false): a 1×20
    `text/fg` bar after the value. L395-396 proposes "a 2px underline plus caret" for field focus,
    but L342 and the crafted focus field draw none.
  - **Invalid:** a 2px `destructive/default` underline (field 38). The label and helper turn
    `destructive/text` in Field (L342).
  - **Invalid-focus** (derived): the 2px `destructive/default` underline plus the double ring.
  - **Hover** (derived; base Input recipe): underline `border/control`. Dark shows no change,
    because both roles resolve to `#7c7b74`.
  - **Disabled** (derived): underline `border/default`, value and placeholder `text/muted`, no fill
    and no opacity. The base `surface/muted` fill would be a tinted panel (L323, L383).
- **F.ring: Origami double ring** (L319-322, L367-368). Build it once as `Filigrane/.Focus ring`
  and use it everywhere instead of the base `.Focus ring`.
  - Part `focus-ring`: an absolute frame at −3 on every side, no fill, a 2px OUTSIDE stroke
    `border/ring`, radius 0. The 3 is literal: `focus/ring-offset` cannot drive geometry
    (component-spec §4.4).
  - Theme-only part `focus-gap`: an absolute frame at 0, with a 3px OUTSIDE stroke `surface/bg`, so
    the 3px paper gap holds over any ground.
  - The result is the CSS `0 0 0 3px bg, 0 0 0 5px ring`. Render: ring at 3–5px outside the box,
    `#21201c` light, `#7c7b74` dark. Never a `#eeeeec` perimeter in dark.
  - Fields add their 2px `border/ring` underline (F.underline focus).
- **F.solid: Solid button** (L341, L136-149, L260-262; render "Create order" at 56,340, 148×40).
  - 40 tall, square, padding 0/18, gap 10, label F.button, 16px Lucide arrow.
  - Fill `action/primary-bg`, 1px INSIDE stroke `action/primary-border`, label and icon
    `action/primary-fg`.
  - Light is an ink slab with a `#fdfdfc` label. Dark is transparent with a `#7c7b74` hairline and a
    `#eeeeec` label, never a light slab (L382).
- **F.outline: Outline button** (L341; render "Cancel", 83×40). F.solid with no fill, a 1px INSIDE
  stroke `border/input` (component-spec §4.6: Filigrane outlines use `input-border`, not the base
  `border/default`) and a `text/fg` label.
- **F.link: text action** (L341, L162-163; render "Next page", "Review the orders").
  - No box. Label F.button in `primary/text`; optional 16px `arrow-right` in `primary/text`, gap 10.
  - Part `underline`: F.hair, 1px `primary/text`, under the label only, not the arrow.
- **F.margin: margin bar** (L346, L379-380, L397; render `38:9` x48-50 beside a row at x56).
  - Selection is a checked box plus the theme-only part `margin-bar`: a 3px `primary/default` bar,
    full item height, outside the item at x −8. Never a row fill.
  - The parent must not clip content. RTL mirrors it to the right edge (L419).
- **F.check: checked box** (L344, L376-378, L283; kit `37:69`).
  - 16 square, radius 0 (`size/checkbox`, `radius/checkbox`).
  - **Unchecked:** no fill and a 1px INSIDE `border/input` edge. The base `surface/card` fill would
    tint it (`#191918` in dark).
  - **Checked:** fill `action/primary-bg`, 1px INSIDE stroke `action/primary-border`, and a 12px
    check in `action/primary-fg` at a literal 2px stroke (not `icon/stroke`).
  - Light: an ink square with a `#fdfdfc` check. Dark: a transparent box with a `#7c7b74` edge and a
    `#eeeeec` check, never a light square.
- **F.panel: hairline float** (derived from L353: "keep it square, hairline, no shadow, solid
  overlay"). Use it for every float: menus, popovers, hover cards, tooltips, dialogs, sheets and
  floating bars.
  - Fill `surface/bg`, a 1px INSIDE stroke `border/strong` on every exposed side, radius 0, no
    effect.
  - Rows inside are separated by 1px `border/default` rules, as in the activity list (L350).
  - Scrims are `surface/overlay` with no blur.
- **F.under: underline indicator** (L293-300, L345, L351).
  - **Nav:** the selected item is `text/fg` over a 1px `text/fg` underline as the item's bottom row.
    The other items reserve the slot with a transparent underline. Render: underline at y80 under
    "Orders" only.
  - **Tabs:** the selected tab is `text/fg` with a 2px `tabs/sel-border` underline across label and
    count, sitting directly on the list's 1px `border/strong` baseline. Render: y491-492 on y493.
- **States.** Nothing animates; states are lines and ink (L394). Derived cells cite L394-397.
  - **Hover, text actions** (link, breadcrumb link): the 1px underline thickens to 2px (L394-395).
  - **Hover, ghost:** (derived) the label goes `text/muted` → `text/fg` and a 1px `underline`
    appears.
  - **Hover, boxed buttons** (Solid, Outline, destructive): (derived from L394-395) a 1px label
    underline appears in the label colour. The box does not change, so there is no tint and the cue
    works in both schemes.
  - **Pressed:** (derived) as hover.
  - **Hover, fields, checkboxes and switches:** edge `border/control` (base recipes).
  - **Hover, tabs, nav and menu triggers:** (derived) the label goes `text/muted` → `text/fg`.
  - **Focus:** F.ring everywhere; fields add the 2px underline (L395-396).
  - **Disabled:** (derived) buttons, toggles, tabs, nav and keys use the base R.disabled (root
    opacity `state/disabled-opacity`). Fields, checkboxes, radios and switches recolour instead:
    edge or underline `border/default`, text `text/muted`.
  - Filigrane draws no translucent state layers, so every `state-layer` part stays hidden.
- **Icons** (L283, L388-389). Lucide at `icon/stroke` 1.5. The crafted screens show icons only as
  the 16px arrow on buttons and links, the checkbox check (12px, 2px stroke) and the select chevron.
  Keep every base icon boolean and its default. Parts with no boolean that Filigrane does not draw
  (Search `icon`, Field `error-icon`, Command palette `search-icon`) stay in the tree, hidden.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Filigrane anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Filigrane's spec does not draw; the derivation uses only
the recipes above and names its source.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Filigrane/Icon`, `Filigrane/Spinner`, `Filigrane/.Focus ring` and
`Filigrane/.State layer`.

| Style set | Base set | Filigrane anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Filigrane/Icon` | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** The same Lucide set as the base (L389), and the 1.5 stroke is already the Theme value of `icon/stroke`. So do not redraw glyphs: the set nests the base `Icon/<glyph>` components, and no `Filigrane/Icon/<glyph>` exists. **Sizes:** sm 14, md 16, lg 20 (tokens). Buttons and links use 16 (L283) | `text/fg` via the parent; `icon/stroke` |
| `Filigrane/Spinner` | `Spinner` `252:11837` | (derived; nothing animates, L394-398) The base ring and arc at a 1.5 stroke: ring `border/default`, arc `text/fg`. The frame is static | `border/default`, `text/fg` |
| `Filigrane/.Focus ring` | `.Focus ring` `252:11805` | F.ring | `border/ring`, `surface/bg` |
| `Filigrane/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Filigrane states are lines and ink (§3) | — |
| `Filigrane/Button / md` | `Button / md` `253:372` | 40 tall, square, padding 0/18, gap 10, F.button label, 16px icons (L341). Variants: **primary**: F.solid. **secondary** and **outline**: F.outline (Filigrane has one outlined kind; the crafted "Cancel"). **ghost** (derived): no box, label `text/muted`; hover per §3. **destructive** (derived from the error treatment, L342, and the one-accent rule, L231-232): F.outline with a 1px `destructive/default` edge and a `destructive/text` label, never a red slab. **link**: F.link with padding 0; hover and pressed thicken `underline` to 2px (L394-395). States §3; focus `Filigrane/.Focus ring`; disabled R.disabled (derived). `loading` shows `Filigrane/Spinner` in the label colour. No control shadow (`shadow/control/*` are 0) | `action/primary-*`, `border/input`, `primary/text`, `destructive/*` |
| `Filigrane/Button / lg` | `Button / lg` `254:721` | (derived) As md at 48, padding 0/22, icons 16 (L283) | as md |
| `Filigrane/Button / sm` | `Button / sm` `254:371` | (derived) As md at 32, padding 0/14, F.button, icons 14 | as md |
| `Filigrane/Button / xs` | `Button / xs` `254:1071` | (derived) As md at 24, padding 0/10, label F.caption (12/16 is the floor, L284), icons 14 | as md |
| `Filigrane/Icon button / md` | `Icon button / md` `255:262` | Square, W = H 40, using the Button recipe of the same variant; a 16px glyph at 1.5, centred. Ghost hover turns the glyph `text/muted` → `text/fg` (there is no label to underline); boxed variants show the 1px underline under the glyph (§3) | as Button |
| `Filigrane/Icon button / lg` | `Icon button / lg` `255:740` | (derived) As md, 48 square, 16px glyph | as Button |
| `Filigrane/Icon button / sm` | `Icon button / sm` `255:501` | (derived) As md, 32 square, 14px glyph | as Button |
| `Filigrane/Icon button / xs` | `Icon button / xs` `255:979` | (derived) As md, 24 square, 14px glyph | as Button |
| `Filigrane/Button group` | `Button group` `257:839` | (derived) Keep the base join: gap −1, so the 1px edges overlap. Every corner is already 0, so no inner-corner overrides are needed. `separator`: a 1px `border/input` rule. `text` part: F.label `text/muted` with no fill (no tinted panels, L323) and a 1px `border/input` edge so it joins the row | `border/input` |
| `Filigrane/Toggle / md` | `Toggle / md` `256:281` | (derived; Filigrane draws no toggle) 40 tall, label F.button. **default:** no box; off label `text/muted`; selected `text/fg` plus a 2px `tabs/sel-border` underline under the label (the selected-tab recipe, L345). **outline:** a 1px `border/input` box; selected is F.solid (`action/primary-*`, the checked-box logic of L344). Hover: label `text/fg`. Focus F.ring. Disabled R.disabled | `tabs/sel-border`, `border/input`, `action/primary-*` |
| `Filigrane/Toggle / sm` | `Toggle / sm` `256:437` | (derived) As md at 32 | as md |
| `Filigrane/Toggle / lg` | `Toggle / lg` `256:593` | (derived) As md at 48 | as md |
| `Filigrane/Icon toggle / md` | `Icon toggle / md` `276:8291` | (derived) As Toggle md, 40 square, 16px glyph; the default variant's selected underline spans the glyph | as Toggle |
| `Filigrane/Icon toggle / sm` | `Icon toggle / sm` `276:8431` | (derived) As md, 32 square, 14px glyph | as Toggle |
| `Filigrane/Icon toggle / lg` | `Icon toggle / lg` `276:8571` | (derived) As md, 48 square, 16px glyph | as Toggle |
| `Filigrane/Toggle group` | `Toggle group` `257:528` | **segmented** is the Filigrane tab row: no track (`tabs/track` is transparent), padding 0 (`tabs/pad`), gap 28 (`tabs/gap`, L294, L299), default Toggles whose selected item carries the 2px underline, and a theme-only `baseline`: F.hair 1px `border/strong` under the row. **default** and **outline:** Toggles with gap `space/inline/gap` | `tabs/*`, `border/strong` |
| `Filigrane/Action bar` | `Action bar` `258:663` | (derived) **floating:** F.panel (`surface/bg`, 1px `border/strong`, square, no shadow) instead of the base inverse slab, which is `#eeeeec` in dark (L382-383). `count` F.strong `text/fg`. **inline:** no fill; F.margin on the leading edge plus the count, because selection is never a row fill (L346, L397) | `surface/bg`, `border/strong`, `primary/default` |
| `Filigrane/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Filigrane/Button / sm` | — |
| `Filigrane/Theme toggle` | `Theme toggle` `258:742` | `Filigrane/Icon button / md` ghost with Lucide moon and sun at 1.5 | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Filigrane anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Filigrane/Label` | `Label` `278:45` | **default:** F.label in `text/muted`, because field labels sit muted above the value (L342; render "Email" `#63635e`). **eyebrow:** F.label in `primary/text`, sentence case: the tomato eyebrow (L231, L254), never the base uppercase mono (L282). `required-mark` `destructive/text`; `optional-hint` F.label `text/muted`. Invalid `destructive/text`. Disabled R.disabled | `primary/text` |
| `Filigrane/Input` | `Input` `279:312` | F.underline. **md** 37 (38 when the underline is 2px). **sm** (derived): the same recipe with the value on F.data (14/20), so 8px shorter. Icons 16 at 1.5 in `text/muted` when the base booleans show them. States as F.underline: rest, hover, focus, invalid, invalid-focus, disabled | `border/input`, `border/ring`, `destructive/default` |
| `Filigrane/Textarea` | `Textarea` `280:597` | (derived) F.underline with a multi-line value (F.lead lines), minimum two lines, padding 0. `counter` F.caption `text/muted` under the underline (render: "Optional" under the note field). `resize-handle` stays hidden, because Filigrane adds no ornament (L323) | as Input |
| `Filigrane/Select` | `Select` `281:1023` | F.underline plus a 16px `chevron-down` at 1.5 in `text/muted` at the right end (render "Shipping method": chevron `#63635e`). **Open:** underline `border/control`, `chevron-up`, content `Filigrane/Select content` 4px below. Other states as Input | as Input |
| `Filigrane/Select content` | `Select content` `281:826` | `Filigrane/Menu content` holding `Filigrane/Menu item` `type=option` | — |
| `Filigrane/Checkbox` | `Checkbox` `283:1470` | F.check. The control is 16 inside a 24px label row (L415-416), gap 10 (render: box x56-71, label at x83). Label F.body `text/fg` (L272); description F.caption `text/muted`. **Indeterminate:** a 12px `minus` at 2px in `action/primary-fg` inside the checked box. **Hover:** unchecked edge `border/control`. **Invalid:** edge `destructive/default`. **Disabled:** edge `border/default`, label `text/muted`. Focus F.ring on `control` | `action/primary-*`, `border/input` |
| `Filigrane/Radio` | `Radio` `284:1828` | (derived) The only circle in Filigrane is the avatar (L327-328), so the radio is a 16 square like the checkbox. Unchecked: 1px `border/input`. Checked: the F.check box with a 6×6 square dot in `action/primary-fg` instead of the check. The base `control` radius becomes 0, and the `indicator` ellipse becomes a rectangle with the same layer name. States as Checkbox | as Checkbox |
| `Filigrane/Radio group` | `Radio group` `284:1885` | Nests `Filigrane/Radio`. Rows sit 34px apart, as the crafted checkbox rows (render y1389 and y1423) | — |
| `Filigrane/Switch` | `Switch` `285:2329` | (derived from F.check; Filigrane draws no switch) Square: the radius is 0, so there is no pill. **Track:** 32×18 (`size/switch/*`), padding 2, 1px INSIDE `border/input`, no fill. **Thumb:** a 14 square filled `border/input`; the base `thumb` ellipse becomes a frame with the same layer name. **On:** track fill `action/primary-bg` and stroke `action/primary-border`, thumb `action/primary-fg` on the right (light: ink track with a `#fdfdfc` square; dark: a hairline track with a `#eeeeec` square). **sm** 28×16, thumb 12. Hover edge `border/control`; focus F.ring on `track`; invalid edge `destructive/default`; disabled edge and thumb `border/default` | `action/primary-*`, `border/input` |
| `Filigrane/Field` | `Field` `287:2656` | Nests `Filigrane/Label` and `Filigrane/Input`. Label directly above the value (render: label cap to value cap 27px; measure on `37:44`). `description` is the helper: F.caption `text/muted` about 8px under the underline (render). **Error row:** `error-icon` stays hidden (§3 Icons); `error` is F.caption `destructive/text` and states the repair (L342, L381). Field has no focus variant: in a focused Field, override the nested Label fill to `text/fg` (L342). **horizontal** (derived): the label in a fixed left column, baseline-aligned with the value | — |
| `Filigrane/Field set` | `Field set` `287:2743` | **legend:** the numbered section (L229-230, render `38:215`): a theme-only `numeral` ("01") in F.label `primary/text`, the legend in F.label `text/fg`, then a theme-only `section-rule` that runs to the edge, built as `38:215` (F.hair, 1px `border/strong`). **label** variant: the legend without the numeral. `description` F.body `text/muted`; `separator` 1px `border/default`; group gap 22 (L130-131, L307) | `primary/text`, `border/strong` |
| `Filigrane/Input group` | `Input group` `297:3861` | The F.underline frame. The addon is F.data `text/muted` text, a 1.5 icon or `Filigrane/Icon button / xs`; the control is a strokeless `Filigrane/Input` | — |
| `Filigrane/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is its own F.underline cell, 32 wide and 37 tall, with the character in F.lead, centred. **caret:** 1×20 `text/fg`. **Focus:** 2px `border/ring` underline plus F.ring. **Invalid:** 2px `destructive/default` underline. **Disabled:** `border/default` underline | as Input |
| `Filigrane/Input OTP` | `Input OTP` `301:4490` | Group gap 8 instead of −1, so each underline reads as its own blank. The separator is `minus` at 1.5 in `text/muted` | — |
| `Filigrane/Slider` | `Slider` `303:5022` | (derived from the tab underline, L299-300, and F.check) **Track:** a 1px `border/strong` rule, as the tab baseline. **Range:** a 2px `text/fg` bar on it, as the selected-tab underline. **Thumb:** a 12 square with fill `action/primary-bg` and a 1px `action/primary-border` stroke (an ink square in light, a hairline square in dark). The track and range rounded rectangles become rectangles with the same layer names; the thumb radius is 0. `value-label` F.data. Hover: thumb edge `border/control`. Focus F.ring on the thumb. Disabled R.disabled | `border/strong`, `text/fg`, `action/primary-*` |
| `Filigrane/Combobox` | `Combobox` `305:5623` | `Filigrane/Input` plus `Filigrane/Menu content`. Chips are `Filigrane/Badge` subtle with `remove`: the glyph, the word and a 12px x, with no tinted chip | — |
| `Filigrane/Calendar day` | `Calendar day` `307:6154` | (derived) 36 square (the tab height, L195), number F.data `text/fg`. **Rest:** no fill. **Hover:** a 1px `border/input` underline under the number. **today:** a 1px `text/fg` underline (the nav recipe, L351). **single, range-start, range-end:** the F.check box (`action/primary-*`) with the number in `action/primary-fg`. **range-middle:** no fill, because selection is never a fill (L397); a 1px `border/strong` rule above and below the cell, so the range reads as a hairline band (the stat grid, L297-298). **outside:** `text/muted`. **Disabled:** R.disabled. Focus F.ring | `action/primary-*`, `border/strong` |
| `Filigrane/Calendar` | `Calendar` `309:8620` | No box when inline; inside a popover the popover is the F.panel. Caption F.strong; weekdays F.caption `text/muted`; nav keys `Filigrane/Icon button / sm` ghost with chevrons; month select `Filigrane/Select` sm | — |
| `Filigrane/Date picker` | `Date picker` `313:14889` | The `Filigrane/Select` trigger with a calendar glyph at 1.5. Open is `Filigrane/Popover` holding `Filigrane/Calendar` | — |
| `Filigrane/Search` | `Search` `316:16426` | The header search (L343, `89:906`): **md** 220×28, with no box and no glyph. The `icon` part stays hidden (render: "Search orders" only). Label F.data `text/muted`. Underline: F.hair, one opaque 1px `border/input` bottom fill on a whole pixel (render y77). `kbd` is `Filigrane/Kbd` sm. **Hover:** underline `border/control`. **Focus** and **open:** the F.underline focus (2px `border/ring` underline plus F.ring). **sm** (derived): 24 tall | `border/input`, `border/ring` |
| `Filigrane/Dropzone` | `Dropzone` `319:16832` | (derived from the stat grid, L297-298) No box and no dashes. The area is bounded by 1px `border/strong` rules top and bottom only. `icon` `upload` at 1.5 `text/muted`; `label` F.body; `hint` F.caption `text/muted`. **active:** F.margin on the leading edge (selection, L397). **uploading:** progress is a 2px `text/fg` bar on a 1px `border/strong` baseline (the tab underline), with the percentage in F.data. **invalid:** the bottom rule becomes 2px `destructive/default` and `status` turns `destructive/text` (the field error, L342). Focus F.ring; disabled R.disabled | `border/strong`, `primary/default`, `destructive/*` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Filigrane anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Filigrane/Location marker` | `Location marker` `337:22` | (derived from the square status glyph, L257) sm 4×4 and md 6×6 squares in `text/fg`, radius 0. Parents never show it, because `deco/marker` is false | `text/fg` |
| `Filigrane/Breadcrumb item` | `Breadcrumb item` `338:92` | The page eyebrow is the breadcrumb (render `38:9`: "Commerce · Orders", L231). **link:** F.label `primary/text`; hover adds a 1px `primary/text` underline, focus F.ring. **current:** F.label `primary/text` with no underline, as rendered. **separator:** "·" in F.label `primary/text`; it replaces the base chevron, because icons stay in their three places. **Ellipsis:** "…" | `primary/text` |
| `Filigrane/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Filigrane/Breadcrumb item`; gap 4 around the "·" | — |
| `Filigrane/Page key` | `Page key` `339:270` | (derived from the nav recipe) No box, 32 square, number F.data `text/muted`. **Hover:** `text/fg`. **current:** `text/fg` plus a 1px `text/fg` underline (L351). **previous** and **next:** `Filigrane/Button / sm` link, "Previous page" and "Next page" with arrows (render: "Next page" plus arrow). **Ellipsis:** "…". Focus F.ring; disabled R.disabled | `text/fg` |
| `Filigrane/Pager tile` | `Pager tile` `339:319` | (derived) No box: a 1px `border/default` top rule (panel top rules, L249-251). `direction` F.label `text/muted` in sentence case ("Previous", "Next"); `title` F.strong `text/fg` with a 16px arrow. Hover: the title gains a 1px underline (link recipe). Focus F.ring | `border/default` |
| `Filigrane/Pagination` | `Pagination` `339:379` | `meta` is the footnote: F.label `text/muted` ("Page 1 of 531 · amounts in USD", L305). Nests `Filigrane/Page key` and `Filigrane/Pager tile` | — |
| `Filigrane/Tab / horizontal` | `Tab / horizontal` `342:402` | `Filigrane/Tab` (kit `37:67`, L345, L299-300). Label F.lead, `text/muted`; selected `text/fg`. `count` is `Filigrane/Badge` plain (F.caption `text/muted`), bottom-aligned as a subscript (render: its baseline sits about 5px below the label's). Selected: F.under, a 2px underline across label and count, drawn with the base binding (`tabs/sel-border` at `tabs/sel-bottom` 2, bottom edge only). On `line`, the base `indicator` takes the same 2px `tabs/sel-border`. All three variants draw the same underline tab, because the track and fill are transparent and `tabs/sel-box` is 0. Height 38 for every tab, so labels never shift; unselected tabs leave the 2px slot empty (L194-195 list 36 and 38). Item padding 0 (`tabs/item-pad`). `marker` stays hidden. Hover label `text/fg`; focus F.ring; disabled R.disabled | `tabs/*` |
| `Filigrane/Tab / vertical` | `Tab / vertical` `342:599` | (derived) As horizontal, with the 2px `tabs/sel-border` bar on the inline-start edge | as horizontal |
| `Filigrane/Tabs list` | `Tabs list` `343:424` | No track, padding 0, gap 28 (`tabs/*`). Theme-only `baseline`: F.hair, 1px `border/strong` across the full width, directly under the items (render y493). Vertical: the baseline runs on the inline-start edge | `border/strong` |
| `Filigrane/Tabs` | `Tabs` `343:489` | Nests `Filigrane/Tabs list`. The tabs row is 67 tall with 28 top padding (L299) | — |
| `Filigrane/Nav item` | `Nav item` `345:601` | Label F.data `text/muted`, 34 tall (L351). **selected:** `text/fg` plus F.under, the 1px `text/fg` underline as the bottom row; the fill binds `nav/active` (transparent). Every other state keeps a transparent underline slot (theme-only part `underline`). **Hover:** label `text/fg`. `nav-icon` 16 at 1.5 in `text/muted`. `count` is `Filigrane/Badge` plain (F.caption `text/muted`), with no pill. Level 2 indents 24. **Collapsed:** the icon only. Focus F.ring; disabled R.disabled | `nav/active`, `text/fg` |
| `Filigrane/Nav group` | `Nav group` `346:611` | Group label F.label `text/muted`, sentence case, never the uppercase eyebrow (L282). Nests `Filigrane/Nav item` | — |
| `Filigrane/Sidebar` | `Sidebar` `347:994` | (derived; Filigrane navigates in the header) A `surface/bg` column with a 1px `border/subtle` trailing rule (the header rule level, L249), no fill. **floating:** F.panel inset by 8. **inset:** the content area has a 1px `border/default` top rule, not a card | `border/subtle` |
| `Filigrane/Top bar` | `Top bar` `351:1349` | The App header (`89:887`, L293-295): 72 tall, no fill, 1px bottom rule. Bind `topbar/bg` and `topbar/rule` as the base does if they resolve to transparent or `#f9f9f8` / `#111110` and to `#e9e8e6` / `#2a2a28` under Theme Filigrane; otherwise bind `surface/bg` and `border/subtle`. Padding: measure on `89:887` and do not copy the invisible spacer `89:905` (a map caveat). **Brand:** the wordmark "Northwind" in F.heading `text/fg`; the `logo` instance stays hidden. **app:** `Filigrane/Breadcrumb`. **docs:** `Filigrane/Navigation menu`, the crafted header nav (gap 28). **End:** `Filigrane/Search` 220×28, `Filigrane/Theme toggle`, ghost icon buttons, and a 32px avatar: a circle with a 1px `border/default` hairline, no fill, initials F.label `text/fg` (L390; render `#dad9d6` / `#62605b`). **mobile** (derived): 56 tall, same rule, nav behind `Filigrane/Sidebar toggle` | `border/subtle`, `border/default` |
| `Filigrane/.Brand logo` | `.Brand logo` `344:410` | (derived) No tile. A 24×24 frame with "N" in F.heading `text/fg`, no fill. `Filigrane/Top bar` hides it and shows the Newsreader wordmark instead | — |
| `Filigrane/Nav menu item` | `Nav menu item` `349:1036` | As `Filigrane/Nav item` at level 1: F.data, 34 tall, the selected 1px `text/fg` underline, an empty slot otherwise (component-spec N6). **open:** label `text/fg`, chevron at 1.5 rotated 180° | — |
| `Filigrane/.Nav menu link` | `.Nav menu link` `348:1108` | Title F.strong `text/fg`; description F.data `text/muted`. **highlighted:** F.margin, with no fill. Focus F.ring | `primary/default` |
| `Filigrane/Navigation menu` | `Navigation menu` `349:1132` | List as the header nav (gap 28). The viewport is F.panel, 4px below. `indicator` hidden | — |
| `Filigrane/Menubar trigger` | `Menubar trigger` `349:1153` | F.data `text/muted`. **hover:** `text/fg`. **open:** `text/fg` plus the 1px `text/fg` underline (L351). Focus F.ring; disabled R.disabled | — |
| `Filigrane/Menubar` | `Menubar` `349:1236` | (derived) Root: no fill, no box, radius 0, with a 1px `border/subtle` bottom rule (the header rule, L293); trigger gap 28. Menus are `Filigrane/Menu content` | `border/subtle` |
| `Filigrane/Step` | `Step` `352:1355` | (derived from the numbered sections, L229-230, render `38:215`) **indicator:** no box, a 24-wide numeral ("01") in F.label. **current:** numeral `primary/text` (section numerals, L231), title F.label `text/fg`. **complete:** the 12px check at 2px in `text/fg` replaces the numeral. **upcoming:** numeral and title `text/muted`. **error:** numeral and title `destructive/text`. **connector:** F.hair 1px `border/strong` running to the edge; complete `text/fg`. `description` F.caption `text/muted` | `primary/text`, `border/strong` |
| `Filigrane/Stepper` | `Stepper` `352:1424` | Nests `Filigrane/Step` | — |
| `Filigrane/Sidebar toggle` | `Sidebar toggle` `344:462` | `Filigrane/Icon button / sm` and `/ lg` ghost with panel-left, menu and x at 1.5 | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

DESIGN draws no overlay (L353: "Pending in #2416; keep it square, hairline, no shadow, solid
overlay"). Every row below is derived from F.panel and the drawn recipes.

| Style set | Base set | Filigrane anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Filigrane/.Kbd` | `.Kbd` `370:31` | Retired: the base `.Kbd` moved to the Overlays Draft area. Do not build this set; build `Filigrane/Kbd` in 4.5 instead | — |
| `Filigrane/Menu item` | `Menu item` `371:587` | 34 tall (the nav item, L351), padding-x 12, label F.data `text/fg`. **highlighted:** F.margin, with no fill. **destructive:** label `destructive/text`; highlighted adds the same margin bar and no `destructive/subtle` fill. **Indicators:** a 12px check at 2px in `text/fg` (checkbox and option), a 6×6 `text/fg` square (radio), `chevron-right` at 1.5 (submenu). `shortcut` is `Filigrane/Kbd` sm or F.data `text/muted`. `description` F.caption `text/muted`. **Disabled:** label `text/muted` | `primary/default` |
| `Filigrane/Menu label` | `Menu label` `373:35` | F.label `text/muted`, sentence case, padding-x 12. Not the base T.eyebrow (L282) | — |
| `Filigrane/Menu separator` | `Menu separator` `373:38` | F.hair 1px `border/default` (row rules, L249), margins 4 | `border/default` |
| `Filigrane/Menu group` | `Menu group` `373:248` | Nests `Filigrane/Menu label` and `Filigrane/Menu item` | — |
| `Filigrane/Menu content` | `Menu content` `373:256` | F.panel with padding 8/12, so the 3px margin bar at x −8 stays inside the panel. Minimum width 192. No shadow | `surface/bg`, `border/strong` |
| `Filigrane/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Filigrane/Button / md` outline plus `chevron-down` at 1.5; `Filigrane/Menu content` 4px below | — |
| `Filigrane/Context menu` | `Context menu` `374:653` | The trigger area is a solid 1px `border/strong` hairline frame, not the base dashed one, with F.data `text/muted` text in sentence case | `border/strong` |
| `Filigrane/Dialog` | `Dialog` `378:743` | `backdrop` `surface/overlay` with no blur (the solid overlay, L353). `content`: F.panel (square, 1px `border/strong`, no shadow), padding 28 and gap 22 (spacing `xl` and `lg`, L127-134). `title` F.lead `text/fg` (the form title, L271). `description` F.body `text/muted`. `close`: `Filigrane/Icon button / sm` ghost with x at 1.5. Footer: `Filigrane/Button`s with gap 16 (render: "Save changes" to "Cancel") | `surface/overlay`, `border/strong` |
| `Filigrane/Alert dialog` | `Alert dialog` `378:880` | The Notice (`38:285`, L349) as a dialog. The content's top edge is a 1px `primary/default` rule (default) or `destructive/default` rule (destructive) instead of `border/strong`. `media`: no tile; it is the eyebrow word ("Attention") in F.label `primary/text` or `destructive/text`. `title` F.heading (Newsreader Light 24/32, the one-sentence statement, L270, L281). `description` F.body `text/muted`. `cancel` F.outline; `action` F.solid, or the destructive outline | `primary/default`, `destructive/*` |
| `Filigrane/Sheet` | `Sheet` `379:1004` | F.panel with the 1px `border/strong` on the inner edge only (per-side weights, as the base), square, no shadow; title F.lead. `handle`: 36×2, `border/strong`, square: strokes are 1, 2 or 3px and nothing is a pill (L333-335) | `border/strong` |
| `Filigrane/Drawer` | `Drawer` `379:1150` | As Sheet; footer buttons are `Filigrane/Button` | — |
| `Filigrane/Popover` | `Popover` `381:937` | F.panel. No arrow: the `arrow` part stays hidden (theme-character §3). Title F.strong; description F.data `text/muted`; `close` `Filigrane/Icon button / sm` ghost | — |
| `Filigrane/Tooltip` | `Tooltip` `381:1030` | F.panel chip: `surface/bg`, 1px `border/strong`, padding 4/8, label F.caption `text/fg`, no arrow. Not the base `tooltip/*` inverse chip, which would be a light slab in dark (L382-383). `kbd` is `Filigrane/Kbd` sm inverse | `surface/bg`, `border/strong` |
| `Filigrane/Hover card` | `Hover card` `381:1093` | F.panel. The avatar is `Filigrane/Avatar` md: the 32px hairline circle with initials (L390). Title F.strong; description F.data `text/muted`; meta F.caption `text/muted` | `border/default` |
| `Filigrane/Command item` | `Command item` `382:1015` | Label F.body `text/fg`; url and excerpt F.data `text/muted`, with matched words in `type/strong/style`. **selected:** F.margin plus a `corner-down-left` glyph at 1.5, instead of the base fill and 2px marker. `kind`: an F.caption word in `text/muted`, with no chip. `shortcut` shows `Filigrane/Kbd` sm. Disabled R.disabled | `primary/default` |
| `Filigrane/Command palette` | `Command palette` `383:1355` | The Dialog recipe at W 640. `input-row` (56): the header-search underline (F.hair 1px `border/input`), `input` F.lead, `search-icon` hidden, `kbd` `Filigrane/Kbd` sm "Esc". `filters`: the Filigrane tab row (`Filigrane/Tabs list`). `group-label` F.label `text/muted`. `footer`: F.caption `text/muted` over a 1px `border/default` top rule, with no fill | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Filigrane draws its data as type on hairlines: status is a square glyph plus a word, the table is
52px rows on 1px rules, KPIs are Newsreader Light numerals in a hairline grid, cards are regions
under a top rule, and the 32px avatar is the only circle (L246-251, L297-306, L327-328, L346-348).

| Style set | Base set | Filigrane anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Filigrane/Kbd` | `Kbd` `403:28` | (derived; Filigrane draws no keycap) **md** `size/kbd`, **sm** `size/kbd-sm`, minimum width = H, padding-x 5. No fill (no tinted keycaps, L323); a 1px INSIDE `border/default` edge; radius 0 (`radius/badge`). Label F.caption `text/muted` (12/16 is the floor, L284), in `font/sans` instead of the base `font/mono`: Filigrane sets nothing in mono (L281-282). **inverse:** identical, because Filigrane has no inverse chip; do not bind `tooltip/kbd`, `tooltip/border` or `tooltip/muted` | `border/default` |
| `Filigrane/Kbd group` | `Kbd group` `403:96` | Nests `Filigrane/Kbd`; the "+" separator in F.caption `text/muted`, gap 4 | — |
| `Filigrane/Badge` | `Badge` `405:180` | The Filigrane status (kit `37:60`; L347, L257, L198-203; render `38:9` status column): a 7×7 square glyph, gap 8, then the word in F.caption `text/fg` (render "Paid" `#21201c`). No container, padding 0, radius 0. The base `dot` part is the glyph: 7×7 with radius 0, overriding the `radius/avatar` binding (999 here), because the only circle is the avatar (L327-328). **Glyph colour by tone:** neutral `text/subtle` (refunded), info `info/default`, success `success/default`, warning `warning/default`, destructive `destructive/default` (L257). **outline**, **subtle** and **solid** all draw this one anatomy (derived): a box, a tint or a coloured slab would break L231-232 and L323, and the word is never coloured. **plain** (counts): the word in F.caption `text/muted`, glyph per `dot` (render tab counts `#63635e`). `iconStart`: a 12px Lucide glyph at 1.5 in place of the square. `remove` (derived): a 12px `x` at 1.5 in `text/muted` after the word, with no chip. Every glyph keeps its word: the amber glyph is 1.5:1 on the paper (L384) | `info/default`, `success/default`, `warning/default`, `destructive/default`, `text/subtle` |
| `Filigrane/Badge / kind` | `Badge / kind` `405:211` | (derived from the status anatomy) The 7×7 square glyph in the kind's `code/syntax/*` role, or `text/fg` where the base uses it, then the kind word in F.caption `text/fg`. No box | `code/syntax/*` |
| `Filigrane/Avatar` | `Avatar` `406:95` | The 32px hairline circle (L206-211, L390; render `89:887` "MR"). `radius/avatar` 999, the one circle (L327-328). No fill: the base `surface/muted` fill is dropped (L323). A 1px INSIDE `border/default` stroke (render `#dad9d6` / `#62605b`). Sizes `size/avatar/*`: sm 24, md 32, lg 40. **initials:** F.label `text/fg` at md (render), F.caption at sm and F.body at lg (derived). **image:** the photo clipped to the circle, with the same hairline; Filigrane screens use initials, not photos (L390). **fallback:** Lucide `user` at 1.5 in `text/muted`. **agent** (derived from F.check): fill `action/primary-bg`, stroke `action/primary-border`, Lucide `bot` at 1.5 in `action/primary-fg`. That is an ink disc in light and a hairline disc in dark, never tomato | `border/default`, `action/primary-*` |
| `Filigrane/Avatar presence` | `Avatar presence` `406:43` | (derived from the status glyph, L257) A 7×7 square with radius 0, not a dot, because the only circle is the avatar (L327-328). Colours as the base: online `success/default`, away `warning/default`, offline `border/strong`. The 2px OUTSIDE ring is `surface/bg`, not `surface/card`: there are no cards (L246-248) | `surface/bg` |
| `Filigrane/Avatar group` | `Avatar group` `406:150` | Nests `Filigrane/Avatar`, overlap −8, each with a 2px OUTSIDE `surface/bg` ring. The count avatar is a hairline circle reading "+3" in F.label `text/muted` | `surface/bg` |
| `Filigrane/Item` | `Item` `408:792` | The activity row (`38:294`, L350; render `38:9` x844-1224, y1188-1433). No box and no fill, radius 0. The `media` slot holds a timestamp in F.label `text/muted` or a `Filigrane/Avatar`; the content starts 49px after it (render). Title F.body `text/fg`, the 15/24 sentence; description F.label `text/muted`. Rows are 48 for one line and 72 for two, with padding 12/0 (render pitch 49 and 73 with the rule). **default:** as above. **outline** (derived): still no box; a 1px `border/default` rule above and below, the list's rule (L249). **muted** (derived): no fill (L323); title and media in `text/muted`. **sm** and **xs** (derived): title F.data, padding 8/0 and 4/0. **hover** (derived): F.margin in `border/strong`, the selection geometry without the accent. **focus:** F.ring. `actions`: `Filigrane/Button / sm` outline. `chevron`: `chevron-right` at 1.5 in `text/muted`. `header` and `footer`: F.label `text/muted` | `border/default`, `border/strong` |
| `Filigrane/Item group` | `Item group` `408:996` | The activity list (L350). **separators:** 1px `border/default` rules between rows (render `#dad9d6`, not the base `border/subtle`), built with F.hair. Rows nest `Filigrane/Item` with `Filigrane/Avatar` media | `border/default` |
| `Filigrane/.Item icon tile` | `.Item icon tile` `408:82` | (derived) No tile: a 32 frame with no fill or edge (no tinted tiles, L323), holding a 16px glyph at 1.5 in `text/fg` | — |
| `Filigrane/.Item image` | `.Item image` `408:85` | 40×40, radius 0 (`radius/input`), the image fill, and a 1px INSIDE `border/default` hairline (derived from the avatar hairline, L390) | `border/default` |
| `Filigrane/Card` | `Card` `409:951` | No cards (L246-248, L323, L383): a card is a region under a 1px top rule, like the form and activity panels (render `38:9` rules at y922 and y1149, `#dad9d6`). **default:** fill `card/bg` (transparent, theme-character §2.4); stroke `card/border` with `card/border-top` 1 and `card/border-side` and `card/border-bottom` 0 (§1.0). Bind `card/border` if it resolves to `#dad9d6` / `#62605b` under Theme Filigrane, otherwise `border/default`. Radius 0 (`radius/card`); R.card-shadow resolves to nothing. Content aligns with the rule's start: side padding 0, top padding 14 (spacing `md`, L130; render 12–15px below the rule). **Header:** `eyebrow` F.label `primary/text` (the tomato eyebrow, L231); `title` F.lead `text/fg` (render "Order SO-10480", the form title, L271); `description` F.body `text/muted`; `action` `Filigrane/Button / sm` link, or a meta line in F.label `text/muted` (render "Aiko Tanaka · Marketplace"). **footer:** `card/footer` (transparent after the shared step), a 1px `border/default` top rule, and `Filigrane/Button`s with gap 16 (render "Save changes", "Cancel"). **rule:** the quieter region: no fill, only a 1px `border/subtle` top rule (the header rule level, L249). **hover** (derived): the top rule turns `border/strong`. **selected** (derived): F.margin on the leading edge, because selection is never a fill (L397). **focus:** F.ring. **sm** (derived): gaps 14 instead of 22 (spacing `md` and `lg`, L127-134) | `card/bg`, `card/border`, `card/footer`, `primary/text` |
| `Filigrane/Stat card` | `Stat card` `409:1270` | One cell of the "In numbers" grid (L297-298, L348; render `38:9` cells at x804-1224, y180-393; 210×106). No fill (`kpi/bg-1` is transparent). Hairlines come from the `kpi/border` twin (`#bcbbb5` / `#62605b`): top, right and bottom 1; left 0 and first-left 0; gap 0; `kpi/pad-x` 16 (§1.0). `label`: F.label `text/muted` in sentence case, not T.eyebrow (render "Net revenue" `#63635e`). `value`: T.kpi, which resolves to Newsreader Light 30/36, −0.6, in `text/fg` (L72-79, L269). **Delta:** a ▲ or ▼ text glyph in the base arrow's place (same layer name), then the value in F.data with `type/strong/style` (14/20 Medium, L348). Up is `success/text`, down is `destructive/text`; an unwelcome rise takes `warning/text` by override (render "▲ 0.2 pts" `#4f3422`, L258-259). Lining tabular numerals are pending in #2414 (L287-288). **hero** (derived; never an inverse slab, L382-383): the top hairline becomes a 1px `primary/default` rule and the label `primary/text`, the notice's accent rule (L349). `deco/*` (sparkline, ticks, blockbars) stay hidden, because all are false. `badge` is `Filigrane/Badge`; `icon` 16 at 1.5; `detail` F.caption `text/muted`. The grid's own heading ("In numbers · 30 days", F.label `text/fg` between a `border/default` rule above and a `border/strong` rule below) belongs to the layout, not to this set. Snap the vertical divider to a whole pixel: the render's divider sits at x + 0.5 and splits into two half-strength columns (map caveat, L372-375) | `kpi/*`, `primary/*`, `success/text`, `destructive/text` |
| `Filigrane/Table header cell` | `Table header cell` `410:546` | 40 tall (L301; render y494-533). `label` F.label `text/muted` in sentence case ("No.", "Customer"), not the base uppercase T.eyebrow (L282, L360-361). No fill (`table/head` is transparent). **Sorted:** label `text/fg` plus Lucide `arrow-up` or `arrow-down` at 14, 1.5 stroke. **Sortable, unsorted:** `arrow-up-down` per the base. **hover** (derived): label `text/fg`. **focus:** F.ring. The amount column aligns end (L302) | `table/head` |
| `Filigrane/Table cell` | `Table cell` `410:383` | Row height binds `space/table/row-height`, which is 52 under Comfortable, the Filigrane row by coincidence (L301, L309-310). Cell padding-x 0: the columns are fixed widths with no padding or gaps (L301-306). `table/cell-rule` 0. **text:** F.data `text/fg` (render "SO-10482"). **strong:** F.lead `text/fg`, the customer name as drawn (render: "Maya Rossi" is 17px, larger than the 14/20 data role that L196 names). **mono** (derived): F.data with tabular figures, never a mono face (L281-282). **number:** the amount in F.strong (15/24 Medium, L96-102), end-aligned; refunds read "(210.00)" in `destructive/text` (L259). **muted:** F.data `text/muted` (render channel and date `#63635e`). **badge:** `Filigrane/Badge` outline. **avatar:** `Filigrane/Avatar` sm beside the name in F.lead; the secondary line (email) is F.data `text/muted`. **actions:** `Filigrane/Icon button / sm` ghost. **select:** `Filigrane/Checkbox`, at x + 8 in the 36 mark column (L301, L346) | `space/table/row-height` |
| `Filigrane/Table row` | `Table row` `412:1187` | 52 tall with a 1px bottom rule: `table/row-rule` at `table/row-rule-width` 1 (render `#dad9d6` / `#62605b`). Strokes stay outside layout and on whole pixels; do not copy the crafted cells, which sit on y + 0.5 (map caveat). **No fills:** `table/row-bg` and `table/zebra` are transparent after the shared step, so **zebra** draws nothing (L397). Do not bind `table/hover`: Filigrane has no row fill. **selected:** the checked box plus F.margin. The base 2px selection-bar part keeps its layer name and becomes the 3px `primary/default` margin bar at x −8, full row height (render x48-50, y638-689). No `surface/selected` fill (L346, L379-380, L397). **hover** (derived): the same bar in `border/strong`. **focus:** F.ring around the row. **disabled:** R.disabled. **stacked** (derived): one cell per line, each value under its F.label `text/muted` header, rows separated by the 1px rule | `table/row-rule`, `primary/default`, `border/strong` |
| `Filigrane/Table` | `Table` `413:1367` | The Orders table (L301-306; render `38:9` y494-881). **head:** no fill; header cells as above; a 1px `table/head-rule` (render `border` `#dad9d6`, not `border-strong`); select-all `Filigrane/Checkbox` in the mark column. Rows nest `Filigrane/Table row`. **Columns** (L301-304): mark 36, No. 108, customer flexible (`minmax(0, 1fr)`, recomputed from the final content box), channel 140, status 150, date 132, amount 120 end-aligned. Never shrink the type or clip a column. **caption:** F.data `text/muted`. **summary:** the footnote row, 36 tall, F.label `text/muted` ("Page 1 of 531 · amounts in USD, refunds in parentheses", L305). **empty** (derived): one 52 row with an F.body `text/muted` sentence that states the repair (L381). **loading** (derived): one 52 row with `Filigrane/Spinner` and F.data `text/muted` | `table/head-rule` |
| `Filigrane/Data table` | `Data table` `416:4605` | The Orders region of `38:9` (L299-306). **Chrome:** `Filigrane/Card` default, a top rule with no box. **Toolbar** (derived from the tabs row, L299-300): `Filigrane/Search` (underline); the status and date `Filigrane/Select`s (underline); the Table/Board `Filigrane/Toggle group` segmented (underline tabs, gap 28, on the `border/strong` baseline); Columns and Export as `Filigrane/Button / sm` outline, or the crafted link "Last 30 days · All channels" with its arrow (F.link). **selection:** `Filigrane/Action bar` inline (the margin bar and count, no fill) above the table. **Table:** `Filigrane/Table`. **Pagination:** `Filigrane/Pagination` pager, the footnote plus the "Next page" link (render). **columns:** `Filigrane/Menu content` with checkbox rows. **loading** and **empty:** as Table. **mobile:** stacked rows | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from roles, which already resolve to Filigrane under Theme
  Filigrane. No primitive is bound.
- **Text:** `type/*` and `font/*`. After the shared step: display Light 76/76, heading 24/32 Light,
  kpi 30/36 Light, label 13/18. The only literal is F.lead (17/28).
- **Shape:**
  - every `radius/*` is 0 except `radius/avatar` 999;
  - `border/width` is 1;
  - `focus/ring-width` is 2; the 3px gap is drawn literally (§3 F.ring).
- **Sizes:**
  - `size/checkbox` 16;
  - `size/switch/*` 32/18/14, and sm 28/16/12;
  - `size/icon/*` 14/16/20;
  - `icon/stroke` 1.5. The checkbox check's 2px stroke is the one literal (L283).
- **Structure twins:** `tabs/*` (gap 28, pad 0, item-pad 0, sel-bottom 2, sel-box 0, track and
  selected fill transparent, sel-border `fg`) and `nav/active` (transparent).
- **Heights:** Filigrane binds no Density variable (L309-310). Draw 40 (buttons), 37 and 38
  (fields), 38 (tabs), 34 (nav and menu items), 72 (top bar) and 28 (header search) as literals.
  Bind a Density variable only where it resolves to the same number under Comfortable.
- **Effects:** `shadow/*` are 0 and `effect/shadow` is transparent. Add no effect.

## 6. Verification strips

For each category, build a frame `Filigrane style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Filigrane):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Filigrane: the "before" |
| Style | The same instances swapped to the `Filigrane/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Filigrane/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary in hover, pressed, focus and disabled, plus link in hover;
  - Icon button md;
  - Toggle off and selected (default and outline);
  - Toggle group segmented;
  - Button group;
  - Action bar floating and inline;
  - Theme toggle.
- **Forms:**
  - Input rest, focus, invalid and disabled;
  - Field focused (Label `text/fg`) and invalid with its repair helper;
  - Field set legend;
  - Select;
  - Textarea;
  - Checkbox off and on;
  - Radio off and on;
  - Switch off and on (md and sm);
  - Slider;
  - Input OTP;
  - Search;
  - Calendar;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default, line and segmented;
  - Nav item rest and selected;
  - Breadcrumb;
  - Pagination numbered and pager;
  - Top bar app and docs, desktop;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content with one highlighted row;
  - Dropdown menu open;
  - Dialog md with scrim;
  - Alert dialog default and destructive;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge: every tone in the status style (outline), plus plain;
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas up and down;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- no boxes: fields are underlines, tabs underline on a hairline baseline, floats are hairline
  rectangles with no shadow;
- every corner is square except the 32px avatar;
- Solid is an ink slab in light and a `#7c7b74` hairline in dark, never tomato;
- tomato appears only as the 3px margin bar, a 1px top rule and `primary-text`;
- focus is a 2px ring outside a 3px paper gap, `#7c7b74` in dark;
- labels are Hanken in sentence case; Newsreader appears only on the brand and the alert sentence;
- every hairline renders as a single row. A split half-intensity rule, a `#080808` dark underline, a
  white perimeter or a pale slab in dark is a defect (L362-378).

**Expected, Data display 1:**

- status is a 7×7 square glyph plus an ink word, with no outline, tint or slab;
- the table is 52px rows on 1px rules with no fills. The selected row is a checked box plus the 3px
  tomato margin bar outside the row, and the zebra row looks like any other row;
- cards are regions under a 1px top rule, with no box, fill, radius or shadow;
- KPI numerals are Newsreader Light 30/36 in a hairline grid with no tile fills;
- avatars are 32px hairline circles with ink initials, the only circles on the page;
- a row fill, a tinted chip, a boxed card or a light slab in dark is a defect (L323, L383, L397).

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays now that `.Kbd` is retired, 18 Data display 1).
  Filigrane adds no glyph components: `Filigrane/Icon` nests the base Lucide glyphs. Each set has
  the base variant count, property names and part names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/filigrane.json` lists every set id.
