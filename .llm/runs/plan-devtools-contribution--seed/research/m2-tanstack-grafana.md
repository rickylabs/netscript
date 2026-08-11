# market:tanstack-grafana

Stage-B discovery corpus — primary-source architecture teardown of **TanStack Devtools** (library-level
devtools panel shell) and **Grafana plugin extensions** (versioned, capability-negotiated host
extension system).

Baseline: `main` @ `2256a67bf`. Planning-only run; no repo source was modified.

Saved artifacts live under
`.llm/runs/plan-devtools-contribution--seed/research/sources/{tanstack,grafana}/` and are cited by
path below. Upstream revisions are `TanStack/devtools@main` and `grafana/grafana@main` as fetched on
2026-08-11 — a moving target, so every citation names the saved local copy, not just the remote path.

---

## Summary

TanStack Devtools is a **shell + plugin array**, not a registry. A single `TanStackDevtoolsCore`
instance is constructed with a literal `plugins: Array<TanStackDevtoolsPlugin>`; each plugin is
`{ id?, name, render(el, props), destroy?, defaultOpen? }` where `render` is handed a raw
`HTMLDivElement` to mount into
(`sources/tanstack/packages_devtools_src_context_devtools-context.tsx:21-77`). Framework adapters
(React/Vue/Solid/…) are thin wrappers that convert a framework element into that DOM-mount callback
— the React adapter does it with `createPortal` into the container the core handed back
(`sources/tanstack/packages_react-devtools_src_devtools.tsx:200-216,256-277`). There is **no
capability negotiation, no version handshake, no permission model, and no isolation**: contribution
is "the app author imported your panel component and put it in an array." Multiple libraries
coexist because the app author lists them, not because a registry discovered them. The data channel
is a **global `EventTarget` bus** — `window` when available — with plugin-namespaced event names
`${pluginId}:${eventSuffix}`, queueing-until-connected and a 5-retry connect handshake
(`sources/tanstack/packages_event-bus-client_src_plugin.ts:186-232,236-248`); the shell side bridges
that browser bus to a dev **WebSocket server on port 4206** with an SSE/`fetch` fallback
(`sources/tanstack/packages_event-bus_src_client_client.ts:66-101,161-232`). Production exclusion is
**two independent mechanisms**: a `process.env.NODE_ENV !== 'development'` ternary that folds to a
no-op class and tree-shakes the real client
(`sources/tanstack/packages_event-bus-client_src_index.ts:4-19`), plus a Vite plugin
`@tanstack/devtools:remove-devtools-on-build` that `transform`s devtools imports out of user source
on any non-serve/production build
(`sources/tanstack/packages_devtools-vite_src_plugin.ts:250-276`).

Grafana is the opposite end of the maturity curve and is worth reading as the "what it costs when
you take this seriously" case. A host declares an **extension point** by (a) listing its id under
`extensions.extensionPoints[]` in `plugin.json` and (b) calling `usePluginLinks` /
`usePluginComponents` / `usePluginFunctions` with that id; a plugin targets it via chainable
`AppPlugin.addComponent({ targets, title, description, component })` and must mirror the same
registration in `plugin.json` under `extensions.addedComponents[]`
(`sources/grafana/register-an-extension.html`, `sources/grafana/plugin-json.html`,
`sources/grafana/ui-extensions.html`). Compatibility is negotiated on **three separate axes**:
required semver `dependencies.grafanaDependency` in `plugin.json`; **version-suffixed ids**
(`myorg-foo-app/toolbar/v1`) as the actual breaking-change protocol, with old and new majors served
concurrently through a deprecation window; and a **runtime validation gate** that refuses to serve
extensions and returns an empty array when the id is malformed or the plugin.json meta info is
missing (`sources/grafana/src_validateExtensionPoint.ts:33-50`,
`sources/grafana/src_errors.ts:1-10`). Failure isolation is a per-extension React error boundary
that logs and renders `null` in production, only surfacing an alert in dev mode
(`sources/grafana/src_ExtensionErrorBoundary.tsx:22-40`). Ordering at a point is **plugin load order,
no priority API** (`registry[extensionPointId] = slice.concat(result)` —
`sources/grafana/src_AddedComponentsRegistry.ts:80-81`); collisions are only prevented for
uniquely-keyed *exposed* components, where a duplicate id is rejected outright
(`sources/grafana/src_ExposedComponentsRegistry.ts:56-59`). Isolation is a real, late-arriving
near-membrane child realm shipped as public preview in Grafana 11.5, opt-in per-plugin-id
(`sources/grafana/sandbox_README.md:5-25`, `sources/grafana/plugin-frontend-sandbox.html`).

The transferable lesson is that **almost all of Grafana's machinery exists because Grafana ships
third-party binaries into a multi-tenant host it does not control.** NetScript's DevTools
contribution family has first-party contributors in one workspace. The mechanisms worth copying are
the cheap, high-leverage ones — namespaced+versioned ids, declared contribution manifests, dev-mode
validation with an empty-array failure mode, per-panel error boundaries — and the expensive ones
(signing, sandboxing, capability grants, RBAC) are enterprise overhead NetScript should not pay for
at this stage.

---

## Findings

### TanStack Devtools

**F1 — The registration API is a plain array on a core class; there is no discovery or registry.**
`TanStackDevtoolsCore` takes `{ config?, plugins?: Array<TanStackDevtoolsPlugin>, eventBusConfig? }`
and stores `init.plugins || []`
(`sources/tanstack/packages_devtools_src_core.ts:8-36,50-57`). The documented example in that same
file is verbatim:

```ts
const devtools = new TanStackDevtoolsCore({
  plugins: [
    { id: "your-plugin-id", name: "Your Plugin", render: (el) => { /* ... */ } },
  ],
})
```

(`sources/tanstack/packages_devtools_src_core.ts:19-32`). *Observed.*

**F2 — The plugin contract is DOM-level, not framework-level.**
`TanStackDevtoolsPlugin` is
`{ name: string | ((el: HTMLHeadingElement, props) => void); id?: string; defaultOpen?: boolean;
render: (el: HTMLDivElement, props: TanStackDevtoolsPluginProps) => void; destroy?: (pluginId: string) => void }`
(`sources/tanstack/packages_devtools_src_context_devtools-context.tsx:21-77`). `render` receives a
mount element and returns `void` — the shell owns the DOM node, the plugin owns what goes in it.
This is what makes cross-framework panels possible at all. *Observed.*

**F3 — Multiple libraries contribute panels because the app author enumerates them, not because
anything auto-discovers.** Each library ships a panel component
(`ReactQueryDevtoolsPanel`, `TanStackRouterDevtoolsPanel`, `VueQueryDevtoolsPanel`, …) that the app
author places in the `plugins` array
(`sources/tanstack/packages_react-devtools_src_devtools.tsx:88-117` documents the shape;
the per-library panel names are from the quick-start docs, fetched via WebFetch of
`https://tanstack.com/devtools/latest/docs/framework/react/quick-start`). There is **no manifest, no
id-uniqueness enforcement across contributors, and no version negotiation** — `generatePluginId`
falls back to `${name.toLowerCase().replace(' ','-')}-${index}` when `id` is absent, i.e. identity is
positional (`sources/tanstack/packages_devtools_src_context_devtools-context.tsx:125-136`).
*Observed.*

**F4 — The React adapter is a portal bridge; the core is framework-agnostic.**
`TanStackDevtools` (React) maps each user plugin's `render` into a DOM callback that stashes the
container element in state, then `createPortal`s the React element into it
(`sources/tanstack/packages_react-devtools_src_devtools.tsx:174-216, 256-277`). Mount/unmount is
tied to `useEffect` with `devtools.mount(ref.current)` / `devtools.unmount()`
(`ibid.:241-247`). This is the exact pattern a Fresh/Preact adapter would need. *Observed.*

**F5 — The panel shell itself is lazily imported so the whole UI is a separate chunk.**
`mount()` does `import('./mount-impl').then(...)` behind an `AbortController`, and logs
`'[TanStack Devtools] Failed to load:'` on failure rather than throwing
(`sources/tanstack/packages_devtools_src_core.ts:59-92`). Mounting twice throws
`'Devtools is already mounted'` (`ibid.:62-64`). *Observed.*

**F6 — Production exclusion, mechanism 1: NODE_ENV ternary + tree-shake.**
Verbatim from the source, including its own comment:

```ts
const EventClient = (process.env.NODE_ENV !== 'development'
  ? EventClientNoOp
  : EventClientImpl) as unknown as typeof EventClientImpl
```

with the doc comment "Production bundlers replace `process.env.NODE_ENV` with a literal, fold this
ternary to `EventClientNoOp`, and tree-shake `./plugin` out of the bundle."
(`sources/tanstack/packages_event-bus-client_src_index.ts:4-19`). An explicit escape hatch exists:
`@tanstack/devtools-event-client/production` re-exports the real client
(`sources/tanstack/packages_event-bus-client_src_production.ts:1`). Note the polarity: the check is
`!== 'development'`, so anything that is not literally development is a no-op — safer default than
`=== 'production'`. *Observed.*

**F7 — Production exclusion, mechanism 2: a bundler transform that deletes call sites.**
The Vite plugin `@tanstack/devtools:remove-devtools-on-build` gates on
`(command !== 'serve' || config.mode === 'production') && removeDevtoolsOnBuild`, skips
`node_modules` and `?raw`, and only transforms files whose source mentions a known devtools package
(`sources/tanstack/packages_devtools-vite_src_plugin.ts:250-276`). The inline comment names the
motivation: "Some providers (Cloudflare, Netlify, Heroku) might not use 'build' command but will
always set mode to 'production'" (`ibid.:253-255`). *Observed.* — This is the important design point:
**they did not trust one signal.** Dead-code elimination is belt, source transform is braces.

**F8 — The data channel is a namespaced global EventTarget with a connect handshake and queueing.**
`EventClient#emit` builds `{ type: `${pluginId}:${suffix}`, payload, pluginId }` and dispatches
`CustomEvent('tanstack-dispatch-event', { detail })` on the global target
(`sources/tanstack/packages_event-bus-client_src_plugin.ts:176-232`). If not yet connected, events
are pushed to `#queuedEvents` and flushed on `tanstack-connect-success` (`ibid.:22-33, 213-224`).
Connection is `tanstack-connect` retried up to `#maxRetries = 5`, after which `#failedToConnect`
latches and emits become silent no-ops (`ibid.:14, 36-49, 215-218`). The global target is `window`
when present, else a fresh `EventTarget`, else a stub triple for React-Native
(`ibid.:124-152`). Subscription API is `on(suffix, cb, { withEventTarget? }) => unsubscribe`,
plus `onAll` and `onAllPluginEvents` listening on `'tanstack-devtools-global'`
(`ibid.:236-312`). *Observed.*

**F9 — There is a second hop: browser bus → dev WebSocket server, default port 4206, SSE fallback.**
`ClientEventBus` takes `ClientEventBusConfig` with `port?: number` defaulting to `4206`, holds a
`WebSocket | null`, queues while `CONNECTING`, and falls back to
`fetch('${protocol}://${host}:${port}/__devtools/send')` and an SSE endpoint `/__devtools/sse`
(`sources/tanstack/packages_event-bus_src_client_client.ts:35-51,66-101,134-165,224-232`). *Observed.*
This is how a devtools panel in the browser sees **server-side** events — directly relevant to any
NetScript DevTools design that wants runtime/worker/saga events from the Deno side.

**F10 — The Vite integration is a multi-plugin array with `enforce: 'pre'` and per-plugin `apply`
gates, including a dev-only server-side event handler.**
Named sub-plugins observed: `:inject-source`, `:config`, `:custom-server`,
`:remove-devtools-on-build`, `:event-client-setup`, `:better-console-logs`, `:console-pipe-transform`
(`sources/tanstack/packages_devtools-vite_src_plugin.ts:57,74,101,251,280,489,510`). The
`:event-client-setup` plugin refuses to run under CI or non-development NODE_ENV
(`ibid.:280-287`) and wires bidirectional actions from the panel back to the dev server — e.g. it
subscribes `devtoolsEventClient.on('install-devtools', …)` and actually installs a package, then
emits `'devtools-installed'` (`ibid.:294-305`). *Observed.* — Note the **capability implication**: a
devtools panel that can trigger package installs on the dev machine is a privileged channel. TanStack
gates that purely on "dev server only", with no per-plugin permission concept.

**F11 — No isolation, no trust boundary, no per-plugin failure containment in the core.**
Nothing in `core.ts`, the plugin type, or the React adapter wraps a plugin's `render` in a try/catch
or error boundary (`sources/tanstack/packages_devtools_src_core.ts` full file;
`sources/tanstack/packages_devtools_src_context_devtools-context.tsx:21-77`;
`sources/tanstack/packages_react-devtools_src_devtools.tsx` full file). A throwing panel takes down
the surrounding tree by default React semantics. *Inference* from the absence of any boundary in the
three files that own mounting — inferred FROM those files being the complete mount path
(`core.ts:59-92` → `mount-impl` → adapter portals). Unverified against `mount-impl.tsx`, which I did
not fetch; reading `packages/devtools/src/mount-impl.tsx` would settle it.

### Grafana plugin extensions

**F12 — A host declares an extension point twice: in `plugin.json` and at the call site.**
Manifest side, verbatim:

```json
{ "extensions": { "extensionPoints": [ { "id": "myorg-foo-app/toolbar/v1" } ] } }
```

Call site, verbatim:

```tsx
import { usePluginLinks } from '@grafana/runtime';
export const InstanceToolbar = () => {
  const extensionPointId = 'myorg-foo-app/toolbar/v1';
  const { links, isLoading } = usePluginLinks({ extensionPointId });
  return <div>{links.map(({ id, title, path, onClick }) => (
    <a href={path} title={title} key={id} onClick={onClick}>{title}</a>
  ))}</div>;
};
```

(`sources/grafana/register-an-extension.html`, fetched from
`https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/create-an-extension-point`).
The **double declaration is the whole compatibility story in miniature**: the manifest is the
statically auditable contract, the hook is the runtime consumer. *Observed.*

**F13 — Id namespacing is enforced, not conventional.**
Core points must be `grafana/`-prefixed; plugin points must be `{pluginId}/`-prefixed. The enforcement
lives in `isExtensionPointIdValid` behind `validateExtensionPoint`, and the error strings are
verbatim in source: `INVALID_EXTENSION_POINT_ID_PLUGIN`,
`INVALID_EXTENSION_POINT_ID_GRAFANA_PREFIX`, `INVALID_EXTENSION_POINT_ID_GRAFANA_EXPOSED`
(`sources/grafana/src_errors.ts:1-7`; `sources/grafana/src_validateExtensionPoint.ts:33-39`).
Exposed component ids carry the same rule plus an explicit version segment in the documented
example: `'myorg-basic-app/my-component-id/v1'`
(`sources/grafana/src_errors.ts:20-21`). *Observed.*

**F14 — The plugin-side API is four chainable `AppPlugin` methods.**
`addComponent({ targets, title, description, component })`, `addLink({ targets, title, description,
path?|onClick?, group?, icon?, openInNewTab?, configure? })`, `addFunction({ targets, title,
description, fn })`, `exposeComponent({ id, title, description, component })` — all returning
`AppPlugin` for chaining. `addComponent`/`addLink`/`exposeComponent` are ≥ v11.1.0; `addFunction` is
≥ v11.6.0 (`sources/grafana/ui-extensions.html`, fetched from
`https://grafana.com/developers/plugin-tools/reference/ui-extensions-reference/ui-extensions`).
*Observed.*

**F15 — The consumer-side API is four hooks with `limitPerPlugin` as the anti-spam control.**
`usePluginComponents({ extensionPointId, limitPerPlugin? }) → { components, isLoading }`,
`usePluginLinks({ extensionPointId, context?, limitPerPlugin? }) → { links, isLoading }`,
`usePluginFunctions({ extensionPointId, limitPerPlugin? }) → { functions, isLoading }`,
`usePluginComponent({ id }) → { component, isLoading }` (`sources/grafana/ui-extensions.html`).
`limitPerPlugin` is implemented as a per-`pluginId` counter that `continue`s past excess
contributions (`sources/grafana/src_usePluginComponents.tsx:37-55`). *Observed.* — This is the
**host's defence against one plugin flooding a point**, and it is ~8 lines of code.

**F16 — Versioning is done with version suffixes in ids, not semver on a protocol.**
"Each extension point ID/component ID should include a suffix indicating the major version of the
extension." Non-breaking additions need no new version; breaking changes require a new suffix; both
majors are served concurrently through a deprecation window; deprecations must be signalled via
`@deprecated`, changelogs, migration guides, and sunset timelines; Grafana-org plugins publish
versioned types to `@grafana/plugin-types` so consumers can import multiple versions without conflict
(WebFetch of
`https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/versioning-extensions`).
*Observed.* — Cheap and remarkably effective: the version lives in the string that already had to be
unique.

**F17 — Compatibility axis two: `dependencies.grafanaDependency` is a required semver range in
`plugin.json`.** Plus `dependencies.plugins[]` (`{id, type, name}`, external plugins only) and
`dependencies.extensions.exposedComponents[]` — "An array of exposed component ids that this plugin
depends on" (`sources/grafana/plugin-json.html`, fetched from
`https://grafana.com/developers/plugin-tools/reference/plugin-json`). *Observed.*
The doc does **not** state the runtime consequence of an unsatisfied `grafanaDependency`;
`sources/grafana/plugin-json.html` is silent on it. **Unverified** — reading the backend loader's
compatibility check (Go side, `pkg/plugins/…` version validation) would settle what a version
mismatch actually does to the plugin's load state.

**F18 — The negotiation failure mode is "return an empty array and log", not "throw".**
`validateExtensionPoint` returns `{ isLoading: false }` — which the hooks convert to
`{ components: [], isLoading: false }` — when the id is invalid or when the point is not recorded in
`plugin.json` (`sources/grafana/src_validateExtensionPoint.ts:33-50`;
`sources/grafana/src_usePluginComponents.tsx:27-34`). The error text says it outright: "The extension
point is not recorded in the `plugin.json` file… Returning an empty array of extensions."
(`sources/grafana/src_errors.ts:9-10`). *Observed.* — **The host degrades, it does not crash.**

**F19 — Validation strictness is dev-mode-gated, with an explicit stated intent to tighten later.**
Both the id check and the meta-info check are wrapped in `isGrafanaDevMode()`
(`sources/grafana/src_validateExtensionPoint.ts:34-47`), and the registry-side meta checks are
gated the same way (`sources/grafana/src_AddedComponentsRegistry.ts:52-58`). Several error strings
say verbatim: "Currently, this is only required in development but will be enforced also in
production builds in the future." (`sources/grafana/src_errors.ts:25-32,36-46`). *Observed.* —
This is the **adoption ramp**: turn the gate on in dev first, make it fatal later.

**F20 — Registration-time validation rejects individual bad contributions with `continue`, never
aborting the whole registry build.** Missing `title` → log + `continue`; missing plugin.json meta in
dev → `continue`; id not prefixed with pluginId (exposed) → `continue`; duplicate exposed id →
`continue` (`sources/grafana/src_AddedComponentsRegistry.ts:47-58`;
`sources/grafana/src_ExposedComponentsRegistry.ts:43-71`). Other rejection reasons in the error
catalogue: `INVALID_EXTENSION_FUNCTION` ("the `fn` argument is invalid"),
`INVALID_CONFIGURE_FUNCTION`, `INVALID_PATH_OR_ON_CLICK` ("Either `path` or `onClick` is required."),
`TITLE_NOT_MATCHING_META_INFO`, `DESCRIPTION_NOT_MATCHING_META_INFO`, `TARGET_NOT_MATCHING_META_INFO`
(`sources/grafana/src_errors.ts:12-46`). Note `TITLE_NOT_MATCHING_META_INFO` — **the runtime
registration must agree with the manifest, field by field.** *Observed.*

**F21 — Ordering at an extension point is load order; there is no priority or sort API.**
`registry[extensionPointId] = slice.concat(result)` with the comment "Creating a new array instead of
pushing to get a new reference" (`sources/grafana/src_AddedComponentsRegistry.ts:79-81`), iterating
`this.apps` in whatever order the app-plugin config arrives. Consumers iterate `registryItems` in
that order (`sources/grafana/src_usePluginComponents.tsx:39-55`). *Observed.* —
**Grafana never solved ordering.** They solved *volume* (`limitPerPlugin`) and *uniqueness for
singleton slots* (exposed components), and left multi-contributor ordering unspecified.

**F22 — Collisions are prevented only where the slot is a singleton.**
Added components/links/functions at a point are additive and freely collide (F21). Exposed
components are keyed by id and a second registrant is rejected: `if (registry[id]) { …
EXPOSED_COMPONENT_ALREADY_EXISTS; continue; }`
(`sources/grafana/src_ExposedComponentsRegistry.ts:56-59`; error text at
`sources/grafana/src_errors.ts:23`). **First registration wins.** *Observed.*

**F23 — Failure isolation is a per-extension React error boundary that renders `null` in production.**
`ExtensionErrorBoundary` logs `Extension "${pluginId}/${extensionTitle}" failed to load.` with the
component stack, and its fallback returns `<ExtensionErrorAlert/>` only when
`isGrafanaDevMode() || fallbackAlwaysVisible`, otherwise `null`
(`sources/grafana/src_ExtensionErrorBoundary.tsx:22-40`). Registered components are additionally
wrapped in `wrapWithPluginContext({ pluginId, extensionTitle, Component, log, pluginMeta })` at
registration time (`sources/grafana/src_AddedComponentsRegistry.ts:66-72`). *Observed.* —
**A broken third-party panel is invisible to end users and loud to developers.** This is the single
highest value-per-line mechanism in the whole system.

**F24 — Isolation: near-membrane child realms, arrived years after the plugin system, opt-in.**
The design doc is explicit about the intended primitive and the substitute: "The general idea of the
sandbox is javascript [shadow realms]… Sadly at the moment of writing this readme file, shadow realms
are still in a proposal stage… Instead we are using a library that implements a similar concept
called [near membrane]" (`sources/grafana/sandbox_README.md:5-15`). Sandboxed plugins are `fetch`ed,
pre-processed for sourcemaps/CDNs, and evaluated in a near-membrane virtual environment; unsandboxed
plugins load via SystemJS in the "incubator realm"
(`ibid.:17-25`). Grafana core receives an identical `pluginExport` either way (`ibid.:25-27`).
Code executed in the child realm always stays in the child realm (`ibid.:31-34`); React rendering,
contexts, and portals still work (`ibid.:36-41`); DOM access is constrained by "distortions"
(`ibid.:47-50`); error stacktraces gain sandbox layers (`ibid.:52-56`); and performance may degrade
"mostly those plugins that use web workers" (`ibid.:58-61`). Operationally it is public preview from
Grafana 11.5, configured **per plugin id** via `enable_frontend_sandbox_for_plugins` in the
`security` section, unsupported for Angular plugins, and not applied to Grafana-Labs-signed plugins
(`sources/grafana/plugin-frontend-sandbox.html`, fetched from
`https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-frontend-sandbox/`).
*Observed.* — **The lesson from not having one:** the sandbox is opt-in and arrived at 11.5, roughly
a decade into the plugin ecosystem, which means the ecosystem's real trust model for its entire
history was signing + "don't install plugins you don't trust." Sandboxing was retrofitted, and being
retrofitted it could not be made mandatory.

**F25 — The actual capability gate is signing, enforced at load, not a permission grammar.**
"If a plugin is unsigned, then Grafana neither loads nor starts it"; signature levels are
Private / Community / Commercial and determine distribution; unsigned plugins are unsupported in
Grafana Cloud; `allow_loading_unsigned_plugins` in the `[plugins]` section of `grafana.ini` is the
per-id escape hatch, and dev mode allows all unsigned plugins (WebSearch over
`grafana.com`, primarily
`https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-sign/`).
*Observed via search-result excerpts*; I did not fetch and save the signing page itself, so treat the
exact `grafana.ini` key placement as **unverified** pending a saved fetch of that URL.
There is **no per-extension capability declaration** — a plugin that loads has the ambient authority
of its realm; the only capability dials are (a) load/no-load via signing, (b) sandbox/no-sandbox via
`enable_frontend_sandbox_for_plugins`, (c) `limitPerPlugin` at each point. *Inference* from the
absence of any capability field across the whole `extensions` schema in
`sources/grafana/plugin-json.html` and the full API reference in `sources/grafana/ui-extensions.html`
— inferred FROM those two schema documents being exhaustive field listings.

---

## Applicability verdict for a NetScript DevTools contribution family

Framed as: adopt / adapt / decline, each tied to a finding.

### Adopt (cheap, high leverage, buys future optionality)

| Mechanism | Source | Why it fits NetScript now |
| --- | --- | --- |
| **Namespaced + version-suffixed contribution ids** (`@netscript/workers/panel/v1`) | F13, F16 | Costs one string convention. Buys the ability to ship a breaking panel contract later without a coordinated big-bang. Grafana got its entire compatibility story out of this one idea. |
| **Per-panel error boundary: log loud in dev, render `null` in prod** | F23 | The highest value-per-line mechanism observed anywhere in this corpus. Without it one bad plugin panel takes out the whole DevTools shell. TanStack does *not* have this (F11) and it is their most obvious gap. |
| **Declared contribution manifest, validated against runtime registration** | F12, F19, F20 | A plugin declares its panels in a manifest; the registry cross-checks title/target at registration. Gives static auditability (a doc/gate can read it) and catches typo'd extension point ids before a human does. |
| **Failure mode = empty list + logged error, never throw** | F18 | A DevTools surface that crashes the app it is debugging is worse than useless. |
| **Dev-only strictness with a documented tightening path** | F19 | Lets the contribution contract land soft and harden per release, which matches a 0.0.x framework. Copy the literal posture, not just the flag. |
| **Two independent production-exclusion mechanisms** | F6, F7 | A build-time transform *and* a `NODE_ENV`-folded no-op. TanStack explicitly distrusted a single signal because hosting providers set `command`/`mode` inconsistently — NetScript ships to Deno Deploy/containers/Aspire and will hit the same variance. |
| **DOM-mount plugin contract (`render(el) => void`) with a Preact/Fresh adapter** | F2, F4 | Keeps the shell framework-agnostic and lets a plugin panel be authored in whatever the plugin already uses. The React adapter's portal pattern (F4) is a direct template for a Fresh islands adapter. |
| **`limitPerPlugin`-style volume cap at each point** | F15 | ~8 lines. Prevents one chatty plugin from owning a surface. |

### Adapt (right idea, wrong size — take the shape, not the implementation)

| Mechanism | Source | NetScript-scale version |
| --- | --- | --- |
| **Namespaced event bus as the data channel** | F8, F9 | Adopt the `${pluginId}:${event}` namespacing, the queue-until-connected behaviour, and the bounded-retry-then-latch-silent semantics — those are genuinely load-bearing for a devtools channel that may connect before or after the panel. But NetScript should not reinvent a browser `EventTarget` + WebSocket-on-4206 + SSE-fallback triple stack; it should pick **one** server→browser transport and specify it, given the repo already has Aspire/OTel plumbing that a second ad-hoc dev socket would duplicate. |
| **Version-suffixed ids with concurrent-major deprecation windows** | F16 | Adopt the suffix. Do **not** commit to Grafana's multi-major concurrent-serving obligation at 0.0.x — state a one-major deprecation window and a changelog requirement, no more. |
| **Exposed-component style cross-plugin sharing** | F14, F22 | Interesting, but it is a second, distinct feature (plugin↔plugin) layered on the first (plugin↔host). Defer. If it lands, take the singleton-key + first-registration-wins collision rule verbatim (F22); it is the only collision semantics in this corpus that is actually specified. |
| **`grafanaDependency`-style host semver range** | F17 | NetScript plugins already live in one workspace with a shared version. A declared `netscriptDevtoolsApi` range is worth *recording in the manifest* for future out-of-tree plugins, but should not gate loading yet — and note the doc gap: even Grafana does not document the unsatisfied-dependency failure mode (F17, unverified). |

### Decline (enterprise overhead NetScript should not pay for at this stage)

| Mechanism | Source | Why not |
| --- | --- | --- |
| **Frontend sandboxing / near-membrane child realms** | F24 | Grafana needed it because it loads third-party binaries into a multi-tenant host. NetScript DevTools contributions are first-party packages in the same workspace, already trusted at the `import` level — a sandbox would add measurable cost (F24: web-worker perf degradation, layered stacktraces) to defend a boundary that does not exist. Note Grafana itself shipped this ~a decade in, opt-in, and could not make it mandatory. |
| **Plugin signing / signature levels / unsigned-load gates** | F25 | Presupposes a plugin marketplace and untrusted distribution. NetScript has neither. |
| **A capability/permission grammar per extension** | F25 | Grafana does not even have one — the dial is load/no-load. Inventing one before there is an untrusted contributor is speculative design. |
| **Runtime meta-info enforcement in production builds** | F19 | Grafana's own error strings say this is aspirational ("will be enforced also in production builds in the future"). Dev-mode enforcement is the shipped state and is sufficient. |

### The one gap both systems leave open, which NetScript must decide itself

**Ordering.** Neither system solved it. Grafana concats in load order with no priority API (F21);
TanStack's identity is literally positional-index-based when `id` is omitted (F3). If NetScript's
DevTools shell has a tab strip whose order is user-visible, "load order" is a non-answer — the plan
should specify either an explicit `order?: number` on the contribution or a host-owned canonical
ordering, and should say which. This is the clearest place where copying the market leaves a hole.

---

## Contracts

Named shapes an RFC would have to consume or mirror. All verbatim-derived from cited sources.

```ts
// TanStack — sources/tanstack/packages_devtools_src_context_devtools-context.tsx:21-77
interface TanStackDevtoolsPlugin {
  name: string | ((el: HTMLHeadingElement, props: TanStackDevtoolsPluginProps) => void)
  id?: string
  defaultOpen?: boolean
  render: (el: HTMLDivElement, props: TanStackDevtoolsPluginProps) => void
  destroy?: (pluginId: string) => void
}

// TanStack — sources/tanstack/packages_devtools_src_core.ts:8-36
interface TanStackDevtoolsInit {
  config?: Partial<TanStackDevtoolsConfig>
  plugins?: Array<TanStackDevtoolsPlugin>
  eventBusConfig?: ClientEventBusConfig
}
class TanStackDevtoolsCore {
  constructor(init: TanStackDevtoolsInit)
  mount<T extends HTMLElement>(el: T): void   // throws if already mounted
  unmount(): void                             // throws if not mounted
  setConfig(config: Partial<TanStackDevtoolsInit>): void
}

// TanStack — sources/tanstack/packages_event-bus-client_src_types.ts:1-12
interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName          // `${pluginId}:${eventSuffix}`
  payload: TPayload
  pluginId?: string
}

// TanStack — sources/tanstack/packages_event-bus-client_src_plugin.ts:7,63-70,186-232,236-312
class EventClient<TEventMap extends Record<string, any>> {
  constructor(o: { pluginId: string; debug?: boolean; enabled?: boolean; reconnectEveryMs?: number })
  emit<E extends keyof TEventMap & string>(eventSuffix: E, payload: TEventMap[E]): void
  on<E extends keyof TEventMap & string>(
    eventSuffix: E,
    cb: (e: TanStackDevtoolsEvent<E, TEventMap[E]>) => void,
    options?: { withEventTarget?: boolean },
  ): () => void
  onAll(cb: (e: TanStackDevtoolsEvent<string, any>) => void): () => void
  onAllPluginEvents(cb: (e: AllDevtoolsEvents<TEventMap>) => void): () => void
  getPluginId(): string
}
```

```ts
// Grafana plugin-side — sources/grafana/ui-extensions.html
AppPlugin
  .addComponent({ targets: string[]; title: string; description: string; component: React.ComponentType })
  .addLink({ targets: string[]; title: string; description: string;
             path?: string; onClick?: Function; group?: { name: string; icon?: IconName };
             icon?: string; openInNewTab?: boolean; configure?: Function })
  .addFunction({ targets: string[]; title: string; description: string; fn: Function })   // >=11.6.0
  .exposeComponent({ id: string; title: string; description: string; component: React.ComponentType })

// Grafana host-side — sources/grafana/ui-extensions.html, src_usePluginComponents.tsx:18-62
usePluginComponents<P>({ extensionPointId: string; limitPerPlugin?: number })
  : { components: ComponentTypeWithExtensionMeta<P>[]; isLoading: boolean }
usePluginLinks({ extensionPointId: string; context?: object; limitPerPlugin?: number })
  : { links: PluginExtensionLink[]; isLoading: boolean }
usePluginFunctions({ extensionPointId: string; limitPerPlugin?: number })
  : { functions: PluginExtensionFunction[]; isLoading: boolean }
usePluginComponent({ id: string }): { component: React.ComponentType | undefined | null; isLoading: boolean }
```

```jsonc
// Grafana manifest — sources/grafana/plugin-json.html, sources/grafana/register-an-extension.html
{
  "dependencies": {
    "grafanaDependency": ">=11.1.0",                 // required, semver range
    "plugins": [{ "id": "...", "type": "...", "name": "..." }],
    "extensions": { "exposedComponents": ["other-plugin/thing/v1"] }
  },
  "extensions": {
    "extensionPoints":   [{ "id": "myorg-foo-app/toolbar/v1" }],
    "addedComponents":   [{ "targets": ["grafana/user/profile/tab"], "title": "…(min 10 chars)", "description": "…" }],
    "addedLinks":        [{ "targets": ["…"], "title": "…", "description": "…" }],
    "addedFunctions":    [{ "targets": ["…"], "title": "…", "description": "…" }],
    "exposedComponents": [{ "id": "{PLUGIN_ID}/component-name/v1", "title": "…", "description": "…" }]
  }
}
```

---

## Drift candidates

Places where a commonly-carried belief does not match what the sources actually say. These are drift
against *assumptions likely to enter the RFC*, not against NetScript repo state — I made no repo
claims in this corpus.

| Expected | Actual | Evidence | Severity |
| --- | --- | --- | --- |
| TanStack Devtools has a plugin *registry* that libraries register into | It has a literal array the app author writes; libraries export panel components and nothing auto-discovers | `sources/tanstack/packages_devtools_src_core.ts:50-57`; `…devtools-context.tsx:125-136` | architectural |
| Grafana solved multi-plugin ordering at an extension point | No ordering/priority API; plain `concat` in plugin load order | `sources/grafana/src_AddedComponentsRegistry.ts:79-81` | significant |
| Grafana's extension system has a capability/permission model | It has signing (load/no-load), opt-in sandboxing, and `limitPerPlugin`. No per-extension capability declaration exists in the manifest schema or API reference | `sources/grafana/plugin-json.html`; `sources/grafana/ui-extensions.html`; `sources/grafana/plugin-frontend-sandbox.html` | architectural |
| Grafana's sandbox is the plugin system's trust boundary | Public preview from 11.5, opt-in per plugin id, excludes Angular and Grafana-Labs-signed plugins — retrofitted, not foundational | `sources/grafana/sandbox_README.md:5-25`; `sources/grafana/plugin-frontend-sandbox.html` | architectural |
| Grafana's manifest requirements are enforced in production | Every meta-info check is `isGrafanaDevMode()`-gated; error text says production enforcement is future work | `sources/grafana/src_validateExtensionPoint.ts:34-47`; `sources/grafana/src_errors.ts:25-32,36-46` | significant |
| Production exclusion of devtools is a single `NODE_ENV` check | Two mechanisms: NODE_ENV-folded no-op class *and* a bundler `transform` that strips call sites, gated on `command !== 'serve' \|\| mode === 'production'` because providers set these inconsistently | `sources/tanstack/packages_event-bus-client_src_index.ts:4-19`; `sources/tanstack/packages_devtools-vite_src_plugin.ts:250-276` | significant |
| A devtools event channel is read-only telemetry | TanStack's dev-server plugin accepts `install-devtools` from the panel and installs npm packages on the dev machine | `sources/tanstack/packages_devtools-vite_src_plugin.ts:280-305` | significant |

---

## Open questions

1. **TanStack per-plugin failure containment** — F11 is an inference from three files. Fetch
   `packages/devtools/src/mount-impl.tsx` and the Solid shell components to confirm no error boundary
   wraps a plugin `render`.
2. **Grafana's unsatisfied-`grafanaDependency` runtime behaviour** — F17 unverified. The Go-side
   plugin loader compatibility check (`pkg/plugins/…`) would settle whether the plugin fails to load,
   loads with a warning, or is filtered from the catalogue.
3. **Grafana signing enforcement details** — F25 rests on search-result excerpts, not a saved fetch.
   Save `https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-sign/` and
   confirm the exact `grafana.ini` section/key for `allow_loading_unsigned_plugins`.
4. **Ordering decision for NetScript** — neither system provides a model. Does the NetScript DevTools
   shell need deterministic, user-visible tab order? If yes, this is net-new design with no market
   precedent to copy.
5. **Server→browser transport** — TanStack runs a dedicated dev WebSocket on 4206 with SSE fallback
   (F9). Does NetScript already have a dev-time channel (Fresh dev server, Aspire/OTel) that a
   DevTools event stream should ride rather than duplicate? Requires a repo-side answer from a
   sibling stage-B topic.
6. **Manifest home** — Grafana's contribution manifest is `plugin.json` (F12). What is NetScript's
   equivalent declaration surface for a plugin's DevTools panels, and does an existing plugin
   manifest/registry already exist to extend? Repo-side question, out of scope for this topic.
7. **`limitPerPlugin` analogue** — is per-plugin volume capping meaningful when contributors are
   first-party, or is it pure ceremony at NetScript's scale? Adopt-list placement (F15) is a
   judgement call worth an explicit decision.
8. **Cross-plugin component sharing** — is the `exposeComponent` plugin↔plugin axis (F14, F22) in
   scope for the RFC at all, or explicitly deferred? Deferring it should be stated, not omitted.

---

## Sources

### Saved artifacts — TanStack (`sources/tanstack/`, fetched from `TanStack/devtools@main`)

| Saved path | Upstream |
| --- | --- |
| `packages_devtools_src_core.ts` | `packages/devtools/src/core.ts` |
| `packages_devtools_src_index.ts` | `packages/devtools/src/index.ts` |
| `packages_devtools_src_context_devtools-context.tsx` | `packages/devtools/src/context/devtools-context.tsx` |
| `packages_react-devtools_src_devtools.tsx` | `packages/react-devtools/src/devtools.tsx` |
| `packages_event-bus-client_src_index.ts` | `packages/event-bus-client/src/index.ts` |
| `packages_event-bus-client_src_plugin.ts` | `packages/event-bus-client/src/plugin.ts` |
| `packages_event-bus-client_src_production.ts` | `packages/event-bus-client/src/production.ts` |
| `packages_event-bus-client_src_types.ts` | `packages/event-bus-client/src/types.ts` |
| `packages_event-bus_src_client_client.ts` | `packages/event-bus/src/client/client.ts` |
| `packages_devtools-vite_src_plugin.ts` | `packages/devtools-vite/src/plugin.ts` |

Package inventory (`packages/`) obtained via
`GET https://api.github.com/repos/TanStack/devtools/contents/packages`: `angular-devtools`,
`devtools-a11y`, `devtools-bundler-core`, `devtools-client`, `devtools-rspack`, `devtools-ui`,
`devtools-utils`, `devtools-vite`, `devtools`, `event-bus-client`, `event-bus`, `preact-devtools`,
`react-devtools`, `solid-devtools`, `svelte-devtools`, `vue-devtools`.

### Saved artifacts — Grafana (`sources/grafana/`, fetched from `grafana/grafana@main` + grafana.com)

| Saved path | Upstream |
| --- | --- |
| `src_ExtensionErrorBoundary.tsx` | `public/app/features/plugins/extensions/ExtensionErrorBoundary.tsx` |
| `src_validateExtensionPoint.ts` | `public/app/features/plugins/extensions/validateExtensionPoint.ts` |
| `src_errors.ts` | `public/app/features/plugins/extensions/errors.ts` |
| `src_usePluginComponents.tsx` | `public/app/features/plugins/extensions/usePluginComponents.tsx` |
| `src_AddedComponentsRegistry.ts` | `public/app/features/plugins/extensions/registry/AddedComponentsRegistry.ts` |
| `src_ExposedComponentsRegistry.ts` | `public/app/features/plugins/extensions/registry/ExposedComponentsRegistry.ts` |
| `sandbox_README.md` | `public/app/features/plugins/sandbox/README.md` |
| `ui-extensions.html` | `https://grafana.com/developers/plugin-tools/reference/ui-extensions-reference/ui-extensions` |
| `ui-extensions-concepts.html` | `https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/ui-extensions-concepts` |
| `register-an-extension.html` | `https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/register-an-extension` |
| `expose-a-component.html` | `https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/expose-a-component` |
| `plugin-json.html` | `https://grafana.com/developers/plugin-tools/reference/plugin-json` |
| `plugin-frontend-sandbox.html` | `https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-frontend-sandbox/` |

Extensions source inventory obtained via
`GET https://api.github.com/repos/grafana/grafana/contents/public/app/features/plugins/extensions`
and `.../extensions/registry` and `.../plugins/sandbox`.

### URLs fetched but not saved as files (WebFetch/WebSearch, cited inline where used)

- `https://tanstack.com/devtools/latest/docs/framework/react/quick-start` — per-framework component
  and panel names (F3).
- `https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/create-an-extension-point`
  — host extension-point declaration + `usePluginLinks` example (F12).
- `https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/versioning-extensions`
  — versioning strategy (F16).
- `https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-sign/`
  — signature levels, via WebSearch excerpts only; **not saved, treat as unverified** (F25).

### Not verified

- `packages/devtools/src/mount-impl.tsx` (TanStack) — not fetched; bears on F11.
- Grafana Go-side plugin loader version-compatibility check — not fetched; bears on F17.
