# Tactile style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G6, Tactile alone. This file is all the Tactile builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Tactile` (`60:219`).
- **Modes for every Tactile style set and strip:** Theme set **A** (`239:7`) and Theme **Tactile**
  (`52:1`). Density Comfortable, but no Tactile set binds Density: hit sizes come from the adopted
  guidelines (DESIGN L348-349). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Tactile
  `type/body/size` = 16.

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
   - `Tactile/Button / md`;
   - private helpers keep their dot: `Tactile/.Focus ring`.
   
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
7. **Composites.** Composites nest this theme's own style sets (`Tactile/Field` nests
   `Tactile/Label` and `Tactile/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/tactile.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/tactile/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** Guideline-based neumorphism: one soft material lit from the top left. Pressable things
rise out of it as convex keys, things that hold a value sink into it as concave wells, and a
selected thing is pressed in. Four heights, one light, LEDs for status (L248-256, L353-382).

**A Tactile strip must read at thumbnail size as:**

- one blue-grey material everywhere, never white or black surfaces (L277-279);
- convex pill and round keys with a top-left highlight and a bottom-right shade;
- sunk selection: concave face, blue ink, and a lit blue LED on status keys;
- exactly one blue primary key, with a soft glow;
- 52px concave wells with a thin slate rim drawn on top;
- a 60×34 switch with a raised grey knob (off) or a glowing blue knob (on);
- flat plateaus as the only raised regions, never pressable, with nothing nested deeper than a key
  or a well;
- status as an LED plus a word; Nunito Sans in sentence case, Geist Mono only for IDs and codes.

**Height model (every row in section 4 uses it):**

| Height | Meaning | Who in the style sets |
| --- | --- | --- |
| H0 printed | No effect (L362) | Text, icons, LEDs, avatars, chips, ghost controls, nav rows, tiles and menu items at rest |
| H+1 plateau | Flat, one level, never pressable (L363, L372-375) | Menu content, popover, dialog, sheet, drawer, hover card, tooltip, command palette, floating action bar |
| H+2 key | Only things you can press (L364) | Buttons, icon buttons, toggles, tabs, page keys, the switch knob, the slider knob |
| H−1 well | Receives input or holds a value (L365) | Input, textarea, select, search, OTP slot, checkbox, radio, switch track, slider track, dropzone |
| H−1 pressed | A key pressed, selected or on (L366) | Pressed keys, selected status keys and tabs, selected nav, current page, highlighted menu items |

**Nesting budget:** ground → plateau → (key or well), never deeper. The only exception is a
control's own thumb in its own well (L370-375). Inside a plateau, contents are printed at rest.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Components sheet, Light / Dark | `146:857` / `147:891` (sheet `146:856`) | Height scale `146:864`, size scale `146:906`, and the state rows: Button `146:939`, Primary `146:975`, Round key `146:1003`, Status key `146:1035`, Switch `146:1063`, Checkbox and radio `146:1094`, Field `146:1134`, Stepper and slider `146:1159`, Status lights `146:1197`. **Measure here first.** Dark is the same layout |
| Orders, Light / Dark | `144:1744` / `145:1115` | Sidebar: search well `144:1754`, nav `144:1760` (selected `144:1768`), meters `144:1800`, profile ghost key `144:1825`. Header keys `144:1863` (bell `144:1864` with its unread LED). Orders plateau `144:9468`: filter well `144:9473`, status keys `144:9484`, tiles `144:9501` (selected `144:9528`), pagination `144:9581`. Order editor plateau `145:868`: stepper `145:895`, fields `145:925`, switches `145:966`, footer keys `145:979`. Notice `145:988`, activity `145:999` |
| KPI plateau, Light / Dark | `144:9333` / `145:1227` | Plateau stroke and padding (27 + the 1px border in layout, L340-342) |
| Effect styles | `Tactile/*`, listed in section 2 | Apply by name. Never re-derive them |
| Superseded, never use | `60:251` Button, `60:282` Field, `60:289` Segment, `60:294` Switch, `60:299` Checkbox, `60:315` Status, `60:341`, `60:342`; styles `Tactile/surface`, `control`, `solid`, `pressed`, `well`, `thumb` (map, L402-404) | Nothing. They are not kits: do not copy, move or restyle them. Rename one only if its name equals a new set name (rule 4) |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/tactile--{light,dark,components,zoom}.png` | Offline reference |

There are no Tactile kit sets. The crafted `H+2 key/*`, `H0 control/*`, `H-1 well/*`,
`H-1 pressed/*`, `H+1 plateau/*` and `H0 nav/*` nodes are frames inside the crafted designs. Copy
their paints and effects, but never rename or move them.

## 2. Tokens the style relies on

**Fonts** (load all): Nunito Sans Light, Regular and SemiBold; Geist Mono Medium. Also load Geist
Mono Regular if the Tc.data binding below resolves to it.

All colour roles are `tactile/*` Scheme roles (`--ns-tactile-*`, L544):

| Use | Bind | Tactile value (Light / Dark) |
| --- | --- | --- |
| Ground, plateau face, flat material | `tactile/surface/base` | `#e0e5ec` / `#2a2d32` |
| Printed chip (avatar, thumbnail, brand mark, tag) | `tactile/surface/tone` | `#dbe1e9` / `#27292e` |
| Printed tone step (one darker than ground) | `tactile/surface/well` | `#d7dde6` / `#23262a` |
| Disabled face | `tactile/surface/disabled` | `#dae0e8` / `#2f3238` |
| Convex key face, linear ≈145°, top left to bottom right | `tactile/convex/start` → `end` | `#ebeef3` → `#d5dce5` / `#32363c` → `#222428` |
| Concave well and pressed face, ≈145° | `tactile/concave/start` → `end` | `#ccd4df` → `#e2e6ed` / `#1b1d20` → `#2b2f34` |
| Primary key face, ≈145° | `tactile/surface/accent-start` → `accent-end` | `#1a6fe8` → `#1560cf` in both schemes |
| Raised light and shade (effect styles only) | `tactile/shadow/highlight`, `shadow/shade` | `#ffffff`, `#a3b1c699` / `#34383e`, `#1c1e21` |
| Inset light and shade (effect styles only) | `tactile/inset/highlight`, `inset/shade` | `#ffffff`, `#a3b1c6bf` / `#34383e`, `#1c1e21` |
| In-hue border (decorative) | `tactile/edge/border` | `#d1d9e6` / `#24272b` |
| Rim (3:1 boundary) | `tactile/edge/control` | `#6a759e` / `#7a8498` |
| Strong ink: names, values, key labels, titles | `tactile/text/strong` | `#1b2840` / `#f1f3f7` |
| Body ink: copy, nav labels, field labels, slider fill | `tactile/text/body` | `#2b3852` / `#c8ced8` |
| Muted ink: rest icons, placeholders, meta, counts, helpers | `tactile/text/muted` | `#4a5672` / `#9aa3b2` |
| Disabled ink | `tactile/text/disabled` | `#9aa3b8` / `#5c6477` |
| Pressed, selected and on ink; checkbox check | `tactile/text/accent` | `#1550b5` / `#79b0ff` |
| Ink on the primary key | `tactile/text/on-accent` | `#ffffff` |
| Status ink | `tactile/text/danger`, `text/success`, `text/warning` | `#a1262a` / `#ff8a8a`; `#0e6a3b` / `#4ade80`; `#7c4a08` / `#fbbf24` |
| Solid accent: focus ring, caret, radio dot | `tactile/accent` | `#1e7bff` / `#3b8bff` |
| LEDs | `tactile/led/{green,amber,blue,red,grey,off}` | green `#22c55e` / `#34d399`, amber `#f59e0b` / `#fbbf24`, blue `#1e7bff` / `#3b8bff`, red `#ef4444` / `#f87171`, grey `#9aa3b8` / `#6b7387`, off `#c7cfdb` / `#1c1e21` |

Sampled on the renders, these inks match the crafted nodes exactly: key labels `text/strong`,
pressed labels `text/accent`, field placeholders and rest nav icons `text/muted`, rest nav labels
and field labels `text/body`, the checkbox check `text/accent`, and the radio dot and caret
`accent`.

**Effect styles** (reuse by name; they carry the `tactile/shadow/*` and `tactile/inset/*`
bindings, so one style serves both schemes):

| Style | CSS (L386-400) | Use on |
| --- | --- | --- |
| `Tactile/plateau` | ±18 / blur 44, both halves | Every H+1 surface |
| `Tactile/key-s` | ±3 / 6 | Keys ≤ 30: xs keys (28), the off switch knob, the slider knob |
| `Tactile/key-m` | ±6 / 12 | Keys 44–48 at rest |
| `Tactile/key-l` | ±12 / 24 | The 88px dial knob only; no set in these four categories |
| `Tactile/key-primary-m` | key-m + `0 6 16` accent glow | Primary keys at rest and focus |
| `Tactile/knob-on` | key-s + `0 0 10` accent glow | The on switch knob |
| `Tactile/well-s` | inset ±2 / 4 | Tracks 8–34 (switch, slider, meters), checkbox, radio |
| `Tactile/well-m` | inset 2 2 5 + −3 −3 7 | Fields, search, select, textarea, OTP slot, quantity window |
| `Tactile/well-l` | inset ±8 / 16 | Large wells (dropzone) |
| `Tactile/pressed-xs` | inset ±2 / 4 | xs keys (28) pressed (derived from L399) |
| `Tactile/pressed-s` | inset ±3 / 6 | 44px keys pressed or current, highlighted menu items |
| `Tactile/pressed-m` | inset ±6 / 12 | 48px keys pressed, selected status keys and tabs, selected nav, selected tiles |
| `Tactile/led-glow/*` | `0 0 10` glow | Lit LEDs only |

Before the first set, check one style in Dark on `145:1115`. If it shows a white outer shadow,
stop and report it (rule 1).

**Shape and size:**

| Use | Bind or literal | Value |
| --- | --- | --- |
| Keys, nav rows, tracks, menu items (pills and circles) | `radius/control` | 999 |
| Wells | `radius/input` | 14 |
| Plateaus | `radius/card` | 24 |
| Checkbox | `radius/checkbox`, `size/checkbox` | 8, 28 |
| Switch | `size/switch/width`, `height`, `thumb` (the `-sm` twins alias them under Tactile) | 60, 34, 28 |
| Icons | `size/icon/sm`, `md`, `lg` | 14, 18, 20. Use a literal 16 for stepper glyphs and helper icons |
| Status-key bank | `tabs/gap`, `tabs/item-pad`, `tabs/pad` | 12, 20, 0 |
| Focus | `focus/ring-width`, `focus/ring-offset` | 2, 2 |
| Tiles, readout and large wells, chips | literal | r20 (tiles), r18 (large wells, L424), r14 (48 chips, L494) |
| Heights | literal (no Density) | keys 48 / 44 / 28, wells 52 (sm 44), nav rows 52, tiles 72 |

**Text roles.** Size and weight read off the crafted text boxes (Nunito Sans auto line: 13px → 18,
14px → 19, 15px → 20, 16px → 22):

| Role | Recipe | Used for |
| --- | --- | --- |
| Tc.label | T.strong: `font/label` + `type/strong/*` (16/22 SemiBold). **Not** `type/label/*`, which is 13/18 under Tactile | Keys, names, values, selected nav (L105, L316) |
| Tc.body | T.body (16/22 Regular) | Nav labels, field values, menu labels, descriptions (L104, L317) |
| Tc.caption | T.caption or T.small (both 13/18 Regular) | Meta, helpers, section labels, captions; the smallest size (L106, L318, L325) |
| Tc.heading | T.heading (20/28 Regular) | Overlay titles, Field set legend (L96, L314) |
| Tc.data | `font/data` (Geist Mono) + `type/small/size` and `line` (13/18), Medium | IDs and codes (L107, L319) |
| Tc.data-field | `font/data` + `type/body/size` and `line` (16/22), Medium | IDs and codes typed into wells (L108, `146:1150`) |
| Tc.count | Nunito Sans 14, auto line (19 box). Read the weight off `144:9492` | Counts in keys, tabs and nav; pager meta |
| Tc.field-label | Nunito Sans SemiBold 15, line 20 (`145:928`) | `Tactile/Label` default |
| Tc.money | Nunito Sans SemiBold 18/24 (L97-103) | The brand name in the top bar |

All text is sentence case. Tactile has no mono caps, and uses Light only for KPI numerals (L321,
L485).

**Binding exceptions (rule 6).** These are the only ones:

1. **Colours: `tactile/*` roles only.** No core role (`surface/*`, `text/*`, `border/*`,
   `primary/*`, `destructive/*`, `tooltip/*`) and no structure twin (`tabs/*` colours,
   `nav/active`, `card/border`, `kpi/*`), even where the shared step made the value equal. Tactile
   components read only `tactile/*` (L302-305; map: "0 core-role bindings").
2. **No Density.** Heights are the literals above (L348-349, L530).
3. **Effects are named styles.** Do not use the base's variable-bound DROP_SHADOWs (R.float,
   R.card-shadow, control shadow). The plateau needs its highlight half, which the variables cannot
   carry (theme-character §1.1).
4. **Literal text** where no Theme role exists: Tc.count, Tc.field-label and Tc.money. For
   Tc.data, bind the style to `type/mono-strong/style` if it resolves to Medium under Theme
   Tactile; otherwise set Medium as a literal.

## 3. Tactile recipes (referenced by the component rows)

Copy fills, strokes and effect styles from the crafted node named in each recipe, including their
variable bindings. Do not rebuild the gradients by hand. Every stroke below is 1px INSIDE and
included in auto layout, as in the crafted frames.

- **Tc.key: convex key (H+2).** `146:943`.
  - Fill `convex/start → end` at ≈145°, with ±3.5% lightness. It must read as curvature, not as a
    gradient (L286-287, L466-467).
  - Stroke `edge/border`, effect `Tactile/key-m` (`key-s` at 28), radius `radius/control`
    (L442).
  - Label Tc.label `text/strong`; icons in the label ink.
- **Tc.primary: primary key.** `146:979`. Fill `surface/accent-start → end` at ≈145°, **no
  stroke** (L434), effect `Tactile/key-primary-m`, label and icon `text/on-accent` (L443).
- **Tc.pressed: H−1 pressed.** `146:951`.
  - Fill `concave/start → end`, stroke `edge/border`, no outer shadow.
  - Effect by size: `pressed-m` (48), `pressed-s` (44), `pressed-xs` (28).
  - Every ink (label, icon, count) turns `text/accent`.
  - **Shift.** The content moves 1px down-right (L368-369). Match the crafted nodes: padding-left
    +1, padding-right −1, padding-top +1. The content then moves +1 x and +0.5 y (`146:951` vs
    `146:943`).
  - **Printed rows.** Rows that are printed at rest (nav items, tiles, menu items) gain the 1px
    border when pressed, so their content moves +2 x in total (`144:1768` vs `144:1763`).
- **Tc.primary-pressed.** `146:985`. Keep the accent gradient, add `pressed-m`, and drop the glow.
  The ink stays `text/on-accent` and moves as in Tc.pressed.
- **Tc.printed: H0.** No fill, stroke or effect. It is used by ghost controls, and by nav rows,
  tiles and menu items at rest (L362, L469-470).
- **Tc.well: concave well (H−1).** `146:1138`.
  - The root has no fill. Inside it are two absolute, full-size theme-only layers.
  - **`well`.** A rounded rectangle with a `concave/start → end` fill and `well-m`, `well-s` or
    `well-l` (`148:954`). It sits behind the content.
  - **`rim`.** The same geometry with no fill and an `edge/control` stroke, last in the layer
    order, on whole pixels (`146:1140`). It sits above every child, so the inset never covers it
    (L430-433).
  - Rims go only on text inputs, the checkbox, the radio, the switch track, the off knob and the
    slider knob (L477-478).
- **Tc.focus.** `Tactile/.Focus ring`.
  - A 2px `accent` ring with a 2px transparent gap. Its outer radius is the host's radius + 4:
    r18 around an r14 well, a pill around pills, a circle around round keys (L425-426, `146:965`,
    `146:1153`).
  - The host keeps its height and effect: a focused key is still convex (L503-504).
- **Tc.invalid.** `146:1143`, `145:953`, `145:960`.
  - The `rim` stroke turns `text/danger`.
  - A theme-only `led` (9px, `led/red` with `led-glow/red`) sits inside the well at the trailing
    end.
  - The helper is `circle-alert` 16 plus Tc.caption in `text/danger`, gap 8 (L444).
- **Tc.disabled.** `146:968`, `146:1156`, `146:1090`, `146:1130`.
  - A flat `surface/disabled` face.
  - No effect, stroke or rim.
  - Every ink `text/disabled`; LEDs `led/off`; no layer opacity (L442, L446).
- **Tc.plateau: H+1.** `144:9333`, `145:988`.
  - A flat `surface/base` fill (no gradient), an `edge/border` stroke, `Tactile/plateau`, and
    `radius/card` (24).
  - Padding 28 (`spacing.plateau`, L122; the crafted plateaus are 27–32 plus the border).
  - It has no states, is never pressable, and its contents are printed (L363, L372-375,
    L381-382).
- **Tc.led.**
  - An ellipse of 6–9px (L496). Lit: `led/<tone>` plus `led-glow/<tone>`. Unlit: `led/off`, no
    glow.
  - A status pairs an LED with a word, gap 10 (`146:1201`, L296).
  - The selected-tile edge is a 4×32 r2 `led/blue` bar, 8 from the start (`144:9541`).
- **Tc.tile.** 72 tall, r20, padding 0/24, printed at rest. Selected is Tc.pressed with
  `pressed-m` plus the LED edge (`144:9528`, L450).
- **States.**
  - **Hover** (derived) is identical to rest everywhere. A state is a height change (L368), and
    hover is undrawn and pending #2416 (L561-562).
  - Tactile draws no translucent layers, so every `state-layer` part stays hidden.
  - **Pressed** is Tc.pressed, and **disabled** is Tc.disabled.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Tactile anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes. Colour roles are `tactile/*`, so the prefix
  is dropped.

`(derived)` marks a state or component that Tactile's spec does not draw; the derivation uses only
the recipes above.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Tactile/Icon`, `Tactile/Spinner`, `Tactile/.Focus ring` and
`Tactile/.State layer`.

| Style set | Base set | Tactile anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tactile/Icon` | `Icon` `252:11798`; glyphs `251:11788` | Tactile prints Lucide stroke icons in text inks (L491-493), so **no glyph copies**: the `glyph` swap keeps the base `Icon/*` glyphs. Sizes sm, md and lg bind `size/icon/*` (14 / 18 / 20). The default glyph ink is `text/strong` (the base's `text/fg`); parents override it to `text/muted` (rest nav, field icons), `text/accent` (pressed) or `text/on-accent` (primary) | `size/icon/*`, `icon/stroke`, `text/strong` |
| `Tactile/Spinner` | `Spinner` `252:11837` | (derived from the refund gauge's radial LED segments, `144:9429`, L452) Keep the `track` and `arc` vectors. Give both the same dash pattern, so they read as segments. `track` is `led/off`; `arc` is `led/blue` with `led-glow/blue`. Sizes 16/24/40 and weights 2/3 as the base. Inside a primary key the arc takes `text/on-accent`, inside other keys `text/accent` | `led/off`, `led/blue` |
| `Tactile/.Focus ring` | `.Focus ring` `252:11805` | Tc.focus. The geometry is the base's (absolute at −2, 2px OUTSIDE stroke); the stroke becomes `accent`, and the radius follows the host + 2 | `accent`, `focus/*` |
| `Tactile/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Tactile states are height changes (L368), never translucent layers | — |
| `Tactile/Button / md` | `Button / md` `253:372` | 48 tall, padding 0/24, gap 10, icon 20, label Tc.label (`146:943`, L141, L338-339). **primary:** Tc.primary (`146:979`), padding 0/24 with no border. **secondary:** Tc.key. **outline:** Tc.key, identical to secondary (derived: Tactile has one neutral key, whose in-hue border is already its outline, L428). **ghost:** Tc.printed, label `text/strong`, like the profile ghost key `144:1825` (L336). **destructive:** (derived; Tactile draws no red key, and red is reserved for danger ink and LEDs, L290-296) Tc.key with label and icon in `text/danger`, kept when pressed. **link:** printed Tc.label `text/strong` with a 16px chevron-right (as "View all" `145:1002`); `underline` stays hidden, because Tactile prints no lines (L435); pressed `text/accent` (derived). **States:** hover = rest (derived); pressed Tc.pressed with `pressed-m` (primary: Tc.primary-pressed); focus `Tactile/.Focus ring` over the unchanged key (`146:959`); disabled Tc.disabled, primary included (`146:998`). `loading` shows `Tactile/Spinner` sm. The base control shadow is not used | `convex/*`, `surface/accent-*`, `concave/*`, `edge/border`, `text/*`, `radius/control`, `size/icon/lg` |
| `Tactile/Button / lg` | `Button / lg` `254:721` | (derived) Identical to md at 48: the key band stops at 48 (L348-349, L530) | as md |
| `Tactile/Button / sm` | `Button / sm` `254:371` | 44 tall with `key-m` (L390), padding 0/16 (`144:9593`), icon 18, label Tc.label. Pressed uses `pressed-s` (the 44px page key, L397); confirm it against the stepper's pressed key `146:1180` | as md, `size/icon/md` |
| `Tactile/Button / xs` | `Button / xs` `254:1071` | (derived) A 28 pill with `key-s` (keys ≤ 30, L389; sample `146:907`), padding 0/12, icon 12. Label T.strong-sm (13/18 SemiBold, the 13px floor, L325). Pressed `pressed-xs` (L399) | as md, `type/small/*` |
| `Tactile/Icon button / md` | `Icon button / md` `255:262` | A 48 circle with a centred 20px glyph (`146:1007`, bell `144:1864`, editor menu `145:880`). Variants follow `Tactile/Button / md`; primary is an accent circle with an `on-accent` glyph (derived). Pressed: Tc.pressed with `pressed-m`, glyph `text/accent` (`146:1014`). `label` stays on its hidden layer | as Button md |
| `Tactile/Icon button / lg` | `Icon button / lg` `255:740` | (derived) Identical to md, 48 | as md |
| `Tactile/Icon button / sm` | `Icon button / sm` `255:501` | A 44 circle with `key-m`: glyph 18 (pager keys `144:9583`) or 16 (stepper keys `146:1164`). Pressed `pressed-s` (A2: "the current state sinks (pressed-s)", L397) | as md |
| `Tactile/Icon button / xs` | `Icon button / xs` `255:979` | A 28 circle with `key-s` and a 12px glyph (`146:907`). Pressed `pressed-xs` (derived, L399) | as md |
| `Tactile/Button group` | `Button group` `257:839` | Keys never join. Each keeps its own full pill, convex face and border: a bank of keys (L449). Gap 12 (the status bank, L344, `144:9484`); no inner-corner overrides. `separator` hidden (no printed rules, L435). The `text` part is Tc.printed Tc.body `text/muted` with no fill (derived, L362) | `text/muted` |
| `Tactile/Toggle / md` | `Toggle / md` `256:281` | The status key: a 48 pill, padding 0/20, gap 10 (`146:1039`, `144:9489`). Theme-only parts: `led` (8px, before `label`) and `count` (Tc.count after `label`), with theme-only boolean `count` (default true). **Off:** Tc.key; `led` `led/off`, label Tc.label `text/strong`, count `text/muted`. **Selected:** Tc.pressed with `pressed-m`; label and count `text/accent`; `led` lit `led/blue` + `led-glow/blue` (`146:1045`, L449). **outline:** identical to default (derived). Hover = rest (derived); focus is a pill ring (`146:1055`); disabled is Tc.disabled with `led/off` (`146:1058`). Icons 20 in the label ink | `convex/*`, `concave/*`, `edge/border`, `led/*`, `text/*`, `tabs/item-pad` |
| `Tactile/Toggle / sm` | `Toggle / sm` `256:437` | (derived) As md at 44 with `key-m`; selected uses `pressed-s` | as md |
| `Tactile/Toggle / lg` | `Toggle / lg` `256:593` | (derived) Identical to md, 48 | as md |
| `Tactile/Icon toggle / md` | `Icon toggle / md` `276:8291` | A 48 round key (`146:1007`). Selected: Tc.pressed with `pressed-m`, glyph `text/accent` (`146:1014`). No `led`; the sunk face, accent ink and shift carry the state (L471-472) | as Toggle |
| `Tactile/Icon toggle / sm` | `Icon toggle / sm` `276:8431` | A 44 round key; selected `pressed-s` | as Toggle |
| `Tactile/Icon toggle / lg` | `Icon toggle / lg` `276:8571` | (derived) Identical to md, 48 | as Toggle |
| `Tactile/Toggle group` | `Toggle group` `257:528` | Every variant is a bank of separate `Tactile/Toggle` keys, not a track (L449). No `track` fill (bind no `tabs/*` colour), padding 0, gap 12 in both orientations. `segmented`, `default` and `outline` draw the same bank (derived). Size sm or md picks the Toggle size | `tabs/gap`, `tabs/pad` |
| `Tactile/Action bar` | `Action bar` `258:663` | **floating:** (derived: a non-pressable region that holds keys is a plateau, L363, L372-375) Tc.plateau with padding 12 and gap 12; `count` Tc.label `text/strong`; `separator` hidden; `close` `Tactile/Icon button / sm`. It is not the base inverse slab, which the dark rule forbids (L486-487). **inline:** Tc.printed, no fill and no shadow: rows inside plateaus are printed (L469-470) | `surface/base`, `edge/border` |
| `Tactile/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Tactile/Button / sm`, gap 12 | — |
| `Tactile/Theme toggle` | `Theme toggle` `258:742` | `Tactile/Icon button / md` **secondary**, a round key like the bell (`144:1864`), with moon and sun 20. (derived: every icon-only control in the crafted frames is a round key) | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Tactile anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tactile/Label` | `Label` `278:45` | **default:** Tc.field-label in `text/body` (`145:928`). **eyebrow:** Tc.caption `text/muted`, sentence case, never mono caps (the section label `144:1762`, L321). **`required-mark`:** the word "Required" in Tc.caption `text/muted`, gap 8 (`145:929`), not a red asterisk: red is for danger text and LEDs only (L294-296). `optional-hint` Tc.caption `text/muted`. **disabled:** `text/disabled`. **invalid:** `text/danger` | `text/body`, `text/muted`, `text/danger`, `text/disabled` |
| `Tactile/Input` | `Input` `279:312` | **md** is a 52 Tc.well with `well-m`, `radius/input` 14, padding 0/16 and gap 12 (`146:1138`, `144:1754`, L444). **sm** is 44 (derived from the 48×44 quantity window `146:1167`, also `well-m`). Theme-only parts `well`, `rim`, `caret`, `led`. Value Tc.body `text/strong`; an ID or code value is overridden to Tc.data-field (`146:1150`). Placeholder `text/muted`. Icons 18 `text/muted`; `icon-end` holds the clear `x` (`145:956`). **Hover:** rest (derived). **Focus:** the rim stays `edge/control`; `caret` is a 2×20 r1 `accent` bar 2 after the value (`146:1151`); `Tactile/.Focus ring` r18 (`146:1153`). **Invalid:** Tc.invalid; `led` sits 12 before `icon-end` (`145:953`). **invalid-focus:** both (derived). **Disabled:** Tc.disabled; no well effect, no rim, `text/disabled` (`146:1156`) | `concave/*`, `edge/control`, `accent`, `led/red`, `text/*`, `radius/input`, `size/icon/md` |
| `Tactile/Textarea` | `Textarea` `280:597` | The Input recipe: Tc.well with `well-m`, r14, padding 16, minimum height 80 as the base. Text Tc.body; `counter` Tc.caption `text/muted`; `resize-handle` is a printed `grip-vertical` 16 in `text/muted`. States as Input | as Input |
| `Tactile/Select` | `Select` `281:1023` | The Input recipe, plus `chevron` (chevron-down 20 in `text/body`, 16 from the end, `145:936`). **Open:** (derived) rest with `chevron-up`; the content is `Tactile/Select content` 4 below. Invalid and disabled as Input | as Input |
| `Tactile/Select content` | `Select content` `281:826` | `Tactile/Menu content` holding `Tactile/Menu item` `type=option` | — |
| `Tactile/Checkbox` | `Checkbox` `283:1470` | `control` 28 (`size/checkbox`), r8 (`radius/checkbox`): a Tc.well with `well-s` (`146:1099`, L446). **Unchecked:** an empty well. **Checked:** `check` 18 at inset 5 in `text/accent`, no glow (`146:1107`). **Indeterminate:** `minus` 18 `text/accent` (derived). Hover = rest; focus ring on `control`, r12 (`146:1126`). **Invalid:** rim `text/danger` (derived from Tc.invalid; no LED in a 28 control). **Disabled:** flat, no rim (`146:1130`), indicator `text/disabled`. `label` Tc.body `text/strong`, gap 16 (as the switch row `145:967`); `description` Tc.caption `text/muted` | `concave/*`, `edge/control`, `text/accent`, `size/checkbox`, `radius/checkbox` |
| `Tactile/Radio` | `Radio` `284:1828` | As Checkbox, with a 28 circle r14 (`146:1101`, L446). Checked: `indicator` becomes a 12×12 ellipse (same layer name) in `accent`, at inset 8, with no glow (`146:1112`) | as Checkbox, `accent` |
| `Tactile/Radio group` | `Radio group` `284:1885` | Nests `Tactile/Radio`; gap 20 (derived from the switch rows `145:966`) | — |
| `Tactile/Switch` | `Switch` `285:2329` | **md and sm** are both 60×34: the Tactile `size/switch/*-sm` twins alias md. **`track`:** a Tc.well with `well-s`, r17, padding 3 (`146:1068`, L425, L445). **`thumb`:** a 28 ellipse (r14). **Off:** the thumb is convex (`convex/*`, `key-s`) with an `edge/control` stroke, on the left. **On:** the thumb is `surface/accent-start → end` with `Tactile/knob-on` and no stroke, on the right; the track keeps its rim (`146:1075`, zoom render). Theme-only part `state-caption`, with theme-only boolean `stateCaption` (default true): "Off" Tc.caption `text/muted` or "On" Tc.caption `text/accent`, after `body`, gap 16 (`145:972`). Hover = rest; focus ring on `track`, r21 (`146:1086`). **Invalid:** track rim `text/danger` (derived). **Disabled:** track and thumb flat `surface/disabled`, no rim, no effect (`146:1090`). `label` Tc.body `text/strong`, gap 16 | `concave/*`, `convex/*`, `surface/accent-*`, `edge/control`, `size/switch/*` |
| `Tactile/Field` | `Field` `287:2656` | Nests `Tactile/Label` and `Tactile/Input`. Label to control 8; control to description or error 8 (`145:941`). `description` Tc.caption `text/muted` (`145:948`). `error-row`: `error-icon` circle-alert 16 + gap 8 + `error` Tc.caption `text/danger` (`145:960`). The horizontal label column has gap 16 (derived) | — |
| `Tactile/Field set` | `Field set` `287:2743` | `legend` Tc.heading `text/strong`; `description` Tc.caption `text/muted`; `group` gap 24 (fields 24 apart, L345-346); `separator` hidden: no hairlines, separate with spacing (L435-436) | — |
| `Tactile/Input group` | `Input group` `297:3861` | The `root` is the `Tactile/Input` well and rim, and only printed addons sit inside it: an icon 18 `text/muted` or Tc.caption text. A key addon never sits inside a well (nesting budget, L370-375). It moves outside at gap 8, and the well and rim shrink to the control, as in the quantity stepper (`146:1163`: 44 keys, a 48×44 `well-m` window, gap 8, L447) | as Input |
| `Tactile/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is its own 52×52 Tc.well (`well-m`, r14); the base's transparent slot does not apply. Character Tc.data-field `text/strong`; `caret` 2×20 `accent` (`146:1151`). Focus ring r18; invalid is Tc.invalid without the LED; disabled is Tc.disabled | as Input |
| `Tactile/Input OTP` | `Input OTP` `301:4490` | Group gap 8 instead of −1, with no shared fill and no corner overrides. `separator` is a printed minus 16 in `text/muted` | — |
| `Tactile/Slider` | `Slider` `303:5022` | **`track`:** 8 tall, r4 (`rounded.meter`), `concave/*` with `well-s` and **no rim** (L448; the meter `144:1800`, `146:1185`). **`range`:** a printed `text/body` fill (sampled on the render; see the conflicts). **`thumb`:** a 28 circle, convex `key-s` with an `edge/control` stroke (L448). `value-label` Tc.label `text/strong` (derived: values use the label role, L316). Hover = rest; focus ring on the thumb, a 36 circle (`146:1189`). **Disabled:** range `text/disabled`, track flat `surface/disabled`, thumb flat with no stroke or effect (`146:1192`). Keep the base part types | `concave/*`, `convex/*`, `edge/control`, `text/body` |
| `Tactile/Combobox` | `Combobox` `305:5623` | `Tactile/Input` plus `Tactile/Menu content`. Chips (multiple) are `Tactile/Badge` neutral **subtle** with `remove`: a printed tone pill, never a key, because a convex key inside a well breaks the nesting budget (L370-375). `empty` Tc.caption `text/muted` | — |
| `Tactile/Calendar day` | `Calendar day` `307:6154` | (derived) A 44 circle, label Tc.label. **none, rest:** Tc.printed, `text/strong`. **single, range-start, range-end:** Tc.pressed with `pressed-s`, `text/accent`, +1px (as the current page key `144:9586`, L397). **range-middle:** a flat `surface/well` band (one tone step, L282), radius 0, label `text/accent`. A run of sunk keys would read as seven presses. **today:** printed, with a 6px lit `led/blue` + glow under the numeral (LEDs mark the active indicator, L496). **outside:** `text/muted`. **disabled:** `text/disabled`. Hover = rest; focus ring is a 52 circle | `concave/*`, `surface/well`, `led/blue`, `text/*` |
| `Tactile/Calendar` | `Calendar` `309:8620` | (derived) The root is printed, with no fill or effect: it sits in the popover's plateau, and a second plateau would break the nesting budget. Caption Tc.label `text/strong`; weekdays Tc.caption `text/muted`; nav keys `Tactile/Icon button / sm` secondary with chevrons (as `144:9583`); month select `Tactile/Select` sm; grid gap 4 | — |
| `Tactile/Date picker` | `Date picker` `313:14889` | `Tactile/Select` trigger with a `calendar` icon-start 18; open is `Tactile/Popover` holding `Tactile/Calendar` | — |
| `Tactile/Search` | `Search` `316:16426` | md 52 and sm 44 (sm derived as Input sm), W 232 (`144:1754`). Tc.well with `well-m`, rim, r14. `icon` search 18 `text/muted` at 16, gap 12; `label` Tc.body `text/muted`; `kbd` `Tactile/Kbd` "/" (`144:1759`). Hover = rest; focus ring r18; open = the focus ring (derived) | as Input |
| `Tactile/Dropzone` | `Dropzone` `319:16832` | (derived) A large well: Tc.well with `well-l`, r18 (the large-well radius, L424) and a rim, because it receives input (L365, L430). No dashes. `icon` upload 20 `text/muted`; `label` Tc.label `text/strong`; `hint` Tc.caption `text/muted`. **active:** `Tactile/.Focus ring` (r22) and the label `text/accent`. **uploading:** `status` is a meter (8px `well-s` track with a `text/body` fill, as `144:1800`, L336) plus Tc.caption. **invalid:** Tc.invalid with the status in `text/danger`. **disabled:** Tc.disabled. Hover = rest | as Input, `well-l` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Tactile anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tactile/Location marker` | `Location marker` `337:22` | (derived) An LED, the active indicator (L496): sm 6 and md 8 circles in `led/blue` with `led-glow/blue`. The base square root becomes a full radius on the same root | `led/blue` |
| `Tactile/Breadcrumb item` | `Breadcrumb item` `338:92` | (derived; Tactile draws no breadcrumb) Everything is printed. Link Tc.body `text/muted`; current Tc.label `text/strong`; `separator` chevron-right 16 `text/muted`; ellipsis more-horizontal 18 `text/muted`. Hover = rest; focus is a pill ring | `text/*` |
| `Tactile/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Tactile/Breadcrumb item`, gap 8 | — |
| `Tactile/Page key` | `Page key` `339:270` | Round 44 keys (`144:9581`). **page:** Tc.key at `key-m`, numeral Tc.label `text/strong`; wide numerals become pills, padding 0/16 (`144:9593`). **current:** Tc.pressed with `pressed-s`, `text/accent`, +1px (`144:9586`, L397). **previous and next:** 44 round keys with chevron-left or chevron-right 18 `text/strong` (`144:9583`, `144:9595`), nesting `Tactile/Icon button / sm` secondary. The `label` text property stays bound to a hidden text layer; check it in the swap test. **ellipsis:** printed "…" Tc.body `text/muted` (`144:9592`). Hover = rest; focus is a circle ring; disabled is Tc.disabled | `convex/*`, `concave/*`, `edge/border`, `text/*` |
| `Tactile/Pager tile` | `Pager tile` `339:319` | (derived from order tiles, L450) A Tc.tile, printed at rest. `direction` Tc.caption `text/muted`; `title` Tc.label `text/strong` + chevron 18. Hover = rest; focus ring r24 | `text/*` |
| `Tactile/Pagination` | `Pagination` `339:379` | `meta` Tc.count `text/muted` (`144:9582`). Keys gap 12 (`144:9581`). Nests `Tactile/Page key` and `Tactile/Pager tile` | — |
| `Tactile/Tab / horizontal` | `Tab / horizontal` `342:402` | The status key (L449; theme-character §1.1). **default and segmented:** as `Tactile/Toggle / md`. A 48 pill, padding 0/20; at rest Tc.key, `led` `led/off`, label Tc.label `text/strong`. `count` is the exposed `Tactile/Badge` neutral plain (Tc.count `text/muted`). Selected: Tc.pressed with `pressed-m`; label and count `text/accent`; `led` lit `led/blue` + glow; +1px (`146:1045`). **line:** (derived from Nav item, L454) Tc.printed at rest; selected sinks the same way. The `marker` part stays hidden (`deco/marker` is false), and the theme-only `led` is the indicator. Hover = rest; focus is a pill ring (`146:1055`); disabled is Tc.disabled with `led/off` | `convex/*`, `concave/*`, `edge/border`, `led/*`, `text/*`, `tabs/item-pad` |
| `Tactile/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal; keys fill the 200 width, with the content start-aligned | as horizontal |
| `Tactile/Tabs list` | `Tabs list` `343:424` | No track, gap 12, padding 0 (L344, `144:9484`) | `tabs/gap`, `tabs/pad` |
| `Tactile/Tabs` | `Tabs` `343:489` | Nests `Tactile/Tabs list`; the content slot is 24 below (L343) | — |
| `Tactile/Nav item` | `Nav item` `345:601` | A 52 pill (`144:1763`, L336, L454). **Rest:** Tc.printed, padding 0/20, gap 14; `nav-icon` 20 `text/muted`; `nav-label` Tc.body `text/body`; `count` is the exposed `Tactile/Badge` neutral plain (Tc.count `text/muted`) at the end (derived for rest). **selected:** Tc.pressed with `pressed-m`; icon, label and count `text/accent`; the label becomes Tc.label (L316); the content sits as in `144:1768`. No LED is drawn (see the conflicts). Hover = rest; focus is a pill ring; disabled is printed `text/disabled`. Level 2 indents 24. Collapsed: a 52 circle with the icon only. `marker` hidden; `chevron` 18 `text/muted` | `concave/*`, `edge/border`, `text/*` |
| `Tactile/Nav group` | `Nav group` `346:611` | The group label is Tc.caption `text/muted`, sentence case, inset 20 (`144:1762`). Rows gap 6 (L336, `144:1760`). Nests `Tactile/Nav item` | — |
| `Tactile/Sidebar` | `Sidebar` `347:994` | **sidebar:** unboxed (L334-336): fill `surface/base` (the ground), no stroke, no trailing rule, no effect, W 232, sections 36 apart (`144:1745`), no padding. **floating:** (derived) the column is a Tc.plateau inset by 8. **inset:** (derived) the content area is a Tc.plateau. **icon:** a 52 column of collapsed nav items | `surface/base` |
| `Tactile/Top bar` | `Top bar` `351:1349` | (derived; Tactile has no top bar: its header is printed on the ground, L335-339) A Tc.printed row on `surface/base`, with no rule and no shadow. Height 80 (48 keys + 16 above and below), padding 0/48 (L334), gap 16 (L339). Brand: `Tactile/.Brand logo` + "Northwind" in Tc.money `text/strong` (`144:1749`). Nav: `Tactile/Nav menu item`. Then `Tactile/Search` md; a bell `Tactile/Icon button / md` secondary with an 8px lit `led/red` unread LED at 29/11 (`144:1864`); `Tactile/Theme toggle`; and a 44 `surface/tone` avatar disc with Tc.label initials (`144:1826`). **Mobile:** height 72, keys sm 44, search behind `Tactile/Sidebar toggle` | `surface/base`, `surface/tone`, `led/red` |
| `Tactile/.Brand logo` | `.Brand logo` `344:410` | The 48 `surface/tone` chip, r14, with "N" in `text/strong` (`144:1747`, L494). It is not the base red tile. Copy the type from `144:1748` | `surface/tone`, `text/strong` |
| `Tactile/Nav menu item` | `Nav menu item` `349:1036` | As Nav item level 1, without the icon: a 52 printed pill with Tc.body `text/body`. **selected and open:** Tc.pressed with `pressed-m` and `text/accent`; open is the key's on state (L366). The chevron rotates on open. Hover = rest; focus is a pill ring | as Nav item |
| `Tactile/.Nav menu link` | `.Nav menu link` `348:1108` | (derived from order tiles) A printed card, r20, padding 16. Highlighted: Tc.pressed with `pressed-m` and the title `text/accent`. Title Tc.label `text/strong`; description Tc.caption `text/muted`; focus ring r24 | as Nav item |
| `Tactile/Navigation menu` | `Navigation menu` `349:1132` | The viewport is a Tc.plateau with padding 8 (as Menu content); cards gap 8 | — |
| `Tactile/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) A 44 printed pill, Tc.body `text/body`, padding 0/16. **open:** Tc.pressed with `pressed-s` and `text/accent`. Hover = rest; focus is a pill ring; disabled `text/disabled` | as Nav item |
| `Tactile/Menubar` | `Menubar` `349:1236` | The root is Tc.printed: no fill, stroke or rule (L435); gap 8. Menus are `Tactile/Menu content` | — |
| `Tactile/Step` | `Step` `352:1355` | (derived from the activity avatars `145:1006`: a 40 tone disc with an 8px status LED at its top right, L456) `indicator`: a 40 `surface/tone` disc with the number in Tc.label `text/strong`, plus a theme-only `led` at its top right. **complete:** `check` 18 `text/success`, `led/green` lit. **current:** `led/blue` lit. **upcoming:** number `text/muted`, `led/off`. **error:** `x` 18 `text/danger`, `led/red` lit. `title` Tc.label `text/strong`; `description` Tc.caption `text/muted`. `connector`: an 8px `well-s` meter (as `144:1800`), filled `text/body` when complete and empty otherwise | `surface/tone`, `led/*`, `concave/*`, `text/*` |
| `Tactile/Stepper` | `Stepper` `352:1424` | Nests `Tactile/Step`, gap 12 | — |
| `Tactile/Sidebar toggle` | `Sidebar toggle` `344:462` | `Tactile/Icon button / sm` (44, desktop) and `/ lg` (48, mobile), both **secondary** round keys, with panel-left, menu and x. (derived: every icon-only control in the crafted frames is a round key: `144:1864`, `144:9479`, `145:880`) | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

Tactile draws no overlay; dialog anatomy is pending #2416 (L457, L561-562). Every row below derives
from Tc.plateau: one flat plateau over the ground, holding printed content and keys or wells,
never deeper.

| Style set | Base set | Tactile anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tactile/.Kbd` | `.Kbd` `370:31` | Retired; build `Tactile/Kbd` in 4.5 instead | — |
| `Tactile/Menu item` | `Menu item` `371:587` | (derived) A 44 pill (the 44 hit floor, L530), padding 0/16, gap 12, printed at rest. Label Tc.body `text/strong`; icon 18 `text/muted`. **highlighted:** sinks like the selected nav (L454): Tc.pressed with `pressed-s` (the 44 size, L397); label and icon `text/accent`. **destructive:** label and icon `text/danger`; highlighted sinks the same way but keeps `text/danger`. Indicators are printed, with no well: `check` 18 `text/accent` (checkbox, option); a 12px `accent` dot (radio, as `146:1112`); chevron-right 18 `text/muted` (submenu). `shortcut` is `Tactile/Kbd` sm. Disabled `text/disabled`; `loading` shows `Tactile/Spinner` sm | `concave/*`, `edge/border`, `accent`, `text/*` |
| `Tactile/Menu label` | `Menu label` `373:35` | Tc.caption `text/muted`, sentence case, padding 0/16 (`144:1762`) | — |
| `Tactile/Menu separator` | `Menu separator` `373:38` | No rule: the same node with no fill. Plateaus carry no hairlines (L435-436), so the base margins give the space | — |
| `Tactile/Menu group` | `Menu group` `373:248` | Nests `Tactile/Menu label` and `Tactile/Menu item` | — |
| `Tactile/Menu content` | `Menu content` `373:256` | Tc.plateau, padding 8 (derived: a list plateau), W 224 as the base. No states | `surface/base`, `edge/border`, `radius/card` |
| `Tactile/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Tactile/Button / md` secondary with chevron-down in `icon-end`. `Tactile/Menu content` sits 8 below, to clear the key's 6px shade (derived from key-m, L390) | — |
| `Tactile/Context menu` | `Context menu` `374:653` | (derived) The trigger area is a printed `surface/tone` region, r20, with no dashes (a tone step, L281, L372), and "Right-click" in Tc.caption `text/muted` | `surface/tone` |
| `Tactile/Dialog` | `Dialog` `378:743` | L457: "one plateau over the ground". `content` is a Tc.plateau with padding 32 and gap 24 (the editor plateau `145:868`). `title` Tc.heading `text/strong`; `description` Tc.body `text/body`; `close` `Tactile/Icon button / sm` secondary with x 18. Footer `Tactile/Button / md`: cancel secondary, action primary, gap 16 (`145:979`). `backdrop`: `surface/well` (derived: one tone below the ground, L282, so the plateau reads above a lowered page; Tactile documents no translucent scrim) | `surface/base`, `surface/well`, `edge/border` |
| `Tactile/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a 40 `surface/tone` disc (as `145:1006`) with a 20 glyph in `text/danger` (destructive) or `text/body` (default). Footer: cancel secondary, then action primary (default) or destructive (the danger-ink key) | `surface/tone`, `text/danger` |
| `Tactile/Sheet` | `Sheet` `379:1004` | A Tc.plateau: r24 on the exposed corners, the `edge/border` stroke on the inner edge only (as the base), padding 32, `Tactile/plateau`. Header and footer rules hidden. `handle`: a 36×8 `well-s` pill (derived from the meter `144:1800`) | `surface/base`, `edge/border`, `concave/*` |
| `Tactile/Drawer` | `Drawer` `379:1150` | As Sheet. Footer `Tactile/Button / md`, stacked full width, gap 12 | — |
| `Tactile/Popover` | `Popover` `381:937` | A Tc.plateau with padding 28 (as the notice plateau `145:988`), W 288. `title` Tc.label `text/strong`; `description` Tc.caption `text/muted`; `close` `Tactile/Icon button / sm`. `arrow`: a 16×8 tip in `surface/base`, with `edge/border` on its two outer edges and no effect (derived) | `surface/base`, `edge/border` |
| `Tactile/Tooltip` | `Tooltip` `381:1030` | (derived: the plateau is the only raised non-pressable height, L363) A small Tc.plateau: `radius/card` renders it as a pill; padding 8/12. `label` Tc.caption `text/strong`; `arrow` 10×5 `surface/base` with no stroke; `kbd` `Tactile/Kbd` inverse. It is not the base inverse chip, which the dark rule forbids (L486-487) | `surface/base`, `edge/border` |
| `Tactile/Hover card` | `Hover card` `381:1093` | A Tc.plateau, W 320, padding 28. The avatar is `Tactile/Avatar` md, a 44 `surface/tone` disc with initials (`144:1826`). `title` Tc.label `text/strong`; `description` and `meta` Tc.caption `text/muted`; calendar 16 | `surface/tone` |
| `Tactile/Command item` | `Command item` `382:1015` | (derived from order tiles, L450) A printed row, r20, padding 0/16. **selected:** Tc.pressed with `pressed-m`, `item-label` `text/accent`; a theme-only `led-edge` (the 4×32 `led/blue` bar with glow, `144:9541`) replaces the base 2px marker stroke; and `corner-down-left` 18 `text/accent`. `kind` is a printed 24 `surface/tone` pill with Tc.caption `text/body`. `url` Tc.data `text/muted`; `excerpt` Tc.caption `text/muted`, with matches in T.strong-sm `text/strong`; `hash` 16 `text/muted`; `shortcut` `Tactile/Kbd` sm. Disabled `text/disabled` | `concave/*`, `led/blue`, `surface/tone`, `text/*` |
| `Tactile/Command palette` | `Command palette` `383:1355` | The Dialog recipe at W 640. `input-row`: a `Tactile/Input` md well (search icon 18, Tc.body) with `Tactile/Kbd` "Esc", and no divider. `filters`: the `Tactile/Toggle group` key bank at sm. Results: `Tactile/Command item`, gap 8. Footer: printed Tc.caption `text/muted`, with no fill and no rule. Loading `Tactile/Spinner` md; empty Tc.body `text/muted` | — |

### 4.5 Data display 1 (page `Components · Data display`, `229:344`)

Tactile shows data as instruments on one material:
- order tiles instead of a table;
- concave KPI readouts with ink bar meters;
- an LED plus a word for every status;
- printed tone discs for people.

Cards are plateaus. Tactile avoids dense tables and many-column lists (L481-484), so the Table
stays a list of tiles at every breakpoint.

**Theme-only, not built here.** The refund gauge has no base set (component-spec §4.7), and neither
does the range dial (`144:1838`, L453). Do not build either as a Data display set, and never draw a
gauge inside a Stat card.
- **Refund gauge** (`144:9429`, L452): a 112 `well-l` bezel with 24 radial LED segments, 17 of them
  lit `led/blue`, plus printed lens rings and the value.

| Style set | Base set | Tactile anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Tactile/Kbd` | `Kbd` `403:28` | A printed key hint with no box, fill or stroke: Tc.caption `text/muted` in Nunito Sans (the search "/" `144:1759`; Geist Mono is only for IDs and codes, L321-322). md and sm are both 13 (the 13px floor, L325), on H `size/kbd` or `size/kbd-sm`, with min width = H. **inverse** is identical to default (derived). Tactile has no inverse surface, and a keycap would raise a non-pressable element to key height (L374-375) | `text/muted`, `type/caption/*`, `size/kbd*` |
| `Tactile/Kbd group` | `Kbd group` `403:96` | Exposed `Tactile/Kbd` instances joined by "+" in Tc.caption `text/muted`, gap 4 | — |
| `Tactile/Badge` | `Badge` `405:180` | A badge is a status, which is always an LED plus a word (L294-296, L496; the tile status `144:9510`, the status lights `146:1201`). **`dot`** is a 9px Tc.led. **`label`** is Tc.body `text/strong`, gap 10. **Tone to LED:** neutral `led/grey` with no glow (there is no grey glow role, L544; the Refunded LED `144:9564` samples `#9aa3b8` / `#6b7387`); info `led/blue`; success `led/green`; warning `led/amber`; destructive `led/red`. Lit tones take `led-glow/<tone>`. **outline** (Tactile's primary style): printed, with no container and padding 0, as the crafted status column. **subtle:** (derived) the same on a printed `surface/tone` pill, 28 tall, padding 0/12 (printed chips, L281). **solid:** (derived) subtle with the word in the tone ink: `text/success`, `text/warning`, `text/danger`. Info and neutral keep `text/strong`, because accent ink is reserved for pressed, selected and on (L290-293). **plain:** no container, padding 0, label Tc.count `text/muted` (the counts `144:9492`, `144:1774`); a selected parent overrides it to `text/accent`. No style uses a tinted fill or an outline. `iconStart` 16 in the label ink; `remove` is an `x` 16 in `text/muted` (derived). The dot radius follows `radius/avatar` (999) | `led/*`, `surface/tone`, `text/*`, `radius/avatar` |
| `Tactile/Badge / kind` | `Badge / kind` `405:211` | (derived; Tactile draws no code kinds) A printed `surface/tone` pill, 28 tall, padding 0/12, with the kind word in Tc.data `text/body`: code terms take Geist Mono (L321-322). The kinds differ by word only: binding `code/syntax/*` would break exception 1. A kind is not a status, so `dot` is an unlit `led/off` LED with no glow | `surface/tone`, `led/off`, `text/body` |
| `Tactile/Avatar` | `Avatar` `406:95` | A printed `surface/tone` disc: H0, no effect, no ring (`145:1006`, `144:9503`; L494). Sizes sm 40, md 44, lg 48 (`size/avatar/*`); radius `radius/avatar` (999). **initials:** `text/strong`, sized as the crafted discs: sm 14 (`145:1007`), md 15 (`144:9504`), lg Tc.label 16 (derived). **image:** the `image` part, clipped to the disc. The Tactile designs use no photos (L494-495), so the specimens show initials. **fallback:** `user` 20 in `text/muted` (derived). **agent:** (derived from the "Shipping bot" disc `145:1022`) the tone disc with `bot` 20 in `text/strong`, not an accent disc, because blue is reserved (L290-293). `presence` nests `Tactile/Avatar presence` at the disc's top right (31/1 on the 40 disc) | `surface/tone`, `text/strong`, `size/avatar/*`, `radius/avatar` |
| `Tactile/Avatar presence` | `Avatar presence` `406:43` | An 8px LED with **no ring**: the crafted LED sits on the disc's edge with nothing around it (`145:1008`, L456, L496). **online:** `led/green` with `led-glow/green`. **away:** `led/amber` with its glow. **offline:** `led/off`, no glow (derived: unlit, L294-295) | `led/*` |
| `Tactile/Avatar group` | `Avatar group` `406:150` | `Tactile/Avatar` discs overlapping by −8. Each has a 2px OUTSIDE ring in `surface/base` (the ground), so the discs read as printed cut-outs (derived; the base ring is `surface/card`). The count disc is a tone disc with "+N" in Tc.count `text/muted` | `surface/base`, `surface/tone` |
| `Tactile/Item` | `Item` `408:792` | Rows printed inside a plateau, as the crafted line items (`145:886`) and activity rows (`145:1005`). **default:** Tc.printed, with no fill, rule or padding (L435-436, L469-470). **Sizes:** default has a 48 `.Item icon tile` and gap 16; sm has a 40 `Tactile/Avatar` and gap 14; xs (derived) is as sm with the title in Tc.body. `title` Tc.label `text/strong`; `description` Tc.body `text/body` (`145:1011`). **outline:** (derived) a printed tile, r20, padding 16, with a 1px `edge/border` stroke: the in-hue border is Tactile's only outline (L428). **muted:** (derived) a printed `surface/tone` tile, r20, padding 16 (one tone step, L372). `actions` nests `Tactile/Button / sm` secondary. Keys in a printed row inside a plateau stay within the nesting budget, as the quantity stepper `145:895` does. `chevron` 18 `text/muted`; `header` and `footer` Tc.caption `text/muted`. Hover = rest; focus ring r24 | `surface/tone`, `edge/border`, `text/*` |
| `Tactile/Item group` | `Item group` `408:996` | Exposed `Tactile/Item` rows with `Tactile/Avatar` media. Rows are gap 20 (line items `145:885`); the activity rows `145:999` use 22. **separators=true:** no rules; the separator nodes stay, with no fill (no hairlines, L435-436, L450) | — |
| `Tactile/.Item icon tile` | `.Item icon tile` `408:82` | The printed thumbnail chip `145:887`: 48, `surface/tone`, r14 (L494), glyph 22 in `text/body` (sampled). The base tile is 32 | `surface/tone`, `text/body` |
| `Tactile/.Item image` | `.Item image` `408:85` | (derived) A 48 chip, r14, that clips the image (the thumbnail geometry of `145:887`). The crafted designs show no photos (L494-495) | — |
| `Tactile/Card` | `Card` `409:951` | **default** is a Tc.plateau (L363, L372-375; component-spec D3). **Fill:** `surface/base`. `card/bg` resolves to the same `#e0e5ec` / `#2a2d32` (theme-character §2.4), but exception 1 keeps the language role, so card and ground stay one material (L277-279). **Edge:** a 1px `edge/border` on all sides; bind the widths to `card/border-top`, `-side` and `-bottom` (all 1 under Tactile). **Shape:** `radius/card` 24; `Tactile/plateau` replaces R.card-shadow. **Padding:** md 32 (`145:868`, `144:9468`) or sm 28 (`145:988`), plus the 1px border in layout; gap 24 (L343). **Text:** `title` Tc.heading `text/strong` (`145:1001`); `description` Tc.caption `text/muted` (`144:9472`); `eyebrow` Tc.caption `text/muted`, sentence case. `action` nests `Tactile/Button / sm` link ("View all", `145:1002`). **footer:** printed, with no fill and no rule (L435-436): meta in Tc.caption `text/muted` (`145:980`) and `Tactile/Button / md` keys, gap 16 (`145:979`). **States:** a plateau is never pressable and never sinks (L372-375). Hover = rest; focus is `Tactile/.Focus ring` r28; **selected** (derived) is rest plus the title in `text/accent` and a theme-only `led-edge`, the 4×32 `led/blue` bar with glow of the selected tile (`144:9541`). **rule:** (derived) a printed region on the ground, with no fill, stroke, rule, radius or effect: spacing separates it (L372, L435-436). Its states follow default | `surface/base`, `edge/border`, `led/blue`, `text/*`, `radius/card`, `card/border-*` widths |
| `Tactile/Stat card` | `Stat card` `409:1270` | The KPI column (`144:9334`, L451). **Label row:** `label` in `text/body` in the 15/20 box (read the style from `144:9336`; there is no type role, as for Tc.field-label), with `icon` 18 `text/muted` at the end (`144:9337`). **Readout:** a theme-only absolute `readout` layer, 14 below the label: 197×116, r18, `concave/*` with `well-l` and no rim (`144:9342`; the readout's centre samples `#d7dde6`). It sits behind `value` and the meter; keep those at the base layer paths. **Value:** Tc.kpi (`font/kpi` + `type/kpi/*`: 32/38 Light, `tnum`) in `text/strong`, at 18/16 inside the readout (L88-94, L312). **Meter:** a theme-only `bar-meter`, with theme-only boolean `meter` (default true). It is 122×24 at 18/76 inside the readout: 14 bars 5 wide, r2.5, gap 4, all `text/muted` at 100%, trend shown by height only (`144:9344`, L451, L479-480). The base `deco/*` parts stay hidden (`deco/*` is false under Tactile). **Delta:** 14 below the readout: an arrow 15 plus the value in Tc.count, `text/success` (up) or `text/danger` (down), then "vs last 30 days" in Tc.caption `text/muted`, gap 6 (`144:9359`). Not Fragment Mono. Delta none is the caption only (`144:9466`). **No container:** no border (`kpi/border-*` 0), no `kpi/bg-*` twin (exception 1). Padding 18 is a literal (crafted), not `kpi/pad-x` (20). **default:** the column printed on its parent plateau; columns 197 wide and `kpi/gap` 24 apart (L340-342). **hero:** (derived; Tactile has no hero and no inverse slab, L486-487) the same column wrapped in its own Tc.plateau with padding 28, as the KPI group plateau `144:9333` around one readout. `badge` nests `Tactile/Badge` outline | `concave/*`, `text/*`, `type/kpi/*`, `kpi/gap` |
| `Tactile/Table header cell` | `Table header cell` `410:546` | (derived; Tactile lists orders as tiles and draws no header row, L450, L481-484) A printed caption: Tc.caption `text/muted`, sentence case, never uppercase or mono (L321, L485); no fill and no rule (`table/head-rule-width` 0). Sorted: `text/strong` with `arrow-up` or `arrow-down` 16 in `text/strong`. Sortable at rest: `arrow-up-down` 16 in `text/muted`. Height 44 (the 44 floor, L530). Hover = rest; focus is a pill ring | `text/*` |
| `Tactile/Table cell` | `Table cell` `410:383` | The tile's columns (`144:9502`). No column rule (`table/cell-rule-width` 0); padding 24 at the row ends, columns 16 apart; row height 72. **text:** Tc.body `text/strong` (the status word). **strong:** Tc.label `text/strong` (the name). **mono:** Tc.data `text/muted` (the order ID `144:9508`). **number:** Nunito Sans SemiBold 18/24 `text/strong` (the money role, L315), end-aligned (`144:9514`). **muted:** Tc.caption `text/muted`. **badge:** `Tactile/Badge` outline (`144:9510`). **avatar:** `Tactile/Avatar` md with the name in Tc.label; `secondary` is the ID in Tc.data plus the meta in Tc.caption, both `text/muted`, gap 6 (`144:9505`). **actions:** `Tactile/Icon button / sm` secondary with more-horizontal (derived from the round editor-menu key `145:880`). **select:** `Tactile/Checkbox` | `text/*`, `table/cell-rule-width` |
| `Tactile/Table row` | `Table row` `412:1187` | An order tile (L450, `144:9502`; component-spec D4): 72 tall, `table/row-radius` 20, no rule (`table/row-rule-width` 0), printed at rest with no fill. **selected:** Tc.pressed with `pressed-m`; name and ID turn `text/accent`, while the status word, meta and amount keep their ink (`144:9528`, sampled). The base 2px `selection-bar` part becomes the 4×32 r2 `led/blue` LED edge with `led-glow/blue`, 8 from the start and vertically centred, under the same layer name (`144:9541`). The select cell shows `Tactile/Checkbox` checked. Content sits as in `144:9528` (+2 x, +0.5 y). **hover:** rest (derived). **focus:** `Tactile/.Focus ring` r24. **disabled:** printed, every ink `text/disabled`, LEDs `led/off` (a printed row has no face to flatten). **zebra:** (derived; Tactile draws no zebra) a printed `surface/tone` fill (one tone step, L372). **stacked:** (derived) the same tile, taller, padding 16/24, data labels in Tc.caption `text/muted`, sentence case. Strokes stay excluded from layout, as in the base | `concave/*`, `edge/border`, `led/blue`, `surface/tone`, `text/*`, `table/row-radius` |
| `Tactile/Table` | `Table` `413:1367` | Printed inside its container's plateau; the root has no fill. `head` is printed, with no fill or rule (`table/head-rule-width` 0); select-all is `Tactile/Checkbox`. Rows are `Tactile/Table row`, `table/row-gap` 12 apart (L344; six tiles in the Orders fixture). `caption` Tc.caption `text/muted` (`144:9472`); `summary` Tc.count `text/muted` (`144:9582`). **empty:** (derived) Tc.body `text/muted`, centred, printed. **loading:** (derived) printed `surface/tone` tiles, 72 tall, r20, gap 12, with no effect. **stacked:** stacked rows | `table/row-gap`, `surface/tone`, `text/muted` |
| `Tactile/Data table` | `Data table` `416:4605` | The Orders plateau (`144:9468`, L343-344): `Tactile/Card` default md (padding 32) with the title "Recent orders". **Toolbar:** a filter `Tactile/Search` well, 240×52 (`144:9473`), and a filter `Tactile/Icon button / md` (`144:9479`). Status and date are `Tactile/Select`; Table and Board are a `Tactile/Toggle group` key bank (`144:9484`); Columns and Export are `Tactile/Button / md` secondary. **Body:** the toolbar, the table and the footer are 24 apart (L343). **selection:** `Tactile/Action bar` inline (printed) above the table. **columns:** `Tactile/Menu content` with checkbox rows. **loading and empty:** as Table. **Footer:** `Tactile/Pagination` (`144:9581`). **mobile:** (derived) stacked rows, with keys and wells at sm 44 | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from the `tactile/*` roles. Light and Dark each resolve their own
  designed values (L297-301), so no set carries a per-scheme fill.
- **Effects:** the named `Tactile/*` effect styles. Their colours follow the scheme through
  `tactile/shadow/*`, `tactile/inset/*` and `tactile/glow/*`.
- **Text:** after the shared step, `type/*` and `font/*` already carry Tactile's scale.
  - Body and strong are 16/22.
  - Small and caption are 13/18.
  - Heading is 20/28.
  - `font/data` is Geist Mono.
  
  Only the three literal roles in section 2 are drawn by hand.
- **Sizes:**
  - `size/checkbox` 28;
  - `size/switch/*` 60/34/28;
  - `size/icon/*` 14/18/20;
  - `radius/control` 999, `radius/input` 14, `radius/card` 24 and `radius/checkbox` 8;
  - `tabs/gap` 12 and `tabs/item-pad` 20;
  - `focus/*` 2/2.
  
  Heights are literals: Density is not bound.

## 6. Verification strips

For each category, build a frame `Tactile style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Tactile):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Tactile: the "before" |
| Style | The same instances swapped to the `Tactile/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Tactile/*`. Every override survives |
| States | One of each state for the category's interactive sets |

Give each strip row a `surface/base` background, padding 48: the plateau shadow throws ±18 with
blur 44, so it needs room, and a tight frame clips it.

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary and secondary in pressed, focus and disabled;
  - Icon button md and sm, rest and pressed;
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
  - Badge: every tone in outline (Tactile's primary style: LED + word), plus plain;
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- one blue-grey material; no white or black surface;
- keys are convex pills and circles, lit from the top left, with no visible gradient band;
- pressed, selected and current items sink: concave, blue ink, content 1px down-right. Selected
  status keys and tabs also light a blue LED;
- one blue primary per group, with a glow; disabled keys are flat, with no shadow or border;
- wells are 52 r14 and concave, with a slate rim above the inset;
- the switch is 60×34, with a raised grey knob (off) or a glowing blue knob (on) and an "On"
  caption in blue;
- focus is a 2px blue ring at a 2px gap, and the focused control keeps its height;
- overlays are flat plateaus with the ±18/44 pair and an in-hue edge, and nothing nests deeper
  than a key or a well;
- dark keeps the mid-dark material `#2a2d32` with the `#34383e` highlight and the same blue keys
  with white text. A white outer shadow, pale slab or pale primary is a defect (L486-487).

**Expected for Data display 1:**

- **Table.** The table is a list of separate tiles:
  - 72 tall, r20, 12 apart;
  - no rules, no header fill, no column lines.
  
  The selected tile sinks: its name and ID turn blue, and a 4×32 blue LED edge lights at its start.
- **Badges.** An LED and a word with no container: a dot, never an outlined chip. Green, amber, blue
  and red LEDs glow; grey and unlit ones do not. Subtle and solid sit on a printed tone pill.
- **Avatars.** Printed tone discs with dark initials, and a status LED at the top right with no
  ring. The agent disc is a tone disc, not a blue one.
- **Cards.** Flat plateaus with the ±18/44 pair and an in-hue edge. The footer has no fill and no
  rule. Rule cards are printed, with no line.
- **Stat cards.** Concave 197×116 readouts with a 32 Light numeral and 14 muted ink bars, the delta
  below in success or danger ink. Hero wraps the column in its own plateau.
- **Kbd.** Printed glyphs, never keycaps.
- **Dark.** The readouts run `#1b1d20 → #2b2f34`; LEDs use the dark set; no white outer shadow.

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist: 23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays (the retired `.Kbd` is not built) and 18 Data
  display 1. There are no `Tactile/Icon/*` glyph copies:
  Tactile reuses the base Lucide glyphs. Each set has the base variant count, property names and
  part names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable, effect style, crafted frame or other
  page was edited, and the ledger `style-ledger/tactile.json` lists every set id.
