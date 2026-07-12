# Epic #400 — Full Replacement Body (draft v2, owner ratifies)

Apply with: `gh issue edit 400 --repo rickylabs/netscript --body-file <this body>` (strip this header section; the body starts at the `## Summary` line below the rule).
Labels (unchanged): `type:umbrella`, `epic:dev-dashboard`, `area:plugins`, `area:aspire`, `area:fresh-ui`, `area:telemetry`, `priority:p1`, `wave:v1`, exactly one `status:` (set `status:plan`). Milestone: `0.0.1-beta.6`. **No closing keywords anywhere in this body** (umbrella epic). Retitle to: `epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)`.
`#TBD` placeholders below must be replaced with real issue numbers after the new DDX issues are filed (see `ratification-summary.md` step 4).
**v2 (2026-07-06):** restores the two seed-research pillars v1 dropped — Appwrite-style manage-through-UI and Encore-model seam-flow telemetry. #418 flips from CLOSE to REWRITE (S13); #432 elevates to the beta.7 management keystone.

---

## Summary

A DX-oriented dev dashboard shipping as `plugins/dashboard` + `packages/plugin-dashboard-core` on `@netscript/fresh-ui`. It is a **satellite of Aspire's control surface, not a rival** — and it is **how you drive the framework**: it renders only NetScript-domain state Aspire and Scalar cannot see, mirrors the CLI's management verbs through the UI, and deep-links back out to Aspire/Scalar for everything they already own.

**Rescoped 2026-07-06 (owner mandate, amended same day).** The pass-1 direction duplicated Aspire/Scalar surfaces. The rescope keeps three pillars from the original seed research: **Observe** (only-NetScript state), **Manage** (Appwrite-style per-capability console mirroring the CLI), **Follow** (Encore-model live seam-flow, never re-rendered OTLP).

## DX thesis

Answer the questions no existing tool can: *"is my NetScript app wired the way I declared it, what is my runtime doing right now at the primitive level, what did this request actually cause, and let me act on it without leaving the browser."*

- **Aspire owns:** resources, console/structured logs, raw traces, metrics, health, process lifecycle.
- **Scalar owns:** API reference, schemas, try-it, code samples.
- **The dashboard owns:** primitive run-state (executions/attempts, saga instances incl. `compensating`, trigger firings, stream deliveries), the runtime override/config layer **including gated write-back**, plugin-registry wiring + doctor + contribution axes, contract provenance/coverage/duality, route→contract binding, codegen/scaffold state (migrations, drift), **the per-capability management loop (create → configure(tabs) → monitor)**, and **the live request journey across framework seams (S13)**.

## Authoritative screen set (supersedes the pass-1 DDX panel list)

- **S1 Shell & Wiring Home** — #415 (v2: + quick-action strip mirroring top CLI verbs)
- **S2 Config Resolution & Topology Hand-off** — #416 (v2: + live-traffic edge overlay, Encore Flow model)
- **S3 Runtime-Config Monitor & Control** ⚑ flagship — #TBD (DDX-20, new; v2: + gated write-back)
- **S4 Service & Contract Catalog** — #417 (provenance/coverage/duality only; no try-it)
- **S5 Plugin Control** (dogfood centerpiece) — #420 (v2: + install/scaffold entry points, marketplace-lite)
- **S6 Run Inspector + NetScript run-overlay** — #419 (run-centric)
- **S7–S10 Workers / Sagas / Triggers / Streams consoles** — #428 #429 #430 #431 (v2: each completes the create→configure→monitor→act management loop)
- **S11 DB Migrations & Drift** — #TBD (DDX-21, new; beta.6-if-cheap; migrate/seed actions)
- **S12 Dead-Letter Queues** — #TBD (DDX-22, new; wave:defer, gated on thin API slices)
- **S13 Live Flow — request journey** ⚑ flagship #2 — #418 (v2 REWRITE, was pass-1 waterfall: now the seam-event causal chain — request → payload → job → saga → fan-out — with per-node Aspire out-links)

## Acceptance lines (MANDATORY, gate every slice)

1. **Non-duplication.** No dashboard screen may render, as an owned surface: an OTLP trace waterfall / span-bar gantt, a structured/console log tail, a metrics chart, a resource start/stop/restart panel, or an OpenAPI operation list / try-it console. Each is Aspire's or Scalar's job and MUST be a deep-link out. Every merged panel must pass **"why can't this just deep-link to Aspire/Scalar?"** with a NetScript-only answer recorded in its issue — only-NetScript *state*, only-NetScript *action* (CLI-mirroring), or framework-*seam semantics* raw OTLP cannot express.
2. **One generator, two callers.** Every dashboard mutation invokes the same contract route / CLI scaffolder the terminal does and renders its CLI-equivalent line (`netscript …` CodeBlock). No dashboard-only write paths, no forked codegen.
3. **Flow ≠ waterfall.** S13 renders a primitive-grouped causal chain with payloads at seams, assembled from NetScript's own seam events; the moment raw timing/span detail is needed it out-links to Aspire `/traces/detail/{id}`. No span bars, no time-proportional gantt, no log tails in S13 — ever.

## Integration seams (four seams, one URL scheme)

1. **Aspire → dashboard:** `WithUrl("NetScript Dashboard", /resource/{name})` on every scaffolded resource + two framework `withCommand`s — generator emission on #424, Seam A widening (`command`/`app` kinds) on #411, Seam B interim.
2. **Dashboard → Aspire:** correlation-only `TelemetryQueryPort` (#413) resolves a `traceId`, then out-links to `{aspireBase}/traces/detail/{id}`, `/structuredlogs?resource=`, `/consolelogs/resource/`, `/metrics/resource/`. Never re-renders OTLP. The S13 flow plane does **not** widen this port.
3. **Dashboard → Scalar:** `/api/docs` (+ operation anchor) deep-links only; `externalDocs` optional polish.
4. **Data plane:** owned `/_netscript/*` introspection (#423) over already-shipped oRPC contracts, **plus `/_netscript/flows` (SSE)**: beta.6 joins the shipped per-primitive streams on the stamped `traceparent`; co-req DDX-23 (#TBD) adds the unified seam-event envelope + HTTP boundary events.

## Killed / folded surfaces (documented so they don't creep back)

- Raw OTLP waterfall renderer (pass-1 #418 scope → dead; #418 rescoped to the S13 seam-flow journey, which is not a waterfall — acceptance line 3).
- Logs panel (#421 → closed; correlated strip in S6 deep-links Aspire logs).
- Resource-control panel (#422 → closed; delivered as `withCommand` contributions *inside Aspire*).
- Service `/health` panel (→ Aspire State column via a proper `withHealthCheck()` wiring fix).
- Metrics charts + GenAI conversation view (→ Aspire, link only).
- Scalar-style operation list / try-it (→ Scalar `/api/docs`; the S4 catalog is provenance-only).

## Slice map / dependencies

Plumbing: #410 (fresh-ui L3 blocks) → #412 (core scaffold, + `FlowRecord`) → #414 (thin plugin) · #411 (Seam A) · #413 (+#408 telemetry T7) · #423 (introspection + flows join) · #424 (CLI/deep-links/generator) · #427 (panel seam — the Directus-validated contribution axis).
Screens: #415, #416, #417, #418 (S13), #419, #420, #428–#431, DDX-20/21/22 (#TBD).
Management wave (beta.7): #432 elevated — "Add resource" scaffold-from-UI keystone; DDX-23 seam-event envelope #TBD; template-gallery create entries in S5/S7–S10.
Design pre-step: #507 (S1–S13 Claude Design prototype; duplication caught at design review). UI quality: #509.
Gate: #426 (E2E join + panel smoke; v2 adds the S13 flow-chain assertion, still no owned-waterfall assertion).
Co-requisites (wave:defer): `TriggerDlqPort` contract route #TBD, `queue` `DeadLetterStore` CLI/API #TBD.
Deferred convergences: in-dashboard AI-on-codegen (with #238), in-app plugin marketplace beyond S5 marketplace-lite.

Refs #301 (road to stable). Co-lands with `epic:telemetry-revamp` (#399) for T4–T7 correlation fidelity.
