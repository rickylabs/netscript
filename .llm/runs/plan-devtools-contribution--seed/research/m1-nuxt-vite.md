# market:nuxt-vite — Nuxt DevTools & Vite DevTools / vite-plugin-inspect architecture teardown

Stage-B discovery corpus for the NetScript DevTools Contribution Architecture RFC
(run `plan-devtools-contribution--seed`). Planning-only; no source was modified.

All citations are either (a) a path under
`.llm/runs/plan-devtools-contribution--seed/research/sources/` that I fetched and saved during
this run, or (b) a repo path + line range in this worktree. Saved-source paths below are
abbreviated as `sources/<file>`; the full prefix is
`.llm/runs/plan-devtools-contribution--seed/research/sources/`.

## Summary

The single most load-bearing observation is that **the two "closest analogues" have merged**. As
of Nuxt DevTools v4, Nuxt no longer owns a devtools shell at all: its floating panel is removed,
Vite DevTools integration is *always* enabled, and Nuxt DevTools ships as a **dock entry nested
under a `Nuxt` group inside the Vite DevTools panel**
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:283-314`). Every Nuxt-specific
contribution primitive — `addCustomTab()`, `extendServerRpc()`, `startSubprocess()`,
`refreshCustomTabs()`, direct `nuxt.devtools.rpc` access — is soft-deprecated with a coded
diagnostic (`NDT_DEP_0003`–`NDT_DEP_0007`) in favour of the generic Vite DevTools hosts
`ctx.docks` / `ctx.rpc` / `ctx.terminals` / `ctx.messages` / `ctx.commands`
(`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:42-263`).

The surviving architecture is: a **Vite plugin with one extra hook, `devtools.setup(ctx)`**, is
the unit of contribution (`sources/vite-devtools__docs_kit_devtools-plugin.md:7,36-67`). The shell
is mounted either embedded (client script injected via `transformIndexHtml`, dev-server only,
top-level windows only) or standalone (a separate page)
(`sources/vite-devtools__docs_kit_client-context.md:11-38`;
`sources/vite-devtools__docs_guide_index.md:45-102`). Contributed views are, by default,
**iframes served by the devtools host from a static dist** (`ctx.views.hostStatic()` +
`ctx.docks.register({type:'iframe'})`) — five other dock types exist (`action`, `custom-render`,
`launcher`, `json-render`, `group`), each with a different isolation posture
(`sources/vite-devtools__docs_kit_dock-system.md:11-19`). Data flows over a **named, namespaced,
bidirectional RPC** whose type safety comes from TypeScript module augmentation of
`DevToolsRpcServerFunctions` / `DevToolsRpcClientFunctions`, with optional Valibot runtime schemas
(`sources/vite-devtools__docs_kit_rpc.md:27-45,310-343,498-535`).

Production behaviour is the sharpest lesson: this stack is **not** "stripped in prod" — it is
"re-targeted". Dev mode is live RPC over WebSocket; build mode is a *static dump* where RPC results
are pre-computed at build time into `__rpc-dump/*.json` and the client reads files instead of
calling (`sources/vite-devtools__docs_kit_rpc.md:116-207`). That forces a design constraint on every
contributor: `type: 'static'` functions and `dump.inputs`/`dump.fallback` for queries, otherwise the
panel is dev-only. And in build mode **client auth is disabled by construction** (`DTK0008`,
`sources/vite-devtools__docs_errors_DTK0008.md:13-19`).

The regret list is unusually explicit and therefore unusually cheap to learn from: Nuxt built a
bespoke shell, a bespoke RPC namespace mechanism, a bespoke subprocess/terminal system, a bespoke
VS Code integration, and a global-install mode — and deprecated or deleted **all five** in v4
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:6-35,37-133,151-281`).
`vite-plugin-inspect` made the same move at v12: its standalone `/__inspect/` route disappeared and
it became a panel inside Vite DevTools (`sources/vite-plugin-inspect__README-v11.md:35` vs
`sources/vite-plugin-inspect__README.md:11-35`).

For NetScript the hard blocker is versioned, not conceptual: Vite DevTools requires **Vite 8**
(`@nuxt/devtools` narrowed `peerDependencies.vite` from `>=6.0` to `^8.0.14`,
`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:287-289`; vite-plugin-inspect v12
requires Vite ≥8 + `@vitejs/devtools` ≥0.4.0, `sources/vite-plugin-inspect__README.md:11-15`),
while this repo pins **Vite 7.2.2** (`deno.json:248`, `packages/fresh/deno.json:56`). Adoption of
the kit is therefore not available today; adoption of its *contract shapes* is.

## Findings

### F1 — Nuxt DevTools no longer owns its shell; it is a dock entry in Vite DevTools
`observed`. "The `viteDevTools` module option has been removed. Nuxt DevTools now always integrates
with Vite DevTools as a dock entry, nested under a `Nuxt` framework group. The built-in floating
panel has been removed — DevTools is accessed through the Vite DevTools panel instead."
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:283-286`). The `Shift+Alt+D`
shortcut now toggles the Nuxt entry *inside* the Vite panel
(ibid.`:316-324`), and `client.devtools.open()/close()/toggle()` now control the Vite panel
(ibid.`:316-322`).

### F2 — The contribution unit is a Vite plugin with a `devtools.setup(ctx)` hook
`observed`. "A DevTools plugin is a Vite plugin with one extra hook: `devtools.setup(ctx)`. The hook
receives the kit-augmented context (`KitNodeContext`) — RPC, views, and the four hub subsystems Kit
owns: `docks`, `terminals`, `messages`, `commands`."
(`sources/vite-devtools__docs_kit_devtools-plugin.md:7`). Type augmentation is opt-in via a
triple-slash reference: `/// <reference types="@vitejs/devtools-kit" />`
(ibid.`:33-36`). `devtools.setup` "runs once during Vite server initialization, when DevTools is
enabled" (ibid.`:67`) — i.e. the hook is *not called at all* when devtools are off, which is the
dev-only-by-construction mechanism at the registration layer.

### F3 — Six dock entry types, each a different isolation posture
`observed`. `iframe` | `action` | `custom-render` | `launcher` | `json-render` | `group`
(`sources/vite-devtools__docs_kit_dock-system.md:11-19`). Explicitly: iframe "stays isolated from
the user's app and works with any framework" (ibid.`:24`); `custom-render` renderers "paint directly
into the DevTools panel DOM… want to skip iframe isolation" (ibid.`:251`); `action` scripts "run in
the user's browser" (ibid.`:184`); `json-render` needs *no client code at all* — "describe a UI as a
JSON spec on the server — the client renders it from a built-in component library… the shortest path
to a DevTools panel: server-side TypeScript only" (ibid.`:426`).

### F4 — Contributed iframe UIs are hosted by the devtools host, not by the contributor
`observed`. `ctx.views.hostStatic('/__my-plugin/', clientPath)` + a dock entry whose `url` points at
that path; "DevTools handles dev-server middleware and copies the static files into the output
directory at build time" (`sources/vite-devtools__docs_kit_devtools-plugin.md:115-144`;
`sources/vite-devtools__docs_kit_dock-system.md:38-61`). Contrast the *old* Nuxt model: "Currently
the only way to contribute to Nuxt DevTools View is via iframe. **You need to serve your module's
view yourself**" (`sources/nuxt-devtools__docs_content_2.module_0.guide.md:20`). The shift from
"contributor serves it" to "host serves it" is the notable delta.

### F5 — RPC is namespaced-by-string, typed by module augmentation, optionally schema-validated
`observed`. `defineRpcFunction({ name: 'my-plugin:get-modules', type: 'query', setup: ctx => ({ handler }) })`
(`sources/vite-devtools__docs_kit_rpc.md:27-45`). Naming convention: "Scope each function with your
package prefix and use kebab-case" (ibid.`:49`). Four function types with different caching:
`query` (cached, manual dump), `static` (cached indefinitely, auto dump), `action` (no cache),
`event` (no response) (ibid.`:53-59`). Type safety is `declare module '@vitejs/devtools-kit' { interface DevToolsRpcServerFunctions { … } }`
(ibid.`:504-535`) — i.e. **structural, compile-time, and not enforced at the wire**. Optional
runtime validation via Valibot `args`/`returns` (ibid.`:310-343`).

### F6 — Server→client is `broadcast`; client registers named functions the server may call
`observed`. `ctx.rpc.broadcast({ method: 'my-plugin:highlight-element', args: ['#app'] })`
"sends an event-style call to every connected client and resolves once dispatch completes"
(`sources/vite-devtools__docs_kit_rpc.md:480-496`); the client side registers via
`ctx.rpc.client.register({ name, type: 'action', handler })` (ibid.`:460-478`). Nuxt's legacy
equivalent was a namespace-scoped pair, `extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {...})`
on the server and `client.devtools.extendClientRpc(RPC_NAMESPACE, {...})` in the iframe
(`sources/nuxt-devtools__docs_content_2.module_0.guide.md:145-189`) — a *generic-parameterised
namespace* rather than a flat prefixed name. Nuxt's is now deprecated in favour of the flat form
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:151-177`).

### F7 — Three distinct ways a contributed client obtains an RPC client, by surface
`observed`. Iframe page: `const rpc = await getDevToolsRpcClient()` — "the connection details are
discovered automatically from the parent window"
(`sources/vite-devtools__docs_kit_rpc.md:349-365`; `sources/vite-devtools__docs_kit_client-context.md:80`).
Action/renderer script: `ctx.rpc` handed in as the argument
(`sources/vite-devtools__docs_kit_rpc.md:367-380`). Arbitrary host-page code:
`getDevToolsClientContext()`, "returns `undefined` until the client script finishes initializing"
(`sources/vite-devtools__docs_kit_client-context.md:55-65`).

### F8 — Embedded client injection is dev-only, client-only, and top-frame-only by construction
`observed`. "Injection is scoped to where the embedded client makes sense: **Dev server only** —
`vite build` uses the standalone client instead… **Client environments only** — SSR builds and
server code stay untouched… **Top-level windows only** — inside an iframe (including DevTools' own
iframe panels) the script logs `[VITE DEVTOOLS] Skipping in iframe` and exits, so a page never
mounts a second dock." (`sources/vite-devtools__docs_kit_client-context.md:34-38`). The mechanism is
`transformIndexHtml` appending `import "virtual:vite-devtools-injection"`
(ibid.`:20-32`).

### F9 — The injection mechanism *fails silently* for backend-integration / middleware-mode / JS-entry apps
`observed`. "Injection rides on Vite's `transformIndexHtml` hook, so it requires an HTML page that
Vite itself serves and transforms. Setups where the HTML comes from elsewhere skip it: Backend
integration… Middleware mode… JS-only entries" — the fix is a manual
`import '@vitejs/devtools/client/inject'`, and the prod-safety guard is the *user's* responsibility:
`if (import.meta.env.DEV) import('@vitejs/devtools/client/inject')`
(`sources/vite-devtools__docs_kit_client-context.md:86-105`). This is directly relevant to NetScript:
a Fresh/Deno app that does not hand Vite the HTML falls into exactly this hole.

### F10 — Production/build behaviour is "re-target to a static dump", not "strip"
`observed`. Build mode has no live server; `dumpFunctions()` runs each RPC handler with predefined
arguments at build time, results land in `__rpc-dump/index.json` plus sharded `__rpc-dump/*.json`,
and "the static client reads from those files instead of making live RPC calls"; shard keys replace
`:` with `~` (`sources/vite-devtools__docs_kit_rpc.md:116-127`). `build.withApp: true` writes the
DevTools static output into the app's build directory
(`sources/vite-devtools__docs_guide_index.md:138-163`). Contributor obligation is spelled out:
prefer `type: 'static'`, compute in `setup` not in the handler, define `dump` with `inputs` and
`fallback` (`sources/vite-devtools__docs_kit_rpc.md:172-205`).

### F11 — Client auth exists, and is disabled in build mode by design
`observed`. `DTK0008`: "Client authentication is disabled. Any browser can connect to the devtools
and access your server and filesystem." Triggered when `context.mode === 'build'`, or
`devtools.config.clientAuth === false`, or `VITE_DEVTOOLS_DISABLE_CLIENT_AUTH=true`; when disabled
"every connecting WebSocket client is automatically marked as trusted (`meta.isTrusted = true`),
bypassing the token-based auth flow entirely"
(`sources/vite-devtools__docs_errors_DTK0008.md:13-19,46-50`). Nuxt has its own, older per-tab
gate: `ModuleCustomTab.requireAuth?: boolean` — "Require local authentication to access the tab.
It's highly recommended to enable this if the tab have sensitive information or have access to the
OS" (`sources/nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts:33-39`), backed by
`requestForAuth` / `verifyAuthToken` server RPCs
(`sources/nuxt-devtools__packages_devtools-kit_src__types_client-api.ts:82-84`).

### F12 — Remote-hosted contributed UIs get a pre-approved, session-scoped, origin-locked token in the URL
`observed`. `remote: true` on an iframe dock makes DevTools "allocate a session-only, pre-approved
auth token for that dock", inject a base64url descriptor
(`{ v: 1, backend: 'websocket', websocket, authToken, origin }`) into the iframe `src`, and accept it
on the WS handshake after `Origin` verification
(`sources/vite-devtools__docs_kit_remote-client.md:19-25,163-179`). Token properties: pre-approved
(no interactive prompt — "the user agreed to the integration when they installed the plugin"),
session-scoped, revoked on re-`register()` (live clients get `devframe:auth:revoked`), origin-locked
by default (ibid.`:186-194`). Default transport is the URL **fragment** precisely because fragments
"don't reach servers, don't enter access logs, and get stripped from `Referer`" (ibid.`:88`); the
`query` transport carries an explicit warning (ibid.`:91-92`).

### F13 — Nuxt's same-origin iframe injection is the legacy trust model
`observed`. "When the iframe been served with the same origin (CORS limitation), devtools will
automatically inject `__NUXT_DEVTOOLS__` to the iframe's window object"
(`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:300`). The iframe client thereby gets
`host` (the real app's Vue instance — e.g.
`devtoolsClient.value?.host?.nuxt.vueApp.config.globalProperties?.$router`, ibid.`:338`) and
`devtools`. "`host` can be undefined when devtools are accessed standalone or from a different
origin" (ibid.`:333`). So Nuxt's contributed iframe is *not* sandboxed from the app: same-origin
grants it live object access to the running application.

### F14 — Iframe permissions are an allowlist merged onto defaults
`observed`. "By default, iframes have `clipboard-write` and `clipboard-read` permissions enabled. You
can add additional permissions using the `permissions` option… merged with the default ones and set
on the iframe's `allow` attribute" (`sources/nuxt-devtools__docs_content_2.module_0.guide.md:62-75`;
type at `sources/nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts:71-77`). Notably
there is **no `sandbox` attribute** documented — the isolation is origin/frame-level, not
sandbox-level.

### F15 — "Lazy launch" is a first-class state, not an afterthought
`observed`. Nuxt's `ModuleLaunchView` renders a card with action buttons whose `handle()` "is
executed on the server side. Will automatically refresh the tabs after the action is resolved"
(`sources/nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts:42-54,93-115`;
narrative at `sources/nuxt-devtools__docs_content_2.module_0.guide.md:79-119`). Vite DevTools
generalises it into the `launcher` dock type with `onLaunch`, a bound `command` id,
`terminalSessionId` for a "View in Terminal" action, and an author-set `digest` status line
(`sources/vite-devtools__docs_kit_dock-system.md:86-100,318-380`), plus a `createProcessLauncher`
helper that swaps the card for an iframe once `serve.onReady` resolves a URL and swaps it *back*
when the process exits, "so the embedded UI never points at a dead server" (ibid.`:382-422`).
Vite DevTools' own built-in integrations are advertised as launchers that install their package on
demand (`sources/vite-devtools__docs_guide_index.md:13`).

### F16 — Visibility/ordering/grouping is declarative data on the entry, not shell code
`observed`. Base fields on every dock type: `id`, `title`, `icon` (Iconify name | URL | data URI |
light/dark pair), `category` (`app`|`framework`|`web`|`advanced`|`default`), `defaultOrder`, `when`
(a visibility *expression* string), `visibility` (render-only counterpart), `badge`, `groupId`
(`sources/vite-devtools__docs_kit_dock-system.md:554-568`). Group semantics: "Membership is a flat
pointer, not containment… A member whose `groupId` references a group that was never registered
renders as a normal top-level entry, and a group with no members stays hidden until an entry joins
it. Grouping is one level deep" (ibid.`:495`). `category` is overloaded: outer bucket at top level,
in-group sub-category when grouped (ibid.`:499`).

### F17 — Live mutation of a contribution is via a returned handle, not re-running a hook
`observed`. "`register()` returns a handle with an `update(patch)` method" —
`handle.update({ badge: '3' })` (`sources/vite-devtools__docs_kit_dock-system.md:570-579`). This
explicitly replaces Nuxt's re-evaluate-the-hook model: `refreshCustomTabs()` /
`devtools:customTabs:refresh` is deprecated `NDT_DEP_0006` because "with the docks host you no
longer re-run a hook to refresh — update the dock entry directly via the handle"
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:232-244`).

### F18 — Cross-plugin server-side composition is an explicit local-invoke API, not HTTP
`observed`. `context.rpc.invokeLocal('<package-name>:list-files')` is the documented way to call
another RPC function server-side, "rather than network-style calls"
(`sources/vite-devtools__docs_kit_rpc.md:286-306`). Plugin-scoped state is a `WeakMap` keyed by
`ViteDevToolsNodeContext` "rather than mutated onto the base DevTools context"
(ibid.`:208-284,382-448`). This is a deliberate anti-pattern guard: *do not let contributors mutate
the shared context object*.

### F19 — There is no wire-level version negotiation of the contribution contract
`inference` (from `sources/vite-devtools__MIGRATION.md` in full and
`sources/vite-devtools__docs_kit_rpc.md:498-535`). Evidence it is inferred from: contract
compatibility is managed entirely by (a) TypeScript module augmentation, (b) package semver with a
hand-written migration guide, and (c) coded diagnostics. `MIGRATION.md` documents renames that break
imports (`DevToolsNodeContext` → `ViteDevToolsNodeContext`, `DevToolsLog*` → `DevToolsMessage*`,
`ctx.logs` → `ctx.messages`, `devframe/node/internal` → `devframe/node/hub-internals`) with no
compatibility shim beyond removal notes (`sources/vite-devtools__MIGRATION.md:37-103`). The only
versioned wire artifact I found is the remote connection descriptor's `v: 1`
(`sources/vite-devtools__docs_kit_remote-client.md:169`). Unverified: whether the WS protocol itself
carries a version handshake — verifying would require reading
`packages/core/src/node/ws.ts` in `vitejs/devtools`.

### F20 — The 0.2→0.3 rename forced a user-visible re-auth
`observed`. "The anonymous-auth RPC scope moved from `vite:anonymous:` to `devframe:anonymous:` and
the WebSocket auth-token query parameter from `vite_devtools_auth_token` to `devframe_auth_token`…
Auth tokens stored by older clients become invalid — users re-authorize once on first connect after
upgrading." Simultaneously "`DTK0050`–`DTK0057` retire. These dock/terminal/command diagnostic codes
now ship from `@devframes/hub` as `DF8100`–`DF8403`"
(`sources/vite-devtools__MIGRATION.md:8-12`). Lesson: identifier namespaces that leak into stored
client state (tokens, diagnostic codes) become migration liabilities.

### F21 — Contribution failure modes are documented as *degrade*, not *throw*
`observed`, partial. Documented degradations: a shared-iframe anchor whose embedded app never answers
the handshake "renders as a single plain iframe dock"
(`sources/vite-devtools__docs_kit_dock-system.md:155`); an orphan group member renders top-level
(ibid.`:495`); a launcher whose process dies swaps back to the idle card (ibid.`:422`);
`getDevToolsClientContext()` returns `undefined` before init
(`sources/vite-devtools__docs_kit_client-context.md:55`); `connectRemoteDevTools()` "throws" when
opened without a descriptor and the docs recommend catching that to render a placeholder
(`sources/vite-devtools__docs_kit_remote-client.md:132-144`). **Unverified**: what the shell does
when a contributed `custom-render` renderer or `action` script throws inside
`dom:panel:mounted` / `entry:activated`. Nothing in the fetched docs states an error boundary. What
would verify it: reading the dock-entry client runtime in `vitejs/devtools` `packages/core/src/client`.

### F22 — The old Nuxt server RPC surface was a fat, framework-specific god-interface
`observed`. `ServerFunctions` is a single flat interface with ~40 methods spanning config reads,
storage read/write (`setStorageItem`, `removeStorageItem`), filesystem mutation
(`writeStaticAssets`, `deleteStaticAsset`, `renameStaticAsset`), package management
(`runNpmCommand`, `installNuxtModule`, `uninstallNuxtModule`), process control (`restartNuxt`), and
auth (`requestForAuth`, `verifyAuthToken`)
(`sources/nuxt-devtools__packages_devtools-kit_src__types_client-api.ts:12-85`). Contributors did
not extend this interface — they got a *separate namespace* via `extendServerRpc`. Note also
`getCustomTabs: () => ModuleCustomTab[]` (ibid.`:28`): contributed tabs were data pulled by the
client over the same RPC.

### F23 — `vnode` views: serializable-only, and not carried forward
`observed`. `ModuleVNodeView` — "Send vnode to the client, they must be static and serializable.
Call `nuxt.hook('devtools:customTabs:refresh')` to trigger manual refresh"
(`sources/nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts:80-91`). The v4 docs flag
this as an explicit gap in the replacement: "The docks host does not yet cover the Nuxt-specific
custom-tab features such as `vnode` views or tab categories. If you rely on those, keep using
`addCustomTab()` for now."
(`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:226-230`). Vite DevTools' analogue
is `json-render` — a JSON element tree (`Stack`/`Text`/`KeyValueTable`, …) rendered by a built-in
component library (`sources/vite-devtools__docs_kit_dock-system.md:424-464`), i.e. framework-neutral
data instead of framework VNodes.

### F24 — Shared-iframe soft navigation: many docks, one live frame, `postMessage` handshake
`observed`. An iframe dock flagged `subTabs: { protocol: 'postmessage' }` with a `frameId` becomes an
*anchor*; the shell "runs a versioned, origin-locked `postMessage` handshake with the embedded app,
turns the tab manifest the app reports into one member dock per tab (id `<frameId>:<tabId>`)", and
drives selection both directions. "The embedded app stays decoupled: it ships a small `postMessage`
nav shim and takes no hub or RPC dependency, so this works cross-origin and in static builds."
(`sources/vite-devtools__docs_kit_dock-system.md:136-157`). This is the lowest-coupling contribution
path in the whole system and the one most portable to a non-Node runtime.

### F25 — vite-plugin-inspect gave up its own UI surface at v12
`observed`. v11: "run `npm run dev` and visit `localhost:5173/__inspect/` to inspect the modules";
build mode emitted `.vite-inspect` served by `npx serve`
(`sources/vite-plugin-inspect__README-v11.md:35,37-53`). v12: "v12.x requires Vite v8.0.0 or above
with `@vitejs/devtools` v0.4.0 or above"; install now includes `@vitejs/devtools`; config is
`devtools: true` + `plugins: [Inspect()]`; "run `npm run dev` and open the DevTools to inspect"
(`sources/vite-plugin-inspect__README.md:11-35`). Build mode is now `devtools.build.withApp`
(ibid.`:37-57`). Separately, an inspector is now *built in* to Vite DevTools as
`@devframes/plugin-inspect` "enabled by default with `builtinDevTools`", showing "registered RPC
functions, dock entries, client scripts, and DevTools-enabled plugins"
(`sources/vite-devtools__docs_kit_devtools-plugin.md:209`).

### F26 — A three-layer stack, deliberately: Devframe → Kit → Vite DevTools
`observed`. "Vite DevTools is built on `@vitejs/devtools-kit`, the integration hub that owns the
dock, command palette, terminal aggregation, and the `Plugin.devtools.setup` hook every integration
uses. Kit in turn builds on **Devframe**, a framework-neutral foundation that any single tool can use
directly — including standalone CLIs, MCP servers, or static dashboards that have no Vite
dependency." (`sources/vite-devtools__docs_guide_index.md:173-175`). The kit "thins onto
`@devframes/hub` for the hub primitives (docks, terminals, messages, commands, `mountDevframe`,
json-render factory)" while keeping its own public alias surface
(`sources/vite-devtools__MIGRATION.md:5`), and pins its SPA at `/__devtools/` "independently of
devframe's new `/__devframe/` default" (ibid.`:16`).

### F27 — `@vitejs/devtools-kit` is a devDependency for node-side contributors
`observed`. "`@vitejs/devtools-kit` is fine as a dev dependency — Node-side code only consumes it for
types." (`sources/vite-devtools__docs_kit_devtools-plugin.md:13`). But a *remote-hosted* client page
must take it as a real dependency: "Install `@vitejs/devtools-kit` as a dependency of your hosted
page — the client entrypoint is browser-safe"
(`sources/vite-devtools__docs_kit_remote-client.md:113`). Nuxt's guidance is the same split: "install
`@nuxt/devtools-kit` as a dependency and `@nuxt/devtools` as a dev dependency"
(`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:16`).

### F28 — NetScript is pinned to Vite 7, below the Vite-8 floor of this entire ecosystem
`observed`. This worktree pins `"vite": "7.2.2"` (`deno.json:248`) and
`"vite": "npm:vite@7.2.2"` (`packages/fresh/deno.json:56`). Vite DevTools requires Vite 8
(`sources/vite-devtools__docs_guide_index.md:28-37`; `@nuxt/devtools` peer narrowed to `^8.0.14`,
`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:287-289`; vite-plugin-inspect v12
floor, `sources/vite-plugin-inspect__README.md:13`). There is also no `devtools` package in
`packages/` today (`ls packages/` — 30 entries, none named devtools).

## Contracts

Named shapes an RFC must consume, extend, or deliberately reject.

### C1 `Plugin.devtools.setup(ctx)` — the registration seam
```ts
// sources/vite-devtools__docs_kit_devtools-plugin.md:36-64
/// <reference types="@vitejs/devtools-kit" />
const plugin: Plugin = {
  name: 'my-plugin',
  devtools: { setup(ctx: ViteDevToolsNodeContext) { /* register everything here */ } },
}
```
`ctx` properties (ibid.`:85-94`): `docks: DocksHost`, `views: ViewsHost`, `rpc: RpcHost`,
`viteConfig: ResolvedConfig`, `viteServer: ViteDevServer | undefined`, `mode: 'dev' | 'build'`,
`cwd: string`, `workspaceRoot: string`. Nuxt's connected context additionally exposes
`terminals`, `messages`, `commands`, `diagnostics`
(`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:240-248`).

### C2 `DockEntry` — the contributed-view descriptor
Full interface at `sources/vite-devtools__docs_kit_dock-system.md:66-103`; base fields table at
`:554-568`. Load-bearing: `id`, `title`, `icon: string | {light,dark}`,
`type: 'iframe'|'action'|'custom-render'|'launcher'|'json-render'|'group'`, `url?`,
`action?: { importFrom, importName }`, `renderer?: { importFrom, importName }`,
`launcher?: { title, onLaunch, command?, terminalSessionId?, digest? }`, `ui?: JsonRenderer`,
`groupId?`, `defaultChildId?`, `category?`, `defaultOrder?`, `when?`, `visibility?`, `badge?`.
Note `action`/`renderer` are **module specifiers plus export names**, resolved by the shell — the
contribution is a *bare import path the host resolves*, not a function reference.

### C3 `ModuleCustomTab` (Nuxt, legacy) — for contrast
`sources/nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts:4-40`:
`{ name, icon?, title, view: ModuleView, category?, extraTabVNode?: VNode, requireAuth?: boolean }`
with `ModuleView = ModuleIframeView | ModuleLaunchView | ModuleVNodeView` (ibid.`:117`).

### C4 `defineRpcFunction` — the data contract
```ts
// sources/vite-devtools__docs_kit_rpc.md:27-45, 310-343
defineRpcFunction({
  name: 'my-plugin:get-modules',            // '<package>:<kebab-case>'
  type: 'query' | 'static' | 'action' | 'event',
  args?: [v.string(), …], returns?: v.object({…}),   // optional Valibot
  setup: (ctx: ViteDevToolsNodeContext) => ({
    handler: async (…args) => …,
    dump?: { inputs: unknown[][], fallback?: unknown },
  }),
})
```
Type registry: `declare module '@vitejs/devtools-kit' { interface DevToolsRpcServerFunctions {…}; interface DevToolsRpcClientFunctions {…} }`
(ibid.`:504-535`). Client side: `getDevToolsRpcClient()` → `rpc.call(name, …args)`;
`ctx.rpc.client.register({ name, type, handler })`; server broadcast
`ctx.rpc.broadcast({ method, args, event? })` (ibid.`:349-380,460-496`;
`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:177`).

### C5 `DockClientScriptContext` — what a contributed client script receives
`sources/vite-devtools__docs_kit_client-context.md:42-52,67-78`: the base `DevToolsClientContext`
(`rpc`, `clientType: 'embedded'|'standalone'`, `docks`, `panel`, `commands`, `when`) plus dock-scoped
`current` (entry state, DOM, events) and `messages`. Events:
`entry:activated`, `entry:deactivated` (`sources/vite-devtools__docs_kit_dock-system.md:242-246`),
plus `dom:panel:mounted` → `HTMLElement` for `custom-render` (ibid.`:308-312`).

### C6 `RemoteConnectionInfo` — the only versioned wire artifact found
```ts
// sources/vite-devtools__docs_kit_remote-client.md:168-177
interface RemoteConnectionInfo {
  v: 1
  backend: 'websocket'
  websocket: string   // full ws:// or wss:// URL
  authToken: string
  origin: string      // dev-server origin
}
```
base64url(JSON), carried under URL param `vite-devtools-kit-connection`, fragment by default
(ibid.`:179,86-92`). Options: `remote: true | { transport: 'fragment'|'query', originLock: boolean }`
(ibid.`:72-83`).

### C7 Nuxt kit entry points (the deprecated-but-still-shipping API)
`addCustomTab()`, `refreshCustomTabs()`, `startSubprocess()`, `extendServerRpc()`,
`onDevToolsInitialized()`, `onDevtoolsReady()` from `@nuxt/devtools-kit`;
`useDevtoolsClient()`, `onDevtoolsClientConnected()`, `onDevtoolsReady()` from
`@nuxt/devtools-kit/iframe-client`; `useDevtoolsHostClient()`,
`onDevtoolsHostClientConnected()` from `@nuxt/devtools-kit/host-client`
(`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:42-405`). Hooks:
`devtools:customTabs`, `devtools:customTabs:refresh`, `devtools:ready`, `devtools:notify`,
`devtools:terminal:register|write|exit|remove`
(ibid.`:52,96,232,265`; `sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:108-133`).

### C8 Static-build RPC dump layout
`__rpc-dump/index.json` + sharded `__rpc-dump/<name-with-:-replaced-by-~>.json`; query record maps
embedded in `index.json` (`sources/vite-devtools__docs_kit_rpc.md:120-127`).

## Drift candidates

### D1 — "Nuxt DevTools is the framework-owned-shell reference architecture" (significant)
- **Expected** (the framing in this run's brief: Nuxt DevTools as a framework-owned devtools surface
  that third-party modules extend).
- **Actual**: Nuxt deleted its shell. v4 removes the floating panel and always mounts Nuxt DevTools
  as a dock entry inside Vite DevTools' panel, under a `Nuxt` group; module authors join it with
  `groupId: 'nuxt'` (`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:283-305`).
- **Consequence for the RFC**: the reference architecture to study is *Vite DevTools Kit /
  Devframe*, and Nuxt is the case study of a framework that tried owning the shell and stopped.

### D2 — NetScript's Vite pin is below the whole ecosystem's floor (architectural)
- **Expected**: NetScript is "Deno + Fresh 2 + Vite", so a Vite-plugin-shaped devtools contribution
  API could be adopted directly.
- **Actual**: repo pins Vite 7.2.2 (`deno.json:248`, `packages/fresh/deno.json:56`); Vite DevTools,
  `@nuxt/devtools` v4, and vite-plugin-inspect v12 all require Vite 8
  (`sources/vite-devtools__docs_guide_index.md:28-37`;
  `sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:287-289`;
  `sources/vite-plugin-inspect__README.md:13`).
- **Consequence**: "adopt `@vitejs/devtools-kit`" is not an option this quarter without a Vite 8
  migration; the RFC must either scope a Vite-8 prerequisite or design a compatible-shaped
  NetScript-native surface.

### D3 — "iframe views mean the contribution is sandboxed" (significant)
- **Expected**: iframe ⇒ isolation.
- **Actual**: Nuxt deliberately breaks it — same-origin iframes get `__NUXT_DEVTOOLS__` injected and
  reach into the live app (`sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:300,338`);
  no `sandbox` attribute is documented, only an `allow` permission allowlist merged onto
  `clipboard-read`/`clipboard-write`
  (`sources/nuxt-devtools__docs_content_2.module_0.guide.md:62-75`). Vite DevTools additionally
  offers `custom-render`, which explicitly "skip[s] iframe isolation"
  (`sources/vite-devtools__docs_kit_dock-system.md:251`).

### D4 — "devtools are stripped in production" (significant)
- **Expected**: dev-only ⇒ absent from a production build.
- **Actual**: build mode is a *supported target*: `build.withApp: true` writes DevTools output into
  the app's build dir (`sources/vite-devtools__docs_guide_index.md:138-163`), RPC results are dumped
  into the output (`sources/vite-devtools__docs_kit_rpc.md:116-127`), and build mode **disables
  client auth** (`sources/vite-devtools__docs_errors_DTK0008.md:13-19`). The only *automatic*
  strip is embedded-client injection, which is dev-server-only and client-env-only
  (`sources/vite-devtools__docs_kit_client-context.md:34-38`); the manual-import escape hatch pushes
  the prod guard onto the user (ibid.`:100-105`).

### D5 — Namespaced-pair RPC (`extendServerRpc<C,S>(ns, fns)`) is the modern shape (minor)
- **Expected** (from Nuxt's still-live main guide,
  `sources/nuxt-devtools__docs_content_2.module_0.guide.md:125-189`, which teaches it with no
  deprecation banner).
- **Actual**: deprecated `NDT_DEP_0003`; the forward shape is flat prefixed function names on a
  single registry (`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:151-177`;
  `sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:156-196`). The Nuxt docs are
  internally inconsistent — guide page vs. utils-kit/migration pages.

## Open questions

1. What does the Vite DevTools shell do when a contributed `custom-render` renderer or `action`
   script **throws** in `dom:panel:mounted` / `entry:activated`? No error-boundary behaviour is
   documented (F21). Verify by reading `packages/core/src/client` in `vitejs/devtools`.
2. Is there any **wire-level** version handshake between a contributed client and the RPC host, or
   is compatibility purely package-semver + TS augmentation (F19)? Verify via
   `packages/core/src/node/ws.ts`.
3. Does the dock host **namespace-enforce** entry ids / RPC names (reject a plugin registering
   `nuxt:*`), or is the `<package>:<name>` convention advisory only
   (`sources/vite-devtools__docs_kit_rpc.md:49` reads as advisory)?
4. Does `ctx.views.hostStatic()` assume Node `fs`/`path` and Connect-style middleware, or is it
   expressible over Deno's `Deno.serve` + `@std/http/file-server`? Determines whether the
   *hosting* half of the contract is portable at all.
5. What is the actual isolation of an `iframe` dock — is any `sandbox` attribute set by Vite
   DevTools (as opposed to Nuxt's `allow`-only model, F14)?
6. Fresh 2 in this repo: does Vite serve the app HTML (so `transformIndexHtml` injection would work
   at all), or is Fresh in the "backend integration / middleware mode" bucket that silently skips
   injection (F9)? This is the single most decision-relevant unknown for a Vite-shaped design.
7. Is there a documented upper bound on `json-render`'s component library — i.e. how far a
   zero-client-code contribution can go before it needs an iframe (F3, F23)?
8. Does Devframe (the framework-neutral layer under Kit) publish a runtime-agnostic entry usable
   from Deno without a Vite dependency (`sources/vite-devtools__docs_guide_index.md:173-175` claims
   "standalone CLIs, MCP servers, or static dashboards that have no Vite dependency")? Verify at
   `https://devfra.me/guide/` and the `devframes/devframe` repo.

## Applicability verdict for NetScript

**Transfers (contract shapes, not code):**

- **The `setup(ctx)` registration seam.** One hook, called only when devtools are enabled, is the
  cleanest dev-only-by-construction boundary available (F2). NetScript's analogue is a plugin-level
  `devtools` capability on the existing `packages/plugin` archetype — registration code that simply
  never runs otherwise.
- **The dock-entry descriptor as plain serializable data** (C2/F16): `id`, `title`, `icon`,
  `category`, `defaultOrder`, `groupId`, `badge`, `when`. Declarative ordering/grouping/visibility
  keeps the shell from accumulating per-contributor branches, and flat `groupId` pointers with
  graceful orphan fallback (F16) avoid a registration ordering dependency — that specific rule is
  worth copying verbatim.
- **Named, prefixed, typed RPC with four function kinds** (C4/F5). The `<package>:<kebab-name>`
  convention, `query`/`static`/`action`/`event` split, and augmentation-based typing all map onto
  Deno + TS without change. `invokeLocal` for server-side cross-contribution composition, and
  `WeakMap`-keyed plugin state instead of mutating the shared context (F18), are directly
  applicable doctrine-compatible rules.
- **Handle-based live update** (`register()` → `handle.update(patch)`, F17) over hook
  re-evaluation. Nuxt's regret here is explicit.
- **A "launcher" state as a first-class view type** (F15). NetScript already has expensive things a
  panel might front (Aspire AppHost, DB, plugin E2E); the launcher card + `digest` + terminal-session
  link is the right shape, and `createProcessLauncher`'s "swap back to idle when the process dies"
  rule is a real robustness lesson.
- **A zero-client-code panel tier** (`json-render`, F3/F23). Most NetScript plugin panels are
  key/value + table + list. A JSON element spec rendered by a NetScript-owned component set means
  most contributors ship *no* frontend bundle — and it dodges the VNode-serialization dead end Nuxt
  hit (F23).
- **The shared-iframe soft-nav decoupling principle** (F24): the embedded app "takes no hub or RPC
  dependency". Any NetScript panel that must be a separate app should be reachable this way.
- **The regret list itself**: do not build a bespoke shell, a bespoke subprocess/terminal system, a
  bespoke editor integration, or a global-install mode. Nuxt built all four and removed or
  deprecated all four (D1, F(migration):6-35,37-133,254-263).

**Does not transfer:**

- **`@vitejs/devtools-kit` / `@nuxt/devtools-kit` as dependencies, today.** Vite 8 floor vs.
  NetScript's Vite 7.2.2 pin (D2/F28). Any RFC that assumes `ctx.docks.register` is *available*
  rather than *imitated* is unbuildable at this baseline.
- **`transformIndexHtml`-based client injection** (F8/F9) — and this is the sharp one. Injection
  requires Vite itself to serve and transform the HTML; backend-integration and middleware-mode
  setups silently get nothing. Fresh 2 renders its own HTML, so NetScript almost certainly lands in
  the documented failure bucket. Mounting must be a NetScript-owned route/middleware on the Fresh
  dev server, not an HTML-transform hook. (Open question 6 must be closed before this is asserted as
  fact.)
- **Node-specific hosting and process primitives**: `ctx.views.hostStatic` over Connect middleware,
  `startChildProcess` / `startPtySession` (`zigpty`), `tinyexec`, `node:child_process.SpawnOptions`
  (`sources/nuxt-devtools__docs_content_2.module_3.migration-v4.md:45-53,91-106`;
  `sources/nuxt-devtools__docs_content_2.module_1.utils-kit.md:98-126`). Deno has `Deno.Command`
  and `@std/http/file-server`; per AGENTS.md rule 3 ("wrap, do not reinvent"), the *shape* of a
  terminals host is worth copying, the implementation is not.
- **Iconify-name icons as the only icon contract.** Iconify resolution assumes a network/bundle
  strategy NetScript has not adopted; the `string | { light, dark }` *union shape* is what transfers,
  not the `ph:`/`carbon:` resolver.
- **Same-origin `window` injection into contributed iframes** (F13/D3). Nuxt hands a contributed
  iframe live access to the running app's Vue instance. For NetScript this is a trust decision the
  RFC should make deliberately and probably reject by default — `custom-render` and same-origin
  injection are the two places where "a contribution throws" becomes "the shell is dead".
- **The fat framework `ServerFunctions` god-interface** (F22): ~40 methods including filesystem
  mutation, npm execution, and process restart on one interface. NetScript should not centralize
  privileged capabilities in one contributor-visible RPC surface.
- **Build-mode devtools output as a default** (D4/F10). NetScript ships JSR packages and Aspire
  apps; a devtools bundle in a production build with auth disabled (F11) is a liability, not a
  feature. If a static/offline mode is ever wanted, the `dump` design (C8) is the right prior art —
  but the default should be "absent from production", which is stricter than what Vite DevTools does.

**Net:** the RFC should treat Vite DevTools Kit as the *specification to imitate at the contract
layer* (setup hook, dock descriptor, named RPC, handle-update, launcher, json-render tier) and Nuxt
DevTools v4 as the *cautionary record* of what a framework-owned shell costs — while implementing
mounting, hosting, and process control natively on Deno/Fresh, because every one of those three is
where the upstream mechanism is Node- and Vite-8-bound.

## Sources

Saved artifacts (all under
`.llm/runs/plan-devtools-contribution--seed/research/sources/`), fetched 2026-08-11:

| File | Upstream |
|---|---|
| `nuxt-devtools__docs_content_2.module_0.guide.md` | `raw.githubusercontent.com/nuxt/devtools/main/docs/content/2.module/0.guide.md` |
| `nuxt-devtools__docs_content_2.module_1.utils-kit.md` | `…/nuxt/devtools/main/docs/content/2.module/1.utils-kit.md` |
| `nuxt-devtools__docs_content_2.module_2.ui-kit.md` | `…/nuxt/devtools/main/docs/content/2.module/2.ui-kit.md` |
| `nuxt-devtools__docs_content_2.module_3.migration-v4.md` | `…/nuxt/devtools/main/docs/content/2.module/3.migration-v4.md` |
| `nuxt-devtools__docs_content_1.guide_0.getting-started.md` | `…/nuxt/devtools/main/docs/content/1.guide/0.getting-started.md` |
| `nuxt-devtools__packages_devtools-kit_src__types_custom-tabs.ts` | `…/nuxt/devtools/main/packages/devtools-kit/src/_types/custom-tabs.ts` |
| `nuxt-devtools__packages_devtools-kit_src__types_rpc.ts` | `…/nuxt/devtools/main/packages/devtools-kit/src/_types/rpc.ts` |
| `nuxt-devtools__packages_devtools-kit_src__types_client-api.ts` | `…/nuxt/devtools/main/packages/devtools-kit/src/_types/client-api.ts` |
| `nuxt-devtools__packages_devtools-kit_package.json` | `…/nuxt/devtools/main/packages/devtools-kit/package.json` |
| `vite-devtools__docs_kit_index.md` | `…/vitejs/devtools/main/docs/kit/index.md` |
| `vite-devtools__docs_kit_devtools-plugin.md` | `…/vitejs/devtools/main/docs/kit/devtools-plugin.md` |
| `vite-devtools__docs_kit_dock-system.md` | `…/vitejs/devtools/main/docs/kit/dock-system.md` |
| `vite-devtools__docs_kit_rpc.md` | `…/vitejs/devtools/main/docs/kit/rpc.md` |
| `vite-devtools__docs_kit_client-context.md` | `…/vitejs/devtools/main/docs/kit/client-context.md` |
| `vite-devtools__docs_kit_shared-state.md` | `…/vitejs/devtools/main/docs/kit/shared-state.md` |
| `vite-devtools__docs_kit_streaming.md` | `…/vitejs/devtools/main/docs/kit/streaming.md` |
| `vite-devtools__docs_kit_messages.md` | `…/vitejs/devtools/main/docs/kit/messages.md` |
| `vite-devtools__docs_kit_remote-client.md` | `…/vitejs/devtools/main/docs/kit/remote-client.md` |
| `vite-devtools__docs_kit_when-clauses.md` | `…/vitejs/devtools/main/docs/kit/when-clauses.md` |
| `vite-devtools__docs_kit_examples.md` | `…/vitejs/devtools/main/docs/kit/examples.md` |
| `vite-devtools__docs_guide_index.md` | `…/vitejs/devtools/main/docs/guide/index.md` |
| `vite-devtools__docs_errors_DTK0008.md` | `…/vitejs/devtools/main/docs/errors/DTK0008.md` |
| `vite-devtools__MIGRATION.md` | `…/vitejs/devtools/main/MIGRATION.md` |
| `vite-devtools__README.md` | `…/vitejs/devtools/main/README.md` |
| `vite-plugin-inspect__README.md` | `…/antfu-collective/vite-plugin-inspect/main/README.md` |
| `vite-plugin-inspect__README-v11.md` | `…/antfu-collective/vite-plugin-inspect/v11/README.md` |

Repo evidence in this worktree (baseline `main` @ `2256a67bf`):
`deno.json:248`, `packages/fresh/deno.json:56`, `ls packages/` (no `devtools` package).

Repo-tree listings used for source discovery (commands run, not saved as artifacts):
`gh api repos/nuxt/devtools/git/trees/main?recursive=1`,
`gh api repos/vitejs/devtools/git/trees/main?recursive=1`.

Not fetched / not claimed: `https://devfra.me/guide/` (Devframe's own docs) and the
`devframes/devframe` repo — see open question 8.
