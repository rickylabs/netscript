# `@netscript/fresh-ui` — current surface inventory

Source: `packages/fresh-ui/` in the NetScript worktree (full recursive listing + direct reads).
Read-only; no source modified.

## Package model (from `README.md` + `registry.manifest.ts`)

- **Copy-source component registry**, not a runtime-imported UI kit for the styled layer. Model
  string in the manifest: `model: 'copy-based-registry'`. Items carry
  `copyOwnership: 'app-owned-after-copy'` — once `netscript ui:add <item>` copies files into a
  consumer app, that app owns and can freely evolve the copy. This is the **exact mechanism** that
  explains the fresh-ui ⇄ eis-chat file identity documented in `03-fresh-ui-vs-nsone-gap-inventory.md`.
- CLI surface: `netscript ui:init` (seeds tokens/lib), `netscript ui:add <item>` (copies one
  registry item + its `registryDependencies`).
- Root entrypoints per README: default export (runtime helpers: `cn`, `getToast`/`withToast`/
  `stripToastFromUrl`, `Icon`), `./interactive` (stateful compound components: `Dialog`, `Drawer`,
  `Popover`, `Sheet`, `Tabs`, `Tooltip`, `Accordion`), `./primitives` (headless: `Icon`, `Show`,
  `VisuallyHidden`, `SrOnly`). These three surfaces are **not** copy-source — they ship as a real
  published package import (`@netscript/fresh-ui`, `@netscript/fresh-ui/interactive`,
  `@netscript/fresh-ui/primitives`), distinct from the copy-source `registry/` tree.
- Tokens: `tokenSourceStrategy: 'style-dictionary-dtcg-source'` — `tokens/primitives.tokens.json`,
  `tokens/semantic.tokens.json`, `tokens/themes/{dark,light}.tokens.json` are the DTCG source;
  `registry/theme/tokens.css` is a generated/checked-in seed (file header: "Planned direction: Style
  Dictionary becomes the canonical token source; this file becomes a generated artifact" — i.e. the
  package's own doc already flags tokens.css as provisional, pre-generation).

## Registry surface (copy-source tree, `packages/fresh-ui/registry/`)

**`components/ui/` — 41 `.tsx` components** (L2 registry layer, matches `fresh-ui-horizontal`
skill's L0-L4 vocabulary): `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `chart-block`,
`checkbox`, `citation-chip`, `code-block`, `command-palette`, `control-props` (`.ts`, shared
descriptor helper, not a component), `data-table`, `detail-layout`, `donut`, `dropzone`,
`empty-state`, `filter-form`, `form-field`, `icon-button`, `inline-notice`, `input`, `label`,
`message`, `model-selector`, `page-header`, `pagination`, `panel`, `progress`, `prompt-input`,
`responsive-table`, `search`, `section-divider`, `select`, `separator`, `sidebar-shell`, `skeleton`,
`spinner`, `stats-grid`, `switch`, `textarea`, `tool-call-card`.

**Markdown is generated, not authored directly** — no `markdown.tsx` in the tree. Instead:
`markdown.tsx.template` + `markdown-pipeline.ts` + `markdown.README.md` + `markdown.css`. This is a
templated/codegen path, unlike every other component which is a plain checked-in `.tsx`. Notable
because eis-chat's real `markdown.tsx` (see doc 02/03) is a plain compiled file — the two systems
diverge in **build approach** for this one component even where source is otherwise identical
elsewhere.

**CSS**: one `.css` per styled component that needs bespoke rules (28 files), plus shared style
bundles not tied 1:1 to a single component: `choice-styles.css` (checkbox+switch), `floating.css`,
`form-control-styles.css` (input/select/textarea shared chrome), `sheet.css` (styles the `Sheet`
*interactive* primitive, not a registry component — no `sheet.tsx` in `components/ui/`),
`surface-styles.css`, `toast.css` (styles the `Toast` *island*, not a registry component).

**`islands/`** — `SidebarToggle.tsx`, `ThemeToggle.tsx`, `Toast.tsx` (Fresh client islands, thin
wrappers around registry/runtime state).

**`lib/`** — `cn.ts` (clsx + tailwind-merge wrapper), `public-types.ts` (`Renderable`,
`ComponentResult` shared types), `toast.ts` (redirect-flash toast codec).

**`styles/layouts.css` + `theme/{styles.css,theme-bridge.css,tokens.css,tokens.json}`** — the
layout-object CSS (`.ns-stack`, `.ns-cluster`, `.ns-grid--N`, `.ns-split`, `.ns-toolbar`,
`.ns-switcher`, `.ns-shell`, `.ns-sidebar`, `.ns-topbar`, `.ns-dashboard*` app-shell classes, `.ns-app`
3-pane workspace shell, `.ns-nav`/`.ns-main`/`.ns-session` column primitives, `.ns-breadcrumb*`) plus
the full `--ns-*` token seed (gray/copper/teal/slate/red/amber ramps in OKLCH-with-hex-fallback,
semantic roles, spacing/radius/shadow/z-index/easing scales, dark theme override block).

## `src/` — the non-registry, real-import runtime (published package code)

- `src/presentation/`: `primitives.tsx` (root `Icon`/`Show`/`VisuallyHidden`/`SrOnly`),
  `data-grid.tsx` + `.css` (the `DataGrid<T>` generic table shown in the README quick-start — a
  **real typed export**, not a copy-source item; this is the one genuinely "componentized" surface
  fresh-ui ships as an actual import rather than copy-paste source).
- `src/runtime/`: one folder per interactive primitive — `accordion/`, `combobox/`, `dialog/`,
  `drawer/`, `popover/`, `sheet/`, `tabs/`, `tooltip/` — each with a `<Name>.tsx` compound-component
  file, a `<name>.types.ts`, and a `use-<name>.ts` behavior hook. `src/runtime/_internal/` holds
  shared plumbing (`compose-refs`, `compose-event-handlers`, `collection-navigation`,
  `use-dismissable-layer`, `use-controllable-signal`, `platform-popover`, `dom-types`,
  `context-error`). This is fresh-ui's **L1 runtime behavior** layer per NS One's own layer ladder
  vocabulary — keyboard/focus/ARIA, emits data-attributes only, never `ns-*` classes (matches the
  `.design-sync/conventions.md` L1 definition verbatim).
- `src/chat/parse-blocks.ts` — chat-message block parsing (message-stream → renderable block list),
  paired with `registry/components/ui/message.tsx` + `chart-block.tsx`/`code-block.tsx`/
  `html-block`-adjacent rendering. No `html-block.tsx`/`ui-block.tsx`/`mcp-widget.tsx` equivalent
  exists on the fresh-ui side (see doc 03).

## Tests

`tests/registry/components/ui/*.test.tsx` covers only a **subset** of the 41 registry components
(avatar, chart-block, citation-chip, code-block, command-palette, data-table, donut, dropzone,
foundation, message, model-selector, prompt-input, search, tool-call-card — 14 of 41). Most of the
plain layout/typography components (button, card, badge, alert, panel, stats-grid, sidebar-shell,
page-header, pagination, empty-state, filter-form, detail-layout, section-divider, breadcrumb,
skeleton, spinner, progress, separator, label, select, switch, checkbox, textarea, input,
form-field, icon-button, inline-notice, responsive-table) have **no dedicated registry test** —
`tests/registry/components/ui/foundation.test.tsx` may cover several generically, but this is a
gap-inventory-relevant fact for whatever quality bar the dashboard-plugin build holds registry
components to. `src/runtime/*` primitives are separately tested per-primitive under
`tests/runtime/`.

## Doctrine cross-check (`fresh-ui-horizontal` skill)

The package's own README + file layout already implement the skill's L0-L4 vocabulary faithfully:
L0 = `src/presentation/primitives.tsx` (Icon/Show/VisuallyHidden/SrOnly), L1 =
`src/runtime/*` (accordion/dialog/drawer/popover/sheet/tabs/tooltip/combobox), L2 =
`registry/components/ui/*` (41 components, no L2→L2 imports observed in the sampled files), L3 =
**absent** — there is no `registry/blocks/` (or `src/blocks/`) directory anywhere in the package.
Page-scale compositions (activity feeds, breadcrumb rails, channel/session tree navs, member rails,
plugin-gated view-swaps) have no fresh-ui-side home today. This is an internal fresh-ui gap,
independent of NS One, but directly relevant to D-NSONE since eis-chat's `components/blocks/` (see
doc 03) is exactly the missing L3 layer, already built once.
