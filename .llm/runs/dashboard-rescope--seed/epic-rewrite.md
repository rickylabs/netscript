# Epic #400 — Full Replacement Body (draft, owner ratifies)

Apply with: `gh issue edit 400 --repo rickylabs/netscript --body-file <this body>` (strip this header section; the body starts at the `## Summary` line below the rule).
Labels (unchanged): `type:umbrella`, `epic:dev-dashboard`, `area:plugins`, `area:aspire`, `area:fresh-ui`, `area:telemetry`, `priority:p1`, `wave:v1`, exactly one `status:` (set `status:plan`). Milestone: `0.0.1-beta.6`. **No closing keywords anywhere in this body** (umbrella epic). Retitle to: `epic: NetScript Dev Dashboard — the Aspire/Scalar satellite dev console (ships as a plugin, beta.6)`.
`#TBD` placeholders below must be replaced with real issue numbers after the three new DDX issues are filed (see `ratification-summary.md` step 4).

---

## Summary

A DX-oriented dev dashboard shipping as `plugins/dashboard` + `packages/plugin-dashboard-core` on `@netscript/fresh-ui`. It is a **satellite of Aspire's control surface, not a rival**: it renders only NetScript-domain state that Aspire and Scalar cannot see, and deep-links back out to them for everything they already own.

**Rescoped 2026-07-06 (owner mandate).** The pass-1 direction — including the flagship trace-waterfall panel — duplicated surfaces Aspire and Scalar already do better. This body supersedes the pass-1 panel list.

## DX thesis

Answer the question no existing tool can: *"is my NetScript app wired the way I declared it, what is my runtime doing right now at the primitive level, and where do I jump to fix it?"*

- **Aspire owns:** resources, console/structured logs, traces, metrics, health, resource lifecycle.
- **Scalar owns:** API reference, schemas, try-it, code samples.
- **The dashboard owns:** primitive run-state (executions/attempts, saga instances incl. `compensating`, trigger firings, stream deliveries), the runtime override/config layer, plugin-registry wiring + doctor + contribution axes, contract provenance/coverage/duality, route→contract binding, and codegen/scaffold state (migrations, drift).

## Authoritative screen set (supersedes the pass-1 DDX panel list)

- **S1 Shell & Wiring Home** — #415
- **S2 Config Resolution & Topology Hand-off** — #416 (rescoped: `ns-stackmap` retargeted from infra topology to a capability-wiring graph)
- **S3 Runtime-Config Monitor** ⚑ flagship — #TBD (DDX-20, new)
- **S4 Service & Contract Catalog** — #417 (rescoped: provenance/coverage/duality only; no try-it)
- **S5 Plugin Control** (dogfood centerpiece) — #420
- **S6 Run Inspector + NetScript run-overlay** — #419 (absorbs #418)
- **S7–S10 Workers / Sagas / Triggers / Streams consoles** — #428 #429 #430 #431
- **S11 DB Migrations & Drift** — #TBD (DDX-21, new; beta.6-if-cheap)
- **S12 Dead-Letter Queues** — #TBD (DDX-22, new; wave:defer, gated on thin API slices)

## Non-duplication acceptance line (MANDATORY, gates every slice)

No dashboard screen may render, as an owned surface: an OTLP trace waterfall, a structured/console log tail, a metrics chart, a resource start/stop/restart panel, or an OpenAPI operation list / try-it console. Each of those is Aspire's or Scalar's job and MUST be a deep-link out. Every merged panel must pass the review question **"why can't this just deep-link to Aspire/Scalar?"** with a NetScript-only answer recorded in its issue.

## Integration seams (four seams, one URL scheme)

1. **Aspire → dashboard:** `WithUrl("NetScript Dashboard", /resource/{name})` on every scaffolded resource + two framework `withCommand`s (`open-netscript-dashboard`, `inspect-registry`) — generator emission on #424, Seam A type widening (`command`/`app` kinds) on #411, Seam B (`register-*.mts`) as interim fallback.
2. **Dashboard → Aspire:** correlation-only `TelemetryQueryPort` (#413) resolves a `traceId`, then out-links to `{aspireBase}/traces/detail/{id}`, `/structuredlogs?resource=`, `/consolelogs/resource/`, `/metrics/resource/`. Never re-renders OTLP.
3. **Dashboard → Scalar:** `/api/docs` (+ operation anchor) deep-links only. Scalar → dashboard is spec-authored `externalDocs` at most (no callback surface exists) — optional polish.
4. **Data plane:** owned `/_netscript/*` introspection (#423) over already-shipped oRPC contracts (workers 21 routes, sagas instances/history, triggers events/enable-disable/preview, config + runtime-config SSE, plugins/doctor/contributions, routes, db status, scheduler, telemetry coverage).

## Killed / folded surfaces (documented so they don't creep back)

- Trace-waterfall renderer (#418 → closed, folded into #419 as an out-linking run timeline).
- Logs panel (#421 → closed; correlated strip in S6 deep-links Aspire logs).
- Resource-control panel (#422 → closed; delivered as `withCommand` contributions *inside Aspire*).
- Service `/health` panel (→ Aspire State column via a proper `withHealthCheck()` wiring fix).
- Metrics charts + GenAI conversation view (→ Aspire, link only).
- Scalar-style operation list / try-it (→ Scalar `/api/docs`; the S4 catalog is provenance-only).

## Slice map / dependencies

Plumbing: #410 (fresh-ui L3 blocks) → #412 (core scaffold) → #414 (thin plugin) · #411 (Seam A) · #413 (+#408 telemetry T7) · #423 (introspection) · #424 (CLI/deep-links/generator) · #427 (panel seam).
Screens: #415, #416, #417, #419, #420, #428–#431, DDX-20/21/22 (#TBD).
Design pre-step: #507 (rescoped-screen Claude Design prototype; duplication caught at design review). UI quality: #509.
Gate: #426 (E2E join + panel smoke, rewritten assertions — no owned-waterfall assertion).
Co-requisites (wave:defer): `TriggerDlqPort` contract route #TBD, `queue` `DeadLetterStore` CLI/API #TBD.

Refs #301 (road to stable). Co-lands with `epic:telemetry-revamp` (#399) for T4–T7 correlation fidelity.
