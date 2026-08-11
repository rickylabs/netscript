# market:aspire-scalar — boundary teardown of the Aspire Dashboard and Scalar

Baseline: `main` @ `2256a67bf`, worktree `/home/codex/repos/ns-rfc-devtools-contribution`.
Read-only pass. Upstream evidence is either a raw source file saved under
`.llm/runs/plan-devtools-contribution--seed/research/sources/` or a quoted tool command.

## Summary

The Aspire dashboard is a **fixed, non-extensible Blazor app with a small, fully enumerable route
table**. Its pages are `/` (Resources), `/consolelogs`, `/structuredlogs`, `/traces`,
`/traces/detail/{traceId}`, `/metrics`, `/login` — each with a documented `resourceName` route
segment and a documented set of query parameters
(`sources/aspire-dashboard/{Resources,ConsoleLogs,StructuredLogs,Traces,TraceDetail,Metrics}.razor`).
Deep-linking into it is therefore **real and cheap** for resource-, trace-, span- and metric-scoped
views: `/{page}/resource/{name}`, `/traces/detail/{traceId}?spanId=…`,
`/structuredlogs?traceId=…&spanId=…&logLevel=…`. The one deep-link that is **not** externally
constructible in a stable way is a *filtered* log/trace view: `filters` is an opaque serialized
string owned by the dashboard (`StructuredLogs.razor.cs:118`, `Traces.razor.cs:105`).

Nothing can be contributed **into** the dashboard UI as a panel, page, or plugin. The only
contribution surfaces are model-level: custom **resource commands** (buttons on a resource, with
`iconName`, `updateState`, `executeCommand`) and resource **endpoints/URLs**, both declared in the
AppHost — and custom commands are explicitly local-dashboard-only
(`sources/aspire-dashboard/doc-custom-resource-commands.md:142-144`, and its `Caution` block). The
dashboard's own UI knobs are subtractive (`Dashboard:UI:DisableResourceGraph`, `DisableImport`,
`DisableAgentHelp`) — there is no additive UI extension point
(`mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference`, "Other" table).

Auth is a hard constraint on any embedding: the frontend defaults to `BrowserToken`, redeemed via
`https://localhost:1234/login?t=TheToken`, which sets a cookie; the **Telemetry HTTP API**
(`/api/telemetry/*`) is enabled by default and secured by an **auto-generated** API key
(`Dashboard:Api:AuthMode=ApiKey`). That API is exactly the surface NetScript's
`@netscript/telemetry` adapter already wraps (`packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:48,146`).

Scalar owns API-reference rendering, schema display, and try-it. It has a **rich** deep-link scheme
(`#tag/{tag}/{operation-slug}`, `#model/{name}`, `#webhook/{name}`, `#description/{heading}`) and,
unusually for an upstream, a real **plugin system** (`plugins`, `pluginUrls`, extension components,
`onInit`/`onConfigChange`/`onDestroy` hooks). NetScript, however, has **thrown all of that away**:
`createScalarDocs` emits a hardcoded HTML string with a fixed config
(`url`, `theme`, `layout: 'modern'`, `darkMode: true`) and `ScalarDocsOptions` exposes only
`specUrl`, `title`, `theme` (`packages/service/src/primitives/openapi.ts:48-55, 108-140`). The
bundled Scalar is pinned to `@scalar/api-reference@1.44.15`
(`packages/service/src/primitives/scalar.generated.ts:5`), which contains `generateOperationSlug`,
`pathRouting` and `onSidebarClick` but **not** `pluginUrls` — so the JSON-serializable plugin path
is unavailable at the pinned version without a bundle bump.

## Findings

### Aspire dashboard — what it owns

1. **The dashboard's complete page set is seven routes.** `@page` directives:
   `/login`, `/` (Resources), `/consolelogs` + `/consolelogs/resource/{resourceName}`,
   `/structuredlogs` + `/structuredlogs/resource/{resourceName}`, `/traces` +
   `/traces/resource/{resourceName}`, `/traces/detail/{traceId}`, `/metrics` +
   `/metrics/resource/{resourceName}` + `/metrics/resource/{resourceName}/meter/{meterName}` +
   `/metrics/resource/{resourceName}/meter/{meterName}/instrument/{instrumentName}`
   (`sources/aspire-dashboard/*.razor`, line 1-3 of each file; verified by
   `grep -H "^@page" *.razor`). *observed*
2. **Displayed surface per page.** Resources: columns *Type, Name, State, Start time, Source,
   Endpoints, Logs, Actions*; actions *Stop/Start, Restart, Console logs, View details, Structured
   logs, Traces, Metrics*. Console logs: stdout text, severity colouring, download. Structured logs:
   *Resource, Level, Timestamp, Message, Trace, Details* + advanced filter dialog. Traces:
   *Timestamp, Name, Spans, Duration* + span detail with event timings. Metrics: chart/table view,
   duration + filters. Settings dialog offers Light/Dark/System theme and language only
   (WebFetch `https://aspire.dev/dashboard/explore/`). *observed (fetched doc)*
3. **Resource state includes health.** The Resources page shows resource state with error-count
   badges (same fetched doc). Health *specification* is a NetScript-side generated artifact
   (`packages/aspire/src/domain/health-check-spec.ts:1-11`, per the r5 corpus) but health
   *display* is the dashboard's. *observed*
4. **Process lifecycle (start/stop/restart) is dashboard/AppHost territory**, exposed as resource
   actions in the UI (fetched `explore` doc) and as `ExecuteCommandContext`/`ExecuteCommandResult`
   callbacks in the app model (`sources/aspire-dashboard/doc-custom-resource-commands.md:49-51,
   96-97, 109`). *observed*
5. **Telemetry is memory-bounded and lossy by design.** `MaxLogCount` 10,000 and `MaxTraceCount`
   10,000 are *shared across resources*; `MaxMetricsCount` 50,000 is per-resource; oldest data is
   evicted (`mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference`, "Telemetry
   limits"). Any DevTools claim of durable history cannot be satisfied by the dashboard store.
   *observed*

### Aspire dashboard — deep links

6. **Resource-scoped deep links exist for every telemetry page.** `/consolelogs/resource/{name}`,
   `/structuredlogs/resource/{name}`, `/traces/resource/{name}`, `/metrics/resource/{name}`
   (`sources/aspire-dashboard/ConsoleLogs.razor:2`, `StructuredLogs.razor`, `Traces.razor`,
   `Metrics.razor` `@page` lines). *observed*
7. **Trace and span deep links exist.** `/traces/detail/{traceId}` with route parameter `TraceId`
   and query parameter `SpanId` (`sources/aspire-dashboard/TraceDetail.razor.cs:53-58`). *observed*
8. **Log ↔ trace correlation deep links exist.** StructuredLogs accepts query parameters `traceId`,
   `spanId`, `logLevel`, `logEntryId` (`sources/aspire-dashboard/StructuredLogs.razor.cs:104-121`).
   This is the single most valuable link for a DevTools "journey → logs" jump. *observed*
9. **The Resources page accepts `?resource={name}&view=…&showHiddenResources=…` plus
   `hiddenTypes`/`hiddenStates`/`hiddenHealthStates`** (`sources/aspire-dashboard/Resources.razor.cs:78-104`).
   A DevTools row can link to a specific resource's detail panel. *observed*
10. **Metric deep links go three levels deep**:
    `/metrics/resource/{r}/meter/{m}/instrument/{i}` plus `?duration=` and `?view=`
    (`sources/aspire-dashboard/Metrics.razor:1-4`, `Metrics.razor.cs:41-53`). *observed*
11. **Filtered log/trace views are NOT externally constructible.** Both pages take
    `?filters=<SerializedFilters>` (`StructuredLogs.razor.cs:117-119`, `Traces.razor.cs:104-105`)
    but the serialization format is internal; the formatter file is not at
    `src/Aspire.Dashboard/Utils/TelemetryFilterFormatter.cs`
    (`curl … -w "%{http_code}"` → `404`, and `gh api repos/dotnet/aspire/contents/src/Aspire.Dashboard/Utils`
    lists no such file). Treat filter deep-links as **unavailable**; use the typed route/query
    parameters instead. *observed (negative)*
12. **`Dashboard:Frontend:PublicUrl` is the correct base for constructed links** — "The public URL
    is used when constructing links to the dashboard frontend… important when the dashboard is
    accessed through a proxy" (`mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference`,
    Frontend table). A DevTools deep-link helper must take a configurable base, not assume
    `http://localhost:18888`. *observed*

### Aspire dashboard — extensibility limits

13. **Custom resource commands are the only additive UI contribution.** `withCommand`/`WithCommand`
    with `executeCommand`, `updateState`, `iconName`; "The name of the icon to display in the
    dashboard" (`sources/aspire-dashboard/doc-custom-resource-commands.md:142-144`, examples at
    :35-36, :109-127). *observed*
14. **Custom commands do not survive deployment.** "These Aspire dashboard commands are only
    available when running the dashboard locally. They're not available when running the dashboard
    in Azure Container Apps" (`sources/aspire-dashboard/doc-custom-resource-commands.md`, Caution
    block near the top). *observed*
15. **There is no page/panel/plugin extension point.** The dashboard's own UI configuration is
    purely subtractive: `Dashboard:UI:DisableResourceGraph`, `Dashboard:UI:DisableImport`,
    `Dashboard:UI:DisableAgentHelp`; and the in-dashboard Copilot UI was *removed* in Aspire 13.3
    with agents redirected to the CLI/MCP server
    (`mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference`, "Other" table). The
    trajectory is: dashboard = fixed viewer, agent/tool integration = external API. *observed*
16. **Localisation and theme are user settings, not host-configurable branding** (fetched
    `https://aspire.dev/dashboard/explore/`, Settings dialog). No white-labelling hook. *observed*

### Aspire dashboard — auth / exposure

17. **Frontend auth defaults to `BrowserToken`; the token can be passed in the query string**:
    "The token can either be entered in the UI or provided as a query string value to the login
    page. For example, `https://localhost:1234/login?t=TheToken`"
    (`mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference`, Frontend section). The
    login page itself only declares a `ReturnUrl` query parameter in Blazor
    (`sources/aspire-dashboard/Login.razor.cs:37-38`); `t` is consumed by the auth middleware, and
    validation goes through a JS `validateToken` call that sets the cookie (`Login.razor.cs:85-88`).
    *observed*
18. **`Dashboard:Frontend:BrowserToken` exists specifically so tooling can automate login**:
    "Tooling that wants to automate logging in with browser token authentication can specify a token
    and open a browser with the token in the query string." This is the sanctioned mechanism for a
    NetScript DevTools deep link that lands the user *logged in*. *observed*
19. **Default endpoints**: frontend `http://localhost:18888`, OTLP/gRPC `http://localhost:18889`,
    OTLP/HTTP `http://localhost:18890`; `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false` by
    default (same config-reference "Common configuration" table). *observed*
20. **A Telemetry HTTP API exists upstream and is on by default.** "The API section configures the
    dashboard's Telemetry HTTP API (`/api/telemetry/*`) endpoints. The API is enabled by default and
    secured with API key authentication. The API key is auto-generated if one isn't provided."
    (config reference, "API" table). NetScript's adapter targets exactly this path
    (`packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:48,146`). *observed*
21. **Browser-origin telemetry needs CORS opt-in** (`Dashboard:Otlp:Cors:AllowedOrigins`,
    `DASHBOARD__OTLP__CORS__ALLOWEDORIGINS`; only `POST` is supported, allowed-methods is not
    configurable) — config reference "OTLP CORS". A browser DevTools page calling the dashboard
    cross-origin is a configuration story, not a free capability. *inference from the CORS table:
    the doc scopes CORS to telemetry ingest; whether `/api/telemetry/*` reads honour the same CORS
    config is **unverified** — verify by reading `Dashboard:Otlp:Cors` wiring in
    `src/Aspire.Dashboard/DashboardWebApplication.cs`.*
22. **Local vs deployed differ materially.** AppHost-launched dashboards are "secure by default"
    (HTTPS + browser token + API key); standalone mode is "a mix of secure and unsecured settings"
    and its OTLP endpoint is unsecured by default (WebFetch
    `https://aspire.dev/dashboard/security-considerations/`). Combined with finding 14, the deployed
    story loses custom commands entirely. *observed*

### Scalar — what it owns and how it is mounted here

23. **NetScript mounts Scalar at a fixed `/api/docs`, fed by `/api/openapi.json`.**
    `installDeferredRoutes()` registers `/api/docs/scalar.js` then `/api/docs`
    (`packages/service/src/builder/service-builder-impl.ts:468-486`). *observed*
24. **The mount is a hardcoded HTML template with a frozen config.** `createScalarDocs` emits
    `Scalar.createApiReference('#app', { url, theme, layout: 'modern', darkMode: true })`
    (`packages/service/src/primitives/openapi.ts:108-140`). Defaults:
    `DEFAULT_SCALAR_TITLE='API Documentation'`, `DEFAULT_SCALAR_THEME='kepler'`
    (`openapi.ts:27-28`). *observed*
25. **`ScalarDocsOptions` is three fields wide** — `specUrl`, `title?`, `theme?` restricted to
    `'default' | 'kepler' | 'moon' | 'purple' | 'saturn'`
    (`packages/service/src/primitives/openapi.ts:48-55`). Scalar itself accepts twelve themes:
    *alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace,
    laserwave, none* (`sources/scalar/configuration.md:1108-1120`). NetScript's type is a strict
    subset — a narrowing with no recorded rationale. *observed*
26. **Scalar's JS is inlined and version-pinned.** `SCALAR_MIN_JS` is a generated constant whose
    header records `Original file: /npm/@scalar/api-reference@1.44.15/dist/browser/standalone.js`
    (`packages/service/src/primitives/scalar.generated.ts:1-5`). It is regenerated by
    `deno task gen:assets-barrel`. *observed*

### Scalar — deep links

27. **Hash routing is the default and the anchor grammar is documented.** Operations:
    `#tag/{tag-slug}/{operation-slug}` where the default operation slug is
    `` `${operation.method}${operation.path}` `` and `tag/tag-name/` is auto-prepended
    (`sources/scalar/configuration.md:1210-1229`). Models: `#model/{slug}`
    (`configuration.md:1190-1207`). Tags: `#tag/{slug}` (`configuration.md:1231-1248`). Webhooks:
    `#webhook/{slug}` (`configuration.md:1251-1268`). Headings: `#description/{heading-slug}`
    (`configuration.md:1170-1187`). *observed*
28. **Path routing is available as an alternative**: `pathRouting: { basePath: '/…' }`, "Your server
    must support this routing method" (`sources/scalar/configuration.md:923-935`). A `redirect(path)`
    hook exists for migrating old anchors (`configuration.md:1332-1355`). *observed*
29. **Consequence for NetScript**: a DevTools link to a specific operation is
    `"/api/docs#tag/" + tagSlug + "/" + method + path` under Scalar's *default* slug functions —
    which is what NetScript gets, since it passes none of the `generate*Slug` overrides
    (`packages/service/src/primitives/openapi.ts:126-134`). The tag slug therefore depends on
    whatever tags `@orpc/openapi` emits; NetScript's `createOpenAPISpec` sets only
    `info` + `servers` (`openapi.ts:74-92`), so **tag naming is oRPC-derived and not pinned by
    NetScript** — a fragile hinge for any generated deep link. *inference from openapi.ts:74-92 +
    configuration.md:1210-1229; verify by inspecting a generated `/api/openapi.json` `tags` array.*

### Scalar — extension surface and its limits

30. **Scalar has a real plugin API.** `plugins: ApiReferencePlugin[]`
    (`sources/scalar/configuration.md:972-984`) and `pluginUrls: string[]` — ESM modules imported
    before mount, "Only supported by the standalone browser build (`Scalar.createApiReference`)",
    JSON-serializable (`configuration.md:986-998`; `sources/scalar/plugins.md:19-42`). *observed*
31. **Plugins can add spec-extension renderers and lifecycle hooks.** `extensions: [{ name:
    'x-…', component }]` with Vue or React (via `@scalar/react-renderer`) renderers
    (`sources/scalar/plugins.md:59-120`); hooks `onInit({config, auth})`, `onConfigChange`,
    `onDestroy` (`plugins.md:122-160`); read-only auth accessors `export()`, `getAuthSecrets()`,
    `getAuthSelectedSchemas()` (`plugins.md:162-190`). *observed*
32. **The pinned bundle does NOT support `pluginUrls`.** `grep -c "pluginUrls"
    packages/service/src/primitives/scalar.generated.ts` → `0`, while `generateOperationSlug`,
    `pathRouting` and `onSidebarClick` are all present in the same bundle. Loading a NetScript
    Scalar plugin by URL requires bumping the vendored `@scalar/api-reference` past `1.44.15`.
    *observed*
33. **Non-plugin extension knobs that ARE in the pinned bundle**: `customCss`
    (`configuration.md:425-437`), `favicon`, `hideModels`, `hideClientButton`, `hideTestRequestButton`,
    `showOperationId`, `layout`, `servers`, `persistAuth`, `withDefaultFonts` (option index at
    `configuration.md:250-1150`), plus callbacks `onLoaded`, `onSidebarClick(href)`, `onShowMore`
    (`configuration.md:1486, 1570-1582`). **None of these are reachable through NetScript's
    `ScalarDocsOptions`** (finding 25) — the ceiling today is NetScript's own type, not Scalar's.
    *observed*
34. **`withDefaultFonts: true` is the default, and default fonts load from
    `https://fonts.scalar.com`** (`configuration.md:1136-1148`). NetScript does not set it
    (`openapi.ts:126-134`), so the "no CDN dependency" comment at `openapi.ts:122` is true of the JS
    bundle but **not** of the fonts. *observed — a concrete offline-mode defect candidate.*
35. **Scalar has a first-class MCP config** (`mcp: { name, url, disabled? }`, "enables MCP
    integration so users can connect their API reference to MCP-compatible tools",
    `configuration.md:844-878`). NetScript already ships an MCP server
    (`packages/mcp/`), so this is a pre-built bridge NetScript does not currently use. *observed*

## Contracts

| Contract | Shape | Evidence |
|---|---|---|
| Aspire dashboard route table | `/`, `/consolelogs[/resource/{name}]`, `/structuredlogs[/resource/{name}]`, `/traces[/resource/{name}]`, `/traces/detail/{traceId}`, `/metrics[/resource/{n}[/meter/{m}[/instrument/{i}]]]`, `/login` | `sources/aspire-dashboard/*.razor` `@page` lines |
| StructuredLogs query contract | `?traceId&spanId&logLevel&logEntryId&filters` | `sources/aspire-dashboard/StructuredLogs.razor.cs:104-121` |
| TraceDetail query contract | route `{traceId}` + `?spanId` | `sources/aspire-dashboard/TraceDetail.razor.cs:53-58` |
| Resources query contract | `?resource&view&showHiddenResources&hiddenTypes&hiddenStates&hiddenHealthStates` | `sources/aspire-dashboard/Resources.razor.cs:78-104` |
| Metrics query contract | `?meter&instrument&duration&view` | `sources/aspire-dashboard/Metrics.razor.cs:41-53` |
| Browser-token login | `{PublicUrl}/login?t={Dashboard:Frontend:BrowserToken}` | config reference, Frontend section |
| Dashboard telemetry read API | `GET {dashboard}/api/telemetry/*`, `Dashboard:Api:AuthMode=ApiKey` (auto-generated key) | config reference "API"; `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:146` |
| Aspire resource command | `{ name, displayName, executeCommand(ctx)→ExecuteCommandResult, updateState, iconName }` | `sources/aspire-dashboard/doc-custom-resource-commands.md:109-144` |
| Scalar mount | `GET /api/docs` (HTML) + `GET /api/docs/scalar.js`; spec at `GET /api/openapi.json` | `packages/service/src/builder/service-builder-impl.ts:468-486` |
| `ScalarDocsOptions` | `{ specUrl: string; title?: string; theme?: 'default'\|'kepler'\|'moon'\|'purple'\|'saturn' }` | `packages/service/src/primitives/openapi.ts:48-55` |
| Scalar anchor grammar | `#tag/{tag}`, `#tag/{tag}/{method}{path}`, `#model/{slug}`, `#webhook/{slug}`, `#description/{heading}` | `sources/scalar/configuration.md:1170-1268` |
| Scalar plugin | `() => ({ name, extensions: [{name:'x-…', component, renderer?}], hooks: {onInit,onConfigChange,onDestroy} })` | `sources/scalar/plugins.md:44-160` |

## Boundary table

`DL?` = is an external deep-link actually possible given the URL evidence above.

| Capability | Owner | DL? | Link shape / note |
|---|---|---|---|
| Resource list & state | Aspire | yes | `/?resource={name}` — `Resources.razor.cs:102` |
| Resource graph | Aspire | no (page-level only) | `/` ; graph can only be *disabled* (`Dashboard:UI:DisableResourceGraph`) |
| Console logs | Aspire | yes | `/consolelogs/resource/{name}` |
| Structured logs | Aspire | yes | `/structuredlogs/resource/{name}?traceId=&spanId=&logLevel=` |
| Filtered log/trace query | Aspire | **no** | `?filters=` is an opaque internal serialization (finding 11) |
| Traces list | Aspire | yes | `/traces/resource/{name}` (`?type`, `?filters` not constructible) |
| Trace / span detail | Aspire | yes | `/traces/detail/{traceId}?spanId={id}` |
| Metrics | Aspire | yes | `/metrics/resource/{r}/meter/{m}/instrument/{i}?duration=` |
| Health display | Aspire | partial | shown as resource state; filterable only via `hiddenHealthStates` on `/` |
| Process control (start/stop/restart) | Aspire | no | UI action + `ExecuteCommandContext`; no URL to invoke it |
| Framework action buttons on a resource | Aspire (contributed by NetScript AppHost) | n/a | `withCommand(...)`; **local dashboard only** (finding 14) |
| API schema reference | Scalar | yes | `/api/docs#tag/{tag}` |
| Single operation reference | Scalar | yes | `/api/docs#tag/{tag}/{method}{path}` (default slug fn) |
| Schema / model view | Scalar | yes | `/api/docs#model/{slug}` |
| Try-it / request execution | Scalar | partial | reachable by operation anchor; execution state itself is not in the URL |
| Framework contribution wiring (plugins→routes/islands/registries) | **NetScript DevTools** | n/a | no upstream owner exists |
| Generated-artifact drift (registries, schemas, scaffolds) | **NetScript DevTools** | n/a | no upstream owner exists |
| Contract provenance (schema → oRPC router → OpenAPI → Scalar) | **NetScript DevTools** | n/a | Scalar renders the *endpoint*, not its provenance chain |
| Runtime-domain journeys (workers/sagas/triggers/streams) | **NetScript DevTools** | partial hand-off | own the journey view; deep-link out to `/traces/detail/{traceId}?spanId=` per step |
| Framework actions (regenerate, seed, doctor) | **NetScript DevTools** (may also surface as Aspire commands) | n/a | Aspire commands are a mirror, not the home — they vanish when deployed |

## Drift candidates

1. **`ScalarDocsOptions.theme` is a 5-value subset of Scalar's 12 themes** — expected: pass-through
   of the upstream theme set; actual: `'default'|'kepler'|'moon'|'purple'|'saturn'`
   (`packages/service/src/primitives/openapi.ts:52-54` vs `sources/scalar/configuration.md:1108-1120`).
   Severity: minor.
2. **"no CDN dependency" comment is only true of the JS.** `packages/service/src/primitives/openapi.ts:122`
   says "Serve Scalar UI with locally bundled JS (no CDN dependency)", but `withDefaultFonts`
   defaults to `true` and pulls Inter/JetBrains Mono from `https://fonts.scalar.com`
   (`sources/scalar/configuration.md:1136-1148`). Severity: significant for offline/air-gapped runs.
3. **Vendored Scalar `1.44.15` predates `pluginUrls`** — any DevTools design that assumes a
   URL-loaded Scalar plugin is blocked until the bundle is bumped (`grep -c pluginUrls
   packages/service/src/primitives/scalar.generated.ts` → 0). Severity: architectural for a
   "contribute into Scalar" thesis.
4. **`SCALAR_ASPIRE: '0.10.3'` is declared but unused.** It appears only in
   `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts:13` and its validator allow-list
   `.llm/tools/validation/check-scaffold-versions.ts:29`; no scaffold template, AppHost generator, or
   `.cs`/`.ts` template references `Scalar.Aspire`/`AddScalar`
   (`rtk grep -rn "SCALAR_ASPIRE|Scalar.Aspire|AddScalar" packages plugins` → 1 hit). Either a dead
   pin or an unfinished integration. Severity: minor, but it is a live question for Q5 (does the
   Scalar-in-Aspire aggregator resource belong in the story at all?).
5. **No deep-link helper exists anywhere in `packages/`** for either upstream, despite both URL
   grammars being stable and documented (corroborated by the r5 corpus,
   `.llm/runs/plan-devtools-contribution--seed/research/r5-observability-boundary.md`, "no deep-link
   helper" paragraph). Severity: architectural — the RFC's hand-off thesis has no implementation
   seam today.

## Open questions

1. Does `Dashboard:Otlp:Cors:AllowedOrigins` also govern the `/api/telemetry/*` read API, or is
   there a separate CORS story for `Dashboard:Api`? (Verify in `DashboardWebApplication.cs`.)
2. How does a NetScript-hosted DevTools page obtain the auto-generated `Dashboard:Api:PrimaryApiKey`
   at runtime — is it surfaced as an env var to child resources by the AppHost?
3. What `tags` does `@orpc/openapi` emit for a NetScript service router? Without knowing, generated
   `#tag/{tag}/…` links cannot be guaranteed stable (finding 29).
4. Is `Dashboard:Frontend:PublicUrl` set by the NetScript-generated AppHost, and is the browser
   token retrievable by NetScript tooling for a logged-in deep link?
5. Does bumping the vendored Scalar bundle to a `pluginUrls`-capable version fit the JSR-safe
   inline-asset constraint (bundle size / generation pipeline)?
6. Is `SCALAR_ASPIRE: '0.10.3'` intended to become a `Scalar.Aspire` aggregator resource (one docs
   surface across all services), and does that change the boundary for "API schema" ownership?
7. Aspire removed its in-dashboard Copilot UI in 13.3 and redirected agents to CLI/MCP — does that
   set a precedent the RFC should follow (NetScript DevTools = human UI, MCP = agent surface)?

## Sources

- `.llm/runs/plan-devtools-contribution--seed/research/sources/aspire-dashboard/{Resources,ConsoleLogs,StructuredLogs,Traces,TraceDetail,Metrics,Login}.razor[.cs]` — fetched from `https://raw.githubusercontent.com/dotnet/aspire/main/src/Aspire.Dashboard/Components/Pages/…`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/aspire-dashboard/pages-listing.json` — `https://api.github.com/repos/dotnet/aspire/contents/src/Aspire.Dashboard/Components/Pages`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/aspire-dashboard/doc-custom-resource-commands.md` — `mcp__aspire__get_doc slug=custom-resource-commands`
- `mcp__aspire__get_doc slug=aspire-dashboard-configuration-reference` (not saved to disk; page also at `https://aspire.dev/dashboard/configuration-reference/`)
- WebFetch `https://aspire.dev/dashboard/explore/`
- WebFetch `https://aspire.dev/dashboard/security-considerations/`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/scalar/configuration.md` — `https://raw.githubusercontent.com/scalar/scalar/main/documentation/configuration.md`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/scalar/plugins.md` — `https://raw.githubusercontent.com/scalar/scalar/main/documentation/plugins.md`
- Repo: `packages/service/src/primitives/openapi.ts`, `packages/service/src/primitives/scalar.generated.ts`, `packages/service/src/builder/service-builder-impl.ts`, `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, `.llm/tools/validation/check-scaffold-versions.ts`
