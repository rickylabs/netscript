# Adversarial findings — frontend contribution layer seed

> Constructive adversarial review of generator commit `c4f88a3d` by the requested Sol/high lane.
> Review scope: plan and design only. No product source, GitHub state, release state, or downstream
> evaluation was changed.

## Overall verdict: **FAIL**

FAIL is due to two blockers in the proposed Wave-1 contract/runtime seam. The architectural
direction is worth preserving, but the implementation described by D1/D6/D9 cannot compile or mount
ordinary Fresh route modules as written. The blockers are localizable: add a real Fresh module
adapter in `@netscript/fresh/plugins`, keep the core contract package data-only, and use Fresh's
standard `ctx.state` seam.

What is sound and should survive the integration pass:

- a fresh-free base contribution vocabulary with the dashboard's seven-kind family layered above it
  rather than duplicated;
- manifest-driven, deterministic generated discovery rather than runtime global registration;
- direct island imports, with Vite `islandSpecifiers` and non-Vite `registerIsland` as the two build
  adapters;
- the live-versus-scaffolded ownership rule: plugin-owned surfaces remain live, app-owned pixels are
  starter resources;
- T0 as the honest first-party trust posture, with T1/T2 left to the dashboard host;
- explicit contract-version handshakes and doctor diagnostics, after the versioning rules below are
  corrected.

## Numbered findings

### 1. **Blocker — D6's lazy route/layout mounting sketch does not accept ordinary Fresh modules**

**Evidence.** The design promises ordinary `define.page`/handler route modules and passes
`lazy(import(specifier))` directly to `sub.route`; it also passes a lazy module to `sub.layout`
(`design/canonical/01-contracts.md:98-114`, `design/canonical/04-host-runtime.md:28-40`). Upstream
Fresh 2.3.3 says:

- `App.route(path, route)` takes `MaybeLazy<Route<State>>`, where a `Route` has `component`,
  `handler`, `config`, and `css`; a dynamically imported file-route module is a module namespace
  with `default`, `handler`, and `config`, not a `Route` with `component`.
- `newRouteCmd` calls `ensureHandler(result)`. `ensureHandler` sees neither `result.component` nor,
  for a component-only page, `result.handler`, and installs the default 404 handler. See
  [`commands.ts:32-42,142-167`](https://jsr.io/@fresh/core/2.3.3/src/commands.ts) and
  [`App.route`](https://jsr.io/@fresh/core/2.3.3/src/app.ts#L256).
- `App.layout` takes a `RouteComponent<State>`, not a lazy route module. The proposed call is a type
  error before runtime. The base contract does not declare `layoutModule` at all, despite the host
  sketch reading it.
- `sub.use(pluginScopeMiddleware(...))` is registered _after_ layouts and routes. Fresh snapshots
  `segmentToMiddlewares(segment)` when each route command is applied
  ([`commands.ts:271-300`](https://jsr.io/@fresh/core/2.3.3/src/commands.ts)); the later middleware
  is therefore absent from those routes. `App.mountApp` only prefixes and copies commands; it does
  not repair their shapes or ordering
  ([`app.ts:353-384`](https://jsr.io/@fresh/core/2.3.3/src/app.ts)).

**Required repair.** Keep `App.mountApp`, but specify and spike an adapter that maps an imported
Fresh module namespace to a Fresh route:

```ts
({
  component: module.default,
  handler: module.handler,
  config: module.config,
});
```

Map `_layout` to its default component, and register scope middleware before any route/layout
commands. Add `layout` (and decide error/not-found/middleware support) to the contract or explicitly
remove the advertised `_layout` convention. The Wave-1 spike must cover a component-only page,
handler-only route, component+handler route, dynamic params, nested layout, middleware state, and
both Vite and non-Vite builds.

### 2. **Blocker — D1 and D9 contradict each other: a fresh-free package cannot implement `definePluginPage` or invent `ctx.host`**

**Evidence.** D1 says `@netscript/plugin-frontend-core` must not depend on Fresh and contains pure
data (`design/canonical/01-contracts.md:10-28`). Wave 1 nevertheless puts `definePluginPage` there,
described as sugar over Fresh `define.page` (`design/canonical/02-authoring-dx.md:72-118`,
`plan.md:47-50`). Fresh's public `Context<State>` and `PageProps` expose `state`; neither exposes a
`host` field, and there is no public `useRequest` hook. This was rechecked with:

```text
deno doc --filter Context jsr:@fresh/core@2.3.3
deno doc --filter PageProps jsr:@fresh/core@2.3.3
deno doc --filter useRequest jsr:@fresh/core@2.3.3  # not found
```

The proposed core `PluginHostState` also imports an auth-owned `SessionClaims` concept while the
package is declared dependency-light and host-agnostic
(`design/canonical/04-host-runtime.md:81-96`). The repository already exports a different
`PluginHostState` for CLI plugin loading (`packages/cli/src/public/public-api.ts:112-127`), making
the name actively ambiguous.

**Required repair.** Leave `@netscript/plugin-frontend-core` as Archetype 1: schemas, types,
constants, `defineFrontend`, and small validation only. Put `definePluginPage`/module adaptation in
`@netscript/fresh/plugins`, parameterized by standard Fresh state:

```ts
type PluginFrontendState = {
  readonly pluginFrontend: FrontendHostContext;
};

export const define = createDefine<PluginFrontendState>();
// author code reads ctx.state.pluginFrontend
```

Prefer `FrontendHostContext` over the colliding `PluginHostState`. Keep it neutral: plugin id,
resolved base, and a service/gateway resolver. Auth-specific claims belong in auth state or a
capability/principal seam owned outside the frontend base contract.

### 3. **Major — the promised SSR zone quarantine is not provided by Preact error boundaries**

**Evidence.** D11 claims a crashed SSR zone renders a quarantine card and never breaks the page via
a Preact error boundary (`design/canonical/04-host-runtime.md:98-118,141-148`). A focused check
against the pinned family contradicts it:

```text
deno eval '<Boundary componentDidCatch> around <Boom>'
# preact@10.29.2 + preact-render-to-string@6.7.0
THREW:boom
```

Preact component error boundaries are a client rendering mechanism; `preact-render-to-string`
propagates the child render exception. Separately, `<PluginZone id="..." />` has no specified way to
obtain the request URL or host state required by `ZoneProps`, and Fresh has no request hook from
which it can recover them.

**Required repair.** Split the guarantees:

- generation/import/async data failures can be captured before creating a zone vnode and rendered as
  a quarantine result;
- client-island render failures can use an error boundary;
- arbitrary SSR component render failures in the same Fresh render tree are **not isolated** by a
  Preact boundary. Either accept route-level failure honestly, introduce a separately rendered
  fragment boundary with explicit trade-offs, or move the untrusted/failure-isolated case to the
  later iframe tier.

Also specify a request-scoped Provider/app wrapper or pass `{ url, host }` explicitly to
`PluginZone`; an implicit global would violate doctrine A10/AP-11.

### 4. **Major — D8's generic proxy has neither a routable target contract nor the security/streaming semantics it claims**

**Evidence.** A frontend manifest names procedure strings, but it does not bind a plugin to one of
possibly several service contributions, a service-relative path, protocol, methods, auth policy,
CSRF policy, or request limits (`design/canonical/01-contracts.md:52-61`). Therefore
`/api/plugins/:pluginId/*` cannot deterministically choose an upstream. T0 server-code trust does
not make a same-origin browser proxy safe: a compromised island can address another plugin id, and
forwarded cookies/session headers create CSRF and confused-deputy risks.

The AI precedent is materially more than “SSE passes through.” `createNetScriptChatStreamProxy`
strips stale `content-encoding`/`content-length` and hop-by-hop headers, overlays server-only auth,
forces identity encoding, propagates the request `AbortSignal`, and streams unbuffered
(`packages/fresh/src/runtime/ai/stream-proxy.ts:1-35,46-83,
159-211`). The generic sketch specifies
none of those invariants and risks reopening #239.

**Required repair.** Replace procedure-name audit strings as the routing mechanism with typed,
host-resolved gateway declarations or adapter handlers, for example service id + path prefix +
protocol + allowed methods + auth/CSRF mode. Validate that the requested plugin/gateway pair is in
the generated registry. Centralize standard proxy hygiene, but allow specialized gateways such as
durable chat to retain their stricter adapter. `requires.procedures` may remain provenance/audit
metadata; it is not an enforceable or end-to-end typed data plane by itself.

### 5. **Major — D4/D12 describe an “existing” registry/install gate that does not exist**

**Evidence.** The discovery diagram labels generated-workspace `deno check` an existing install gate
(`design/canonical/03-discovery-and-registry.md:6-18`). Current source instead shows:

- the AST extractor only recognizes `defineJob`, `defineSaga`, and `defineWebhook`
  (`packages/plugin/src/sdk/discovery/ast-extractor.ts:4-34`);
- the generic emitter keys every imported contribution by `.id`; a `FrontendManifest` has `.plugin`,
  not `.id` (`packages/plugin/src/sdk/discovery/registry-emitter.ts:35-69`);
- `generate plugins` writes every emission unconditionally; byte-identical skipping is not current
  behavior (`generate-plugin-registries-command.ts:93-102`);
- `installPlugin` mutates scaffold, schemas, appsettings, config, imports, workspace membership, and
  Aspire helpers, but calls neither `generate plugins` nor `deno check`
  (`packages/cli/src/public/features/plugins/install/install-plugin.ts:98-201`).

The pointer also exists twice (`.withFrontend` and `scaffold.plugin.json`) without an authority or
drift rule.

**Required repair.** Design a purpose-built manifest resolver/frontend emitter rather than saying
the current AST axis handles it. Name one authoritative pointer constant and mechanically derive or
strictly cross-check the runtime and installer forms. Add byte-identical writes. Most importantly,
stage the candidate registry and type-check it **before** committing workspace mutations, or define
rollback for every mutation. A post-mutation type error is not “fails install”; it is a partially
installed workspace.

### 6. **Major — “bump `PLUGIN_MANIFEST_SCHEMA_VERSION` additively” breaks every v1 manifest**

**Evidence.** The current parser accepts exactly the single constant version using `z.literal`, and
explicitly rejects any other value
(`packages/plugin/src/protocol/manifest.ts:3-4,112-136,
203-216,239-263`). Adding an optional
`frontend` field is compatible within schema version 1; merely changing the constant to 2 causes
every existing version-1 plugin manifest to fail.

**Required repair.** Do not bump for an optional field. If a protocol v2 is genuinely needed,
introduce an explicit v1|v2 discriminated parser plus normalization and a migration/support window.
Reuse the existing traversal-safe export-path validator at `manifest.ts:273-281` for the new
pointer.

### 7. **Major — several advertised type/version guarantees collapse to strings or mutable runtime machinery**

**Evidence.** Four concrete gaps undermine “type safety end to end”:

1. The `ComponentRef` template-literal type accepts `./../escape`, empty segments, backslashes, and
   NUL at the type level; unlike the installer export pointer, no runtime safe-path schema is
   specified.
2. `AppZone | (string & {})` reduces effectively to `string`, so “unknown zone = generate-time
   error” is not a compile-time author guarantee (`design/canonical/01-contracts.md:130-156`).
3. `ResolvedFrontendManifest` extends the unresolved manifest while adding `specifierOf()` and a
   `ReadonlyMap`. A function-valued registry is neither the promised pure data nor a directly
   serializable generated contract (`01-contracts.md:192-209`).
4. New discriminated-union members are declared additive within `contracts/v1`
   (`01-contracts.md:231-243`). They are breaking for exhaustive consumers unless the contract
   requires a forward-compatible unknown-member policy. New optional fields and published zones can
   be minor; a new `kind` is not automatically minor.

**Required repair.** Use a Zod safe-relative-module schema, keep resolved records separate from the
author manifest, emit concrete specifiers rather than a resolver function, and make zone/surface
types generic over host-published catalogs. Define whether unknown kinds are rejected/quarantined;
if consumers are exhaustive, cut `contracts/v2` for a new kind.

### 8. **Major — route collision checks omit the host's file routes and reserved API surface**

**Evidence.** Resolution checks only compare plugin bases to other plugin bases
(`design/canonical/03-discovery-and-registry.md:88-101`). In `defineFreshApp`, `configure` runs
before `fsRoutes` (`packages/fresh/src/runtime/server/define-fresh-app.ts:92-118`), so the proposed
frontend option registers plugin commands without seeing the later app route inventory. A plugin can
therefore collide with an app's `/auth`, `/dashboard`, or `/api/plugins` route even though
generation declared the registry valid. Nav ids/groups can similarly conflict with host-owned
entries.

**Required repair.** Make the host publish a reserved route/base and nav-group inventory to the
generator, include file-route manifest paths and the proxy prefix, and define precedence as an error
rather than relying on command order. The adoption command must report collisions before it changes
wiring.

### 9. **Major — D10's DOM wrapper does not scope arbitrary CSS, and existing-app adoption is underspecified**

**Evidence.** Adding `[data-ns-plugin]` to markup does not rewrite a plugin stylesheet. A theme file
containing `body`, `:root`, `*`, or `.ns-button` remains global despite the wrapper. `@layer`
controls cascade order, not selector reach. The design nevertheless treats wrapper + layer as
sufficient isolation and defers the token-only lint as debt
(`design/canonical/04-host-runtime.md:
129-155`, `design/canonical/06-doctrine-fit.md:48-56`). Route
and zone wrappers also cannot protect an exported island rendered outside its original plugin
surface.

The new-app wiring is concrete, but `generate frontend-wiring` offers only “PluginZone hints” for
arbitrary existing layouts (`design/canonical/05-scaffolding-and-cli.md:7-17`). That cannot deliver
D13's zero-edit surface consistently. The listed CSS import from `assets/design.css` to
`./.netscript/generated/frontend.css` is also relative to `assets/`, so it points at
`assets/.netscript/...`, not the project-root generated directory (`05:20-40`).

**Required repair.** Choose a real v1 rule: require selectors under a plugin-specific `@scope` or
prefix and lint/transform them at generation, while separately enforcing token values. Define
idempotent layout markers and conflict UX for existing apps, or state that adding zone placements
requires a small manual edit. Fix the generated CSS import path/alias and test it in the real
scaffold.

### 10. **Major — the auth worked example depends on contracts and host state that do not exist**

**Evidence.** The shipped auth v1 contract has only `describe`, `signin`, `callback`, `signout`,
`session`, and `me` (`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:431-459`). The
example calls `client.org.members`, declares `auth.org.*`, assumes `SessionClaims`, and reads
`ctx.host.session.orgId` (`design/examples/auth.md:70-102`). No exported `SessionClaims` was found
in the auth core surface. Better Auth having an organization plugin and WorkOS carrying an
organization id does not create a harmonized NetScript org/member contract, and KV OAuth has no
equivalent.

**Required repair.** Make the live auth UI phase depend on an auth-core capability/contract slice
that defines the cross-adapter minimum and explicit degraded states. Keep generic session/principal
data out of `plugin-frontend-core`. Until that lands, the valid proof is signin/session/me/signout;
org management is a future consumer, not evidence that v1 fits today.

### 11. **Major — the AI example does not match the current durable-chat API and conflates two data planes**

**Evidence.** Current `createNetScriptChatConnection` requires a durable session `target` with
`sessionId`, optional `baseUrl`/headers, and optional `streamPath`
(`packages/fresh/src/runtime/ai/create-chat-connection.ts:41-70,77-88,146-195`). The existing
scaffold stub still passes `{ endpoint }` and calls methods that do not match the current public
handle (`plugins/ai/.../chat-route.stub.ts:14-56`); it is stale source, not a template to move
unchanged. The worked example points the connection at `/api/plugins/ai/chat`, treating the AI oRPC
`chat` procedure and durable per-session stream transport as one endpoint
(`design/examples/ai.md:19-55`). They are distinct planes with distinct authorization and proxy
semantics.

**Required repair.** First repair/replace the stale starter against the current `target` API. Then
model the AI frontend as an explicit durable-stream gateway using `createNetScriptChatStreamProxy`;
keep oRPC model/procedure calls on their typed contract client. This is why AI is a poor first spine
proof even though it is a valuable later consumer.

### 12. **Major — the deploy example contradicts the latest deploy seed and cannot prove this layer**

**Evidence.** The reviewed deploy branch tip was `f360deca`. Its canonical DP-4 explicitly chooses
**no `withService`, no HTTP surface, no port, and `hasRoutes:false` in v1**; status/history frontend
is forward-looking and fed by the `deploy-events` durable stream. DP-7 repeats “contracts: none” and
identifies only a stream-fed frontend panel. The frontend example instead assumes `deploy.status`,
`deploy.logs`, and `deploy.plan` HTTP procedures plus a generic API proxy
(`design/examples/deploy.md:9-50`).

The example's cloud starter emits provider-specific app routes and wrappers
(`design/examples/deploy.md:59-76`), while deploy DP-7/DP-8 lock the opposite invariant: provider
choice changes config, bindings, emitted artifacts, workflows, and backing packages, **never app
source**.

**Required repair.** Rewrite the deploy proof as a read-only status/history zone sourced from the
published `deploy-events` stream schema, with target details from the capability manifest. Defer
logs/actions until deploy deliberately adds a service contract. Remove provider-specific app-code
starters; `AppTarget` can still deliver target-neutral, user-owned UI resources without violating
the one-graph rule.

### 13. **Major — the authoring surface repeats information and does not establish one authority**

**Evidence.** A small plugin repeats `kind`, `id`, and module paths across arrays, then repeats the
frontend pointer in both a builder and JSON (`design/canonical/02-authoring-dx.md:26-70`). Route
reference generation also invents a kebab-to-camel mapping (`schedule-detail` → `scheduleDetail`)
without a collision rule. This is more ceremony than shipped definition surfaces need, especially
for the owner's DX priority.

The fresh-ui `*Namespace` precedent is useful but should not be copied mechanically. `Dialog.Root`
and `Tabs.Content` are compound runtime components (`packages/fresh-ui/interactive.ts:20-93`); a
manifest is plain data, and doctrine A6 warns against helpers that merely rename object literals.
Harmonization means predictable discoverability and examples that use the shipped namespaces, not
wrapping every record in `Frontend.Route(...)`.

**Concrete better alternative.** Keep the idiomatic `defineFrontend` entry verb, use record keys as
stable ids, derive `kind` from the collection, export typed zone constants, and make one pointer
constant authoritative:

```ts
import { AppZones, defineFrontend } from '@netscript/plugin-frontend-core/contracts/v1';

export const FRONTEND = {
  export: './frontend',
  framework: 'fresh',
  contract: 'v1',
} as const;

export default defineFrontend({
  plugin: 'crons',
  base: '/crons',
  routes: {
    calendar: {
      path: '/calendar',
      module: './routes/calendar.tsx',
      nav: { label: 'Cron calendar', icon: 'calendar', group: 'main' },
    },
    scheduleDetail: {
      path: '/schedules/:id',
      module: './routes/schedules/[id].tsx',
    },
  },
  islands: { CronCalendar: './islands/CronCalendar.tsx' },
  zones: {
    nextFires: {
      at: AppZones.dashboardPanels,
      module: './components/NextFiresCard.tsx',
    },
  },
  theme: { css: ['./theme.css'] },
});
```

This removes redundant discriminants/ids, preserves author-selected route-ref keys, and gives
autocomplete without helper proliferation. The builder and installer manifest should import or be
generated from `FRONTEND`, or doctor must reject divergence. In component examples, explicitly show
package-owned `Dialog.Root`, `Tabs.Root`, etc.; continue forbidding imports of app-copied UI files.

### 14. **Minor — examples overstate fresh-ui styling availability**

**Evidence.** The dashboard example uses `nsw-panel`, which appears nowhere in shipped product
source, while plugin-served UI cannot import the app-owned copy registry
(`design/examples/dashboard.md:39-54`, `design/canonical/02-authoring-dx.md:119-123`). Existing apps
may also lack the exact copied layout/style items assumed by the new scaffold.

**Recommendation.** Publish a small tested list of package-safe runtime components and base CSS
classes for live contributions, and make every worked example use only that list plus semantic
tokens. Add a consumer gate against both a freshly scaffolded app and a minimally adopted existing
app.

### 15. **Minor — one carried upstream-model statement is now stale**

**Evidence.** The prior dashboard appendix says Medusa zones are docs-only. Current official Medusa
documentation supports custom injection zones with `LayoutComposer` and TypeScript declaration
merging into `InjectionZoneRegistry`, in addition to the published built-in zone catalog:

- https://docs.medusajs.com/learn/fundamentals/admin/custom-injection-zones
- https://docs.medusajs.com/resources/admin-widget-injection-zones

The other carried mechanisms remain directionally supported by current official material: TanStack
uses a plugin array plus typed, plugin-id-prefixed event client; Nuxt custom views are iframe-based
and expose typed RPC; Directus distinguishes same-environment app extensions from sandboxed server
extensions/marketplace trust policy. These are useful precedents, but none repairs the Fresh runtime
blockers above.

**Recommendation.** Correct the Medusa summary and adopt its typed host-specific zone augmentation
as a better precedent than `AppZone | string`.

## Per-dimension verdicts

| Dimension    | Verdict    | Reason                                                                                                                                                                                                                                               |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correctness  | **FAIL**   | Direct module imports do not satisfy Fresh `Route`/`layout`; middleware order is wrong; `ctx.host` is not a Fresh seam. Island-specifier registration itself is verified and sound.                                                                  |
| DX           | **REVISE** | The ownership story and ordinary Fresh authoring goal are strong. Repeated discriminants/ids/pointers, implicit route-key conversion, and a fictional context property make the actual surface clunkier than the pitch.                              |
| Completeness | **REVISE** | Request-scoped zone context, real SSR failure semantics, host-route/nav conflicts, gateway security, transactional install, CSS scoping, and existing-app adoption are missing. Auth/AI/deploy examples assume unshipped or contradictory contracts. |
| Doctrine     | **REVISE** | Core/package thinness is the right direction, but `definePluginPage` and auth session types violate the Archetype-1 boundary. Runtime adaptation belongs in `@netscript/fresh/plugins`; debt cannot substitute for a false isolation guarantee.      |

## Consumer-fit verdicts

| Consumer                          | Fit                                            | Required adjustment                                                                                                                            |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev dashboard / seven-kind family | **Good base, type revision needed**            | Preserve family extension. Use host-generic zone/surface parameters and an unknown-kind/version policy; do not let `string` erase the catalog. |
| Auth UI                           | **Does not fit current v1 without contortion** | Prove signin/session/me/signout first; add an auth-core org capability contract before live org/member UI.                                     |
| AI surfaces                       | **Fits only through a specialized gateway**    | Separate typed oRPC calls from durable session streams; use the existing chat proxy and current connection API.                                |
| Deploy dashboards                 | **Fits as a stream-fed read surface**          | Consume `deploy-events` and capability manifests. Do not invent v1 deploy HTTP procedures or provider-specific app code.                       |

## Owner fork recommendations (F1–F8)

| Fork                          | Recommendation                                                   | Rationale                                                                                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1 — core pointer axis**    | **(a), conditional**                                             | Keep `.withFrontend()` because frontend is a real named axis, but establish one `FRONTEND` pointer authority and derive/cross-check the installer JSON. Two hand-authored pointers are a DX and drift bug.                                            |
| **F2 — mount policy**         | **(a), plugin base + host remap**                                | Product URLs such as `/auth` are better. Require host file-route/API/nav inventories and refuse collisions before generation; reserve forced `/plugins/<id>` for dashboard/third-party host policy.                                                   |
| **F3 — package name**         | **(a) `@netscript/plugin-frontend-core`**                        | Sibling symmetry and a fresh-free contract are sound. Move all Fresh helpers/runtime adaptation to `@netscript/fresh/plugins`; do not weaken the name by folding the contract into Fresh.                                                             |
| **F4 — zone set**             | **Minimal set**, but host-published and typed                    | Start small. Reconsider `app.dashboard.panels` as a universal base-zone name; expose constants and allow a dashboard host to supply its own exact catalog without widening to `string`.                                                               |
| **F5 — theme contributions**  | **(a) CSS only**                                                 | DTCG merge can wait. CSS v1 still needs enforceable selector scoping/prefixing and semantic-token lint before it can claim isolation.                                                                                                                 |
| **F6 — convention generator** | **Phase 2**                                                      | Explicit contract proof first is correct. Use record-shaped manifests and a single pointer constant in phase 1 so the interim manual form remains pleasant.                                                                                           |
| **F7 — dogfood set**          | **Four simple capability panels, plus one worker route fixture** | Do not make the complex, currently stale AI stream client the spine proof. Panels exercise zones across real first-party plugins; one worker route/island exercises the corrected Fresh module adapter. AI follows as a specialized-gateway consumer. |
| **F8 — milestone**            | **Stable train for now**                                         | The Fresh adapter, gateway/security contract, transactional install, and consumer prerequisites are not beta-slot-ready. Pull forward only after the route/island spike and one scaffolded browser proof pass.                                        |

## Upstream/source verification ledger

- **Fresh `App.mountApp`: confirmed**, but it merges/prefixes command lists; it is not a file-route
  module adapter.
- **Fresh `App.route(MaybeLazy<Route>)`: confirmed**, and this is exactly why the module-namespace
  mapping in finding 1 is required.
- **Fresh non-Vite island registration: confirmed** through Builder source; **Vite dependency
  islands: confirmed** through `FreshViteConfig.islandSpecifiers` and
  [`@fresh/plugin-vite@1.0.8 mod.ts:211-214`](https://jsr.io/@fresh/plugin-vite/1.0.8/src/mod.ts).
  Vite imports the specifier and registers exported functions; the one-component-per-module rule is
  therefore important because exported helper functions can be interpreted as islands.
- **Fresh context shape: confirmed** with `deno doc`; only `state` is available for the proposed
  host seam.
- **JSR entrypoints:** current official configuration docs describe a default string or a map of
  named entrypoints. Per-module exports maintenance is a real cost and must be proven by the package
  publish dry-run; the design should not rely on an undocumented wildcard shortcut.
- **External precedents:** rechecked against current official TanStack, Nuxt, Directus, and Medusa
  documentation; correction recorded in finding 15.

## Integration bar

The generator should retain the sound decisions, revise D1/D4/D6/D8–D13 with the repairs above, and
replace the three invalid consumer proofs. Before owner ratification, the revised plan needs a small
executable Fresh spike showing: generated manifest → imported ordinary route module → nested
layout + middleware state → SSR response; dependency island hydration under Vite; one zone with
explicit request context; and a failed staged registry check leaving the workspace byte-identical.
No downstream eval is requested or arranged by this review.
