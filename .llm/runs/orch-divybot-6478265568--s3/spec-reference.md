# Fresh UI Figma component library: build spec

Phase B of `plan.md` (file `pGRLnkPPRZJZy74evNcQBr`). Written 2026-10-28 as research only: no Figma,
git or repository edits.

**Inputs read**

- Code inventory from `origin/main`:
  - `packages/fresh-ui/registry.manifest.ts`: 66 items (36 components, 11 blocks, 5 islands, plus
    libs and styles);
  - every visual component's `registry/components/ui/<name>.tsx` and its CSS;
  - the package-owned runtime that the registry does not list: `src/runtime/*` (Accordion,
    ActionMenu, Combobox, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip) and `src/presentation/*`
    (DataGrid, Icon);
  - `registry/styles/layouts.css`.
- shadcn/ui: the component index at <https://ui.shadcn.com/docs/components>, fetched 2026-10-28. It
  lists 66 entries, including Code Block and Trace, which are marked new. I also fetched the pages
  for Attachment, Bubble, Marker, Message, Message Scroller, Questionnaire, Trace, Code Block,
  Direction, Button, Avatar, Badge, Item, Field, Toast, Tabs, Input Group and Empty. Every other
  component's variants come from my own knowledge of shadcn/ui; §4.8 lists the ones to check before
  their P1 sets are built.
- Issue #2416 (the S3 contract and its gap list), and `docs-site.md` §11 (G-1 to G-18) together with
  §4–§9 of that file.
- The Figma variables export `figma-variables/` (README, index, scheme, theme, density, Studio
  flavor). Values were resolved with a local alias resolver.
- `docs/design-system/themes/<id>/DESIGN.md`, sections Elevation & Depth, Shapes and Components, for
  the ten themes, plus Studio's Components and Shapes sections, because Studio is the base anatomy.

---

## 0. Conventions (apply to every component)

### 0.1 Files, pages, names

- **Base components** go on the category pages (`Components · <Category>`, ids in `state.json`).
  Language variants go on their theme page (`Theme · <Name>`), in a section called "Language
  components".
- **Component set names:**
  - base sets use `<Component>`, or `<Component> / <size>` when the set is split by size;
  - language variants use `<Theme>/<Component>` (for example `Pixel/Button / md`). Each one has
    **the same property names and values and the same part layer names** as its base set, so an
    instance swap keeps every override.
  - Several kits already exist and should be renamed and moved, not rebuilt: `Brutal/Button`,
    `Filigrane/Button`, `Terminal/Key`, and the `Tactile` `H+2 key/*` nodes. Rename `Glass/Button`
    to `Cupertino/Button`, because Cupertino and Liquid share the Glass mode and the name would
    collide.
- **Layer names = `data-part`.** The root layer is `root`, and parts are kebab-case. Parts mirror
  the code's BEM element (`ns-card__header` → `header`) or its existing `data-part`
  (`trigger`, `content`, `title`, `description`, `close`, `arrow`, `item-trigger`…). Parts of
  components that exist only in shadcn take the kebab-cased shadcn sub-component name without the
  component prefix (`InputGroupAddon` → `addon`).
- **Private helpers.** These are not published, and their names start with `.`:
  - `.Focus ring`;
  - `.State layer`;
  - `.Slot`, an instance-swap placeholder (a 1px dashed `border/subtle` frame labelled "slot").

### 0.2 Properties

- **Variant properties** use the S3 data-attribute names:
  - `variant`, `size`, `state`;
  - `tone`, `side`, `placement`, `orientation`, `align`, `status`, `intent`, `role` and `type`,
    where the code already uses that name;
  - `checked`, `selected`, `open` and `emphasis`, as two-value or three-value variants, when a
    state is orthogonal to interaction.
- **`state` values:** `rest`, `hover`, `pressed`, `focus`, `disabled`, and, where they apply,
  `selected`, `open`, `invalid`, `invalid-focus` and `loading`. Hover is the pointer state;
  `pressed` is the CSS `:active` state, not `aria-pressed`.
- **Boolean properties** toggle a part's visibility: `iconStart`, `iconEnd`, `description`, `close`,
  `footer`, and so on.
- **Instance-swap properties** carry the `Glyph` or `Content` suffix: `iconStartGlyph`, `media`,
  `control`. Text properties: `label`, `value`, `placeholder`, `title`, `description`.
- **Cap.** A set has at most 30 variant combinations. Booleans and swaps do not count. When the
  product exceeds 30, split the set by `size`, or else by the least-switched property, and record
  the split in the component's block.

### 0.3 Binding notation

| Notation                 | Means                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `surface/card`           | A **Scheme** role. Colour names without a prefix are always Scheme.                                                                                                                                                                                                                                          |
| `radius/control`         | A **Theme** variable: `radius/*`, `font/*`, `type/*`, `shadow/blur`, `shadow/y`, `border/width`. Always bind the Theme variable, never its Studio flavor twin; Theme mode `Studio` aliases Studio flavor.                                                                                                     |
| `space/control/height`   | A **Density** variable.                                                                                                                                                                                                                                                                                      |
| `SF:tabs/gap`            | A Studio flavor variable that has no Theme twin. It follows only the Studio flavor mode (see §4.2).                                                                                                                                                                                                          |
| `+name (interim x)`      | A **missing** variable (§4.1). Bind `x` until `+name` exists, then rebind. `interim lit N` means an unbound literal.                                                                                                                                                                                       |
| `<tone>/default`         | One of the status families `primary`, `secondary`, `success`, `warning`, `destructive`, `info`, `accent`, with suffix `default`, `hover`, `fg`, `subtle`, `border` or `text`.                                                                                                                                  |
| `H.md` `H.sm` `H.lg` `H.xs` | `space/control/height` · `space/control/height-sm` · `+space/control/height-lg (interim lit 44)` · `+space/control/height-xs (interim lit 24)`.                                                                                                                                                             |
| `PX` `PX.sm` `GAP`       | `space/control/padding-x` · `+space/control/padding-x-sm (interim lit 10)` · `space/control/gap`.                                                                                                                                                                                                            |
| `I.sm` `I.md` `I.lg`     | Icon box size: `+size/icon/sm (interim lit 14)` · `+size/icon/md (16)` · `+size/icon/lg (20)`.                                                                                                                                                                                                              |

**Text roles.** Bind all five text properties: `fontFamily`, `fontStyle`, `fontSize`, `lineHeight`
and `letterSpacing`.

| Shorthand   | fontFamily                              | size, line, style, tracking                                                                     |
| ----------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `T.body`    | `font/sans`                             | `type/body/*`                                                                                   |
| `T.strong`  | `font/sans`                             | `type/strong/*`                                                                                 |
| `T.small`   | `font/sans`                             | `type/small/*`                                                                                  |
| `T.strong-sm` | `font/sans`                           | `type/small/size`, `type/small/line`, `type/strong/style`, `type/small/tracking`                |
| `T.caption` | `font/sans`                             | `type/caption/*`                                                                                |
| `T.label`   | `font/label`                            | `type/label/*`                                                                                  |
| `T.eyebrow` | `+font/eyebrow (interim font/mono)`     | `type/label/*`, text case UPPER (text case cannot be bound; see §4.4)                           |
| `T.heading` | `font/heading`                          | `type/heading/*`                                                                                |
| `T.title`   | `font/heading`                          | `type/title/*`                                                                                  |
| `T.display` | `font/heading`                          | `type/display/*`                                                                                |
| `T.kpi`     | `font/kpi`                              | `type/kpi/*`                                                                                    |
| `T.kpi-sm`  | `font/kpi`                              | `type/kpi-sm/size`, `type/kpi-sm/line`, `+type/kpi-sm/style (interim type/kpi/style)`, `+type/kpi-sm/tracking (interim type/kpi/tracking)` |
| `T.data`    | `font/data`                             | `type/small/*` (IDs, dates, amounts, counts)                                                     |
| `T.mono`    | `font/mono`                             | `+type/code/* (interim type/small/*)` (code, paths, kbd)                                        |

### 0.4 Shared recipes

Each block names these recipes instead of repeating them.

- **R.focus.** Show the `focus-ring` part: an absolute child at -2px on every side of `root`, with a
  2px OUTSIDE stroke in `border/ring` (`+focus/ring-width`, interim lit 2) and a radius equal to
  root's radius variable. The 2px gap is transparent, which matches Studio's
  `outline: 2px; outline-offset: 2px`. Use this stroke ring rather than effects: a spread
  DROP_SHADOW needs a filled node with `clipsContent`, and that breaks ghost and link controls.
- **R.hover / R.pressed.** Show the `state-layer` part: an absolute fill-container child whose fill
  is the variant's foreground role (`text/fg` on unfilled variants). Its layer opacity is
  `+state/hover-opacity (interim lit 0.08)` or `+state/pressed-opacity (interim lit 0.12)`. Use
  layer opacity, because `paint.opacity` on a bound fill is dropped. Filled primary and destructive
  controls swap to `<tone>/hover` instead.
- **R.disabled.** Root layer opacity `+state/disabled-opacity (interim lit 0.38)`. The hidden
  `state/disabled-container` and `state/disabled-fg` roles serve themes that disable with fills
  (Tonal), not the base library.
- **R.invalid.** Root stroke `destructive/default`. Helper text in `destructive/text`, with an
  `alert-circle` icon in `destructive/text`.
- **R.selected.** Fill `surface/selected`. Where noted, add the `marker` part:
  `+marker/default (interim studio/signal/marker)`.
- **R.float** (popover, menu, toast, hover card, floating bar):
  - fill `surface/raised`;
  - stroke `border/default`, weight `border/width`;
  - radius `radius/card`;
  - DROP_SHADOW: colour `+effect/shadow-overlay (interim effect/shadow)`, x 0,
    y `+shadow/overlay/y (interim shadow/y)`, blur `+shadow/overlay/blur (interim shadow/blur)`.
- **R.card-shadow.** DROP_SHADOW: colour `effect/shadow`, x `+shadow/x (interim SF:shadow/x)`, y
  `shadow/y`, blur `shadow/blur`. These are 0 in Utility, Ledger, Atelier, Signal, Filigrane and
  Pixel, so the effect is invisible there.
- **R.scrim.** A full-bleed `backdrop` frame filled with `surface/overlay`.
- **Build traps** (verified in this file, from memory):
  - When binding a paint, seed it with the resolved colour, or the renderer may paint the stale
    stored colour.
  - Keep 1px rules on whole pixels: check `absoluteTransform`.
  - Load the Noto fallback fonts before switching modes on frames.

---

## 1. Inventory

104 rows. Two of them are non-visual and get no component set (L12 Direction, K6 Desktop only), so
**102 component sets are built** (base only, before language variants). The `Exists` column means
that Fresh UI code renders the component today on `origin/main`, through the registry or the
package runtime.

| ID  | Page            | Figma name            | Source                                                              | Exists | P  |
| --- | --------------- | --------------------- | ------------------------------------------------------------------- | ------ | -- |
| Z1  | Foundations     | Icon                  | code `Icon` (`src/presentation/primitives.tsx`, 16 glyphs)          | yes    | P0 |
| A1  | Actions         | Button                | shadcn Button · registry `button` · G-11                            | yes    | P0 |
| A2  | Actions         | Icon button           | registry `icon-button` · shadcn Button `size=icon*`                 | yes    | P0 |
| A3  | Actions         | Button group          | shadcn Button Group                                                 | no     | P1 |
| A4  | Actions         | Toggle                | shadcn Toggle                                                       | no     | P1 |
| A5  | Actions         | Toggle group          | shadcn Toggle Group                                                 | no     | P1 |
| A6  | Actions         | Action bar            | code DataGrid `bulk-actions` region                                 | yes    | P2 |
| A7  | Actions         | Theme toggle          | registry `theme-toggle` (island)                                    | yes    | P2 |
| F1  | Forms           | Label                 | shadcn Label · registry `label` · G-4 (eyebrow)                     | yes    | P0 |
| F2  | Forms           | Input                 | shadcn Input · registry `input`                                     | yes    | P0 |
| F3  | Forms           | Textarea              | shadcn Textarea · registry `textarea`                               | yes    | P0 |
| F4  | Forms           | Select                | shadcn Select + Native Select · registry `select` (native)          | yes    | P0 |
| F5  | Forms           | Checkbox              | shadcn Checkbox · registry `checkbox`                               | yes    | P0 |
| F6  | Forms           | Radio group           | shadcn Radio Group                                                  | no     | P0 |
| F7  | Forms           | Switch                | shadcn Switch · registry `switch`                                   | yes    | P0 |
| F8  | Forms           | Field                 | shadcn Field · registry `form-field`                                | yes    | P0 |
| F9  | Forms           | Input group           | shadcn Input Group                                                  | no     | P1 |
| F10 | Forms           | Input OTP             | shadcn Input OTP                                                    | no     | P1 |
| F11 | Forms           | Slider                | shadcn Slider                                                       | no     | P1 |
| F12 | Forms           | Combobox              | shadcn Combobox · code runtime `Combobox`                           | yes    | P1 |
| F13 | Forms           | Calendar              | shadcn Calendar                                                     | no     | P1 |
| F14 | Forms           | Date picker           | shadcn Date Picker                                                  | no     | P1 |
| F15 | Forms           | Search                | registry `search`                                                   | yes    | P0 |
| F16 | Forms           | Dropzone              | registry `dropzone`                                                 | yes    | P2 |
| N1  | Navigation      | Breadcrumb            | shadcn Breadcrumb · registry `breadcrumb`                           | yes    | P0 |
| N2  | Navigation      | Pagination            | shadcn Pagination · registry `pagination` · G-9 (Pager)             | yes    | P0 |
| N3  | Navigation      | Tabs                  | shadcn Tabs · code runtime `Tabs`                                   | yes    | P0 |
| N4  | Navigation      | Sidebar               | shadcn Sidebar · registry `sidebar-shell` (nav)                     | yes    | P0 |
| N5  | Navigation      | Top bar               | #2416 responsive top bar · G-14 DocsTopBar · `sidebar-shell` topbar | yes    | P0 |
| N6  | Navigation      | Navigation menu       | shadcn Navigation Menu · G-14 TopNav                                | no     | P1 |
| N7  | Navigation      | Menubar               | shadcn Menubar                                                      | no     | P1 |
| N8  | Navigation      | Location marker       | G-5                                                                 | no     | P0 |
| N9  | Navigation      | Stepper               | G-8 (Stepper / LearningPath)                                        | no     | P2 |
| N10 | Navigation      | Sidebar toggle        | registry `sidebar-toggle` (island)                                  | yes    | P2 |
| O1  | Overlays        | Dialog                | shadcn Dialog · code runtime `Dialog`                               | yes    | P0 |
| O2  | Overlays        | Alert dialog          | shadcn Alert Dialog                                                 | no     | P1 |
| O3  | Overlays        | Sheet                 | shadcn Sheet · code runtime `Sheet` · registry `sheet-styles`       | yes    | P0 |
| O4  | Overlays        | Drawer                | shadcn Drawer · code runtime `Drawer`                               | yes    | P1 |
| O5  | Overlays        | Popover               | shadcn Popover · code runtime `Popover` · `floating-styles`         | yes    | P0 |
| O6  | Overlays        | Tooltip               | shadcn Tooltip · code runtime `Tooltip` · `floating-styles`         | yes    | P0 |
| O7  | Overlays        | Hover card            | shadcn Hover Card                                                   | no     | P1 |
| O8  | Overlays        | Dropdown menu         | shadcn Dropdown Menu · code runtime `ActionMenu`                    | yes    | P0 |
| O9  | Overlays        | Context menu          | shadcn Context Menu                                                 | no     | P1 |
| O10 | Overlays        | Command palette       | shadcn Command · registry `command-palette` · G-13                  | yes    | P1 |
| D1  | Data display    | Avatar                | shadcn Avatar · registry `avatar`                                   | yes    | P0 |
| D2  | Data display    | Badge                 | shadcn Badge · registry `badge` · docs VersionChip                  | yes    | P0 |
| D3  | Data display    | Card                  | shadcn Card · registry `card` · G-15 (`rule`)                       | yes    | P0 |
| D4  | Data display    | Table                 | shadcn Table · registry `responsive-table`                          | yes    | P0 |
| D5  | Data display    | Data table            | shadcn Data Table · registry `data-table` · code DataGrid           | yes    | P0 |
| D6  | Data display    | Item                  | shadcn Item                                                         | no     | P1 |
| D7  | Data display    | Kbd                   | shadcn Kbd · G-1 (only a `.ns-kbd` CSS class today)                 | no     | P1 |
| D8  | Data display    | Code block            | shadcn Code Block · registry `code-block` · G-12                    | yes    | P1 |
| D9  | Data display    | Chart                 | shadcn Chart                                                        | no     | P1 |
| D10 | Data display    | Chart block           | registry `chart-block`                                              | yes    | P2 |
| D11 | Data display    | Donut                 | registry `donut`                                                    | yes    | P2 |
| D12 | Data display    | Accordion             | shadcn Accordion · code runtime `Accordion`                         | yes    | P1 |
| D13 | Data display    | Collapsible           | shadcn Collapsible                                                  | no     | P1 |
| D14 | Data display    | Carousel              | shadcn Carousel                                                     | no     | P1 |
| B1  | Feedback        | Alert                 | shadcn Alert · registry `alert` · G-16                              | yes    | P0 |
| B2  | Feedback        | Inline notice         | registry `inline-notice`                                            | yes    | P2 |
| B3  | Feedback        | Toast                 | shadcn Toast · registry `toast` (island)                            | yes    | P0 |
| B4  | Feedback        | Progress              | shadcn Progress · registry `progress`                               | yes    | P0 |
| B5  | Feedback        | Spinner               | shadcn Spinner · registry `spinner`                                 | yes    | P0 |
| B6  | Feedback        | Skeleton              | shadcn Skeleton · registry `skeleton`                               | yes    | P0 |
| B7  | Feedback        | Empty state           | shadcn Empty · registry `empty-state`                               | yes    | P0 |
| L1  | Layout & blocks | App shell             | registry `sidebar-shell` + `layout-objects` · #2416 Page shell      | yes    | P0 |
| L2  | Layout & blocks | Page header           | registry `page-header` · #2416 `title` props                        | yes    | P0 |
| L3  | Layout & blocks | Stats grid            | registry `stats-grid`                                               | yes    | P0 |
| L4  | Layout & blocks | Detail layout         | registry `detail-layout`                                            | yes    | P2 |
| L5  | Layout & blocks | Filter form           | registry `filter-form`                                              | yes    | P2 |
| L6  | Layout & blocks | Panel                 | registry `panel`                                                    | yes    | P2 |
| L7  | Layout & blocks | Separator             | shadcn Separator · registry `separator`                             | yes    | P0 |
| L8  | Layout & blocks | Section divider       | registry `section-divider`                                          | yes    | P2 |
| L9  | Layout & blocks | Scroll area           | shadcn Scroll Area                                                  | no     | P1 |
| L10 | Layout & blocks | Resizable             | shadcn Resizable                                                    | no     | P1 |
| L11 | Layout & blocks | Aspect ratio          | shadcn Aspect Ratio                                                 | no     | P1 |
| L12 | Layout & blocks | Direction (RTL)       | shadcn Direction (provider)                                         | no     | P1 |
| I1  | AI              | Message               | shadcn Message · registry `message`                                 | yes    | P1 |
| I2  | AI              | Bubble                | shadcn Bubble (the body surface inside registry `message`)          | yes    | P1 |
| I3  | AI              | Message scroller      | shadcn Message Scroller (`.ns-thread` CSS only)                     | no     | P1 |
| I4  | AI              | Marker                | shadcn Marker                                                       | no     | P1 |
| I5  | AI              | Trace                 | shadcn Trace                                                        | no     | P1 |
| I6  | AI              | Questionnaire         | shadcn Questionnaire                                                | no     | P1 |
| I7  | AI              | Attachment            | shadcn Attachment                                                   | no     | P1 |
| I8  | AI              | Prompt input          | registry `prompt-input`                                             | yes    | P2 |
| I9  | AI              | Model selector        | registry `model-selector`                                           | yes    | P2 |
| I10 | AI              | Tool call card        | registry `tool-call-card`                                           | yes    | P2 |
| I11 | AI              | Citation chip         | registry `citation-chip`                                            | yes    | P2 |
| I12 | AI              | MCP UI widget         | registry `mcp-ui-widget` (island)                                   | yes    | P2 |
| K1  | Desktop         | Window chrome         | registry `desktop-window-chrome`                                    | yes    | P2 |
| K2  | Desktop         | Tray menu             | registry `desktop-tray-menu`                                        | yes    | P2 |
| K3  | Desktop         | Desktop dialog        | registry `desktop-dialog`                                           | yes    | P2 |
| K4  | Desktop         | Desktop notification  | registry `desktop-notification`                                     | yes    | P2 |
| K5  | Desktop         | Update prompt         | registry `desktop-update-prompt`                                    | yes    | P2 |
| K6  | Desktop         | Desktop only          | registry `desktop-only` (island; non-visual)                        | yes    | P2 |
| X1  | Docs kit        | Prose                 | shadcn Typography · registry `markdown` · G-17                      | yes    | P1 |
| X2  | Docs kit        | File path chip        | G-2                                                                 | no     | P2 |
| X3  | Docs kit        | Attribute chip        | G-3                                                                 | no     | P2 |
| X4  | Docs kit        | Toc                   | G-6                                                                 | no     | P2 |
| X5  | Docs kit        | File tree             | G-7                                                                 | no     | P2 |
| X6  | Docs kit        | Figure                | G-10                                                                | no     | P2 |
| X7  | Docs kit        | Anchor nav            | G-14 (AnchorNav)                                                    | no     | P2 |
| X8  | Docs kit        | Ruled grid            | G-15 (RuledGrid / FeatureGrid)                                      | no     | P2 |
| X9  | Docs kit        | Hero                  | G-18                                                                | no     | P2 |

**Coverage checks**

- All 66 shadcn entries are mapped. Select and Native Select both map to F4. Direction is L12.
- All 36 registry components, all 11 blocks and all 5 islands are mapped. So are the 9 runtime
  components, DataGrid, and Icon.
- G-1 to G-18 are all mapped. G-11 is a property change on A1, not a new set.
- #2416's candidate gaps and its page-level pieces are all mapped: L1 for the page shell, L2 for
  PageHeader `title`, and N5 for the top bar.

**Counts by page and priority**

| Page            | P0     | P1     | P2     | Total   |
| --------------- | ------ | ------ | ------ | ------- |
| Foundations     | 1      | 0      | 0      | 1       |
| Actions         | 2      | 3      | 2      | 7       |
| Forms           | 9      | 6      | 1      | 16      |
| Navigation      | 6      | 2      | 2      | 10      |
| Overlays        | 5      | 5      | 0      | 10      |
| Data display    | 5      | 7      | 2      | 14      |
| Feedback        | 6      | 0      | 1      | 7       |
| Layout & blocks | 4      | 4      | 4      | 12      |
| AI              | 0      | 7      | 5      | 12      |
| Desktop         | 0      | 0      | 6      | 6       |
| Docs kit        | 0      | 1      | 8      | 9       |
| **Total**       | **38** | **35** | **31** | **104** |

**Priority rule**

- **P0:** everything the five #2416 screen archetypes and every theme's Orders specimen need.
- **P1:** the remaining shadcn parity components.
- **P2:** the remaining NetScript-specific components.

### 1.1 Language-variant matrix

● marks a theme whose anatomy differs: geometry, depth recipe or parts. Each ● becomes one
`<Theme>/<Component>` set. The one-line reasons are in each component's block.

A theme left blank still renders the component by switching modes. That holds only for Tonal,
Fluent, Brutal, Filigrane, Pixel and Tactile, which have their own Theme mode. For Bloom, Cupertino,
Liquid and Terminal, see §4.3.

| Component      | Tonal | Bloom | Cupertino | Liquid | Fluent | Brutal | Filigrane | Terminal | Pixel | Tactile |
| -------------- | :---: | :---: | :-------: | :----: | :----: | :----: | :-------: | :------: | :---: | :-----: |
| Z1 Icon        |       |       |           |        |   ●    |        |           |    ●     |   ●   |         |
| A1 Button      |       |   ●   |     ●     |   ●    |   ●    |   ●    |           |    ●     |   ●   |    ●    |
| A2 Icon button |       |       |     ●     |   ●    |   ●    |   ●    |           |    ●     |   ●   |    ●    |
| A3 Button group|   ●   |       |           |   ●    |        |   ●    |           |          |       |         |
| A4 Toggle      |       |       |           |        |        |        |           |          |   ●   |    ●    |
| A5 Toggle group|   ●   |       |     ●     |   ●    |        |   ●    |           |          |   ●   |    ●    |
| A6 Action bar  |       |   ●   |           |   ●    |        |        |           |          |       |         |
| F2 Input       |   ●   |   ●   |           |   ●    |   ●    |   ●    |     ●     |    ●     |   ●   |    ●    |
| F3 Textarea    |   ●   |       |           |        |   ●    |   ●    |     ●     |    ●     |   ●   |    ●    |
| F4 Select      |   ●   |   ●   |           |        |   ●    |   ●    |     ●     |          |   ●   |    ●    |
| F5 Checkbox    |   ●   |   ●   |           |        |        |        |           |    ●     |   ●   |    ●    |
| F6 Radio group |       |       |           |        |        |        |           |    ●     |       |    ●    |
| F7 Switch      |   ●   |   ●   |     ●     |   ●    |   ●    |   ●    |           |          |   ●   |    ●    |
| F11 Slider     |       |       |           |        |        |        |           |          |       |    ●    |
| F15 Search     |       |       |           |   ●    |        |        |     ●     |    ●     |       |    ●    |
| N1 Breadcrumb  |       |       |           |        |        |        |           |    ●     |       |         |
| N2 Pagination  |       |       |           |        |        |        |           |    ●     |   ●   |    ●    |
| N3 Tabs        |       |       |           |        |   ●    |   ●    |           |    ●     |   ●   |         |
| N4 Sidebar     |   ●   |       |     ●     |   ●    |   ●    |        |           |          |       |         |
| N4 Nav item    |   ●   |       |           |        |   ●    |   ●    |     ●     |          |   ●   |    ●    |
| N5 Top bar     |       |       |     ●     |   ●    |        |        |           |    ●     |   ●   |         |
| N6 Nav menu    |       |       |           |        |        |        |     ●     |    ●     |       |         |
| O1 Dialog      |       |       |           |   ●    |        |        |           |    ●     |   ●   |    ●    |
| O3 Sheet       |       |   ●   |           |   ●    |        |        |           |          |       |         |
| D1 Avatar      |   ●   |       |           |        |        |        |           |          |   ●   |    ●    |
| D2 Badge       |       |       |           |        |        |   ●    |           |    ●     |   ●   |         |
| D3 Card        |       |   ●   |           |        |        |        |           |    ●     |       |    ●    |
| D4 Table row   |   ●   |   ●   |           |        |   ●    |        |     ●     |    ●     |   ●   |    ●    |
| D6 Item        |       |       |     ●     |   ●    |        |        |           |          |       |         |
| L7 Separator   |       |       |           |        |        |   ●    |           |          |       |         |
| B1 Alert       |   ●   |       |           |        |        |   ●    |     ●     |    ●     |   ●   |    ●    |
| B4 Progress    |   ●   |       |           |        |        |        |           |    ●     |   ●   |    ●    |
| L3 Stat card   |   ●   |   ●   |           |        |        |   ●    |           |    ●     |   ●   |    ●    |
| L1 App shell   |       |       |           |        |        |        |           |    ●     |       |         |
| K1 Window chrome |     |       |     ●     |   ●    |   ●    |        |           |          |       |         |
| **Sets**       | **14**| **10**| **8**     | **14** | **12** | **14** | **8**     | **21**   | **21**| **21**  |

That makes 143 language-variant sets. Components that derive from these inherit them and get no
set of their own: Alert dialog, Drawer, Combobox, Date picker, Input group, Data table and Inline
notice, which reuse the variants of Dialog, Sheet, Input, Table row and Alert. No theme draws
overlays, menus, toast, AI or docs components yet (#2416), so they have no ● today. When #2416
draws them, the likely candidates are Liquid float glass and Pixel stepped frames.

---

## 2. Component specs

Every block has the same sections:

- **Sets**: component sets with their variant products. Each product is at most 30.
- **Props**
- **Parts**: the `data-part` layer names and the auto-layout structure.
- **Bind**: the variable for each part.
- **Lang**: language variants, one reason per theme.
- **Nests**: the components it contains.

Unless a block says otherwise, every component also gets R.focus for `focus`, R.hover and R.pressed
for `hover` and `pressed`, and R.disabled for `disabled`. Abbreviations: AL = auto layout, H/V =
horizontal/vertical, hug/fill/fixed = sizing.

### Foundations

#### Z1 Icon

- **Sets:** one component per glyph, named `Icon/<glyph>`, not a variant set. More than 40 glyphs
  would break the cap, and instance swap works best with separate components.
- **Props:** none on the glyph. Parents expose `…Glyph` instance-swap properties limited to
  `Icon/*`.
- **Parts:** `root`, a frame with W = H bound to `I.md`, containing `glyph` vectors (24-unit Lucide
  geometry, constraints SCALE). Parents rebind the instance W/H to `I.sm` or `I.lg`.
- **Bind:**
  - glyph stroke `text/fg` (parents override it to their label role);
  - stroke weight `+icon/stroke (interim SF:icon/stroke)`;
  - round caps and joins, no fill.
- **Glyphs:**
  - the code's 16: `check chevron-down chevron-left chevron-right chevron-up copy download
    external-link info menu minus plus search settings trash x`;
  - added for the components below: `alert-circle alert-triangle circle-check circle dot arrow-left
    arrow-right arrow-up arrow-down arrow-up-right arrow-up-down more-horizontal more-vertical
    calendar upload paperclip file file-text folder hash corner-down-left moon sun filter
    panel-left bell user square mic camera globe grip-vertical`.
- **Lang:**
  - Fluent: Fluent System Icons, with a `-filled` twin per glyph for the selected nav state.
  - Terminal: glyphs are text characters (`◆ ▶ ✗ ● ▲ ▼`) in T.mono, not vectors.
  - Pixel: 16px pixel glyphs on a 2px grid, built from filled cells, with no stroke binding.
- **Nests:** none.

### Actions

#### A1 Button

- **Sets:** four sets, each `variant` (6) × `state` (5) = 30:
  - `Button / md`
  - `Button / sm`
  - `Button / lg`
  - `Button / xs` (P1; shadcn `xs`)
- **Props:**
  - `variant`: primary · secondary · outline · ghost · destructive · link;
  - `state`: rest · hover · pressed · focus · disabled;
  - `loading` (bool);
  - `iconStart` (bool) + `iconStartGlyph` (swap), and `iconEnd` (bool) + `iconEndGlyph` (swap);
  - `label` (text).

  The `link` variant comes from shadcn; the code has no link variant.
- **Parts:**
  - `root`: H-AL, hug × fixed height, centred.
  - Children in order: `icon-start` · `spinner` (Spinner / sm, hidden) · `label` · `icon-end`.
  - Absolute children: `state-layer`, `focus-ring`, and `underline` (link only, a 1px rectangle
    under the label).
- **Bind (all variants):**
  - height: H.md, H.sm, H.lg or H.xs;
  - padding-x: PX (sm and xs: PX.sm);
  - gap: GAP;
  - radius: `radius/control`;
  - stroke weight: `border/width`;
  - label: T.strong (sm and xs: T.strong-sm);
  - icons: I.md (sm and xs: I.sm; lg: I.lg).

  | variant     | fill                  | stroke                                           | label / icon                       | hover                                          | pressed                         |
  | ----------- | --------------------- | ------------------------------------------------ | ---------------------------------- | ---------------------------------------------- | ------------------------------- |
  | primary     | `primary/default`     | `+primary/stroke (interim studio/primary/stroke)` | `primary/fg`                       | fill `primary/hover`                           | `primary/hover` + R.pressed (layer `primary/fg`) |
  | secondary   | `secondary/default`   | `secondary/border`                               | `secondary/fg`                     | R.hover                                        | R.pressed                       |
  | outline     | none                  | `border/default` (§4.6)                          | `text/fg`                          | R.hover + stroke `border/hover`                | R.pressed                       |
  | ghost       | none                  | none                                             | `text/muted`; `text/fg` on hover/pressed | R.hover                                  | R.pressed                       |
  | destructive | `destructive/default` | `destructive/default`                            | `destructive/fg`                   | fill `destructive/hover`                       | `destructive/hover` + R.pressed |
  | link        | none                  | none                                             | `text/fg`; `underline` fill `+link/underline (interim studio/signal/underline)` | `underline` → `+marker/default (interim studio/signal/marker)` | as hover |

  - `loading`: show `spinner` (override its arc to the label role) and hide `icon-start`.
  - Control shadow, on rest and hover (none when pressed) for the primary, secondary, outline and
    destructive variants. This is Workshop's 3/3/0 offset today; Brutal's slab joins it once the
    twins exist.
    - DROP_SHADOW colour `+effect/control-shadow (interim studio/button/shadow)`;
    - x `+shadow/control/x (interim SF:button/shadow-x)`;
    - y `+shadow/control/y (interim SF:button/shadow-y)`;
    - blur 0.
- **Lang:**
  - Bloom: the hero pill adds a trailing 36px `action-disc` part, with asymmetric padding
    0/8/0/22.
  - Cupertino: the Glass kind is vibrancy: a background blur of 10, `material/fill`, a
    `material/stroke` rim and a 0 4 14 shadow.
  - Liquid: control glass and float glass: a top inner highlight, side-edge shadows and a 35% white
    rim.
  - Fluent: an elevation border. Inset 1px top and bottom edges
    (`fluent/elevation/control-top|bottom`, and accent-bottom on the accent kind) replace the flat
    stroke.
  - Brutal:
    - a hard Slab M (4/4/0) at rest and a 2px ink stroke;
    - pressed collapses the slab and shifts the content +4/+4 (padding 0/18/0/16 → 4/14/0/20);
    - an extra `ink` kind.
  - Terminal: a Key, `[ save ctrl+s ]`:
    - bracket and `shortcut` parts, padding 4/8, no radius;
    - the default kind is outline-only.
  - Pixel:
    - a 36px face on a 4px lip, with 4×4 stepped corners;
    - pressed drops the face 4px and removes the lip;
    - an uppercase mono label, and extra `hero` and `ink` kinds.
  - Tactile:
    - a convex key (key-m dual shadow, in-hue border);
    - pressed becomes concave (pressed-m), takes accent ink and moves the content 1px down-right;
    - the primary kind adds a glow.
- **Nests:** Icon, Spinner, .Focus ring, .State layer.

#### A2 Icon button

- **Sets:** four square sets, each `variant` (5) × `state` (5) = 25:
  - `Icon button / md` (P0; the code's only size, `size='icon'`);
  - `Icon button / sm`, `Icon button / lg` and `Icon button / xs` (P1; shadcn `icon-*`).
- **Props:**
  - `variant`: primary · secondary · outline · ghost · destructive;
  - `state`: as Button;
  - `loading` (bool);
  - `glyph` (swap);
  - `label` (text, on a hidden layer; it feeds the accessible name and the tooltip).
- **Parts:** `root` (W = H) → `glyph` · `spinner`, plus the absolute `state-layer` and `focus-ring`.
- **Bind:**
  - W = H: H.md, H.sm, H.lg or H.xs;
  - padding 0;
  - glyph I.md (sm and xs: I.sm);
  - every other binding follows Button's variant table.
- **Lang:**
  - Cupertino: a glass toolbar capsule with vibrancy.
  - Liquid: icon-only items inside a control-glass group.
  - Fluent: elevation border; the AppBarButton look has no rest fill.
  - Brutal: Slab M with a pressed collapse.
  - Terminal: a keycap `[?]` with a text glyph.
  - Pixel: a key on a lip.
  - Tactile: a round convex key (key-m); the current state sinks (pressed-s).
- **Nests:** Icon, Spinner, .Focus ring, .State layer.

#### A3 Button group

- **Sets:** `Button group`, `orientation` horizontal|vertical (2) × `size` sm|md|lg (3) = 6.
- **Props:** `separator` (bool), `text` (bool, for ButtonGroupText).
- **Parts:** `root` (AL, gap −1 so the strokes overlap) → item instances (Button / Icon button) ·
  `separator` · `text`.
- **Bind:**
  - Item instances keep `radius/control` on their outer corners only; override the inner corners
    to 0.
  - `text`: T.small `text/muted` on `surface/muted`, padding-x PX.
- **Lang:**
  - Tonal: a connected group with 2px gaps and inner corners of 8, which morph to 4 when pressed;
    the selected item becomes a full pill in `primary`.
  - Liquid: one control-glass capsule holding icon-only items.
  - Brutal: a joined row with a −2 gap, so the 2px borders merge; only the outer corners are
    rounded.
- **Nests:** Button, Icon button, Separator.

#### A4 Toggle

- **Sets:** `Toggle / md`, `Toggle / sm` and `Toggle / lg`, each `variant` default|outline (2) ×
  `selected` (2) × `state` rest|hover|focus|disabled (4) = 16.
- **Props:** `iconStart` and `iconEnd` (bool + swap; `iconEnd` holds the filter-chip chevron),
  `label` (bool + text).

  shadcn's `data-state=on|off` maps to `selected`.
- **Parts:** `root` H-AL → `icon-start` · `label` · `icon-end`, plus `state-layer` and `focus-ring`.
- **Bind:**
  - height H.*; padding PX (sm: PX.sm); gap GAP; radius `radius/control`;
  - label T.strong (sm: T.strong-sm) in `text/muted`;
  - outline: stroke `border/default`;
  - selected: fill `surface/selected`, label `text/fg`.
- **Lang:**
  - Pixel: the selected face is amber, raised on a 2px lip.
  - Tactile: a status key. When selected it sinks to pressed-m, takes accent ink, and lights the
    `led` part.
- **Nests:** Icon, .Focus ring, .State layer.

#### A5 Toggle group

- **Sets:** `Toggle group`, `variant` default|outline|segmented (3) × `orientation` (2) × `size`
  sm|md (2) = 12.
- **Props:** `type` single|multiple is behaviour only, so it is not drawn.
- **Parts:** `root` (`track` when segmented) → Toggle instances.
- **Bind (segmented, which is also the Studio "segmented filter"):**
  - `root` fill `+tabs/track (interim studio/tabs/track)`;
  - padding `+tabs/pad (interim SF:tabs/pad)`;
  - radius `+tabs/radius (interim SF:tabs/radius)`;
  - gap `+tabs/gap (interim SF:tabs/gap)`;
  - selected item: fill `+tabs/sel-bg (interim studio/tabs/sel-bg)`, stroke
    `+tabs/sel-border (interim studio/tabs/sel-border)`, radius
    `+tabs/item-radius (interim SF:tabs/item-radius)`.

  The default and outline variants use gap `space/inline/gap`.
- **Lang:**
  - Tonal: connected items with 2px gaps and inner corners of 8; the selected item becomes a full
    pill in `primary`.
  - Cupertino: a `material/track` r9 track; the thumb is `material/fill-strong` with two soft
    shadows.
  - Liquid: a pill track with a float-glass thumb and a gradient rim.
  - Brutal: joined with a −2 gap; the selected item has an ink fill.
  - Pixel: the selected face is amber, on a 2px lip.
  - Tactile: a bank of separate keys, not a track. The active key sinks (pressed-m) and lights its
    LED.
- **Nests:** Toggle, Separator.

#### A6 Action bar

- **Sets:** `Action bar`, `variant` floating|inline (2). Inline is the DataGrid `bulk-actions` row.
- **Props:** `close` (bool), `actions` (swap).
- **Parts:** `root` H-AL → `count` · `separator` (vertical) · `actions` (.Slot) · `close`.
- **Bind:**
  - floating: R.float with fill `surface/inverse`, text `text/inverse` and radius `radius/control`;
  - inline: fill `surface/selected`, no shadow;
  - height H.lg; padding PX; gap GAP; `count` T.strong.
- **Lang:**
  - Bloom: an ink pill, a 25% divider and a trailing 44px peach "More" disc.
  - Liquid: a float-glass island (blur 18, gradient rim, inner highlight).
- **Nests:** Button, Icon button, Separator.

#### A7 Theme toggle

- **Sets:** `Theme toggle`, `theme` light|dark (2) × `state` rest|hover|focus (3) = 6.
- **Parts:** `root` is an `Icon button / md` ghost instance. It shows `moon` in light and `sun` in
  dark (docs §6).
- **Bind:** inherited from Icon button.
- **Lang:** inherits Icon button's variants.
- **Nests:** Icon button.

### Forms

#### F1 Label

- **Sets:** `Label`, `variant` default|eyebrow (2) × `state` rest|disabled|invalid (3) = 6. The
  eyebrow variant is G-4.
- **Props:** `required` (bool; code `ns-label--required`), `optional` (bool), `text`.
- **Parts:** `root` H-AL, gap 4 → `text` · `required-mark` ("*") · `optional-hint`.
- **Bind:**
  - default: T.strong-sm, `text/fg`;
  - eyebrow: T.eyebrow, `text/muted`;
  - `required-mark`: `destructive/text`;
  - `optional-hint`: T.small, `text/muted`;
  - invalid: `destructive/text`.
- **Lang:** none. Theme differences here are tokens only (`font/label`, `type/label/*`).
- **Nests:** none.

#### F2 Input

- **Sets:** `Input`, `size` sm|md (2) × `content` placeholder|value (2) × `state`
  rest|hover|focus|disabled|invalid|invalid-focus (6) = 24.
- **Props:** `iconStart` and `iconEnd` (bool + swap), `placeholder` and `value` (text).
- **Parts:** `root` H-AL, fixed height, fill width → `icon-start` · `text` · `icon-end`, plus the
  absolute `focus-ring`.
- **Bind:**
  - height H.md or H.sm; padding-x PX (sm: PX.sm); gap GAP; radius `radius/input`;
  - fill `surface/card`; stroke `border/input` at `border/width` (§4.1 D covers the Utility value);
  - text T.body: `text/fg` for a value, `text/muted` for a placeholder;
  - icons I.md in `text/muted`.

  | state         | Treatment                                                                                    |
  | ------------- | -------------------------------------------------------------------------------------------- |
  | hover         | stroke `border/control`                                                                      |
  | focus         | R.focus; the stroke stays `border/input` (Studio 2/2 ring)                                   |
  | invalid       | R.invalid                                                                                    |
  | invalid-focus | R.invalid + R.focus                                                                          |
  | disabled      | fill `surface/muted`, stroke `border/default`, text `text/muted`; no opacity (matches the code) |
- **Lang:**
  - Tonal: a filled field:
    - 56 tall, `surface/container-highest`, top corners 4 only;
    - the label sits inside (12/16) above the value (16/24);
    - a 1px bottom indicator (2px on focus and error) instead of a box.
  - Bloom: a 56px r28 capsule with the label inside over the value; error is 1.5px.
  - Liquid: a 28px r7 field on `surface/card`. Focus is a solid 3px band (a 1px inside stroke plus
    a 2px ring, no gap), which the base ring and its fixed 2px gap cannot draw.
  - Fluent: a TextBox:
    - control fill, a 1px stroke and a strong bottom edge;
    - focus is a 2px accent bottom edge plus `fluent/control/input-active`, with no ring.
  - Brutal: focus and invalid add a hard 4/4 slab in `border/ring` or `destructive/default`
    instead of a ring; 2px stroke.
  - Filigrane: no box:
    - a muted label above and a 1px underline;
    - focus is a 2px ring underline plus a double ring with a 3px paper gap.
  - Terminal: a prompt field:
    - a `label:` line, then a `> value` line, with the prompt in `primary/text`;
    - an 8×16 block cursor, and no container.
  - Pixel:
    - a 2px stepped edge with a 2px recess shade on the top and left;
    - focus is the control-ink edge, a gap and an amber stepped ring;
    - an 8×18 block cursor.
  - Tactile:
    - a concave well-m surface layer plus a separate rim layer (`tactile/edge/control`), r14;
    - focus is an r18 ring at a 2px gap.
- **Nests:** Icon, .Focus ring.

#### F3 Textarea

- **Sets:** `Textarea`, `content` (2) × `state` (6, as Input) = 12.
- **Props:** `counter` (bool), `resize` (bool).
- **Parts:** `root` V-AL (minimum height 80, hug) → `text` · `footer` → `counter`, plus
  `resize-handle` and `focus-ring`.
- **Bind:**
  - padding on all sides `space/stack/gap` (Studio is 12/12 at Comfortable);
  - radius `radius/input`;
  - fills, strokes and states as Input;
  - text T.body; `counter` T.caption `text/muted` ("Optional · 0 / 500").
- **Lang:**
  - Tonal: a 112px filled container with the label inside, a bottom indicator and a counter.
  - Fluent: the TextBox recipe.
  - Brutal: slab focus.
  - Filigrane: an underline field.
  - Terminal: a prompt block.
  - Pixel: a stepped recess.
  - Tactile: a well with a rim.
- **Nests:** Icon (`grip-vertical`), .Focus ring.

#### F4 Select

- **Sets:**
  - `Select` (the trigger): `size` sm|md (2) × `content` placeholder|value (2) × `state`
    rest|hover|focus|open|disabled|invalid (6) = 24;
  - `Select content`: a `Menu content` holding `Menu item type=option` (O8); no variants of its
    own.
- **Props:** `iconStart` (bool + swap), `value` and `placeholder` (text).
- **Parts:** `root` (as Input) → `icon-start` · `value` · `chevron`. When open, the content
  appears 4px below the trigger.
- **Bind:**
  - as Input; `chevron` is I.md `chevron-down` in `text/muted`;
  - open: the chevron becomes `chevron-up` and the stroke becomes `border/control`.

  The code's Select is native, so the open state is a design reference only (§4.5).
- **Lang:**
  - Tonal: a filled-field trigger.
  - Bloom: a capsule.
  - Fluent: a ComboBox:
    - control fill and elevation sides;
    - a 1px strong bottom edge on enabled Rest, Hover and Pressed;
    - a 12px chevron in `fluent/text/secondary`.
  - Brutal: the input recipe with slab focus.
  - Filigrane: an underline.
  - Pixel: a stepped recess.
  - Tactile: a well with a rim.
- **Nests:** Icon, Menu content, Menu item, .Focus ring.

#### F5 Checkbox

- **Sets:** `Checkbox`, `checked` false|true|indeterminate (3) × `state`
  rest|hover|focus|disabled|invalid (5) = 15.
- **Props:** `label` (bool + text), `description` (bool + text).
- **Parts** (from the code): `root` H-AL, gap `space/inline/gap` →
  - `control` → `indicator`;
  - `body` (V-AL, gap 2) → `label` · `description`.
- **Bind:**
  - `control`: W = H `+size/checkbox (interim lit 16)`, radius `+radius/checkbox (interim lit 2)`;
  - unchecked: fill `surface/card`, stroke `border/input` at `border/width`;
  - checked and indeterminate: fill `primary/default`, stroke
    `+primary/stroke (interim studio/primary/stroke)`, `indicator` (`check` or `minus`) I.sm in
    `primary/fg`;
  - hover (unchecked): stroke `border/control`;
  - invalid: stroke `destructive/default`;
  - `label` T.body `text/fg`; `description` T.small `text/muted`;
  - the focus ring goes on `control`.
- **Lang:**
  - Tonal: a 40px round state-target halo carries the hover and focus layers.
  - Bloom: a toggle disc replaces the checkbox. It is 28px: on = a `bloom/hero` disc with a 12px
    check; off = a 1px ring.
  - Terminal: the text glyph `[x]` in `primary/text` or `[ ]` in `text/muted`, with no box.
  - Pixel: unchecked is a recessed well; checked is amber, popped up on a 2px lip, with an ink
    tick.
  - Tactile: a 28px well-s with a rim; checked prints an accent check with no glow.
- **Nests:** Icon, .Focus ring.

#### F6 Radio group

- **Sets:** `Radio`, `checked` (2) × `state` (5) = 10; `Radio group`, `orientation` (2).
- **Parts:** `control` (a circle) → `indicator` (a dot); `body` → `label` · `description`.
- **Bind:**
  - `control`: W = H `+size/checkbox`, radius lit 999;
  - unchecked: fill `surface/card`, stroke `border/input`;
  - checked: stroke `primary/default`, plus a lit 8 dot filled `primary/default`;
  - group gap `space/stack/gap`.
- **Lang:**
  - Terminal: the text glyphs `(•)` and `( )`.
  - Tactile: an r14 well-s with a rim; checked prints a 12px accent dot.
- **Nests:** .Focus ring.

#### F7 Switch

- **Sets:** `Switch`, `size` sm|md (2) × `checked` (2) × `state` rest|hover|focus|disabled|invalid
  (5) = 20.
- **Props:** `label` (bool + text), `description` (bool + text).
- **Parts:** `root` H-AL →
  - `control` → `track` → `thumb`;
  - `body` → `label` · `description`.
- **Bind:**
  - `track`: W/H `+size/switch/width|height (interim lit 32×18; sm 28×16)`, padding lit 2, radius
    lit 999 (full in every theme except Pixel);
  - `thumb`: `+size/switch/thumb (interim lit 14; sm 12)`;
  - off: track fill `surface/muted`, stroke `border/input`; thumb `surface/card`;
  - on: track fill and stroke `primary/default`; thumb `+switch/thumb (interim primary/fg)`;
  - hover: track stroke `border/control`;
  - the focus ring goes on `track`.
- **Lang:**
  - Tonal: 52×32. The off track is outlined at 2px in `text/muted`; the thumb grows from 16 to 24
    and shows a check when on.
  - Bloom: the toggle disc replaces it, as for Checkbox.
  - Cupertino:
    - 51×31, with a 27px knob carrying two soft shadows (a depth recipe);
    - the on track is `success/default`.
  - Liquid:
    - 46×28, with a 24px knob carrying shadows;
    - on uses `liquid/switch/on-track`; off uses `material/track` with a 1px edge.
  - Fluent: a `state-label` part ("On"/"Off") sits to the left; a 40×20 track; the 12px knob grows
    on hover.
  - Brutal: 52×28. On is `block/green` with an ink border; the thumb is black with a 1px contour.
  - Pixel:
    - a 44×24 recessed track with I/O marks;
    - a 16px ink knob and stepped corners.
  - Tactile:
    - a 60×34 well-s track with a rim and a convex key-s knob;
    - on adds an accent knob with a glow and an "On" caption.
- **Nests:** .Focus ring.

#### F8 Field

- **Sets:**
  - `Field`: `orientation` vertical|horizontal (2) × `state` rest|invalid|disabled (3) = 6;
  - `Field set`: `variant` legend|label (2), as shadcn FieldLegend.
- **Props:** `description` (bool), `required` (bool), `control` (swap; any form control, default
  `Input` md).
- **Parts:**
  - `Field` (from the code): `root` → `label` (Label) · `control` (.Slot) · `description` ·
    `error-row` → `error-icon` · `error`. The horizontal orientation is H-AL with a label column.
  - `Field set`: `legend` · `description` · `group` (V-AL of Fields) · `separator`.
- **Bind:**
  - gap `space/inline/gap`;
  - `description` T.small `text/muted`;
  - `error` T.small `destructive/text`, with `error-icon` I.sm in `destructive/text`;
  - `legend` T.heading `text/fg`;
  - the set's gap `space/stack/gap`.
- **Lang:** none. The labels inside Tonal and Bloom fields, and Terminal's indented helper, belong
  to their Input variants.
- **Nests:** Label, Input, Icon, Separator.

#### F9 Input group

- **Sets:** `Input group`, `align` inline-start|inline-end|block-start|block-end (4) × `state`
  rest|focus|disabled|invalid (4) = 16.
- **Props:** `control` (swap: Input or Textarea, both strokeless), `addon` (swap).
- **Parts:** `root` (the Input frame) → `addon` (an Icon; `text` in T.small `text/muted`; or a
  Button / Icon button at xs) · `control`.
- **Bind:** `root` as Input; addon gap GAP.

  shadcn's InputGroupButton sizes map to the xs and sm Button and Icon button sets, so it has no set
  of its own. Tactile's quantity stepper is this component with round Tactile icon buttons and a
  well window.
- **Lang:** inherits the Input and Button variants through nesting.
- **Nests:** Input, Textarea, Button, Icon button, Icon.

#### F10 Input OTP

- **Sets:**
  - `OTP slot`: `content` empty|value|caret (3) × `state` rest|focus|disabled|invalid (4) = 12;
  - `Input OTP`: `length` 4|6 (2) × `groups` 1|2 (2) = 4.
- **Parts:** `root` → `group` (H-AL, gap −1) → `slot`s · `separator` (Icon `minus`).
- **Bind:**
  - slot W = H H.md, fill `surface/card`, stroke `border/input`;
  - the group's outer corners `radius/input`, inner corners 0;
  - character T.strong `text/fg`; caret 1×16 `text/fg`;
  - focus R.focus on the slot; invalid stroke `destructive/default`.
- **Lang:** none drawn.
- **Nests:** Icon, .Focus ring.

#### F11 Slider

- **Sets:** `Slider`, `orientation` (2) × `thumbs` 1|2 (2) × `state` rest|hover|focus|disabled (4)
  = 16.
- **Props:** `value` (bool; shows the value label).
- **Parts:** `root` → `track` → `range`; `thumb` (one or two); `value-label`.
- **Bind:**
  - `track`: fill `material/track`, h lit 4, radius lit 999;
  - `range`: `primary/default`;
  - `thumb`: lit 16, fill `surface/card`, a 2px stroke in `primary/default`, radius lit 999;
  - `value-label` T.data;
  - the focus ring goes on the thumb.
- **Lang:** Tactile: a well-s track, the fill printed in strong ink, and a convex key-s knob with a
  rim.
- **Nests:** .Focus ring.

#### F12 Combobox

- **Sets:** `Combobox`, `multiple` (2) × `state` rest|focus|open|disabled|invalid (5) = 10.
- **Parts** (from the runtime): `root` →
  - `input` (Input with `chevron-down` or `x`; with `multiple`, Badge chips sit inside);
  - `content` (Menu content) → `item` (Menu item `type=option`, highlighted and checked) and
    `empty` (T.small `text/muted`).
- **Bind:** inherited from Input and Menu.
- **Lang:** inherits the Input variants.
- **Nests:** Input, Badge, Menu content, Menu item, Icon.

#### F13 Calendar

- **Sets:**
  - `Calendar day`: `state` rest|hover|focus|selected|disabled|today (6) × `range`
    none|start|middle|end (4) = 24;
  - `Calendar`: `months` 1|2 (2) × `caption` label|dropdown (2) = 4.
- **Parts:** `root` V-AL, padding `space/stack/gap` →
  - `header` → `nav-prev` (Icon button / sm ghost) · `caption` · `nav-next`;
  - `weekdays`;
  - `grid` (7×6 days).
- **Bind:**
  - day W = H H.sm, radius `radius/input`, T.small `text/fg`;
  - selected: `primary/default` with `primary/fg`;
  - today: fill `surface/muted`;
  - range middle: `surface/selected`, radius 0;
  - `caption` T.strong; `weekdays` T.caption `text/muted`.
- **Lang:** none drawn.
- **Nests:** Icon button, Select, Calendar day.

#### F14 Date picker

- **Sets:** `Date picker`, `mode` single|range (2) × `state` rest|focus|open|disabled|invalid (5)
  = 10.
- **Parts:** `trigger` (Input with a `calendar` icon, or a Button outline) → `content` (a Popover
  holding a Calendar; range uses `months=2`).
- **Bind:** inherited.
- **Lang:** inherits the Input variants.
- **Nests:** Input, Button, Popover, Calendar, Icon.

#### F15 Search

- **Sets:** `Search`, `size` sm|md (2) × `state` rest|hover|focus|open (4) = 8.
- **Props:** `kbd` (bool), `label` (text).
- **Parts** (from the code): `root` (a button styled as a field) → `icon` · `label` · `kbd`.
- **Bind** (docs §6):
  - height H.sm; W lit 280; padding-x PX.sm; gap GAP; radius `radius/input`;
  - fill `surface/card`; stroke `border/default`. The border is soft because Search opens a
    palette and is not a field.
  - `icon`: I.md `search` in `text/muted`; `label`: T.small `text/muted`;
  - hover: stroke `border/hover`; open: stroke `text/fg`.
- **Lang:**
  - Liquid: a 220×36 control-glass capsule.
  - Filigrane: 220×28, with only a 1px bottom rule.
  - Terminal: a `/ search` keycap hint in the status line, with no field.
  - Tactile: a well-m with a rim.
- **Nests:** Icon, Kbd, .Focus ring.

#### F16 Dropzone

- **Sets:** `Dropzone`, `state` rest|hover|active|focus|disabled|invalid (6). `active` is a drag
  over the zone; `invalid` is a rejected file.
- **Parts** (from the code): `root` V-AL, centred, padding `space/card/padding` → `icon` · `label`
  · `hint` · `status`.
- **Bind:**
  - fill `surface/surface`; stroke `border/strong`, dashed [4,4], at `border/width`; radius
    `radius/card`;
  - `icon`: I.lg `upload` in `text/muted`;
  - `label` T.strong; `hint` T.small `text/muted`; `status` T.small (`destructive/text` when
    invalid);
  - active: fill `surface/selected`, stroke `primary/default`.
- **Lang:** none drawn.
- **Nests:** Icon, Button, .Focus ring.

### Navigation

#### N1 Breadcrumb

- **Sets:**
  - `Breadcrumb item`: `type` link|current|ellipsis (3) × `state` rest|hover|focus (3) = 9;
  - `Breadcrumb`: a list.
- **Parts** (from the code): `root` → `item` → `link` | `current`, plus `separator`.
- **Bind:**
  - `link`: T.mono `text/muted`, `text/fg` on hover (Utility sets breadcrumbs in mono);
  - `current`: T.mono with `type/strong/style`, `text/fg`;
  - `separator`: I.sm `chevron-right` in `text/muted`;
  - ellipsis: `more-horizontal`;
  - gap GAP.
- **Lang:** Terminal: a shell path `~/commerce/orders` in the status line.
- **Nests:** Icon, Dropdown menu.

#### N2 Pagination

- **Sets:**
  - `Page key`: `type` page|previous|next|ellipsis (4) × `state` rest|hover|focus|current|disabled
    (5) = 20;
  - `Pagination`: `variant` numbered|pager (2), where pager is G-9.
- **Parts** (from the code): `root` H-AL space-between → `meta` · `actions` (page keys). The pager
  variant has `previous` and `next` tiles, each with a `direction` eyebrow and a `title`.
- **Bind:**
  - key: W = H H.sm, radius `radius/control`, T.data;
  - current: stroke `border/control`, `text/fg`;
  - `meta`: T.small `text/muted`;
  - pager tiles: stroke `border/subtle`, `direction` T.eyebrow `text/muted`, `title` T.strong
    `text/fg`, padding `space/card/padding`.
- **Lang:**
  - Terminal: `n/p next/prev page` key hints.
  - Pixel: mini keys on a sand lip; the current page is a pressed amber key.
  - Tactile: round keys; the current page sinks (pressed-s).
- **Nests:** Button, Icon.

#### N3 Tabs

- **Sets:**
  - `Tab`: `variant` default|line (2) × `selected` (2) × `state` rest|hover|focus|disabled (4) = 16;
  - `Tabs list`: `variant` (2) × `orientation` (2) = 4;
  - `Tabs`: the list plus a `content` slot.
- **Props:** `count` (bool), `iconStart` (bool + swap), `marker` (bool).
- **Parts** (from the runtime): `root` → `list` → `trigger` (`marker` · `icon` · `label` · `count`)
  → `content`.
- **Bind (default: the Studio segmented and marker treatment, per flavor):**
  - `list`: fill `+tabs/track (interim studio/tabs/track)`, padding
    `+tabs/pad (interim SF:tabs/pad)`, radius `+tabs/radius (interim SF:tabs/radius)`, gap
    `+tabs/gap (interim SF:tabs/gap)`;
  - `trigger`:
    - height H.sm, padding-x `+tabs/item-pad (interim SF:tabs/item-pad)`, radius
      `+tabs/item-radius (interim SF:tabs/item-radius)`;
    - stroke `+tabs/idle-border (interim studio/tabs/idle-border)` at
      `+tabs/idle-stroke (interim SF:tabs/idle-stroke)`;
    - `label` T.body `text/muted`; `count` T.data `text/muted`;
  - selected:
    - fill `+tabs/sel-bg (interim studio/tabs/sel-bg)`;
    - stroke `+tabs/sel-border (interim studio/tabs/sel-border)`, at
      `+tabs/sel-box (interim SF:tabs/sel-box)` on all sides and
      `+tabs/sel-bottom (interim SF:tabs/sel-bottom)` on the bottom;
    - `label` T.strong `text/fg`;
    - `marker` (Location marker) visibility bound to `+deco/marker (BOOLEAN; interim lit visible)`;
  - `line`: no track and no fill; the selected `indicator` is a 2px bottom bar filled `text/fg`.
  - Utility draws no hover; keep the variant, which is identical there. Focus is a full perimeter,
    and the wrapper must not clip it.
- **Lang:**
  - Fluent: a SelectorBar. The selected tab gets a centred 16×3 accent pill and a Caption count.
  - Brutal: a joined row with a −2 gap, so the 2px borders merge; the selected tab has an ink fill
    and an `ink/fg` label.
  - Terminal: a `1:overview` index part in `primary/text`; selected uses the hover fill and a 2px
    ring underline.
  - Pixel: the selected tab is an amber face on a 2px lip, with a Space Mono label and a JetBrains
    Mono count.
- **Nests:** Location marker, Icon, .Focus ring, .State layer.

#### N4 Sidebar

- **Sets:**
  - `Nav item`: `state` rest|hover|focus|selected|disabled (5) × `level` 1|2 (2) × `collapsed` (2)
    = 20;
  - `Nav group`: `collapsible` (bool);
  - `Sidebar`: `variant` sidebar|floating|inset (3) × `collapsible` expanded|icon|offcanvas (3) = 9.
- **Props (Nav item):** `icon`, `count`, `chevron` (bool), `marker` (bool), `label`.
- **Parts** (from the code, `ns-dashboard__*`):
  - `Sidebar`: `sidebar-header` (`brand-group`) · `sidebar-body` (`nav-group` → `nav-group-label`
    · `nav-item`s, and `nav-divider`) · `sidebar-footer` (environment or user Item);
  - `Nav item`: `marker` · `nav-icon` · `nav-label` · `count` · `chevron`.
- **Bind:**
  - `Nav item`:
    - height H.sm (Studio is 30); padding-x PX.sm; gap GAP; radius
      `+nav/radius (interim SF:nav/radius)`;
    - `nav-icon` I.md `text/muted`; `nav-label` T.body `text/muted`;
    - selected: fill `+nav/active (interim studio/nav/active)`, label T.strong `text/fg`, and the
      `marker` visibility bound to `+deco/marker`;
    - level 2 indents by lit 24.
  - `nav-group-label`: T.eyebrow `text/muted`.
  - `Sidebar`:
    - fill `surface/bg`; a trailing stroke `border/subtle`;
    - width `+space/sidebar/width (interim lit 240)`;
    - padding `space/stack/gap` and `+nav/pad (interim SF:nav/pad)`; group gap
      `space/section/gap`;
    - floating: R.float with an 8px inset; inset: the content area has radius `radius/card`.
- **Lang (Sidebar):**
  - Tonal: a navigation rail, 80 wide, with 80×60 items.
  - Cupertino: a vibrancy panel:
    - `material/fill`, a blur of 18, a rim and a 0 10 28 shadow;
    - traffic lights in the header.
  - Liquid: sidebar glass, with a blur of 60, a top inner highlight and a 1px trailing edge.
  - Fluent: Mica. The content layer has a top-left radius of 8 and a partial border.
- **Lang (Nav item):**
  - Tonal: a rail item, with a 56×32 r16 indicator pill above a 12/16 label.
  - Fluent: a 3×16 accent pill at the leading edge; the icon is filled when selected.
  - Brutal: rest is 28 tall with no fill; selected is 32 tall, filled `surface/selected` (Brutal
    yellow), with a 2px ink border.
  - Filigrane: no fill. Selected gets a 1px `text/fg` underline; the others reserve the slot.
  - Pixel: an uppercase Space Mono label; active adds a 4px banded indicator.
  - Tactile: a 52px pill, printed at rest; selected sinks (pressed-m) and takes accent ink.
- **Nests:** Nav item, Location marker, Icon, Badge, Avatar, Item, Separator, Collapsible.

#### N5 Top bar

- **Sets:** `Top bar`, `variant` app|docs (2) × `breakpoint` desktop|mobile (2) = 4.
- **Parts** (from the code, `ns-dashboard__topbar` and `ns-topbar`): `root` H-AL space-between →
  - `topbar-start`: Sidebar toggle (mobile), `brand` (`logo` · `wordmark`), and Breadcrumb or, on
    docs, Navigation menu;
  - `topbar-end`: Search, Badge (version), Theme toggle, Icon buttons, Avatar.
- **Bind:**
  - height `space/topbar/height`; padding-x `space/page/padding-x`; gap `space/inline/gap`;
  - fill `+topbar/bg (interim studio/topbar/bg)`;
  - bottom stroke `+topbar/rule (interim studio/topbar/rule)` at
    `+topbar/rule-width (interim SF:topbar/rule)`;
  - radius `+topbar/radius (interim SF:topbar/radius)`;
  - DROP_SHADOW: colour `effect/shadow`, y `+topbar/shadow-y (interim SF:topbar/shadow-y)`, blur
    `+topbar/shadow-blur (interim SF:topbar/shadow-blur)`;
  - outer inset `+frame/inset (interim SF:frame/inset)`, for Cloud's floating bar;
  - `logo`: 24×24, fill `+brand/default (interim studio/signal/brand)`, N stroke
    `+brand/fg (interim studio/primary/fg)`;
  - `wordmark`: T.heading `text/fg`, plus "docs" in T.mono `text/muted`.
- **Lang:**
  - Cupertino: no toolbar strip. A large-title row carries floating capsules, and the traffic
    lights live in the sidebar.
  - Liquid: a 52px toolbar band with a scroll-edge blur of 6 and a hairline.
  - Terminal: a status line, `◆ app  ~/path … ● live  hh:mm UTC  user@host`, in T.mono.
  - Pixel: a 64px bar followed by a 10px band stripe.
- **Nests:** Sidebar toggle, Breadcrumb, Navigation menu, Search, Badge, Theme toggle, Icon button,
  Avatar.

#### N6 Navigation menu

- **Sets:**
  - `Nav menu item`: `trigger` link|menu (2) × `state` rest|hover|focus|selected|open (5) = 10;
  - `Navigation menu`: `open` (2).
- **Parts:** `list` → `item` (`marker` · `label` · `chevron`); `viewport` (R.float) → `link` cards
  (`title` · `description`); `indicator`.
- **Bind:**
  - item: height H.sm, padding-x PX.sm, radius `radius/control`, `label` T.body `text/muted`;
  - selected (`aria-current`): `label` T.strong `text/fg` plus the Location marker, which is the
    Utility lane nav;
  - card `title` T.strong; `description` T.small `text/muted`.
- **Lang:**
  - Filigrane: selected gets a 1px `text/fg` underline; the others keep an empty underline slot.
  - Terminal: a numbered tab line, `1:orders 2:customers`.
- **Nests:** Location marker, Icon.

#### N7 Menubar

- **Sets:**
  - `Menubar trigger`: `state` rest|hover|focus|open|disabled (5);
  - `Menubar`: a row of triggers plus open Menu content.
- **Bind:**
  - `root`: fill `surface/bg`, stroke `border/default`, radius `radius/input`, padding lit 4;
  - trigger: height H.sm, padding-x PX.sm, T.strong-sm; open: fill `surface/hover`;
  - menus use the O8 sets, including submenus, checkbox and radio items, and shortcuts.
- **Lang:** none drawn. K2 `source=application-menu` is the desktop analogue.
- **Nests:** Menu content, Menu item, Menu label, Menu separator, Kbd.

#### N8 Location marker

- **Sets:** `Location marker`, `size` sm|md (2): a 4px prose bullet, or the 6px nav and tab marker.
- **Parts:** `root`, a filled square.
- **Bind:** fill `+marker/default (interim studio/signal/marker)`; radius 0. In its parents,
  visibility binds to `+deco/marker`.
- **Lang:** none. Themes replace the marker inside their Nav item and Tab variants.
- **Nests:** none.

#### N9 Stepper

- **Sets:**
  - `Step`: `status` complete|current|upcoming|error (4) × `orientation` (2) = 8;
  - `Stepper`: `orientation` (2).
- **Props:** `description` (bool), `connector` (bool).
- **Parts:** `indicator` · `body` (`title` · `description`) · `connector`.
- **Bind:**
  - `indicator`: lit 24, radius `radius/badge`, number in T.data;
    - complete: `primary/default` with an Icon `check` in `primary/fg`;
    - current: a 2px `primary/default` stroke;
    - upcoming: stroke `border/default`, `text/muted`;
    - error: `destructive/*`;
  - `title` T.strong; `description` T.small `text/muted`;
  - `connector`: `border/default` (complete: `primary/default`; docs LearningPath:
    `+topbar/rule`).
- **Lang:** none drawn.
- **Nests:** Icon.

#### N10 Sidebar toggle

- **Sets:** `Sidebar toggle`, `open` (2).
- **Parts:** an `Icon button / sm` ghost instance showing `panel-left` or `x`. The code uses
  `ns-btn--ghost ns-btn--icon ns-btn--sm`. On mobile it uses `Icon button / lg`, the 44px hit
  target with a 20px `menu` icon (docs §6).
- **Lang:** inherits Icon button's variants.
- **Nests:** Icon button.

### Overlays

#### O1 Dialog

- **Sets:** `Dialog`, `size` sm|md|lg (3; W lit 400/512/640) × `scrim` (2) = 6.
- **Props:** `description`, `close`, `footer` (bool); `body` (swap).
- **Parts** (from the runtime): `backdrop` (R.scrim) · `content` V-AL →
  - `header` → `title` · `description` · `close` (Icon button / sm ghost `x`);
  - `body` (.Slot);
  - `footer` (H-AL, end-aligned) → Buttons.
- **Bind:**
  - `content`: fill `surface/card`, stroke `border/default` at `border/width`, radius
    `radius/card`, padding `space/card/padding`, gap `space/stack/gap`, the R.float shadow;
  - `title` T.heading `text/fg`; `description` T.body `text/muted`;
  - `footer` gap `space/inline/gap`.
- **Lang:**
  - Liquid: the inspector-sheet recipe applied to a dialog: float glass, a blur of 28, a gradient
    rim, r22 and pinned actions.
  - Terminal: a composited layer with a double border; the title sits on the border.
  - Pixel: a `frame/ink` frame with stepped corners over an ink scrim.
  - Tactile: one plateau over the ground, with a dual ±18/44 shadow and no stroke.
- **Nests:** Icon button, Button, .Slot.

#### O2 Alert dialog

- **Sets:** `Alert dialog`, `variant` default|destructive (2) × `size` sm|md (2) = 4.
- **Props:** `media` (bool).
- **Parts:** Dialog's parts plus `media`. The footer holds `cancel` (Button outline) and `action`
  (Button primary or destructive). There is no close icon.
- **Bind:** as Dialog; `media` is a lit 40 tile with `<tone>/subtle` fill and an Icon in
  `<tone>/text`.
- **Lang:** inherits Dialog's variants.
- **Nests:** Button, Icon. K3 `kind=confirm` is the desktop analogue.

#### O3 Sheet

- **Sets:** `Sheet`, `side` top|right|bottom|left (4) × `scrim` (2) = 8.
- **Props:** `footer`, `close`, `handle` (bool).
- **Parts** (from the runtime, `data-side`): `content` → `header` (`title` · `description` ·
  `close`) · `body` · `footer`, plus `handle`. The handle is the grabber `::before` that sheet.css
  draws on the bottom side.
- **Bind:**
  - fill `surface/card`; stroke `border/default` on the inner edge only (per-side weights);
  - radius `radius/card` on the exposed corners only;
  - W lit 400 for left and right; padding `space/card/padding`; the R.float shadow;
  - `handle`: 36×4, radius 999, `border/strong`.
- **Lang:**
  - Bloom: a peach r40 panel nested over a white sheet with 36px top corners.
  - Liquid: an inspector: float glass, a blur of 28, grouped sections, a 30px close circle, pinned
    actions, and no grabber.
- **Nests:** Icon button, Button, .Slot.

#### O4 Drawer

- **Sets:** `Drawer`, `side` bottom|right|left|top (4).
- **Parts:** Sheet's parts. Top and bottom always show the handle. The code's Drawer reuses the
  dialog runtime.
- **Bind:** as Sheet, with a maximum height of 80%.
- **Lang:** inherits Sheet's variants.
- **Nests:** the Sheet parts.

#### O5 Popover

- **Sets:** `Popover`, `placement` top|right|bottom|left (4).
- **Props:** `arrow`, `title`, `description`, `close` (bool).
- **Parts** (from the runtime): `positioner` → `content` (`title` · `description` · `body` ·
  `close`) · `arrow` → `arrow-tip`.
- **Bind:**
  - `content`: R.float, padding `space/stack/gap`, W lit 288;
  - `title` T.strong; `description` T.small `text/muted`;
  - `arrow`: fill `surface/raised`, stroke `border/default`.
- **Lang:** none drawn.
- **Nests:** Icon button, .Slot.

#### O6 Tooltip

- **Sets:** `Tooltip`, `placement` (4).
- **Props:** `arrow`, `kbd` (bool).
- **Parts** (from the runtime): `positioner` → `content` (`label` · `kbd`) · `arrow` → `arrow-tip`.
- **Bind:**
  - fill `surface/inverse`; radius `radius/badge`;
  - padding-x `space/badge/padding-x`, padding-y lit 4;
  - `label` T.small `text/inverse`; `kbd` is a Kbd with `variant=inverse`.
- **Lang:** none drawn.
- **Nests:** Kbd.

#### O7 Hover card

- **Sets:** `Hover card`, `placement` (4).
- **Parts:** `content` (R.float, W lit 320, padding `space/card/padding`) → Avatar / md ·
  `title` · `description` · `meta` (with an Icon `calendar`).
- **Bind:** `title` T.strong; `description` T.small `text/muted`; `meta` T.caption `text/muted`.
- **Lang:** none.
- **Nests:** Avatar, Icon.

#### O8 Dropdown menu

- **Sets:**
  - `Menu item`: `type` action|checkbox|radio|submenu|option (5) × `state`
    rest|highlighted|disabled (3) × `intent` default|destructive (2) = 30. The code's
    `data-intent` is the source of `intent`.
  - `Menu label`, `Menu separator`, and `Menu content` (a container with no variants).
  - `Dropdown menu`: `open` (2). It is a trigger plus positioned content.
- **Props (Menu item):**
  - `iconStart`, `shortcut`, `inset`, `description` and `loading` (bool);
  - `checked` (bool). It shows `indicator` for the checkbox, radio and option types. It is a
    boolean, not a variant, to stay under the cap.
- **Parts:** `item` H-AL → `indicator` (its slot is reserved when `inset`) · `icon` · `label` ·
  `shortcut` · `chevron` (submenu).
- **Bind:**
  - `Menu content`: R.float, padding lit 4, minimum width lit 192;
  - item: height H.sm, padding-x PX.sm, gap GAP, radius `radius/input`, `label` T.body `text/fg`;
  - highlighted: fill `surface/hover`;
  - destructive: label and icon in `destructive/text`; highlighted adds `destructive/subtle`;
  - `shortcut`: T.mono `text/muted`;
  - `Menu label`: T.eyebrow `text/muted`, padding-x PX.sm;
  - `Menu separator`: a 1px `border/subtle` rule with lit 4 margins;
  - `loading` (the code's `data-loading`) shows a Spinner / sm in the icon slot.
- **Lang:** none drawn.
- **Nests:** Menu item, Menu label, Menu separator, Menu content, Button, Icon, Spinner, Kbd.

#### O9 Context menu

- **Sets:** `Context menu`, `open` (2).
- **Parts:** a `trigger` area (a dashed `border/subtle` frame with "Right-click" in T.small
  `text/muted`) plus Menu content at the pointer.
- **Bind:** reuses the O8 sets, including checkbox, radio and submenu items and shortcuts.
- **Lang:** none.
- **Nests:** the O8 sets.

#### O10 Command palette

- **Sets:**
  - `Command item`: `type` page|section|action (3) × `state` rest|selected|disabled (3) = 9. A
    section is a sub-result: indented, with a `hash` icon.
  - `Command palette`: `content` results|empty|loading (3).
- **Props:**
  - `Command item`: `excerpt` (G-13), `url`, `kind`, `shortcut` (bool);
  - `Command palette`: `filters` (G-13), `footer`, `scrim` (bool).
- **Parts** (from the code): `backdrop` · dialog →
  - `input-row` → `search-icon` · `input` · `kbd` (esc);
  - `filters`: lanes with mono counts and the marker;
  - `list` → `group` → `group-label` → `item`s, each with `item-icon` · `item-label` · `item-url`
    · `item-excerpt` · `item-kind` · `item-hash`;
  - `empty`;
  - `footer`.
- **Bind** (docs §7):
  - dialog: W lit 640, placed 96 from the top; fill `surface/card`, stroke `border/default`,
    radius `radius/card`, the R.float shadow;
  - `input-row`: h lit 56 with a `border/subtle` divider; `input` T.body; `filters`: h lit 40;
  - `group-label` T.eyebrow `text/muted`;
  - item: `label` T.strong, `url` T.mono `text/muted`, `excerpt` T.small `text/muted` with matched
    words in T.strong-sm `text/fg` (no colour highlight);
  - selected: `surface/selected`, a 2px `+marker/default` bar and a `corner-down-left` icon;
  - `footer`: h lit 40, `surface/surface`, T.caption `text/muted`.

  shadcn's inline Command is this set with `scrim=false`, inside a Card.
- **Lang:** none drawn.
- **Nests:** Icon, Kbd, Input, Toggle group, Badge, Spinner, Empty state.

### Data display

#### D1 Avatar

- **Sets:**
  - `Avatar`: `size` sm|md|lg (3) × `content` image|initials|agent (3) = 9;
  - `Avatar presence`: `status` online|away|offline (3);
  - `Avatar group`: `size` (3).
- **Props:** `presence` (bool + swap), `badge` (bool; shadcn AvatarBadge), and `count` on the
  group (shadcn AvatarGroupCount).
- **Parts:** `root` → `image` | `initials` | `agent-icon`, plus `presence`.
- **Bind:**
  - W = H `+size/avatar/sm|md|lg (interim lit 24/32/40)`; radius
    `+radius/avatar (interim SF:avatar/radius)`;
  - initials: `surface/muted` with `text/muted`, set in T.caption (sm), T.label (md) or T.strong
    (lg);
  - agent: `primary/default` with `primary/fg`;
  - presence: 8×8 with a 2px `surface/card` ring; online `success/default`, away
    `warning/default`, offline `border/strong`;
  - group: overlap lit −8, with a 2px OUTSIDE ring in `surface/card`.
- **Lang:**
  - Tonal: the selected avatar uses the 8-point "sunny" expressive shape.
  - Pixel: a 28px identicon on a 2px grid replaces the initials.
  - Tactile: presence becomes a status LED with a glow on the tone disc.
- **Nests:** Icon.

#### D2 Badge

- **Sets:** `Badge`, `variant` primary|secondary|success|warning|destructive|info|muted (7) ×
  `emphasis` subtle|strong|outline|dot (4) = 28.
- **Props:** `iconStart` (bool + swap), `remove` (bool), `label`.
- **Parts:** `root` H-AL → `dot` (6×6) · `icon` · `label` · `remove`.
- **Bind:**
  - height `space/badge/height`; padding-x `space/badge/padding-x`; gap lit 4;
  - radius `radius/badge`; stroke weight `border/width`; `label` T.label.

  For `<v>` = primary, secondary, success, warning, destructive or info:

  | emphasis | fill          | stroke       | label        | dot           |
  | -------- | ------------- | ------------ | ------------ | ------------- |
  | subtle   | `<v>/subtle`  | `<v>/border` | `<v>/text`   | —             |
  | strong   | `<v>/default` | —            | `<v>/fg`     | —             |
  | outline  | —             | `<v>/border` | `<v>/text`   | —             |
  | dot      | —             | —            | `text/fg`    | `<v>/default` |

  `muted` uses neutral roles instead:

  | emphasis | Roles                                                  |
  | -------- | ------------------------------------------------------ |
  | subtle   | `surface/muted`, `border/default`, `text/muted`        |
  | strong   | `surface/inverse`, `text/inverse`                      |
  | outline  | `border/default`, `text/muted`                         |
  | dot      | dot in `text/muted`                                    |

  Docs mapping: stable → success, alpha → warning, partial → muted. The VersionChip is `muted`
  outline with a T.mono label.
- **Lang:**
  - Brutal: a sticker:
    - a 26 tall pill with a 2px ink border;
    - Space Mono Bold, uppercase;
    - one per screen may tilt −6°.
  - Terminal: a bracketed six-character word coloured by role, with no container.
  - Pixel: 24 tall, with a 2px tone lip, uppercase Space Mono on `<tone>/subtle` and 2px notched
    corners.
- **Nests:** Icon.

#### D3 Card

- **Sets:** `Card`, `variant` default|rule (2; `rule` is G-15) × `size` md|sm (2) × `state`
  rest|hover|focus|selected (4) = 16.
- **Props:** `header`, `description`, `action`, `footer` (bool); `body` (swap).
- **Parts** (from the code): `root` V-AL →
  - `header` → (`title` · `description`) · `action`;
  - `body` (.Slot);
  - `footer`.
- **Bind:**
  - default:
    - fill `surface/card`;
    - stroke `+card/border (interim studio/card/border)`, with per-side weights
      `+card/border-top|side|bottom (interim SF:card/border-top, SF:card/border-side,
      SF:card/border-bottom)`;
    - radius `radius/card`; padding `space/card/padding` (sm: `space/stack/gap`); gap
      `space/stack/gap`; R.card-shadow;
    - `title` T.heading `text/card`; `description` T.small `text/muted`;
    - `footer`: fill `+card/footer (interim studio/card/footer)`, a top `border/subtle` rule;
  - rule (docs §4): no fill, no radius and no shadow; a top stroke only, in `border/subtle`;
    hover fills `surface/surface`;
  - interactive states (the code's `interactive` prop): hover stroke `border/strong`; selected adds
    R.selected and a `border/control` stroke.
- **Lang:**
  - Bloom: an r32 pastel widget. The notched widget is clipped by the notch path and holds a disc
    in the notch; nested tiles are near-concentric.
  - Terminal: a pane. A 1px `border/strong` r8 frame carries the title on its top border, framed by
    `┤ ├`; the active pane is 2px `border/ring`.
  - Tactile: a plateau: flat material with dual ±18/44 shadows and an in-hue border. It is never
    pressable.
- **Nests:** .Slot, Button.

#### D4 Table

- **Sets:**
  - `Table header cell`: `align` start|center|end (3) × `sort` none|asc|desc (3) = 9;
  - `Table cell`: `variant` text|strong|num|data|muted (5) × `align` (3) = 15. The code's DataGrid
    cell variants are `strong` and `num`.
  - `Table row`: `state` rest|hover|selected|focus (4) × `zebra` (2) × `layout` row|stacked (2) =
    16;
  - `Table`: a composition.
- **Parts** (from the code, responsive-table): `scroller` → `table` →
  - `caption`;
  - `head` → header row → `header` cells;
  - `body` → `row` → `cell` → `cell-value`. In the stacked layout, the `data-label` shows in
    T.eyebrow.
  - `summary` and `empty`.
- **Bind:**
  - head row:
    - fill `+table/head (interim studio/table/head)`;
    - bottom stroke `+table/head-rule (interim studio/table/head-rule)` at
      `+table/head-rule-width (interim SF:table/head-rule)`;
    - text T.eyebrow `text/muted`; height H.md;
  - row:
    - height `space/table/row-height`; fill `+table/row-bg (interim studio/table/row-bg)`;
    - bottom stroke `+table/row-rule (interim studio/table/row-rule)` at
      `+table/row-rule-width (interim SF:table/row-rule)`;
    - radius `+table/row-radius (interim SF:table/row-radius)`; gap between rows
      `+table/row-gap (interim SF:table/row-gap)`; inset `+table/inset (interim SF:table/inset)`;
    - hover `+table/hover (interim studio/table/hover)`; zebra
      `+table/zebra (interim studio/table/zebra)`;
    - selected: R.selected, a 2px `selection-bar` in `+marker/default`, and a checked box;
  - cell:
    - padding-x `space/table/cell-padding-x`;
    - column rule `+table/cell-rule (interim studio/table/cell-rule)` at
      `+table/cell-rule-width (interim SF:table/cell-rule)`;
    - text T.body `text/fg`, `strong` T.strong, `num` and `data` T.data (end-aligned), `muted`
      `text/muted`;
  - `caption` T.small `text/muted`.
- **Lang (Table row):**
  - Tonal: segmented rows, 72px tall, 2px apart, in `surface/container`. Outer corners are 28 on
    the first and last rows; inner corners are 6.
  - Bloom: an 84px r28 pill row with 20px insets and a 44px numbered pastel disc.
  - Fluent: selected adds a 3×16 accent pill at the leading edge; hover and selected use
    `fluent/subtle/secondary`.
  - Filigrane: no fill. Selected is a checked box plus a 3px `primary` margin bar outside the cell.
  - Terminal: a 24px text line. Selected is a full-width inverse bar with a `▶` marker.
  - Pixel: 56px; selected adds a fill and a 4px banded bar.
  - Tactile: separate 72px tiles with no rules. Selected sinks (pressed-m) and gets a 4×32 LED
    edge.
- **Nests:** Checkbox, Avatar, Badge, Icon button, Dropdown menu, Icon.

#### D5 Data table

- **Sets:** `Data table`, `state` default|selection|empty|loading (4) × `breakpoint`
  desktop|mobile (2) = 8.
- **Parts** (from the code: data-table and DataGrid):
  - `header`: a toolbar with Search, Toggle group filters, a "Columns" Dropdown menu and a Button
    outline "Export";
  - `bulk-actions`: an Action bar, `variant=inline`;
  - the Table, with a selection column, sortable headers and a row action (Icon button ghost
    `more-horizontal`);
  - `footer`: Pagination;
  - loading shows the table Skeleton preset; empty shows an Empty state in the body.
- **Bind:** inherited; the toolbar uses gap `space/inline/gap` and padding `space/card/padding`.
- **Lang:** inherits the Table row variants.
- **Nests:** Card, Search, Toggle group, Button, Dropdown menu, Action bar, the Table sets,
  Checkbox, Pagination, Skeleton, Empty state.

#### D6 Item

- **Sets:**
  - `Item`: `variant` default|outline|muted (3) × `size` default|sm|xs (3) = 9;
  - `Item group`: `separators` (bool).
- **Props:** `media` (swap: an icon tile, an Avatar or an image), and the booleans `description`,
  `actions`, `header`, `footer` and `chevron`.
- **Parts:** `root` H-AL → `media` · `content` (`title` · `description`) · `actions`, plus `header`
  and `footer` rows.
- **Bind:**
  - padding `space/card/padding` (sm: `space/stack/gap`; xs: lit 8); gap `space/stack/gap`; radius
    `radius/input`;
  - outline: stroke `border/default`; muted: fill `surface/muted`;
  - `title` T.strong; `description` T.small `text/muted`;
  - icon tile: lit 32, `surface/muted`, radius `radius/badge`.

  Fluent's SettingsCard is an outline Item.
- **Lang:**
  - Cupertino: an inset grouped list:
    - a section caption above an r12 group of 44px rows;
    - separators inset 16 from the leading edge;
    - value rows show a muted value and a chevron.
  - Liquid: grouped sections inside the sheet. Groups are inset 17, rows are inset 15, and the
    dividers are 1px at 8%.
- **Nests:** Icon, Avatar, Button, Icon button, Switch, Separator.

#### D7 Kbd

- **Sets:**
  - `Kbd`: `size` sm|md (2) × `variant` default|inverse (2) = 4;
  - `Kbd group`: keys joined by "+" in T.caption `text/muted`.
- **Parts:** `root` → `label`.
- **Bind** (Utility kit, docs §5):
  - h lit 20 (sm 16), `+size/kbd`; padding-x lit 5; radius `radius/badge`;
  - fill `surface/card`; stroke `border/default`;
  - `label`: `font/mono` + `type/caption/*`, in `text/muted`;
  - inverse: no fill, stroke and label `text/inverse`.
- **Lang:** none. Terminal's keycap fill is a token difference.
- **Nests:** none.

#### D8 Code block

- **Sets:**
  - `Code line`: `variant` default|added|removed|highlighted (4);
  - `Code block`: `variant` default|destructive (2) × `size` md|sm (2) × `header` none|title|tabs
    (3) = 12. The tabs header is G-12.
- **Props:** `copy`, `lineNumbers`, `footer`, `scrollbar` (bool).
- **Parts** (from the code and shadcn): `root` V-AL →
  - `head` → `name` · `lang` · `tabs` · `copy`;
  - `content` → `line`s, each with `line-number` · `code`;
  - `scrollbar` → `thumb`;
  - `footer`.
- **Bind:**
  - `root`: fill `surface/surface` (the docs code panel), stroke `border/subtle`, radius
    `radius/card`;
  - `head`: h lit 40, padding-x PX, a bottom `border/subtle` rule;
    - `name` T.mono `text/fg` (the G-2 path grammar); `lang` T.eyebrow `text/muted`;
    - `tabs`: Tabs `line`;
    - `copy`: Icon button / sm ghost. When the code's `data-state=copied`, the glyph swaps to
      `check`.
  - `content`: padding `space/stack/gap`; `code` T.mono `text/fg`; `line-number` T.mono
    `text/muted`, right-aligned, W lit 32;
  - added: `success/subtle`, with the gutter in `success/text`;
  - removed: `destructive/subtle`, with the gutter in `destructive/text`;
  - highlighted: `surface/selected` plus a 2px `+marker/default`;
  - `thumb`: h 6, `+scrollbar/thumb (interim studio/code/scroll-thumb)`;
  - destructive: stroke `destructive/border`;
  - syntax colours: monochrome until `+code/syntax/*` exists.
- **Lang:** none drawn.
- **Nests:** Tabs, Icon button, Icon, Code line.

#### D9 Chart

- **Sets:**
  - `Chart`: `type` area|line (2) × `series` 1|2|3 (3) = 6. Bar charts are D10 and donuts D11.
  - `Chart legend`: `orientation` (2);
  - `Chart tooltip`: `indicator` dot|line|dashed (3), as in shadcn.
- **Parts:** `root` →
  - `header` (`title` · `description`);
  - `plot` → `grid` · `axis-x` · `axis-y` · `series-1…3` · `cursor`;
  - `legend`;
  - `tooltip`, with rows of `swatch` · `label` · `value`.
- **Bind:**
  - series strokes lit 2 in `+chart/1..5`. Interims, in order: `primary/default`, `info/default`,
    `success/default`, `warning/default`, `destructive/default`. The area is the same role at layer
    opacity 0.2.
  - `grid`: `border/subtle`; axes: T.caption `text/muted`;
  - `tooltip`: R.float, padding lit 8, `label` T.small `text/muted`, `value` T.data;
  - Studio decorations: the sparkline and ticks bind their visibility to `SF:deco/sparkline` and
    `SF:deco/ticks`.
- **Lang:** none. Theme-specific trend bars live in the L3 Stat card variants.
- **Nests:** Card, Chart legend, Chart tooltip.

#### D10 Chart block

- **Sets:**
  - `Chart row`: `variant` bar|column (2) × `tone` primary|success|warning|destructive|secondary (5)
    = 10;
  - `Chart block`: `variant` (2).
- **Parts** (from the code):
  - bar: `title` · `sub` · `row`s → `label` · `track` → `bar` · `value`;
  - column: `plot` → `yaxis` (`ytick`s) · `grid` · `col` → `bar` · `val`, then `xaxis`.
- **Bind:**
  - `title` T.heading; `sub` T.small `text/muted`; `label` T.small; `value` T.data;
  - `track`: `material/track`, h lit 8, radius 999;
  - `bar`: `<tone>/default`;
  - `grid`: `border/subtle`; ticks T.caption `text/muted`.
- **Lang:** none.
- **Nests:** none.

#### D11 Donut

- **Sets:**
  - `Donut legend row`: `tone` (5);
  - `Donut`: `segments` 2|3|4|5 (4).
- **Parts** (from the code): `svg` → `ring` plus segment arcs · `center` · `legend` → `row`s
  (`swatch` · `label` · `value`).
- **Bind:**
  - `ring`: stroke `material/track`; arcs: stroke `<tone>/default` at lit 12;
  - `center`: T.kpi-sm `text/fg` over T.caption `text/muted`;
  - `swatch`: 8×8, radius `radius/badge`.
- **Lang:** none.
- **Nests:** Donut legend row.

#### D12 Accordion

- **Sets:**
  - `Accordion item`: `open` (2) × `state` rest|hover|focus|disabled (4) = 8;
  - `Accordion`: three items separated by `border/default` rules.
- **Parts** (from the runtime): `item` → `item-trigger` (`label` · `item-indicator`) ·
  `item-content`.
- **Bind:**
  - `item-trigger`: padding-y `space/stack/gap`; `label` T.strong, underlined on hover (as shadcn
    does);
  - `item-indicator`: I.md `chevron-down` in `text/muted`, rotated 180° when open;
  - `item-content`: T.body `text/muted`.

  The code also supports a horizontal orientation; Figma builds the vertical one only.
- **Lang:** none drawn.
- **Nests:** Icon, .Focus ring.

#### D13 Collapsible

- **Sets:** `Collapsible`, `open` (2).
- **Parts:** `trigger` (Button / sm ghost with a chevron) · `content` (.Slot).
- **Bind:** gap `space/stack/gap`.
- **Lang:** none.
- **Nests:** Button, Icon, .Slot.

#### D14 Carousel

- **Sets:** `Carousel`, `orientation` (2) × `controls` outside|inside (2) = 4.
- **Props:** `dots` (bool).
- **Parts:** `viewport` → `slide`s (.Slot) · `previous` · `next` · `dots`.
- **Bind:**
  - `previous` and `next`: Icon button / sm outline with radius overridden to 999;
  - `dots`: 8×8; the current dot is `text/fg`, the others `border/strong`;
  - gap `space/stack/gap`.
- **Lang:** none.
- **Nests:** Icon button, Card, .Slot.

### Feedback

#### B1 Alert

- **Sets:** `Alert`, `variant` neutral|info|success|warning|destructive (5) × `emphasis`
  subtle|strong (2; `strong` is G-16) = 10.
- **Props:** `icon`, `title`, `description`, `action`, `close` (bool).
- **Parts** (from the code): `root` H-AL → `icon` · `body` (`title` · `description` · `actions`) ·
  `close`.
- **Bind:**
  - padding-y `space/stack/gap` and padding-x `space/control/padding-x` (Studio's notice is 12/14);
  - gap GAP; radius `radius/card`; stroke weight `border/width`;
  - `title` T.strong `text/fg`; `description` T.small `text/muted`;
  - `actions`: a ghost Button; its label is `text/fg`, underlined.

  | variant     | fill (subtle)         | stroke               | icon               |
  | ----------- | --------------------- | -------------------- | ------------------ |
  | neutral     | `surface/surface`     | `border/default`     | `text/fg`          |
  | info        | `info/subtle`         | `info/border`        | `info/text`        |
  | success     | `success/subtle`      | `success/border`     | `success/text`     |
  | warning     | `warning/subtle`      | `warning/border`     | `warning/text`     |
  | destructive | `destructive/subtle`  | `destructive/border` | `destructive/text` |

  The strong emphasis is the docs "important" callout and blockquote treatment:
  - fill `surface/surface`, with no box stroke;
  - a 2px leading `rule`: `+marker/default` for neutral and info, and `<tone>/default` for the
    other variants.
- **Lang:**
  - Tonal: an r28 banner in `surface/container-high`, with a shape-badge icon container and text and
    tonal actions.
  - Brutal: a `block/pink` slab at Slab L, with an ink alert disc and an underlined mono action.
  - Filigrane: no box:
    - a 1px `primary` top rule and a `primary/text` label;
    - a large serif sentence over a muted body, with a link action.
  - Terminal: a pane row with a `WARN`/`INFO` level column.
  - Pixel: a `warning/subtle` panel with an 8px banded leading bar and a pixel triangle.
  - Tactile: a plateau with an amber LED label and a convex action key.
- **Nests:** Icon, Button, Icon button.

#### B2 Inline notice

- **Sets:** `Inline notice`, `variant` (5, as Alert).
- **Parts:** Alert's parts, at a compact size.
- **Bind:**
  - padding-y lit 8, padding-x `space/stack/gap`; radius `radius/input`;
  - fill `surface/surface`; stroke `<tone>/border`;
  - `title` and `description` T.small.
- **Lang:** inherits Alert's variants.
- **Nests:** Icon.

#### B3 Toast

- **Sets:** `Toast`, `type` default|success|error|warning|info|loading (6).
- **Props:** `eyebrow`, `description`, `action`, `dismiss`, `progress` (bool). The toaster position
  is page layout, not a variant.
- **Parts** (from the code): `panel` →
  - `header` → `symbol` · `title-group` (`eyebrow` · `title`);
  - `message`;
  - `action`;
  - `dismiss`;
  - `progress-track` → `progress-bar`.
- **Bind:**
  - `panel`: R.float, W lit 360, padding `space/stack/gap`, gap GAP;
  - `symbol`: a lit 24 disc in `<tone>/subtle` with a `<tone>/text` glyph (loading shows a
    Spinner);
  - `eyebrow` T.eyebrow `<tone>/text`; `title` T.strong `text/fg`; `message` T.small `text/muted`;
  - `progress-track`: h 2, `material/track`; `progress-bar`: `<tone>/default`;
  - `error` maps to `destructive/*`; `default` uses `text/fg` on `surface/muted`.
- **Lang:** none drawn.
- **Nests:** Icon, Spinner, Button, Icon button.

#### B4 Progress

- **Sets:** `Progress`, `variant` primary|secondary|success|warning|destructive (5) × `size`
  sm|md|lg (3) × `state` rest|loading (2) = 30. `loading` is the indeterminate state.
- **Props:** `label`, `value` (bool).
- **Parts** (from the code): `root` V-AL → (`label` · `value`) · `track` → `bar`.
- **Bind:**
  - `track`: `material/track`, h lit 5, 8 or 11 (the code uses 0.325, 0.5 and 0.7 rem), radius
    `radius/badge`;
  - `bar`: `<v>/default`; loading draws it at 42% width, offset;
  - `label` T.small `text/fg`; `value` T.data `text/muted`.
- **Lang:**
  - Tonal: a wavy 4px line in `primary/text` with a stop dot; the remainder is `text/muted`.
  - Terminal: a character bar with a lime fill and a dithered remainder.
  - Pixel: four segments of 2px-band blocks; the undone segment is flat.
  - Tactile: a meter in a well-s track.
- **Nests:** none.

#### B5 Spinner

- **Sets:** `Spinner`, `size` sm|md|lg (3; 16/24/40, as in the code).
- **Parts:** `root` → `track` · `arc`.
- **Bind:**
  - `track`: stroke `border/subtle`; `arc`: stroke `primary/default` with a round cap;
  - stroke weight lit 2 (lg 3);
  - parents override the arc colour: inside a Button it takes the label role.
- **Lang:** none drawn.
- **Nests:** none.

#### B6 Skeleton

- **Sets:**
  - `Skeleton`: `shape` line|block|circle (3) × `size` xs|sm|md|lg (4) = 12;
  - `Skeleton preset`: `variant` table|stats|detail|form (4), as in the code.
- **Bind:**
  - fill `surface/muted`;
  - radius `radius/input`, with `radius/badge` for lines and 999 for circles;
  - presets lay out with gap `space/stack/gap`.

  The shimmer is a static, unbound gradient.
- **Lang:** none.
- **Nests:** Skeleton.

#### B7 Empty state

- **Sets:** `Empty state`, `media` none|icon|image (3) × `size` md|sm (2) = 6.
- **Props:** `description`, `actions`, `border` (bool).
- **Parts:** `root` V-AL, centred → `header` (`media` · `heading` · `description`) · `content`
  (actions).
- **Bind:**
  - padding `space/section/gap`; gap `space/stack/gap`;
  - `media`: a lit 40 tile in `surface/muted`, radius `radius/card`, with an I.lg icon in
    `text/muted`;
  - `heading` T.heading; `description` T.body `text/muted` with a maximum width of lit 360;
  - `border`: a dashed `border/default` stroke.
- **Lang:** none.
- **Nests:** Icon, Button.

### Layout & blocks

#### L1 App shell

- **Sets:** `App shell`, `layout` dashboard|chat|docs (3) × `breakpoint` desktop|tablet|mobile (3)
  = 9.
- **Props:** `nav`, `rail` (bool; the code's `data-nav` and `data-rail`).
- **Parts** (from the code, `ns-dashboard` and `ns-app`): `root` H →
  - `sidebar`;
  - `main` → `topbar` · `content`;
  - chat adds `session` → `thread` · `composer`;
  - docs adds a Toc rail;
  - mobile turns the sidebar into a left Sheet with a `sidebar-backdrop` (R.scrim).
- **Bind:**
  - `root`: fill `surface/bg`;
  - `content`: padding `space/page/padding-x|y`, gap `space/section/gap`, maximum width lit 1200.
- **Lang:** Terminal: a pane grid with a status line and a help bar, in place of the sidebar and
  top bar. The other themes swap in their nested Sidebar and Top bar variants.
- **Nests:** Sidebar, Top bar, Sidebar toggle, Sheet, Message scroller, Prompt input, Toc, Page
  header.

#### L2 Page header

- **Sets:** `Page header`, `variant` default|with-tabs|with-status (3) × `breakpoint` (2) = 6.
- **Props:** `eyebrow`, `description`, `actions`, `breadcrumb` (bool).
- **Parts** (from the code): `layout` → `main` → `intro` (`eyebrow` · `title` · `description`) ·
  `actions`; `status-bar` (`status-indicator` · `status-sep`); `tabs`.
- **Bind:**
  - `eyebrow` T.eyebrow `text/muted`; `title` T.title `text/fg` (the #2416 `title` prop);
    `description` T.body `text/muted`;
  - gap `space/stack/gap`; bottom padding `space/section/gap`.
- **Lang:** none.
- **Nests:** Breadcrumb, Button, Tabs, Badge.

#### L3 Stats grid

- **Sets:**
  - `Stat card`: `variant` default|hero (2) × `delta` up|down|none (3) = 6;
  - `Stats grid`: `columns` 2|3|4 (3) × `joined` (2; the Ledger strip) = 6.
- **Props:** `badge`, `icon` and `detail` (bool), plus three decorations whose visibility binds to a
  variable: `sparkline` (`SF:deco/sparkline`), `ticks` (`SF:deco/ticks`) and `blockbars`
  (`SF:deco/blockbars`).
- **Parts** (from the code): `card` → `header` (`label` · `badge`) · `body` (`value` · `detail`) ·
  `sparkline` | `ticks` | `blockbars`.
- **Bind:**
  - fill `+kpi/bg-1..4 (interim studio/kpi/bg-1..4)`, by position;
  - stroke `+kpi/border (interim studio/kpi/border)`, with per-side weights
    `+kpi/border-top|right|bottom|left (interim SF:kpi/border-*)` and
    `+kpi/first-left (interim SF:kpi/first-left)` on the first card;
  - padding-x `+kpi/pad-x (interim SF:kpi/pad-x)`, padding-y `space/card/padding`;
  - grid gap `+kpi/gap (interim SF:kpi/gap)`; radius `radius/card`; R.card-shadow;
  - `label` T.eyebrow `text/muted`; `value` T.kpi `text/fg`;
  - `detail` T.small `text/muted`, with the delta arrow in `success/text` or `destructive/text`;
  - hero: `primary/default` with `primary/fg`.
- **Lang (Stat card):**
  - Tonal:
    - the hero is 380×210, r32, `primary`, with an area sparkline;
    - secondary cards are r28 `surface/container` with a shape-badge icon and a delta pill.
  - Bloom: an r32 pastel widget with action and outline discs, a delta pill and a progress track.
    The notched ink widget is a further case.
  - Brutal: a `block/*` fill at Slab L, with an ink delta pill and 12 ink bars.
  - Terminal: a metrics pane with right-aligned values, ▲/▼ deltas and block-character trend bars.
  - Pixel: a Pixelify value over a block chart whose last column is banded.
  - Tactile: an H−1 well-l readout with 14 ink bars; the trend shows by height only.
- **Nests:** Card, Badge, Icon, Chart.

#### L4 Detail layout

- **Sets:** `Detail layout`, `breakpoint` (2).
- **Parts** (from the code): `main` (sections separated by Section dividers) · `aside` (W lit 320).
- **Bind:** gap `space/section/gap`.
- **Lang:** none.
- **Nests:** Section divider, Card, Panel, .Slot.

#### L5 Filter form

- **Sets:** `Filter form`, `layout` inline|stacked (2).
- **Parts** (from the code): a Card → `body` (a grid of Fields) · `actions` (a primary "Apply" and a
  ghost "Reset").
- **Bind:** gap `space/stack/gap`.
- **Lang:** none.
- **Nests:** Card, Field, Input, Select, Date picker, Button.

#### L6 Panel

- **Sets:** `Panel`, `tone` default|muted|raised (3; the code's `PanelTone`).
- **Props:** `footer` (bool).
- **Parts** (from the code): `header` (`title` · `description`) · `body` · `footer`.
- **Bind:**
  - default: fill `surface/card`, stroke `border/default`;
  - muted: fill `surface/muted`;
  - raised: fill `surface/raised` with R.card-shadow;
  - radius `radius/card`; padding and gap `space/stack/gap`;
  - `title` T.strong; `description` T.small `text/muted`.
- **Lang:** none.
- **Nests:** .Slot.

#### L7 Separator

- **Sets:** `Separator`, `orientation` (2) × `variant` subtle|default|strong (3) = 6.
- **Bind:** colour `border/subtle`, `border/default` or `border/strong`; thickness `border/width`.
- **Lang:** Brutal: activity dividers are 1.5px dashed [6,4]. The dash pattern cannot bind to a
  variable.
- **Nests:** none.

#### L8 Section divider

- **Sets:** `Section divider`, `align` start|center (2).
- **Parts** (from the code): `label` · `line`.
- **Bind:** `label` T.eyebrow `text/muted`; `line` `border/subtle` with h `border/width`; gap
  `space/inline/gap`.
- **Lang:** none.
- **Nests:** none.

#### L9 Scroll area

- **Sets:**
  - `Scrollbar`: `orientation` (2) × `state` rest|hover (2) = 4;
  - `Scroll area`: `orientation` vertical|horizontal|both (3).
- **Parts:** `viewport` · `scrollbar` → `thumb` · `corner`.
- **Bind:** `thumb` fill `+scrollbar/thumb (interim studio/code/scroll-thumb)`, radius 999, W lit 6
  (8 on hover).
- **Lang:** none.
- **Nests:** Scrollbar, .Slot.

#### L10 Resizable

- **Sets:**
  - `Resizable handle`: `orientation` (2) × `state` rest|hover|focus (3) = 6;
  - `Resizable`: `direction` (2).
- **Props:** `grip` (bool).
- **Parts:** `panel-group` → `panel` · `handle` → `grip`.
- **Bind:**
  - `handle`: a 1px `border/default` line;
  - `grip`: 12×16 in `surface/muted`, stroke `border/default`, radius `radius/badge`, with an I.sm
    `grip-vertical` icon.
- **Lang:** none.
- **Nests:** Icon, .Slot.

#### L11 Aspect ratio

- **Sets:** `Aspect ratio`, `ratio` 16:9|4:3|1:1|21:9 (4).
- **Parts:** `root` (clips) → `media`.
- **Bind:** radius `radius/card`; fill `surface/muted`.
- **Lang:** none.
- **Nests:** .Slot.

#### L12 Direction (RTL)

No component set: DirectionProvider has no visual output. Instead, build an "RTL" specimen frame on
Foundations that mirrors Button, Input, Breadcrumb and Sidebar. The base components already use
logical part names (`icon-start`, `icon-end`, `inline-start`), so mirroring needs no new variants.

### AI

#### I1 Message

- **Sets:** `Message`, `role` user|assistant|system (3) × `state` rest|pending (2) = 6.
  - shadcn's `align` follows the role: `user` = end.
  - `pending` shows the typing indicator.
- **Props:** `avatar`, `header`, `actions`, `followups`, `footer` (bool).
- **Parts** (from the code): `root` H-AL →
  - `avatar`;
  - `main` → `head` (`author` · `model` · `time`) · `body` (a Bubble, or plain `text` for the
    assistant) · blocks · `actions` · `followups`;
  - the system role renders a centred Marker instead.
- **Bind:**
  - gap `space/stack/gap`;
  - `author` T.strong-sm; `model` and `time` T.caption `text/muted`;
  - `text` T.body `text/fg`;
  - typing indicator: three 6×6 dots in `text/muted`.
- **Lang:** none drawn.
- **Nests:** Avatar, Bubble, Code block, Chart block, Tool call card, Citation chip, Icon button,
  Button, Marker.

#### I2 Bubble

- **Sets:** `Bubble`, `variant` default|secondary|muted|tinted|outline|ghost|destructive (7) ×
  `align` start|end (2) = 14.
- **Props:** `reactions` (bool).
- **Parts:** `root` → `content`, plus `reactions` (outline sm Badges with an emoji and a count).
- **Bind:**
  - padding-x `space/control/padding-x`, padding-y lit 8; radius `radius/card`; `content` T.body;

  | variant     | Roles                                       |
  | ----------- | ------------------------------------------- |
  | default     | `primary/default` with `primary/fg`         |
  | secondary   | `secondary/default` with `secondary/fg`     |
  | muted       | `surface/muted` with `text/fg`              |
  | tinted      | `accent/subtle` with `text/fg`              |
  | outline     | stroke `border/default`                     |
  | ghost       | none                                        |
  | destructive | `destructive/subtle` with `destructive/text` |
- **Lang:** none.
- **Nests:** Badge.

#### I3 Message scroller

- **Sets:** `Message scroller`, `scrollable` none|up|down|both (4; the `data-scrollable`
  attribute).
- **Parts:** `viewport` → `content` → `item`s (Messages), plus `scroll-button`.
- **Bind:**
  - fill `surface/bg`; item gap `space/section/gap`; content maximum width lit 720 (`.ns-thread`);
  - `scroll-button`: Icon button / sm outline with radius 999, `arrow-down` and the R.float shadow.
- **Lang:** none.
- **Nests:** Message, Icon button.

#### I4 Marker

- **Sets:** `Marker`, `variant` default|border|separator (3).
- **Parts:** `root` H-AL, centred → `icon` · `content`.
- **Bind:**
  - `icon` I.sm `text/muted`; `content` T.small `text/muted`;
  - separator: rules on both sides in `border/subtle`;
  - border: stroke `border/default`, radius `radius/input`, padding-x PX.sm.
- **Lang:** none.
- **Nests:** Icon, Separator.

#### I5 Trace

- **Sets:**
  - `Trace line`: `status` done|running|pending|error (4) × `open` (2) = 8;
  - `Trace`: a list.
- **Props:** `description`, `collapsible` (bool).
- **Parts:** `line` → `icon` · `title` · `description` · `collapsible-trigger` ·
  `collapsible-content`, plus a vertical `connector`.
- **Bind:**
  - `icon`: running shows a Spinner / sm; error `alert-circle` in `destructive/text`; pending
    `circle` in `text/muted`;
  - `title` T.strong-sm; `description` T.small `text/muted`;
  - `connector`: `border/subtle`; gap `space/inline/gap`.
- **Lang:** none.
- **Nests:** Icon, Spinner, Code block, Collapsible.

#### I6 Questionnaire

- **Sets:**
  - `Questionnaire choice`: `multiple` (2) × `state` rest|hover|focus|selected|disabled (5) = 10;
  - `Questionnaire`: `step` question|freeform|complete (3).
- **Parts:** `progress` · `item` →
  - `title` · `description`;
  - `choices` → `choice` (`shortcut` · `label` · `indicator`);
  - `input`;
  - `error`;
  - `actions` (previous · skip · next · submit).
- **Bind:**
  - `title` T.heading; `description` T.body `text/muted`;
  - `choice`: stroke `border/default`, radius `radius/input`, padding PX; selected adds
    R.selected and a `primary/default` stroke;
  - `error` `destructive/text`;
  - `actions`: ghost Buttons for previous and skip; primary Buttons for next and submit.
- **Lang:** none.
- **Nests:** Progress, Kbd, Radio, Checkbox, Textarea, Button.

#### I7 Attachment

- **Sets:** `Attachment`, `state` idle|uploading|processing|error|done (5) × `size` default|sm|xs
  (3) × `orientation` (2) = 30.
- **Props:** `media` (swap: icon|image), `description`, `actions` (bool).
- **Parts:** `root` → `media` · `content` (`title` · `description`) · `actions`.
- **Bind:**
  - fill `surface/card`; stroke `border/default`; radius `radius/input`; padding lit 8; gap
    `space/inline/gap`;
  - `media`: a lit 40 tile in `surface/muted`;
  - `title` T.strong-sm, truncated; `description` T.caption `text/muted`;
  - uploading and processing show a Progress / sm or a Spinner;
  - error: stroke `destructive/border`, `description` in `destructive/text`.

  AttachmentGroup is a horizontal scroll row built from L9, not a set.
- **Lang:** none.
- **Nests:** Icon, Icon button, Progress, Spinner.

#### I8 Prompt input

- **Sets:** `Prompt input`, `state` rest|focus|busy|disabled (4) × `compact` (2; from the code) = 8.
- **Props:** `attachments`, `tools`, `hint`, `modelSelector` (bool).
- **Parts** (from the code): `root` V →
  - `field` (a strokeless Textarea);
  - an attachments row;
  - `bar` → `tools` · `actions`;
  - `hint`.

  `tools` holds ghost Icon buttons (`paperclip`, `camera`, `mic`) and Toggles ("Grounding" with
  `globe`, and "Research"). `actions` holds the Model selector and `send`, an Icon button / sm
  primary with `arrow-up`; when busy, `send` becomes `stop` (`square`).
- **Bind:**
  - fill `surface/card`; stroke `border/input`; radius `radius/card`; padding `space/stack/gap`;
    gap `space/inline/gap`; the focus ring goes on `root`;
  - `hint` T.caption `text/muted`, with a "↵" Kbd.
- **Lang:** none drawn.
- **Nests:** Textarea, Icon button, Toggle, Model selector, Attachment, Kbd.

#### I9 Model selector

- **Sets:**
  - `Model option`: `state` rest|hover|focus|selected (4);
  - `Model selector`: `open` (2) × `align` left|right (2; the code's `data-align`) = 4.
- **Parts** (from the code):
  - `btn` → `provider` · label · chevron;
  - `menu` (R.float) → `opt` → `main` (`label` · `desc`) · `check`.
- **Bind:**
  - menu and options as O8;
  - `label` T.strong-sm; `desc` T.caption `text/muted`;
  - selected: `check` in `primary/text`.
- **Lang:** none.
- **Nests:** Icon, Menu content.

#### I10 Tool call card

- **Sets:** `Tool call card`, `status` running|done|error (3) × `open` (2) = 6.
- **Parts** (from the code):
  - `summary` → `icon` · `name` · status Badge (`dot`) · `chevron`;
  - `panel` → two `io` blocks, each with `io-label` and `pre`. The labels read "Arguments" and
    "Result"; `pre` is a Code block / sm.
- **Bind:**
  - fill `surface/surface`; stroke `border/default` (`destructive/border` on error); radius
    `radius/input`; padding `space/stack/gap`;
  - `icon` by status: a Spinner, a `check` in `success/text`, or an alert in `destructive/text`;
  - `name` T.mono; `io-label` T.eyebrow `text/muted`.
- **Lang:** none.
- **Nests:** Spinner, Icon, Badge, Code block.

#### I11 Citation chip

- **Sets:** `Citation chip`, `state` rest|hover|focus|active (4; the code's `.is-active`).
- **Parts:** `root` → `index`.
- **Bind:**
  - h lit 18, minimum width 18, padding-x lit 4; radius `radius/badge`;
  - fill `surface/muted`; `index` T.caption `text/muted`;
  - hover and active: `primary/subtle` with `primary/text`.
- **Lang:** none.
- **Nests:** none.

#### I12 MCP UI widget

- **Sets:** `MCP UI widget`, `state` loading|ready|error (3).
- **Parts** (from the code): `root` → `frame`. The frame is an iframe placeholder: `surface/surface`
  with a dashed `border/subtle` stroke and "mcp-ui resource" in T.small `text/muted`. Loading shows
  a Skeleton block; error shows an Inline notice (destructive).
- **Bind:** stroke `border/default`; radius `radius/card`.
- **Lang:** none.
- **Nests:** Skeleton, Inline notice.

### Desktop

#### K1 Window chrome

- **Sets:** `Window chrome`, `platform` macos|windows|linux (3) × `state` focused|blurred|disabled
  (3) = 9.
- **Parts** (from the code): `root` H-AL → `leading` · `identity` (app icon · `title`) · `actions`
  → `action` (show|hide|focus|reload|close).
- **Bind:**
  - h lit 40; fill `surface/surface`; a bottom `border/subtle` rule;
  - `title` T.strong-sm;
  - `action`: Icon button / sm ghost; close on hover is `destructive/default` with
    `destructive/fg`.
- **Lang:**
  - Cupertino: 12px traffic lights at a 20px pitch, placed in the sidebar (`cupertino/traffic-*`).
  - Liquid: an r16 window with a 0 22 48 shadow and traffic lights (`liquid/window/*`).
  - Fluent: a Mica title bar with 46-wide minimize, maximize and close caption buttons.
- **Nests:** Icon button, Icon.

#### K2 Tray menu

- **Sets:**
  - `Tray menu item`: `type` action|role|submenu|separator (4) × `state` rest|hover|disabled (3) =
    12;
  - `Tray menu`: `source` tray|application-menu (2; the code's `data-source`).
- **Props:** `accelerator` (bool).
- **Parts** (from the code): `desktop-menu` → `source` · `items` → `action-item` (`action` →
  `label` · `accelerator`), `role-item`, `submenu`, `separator`.
- **Bind:** as O8; `source` T.eyebrow; `accelerator` T.mono `text/muted`.
- **Lang:** none.
- **Nests:** Menu content, Icon.

#### K3 Desktop dialog

- **Sets:** `Desktop dialog`, `kind` alert|confirm|prompt (3) × `state` rest|disabled (2) = 6.
- **Parts** (from the code): `desktop-dialog` → `copy` (title · message, plus an Input for prompt) ·
  `actions` → `action`.
- **Bind:**
  - as O1;
  - the primary action uses `accent/default` with `accent/fg`, because the code uses `ns-accent`;
  - confirm adds an outline cancel button.
- **Lang:** none. The platform look comes from K1.
- **Nests:** Button, Input.

#### K4 Desktop notification

- **Sets:** `Desktop notification`, `state` rest|disabled (2).
- **Props:** `action` (bool).
- **Parts** (from the code): `icon` (lit 32, radius `radius/input`) · `copy` (title · body) ·
  `action`.
- **Bind:** R.float; W lit 360; padding `space/stack/gap`; title T.strong; body T.small
  `text/muted`.
- **Lang:** none.
- **Nests:** Button.

#### K5 Update prompt

- **Sets:** `Update prompt`, `state` automatic|manual (2; the code's `data-state`).
- **Parts** (from the code): `copy` (`title` · `description`) · `action`. The action is a primary
  Button "Restart to update"; manual adds an outline "Download".
- **Bind:**
  - fill `surface/card`; stroke `border/default`, or `info/border` when manual; radius
    `radius/card`; padding `space/stack/gap`;
  - `title` T.strong; `description` T.small `text/muted`.
- **Lang:** none.
- **Nests:** Button.

#### K6 Desktop only

No component set. The island renders its children only in the desktop runtime. Document it with an
annotation frame on the Desktop page.

### Docs kit

Utility comes first here. Studio-only `SF:prose/*` bindings are intended, because these components
are Studio by design.

#### X1 Prose

- **Sets:** three sets, because one set would exceed the cap:
  - `Prose heading`: `level` h1|h2|h3|h4 (4), with an `anchor` boolean for the hover `#`;
  - `Prose block`: `element` lede|p|blockquote|ul|ol|hr (6);
  - `Prose inline`: `element` link|code|kbd|strong|em (5) × `state` rest|hover (2) = 10.
- **Bind** (docs §5):
  - h1: T.title with an eyebrow above;
  - h2–h4: `font/heading` + `SF:prose/h2|h3|h4/size|line|tracking`;
  - p: `font/sans` + `SF:prose/body/*`, `text/fg`, maximum width `SF:prose/measure`;
  - lede: `SF:prose/lede/*` `text/fg`, maximum width lit 640;
  - lists: item gap lit 8; `ul` bullets are Location marker / sm; `ol` numerals are T.data
    `text/muted`;
  - blockquote: a 2px leading `+marker/default` rule, padding-left lit 16, `text/muted`;
  - inline code: `font/mono` + `SF:prose/code/size` in a separate `code` chip frame filled
    `surface/surface`, radius `radius/badge`. Figma cannot paint a background behind a text range.
  - link: `text/fg` with `type/strong/style`, plus an `underline` part in `+link/underline`; on
    hover the underline becomes `+marker/default`;
  - hr: a 1px `+topbar/rule (interim studio/topbar/rule)` with lit 48 margins;
  - tables: D4; images: a 1px `border/subtle` stroke.
- **Lang:** none. Prose is Utility-first; other themes differ by token only.
- **Nests:** Location marker, Kbd, Table, Figure, Code block.

#### X2 File path chip

- **Sets:** `File path chip`, `state` rest|hover|focus|copied (4).
- **Parts:** `root` H-AL → `path` · `copy`.
- **Bind:**
  - fill `surface/surface`; stroke `border/subtle`; radius `radius/badge`; h lit 24; padding-x lit
    8; gap lit 6;
  - `path` T.mono `text/fg`; `copy` I.sm `copy` in `text/muted` (copied: `check`).
- **Lang:** none.
- **Nests:** Icon.

#### X3 Attribute chip

- **Sets:** `Attribute chip`, `size` sm|md (2).
- **Parts:** `name` (`data-variant=`) · `value` (`"primary"`).
- **Bind:** `name` T.mono `text/muted`; `value` T.mono `text/fg`; fill `surface/surface`; stroke
  `border/subtle`; radius `radius/badge`; padding-x lit 6; h lit 22.
- **Lang:** none.
- **Nests:** none.

#### X4 Toc

- **Sets:**
  - `Toc item`: `level` 2|3 (2) × `state` rest|hover|current (3) = 6;
  - `Toc`: `breakpoint` desktop|mobile (2).
- **Parts:**
  - desktop: `eyebrow` ("On this page") · `rail` → items · `links` ("View as Markdown", "Back to
    top ↑");
  - mobile: a 48px sticky bar (eyebrow · marker · current section · `chevron-down`) that opens an
    Accordion.
- **Bind:**
  - `eyebrow` T.eyebrow; `rail` a 1px `border/subtle` line;
  - items T.small `text/muted`; current is `text/fg` with `type/strong/style` and a Location marker
    on the rail;
  - `links` T.mono `text/muted`.
- **Lang:** none.
- **Nests:** Location marker, Accordion, Icon.

#### X5 File tree

- **Sets:**
  - `File tree row`: `type` folder|file (2) × `state` rest|hover|selected (3) × `open` (2) = 12;
  - `File tree`.
- **Props:** `tag` (bool). The tag is an ownership label: `[owned]`, `[generated]` or `[guidance]`.
- **Parts:** `row` → `indent` guides · `chevron` · `icon` · `name` · `tag`.
- **Bind:**
  - h lit 28; indent lit 16; guides a 1px `border/subtle` line;
  - `name` T.mono `text/fg`; `tag` T.mono `text/muted`;
  - icon stroke `+icon/stroke`.
- **Lang:** none.
- **Nests:** Icon.

#### X6 Figure

- **Sets:** `Figure`, `width` prose|wide (2; `SF:prose/measure` or `SF:prose/wide`) × `media`
  image|diagram (2) = 4.
- **Parts:** `media` · `caption`.
- **Bind:** `media`: a `border/subtle` stroke at `border/width`, radius 0; `caption` T.small
  `text/muted` with a top padding of lit 8.
- **Lang:** none.
- **Nests:** .Slot.

#### X7 Anchor nav

- **Sets:** `Anchor nav`, `state` rest|scrolled (2).
- **Parts:** `root` → anchors (Tabs with `variant=default` and the marker).
- **Bind:** h lit 44; fill `surface/bg`; a bottom `+topbar/rule` stroke. The current anchor has the
  marker and `type/strong/style`.
- **Lang:** none.
- **Nests:** Tab, Location marker.

#### X8 Ruled grid

- **Sets:** `Ruled grid`, `columns` 2|3|4 (3) × `variant` ruled|feature (2) = 6.
- **Parts:** a grid of `variant=rule` Cards. The feature variant adds an icon, a title and a
  description to each card.
- **Bind:** rules `border/subtle`, with a structural top rule in `+topbar/rule`; gap
  `space/section/gap`.
- **Lang:** none.
- **Nests:** Card, Icon.

#### X9 Hero

- **Sets:** `Hero`, `layout` split|centered (2) × `breakpoint` (2) = 4.
- **Parts:**
  - `display`: eyebrow · title · lede · `actions` (a primary and an outline Button) · a File path
    chip ("You own every file");
  - `aside`: a Code block or a Figure.
- **Bind:**
  - title T.display; lede `SF:prose/lede/*` `text/muted`;
  - padding-y `+hero/pad (interim SF:hero/pad)`; fill `+hero/bg (interim studio/hero/bg)`.
- **Lang:** none.
- **Nests:** Button, File path chip, Code block, Figure.

---

## 3. Build order

Build one `use_figma` mutation at a time, following `plan.md`. Each step depends only on earlier
steps. At the end of every step, do a mode-switch check: put an instance on a scratch frame and
cycle Scheme Light/Dark, Theme Studio/Tonal/Brutal/Pixel, Studio flavor Utility/Cloud/Workshop and
Density Comfortable/Compact. Then look for unbound paints with the variables export filter.

| Step | Scope                                                                                                                                                                                                                                                                                      | IDs                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 0    | Interim plan for the missing variables. Decide §4.9 D1 first, add the agreed `+` variables, and otherwise record the interims on the Read me page. Then the helpers: `.Focus ring`, `.State layer`, `.Slot`.                                                                               | —                                                       |
| 1    | Foundations: Icon (P0 glyph list), Location marker, Spinner (Button nests it), Kbd (Search, Tooltip and Menu nest it).                                                                                                                                                                     | Z1, N8, B5, D7                                          |
| 2    | P0 primitives: Button, Icon button, Label, Input, Textarea, Checkbox, Radio, Switch, Badge, Avatar, Separator, Progress, Skeleton.                                                                                                                                                         | A1, A2, F1, F2, F3, F5, F6, F7, D2, D1, L7, B4, B6      |
| 3    | P0 molecules: the Menu sets (item, label, separator, content), then Select, Field, Search, Tabs, Breadcrumb, Pagination, Popover, Tooltip, Dropdown menu, Card, Alert, Toast, Empty state, and the Table sets.                                                                             | O8, F4, F8, F15, N3, N1, N2, O5, O6, D3, B1, B3, B7, D4 |
| 4    | P0 overlays and shell. Dialog and Sheet. Nav item → Nav group → Sidebar. Theme toggle (P2, built early because Top bar nests it), then Top bar. Action bar (P2, built early because Data table nests it), then Data table. Then Stats grid, Page header and App shell. **P0 checkpoint: owner review.** | O1, O3, N4, A7, N5, A6, D5, L3, L2, L1                  |
| 5    | P1 primitives: Toggle → Toggle group → Button group, Slider, Input OTP, Input group, Item, Accordion, Collapsible, Scroll area, Resizable, Aspect ratio, and the RTL specimen.                                                                                                             | A4, A5, A3, F11, F10, F9, D6, D12, D13, L9, L10, L11, L12 |
| 6    | P1 composites: Combobox, Calendar → Date picker, Alert dialog, Drawer, Hover card, Context menu, Menubar, Navigation menu, Command palette, Code block, Chart, Carousel, Prose.                                                                                                            | F12, F13, F14, O2, O4, O7, O9, N7, N6, O10, D8, D9, D14, X1 |
| 7    | P1 AI: Bubble, Marker, Attachment, then Message, Message scroller, Trace, Questionnaire.                                                                                                                                                                                                  | I2, I4, I7, I1, I3, I5, I6                              |
| 8    | P2: Inline notice, Dropzone, Stepper, Sidebar toggle, Chart block, Donut, Panel, Section divider, Detail layout, Filter form, Citation chip, Tool call card, Model selector, Prompt input, MCP UI widget, the Desktop components, and the Docs kit.                                        | B2, F16, N9, N10, D10, D11, L6, L8, L4, L5, I11, I10, I9, I8, I12, K1–K5, X2–X9 |
| 9    | Language variants, one theme at a time. Within a theme, follow steps 1–4 and then 5–8. Rename and move the existing kits first (`Brutal/*`, `Filigrane/*`, `Terminal/Key`, `Tactile` `H+2 key/*`, and `Glass/Button` → `Cupertino/Button`). Suggested theme order: Brutal, Filigrane, Fluent, Tonal, Tactile, Pixel, Terminal, then Cupertino, Liquid and Bloom, which are blocked in part by §4.3. | §1.1                                                    |

---

## 4. Gaps and decisions

### 4.1 Missing variables

The values listed are proposals; Figma owns the values (Decision 2). Every row is referenced by a
`+name` in §2.

#### A. New scale and size variables

| Variable                                                          | Collection · type · scope            | Proposed values                                                                                                   | Interim              | Needed by                                  |
| ----------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------ |
| `space/control/height-lg`                                         | Density · FLOAT · WIDTH_HEIGHT       | 44 / 40 / 36 / 48 / 52                                                                                            | lit 44               | Button, Icon button, Toggle lg, Action bar |
| `space/control/height-xs`                                         | Density · FLOAT · WIDTH_HEIGHT       | 24 / 22 / 20 / 26 / 28                                                                                            | lit 24               | Button and Icon button xs, Input group     |
| `space/control/padding-x-sm`                                      | Density · FLOAT · GAP                | 10 / 8 / 6 / 12 / 14                                                                                              | lit 10               | every `sm` control                         |
| `space/sidebar/width`                                             | Density · FLOAT · WIDTH_HEIGHT       | 240 / 224 / 208 / 272 / 256                                                                                       | lit 240              | Sidebar, App shell                         |
| `size/icon/sm` · `/md` · `/lg`                                    | Theme · FLOAT · WIDTH_HEIGHT         | 14 / 16 / 20 (Tonal 18 / 24 / 24; Fluent 16 / 20 / 24)                                                             | lit                  | Icon, every icon slot                      |
| `icon/stroke`                                                     | Theme · FLOAT · STROKE_FLOAT         | Studio → `SF:icon/stroke`; 2 elsewhere                                                                            | `SF:icon/stroke`     | Icon, File tree                            |
| `size/checkbox`                                                   | Theme · FLOAT · WIDTH_HEIGHT         | Studio 16, Tonal 18, Glass 20, Brutal 22, Fluent 20, Tactile 28, Pixel 20, Filigrane 16                          | lit 16               | Checkbox, Radio                            |
| `radius/checkbox`                                                 | Theme · FLOAT · CORNER_RADIUS        | Studio → a new SF twin (Utility 2, other flavors 4); Glass 999, Brutal 4, Fluent 4, Tactile 8, Pixel 0, Filigrane 0 | lit 2                | Checkbox                                   |
| `size/switch/width` · `/height` · `/thumb`                        | Theme · FLOAT · WIDTH_HEIGHT         | Studio 32/18/14, Tonal 52/32/24, Glass 51/31/27, Fluent 40/20/12, Brutal 52/28/22, Pixel 44/24/16, Tactile 60/34/28 | lit 32/18/14         | Switch                                     |
| `size/avatar/sm` · `/md` · `/lg`                                  | Theme · FLOAT · WIDTH_HEIGHT         | 24 / 32 / 40                                                                                                      | lit                  | Avatar                                     |
| `size/kbd`                                                        | Theme · FLOAT · WIDTH_HEIGHT         | 20                                                                                                                | lit 20               | Kbd                                        |
| `state/hover-opacity` · `state/pressed-opacity` · `state/disabled-opacity` | Theme · FLOAT · OPACITY     | 0.08 / 0.12 / 0.38                                                                                                | lit                  | R.hover, R.pressed, R.disabled             |
| `focus/ring-width` · `focus/ring-offset`                          | Theme · FLOAT · STROKE_FLOAT / GAP   | 2 / 2 (Filigrane 2 / 3; Liquid 2 / 0)                                                                             | lit 2 / 2            | R.focus (the offset drives code only, §4.4) |
| `shadow/x`                                                        | Theme · FLOAT · EFFECT_FLOAT         | Studio → `SF:shadow/x`; Brutal 4; 0 elsewhere                                                                     | `SF:shadow/x`        | R.card-shadow                              |
| `shadow/overlay/y` · `shadow/overlay/blur`                        | Theme · FLOAT · EFFECT_FLOAT         | Studio → SF (Cloud 12 / 32); Tonal 3 / 8; Fluent 8 / 16; Glass 16 / 40; 0 elsewhere                               | `shadow/y`, `shadow/blur` | R.float                               |
| `shadow/control/x` · `shadow/control/y`                           | Theme · FLOAT · EFFECT_FLOAT         | Studio → `SF:button/shadow-x`, `SF:button/shadow-y`; Brutal 4 / 4                                                                     | `SF:button/shadow-*` | Button                                     |
| `type/kpi-sm/style` · `type/kpi-sm/tracking`                      | Theme · STRING / FLOAT               | equal to `type/kpi/*`                                                                                             | `type/kpi/*`         | T.kpi-sm                                   |
| `type/code/size` · `type/code/line`                               | Theme · FLOAT                        | 13 / 20                                                                                                           | `type/small/*`       | T.mono                                     |
| `font/eyebrow`                                                    | Theme · STRING · FONT_FAMILY         | Studio → a new SF twin (Utility Fragment Mono); `font/label` elsewhere                                            | `font/mono`          | T.eyebrow                                  |
| `effect/shadow-overlay`                                           | Scheme · COLOR · EFFECT_COLOR        | per-theme overlay shadow colour                                                                                   | `effect/shadow`      | R.float                                    |
| `chart/1` … `chart/5`                                             | Scheme · COLOR · SHAPE_FILL, STROKE_COLOR | the series palette                                                                                           | `primary`, `info`, `success`, `warning`, `destructive` `/default` | Chart, sparklines |
| `switch/thumb`                                                    | Scheme · COLOR · FILL                | white / `#111113` in Glass; `primary/fg` elsewhere (Cupertino doc, pending in #2414)                              | `primary/fg`         | Switch                                     |
| `code/syntax/*`                                                   | Scheme · COLOR · TEXT_FILL           | optional syntax roles                                                                                             | monochrome           | Code block                                 |

#### B. Theme-following twins for the Studio-only colour roles

The `studio/*` Scheme roles alias Studio flavor directly. They therefore keep their Studio values
under every Theme mode. For example, `studio/signal/marker` resolves to `#202020` under Tonal,
Glass, Brutal and Pixel; this was verified with a resolver. A base component bound to one of them
cannot follow a theme.

Add generic Scheme roles that alias new Theme `…/l|d` variables. In Theme mode `Studio`, the new
variables alias the Studio flavor values; in the other modes they alias the generic equivalents
listed here. Base components bind the twin; the existing `studio/*` role is only the interim.

| New Scheme role                                                                                                                     | Interim (`studio/…`)                          | Non-Studio default                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `primary/stroke`                                                                                                                    | `primary/stroke`                              | `primary/default`                                              |
| `marker/default`                                                                                                                    | `signal/marker`                               | `primary/default`                                              |
| `link/underline`                                                                                                                    | `signal/underline`                            | `primary/text`                                                 |
| `brand/default` · `brand/fg`                                                                                                        | `signal/brand` · `primary/fg`                 | `primary/default` · `primary/fg`                               |
| `card/border` · `card/footer`                                                                                                       | `card/border` · `card/footer`                 | `border/default` · `surface/muted`                             |
| `table/head` · `table/head-rule` · `table/row-rule` · `table/cell-rule` · `table/hover` · `table/zebra` · `table/row-bg`            | `table/*`                                     | `surface/muted` · `border/default` · `border/subtle` · `border/subtle` · `surface/hover` · `surface/surface` · `surface/card` |
| `tabs/track` · `tabs/sel-bg` · `tabs/sel-border` · `tabs/idle-border`                                                               | `tabs/*`                                      | `surface/muted` · `surface/card` · `border/default` · transparent |
| `nav/active`                                                                                                                        | `nav/active`                                  | `surface/selected`                                             |
| `topbar/bg` · `topbar/rule`                                                                                                         | `topbar/*`                                    | `surface/bg` · `border/subtle`                                 |
| `kpi/bg-1…4` · `kpi/border`                                                                                                         | `kpi/*`                                       | `surface/card` · `border/default`                              |
| `scrollbar/thumb`                                                                                                                   | `code/scroll-thumb`                           | `border/strong`                                                |
| `hero/bg`                                                                                                                           | `hero/bg`                                     | `surface/bg`                                                   |
| `effect/control-shadow`                                                                                                             | `button/shadow`                               | `effect/shadow`                                                |

`studio/badge-solid/*` needs no twin, because the generic `<tone>/default` + `<tone>/fg` and
`surface/inverse` + `text/inverse` cover it.

#### C. Theme twins for the Studio flavor structure variables

These are FLOAT and BOOLEAN variables that exist only in Studio flavor. Add each one to Theme,
aliasing `Studio flavor/…` in Theme mode `Studio`, with literals in the other modes.

| Group     | Variables                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tabs      | `tabs/gap`, `tabs/pad`, `tabs/radius`, `tabs/item-pad`, `tabs/item-radius`, `tabs/sel-box`, `tabs/sel-bottom`, `tabs/idle-stroke`                      |
| table     | `table/head-rule-width`, `table/row-rule-width`, `table/cell-rule-width`, `table/inset`, `table/row-gap`, `table/row-radius` (renamed from the SF weights to avoid clashing with the colour roles) |
| top bar   | `topbar/radius`, `topbar/rule-width`, `topbar/shadow-y`, `topbar/shadow-blur`, `frame/inset`                                                           |
| nav       | `nav/pad`, `nav/radius`                                                                                                                                |
| card      | `card/border-top`, `card/border-side`, `card/border-bottom`                                                                                            |
| KPI       | `kpi/border-top`, `kpi/border-right`, `kpi/border-bottom`, `kpi/border-left`, `kpi/first-left`, `kpi/gap`, `kpi/pad-x`                                  |
| misc      | `radius/avatar`, `hero/pad`                                                                                                                            |
| decoration (BOOLEAN) | `deco/marker` (**new**; Utility `true`; drives the 6px marker in Tabs, Nav item and Navigation menu), `deco/sparkline`, `deco/ticks`, `deco/blockbars` |

Until C lands, every non-Studio Theme mode renders Tabs, Table, Top bar, Nav item, Card borders and
Stat cards with **Utility geometry**. This is the largest token gap in the library.

#### D. Fixes to existing variables (no new names)

- **Hidden scopes.** `state/disabled-container` and `state/disabled-fg` have empty scopes, so they
  are hidden from every picker. Give them FRAME_FILL, SHAPE_FILL and TEXT_FILL.
- **`border/input` in Utility.** It resolves to gray 10 (`#838383` / `#7b7b7b`), but Utility's
  field boundary is gray 9 (`#8d8d8d` / `#6e6e6e`, `studio/input/border`). Scheme `border/input`
  aliases `Theme/gray/l|d/10` directly. Route it through new Theme `input/l|d` variables that alias
  `SF:input/{l,d}/border` in Studio mode, and retire `studio/input/border`.
- **Brutal stroke width.** Theme Brutal has `border/width` = 1, but Brutal draws 2px strokes
  everywhere. Set it to 2.
- **Pixel stroke width.** Pixel needs 2px on interactive edges and 1px on panel frames. Add
  `border/width-control`, or leave it to the Pixel language variants.
- **Filigrane radii.** Theme Filigrane still has `radius/control` 999, `radius/input` 10,
  `radius/card` 16 and `radius/badge` 999. Its DESIGN.md says 0 everywhere and calls these
  "unused". Setting them to 0 removes radius overrides from every Filigrane instance.
- **Tonal radii.** Tonal draws its KPIs at 28 and its hero at 32, but `radius/card` is 16. That is
  a value choice; the specimen is the authority.

### 4.2 `SF:` bindings

`SF:` bindings are deliberate interims. They are correct for the seven Studio flavors and inert for
the other nine Theme modes. Every `SF:` binding in §2 maps to a C or B twin, except these three:

- `SF:prose/*` in the Docs kit is intentionally Studio-only.
- `SF:deco/*` waits for its C twin.
- `SF:icon/stroke` waits for its A twin.

### 4.3 Theme collection mode limit: four themes share another theme's mode

The Theme collection is at Figma's 10-mode limit (verified with an `addMode` probe on 2026-10-27).
Four themes therefore render through another theme's mode:

| Theme     | Renders through               | Effect on the base library                                                                       |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Bloom     | Tonal (borrowed)              | Bloom's colours are only reachable as `bloom/*` roles.                                            |
| Cupertino | Glass (shared with Liquid)    | Cupertino's colours are only reachable as `cupertino/*` roles.                                    |
| Liquid    | Glass (shared with Cupertino) | Liquid's colours are only reachable as `liquid/*` roles.                                          |
| Terminal  | Signal (shared with the Studio Signal flavor) | Signal's radii (6/6/8/4) leak into Terminal, which wants square controls.         |

For these four themes, mode switching cannot produce the theme, even for components marked
token-only in §1.1. A component then needs either its own mode or a role-overriding variant.

Options (owner decision D2):

1. Free the `Ledger` and `Signal` Theme modes if they are now duplicated by the Studio flavors of
   the same name. This needs a usage check. Terminal already depends on `Signal`.
2. Add a second collection, `Theme · Platform`, for Cupertino, Liquid, Bloom and Terminal. Generic
   roles alias across collections by mode, as the export already does.
3. Accept prototype-only status and build role-override variants: an extra set per component for
   these themes.

Option 2 keeps §1.1 at anatomy-only.

### 4.4 Figma limits that force variants or literals

- **Text case** cannot bind to a variable. T.eyebrow (uppercase) is fixed in the base. Brutal and
  Pixel uppercase labels (Badge, Button) therefore need variants; this is part of their ● in §1.1.
- **Dash patterns** cannot bind: Brutal's dashed dividers (L7), the Dropzone border.
- **Effects:**
  - The *number* of effects cannot vary by mode. Tactile's dual convex and concave shadows, Liquid's
    stacked glass shadows and Fluent's two inset edges are structurally different, which is why
    they are variants.
  - Each effect's colour, offset and blur can be bound.
  - GLASS parameters (refraction, depth, dispersion) cannot be bound.
- **Position-dependent corners.** Tonal's first and last rows, and connected-button inner corners,
  differ by position. A `position` first|middle|last property inside the Tonal variant handles
  them.
- **Clip paths.** Bloom's notch is vector geometry and stays a literal (DESIGN.md: "owned
  anatomy, not tokens").
- **Focus-ring offset** cannot drive geometry; it is a literal 2 in Figma, so `focus/ring-offset`
  is code-only. Filigrane's 3px gap and Liquid's 0 gap are drawn in their Input variants (§1.1).
- **Inline code backgrounds.** A background on a text range cannot be drawn, so inline code is a
  separate chip frame (docs §5).
- **Underlines.** The link underline is a 1px rectangle part, so its colour can bind to
  `+link/underline`.

### 4.5 Naming conflicts: code vs shadcn

Figma follows the code (S3 data attributes). shadcn names appear only as values where the code has
no equivalent.

| Component     | Code (`origin/main`)                                                 | shadcn                                                                           | Figma decision                                                                                                      |
| ------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Button        | `primary` · `secondary` · `outline` · `ghost` · `destructive`; `sm` · `md` · `lg` · `icon`; `iconPosition` left/right | `default` · `secondary` · `outline` · `ghost` · `destructive` · `link`; `xs` · `sm` · `default` · `lg` · `icon` · `icon-xs` · `icon-sm` · `icon-lg`; `data-icon` inline-start/end | Variant `primary`, not `default`. Add `link` and the `xs` size. Icon-only lives in the Icon button sets. Use `iconStart` / `iconEnd` (logical, RTL-safe). |
| Badge         | `variant` = tone: primary, secondary, success, warning, destructive, muted | default, secondary, destructive, outline, ghost, link                      | `variant` = the code tones plus `info`. shadcn `outline` becomes `emphasis=outline`. Add `emphasis` subtle/strong/outline/dot. shadcn `ghost` and `link` badges are not built. |
| Alert         | info, success, warning, destructive                                  | default, destructive                                                             | Add `neutral` (= shadcn default) and `emphasis` (G-16).                                                             |
| Error tone    | Alert and Badge `destructive`; Toast `error` (`ns-toast--error`)      | Toast `error`                                                                    | Toast keeps `type=error` to mirror the code. Recommend renaming it to `destructive` in S3.                          |
| Avatar        | sizes sm, md, lg; `presence`; `agent`                                | sizes sm, default, lg; AvatarBadge; AvatarGroup                                  | `md`, not `default`. Keep `presence` and `agent`. Add `badge` and the Avatar group.                                 |
| Select        | `Select` is a native `<select>`                                      | Select = custom listbox; Native Select = native                                  | One `Select` trigger set plus a `Select content` listbox. The open state is a design reference until a custom listbox ships. |
| Field         | `FormField` (`ns-field`)                                             | Field, FieldSet, FieldLegend, FieldGroup…                                        | `Field` and `Field set`. Code rename: S3.                                                                           |
| Empty         | `EmptyState`                                                         | Empty                                                                            | `Empty state` (code name).                                                                                          |
| Menu          | `ActionMenu`; item `data-intent` default/destructive                 | DropdownMenu; item `variant` default/destructive                                 | Set name `Dropdown menu`; property `intent` (code).                                                                 |
| Toggle        | none                                                                 | `data-state` on/off                                                              | `selected` false/true (`state=pressed` is reserved for `:active`).                                                  |
| Tabs          | `data-state` from `getTabsDataState`; no variant                     | TabsList `variant` default/line                                                  | `selected` plus `variant` default/line.                                                                             |
| Panel         | `tone` default/muted/raised                                          | —                                                                                | `tone` (code). Chart and Donut also use `tone`, for semantic colour; the clash is noted for S3.                     |
| Sheet         | `side` right/bottom only                                             | top, right, bottom, left                                                         | Four sides in Figma. The docs need `side=left` for the mobile drawer (docs §6), so the code lacks `left` and `top`. |
| Floating      | `data-placement`                                                     | `side`                                                                           | `placement` (code).                                                                                                 |
| Message       | `role` user/assistant/system                                         | `align` start/end                                                                | `role` (code); the alignment follows from the role.                                                                 |
| Trace vs tool | ToolCallCard `status` running/done/error                             | TraceLine `status` running/error/pending (unset = done)                          | Trace line: done/running/pending/error. Tool call card: the code's three.                                           |
| Code block    | filename, lang and copy only                                         | `variant` default/destructive, `size`, line variants, line numbers                | Superset (G-12 adds tabs).                                                                                          |

### 4.6 Code vs Figma conflicts (for S1, S3 and S6)

- **BEM vs data attributes.** Every registry component still expresses variants and states with BEM
  modifiers (`ns-btn--primary`, `ns-input--error`, `ns-choice--disabled`, `.is-active`). Figma
  property names assume the S3 `data-variant` / `data-size` / `data-state` migration (G-11).
- **Token vocabulary.** Component CSS consumes scale tokens (`--ns-text-sm`, `--ns-radius-md`,
  `--ns-space-4`, `--ns-red-6`, `--ns-gray-12`). The Figma variables carry semantic code syntax
  (`--ns-text-body`, `--ns-radius-control`, `--ns-control-padding-x`). The bindings round-trip only
  after S6 moves the CSS to the semantic names. Two cases bind primitives, which this spec forbids:
  - `button.css` uses `--ns-red-6` for destructive hover;
  - `switch.css` uses `--ns-gray-1` and `--ns-gray-12`.
- **Focus style.**
  - Code inputs: `border-color: ring` plus a 15% tinted halo.
  - Code checkbox: `outline: 2px`.
  - Studio DESIGN.md: a 2px ring at a 2px offset everywhere. Figma follows DESIGN.md (R.focus).
- **Button depth.** `button.css` draws hard offset shadows on every variant (`3px 3px 0`,
  collapsing on hover and active). This is the old NS One look. Studio Utility has no shadow;
  Workshop's offset is now flavor-driven through `button/shadow-x|y`.
- **Copper.** `theme-seed` still sets `--ns-primary: copper-6` and `--ns-ring: copper-6`. The owner
  ruled out copper; the default is Utility/Neutral/Ink.
- **Outline button stroke.** Code uses `border-hover` (gray 7). Studio uses the soft `border`
  (gray 6). Tonal and Filigrane outlined buttons use `input-border`. Figma binds `border/default`.
  If Tonal and Filigrane must match, add `border/outline` to §4.1.
- **Parts the code lacks.** `link` button, Button `xs`, Sheet `left` and `top`, Card `rule`
  (G-15), Alert `emphasis` (G-16), Kbd as a component (G-1), Code block tabs and line numbers
  (G-12), Select listbox, Avatar badge and group, Badge `info`.
- **Existing styles without a component.** `.ns-kbd` (`search.css`, `layouts.css`),
  `.ns-thread` / `.ns-session` (chat shell), `.ns-status-indicator` (page header). Figma builds
  them as components; code can wrap them later.

### 4.7 Theme-only components (outside the base library)

Build these on the theme pages only, with no base set:

| Theme    | Components                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Tonal    | FAB (64px, r20); the floating toolbar, as an Action bar composition           |
| Bloom    | the notch primitive (two measured variants); the action/outline disc set      |
| Terminal | Help bar (key hints); Log pane; Pane title-on-border helper                   |
| Pixel    | Band stripe (10px); identicon generator                                      |
| Tactile  | Range dial; Refund gauge (24 LED segments); LED (`tactile/led/*`, glow)       |
| Brutal   | Logo tile with Slab S                                                        |

### 4.8 Coverage limits of this spec

- shadcn variant details come from my memory, except for the pages listed under *Inputs*. Check
  these before building their P1 sets: Calendar captionLayout, Sidebar variant/collapsible, Toggle
  Group spacing, Alert Dialog size/media, Card size, Switch size, and Select trigger size.
- The DESIGN.md files do not draw overlays, menus, toast, AI or desktop components for any theme
  (#2416 is pending). §1.1 therefore has no ● for them, but language variants may follow.
- Studio flavors are modes, not language variants. Three need anatomy no variable carries:
  - Utility's tab and nav marker → `deco/marker`;
  - Playful's separate pill rows, which `table/row-gap`, `table/row-radius` and `table/inset`
    already cover;
  - Ledger's joined KPI strip (`kpi/gap` 0 + `first-left`, already covered).

  No flavor needs a language variant.

### 4.9 Decisions for the owner

| ID | Decision                                                                                                         | Recommendation                                                                                  |
| -- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| D1 | Add the §4.1 B and C twins before Phase B, or build on the `studio/*` and `SF:` interims and rebind later?        | Add them first, at least the P0 ones: table, tabs, nav, topbar, card, marker, `primary/stroke`. Rebinding 100+ sets afterwards costs more than the variables do. |
| D2 | The mode limit (§4.3).                                                                                           | Option 2: a second Theme collection.                                                            |
| D3 | Split Button by size, giving 4 sets of 30?                                                                       | Yes. Variant is switched far more often than size, so it stays a variant property.             |
| D4 | Language variants as separate sets (`<Theme>/<Component>`) on the theme pages, rather than a `language` variant property. | Separate sets. A property would multiply every set past the cap.                       |
| D5 | Should `T.eyebrow` use a mono family (Utility) or `font/label`?                                                  | Add `font/eyebrow`.                                                                             |
| D6 | Toast `error` vs `destructive`; Panel `tone` vs Chart `tone`.                                                    | Rename in S3: Toast → `destructive`; Panel `tone` → `variant`.                                  |
