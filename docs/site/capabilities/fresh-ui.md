---
layout: layouts/base.vto
title: Fresh UI & design
templateEngine: [vento, md]
prev: { label: "Telemetry & logging", href: "/capabilities/telemetry/" }
next: null
---

# Fresh UI & design

Every NetScript workspace ships a real front end: `apps/dashboard`, a
[Fresh](https://fresh.deno.dev/) 2.x application built with Preact, Tailwind CSS v4, and
Vite. It is not a placeholder — the scaffold wires it directly to your oRPC contracts so
the dashboard renders typed, server-prefetched data from the same `users` service the back
end implements. The UI layer is **copy-source**: the component library lives *inside* your
repo under `apps/dashboard/components/ui/`, so you own and edit it like any other file
rather than upgrading an opaque dependency.

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the dashboard when you need a <strong>typed, server-rendered web UI</strong> over
your services — an internal admin panel, an operations console, or a customer-facing app —
with TanStack-Query islands, an owned component set, and a built-in design system. For the
pure data boundary it renders, see <a href="/capabilities/services/">Services &amp;
contracts</a>; to add or regenerate UI pieces, see
<a href="/how-to/customize-fresh-ui/">Customize the Fresh UI</a>.
{{ /comp }}

## Where it lives

The Fresh app is a workspace member at `apps/dashboard`, registered in the root `deno.json`
and orchestrated by Aspire alongside your services. It boots through
`defineFreshApp` from `@netscript/fresh/server`, which manages the baseline bootstrap
(static files, file-system routes) so every NetScript Fresh app starts the same way.

{{ comp.apiTable({
  caption: "apps/dashboard layout (verbatim from a fresh scaffold)",
  rows: [
    { name: "main.ts", type: "entry", desc: "App entry: export const app = defineFreshApp<State>({ name: 'dashboard' }). Reads PORT (default 8010) and logs a startup banner." },
    { name: "router.ts", type: "routing", desc: "Stable route entrypoint. Re-exports generated routePatterns + routes and builds typed appRoutes via createRouteReference." },
    { name: "routes/", type: "pages", desc: "File-system routes: index.tsx, dashboard.tsx, health.tsx, examples/users/, examples/telemetry/, the (design) system pages, plus _app.tsx / _layout.tsx shells." },
    { name: "islands/", type: "interactivity", desc: "Client-hydrated Preact islands (e.g. ThemeToggle, SidebarToggle, Toast under islands/ui/)." },
    { name: "components/ui/", type: "design system", desc: "The copy-source component library you own: button, card, data-table, form-field, badge, and more (tsx + matching CSS in assets/ui/)." },
    { name: "lib/", type: "service wiring", desc: "example-service.ts builds a typed oRPC client + query factories from your contract; cn.ts, public-types.ts." },
    { name: "assets/", type: "styling", desc: "design.css, tokens.css/json, theme-bridge.css, and per-component CSS — the Tailwind v4 + design-token layer." },
    { name: ".generated/", type: "generated", desc: "manifest.ts + routes.ts produced by the Fresh route generator; consume via router.ts, never directly." }
  ]
}) }}

{{ comp callout { type: "note", title: "Two ports, one app" } }}
The dashboard's own dev server reads <code>PORT</code> and defaults to <strong>8010</strong>
(<code>http://localhost:8010</code>, health at <code>/health</code>). That is distinct from
the <strong>Aspire dashboard</strong> at <a href="http://localhost:18888">http://localhost:18888</a>,
which orchestrates the whole resource graph. Run the app standalone with
<code>deno task --cwd apps/dashboard dev</code>, or let <code>aspire run</code> bring it up
with everything else.
{{ /comp }}

## Contract-driven by default

The dashboard does not hand-roll `fetch` calls. `apps/dashboard/lib/example-service.ts`
imports your `UsersContractV1` and turns it into a typed client and TanStack-Query factories
through the NetScript SDK — the same contract object the `users` service implements, so the
UI cannot drift from the API.

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

A **route** is declared with the `definePage()` builder — it binds a typed route reference,
declares server-loaded layers, and wires telemetry — while an **island** consumes the query
factories above for hydration, optimistic mutations, and cache invalidation on the client.

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
Fresh ships zero JavaScript by default. Anything under <code>islands/</code> is the
<em>only</em> code hydrated in the browser; routes and components render on the server. The
<code>users</code> showcase loads its list on the server, dehydrates the query cache, and the
<code>ServiceShowcaseLab</code> island re-hydrates it for interactive refetch and optimistic
status updates — the contract-to-pixel proof end to end.
{{ /comp }}

## The design system & owned components

The scaffold installs the NetScript Fresh UI foundation into `apps/dashboard/components/ui/`
and its CSS into `assets/ui/`, driven by design tokens in `assets/tokens.json` /
`tokens.css`. Because the components are copied into your repo, editing the UI is editing
your own files — there is no framework component you cannot open. The bundled
`(design)` route group renders a live token, component, and composition gallery so you can
see every primitive in your project.

You manage that library with two CLI commands (run from the workspace root):

{{ comp.apiTable({
  caption: "Fresh UI CLI commands",
  rows: [
    { name: "netscript ui:init", type: "install foundation", desc: "Installs the Fresh UI foundation set into an app workspace. The scaffold runs the equivalent for you; run it once when adding UI to an app that lacks it." },
    { name: "netscript ui:add <name>", type: "add an item", desc: "Copies one registry item or a named collection into components/ui/, wires its CSS, and merges any required deno.json imports. Example: netscript ui:add data-table." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Copy-source ownership tradeoff" } }}
Because <code>ui:add</code> copies code into your repo, you own it: customize freely, but you
do <strong>not</strong> get automatic upstream updates. Re-running <code>ui:add … --force</code>
re-copies the source — and overwrites your local edits — so treat foundation files as yours
and keep heavy customization in your own components. Full options live behind
<code>netscript ui:init --help</code> / <code>netscript ui:add --help</code> and in the
<a href="/reference/fresh-ui/">@netscript/fresh-ui reference</a>.
{{ /comp }}

## Honest scope

The scaffolded dashboard is a working, contract-wired showcase — not a finished product UI.
It ships the `users` example (server-prefetched list + optimistic status mutation), a
telemetry example, a CRUD example, a health page, and the design gallery. Treat these as the
canonical patterns to copy from, not features to ship as-is; build your real screens by
following the same `definePage` + island + query-factory shape.

## Endpoints & ports

{{ comp.apiTable({
  caption: "Fresh UI runtime surface",
  rows: [
    { name: ":8010", type: "port", desc: "Dashboard dev server (Deno.env.get('PORT') || '8010'). Standalone: deno task --cwd apps/dashboard dev." },
    { name: "/health", type: "HTTP", desc: "App health route logged at startup (http://localhost:8010/health)." },
    { name: ":18888", type: "Aspire", desc: "Aspire dashboard that orchestrates the dashboard alongside services/plugins; token printed by aspire run." },
    { name: ":3001", type: "upstream", desc: "The users service the dashboard's typed client calls — same UsersContractV1, no drift." }
  ]
}) }}

## Where to go next

This hub is intentionally thin — the full generated APIs live in the reference. Pick the
lane that matches what you're doing.

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
    body: "The full generated API for the Fresh integration: defineFreshApp, definePage, the query/route builders, and the server runtime.",
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

{{ comp.nextPrev({ prev: { label: "Telemetry & logging", href: "/capabilities/telemetry/" }, next: null }) }}
