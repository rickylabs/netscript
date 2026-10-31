# Figma variables change: Theme B, Theme set, and spec §4.1 A–D

- **File:** `pGRLnkPPRZJZy74evNcQBr`. Done on 2026-10-28 through `use_figma`, one call at a time.
- **Owner decisions applied:**
  - the theme-following variables land before the component library;
  - the mode cap is lifted with a second Theme collection.
- **Evidence:** everything sits in `verify/` next to this file:
  - `before/`, `after-task1/` and `after-task2/`: 26 PNGs each, captured with `get_screenshot`
    at maxDimension 1600;
  - `resolver-task2.json`: the resolver check.

## Collections

| Collection | Id | Modes (id) | Variables before | Variables after |
| --- | --- | --- | ---: | ---: |
| Primitives | `VariableCollectionId:2:2` | Value | 413 | 413 |
| Theme | `VariableCollectionId:2:330` | Studio 2:1, Ledger 2:5, Filigrane 2:6, Signal 2:7, Tonal 14:0, Glass 14:1, Brutal 14:2, Fluent 52:0, Tactile 52:1, Pixel 52:2 | 146 | 273 |
| **Theme B** (new) | `VariableCollectionId:239:9` | Bloom 239:0 (default), Cupertino 239:1, Liquid 239:2, Terminal 239:3, macOS 27 239:4, Apple Classic 239:5, Fluent 2 Web 239:6 | — | 273 |
| **Theme set** (new) | `VariableCollectionId:239:156` | A 239:7 (default), B 239:8 | — | 273 |
| Base accent | `VariableCollectionId:2:357` | Ink, Blue, Violet, Orange, Indigo, Tomato, Lime | 32 | 32 |
| Base gray | `VariableCollectionId:50:2` | Neutral, Slate, Sand, Mauve | 26 | 26 |
| Scheme | `VariableCollectionId:3:2` | Light 3:0, Dark 3:1 | 399 | 435 |
| Density | `VariableCollectionId:3:64` | Comfortable, Compact, Dense, Airy, Chunky | 15 | 19 |
| Studio flavor | `VariableCollectionId:121:1087` | Utility 121:0 + 6 flavors | 198 | 201 |

Theme B's modes take their values from these Theme modes:

| Theme B mode | Source mode in Theme |
| --- | --- |
| Bloom | Tonal |
| Cupertino, Liquid, macOS 27, Apple Classic | Glass |
| Terminal | Signal |
| Fluent 2 Web | Fluent |

How the switch works:

- Theme set's variables alias `Theme/<name>` in mode A and `Theme B/<name>` in mode B.
- Every frame defaults to A, so existing frames render exactly as before.
- To render a Theme B theme, set Theme set to B and Theme B to that theme's mode.

## Task 1: Theme B and Theme set, with zero visual change

**Theme B** has 146 variables, matching Theme's names, types, scopes, code syntax and descriptions.
It holds 1,022 values (146 × 7):

- 365 literals;
- 506 aliases into other collections, kept as they were;
- 151 aliases to another Theme variable, remapped to the same-named Theme B variable.

**Theme set** has 146 variables, carrying 292 aliases.

**Re-pointed aliases:** 198 alias values that targeted Theme now target the same-named Theme set
variable.

| Collection | Alias values re-pointed | Variables touched |
| --- | ---: | ---: |
| Scheme | 112 | 57 |
| Studio flavor | 48 | 8 |
| Base accent | 38 | 32 |
| Density | 0 | 0 |
| Base gray | 0 | 0 |
| **Total** | **198** | **97** |

- After the re-point, no alias outside Theme and Theme set still targets Theme.
- Theme's 235 internal aliases are unchanged.

**Re-pointed node bindings:** 65 bindings on 14 nodes.

| Component | Bindings | What was bound |
| --- | ---: | --- |
| `234:10489` Foundations/Type scale | 45 | 9 text nodes × fontFamily, fontSize, fontStyle, letterSpacing and lineHeight |
| `234:10538` Foundations/Spacing, radius and density | 20 | 5 nodes × 4 corner radii |

- Before rebinding, the 48 fonts used by the components and their 30 instances were loaded.
- Afterwards, none of the 30 instances carries a Theme binding, so none had an override. Each
  inherits at least 20 Theme set bindings.
- The theme specimen frames were left bound as they were.

**Structural proof.** Every collection was hashed into a canonical digest. Each digest covers name,
type, scopes, WEB syntax, description and every mode value, with aliases written as
`Collection/name`.

- **Baseline.** The live digests matched the 2026-10-28 export in
  `docs-fresh-ui-design-system--design-handoff/figma-variables/` byte for byte.
- **Expected state.** A Python model built from that export predicted the digests after Task 1:
  Theme B and Theme set as specified, and the 198 aliases re-pointed.
- **Result.** The live digests after Task 1 matched the model for all 9 collections. So nothing
  changed except the intended edits:
  - Primitives `88adf20b`, Theme `f43c1da3`, Density `cf363bf4` and Base gray `791de259`
    are unchanged;
  - Scheme `99efa161`, Studio flavor `99d37090` and Base accent `6e3b87f8` differ only by
    the re-pointed aliases;
  - Theme B is `6a7ae352` and Theme set `a883e2a2`.

## Task 2: §4.1 additions

| Group | Theme | Theme B | Theme set | Scheme | Studio flavor | Density | Total new |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A: scale and size | 30 | 30 | 30 | 7 | 2 | 4 | 103 |
| B: theme-following colour roles | 58 | 58 | 58 | 29 | — | — | 203 |
| C: structure twins | 37 | 37 | 37 | — | 1 | — | 112 |
| D: `input/l`, `input/d` | 2 | 2 | 2 | — | — | — | 6 |
| **Total** | **127** | **127** | **127** | **36** | **3** | **4** | **424** |

### Group A

- **Density:**
  - `space/control/height-lg` (44/40/36/48/52);
  - `space/control/height-xs` (24/22/20/26/28);
  - `space/control/padding-x-sm` (10/8/6/12/14);
  - `space/sidebar/width` (240/224/208/272/256).
- **Theme, Theme B and Theme set:**
  - `size/icon/sm|md|lg`;
  - `icon/stroke`;
  - `size/checkbox` and `radius/checkbox`;
  - `size/switch/width|height|thumb`;
  - `size/avatar/sm|md|lg` and `size/kbd`;
  - `state/hover-opacity`, `state/pressed-opacity`, `state/disabled-opacity`;
  - `focus/ring-width` and `focus/ring-offset`;
  - `shadow/x`, `shadow/overlay/y|blur`, `shadow/control/x|y`;
  - `type/kpi-sm/style|tracking` (alias the same mode's `type/kpi/*`);
  - `type/code/size|line` (13/20);
  - `font/eyebrow`;
  - `switch/l/thumb` and `switch/d/thumb` (see deviations).
- **Studio flavor:**
  - `radius/checkbox` (Utility 2, other flavors 4);
  - `font/eyebrow` (Utility "Fragment Mono", other flavors alias Studio flavor `font/label`).
- **Scheme:**
  - `effect/shadow-overlay`;
  - `chart/1` to `chart/5`;
  - `switch/thumb`.

**How the Studio mode resolves.** Theme mode Studio aliases Studio flavor for these variables:

| Theme variable | Studio flavor source |
| --- | --- |
| `icon/stroke` | `icon/stroke` |
| `radius/checkbox` | `radius/checkbox` |
| `shadow/x` | `shadow/x` |
| `shadow/overlay/y` | `shadow/y` |
| `shadow/overlay/blur` | `shadow/blur` |
| `shadow/control/x` | `button/shadow-x` |
| `shadow/control/y` | `button/shadow-y` |
| `font/eyebrow` | `font/eyebrow` |

**Per-theme values** follow the spec. Where the spec names no value for a mode, the interim
literal applies.

### Group B

There are 29 Scheme roles:

- `primary/stroke`, `marker/default`, `link/underline`;
- `brand/default`, `brand/fg`;
- `card/border`, `card/footer`;
- `table/head`, `table/head-rule`, `table/row-rule`, `table/cell-rule`, `table/hover`,
  `table/zebra`, `table/row-bg`;
- `tabs/track`, `tabs/sel-bg`, `tabs/sel-border`, `tabs/idle-border`;
- `nav/active`;
- `topbar/bg`, `topbar/rule`;
- `kpi/bg-1` to `kpi/bg-4`, `kpi/border`;
- `scrollbar/thumb`;
- `hero/bg`;
- `effect/control-shadow`.

**How a role resolves:**

- Each role aliases `Theme set/<group>/l/<rest>` in Light and `Theme set/<group>/d/<rest>` in
  Dark. For example, `marker/default` resolves through `Theme set/marker/l/default`.
- In Theme mode Studio, the Theme `l`/`d` variable aliases the source of the interim
  `studio/*` role:
  - `studio/signal/marker` → Studio flavor `signal/l|d/marker`;
  - `studio/code/scroll-thumb` → Theme `gray/l|d/10`.
- In every other Theme mode, and in every Theme B mode, it aliases the same mode's Theme variable
  for the non-Studio default role.
  - Example: `primary/default` → `accent/l/solid`.
  - `tabs/idle-border` is the exception: its non-Studio default is a transparent literal,
    `#00000000`.
- The `studio/*` roles are untouched.

### Group C

The variables are these 37:

- **tabs** (8): `gap`, `pad`, `radius`, `item-pad`, `item-radius`, `sel-box`,
  `sel-bottom`, `idle-stroke`.
- **table** (6): `head-rule-width`, `row-rule-width`, `cell-rule-width`, `inset`,
  `row-gap`, `row-radius`.
- **topbar** (4, plus 1 frame): `radius`, `rule-width`, `shadow-y`, `shadow-blur`, and
  `frame/inset`.
- **nav** (2): `pad`, `radius`.
- **card** (3): `border-top`, `border-side`, `border-bottom`.
- **kpi** (7): `border-top`, `border-right`, `border-bottom`, `border-left`,
  `first-left`, `gap`, `pad-x`.
- **Other** (2): `radius/avatar`, `hero/pad`.
- **deco** (4): `marker`, `sparkline`, `ticks`, `blockbars`.

**Theme mode Studio** aliases the Studio flavor variable of the same name, with these renames:

| Theme | Studio flavor |
| --- | --- |
| `table/head-rule-width` | `table/head-rule` |
| `table/row-rule-width` | `table/row-rule` |
| `table/cell-rule-width` | `table/cell-rule` |
| `topbar/rule-width` | `topbar/rule` |
| `radius/avatar` | `avatar/radius` |

Studio flavor `deco/marker` is new: Utility true, the other flavors false.

**Other modes take generic values:**

| Variables | Generic value |
| --- | --- |
| `tabs/radius`, `tabs/item-radius`, `nav/radius` | alias the same mode's `radius/control` |
| `tabs/sel-box`, `tabs/sel-bottom`, `table/head-rule-width`, `table/row-rule-width`, `topbar/rule-width`, `card/border-*`, `kpi/border-*`, `kpi/first-left` | alias the same mode's `border/width` |
| `tabs/gap` | 2 |
| `tabs/pad` | 3 |
| `tabs/item-pad` | 12 |
| `kpi/gap` | 16 |
| `kpi/pad-x` | 20 |
| `radius/avatar` | 999 (Pixel and Filigrane 0) |
| every other FLOAT | 0 |
| every `deco/*` | false |

### Group D

- `state/disabled-container` and `state/disabled-fg`: scopes changed from `[]` to FRAME_FILL,
  SHAPE_FILL and TEXT_FILL.
- `border/input` now aliases `Theme set/input/l` (Light) and `Theme set/input/d` (Dark).
  These new Theme variables resolve as follows:
  - in Studio, they alias Studio flavor `input/l|d/border`, which is gray 9 in Utility;
  - in every other mode, they alias the same mode's `gray/l|d/10`, as before.
- `studio/input/border` is retired by description; see deviation 14.
- Theme Brutal `border/width`: 1 → 2.
- Theme Filigrane radii, all → 0:
  - `radius/control`: 999;
  - `radius/input`: 10;
  - `radius/card`: 16;
  - `radius/badge`: 999.

### Rules applied to every new variable

- **Scopes are explicit.**
  - The Theme `l`/`d` intermediates are `[]` (hidden), matching the existing raw Theme
    `l`/`d` variables.
  - Each Scheme twin copies its interim role's scopes.
  - Only the 13 BOOLEAN `deco/*` variables carry ALL_SCOPES; see deviation 3.
- **Every new variable has WEB code syntax** `var(--ns-…)`; see deviation 16 for the naming.
- **Every new variable has a one-line description.**

**Structural proof:** the live digests after Task 2 matched the model for all 9 collections:

| Collection | Count | Digest |
| --- | ---: | --- |
| Primitives | 413 | `88adf20b` |
| Theme | 273 | `7e33c135` |
| Base accent | 32 | `6e3b87f8` |
| Scheme | 435 | `5c10dde6` |
| Density | 19 | `75e2f84d` |
| Base gray | 26 | `791de259` |
| Studio flavor | 201 | `c5e1418f` |
| Theme B | 273 | `dd1d8540` |
| Theme set | 273 | `0ab91985` |

## Verification

### Screenshot diffs

Each frame was pixel-compared with PIL (RGBA, exact). The tolerance was 1%; no frame needed it.

| Theme | Frame | PNG size | before → after-task1 | before → after-task2 | Cause of any change |
| --- | --- | --- | ---: | ---: | --- |
| Utility | `10:4277` | 1280×1327 | 0.0000% | 0.0000% | — |
| Utility | `10:5518` | 1280×1327 | 0.0000% | 0.0000% | — |
| Cloud | `10:4587` | 1280×1490 | 0.0000% | 0.0000% | — |
| Signal flavor | `10:7379` | 1280×1054 | 0.0000% | 0.0000% | — |
| Tonal | `23:277` | 1092×1600 | 0.0000% | 0.0000% | — |
| Tonal | `25:295` | 1092×1600 | 0.0000% | 0.0000% | — |
| Bloom | `108:894` | 1280×1557 | 0.0000% | 0.0000% | — |
| Bloom | `110:1006` | 1280×1557 | 0.0000% | 0.0000% | — |
| Cupertino | `30:22` | 1280×1366 | 0.0000% | 0.0000% | — |
| Cupertino | `32:169` | 1280×1366 | 0.0000% | 0.0000% | — |
| Liquid | `133:1088` | 1440×1160 | 0.0000% | 0.0000% | — |
| Liquid | `133:1150` | 1440×1160 | 0.0000% | 0.0000% | — |
| Fluent | `155:737` | 1600×1271 | 0.0000% | 0.0000% | — |
| Fluent | `158:922` | 1600×1271 | 0.0000% | 0.0000% | — |
| Brutal | `34:9` | 1225×1600 | 0.0000% | 0.0000% | — |
| Brutal | `35:199` | 1225×1600 | 0.0000% | 0.0000% | — |
| Filigrane | `38:9` | 1280×1567 | 0.0000% | 0.0000% | — |
| Filigrane | `38:309` | 1280×1567 | 0.0000% | 0.0000% | — |
| Terminal | `41:297` | 1280×1052 | 0.0000% | 0.0000% | — |
| Terminal | `41:2` | 1280×1052 | 0.0000% | 0.0000% | — |
| Pixel | `66:433` | 1280×1537 | 0.0000% | 0.0000% | — |
| Pixel | `68:917` | 1280×1537 | 0.0000% | 0.0000% | — |
| Tactile | `144:1744` | 857×1600 | 0.0000% | 0.0000% | — |
| Tactile | `145:1115` | 857×1600 | 0.0000% | 0.0000% | — |
| Foundations | `234:698` | 1168×1600 | 0.0000% | 0.2849% | Group D: the `border/input` swatch (Utility, Dark) moved from gray 10 `#7b7b7b` to gray 9 `#6e6e6e` |
| Foundations | `234:11258` | 1440×817 | 0.0000% | 0.0000% | — |

**Why most Group D fixes show no pixels.** I checked which bindings each frame holds:

- **Utility Orders frames** (`10:4277`, `10:5518`): their 24 input strokes and 2 fills bind
  `studio/input/border` (already gray 9), not `border/input`.
- **Brutal frames** (`34:9`, `35:199`): no node binds `border/width`; the 2px strokes are
  literals.
- **Filigrane frames** (`38:9`, `38:309`): no node binds a radius variable; they already draw
  0.

So the fixes take effect for the base components that will bind these variables. The only rendered
consumer today is the Foundations `border/input` swatch. That change is also the positive control:
it shows the screenshot pipeline reflects variable edits.

- **Downscaled captures.** Frames taller or wider than 1600px were captured downscaled (Tonal,
  Fluent, Brutal, Tactile, Foundations colour roles).
- **Binding check.** The digest and binding checks above cover what a downscaled capture could
  hide.

### Resolver check

The 36 new Scheme roles, plus `border/input`, were resolved with `resolveForConsumer`.

- **Consumer.** A temporary off-canvas frame, removed in the same call.
- **Set A scenarios** (Theme set A):
  - Utility: Theme Studio with Studio flavor Utility;
  - Tonal, Glass and Pixel: that Theme mode.
- **Set B scenarios** (Theme set B): Bloom, Cupertino, Liquid and Terminal, each the Theme B mode
  of that name.
- **Schemes.** Every scenario was resolved in both Light and Dark.

**Results:**

- **Studio.** All 58 twin values (29 roles × 2 schemes) under Utility equal their `studio/*`
  interim.
- **Other modes.** All 406 values under the other seven scenarios equal the generic default role
  resolved in the same scenario. There are 0 failures.
  - No twin returns its Studio interim where that differs from the generic default.
  - Example: `marker/default` under Tonal is `#6550b9`, not `#202020`.
  - Matches with Utility's value occur only where the generic default happens to coincide: the
    transparent `tabs/idle-border`, Pixel and Terminal `effect/control-shadow` (no shadow), and
    Terminal Dark `table/row-rule` and `table/hover` (Radix gray).
- **Set B.** Bloom resolves like Tonal, Cupertino and Liquid like Glass, and Terminal like Signal.
- **Group A and C variables.** The new non-colour Theme set variables resolve to the planned
  values. For example:
  - Liquid `focus/ring-offset` = 0;
  - `deco/marker` is true only under Utility;
  - `tabs/radius` = 999 in Tonal and 0 in Pixel.

The full values are in `verify/resolver-task2.json`.

| Scheme role | Utility L | Utility D | Tonal L | Tonal D | Glass L | Glass D | Pixel L | Pixel D |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `primary/stroke` | `#202020` | `#7b7b7b` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#faab35` | `#faab35` |
| `marker/default` | `#202020` | `#eeeeee` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#faab35` | `#faab35` |
| `link/underline` | `#bbbbbb` | `#606060` | `#6550b9` | `#baa7ff` | `#113264` | `#70b8ff` | `#9c681a` | `#ffc474` |
| `brand/default` | `#da291c` | `#e5332a` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#faab35` | `#faab35` |
| `brand/fg` | `#fcfcfc` | `#eeeeee` | `#ffffff` | `#ffffff` | `#ffffff` | `#111113` | `#12100e` | `#12100e` |
| `card/border` | `#e0e0e0` | `#313131` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#dad9d6` | `#3b3a37` |
| `card/footer` | `#00000000` | `#00000000` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f1f0ef` | `#222221` |
| `table/head` | `#00000000` | `#00000000` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f1f0ef` | `#222221` |
| `table/head-rule` | `#e0e0e0` | `#313131` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#dad9d6` | `#3b3a37` |
| `table/row-rule` | `#f0f0f0` | `#2a2a2a` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e9e8e6` | `#2a2a28` |
| `table/cell-rule` | `#00000000` | `#00000000` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e9e8e6` | `#2a2a28` |
| `table/hover` | `#f9f9f9` | `#222222` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f1f0ef` | `#222221` |
| `table/zebra` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9f8` | `#191918` |
| `table/row-bg` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `tabs/track` | `#00000000` | `#00000000` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f1f0ef` | `#222221` |
| `tabs/sel-bg` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `tabs/sel-border` | `#111111` | `#ededef` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#dad9d6` | `#3b3a37` |
| `tabs/idle-border` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` |
| `nav/active` | `#00000000` | `#00000000` | `#f4f0fe` | `#291f43` | `#e6f4fe` | `#0d2847` | `#ffeacb` | `#31200b` |
| `topbar/bg` | `#ffffff` | `#18181a` | `#fdfcfd` | `#121113` | `#f0f0f3` | `#111113` | `#f4efe6` | `#12100e` |
| `topbar/rule` | `#e0e0e0` | `#313131` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e9e8e6` | `#2a2a28` |
| `kpi/bg-1` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `kpi/bg-2` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `kpi/bg-3` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `kpi/bg-4` | `#00000000` | `#00000000` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#fcfaf6` | `#1b1916` |
| `kpi/border` | `#e0e0e0` | `#313131` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#dad9d6` | `#3b3a37` |
| `scrollbar/thumb` | `#838383` | `#7b7b7b` | `#bcbac7` | `#625f69` | `#b9bbc6` | `#5a6169` | `#bcbbb5` | `#62605b` |
| `hero/bg` | `#00000000` | `#00000000` | `#fdfcfd` | `#121113` | `#f0f0f3` | `#111113` | `#f4efe6` | `#12100e` |
| `effect/control-shadow` | `#00000000` | `#00000000` | `#0f0f1414` | `#00000080` | `#0d0f1f1f` | `#00000073` | `#00000000` | `#00000000` |
| `effect/shadow-overlay` | `#00000000` | `#00000000` | `#0f0f1414` | `#00000080` | `#0d0f1f1f` | `#00000073` | `#00000000` | `#00000000` |
| `chart/1` | `#202020` | `#313131` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#faab35` | `#faab35` |
| `chart/2` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` |
| `chart/3` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` |
| `chart/4` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` |
| `chart/5` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` |
| `switch/thumb` | `#fcfcfc` | `#eeeeee` | `#ffffff` | `#ffffff` | `#ffffff` | `#111113` | `#12100e` | `#12100e` |
| `border/input` | `#8d8d8d` | `#6e6e6e` | `#84828e` | `#7c7a85` | `#80838d` | `#777b84` | `#82827c` | `#7c7b74` |

| Scheme role | Bloom L | Bloom D | Cupertino L | Cupertino D | Liquid L | Liquid D | Terminal L | Terminal D |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `primary/stroke` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#0d74ce` | `#0090ff` | `#bdee63` | `#bdee63` |
| `marker/default` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#0d74ce` | `#0090ff` | `#bdee63` | `#bdee63` |
| `link/underline` | `#6550b9` | `#baa7ff` | `#113264` | `#70b8ff` | `#113264` | `#70b8ff` | `#5c7c2f` | `#bde56c` |
| `brand/default` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#0d74ce` | `#0090ff` | `#bdee63` | `#bdee63` |
| `brand/fg` | `#ffffff` | `#ffffff` | `#ffffff` | `#111113` | `#ffffff` | `#111113` | `#37401c` | `#111111` |
| `card/border` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#d9d9e0` | `#363a3f` | `#d9d9d9` | `#3a3a3a` |
| `card/footer` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f0f0f3` | `#212225` | `#f0f0f0` | `#222222` |
| `table/head` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f0f0f3` | `#212225` | `#f0f0f0` | `#222222` |
| `table/head-rule` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#d9d9e0` | `#363a3f` | `#d9d9d9` | `#3a3a3a` |
| `table/row-rule` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e8e8ec` | `#272a2d` | `#e8e8e8` | `#2a2a2a` |
| `table/cell-rule` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e8e8ec` | `#272a2d` | `#e8e8e8` | `#2a2a2a` |
| `table/hover` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f0f0f3` | `#212225` | `#f0f0f0` | `#222222` |
| `table/zebra` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#f9f9f9` | `#191919` |
| `table/row-bg` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `tabs/track` | `#f2eff3` | `#232225` | `#f0f0f3` | `#212225` | `#f0f0f3` | `#212225` | `#f0f0f0` | `#222222` |
| `tabs/sel-bg` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `tabs/sel-border` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#d9d9e0` | `#363a3f` | `#d9d9d9` | `#3a3a3a` |
| `tabs/idle-border` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` | `#00000000` |
| `nav/active` | `#f4f0fe` | `#291f43` | `#e6f4fe` | `#0d2847` | `#e6f4fe` | `#0d2847` | `#eef6d6` | `#1f2917` |
| `topbar/bg` | `#fdfcfd` | `#121113` | `#f0f0f3` | `#111113` | `#f0f0f3` | `#111113` | `#fcfcfc` | `#000000` |
| `topbar/rule` | `#eae7ec` | `#2b292d` | `#e8e8ec` | `#272a2d` | `#e8e8ec` | `#272a2d` | `#e8e8e8` | `#2a2a2a` |
| `kpi/bg-1` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `kpi/bg-2` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `kpi/bg-3` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `kpi/bg-4` | `#faf9fb` | `#1a191b` | `#f9f9fb` | `#18191b` | `#f9f9fb` | `#18191b` | `#ffffff` | `#111111` |
| `kpi/border` | `#dbd8e0` | `#3c393f` | `#d9d9e0` | `#363a3f` | `#d9d9e0` | `#363a3f` | `#d9d9d9` | `#3a3a3a` |
| `scrollbar/thumb` | `#bcbac7` | `#625f69` | `#b9bbc6` | `#5a6169` | `#b9bbc6` | `#5a6169` | `#bbbbbb` | `#606060` |
| `hero/bg` | `#fdfcfd` | `#121113` | `#f0f0f3` | `#111113` | `#f0f0f3` | `#111113` | `#fcfcfc` | `#000000` |
| `effect/control-shadow` | `#0f0f1414` | `#00000080` | `#0d0f1f1f` | `#00000073` | `#0d0f1f1f` | `#00000073` | `#00000000` | `#00000000` |
| `effect/shadow-overlay` | `#0f0f1414` | `#00000080` | `#0d0f1f1f` | `#00000073` | `#0d0f1f1f` | `#00000073` | `#00000000` | `#00000000` |
| `chart/1` | `#6550b9` | `#6e56cf` | `#0d74ce` | `#0090ff` | `#0d74ce` | `#0090ff` | `#bdee63` | `#bdee63` |
| `chart/2` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` | `#0090ff` |
| `chart/3` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` | `#46a758` |
| `chart/4` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` | `#ffc53d` |
| `chart/5` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` | `#e5484d` |
| `switch/thumb` | `#ffffff` | `#ffffff` | `#ffffff` | `#111113` | `#ffffff` | `#111113` | `#37401c` | `#111111` |
| `border/input` | `#84828e` | `#7c7a85` | `#80838d` | `#777b84` | `#80838d` | `#777b84` | `#838383` | `#7b7b7b` |

## Deviations from the spec

1. **Theme B internal aliases.** In Theme B, aliases to another Theme variable point at the
   same-named Theme B variable (151 values).
   - Kept pointing at Theme, they would resolve in whichever Theme mode a frame has, not in the
     Theme B mode.
   - Every alias into another collection was kept exactly.
2. **Opacity units.** `state/*-opacity` is stored as 8, 12 and 38, not 0.08, 0.12 and 0.38.
   - Figma's opacity binding is in percent. A probe showed a variable value of 50 gives
     `node.opacity` 0.5, and 0.5 gives 0.005.
   - The CSS values are noted in each description.
3. **BOOLEAN scopes.** The BOOLEAN `deco/*` variables keep ALL_SCOPES (13 of them: 4 each in
   Theme, Theme B and Theme set, plus Studio flavor `deco/marker`).
   - Figma rejects any other scope for BOOLEAN: `[]` and `OPACITY` both fail with "Invalid
     scope for this variable type".
4. **`switch/thumb`.** It needed per-theme values, so I added Theme `switch/l/thumb` and
   `switch/d/thumb`, mirrored in Theme B and Theme set. The spec did not list them.
   - Glass is white / `#111113` (Primitives `color/white` / `color/slate/d/1`), per TD-24.
   - Every other mode uses the same mode's `primary/fg` sources.
   - The scope is FRAME_FILL and SHAPE_FILL, for the spec's "FILL".
5. **`effect/shadow-overlay`.** It aliases Theme set `shadow/l|d/color`. That is per theme, but
   equal to `effect/shadow` today, because no distinct overlay colour exists yet.
6. **`chart/1` to `chart/5`.** They alias Scheme `primary`, `info`, `success`,
   `warning` and `destructive` `/default`, the interims. The spec gives no palette values.
7. **`code/syntax/*`: skipped.** The spec marks it optional and gives no role names or values.
8. **Group C non-Studio values.** Radii and stroke widths alias the theme's own `radius/control`
   or `border/width` rather than literals, so they follow each theme. For example, Brutal's cards
   and stat cards get 2px borders. The other values are generic literals, listed above.
9. **Group C renames, as the spec asked:**
   - `table/*-rule-width`;
   - `topbar/rule-width`;
   - `radius/avatar`, which follows Studio flavor `avatar/radius`.
10. **`deco/marker` is new in Studio flavor:** Utility true, the other flavors false. Non-Studio
    Theme modes are false.
11. **Studio flavor `font/eyebrow`.** The spec gives only Utility ("Fragment Mono"). The other
    flavors alias their own `font/label`, per decision D5.
12. **Unspecified modes use the interim literal:**
    - `radius/checkbox` is 2 in Ledger, Signal and Tonal;
    - `size/checkbox` is 16 in Ledger and Signal;
    - the switch is 32/18/14 in Ledger, Filigrane and Signal.
13. **Theme B values** for the new variables follow the same source-mode rule. The one exception is
    Liquid `focus/ring-offset` = 0, as the spec says.
14. **`studio/input/border` was retired, not deleted.** Its description now starts with
    "RETIRED: bind border/input …".
    - Each Utility Orders frame still binds it 26 times, and deleting it would detach those
      bindings.
    - Rebind those frames to `border/input` first, then delete it.
15. **Not done:** Pixel `border/width-control` and the Tonal radii. The spec leaves the first
    optional and calls the second a value choice, and neither is in the task's Group D list.
16. **Code syntax follows the existing patterns where one exists**, and the literal path rule
    otherwise:
    - Density drops `space/`: `var(--ns-control-height-lg)`, and `var(--ns-sidebar-width)`,
      which fresh-ui already uses.
    - `type/*` uses the text, leading, weight and tracking prefixes:
      `var(--ns-weight-kpi-sm)`, `var(--ns-text-code)`.
    - `<group>/default` becomes `--ns-<group>`: `var(--ns-marker)`, `var(--ns-brand)`.
    - `effect/*` becomes `--ns-<x>-color`: `var(--ns-shadow-overlay-color)`,
      `var(--ns-control-shadow-color)`.
    - `icon/stroke` becomes `var(--ns-icon-stroke-width)`, the name `primitives.tsx` already
      consumes.
    - The hidden Theme `l`/`d` intermediates got path syntax, such as
      `var(--ns-marker-l-default)`, because every new variable needed one. Code can ignore them.
    - New Studio flavor twins use `var(--ns-studio-…)`.
17. **Theme intermediate naming:** `<group>/l|d/<rest>`, for example `marker/l/default` and
    `effect/l/control-shadow`.
18. **Descriptions avoid apostrophes.** Figma stores `'` as `&#39;`, so the two `switch`
    descriptions were reworded.
19. **Temporary probes.** Two kinds were created and removed inside single calls:
    - the opacity and BOOLEAN-scope probe (collection `zz-probe-temp` and a rectangle);
    - the resolver frame (`zz-resolver-temp`).

    The file still has exactly 9 collections.

## Follow-ups (not done)

- **Specimen frames.** The Bloom, Cupertino, Liquid and Terminal frames still render through Theme
  Tonal, Glass and Signal. Switch them to Theme set B plus their Theme B mode when ready; today the
  values are identical.
- **Copied modes need tuning.** macOS 27, Apple Classic and Fluent 2 Web are straight copies of
  Glass and Fluent. Cupertino and Liquid are still identical, apart from Liquid's ring offset.
- **Terminal radii.** Terminal still carries Signal's radii (§4.3).

## Chart palettes: per-theme `chart/1` to `chart/5` (2026-10-31)

- **File:** `pGRLnkPPRZJZy74evNcQBr`, through `use_figma`. Run ledger: `ledger-chart-palettes.json`.
- **Why.** Scheme `chart/1` to `chart/5` were interim aliases of `primary`, `info`, `success`,
  `warning` and `destructive` `/default` (deviation 6 above). That caused three problems:
  - series carried status meaning (series 5 read as an error);
  - Utility showed red, which its rule allows only in the logo and error states;
  - series collided inside a theme (Brutal 1 = 4, Pixel 1 ≈ 4, Cupertino 1 ≈ 2).
- **Names are unchanged.** Scheme `chart/1` to `chart/5` keep their ids (`VariableID:241:107` to
  `241:111`), scopes (SHAPE_FILL, STROKE_COLOR) and code syntax (`var(--ns-chart-1)` …
  `var(--ns-chart-5)`). Every existing binding keeps working; only the values change.

### Architecture

The model is `shadow/l|d/color`: theme-level `l`/`d` variables, aliased through Theme set, then
picked per Scheme mode.

```
Scheme chart/N  ── Light → Theme set chart/l/N ── A → Theme chart/l/N   ── Studio mode → Studio flavor chart/l/N
                └─ Dark  → Theme set chart/d/N    └─ B → Theme B chart/l/N    other modes → literal (or exact Primitive)
```

- **40 new COLOR variables**, 10 per collection: `chart/l/1` … `chart/l/5` and `chart/d/1` …
  `chart/d/5` in Studio flavor, Theme, Theme B and Theme set.
- **Studio flavor** (`121:1087`, all 7 flavors):
  - series 1 aliases Base gray `gray/l/12` (Light) and `gray/d/12` (Dark), so it is the flavor's
    ink. Under Utility this resolves exactly like `marker/default` (`#202020` / `#eeeeee`).
  - series 2–5 are the same literals in every flavor (one shared Swiss set, no red).
  - Series 1 is ink in every flavor, not the flavor's marker: Cloud, Workshop, Playful, Ledger,
    Atelier and Signal markers are their accents, and Atelier's is tomato, which the no-red rule
    forbids.
- **Theme** (`2:330`): mode Studio aliases Studio flavor `chart/l|d/N`; the other 9 modes hold the
  theme's literal hex, or alias a Primitive when one has exactly that hex (7 cells, listed below).
- **Theme B** (`239:9`): literal hex in all 7 modes (Cupertino and Terminal series 1 Light alias a
  Primitive).
- **Theme set** (`239:156`): mode A aliases Theme `chart/l|d/N`, mode B aliases Theme B.
- **Scheme** `chart/N`: Light aliases Theme set `chart/l/N`, Dark aliases Theme set `chart/d/N`.
  Descriptions now read "Chart series N. Per-theme categorical palette: Theme set chart/l/N
  (Light) and chart/d/N (Dark)."
- **Scopes and code syntax.** The 40 intermediates are hidden (`scopes: []`), like the other Theme
  `l`/`d` intermediates. WEB syntax: `var(--ns-chart-l-N)` / `var(--ns-chart-d-N)` (Theme, Theme B,
  Theme set) and `var(--ns-studio-chart-l-N)` / `var(--ns-studio-chart-d-N)` (Studio flavor). Code
  can ignore the intermediates and emit `--ns-chart-1` … `--ns-chart-5` per theme and scheme.

| Variable | Studio flavor | Theme | Theme B | Theme set |
| --- | --- | --- | --- | --- |
| `chart/l/1` | `608:138397` | `608:138398` | `608:138399` | `608:138400` |
| `chart/l/2` | `608:138401` | `608:138402` | `608:138403` | `608:138404` |
| `chart/l/3` | `608:138405` | `608:138406` | `608:138407` | `608:138408` |
| `chart/l/4` | `608:138409` | `608:138410` | `608:138411` | `608:138412` |
| `chart/l/5` | `608:138413` | `608:138414` | `608:138415` | `608:138416` |
| `chart/d/1` | `608:138417` | `608:138418` | `608:138419` | `608:138420` |
| `chart/d/2` | `608:138421` | `608:138422` | `608:138423` | `608:138424` |
| `chart/d/3` | `608:138425` | `608:138426` | `608:138427` | `608:138428` |
| `chart/d/4` | `608:138429` | `608:138430` | `608:138431` | `608:138432` |
| `chart/d/5` | `608:138433` | `608:138434` | `608:138435` | `608:138436` |

All ids carry the `VariableID:` prefix.

**Scheme `chart/N`, before → after:**

| Variable | Light before | Dark before | Light after | Dark after |
| --- | --- | --- | --- | --- |
| `chart/1` | → `primary/default` | → `marker/default` (Data display 2 change) | → Theme set `chart/l/1` | → Theme set `chart/d/1` |
| `chart/2` | → `info/default` | → `info/default` | → Theme set `chart/l/2` | → Theme set `chart/d/2` |
| `chart/3` | → `success/default` | → `success/default` | → Theme set `chart/l/3` | → Theme set `chart/d/3` |
| `chart/4` | → `warning/default` | → `warning/default` | → Theme set `chart/l/4` | → Theme set `chart/d/4` |
| `chart/5` | → `destructive/default` | → `destructive/default` | → Theme set `chart/l/5` | → Theme set `chart/d/5` |

### Values, per mode and scheme

Series order is fixed per theme (series 1 first). Cells marked → alias the named Primitive, which
has exactly that hex.

| Collection | Mode (id) | Series order | Scheme | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Theme | Studio `2:1` | ink · blue · amber · teal · violet | Light | Studio flavor → Base gray `gray/l/12` | Studio flavor `#3372af` | Studio flavor `#a87520` | Studio flavor `#0a9088` | Studio flavor `#7559a2` |
| Theme | Studio `2:1` | ″ | Dark | Studio flavor → Base gray `gray/d/12` | Studio flavor `#5290cf` | Studio flavor `#b88433` | Studio flavor `#28a59d` | Studio flavor `#876bb6` |
| Theme | Ledger `2:5` | indigo · teal · ochre · plum · olive | Light | `#3e63dd` (→ `color/indigo/l/9`) | `#008d85` | `#a87520` | `#9b5084` | `#728431` |
| Theme | Ledger `2:5` | ″ | Dark | `#5472e4` (→ `color/indigo/d/10`) | `#1fa098` | `#b88433` | `#b96ba0` | `#849644` |
| Theme | Filigrane `2:6` | prussian ink · ochre · viridian · violet ink · sienna | Light | `#2b5991` | `#a17d27` | `#017558` | `#6c4494` | `#9a5328` |
| Theme | Filigrane `2:6` | ″ | Dark | `#5c8bc8` | `#b48f3c` | `#268e6e` | `#9970c4` | `#c1774c` |
| Theme | Signal `2:7` | phosphor · blue · cyan · amber · magenta | Light | `#5c7c2f` (→ `color/lime/l/11`) | `#2e62c9` | `#03919d` | `#ae7c02` | `#ab3ba5` |
| Theme | Signal `2:7` | ″ | Dark | `#72a305` | `#467de6` | `#17a7b4` | `#bc8600` | `#c252bb` |
| Theme | Tonal `14:0` | violet · teal · amber · rose · blue | Light | `#6550b9` (→ `color/violet/l/11`) | `#00928c` | `#a87520` | `#9e4573` | `#2d70b0` |
| Theme | Tonal `14:0` | ″ | Dark | `#927ad2` | `#2ba8a2` | `#b98535` | `#c66897` | `#4e90d2` |
| Theme | Glass `14:1` | blue · green · purple · orange · teal | Light | `#0d74ce` (→ `color/blue/l/11`) | `#019437` | `#9b45c6` | `#b86b05` | `#008ea3` |
| Theme | Glass `14:1` | ″ | Dark | `#0e79e9` | `#049e3c` | `#b55fe1` | `#cd7703` | `#0ca0b7` |
| Theme | Brutal `14:2` | yellow · blue · pink · lime · purple | Light | `#b58404` | `#1779e1` | `#d83486` | `#659003` | `#7154ce` |
| Theme | Brutal `14:2` | ″ | Dark | `#bb8800` | `#207fe8` | `#e33f8f` | `#72a305` | `#886de9` |
| Theme | Fluent `52:0` | accent blue · pumpkin · seafoam · purple · green | Light | `#005fb8` | `#c15626` | `#019195` | `#7754a7` | `#558a28` |
| Theme | Fluent `52:0` | ″ | Dark | `#3086d9` | `#d96b3d` | `#26a7ac` | `#8a67bc` | `#5e9332` |
| Theme | Tactile `52:1` | blue · green · violet · amber · cyan | Light | `#467ac6` | `#288b63` | `#6a569c` | `#9d671c` | `#08899f` |
| Theme | Tactile `52:1` | ″ | Dark | `#5c91df` | `#44a279` | `#816eb6` | `#bb843e` | `#269db5` |
| Theme | Pixel `52:2` | amber · teal · rust · blue · green | Light | `#b87501` | `#019096` | `#ae4b25` | `#1777b8` | `#58883b` |
| Theme | Pixel `52:2` | ″ | Dark | `#c67f09` | `#1aa0a7` | `#ba5530` | `#3890d2` | `#649447` |
| Theme B | Bloom `239:0` | purple · tangerine · sky · lime · rose | Light | `#6f3e9d` | `#c46016` | `#067d9f` | `#678800` | `#af4d80` |
| Theme B | Bloom `239:0` | ″ | Dark | `#9464c5` | `#d7712e` | `#389ec1` | `#7ca025` | `#c96598` |
| Theme B | Cupertino `239:1` | blue · green · purple · orange · teal | Light | `#0d74ce` (→ `color/blue/l/11`) | `#019437` | `#9b45c6` | `#b86b05` | `#008ea3` |
| Theme B | Cupertino `239:1` | ″ | Dark | `#0e79e9` | `#049e3c` | `#b55fe1` | `#cd7703` | `#0ca0b7` |
| Theme B | Liquid `239:2` | blue · green · purple · orange · indigo | Light | `#0063e1` | `#019437` | `#a82eb9` | `#c06404` | `#5d57de` |
| Theme B | Liquid `239:2` | ″ | Dark | `#0381e4` | `#049e3c` | `#c24bd3` | `#d67000` | `#7270fa` |
| Theme B | Terminal `239:3` | phosphor · blue · cyan · amber · magenta | Light | `#5c7c2f` (→ `color/lime/l/11`) | `#2e62c9` | `#03919d` | `#ae7c02` | `#ab3ba5` |
| Theme B | Terminal `239:3` | ″ | Dark | `#72a305` | `#467de6` | `#17a7b4` | `#bc8600` | `#c252bb` |
| Theme B | macOS 27 `239:4` | blue · green · purple · orange · cyan | Light | `#1e6ef4` | `#008932` | `#cb30e0` | `#c55300` | `#007eae` |
| Theme B | macOS 27 `239:4` | ″ | Dark | `#0091ff` | `#30d158` | `#db34f2` | `#ff9230` | `#3cd3fe` |
| Theme B | Apple Classic `239:5` | blue · green · purple · orange · cyan | Light | `#007aff` | `#248a3d` | `#af52de` | `#c55300` | `#0071a4` |
| Theme B | Apple Classic `239:5` | ″ | Dark | `#0a84ff` | `#30d158` | `#bf5af2` | `#ff9f0a` | `#64d2ff` |
| Theme B | Fluent 2 Web `239:6` | cornflower · hot pink · light green · teal · orchid | Light | `#637cef` | `#e3008c` | `#13a10e` | `#038387` | `#9373c0` |
| Theme B | Fluent 2 Web `239:6` | ″ | Dark | `#637cef` | `#e3008c` | `#13a10e` | `#2aa0a4` | `#8764b8` |

**Studio flavors** resolve series 2–5 identically. Series 1 is each flavor's Base gray 12:

| Studio flavor (mode id) | Base gray preset | Series 1 Light | Series 1 Dark |
| --- | --- | --- | --- |
| Utility `121:0`, Signal `137:2` | Neutral | `#202020` | `#eeeeee` |
| Cloud `121:1`, Ledger `137:0` | Slate | `#1c2024` | `#edeef0` |
| Workshop `121:2`, Atelier `137:1` | Sand | `#21201c` | `#eeeeec` |
| Playful `121:3` | Mauve | `#211f26` | `#eeeef0` |

### How each palette was chosen

- **Method.** The dataviz skill's colour formula: hues from the theme's own families, then lightness
  stepped per scheme until every series clears 3:1 on every chart surface of that theme. Surfaces
  checked: `surface/bg`, `card/bg` (composited where it is translucent), `surface/card`, and the
  theme's own card or base surface where one exists (`cupertino/surface-*`, `liquid/surface/*`,
  `fluent/solid/base`). Each ordering was then searched for the best worst-adjacent CVD separation
  (Machado 2009, protan and deutan) with the normal-vision floor (ΔE ≥ 15). A secondary goal was to
  keep the first three series apart, so short charts look good.
- **Dark is designed.** Dark values are picked for the dark surfaces, inside the dark band
  (OKLCH L 0.48–0.67), not inverted from light.
- **No status meaning.** No series equals a status tone (`info`, `success`, `warning`,
  `destructive` `/default` or `/text`) in either scheme. No theme uses destructive red: Filigrane
  drops vermilion, and Pixel's rust (`#ae4b25` / `#ba5530`, OKLCH hue 40) is terracotta, not red.
- **Utility and the Studio flavors:** ink, then steel blue, ochre, teal and violet at OKLCH
  C 0.10–0.12 (desaturated, Swiss). No red in any series.
- **Faithful modes** use published platform values:
  - **macOS 27:** Apple system colours, HIG 2025. Increased-contrast variants in Light, because the
    defaults fall below 3:1 on light surfaces; defaults in Dark.
  - **Apple Classic:** Apple's pre-2025 system colours. Accessible variants in Light; orange uses
    the current increased-contrast orange `#c55300`, because classic `#ff9500` is about 2:1 and the
    classic accessible `#c93400` reads as red.
  - **Fluent 2 Web:** Fluent UI charting `DataVizPalette` `color1`–`color5` (cornflower, hot pink,
    teal, orchid, light green). Teal uses the published `teal.primary` `#038387` in Light, because
    `#2aa0a4` is 2.84:1. Orchid uses `orchid.primary` `#8764b8` in Dark.
  - In all three, the published order is changed only where an adjacent pair failed CVD. Swift
    Charts puts green next to orange, and Fluent 2 puts teal next to hot pink. Both pairs fall below
    ΔE 6 under deuteranopia.

### Validator results

`scripts/validate_palette.js` from the dataviz skill was run per theme mode × scheme × chart
surface: 145 runs, adjacent pairlist. The raw output is in
`review/chart-palettes/validator/validator-output.txt`, and one JSON row per run is in
`validator-summary.json`. There are no contrast WARNs and no CVD WARNs.

| Mode | Light: worst adjacent CVD ΔE / normal ΔE / min contrast | Dark: worst adjacent CVD ΔE / normal ΔE / min contrast | Validator verdict |
| --- | --- | --- | --- |
| Studio·Utility | 10.3 / 18 / 3.63:1 | 10.5 / 18.4 / 3.81:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Cloud | 10.3 / 18 / 3.46:1 | 10.5 / 18.4 / 3.54:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Workshop | 10.3 / 18 / 3.37:1 | 10.5 / 18.4 / 3.68:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Playful | 10.3 / 18 / 3.39:1 | 10.5 / 18.4 / 3.75:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Ledger | 10.3 / 18 / 3.62:1 | 10.5 / 18.4 / 3.86:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Atelier | 10.3 / 18 / 3.60:1 | 10.5 / 18.4 / 4.07:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Studio·Signal | 10.3 / 18 / 3.40:1 | 10.5 / 18.4 / 4.24:1 | Fails band + chroma on slot 1 only (ink, by rule); series 2–5 pass every check |
| Ledger | 12.3 / 18.1 / 3.82:1 | 12.4 / 17.4 / 4.11:1 | All checks pass (0) |
| Filigrane | 9.8 / 17.8 / 3.64:1 | 8.5 / 16.8 / 4.34:1 | All checks pass (0) |
| Signal | 15.5 / 16.3 / 3.60:1 | 14.7 / 15.5 / 4.69:1 | All checks pass (0) |
| Tonal | 11 / 18.3 / 3.35:1 | 9.7 / 16.6 / 4.39:1 | All checks pass (0) |
| Glass | 17.5 / 23.2 / 3.42:1 | 19.2 / 25.1 / 3.61:1 | All checks pass (0) |
| Brutal | 11.6 / 30 / 3.22:1 | 12.8 / 30.2 / 3.27:1 | All checks pass (0) |
| Fluent | 10.7 / 19.7 / 3.45:1 | 10.8 / 20.1 / 3.68:1 | All checks pass (0) |
| Tactile | 14.5 / 17.9 / 3.26:1 | 14.1 / 17.9 / 3.18:1 | All checks pass (0) |
| Pixel | 14.6 / 20.7 / 3.28:1 | 15.4 / 20.5 / 3.18:1 | All checks pass (0) |
| Bloom | 12.8 / 19.6 / 3.88:1 | 13.2 / 19.8 / 4.13:1 | All checks pass (0) |
| Cupertino | 17.5 / 23.2 / 3.42:1 | 19.2 / 25.1 / 3.61:1 | All checks pass (0) |
| Liquid | 21 / 27.7 / 3.49:1 | 20.8 / 27.9 / 3.57:1 | All checks pass (0) |
| Terminal | 15.5 / 16.3 / 3.60:1 | 14.7 / 15.5 / 4.69:1 | All checks pass (0) |
| macOS 27 | 20.6 / 28.1 / 3.66:1 | 24.6 / 30.3 / 3.95:1 | Light passes; dark fails the lightness band (published Apple dark green, orange, cyan sit at L 0.76–0.81) |
| Apple Classic | 19.7 / 27.8 / 3.53:1 | 25.5 / 28.8 / 4.21:1 | Light passes; dark fails the lightness band (published Apple dark green, orange, cyan sit at L 0.76–0.82) |
| Fluent 2 Web | 8.6 / 17.9 / 3.09:1 | 10.2 / 17.2 / 3.53:1 | Fails the chroma floor on teal only (published teal C 0.094 light, 0.0999 dark) |

ΔE is OKLab ×100. The CVD figure is the worst adjacent pair under protanopia or deuteranopia. Min
contrast is the lowest series-on-surface ratio across every chart surface of that mode.

### Verification

- **Resolver.** `resolveForConsumer` on a temporary off-canvas frame, removed in the same call. It
  covered 23 scenarios × Light and Dark: 7 Studio flavors with their presets, the 9 other Theme
  modes, and the 7 Theme B modes with Theme set B. Result: 46 of 46 scenario/scheme tuples, 230
  values in all, equal the planned hex, with 0 mismatches.
- **Screenshots** (`review/chart-palettes/`):
  - `dd2-themes-strip.png`: Data display 2 themes strip `585:174804`;
  - `review-chart.png`: Chart review `583:17163`;
  - `review-chart-block.png`: Chart block review `583:75404`;
  - `review-donut.png`: Donut review `583:75859`;
  - `palette-sheet.png`: the new sheet.
  
  All show the new palettes; no stale paint was seen, so no paint was re-seeded.
- **Palette sheet.** It is on the Foundations page (`229:338`):
  - section label `608:375300` "Chart palettes";
  - sheet `608:375304` "Foundations · Chart palettes": 17 rows (one per Theme and Theme B mode),
    each with Light and Dark cells. Each cell has five bound swatches with the resolved hex, plus a
    mini line chart and a grouped bar chart. The charts sit on `card/bg`, with the card radius bound
    to `radius/card`.
  
  The Foundations draft area (`234:10485`, `4:3`) moved 200 px below the sheet.
- **Stale copy fixed** on the Data display page. These texts described `chart/2…5` as status
  colours:
  - the strip intro;
  - both Chart and Donut review headers ("Failed is the only red" removed);
  - the "Themes · part 2" section-label note.
- **Binding census** (Data display page only): nodes binding Scheme `chart/1…5` are:
  - Card sets `409:222`: 39;
  - Chart sets: 103;
  - Chart block sets: 54;
  - Donut sets: 61;
  - Chart review: 136;
  - Chart block review: 140;
  - Donut review: 114;
  - themes strip: 84.
  
  Other pages (screens, theme pages, docs site) were not censused. Anything there that binds
  `chart/*` now shows its theme's palette.

### Compromises

- **Studio ink.** Series 1 is ink (C ≈ 0; L 0.24 Light, 0.95 Dark), so the validator's lightness-band
  and chroma checks fail on slot 1 by design. Series 2–5 pass every check on their own.
- **macOS 27 and Apple Classic, Dark.** The published Apple dark green, orange and cyan sit above
  the dark band (L 0.76–0.82). They are kept faithful; contrast and CVD pass.
- **macOS 27 series 1.** Dark is Apple blue `#0091ff`, which is ΔE 0.3 from `info/default`
  `#0090ff` (Radix blue 9): close, not equal. Light uses the increased-contrast blue `#1e6ef4`
  (ΔE 8.5 from info). No published Apple dark blue avoids the info tone.
- **Fluent 2 Web teal.** The published teal is just under the chroma floor (C 0.094 Light, 0.0999
  Dark).
- **Band-limited identity colours.** These theme colours step down to chart weight to stay ≥ 3:1
  and inside the dark band:
  - Brutal yellow is mustard: `#b58404` / `#bb8800`;
  - Pixel amber: `#b87501` / `#c67f09`;
  - Terminal phosphor: `#5c7c2f` / `#72a305`.
  
  The bright identity colours (`#ffc53d`, `#faab35`, `#bdee63`) stay on `marker/default` and
  `primary`. `#ffc53d` is also `warning/default`, so it could not be a series anyway.
- **Shared values.** Some hues repeat across related modes:
  - Signal = Terminal and Glass = Cupertino, on purpose;
  - Studio, Ledger and Tonal share ochre `#a87520`;
  - Cupertino and Liquid share green `#019437` / `#049e3c`.

### Code follow-up

- Mirror the values table into the theme CSS: per theme, `--ns-chart-1` … `--ns-chart-5` for
  Light and Dark.
- The Data display 2 follow-up "`--ns-chart-1` dark follows `--ns-marker`" is superseded.
  `chart/1` is its own per-theme token now. Under Utility it still equals the marker ink in both
  schemes.
- The Donut and Chart fixtures name categories after statuses (Delivered, Paid, Pending, Failed).
  The dataviz rule says a series that means good or bad wears status tokens. Rename the fixtures to
  neutral categories, or bind status tones for a status breakdown.

### Rollback

- Point Scheme `chart/1…5` back to the "before" aliases in the table above.
- Delete the 40 `chart/l|d/N` variables.
- Delete the sheet and section label (`608:375304`, `608:375300`).
- Move the draft area back: `234:10485` to y 44337 and `4:3` to y 44389.
