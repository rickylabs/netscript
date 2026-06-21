---
layout: layouts/base.vto
title: Fresh UI & design
templateEngine: [vento, md]
prev: { label: "Telemetry & logging", href: "/capabilities/telemetry/" }
next: { label: "Authentication", href: "/capabilities/auth/" }
---

# Fresh UI & design

NetScript gives you a **front end with the same contracts-first rigor as the back end** — and it
does so in two distinct layers that are easy to conflate. There is **`@netscript/fresh`, a real
meta-framework** (a published package of Fresh runtime extensions, route/island builders, a
TanStack-Query bridge, forms, and a streams client), and there is the **scaffolded dashboard app**
(`apps/dashboard`) that the meta-framework *powers*. The package is the reusable engine; the app is
one fully-wired showcase built on top of it. Both ship in every workspace, but they live at
different addresses and you reach for them at different moments.

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for this layer when you need a <strong>typed, server-rendered web UI</strong> over your
services — an internal admin panel, an operations console, or a customer-facing app — that cannot
drift from your oRPC contracts. Use <strong><code>@netscript/fresh</code></strong> (the
meta-framework) to build pages/islands in any Fresh app; use <strong><code>apps/dashboard</code></strong>
(the scaffolded app) as the worked reference to copy patterns from. For the data boundary the UI
renders see <a href="/capabilities/services/">Services &amp; contracts</a>; to add or regenerate UI
pieces see <a href="/how-to/customize-fresh-ui/">Customize the Fresh UI</a>.
{{ /comp }}

## Two layers, one design grammar

{{ comp.apiTable({
  caption: "The meta-framework vs. the scaffolded app",
  rows: [
    { name: "@netscript/fresh", type: "meta-framework (package)", desc: "A published Deno package: Fresh runtime extensions, the definePage/island builders, a TanStack-Query bridge, forms, defer primitives, a streams client, and route contracts. Reusable across any Fresh app you build. Reference: /reference/fresh/." },
    { name: "apps/dashboard", type: "scaffolded app", desc: "One concrete Fresh 2.x application generated into your repo, built ON @netscript/fresh and wired to your users service. The worked showcase you copy patterns from — not a finished product UI." },
    { name: "@netscript/fresh-ui", type: "component registry", desc: "The copy-source component library + design tokens installed into apps/dashboard/components/ui/ via netscript ui:init / ui:add. You own the copied files. Reference: /reference/fresh-ui/." }
  ]
}) }}

{{ comp callout { type: "important", title: "Don't conflate the package with the app" } }}
<code>@netscript/fresh</code> is a <strong>meta-framework you import</strong> — it exposes targeted
subpaths (<code>/server</code>, <code>/builders</code>, <code>/route</code>, <code>/query</code>,
<code>/form</code>, <code>/defer</code>, <code>/streams</code>, <code>/interactive</code>,
<code>/vite</code>, <code>/testing</code>, <code>/error</code>) and can power <em>any</em> Fresh app,
not just the scaffold. <code>apps/dashboard</code> is the <strong>app that consumes it</strong>. When
this page says "the dashboard," it means the scaffolded app; when it says
"<code>@netscript/fresh</code>," it means the reusable engine.
{{ /comp }}

## The meta-framework: `@netscript/fresh`

`@netscript/fresh` is a published package (`Fresh runtime extensions, builders, forms, defer
primitives, and route contracts for NetScript`) built on `@fresh/core` 2.x + Preact. You consume it
through **targeted subpath exports** rather than one fat barrel — import only the surface you need.
The full generated API for every subpath lives at the
[`@netscript/fresh` reference](/reference/fresh/); the table below is the map.

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
The Fresh-side <code>@netscript/fresh/streams</code> client <em>consumes</em> durable streams over
HTTP/SSE in the browser. The <strong>producer</strong> runtime — the thing that writes stream state
— is real and lives server-side in <code>@netscript/plugin-streams-core</code>
(<code>createDurableStream</code>), served as an Aspire service on
<a href="http://localhost:4437">:4437</a>. See <a href="/capabilities/streams/">Streams</a> for the
producer/consumer split.
{{ /comp }}

## The scaffolded app: `apps/dashboard`

Every NetScript workspace ships `apps/dashboard` — a [Fresh](https://fresh.deno.dev/) 2.x
application built with Preact, Tailwind CSS v4, and Vite. It is a workspace member registered in the
root `deno.json` and orchestrated by Aspire alongside your services. It boots through
`defineFreshApp` from `@netscript/fresh/server`, the meta-framework's baseline bootstrap, so every
NetScript Fresh app starts the same way. It is **not a placeholder**: the scaffold wires it directly
to your oRPC contracts so the dashboard renders typed, server-prefetched data from the same `users`
service the back end implements.

{{ comp.apiTable({
  caption: "apps/dashboard layout (verbatim from a fresh scaffold)",
  rows: [
    { name: "main.ts", type: "entry", desc: "App entry: export const app = defineFreshApp<State>({ name: 'dashboard' }). Reads PORT (default 8010) and logs a startup banner." },
    { name: "router.ts", type: "routing", desc: "Stable route entrypoint. Re-exports generated routePatterns + routes and builds typed appRoutes via createRouteReference." },
    { name: "routes/", type: "pages", desc: "File-system routes: index.tsx, dashboard.tsx, health.tsx, examples/users/, examples/telemetry/, the (design) system pages, plus _app.tsx / _layout.tsx shells." },
    { name: "islands/", type: "interactivity", desc: "Client-hydrated Preact islands (e.g. ThemeToggle, SidebarToggle, Toast under islands/ui/)." },
    { name: "components/ui/", type: "design system", desc: "The copy-source component library you own (@netscript/fresh-ui): button, card, data-table, form-field, badge, and more (tsx + matching CSS in assets/ui/)." },
    { name: "lib/", type: "service wiring", desc: "example-service.ts builds a typed oRPC client + query factories from your contract; cn.ts, public-types.ts." },
    { name: "assets/", type: "styling", desc: "design.css, tokens.css/json, theme-bridge.css, and per-component CSS — the Tailwind v4 + design-token layer." },
    { name: ".generated/", type: "generated", desc: "manifest.ts + routes.ts produced by the Fresh route generator; consume via router.ts, never directly." }
  ]
}) }}

{{ comp callout { type: "note", title: "Two ports, one app" } }}
The dashboard's own dev server reads <code>PORT</code> and defaults to <strong>8010</strong>
(<code>http://localhost:8010</code>, health at <code>/health</code>). That is distinct from the
<strong>Aspire dashboard</strong> at <a href="http://localhost:18888">http://localhost:18888</a>,
which orchestrates the whole resource graph. Bring the platform up first with
<code>cd aspire &amp;&amp; aspire run</code> (Postgres/Garnet + every service), or run the app
standalone with <code>deno task --cwd apps/dashboard dev</code>.
{{ /comp }}

## Contract-driven by default

The dashboard does not hand-roll `fetch` calls. `apps/dashboard/lib/example-service.ts` imports your
`UsersContractV1` and turns it into a typed client and TanStack-Query factories through the NetScript
SDK — the same contract object the `users` service implements, so the UI cannot drift from the API.

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

A **route** is declared with the meta-framework's `definePage()` builder (`@netscript/fresh/builders`)
— it binds a typed route reference, declares server-loaded layers, and wires telemetry — while an
**island** consumes the query factories above through the `@netscript/fresh/query` bridge for
hydration, optimistic mutations, and cache invalidation on the client.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Route — routes/examples/users/index.tsx",
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
Fresh ships zero JavaScript by default. Anything under <code>islands/</code> is the <em>only</em>
code hydrated in the browser; routes and components render on the server. The <code>users</code>
showcase loads its list on the server, dehydrates the query cache, and the
<code>ServiceShowcaseLab</code> island re-hydrates it for interactive refetch and optimistic status
updates — the contract-to-pixel proof end to end.
{{ /comp }}

## The design system & owned components

The scaffold installs the NetScript Fresh UI foundation (`@netscript/fresh-ui`) into
`apps/dashboard/components/ui/` and its CSS into `assets/ui/`, driven by design tokens in
`assets/tokens.json` / `tokens.css`. Because the components are copied into your repo, editing the
UI is editing your own files — there is no framework component you cannot open. The bundled
`(design)` route group renders a live token, component, and composition gallery so you can see every
primitive in your project.

You manage that library with two CLI commands (run from the workspace root):

{{ comp.apiTable({
  caption: "Fresh UI CLI commands",
  rows: [
    { name: "netscript ui:init", type: "install foundation", desc: "Installs the Fresh UI foundation set into an app workspace. The scaffold runs the equivalent for you; run it once when adding UI to an app that lacks it." },
    { name: "netscript ui:add <name>", type: "add an item", desc: "Copies one registry item or a named collection into components/ui/, wires its CSS, and merges any required deno.json imports. Example: netscript ui:add data-table." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Copy-source ownership tradeoff" } }}
Because <code>ui:add</code> copies code into your repo, you own it: customize freely, but you do
<strong>not</strong> get automatic upstream updates. Re-running <code>ui:add … --force</code>
re-copies the source — and overwrites your local edits — so treat foundation files as yours and keep
heavy customization in your own components. Full options live behind
<code>netscript ui:init --help</code> / <code>netscript ui:add --help</code> and in the
<a href="/reference/fresh-ui/">@netscript/fresh-ui reference</a>.
{{ /comp }}

## Honest scope

The scaffolded dashboard is a working, contract-wired **showcase** — not a finished product UI. It
ships the `users` example (server-prefetched list + optimistic status mutation), a telemetry
example, a CRUD example, a health page, and the design gallery. Treat these as the canonical patterns
to copy from, not features to ship as-is; build your real screens by following the same
`definePage` + island + query-factory shape against `@netscript/fresh`. The meta-framework is the
durable surface — the app is one application of it.

## Endpoints & ports

{{ comp.apiTable({
  caption: "Fresh UI runtime surface",
  rows: [
    { name: ":8010", type: "port", desc: "Dashboard dev server (Deno.env.get('PORT') || '8010'). Standalone: deno task --cwd apps/dashboard dev." },
    { name: "/health", type: "HTTP", desc: "App health route logged at startup (http://localhost:8010/health)." },
    { name: ":18888", type: "Aspire", desc: "Aspire dashboard that orchestrates the dashboard alongside services/plugins; token printed by aspire run." },
    { name: ":3001", type: "upstream", desc: "The users service the dashboard's typed client calls — same UsersContractV1, no drift." },
    { name: ":4437", type: "streams", desc: "The durable-streams Aspire service the @netscript/fresh/streams client consumes over HTTP/SSE (producer runtime in @netscript/plugin-streams-core)." }
  ]
}) }}

## Where to go next

This hub is intentionally thin — the full generated APIs live in the reference. Pick the lane that
matches what you're doing.

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Build a service",
    body: "Guided tutorial: contract → users service on :3001 → typed client → the island that renders it in the dashboard.",
    href: "/tutorials/build-a-service/",
    icon: "→"
  },
  {
    title: "Do — Customize the Fresh UI",
    body: "Task recipe: ui:init / ui:add, the copy-source ownership model, and editing the design tokens.",
    href: "/how-to/customize-fresh-ui/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/fresh reference",
    body: "The meta-framework's full generated API: defineFreshApp, definePage, the query/route/form/defer/streams builders, and the server runtime.",
    href: "/reference/fresh/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/fresh-ui reference",
    body: "The component registry, foundation set, design tokens, and the ui:init / ui:add surface.",
    href: "/reference/fresh-ui/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Telemetry & logging", href: "/capabilities/telemetry/" }, next: { label: "Authentication", href: "/capabilities/auth/" } }) }}
