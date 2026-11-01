# Bloom style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G1, Tonal + Bloom. Each theme has its own brief; this file is all the Bloom
  builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Bloom` (`102:808`).
- **Modes for every Bloom style set and strip:** Theme set **B** (`239:8`) and Theme B **Bloom**
  (`239:0`). Density Comfortable (Bloom geometry is literal, DESIGN L459, L472). Scheme Light
  (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme B Bloom `font/sans` =
  Funnel Sans (it was Roboto Flex).

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
   - `Bloom/Button / md`;
   - private helpers keep their dot: `Bloom/.Focus ring`.
   
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
   whole blooms. Load every font listed below before editing text.
7. **Composites.** Composites nest this theme's own style sets (`Bloom/Field` nests `Bloom/Label`
   and `Bloom/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/bloom.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/bloom/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** Widget-first Material You: a personal dashboard of pastel widgets on warm paper, set in
a large regular grotesk, with ink discs for actions (L253-254). Pastels mark categories, ink marks
actions, and there is no pastel or violet button (L277-280, L414). Bloom never takes Material
chrome: no FAB, rail, filled fields or Google Sans (L262-266, L409).

**A Bloom strip must read at thumbnail size as:**

- ink pills and ink discs as the only filled actions; the hero pill ends in a peach disc;
- 1px ink outline pills and discs, never a grey filled button;
- white 56px capsule fields with the label inside;
- one 28px toggle disc instead of both checkbox and switch;
- lavender selection on warm paper, pastels only as category tints;
- Funnel Display and Funnel Sans in Regular; size carries hierarchy, weight does not;
- flat surfaces: no stroke and no shadow, except one soft float under the floating bar;
- dark: warm brown discs `#3b3631` with cream `#f7e7cb`, deep pastels, `#8a8377` outlines.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| v2 Light / Dark | `108:894` / `110:1006` | Header (four-dot glyph, bell disc, avatar), Last 30 days outline pill, New order hero pill, widgets with action and outline discs, notched ink card, nested outline card, needs-you widget with Review orders pill, seven-day strip with the today marker, Include refunds toggle disc, Today pill, order rows with numbered discs and status chips, selected row with pen disc, selection bar, order panel with details sheet (capsule fields, error capsule, toggle discs, Cancel and Save changes). **Measure here first.** |
| Notch frames | `108:965` (248×128), `110:843` (172×112) | The notch primitive (theme-only extra) |
| v1 | `102:809` | Superseded; do not copy |
| Kits | none | Build from the frames. No kit names can collide |
| Render | `.llm/runs/design-system-s4--language-review/renders-r7/bloom--light.png`, `bloom--dark.png` | Offline reference |

The crafted frames render through Theme `Tonal` and bind only `bloom/*` (Bloom map). Your sets use
set B with Theme B Bloom, where `font/*`, `type/*`, `radius/*` and `size/*` now resolve to Bloom.

## 2. Tokens the style relies on

**Fonts** (load all): Funnel Display Regular; Funnel Sans Regular and Medium. Also load Geist Mono
Regular: base parts you copy may still bind `font/mono` until you rebind them.

Bloom sets paint `bloom/*` roles, as the crafted frames do (L470-474), and take text and shape from
Theme set `font/*`, `type/*` and `radius/*`.

| Use | Bind | Bloom value (Light / Dark) |
| --- | --- | --- |
| Paper | `bloom/canvas` | `#faf8f4` / `#0f0e0d` |
| Sheet, fields, menus, dialogs | `bloom/surface` | `#ffffff` / `#191817` |
| Neutral disc; hover and highlight step (derived) | `bloom/surface-high` | `#f2efe9` / `#22201e` |
| Text | `bloom/fg` | `#151413` / `#f2efea` |
| Supporting text, field labels | `bloom/muted` | `#655f55` / `#a39e95` |
| Decorative edges (chips, nested card, kbd); never the only edge of a control | `bloom/outline` | `#cfc9bf` / `#4a4640` |
| Editable-field boundary | `bloom/field-edge` | `#8a8377` / `#8a8377` |
| Outlined controls, the derived focus ring | `bloom/control-outline` | `#151413` / `#8a8377` |
| Separators | `bloom/line` | `#e7e2d9` / `#2c2a27` |
| Actions: hero pill, action discs, toggle on, selection bar, tooltip | `bloom/hero` | `#151413` / `#3b3631` |
| Ink on actions | `bloom/on-hero` | `#ffffff` / `#f7e7cb` |
| Notched ink card | `bloom/ink-card` / `bloom/on-ink-card` | `#151413` / `#453a2c`; `#faf8f4` / `#fbe6c6` |
| Trailing and More discs, order panel | `bloom/peach` | `#fbe6c6` / `#3a2c1a` |
| Selection | `bloom/lavender` | `#e4dcfa` / `#2a2240` |
| Category pastels | `bloom/mint`, `bloom/sky`, `bloom/butter`, `bloom/rose` | `#dcebe0` / `#1c2b22`; `#d9e9ee` / `#18292e`; `#f8edb9` / `#352f14`; `#f7dad5` / `#3a2120` |
| Status | `bloom/success`, `bloom/warn`, `bloom/error` | `#2f6b3f` / `#9fd9ae`; `#8a5a00` / `#f0c46a`; `#b3261e` / `#ffb4ab` |
| Scrim | `surface/overlay` | `#00000066` / `#000000a8` |
| Float shadow | `effect/shadow`, `shadow/overlay/y` (12), `shadow/overlay/blur` (32); spread −8 literal | `#14120d38` / `#00000080` |
| State layers (layer opacity) | `state/hover-opacity` / `state/pressed-opacity` / `state/disabled-opacity` | 8 / 12 / 38 |
| Radius (bound) | `radius/control` 999 (pills, discs); `radius/input` 28 (capsules, rows, menus); `radius/card` 32 (widgets); `radius/badge` 15 (status chips); `radius/checkbox` 999 | — |
| Radius (documented literals) | 40 order panel, 36 sheet and dialog, 26 nested card, 22 nested inner tile (L113-122, L333-336); no Theme B variable holds them (#2414) | — |
| Edge widths | `border/width` (1) for every edge; literal 1.5 for the error capsule (L336, L397) | 1 / 1.5 |
| Sizes | `size/checkbox` 28; `size/switch/width`, `height`, `thumb` 28/28/12; `size/icon/sm`, `md`, `lg` 14/18/20; `size/avatar/md`, `lg` 40/48 | — |

**Do not bind under Theme B Bloom.** These roles still hold the Tonal seed (violet and mauve),
because theme-character §2.3 does not change them: `border/ring`, `primary/text`, `primary/subtle`,
`primary/container`, `primary/on-container`, `surface/container`, `surface/container-highest`,
`surface/muted`, `surface/hover`, `border/strong`, `state/disabled-container`, `state/disabled-fg`,
`nav/active`, and the `tabs/*` and `topbar/*` colours. Status families (`destructive/*` and the
rest) do not follow the theme (theme-character §2.2): use `bloom/error`, `bloom/success` and
`bloom/warn`.

**Documented exception: literal geometry.** Heights, disc sizes, paddings and the literal radii
above are literal in Bloom (L459, L472-479). Draw them literally; do not bind Density heights.

**Text roles:**

| Role | Recipe |
| --- | --- |
| B.button | `font/sans` + `type/strong/*` (Funnel Sans 16/21 Medium, tracking 0): hero labels and "1 selected" only (L108, L294-295) |
| B.control | `font/sans` + `type/strong/size`, `line` and `tracking` (16/21/0) + `type/body/style` (Regular): outline pills, field values (L107) |
| B.body | T.body (15/20 Regular): toggle labels, menu items, selection-bar actions (L109, L399) |
| B.small | T.small (13/17): chips, repair sentences, descriptions (L111) |
| B.caption | T.caption (12/16 Regular): labels inside capsules, eyebrows (L112, L301) |
| B.heading | T.heading (Funnel Display 22/28 Regular): card, dialog and sheet titles (L105) |
| B.title | T.title (Funnel Display 40/48): section heads (L89) |
| B.initials | `font/sans` + `type/body/size` and `line` + `type/strong/style` (15/20 Medium): avatar initials (L426) |

Regular weight everywhere, sentence case, tracking 0 on UI text (L294-296). The 14/18 meta, 28/32
name and 24/28 amount styles have no Theme B variable; they belong to Data display, not to these
four categories.

## 3. Bloom recipes (referenced by the component rows)

- **B.pill: hero pill.** `bloom/hero` fill, full radius, B.button label in `bloom/on-hero`
  (L141-154, L376-377). Copy New order and Save changes from `108:894`.
  - Theme-only part `action-disc`: an absolute `bloom/peach` circle, 8 from the trailing edge,
    vertically centred, its visibility bound to `iconEnd`.
  - `icon-end` stays in the flow, in `bloom/fg`, centred on the disc.
  - Dark: `#3b3631` with a cream label; the disc turns deep peach `#3a2c1a` and keeps the
    `bloom/fg` icon (`110:1006`).
  - Sizes (lg is drawn; the rest derive with the same 8 inset; the label gap keeps 12 clear of the
    disc):

    | Size | Height | Hero padding left / right | Disc | Icon | Gap | Outline padding |
    | --- | ---: | --- | ---: | ---: | ---: | --- |
    | lg | 52 | 22 / 17 | 36 | 18 | 21 | 0/20 |
    | md | 48 | 20 / 15 | 32 | 18 | 19 | 0/20 |
    | sm | 40 | 18 / 13 | 24 | 14 | 17 | 0/16 |
    | xs | 36 | 16 / 11 | 20 | 14 | 15 | 0/14 |

    The lg row is L132, L148 and the render; md and sm outline paddings are measured on
    `108:894` (Send a shipping update, Review orders); the rest is derived.
- **B.outline: outline pill.** Transparent, 1px `bloom/control-outline`, full radius, B.control
  label in `bloom/fg`, a trailing chevron where it navigates (L155-161, L378-379). The dark edge is
  `#8a8377`, never light ink (L287, L418).
- **B.disc: discs.** Action disc: a `bloom/hero` circle with the glyph in `bloom/on-hero`. Outline
  disc: a transparent circle, 1px `bloom/control-outline`, glyph `bloom/fg` (L162-174, L380-382).
  Sizes 48, 40, 36 and 28 (L380). Glyphs sit on whole pixels (L382, L411).
- **B.toggle: toggle disc.** A 28 circle (L394-395).
  - On: `bloom/hero` with a 12 check in `bloom/on-hero`.
  - Off: transparent with a 1px `bloom/control-outline` ring.
  - Label beside it: B.body `bloom/fg`, gap 12 (the sheet toggles on `108:894`).
- **B.capsule: capsule field.** 56 tall, `radius/input` (28), `bloom/surface` fill, 1px
  `bloom/field-edge` on the capsule itself, never on a wrapper (L217-224, L396, L475-476).
  - Theme-only part `field-label`: absolute text at (20, 10), B.caption `bloom/muted`. `text` stays
    in the flow with padding 26/20/9/20, B.control `bloom/fg`. When an instance shows
    `icon-start`, override the label's x.
  - Error: a 1.5px `bloom/error` stroke, `field-label` `bloom/error`, a trailing alert-circle 20
    (`size/icon/lg`) in `bloom/error` (L397-398).
- **B.state: hover and pressed** (derived; not drawn, #2416, L431-432). An 8% (hover) or 12%
  (pressed) layer of the host's on-colour, clipped to the pill or disc: `bloom/on-hero` on ink,
  `bloom/fg` elsewhere. Bind the layer opacity to `state/hover-opacity` and
  `state/pressed-opacity`. In dark, cream at 8% over `#3b3631` stays a warm brown, never a pale
  slab.
- **B.focus** (derived; no focus is drawn, L451). `Bloom/.Focus ring`: 2px `bloom/control-outline`
  (17.35:1 Light, 5.14:1 Dark on the paper, L444) at a 2px gap (`focus/ring-width`,
  `focus/ring-offset`), in the shape of the pill, disc or capsule. On a notched widget the ring goes
  on the disc, never on the clipped card (L370-372). Never `border/ring`, which is still violet.
- **B.disabled** (derived, #2416). Root layer opacity `state/disabled-opacity` (38%). Keep the
  material; never swap to a pale fill (L284-287).
- **B.select: selection** (derived from the selected row, L204-209, L390-391). `bloom/lavender`
  fill with `bloom/fg` ink. A status chip inside it switches its outline to
  `bloom/control-outline`.
- **B.flat.** Widgets, panels, sheets, dialogs and rows carry no stroke and no shadow (L321-328).
- **B.float.** DROP_SHADOW `effect/shadow`, x 0, y `shadow/overlay/y` (12), blur
  `shadow/overlay/blur` (32), spread −8 (literal: spread cannot bind) (L329). The selection bar
  draws it; menus, popovers and hover cards borrow it (derived).
- **B.nested: nested outline card.** A 1px `bloom/outline` r26 tile; an inner tile 6 inside at
  r22 with 1px `bloom/control-outline` (L327, L335, L388). An interactive tile always uses
  `bloom/control-outline` (L421).
- **B.track: progress track.** 4px, full radius: done `bloom/fg`, remainder `bloom/outline` (L384;
  measured on `108:894`).
- **B.panel: order panel and sheet.** A `bloom/peach` panel, r40, padding 28 (L232-237, L401-402),
  holding a `bloom/surface` sheet with 36 top corners and padding 26/28/28 (L238-243, L328).
- **B.chip: status chip.** 30 tall, `radius/badge` (15), padding 0/12, 1px `bloom/outline`, a 6px
  dot in the status colour, the word in B.small `bloom/fg` (L210-216, L281-283, L393).

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Bloom anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Bloom's spec does not draw; the derivation uses only
the recipes above. Bloom draws no top bar, sidebar, tabs or dialog (L403): those rows stay minimal
and are built from pills and discs.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Bloom/Icon`, `Bloom/Spinner`, `Bloom/.Focus ring` and
`Bloom/.State layer`.

| Style set | Base set | Bloom anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Bloom/Icon` (and `Bloom/Icon/menu-dots`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** Bloom uses the shared Lucide-style set (L425), so make no copies: the `glyph` swap keeps taking `Icon/<glyph>`. One theme glyph: `Bloom/Icon/menu-dots`, four 6px dots in a 2×2 grid, one `bloom/peach` and three `bloom/fg` (L307, L426); copy it from the header of `108:894`. **Sizes** resolve through `size/icon/*` to sm 14, md 18, lg 20 (L381-382, L425) | `size/icon/*`, `bloom/fg` via the parent |
| `Bloom/Spinner` | `Spinner` `252:11837` | (derived from B.track) A round-capped arc in `bloom/fg` over a full ring in `bloom/outline`. Inside a pill or disc, the arc takes the label role | `bloom/fg`, `bloom/outline` |
| `Bloom/.Focus ring` | `.Focus ring` `252:11805` | B.focus | `bloom/control-outline` |
| `Bloom/.State layer` | `.State layer` `252:11806` | B.state. Hidden by default | `state/hover-opacity`, `state/pressed-opacity` |
| `Bloom/Button / md` | `Button / md` `253:372` | 48, the Send a shipping update pill (L378). **primary** = B.pill. **secondary** (derived from Cancel on the sheet, L378): B.outline filled `bloom/surface`. **outline** = B.outline. **ghost** (derived from Done and the selection-bar actions, L399-402): no fill or edge, B.control `bloom/fg`, padding 0/12. **destructive** (derived from the error capsule, L397): B.outline with a 1px `bloom/error` edge and a `bloom/error` label; never a red fill (ink for actions, L280, L414). **link** (derived): B.control `bloom/fg`, padding 0; `underline` 1px `bloom/fg`, shown on hover and pressed. Only primary uses B.button; every other kind is Regular (L294-295). States: hover and pressed B.state; focus B.focus; disabled B.disabled. The base control shadow resolves to 0. `loading` shows `Bloom/Spinner`, inside the action disc on primary | `bloom/hero`, `bloom/on-hero`, `bloom/peach`, `bloom/control-outline`, `bloom/error` |
| `Bloom/Button / lg` | `Button / lg` `254:721` | 52, the drawn size: New order, Save changes, Last 30 days and Cancel (L132, L376-378). Paddings from the B.pill table | as md |
| `Bloom/Button / sm` | `Button / sm` `254:371` | 40, the Review orders and Today pills (L378) | as md |
| `Bloom/Button / xs` | `Button / xs` `254:1071` | 36 (derived: the 36 disc; Bloom draws no pill under 40) | as md |
| `Bloom/Icon button / md`, `/ lg`, `/ sm`, `/ xs` | `255:262`, `255:740`, `255:501`, `255:979` | B.disc: md 40, lg 48, sm 36, xs 28 (L380). Glyph 18 on md and sm, 20 on lg, 14 on xs. **primary** = action disc. **secondary** = the peach disc (the More disc, L399-400): `bloom/peach`, glyph `bloom/fg`. **outline** = outline disc (the bell, plus and pen discs). **ghost** (derived from the bare plus glyphs in the order panel, `108:894`): no disc, glyph `bloom/fg`. **destructive** (derived): an outline disc with a `bloom/error` ring and glyph. States as Button | as Button |
| `Bloom/Button group` | `Button group` `257:839` | (derived; Bloom draws no joined group) Pills never join: gap 10 (measured between Last 30 days and New order on `108:894`), and every item keeps its full radius (override the base's 0 inner corners back to full). `separator` hidden; `text` B.small `bloom/muted`, no fill. Items nest `Bloom/Button` of the same size | — |
| `Bloom/Toggle / md`, `/ sm`, `/ lg` | `256:281`, `256:437`, `256:593` | (derived) Pills: md 40, sm 36, lg 48. **outline** = B.outline. **default** = no edge or fill, B.control `bloom/fg`. **selected** (both variants) = B.select, no edge. Hover and pressed B.state; focus B.focus; disabled B.disabled | `bloom/lavender`, `bloom/control-outline` |
| `Bloom/Icon toggle / md`, `/ sm`, `/ lg` | `276:8291`, `276:8431`, `276:8571` | (derived) As Toggle, as discs: W = H 40, 36 and 48. Selected is a `bloom/lavender` disc | as Toggle |
| `Bloom/Toggle group` | `Toggle group` `257:528` | (derived) **segmented:** no track, separate pills with gap 10, the selected item B.select. Draw gap and padding literally: the `tabs/*` colours and the 2/3 gaps are still the Tonal seed. **default** and **outline:** Toggles with gap 10 | `bloom/lavender` |
| `Bloom/Action bar` | `Action bar` `258:663` | **floating** = the selection bar (L225-231, L399-400, L412): a 60-tall `bloom/hero` full pill, padding 0/8/0/22 (measured), B.float. `count` B.button `bloom/on-hero` ("1 selected"). `separator`: a 1px vertical rule, 20 tall, `bloom/on-hero` at 25% layer opacity. Actions are 44-tall text actions (icon 18 + B.body label, `bloom/on-hero`). Theme-only part `more`: a 44 `bloom/peach` disc with more-horizontal in `bloom/fg`, last in the row. `close` hidden. One material, no second background (L412); dark `#3b3631` with cream. **inline** (derived from the selected row, L390): `bloom/lavender`, radius 28 (`radius/input`), 60 tall, no shadow, `count` B.button `bloom/fg` | `bloom/hero`, `bloom/on-hero`, `bloom/peach`, `effect/shadow` |
| `Bloom/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Bloom/Button / sm` ghost. On the floating bar, override their label and icon to `bloom/on-hero` | — |
| `Bloom/Theme toggle` | `Theme toggle` `258:742` | `Bloom/Icon button / md` outline (the bell-disc recipe) with moon and sun | — |

**Theme-only extras (outside the 84 rows; spec §4.7).** Optional, and only after the Actions strip
passes:

- `Bloom/Notch`: the notch primitive, with two variants, `248x128` and `172x112` (L338-372).
  - Each is a cubic-arc vector in `bloom/ink-card` holding a disc (42 and 36), 4 from the outer
    top and right edges.
  - Copy `108:965` and `110:843` without changing the paths.
  - The ink card lifts to `#453a2c` with `#fbe6c6` ink in dark (L286).
- The action and outline disc set is already covered by `Bloom/Icon button`; build no second copy.

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Bloom anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Bloom/Label` | `Label` `278:45` | **default:** B.body `bloom/fg`, Regular (weight never carries hierarchy, L258-259). **eyebrow:** B.caption `bloom/muted`, sentence case. `required-mark`: `bloom/muted` at rest and disabled, `bloom/error` when invalid. `optional-hint`: B.small `bloom/muted`. **invalid:** `bloom/error`. **disabled:** B.disabled | `bloom/fg`, `bloom/muted`, `bloom/error` |
| `Bloom/Input` | `Input` `279:312` | B.capsule. **md** 56 (L133). **sm** 48 (derived): `field-label` at (20, 6), `text` padding 22/20/5/20. Placeholder `bloom/muted`; `icon-start` 18 `bloom/muted`. **Hover** (derived): edge `bloom/control-outline` plus B.state `bloom/fg`; the layer carries hover in dark, where both edges are `#8a8377`. **Focus:** B.focus around the capsule; the edge stays. **Invalid:** the B.capsule error. **invalid-focus:** both. **Disabled:** B.disabled; no `surface/muted` swap | `bloom/surface`, `bloom/field-edge`, `bloom/error` |
| `Bloom/Textarea` | `Textarea` `280:597` | (derived from B.capsule) Minimum 112, `radius/input` (28), padding 20, `field-label` at (20, 12), text B.control. `footer` holds `counter` in B.caption `bloom/muted`, inside the capsule. `resize-handle`: a 14 grip in `bloom/muted`. States as Input | as Input |
| `Bloom/Select` | `Select` `281:1023` | (derived from B.capsule) A trailing `chevron` chevron-down 18 in `bloom/fg` (the outline-pill chevron, L379). **open:** edge `bloom/control-outline`, chevron rotated 180°, content = `Bloom/Menu content` 4px below. **invalid** as Input | as Input |
| `Bloom/Select content` | `Select content` `281:826` | `Bloom/Menu content` holding `Bloom/Menu item` `type=option` | — |
| `Bloom/Checkbox` | `Checkbox` `283:1470` | B.toggle (L394; spec F5 Lang Bloom). `control` 28 (`size/checkbox`), radius `radius/checkbox` (999). **Unchecked:** the off ring. **Checked:** the on disc with a 12 check as `indicator`. **Indeterminate** (derived): the on disc with a 12 minus. **Hover and pressed:** B.state on the disc. **Focus:** B.focus on `control`. **Invalid** (derived from L397): a 1.5px `bloom/error` ring. **Disabled:** B.disabled. `label` B.body `bloom/fg`, gap 12; `description` B.small `bloom/muted` | `bloom/hero`, `bloom/on-hero`, `bloom/control-outline` |
| `Bloom/Radio` | `Radio` `284:1828` | (derived from B.toggle; Bloom draws no radio) The 28 off ring. **Checked:** the ring stays and a 12 `bloom/hero` `indicator` dot shows. States as Checkbox | as Checkbox |
| `Bloom/Radio group` | `Radio group` `284:1885` | Nests `Bloom/Radio`; gap 20 (measured between the two sheet toggles on `108:894`) | — |
| `Bloom/Switch` | `Switch` `285:2329` | The toggle disc replaces the switch (L394; theme-character §1.1). `track` 28×28 (`size/switch/*`), full radius; md and sm are both 28. **Off:** transparent `track` with a 1px `bloom/control-outline` ring; `thumb` hidden. **On:** `track` `bloom/hero`, no ring; `thumb` becomes a 12 frame (same layer name; the base ellipse is replaced) holding the check in `bloom/on-hero`, centred. **Hover:** B.state. **Focus:** B.focus on `track`. **Invalid:** a 1.5px `bloom/error` ring. **Disabled:** B.disabled. `label` B.body `bloom/fg`. At rest, Checkbox and Switch look identical | `bloom/hero`, `bloom/on-hero`, `bloom/control-outline`, `size/switch/*` |
| `Bloom/Field` | `Field` `287:2656` | Nests `Bloom/Label` and `Bloom/Input`. **vertical:** the label sits inside the capsule (L396), so the nested `label` stays in the tree, hidden, and the Input's `field-label` carries the text. **horizontal:** keeps the label column. `description` B.small `bloom/muted`. `error-row`: `error-icon` hidden (the alert sits in the capsule); `error` is the 13/17 repair sentence in `bloom/error`, starting at the capsule's left edge (L398; `108:894`) | `bloom/error` |
| `Bloom/Field set` | `Field set` `287:2743` | `legend` B.heading `bloom/fg` ("Details (3)", L105). `separator` a 1px `bloom/line` rule | `bloom/line` |
| `Bloom/Input group` | `Input group` `297:3861` | The `Bloom/Input` capsule. Addon: an 18 icon in `bloom/muted`, B.small text, or a `Bloom/Icon button / xs` (28 disc), which fits the 56 capsule | — |
| `Bloom/OTP slot` | `OTP slot` `301:4385` | (derived from B.disc and B.capsule) Each slot is a 48 disc on `bloom/surface` with a 1px `bloom/field-edge` ring; the character is B.heading, centred. **caret:** a 1×21 `bloom/fg` bar. **Focus:** B.focus on the disc. **Invalid:** a 1.5px `bloom/error` ring. **Disabled:** B.disabled | as Input |
| `Bloom/Input OTP` | `Input OTP` `301:4490` | Group gap 10 instead of −1; slots never share edges. The separator is a minus 14 in `bloom/muted` | — |
| `Bloom/Slider` | `Slider` `303:5022` | (derived from B.track and B.toggle) `track` 4 tall, full radius: `range` `bloom/fg`, the rest `bloom/outline`. `thumb`: a 28 `bloom/hero` disc (the toggle-disc hit target, L451). `value-label` B.small `bloom/fg`. **Hover:** B.state on the thumb. **Focus:** B.focus on the thumb. **Disabled:** B.disabled | `bloom/fg`, `bloom/outline`, `bloom/hero` |
| `Bloom/Combobox` | `Combobox` `305:5623` | `Bloom/Input` plus `Bloom/Menu content`. Chips are `Bloom/Badge` subtle with `remove` (4.5). `empty` B.body `bloom/muted` | — |
| `Bloom/Calendar day` | `Calendar day` `307:6154` | (derived from the seven-day strip, L312-313, and the core map, L490) A 40 disc, number B.body `bloom/fg`. **Hover:** `bloom/surface-high`. **today:** a 6px `bloom/fg` dot under the number (the today marker). **single, range-start, range-end:** `bloom/hero` disc, number `bloom/on-hero`. **range-middle:** a `bloom/lavender` band, radius 0. **outside:** `bloom/muted`. **Focus:** B.focus. **Disabled:** B.disabled | `bloom/hero`, `bloom/lavender`, `bloom/surface-high` |
| `Bloom/Calendar` | `Calendar` `309:8620` | (derived from the widget, L383) `bloom/surface`, `radius/card` (32), padding 24, B.flat. Caption B.heading; weekdays B.caption `bloom/muted`; nav `Bloom/Icon button / sm` outline with chevrons; month select `Bloom/Select` sm | — |
| `Bloom/Date picker` | `Date picker` `313:14889` | `Bloom/Select` trigger with a calendar `icon-start`. Open = `Bloom/Popover` holding `Bloom/Calendar` | — |
| `Bloom/Search` | `Search` `316:16426` | (derived; Bloom draws no search) B.outline at md 40 and sm 36. Leading search icon 18 in `bloom/fg`; `label` B.body `bloom/muted`; `kbd` `Bloom/Kbd` (4.5). **Hover:** B.state. **Focus:** B.focus. **open:** fill `bloom/surface` | `bloom/control-outline` |
| `Bloom/Dropzone` | `Dropzone` `319:16832` | (derived from the widget and B.nested) `bloom/surface-high`, `radius/card` (32), with a 1px `bloom/field-edge` boundary (an interactive zone needs 3:1, L417, L421) and no dashes. `icon`: a 48 outline disc holding upload 20. `label` B.control `bloom/fg`; `hint` B.small `bloom/muted`. **active:** `bloom/lavender`, edge `bloom/control-outline`. **uploading:** B.track. **invalid:** a 1.5px `bloom/error` edge, `status` `bloom/error`. **Focus:** B.focus. **Disabled:** B.disabled | `bloom/surface-high`, `bloom/field-edge`, `bloom/lavender` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Bloom anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Bloom/Location marker` | `Location marker` `337:22` | (derived from the today marker, L313) A circle in `bloom/fg`: sm 4, md 6 | `bloom/fg` |
| `Bloom/Breadcrumb item` | `Breadcrumb item` `338:92` | (derived) Link B.body `bloom/muted`, `bloom/fg` on hover. Current B.body `bloom/fg`: colour carries it, not weight (L258-259). `separator` chevron-right 14 `bloom/muted`. Ellipsis more-horizontal 14. No mono | — |
| `Bloom/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Bloom/Breadcrumb item` | — |
| `Bloom/Page key` | `Page key` `339:270` | (derived from B.disc) 40 discs, number B.body `bloom/fg`, no ring at rest. **Hover:** `bloom/surface-high`. **current:** B.select (a lavender disc). **previous and next:** `Bloom/Button / sm` outline with chevron-left and chevron-right (the Today pill on `108:894`). **Disabled:** B.disabled. **Ellipsis:** B.body `bloom/muted` | `bloom/lavender`, `bloom/surface-high` |
| `Bloom/Pager tile` | `Pager tile` `339:319` | (derived from B.nested) An r26 tile with a 1px `bloom/control-outline` edge (it is interactive, L421), padding 20. `direction` B.caption `bloom/muted`; `title` B.heading. **Hover:** B.state. **Focus:** B.focus | `bloom/control-outline` |
| `Bloom/Pagination` | `Pagination` `339:379` | `meta` B.small `bloom/muted`; nests `Bloom/Page key` and `Bloom/Pager tile` | — |
| `Bloom/Tab / horizontal` | `Tab / horizontal` `342:402` | (derived; Bloom draws no tabs) 40 pills, padding 0/16, label B.control, `count` = `Bloom/Badge` plain (B.small `bloom/muted`). **default** and **segmented:** unselected has no fill and a `bloom/muted` label; **selected** is B.select with a `bloom/fg` label. **line:** no fill; the selected `indicator` is a 6px `bloom/fg` dot centred under the label (the today marker, L313), label `bloom/fg`. `marker` hidden. **Hover:** B.state. **Focus:** B.focus. **Disabled:** B.disabled. Radius full, literal; bind no `tabs/*` colour | `bloom/lavender`, `bloom/fg` |
| `Bloom/Tab / vertical` | `Tab / vertical` `342:599` | As horizontal; `line` puts the dot on the inline-start side | as horizontal |
| `Bloom/Tabs list` | `Tabs list` `343:424` | No track; gap 10, padding 0, both literal (the `tabs/*` values are the seed) | — |
| `Bloom/Tabs` | `Tabs` `343:489` | Nests `Bloom/Tabs list` | — |
| `Bloom/Nav item` | `Nav item` `345:601` | (derived; Bloom has no sidebar or rail, L265-266, L409) A 44 pill (`disc-md`, L136), padding 0/16; `nav-icon` 18 `bloom/fg`; `nav-label` B.body `bloom/muted`. **selected:** B.select, label `bloom/fg`. **Hover:** B.state. `count` = `Bloom/Badge` plain, no pill. `marker` hidden. **collapsed:** a 44 disc holding the icon. Level 2 indents 24 | `bloom/lavender` |
| `Bloom/Nav group` | `Nav group` `346:611` | Group label B.caption `bloom/muted`; nests `Bloom/Nav item` | — |
| `Bloom/Sidebar` | `Sidebar` `347:994` | (derived, minimal) The column floats on the paper (L307, L403): `bloom/canvas`, no trailing rule. **floating:** a `bloom/surface` r32 widget inset 16 (the widget gap, L125-126), B.flat. **inset:** the content area is `bloom/surface` at `radius/card` (32). **collapsible=icon:** a column of 44 discs | `bloom/canvas`, `bloom/surface` |
| `Bloom/Top bar` | `Top bar` `351:1349` | (derived) No bar (L403): fill `bloom/canvas` (the paper shows through), no rule, no shadow; the controls float. The height hugs the 44 controls with 16 above and below. `topbar-start`: `Bloom/Sidebar toggle` (the four-dot glyph), `Bloom/.Brand logo` with a wordmark in B.heading, or `Bloom/Breadcrumb`. `topbar-end`: `Bloom/Search`, the bell as `Bloom/Icon button / md` outline (the crafted bell is 44, `disc-md` L136; the ladder follows L380), `Bloom/Theme toggle` and an avatar (initials B.initials on `bloom/peach`, L426; the header on `108:894`). **Mobile:** the four-dot toggle and the avatar only. **docs:** `Bloom/Navigation menu` in the start | `bloom/canvas`, `bloom/peach` |
| `Bloom/.Brand logo` | `.Brand logo` `344:410` | (derived; Bloom draws no logo) A 24 action disc: `bloom/hero` with the N monogram in `bloom/on-hero` | `bloom/hero`, `bloom/on-hero` |
| `Bloom/Nav menu item` | `Nav menu item` `349:1036` | As `Bloom/Nav item` at level 1; **open** shows `bloom/surface-high` and the chevron rotated 180° | `bloom/surface-high` |
| `Bloom/.Nav menu link` | `.Nav menu link` `348:1108` | **highlighted:** `bloom/surface-high`, radius 22 (the nested inner radius, L115). Title B.control `bloom/fg`, description B.small `bloom/muted` | — |
| `Bloom/Navigation menu` | `Navigation menu` `349:1132` | The viewport is the `Bloom/Menu content` recipe | — |
| `Bloom/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) A 40 pill, B.control `bloom/fg`. **Hover:** B.state. **open:** `bloom/surface-high` | — |
| `Bloom/Menubar` | `Menubar` `349:1236` | Root transparent on the paper, gap 10, padding 0, no stroke (header controls float, L403). Menus are `Bloom/Menu content` | — |
| `Bloom/Step` | `Step` `352:1355` | (derived from B.toggle, the numbered row discs and B.track) `indicator`: a 28 disc. **complete:** the toggle on disc (ink with a 12 check). **current:** the off ring with the number in B.small `bloom/fg`. **upcoming:** a `bloom/surface-high` disc with the number in `bloom/muted` (the neutral row disc, L279). **error:** a `bloom/rose` disc with a 12 x in `bloom/error` (the Payment failed row disc, `108:894`). **connector:** B.track, `bloom/fg` when complete and `bloom/outline` otherwise. `title` B.body `bloom/fg`, `description` B.small `bloom/muted` | `bloom/hero`, `bloom/surface-high`, `bloom/rose` |
| `Bloom/Stepper` | `Stepper` `352:1424` | Nests `Bloom/Step` | — |
| `Bloom/Sidebar toggle` | `Sidebar toggle` `344:462` | Desktop: `Bloom/Icon button / sm` outline with panel-left and x. Mobile: `Bloom/Icon button / lg` ghost with `Bloom/Icon/menu-dots` (closed) and x (open) (L307, L426) | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Bloom anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Bloom/.Kbd` | `.Kbd` `370:31` | Retired by the B6 build; build `Bloom/Kbd` in 4.5 instead. Every former `.Kbd` reference points at `Bloom/Kbd` | — |
| `Bloom/Menu item` | `Menu item` `371:587` | (derived from the order row and B.select) 44-tall pill rows (L136), padding 0/16, full radius; label B.body `bloom/fg`; icons 18 `bloom/fg`. **highlighted:** `bloom/surface-high`. **type=option:** a theme-only absolute `checked-fill` in `bloom/lavender` whose visibility binds to `checked`, present only in the option variants. Indicators: a 12 check in `bloom/fg` (checkbox, option), an 8 `bloom/hero` dot (radio), chevron-right 14 `bloom/muted` (submenu). **destructive:** label and icon `bloom/error`; highlighted keeps `bloom/surface-high`. `shortcut` = `Bloom/Kbd` sm. **disabled:** B.disabled. `loading` shows `Bloom/Spinner` | `bloom/surface-high`, `bloom/lavender`, `bloom/error` |
| `Bloom/Menu label` | `Menu label` `373:35` | B.caption `bloom/muted`, sentence case | — |
| `Bloom/Menu separator` | `Menu separator` `373:38` | A 1px `bloom/line` rule with the base's 4 margins | `bloom/line` |
| `Bloom/Menu group` | `Menu group` `373:248` | Nests `Bloom/Menu label` and `Bloom/Menu item` | — |
| `Bloom/Menu content` | `Menu content` `373:256` | (derived) `bloom/surface`, `radius/input` (28, the row radius, L118), padding 6 (the row gap, L130), no stroke, B.float | `bloom/surface`, `effect/shadow` |
| `Bloom/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Bloom/Button / md` outline with a chevron-down (the Last 30 days pill is this trigger, L378-379); `Bloom/Menu content` 4px below | — |
| `Bloom/Context menu` | `Context menu` `374:653` | The trigger area is `bloom/surface-high` at `radius/card` (32) with B.body `bloom/muted`; no dashes | `bloom/surface-high` |
| `Bloom/Dialog` | `Dialog` `378:743` | (derived from the details sheet, L238-243, L328; Bloom draws no dialog, L403) `content` `bloom/surface`, radius 36 on all corners (literal), padding 26/28/28, gap 20, B.flat: the scrim separates it. `backdrop` `surface/overlay`. `title` B.heading. `description` B.body `bloom/muted`. `close` `Bloom/Icon button / sm` outline with x. Footer: `Bloom/Button / lg` outline (Cancel) and primary (the hero pill with a check disc), gap 10, as the sheet footer on `108:894` | `bloom/surface`, `surface/overlay` |
| `Bloom/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a 48 disc. Default: `bloom/surface-high` with the glyph in `bloom/fg`. Destructive: `bloom/rose` with the glyph in `bloom/error` (the numbered row discs, L279; `108:894`). `cancel` `Bloom/Button / lg` outline; `action` `/ lg` primary or destructive | `bloom/surface-high`, `bloom/rose`, `bloom/error` |
| `Bloom/Sheet` | `Sheet` `379:1004` | B.panel (L401-402; spec O3 Lang Bloom). `content`: `bloom/peach`, radius 40 on the exposed corners, padding 28, no stroke, no shadow. `header`: `title` B.heading, `description` B.body `bloom/muted`, `close` `Bloom/Icon button / sm` ghost. Theme-only part `sheet`: an absolute `bloom/surface` frame behind `body` and `footer`, with left and right at 0, top under `header` (header height + 20), bottom 0, top corners 36 and bottom corners following the panel; `body` and `footer` keep their places in the flow above it. Footer: `Bloom/Button / lg` outline and primary. `handle`: hidden on left and right; on top and bottom a 36×4 full-radius `bloom/outline` bar on the peach (derived, decorative). Dark: a `#3a2c1a` panel and a `#191817` sheet (`110:1006`) | `bloom/peach`, `bloom/surface`, `bloom/outline` |
| `Bloom/Drawer` | `Drawer` `379:1150` | As Sheet; the stacked footer buttons fill the sheet width | — |
| `Bloom/Popover` | `Popover` `381:937` | (derived) `bloom/surface`, `radius/input` (28), padding 20, no stroke, B.float. `arrow` hidden: Bloom surfaces have no arrow. `title` B.control `bloom/fg`, `description` B.small `bloom/muted`, `close` `Bloom/Icon button / xs` outline | `bloom/surface`, `effect/shadow` |
| `Bloom/Tooltip` | `Tooltip` `381:1030` | (derived from the selection bar's ink material, L399, L412) A `bloom/hero` pill, 30 tall (the chip height, L134), padding 0/12, label B.small `bloom/on-hero`, no stroke. `arrow` hidden. kbd `Bloom/Kbd` inverse. Dark `#3b3631` with cream, never a pale chip | `bloom/hero`, `bloom/on-hero` |
| `Bloom/Hover card` | `Hover card` `381:1093` | (derived from the widget) `bloom/surface`, `radius/card` (32), padding 24, B.float. Avatar: `Bloom/Avatar` md, initials, its fill overridden to `bloom/sky` (the customer avatar on `108:894`). `title` B.heading, `description` B.body `bloom/muted`, `meta` B.small `bloom/muted` | `bloom/surface`, `bloom/sky` |
| `Bloom/Command item` | `Command item` `382:1015` | (derived from the order row, L389-392) Radius 28, padding 0/20 (the row inset, L131); label B.control `bloom/fg`; `url` and excerpt B.small `bloom/muted`. **selected:** B.select, with the enter glyph in a 36 outline disc at the end (the selected row's pen disc, L391); the 2px marker stroke hidden. `kind` is B.chip, its outline `bloom/control-outline` when selected. `shortcut` = `Bloom/Kbd` sm | `bloom/lavender`, `bloom/outline`, `bloom/control-outline` |
| `Bloom/Command palette` | `Command palette` `383:1355` | The Dialog recipe. `input-row`: a B.capsule holding the strokeless input and a `Bloom/Kbd` "Esc"; no divider. Filters are `Bloom/Tab` segmented. Groups: rows on 6 gaps (L130), group labels B.caption `bloom/muted`. `footer` B.caption `bloom/muted`, no strip | — |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Build `Bloom/Kbd`, `Bloom/Badge` and `Bloom/Avatar` first: rows in 4.2 to 4.4 now nest them.

| Style set | Base set | Bloom anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Bloom/Kbd` | `Kbd` `403:28` | (derived from B.chip; replaces the retired `.Kbd`) **default:** `radius/badge` (15, a pill at this height), a 1px `bloom/outline` edge (decorative; it is not a control), no fill, padding 0/8. Label B.caption `bloom/muted` in Funnel Sans: Bloom sets no mono. H `size/kbd` (md) and `size/kbd-sm` (sm), minimum width = H. **inverse:** a `bloom/peach` pill with the key in `bloom/fg`, no edge (peach on ink, as the More disc, L399-400) | `bloom/outline`, `bloom/muted`, `bloom/peach` |
| `Bloom/Kbd group` | `Kbd group` `403:96` | Nests `Bloom/Kbd`; the "+" separator in B.caption `bloom/muted`, gap 4 as the base | — |
| `Bloom/Badge` | `Badge` `405:180` | The status chip (L210-216, L281-283, L393; `108:894`): 30 tall, `radius/badge` (15), padding 0/12, gap 6. The `dot` is a 6 circle (`radius/avatar`); the word is B.small `bloom/fg` in every tone (L281), sentence case, no mono. Dot colour by tone: success `bloom/success`, warning `bloom/warn`, destructive `bloom/error`, neutral `bloom/muted` (Refunded), info `bloom/fg` (Shipped, measured on `108:894`). **outline** (Bloom's primary style): transparent, 1px `bloom/outline`. **subtle** (derived from the pastel row discs, L278-279; `108:894`): no edge; fill success `bloom/mint`, warning `bloom/butter`, info `bloom/sky`, destructive `bloom/rose`, neutral `bloom/surface-high`. **solid** (derived from the selected-row chip, L391): the subtle fill plus a 1px `bloom/control-outline` edge; never an ink or red fill, because ink is for actions (L280, L414). **plain:** no container, padding 0; B.small in `bloom/muted` for neutral (counts) and `bloom/fg` otherwise. `iconStart`: a 14 glyph in `bloom/fg`. `remove`: an x 14 in `bloom/muted`. Inside a selected row the edge becomes `bloom/control-outline` (L391). Dark: deep pastels and light status dots (`110:1006`) | `bloom/*`, `radius/badge` |
| `Bloom/Badge / kind` | `Badge / kind` `405:211` | (derived) The outline Badge geometry (30, `radius/badge` 15, 1px `bloom/outline`, the word B.small `bloom/fg`) with the 6 `dot` in the base `code/syntax/*` or `text/fg` role | `bloom/outline`, `code/syntax/*` |
| `Bloom/Avatar` | `Avatar` `406:95` | Pastel circles with initials (L426; `108:894`): `radius/avatar` (999), sizes through `size/avatar/*` (24, 40, 48). **initials:** `bloom/peach` (the header avatar); instances may switch to another pastel, as the customer avatar uses `bloom/sky`. Initials in `bloom/fg`: B.initials (15/20 Medium) on md and lg, B.caption with `type/strong/style` on sm. **fallback** (derived): `bloom/surface-high` with a `user` glyph in `bloom/muted`. **agent** (derived from B.disc): an action disc, `bloom/hero` with the bot glyph in `bloom/on-hero`. **image:** clipped to the circle. `presence` = `Bloom/Avatar presence` | `size/avatar/*`, `bloom/peach`, `bloom/fg`, `bloom/hero` |
| `Bloom/Avatar presence` | `Avatar presence` `406:43` | (derived) An 8 circle: online `bloom/success`, away `bloom/warn`, offline `bloom/muted`; the 2px OUTSIDE ring is `bloom/canvas`, the paper avatars sit on | `bloom/*` |
| `Bloom/Avatar group` | `Avatar group` `406:150` | The needs-you stack (L385; `108:894`): 40 avatars overlapping −10 instead of −8, each with a 2px OUTSIDE ring. The ring is `bloom/canvas` by default and takes the host pastel on a widget (`bloom/lavender` on needs-you, an instance override). The count avatar is `bloom/surface-high` with B.small `bloom/fg` | `bloom/canvas`, `bloom/surface-high` |
| `Bloom/Item` | `Item` `408:792` | (derived from the order row, L389-392, and B.nested) **default:** no fill, radius `radius/input` (28), padding 0/20 (L131). Sizes: **default** 84 tall with a 44 media disc (L129); **sm** 64 with 36 media and **xs** 52 with 28 media (derived). `title` B.heading `bloom/fg`; `description` B.small `bloom/muted`. **muted:** `bloom/surface-high`. **outline:** B.nested at r26, its edge `bloom/control-outline` because the item is interactive (L421). `media`: `Bloom/Avatar`, `Bloom/.Item icon tile` or `Bloom/.Item image`. `actions`: `Bloom/Button / sm` outline. `chevron` 14 `bloom/fg`. `header` and `footer` B.caption `bloom/muted`. **hover:** B.state. **focus:** B.focus | `bloom/surface-high`, `bloom/control-outline` |
| `Bloom/Item group` | `Item group` `408:996` | Rows 6 apart (L130), as the order list. **separators=false:** the 6 gap alone. **separators=true** (derived): a 1px `bloom/line` between rows, inset 20 | `bloom/line` |
| `Bloom/.Item icon tile` | `.Item icon tile` `408:82` | The numbered row disc (L389; `108:894`) replaces the 32 square tile: a 44 circle in `bloom/surface-high` with an 18 glyph in `bloom/fg`. Instances may tint it with a category pastel (L278-279) | `bloom/surface-high`, `bloom/fg` |
| `Bloom/.Item image` | `.Item image` `408:85` | As the base: 40×40 at `radius/input`, which resolves to 28 and so reads as a disc | — |
| `Bloom/Card` | `Card` `409:951` | **default** = the widget (L175-187, L383; theme-character §2.4): `card/bg` (`bloom-surface`), `radius/card` (32), padding 24 on md (L127) and 20 on sm (derived), no stroke and no shadow (B.flat). Category widgets override the fill to a pastel (`bloom/peach`, `mint`, `lavender`, `sky`, `butter` or `rose`; L277-279), deep tones in dark (L284). Header: `eyebrow` B.caption `bloom/muted`; `title` B.heading `bloom/fg`; `description` B.body `bloom/muted`; `action` `Bloom/Button / sm` outline (the Review orders pill, L378). `footer` drops the `card/footer` fill and the top rule and holds `Bloom/Button / lg` outline and primary (the sheet footer). **hover:** B.state. **focus:** B.focus. **selected:** B.select (`bloom/lavender`). **rule** (derived from the Recent (6) section, L312; `108:894`): no fill, radius or rule; `title` B.title (40/48), the `action` shown as a 48 outline plus disc, the body below | `card/bg`, `radius/card`, `bloom/lavender` |
| `Bloom/Stat card` | `Stat card` `409:1270` | The KPI widgets (L175-196, L383-387; `108:894`). **default** = a pastel widget: `kpi/bg-1` (peach; instances use `kpi/bg-2` mint, `kpi/bg-3` sky and `kpi/bg-4` lavender, theme-character §2.3), `radius/card` (32), padding `kpi/pad-x` (24), no border, no shadow. Head row (L383): `icon` in a 48 action disc on the left; a theme-only `open` part on the right, a 48 outline disc with arrow-up-right, shown by a theme-only boolean `open` (default true). `label` B.control `bloom/muted` (L384); value T.kpi (60/64 Regular, −1.8) `bloom/fg`. Delta (L384): a 36-tall `bloom/surface` pill, padding 0/14, an arrow 14 plus B.small, both `bloom/fg` in either direction (`108:894`); `success/text` and `destructive/text` are not Bloom roles. A theme-only `track` part (B.track), shown by a theme-only boolean `track` (default false), sits beside the pill, as on the revenue widget. `deco/*` stay false. **hero** = the notched ink widget (L188-196, L386-387): `bloom/ink-card` drawn with the 248×128 notch path from `108:965` (the hero is fixed at that size), value T.kpi-sm (48/52) in `bloom/on-ink-card`; the delta is an arrow plus B.small in `bloom/on-ink-card` with no pill, and `detail` is B.small `bloom/on-ink-card` at 80% layer opacity. A 42 outline disc (pen, ring `bloom/control-outline`) sits in the notch, 4 from the top and right (L345, L407-408, L449-450). The hero hides the head row. Dark: `#453a2c` with `#fbe6c6` (L286). `badge` = `Bloom/Badge` outline | `kpi/*`, `bloom/ink-card`, `bloom/on-ink-card`, `bloom/surface` |
| `Bloom/Table header cell` | `Table header cell` `410:546` | (derived; Bloom draws no header row, L389) No fill, height 40, label B.caption `bloom/muted` in sentence case. Sort glyphs at 14 in `bloom/muted`; a sorted label is `bloom/fg`. **hover:** B.state in a full-radius shape. **focus:** B.focus | — |
| `Bloom/Table cell` | `Table cell` `410:383` | The order-row cells (L389-392; `108:894`): height 84 (L129), padding-x 12 between cells and 20 at the row ends (L131), no rules. **text:** B.body `bloom/fg`. **strong:** B.control `bloom/fg`. **mono** (IDs): B.small `bloom/muted` in Funnel Sans; Bloom shows the ID in the meta line ("Online store · SO-10482"), never in mono. **number** (amounts): Funnel Display (`font/kpi`) 24/28 Regular, `bloom/fg`, end-aligned (L98-104, L389). **muted:** B.small `bloom/muted`. **badge:** `Bloom/Badge` outline. **avatar:** `Bloom/Avatar` md with a pastel fill and the row number or initials (the drawn numbered disc is 44), `secondary` (the meta line, 14/18 `bloom/muted`) above the name (Funnel Display 28/32 Regular, `bloom/fg`) (L389). **actions:** `Bloom/Icon button / sm` outline with pen, shown only on hover (derived) and selected (L391). **select** (derived; the drawn rows have none): `Bloom/Checkbox`. **Documented exception:** 24/28, 28/32 and 14/18 have no Theme B variable (L474, L478; #2414); bind `font/*` and the `type/*/style`, and set size and line literally | `bloom/fg`, `bloom/muted` |
| `Bloom/Table row` | `Table row` `412:1187` | The order row (L197-209, L389-392): 84 tall, radius `table/row-radius` (28), no fill at rest (`table/row-bg` is transparent: rows sit on the paper), no rule (`table/row-rule-width` 0). **zebra** (derived): `bloom/surface-high`; do not bind `table/zebra`, which is still the seed. **hover** (derived): B.state 8% `bloom/fg`; do not bind `table/hover` (seed). **selected:** `bloom/lavender` (L390), the Badge edge `bloom/control-outline` (L391), the pen disc shown, the checkbox on. The 2px selection-bar part stays in the tree, hidden: Bloom marks selection by fill, not by a bar. A refunded row is an instance override: name and amount `bloom/muted`, no strike-through (L391-392, L419). **focus:** B.focus around the row. **disabled:** B.disabled. **stacked** (derived): the same r28 row with 20 insets; meta and name on top, chip and amount on a second line | `table/row-radius`, `bloom/lavender`, `bloom/surface-high` |
| `Bloom/Table` | `Table` `413:1367` | The Recent list (L312-314; `108:894`). `head` (with its select-all) stays in the tree, hidden by default: Bloom has no header row (L389; `table/head` transparent). Shown, it holds `Bloom/Table header cell`s on the paper. Rows 6 apart (`table/row-gap`). `caption`: the section head in B.title (40/48, "Recent (6)", L299). `summary` B.small `bloom/muted`. **empty** and **loading** keep the base stand-ins in Bloom roles | `table/*` |
| `Bloom/Data table` | `Data table` `416:4605` | (derived from the Recent column, L312-314) No card chrome: the nested Card becomes `Bloom/Card` rule. Toolbar: `Bloom/Search`; the Status and date filters as `Bloom/Button / md` outline pills with a chevron (the Last 30 days pill, L378-379); the Table and Board switch as `Bloom/Toggle group` segmented; Columns `Bloom/Button / sm` outline; Export `Bloom/Button / sm` outline with download. **selection:** the selection bar, `Bloom/Action bar` floating, over the bottom of the rows (L314, L399). Table `Bloom/Table`; Pagination `Bloom/Pagination`. **columns:** `Bloom/Menu content` with checkbox rows. **mobile:** stacked rows. **loading** and **empty** as the base, in Bloom roles | — |

## 5. What stays in tokens (do not redraw)

- **Colours:** every Bloom paint binds a `bloom/*` role (L470-474). The scrim and the float shadow
  come through `surface/overlay` and `effect/shadow`.
- **Text:** `font/*` (Funnel Display for heading and kpi, Funnel Sans for sans, label and data)
  and `type/*` after the shared step:
  - display 92/96, title 40/48, heading 22/28, kpi 60/64, kpi-sm 48/52;
  - body 15/20, strong 16/21 Medium, small 13/17, caption and label 12/16;
  - tracking 0 on UI text.
- **Radius:** `radius/control` 999, `radius/input` 28, `radius/card` 32, `radius/badge` 15,
  `radius/checkbox` 999.
- **Sizes:**
  - `size/checkbox` 28;
  - `size/switch/*` 28/28/12;
  - `size/icon/*` 14/18/20;
  - `size/avatar/md` 40 and `lg` 48;
  - `shadow/overlay/y` 12 and `blur` 32.
- **Not in tokens:** heights, disc sizes and paddings (literal geometry, L459, L472-479); the
  radii 40, 36, 26 and 22; the 1.5 error stroke and the −8 shadow spread.

## 6. Verification strips

For each category, build a frame `Bloom style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set B, Theme B
Bloom):

| Row | Content |
| --- | --- |
| Base | The base instances under Theme B Bloom: the "before" |
| Style | The same instances swapped to the `Bloom/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Bloom/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button lg in all six variants at rest;
  - Button lg primary in hover, pressed, focus and disabled, with and without `iconEnd`;
  - Icon button md in all five variants;
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
  - Switch off and on;
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
  - Alert dialog destructive;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge: every tone in outline (Bloom's primary style), plus plain;
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer;
  - Stat card: default and hero, with deltas;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- every filled action is an ink pill or an ink disc, and the hero pill ends in a peach disc;
- outlined controls use a 1px ink edge (`#8a8377` in dark), never a grey fill;
- fields are white 56 capsules with the label inside; an error is a 1.5px red capsule;
- Checkbox and Switch render as the same 28 toggle disc;
- selection is lavender, and no violet appears anywhere: a violet fill or ring means a seed role
  leaked;
- heads are Funnel Display Regular and UI text Funnel Sans Regular; Medium only on hero labels;
- surfaces carry no stroke or shadow; only floating pieces carry the one soft float;
- dark shows warm brown discs `#3b3631` with cream `#f7e7cb`, deep pastels and warm near-black
  paper. A pale slab, a light-ink outline or a white disc in dark is a defect (L284-287, L418,
  L420).

**Expected for Data display 1 (style row vs base row):**

- badges are 30px outline pills (radius 15) with a 6px round status dot and the word in ink,
  never mono uppercase boxes;
- avatars are pastel circles with Medium initials; groups overlap −10;
- cards are flat r32 widgets, white or pastel by category; default stats carry the white delta
  pill, and the hero stat is the notched ink card with a disc in its notch;
- table rows are 84px r28 rows on the paper, 6 apart, with no header or rules; selection is
  lavender, with the chip edge turning ink and a pen disc, and no bar;
- amounts and names are Funnel Display Regular, and nothing is mono;
- dark shows deep pastels, the ink card at `#453a2c` with peach text and discs at `#3b3631` with
  cream; no violet anywhere.

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1),
  plus `Bloom/Icon/menu-dots`. Each has the base variant count, property names and part names.
  The notch extra is optional and not counted.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/bloom.json` lists every set id.
