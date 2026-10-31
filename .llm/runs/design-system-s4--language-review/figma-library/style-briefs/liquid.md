# Liquid style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G2, Cupertino + Liquid. Each theme has its own brief; this file is all the
  Liquid builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Liquid` (`93:735`).
- **Modes for every Liquid style set and strip:** Theme set **B** (`239:8`) and Theme B **Liquid**
  (`239:2`). Density Comfortable, set explicitly (DESIGN L366, L484). Scheme Light (`3:0`) to
  build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme B Liquid
  `size/switch/width` = 46.
- **Same builder as Cupertino.** Build Liquid after Cupertino. Section 1 lists what Liquid must
  never take from Cupertino.

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
   - `Liquid/Button / md`;
   - private helpers keep their dot: `Liquid/.Focus ring`.
   
   **Existing kits.** If a kit set on this page would collide with a new name, rename the kit set
   to `Liquid/Specimen kit/<name>`. Do not move it or touch its instances: node ids stay, so the
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
7. **Composites.** Composites nest this theme's own style sets (`Liquid/Field` nests
   `Liquid/Label` and `Liquid/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/liquid.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/liquid/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** macOS 27 Liquid Glass over a real desktop. Glass is only for navigation and controls:
the sidebar, toolbar groups, the inspector sheet, the selection bar and the segmented thumb.
Content stays opaque, and the wallpaper shows through the glass (L297-299, L386, L421).

**A Liquid strip must read at thumbnail size as:**

- icon-only control-glass capsules: a near-white `#fbfbfb` fill with a hairline outline and side
  shading, and no drop shadow;
- floating smoky-glass islands (sheet, dialog, menus, selection bar) with gradient rims, an inner
  highlight and lensing, over opaque content;
- a pill segmented track with a glass thumb;
- small 28px r7 fields whose focus is a solid 3px blue band;
- 46×28 green switches with a white knob in both schemes;
- grey navigation selection; deep blue `#0063e1` only on selected rows, the prominent capsule and
  Save;
- 32px pill actions in blue ink with no fill;
- macOS 13/17 type.

**Keep it apart from Cupertino** (L440; Cupertino L274-278, L401-403):

- no Cupertino capsules: no `material/fill` glass capsule with a white rim and a `0 4 14` shadow.
  Liquid controls are control-glass groups, the prominent capsule, `material/track` pills or plain
  blue-ink actions;
- no inset grouped cards outside the sheet and the dialog. Menus, Select content and command
  results are glass floats with pill or r8 rows, never r12 grouped cards with 44px rows;
- no floating r26 sidebar: the sidebar is an edge-to-edge glass column;
- no large-title header: a 52px toolbar band with a 15/18 window title;
- no selection circles: checkboxes are r7 squares;
- no aurora; type is 13/17, not 14/20.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Windows, Light / Dark | `93:736` / `97:786`; desktops (wallpaper) `133:1088` / `133:1150` | Everything below. **Measure here first** |
| Toolbar | `93:809`: sidebar group `93:810`, history `93:815`, title `93:823`, view group `93:827`, search `93:844`, New Order `93:849`; scroll edge `93:808` | Top bar, Button group, Icon button, Search, Button primary |
| Sidebar | `93:746`: traffic lights `93:747`–`93:749`, sources `93:750` (captions `93:752` / `93:785`, items `93:753`–`93:783`, channel rows `93:786`), account `93:802` | Sidebar, Nav item, Nav group, L.traffic, L.avatar |
| Segmented | `95:792` | Toggle group, Tabs |
| Selection bar | `95:902` | Action bar floating, Button sm ghost, L.float (bar) |
| Inspector sheet | `96:780`: header `96:783`, close `96:787`, sections `96:796` / `96:807` / `96:827` / `96:838`, focused field `96:812` (Dark `97:1050`), invalid row `96:815`, switches `96:832` / `96:836` (Dark off `97:1071`), actions `96:852`, hidden grabber `96:781` | Sheet, Dialog, L.group, L.field, L.focus, L.switch, Button lg |
| Banner, platters | `95:785`, `95:766` | Alert dialog media, Pager tile, Dropzone |
| Apple macOS 27 kit page | `120:1831` | Reference only. Never edit it and never copy its components (L313) |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/liquid--light.png`, `liquid--dark.png` | Offline reference |

This page has no kit sets, so rule 4 renames nothing.

**DESIGN.md vs crafted frames** (follow the crafted frames; report, do not resolve):

- **Inline and bar actions.** The frames bind core `primary/text`, which renders `#113264` /
  `#70b8ff` through the Glass seed (`95:906`, `95:791`; L19-20, L326-327, L400). L254 gives the
  selection bar `liquid-primary-text` instead. After the shared step, `primary/text` under Theme B
  Liquid resolves `#0066cc` / `#409cff` (theme-character §2.3). Bind `primary/text`, and expect the
  style row to read a brighter blue than the crafted Light bar.
- **Toolbar glyphs.** The frames draw 17px glyphs in the toolbar buttons (`93:812`, `93:817`,
  `93:829`), while L445 says 16px. Follow the frames.
- **Invalid row.** L411 can be read as a red label. The frame keeps the label in `text/fg` and puts
  `destructive-text` on the value, the glyph and the helper (`96:817`–`96:823`). Follow the frame.
- **Scheme-specific literals.** The crafted windows paint hairlines, rims and the inner glow as
  separate Light and Dark literals. A style set is one component that must follow Scheme, so §2
  maps each one to a stand-in `liquid/*` role. Report this deviation with the ledger.

## 2. Tokens the style relies on

**Fonts** (load all): Inter Regular, Medium, Semi Bold and Bold. Also load Geist Mono Regular and
Medium, only because hidden base parts keep text nodes bound to `font/mono`. Liquid uses Inter
only (L341): never show mono text.

**Language roles.** Liquid binds `liquid/*` plus core roles, as the crafted windows do (map: the
windows bind `liquid/primary/default`, `/primary/text`, `/material/glass-*`, `/toolbar/*`,
`/sidebar/selection`, `/effect/{outline,side}`, `/window/*`, `/accent/system`, `/border/ring`,
`/border/input`, `/tag/*`, `/switch/on-track`, `/success/text` and `/status/shipped-fg`).

| Use | Bind | Liquid value (Light / Dark) |
| --- | --- | --- |
| Prominent fill, selected row, Save, highlighted menu row | `liquid/primary/default` | `#0063e1` / `#0058d0` |
| Prominent hover | `liquid/primary/hover` | `#0058d0` / `#004fbd` |
| White on primary | `liquid/primary/fg` (frames: literal white, pending #2414) | `#ffffff` / `#ffffff` |
| Inline and bar actions, links | `primary/text` (see §1) | `#0066cc` / `#409cff` |
| Control glass: toolbar groups, search, outline buttons | `liquid/material/glass-control` | `#fbfbfb` / `#2c2c2e` |
| Control-glass outline and side shading | `liquid/effect/outline`, `liquid/effect/side` | `#e3e3e6` / `#00000099`; `#f2f2f2` / `#0000004d` |
| Float glass: selection bar, menus, popovers, tooltips | `liquid/material/glass-float` | `#f7f7f8b8` / `#2c2c2eb2` |
| Sheet glass: sheet, dialog, command palette | `liquid/material/glass-sheet` | `#f5f5f7b8` / `#262629cc` |
| Sidebar glass | `liquid/material/glass-sidebar` | `#f3f3f694` / `#1c1c1f85` |
| Top inner highlight | `liquid/effect/specular` | `#ffffffe5` / `#ffffff24` |
| Toolbar band and hairline | `liquid/toolbar/scroll-edge`, `liquid/toolbar/hairline` (= `topbar/bg`, `topbar/rule`) | `#ffffffd9` / `#1e1e1ed9`; `#0000000f` / `#00000099` |
| Segmented track, Cancel, close circle, off track | `material/track` | `#7575801f` / `#7575803d` |
| Segmented thumb | `material/fill-strong` (= `tabs/sel-bg`) | `#ffffffd1` / `#2b2e36c7` |
| Sheet group fill | `surface/raised` (L272) | `#ffffffd1` / `#2b2e36c7` |
| Content and field fill | `surface/card` | `#f9f9fb` / `#18191b` |
| Platters and zebra | `surface/muted` (= `kpi/bg-*`, `table/zebra`) | `#f0f0f3` / `#212225` |
| Grey selection | `liquid/sidebar/selection` (= `nav/active`) | `#00000012` / `#ffffff1a` |
| Hover | `liquid/state/hover-overlay` | `#1d1d1f0f` / `#f5f5f714` |
| Field and off-switch edge | `liquid/border/input` | `#86868b` / `#8e8e93` |
| Focus band and caret | `liquid/border/ring` | `#007aff` / `#0a84ff` |
| System accent: nav icon, slider range, today | `liquid/accent/system` | `#007aff` / `#0a84ff` |
| Switch on | `liquid/switch/on-track` | `#34c759` / `#30d158` |
| Switch and slider knob | `switch/thumb` (white in both after the shared step) | `#ffffff` / `#ffffff` |
| Nav tints, status dots, account avatar | `liquid/tag/{green,orange,purple,red,gray}` | Apple system hues per scheme (L330-331) |
| Traffic lights | `liquid/window/{close,minimize,zoom}` | `#ff5f57`, `#febc2e`, `#28c840` |
| Text | `text/fg`, `text/muted` | `#1c2024` / `#edeef0`; `#60646c` / `#b0b4ba` |
| Error value, glyph and helper | `destructive/text` | `#641723` / `#ff9592` |
| Warning tint | `warning/subtle` | `#fff7c2` / `#302008` |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` |
| Shadows | `effect/shadow` (floats, knob), `effect/control-shadow` (thumb) | `#0000002e` / `#00000073`; `#0d0f1f1f` / `#00000073` |
| Radius | `radius/control` 999 (pills), `radius/input` 7 (fields, checkbox), `radius/card` 14 (platters), `nav/radius` 10; literal 22 (floats), 16 (window), 12 (groups, banner), 8 (rows) | — |
| `GLASS` (literal; cannot bind) | Float and thumb: refraction 0.55, depth 22, dispersion 0.25, light 0.90 at −50°. Toolbar controls: 0.35 / 12 / 0.15 / 0.85 (L382-383; map) | Copy from the crafted nodes |

**Literal exceptions (pending #2414).** Draw these as listed. A literal does not switch with Scheme,
so a Light-only literal would leave a white perimeter in Dark.

| Literal (DESIGN, map) | Crafted value | In the style set |
| --- | --- | --- |
| Black avatar initials | `#000000` in both windows | Literal `#000000` (same in both schemes). Used by L.avatar |
| Pink avatar hue | `#ff2d55` / `#ff375f` | No set binds it. The Table fixture's sixth avatar (EG, `95:891`) is an instance override: use `liquid/tag/red` as the stand-in until #2414 adds a pink role |
| White labels and knobs | `#ffffff` in both | Bind `liquid/primary/fg` (labels) and `switch/thumb` (knobs); both resolve white in both schemes |
| On-accent rim on prominent and Save | 1px white 35% (L400, L494) | Literal white 35%, INSIDE. Check that `97:786` uses the same value; if Dark differs, use `liquid/effect/specular-tint` (35% / 18%) |
| Float gradient rim | white 100→25→75% / 34→5→18% (L306, L335) | Bind the three gradient stops to `liquid/effect/specular` (90% / 14%), `liquid/effect/specular-low` (50% / 5%) and `liquid/effect/specular`. If stops cannot bind, use a solid 1px INSIDE `liquid/effect/specular-tint` (35% / 18%) |
| Inner glow 20 | white 32% (L379) | INNER_SHADOW 0 0 20 in `liquid/effect/specular-tint` |
| Float outline 0.5 | `#00000014` (L379) | DROP_SHADOW spread 0.5 in `liquid/effect/shadow` (`#00000014` / `#00000080`) |
| Toolbar-item stroke | 1px black 10% (L509) | `liquid/glass/edge` (`#0000001a` / `#0000008c`) |
| Group stroke, segmented-track stroke, sidebar trailing edge | black 6–8% / white 10–12% (L376, L393, L403) | `liquid/sidebar/selection` (`#00000012` / `#ffffff1a`) |
| Row dividers, toolbar-group dividers | black 8% (L393; frames 0.5px) | `liquid/state/hover-overlay` (`#1d1d1f0f` / `#f5f5f714`) |

**Text roles:**

| Role | Recipe |
| --- | --- |
| L.window-title | T.heading: `font/heading` (Inter) + `type/heading/*` (15/18 Semi Bold −0.075) |
| L.sheet-title | T.title (22/28 Bold −0.33) |
| L.amount | Literal 30/36 Bold, −1.5% (L85-91) |
| L.body | T.body (13/17 −0.052), the macOS body size |
| L.strong | T.strong (13/17 Medium): IDs, totals and actions (L349-350) |
| L.emphasis | `type/body/size` and `/line` (13/17) + literal Semi Bold (L127): selection and prominent labels |
| L.row | Literal 14/18 Regular, −0.4% (L113-119): grouped rows; sheet actions use it in Semi Bold (`96:854`) |
| L.helper | T.small (12/16 +0.036) |
| L.caption | T.caption (11/14 Semi Bold +0.033), title case: table and menu headers |
| L.caption-upper | T.label (11/14 Semi Bold +0.22) + text case UPPER, `text/muted`: sidebar captions (+2%). Sheet captions use tracking 0.33 (+3%, L347) |
| No mono | Where the base binds T.mono (kbd, shortcuts, breadcrumb, URLs), bind L.helper instead |

## 3. Liquid recipes (referenced by the component rows)

- **L.prominent** (L196-206, L400; `93:849`).
  - Full pill, 36 (`space/control/height`), padding 0/15/0/13, gap 6, 15px icon.
  - Label L.emphasis; label and icon `liquid/primary/fg`.
  - Fill `liquid/primary/default`, with the on-accent rim (§2) and an INNER_SHADOW 0 1 0 top
    highlight in `liquid/effect/specular`.
  - Copy the effect stack from `93:849`, including its toolbar `GLASS`.
- **L.control: control glass** (L308-309, L378, L401; `93:810`, `93:815`, `93:827`, `93:844`).
  - Fill `liquid/material/glass-control`.
  - Effects in order:
    - DROP_SHADOW spread 0.5 in `liquid/effect/outline`;
    - DROP_SHADOW x −0.75, blur 0.25 in `liquid/effect/side`;
    - DROP_SHADOW x 0.75, blur 0.25 in `liquid/effect/side`;
    - INNER_SHADOW 0 1 0 in `liquid/effect/specular`;
    - `GLASS` 0.35 / 12 / 0.15 / 0.85.
  - Plus the 1px toolbar-item stroke (§2). No drop shadow beyond these (L423).
  - Full pill, 36 tall. Inner buttons are 32×28 pills holding 17px glyphs in `text/fg`.
    Dividers are 1×16 (§2 row-divider stand-in).
- **L.float: float glass** (L305-307, L379; sheet `96:780`, bar `95:902`).
  - **Sheet weight:** fill `liquid/material/glass-sheet`, DROP_SHADOW 0 16 40 in `effect/shadow`.
  - **Bar weight:** fill `liquid/material/glass-float`, DROP_SHADOW 0 8 24 in `effect/shadow`.
  - Both weights also take the gradient rim, the 0.5 float outline, the INNER_SHADOW 0 1 0
    highlight in `liquid/effect/specular`, the inner glow 20 (§2), and `GLASS` 0.55 / 22 / 0.25 /
    0.90 at −50°.
  - Radius 22 (L390). Copy the stacks from the crafted nodes, then rebind the colours per §2.
  - Content inside stays opaque or sits on `surface/raised` groups. Never put glass on content
    (L386, L421).
- **L.thumb** (L380; `95:793`). Fill `tabs/sel-bg` (= `material/fill-strong`), the gradient rim,
  DROP_SHADOW 0 1 4 in `effect/control-shadow`, and `GLASS` 0.55 / 22 / 0.25 / 0.90.
- **L.secondary.** Fill `material/track`; label and icon `text/fg`; no rim or effect (the sheet
  Cancel, L400; `96:853`).
- **L.bar-action.** No fill. 15px icon and L.strong label in `primary/text`; padding 0/10, gap 6
  (L400, L445; `95:906`).
- **L.group: inspector section** (L272-278, L391-393; `96:796`). Use it only inside the sheet and
  the dialog.
  - **Caption:** L.caption-upper at +3%, `text/muted`, 6 above the group.
  - **Group:** `surface/raised`, radius 12 (literal), 1px INSIDE group stroke (§2 stand-in).
  - **Rows:** 44 tall (`space/control/height-lg`), inset 15. Label L.row `text/fg`; value L.row
    `text/muted`; trailing 13px `chevron-right` in `text/muted`.
  - **Dividers:** 1px row-divider stand-in, inset 15.
  - **Spacing:** sections sit 14 apart.
- **L.selected** (L242-251, L424; theme-character §2.1). Fill `liquid/primary/default`, radius 8;
  label and every glyph `liquid/primary/fg`. White text appears only on this blue.
- **L.grey-select** (L178-184, L327-328, L408). Fill `liquid/sidebar/selection` and a label in
  L.emphasis. Never blue.
- **L.segmented** (L222-234, L403; `95:792`).
  - **Track:** 34 tall, full pill, `tabs/track` (= `material/track`), with the 1px group-stroke
    stand-in, padding `tabs/pad` (2), gap `tabs/gap` (0).
  - **Segments:** 30-tall pills that fill the track equally. Label `type/strong` (13/17 Medium)
    in `text/fg`, Semi Bold when selected. Count 11/14 in `text/muted`, 5 after the label.
  - **Selected:** L.thumb.
- **L.field** (L410; `96:812`).
  - 28 tall, radius `radius/input` (7), fill `surface/card`.
  - 1px INSIDE `liquid/border/input` at rest (not drawn; L410, L428).
  - Padding 0/9; value L.body `text/fg`.
- **L.focus** (`Liquid/.Focus ring`; L410, L430-431; `96:812`, `97:1050`).
  - A solid 3px `liquid/border/ring` band with no gap.
  - The `focus-ring` frame sits 2px outside root on every side, at root radius + 2, with a 3px
    INSIDE stroke: 1px overlaps the control's edge and 2px sit outside. `focus/ring-offset` is 0
    in Liquid.
  - Never a translucent halo. Use it on every control.
- **L.switch** (L279-290, L412; `96:832`, `96:836`).
  - Track 46×28 (`size/switch/width` and `/height`), full pill.
  - Knob 24 (`size/switch/thumb`) in `switch/thumb`, at x20 when on and x3 when off. Shadows:
    DROP_SHADOW 0 2 6 in `effect/shadow` and DROP_SHADOW 0 0 1 in `liquid/effect/shadow` (18% and
    8% in Light).
  - On: `liquid/switch/on-track`. Off: `material/track` plus a 1px INSIDE `liquid/border/input`
    edge.
- **L.close.** A 30 circle in `material/track` with a 14px `x` in `text/muted` (`96:787`).
- **L.toolbar** (L163, L308, L377; `93:808`, `93:809`). A 52 band filled
  `liquid/toolbar/scroll-edge` with a BACKGROUND_BLUR of 6 and a 1px bottom rule in
  `liquid/toolbar/hairline`. Groups sit at y8, 10 apart.
- **L.traffic.** Three 14px discs at a 23px pitch (x18, x41, x64; y19, centred on the 52 row) in
  `liquid/window/close`, `/minimize` and `/zoom` (L359; `93:747`–`93:749`).
- **L.avatar.** A 28px (`size/avatar/md`) disc in `liquid/tag/orange` with 11px Semi Bold initials
  in literal `#000000`. Never white initials (L425-427; `93:803`).
- **L.states.** All (derived); states are pending in #2416 (L453-457).
  - **Hover:** the `state-layer` shows `liquid/state/hover-overlay` at 100% layer opacity (the
    role carries its 6% / 8% alpha). L.prominent and L.selected take `liquid/primary/hover`.
  - **Pressed:** lensing intensifies. On glass parts, raise the `GLASS` refraction from 0.35 to
    0.55 (the float value); the hover overlay stays. Non-glass controls keep the hover overlay.
  - **Focus:** L.focus.
  - **Disabled:** root opacity `state/disabled-opacity` (38%), the base R.disabled.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Liquid anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Liquid's spec does not draw; the derivation uses only
the recipes above.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Liquid/Icon`, `Liquid/Spinner`, `Liquid/.Focus ring` and
`Liquid/.State layer`.

| Style set | Base set | Liquid anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Liquid/Icon` (and `Liquid/Icon/<glyph>`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** Lucide is Liquid's SF Symbols stand-in (L444), so create no `Liquid/Icon/<glyph>`: keep the base `glyph` swap and the base `Icon/*` glyphs. Stroke `icon/stroke` (2). **Sizes:** sm 14 (chevrons, close), md 16, lg 17 (nav and toolbar; `size/icon/lg` is 17). The 15px bar, search and New Order glyphs are instance sizes | `text/fg` via the parent |
| `Liquid/Spinner` | `Spinner` `252:11837` | (derived; Liquid draws none) The base ring and arc: ring `material/track`, arc in the parent's label role (default `text/fg`), round caps | `material/track` |
| `Liquid/.Focus ring` | `.Focus ring` `252:11805` | L.focus | `liquid/border/ring` |
| `Liquid/.State layer` | `.State layer` `252:11806` | Hidden by default. Fill `liquid/state/hover-overlay`, layer opacity 100% | `liquid/state/hover-overlay` |
| `Liquid/Button / md` | `Button / md` `253:372` | 36, full pill. **primary:** L.prominent (New Order). **secondary:** L.secondary at 36, label L.emphasis. **outline:** (derived) an L.control capsule with a label, the toolbar item with text (L378, L401). **ghost:** L.bar-action. **destructive:** (derived) L.secondary with label and icon in `destructive/text`; even Refund is a `primary-text` action (L326-327), and no destructive fill is documented. **link:** `primary/text` L.strong; the `underline` part is 1px `primary/text`, shown on hover and pressed (derived). States: L.states. `loading` shows `Liquid/Spinner` in the label role | `liquid/primary/*`, `liquid/material/glass-control`, `liquid/effect/*`, `material/track`, `primary/text`, `destructive/text` |
| `Liquid/Button / lg` | `Button / lg` `254:721` | The sheet action: 40 tall, radius 20 (L400; `96:853`, `96:855`), label L.row Semi Bold, padding 0/20. primary is Save, secondary is Cancel; the other variants use the md recipes at 40 | as md |
| `Liquid/Button / sm` | `Button / sm` `254:371` | The bar action: 32 tall, radius 16 (L400; `95:906`), padding 0/10, gap 6, 15px icon, L.strong label. ghost is the documented action; the other variants use the md recipes at 32 | as md |
| `Liquid/Button / xs` | `Button / xs` `254:1071` | (derived) 24 (`space/control/height-xs`), radius 12, padding 0/8, 14px icon, label 12/16 (`type/small/size`, `/line`) Medium | as md |
| `Liquid/Icon button / md`, `/ lg`, `/ sm`, `/ xs` | `255:262`, `255:740`, `255:501`, `255:979` | Circles, W = H: md 36, lg 40, sm 30 (the close circle, `space/control/height-sm`), xs 24. **outline:** an L.control circle holding a 17px glyph in `text/fg` (the sidebar toggle, `93:810`). **primary:** an L.prominent circle. **secondary:** L.close. **ghost:** no fill, glyph `text/fg` (More, `95:923`). **destructive:** (derived) L.close with the glyph in `destructive/text`. Glyph 17 (md, lg), 14 (sm, xs) | as Button |
| `Liquid/Button group` | `Button group` `257:839` | One control-glass capsule holding icon-only items (component-spec A3; `93:815`, `93:827`): L.control, padding 4/5, items `Liquid/Icon button / sm` ghost overridden to the frame's 32×28 inner button, with 1×16 dividers as the `separator` part. md is 36; sm 30 and lg 40 scale the padding (derived). `text`: L.body `text/muted` | `liquid/material/glass-control`, `liquid/effect/*`, `liquid/glass/edge` |
| `Liquid/Toggle / md`, `/ sm`, `/ lg` | `256:281`, `256:437`, `256:593` | (derived) Full pills at 36, 30 and 40. **Off:** no fill, label L.strong `text/fg`. **Selected:** L.grey-select. **Hover:** L.states. **outline:** an L.control capsule; when selected, the grey fill sits inside the glass. Focus and disabled as Button | `liquid/sidebar/selection` |
| `Liquid/Icon toggle / md`, `/ sm`, `/ lg` | `276:8291`, `276:8431`, `276:8571` | As Toggle, circular, with 17px glyphs | as Toggle |
| `Liquid/Toggle group` | `Toggle group` `257:528` | **segmented:** L.segmented. md is the 34 track with 30 segments; sm is a 30 track with 26 segments (derived). **default:** separate `Liquid/Toggle`s, gap 10 (the toolbar group spacing, `93:809`). **outline:** one L.control capsule holding the toggles with 1×16 dividers (`93:827`) | `tabs/*`, `material/track` |
| `Liquid/Action bar` | `Action bar` `258:663` | **floating:** the selection bar (L252-261, L365, L413; `95:902`). L.float bar weight, 44 tall, radius 22, padding 6/7, gap 4. `count` is L.emphasis `text/fg` in a 32 cell with padding 0/10. `separator` is a 1×18 divider. `actions` holds bar actions. `close` is `Liquid/Icon button / sm` ghost. **inline:** (derived) an opaque `surface/muted` row at radius 8 (the zebra fill, L235-241) with an L.emphasis count. It is content, so no glass | `liquid/material/glass-float`, `effect/shadow`, `surface/muted` |
| `Liquid/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Liquid/Button / sm` ghost (bar actions) | — |
| `Liquid/Theme toggle` | `Theme toggle` `258:742` | `Liquid/Icon button / md` outline (a control-glass circle, `93:810`) with moon and sun | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Liquid anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Liquid/Label` | `Label` `278:45` | **default:** L.body `text/fg`. **eyebrow:** L.caption-upper at +3% (the sheet caption). **invalid:** stays `text/fg` (derived from `96:817`, where the value and the helper carry the error). `required-mark` `destructive/text`; `optional-hint` L.helper `text/muted`. Disabled `text/muted` | — |
| `Liquid/Input` | `Input` `279:312` | **Rest.** L.field: md 28 (L410); sm 24 (`space/control/height-xs`, derived). Placeholder L.body `text/muted`; icons 15 in `text/muted`. Theme-only part `caret`: 1.5×16 `liquid/border/ring`, shown on focus (`96:814`). **Hover:** L.states. **Focus:** L.focus plus `caret`. **Invalid:** (derived from `96:815`) edge `destructive/text`, value `destructive/text` in L.strong, and a trailing 15px `alert-circle` in `destructive/text`. **invalid-focus:** the L.focus band (still `liquid/border/ring`) with the invalid value and glyph. **Disabled:** L.states | `surface/card`, `liquid/border/*`, `destructive/text` |
| `Liquid/Textarea` | `Textarea` `280:597` | The L.field recipe, minimum 80, padding 6/9 (derived). `counter` L.helper `text/muted`; `resize-handle` a 13px `grip-vertical` in `text/muted` | as Input |
| `Liquid/Select` | `Select` `281:1023` | (derived) The L.field trigger at 28 with a 13px `chevron-down` in `text/muted`. **Open:** chevron `chevron-up`; content is `Liquid/Select content` 4px below | as Input |
| `Liquid/Select content` | `Select content` `281:826` | `Liquid/Menu content` holding `Liquid/Menu item` `type=option` | — |
| `Liquid/Checkbox` | `Checkbox` `283:1470` | (derived; Liquid draws no checkbox) 20 (`size/checkbox`) at radius `radius/input` (7): a rounded square, never Cupertino's circle (L440). **Unchecked:** `surface/card` with a 1px INSIDE `liquid/border/input` (the editable edge, L428). **Checked:** `liquid/primary/default` with a 12px `check` in `liquid/primary/fg`, the selected-row pairing (L242-251, L424). **Indeterminate:** a `minus` in the same colours. **Hover:** L.states. **Invalid:** edge `destructive/text`. Focus L.focus on `control`. Label L.body `text/fg`, description L.helper `text/muted` | `liquid/primary/*`, `liquid/border/input` |
| `Liquid/Radio` | `Radio` `284:1828` | (derived) A 20 circle. **Unchecked:** as the Checkbox well. **Checked:** a `liquid/primary/default` disc with the base 8×8 `indicator` ellipse in `liquid/primary/fg` | as Checkbox |
| `Liquid/Radio group` | `Radio group` `284:1885` | Nests `Liquid/Radio` | — |
| `Liquid/Switch` | `Switch` `285:2329` | L.switch on `track`. **sm** resolves to the same 46×28 (Theme B aliases `size/switch/*-sm` to the md values). The `thumb` ellipse stays an ellipse. **Hover:** identical to rest (derived). **Focus:** L.focus on `track`. **Invalid:** (derived) the off-track edge in `destructive/text`. **Disabled:** L.states. Label L.row `text/fg` (`96:831`) | `liquid/switch/on-track`, `material/track`, `liquid/border/input`, `switch/thumb`, `effect/shadow` |
| `Liquid/Field` | `Field` `287:2656` | Nests `Liquid/Label` and `Liquid/Input`. **vertical:** label above, gap 4. **horizontal:** the inspector row (`96:810`): 44 tall, label L.row `text/fg` filling the left, the 176-wide control on the right, gap 8. **invalid:** the label stays `text/fg`; `error` is L.helper `destructive/text` under the line, and `error-icon` is a 15px `alert-circle` in `destructive/text`. The row grows from 44 to 76 (`96:815`). `description` L.helper `text/muted` | `destructive/text` |
| `Liquid/Field set` | `Field set` `287:2743` | L.group, an inspector section. Use it inside `Liquid/Sheet` and `Liquid/Dialog`, never as a card on the content canvas (L440). `legend` is the caption: L.caption-upper at +3% for `variant=legend`, L.caption (title case) for `variant=label`. `group` is the `surface/raised` r12 group holding horizontal Fields with inset dividers. `separator` hidden. `description` L.helper `text/muted` | `surface/raised`, stand-ins of §2 |
| `Liquid/Input group` | `Input group` `297:3861` | The `Liquid/Input` frame. The addon is a 15px glyph in `text/muted`, L.helper `text/muted` text, or `Liquid/Icon button / xs` ghost | — |
| `Liquid/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is its own L.field, 36×36 (`space/control/height`), radius 7. Character L.window-title `text/fg`; `caret` 1.5×16 `liquid/border/ring`. Focus L.focus. Invalid: edge `destructive/text`. Slots never share edges | as Input |
| `Liquid/Input OTP` | `Input OTP` `301:4490` | Group gap 6 instead of −1; the separator is a 13px `minus` in `text/muted` | — |
| `Liquid/Slider` | `Slider` `303:5022` | (derived) **Track:** 4 tall, full pill, `material/track`. **Range:** `liquid/accent/system`, the system accent the frames bind on the caret and focus. The accent policy keeps `liquid/primary/default` off it (L325-326). **Thumb:** the L.switch knob at 20, white in both schemes. `value-label` L.strong `text/muted` | `liquid/accent/system`, `switch/thumb`, `effect/shadow` |
| `Liquid/Combobox` | `Combobox` `305:5623` | `Liquid/Input` plus `Liquid/Menu content`. Chips are `Liquid/Badge` subtle with `remove` | — |
| `Liquid/Calendar day` | `Calendar day` `307:6154` | (derived) A 30 circle (`space/control/height-sm`), label L.body `text/fg`. **Rest:** no fill. **Hover:** L.states. **today:** label `liquid/accent/system` in L.emphasis. **selected, range start and end:** L.selected as a circle. **range-middle:** a `liquid/sidebar/selection` band with no radius (grey selection). **outside:** `text/muted`. **Disabled:** L.states | `liquid/primary/*`, `liquid/accent/system`, `liquid/sidebar/selection` |
| `Liquid/Calendar` | `Calendar` `309:8620` | (derived) Opaque content: `surface/card` at `radius/card` (14), padding 14/16 (the platter, L207-214). Caption L.window-title; weekdays L.caption `text/muted`; nav `Liquid/Icon button / sm` ghost; month select `Liquid/Select` sm. Inside a popover, the popover provides the glass | — |
| `Liquid/Date picker` | `Date picker` `313:14889` | `Liquid/Select` trigger with a `calendar` glyph; open is `Liquid/Popover` with `Liquid/Calendar` | — |
| `Liquid/Search` | `Search` `316:16426` | An L.control capsule. **md** is 220×36 (L402; `93:844`): a 15px magnifier at x13 and the label L.body `text/muted` at x34. **sm** (derived) is 30 tall with the same recipe. `kbd` `Liquid/Kbd`. **Hover:** L.states. **Focus and open:** L.focus | `liquid/material/glass-control`, `liquid/effect/*` |
| `Liquid/Dropzone` | `Dropzone` `319:16832` | (derived) An opaque platter: `surface/muted` at radius 14, padding 16, with a dashed [4,4] 1px `liquid/border/input` edge. Icon 17px `upload` in `text/muted`; label L.emphasis; hint L.helper `text/muted`. **active:** edge `liquid/border/ring`. **uploading:** a 4px full-pill `material/track` bar filled `liquid/accent/system`. **invalid:** edge and status in `destructive/text` | `surface/muted`, `liquid/border/*`, `liquid/accent/system` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Liquid anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Liquid/Location marker` | `Location marker` `337:22` | (derived) sm 4 and md 6 circles in `liquid/accent/system`, like the 7px status dots (L329). `deco/marker` is false, so parents keep it hidden | `liquid/accent/system` |
| `Liquid/Breadcrumb item` | `Breadcrumb item` `338:92` | (derived) Inter, never mono. **Link:** L.body `text/muted`, `text/fg` on hover. **Current:** L.emphasis `text/fg`. **separator:** a 13px `chevron-right` in `text/muted` (L445). **Ellipsis:** `more-horizontal` in `text/muted` | — |
| `Liquid/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Liquid/Breadcrumb item`, gap 4 | — |
| `Liquid/Page key` | `Page key` `339:270` | (derived) A 32 pill (the bar-action geometry), minimum width 32, label L.strong `text/fg`. **Hover:** L.states. **current:** L.grey-select. **previous and next:** `Liquid/Button / sm` ghost with chevrons. **Ellipsis:** L.body `text/muted`. **Disabled:** L.states | `liquid/sidebar/selection` |
| `Liquid/Pager tile` | `Pager tile` `339:319` | (derived) A platter: `surface/muted` at `radius/card` (14), padding 14/16 (L207-214). `direction` L.caption `text/muted`; `title` L.emphasis `text/fg` | `surface/muted` |
| `Liquid/Pagination` | `Pagination` `339:379` | `meta` L.helper `text/muted`; nests `Liquid/Page key` and `Liquid/Pager tile` | — |
| `Liquid/Tab / horizontal` | `Tab / horizontal` `342:402` | **default and segmented:** an L.segmented segment, a 30 pill; selected is L.thumb with a Semi Bold label. `count` is `Liquid/Badge` plain without `dot`, 11/14 in `text/muted`. **line:** (derived; Liquid draws only the segmented control) no thumb, a Semi Bold selected label plus a 2px `text/fg` underline. **Hover:** L.states. `marker` stays hidden. Focus L.focus. Disabled L.states | `tabs/*`, `effect/control-shadow` |
| `Liquid/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal. `line` puts the 2px bar on the inline-start edge | as horizontal |
| `Liquid/Tabs list` | `Tabs list` `343:424` | **default and segmented:** the L.segmented track. **line:** no track, gap 16 (derived) | `tabs/*` |
| `Liquid/Tabs` | `Tabs` `343:489` | Nests `Liquid/Tabs list` | — |
| `Liquid/Nav item` | `Nav item` `345:601` | 32 tall, radius `nav/radius` (10), padding-x 10, gap 10 (`93:753`). A 17px icon tinted per destination (`liquid/accent/system`, `liquid/tag/green`, `/purple`, `/red`; L408, L444). Label L.body `text/fg`; `count` is `Liquid/Badge` plain without `dot` (L.helper `text/muted`). **selected:** L.grey-select through `nav/active` (= `liquid/sidebar/selection`). **Hover:** L.states. Level 2 indents 24. **Collapsed:** a 32 icon-only square, radius 10. Channel rows are 30 tall with an 8px tag dot (`93:786`). `marker` hidden | `nav/active`, `liquid/accent/system`, `liquid/tag/*` |
| `Liquid/Nav group` | `Nav group` `346:611` | Group label L.caption-upper (+2%) in a 30-tall frame with the text at y14 (`93:752`). Items gap 2. Nests `Liquid/Nav item` | — |
| `Liquid/Sidebar` | `Sidebar` `347:994` | Edge-to-edge sidebar glass (L301-304, L376; `93:746`): 240 wide (`space/sidebar/width`), full height, no radius of its own. Fill `liquid/material/glass-sidebar`, BACKGROUND_BLUR 60, an INNER_SHADOW 0 1 0 in `liquid/effect/specular`, and a 1px trailing edge (§2 stand-in). Padding 10. **Header:** theme-only part `traffic-lights` (L.traffic); `brand-group` hidden, because Liquid shows no brand row. **Body:** `Liquid/Nav group`s. **Footer:** the account, an L.avatar plus name L.body Medium and role 11/14 `text/muted` (`93:802`). **Variants:** `sidebar` and `floating` are both the edge-to-edge column (derived; a floating r26 sidebar is Cupertino's, L440). `inset` adds an opaque `surface/card` content area at radius 16 (the window radius) | `liquid/material/glass-sidebar`, `liquid/effect/specular` |
| `Liquid/Top bar` | `Top bar` `351:1349` | The toolbar band (L357-359; `93:809`): L.toolbar, padding 8/20 (`93:809` sits 12 inside the band and insets its groups by 8), gap 10. **app desktop:** in `topbar-start`, `Liquid/Sidebar toggle`, then a theme-only part `history` (a `Liquid/Button group` with back and forward, `93:815`), then a theme-only part `window-title` (L.window-title over an 11/14 Regular `text/muted` subtitle, `93:823`). `brand` and Breadcrumb hidden. In `topbar-end`, a theme-only part `view-group` (a `Liquid/Button group` with filter, sort and export, `93:827`), `Liquid/Search` md, and `Liquid/Button / md` primary "New Order" (116, `93:849`). The Theme toggle is a glass circle; the avatar is hidden (the account lives in the sidebar). **docs:** (derived) `Liquid/Navigation menu` after the title. **mobile:** (derived) the same 52 band with the sidebar toggle, the window title and New Order. Traffic lights stay in the sidebar | `liquid/toolbar/*` |
| `Liquid/.Brand logo` | `.Brand logo` `344:410` | (derived; Liquid draws no brand) A 24 tile at radius 7 in `liquid/primary/default`, holding the base N mark in `liquid/primary/fg`. Only the docs Top bar shows it | `liquid/primary/*` |
| `Liquid/Nav menu item` | `Nav menu item` `349:1036` | (derived) A 28 pill (the inner toolbar button), label L.body `text/fg`. **Hover:** L.states. **selected:** L.grey-select. **open:** as selected, with the chevron rotated 180° | `liquid/sidebar/selection` |
| `Liquid/.Nav menu link` | `.Nav menu link` `348:1108` | A `Liquid/Menu item`-style 16-radius row. Title L.emphasis; description L.helper `text/muted`. **Highlighted:** `liquid/primary/default` with both texts in `liquid/primary/fg` | `liquid/primary/*` |
| `Liquid/Navigation menu` | `Navigation menu` `349:1132` | The viewport is `Liquid/Menu content` | — |
| `Liquid/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) A 28 pill, label L.body `text/fg`. **Hover:** L.states. **open:** L.grey-select | `liquid/sidebar/selection` |
| `Liquid/Menubar` | `Menubar` `349:1236` | (derived) The root is an L.control capsule, 36 tall, padding 4: a toolbar group (L378). Menus are `Liquid/Menu content` | `liquid/material/glass-control`, `liquid/effect/*` |
| `Liquid/Step` | `Step` `352:1355` | (derived) **indicator:** a 24 circle. **complete:** `liquid/primary/default` with a `check` in `liquid/primary/fg`. **current:** a 2px `liquid/border/ring` ring with an L.emphasis number in `text/fg`. **upcoming:** a `material/track` disc with the number in `text/muted`. **error:** a `liquid/tag/red` disc with an `x` in `liquid/primary/fg` (status hues, L329-331). Title L.emphasis; description L.helper `text/muted`. **connector:** 2px `material/track`; complete is `liquid/accent/system` | `liquid/*`, `material/track` |
| `Liquid/Stepper` | `Stepper` `352:1424` | Nests `Liquid/Step` | — |
| `Liquid/Sidebar toggle` | `Sidebar toggle` `344:462` | Nests `Liquid/Icon button / md` outline (the 36 glass circle with a 17px `panel-left`, `93:810`) for desktop and `/ lg` outline for mobile, with `panel-left`, `menu` and `x` | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Liquid anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Liquid/.Kbd` | `.Kbd` `370:31` | Retired to the Overlays Draft area: build `Liquid/Kbd` in 4.5 instead. Every former `.Kbd` reference now points at `Liquid/Kbd` | — |
| `Liquid/Menu item` | `Menu item` `371:587` | (derived from the bar actions, `95:906`) A 32-tall pill row at radius 16, padding-x 10, gap 6, 15px icon in `text/fg`, label L.body `text/fg`. **highlighted:** `liquid/primary/default`, with label, icons and shortcut in `liquid/primary/fg` (the selected-row pairing, L242-251; theme-character §2.1). **destructive:** label and icon `destructive/text`; highlighted adds `destructive/subtle`, not blue (L325-326). **Indicators:** checkbox, radio and option show a 13px `check` in `text/fg` (`liquid/primary/fg` when highlighted). **submenu:** a 13px `chevron-right` in `text/muted`. `shortcut` is `Liquid/Kbd` sm | `liquid/primary/*`, `destructive/*` |
| `Liquid/Menu label` | `Menu label` `373:35` | L.caption (title case) `text/muted`, padding 10/4. Not the uppercase grouped caption | — |
| `Liquid/Menu separator` | `Menu separator` `373:38` | A 1px row-divider stand-in (§2), inset 10, with 4px margins | — |
| `Liquid/Menu group` | `Menu group` `373:248` | Nests `Liquid/Menu label` and `Liquid/Menu item` | — |
| `Liquid/Menu content` | `Menu content` `373:256` | (derived from the selection bar) L.float bar weight, radius 22, padding 6. The bar insets its 32 actions by 6, so 22 − 6 = 16 stays concentric with the rows. Minimum width 192. Never a grouped card (L440) | `liquid/material/glass-float`, `effect/shadow`, stand-ins of §2 |
| `Liquid/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Liquid/Button / md` outline (control glass) plus a 13px `chevron-down`; `Liquid/Menu content` 4px below | — |
| `Liquid/Context menu` | `Context menu` `374:653` | The trigger area is a dashed 1px `liquid/border/input` frame at radius 12, with L.helper `text/muted`; `Liquid/Menu content` at the pointer | `liquid/border/input` |
| `Liquid/Dialog` | `Dialog` `378:743` | L414: the inspector-sheet recipe at radius 22. `content`: L.float sheet weight, padding 17 (L364), gap 14. `backdrop` `surface/overlay`. `title` L.sheet-title; `description` L.body `text/muted`. `close`: L.close through `Liquid/Icon button / sm` secondary. `body`: L.group sections. `footer`: pinned actions, `Liquid/Button / lg` secondary "Cancel" and primary "Save", equal widths, gap 10 (`96:852`) | `liquid/material/glass-sheet`, `surface/overlay` |
| `Liquid/Alert dialog` | `Alert dialog` `378:880` | As Dialog, with no close. `media`: (derived from the banner, `95:785`) a 40 tile at radius 12, filled `warning/subtle` or `destructive/subtle`, holding a 16px glyph in `liquid/tag/orange` or `liquid/tag/red` (`liquid/tag/gray` for default). `cancel` is the secondary button; `action` is primary, or the destructive variant | `<tone>/subtle`, `liquid/tag/*` |
| `Liquid/Sheet` | `Sheet` `379:1004` | The inspector sheet (L262-271, L363-364, L409; `96:780`). L.float sheet weight, detached 12px from the edges, radius 22 on all four corners, with the rim on every side (not the base inner edge). Width 360 for left and right; top and bottom are full width minus 24 (derived). Padding 17. Header: L.sheet-title, an L.body `text/muted` subtitle, and the 30px L.close. Body: L.group sections 14 apart. Footer: pinned actions as Dialog. `handle` stays in the tree with no fill: there is no grabber (`96:781`) | `liquid/material/glass-sheet` |
| `Liquid/Drawer` | `Drawer` `379:1150` | As Sheet. Top and bottom keep the `handle` part with no fill (derived; no grabber). Footer buttons are `Liquid/Button` | — |
| `Liquid/Popover` | `Popover` `381:937` | (derived) L.float bar weight, radius 22, padding 17. `title` L.emphasis; `description` L.helper `text/muted`. `arrow` kept, filled `liquid/material/glass-float` with no rim; Liquid floats draw no arrow | `liquid/material/glass-float` |
| `Liquid/Tooltip` | `Tooltip` `381:1030` | (derived) A small L.float bar-weight pill: 24 tall, full pill, padding 0/10, label L.helper `text/fg`. `kbd` is `Liquid/Kbd` default, because the chip is glass, not inverse. `arrow` kept with no fill | `liquid/material/glass-float` |
| `Liquid/Hover card` | `Hover card` `381:1093` | (derived) L.float bar weight, radius 22, padding 17. The avatar is `Liquid/Avatar` md (L.avatar). Title L.emphasis; description L.helper `text/muted`; meta L.caption `text/muted` | — |
| `Liquid/Command item` | `Command item` `382:1015` | (derived from the table row, L235-251) 40 tall, radius 8, padding-x 10. Label L.strong `text/fg`; `url` and `excerpt` L.helper `text/muted` (no mono); `kind` L.caption `text/muted`; `hash` 13px in `text/muted`; `shortcut` `Liquid/Kbd` sm. **selected:** L.selected plus the `corner-down-left` glyph, instead of the base 2px marker bar | `liquid/primary/*` |
| `Liquid/Command palette` | `Command palette` `383:1355` | The Dialog recipe at width 640. `input-row`: padding 12/17 holding an L.control search capsule (36) and `Liquid/Kbd` "esc". `filters`: `Liquid/Toggle group` segmented. `list`: padding 6/17; `group-label` L.caption (title case); items are `Liquid/Command item`, with no grouped cards. `footer`: no fill, a top 1px row-divider stand-in, L.helper `text/muted` | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Liquid's data display is opaque content under the glass: tinted dot-and-word status, KPI platters,
a bare zebra table with a deep-blue selected row and colourful avatars, and the sheet's status pill
(L321-336, L386, L404-409; `95:766`, `95:805`, `96:793`). Nothing here takes glass, and nothing
here is an r12 grouped card except inside a sheet (L440).

| Style set | Base set | Liquid anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Liquid/Kbd` | `Kbd` `403:28` | (derived; Liquid draws no key) md 20 (`size/kbd`), sm `size/kbd-sm`, minimum width = H. **default:** `material/track` fill, no border, radius `radius/input` (7), label L.helper `text/muted` in Inter instead of Fragment Mono (L341). **inverse:** the base `tooltip/kbd` fill, `tooltip/border` stroke and `tooltip/muted` label. It replaces `.Kbd` for Search, Tooltip, Command item, Command palette and the Menu item shortcut (sm) | `material/track`, `tooltip/*` |
| `Liquid/Kbd group` | `Kbd group` `403:96` | Nests `Liquid/Kbd`; the "+" separator is L.helper `text/muted`, gap 4 (base) | — |
| `Liquid/Badge` | `Badge` `405:180` | Status is a 7px dot plus a word (L329, L404; `95:825`), and the sheet's status pill (L409, L434-436; `96:793`). **Hue per tone** (scheme-correct Apple system hues, L330-331): success `liquid/tag/green`, warning `liquid/tag/orange`, destructive `liquid/tag/red`, info `liquid/accent/system`, neutral `liquid/tag/gray`. **plain:** a 7px circle dot in the hue, gap 6, word L.body `text/fg`, no container (table cells, `95:824`); with `dot` off it is the count, L.helper `text/muted`. **subtle:** the status pill (`96:793`): 24 tall, full pill, padding 0/10, the 7px dot then the word at 12/16 Medium. The tint is a theme-only part `tint`, an absolute fill rectangle in the hue at layer opacity 14% (12% for success, L406); paint opacity on a bound fill is dropped (component-spec §0.4). **Dot and word ink:** info `liquid/status/shipped-fg`, never `liquid/primary/text` (4.10:1, L434-436); success `liquid/success/text` (L432, L469; its Dark `#30d158` stands in for the crafted core `success/text` `#71d083` until #2414 picks one role, L496-497); warning `warning/text`, destructive `destructive/text`, neutral `text/muted` (derived). **outline:** (derived) the subtle pill with no tint and a 1px INSIDE `liquid/sidebar/selection` hairline (§2 stand-in). **solid:** (derived) a 24 pill filled with the hue and the word in literal `#000000`: white fails on these hues, so it follows the avatar-initials rule (L425-427). Inside L.selected, dot and word turn `liquid/primary/fg` (`95:853`). `iconStart` 13px; `remove` a 13px `x` in the ink role | `liquid/tag/*`, `liquid/accent/system`, `liquid/status/shipped-fg`, `liquid/success/text` |
| `Liquid/Badge / kind` | `Badge / kind` `405:211` | (derived; Liquid draws no API tags) The plain status: a 7px dot in the kind's base role (`code/syntax/*` or `text/fg`) plus the kind word in L.helper `text/fg`, with no outline | `code/syntax/*` |
| `Liquid/Avatar` | `Avatar` `406:95` | Circles: sm 22 (table, `95:821`), md 28 (account, `93:803`), lg 40 (`size/avatar/*`). **initials:** a disc in an Apple hue with Semi Bold initials in literal `#000000` (§2): 9/12 on sm (L404), 11/14 on md, 15/18 on lg (derived). The default hue is `liquid/tag/orange`; instances rebind it to `liquid/tag/green`, `liquid/accent/system`, `liquid/tag/purple` or `liquid/tag/gray` (the table order, L404). Never white initials, never pastels (L425-427). Theme-only boolean `ring` (default false): a 1.5px OUTSIDE white ring at 90% (literal, the same in both windows; L394, L494) for L.selected rows (`95:849`). **fallback:** `liquid/tag/gray` with a `user` glyph in `#000000`. **agent:** (derived) `liquid/primary/default` with the `bot` glyph in `liquid/primary/fg`. **image:** clipped to the circle | `liquid/tag/*`, `liquid/accent/system`, `liquid/primary/*` |
| `Liquid/Avatar presence` | `Avatar presence` `406:43` | (derived) An 8×8 circle: online `liquid/tag/green`, away `liquid/tag/orange`, offline `liquid/tag/gray`, with the base 2px OUTSIDE `surface/card` ring | `liquid/tag/*` |
| `Liquid/Avatar group` | `Avatar group` `406:150` | (derived) Nests `Liquid/Avatar`, overlap −8, a 2px OUTSIDE `surface/card` ring on each. The count avatar is `liquid/tag/gray` with a black "+n" | — |
| `Liquid/Item` | `Item` `408:792` | The inspector activity row and grouped row (L272-278; `96:846`, `96:799`). **size default:** 48 tall: title L.row (14/18) `text/fg`, description L.helper `text/muted`, trailing meta L.helper `text/muted` (`96:848`–`96:850`). **sm:** 44, the grouped row (L276). **xs:** 32, the sidebar row height (derived). Padding-x 15 (L391). **variant default:** no container. **outline:** (derived) the L.group container (`surface/raised`, radius 12, stand-in stroke); use it in sheets and dialogs only. **muted:** a `surface/muted` platter at `radius/card` (14, L405), safe on content. `chevron` a 13px `chevron-right` in `text/muted` (`96:805`); `actions` `Liquid/Button / sm` ghost (a bar action). Media swaps to `Liquid/.Item icon tile`, `Liquid/.Item image` or `Liquid/Avatar`. **hover:** L.states. **focus:** L.focus | `surface/*`, stand-ins of §2 |
| `Liquid/Item group` | `Item group` `408:996` | The sheet's activity group (`96:840`): root without fill; it takes its container from its parent (`Liquid/Field set` or `Liquid/Sheet` sections). `separators=true` draws the row-divider stand-in (§2) between rows, inset 15 | stand-ins of §2 |
| `Liquid/.Item icon tile` | `.Item icon tile` `408:82` | (derived; Liquid tints glyphs and draws no tiles) A 32 circle in `material/track` holding a 17px glyph in `liquid/accent/system`, like the tinted nav icons (L408, L444). Never Cupertino's filled r7 tile | `material/track`, `liquid/accent/system` |
| `Liquid/.Item image` | `.Item image` `408:85` | 40×40 at `radius/input` (7) | — |
| `Liquid/Card` | `Card` `409:951` | **default:** a platter, the only content card (L207-214, L323, L386, L405; `95:767`). Fill `card/bg` (`#f0f0f3` / `#212225`, theme-character §2.4); no stroke (`card/border-*` 0); radius `radius/card` (14); no shadow and no glass (L386); padding 14/16 on md, 10/12 on sm (derived). `header`: title L.window-title, eyebrow L.caption-upper, description L.helper `text/muted`, `action` `Liquid/Button / sm` ghost (an inline `primary-text` action, like the banner's "Review", L326-327; `95:791`). `footer`: (derived) no `card/footer` fill and no rule; end-aligned `Liquid/Button / sm` actions. **hover:** L.states. **focus:** L.focus at radius 16. **selected:** (derived) an L.grey-select layer over the platter; grey, never blue (L327-328). **rule:** (derived) no fill, no radius, a 1px top rule in the row-divider stand-in (§2) | `card/bg`, `liquid/sidebar/selection` |
| `Liquid/Stat card` | `Stat card` `409:1270` | **default:** the KPI platter (L207-214, L405; `95:767`): 203×92, `kpi/bg-1` (= `surface/muted`), radius `radius/card` (14), no stroke (`kpi/border-*` 0), padding 14/16 (`kpi/pad-x` 16). **Head:** a theme-only part `dot`, an 8px circle in a `liquid/tag/*` hue (instances: green, red, orange), then the label at 12/16 Medium in `text/muted`, title case, gap 6 (`95:768`): never T.eyebrow. The base `icon` part stays hidden. **Value:** T.kpi-sm (26/32 Bold); Liquid's `type/kpi` is the 40/48 hero. **Delta:** one 11/14 Medium line holding a ▲ or ▼ text glyph, the value and "vs. previous 30 days", all in the delta colour (`95:772`): up `liquid/success/text`, down `destructive/text`. The base arrow icon stays hidden. No decorations: every `deco/*` is false in Liquid. **hero:** the revenue hero (L406; `93:738`): no platter fill, label L.body `text/fg`, value T.kpi (40/48 Bold), and the delta as a `Liquid/Badge` subtle success pill ("▲ 8.2%") followed by "vs. previous 30 days" in L.helper `text/muted`. The area chart belongs to Chart, not to Stat card | `kpi/*`, `liquid/tag/*`, `liquid/success/text`, `destructive/text` |
| `Liquid/Table header cell` | `Table header cell` `410:546` | 30 tall (`95:806`), padding-x 4 (`95:808`). Label L.caption (11/14 Semi Bold +0.3%) in `text/muted`, title case (L347, L404). **sort:** (derived) a 13px `chevron-down` or `chevron-up` after the label in `text/muted`; `none` shows no glyph. **hover:** L.states. **focus:** L.focus | `text/muted` |
| `Liquid/Table cell` | `Table cell` `410:383` | Row height 40 (literal; `space/table/row-height` is 52), padding-x 4 inside the row's 10 inset (`95:818`). **text:** L.body `text/fg` (name). **strong:** L.strong `text/fg` (order IDs, L349-350). **mono:** L.strong, Inter. **number:** L.strong `text/fg`, end-aligned (totals are Medium, L404; `95:830`). **muted:** L.body `text/muted` (date, `95:828`). `secondary`: L.helper `text/muted`. **badge:** `Liquid/Badge` plain (7px dot plus word, `95:824`). **avatar:** `Liquid/Avatar` sm (22) plus the name, gap 8 (`95:820`). **actions:** (derived) `Liquid/Icon button / sm` ghost with `more-horizontal`. **select:** (derived; the frame has no select column) `Liquid/Checkbox`. Inside L.selected every part turns `liquid/primary/fg` | `text/*` |
| `Liquid/Table row` | `Table row` `412:1187` | 40 tall, radius `table/row-radius` (8), no row rule (`table/row-rule-width` 0), padding-x 10 (L404; `95:817`). Fill `table/row-bg`. **zebra:** `table/zebra` (= `surface/muted`) on even rows (`95:831`). **hover:** L.states. **selected:** L.selected (`95:845`): `liquid/primary/default` with every glyph in `liquid/primary/fg` (white; never recolour it, L436-437), the avatar `ring` on, and a white status dot. The base 2px `marker/default` selection-bar part stays in the tree, hidden: the fill is the marker. **focus:** L.focus at radius 10. **disabled:** L.states. **stacked:** (derived) name L.body over meta L.helper `text/muted`, with the status trailing | `table/*`, `liquid/primary/*` |
| `Liquid/Table` | `Table` `413:1367` | The orders table sits on the content plane with no container (`95:805`): root without fill, stroke or radius. **head:** 30 tall, no fill (`table/head` is transparent under Theme B Liquid), and a 1px bottom rule (L404) in the `liquid/sidebar/selection` stand-in. `table/head-rule` still resolves the Glass `#d9d9e0` / `#363a3f`, darker than the crafted black 8% (§2). Header cells start 10 in. `caption` ("Showing 6 of 3,182 · 1 selected") is 11/14 Regular `text/muted`, 12 below the rows (`95:901`). **empty** and **loading:** the base stand-ins with L.body `text/muted` | `table/*`, `liquid/sidebar/selection` |
| `Liquid/Data table` | `Data table` `416:4605` | The orders fixture on the content plane (L360-362; `93:737`): root without card chrome, blocks 12 apart (L166). **toolbar:** (derived) `Liquid/Toggle group` segmented on the left (the 34 pill, `95:792`); `Liquid/Search` sm; Status and date `Liquid/Select`; Table and Board `Liquid/Toggle group` segmented sm; Columns and Export `Liquid/Button / md` outline (control glass). **selection:** (derived from L365, L413) the `action-bar` part nests `Liquid/Action bar` floating, absolutely positioned and centred 12 above the table's bottom edge, floating over the content (`95:902`). **table:** `Liquid/Table`. **footer:** `Liquid/Pagination`. **columns:** opens `Liquid/Menu content` with checkbox `Liquid/Menu item`s. **mobile:** stacked rows | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** core roles resolve to Liquid under Theme B Liquid after the shared step
  (theme-character §2.3: `primary/*` `#0063e1`, `border/ring` `#007aff`, `border/input` `#86868b`,
  `switch/thumb` white, `nav/active` grey, `tabs/sel-bg`). Bind `liquid/*` where the crafted
  windows do; §2 names every literal and stand-in.
- **Text:** `type/*` and `font/*` (Inter; body 13/17, heading 15/18, title 22/28, caption and label
  11/14 Semi Bold). Literal styles are limited to L.emphasis (Semi Bold), L.row (14/18) and
  L.amount (30/36).
- **Sizes:**
  - `size/switch/*` 46/28/24;
  - `size/checkbox` 20;
  - `size/avatar/*` 22/28/40;
  - `size/icon/*` 14/16/17;
  - Density where it matches: the 36 prominent capsule and toolbar groups are Comfortable
    `space/control/height`, the 30 close circle is `space/control/height-sm`, the 44 grouped rows
    are `space/control/height-lg`, and the 240 sidebar is `space/sidebar/width`. Bind them. The 28
    field, 32 bar action, 40 sheet action and the 34/30 segmented sizes are literal
    (theme-character §1.2).
- **Radii:** `radius/control` 999, `radius/input` 7, `radius/card` 14, `nav/radius` 10. The 22, 16,
  12 and 8 radii stay literal; Liquid's mode still holds the Glass scale for the rest (L495).
- **Effects:** `GLASS` parameters cannot bind (component-spec §4.3). Copy them from the crafted
  nodes; bind only the colours, per §2.

## 6. Verification strips

For each category, build a frame `Liquid style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set B, Theme B
Liquid, Density Comfortable):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme B Liquid: the "before" |
| Style | The same instances swapped to the `Liquid/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Liquid/*`. Every override survives |
| States | One of each state for the category's interactive sets |

Glass needs a desktop behind it (L422). Put each strip row on a copy of the five LAYER_BLUR
wallpaper blobs from `133:1088` (Light) and `133:1150` (Dark). Put content-only instances (fields,
checkboxes, platters) on an opaque `surface/card` panel inside it, as the window does.

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary and outline in hover, pressed, focus and disabled;
  - Button lg primary and secondary (sheet actions), Button sm ghost (bar action);
  - Icon button md outline;
  - Toggle off and selected;
  - Toggle group segmented;
  - Button group (toolbar group);
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
  - Field set with three horizontal Fields, one invalid, inside a `Liquid/Sheet` body;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default, line and segmented;
  - Nav item rest and selected;
  - Breadcrumb;
  - Pagination;
  - Sidebar;
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
  - Badge: every tone in subtle (Liquid's status pill), plus plain;
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- toolbar items are icon-only control-glass capsules with a hairline outline and side shading, and
  no drop shadow;
- sheets, dialogs, menus, popovers and the selection bar float as glass with gradient rims and
  lensing; content stays opaque;
- the segmented control is a pill track with a glass thumb;
- fields are 28px r7; focus is a solid 3px blue band with no gap;
- switches are 46×28 green with a white knob in both schemes; the off track has a grey 1px edge;
- navigation selection is grey; `#0063e1` appears only on selected and highlighted rows, the
  prominent capsule and Save; bar actions are blue ink with no fill;
- Dark is smoky glass with dim rims and a darker `#0058d0` blue with white text. A white perimeter,
  white slab or white outer shadow is a defect (L337, L438-439).
- **Data display 1:**
  - status is a 7px Apple-hue dot plus a 13px word in tables, and a 24px tinted pill in the
    sheet; never a mono chip;
  - Stat cards are flat 203×92 r14 `muted` platters with a coloured dot, a 26/32 value and one
    11/14 delta line; the hero has no platter;
  - the table has no container: a 30 header with 11/14 Semi Bold labels over a hairline, 40px r8
    rows with zebra and no rules, a deep-blue selected row with white text, and colourful avatars
    with black initials;
  - cards are borderless `#f0f0f3` / `#212225` platters with no shadow and no glass;
  - in the Data table, the selection bar floats as glass over the table's bottom edge.

**Distinctness check (same builder).** Place the Liquid and Cupertino style rows side by side at
480px. Each must be identifiable without its label. If a Liquid row shows a `material/fill`
capsule with a white rim and a `0 4 14` shadow, an r12 grouped card outside a sheet, a selection
circle or a large title, it has taken a Cupertino move.

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1).
  There are no `Liquid/Icon/*` glyphs, because the base Lucide glyphs are reused. Each set has the base variant count, property names and part
  names.
- **Literals are accounted for.** Every literal or stand-in from §2 is named in its set's
  description with "pending #2414".
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited (the Apple
  kit page `120:1831` included), and the ledger `style-ledger/liquid.json` lists every set id.
