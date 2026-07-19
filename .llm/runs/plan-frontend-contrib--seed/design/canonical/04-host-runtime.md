# Host Runtime — mounting, SSR/hydration, data, nav, theming, isolation (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial findings S-1, S-2, S-3, S-4,
> S-6, S-9, S-12 (`../../adversarial-sol.md`; dispositions in `../../adversarial-triage.md`).
> Mechanisms marked **[P#]** are Wave-0 proof gates (`../../plan.md`) — the design is not
> considered verified until the proof passes.

## 1. The host entry — one option on `defineFreshApp`

```ts
export const app = defineFreshApp<State>({
  name: '{{appName}}',
  frontend: frontendRegistry,
});
```

**Composition-phase law (S-1).** Fresh compiles each route's middleware/layout chain at
insertion time — later `use()` calls are not retroactive, and host fs layouts cannot wrap routes
registered before them. `defineFreshApp` currently runs `configure()` *before* `fsRoutes`
(`packages/fresh/src/runtime/server/define-fresh-app.ts:110-127`), so plugin mounting must NOT
ride `configure`. The `frontend` option instead runs a dedicated **post-fsRoutes composition
phase**: staticFiles → host middleware → host fs routes/layouts → **`mountPluginFrontends`**.
Within each plugin sub-app the registration order is fixed: **middleware first, then routes**
(plugin `_layout` is not supported in v1 — S-2). Contributed sub-apps may not carry `App`-level
`notFound`/`onError`/`appWrapper` commands; the mount glue strips them and reports. The exact
interleaving (host `_app` wrap, nested host layouts, host `config.basePath`, plugin middleware,
plugin 404 behavior, two plugins mounted) is **[P1]** with integration fixtures — D6 stands only
if P1 passes; the fallback mount mechanism is explicit `app.route()` registration of
fully-prefixed paths without `mountApp`.

## 2. Route mounting

```ts
// inside mountPluginFrontends (sketch, per plugin)
const sub = new App<State>();
sub.use(pluginScopeMiddleware(identity));              // BEFORE routes — S-1
for (const r of m.routes) sub.route(r.path, r.load);   // r.load: generated literal lazy loader
app.mountApp(m.resolvedBase, sub);
```

**Route loaders are generated literals (S-2).** Upstream `App.route()` accepts
`MaybeLazy<Route>` — an internal `{ component, handler, config, css }` shape, not a fs route
module; only `fsRoutes` normalizes module namespaces. The registry therefore emits, per route:

```ts
() => import('@acme/plugin-crons/frontend/routes/calendar').then(normalizeFreshRouteModule)
```

- literal specifier → real bundler edge (no computed `import()`);
- `normalizeFreshRouteModule` (owned by `@netscript/fresh/plugins`, **[P2]**) maps
  `default` / `handler`/`handlers` / `config` / `css` onto the pinned `Route` shape and throws a
  structured error on unknown members.

Base policy unchanged from rev 1 (plugin-preferred `base`, host remap, dashboard auto-remaps
under `/plugins/<mountId>`), with collision rules hardened in `03 §3`.

## 3. Islands — verified API, proof-gated behavior [P3]

Registration is by module specifier on both build paths — `fresh({ islandSpecifiers })`
(plugin-vite 1.0.8 `mod.ts:56-63,211-214`) and `Builder.registerIsland` (core
`dev/builder.ts:157`). That much is verified. **Not yet verified (S-3):** clean-cache resolution
(plugin-vite's Deno plugin runs `cachedOnly: true`), the Preact JSX transform's
`node_modules`/npm-cache excludes vs JSR-served TSX, dependency CSS, HMR (the island watcher
only watches local island dirs), published-JSR vs local-source parity, and `^1.0.8` range drift.
[P3] runs the full matrix (clean env × {local-source, jsr} × {dev, prod build + SSR + hydrate} +
single Preact identity + dependency CSS + edit-loop behavior) before the island contract is
frozen; until then authors' islands are supported for local-source plugins and the JSR mode is
gated on the proof. Known consequence either way: island edits in dependency mode may require a
signaled full reload rather than HMR — `netscript plugin dev` (05) owns that signal.

## 4. Data access — a generated gateway, not a proxy (S-6)

The rev-1 wildcard `/api/plugins/<id>/*` forwarding proxy is withdrawn — a header-forwarding
generic proxy is a confused-deputy/request-smuggling surface, and the existing AI stream proxy
(`packages/fresh/src/runtime/ai/stream-proxy.ts:55-211`) shows what a safe transport actually
handles (server-side auth, constrained upstream, manual redirects, rebuilt header set, abort).

Replacement: **`pluginGateway(registry)`** — a generated, deny-by-default route table:

- One route per granted procedure, generated from `requires.procedures` × the plugin's own
  versioned contract metadata (service owner, method, path template, request/response mode,
  streaming policy). Nothing else is reachable — no wildcard forwarding, ever.
- Server-side authentication/authorization via the host principal port; browser credentials are
  never blind-forwarded; CSRF/origin checks; request/response size limits; timeouts; abort
  propagation; `redirect: 'manual'`; response-header allowlist; structured audit log line per
  invocation (mountId, procedure, subject).
- Streaming: SSE/eventIterator procedures declare it in metadata; the gateway applies the
  stream-proxy discipline. The AI durable-chat plane **stays on its specialized adapter** — the
  gateway does not replace `@netscript/fresh/ai`.
- Threat model + abort/reconnect semantics are **[P5]**, and the gateway is its own reviewed
  implementation wave (`plan.md`).

Server-side plugin code doesn't need the gateway: route handlers/zone components call typed
clients against `ctx.host.serviceUrl(...)` directly (unchanged).

## 5. Host context — the split seam (S-9)

`state.pluginHost: PluginRequestContext` (server-only: identity, base, serviceUrl, principal
port, CSP nonce seam, abort signal) is injected by `pluginScopeMiddleware`;
`PluginClientContext` (serializable: mountId, base, locale, direction, timeZone, subject
summary, capabilities) is what may cross into islands. Shapes in `01-contracts.md`. Zone
components receive both; pages read them from state via the `definePluginPage` helper — which
lives in **`@netscript/fresh/plugins`** (S-5), typed as **`PluginPageContext`** over Fresh
`PageProps`: `ctx.host`, `ctx.client`, and a `redirect(path): Response` helper (K-4, K-15);
plain `define.page` + `props.state.pluginHost` is the sugar-free equivalent.
**`pluginApi` signature (pinned — K-2):** `pluginApi(client: PluginClientContext): string` —
returns the plugin's gateway base (`/api/plugins/<mountId>`, the `GATEWAY_PREFIX` contract
constant, K-13); islands hold the client context anyway, and a raw-id overload would invite
hand-typed strings.

## 6. Zones — SSR injection with honest containment (S-4)

`<PluginZone id>` renders zone contributions in deterministic order, each wrapped in
`<div data-ns-plugin='<mountId>' data-ns-contribution='<mountId>/<id>'>`.

**Containment contract (downgraded from rev 1, which overclaimed):** Fresh renders with
`preact-render-to-string` without its error-boundary mode, and async components run before the
boundary exists — so a *render-time throw in SSR is not containable by a component boundary*.
What the host actually guarantees:

1. **Data-phase containment**: zone data resolution runs host-side *before* render inside a
   try/catch; a failed resolution renders the quarantine card. Zone components are told to keep
   render pure — fetch in the resolver, not the component body.
2. **Client containment**: hydrated islands sit under a client-side Preact boundary; post-
   hydration crashes degrade to the quarantine card without killing the page.
3. **Route-level `onError`**: a plugin route that throws fails that route, host-styled — never
   the shell.
4. An SSR render-time throw in a zone component **fails the page response** — documented, tested
   ([P4] fixture), and the reason the resolver-not-render rule exists. If hard SSR zone isolation
   is ever required, it is a designed isolated-render protocol (own wave), not a boundary claim.

## 7. Nav — unchanged mechanics, validated data

`pluginNavSections(registry, { group })` feeds `SidebarShell.navigation` / the topbar; targets
are discriminated (`route`/`href`/`external` — S-10) with base-path composition and
`rel="noopener noreferrer"` on external; labels are `MessageRef`s resolved through the host's
message resolution (default text when no catalog). Typed route refs unchanged
(`frontend.routes.ts`).

## 8. Theming & style isolation (S-12)

- **Layer order is host-owned**: the generated CSS begins with a host prelude declaring
  `@layer ns-app, ns-plugins;` (order, not names, decides priority) so plugin CSS loses to app
  CSS by declaration, not by luck.
- Scoping: `[data-ns-plugin='<mountId>']` wrappers (zones, plugin route trees). **Portals
  escape wrappers**: the host provides a per-plugin portal root (`<div data-ns-plugin=…>` under
  `document.body`) via the client context, and fresh-ui overlay primitives mount there;
  arbitrary portals outside it are out of contract.
- Copy-fallback caveat: copying dependency CSS into `.netscript/generated/` changes the base URL
  for relative `url()` assets — the generator must rewrite `url()`s or inline; recorded as an
  implementation requirement, with a full `AssetContribution` (hashing, cache headers)
  registered as a debt candidate (06 §4), not silently equivalent bytes.
- Tokens rule unchanged: `--ns-*` vocabulary only; light/dark/theme override inheritance for
  free.

## 9. Isolation posture (unchanged) and 10. Non-goals (unchanged)

App surface = T0 trusted (installed plugins already run server code); the `requires` block +
provenance wrappers are the audit surface; T1/T2 iframe tiers remain dashboard-run scope. No
runtime registration API; no plugin-to-plugin imports outside published exports; no client-side
plugin router; no shadow-DOM wrapper.
