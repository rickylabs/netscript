---
layout: layouts/base.vto
title: Customize Fresh UI
description: Edit a route, add an island, restyle a component, and install more UI primitives in the scaffolded app.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/customize-fresh-ui/
---

# Customize Fresh UI

This recipe makes the scaffolded frontend yours: edit a route, add an island, restyle components,
and install more UI from the registry. NetScript scaffolds a [Fresh](https://fresh.deno.dev) 2
application at `apps/dashboard/`, built on the [`@netscript/fresh`](/reference/fresh/)
meta-framework, and its UI components live in your repository as copied source.
[Fresh UI & design](/web-layer/fresh-ui/) explains that model. To change the look of the whole app,
or to see how a new page gets the app chrome, read [Theme your app](/web-layer/how-to/theme-your-app/).

## Prerequisites

You need:

- A NetScript workspace with the scaffolded `apps/dashboard/` Fresh app. To create one, run
  `netscript init` as shown in the [Quickstart](/quickstart/) or the
  [Storefront tutorial](/tutorials/storefront/).
- The `netscript` command on your path. Run `netscript --help` to confirm, and
  `netscript ui:init --help` / `netscript ui:add --help` for the exact option spelling in your
  installed version. If `netscript` is not found, install it with
  `deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}`.

Run the app while you work so you see each change. Aspire starts your database (the engine chosen
with `--db` at scaffold time), Redis, and the dashboard. The Fresh app on its own is enough for the
UI loop:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Under Aspire (recommended)",
    lang: "bash",
    code: "# Brings up Postgres + Redis AND the dashboard; Aspire dashboard graph at the URL Aspire prints\ncd aspire && aspire start"
  },
  {
    label: "Fresh app only",
    lang: "bash",
    code: "# Leaner single-process loop — Vite dev server with HMR\ndeno task --cwd apps/dashboard dev"
  }
] }) }}

{{ comp callout { type: "tip", title: "Start at /design" } }}
Open the scaffolded <code>/design</code> showcase in the running app before you change anything. It
renders the component gallery (<code>/design/components</code>), the token reference
(<code>/design/tokens</code>), and the composition rules (<code>/design/composition</code>) from your
app's own copies, against the active theme.
{{ /comp }}

## Where the app lives

Everything for the frontend is under `apps/dashboard/`, laid out by Fresh 2 file-system routing.
[The scaffolded app](/web-layer/fresh-ui/#the-scaffolded-app-appsdashboard) maps each path. Import
UI from your own `@app/components/ui/mod.ts` barrel, not from the `@netscript/fresh-ui` registry
package; import the runtime from `@netscript/fresh` directly.

The app entry is one `defineFreshApp` call, which keeps the static-file and file-system-route
bootstrap framework-managed:

{{ comp.codeBlock({ filename: "apps/dashboard/main.ts", lang: "ts", code: "import { defineFreshApp } from '@netscript/fresh/server';\nimport type { State } from '@app/utils.ts';\n\nexport const app = defineFreshApp<State>({ name: 'dashboard' });" }) }}

Aspire assigns the app's port when it starts it. Open the URL that `aspire start` prints, or the
address in the dev server's startup banner, instead of pinning a port in your code.

## Edit a route

Create a typed page with `netscript ui:add page status --route status --island`. It writes
`routes/status/index.tsx` with `definePage()`; `--island` also creates colocated `(_islands)/` and
`(_shared)/query-loaders.ts` seams. The Vite route generator picks the page up on the next build.

Routes are `.tsx` files under `routes/`. A page uses the `definePage()` builder from `@app/utils.ts`
to declare its route, metadata, and view in one typed chain. To change the home page, edit
`routes/(_components)/home-view.tsx` (the view) or `routes/index.tsx` (the page declaration and its
data):

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

The HTML shell (`<html>`, `<head>`, fonts, the theme-seed script) is `routes/_app.tsx`. The top bar
and navigation around content pages is `routes/_layout.tsx`, and its links come from `navigation.ts`.
Both use the `define.page(...)` / `define.layout(...)` helpers from `createDefine<State>()`. Edit
them to change the global frame instead of repeating markup per page. [Theme your
app](/web-layer/how-to/theme-your-app/#add-a-page-that-inherits-the-chrome-and-theme) covers the
navigation flags of `ui:add page`.

{{ comp callout { type: "tip", title: "Co-location folders don't become URLs" } }}
Folders in parentheses, such as <code>(_components)</code>, <code>(_shared)</code>,
<code>(_islands)</code> and <code>(design)</code>, are Fresh <strong>route groups</strong>. They keep
a page's view, loader, and islands beside the route file without adding a path segment.
{{ /comp }}

{{ comp callout { type: "tip", title: "Add typed route references in router.ts" } }}
Register a permanent page in <code>apps/dashboard/router.ts</code> so <code>appRoutes</code> exposes a
typed <code>.href()</code> for it. The CLI registers a string-literal pattern in
<code>appRoutes</code>, and moving a route directory does not update that pattern. Reconcile
<code>router.ts</code> and its consumers with the
<a href="/web-layer/route/#renaming-or-moving-a-route">rename/move checklist</a>.
{{ /comp }}

## Add interactivity with an island

Generate a signals island with `netscript ui:add island Counter`. Add `--query` for a `QueryIsland`
provider wired to `@netscript/fresh/query`, then import the island from the route where it should
hydrate.

Server-rendered routes ship no client JavaScript. When you need browser state (a toggle, a form, a
live panel), add an island under `islands/`: islands are the only components Fresh hydrates on the
client. The scaffold's `ThemeToggle`, `SidebarToggle`, and `Toast` under `islands/ui/` are working
examples that use Preact signals:

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

Keep islands small and leaf-shaped. Pass plain serializable props, because the island boundary is
the hydration boundary. Declare event handlers with arrow functions, as the scaffolded `ThemeToggle`
does. A component that needs no browser state stays in `components/` and ships no JavaScript.

When an island or route needs server data, use the typed query layer in `@netscript/fresh/query`
instead of hand-rolled `fetch` calls. It carries the oRPC contract types to the client, so a renamed
service field becomes a type error. See the [`@netscript/fresh` reference](/reference/fresh/) for the
query builders and [Add a service](/services-sdk/how-to/add-a-service/) for the backend half of the
contract.

## Restyle: tokens, Tailwind, and component CSS

Styling has three layers. Pick the lightest one that does the job:

| Layer | Use it when | How |
| --- | --- | --- |
| Design tokens | The change should re-theme the whole app. | Switch the preset with `netscript ui:apply --preset <id>`, or alias semantic roles in `tokens/semantic.tokens.json` and run `netscript tokens build`. [Theme your app](/web-layer/how-to/theme-your-app/) covers both. |
| Tailwind utilities | One element needs its own layout or spacing. | Tailwind v4 is wired through Vite (`@tailwindcss/vite`). Use utility classes in JSX. The scaffold also defines layout helpers (`ns-shell`, `ns-section`, `ns-stack`, `ns-cluster`) in `assets/layouts.css`. |
| Component CSS | One primitive should look different everywhere. | Each copied primitive has its own stylesheet under `assets/ui/` (`button.css`, `card.css`, `badge.css`, …), imported by `assets/styles.css`. Edit that file. |

The generated token files (`assets/tokens.css`, `theme-bridge.css`, `tokens.json`, `fonts.json`, and
`theme-preset.json`) are replaced on every build, so never hand-edit them.

> [!WARNING]
> **Edit tokens, not magic numbers**
>
> Use a raw hex color or pixel value only when no token fits. Hard-coded values drift from the
> theme and break the light/dark switch, while one token edit re-themes every surface.

## Install more UI from the registry

When you need a primitive the scaffold did not copy in, add it from the `@netscript/fresh-ui`
registry. `ui:add` copies source files into your app: components to
`apps/dashboard/components/ui/`, islands to `islands/ui/`, helpers to `lib/`, and assets to
`assets/ui/`. It then wires the CSS and merges any required `deno.json` imports.

```bash
# Add one component (or a named collection) to the dashboard app
netscript ui:add dropzone

# Add an AI / workspace primitive — e.g. the chat message renderer
netscript ui:add message

# Add a whole named collection in one call (theme + all its items)
netscript ui:add ai
```

Named collections are valid `ui:add` targets: `ai` installs the AI surface set (citation-chip,
model-selector, tool-call-card, prompt-input, message, command-palette, search) with its theme
seed, and `foundation` installs the full dashboard set.
[What the registry ships](/web-layer/fresh-ui/#the-design-system-owned-components) lists the
groups, and the [`@netscript/fresh-ui` reference](/reference/fresh-ui/) has the full item and
collection catalog.

`ui:init` and `ui:add` share these flags (run `--help` for the list in your version):

- `--project-root <path>`: target a workspace other than the current directory.
- `--theme <name>`: install against a specific theme registry item instead of the default official
  theme. To change the preset of an existing app, use
  [`netscript ui:apply --preset <id>`](/web-layer/how-to/theme-your-app/#pick-a-preset) instead.
- `--registry-root <path>`: override the Fresh UI package root (advanced or local development).
- `--force`: overwrite existing copied UI files when re-running. This replaces your local edits to
  those files.

The new component is ordinary source under `components/ui/`, with its styles under `assets/ui/`.
Import it through the `@app/components/ui/mod.ts` barrel and edit it as you like.

## Verify your changes

With the app running:

1. Save a file and watch the Vite dev server (or the `aspire start` logs) recompile. Fresh hot
   module replacement updates the page without a full reload.
2. Open `/design/components` to see restyled primitives against the active theme, and
   `/design/tokens` to confirm token edits.
3. Toggle the theme with `ThemeToggle` in the top bar and check both light and dark.
4. Type-check the app before committing:

   ```bash
   deno task --cwd apps/dashboard check
   ```

   The task runs `deno fmt --check`, `deno lint`, and `deno check` over the app.

> [!NOTE]
> A green type-check does not prove that `router.ts` string literals match the filesystem. After a
> route move, refresh the generated route modules first, then check navigation and the new URL in
> the app.

## Next steps

Change the look of the whole app in [Theme your app](/web-layer/how-to/theme-your-app/). Give the UI
a typed backend with [Add a service](/services-sdk/how-to/add-a-service/). See also
[Fresh UI & design](/web-layer/fresh-ui/), the [`@netscript/fresh-ui` reference](/reference/fresh-ui/),
and the [contracts explanation](/explanation/contracts/).
