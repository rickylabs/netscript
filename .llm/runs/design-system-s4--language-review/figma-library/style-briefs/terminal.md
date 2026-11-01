# Terminal style brief

**Covers:** Actions, Forms (parts 1 and 2), Navigation, Overlays, Data display 1.

- **Builder group:** G5, Filigrane + Terminal. Each theme has its own brief; this file is all the
  Terminal builder needs.
- **Figma file:** `pGRLnkPPRZJZy74evNcQBr`.
- **Page:** `Theme · Terminal` (`39:2`).
- **Modes for every Terminal style set and strip:** Theme set **B** (`239:8`) and Theme B
  **Terminal** (`239:3`). Density **Compact**, set explicitly (DESIGN L265-266, L391); Terminal binds
  no Density variable, because the 24px line box governs. Scheme Dark (`3:1`) to build, because dark
  is the reference scheme (L210); check Light (`3:0`).
- **Prerequisite:** `_shared-variables.md` has been applied (`state.json` → `completedSteps`
  contains `T0-shared-variables`). Check one value before starting: Theme B Terminal `font/sans` =
  Geist Mono.

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
   - `Terminal/Button / md`;
   - private helpers keep their dot: `Terminal/.Focus ring`.
   
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
7. **Composites.** Composites nest this theme's own style sets (`Terminal/Field` nests `Terminal/Label`
   and `Terminal/Input`), never the base sets.
8. **Ledger.** After each set, append `{name, id, baseId, variants}` to
   `figma-library/style-ledger/terminal.json`. This is your only file; the coordinator merges it.
9. **Verification.** Each category ends with its strip (section 6 of this brief): screenshot it at
   maxDimension 1600 into `figma-library/review/styles/terminal/<category>.png`. A category is done
   when its swap test passes.

## 1. Thesis and signature anatomy

**Thesis.** The Orders console as a Charm-style terminal UI. Every glyph sits on a 1ch × 24px
character grid (1ch = 8.4px). One Geist Mono 14/24 scale carries hierarchy by dim, normal and
medium. Panes are rounded Lip Gloss boxes with titles set into the border, keys are bracketed
words, and selection is an inverse lime bar (L188-197).

**A Terminal strip must read at thumbnail size as:**

- monospace text at one size, with no pictogram icons;
- square bracketed keys, `[ save ctrl+s ]`;
- fields as `label:` over `> value`, with no box;
- text controls: `[x]`, `( )`, `[on ]`;
- 8px-rounded 1px panes with titles cut into the top border, and the active pane in 2px lime;
- the inverse lime bar with `▶`, the only light slab in dark;
- a black ground in dark, and no shadows, glows or gradients.

**Sources (crafted, read-only):**

| What | Node | Use it for |
| --- | --- | --- |
| Orders, Dark / Light | `41:2` / `41:297` | Status line, tab line, panes and their titles, keys (Save, Cancel), prompt fields (rest, error), checks, selection bar, status words, key hints, help bar, progress bar. Dark is the reference. **Measure here first.** These frames render through Theme `Signal` (`2:7`), not Theme B (theme-character §0, map). Never change their modes. There is no state sheet: hover, pressed, disabled and control focus are derived (§3) |
| Dark Save key | `41:231` | The documented primitive exception (§2) |
| Kits | Key `39:15` (Primary `39:3`), Prompt field `39:37`, Status `39:48`, Check `39:57`, Tab `39:64` (Selected `39:61`) | Geometry to copy. Rename to `Terminal/Specimen kit/*` before creating the same names. The Key main is 28 tall and binds `type/body/line` 20, while its frame instances are 32–34 with line 24 (map drift): copy the instances, not the main |
| Renders | `.llm/runs/design-system-s4--language-review/renders-r7/terminal--dark.png`, `terminal--light.png` | Offline reference. The pixel measurements in this brief come from these |

## 2. Tokens the style relies on

**Fonts** (load all): Geist Mono Regular, Medium and SemiBold. Every `font/*` resolves to Geist Mono
after the shared step. Never set a proportional face (L237-244, L332).

| Use | Bind | Terminal value (Light / Dark) |
| --- | --- | --- |
| Canvas, pane interiors, title patches | `surface/bg` | `#fcfcfc` / `#000000` |
| Status line and help bar | `topbar/bg` in Top bar; `surface/surface` elsewhere | `#f9f9f9` / `#191919` |
| Keycaps | `surface/muted` | `#f0f0f0` / `#222222` |
| Selected tab, hover, nav active | `tabs/sel-bg`, `surface/hover`, `nav/active` | `#f0f0f0` / `#222222` |
| Text | `text/fg` | `#202020` / `#eeeeee` |
| Dim text: labels, secondary columns, unchecked marks, legends | `text/muted` | `#646464` / `#b4b4b4` |
| Default key brackets (`fg-subtle`, L297) | `text/subtle` | `#646464` / `#b4b4b4` |
| Lime text: pane titles, brand, prompt `>`, tab index, `[x]`, progress fill | `primary/text` | `#5c7c2f` / `#bde56c` |
| Selection bar and light Primary key / ink on them | `primary/default` / `primary/fg` | `#bdee63` / `#37401c`; dark `#bdee63` / `#111111` |
| Light Primary key hover | `primary/hover` | `#b0e64c` (light only) |
| Active pane, selected-tab underline, control focus | `border/ring`, `tabs/sel-border` | `#5c7c2f` / `#bdee63` |
| Pane edge, Default key edge, title glyphs `┤ ├` | `border/strong`; panes bind the `card/border` twin | `#bbbbbb` / `#606060` |
| Rules: table header, tab line, help bar | `border/default`; Top bar binds `topbar/rule` | `#d9d9d9` / `#3a3a3a` |
| Range middle, inline action bar | `surface/selected` | `#eef6d6` / `#1f2917` |
| Status words | `success/text`, `warning/text`, `info/text`, `destructive/text`, `text/muted` | `#2a7e3b`, `#4f3422`, `#113264`, `#641723`, `#646464`; dark `#71d083`, `#ffca16`, `#70b8ff`, `#ff9592`, `#b4b4b4` |
| **Dark Save key (documented exception)** | Primitives `color/gray/d/3` (fill), `color/gray/d/10` (1px stroke), `color/lime/d/11` (text), bound exactly as `41:231` binds them (T.save-dark) | `#222222`, `#7b7b7b`, `#bde56c` (dark only) |
| Edge widths | literal 1 for panes, keys and rules (`border/width` is 1); 2 for the active pane, the selected-tab underline and the focus ring (L290-291) | 1 / 2 |
| Radius | 8 on panes only (`radius/card`, L286). `radius/control`, `radius/input`, `radius/badge`, `radius/checkbox` and `radius/avatar` are all 0 after the shared step | — |
| **Never bind** | `tooltip/*`, `surface/inverse` (`#eeeeee` in dark: a pale slab, L330-331), `surface/card` and `surface/raised` (panes are `bg`, L275), and any primitive other than the three exception paints | — |

**The dark Save key exception** (map, node-level exceptions; DESIGN L396-400). Copy this wording into
the description of every `Terminal/Button` set:

| Node | Layer | Bound primitive | Raw value | Dark-scheme role it equals | Replacement |
| --- | --- | --- | --- | --- | --- |
| `41:231` dark Save key | fill | `color/gray/d/3` | `#222222` | `surface/muted` | S1 scheme-aware key role (#2414) |
| `41:231` dark Save key | stroke | `color/gray/d/10` | `#7b7b7b` | `border/input` | S1 scheme-aware key role (#2414) |
| `41:231` dark Save key | three text layers | `color/lime/d/11` | `#bde56c` | `primary/text` | S1 scheme-aware key role (#2414) |

> Reason: the dark Save key needs a dark-only treatment while light Save stays a lime fill, and no
> scheme-aware role exists yet. The public YAML uses the equivalent roles. S1 adds a scheme-aware
> key role (name owned by code) and the node is rebound to it.

Terminal has no language roles (L394). Apart from the exception above, it binds core roles and the
structure twins only.

**Text roles:**

| Role | Recipe |
| --- | --- |
| T.grid | `font/sans` + `type/body/*` (14/24 Regular, tracking 0). Every cell, value, log line and key label (L54-60, L229) |
| T.grid-strong | `font/sans` + `type/strong/*` (14/24 Medium). Values, totals, current items (L61-67, L230) |
| T.chrome | `font/sans` + `type/body/size` (14) + `type/heading/line` (20) + `type/body/style` (Regular) + `type/body/tracking` (0). Status line, tab labels (L68, L231) |
| T.pane-title | `font/heading` + `type/heading/*` (14/20 Medium). Pane titles, brand (L69, L232) |
| T.keycap | `font/label` + `type/label/*` (12/16 Medium, tracking 0). Tab indices, keycaps (L71, L234) |
| T.legend | `font/sans` + `type/small/*` (12/20 Regular). Legends, descriptions, menu labels (L72, L235) |
| T.help | `font/mono` + literal size 13, line 20, style SemiBold, tracking 0. The help bar (L70, L233). No Theme type variable holds 13/20 |

Text case is original. Content is lowercase (render: `email:`, `2:orders`, `[ save ctrl+s ]`), and
level words stay uppercase as written (`WARN`, `OK`). Hierarchy is dim, normal, medium; never size
(L241-242).

## 3. Terminal recipes (referenced by the component rows)

- **T.cell: character grid** (L248-249, L315-316, L334-335).
  - 1ch = 8.4px; the line box is 24.
  - Size fixed columns in whole ch, give the remainder to one flexible track, and never shrink the
    type.
  - Text layers hug, tracking 0.
  - Every list row reserves a 2ch marker cell, so the selection marker never shifts a column.
- **T.key: bracketed key** (L297, L111-136; render `41:2` y948-981).
  - Root H-AL, padding 4/8, gap 0, radius 0, 1px INSIDE edge. Label T.grid.
  - Theme-only parts `bracket-start` (`[ `) and `bracket-end` (` ]`), shown by the theme-only
    boolean `brackets` (default true).
  - Theme-only part `shortcut` (` ctrl+s`), in the label colour, shown by the theme-only boolean
    `shortcut` (default true). Edit its text on the layer; the base `label` property keeps the
    word.
  - **Height 34 for every kind:** a 24 line + 2 × 4 + 2 × 1. Render: Cancel and dark Save are 34;
    light Save is 32 because it has no edge. Give light Primary a 1px edge in its fill colour, so
    keys align.
  - **Primary, light:** fill and edge `primary/default`; label, brackets and shortcut `primary/fg`.
  - **Primary, dark:** T.save-dark.
  - **Default:** no fill, edge `border/strong`, label `text/fg`, brackets `text/subtle` (render
    `[ cancel esc ]`).
  - **Hint:** brackets off and the theme-only boolean `hint` on. `hint` shows the theme-only part
    `keycap`, a `Terminal/Kbd` md before the label; the label is `text/muted` (render `n next`,
    `p prev`).
- **T.save-dark: dark Save key** (DESIGN L221-222, L396-400; map). No role changes by scheme here,
  so the exception is an overlay:
  - Theme-only part `dark-face`: an absolute frame that fills the root. Fill `color/gray/d/3`,
    1px INSIDE stroke `color/gray/d/10`.
  - It holds its own bracket, label and shortcut texts in `color/lime/d/11`. Its label text uses
    the same `label` text property, so overrides follow.
  - The theme-only boolean `darkKey` (default false) shows `dark-face`. Set it true on Primary keys
    in dark layouts and in the Dark strip rows.
  - Hide it on `state=disabled` (T.dim).
- **T.keycap** (L137-142; render status line `/` and `?`, 18×16).
  - Fill `surface/muted`, radius 0, glyph T.keycap `text/fg`.
  - Padding-x 5; width hugs longer keys (`esc`, `ctrl+s`). Minimum 18×16.
- **T.prompt: prompt field** (L298, L175; render `41:2` x37-760 y680-820).
  - Line 1 (Label): `label:` in T.grid `text/muted`.
  - Line 2 (Input): the theme-only part `prompt` (`> `, `primary/text`), then the value in T.grid
    `text/fg`; the placeholder is `text/muted`.
  - The two 24 lines with 2 between them make 50.
  - No container: no fill, no stroke.
  - **Focus:**
    - the theme-only part `cursor`, an 8×16 `primary/default` block after the value, vertically
      centred in the line and shown only on the focused field;
    - plus `Terminal/.Focus ring`, because the cursor styles the caret and never replaces the focus
      indicator (L298).
  - **Invalid:**
    - label and prompt `destructive/text`;
    - the theme-only part `status`, `✗ <reason>` in T.grid `destructive/text`, inline after the
      value;
    - the repair line on the next line, indented 2ch past the prompt (Field `error`).
- **T.pane: Lip Gloss pane** (L194-195, L253, L273-282, L286; render panes at x20 and x820).
  - Fill `surface/bg`, 1px INSIDE stroke `border/strong` (the `card/border` twin), radius 8 (`radius/card`).
  - Padding 22/16/16/16: the extra top clears the title. Text panes have a line gap of 4.
  - **Title on the border:** the theme-only part `title-patch`, an absolute H-AL frame on the top
    edge, 12px in from the pane's left edge (render: patch x32-185 on a pane at x20). Fill
    `surface/bg`, padding 0/6, 20 tall, centred on the 1px edge.
    - It holds `┤ ` in `border/strong` T.grid, the title in T.pane-title `primary/text`, and ` ├` in
      `border/strong`.
    - DESIGN draws both glyphs (L194, L281-282). The crafted frames draw only the trailing `├`
      (render: no ink between the corner run and the title). Build both.
  - **Active pane** (contains DOM focus): a 2px `border/ring` stroke, and ` [focused]` appended to
    the title (L195, L277-278, L321-323). This is pane styling, not a control's focus indicator.
  - No shadow, blur or tint (L270).
- **T.double: composited layer** (derived from L308, the Lip Gloss double border).
  - T.pane plus a theme-only part `inner-border`: an absolute frame at inset 3, radius 5, with a 1px
    INSIDE stroke.
  - Both lines are `border/ring`, because a dialog always holds focus (L277-278, L349-352). The
    title sits on the outer border, as in T.pane, with no `[focused]` suffix.
- **T.select: selection bar** (L279, L301; render `41:2` y451-474, x38-1241).
  - A full-width 24px bar: fill `primary/default`, text `primary/fg`, and `▶` (`primary/fg`) in the
    reserved marker cell.
  - The bar spans the row inside the pane padding. In dark it is the only light slab (L221,
    L330-331). It stays when its pane is inactive (L352).
- **T.tab: tab line item** (L300, L143-154; map `39:61`; render `2:orders` 83×26 at y40-65).
  - 26 tall, padding 0/8, radius 0.
  - The theme-only part `index` (`1:`) in T.keycap `primary/text`, shown by the theme-only boolean
    `index` (default true). The label is T.chrome `text/muted`.
  - **Selected:** fill `tabs/sel-bg`, label `text/fg`, and a 2px INSIDE bottom stroke
    `tabs/sel-border`.
  - Items sit 4 apart (`tabs/gap`).
- **T.status: status word** (L218-220, L302, L333).
  - Six characters, bracketed, with no container.
  - `[ OK ]` `success/text`, `[WAIT]` `warning/text`, `[SHIP]` `info/text`, `[FAIL]`
    `destructive/text`, `[RFND]` `text/muted`.
  - Always a word, never colour alone.
- **T.help: help bar** (L167-172, L252, L307; render y1019-1051).
  - 33 tall, including a 1px `border/default` top rule. Fill `surface/surface`, padding 6/12.
  - `key desc • key desc` in T.help `text/fg`: keys, descriptions and bullets alike (render, and the
    YAML `textColor`).
  - Labels on keys match the help bar (L328).
- **T.glyph: characters, not icons** (L339-340; component-spec Z1).
  - Every icon is one character in T.grid, coloured by the parent. Use only the documented glyphs
    `◆ ● ▶ ▲ ▼ ✗ ⏎ •`, box drawing and ASCII.
  - Check every glyph against Geist Mono and its fallback stack (L237-240).
  - The map is in the `Terminal/Icon` row.
- **T.focus: control focus** (derived).
  - DESIGN requires each focused control to show its own visible focus (L321-326, L349-351, L379)
    but draws none. `Terminal/.Focus ring` borrows the active-pane language.
  - A 2px OUTSIDE stroke `border/ring` at offset 2 (`focus/ring-offset`), radius 0. It is `#5c7c2f`
    in light and `#bdee63` in dark.
- **T.dim: disabled** (derived from hierarchy by dim, L241).
  - No layer opacity. Every text, bracket and glyph is `text/muted`; edges are `border/default`.
  - No fill, no lime, and the dark Save overlay is hidden.
- **States** (derived; DESIGN L310-311 says hover, pressed and disabled are not drawn).
  - **Hover, keys and ghost actions:** fill `surface/hover` (the selected-tab fill, L143-154).
  - **Hover, light Primary:** `primary/hover` (L39-40).
  - **Hover, dark Primary:** unchanged. L360 proposes `#2a2a2a` (gray/d/4), but no role holds it and
    it would be a fourth primitive, so it stays pending (#2416).
  - **Pressed:** as hover. Nothing animates in the files (L347-348).
  - **Highlighted rows** (menu, command, list): T.select.
  - **Hover, text controls** (check, radio, switch, Search): the marks or label go `text/muted` →
    `text/fg`.
  - Terminal draws no translucent state layers, so every `state-layer` part stays hidden.

## 4. Components

Columns:

- **Style set:** what you create.
- **Base set:** its id; read it with `get_metadata` for the parts.
- **Terminal anatomy vs base:** what changes.
- **Binds:** what is bound beyond the shared recipes.

`(derived)` marks a state or component that Terminal's spec does not draw; the derivation uses only
the recipes above and names its source. Where a base part is a vector or an ellipse and Terminal
draws a character, the part becomes a text layer with the same name.

### 4.1 Actions (page `Components · Actions`, `229:340`)

Build the foundations first: `Terminal/Icon`, `Terminal/Spinner`, `Terminal/.Focus ring` and
`Terminal/.State layer`.

| Style set | Base set | Terminal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Terminal/Icon` (and `Terminal/Icon/<glyph>`) | `Icon` `252:11798`; glyphs `251:11788` | **Glyphs** (T.glyph): each `Terminal/Icon/<lucide name>` is one text layer named `glyph`, in T.grid, centred in the base box. Map: check `x` (as in `[x]`, L299); minus `-`; plus `+`; x `×` (derived; Latin-1); chevron-right and arrow-right `▶`; chevron-down and arrow-down `▼`; chevron-up and arrow-up `▲`; chevron-left and arrow-left `◀` (derived; same Unicode block as `▶`, check coverage); more-horizontal `…` (L359); search `/` (L306); corner-down-left `⏎`; hash `#`; alert-circle and alert-triangle `✗`; circle and dot `●`. Every other glyph has no character: make no component for it, and the parent hides that icon part. **Sizes:** sm, md and lg are the same 1ch × 24 cell, because there is one type size | `text/fg` via the parent |
| `Terminal/Spinner` | `Spinner` `252:11837` | (derived) Spinners are frame-stepped (L347-348). Draw the static frame `…` (the reduced-motion frame, L359) in T.grid `text/muted`. The base ring and arc vectors stay hidden | `text/muted` |
| `Terminal/.Focus ring` | `.Focus ring` `252:11805` | T.focus | `border/ring` |
| `Terminal/.State layer` | `.State layer` `252:11806` | Same component, hidden by default. Terminal states recolour (§3) | — |
| `Terminal/Button / md` | `Button / md` `253:372` | T.key, 34 tall. **primary:** the Primary key (light lime; dark T.save-dark through `darkKey`). **secondary** and **outline:** the Default key; Terminal has one outline kind (component-spec A1). **ghost** (derived): brackets and label with no edge, label `text/muted`, hover `surface/hover`. **destructive** (derived from the error prompt, L298): the Default key with label, brackets and edge in `destructive/text`. **link** (derived): `primary/text` label with brackets off and no edge; the `underline` part is a 1px `primary/text` rule under the label on hover and pressed. `icon-start` and `icon-end` render T.glyph characters. `loading` shows `Terminal/Spinner` in place of the shortcut. States §3; focus `Terminal/.Focus ring`; disabled T.dim. Theme-only booleans: `brackets`, `shortcut`, `hint`, `darkKey` | `primary/*`, `border/strong`, `text/subtle`, `destructive/text`, the three exception primitives |
| `Terminal/Button / lg` | `Button / lg` `254:721` | (derived) As md at 40: padding 7/12 | as md |
| `Terminal/Button / sm` | `Button / sm` `254:371` | (derived) As md at 26: T.chrome, padding 2/8 (the 26px tab height, L147) | as md |
| `Terminal/Button / xs` | `Button / xs` `254:1071` | (derived) As md at 20: T.keycap, padding 1/4 (the keycap scale, L137-142) | as md |
| `Terminal/Icon button / md` | `Icon button / md` `255:262` | A key whose label is one T.glyph character in brackets, `[▶]`, with W = H 34 (component-spec A2: "a keycap `[?]` with a text glyph"). When the glyph has no character, the label is a short word (`[nav]`) and the width hugs. Variants as Button; `shortcut` off | as Button |
| `Terminal/Icon button / lg` | `Icon button / lg` `255:740` | (derived) As md, 40 square | as Button |
| `Terminal/Icon button / sm` | `Icon button / sm` `255:501` | (derived) As md, 26 square, T.chrome | as Button |
| `Terminal/Icon button / xs` | `Icon button / xs` `255:979` | (derived) 20 square, with the bare glyph in T.keycap and no brackets | as Button |
| `Terminal/Button group` | `Button group` `257:839` | (derived) Keys never join: gap 10 between keys (render: Save to Cancel 10px). `separator` stays hidden, because a TUI separates with space. `text` part: T.grid `text/muted`, no fill | — |
| `Terminal/Toggle / md` | `Toggle / md` `256:281` | (derived) 34 tall. **Off:** the ghost key `[ label ]`, label `text/muted`. **Selected:** T.tab selected (`surface/hover` fill, `text/fg`, 2px `border/ring` bottom stroke, L300). **outline** adds the 1px `border/strong` key edge. Hover `surface/hover`. Focus `Terminal/.Focus ring`. Disabled T.dim | `surface/hover`, `border/ring`, `border/strong` |
| `Terminal/Toggle / sm` | `Toggle / sm` `256:437` | (derived) As md at 26, T.chrome | as md |
| `Terminal/Toggle / lg` | `Toggle / lg` `256:593` | (derived) As md at 40 | as md |
| `Terminal/Icon toggle / md` | `Icon toggle / md` `276:8291` | (derived) As Toggle md, with `[g]` in a 34 square | as Toggle |
| `Terminal/Icon toggle / sm` | `Icon toggle / sm` `276:8431` | (derived) As md, 26 square | as Toggle |
| `Terminal/Icon toggle / lg` | `Icon toggle / lg` `276:8571` | (derived) As md, 40 square | as Toggle |
| `Terminal/Toggle group` | `Toggle group` `257:528` | **segmented** is the tab line: no track (`tabs/track` is transparent), padding 0 (`tabs/pad`), gap 4 (`tabs/gap`), items drawn as T.tab. **default** and **outline:** Toggles with a 1ch gap (8) | `tabs/*` |
| `Terminal/Action bar` | `Action bar` `258:663` | (derived) **floating:** a T.pane with no title and no shadow, instead of the base inverse slab, which is pale in dark (L330-331). `count` T.grid-strong; keys `Terminal/Button / sm`. **inline:** a 24px line on `surface/selected`, with the marker cell, the count and sm keys | `surface/bg`, `border/strong`, `surface/selected` |
| `Terminal/.Action bar / actions` | `258:544` | Swap the nested Buttons to `Terminal/Button / sm` | — |
| `Terminal/Theme toggle` | `Theme toggle` `258:742` | `Terminal/Icon button / md` ghost reading `[dark]` in light and `[light]` in dark: moon and sun have no character (T.glyph) | — |

### 4.2 Forms (page `Components · Forms`, `229:341`)

| Style set | Base set | Terminal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Terminal/Label` | `Label` `278:45` | **default:** `label` in T.grid `text/muted`, followed by the theme-only part `suffix` (`:`), so a text override keeps the word (L298). **eyebrow:** T.legend `text/muted`, original case. `required-mark` `*` in `destructive/text`; `optional-hint` `(optional)` in T.legend `text/muted`. **Invalid:** text and suffix `destructive/text`. **Disabled:** T.dim | `text/muted`, `destructive/text` |
| `Terminal/Input` | `Input` `279:312` | Line 2 of T.prompt. **md:** one 24 line. **sm** (derived): one 20 line in T.chrome. No fill, no stroke, radius 0; icon parts hidden. **Hover** (derived): identical to rest, because pointer use is secondary (L382). **Focus:** `cursor` plus `Terminal/.Focus ring`. **Invalid:** prompt `destructive/text` and `status` shown. **invalid-focus:** both. **Disabled:** T.dim | `primary/text`, `primary/default`, `destructive/text` |
| `Terminal/Textarea` | `Textarea` `280:597` | (derived) A prompt block: `> ` on the first line, continuation lines indented 2ch, minimum 3 lines (72), padding 0. `counter` T.legend `text/muted`, right-aligned under it. `resize-handle` stays hidden (no TUI equivalent). States as Input | as Input |
| `Terminal/Select` | `Select` `281:1023` | (derived) The T.prompt value line with a trailing `▼` in `text/muted`. The render's sort control reads `sort: date ▾` with a smaller, undocumented triangle; use the documented `▼` (L339). **Open:** `▲`, with content `Terminal/Select content` 4px below. Other states as Input | as Input |
| `Terminal/Select content` | `Select content` `281:826` | `Terminal/Menu content` holding `Terminal/Menu item` `type=option` | — |
| `Terminal/Checkbox` | `Checkbox` `283:1470` | The text control `[x]` / `[ ]` (L299; render `41:2` y905-928). `control` becomes an H-AL of three texts: the theme-only `bracket-start` (`[`), `indicator` (`x`, a space, or `-` for indeterminate, derived) and the theme-only `bracket-end` (`]`). **Checked** and **indeterminate:** all three `primary/text`. **Unchecked:** `text/muted`. Label T.grid `text/fg`, gap 1ch; description T.legend `text/muted`. `size/checkbox` no longer sizes the control; it is 3ch × 24. Hover: marks `text/fg`. Focus `Terminal/.Focus ring` on `control`. Invalid: brackets `destructive/text`. Disabled T.dim | `primary/text`, `text/muted` |
| `Terminal/Radio` | `Radio` `284:1828` | `(•)` / `( )` (L299). As Checkbox with parentheses; the base `indicator` ellipse becomes the text `•` with the same layer name | as Checkbox |
| `Terminal/Radio group` | `Radio group` `284:1885` | Nests `Terminal/Radio`. **vertical:** one item per 24 line, gap 0. **horizontal:** gap 3ch (render: `[x] notify customer by email   ( ) priority`) | — |
| `Terminal/Switch` | `Switch` `285:2329` | (derived from the `[x]` check, L299; Terminal has no switch) A text toggle: the theme-only part `toggle-text` inside `control` reads `[on ]` in `primary/text` or `[off]` in `text/muted`, in T.grid (sm: T.chrome). The base `track` and `thumb` stay in the tree, hidden. Label T.grid. Hover: text `text/fg`. Focus `Terminal/.Focus ring` on `control`. Invalid `destructive/text`. Disabled T.dim | `primary/text`, `text/muted` |
| `Terminal/Field` | `Field` `287:2656` | Nests `Terminal/Label` (line 1) and `Terminal/Input` (line 2), gap 2: 50 tall (L175). `description` T.legend `text/muted`, indented 2ch. **Error row:** `error-icon` stays hidden, because the `✗` sits inline in the Input's `status`; `error` is the repair line in `destructive/text`, indented 2ch past the prompt (L298; render `remove this code or choose another` at x441). **horizontal** (derived): `label: > value` on one line, with the label column in whole ch | `destructive/text` |
| `Terminal/Field set` | `Field set` `287:2743` | A T.pane. `legend` is the title set into the top border (render `┤ order SO-10480 · edit ├`), in T.pane-title `primary/text`. `description` T.legend `text/muted`; `separator` 1px `border/default`. Fields sit 16 apart (render: 66px from line 1 to line 1) | `border/strong`, `primary/text` |
| `Terminal/Input group` | `Input group` `297:3861` | The T.prompt line. The addon is T.grid `text/muted` text (`$`, `https://`) or `Terminal/Icon button / xs`; the control is the strokeless `Terminal/Input` | — |
| `Terminal/OTP slot` | `OTP slot` `301:4385` | (derived) One 3ch cell `[d]`: brackets `text/muted`, character T.grid-strong `text/fg`, empty `[ ]`. **caret:** the 8×16 `primary/default` block in place of the character. Focus `Terminal/.Focus ring`. Invalid: brackets `destructive/text`. Disabled T.dim | `primary/default` |
| `Terminal/Input OTP` | `Input OTP` `301:4490` | Group gap 1ch instead of −1; the separator is `-` in T.grid `text/muted` | — |
| `Terminal/Slider` | `Slider` `303:5022` | (derived from the block progress bar, L304, L341-342; render alerts pane, y213-226) **track:** a 14-tall bar whose remainder is the dither. Copy the dither from the alerts pane's progress bar in `41:2` and `41:297`. **range:** solid `primary/text` (render: the fill is `primary-text`). **thumb:** an 8×16 `text/fg` block. The track and range rounded rectangles become rectangles with the same layer names; the thumb radius is 0. `value-label` T.grid `primary/text` (render `68%`). Focus `Terminal/.Focus ring` on the thumb. Disabled T.dim (range `text/muted`) | `primary/text`, `text/fg` |
| `Terminal/Combobox` | `Combobox` `305:5623` | `Terminal/Input` plus `Terminal/Menu content`; chips are `Terminal/Badge` subtle with `remove`, `[tag ×]` | — |
| `Terminal/Calendar day` | `Calendar day` `307:6154` | (derived) A cal-style cell, 3ch × 24, with the day as two digits in T.grid `text/fg`, right-aligned. **Rest:** no fill. **Hover:** `surface/hover`. **today:** a 2px `border/ring` bottom stroke (the selected-tab underline). **single, range-start, range-end:** T.select (`primary/default`, `primary/fg`). **range-middle:** `surface/selected`. **outside:** `text/muted`. **Disabled:** T.dim. Focus `Terminal/.Focus ring` | `primary/*`, `surface/selected`, `border/ring` |
| `Terminal/Calendar` | `Calendar` `309:8620` | A T.pane with no inset title. Caption T.pane-title `primary/text` in the header row; nav keys `Terminal/Icon button / sm` ghost `[◀]` and `[▶]`; weekdays `mo tu we th fr sa su` in T.grid `text/muted`; month select `Terminal/Select` sm | — |
| `Terminal/Date picker` | `Date picker` `313:14889` | The `Terminal/Select` trigger reading `> 2026-10-28 ▼`; the calendar glyph stays hidden (T.glyph). Open is `Terminal/Popover` holding `Terminal/Calendar` | — |
| `Terminal/Search` | `Search` `316:16426` | A `/ search` keycap hint, with no field (component-spec F15; render status line `/ search`). **Rest:** `kbd` shows `/` as `Terminal/Kbd` sm, placed before `label`; `label` "search" in T.chrome `text/muted`; `icon` hidden; the width hugs. **Hover:** label `text/fg`. **focus** and **open** (derived from T.prompt): a prompt line `/ query` with the block cursor and `Terminal/.Focus ring`. **sm** as md | `surface/muted`, `primary/default` |
| `Terminal/Dropzone` | `Dropzone` `319:16832` | (derived) A T.pane titled `┤ upload ├`, solid, with no dashes, because panes are solid. `icon` hidden (no character for upload). `label` T.grid `drop files or press ⏎ to browse`; `hint` T.legend `text/muted`. **active:** 2px `border/ring` (the active pane). **uploading:** `status` holds the block progress bar (as Slider) and its percentage. **invalid:** `✗ <reason>` in `destructive/text`. Focus `Terminal/.Focus ring`; disabled T.dim | `border/strong`, `border/ring`, `primary/text` |

### 4.3 Navigation (page `Components · Navigation`, `229:342`)

| Style set | Base set | Terminal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Terminal/Location marker` | `Location marker` `337:22` | (derived) sm `•` and md `▶`, in T.grid `primary/text`. Parents never show it, because `deco/marker` is false; the tab line marks selection with its fill and underline | `primary/text` |
| `Terminal/Breadcrumb item` | `Breadcrumb item` `338:92` | A shell path segment (component-spec N1; render `~/commerce/orders`). **link:** T.chrome `text/muted`, `text/fg` on hover. **current** (derived): T.chrome `text/fg`; the status line renders the whole path dim. **separator:** `/` in T.chrome `text/muted`, with no spaces; the base chevron becomes text. **Ellipsis:** `…`. Focus `Terminal/.Focus ring` | `text/muted` |
| `Terminal/Breadcrumb` | `Breadcrumb` `338:161` | Nests `Terminal/Breadcrumb item`, gap 0. The theme-only part `home` (`~`) sits before the first item | — |
| `Terminal/Page key` | `Page key` `339:270` | (derived from T.tab) **page:** a 3ch cell, T.grid `text/muted`. **current:** T.tab selected. **Hover:** `surface/hover`. **previous** and **next:** `Terminal/Button / sm` as Hint keys, `p prev` and `n next` (render `41:2` y569-592, L297). **Ellipsis:** `…`. Focus `Terminal/.Focus ring`; disabled T.dim | `tabs/sel-bg`, `tabs/sel-border` |
| `Terminal/Pager tile` | `Pager tile` `339:319` | (derived) A T.pane with no title. `direction` T.legend `text/muted` (`◀ prev`, `next ▶`); `title` T.grid `text/fg`. Hover `surface/hover`. Focus `Terminal/.Focus ring` | — |
| `Terminal/Pagination` | `Pagination` `339:379` | `meta` is `-- page 1/531 --` in T.grid `text/muted` (render). Nests `Terminal/Page key` and `Terminal/Pager tile` | — |
| `Terminal/Tab / horizontal` | `Tab / horizontal` `342:402` | T.tab (`Terminal/Tab`, kit `39:64`, L300). All three variants (default, line, segmented) draw the same tab, because the track is transparent and `tabs/sel-box` is 0. On `line`, the base `indicator` takes the same 2px `tabs/sel-border`. `count` is `Terminal/Badge` plain (`214`, `text/muted`). `marker` and `iconStart` stay hidden. Hover `surface/hover`. Focus `Terminal/.Focus ring`. Disabled T.dim, with the index `text/muted` | `tabs/*` |
| `Terminal/Tab / vertical` | `Tab / vertical` `342:599` | (derived) As horizontal, with the 2px `tabs/sel-border` on the inline-start edge | as horizontal |
| `Terminal/Tabs list` | `Tabs list` `343:424` | The tab line: no track, padding 0, gap 4 (`tabs/*`). Theme-only part `rule`: a 1px `border/default` bottom rule (L250-251; render y74) | `border/default` |
| `Terminal/Tabs` | `Tabs` `343:489` | Nests `Terminal/Tabs list`; the content slot sits below | — |
| `Terminal/Nav item` | `Nav item` `345:601` | (derived from the tab line, the nav, L300; `nav/active` is the hover fill after the shared step) A 24px list line. The reserved 2ch marker cell holds `▶` in `primary/text` when selected (L315-316). Theme-only `index` (`1:`) in T.keycap `primary/text`; `nav-label` T.grid `text/muted`. **selected:** `nav/active` fill and label `text/fg`. **Hover:** `surface/hover`. `nav-icon` stays hidden (T.glyph). `count` is `Terminal/Badge` plain (`text/muted`), right-aligned, with no pill. `chevron` `▶` / `▼`. Level 2 indents 2ch. **Collapsed:** the index only. Focus `Terminal/.Focus ring`; disabled T.dim | `nav/active`, `primary/text` |
| `Terminal/Nav group` | `Nav group` `346:611` | Group label T.legend `text/muted`, original case. Nests `Terminal/Nav item` | — |
| `Terminal/Sidebar` | `Sidebar` `347:994` | (derived; Terminal navigates by the tab line) A T.pane titled `┤ nav ├` on `surface/bg`. **floating:** the same pane inset by 8. **inset:** the content area is a pane. No shadow | `border/strong` |
| `Terminal/Top bar` | `Top bar` `351:1349` | The status line plus the tab line (L306, L250-252; component-spec N5), 75 tall in total (render rule at y74). The root becomes V-AL with two rows; keep `topbar-start` and `topbar-end` as direct children of `root`. **`topbar-start`, the status line:** 32 tall, fill `topbar/bg`, padding 6/12, gap 16, T.chrome. It holds `Terminal/.Brand logo` `◆`, the wordmark `northwind` in T.pane-title `primary/text`, and `Terminal/Breadcrumb` as the shell path. On the right, the theme-only part `status` holds `● live` (`success/text`), `hh:mm:ss UTC` and `user@host` (`text/muted`). **`topbar-end`, the tab line:** 43 tall, padding 8/12, gap 4, a 1px `topbar/rule` bottom rule. It holds the theme-only part `tabs` (numbered `Terminal/Nav menu item`s) and, on the right, `Terminal/Search` as `/ search` and an Icon button as the `? help` keycap. Badge, Theme toggle and Avatar stay hidden: there are no avatars (L343). **docs:** the base `Terminal/Navigation menu` shows the numbered tabs, and `tabs` is hidden. **mobile** (derived): the status line, plus a tab line that shows only the active tab and `? help` | `topbar/bg`, `topbar/rule`, `primary/text`, `success/text` |
| `Terminal/.Brand logo` | `.Brand logo` `344:410` | `◆` in T.grid `primary/text`, with no tile (render; L339) | `primary/text` |
| `Terminal/Nav menu item` | `Nav menu item` `349:1036` | The numbered tab, `1:orders 2:customers` (component-spec N6), drawn as T.tab. **open:** the selected-tab fill plus a `▼` after the label. **selected:** T.tab selected | `tabs/*` |
| `Terminal/.Nav menu link` | `.Nav menu link` `348:1108` | A list line inside the viewport pane: title T.grid-strong `text/fg`, description T.grid `text/muted`. **highlighted:** T.select. Focus `Terminal/.Focus ring` | `primary/*` |
| `Terminal/Navigation menu` | `Navigation menu` `349:1132` | The list is the tab line (gap 4); the viewport is a T.pane 4px below; `indicator` stays hidden | — |
| `Terminal/Menubar trigger` | `Menubar trigger` `349:1153` | T.chrome `text/muted`. **hover** and **open:** T.tab selected. Disabled T.dim | `tabs/*` |
| `Terminal/Menubar` | `Menubar` `349:1236` | (derived) The tab line: the base fill, stroke and radius are dropped; gap 4; a 1px `border/default` bottom rule. Menus are `Terminal/Menu content` | `border/default` |
| `Terminal/Step` | `Step` `352:1355` | (derived from the `[x]` check and the status words) **indicator:** a 3ch text. **complete:** `[x]` in `primary/text`. **current:** `[2]` in `text/fg`, title T.grid-strong. **upcoming:** `[3]` and title `text/muted`. **error:** `[✗]` and title `destructive/text`. Title T.grid; description T.legend `text/muted`. **connector:** a 1px `border/default` rule; complete `primary/text` | `primary/text`, `destructive/text` |
| `Terminal/Stepper` | `Stepper` `352:1424` | Nests `Terminal/Step` | — |
| `Terminal/Sidebar toggle` | `Sidebar toggle` `344:462` | `Terminal/Icon button / sm` and `/ lg` ghost reading `[nav]` (closed) and `[×]` (open); panel-left and menu have no character (T.glyph) | — |

### 4.4 Overlays (page `Components · Overlays`, `229:343`)

DESIGN draws no overlay; the dialog anchor is "a composited Lip Gloss layer with a double border"
(L308). Every float below is a pane on `surface/bg` (L275), so the rows are derived from T.pane and
T.double.

| Style set | Base set | Terminal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Terminal/.Kbd` | `.Kbd` `370:31` | Retired: the base `.Kbd` moved to the Overlays Draft area. Do not build this set; build `Terminal/Kbd` in 4.5 instead | — |
| `Terminal/Menu item` | `Menu item` `371:587` | A 24px line (the line box governs, L265-266), with the 2ch marker cell reserved; label T.grid `text/fg`. **highlighted:** T.select. **destructive:** label `destructive/text`; highlighted is T.select with a `primary/fg` label (derived: red text on lime fails contrast). **Indicators:** checkbox `[x]` / `[ ]`, radio `(•)` / `( )`, option `x` in `primary/text`, submenu `▶`. `shortcut` T.grid `text/muted` (`ctrl+s`) or `Terminal/Kbd` sm. `description` T.legend `text/muted`. Icon parts hidden (T.glyph). `loading` shows `…`. **Disabled:** T.dim | `primary/*`, `destructive/text` |
| `Terminal/Menu label` | `Menu label` `373:35` | T.legend `text/muted`, original case: not the base uppercase T.eyebrow | — |
| `Terminal/Menu separator` | `Menu separator` `373:38` | A 1px `border/default` rule (the table header rule), margins 4 | `border/default` |
| `Terminal/Menu group` | `Menu group` `373:248` | Nests `Terminal/Menu label` and `Terminal/Menu item` | — |
| `Terminal/Menu content` | `Menu content` `373:256` | A T.pane with no title: `surface/bg`, 1px `border/strong`, radius 8. Padding 8/16: the pane's sides, with the top reduced because there is no title. No shadow (L270). Minimum width 192 | `surface/bg`, `border/strong` |
| `Terminal/Dropdown menu` | `Dropdown menu` `374:382` | Trigger `Terminal/Button / md` secondary with a trailing `▼` (`[ actions ▼ ]`); `Terminal/Menu content` 4px below | — |
| `Terminal/Context menu` | `Context menu` `374:653` | The trigger area is a solid T.pane, not dashed, with `right-click here` in T.grid `text/muted` | — |
| `Terminal/Dialog` | `Dialog` `378:743` | T.double. `backdrop` stays transparent for both `scrim` values, because Terminal uses no tint (L270). `content` padding 22/16/16/16. `title`: on the top border (keep the layer name and its `title` text property), T.pane-title `primary/text`. `description` T.grid `text/muted`. `close`: `Terminal/Icon button / sm` ghost `[×]`. Footer: keys, right-aligned, gap 10 | `border/ring`, `surface/bg` |
| `Terminal/Alert dialog` | `Alert dialog` `378:880` | As Dialog. `media`: a T.status word instead of the tile, `[WARN]` (default) or `[FAIL]` (destructive), because status is never a chip (L218). `cancel` is the Default key; `action` is the Primary key (with `darkKey` in dark) or the destructive key | `warning/text`, `destructive/text` |
| `Terminal/Sheet` | `Sheet` `379:1004` | (derived) A T.pane on its side with all four edges drawn, because Lip Gloss boxes are closed; radius 8, title on the border, no shadow, no tinted scrim. `handle` stays hidden (no TUI equivalent) | `border/strong` |
| `Terminal/Drawer` | `Drawer` `379:1150` | As Sheet; footer keys `Terminal/Button` | — |
| `Terminal/Popover` | `Popover` `381:937` | A T.pane with the title on the border. No arrow: `arrow` stays hidden (theme-character §3). `close` `[×]`; description T.grid `text/muted` | — |
| `Terminal/Tooltip` | `Tooltip` `381:1030` | (derived) A one-line chip on `surface/surface` (the bar colour, L276) with a 1px `border/strong` edge, radius 0, padding 2/8; label T.chrome `text/fg`; no arrow; `kbd` `Terminal/Kbd` sm inverse. Not the base `tooltip/*` inverse chip, which is a pale slab in dark (L330-331) | `surface/surface`, `border/strong` |
| `Terminal/Hover card` | `Hover card` `381:1093` | A T.pane. The avatar is `Terminal/Avatar` md, the initials keycap derived in 4.5 (no photos, L343); the calendar icon is hidden. Title T.grid-strong (for example `maya@prod`); description T.grid `text/muted`; meta T.legend `text/muted` | — |
| `Terminal/Command item` | `Command item` `382:1015` | A 24px line with the marker cell reserved. `item-icon` per T.glyph (`#` for a section, hidden otherwise). Label T.grid `text/fg`; url T.grid `text/muted`; excerpt T.legend `text/muted`, with matched words in T.grid-strong. `kind` is a bracketed word, `[page]`, in `text/muted` with no chip (T.status grammar). `shortcut` shows `Terminal/Kbd` sm. **selected:** T.select plus `⏎` at the end, instead of the base fill and 2px marker. Disabled T.dim | `primary/*` |
| `Terminal/Command palette` | `Command palette` `383:1355` | The Dialog recipe (T.double) at W 640. `input-row`: a T.prompt line (`> query` plus the block cursor) and `Terminal/Kbd` sm `esc`, over a 1px `border/default` rule. `filters`: the tab line (`1:all 2:pages 3:actions`). `group-label` T.legend `text/muted`. `footer`: T.help, `⏎ open • tab filter • esc close` | `border/ring`, `border/default` |

### 4.5 Data display 1 (page Components · Data display, 229:344)

Terminal draws data as lines on the character grid. Status is a bracketed word, the table is 24px
lines with an inverse lime selection bar, KPIs are metrics lines with block trend bars, and cards
are panes. Terminal has no avatars or images (L256-264, L301-305, L343).

| Style set | Base set | Terminal anatomy vs base | Binds |
| --- | --- | --- | --- |
| `Terminal/Kbd` | `Kbd` `403:28` | T.keycap: fill `surface/muted`, no stroke, radius 0 (`radius/badge`), glyph `text/fg`, padding-x 5, minimum width = H, hugging longer keys (`esc`, `ctrl+s`). Heights are literal, because the line box governs (L265-266). **sm:** 18×16 in T.keycap 12/16 Medium (L137-142; render status line `/` and `?`). **md** (derived from the render's page-footer keycaps, `41:2` `n` and `p`, 19×24): a full 24 line in T.grid. **inverse** (derived): fill `surface/bg`, so the cap stays distinct on the `surface/surface` tooltip chip; do not bind the base `tooltip/*` roles | `surface/muted`, `surface/bg` |
| `Terminal/Kbd group` | `Kbd group` `403:96` | Nests `Terminal/Kbd`; the "+" separator is one ch in T.grid `text/muted`, gap 0, so the keys sit on the grid | — |
| `Terminal/Badge` | `Badge` `405:180` | The status word (T.status; kit `39:48`; L218-220, L302; render `41:2` status column): bracketed, six characters, in T.grid, with no container, padding 0 and radius 0. The tone colours the brackets and the word: **success** `[ OK ]` `success/text`, **warning** `[WAIT]` `warning/text`, **info** `[SHIP]` `info/text`, **destructive** `[FAIL]` `destructive/text`, **neutral** `[RFND]` `text/muted`. The brackets are the theme-only parts `bracket-start` and `bracket-end`. Write four-letter codes so the word stays six characters, and pair every table with a legend line (L302, L329). **outline**, **subtle** and **solid** all draw the bracketed word (derived): status is never a chip (L218), and a filled chip would be a light slab in dark (L330-331). **plain** (counts): the bare word, no brackets, in `text/muted`. `dot`: Terminal draws no dot; the part stays in the tree, hidden. `iconStart`: a T.glyph character. `remove` (derived): ` ×` inside the brackets, `[tag ×]`. On a selected row the whole word turns `primary/fg` (Table row) | `success/text`, `warning/text`, `info/text`, `destructive/text`, `text/muted` |
| `Terminal/Badge / kind` | `Badge / kind` `405:211` | (derived from the status word) The kind as a bracketed word, `[function]`, in T.grid, coloured by the kind's `code/syntax/*` role, or `text/fg` where the base uses it. No container; `dot` hidden as in Badge | `code/syntax/*` |
| `Terminal/Avatar` | `Avatar` `406:95` | (derived; "no avatars, photos or illustration", L343) A keycap on the grid: square (`radius/avatar` is 0), fill `surface/muted`, no stroke, sizes `size/avatar/*` 24/32/40. **initials:** `text/fg` in T.keycap (sm), T.grid (md) and T.grid-strong (lg). **image:** the image layer stays in the tree, hidden, and the cap shows the initials: Terminal shows no photos. **fallback:** `?` in `text/muted`. **agent:** the prompt glyph `>` in `primary/text` (derived from the prompt, L298), never a lime slab. Where a layout names a person, prefer the `user@host` text of the status line (L306) | `surface/muted`, `primary/text` |
| `Terminal/Avatar presence` | `Avatar presence` `406:43` | (derived from `● live`, L306; render `#71d083` dark) The character `●` in T.grid, in place of the square and with no ring: **online** `success/text`, **away** `warning/text`, **offline** `text/muted`. The base square and ring stay in the tree, hidden | `success/text`, `warning/text`, `text/muted` |
| `Terminal/Avatar group` | `Avatar group` `406:150` | (derived) Caps never overlap on a character grid: gap 1ch instead of −8, and no rings. The count cap reads `+3` in `text/muted` | — |
| `Terminal/Item` | `Item` `408:792` | A list line from the alerts and log panes (L304-305; render `41:2` x836-1240). **media** is a fixed ch column: a level word (`WARN` in `warning/text`, `INFO` in `info/text`, 6ch, L263-264) or a time (`14:20:11` in `text/muted`, 9ch). Title T.grid `text/fg`; description T.grid `text/muted` on the next line, indented to the title column (render "auto-cancel on 2026-11-01"). Lines are 24, 4 apart (L253), and a line that overflows truncates with `…` (L305). Radius 0. **default:** no box. **outline** (derived): a T.pane with no title. **muted:** `surface/muted` fill as the base (`#222222` in dark, not a pale slab). **sm** (derived): one 24 line with the description hidden. **xs** (derived): one 20 line in T.chrome. **hover** (derived): `surface/hover`. **focus:** `Terminal/.Focus ring`. `actions`: `Terminal/Button / sm` or a Hint key. `chevron`: `▶`. `header` and `footer`: T.legend `text/muted` | `surface/hover`, `surface/muted` |
| `Terminal/Item group` | `Item group` `408:996` | The log pane's lines (L305): rows 4 apart, no rules. **separators** (derived): a 1px `border/default` rule between rows (the table header rule). Rows nest `Terminal/Item` with `Terminal/Avatar` media | `border/default` |
| `Terminal/.Item icon tile` | `.Item icon tile` `408:82` | (derived) No tile: a 3ch cell holding one T.glyph character (`#`, `●` or `▶`) in `text/fg`, with no fill | — |
| `Terminal/.Item image` | `.Item image` `408:85` | (derived; no images, L343) 40×40, radius 0. The image layer stays in the tree, hidden; the frame shows `[img]` in T.legend `text/muted` | `text/muted` |
| `Terminal/Card` | `Card` `409:951` | A pane (component-spec D3: "a 1px `border/strong` r8 frame carries the title on its top border, framed by `┤ ├`"; L194-195, L273-282; render `41:2` metrics, alerts, detail and log panes). **default:** T.pane: fill `card/bg` (`#fcfcfc` / `#000000`, the ground, theme-character §2.4); stroke `card/border` (`border-strong` after the shared step) at `card/border-top`, `card/border-side` and `card/border-bottom` 1; `radius/card` 8; R.card-shadow resolves to nothing; padding 22/16/16/16. **Header:** `title` sits in the T.pane title patch on the top border (keep its layer name and its `title` property), in T.pane-title `primary/text`. `eyebrow` (derived) joins the patch after the title as ` · eyebrow`, in `primary/text` (render `metrics · 30d`, `log · tail -f`). `description` T.grid `text/muted`. `action`: a Hint key or `Terminal/Button / sm` ghost. **footer:** keys on the last line, with no fill and no rule (render `41:2` detail pane: `[ save ctrl+s ] [ cancel esc ]`); `card/footer` is not bound. A Primary key in a dark footer sets `darkKey` (T.save-dark). **focus:** the active pane, 2px `border/ring` plus ` [focused]` (L195, L277-278). **hover** (derived): stroke `border/input`. **selected** (derived): `▶` before the title in the patch; the edge stays 1px. **rule:** the pane's top edge alone: a 1px `border/default` rule with the title patch on it, and no box. **sm** (derived): padding 22/12/12/12 | `card/*`, `border/ring`, `primary/text` |
| `Terminal/Stat card` | `Stat card` `409:1270` | One line of the metrics pane (L263-264, L303; render `41:2` x37-779, y128-262). It is unboxed: `kpi/border-*` 0, `kpi/gap` 0, `kpi/pad-x` 0, and `kpi/bg-*` is the ground (§1.0, §2.3). The base vertical stack becomes one 24 line: `label` 16ch in T.grid `text/fg` (render `net_revenue`); `value` 12ch end-aligned in T.kpi (14/24 Medium, `text/fg`); a 3ch gap; the delta, a ▲ or ▼ text glyph in the base arrow's place (same layer name) plus the value in T.grid, `success/text` up and `destructive/text` down, with `warning/text` by override (render `▲ 0.2pt`); then the trend, 12 block bars of varying height in a 16px band, `primary/text` (render `#bde56c` / `#5c7c2f`). The trend is the base blockbars decoration, shown through `deco/blockbars` (true for Terminal); sparkline and ticks stay hidden. Lines sit 4 apart. The header line (`metric value delta trend` in `text/muted` over a 1px `border/default` rule) belongs to the pane, not to this set. **hero** (derived; never an inverse slab, L330-331): the line in its own T.pane titled with the label (`┤ net_revenue ├`), value T.grid-strong. `badge` is `Terminal/Badge`; `icon` stays hidden (T.glyph); `detail` T.legend `text/muted` | `kpi/*`, `primary/text`, `success/text`, `destructive/text` |
| `Terminal/Table header cell` | `Table header cell` `410:546` | One 24 line (L261-262; render `41:2` y362-385). Label in T.grid `text/muted`, original lowercase content (`id`, `customer`), not the base uppercase T.eyebrow. No fill. **Sorted:** `text/fg` plus `▼` (desc) or `▲` (asc) after the label. **Sortable, unsorted:** `arrow-up-down` has no character, so it stays hidden. **hover** (derived): label `text/fg`. **focus:** `Terminal/.Focus ring`. The total aligns end | `text/muted` |
| `Terminal/Table cell` | `Table cell` `410:383` | Every cell is one 24 line in whole ch (L248-249, L256-261), padding-x 0, no cell rule. **text:** T.grid `text/fg`. **strong:** T.grid-strong. **mono:** T.grid, because everything is mono. **number:** T.grid end-aligned; negatives read `-210.00` in `destructive/text` (L301). **muted:** T.grid `text/muted`, for secondary columns (L223; render email, channel and date `#b4b4b4`). **badge:** `Terminal/Badge` outline. **avatar:** `Terminal/Avatar` sm before the name in T.grid; the crafted table shows the name alone (L343). **actions:** `Terminal/Icon button / xs` ghost, `…`. **select:** `Terminal/Checkbox` (`[x]` / `[ ]`) | — |
| `Terminal/Table row` | `Table row` `412:1187` | A 24 line on the shared grid, with the 2ch marker cell reserved on every row (L301, L315-316). Rows sit 4 apart (render pitch 28). No row rules (`table/row-rule-width` 0, §1.0); `table/row-bg` is the ground (§2.3). **selected:** T.select. The base 2px selection-bar part keeps its layer name and becomes the full-width `primary/default` bar under the row (render `41:2` y451-474), with `▶` in the marker cell. Every nested cell's text, status word and negative total turns `primary/fg`: the base cells would keep `text/fg`, which fails on lime in dark (theme-character §2.1). The select cell reads `[x]`. **hover** (derived): `surface/hover`. **focus:** `Terminal/.Focus ring` around the row. **disabled:** T.dim. **zebra** (derived): Terminal draws none (L261-262); bind `table/zebra` only if it resolves to the ground, otherwise `surface/bg`. **stacked** (derived): one `label: value` line per cell, with labels in T.grid `text/muted` (the prompt grammar, L298) | `primary/*`, `surface/hover` |
| `Terminal/Table` | `Table` `413:1367` | The Orders grid (L256-262; render `41:2` y330-615). **head:** no fill; header cells, then a 1px `table/head-rule` (render `border` `#3a3a3a`); select-all `Terminal/Checkbox`. **Columns:** `2ch 12ch 25ch minmax(0, 1fr) 17ch 10ch 18ch 12ch` (marker, id, customer, email, channel, status, date, total). Resolve the flexible track from the final content box; never shrink the type or clip a column (L256-261). **caption:** the filter line `/status:any channel:any since:30d` in T.grid `text/fg`, with `sort: date ▼` end-aligned in `text/muted` (render; the render's triangle is `▾`, see Select). **summary:** `-- page 1/531 --` in `text/muted`, then the status legend line in T.legend `text/muted` (`[ OK ] paid [WAIT] awaiting payment …`, L302, L329). **empty** (derived): one line, `no orders match /status:any`, in `text/muted`. **loading** (derived): one line with `Terminal/Spinner` `…` (L359) | `table/head-rule` |
| `Terminal/Data table` | `Data table` `416:4605` | The focused Orders pane (render `41:2` x20-1259, y293-633). **Chrome:** `Terminal/Card` titled `orders · 6 of 3,182`, shown active (2px `border/ring`, ` [focused]`) when it holds focus. **Toolbar** on one line (derived from the caption line): `Terminal/Search` as the `/` prompt; the status and date `Terminal/Select`s as `status:any ▼` and `since:30d ▼`; the Table/Board `Terminal/Toggle group` segmented as a tab line (`1:table 2:board`); Columns and Export as `Terminal/Button / sm` ghost keys (`[ columns c ]`, `[ export e ]`). **selection:** `Terminal/Action bar` inline above the table. **Table:** `Terminal/Table`. **Pagination:** `-- page 1/531 --` with the Hint keys `n next` and `p prev` (render y569-592). **columns:** `Terminal/Menu content` with `[x]` rows. **loading** and **empty:** as Table. **mobile:** stacked rows | `border/ring` |

## 5. What stays in tokens (do not redraw)

- **Colours:** every colour comes from roles, which already resolve to Terminal under Theme B
  Terminal. The only exceptions are the three dark Save key primitives (§2).
- **Text:** `type/*` and `font/*`. After the shared step, all are Geist Mono: body 14/24; strong
  14/24 Medium; heading, title and display 14/20 or 14/24 Medium; label 12/16 Medium; small and
  caption 12/20. The only literal is T.help (13/20 SemiBold).
- **Shape:**
  - every `radius/*` is 0 except `radius/card` 8 (panes);
  - `border/width` is 1;
  - `focus/ring-width` and `focus/ring-offset` are 2/2.
- **Sizes:** `size/checkbox` 16 and `size/switch/*` 32/18/14 stay bound on the hidden base parts.
  The visible controls are text. The keycap's 18×16 is literal.
- **Structure twins:**
  - `tabs/*`: gap 4, pad 0, sel-bottom 2, sel-box 0, track transparent, sel-bg the hover fill,
    sel-border `ring`;
  - `nav/active`: the hover fill;
  - `card/border`: `border-strong`;
  - `topbar/bg` is `surface` and `topbar/rule` is `border`.
- **Heights:** Density Compact is set, but Terminal binds no Density variable (L265-266). Draw these
  as literals: keys 34, tabs 26, lines 24, status line 32, tab line 43, help bar 33, prompt field 50.
- **Effects:** none. No shadow, glow, blur or gradient (L270, L332).

## 6. Verification strips

For each category, build a frame `Terminal style strip · <Category>` at the end of that category's
sub-frame. It has four rows, Light (`3:0`) above Dark (`3:1`), with explicit modes (set B, Theme B
Terminal). In the Dark rows, set `darkKey` on every Primary key, after the swap in the swap row:
theme-only booleans have no base value to carry.

| Row | Content |
| --- | --- |
| Base | The base instances under Theme B Terminal: the "before" |
| Style | The same instances swapped to the `Terminal/*` sets |
| Swap test | Base instances whose label text and booleans you override, then swap to `Terminal/*`. Every override survives |
| States | One of each state for the category's interactive sets |

**Instances per category:**

- **Actions:**
  - Button md in all six variants at rest;
  - Button md primary in hover, pressed, focus and disabled;
  - a Hint key (`n next`);
  - Icon button md;
  - Toggle off and selected;
  - Toggle group segmented;
  - Button group (Save and Cancel);
  - Action bar floating;
  - Theme toggle.
- **Forms:**
  - Input rest, focus (block cursor plus ring), invalid and disabled;
  - Field invalid with its repair line;
  - Field set as a titled pane;
  - Select;
  - Textarea;
  - Checkbox off and on;
  - Radio off and on;
  - Switch off and on (md and sm);
  - Slider;
  - Input OTP;
  - Search rest and open;
  - Calendar;
  - Dropzone uploading.
- **Navigation:**
  - Tabs list default, line and segmented;
  - Nav item rest and selected;
  - Breadcrumb;
  - Pagination numbered;
  - Top bar app desktop;
  - Stepper horizontal;
  - Menubar open.
- **Overlays:**
  - Menu content with one highlighted row;
  - Dropdown menu open;
  - Dialog md;
  - Alert dialog;
  - Sheet right;
  - Popover bottom;
  - Tooltip top;
  - Command palette results.
- **Data display 1:**
  - Badge: every tone in the status style (outline), plus plain;
  - Avatar: initials and agent, plus presence;
  - Avatar group;
  - Card: default and rule, with footer (a Primary key with `darkKey` in the Dark rows);
  - Stat card: default and hero, with deltas up and down;
  - Table: rows, with one selected and one zebra;
  - Data table: selection;
  - Item group;
  - Kbd group.

**Expected (style row vs base row):**

- one monospace size everywhere, with no proportional text and no vector icons;
- keys are square bracketed words, 34 tall. Dark Primary is the `#222222` key with a `#7b7b7b` edge
  and lime text;
- fields are `label:` over `> value`, with no box;
- checks, radios and switches are text: `[x]`, `(•)`, `[on ]`;
- floats are 8px-rounded 1px panes with titles in the border; dialogs have a double border;
- selection is the inverse lime bar with `▶`, the only light slab in dark;
- focus is a square 2px `border/ring` outline. A shadow, a glow, a gradient, a pale key or tab in
  dark, or a proportional font is a defect (L330-332).

**Expected, Data display 1:**

- status is a bracketed six-character word coloured by role, never a chip;
- the table is 24px grid lines with no rules or zebra. The selected row is the full-width lime bar
  with `▶`, and every cell on it turns `primary-fg`;
- cards are 8px-rounded panes with titles in the border; the focused card is 2px lime with
  `[focused]`;
- stat cards are metrics lines with ▲/▼ deltas and lime block trend bars, with no tiles;
- avatars are square initials keycaps, never photos or circles;
- a coloured chip, a photo, a round avatar or any light slab in dark other than the selection bar
  is a defect (L218, L330-331, L343).

## 7. Done when

- **Every set exists.** All 101 style sets in section 4 exist (23 Actions including the four
  foundations, 21 Forms, 23 Navigation, 16 Overlays now that `.Kbd` is retired, 18 Data display 1),
  plus the `Terminal/Icon/*` character glyphs. Each set has the base variant count, property names
  and part names.
- **Every strip passes.** Each category strip is captured in Light and Dark, and every swap test
  passes.
- **Nothing outside the page changed.** No base set, variable or other page was edited, and the
  ledger `style-ledger/terminal.json` lists every set id.
