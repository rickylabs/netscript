# prior:890-frontend — Re-baseline of RFC PR #890 (Frontend Contribution Layer)

> Stage-B discovery corpus for the DevTools Contribution Architecture RFC.
> Baseline: worktree `/home/codex/repos/ns-rfc-devtools-contribution`, branch
> `plan/devtools-contribution` @ `d5852188b` (seed-run commits only on top of `main` @ `2256a67bf`;
> verified `git log --oneline -3` → `d5852188b chore(harness): commit the stage-B discovery
> workflow before it runs`, `ecae44017`, `ccc4c0a70` — all harness run-dir commits, no source).
> Every claim below carries a repo path, a `gh` read, or a run-doc path. Uncited assertions are
> marked `inference` or `unverified`.

---

## Summary

RFC PR #890 is **merged** (`gh pr view 890 --json state,mergedAt,mergeCommit` → `MERGED`,
`2026-08-03T13:24:44Z`, merge commit `8c418d0ca9d0`), but what it merged is **documentation only**:
the 32-file changeset is `.github/labels.yml` plus the whole
`.llm/runs/plan-frontend-contrib--seed/` record. It contains **zero lines of `packages/`,
`plugins/`, `apps/`, or `docs/` source** (`gh pr view 890 --json files`). #890 therefore ratified a
*design*, not a shipped mechanism.

Normatively it locked sixteen decisions D1–D16 (`.llm/runs/plan-frontend-contrib--seed/plan.md:16-33`)
and a board: epic **#922** with children **#923–#946**, one per slice S1–S24. As of this reading
**all 24 children are OPEN and the epic is OPEN** (`gh issue view 923..946`), and **not one
artifact of the design exists in the tree**: no `packages/plugin-frontend-core`
(`ls packages/`), no `withFrontend` anywhere (`rtk grep -rn "withFrontend" packages/ plugins/` → 0
hits), no `defineFrontend`/`FrontendManifestEnvelope`/`frontend.registry` reference in any source
or doc (`rtk grep -rln ... packages/ plugins/ apps/ docs/` → 0 files), no `.tsx` under `plugins/`
(`find plugins -name "*.tsx"` → empty), no `./plugins` subpath in `packages/fresh/deno.json`
exports, and no `frontend` entry in `CONTRIBUTION_AXES`
(`packages/plugin/src/domain/constants.ts:29-40`).

The load-bearing pattern #890 contributes to a DevTools RFC is the **envelope + family versioning +
transactionally generated registry** triad: a stable `FrontendManifestEnvelope` carrying
`(family, major)`-versioned opaque payloads, a four-part identity model keyed on host-assigned
`mountId`, host-published `HostSurfaceDescriptor` capability negotiation, and a staged →
type-checked → atomically-swapped generated replace-set in `.netscript/generated/`
(`design/canonical/01-contracts.md:62-115`, `03-discovery-and-registry.md:6-53`). That triad is
**payload-agnostic by construction** and is the reusable part.

The charter's assertion that #890 "principally ratified the userland `app` family" is
**substantively correct but needs two qualifications**: (a) the envelope/identity/registry/host-
descriptor spine is explicitly family-agnostic and was designed so a *second* family (dashboard)
shares it (`plan.md:20`, `01-contracts.md:83-92`); (b) the ratification is **paper-only** — the
`app` family payload is as unimplemented as the spine.

The single biggest plan-defect risk for the DevTools RFC is therefore: **any DevTools design that
assumes the envelope, the registry emitter, the mount glue, the gateway, `PluginZone`, or the
doctor taxonomy already exist is wrong at this baseline.** All of it is planned, milestoned
(0.0.9), and unstarted.

---

## Findings

### F1 — #890 merged docs only; the entire mechanism is unbuilt

`gh pr view 890 --json files` returns exactly 32 paths: `.github/labels.yml` and 31 files under
`.llm/runs/plan-frontend-contrib--seed/`. `additions: 3976`. No `packages/**`, `plugins/**`,
`apps/**`, or `docs/**` file is touched. **Observed.**

Corroborating absence at baseline:

| Designed artifact | Design cite | Baseline check | Result |
| --- | --- | --- | --- |
| `@netscript/plugin-frontend-core` | `design/canonical/01-contracts.md:11-22` | `ls packages/` | absent |
| `.withFrontend()` pointer | `rfc.md:129-132`, `01-contracts.md:336-344` | `rtk grep -rn "withFrontend" packages/ plugins/` | 0 hits |
| `defineFrontend`, `FrontendManifestEnvelope`, `frontend.registry` | `rfc.md:110-127`, `03-…:34-40` | `rtk grep -rln "frontend.registry\|plugin-frontend-core\|defineFrontend\|FrontendManifestEnvelope" packages/ plugins/ apps/ docs/` | 0 files |
| `frontend` contribution axis | `06-doctrine-fit.md:10` | `packages/plugin/src/domain/constants.ts:16-40` | axis list is service…aspire; **no `frontend`** |
| `frontend` in `PluginContributions` | `rfc.md:47` | `packages/plugin/src/config/domain/plugin-contributions.ts:11-40` | absent |
| `@netscript/fresh/plugins` subpath | `06-doctrine-fit.md:11` | `packages/fresh/deno.json` `exports` | absent (`.`, `./server`, `./desktop`, `./builders`, `./route`, `./defer`, `./form`, `./error`, `./streams`, `./ai`, `./ai/sandbox`, `./query`, `./interactive`, `./vite`, `./testing`) |
| any plugin-shipped UI | `rfc.md:19` | `find plugins -name "*.tsx"` | empty |

### F2 — `PluginType 'frontend'` is still an inert enum member

`packages/plugin/src/domain/constants.ts:5` declares
`export type PluginType = 'background-processor' | 'api' | 'frontend' | 'utility';` and `:8-13`
lists it in `PLUGIN_TYPES`; the manifest schema accepts it at
`packages/plugin/src/protocol/manifest.ts:206` and `packages/plugin/src/protocol/manifest.ts:67`.
Nothing consumes it as a frontend-contribution signal. This is exactly the state #890's motivation
table describes (`rfc.md:47`) and it is unchanged. **Observed.**

### F3 — Scaffolded nav is still a hardcoded array

`packages/cli/src/kernel/assets/app/routes/(design)/design/_layout.tsx.template:7` defines
`const DESIGN_NAVIGATION = [...]` consumed at `:50` (`navigation={DESIGN_NAVIGATION}`). The
scaffolded `/dashboard` route template exists at
`packages/cli/src/kernel/assets/app/routes/dashboard.tsx.template`. #890's motivation claim
(`rfc.md:48`, `design/examples/dashboard.md:9-13`) holds at baseline. **Observed.**

### F4 — All 24 children and the epic are OPEN

`gh issue view <n> --json number,state` for 923…946: every one `OPEN`, `stateReason` null.
`gh issue view 922` → `state: OPEN`, labels `type:umbrella, area:plugins, area:fresh, status:plan,
priority:p1, epic:frontend-contrib`, milestone **0.0.9**. Sampled children milestones
(`gh issue view … --jq '.milestone.title'`): #923/#928/#930/#931/#941 → `0.0.9`; #942 → `0.0.13`;
#946 → `0.0.15`. Every child still carries `status:plan`. **Observed.**

### F5 — Implemented-vs-planned verdict: nothing implemented

Combining F1–F4: of D1–D16 (`plan.md:16-33`) and slices S1–S24 (`gh issue view 922` body),
**zero are implemented at baseline**. Not even the five *disposable* Wave-0 proofs (S1–S5,
#923–#927) — which the epic declares a sequencing law ("Wave-0 proofs (S1–S5) land before any
public contract freezes", `gh issue view 922` body) — have run. Consequence for the DevTools RFC:
the mechanisms #890 relies on (`App.mountApp` ordering, literal lazy loaders + route-module
normalization, dependency-island build matrix, SSR containment, gateway threat model) are
**design-asserted and proof-pending**, not proven. **Observed** (absence is directly checkable).

### F6 — The composition-phase hazard #890 identified is real and still present

`design/canonical/04-host-runtime.md:17-29` claims `defineFreshApp` runs `configure()` *before*
`fsRoutes`, so plugin mounting must not ride `configure`. Verified at baseline:
`packages/fresh/src/runtime/server/define-fresh-app.ts` runs
`options.configure?.(app);` immediately followed by `registerFsRoutes(app, options);` and then
`return app;` (lines ~113-117 in the current file; the design cited `:110-127`). The ordering fact
holds; the line anchor drifted slightly. Any DevTools host that mounts contributed routes into a
`defineFreshApp` host inherits this same post-`fsRoutes` composition requirement. **Observed.**

### F7 — Reuse precedent cited by #890 exists at baseline

`design/canonical/06-doctrine-fit.md:63-73` claims the per-axis generated registry emitter as
precedent. `packages/plugin/src/sdk/discovery/registry-emitter.ts` exists (alongside
`ast-extractor.ts`, `manifest-resolver.ts`, `source-graph.ts`, `watcher.ts`,
`filesystem-walker.ts`, `ports/`). The AI stream-proxy cited as the "safe transport" pattern
(`04-host-runtime.md:74-76`) exists at `packages/fresh/src/runtime/ai/stream-proxy.ts` (212 lines).
**Observed.**

### F8 — The charter's "principally ratified the userland `app` family" claim: AGREE, with two corrections

Agree on the substance. Evidence for: the only fully specified payload schema is the `app` family
v1 five kinds — route / island / zone / nav / theme (`01-contracts.md:116-223`); the
`HostSurfaceDescriptor` shipped concretely is the *scaffolded app's* (`01-contracts.md:240-243`:
zones `app.topbar.end`, `app.dashboard.panels`, `app.home.cards`, `app.footer`; nav group `main`);
`contract` defaults to `{ family: 'app', major: 1 }` (`01-contracts.md:302-303`); all four worked
consumers are userland-app surfaces (`rfc.md:178-183`).

**Correction 1 (in the charter's favour but worth stating precisely):** the envelope, identity
quartet, discovery/registry pipeline, resolution rules, doctor taxonomy, quarantine model, and host
negotiation are specified as **family-agnostic** — `contributions: readonly unknown[]` "validated by
the family's registered schema — **never by the envelope**" (`01-contracts.md:76-81`). So #890
ratified *both* a family-neutral spine and one concrete family; a DevTools family is an
anticipated, not a novel, use.

**Correction 2:** "ratified" overstates delivery. It ratified a design and a board; nothing is
built (F1, F5). A DevTools RFC that says "reuse the existing envelope" is describing a
**co-dependency on unbuilt work**, not reuse of a shipped surface.

### F9 — Owner arbitration state: F8 (milestone) decided; F1/F2/F3/F5/F7/F9 not recorded as arbitrated

`rfc.md:269-282` lists seven open forks for owner arbitration. The PR comment thread
(`gh pr view 890 --json comments`) contains a **filing comment** (2026-07-19: epic + children
filed, "Next: Owner arbitration of forks §9 (F1/F2/F3/F5/F7/F8/F9)"), a **board addendum**
(2026-07-19), and a single **F8 arbitration** (2026-08-03: "Decision: the Frontend Contribution
Layer takes the milestone slot immediately after 0.0.5", new `0.0.6` milestone, every milestone
above slipped one semver, Waves 0–2 = S1–S19 in scope). **No comment arbitrates F1, F2, F3, F5,
F7, or F9.** Saved: `.llm/runs/plan-devtools-contribution--seed/research/sources/pr890-comments.txt`.
**Observed.**

Implication for DevTools: the RFC-level open questions #890 left unresolved include the **route
mount default policy** (F2: plugin-preferred base + host remap vs. forced `/plugins/<mountId>`
namespace) — which is precisely the question a DevTools host must answer for its own mount surface.

### F10 — What #890 explicitly DEFERRED (inheritable by a DevTools RFC)

From `06-doctrine-fit.md:48-59` (debt candidates, "not yet filed") and `plan.md:27,48,87`:

| Deferred item | Cite | DevTools relevance |
| --- | --- | --- |
| `AssetContribution` — hashed assets, cache headers, integrity | `06:57`, `04:149-152` | DevTools panels shipping images/fonts/icons hit this immediately |
| SSR zone isolation protocol (hard isolation) | `06:58`, `04:116-130` | a crashing DevTools panel failing the DevTools page is the same containment contract |
| Plugin message catalogs / full i18n | `06:59` | probably a DevTools non-goal — dev surfaces may pin English |
| DTCG token merge from plugins | `06:54`, fork F5 | theming of contributed panels |
| Island props serializability **static** check | `06:55` | runtime round-trip only; DevTools inspectors are prop-heavy |
| `--ns-*`-only CSS lint | `06:52` | v1 was documentation + review, not enforcement |
| Tailwind content-scan extension to plugin packages | `06:53` | contributed panel styling |
| Zone occupancy caps / conflicts UI | `06:56` | "dashboard-run inspector covers observability first" — i.e. explicitly handed *to* a DevTools-like host |
| T1/T2 iframe sandbox trust tiers | `rfc.md:99-100`, `04:156-161` | "remain the dashboard epic's scope" — **explicitly deferred to the DevTools/dashboard lane** |
| Convention generator (file-tree → manifest lists) | `rfc.md:234` (S24, #946, milestone 0.0.15) | authoring ergonomics |
| Plugin `_layout` support | `01-contracts.md:150-153`, `plan.md:23` | rejected in v1; DevTools nested layouts would need it |

The two deferrals a DevTools RFC most directly **inherits as its own work** are the **trust tiers
(T1/T2 sandboxing)** and the **zone occupancy/conflict inspector** — #890 hands both to the
dashboard lane by name. **Observed.**

### F11 — The dashboard example contradicts the ratified envelope decision (internal drift in #890's own record)

`plan.md:20` (D3) and `rfc.md:70-72` state the dashboard is **"a sibling payload, not a widened
union"**, and `01-contracts.md:84-87` says its family "*extends nothing at the schema level*". But
`design/examples/dashboard.md:5` says the dashboard architecture "becomes a family **extension** of
this layer instead of a sibling", and `:74-78` writes
`DashboardContribution = FrontendContribution | DashboardPanelContribution | …` — exactly the
widened union that adversarial finding S-7 disproved (`01-contracts.md:62-67`). The examples file
carries a rev-2-era header while contracts is rev 3. **Observed drift inside the merged record.**
A DevTools RFC copying `design/examples/dashboard.md` verbatim would import the disproved model.

### F12 — The dashboard/DevTools host was already scoped as a *policy* difference, not a new mechanism

`design/examples/dashboard.md:62-70`: the future dev dashboard "is a NetScript Fresh app whose host
policy differs, not a new mechanism" — it (a) remaps every plugin's routes under
`/plugins/<pluginId>/…`, (b) publishes **additional zones** (`dashboard.home.*`,
`entity.<kind>.detail.sidebar`), (c) filters by `surfaces: ['dashboard']`. Note (c) references a
`surfaces` field that appears **nowhere** in `01-contracts.md`'s ratified kind definitions — it is
example-only vocabulary. **Observed** (the `surfaces` gap is a real hole a DevTools RFC must fill
or reject).

### F13 — Live board sequencing has moved past the merged record

`gh api repos/rickylabs/netscript/milestones` shows milestone **0.0.9** = "Frontend Contribution
Layer — plugins that ship UI. RFC #890, epic #922. Waves 0-2…" with 20 open / 6 closed, while
milestone **0.0.14** = "Dev dashboard (thin, contribution-based) + auth/deploy tail" (11 open).
Latest release commit on `main` is `0e78e9c58 chore(release): cut 0.0.5`. So FCL Waves 0–2 sit
four milestones out, and the dev dashboard five past that. **Observed.**

### F14 — Reusable-vs-app-specific split of #890's pattern

**Sound to reuse for a DevTools family** (all payload-agnostic by construction):

1. **Envelope**: `{ contract: FamilyRef, pluginKind, base?, contributions: unknown[], requires?,
   budgets? }` with payload validated only by the family's registered schema
   (`01-contracts.md:68-81`, `:98-107`).
2. **Family/major handshake + evolution rules**: new optional field = minor (payload schemas
   `.passthrough()`); new kind or new discriminant = **new major**; hosts declare supported
   `(family, major)` windows and quarantine outside them (`01-contracts.md:88-92`).
3. **Identity quartet** `packageName / pluginKind / installationId / mountId`, all generated keys
   derived from host-assigned `mountId` (`01-contracts.md:36-55`).
4. **`HostSurfaceDescriptor`** — zones/navGroups/reservedPaths/family-windows as *host data*, so
   surface growth is a data change, not a contract change (`01-contracts.md:230-246`).
5. **Transactional generated replace-set**: stage out-of-place → `deno check` including a
   `frontend.check.ts` that statically imports **every** referenced module → atomic swap or
   rollback; deterministic empty emissions so removal can never dangle
   (`03-discovery-and-registry.md:6-53`, `:96-97`).
6. **Deterministic ordering + collision policy**: plugins by `mountId`, contributions by
   `(order, mountId, id)`; route-**pattern** overlap (not string equality), reserved host paths,
   basePath composition (`03:58-73`).
7. **Five-state diagnosis taxonomy as product surface**: unknown zone (error) / known-but-unmounted
   (info, *not* quarantine) / capacity-rejected / window-mismatch quarantine / load-failure
   quarantine, printed verbatim by doctor and deep-linked from quarantine cards (`03:66-71`,
   `:90-95`).
8. **Pointer-thin core axis**: `@netscript/plugin` learns only `{ export, framework }`; the
   family/major handshake lives once, in the pointed-to module, derived at generate time
   (`01-contracts.md:336-344`).
9. **Budgets in the envelope**, asserted by the test kit and surfaced by doctor
   (`01-contracts.md:96-107`).
10. **Server/client context split**: server-only context may hold functions/ports; a separate
    serializable client context is the only thing that may cross an island boundary
    (`01-contracts.md:248-278`).

**App-family-specific payload that must NOT be copied blindly:**

1. The **five kinds** route/island/zone/nav/theme and their fields — a DevTools family needs its
   own kinds justified by real first-party consumers (`01-contracts.md:116-223`).
2. The **concrete zone ids** `app.topbar.end` / `app.dashboard.panels` / `app.home.cards` /
   `app.footer` and nav group `main` — these are the scaffolded app's descriptor
   (`01-contracts.md:240-243`).
3. **`base` mount policy F2** (plugin-preferred base + host remap, so `/auth/account` beats
   `/plugins/auth/account`) — an *unarbitrated* userland-UX preference (`rfc.md:274`, F9 above);
   a DevTools host plausibly wants the opposite (namespaced, collision-free).
4. **T0 trust posture** ("installed plugins already run server code", `rfc.md:97-100`) — defensible
   for a userland app; a DevTools surface that may be remote-exposed cannot inherit it unexamined,
   and #890 itself parks T1/T2 in the dashboard lane.
5. **The deny-by-default procedure gateway** at `/api/plugins/<mountId>/` derived from
   `requires.procedures` (`04-host-runtime.md:71-91`) — the *principle* (deny-by-default, generated
   from contract metadata, no wildcard forwarding) is reusable; the concrete prefix, the coupling
   to plugin oRPC procedure metadata, and the AI-adapter carve-out are app-family payload.
6. **Theme contribution** (`--ns-*` only, one per plugin, host-owned `@layer ns-app, ns-plugins`
   prelude, `04:140-155`) — plausibly a DevTools non-goal; do not import the CSS-overlay contract by
   reflex.
7. **`definePluginPage` / `pluginApi` / `normalizeFreshRouteModule`** — Fresh-runtime helpers in
   `@netscript/fresh/plugins` (`01-contracts.md:24-29`, `04:96-109`); reusable **only if** the
   DevTools host is itself a Fresh app.
8. **The `surfaces: ['dashboard']` filter idea** — example-only, not in the ratified contract (F12).
9. **`design/examples/dashboard.md`'s union model** — contradicts D3 (F11); do not copy.

**Kind:** the split above is `inference` from the cited design text — it is a judgement about
transferability, grounded in the cited payload-agnostic vs app-named passages.

---

## Contracts

Quoted from the merged normative record. These are **design contracts, not shipped types** (F1).

### C1 — `FrontendManifestEnvelope` (`design/canonical/01-contracts.md:68-81`)

```ts
export interface FrontendManifestEnvelope {
  /** Family + major — the handshake. Hosts register family schemas they support. */
  readonly contract: { readonly family: 'app'; readonly major: 1 } | FamilyRef;
  readonly pluginKind: string;
  /** Preferred mount base ('/crons'); host remaps; full collision rules in 03 §3. */
  readonly base?: string;
  /** Family payload, validated by the family's registered schema — never by the envelope. */
  readonly contributions: readonly unknown[];
  readonly requires?: FrontendRequires;
  // + readonly budgets?: FrontendBudgets;   (01-contracts.md:106)
}
export interface FamilyRef { readonly family: string; readonly major: number }
```

Multi-family export form (`01-contracts.md:109-114`): a plugin's `./frontend` export is one
envelope **or a plain array of envelopes**, one `defineFrontend` call each —
`export default [defineFrontend(appDefinition), defineFrontend(dashboardDefinition)];`.

### C2 — Version negotiation / evolution rules (`01-contracts.md:88-92`)

> new optional field on an existing kind = minor (validators must ignore unknown fields — schemas
> are `.passthrough()` at the payload boundary); **new kind or new discriminant = new major of that
> family**; hosts declare supported `(family, major)` windows in their `HostSurfaceDescriptor` and
> **quarantine outside the window**. Old-host/new-plugin and new-host/old-plugin negotiation each
> get a contract test.

Rationale (S-7): "A discriminated-union member added to a strict schema is **not** additive: old
validators reject it, exhaustive consumers break" (`01-contracts.md:62-67`).

### C3 — Family identity / the identity quartet (`01-contracts.md:36-60`)

```ts
export interface FrontendIdentity {
  readonly packageName: string;    // '@netscript/plugin-auth' — provenance + version drift
  readonly pluginKind: string;     // 'auth' — matches installer manifest officialSource.canonicalName
  readonly installationId: string; // host-assigned at install; = pluginKind unless multi-instance
  readonly mountId: string;        // host-assigned — THE key for routes, CSS scope, gateway paths
}
```

> Manifests declare `pluginKind`; the installer/registry assigns `installationId`/`mountId`… All
> generated keys (base path, `data-ns-plugin` scope, gateway prefix, typed route ref namespace)
> derive from `mountId`, **never** from `packageName`.

Pinned constant: `GATEWAY_PREFIX` = `/api/plugins/<mountId>/` — "a contract constant, not a
convention" (`01-contracts.md:57-60`).

### C4 — `HostSurfaceDescriptor` (`01-contracts.md:230-246`)

```ts
export interface HostSurfaceDescriptor {
  readonly host: string;                        // 'app' (scaffolded app), 'dashboard', …
  readonly families: readonly FamilyRef[];      // supported (family, major) windows
  readonly zones: readonly { readonly id: string; readonly capacity?: number }[];
  readonly navGroups: readonly string[];
  readonly reservedPaths: readonly string[];    // '/_fresh', '/api/plugins', host basePath rules
}
```

> Adding a zone to a host is a **data change, not a contract change**… Diagnoses are distinct:
> **unknown zone** (typo — generate-time error) vs **known-but-unmounted** (informational, not
> quarantine) vs **capacity-rejected** (deterministic overflow report).

### C5 — Registry generation: the transactional replace-set (`03-discovery-and-registry.md:6-53`)

Chain:
`scaffold.plugin.json "frontend" block` (parse-only pointer, no plugin code executed) →
`import` the plugin's `./frontend` export → **stage** `.netscript/generated/frontend.*` out-of-place
→ `deno check` staged set **including `frontend.check.ts`, which imports EVERY referenced module**
→ **atomic swap** or rollback.

Emitted files, all six, deterministically, **even when empty**:

| File | Contents |
| --- | --- |
| `frontend.registry.ts` | identities, resolved bases, contributions, **literal lazy route loaders** |
| `frontend.islands.ts` | `pluginIslandSpecifiers: readonly string[]` for the vite feed |
| `frontend.routes.ts` | `createRouteReference` entries per plugin route (typed hrefs) |
| `frontend.css` | host layer-order prelude (`@layer ns-app, ns-plugins;`) + plugin css imports |
| `frontend.gateway.ts` | deny-by-default gateway route table from `requires.procedures` × contract metadata |
| `frontend.check.ts` | static-import module referencing every route/island/css module — the type-check gate's teeth |

Route loaders are **literal**, never computed (`03:43-53`):

```ts
load: () => import('@acme/plugin-crons/frontend/routes/calendar').then(normalizeFreshRouteModule),
```

Generation is idempotent (byte-identical skip) and transactional (`03:96-97`).

### C6 — Ordering + collision policy (`03-discovery-and-registry.md:58-73`)

> Deterministic order everywhere (plugins by `mountId`, contributions by (`order`, `mountId`, `id`)).

| Check | Failure mode |
| --- | --- |
| pluginKind ≠ owning plugin / packageName mismatch | error naming both |
| route-**pattern** overlap across plugins (not string equality), reserved host paths (`/_fresh`, `/api`, gateway prefix, host `config.basePath` composition), nested/dynamic precedence conflicts | error with colliding patterns + remap hint |
| nav `target.routeId` unknown | error |
| zone id not in target host's descriptor | **unknown zone** → error |
| zone known to family but absent from this host | **known-but-unmounted** → info; skipped, NOT quarantined |
| zone capacity exceeded | deterministic overflow report naming winners/losers |
| duplicate contribution id within (plugin, family) | error |
| `(family, major)` outside host's declared window | **quarantine** entry, never a host crash |
| module ref absent from package export map | error + `plugin dev` / `generate frontend` hint |
| route `path` params ≠ module filename params (`:id` vs `[id].tsx`) | error naming both syntaxes |

### C7 — Removal / update behavior (`03-discovery-and-registry.md:76-97`)

- `plugin install` → regenerate full replace-set → staged `deno check` → atomic swap; a type-broken
  contribution **fails install** with the real diagnostic.
- `plugin remove` (the actual verb, cited as
  `packages/cli/src/public/features/plugins/remove/remove-plugin-command.ts:39-69`) → regeneration
  emits the **deterministic empty set** for departed plugins, so registry/css/island imports can
  never dangle. Scaffolded **starter** files are app-owned, survive removal by design, and carry a
  provenance header comment so doctor can report orphans **without ever deleting them**.
- `plugin doctor` frontend check → envelope/window handshake, zone validity, export-map presence,
  orphan/stale generated-output detection; prints the five-state taxonomy verbatim.

### C8 — Pointer axis (`01-contracts.md:336-344`)

`@netscript/plugin` learns only `FrontendContributionRef = { export, framework: 'fresh' }` (builder
`.withFrontend()`, installer-manifest `frontend` block, **parse-only**). The family/major handshake
lives **once**, in the `./frontend` module's envelope; the registry derives it at generate time.
`PLUGIN_MANIFEST_SCHEMA_VERSION` bumps additively; older CLIs ignore the block, and because the
older host also lacks the frontend generate step, ignoring is safe (no half-wired state).

### C9 — Trust / containment (`04-host-runtime.md:111-161`, `rfc.md:249-257`)

T0 on the app surface. Guarantees are: (1) **data-phase containment** — zone data resolution runs
host-side before render inside try/catch; (2) **client containment** — hydrated islands under a
client-side Preact boundary; (3) **route-level `onError`**; and explicitly **(4) an SSR render-time
throw in a zone component fails the page response** — "documented, tested, and the reason the
resolver-not-render rule exists". Hard SSR isolation would be "a designed isolated-render protocol
(own wave), not a boundary claim". T1/T2 iframe tiers are dashboard-epic scope.

---

## Drift candidates

| # | Expected (carried-in / documented) | Actual at baseline | Evidence | Severity |
| --- | --- | --- | --- | --- |
| D-1 | Charter: "#890 … Preserve its versioned envelope/generated registry pattern" reads as reuse of an existing surface | The pattern exists only as merged design text; zero code | `gh pr view 890 --json files`; `rtk grep` misses in F1 table | architectural |
| D-2 | Epic #922 acceptance implies waves progressing | All 24 children OPEN, all `status:plan`, no Wave-0 proof run | `gh issue view 923..946` | architectural |
| D-3 | #890 F8 arbitration: "the milestone slot immediately after 0.0.5" → new `0.0.6` | Epic #922 and S1–S19 now sit in milestone **0.0.9**; `main` has cut 0.0.5 | PR #890 comment 2026-08-03; `gh issue view 922`; `gh api …/milestones`; `git log` `0e78e9c58` | significant |
| D-4 | D3/rfc.md: dashboard family is a **sibling payload, not a widened union** | `design/examples/dashboard.md:5,74-78` describes a family *extension* with `DashboardContribution = FrontendContribution \| …` | `plan.md:20`, `rfc.md:70-72`, `01-contracts.md:84-87` vs `design/examples/dashboard.md:5,74-78` | significant |
| D-5 | `04-host-runtime.md:19-21` cites `define-fresh-app.ts:110-127` for the configure-before-fsRoutes fact | Fact holds; the line anchor drifted (now ~113-117) | `packages/fresh/src/runtime/server/define-fresh-app.ts` | minor |
| D-6 | Forks §9 presented as the RFC's open arbitration set | Only F8 arbitrated in the PR thread; F1/F2/F3/F5/F7/F9 have no recorded decision, yet the PR merged | `rfc.md:269-282`; `sources/pr890-comments.txt` | significant |
| D-7 | `design/examples/dashboard.md:70` uses `surfaces: ['dashboard']` targeting | No `surfaces` field exists in any ratified kind in `01-contracts.md` | `01-contracts.md:116-223` | minor |
| D-8 | #890's own record is the RFC of record | There is **no** `docs/architecture/rfc/` directory in this repo at baseline; #890 lives only under `.llm/runs/` while the runtime-automation RFC uses `docs/architecture/rfc/rfc-0001-…` | `ls docs/architecture/rfc/` → no such directory | minor |
| D-9 | `rfc.md:47` "No frontend axis in `PluginContributions`; `PluginType 'frontend'` is an inert enum" (stated as a 2026-07 fact) | Still exactly true | `packages/plugin/src/config/domain/plugin-contributions.ts:11-40`; `packages/plugin/src/domain/constants.ts:5-13` | minor (confirms, no drift) |

---

## Open questions

1. Does the DevTools RFC **depend on** #890's spine landing first (contracts + emitter + host
   runtime, #928–#931), or does it specify a self-contained DevTools family that can ship on its
   own generated registry? At baseline neither exists, so this is a genuine sequencing fork, not a
   reuse decision.
2. If DevTools shares the envelope package, **where does the envelope live** — `@netscript/plugin-
   frontend-core` (F3 option (a), unarbitrated) or a family-neutral package? "frontend-core" is a
   poor home for a non-frontend DevTools family. Fork F3 was never arbitrated (F9).
3. Mount policy for a DevTools host: #890's F2 (plugin-preferred base + host remap) is unarbitrated
   and userland-motivated; does DevTools force `/__devtools/<mountId>` namespacing?
4. Does the DevTools host inherit T0 trust, or does it have to build the T1/T2 iframe tiers #890
   explicitly deferred to "the dashboard epic"? If DevTools is ever remote-exposed, T0 is not
   inheritable.
5. Is `requires.procedures` × contract-metadata gateway generation the right data plane for
   DevTools, given the charter says SDK contributions are owned by PR #1390? Two generated data
   planes would be a duplication defect.
6. Does the `surfaces` targeting idea (F12/D-7) need to become a real contract field, or is
   per-family payload + per-host descriptor sufficient?
7. Unverified: whether any of the merged #890 record was subsequently amended by other merged PRs
   (I checked the tree, not the history of the run dir). `git log --follow
   .llm/runs/plan-frontend-contrib--seed/` would settle it.
8. Unverified: whether the 6 closed issues in milestone 0.0.9 are frontend-contrib related
   (children #923–#946 are all open, so they are other work). `gh issue list --milestone 0.0.9
   --state closed` would settle it.
9. The `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` prior art cited
   throughout #890 (the "ratified 7-kind dashboard family") was not read in this pass — it is the
   `prior:dashboard` topic's job, but the DevTools kind-set decision depends on it.

---

## Sources

**GitHub reads (all read-only):**

- `gh pr view 890 --json title,state,mergedAt,mergeCommit,body,files,additions,deletions`
- `gh pr view 890 --json comments` → saved to
  `.llm/runs/plan-devtools-contribution--seed/research/sources/pr890-comments.txt`
- `gh issue view 922 --json title,state,body,labels,milestone`
- `gh issue view <923..946> --json number,title,state,stateReason` (24 calls)
- `gh issue view <923,928,930,931,941,942,946> --json milestone,labels`
- `gh api repos/rickylabs/netscript/milestones --paginate`

**Merged run record (committed by #890):**

- `.llm/runs/plan-frontend-contrib--seed/rfc.md`
- `.llm/runs/plan-frontend-contrib--seed/plan.md`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/03-discovery-and-registry.md`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/04-host-runtime.md`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/06-doctrine-fit.md`
- `.llm/runs/plan-frontend-contrib--seed/design/examples/dashboard.md`

**Baseline source checks:**

- `packages/plugin/src/domain/constants.ts:5-40`
- `packages/plugin/src/config/domain/plugin-contributions.ts:11-40`
- `packages/plugin/src/protocol/manifest.ts:67,206`
- `packages/fresh/src/runtime/server/define-fresh-app.ts` (configure → registerFsRoutes ordering)
- `packages/fresh/deno.json` (`exports` map)
- `packages/fresh/src/runtime/ai/stream-proxy.ts` (212 lines)
- `packages/plugin/src/sdk/discovery/registry-emitter.ts`
- `packages/cli/src/kernel/assets/app/routes/(design)/design/_layout.tsx.template:7,50`
- `ls packages/`; `find plugins -name "*.tsx"`; `ls docs/architecture/rfc/`
- `rtk grep -rn "withFrontend" packages/ plugins/`
- `rtk grep -rln "frontend.registry|plugin-frontend-core|defineFrontend|FrontendManifestEnvelope" packages/ plugins/ apps/ docs/`
- `git log --oneline -3`; `git branch --show-current`
