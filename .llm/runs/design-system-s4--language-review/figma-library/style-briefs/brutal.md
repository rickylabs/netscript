# Brutal style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G4, Brutal + Pixel. Each theme has its own brief; this file is all the Brutal
  builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Brutal` (`33:8`).
- **Modes for every Brutal style set and strip:** Theme set **A** (`239:7`) and Theme **Brutal**
  (`14:2`). Density Comfortable: Brutal binds no Density variable and its geometry is literal (44px
  controls, 60px rows; DESIGN L347-349). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Brutal `shadow/x` = 6
  (it was 4).

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
   - `Brutal/Button / md`;
   - private helpers keep their dot: `Brutal/.Focus ring`.
   
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
7. **Composites.** Composites nest this theme's own style sets (`Brutal/Field` nests `Brutal/Label`
   and `Brutal/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/brutal.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/brutal/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** A commerce console styled as a sticker book. Every surface is a flat, saturated block
with a 2px black ink outline and a hard zero-blur offset slab. The ink and the slabs stay
`#000000` in the dark scheme (L266-273, L353).

**A Brutal strip must read at thumbnail size as:**

- rounded corners (r8 controls, r12 panels, pill stickers and switch), never stepped or square;
- 2px black outlines on buttons, panels, stickers and rules;
- hard black slabs offset down-right (3/3, 4/4, 6/6), no blur, collapsing when pressed;
- saturated colour blocks with black text: yellow primary and selection, green switch, blue, pink
  and green stickers;
- ink-filled selection (selected tab, current page key) with near-white `ink/fg` labels;
- Space Mono Bold uppercase labels and JetBrains Mono field values;
- joined rows whose 2px borders merge (tabs, segmented toggles, button groups);
- focus as a blue 4/4 slab and errors as a red 4/4 slab, with the outline kept.

**Not Pixel.** Brutal corners are rounded, never notched. Its depth is a diagonal slab under the
whole object, not a vertical lip. It has no bands and no amber stripes.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Orders, Light / Dark | `34:9` / `35:199` | Primary, Secondary and toolbar buttons, fields (rest, focus, error), textarea, checkbox, switch off, joined filter tabs, page keys and "Next", stickers, avatars, panels with Slab L, dashed dividers. **Measure here first** |
| Top bar | `34:10` | Logo tile (Slab S), nav items (rest and selected), 240×40 search, 2px ink rule |
| Notice | `35:151` | Ink alert disc, underlined Space Mono link: the Alert dialog media and the Button `link` variant |
| Button kit, pressed | `33:24`; pressed `79:2194` (Primary), `79:2197` (Secondary), `79:2200` (Ink) | Slab M at rest; pressed = no slab, content +4/+4, face fixed |
| Ink kind | `33:19` rest, `79:2200` pressed; labels `33:23` / `79:2202` | Label and "+" glyph bind `ink/fg` in both states (L481-482) |
| Kits | Button `33:24`, Input `33:48`, Checkbox `33:53`, Switch `33:58` (Off, On), Sticker `33:69` (5 tones), Tab `33:76` | Geometry to copy. Rename all six to `Brutal/Specimen kit/*` first: Input, Checkbox and Switch collide exactly, and Button and Tab would share a name group |
| Textarea (detached frame) | `47:1368` | 92px field, counter |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/brutal--light.png`, `brutal--dark.png`, `brutal--ink-button-specimen.png` | Offline reference |

## 2. Tokens the style relies on

**Fonts** (load all): Space Grotesk Regular and Bold; Space Mono Bold; JetBrains Mono Regular and
Bold.

| Use | Bind | Brutal value (Light / Dark) |
| --- | --- | --- |
| Yellow block (primary button, selected nav item, highlighted row, logo tile) | `block/yellow` | `#ffc53d` / `#ffc53d` |
| Other blocks (stickers, destructive button, switch on, avatars) | `block/green`, `block/blue`, `block/pink`, `block/purple` | `#d3e7a6` / `#bdee63`; `#c2e5ff` / `#0090ff`; `#ffcdc2` / `#e54d2e`; `#e1d9ff` / `#6e56cf` |
| Text and icons on a block | `block/ink-text` (DESIGN's `block-fg`) | `#000000` / `#000000`. On `block/purple` use `text/fg` (black is 3.9:1 in dark, L415-416) |
| Ink outline, rules, ink fill | `border/ink` | `#000000` / `#000000` (L296-298) |
| Text on ink | `ink/fg` | `#fdfdfc` / `#eeeeec`. **Never** `text/inverse`: it resolves `#111110` in dark and measures 1.05:1 on ink (L419-421) |
| User-findable boundary (fields, search, checkbox, switch, page keys) | `border/control` | `#000000` / `#7c7b74` (L305, L410-411) |
| Tab and joined-row borders | `tabs/idle-border`, `tabs/sel-border` | `#000000` / `#7c7b74` after the shared step |
| Slab colour | `effect/control-shadow` (controls), `effect/shadow` (panels, floats) | `#000000` / `#000000` in both schemes (L365-366) |
| Slab offsets | M: `shadow/control/x`, `shadow/control/y`; L: `shadow/x`, `shadow/y`; blur `shadow/blur` | M 4/4, L 6/6, blur 0. Slab S 3/3 has no variable: literal |
| Focus slab | `border/ring` | `#0d74ce` / `#70b8ff` |
| Error outline, slab and icon / helper text | `destructive/default` / `destructive/text` | `#e5484d`; `#641723` / `#ff9592` |
| Checked checkbox, slider range | `primary/default` fill, `primary/fg` keyline and mark | `#ffc53d`; `#21201c` |
| Panel face | `surface/card` | `#ffffff` / `#191918` |
| Float face (menus, popovers, dialogs, sheets) | `surface/raised` | `#ffffff` / `#222221` |
| Canvas, top bar, panel footer band | `surface/bg`, `topbar/bg` | `#fefbe9` / `#31312e`. The dark canvas is lighter than the panels (L289-291, L408-409) |
| Flat hover | `surface/hover` | `#f1f0ef` / `#222221` |
| Disabled face / edge / text | `surface/muted` / `border/default` / `text/muted` | `#f1f0ef` / `#222221`; `#dad9d6` / `#3b3a37`; `#63635e` / `#b5b3ad` |
| Text | `text/fg`, `text/muted` | `#21201c` / `#eeeeec`; `#63635e` / `#b5b3ad` |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` (L397) |
| Stroke width | `border/width` (2) for every outline and rule; `topbar/rule-width` (2) for the bar rule; dashes literal 1.5 | 2 / 2 / 1.5 |
| Radius | `radius/control` 8 (buttons), `radius/input` 8 (fields, search), `radius/card` 12 (panels, floats), `radius/badge` 999 (stickers, switch), `radius/checkbox` 4, `nav/radius` 6 (nav items, page keys, calendar days), `radius/avatar` 6; literal 4 for kbd and tooltip chips (`rounded.xs`, L371) | as listed (L371-373) |

**Do not bind** `surface/selected` or `nav/active` for Brutal selection. They resolve to a pale
`#fff7c2` / `#302008`; Brutal selection is the full `block/yellow` block (L390, L394). Primitive
exceptions: none (L480).

**Text roles:**

| Role | Recipe |
| --- | --- |
| B.label | `font/label` (Space Mono) + `type/label/size`/`line`/`style`/`tracking` (11/16, Bold, +0.6). Text case UPPER (literal) (L316) |
| B.button | T.strong: `font/sans` (Space Grotesk) + `type/strong/*` (14/20, Bold, −0.3) (L314) |
| B.body / B.small / B.caption | T.body (Space Grotesk 14/20), T.small (13/18), T.caption (12/16) (L315) |
| B.value | `font/data` (JetBrains Mono) + `type/body/size`/`line`/`style`/`tracking` (14/20 Regular). Field values and placeholders (L323-324) |
| B.data | B.value with `type/strong/style` (Bold): IDs, totals, OTP characters (L317) |
| B.count | `font/data` + `type/label/size`/`line` (11/16) + `type/body/style` (Regular): tab and nav counts |
| B.heading | T.heading: Space Grotesk 18/24 Bold −0.3. Panel, dialog and sheet titles, wordmark (L313) |

## 3. Brutal recipes (referenced by the component rows)

- **B.outline.** A 2px INSIDE stroke at `border/width`. Colour by role: `border/ink` on buttons,
  panels, stickers and rules (decorative or slabbed, L374, L412); `border/control` on fields,
  search, checkbox, switch, page keys (L410-411). Radius per the token table.
- **B.slab: hard offset slab.** A DROP_SHADOW on the object's own node, blur 0, spread 0:
  - **S 3/3**, literal x 3, y 3: logo tile, Button sm and xs, the "Next" key, small objects (L358);
  - **M 4/4**, x `shadow/control/x`, y `shadow/control/y`: buttons 44 (L359);
  - **L 6/6**, x `shadow/x`, y `shadow/y`: panels, floats, dialogs, menus as regions (L360).
  
  Colour `effect/control-shadow` (S, M) or `effect/shadow` (L). Same black in Dark: a pale or
  tinted slab is an error (L365-366). Never add blur, spread or a gradient (L426). The RTL mirror
  (−x) is pending (L467): do not draw it.
- **B.pressed.** Remove the slab effect; the face stays where it is. Content moves by the slab
  offset through padding, so the hit area is unchanged (L363, L367, kit `79:2194`):
  - M: padding 0/18/0/16 → 4/14/0/20;
  - S: the same shift by 3.
- **B.hover** (derived; not drawn, L399-400; the anchor choice is pending in #2416, L440-443).
  - Show the Gumroad lift as one slab step up while the face stays fixed: S → M, M → L. Flat boxed
    controls (fields, search, checkbox, switch track, page keys, OTP slots, dropzone) take Slab S.
  - Never change a fill colour on hover (L444-445).
  - Not neobrutalism.dev's "toward the shadow": it would make hover equal to pressed.
- **B.hover-flat** (derived). Unboxed items (ghost button, nav and menubar items, unselected tabs,
  toggles, calendar days) take a `surface/hover` fill. Labels do not change.
- **B.focus.** A DROP_SHADOW x 4, y 4, blur 0 in `border/ring` (bind x/y to
  `shadow/control/x|y`) on the focused node: `root`, `control`, `track` or the slot. The outline
  stays and turns `border/ink` (L361, L385, L422-423).
  - On a slabbed control the ring slab replaces the ink slab (derived; button focus is not drawn,
    L399).
  - An unboxed item gains a 2px `border/ink` outline in focus, so the slab has a shape (derived).
  - The `focus-ring` part stays in the tree, hidden: it is an instance of `Brutal/.Focus ring`.
  - Never signal focus by border colour alone (L422-423).
- **B.invalid.** Outline `destructive/default`, a 4/4 DROP_SHADOW in `destructive/default`, a
  trailing 18px `alert-circle` in `destructive/default`, and helper text T.small in
  `destructive/text` (L362, L385, frame `34:9`).
  - **invalid-focus** (derived): the destructive outline with the ring slab instead of the red
    one.
- **B.disabled** (derived; not drawn, L399-400). No layer opacity: a 38% black slab is a pale
  offset (L365-366). Flat, with no slab; fill `surface/muted`, outline `border/default`, label and
  icons `text/muted`.
- **B.panel.** `surface/card` fill, 2px `border/ink`, r12 `radius/card`, Slab L (L248-253, L360).
  - **Header rule:** 2px `border/ink` under the header (Recent activity panel).
  - **Footer band:** `surface/bg` fill under a 2px ink rule (Orders panel footer, L338).
- **B.float.** B.panel with a `surface/raised` fill (the base R.float role). It is white in Light
  and `#222221` in Dark, one step above the panels, so a float separates from a dark scrim
  (derived; L397 draws no overlay).
- **B.block.** A `block/*` fill, `block/ink-text` text and icons, and a 2px `border/ink` outline
  (L270-271, L292-295).
  - Selection and highlight: `block/yellow`.
  - Destructive: `block/pink` (the Failed sticker, L299).
  - On: `block/green`.
- **B.ink.** `border/ink` fill with `ink/fg` text and icons (L296-298, L419-421): the selected tab,
  the current page key, the Ink kind, tooltips and open triggers.
- **B.join.** A joined row (L376-377):
  - item gap −2 (`tabs/gap`), root padding 0 (`tabs/pad`), no track fill;
  - items radius 0 (`tabs/item-radius`), so their 2px outlines merge;
  - the first and last instance override their outer corners to `radius/control` (8) as instance
    overrides, as the base does for Button group (measured r8 on `34:9`).
- **B.dash.** A 1.5px dashed `[6, 4]` rule in `border/ink` (activity dividers, L375). The literal
  dash is allowed in the style sets.
- **Button variant map.** Brutal has three kinds (L384). The base has six variants and no new
  values may be added, so:

  | Base `variant` | Brutal | Source |
  | --- | --- | --- |
  | `primary` | Kind=Primary: B.block yellow, Slab M | L384, kit `33:9` |
  | `secondary` | Kind=Ink: B.ink fill, 2px `border/ink`, Slab M, label and icons `ink/fg` | L384, L481-482, kit `33:19` |
  | `outline` | Kind=Secondary: `surface/card` fill, 2px `border/ink`, Slab M, label `text/fg` | L384, kit `33:14` (Export, Cancel) |
  | `ghost` | (derived) no fill, outline or slab; label `text/fg` | B.hover-flat |
  | `destructive` | (derived) B.block pink, Slab M, label `block/ink-text`. White on `destructive/default` is 3.9:1, which fails AA at 14px | L299 |
  | `link` | The Notice link: B.label `text/fg`, 1px `underline` visible at rest, no slab | L393, `35:151` |

  **Toolbar instances** (40 tall, no slab, L384) are drawn by `Brutal/Toggle / md` outline. They
  are not a Button size.
- **States.** Brutal draws no translucent state layers, so every `state-layer` part stays hidden.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Brutal anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Brutal's spec does not draw; the derivation uses only
the recipes above.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Brutal/Icon`, `Brutal/Spinner`, `Brutal/.Focus ring` and
`Brutal/.State layer`.

| Style set | Base set | Brutal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Brutal/Icon` | `Icon` `252:11798`; glyphs `251:11788` | Brutal keeps the Lucide stroke icons, ink coloured, 16–18px (L432-433). Reuse the base `Icon/<glyph>` components as the swap targets: no glyph copies. Sizes bind `size/icon/sm|md|lg` (14/16/18); stroke `icon/stroke` (2), round caps | `text/fg` via the parent |
| `Brutal/Spinner` | `Spinner` `252:11837` | (derived; Brutal draws no spinner) Base geometry. Ring 2px `border/control`; arc 2px `text/fg`; no gradient or blur (L426). Parents override the arc to their label role | `border/control`, `text/fg` |
| `Brutal/.Focus ring` | `.Focus ring` `252:11805` | Same frame as the base, transparent and never shown. B.focus is an effect on the control. Description: "B.focus: 4/4 `border/ring` slab on the focused node" | — |
| `Brutal/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Brutal states change slabs and blocks | — |
| `Brutal/Button / md` | `Button / md` `253:372` | **44 tall** (literal, L384), padding 0/18/0/16, gap 8, 18px icons (`size/icon/lg`), label B.button, radius `radius/control`, B.outline `border/ink`. Variants follow the **Button variant map** (§3). **Rest:** Slab M on primary, secondary, outline and destructive; ghost and link flat. **Hover:** B.hover, Slab M → L (derived). **Pressed:** B.pressed (kit `79:2194`, `79:2197`, `79:2200`); the secondary (Ink) label and "+" stay `ink/fg` (L481-482). **Focus:** B.focus; the ring slab replaces Slab M. **Disabled:** B.disabled. **link:** `underline` 1px `text/fg` at rest, 2px on hover and pressed (derived). **loading:** `Brutal/Spinner`, arc in the label role | `block/*`, `border/ink`, `ink/fg`, `effect/control-shadow`, `shadow/control/*`, `shadow/x|y` (hover) |
| `Brutal/Button / lg` | `Button / lg` `254:721` | (derived) As md: 48 tall, padding 0/22/0/20 (pressed 4/18/0/24), Slab M | as md |
| `Brutal/Button / sm` | `Button / sm` `254:371` | The "Next" page key: 36 tall, Slab S 3/3 (L358, `34:9`), radius 8, padding 0/18/0/16 (pressed 3/15/0/19), 18px icons, label B.button. Hover: Slab S → M (derived) | as md, Slab S literal |
| `Brutal/Button / xs` | `Button / xs` `254:1071` | (derived) 28 tall (the nav item height, L394), Slab S, padding 0/12/0/10 (pressed 3/9/0/13), 16px icons, label T.strong-sm | as sm |
| `Brutal/Icon button / md` | `Icon button / md` `255:262` | Square 44, as `Button / md` per variant (Slab M, pressed collapse, A2 Brutal). 18px glyph centred; the glyph shifts +4/+4 when pressed | as Button |
| `Brutal/Icon button / lg` | `Icon button / lg` `255:740` | Square 48, as Button lg | as Button |
| `Brutal/Icon button / sm` | `Icon button / sm` `255:501` | Square 36, as Button sm (Slab S) | as Button |
| `Brutal/Icon button / xs` | `Icon button / xs` `255:979` | Square 28, as Button xs; 16px glyph | as Button |
| `Brutal/Button group` | `Button group` `257:839` | B.join of `Brutal/Button` instances: gap −2, inner corners 0, outer corners 8 (A3 Brutal, L376-377). Each item keeps its slab; later items cover the earlier slabs, so the row reads as one slab. `separator` hidden, because the merged borders replace it. `text` part: B.label `text/muted` on `surface/muted`, 2px `border/ink`, joined | `tabs/gap` |
| `Brutal/Toggle / md` | `Toggle / md` `256:281` | The toolbar filter button (`34:9` "Status", L384): 40 tall, radius 8, padding 0/18/0/16, gap 8, 18px icons, label B.button `text/fg`, **no slab**. **outline:** `surface/card` fill, 2px `border/ink`. **default:** no fill or outline at rest. **Selected** (derived from the selected tab, L389): B.ink, outline `border/ink`. **Hover** (off): B.hover-flat. Focus B.focus; disabled B.disabled | `border/ink`, `ink/fg` |
| `Brutal/Toggle / sm` | `Toggle / sm` `256:437` | (derived) As md at 36 (the page-key height, L396), label T.strong-sm, 16px icons | as md |
| `Brutal/Toggle / lg` | `Toggle / lg` `256:593` | (derived) As md at 44 (the button height) | as md |
| `Brutal/Icon toggle / md` | `Icon toggle / md` `276:8291` | As Toggle md, square 40 | as Toggle |
| `Brutal/Icon toggle / sm` | `Icon toggle / sm` `276:8431` | As Toggle sm, square 36 | as Toggle |
| `Brutal/Icon toggle / lg` | `Icon toggle / lg` `276:8571` | As Toggle lg, square 44 | as Toggle |
| `Brutal/Toggle group` | `Toggle group` `257:528` | **segmented:** B.join of `Brutal/Toggle` outline items (A5 Brutal: joined at −2, the selected item ink-filled). Item borders take `tabs/idle-border` / `tabs/sel-border` as instance overrides, like the tabs. No track. **default** and **outline:** separate Toggles, gap 8 | `tabs/*` |
| `Brutal/Action bar` | `Action bar` `258:663` | **floating:** a B.ink bar (`border/ink` fill, `ink/fg` count in B.button), radius 8, Slab L. It replaces the base inverse slab, which would turn pale in dark (L406-407). **inline:** the selected row: `block/yellow` fill, `block/ink-text` count, 2px `border/ink` bottom rule (L390). Derived from L296-298 and L390 | `border/ink`, `ink/fg`, `block/yellow`, `shadow/x|y` |
| `Brutal/.Action bar / actions` | `.Action bar / actions` `258:544` | Swap the nested Buttons to `Brutal/Button / sm` | — |
| `Brutal/Theme toggle` | `Theme toggle` `258:742` | `Brutal/Icon button / md` ghost with Lucide moon and sun | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Brutal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Brutal/Label` | `Label` `278:45` | default: B.label `text/fg` above the field ("CUSTOMER EMAIL", L385); eyebrow: B.label `text/muted`. `required-mark` `destructive/text`; `optional-hint` T.small `text/muted`. Invalid: `destructive/text`. Disabled: `text/muted` | — |
| `Brutal/Input` | `Input` `279:312` | **Rest.** md **44** / sm 36 (derived): `surface/card` fill, B.outline `border/control`, radius `radius/input` (8), padding 0/14. Value B.value `text/fg`, placeholder `text/muted`; icons 16 `text/muted` (L385, `34:9`). **Hover:** B.hover, Slab S (derived). **Focus:** the outline turns `border/ink`, plus B.focus (L361, L385; dark measures `#000000`). **Invalid:** B.invalid with `alert-circle` in `icon-end`. **invalid-focus** (derived): the destructive outline and icon with the ring slab. **Disabled:** B.disabled | `border/control`, `border/ink`, `border/ring`, `destructive/*` |
| `Brutal/Textarea` | `Textarea` `280:597` | The Input recipe, minimum height 92 (L386), padding 14. `counter` T.caption `text/muted` ("Optional · 0 / 500") stays in `footer` inside the field; the crafted frame `47:1368` sets it below the field. `resize-handle`: `grip-vertical` 16 in `text/muted` | as Input |
| `Brutal/Select` | `Select` `281:1023` | The Input recipe (F4 Brutal) with an 18px `chevron-down` in `text/fg` (`34:9` Shipping method). **Open** (derived): outline `border/ink`, chevron rotated 180°, content `Brutal/Menu content` 4px below | as Input |
| `Brutal/Select content` | `Select content` `281:826` | `Brutal/Menu content` holding `Brutal/Menu item` `type=option` | — |
| `Brutal/Checkbox` | `Checkbox` `283:1470` | `control` 22 (`size/checkbox`), radius `radius/checkbox` (4) (L387). **Unchecked:** `surface/card`, B.outline `border/control`. **Checked:** `primary/default` fill, 2px `primary/fg` keyline, 14px `check` in `primary/fg`. **Indeterminate** (derived): the same with `minus`. **Hover:** Slab S on `control` (derived). Focus B.focus on `control`. Invalid: B.invalid on `control`, without the trailing icon. Disabled B.disabled. Label T.body `text/fg`; description T.small `text/muted` | `primary/*`, `border/control` |
| `Brutal/Radio` | `Radio` `284:1828` | (derived; Brutal draws no radio) The Checkbox recipe on a 22 circle (radius 999 kept). Checked: `primary/default` fill, 2px `primary/fg` keyline, an 8px `primary/fg` dot (the base `indicator` ellipse) | as Checkbox |
| `Brutal/Radio group` | `Radio group` `284:1885` | Nests `Brutal/Radio` | — |
| `Brutal/Switch` | `Switch` `285:2329` | **Track** 52×28 pill (`size/switch/width`, `/height`; sm binds the sm variables, which alias the same 52×28 in Brutal) (L388, kit `33:58`). **Thumb:** an **18px** ellipse (literal, measured on `34:9` and the kit), `border/ink` fill with a 1px INSIDE `border/control` contour, 3px inside the track edge. **Off:** `surface/card` track, B.outline `border/control`, thumb left. **On:** `block/green` track, 2px `border/ink`, thumb right. **Hover:** Slab S on `track` (derived). Focus B.focus on `track`. Invalid: B.invalid on `track`. Disabled B.disabled; the thumb takes `text/muted` | `block/green`, `border/ink`, `border/control` |
| `Brutal/Field` | `Field` `287:2656` | Nests `Brutal/Label` and `Brutal/Input`; label-to-control gap 6 (`34:9`). `description` T.small `text/muted`. Error row: `error` T.small `destructive/text`. `error-icon` hidden, because the alert icon sits inside the field (`34:9` Discount code) | — |
| `Brutal/Field set` | `Field set` `287:2743` | `legend` B.heading `text/fg` (panel title "Order SO-10480", L313); `separator` a 2px `border/ink` rule (B.panel header rule) | `border/ink` |
| `Brutal/Input group` | `Input group` `297:3861` | The `Brutal/Input` frame. The addon is a 16px icon, B.label `text/muted`, or `Brutal/Icon button / xs` | — |
| `Brutal/OTP slot` | `OTP slot` `301:4385` | (derived) A 44×44 cell: `surface/card` fill, B.outline `border/control`. Character B.data `text/fg`. **caret:** a 2×18 `text/fg` bar. **Focus:** outline `border/ink` plus B.focus. **Invalid:** outline `destructive/default`. Disabled B.disabled | as Input |
| `Brutal/Input OTP` | `Input OTP` `301:4490` | B.join of `Brutal/OTP slot`: gap −2 instead of −1, outer corners `radius/input` as instance overrides. The group separator is `minus` 16 in `text/muted` | — |
| `Brutal/Slider` | `Slider` `303:5022` | (derived from Switch, L388) **Track:** a 12-tall pill, `surface/card`, 2px `border/control`. **Range:** `primary/default` inside the track. **Thumb:** the switch thumb: 18 `border/ink` ellipse with a 1px `border/control` contour. Hover: Slab S on the thumb. Focus B.focus on the thumb. `value-label` B.label. Keep the base layer names | `primary/default`, `border/control`, `border/ink` |
| `Brutal/Combobox` | `Combobox` `305:5623` | `Brutal/Input` plus `Brutal/Menu content`. Chips are `Brutal/Badge` subtle with `remove` (4.5) | — |
| `Brutal/Calendar day` | `Calendar day` `307:6154` | (derived from page keys, L396) 36 square, radius `nav/radius` (6), label B.label. **Rest:** no fill. **Hover:** B.hover-flat. **today:** 2px `border/control`. **single, range-start, range-end:** B.ink (the current page key). **range-middle:** `block/yellow` with `block/ink-text`, radius 0 (the selected row, L390). **outside:** `text/muted`. **Focus:** B.focus with a 2px `border/ink` outline. **Disabled:** B.disabled | `border/ink`, `ink/fg`, `block/yellow` |
| `Brutal/Calendar` | `Calendar` `309:8620` | A B.panel. Caption B.button; weekdays B.label `text/muted`; nav keys `Brutal/Icon button / sm` ghost; month select `Brutal/Select` sm | — |
| `Brutal/Date picker` | `Date picker` `313:14889` | `Brutal/Select` trigger with a Lucide `calendar` glyph; open = `Brutal/Popover` with `Brutal/Calendar` | — |
| `Brutal/Search` | `Search` `316:16426` | The top-bar search (`34:10`, L395): **240×40**, `surface/card`, B.outline `border/control`, radius `radius/input`. 16px `search` in `text/fg`; label B.value `text/muted` ("Search orders…"); `kbd` `Brutal/Kbd`. **Hover:** Slab S (derived). **Focus:** outline `border/ink` plus B.focus. **Open** (derived): outline `border/ink` | as Input |
| `Brutal/Dropzone` | `Dropzone` `319:16832` | (derived) `surface/card`, a 2px dashed `[6, 4]` `border/control` outline (the B.dash pattern at Brutal's stroke width), radius `radius/card`. Icon `upload` 18 `text/fg`; label B.button; hint T.small `text/muted`. **active:** `block/yellow` fill with a solid 2px `border/ink` (the selection block, L390). **uploading:** a 12-tall pill bar with a 2px `border/ink` outline and a `primary/default` range. **invalid:** B.invalid with `status` in `destructive/text`. Hover Slab S; focus B.focus | `block/yellow`, `primary/default`, `border/control` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Brutal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Brutal/Location marker` | `Location marker` `337:22` | (derived) sm 4 and md 6 squares in `border/ink`. Parents keep it hidden (`deco/marker` is false for Brutal) | `border/ink` |
| `Brutal/Breadcrumb item` | `Breadcrumb item` `338:92` | ("COMMERCE / ORDERS", `34:9`) Link: B.label `text/muted`; hover `text/fg` (derived). Current: B.label `text/muted`, as crafted. `separator`: "/" in B.label `text/muted`. Ellipsis: `more-horizontal` `text/muted`. Focus: B.focus with a 2px `border/ink` outline | — |
| `Brutal/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Brutal/Breadcrumb item` | — |
| `Brutal/Page key` | `Page key` `339:270` | (L396, `34:9`) 36×36, radius `nav/radius` (6), `surface/card`, B.outline `border/control`, label B.label `text/fg`. **current:** B.ink fill and `ink/fg` label; the outline stays `border/control` (dark `#7c7b74` around ink). **Hover:** Slab S (derived). **ellipsis:** "…" inside the same bordered key, as crafted. **previous and next:** `Brutal/Button / sm` outline with `arrow-left` / `arrow-right` ("Next", Slab S, L358). Focus B.focus; disabled B.disabled | `border/control`, `border/ink`, `ink/fg` |
| `Brutal/Pager tile` | `Pager tile` `339:319` | (derived) B.panel at Slab M (pressable, L359); hover lifts to Slab L. `direction` B.label `text/muted`; `title` B.button `text/fg`. Focus B.focus | `shadow/*` |
| `Brutal/Pagination` | `Pagination` `339:379` | `meta` B.label `text/muted` ("SHOWING 1–6 OF 3,182"); keys 8 apart. Nests `Brutal/Page key`, `Brutal/Button / sm` and `Brutal/Pager tile` | — |
| `Brutal/Tab / horizontal` | `Tab / horizontal` `342:402` | (L389, kit `33:76`, `34:9`) **40 tall**, padding 0/16 (measured; `tabs/item-pad` is 12), gap 8, radius `tabs/item-radius` (0). Label B.label `text/fg`; `count` is `Brutal/Badge` plain (B.count `text/muted`; `ink/fg` when selected, as an instance override). **default and segmented, unselected:** `surface/card`, 2px `tabs/idle-border` (stroke `tabs/idle-stroke`). **Selected:** B.ink fill, stroke `tabs/sel-border` at `tabs/sel-box`, label and count `ink/fg`. Do not bind `tabs/sel-bg` (§2.1 keeps the ink fill in the style set). **line** (derived from the top-bar nav, L394): no box; selected = `block/yellow`, 2px `border/ink`, radius `nav/radius`, label `block/ink-text`; the base `indicator` stays hidden. **Hover:** B.hover-flat. `marker` hidden. Focus B.focus. Disabled: `text/muted` label | `tabs/*`, `border/ink`, `ink/fg`, `block/yellow` |
| `Brutal/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal, joined in a column; `line` uses the same nav block | as horizontal |
| `Brutal/Tabs list` | `Tabs list` `343:424` | **default and segmented:** B.join. No track, padding `tabs/pad` (0), gap `tabs/gap` (−2). The first and last tab override their outer corners to `radius/control` (8): `tabs/radius` is 0 after the shared step and the row's own corners are not drawn. **line:** gap 8 | `tabs/gap`, `tabs/pad`, `radius/control` |
| `Brutal/Tabs` | `Tabs` `343:489` | Nests `Brutal/Tabs list` | — |
| `Brutal/Nav item` | `Nav item` `345:601` | (L394, `34:10`) **Rest:** 28 tall, radius `nav/radius` (6), no fill, padding 0/10, label B.label `text/fg`, 16px icon `text/fg`. **selected:** **32 tall**, B.block yellow (`block/yellow`, 2px `border/ink`), label `block/ink-text`. **Hover:** B.hover-flat. **Count:** `Brutal/Badge` plain (B.count `text/muted`; `block/ink-text` when selected, as an instance override). **Collapsed:** a 28 square with the icon only (derived). Level 2 indents 24. Focus B.focus; disabled `text/muted` | `block/yellow`, `border/ink`, `nav/radius` |
| `Brutal/Nav group` | `Nav group` `346:611` | Group label B.label `text/muted`; nests `Brutal/Nav item` | — |
| `Brutal/Sidebar` | `Sidebar` `347:994` | (derived; Brutal navigates in the top bar) A `surface/bg` column with a 2px `border/ink` trailing rule (the top-bar rule, L330). `floating`: a B.panel inset by 8. `inset`: the content area is a B.panel | `border/ink` |
| `Brutal/Top bar` | `Top bar` `351:1349` | (L330, `34:10`) **76 tall** including the rule, fill `topbar/bg`, padding 0/32, gap 28, a 2px bottom rule `topbar/rule` at `topbar/rule-width`. Brand: `Brutal/.Brand logo` plus "NORTHWIND" in B.heading `text/fg`. Nav: `Brutal/Navigation menu` with `Brutal/Nav menu item`s, 8 apart. End: `Brutal/Search` 240×40, `Brutal/Theme toggle`, `Brutal/Icon button` ghost, and a 34px avatar (block fill, radius 6, 2px `border/ink`, B.label initials, L434-435). **docs:** "docs" in B.label `text/muted` after the wordmark. **mobile** (derived): the same 76 bar and rule; nav collapses into `Brutal/Sidebar toggle` | `topbar/*`, `block/*` |
| `Brutal/.Brand logo` | `.Brand logo` `344:410` | The logo tile: 40×40, radius `radius/control`, `block/yellow`, 2px `border/ink`, Slab S, "N" in B.heading `block/ink-text`. Copy it from `34:10` | `block/yellow`, `border/ink` |
| `Brutal/Nav menu item` | `Nav menu item` `349:1036` | As `Brutal/Nav item` at level 1: `selected` is the yellow block. **open** (derived from the selected tab): B.ink, chevron rotated 180° | — |
| `Brutal/.Nav menu link` | `.Nav menu link` `348:1108` | Highlighted: B.block yellow, radius 6 (derived from the selected row, L390). Title B.button; description T.small (`block/ink-text` when highlighted) | `block/yellow` |
| `Brutal/Navigation menu` | `Navigation menu` `349:1132` | The viewport is a B.float, 8px below the trigger | — |
| `Brutal/Menubar trigger` | `Menubar trigger` `349:1153` | 28 tall, radius 6, padding 0/10, B.label `text/fg`. Hover B.hover-flat. **open:** B.ink (derived). Focus B.focus; disabled `text/muted` | `border/ink`, `ink/fg` |
| `Brutal/Menubar` | `Menubar` `349:1236` | (derived from the toolbar instances, L384) Root `surface/card`, 2px `border/ink`, radius `radius/input`, padding 4, no slab. Menus are `Brutal/Menu content` | — |
| `Brutal/Step` | `Step` `352:1355` | (derived; fulfilment progress is not drawn) **indicator:** a 26 sticker circle (`radius/badge`, 2px `border/ink`, L391); the number in B.label. **complete:** `block/green` with a `check` in `block/ink-text` (Paid, L299). **current:** B.ink with an `ink/fg` number. **upcoming:** `surface/card` with a 2px `border/control` outline and a `text/muted` number. **error:** `block/pink` with an `x` in `block/ink-text` (Failed, L299). **connector:** 2px `border/control`, solid when complete, B.dash pattern otherwise. Title B.button; description T.small `text/muted` | `block/*`, `border/ink`, `ink/fg` |
| `Brutal/Stepper` | `Stepper` `352:1424` | Nests `Brutal/Step` | — |
| `Brutal/Sidebar toggle` | `Sidebar toggle` `344:462` | `Brutal/Icon button / sm` and `/ lg` ghost with Lucide panel-left, menu and x | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

Dialog and sheet anatomy is not drawn (L397). Every Overlays set below derives from B.panel,
B.float, B.ink and B.block.

| Style set | Base set | Brutal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Brutal/.Kbd` | `.Kbd` `370:31` | **Retired** (moved to the Overlays Draft area); build `Brutal/Kbd` in 4.5 instead | — |
| `Brutal/Menu item` | `Menu item` `371:587` | 32 tall, padding 0/12, radius `nav/radius` (6), label T.body `text/fg`. **highlighted** (derived from the selected nav item, L394): B.block yellow; label, icons and indicators turn `block/ink-text`. **destructive:** label `destructive/text`; highlighted is B.block **pink** (`block/pink`, Failed, L299) instead of `destructive/subtle`. Indicators: `check` 16 (checkbox), an 8 dot (radio), `chevron-right` (submenu), all `text/fg`. `shortcut`: `Brutal/Kbd` sm. Disabled `text/muted` | `block/yellow`, `block/pink`, `border/ink` |
| `Brutal/Menu label` | `Menu label` `373:35` | B.label `text/muted`, padding 0/12 | — |
| `Brutal/Menu separator` | `Menu separator` `373:38` | A B.dash rule (1.5px `[6, 4]` `border/ink`), margins 4 (the activity dividers, L375) | `border/ink` |
| `Brutal/Menu group` | `Menu group` `373:248` | Nests `Brutal/Menu label` and `Brutal/Menu item` | — |
| `Brutal/Menu content` | `Menu content` `373:256` | A B.float (`surface/raised`, 2px `border/ink`, r12, Slab L), padding 4, width as base | `surface/raised`, `effect/shadow`, `shadow/x|y` |
| `Brutal/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Brutal/Button / md` outline with `chevron-down` in `icon-end`; `Brutal/Menu content` **8px** below, so it clears the trigger's Slab M | — |
| `Brutal/Context menu` | `Context menu` `374:653` | The trigger area is a B.dash frame in `border/control`, radius `radius/card`, with T.small `text/muted` | `border/control` |
| `Brutal/Dialog` | `Dialog` `378:743` | (derived from the order-form panel, L339) `content`: a B.float, padding 22/24/24/24, gap 20. `backdrop` `surface/overlay` (L397). `title` B.heading `text/fg`; `description` T.body `text/muted`; `close` `Brutal/Icon button / sm` ghost `x`. Footer end-aligned, gap 12 (Cancel and Save, `34:9`): `Brutal/Button` outline and primary | `surface/raised`, `surface/overlay`, `effect/shadow` |
| `Brutal/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media` (derived from the notice, L393, `35:151`): a 40 `border/ink` disc with a 20px glyph in `ink/fg`. Use `alert-circle` for default and `alert-triangle` for destructive; the destructive disc may copy the notice disc as drawn. Footer: `cancel` outline, `action` primary or destructive (the pink block) | `border/ink`, `ink/fg` |
| `Brutal/Sheet` | `Sheet` `379:1004` | A B.float with a 2px `border/ink` on the inner edge only, r12 on the exposed corners, Slab L. Header and footer rules: 2px `border/ink`. `handle`: a 36×4 pill in `border/control` | `border/ink`, `border/control` |
| `Brutal/Drawer` | `Drawer` `379:1150` | As Sheet; the stacked footer uses `Brutal/Button` | — |
| `Brutal/Popover` | `Popover` `381:937` | A B.float. `arrow`: a 16×8 triangle in `surface/raised` with a 2px `border/ink` on its two outer edges | `surface/raised`, `border/ink` |
| `Brutal/Tooltip` | `Tooltip` `381:1030` | (derived from the KPI delta pill, L392) A B.ink chip: `border/ink` fill, radius 4, padding 4/8, label T.small `ink/fg`, flat. `arrow` a 10×5 `border/ink` triangle. `kbd` `Brutal/Kbd` inverse. Binds ink roles instead of `tooltip/*`, so the chip stays ink in dark (L406-407) | `border/ink`, `ink/fg` |
| `Brutal/Hover card` | `Hover card` `381:1093` | A B.float. The avatar is `Brutal/Avatar` md (4.5). Title B.button; description T.small `text/muted`; meta B.label `text/muted` | — |
| `Brutal/Command item` | `Command item` `382:1015` | **selected:** B.block yellow, radius 6, plus `corner-down-left` in `block/ink-text`; the 2px marker stroke stays hidden. `kind` is a Brutal sticker (copy from `Brutal/Specimen kit/Sticker`): 26 pill, 2px `border/ink`, B.label in `block/ink-text`, with page = `block/blue`, section = `surface/card`, action = `block/yellow` (L391). `url` B.count `text/muted`; `excerpt` T.small `text/muted` | `block/*`, `border/ink` |
| `Brutal/Command palette` | `Command palette` `383:1355` | The Dialog recipe at W 640. `input-row` 56 with a 2px `border/ink` bottom rule: a strokeless `Brutal/Input` (B.value), 18px `search`, `Brutal/Kbd` "ESC". Filters: `Brutal/Toggle group` segmented with B.count counts. `group-label` B.label `text/muted`. Footer: 40 tall, a B.panel footer band (`surface/bg` under a 2px ink rule), B.label `text/muted` | `surface/bg`, `border/ink` |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Add a `Data display 1` sub-frame after `Overlays` in `Style components` (rule 3). Build in this
order: `Brutal/Kbd`, `Brutal/Badge`, `Brutal/Avatar presence`, `Brutal/Avatar`, then the rest. The
Orders frames `34:9` / `35:199` draw every surface here (L335-342, L390-392). Three
§2.1 fills live only in these style sets: the ink table header (`border/ink` + `ink/fg`), the
yellow selected row and the `block/*` KPI tiles (`block/ink-text`). Never bind `table/head`,
`surface/selected` or `kpi/bg-1` for them: they resolve to pale fills (`#f1f0ef`, `#fff7c2`, card).

| Style set | Base set | Brutal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Brutal/Kbd` | `Kbd` `403:28` | (derived from page keys, L396) **md** height `size/kbd` (20), **sm** `size/kbd-sm`; min width = H; radius 4 (literal); `surface/card` face, B.outline `border/control`; label B.label `text/fg`, padding 0/6. **inverse** (inside the ink tooltip): `surface/card` face with no outline, B.label `text/fg`. It binds these roles instead of `tooltip/*`, so the key reads on ink in both schemes | `border/control`, `size/kbd*` |
| `Brutal/Kbd group` | `Kbd group` `403:96` | `Brutal/Kbd` instances joined by "+" in T.caption `text/muted`, gap 4 | — |
| `Brutal/Badge` | `Badge` `405:180` | **outline = the sticker**, Brutal's primary style (L272-273, L391, kit `33:69`, `34:9`): 26 tall (literal), pill `radius/badge`, 2px `border/ink`, padding 0/10, label B.label (Space Mono Bold 11 uppercase) in `block/ink-text`. Fill per tone (L299-300): success `block/green`, warning `block/yellow`, info `block/blue`, destructive `block/pink`, neutral `surface/card` with a `text/fg` label. **subtle** (derived): the same pill and block with no outline (Flat, L357); neutral `surface/muted` + `text/fg`. **solid** (derived from the KPI delta pill, L392): a B.ink pill (`border/ink` fill and outline, `ink/fg` label); the tone shows only on the dot. **plain** (counts): no container, padding 0, B.count `text/muted` for every tone, because accent never tints text (L295). **dot:** an 8 circle (the LIVE SYNC dot, L272-273) in `block/ink-text`; `text/fg` on neutral; tone block on solid and plain. **remove:** `x` 14 in the label colour. Never put black text on `block/purple` (L415-416) | `block/*`, `border/ink`, `ink/fg`, `radius/badge` |
| `Brutal/Badge / kind` | `Badge / kind` `405:211` | (derived) The sticker (outline anatomy) with a block per kind instead of `code/syntax/*`, because accent never tints text (L295): function, method `block/blue`; class `block/green`; interface, type `block/purple` with a `text/fg` label (L415-416); variable, constant, enum `block/yellow`; module, namespace `surface/card` + `text/fg`. Label B.label uppercase; `dot` as Badge | `block/*`, `border/ink` |
| `Brutal/Avatar` | `Avatar` `406:95` | (L434-435, `34:9`) sizes `size/avatar/sm|md|lg` (24/34/40), radius `radius/avatar` (6), a 2px INSIDE `border/ink`. **initials:** a block fill (default `block/yellow`; rows override `block/blue`, `block/green`, `block/pink`, `block/purple` per person) with B.label initials in `block/ink-text`; on `block/purple` the initials are `text/fg` (measured `#21201c` / `#eeeeec`). **image** (derived; Brutal uses no photos, L434-436): the image clipped to r6 inside the same outline. **fallback:** `surface/card` with a `user` glyph in `text/fg`. **agent** (derived): B.ink with a `bot` glyph in `ink/fg`. `presence`: `Brutal/Avatar presence` at the bottom-right | `block/*`, `border/ink`, `ink/fg`, `size/avatar/*` |
| `Brutal/Avatar presence` | `Avatar presence` `406:43` | (derived) 10×10, radius `radius/avatar` (6, so near round), a 2px `border/ink` outline instead of the `surface/card` ring: online `block/green`, away `block/yellow`, offline `surface/card` | `block/*`, `border/ink` |
| `Brutal/Avatar group` | `Avatar group` `406:150` | Overlap −8 as base. No `surface/card` ring: each avatar's 2px ink outline already separates it (L434). The count avatar is `surface/card` with a "+N" B.label `text/fg` | — |
| `Brutal/Item` | `Item` `408:792` | (derived from the Recent activity rows, `34:9`) **default:** no box; padding 14/20 (size default), 10/16 (sm), 8/12 (xs); gap 14. Title B.button `text/fg` (customer names, L314); description T.small `text/muted`; header and footer B.label `text/muted`. **outline:** B.outline `border/ink`, radius `radius/input`, `surface/card`. **muted:** `surface/muted`, no outline. **Hover:** B.hover-flat. **Focus:** B.focus with a 2px `border/ink` outline. `media`: `Brutal/Avatar` md, `Brutal/.Item icon tile` or `Brutal/.Item image`; `actions`: `Brutal/Button / sm` outline; `chevron`: `chevron-right` 18 `text/fg` | `border/ink` |
| `Brutal/Item group` | `Item group` `408:996` | Nests `Brutal/Item`. **separators=true:** a B.dash rule (1.5px `[6, 4]` `border/ink`) between rows, as the activity dividers (L375, `34:9`). **false:** none | `border/ink` |
| `Brutal/.Item icon tile` | `.Item icon tile` `408:82` | (derived from the avatar, L434) 34 square, radius `radius/avatar`, `surface/card`, 2px `border/ink`, 16px glyph `text/fg` | `border/ink` |
| `Brutal/.Item image` | `.Item image` `408:85` | (derived) 40×40, radius `radius/input`, the image clipped inside a 2px `border/ink` outline | `border/ink` |
| `Brutal/Card` | `Card` `409:951` | **default** = B.panel (L248-253, L360): fill `card/bg` (`#ffffff` / `#191918`, §2.4), 2px `card/border` (ink after the shared step) on all four sides at `card/border-top|side|bottom` (2), radius `radius/card` (12), Slab L via R.card-shadow (`shadow/x|y` 6/6, blur 0, `effect/shadow`). Padding md 22/24/24/24, gap 20 (order form, L339); sm 16/20, gap 16 (derived from the toolbar, L338). **Header:** eyebrow B.label `text/muted`; title B.heading `text/fg`; description T.body `text/muted`; `action` is `Brutal/Button / sm` (a "VIEW ALL →" link uses its `link` variant). Theme-only boolean `headerRule` (default false) shows a 2px `border/ink` rule under the header (Recent activity, `34:9`). **Footer:** the Orders footer band (L338): `surface/bg` fill under a 2px `border/ink` rule, not `card/footer`; buttons `Brutal/Button` outline + primary. **hover:** identical to rest (derived): the card already sits on the largest slab, and Brutal never shifts colour on hover (L444-445). **focus** (derived from B.focus): the 6/6 slab turns `border/ring`. **selected** (derived from the selected row, L390, L447): `block/yellow` fill, with title, description and eyebrow `block/ink-text`. **rule:** no fill, radius or slab; a 2px `border/ink` top rule (the panel header rule) | `card/bg`, `card/border`, `effect/shadow`, `shadow/*`, `block/yellow` |
| `Brutal/Stat card` | `Stat card` `409:1270` | **default** = the KPI tile (L270-271, L335, L392, `34:9`): 289×190, radius `radius/card` (12), 2px `kpi/border` (ink) on all four sides at `kpi/border-*` (2), Slab L (`effect/shadow`, `shadow/x|y`), padding 18/20, gap 10. Fill `block/yellow`; a KPI row overrides tiles 2–4 to `block/blue`, `block/pink`, `block/green` as instance overrides. Do not bind `kpi/bg-*` (§2.1). Label B.label `block/ink-text`; value T.kpi (Space Grotesk 40/44 Bold −1.5) `block/ink-text`; `badge` `Brutal/Badge` outline; icon 18 `block/ink-text`. **delta up and down:** the ink delta pill (L392): 20 tall, radius 4, `border/ink` fill, a 12px `arrow-up` / `arrow-down` and the value in `font/data` Bold 11/16, all `ink/fg`. Up and down share the pill, with no green or red (accent policy L292-295; arrows bind ink roles, L417-418). The detail ("vs last 30d") is `font/data` 13/18 Regular in `block/ink-text`. **none:** pill hidden, detail only. **Decorations:** blockbars only (`deco/blockbars` true): 12 bars, 16 wide, about 5 apart, bottom-aligned, up to 38 tall, fill `primary/fg` (L417-418, measured `#21201c` in both schemes). Sparkline and ticks stay hidden. **hero** (derived from the ink surfaces, L296-298): the same tile as B.ink. Label, value, detail and bars turn `ink/fg`; the delta pill inverts to `surface/card` with `text/fg`; the slab stays black | `block/*`, `kpi/border`, `border/ink`, `ink/fg`, `primary/fg`, `deco/blockbars` |
| `Brutal/Table header cell` | `Table header cell` `410:546` | (L337, L390, YAML `table-header`, `34:9`) **44 tall** (literal), fill `border/ink`, padding 0/8 (L342), label B.label `ink/fg` (sorted too), sort glyph 14 `ink/fg` (`arrow-up-down` when sortable, `arrow-up` / `arrow-down` when sorted). **hover** (derived): a 1px `ink/fg` underline under the label. The fill stays ink, because `surface/hover` would put `ink/fg` on a pale cell in Light. **focus:** B.focus. Never a white or grey header in Dark (L406-407) | `border/ink`, `ink/fg` |
| `Brutal/Table cell` | `Table cell` `410:383` | (L338-342, `34:9`) Row height **60** (literal), padding 0/8 (L342), no cell rule. **text:** T.body `text/fg`. **muted:** T.body `text/muted` (channel). **strong:** B.button `text/fg` (customer names, L314). **mono:** B.data `text/fg` (order IDs). **number:** B.data `text/fg`, end-aligned (totals). `secondary` text: `font/data` 13/18 Regular `text/muted` (emails, dates; L121). **badge:** `Brutal/Badge` outline with `dot` off. **avatar:** `Brutal/Avatar` md (34) with name and email. **actions:** `Brutal/Icon button / sm` ghost with `more-horizontal`. **select:** `Brutal/Checkbox` | — |
| `Brutal/Table row` | `Table row` `412:1187` | (L338, L390, `34:9`) **60 tall** including a 2px bottom rule in `table/row-rule` (ink after the shared step) at `table/row-rule-width` (2); fill `table/row-bg` (card). **selected:** `block/yellow` fill. Every nested cell's text and icons are overridden to `block/ink-text` (muted and secondary text too: `#b5b3ad` on yellow fails in Dark), and the checkbox is checked (L390, L447, measured `#000000`). The base 2px `marker` bar stays hidden: the full block is the marker. **zebra** (derived from the footer band, L338): `surface/bg`. **hover** (derived): `table/hover`. **focus:** B.focus with a 2px `border/ink` outline. **disabled:** text `text/muted`, the checkbox B.disabled. **stacked:** cells stack inside the same 2px-ruled row | `table/row-bg`, `table/row-rule`, `block/yellow`, `block/ink-text` |
| `Brutal/Table` | `Table` `413:1367` | (L337-338, `34:9`) **head:** a row of `Brutal/Table header cell` (ink, 44) with a select-all `Brutal/Checkbox` (`surface/card` face, `border/control`); `table/head-rule` (ink) merges into the fill. **rows:** `Brutal/Table row`. **caption:** B.label `text/muted`. **summary:** the footer band, 66 tall (L338): `surface/bg`, with "SHOWING 1–6 OF 3,182" in B.label `text/muted` and the pagination. **empty** (derived): T.body `text/muted`, centred. **loading** (derived): rows of `surface/muted` bars, radius 4. No outer frame: `Brutal/Data table` supplies the panel | `border/ink`, `surface/bg` |
| `Brutal/Data table` | `Data table` `416:4605` | (the Orders panel, L337-338, `34:9`) The chrome is `Brutal/Card` default, clipping its content so the ink header meets the 12 corners. **Toolbar** 72, padding 16/20: `Brutal/Search` 240×40, `Brutal/Select` (Status, date), `Brutal/Toggle group` segmented (joined, ink selected), and Columns and Export as `Brutal/Button / sm` outline. The crafted toolbar draws its filters as 40-tall ink-outline buttons with a leading chevron, but the base slot is Select, so nest `Brutal/Select` to keep overrides. **selection:** an inline `Brutal/Action bar` (the yellow block row). Then `Brutal/Table`, then `Brutal/Pagination` in the `surface/bg` footer band. **columns:** `Brutal/Menu content` with checkbox items, 8px below Columns (clearing Slab S). **mobile:** stacked rows | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from roles, which already resolve to Brutal under Theme Brutal.
- **Text:** `type/*` and `font/*`. The Brutal mode already sets Space Grotesk, Space Mono and
  JetBrains Mono, with button and strong labels at Bold −0.3 after the shared step.
- **Shape and depth:**
  - `radius/*` 8/8/12/999/4/6 and `nav/radius` 6;
  - `border/width` 2;
  - card slab `shadow/x|y` 6/6 and control slab `shadow/control/x|y` 4/4, blur 0;
  - tabs `tabs/gap` −2, `tabs/pad` 0, `tabs/item-radius` 0.
- **Sizes:** `size/checkbox` 22; `size/switch/width|height` 52/28; `size/icon/*` 14/16/18;
  `size/avatar/md` 34.
- **Literals (named exceptions, not variables):**
  - heights 76 (top bar), 44, 40, 36, 32 and 28: Brutal binds no Density (L347-349);
  - Slab S 3/3;
  - the 18px switch thumb (`size/switch/thumb` is 22);
  - tab padding 16;
  - the dash `[6, 4]` at 1.5px;
  - radius 4 on kbd and tooltip.

## 6. Verification strips

For each category, build a frame `Brutal style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Brutal):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Brutal: the "before" |
| Style | The same instances swapped to the `Brutal/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Brutal/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary in hover, pressed, focus and disabled;
  - Button md secondary (the Ink kind) at rest and pressed;
  - Button sm outline (the "Next" key);
  - Icon button md;
  - Toggle md outline, off and selected;
  - Toggle group segmented;
  - Button group;
  - Action bar floating;
  - Theme toggle.
- **Forms:**
  - Input rest, focus, invalid and disabled;
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
  - Pagination;
  - Top bar app desktop;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content;
  - Dropdown menu open;
  - Dialog md with scrim;
  - Alert dialog;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge outline (the sticker) in every tone, plus plain;
  - Avatar initials and agent, plus presence;
  - Avatar group;
  - Card default and rule, with footer;
  - Stat card default and hero, with deltas;
  - Table rows, with one selected and one zebra;
  - Data table in the selection state;
  - Item group;
  - Kbd group.

  **Expected (Data display 1):**

  - Badges are 26px pill stickers with a 2px black outline, Space Mono Bold uppercase labels and
    black text on yellow, green, blue and pink blocks. Refunded is a card-coloured sticker.
  - Avatars are 34px r6 colour blocks with a 2px black outline.
  - Cards are r12 panels with a 2px black outline and a 6/6 black slab. The footer is a cream
    `surface/bg` band.
  - Stat cards are saturated block tiles with a 6/6 slab, a 40px bold value, a black delta pill
    and 12 black bars, with no green or red. The hero is an ink tile.
  - The table header is a solid ink row with near-white Space Mono labels. Rows are 60 tall with
    2px black rules, and the selected row is a full yellow block with black text throughout.
  - In Dark, the header and slabs stay `#000000`, the blocks stay saturated with black text,
    avatar initials on violet use `text/fg`, and no header, chip or row turns white or grey.

**Expected (style row vs base row):**

- corners are rounded (r8 controls, r12 panels, pill stickers and switch), never stepped;
- outlines are 2px black, and slabs are hard black offsets (3/3, 4/4, 6/6) with no blur;
- pressed controls lose their slab, and their content moves 4/4 inside a fixed face;
- selection is a yellow block (nav, menu, row) or an ink fill with `ink/fg` text (tab, page key);
- labels are Space Mono Bold uppercase, and field values are JetBrains Mono;
- focus is a blue 4/4 slab and errors a red 4/4 slab, with the outline kept;
- joined rows merge their borders and round only their outer corners.

**Expected in Dark:**

- ink outlines and slabs stay `#000000`;
- blocks stay saturated with black text;
- user-findable boundaries are `#7c7b74`;
- the canvas (`#31312e`) is lighter than the panels (`#191918`);
- the Ink kind label is `#eeeeec` on `#000000` (18.08:1).

Each of these is a defect (L404-407, L419-421):

- a white header, tab or bar;
- a pale or grey slab;
- a `text/inverse` label on ink (1.05:1).

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1).
  `Brutal/Icon` reuses the base Lucide glyphs,
  so there are no glyph copies. Each set has the base variant count, property names and part
  names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/brutal.json` lists every set id.
