# Beta.10 Dev-Dashboard ⇄ Prototype Coverage Matrix (Axis 4)

> Analyst pass for umbrella PR #685 / branch `design/ddr-s6-coverage`. Analysis only.
> Bidirectional coverage between the beta.10 dev-dashboard issue set
> (`reference/beta10-epic-issues.json`) and the design prototype (`screen-catalog.md`),
> grounded in the locked routing hierarchy (`analysis/routing-resort.md`), the Axis-6
> extension architecture (`analysis/plugin-extension-architecture.md`), and the adversarial
> UX/DX verdict (`analysis/codex-ux-dx-verdict.md`).

## Legend

- **Coverage grade** (Direction A): `covered` = a prototype screen/element fully carries the
  issue's intent · `partial` = present but thin, or only as an out-link/dogfood chip · `absent`
  = backend/plumbing with no screen, or a capability the prototype does not show · `n/a` =
  gate/tooling, not a renderable surface.
- **⚠ extends / ✗ contradicts**: the revamp analyses materially widen or conflict with the
  issue's current scope — must be reflected in the issue.

---

## Direction A — issue → prototype

| # | Handle / title | Prototype coverage | Grade | What the REVAMP must add (locked routes + analyses) |
|---|---|---|---|---|
| **#400** | epic: Dev Dashboard (umbrella) | Whole prototype = the three pillars (Observe/Manage/Follow) | covered (umbrella) | ⚠ Adopt full Axis-2 hierarchy; own the **AI console** and **Auth Sessions** screens (no sub-issue owns them today); own the **/extensions** management surface. |
| **#410** | DDX-0 fresh-ui L3 `blocks/` + copy-source registry | ns-* blocks in use (breadcrumbs, context-rail, tree-nav, entity-rail, activity-feed, connector) | partial (indirect) | ⚠ Promote-set must grow the revamp's new primitives: `ns-journey`, `ns-verchain`, `ns-diff`, `ns-axismap`, `ns-achain`, entity breadcrumb resolver, sidebar-badge block, provenance-chip, trust-tier badge, injection-zone overlay. |
| **#411** | DDX-1 @netscript/aspire `command`+`app` kinds | Aspire out-links / "Open in Aspire" / withCommand actions | absent (backend seam) | Confirm-with-CLI actions bind `withCommand` refs (extension `DashboardActionContribution.invoke.aspireCommand`); no owned screen. |
| **#412** | DDX-2 plugin-dashboard-core scaffold + contract seam | Domain models render across every screen | absent as screen (implied) | ⚠ Extension architecture widens the model set: the **7-member `DashboardContribution` union** + `InjectionZone` enum live in `contracts/v1` — a material scope-addition to #412's owned models. |
| **#413** | DDX-3 TelemetryQueryPort + aspire-query adapter | "View trace"/"View raw trace" out-links (S6/S13/consoles) | covered (out-link) | Preserve-context handoffs (correlation/time/return URL) per UX change #14; stays correlation-only. |
| **#414** | DDX-4 plugins/dashboard thin plugin + E2E join | "Dashboard-is-a-plugin" proof (S1 contributed-panels table) | absent (backend) | Add a `GET /contributions` consumer proof; no new screen. |
| **#415** | DDX-5 Shell + app-registration + IA → **S1** | S1 home fully designed (stats-grid, ⌘K, envbar, panels table) | covered | ⚠ **Axis-2 rebuild**: sidebar mirrors the route tree (Overview/Capabilities/Data/System, Plugins heads Capabilities), badges from derived stats, breadcrumbs from pathname, `_app`/`_layout` split, quick-action strip. |
| **#416** | DDX-6 Stack Map → **S2** | S2 config (ns-stackmap graph, tree-nav, coverage badges, out-links) | covered | ⚠ Add `/config/nodes/[nodeId]` (`?tab=wiring\|telemetry`), `?node=` addressable selection, live-traffic edge overlay, **layered config provenance** (why a value won). |
| **#417** | DDX-7 Service Catalog → **S4** | S4 catalog (provenance table, duality chips, route-wiring tab, Scalar out-links) | covered | ⚠ Add `/catalog/procedures/[procedureId]` detail; sell **duality as a workflow** (shared schema, generated clients, consumers, drift) and **typed route contracts** (both currently thin/absent). `?tab=procedures\|routes`. |
| **#418** | DDX-8 **S13 Live Flow** (flagship #2) | S13 flows (three-zone causal seam chain, payloads, out-links) | covered | ⚠ Promote the correlation id to a **first-class `/flow/[correlationId]` journey URL**; add list search + saved investigation; **purge "boundary events land in beta.7" prose** (Axis-1 violation → depends #557). |
| **#419** | DDX-9 Run Inspector → **S6** | S6 runs (cross-primitive list, step timeline, altitudes, log strip) | covered | ⚠ Add `/runs/[correlationId]` (`?view=all\|compact\|json`), URL-owned list state, bidirectional cross-link to `/flow`. |
| **#420** | DDX-10 Plugin Control → **S5** | S5 plugins (table, ns-axismap, doctor rows, drift, gated create) | covered | ⚠ **Materially extended by Axis 6**: becomes the **Extension Manager** — trust-tier badges, three-fact drift (package/contract/peer), granted-permissions + revoke, `/plugins/[pluginId]` (`?tab=overview\|axes\|doctor\|config`), axis-map as clickable nav, marketplace-lite. |
| **#423** | DDX-13 Introspection `/_netscript/*` | Read plane feeding every screen | covered (implied) | ⚠ Must serve **per-entity-detail reads** for the ~22 new levels (job execution, saga-instance-by-correlation, trigger event, stream subscriber, override, version, procedure, migration, DLQ message, auth session) + `GET /contributions`. Path list widens. |
| **#424** | DDX-14 CLI + deep-link URL scheme | Aspire `WithUrl`/out-link affordances | partial | ✗ **CONTRADICTION**: #424's stable scheme (`/`, `/resource/{name}`, `/workers`, `/plugins/{id}`, `/config`) is **flatter than the locked hierarchy**. Deep-links/generator emission must adopt `/workers/jobs/:jobId/executions/:execId`, `/flow/:correlationId`, etc., and carry context. |
| **#426** | DDX-16 E2E join + panel smoke | — | n/a (gate) | E2E must assert new entity routes + journey URL resolve, and a contributed extension renders; maintain the issue↔route acceptance ledger (UX verdict Axis 4). |
| **#427** | DDX-17 DashboardPanelContribution seam | S1 contributed-panels table + S5 axis map | partial | ⚠ **Materially extended by Axis 6**: one panel member → **7-member family** (panel/route/action/ai-tool/nav/entity-tab/home-card) + injection-zone enum + trust tiers + `/extensions` manager + zone inspector + provenance chips + permission prompt + quarantined state. |
| **#428** | DDX-18a **Workers** → **S7** | S7 workers (registry, exec feed, step timeline, scheduler-drift) | partial | ⚠ **Split Jobs vs polyglot Tasks** (Deno/Python/Shell/PowerShell/.NET) — absent in prototype (generic rows). Add `/workers/jobs`+`/workers/tasks` roots, `…/executions/[executionId]` leaves, `?runtime=` filter, rerun/cancel manage loop. |
| **#429** | DDX-18b **Sagas** → **S8** | S8 sagas (instance table, from→to timeline, compensation branch) | covered | ⚠ Add `/sagas/[sagaName]` + `/sagas/[sagaName]/[correlationId]` (2nd param = correlation id), `?tab=history\|executions\|payload`, gated replay/compensate, URL list state. |
| **#430** | DDX-18c **Triggers** → **S9** | S9 triggers (firing feed, action chains, enable/disable, preview, webhook-test) | covered | ⚠ Add `/triggers/[triggerId]/events/[eventId]` (eventId = correlation UUID) with linked action outcomes; sell **all 8 trigger types**; DLQ tab (dep #554); AI-drafted trigger loop (Axis 5). |
| **#431** | DDX-18d **Streams** → **S10** | S10 streams (delivery feed, fan-out timeline, "read-model not wired" empty state) | partial | ⚠ Add `/streams/[streamId]/subscribers/[subscriberId]`; **show the wired final surface** (Axis-1: the "read-model not wired" empty state is honest-for-beta.6 but must render shipped); replay/retention/lag. |
| **#432** | DDX-19 Codegen-from-UI Add-resource | S5 "create from template" (gated, beta.7 prose) | partial | ⚠ **Management keystone + Axis-1 violation**: build the full **template-gallery → file-diff preview → confirm-CLI → success** loop (one generator, two callers); every console gets "New X from template". |
| **#507** | Design prototype + design-sync | The prototype itself (this run's ground truth) | covered | This umbrella #685 IS the revamp of #507's prototype; #507 acceptance ("all rescoped screens prototyped") met — revamp adds routing/AI/extensions/writes #507 did not fully carry. |
| **#509** | fresh-ui pixel-perfect registry revamp | `/design` audit surfaced skeleton/code-block gaps | covered | ⚠ Registry must gain the revamp's new components (see #410 row) at the pixel-perfect bar, light+dark+mobile. Sibling of #410. |
| **#551** | DDX-20 **S3 Runtime-Config** (flagship) | S3 runtime (feed, stat grid, version chain, gated write-back) | covered | ⚠ Add `/runtime/overrides/[overrideKey]`, `/runtime/versions/[version]`; **show write-back live** (Axis-1, dep #556); full audit/rollback/compare/reason workspace (UX change #12). |
| **#552** | DDX-21 **S11 Migrations** | S11 migrations (table, drift alert, introspect diff, run-migrate CLI) | covered | ⚠ Add `/migrations/[migrationId]` detail; show migrate+seed live (Axis-1); richer schema diff/history. |
| **#553** | DDX-22 **S12 DLQ** | S12 dlq (depth grid, message table, reprocess confirm, "Preview" framing) | partial | ⚠ **Axis-1**: show the FINAL shipped surface (drop "contract routes pending"); add `/dlq/[queueId]` + `…/messages/[messageId]`, `?selected=` addressable multi-select; backend portability. Dep #554/#555. |
| **#554** | TriggerDlqPort contract route (co-req) | Feeds S9 DLQ tab + S12 trigger tab | absent (backend) | Ship so the S9/S12 trigger-DLQ surfaces render as final (Axis-1). |
| **#555** | DeadLetterStore CLI + contract API (co-req) | Feeds S12 queue tab | absent (backend) | Ship so the S12 queue-DLQ surface renders as final (Axis-1). |
| **#556** | runtime-config mutation use-cases (co-req) | Feeds S3 write-back | absent (backend) | Ship so S3 flag-flip/disable write-back renders live (Axis-1/Axis-3). |
| **#557** | DDX-23 seam-event flow plane (co-req) | Feeds S13 fidelity | absent (backend) | Ship so S13 renders at boundary-event fidelity — **direct fix for the S13 "beta.7" Axis-1 violation**. |

### Notes on scope extension / contradiction (Direction A)

- **✗ #424** is the one true contradiction: its locked URL scheme predates the routing resort and
  must be regenerated to the `analysis/routing-resort.md §2/§7` tree (entity + sub-entity levels,
  `/flow/:correlationId`). Generator emission (`WithUrl`/`withCommand`) targets the new roots.
- **⚠ Large scope extensions**: #420 + #427 (→ full Axis-6 extension system), #428 (→ Jobs/Tasks
  polyglot split), #432 (→ scaffold-preview write loop), #412 + #423 (→ contribution model + new
  entity-detail reads), #418/#419 (→ correlation-journey URLs).
- **Backend-only** (no screen, expected): #411 #412 #413 #414 #423 #426 #554 #555 #556 #557.

---

## Direction B — prototype surface → owning issue

### B.1 The 15 prototype screens

| Screen (route) | Owning issue(s) | Owned? |
|---|---|---|
| S1 `home` | #415 (+#427 dogfood, #423 data) | ✅ |
| S2 `config` | #416 (+#423) | ✅ |
| S3 `runtime` | #551 (+#556 write, #423) | ✅ |
| S13 `flows` | #418 (+#557 fidelity, #413 out-link) | ✅ |
| S4 `catalog` | #417 (+#423) | ✅ |
| S5 `plugins` | #420 (+#427 seam, #432 create) | ✅ |
| S6 `runs` | #419 (+#413) | ✅ |
| S7 `workers` | #428 (+#419 shape) | ✅ (Tasks split unowned — see B.3) |
| S8 `sagas` | #429 | ✅ |
| S9 `triggers` | #430 (+#554 DLQ) | ✅ |
| S10 `streams` | #431 | ✅ |
| **`ai`** (new) | — | ❌ **NO OWNER** (cross-epic #238; Axis-5) |
| S11 `migrations` | #552 | ✅ |
| S12 `dlq` | #553 (+#554/#555) | ✅ |
| **`authc`** (new) | — | ❌ **NO OWNER** (plugin-auth-core; no dev-dashboard issue) |

### B.2 The new entity/sub-entity levels (routing-resort §2) + Axis-6 surface

| Route level | Owning issue | Owned? |
|---|---|---|
| `/config/nodes/[nodeId]` | #416 | ⚠ partial (issue lacks detail route) |
| `/runtime/overrides/[overrideKey]`, `/runtime/versions/[version]` | #551 | ⚠ partial |
| `/catalog/procedures/[procedureId]` | #417 | ⚠ partial |
| `/flow/[correlationId]` ★ journey | #418 | ⚠ partial (no journey-URL concept in issue) |
| `/runs/[correlationId]` | #419 | ⚠ partial |
| `/plugins/[pluginId]` (+`?tab=axes` nav) | #420 | ⚠ partial |
| `/workers/jobs`, `…/[jobId]`, `…/executions/[executionId]` | #428 | ⚠ partial |
| `/workers/tasks`, `…/[taskId]`, `…/executions/[executionId]` | #428 | ❌ **unowned** (Tasks split absent) |
| `/sagas/[sagaName]`, `/sagas/[sagaName]/[correlationId]` | #429 | ⚠ partial |
| `/triggers/[triggerId]`, `…/events/[eventId]` | #430 | ⚠ partial |
| `/streams/[streamId]`, `…/subscribers/[subscriberId]` | #431 | ⚠ partial |
| `/ai/runs/[runId]` | — | ❌ **NO OWNER** (AI gap) |
| `/migrations/[migrationId]` | #552 | ⚠ partial |
| `/dlq/[queueId]`, `…/messages/[messageId]` | #553 | ⚠ partial |
| `/auth/sessions/[sessionId]` | — | ❌ **NO OWNER** (Auth gap) |
| **`/extensions`, `/extensions/[extensionId]`** | #427 (seam) / #420 (mkt-lite) | ❌ **management surface unowned** (Axis-6 §6) |

### B.3 Cross-cutting surfaces / patterns

| Surface / pattern | Owning issue | Owned? |
|---|---|---|
| Addressable routing hierarchy (the tree itself, breadcrumbs, URL list-state) | #415 IA + #424 scheme, spread across all console issues | ❌ **no single owner** (Axis-2 rebuild) |
| Correlation-ID spine (one id everywhere) | #418/#419 + #412 (`RunRecord`) | ✅ |
| Confirm-with-CLI on every mutation | epic line 2 / #424 | ✅ |
| Injection-zone inspector / provenance chips / trust tiers | #427 | ⚠ partial (big Axis-6 extension) |
| AI contextual assists (home summary → distributed) | — | ❌ **NO OWNER** (Axis-5) |
| Scaffold-from-UI write loop (plan→diff→CLI→result) | #432 | ⚠ partial |

---

## Gap summary (both directions)

### Direction A gaps (issues weakly covered, extended, or contradicted)

| # | Issue | Gap type | Action |
|---|---|---|---|
| #424 | URL scheme | ✗ contradicted by locked hierarchy | **Augment** #424: regenerate deep-links/generator to routing-resort §2 tree |
| #428 | Workers | partial — Jobs/Tasks polyglot split absent | **Augment** #428: split roots + `?runtime=` + execution leaves |
| #427 | Panel seam | partial — 1 member vs 7-member family | **Augment** #427: full contribution family + zones + trust tiers |
| #420 | Plugins | covered but extension lifecycle absent | **Augment** #420: Extension Manager (trust/permission/revoke/detail) |
| #432 | Add-resource | partial + Axis-1 gated prose | **Augment** #432: scaffold-preview write loop, un-gate |
| #418/#551/#553 | Flow/Runtime/DLQ | Axis-1 future-beta prose to purge | **Augment**: show final surface (dep #557/#556/#554-555) |

### Direction B gaps (surfaces with no / weak owning issue)

| Surface | Gap | Recommended action (prefer augment) |
|---|---|---|
| **AI console** (`ai` + `/ai/runs/:runId` + distributed assists) | No dev-dashboard issue owns Axis-5 | **Augment #400 epic** to own the AI-surface screen as beta.10 scope, or scope-add under cross-epic #238; do **not** leave it screen-only. Flag as the single biggest ownership gap. |
| **Auth Sessions** (`auth` + `/auth/sessions/:sessionId`) | No dev-dashboard issue | **Augment #400** or file one focused issue (auth-as-durable-projection console) — only if augmentation is refused. |
| **`/extensions` management surface** | Axis-6 §6 UI surfaces (manager, zone inspector, permission prompt) unowned | **Augment #427 + #420** to jointly own `/extensions`; the seam (#427) + host (#420) already touch it. |
| **Addressable entity-detail routing (~22 levels)** | No issue owns the entity-URL tree | **Augment each console issue** (#416/#417/#419/#428/#429/#430/#431/#551/#552/#553) with its detail routes + **#415/#424** for the shared IA/scheme. |
| **Professional URL-owned list state + breadcrumbs** | Filters/sort/page/saved-views/breadcrumb-from-pathname unowned | **Augment #415** (breadcrumbs/IA) + each console issue (URL list state). |

**Bottom line:** every prototype *console* screen has an owner and every issue with a UI has a
screen; the real gaps are (1) three surfaces the revamp adds — AI, Auth, /extensions — that no
beta.10 issue owns, (2) the ~22 addressable entity levels that extend every console issue, and
(3) #424's URL scheme, which the locked hierarchy contradicts and must supersede. Preference is
to **augment existing issues** (mainly #400, #415, #420, #424, #427, #428, #432 and the per-console
detail routes); a net-new issue is justified only for Auth if #400 augmentation is refused.
