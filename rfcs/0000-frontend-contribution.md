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

This RFC defines **one unified, renderer-portable frontend contribution layer** for NetScript plugins. It **supersedes the merged PR `#890` seed RFC** ([`.llm/runs/plan-frontend-contrib--seed/rfc.md`](../.llm/runs/plan-frontend-contrib--seed/rfc.md)) and **unifies the `app` contribution family with accepted RFC 0005's contribution spine** ([`rfcs/0005-devtools-contribution.md`](./0005-devtools-contribution.md)). Plugins declare a single parse-only pointer (`{ export: './frontend', framework: 'fresh' }`) in `scaffold.plugin.json` pointing to sibling `ContributionEnvelope[]` exports (`app` and, when applicable, `devtools`), using the canonical RFC 0005 wire schema (`FamilyRef = { family, major }`, host-assigned `ContributionIdentity` quartet, host-curated `anchors[]`, deterministic ordering, and the 6-state diagnosis taxonomy). Core contracts live under Doctrine Archetype 1 (zero Fresh, Preact, Vite, DOM, CSS, or `Deno.*` dependencies), aligned with RFC 0005 F-1 (`@netscript/devtools-core` / `@netscript/plugin-frontend-core`, see Fork `F-1`). Declarative `descriptor` contributions pair versioned schemas with `x-ns-ui` metadata (`editable`, `fixedByPlugin`, `secret`, `overridable`, `widget`) and presence-only browser secret handles (`sentinel` + `isSet`, zero browser-visible SHA-256 digests/fingerprints), integrated with merged PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670) (`resolveSecretFieldSubmission`). Portable route data loaders (`PortableRouteDataContext -> HandlerResult<TData>`) ship in framework-free subpaths independent of Fresh 2.3.3 view adapters (`GuardedPluginApp` allowlisted facade, `normalizeFreshRouteModule`, `<Partial name="main">` inside shell with `ctx.isPartial`, package-owned route CSS delivery, `@layer ns-plugins, ns-app;`), leaving Fresh 3.x and GPUIX (`rfcs/0007`) cleanly decoupled without changing core contracts. `@netscript/cli` shares one transactional generator core to emit **separate** `app` and `devtools` runtime projections (`.netscript/generated/app/` vs `.netscript/generated/devtools/`, preserving `INV-4` production absence of DevTools). For `0.0.10`, the RFC cuts an acyclic **First Usable Seams** baseline (`W1` preconditions + core contracts -> `W2` separate transactional emitters, `@netscript/fresh/plugins`, scaffold updates, and **HTTP-only** P5 gateway -> `W3a` `#940` test suite with independent fixture -> `W3b` `#933` Workers dogfood & Workers CI receipt), backed by updated Wave-0 empirical probes under [`.llm/runs/rfc-frontend-contribution-v2--rfc/probes/`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log).

---

## Motivation

Two independent pressures forced unification before writing a single line of `#922` implementation code:

1. **Duplicate architecture risk between `#890` (`#922`–`#946`) and accepted `RFC 0005` (`#1469`–`#1476`).**
   After PR `#890` landed `.llm/runs/plan-frontend-contrib--seed/` on `2026-08-03`, accepted [`RFC 0005`](./0005-devtools-contribution.md) (`2026-08-11`) hardened the exact same extension mechanics for DevTools: manifest `.passthrough()` evolution (`#1474`), host-derived path containment and scoped generator subprocesses (`#1473`), host-assigned `ContributionIdentity` collision prevention (forbidding `resolvePluginLocalName`), transactional replace-set generation, host-curated `anchors[]`, out-of-range error rejection on `order ∈ [-100, 100]`, and a unified 6-state diagnosis taxonomy. Keeping two incompatible wire schemas (`{ family, major }` vs `{ id, version }`, `mountId` vs `packageName#localId`) or two manifest discovery paths would break RFC 0005 and duplicate CLI generation machinery.

2. **Six real downstream consumer pressures surfaced in production workflow apps (e.g., `acme`) and merged PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670).**
   Before NetScript shipped a plugin UI system, downstream apps such as `acme` had to hand-roll plugin zones, schemas, partials, CSS splitting, and secret redaction across cockpit workflows:
   - **Typed entity/context-scoped zones & decoupled catalog:** Hosts need versioned, strongly typed entity zones (`app.dashboard.panels/v1`, `nav.spaces/v1`, `pipeline.inspector.sections/v1`, `run.detail.panels/v1`, `review.detail.body/v1`, `dataset.detail.panels/v1`) alongside a plugin-keyed catalog separating linked version, unobserved running version, health, quarantine, update availability, and doctor freshness.
   - **Renderer-agnostic schema + UI-hint `descriptor` plugins:** Activity/connector plugins often should NOT ship arbitrary Fresh TSX at all. They declare JSON Schema / Standard Schema + canonical `x-ns-ui` hints (`editable`, `fixedByPlugin`, `secret`, `overridable`, `widget`, plus optional typed dock tabs), while the host renders native inspector forms using vetted `@netscript/fresh-ui` components — directly aligning with merged PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670)'s `secret-field`, `key-value-editor`, and `chips-input` registry components. (Note: a host's versioned activity schema remains authoritative; generic plugin inspector rendering is a consumer design target rather than shipped baseline proof.)
   - **Presence-only server-side secret redaction & write-only secret handles:** Without framework-enforced recursive redaction before serialization, URL userinfo, sensitive headers, and schema-marked secret fields (even under non-sensitive property names or inside arrays/records) leak into `PluginClientContext`, SSR HTML, and island hydration props, or overwrite real secrets when a client echoes a sentinel. Browser-visible handles MUST expose presence only (`sentinel` + `isSet`), never SHA-256 digests or fingerprints that create equality/guessing oracles.
   - **Non-blocking `<Partial name="main">`-inside-shell navigation:** NetScript's current [`_layout.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51) wraps `<SidebarShell>` *inside* `<Partial name="page">`, mirroring the exact anti-pattern seen in real production apps (~60 KB of redundant shell chrome + blocking RPCs per navigation), while computing active navigation and `<Breadcrumb>` outside the partial. Host shells must sit *outside* `<Partial name="main">`, branch on `ctx.isPartial`, refresh active navigation/breadcrumb state on partial swaps, and pair async panels/dock tabs with `@netscript/fresh/query` (`QueryIsland`, `staleTime`, hover prefetch).
   - **Package-owned route CSS, `client.ts` splitting, & corrected cascade layer order:** [`client.ts.template`](../packages/cli/src/kernel/assets/app/client.ts.template#L1-L4) imports `styles.css`, `design.css`, and `workspace.css` globally (hundreds of KB in real apps; `84,788 B` vs `169 B` in Wave-0 Probe B). Worse, PR `#890` wrote `@layer ns-app, ns-plugins;`, which Probe B proved **inverts CSS Cascade Level 5 priority** so plugin rules beat app overrides (`rgb(220, 38, 38)` vs `rgb(22, 163, 74)`). The mandatory prelude is `@layer ns-plugins, ns-app;`, paired with shared `ns-theme` persistence (`data-theme`/`data-scheme`/`data-density`/`data-flavor`), cross-tab/system theme synchronization, and package-owned route CSS URLs (never writing into host `static/`).
   - **Current NetScript scaffolding still hardcodes plugin UI:** [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template#L14-L33) hardcodes three `@plugins/*/streams` aliases while `dashboard-view.tsx.template` (`packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template#L25-L58`) hardcodes `'streams'` and `'workers'` capability cards, bypassing `#2582` consumer targeting (`NetScript.Apps`) and generic extension discovery.

3. **Fresh 3.x & GPUIX multi-renderer readiness.**
   Fresh 2.3.3 (`@fresh/core@2.3.3` + `@fresh/plugin-vite@1.1.2` + Vite 7.2.2) is the only runtime shipped in `0.0.10`. Fresh 3.x (`Vite 8 + Nitro 3 + Preact 11 + renderPage(inner)`) is a future migration target, and GPUIX desktop (`rfcs/0007`) explicitly rules out unchanged Fresh HTML/CSS pages. Keeping route **data loaders** framework-free (`./loaders/...`) and separate from Fresh 2 adapter view/CSS/`isPartial` entrypoints (`./routes/...`) guarantees zero contract or loader rewrites across renderers.

---

## Guide-level explanation

From a plugin author's perspective, adding UI to a NetScript plugin is declarative, framework-neutral at the data/contract layer, and wire-compatible with `RFC 0005`:

1. **Declare pure descriptors and/or separated portable loaders + Fresh adapter routes in the plugin.**
   A schema-only connector or activity plugin needs **zero JSX or Fresh dependency** — it exports a `descriptor` contribution from the shared contract spine (`app` family):

   ```ts
   import { defineAppDescriptor } from '@netscript/plugin-frontend-core';
   import { z } from 'zod';

   export const webhookEndpointDescriptor = defineAppDescriptor({
     id: 'webhook-endpoint',
     apiMajor: 1,
     title: 'Webhook Endpoint',
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
         procedureId: 'getLivePayload',
       },
     ],
   });
   ```

   When a plugin ships a full web console route (`plugins/workers` dogfood), it **strictly separates the framework-free portable data loader from the Fresh 2 adapter view**:

   ```ts
   // plugins/workers/frontend/loaders/jobs.ts — ZERO Fresh, Preact, RouteConfig, or isPartial imports
   import type {
     PortableHandlerResult,
     PortableRouteDataContext,
   } from '@netscript/plugin-frontend-core';

   export interface WorkersJobsData {
     readonly correlationId: string;
     readonly filter: string;
     readonly jobs: readonly RedactedJobSummary[];
   }

   export async function loadWorkersJobsData(
     ctx: PortableRouteDataContext,
   ): Promise<PortableHandlerResult<WorkersJobsData>> {
     const filter = ctx.url.searchParams.get('status') ?? 'all';
     const correlationId = typeof ctx.state.correlationId === 'string'
       ? ctx.state.correlationId
       : 'none';
     return {
       data: {
         correlationId,
         filter,
         jobs: await loadRedactedJobs(filter),
       },
     };
   }
   ```

   ```tsx
   // plugins/workers/frontend/routes/jobs.tsx — Fresh 2 web adapter ONLY
   import { page, type Context, type PageProps, type RouteConfig } from 'fresh';
   import { loadWorkersJobsData, type WorkersJobsData } from '../loaders/jobs.ts';

   export const css = ['@netscript/plugin-workers/frontend/routes/jobs.css'] as const;
   export const config: RouteConfig = { skipAppWrapper: false };

   export const handlers = {
     async GET(ctx: Context<{ correlationId?: string }>) {
       const result = await loadWorkersJobsData({
         url: ctx.url,
         params: ctx.params,
         state: { correlationId: ctx.state.correlationId },
       });
       return 'redirect' in result ? ctx.redirect(result.redirect, 302) : page(result.data);
     },
   };

   export default function WorkersJobsPage({ data }: PageProps<WorkersJobsData>) {
     return (
       <section class='ns-workers-console'>
         <h1>Background Jobs</h1>
         <JobTable jobs={data.jobs} />
       </section>
     );
   }
   ```

   And in `plugins/workers/frontend/mod.ts`, the single frontend export returns one or more RFC 0005 sibling `ContributionEnvelope` objects (for example `app` and optionally `devtools`):

   ```ts
   import type { ContributionEnvelope } from '@netscript/plugin-frontend-core';
   import { webhookEndpointDescriptor } from './descriptors/webhook.ts';

   const envelopes: readonly ContributionEnvelope[] = [
     {
       contract: { family: 'app', major: 1 },
       pluginKind: 'workers',
       base: '/plugins/workers',
       contributions: [
         webhookEndpointDescriptor,
         {
           kind: 'route',
           id: 'jobs',
           apiMajor: 1,
           title: 'Background Jobs',
           routePattern: '/jobs',
           loaderExport: './frontend/loaders/jobs',
           viewExport: './frontend/routes/jobs',
           cssExports: ['./frontend/routes/jobs.css'],
         },
       ],
       requires: { procedures: ['getJob', 'triggerJob'] },
       budgets: { initialJsKb: 12, islands: 2 },
     },
   ];

   export default envelopes;
   ```

2. **Declare the single parse-only `"frontend"` pointer in `scaffold.plugin.json`.**
   In `plugins/workers/scaffold.plugin.json`, `"frontend"` carries ONLY `{ export, framework: 'fresh' }` (matching `rfcs/0005` §6 `rfcs/0005-devtools-contribution.md:1074-1081`):

   ```json
   {
     "schemaVersion": 1,
     "name": "@netscript/plugin-workers",
     "frontend": {
       "export": "./frontend",
       "framework": "fresh"
     }
   }
   ```

3. **Install, generate, and diagnose deterministically.**
   Running `netscript plugin install workers --app web` (built on `#2582`'s `resolvePluginAppReferences`, see [`install-plugin-command.ts`](../packages/cli/src/public/features/plugins/install/install-plugin-command.ts#L25-L35)) and `netscript generate plugins` runs one shared transactional generator core that emits **separate** `app` and `devtools` projections per target app:
   - `.netscript/generated/app/frontend.registry.ts` (and `frontend.routes.ts`, `frontend.islands.ts`, `frontend.css`, `frontend.check.ts`) — host-assigned `ContributionIdentity`, literal `() => import(spec)` thunks, island specifiers, gateway grant stubs, and redacted schema metadata.
   - `.netscript/generated/app/frontend.diagnosis.json` — deterministic generate-time 6-state diagnostics (`unknown-zone`, `known-but-unmounted`, `capacity-rejected`, `window-mismatch`, `load-failure`, `zone-contract-mismatch`). Request-time runtime health/quarantine observations stay strictly **outside** generated files.
   - `.netscript/generated/devtools/...` — separate projection for the `devtools` family preserving `INV-4` dual production absence.

4. **Host app consumes neutral descriptors via `@netscript/fresh/plugins` (Fresh 2.3.3) and `@netscript/fresh/vite`.**
   The Fresh 2 app shell declares `@layer ns-plugins, ns-app;` as line 1 of its shell CSS, places `<Partial name="main">` *inside* its persistent shell while branching on `ctx.isPartial` (plus partial-synced active nav/breadcrumb state), mounts validated plugins via `GuardedPluginApp` **after** `fsRoutes()`, and renders zones using `<FrontendZone name="app.dashboard.panels/v1" context={...} />` with host pre-render `try/catch` quarantine and presence-only secret redaction.

---

## Reference-level explanation

### 1. Package Architecture, Spine Alignment (`F-1`), and Separate Projections (`M1`)

Per [`docs/architecture/doctrine/06-archetypes.md`](../docs/architecture/doctrine/06-archetypes.md) and [`docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`](../docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md), responsibilities split across strict package seams with **zero framework leakage into contracts or manifests**:

| Package / Subpath | Archetype | Permitted Dependencies | Owns | Forbidden Dependencies |
| --- | --- | --- | --- | --- |
| `@netscript/devtools-core` (`packages/devtools-core`) & `@netscript/plugin-frontend-core` (`packages/plugin-frontend-core`) | **Archetype 1 — Small Contract** | `@standard-schema/spec`, `zod` (peer/type validation only, never re-exported per `AP-14`), `@netscript/contracts` | Canonical RFC 0005 spine (`FamilyRef`, `ContributionEnvelope`, `ContributionIdentity`, `orderContributions()`, 6-state diagnosis types, budgets) + `app`-family contracts (`AppZoneContextMap`, `ZoneContribution<Z>`, `descriptor` + `x-ns-ui`, `FrontendKindRegistry`, `RedactedSecretHandle`, `SecretFieldSubmission`, `FrontendPluginCatalog` types, `PortableRouteDataContext`, `PortableHandlerResult`) | Fresh (`fresh`, `@fresh/*`), Preact (`preact`, `@preact/signals`), Vite, Tailwind, DOM/CSS, `Deno.*` APIs, runtime registries |
| `@netscript/plugin` (`./protocol`, `./sdk`) | **Archetype 3 / Protocol** | Canonical core contracts, `@netscript/plugin/protocol` | Manifest `schemaVersion: 1` `.passthrough()` evolution (`#1474`), `.withFrontend({ export, framework: 'fresh' })` builder pointer, path-safety validators | Fresh, Preact, Vite, DOM |
| `@netscript/cli` (internal generator, doctor, install/dev seams) | **CLI Host** | Canonical core contracts, `@netscript/plugin/protocol`, `#2582` `resolvePluginAppReferences` | Host-derived lexical + `Deno.realPath` containment (`#1473`), scoped generator subprocesses (`INV-2`), shared transactional replace-set core emitting **separate** `.netscript/generated/app/` and `.netscript/generated/devtools/` projections per app, `plugin doctor`, `plugin dev`, `plugin resource add --app` | Direct Fresh runtime rendering (`renderToString`), regex `AstExtractor` |
| `@netscript/fresh/plugins` (`packages/fresh/src/runtime/plugins/`) | **Archetype 2/4 — Fresh 2.3.3 Adapter** | `fresh@^2.3.3`, `preact@^10.29.2`, `@netscript/plugin-frontend-core`, `@netscript/fresh`, `@netscript/service/auth` | Allowlisted `GuardedPluginApp` facade, post-`fsRoutes` mount hook on `defineFreshApp`, `normalizeFreshRouteModule`, `<FrontendZone>`, pre-render `Promise.allSettled` containment with bounded deadline, recursive secret redaction + outbound enforcement, `FrontendPluginCatalog` runtime store, P5 deny-by-default HTTP gateway | Direct dependency on plugin source packages (`plugins/*`) |
| `@netscript/fresh/vite` (`packages/fresh/src/application/vite/vite.ts`) | **Fresh 2 / Vite 7 Adapter** | `vite@7.2.2`, `@fresh/plugin-vite@1.1.2` | Generated `islandSpecifiers`, watch paths, package-owned route CSS emission/hashing, Preact & `@preact/signals`/`@preact/signals-core` `appRoot`-relative resolution & `dedupe` | Unpinned `@fresh/plugin-vite` upgrades or Nitro 3 config |
| `@netscript/plugin-*-core` (`plugins/*/frontend`) | **Plugin / Core** | `@netscript/plugin-frontend-core` (for contracts/loaders/descriptors); optional `preact` / `@netscript/fresh-ui` *only* in Fresh web UI entrypoints | Domain descriptors (`descriptor`), framework-free `./loaders/...`, optional web `./routes/...` & `./islands/...` | Importing `@netscript/cli` internals or another plugin's UI internals |

**Spine Ownership Alignment with Accepted RFC 0005 (`F-1`):**
Accepted [`RFC 0005`](./0005-devtools-contribution.md#L939-L956) ratified `packages/devtools-core` (`@netscript/devtools-core`) as the owner of `FamilyRef`, `ContributionEnvelope`, and `ContributionIdentity`. Therefore:
- Under recommended Fork `F-1` Option A, `packages/devtools-core` owns those neutral spine primitives and `packages/plugin-frontend-core` explicitly consumes/re-exports them alongside `app`-family zone, descriptor, loader, redaction, and catalog contracts.
- Re-homing spine ownership into `packages/plugin-frontend-core` (Fork `F-1` Option B) requires an explicit owner-approved amendment to RFC 0005, updating `packages/devtools-core` to re-export from `@netscript/plugin-frontend-core` with a compatibility gate ensuring zero drift in wire schemas or `orderContributions()`.

**Separate Generated Projections from One Shared Transactional Core (`M1`):**
The CLI never imports Fresh `App` or emits `new App()` inside generated project files, and **never merges `app` and `devtools` into one production import graph**. One shared generator core validates each plugin's `ContributionEnvelope[]`, resolves target apps via `#2582` [`resolvePluginAppReferences`](../packages/cli/src/public/features/plugins/install/plugin-app-references.ts#L10-L30) (which can return **multiple** consumer apps per project), and writes **independent** replace-sets per app:

- **App projection (`.netscript/generated/app/<appName>/` or `<appRoot>/.netscript/generated/app/`):**
  `frontend.registry.ts`, `frontend.routes.ts`, `frontend.islands.ts`, `frontend.css`, `frontend.check.ts`, and `frontend.diagnosis.json`.
- **DevTools projection (`.netscript/generated/devtools/`):**
  `devtools.registry.ts`, `devtools.routes.ts`, `devtools.islands.ts`, `devtools.css`, `devtools.check.ts`, and `devtools.diagnosis.json` — strictly preserving RFC 0005's dual production exclusion (`INV-4` / `G-5` at [`rfcs/0005:752-769,2924`](./0005-devtools-contribution.md#L2924): absent from production builds AND runtime refusal when mode ≠ `development`).

Every replace-set transaction obeys RFC 0005 §10 D-3 ([`rfcs/0005:3083-3093`](./0005-devtools-contribution.md#L3083-L3093)):
1. Enumerate deterministic fixed filenames (**always emitted even when empty** — never throwing `EmptyPluginRegistryError` or leaving dangling imports on last-plugin removal).
2. Stage out-of-place under `.netscript/generated/.staging/<family>-<txid>/`.
3. Validate with `deno check --unstable-kv` on staged `*.check.ts` (which statically imports every referenced loader, view, island, and CSS module).
4. Commit via atomic swap only if staged output differs; **skip** if byte-identical to disk; **roll back** on any failure leaving the previous set intact.
5. **Immutable vs runtime state (`M1`):** `frontend.diagnosis.json` records *generate-time* states only (`unknown-zone`, `known-but-unmounted`, `capacity-rejected`, `window-mismatch`, `zone-contract-mismatch`, static `load-failure`). Runtime HTTP/resolver quarantine observations are held by the runtime `FrontendPluginCatalog` store in memory / runtime telemetry and **never mutate generated files**.

```ts
// Example: .netscript/generated/app/frontend.registry.ts (GENERATED — DO NOT EDIT)
import type { GeneratedAppFrontendRegistryV1 } from '@netscript/plugin-frontend-core';

export const generatedFrontendRegistry: GeneratedAppFrontendRegistryV1 = {
  schemaVersion: 1,
  targetApps: ['web'],
  contributions: [
    {
      contract: { family: 'app', major: 1 },
      identity: {
        packageName: '@netscript/plugin-workers',
        pluginKind: 'workers',
        installationId: 'workers',
        mountId: 'workers',
      },
      fullyQualifiedId: 'workers/jobs/v1',
      pluginVersion: '0.0.10',
      kind: 'route',
      zone: 'app.routes/v1',
      order: 10,
      routePattern: '/plugins/workers/jobs',
      loaderSpec: '@netscript/plugin-workers/frontend/loaders/jobs',
      loadLoader: () => import('@netscript/plugin-workers/frontend/loaders/jobs'),
      viewSpec: '@netscript/plugin-workers/frontend/routes/jobs',
      loadView: () => import('@netscript/plugin-workers/frontend/routes/jobs'),
      cssAssetUrls: ['/_ns/plugins/workers/assets/jobs.css'],
      budgets: { initialJsKb: 12, islands: 2 },
    },
  ],
  islands: [
    '@netscript/fresh/defer/island',
    '@netscript/plugin-workers/frontend/islands/job-actions',
  ],
} as const;
```

This replaces PR `#890`'s Fresh-coupled `plugin-routes.ts` / `plugin-islands.ts` design and [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template#L21-L45)'s hardcoded `@plugins/*/streams` aliases.

---

### 2. Unified `RFC 0005` Spine Invariants (`B1`, `B2`, `B6`)

Accepted [`RFC 0005`](./0005-devtools-contribution.md) established structural invariants to stop extension drift. This RFC adopts them **byte-compatible** across both `devtools` (`panel`, `link`, `diagnostic`) and `app` (`route`, `zone`, `descriptor`, `island`, `nav`, `procedure`) families:

1. **Canonical Wire Schema & AP-3 / AP-24 Guards (`B1`, [`rfcs/0005:964-1009`](./0005-devtools-contribution.md#L964-L1009)):**
   `FamilyRef` keys the handshake by `{ family, major }`; `ContributionEnvelope` keeps `contributions: readonly unknown[]` so the envelope validates **nothing** about family payloads (`AP-3`), delegating payload validation strictly to the family's registered schema and rendering strictly through a typed kind registry (`AP-24`, never `switch (item.kind)`):

   ```ts
   export interface FamilyRef {
     readonly family: string; // 'app' | 'devtools' | future siblings
     readonly major: number;
   }

   export interface ContributionEnvelope {
     readonly contract: FamilyRef;
     readonly pluginKind: string;
     readonly base?: string; // preferred mount base; app honors host-validated mountId, devtools ignores
     readonly contributions: readonly unknown[];
     readonly requires?: ContributionRequires;
     readonly budgets?: ContributionBudgets;
   }

   /** Host-assigned identity quartet (rfcs/0005:1013-1021). */
   export interface ContributionIdentity {
     readonly packageName: string;    // provenance + version drift, e.g. '@netscript/plugin-workers'
     readonly pluginKind: string;     // installer canonicalName idiom, e.g. 'workers'
     readonly installationId: string; // host-assigned at install; unique per installation
     readonly mountId: string;        // host-assigned; derives ALL keys, routes, gateways, & CSS scopes
   }

   export interface AppContributionBase {
     readonly id: string;       // pattern ^[a-z][a-z0-9-]*$, unique within (installation, family)
     readonly apiMajor: number; // fully-qualified id: `${identity.mountId}/${id}/v${apiMajor}`
     readonly title: string;
     readonly description?: string;
     readonly icon?: string;
     readonly order?: number;   // integer in [-100, 100]; out-of-range is a generate-time error
   }
   ```

2. **Host-Assigned `ContributionIdentity` & Multi-Installation Isolation (Forbidding `resolvePluginLocalName`, `B1`):**
   [`plugin-registry.ts#L86-L91`](../packages/cli/src/kernel/adapters/config/plugin-registry.ts#L86-L91) currently collapses scoped names via `resolvePluginLocalName()`. Generators MUST key all identifiers, routes (`/plugins/<mountId>/...`), gateway mounts (`/api/plugins/<mountId>/...`), CSS wrappers (`[data-ns-plugin="<mountId>"]`), and diagnosis records strictly by host-assigned **`mountId`** and **`${mountId}/${id}/v${apiMajor}`** — NEVER `packageName#localId` and NEVER `resolvePluginLocalName`. Consequently, **two installations of the same package** (e.g. `@netscript/plugin-workers` installed as `workers-east` and `workers-west`) receive distinct host-assigned `installationId` and `mountId` values (`workers-east/jobs/v1` vs `workers-west/jobs/v1`) and never collide. Duplicate `mountId` across installations or duplicate `id` within `(installation, family)` is a generate-time error.

3. **Closed Host Zone Vocabulary, Exact Matching, `anchors[]`, & Deterministic Ordering (`B2`, [`rfcs/0005:1209-1300`](./0005-devtools-contribution.md#L1209-L1300)):**
   - **Host-owned closed zones:** Hosts declare version-suffixed zones via `ZoneDescriptor`:

     ```ts
     export interface ZoneDescriptor {
       readonly id: string;               // `<zoneName>/v<major>`, e.g. 'app.dashboard.panels/v1'
       readonly capacity?: number;        // deterministic winner cap
       readonly anchors?: readonly string[]; // host-curated pins: `<mountId>/<id>/v<apiMajor>`
     }
     ```

   - **Normative matching rule:** Contribution target zone `z` matches `host.zones[].id` by **exact, case-sensitive string equality** on the full `<zoneName>/v<major>` string (hosts may serve at most two consecutive zone majors concurrently; no prefix match, no highest-version fallback).
   - **Two-tier deterministic `orderContributions(zone, items)`:**
     1. **Tier 1 (`anchors[]`):** Contributions whose `fullyQualifiedId` (`<mountId>/<id>/v<apiMajor>`) appears in `zone.anchors` render **first**, in `anchors` sequence. An anchor matching no installed contribution emits a generate-time **warning** (never a silent no-op).
     2. **Tier 2 (`(order ?? 0, mountId, id)`):** Remaining contributions sort ascending by `(order ?? 0, identity.mountId, id)` using code-unit lexicographic comparison (never locale collation).
     3. **Out-of-range error:** `order` MUST be an integer in `[-100, 100]`. **Any value outside `[-100, 100]` is a generate-time error, never silently clamped.**
     4. **Capacity winners:** When `zone.capacity` (or host `limitPerPlugin`, default `16`) is exceeded, the first `capacity` items in final ordered sequence win and the deterministic overflow remainder is recorded as `capacity-rejected`.

4. **Unified 6-State Diagnosis Taxonomy (`B2`, [`rfcs/0005:1344-1351`](./0005-devtools-contribution.md#L1344-L1351)):**
   `frontend.diagnosis.json` and `devtools.diagnosis.json` share the exact 6-state taxonomy:

   | # | State | Trigger (Exact Precedence) | Class / Host Policy Outcome |
   | --- | --- | --- | --- |
   | 1 | `unknown-zone` | Zone base name matches neither family vocabulary nor any host `zones[]` entry (typo class) | Excluded + error |
   | 2 | `known-but-unmounted` | Full `<zoneName>/v<major>` is in family vocabulary, absent from this host's `zones[]` | Info only — **not** quarantine (`CapabilityEmpty` `'installed-unwired'`; `doctor` `ok: true` with info message) |
   | 3 | `capacity-rejected` | Deterministic overflow past `zone.capacity` or `limitPerPlugin` | Excluded + overflow report naming winners & losers |
   | 4 | `window-mismatch` | Envelope `(family, major)` is outside the host's supported family major window | **Quarantine** |
   | 5 | `load-failure` | Generate-time staged check / import error (or runtime resolver failure tracked in runtime catalog, outside generated files) | **Quarantine** |
   | 6 | `zone-contract-mismatch` | Zone base name is known, but contribution targets a `/v<major>` the host does not serve (diagnostic names declared vs served versions) | **Quarantine** |

5. **Host-Owned Family Failure Policy (No Per-Contributor `onInvalid`, `B2`, [`rfcs/0005:1395-1409`](./0005-devtools-contribution.md#L1395-L1409)):**
   Failure policy is strictly **host/family-owned**, never a contributor-controlled envelope knob:
   - **`app` family:** A broken manifest pointer, schema error, containment failure, out-of-range `order`, duplicate `id`, or route conflict **fails `generate` / `plugin install`** (`fail-install`), rolling back the staged replace-set atomically. At HTTP request time, pre-render data resolver failures degrade to per-zone quarantine (`HTTP 200` + fallback card).
   - **`devtools` family:** **Advisory-install policy (`exclude-and-diagnose`)** — a broken `devtools` contribution or envelope NEVER fails `plugin install` and NEVER takes down a valid sibling `app` envelope; the offending `devtools` item is excluded, recorded in `devtools.diagnosis.json`, and valid remainders proceed. (Transaction/emitter crashes still roll back atomically.) Whether `onInvalid` ever becomes a host-configurable per-family policy remains deferred (`rfcs/0005` `O-4`), not contributor-authored.

   **Required `#1471` / `W1-a` Contract Gate Tests (from [`W1-a-contracts-unit.md`](../.llm/runs/plan-devtools-contribution--seed/filing/issues/W1-a-contracts-unit.md#L54-L75)):**
   - Pinned `anchors[]` winner beating lower-`order` unanchored items under `capacity` cap + unmatched anchor warning.
   - Out-of-range `order` (`101`, `-101`, `1.5`) throwing a generate-time error.
   - Distinct diagnoses for unsupported `(family, major)` (`window-mismatch`), valid family zone absent from host (`known-but-unmounted`), unserved `/v<major>` (`zone-contract-mismatch`), and unknown zone (`unknown-zone`).
   - Invalid `devtools` item excluded alongside valid `app` item in mixed-family `ContributionEnvelope[]` without failing install.
   - Two installations of `@netscript/plugin-workers` producing non-colliding `mountId` / `<mountId>/<id>/v<apiMajor>` outputs.
   - `deno task arch:check`, `deno doc --lint` (zero slow types), and zero Fresh/Preact/`fresh-ui` dependency checks.

6. **Manifest `.passthrough()` Precondition (`#1474`, Keeping `schemaVersion: 1`):**
   Live [`packages/plugin/src/protocol/manifest.ts#L297-L311`](../packages/plugin/src/protocol/manifest.ts#L297-L311) ends `PluginInstallerManifestSchema` with `.strict()` on `schemaVersion: 1`, which hard-rejects `"frontend"` or `"devtools"` (proved in Probe C `1.1`). Relaxing the top-level object schema to `.passthrough()` while keeping `schemaVersion: 1` and strict inner fields preserves full compatibility with older plugins, while **`validateFrontendPointerAtGenerateTime`** enforces `{ export, framework: 'fresh' }` strictly at `generate plugins` time (Probe C `1.2`).

7. **Root-Anchored Path Containment (`#1473`) & Scoped Subprocesses (`B6`):**
   - **Trusted root anchoring & fail-closed symlink resolution:** [`ui/registry.ts#L310-L317`](../packages/cli/src/kernel/application/ui/registry.ts#L310-L317) (`resolveTarget`) currently trusts arbitrary absolute/relative targets with zero containment. All writes in the install/generate pipeline (`ui/registry.ts`, `installed-runtime-registry-generator.ts`, `generate plugins`) MUST flow through one shared containment helper that rejects `../`, `\`, `\0`, absolute paths, Windows drives, UNC prefixes, and percent-encoded delimiters (`%2e`/`%2f`/`%5c`), and verifies via `Deno.realPath` that `.netscript`, `.netscript/generated`, `.netscript/generated/.staging/<txid>`, every expanded/staged destination, and every `ModuleRef` lie strictly inside **trusted `Deno.realPath(projectRoot)` / `Deno.realPath(packageRoot)`** — **never trusting `.netscript/generated` itself prior to verifying its ancestors, and failing closed whenever `Deno.lstat` succeeds on a path whose `Deno.realPath` fails** (e.g., broken/dangling symlinks; proved in Probe C `1.3`).
   - **Scoped generator subprocesses & out-of-process discovery (`INV-2`, `INV-9`):** [`installed-runtime-registry-generator.ts#L384-L400`](../packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts#L384-L400) currently spawns child generators with valueless bare `'--allow-read'`, `'--allow-write'`. `#1473` confines contributor output exclusively to host-owned `--out-dir` staging inside `.netscript/generated/.staging/`, scopes `--allow-read=<...>` / `--allow-write=<staging>` with **zero bare allow flags**, and executes contributor discovery out-of-process ([`rfcs/0005:2901-2907,2921-2922,3107-3116`](./0005-devtools-contribution.md#L2921-L2922)), retaining all three RFC 0005 gates: real write-path containment (`G-1` + fitness check), subprocess argv test + permission-denial E2E (`G-2`), and module-side-effect isolation (`G-10`).
   - **Explicit rejection of regex `AstExtractor`:** [`packages/plugin/src/sdk/discovery/ast-extractor.ts`](../packages/plugin/src/sdk/discovery/ast-extractor.ts) MUST NOT be extended for frontend contributions.

---

### 3. Unified Contribution Kinds, Typed Zones (`M3`), & Descriptors

Every plugin contribution maps onto the closed `app` or `devtools` kind sets registered through `FrontendKindRegistry` (`AP-3` / `AP-24`):

| Family | Kind | Target Anchor / Zone | Typed Payload & Contract Summary | Portable Across Fresh 2 / Future Fresh 3 / GPUIX? |
| --- | --- | --- | --- | --- |
| `app` | `route` | `app.routes/v1` | `routePattern`, `loaderExport` (`PortableRouteDataContext -> PortableHandlerResult`), `viewExport`, `cssExports`, `budgets`, optional `authPolicy` | Portable `./loaders/...` (`P2d`); web JSX/CSS lives strictly in `./routes/...` adapter |
| `app` | `zone` | `Z extends AppZoneId` (`<zoneName>/v<major>`) | Typed `ZoneContribution<Z>` bound to `AppZoneContextMap[Z]`, declarative `match` hint, `loaderExport`, `viewExport` (or inline `descriptor`) | Context type, match predicate, and data loader 100% portable |
| `app` | `descriptor` | `Z extends AppZoneId` or `inspector/sections/v1` | Pure JSON Schema / Standard Schema + `NsUiFieldHints` (`x-ns-ui`) + optional typed `tabs?: readonly DescriptorTabSpec[]` | **100% portable** across Fresh 2, Fresh 3, GPUIX, and mobile |
| `app` | `island` | Host build manifest (`islandSpecifiers`) | Package subpath `moduleSpec`, peer constraints (`preact@^10.29.2`, `@preact/signals@2.11.3`), CSS subpath, max JS budget | Web renderers; ignored/replaced cleanly on GPUIX |
| `app` | `nav` | `app.nav.sidebar/v1`, `app.nav.topbar/v1`, `app.nav.spaces/v1` | `label`, `href` / bound `RouteRef`, `icon`, `match: 'exact' \| 'prefix'`, optional non-blocking `countQuery` | **100% portable** navigation metadata |
| `app` | `procedure` | `app.gateway.procedures/v1` | oRPC `ContractProcedure` + host-approved grant (`owningService`, typed param binding, `(principal, resource)` policy) | **100% portable** HTTP RPC boundary |
| `devtools` | `panel` / `link` / `diagnostic` | `DevToolsZoneId` (`workers.console/v1`, etc.) | Existing [`RFC 0005`](./0005-devtools-contribution.md) §6–§8 read-only server-rendered UI nodes & typed deep-links | Same shared core & diagnosis spine |

#### Typed Entity Zone Context Map & Kind Registry (`M3`)

Mirroring [`rfcs/0005:1544-1582`](./0005-devtools-contribution.md#L1544-L1582) (`DevToolsZoneContextMap` / `DevToolsPanelContribution<Z>`), `@netscript/plugin-frontend-core` defines a closed, host-owned typed `AppZoneContextMap` whose `*WireData` payloads are pure JSON-serializable objects (never functions, ports, or secrets):

```ts
export interface AppZoneContextMap {
  readonly 'app.dashboard.panels/v1': DashboardZoneWireContext;
  readonly 'nav.spaces/v1': NavSpacesWireContext;
  readonly 'pipeline.inspector.sections/v1': PipelineInspectorWireContext;
  readonly 'run.detail.panels/v1': RunDetailWireContext;
  readonly 'review.detail.body/v1': ReviewDetailWireContext;
  readonly 'dataset.detail.panels/v1': DatasetDetailWireContext;
}

export type AppZoneId = keyof AppZoneContextMap;

export interface ZoneContribution<Z extends AppZoneId = AppZoneId>
  extends AppContributionBase {
  readonly kind: 'zone';
  readonly zone: Z;
  readonly match?: { readonly entityType?: string; readonly capability?: string };
  readonly resolveData: (
    ctx: AppZoneContextMap[Z],
    signal: AbortSignal,
  ) => Promise<Readonly<Record<string, unknown>>>;
}

/** AP-24 typed renderer registry — core holds no JSX/renderer implementations. */
export interface FrontendKindRegistry<TRenderer> {
  register<K extends AppContributionKind>(kind: K, renderer: TRenderer): void;
  resolve(kind: string): TRenderer | undefined;
}
```

#### Declarative Schema + `x-ns-ui`, Typed Dock Tabs, & Server Write Authorization (`M3`, `F-3`, `#2670`)

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
  readonly editable?: boolean;      // UI hint ONLY; server MUST still enforce write policy
  readonly fixedByPlugin?: boolean; // server rejects writes modifying plugin-fixed fields
  readonly secret?: boolean;        // triggers mandatory server-side redaction BEFORE serialization
  readonly overridable?: boolean;   // server enforces lock when overridable === false
  readonly group?: string;
  readonly order?: number;
}

export interface DescriptorTabSpec<
  TInput extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  TOutput extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  readonly id: string;
  readonly title: string;
  readonly anchor: 'inspector/dock/v1';
  readonly procedureId: string;
  readonly inputSchema?: unknown;   // Standard Schema / JSON Schema validated before QueryIsland fetch
  readonly outputSchema?: unknown;  // Standard Schema / JSON Schema redacted before render
}
```

- **Strict canonical `x-ns-ui` metadata (`F-3` Option B default):** Framework packages (`@netscript/plugin-frontend-core`, `@netscript/fresh/plugins`) read **only canonical `x-ns-ui`** — there is zero framework-level vendor overlay key or merge path. Any downstream host (e.g., `acme`) with an existing custom schema key (`x-acme-ui`) either migrates its schemas directly to `x-ns-ui` or runs a small consumer-owned pre-pass normalizing `x-acme-ui` -> `x-ns-ui` (preserving any stricter `secret: true`, `fixedByPlugin: true`, `editable: false`, or `overridable: false` flags) before handing schemas to NetScript. The consumer's versioned domain schema remains authoritative.
- **Authorization boundary (`M3`):** Widget hints (`editable`, `fixedByPlugin`, `overridable`) and zone `match` predicates are **rendering/routing metadata only — NEVER authorization**. Every descriptor or dock-tab write handler MUST enforce server-side RBAC, entity ownership `(principal, entityId)`, schema validation, and reject mutations targeting `fixedByPlugin`, `editable: false`, or locked `overridable: false` fields before applying `SecretFieldSubmission`.
- **Merged PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670) alignment (`M4`):** When `@netscript/fresh/plugins` renders a `descriptor` in Fresh 2, `secret-field`, `key-value-editor`, and `chips-input` map directly onto the shipped `@netscript/fresh-ui` components (`packages/fresh-ui/src/runtime/secret-field/secret-field.utils.ts` on `origin/main`) using `resolveSecretFieldSubmission` (`replace | keep | clear | unset | invalid`).

---

### 4. Fresh 2.3.3 Host Runtime Adapter (`@netscript/fresh/plugins` & `@netscript/fresh/vite`)

#### 4.1 Allowlisted `GuardedPluginApp` Facade, Post-`fsRoutes` Mounting, & Route Normalization (`M2`)

Probe A (`P1.0`, `P1a`, `P1d`, `P1e`, `P1g`, `P2a`–`P2c`) proved five load-bearing Fresh `2.3.3` constraints:

1. **`defineFreshApp` ordering ([`define-fresh-app.ts#L114-L115`](../packages/fresh/src/runtime/server/define-fresh-app.ts#L114-L115)):** Currently `options.configure?.(app)` runs **before** `registerFsRoutes(app, options)`. Pre-`fsRoutes` mounts miss `_app`, `_layout`, and `_middleware` (`P1.0`). **W2 fix:** add an explicit post-`fsRoutes` `configurePlugins` / `plugins` mount phase inside `defineFreshApp`.
2. **Allowlisted `GuardedPluginApp` facade (NOT subclassing `App`, `M2`):** In `@fresh/core@2.3.3`, `App.#commands` is an ES `#private` field, and raw `app.mountApp(prefix, childApp)` lets a child's `.notFound()` or `.appWrapper()` hijack the host shell (`P1g`). Note also that subclassing `class GuardedPluginApp extends App` (as the Wave-0 probe did for empirical demonstration) breaks if upstream `App` adds new commands (such as `.fsRoutes()` or future hooks) or expects exact `onError` overloads. Therefore, `@netscript/fresh/plugins` implements `GuardedPluginApp<State>` as a **sealed composition facade** holding a private `#inner: App<State>` and exposing **ONLY allowlisted plugin methods** (`.route()`, `.use()`, `.all()`), while mounting into the host via an internal friend symbol and delegating **error handling to host-owned scoped `hostApp.onError('/plugins/<mountId>', ...)` registration** (verified in `P4d`, avoiding the `/prefix/*` literal-`*` bug!).
3. **Avoid flat `app.route()` + `/prefix/*` middleware (`P1d`):** Fresh's `patternToSegments` turns `/prefix/*` into a literal `'*'` child segment so `app.use('/prefix/*')` and `app.onError('/prefix/*')` are silently skipped. Host-mounted `GuardedPluginApp` sub-apps preserve `host-mw -> plugin-mw -> nested-mw -> handler` order (`P1d`, `P1f`).
4. **`normalizeFreshRouteModule` (`P2a`–`P2c`):** Loads plugin adapters lazily via literal `() => import(spec).then(normalizeFreshRouteModule)`. Enforces strict export allowlisting (`default`, `handler` or `handlers` [not both], `config`, `css`), rejects unknown/ambiguous/empty exports, injects `route.css` via `setAdditionalStyles`, and enforces `middleware -> handlers.GET -> page({ data }) -> pure page` with zero `ctx.render()`.
5. **Component-only `_404` status gotcha (`P1e`):** In Fresh `2.3.3`, a component-only `_404` returns HTTP `200`; host `_404` and scoped plugin catch-alls (`subApp.all('/*')`) must pair `_404` with an explicit HTTP `404` handler.

#### 4.2 Non-Blocking `<Partial name="main">`-Inside-Shell, `ctx.isPartial`, & Nav/Breadcrumb Sync (`M5`)

Probe A `P1b-naive` vs `P1b-aware` confirmed the bug in [`_layout.tsx.template#L39-L51`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51):

- Wrapping `<SidebarShell>` *inside* `<Partial name="page">` forces Fresh to transmit the whole shell on every partial transition.
- Simply moving `<Partial name="main">` inside `<SidebarShell>` without `ctx.isPartial` branching still executes `_layout` chrome in the raw HTTP response (`rawBodyHasShellChrome: true`), **AND** because `navigation` active link highlighting and `<Breadcrumb>` sit inside `<SidebarShell>` outside `<Partial name="main">` (`_layout.tsx.template:39-64,81-86`), a naive partial response would leave stale active nav & breadcrumb labels!
- **Required host pattern (`P1b-aware` + `M5`):**
  1. Host `_app.tsx` and `_layout.tsx` branch on `ctx.isPartial` so `?fresh-partial=true` emits **zero** outer shell chrome (`rawBodyHasShellChrome === false`).
  2. Active navigation highlighting and `<Breadcrumb>` inside `<SidebarShell>` update across partial transitions via a reactive client navigation island / partial-synced shell header (`f-client-nav` URL signal or secondary `<Partial name="shell-nav">` / `<Partial name="breadcrumb">` slots), verified by an explicit **full -> partial -> back** browser navigation gate asserting active nav + breadcrumb updates on both forward partial navigation and browser `popstate` back navigation!
  3. Plugins inside `<Partial name="main">` may render nested sub-partials with distinct names (`name="p1-widget"`), never `name="main"` (`preact_hooks.ts:224`).
  4. Async counts/dock tabs load non-blockingly via `@netscript/fresh/query` (`QueryIsland`, `staleTime`, hover prefetch). In parallel, W2 exports [`packages/fresh/src/runtime/server/sse.ts`](../packages/fresh/src/runtime/server/sse.ts) on [`packages/fresh/src/runtime/server/mod.ts`](../packages/fresh/src/runtime/server/mod.ts) (`createSSEStream`).

#### 4.3 Exact SSR & Client Error Containment (`M2`, `P0.1`, `P4a`–`P4e`)

Probe A proved Fresh `2.3.3` does **not** set `preactOptions.errorBoundaries` (`undefined` in `P0.1`), and `preact-render-to-string` (`6.8.x`) is synchronous:

- **What IS contained:**
  1. **Pre-render data-phase containment (`P4a`):** All `<FrontendZone>` data resolvers and `descriptor` loaders execute *before* `ctx.render()` inside host `Promise.allSettled` + per-zone `try/catch` **bounded by an explicit `AbortSignal.timeout(resolverDeadlineMs)`** (default host policy, e.g. `2_500 ms`), returning `ZoneLoadState` (`ready | quarantined | mismatched | empty`). A failing or timed-out zone renders an inline Quarantine card (`HTTP 200`) while sibling zones stay healthy.
  2. **Post-hydration client `ErrorBoundary`:** Hydrated islands wrap children in a browser Preact `ErrorBoundary` (tested separately by forcing a post-hydration click/state throw inside a hydrated island and proving sibling zones & host shell remain interactive).
  3. **Top-level route `onError` + isolated `_error` (`P4d`):** Host-scoped `onError('/plugins/<mountId>', ...)` isolates top-level dedicated plugin route throws; root `_error` sets `{ skipAppWrapper: true, skipInheritedLayouts: true }` so shell errors do not infinite-loop.
- **What is NOT contained by component boundaries in Fresh 2.3.3 (`P4b`, `P4c`):**
  - A **synchronous throw inside a JSX zone component during SSR** aborts the entire page response (`HTTP 500`) under Fresh defaults (`preactOptions.errorBoundaries === undefined`).
  - A **nested `<AsyncChildZone />` inside JSX** is NOT awaited by `renderToString`, silently emitting empty `<div></div>` (`HTTP 200`) and leaking an `unhandledrejection`.
  - **Consequence:** Data-phase `try/catch` NEVER promises per-zone SSR JSX render isolation; plugin zone components MUST keep JSX pure and hoist all async work into pre-render resolvers (matching `.llm/runs/plan-frontend-contrib--seed/design/canonical/04-host-runtime.md:123-130`).

#### 4.4 Vite 7.2.2, `@fresh/plugin-vite@1.1.2`, Package-Owned CSS, & Theme Signal (`M5`, `N2`)

- **Version resolution vs npm-only `catalog:` (`N2`):** Workspace `deno.lock:29-33` resolves `@fresh/core@2.3.3` and `@fresh/plugin-vite@1.1.2`, while [`scaffold-app-catalog.ts`](../packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts#L2-L26) pins `npm:` packages (`vite@7.2.2`, `preact@^10.29.2`, `@preact/signals@2.11.3`, `zod`) via `catalog:` and keeps JSR packages (`jsr:@fresh/core@^2.3.3`, `jsr:@fresh/plugin-vite@^1.1.2`) as explicit caret ranges because Deno `catalog:` is **npm-only**.
- **`@preact/signals` resolution fix (`M6`):** [`createNetScriptVitePlugin`](../packages/fresh/src/application/vite/vite.ts#L391-L404) currently passes `importer` unchanged to `this.resolve('@preact/signals', importer)` and omits `@preact/signals-core` from `dedupe`. Probe B's passing single-runtime build required a fixture-only `hostFreshSignalsPin` resolver in `vite.config.ts:29-47`. W2 MUST resolve `@preact/signals` and `@preact/signals-core` relative to `appRoot` inside `vite.ts`, add `@preact/signals-core` to `dedupe`, keep production builds on `vite build` (not `--configLoader native build`), and enforce exact peer pins (`@preact/signals@2.11.3`).
- **Root JSX config & explicit pre-caching (`M1`–`M5`):** Host root `deno.json` sets `"jsx": "precompile"`, `"jsxImportSource": "preact"`, and `netscript plugin install` / builds explicitly `deno cache` resolved remote plugin specifiers beforehand (`@deno/loader@0.4.0` ignores `--cached-only` online and fails closed offline). `netscript plugin dev` triggers a controlled Vite restart whenever generated `islandSpecifiers` add/remove items (`@fresh/plugin-vite@1.1.2` `server_snapshot.ts:112` `islandSpecByName.clear()` workaround, `D4`).
- **Package-owned route CSS delivery (NEVER host `static/`, `M5`):**
  In Probe B, the mounted route's `export const css = ['/mounted-explicit.css']` pointed to a fixture file inside host `apps/web/static/`. In production plugins:
  - Plugins **never write into host `static/`**. Plugin routes & zones declare package-owned CSS subpaths (`cssExports: ['./frontend/routes/jobs.css']`).
  - `@netscript/fresh/vite` emits content-hashed CSS assets into the Fresh/Vite client asset pipeline under `/_ns/plugins/<mountId>/assets/<name>-<hash>.css` and prefixes `<link rel="stylesheet">` hrefs with host `basePath` when configured, avoiding `?url` CSS imports (`C3` fails in `deno.ts`) and shared SSR CSS chunks (`C4` races `server_entry.ts:160` parallel `Deno.rename`).
- **Global `client.ts.template` CSS split & `@layer ns-plugins, ns-app;` (`C1`, `C2`, `M5`):**
  - Split [`packages/cli/src/kernel/assets/app/client.ts.template#L1-L4`](../packages/cli/src/kernel/assets/app/client.ts.template#L1-L4) so the global shell bundle loads ONLY `@layer ns-plugins, ns-app;`, minimal tokens, and shell styles (`169 B` minimal / `40,298 B` Tailwind shell vs `84,788 B` bloated global), while plugin & heavy component CSS splits per route/island.
  - Line 1 of host `styles.css` MUST declare **`@layer ns-plugins, ns-app;`** (fixing PR `#890`'s inverted `@layer ns-app, ns-plugins;`), ensuring host CSS (`rgb(22, 163, 74)`) beats plugin CSS (`rgb(220, 38, 38)`) regardless of `<link>` order (`C2`).
- **Scoping, portal roots, & cross-tab/system theme sync (`M5`):**
  - Plugin routes & zone wrappers carry `data-ns-plugin="<mountId>"` and `data-ns-contribution="<mountId>/<id>"`; host provides a per-plugin portal container `<div data-ns-plugin="<mountId>">` under `document.body` so modals/popovers keep CSS scoping.
  - Host theme state retains `ns-theme` + `data-theme`/`data-scheme`/`data-density`/`data-flavor` in [`_app.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_app.tsx.template#L4-L31) **AND** adds a cross-tab `window` `'storage'` listener + live `matchMedia('(prefers-color-scheme: light|dark)')` subscription for `ns-theme` parity.
  - **Mandatory M5 gates:** `full -> partial -> back` navigation test, stylesheet arrival before first paint (computed style asserted before interactive controls render, zero FOUC), active nav & breadcrumb accuracy across partial swaps, and cross-tab + OS `prefers-color-scheme` theme updates.

---

### 5. Portable Loaders & Future Fresh 3.x / GPUIX Migration Seam (`B7`)

**Honest release statement:** `0.0.10` implements **only the Fresh 2.3.3 (`vite@7.2.2`, `@fresh/plugin-vite@1.1.2`) adapter** under `@netscript/fresh/plugins`. Fresh 3.x is not GA and is not implemented in `0.0.10`; Fresh 3 is documented strictly as a migration target until exercised.

As proved in Probe A `P2d` against [`rfcs/0007-gpuix-native-desktop-renderer.md`](./0007-gpuix-native-desktop-renderer.md#L96-L106) and [`.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts`](../.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts#L14-L30), portability holds **only** when the data loader is a separately importable, framework-free module with zero `fresh`, `@fresh/*`, `preact`, `RouteConfig`, or `isPartial` dependencies:

```ts
// @netscript/plugin-frontend-core (zero Fresh/Preact dependencies)
export interface PortableRouteDataContext {
  readonly url: URL;
  readonly params: Readonly<Record<string, string>>;
  readonly state: Readonly<Record<string, unknown>>;
}

export type PortableHandlerResult<TData> =
  | { readonly data: TData }
  | { readonly redirect: string };
```

| Layer | Fresh 2.3.3 (`0.0.10`) | Fresh 3.x Migration Target (Unexercised, Post-`0.0.10`) | GPUIX Native Desktop (`rfcs/0007`) | What Stays Unchanged |
| --- | --- | --- | --- | --- |
| Core contracts & loaders | `@netscript/plugin-frontend-core` + `./loaders/...` (`PortableRouteDataContext -> PortableHandlerResult<T>`) | Identical | Identical (runs `./loaders/...` without resolving `./routes/...` Fresh views, proved in `P2d`) | Manifest `"frontend"`, `ContributionEnvelope`, `descriptor`, `x-ns-ui`, redaction, catalog, 6-state diagnosis, portable loaders |
| Generated registry | `.netscript/generated/app/frontend.registry.ts` literal `() => import(spec)` for `loadLoader` & `loadView` | Identical | Consumes `loadLoader`, `descriptor`, `zone`, `nav`, `procedure` | Zero Fresh 2 `App` or VNode references in `.netscript/generated/` |
| Web view adapter | `./routes/<name>.tsx` adapted via `normalizeFreshRouteModule` (`css`, `RouteConfig`, `isPartial`, `page(data)`) | Fresh 3 `freshHandler` -> `renderPage(inner)` | Replaced by GPUIX native component mapping (`rfcs/0007` explicitly excludes HTML/CSS pages) | Zero rewrites to `./loaders/...` or descriptors |
| Build & bundling | `@netscript/fresh/vite` (`vite@7.2.2` + `@fresh/plugin-vite@1.1.2`) | `@netscript/fresh3/vite` (`Vite 8 + Nitro 3`) | Cargo / GPUIX bundle | No Vite 7 leak in plugin manifests or core contracts |

---

### 6. Security: Presence-Only Redaction (`B3`), `#2670` Write Protocol (`M4`), P5 Gateway (`B4`), & Transport Separation (`B5`)

#### 6.1 Presence-Only Secret Redaction & Merged `#2670` Write Protocol (Probe C `3.1`–`3.2`)

Every data path crossing from server plugins into `PluginClientContext`, zone wire payloads, `descriptor` values, gateway responses, SSR HTML, `?fresh-partial=true`, or island hydration JSON MUST pass through `@netscript/fresh/plugins`'s recursive redaction pipeline:

1. **Presence-only `RedactedSecretHandle` (ZERO browser-visible digests/fingerprints, `B3`):**
   Client views NEVER receive raw secret strings **and NEVER receive SHA-256 digests or fingerprints** (forbidding equality and offline-guessing oracles):

   ```ts
   export const REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__' as const;

   export interface RedactedSecretHandle {
     readonly __nsSecretHandle: true;
     readonly sentinel: typeof REDACTED_SECRET_SENTINEL;
     readonly isSet: boolean;
   }
   ```

   Any hash/fingerprint needed for server-side audit or change-detection stays strictly on the server.
2. **Recursive schema traversal across objects, arrays, records, & JSON Schema (`B3`):**
   Schema-driven redaction unwraps all schema wrapper layers (`optional`, `nullable`, `default`, `readonly`) and recursively traverses nested objects, **`z.array(...)` elements**, and **`z.record(...)` values** (plus `z.toJSONSchema(...)` outputs), evaluating canonical `x-ns-ui: { secret: true }` **prior to** `null`/`undefined` short-circuiting. This ensures a secret nested under a non-sensitive property name (such as `endpoints[0].notes` or `envConfigs.prod.notes`) becomes `{ __nsSecretHandle: true, sentinel: '__NS_REDACTED_SECRET__', isSet: boolean }`.
3. **Deep transport redaction & strict allowlisted outbound validator (`B3`):**
   - Embedded URL credentials (`https://user:pass@host`, `postgres://u:p@db`) and sensitive query params (`token`, `secret`, `password`, `api_key`, etc.) strip credentials to `REDACTED_SECRET_SENTINEL` and emit a presence-only handle.
   - Sensitive headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `proxy-authorization`, `x-auth-token`, `x-api-secret`, accepting `Headers` or plain objects) become presence-only `RedactedSecretHandle`.
   - `assertNoUnredactedSecrets(value, schema?)` walks values **in lockstep with schema** and enforces an **exact allowlisted handle shape** (`__nsSecretHandle === true`, `sentinel === REDACTED_SECRET_SENTINEL`, `typeof isSet === 'boolean'`, `Object.keys(h).length === 3`). Handle-shaped objects carrying extra properties (e.g. `digest`, `fingerprint`, or smuggled fields) or raw values under schema `secret: true` fields throw `UNREDACTED_SECRET_SERIALIZATION_BLOCKED`. Passing non-serializable `PrincipalPort` objects throws `NON_SERIALIZABLE_PORT_BLOCKED`. Enforced across **all 5 boundaries**: service, gateway, SSR HTML, `?fresh-partial=true`, and Fresh island hydration serialization (proved in Probe C `3.1`–`3.2`).
4. **Verbatim merged PR `#2670` write protocol (`M4`):**
   Server-side secret updates use `resolveSecretFieldSubmission` (`packages/fresh-ui/src/runtime/secret-field/secret-field.utils.ts:77-96,112-163` on `origin/main`), returning the 5-arm discriminated union `SecretFieldSubmission`:
   - `{ mode: 'keep' }` — preserve existing stored secret (when stored exists)
   - `{ mode: 'replace'; value: string }` — reject if `value` contains `REDACTED_SECRET_SENTINEL` (`SECRET_SENTINEL_ECHO_REJECTED`) or is empty
   - `{ mode: 'clear' }` — intentional deletion ONLY when `SECRET_FIELD_CLEAR_TOKEN` (`'__ns_secret_clear__'`) or explicit `action: 'clear'` is submitted
   - `{ mode: 'unset' }` — preserve absence (`null`) when no stored secret existed; conflicts (`invalid`) if `hadStoredSecret: true`
   - `{ mode: 'invalid'; reason: string }` — fail closed on conflicting `(action, value)` pairs, unknown actions, or `File` entries.
   Raw strings and raw `null` shortcuts are **explicitly rejected** by JSON/RPC adapters (`SECRET_WRITE_PROTOCOL_REQUIRED`) so missing/null fields never silently overwrite or wipe credentials.

#### 6.2 P5 Deny-by-Default Procedure Gateway, Real `workersContract` Grants (`B4`), & SDK Attribution (`N3`)

Browser UIs call host-mounted gateway endpoints (`/api/plugins/<mountId>/<procedureId>`), never direct internal plugin service URLs or browser-forwarded credentials:

- **Host-approved `(procedureId, owningService, (principal, resource) policy, typed parameter binding)` grants (`B4`):**
  A gateway route grant is NOT merely a bare procedure name. Each host-approved grant specifies:
  1. `procedureId` + verified `owningService` (e.g., `'getJob'`, `'triggerJob'` on `'workers'`).
  2. **Server-side authorization seam:** Uses [`compileProcedures`](../packages/service/src/auth/contract/contract-procedure-index.ts#L76-L85) + [`authorizeProcedurePolicy`](../packages/service/src/auth/contract/procedure-policy-decision.ts#L12-L24) when a procedure declares `meta.access`, AND **binds a published `@netscript/service/auth` authorizer** (`createContractAuthorizer(contract, { fallback: createScopeAuthorizer(...) })` at [`contract-authorizer.ts`](../packages/service/src/auth/contract/contract-authorizer.ts#L67-L141)) for contracts whose procedures carry empty `meta.access` — **explicitly true of real [`workersContract`](../packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts#L72-L97,L459-L487)** (`getJob`, `triggerJob`), where `compileProcedures` returns `policy: undefined`!
  3. **Host `(principal, resource)` ownership policy:** Evaluated BEFORE any upstream call or credential minting (proving in Probe C `2.2b` that an authorized `job-alpha` succeeds while unauthorized `job-beta` fails `403` with **0 upstream hits**).
  4. **Typed parameter & allowlisted query binding:** Parameterized REST patterns like `/jobs/:id` or `/jobs/:id/trigger` MUST validate params through a typed `pathParamsSchema` and bind encoded segments (`/jobs/${encodeURIComponent(id)}`) — **never issuing upstream requests to raw router pattern strings like `/jobs/:id`**. Query parameters are forwarded ONLY when explicitly named in `allowedQueryParams` (never blind-copying arbitrary `incomingUrl.searchParams`).
  5. **Scoped credential callback:** `getServerUpstreamAuth({ principal, procedureId, owningService, resource })` receives caller, procedure, service, and resource context — never a zero-argument global secret callback.
- **Narrowed SDK client metadata statement (`N3`):**
  [`stable-v1-adapter.ts#L64-L104`](../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L104) (`normalizeProcedureMeta`) extracts only `access.authentication` and `policy.cache` for **SDK client transport metadata**, dropping `access.authorization` and `access.audience` (which is separate from server authorization in `compileProcedures` / `createContractAuthorizer` and does not establish a shipped server fail-open). W2 fixes `stable-v1-adapter.ts` to preserve `authorization` and `audience` cleanly, and rejects `audience: 'internal'` procedures at gateway generation time.
- **Operational controls & status codes (`N3`, Probe C `2.2`–`2.3`):**
  Note that [`NetScriptProcedureMeta`](../packages/contracts/src/domain/procedure-meta.ts#L45-L68) does **not** declare rate, byte, or timeout limits; those are host gateway configuration defaults enforced at the gateway edge:
  - Unknown procedures / ungranted procedures -> `404`; wrong method -> `405`; encoded traversal / invalid typed params -> `400`.
  - Mutating requests enforce CSRF `Origin` + `Sec-Fetch-Site` + `Sec-Fetch-Dest` checks (`403`).
  - Browser `Cookie` and `Authorization` are never forwarded upstream.
  - Upstream fetches use `redirect: 'manual'` (3xx returns `502` with no `Location`), request body overflow returns **`413`**, upstream response overflow returns **`502`**, upstream timeout returns **`504`**, end-to-end `AbortSignal` propagates cancellation, and dynamic `Connection` hop-by-hop + response-header allowlisting strip upstream cookies/ACAO/internal headers.

#### 6.3 Three-Lane Transport Boundary — HTTP-Only W2 Cut (`B5`, `F-4` Option B)

NetScript strictly separates transports and **keeps the `0.0.10` W2 gateway HTTP-only**:

| Transport Lane | Protocol & `0.0.10` Status | Examples | Boundary & Acceptance Gate |
| --- | --- | --- | --- |
| **Lane 1: Ordinary HTTP Procedure Gateway (`0.0.10` W2)** | `@orpc/contract` unary HTTP RPC compiled + authorized via `compileProcedures` / `createContractAuthorizer` + P5 HTTP gateway | `workersContract.getJob`, `workersContract.triggerJob`, CRUD mutations | **Included in W2.** `eventIterator` procedures (e.g. `workersContract.subscribe`) are **excluded (`GATEWAY_EVENT_ITERATOR_DEFERRED_W2`)** in W2 (`F-4` Option B) until incremental first-frame delivery + abort/reconnect under real auth policy is proved! |
| **Lane 2: Authorizing Durable Streams Proxy (`RFC 0009` dependency)** | [`RFC 0009`](./0009-authorizing-stream-proxy.md): `@netscript/contracts/streams` + `@netscript/plugin-streams-core/proxy` (`createNetScriptStreamProxy`) + `@netscript/fresh/streams` (`createNetScriptStreamEventSourceV1`) | Replayable job execution logs, pipeline event feeds, `?offset=` cursor resume | **Depends explicitly on `RFC 0009` implementation landing** (`packages/plugin-streams-core/deno.json:6-14` does not export `./proxy` at baseline). Stream endpoints stay outside oRPC procedure maps (`rfcs/0009:623-631`) and require `RFC 0009`'s `invalidationEpoch` post-await fence, clock expiry fence, pre-drain `shutdownSignal`, and atomic `highWaterMark: 0` pull-driven enqueue (`:1494-1547`). |
| **Lane 3: Interactive AI Chat Stream** | `@netscript/fresh/ai` (`createNetScriptChatStreamProxy`) | Interactive assistant chat panels (`#943`, post-`0.0.10`) | Specialized TanStack AI wire framing separate from CRUD RPC and Durable Streams |

---

### 7. Runtime Plugin Catalog & Decoupled Health Model (`M4`)

Host applications and ops consoles query `FrontendPluginCatalog` (`@netscript/plugin-frontend-core` interface implemented in `@netscript/fresh/plugins`). Following downstream workflow console catalog requirements (`acme`), the catalog is keyed **by plugin installation** (`installationId`) and keeps version observation, runtime health, quarantine state, update availability, and doctor freshness **strictly independent** (so an installed plugin with zero UI, an unobserved running plugin, or an unhealthy plugin with an available update are all cleanly representable):

```ts
export type PluginHealthStatus = 'Healthy' | 'Degraded' | 'Unhealthy' | 'Unverified';

export interface FrontendPluginCatalogEntry {
  readonly identity: ContributionIdentity; // plugin-keyed (`installationId` / `mountId`)
  readonly displayName: string;
  readonly linkedVersion: string;
  readonly observedVersion: string | null; // explicit null when live process is unobserved
  readonly health: {
    readonly status: PluginHealthStatus;
    readonly observedAt: string;
    readonly message?: string;
    readonly lastKnown?: { readonly status: PluginHealthStatus; readonly observedAt: string };
  };
  readonly quarantine: {
    readonly quarantined: boolean;
    readonly diagnosisStates: readonly ContributionDiagnosisState[];
    readonly quarantinedContributionIds: readonly string[];
  };
  readonly updateAvailable: {
    readonly available: boolean;
    readonly targetVersion?: string;
  };
  readonly freshness: {
    readonly doctorCheckedAt: string | null;
    readonly stale: boolean;
    readonly source: 'runtime' | 'doctor' | 'cached';
  };
  readonly contributions: readonly string[]; // `<mountId>/<id>/v<apiMajor>` (may be empty!)
  readonly zones: readonly string[];
}

export interface FrontendPluginCatalog {
  list(): readonly FrontendPluginCatalogEntry[];
  getByInstallation(installationId: string): FrontendPluginCatalogEntry | undefined;
  forZone(zoneId: string): readonly FrontendPluginCatalogEntry[];
}
```

When a runtime probe times out or no live observation exists, `observedVersion` stays `null` and `health.status` reports `'Unverified'` while `lastKnown` retains the prior verified snapshot — never fabricating `'Healthy'` from missing checks.

---

### 8. CLI Integration, `#2582` Multi-App Reuse, & Scaffold Gates (`M6`, `N2`)

- **Reuse `#2582` multi-app targeting:** [`resolvePluginAppReferences`](../packages/cli/src/public/features/plugins/install/plugin-app-references.ts#L10-L30) reads `NetScript.Apps` (`Enabled !== false && (Type ?? 'app') === 'app'`) and `linking.consumers.apps`, returning **one or multiple** consumer apps while preserving headless installs. `netscript plugin install <kind> --app <name>` ([`install-plugin-command.ts#L26-L35`](../packages/cli/src/public/features/plugins/install/install-plugin-command.ts#L26-L35)), `netscript generate plugins`, and `netscript plugin resource add <plugin> <resource> --app <name>` reuse this port and emit per-app registries cleanly.
- **Upgrade Nov 2026 Scaffold Templates:**
  - [`vite.config.ts.template`](../packages/cli/src/kernel/assets/app/vite.config.ts.template): replace hardcoded `@plugins/*/streams` aliases with `createNetScriptVitePlugin` consuming `.netscript/generated/app/frontend.registry.ts`, package-owned CSS assets, and `islandSpecifiers`.
  - [`client.ts.template`](../packages/cli/src/kernel/assets/app/client.ts.template): split global shell CSS (`@layer ns-plugins, ns-app;` prelude + tokens) from route/component stylesheets (`M5`).
  - [`navigation.ts.template`](../packages/cli/src/kernel/assets/app/navigation.ts.template) & [`router.ts.template`](../packages/cli/src/kernel/assets/app/router.ts.template): merge typed generated plugin `RouteRef` entries alongside `appRoutes` and `appNavigation` using `order ∈ [-100, 100]` (`visibleNavigation()` filtering `developmentOnly` in production).
  - [`_layout.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template) & [`_app.tsx.template`](../packages/cli/src/kernel/assets/app/routes/_app.tsx.template): move `<Partial name="main">` inside `<SidebarShell>`, branch on `ctx.isPartial`, refresh active navigation & `<Breadcrumb>` on partial navigation, and pair `ns-theme` with cross-tab/system theme sync (`window` `'storage'` + `matchMedia`).
  - `dashboard-view.tsx.template` (`packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template`): replace hardcoded `'streams'`/`'workers'` blocks with `<FrontendZone name="app.dashboard.panels/v1" context={...} />`, keeping `CapabilityEmpty` `'installed-unwired'` fallback parity.
- **Preserved `#890` / `05-scaffolding-and-cli.md` Gates (`M6`):**
  - **Starter drift reporting (never overwrite):** App-owned starters copied via `plugin resource add --app` report local edits as drift rather than overwriting (`updateUiRegistryItems` posture in [`ui/registry.ts#L160-L175`](../packages/cli/src/kernel/application/ui/registry.ts#L160-L175)).
  - **Install -> render -> hydrate -> remove E2E gate:** `scaffold.runtime` verifies install -> transactional generate (`deno check` exit `0`) -> boot -> route/zone render -> island hydration -> `plugin remove` leaving valid empty emissions and zero dangling imports.
- **`plugin doctor` & `plugin dev`:**
  - `netscript plugin doctor` replays 6-state diagnostics from `frontend.diagnosis.json` & `devtools.diagnosis.json`, checks `#1473` containment and Vite peer pins (`preact`, `@preact/signals`, `@fresh/plugin-vite`), and flags stale registry entries.
  - `netscript plugin dev` watches linked `plugins/*/frontend` directories, regenerates incrementally, and restarts Vite when `islandSpecifiers` membership changes (`D4`).

---

### 9. Empirical Wave-0 Verification Summary (`N1`, `N2`)

Three reproducible Wave-0 probes under [`.llm/runs/rfc-frontend-contribution-v2--rfc/probes/`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log) verified critical Fresh 2, Vite 7, containment, gateway, and redaction behaviors without mutating `packages/`, `plugins/`, `apps/`, `examples/`, or `deno.lock`:

#### 9.1 Probe A — Fresh 2.3.3 Mount, Portable Loaders, Partials & SSR Containment (`19 / 19 PASS` runtime; `--check` recorded)

Executed via `deno run --no-lock -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a-fresh-mount.ts` ([`probe-a.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a.log)):
- **`deno check --no-lock` visibility (`N1`):** Recorded visibly in `probe-a.log` (`exit=1`, 44 pre-existing `TS2322`/`TS9031` errors on contravariant inline `PageProps<T>` test fixtures), while the new framework-free loader + Fresh adapter (`portable-jobs-loader.ts` + `fresh-jobs-adapter.tsx`) pass `deno check --no-lock` with **`exit=0`**.
- **Runtime results (`19 / 19 PASS`, exit `0`):**
  - `P0.1`, `P1.0`, `P1a`–`P1g`: proved Fresh `2.3.3` `preactOptions.errorBoundaries === undefined`, post-`fsRoutes` wrapper inheritance, `isPartial` chrome elimination (`rawBodyHasShellChrome===false`), `basePath` composition, middleware order (`/*` literal trap), `404` status quirk, co-mount isolation, and `App.#commands` protection via `GuardedPluginApp`.
  - `P2a`–`P2c`: proved literal lazy `import().then(normalizeFreshRouteModule)` (`0 -> 1 -> 1`), CSS injection, structured error rejections, and `middleware -> handler -> page(data) -> pure page`.
  - **`P2d` (`B7` proof):** proved `portable-jobs-loader.ts` (zero `fresh`/`preact`/`RouteConfig`/`isPartial` imports; standalone `deno check` exit `0`) executes identically across **both** a GPUIX-shaped `RouteModule` (with Fresh adapter load count `0`, never resolving Fresh view code) **and** Fresh 2 `normalizeFreshRouteModule` (full + `?fresh-partial=true` + `302` redirect).
  - `P4a`–`P4e`: proved pre-render `Promise.all` containment (`P4a`), sync JSX throw returning HTTP 500 under Fresh defaults (`P4b`), nested async child rendering empty `<div>` + leaking `unhandledrejection` (`P4c`), `_error` isolation config (`P4d`), and dynamic package inspection reporting `@fresh/core` `2.3.3` and `preact-render-to-string` **`6.8.3`** under `--no-lock` vs `6.8.0` in `deno.lock` (`P4e`, `N1`).

#### 9.2 Probe B — Vite 7.2.2, `@fresh/plugin-vite@1.1.2`, Islands & CSS (`19 Matrix Rows: 11 PASS, 5 CAVEAT, 3 FAIL`, Exit `0`)

Executed via `deno run --no-lock --check -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-b-vite-islands-css.ts` ([`probe-b.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-b.log); Chromium CDP + isolated `/tmp` staging; zero build artifacts left behind):

- **Exact accounting (`N1`):** **19 matrix rows total — 11 PASS (`P1`–`P4`, `C1`, `M4`, `M5`, `D1`–`D3`, `D5`), 5 CAVEAT (`C2`, `M1`, `M3`, `M6`, `D4`), 3 FAIL (expected pitfalls `C3`, `C4`, `M2`)**. Exit code `0` indicates probe completion including expected failures.
- **Measured findings & caveats (`N1`, `N2`, `M5`, `B8`):**
  - `P1`–`P4`: 1 Preact chunk, 1 `@preact/signals` chunk (using fixture-only `hostFreshSignalsPin` at `vite.config.ts:29-47` in `--no-lock` builds), `optSize === 1`, shared signal sync `10 -> 11 -> 12`, `#2655` plugin edit rotating only the plugin island chunk.
  - `C1`–`C4`: bloated global `84,788 B` -> split Tailwind shell `40,298 B` -> minimal `169 B` -> bare prelude `26 B`; `@layer ns-plugins, ns-app;` restores app green `rgb(22, 163, 74)` over plugin red `rgb(220, 38, 38)` (`C2`); `C3` asserts non-zero Vite exit on `?url` CSS; `C4` asserts shared SSR CSS `ENOENT`; **mounted-route CSS test used `/mounted-explicit.css` in fixture host `static/` (`M5`), confirming why production plugins must emit package-owned CSS assets**.
  - `M1`–`M6` & `D1`–`D5`: root JSX requirement (`M1`), offline fetch fail (`M2`), `@deno/loader@0.4.0` online download ignoring `--cached-only` (`M3`), pre-cached HTTP remote islands passing prod/dev (`M4`/`M5`), `--configLoader native` signals split on `^2.11.0` (`M6`), `islandSpecByName.clear()` on dev `fsRoute` add/unlink (`D4`).
  - **Scope limitations (`B8`):** Probe B uses localhost HTTP mocks + one Fresh app root (`pageModuleRouteBinding: false`), so it does **not** prove clean-cache published JSR matrix (`#925`/`#1469`) or two route roots contending for `.generated/` in one Vite process (`#1470`).

#### 9.3 Probe C — Spine, Containment, Real `workersContract` Gateway, & Presence-Only Redaction (`13 / 13 PASS`, `--check` Exit `0`)

Executed via `deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-c-manifest-gateway-redaction.ts` ([`probe-c.log`](../.llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-c.log)):

| Case | Outcome | What Was Proved Against Real & Updated Contracts |
| --- | --- | --- |
| `1.1`–`1.2` | **PASS** | Real `parsePluginManifest` (`.strict()`) rejects `"frontend"`; `.passthrough()` (`schemaVersion: 1`) parses cleanly while `FrontendPointerSchema` accepts `{ export: './frontend', framework: 'fresh' }` ONLY (rejecting extra unamended guide keys) |
| `1.3` | **PASS** | Physical containment anchored to trusted `Deno.realPath(projectRoot)` / `packageRoot`; rejects `../`, `\`, `\0`, `/etc`, UNC, `%2e%2e`, symlinks below AND **above** `.netscript/generated/`, broken/dangling symlinks (failing closed), and `.staging/` escapes (`B6`) |
| `1.4`–`1.5` | **PASS** | RFC 0005 wire schema (`FamilyRef`, `ContributionEnvelope`, host-assigned `ContributionIdentity`), mixed-family `[app, devtools]` export, **2 installations of 1 package without collision**, exact zone matching, `anchors[]` capacity winners, out-of-range `order` error, 4 distinct zone diagnosis errors, and host-owned `devtools` exclude vs `app` fail-install (`B1`, `B2`) |
| `2.1`–`2.3`, `2.2b` | **PASS** | Real `authContract` + **real `workersContract` (`getJob`, `triggerJob` with `policy: undefined`)** via `@netscript/service/auth` `createContractAuthorizer` + `createScopeAuthorizer` + `(principal, resource)` ownership + typed path/query param binding (`job-alpha` -> `200`, `job-beta` -> `403` with `0` upstream hits, ungranted `deleteJob` -> `404`, `../admin` -> `400`), CSRF, `redirect: 'manual'`, `413` req / `502` res / `504` timeout, and `stable-v1-adapter.ts` client metadata check (`B4`, `N3`) |
| `2.4`–`2.5` | **PASS** | **Probe-local SSE proxy prototype** (explicitly NOT `RFC 0009` runtime export and NOT stale-allow race/idle-expiry/pre-drain shutdown proof) demonstrates offset resume & pre-batch withholding on `DurableStreamTestServer`; oRPC `compileProcedures` excludes stream contracts while W2 HTTP-only gateway excludes `eventIterator` procedures (`workersContract.subscribe`, `SYNTHETIC_CRONS_CONTRACT.tailEvents`) (`B5`) |
| `3.1`–`3.2` | **PASS** | Presence-only `RedactedSecretHandle` (`sentinel` + `isSet`, **zero SHA-256 digests/fingerprints**), recursive object/array/record + `z.toJSONSchema` redaction covering non-sensitive `notes`, **real Fresh 2.3.3 `App` + `ProdBuildCache` island SSR & `?fresh-partial=true` serialization**, non-allowlisted handle rejection, and verbatim merged `#2670` `resolveSecretFieldSubmission` (`replace | keep | clear | unset | invalid`) rejecting raw `null`/string shortcuts (`B3`, `M4`) |

---

### 10. `0.0.10` First Usable Seams Cut vs Follow-on Waves (`B5`, `B8`, `M6`)

Sized for **Neon builders** (`antigravity/gemini-4-neon` `xhigh`) + **Opus 5.5 `xhigh` Pass-1 / Hydrogen `xhigh` Pass-2 PR review**, with `W3a` strictly preceding `W3b` to break the `#933` <-> `#940` import cycle:

| Wave / Cluster | Scope | Issues Touched | Merge-Ready Exit Proof |
| --- | --- | --- | --- |
| **W1 (`0.0.10`): Preconditions & Shared Core** | 1. `#1474` manifest `.passthrough()` (`schemaVersion: 1`) + `#1473` root-anchored lexical/physical path containment + scoped generator subprocesses (`installed-runtime-registry-generator.ts`, `ui/registry.ts`).<br>2. Shared RFC 0005 spine (`FamilyRef`, `ContributionEnvelope`, host-assigned `ContributionIdentity`, `anchors[]`, `orderContributions()`, 6-state diagnosis, host-owned policy) + `app`-family typed zones, `descriptor` + `x-ns-ui`, presence-only `RedactedSecretHandle`, `#2670` `SecretFieldSubmission`, decoupled `FrontendPluginCatalog`, `PortableRouteDataContext` (`F-1` ownership resolved via fork).<br>3. `@netscript/plugin` `.withFrontend({ export, framework: 'fresh' })` pointer (`#929`) — zero `AstExtractor`. | `#1474`, `#1473`, `#928`, `#929`, `#1471` alignment | `deno task check`, `deno task arch:check`, `deno doc --lint`, all `#1471` + `#1473` (`G-1`/`G-2`/`G-10`) + `#1474` unit gates |
| **W2 (`0.0.10`): Separate Emitters, Fresh 2 Adapter, Templates, & HTTP-Only P5 Gateway** | 1. Shared transactional generator emitting **separate** `app` and `devtools` projections + `plugin doctor` 6-state checks + `INV-4` dual production absence.<br>2. `@netscript/fresh/plugins`: allowlisted `GuardedPluginApp` facade, post-`fsRoutes` hook on `defineFreshApp`, `normalizeFreshRouteModule`, `<FrontendZone>`, pre-render `Promise.allSettled` + deadline, post-hydration client `ErrorBoundary`, recursive redaction + outbound boundary validation, `sse.ts` export, decoupled `FrontendPluginCatalog`.<br>3. `@netscript/fresh/vite` `appRoot`-relative signals resolution + package-owned route CSS URLs + `client.ts.template` CSS split + `@layer ns-plugins, ns-app;` + `<Partial name="main">` + nav/breadcrumb refresh + cross-tab/system theme sync + `dashboard-view.tsx.template` zone migration.<br>4. Fix `stable-v1-adapter.ts` client metadata + **HTTP-only** P5 gateway (`createContractAuthorizer` + `(principal, resource)` + typed param binding; `eventIterator` deferred). | `#930`, `#1475`, `#937`, `#1476`, `#931`, `#932`, `#934`, `#938` (core states) | Fresh 2 runtime + Playwright CDP (`full -> partial -> back`, breadcrumb/nav, no FOUC, cross-tab/system theme, post-hydration EB), P5 HTTP + `workersContract` authz suite, `INV-4` prod-absence E2E; `#1470` 2-route-root check |
| **W3a (`0.0.10`): Independent Test Suite (`#940`)** | Ship `defineFrontendTestSuite` (schema, containment, redaction, SSR/hydration, failing-budget control, a11y, basePath) using an **independent synthetic fixture plugin** with **zero import of `plugins/workers`**. *(Final `#940` Workers acceptance receipt arrives in W3b, keeping `#940` open until W3b passes.)* | `#940` (remains open through W3b) | Independent fixture passes + intentional **failing-budget control** fails as expected + `assertNoUnredactedSecrets` gate |
| **W3b (`0.0.10`): Workers Dogfood & Resource Seam (`#933`, `#939`)** | Migrate `@netscript/plugin-workers` onto portable `./loaders/jobs.ts` + Fresh `./routes/jobs.tsx` + `app.dashboard.panels/v1` `zone` + `descriptor` + island + `workersContract` P5 HTTP grant + `defineFrontendTestSuite` (**completing `#940`'s Workers CI green receipt and `#933`**); ship `#939` `AppTarget` / `plugin resource add --app` (`#2582` multi-app, starter drift reporting, typed route-ref merge, coordinating with `#432` DevTools caller); ship `plugin dev` (`#936`) with Vite restart on `islandSpecifiers` diff. *(Note: `#936`/`#939` are explicitly off `rfcs/0002` A7's critical path.)* | `#933`, `#940` (closes on W3b CI green), `#939`, `#936`, unblocks `#1520`/`#1521` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (`install -> render -> hydrate -> remove`) + Workers browser & authz CI green + clean-cache published-JSR staging check |
| **Follow-on (`0.0.11` / Backlog)** | DevTools `panel` (`#427`)/`link`/`diagnostic` (`#1469`–`#1472`), `eventIterator` RPC streaming (only after incremental first-frame + abort/reconnect proof under auth), `RFC 0009` revocable stream proxy integration (`#927` closure gate), `auth`/`ai`/`sagas`/`triggers`/`streams` UI packs (`#942`–`#945`), `plugin new --with frontend` & conventions (`#935`, `#941`, `#946`), GPUIX (`rfcs/0007`) & Fresh 3.x adapters. | `#1469`–`#1472`, `#927`, `#935`, `#941`–`#946`, `#427`, `#432` | Tracked per theme milestone |

---

### 11. Complete Issue Supersession & Board Reconciliation Map (`B8`, `M6`)

*(Documentation record only — existing GitHub issues and milestones remain untouched until owner acceptance/triage. **RFC acceptance alone does NOT close any issue.**)*

#### 11.1 Superseded Seed & Frontend Contribution Issues (`#922`–`#946`, PR `#890`)

| Ref | Live Title | Current Status / MS | Unified RFC Disposition & Honest Proof Status |
| --- | --- | --- | --- |
| PR `#890` | RFC: Frontend Contribution Layer — plugins that ship UI (dashboard · auth · ai · deploy) | `MERGED` (seed docs only) | **Superseded** by this RFC (`@layer` order fixed, zero-Fresh contracts, RFC 0005 spine unification, 6-state taxonomy, `descriptor` + presence-only redaction, separated portable loaders) |
| `#922` | Epic: Frontend contribution layer — plugins that ship UI | `OPEN` / `Frontend Contribution` | **Canonical Tracking Epic** — retarget scope to `0.0.10` First Usable Seams + Follow-on waves |
| `#923` | `[frontend-contrib S1] P1 proof: mounted sub-app command ordering` | `OPEN` / `Frontend Contribution` | **Partial proof (Probe A `P1` suite) — stays OPEN** until W2 `GuardedPluginApp` + `defineFreshApp` product tests pass |
| `#924` | `[frontend-contrib S2] P2 proof: literal lazy route loaders + normalizeFreshRouteModule` | `OPEN` / `Frontend Contribution` | **Partial proof (Probe A `P2a`–`P2d`) — stays OPEN** until W2 adapter product tests pass |
| `#925` | `[frontend-contrib S3] P3 proof: dependency-island build matrix + plugin-vite pin policy` | `OPEN` / `Frontend Contribution` | **Partial proof (Probe B localhost HTTP aliases) — stays OPEN**; clean-cache published-JSR matrix remains unverified until staging/JSR gate |
| `#926` | `[frontend-contrib S4] P4 proof: SSR failure-containment fixtures` | `OPEN` / `Frontend Contribution` | **Partial proof (Probe A `P4a`–`P4e`) — stays OPEN** until W2 deadline + post-hydration EB product tests pass |
| `#927` | `[frontend-contrib S5] P5 proof: gateway threat model + streaming abort` | `OPEN` / `Frontend Contribution` | **Partial proof (Probe C HTTP + `workersContract` authz) — stays OPEN**; `eventIterator` incremental delivery/abort unproved (`F-4` Option B) and `RFC 0009` implementation (`packages/plugin-streams-core/proxy`) not yet landed |
| `#928` | `[frontend-contrib S6] @netscript/plugin-frontend-core contracts/v1` | `OPEN` / `Frontend Contribution` | **`0.0.10` W1** — canonical RFC 0005 spine + `app` contracts (`F-1` fork) |
| `#929` | `[frontend-contrib S7] @netscript/plugin pointer axis (.withFrontend)` | `OPEN` / `Frontend Contribution` | **`0.0.10` W1** — `{ export, framework: 'fresh' }` pointer, zero `AstExtractor` |
| `#930` | `[frontend-contrib S8] Frontend registry emissions: transactional replace-set` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — shares transactional core with `#1475`, emitting separate `app` & `devtools` projections |
| `#931` | `[frontend-contrib S9] @netscript/fresh/plugins host runtime` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — allowlisted `GuardedPluginApp`, post-`fsRoutes` hook, `<FrontendZone>`, redaction, catalog |
| `#932` | `[frontend-contrib S10] Scaffold template wiring + HostSurfaceDescriptor + vite feed` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — `<Partial name="main">`, nav/breadcrumb refresh, `client.ts` CSS split, `@layer ns-plugins, ns-app;`, cross-tab/system theme sync, package CSS URLs, `dashboard-view.tsx` zone |
| `#933` | `[frontend-contrib S11] Workers dogfood: zone panel + console route + island` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** — strictly after W3a (`#940`) and provides `#940`'s Workers CI green receipt |
| `#934` | `[frontend-contrib S12] Generated deny-by-default procedure gateway` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — HTTP-only gateway (`createContractAuthorizer` + `(principal, resource)` + typed param binding) + `stable-v1-adapter.ts` fix |
| `#935` | `[frontend-contrib S13] plugin new --with frontend` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Backlog)** |
| `#936` | `[frontend-contrib S14] netscript plugin dev (frontend watch loop)` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** (or follow-on; **excluded from `rfcs/0002` A7 critical path**) |
| `#937` | `[frontend-contrib S15] Doctor frontend check + five-state taxonomy` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** — upgraded to 6-state taxonomy alongside `#1476` |
| `#938` | `[frontend-contrib S16] Quarantine render states + provenance chrome` | `OPEN` / `Frontend Contribution` | **`0.0.10` W2** (quarantine fallback & runtime provenance) + polish in follow-on |
| `#939` | `[frontend-contrib S17] AppTarget scaffolder seam + plugin resource add --app` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3b** — `#2582` multi-app, starter drift reporting, typed route-ref merging; shares scaffolder with `#432` (**excluded from `rfcs/0002` A7 critical path**) |
| `#940` | `[frontend-contrib S18] defineFrontendTestSuite + budgets enforcement` | `OPEN` / `Frontend Contribution` | **`0.0.10` W3a** (independent fixture + failing-budget control; **stays open until W3b `#933` Workers CI receipt passes**) |
| `#941` | `[frontend-contrib S19] generate frontend-wiring adoption verb` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Backlog)** |
| `#942` | `[frontend-contrib S20] Auth v1 frontend` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#943` | `[frontend-contrib S21] AI frontend` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#944` | `[frontend-contrib S22] Sagas/triggers/streams dashboard-zone panels` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11`)** |
| `#945` | `[frontend-contrib S23] auth-org backend capability` | `OPEN` / `Frontend Contribution` | **Follow-on (`0.0.11` / Auth)** |
| `#946` | `[frontend-contrib S24] Convention generator (generate frontend)` | `OPEN` / `Frontend Contribution` | **Follow-on (`Backlog / Triage`)** |

#### 11.2 DevTools `RFC 0005`, Adjacent Epics, & Mis-Milestoned Issues (`B8`, `M6`, `F-5`)

| Ref | Live Title | Current Status / MS | Unified RFC Disposition |
| --- | --- | --- | --- |
| `#1465` | RFC: NetScript DevTools contribution architecture | `CLOSED` / `0.0.6` | **Accepted `RFC 0005`** — canonical spine unified cleanly; `F-1` preserves ownership or amends explicitly |
| `#1469` | `[devtools W0a] probe packaged island specifiers under Deno resolution` | `OPEN` / `DevTools & Dashboard` | **Partial (Probe B localhost aliases) — stays OPEN** until published-JSR clean-cache verification passes |
| `#1470` | `[devtools W0b] probe a second route/island root in one Vite process` | `OPEN` / `DevTools & Dashboard` | **OPEN — NOT satisfied by Probe B** (Probe B ran 1 Fresh app root with `pageModuleRouteBinding: false`; requires 2 route roots contending for `.generated/` in one Vite process) |
| `#1471` | `[devtools W1a] add contracts/v1, deterministic ordering, and architecture roots` | `OPEN` / `DevTools & Dashboard` | **Canonical spine & `#1471` gate anchor** (ordered `anchors[]`, out-of-range error, 6-state checks, `arch:check` roots; `F-1` alignment) |
| `#1472` | `[devtools W1b] add typed deep-link resolution` | `OPEN` / `DevTools & Dashboard` | **Follow-on (`DevTools`)** |
| `#1473` | `[devtools W1c] enforce path containment and scoped generator subprocesses` | `OPEN` / `DevTools & Dashboard` (`p0`) | **Pulled into `0.0.10` W1** hard precondition (`G-1`, `G-2`, `G-10`) |
| `#1474` | `[devtools W1d] make plugin manifests forward-compatible before pointer fields` | `OPEN` / `DevTools & Dashboard` (`p0`) | **Pulled into `0.0.10` W1** hard precondition (`.passthrough()` on `schemaVersion: 1`) |
| `#1475` | `[devtools W2a] generate the contribution registry transactionally` | `OPEN` / `DevTools & Dashboard` | **Unified into `0.0.10` W2** shared generator core emitting separate `devtools` projection (`INV-4`) |
| `#1476` | `[devtools W2b] diagnose the six contribution states in plugin doctor` | `OPEN` / `DevTools & Dashboard` | **Unified into `0.0.10` W2** (with `#937`) |
| `#400` | Epic: NetScript DevTools contribution and host architecture | `OPEN` / `Backlog / Triage` | DevTools host epic consuming shared `0.0.10` W1/W2 spine |
| `#427` | `[dashboard DDX-17] DashboardPanelContribution seam (.withDashboardPanel)` | `OPEN` / `DevTools & Dashboard` | **Remains DevTools `panel`-kind slice (`W4-a`, [`FILING-LOG.md`](../.llm/runs/plan-devtools-contribution--seed/filing/FILING-LOG.md#L36))** sharing the `RFC 0005` spine (not erased as "absorbed") |
| `#432` | `[dashboard DDX-19] Codegen-from-UI Add-resource action` | `OPEN` / `DevTools & Dashboard` | **Remains DevTools dashboard caller** of the shared `#939` `AppTarget` scaffolder ([`supersession-map.md`](../.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md#L117)) |
| `#1520` | `[runtime-automation A7] production/admin automation console` | `OPEN` / `Runtime Automation` | **Consumer of `0.0.10` W1–W2 + `#934` (`#923–#932 + #934`, extending `#933`)** per [`rfcs/0002:513-522,678-679`](./0002-runtime-versioned-automation.md#L513-L522); **NOT gated on `#936`/`#939`** |
| `#1521` | `[runtime-automation A8] §13 E2E acceptance suite` | `OPEN` / `Runtime Automation` | Remains in `Runtime Automation`; exercises `A7` only for cockpit journeys |
| `#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568` | 6 `Frontend Contribution` (`ms #24`) issues outside `#922` (`#2568` unlabeled; `#2531` has `area:fresh-ui` without `epic:design-system`) | `OPEN` / `Frontend Contribution` | **Fork `F-5`:** Owner-led reassignment to each issue's owning theme unless `0.0.10` release scope is explicitly agreed |

---

## Drawbacks

1. **Separating portable `./loaders/...` from Fresh `./routes/...` adds one extra file per route.** Plugin routes cannot import `fresh` or `isPartial` inside data-loading logic (`P2d`). This is a small price for genuine GPUIX (`rfcs/0007`) and future Fresh 3 portability.
2. **Pre-render data-phase containment does not isolate synchronous JSX throws (`P4b`, `P4c`).** Under Fresh `2.3.3`, sync JSX throws still abort the page and nested async child JSX leaks `unhandledrejection`; zone JSX must stay pure until Fresh/Preact SSR boundaries change.
3. **Vite 7.2.2 + `@fresh/plugin-vite@1.1.2` constraints remain strict until Fresh 3.** Pinning `vite@7.2.2`, `@fresh/plugin-vite@1.1.2`, and exact `@preact/signals@2.11.3` disallows semver signal skew (`M6`), forbids `?url` CSS (`C3`) and shared SSR CSS chunks (`C4`), and retains the `plugin dev` restart workaround on `islandSpecifiers` changes (`D4`).
4. **Pulling `#1473` and `#1474` into `0.0.10` W1 and deferring `eventIterator` (`F-4` Option B) prioritizes security and soundness over early streaming DX.**

---

## Rationale and alternatives

- **Why keep RFC 0005's exact wire schema, ordering, diagnosis, and host-owned policy instead of inventing a simplified `frontend` envelope?**
  Replacing `{ family, major }` / `mountId` / `anchors[]` with `{ id, version }` / `packageName#localId` would silently break multi-instance plugin installs, break accepted `RFC 0005` contracts, and split CLI generators. Unifying onto the exact RFC 0005 spine preserves one validated contract across `app` and `devtools` while keeping generated production and DevTools graphs structurally isolated (`INV-4`).
- **Why presence-only `RedactedSecretHandle` + `#2670` `resolveSecretFieldSubmission` instead of digests + raw null/string shortcuts?**
  Browser-visible SHA-256 digests create equality and offline-guessing oracles, and raw `null`/string shortcuts risk accidental credential wipes or sentinel overwrites. Presence-only handles + explicit 5-mode submission matching `#2670` prevent both failure classes.
- **Why HTTP-only W2 (`F-4` Option B) and explicit `createContractAuthorizer` + `(principal, resource)` policy for Workers (`B4`)?**
  Probe C proved real `workersContract` procedures declare empty `meta.access` (`policy: undefined`) and parameterized paths (`/jobs/:id`), and that `eventIterator` incremental delivery/abort under auth has not yet been proved end-to-end. Shipping verified HTTP + typed param binding + resource authorization in W2 while gating `eventIterator` and `RFC 0009` on real proofs prevents shipping unverified security seams.
- **Alternative considered: AST-scraping contribution discovery (`AstExtractor`).** Rejected for regex fragility and permission bypasses.

---

## Breaking changes and migration

1. **Manifest schema `.strict()` -> `.passthrough()` (`#1474`):** Non-breaking additive change keeping `schemaVersion: 1`; existing plugin manifests remain 100% valid.
2. **Scaffold templates (`_layout.tsx`, `_app.tsx`, `client.ts`, `vite.config.ts`, `dashboard-view.tsx`, CSS prelude):** Affects **newly generated apps** cleanly and provides explicit non-destructive upgrade steps (`@layer ns-plugins, ns-app;`, `<Partial name="main">` + `ctx.isPartial` + active nav/breadcrumb sync, cross-tab/system theme sync, `<FrontendZone>`) for existing downstream apps (e.g., `acme`).
3. **`createStableV1ProcedureMetadataPort()` (`stable-v1-adapter.ts`):** Preserves `access.authorization` and `access.audience` in SDK client transport metadata, removing the silent metadata drop in [`stable-v1-adapter.ts#L64-L104`](../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L104).
4. **PR `#890` seed retirement:** PR `#890` only merged seed artifacts in `.llm/runs/plan-frontend-contrib--seed/` and shipped zero product code; superseding it breaks zero released APIs, while `#427` and `#432` remain cleanly preserved in the DevTools lane.

---

## Prior art

- [`rfcs/0005-devtools-contribution.md`](./0005-devtools-contribution.md) — Canonical `FamilyRef`, `ContributionEnvelope`, host-assigned `ContributionIdentity`, `anchors[]`, `.passthrough()` manifest evolution, root-anchored containment (`INV-1`/`INV-2`), dual production exclusion (`INV-4`), and 6-state diagnosis taxonomy.
- [`rfcs/0007-gpuix-native-desktop-renderer.md`](./0007-gpuix-native-desktop-renderer.md) & [`.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts`](../.llm/runs/rfc-gpuix-desktop--rfc/poc/app/client/router.ts) — Portable `RouteContext -> HandlerResult<T>` contract and GPUIX separation from HTML/CSS views.
- [`rfcs/0009-authorizing-stream-proxy.md`](./0009-authorizing-stream-proxy.md) — Authorizing Durable Streams proxy (`invalidationEpoch` post-await fence, clock expiry fence, atomic pull-driven enqueue).
- [`rfcs/0002-runtime-versioned-automation.md`](./0002-runtime-versioned-automation.md) — `A7`/`A8` automation console consumer dependency cut (`#923–#932 + #934`).
- [`.llm/runs/plan-frontend-contrib--seed/rfc.md`](../.llm/runs/plan-frontend-contrib--seed/rfc.md) — Superseded PR `#890` seed design and [`05-scaffolding-and-cli.md`](../.llm/runs/plan-frontend-contrib--seed/design/canonical/05-scaffolding-and-cli.md) gates.
- Merged NetScript PR [`#2670`](https://github.com/rickylabs/netscript/pull/2670) & downstream consumer patterns (`acme` reference scenarios) — Production requirements and shipped `resolveSecretFieldSubmission` protocol.

---

## Unresolved questions

Owner decision forks remaining after `openrouter/openai/gpt-6.2-astra#xhigh` Pass-1 review (each updated with reviewer-aligned options and defaults):

| Fork ID | Question | Options | Recommended Default |
| --- | --- | --- | --- |
| **F-1** | Spine package ownership (`packages/devtools-core` vs `@netscript/plugin-frontend-core`) | **(A)** `packages/devtools-core` retains canonical RFC 0005 spine ownership (`FamilyRef`, `ContributionEnvelope`, `ContributionIdentity`, `orderContributions`) and `@netscript/plugin-frontend-core` re-exports/consumes it alongside `app` contracts; **(B)** Reopen RFC 0005 F-1 via explicit owner amendment putting shared spine in `@netscript/plugin-frontend-core` + `packages/devtools-core` re-export & compatibility gate | **(A) Preserve `packages/devtools-core` spine ownership + explicit re-exports** (zero RFC 0005 break; choose **(B)** only with explicit owner amendment) |
| **F-2** | Manifest pointer key in `scaffold.plugin.json` | **(A)** One parse-only pointer `{ export, framework: 'fresh' }` whose module exports sibling `ContributionEnvelope[]` (`app` + `devtools`, `rfcs/0005:1074-1081`); **(B)** Dual `"frontend"` and `"devtools"` manifest keys (requires mixed-manifest conflict rules and single effective declaration) | **(A) One pointer `{ export, framework: 'fresh' }` with sibling `ContributionEnvelope[]`** |
| **F-3** | Widget hint namespace & overlay policy | **(B) Strict canonical `x-ns-ui` only** in NetScript framework code (no vendor-key overlay hook; any consumer app with an existing custom key like `x-acme-ui` migrates to `x-ns-ui` or normalizes via an app-side pre-pass); **(A)** Canonical `x-ns-ui` plus a generic host-registered `HostUiHintOverlay` adapter callback with field-level non-weakening merge (`x-ns-ui` wins on display conflicts; overlays can never weaken `secret`, `fixedByPlugin`, `editable: false`, or `overridable: false`) | **(B) Strict canonical `x-ns-ui` only** (zero dual-namespace surface or security-bypass risk in framework code; consumer domain schemas stay authoritative) |
| **F-4** | `0.0.10` W2 gateway transport scope | **(A)** Include oRPC `eventIterator` alongside unary HTTP in W2 (requires incremental first-frame delivery + abort/reconnect proof under real auth); **(B)** **HTTP-only in W2**, promoting `eventIterator` only after real streaming proof lands | **(B) HTTP-only in W2** (defer `eventIterator` until incrementally proved) |
| **F-5** | Disposition of the 6 `Frontend Contribution (#24)` issues outside `#922` (`#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568`) | **(A)** Owner-led reassignment to each issue's owning theme unless `0.0.10` release scope is explicitly agreed (`#2568` currently has no labels; `#2531` has `area:fresh-ui` without `epic:design-system`); **(B)** Leave inside `#24` | **(A) Owner-led theme reassignment** (not automatic `0.0.10` placement) |

---

## Future possibilities

1. **Fresh 3.x Host Adapter (`@netscript/fresh3/plugins`):** Unexercised migration target plugging into Fresh 3 GA (`Vite 8 + Nitro 3 + Preact 11 + renderPage(inner)`) over the unchanged `./loaders/...` and `.netscript/generated/` registry contracts.
2. **GPUIX Native Desktop Renderer (`rfcs/0007`):** Render `descriptor` schemas, `nav` trees, `FrontendPluginCatalog`, and `./loaders/...` (`PortableRouteDataContext -> PortableHandlerResult<T>`) via GPUIX native components using `--ns-*` tokens.
3. **`eventIterator` RPC & `RFC 0009` Revocable Stream Integration:** Promote `eventIterator` procedures once incremental first-frame + abort/reconnect under real authorization passes, and integrate `RFC 0009` once `packages/plugin-streams-core/proxy` ships.
4. **First-party Plugin Packs (`0.0.11`) & Runtime Automation Console (`#1520`, `#1521`):** Auth UI (`#942`), Auth Org console (`#945`), AI durable chat (`#943`), Sagas/Triggers/Streams dashboard zone packs (`#944`), and `#1520`/`#1521` downstream automation console built on `0.0.10` W1–W3.
