# Theme character pass: build sheet

- **File:** `pGRLnkPPRZJZy74evNcQBr`. Written 2026-10-28 as research only (no `use_figma`).
- **Owner feedback:** "they all look too much the same, we lost the actual variation in themes".
  Then: "this is how the new shadcn system works and what I originally asked for".
- **Model (owner, 2026-10-28):** shadcn's current model. A **style** is a full restyle of every
  component over the same component API; base colour, accent, radius and font are separate token
  axes. For this file:
  - the base library (Actions, Forms, Navigation, Overlays; Data display in progress) is the API
    contract and the Studio style;
  - every theme language is a style, so every base set gets a `<Theme>/<Component>` style set with
    the same property names, values and part layer names (an instance swap keeps overrides);
  - the variables stay the token axes. This file sets their values.

## What is where

| File | Contents | Who applies it |
| --- | --- | --- |
| `theme-character.md` (this file) | §1 Theme and Theme B values, §2 Theme `l`/`d` colour roles (§2.4 `card/bg`), §3 short shape-literal audit, §4 builder groups and order, §5 conflicts found | Reference |
| `style-briefs/_shared-variables.md` | The ordered apply list for §1–§3: the only step that touches shared variables or base components | One agent, first |
| `style-briefs/<theme>.md` (10 files) | One self-contained style brief per theme | One builder per group (§4), in parallel, each on its own theme pages only |

## 0. Ground rules for every change in this file

- **Studio and its seven flavors stay pixel-identical.** No Studio-mode value changes. Every row
  below leaves the `Studio` column and every Studio flavor value alone.
- **Modes in scope.** Theme collection: `Tonal`, `Fluent`, `Brutal`, `Filigrane`, `Pixel`,
  `Tactile`. Theme B: `Bloom`, `Cupertino`, `Liquid`, `Terminal`, plus the three planned faithful
  modes (`macOS 27`, `Apple Classic`, `Fluent 2 Web`), seeded from their siblings.
- **Modes left alone.** Theme `Ledger`, `Signal` and `Glass`. The Terminal, Cupertino and Liquid
  crafted frames still render through `Signal` and `Glass`, so editing those modes would repaint
  the crafted specimens. Their character goes into the Theme B modes instead.
- **Crafted frames must not move.** Several crafted frames render through a mode changed here:
  - Tonal and Bloom frames (`Tonal`);
  - Brutal, Filigrane, Fluent, Pixel and Tactile frames (their own modes).
  
  The maps say which ones bind Theme variables:
  - Bloom and Tactile bind none;
  - Fluent binds only `radius/*`;
  - Brutal binds `type/title`;
  - Tonal binds its fonts;
  - Filigrane and Pixel bind semantic roles.
  
  So this pass changes structure twins, new-role intermediates and values the frames do not
  read, plus values that equal what the frames already show. The verification in
  `_shared-variables.md` diffs every crafted frame (expected 0.0000%). A non-zero diff means a frame
  reads a changed variable: revert that one value and record it in §5.
- **Dark is designed, never inverted.** Every colour change below gives a designed dark value from
  the theme's own DESIGN.md. No pale slab, white header or white outline is introduced. Where a base
  component would put the wrong ink on a theme fill (for example `text/fg` on Brutal ink, Pixel amber
  or Tonal violet), the fill is **not** moved into a shared role. The style component draws it with
  the right ink instead. Each such case is named in §2.
- **Owner notes (`state.json` → `ownerNotes`) still hold:**
  - one label in callout headers;
  - status tones on callouts;
  - Studio badges keep the outline plus a 6px dot;
  - red only for the logo and destructive in Studio;
  - the tabs ink marker only on the default variant.
  
  Nothing here changes `deco/marker` for a non-Studio theme.
- **Names are owned by code.** GUIDELINES §1: Figma owns values, code owns names. This pass adds
  no new variable except the optional `radius/pill` in §3, which needs a code name
  (`var(--ns-radius-pill)`) registered in #2414 before it ships.
- **Sources.** `L123` means line 123 of `docs/design-system/themes/<theme>/DESIGN.md` on
  `origin/main` (fetched 2026-10-28). "render" means the crafted-frame export
  `.llm/runs/design-system-s4--language-review/renders-r7/<theme>--light.png`. Current values come
  from the export on `origin/design/figma-code-roles`
  (`.llm/runs/docs-fresh-ui-design-system--design-handoff/figma-variables/`, 2026-10-28 15:03).
  Variables added later (`type/mono-strong/style`, `tooltip/*`) are not touched.

## 1. Theme and Theme B values

**How to read the matrices.**

- A bold cell is a change, written `**new** (current)`; a plain cell is unchanged.
- `→x` aliases the same mode's variable `x` (`→border/width` in Theme B means Theme B
  `border/width`).
- `SF:x` aliases Studio flavor.
- The three faithful columns copy their sibling's new values:
  - `macOS 27` ← Liquid;
  - `Fluent 2 Web` ← Fluent;
  - `Apple Classic` ← Cupertino, plus the two values the Cupertino spec gives Apple Classic
    (L270-272: 6px-corner push buttons, an attached sidebar).
  
  They stay seeds until #2443.
- **Sizes not set here.** Control heights stay on Density. Style components draw each theme's fixed
  heights (table at the end of §1).

**Changed values per theme** (Theme or Theme B variable values):

| Theme | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| §1 values | 27 | 65 | 21 | 59 | 22 | 18 | 19 | 39 | 22 | 47 | 59 | 21 | 22 |
| §2 colour values (`l` + `d`) | 26 | 43 | 14 | 33 | 24 | 14 | 25 | 26 | 21 | 24 | = Liquid 33 | = Cupertino 14 | = Fluent 24 |
| **Total** | **53** | **108** | **35** | **92** | **46** | **32** | **44** | **65** | **43** | **71** | **92** | **35** | **46** |

### 1.0 Value matrices

#### Tabs

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tabs/gap` | SF:tabs/gap | 2 | 2 | **0** (2) | **0** (2) | 2 | **-2** (2) | **28** (2) | **4** (2) | 2 | **12** (2) | **0** (2) | **0** (2) | 2 |
| `tabs/pad` | SF:tabs/pad | **0** (3) | 3 | **2** (3) | **2** (3) | **0** (3) | **0** (3) | **0** (3) | **0** (3) | **0** (3) | **0** (3) | **2** (3) | **2** (3) | **0** (3) |
| `tabs/radius` | SF:tabs/radius | **0** (→radius/control) | →radius/control | **9** (→radius/control) | →radius/control | **0** (→radius/control) | **0** (→radius/control) | →radius/control | →radius/control | →radius/control | **0** (→radius/control) | →radius/control | **9** (→radius/control) | **0** (→radius/control) |
| `tabs/item-pad` | SF:tabs/item-pad | **20** (12) | 12 | 12 | 12 | 12 | **16** (12) | **0** (12) | 12 | 12 | **20** (12) | 12 | 12 | 12 |
| `tabs/item-radius` | SF:tabs/item-radius | **8** (→radius/control) | →radius/control | **7** (→radius/control) | →radius/control | →radius/control | **0** (→radius/control) | →radius/control | →radius/control | →radius/control | →radius/control | →radius/control | **7** (→radius/control) | →radius/control |
| `tabs/sel-box` | SF:tabs/sel-box | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) |
| `tabs/sel-bottom` | SF:tabs/sel-bottom | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **2** (→border/width) | **2** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) |
| `tabs/idle-stroke` | SF:tabs/idle-stroke | 0 | 0 | 0 | 0 | 0 | **→border/width** (0) | 0 | 0 | 0 | **→border/width** (0) | 0 | 0 | 0 |

#### Table

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `table/head-rule-width` | SF:table/head-rule | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | **1** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) |
| `table/row-rule-width` | SF:table/row-rule | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width | **0** (→border/width) | **1** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) |
| `table/cell-rule-width` | SF:table/cell-rule | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `table/inset` | SF:table/inset | 0 | 0 | **7** (0) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **7** (0) | 0 |
| `table/row-gap` | SF:table/row-gap | **2** (0) | **6** (0) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **12** (0) | 0 | 0 | 0 |
| `table/row-radius` | SF:table/row-radius | **6** (0) | **28** (0) | **12** (0) | **8** (0) | **4** (0) | 0 | 0 | 0 | 0 | **20** (0) | **8** (0) | **12** (0) | **4** (0) |

#### Card

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `card/border-top` | SF:card/border-top | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | →border/width | **1** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width |
| `card/border-side` | SF:card/border-side | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | **0** (→border/width) | →border/width | **1** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width |
| `card/border-bottom` | SF:card/border-bottom | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | **0** (→border/width) | →border/width | **1** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width |

#### KPI

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kpi/border-top` | SF:kpi/border-top | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | **0** (→border/width) | **1** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width |
| `kpi/border-right` | SF:kpi/border-right | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | **0** (→border/width) | **1** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width |
| `kpi/border-bottom` | SF:kpi/border-bottom | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | **0** (→border/width) | **1** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width |
| `kpi/border-left` | SF:kpi/border-left | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width |
| `kpi/first-left` | SF:kpi/first-left | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | **0** (→border/width) | **0** (→border/width) | **1** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | →border/width |
| `kpi/gap` | SF:kpi/gap | **12** (16) | 16 | **12** (16) | **12** (16) | **12** (16) | **20** (16) | **0** (16) | **0** (16) | **0** (16) | **24** (16) | **12** (16) | **12** (16) | **12** (16) |
| `kpi/pad-x` | SF:kpi/pad-x | 20 | **24** (20) | **16** (20) | **16** (20) | **16** (20) | 20 | **16** (20) | **0** (20) | 20 | 20 | **16** (20) | **16** (20) | **16** (20) |

#### Nav

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nav/pad` | SF:nav/pad | 0 | 0 | 0 | 0 | **4** (0) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **4** (0) |
| `nav/radius` | SF:nav/radius | **16** (→radius/control) | →radius/control | **9** (→radius/control) | **10** (→radius/control) | →radius/control | **6** (→radius/control) | →radius/control | →radius/control | →radius/control | →radius/control | **10** (→radius/control) | **9** (→radius/control) | →radius/control |

#### Top bar, frame, hero

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `topbar/radius` | SF:topbar/radius | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `topbar/rule-width` | SF:topbar/rule | **0** (→border/width) | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | →border/width | →border/width | →border/width | **0** (→border/width) | **0** (→border/width) | →border/width | **0** (→border/width) | **0** (→border/width) |
| `topbar/shadow-y` | SF:topbar/shadow-y | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `topbar/shadow-blur` | SF:topbar/shadow-blur | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `frame/inset` | SF:frame/inset | 0 | 0 | **16** (0) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `hero/pad` | SF:hero/pad | **24** (0) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

#### Radius

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `radius/control` | SF:radius/control | 999 | 999 | 999 | 999 | 4 | 8 | 0 | **0** (6) | 0 | 999 | 999 | **6** (999) | 4 |
| `radius/input` | SF:radius/input | 4 | **28** (4) | 10 | **7** (10) | 4 | 8 | 0 | **0** (6) | 0 | 14 | **7** (10) | 10 | 4 |
| `radius/card` | SF:radius/card | **28** (16) | **32** (16) | 22 | **14** (22) | 8 | 12 | 0 | 8 | 0 | 24 | **14** (22) | 22 | 8 |
| `radius/badge` | SF:radius/badge | 8 | **15** (8) | 999 | 999 | **4** (999) | 999 | 0 | **0** (4) | 0 | 999 | 999 | 999 | **4** (999) |
| `radius/checkbox` | SF:radius/checkbox | 2 | **999** (2) | 999 | 999 | 4 | 4 | 0 | **0** (2) | 0 | 8 | 999 | 999 | 4 |
| `radius/avatar` | SF:avatar/radius | 999 | 999 | 999 | 999 | 999 | **6** (999) | **999** (0) | **0** (999) | 0 | 999 | 999 | 999 | 999 |

#### Border width

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `border/width` | SF:border/width | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | **2** (1) | 1 | 1 | 1 | 1 |

#### Shadows (card, control, overlay)

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shadow/x` | SF:shadow/x | 0 | 0 | 0 | 0 | 0 | **6** (4) | 0 | 0 | 0 | **18** (0) | 0 | 0 | 0 |
| `shadow/y` | SF:shadow/y | **0** (1) | **0** (1) | **0** (10) | **0** (10) | **0** (2) | **6** (4) | 0 | 0 | 0 | **18** (3) | **0** (10) | **0** (10) | **0** (2) |
| `shadow/blur` | SF:shadow/blur | **0** (3) | **0** (3) | **0** (28) | **0** (28) | **0** (4) | 0 | 0 | 0 | 0 | **44** (8) | **0** (28) | **0** (28) | **0** (4) |
| `shadow/control/x` | SF:button/shadow-x | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `shadow/control/y` | SF:button/shadow-y | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | **4** (0) | 0 | 0 | 0 | 0 |
| `shadow/overlay/y` | SF:shadow/y | 3 | **12** (3) | **10** (16) | 16 | 8 | 0 | 0 | 0 | 0 | **18** (0) | 16 | **10** (16) | 8 |
| `shadow/overlay/blur` | SF:shadow/blur | 8 | **32** (8) | **28** (40) | 40 | 16 | 0 | 0 | 0 | 0 | **44** (0) | 40 | **28** (40) | 16 |

#### State opacities

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `state/hover-opacity` | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 |
| `state/pressed-opacity` | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 |
| `state/disabled-opacity` | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 | 38 |

#### Focus ring

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `focus/ring-width` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| `focus/ring-offset` | 2 | 2 | 2 | 2 | 0 | **3** (2) | 2 | 3 | 2 | 2 | 2 | 2 | 2 | **3** (2) |

#### Sizes

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `size/checkbox` | 16 | 18 | **28** (18) | 20 | 20 | 20 | 22 | 16 | 16 | 20 | 28 | 20 | 20 | 20 |
| `size/switch/width` | 32 | 52 | **28** (52) | 51 | **46** (51) | 40 | 52 | 32 | 32 | 44 | 60 | **46** (51) | 51 | 40 |
| `size/switch/height` | 18 | 32 | **28** (32) | 31 | **28** (31) | 20 | 28 | 18 | 18 | 24 | 34 | **28** (31) | 31 | 20 |
| `size/switch/thumb` | 14 | 24 | **12** (24) | 27 | **24** (27) | 12 | **18** (22) | 14 | 14 | 16 | 28 | **24** (27) | 27 | 12 |
| `size/switch/width-sm` | 28 | →size/switch/width | →size/switch/width | →size/switch/width | →size/switch/width | →size/switch/width | →size/switch/width | 28 | 28 | →size/switch/width | →size/switch/width | →size/switch/width | →size/switch/width | →size/switch/width |
| `size/switch/height-sm` | 16 | →size/switch/height | →size/switch/height | →size/switch/height | →size/switch/height | →size/switch/height | →size/switch/height | 16 | 16 | →size/switch/height | →size/switch/height | →size/switch/height | →size/switch/height | →size/switch/height |
| `size/switch/thumb-sm` | 12 | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | 12 | 12 | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb | →size/switch/thumb |
| `size/avatar/sm` | 24 | 24 | 24 | 24 | **22** (24) | 24 | 24 | 24 | 24 | 24 | **40** (24) | **22** (24) | 24 | 24 |
| `size/avatar/md` | 32 | **40** (32) | **40** (32) | **28** (32) | **28** (32) | 32 | **34** (32) | 32 | 32 | **28** (32) | **44** (32) | **28** (32) | **28** (32) | 32 |
| `size/avatar/lg` | 40 | **56** (40) | **48** (40) | **32** (40) | 40 | 40 | 40 | 40 | 40 | **32** (40) | **48** (40) | 40 | **32** (40) | 40 |
| `size/icon/sm` | 14 | 18 | **14** (18) | 14 | 14 | **12** (16) | 14 | 14 | 14 | 14 | 14 | 14 | 14 | **12** (16) |
| `size/icon/md` | 16 | 24 | **18** (24) | 16 | 16 | **16** (20) | 16 | 16 | 16 | 16 | **18** (16) | 16 | 16 | **16** (20) |
| `size/icon/lg` | 20 | 24 | **20** (24) | 20 | **17** (20) | **20** (24) | **18** (20) | 20 | 20 | 20 | 20 | **17** (20) | 20 | **20** (24) |
| `size/kbd` | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 |
| `icon/stroke` | SF:icon/stroke | 2 | 2 | 2 | 2 | 2 | 2 | **1.5** (2) | 2 | 2 | 2 | 2 | 2 | 2 |

#### Decoration booleans

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `deco/marker` | SF:deco/marker | false | false | false | false | false | false | false | false | false | false | false | false | false |
| `deco/sparkline` | SF:deco/sparkline | false | false | **true** (false) | false | false | false | false | false | false | false | false | **true** (false) | false |
| `deco/ticks` | SF:deco/ticks | false | false | false | false | false | false | false | false | false | false | false | false | false |
| `deco/blockbars` | SF:deco/blockbars | false | false | false | false | false | **true** (false) | false | **true** (false) | **true** (false) | false | false | false | false |

#### Font families

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `font/sans` | SF:font/sans | Roboto Flex | **Funnel Sans** (Roboto Flex) | Inter | Inter | Open Sans | Space Grotesk | Hanken Grotesk | **Geist Mono** (Geist) | Inter | Nunito Sans | Inter | Inter | Open Sans |
| `font/heading` | SF:font/heading | Roboto Flex | **Funnel Display** (Roboto Flex) | Inter | Inter | Open Sans | Space Grotesk | Newsreader | Geist Mono | Pixelify Sans | Nunito Sans | Inter | Inter | Open Sans |
| `font/kpi` | SF:font/kpi | Roboto Flex | **Funnel Display** (Roboto Flex) | Inter | Inter | Open Sans | Space Grotesk | Newsreader | Geist Mono | Pixelify Sans | Nunito Sans | Inter | Inter | Open Sans |
| `font/label` | SF:font/label | Roboto Flex | **Funnel Sans** (Roboto Flex) | Inter | Inter | Open Sans | Space Mono | Hanken Grotesk | Geist Mono | Space Mono | Nunito Sans | Inter | Inter | Open Sans |
| `font/data` | SF:font/data | Roboto Flex | **Funnel Sans** (Roboto Flex) | Inter | Inter | Open Sans | JetBrains Mono | Hanken Grotesk | Geist Mono | JetBrains Mono | **Geist Mono** (Nunito Sans) | Inter | Inter | Open Sans |
| `font/mono` | SF:font/mono | Geist Mono | Geist Mono | Geist Mono | Geist Mono | JetBrains Mono | JetBrains Mono | IBM Plex Mono | Geist Mono | JetBrains Mono | Geist Mono | Geist Mono | Geist Mono | JetBrains Mono |

#### Type styles (rows where at least one theme changes)

| Variable | Studio (ref) | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile | macOS 27 | Apple Classic | Fluent 2 Web |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type/display/size` | SF:type/display/size | 57 | **92** (57) | 48 | **40** (48) | 40 | 72 | 76 | **14** (44) | **40** (64) | 48 | **40** (48) | 48 | 40 |
| `type/display/line` | SF:type/display/line | 64 | **96** (64) | 52 | **48** (52) | 52 | 72 | 76 | **24** (48) | **48** (64) | 56 | **48** (52) | 52 | 52 |
| `type/display/style` | SF:type/display/style | Medium | **Regular** (Medium) | Bold | Bold | SemiBold | **Regular** (Bold) | **Light** (ExtraLight) | Medium | SemiBold | Bold | Bold | Bold | SemiBold |
| `type/display/tracking` | SF:type/display/tracking | -0.25 | **-3.68** (-0.25) | -1.4 | **-0.6** (-1.4) | **-0.5** (0) | -3 | -2.4 | **0** (-2) | 0 | -1.4 | **-0.6** (-1.4) | -1.4 | **-0.5** (0) |
| `type/title/size` | SF:type/title/size | 36 | **40** (36) | 34 | **22** (34) | 28 | 52 | 34 | **14** (22) | 40 | **32** (30) | **22** (34) | 34 | 28 |
| `type/title/line` | SF:type/title/line | 44 | **48** (44) | 40 | **28** (40) | 36 | 52 | 40 | **20** (28) | 48 | **40** (38) | **28** (40) | 40 | 36 |
| `type/title/style` | SF:type/title/style | Medium | **Regular** (Medium) | Bold | Bold | SemiBold | Regular | Light | **Medium** (SemiBold) | SemiBold | **Regular** (Bold) | Bold | Bold | SemiBold |
| `type/title/tracking` | SF:type/title/tracking | 0 | 0 | -0.9 | **-0.33** (-0.9) | **-0.5** (0) | -2 | -0.6 | **0** (-0.25) | 0 | **0** (-0.6) | **-0.33** (-0.9) | -0.9 | **-0.5** (0) |
| `type/heading/size` | SF:type/heading/size | 16 | **22** (16) | 17 | **15** (17) | 20 | 18 | **24** (21) | 14 | 24 | **20** (17) | **15** (17) | 17 | 20 |
| `type/heading/line` | SF:type/heading/line | 24 | **28** (24) | 22 | **18** (22) | 28 | 24 | **32** (28) | 20 | 32 | **28** (24) | **18** (22) | 22 | 28 |
| `type/heading/style` | SF:type/heading/style | Medium | **Regular** (Medium) | Semi Bold | Semi Bold | SemiBold | Bold | Light | Medium | SemiBold | **Regular** (SemiBold) | Semi Bold | Semi Bold | SemiBold |
| `type/heading/tracking` | SF:type/heading/tracking | 0.15 | **0** (0.15) | -0.3 | **-0.075** (-0.3) | **-0.2** (0) | -0.3 | -0.2 | **0** (-0.1) | 0 | **0** (-0.2) | **-0.075** (-0.3) | -0.3 | **-0.2** (0) |
| `type/kpi/size` | SF:type/kpi/size | 45 | **60** (45) | 34 | **40** (34) | 28 | 40 | 30 | **14** (26) | 40 | 32 | **40** (34) | 34 | 28 |
| `type/kpi/line` | SF:type/kpi/line | 52 | **64** (52) | 40 | **48** (40) | 36 | 44 | 36 | **24** (32) | 48 | **38** (40) | **48** (40) | 40 | 36 |
| `type/kpi/style` | SF:type/kpi/style | Medium | **Regular** (Medium) | Semi Bold | **Bold** (Semi Bold) | SemiBold | Bold | Light | Medium | Medium | **Light** (Bold) | **Bold** (Semi Bold) | Semi Bold | SemiBold |
| `type/kpi/tracking` | SF:type/kpi/tracking | 0 | **-1.8** (0) | -1 | **-0.6** (-1) | **-0.5** (0) | -1.5 | -0.6 | 0 | 0 | **0** (-0.8) | **-0.6** (-1) | -1 | **-0.5** (0) |
| `type/kpi-sm/size` | SF:type/kpi-sm/size | 32 | **48** (32) | 34 | **26** (34) | 24 | 40 | 30 | **14** (26) | 32 | **32** (28) | **26** (34) | 34 | 24 |
| `type/kpi-sm/line` | SF:type/kpi-sm/line | 40 | **52** (40) | 40 | **32** (40) | 32 | 44 | 36 | **24** (32) | 40 | **38** (36) | **32** (40) | 40 | 32 |
| `type/body/size` | SF:type/body/size | 14 | **15** (14) | 14 | **13** (14) | 14 | 14 | 15 | 14 | 14 | **16** (14) | **13** (14) | 14 | 14 |
| `type/body/line` | SF:type/body/line | 20 | 20 | 20 | **17** (20) | 20 | 20 | 24 | **24** (20) | 20 | **22** (20) | **17** (20) | 20 | 20 |
| `type/body/tracking` | 0 | 0.25 | **0** (0.25) | -0.1 | **-0.052** (-0.1) | 0 | 0 | 0 | 0 | 0 | 0 | **-0.052** (-0.1) | -0.1 | 0 |
| `type/strong/size` | SF:type/strong/size | 14 | **16** (14) | 14 | **13** (14) | 14 | 14 | 15 | 14 | 14 | **16** (14) | **13** (14) | 14 | 14 |
| `type/strong/line` | SF:type/strong/line | 20 | **21** (20) | 20 | **17** (20) | 20 | 20 | **24** (22) | **24** (20) | 20 | **22** (20) | **17** (20) | 20 | 20 |
| `type/strong/style` | SF:type/strong/style | SemiBold | **Medium** (SemiBold) | Medium | Medium | SemiBold | **Bold** (Medium) | Medium | Medium | Bold | SemiBold | Medium | Medium | SemiBold |
| `type/strong/tracking` | 0 | 0.1 | **0** (0.1) | -0.1 | **0** (-0.1) | 0 | **-0.3** (0) | 0 | 0 | 0 | 0 | **0** (-0.1) | -0.1 | 0 |
| `type/small/size` | SF:type/small/size | 12 | **13** (12) | 13 | **12** (13) | 12 | 13 | 14 | **12** (13) | 13 | 13 | **12** (13) | 13 | 12 |
| `type/small/line` | SF:type/small/line | 16 | **17** (16) | 18 | **16** (18) | 16 | 18 | 20 | **20** (18) | 18 | 18 | **16** (18) | 18 | 16 |
| `type/small/tracking` | 0 | 0.4 | **0** (0.4) | -0.05 | **0.036** (-0.05) | 0 | 0 | 0 | 0 | 0 | 0 | **0.036** (-0.05) | -0.05 | 0 |
| `type/caption/size` | SF:type/caption/size | 12 | 12 | 12 | **11** (12) | 12 | 12 | 12 | 12 | 12 | **13** (12) | **11** (12) | 12 | 12 |
| `type/caption/line` | SF:type/caption/line | 16 | 16 | 16 | **14** (16) | 16 | 16 | 16 | **20** (16) | 16 | **18** (16) | **14** (16) | 16 | 16 |
| `type/caption/style` | Regular | Regular | Regular | Regular | **Semi Bold** (Regular) | Regular | Regular | Regular | Regular | Regular | Regular | **Semi Bold** (Regular) | Regular | Regular |
| `type/caption/tracking` | 0 | 0.4 | **0** (0.4) | 0 | **0.033** (0) | 0 | 0 | 0.1 | 0 | 0 | 0 | **0.033** (0) | 0 | 0 |
| `type/label/size` | SF:type/label/size | 12 | 12 | 12 | **11** (12) | 12 | 11 | **13** (12) | **12** (11) | 12 | **13** (12) | **11** (12) | 12 | 12 |
| `type/label/line` | SF:type/label/line | 16 | 16 | 16 | **14** (16) | 16 | 16 | **18** (16) | 16 | 16 | **18** (16) | **14** (16) | 16 | 16 |
| `type/label/style` | SF:type/label/style | SemiBold | **Regular** (SemiBold) | Medium | **Semi Bold** (Medium) | SemiBold | Bold | Regular | **Medium** (Regular) | Regular | SemiBold | **Semi Bold** (Medium) | Medium | SemiBold |
| `type/label/tracking` | SF:type/label/tracking | 0.4 | **0** (0.4) | 0 | **0.22** (0) | 0 | 0.6 | 0.2 | **0** (0.4) | 0.6 | 0 | **0.22** (0) | 0 | 0 |

### 1.1 Sources for the §1 values

Every bold cell above traces to one of these lines. An unchanged cell means either that the current
value already matches DESIGN.md, or that DESIGN.md does not document the value; the second case is
marked "not drawn".

- **Tonal** (`tonal/DESIGN.md`):
  - **Tabs.** The filter tabs are the connected button group (L176-189, L357-358): no track, 2px
    gaps (render: 2–3px), inner corners 8, 20px side padding (measured on `23:277`). The selected
    full pill and the 48px height are drawn in
    `Tonal/Tab`.
  - **Table.** Segmented rows: 2px apart, inner corners 6, no rules (L141, L126, L370). The outer 28
    on the first and last rows is positional, so it is drawn in the style set.
  - **Card and KPI.** No borders or shadows on surfaces (L272-276, L328-333, L389). KPI padding is
    20 (L248). The KPI gap is 12: L317-319 gives 380 + 3 × 243 in 1144, and the render measures the
    hero at 104–484 with the next card at 497.
  - **Nav.** Rail indicator 56×32 r16 (L378).
  - **Top bar.** No bar: a 56px pill search on the page (L380).
  - **Hero.** Padding 24 (L236).
  - **Radius.** `radius/card` 28 for KPIs, the sync card and the banner (L130, L342; the Mapping
    section calls 16 a leftover, L452-454). `radius/badge` is already 8 for status chips (L127,
    L227, L373).
  - **Shadow.** Card shadow 0, because a raised surface takes the next container step (L328, L389).
    The overlay stays at 0 3 8 (L334).
  - **Avatar.** 40px circles; the sunny shape is 56 (L344-345, L413).
  - **Already correct:** switch 52/32/24 (L368), icons 18/24/24 (L412), states 8/12/38 (L355,
    L418), focus 2/2 (L337), and the whole type scale (L64-122 equals the mode).
- **Bloom** (`bloom/DESIGN.md`; Theme B Bloom is still the Tonal seed, L457, L464-469):
  - **Fonts.** Funnel Sans for UI text, Funnel Display for display, values and heads (L293-296,
    L477, L481-482).
  - **Type.** Title 92/96 at −4%, values 60/64 at −3%, notch value 48/52, section 40/48, card title
    22/28, controls and buttons 16/21 (Medium only on hero labels), body 15/20, small 13/17,
    caption and field labels 12/16, tracking 0 on UI text (L67-112, L294-301).
  - **Radius.** Capsules 28, widgets 32, chips 15, toggle disc full (L113-122, L333-336).
  - **Sizes.**
    - The toggle disc replaces both checkbox and switch: 28px with a 12px check (L138, L394-395).
      The base Switch becomes a 28px disc; `Bloom/Switch` draws the real disc.
    - Icons 14 (in 48 discs) to 20 (L381-382, L425).
    - Avatars 40–48 (L426).
  - **Table.** 84px r28 rows, 6px gaps, no rules or header (L129-131, L389-392).
  - **Card and KPI.** No stroke (L326). KPI widgets: 24 padding, 16 gaps (L125-127, L383).
  - **Shadow.** Flat (L321, L326). The selection bar is 0 12 32 −8 (L329); spread cannot bind, so
    `Bloom/Action bar` draws −8.
  - **Not drawn:** tabs, focus, states (L431, L451). Those stay on the seed.
- **Cupertino** (`cupertino/DESIGN.md`; Theme B Cupertino is the Glass seed, which DESIGN.md
  documents as Cupertino's own values, L6-7, L308):
  - **Tabs.** Segmented control: track r9 with a 2px inset, segments r7 (L181-193, L378).
  - **Table.** Rows r12, 8px side padding; the list insets rows by 7px per side (L327-334, L381).
    The 38 header has no fill and no rule (frame `30:219`).
  - **KPI.** 12 gaps, 16 padding (L201-206, L324, L383). Widgets have a 2px sparkline 28 tall, so
    `deco/sparkline` is true (L383).
  - **Nav.** Sidebar items r9 (L195-200, L387).
  - **Top bar.** No toolbar strip (L388). `frame/inset` is 16 for the sidebar floating at x16/y16
    (L320).
  - **Shadow.** Content cards have no shadow (L348). The vibrancy plane is 0 10 28 (L349). The
    capsules' 0 4 14 needs a blur, which `shadow/control/*` lacks, so it stays at 0 and
    `Cupertino/Button` draws it.
  - **Avatar.** 28 in rows, 32 for the profile (L424-425).
  - **Already correct:** radii 999/10/22 (L364-367), switch 51/31/27 (L380), checkbox 20 (L379),
    focus 2/2 (L438), type (L308-311 = Glass).
- **Liquid** (`liquid/DESIGN.md`; Theme B Liquid holds Cupertino's Glass scale, L495):
  - **Type.** Hero and KPI 40/48 Bold −1.5%, platter values 26/32, sheet title 22/28, window title
    15/18 Semi Bold, body 13/17 −0.4%, helper 12/16 +0.3%, captions 11/14 Semi Bold (+0.3% title
    case, +2% uppercase labels) (L78-148, L341-350). `type/strong` is 13/17 Medium, because
    "actions are Medium" (L349-350). Semi Bold selection labels are drawn in the style sets; this
    also keeps `type/mono-strong/style` on an existing Geist Mono face.
  - **Radius.** Fields 7 (L151). `radius/card` is 14, the platter: the content card, L155. The
    floats (sheet, bar) are r22 and are drawn in the style sets (L390-393).
  - **Switch.** 46×28 with a 24px knob (L279-290, L412).
  - **Icons.** 17 nav, 16 toolbar (L444-445).
  - **Avatar.** 22 in the table, 28 for the account (L446-447).
  - **Tabs.** Pill track with a 2px inset, pill thumb (L222-234, L403).
  - **Table.** Rows 40 r8, zebra, no row rules; header rule black 8% (L235-251, L404).
  - **KPI.** Platters: 12 gaps, 14/16 padding, no stroke (L207-214, L324, L405).
  - **Nav.** Items r10 (L178-184, L408).
  - **Shadow.** Content has no shadow (L386); the float stays at 0 16 40 (L379).
  - **Already correct:** focus offset 0 (L410, L430).
- **Fluent** (`fluent/DESIGN.md`):
  - **Badge.** Radius 4 (L405-408, L424).
  - **Shadow.** Cards are flat; only the window casts a shadow (L272-273, L393, L438). Flyout
    `shadow16` 0 8 16 is already the overlay (L397).
  - **Focus.** WinUI focus visual: 2px outer plus 1px inner, "offset 3" (L502). The offset is
    code-only (spec §4.4).
  - **Icons.** 12 chevrons, 16 commands, 20 nav (L463-465).
  - **Type tracking.** Title Large −0.5, Title −0.5, Subtitle −0.2 (L100-120, L364-367). KPI
    values use Title (L368).
  - **Tabs.** SelectorBar has no track or box (L422).
  - **Table.** ListView rows r4, no row dividers, no header rule (L423; render and window `155:746`).
  - **KPI.** 16 padding, 12 gaps (L382-383, L425).
  - **Nav.** 4px margin (L378).
  - **Top bar.** TitleBar on Mica, no rule (L376-377).
  - **Already correct:** radii 4/4/8 (L405-411), switch 40/20/12 (L410), checkbox 20 (L420),
    states, `border/width` 1.
- **Brutal** (`brutal/DESIGN.md`):
  - **Tabs.** A joined row with gap −2 and a 2px border on every item (L376-377, L389).
    Item padding is 16, measured on kit `33:76` and the render; DESIGN.md gives none.
  - **KPI.** Tile gap 20 (L335).
  - **Nav.** Items r6 (L394).
  - **Avatar.** r6, 34px (L371, L434).
  - **Shadow.** Card Slab L is 6/6/0 (L360); control Slab M 4/4/0 is already right (L359).
  - **Icons.** 16–18 (L432-433).
  - **Type.** Button labels Bold −0.3 (L314); Theme `type/strong` was Medium. Display is
    Regular, not Bold: "Display and title are Space Grotesk Regular" (L427).
  - **Deco.** 12 ink bars in every KPI tile (L335, L392), so `deco/blockbars` is true.
  - **Already correct:** `border/width` 2 (L374), radii 8/8/12/999 and checkbox 4 (L371-373),
    checkbox 22 and switch 52/28 (L182-193, L387-388), type title, kpi and label (L309-317).
    The switch thumb is 18, measured on kit `33:58` and the render; DESIGN.md gives no thumb
    size, and the mode's 22 came from the spec's interim.
- **Filigrane** (`filigrane/DESIGN.md`):
  - **Tabs.** Underline tabs: gap 28, 2px `fg` underline (L299-300, L345).
  - **Card.** Panel top rules only (L249-251).
  - **KPI.** "In numbers" grid: hairline cells, no gap, inner 16 (L297-298; render: the second
    column starts 16px after the divider).
  - **Avatar.** The only circle is the 32px avatar (L327-328, L390).
  - **Icon stroke.** 1.5 (L283, L389).
  - **Type.** Display Light, never ExtraLight (L285-286). Heading 24/32 (L80-86, L270). Amounts
    15/24 Medium (L96-102). Label 13/18 (L110-116, L275).
  - **Already correct:** radii 0 (L327), shadows 0 (L314), focus 2/3 (L319-321), checkbox 16
    (L344).
- **Terminal** (`terminal/DESIGN.md`; Theme B Terminal is the Signal seed, L389):
  - **Fonts.** Geist Mono only; "no proportional type" (L237-244). `font/sans` was Geist.
  - **Type.** One 14/24 scale with weight hierarchy: grid 14/24, pane title 14/20 Medium, legend
    12/20, keycap 12/16 Medium, tracking 0 (L54-72, L227-242).
  - **Radius.** Only panes are rounded, at 8; keys, tabs, keycaps and the selection bar are square
    (L286-289).
  - **Tabs.** Tab line gap 4, selected 2px `ring` underline (L250-252, L300).
  - **Table.** 24px lines, one rule under the header (L261-262).
  - **KPI.** Metrics are unboxed lines inside one pane (L263-264, L303). The trend bars are block
    characters, so `deco/blockbars` is true (L303).
- **Pixel** (`pixel/DESIGN.md`):
  - **Border width.** 2px on interactive edges, 1px on panel frames and table rules (L333). So
    `border/width` is 2, and the panel, table and KPI widths are pinned to 1.
  - **Control shadow.** A 4px lip: `0 4px 0` (L316), so `shadow/control/y` is 4.
  - **Tabs.** No box; the raised face is drawn in `Pixel/Tab` (L341).
  - **KPI.** One framed strip split by rules: gap 0, joined borders as Ledger (L296-297).
  - **Top bar.** The 10px band stripe replaces a rule (L291-292).
  - **Avatar.** Identicons 28, 32 in the top bar (L380).
  - **Type.** Pixelify Sans only at 24 and 40, so display is 40/48, not 64/64 (L94, L285).
  - **Deco.** The KPI block chart (L347), so `deco/blockbars` is true.
  - **Already correct:** radii 0 (L330), checkbox 20, switch 44/24/16 (L215-228, L343-344), type
    (L279-284).
- **Tactile** (`tactile/DESIGN.md`):
  - **Tabs.** The status filter is a bank of separate keys: gap 12, no track, padding 0/20, in-hue
    border (L344, L369, L428, L449).
  - **Table.** Order tiles: 72px r20, 12 apart, no rules (L344, L450).
  - **KPI.** Readouts are wells in a plateau, 24 apart, no stroke (L340-342, L451).
  - **Top bar.** None; the sidebar is unboxed (L335-336).
  - **Shadow.** The plateau's shade half: `18px 18px 44px` (L388). The highlight half needs a
    second effect slot, so `Tactile/*` style sets draw both halves. Dialogs would be plateaus (L457),
    so the overlay is 18/44.
  - **Icons.** 18–20 (L491-492).
  - **Avatar.** Discs 40, 44, 48 (L494).
  - **Fonts.** Geist Mono for IDs and codes (L319-322).
  - **Type.** Title 32/40 Regular, KPI 32/38 Light, heading 20/28 Regular, body 16/22, caption
    13/18 as the smallest (L87-108, L309-330).
    - DESIGN's "label" role (16 SemiBold: keys, names, selected nav) maps to `type/strong`, which
      is 16/22 SemiBold.
    - `type/label` serves NetScript's small labels (eyebrows, badges, initials), so it takes the
      13/18 minimum (L325).
    - The mode's `type/*` are "older values that do not match" (L327-330, L539).
  - **Already correct:** radii 999/14/24, checkbox 8 (L422-426, L555), checkbox 28 and switch
    60/34/28 (L218-228, L446), focus 2/2 (L425-426).

### 1.2 Fixed control heights (no variable; for the style sets)

Density stays the only height axis. Each theme's documented fixed heights are listed for the style
builders, who draw them literally or bind the nearest Density step when it matches.

| Theme | Button | Field | Tabs / segments | Table row | Nav item | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Tonal | 40 (connected 48, chips 32, FAB 64) | 56 | 48 | 72 | rail 80×60 | L133-145 |
| Bloom | 52 (pills 40–48) | 56 | — | 84 | — | L132-139 |
| Cupertino | 36 | search 32, grouped row 44 | 32 / 28 | 52 | 32 | L139-149, L335-337 |
| Liquid | 36 (sheet actions 40, bar actions 32) | 28 | 34 / 30 | 40 | 32 | L159-168, L400-412 |
| Fluent | 32 | 32 | 40 | 48 | 36 | L140-152 |
| Brutal | 44 (toolbar 40) | 44 | 40 | 60 | 28 / 32 selected | L330-339, L384-396 |
| Filigrane | 40 | 37 (focus 38) | 36–38 | 52 | 34 | L136-197 |
| Terminal | keys 32–34 | prompt 50 (two 24px lines) | 26 | 24 | tab line 43 | L98-175 |
| Pixel | 40 (36 face + 4 lip) | 40 | 32 | 56 | — | L133-136, L340 |
| Tactile | 44–48 | 52 | keys 48 | tiles 72 | 52 | L136-228, L348 |


## 2. Colour roles that carry character (Theme `l`/`d` values)

**How Scheme roles reach a theme.** Each Scheme role aliases `Theme set/<group>/l/<rest>` in Light
and `.../d/<rest>` in Dark. So a theme's colour character is set by the Theme (or Theme B)
`l`/`d` intermediates in that theme's mode.

**What the tables below change.**

- **Structure-twin colours** (`card/*`, `table/*`, `tabs/*`, `nav/active`, `topbar/*`, `kpi/*`),
  which every non-Studio mode had as generic defaults.
- **Core-role intermediates of the seeded Theme B modes** (Bloom from Tonal, Liquid from Glass),
  whose crafted frames do not read Theme B.
- **Fluent's two documented pending aliases** (`card`, `input-border` → `fluent/*`; L344-353).
  The Fluent frames read only `radius/*` from Theme.

**Value format.**

- Each cell shows `current → new`, resolved to hex.
- Write the new value as a literal hex, or as a Primitives alias when one holds exactly that hex.
- Never alias a Scheme role from a Theme `l`/`d` variable. Scheme aliases Theme set, so the chain
  would loop through collections. The source column names the language role whose value is copied.

**Change counts** (`l` and `d` cells that change):

| Theme | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cells | 26 | 43 | 14 | 33 | 24 | 14 | 25 | 26 | 21 | 24 |

The faithful modes copy their sibling: macOS 27 = Liquid, Apple Classic = Cupertino, Fluent 2 Web
= Fluent.

### 2.1 Fills that stay in the style sets (contrast or dark rule)

These theme fills are **not** written into a shared role. The base component would put the wrong
ink on them, and the dark scheme would then fail contrast or read inverted:

| Theme | Fill | Why it stays out of the base | Drawn by |
| --- | --- | --- | --- |
| Tonal | Selected connected item and hero on `primary` `#6550b9` / `#6e56cf` | Base Tab binds `text/fg`; Tonal needs `primary-fg` | `Tonal/Tab`, `Tonal/Toggle group` |
| Brutal | Ink table header, ink selected tab; `block/*` KPI tiles | Base binds `text/muted` / `text/fg`; Brutal needs `ink/fg` / `block-fg` (dark `text/fg` `#eeeeec` on `#ffc53d` fails) | `Brutal/Tab`, Data display style sets |
| Pixel | Amber selected tab and current page key | Base binds `text/fg`; dark `#eeeeec` on `#faab35` fails; Pixel uses `primary-fg` `#12100e` | `Pixel/Tab`, `Pixel/Page key` |
| Cupertino, Liquid | Full-row `primary` selection | `surface/selected` also feeds toggles, menus and calendar ranges; text would stay `text/fg` | `Cupertino/*`, `Liquid/*` row and list styles |
| Terminal | Inverse lime selection bar | as above | `Terminal/*` |
| Filigrane | Ink primary button (`action/primary-*`) | `primary` must stay tomato for the margin bar the crafted frames bind | `Filigrane/Button` binds `action/primary-*` |

### 2.2 New roles

- **The base library needs none.** The structure twins cover it.
- **The style sets bind their own language roles**, which already exist: `bloom/*`, `cupertino/*`,
  `liquid/*`, `fluent/*`, `pixel/*`, `tactile/*`, `block/*`, `bevel/*` and `material/*`. GUIDELINES
  §2.4 allows a language's own components to read its pack.
- **Pending names, owned by code (#2414).** Each case below is a documented exception, bound as the
  crafted frames bind it today. The briefs say where:
  - **Pixel bands.** `pixel/band/1…5`. Today they are the primitives `color/band/*`; Pixel map.
  - **Terminal dark Save key.** A scheme-aware key role. Today it binds `gray/d/3`, `gray/d/10` and
    `lime/d/11`; Terminal map.
  - **Liquid literals.**
    - hairlines (black 6–18%, white 10–28%);
    - on-accent rims;
    - the pink avatar hue;
    - black avatar initials.
  - **Status families are not theme-following.** `success/*`, `warning/*`, `destructive/*` and
    `info/*` alias Primitives directly in Scheme. Bloom's `bloom/error` and Tonal's
    `destructive-text` therefore reach only the style sets.

### 2.3 Per-theme colour tables

#### Tonal

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `table/{l,d}/head` | `#f2eff3` → **`#00000000`** | `#232225` → **`#00000000`** | L370 + renders-r7/tonal--light.png: column labels sit on `bg`, no header fill |
| `table/{l,d}/row-bg` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | L370 segmented rows on `container` (L14-15) |
| `table/{l,d}/zebra` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | L370: every row is `container`; no zebra |
| `table/{l,d}/hover` | `#f2eff3` → **`#eae7ec`** | `#232225` → **`#2b292d`** | L328 tonal elevation: a raised state takes the next container step (`container-high`, L16-17) |
| `tabs/{l,d}/track` | `#f2eff3` → **`#00000000`** | `#232225` → **`#00000000`** | L357-358 connected group: no track |
| `tabs/{l,d}/sel-bg` | `#faf9fb` → **`#ebe4ff`** | `#1a191b` → **`#33255b`** | L296-298 accent policy: `primary-container` marks selection (L40-41). The `primary` pill of the connected group needs `primary-fg` ink, which base Tab does not bind; the pill is in Tonal/Tab |
| `tabs/{l,d}/sel-border` | `#dbd8e0` → **`#00000000`** | `#3c393f` → **`#00000000`** | L389 no borders |
| `nav/{l,d}/active` | `#f4f0fe` → **`#ebe4ff`** | `#291f43` → **`#33255b`** | L378 rail indicator in `primary-container` |
| `kpi/{l,d}/bg-1` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | L243-248, L374-376 secondary KPIs on `container` |
| `kpi/{l,d}/bg-2` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#faf9fb` → **`#f2eff3`** | `#1a191b` → **`#232225`** | as bg-1 |
| `card/{l,d}/border` | `#dbd8e0` → **`#00000000`** | `#3c393f` → **`#00000000`** | L272-276, L389: no card borders (widths are 0 too) |

#### Bloom

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `surface/{l,d}/canvas` | `#fdfcfd` → **`#faf8f4`** | `#121113` → **`#0f0e0d`** | L485-486 core map `bg` → `bloom-canvas` (L22-23) |
| `surface/{l,d}/paper` | `#faf9fb` → **`#ffffff`** | `#1a191b` → **`#191817`** | L486 `card` → `bloom-surface` (L24-25) |
| `surface/{l,d}/raised` | `#f2eff3` → **`#ffffff`** | `#232225` → **`#191817`** | L328 the details sheet is `bloom-surface` |
| `surface/{l,d}/container-high` | `#eae7ec` → **`#f2efe9`** | `#2b292d` → **`#22201e`** | L486 `container-high` → `bloom-surface-high` |
| `gray/{l,d}/12` | `#211f26` → **`#151413`** | `#eeeef0` → **`#f2efea`** | L487 `fg` → `bloom-fg` (drives `text/fg`, `ink`, `surface/inverse`) |
| `gray/{l,d}/11` | `#605e67` → **`#655f55`** | `#bab7c0` → **`#a39e95`** | L487 `muted-fg` → `bloom-muted` |
| `border/{l,d}/default` | `#dbd8e0` → **`#cfc9bf`** | `#3c393f` → **`#4a4640`** | L488 `border` → `bloom-outline` |
| `border/{l,d}/subtle` | `#eae7ec` → **`#e7e2d9`** | `#2b292d` → **`#2c2a27`** | L488 `border` → `bloom-line` |
| `input/{l,d}` | `#84828e` → **`#8a8377`** | `#7c7a85` → **`#8a8377`** | L488 `input-border` → `bloom-field-edge` (L34-35, L396) |
| `gray/{l,d}/10` | `#84828e` → **`#8a8377`** | `#7c7a85` → **`#8a8377`** | L489 `border-control` → `bloom-control-outline` (dark `border/control` reads `gray/d/10`; light reads `ink/l` = `gray/l/12` #151413) |
| `accent/{l,d}/solid` | `#6550b9` → **`#151413`** | `#6e56cf` → **`#3b3631`** | L490 `primary` → `bloom-hero` (L40-41) |
| `accent/{l,d}/solid-hover` | `#6550b9` → **`#151413`** | `#7d66d9` → **`#3b3631`** | hover not drawn (L431); keep the fill |
| `accent/{l,d}/contrast` | `#ffffff` (already) | unchanged | L490 `primary-fg` → `bloom-on-hero` (light) |
| `accent/{l,d}/solid-fg` | unchanged | `#ffffff` → **`#f7e7cb`** | L490 `primary-fg` → `bloom-on-hero` (dark, L43) |
| `selected/{l,d}` | `#f4f0fe` → **`#e4dcfa`** | `#291f43` → **`#2a2240`** | L390 selected row = lavender (L52-53) |
| `kpi/{l,d}/bg-1` | `#faf9fb` → **`#fbe6c6`** | `#1a191b` → **`#3a2c1a`** | L277-279, L310 revenue widget peach |
| `kpi/{l,d}/bg-2` | `#faf9fb` → **`#dcebe0`** | `#1a191b` → **`#1c2b22`** | L310 orders widget mint |
| `kpi/{l,d}/bg-3` | `#faf9fb` → **`#d9e9ee`** | `#1a191b` → **`#18292e`** | L278 category pastel sky (the specimen's third slot is the notched ink stack, drawn in Bloom/* only) |
| `kpi/{l,d}/bg-4` | `#faf9fb` → **`#e4dcfa`** | `#1a191b` → **`#2a2240`** | L311 needs-you widget lavender |
| `card/{l,d}/border` | `#dbd8e0` → **`#00000000`** | `#3c393f` → **`#00000000`** | L326 widgets: no stroke |
| `table/{l,d}/row-bg` | `#faf9fb` → **`#00000000`** | `#1a191b` → **`#00000000`** | L389 rows sit on paper; only the selected row fills |
| `table/{l,d}/head` | `#f2eff3` → **`#00000000`** | `#232225` → **`#00000000`** | L389 no header row |
| `shadow/{l,d}/color` | `#0f0f1414` → **`#14120d38`** | `#00000080` (already) | L329 selection bar shadow |
| `switch/{l,d}/thumb` | `#ffffff` (already) | `#ffffff` → **`#f7e7cb`** | L394 toggle disc check in `bloom-on-hero` |

#### Cupertino

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `card/{l,d}/border` | `#d9d9e0` → **`#ffffffb8`** | `#363a3f` → **`#ffffff21`** | L348 content cards: 1px `material-stroke` rim (L63-64) |
| `kpi/{l,d}/border` | `#d9d9e0` → **`#ffffffb8`** | `#363a3f` → **`#ffffff21`** | L348, L383 KPI widgets are content cards |
| `tabs/{l,d}/track` | `#f0f0f3` → **`#7575801f`** | `#212225` → **`#7575803d`** | L181-186, L378 segmented track `material-track` |
| `tabs/{l,d}/sel-bg` | `#f9f9fb` → **`#ffffffd1`** | `#18191b` → **`#2b2e36c7`** | L187-193 thumb `material-fill-strong` |
| `tabs/{l,d}/sel-border` | `#d9d9e0` → **`#00000000`** | `#363a3f` → **`#00000000`** | L378 the thumb has no stroke (two soft shadows instead, drawn in Cupertino/Tab) |
| `nav/{l,d}/active` | `#e6f4fe` → **`#7575801f`** | `#0d2847` → **`#7575803d`** | L195-200, L387 selected sidebar item `material-track` |
| `table/{l,d}/head` | `#f0f0f3` → **`#00000000`** | `#212225` → **`#00000000`** | Frame `30:219` (orders list): the 38 header has no fill and no rule |

#### Liquid

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `accent/{l,d}/solid` | `#0d74ce` → **`#0063e1`** | `#0090ff` → **`#0058d0`** | L325, L33-34 `liquid-primary-default` fills selection and prominent actions |
| `accent/{l,d}/solid-hover` | `#0d6fc6` → **`#0058d0`** | `#3b9eff` → **`#004fbd`** | Scheme `liquid/primary/hover` |
| `accent/{l,d}/contrast` | `#ffffff` (already) | unchanged | L35 white on primary |
| `accent/{l,d}/solid-fg` | unchanged | `#111113` → **`#ffffff`** | L36, L424 white text on `#0058d0` (6.35:1); the Glass seed has `#111113` |
| `accent/{l,d}/11` | `#113264` → **`#0066cc`** | `#70b8ff` → **`#409cff`** | L37-38 `liquid-primary-text` |
| `ring/{l,d}` | `#0d74ce` → **`#007aff`** | `#0090ff` → **`#0a84ff`** | L61-62, L410 `liquid-border-ring` |
| `input/{l,d}` | `#80838d` → **`#86868b`** | `#777b84` → **`#8e8e93`** | L63-64, L428 `liquid-border-input` |
| `switch/{l,d}/thumb` | `#ffffff` (already) | `#111113` → **`#ffffff`** | L412 24px white knob in both schemes (no pale slab: it is a knob, not a surface) |
| `tabs/{l,d}/sel-bg` | `#f9f9fb` → **`#ffffffd1`** | `#18191b` → **`#2b2e36c7`** | L228-234 thumb `material-fill-strong` |
| `nav/{l,d}/active` | `#e6f4fe` → **`#00000012`** | `#0d2847` → **`#ffffff1a`** | L327, L408 grey `liquid-sidebar-selection`, never blue |
| `kpi/{l,d}/bg-1` | `#f9f9fb` → **`#f0f0f3`** | `#18191b` → **`#212225`** | L207-214, L405 platters on `muted` |
| `kpi/{l,d}/bg-2` | `#f9f9fb` → **`#f0f0f3`** | `#18191b` → **`#212225`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#f9f9fb` → **`#f0f0f3`** | `#18191b` → **`#212225`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#f9f9fb` → **`#f0f0f3`** | `#18191b` → **`#212225`** | as bg-1 |
| `table/{l,d}/zebra` | `#f9f9fb` → **`#f0f0f3`** | `#18191b` → **`#212225`** | L235-241, L404 zebra on even rows `muted` |
| `table/{l,d}/head` | `#f0f0f3` → **`#00000000`** | `#212225` → **`#00000000`** | L404 header has no fill |
| `topbar/{l,d}/bg` | `#f0f0f3` → **`#ffffffd9`** | `#111113` → **`#1e1e1ed9`** | L377 scroll edge `liquid-toolbar-scroll-edge` |
| `topbar/{l,d}/rule` | `#e8e8ec` → **`#0000000f`** | `#272a2d` → **`#00000099`** | L377 `liquid-toolbar-hairline` |
| `shadow/{l,d}/color` | `#0d0f1f1f` → **`#0000002e`** | unchanged | L379 float glass `0 16px 40px #0000002e`; dark keeps the seed (not specified) |

#### Fluent

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `surface/{l,d}/paper` | `#ffffff` → **`#ffffffb3`** | `#191919` → **`#ffffff0d`** | L350 pending alias `card` → `fluent/card/default` (L74-75) |
| `input/{l,d}` | `#838383` → **`#00000072`** | `#7b7b7b` → **`#ffffff8b`** | L353 pending alias `input-border` → `fluent/stroke/control-strong` |
| `card/{l,d}/border` | `#d9d9d9` → **`#0000000f`** | `#3a3a3a` → **`#00000019`** | L393 cards: 1px `fluent-stroke-card` |
| `kpi/{l,d}/border` | `#d9d9d9` → **`#0000000f`** | `#3a3a3a` → **`#00000019`** | L393, L425 KPI cards |
| `tabs/{l,d}/track` | `#f0f0f0` → **`#00000000`** | `#222222` → **`#00000000`** | L422 SelectorBar has no track |
| `tabs/{l,d}/sel-bg` | `#ffffff` → **`#00000000`** | `#191919` → **`#00000000`** | L422 selected = `text-primary` + 16×3 pill, no fill |
| `tabs/{l,d}/sel-border` | `#d9d9d9` → **`#00000000`** | `#3a3a3a` → **`#00000000`** | L422 no box |
| `nav/{l,d}/active` | `#e6f4fe` → **`#00000009`** | `#0d2847` → **`#ffffff0f`** | L196-202, L427 selected = `subtle-secondary` |
| `table/{l,d}/hover` | `#f0f0f0` → **`#00000009`** | `#222222` → **`#ffffff0f`** | L423 hover and selected = `subtle-secondary` |
| `table/{l,d}/head` | `#f0f0f0` → **`#00000000`** | `#222222` → **`#00000000`** | L423 ListView header on the card |
| `table/{l,d}/row-bg` | `#ffffff` → **`#00000000`** | `#191919` → **`#00000000`** | L423 rows on the card |
| `topbar/{l,d}/bg` | `#f9f9f9` → **`#00000000`** | `#111111` → **`#00000000`** | L376-377 TitleBar sits on Mica |

#### Brutal

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `card/{l,d}/border` | `#dad9d6` → **`#000000`** | `#3b3a37` → **`#000000`** | L296-297, L360, L412: decorative panel outlines stay ink in both schemes |
| `kpi/{l,d}/border` | `#dad9d6` → **`#000000`** | `#3b3a37` → **`#000000`** | L392 KPI tiles: ink outline, Slab L |
| `table/{l,d}/row-rule` | `#e9e8e6` → **`#000000`** | `#2a2a28` → **`#000000`** | L338, L390 2px ink bottom rule |
| `table/{l,d}/head-rule` | `#dad9d6` → **`#000000`** | `#3b3a37` → **`#000000`** | L390 header is ink-filled; its rule merges |
| `topbar/{l,d}/rule` | `#e9e8e6` → **`#000000`** | `#2a2a28` → **`#000000`** | L330 2px ink bottom rule |
| `tabs/{l,d}/idle-border` | `#00000000` → **`#000000`** | `#00000000` → **`#7c7b74`** | L389, L410-411 tabs are controls: `border/control` (ink light, sand d10 dark) |
| `tabs/{l,d}/sel-border` | `#dad9d6` → **`#000000`** | `#3b3a37` → **`#7c7b74`** | as idle |

#### Filigrane

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `tabs/{l,d}/track` | `#f1f0ef` → **`#00000000`** | `#222221` → **`#00000000`** | L345 no track |
| `tabs/{l,d}/sel-bg` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | L345 no fill |
| `tabs/{l,d}/sel-border` | `#dad9d6` → **`#21201c`** | `#62605b` → **`#eeeeec`** | L345 2px `fg` underline |
| `table/{l,d}/head` | `#f1f0ef` → **`#00000000`** | `#222221` → **`#00000000`** | L246-248 regions never use fills |
| `table/{l,d}/row-bg` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | L346 no fill |
| `table/{l,d}/zebra` | `#f9f9f8` → **`#00000000`** | `#191918` → **`#00000000`** | L397 never a row fill |
| `kpi/{l,d}/bg-1` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | L297-298 "In numbers" grid: hairlines, no fills |
| `kpi/{l,d}/bg-2` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#fdfdfc` → **`#00000000`** | `#191918` → **`#00000000`** | as bg-1 |
| `kpi/{l,d}/border` | `#dad9d6` → **`#bcbbb5`** | `#62605b` (already) | L250-251 `border-strong` draws the stat grid |
| `nav/{l,d}/active` | `#feebe7` → **`#00000000`** | `#391714` → **`#00000000`** | L351 selected nav = `fg` + underline, no fill |
| `card/{l,d}/footer` | `#f1f0ef` → **`#00000000`** | `#222221` → **`#00000000`** | L383 no tinted panels |

#### Terminal

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `card/{l,d}/border` | `#d9d9d9` → **`#bbbbbb`** | `#3a3a3a` → **`#606060`** | L277 inactive pane: 1px `border-strong` |
| `tabs/{l,d}/track` | `#f0f0f0` → **`#00000000`** | `#222222` → **`#00000000`** | L250-252 tab line has no track |
| `tabs/{l,d}/sel-bg` | `#ffffff` → **`#f0f0f0`** | `#111111` → **`#222222`** | L143-154, L300 selected tab = `hover` fill |
| `tabs/{l,d}/sel-border` | `#d9d9d9` → **`#5c7c2f`** | `#3a3a3a` → **`#bdee63`** | L300 2px `ring` underline |
| `nav/{l,d}/active` | `#eef6d6` → **`#f0f0f0`** | `#1f2917` → **`#222222`** | L300 the tab line is the nav |
| `table/{l,d}/head` | `#f0f0f0` → **`#00000000`** | `#222222` → **`#00000000`** | L261-262 header row in `muted-fg`, no fill |
| `table/{l,d}/row-bg` | `#ffffff` → **`#fcfcfc`** | `#111111` → **`#000000`** | L275 pane interiors are `bg` |
| `kpi/{l,d}/bg-1` | `#ffffff` → **`#fcfcfc`** | `#111111` → **`#000000`** | L303 metrics live inside a pane (`bg`) |
| `kpi/{l,d}/bg-2` | `#ffffff` → **`#fcfcfc`** | `#111111` → **`#000000`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#ffffff` → **`#fcfcfc`** | `#111111` → **`#000000`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#ffffff` → **`#fcfcfc`** | `#111111` → **`#000000`** | as bg-1 |
| `topbar/{l,d}/bg` | `#fcfcfc` → **`#f9f9f9`** | `#000000` → **`#191919`** | L276 status line on `surface` |
| `topbar/{l,d}/rule` | `#e8e8e8` → **`#d9d9d9`** | `#2a2a2a` → **`#3a3a3a`** | L251 1px `border` rule under the tab line |

#### Pixel

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `card/{l,d}/border` | `#dad9d6` → **`#21201c`** | `#3b3a37` → **`#494844`** | L260, L315 panels: 1px `frame-ink` |
| `kpi/{l,d}/border` | `#dad9d6` → **`#21201c`** | `#3b3a37` → **`#494844`** | L296-297 KPI strip framed in `frame-ink` |
| `table/{l,d}/head-rule` | `#dad9d6` → **`#21201c`** | `#3b3a37` → **`#494844`** | L299 header row with a `frame-ink` rule |
| `table/{l,d}/row-rule` | `#e9e8e6` → **`#dad9d6`** | `#2a2a28` → **`#3b3a37`** | L299 rows with `border` dividers |
| `table/{l,d}/row-bg` | `#fcfaf6` (already) | `#1b1916` → **`#282623`** | L258-259 panels on `surface-raised` |
| `kpi/{l,d}/bg-1` | `#fcfaf6` (already) | `#1b1916` → **`#282623`** | L203-209 KPI panel `surface-raised` |
| `kpi/{l,d}/bg-2` | `#fcfaf6` (already) | `#1b1916` → **`#282623`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#fcfaf6` (already) | `#1b1916` → **`#282623`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#fcfaf6` (already) | `#1b1916` → **`#282623`** | as bg-1 |
| `tabs/{l,d}/track` | `#f1f0ef` → **`#00000000`** | `#222221` → **`#00000000`** | L341 no track |
| `nav/{l,d}/active` | `#ffeacb` → **`#00000000`** | `#31200b` → **`#00000000`** | L349 active = Bold `fg` + 4px banded indicator, no fill |
| `topbar/{l,d}/bg` | `#f4efe6` → **`#fcfaf6`** | `#12100e` → **`#282623`** | L291 top bar on `surface-raised` |
| `effect/{l,d}/control-shadow` | `#00000000` → **`#e8e0d3`** | `#00000000` → **`#12100e`** | L316 outline-key lip `pixel-lip-secondary` (with `shadow/control/y` 4). The amber key's band-5 lip is drawn in Pixel/Button |

#### Tactile

| Theme `l`/`d` variable | Light (now → new) | Dark (now → new) | Source (DESIGN.md line or frame) |
| --- | --- | --- | --- |
| `card/{l,d}/border` | `#d9d9e0` → **`#d1d9e6`** | `#363a3f` → **`#24272b`** | L427-429 in-hue border `tactile/edge/border` |
| `kpi/{l,d}/bg-1` | `#e0e5ec` → **`#ccd4df`** | `#2a2d32` → **`#1b1d20`** | L192-198, L451 KPI readouts are wells (`concave/start`) |
| `kpi/{l,d}/bg-2` | `#e0e5ec` → **`#ccd4df`** | `#2a2d32` → **`#1b1d20`** | as bg-1 |
| `kpi/{l,d}/bg-3` | `#e0e5ec` → **`#ccd4df`** | `#2a2d32` → **`#1b1d20`** | as bg-1 |
| `kpi/{l,d}/bg-4` | `#e0e5ec` → **`#ccd4df`** | `#2a2d32` → **`#1b1d20`** | as bg-1 |
| `table/{l,d}/row-bg` | `#e0e5ec` → **`#00000000`** | `#2a2d32` → **`#00000000`** | L450 unselected tiles are printed (H0) |
| `tabs/{l,d}/track` | `#f0f0f3` → **`#00000000`** | `#212225` → **`#00000000`** | L449 a bank of keys, not a track |
| `tabs/{l,d}/sel-bg` | `#e0e5ec` → **`#ccd4df`** | `#2a2d32` → **`#1b1d20`** | L449 active key sinks (`concave/start`) |
| `tabs/{l,d}/idle-border` | `#00000000` → **`#d1d9e6`** | `#00000000` → **`#24272b`** | L428 in-hue border on keys |
| `tabs/{l,d}/sel-border` | `#d9d9e0` → **`#d1d9e6`** | `#363a3f` → **`#24272b`** | L428 in-hue border on pressed elements |
| `nav/{l,d}/active` | `#e6f4fe` → **`#ccd4df`** | `#0d2847` → **`#1b1d20`** | L211-217, L454 selected nav = pressed-m |
| `shadow/{l,d}/color` | `#1a171229` → **`#a3b1c699`** | `#0000008c` → **`#1c1e21`** | L288, L402 `tactile/shadow/shade` (the mode holds superseded `#1a171229` / `#0000008c`) |

### 2.4 `card/bg` (added in B6, 2026-10-28)

The B6 Data display build added `card/bg`:

- a Theme `card/{l,d}/bg` pair, mirrored in Theme B and Theme set;
- a Scheme `card/bg` role.

It is the card fill twin; Utility has no fill. The B6 export is not in the 15:03 variables export,
so the current non-Studio value is not shown. The B6 default was most likely `surface/paper`; if a
cell already equals the target, skip it.

| Theme | Light | Dark | Source |
| --- | --- | --- | --- |
| Tonal | `#f2eff3` | `#232225` | L333 cards on `container`, no stroke |
| Bloom | `#ffffff` | `#191817` | L486 `card` → `bloom-surface`. Widgets take pastels in `Bloom/Card` |
| Cupertino | `#f9f9fb` | `#18191b` | L348 opaque `card` |
| Liquid | `#f0f0f3` | `#212225` | L405 content platters on `muted` |
| Fluent | `#ffffffb3` | `#ffffff0d` | L393 `fluent-card-default` |
| Brutal | `#ffffff` | `#191918` | L288-291 panels on `card` |
| Filigrane | `#00000000` | `#00000000` | L246-248 no cards; regions are hairlines |
| Terminal | `#fcfcfc` | `#000000` | L275 pane interiors on `bg` |
| Pixel | `#fcfaf6` | `#282623` | L258-259 panels on `surface-raised` |
| Tactile | `#e0e5ec` | `#2a2d32` | L277-279 one material; plateaus are base |

The faithful modes copy their sibling.

## 3. Shape-literal audit (short)

The owner's example: "Pixel have rounded switch it make no sense". The built base sets hard-code
these shapes. I read them with `get_metadata`, and with `component-spec.md` §2 and §4.4 where the
metadata cannot show a radius.

Under the style model, each `<Theme>/<Component>` set draws its own shape, so none of these needs a
variable to look right in the theme strips. The route column says what fixes each one.

| Literal in the base set | Where (node) | Route |
| --- | --- | --- |
| Switch track radius 999 | `Switch` `285:2329`, part `track` (e.g. `285:2211`) | Style sets; optional `radius/pill` |
| Switch thumb is an **ELLIPSE** | `thumb` (e.g. `285:2212`) | Style sets. An ellipse takes no radius: a variable route must first replace it with a frame |
| Radio control radius 999; indicator an 8×8 **ELLIPSE** | `Radio` `284:1828`, `control` `284:1803`, `indicator` `284:1805` | Style sets (Terminal `( )`/`(•)`, Tactile r14 well) |
| Slider track and range: ROUNDED_RECTANGLE, h 4, r 999; thumb r 999 | `Slider` `303:5022` (`303:4933`, `303:4935`, `303:4936`, `303:4939`) | Style sets; optional `radius/pill` |
| Spinner ring and arc are vectors | `Spinner` `252:11837` (`252:11830`, `252:11831`) | Style sets (Pixel stepped blocks, Terminal frame-stepped glyphs) |
| OTP group gap −1, inner corners 0, outer corners as `radius/input` instance overrides | `Input OTP` `301:4490` (group `301:4415`) | Style sets |
| Calendar range corners per position (start, end) and range-middle 0 | `Calendar day` `307:6154` (e.g. `307:6082`) | Style sets |
| Sheet and Drawer handle 36×4 r 999 | `Drawer` `379:1150` (`379:1018`), `Sheet` `379:1004` | Style sets; optional `radius/pill` |
| Tooltip arrow 10×5, Popover arrow tip 16×8 | `381:1030` (`381:958`), `381:937` | Style sets (Terminal and Filigrane draw no arrow) |
| Button group and Toggle group inner corners 0 | `257:839`, `257:528` | Style sets (Brutal gap −2, Tonal inner 8) |
| Nav item count pill | `Nav item` `345:601` | Style sets; optional `radius/pill` |
| Dropzone upload progress (bound rectangles) | `Dropzone` `319:16832`, `state=uploading` `319:16769` | Style sets; optional `radius/pill` |
| Avatar circle in Hover card (D1 stand-in) | `Hover card` `381:1093` | `radius/avatar` (§1) once D1 lands |

**Optional variable, not in the default order.** `radius/pill` (Theme, FLOAT, CORNER_RADIUS,
`var(--ns-radius-pill)`).

- **Values:** 999 everywhere except Pixel, Terminal and Filigrane, which are 0. Studio's value is a
  literal 999, so Studio stays pixel-identical.
- **What it fixes:** the base pills above when a base set renders under one of those three modes
  with no style swap. Data display and Feedback (Progress, Avatar group) are built after this pass,
  so this is where that matters.
- **Cost:** one variable, plus a rebind pass over Switch, Slider, Sheet, Drawer, Nav item and
  Dropzone, including the ellipse-to-frame conversion of the Switch thumb.
- **Recommendation:** skip it now. Add it in the Data display or Feedback step if those base sets
  must render under Pixel, Terminal or Filigrane without a style set. If it is added, it goes in
  `_shared-variables.md` before any builder runs.

## 4. Builder groups and implementation order

### 4.1 Groups

Each builder runs in parallel, owns its theme pages only, and reads only its brief(s).

| Group | Themes | Why together | Pages |
| --- | --- | --- | --- |
| G1 | Tonal + Bloom | Bloom's Theme B mode was seeded from Tonal; both are Material-derived (filled fields, pills, discs) | `16:2`, `102:808` |
| G2 | Cupertino + Liquid | Both come from the `Glass` mode; both are Apple platform styles that must stay distinct (Liquid L440, Cupertino L401-403) | `29:6`, `93:735` |
| G3 | Fluent | WinUI anatomy is self-contained; Fluent 2 Web joins it in the faithful pass (#2443) | `53:2` |
| G4 | Brutal + Pixel | Hard-edge physics: offset slabs and lips that collapse on press, 2px strokes, Space Mono uppercase labels | `33:8`, `64:443` |
| G5 | Filigrane + Terminal | Flat, line-built styles (hairlines, box drawing); both descend from Studio-flavor modes (Atelier, Signal) | `37:6`, `39:2` |
| G6 | Tactile | Neumorphic dual effects are the heaviest build | `60:219` |

### 4.2 Order

1. **Shared variables (one agent, first).** Apply `style-briefs/_shared-variables.md`: §1 values,
   then §2 colours, then verification.
   - Studio frames must show a 0.0000% diff.
   - Crafted frames must show a 0.0000% diff.
   - Themes strips before and after, per category.

   No builder starts before this step is recorded.
2. **Shape variable (optional, default skip).** See §3.
3. **Style sets, six builders in parallel** (G1–G6). Each works category by category in the base
   order: Actions → Forms → Navigation → Overlays.
   - Each category ends with its verification strip on the theme page.
   - Each builder records node ids in its own ledger file,
     `figma-library/style-ledger/<theme>.json`, never in `state.json`. Parallel writers would
     conflict on `state.json`.
4. **Merge and contact sheet (coordinator).**
   - Merge the ledgers into `state.json` → `components` under a `styles` key.
   - Build one contact sheet per category on its base page: Studio plus the 10 styles, Light and
     Dark, at 480px thumbnails. This is the GUIDELINES §4.5 thumbnail test: each row must be
     identifiable without reading its label.

### 4.3 Verification strips (summary; each brief has its own)

| Step | Strip | Expected |
| --- | --- | --- |
| 1 | Existing themes strips (`264:7542`, `289:3256`, `320:17132`, `360:6958`, `390:6219`) re-shot | Studio row identical. In the theme rows: Tonal cards lose borders and shadows; Brutal panels and rules turn ink; Pixel strokes turn 2px with sand lips under buttons; Fluent badges become r4; Cupertino tabs get a material track. Theme set B rows (Cupertino) show the material segmented track |
| 1 | Every crafted frame (handoff maps) and the 14 Studio flavor frames | 0.0000% pixel diff |
| 3 | Per builder, per category: base instances (theme mode) above the style instances, Light and Dark, plus a swap row | The style row is recognisably the theme at thumbnail size, and the swap row keeps every text and boolean override |
| 4 | Contact sheet per category | 11 distinct rows |

## 5. Conflicts found

**Between DESIGN.md and the Theme mode values.** The crafted frames mostly use literals, so these
conflicts never showed in the specimens. All are resolved in §1 in favour of DESIGN.md:

- **Tonal:**
  - `radius/card` 16, but DESIGN.md says 28 and calls 16 a leftover (L452-454);
  - card shadow 0 1 3, against "no shadows" (L389).
- **Bloom.** Theme B Bloom is entirely Tonal's seed (mauve × violet, Roboto Flex). DESIGN.md
  asks for a complete Bloom core map (L464-495).
- **Cupertino:**
  - Content cards get Glass's 0 10 28 card shadow, but content has "no shadow" (L348).
  - **Internal conflict:** L406 says every editable boundary uses `muted-fg`, while L408 says
    unchecked circles and off tracks use `input-border`. Both bind `border/input` in the base.
    `input` stays `input-border`, and `Cupertino/Input` and `Cupertino/Search` bind `text/muted`
    for their boundary.
  - The map shows literal 24 and 26 container radii next to `radius/card` 22, an unresolved tier.
    The style sets use 24 and 26 literally.
- **Liquid:**
  - Theme B Liquid carries Cupertino's type and radii (L495);
  - switch 51×31 vs Liquid's 46×28 (L412);
  - dark `primary-fg` `#111113` vs white on `#0058d0` (L424).
- **Fluent:**
  - `radius/badge` 999 vs 4 (L424);
  - card shadow 0 2 4 vs flat cards (L438);
  - type tracking 0 vs −0.5 and −0.2 (L364-367);
  - focus "offset 3" (L502) describes WinUI's −3 margin (a 2px outer ring outside a 1px inner
    ring), not a 3px gap. `focus/ring-offset` is code-only.
- **Brutal:**
  - avatar radius 999 vs r6 (L434);
  - `type/strong` Medium vs button labels Bold −0.3 (L314).
- **Filigrane:**
  - `type/display/style` ExtraLight vs Light (L285-286);
  - `radius/avatar` 0 (the generic Group C value) vs the 32px circle (L327-328).
- **Terminal:**
  - Theme B Terminal (Signal seed) sets proportional Geist for `font/sans`, against "no
    proportional type" (L243-244);
  - it carries Signal radii 6/6/4 against square keys (L288-289);
  - the `Terminal/Key` main binds `type/body/line` 20 while its instances use 24 (map).
- **Pixel.** Display 64/64 breaks "Pixelify Sans only at 24 and 40px" (L285).
- **Tactile.** The mode's `type/*` sizes and its shadow colour (`#1a171229`) are the superseded
  build's (L327-330, L539). DESIGN.md also sets IDs in Geist Mono where the mode had Nunito Sans.

**Between DESIGN.md and the crafted frames.** No value conflict changes a §1 or §2 row. The renders
I measured agree with DESIGN.md:

- Tonal tab gaps 2–3px;
- Brutal joined tabs at −2;
- Pixel square switch with I/O marks;
- Filigrane hairline KPI grid;
- Fluent ListView without dividers.


### 5.1 Conflicts found while writing the style briefs

The brief writers measured the crafted renders and kits. Each brief names the side it follows.
§1 already includes three corrections that came from this:

- Brutal: tab padding 16, switch thumb 18 (kit `33:58`), display Regular (L427);
- Tonal: tab padding 20 (`23:277`);
- Tactile: the label mapping.

**Tonal:**
- The checkbox outline renders `muted-fg`, but DESIGN says `input-border` (L394). The brief follows
  DESIGN.
- The text-button hover layer is not visible on `47:527`.
- The kit has an undocumented `Elevated` kind; the brief ignores it.
- `renders-r4/states--tonal--dark.png` is stale: it shows pale `#baa7ff` fills, while the live
  `47:857` is correct. The map should point at a fresh export.

**Bloom:**
- Disc sizes: L380 gives 48/40/36/28, but the frames use 44 (front matter `disc-md`).
- After the shared step, Theme B Bloom still holds Tonal values for `ring`, `primary/container` and
  `nav/active`, because DESIGN.md leaves them undefined (#2416). The brief forbids binding them and
  derives focus from `bloom/control-outline`.

**Cupertino:**
- Nav icons render `primary`, but L387 says `primary-text`.
- The error-row value renders `muted-fg` (`78:820`), but L385 says `destructive-text`.
- `GLASS` is on the frames, against L401-403. This is already deferred to #2419.
- No core role is white in Dark for the selected-circle tick (L298-299). The brief binds
  `primary/fg` and defers to kit `29:40`.

**Liquid:**
- After the shared step, `primary/text` resolves to `liquid-primary-text` (`#0066cc`). The crafted
  windows show the Glass seed `#113264` because they still render through `Glass`.
- Toolbar glyphs render at 17, but L445 says 16.
- Scheme-specific hairline and rim literals cannot switch by scheme in one set. The brief binds the
  nearest `liquid/*` roles as stand-ins until #2414 adds roles. **Owner sign-off needed.**

**Fluent:**
- The r7 renders predate the three NetScript overrides (pressed accent, ComboBox edge, dark focus);
  `renders-r8/fluent--components.png` shows them. The brief follows DESIGN.
- Library list rows are 40, but L384 and L423 say 48. The brief uses 40 for one-line rows and 48
  for two-line rows.
- The strict seven-place accent policy turns radio, slider, calendar selection, toggle and step
  neutral. **Owner decision:** keep that, or add an eighth accent place.

**Brutal:**
- In dark, tab and button outlines render ink (about 1.19:1), against L410 ("border/control for
  every boundary a user has to find"). The §2.3 tab border tokens keep `#7c7b74` for contrast; the
  brief keeps ink on buttons as the frames show. **Owner decision.**
- Focus "keeps the ink border" (L361) is only true in Light.
- Panel titles and headings render Bold, against L322.
- component-spec N4 gives the selected nav `surface/selected`, but the frames use `block/yellow`.

**Filigrane:**
- The focus caret (L395-396) is not drawn on the crafted field; the brief adds it hidden.
- Table checkboxes sit on half pixels (a known issue in the map).
- Radio and switch are square, per L327-328 ("the only circle is the avatar").

**Terminal:**
- Pane titles render only `├`, but L194 and L281 say `┤ ├`.
- The light Save key is 32 next to 34 for the other keys; the brief sets 34 for all.
- The progress fill renders `primary-text`, not lime (L304).
- The help bar does not dim its descriptions (L200).
- The dark Save key cannot switch by scheme in one set. The brief adds a theme-only `darkKey`
  overlay with the three documented primitives, off by default.

**Tactile:**
- The slider fill renders `text/body`, not "strong ink" (L448).
- The 14px and 15px text sizes on the frames have no type role.
- The selected nav item and current page key have no LED in the frames, though L253-254 asks for
  one.
- The pressed shift renders +1/+0.5 (+2 on rows), not the 1/19 padding of L368.
- The checkbox tick renders `text/accent`.
- The "On" caption sits in different places on the two frames.
- The pressed primary key is drawn (`146:985`) but not documented.

### 5.2 Conflicts found while writing the Data display 1 sections

Folded in already:

- **Fluent.** `kpi/pad-x` 16, `kpi/gap` 12 and `table/head-rule-width` 0 are now in §1.
- **Cupertino.** `table/head-rule-width` 0 and `table/head` transparent (frame `30:219`) are now in
  §1 and §2.
- **Pixel brief §3, corrected to the render:**
  - P.panel is square; only the Dialog is stepped (L352).
  - The selected-row bar is 4px wide and stacks all five bands (`66:433`).

Still open:

- **Pixel:**
  - Row rules render dashed `[2, 2]`, where L299 only says `border`.
  - The chart silhouette renders `control/ink`, not `fg` (L347).
- **Brutal.** The dark first KPI tile renders yellow; the YAML says `block-blue-dark`. The brief
  follows the frame.
- **Filigrane.** Customer names render at the lead size (17), not data 14/20 (L196, L273). The
  brief follows the render.
- **Tactile.**
  - Binds `tactile/surface/base` instead of `card/bg`, because Tactile reads only `tactile/*` (same
    value).
  - The Refunded LED is named `led-off` but renders `led/grey`.
- **Liquid.**
  - The pink avatar uses `liquid/tag/red` as a stand-in (#2414).
  - The dark green delta binds `liquid/success/text` `#30d158`; the crafted value is `#71d083`.
- **Bloom and Fluent.** Some twins still hold seed values under their modes:
  - Bloom `table/zebra` and `table/hover` (Tonal seed);
  - Fluent `card/footer` and `table/zebra` (Radix).
  
  The style rows bind language roles instead.
