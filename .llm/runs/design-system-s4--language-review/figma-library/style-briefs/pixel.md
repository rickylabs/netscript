# Pixel style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G4, Brutal + Pixel. Each theme has its own brief; this file is all the Pixel
  builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Pixel` (`64:443`).
- **Modes for every Pixel style set and strip:** Theme set **A** (`239:7`) and Theme **Pixel**
  (`52:2`). Density Comfortable (DESIGN L303). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Pixel `border/width` = 2.

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
   - `Pixel/Button / md`;
   - private helpers keep their dot: `Pixel/.Focus ring`.
   
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
7. **Composites.** Composites nest this theme's own style sets (`Pixel/Field` nests `Pixel/Label`
   and `Pixel/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/pixel.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/pixel/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** A pixel language in NetScript amber with Ore UI physics: discrete amber bands, stepped
corners on a 2px grid, pixel-font numbers, mono labels, and keys that sit on a lip and press flat
(L235-238).

**A Pixel strip must read at thumbnail size as:**

- square amber keys standing on a 4px lip;
- notched corners, never round;
- Space Mono uppercase labels;
- recessed fields with a dark inner shade;
- square switches with I/O marks;
- 2px edges;
- banded amber stripes as the only gradient-like signal, and those are hard 2px bands.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Components sheet, Light / Dark | `162:8708` / `162:9408` | Buttons (4 kinds × 5 states), tabs, page keys, tags, fields (rest, focus, error), checkbox, switch. **Measure here first.** |
| Orders, Light / Dark | `66:433` / `68:917` | Top bar, nav indicator, band stripe, table rows, KPI strip, notice, progress |
| Icon set (16px, 2px grid, 18 icons) | `64:444` | Every icon slot |
| Kits | Button `65:459`, Field `65:533`, Checkbox `65:550`, Switch `65:567`, Tag `65:593`, Tabs `65:602` | Geometry to copy. Rename to `Pixel/Specimen kit/*` before creating the same names |
| Render | `.llm/runs/design-system-s4--language-review/renders-r7/pixel--components.png` | Offline reference |

## 2. Tokens the style relies on

**Fonts** (load all): Pixelify Sans Medium and SemiBold; Space Mono Regular and Bold; JetBrains
Mono Regular and Bold; Inter Regular and Bold.

| Use | Bind | Pixel value (Light / Dark) |
| --- | --- | --- |
| Key face, primary | `primary/default` | `#faab35` / `#faab35` |
| Key face hover | `primary/hover` | `#e79c27` / `#ffba59` |
| Ink on amber | `primary/fg` | `#12100e` |
| Outline key face | `surface/raised` | `#fcfaf6` / `#282623` |
| Outline key face hover | `pixel/face/secondary-hover` | `#f4efe6` / `#322f2b` |
| Lip under amber | `pixel/lip/primary` | `#d38e22` |
| Lip under paper | `pixel/lip/secondary` | `#e8e0d3` / `#12100e` |
| Hero top highlight | `pixel/highlight/primary` | band 1 / band 2 |
| Destructive face / lip | `pixel/destructive/face` / `pixel/lip/destructive` | `#ce2c31` / `#a8222a` |
| Interactive edge | `control/ink` (stepped key edge), `border/input` (field edge) | `#21201c` / `#7c7b74`; `#82827c` / `#7c7b74` |
| Panel frame | `frame/ink` | `#21201c` / `#494844` |
| Row and cell rules | `border/default` | `#dad9d6` / `#3b3a37` |
| Recess shade | `pixel/recess/shade` | `#8a75502e` / `#00000073` |
| Focus gap / ring | `pixel/focus/gap` / `border/ring` (amber ring: `primary/default`) | `#21201c` / `#12100e`; amber |
| Selected row fill | `surface/selected` | `#ffeacb` / `#31200b` |
| Muted well | `surface/muted` | `#f1f0ef` / `#222221` |
| Tag lips | `pixel/tag/lip-{success,warning,info,neutral,danger}` | tone step 7 / `#12100e` |
| **Bands (documented exception)** | Primitives `color/band/1…5`, as the crafted frames bind them (Pixel map) | `#ffdba2` `#ffc673` `#ffb245` `#eda12e` `#d38e22` |
| Edge widths | `border/width` (2) for interactive edges; literal 1 for panel frames and table rules | 2 / 1 |
| Radius | none. Every Pixel `radius/*` is 0; corners are cut, never rounded | — |

**Text roles:**

| Role | Recipe |
| --- | --- |
| P.label | `font/label` (Space Mono) + `type/label/size`/`line`/`tracking` (12/16/+0.6) + `type/label/style` (Regular). Text case UPPER (literal) |
| P.label-strong | P.label with `type/strong/style` (Bold) |
| P.body | T.body (Inter 14/20) |
| P.data | T.data (JetBrains Mono 13/18) |
| P.heading / P.title | `font/heading` (Pixelify Sans) at 24/32 and 40/48 only |

## 3. Pixel recipes (referenced by the component rows)

- **P.step: stepped corner, filled.** Never use corner radius. Build the face from two absolute
  rectangles behind the content, both with constraints stretch × stretch and the same fill:
  - `face-h`: full width, inset top and bottom by the notch;
  - `face-v`: inset left and right by the notch, full height.
  
  Their union is a rectangle with square notches. Notch: 4 on keys 36px and taller, 2 on tabs,
  tags, checkbox, switch and controls 24px and under (L324-332).
- **P.edge: stepped 2px edge.**
  - An outer cross (`edge-h`, `edge-v`) in the edge colour.
  - An inner cross inset by 2 in the face colour, with its notch reduced by 2 (2×2 step pixel,
    L330-331).
- **P.key: key on a lip.**
  - Put a DROP_SHADOW x 0, y 4, blur 0, spread 0 on a `face` wrapper that holds only the P.step
    rectangles, so the label casts no lip. Colour: `pixel/lip/primary` (amber),
    `pixel/lip/secondary` (paper) or `pixel/lip/destructive`.
  - Root padding-bottom 4, so the hit area is the full 40 (L316).
- **P.pressed.**
  - Remove the lip effect (colour → transparent role, or delete the effect on the pressed variant).
  - Move the face 4px down: root padding top 4, bottom 0. The hit area is unchanged (L318).
- **P.raised: raised on a 2px lip.** As P.key with y 2 (L319: selected tab, checked checkbox,
  tags).
- **P.recess.**
  - An INNER_SHADOW x 2, y 2, blur 0 in `pixel/recess/shade`, on the inner face of a P.edge.
  - Fields use edge `border/input` (L321).
- **P.focus.** Build it once as `Pixel/.Focus ring` and use it everywhere instead of the base
  `.Focus ring`.
  - A 2px `pixel/focus/gap` P.edge ring at offset 0, then a 2px stepped amber (`primary/default`)
    ring outside it (L322, L370).
  - Fields: the field's own edge turns `control/ink`, then a 2px transparent gap, then the amber
    ring.
  - Name the part `focus-ring`.
- **P.disabled.** No layer opacity. Use a flat face `surface/muted`, a 2px `border/default` edge, a
  `text/muted` label, no lip (L387-390).
- **P.band.** Stack 2px rectangles in band order (1 → 5, top to bottom) and never use a gradient
  (L239-241, L363).
  - **Selected-row bar:** 4px wide on the row's leading edge, all five bands stacked down the row
    height, each about a fifth of the row (render `66:433`; see the 4.5 Table row).
  - **Nav indicator:** 4px, two bands.
  - **Top bar stripe:** 10px, all five.
- **P.panel.**
  - `surface/raised` fill (or `card/bg`), 1px `frame/ink` stroke, **square corners**. Every
    crafted panel and the KPI strip are square (`66:433`); L330-332 steps only keys, tags, tabs,
    the checkbox and the switch.
  - The one exception is the Dialog, which L352 gives "stepped corners": use 4px P.step corners
    there only.
  - No shadow and no blur (L310, L372).
- **States.**
  - Hover: primary face `primary/hover`; outline face `pixel/face/secondary-hover` (L387-388).
  - Pixel draws no translucent state layers, so every `state-layer` part stays hidden.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Pixel anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Pixel's spec does not draw; the derivation uses only
the recipes above.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Pixel/Icon`, `Pixel/Spinner`, `Pixel/.Focus ring` and
`Pixel/.State layer`.

| Style set | Base set | Pixel anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Pixel/Icon` (and `Pixel/Icon/<glyph>`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** Reuse the 18 glyphs of `64:444` as `Pixel/Icon/<lucide name>`. Draw the missing glyphs the built sets use on the 2px grid, single colour: minus, chevron-left/up/down (rotate chevron), arrow-left, x, calendar, upload, panel-left, menu, moon, sun, more-horizontal (= dots), hash, corner-down-left, external-link, grip-vertical, alert-circle. Fills, not strokes (L377-379). **Sizes:** sm, md and lg are all 16, because the pixel grid has one size; lg may scale 2× to 32 when a slot needs it | `text/fg` via the parent |
| `Pixel/Spinner` | `Spinner` `252:11837` | (derived) A 3×3 block grid on the 2px grid: four 4×4 blocks around a centre. One block in `primary/default`, the rest `text/muted`. Animation is `steps()`, so the frame shows a static step (L391-392) | `primary/default`, `text/muted` |
| `Pixel/.Focus ring` | `.Focus ring` `252:11805` | P.focus | as P.focus |
| `Pixel/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Pixel states recolour faces | — |
| `Pixel/Button / md` | `Button / md` `253:372` | 40 tall: 36 face + 4 lip, padding 16/18, gap 8, 16px icon, label P.label-strong (L340). Variants: **primary**: amber P.key, lip `pixel/lip/primary`, label `primary/fg`; theme-only boolean `hero` shows `highlight`, an inner 2px top INNER_SHADOW in `pixel/highlight/primary` (L317). **secondary**: Outline key, i.e. `surface/raised` face inside a 2px `control/ink` P.edge, with a 4px `pixel/lip/secondary` inner lip at the bottom (L316). **outline**: the Outline key with a transparent face (derived). **ghost**: no face or edge at rest; hover shows a flat `pixel/face/secondary-hover` P.step face (derived). **destructive**: `pixel/destructive/face` P.key, lip `pixel/lip/destructive`, label `destructive/fg`. **link**: P.label-strong in `primary/text` plus a 16px pixel arrow; the `underline` part is a 2px rectangle in `primary/text`, shown on hover and pressed (derived). States: hover (§3), pressed P.pressed, focus `Pixel/.Focus ring`, disabled P.disabled. `loading` shows `Pixel/Spinner` | `primary/*`, `pixel/*`, `control/ink`, `destructive/fg`, `primary/text` |
| `Pixel/Button / lg` | `Button / lg` `254:721` | As md: 48 = 44 + 4, padding 20/22 (derived) | as md |
| `Pixel/Button / sm` | `Button / sm` `254:371` | 32 = 30 face + 2 lip, 2px notch, padding 12/14, the 32px "mini key" (L341) | as md |
| `Pixel/Button / xs` | `Button / xs` `254:1071` | 24 = 22 + 2, 2px notch, padding 8/10, icon 16 (derived) | as md |
| `Pixel/Icon button / md`, `/ lg`, `/ sm`, `/ xs` | `255:262`, `255:740`, `255:501`, `255:979` | Square keys W = H using the Button recipe of the same size and variant; 16px pixel glyph centred on the face (not the lip) | as Button |
| `Pixel/Button group` | `Button group` `257:839` | Keys never join, because a stepped corner cannot share an edge. Gap 4 between keys; each keeps its own notch and lip. `separator` hidden; `text` part P.label on `surface/muted` with a P.step face (derived) | as Button |
| `Pixel/Toggle / md`, `/ sm`, `/ lg` | `256:281`, `256:437`, `256:593` | Off: flat, no face, label P.label `text/muted`; `outline` adds a 2px `control/ink` P.edge. Selected: amber face, P.raised on a 2px `pixel/lip/primary`, label P.label-strong `primary/fg` (spec A4 Pixel, L319). Hover: `pixel/face/secondary-hover` flat face. Focus, disabled as Button | `primary/*`, `pixel/lip/primary` |
| `Pixel/Icon toggle / md`, `/ sm`, `/ lg` | `276:8291`, `276:8431`, `276:8571` | As Toggle, square | as Toggle |
| `Pixel/Toggle group` | `Toggle group` `257:528` | `segmented` = the Pixel tab row: no track, items gap 4, the selected item raised amber (as `Pixel/Tab`). `default` and `outline`: Toggles with gap 4 | as Toggle |
| `Pixel/Action bar` | `Action bar` `258:663` | **floating:** a P.panel (`surface/raised`, 1px `frame/ink`, 4px notch) on a 4px `pixel/lip/secondary` lip, not the base inverse slab, because a pale dark slab would break the dark rule; `count` P.label-strong. **inline:** `surface/selected` fill with a 4px P.band leading bar (as the selected row, L346). Derived from L315-316 and L346 | `surface/raised`, `frame/ink`, `surface/selected`, bands |
| `Pixel/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Pixel/Button / sm` | — |
| `Pixel/Theme toggle` | `Theme toggle` `258:742` | `Pixel/Icon button / md` ghost with the pixel moon and sun | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Pixel anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Pixel/Label` | `Label` `278:45` | default: P.label-strong `text/fg` (form labels are Bold, L283); eyebrow: P.label `text/muted`. `required-mark` `destructive/text`; `optional-hint` P.label `text/muted` | — |
| `Pixel/Input` | `Input` `279:312` | **Rest.** md 40 / sm 32: a `surface/raised` face inside a 2px `border/input` P.edge with P.recess; value P.body, placeholder `text/muted`, padding 0/12 (L180-188, L342). **Hover:** edge `control/ink`. **Focus:** edge `control/ink`, the P.focus field variant, and a theme-only `cursor` part: an 8×18 `primary/default` block after the value (L342). **Invalid:** edge `destructive/default`, face `destructive/subtle`, a trailing pixel alert triangle in `destructive/text`. **invalid-focus:** both. **Disabled:** P.disabled with no recess | `border/input`, `control/ink`, `pixel/recess/shade`, `destructive/*` |
| `Pixel/Textarea` | `Textarea` `280:597` | The Input recipe, minimum 80, padding 12. `counter` P.label `text/muted`. `resize-handle`: three 2×2 `text/muted` pixels in a stair | as Input |
| `Pixel/Select` | `Select` `281:1023` | The Input recipe with a 16px pixel chevron. **Open:** edge `control/ink`, chevron rotated 180°, content = `Pixel/Menu content` 4px below | as Input |
| `Pixel/Select content` | `Select content` `281:826` | `Pixel/Menu content` holding `Pixel/Menu item` `type=option` | — |
| `Pixel/Checkbox` | `Checkbox` `283:1470` | 20px control, 2px notch (L343). **Unchecked:** recessed well (`surface/raised` face, 2px `border/input` P.edge, P.recess). **Checked:** amber face, P.raised on a 2px `pixel/lip/primary`, ink pixel tick in `primary/fg`. **Indeterminate:** an 8×2 `primary/fg` bar. Focus on `control`; invalid edge `destructive/default`; disabled P.disabled. Label P.body, description T.small `text/muted` | as Input + `primary/*` |
| `Pixel/Radio` | `Radio` `284:1828` | (derived; Pixel draws no radio) As Checkbox, but the control is a 20px square with 4px notches, so it reads rounder than the checkbox. Checked: an amber raised face with an 8×8 square ink dot. The base `indicator` ellipse becomes an 8×8 rectangle with the same layer name | as Checkbox |
| `Pixel/Radio group` | `Radio group` `284:1885` | Nests `Pixel/Radio` | — |
| `Pixel/Switch` | `Switch` `285:2329` | **md** 44×24, **sm** 36×20 (derived). Square, never rounded: the base `thumb` ellipse becomes a square frame with a 2px notch, same layer name (L215-228, L344). **Off:** recessed `surface/muted` track, 2px `control/ink` P.edge, an "O" mark (a 2px ring of pixels) at the free end, and a 16px `control/ink` knob on the left. **On:** `primary/default` track, an "I" mark (a 2×8 `primary/fg` bar) at the free end, and a 16px `primary/fg` knob on the right. Hover: edge `control/ink`. Focus P.focus on `track`. Disabled P.disabled. **Check `162:8708`:** the on track keeps the ink edge | `surface/muted`, `control/ink`, `primary/*` |
| `Pixel/Field` | `Field` `287:2656` | Nests `Pixel/Label` and `Pixel/Input`. Error row: a 16px pixel triangle plus T.small in `destructive/text` (L342) | — |
| `Pixel/Field set` | `Field set` `287:2743` | `legend` is P.heading (Pixelify 24/32, L285); `separator` is a 1px `border/default` rule | — |
| `Pixel/Input group` | `Input group` `297:3861` | The `Pixel/Input` frame; the addon is a pixel icon, P.label text or `Pixel/Icon button / xs` | — |
| `Pixel/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is its own recessed 40×40 well (Input recipe), with the character in P.data at 18. **caret:** an 8×18 amber block. Slots never share edges | as Input |
| `Pixel/Input OTP` | `Input OTP` `301:4490` | Group gap 4 instead of −1; the separator is a 2px `text/muted` bar | — |
| `Pixel/Slider` | `Slider` `303:5022` | (derived) **Track:** an 8px recessed well (P.edge 2px `border/input` + P.recess), square. **Range:** `primary/default` fill inside the well. **Thumb:** a 16×20 `control/ink` key with a 2px notch on a 2px `pixel/lip/secondary` lip. `value-label` P.data. The track and range rounded-rectangles become rectangles with the same layer names | as Switch |
| `Pixel/Combobox` | `Combobox` `305:5623` | `Pixel/Input` plus `Pixel/Menu content`; chips are `Pixel/Badge` subtle with `remove` (4.5) | — |
| `Pixel/Calendar day` | `Calendar day` `307:6154` | (derived from page keys, L341) 32 square, 2px notch, label P.data. **Rest:** no face. **Hover:** `pixel/face/secondary-hover`. **today:** 2px `control/ink` P.edge. **single, range-start, range-end:** pressed amber (`primary/default` face, no lip, content 2px lower, `primary/fg`). **range-middle:** flat `surface/selected`, no notch. **outside:** `text/muted`. **Disabled:** P.disabled | `primary/*`, `surface/selected` |
| `Pixel/Calendar` | `Calendar` `309:8620` | A P.panel. Caption P.label-strong; weekdays P.label `text/muted`; nav keys `Pixel/Icon button / sm` ghost; month select `Pixel/Select` sm | — |
| `Pixel/Date picker` | `Date picker` `313:14889` | `Pixel/Select` trigger with a pixel calendar glyph; open = `Pixel/Popover` with `Pixel/Calendar` | — |
| `Pixel/Search` | `Search` `316:16426` | The Input recipe at 260×40 (top bar, L291-292), pixel search glyph, label P.body `text/muted`, `kbd` `Pixel/Kbd`. Open: edge `control/ink` | as Input |
| `Pixel/Dropzone` | `Dropzone` `319:16832` | Dashes cannot be pixel-exact, so (derived) use a solid 2px `border/strong` P.edge with 4px notches and a P.recess face. **active:** edge `primary/default`, face `surface/selected`. **uploading:** progress as four P.band segments; the undone segment is flat `surface/muted` (L351). **invalid:** edge `destructive/default`. Label P.label-strong, hint T.small | bands, `border/strong` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Pixel anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Pixel/Location marker` | `Location marker` `337:22` | sm 4×4 and md 6×6 squares made of 2px P.band rows (bands 2, 3 and 5 on md) | bands |
| `Pixel/Breadcrumb item` | `Breadcrumb item` `338:92` | Link: P.label `text/muted`, `text/fg` on hover. Current: P.label-strong `text/fg`. `separator`: "/" in P.label `text/muted`. Ellipsis = pixel dots | — |
| `Pixel/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Pixel/Breadcrumb item` | — |
| `Pixel/Page key` | `Page key` `339:270` | Mini keys (L341): 32 tall, 2px notch, P.label. **Rest:** a `pixel/face/secondary-hover` face on a 2px `pixel/lip/secondary` lip. **Hover:** face `surface/raised`. **current:** pressed amber (`primary/default`, no lip, 2px lower, `primary/fg`). **previous and next:** `Pixel/Button / sm` secondary, "PREV" and "NEXT". **Disabled:** P.disabled. **Ellipsis:** P.label "…" | `pixel/*`, `primary/*` |
| `Pixel/Pager tile` | `Pager tile` `339:319` | A P.panel; `direction` P.label `text/muted`; `title` T.strong | — |
| `Pixel/Pagination` | `Pagination` `339:379` | `meta` P.label `text/muted`; nests `Pixel/Page key` and `Pixel/Pager tile` | — |
| `Pixel/Tab / horizontal` | `Tab / horizontal` `342:402` | 32 tall, 2px notch, label P.label plus `count`, which is `Pixel/Badge` plain (P.data, L341). **default and segmented, selected:** amber face, P.raised on a 2px `pixel/lip/primary`, label P.label-strong `primary/fg`, count `primary/fg`. **Unselected:** no face, label `text/muted`. **line, selected:** a 4px P.band underline instead of the face. **Hover:** flat `pixel/face/secondary-hover`. The `marker` part stays hidden; the face is the indicator. Focus P.focus. Disabled `text/muted` at rest | `primary/*`, bands |
| `Pixel/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal. `line` puts the 4px band bar on the inline-start edge | as horizontal |
| `Pixel/Tabs list` | `Tabs list` `343:424` | No track, item gap 4 (measure the gap on `162:8708`) | — |
| `Pixel/Tabs` | `Tabs` `343:489` | Nests `Pixel/Tabs list` | — |
| `Pixel/Nav item` | `Nav item` `345:601` | Label P.label `text/muted` (L349). **selected:** P.label-strong `text/fg` plus a 4px P.band indicator, under the label at level 1 in the top bar and on the inline-start edge in the sidebar (derived). **Hover:** a flat `pixel/face/secondary-hover` P.step face. Count: `Pixel/Badge` plain. Collapsed: a 16px pixel icon | bands |
| `Pixel/Nav group` | `Nav group` `346:611` | Group label P.label `text/muted`; nests `Pixel/Nav item` | — |
| `Pixel/Sidebar` | `Sidebar` `347:994` | (derived; Pixel navigates in the top bar) A `surface/raised` column with a 1px `frame/ink` trailing edge. `floating`: a P.panel inset by 8. `inset`: the content area is a P.panel | `frame/ink` |
| `Pixel/Top bar` | `Top bar` `351:1349` | 64 tall, `surface/raised`, padding 0/40, gap 32 (L291-292). Brand: `Pixel/.Brand logo` plus "NORTHWIND" in P.label-strong. Nav: `Pixel/Nav item`. Then `Pixel/Search` 260×40, a pixel bell `Pixel/Icon button`, and a 32px identicon avatar (a square tinted tile with a pixel glyph, L380-381). Theme-only part `band-stripe`: a 10px P.band of all five bands below the bar (L239-241). Mobile: 56 tall, same stripe (derived) | `surface/raised`, bands |
| `Pixel/.Brand logo` | `.Brand logo` `344:410` | A banded pixel "N" mark (L382-383). Copy it from `66:433` | bands |
| `Pixel/Nav menu item` | `Nav menu item` `349:1036` | As `Pixel/Nav item` at level 1; `open` shows a flat `pixel/face/secondary-hover` face and a chevron rotated 180° | — |
| `Pixel/.Nav menu link` | `.Nav menu link` `348:1108` | Highlighted: `surface/selected` with a 4px band bar. Title T.strong, description T.small | — |
| `Pixel/Navigation menu` | `Navigation menu` `349:1132` | The viewport is a P.panel | — |
| `Pixel/Menubar trigger` | `Menubar trigger` `349:1153` | P.label; open: a flat `pixel/face/secondary-hover` face | — |
| `Pixel/Menubar` | `Menubar` `349:1236` | Root: a P.panel with padding 4. Menus are `Pixel/Menu content` | — |
| `Pixel/Step` | `Step` `352:1355` | The fulfilment progress (L351). **indicator:** a 24 square with a 2px notch. **complete:** amber P.raised with an ink tick and title P.label-strong. **current:** 2px `control/ink` P.edge with a P.data number. **upcoming:** flat `surface/muted` with `text/muted`. **error:** `pixel/destructive/face` with a white ✕. **connector:** a 4px bar, P.band when complete and flat `surface/muted` otherwise | bands, `pixel/*` |
| `Pixel/Stepper` | `Stepper` `352:1424` | Nests `Pixel/Step` | — |
| `Pixel/Sidebar toggle` | `Sidebar toggle` `344:462` | `Pixel/Icon button / sm` and `/ lg` ghost with pixel panel-left, menu and x | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Pixel anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Pixel/.Kbd` | `.Kbd` `370:31` | **Retired** (moved to the Overlays Draft area); build `Pixel/Kbd` in 4.5 instead | — |
| `Pixel/Menu item` | `Menu item` `371:587` | Height `space/control/height-sm`, label P.label (menu items are commands, L285). **highlighted:** `surface/selected` with a 4px P.band leading bar (as the selected row, L346). **destructive:** label `destructive/text`; highlighted adds `destructive/subtle`. Indicators: the pixel tick (checkbox), an 8×8 square (radio), the pixel chevron (submenu). `shortcut` is `Pixel/Kbd` sm | bands, `surface/selected` |
| `Pixel/Menu label` | `Menu label` `373:35` | P.label `text/muted` | — |
| `Pixel/Menu separator` | `Menu separator` `373:38` | A 1px `border/default` rule | — |
| `Pixel/Menu group` | `Menu group` `373:248` | Nests `Pixel/Menu label` and `Pixel/Menu item` | — |
| `Pixel/Menu content` | `Menu content` `373:256` | A P.panel (no shadow, L310), padding 4 | — |
| `Pixel/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Pixel/Button / md` secondary plus a chevron; `Pixel/Menu content` 4px below | — |
| `Pixel/Context menu` | `Context menu` `374:653` | The trigger area is a 2px `border/strong` P.edge (dashes are not pixel-exact) with P.body text | — |
| `Pixel/Dialog` | `Dialog` `378:743` | L352: a `frame/ink` frame with stepped corners over an ink scrim. `content`: a P.panel with a 2px frame (the emphasised panel) and 4px notches. `backdrop` `surface/overlay`. `title` P.heading (Pixelify 24/32). `description` P.body `text/muted`. `close`: `Pixel/Icon button / sm` ghost. Footer: `Pixel/Button`s | `frame/ink`, `surface/overlay` |
| `Pixel/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a 40 square, 2px notch, `<tone>/subtle` face on a 2px tag lip (`pixel/tag/lip-danger` or `-neutral`), pixel glyph in `<tone>/text` | `pixel/tag/*` |
| `Pixel/Sheet` | `Sheet` `379:1004` | A P.panel with a 1px `frame/ink` inner edge and stepped exposed corners. `handle`: a 36×4 bar of two 2px rows (`border/strong`, `border/default`), square | `frame/ink` |
| `Pixel/Drawer` | `Drawer` `379:1150` | As Sheet; footer buttons `Pixel/Button` | — |
| `Pixel/Popover` | `Popover` `381:937` | A P.panel. `arrow`: a stepped 16×8 triangle of 2px rows (16, 12, 8, 4), with the frame drawn on the outer steps | `frame/ink` |
| `Pixel/Tooltip` | `Tooltip` `381:1030` | Chip `tooltip/bg` with a 2px notch; label T.small `tooltip/fg`; arrow stepped 10×6 (rows 10, 6, 2); kbd `Pixel/Kbd` inverse | `tooltip/*` |
| `Pixel/Hover card` | `Hover card` `381:1093` | A P.panel; the avatar is `Pixel/Avatar` md (the 28px identicon, L380; 4.5). Title T.strong, meta P.label `text/muted` | — |
| `Pixel/Command item` | `Command item` `382:1015` | **selected:** `surface/selected` with a 4px P.band leading bar instead of the 2px marker stroke, plus the enter glyph. `kind` is a Pixel tag: 24 tall, `<tone>/subtle` face, 2px tone lip, P.label (L345) | bands, `pixel/tag/*` |
| `Pixel/Command palette` | `Command palette` `383:1355` | The Dialog recipe. `input-row`: a recessed `Pixel/Input` without the outer edge, plus `Pixel/Kbd` "ESC". Filters are `Pixel/Tab` segmented. Footer P.label `text/muted` on `surface/muted` | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Add a `Data display 1` sub-frame after `Overlays` in `Style components` (rule 3).
- **Order:** `Pixel/Kbd`, `Pixel/Badge`, `Pixel/Avatar presence`, `Pixel/Avatar`, then the rest.
- **Glyphs:** add `arrow-up-down`, `user` and `bot` to `Pixel/Icon/*` on the 2px grid.
- **Sources:** the Orders frames `66:433` / `68:917` draw the KPI strip, table, tags, identicons and
  activity list (L296-299, L345-347).
- **Panels are square.** Every crafted panel and the KPI strip has square 1px `frame/ink` corners
  (measured on `66:433`; L315 gives panels no step). So this category draws its panels square:
  P.panel minus the 4px step.
- **§2.1 ink.** On amber faces the ink is `primary/fg`. Never bind `table/head`: it resolves
  `#f1f0ef`, while the crafted header sits on the panel.

| Style set | Base set | Pixel anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Pixel/Kbd` | `Kbd` `403:28` | **md** height `size/kbd` (20), **sm** `size/kbd-sm`; min width = H. **default:** a mini key: `pixel/face/secondary-hover` face on a 2px `pixel/lip/secondary` lip, 2px notch, P.label `text/fg`, padding 0/6. **inverse:** `tooltip/kbd` face, `tooltip/fg` label, no lip | `pixel/*`, `tooltip/*`, `size/kbd*` |
| `Pixel/Kbd group` | `Kbd group` `403:96` | `Pixel/Kbd` instances joined by "+" in T.caption `text/muted`, gap 4 | — |
| `Pixel/Badge` | `Badge` `405:180` | **subtle = the tag**, Pixel's primary style (L268, L345, kit `65:593`, `66:433`): 24 tall = a 22 face (P.step, 2px notch) on a 2px tone lip (P.raised at y 2 in `pixel/tag/lip-<tone>`), padding 0/8, label P.label (Space Mono 12 Regular +0.6, uppercase) in `<tone>/text` on `<tone>/subtle`. Destructive uses `pixel/tag/lip-danger`. Neutral is `secondary/subtle` + `text/muted` + `pixel/tag/lip-neutral` (measured REFUNDED `#f9f9f8` / `#191918`). In Dark the lips turn `#12100e` (L272-275). **outline** (derived): no fill and no lip; a 2px `<tone>/text` P.edge with a 2px notch and a `<tone>/text` label. **solid** (derived): a `<tone>/default` face on the tone lip with a P.label-strong label in `primary/fg`; destructive takes `pixel/destructive/face` + `destructive/fg` (5.21:1, L400); neutral takes `secondary/default` + `text/fg`. **plain** (counts): no container, P.data in `<tone>/text` (neutral `text/muted`). **dot:** a 6×6 square in `<tone>/text`, painted above the face. The crafted tag reserves the slot but its dot never paints (L412). **remove:** the 16px pixel `x` in the label colour | `<tone>/subtle`, `<tone>/text`, `pixel/tag/*` |
| `Pixel/Badge / kind` | `Badge / kind` `405:211` | (derived) The tag with a tone per kind instead of `code/syntax/*`. The Pixel palette is fixed and has no violet (L262-264): function, method → info; class, interface, type → success; variable, constant, enum → warning; module, namespace → neutral. Label P.label uppercase; `dot` as Badge | as Badge |
| `Pixel/Avatar` | `Avatar` `406:95` | Identicons, not photos (L380-381, `66:433`): square, radius `radius/avatar` (0), `size/avatar/sm|md|lg` (24/28/32), no outline or ring. **fallback** = the identicon: a symmetric pixel glyph on the 2px grid in `<tone>/text` on a `<tone>/subtle` square. The default tint is `warning/subtle`; rows override success, info and destructive tints. Copy the glyphs from `66:433`. **initials** (derived): the same tinted square with P.label-strong initials in `<tone>/text`. **image:** a square clip. **agent:** the neutral glyph tile of the Shipping bot (L381): a `text/muted` pixel bot on `secondary/subtle`. `presence`: `Pixel/Avatar presence` at the bottom-right. Pixel composites nest `content=fallback`, so tables show identicons | `<tone>/subtle`, `<tone>/text`, `size/avatar/*` |
| `Pixel/Avatar presence` | `Avatar presence` `406:43` | (derived) An 8×8 square (`radius/avatar` 0) on the 2px grid: `success/default`, `warning/default`, `border/strong`. A 2px OUTSIDE ring in `surface/raised` (the panel ground) instead of `surface/card` | `surface/raised` |
| `Pixel/Avatar group` | `Avatar group` `406:150` | Overlap −8 as base; a 2px OUTSIDE ring in `surface/raised`. The count tile is a `secondary/subtle` square with "+N" in P.data `text/fg` | `surface/raised` |
| `Pixel/Item` | `Item` `408:792` | (the Recent activity rows, `66:433`) **default:** no box; padding 12/16 (size default), 8/12 (sm), 6/8 (xs, derived); gap 12. Title T.strong `text/fg`; description T.small `text/muted`; header and footer P.label `text/muted`. **outline** (derived): a square 1px `frame/ink` frame. **muted:** a `surface/muted` P.step face. **Hover:** a flat `pixel/face/secondary-hover` face. **Focus:** P.focus. `media`: `Pixel/Avatar` md (28), `Pixel/.Item icon tile` or `Pixel/.Item image`; `actions`: `Pixel/Button / sm` secondary; `chevron`: the pixel chevron | `frame/ink`, `pixel/face/secondary-hover` |
| `Pixel/Item group` | `Item group` `408:996` | Nests `Pixel/Item`. **separators=true:** a 1px `border/default` rule dashed `[2, 2]` between rows (the activity dividers, measured on `66:433`). **false:** none | `border/default` |
| `Pixel/.Item icon tile` | `.Item icon tile` `408:82` | (derived from the identicon) A 32 square with no notch, `surface/muted`, a 16px pixel glyph in `text/fg` | — |
| `Pixel/.Item image` | `.Item image` `408:85` | (derived) 40×40, square clip (`radius/input` 0) | — |
| `Pixel/Card` | `Card` `409:951` | **default** = a square panel (L258-260, L315, `66:433`): fill `card/bg` (`#fcfaf6` / `#282623`, §2.4), 1px `card/border` (frame ink after the shared step) at `card/border-top|side|bottom` (1), radius `radius/card` (0), no shadow (R.card-shadow resolves 0). Padding md 24, sm 20 (YAML `form-padding`, `card-padding`). **Header:** eyebrow P.label `text/muted`; title T.heading (Pixelify 24/32, "Order SO-10480", L285); description P.body `text/muted`; `action` is `Pixel/Button / sm` (a "VIEW ALL" link uses the `link` variant). Theme-only boolean `headerRule` (default false) shows a 1px `frame/ink` rule under the header (Recent activity). **Footer:** no fill (not `card/footer`). A 1px `border/default` top rule dashed `[2, 2]` (the order-form footer), meta P.label `text/muted` ("EDITED BY MAYA ROSSI · 2 MIN AGO"), `Pixel/Button` secondary + primary. **hover** (derived, L387-388): face `pixel/face/secondary-hover`. **focus:** P.focus around the frame. **selected** (derived from the selected row, L346): `surface/selected` face with the 4px P.band bar (five bands, as Table row) on the inline-start edge. **rule:** no fill or frame; a 1px `border/default` top rule | `card/bg`, `card/border`, `frame/ink`, bands |
| `Pixel/Stat card` | `Stat card` `409:1270` | **default** = one KPI cell (L296-297, L347, `66:433`): 300×204, padding 20 (`kpi/pad-x`), fill `kpi/bg-1` (`#fcfaf6` / `#282623`), no radius or shadow. **Strokes:** 1px `kpi/border` (frame ink) top and bottom, and left through `kpi/first-left`; right width 0. Theme-only part `divider` is a 1px `border/default` line on the inline-end edge, matching the crafted inner rules. With `kpi/gap` 0 the cells share rules; the last cell in a strip overrides `divider` to `kpi/border`. Label P.label `text/muted`; value T.kpi (Pixelify Sans 40/48 Medium) `text/fg`. **delta up / down:** the 16px pixel up / down arrow and the value in P.label-strong, both `success/text` / `destructive/text` (measured `#2a7e3b` / `#71d083`, `#641723` / `#ff9592`); detail P.label `text/muted` ("VS LAST 30D"). **none:** arrow and value hidden. `badge` `Pixel/Badge` subtle. **Decorations:** blockbars only (`deco/blockbars` true): the 190×58 block chart (L297). 12 columns 14 wide and 2 apart; blocks 4 tall and 2 apart, bottom-aligned, `text/muted` (measured `#63635e` / `#b5b3ad`). The 12th column is banded top to bottom 1, 1, 2, 2, 3, 4, 4, 5 (P.band, the primitives exception). It sits inside a 2px outside silhouette in `control/ink`, measured `#21201c` / `#7c7b74`; L347 says `fg`, and L367 keeps the silhouette outside the bands. **hero** (derived from the selected row, L346): a `surface/selected` face with the 4px P.band bar on the inline-start edge; text unchanged | `kpi/*`, `border/default`, `control/ink`, `success/text`, `destructive/text`, bands, `deco/blockbars` |
| `Pixel/Table header cell` | `Table header cell` `410:546` | (L298-299, `66:433`) **40 tall** including a 1px `table/head-rule` (frame ink) at `table/head-rule-width` (1). No fill: the header sits on the panel. Label P.label `text/muted` uppercase. **Sorted:** the label stays `text/muted`, as crafted (DATE), and the 16px pixel down or up arrow shows in `text/muted`. **Sortable:** the pixel `arrow-up-down`. **hover** (derived): a flat `pixel/face/secondary-hover` face. **focus:** P.focus | `table/head-rule` |
| `Pixel/Table cell` | `Table cell` `410:383` | (L298-300, L346, `66:433`) Row height **56** (literal; Comfortable is 52), padding as base, no cell rule. **text:** P.body `text/fg` (channel). **strong:** T.strong `text/fg` (names). **mono:** P.data `text/fg` (order IDs). **number:** P.data Bold `text/fg`, end-aligned (totals, L283-284). **muted:** `font/data` 12/16 `text/muted` (dates, L284). `secondary` text: T.small `text/muted` (emails). **badge:** `Pixel/Badge` subtle with `dot` off. **avatar:** `Pixel/Avatar` md fallback (28 identicon) with name and email. **actions:** `Pixel/Icon button / sm` ghost with the pixel dots. **select:** `Pixel/Checkbox` (20, L413) | — |
| `Pixel/Table row` | `Table row` `412:1187` | (L299, L346, `66:433`) **56 tall**, including a 1px bottom rule in `table/row-rule` (`#dad9d6` / `#3b3a37` after the shared step) at `table/row-rule-width` (1). The rule is dashed `[2, 2]` as crafted (L299 says `border` dividers); start dashes on whole pixels. Fill `table/row-bg` (`#fcfaf6` / `#282623`). **selected:** `surface/selected` fill (L346). The base 2px `marker` bar becomes the 4px P.band bar on the inline-start edge, under the same layer name. All five bands stack top to bottom at 12/11/11/11/11 px (measured on `66:433`; this supersedes P.band's "bands 3 and 5" for the row bar). Text stays `text/fg` and the checkbox is checked (amber, raised). **zebra** (derived): `table/zebra`. **hover** (derived): `pixel/face/secondary-hover`. **focus:** P.focus. **disabled:** `text/muted`, checkbox P.disabled. **stacked:** cells stack inside the same row | `table/row-bg`, `table/row-rule`, `surface/selected`, bands |
| `Pixel/Table` | `Table` `413:1367` | (L298-299, `66:433`) **head:** a row of `Pixel/Table header cell` with a recessed select-all `Pixel/Checkbox`. **rows:** `Pixel/Table row`. **summary:** a 1px `frame/ink` top rule (measured; it replaces the last row's dashed rule), "SHOWING 1–6 OF 3,182 · 1 SELECTED" in P.label `text/muted`, and the pager. **caption:** P.label `text/muted`. **empty** (derived): P.label `text/muted`, centred. **loading** (derived): rows of `surface/muted` blocks on the 2px grid. No outer frame: `Pixel/Data table` supplies the panel | `frame/ink` |
| `Pixel/Data table` | `Data table` `416:4605` | (the Orders panel, L298, `66:433`) The chrome is `Pixel/Card` default (square, 1px `frame/ink`). **Toolbar** 73 = 72 plus a 1px `border/default` rule, padding 0/20. It holds `Pixel/Search` 280×40 ("Filter by order or customer"), `Pixel/Select` (Status, date), `Pixel/Toggle group` segmented (amber raised selection), and Columns and Export as `Pixel/Button / sm` secondary. **selection:** an inline `Pixel/Action bar` (`surface/selected` with the band bar). Then `Pixel/Table`, then `Pixel/Pagination` (PREV, mini keys, NEXT; L298-299). **columns:** `Pixel/Menu content` 4px below Columns. **mobile:** stacked rows | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from roles, which already resolve to Pixel under Theme Pixel.
- **Text:** `type/*` and `font/*` (display is 40/48 after the shared step).
- **Sizes:**
  - `size/checkbox` 20;
  - `size/switch/*` 44/24/16;
  - **Heights.** Comfortable `space/control/height` is 36, and Pixel keys are 40 (36 face + 4
    lip). Draw key heights literally (40, 48, 32, 24). Bind the md face to
    `space/control/height` (36 = the face); the lip adds the rest. Table rows are 56, not
    Comfortable's 52, so draw them literally.

## 6. Verification strips

For each category, build a frame `Pixel style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Pixel):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Pixel: the "before" |
| Style | The same instances swapped to the `Pixel/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Pixel/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary in hover, pressed, focus and disabled, plus `hero`;
  - Icon button md;
  - Toggle off and selected;
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
  - Badge subtle (the tag) in every tone, plus plain;
  - Avatar initials and agent, plus presence;
  - Avatar group;
  - Card default and rule, with footer;
  - Stat card default and hero, with deltas;
  - Table rows, with one selected and one zebra;
  - Data table in the selection state;
  - Item group;
  - Kbd group.

  **Expected (Data display 1):**

  - Badges are 24px tags with 2px notched corners on a 2px tone lip, with Space Mono uppercase
    `*-text` labels on `*-subtle` faces.
  - Avatars are 28px square tinted identicons.
  - Cards are square 1px `frame/ink` panels with no shadow and a dashed footer rule.
  - Stat cards form one framed strip split by thin rules, with Pixelify values, pixel arrows and a
    muted block chart whose last column is banded and outlined.
  - The table header is unfilled with a 1px ink rule. Rows are 56 tall with dashed rules, and the
    selected row is an amber tint with a 4px five-band bar on its leading edge.
  - In Dark, panels are `#282623`, frames `#494844`, the chart outline `#7c7b74` and tag lips
    `#12100e`. A white perimeter, a pale slab or a filled grey header is a defect (L369-370).

**Expected (style row vs base row):**

- corners are notched, never rounded;
- keys stand on lips and pressed keys sit 4px lower with no lip;
- labels are Space Mono uppercase;
- fields are recessed;
- the switch is square with I/O marks;
- focus is an ink gap plus a stepped amber ring;
- selection uses amber faces or band bars;
- dark keeps amber keys with ink text, warm near-black grounds and `#7c7b74` interactive edges. A
  white perimeter or pale slab is a defect (L369-370).

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1),
  plus the `Pixel/Icon/*` glyphs. Each has the base variant count, property names and part names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/pixel.json` lists every set id.
