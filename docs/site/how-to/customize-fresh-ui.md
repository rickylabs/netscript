---
layout: layouts/base.vto
title: Customize Fresh UI
templateEngine: [vento, md]
prev: { "label": "Add OpenTelemetry", "href": "/how-to/add-opentelemetry/" }
next: { "label": "Deploy", "href": "/how-to/deploy/" }
---

# Customize Fresh UI

**Goal:** make the scaffolded frontend yours — edit a route, add an interactive
island, restyle a component, install more UI primitives, and re-theme the app —
without fighting the framework. NetScript scaffolds a real
[Fresh](https://fresh.deno.dev) 2 application at `apps/dashboard/`, powered by the
[`@netscript/fresh`](/reference/fresh/) meta-framework, and the UI components live
in *your* repository as copied source. After the copy, that code is yours to change.

This is a task-oriented recipe. It assumes you already have a NetScript workspace
(created with `netscript init`) whose `apps/dashboard/` app type-checks and runs.
For the full generated API of the building blocks, follow the reference links at
the end — this page never duplicates the [reference](/reference/fresh-ui/).

{{ comp callout { type: "note", title: "The ownership model in one sentence" } }}
The Fresh runtime (<code>@netscript/fresh</code>) and the UI registry
(<code>@netscript/fresh-ui</code>) are framework packages, but every component you
render is <strong>copied into <code>apps/dashboard/components/ui/</code></strong> by
<code>netscript ui:init</code> / <code>ui:add</code> — so editing the UI is editing
your own files, not patching a dependency.
{{ /comp }}

## Before you start

You need:

- An existing NetScript workspace with the scaffolded `apps/dashboard/` Fresh app.
  If you do not have one yet, create it first (`netscript init`) — see the
  [Quickstart](/quickstart/) or the [Storefront tutorial](/tutorials/storefront/).
- The `netscript` command on your path. Run `netscript --help` to confirm, and
  `netscript ui:init --help` / `netscript ui:add --help` for the exact option
  spelling in your installed version. If `netscript` is not found, install it with
  `deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}`.

Run the app while you work so you can see each change live. Aspire is step 2 of the
normal startup flow — it brings up your database (Postgres by default; or `mysql` /
`mssql` / `sqlite` chosen at scaffold time via `--db`) and Redis before any
`netscript db` command and orchestrates the dashboard for you. You can also run the Fresh app on
its own when you only need the UI loop:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Under Aspire (recommended)",
    lang: "bash",
    code: "# Brings up Postgres + Redis AND the dashboard; Aspire dashboard graph at https://localhost:18888\ncd aspire && aspire start"
  },
  {
    label: "Fresh app only",
    lang: "bash",
    code: "# Leaner single-process loop — Vite dev server with HMR\ndeno task --cwd apps/dashboard dev"
  }
] }) }}

{{ comp callout { type: "tip", title: "Start at /design" } }}
Before changing anything, open the scaffolded <code>/design</code>
showcase in the running app. It renders the live component gallery
(<code>/design/components</code>), the token reference (<code>/design/tokens</code>),
and composition rules (<code>/design/composition</code>) against the active theme —
all from the app-owned copies, so it is the fastest way to feel what you already have.
{{ /comp }}

## Where the app lives

Everything for the frontend is under `apps/dashboard/`. The layout follows Fresh 2
file-system routing, with NetScript conventions layered on top:

{{ comp.apiTable({
  caption: "apps/dashboard/ — what each path owns",
  rows: [
    { name: "main.ts", type: "app entry", desc: "Bootstraps the Fresh app with defineFreshApp from @netscript/fresh/server. Reads PORT and prints the startup banner you see in aspire start logs." },
    { name: "routes/", type: "pages + layouts", desc: "File-system routes. index.tsx, dashboard.tsx, health.tsx, examples/, plus _app.tsx (HTML shell) and _layout.tsx (chrome). Groups like (_components)/, (_shared)/, and (_islands)/ are non-routing co-location folders." },
    { name: "islands/", type: "client interactivity", desc: "Hydrated Preact components (ThemeToggle, SidebarToggle, Toast). Everything else renders on the server only." },
    { name: "components/ui/", type: "app-owned UI", desc: "The copied @netscript/fresh-ui primitives — Button, Card, Badge, PageHeader, StatsGrid, and friends. Edit these freely; they are yours after the copy. Barrel at components/ui/mod.ts." },
    { name: "assets/", type: "styling + tokens", desc: "tokens.css / tokens.json (the --ns-* design tokens), styles.css, design.css, and per-component CSS under assets/ui/. Tailwind v4 is wired through Vite." },
    { name: "lib/", type: "app helpers", desc: "cn.ts (class merge), example-service.ts, public-types.ts — non-UI utilities the routes import." },
    { name: "router.ts / utils.ts", type: "typed wiring", desc: "router.ts exposes typed route references (appRoutes); utils.ts exports the createDefine<State>() define helper and the definePage() builder." },
    { name: "vite.config.ts / deno.json", type: "build + deps", desc: "Vite + Fresh + Tailwind plugins and the @app/* aliases; deno.json pins fresh, preact, @preact/signals, tailwindcss, and the @netscript/fresh* imports." }
  ]
}) }}

The app entry is one call — `defineFreshApp` keeps the static-file and
filesystem-route bootstrap framework-managed, so you only author routes, islands,
and components:

{{ comp.tabbedCode({ tabs: [
  {
    label: "apps/dashboard/main.ts",
    lang: "ts",
    code: "import { defineFreshApp } from '@netscript/fresh/server';\nimport type { State } from '@app/utils.ts';\n\nexport const app = defineFreshApp<State>({ name: 'dashboard' });\n\n// PORT is supplied by Aspire; defaults locally. The banner shows in `aspire start` logs.\nconst port = parseInt(Deno.env.get('PORT') || '8010');\nconsole.log(`[dashboard] listening on http://localhost:${port}`);"
  }
] }) }}

{{ comp callout { type: "note", title: "Two import roots, two jobs" } }}
<code>@netscript/fresh</code> is the <strong>runtime meta-framework</strong>: it
ships the app bootstrap (<code>/server</code>), route and page builders, and a typed
data layer (<code>/query</code>), alongside <code>/builders</code>,
<code>/route</code>, <code>/form</code>, <code>/defer</code>, and
<code>/interactive</code> subpaths. <code>@netscript/fresh-ui</code> is the
<strong>component registry</strong> the CLI copies from. You import the runtime
directly; you import UI from your own <code>@app/components/ui/mod.ts</code> barrel,
not from the registry package.
{{ /comp }}

{{ comp callout { type: "note", title: "Meta-framework vs scaffolded app" } }}
Keep two ideas distinct: <code>@netscript/fresh</code> is the reusable
<strong>meta-framework</strong> (server/islands/query primitives that any Fresh app
can import), while <code>apps/dashboard/</code> is <strong>your scaffolded
instance</strong> of it. The concept hub on <a href="/capabilities/fresh-ui/">Fresh UI</a>
explains how the two relate and where each layer's responsibilities begin and end.
{{ /comp }}

## Edit a route

Routes are plain `.tsx` files under `routes/`. The scaffold uses the `definePage()`
builder (from `@app/utils.ts`) so a page declares its route, metadata, and the view
it renders in one typed chain. To change the home page, edit
`routes/(_components)/home-view.tsx` (the presentational view) and/or
`routes/index.tsx` (the page declaration and its data):

{{ comp.tabbedCode({ tabs: [
  {
    label: "routes/index.tsx",
    lang: "tsx",
    code: "import HomeView from './(_components)/home-view.tsx';\nimport { appRoutes } from '@app/router.ts';\nimport { definePage } from '@app/utils.ts';\n\nexport const homePage = definePage()\n  .withRoute(appRoutes.home)\n  .withMeta(() => ({ title: 'my-app — dashboard', description: 'My app overview.' }))\n  .withLayer('home', HomeView, () => ({\n    projectName: 'my-app',\n    appName: 'dashboard',\n    routes: [\n      { title: 'Dashboard', href: appRoutes.dashboard.href(), description: 'Operational overview.', cta: 'Open', badge: 'app' },\n    ],\n  }))\n  .withLayout((slots) => slots.home())\n  .build();\n\nexport const { default: page } = homePage;\nexport { page as default };"
  },
  {
    label: "Add a brand-new page",
    lang: "tsx",
    code: "// routes/status.tsx — a new route at /status\nimport { definePage } from '@app/utils.ts';\nimport { appRoutes } from '@app/router.ts';\n\nexport const statusPage = definePage()\n  .withRoute(appRoutes.home) // swap for a typed route once you add it to router.ts\n  .withMeta(() => ({ title: 'Status' }))\n  .withLayer('status', () => <main class='ns-shell ns-section'>All systems go.</main>, () => ({}))\n  .withLayout((slots) => slots.status())\n  .build();\n\nexport const { default: page } = statusPage;\nexport { page as default };"
  }
] }) }}

The HTML shell (`<html>`, `<head>`, fonts, the theme-seed script) is
`routes/_app.tsx`; the top bar / navigation chrome wrapping content pages is
`routes/_layout.tsx`. Both use the `define.page(...)` / `define.layout(...)` helpers
from `createDefine<State>()`. Edit those to change the global frame rather than
repeating markup per page.

{{ comp callout { type: "tip", title: "Co-location folders don't become URLs" } }}
Folders wrapped in parentheses — <code>(_components)</code>,
<code>(_shared)</code>, <code>(_islands)</code>, <code>(design)</code> — are Fresh
<strong>route groups</strong>: they organize files next to the route that uses them
without adding a path segment. Keep a page's view, loader, and demo islands beside
the route file and the URL stays clean.
{{ /comp }}

{{ comp callout { type: "tip", title: "Add typed route references in router.ts" } }}
When you add a permanent page, register it in <code>apps/dashboard/router.ts</code>
so <code>appRoutes</code> exposes a typed <code>.href()</code> for it. Linking
through <code>appRoutes</code> instead of hand-written strings means a renamed or
removed route fails the type-check rather than 404-ing at runtime.
{{ /comp }}

## Add interactivity with an island

Server-rendered routes ship zero client JavaScript. When you need state in the
browser — a toggle, a form, a live panel — add an **island** under `islands/`.
Islands are the only components Fresh hydrates on the client. The scaffold ships
`ThemeToggle`, `SidebarToggle`, and `Toast` under `islands/ui/` as working
examples; model new ones on them using Preact signals:

{{ comp.tabbedCode({ tabs: [
  {
    label: "islands/Counter.tsx",
    lang: "tsx",
    code: "import { useSignal } from '@preact/signals';\nimport type { VNode } from 'preact';\n\nconst Counter = (): VNode => {\n  const count = useSignal(0);\n  const increment = () => { count.value += 1; };\n  return (\n    <button type='button' onClick={increment} class='ns-button'>\n      Clicked {count.value} times\n    </button>\n  );\n};\n\nexport default Counter;"
  },
  {
    label: "Use it in a route view",
    lang: "tsx",
    code: "// routes/(_components)/home-view.tsx\nimport Counter from '@app/islands/Counter.tsx';\n\nconst HomeView = () => {\n  return (\n    <main class='ns-shell ns-section'>\n      {/* Rendered on the server, hydrated on the client */}\n      <Counter />\n    </main>\n  );\n};\n\nexport default HomeView;"
  }
] }) }}

A few rules keep islands cheap and correct: keep them small and leaf-shaped; pass
plain serializable props in (the island boundary is the hydration boundary); and
declare interactive event handlers with arrow functions, as in the scaffolded
`ThemeToggle`. Anything that does not need browser state should stay a plain
component in `components/` so it ships no JS.

{{ comp callout { type: "note", title: "Fetch typed data with @netscript/fresh/query" } }}
When an island or route needs server data, prefer the runtime's typed query layer
(<code>@netscript/fresh/query</code>) over hand-rolled <code>fetch</code> calls — it
carries the oRPC contract types through to the client so a renamed service field
surfaces as a type error. See <a href="/reference/fresh/"><code>@netscript/fresh</code></a>
for the query builders, and <a href="/how-to/add-a-service/">Add a service</a> for
the backend half of that contract.
{{ /comp }}

## Restyle: tokens, Tailwind, and component CSS

NetScript styling has three layers, lightest-touch first:

{{ comp.card({
  title: "1 · Design tokens (theme-wide)",
  body: "Edit the CSS custom properties in assets/tokens.css (mirrored in tokens.json). Tokens are named --ns-* (e.g. surface, border, foreground, accent) and drive every component plus the light/dark themes selected by the data-theme attribute. Change a token once and the whole app re-themes."
}) }}

{{ comp.card({
  title: "2 · Tailwind utilities (per element)",
  body: "Tailwind v4 is wired through Vite (@tailwindcss/vite). Use utility classes in JSX for one-off layout and spacing. The scaffold also defines NetScript layout helpers (ns-shell, ns-section, ns-stack, ns-cluster) in assets/layouts.css for consistent page rhythm."
}) }}

{{ comp.card({
  title: "3 · Component CSS (one primitive)",
  body: "Each copied primitive has its own stylesheet under assets/ui/ (button.css, card.css, badge.css, …). To restyle just one component everywhere, edit its file there — it is app-owned source, imported by assets/styles.css."
}) }}

Pick the lightest layer that does the job: reach for a **token** when the change
should re-theme the whole app, a **Tailwind utility** for one-off element layout,
and **component CSS** when one primitive should look different everywhere it appears.

Theme switching is already wired: `routes/_app.tsx` seeds `data-theme` from the
`ns-theme` localStorage key (falling back to the OS preference), and the
`ThemeToggle` island flips it at runtime. To ship a different default, change the
`data-theme` attribute on `<html>` in `_app.tsx` and adjust the token values for
that theme in `assets/tokens.css`.

{{ comp callout { type: "warning", title: "Edit tokens, not magic numbers" } }}
Reach for a raw hex color or pixel value only when no token fits. Hard-coded values
drift away from the theme and break the light/dark switch — the whole point of the
<code>--ns-*</code> tokens is that one edit re-themes every surface consistently.
{{ /comp }}

## Install more UI from the registry

When you need a primitive the scaffold didn't copy in, pull it from the
`@netscript/fresh-ui` registry with the CLI. Two commands do the work, and both
**copy source files into your app** rather than adding a runtime dependency:

{{ comp.apiTable({
  caption: "Fresh UI CLI commands",
  rows: [
    { name: "netscript ui:init", type: "install the foundation", desc: "Installs the NetScript Fresh UI foundation set into an app workspace. Run once when setting up UI in an app that doesn't have it yet (the scaffold runs the equivalent for you)." },
    { name: "netscript ui:add <name>", type: "add one item or collection", desc: "Copies a single registry item or a named collection into the app workspace — component files go to apps/dashboard/components/ui/, island files to islands/ui/, lib helpers to lib/, and assets to assets/ui/ — then wires the CSS and merges any required deno.json imports." }
  ]
}) }}

```bash
# Add one component (or a named collection) to the dashboard app
netscript ui:add data-table

# Add an AI / workspace primitive — e.g. the chat message renderer
netscript ui:add message

# Add a whole named collection in one call (theme + all its items)
netscript ui:add ai
```

### Available components

Every item below is something you can `ui:add <name>` by its registry id. They fall
into four groups. **Interactive namespaces** ship from the
`@netscript/fresh-ui/interactive` sub-path (stateful, accessible compound
components); the rest are copy-source registry items.

{{ comp.apiTable({
  caption: "Interactive namespaces (@netscript/fresh-ui/interactive)",
  rows: [
    { name: "Accordion", type: "disclosure", desc: "Compound accordion with root + item subcomponents." },
    { name: "Dialog", type: "overlay", desc: "Modal dialog with structural subcomponents." },
    { name: "Drawer", type: "overlay", desc: "Edge-docked drawer with structural subcomponents." },
    { name: "Popover", type: "floating", desc: "Anchored popover with positioning subcomponents." },
    { name: "Sheet", type: "overlay", desc: "Side-docked inspection panel." },
    { name: "Tabs", type: "navigation", desc: "Tabs with list, trigger, and content subcomponents." },
    { name: "Tooltip", type: "floating", desc: "Anchored tooltip with positioning subcomponents." },
    { name: "Combobox", type: "headless L1", desc: "Headless combobox seam (useCombobox + getRootProps/getInputProps/getContentProps/getItemProps) — the keyboard/selection engine behind the command palette and autocomplete inputs." }
  ]
}) }}

{{ comp.apiTable({
  caption: "L0 primitives (@netscript/fresh-ui/primitives)",
  rows: [
    { name: "Show", type: "control flow", desc: "Conditionally renders children without an extra DOM wrapper." },
    { name: "VisuallyHidden", type: "a11y", desc: "Renders content for assistive tech while keeping it visually hidden." },
    { name: "SrOnly", type: "a11y", desc: "Screen-reader-named alias for VisuallyHidden." }
  ]
}) }}

{{ comp.apiTable({
  caption: "AI / workspace primitives (ui:add <name>)",
  rows: [
    { name: "avatar", type: "identity", desc: "Identity chip for a person or agent — initials or image with size, presence, and agent variants." },
    { name: "citation-chip", type: "ai", desc: "Inline per-claim source marker [n] that pairs with a sources list — the grounded-agent citation UX." },
    { name: "code-block", type: "ai", desc: "Fenced code surface with filename/language header and a copy affordance for assistant messages." },
    { name: "model-selector", type: "ai", desc: "Disclosure-backed model/provider picker for the prompt composer (native details)." },
    { name: "tool-call-card", type: "ai", desc: "Inline MCP/tool invocation + result as a native details disclosure with a status badge and IO panel." },
    { name: "chart-block", type: "analytics", desc: "Inline token-driven metric chart — horizontal bars or a vertical column chart with y-axis ticks and data-tone intents." },
    { name: "donut", type: "analytics", desc: "Token-driven donut/pie chart — SVG arc segments with a center total and legend." },
    { name: "prompt-input", type: "ai composer", desc: "Chat composer: auto-grow textarea with a toolbar of research/grounding pills, model picker, attach/screenshot/voice, and send." },
    { name: "message", type: "ai chat", desc: "Chat message with author/time, inline-markup body (bold/code/[n] citations), tool-call + chart/code blocks, follow-up chips, and a typing indicator. Exports renderInline + TypingIndicator." },
    { name: "dropzone", type: "upload", desc: "File-drop affordance — a dashed drop target (label/hint/icon) wrapping a native file input; drag-over via data-active." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Command & search utilities (ui:add <name>)",
  rows: [
    { name: "command-palette", type: "palette", desc: "Modal ⌘K command palette (.ns-cmdk) — the L1 Dialog backdrop/overlay wrapping the L1 Combobox: grouped, searchable commands with icon/hash/kind sub-parts." },
    { name: "search", type: "navigation", desc: "Compact nav search affordance (.ns-search) — a button styled as an input with a ⌘K hint that opens the command palette." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Collections copy a whole set at once" } }}
Named <strong>collections</strong> are also valid <code>ui:add</code> targets. For
example <code>netscript ui:add ai</code> installs the AI surface set (citation-chip,
model-selector, tool-call-card, prompt-input, message, command-palette, search) with
their theme seed in one command; <code>foundation</code> installs the full dashboard
set. See the <a href="/reference/fresh-ui/">reference</a> for the complete item and
collection catalog.
{{ /comp }}

Both commands accept the same useful flags (run `--help` for the version-accurate
list):

- `--project-root <path>` — target a workspace other than the current directory.
- `--theme <name>` — install against a specific theme registry item instead of the
  default official theme.
- `--registry-root <path>` — override the Fresh UI package root (advanced/local
  development).
- `--force` — overwrite existing copied UI files when re-running.

After the copy, the new component is regular source under `components/ui/` (and its
styles under `assets/ui/`). Import it through the `@app/components/ui/mod.ts`
barrel like the rest, then edit it however you like — there is no upstream patch to
keep in sync.

{{ comp callout { type: "important", title: "Copy-source, not a dependency" } }}
This is the deliberate ownership tradeoff: <code>ui:add</code> gives you the code,
so you carry it. When the registry ships an upstream fix you want, re-run
<code>ui:add … --force</code> to re-copy — but expect to re-apply any local edits,
exactly as you would with any vendored source.
{{ /comp }}

## Verify your changes

With the app running, confirm the loop end to end:

1. Watch the Vite dev server (or `aspire start` logs) recompile on save — Fresh hot
   module replacement updates the page without a full reload.
2. Open `/design/components` to see restyled primitives render against the active
   theme, and `/design/tokens` to confirm token edits took effect.
3. Toggle the theme (the `ThemeToggle` in the top bar) to check both light and dark
   look right after token changes.
4. Type-check the app before committing:

```bash
deno task --cwd apps/dashboard check
```

That task runs `deno fmt --check`, `deno lint`, and `deno check` over the app, so a
clean run means your routes, islands, and edited components still type and lint.

{{ comp callout { type: "tip", title: "Type-check is your guardrail" } }}
Because routes, islands, and UI primitives are all app-owned TypeScript, the
<code>check</code> task is the single gate that proves a route rename, a changed
island prop, or an edited primitive still composes. Run it before every commit —
green here means the Fresh build will not break on a missing import or a drifted
type.
{{ /comp }}

## Next steps

- Capability hub: [Fresh UI](/capabilities/fresh-ui/) — the concept, the headline
  API, and the Learn / Do / Reference triplet for the dashboard app.
- Reference: the generated API for the UI registry and the Fresh runtime —
  [`@netscript/fresh-ui`](/reference/fresh-ui/) and
  [`@netscript/fresh`](/reference/fresh/). These are the authority for every export
  (the `/server`, `/query`, and sibling subpaths included); this guide never
  duplicates them.
- Related recipes: [Add a service](/how-to/add-a-service/) to give your UI a typed
  oRPC backend, and [Add OpenTelemetry](/how-to/add-opentelemetry/) to trace it.
- Concepts: the [contracts](/explanation/contracts/) explanation shows how a typed
  contract flows from service to client to island.

{{ comp.nextPrev({ prev: { label: "Add OpenTelemetry", href: "/how-to/add-opentelemetry/" }, next: { label: "Deploy", href: "/how-to/deploy/" } }) }}
