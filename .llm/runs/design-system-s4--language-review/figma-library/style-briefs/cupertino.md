# Cupertino style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G2, Cupertino + Liquid. Each theme has its own brief; this file is all the
  Cupertino builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Cupertino` (`29:6`).
- **Modes for every Cupertino style set and strip:** Theme set **B** (`239:8`) and Theme B
  **Cupertino** (`239:1`). Density Comfortable (DESIGN L335, L466). Scheme Light (`3:0`) to build;
  check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme B Cupertino `frame/inset`
  = 16.
- **Same builder as Liquid.** Build Cupertino first, then Liquid. Section 1 lists what Cupertino
  must never take from Liquid.

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
   - `Cupertino/Button / md`;
   - private helpers keep their dot: `Cupertino/.Focus ring`.
   
   **Existing kits.** If a kit set on this page would collide with a new name, rename the kit set
   to `Cupertino/Specimen kit/<name>`. Do not move it or touch its instances: node ids stay, so the
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
7. **Composites.** Composites nest this theme's own style sets (`Cupertino/Field` nests
   `Cupertino/Label` and `Cupertino/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/cupertino.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/cupertino/<category>.png`. A category is
   done when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** An Apple-inspired classic: a translucent floating sidebar, a large-title header with
capsule buttons, inset grouped lists and full-row system-blue selection, on opaque slate content
cards over a soft aurora. Only the sidebar and the header capsules are translucent; every content
surface is opaque `card` with a 1px rim (L242-256).

**A Cupertino strip must read at thumbnail size as:**

- blue prominent capsules beside pale glass capsules with a white rim and a soft shadow;
- inset grouped lists: 12px uppercase captions over r12 groups of 44px rows, inset hairlines,
  muted values and chevrons;
- full-row system-blue selection where every glyph inverts;
- a grey segmented track with a raised white thumb;
- 20px selection circles, never square boxes;
- green 51×31 switches with a 27px knob (a dark knob in Dark);
- grey field wells with a 1px `muted-fg` boundary;
- opaque cards, menus and dialogs with no blur.

**Keep it apart from Liquid** (Liquid DESIGN L440; this file L274-278, L401-403):

- no gradient or specular rims, no inner highlight, no inner glow and no float glass;
- `GLASS` appears only where the crafted frames carry it: the sidebar and the capsules
  (§3 C.vibrancy, C.glass, C.prominent). Menus, popovers, dialogs, sheets and the action bar stay
  opaque;
- no 52px toolbar band, no control-glass groups, no detached sheet and no floating selection bar;
- list selection is full-row `primary` `#0d74ce` / `#0090ff`, and nav selection is grey
  `material/track`;
- checkbox and radio are selection circles; the switch is 51×31.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Orders, Light / Dark | `30:22` / `32:169` | Everything below. **Measure here first** |
| Header | `30:118`: large title `30:119`, capsules `30:122` (Filter, Export, New Order) | Top bar, Button, Icon button |
| Controls row | `30:146`: segmented `30:147`, header search `30:157` | Toggle group, Tabs, Search |
| Sidebar | `30:27`: window controls `30:28`, brand `30:32`, sidebar search `30:39`, items `30:46`–`30:85`, section titles `30:45` / `30:97`, channel rows `30:98`, profile `30:111` | Sidebar, Nav item, Nav group, traffic lights, `.Brand logo` |
| Orders list, selected row | `30:218`, `30:288` | C.selected, selection circles, avatars |
| Order form | `31:126`: header `31:127`, caption `31:130`, groups `31:132` / `31:147` / `31:166`, invalid row `78:820`, actions `31:179` | C.group, C.error-row, Field, Field set, Switch, Dialog |
| Notice | `31:191`: icon tile `31:192`, Plain button `31:200` | Alert dialog media, Plain kind |
| Preference frames | Reduce Transparency `81:1388`, Increase Contrast `81:1850` | Reference only. Capsules become `surface/raised`, rims become `border/strong` (L358-360). Do not build them as variants |
| Kits | `Glass/Button` `29:22`, `Glass/Segment` `29:27`, `Glass/Search field` `29:33`, `Glass/Toggle` `29:38`, `Glass/Selection circle` `29:43`, `Glass/Sidebar item` `29:58`, `Glass/Status` `29:74`, `Glass/Grouped row` `29:99` | Geometry and effect stacks to copy. **Rename all eight to `Cupertino/Specimen kit/<name>`** (for example `Cupertino/Specimen kit/Button`) before creating any set: `Glass/*` collides in spirit with Liquid, which shares the Glass seed, and component-spec §0.1 already asks for the `Glass/Button` rename |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/cupertino--light.png`, `cupertino--dark.png` | Offline reference |

**DESIGN.md vs crafted frames** (follow the crafted frames; report, do not resolve):

- Nav icons render in `primary` `#0d74ce` / `#0090ff` (`30:46`), while L387 and L422 say
  `primary-text`, and the accent policy (L287-290) does not list nav icons. Bind `primary/default`
  as the frames do.
- The error row's value `AUTUMN24` renders in `muted-fg` and the alert glyph in `destructive`
  (`78:820`), while L385 says "label and value in `destructive-text`". Follow C.error-row.
- L298-299 describe a white tick on a checked circle in Dark. No core role is white in Dark
  (`primary/fg` is `#111113`), and `cupertino/*` is forbidden. Bind `primary/fg`, follow the kit
  `29:40` if it differs, and report it.
- DESIGN says "don't ship lensing" (L401-403), but the frames carry `GLASS` on the sidebar and the
  capsules (L274-278 acknowledges this). The style follows the frames; the CSS comparison is
  pending in #2419.

## 2. Tokens the style relies on

**Fonts** (load all): Inter Regular, Medium, Semi Bold and Bold. Also load Geist Mono Regular and
Medium, only because hidden base parts keep text nodes bound to `font/mono`. Cupertino uses one
family (L305-306): never show mono text.

**Language roles.** Cupertino's own roles are the core `material/*` and `switch/thumb`, which
resolve to Cupertino under Theme B Cupertino. **Never bind `cupertino/*`**: the current design
binds none of its 27 roles, and binding only some is forbidden (L417, L469, L478-479; map: 304 of
304 paints bind core roles).

| Use | Bind | Cupertino value (Light / Dark) |
| --- | --- | --- |
| Prominent fill, selected row, checked circle, brand and profile discs | `primary/default` | `#0d74ce` / `#0090ff` |
| Prominent hover | `primary/hover` | `#0d6fc6` / `#3b9eff` |
| Ink on primary | `primary/fg` | `#ffffff` / `#111113` |
| Plain buttons and links | `primary/text` | `#113264` / `#70b8ff` |
| Glass capsule, sidebar, header search | `material/fill` | `#ffffff94` / `#1f21298c` |
| Grouped group, segment thumb | `material/fill-strong` (= `tabs/sel-bg`) | `#ffffffd1` / `#2b2e36c7` |
| Rim on glass and content | `material/stroke` (= `card/border`, `kpi/border`) | `#ffffffb8` / `#ffffff21` |
| Segmented track, field well, nav selection, avatars | `material/track` (= `tabs/track`, `nav/active`) | `#7575801f` / `#7575803d` |
| Content, menus, dialogs, sheets | `surface/card` | `#f9f9fb` / `#18191b` |
| Reduce Transparency capsule (reference) | `surface/raised` | `#ffffffd1` / `#2b2e36c7` |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` |
| Text | `text/fg`, `text/muted` | `#1c2024` / `#edeef0`; `#60646c` / `#b0b4ba` |
| Editable boundary (fields, search) | `text/muted` (theme-character §5, L406) | as above |
| Unchecked circle ring, off-switch track | `border/input` | `#80838d` / `#777b84` |
| Outline capsule rim, Increase Contrast rim | `border/strong` | `#b9bbc6` / `#5a6169` |
| Grouped and table separators | `border/subtle` | `#e8e8ec` / `#272a2d` |
| Switch on | `success/default` | `#46a758` |
| Switch knob | `switch/thumb` (never `primary/fg`, L380, L413-414) | `#ffffff` / `#111113` |
| Focus | `border/ring` | `#0d74ce` / `#0090ff` |
| Capsule, thumb and knob shadows | `effect/control-shadow` | `#0d0f1f1f` / `#00000073` |
| Sidebar and overlay shadows | `effect/shadow-overlay` | `#0d0f1f1f` / `#00000073` |
| Error label and helper; alert glyph | `destructive/text`; `destructive/default` | `#641723` / `#ff9592`; `#e5484d` |
| Traffic lights | `destructive/default`, `warning/default`, `success/default` (as `30:28`) | `#e5484d`, `#ffc53d`, `#46a758` |
| Range and drop tint | `surface/selected` | `#e6f4fe` / `#0d2847` |
| Radius | `radius/control` 999 (capsules, switch, circles, avatars); `radius/input` 10 (search, fields); `radius/card` 22 (notice, popover); `tabs/radius` and `nav/radius` 9; `tabs/item-radius` 7; literal 12 (groups, rows), 24 and 26 (containers, pending #2414) | — |
| Effects (literal; `GLASS` cannot bind) | Sidebar `GLASS` radius 18, refraction 0.50, depth 16, dispersion 0.20. Capsules `GLASS` radius 10 (prominent 4), refraction 0.55, depth 14, dispersion 0.25 (map; L353-357) | Copy from the kits and `30:27` |

**Text roles:**

| Role | Recipe |
| --- | --- |
| C.large-title | T.title: `font/heading` (Inter) + `type/title/*` (34/40 Bold −0.9) |
| C.heading | T.heading (17/22 Semi Bold −0.3): card and dialog titles, "Order SO-10480" |
| C.body / C.strong | T.body (14/20 −0.1) / T.strong (14/20 Medium) |
| C.small / C.caption | T.small (13/18 −0.05) / T.caption (12/16) |
| C.button | `font/sans` + `type/body/size` and `/line` (14/20) + literal Semi Bold, tracking 0 (L111, L312) |
| C.segment | `type/small/size` and `/line` (13/18), `type/strong/style` (Medium) at rest, literal Semi Bold when selected, tracking 0 (L112, L312-313) |
| C.section | T.label (12/16 Medium) + text case UPPER, `text/muted`: grouped-list captions (L247, L313) |
| C.sidebar-title | `type/label/size` and `/line` + literal Semi Bold, title case, `text/muted` (L313-314) |
| C.data | `font/data` (Inter) + `type/body/*` (14/20). Tabular figures are pending in #2414 |
| No mono | Where the base binds T.mono (kbd, shortcuts, breadcrumb, URLs), bind C.small instead |

## 3. Cupertino recipes (referenced by the component rows)

- **C.capsule.** Full pill (`radius/control`), height `space/control/height` (36 at Comfortable,
  L156), padding 0/16/0/14 (L157), gap 6, 16px icon, label C.button (L376). Copy geometry from
  `Cupertino/Specimen kit/Button` (`29:22`).
- **C.prominent.** C.capsule filled `primary/default`; label and icon `primary/fg`. Effect: the
  kit's `GLASS` (radius 4, refraction 0.55, depth 14, dispersion 0.25). No rim, no shadow
  (`29:7`; L357).
- **C.glass.** C.capsule filled `material/fill`, 1px INSIDE `material/stroke`, label and icon
  `text/fg`. Effects in order: `GLASS` (radius 10, refraction 0.55, depth 14, dispersion 0.25), then
  DROP_SHADOW 0 4 14 in `effect/control-shadow` (L349). Copy the stack from `29:12` and rebind its
  colours.
  - The web theme proposes blur 10 without refraction; that approximation stays pending in #2419.
    The Figma style follows the crafted frames.
- **C.plain.** No fill, rim or effect; label and icon `primary/text` (L174, L289-290, L376;
  `31:200`).
- **C.vibrancy** (sidebar only). Fill `material/fill`, 1px INSIDE `material/stroke`, radius 26
  (literal). Effects: `GLASS` radius 18, refraction 0.50, depth 16, dispersion 0.20, then
  DROP_SHADOW 0 / `shadow/overlay/y` (10) / `shadow/overlay/blur` (28) in `effect/shadow-overlay`
  (L349, L353). Copy from `30:27`.
- **C.content.** Opaque `surface/card`, 1px INSIDE `material/stroke` rim, no shadow, no blur
  (L255-256, L348). Radius 22 (`radius/card`), 24 or 26 (literal; L364-365).
- **C.float.** (derived) A floating overlay: C.content plus DROP_SHADOW 0 / `shadow/overlay/y` /
  `shadow/overlay/blur` (0 10 28) in `effect/shadow-overlay`. Opaque, never blurred, never `GLASS`:
  the dialog is "an opaque `card` panel … never a glass sheet" (L389), and only the sidebar and the
  capsules are translucent (L254-256). It replaces the base R.float (`surface/raised`,
  `border/default`).
- **C.group: inset grouped list** (L247-249, L384; `31:126`, kit `29:99`).
  - **Caption:** C.section, 16px leading inset, in a 24-tall frame with the text at y8, so the
    group starts 8 below it (`31:130`).
  - **Group:** radius 12 (literal), fill `material/fill-strong`. On a floating surface, stack two
    fills, `surface/card` under `material/fill-strong`: it renders the same composite as on the
    form card and stays opaque.
  - **Rows:** 44 tall (`space/control/height-lg`), 16 leading inset, gap 8. Label C.body `text/fg`
    on the left; value C.body `text/muted` on the right; trailing 14px `chevron-right` in
    `text/muted` (L421).
  - **Separators:** 1px `border/subtle`, inset 16 from the leading edge, none under the last row
    (L368).
- **C.error-row** (`78:820`). The row grows from 44 to 72.
  - Label `destructive/text`.
  - Value `text/muted` (as the frame; see the conflicts in §1).
  - Trailing 16px `alert-circle` in `destructive/default`.
  - Helper C.caption (12/16) in `destructive/text`, full width under the value (L385, L411).
- **C.selected: full-row selection** (L250-253, L300; `30:288`; theme-character §2.1).
  - Fill `primary/default`; every glyph on it turns `primary/fg`: labels, values, icons, chevrons
    and status dots.
  - A selection circle inside inverts to a `primary/fg` disc with a `primary/default` tick.
  - An avatar inside becomes a `primary/fg` disc with `primary/default` initials (L379, L424).
  - Draw it in the style set; never route it through `surface/selected`.
- **C.segmented** (L181-193, L378; `30:147`, kit `29:27`).
  - **Track:** `tabs/track`, radius `tabs/radius` (9), padding `tabs/pad` (2), gap `tabs/gap` (0),
    height 32.
  - **Segments:** 28 tall, radius `tabs/item-radius` (7), label C.segment `text/fg`. Padding-x as
    the kit `29:23` (about 14; `tabs/item-pad` is 12, so draw it literally if they differ).
  - **Selected thumb:** `tabs/sel-bg` (= `material/fill-strong`), no stroke, two DROP_SHADOWs 0 1 3
    and 0 3 8 in `effect/control-shadow` (L350).
- **C.circle: selection circle** (L379, L408; kit `29:43`).
  - 20 (`size/checkbox`), `radius/checkbox` (999).
  - **Unchecked:** no fill, 1.5px INSIDE `border/input` ring.
  - **Checked:** `primary/default` disc with a `check` tick in `primary/fg`. Copy the tick from
    `29:40`.
  - **Inverted** (inside C.selected): `primary/fg` disc with a `primary/default` tick.
- **C.switch** (L218-229, L351, L380; kit `29:38`).
  - Track 51×31 (`size/switch/width` and `/height`), full pill, padding 2.
  - Knob 27 (`size/switch/thumb`) in `switch/thumb`, with DROP_SHADOWs 0 3 8 and 0 1 1 in
    `effect/control-shadow`.
  - On: track `success/default`. Off: track `border/input`.
  - Dark keeps the `#111113` knob. A white knob in Dark would be a design change (map).
- **C.field** (L147, L377, L406; kit `29:33`).
  - 32 tall, radius `radius/input` (10), padding 0/10, 15px glyphs.
  - Fill `material/track`. On the bare canvas (the header search), use `material/fill`.
  - Boundary: 1px INSIDE `text/muted`. Never `border/input`: theme-character §5 keeps `input` for
    the circles and off tracks.
- **C.focus** (`Cupertino/.Focus ring`; L438). (derived: not drawn, pending #2416)
  - The base geometry: a 2px OUTSIDE `border/ring` stroke after a 2px transparent gap
    (`focus/ring-width` 2, `focus/ring-offset` 2).
  - The radius follows the root plus 2: capsules and circles stay full; rows 12 → 14; fields
    10 → 12.
- **C.states.** All (derived) from L429-439; states are not drawn (L392-393).
  - **Hover:** C.glass lifts one material step, `material/fill` → `material/fill-strong` (L433).
    C.prominent takes `primary/hover`. Borderless items (C.plain, rows, segments) take a
    `material/track` fill at their radius.
  - **Pressed:** "darkens 8% without movement" (L434). The `state-layer` shows `text/fg` at
    `state/hover-opacity` (8%). In Dark the same layer lightens by 8%, which is the designed Dark
    equivalent.
  - **Selected rows** fill instantly (L435): C.selected.
  - **Focus:** C.focus.
  - **Disabled:** root opacity `state/disabled-opacity` (38%), the base R.disabled. Cupertino
    documents no disabled look.
- **C.traffic.** Three 12px discs at a 20px pitch (L388): `destructive/default`,
  `warning/default`, `success/default`. Copy from `30:28`.
- **C.avatar.** Rows: a 28px (`size/avatar/md`) `material/track` disc with 12px Semi Bold initials
  in `text/muted`. Profile: a 32px (`size/avatar/lg`) `primary/default` disc with `primary/fg`
  initials (L424-425; `30:112`).

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Cupertino anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Cupertino's spec does not draw; the derivation uses
only the recipes above.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Cupertino/Icon`, `Cupertino/Spinner`, `Cupertino/.Focus ring` and
`Cupertino/.State layer`.

| Style set | Base set | Cupertino anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Cupertino/Icon` (and `Cupertino/Icon/<glyph>`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** Lucide is Cupertino's icon set (L261, L421), so create no `Cupertino/Icon/<glyph>`: keep the base `glyph` swap and the base `Icon/*` glyphs. Stroke `icon/stroke` (2; L421 allows 1.5–2). **Sizes:** sm 14 (chevrons), md 16 (nav, buttons), lg 20. The 15px search and tile glyphs are instance sizes. For the brand glyph, reuse the main component of the crafted `icon/package` (`30:34`) | `text/fg` via the parent |
| `Cupertino/Spinner` | `Spinner` `252:11837` | (derived; Cupertino draws none) The base ring and arc: ring `material/track`, arc in the parent's label role (default `text/fg`), round caps. No spokes | `material/track` |
| `Cupertino/.Focus ring` | `.Focus ring` `252:11805` | C.focus | `border/ring` |
| `Cupertino/.State layer` | `.State layer` `252:11806` | Hidden by default. Fill `text/fg`, layer opacity `state/hover-opacity` (8%): the pressed darken of C.states. Hover never uses it | `text/fg` |
| `Cupertino/Button / md` | `Button / md` `253:372` | C.capsule, 36. **primary:** C.prominent. **secondary:** C.glass (Filter, Export, Cancel; `30:123`, `31:180`). **outline:** (derived) no fill, 1px INSIDE `border/strong` rim (the Increase Contrast rim, L359-360), no blur, no shadow. **ghost:** C.plain (the Plain kind, "Review Orders", L376). **destructive:** (derived) C.glass with label and icon in `destructive/text`; the accent policy keeps `primary` fills to its listed uses, and status ink uses `*-text` (L287-294). **link:** C.plain; the `underline` part is 1px `primary/text`, shown on hover and pressed, and no capsule fill appears (derived). States: C.states. `loading` shows `Cupertino/Spinner` in the label role | `primary/*`, `material/*`, `effect/control-shadow`, `border/strong`, `destructive/text` |
| `Cupertino/Button / lg` | `Button / lg` `254:721` | (derived) As md at 44 (`space/control/height-lg`), padding 0/20/0/18, 20px icon | as md |
| `Cupertino/Button / sm` | `Button / sm` `254:371` | (derived) As md at 30 (`space/control/height-sm`), padding 0/12/0/10, 14px icon, label 13/18 (`type/small/size`, `/line`) Semi Bold | as md |
| `Cupertino/Button / xs` | `Button / xs` `254:1071` | (derived) As sm at 24 (`space/control/height-xs`), padding 0/10/0/8 | as md |
| `Cupertino/Icon button / md`, `/ lg`, `/ sm`, `/ xs` | `255:262`, `255:740`, `255:501`, `255:979` | Circles, W = H, using the Button recipe of the same size and variant: secondary is the glass header capsule (component-spec A2), ghost is a `primary/text` glyph. Glyph 16 (md), 20 (lg), 14 (sm, xs) | as Button |
| `Cupertino/Button group` | `Button group` `257:839` | (derived from the header row, L323; `30:122`) Capsules never join: separate capsules with gap 8, each with its full pill. `separator` hidden. `text`: C.small `text/muted`, no fill | as Button |
| `Cupertino/Toggle / md`, `/ sm`, `/ lg` | `256:281`, `256:437`, `256:593` | (derived) C.capsule geometry at 36, 30 and 44. **Off:** no fill; label `type/body/*` with `type/strong/style` (14/20 Medium) in `text/fg`. **Selected:** the segment thumb, i.e. `material/fill-strong` with the two C.segmented shadows, and a Semi Bold label (L378). **Hover:** a `material/track` fill. **outline** adds a 1px INSIDE `border/strong` rim. Focus and disabled as Button | `material/*`, `effect/control-shadow`, `border/strong` |
| `Cupertino/Icon toggle / md`, `/ sm`, `/ lg` | `276:8291`, `276:8431`, `276:8571` | As Toggle, circular | as Toggle |
| `Cupertino/Toggle group` | `Toggle group` `257:528` | **segmented:** C.segmented. md is the 32 track with 28 segments; sm is a 28 track with 24 segments (derived). Nested Toggles take `tabs/item-radius` (7) and show no fill unless selected. **default** and **outline:** separate `Cupertino/Toggle`s with gap 8 (derived, L323) | `tabs/*` |
| `Cupertino/Action bar` | `Action bar` `258:663` | Never Liquid's floating glass island (L274-275). **floating:** (derived) an opaque C.float bar, 44 tall (`space/control/height-lg`), radius 12, padding 0/8, gap 8; no `GLASS`, no blur. It replaces the base inverse slab, which would be pale in Dark. `count` C.strong `text/fg`; `separator` a 1×20 `border/subtle` rule; `close` `Cupertino/Icon button / sm` ghost. **inline:** (derived) a `material/track` row, radius 12, `count` C.strong `text/fg`. Not `primary`: the accent policy reserves full-row blue for the selected list row (L287-290) | `surface/card`, `material/*`, `effect/shadow-overlay`, `border/subtle` |
| `Cupertino/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Cupertino/Button / sm` ghost (Plain) | — |
| `Cupertino/Theme toggle` | `Theme toggle` `258:742` | `Cupertino/Icon button / md` secondary (a glass circle, like the header capsules) with moon and sun | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Cupertino anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Cupertino/Label` | `Label` `278:45` | **default:** C.body `text/fg`, the grouped-row label (L384). **eyebrow:** C.section. **invalid:** `destructive/text`, the error-row label (L385). `required-mark` `destructive/text`; `optional-hint` C.small `text/muted`. Disabled `text/muted` | — |
| `Cupertino/Input` | `Input` `279:312` | **Rest.** C.field: md 32 (L147, L377); sm 30 (`space/control/height-sm`, derived). Value C.body `text/fg`, placeholder C.body `text/muted`, icons 15 in `text/muted`. **Theme-only boolean `grouped`** (default false): hides the fill and the boundary and right-aligns the value. This is the grouped input row (kit `29:81`, "Tracking number"). **Hover:** (derived) fill `material/fill`, one material step (L433). **Focus:** C.focus at radius 12; the boundary stays `text/muted`. **Invalid:** boundary `destructive/default` and a trailing 16px `alert-circle` in `destructive/default` (derived from C.error-row). **invalid-focus:** both. **Disabled:** C.states | `material/*`, `text/muted`, `destructive/*` |
| `Cupertino/Textarea` | `Textarea` `280:597` | The C.field recipe, minimum 80, padding 10. `counter` C.caption `text/muted`; `resize-handle` `grip-vertical` 14 in `text/muted` | as Input |
| `Cupertino/Select` | `Select` `281:1023` | The C.field trigger with a 14px `chevron-down` in `text/muted`. Theme-only boolean `grouped` as Input: a grouped value row, i.e. muted value plus a trailing 14px `chevron-right` and no box (the "Shipping method" row, L384). **Open:** chevron `chevron-up`; content is `Cupertino/Select content` 4px below | as Input |
| `Cupertino/Select content` | `Select content` `281:826` | `Cupertino/Menu content` holding `Cupertino/Menu item` `type=option` | — |
| `Cupertino/Checkbox` | `Checkbox` `283:1470` | C.circle on `control`; the `indicator` becomes the tick vector, with the same layer name. **Indeterminate:** a `minus` in `primary/fg` on the `primary/default` disc (derived). **Theme-only boolean `inverted`** (default false): the inverted circle for selected rows. **Hover:** (derived) ring `text/muted`. **Invalid:** ring `destructive/default`. Focus C.focus on `control`. Label C.body `text/fg`, description C.small `text/muted` | `primary/*`, `border/input` |
| `Cupertino/Radio` | `Radio` `284:1828` | C.circle, the same as Checkbox (selection circles serve both, L379). Checked: `primary/default` disc with a `primary/fg` tick; the base 8×8 `indicator` ellipse becomes the tick vector, with the same layer name. Theme-only `inverted` as Checkbox | as Checkbox |
| `Cupertino/Radio group` | `Radio group` `284:1885` | Nests `Cupertino/Radio` | — |
| `Cupertino/Switch` | `Switch` `285:2329` | C.switch on `track`. **sm** resolves to the same 51×31 (Theme B aliases `size/switch/*-sm` to the md values; iOS has one size). The `thumb` ellipse stays an ellipse. **Hover:** identical to rest (derived; L429-439 defines no switch hover). **Focus:** C.focus on `track`. **Invalid:** (derived) a 1px INSIDE `destructive/default` stroke on the track. **Disabled:** C.states. Label C.body `text/fg` | `success/default`, `border/input`, `switch/thumb`, `effect/control-shadow` |
| `Cupertino/Field` | `Field` `287:2656` | Nests `Cupertino/Label` and `Cupertino/Input`. **vertical:** label above, gap 6. **horizontal:** a C.group row, 44 tall, label C.body on the left, the control on the right with Input `grouped=true`. **invalid:** C.error-row; `error-icon` is a 16px `alert-circle` in `destructive/default`, and `error` is C.caption `destructive/text`. `description` C.small `text/muted` | `destructive/*` |
| `Cupertino/Field set` | `Field set` `287:2743` | C.group, the signature inset grouped editor (L247-249). `legend` is the caption: C.section for `variant=legend`, C.sidebar-title for `variant=label`. `group` is the r12 `material/fill-strong` group holding horizontal Fields with inset `border/subtle` separators. `separator` hidden. `description` C.small `text/muted` under the group | `material/fill-strong`, `border/subtle` |
| `Cupertino/Input group` | `Input group` `297:3861` | The `Cupertino/Input` frame. The addon is a 15px glyph in `text/muted`, C.small `text/muted` text, or `Cupertino/Icon button / xs` ghost | — |
| `Cupertino/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is its own C.field, 36×36 (`space/control/height`), radius 10. Character C.heading `text/fg`. **caret:** 1×16 `text/fg`. Focus C.focus. Invalid: boundary `destructive/default`. Slots never share edges | as Input |
| `Cupertino/Input OTP` | `Input OTP` `301:4490` | Group gap 8 instead of −1 (derived, L323); the separator is a 14px `minus` in `text/muted` | — |
| `Cupertino/Slider` | `Slider` `303:5022` | (derived) **Track:** 4 tall, full pill, `material/track`. **Range:** `primary/default`, as a checked circle fills. **Thumb:** the C.switch knob at 20 (`size/checkbox`): `switch/thumb` with its two shadows, so Dark keeps a `#111113` knob. `value-label` C.data `text/muted` | `primary/default`, `material/track`, `switch/thumb`, `effect/control-shadow` |
| `Cupertino/Combobox` | `Combobox` `305:5623` | `Cupertino/Input` plus `Cupertino/Menu content`. Chips are `Cupertino/Badge` subtle with `remove` | — |
| `Cupertino/Calendar day` | `Calendar day` `307:6154` | (derived) 30 circle (`space/control/height-sm`, `radius/control`), label C.body `text/fg`. **Rest:** no fill. **Hover:** `material/track`. **today:** label `primary/text` Semi Bold, no fill. **selected, range start and end:** `primary/default` disc with `primary/fg` label, like a checked circle (L379). **range-middle:** `surface/selected` band, no radius. **outside:** `text/muted`. **Disabled:** C.states | `primary/*`, `material/track`, `surface/selected` |
| `Cupertino/Calendar` | `Calendar` `309:8620` | C.content at radius 22, padding 16 (L144). Caption C.heading; weekdays C.caption `text/muted`; nav `Cupertino/Icon button / sm` ghost (Plain chevrons); month select `Cupertino/Select` sm | — |
| `Cupertino/Date picker` | `Date picker` `313:14889` | `Cupertino/Select` trigger with a `calendar` glyph; open is `Cupertino/Popover` with `Cupertino/Calendar` | — |
| `Cupertino/Search` | `Search` `316:16426` | C.field. **md** is the header search, 260×32 on `material/fill` (L323, L377; `30:157`). **sm** (derived) is 30 tall with the same recipe. 15px magnifier and label C.body in `text/fg`; the placeholder is `fg` (L377). `kbd` `Cupertino/Kbd`. The sidebar instance in `Cupertino/Sidebar` overrides the fill to `material/track` (`30:39`). **Hover:** `material/fill-strong`. **Focus:** C.focus. **Open:** boundary `text/fg` (base, derived) | `material/*`, `text/muted` |
| `Cupertino/Dropzone` | `Dropzone` `319:16832` | (derived) C.content at radius 22 with a dashed [4,4] 1px `text/muted` boundary, the editable-boundary rule (L406). Icon 20px `upload` in `text/muted`; label C.strong; hint C.small `text/muted`. **active:** fill `surface/selected`, boundary `border/ring`. **uploading:** a 4px full-pill `material/track` bar with a `primary/default` fill. **invalid:** boundary `destructive/default`, status `destructive/text` | `material/*`, `surface/selected`, `border/ring` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Cupertino anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Cupertino/Location marker` | `Location marker` `337:22` | (derived) sm 4 and md 6 circles, like Cupertino's status dots (L291, L370: no square marks). Fill `marker/default`. `deco/marker` is false, so parents keep it hidden | `marker/default` |
| `Cupertino/Breadcrumb item` | `Breadcrumb item` `338:92` | Inter, never mono. **Link:** C.body `primary/text` (links use `primary-text`, L289-290). **Current:** C.strong `text/fg`. **separator:** 14px `chevron-right` in `text/muted` (L421). **Ellipsis:** `more-horizontal` in `text/muted` | `primary/text` |
| `Cupertino/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Cupertino/Breadcrumb item`, gap 6 | — |
| `Cupertino/Page key` | `Page key` `339:270` | (derived) A 30 capsule (`space/control/height-sm`), minimum width 30, label C.data `text/fg`, no fill. **Hover:** `material/track`. **current:** `material/track` fill and a Semi Bold label: the selected sidebar item (L387), not `primary`. **previous and next:** `Cupertino/Button / sm` ghost with chevrons. **Ellipsis:** C.body `text/muted`. **Disabled:** C.states | `material/track` |
| `Cupertino/Pager tile` | `Pager tile` `339:319` | (derived) C.content at radius 12, padding 16. `direction` C.section; `title` C.strong `text/fg` plus a trailing 14px `chevron-right` in `text/muted`, like the grouped value row | — |
| `Cupertino/Pagination` | `Pagination` `339:379` | `meta` C.small `text/muted`; nests `Cupertino/Page key` and `Cupertino/Pager tile` | — |
| `Cupertino/Tab / horizontal` | `Tab / horizontal` `342:402` | **default and segmented:** a C.segmented segment, 28 tall, radius 7, label C.segment; selected is the raised thumb with Semi Bold. `count` is `Cupertino/Badge` plain without `dot` (`text/muted`). **line:** (derived; Cupertino draws only the segmented control) no thumb, selected label Semi Bold plus a 2px `text/fg` underline. **Hover:** (derived) the unselected segment takes `material/fill` at radius 7. `marker` stays hidden. Focus C.focus (radius 9). Disabled C.states | `tabs/*`, `effect/control-shadow` |
| `Cupertino/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal. `line` puts the 2px bar on the inline-start edge | as horizontal |
| `Cupertino/Tabs list` | `Tabs list` `343:424` | **default and segmented:** the C.segmented track. **line:** no track, gap 16 (derived) | `tabs/*` |
| `Cupertino/Tabs` | `Tabs` `343:489` | Nests `Cupertino/Tabs list` | — |
| `Cupertino/Nav item` | `Nav item` `345:601` | Kit `29:58`: 32 tall, radius `nav/radius` (9), padding-x 10, gap 10. 16px icon in `primary/default` (the frames; see §5). Label C.body `text/fg`; `count` is `Cupertino/Badge` plain without `dot` (`text/muted`). **selected:** `nav/active` (= `material/track`) fill, Semi Bold label, count `text/fg` (L387). **Hover:** (derived) `material/track` with a Regular label. Level 2 indents 24. **Collapsed:** a 32 icon-only square, radius 9. `marker` hidden. Focus C.focus. Disabled C.states | `nav/active`, `primary/default` |
| `Cupertino/Nav group` | `Nav group` `346:611` | Group label C.sidebar-title in a 36-tall frame with the text at y16 (`30:45`). Items gap 2 (L337). Nests `Cupertino/Nav item` | — |
| `Cupertino/Sidebar` | `Sidebar` `347:994` | C.vibrancy, 248 wide, floating at `frame/inset` (16), padding 13 (L320; `30:27`). **Header:** theme-only part `traffic-lights` (C.traffic), then `brand-group` (`Cupertino/.Brand logo` plus "Northwind" in C.heading), then `Cupertino/Search` with fill `material/track`, 222 wide. **Body:** `Cupertino/Nav group`s. **Footer:** the profile, a 32px C.avatar profile disc plus name C.strong and role C.caption `text/muted`. **Variants:** `sidebar` and `floating` are both the floating vibrancy panel, because an attached sidebar belongs to Apple Classic (L269-272, derived). `inset` adds a C.content area at radius 26 | `material/*`, `effect/shadow-overlay` |
| `Cupertino/Top bar` | `Top bar` `351:1349` | No toolbar strip (L388): no fill, no rule (`topbar/rule-width` 0), no shadow, padding-x 0, height 62 (`30:118`). **app desktop:** theme-only parts `large-title` (C.large-title) and `subtitle` (C.body `text/muted`) in `topbar-start`; `brand` and Breadcrumb hidden, because the brand lives in the sidebar. `topbar-end`: `Cupertino/Search` md, then capsules with gap 8: `Cupertino/Button / md` secondary "Filter" and "Export", then primary "New Order" (`30:122`). Theme toggle and Icon buttons are glass circles. Avatar hidden (the profile lives in the sidebar). **docs:** (derived) the same row with `Cupertino/Navigation menu` after the large title. **mobile:** (derived) a 44 row with `Cupertino/Sidebar toggle` leading and one prominent capsule trailing, and the large title below it. Traffic lights never appear here | — |
| `Cupertino/.Brand logo` | `.Brand logo` `344:410` | A 26px `primary/default` tile at radius 7 holding a 15px `package` glyph in `primary/fg` (`30:33`; the brand disc of L289) | `primary/default`, `primary/fg` |
| `Cupertino/Nav menu item` | `Nav menu item` `349:1036` | (derived) A 30 capsule, label C.body `text/fg`. **Hover:** `material/track`. **selected:** `material/track` with a Semi Bold label. **open:** as selected, with the chevron rotated 180° | `material/track` |
| `Cupertino/.Nav menu link` | `.Nav menu link` `348:1108` | A C.group row at radius 12. Title C.strong, description C.small `text/muted`. **Highlighted:** C.selected, with both texts in `primary/fg` | `primary/*` |
| `Cupertino/Navigation menu` | `Navigation menu` `349:1132` | The viewport is `Cupertino/Menu content` (C.group as a float) | — |
| `Cupertino/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) 30 tall, radius 9, C.body `text/fg`. **Hover and open:** `material/track` | `material/track` |
| `Cupertino/Menubar` | `Menubar` `349:1236` | (derived) Root without fill or boundary; Cupertino draws no toolbar strip (L388). Gap 2. Menus are `Cupertino/Menu content` | — |
| `Cupertino/Step` | `Step` `352:1355` | (derived) **indicator:** a 24 circle (`radius/badge` 999). **complete:** a C.circle checked disc, `primary/default` with a `primary/fg` tick. **current:** a 2px `border/ring` ring with a Semi Bold C.data number in `text/fg`. **upcoming:** a 1.5px `border/input` ring with the number in `text/muted`. **error:** `destructive/default` disc with an `x` in `destructive/fg`. Title C.strong; description C.small `text/muted`. **connector:** 1px `border/subtle`; complete is 2px `primary/default` | `primary/*`, `border/*`, `destructive/*` |
| `Cupertino/Stepper` | `Stepper` `352:1424` | Nests `Cupertino/Step` | — |
| `Cupertino/Sidebar toggle` | `Sidebar toggle` `344:462` | `Cupertino/Icon button / sm` and `/ lg` secondary (glass circles) with `panel-left`, `menu` and `x` | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Cupertino anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Cupertino/.Kbd` | `.Kbd` `370:31` | Retired to the Overlays Draft area: build `Cupertino/Kbd` in 4.5 instead. Every former `.Kbd` reference now points at `Cupertino/Kbd` | — |
| `Cupertino/Menu item` | `Menu item` `371:587` | A C.group row: 44 tall (`space/control/height-lg`), padding-x 16, gap 8, label C.body `text/fg`, 16px icon in `text/fg`. **Theme-only part `row-divider`** (1px `border/subtle`, inset 16, at the bottom) and **theme-only boolean `divider`** (default true; set it false on the last item). **highlighted:** C.selected (derived, §2.1); the row is clipped by the menu's radius. **destructive:** label and icon `destructive/text`; highlighted adds `destructive/subtle`, not blue (accent policy, L287-290). **Indicators:** checkbox, radio and option show a 16px `check` in `primary/text` (`primary/fg` when highlighted), like the selection tick of L379. **submenu:** a 14px `chevron-right` in `text/muted`. `shortcut` is `Cupertino/Kbd` sm | `primary/*`, `border/subtle`, `destructive/*` |
| `Cupertino/Menu label` | `Menu label` `373:35` | C.section, padding 16/8 | — |
| `Cupertino/Menu separator` | `Menu separator` `373:38` | A 1px `border/subtle` rule, full width (L368) | — |
| `Cupertino/Menu group` | `Menu group` `373:248` | Nests `Cupertino/Menu label` and `Cupertino/Menu item` | — |
| `Cupertino/Menu content` | `Menu content` `373:256` | C.group as a float: radius 12, fills `surface/card` under `material/fill-strong`, a 1px INSIDE `material/stroke` rim, the C.float shadow, padding 0 (rows run edge to edge), clip content, minimum width 192. No blur, no `GLASS` | `surface/card`, `material/*`, `effect/shadow-overlay` |
| `Cupertino/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Cupertino/Button / md` secondary plus a 14px `chevron-down`; `Cupertino/Menu content` 4px below | — |
| `Cupertino/Context menu` | `Context menu` `374:653` | The trigger area is a dashed 1px `border/strong` frame at radius 12 with C.small `text/muted`; `Cupertino/Menu content` at the pointer | `border/strong` |
| `Cupertino/Dialog` | `Dialog` `378:743` | L389: a native-style opaque `card` panel at radius 26 over `overlay`, never a glass sheet. `content`: C.float at radius 26, padding 20 (form padding, L145; the form insets 21), gap 12. `backdrop` `surface/overlay`. `title` C.heading (`31:128`); `description` C.body `text/muted`. `close`: `Cupertino/Icon button / sm` secondary. `footer`: end-aligned `Cupertino/Button / md` secondary "Cancel" and primary "Save", gap 8 (`31:179`). The body may hold a C.group | `surface/card`, `material/stroke`, `surface/overlay` |
| `Cupertino/Alert dialog` | `Alert dialog` `378:880` | As Dialog, with no close. `media`: a 26px tile at radius 7 filled `<tone>/default` (`warning`, `destructive`) holding a 15px glyph in `primary/fg`, as the notice tile (`31:192`, L383). `cancel` is the secondary button; `action` is primary, or the destructive variant | `<tone>/default`, `primary/fg` |
| `Cupertino/Sheet` | `Sheet` `379:1004` | (derived from L389) An opaque C.float at radius 26 on the exposed corners only, with a 1px `material/stroke` inner edge. It stays attached to its edge; a detached sheet is Liquid's (L274-275). Header and footer as Dialog. `handle`: 36×4 full pill in `border/strong` (base) | `surface/card`, `material/stroke` |
| `Cupertino/Drawer` | `Drawer` `379:1150` | As Sheet; footer buttons are `Cupertino/Button` | — |
| `Cupertino/Popover` | `Popover` `381:937` | C.float at `radius/card` (22), padding 16 (L144). `title` C.strong; `description` C.small `text/muted`. `arrow` filled `surface/card` with a `material/stroke` edge | `surface/card`, `material/stroke` |
| `Cupertino/Tooltip` | `Tooltip` `381:1030` | (derived) A `tooltip/*` chip, full pill (`radius/badge` 999, the capsule shape of L367). Label C.small `tooltip/fg`; kbd `Cupertino/Kbd` inverse. No blur | `tooltip/*` |
| `Cupertino/Hover card` | `Hover card` `381:1093` | C.float at radius 22, padding 16. The avatar is `Cupertino/Avatar` md (28, initials). Title C.strong; description C.small `text/muted`; meta C.caption `text/muted` | — |
| `Cupertino/Command item` | `Command item` `382:1015` | A C.group row: minimum 44, padding-x 16, label C.strong `text/fg`, `url` and `excerpt` C.small `text/muted` (no mono), `kind` C.caption `text/muted`, `hash` 14px in `text/muted`. Theme-only `row-divider` and `divider` as Menu item. `shortcut` is `Cupertino/Kbd` sm. **selected:** C.selected plus the `corner-down-left` glyph, instead of the base 2px marker bar | `primary/*`, `border/subtle` |
| `Cupertino/Command palette` | `Command palette` `383:1355` | The Dialog recipe at width 640. `input-row`: padding 12/20 holding a C.field (32, `material/track`, 15px magnifier) and `Cupertino/Kbd` "esc". `filters`: `Cupertino/Toggle group` segmented. `list`: padding 20; each `group` is a C.group, with `group-label` as the C.section caption and `Cupertino/Command item` rows inside an r12 group. `footer`: no fill, a 1px `border/subtle` top rule, C.caption `text/muted` | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Cupertino's data display is the crafted Orders fixture: dot-plus-word status, KPI widgets, an inset
list card with full-row blue selection, and opaque notice and activity cards (L291, L327-334,
L381-386; `30:162`, `30:218`, `31:191`, `31:205`). Nothing here blurs or takes `GLASS`.

| Style set | Base set | Cupertino anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Cupertino/Kbd` | `Kbd` `403:28` | (derived; Cupertino draws no key) md 20 (`size/kbd`), sm `size/kbd-sm`, minimum width = H. **default:** a full pill (`radius/badge` 999, the capsule shape of L367) filled `material/track`, no border, label C.caption `text/muted` in Inter instead of Fragment Mono (one family, L305-306). **inverse:** the base `tooltip/kbd` fill, `tooltip/border` stroke and `tooltip/muted` label. It replaces `.Kbd` for Search, Tooltip, Command item, Command palette and the Menu item shortcut (sm) | `material/track`, `tooltip/*` |
| `Cupertino/Kbd group` | `Kbd group` `403:96` | Nests `Cupertino/Kbd`; the "+" separator is C.caption `text/muted`, gap 4 (base) | — |
| `Cupertino/Badge` | `Badge` `405:180` | Status is "a dot plus a word", never a chip (L291, L382; kit `29:74`, cell `30:250`): an 8px circle dot (`radius/avatar` 999), gap 6, word C.body (14/20) `text/fg`, Inter. **Dot per tone:** success `success/default`, warning `warning/default`, destructive `destructive/default`, info `info/default`, neutral `text/muted` (Refunded, `30:342`). **plain:** exactly that, no container, padding 0; with `dot` off it is the count, C.data `text/muted`. **outline:** (derived) the plain status inside a 24 full-pill capsule with a 1px INSIDE `border/subtle` rim, padding 0/10. **subtle:** (derived) the same capsule filled `material/track`, no rim. **solid:** (derived) a 24 full pill in `<tone>/default` with the word in `<tone>/fg` and the dot hidden. Only solid tints the word: tinted text is for deltas and errors (L291-294). Inside C.selected, dot and word turn `primary/fg` (`30:303`). `iconStart` 14px in `text/muted`; `remove` a 12px `x` in `text/muted` | `<tone>/default`, `text/*`, `material/track`, `border/subtle` |
| `Cupertino/Badge / kind` | `Badge / kind` `405:211` | (derived; Cupertino draws no API tags) The plain status: an 8px dot in the kind's base role (`code/syntax/*` or `text/fg`) plus the kind word in C.small `text/fg`, with no outline | `code/syntax/*` |
| `Cupertino/Avatar` | `Avatar` `406:95` | Circles (`radius/avatar` 999): sm 24, md 28 (rows, L424; `30:242`), lg 32 (profile, `30:112`). **initials:** a `material/track` disc with Semi Bold initials in `text/muted`: 12/16 on md (L424), 11 on sm and 13/18 on lg (derived). **fallback:** `material/track` with a `user` glyph in `text/muted`. **agent:** the profile disc, `primary/default` with the `bot` glyph in `primary/fg` (L289, L425). **image:** clipped to the circle. Theme-only boolean `inverted` (default false): a `primary/fg` disc with `primary/default` initials for C.selected rows (L252, L424; `30:296`). The activity list's 34px avatars (`31:215`) are an instance size | `material/track`, `primary/*` |
| `Cupertino/Avatar presence` | `Avatar presence` `406:43` | An 8×8 circle, the status-dot size (L291): online `success/default`, away `warning/default`, offline `border/strong`, with the base 2px OUTSIDE `surface/card` ring | — |
| `Cupertino/Avatar group` | `Avatar group` `406:150` | (derived) Nests `Cupertino/Avatar`, overlap −8, a 2px OUTSIDE `surface/card` ring on each. The count avatar is a `material/track` disc with a Semi Bold "+n" in `text/muted` | — |
| `Cupertino/Item` | `Item` `408:792` | The activity row and the grouped row (`31:214`; kit `29:99`; L384). **size default:** the activity row, 58 tall (`31:214`, `31:235`): media 34, gap 12, title C.body `text/fg`, description C.small `text/muted`, trailing meta C.caption `text/muted` (`31:218`–`31:220`), padding-x 0 because the rows sit on the card's inset. **sm:** a C.group row, 44 tall (`space/control/height-lg`), padding-x 16. **xs:** 32 (derived). **variant default:** no container. **outline:** (derived) C.content at radius 12. **muted:** the C.group fill, `material/fill-strong` at radius 12. `chevron` a 14px `chevron-right` in `text/muted`; `actions` `Cupertino/Button / sm` ghost (Plain). Media swaps to `Cupertino/.Item icon tile`, `Cupertino/.Item image` or `Cupertino/Avatar`. **hover:** `material/track` (C.states). **focus:** C.focus | `material/*`, `text/*` |
| `Cupertino/Item group` | `Item group` `408:996` | The activity list (`31:205`): root without fill, rows `Cupertino/Item` default. `separators=true` draws a 1px `border/subtle` rule between rows (L368-369); in a C.group, the rule is inset 16 from the leading edge | `border/subtle` |
| `Cupertino/.Item icon tile` | `.Item icon tile` `408:82` | The KPI and notice icon tile (L383, L422-423; `30:165`, `31:192`): 26, radius 7 (literal), filled `primary/default` by default; instances use `success/default`, `warning/default` or `destructive/default`. A 15px glyph in `primary/fg` (white in Light, `#111113` in Dark, as the frames) | `primary/*`, `<tone>/default` |
| `Cupertino/.Item image` | `.Item image` `408:85` | 40×40 at `radius/input` (10) | — |
| `Cupertino/Card` | `Card` `409:951` | **default:** C.content, the notice and activity cards (L348, L386; `31:191`, `31:205`). Fill `card/bg` (`#f9f9fb` / `#18191b`, theme-character §2.4); a 1px INSIDE `card/border` (= `material/stroke`) on every side through `card/border-*` (1); radius `radius/card` (22, L364-365); no shadow (`shadow/y` 0, L348); padding 17 on md (16 inside the rim, L234, L386) and 13 on sm (derived). `header`: title C.heading ("Activity", `31:207`), eyebrow C.section, description C.body `text/muted` (the notice body, L386), `action` `Cupertino/Button / md` ghost (the Plain "See All", `31:209`). `footer`: (derived from the form actions, `31:179`) no `card/footer` fill and no rule; end-aligned `Cupertino/Button / md` secondary and primary, gap 8. **hover:** (derived) rim `border/strong`. **focus:** C.focus at radius 24. **selected:** (derived) fill `surface/selected`, rim kept. **rule:** (derived) no fill, no radius, a 1px `border/subtle` top rule (the grouped separator, L368), padding-top 16 | `card/bg`, `card/border`, `border/*`, `surface/selected` |
| `Cupertino/Stat card` | `Stat card` `409:1270` | **default:** the KPI widget (L201-206, L383; `30:163`). 233×170 at radius 24 (literal, pending #2414). Fill `kpi/bg-1` (`#f9f9fb` / `#18191b`) with a 1px INSIDE `kpi/border` (= `material/stroke`) rim on all sides; no shadow; padding 17/17/15 (L205 gives 16/16/14 inside the rim), so `kpi/pad-x` 16 plus the rim. **Top row:** the `icon` part is a `Cupertino/.Item icon tile` (26, radius 7, tone fill, 15px glyph), then the label at 14/20 Semi Bold in `text/muted`, title case, gap 8 (`30:164`, `30:171`): never T.eyebrow. **Value:** T.kpi (34/40 Semi Bold −1, L89; `30:172`). **Delta:** the sign is written ("+8.2%", "−1.3%", `30:174`), so the arrow part stays hidden. Value 14/20 Semi Bold in `success/text` or `destructive/text` (L292-293), then `detail` "vs last month" in C.caption `text/muted`, gap 6 (`30:175`). **Decorations:** `deco/sparkline` is true, so the sparkline shows: a 2px stroke, 28 tall, in `primary/text` by default; instances use `success/text`, `warning/text` or `destructive/text`, never raw fills (L293-294, L409-410; `30:176`). `ticks` and `blockbars` stay hidden. **hero:** (derived) the same widget with the value in T.display (48/52 Bold −1.4) and no icon tile. It is not an inverse slab, so Dark stays tinted slate (L295-301) | `kpi/*`, `*-text`, `deco/*` |
| `Cupertino/Table header cell` | `Table header cell` `410:546` | 38 tall (`30:219`), padding-x 6 (`30:222`). Label T.label (12/16 Medium) in `text/muted`, title case, never uppercase (`30:222`). **sort:** a 12px `chevron-down` (desc) or `chevron-up` (asc) after the label, gap 4, in `text/muted` (`30:231`); the label stays `text/muted` when sorted, as the frame. `none` shows no glyph. **hover:** (derived) label `text/fg`. **focus:** C.focus | `text/muted` |
| `Cupertino/Table cell` | `Table cell` `410:383` | Height `space/table/row-height` (52, L336), padding-x 6 (`30:240`), no cell rule (`table/cell-rule-width` 0). **text:** C.body `text/muted` (channel, `30:248`). **strong:** C.strong `text/fg` (order id, name; `30:240`). **mono:** C.data, Inter (L305-306). **number:** C.data `text/fg`, end-aligned (`30:256`). **muted:** C.body `text/muted` (date, `30:254`). `secondary`: C.caption `text/muted` (email, `30:246`). **badge:** `Cupertino/Badge` plain (dot plus word, `30:250`). **avatar:** `Cupertino/Avatar` md plus name and email, gap 10 (`30:241`). **actions:** `Cupertino/Icon button / sm` ghost with a 16px `more-horizontal`, glyph overridden to `text/muted` (`30:258`). **select:** `Cupertino/Checkbox` (C.circle) in a 40 cell (`30:237`). Inside a selected row every part turns `primary/fg` | `text/*` |
| `Cupertino/Table row` | `Table row` `412:1187` | 52 tall (`space/table/row-height`), radius `table/row-radius` (12), padding 0/8 (L381; `30:236`), a 1px bottom `table/row-rule` (= `border/subtle`; L369, L381) excluded from layout. Fill `table/row-bg`. **zebra:** Cupertino has no zebra; `table/zebra` equals `table/row-bg` under Theme B Cupertino, so zebra=true renders the same (L381). **hover:** (derived) `table/hover`. **selected:** C.selected (`30:288`): full-row `primary/default`, no bottom rule, every cell glyph `primary/fg`, `Cupertino/Checkbox` and the avatar `inverted`, status dot and word `primary/fg` (L250-253; theme-character §2.1). The base 2px `marker/default` selection-bar part stays in the tree, hidden: the fill is the marker. **focus:** C.focus at radius 14. **disabled:** C.states. **stacked:** (derived) name C.body over meta C.caption `text/muted`, with status and total trailing | `table/*`, `primary/*` |
| `Cupertino/Table` | `Table` `413:1367` | The orders list (L327-334, L381; `30:218`): C.content at radius 24 (literal) with the `card/border` rim; rows inset 7 per side (`table/inset` 7); the header is 38 tall at y5. **head:** no fill and no rule, because the header sits on the card (`30:219`). `table/head` and `table/head-rule` still resolve Glass values under Theme B Cupertino, so draw the head fill as none and hide the rule stroke. The select-all cell is an empty 40 cell in the frame (`30:220`): keep the part, hidden. Columns `40 104 minmax(0,1fr) 124 150 128 104 36`, no column gap (L381). `caption` and `summary` C.small `text/muted`. **empty** and **loading:** the base stand-ins with C.body `text/muted` | `card/border`, `table/*` |
| `Cupertino/Data table` | `Data table` `416:4605` | The orders fixture (L322-323, L338). Root without card chrome; the controls row sits above the list card, as `30:146` (derived). **toolbar:** `Cupertino/Toggle group` segmented on the left, `Cupertino/Search` md (260×32) on the right; Status and date `Cupertino/Select` sm; Table and Board `Cupertino/Toggle group` segmented sm; Columns and Export `Cupertino/Button / md` secondary. **selection:** `Cupertino/Action bar` inline (a `material/track` row) above the table. **table:** `Cupertino/Table`. **footer:** `Cupertino/Pagination`. **columns:** opens `Cupertino/Menu content` with checkbox `Cupertino/Menu item`s. **mobile:** stacked rows. Blocks 18 apart (L321) | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from core roles, which resolve to Cupertino under Theme B
  Cupertino (the Glass seed plus theme-character §2.3: `tabs/*`, `nav/active`, `card/border`).
  Nothing binds `cupertino/*`.
- **Text:** `type/*` and `font/*` (Inter; title 34/40, heading 17/22, body 14/20, small 13/18,
  label 12/16 Medium). Only the button label and the selected segment carry a literal Semi Bold
  (L312).
- **Sizes:**
  - `size/checkbox` 20;
  - `size/switch/*` 51/31/27;
  - `size/avatar/*` 24/28/32;
  - `size/icon/*` 14/16/20;
  - Density where it matches: capsules 36 are Comfortable `space/control/height`, grouped rows 44
    are `space/control/height-lg`. Bind both. The 32 field and track and the 28 segment are
    literal (theme-character §1.2).
- **Radii:** `radius/control` 999, `radius/input` 10, `radius/card` 22, `tabs/radius` and
  `nav/radius` 9, `tabs/item-radius` 7. The 12, 24 and 26 container radii stay literal until #2414
  names a tier.
- **Effects:** `GLASS` parameters cannot bind (component-spec §4.3). Copy them from the crafted
  nodes; bind only the shadow colours.

## 6. Verification strips

For each category, build a frame `Cupertino style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set B, Theme B
Cupertino):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme B Cupertino: the "before" |
| Style | The same instances swapped to the `Cupertino/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Cupertino/*`. Every override survives |
| States | One of each state for the category's interactive sets |

Put the strip on a 1280-wide frame filled `surface/bg` with the four aurora ellipses copied from
`30:22` behind it, so that glass reads as glass. Copy them in Dark from `32:169`.

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary and secondary in hover, pressed, focus and disabled;
  - Icon button md secondary;
  - Toggle off and selected;
  - Toggle group segmented;
  - Button group;
  - Action bar floating;
  - Theme toggle.
- **Forms:**
  - Input rest, focus, invalid and disabled, plus one with `grouped=true`;
  - Select;
  - Textarea;
  - Checkbox off, on and `inverted`;
  - Radio off and on;
  - Switch off and on (md and sm);
  - Slider;
  - Input OTP;
  - Search;
  - Calendar;
  - Field set with three horizontal Fields, one invalid;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default, line and segmented;
  - Nav item rest and selected;
  - Breadcrumb;
  - Pagination;
  - Sidebar floating;
  - Top bar app desktop;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content with a highlighted item;
  - Dropdown menu open;
  - Dialog md with scrim;
  - Alert dialog;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge: every tone in plain (Cupertino's dot-plus-word status), plus a count (plain, no dot);
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- capsules are full pills: blue prominent, pale glass with a white rim and a soft shadow;
- lists are inset grouped: uppercase captions, r12 groups, 44 rows, inset hairlines, chevrons;
- list and menu selection fills the full row in blue with every glyph inverted;
- checkboxes and radios are 20px circles; switches are green 51×31;
- fields are grey wells with a 1px grey boundary; focus is a 2px blue ring at a 2px gap;
- menus, popovers, dialogs and sheets are opaque cards with no blur;
- Dark keeps tinted slate, `#111113` ink on `#0090ff`, a `#111113` switch knob and 13% white rims.
  A white header, white slab or white perimeter is a defect (L415).
- **Data display 1:**
  - status is an 8px dot plus a 14px Inter word, with no chip and no mono;
  - Stat cards are 233×170 r24 widgets with a tinted 26px tile, a 34/40 value, a signed
    Semi Bold delta and a 2px sparkline;
  - the table is one r24 card with rows inset 7: a 38 header with no fill or rule, 52px r12 rows
    divided by hairlines, no visible zebra, and one full-row blue selected row where every glyph,
    circle and avatar inverts;
  - cards are opaque `#f9f9fb` / `#18191b` at r22 with a 1px rim and no shadow;
  - avatars are 28px grey circles; the agent avatar is the blue profile disc.

**Distinctness check (same builder).** When Liquid is built, place the Cupertino and Liquid style
rows side by side at 480px. Each must be identifiable without its label. If a Cupertino row shows a
gradient rim, a glass menu, a detached sheet or a 52px toolbar band, it has taken a Liquid move.

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1).
  There are no `Cupertino/Icon/*` glyphs, because the base Lucide glyphs are reused. Each set has the base variant count, property names
  and part names.
- **Kits renamed.** The eight `Glass/*` kits are `Cupertino/Specimen kit/*`, and the crafted frames
  `30:22`, `32:169`, `81:1388` and `81:1850` render unchanged.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/cupertino.json` lists every set id.
