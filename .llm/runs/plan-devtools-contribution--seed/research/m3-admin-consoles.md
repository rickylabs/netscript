# market:admin — Medusa, Directus, Strapi, Backstage

Stage-B discovery corpus for the NetScript DevTools Contribution Architecture RFC
(run `plan-devtools-contribution--seed`). Planning-only; nothing here was mutated.

Citation convention: `F<n>` refers to a numbered entry in the saved fetch log
`.llm/runs/plan-devtools-contribution--seed/research/sources/m3-admin-consoles-fetch-log.md`,
which records the URL and the extraction taken at fetch time (2026-08-11).

## Summary

All four systems are **production admin consoles**: long-lived, multi-tenant-ish, authenticated
surfaces that end users (merchandisers, editors, platform engineers) operate against real data.
None of them is a developer diagnostics tool, and their architecture shows it in four consistent
places: (1) the extension surface is *closed and core-owned* or *explicitly registered*, never
free-form; (2) contributions are **build-time**, compiled into the console bundle (Medusa Vite
plugin, Strapi admin rebuild, Directus build+load, Backstage npm-into-app) — the one exception,
Red Hat's dynamic plugins, exists precisely because the build-time model was too expensive at
operational scale (F16, F17); (3) the extension identity is validated by a **manifest or a build-time
AST check** (Directus zod manifest with a required `host` range, F7/F8; Medusa `isValidInjectionZone()`,
F3); and (4) auth/RBAC is part of the contribution contract — Strapi links carry a `permissions`
array (F12), Directus gates the whole Data Studio behind an App Access / Admin Access policy flag (F9).

Medusa is the closest ancestor of RFC #890's zone idea, and the important detail is that its zone
vocabulary is **entirely core-owned**: plugins pick from a fixed `{page}.{location}` list, they cannot
mint zones (F4). Unknown zones are **silently dropped at build time with a warning**, not at runtime
(F3). Strapi is the opposite pole: any plugin may **declare** its own injection zones in `register()`
and other plugins inject into them in `bootstrap()` with a defensive `if (plugin)` presence check,
and an unknown zone lookup returns an empty array rather than erroring (F11, F12). Directus contributes
the strongest *versioning/isolation* precedent: a zod-validated `directus:extension` manifest with a
required `host` semver range and an opt-in VM sandbox with declared `requestedScopes` (log/sleep/request
with URL+method allowlists) (F7, F8, F6). Backstage is the cautionary tale: plugins are npm packages
consumed into the app's own build, which makes plugin installation a rebuild-and-redeploy event, and
the ecosystem's answer was to bolt on Scalprum/module-federation runtime loading plus declarative
`dynamicRoutes`/`mountPoints` config (F15, F16).

The separation verdict at the end is the load-bearing output for RFC Q4: an admin console and a
developer diagnostics tool differ in trust model, lifetime, auth, data freshness, build inclusion,
failure tolerance and audience — and several of the admin-console mechanisms above (RBAC on contributed
links, sandboxing, manifest host ranges) are costs a devtools surface should deliberately *not* pay.

## Findings

### Medusa — admin zones

**M-1 (observed). A widget declares its target zone declaratively via `defineWidgetConfig`, taking a
string or array of strings.** `export const config = defineWidgetConfig({ zone: "product.details" })`;
the docs state `zone` accepts "a string or array of strings indicating the injection zone(s) to inject
the widget into." (F1). Relevance: Q1/Q2 — the minimal declaration shape for a contributed panel is
one config object with a target id, and multi-target is free.

**M-2 (observed). Zone identity is a flat, core-owned `{page}.{location}` string namespace, not a
plugin-namespaced one.** Zones are documented as `workflow.list`, `workflow.details`, `topbar`, across
20+ page categories; there is no facility documented anywhere for a plugin to declare a new zone (F4).
Relevance: Q2/Q4 — Medusa's zones are a *closed vocabulary owned by the host*, so collision-by-name is
impossible; "collision" degenerates to "several widgets in one zone".

**M-3 (observed). Legacy `.before` / `.after` positional suffixes were deprecated in v2.17.2 in favour
of plain `.details` / `.list` zone names, retained only for login-page zones** (F1). Relevance: Q2 —
positional sub-slots inside a zone were tried and walked back; ordering is not expressed in the zone id.

**M-4 (observed). Zone validity is enforced at BUILD time by an AST pass, and invalid zones are
silently dropped.** `admin-vite-plugin/src/widgets/generate-widgets.ts` traverses the AST for the
`config` object, extracts `zone` via `extractZoneValues` (string literal and array-of-strings supported;
**template literals explicitly rejected with a warning**), filters through `isValidInjectionZone()`,
warns `"'zone' property is not a valid injection zone"` when nothing survives, and returns `null` so the
file yields no widget entry (F3). Relevance: Q2/Q4/Q6 — the unknown-zone failure mode is a build-time
warning + omission, never a runtime crash and never a runtime error surface. A dynamically-computed zone
string is unrepresentable by construction.

**M-5 (observed). Widget identity is a generated stable hash unless overridden.** The generated map emits
`{ Component, zone: string[], widgetId }` where `widgetId` is an explicit string override or
`Widget-<4-char hash>` derived from the normalized file path (F3). Relevance: Q2/Q3 — identity is derived
from *file path*, i.e. from build-graph position, not from a package name.

**M-6 (observed). Contributed widgets are compiled into the admin bundle by a Vite v5 build; the admin is
served by the Medusa app at `/app`.** (F2, F3). Relevance: Q5/Q6 — contribution is a build-time concern;
there is no runtime plugin registry for admin UI.

**M-7 (observed). Data reaches detail widgets as a typed prop from the host page, not by the widget
fetching.** `({ data }: DetailWidgetProps<AdminProduct>)` (F1); list zones pass no extra props (F4).
Relevance: Q7 — the host owns the data fetch and hands the contributed component a typed slice. Cheapest
possible data contract.

**M-8 (unverified). Ordering of multiple widgets in the same zone.** Neither the widgets guide nor the
zones reference documents ordering or priority (F1, F4). What would verify: reading the admin dashboard's
widget rendering component in `packages/admin/dashboard` for the sort applied to the generated
`widgets: [...]` array.

**M-9 (observed). The host explicitly refuses arbitrary customization: "You can't customize the admin
dashboard's layout, design, or the content of the existing pages (aside from injecting widgets)."** (F2).
Relevance: Q4 — a production console deliberately caps contribution power to preserve a coherent product.

### Directus — extension model, versioning, isolation, RBAC

**D-1 (observed). Nine extension types split app/API: interfaces, displays, layouts, panels, modules,
themes (app) and hooks, endpoints, operations (API); modules are "top-level areas of the Data Studio"**
(F5). Relevance: Q1/Q2 — the taxonomy is by *slot kind*, and a "module" is the whole-page equivalent of
a devtools tab.

**D-2 (observed). The contribution contract is a zod-validated package.json manifest.**
`ExtensionManifest` requires `name`, `version`, optional `type`/`description`/`icon`/deps, plus the
`[EXTENSION_PKG_KEY]` (`directus:extension`) options object (F7). Relevance: Q3/Q8 — validation is
schema-first on package metadata, so a malformed extension is rejected before any code runs.

**D-3 (observed). Host compatibility is a required first-class manifest field: `host: z.string()`** in
`ExtensionOptions` (F8). Relevance: Q3/Q8 — the console version range an extension supports is declared
data, not documentation.

**D-4 (observed). The options schema is a discriminated union over app / api / hybrid / bundle types,
with `path` and `source` becoming a `SplitEntrypoint` (`{ app, api }`) for hybrid and bundle types, and
bundles carrying `entries: { type, name, source }[]`** (F8). Relevance: Q2/Q5 — one installable unit can
carry several contributions of different kinds; the manifest enumerates them.

**D-5 (observed). API extensions may opt into a VM sandbox with declared scopes.**
`"sandbox": { "enabled": true, "requestedScopes": {} }`; sandboxed code sees only "JavaScript standard
built-in objects" — no `console`, no `setTimeout` — and must request `log`, `sleep`, or `request` scopes,
where `request` allowlists HTTP methods and URL patterns such as `https://directus.com/*` (F6, F8).
Relevance: Q4/Q9 — this is the production-console trust posture: third-party code is untrusted and
capability-scoped.

**D-6 (observed). Unsandboxed extensions "execute code inside the Directus server"** (F5) — i.e. sandbox
is opt-in, and the default is full trust. Relevance: Q4 — even a production console concedes that
full-trust extensions are the norm; the sandbox is for untrusted marketplace code.

**D-7 (observed). Data Studio access itself is a policy flag: "A policy can toggle access to the App
(Data Studio)"; a Studio User needs a policy with Admin Access or App Access, otherwise the account is
API-only and consumes no seat** (F9). Relevance: Q4 — console access is a licensed, RBAC-gated thing.

**D-8 (unverified). Per-module/per-extension RBAC for non-admin roles.** The access-control guide covers
collection/field CRUD permissions and the app-access flag but does not document gating an individual
custom module extension to a role (F9). What would verify: reading `app/src/modules/` registration and
the `modules` permission check in `directus/app`, or the `moduleBar` settings which map modules to roles.

### Strapi — plugin admin API, declared zones, RBAC

**S-1 (observed). Three admin lifecycle hooks with distinct authority: `register()` (registerPlugin,
addMenuLink, addSettingsLink, declare injection zones, reducers), `bootstrap()` (extend *other* plugins
via `getPlugin('x')`, hooks, Content-Manager extensions), `registerTrads()`** (F10). Relevance: Q2/Q5 —
two-phase registration exists specifically so that cross-plugin extension happens only after every
plugin has declared its own surface. This is the ordering answer Medusa doesn't need (its zones are
static).

**S-2 (observed). Plugins may MINT their own injection zones.**
```javascript
app.registerPlugin({ id: 'dashboard', injectionZones: { homePage: { top: [], middle: [], bottom: [] }, sidebar: { before: [], after: [] } } });
```
(F11). Relevance: Q2/Q4 — the opposite design choice from Medusa: an open, plugin-extensible zone
namespace, three levels deep (`module → container → block`).

**S-3 (observed). Cross-plugin injection is presence-guarded by the caller, i.e. the framework provides
no dependency declaration.** The documented pattern is `const p = app.getPlugin('dashboard'); if (p) { p.injectComponent(...) }` (F11).
Relevance: Q2/Q6 — a missing target plugin is the *contributor's* problem to handle; there is no
manifest-level "requires plugin X".

**S-4 (observed). Unknown-zone lookup is a silent no-op at runtime.**
`getAdminInjectedComponents(moduleName, containerName, blockName)` reads
`this.admin.injectionZones[moduleName][containerName][blockName]` "with error handling that returns an
empty array on failure" (F12). Relevance: Q6 — Strapi's failure mode is render-nothing, not throw.
Compare M-4: Medusa fails at build with a warning; Strapi fails at runtime with silence. Neither surfaces
the problem to the operator.

**S-5 (observed). Core Content-Manager zones are a small fixed set: `editView.right-links`,
`listView.actions`, `listView.deleteModalAdditionalInfos`, `preview.actions`, addressed as
`getPlugin('content-manager').injectComponent('editView', 'right-links', { name, Component })`** (F11).
Relevance: Q2 — the injected item carries a `name` (contributor-chosen identity) plus a `Component`;
identity is a plain string with no enforced namespacing.

**S-6 (observed). Contributed navigation/settings surfaces carry RBAC permissions inline.** Permission
entries are `{ action: 'admin::audit-logs.read' }` arrays attached at registration (F12). Relevance:
Q4/Q9 — in a production console, "should this user see this contributed link" is answered by data on the
contribution itself. This is the mechanism a developer devtools surface has no analogue for.

**S-7 (observed). Higher-level Content-Manager contribution APIs exist beyond raw zones:
`addEditViewSidePanel()`, `addDocumentAction()`, `addBulkAction()`** (F10). Relevance: Q2 — the mature
version of an injection-zone API grows *typed intent-shaped* entry points alongside the generic slot.

**S-8 (observed). Admin panel changes require a rebuild of the admin bundle (Vite/webpack)** (F10).
Relevance: Q5 — same build-time model as Medusa.

**S-9 (observed). `createHook(name)` registers named hooks in a `hooksDict`, and `addMenuLink` /
`addSettingsLink` delegate to a `Router` that owns validation; `StrapiApp.tsx` itself performs
`invariant()` checks on component/field registration but no per-field link validation** (F12).
Relevance: Q6/Q8 — validation strictness is uneven within a single mature implementation.

### Backstage — plugin architecture and its cost

**B-1 (observed). Plugins are distributed as npm packages** (`@backstage/plugin-<name>` or org-scoped,
"published on the NPM registry and ... public") (F15). Relevance: Q3/Q5 — the unit of contribution is a
published package, and the app consumes it as a dependency.

**B-2 (observed). The new frontend system is an extension TREE, not a flat slot list.** Building blocks:
App (root that "wires things together" and has no functionality itself), Extensions (each "attached to a
parent with which it shares data", forming the "app extension tree"), Plugins, Extension Overrides
(high-priority replacements of an existing extension), Utility APIs (TypeScript-interface-based shared
functionality), and Routes as an indirection layer letting plugins link to each other's extensions
without knowing URLs (F13). Relevance: Q2/Q4 — the most powerful model surveyed, and the most complex:
parent/child data flow, override precedence, and route indirection are three separate resolution systems.

**B-3 (observed). Route indirection exists so plugins can reference each other without hardcoded paths,
generating links dynamically at runtime** (F13). Relevance: Q2/Q7 — cross-contribution linking is a named
architectural problem once contributions can be pages.

**B-4 (observed, secondary-vendor). The build-time model's operational cost was significant enough that a
major distributor replaced it with runtime loading.** Red Hat Developer Hub: "You can install, configure,
and load plugins at runtime without changing or rebuilding the application. You only need a restart. You
can load these plugins from NPM, tarballs, or OCI compliant container images." (F16). Relevance: Q4/Q5 —
direct evidence that "plugin install = app rebuild" is the expensive property.

**B-5 (observed, secondary-vendor). The runtime mechanism is Scalprum / module federation plus declarative
config.** Export produces `dist-dynamic/dist-scalprum`; `dynamic-plugins.yaml` declares which plugins are
installed and enabled at startup; frontend placement is declarative `dynamicRoutes` and `mountPoints`
config (F16). Relevance: Q5/Q6 — note that the runtime model *reintroduces* Medusa-style declarative mount
points; the escape from build-time coupling costs you a config-driven placement vocabulary.

**B-6 (inference, from F16 + F17). The specific cost of Backstage's model is that plugin installation is a
CI/image-rebuild event and that plugin dependency trees inflate the app build.** Inferred from: RHDH's
stated remedy (F16, which frames "without changing or rebuilding the application" as the benefit) and from
the BackstageCon Europe talk "Forget Rebuilding, Install Plugins at Runtime" plus vendor blogs reporting
the "banana and the rainforest" transitive-dependency bloat (F17, secondary sources, not primary docs).
Marked inference because no *primary Backstage* doc I fetched states the cost in those terms.

**B-7 (unverified). The exact legacy wiring step (`yarn add --cwd packages/app` then adding a `<Route>` in
`App.tsx`).** The Backstage getting-started page for this returned HTTP 404 at fetch time (F-failed), and
`backstage.io/docs/plugins/` is marked "Legacy" with no technical detail (F14). What would verify: fetching
the current `backstage.io/docs/frontend-system/building-apps/*` page, or reading `packages/app/src/App.tsx`
in a `@backstage/create-app` scaffold.

**B-8 (observed). Backstage itself does not document a build-time zone validation or a manifest host-range
field in the pages fetched** (F13, F14, F15) — the type system and the extension tree are the contract.
Relevance: Q8 — compare Directus D-3: Backstage has no declared compatibility range in the surfaces
surveyed; compatibility is carried by npm semver on `@backstage/*` peer deps. Marked as an absence within
the fetched set, not a proof of non-existence.

### Cross-cutting comparison

**X-1 (observed). Zone-namespace ownership is the single biggest axis of divergence.**
Medusa: closed, core-owned vocabulary, no plugin-declared zones (F4). Strapi: open, any plugin declares
`injectionZones` (F11). Backstage: no zones at all — an extension attaches to a parent extension by
identity in a tree, and overrides replace by id (F13). Directus: neither — extensions fill *typed slots*
(interface/panel/module) chosen by the console, and a module is a whole top-level area (F5).
Relevance: Q2/Q4 — four viable answers exist; the choice determines whether collision is even possible.

**X-2 (observed). Failure modes for a bad target are all quiet.** Medusa: build-time warning + omission
(F3). Strapi: runtime empty array (F12). Backstage: not documented in the fetched pages. None of the four
surfaces an operator-visible error. Relevance: Q6 — if NetScript wants loud failure, it is *departing*
from every prior art here, and that departure should be argued explicitly.

**X-3 (observed). Three of four validate the contribution before it renders, at different layers.**
Directus: zod manifest + required `host` range, before load (F7, F8). Medusa: AST + `isValidInjectionZone()`
at build (F3). Strapi: `invariant()` on component/field registration, but no link-field validation (F12).
Relevance: Q8 — manifest-time is the strictest and the only one that can express version compatibility.

**X-4 (observed). Only the two data-owning consoles (Strapi, Directus) put auth on the contribution
itself.** Strapi: `permissions: [{ action: 'admin::audit-logs.read' }]` on registered links (F12).
Directus: App/Admin Access policy flags gating Studio entry (F9). Medusa's widget config carries no
permission field in the documented shape (F1). Relevance: Q4/Q9 — RBAC-on-contribution correlates with
"the console reads and mutates production business data", not with "the console is an admin UI".

## The separation verdict — production admin console vs developer diagnostics tool

This is the Q4 answer. Each row is grounded in the evidence above.

| Property | Production admin console (Medusa/Directus/Strapi/Backstage) | Developer diagnostics tool |
|---|---|---|
| **Trust model** | Third-party code may be untrusted; isolation is an explicit feature — Directus ships an opt-in VM sandbox with `requestedScopes` for log/sleep/network-with-URL-allowlist (F6, F8). Host caps contribution power outright: "You can't customize the admin dashboard's layout, design, or the content of the existing pages" (F2). | Contributions come from the same workspace and the same author as the app; the code already runs in the dev server. Sandboxing buys nothing a sandbox-free `import` doesn't already concede. *(inference from the asymmetry of F2/F6 vs. a first-party dev surface; no external cite.)* |
| **Lifetime** | Long-lived deployed installation; plugin install/upgrade/rollback is an operations event — hence RHDH's "install, configure, and load plugins at runtime ... You only need a restart", loading from NPM/tarball/OCI (F16). | Lives exactly as long as the dev process. Restart is free, so runtime-loading machinery (module federation, Scalprum, `dynamic-plugins.yaml`) is pure cost (contrast F16). |
| **Auth / RBAC** | On the contribution itself. Strapi links carry `permissions: [{ action: 'admin::audit-logs.read' }]` (F12); Directus gates Studio entry via App Access / Admin Access policy flags and counts seats (F9). | No role model to gate against — the audience is the single developer who owns the process. Every mechanism in the left column has no counterpart. |
| **Data freshness** | Host page fetches the entity and passes a typed slice down: `({ data }: DetailWidgetProps<AdminProduct>)` (F1); list zones get no data at all (F4). Request/response, user-initiated. | Diagnostics data is *streaming and continuously invalidated* (runtime events, logs, request traces). The Medusa "host fetches, prop flows down" contract does not model a live feed. *(inference: F1/F4 show only prop-passing; no admin console surveyed documents a push/stream contract to contributed UI.)* |
| **Build inclusion** | Compiled into the console bundle: Medusa Vite v5 build with an AST codegen pass (F2, F3); Strapi "admin panel changes require rebuild", Vite/webpack (F10). The escape hatch (RHDH) had to invent module federation to break this (F16). | Should never enter the production build. Build inclusion in the left column is unavoidable because the console *is* the product; a devtools surface is not shipped, so the correct answer is exclusion, not federation. |
| **Failure tolerance** | Quiet degradation preferred: invalid zone dropped at build with a warning (F3); unknown zone returns an empty array at runtime (F12). A broken contribution must not take down the console an operator is using. | The operator *is* the author; a silently-missing panel is a debugging trap. Loud failure is affordable and preferable — a deliberate departure from all prior art (see X-2). |
| **Audience** | Non-technical operators (merchandisers, editors) plus platform engineers; hence design-consistency constraints and a shared component kit (Medusa UI, F2) and the refusal to let plugins restyle the app (F2). | The framework's own users, reading their own system. Consistency still matters for legibility, but the design constraint is diagnostic density, not brand coherence. |
| **Namespace ownership** | Either closed and core-owned (Medusa, F4) or open and plugin-minted with two-phase register/bootstrap ordering (Strapi, F11) or a full extension tree with overrides (Backstage, F13). | Q2 decision point; the survey shows all three are viable, but only Strapi's open model requires the two-phase lifecycle and the caller-side `if (plugin)` guard (F11) — a real complexity cost. |
| **Version compatibility** | Declared data. Directus requires `host: z.string()` in the manifest (F8), validated by zod before load (F7). | In-workspace contributions version-lock with the framework by construction (single lockfile), so a `host` range would be ceremony. *(inference from D-3 contrasted with a monorepo consumption model.)* |

**Sharp form of the verdict:** the admin consoles pay for *untrusted third-party code deployed into a
long-lived, RBAC-governed, production-data surface*. Sandboxing (D-5), manifest host ranges (D-3),
per-contribution permissions (S-6), and runtime module federation (B-4/B-5) are all costs of that one
condition. A developer diagnostics tool satisfies none of the antecedents — first-party code, ephemeral
process, no role model, non-production. Copying the *mechanisms* without the antecedent imports the whole
cost of Backstage's model (B-6) for none of its benefit. What DOES transfer is the cheap part: a
declarative target id resolved at build time with validation (M-1, M-4), host-owned typed data flow to the
contributed component (M-7), and a shared component kit for legibility (F2).

## Contracts

See the `contracts` array of the structured return. In prose:

- `defineWidgetConfig({ zone: string | string[] })` — Medusa's whole declaration surface (F1).
- Generated Medusa widget record `{ Component, zone: string[], widgetId }`, `widgetId` defaulting to
  `Widget-<4-char-hash-of-normalized-path>` (F3).
- `isValidInjectionZone(zone: string): boolean` — build-time gate; failures drop the widget (F3).
- `DetailWidgetProps<T> = { data: T }` — host→widget data contract (F1).
- Directus `ExtensionManifest` (zod): `{ name, version, type?, description?, icon?, dependencies?,
  devDependencies?, 'directus:extension': ExtensionOptions }` (F7).
- Directus `ExtensionOptions`: `{ host: string, type: app|api|hybrid|'bundle', path, source,
  sandbox?: { enabled, requestedScopes: { request?, log?, sleep? } }, entries?: {type,name,source}[] }`
  where path/source become `SplitEntrypoint {app, api}` for hybrid/bundle (F8).
- Strapi `app.registerPlugin({ id, injectionZones: Record<view, Record<block, []>> })` (F11).
- Strapi `getPlugin(id).injectComponent(view, block, { name, Component })` (F11).
- Strapi `getAdminInjectedComponents(moduleName, containerName, blockName): InjectionZoneComponent[]`,
  empty array on unknown (F12).
- Strapi permission entry `{ action: 'admin::audit-logs.read' }` (F12).
- Backstage: App / Extension (parent-attached, tree) / Plugin / Extension Override / Utility API / Route
  (F13).
- RHDH `dynamic-plugins.yaml` + per-plugin `dynamicRoutes` / `mountPoints` config (F16).

## Drift candidates

- **RFC #890's framing "inspired by Medusa zones" vs. what Medusa actually does.** If #890 assumes
  plugin-declared or namespaced zones, that is Strapi's model (F11), not Medusa's — Medusa zones are a
  closed core-owned vocabulary with no plugin minting (F4). Severity: architectural, because it changes
  whether zone collision is a problem that needs solving at all.
- **"Collision handling" as a required design element.** In Medusa collision cannot occur (F4); in Strapi
  the failure is a silent empty array (F12). If the RFC spends design budget on collision semantics, prior
  art suggests the real question is *ordering within a zone* (unverified even in Medusa, M-8), not name
  collision. Severity: significant.
- **Assuming admin-console prior art implies RBAC/sandbox obligations for NetScript devtools.** Those exist
  in Directus/Strapi because of production data and untrusted extensions (F6, F9, F12); the antecedents do
  not hold for an in-workspace dev surface. Severity: significant if carried in unchallenged.
- **Assuming build-time inclusion is the safe default because everyone does it.** Everyone does it (F2, F3,
  F10) and the largest deployment of that model had to escape it (F16). For a dev-only surface the relevant
  property is *exclusion from the production build*, which none of these systems needed. Severity: minor
  to significant depending on how NetScript packages devtools.

## Open questions

Listed in the structured return.

## Sources

Saved artifact (all URLs + extractions, numbered F1–F17 plus failed fetches):
`.llm/runs/plan-devtools-contribution--seed/research/sources/m3-admin-consoles-fetch-log.md`

Primary URLs fetched:
- https://docs.medusajs.com/learn/fundamentals/admin/widgets (F1)
- https://docs.medusajs.com/learn/fundamentals/admin (F2)
- https://raw.githubusercontent.com/medusajs/medusa/develop/packages/admin/admin-vite-plugin/src/widgets/generate-widgets.ts (F3)
- https://docs.medusajs.com/resources/admin-widget-injection-zones (F4)
- https://directus.com/docs/guides/extensions/overview.html (F5)
- https://directus.com/docs/guides/extensions/api-extensions/sandbox (F6)
- https://raw.githubusercontent.com/directus/directus/main/packages/extensions/src/shared/schemas/manifest.ts (F7)
- https://raw.githubusercontent.com/directus/directus/main/packages/extensions/src/shared/schemas/options.ts (F8)
- https://directus.com/docs/guides/auth/access-control (F9)
- https://docs.strapi.io/cms/plugins-development/admin-panel-api (F10)
- https://docs.strapi.io/cms/plugins-development/admin-injection-zones (F11)
- https://raw.githubusercontent.com/strapi/strapi/develop/packages/core/admin/admin/src/StrapiApp.tsx (F12)
- https://backstage.io/docs/frontend-system/architecture/index (F13)
- https://backstage.io/docs/plugins/ (F14)
- https://backstage.io/docs/plugins/add-to-directory/ (F15)
- https://redhat-developer.github.io/red-hat-developers-documentation-rhdh/main/plugins-rhdh-about/ (F16)

Secondary (search results, used only for B-6 inference, F17):
- https://tldrecap.tech/posts/2026/backstagecon-europe/backstage-dynamic-runtime-plugins/
- https://developers.redhat.com/blog/2025/01/17/red-hat-developer-hub-simplifies-backstage-plug-management
- https://piotrminkowski.com/2025/06/13/backstage-dynamic-plugins-with-red-hat-developer-hub/

Failed: https://backstage.io/docs/getting-started/configure-app-with-plugin → HTTP 404.
