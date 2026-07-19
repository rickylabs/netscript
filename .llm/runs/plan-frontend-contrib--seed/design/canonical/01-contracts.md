# Contracts — `@netscript/plugin-frontend-core/contracts/v1` (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial findings S-2, S-5, S-7, S-8,
> S-9, S-10, S-17 (`../../adversarial-sol.md`, dispositions in `../../adversarial-triage.md`).
> Idiom follows `BasePluginContract`: typed seams, Standard-Schema (zod) validation, re-exported —
> never redefined — by consumers.

## Package

`@netscript/plugin-frontend-core` — new **Archetype 1 (small contract)** package. Exports:

```jsonc
{
  "name": "@netscript/plugin-frontend-core",
  "exports": {
    ".": "./mod.ts",                    // defineFrontend + re-export of contracts/v1
    "./contracts/v1": "./src/contracts/v1/mod.ts",
    "./testing": "./src/testing/mod.ts" // host-fixture test kit (see plan §Gates)
  }
}
```

**Dependency law (S-5 hardened):** this package holds **serializable types, schemas, and the
`defineFrontend` validator only**. No `fresh`, no `@netscript/fresh`, no `preact`, no runtime
helpers. Everything that touches the framework — `definePluginPage`, `pluginApi`, the route-module
normalizer, state injection — lives in `@netscript/fresh/plugins` (`04-host-runtime.md`).
Component *references* are module specifiers (data), which is what keeps this package
framework-free and the registry statically emittable.

## Identity model (S-8)

One string cannot serve provenance, URLs, CSS scoping, and authorization. Four identities, each
with one job:

```ts
export interface FrontendIdentity {
  /** Immutable package/source identity: '@netscript/plugin-auth'. Provenance + version drift. */
  readonly packageName: string;
  /**
   * Canonical plugin kind: 'auth', 'crons' — matches the installer manifest's
   * officialSource.canonicalName idiom (plugins/auth/scaffold.plugin.json:50). Stable across
   * forks/aliases of the same capability.
   */
  readonly pluginKind: string;
  /** Installation/instance id, host-assigned at install; = pluginKind unless multi-instance. */
  readonly installationId: string;
  /** Host-assigned mount id — THE key for routes, CSS scope, gateway paths, registry entries. */
  readonly mountId: string;
}
```

Manifests declare `pluginKind`; the installer/registry assigns `installationId`/`mountId` and
validates `packageName` against the owning plugin. All generated keys (base path, `data-ns-plugin`
scope, gateway prefix, typed route ref namespace) derive from `mountId`, never from `packageName`.

## The envelope — versioning that can actually evolve (S-7)

A discriminated-union member added to a strict schema is **not** additive: old validators reject
it, exhaustive consumers break. v1 therefore separates a stable **envelope** from **family
payloads**:

```ts
// contracts/v1/envelope.ts
export interface FrontendManifestEnvelope {
  /** Family + major — the handshake. Hosts register family schemas they support. */
  readonly contract: { readonly family: 'app'; readonly major: 1 } | FamilyRef;
  readonly pluginKind: string;
  /** Preferred mount base ('/crons'); host remaps; full collision rules in 03 §3. */
  readonly base?: string;
  /** Family payload, validated by the family's registered schema — never by the envelope. */
  readonly contributions: readonly unknown[];
  readonly requires?: FrontendRequires;
}
export interface FamilyRef { readonly family: string; readonly major: number }
```

- The **`app` family, major 1** is this document's payload schema (the five kinds below).
- The dashboard family is `{ family: 'dashboard', major: 1 }` — its own payload schema in
  `plugin-dashboard-core`, its own kinds, validated by hosts that register it. It *extends
  nothing at the schema level*; it shares the envelope, discovery pipeline, identity model, and
  host-surface negotiation. (This replaces the rev-1 "widened union" story, which was unsound.)
- **Evolution rules:** new optional field on an existing kind = minor (validators must ignore
  unknown fields — schemas are `.passthrough()` at the payload boundary); new kind or new
  discriminant = **new major** of that family; hosts declare supported `(family, major)` windows
  in their `HostSurfaceDescriptor` and quarantine outside the window. Old-host/new-plugin and
  new-host/old-plugin negotiation each get a contract test.

A plugin's `./frontend` export is one envelope (or an array of envelopes, one per family — e.g. a
plugin contributing to both the app surface and the dashboard).

## `app` family payload — the five kinds

Shared base:

```ts
export interface AppContributionBase {
  readonly id: string;               // unique within (plugin, family)
  /** Human title as a message ref: host-localizable, default text mandatory (S-17). */
  readonly title?: MessageRef;
  readonly icon?: string;            // fresh-ui IconName
}
export interface MessageRef { readonly id: string; readonly default: string }
```

### 1. `route`

```ts
export interface RouteContribution extends AppContributionBase {
  readonly kind: 'route';
  readonly path: string;             // under the resolved base, Fresh syntax
  /**
   * Fresh route module by package-relative ref ('./routes/calendar.tsx'). The generated
   * registry emits a LITERAL lazy loader per route —
   *   () => import('@scope/pkg/frontend/routes/calendar').then(normalizeFreshRouteModule)
   * — because upstream App.route() takes an internal Route shape, not a fs route module, and
   * computed import() hides the edge from the bundler (S-2). normalizeFreshRouteModule is owned
   * by @netscript/fresh/plugins and maps default/handler(s)/config/css onto the Route shape.
   * Plugin `_layout` modules are NOT supported in v1 (explicitly rejected at generate time).
   */
  readonly module: ComponentRef;
  readonly nav?: NavSpec;            // convenience: emits a nav contribution targeting this route
}
```

### 2. `island`

```ts
export interface IslandContribution extends AppContributionBase {
  readonly kind: 'island';
  readonly module: ComponentRef;     // one island component per file (Fresh convention)
}
```

Island props cross Fresh's serialization boundary: **props must be serializable data** — the
authoring doc states it, the test kit checks it, and `PluginClientContext` (below) defines what
host data is island-safe. Build-behavior proof status: Wave-0 gate P3 (`../../plan.md`) — the
`islandSpecifiers` API is verified; clean-cache/JSR/HMR/CSS behavior is not yet.

### 3. `zone`

```ts
export interface ZoneContribution extends AppContributionBase {
  readonly kind: 'zone';
  readonly zone: string;             // validated against the HOST's published surface (below)
  readonly module: ComponentRef;     // SSR component; may import the plugin's islands
  readonly order?: number;
}
```

### 4. `nav` (S-10: discriminated target, no ambiguous strings)

```ts
export interface NavContribution extends AppContributionBase {
  readonly kind: 'nav';
  readonly label: MessageRef;
  readonly target:
    | { readonly kind: 'route'; readonly routeId: string }   // same plugin; base-path composed
    | { readonly kind: 'href'; readonly href: string }        // host-internal absolute path
    | { readonly kind: 'external'; readonly href: string };   // rel/noopener enforced by host
  readonly group?: string;           // validated against HostSurfaceDescriptor.navGroups
  readonly order?: number;
}
```

### 5. `theme`

```ts
export interface ThemeContribution extends AppContributionBase {
  readonly kind: 'theme';
  readonly css: readonly ComponentRef[];  // --ns-* vocabulary only; scoping rules in 04 §8
}
```

```ts
export type ComponentRef = `./${string}`;
export type AppContribution =
  | RouteContribution | IslandContribution | ZoneContribution
  | NavContribution | ThemeContribution;
```

## Host surface negotiation (S-10)

Zones and nav groups are **host data, not schema constants**. Each host publishes a versioned
descriptor; the registry validates contributions against the *host it is generated for*:

```ts
export interface HostSurfaceDescriptor {
  readonly host: string;                        // 'app' (scaffolded app), 'dashboard', …
  readonly families: readonly FamilyRef[];      // supported (family, major) windows
  readonly zones: readonly { readonly id: string; readonly capacity?: number }[];
  readonly navGroups: readonly string[];
  readonly reservedPaths: readonly string[];    // '/_fresh', '/api/plugins', host basePath rules
}
```

The scaffolded app template ships its descriptor (v1 zones: `app.topbar.end`,
`app.dashboard.panels`, `app.home.cards`, `app.footer`; nav group `main`). Adding a zone to a
host is a data change, not a contract change — which is what makes zone growth genuinely
additive (this, not schema openness, resolves rev-1's `(string & {})` hole). Diagnoses are
distinct: **unknown zone** (typo — generate-time error) vs **known-but-unmounted** (plugin fine,
surface absent — informational, not quarantine) vs **capacity-rejected** (deterministic overflow
report).

## Host context — split server/client (S-9)

```ts
/** SERVER-ONLY — lives under Fresh app state (state.pluginHost); may hold functions/ports. */
export interface PluginRequestContext {
  readonly identity: FrontendIdentity;
  readonly base: string;                                  // resolved mount base
  readonly serviceUrl: (service: string) => string;       // host runtime-config/Aspire resolution
  /** Principal PORT — supplied by the auth plugin when installed; base contract owns only the port shape. */
  readonly principal: PrincipalPort | null;
  readonly csp: { readonly nonce?: string };              // Fresh CSP seam passthrough
  readonly signal: AbortSignal;
}

/** SERIALIZABLE — safe to pass to islands; versioned with the family schema. */
export interface PluginClientContext {
  readonly mountId: string;
  readonly base: string;
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly timeZone: string;
  readonly subject: { readonly signedIn: boolean; readonly display?: string } | null;
  readonly capabilities: readonly string[];               // granted requires, for UI degradation
}
```

`SessionClaims` (a concrete auth type) appears in **neither** — the auth family supplies a
`PrincipalPort` implementation; unauthenticated hosts carry `principal: null` and no auth
dependency. Zone components receive `{ url, host: PluginRequestContext, client:
PluginClientContext }` server-side and may forward only `client` (or slices of it) to islands.

## `requires` — the gateway's input, not prose (S-6 linkage)

```ts
export interface FrontendRequires {
  readonly ports?: readonly string[];
  /**
   * Procedure grants consumed by the generated deny-by-default gateway (04 §4): each entry
   * names a procedure the plugin's OWN contract exposes; the gateway derives service owner,
   * method, path template, and streaming policy from the plugin's versioned contract metadata.
   * Not an audit comment — the actual allowlist.
   */
  readonly procedures?: readonly string[];
}
```

## Validation & cross-checks

- `defineFrontend()` validates the envelope + `app` payload schema and freezes (posture of
  `definePlugin().build()`).
- Generate-time cross-checks (structured errors): pluginKind/package match; nav `routeId`
  resolution; zone/navGroup validation against the target host descriptor; duplicate ids; base
  collisions per the **full rules** in `03-discovery-and-registry.md §3` (route-pattern overlap,
  reserved paths, host basePath composition — not string equality); module refs present in the
  package export map.
- Quarantine (render-time) is reserved for contract-window mismatch and load failure — never for
  known-but-unmounted surfaces.

## The pointer — unchanged

`@netscript/plugin` learns only `FrontendContributionRef = { export, framework: 'fresh',
contract: FamilyRef[] }` (builder `.withFrontend()`, installer-manifest `frontend` block,
parse-only). `PLUGIN_MANIFEST_SCHEMA_VERSION` bumps additively; older CLIs ignore the block —
and because the older *host* also lacks the frontend generate step, ignoring is safe (no
half-wired state).
