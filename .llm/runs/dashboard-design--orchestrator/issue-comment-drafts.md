# Issue-context augmentation comments (ready to post)

> Drafts produced by the dev-dashboard design-revamp cross-coverage pass (umbrella PR #685).
> The supervisor posts these; this file is analysis only. **Public framing** — no internal
> reference-app names, no confidential material ("the internal reference apps" if a source must
> be cited). Each comment ≤ ~20 lines. Ordered by issue number.

---

## #400 — epic: Dev Dashboard

**Design-revamp cross-coverage (PR #685).** The revamp locks an enterprise routing hierarchy and
a distributed-AI + extension story on top of the rescoped screen set. Three surfaces the prototype
now designs have **no owning sub-issue** and need a home in beta.10 scope:
- **AI console** — durable agent runs on the correlation spine + distributed contextual assists
  (explain-failure, propose-override, draft-trigger). Today only a cross-epic reference exists.
- **Auth Sessions** — auth-as-durable-projection debugger (session table + `auth.*` event stream).
- **`/extensions` management surface** — the Axis-6 extension manager (installed panels/actions,
  permissions, zone inspector), beyond the #427 seam and #420 marketplace-lite.

Recommendation: own AI + Auth + /extensions here (or delegate to focused sub-issues) rather than
leaving them screen-only. Full matrix: `coverage-matrix.md` in PR #685.

---

## #415 — DDX-5 Shell + IA (S1)

**Design-revamp (PR #685).** S1 is fully designed, but the revamp turns the shell into the Axis-2
carrier. The locked routing hierarchy requires the shell to:
- Render a **sidebar that mirrors the route tree** in four groups — Overview / Capabilities / Data /
  System — with **Plugins heading Capabilities** as the registry/host, `matchPrefix` active-state,
  and per-item **badges from live derived stats** (unwired nodes, compensating sagas, pending
  migrations, etc.).
- Derive **breadcrumbs purely from the pathname** with an entity-id→display-name resolver.
- Split root chrome into `_app` (document) + persistent `_layout` (sidebar/topbar/⌘K) so nav swaps
  keep the shell.
- Add the quick-action strip mirroring top CLI verbs as deep-links into gated actions.

Reference bar: `analysis/routing-resort.md §3` (sidebar) + `§4` (breadcrumbs). PR #685.

---

## #416 — DDX-6 Stack Map (S2)

**Design-revamp (PR #685).** Beyond the capability-wiring graph already scoped, the revamp adds:
- An addressable node detail route **`/config/nodes/[nodeId]`** (`?tab=wiring|telemetry`) and
  deep-linkable selection via `?node=` — no more in-memory selection.
- The live-traffic edge overlay pulsing declared-vs-flowing wiring (read-only, from the flows feed).
- **Layered config provenance**: the node detail should explain source precedence — *why a value
  won* — not just show the resolved value.

Reference routes: `analysis/routing-resort.md §2 (overview)`. PR #685.

---

## #417 — DDX-7 Service Catalog (S4)

**Design-revamp (PR #685).** The catalog holds its provenance/coverage/duality intent, but the
revamp upgrades chips into workflows:
- Add an addressable **`/catalog/procedures/[procedureId]`** detail (`?tab=procedures|routes`,
  `?coverage=`, `?duality=`, `?search=`).
- Sell **REST/RPC/SDK duality as a workflow** — one procedure, shared schema, generated clients,
  route/RPC parity, drift, "open consumer code" — not a lone chip.
- Surface **typed route contracts** (compile-time path/search inference), currently invisible.
- Keep the try-it hand-off to Scalar (satellite boundary unchanged).

Reference: `analysis/codex-ux-dx-verdict.md` change #7. PR #685.

---

## #418 — DDX-8 S13 Live Flow

**Design-revamp (PR #685).** S13 remains the flagship causal seam chain (not a waterfall). Two
required upgrades:
- Promote the correlation id to a **first-class journey URL `/flow/[correlationId]`** — the
  selected flow becomes bookmarkable/shareable, every seam node cross-links to its entity detail
  and to Aspire's trace out-link. This is the single biggest routing upgrade.
- Add flow-list search + saved investigation; filters/status/follow live in the query string.
- **Purge the "boundary events land in beta.7" prose** (Axis-1: the design shows the final product).
  The boundary-event fidelity is co-req #557 — S13 renders as if shipped.

Reference: `analysis/routing-resort.md §5` (journey spine). PR #685.

---

## #419 — DDX-9 Run Inspector (S6)

**Design-revamp (PR #685).** S6 stays the run-centric counterpart of S13. Adds:
- **`/runs/[correlationId]`** with `?view=all|compact|json` altitude in the URL; Flow and Runs are
  two renderings of one id and cross-link bidirectionally.
- **Professional URL-owned list state** — `?kind`/`?status`/`?from`/`?to`/`?page`/`?sort`/`?order`
  — replacing in-memory selection (saved/shareable/refresh-safe investigations).

Reference: `analysis/routing-resort.md §2/§5`; UX change #8. PR #685.

---

## #420 — DDX-10 Plugin Control (S5)

**Design-revamp (PR #685).** S5 is materially extended by the Axis-6 extension system — it becomes
the **Extension Manager**, not just a registry table:
- Per-plugin **trust-tier badge** (first-party / verified / sandboxed) and a **three-fact version
  block**: package drift (vs latest registry), **contract drift** (contributed-to vs host window),
  peer drift — each with its remediation CLI line.
- **Granted-permissions list with revoke**; a doctor row for the new dashboard-contribution check.
- Addressable **`/plugins/[pluginId]`** (`?tab=overview|axes|doctor|config`) with the
  **contribution-axis map as clickable navigation** into the sections a plugin contributes.
- Marketplace-lite "Add plugin" (browse/install with confirm + CLI), post-install toast linking new
  surfaces.

Reference: `analysis/plugin-extension-architecture.md §6` (#1,#2,#4). PR #685.

---

## #423 — DDX-13 Introspection `/_netscript/*`

**Design-revamp (PR #685).** The routing resort and the extension architecture widen the read
plane. Beyond the currently-listed paths, `/_netscript/*` must serve:
- **Per-entity-detail reads** for the ~22 new addressable levels — job/task execution detail,
  saga-instance-by-correlation, trigger event, stream subscriber, config node, override, config
  version, procedure, migration, DLQ message, auth session, agent run.
- **`GET /_netscript/contributions`** — the generated dashboard-contribution registry (one source
  of truth for the UI, doctor, and AI tool registry).

These stay read-only GET/SSE over already-shipped contracts; mounting is the work. Reference:
`analysis/routing-resort.md §2`, `plugin-extension-architecture.md §2.1`. PR #685.

---

## #424 — DDX-14 CLI + deep-link URL scheme

**Design-revamp (PR #685) — scope correction.** The stable URL scheme in this issue
(`/`, `/resource/{name}`, `/workers`, `/plugins/{id}`, `/config`) is **flatter than the now-locked
routing hierarchy** and must be superseded by it:
- Deep-links and the generator emission (`WithUrl`/`withCommand`) target the entity tree —
  e.g. `/workers/jobs/:jobId/executions/:execId`, `/sagas/:sagaName/:correlationId`,
  `/triggers/:triggerId/events/:eventId`, and the **`/flow/:correlationId` journey**.
- Out-links to Aspire/Scalar should **preserve context** (correlation id, time range, return URL).

The URL-scheme table here becomes a pointer to `analysis/routing-resort.md §2/§7` (the full
old→new mapping). PR #685.

---

## #427 — DDX-17 DashboardPanelContribution seam

**Design-revamp (PR #685).** The Axis-6 investigation extends this single-member seam into a
**contribution contract family** (still owned by `plugin-dashboard-core/contracts/v1`, still
generated-registry discovery, `@netscript/plugin` gains no axis):
- Seven members: panel / route / action / ai-tool / nav / entity-tab / home-card.
- A published, versioned **injection-zone enum** (adding zones = additive/minor) + a debuggable
  **zone inspector** overlay.
- **Trust tiers** (T0 first-party island now; T1/T2 sandbox designed as shipped), a
  `contributesTo` version handshake surfaced as contract-drift, and a **quarantined panel state**
  for drifted/crashed contributions.

The design shows all of it as final product. Reference: `analysis/plugin-extension-architecture.md`
§1–§4, §6. PR #685.

---

## #428 — DDX-18a Workers (S7)

**Design-revamp (PR #685).** The prototype renders Workers as a generic job registry; the revamp
sells NetScript's most differentiated invisible capability:
- **Split Jobs vs polyglot Tasks** — Tasks carry a runtime badge (Deno / Python / Shell /
  PowerShell / .NET) and a `?runtime=` filter.
- Addressable levels: `/workers/jobs`, `/workers/jobs/[jobId]`,
  `/workers/jobs/[jobId]/executions/[executionId]` — mirrored for tasks.
- Manage loop: rerun a failed execution / cancel a running one where the 21-route contract exposes
  it (missing verbs = explicit gaps, not new backend); per-job settings tab reading S3 overrides.

Reference: `analysis/routing-resort.md §2.1`; UX change #3. PR #685.

---

## #429 — DDX-18b Sagas (S8)

**Design-revamp (PR #685).** Compensation legibility is already strong. Add:
- `/sagas/[sagaName]` (definition → instances) and **`/sagas/[sagaName]/[correlationId]`** where
  the **second param is the correlation id** — `?tab=history|executions|payload`; "Open full
  journey" → `/flow/:correlationId`.
- URL-owned list state (`?status=active|completed|failed|pending|compensating`, `?topic=`, `?page=`).
- Gated **replay / compensate-now** only where the saga contract already exposes the mutation
  (else flag as a thin co-req, no invented write path).

Reference: `analysis/routing-resort.md §2.1/§5`. PR #685.

---

## #430 — DDX-18c Triggers (S9)

**Design-revamp (PR #685).** S9 is the reference manage-loop screen. Add:
- **`/triggers/[triggerId]/events/[eventId]`** where `eventId` is the correlation UUID; the event's
  action chain deep-links each outcome (enqueueJob → execution, publishSaga → instance,
  executeTask → task execution).
- Sell **all 8 trigger types** (file/webhook/schedule/cron/kv/polling/composite/manual) via a
  `?type=` filter, not just schedule/webhook.
- `?tab=events|schedule|config` on the detail; DLQ tab gated on co-req #554.
- Axis-5 tie: AI-drafted trigger authoring (typed diff → simulate next fires → confirm CLI).

Reference: `analysis/routing-resort.md §2.1`; UX change #11. PR #685.

---

## #431 — DDX-18d Streams (S10)

**Design-revamp (PR #685).** Add `/streams/[streamId]` (`?tab=deliveries|subscribers|wiring`) and
**`/streams/[streamId]/subscribers/[subscriberId]`** delivery detail. Extend with replay /
retention / lag surfaces (currently absent).

**Axis-1 note:** the prototype's honest "read-model not wired" empty state is correct for build
reality but the revamp must render the **final wired surface** — confirm the delivery/fan-out
read-model against `plugin-streams-core` at build time (per the issue's own verification gate) and
design as shipped. Reference: `analysis/routing-resort.md §8` (streams entity tree caveat). PR #685.

---

## #432 — DDX-19 Codegen-from-UI Add-resource

**Design-revamp (PR #685).** This is the management keystone and an Axis-1 fix. The prototype only
shows gated "create from template" buttons with beta.7 prose; the revamp designs the **full write
loop as shipped**:
- Template gallery → **file-diff preview** (the exact generated file list — `ScaffoldResult` is
  data, so a dry-run diff is free) → **confirm dialog printing the exact CLI equivalent** →
  success state linking the generated files.
- One generator, two callers: identical artifacts whether triggered from the CLI or the button
  (typesafe factory/AST codegen, never string templates).
- Every capability console gets its "New X from template" entry (jobs/sagas/triggers/streams/plugins).

Reference: `analysis/plugin-extension-architecture.md §5/§6` (#10); UX change #4. PR #685.

---

## #551 — DDX-20 S3 Runtime-Config (flagship)

**Design-revamp (PR #685).** S3 stays the strongest screen; the revamp makes it addressable and
final:
- `/runtime/overrides/[overrideKey]` and `/runtime/versions/[version]` (snapshot + diff) as
  bookmarkable routes; `?follow=1`, `?scope=` in the URL.
- **Write-back shown live** (Axis-1: no beta.7 gating tooltip) — flip flag / disable job / clear
  override behind confirm + CLI, round-tripping through the store the watcher observes. Depends on
  co-req #556.
- Grow toward a full audit/rollback workspace: arbitrary version compare, author/reason, impacted
  capabilities, rollback/unset.

Reference: UX change #12; `routing-resort.md §2`. PR #685.

---

## #552 — DDX-21 S11 Migrations

**Design-revamp (PR #685).** Add `/migrations/[migrationId]` detail (introspect diff). Show
**Run migrate + Run seed as live confirm-CLI actions** (Axis-1: no gating prose). Consider richer
schema diff/history toward Studio-grade parity. `?status=pending|applied` in the URL. PR #685.

---

## #553 — DDX-22 S12 Dead-Letter Queues

**Design-revamp (PR #685) — Axis-1.** The prototype's "Preview — contract routes pending" framing
must be replaced with the **final shipped surface**. Add:
- `/dlq/[queueId]` and `/dlq/[queueId]/messages/[messageId]`; `?tab=queue|trigger`, `?backend=`.
- **Addressable multi-select** `?selected=<id,…>` so a confirm-gated "Reprocess selected" (naming
  backend + count + CLI) is shareable/reloadable.
- Sell backend portability (KV/Redis/Postgres) as an operational property, with batch safety.

Depends on co-req routes #554 (trigger) + #555 (queue). PR #685.

---

## #556 — runtime-config mutation use-cases (S3 write co-req)

**Design-revamp (PR #685).** The revamp designs S3 (#551) write-back **as shipped** (Axis-1), so
this co-req is on the critical path for the flagship screen's final-product framing: set/unset an
override + versioned `current` pointer bump, one write path the watcher observes, CLI-equivalent
surfaced. PR #685 references this as the dependency behind the live S3 write controls.

---

## #557 — DDX-23 seam-event flow plane (S13 co-req)

**Design-revamp (PR #685).** The revamp **removes S13's "boundary events land in beta.7" prose**
(Axis-1) and renders the Live Flow chain starting at the HTTP boundary as if shipped — which makes
this seam-event envelope + HTTP boundary-event co-req the fidelity dependency behind the flagship
flow screen. PR #685 references this as S13's boundary-fidelity dependency.
