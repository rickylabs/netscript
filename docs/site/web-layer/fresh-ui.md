---
layout: layouts/base.vto
title: Fresh UI & design
templateEngine: [vento, md]
prev: { label: "Telemetry & logging", href: "/observability/telemetry/" }
next: { label: "Authentication", href: "/identity-access/auth/" }
order: 12
---

# Fresh UI & design

This page maps NetScript's web UI layer: the `@netscript/fresh` package, the scaffolded
`apps/dashboard` app built on it, and the `@netscript/fresh-ui` component registry. Use it to decide
where a change belongs and which commands manage the components you own.

The UI layer is copy-source. `netscript ui:add button` copies the component's TypeScript and CSS
into `apps/dashboard/components/ui/`, wired to the design tokens in `assets/tokens.json`. A new
variant is an edit to a file already in your repo, and the `(design)` route group renders it next
to every other primitive with the same tokens.

## Two layers, one design grammar

The package and the app are easy to conflate. `@netscript/fresh` is the reusable package you import
into any Fresh app. `apps/dashboard` is one app that consumes it. On this page, "the dashboard"
means the scaffolded app.

{{ comp.apiTable({
  caption: "The meta-framework vs. the scaffolded app",
  rows: [
    { name: "@netscript/fresh", type: "meta-framework (package)", desc: "A published Deno package: Fresh runtime extensions, the definePage/island builders, a TanStack-Query bridge, forms, defer primitives, a streams client, and route contracts. Reusable across any Fresh app you build. Reference: /reference/fresh/." },
    { name: "apps/dashboard", type: "scaffolded app", desc: "One Fresh 2.x application generated into your repo, built on @netscript/fresh and wired to your users service. A worked showcase to copy patterns from, not a finished product UI." },
    { name: "@netscript/fresh-ui", type: "component registry", desc: "The copy-source component library and design tokens installed into apps/dashboard/components/ui/ by netscript ui:init and ui:add. You own the copied files. Reference: /reference/fresh-ui/." }
  ]
}) }}

## The meta-framework: `@netscript/fresh`

`@netscript/fresh` is a published package (Fresh runtime extensions, builders, forms, defer
primitives, and route contracts for NetScript) built on `@fresh/core` 2.x and Preact. Import the
subpath you need; there is no single barrel. The table maps each subpath, and the
[`@netscript/fresh` reference](/reference/fresh/) holds the generated API.

{{ comp.apiTable({
  caption: "@netscript/fresh subpath exports (the meta-framework surface)",
  rows: [
    { name: "@netscript/fresh/server", type: "bootstrap", desc: "defineFreshApp<State>(...) — the baseline app bootstrap (static files, file-system routes) so every NetScript Fresh app boots identically." },
    { name: "@netscript/fresh/builders", type: "page builder", desc: "The definePage() / route-reference builders that bind a typed route, declare server-loaded layers, and wire telemetry." },
    { name: "@netscript/fresh/route", type: "route contracts", desc: "Route-reference primitives (createRouteReference) for typed, generated route patterns consumed via router.ts." },
    { name: "@netscript/fresh/query", type: "TanStack bridge", desc: "QueryIsland, useQuery, useMutation, useQueryClient — the TanStack-Query hydration bridge over your contract-derived query factories." },
    { name: "@netscript/fresh/form", type: "forms", desc: "Typed form primitives for server-validated, contract-aware form handling." },
    { name: "@netscript/fresh/defer", type: "streaming defer", desc: "Defer primitives for streaming/deferred server rendering of slower layers." },
    { name: "@netscript/fresh/streams", type: "streams client", desc: "The Fresh-side durable-stream client for consuming HTTP/SSE durable streams in the browser (the producer runtime lives in @netscript/plugin-streams-core)." },
    { name: "@netscript/fresh/interactive", type: "interactivity", desc: "Interactive island runtime helpers used by the hydrated client islands." },
    { name: "@netscript/fresh/vite", type: "build", desc: "The Vite integration the dev/build pipeline uses." },
    { name: "@netscript/fresh/testing", type: "testing", desc: "Test helpers for exercising pages, islands, and route contracts." },
    { name: "@netscript/fresh/error", type: "diagnostics", desc: "Typed error/diagnostics surface for the Fresh runtime." }
  ]
}) }}

{{ comp callout { type: "note", title: "Distinct from the back-end stream producer" } }}
The <code>@netscript/fresh/streams</code> client consumes durable streams over HTTP/SSE in the
browser. The producer runtime, which writes stream state, lives server-side in
<code>@netscript/plugin-streams-core</code> (<code>createDurableStream</code>) and runs as an Aspire
service on its assigned port. See <a href="/durable-workflows/streams/">Streams</a> for the
producer/consumer split.
{{ /comp }}

## The scaffolded app: `apps/dashboard`

Every NetScript workspace ships `apps/dashboard`, a [Fresh](https://fresh.deno.dev/) 2.x
application built with Preact, Tailwind CSS v4, and Vite. It is a workspace member in the root
`deno.json`, and Aspire runs it alongside your services. It boots through `defineFreshApp` from
`@netscript/fresh/server`, so every NetScript Fresh app starts the same way. The scaffold wires it to
your oRPC contracts, so it renders typed, server-prefetched data from the same `users` service the
back end implements.

{{ comp.apiTable({
  caption: "apps/dashboard layout from a fresh scaffold",
  rows: [
    { name: "main.ts", type: "entry", desc: "App entry: export const app = defineFreshApp<State>({ name: 'dashboard' }). Reads PORT (assigned per-project at scaffold time) and logs a startup banner." },
    { name: "router.ts", type: "routing", desc: "Stable route entrypoint. Re-exports generated routePatterns + routes and builds typed appRoutes via createRouteReference." },
    { name: "utils.ts", type: "typed wiring", desc: "Exports the createDefine<State>() define helper and the definePage() builder." },
    { name: "routes/", type: "pages", desc: "File-system routes: index.tsx, dashboard.tsx, health.tsx, examples/service/, examples/telemetry/, the (design) system pages, plus _app.tsx (HTML shell) and _layout.tsx (chrome). Groups such as (_components)/, (_shared)/ and (_islands)/ are non-routing co-location folders." },
    { name: "islands/", type: "interactivity", desc: "Client-hydrated Preact islands (e.g. ThemeToggle, SidebarToggle, Toast under islands/ui/)." },
    { name: "components/ui/", type: "design system", desc: "The copy-source component library you own (@netscript/fresh-ui): button, card, data-table, form-field, badge, and more (tsx + matching CSS in assets/ui/). Barrel at components/ui/mod.ts." },
    { name: "lib/", type: "service wiring", desc: "example-service.ts builds a typed oRPC client + query factories from your contract; cn.ts, public-types.ts." },
    { name: "assets/", type: "styling", desc: "design.css, tokens.css/json, theme-bridge.css, and per-component CSS: the Tailwind v4 and design-token layer." },
    { name: "vite.config.ts / deno.json", type: "build + deps", desc: "Vite, Fresh and Tailwind plugins and the @app/* aliases; deno.json pins fresh, preact, @preact/signals, tailwindcss, and the @netscript/fresh* imports." },
    { name: ".generated/", type: "generated", desc: "manifest.ts + routes.ts produced by the Fresh route generator; consume via router.ts, never directly." }
  ]
}) }}

{{ comp callout { type: "note", title: "Two ports, one app" } }}
The app's dev server reads <code>PORT</code> and binds to its assigned port, with health at
<code>/health</code>. The <strong>Aspire dashboard</strong> at
<a href="https://localhost:18888">https://localhost:18888</a> is separate: it orchestrates the whole
resource graph. Start the platform with <code>cd aspire &amp;&amp; aspire start</code> (Postgres,
Redis and every service), or run the app on its own with
<code>deno task --cwd apps/dashboard dev</code>.
{{ /comp }}

## Contract-driven by default

The dashboard has no hand-rolled `fetch` calls. `lib/example-service.ts` turns your
`UsersContractV1` into a typed client and TanStack-Query factories through the NetScript SDK. The
`users` service implements the same contract object, so the UI cannot drift from the API.

```ts
// apps/dashboard/lib/example-service.ts
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { bridgeInvalidation } from '@netscript/sdk/query-client';
import { UsersContractV1 } from '@plugin-smoke/contracts';

export const exampleServiceName = 'users';
export const exampleServiceClient = createServiceClient<typeof UsersContractV1>({
  contract: UsersContractV1,
  serviceName: exampleServiceName,
  routerName: 'users',
});

// queryOptions / mutationOptions derived straight from the contract.
export const exampleServiceQueries = createQueryFactories({
  service: { contract: UsersContractV1, client: exampleServiceClient },
}).service;
```

A route declares itself with `definePage()` from `@netscript/fresh/builders`: it binds a typed route
reference, declares server-loaded layers, and wires telemetry. An island consumes the query
factories through the `@netscript/fresh/query` bridge for hydration, optimistic mutations, and cache
invalidation on the client.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Route — routes/examples/service/index.tsx",
    lang: "tsx",
    code: "// definePage() declares a typed page: route + server-loaded layers + telemetry.\nimport { appRoutes } from '@app/router.ts';\nimport { definePage } from '@app/utils.ts';\nimport { ServiceExampleLabPanel } from './(_components)/lab-panel.tsx';\nimport { loadServiceShowcaseData } from './(_shared)/service-showcase.ts';\n\nexport const serviceExamplePage = definePage()\n  .withRoute(appRoutes.serviceExample)\n  .withPolicy('balanced')\n  .withTelemetry({ enabled: true, spanName: 'scaffold.examples.users' })\n  .withMeta(() => ({ title: 'users example', description: 'Backed by the users service.' }))\n  .withLayer('lab', ServiceExampleLabPanel, { loader: loadServiceShowcaseData })\n  .build();\n\nexport const { default: page } = serviceExamplePage;\nexport { page as default };"
  },
  {
    label: "Island — (_islands)/ServiceShowcaseLab.tsx",
    lang: "tsx",
    code: "// Client-hydrated island: typed query + optimistic mutation over the contract.\nimport { QueryIsland, useMutation, useQuery, useQueryClient } from '@netscript/fresh/query';\nimport { exampleServiceQueries, exampleServiceListInvalidation } from '@app/lib/example-service.ts';\n\nconst Lab = (props: { input: { status?: string } }) => {\n  const queryClient = useQueryClient();\n  const { data, refetch, isRefetching } = useQuery({\n    ...exampleServiceQueries.list.queryOptions(props.input),\n    staleTime: 15_000,\n  });\n  const advance = useMutation({\n    ...exampleServiceQueries.updateStatus.mutationOptions(),\n    onSettled: () => queryClient.invalidateQueries(exampleServiceListInvalidation),\n  });\n  return <button type='button' onClick={() => void refetch()}>{isRefetching ? '…' : 'Refresh'}</button>;\n};\n\nexport default (props: { input: { status?: string } }) => (\n  <QueryIsland><Lab {...props} /></QueryIsland>\n);"
  }
] }) }}

{{ comp callout { type: "important", title: "Islands are the only client code" } }}
Fresh ships no JavaScript by default. Only code under <code>islands/</code> hydrates in the browser;
routes and components render on the server. The <code>users</code> showcase loads its list on the
server and dehydrates the query cache, and the <code>ServiceShowcaseLab</code> island rehydrates it
for refetch and optimistic status updates.
{{ /comp }}

## The design system & owned components

The scaffold installs the Fresh UI foundation (`@netscript/fresh-ui`) into
`apps/dashboard/components/ui/` and its CSS into `assets/ui/`, styled by the design tokens in
`assets/tokens.json` and `tokens.css`. The components are copies in your repo, so you can open and
edit every one of them. The bundled `(design)` route group is a live gallery of tokens, components,
and composition rules, rendered by your own app with your own tokens. Edit a token or a component
and the gallery shows the result across the whole vocabulary.

The registry ships four groups. You install each item by registry id (`ui:add <name>`) or as part
of a named collection. The AI and workspace group is a fixed, token-driven vocabulary for
agent-facing surfaces (message threads, tool-call cards, citations, charts), so an app can map
structured model output onto components in its own design language.

{{ comp.apiTable({
  caption: "What the registry ships",
  rows: [
    { name: "Interactive namespaces", type: "@netscript/fresh-ui/interactive", desc: "Stateful, accessible compound primitives: Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip, and the headless Combobox seam (useCombobox) that powers the command palette and autocompletes." },
    { name: "L0 primitives", type: "@netscript/fresh-ui/primitives", desc: "Small platform-contract helpers: Show (wrapper-free conditional render), VisuallyHidden and its SrOnly alias, and Icon, a stroke-SVG icon primitive also re-exported from the package root." },
    { name: "AI / workspace primitives", type: "ui:add", desc: "The agent-surface set: avatar, citation-chip, code-block, model-selector, tool-call-card, chart-block, donut, prompt-input (auto-grows to fit its content), message (renderInline + TypingIndicator), and dropzone (drag, clipboard-paste, and multi-file ingest), plus the foundation set (button, card, badge, data-table, forms, feedback, dashboard blocks)." },
    { name: "Command & search utilities", type: "ui:add", desc: "command-palette (.ns-cmdk, the ⌘K modal that wraps the Combobox) and search (.ns-search, a compact nav affordance with a ⌘K hint that opens it)." }
  ]
}) }}

Two CLI commands manage the library. Run them from the workspace root:

{{ comp.apiTable({
  caption: "Fresh UI CLI commands",
  rows: [
    { name: "netscript ui:init", type: "install foundation", desc: "Installs the Fresh UI foundation set into an app workspace. The scaffold runs the equivalent for you; run it once when adding UI to an app that lacks it." },
    { name: "netscript ui:add <name>", type: "add an item", desc: "Copies one registry item or a named collection into components/ui/, wires its CSS, and merges any required deno.json imports. Example: netscript ui:add data-table." }
  ]
}) }}

{{ comp callout { type: "note", title: "DataGrid is a runtime export, not a ui:add block" } }}
<code>DataGrid</code> is exported from the <code>@netscript/fresh-ui</code> package root, so you
import it instead of copying it. It takes a typed <code>columns</code>/<code>rows</code> contract,
supports <code>strong</code>/<code>num</code> cell variants, and renders plain, button, or
Fresh-navigation rows. It is the runtime successor to the copy-source <code>data-table</code> block.
Both still ship: use <code>DataGrid</code> for a templated grid you do not need to own. See the
<a href="/reference/fresh-ui/">reference</a> for its API.
{{ /comp }}

{{ comp callout { type: "caution", title: "Re-copying overwrites your edits" } }}
Copied components are yours, so they get no automatic upstream updates. Re-running
<code>ui:add … --force</code> re-copies the source and overwrites your local edits. Keep heavy
customization in your own components. Run <code>netscript ui:add --help</code> for the full options.
{{ /comp }}

## Scope

The dashboard is a working, contract-wired showcase, not a finished product UI. It ships the `users`
example (server-prefetched list and optimistic status mutation), a telemetry example, a CRUD example,
a health page, and the design gallery. Copy these patterns rather than shipping them as features:
build your screens with the same `definePage`, island, and query-factory shape on
`@netscript/fresh`.

## Endpoints & ports

{{ comp.apiTable({
  caption: "Fresh UI runtime surface",
  rows: [
    { name: "Assigned", type: "port", desc: "Dashboard dev server (reads Deno.env.get('PORT')). Standalone: deno task --cwd apps/dashboard dev." },
    { name: "/health", type: "HTTP", desc: "App health route logged at startup (e.g. /health on its assigned port)." },
    { name: ":18888", type: "Aspire", desc: "Aspire dashboard that orchestrates the dashboard alongside services/plugins; token printed by aspire start." },
    { name: "Assigned", type: "upstream", desc: "The users service the dashboard's typed client calls, using the same UsersContractV1." },
    { name: "Assigned", type: "streams", desc: "The durable-streams Aspire service the @netscript/fresh/streams client consumes over HTTP/SSE (producer runtime in @netscript/plugin-streams-core)." }
  ]
}) }}

## Next steps

Install components and edit the tokens with [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).
See also the [`@netscript/fresh` reference](/reference/fresh/), the
[`@netscript/fresh-ui` reference](/reference/fresh-ui/), and the
storefront tutorial chapter [A typed catalog service](/tutorials/storefront/02-catalog-service/).
