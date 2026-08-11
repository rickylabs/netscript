# m3 admin-consoles — raw fetch log (2026-08-11)

All entries below are the extraction output of a `WebFetch` against the listed URL, recorded at
fetch time. Quotes inside are quotes from the fetched page.

---

## F1 — https://docs.medusajs.com/learn/fundamentals/admin/widgets

- Widgets declare zone via `defineWidgetConfig({ zone: "product.details" })`.
- `zone` accepts "a string or array of strings indicating the injection zone(s) to inject the
  widget into."
- Legacy: prior to v2.17.2 zones used `.before` / `.after` suffixes (e.g. `product.details.before`);
  now deprecated except for login page zones.
- Detail-page widgets receive a `data` prop: `({ data }: DetailWidgetProps<AdminProduct>)`.
- Page does NOT state behaviour for unknown/invalid zones, nor ordering of multiple widgets in one
  zone.

## F2 — https://docs.medusajs.com/learn/fundamentals/admin

- Two extension mechanisms: Widgets (new sections on existing pages) and UI Routes (new pages).
- Admin build tool is "Vite v5"; admin served at `http://localhost:9000/app`.
- "You can't customize the admin dashboard's layout, design, or the content of the existing pages
  (aside from injecting widgets)."
- Medusa UI package provides ready-made components for design consistency.

## F3 — https://raw.githubusercontent.com/medusajs/medusa/develop/packages/admin/admin-vite-plugin/src/widgets/generate-widgets.ts

- Build-time AST traversal finds the `config` object (`VariableDeclarator` for bundled files,
  `ExportNamedDeclaration` for unbundled) and extracts the `zone` property.
- `extractZoneValues` handles string literals, arrays of strings, and REJECTS template literals with
  a warning.
- Extracted zones are filtered through `isValidInjectionZone()`; invalid zones are silently dropped;
  if none remain a warning is emitted: "'zone' property is not a valid injection zone"; the file
  returns `null` and generates no widget entry.
- Generated module map emits `import WidgetComponent0, { config as WidgetConfig0 } from ...` and a
  `widgets: [...]` array of `{ Component, zone: string[], widgetId }`.
- `widgetId` is either an explicit string override or a stable hash `Widget-<4-char hash>` derived
  from the normalized file path.

## F4 — https://docs.medusajs.com/resources/admin-widget-injection-zones

- Zone naming scheme `{page}.{location}`; locations are descriptive (`.list`, `.details`) or
  legacy `.before`/`.after` (login only).
- 20+ page categories (Campaign, Customer, Order, Product, Promotion, Settings, Workflow,
  Price List, Draft Order, Gift Card, Inventory, Topbar...).
- Verbatim examples captured: `workflow.list`, `workflow.details`, `topbar`.
- List zones pass no extra props; details zones pass a typed entity prop.
- No mention anywhere of plugin-declared zones — the zone vocabulary is core-owned.

## F5 — https://directus.com/docs/guides/extensions/overview.html

- 9 extension types. App: interfaces, displays, layouts, panels, modules, themes. API: hooks,
  endpoints, operations.
- Modules are "top-level areas of the Data Studio".
- Page states extensions "execute code inside the Directus server".
- Manifest fields, host compat, sandbox, load mechanism NOT on this page.

## F6 — https://directus.com/docs/guides/extensions/api-extensions/sandbox

- Sandboxed extensions get only "JavaScript standard built-in objects"; `console`, `setTimeout` are
  unavailable without a grant.
- Declared in package.json: `"sandbox": { "enabled": true, "requestedScopes": {} }`.
- Scopes: `log` (replaces console.log), `sleep` (replaces setTimeout), `request` (allowed HTTP
  methods + allowed URLs with wildcards, e.g. `https://directus.com/*`).

## F7 — https://raw.githubusercontent.com/directus/directus/main/packages/extensions/src/shared/schemas/manifest.ts

```typescript
export const ExtensionManifest = z.object({
	name: z.string(),
	version: z.string(),
	type: z.union([z.literal('module'), z.literal('commonjs')]).optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	dependencies: z.record(z.string(), z.string()).optional(),
	devDependencies: z.record(z.string(), z.string()).optional(),
	[EXTENSION_PKG_KEY]: ExtensionOptions,
});
```

## F8 — https://raw.githubusercontent.com/directus/directus/main/packages/extensions/src/shared/schemas/options.ts

- `host: z.string()` — required host-version range field.
- `type`: discriminated union over APP_EXTENSION_TYPES | API_EXTENSION_TYPES |
  HYBRID_EXTENSION_TYPES | `'bundle'`.
- `path` / `source`: `z.string()` for app/api; `SplitEntrypoint` (`{ app, api }`) for hybrid/bundle.
- `sandbox`: optional `{ enabled: boolean, requestedScopes: { request?, log?, sleep? } }`.
- bundle `entries`: array of `{ type, name, source }` where source is string or SplitEntrypoint.

## F9 — https://directus.com/docs/guides/auth/access-control

- "A policy can toggle access to the App (Data Studio)."
- Studio user = has a policy with Admin Access OR a policy with App Access; otherwise API-only and
  consumes no seat.
- Page does NOT document per-extension/per-module gating for non-admin roles.

## F10 — https://docs.strapi.io/cms/plugins-development/admin-panel-api

- Lifecycle: `register()` (registerPlugin, addMenuLink, addSettingsLink, declare injection zones,
  reducers), `bootstrap()` (getPlugin('x').injectComponent, hooks, Content-Manager extensions),
  `registerTrads()`.
- Content-Manager APIs: `addEditViewSidePanel()`, `addDocumentAction()`, `addBulkAction()`.
- Entry file `[plugin-name]/admin/src/index.js`.
- Admin panel changes require a rebuild; Vite/webpack bundling.

## F11 — https://docs.strapi.io/cms/plugins-development/admin-injection-zones

Predefined zones:

| View | Zone |
|---|---|
| Edit view | `editView.right-links` |
| List view | `listView.actions` |
| List view | `listView.deleteModalAdditionalInfos` |
| Preview | `preview.actions` |

```javascript
app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
  name: 'my-plugin-custom-button',
  Component: MyCustomButton,
});
```

Plugin declares its own zones in `register`:

```javascript
app.registerPlugin({
  id: 'dashboard',
  injectionZones: {
    homePage: { top: [], middle: [], bottom: [] },
    sidebar: { before: [], after: [] },
  },
});
```

Cross-plugin injection in `bootstrap`, guarded by presence check:

```javascript
const dashboardPlugin = app.getPlugin('dashboard');
if (dashboardPlugin) {
  dashboardPlugin.injectComponent('homePage', 'top', { name: 'widget-plugin-statistics', Component: Widget });
}
```

## F12 — https://raw.githubusercontent.com/strapi/strapi/develop/packages/core/admin/admin/src/StrapiApp.tsx

```typescript
addMenuLink = (link: Parameters<typeof this.router.addMenuLink>[0]) =>
  this.router.addMenuLink(link);

addSettingsLink = (
  sectionId: string | Pick<StrapiAppSetting, 'id' | 'intlLabel'>,
  link: UnloadedSettingsLink | UnloadedSettingsLink[]
): void => { this.router.addSettingsLink(sectionId, link); };

createHook = (name: string) => { this.hooksDict[name] = createHook(); };

getAdminInjectedComponents = (moduleName, containerName, blockName): InjectionZoneComponent[]
```

- Permissions shape seen in widget registration: `permissions: [{ action: 'admin::audit-logs.read' }]`.
- `getAdminInjectedComponents` reads `this.admin.injectionZones[moduleName][containerName][blockName]`
  and RETURNS AN EMPTY ARRAY on failure (unknown zone is a no-op, not an error).

## F13 — https://backstage.io/docs/frontend-system/architecture/index

- Building blocks: App (root, "wires things together"), Extensions (tree; each attaches to a parent
  and may have children — the "app extension tree"), Plugins, Extension Overrides (high-priority
  replacements), Utility APIs (TS-interface-based shared functionality), Routes (indirection layer
  so plugins link to each other without knowing URLs).
- Page has a TODO for package structure; no bundle-size/lazy-load claims present.

## F14 — https://backstage.io/docs/plugins/

- Marked "Legacy". Introductory; no install/wiring detail.

## F15 — https://backstage.io/docs/plugins/add-to-directory/

- Plugins are npm packages: "Make sure that your package had been published on the NPM registry and
  that it's public"; naming `@backstage/plugin-<etc>` / org-scoped.
- Page does not describe app-side consumption.

## F16 — https://redhat-developer.github.io/red-hat-developers-documentation-rhdh/main/plugins-rhdh-about/

- "You can install, configure, and load plugins at runtime without changing or rebuilding the
  application. You only need a restart. You can load these plugins from NPM, tarballs, or OCI
  compliant container images."
- `dynamic-plugins.yaml` declares which plugins are installed/enabled at startup.
- Export produces `dist-dynamic/dist-scalprum` (Scalprum / module federation) as the dynamic bundle.
- Frontend integration is declarative config: `dynamicRoutes` and `mountPoints`.

## F17 — WebSearch (query: Backstage plugins require forking/rebuilding; dynamic plugins)

Secondary/blog sources returned (NOT primary docs; treated as unverified colour):
- https://piotrminkowski.com/2025/06/13/backstage-dynamic-plugins-with-red-hat-developer-hub/
- https://developers.redhat.com/blog/2025/01/17/red-hat-developer-hub-simplifies-backstage-plug-management
- https://tldrecap.tech/posts/2026/backstagecon-europe/backstage-dynamic-runtime-plugins/ — BackstageCon
  Europe talk "Forget Rebuilding, Install Plugins at Runtime" (David Festal & Jon Koops, Red Hat).
Claim reported across them: installing a plugin requires rebuilding the app image; transitive
dependency bloat ("banana and the rainforest") slows CI. Not verified against primary docs.

## Failed fetches

- https://backstage.io/docs/getting-started/configure-app-with-plugin → HTTP 404 (page moved/removed
  at fetch time). The `yarn add --cwd packages/app` + `App.tsx` `<Route>` wiring claim is therefore
  UNVERIFIED in this corpus.
