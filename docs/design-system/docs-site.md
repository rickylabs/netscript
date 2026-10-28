# Docs revamp in NetScript Utility: implementation handoff

<!-- Theme rules: themes/studio/DESIGN.md (Utility) and GUIDELINES.md. Component gaps feed S3 #2416. -->

This handoff maps the docs site at `docs/site/` (Lume) onto **Studio · Utility on Neutral · Ink**,
the NetScript default theme. It covers every `_components/*.vto` component, the prose elements and
the page chrome. For each one it gives the Fresh UI component and variant to use and the `--ns-*` or
`--ns-studio-*` tokens it reads. Component gaps are listed at the end.

- **Figma:** file `pGRLnkPPRZJZy74evNcQBr`, page **Docs — NetScript Utility** (`174:2144`).
- **Light frames** are at x=0, **Dark** at x=1600, and **Mobile** at x=3300.
- **Root attributes:**
  `data-theme="studio" data-flavor="utility" data-gray="neutral" data-accent="ink"`. `data-scheme`
  is either `light` or `dark`.
- **Reference images:**
  `reference/docs-site/{home,article,reference,design-system,search}--{light,dark}.webp`,
  `reference/docs-site/article--mobile.webp`, and the Utility dashboard specimen
  `reference/docs-site/utility-dashboard--{light,dark}.webp` (exported from Figma, round 6/7). They
  show the target; Figma stays the source of truth for values.

| Screen                            | Light      | Dark       |
| --------------------------------- | ---------- | ---------- |
| Home (`index.vto`)                | `176:403`  | `182:885`  |
| Article (`web-layer/fresh-ui.md`) | `174:2145` | `182:1343` |
| Reference (`cli-reference.md`)    | `178:687`  | `182:1756` |
| Design system landing (new group) | `179:698`  | `182:2034` |
| Search overlay (Pagefind)         | `181:510`  | `182:2382` |
| Article, mobile 390 (light)       | `182:742`  | —          |

The signature kit components live on page **Theme direction**, in frame `167:4232`:

- Location marker `167:4236`
- Eyebrow `167:4239`
- Kbd `167:4243`
- File-path chip `167:4247`
- Attribute chip `167:4252`
- Link, Rest/Hover, `167:4261`
- Docs icons (Lucide, ISC) `173:4261…173:4314`

## 1. Identity rules (owner-final)

- **Red appears only in the logo** (the red square "N", `--ns-studio-signal-brand`) **and in
  error/destructive states** (`--ns-destructive*`). There are no red markers, links, hairlines or
  focus rings.
- **Location is ink:** a 6×6 ink square (`--ns-studio-signal-marker`) sits before the active top-nav
  lane, the active tab, the current sidebar entry, the current TOC entry and the active search
  filter. Vertical lists reserve a 6px marker slot plus a 8px gap, so labels never shift.
- **Selection is ink:** a near-white fill (`--ns-selected`) with a 2px ink bar on the left
  (`--ns-studio-signal-marker`). This covers the selected table row and the selected search result.
- **Focus** is a 2px ring (`--ns-ring`, which is ink in light and gray-d10 in dark) with a 2px gap
  (`--ns-card`). Corners are sharp: `outline: 2px solid var(--ns-ring); outline-offset: 2px`.
- **Links** are ink, Medium weight, with a 1px underline at a 4px offset in
  `--ns-studio-signal-underline` (gray 8). On hover, the underline becomes
  `--ns-studio-signal-marker` (ink). The colour never changes.
- **Geometry is sharp:**
  - controls, inputs and cards have 0 radius;
  - badges, kbd and chips use `--ns-radius-badge` (2px).
  - There are no shadows; Utility stays flat.
- **Separations are quiet:**
  - structural hairlines are 1px `studio/topbar/rule` (`--ns-studio-topbar-rule`) /
    `studio/table/head-rule` (gray 5, about 12% ink);
  - row and in-block hairlines are `--ns-border-subtle` or `studio/table/row-rule` (gray 3–4);
  - there are no black rules except state indicators.
- **Mono voice:** Fragment Mono (`--ns-font-mono`) is used for:
  - eyebrows;
  - breadcrumbs;
  - IDs, paths, commands, signatures and code;
  - kbd;
  - file-path and `data-*` chips.

### Logo red vs error red (documented pair)

| Role                                                   | Light                                 | Dark      | Use                                                   | Measured                                 |
| ------------------------------------------------------ | ------------------------------------- | --------- | ----------------------------------------------------- | ---------------------------------------- |
| `--ns-studio-signal-brand` (`color/swiss-red/{l,d}/9`) | `#DA291C` (hue 4°, Swiss signal red)  | `#E5332A` | Logo square only                                      | 4.87:1 on `#FFFFFF`; 4.09:1 on `#18181A` |
| `--ns-destructive` (solid / invalid boundary)          | `#E5484D` (hue 358°, lighter, pinker) | `#E5484D` | Invalid field boundary, destructive solid             | 3.91:1 / 4.53:1                          |
| `--ns-destructive-text`                                | `#641723` (deep crimson)              | `#FF9592` | Error message text, always with an icon and a message | —                                        |

They differ in form as well as hue:

- The brand red only ever appears as a filled 24px square carrying the N.
- Error red only appears as text, a field boundary or a dot, and always next to an icon and a
  message.

## 2. Layout grid

| Region                                          | Desktop 1440                                                                                                                                           | Mobile 390                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Top bar                                         | 56px high, 24px side padding, 1px bottom `studio/topbar/rule`                                                                                          | 56px: drawer button (44×44) · logo · search · theme    |
| Lane nav (top bar)                              | Start · Learn · Build · Reference · Concepts · Design system (from `navLanes` plus the new group)                                                      | Moves into the drawer                                  |
| Sidebar                                         | 272px, 32px top / 16px side padding, 1px right `studio/topbar/rule`; shows only the active lane's tree                                                 | Drawer (`Sheet`, left)                                 |
| Content start                                   | x = 352 (sidebar + 80)                                                                                                                                 | 20px gutters, 350px column                             |
| Prose measure                                   | **544px ≈ 72 characters** at Host Grotesk 16/26 (measured at 7.49px per character; CSS `max-width: 34rem` ≈ 58 CSS `ch`) → `--ns-studio-prose-measure` | 350px                                                  |
| Wide column (code, tables, callouts, file tree) | 720px → `--ns-studio-prose-wide`                                                                                                                       | 350px; code scrolls horizontally                       |
| TOC rail                                        | 240px at x=1176, 112px top offset, sticky                                                                                                              | Collapsed "On this page" bar under the top bar, sticky |
| Reference / landing width                       | 960 (reference, no TOC) / 1032 (design-system landing)                                                                                                 | —                                                      |
| Vertical rhythm                                 | H2 gets 56px above and 14px below; paragraphs 16px; blocks 24–32px                                                                                     | Same, scaled about ×0.7                                |

## 3. Type roles

| Docs role                         | Font          | Size / line / tracking                 | Weight                       | Tokens                                                                                                                    |
| --------------------------------- | ------------- | -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Hero display                      | Host Grotesk  | 64 / 68 / −1.6 (−2.5%)                 | Medium                       | `--ns-font-heading`, `--ns-text-display`, `--ns-leading-display`, `--ns-tracking-display`, `--ns-weight-display`          |
| H1 (page title)                   | Host Grotesk  | 48 / 52 / −1.2 (−2.5%)                 | Medium                       | `--ns-text-title`, `--ns-leading-title`, `--ns-tracking-title`, `--ns-weight-title`                                       |
| H1 (mobile)                       | Host Grotesk  | 36 / 40                                | Medium                       | `--ns-studio-prose-h1-sm-size`, `--ns-studio-prose-h1-sm-line` (**new**)                                                  |
| H2                                | Host Grotesk  | 26 / 34 / −0.4                         | Medium                       | `--ns-studio-prose-h2-size`, `--ns-studio-prose-h2-line`, `--ns-studio-prose-h2-tracking` (**new**), `--ns-weight-strong` |
| H3                                | Host Grotesk  | 19 / 28 / −0.2                         | Medium                       | `--ns-studio-prose-h3-*` (**new**)                                                                                        |
| H4                                | Host Grotesk  | 16 / 24                                | Medium                       | `--ns-studio-prose-h4-*` (**new**)                                                                                        |
| Lede                              | Host Grotesk  | 19 / 30                                | Regular                      | `--ns-studio-prose-lede-size`, `--ns-studio-prose-lede-line` (**new**)                                                    |
| Body (prose)                      | Host Grotesk  | 16 / 26                                | Regular                      | `--ns-studio-prose-body-size`, `--ns-studio-prose-body-line` (**new**)                                                    |
| UI text (callouts, tables, cards) | Host Grotesk  | 14 / 22                                | Regular / Medium             | `--ns-text-body`, `--ns-leading-body` (Utility body line is now 22)                                                       |
| Small (nav, captions, cards)      | Host Grotesk  | 13 / 18                                | Regular / Medium             | `--ns-text-small`, `--ns-leading-small`                                                                                   |
| Code block, file tree, signatures | Fragment Mono | 13 / 22                                | Regular (comments in Italic) | `--ns-font-mono`, `--ns-studio-prose-code-size`, `--ns-studio-prose-code-line` (**new**)                                  |
| Inline code / chips / breadcrumb  | Fragment Mono | 14 inline in 16px prose, 12 / 16 in UI | Regular                      | `--ns-text-body` / `--ns-text-caption`, `--ns-weight-caption`                                                             |
| Eyebrow                           | Fragment Mono | 11 / 16 / +0.6, uppercase              | Regular                      | `--ns-text-label`, `--ns-leading-label`, `--ns-tracking-label`, colour `--ns-muted-fg`                                    |

Use `font-variant-numeric: tabular-nums` on Host Grotesk numerals: KPIs, table numbers, versions and
step counters. Mono content is tabular already.

## 4. Docs components → Fresh UI

All colours below are Scheme roles. Every `studio/*` Scheme role now carries the code syntax
`var(--ns-studio-<path>)` (round 7), e.g. `studio/topbar/rule` → `--ns-studio-topbar-rule`.

| `_components/*.vto`                       | Fresh UI component / variant                                                                                                                                | Anatomy in the design                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Tokens                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hero`                                    | `PageHeader` (hero composition) **+ gap: Hero**                                                                                                             | Mono eyebrow "Deno meta-framework · v0.0.8"; display tagline (680px); lede subhead in `--ns-muted-fg` (620px); CTAs `Button variant=primary` + `Button variant=outline`. Right column: install `CodeBlock` (bash header, copy) and a stack of file-path chips under the eyebrow "You own every file"                                                                                                                                                                             | display roles, `--ns-muted-fg`, `studio/primary/bg` (`--ns-studio-primary-bg`), `--ns-border` (outline)                                    |
| `featureGrid`                             | `Card` ×3 in a grid **(layout gap: FeatureGrid)**                                                                                                           | Pillars: no box. Each has a 1px top `studio/topbar/rule`, 20px padding-top, a mono eyebrow, an H3 title, UI body muted, and a `Link`. Cards in other contexts use the same anatomy                                                                                                                                                                                                                                                                                               | `--ns-fg`, `--ns-muted-fg`, `studio/topbar/rule`                                                                                           |
| `card`                                    | `Card` with `data-variant="rule"` (**new Utility variant**: top hairline only, no box, no shadow)                                                           | As above. `href` cards show `arrow-up-right` on hover                                                                                                                                                                                                                                                                                                                                                                                                                            | `--ns-border-subtle`, `--ns-surface` (hover fill)                                                                                          |
| `cardsGrid`                               | `Card` grid **(layout gap: RuledGrid)**                                                                                                                     | 4×2 ruled grid: outer top hairline, 1px internal column and row rules, no outer box. A glyph tag (mono, 32×24, 1px `--ns-border`), H4 title, small muted body, and `arrow-up-right` (`--ns-border` at rest, `--ns-fg` on hover). Hover fills `--ns-surface`                                                                                                                                                                                                                      | `--ns-border-subtle`, `studio/topbar/rule`, `--ns-surface`                                                                                 |
| `tabbedCode`                              | `Tabs` (interactive) + `CodeBlock`                                                                                                                          | 1px `--ns-border-subtle` frame. **Tab bar** (40px, `--ns-bg`): the active tab has an ink marker and Medium label; idle tabs are muted; language eyebrow and Copy on the right. **File-path header** (36px, `--ns-bg`): file icon, path in mono fg, `Copy` (1px `--ns-border`). **Body** (`--ns-surface`): line numbers muted, right-aligned; code in fg; strings and comments `--ns-muted-fg`; comments italic. Long lines scroll horizontally with a 3px thumb in `--ns-border` | `--ns-bg`, `--ns-surface`, `--ns-border-subtle`, `--ns-border`, `--ns-fg`, `--ns-muted-fg`, `--ns-studio-signal-marker`                    |
| `tabbedRuntime`                           | `Tabs` + `CodeBlock`, with `data-ns-runtime-group` persistence (`localStorage ns-runtime`)                                                                  | Same anatomy. Tabs are mono database names (`postgres` · `mysql` · `mssql` · `sqlite`). A right-hand hint reads "data-ns-runtime · remembered". The chosen value is underlined inside the code with `--ns-studio-signal-underline`                                                                                                                                                                                                                                               | Same as `tabbedCode`                                                                                                                       |
| `comparisonTabs`                          | `Tabs` + native `<select>` (`Select`) + `CodeBlock`                                                                                                         | Same tab anatomy. The picker is a `Select` with a 1px `--ns-studio-input-border`. The summary line is UI body                                                                                                                                                                                                                                                                                                                                                                    | Same, plus `--ns-studio-input-border`                                                                                                      |
| `callout` (note, tip, important, warning) | `Alert` (`InlineNotice` for compact use). **Mapping:** note→`info`, tip→`success`, important→`info` + `data-emphasis="strong"` (**new**), warning→`warning` | Panel with padding 16/20 and no radius. Head row: 16px icon (info, check, info, triangle-alert) · mono eyebrow (NOTE/TIP/IMPORTANT/WARNING) · Medium title. Body is indented 26px. **note/tip/important** are monochrome: fill `--ns-surface`; important adds a 2px ink left rule (`--ns-studio-signal-marker`). **warning** uses fill `--ns-warning-subtle`, a 1px `--ns-warning-border`, and text and icon in `--ns-warning-text`. Callouts never use red                      | `--ns-surface`, `--ns-fg`, `--ns-muted-fg`, `--ns-warning-subtle`, `--ns-warning-border`, `--ns-warning-text`, `--ns-studio-signal-marker` |
| `apiTable` (object rows)                  | `ResponsiveTable` / `DataTable`                                                                                                                             | Mono caption eyebrow. **Two columns:** Name (mono fg) stacked over Type (mono muted) in a 232px column, then Description (UI 14/22). Head rule 1px `studio/table/head-rule`; row rules `studio/table/row-rule` (gray 3); 14/15px row padding. On mobile, rows stack (name and type on one line, description below)                                                                                                                                                               | `studio/table/head-rule` (`--ns-studio-table-head-rule`), `studio/table/row-rule` (`--ns-studio-table-row-rule`), `--ns-font-mono`         |
| `apiTable` (generic `columns`)            | `ResponsiveTable`                                                                                                                                           | Reference mutation map: 5 columns. The command column is mono (multi-line for verb families). The Preview column is mono: fg for flags, muted for "No"                                                                                                                                                                                                                                                                                                                           | Same                                                                                                                                       |
| `fileTree`                                | **Gap: FileTree**                                                                                                                                           | 1px `--ns-border-subtle` box with `--ns-bg` fill; 26px rows; 20–22px indent per depth. Lucide `folder` / `file` at 14px. Name in mono 13; comment `# …` in mono 12 muted. The ownership variant appends a right-aligned mono tag (`[owned]` in fg; `[generated]` and `[guidance]` in muted). Generated paths are muted                                                                                                                                                           | `--ns-border-subtle`, `--ns-fg`, `--ns-muted-fg`, `--ns-studio-icon-stroke`                                                                |
| `learningPath`                            | **Gap: Stepper / LearningPath**                                                                                                                             | Horizontal ordered list; each step has a 1px top `studio/topbar/rule`, a mono index `01`, and a Medium label. It is a real sequence, so numbers are allowed. On the current tutorial page, the current step uses the ink marker                                                                                                                                                                                                                                                  | `studio/topbar/rule`, `--ns-muted-fg`, `--ns-fg`                                                                                           |
| `nextPrev`                                | `Pagination` (prev/next form) **or gap: Pager**                                                                                                             | Two equal cells with a 1px `--ns-border-subtle` box and 16/20 padding. The mono eyebrow "← Previous" / "Next →" uses Lucide arrows; the label is H4. Next is right-aligned. On mobile the cells stack                                                                                                                                                                                                                                                                            | `--ns-border-subtle`, `--ns-muted-fg`, `--ns-fg`                                                                                           |
| `breadcrumb`                              | `Breadcrumb`                                                                                                                                                | Mono 12/16 with `/` separators. Ancestors are muted; current (`aria-current`) is fg. "View as Markdown" is a page-action chip on the right (file-text icon, mono, 1px `--ns-border-subtle`)                                                                                                                                                                                                                                                                                      | `--ns-font-mono`, `--ns-muted-fg`, `--ns-fg`                                                                                               |
| `badge` (stable, alpha, partial)          | `Badge` — stable→`success`, alpha→`warning`, partial→`muted`                                                                                                | Studio badge (2px radius, dot + label). In the top bar the version is a mono chip (`v0.0.8`, 1px `--ns-border-subtle`) rather than a badge                                                                                                                                                                                                                                                                                                                                       | `--ns-success-text`, `--ns-warning-text`, `--ns-muted-fg`, `--ns-radius-badge`                                                             |
| `diagram`                                 | **Gap: Figure** (`<figure>` + caption)                                                                                                                      | Not drawn in this round. Spec: `--ns-bg` viewport with a 1px `--ns-border-subtle` box at the wide column; caption 13/18 muted under it. The SVG must use `currentColor` and the two inks so it themes in dark                                                                                                                                                                                                                                                                    | `--ns-border-subtle`, `--ns-muted-fg`                                                                                                      |
| `xref`                                    | `Link` (prose link)                                                                                                                                         | Same as prose links                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `--ns-studio-signal-underline` → `--ns-studio-signal-marker`                                                                               |

## 5. Prose elements

| Element                            | Treatment                                                                                                                                                                            | Tokens                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `h1`                               | Title role. A mono eyebrow above it shows the lane · pillar (e.g. "Build · Web layer")                                                                                               | title roles, `--ns-muted-fg`                            |
| `h2`, `h3`, `h4`                   | Prose heading roles (§3). H2 gets 56px above. Anchor `#` appears on hover only (Lucide `hash`, muted)                                                                                | `--ns-studio-prose-h*`                                  |
| Paragraph                          | 16/26, max 544px                                                                                                                                                                     | `--ns-studio-prose-body-*`, `--ns-studio-prose-measure` |
| Lede (first paragraph, `.ns-lede`) | 19/30 fg, max 640px                                                                                                                                                                  | `--ns-studio-prose-lede-*`                              |
| Links                              | Ink Medium; 1px underline, 4px offset, `--ns-studio-signal-underline`; hover → `--ns-studio-signal-marker`; focus → ring                                                             | as stated                                               |
| Lists                              | 16/26, 8px item gap. Bullets are a 4px ink square for `ul` (Swiss, echoing the marker) and mono numerals in muted for `ol`                                                           | `--ns-fg`, `--ns-muted-fg`                              |
| Inline `code`                      | Fragment Mono 14px in 16px prose, fg, `--ns-surface` background, `0 .25em` padding, 2px radius (Figma shows the mono run only, because a background on a text range cannot be drawn) | `--ns-font-mono`, `--ns-surface`, `--ns-radius-badge`   |
| `kbd`                              | Kit **Kbd**: mono 11/16 muted, 1px `--ns-border`, `--ns-card` fill, 2px radius, 20px high, 5px side padding                                                                          | `--ns-border`, `--ns-card`, `--ns-muted-fg`             |
| `blockquote`                       | 2px ink left rule (the same as the important callout), 16px left padding, body in `--ns-muted-fg`, no italics                                                                        | `--ns-studio-signal-marker`, `--ns-muted-fg`            |
| Markdown tables                    | Same as `apiTable` generic (mono head eyebrow, gray 5 head rule, gray 3 row rules)                                                                                                   | `studio/table/*`                                        |
| Images                             | Wide column, 1px `--ns-border-subtle`, no radius, caption as Figure                                                                                                                  | `--ns-border-subtle`                                    |
| Diagrams                           | See `diagram`                                                                                                                                                                        | —                                                       |
| `hr`                               | 1px `studio/topbar/rule`, 48px vertical margin                                                                                                                                       | —                                                       |

## 6. Chrome

| Element                        | Fresh UI                                                  | Notes and tokens                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top bar                        | `SidebarShell` header **(gap: DocsTopBar with lane nav)** | `--ns-bg`, 1px `studio/topbar/rule`. Logo: 24px `--ns-studio-signal-brand` square with the N stroke in `studio/primary/fg`. Wordmark "NetScript" (heading role) plus a mono "docs" in muted                                                                                                                          |
| Lane nav                       | Nav items **(gap: TopNav)**                               | 14px. The active lane has the ink marker and Medium fg; idle lanes are muted. `aria-current="page"`                                                                                                                                                                                                                  |
| Search trigger                 | `Search` (`.ns-search`)                                   | 280×32, `--ns-card`, 1px `--ns-border` (soft, because it is a button that opens the palette, not a text field), search icon, "Search docs" small muted, `Kbd ⌘K`. Open state: 1px `--ns-fg` boundary                                                                                                                 |
| Version                        | **Gap: VersionChip** (or `Badge muted`)                   | Mono `v0.0.8`, 1px `--ns-border-subtle`, 2px radius                                                                                                                                                                                                                                                                  |
| Theme toggle                   | `IconButton` ghost                                        | moon/sun at 16px, `--ns-studio-icon-stroke`                                                                                                                                                                                                                                                                          |
| Sidebar                        | `SidebarShell` nav                                        | Lane eyebrow plus subtitle. The expanded pillar has `chevron-down` and Medium fg. Children are 13px muted in a 30px row with a reserved marker slot; the current entry has the marker and Medium fg. A How-to group label is an eyebrow. Other pillars sit after a `--ns-border-subtle` divider with `chevron-right` |
| TOC (desktop)                  | **Gap: Toc** (scroll-spy)                                 | "On this page" eyebrow and a 1px `--ns-border-subtle` rail. The current entry's ink marker sits on the rail. Below the list: "View as Markdown" and "Back to top ↑" in mono muted                                                                                                                                    |
| TOC (mobile)                   | **Gap: Toc** (`Accordion` disclosure)                     | 48px sticky bar: "On this page" eyebrow · marker · current section Medium · `chevron-down`                                                                                                                                                                                                                           |
| Sticky section nav (reference) | `Tabs` styled as anchors **(gap: AnchorNav)**             | 44px, `--ns-bg`, 1px bottom `studio/topbar/rule`, `position: sticky; top: 56px`. The current section has the marker and Medium                                                                                                                                                                                       |
| Mobile drawer button           | `IconButton` + `Sheet side=left`                          | 44×44 hit target, `menu` icon at 20px                                                                                                                                                                                                                                                                                |

## 7. Search overlay (Pagefind)

- **Fresh UI component:** `CommandPalette` (`.ns-cmdk`, a native `<dialog>`) fed by the Pagefind JS
  API (`pagefind.search()` → `data()` → `sub_results`). **Gap:** a `PagefindResults` adapter.
- **Scrim:** `--ns-overlay` (`#000` at 40% in light, 66% in dark).
- **Dialog:** 640px wide, 96px from the top, `--ns-card` fill, 1px `--ns-border`, no radius, no
  shadow.
- **Query row** (56px): an 18px search icon, the query at 16px, the caret, and `Kbd esc`.
- **Filters** (40px): lanes from Pagefind filters (`data-pagefind-filter="lane"`): All · Build ·
  Start · Reference, each with a mono count. The active filter has the marker.
- **Results:**
  - grouped under mono eyebrows (lane · pillar);
  - each row shows a file-text icon, a Medium title, a mono URL in muted, and an excerpt in small
    muted with matched terms in Medium fg (no colour highlight);
  - sub-results (headings) use a `hash` icon.
- **Selected row:** `--ns-selected` fill, a 2px ink bar, and the `↵` (corner-down-left) icon.
- **Footer** (40px, `--ns-surface`): `↑ ↓ to navigate · ↵ to open · esc to close`, with "4 results ·
  Pagefind" on the right.

## 8. Copy-source cues (identity)

| Cue            | Component                                                                                                           | Where it appears                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| File-path chip | Kit `Utility/File path chip`: mono 12 path, copy icon at 14px, `--ns-surface`, 1px `--ns-border-subtle`, 2px radius | Hero "You own every file"; the article header ("You own …"); code-block file headers use the same grammar inline                                                                                                                                 |
| Attribute chip | Kit `Utility/Attribute chip`: `data-variant=` in muted and `"value"` in fg                                          | Design-system landing ("NetScript default" `data-theme`/`data-flavor`/`data-gray`/`data-accent`), and variant documentation. It is **not** used next to the current `button.tsx`, which still uses BEM classes (`ns-btn--primary`); see gap G-11 |
| Ownership tags | `[owned]`, `[generated]`, `[guidance]` in mono                                                                      | Home "Know what you own" file tree (quickstart content)                                                                                                                                                                                          |

## 9. New variables (this round)

These new variables were added in this round.

- **Primitives:** `color/swiss-red/l/9` `#DA291C` and `color/swiss-red/d/9` `#E5332A`.
- **Studio flavor variables** (every new variable has values in all 7 modes; the non-Utility values
  equal what those flavors render today):
  - `signal/{l,d}/brand` aliases `brand/{l,d}`;
  - `signal/{l,d}/marker`: Utility uses gray 12 (ink); other flavors use Theme `accent/{l,d}/solid`;
  - `signal/{l,d}/underline`: Utility uses gray 8; other flavors use Theme `accent/{l,d}/11`;
  - `input/{l,d}/border`: Utility uses gray 9; other flavors use Theme `gray/{l,d}/10`;
  - `icon/stroke`: Utility 1.5, others 2 (`--ns-studio-icon-stroke`);
  - prose scale: `prose/{body,lede,h2,h3,h4,code}/{size,line[,tracking]}`,
    `prose/h1-sm/{size,line}`, `prose/measure` (544) and `prose/wide` (720). These are identical in
    all modes (`--ns-studio-prose-*`).
- **Scheme roles:**
  - `studio/signal/brand` → `--ns-studio-signal-brand`
  - `studio/signal/marker` → `--ns-studio-signal-marker`
  - `studio/signal/underline` → `--ns-studio-signal-underline`
  - `studio/input/border` → `--ns-studio-input-border`

These must be registered in code when S1 lands. Round 7 gave every `studio/*` Scheme role, and every
scheme-independent, non-boolean Studio flavor variable without a Theme twin, the code syntax
`var(--ns-studio-<path>)`; the prose scale is therefore `--ns-studio-prose-*` and the icon stroke
`--ns-studio-icon-stroke`.

## 10. Measured contrast (exported pixels)

| Pair                                                                                              | Light                          | Dark                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| Body, lede and links (ink on ground)                                                              | `#202020`/`#FFF` 16.29:1       | `#EEE`/`#18181A` 15.28:1                      |
| Code text on code surface                                                                         | `#202020`/`#F6F6F6` 15.08:1    | `#EEE`/`#1E1E21` 14.33:1                      |
| Code comments (muted italic)                                                                      | `#646464`/`#F6F6F6` 5.48:1     | `#B4B4B4`/`#1E1E21` 8.02:1                    |
| Eyebrows (mono muted)                                                                             | `#646464`/`#FFF` 5.92:1        | `#B4B4B4`/`#18181A` 8.55:1                    |
| Callout note/tip body                                                                             | `#202020`/`#F6F6F6` 15.08:1    | `#EEE`/`#1E1E21` 14.33:1                      |
| Callout warning body                                                                              | `#4F3422`/`#FFF7C2` 10.47:1    | `#FFCA16`/`#302008` 10.26:1                   |
| Location marker (TOC, sidebar)                                                                    | `#202020`/`#FFF` 16.29:1       | `#EEE`/`#18181A` 15.28:1                      |
| Link underline (rest; underline presence plus Medium weight are the non-colour cues; hover → ink) | `#BBBBBB` 1.92:1               | `#606060` 2.82:1                              |
| Primary button                                                                                    | `#FCFCFC` on `#202020` 15.88:1 | `#EEE` on `#313131` 11.21:1, gray-d10 keyline |
| Logo red                                                                                          | 4.87:1                         | 4.09:1                                        |

## 11. Component gaps (Fresh UI has no component yet)

| ID   | Gap                                                                            | Notes                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| G-1  | **Kbd**                                                                        | A kit component exists in Figma. Code needs a `kbd` primitive and prose CSS                                                            |
| G-2  | **FilePathChip** (copy-source cue)                                             | Mono path plus a copy action (`data-part="copy"`, as in `CodeBlock`)                                                                   |
| G-3  | **AttributeChip** (`data-*`)                                                   | Purely presentational; name in muted, value in fg                                                                                      |
| G-4  | **Eyebrow** text style                                                         | Could be a `Label variant=eyebrow`                                                                                                     |
| G-5  | **LocationMarker** in nav, tab, TOC and filter states                          | Ink square via `::before` on `[aria-current]` / `[aria-selected=true]`                                                                 |
| G-6  | **Toc** with scroll-spy, desktop rail and mobile disclosure                    | Currently JS in `base.vto`                                                                                                             |
| G-7  | **FileTree** with ownership tags                                               | Currently docs-only markup                                                                                                             |
| G-8  | **Stepper / LearningPath**                                                     | —                                                                                                                                      |
| G-9  | **Pager** (prev/next)                                                          | Or a `Pagination` variant                                                                                                              |
| G-10 | **Figure** (diagram/image with caption)                                        | —                                                                                                                                      |
| G-11 | **Data-attribute variants on `Button`**                                        | `button.tsx` still maps variants to BEM classes (`VARIANT_CLASSES` → `ns-btn--primary`). Epic Decision 4 calls for `data-variant` (S3) |
| G-12 | **Tabbed `CodeBlock`**                                                         | Tabs plus a file-path header row, line numbers, and a horizontal-scroll affordance. `CodeBlock` today has filename/lang/copy only      |
| G-13 | **PagefindResults** adapter for `CommandPalette`                               | Filters, grouped results, sub-results, excerpt highlighting                                                                            |
| G-14 | **DocsTopBar / TopNav** with lane nav, plus **AnchorNav** (sticky section nav) | —                                                                                                                                      |
| G-15 | **RuledGrid** / **FeatureGrid** layouts and **Card `data-variant="rule"`**     | —                                                                                                                                      |
| G-16 | **Callout `important` emphasis**                                               | `Alert` has info/success/warning/destructive and no strong-info or left-rule variant                                                   |
| G-17 | **Prose stylesheet** for the Utility type scale                                | `markdown.css` must adopt the `--ns-studio-prose-*` roles, the list-bullet squares and the inline-code chip                            |
| G-18 | **Hero**                                                                       | `PageHeader` covers page titles, not the display plus aside composition                                                                |

## 12. Notes for implementation

- **Dark mode is designed, not inverted.** Grounds are graphite (`#18181A`, with code and panels at
  `#1E1E21`). Primaries are dark keys with a gray-d10 keyline. Markers and focus use light ink or
  gray-d10. There are no white slabs.
- **No JS:**
  - tabs show all panels;
  - the TOC stays hidden;
  - search falls back to the Pagefind static UI;
  - the runtime choice defaults to the first tab.
- **Pixel rules:**
  - every edge sits on a whole pixel;
  - rows with a 1px bottom rule need a 1px top inset so centred content does not land on .5 (applied
    in the Figma specimens);
  - re-seed bound paints after any mode switch.
