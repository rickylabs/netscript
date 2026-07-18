# Contracts — `@netscript/plugin-frontend-core/contracts/v1` (draft)

> **Draft — design document only.** Shapes are normative in intent, sketch in detail; field-level
> bikeshedding belongs to the adversarial + docs passes. Idiom follows
> `BasePluginContract` (`packages/plugin/src/contract-base/domain/base-contract.ts`): typed seams,
> Standard-Schema (zod) validation, re-exported — never redefined — by consumers.

## Package

`@netscript/plugin-frontend-core` — new **Archetype 1 (small contract)** package. Exports:

```jsonc
// packages/plugin-frontend-core/deno.json (sketch)
{
  "name": "@netscript/plugin-frontend-core",
  "exports": {
    ".": "./mod.ts",                    // defineFrontend + re-export of contracts/v1
    "./contracts/v1": "./src/contracts/v1/mod.ts",
    "./testing": "./src/testing/mod.ts" // renderContribution harness (phase 2)
  }
}
```

Dependency posture: depends on nothing but `@netscript/contracts`-grade utilities and zod.
It must **not** depend on `fresh`, `@netscript/fresh`, or `@netscript/fresh-ui` — contributions
are data; only hosts touch the framework. (Component *references* are module specifiers, not
component values — see `ComponentRef` below. This is what keeps the contract package
framework-free and the registry statically emittable.)

## The manifest — what a plugin's `./frontend` export IS

```ts
// contracts/v1/manifest.ts (sketch)

/** The value of a plugin's `./frontend` export — pure data, validated at build time. */
export interface FrontendManifest {
  /** Contract handshake. The ONLY compat gate (mirrors contributesTo in the dashboard family). */
  readonly contract: 'v1';
  /** Plugin id — must equal the owning plugin's manifest name (validated by the registry). */
  readonly plugin: string;
  /**
   * Preferred mount base for route contributions, e.g. '/crons'. The HOST may remap
   * (04-host-runtime.md §2); collisions are a generate-time error, not a runtime surprise.
   * Defaults to '/' + plugin id.
   */
  readonly base?: string;
  readonly routes?: readonly RouteContribution[];
  readonly islands?: readonly IslandContribution[];
  readonly zones?: readonly ZoneContribution[];
  readonly nav?: readonly NavContribution[];
  readonly theme?: readonly ThemeContribution[];
  /** Declared data needs — audit surface + doctor input + future T1/T2 enforcement. */
  readonly requires?: FrontendRequires;
}

export interface FrontendRequires {
  /** Core/host ports the contributions read (e.g. 'telemetry-query'). */
  readonly ports?: readonly string[];
  /** Own-contract oRPC procedures called through the plugin API proxy (04 §4). */
  readonly procedures?: readonly string[];
}
```

## Component references

```ts
// contracts/v1/refs.ts (sketch)

/**
 * A module specifier RELATIVE TO THE PLUGIN'S `frontend/` directory, e.g.
 * './routes/calendar.tsx'. The registry emitter resolves it against the plugin's package name
 * to a full importable specifier ('@acme/plugin-crons/frontend/routes/calendar').
 * Data, not code: manifests never hold component values.
 */
export type ComponentRef = `./${string}`;
```

## Contribution kinds (the base family)

All kinds share:

```ts
// contracts/v1/contribution.ts (sketch)
export interface FrontendContributionBase {
  /** Stable id unique within the plugin: 'calendar', 'session-widget'. Full id = '<plugin>/<id>'. */
  readonly id: string;
  readonly title?: string;
  /** fresh-ui icon name (packages/fresh-ui primitives IconName). */
  readonly icon?: string;
  /**
   * Which host surfaces may mount this contribution. Default ['app'].
   * 'dashboard' reserves the dev-dashboard host; its family extension adds dashboard-only kinds.
   */
  readonly surfaces?: readonly ('app' | 'dashboard')[];
}
```

### 1. `RouteContribution` — a page

```ts
export interface RouteContribution extends FrontendContributionBase {
  readonly kind: 'route';
  /** Path under the manifest base, Fresh syntax: '/calendar', '/schedules/:id'. */
  readonly path: string;
  /** Fresh route module: default export page and/or `handler`, standard `define.*` idiom. */
  readonly module: ComponentRef;
  /** Optional convenience: emit a NavContribution pointing here. */
  readonly nav?: Omit<NavContribution, 'kind' | 'id' | 'route'>;
}
```

Route modules are **ordinary Fresh route modules** — `define.page`, `define.handlers`, layouts via
a plugin-local `_layout` (`04-host-runtime.md §2`). Lazy-loaded by the host
(`App.route(path, MaybeLazy)` upstream surface).

### 2. `IslandContribution` — interactive component

```ts
export interface IslandContribution extends FrontendContributionBase {
  readonly kind: 'island';
  /** One island component per file (Fresh convention). All exports of the module hydrate. */
  readonly module: ComponentRef;   // './islands/CronCalendar.tsx'
}
```

Islands are registered with the build (`islandSpecifiers` / `registerIsland`) so **plugin pages
and zone components simply import and render them** — the exact idiom app authors already use.
No wrapper, no props schema at v1: types flow through the import.

### 3. `ZoneContribution` — SSR component into a host injection zone

```ts
export interface ZoneContribution extends FrontendContributionBase {
  readonly kind: 'zone';
  /** Published zone id (see AppZone below). Unknown zone = generate-time error. */
  readonly zone: AppZone | (string & {});   // dashboard family widens with its own zones
  /** SSR component; may import the plugin's islands for interactivity. */
  readonly module: ComponentRef;
  /** Deterministic ordering among contributions in the same zone (then by plugin id, then id). */
  readonly order?: number;
}

/** v1 app-surface zones — a published, versioned enum. Additive growth = minor; removal = v2. */
export type AppZone =
  | 'app.topbar.end'         // right side of the scaffolded topbar (_layout.tsx)
  | 'app.dashboard.panels'   // the scaffolded /dashboard panel grid
  | 'app.home.cards'         // the scaffolded index page card strip
  | 'app.footer';            // global footer strip

/** Props every zone component receives from the host. Deliberately minimal at v1. */
export interface ZoneProps {
  readonly url: URL;
  /** Host state slice defined by PluginHostState (04-host-runtime.md §5). */
  readonly host: PluginHostState;
}
```

### 4. `NavContribution` — a typed nav entry

```ts
export interface NavContribution extends FrontendContributionBase {
  readonly kind: 'nav';
  readonly label: string;
  /** Route contribution id (same plugin) or absolute href. */
  readonly route: string;
  /** Host nav group. The scaffolded app has 'main' (topbar); hosts may define more. */
  readonly group?: string;
  readonly order?: number;
}
```

Nav entries compile to the existing fresh-ui nav data model — `SidebarNavItem` /
`SidebarNavSection` (`packages/fresh-ui/registry/components/ui/sidebar-shell.tsx:8-32`) and the
topbar in the scaffolded `_layout.tsx.template` — and to typed route references
(`createRouteReference`, `@netscript/fresh/route`) so `routes.plugins.crons.calendar.href()` is
available app-wide.

### 5. `ThemeContribution` — token-safe styling

```ts
export interface ThemeContribution extends FrontendContributionBase {
  readonly kind: 'theme';
  /** CSS files consuming ONLY the --ns-* semantic vocabulary (fresh-ui tokens). */
  readonly css: readonly ComponentRef[];
}
```

v1 is a CSS overlay layer aggregated by the registry (`03-discovery-and-registry.md §3`); plugin
CSS is scoped under `[data-ns-plugin='<id>']` (`04-host-runtime.md §6`). DTCG token-file merging
into `tokens:build` is an explicit **non-goal at v1** (owner fork F5, `../plan.md`).

## The union and the registry shape

```ts
export type FrontendContribution =
  | RouteContribution | IslandContribution | ZoneContribution
  | NavContribution | ThemeContribution;

/** What .netscript/generated/frontend.registry.ts exports. */
export interface FrontendContributionRegistry {
  readonly contract: 'v1';
  readonly plugins: ReadonlyMap<string, ResolvedFrontendManifest>;
}

/** Manifest after registry resolution: refs expanded to absolute specifiers, base finalized. */
export interface ResolvedFrontendManifest extends FrontendManifest {
  readonly resolvedBase: string;                       // after host remap + collision check
  readonly specifierOf: (ref: ComponentRef) => string; // '@acme/plugin-crons/frontend/...'
}
```

## The pointer — the ONLY thing core learns

```ts
// packages/plugin (additive; no vocabulary import)
export interface FrontendContributionRef {
  readonly export: string;      // './frontend' — a deno.json export of the plugin package
  readonly framework: 'fresh';  // doctrine 07 axis discriminator; reserved for expansion
  readonly contract: 'v1';
}
// PluginContributions gains: readonly frontend?: FrontendContributionRef;
// PluginBuilder gains:      .withFrontend(ref: FrontendContributionRef)
// PluginInstallerManifest (scaffold.plugin.json) gains the same block, parse-only:
//   "frontend": { "export": "./frontend", "framework": "fresh", "contract": "v1" }
```

The pointer mirrors `scaffolder.export` (`packages/plugin/src/protocol/manifest.ts:28-34`):
readable at install/doctor time without executing plugin code. Bump
`PLUGIN_MANIFEST_SCHEMA_VERSION` additively.

## Validation & versioning

- `defineFrontend()` (see `02-authoring-dx.md`) validates against the zod schemas and freezes —
  same posture as `definePlugin().build()`
  (`packages/plugin/src/config/builders/plugin-builder.ts:282`).
- Cross-checks at registry-generation time (not runtime): plugin id matches; route ids referenced
  by nav exist; zone ids known for the targeted surfaces; base collisions; duplicate contribution
  ids (doctrine 07: duplicate rejection with a structured error naming both contributors).
- **Versioning**: `contract: 'v1'` + JSR-versioned subpath `contracts/v1`. Additive evolution
  (new zones, new optional fields, new kinds) stays v1; breaking cuts `contracts/v2` with a host
  support window — carried unchanged from the ratified dashboard design
  (`plugin-extension-architecture.md` §4), including the quarantine-not-crash render rule and the
  three-fact drift surfacing (package / contract / peer).
