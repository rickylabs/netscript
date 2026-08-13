# P1 — App Shell, Information Architecture & Home

**Revamp the existing NetScript Dev Dashboard prototype using the published "NS One" design
system (the `ns-*` component library).** The dashboard is the DX console for the NetScript
framework — a satellite that orbits the .NET Aspire dashboard (infra/telemetry) and Scalar
(API reference); it renders and controls only what the framework uniquely knows. This prompt
rebuilds the SHELL: routing, sidebar, breadcrumbs, command palette, and the Home screen. Later
prompts fill the sections; design the frame so they plug in without rework.

**This design shows the FINAL product.** No "coming soon", no version-gated copy, no preview
badges, no roadmap prose anywhere — every affordance renders fully implemented and operable.
Remove the beta version string from the footer (footer shows the app name + workspace identity
only).

## The locked route tree (non-negotiable)

Replace the current flat 15-route hash router with real, hierarchical, addressable URLs.
Path params = entity identity; query params = filters/tabs/view state; nothing selectable is
in-memory-only. The full tree (groups are sidebar sections, not URL segments):

```
/                                        Home
Overview:      /config · /config/nodes/:nodeId
               /runtime · /runtime/overrides/:key · /runtime/versions/:version
               /catalog (?tab=procedures|routes) · /catalog/procedures/:procedureId
               /flow · /flow/:correlationId           ★ correlation journey
               /runs (?kind&status&page&sort) · /runs/:correlationId (?view=all|compact|json)
Capabilities:  /plugins · /plugins/:pluginId (?tab=overview|axes|doctor|config)
               /workers · /workers/jobs · /workers/jobs/:jobId · /workers/jobs/:jobId/executions/:executionId
               /workers/tasks (?runtime=deno|python|shell|powershell|dotnet) · /workers/tasks/:taskId · …/executions/:executionId
               /sagas (?status) · /sagas/:sagaName · /sagas/:sagaName/:correlationId (?tab=history|executions|payload)
               /triggers (?type&status) · /triggers/:triggerId (?tab=events|schedule|config) · /triggers/:triggerId/events/:eventId
               /streams · /streams/:streamId (?tab=deliveries|subscribers|wiring) · /streams/:streamId/subscribers/:subscriberId
               /ai (?tab=activity|tools) · /ai/runs/:runId
Data:          /migrations (?status) · /migrations/:migrationId
               /dlq (?tab=queue|trigger&backend) · /dlq/:queueId (?selected=…) · /dlq/:queueId/messages/:messageId
               /auth (?provider&state) · /auth/sessions/:sessionId
System:        /extensions (?tab=panels|actions|available) · /extensions/:extensionId
```

Design the URL bar as part of the product: show realistic URLs in every screen mock so the
addressability is visible (e.g. `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ?tab=history`).

## Chrome

- **Sidebar** (`sidebar-shell`): four labeled groups — **Overview / Capabilities / Data /
  System**. This rename is NOT cosmetic: the current sidebar has two near-identical adjacent
  group labels (`Console` / `Consoles`) — an active scannability defect; do not reintroduce any
  "Console"-style prefix — exactly the items and order in the tree above. Active state by URL prefix (deep
  pages keep their section lit). Each item carries a small derived-stat badge, warning-toned
  only when non-zero: Config = unwired nodes; Runtime = disabled overrides; Catalog = unbound
  routes; Live Flow + Run Inspector + Workers + AI = running counts (primary tone); Sagas =
  compensating; Triggers = failed; Streams = failed deliveries; Migrations = pending; DLQ =
  total depth; Auth = active sessions (muted); Extensions = contributed-panel count (muted).
  Collapsible to icon rail; mobile drawer.
- **Topbar:** breadcrumb derived purely from the pathname with entity ids resolved to display
  names — NO constant synthetic prefix crumb (the current fixed `Console /` root is a defect);
  the first crumb is Home (`/`) or the route-group label, nothing else (`Workers / Jobs / reserve-inventory / Execution exec_88f`); environment pill
  `local · my-app · aspire` with status dot; global search button opening the ⌘K palette;
  theme toggle; a prominent "Open Aspire Dashboard ↗" affordance.
- **⌘K command palette** (`command-palette`): three sections — **Navigate** (fuzzy over every
  route incl. entity names: typing "reserve" surfaces the job), **Act** (mutations from
  anywhere: "Run job reserve-inventory…", "Add plugin…", "Apply pending migration…", each
  opening its confirm dialog with the exact CLI line), **Recent** (last visited entities).
  Actions contributed by plugins carry a small provenance chip naming the contributing plugin.
- **Live status:** a subtle SSE liveness dot in the topbar; every live surface uses
  snapshot + revalidate, with a "N new" catch-up pill when following is paused.

## Home `/` — "is my app wired the way I declared it, and what just happened"

Keep the current Home's strengths (see the project's existing screens): the AI incident
summary, KPI sparkline row, outcome split bar, six deep-linking stat cards, "just happened"
strip, and the contributed-panels table. Redesign for the new IA:

- **AI incident narrative** (top): one synthesized paragraph joining today's warnings into a
  causal story, with action chips that deep-link to entity URLs (`Open the failing run` →
  `/runs/ch_3QK9dR2eZ`; `Review override v43` → `/runtime/versions/v43`) and an "Ask about
  your app" affordance (see the AI prompt for behavior). Show grounding: which live registry
  calls the summary used, and its timestamp.
- **KPI row** (`ns-kpi`): executions/hr, trigger firings/hr, override changes, saga success —
  each clicks through to its console with the matching filter in the URL.
- **Six wiring facts** (`ns-statlink`): plugins loaded → `/plugins`; doctor warnings →
  `/plugins?tab=doctor`; unbound routes → `/catalog?tab=routes`; disabled overrides →
  `/runtime?scope=jobs`; pending migrations → `/migrations?status=pending`; scheduler drift →
  `/workers/jobs/nightly-reconcile`. Numbers must reconcile with the owning screens.
- **Just-happened strip:** 3–5 cross-capability events, each deep-linking to the entity URL,
  never an owned feed.
- **Contributed panels row:** the proof the dashboard is itself a plugin — each contributed
  panel names its plugin, mount target, and links to `/extensions/:extensionId`.
- **Provenance/freshness footer per data block:** "derived from live registry · 14:02:31 ·
  snapshot+live" — density with trust.

**Canonical fixture** (all numbers coherent): degraded scenario — 1 doctor warning (triggers
DLQ), 2 unbound routes, 1 pending migration, 1 scheduler drift explained by override v43, the
Stripe→PaymentWebhookSaga→reserve-inventory→payment-events incident with correlation id
`ch_3QK9dR2eZ` threading every deep link.

**States:** loading (skeleton grid), healthy (calm all-success), degraded (the designed
default), error (config unresolvable → alert spanning the grid). Dark mode variant.

**Reach for:** `sidebar-shell`, `command-palette`, `breadcrumb`, `ns-envbar`, `ns-statlink`,
`ns-kpi`, `stats-grid`, `ns-activity-feed`, `badge`, `theme-toggle`, `ns-livedot`.

**Market bar to beat:** the reference dev consoles (Temporal, Inngest, Appwrite, Supabase
Studio, the new React-based Aspire dashboard) all ship hierarchical, addressable navigation
with persistent list→detail chrome; none of them derive their sidebar badges from live
framework facts or open a causal journey from the home page. Match their navigation ergonomics
exactly (URL-first, Back/Forward-safe, shareable everything), then beat them on wiring-truth
density and the correlation spine.

**Non-goals:** no logs, traces, metrics charts, or resource start/stop on any shell surface —
out-links to Aspire only. No marketing hero sections; this is a dense operator console.

**Theme:** NS One tokens only (`--ns-*`), warm-cream light default + dark via
`[data-theme='dark']`, mono for ids/paths, hard-offset press shadows, reduced-motion
fallbacks for every pulse/slide.
