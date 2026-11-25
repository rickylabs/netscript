---
rfc: 0000
title: Unified Frontend Contribution Layer
status: Draft
authors: ['@rickylabs']
created: 2026-11-25
tracking-issue: https://github.com/rickylabs/netscript/issues/922
target-milestone: 0.0.10
---

# Unified Frontend Contribution Layer

## Summary

This RFC defines **one unified, Fresh-3-ready frontend contribution layer** for NetScript plugins. It **supersedes the merged PR `#890` seed RFC** ([`.llm/runs/plan-frontend-contrib--seed/rfc.md`](../.llm/runs/plan-frontend-contrib--seed/rfc.md)) and **unifies its contribution spine with accepted RFC 0005** ([`rfcs/0005-devtools-contribution.md`](./0005-devtools-contribution.md)). Under a single neutral contract package (`@netscript/plugin-frontend-core`, Doctrine Archetype 1 — zero Fresh, Preact, Vite, DOM, CSS, or Deno-only dependencies), plugins declare portable `frontend` (and later unified `devtools`) contributions: versioned typed host zones, declarative schema + `x-ns-ui` descriptors (renderable across Fresh 2, Fresh 3, GPUIX desktop, and mobile), pure-data routes (`middleware -> handler/loader({ data }) -> pure page`), isolated islands, navigation items, and deny-by-default procedures. `@netscript/cli` validates manifest pointers and containment transactionally into `.netscript/generated/frontend.registry.ts` (literal `() => import(spec)` loaders, never runtime-assembled AST hacks or Fresh `App` instances) and emits `.netscript/generated/frontend.diagnosis.json`. Fresh 2.3.3 mechanics — `GuardedPluginApp`, `normalizeFreshRouteModule`, `<Partial name="main">`-inside-shell `isPartial` rendering, `@fresh/plugin-vite@1.1.2` asset wiring, and the `@layer ns-plugins, ns-app;` cascade prelude — are strictly isolated inside `@netscript/fresh/plugins` and `@netscript/fresh/vite` so Fresh 3.x (`Vite 8 + Nitro 3 + Preact 11 + renderPage(inner)`) and GPUIX (`rfcs/0007`) require zero changes to plugin manifests or core contracts. For `0.0.10`, the RFC cuts an acyclic **First Usable Seams** baseline (`@netscript/plugin-frontend-core` + preconditions `#1473`/`#1474` -> transactional generator + `@netscript/fresh/plugins` + P5 gateway -> `defineFrontendTestSuite` + `@netscript/plugin-workers` dogfood) backed by three live Wave-0 empirical probes under [`.llm/runs/rfc-frontend-contribution-v2--rfc/probes/`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log).

---

## Motivation

Two independent pressures forced a complete unification before writing a single line of `#922` implementation code:

1. **Duplicate architecture debt between `#890` (`#922`–`#946`) and accepted `RFC 0005` (`#1469`–`#1476`).**
   After PR `#890` landed the `.llm/runs/plan-frontend-contrib--seed/` design corpus on `2026-08-03`, accepted [`RFC 0005`](./0005-devtools-contribution.md) (`2026-08-11`) hardened the exact same extension mechanics for DevTools: manifest `.passthrough()` evolution (`#1474`), host-derived path containment and scoped generator subprocesses (`#1473`), `ContributionIdentity` collision prevention (forbidding `resolvePluginLocalName`), transactional replace-set generation, bounded host `anchors`, clamped `order ∈ [-100, 100]`, and a unified 6-state diagnosis taxonomy. Keeping both specs separate would force plugins and `@netscript/cli` to carry two manifest blocks, two generators, two diagnosis files, and two Vite isolation paths.

2. **Six real downstream consumer pressures surfaced in [`rickylabs/eis-etl`](https://github.com/rickylabs/eis-etl) and open PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670).**
   Before NetScript shipped a plugin UI system, `eis-etl` had to hand-roll plugin zones, schemas, partials, CSS splitting, and secret redaction across cockpit workflows:
   - **Entity/context-scoped zones & health catalog ([`eis-etl#63`](https://github.com/rickylabs/eis-etl/issues/63)):** Hosts need versioned, strongly typed entity zones (`home.widgets`, `nav.spaces`, `pipeline.inspector.sections`, `run.detail.panels`, `review.detail.body`, `dataset.detail.panels`) alongside an honest `Healthy | Quarantined | Incompatible | UpdateAvailable | Unverified` Plugin Catalog read model — not only a single generic app dashboard box.
   - **Renderer-agnostic schema + UI-hint `descriptor` plugins ([`eis-etl#453`](https://github.com/rickylabs/eis-etl/issues/453), [`eis-etl#448`](https://github.com/rickylabs/eis-etl/issues/448)):** Activity/connector plugins often should NOT ship arbitrary Fresh TSX at all. They declare JSON Schema / Standard Schema + UI hints (`editable`, `fixedByPlugin`, `secret`, `overridable`, `widget`, plus optional typed dock tabs), and the host renders native inspector forms using vetted `@netscript/fresh-ui` components — directly aligning with PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670)'s `secret-field`, `key-value-editor`, and `chips-input` registry components.
   - **Server-side secret redaction & write-only secret handles ([`eis-etl#450`](https://github.com/rickylabs/eis-etl/issues/450), [`eis-etl#453`](https://github.com/rickylabs/eis-etl/issues/453)):** Without framework-enforced redaction before serialization, URL userinfo, sensitive headers, and schema-marked secret fields leak into `PluginClientContext`, SSR HTML, and island hydration props, or accidentally overwrite real secrets when a client echoes a masked placeholder (`__NS_REDACTED_SECRET__`).
   - **Non-blocking `<Partial name="main">`-inside-shell navigation ([`eis-etl#426`](https://github.com/rickylabs/eis-etl/issues/426), [`eis-etl#421`](https://github.com/rickylabs/eis-etl/issues/421)):** NetScript's current [`_layout.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51) wraps `<SidebarShell>` *inside* `<Partial name="page">`, mirroring the exact anti-pattern `eis-etl#426` caught in production (~60 KB of redundant shell chrome + 3 blocking RPCs per navigation on 19 routes). Host shells must sit *outside* `<Partial name="main">`, branch on `ctx.isPartial`, and pair async panels/dock tabs with `@netscript/fresh/query` (`QueryIsland`, `staleTime`, hover prefetch).
   - **Route-scoped CSS & corrected cascade layer order ([`eis-etl#438`](https://github.com/rickylabs/eis-etl/issues/438), [`eis-etl#422`](https://github.com/rickylabs/eis-etl/issues/422)):** Importing all CSS + `@source` roots globally swells cold route CSS (761 KB in `eis-etl#438`; `84,788 B` vs `169 B` in Wave-0 Probe B). Worse, PR `#890` wrote `@layer ns-app, ns-plugins;`, which Probe B proved **inverts CSS Cascade Level 5 priority** so plugin rules beat app overrides (`rgb(220, 38, 38)` vs `rgb(22, 163, 74)`). The mandatory prelude is `@layer ns-plugins, ns-app;`, paired with shared `ns-theme` persistence (`data-theme`/`data-scheme`/`data-density`/`data-flavor`).
   - **Current NetScript scaffolding still hardcodes plugin UI:** [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template#L14-L33) hardcodes three `@plugins/*/streams` aliases while `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template` (lines 25–58) hardcodes `'streams'` and `'workers'` capability cards, bypassing `#2582` consumer targeting (`NetScript.Apps`) and generic extension discovery.

3. **Fresh 3.x & GPUIX multi-renderer readiness.**
   Fresh 2.3.3 (`@fresh/core@2.3.3` + `@fresh/plugin-vite@1.1.2` + Vite 7.2.2) is the runtime in `0.0.10`, while Fresh 3.x (`Vite 8 + Nitro 3 + Preact 11 + renderPage(inner)`) and GPUIX desktop (`rfcs/0007`) require strict separation between route data loading and pure view rendering. Coupling `@netscript/plugin-frontend-core` or generated registries to Fresh 2 `App` instances or inline `ctx.render()` would trap every plugin on Fresh 2.

---

## Guide-level explanation

From a plugin author's perspective, adding UI to a NetScript plugin is declarative, Fresh-3-idiomatic, and runtime-portable:

1. **Declare pure descriptors and/or Fresh-3-aligned route modules in the plugin.**
   A schema-only connector or activity plugin needs **zero JSX or Fresh dependency** — it exports a `descriptor` contribution from `@netscript/plugin-frontend-core`:

   ```ts
   import { defineFrontendDescriptor } from '@netscript/plugin-frontend-core';
   import { z } from 'zod';

   export const webhookEndpointDescriptor = defineFrontendDescriptor({
     id: 'webhook-endpoint',
     zone: 'pipeline.inspector.sections/v1',
     order: 10,
     schema: z.object({
       endpointUrl: z.string().url().meta({
         'x-ns-ui': { title: 'Endpoint URL', editable: true, overridable: false },
       }),
       apiToken: z.string().optional().meta({
         'x-ns-ui': {
           title: 'Bearer Token',
           secret: true,
           widget: 'secret-field',
           editable: true,
         },
       }),
       headers: z.record(z.string(), z.string()).default({}).meta({
         'x-ns-ui': { widget: 'key-value-editor', editable: true },
       }),
     }),
     tabs: [
       {
         id: 'live-payload',
         title: 'Live Payload',
         anchor: 'inspector/dock/v1',
       },
     ],
   });
   ```

   When a plugin ships a rich web console route (`plugins/workers` dogfood), it separates data loading from pure presentation using Fresh 3's `middleware -> handler/loader({ data }) -> pure page` shape — **without calling `ctx.render()` inside handlers**:

   ```tsx
   // plugins/workers/frontend/routes/jobs.tsx
   import { page } from 'fresh';
   import type { PageProps } from 'fresh';

   export const css = ['/plugins/workers/jobs.css'] as const;

   export const handlers = {
     async GET(ctx: { state: { correlationId?: string } }) {
       return page({
         correlationId: ctx.state.correlationId ?? 'none',
         jobs: await loadRedactedJobs(),
       });
     },
   };

   export default function WorkersJobsPage(
     { data }: PageProps<{ correlationId: string; jobs: readonly RedactedJobSummary[] }>,
   ) {
     return (
       <section class='ns-workers-console'>
         <h1>Background Jobs</h1>
         <JobTable jobs={data.jobs} />
       </section>
     );
   }
   ```

2. **Point `@netscript/plugin` at the frontend module and declare static pointer exports.**
   In `plugins/workers/scaffold.plugin.json`, `"frontend"` registers the package-relative `./frontend` export using only JSON-safe metadata (no AST regex scraping):

   ```json
   {
     "schemaVersion": 1,
     "name": "@netscript/plugin-workers",
     "frontend": {
       "export": "./frontend",
       "mountPrefix": "/plugins/workers",
       "mountId": "workers",
       "defaultOnInvalid": "fail-install",
       "budgets": {
         "maxInitialClientJsBytes": 12288,
         "maxRouteCssBytes": 8192
       }
     }
   }
   ```

3. **Generate, wire, and diagnose deterministically.**
   Running `netscript plugin add workers --app web` (built on `#2582`'s `resolvePluginAppReferences`) and `netscript generate plugins` transactionally generates:
   - `.netscript/generated/frontend.registry.ts` — neutral descriptor records + literal `() => import('@netscript/plugin-workers/frontend/routes/jobs')` loaders + island specifiers + procedure metadata + redacted schema metadata.
   - `.netscript/generated/frontend.diagnosis.json` — deterministic 6-state diagnostics (`unknown-zone`, `known-but-unmounted`, `capacity-rejected`, `window-mismatch`, `load-failure`, `zone-contract-mismatch`).

4. **Host app consumes neutral descriptors via `@netscript/fresh/plugins` (Fresh 2.3.3) and `@netscript/fresh/vite`.**
   The Fresh 2 app shell declares `@layer ns-plugins, ns-app;` as the first line of its stylesheet, places `<Partial name="main">` *inside* its persistent shell while branching on `ctx.isPartial`, mounts validated plugins inside `GuardedPluginApp` **after** `fsRoutes()`, and renders zones using `<FrontendZone name="app.dashboard.panels/v1" context={...} />` with automatic pre-render `try/catch` quarantine and secret redaction.

---

## Reference-level explanation

### 1. Package Architecture, Archetypes, and Runtime-Portable Boundary

Per [`docs/architecture/doctrine/06-archetypes.md`](../docs/architecture/doctrine/06-archetypes.md) and [`docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`](../docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md), responsibilities split across strict package seams with **zero framework leakage into contracts or manifests**:

| Package / Subpath | Archetype | Permitted Dependencies | Owns | Forbidden Dependencies |
| --- | --- | --- | --- | --- |
| `@netscript/plugin-frontend-core` (`packages/plugin-frontend-core`) | **Archetype 1 — Small Contract** | `@standard-schema/spec`, `zod` (type-only or catalog schema helpers), `@netscript/contracts` | `FamilyRef`, `ContributionEnvelope`, `ContributionIdentity`, versioned zone contracts, `descriptor` + `x-ns-ui` schemas, `RedactedSecretHandle`, `SecretWriteInput`, `FrontendPluginCatalog` read types, 6-state diagnosis types, `onInvalid` policy, CI budgets, neutral route/loader descriptors | Fresh (`fresh`, `@fresh/*`), Preact (`preact`, `@preact/signals`), Vite, Tailwind, DOM/CSS, `Deno.*` APIs, runtime registries |
| `@netscript/plugin` (`./frontend`, `./protocol`, `./sdk`) | **Archetype 3 / Protocol** | `@netscript/plugin-frontend-core`, `@netscript/plugin/protocol` | Manifest `schemaVersion: 1` `.passthrough()` evolution (`#1474`), `.withFrontend(...)` builder pointer, path-safety validators, contract-level compatibility checks | Fresh, Preact, Vite, DOM |
| `@netscript/cli` (internal generator, doctor, install/dev seams) | **CLI Host** | `@netscript/plugin-frontend-core`, `@netscript/plugin/protocol`, `#2582` `resolvePluginAppReferences` | Host-derived lexical + `Deno.realPath` containment (`#1473`), scoped generator subprocesses, transactional `.netscript/generated/frontend.registry.ts` & `frontend.diagnosis.json`, scaffold template wiring, `plugin doctor`, `plugin dev`, `plugin resource add --app` | Direct Fresh runtime rendering (`renderToString`), regex `AstExtractor` |
| `@netscript/fresh/plugins` (`packages/fresh/src/runtime/plugins/`) | **Archetype 2/4 — Fresh 2.3.3 Adapter** | `fresh@^2.3.3`, `preact@^10.29.2`, `@netscript/plugin-frontend-core`, `@netscript/fresh` | `GuardedPluginApp`, post-`fsRoutes` mount hook on `defineFreshApp`, `normalizeFreshRouteModule`, `<FrontendZone>`, pre-render `Promise.allSettled` containment, server-side secret redaction enforcement, `FrontendPluginCatalog` host instance, P5 deny-by-default HTTP procedure gateway | Direct dependency on plugin source packages (`plugins/*`) |
| `@netscript/fresh/vite` (`packages/fresh/src/application/vite/vite.ts`) | **Fresh 2 / Vite 7 Adapter** | `vite@7.2.2`, `@fresh/plugin-vite@1.1.2` | Generated plugin `islandSpecifiers`, watch paths, Preact & `@preact/signals` deduplication + `canonicalizePreactSignalsImport`, asset alias injection | Arbitrary unpinned `@fresh/plugin-vite` upgrades or Nitro 3 config |
| `@netscript/plugin-*-core` (`plugins/*/frontend`) | **Plugin / Core** | `@netscript/plugin-frontend-core` (for contracts/descriptors); optional `preact` / `@netscript/fresh-ui` *only* in Fresh web UI entrypoints | Domain descriptors (`descriptor`), optional route/zone/island implementations | Importing `@netscript/cli` internals or another plugin's UI internals |

**Generated Neutral Registry Shape (`.netscript/generated/frontend.registry.ts`):**
The CLI never imports Fresh `App` or emits `new App()` inside generated project files. It writes deterministic sorted TypeScript with literal `() => import(specifier)` thunks (statically analyzable by Deno, Vite 7, Vite 8, Nitro 3, and GPUIX):

```ts
// .netscript/generated/frontend.registry.ts (GENERATED — DO NOT EDIT)
import type { GeneratedFrontendRegistryV1 } from '@netscript/plugin-frontend-core';

export const generatedFrontendRegistry: GeneratedFrontendRegistryV1 = {
  schemaVersion: 1,
  targetApp: 'web',
  contributions: [
    {
      family: { id: 'frontend', version: 1 },
      identity: {
        packageName: '@netscript/plugin-workers',
        pluginId: 'workers',
        localId: 'workers/jobs',
        contributionId: '@netscript/plugin-workers#workers/jobs',
      },
      pluginVersion: '0.0.9',
      kind: 'route',
      mountId: 'workers',
      anchor: 'app.nav.sidebar/plugins/v1',
      order: 10,
      routePattern: '/plugins/workers/jobs',
      moduleSpec: '@netscript/plugin-workers/frontend/routes/jobs',
      loadModule: () => import('@netscript/plugin-workers/frontend/routes/jobs'),
      declaredIslands: ['@acme/local-plugin/island'],
      budgets: { maxInitialClientJsBytes: 12288, maxRouteCssBytes: 8192 },
    },
  ],
  islands: [
    '@netscript/fresh/defer/island',
    '@netscript/plugin-workers/frontend/islands/job-actions',
  ],
} as const;
```

This single neutral registry file replaces:
- PR `#890`'s Fresh-coupled `plugin-routes.ts` / `plugin-islands.ts` proposal, and
- [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template#L21-L45)'s hardcoded `@plugins/*/streams` alias list (generated feeds read directly from `generatedFrontendRegistry`).

---

### 2. Unified `RFC 0005` Spine Invariants

Accepted [`RFC 0005`](./0005-devtools-contribution.md) established structural invariants to stop extension drift. This RFC adopts them as the shared foundation across **both** `devtools` (`panel`, `link`, `diagnostic`) and `frontend` (`route`, `zone`, `descriptor`, `island`, `nav`, `procedure`) families:

1. **Neutral `ContributionEnvelope` & Typed Kind Registry (Doctrine AP-3 / AP-24):**
   Every contribution shares a single discriminated envelope keyed by `family: FamilyRef` (`{ id: 'frontend' | 'devtools'; version: 1 }`) and `kind`. No `Record<string, unknown>` escape hatches or unvalidated dynamic plugin calls exist at registration time:

   ```ts
   export interface FamilyRef {
     readonly id: 'frontend' | 'devtools';
     readonly version: 1;
   }

   export interface ContributionIdentity {
     readonly packageName: string;     // e.g. '@netscript/plugin-workers'
     readonly pluginId: string;        // canonical manifest id / alias
     readonly localId: string;         // plugin-unique local key
     readonly contributionId: string;  // `${packageName}#${localId}`
   }

   export type InvalidContributionPolicy = 'fail-install' | 'exclude-and-diagnose';

   export interface ContributionEnvelope<TKind extends string, TPayload> {
     readonly family: FamilyRef;
     readonly identity: ContributionIdentity;
     readonly pluginVersion: string;
     readonly netscriptWindow: string; // semver range on NetScript host contract
     readonly kind: TKind;
     readonly anchor: string;          // host-curated '<mountId>/<id>/v<apiMajor>'
     readonly order: number;           // clamped integer in [-100, 100]
     readonly onInvalid?: InvalidContributionPolicy;
     readonly payload: TPayload;
   }
   ```

2. **`ContributionIdentity` Quartet (Forbidding `resolvePluginLocalName`):**
   [`packages/cli/src/kernel/adapters/config/plugin-registry.ts#L86-L91`](../packages/cli/src/kernel/adapters/config/plugin-registry.ts#L86-L91) currently strips `@scope/plugin-` to produce an unscoped local suffix via `resolvePluginLocalName()`. Two packages `@acme/plugin-workers` and `@vendor/plugin-workers` silently collide on route prefixes, generated chunks, and anchor slots. **Frontend and DevTools generators MUST key all identifiers, gateway paths, CSS scopes, and diagnosis records by the full `ContributionIdentity` quartet (`packageName`, `pluginId`, `localId`, `contributionId`), never `resolvePluginLocalName`.**

3. **Host-Curated Anchors, Bounded Capacity, & 2-Tier Deterministic Ordering:**
   - **Anchors:** Hosts declare explicit extension points via `<mountId>/<id>/v<apiMajor>` (for zones, `<zoneName>/v<major>` — e.g., `app.dashboard.panels/v1`, `pipeline.inspector.sections/v1`, `run.detail.panels/v1`, `inspector/dock/v1`). Unknown anchors never create arbitrary DOM injections; they emit `unknown-zone`.
   - **Order Clamping & Determinism:** Author-supplied `order` is validated/clamped to integer `[-100, 100]`, sorted ascending by `(order, identity.contributionId)`. Duplicate `contributionId` or route pattern conflicts fail validation per `onInvalid`.
   - **Capacity Budgets:** Hosts declare optional `maxContributions` per anchor and payload byte budgets. Overflow records `capacity-rejected` rather than silently truncating or panicking.

4. **Unified 6-State Diagnosis Taxonomy & `frontend.diagnosis.json`:**
   `RFC 0005` defined 6 canonical states; PR `#890` omitted `zone-contract-mismatch` and spoke of 5. The unified system uses **one 6-state taxonomy** across CLI `generate`, `plugin doctor`, host runtime quarantine chrome, and `FrontendPluginCatalog`:

   | State | Trigger | Default Behavior (`exclude-and-diagnose`) | When `onInvalid: 'fail-install'` |
   | --- | --- | --- | --- |
   | `unknown-zone` | Contributed `anchor` / `zone` not declared by `HostSurfaceDescriptor` | Excluded from mount; rendered only in Doctor / Catalog diagnostics | Blocks `generate` / install |
   | `known-but-unmounted` | Valid anchor in host catalog, but host page/route disabled or omitted `<FrontendZone>` | Recorded cleanly as unmounted capability (`CapabilityEmpty` state `'installed-unwired'`) | Informational warning (not fatal) |
   | `capacity-rejected` | Anchor `maxContributions` or JS/CSS budget exceeded | Highest-priority items up to cap mounted; remainder quarantined | Blocks `generate` |
   | `window-mismatch` | Plugin `netscriptWindow` semver fails host compatibility | Quarantined with `Incompatible` catalog badge | Blocks `generate` / install |
   | `load-failure` | Dynamic `import()` throw, `normalizeFreshRouteModule` validation error, or pre-render resolver throw | Replaced inline by Quarantine fallback card + structured error in `frontend.diagnosis.json` | Dev throws loud banner; Prod quarantines safely |
   | `zone-contract-mismatch` | Zone `contextSchema` or `propsSchema` mismatch at generate time or SSR | Quarantined before JSX render (`Incompatible` / `Quarantined`) | Blocks `generate` / SSR render |

5. **Per-Family & Per-Contribution `onInvalid` Knob:**
   - `frontend` family default: `'fail-install'` for manifest/schema/containment/duplicate-route errors during `generate plugins` (`exclude-and-diagnose` opt-in for graceful optional dashboard packs).
   - `devtools` family default: `'exclude-and-diagnose'` (preserving `RFC 0005`'s resilience when a broken developer tool shouldn't halt app boot).
   - Pre-render runtime loader exceptions during HTTP requests ALWAYS degrade to per-zone quarantine (`HTTP 200` + `load-failure` card) unless the top-level dedicated plugin route itself throws.

6. **Manifest `.passthrough()` Precondition (`#1474`, Keeping `schemaVersion: 1`):**
   Live [`packages/plugin/src/protocol/manifest.ts#L297-L311`](../packages/plugin/src/protocol/manifest.ts#L297-L311) ends `PluginInstallerManifestSchema` with `.strict()` on `schemaVersion: 1`. As empirically proved in Probe C tests `1.1` and `1.2`:
   - Existing `.strict()` rejects any plugin shipping `"frontend"` or `"devtools"` pointer fields before CLI upgrade.
   - Changing the installer top-level object from `.strict()` to `.passthrough()` **while keeping `schemaVersion: 1`** preserves backward compatibility with existing plugins, while **`validateFrontendPointerAtGenerateTime`** enforces strict schema validation on the `"frontend"` sub-object whenever `generate plugins` runs! (And `"devtools"` validates symmetrically under `RFC 0005`.)

7. **Host-Derived Path Containment (`#1473`) & Rejection of Regex `AstExtractor` / Unscoped Subprocesses:**
   - **Lexical + Physical Symlink Containment:** [`packages/cli/src/kernel/application/ui/registry.ts#L310-L317`](../packages/cli/src/kernel/application/ui/registry.ts#L310-L317) (`resolveTarget`) currently trusts `isAbsolute(target) ? target : resolve(projectRoot, target)` with zero traversal checks. Every generated output target (`.netscript/generated/...`) and `ModuleRef` / UI registry file MUST pass `safeRepoRelativeTarget` (rejecting `../`, `\`, `\0`, absolute paths, Windows drives, UNC prefixes, percent-encoded `%2e%2e`) followed by post-`Deno.realPath` containment verification against `projectRoot` / plugin package root (verified in Probe C `1.3`).
   - **Scoped Generator Subprocesses:** [`installed-runtime-registry-generator.ts#L390-L391`](../packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts#L390-L391) currently spawns child generators with bare `'--allow-read'`, `'--allow-write'`. `#1473` scopes subprocess `--allow-read` / `--allow-write` to explicit project & cache directories and uses static manifest declarations + literal dynamic `import()`.
   - **Explicit Rejection of Regex `AstExtractor`:** [`packages/plugin/src/sdk/discovery/ast-extractor.ts`](../packages/plugin/src/sdk/discovery/ast-extractor.ts) strips strings/comments with regex heuristics to locate builders. Frontend discovery **MUST NOT** extend `AstExtractor`; all frontend manifests use structured `.withFrontend(...)` JSON pointers + package `exports` + literal `() => import(spec)`.

---

### 3. Unified Contribution Kinds (`frontend` + `devtools`)

Every plugin frontend capability maps cleanly onto six `frontend` kinds (plus the three `devtools` kinds under the same spine) with zero overlap:

| Family | Kind | Target Anchor Pattern | Payload Summary | Portable Across Fresh 2 / Fresh 3 / GPUIX? |
| --- | --- | --- | --- | --- |
| `frontend` | `route` | `app.routes/v1` (or sub-mount `<mountId>/routes/v1`) | `routePattern`, `moduleSpec`, `css?: readonly string[]`, `partialName?: string`, `budgets`, `authPolicy` | Data loader + route contract portable (`Fresh 3` & `GPUIX`); JSX view uses host adapter |
| `frontend` | `zone` | `<zoneName>/v<major>` (e.g. `app.dashboard.panels/v1`, `pipeline.inspector.sections/v1`, `run.detail.panels/v1`) | Typed `contextSchema` (`StandardSchemaV1`), optional declarative `match` predicate (`entityType`, `capability`), `loaderSpec`, `viewSpec` or inline `descriptor` | Context schema, match predicate, and data loader 100% portable |
| `frontend` | `descriptor` | `<zoneName>/v<major>` or `inspector/sections/v1` | **Pure declarative JSON Schema + `x-ns-ui` metadata (`editable`, `fixedByPlugin`, `secret`, `overridable`, `widget`) + optional typed `tabs` (`anchor: 'inspector/dock/v1'`, query endpoint)** — zero arbitrary client JS (`eis-etl#453`) | **100% portable** across Fresh 2, Fresh 3, GPUIX desktop, and mobile |
| `frontend` | `island` | Host build manifest (`islandSpecifiers`) | Package subpath export `moduleSpec`, peer constraints (`preact@^10.29.2`, `@preact/signals@2.11.3`), CSS subpath, max JS budget | Web renderers (Fresh 2 Vite 7, Fresh 3 Vite 8); ignored/replaced cleanly on native GPUIX |
| `frontend` | `nav` | `app.nav.sidebar/v1`, `app.nav.topbar/v1`, `app.nav.spaces/v1` (`eis-etl#63`) | `label`, `href` / bound route ref, `icon` (L0 token/lucide key), `match: 'exact' \| 'prefix'`, optional live `countQuery` (non-blocking `QueryIsland`) | **100% portable** data metadata |
| `frontend` | `procedure` | `app.gateway.procedures/v1` | oRPC `ContractProcedure` + `NetScriptProcedureMeta` (`authentication`, `authorization`, `audience`, `cache`, rate/body/timeout limits) | **100% portable** HTTP/RPC boundary |
| `devtools` | `panel` / `link` / `diagnostic` | `devtools.drawer/v1`, `devtools.routes/v1`, `devtools.doctor/v1` | Existing [`RFC 0005`](./0005-devtools-contribution.md) §6–§8 read-only diagnostic panels, typed deep-links, and checks running on the shared `ContributionEnvelope` | Same shared core & diagnosis spine |

#### Declarative Schema + `x-ns-ui` Descriptor Contract & PR `#2670` Alignment (`eis-etl#448`, `#453`, `#421`)

Consumer `eis-etl#453` (`plim.endpoint-test@1`) demonstrated why declarative `descriptor` must be a **first-class** contribution kind rather than requiring every plugin to bundle client islands:

```ts
export type NsUiWidgetHint =
  | 'text'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'secret-field'      // PR #2670: SECRET_FIELD_UNCHANGED_TOKEN / SECRET_FIELD_CLEAR_TOKEN
  | 'key-value-editor'  // PR #2670: per-row secret toggle + HTTP_HEADER_NAME_PATTERN
  | 'chips-input'       // PR #2670: validated chip list + optional Combobox suggestions
  | 'code'
  | 'json';

export interface NsUiFieldHints {
  readonly title?: string;
  readonly description?: string;
  readonly widget?: NsUiWidgetHint;
  readonly editable?: boolean;      // false => read-only display even for admins
  readonly fixedByPlugin?: boolean; // host locks value (e.g. plugin-enforced endpoint version)
  readonly secret?: boolean;        // triggers server-side redaction BEFORE serialization
  readonly overridable?: boolean;   // allow instance override on published/locked resources
  readonly group?: string;
  readonly order?: number;
}
```

- **Host extension compatibility:** Domain hosts that define typed UI overlays such as `x-eis-ui` map cleanly into `NsUiFieldHints` through an adapter field (`meta['x-ns-ui'] ?? normalizeOverlay(meta['x-eis-ui'])`), preserving zero breaking changes for `eis-etl` activities.
- **Direct alignment with PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670) (currently open targeting `#2669`):** When `@netscript/fresh/plugins` renders a `descriptor` inside a Fresh 2 host app, `secret-field`, `key-value-editor`, and `chips-input` map 1:1 to `@netscript/fresh-ui` registry components (`packages/fresh-ui/registry/components/ui/secret-field.tsx`, `key-value-editor.tsx`, `chips-input.tsx`), preserving `SECRET_FIELD_UNCHANGED_TOKEN` (`'__ns_secret_unchanged__'`) and `SECRET_FIELD_CLEAR_TOKEN` (`'__ns_secret_clear__'`) with zero reveal toggle on stored secrets. *(Until PR `#2670` merges to `main`, W1/W2 keep `NsUiWidgetHint` as pure contract metadata in `@netscript/plugin-frontend-core`, and W3/host templates wire the rendered components once `#2670` lands.)*
- **Typed dock tabs (`eis-etl#421`, `#453`):** A `descriptor` or `zone` can declare `tabs?: readonly DescriptorTabSpec[]` bound to an anchor such as `inspector/dock/v1`, pairing a typed data endpoint (served via `QueryIsland` with `staleTime` + hover/selection prefetch) without blocking primary route navigation.

---

### 4. Fresh 2.3.3 Host Runtime Adapter (`@netscript/fresh/plugins` & `@netscript/fresh/vite`)

All Fresh 2.3.3 quirks discovered in Wave-0 Probes A and B are encapsulated inside `@netscript/fresh/plugins` and `@netscript/fresh/vite`:

#### 4.1 `GuardedPluginApp`, Post-`fsRoutes` Mounting, & Route Normalization

Probe A (`P1.0`, `P1a`, `P1d`, `P1e`, `P1g`, `P2a`–`P2c`) proved five load-bearing Fresh `2.3.3` constraints:

1. **`defineFreshApp` ordering ([`packages/fresh/src/runtime/server/define-fresh-app.ts#L114-L115`](../packages/fresh/src/runtime/server/define-fresh-app.ts#L114-L115)):** Currently `options.configure?.(app)` runs **before** `registerFsRoutes(app, options)`. Probe A `P1.0` proved that any `mountApp` or `app.route` registered before `fsRoutes()` **misses host `_app`, `_layout`, and `_middleware`**, whereas post-`fsRoutes` mounts inherit all three cleanly (and compose cleanly with `basePath`, `P1c`). **Implementation fix:** add an explicit post-`fsRoutes` `configurePlugins` / `plugins` mount option inside `defineFreshApp` so host apps never wire plugin mounts before `fsRoutes()`.
2. **`GuardedPluginApp` vs Private `App.#commands` (`P1g`):** In `@fresh/core@2.3.3`, `App.#commands` is an ES `#private` field, and raw `app.mountApp(prefix, childApp)` merges child commands directly so a rogue child calling `.notFound()`, `.appWrapper()`, or global `.onError()` **overwrites the host shell and 404 handler for all subsequent routes**. `@netscript/fresh/plugins` therefore passes plugins a **`GuardedPluginApp` proxy/facade** that isolates `.route()`, `.use()`, `.all()`, and scoped `.onError()` while stripping/rejecting `.notFound()`, `.appWrapper()`, and `.fsRoutes()` (proven in `P1g`).
3. **Avoid flat `app.route()` + `/prefix/*` middleware (`P1d`):** Fresh's `patternToSegments` turns `/prefix/*` into a literal `'*'` child segment so `app.use('/prefix/*')` is silently skipped. Using mounted `GuardedPluginApp` sub-apps preserves exact `host-mw -> plugin-mw -> nested-mw -> handler` execution order and isolates co-mounted plugins (`P1f`).
4. **Fresh-3-idiomatic `normalizeFreshRouteModule` (`P2a`–`P2c`):**
   Plugin route modules MUST load lazily via literal `() => import(spec).then(normalizeFreshRouteModule)`. The normalizer enforces **strict export allowlisting** (`default` component, `handler` or `handlers` [not both], `config`, `css`), rejects unknown exports (`UNKNOWN_ROUTE_EXPORTS`), ambiguous handler forms (`AMBIGUOUS_HANDLERS`), empty modules (`EMPTY_ROUTE_MODULE`), and invalid CSS exports (`INVALID_CSS_EXPORT`), wires `route.css` into Fresh's `setAdditionalStyles`, and enforces **Fresh 3's `middleware -> handlers.GET -> page({ data }) -> pure page` shape** with zero inline `ctx.render()` calls inside plugin pages (verified on full and `?fresh-partial=true` responses in Probe A `P2c`).
5. **Component-only `_404` status gotcha (`P1e`):** Probe A `P1e` showed that in Fresh `2.3.3`, a component-only `_404` (`newNotFoundCmd`) returns HTTP `200`; host apps and scoped plugin catch-alls (`subApp.all('/*')`) must pair `_404` / unmatched handlers with explicit HTTP `404` responses.

#### 4.2 Non-Blocking `<Partial name="main">`-Inside-Shell & `ctx.isPartial` Chrome Fix (`eis-etl#426`, `P1b-aware`)

Probe A `P1b-naive` vs `P1b-aware` confirmed the exact bug present today in [`packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51):

- Wrapping `<SidebarShell>` *inside* `<Partial name="page">` forces Fresh to transmit and re-evaluate the entire shell (`hasShellInPartial: true`) — causing redundant ~60 KB transfers and blocking navigation queries in `eis-etl#426`.
- Putting `<Partial name="main">` **inside** `<SidebarShell>` without `ctx.isPartial` branching eliminates the shell inside `<!--frsh:partial:main-->` markers (`hasShellInPartial: false`), **but the raw HTTP response still executes `_layout` and emits outer chrome** (`rawBodyHasShellChrome: true`, `P1b-naive`).
- **Required host pattern (`P1b-aware`):** Host `_app.tsx` and `_layout.tsx` branch on `ctx.isPartial` (skipping shell chrome on `?fresh-partial=true` while wrapping `<Partial name="main"><Component /></Partial>` *inside* the persistent shell on full document loads). Plugins inside `<Partial name="main">` may render nested sub-partials with distinct names (`name="p1-widget"`), while `name="main"` inside plugins is forbidden (Fresh throws `Rendered response contains duplicate partial name: "main"` at `preact_hooks.ts:224`).
- **Async zone/count queries:** Navigation badge counts and heavy zone panels load non-blockingly via `@netscript/fresh/query` (`QueryIsland`, `useIslandQuery`, `staleTime`, hover prefetch). In parallel, W2 exports [`packages/fresh/src/runtime/server/sse.ts`](../packages/fresh/src/runtime/server/sse.ts) on `@netscript/fresh/server` (it already exists on disk but is missing from [`packages/fresh/src/runtime/server/mod.ts`](../packages/fresh/src/runtime/server/mod.ts)).

#### 4.3 Three-Layer SSR & Client Error Containment (`P0.1`, `P4a`–`P4e`)

Probe A empirically proved that **Preact `ErrorBoundary` cannot be relied on as the primary Fresh `2.3.3` SSR fault fence**:

- `preactOptions.errorBoundaries` is `undefined` by default in Fresh `2.3.3` (`P0.1`). Mutating it globally works only for *synchronous* class boundaries (`P4b`), while default SSR throws HTTP 500 on synchronous throws inside JSX.
- `renderToString` (`preact-render-to-string` 6.8.x) is synchronous: a nested `<AsyncChildZone />` is **not awaited**, silently rendering `<div></div>` with HTTP `200` and leaking an `unhandledrejection` (`P4c`)! (By contrast, top-level async route components are awaited by Fresh's `renderRouteComponent` and routed to `onError`.)

Therefore, `@netscript/fresh/plugins` enforces **three explicit containment layers**:

1. **Layer 1 — Host Pre-Render Data-Phase Containment (`P4a`):** `<FrontendZone>` **never executes async child components during JSX render**. All zone data resolvers and `descriptor` loaders execute *before* `ctx.render()` inside host `Promise.allSettled` + per-zone `try/catch`, producing a discriminated `ZoneLoadState` (`ready | quarantined | mismatched | empty`). Failing zones render an inline Quarantine fallback card while sibling zones stay `HTTP 200` healthy.
2. **Layer 2 — Client Island ErrorBoundary:** Hydrated islands wrap children in a browser `ErrorBoundary` so post-hydration clicks inside one widget cannot crash the host shell.
3. **Layer 3 — Route `onError` + Guarded `_error` (`P4d`):** Scoped route-level `onError` handles top-level plugin route throws, and root `_error` configures `{ skipAppWrapper: true, skipInheritedLayouts: true }` so host layout failures still render cleanly without an infinite `_app` throw loop.

#### 4.4 Vite 7.2.2, `@fresh/plugin-vite@1.1.2`, Single Preact/Signals Identity, & CSS `@layer` Architecture

Probe B verified all 15 Vite / CSS / ESM cells end-to-end with headless Chromium CDP (`optSize === 1`, shared signal sync `10 -> 11 -> 12`) and uncovered critical constraints that `@netscript/fresh/vite` and CLI templates must codify:

- **Strict Version Alignment & Build Flag Policy:**
  - Pin `@fresh/plugin-vite@1.1.2`, `vite@7.2.2`, `preact@^10.29.2`, and `@preact/signals@2.11.3` cleanly in workspace `catalog:` + peer constraints.
  - **Prohibit floating `@preact/signals` semver ranges & fix `vite.ts` `importer` resolution:** Probe B `M6` showed that when a remote plugin specifies `@preact/signals@^2.11.0` (resolving `2.11.4`) against host `2.11.3`, `vite build` converges to 1 `@preact/signals` chunk while `vite --configLoader native build` emits **2 chunks** (`fresh-island__acme_remote_mismatch_3-qSfICc9O.mjs` + `signals.module-Du6rrhKm.mjs`). Worse, in unlocked `--no-lock` environments, [`createNetScriptVitePlugin`](../packages/fresh/src/application/vite/vite.ts#L391-L404) currently passes `importer` unchanged to `this.resolve('@preact/signals', importer)` and omits `@preact/signals-core` from `dedupe`, allowing `@fresh/core@^2.3.3` itself (`^2.1.0 -> 2.11.4`) to race host `2.11.3` (`Error: Cycle detected` in browser when both load). W2 MUST resolve `@preact/signals` / `@preact/signals-core` relative to `appRoot` in `vite.ts`, keep host `deno task build` on `vite build` (never `--configLoader native build` in prod), and enforce exact peer pins.
  - **Root JSX Config (`M1`):** Linked local/external un-pragmatized TSX islands (such as `@netscript/fresh/defer/island`) cause `@fresh/plugin-vite`'s SSR loader to emit `React.createElement` -> `HTTP 500` unless the host root `deno.json` sets `"jsx": "precompile"`, `"jsxImportSource": "preact"`, or the package uses JSR `/** @jsxImportSource ... */` pragmas.
  - **Explicit Pre-Caching Over `--cached-only` (`M2`/`M3`/`M4`):** `@deno/loader@0.4.0` ignores `--cached-only` when uncached HTTP imports can be reached online (`M3`) and fails closed when offline (`M2`). Plugin install & build pipelines must explicitly `deno cache` resolved remote plugin specifiers beforehand; once cached, remote HTTP/JSR islands with CSS build, hydrate, and share `options.size === 1` in both prod and dev (`M4`/`M5`).
  - **Dev Edit-Loop Caveat (`D4`):** Upstream `@fresh/plugin-vite@1.1.2` `server_snapshot.ts:112` calls `islandSpecByName.clear()` on `fsRoute` file add/unlink and only re-scans `islands/`, temporarily dropping external `islandSpecifiers` until Vite restarts. `netscript plugin dev` documents this and triggers a controlled Vite restart whenever generated `islandSpecifiers` or route files add/remove entries.
- **Corrected CSS Cascade Prelude (`C2`):**
  **PR `#890`'s draft prelude (`@layer ns-app, ns-plugins;`) was inverted.** Probe B `C2` proved in browser `getComputedStyle` that `@layer ns-app, ns-plugins;` gives plugin styles higher precedence (`rgb(220, 38, 38)` beats app green). The normative host entrypoint (`assets/styles.css` line 1) MUST declare:

  ```css
  @layer ns-plugins, ns-app;
  ```

  In CSS Cascade Level 5, later-listed layers win regardless of `<link>` order in `<head>`. Probe B `C2` verified that with `@layer ns-plugins, ns-app;`, host styles (`rgb(22, 163, 74)`) beat plugin styles (`rgb(220, 38, 38)`) even when `client-entry` loads first (`D1`, `P3`).
- **Route/Island CSS Splitting & Vite CSS Pitfalls (`C1`, `C3`, `C4`, `P2`):**
  - Keep global `client-entry` CSS restricted to the `@layer` prelude, minimal tokens, and app shell (cutting cold `/` CSS from `84,788 B` to `169 B` minimal or `40,298 B` Tailwind shell in Probe B `C1`, avoiding the `761 KB` failure seen in `eis-etl#438`).
  - Island CSS imported inside island TSX is **automatically route-split** by `@fresh/plugin-vite@1.1.2` (`P2`) and never leaks onto cold `/`.
  - Programmatic mounted routes (`GuardedPluginApp`) MUST NOT rely on side-effect CSS imports (`import './route.css'`) or eager `app.route({ css })` (`commands.ts:316` skips eager `def.css`); they MUST declare `export const css = [...]` on lazy-loaded route modules (`P2a`, `P2`), and MUST NOT use `?url` CSS imports (`C3` fails in `deno.ts`) or share an identical imported `.css` file across two SSR route chunks (`C4` hits `@fresh/plugin-vite@1.1.2` `server_entry.ts:160` parallel `Deno.rename` `ENOENT`).
- **Shared Theme Persistence (`eis-etl#422`):** Host shells retain the `ns-theme` `localStorage` contract and `data-theme`, `data-scheme`, `data-density`, `data-flavor` attributes from [`_app.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_app.tsx.template#L4-L31), styling via `--ns-*` tokens inside `@layer ns-plugins` / `@layer ns-app`.

---

### 5. Fresh 3.x & GPUIX Migration Seam

**Honest release statement:** `0.0.10` delivers **only the Fresh 2.3.3 (`vite@7.2.2`, `@fresh/plugin-vite@1.1.2`) host adapter** under `@netscript/fresh/plugins`. Fresh 3.x is not yet GA and is not implemented in `0.0.10`.

To prevent Fresh 3 or GPUIX (`rfcs/0007`) from becoming a plugin ecosystem break later, this RFC establishes exact invariant seams verified against [`rfcs/0007-gpuix-native-desktop-renderer.md`](./0007-gpuix-native-desktop-renderer.md), [`.llm/runs/rfc-gpuix-desktop--rfc/research.md`](../.llm/runs/rfc-gpuix-desktop--rfc/research.md), and [`.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts`](../.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts):

| Layer | Fresh 2.3.3 (`0.0.10`) | Fresh 3.x Swap Target (Post-`0.0.10`) | GPUIX Native Desktop (`rfcs/0007`) | What Stays Unchanged |
| --- | --- | --- | --- | --- |
| Core contracts | `@netscript/plugin-frontend-core` (A1) | Identical | Identical | Manifest `"frontend"`, `ContributionEnvelope`, `descriptor`, `x-ns-ui`, redaction, catalog, 6-state diagnosis |
| Generated registry | `.netscript/generated/frontend.registry.ts` literal `() => import(spec)` | Identical | Consumes `descriptor`, `zone`, `nav`, `procedure`, and data loaders | Zero Fresh 2 `App` or VNode references in `.netscript/generated/` |
| Route module shape | `normalizeFreshRouteModule` enforces `middleware -> handlers -> page({ data }) -> pure page` (no inline `ctx.render()`, Probe A `P2c`) | Fresh 3 `freshHandler(handler, page, middlewares, layouts)` folds `inner` VNode -> `renderPage(inner)` | GPUIX `RouteModule` consumes loader `{ data }` + native view mapping | Zero `ctx.render()` rewrites needed in conforming plugin routes |
| Build & bundling | `@netscript/fresh/vite` (`vite@7.2.2` + `@fresh/plugin-vite@1.1.2`) | `@netscript/fresh3/vite` (`Vite 8 + Nitro 3` adapter, Preact 11 `ownerDocument` safety) | Cargo / GPUIX bundle | No Vite 7 leak in plugin manifests or `-core` contracts |
| UI rendering & CSS | `@netscript/fresh/plugins` + `<Partial name="main">` + `@layer ns-plugins, ns-app;` + CSS links | Fresh 3 adapter (`renderPage(inner)` + Nitro 3 partials) | Native flex/grid + `--ns-*` design token palette; ignores raw HTML/CSS, renders `descriptor` via GPUIX controls | Theme tokens + declarative `descriptor` forms work natively on both web and desktop |

**Plugin authoring rule for Fresh-3 portability:** Plugin route components and zones MUST be pure `(props: PageProps<TData>) => VNode` functions taking server-resolved `data`, NEVER calling `ctx.render()`, NEVER assuming single `document` globals without `ownerDocument` (`Preact 11`), and NEVER importing `@fresh/core` or `vite` directly outside optional Fresh web UI subpaths.

---

### 6. Security, Server-Side Secret Redaction, & Three-Lane Transport Boundary

#### 6.1 Secret Redaction Law & Write-Only Secret Handles (`eis-etl#450`, `#453`, Probe C `3.1`–`3.2`)

Every data path crossing from server plugins into `PluginClientContext`, zone props, `descriptor` values, SSR HTML, or island hydration JSON MUST pass through `@netscript/fresh/plugins`'s server-side redaction pipeline:

1. **Pre-null metadata evaluation:** Schema-driven redaction MUST inspect `x-ns-ui: { secret: true }` **before** short-circuiting on `null`/`undefined` or copying plain values, ensuring present secrets become structured redacted handles and empty fields preserve explicit `{ mode: 'clear' }` state cleanly (Probe C `3.1`).
2. **Deep redaction of strings & transport structures:**
   - Embedded URL credentials (`https://user:secret@host`, `postgres://u:p@db/app`) -> userinfo stripped (`https://***:***@host`).
   - Known sensitive query parameters (`token`, `secret`, `password`, `api_key`, `access_token`, `client_secret`) -> redacted.
   - Sensitive HTTP headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `proxy-authorization`, accepting both `Headers` instances and plain objects) -> replaced with `__NS_REDACTED_SECRET__`.
3. **Structured Write-Only Secret Handle (`RedactedSecretHandle`):**
   Client views never receive raw secret strings. They receive:

   ```ts
   export const REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__' as const;

   export interface RedactedSecretHandle {
     readonly sentinel: typeof REDACTED_SECRET_SENTINEL;
     readonly isSet: boolean;
     readonly fingerprint?: string; // e.g. 'sha256:0123456789abcdef' (16 hex chars)
   }

   export type SecretFieldWrite =
     | { readonly mode: 'keep' }
     | { readonly mode: 'clear' }
     | { readonly mode: 'set'; readonly value: string };
   ```

   `applySecretFieldWrite` rejects any `'set'` payload equal to `REDACTED_SECRET_SENTINEL` with structured error `SECRET_SENTINEL_ECHO_REJECTED` (Probe C `3.2`), preventing masked UI placeholders from overwriting real stored credentials. When rendered via `@netscript/fresh-ui` (`secret-field` in PR `#2670`), `SECRET_FIELD_UNCHANGED_TOKEN` maps to `{ mode: 'keep' }` and `SECRET_FIELD_CLEAR_TOKEN` maps to `{ mode: 'clear' }`.
4. **Non-serializable `PrincipalPort` guard & mandatory test gate:** Attempting to pass a non-serializable credential/port object (for example a `PrincipalPort` with `.mintServiceToken()` methods) across SSR/island boundaries throws `NON_SERIALIZABLE_PORT_BLOCKED`. Furthermore, `defineFrontendTestSuite` (`#940`) makes `assertNoUnredactedSecrets(renderedHtml, islandProps)` a **mandatory passing gate** for every plugin shipping UI.

#### 6.2 P5 Deny-by-Default Procedure Gateway & `stable-v1-adapter.ts` Gap

When a plugin exposes backend RPC endpoints for browser UI via `kind: 'procedure'`, browser clients call a host-mounted gateway route (`/api/plugins/<pluginSlug>/<procedure>`) — never direct internal plugin service URLs or credentials:

- **Policy source of truth:** Procedures compile through [`packages/service/src/auth/contract/contract-procedure-index.ts`](../packages/service/src/auth/contract/contract-procedure-index.ts) (`compileProcedures`) and [`procedure-policy-decision.ts`](../packages/service/src/auth/contract/procedure-policy-decision.ts) (`authorizeProcedurePolicy`) over `NetScriptProcedureMeta`.
- **Verified baseline defect fixed in W2:** Inspection and Probe C `2.1` established that [`packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L91`](../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L91) (`normalizeProcedureMeta`) currently extracts ONLY `access.authentication` and `policy.cache`, **silently stripping `access.authorization` (`scopes`, `roles`) and `access.audience`**. W2 MUST fix `stable-v1-adapter.ts` to preserve `authorization` and `audience`, and reject `audience: 'internal'` procedures at `generate plugins` time.
- **Browser security controls (Probe C `2.2`–`2.3`):**
  - Unknown procedures or unallowed HTTP methods fail closed (`404` / `405`).
  - Browser `Cookie` and `Authorization` headers are NEVER forwarded upstream; auth swaps to `PrincipalPort` minted server credentials (`401`/`403` otherwise).
  - Mutating methods enforce CSRF `Origin` + `Sec-Fetch-Site` validation.
  - Upstream fetches set `redirect: 'manual'`, enforce explicit request/response byte limits (`413`), request timeouts (`504`), end-to-end `AbortSignal` cancellation, dynamic `Connection` hop-by-hop header stripping, and strict response header allowlisting.

#### 6.3 Three-Lane Transport Boundary (`RFC 0009` Composition)

NetScript strictly separates three streaming/RPC transports so gateway RPCs never recreate durable-stream bugs (`#927`, Probe C `2.4`–`2.5`):

| Transport Lane | Protocol & Ownership | Examples | Why Kept Separate |
| --- | --- | --- | --- |
| **Lane 1: Procedure Gateway** | `@orpc/contract` + `eventIterator` compiled by `compileProcedures` + P5 gateway | Workers job trigger/cancel, CRUD mutations, short-lived RPC subscriptions | Standard oRPC procedures (`~orpc`); denies `internal` audience, applies CSRF/header filtering |
| **Lane 2: Authorizing Durable Streams Proxy** | [`RFC 0009`](./0009-authorizing-stream-proxy.md): `@netscript/contracts/streams` + `@netscript/plugin-streams-core/proxy` (`createNetScriptStreamProxy` + `bindStreamProxy`) + `@netscript/fresh/streams` (`createNetScriptStreamEventSourceV1`) | Replayable job execution logs, build/ETL pipeline event feeds, `?offset=` cursor resume | Stream endpoints intentionally lack `'~orpc'` so `compileProcedures` & OpenAPI skip them (Probe C `2.5`); enforces fenced per-delivery-unit `(data[], control)` authorization even mid-stream (Probe C `2.4`), pre-drain `shutdownSignal`, and dynamic `Connection` stripping |
| **Lane 3: Interactive AI Chat Stream** | `@netscript/fresh/ai` (`createNetScriptChatStreamProxy`) | Interactive assistant chat panels & tool streaming (`#943`) | Specialized TanStack AI wire framing and sandbox permissions distinct from CRUD RPC and offset-resumable streams |

---

### 7. Runtime Plugin Catalog & Honest Health Model (`eis-etl#63`)

Host applications and ops consoles query `FrontendPluginCatalog` (`@netscript/plugin-frontend-core` interface implemented in `@netscript/fresh/plugins`):

```ts
export type PluginHealthStatus =
  | 'Healthy'
  | 'Quarantined'
  | 'Incompatible'
  | 'UpdateAvailable'
  | 'Unverified';

export interface PluginHealthSnapshot {
  readonly status: PluginHealthStatus;
  readonly observedAt: string;           // ISO-8601 timestamp
  readonly diagnosisState?: ContributionDiagnosisState;
  readonly message?: string;
  readonly lastKnown?: {                 // preserved explicitly when live probe fails or cache is stale
    readonly status: PluginHealthStatus;
    readonly observedAt: string;
  };
}

export interface FrontendPluginCatalogEntry {
  readonly identity: ContributionIdentity;
  readonly pluginVersion: string;
  readonly displayName: string;
  readonly zones: readonly string[];     // target zone anchors (e.g. 'app.dashboard.panels/v1')
  readonly health: PluginHealthSnapshot;
}

export interface FrontendPluginCatalog {
  list(): readonly FrontendPluginCatalogEntry[];
  get(contributionId: string): FrontendPluginCatalogEntry | undefined;
  zones(anchor?: string): readonly FrontendPluginCatalogEntry[];
}
```

When a runtime plugin check times out or a cached snapshot is stale, `status` reports `'Unverified'` or `'Quarantined'` honestly while `lastKnown` retains the prior verified snapshot (`eis-etl#63`) — never fabricating `'Healthy'` from missing checks.

---

### 8. CLI Integration, `#2582` Consumer Reuse, & Nov 2026 Scaffold Alignment

- **Reuse `#2582` App Targeting:** [`packages/cli/src/public/features/plugins/install/plugin-app-references.ts`](../packages/cli/src/public/features/plugins/install/plugin-app-references.ts) already provides `resolvePluginAppReferences()`, reading `NetScript.Apps` (`Enabled !== false && (Type ?? 'app') === 'app'`) and `linking.consumers.apps` while preserving headless installs. All frontend commands (`plugin add --app`, `generate plugins`, `plugin resource add --app`) reuse this exact port rather than inventing an alternate app discovery mechanism.
- **Upgrade Nov 2026 Scaffold Templates:**
  - [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template): replace the hardcoded `@plugins/*/streams` alias array with `createNetScriptVitePlugin` consuming `.netscript/generated/frontend.registry.ts` (aliases, watch paths, `islandSpecifiers`).
  - [`navigation.ts.template`](../packages/cli/src/kernel/assets/app/navigation.ts.template): merge generated `frontendRegistry` `nav` items using `order ∈ [-100, 100]` alongside app routes (`visibleNavigation()` filtering `developmentOnly` in production).
  - [`_layout.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template): move `<Partial name="main">` inside `<SidebarShell>` and branch on `ctx.isPartial` (`P1b-aware`).
  - `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template`: replace hardcoded `capabilities.find((item) => item.id === 'streams' | 'workers')` blocks with `<FrontendZone name="app.dashboard.panels/v1" context={...} />`, keeping `CapabilityEmpty` fallback parity (`known-but-unmounted` renders `'installed-unwired'` guidance cleanly).
- **`plugin doctor` & `plugin dev`:**
  - `netscript plugin doctor` evaluates `.netscript/generated/frontend.diagnosis.json` + manifest pointers + containment (`#1473`) + Vite peer pins (`preact`, `@preact/signals`, `@fresh/plugin-vite`) and reports actionable 6-state diagnostics.
  - `netscript plugin dev` watches linked `plugins/*/frontend` directories, regenerates `.netscript/generated/frontend.registry.ts` incrementally, and triggers Vite config restart whenever `islandSpecifiers` membership changes (`D4` / `D5` workaround).

---

### 9. Empirical Wave-0 Verification Summary

Three reproducible Wave-0 probes under [`.llm/runs/rfc-frontend-contribution-v2--rfc/probes/`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log) verified every critical boundary initially against `af5107b8d` and re-verified on rebased `origin/main` (`f54542169`) without modifying product code:

#### 9.1 Probe A — Fresh 2.3.3 Mount, Partials, Lazy Loaders & SSR Containment (`18 / 18 PASS`)

Executed via `deno run --no-lock -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a-fresh-mount.ts` ([`probe-a.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log); Deno 2.9.7, `@fresh/core@2.3.3`, `preact-render-to-string` 6.8.3):

| Case ID | What Was Proven | Measured Outcome |
| --- | --- | --- |
| `P0.1` | Default `preactOptions.errorBoundaries` in Fresh 2.3.3 | `undefined` — Fresh does not enable Preact SSR error boundaries |
| `P1.0`, `P1a`, `P1c` | Pre- vs post-`fsRoutes()` mount order & `basePath` | Pre-`fsRoutes` misses `_app`/`_layout`/`_middleware`; post-`fsRoutes` inherits all 3 and composes `basePath='/console'` cleanly |
| `P1b-naive`, `P1b-aware` | `<Partial name="main">` inside shell with/without `ctx.isPartial` | Without `isPartial`: `hasShellInPartial===false` inside partial comment markers, **yet `rawBodyHasShellChrome===true`**; with `isPartial`-aware `_layout`/`_app`: `rawBodyHasShellChrome===false`; duplicate `name="main"` throws `500` (`preact_hooks.ts:224`) |
| `P1d`, `P1e`, `P1f`, `P1g` | Middleware ordering, 404 status, co-mount isolation, `GuardedPluginApp` | `mountApp` isolates co-mounted plugins & preserves middleware order (`/*` literal trap in `app.route`); raw `App.mountApp` leaks `.notFound()`/`.appWrapper()` via private `App.#commands`; `GuardedPluginApp` prevents leak |
| `P2a`, `P2b`, `P2c` | Literal lazy loader, export normalizer, Fresh-3 route shape | Lazy load (`0 -> 1 -> 1`); `normalizeFreshRouteModule` wires `css` & rejects invalid/ambiguous exports; **`P2c` passes Fresh-3-style `middleware -> handler({ data }) -> pure page` on full and `?fresh-partial=true`** |
| `P4a`–`P4e` | Sync/async SSR throws, `onError`, pre-render containment | Pre-render `Promise.all` + `try/catch` (`P4a`) returns `HTTP 200` with sibling + quarantine card; sync render throws `500` by default (`P4b`); nested `<AsyncChildZone />` renders empty `<div></div>` `200` + leaks `unhandledrejection` (`P4c`); `_error` needs `skipAppWrapper + skipInheritedLayouts` (`P4d`) |

#### 9.2 Probe B — Vite 7.2.2, `@fresh/plugin-vite@1.1.2`, Islands, `#2655` Hashes, & CSS (`15 Matrix Rows, Exit 0`)

Executed via `deno run --no-lock --check -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-b-vite-islands-css.ts` ([`probe-b.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-b.log); Chromium CDP + isolated temp fixture):

| Matrix Cell | Outcome | Measured Result |
| --- | --- | --- |
| `P1`–`P4` | **PASS** | 1 Preact chunk (`hooks.module-C_twUwvv.mjs`), 1 `@preact/signals` chunk (`signals.module-V5smtFD2.mjs`), immutable hashed client assets, `optSize === 1` + shared signal `10->11->12` across host + local + `@netscript/fresh/defer/island`; `#2655` edit rotated plugin chunk (`fresh-island__island_7-B1bg7u0U.mjs -> fresh-island__island_7-DZYUlgrP.mjs`) with zero host/defer hash churn |
| `C1` CSS sizes | **PASS** | Bloated global: `84,788 B` cold `/` (`85,901 B` `/plugin-fs`) -> Split Tailwind shell: `40,298 B` cold `/` (`41,411 B` `/plugin-fs`) -> Minimal shell + prelude: **`169 B`** cold `/` (`1,282 B` `/plugin-fs`) -> Bare prelude `@layer ns-plugins,ns-app;`: **`26 B`** |
| `C2` `@layer` order | **CAVEAT** | Draft `#890` `@layer ns-app, ns-plugins;` let plugin red `rgb(220, 38, 38)` override app; **corrected `@layer ns-plugins, ns-app;` restores app `rgb(22, 163, 74)`** |
| `C3`, `C4` CSS pitfalls | **FAIL (expected)** | `?url` CSS fails (`deno.ts` strips query); sharing 1 CSS file across `>=2` SSR chunks crashes `server_entry.ts:160` parallel `Deno.rename` (`ENOENT`) |
| `M1`–`M6` ESM/JSR matrix | **M4/M5 PASS; M1/M3/M6 CAVEAT; M2 FAIL** | Root `deno.json` needs `jsx+preact` (`M1`); `--cached-only` in `@deno/loader@0.4.0` still fetches reachable HTTP (`M3`); pre-cached remote JSR-style TSX+CSS hydrates cleanly (`optSize===1`, `M4`/`M5`); semver mismatch `@preact/signals@^2.11.0` (`2.11.4` vs `2.11.3`) yields `vite build: signals=1` vs `vite --configLoader native build: signals=2` (`fresh-island__acme_remote_mismatch_3-qSfICc9O.mjs`, `signals.module-Du6rrhKm.mjs`, `M6`) |
| `D1`–`D5` Dev loops | **D1/D2/D3/D5 PASS; D4 CAVEAT** | Dev route edits, island edits, and `vite.config.ts` island reloads pass; adding/removing `fsRoute` clears `islandSpecByName` (`server_snapshot.ts:112`), dropping external `islandSpecifiers` until Vite restarts (`D4`) |

#### 9.3 Probe C — Manifest Evolution (`#1474`), Path Containment (`#1473`), Gateway (`P5` + `RFC 0009`), & Redaction (`10 / 10 PASS`)

Executed via `deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-c-manifest-gateway-redaction.ts` ([`probe-c.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-c.log)):

| Case | Outcome | Proved Against Real Repo Modules |
| --- | --- | --- |
| `1.1`–`1.2` | **PASS** | Real `parsePluginManifest` (`.strict()`) rejects `"frontend"`; `.passthrough()` with `schemaVersion: 1` parses cleanly while generate-time validator catches `FRONTEND_POINTER_INVALID` |
| `1.3` | **PASS** | Rejects `../`, `\`, `\0`, `/etc`, UNC, `%2e%2e`, uppercase, and symlink escapes; proves naive `resolveTarget` traversal bug in [`ui/registry.ts#L310-L317`](../packages/cli/src/kernel/application/ui/registry.ts#L310-L317) |
| `2.1`–`2.5` | **PASS** | Real `authContract` + `cronsContract` through `compileProcedures`; rejects `audience: 'internal'`; documents `stable-v1-adapter.ts#L64-L91` gap stripping `authorization`/`audience`; enforces PrincipalPort, CSRF, `redirect: 'manual'`, `413`/`504`/`AbortSignal`; composes with real `DurableStreamTestServer` (`RFC 0009`) proving fenced `(data[], control)` delivery units and oRPC router exclusion of `StreamEndpointContract` |
| `3.1`–`3.2` | **PASS** | Redacts URL userinfo, sensitive headers, and `x-ns-ui: { secret: true }` evaluated prior to null check across `PluginClientContext`, SSR HTML, and island props; enforces `assertNoUnredactedSecrets`, `NON_SERIALIZABLE_PORT_BLOCKED`, and `SECRET_SENTINEL_ECHO_REJECTED` |

---

### 10. `0.0.10` First Usable Seams Cut vs Follow-on Waves

To ship end-to-end value cleanly in `0.0.10` without cycles (explicitly breaking the `#933` <-> `#940` circular dependency) and sized for **Neon builders** (`antigravity/gemini-4-neon` `xhigh`) + **Opus 5.5 `xhigh` Pass-1 / Hydrogen `xhigh` Pass-2 PR review**:

| Wave / Cluster | Scope | Issues Absorbed / Touched | Merge-Ready Exit Proof |
| --- | --- | --- | --- |
| **W1 (`0.0.10`): Preconditions & Shared Core** | 1. `#1474` manifest `.passthrough()` keeping `schemaVersion: 1` + `#1473` lexical/physical path containment + scoped generator subprocesses (`installed-runtime-registry-generator.ts`).<br>2. `@netscript/plugin-frontend-core` (Archetype 1): neutral `ContributionEnvelope`, `ContributionIdentity`, `anchors`, `descriptor` + `x-ns-ui`, redaction/secret handles, `FrontendPluginCatalog`, 6-state taxonomy, budgets.<br>3. `@netscript/plugin` `.withFrontend` pointer (`#929` unified) — zero regex `AstExtractor`. | `#1474`, `#1473`, `#928`, `#929`, part `#1471` | `deno task check`, `deno task arch:check`, `jsr-audit`, negative containment + `.passthrough()` unit tests |
| **W2 (`0.0.10`): Generator, Fresh 2 Adapter, Templates, & P5 Gateway** | 1. Transactional `.netscript/generated/frontend.registry.ts` + `frontend.diagnosis.json` + `netscript plugin doctor` 6-state checks.<br>2. `@netscript/fresh/plugins`: `GuardedPluginApp`, post-`fsRoutes` mount hook on `defineFreshApp`, `normalizeFreshRouteModule` (Pure Fresh-3 route shape), `<FrontendZone>`, pre-render quarantine, redaction runtime, export `sse.ts`, `FrontendPluginCatalog`.<br>3. `@netscript/fresh/vite` feed + `@layer ns-plugins, ns-app;` + `<Partial name="main">`-inside-shell fix (`_layout.tsx.template`) + `dashboard-view.tsx.template` zone migration.<br>4. Fix `stable-v1-adapter.ts` + P5 deny-by-default HTTP gateway (`#934`). | `#930`, `#1475`, `#937`, `#1476`, `#931`, `#932`, `#934`, `#938` (core states) | Fresh 2 runtime integration + Playwright CDP tests + P5 gateway + `RFC 0009` boundary regression suite |
| **W3 (`0.0.10`): Acyclic Test Suite & Workers Dogfood + Resource Seam** | **Step W3a (`#940`):** Ship `defineFrontendTestSuite` (pure core contract + redaction + budgets + Fresh adapter test harness) **without** importing `plugins/workers`.<br>**Step W3b (`#933`, `#939`):** Migrate `@netscript/plugin-workers` onto `route` + `app.dashboard.panels/v1` `zone` + `descriptor` + island + `defineFrontendTestSuite`; wire `plugin resource add --app` (`#939` / `#432` seam) & `plugin dev` watch loop (`#936`). *(Notice W3a strictly precedes W3b, eliminating the `#933` <-> `#940` cycle!)* | `#940`, `#933`, `#939`, `#432`, `#936`, unblocks `#1520` / `#1521` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` + `workers` zone & route browser E2E + budget checks |
| **Follow-on (`0.0.11` / Backlog)** | DevTools `panel`/`link`/`diagnostic` + typed deep-link migration (`#1469`–`#1472`), `plugins/auth` + `plugins/ai` + `sagas`/`triggers`/`streams` frontend packs (`#942`–`#945`), `plugin new --with frontend` + adoption/convention generators (`#935`, `#941`, `#946`), `RFC 0007` GPUIX + Fresh 3.x adapters when Fresh 3 GA ships. | `#1469`–`#1472`, `#935`, `#941`–`#946`, `devtools` consolidation | Tracked per theme milestone after `0.0.10` minimum cut proves production stability |

---

### 11. Complete Issue Supersession & Board Reconciliation Map

*(Documentation record only — existing GitHub issues and milestones remain untouched until owner acceptance/triage.)*

#### 11.1 Superseded Seed & Frontend Contribution Issues (`#922`–`#946`, PR `#890`)

| Ref | Live Title | Current Status / MS | Unified RFC Disposition |
| --- | --- | --- | --- |
| PR `#890` | RFC: Frontend Contribution Layer — plugins that ship UI (dashboard · auth · ai · deploy) | `MERGED` (seed docs only) | **Superseded** by this RFC (`@layer` order fixed, `@netscript/plugin-frontend-core` zero-Fresh boundary, 6-state taxonomy, `descriptor` + redaction, Fresh 3 seam) |
| `#922` | Epic: Frontend contribution layer — plugins that ship UI | `OPEN` / `Frontend Contribution` | **Canonical Tracking Epic** — retarget milestone/scope to `0.0.10` First Usable Seams + Follow-on waves |
| `#923` | `[frontend-contrib S1] P1 proof: mounted sub-app command ordering` | `OPEN` / `Frontend Contribution` | **Satisfied by Wave-0 Probe A (`P1` suite)** — verify & close when RFC accepted |
| `#924` | `[frontend-contrib S2] P2 proof: literal lazy route loaders + normalizeFreshRouteModule` | `OPEN` / `Frontend Contribution` | **Satisfied by Wave-0 Probe A (`P2a`–`P2c`)** — verify & close when RFC accepted |
| `#925` | `[frontend-contrib S3] P3 proof: dependency-island build matrix + plugin-vite pin policy` | `OPEN` / `Frontend Contribution` | **Satisfied by Wave-0 Probe B (15 matrix rows)** — verify & close when RFC accepted |
| `#926` | `[frontend-contrib S4] P4 proof: SSR failure-containment fixtures` | `OPEN` / `Frontend Contribution` | **Satisfied by Wave-0 Probe A (`P4a`–`P4e`)** — verify & close when RFC accepted |
| `#927` | `[frontend-contrib S5] P5 proof: gateway threat model + streaming abort` | `OPEN` / `Frontend Contribution` | **Satisfied by Wave-0 Probe C (`2.1`–`2.5`)** — verify & close when RFC accepted |
| `#928` | `[frontend-contrib S6] @netscript/plugin-frontend-core contracts/v1` | `OPEN` / `Frontend Contribution` | **`0.0.10` W1** — expanded to Archetype 1 shared spine (`descriptor` + `x-ns-ui`, redaction, catalog, 6-state taxonomy, unified w/ `#1471`) |
| `#929` | `[frontend-contrib S7] @netscript/plugin pointer axis (.withFrontend)` | `OPEN` / `Frontend Contribution` | **`0.0.10` W1** — unified pointer block, rejects `AstExtractor` |
| `#930` | `[frontend-contrib S8] Frontend registry emissions: transactional replace-set` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — merged with `#1475` shared neutral registry + `frontend.diagnosis.json` |
| `#931` | `[frontend-contrib S9] @netscript/fresh/plugins host runtime` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — `GuardedPluginApp`, post-`fsRoutes` hook, `normalizeFreshRouteModule`, `<FrontendZone>`, redaction, catalog |
| `#932` | `[frontend-contrib S10] Scaffold template wiring + HostSurfaceDescriptor + vite feed` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — includes `<Partial name="main">` fix, `@layer ns-plugins, ns-app;`, `vite.config.ts` feed, `dashboard-view.tsx` zone |
| `#933` | `[frontend-contrib S11] Workers dogfood: zone panel + console route + island` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** — dependency-ordered *after* `#940` (cycle broken!) |
| `#934` | `[frontend-contrib S12] Generated deny-by-default procedure gateway` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — includes `stable-v1-adapter.ts` authorization/audience fix & explicit `RFC 0009` separation |
| `#935` | `[frontend-contrib S13] plugin new --with frontend` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Backlog)** |
| `#936` | `[frontend-contrib S14] netscript plugin dev (frontend watch loop)` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** (or follow-on if slipped; includes Vite `islandSpecifiers` reload workaround for `D4`) |
| `#937` | `[frontend-contrib S15] Doctor frontend check + five-state taxonomy` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — **upgraded to 6-state taxonomy** & unified with `#1476` |
| `#938` | `[frontend-contrib S16] Quarantine render states + provenance chrome` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** (quarantine fallback & catalog provenance) + polish in follow-on |
| `#939` | `[frontend-contrib S17] AppTarget scaffolder seam + plugin resource add --app` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** — reuses `#2582` `resolvePluginAppReferences`, absorbs `#432` |
| `#940` | `[frontend-contrib S18] defineFrontendTestSuite + budgets enforcement` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3a** — split core/Fresh suite + mandatory `assertNoUnredactedSecrets`; lands *before* `#933` |
| `#941` | `[frontend-contrib S19] generate frontend-wiring adoption verb` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Backlog)** |
| `#942` | `[frontend-contrib S20] Auth v1 frontend (account + session widget + signin starter)` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#943` | `[frontend-contrib S21] AI frontend (durable chat route + assist launcher)` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#944` | `[frontend-contrib S22] Sagas/triggers/streams dashboard-zone panels` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#945` | `[frontend-contrib S23] auth-org backend capability (org-console prerequisite)` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Auth)** |
| `#946` | `[frontend-contrib S24] Convention generator (generate frontend)` | `OPEN` / `Frontend Contribution` | **Follow-on (`Backlog / Triage`)** |

#### 11.2 DevTools `RFC 0005`, Adjacent Epics, & Mis-Milestoned Issues

| Ref | Live Title | Current Status / MS | Unified RFC Disposition |
| --- | --- | --- | --- |
| `#1465` | RFC: NetScript DevTools contribution architecture | `CLOSED` / `0.0.6` | **Accepted `RFC 0005`** — shared spine unified cleanly into this RFC |
| `#1469` | `[devtools W0a] probe packaged island specifiers under Deno resolution` | `OPEN` / `DevTools & Dashboard` | **Satisfied by Wave-0 Probe B (`M1`–`M6`)** — verify against JSR staging & close |
| `#1470` | `[devtools W0b] probe a second route/island root in one Vite process` | `OPEN` / `DevTools & Dashboard` | **Satisfied by Wave-0 Probe B (`P1`–`P3`, `D1`–`D5`)** — verify & close |
| `#1471` | `[devtools W1a] add contracts/v1, deterministic ordering, and architecture roots` | `OPEN` / `DevTools & Dashboard` | **Unified into `0.0.10` W1** (`@netscript/plugin-frontend-core` shared spine + `arch:check` roots) |
| `#1472` | `[devtools W1b] add typed deep-link resolution` | `OPEN` / `DevTools & Dashboard` | **Follow-on (`DevTools`)** built atop shared `route` contracts |
| `#1473` | `[devtools W1c] enforce path containment and scoped generator subprocesses` | `OPEN` / `DevTools & Dashboard` (`p0`) | **Pulled into `0.0.10` W1** hard precondition |
| `#1474` | `[devtools W1d] make plugin manifests forward-compatible before pointer fields` | `OPEN` / `DevTools & Dashboard` (`p0`) | **Pulled into `0.0.10` W1** hard precondition (`.passthrough()` on `schemaVersion: 1`) |
| `#1475` | `[devtools W2a] generate the contribution registry transactionally` | `OPEN` / `DevTools & Dashboard` | **Unified into `0.0.10` W2** (with `#930`) |
| `#1476` | `[devtools W2b] diagnose the six contribution states in plugin doctor` | `OPEN` / `DevTools & Dashboard` | **Unified into `0.0.10` W2** (with `#937`, canonical 6-state taxonomy) |
| `#400` | Epic: NetScript DevTools contribution and host architecture | `OPEN` / `Backlog / Triage` | Remains DevTools host epic consuming shared `0.0.10` W1/W2 spine |
| `#427` | `[dashboard DDX-17] DashboardPanelContribution seam (.withDashboardPanel)` | `OPEN` / `DevTools & Dashboard` | **Superseded / Absorbed** by `zone` + `descriptor` contributions on `app.dashboard.panels/v1` |
| `#432` | `[dashboard DDX-19] Codegen-from-UI Add-resource action` | `OPEN` / `DevTools & Dashboard` | **Absorbed into `#939` (`0.0.10` W3b)** via `AppTarget` / `plugin resource add --app` |
| `#1520` | `[runtime-automation A7] production/admin automation console (frontend — dependency-gated on the #922 minimum cut)` | `OPEN` / `Runtime Automation` | **Explicit consumer** dependency-gated on `0.0.10` W1–W3 landing; stays in `Runtime Automation` |
| `#1521` | `[runtime-automation A8] §13 E2E acceptance suite + BG-1/BG-4 measurements selected into e2e:cli + release-gate registration` | `OPEN` / `Runtime Automation` | Remains in `Runtime Automation`; exercises `0.0.10` W3 runtime surface |
| `#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568` | 6 stray `epic:design-system` / `area:fresh-ui` issues currently assigned to `Frontend Contribution` (`ms #24`) | `OPEN` / `Frontend Contribution` | **Reconciliation required (do not mutate here):** move out of `Frontend Contribution (#24)` into `0.0.10` / `Design System` / `Backlog / Triage` (`#2568` also lacks labels) |

---

## Drawbacks

1. **Pre-render containment requires explicit data loaders.** Because Fresh `2.3.3` + `preact-render-to-string` renders synchronously (`P0.1`, `P4c`), plugin zones cannot safely perform inline `async` fetches inside JSX child components. Plugin authors must hoist zone data fetching into declared `loader` functions resolved before `ctx.render()`. (Fortunately, this exact discipline matches Fresh 3.x and GPUIX!)
2. **Vite 7.2.2 + `@fresh/plugin-vite@1.1.2` constraints remain strict until Fresh 3.** Pinning `vite@7.2.2`, `@fresh/plugin-vite@1.1.2`, and exact `@preact/signals@2.11.3` restricts plugins from bringing incompatible semver signal upgrades (`M6`), prevents `?url` CSS imports (`C3`) and shared SSR CSS chunks (`C4`), and retains Fresh's dev `islandSpecByName.clear()` caveat (`D4`) until upstream patches or Fresh 3 (`Vite 8 + Nitro 3`) lands.
3. **Pulling `#1473` and `#1474` into `0.0.10` W1 adds upfront CLI work.** Auditing `resolveTarget` and subprocess flags before shipping `#933` prevents cross-contamination between `frontend` and `devtools`, even though it shifts two `p0` DevTools fixes ahead of first-party plugin UI polish (`#942`–`#944`).

---

## Rationale and alternatives

- **Why unify `#890` and `RFC 0005` instead of finishing `#922`–`#946` separately?**
  Implementing `#928`–`#931` directly from PR `#890` would ship a `resolvePluginLocalName` collision bug, a five-state diagnosis list diverging from `RFC 0005`'s six states, an inverted `@layer ns-app, ns-plugins;` cascade prelude, Fresh-coupled registry emissions that break on Fresh 3 / GPUIX, and no schema-only `descriptor` or secret redaction contract for real consumers (`eis-etl`). Unifying early eliminates duplicate generators and gives both families one vetted spine.
- **Why make `descriptor` + `x-ns-ui` a first-class kind alongside `zone`/`route`?**
  Many NetScript and `eis-etl` plugins only need typed config forms, inspector panels, and secret fields (`eis-etl#453`). Forcing every plugin to ship Fresh TSX islands couples backend packages to Preact/Vite, expands client JS/CSS budgets, and breaks non-web renderers like GPUIX (`rfcs/0007`) and mobile.
- **Alternative considered: AST-scraping contribution discovery (`AstExtractor`).**
  Rejected. Regex extraction breaks on dynamic re-exports and TypeScript syntax edge cases and bypasses manifest security bounds; explicit `.withFrontend(...)` metadata + literal `() => import(spec)` registry entries keep static checks fast and deterministic.
- **Alternative considered: Wait for Fresh 3 GA before shipping `#922`.**
  Rejected. Consumers (`eis-etl`, `#1520` Runtime Automation, `#933` Workers) need safe zone composition, secret redaction, `<Partial name="main">`, and CSS splitting on Fresh `2.3.3` in `0.0.10` now; quarantining Fresh 2 inside `@netscript/fresh/plugins` achieves Fresh 3 readiness without stalling `0.0.10`.

---

## Breaking changes and migration

1. **Manifest schema `.strict()` -> `.passthrough()` (`#1474`):** Non-breaking additive change preserving `schemaVersion: 1`; existing plugin manifests remain 100% valid.
2. **Scaffold templates (`_layout.tsx`, `vite.config.ts`, `dashboard-view.tsx`, CSS prelude):** Affects **newly generated apps** cleanly and provides explicit non-destructive upgrade steps (`@layer ns-plugins, ns-app;`, `<Partial name="main">` + `ctx.isPartial`, `<FrontendZone>`) for existing apps like `eis-etl`.
3. **`createStableV1ProcedureMetadataPort()` (`stable-v1-adapter.ts`):** Previously dropped `access.authorization` and `access.audience` silently (`Probe C 2.1`); preserving them fixes a latent fail-open gap with zero contract breaks for compliant public procedures.
4. **PR `#890` & `#427` retirement:** Since PR `#890` only merged a seed plan into `.llm/runs/plan-frontend-contrib--seed/` and `#427` has not shipped, retiring `#890` and absorbing `#427` breaks zero released APIs.

---

## Prior art

- [`rfcs/0005-devtools-contribution.md`](./0005-devtools-contribution.md) — Shared `ContributionEnvelope`, `ContributionIdentity`, `anchors`, `.passthrough()` manifest evolution, containment, and 6-state diagnosis taxonomy.
- [`rfcs/0007-gpuix-native-desktop-renderer.md`](./0007-gpuix-native-desktop-renderer.md) & [`.llm/runs/rfc-gpuix-desktop--rfc/research.md`](../.llm/runs/rfc-gpuix-desktop--rfc/research.md) — Fresh 3.x `freshHandler`/`renderPage(inner)` and GPUIX `RouteModule` data/view separation.
- [`rfcs/0009-authorizing-stream-proxy.md`](./0009-authorizing-stream-proxy.md) — Fenced Durable Streams authorization boundary kept cleanly separate from oRPC procedure gateways.
- [`.llm/runs/plan-frontend-contrib--seed/rfc.md`](../.llm/runs/plan-frontend-contrib--seed/rfc.md) — Superseded PR `#890` seed proposal establishing P1–P5 boundaries and capability-fallback alignment.
- [`rickylabs/eis-etl`](https://github.com/rickylabs/eis-etl) (`#63`, `#421`, `#422`, `#425`, `#426`, `#438`, `#448`, `#450`, `#453`) & NetScript PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670) — Real consumer production validation for entity zones, schema+UI descriptors, write-only secrets, inside-shell partials, route-split CSS, and shared `ns-theme`.
- Backstage frontend plugin system (extension blueprints/attachments), WordPress Block/Inspector schema metadata, and Vite/Fresh island manifests.

---

## Unresolved questions

Compact decision forks remaining for RFC evaluation (including scheduled adversarial review with Fable 5.2) — each carrying a concrete recommended default:

| Fork ID | Question | Options | Recommended Default |
| --- | --- | --- | --- |
| **F-1** | Package granularity of `@netscript/plugin-frontend-core` vs adding to `@netscript/plugin` | **(A)** Separate Archetype 1 package `@netscript/plugin-frontend-core`; **(B)** Subpath on `@netscript/plugin` | **(A) Separate `@netscript/plugin-frontend-core`** matching `-workers-core`/`-streams-core` & preventing CLI/runtime coupling |
| **F-2** | Should `devtools` (`#1469`–`#1476`) keep its `"devtools"` manifest key or merge into `"frontend"` in `0.0.10`? | **(A)** Keep distinct top-level `"frontend"` and `"devtools"` manifest keys compiled by one shared generator spine; **(B)** Single `"ui"` key breaking `RFC 0005` text | **(A) Dual top-level keys -> one shared `ContributionEnvelope` & generator** (zero churn to accepted `RFC 0005`, zero duplicate runtime) |
| **F-3** | Primary widget hint namespace: `x-ns-ui` vs consumer `x-eis-ui` | **(A)** Canonicalize `x-ns-ui` in `-core`, plus adapter accepting domain overlays (`x-eis-ui`); **(B)** Mandate domain migration immediately | **(A) Canonical `x-ns-ui` + documented consumer overlay adapter** |
| **F-4** | `0.0.10` gateway scope: full oRPC `eventIterator` + HTTP RPC in W2, or HTTP RPC only first? | **(A)** Full `compileProcedures` HTTP + `eventIterator` in W2 (keeping streams strictly on `RFC 0009`); **(B)** Defer `eventIterator` | **(A) Include `eventIterator` cleanly separated from `RFC 0009`** (already validated in Probe C `2.5`) |
| **F-5** | Disposition of the 6 stray `epic:design-system` issues currently inside `Frontend Contribution (#24)` (`#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568`) | **(A)** Move all 6 to `Backlog / Triage` / `0.0.10` outside `#922`; **(B)** Leave inside `#24` | **(A) Reconcile out of `#24`** during post-RFC board hygiene so `#922` progress metrics remain accurate |

---

## Future possibilities

1. **Fresh 3.x Host Adapter (`@netscript/fresh3/plugins`):** Plug directly into Fresh 3 GA (`Vite 8 + Nitro 3 + Preact 11 + renderPage(inner)`) using the unchanged `.netscript/generated/frontend.registry.ts` and `middleware -> handler({ data }) -> pure page` plugin routes.
2. **GPUIX Native Desktop Renderer (`rfcs/0007`):** Render `descriptor` schemas, `nav` trees, `FrontendPluginCatalog`, and route `{ data }` loaders via GPUIX native components using shared `--ns-*` tokens.
3. **First-party Plugin Packs (`0.0.11`):** Auth UI (`#942`), Auth Org console (`#945`), AI durable chat (`#943`), and Sagas/Triggers/Streams dashboard zone packs (`#944`), plus `plugin new --with frontend` (`#935`) and `generate frontend` conventions (`#946`).
4. **Runtime Automation Admin Console (`#1520`, `#1521`):** Consume `0.0.10` W1–W3 zones, P5 gateway, and `FrontendPluginCatalog` health read model as its immediate downstream customer.
