# eis-chat `.design-sync` — full extraction

Source: `.llm/tmp/eis-chat-ref/.design-sync/` (conventions.md, NOTES.md, config.json,
`previews/*.tsx`) **and** `.llm/tmp/eis-chat-ref/apps/dashboard/` (the real app tree the sync
describes). Read-only.

## Critical structural fact: there are TWO trees, not one

The topic spec (`specs/02-eis-chat-reference.md`) reads as if `.design-sync/previews/*` (~30 files)
**is** the NS One component set. It is not — it is a **Claude design-sync tool's preview-card
scratch output**, generated *from* the real implementation for visual QA/prompting purposes. The
real, shipped, app-owned component implementation lives at:

```
apps/dashboard/
├── components/ui/      ← REAL L2 components (41 .tsx + .ts, matches fresh-ui almost 1:1, see doc 03)
├── components/blocks/   ← REAL L3 blocks (9 files — NOT mirrored anywhere in fresh-ui)
├── lib/ui/              ← client-toast.ts, preferences.ts, toast.ts
├── islands/ui/          ← ActionToasts, NavProfile, NavProgress, NewSessionButton, SidebarToggle,
│                           ThemeToggle, Toast
└── assets/              ← tokens.css, tokens.json, layouts.css, styles.css, design.css,
                            theme-bridge.css, assets/ui/*.css (per-component), assets/blocks/*.css
```

`config.json`'s `componentSrcMap` confirms this: every entry points at `components/ui/<name>.tsx`
relative to a `srcDir` root, and `NOTES.md` states plainly the sync's synthetic npm package is
"a COPY of `apps/dashboard/{components,lib,assets}`" — i.e. the design-sync tool's own documentation
names `apps/dashboard` as ground truth, not `.design-sync/previews/`.

`.design-sync/previews/*.tsx` (30 files, capitalized names — `Button.tsx`, `Card.tsx`, etc.) are
**floor cards**: per `NOTES.md`, "Floor cards for all 29: no authored previews yet (chosen fast
path)... Author `.design-sync/previews/<Name>.tsx` incrementally on any re-sync." Several are
explicitly flagged `[RENDER_BLANK]` — "honest unauthored baselines, not failures" for Badge, Card,
Checkbox, DataTable, FilterForm, FormField, Input, Panel, Progress. **Do not treat the previews
directory as authoritative component quality evidence** — it is a visual-QA convenience layer with
known incomplete coverage, sitting on top of components that are themselves fully built in
`apps/dashboard/components/ui/`.

## `conventions.md` — the documented design language ("NS One")

- Layer ladder: **L0 platform contract** (token conventions, `data-part`/`data-state`/ARIA rules,
  `VisuallyHidden`/`SrOnly`/`Show`) → **L1 runtime behavior** (accordion/tabs/drawer/tooltip;
  keyboard/focus/ARIA; emits data-attrs, never `ns-*` classes) → **L2 registry components** (Button,
  Card, Input… may emit `ns-*` classes; never L2→L2 import) → **L3 blocks** (page headers, tables,
  filter rails) → **L4** (routes/data-loading, outside the DS). This is **word-for-word the same
  ladder** as the `fresh-ui-horizontal` skill and fresh-ui's own README taxonomy — not a competing
  vocabulary, the same one.
- Token rule: theme-blind components, semantic `--ns-*` vocabulary only (`--ns-bg/fg/surface/card/
  border/muted`, intents `primary/accent/destructive`, scales `--ns-space-1…16`,
  `--ns-radius-{sm..full}`, `--ns-text-*`, `--ns-leading-*`, fonts `--ns-font-sans` (DM Sans)/
  `--ns-font-mono` (DM Mono)). Never raw hex, never a primitive ramp step in component code —
  derive via `color-mix()`. Dark-default theme, `data-theme="light"` switch.
- Layout objects: `.ns-stack`, `.ns-cluster`, `.ns-grid--3`, `.ns-split`, `.ns-toolbar`,
  `.ns-switcher`, plus `.ns-shell`, `.ns-section`, `.ns-sidebar`, `.ns-content-rail`, `.ns-topbar`.
- BEM variant families: `ns-btn--{primary,secondary,outline,ghost,destructive}` + sizes
  `--{sm,lg,icon}`; `ns-badge--{primary,secondary,muted,success,warning,destructive}`;
  `ns-alert--{info,success,warning,destructive}`.
- State via `data-part`/`data-state`/`aria-*`; native-first (`<select>`, `<dialog>`, popover,
  `<details>` before JS state).
- Stated truth chain: `styles.css` → `_ds_bundle.css` is "the full closure (tokens + layout objects +
  Tailwind `*-ns-*` utilities + component CSS)." Each component "has" a `*.prompt.md` (usage) and
  `*.d.ts` (shape) — **per `NOTES.md`, this is aspirational/degraded in practice**, see below.

## `NOTES.md` — how the sync is actually built, and its known gaps

- **Off the converter's standard envelope**: this is a Deno/Preact/Fresh, copy-source-UI, no
  Storybook, no npm-build repo. The sync fakes an npm package: `.ds-sync/scratch/node_modules/
  @eis-chat/ns-one/` is a **gitignored, regenerate-on-clone COPY** of
  `apps/dashboard/{components,lib,assets}` plus a synthetic `package.json` + React-JSX `tsconfig`.
- **Preact is type-only** in every component (`import type { JSX, VNode }`) — compiling the copy
  under a React JSX tsconfig yields genuine React components with no Preact at runtime in the
  synthetic bundle. This is a build-time trick specific to the *sync tool*, not a statement about
  the real app (which is Preact/Fresh at runtime).
- **`_ds_bundle.css` truth chain, corrected**: `ds-css-flat.css` in the synthetic package = a
  Google-Fonts `@import` (DM Sans/DM Mono, loaded via `<link>` at runtime — `[FONT_REMOTE]`, no
  woff2 shipped) **prepended to the dashboard's real compiled CSS**
  (`apps/dashboard/_fresh/client/assets/*.css`). The converter copies this verbatim into
  `_ds_bundle.css`. Explicitly warned against: "Do NOT hand-flatten tokens+ui only" — components
  reference Tailwind `*-ns-*` utilities and layout objects from `assets/layouts.css` that **only
  exist after the Tailwind build**; a tokens+ui-only flatten is ~42 KB and renders components
  half-styled, vs. ~80 KB for the real compiled closure. Re-sync recipe: `deno task --cwd
  apps/dashboard build` → refresh `_fresh` → `{ echo "$FONT_IMPORT"; cat <the _fresh .css>; } >
  ds-css-flat.css`.
- **Theme-default correction the sync has to patch around**: the *real app* is dark-by-default
  (`:root` = dark, `color-scheme: dark`; light is `[data-theme='light']`) — this **contradicts**
  `conventions.md`'s own "dark by default" line only in emphasis, not fact, but the preview
  cards/design-agent canvas render **unthemed**, which would fall to dark and mismatch `/design`
  (the real route, which renders "the warm cream light theme"). Fix baked into the sync: append
  `:root:not([data-theme]) { <the [data-theme='light'] vars> }` so unthemed roots default to light
  (the actual brand look) while explicit `data-theme` still overrides. This is sync-tooling
  scaffolding, not part of the shipped app's real CSS.
- **`.d.ts` are weak by design in this sync mode**: "synth-entry mode emits `{ [key: string]:
  unknown }` per component" — the variant/size APIs are taught through the `conventions.md` header
  text (the `ns-*--variant` class families), **not** through real generated types. To get real prop
  types would require `cfg.dtsPropsFor.<Name>` bodies or a genuine type-emitting build. **This means
  the "`*.d.ts` ships with each component" claim in `conventions.md` §"Where the truth lives" is true
  only inside the synthetic sync package, not as a general claim about `apps/dashboard/components/
  ui/*.tsx`** — the real `.tsx` files are already fully typed (see doc 03 diffs: real prop interfaces,
  not `unknown` bags); the weak-`.d.ts` caveat is scoped to the design-sync tool's own output
  artifact, not the real source.
- Known render-warn triage (not new, not blocking): `[RENDER_BLANK]` on Badge/Card/Checkbox/
  DataTable/FilterForm/FormField/Input/Panel/Progress previews — bare-component floor cards with no
  authored content, explicitly not failures.
- Re-sync risk flagged: the synthetic package is a stale-prone copy; must be recreated (three-dir
  copy step) before every rebuild. No npm lockfile in the Deno repo; converter deps live in
  `.ds-sync/` (esbuild, ts-morph, playwright) — **outside** `.design-sync/` proper.

## `config.json` — the machine-readable manifest

`projectId`, `pkg: "@eis-chat/ns-one"`, `globalName: "NSOne"`, `shape: "package"`,
`srcDir: "components/ui"`, `cssEntry: "ds-css-flat.css"`, `tokensGlob: "assets/tokens.css"`,
`componentSrcMap` — 27 explicit entries (Alert, Badge, Breadcrumb, Button, Card, Checkbox,
DataTable, DetailLayout, EmptyState, FilterForm, FormField, IconButton, InlineNotice, Input, Label,
PageHeader, Pagination, Panel, Progress, ResponsiveTable, SectionDivider, Select, Separator,
SidebarShell, Skeleton, Spinner, StatsGrid, Switch, Textarea — 27 of the real app's 41
`components/ui/*.tsx` files are enumerated; the remainder — chart-block, citation-chip, code-block,
command-palette, donut, dropzone, html-block, icon, mcp-widget, message, model-selector,
prompt-input, search, tool-call-card, ui-block — are **not** in this manifest, i.e. the design-sync
tool itself was scoped to the "generic dashboard chrome" subset and deliberately excludes the
chat/MCP-specific and richer content-rendering components from its preview-card pass).
`overrides.{FormField,Input,Label,Textarea}.cardMode: "column"` — layout hint for the preview
renderer only, not app behavior.

## Bottom line for the D-NSONE research handoff

"NS One" as a *documented convention set* (`conventions.md`) is a faithful, well-written restatement
of the same L0-L4 doctrine fresh-ui and the `fresh-ui-horizontal` skill already use. "NS One" as a
*preview-card artifact* (`.design-sync/previews/*`) is a partial, tooling-scoped, known-incomplete
visual-QA layer over a **subset** (27 of 41) of the real components, with several explicitly-blank
floor cards. The component you'd actually want to promote or reference is
`apps/dashboard/components/ui/*.tsx` + `components/blocks/*.tsx` + `assets/*.css` — the real,
fully-typed, fully-styled app source — not the `.design-sync/` folder the topic spec's reading list
points at. See `03-fresh-ui-vs-nsone-gap-inventory.md` for what that real source actually contains
relative to fresh-ui.
