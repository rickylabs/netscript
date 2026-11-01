# Shared variables: apply first (one agent)

- **File:** `pGRLnkPPRZJZy74evNcQBr`.
- **Role.** This is the only step of the theme character pass that touches shared variables. It
  runs before any style builder starts. Builders never edit variables or base sets.
- **Values:** `../theme-character.md` §1.0 (bold cells) and §2.3 (bold cells).
- **Collections:** Theme `VariableCollectionId:2:330` and Theme B `VariableCollectionId:239:9`.
- **Mode ids:**
  - Theme: Tonal `14:0`, Brutal `14:2`, Fluent `52:0`, Tactile `52:1`, Pixel `52:2`, Filigrane
    `2:6`;
  - Theme B: Bloom `239:0`, Cupertino `239:1`, Liquid `239:2`, Terminal `239:3`, macOS 27 `239:4`,
    Apple Classic `239:5`, Fluent 2 Web `239:6`.

## Do not touch

- **Modes:** Theme `Studio` (`2:1`), `Ledger` (`2:5`), `Signal` (`2:7`) and `Glass` (`14:1`).
- **Collections:** every Studio flavor mode, and Primitives, Scheme, Density, Base gray, Base accent
  and Theme set.
- **Nodes:** base component sets, and the crafted frames and kits on the theme pages.
- **New variables:** none in this step. The optional `radius/pill` (theme-character §3) is skipped
  by default.

## Steps

One `use_figma` mutation at a time. Before step 1, wait until no other agent is mid-mutation (the
B6 Data display build).

1. **Baseline.**
   - Screenshot the frames listed under "Verification" (maxDimension 1600) into
     `verify/theme-character/before/`.
   - Export the Theme and Theme B collections to JSON in the same folder.
2. **Theme values.** For each Theme-collection mode in scope, set every bold §1.0 cell:
   - a number or string becomes a literal;
   - `→x` becomes an alias to the same collection's variable `x`.
   
   Several cells replace an alias with a literal (for example Pixel `card/border-*` from
   `→border/width` to `1`); write the literal.
3. **Theme B values.** The same for Bloom, Cupertino, Liquid and Terminal.
   - Then copy the sibling's new values into the faithful modes: macOS 27 ← Liquid, Fluent 2 Web
     ← Fluent, Apple Classic ← Cupertino.
   - Apple Classic then takes `radius/control` 6 and `frame/inset` 0.
4. **Font faces.** Load these before any mode switch or screenshot:
   - Funnel Sans (Regular, Medium) and Funnel Display (Regular);
   - Geist Mono (Regular, Medium);
   - Nunito Sans (Light, Regular, SemiBold);
   - Newsreader Light;
   - Space Grotesk Bold;
   - Inter (Regular, Medium, Semi Bold, Bold).
   
   Then re-run the face check used for `type/eyebrow/style` and `type/mono-strong/style`: every
   `font/*` × `type/*/style` pair a text role binds must exist as a face in all 10 Theme modes and
   all 7 Theme B modes. A missing face is a blocker: report it, don't substitute.
5. **Colour values.** For each theme in §2.3, set the bold `l`/`d` cells of the named Theme or
   Theme B variable.
   - Write a literal hex, or alias a Primitive with exactly that hex.
   - Never alias a Scheme role from a Theme `l`/`d` variable.
   - Copy the Liquid, Cupertino and Fluent colour changes into macOS 27, Apple Classic and Fluent
     2 Web.
6. **`card/bg`.** Set the Theme and Theme B `card/{l,d}/bg` values from theme-character §2.4
   (added by B6), and copy them to the faithful modes.
7. **Re-seed paints.** On the themes strips, re-seed every bound paint with its newly resolved
   colour (the stale-paint trap in component-spec §0.4).
8. **Record.** In `state.json`:
   - add `"T0-shared-variables (theme character §1–§2)"` to `completedSteps`;
   - add a dated entry under `addedVariables` that says "values only, no new names".

## Verification

| Check | Frames | Expected |
| --- | --- | --- |
| Studio unchanged | Studio flavor frames `10:4277`, `10:5518`, `10:4587`, `10:5828`, `10:4897`, `10:6138`, `10:5207`, `10:6448`, `10:6759`, `10:7690`, `10:7069`, `10:8000`, `10:8310`, `10:7379` | 0.0000% pixel diff |
| Crafted frames unchanged | Tonal `23:277` `25:295` `47:527` `47:857`; Bloom `108:894` `110:1006`; Cupertino `30:22` `32:169`; Liquid `133:1088` `133:1150`; Fluent `155:737` `158:922` `159:1106`; Brutal `34:9` `35:199`; Filigrane `38:9` `38:309`; Terminal `41:297` `41:2`; Pixel `66:433` `68:917` `162:8708` `162:9408`; Tactile `144:1744` `145:1115` `146:856` | 0.0000% pixel diff. A non-zero diff means the frame binds a changed variable: revert that single value and list it in theme-character §5 |
| Structural digest | All 9 collections, as in `variables-change.md` | Only Theme and Theme B digests change; the change set equals the bold cells |
| Resolver sample | `resolveForConsumer` on a temporary off-canvas frame (remove it in the same call): `tabs/track`, `card/border`, `kpi/bg-1`, `nav/active`, `topbar/bg`, `effect/control-shadow`, `border/input` and `primary/default`, per theme, Light and Dark | Equal to the §2.3 values |
| Themes strips | Actions `264:7542`, Forms `289:3256` and `320:17132`, Navigation `360:6958`, Overlays `390:6219`, Data display `427:11395` | See "Expected visible change" |
| Foundations | Colour roles `234:19` (15 presets) | The non-Studio preset swatches change as §2; the Studio swatches are identical |

## Expected visible change in the strips

- **Studio:** identical.
- **Tonal:**
  - cards, panels and KPI tiles lose borders and shadows;
  - menus keep the 0 3 8 float;
  - tabs lose their track and the selected tab takes `primary-container`;
  - nav selected takes `primary-container`.
- **Brutal:**
  - panel strokes, the top-bar rule and table rules turn ink black in both schemes;
  - tabs join (−2 gap) with 2px control borders;
  - card shadows become 6/6 slabs;
  - avatars become r6.
- **Pixel:**
  - every interactive stroke is 2px;
  - buttons stand on a 4px sand lip that disappears when pressed;
  - panels keep 1px `frame-ink` frames;
  - the display style drops to 40/48.
- **Fluent:**
  - cards become white 70% with `stroke-card` and no shadow;
  - inputs take the strong control stroke;
  - badges become r4;
  - tabs lose their track and box.
- **Cupertino (set B):**
  - the segmented track is `material-track` r9 with r7 thumbs;
  - cards have material rims and no shadow;
  - nav selected is `material-track`.

Bloom, Liquid, Terminal, Filigrane and Tactile are not in today's strips (six themes: Utility,
Tonal, Brutal, Pixel, Fluent, Cupertino). For a quick check, add one row each with explicit modes:

- **Bloom:** Funnel type, 28 capsules, 32 cards.
- **Liquid:** 13/17 Inter, 46×28 switch, grey nav selection.
- **Terminal:** everything Geist Mono at 14/24, square controls.
- **Filigrane:** underline tabs, a 1.5 icon stroke, Light display.
- **Tactile:** plateau shade, Nunito 16/22, key-bank tabs.

## Rollback

Every change is a value change. The `before/` collection export restores it: set each changed cell
back to its exported value.
