# Fluent style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G3, Fluent alone (Fluent 2 Web joins it in the faithful pass, #2443). This
  file is all the Fluent builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Fluent` (`53:2`).
- **Modes for every Fluent style set and strip:** Theme set **A** (`239:7`) and Theme **Fluent**
  (`52:0`). Density Comfortable, but no Fluent set binds Density: WinUI sizes are drawn literally
  (DESIGN L515). Scheme Light (`3:0`) to build; check Dark (`3:1`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme Fluent `radius/badge` = 4.

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
   - `Fluent/Button / md`;
   - private helpers keep their dot: `Fluent/.Focus ring`.
   
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
7. **Composites.** Composites nest this theme's own style sets (`Fluent/Field` nests `Fluent/Label`
   and `Fluent/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/fluent.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/fluent/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** Fluent 2 as Windows 11 ships it (WinUI 3): quiet 32px controls at radius 4 with Body
Regular labels, elevation borders instead of shadows, a strong bottom edge on every text input,
accent pills for selection, and the WinUI 2px/1px focus visual (L263-274, L417-429). Every value
traces to a WinUI theme-resource key; the run file
`.llm/runs/design-system-s4--language-review/fluent-sources.md` lists them.

**A Fluent strip must read at thumbnail size as:**

- flat, regular-weight 32px controls with 4px corners;
- Standard buttons as translucent white faces with a darker 1px bottom edge (dark: a faint brighter
  top edge);
- text fields with a dark bottom line that becomes a 2px accent bar on focus, never a ring;
- WinUI blue only in the seven places of L290-293: the accent button, a checked checkbox, a toggle
  that is on, the nav and row pills, the SelectorBar pill, and a focused text field's bottom edge;
- selection as a faint grey fill plus a 3×16 accent pill; tabs as plain text with a 16×3 pill;
- flyouts and dialogs at radius 8 with soft shadows; cards flat, no shadow;
- a 2px black (dark: `#8d8d8d` grey) focus outline with a 1px light inner line, 3px outside the
  control. Never white.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Components sheet (Light / Dark panels) | `159:1106` (`159:1107` / `159:1330`) | Button Standard and Accent × rest, hover, pressed, disabled, focus; TextBox rest, hover, focus, error; ComboBox rest, hover; ToggleSwitch; CheckBox; NavigationViewItem; ListViewItem; Badges; Avatars. **Measure here first** |
| Light desktop / window | `155:737` / `155:746` | TitleBar, NavigationView, breadcrumb, CommandBar, InfoBar, SelectorBar, ListView, pager, SettingsCards, error message, counter |
| Dark desktop / window | `158:922` / `158:931` | Dark check for every recipe |
| Library kits (`153:730`) | Button `153:780`, TextBox `153:805`, ComboBox `153:822`, ToggleSwitch `154:742`, CheckBox `154:751`, NavigationViewItem `154:768`, ListViewItem `154:779`, Badge `154:790`, Avatar `154:803` | Geometry and layer recipes to copy (edge bars, pills, focus effects) |
| Icon set (51 Fluent System Icons) | `152:729` | Every icon slot (§3 F.icon) |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/fluent--{light,dark,components}.png` | Offline reference. **Caution:** r7 shows the native WinUI values for the three NetScript overrides (pressed accent, ComboBox bottom edge, dark focus outer). Build those from L321-323 and the live variables; `renders-r8/fluent--components.png` shows the overrides |
| WinUI source keys | `.llm/runs/design-system-s4--language-review/fluent-sources.md` | The key behind each value |

**Kits and names.** The kits are named `fluent/Button`, `fluent/TextBox`… (lower-case `fluent/`),
so they do not collide with the new `Fluent/*` names. The parked r5 sets (`53:18`…`53:99`, moved
4000px down, superseded) may carry `Fluent/<name>` names such as `Fluent/Input`. Before creating
each set, search the page for that exact name and apply rule 4 if it exists.

**Accent scope for undrawn controls.** The accent (`fluent/accent/*` fills) appears only in the
seven places of L290-293 and L439. WinUI paints some controls in AccentFill that the specimen does
not draw: RadioButton, Slider, ProgressRing and ProgressBar, CalendarView, a checked ToggleButton,
and the informational InfoBar. Their Fluent sets use the neutral derivation F.neutral (§3) instead,
and each is marked `derived`. Do not add an eighth accent place; report it if a set looks wrong
without one.

## 2. Tokens the style relies on

**Fonts** (load all): Open Sans Regular and SemiBold; JetBrains Mono Regular (base text nodes bound
to `font/mono` until you rebind them).

| Use | Bind | Fluent value (Light / Dark) |
| --- | --- | --- |
| Standard face rest / hover / pressed | `fluent/control/default` / `fluent/control/secondary` / `fluent/control/tertiary` | `#ffffffb3` `#f9f9f980` `#f9f9f94d` / `#ffffff0f` `#ffffff15` `#ffffff08` |
| Disabled face | `fluent/control/disabled` | `#f9f9f94d` / `#ffffff0b` |
| Focused text field | `fluent/control/input-active` | `#ffffff` / `#1e1e1eb3` |
| Well: checkbox, radio, toggle off | `fluent/control/alt-secondary` | `#00000006` / `#00000019` |
| Solid control (slider thumb) | `fluent/control/solid` | `#ffffff` / `#454545` |
| Slider rail, progress rail | `fluent/control/strong` | `#00000072` / `#ffffff8b` |
| Subtle hover and selected / subtle pressed | `fluent/subtle/secondary` / `fluent/subtle/tertiary` | `#00000009` `#00000006` / `#ffffff0f` `#ffffff0a` |
| Accent fill rest / hover / pressed | `fluent/accent/default` / `fluent/accent/secondary` / `fluent/accent/tertiary` | `#005fb8` `#005fb8e5` `#0054a3` / `#60cdff` `#60cdffe5` `#60cdffcc` |
| Disabled accent fill (a neutral grey) | `fluent/accent/disabled` | `#00000037` / `#ffffff28` |
| Text primary / secondary / disabled | `fluent/text/primary` / `fluent/text/secondary` / `fluent/text/disabled` | `#000000e4` `#0000009e` `#0000005c` / `#ffffff` `#ffffffc5` `#ffffff5d` |
| Text on accent: rest / pressed / disabled | `fluent/text/on-accent` / `fluent/text/on-accent-secondary` / `fluent/text/on-accent-disabled` | `#ffffff` `#ffffff` `#ffffff` / `#000000` `#000000` `#ffffff87` |
| Hyperlink | `fluent/text/accent` | `#003e92` / `#99ebff` |
| Glyph on a severity disc | `fluent/text/inverse` | `#ffffff` / `#000000e4` |
| Control stroke / strong edge | `fluent/stroke/control` / `fluent/stroke/control-strong` | `#0000000f` `#00000072` / `#ffffff12` `#ffffff8b` |
| Accent control stroke | `fluent/stroke/on-accent` | `#ffffff14` / `#ffffff14` |
| Elevation edge bars | `fluent/elevation/control-top`, `fluent/elevation/control-bottom`, `fluent/elevation/accent-bottom` | `#00000000` `#0000001c` `#00000066` / `#ffffff07` `#ffffff00` `#00000023` |
| Focus visual outer / inner | `fluent/focus/outer` / `fluent/focus/inner` | `#000000e4` `#ffffffb3` / `#8d8d8d` `#000000b3` |
| Card / card stroke | `fluent/card/default` / `fluent/stroke/card` | `#ffffffb3` `#0000000f` / `#ffffff0d` `#00000019` |
| Content layer | `fluent/layer/default` | `#ffffff80` / `#3a3a3a4c` |
| Flyout base / flyout edge | `fluent/solid/base` / `fluent/stroke/surface` | `#f3f3f3` `#75757566` / `#202020` `#75757566` |
| Dividers | `fluent/stroke/divider` | `#0000000f` / `#ffffff15` |
| Status | `fluent/system/critical`, `fluent/system/critical-bg`, `fluent/system/caution`, `fluent/system/caution-bg`, `fluent/system/success` | `#c42b1c` `#fde7e9` `#9d5d00` `#fff4ce` `#0f7b0f` / `#ff99a4` `#442726` `#fce100` `#433519` `#6ccb5f` |
| Tint badges | `fluent/badge/{success,warning,danger,brand,informative}/{bg,fg,border}` | Kit `154:790`; values in L88-91 and `fluent-sources.md` |
| Avatars | `fluent/avatar/{royal-blue,teal,grape,marigold,pumpkin,light-green}/{bg,fg}` | Kit `154:803` (L468-469) |
| **Scrim (documented exception)** | Core `surface/overlay`: L429 asks for a Smoke scrim and no `fluent/*` role exists | `#00000066` / `#000000a8` |
| Mica | `fluent/mica/tint` | Window only. Never on a style set |
| Radius | `radius/control` 4, `radius/input` 4, `radius/card` 8, `radius/badge` 4, `radius/checkbox` 4, `radius/avatar` 999, `nav/radius` 4 | Literal: pills 1.5, toggle track 10 |
| Edge widths | `border/width` (1) for every stroke; focus outer `focus/ring-width` (2) | Literal: the 2px focused text edge, the 1px focus inner line, 1px edge bars |
| Shadows | Flyout key half: the base R.float effect (`shadow/overlay/y` 8, `shadow/overlay/blur` 16, colour `effect/shadow-overlay`) | `0 8 16` in `#00000024` / `#00000047`. Cards, controls and panes: none |

**Text roles:**

| Role | Recipe |
| --- | --- |
| F.caption | `font/sans` + `type/caption/*` (12/16 Regular): column headers, descriptions, counts, shortcuts (L369-370) |
| F.caption-strong | `font/label` + `type/label/*` (12/16 SemiBold): Caption Strong, badges (L370) |
| F.body | T.body (14/20 Regular): every interactive label; WinUI buttons are not bold (L369) |
| F.body-strong | T.strong (14/20 SemiBold): InfoBar title, NavigationViewItemHeader, emphasised values |
| F.subtitle | T.heading (20/28 SemiBold, −0.2): dialog, sheet and field-set titles (the editor header, L368) |
| F.title | T.title (28/36 SemiBold, −0.5): page titles only |

**Core roles a Fluent set never binds** (they resolve to Radix tints or inverse slabs under Theme
Fluent): `surface/selected`, `surface/hover`, `surface/inverse`, `primary/*`, `marker/default`,
`link/underline`, `border/ring`, `border/input`, `tooltip/*`. Replace each with the `fluent/*` role
the row names.

## 3. Fluent recipes (referenced by the component rows)

- **F.face: the control face.** Root carries no fill and does not clip, so the focus visual outside
  it is not cut. Put a theme-only `face` frame behind the content (absolute, stretch × stretch,
  radius `radius/control`, clip content). It holds:
  - the face fill;
  - a 1px INSIDE stroke;
  - two theme-only 1px edge bars, `edge-top` and `edge-bottom` (full width, pinned top and bottom,
    clipped by the face radius).

  Copy the bars from kit `153:731`. Figma cannot bind gradient stops, so the bars carry WinUI's
  elevation gradient (L402-403).
- **F.standard: Standard button** (L394, L417).
  - Rest: `face` `fluent/control/default`; stroke `fluent/stroke/control`; `edge-top`
    `fluent/elevation/control-top`; `edge-bottom` `fluent/elevation/control-bottom`. Bind both bars
    in every scheme: light shows the darker bottom, dark the brighter top.
  - Hover: `fluent/control/secondary`. Pressed: `fluent/control/tertiary`, label and icons
    `fluent/text/secondary`, both bars hidden (L477-478).
  - Label and icons `fluent/text/primary`.
- **F.accent: Accent button** (L395, L417, L321).
  - Rest: `fluent/accent/default`; stroke `fluent/stroke/on-accent`; `edge-bottom`
    `fluent/elevation/accent-bottom`; `edge-top` hidden. Label and icons `fluent/text/on-accent`.
  - Hover: `fluent/accent/secondary`.
  - Pressed: `fluent/accent/tertiary`; no stroke and no bars (the pressed accent drops its bottom
    edge, L479); label `fluent/text/on-accent-secondary`, which is opaque.
  - Disabled: `fluent/accent/disabled`, no stroke or bars, label `fluent/text/on-accent-disabled`.
  - Dark: `#60cdff` with black labels, only on controls 32px tall or less (L301-312).
- **F.subtle: AppBarButton and row states** (L417, L423, L427). No fill or stroke at rest. Hover
  `fluent/subtle/secondary`; pressed `fluent/subtle/tertiary` with the label in
  `fluent/text/secondary`. Radius `radius/control`.
- **F.text-edge: text control** (L396, L418).
  - Rest: F.face with `face` `fluent/control/default`, stroke `fluent/stroke/control`, and
    `edge-bottom` 1px `fluent/stroke/control-strong`. Hover: `fluent/control/secondary`.
  - Focus: `face` `fluent/control/input-active`; `edge-bottom` becomes 2px `fluent/accent/default`.
    No focus visual: the base `focus-ring` stays hidden in every text control.
  - Error: stroke and `edge-bottom` 1px `fluent/system/critical`, plus a trailing 16px
    `error_circle` filled glyph in `fluent/system/critical`, 11px from the end (kit `153:796`).
  - Disabled: `fluent/control/disabled`, stroke `fluent/stroke/control`, no strong edge, text
    `fluent/text/disabled`.
  - Padding 10 left, 6 right, 5 top, 6 bottom (L188). Value F.body `fluent/text/primary`;
    placeholder F.body `fluent/text/secondary`.
- **F.focus: WinUI focus visual** (L502-505, L323). Build it once as `Fluent/.Focus ring`; never
  use the base `.Focus ring`.
  - Part `focus-ring`: an absolute frame at −3 on every side, radius = control radius + 3 (7 on r4
    controls, 13 on the toggle), with a 2px INSIDE stroke `fluent/focus/outer` (weight
    `focus/ring-width`).
  - Inside it, a theme-only `focus-inner` frame inset 2 (so it sits 1px outside the control),
    radius + 1, with a 1px INSIDE stroke `fluent/focus/inner`.
  - Measured on `159:1106`: control edge at 0, inner line at −1, outer ring at −2 and −3.
  - Strokes, not effects: an effect ring needs a filled, clipping node, which the subtle and link
    buttons do not have. "Offset 3" is the WinUI −3 margin, not a 3px gap (theme-character §5).
  - Dark outer is `#8d8d8d`, never white.
- **F.select-row: row selection** (L270-272, L423, L427). Fill `fluent/subtle/secondary`, radius
  `radius/control`, plus a 3×16 radius-1.5 `fluent/accent/default` pill at x 0, centred
  vertically (kits `154:767`, `154:778`). The pill uses the theme's own selection-indicator size
  and is one of the seven places.
- **F.selectorbar: SelectorBar selection** (L422). No track, no box. Idle label
  `fluent/text/secondary`. Selected label `fluent/text/primary` plus a 16×3 radius-1.5
  `fluent/accent/default` pill, centred under the label at the item's bottom (window `155:746`).
  Hover (derived): `fluent/subtle/secondary`, radius 4.
- **F.neutral (derived; accent policy).** For selections that WinUI paints in the accent but that
  are not one of the seven places:
  - **Latched** (Toggle, Page key current, Calendar day selected, Dropzone active): fill
    `fluent/subtle/secondary`, plus a 1px INSIDE `fluent/stroke/control-strong`; label
    `fluent/text/primary`; the Filled glyph where one exists (L444-445).
  - **Marks** (radio dot, slider range and thumb core, progress value, spinner arc): ink in
    `fluent/text/primary`.
  - Source roles: the selected fill of L423/L427, the strong edge of L396, and the ToggleSwitch-off
    anatomy of L421.
- **F.card** (L393, L428). `fluent/card/default`, 1px `fluent/stroke/card`, no shadow. Radius
  `radius/card` (8) for cards and the calendar; `radius/control` (4) for SettingsCards.
- **F.settings: SettingsCard** (L223-228, L384, L428). F.card at r4:
  - padding 16/16/16/18, minimum height 70;
  - optional 20px icon with 20 after it;
  - Body header over a Caption `fluent/text/secondary` description;
  - the control trailing.

  Hover `fluent/control/secondary` (WCT SettingsCard). Stacks are 4 apart (L152).
- **F.flyout (derived for the fill).** Menus, popovers, the command palette and the tooltip
  (L397, L429).
  - Fill: two paints, `fluent/solid/base` under `fluent/card/default`. This is a card layer on the
    solid base (the ladder of L286-288): it composites opaque `#fbfbfb` / `#2b2b2b`. Acrylic has no
    role, and acrylic is never placed on content (L458-459), so the flyout is opaque.
  - 1px INSIDE `fluent/stroke/surface`; radius `radius/card` (8, OverlayCornerRadius).
  - Shadow16: the base R.float effect (bound, §2) plus a theme-only ambient DROP_SHADOW
    `0 0 2 #0000001f` (L397).
- **F.dialog (derived).** ContentDialog (L429):
  - The F.flyout surface at r8, with shadow64 instead of shadow16: `0 0 8 #0000001f` plus
    `0 32 64` in `effect/shadow-overlay`. This is L397's shadow16 recipe at the 64 level (Fluent 2
    `shadow64`).
  - `backdrop` `surface/overlay` (Smoke, §2 exception).
  - `content` padding 0; header and body padding 24 (WinUI ContentDialog, not in DESIGN.md).
  - `footer`: a band in `fluent/solid/base` with a 1px `fluent/stroke/divider` top rule, padding
    24, gap 8. The primary action is the accent button.
- **F.severity: InfoBar severity disc** (L426, L467). A 16px circle in `fluent/system/<tone>`,
  holding a glyph in `fluent/text/inverse` ("!", `checkmark_12` or `dismiss_12`).
- **F.badge: Fluent 2 tint badge** (L245-256, L424). 20 tall, radius `radius/badge` (4), padding
  0/6, F.caption-strong. `fluent/badge/<tone>/bg` fill, `/fg` text and a 1px `/border` stroke.
  Copy kit `154:790`.
- **F.disabled.** No layer opacity. Use the disabled roles: `fluent/control/disabled`,
  `fluent/text/disabled`, `fluent/accent/disabled`, `fluent/text/on-accent-disabled`. Hide the
  edge bars.
- **States.**
  - Hover and pressed step fills: ControlFill Default → Secondary → Tertiary, or Subtle Secondary →
    Tertiary (L477).
  - Fluent draws no translucent state layers, so every `state-layer` part stays hidden.
- **F.icon: glyphs.**
  - Fluent System Icons, Regular style (MIT). Filled twins are used for the selected destination
    only (L444-445, L463-464).
  - Reuse the components on `152:729`. Import any missing glyph from `microsoft/fluentui-system-icons`
    (`assets/<Name>/SVG/ic_fluent_<name>_<size>_regular.svg`).
  - If a glyph cannot be fetched, keep the base glyph in that one slot and report it. Never draw
    a lookalike.
  - Map from the base names to FSI names:

  | Base | FSI | Base | FSI |
  | --- | --- | --- | --- |
  | plus | `add` | minus | `subtract` |
  | x | `dismiss` | check | `checkmark` |
  | chevron-down, -up, -left, -right | `chevron_down`, `_up`, `_left`, `_right` | arrow-left, -right, -up, -down | `arrow_left`, `_right`, `_up`, `_down` |
  | arrow-up-right | `arrow_up_right` | arrow-up-down | `arrow_sort` |
  | corner-down-left | `arrow_enter_left` | external-link | `open` |
  | search, filter, settings, calendar, globe, info, edit, copy, folder, camera, mic, circle, square | same name | menu | `navigation` |
  | more-horizontal, more-vertical | `more_horizontal`, `more_vertical` | grip-vertical | `re_order_dots_vertical` |
  | panel-left | `panel_left` | trash | `delete` |
  | download, upload | `arrow_download`, `arrow_upload` | paperclip | `attach` |
  | file, file-text | `document`, `document_text` | hash | `number_symbol` |
  | bell | `alert` | user | `person` |
  | sun, moon | `weather_sunny`, `weather_moon` | alert-circle | `error_circle` |
  | alert-triangle | `warning` | circle-check | `checkmark_circle` |
  | dot | `circle_small` | loader | `spinner_ios` |

- **F.ground (strips only).** Translucent fills need a ground. Place every strip row on a frame
  filled `fluent/solid/base` (the Mica fallback). Place field, list and card examples on an
  F.card, as the specimen does.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Fluent anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Fluent's spec does not draw; the derivation uses only
the recipes above.

**Sizes.** WinUI ships one control height, 32 (L144, L417). The other base sizes are derived:

| Size | Height | Source |
| --- | --- | --- |
| lg | 40 | The 40px SelectorBar and CommandBar rows (L146, L422) |
| sm | 24 | WinUI compact sizing |
| xs | 20 | The badge and checkbox geometry (L424) |

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Fluent/Icon`, `Fluent/Spinner`, `Fluent/.Focus ring` and
`Fluent/.State layer`.

| Style set | Base set | Fluent anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Fluent/Icon` (and `Fluent/Icon/<glyph>`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs.** FSI Regular per F.icon, as `Fluent/Icon/<base glyph name>`, plus `-filled` twins for the selected-nav glyphs (`box_20_filled` exists on `152:729`). They are filled outlines, so do not bind `icon/stroke`; bind the glyph fill. **Sizes:** sm 12, md 16, lg 20 (`size/icon/*`; L463-464). Use the FSI drawing of that size where `152:729` has one; otherwise scale the 16 | glyph fill `fluent/text/primary` (parents override it) |
| `Fluent/Spinner` | `Spinner` `252:11837` | (derived) WinUI ProgressRing: an indeterminate arc with round caps and no visible track (the track layer stays, unpainted). Keep the base sizes and geometry. The arc follows the parent's label role; standalone it is `fluent/text/primary` (F.neutral, not accent) | `fluent/text/primary` |
| `Fluent/.Focus ring` | `.Focus ring` `252:11805` | F.focus | `fluent/focus/*`, `focus/ring-width` |
| `Fluent/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Fluent states step fills | — |
| `Fluent/Button / md` | `Button / md` `253:372` | 32 tall, padding 0/12 (ButtonPadding 11 plus the 1px stroke), gap 8, 16px icon, label F.body Regular (L417, L369). Built on F.face. Variants: **primary** = F.accent ("Save changes"). **secondary** = F.standard ("Cancel"). **outline** = F.standard, identical (derived: WinUI has one neutral push button). **ghost** = AppBarButton, F.subtle, label `fluent/text/primary` (L417). **destructive** (derived) = F.standard with label and icons in `fluent/system/critical` (the TextBox error ink, L418); never a critical fill. **link** = HyperlinkButton: F.subtle with label `fluent/text/accent` (the "View all" hyperlink, L292-293). Its `underline` part stays hidden; the specimen hyperlink has none. **States:** hover and pressed per recipe; focus = rest + `Fluent/.Focus ring`; disabled F.disabled. `loading` shows `Fluent/Spinner` sm in the label role. No control shadow | `fluent/control/*`, `fluent/accent/*`, `fluent/stroke/*`, `fluent/elevation/*`, `fluent/text/*`, `fluent/system/critical` |
| `Fluent/Button / lg` | `Button / lg` `254:721` | (derived) As md at 40 tall, padding 0/12, icon 20 (`size/icon/lg`), label F.body | as md |
| `Fluent/Button / sm` | `Button / sm` `254:371` | (derived) As md at 24 tall (compact), padding 0/12, icon 12, label F.body | as md |
| `Fluent/Button / xs` | `Button / xs` `254:1071` | (derived) As md at 20 tall, padding 0/6, icon 12, label F.caption | as md |
| `Fluent/Icon button / md` | `Icon button / md` `255:262` | 32×32, 16px glyph centred, the Button md variant recipes. ghost = the icon-only AppBarButton with no rest fill (L417, spec A2) | as Button |
| `Fluent/Icon button / lg` | `Icon button / lg` `255:740` | (derived) 40×40, 20px glyph | as Button |
| `Fluent/Icon button / sm` | `Icon button / sm` `255:501` | (derived) 24×24, 12px glyph | as Button |
| `Fluent/Icon button / xs` | `Icon button / xs` `255:979` | (derived) 20×20, 12px glyph | as Button |
| `Fluent/Button group` | `Button group` `257:839` | The CommandBar row (L382, window `155:746`): items keep their own corners, gap 0, never joined. `separator` is the AppBarSeparator: a 1×20 `fluent/stroke/divider` rule with 12 of space on each side (vertical orientation: 20×1, gap 4). `text` is F.caption `fluent/text/secondary` with no fill (derived) | `fluent/stroke/divider` |
| `Fluent/Toggle / md` | `Toggle / md` `256:281` | (derived; WinUI AppBarToggleButton, accent-free per §1) 32 tall, padding 0/12, gap 8, 16px icon, label F.body. **default:** off = F.subtle with label `fluent/text/secondary` (idle, as L422); hover adds `fluent/subtle/secondary` and `fluent/text/primary`; selected = F.neutral latched with the Filled glyph; selected + hover uses `fluent/subtle/tertiary`. **outline:** off = F.standard; selected = F.neutral latched on the same shell, edge bars hidden. Focus: `Fluent/.Focus ring`. Disabled: F.disabled | `fluent/subtle/*`, `fluent/stroke/control-strong`, `fluent/text/*` |
| `Fluent/Toggle / sm` | `Toggle / sm` `256:437` | (derived) As md at 24 tall, icon 12 | as md |
| `Fluent/Toggle / lg` | `Toggle / lg` `256:593` | (derived) As md at 40 tall, icon 20 | as md |
| `Fluent/Icon toggle / md` | `Icon toggle / md` `276:8291` | (derived) As Toggle md, square 32, glyph only; selected swaps to the Filled glyph | as Toggle |
| `Fluent/Icon toggle / sm` | `Icon toggle / sm` `276:8431` | (derived) Square 24, glyph 12 | as Toggle |
| `Fluent/Icon toggle / lg` | `Icon toggle / lg` `276:8571` | (derived) Square 40, glyph 20 | as Toggle |
| `Fluent/Toggle group` | `Toggle group` `257:528` | **segmented** = the SelectorBar, the specimen's status filter (L422): F.selectorbar items, md 40 and sm 32 (derived), no track. Keep the base `tabs/*` bindings; under Fluent they resolve to no track, pad 0, gap 2, item padding 12. **default** and **outline:** `Fluent/Toggle`s, gap 4 (derived from the 4px nav spacing, L378) | `tabs/*`, `fluent/accent/default` (pill) |
| `Fluent/Action bar` | `Action bar` `258:663` | **floating** (derived): a CommandBar on the F.flyout surface (r8, stroke-surface, shadow16), 40 tall (L146), padding 4. Not the base inverse slab, which would break the dark rule. `count` F.body-strong; `separator` the AppBarSeparator; `close` `Fluent/Icon button / md` ghost `dismiss`. **inline** (derived): `fluent/subtle/secondary` fill, r4, 48 tall (the selected-row fill without a pill, L423); never `surface/selected` | `fluent/solid/base`, `fluent/card/default`, `fluent/stroke/surface`, `fluent/subtle/secondary` |
| `Fluent/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Fluent/Button / md` ghost with 16px FSI icons, label right (AppBarButtons, L417) | — |
| `Fluent/Theme toggle` | `Theme toggle` `258:742` | `Fluent/Icon button / md` ghost with `weather_moon` (light) and `weather_sunny` (dark) | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Fluent anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Fluent/Label` | `Label` `278:45` | **default:** F.body `fluent/text/primary`, the WinUI header and SettingsCard header ("Customer email", `155:746`). **eyebrow:** F.caption `fluent/text/secondary` (column-header style, L369-370). `required-mark` "*" in `fluent/system/critical` (window `155:746`). `optional-hint` F.caption `fluent/text/secondary`. **invalid** (derived): the label stays `fluent/text/primary`, because WinUI headers do not recolour; the error shows on the field and in Field's error row. **disabled:** `fluent/text/disabled` | `fluent/text/*`, `fluent/system/critical` |
| `Fluent/Input` | `Input` `279:312` | TextBox (kit `153:805`, L418): F.text-edge. md 32, sm 24 (derived), radius `radius/input` (4). Icons 16 in `fluent/text/secondary`. **hover**, **focus**, **invalid** and **disabled** per F.text-edge. **invalid-focus** (derived): the error stroke, `fluent/control/input-active`, and a 2px `fluent/system/critical` bottom edge. `focus-ring` hidden in every state | `fluent/control/*`, `fluent/stroke/*`, `fluent/accent/default`, `fluent/system/critical` |
| `Fluent/Textarea` | `Textarea` `280:597` | The multi-line TextBox ("Internal note", `155:746`): F.text-edge, minimum 80. `counter` F.caption in `fluent/text/secondary`, never tertiary ("0 / 500", L455-456), right-aligned in `footer`. The specimen sets it under the box; keep it inside to keep the part tree. `resize-handle`: WinUI draws none, so the layer stays, unpainted (derived) | as Input |
| `Fluent/Select` | `Select` `281:1023` | ComboBox (kit `153:822`, L419, L394). F.face with F.standard fill and side stroke. The `edge-bottom` is 1px `fluent/stroke/control-strong` in rest, hover and open (L322, L451-452), not the elevation bar. Value at 12, F.body. `chevron` 12px `chevron_down` in `fluent/text/secondary`, 12 from the end. md 32, sm 24 (derived). **hover:** `fluent/control/secondary`. **open:** the pressed fill `fluent/control/tertiary`; the chevron does not rotate. **focus:** rest plus `Fluent/.Focus ring` ("focused keeps a distinct perimeter", L419). **invalid** (derived): stroke and bottom edge `fluent/system/critical`. **disabled:** F.disabled, no strong edge | as Input |
| `Fluent/Select content` | `Select content` `281:826` | The ComboBox dropdown: `Fluent/Menu content` holding `Fluent/Menu item type=option`. The checked option is F.select-row | — |
| `Fluent/Checkbox` | `Checkbox` `283:1470` | CheckBox (kit `154:751`, L420): a 20px control (`size/checkbox`), r4 (`radius/checkbox`). **unchecked:** `fluent/control/alt-secondary` plus a 1px `fluent/stroke/control-strong` stroke. **checked:** `fluent/accent/default` with a 12px `checkmark` in `fluent/text/on-accent`, no stroke. **indeterminate:** accent with a 12px `subtract` in `fluent/text/on-accent`. **hover** (derived): unchecked fill `fluent/subtle/secondary`; checked fill `fluent/accent/secondary`. **focus:** `Fluent/.Focus ring` on `control`. **invalid** (derived): stroke `fluent/system/critical`. **disabled:** unchecked = no fill and a `fluent/accent/disabled` stroke (WinUI's disabled strong stroke has the same grey); checked = `fluent/accent/disabled` with a `fluent/text/on-accent-disabled` glyph. `label` F.body, gap 8; `description` F.caption `fluent/text/secondary` | `fluent/control/alt-secondary`, `fluent/stroke/control-strong`, `fluent/accent/*`, `fluent/text/on-accent*` |
| `Fluent/Radio` | `Radio` `284:1828` | (derived; F.neutral) A 20px circle. **unchecked:** the unchecked CheckBox well, round. **checked:** the same well with a 12px `fluent/text/primary` dot, the ToggleSwitch knob size (L421). **hover:** the dot grows to 14, as the toggle knob does. Focus on `control`; invalid stroke `fluent/system/critical`; disabled `fluent/accent/disabled` stroke and `fluent/text/disabled` dot. The base `indicator` ellipse keeps its layer name | as Checkbox |
| `Fluent/Radio group` | `Radio group` `284:1885` | Nests `Fluent/Radio`; gap 4 (derived, L378) | — |
| `Fluent/Switch` | `Switch` `285:2329` | ToggleSwitch (kit `154:742`, L421). The track is 40×20 r10 with a 12px knob 4 from the end (`size/switch/*`; sm is the same size, because Fluent aliases it). Add a theme-only `state-label` part, "On" or "Off" in F.body `fluent/text/primary`, 12 to the left of `control`. **off:** `fluent/control/alt-secondary`, a 1px `fluent/stroke/control-strong` stroke, knob `fluent/text/secondary`. **on:** `fluent/accent/default`, no stroke, knob `fluent/text/on-accent`. **hover:** the knob grows to 14 (L421); fills step to `fluent/subtle/secondary` (off) or `fluent/accent/secondary` (on) (derived). **focus:** `Fluent/.Focus ring` on `track` (r13 outer). **invalid** (derived): stroke `fluent/system/critical`. **disabled:** off = a `fluent/accent/disabled` stroke and a `fluent/text/disabled` knob; on = a `fluent/accent/disabled` fill and a `fluent/text/on-accent-disabled` knob. Draw the `thumb` as a 12px circle frame with the same layer name | `fluent/control/alt-secondary`, `fluent/stroke/control-strong`, `fluent/accent/*`, `fluent/text/*`, `size/switch/*` |
| `Fluent/Field` | `Field` `287:2656` | Nests `Fluent/Label` and `Fluent/Input`. **vertical:** label above the control, gap 8 (the WinUI header margin, derived); `description` F.caption `fluent/text/secondary`. **horizontal:** F.settings, with label and description on the left and the control trailing (the SettingsCards of `155:746`, L428). **Error row:** a 12px filled `error_circle` plus F.caption, both in `fluent/system/critical` ("This code expired on Oct 15.", `155:746`) | `fluent/card/default`, `fluent/stroke/card`, `fluent/system/critical` |
| `Fluent/Field set` | `Field set` `287:2743` | `legend` F.subtitle (the editor header, L368). `description` F.caption `fluent/text/secondary`. `group` gap 4: SettingsCards stack 4 apart (L152, L383). `separator` 1px `fluent/stroke/divider` | `fluent/stroke/divider` |
| `Fluent/Input group` | `Input group` `297:3861` | The `Fluent/Input` frame (F.text-edge on `root`; the focus state takes the accent bottom edge). The addon is a 16px icon in `fluent/text/secondary`, `text` in F.caption `fluent/text/secondary`, or `Fluent/Icon button / xs` ghost (derived: the TextBox's inline subtle button) | as Input |
| `Fluent/OTP slot` | `OTP slot` `301:4385` | (derived) Each slot is a 32×32 TextBox (F.text-edge) with its own face; the base slot is transparent. Character F.body centred. **caret:** 1×16 `fluent/text/primary`. **focus:** the focused TextBox (input-active fill and the 2px accent bottom edge). **invalid:** critical. **disabled:** TextBox disabled | as Input |
| `Fluent/Input OTP` | `Input OTP` `301:4490` | (derived) Group gap 4 instead of −1: WinUI never joins text boxes. The separator is a 12px `subtract` in `fluent/text/secondary` | — |
| `Fluent/Slider` | `Slider` `303:5022` | (derived; WinUI Slider, accent-free per §1) **track:** 4 tall, r2, `fluent/control/strong`. **range:** `fluent/text/primary` (F.neutral). **thumb:** a 20px circle, `fluent/control/solid` with a 1px `fluent/stroke/control` stroke and a 12px `fluent/text/primary` core; the core grows to 14 on hover. `value-label` F.caption. The base track and range rounded-rectangles become rectangles with the same layer names | `fluent/control/strong`, `fluent/control/solid`, `fluent/text/primary` |
| `Fluent/Combobox` | `Combobox` `305:5623` | (derived) An editable ComboBox: `Fluent/Input` with a 12px `chevron_down`. Focus takes the TextBox focus (accent bottom edge). **open:** `Fluent/Menu content` with option rows; `empty` in F.caption `fluent/text/secondary`. Chips are `Fluent/Badge` subtle (the tint badge) with `remove` | — |
| `Fluent/Calendar day` | `Calendar day` `307:6154` | (derived; CalendarView, accent-free per §1) 32 square, r4, F.body `fluent/text/primary`. **rest:** no fill. **hover:** `fluent/subtle/secondary`. **today:** a 1px INSIDE `fluent/stroke/control-strong` ring, no fill. **single, range-start, range-end:** F.neutral latched. **range-middle:** `fluent/subtle/secondary`, radius 0, no ring. **outside:** `fluent/text/secondary`. **focus:** `Fluent/.Focus ring`. **disabled:** `fluent/text/disabled` | `fluent/subtle/secondary`, `fluent/stroke/control-strong` |
| `Fluent/Calendar` | `Calendar` `309:8620` | F.card at r8, padding 16 (L151). Caption F.body-strong; weekdays F.caption `fluent/text/secondary`; nav keys `Fluent/Icon button / sm` ghost with 12px chevrons; month select `Fluent/Select` sm | `fluent/card/default`, `fluent/stroke/card` |
| `Fluent/Date picker` | `Date picker` `313:14889` | (derived) CalendarDatePicker: a `Fluent/Select` md trigger with a trailing 16px `calendar` in `fluent/text/secondary`. **open:** `Fluent/Popover` holding `Fluent/Calendar` | — |
| `Fluent/Search` | `Search` `316:16426` | AutoSuggestBox (L377, `155:746`): F.text-edge. **md** 480×32 (the TitleBar box); **sm** 280×24 (derived). Move `icon` after `label`: the WinUI query glyph is trailing, a 16px `search` in `fluent/text/secondary`. `label` is the placeholder, F.body `fluent/text/secondary`. **hover:** `fluent/control/secondary`. **focus** and **open:** the TextBox focus. `kbd` `Fluent/Kbd` | as Input |
| `Fluent/Dropzone` | `Dropzone` `319:16832` | (derived) F.card at r8. Keep the base dashed stroke, recoloured `fluent/stroke/control-strong`. Icon: a 20px `arrow_upload` in `fluent/text/secondary`. `label` F.body; `hint` F.caption `fluent/text/secondary`. **hover:** `fluent/control/secondary`. **active:** F.neutral latched with a solid stroke. **uploading:** a ProgressBar, i.e. a 1px `fluent/control/strong` rail under a 3px r1.5 `fluent/text/primary` value (accent-free per §1). **invalid:** stroke `fluent/system/critical`, plus `status` in F.caption `fluent/system/critical` with a 12px error glyph. **focus:** `Fluent/.Focus ring`. **disabled:** F.disabled | `fluent/card/default`, `fluent/stroke/control-strong`, `fluent/control/strong` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Fluent anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Fluent/Location marker` | `Location marker` `337:22` | **sm:** a 4px circle in `fluent/text/secondary` (the prose bullet, derived). **md:** the selection pill, 3×16 r1.5 in `fluent/accent/default` (L205-208, L270). Fluent parents ignore `deco/marker` (false in Fluent) and show the pill by state | `fluent/accent/default`, `fluent/text/secondary` |
| `Fluent/Breadcrumb item` | `Breadcrumb item` `338:92` | BreadcrumbBar ("Commerce › Orders", `155:746`). **link:** F.body `fluent/text/secondary`; hover `fluent/text/primary` (derived). **current:** F.body `fluent/text/primary`. Never mono. `separator` 12px `chevron_right` in `fluent/text/secondary`. **ellipsis:** `more_horizontal`. **focus:** `Fluent/.Focus ring` | `fluent/text/*` |
| `Fluent/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Fluent/Breadcrumb item`; gap 8 (measure on `155:746`) | — |
| `Fluent/Page key` | `Page key` `339:270` | (derived) **page:** a 32×32 F.subtle key, F.body `fluent/text/primary`. **current:** F.neutral latched. **previous** and **next:** swap to `Fluent/Button / md` ghost with "Previous" and "Next" and 12px chevrons ("‹ Previous", "Next ›", `155:746`); disabled `fluent/text/disabled`. **ellipsis:** `more_horizontal`. **focus:** `Fluent/.Focus ring` | `fluent/subtle/*`, `fluent/stroke/control-strong` |
| `Fluent/Pager tile` | `Pager tile` `339:319` | (derived) F.settings. `direction` F.caption `fluent/text/secondary`; `title` F.body `fluent/text/primary`; hover `fluent/control/secondary` | `fluent/card/default`, `fluent/stroke/card` |
| `Fluent/Pagination` | `Pagination` `339:379` | The ListView pager row, 48 tall (L384). `meta` F.caption `fluent/text/secondary` ("Showing 1–6 of 3,182 · 1 selected"). Nests `Fluent/Page key` (gap 4) and `Fluent/Pager tile` | — |
| `Fluent/Tab / horizontal` | `Tab / horizontal` `342:402` | SelectorBar (L422): 40 tall, padding `tabs/item-pad` (12), label F.body, `count` is `Fluent/Badge` plain, neutral (F.caption `fluent/text/secondary`, "All 3,182"). F.selectorbar: reshape `indicator` into the 16×3 accent pill and show it on selected only. **default**, **line** and **segmented** all draw the SelectorBar (derived for line and segmented). `marker` hidden. **focus:** `Fluent/.Focus ring`. **disabled:** `fluent/text/disabled` | `tabs/*`, `fluent/accent/default`, `fluent/text/*` |
| `Fluent/Tab / vertical` | `Tab / vertical` `342:599` | (derived) A NavigationView item: 36 tall, r4. Selected = F.select-row, with `indicator` as the leading 3×16 pill. Hover `fluent/subtle/secondary` | as horizontal |
| `Fluent/Tabs list` | `Tabs list` `343:424` | No track and no box (`tabs/track` transparent, `tabs/pad` 0), gap `tabs/gap` | `tabs/*` |
| `Fluent/Tabs` | `Tabs` `343:489` | Nests `Fluent/Tabs list` | — |
| `Fluent/Nav item` | `Nav item` `345:601` | NavigationViewItem (kit `154:768`, L427): 36 tall, r4 (`nav/radius`). Icon 20 at x 10; label F.body `fluent/text/primary` at x 44, Regular when selected. `count` is `Fluent/Badge` plain, neutral (F.caption `fluent/text/secondary`), 12 from the end ("1,846", `155:746`). **hover:** `fluent/subtle/secondary`. **selected:** F.select-row. Swap `marker` to `Fluent/Location marker` md at x 0, centred, and show it by state, not by `deco/marker`. The icon swaps to its Filled twin (L444-445). `chevron` 12px `chevron_down` in `fluent/text/secondary`. **level 2:** indent 24 (derived). **collapsed:** a 40×36 icon-only item in the 48 compact pane, with the pill (MUX-NAV, `fluent-sources.md`). **focus:** `Fluent/.Focus ring`. **disabled:** `fluent/text/disabled` | `nav/*`, `fluent/subtle/secondary`, `fluent/text/*` |
| `Fluent/Nav group` | `Nav group` `346:611` | NavigationViewItemHeader: 40 tall, F.body-strong `fluent/text/secondary` ("Channels", L379). Items 4 apart (L378). Separators: a 1px `fluent/stroke/divider` in an 8 slot (L378). Nests `Fluent/Nav item` | `fluent/stroke/divider` |
| `Fluent/Sidebar` | `Sidebar` `347:994` | NavigationView pane (L378-380): 280 wide, padding 4 (`nav/pad`), no fill (it sits on the window's Mica, which never goes on a component), no trailing stroke. `sidebar-footer`: the profile item, 40 tall with a Fluent avatar and two lines (F.body plus F.caption `fluent/text/secondary`), then Settings at 36 (L380). `brand-group` (derived): `Fluent/.Brand logo` plus an F.caption wordmark, as the TitleBar. **floating** (derived): the pane on the F.flyout surface with an 8 inset (WinUI LeftMinimal). **inset:** the content area is the content layer: `fluent/layer/default` with a 1px `fluent/stroke/card` on top and left, top-left r8 (L392). **icon:** the 48 compact pane | `fluent/layer/default`, `fluent/stroke/card` |
| `Fluent/Top bar` | `Top bar` `351:1349` | TitleBar (L376-377): 48 tall, no fill, no rule, no shadow (`topbar/*` after the shared step). **`topbar-start`:** the back button and pane toggle, both 40×32 subtle (`arrow_left`, and `Fluent/Sidebar toggle`); `Fluent/.Brand logo`; wordmark F.caption ("Northwind Commerce"). The nested Breadcrumb stays hidden: Fluent sets it above the page title (L381). **`topbar-end`:** fills the remaining width. Theme-only `spacer-start` and `spacer-end` centre `Fluent/Search` md (480×32); then `Fluent/Icon button / md` ghost, `Fluent/Theme toggle`, a 32px Fluent avatar, and the version badge as an F.badge (informative). The 46×48 caption buttons belong to Window chrome (K1), not here. **mobile** (derived): 48 tall, with the pane toggle, the app icon and a `search` icon button. **docs:** `Fluent/Nav menu item`s in the bar | `topbar/*` |
| `Fluent/.Brand logo` | `.Brand logo` `344:410` | The 16px Fluent Color app icon `building_store_16_color` (L376, L466) in a 16 root; copy the instance from the TitleBar of `155:746`. The base `N` part stays, hidden | — |
| `Fluent/Nav menu item` | `Nav menu item` `349:1036` | (derived) A top-pane NavigationView item: 40 tall, F.selectorbar (label `fluent/text/secondary`; selected `fluent/text/primary` with the 16×3 pill). `marker` hidden. **hover** and **open:** `fluent/subtle/secondary`, r4. `chevron` 12px `chevron_down` in `fluent/text/secondary`; it does not rotate | `fluent/subtle/secondary`, `fluent/accent/default` |
| `Fluent/.Nav menu link` | `.Nav menu link` `348:1108` | Highlighted: `fluent/subtle/secondary`, r4. Title F.body `fluent/text/primary`; description F.caption `fluent/text/secondary`. Focus `Fluent/.Focus ring` | — |
| `Fluent/Navigation menu` | `Navigation menu` `349:1132` | The viewport is F.flyout; links 4 apart | — |
| `Fluent/Menubar trigger` | `Menubar trigger` `349:1153` | (derived) MenuBarItem, an AppBarButton without icon: 32 tall, padding 0/12, F.body `fluent/text/primary`. **hover** and **open:** `fluent/subtle/secondary`. Focus `Fluent/.Focus ring`; disabled `fluent/text/disabled` | `fluent/subtle/*` |
| `Fluent/Menubar` | `Menubar` `349:1236` | (derived) The root has no fill and no stroke (WinUI's MenuBar has no frame); padding 0, gap 0. Menus are `Fluent/Menu content` | — |
| `Fluent/Step` | `Step` `352:1355` | (derived; there is no WinUI stepper) `indicator`: a 24 circle, from the F.severity disc. **complete:** `fluent/system/success` with a 12px `checkmark` in `fluent/text/inverse`. **error:** `fluent/system/critical` with a 12px `dismiss` in `fluent/text/inverse`. **current:** `fluent/control/default`, a 1px `fluent/stroke/control-strong` ring and the number in F.caption-strong `fluent/text/primary`. **upcoming:** `fluent/control/alt-secondary`, a 1px `fluent/stroke/control` ring and the number in F.caption `fluent/text/secondary`. `title` F.body; `description` F.caption `fluent/text/secondary`. `connector` 1px `fluent/stroke/divider`, or `fluent/stroke/control-strong` when complete. No accent | `fluent/system/*`, `fluent/text/inverse`, `fluent/stroke/*` |
| `Fluent/Stepper` | `Stepper` `352:1424` | Nests `Fluent/Step` | — |
| `Fluent/Sidebar toggle` | `Sidebar toggle` `344:462` | **desktop:** swap to `Fluent/Icon button / md` ghost resized to 40×32, the TitleBar pane toggle (L376), with a 16px `navigation`; open shows `dismiss`. **mobile:** `Fluent/Icon button / lg` ghost with `navigation` and `dismiss` | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

| Style set | Base set | Fluent anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Fluent/.Kbd` | `.Kbd` `370:31` | **Retired** (moved to the Overlays Draft area by B6). Do not build it; build `Fluent/Kbd` in 4.5 instead | — |
| `Fluent/Menu item` | `Menu item` `371:587` | (derived) MenuFlyoutItem, from the NavigationViewItem row (L427): 36 tall, r4, padding 0/12, gap 12. Icon 16 and label F.body, both `fluent/text/primary`. **highlighted:** `fluent/subtle/secondary`. **destructive:** label and icon `fluent/system/critical`; highlighted adds `fluent/system/critical-bg`. **disabled:** `fluent/text/disabled`. Indicators: **checkbox** a 16px `checkmark` in `fluent/text/primary`, no box; **radio** the base 8px dot in `fluent/text/primary`; **option** checked = F.select-row (the ComboBox item's pill and fill); **submenu** a 12px `chevron_right` in `fluent/text/secondary`. `shortcut` is `Fluent/Kbd` sm, right-aligned; `description` F.caption `fluent/text/secondary`; `loading` `Fluent/Spinner` sm | `fluent/subtle/secondary`, `fluent/system/critical*`, `fluent/text/*` |
| `Fluent/Menu label` | `Menu label` `373:35` | F.caption `fluent/text/secondary` (column-header style, L369-370), padding 0/12 | — |
| `Fluent/Menu separator` | `Menu separator` `373:38` | A 1px `fluent/stroke/divider` rule with 4px margins (MenuFlyoutSeparator) | `fluent/stroke/divider` |
| `Fluent/Menu group` | `Menu group` `373:248` | Nests `Fluent/Menu label` and `Fluent/Menu item` | — |
| `Fluent/Menu content` | `Menu content` `373:256` | MenuFlyout: F.flyout (r8, `fluent/stroke/surface`, shadow16, L397), padding 4, minimum width 192 | `fluent/solid/base`, `fluent/card/default`, `fluent/stroke/surface` |
| `Fluent/Dropdown menu` | `Dropdown menu` `374:382` | (derived) DropDownButton: the trigger is `Fluent/Button / md` secondary with a trailing 12px `chevron_down` in `fluent/text/secondary`; `Fluent/Menu content` 4px below | — |
| `Fluent/Context menu` | `Context menu` `374:653` | The trigger area is an F.card at r8 with "Right-click" in F.body `fluent/text/secondary`; no dashes (derived). The menu is `Fluent/Menu content` at the pointer | `fluent/card/default`, `fluent/stroke/card` |
| `Fluent/Dialog` | `Dialog` `378:743` | ContentDialog (L429), F.dialog. `title` F.subtitle; `description` F.body `fluent/text/secondary`. `close` (WinUI dialogs have none): when shown, `Fluent/Icon button / sm` ghost with `dismiss`. Footer: `Fluent/Button / md`, primary = the accent button and the others secondary | `surface/overlay`, F.dialog roles |
| `Fluent/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a 40 r4 tile. **destructive:** `fluent/system/critical-bg` with an F.severity disc in `fluent/system/critical`. **default:** `fluent/subtle/secondary` with a 16px `info` in `fluent/text/secondary` (WinUI's informational severity is the accent, which §1 rules out). `cancel` is `Fluent/Button / md` secondary; `action` is primary (accent) or destructive | `fluent/system/critical*`, `fluent/subtle/secondary` |
| `Fluent/Sheet` | `Sheet` `379:1004` | (derived) A modal panel: F.dialog with `fluent/stroke/surface` on the inner edge only, r8 on the exposed corners, shadow64, over `surface/overlay`. Title F.subtitle; close `Fluent/Icon button / sm` ghost; the footer band as Dialog. `handle`: 36×4 r2 in `fluent/stroke/control-strong` (WinUI has no grabber; the base geometry, recoloured) | `fluent/stroke/*`, `surface/overlay` |
| `Fluent/Drawer` | `Drawer` `379:1150` | As Sheet; footer buttons are `Fluent/Button / md`, stacked full width | — |
| `Fluent/Popover` | `Popover` `381:937` | Flyout: F.flyout, padding 16 (L151), W 288. `title` F.body-strong; `description` F.caption `fluent/text/secondary`; `close` `Fluent/Icon button / sm` ghost. WinUI flyouts have no arrow: `arrow` and `arrow-tip` keep their layers with no paint, so the boolean shows nothing | F.flyout roles |
| `Fluent/Tooltip` | `Tooltip` `381:1030` | (derived from the flyout recipe) WinUI ToolTip: the F.flyout fill and edge, radius `radius/badge` (4), padding 8/6, shadow16. Label F.caption `fluent/text/primary`; `kbd` `Fluent/Kbd` inverse. Light in light and dark in dark, never an inverse chip; bind no `tooltip/*` role. No arrow: same treatment as Popover | F.flyout roles |
| `Fluent/Hover card` | `Hover card` `381:1093` | F.flyout, padding 16, W 320. The avatar is `Fluent/Avatar` md, initials (4.5). `title` F.body-strong; `description` and `meta` F.caption `fluent/text/secondary`; meta icon a 16px `calendar` | `fluent/avatar/*` |
| `Fluent/Command item` | `Command item` `382:1015` | ListViewItem (kit `154:779`): r4, label at x 12. 40 tall for one line (page, action); 48 when `url` or `excerpt` shows (two-line rows, L384). `label` F.body `fluent/text/primary`. `url` F.caption `fluent/text/secondary`, Open Sans, not mono. `excerpt` F.caption `fluent/text/secondary`, with matched words in F.caption-strong `fluent/text/primary`. **selected:** F.select-row. The base 2px `marker/default` stroke is removed; a theme-only `pill` carries the accent. Add a 16px `arrow_enter_left` in `fluent/text/secondary`. `kind` is an F.badge (informative). A section row is indented and shows a 16px `number_symbol`. `shortcut` is `Fluent/Kbd`. **disabled:** `fluent/text/disabled` | `fluent/subtle/secondary`, `fluent/accent/default`, `fluent/badge/informative/*` |
| `Fluent/Command palette` | `Command palette` `383:1355` | AutoSuggestBox flyout: F.flyout (r8, stroke-surface, shadow16), W 640, over `surface/overlay` when `scrim`. **`input-row`:** 56 tall, padding 12, holding a focused `Fluent/Input` md (input-active fill and the 2px accent bottom edge, L418) and `Fluent/Kbd` "Esc"; a 1px `fluent/stroke/divider` below. **`filters`:** `Fluent/Toggle group` segmented (SelectorBar), 40. **`group-label`:** F.caption `fluent/text/secondary`. **`empty`:** F.body `fluent/text/secondary`. **`footer`:** 40, a `fluent/solid/base` band with a top divider and F.caption `fluent/text/secondary` | F.flyout roles, `surface/overlay` |

### 4.5 Data display 1 (page `Components · Data display`, `229:344`)

Build `Fluent/Kbd`, `Fluent/Badge` and `Fluent/Avatar` first; the other sets nest them. Some base
tokens still resolve to Radix values under Theme Fluent, so the rows below rebind them:
`kpi/bg-*`, `card/footer`, `table/zebra`, `table/head-rule`, `surface/selected`, `surface/card`
and `marker/default`.

| Style set | Base set | Fluent anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Fluent/Kbd` | `Kbd` `403:28` | (derived) WinUI writes accelerators as text ("Ctrl+S" in a MenuFlyoutItem), not keycaps. **default:** `label` in F.caption `fluent/text/secondary`, Open Sans (not mono). No fill, stroke, radius or padding. Height `size/kbd` (md) or `size/kbd-sm` (sm); the minimum width = H is kept. **inverse:** the same, because the Fluent tooltip is a light flyout; bind no `tooltip/*` role | `fluent/text/secondary`, `size/kbd*` |
| `Fluent/Kbd group` | `Kbd group` `403:96` | (derived) Reads as one accelerator string ("Ctrl+K"): `Fluent/Kbd` keys joined by "+" in F.caption `fluent/text/secondary`, gap 0 instead of 4 | — |
| `Fluent/Badge` | `Badge` `405:180` | Fluent 2 badge (L245-256, L424, kit `154:790`): 20 tall, padding 0/6, radius `radius/badge` (4), label F.caption-strong in sentence case. `iconStart` 12 (`size/icon/sm`), gap 4; `remove` a 12px `dismiss`. **Tones** (L295-296): neutral → `fluent/badge/informative/*` ("Refunded"); info → `brand` ("Shipped"); success → `success` ("Paid"); warning → `warning` ("Awaiting payment", orange); destructive → `danger` ("Payment failed", cranberry). **Styles:** **subtle** = Fluent 2 *tint*, the theme's primary style: `/bg` fill, `/fg` label and icon, 1px `/border`. **outline** = Fluent 2 *outline*: no fill; stroke and label in `/fg` (currentColor). **solid** (derived; Fluent 2 *filled* has no role): `/fg` fill with the label in `/bg`, no stroke. **plain** = Fluent 2 *ghost*, no container, padding 0: label F.caption Regular in `/fg`. Neutral plain is `fluent/text/secondary`: the nav and SelectorBar counts ("1,846", "3,182", `155:746`). `dot`: Fluent badges carry no dot, so the layer stays unpainted and the boolean shows nothing | `fluent/badge/*`, `fluent/text/secondary`, `radius/badge` |
| `Fluent/Badge / kind` | `Badge / kind` `405:211` | (derived) Fluent has no code-syntax palette. Every kind is the informative tint badge (Badge neutral, subtle); the kind word carries the meaning. `dot` unpainted, as Badge. Do not bind `code/syntax/*` | `fluent/badge/informative/*` |
| `Fluent/Avatar` | `Avatar` `406:95` | Fluent 2 avatar (L468-469, kit `154:803`): a circle (`radius/avatar` 999). sm 24, md 32, lg 40 (`size/avatar/*`); rows and activity use 32, the pane profile 24 (`155:746`). **initials:** the colourful palette, fill `fluent/avatar/<palette>/bg` and initials `fluent/avatar/<palette>/fg` (light tint40 on shade30, dark reversed). The default palette is `royal-blue`; instances override the pair with teal, grape, marigold, pumpkin or light-green. Initials F.caption-strong (sm, md) or F.body-strong (lg). **image:** a clipped circle. **fallback** (derived): a `fluent/subtle/secondary` disc with a `person` glyph in `fluent/text/secondary`. **agent:** the "Shipping bot" avatar (`155:746`, L466): a `fluent/subtle/secondary` disc with the Fluent Color `bot_24_color` icon (20 on md, derived). Never the accent | `fluent/avatar/*`, `fluent/subtle/secondary`, `size/avatar/*` |
| `Fluent/Avatar presence` | `Avatar presence` `406:43` | (derived; Fluent 2 presence, not in the specimen) An 8×8 circle with a 2px OUTSIDE ring in `fluent/solid/base`, instead of the base `surface/card`. **online:** `fluent/system/success`. **away:** `fluent/system/caution`. **offline:** no fill, a 1px INSIDE `fluent/stroke/control-strong` ring | `fluent/system/*`, `fluent/solid/base` |
| `Fluent/Avatar group` | `Avatar group` `406:150` | (derived) Nests `Fluent/Avatar`, one palette per member; overlap −8 kept; a 2px OUTSIDE `fluent/solid/base` ring per avatar. The `count` avatar is the fallback disc with "+3" in F.caption-strong `fluent/text/primary` | `fluent/solid/base`, `fluent/subtle/secondary` |
| `Fluent/Item` | `Item` `408:792` | **outline** = the SettingsCard (L428, spec D6, `155:746`): F.settings. Fill `card/bg`, 1px `fluent/stroke/card`, padding 16/16/16/18, minimum height 70 (L384). `media` a 20px `Fluent/.Item icon tile`, 20 after it. `title` F.body `fluent/text/primary`; `description` F.caption `fluent/text/secondary`. `actions` trailing, swapped to `Fluent/Button / md` secondary. Hover `fluent/control/secondary`. **default** (derived) = a ListView row (kit `154:779`): no fill, F.subtle hover. **muted** (derived): `fluent/card/secondary`, no stroke. **Sizes:** default as above; sm a 48 row with padding 12 (L384, L423); xs 40 with padding 8/12 (kit `154:779`). `chevron` a 12px `chevron_right` in `fluent/text/secondary` (a clickable SettingsCard). `header` and `footer` rows F.caption `fluent/text/secondary`. Radius `radius/input` (4) kept. **focus:** `Fluent/.Focus ring` | `card/bg`, `fluent/stroke/card`, `fluent/control/secondary`, `fluent/card/secondary` |
| `Fluent/Item group` | `Item group` `408:996` | **separators false:** the SettingsCard stack, items 4 apart (L152, L383), no rules. **separators true** (derived; a SettingsExpander): rows on one F.card r8 (`card/bg`, `card/border`) with 1px `fluent/stroke/divider` rules between them. Rows nest `Fluent/Item` sm with `Fluent/Avatar` media | `fluent/stroke/divider` |
| `Fluent/.Item icon tile` | `.Item icon tile` `408:82` | SettingsCard icons have no tile (L428, `155:746`): root 20×20 with no fill; the glyph a 20px FSI Regular icon in `fluent/text/primary` (Regular 20 for SettingsCards, L463) | `fluent/text/primary` |
| `Fluent/.Item image` | `.Item image` `408:85` | As base: a 40×40 image fill, r4 through `radius/input` | — |
| `Fluent/Card` | `Card` `409:951` | The flat Fluent card (L393, L438; the KPI, ListView and activity cards of `155:746`). **default:** fill `card/bg` (= `fluent/card/default`, theme-character §2.4); stroke `card/border` (= `fluent/stroke/card` after the shared step) at 1 on all four sides (`card/border-*`); radius `radius/card` (8). No shadow: R.card-shadow resolves to 0; do not add one. Padding 16 (L151), gap 12 (L150). `eyebrow` F.caption `fluent/text/secondary`. `title`: md F.subtitle (the editor header "Order SO-10480", L368); sm F.body-strong with an optional 24px Fluent Color icon ("Recent activity", `history_24_color`, L466). `description` F.caption `fluent/text/secondary`. `action` `Fluent/Button / md` link ("View all", L292-293). **`footer`** (derived): a `fluent/card/secondary` band with a 1px `fluent/stroke/divider` top rule and `Fluent/Button / md` buttons (accent and Standard); never the Radix `card/footer`. **rule:** no fill, radius or shadow; a 1px `fluent/stroke/divider` top rule; hover `fluent/subtle/secondary`. **hover:** `fluent/control/secondary` (SettingsCard hover). **focus:** `Fluent/.Focus ring` (r11 outer). **selected** (derived; F.neutral): adds a second fill in `fluent/subtle/secondary` and a 1px `fluent/stroke/control-strong` stroke; never `surface/selected` or the accent | `card/bg`, `card/border`, `card/border-*`, `radius/card`, `fluent/card/secondary`, `fluent/stroke/divider` |
| `Fluent/Stat card` | `Stat card` `409:1270` | The KPI card (L216-222, L382, L425; `155:746`): 286×110, F.card r8. Fill `card/bg`, not `kpi/bg-1`, which stays a Radix paper under Fluent. Stroke `kpi/border` (= `fluent/stroke/card`) on all sides. Padding 16, literal: `kpi/pad-x` is still 20. `icon` is a 32px Fluent Color icon (`data_trending_32_color`, `receipt_32_color`, `coin_multiple_32_color`, `gauge_32_color`; L465-466) at the top left, with label, value and delta stacked to its right (measure `155:746`). `label` F.body `fluent/text/secondary` ("Net revenue"), sentence case, not an eyebrow. `value` T.kpi (28/36 SemiBold −0.5 under Fluent, the Title style, L368) in `fluent/text/primary`. **delta:** a 12px filled `arrow_up` or `arrow_down` plus the value, both F.caption-strong in `fluent/system/success` (up) or `fluent/system/critical` (down); an instance may override to `fluent/system/caution` (L297, "↑ 0.2 pts"). `detail` F.caption `fluent/text/secondary` ("vs. previous 30 days"). **none:** delta hidden. Decorations stay off (`deco/*` false in Fluent). **hero** (derived; the specimen's four KPIs are equal): as default, with the value one step up the ramp (`type/display`, Title Large 40/52, L366). `badge` is `Fluent/Badge` subtle | `card/bg`, `kpi/border`, `kpi/border-*`, `type/kpi/*`, `fluent/system/*` |
| `Fluent/Table header cell` | `Table header cell` `410:546` | ListView header (L384, `155:746`): 36 tall (`header-row`, L146), padding-x 12, no fill. `label` F.caption `fluent/text/secondary`, sentence case, never uppercase ("Order", "Customer"; L369-370). **asc** and **desc:** label `fluent/text/primary` plus a 12px `arrow_sort_up` or `arrow_sort_down` in `fluent/text/secondary` after it ("Date ↓"). **none:** no glyph even when `sortable` (derived; the specimen shows a glyph only on the sorted column). **hover** (derived): `fluent/subtle/secondary`, r4. **focus:** `Fluent/.Focus ring` | `fluent/text/*`, `fluent/subtle/secondary` |
| `Fluent/Table cell` | `Table cell` `410:383` | ListView cells (L423, `155:746`): padding-x 12, no column rules (`table/cell-rule-width` 0). **text:** F.body `fluent/text/primary`. **strong:** F.body `fluent/text/primary`; Fluent never bolds row text, and order and customer names are Regular (L369). **mono:** F.body Open Sans, not mono ("SO-10482"). **number:** F.body `fluent/text/primary`, end-aligned ("$1,284.00"; `tnum` pending #2414). **muted:** F.body `fluent/text/secondary` (the dates). The `secondary` line is F.caption `fluent/text/secondary` under the value ("Online store", the email). **badge:** `Fluent/Badge` subtle. **avatar:** `Fluent/Avatar` md, then the name in F.body and the email in F.caption `fluent/text/secondary`, gap 12. **actions:** `Fluent/Icon button / md` ghost `more_horizontal`; the specimen shows it on the hovered row. **select:** `Fluent/Checkbox` | `fluent/text/*` |
| `Fluent/Table row` | `Table row` `412:1187` | ListView row (L210-215, L423, kit `154:779`, `155:746`): 48 tall, r4 (`table/row-radius` 4), padding-left 12. No row rules (`table/row-rule-width` 0); rows abut (`table/row-gap` 0). **rest:** `table/row-bg` (transparent after the shared step). **hover:** `table/hover` (= `fluent/subtle/secondary`). **selected:** `fluent/subtle/secondary`, not `surface/selected`; the `selection-bar` part becomes the 3×16 r1.5 `fluent/accent/default` pill at x 0, centred (F.select-row), not `marker/default`; the select cell is a checked `Fluent/Checkbox`. **zebra** (derived; a ListView has none): `fluent/subtle/tertiary`, not `table/zebra`, which stays Radix. **focus:** `Fluent/.Focus ring` on the row. **disabled:** text `fluent/text/disabled`. **stacked** (derived): the cells stack inside one r4 row; data labels F.caption `fluent/text/secondary` | `table/*`, `fluent/subtle/*`, `fluent/accent/default` |
| `Fluent/Table` | `Table` `413:1367` | The ListView of `155:746`, on an F.card r8 (L393). **head:** 36, no fill (`table/head` transparent), and no rule under it. Hide the head rule: `table/head-rule-width` is still 1 under Fluent, but the crafted header has none. The head holds a select-all `Fluent/Checkbox` and the `Fluent/Table header cell`s. **rows:** `Fluent/Table row`s. `caption` and `summary` F.caption `fluent/text/secondary` ("Showing 1–6 of 3,182 · 1 selected"). **empty** and **loading** (stand-ins): F.body `fluent/text/secondary` and `Fluent/Spinner` md | `table/head` |
| `Fluent/Data table` | `Data table` `416:4605` | The Orders ListView card (`155:746`), in `Fluent/Card` default chrome (r8). **toolbar:** `Fluent/Search` sm; `Fluent/Select` for status and date ("Last 30 days"); `Fluent/Toggle group` segmented (SelectorBar) for Table / Board; Columns = `Fluent/Dropdown menu`; Export = `Fluent/Button / md` ghost with `arrow_export` (an AppBarButton). Then a full-width 1px `fluent/stroke/divider` above the header (the rule at y 527 in `155:746`). **selection:** `Fluent/Action bar` inline. Then `Fluent/Table` and `Fluent/Pagination` (the 48 pager row). **columns:** `Fluent/Menu content` with checkbox `Fluent/Menu item`s. **loading** and **empty:** as Table. **mobile** (derived): stacked rows | `fluent/stroke/divider` |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from `fluent/*` Scheme roles, which follow the scheme and not the
  Theme mode, plus the core `surface/overlay` for scrims. The core roles listed at the end of §2
  are never bound.
- **Text:** `type/*` and `font/*`. After the shared step, every Fluent family is Open Sans,
  tracking is −0.5 at Title and above and −0.2 at Subtitle, and display is 40/52 (Title Large).
- **Radius:** `radius/control`, `radius/input`, `radius/badge` and `radius/checkbox` are 4;
  `radius/card` is 8; `radius/avatar` is 999; `nav/radius` is 4.
- **Structure:** `tabs/*` (no track, no box), `nav/pad` 4, `topbar/*` (no fill, no rule).
- **Sizes:**
  - `size/checkbox` 20;
  - `size/switch/*` 40/20/12, with the sm aliases equal;
  - `size/icon/*` 12/16/20;
  - `size/avatar/*` 24/32/40;
  - `size/kbd` 20;
  - `focus/ring-width` 2.
- **Literals, not tokens:**
  - heights 32, 24, 40 and 20; nav 36; rows 40 and 48; SelectorBar 40;
  - the pills, the toggle radius 10, the edge bars, the 2px focused text edge, and the −3 focus
    placement.
  - Density stays unbound (L515).
- **Effect styles `Fluent/window-*` and `Fluent/mica`:** window only, never on a style set.

## 6. Verification strips

For each category, build a frame `Fluent style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set A, Theme
Fluent). Every row sits on an F.ground frame.

| Row | Content |
| --- | --- |
| Base | The base instances under Theme Fluent: the "before" |
| Style | The same instances swapped to the `Fluent/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Fluent/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary and secondary, each in hover, pressed, focus and disabled;
  - Icon button md ghost and secondary;
  - Toggle off and selected (default and outline);
  - Toggle group segmented;
  - Button group with a separator;
  - Action bar floating;
  - Theme toggle.
- **Forms:**
  - Input rest, hover, focus, invalid and disabled;
  - Select rest, hover, open and focus;
  - Textarea with counter;
  - Checkbox unchecked, checked and indeterminate;
  - Radio off and on;
  - Switch off and on;
  - Slider;
  - Input OTP with a focused slot;
  - Search md;
  - Calendar;
  - Field horizontal with an error row, on an F.card;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default and line;
  - Tab / vertical selected;
  - Nav item rest, hover and selected;
  - Nav group with header;
  - Breadcrumb;
  - Pagination numbered;
  - Top bar app desktop;
  - Sidebar inset;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content;
  - Dropdown menu open;
  - Select content with a checked option;
  - Dialog md with scrim;
  - Alert dialog destructive;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Hover card;
  - Command palette results.
- **Data display 1** (in a `Data display 1` sub-frame):
  - Badge subtle (tint) in all five tones, plus plain;
  - Avatar initials and agent, plus presence;
  - Avatar group;
  - Card default and rule, with footer;
  - Stat card default and hero, with deltas up and down;
  - Table rows, with one selected and one zebra;
  - Data table selection;
  - Item group (the SettingsCard stack);
  - Kbd group.

**Expected, Data display 1 (style row vs base row):**

- Badges are 20px r4 tint chips: pastel fill, coloured SemiBold Caption text, a 1px tone border and
  no dot. Plain counts are grey Caption.
- Avatars are circles in the colourful palette; the agent is a grey disc with the colour bot icon.
- Cards and stat cards are translucent white (dark: white 5%) with a 1px stroke on all sides, r8,
  flat. The stat card has a 32px colour icon, a 28px SemiBold value and a green or red delta.
- Table rows are 48px r4 with no rules. The header is 36px grey Caption with no fill and no rule.
  Selection is a grey fill plus the 3×16 accent pill and a blue checkbox.
- Items are SettingsCards stacked 4 apart. Kbd is plain grey text ("Ctrl+K").
- Dark: badges take their dark tints, and no card, row or badge turns white or accent-filled.

**Expected (style row vs base row):**

- Controls are 32 tall, radius 4, with Regular labels.
- Standard buttons show the darker bottom edge; pressed loses it and greys the label.
- The pressed accent label stays opaque on `#0054a3` (light).
- Text fields carry the strong bottom edge, and focus is a 2px accent bar with no ring.
- The ComboBox keeps the strong bottom edge at rest, on hover and when open.
- Selection is grey fill plus a pill; tabs have no track or box.
- Flyouts are r8 with a grey edge and a soft shadow; cards are flat.
- Blue appears only in the seven places.
- **Dark:**
  - the accent `#60cdff` appears only on controls 32px tall or less and on pills, with black
    labels;
  - the focus outer is `#8d8d8d`;
  - flyouts are `#2b2b2b` over the `#202020` base.

  A white outline, a pale slab, a blue-tinted surface or row, or an accent fill larger than a
  control is a defect (L301-312, L323).

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays without the retired `.Kbd`, 18 Data display 1),
  plus the `Fluent/Icon/*` glyphs and their Filled twins. Each has the base variant count, property names and part names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/fluent.json` lists every set id.
