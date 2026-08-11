# T8 — Information architecture and staged follow-up RFCs (charter Q9, Q12)

> **HISTORICAL EVIDENCE — frozen at authoring time.** Where this pack disagrees with
> `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, **the RFC wins**. Notably the package
> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
> A6 CLI emission + A5 plugin**, and identity/ordering were unified on `(mountId, id, apiMajor)`
> and anchors-then-`(order, mountId, id)`. See `RFC-AUTHORITY.md` and `drift.md`.


> Stage-D deep-dive pack for run `plan-devtools-contribution--seed` (PR #1450, baseline `main` @
> `2256a67bf`). Planning only. Every load-bearing claim cites a corpus file (which itself cites
> `path:line`, a fetched artifact, or a `gh` read) or is marked `inference` / `unverified`.
> Mount-point naming (`<base>` below) is **T1's decision**; this pack designs what hangs off it.

## Recommendation

Adopt an IA of **eight owned surfaces in seven top-level route segments**, each a vertical feature
slice, each carrying a recorded NetScript-only answer to acceptance line 1, with contributed panels
mounting into a **host-owned closed zone vocabulary inside those surfaces** rather than minting
sibling routes. Ordering/grouping/visibility are **declarative data on the contribution**
(`order`, `groupId` flat pointer with orphan fallback, `when`), sorted deterministically by
`(order, mountId, id)`. Entity state gets **entity URLs** (`/flows/:correlationId`,
`.../jobs/:jobId/executions/:execId`), superseding #424's flat scheme — the board's one recorded
contradiction (`b1` F9, D4). Every outbound link is built by a typed deep-link helper from a
configurable base (`Dashboard:Frontend:PublicUrl` for Aspire; the service origin for Scalar), never
hardcoded localhost (`m4` F12). The state matrix below is normative: a surface ships only with its
six states specified, and the two honest degradations — **streams has no oRPC contract surface**
(`b2` F8) and **filtered Aspire views are not deep-linkable** (`m4` F11) — are rendered as explicit,
labelled degraded states, not silently empty panels.

For Q12: **four seams become separate follow-up RFCs** (Fresh UI registry contribution, generic
Vite contribution, deployment/remote DevTools, MCP HTTP/agent transport), each with named consumed
contracts, entry criteria, and an owning dependency. One seam is **declined, not deferred**:
contribute-into-Scalar (pinned bundle `1.44.15` predates `pluginUrls`, `m4` F32/D3 — deep-link
instead).

## The three normative acceptance lines

Adopted verbatim from epic #400's body (`b1` F3; preserved per stage-C resolution R2,
`research.md`), promoted from prose to the RFC's normative acceptance criteria:

1. **Non-duplication.** No owned OTLP waterfall/gantt, log tail, metrics chart, resource
   start/stop/restart panel, or OpenAPI operation list/try-it. *Every merged panel must answer
   "why can't this just deep-link to Aspire/Scalar?" with a NetScript-only answer recorded in its
   issue.* The killed-surfaces list (#421 logs panel, #422 resource control, `/health` panel,
   metrics charts, Scalar-style operation list — `b1` F3) is carried in the RFC's non-goals so the
   surfaces cannot creep back.
2. **One generator, two callers.** Every DevTools mutation invokes the same contract route / CLI
   scaffolder the terminal does and renders its CLI-equivalent line (`netscript …` CodeBlock). No
   DevTools-only write paths, no forked codegen.
3. **Flow ≠ waterfall.** The journey view renders a primitive-grouped causal chain with payloads at
   seams, assembled from NetScript's own seam events, joined on `netscript.correlation.id`
   (`r5` F13). No span bars, no time-proportional gantt, no log tails — ever.

This pack applies line 1 as a **per-surface recorded answer** (the "NetScript-only" column below)
and extends line 2 into the state matrix: **empty states render the CLI-equivalent line that would
create the first entity** — the cheapest possible enforcement of "two callers, one generator"
(*inference: design decision, grounded in `b1` F3 line 2*).

## Information architecture

### Doctrine constraints that shape the tree

- **AP-21 / F-16**: a `routes/` folder with >12 immediate children is a flat list with a path
  prefix (`09-anti-patterns-and-fitness-functions.md:142-146` via `b2` F5). A panel-per-seam IA
  (the #400 board had 13 screens + 15 sibling prototype routes, `b1` F5) hits this immediately.
  The tree below holds **seven top-level segments**.
- **R-FOLD-LAYERING-MODE** explicitly names *dashboard pages* as the vertical/feature-sliced case
  (`05-folder-structure.md:188-208` via `b2` F4). Each segment below is one vertical slice owning
  its route, handlers, islands, and data access — not a horizontal `presentation/` pile.
- Fresh route-visibility: `_*` and `(_*)` folders are invisible to the manifest generator, so a
  visible DevTools tree must mirror the shipped `routes/(design)/design/` precedent (`r1` F4 via
  SYNTHESIS-NOTES host-composition facts; `/design`'s own missing production gating — `r5` OQ5 —
  is the omission DevTools must not repeat).
- The URL contract follows the merged routing-resort principles P1 (every entity is a URL segment)
  and P7 (`/flows/:correlationId` is a first-class journey URL) (`b1` F5), and **supersedes #424's
  flat scheme**, which `coverage-matrix.md` marks the "one true contradiction" (`b1` F9, D4).
  Ratification state is honestly noted: the resort is *committed evidence, not ratified
  architecture* (`b1` F5 authority reading); this RFC is the ratification vehicle.

### Route tree

```text
<base>/                                  Home — "wiring home": only-NetScript stats
                                         (plugins installed, axes wired, contract coverage,
                                         generated-registry freshness) + contributed home cards
<base>/runtime/                          Primitive run-state (one vertical slice per primitive)
  workers/                               job/task registry, execution feed
    jobs/:jobId/executions/:execId       entity URL for one execution (attempts, steps)
  sagas/
    instances/:instanceId                instance timeline incl. `compensating`
  triggers/
    :triggerId/firings                   firing history, cron preview
  streams/
    :streamId/deliveries                 fan-out/delivery state per subscriber
<base>/flows/:correlationId              Journey view — primitive-grouped causal chain (line 3)
<base>/contracts/                        Contract provenance / coverage / REST-RPC duality
  :serviceId/:operationId                per-operation provenance chain → Scalar out-link
<base>/plugins/                          Plugin registry wiring, doctor, contribution axes
  :pluginId                              detail: axes, doctor rows, version drift, contributions
<base>/generated/                        Generated-artifact state: registries, schemas,
                                         scaffold drift, DB migrations (applied vs pending)
<base>/automation/                       Runtime-automation diagnostics (consumes #1446 contracts;
                                         read-only; management stays in the Surface-1 console)
```

Seven segments (home + six named) — under the 12-child cap with headroom for contributed **routes**
if a route kind survives T3. Config/stack-map (#416's declared-vs-running wiring) folds into Home
rather than taking an eighth segment (*inference: it is a read-only overview, and Home's
NetScript-only answer already covers wiring facts*).

### Why each surface is NetScript-only (acceptance-line-1 record)

| Surface | NetScript-only answer (recorded per line 1) |
| --- | --- |
| Home | Framework wiring facts — installed plugins, contribution axes, contract coverage, registry freshness. Aspire's `/` shows *processes*; it has no concept of a plugin, an axis, or a generated registry (`m4` boundary table: "Framework contribution wiring — no upstream owner exists"). |
| `runtime/*` | Primitive run-state: executions/attempts, saga instances incl. `compensating`, trigger firings, stream deliveries — semantic framework state assembled from `netscript.*` attributes (15 domains, `r5` F12) and plugin registries. Aspire renders spans, not job/saga/trigger/stream semantics; and its telemetry store is lossy by design (10k shared cap, `m4` F5), so run-state cannot even be reconstructed from it. |
| `flows/:correlationId` | The causal chain across seams joined on `netscript.correlation.id` (`r5` F13). Aspire owns the waterfall; the *journey* — which primitive caused which, with payloads at seams — exists nowhere upstream (`m4` boundary table: "partial hand-off"). |
| `contracts/` | The provenance chain schema → oRPC router → OpenAPI → Scalar. "Scalar renders the *endpoint*, not its provenance chain" (`m4` boundary table). Coverage/duality (which routes are contract-bound vs raw) is a framework-only fact (`b2` F8 debt entries prove it varies). |
| `plugins/` | Contribution-axis map, doctor five-state diagnosis, JSR version drift, duplicate-identity detection. No upstream owner (`m4` boundary table); the CLI's `plugin doctor` already runs contributed checks with `dryRun: true` (`r4` F2 via S-17) — this surface renders that, one generator, two callers. |
| `generated/` | Generated-surface drift: dual-generator paths writing to different locations, walker registries leaking on `plugin remove` (`r4` F3/F10 via S-16), migration applied-vs-pending (#552). Invisible to Aspire and Scalar by construction. |
| `automation/` | Diagnostics over #1446's four stable contracts — management oRPC (§8.1), audit/history (§5.2, §7), convergence (§5.3), OTel vocabulary (§7) (`p2` F2). The decision sentence is normative: "production operator management and developer diagnostics are two distinct hosts and two distinct contribution surfaces — not one ambiguous 'cockpit'" (`p2` F3, RFC:491-493). DevTools shows convergence/audit *correlated to flows*; it does not annex Surface-1 management verbs. |

### Contributed panels: zones, ordering, visibility

- **Host-owned closed zone vocabulary** (Medusa's model, not Strapi's — `m3` M-2/X-1; adopting it
  makes name collision impossible by construction, per stage-C resolution R5). Initial vocabulary
  (*inference — final list is T3's*): `home.cards`, `runtime.<primitive>.tabs`,
  `flows.step.inspectors`, `plugins.detail.tabs`, `generated.sources`, `nav.sections`.
- **Ordering/grouping/visibility are declarative data on the contribution**, imitating Vite
  DevTools' dock-entry fields `category` / `defaultOrder` / `groupId` / `when` (`m1` F16, C2):
  flat `groupId` pointers, one level deep; **an orphaned member renders top-level; an empty group
  stays hidden** — copied verbatim per `m1`'s applicability verdict. Deterministic sort is #890's
  `(order, mountId, id)` — ahead of the surveyed market, where nobody solved ordering (`m3` M-8,
  `m2` F21/F3, via S-20).
- **Live updates go through a returned handle** (`register()` → `handle.update(patch)`), not hook
  re-evaluation — Nuxt's explicit regret `NDT_DEP_0006` (`m1` F17).
- **Per-contribution error boundary** on every zone mount: loud in dev (dev *is* the audience —
  polarity inverted from Grafana, `m2` F23 via S-22), host degrades and never crashes (`m2` F18).

### Deep links: the typed helper is the first slice

No deep-link helper exists anywhere in `packages/` for either upstream (`m4` D5, `r5` F8-9). The
IA depends on one; it is a small, high-value slice. Normative link grammars (all `observed` in
`m4`):

| Target | Grammar |
| --- | --- |
| Aspire resource detail | `{PublicUrl}/?resource={name}` (`m4` F9) |
| Console logs | `{PublicUrl}/consolelogs/resource/{name}` (`m4` F6) |
| Correlated structured logs | `{PublicUrl}/structuredlogs/resource/{name}?traceId=&spanId=&logLevel=` (`m4` F8) |
| Trace/span detail | `{PublicUrl}/traces/detail/{traceId}?spanId={id}` (`m4` F7) |
| Metric instrument | `{PublicUrl}/metrics/resource/{r}/meter/{m}/instrument/{i}?duration=` (`m4` F10) |
| Logged-in landing | `{PublicUrl}/login?t={Dashboard:Frontend:BrowserToken}` — the sanctioned automation path (`m4` F18) |
| Scalar operation | `{serviceOrigin}/api/docs#tag/{tag}/{method}{path}` (`m4` F27) |
| Scalar model | `{serviceOrigin}/api/docs#model/{slug}` (`m4` F27) |

Constraints the helper encodes: base is **`Dashboard:Frontend:PublicUrl`**, never
`localhost:18888` (`m4` F12); **`?filters=` is never emitted** — it is an opaque internal
serialization (`m4` F11, verified negatively); Scalar tag slugs are oRPC-derived and not pinned by
NetScript (`m4` F29, `inference` there — **unverified**, closes via research OQ8 by inspecting a
generated spec's `tags` array). Whether the AppHost sets `PublicUrl` and exposes the browser token
to NetScript tooling is research OQ5 (`m4` OQ2/OQ4) — the helper must treat both as *optional*
inputs with a degraded "origin-only link" fallback.

## Worked first-party examples

The eight seams the charter requires (Q9), including #1446's contracts. "Deep-links out" uses the
grammars above.

| Seam | What only NetScript can show | Deep-links out |
| --- | --- | --- |
| **Workers** | Job/task registry with schedule intent vs observed drift; execution feed with attempts/retries as `RunRecord` semantics (`b1` #428); empty state renders `netscript scaffold job …` CLI-equivalent | Per execution → `/traces/detail/{traceId}?spanId=`; per resource → `/structuredlogs/resource/{n}?traceId=&logLevel=error`; queue-depth instrument → `/metrics/resource/{r}/meter/{m}/instrument/{i}` (**unverified** that NetScript emits OTel metrics at all — `r5` OQ7; the link renders only if `queryMetrics` returns the instrument) |
| **Sagas** | Instance table incl. `compensating`; from→to transition/compensation timeline as a state machine, not spans (`b1` #429) | Per transition → trace/span detail; instance's flow → `<base>/flows/:correlationId` (internal) |
| **Triggers** | Firing history across 8 trigger kinds; enable/disable with CLI-equivalent line; cron preview (`b1` #430). Contract column degrades: only ~3 of 10 business routes are contract-bound (`b2` F8) | Per firing → trace detail; misfire investigation → correlated structured-logs link |
| **Streams** | Fan-out/delivery state per subscriber as framework run-state (`b1` #431). **Contract-provenance column renders the labelled degraded state** — see matrix | Per delivery → trace detail; subscriber resource → `/consolelogs/resource/{name}` |
| **Contracts/SDK** | Provenance chain schema → router → OpenAPI → Scalar; coverage/duality per service; powered by the pure, IO-free `@netscript/mcp/openapi-projection` (`r5` F21) — no MCP process needed | Per operation → Scalar `#tag/{tag}/{method}{path}`; per schema → `#model/{slug}`; try-it is **always** an out-link (killed surface) |
| **Plugin registry** | Installed plugins, contribution-axis map (incl. dead axes — ten enum names vs twelve keys, `r3` via `research.md` F18), doctor rows via the existing contributed-checks seam (`r4` F2), JSR version drift, silent-duplicate-identity detection (`r3` F9) | Plugin's service resource → `/?resource={name}`; plugin service API → its Scalar mount |
| **Generated artifacts** | Registry freshness per generator path (manifest-driven vs SDK walker — two mechanisms, two paths, `r4` F3); leaked walker registries after `plugin remove` (`r4` F10); migration applied-vs-pending + drift (#552); confirm-gated `migrate`/`seed` renders CLI-equivalent (line 2) | None upstream — this surface has no Aspire/Scalar analogue; links are internal (to `plugins/:id`, to file paths) |
| **Runtime automation** | Convergence state and audit/history *as diagnostics correlated to flows* — read-only projections of #1446's management oRPC, audit/history, convergence, and OTel contracts (`p2` F2-F3). Management verbs live in the Surface-1 console; DevTools links to it | Automation actions in a journey → trace detail; operator management → the userland admin console route (out-link, not embed) |

## State matrix

Normative per Q9 ("happy-path screenshots alone fail this") and per SCOPE-frontend's false-done
states ("main route works but subpages broken; static check passes but browser render blocks or
shows stale data" — `b2` F12, `SCOPE-frontend.md:32-36`). Shared mechanics first, then per-surface
rows for what differs.

**Shared state contracts (all surfaces):**

- **Loading** — fresh-ui skeletons; SSE-fed panels show an explicit "connecting" chip with the
  resolved endpoint *and its source* (`resolveTelemetryEndpoint` reports `source` —
  `r5` F22/finding 22: exactly the "where is my data coming from" affordance).
- **Empty** — never blank: state names the entity and renders the CLI-equivalent creation command
  (acceptance line 2 extended; *inference: design decision*).
- **Incompatible** — a contribution whose version-suffixed id (`<plugin>/<zone>/v1`, Grafana's
  mechanism — `m2` F13/F16 via S-22) falls outside the host's supported window renders a labelled
  incompatible card (id, declared major, host window) in place of the panel. Never silently
  dropped — a deliberate, argued departure from all surveyed prior art, where every bad-target
  failure is quiet (`m3` X-2).
- **Unauthorized** — two distinct cases: (a) upstream — Aspire deep-links land on `/login`; when
  the browser token is available the helper emits the sanctioned `login?t=` form (`m4` F18),
  otherwise the link is annotated "will prompt for dashboard token"; telemetry-API reads without
  the API key render an unauthorized state naming `Dashboard:Api:AuthMode=ApiKey` (`m4` F20,
  key-acquisition is research OQ5). (b) framework — any panel needing a credential-bearing typed
  client renders a blocked state naming the dependency: `createServiceClient` cannot send
  `Authorization`/`x-api-key` until RFC-A/#1348 (chain ends at #1352) (`b2` F10 via S-13).
- **Failure** — per-contribution error boundary: loud diagnostic panel in dev with component
  stack; host tree never crashes (`m2` F23/F18/F11 — TanStack's missing boundary is the
  cautionary absence). Data-plane failure renders the failed endpoint + source, retry affordance,
  and the correlated structured-logs out-link.

**Per-surface differentiated rows:**

| Surface | Empty | Degraded (honest cases) | Incompatible / Unauthorized / Failure deltas |
| --- | --- | --- | --- |
| Home | First-run: wiring facts all zero → onboarding card with `netscript plugin add …` line | Registry freshness unknown when generators never ran → "never generated" chip, not a stale number | Failure of one stat card never blanks the grid (per-card boundaries) |
| Workers | No jobs → scaffold CLI line | Metrics column hidden entirely if `queryMetrics` returns nothing (`r5` OQ7 unverified) — no empty chart (killed surface) | Execution feed SSE drop → "reconnecting", stale-data timestamp shown |
| Sagas | No instances → scaffold line | History beyond Aspire's 10k-trace eviction window (`m4` F5) → timeline marks "telemetry evicted" for steps whose spans are gone; run-state itself stays (it is not derived from the dashboard store) | — |
| Triggers | No firings yet vs no triggers defined — distinct states | **Contract column: partial** — "~3 of 10 routes contract-bound" rendered as a coverage fraction with a link to the debt entry (`arch-debt.md:424-448` via `b2` F8) | Enable/disable blocked until its contract route exists — button renders disabled with the co-req issue named ("no panel before its route", `b1` #553 rule) |
| Streams | No streams → scaffold line | **Contract-provenance panel has nothing to read: `plugins/streams` has no oRPC contract surface at all** (`arch-debt.md:450-485` via `b2` F8). Renders a labelled "no contract surface — connector is a transparent proxy" state citing the debt entry. Not an empty list, not an error | — |
| Flows | No correlated events for id → "no journey recorded" + which sources were queried | **Two honest degradations:** (1) until the #557 seam-event plane lands, the chain is a correlation-only join over `netscript.correlation.id` — the view labels itself "correlation fidelity" vs "boundary-event fidelity" (`b1` #557); (2) **"see all related logs, filtered" cannot deep-link** — `?filters=` is opaque (`m4` F11), so per-step links use only typed params (`traceId`/`spanId`/`logLevel`) and the UI never promises a filtered-view round-trip | Journey steps whose spans were evicted (`m4` F5) render as chain nodes without trace out-links |
| Contracts | Service with zero contract routes → coverage 0% state (real for streams) | Spec fetch fails per-service → that service row degrades; others render (`m2` F18 posture) | Scalar out-links flagged `unverified` until tag-slug stability (OQ8) closes — helper falls back to `#tag/{tag}` page-level anchor |
| Plugins | No plugins → `netscript plugin add` line | Doctor unavailable (no AppHost running) → axis map renders from static registries; doctor rows show "requires running app" | Duplicate-identity collision (`r3` F9) renders as a loud conflict row, not last-writer-wins silence |
| Generated | Nothing generated → per-generator "never run" + CLI line | Leaked walker registries after remove (`r4` F10) → drift rows with the owning generator named; non-transactional write risk labelled (existence-only assertion, `r4` via S-16) | `migrate`/`seed` confirm dialog shows exact CLI line; DB unreachable → failure state with connection source |
| Automation | #1446 contracts not yet landed (entry criterion: A2b/A3b/A2d — `p2` F1) → the whole surface renders a staged "awaiting runtime-automation contracts" card naming the RFC; this is the surface-level incompatible state | Convergence readable but audit store empty → partial render with per-contract availability chips | Unauthorized: management oRPC requires the RFC-A auth chain; read-only projections state their principal |

## Staged follow-up RFCs

Q12. Each row names consumed contracts, entry criteria, and an owning implementation dependency —
no vague deferrals. Sequencing interacts with owner fork S-2 (#890 spine unbuilt); entry criteria
are stated against board reality, not assumed-built surfaces.

| Follow-up RFC | Scope (seam) | Consumed contracts | Entry criteria | Owning implementation dependency |
| --- | --- | --- | --- | --- |
| **RFC: Fresh UI registry contribution** (charter surface #2) | Plugin-supplied fresh-ui registry items (components/tokens/blocks) generated/copied into userland; safe extension of `fresh-ui` CLI commands | #890 envelope + transactional replace-set registry mechanics (FCB-6/8, `p1` F14 pattern list); `installUiRegistryItems` + `resolveTarget` (`r2`); fresh-ui registry manifest | (1) #890 Waves 0–2 landed (#923–#932, milestone `0.0.9` — currently zero implementation, `p1` F1/F4); (2) the `resolveTarget` containment invariant is fixed with a test — it is an arbitrary-write primitive the moment third parties contribute items (`r2` D3 via S-security); (3) `--registry-root` replace-vs-merge composition decided (`r2` F11); (4) `blocks/` layer exists (#410, currently absent — `b1` F1/D9) | Epic #922 Wave-3 owner (fresh-ui lane); milestone after `0.0.9` |
| **RFC: generic Vite plugin contribution** (charter surface #3) | Third-party/plugin-contributed Vite plugins in the scaffolded app's build; ordering, trust, build determinism, local/JSR resolution, failure containment | The scaffold's `vite.config.ts` template seam — today three hardcoded aliases and a static plugin chain, no contribution seam at all (`r1` F11/F6 via S-1); `createNetScriptVitePlugin` | (1) Research OQ1 closed: does Vite serve the app HTML in a NetScript Fresh 2 app (`m1` F9 — decides whether any injection-style mechanism can exist); (2) owner fork 17 decided: Vite-8 migration (unlocking `@vitejs/devtools-kit`-shaped contracts, `m1` F28/D2) vs staying native on 7.2.2; (3) a minimal safe contract proven by a disposable probe — the charter defers this surface unless proven | `packages/fresh` build-pipeline owner; explicitly **deferred** in the DevTools RFC (T7 records the dev-loop interim: regeneration stays command-triggered, `r4` F6) |
| **RFC: deployment / remote DevTools** | Any DevTools exposure beyond the local dev loop: deployed apps, shared environments, remote access | This RFC's trust-tier contract (T6) — #890 explicitly parked T1/T2 iframe tiers "in the dashboard epic", i.e. here (`p1` F10 via S-2 fork 5); RFC-A auth chain (#1348→#1352, `b2` F10); Aspire deployed posture — custom commands vanish when deployed, standalone mode is part-unsecured (`m4` F14/F22) | (1) Local-only DevTools shipped with **two independent** production-exclusion mechanisms (TanStack's lesson — `m2` F6/F7 via S-22) and the posture "stricter than every system surveyed" ratified (owner fork 18); (2) #1352 auth dogfood landed so a remote principal can exist at all; (3) threat model for remote exposure written (T6) | Deploy-plugin epic (#915–#919, `0.0.14` train) + enterprise-auth lane; never a silent extension of the local host |
| **RFC: MCP HTTP/agent transport** | Exposing `@netscript/mcp` beyond newline-stdio (HTTP/SSE), and the DevTools-vs-agent surface split | 22 v1 tools with typed input+output schemas, `ToolKind` read/mutate/meta, `ToolSuccess\|ToolFailure` (`r5` F17-18); `resolveTelemetryEndpoint` policy (`r5` F22) | (1) Owner fork 19 decided: adopt Aspire's 13.3 precedent — dashboard = human viewer, MCP = agent surface (`m4` F15 via S-19); (2) research OQ4 closed: can the flows compose in-process, or is a transport genuinely required (`r5` OQ2); if in-process suffices for DevTools, this RFC serves *external agents only* | `packages/mcp` owner; DevTools consumes the projection entrypoints in-process meanwhile (`r5` F21) |
| **Declined (not staged): contribute-into-Scalar** | Scalar plugin/extension contributions | — | Rejected with citation: pinned `@scalar/api-reference@1.44.15` predates `pluginUrls` (`m4` F32, D3); the boundary answer is deep-links (`m4` F27-29). A future bundle bump is a dependency decision, not an RFC | Recorded in the RFC's non-goals beside the killed-surfaces list |

Coordination notes (not new RFCs): the **seam-event flow plane** (#557) stays a co-requisite
backend slice of the journey view, not a separate RFC (`b1` #557); **`plugin dev`** invention is
T7's decision inside this RFC (`r4` F6 via S-15); the **RFC-home question** for these follow-ups
inherits owner fork 2 / issue #1380's scheduled `0.0.6` resolution (`b2` F9) — each staged RFC
files a tracking issue per the live house pattern and records the location choice.

## Open questions for the owner

1. **URL contract ratification.** This pack recommends the nested entity-URL scheme
   (routing-resort P1/P7) and supersession of #424's flat scheme — the board's one recorded
   contradiction (`b1` F9/D4). The resort was committed via #685 but never ratified (`b1` F5).
   Confirm this RFC is the ratification vehicle, or name another.
2. **Loud-failure departure.** Rendering labelled incompatible/degraded cards departs from every
   surveyed system's quiet failure (`m3` X-2). It costs shell complexity per state. Confirm the
   departure (recommended: yes — the operator *is* the author, `m3` separation table).
3. **Empty-state CLI-equivalent lines** extend acceptance line 2 beyond mutations. Cheap, but it
   makes the CLI-line renderer a dependency of every surface's empty state. Confirm or downgrade
   to recommended-not-required.
4. **`automation/` staging posture.** The surface renders a staged placeholder until #1446's
   A2b/A3b/A2d land (`p2` F1). Alternative: omit the segment entirely until then. Placeholder is
   recommended — it documents the boundary in the product itself (*inference*).
5. **Follow-up-RFC sequencing vs owner fork 1** (S-2): if the owner picks "self-contained DevTools
   family" over "depend on #890's spine", the Fresh-UI-contribution RFC's entry criterion (1)
   changes from "#890 Waves 0–2 landed" to "DevTools envelope ratified" — the fork propagates here
   and should be decided once, not per-RFC.
6. **Scalar tag stability** (research OQ8) and **PublicUrl/browser-token acquisition** (research
   OQ5) are the two unverified hinges inside the deep-link helper. Both are cheap probes; confirm
   they run before the helper's contract freezes.

## Sources

Corpus files (each carrying its own `path:line` / artifact / `gh` citations), all under
`.llm/runs/plan-devtools-contribution--seed/research/`:

- `b1-dashboard-board.md` — F1, F3 (#400 body: thesis, three acceptance lines, killed surfaces),
  F4 (#410–#432, #551–#557 inventory), F5 (routing resort + authority reading), F9/D4 (#424
  contradiction), #553 "no panel before its route" rule, disposition table.
- `m4-aspire-scalar.md` — F5 (telemetry eviction), F6–F12 (deep-link grammars, `PublicUrl`,
  opaque `?filters=`), F13–F15 (no extension point; commands vanish deployed; Copilot removal),
  F18 (`login?t=`), F20 (API key), F27–F29 (Scalar anchors, tag-slug inference), F32/D3
  (`pluginUrls` absent from pinned bundle), boundary table, D5 (no helper exists).
- `r5-observability-boundary.md` — F8-9 (no deep-link helper), F12-13 (`netscript.*` domains,
  correlation id), F17-18 (MCP tool contracts), F21 (openapi-projection), F22 (endpoint
  resolution + `source`), F23 (stdio-only), F30-31 (`/design` precedent), OQ5, OQ7, drift 1
  (template reimplements instead of consuming — the trap this IA must not repeat).
- `m1-nuxt-vite.md` — F16/C2 (`category`/`defaultOrder`/`groupId`/`when`, orphan fallback), F17
  (handle update), F9 (`transformIndexHtml` failure bucket), F28/D2 (Vite-8 floor), applicability
  verdict.
- `m3-admin-consoles.md` — M-2/X-1 (closed zone vocabulary), M-8 (ordering unsolved), X-2 (quiet
  failure everywhere), separation table (Q4 verdict, data-freshness row).
- `b2-doctrine-and-live-board.md` — F4 (R-FOLD-LAYERING-MODE, cardinality), F5 (AP-21 and the
  ranked AP list), F8 (streams/triggers contract debt, `arch-debt.md:424-485`), F10 (RFC-A blocks
  auth propagation; #1348), F9 (RFC home / #1380), F12 (SCOPE-frontend false-done states).
- `m2-tanstack-grafana.md` via `SYNTHESIS-NOTES.md` S-22 — error boundary, version-suffixed ids,
  degrade-not-throw, dual production exclusion, `install-devtools` warning.
- `p1-rfc-890-frontend-contrib.md` via S-2 — zero implementation; pattern-vs-payload split; parked
  trust tiers.
- `p2-rfc-1446-runtime-automation.md` — F1-F3 (P-6 row, four contracts, decision sentence, entry
  criterion).
- `r1`–`r4` via `SYNTHESIS-NOTES.md` S-1, S-15–S-17 — no plugin→UI channel; `plugin dev` absent;
  dual registry generators; doctor contributed-checks seam.
- `research.md` — findings F1–F26, stage-C resolutions R1–R5, owner-fork register.
- Charter: `.llm/devtools-rfc-orchestrator-brief.md` (Q9 at :150-153, Q12 at :159-161,
  five-surface framing at :103-121); run docket `plan.md:105,108`.
