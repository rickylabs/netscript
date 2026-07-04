# Plan: Roadmap expansion — integrate owner topics A–E into Road-to-0.0.1-stable

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `plan-roadmap-expansion--seed`                               |
| Branch         | `plan/roadmap-expansion` (draft PR #397)                     |
| Phase          | `plan` (PLANNING-ONLY — produces epics/issue drafts/briefs, no framework code) |
| Target         | Program roadmap: 2 NEW epics + 2 rescopes, all under #301 (Road to 0.0.1-stable) |
| Archetype      | N/A for the run itself; per-epic archetypes stated below     |
| Scope overlays | docs (planning artifacts only)                               |

## Goal

A fully-designed, PLAN-EVAL-passable roadmap that folds the five owner topics into the program:
two NEW epics (`telemetry-revamp`, `dev-dashboard`) and two rescopes (docs-cut for C+D; `#327` for
E), each decomposed into sub-issues with acceptance criteria, labels, milestones, a dependency DAG,
and per-slice agent briefs — ready for owner ratification and a single cut cadence. The two
supervisor-delegated decisions (D-NSONE, telemetry grouped-trace flow) are resolved with evidence;
everything beyond the delegated set is surfaced as an owner fork, not self-decided.

## Scope

- **NEW epic `telemetry-revamp`** (enabler half of Spine-1) — `design/B-telemetry/`, sub-issues T1–T9.
- **NEW epic `dev-dashboard`** (headline half of Spine-1, ships as a plugin) — `design/A-dashboard/`,
  sub-issues DDX-0…16 (+ BaaS-pattern refinements from the owner-expanded source set).
- **Docs-cut** for C (tutorial rewrites) + D (positioning) — `design/CD-docs/`, S0 + C1–C6 + D1–D9 +
  V; delivered as a docs-only PR wave.
- **`#327` rescope** for E (desktop/single-process) — `design/E-desktop/`, #E1–#E8.
- The integrated cross-epic DAG, milestone train, risk register, gate set, and owner-decision
  register (this file + the per-epic `epic-and-issues.md`).

## Non-Scope

- **No GitHub mutation** (no issue/PR/label/milestone create/edit) and **no framework code** until
  the owner ratifies. PR #397 stays draft.
- Not deciding the owner forks below (milestone creation, #232 fork, #327/#375, #349 scope, telemetry
  SDK-dep posture, positioning density, AI-invocation timing). Drafts present options; owner picks.
- Not the implementation of any slice (that is the ratified WSL-Codex / Opus-workflow / OpenHands
  execution phase, post-ratification).

## Hidden Scope (a naive read would miss)

- **The flagship trace is a cross-epic co-land, not two independent epics.** `dev-dashboard` DDX-8
  renders a *severed* trace unless `telemetry-revamp` lands the streams fan-in span-links (T5), the
  triggers W3C-parenting bugfix (T4), **and** the oRPC span-creation fix (T6, a silent no-op today).
  The two epics must be scheduled to co-land at beta.6, not sequenced.
- **Four GitHub milestones do not exist yet** (`0.0.1-beta.5/6/7/8`). Every issue-filing is blocked
  on the owner creating them — a ratification-time action, but a hard precursor.
- **Docs authoring is blocked on a structural precursor** (S0 IA-reconciliation, WSL Codex) that no
  prose agent can skip.
- **D-NSONE's real gap is a missing fresh-ui L3 layer** (internal debt), not a borrow from eis-chat;
  the Directus extension taxonomy reframes it further as a *panel-contribution registry*.

## Locked Decisions

| ID    | Decision | Rationale |
| ----- | -------- | --------- |
| LD-1  | **Spine-1 = `telemetry-revamp` (enabler) + `dev-dashboard` (headline), co-land beta.6.** Two NEW epics under #301. | Dashboard's trustworthy trace view depends on the telemetry revamp; they are one coupled deliverable (verified: DDX-3↔T7 query contract, DDX-8↔T4/T5/T6 flagship gate). |
| LD-2  | **D-NSONE → promote the missing L3 `blocks/` layer into `@netscript/fresh-ui`; do NOT re-import L0–L2.** MCP-specific components out of the general registry for beta.6; `data-grid` NOT promoted (collides with the existing `DataGrid<T>` export). Extensibility shaped by the Directus panel-contribution precedent (`.withDashboardPanel`). | fresh-ui & eis-chat L0–L2 are byte-identical copy-source (evidence: research.md #1); the only real gap is fresh-ui has no L3 layer at all (#2). Directus proves the extensible-panel-registry model (BaaS teardown). |
| LD-3  | **Telemetry grouped-trace flow = two-tier.** beta.6 flagship = **Flow B** (framework-native multi-process: eischat→workers-api→workers→oRPC callback→streams fan-in, with real span-links). stable = **Flow A** cross-language `duckdb.exe` hop (net-new span + `TRACEPARENT` env-carrier + language shim). | The hardest cross-language hop (duckdb, dark, needs a language shim + built demo) is honest only at stable; the beta.6 flagship is the representative multi-process flow that is mostly wiring already-emitting processes (evidence: research.md #5/#8). |
| LD-4  | **Telemetry provider posture = adapter-supports-both, default-thin, opt-in-SDK on the fan-in path.** `adapters/otel-deno` default (zero runtime dep); `adapters/otel-sdk` opt-in for attribute-bearing span links + flush-on-exit. | Deno-native span links are attribute-less (research.md #7), which collides with the beta.6 messaging fan-in requirement → the SDK adapter is beta.6-load-bearing, not a stable nicety. (Dep posture itself = owner fork OF-5.) |
| LD-5  | **Telemetry package restructure to doctrine ports/adapters** (kill `core/`, delete orphan `src/public/mod.ts`, real `./registry` facade, add `./otel` + `./query` subpaths) — closes the tracked Refactor arch-debt. | Package is structurally non-compliant today (research.md #6); the query/otel surfaces need clean subpaths to publish. |
| LD-6  | **`dev-dashboard` archetype = thin `plugins/dashboard` (ARCHETYPE-5) + fat `packages/plugin-dashboard-core` (ARCHETYPE-2)**, streams analog; `DashboardContract extends BasePluginContract`; `plugin add dashboard` needs NO CLI change. | Plugin-thinness/core-centralization law; the JSR-install path registers `provider.kind` from the manifest (research.md #4). The dashboard dogfoods the plugin system. |
| LD-7  | **Dashboard live data = Aspire `/api/telemetry/*` HTTP first, converging on `@netscript/telemetry/query` (T7) as it lands within beta.6.** The `TelemetryQueryPort` is the source-swap seam (no panel change). | Aspire OTLP HTTP API is the only working query path (the `aspire otel` CLI is broken, research.md #9); the typed contract insulates panels from Aspire's unstable internal JSON. |
| LD-8  | **Aspire dashboard seam = extend the existing contribution seam with a `command` kind (HARD beta.6) + `app` kind (preferred, Seam-B fallback).** Interactive prompts via command `arguments`, NOT `IInteractionService` (absent in the TS SDK). | Pin 13.4.6 clears `WithCommand` (research.md #3); the command kind is the honest "control the full stack" surface + the dogfood thesis; A2 forces the arguments route. |
| LD-9  | **E precursor = `@netscript/sdk` `ClientLinkPort` in-process adapter (#E1), NOT the mis-referenced 172a-2 seam.** Server `ServiceApp.fetch()` mount already ships; only the client in-process link is missing. | PR #172 is merged CLI type-soundness, unrelated (research.md #12, drift E1). The adapter is additive/unblocked. |
| LD-10 | **E ships as ONE tier-4 at beta.8 (no single-process-early / desktop-later split); tursodb single-writer relocates into the desktop composition root.** Option (b)→(c) ladder; stable holds only deploy-e2e (#E7) + signing (#E8). | eis-chat proved option (b) in prod; option (c) needs #E1+#E3; the single process is one lock holder (no os error 33) at a real-FS path — no native-addon-in-VFS spike (research.md #13, Opus-E). |
| LD-11 | **Docs land as a docs-only PR wave gated on S0 (IA-reconciliation, WSL Codex).** Authoring = Opus workflows (agents return prose, Fable commits); validation = OpenHands per-domain. Positioning law (build-efficiency-not-throughput, no honesty/candor framing) binds every child. | `capabilities/` (16 orphaned .md, never wired) vs 9 pillar folders is a structural blocker no prose agent can skip (research.md #11); the documentation-authoring exception governs the lane. |
| LD-12 | **#349 stays a WATCH sibling under #327; its tier-3 serverless scope is NOT merged into desktop Tier-4.** | 3-way "unified" naming collision (Opus-E); serverless bundling ≠ single-process desktop. (Confirmation = owner fork OF-4.) |

## The four epics (summary — full decomposition in `design/<topic>/epic-and-issues.md`)

| Epic | Archetype | Milestones | Slices | Merge-gate |
| ---- | --------- | ---------- | ------ | ---------- |
| `telemetry-revamp` (NEW) | package refactor + plugin instrumentation | beta.5 (T1–T2), beta.6 (T3–T8), stable (T9) | T1–T9 (9) | T8 real Flow-B e2e |
| `dev-dashboard` (NEW) | thin plugin + core (ARCH-5+2) | beta.6 core, stable depth | DDX-0…16 (17, + BaaS refinements) | DDX-16 scaffold.runtime join |
| docs-cut (C+D) | docs (authoring exception) | beta.7 | S0 + C1–C6 + D1–D9 + V-C/V-D (~18) | V-C/V-D OpenHands per-domain |
| `#327` rescope (E) | sdk/service/cli/db | beta.8 core (E1–E6), stable (E7–E8) | #E1–#E8 (8) | #E7 desktop deploy-e2e |

## Integrated cross-epic DAG + milestone train

```
beta.5 ── telemetry T1 (convention) → T2 (restructure)
beta.6 ── SPINE-1 CO-LAND:
          telemetry: T2 → T3 (adapters) → T5 (fan-in links) ┐
                     T2 → T4 (triggers bug) ─────────────────┤→ T8 (real Flow-B e2e) ▲ epic gate
                     T2 → T6 (oRPC span + AI-invoke) ─────────┤
                     T2 → T7 (@netscript/telemetry/query) ────┘
          dashboard: DDX-0 (fresh-ui L3) ┐
                     DDX-1 (Aspire seam)  ├→ DDX-2 (core) → DDX-3/4 → DDX-5 (shell) → DDX-6…12 panels → DDX-16
                     DDX-15 (design-sync)─┘         DDX-8 (flagship) ⇐ REQUIRES telemetry T4+T5(+T6)+T7
beta.7 ── docs: [owner creates beta.7] → S0 (IA-reconcile, HARD precursor) → {C1–C6 ∥ D1–D9} → V-C/V-D → docs-only PR wave
beta.8 ── desktop: #E1 (sdk link) ∥ #E2 (#375 gen) ∥ #E3 (tursodb) → #E4 (single-process) → #E5 (offline), #E6 (packaging)
stable ── telemetry T9 (AI adapter + Flow-A duckdb); desktop #E7 (deploy-e2e, deps #393/#394) + #E8 (signing);
          dashboard depth (rerun-from-step, rich history, composite orchestration); schema-driven db tab (Directus precedent)
```

**Critical path to a shippable beta.6:** `T1→T2→T3→T5→T8` (telemetry) co-landing with
`DDX-0/2→DDX-3/4→DDX-5→DDX-8` (dashboard), with the T4/T5/T6 → DDX-8 flagship gate. The docs cut
(beta.7) intentionally follows the features being real so the storytelling is accurate.

## Open-Decision Sweep (owner forks — none self-decided)

| Decision | Status | Rework if deferred? | Notes |
| -------- | ------ | ------------------- | ----- |
| OF-1 Create milestones `0.0.1-beta.5/6/7/8` (+ epic labels) | **must resolve at ratification** | Blocks issue-filing, not plan design. No plan rework. | AGENTS.md milestone obligation; pure owner action. |
| OF-2 **#232 fork:** rescope-#232 (Opt 1) vs NEW `epic:docs-cut` child of #301 (Opt 2) | **must resolve before docs filing** | No rework to slice content — both options wrap the SAME S0/C/D children. Only the epic wrapper differs. | Opus-CD **recommends Opt 2** (#232's storefront-Run-2 debt partly superseded; rescope risks orphaning it). Both drafted. |
| OF-3 **#327 rescope** WATCH→Tier-4 + **#375 promotion** (`Closes #375`) | **must resolve before E filing** | No plan rework; confirms scheduling. | Draft delta ready in `design/E-desktop/epic-and-issues.md`. |
| OF-4 **#349 scope** — keep WATCH sibling vs fold into Tier-4 | safe to defer (recommend WATCH) | Deferring = leave #349 untouched; no rework. | Opus-E evidence: serverless ≠ single-process; do NOT merge. |
| OF-5 **Telemetry SDK-adapter dependency posture** (opt-in `@opentelemetry/sdk-*` on fan-in) | **must resolve now** | **YES — deferring forces rework.** If the owner forbids any OTel-SDK dep, the fan-in span-links (T5) can't carry attributes and the beta.6 flagship trace design changes. | Default build stays zero-dep; SDK is opt-in. Technical direction locked (LD-4); the *dep-acceptance* is the owner's. |
| OF-6 **AI-invocation-at-beta.6** (pull minimal AI `TelemetryPort` invocation forward; full GenAI adapter stays stable) | safe to defer (recommend adopt) | Minor: if rejected, AI stays F at beta.6 (no dashboard AI spans); no structural rework. | Opus-B divergence; kills the inert-F seam cheaply. |
| OF-7 **Positioning density** (~13 one-per-major-feature competitor comparisons vs 2 today) | safe to defer to authoring | No plan rework; a density knob per D slice. | Opus-CD; brushes "sparse by design" — owner sets the ceiling. |
| OF-8 **Two net-new docs pages** (CLI/scaffold, MCP) in scope | safe to defer (recommend in) | No rework; S0 adds two nav stubs regardless. | Opus-CD. |
| OF-9 **Desktop-mode telemetry export** (no Aspire collector in a shipped binary) | safe to defer to stable | No beta.6 rework; desktop ships beta.8+. | Resolve as env-configured external OTLP via the SDK adapter (LD-4 makes this free). |

> Only OF-5 is "must resolve now" in the rework sense; it is resolved technically (LD-4) and needs
> only the owner's dependency-posture ratification. All others are ratification-gates that do not
> force plan rework when deferred → **no `FAIL_PLAN` open decision.**

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Flagship trace renders severed if telemetry fan-in/triggers/oRPC fixes slip | Hard co-land gate encoded (DDX-8 deps T4/T5/T6/T7); T8 real-e2e assertion goes red if any fix regresses; sequence both epics into one beta.6 cut. |
| Aspire `app`-kind embedding proves unavailable at 13.4.6 | Seam-B fallback (`apps.dashboard` app-registration) documented in DDX-1/DDX-5; `command` kind (verified) is the hard requirement. |
| SDK-adapter dep posture rejected by owner (OF-5) | Default-thin build already zero-dep; if rejected, degrade fan-in links to no-attribute (Deno-native) and note the reduced trace fidelity as accepted debt. |
| tursodb single-writer / Prisma engine fails inside a packaged `deno desktop` binary | Bounded validation baked into #E3 acceptance; real-FS path (not VFS) avoids the native-addon spike; option (b) is the proven fallback. |
| S0 IA-reconciliation breaks existing doc URLs | S0 acceptance requires redirects for all 15 moved pages + `deno task verify` green + grep-clean xref retargeting before any authoring starts. |
| Telemetry restructure (LD-5) breaks published subpath consumers | T2 acceptance: subpath compat preserved, `deno doc --lint` on the FULL export set, `deno publish --dry-run` green. |
| Roadmap scope (51 slices) overwhelms a single cut | Milestones stagger the load (beta.5 foundation → beta.6 spine → beta.7 docs → beta.8 desktop → stable tail); each epic has its own merge-gate. |
| Post-ratification lane drift (Fable writing framework code) | Lane law encoded per slice in `agent-briefs.md`: WSL Codex for framework/plugin/sdk/db, Opus workflows for docs prose only, OpenHands for validation. |

## Fitness Gates (per-epic gate set, from the archetype-gate-matrix + overlays)

| Gate | telemetry | dashboard | docs | desktop |
| ---- | --------- | --------- | ---- | ------- |
| `deno task check` (+`--unstable-kv`) | yes | yes | n/a | yes |
| `deno task arch:check` | yes (LD-5) | yes (core layering) | n/a | yes |
| `jsr` / `deno doc --lint` full export set | yes (T2/T7) | yes (core + fresh-ui L3) | n/a | yes (#E1 sdk surface) |
| `deno publish:dry-run` | yes (T2) | yes | n/a | yes |
| `scaffold.runtime` e2e | T8 (Flow-B assertions) | DDX-16 (dashboard join) | n/a | n/a |
| `deno task verify` (docs build+links+caveats) | n/a | n/a | S0 + every C/D slice | n/a |
| deploy-e2e (extends #394) | n/a | n/a | n/a | #E7 (stable) |
| contract base-seam soundness test (2 accepted casts only) | n/a | DDX-2 | n/a | #E1 round-trip parity |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `packages/telemetry` Refactor (tracked) | **close** via T2 | evidence F-3/F-5/F-6; ports/adapters + subpaths. |
| triggers W3C-parenting bug | **fix** via T4 | regression test asserts ingress+process share traceId. |
| streams / ai instrumentation = F | **resolve** via T5 / T6 | from-zero PRODUCER/CONSUMER spans (streams); live `TelemetryPort` invocation (ai). |
| fresh-ui missing L3 layer | **resolve** via DDX-0 | add the blocks registry; internal debt independent of D-NSONE. |
| `aspire otel` CLI broken | **note (do not fix here)** | dashboard routes around it via the HTTP API (LD-7); track separately. |
| docs `capabilities/` orphan IA | **resolve** via S0 | promote into pillars + redirects. |

## jsr-audit surface scan

See `research.md` § jsr-audit — the planned public-surface deltas (`@netscript/fresh-ui` L3 blocks;
`@netscript/telemetry` `./otel` + `./query` subpaths + restructure; `@netscript/sdk` `ClientLinkPort`;
NEW `packages/plugin-dashboard-core` + `plugins/dashboard`) with slow-type risks, each addressed by a
named slice with a `gate:jsr` acceptance criterion. Per-package deep scans re-run at each slice's
IMPL-EVAL.

## Commit-slice framing (Plan-Gate "commit slices < 30")

Two levels, both satisfying the bound:
- **This planning run's own slices** (~11 artifact commits, A→G): specs read → eis-chat staged →
  B corpus → drift → stage-C synthesis → research.md → 4 Opus proposals → BaaS addendum → plan.md +
  ## Design → F1 fixes → PLAN-EVAL. Well under 30.
- **Each ratified epic's implementation slices** are enumerated, ordered, and sized in its
  `epic-and-issues.md`, each < 30: telemetry 9, dashboard 17 (+ BaaS refinements), docs ~18,
  desktop 8. No single epic exceeds the bound; each slice names its proving gate + files.

## Deferred Scope (explicit)

- **stable-tier:** telemetry AI GenAI-semconv adapter + Flow-A duckdb cross-language hop + rich AI
  trace views (T9); dashboard rerun-from-step, multi-altitude run history, composite orchestration,
  saved views; desktop deploy-e2e (#E7) + signing automation (#E8); Directus-style schema-driven
  `db` tab.
- **Explicitly out of this program:** baggage propagation (semconv Candidate); dual-write to an
  external telemetry backend (app's OTLP-exporter choice); #349 tier-3 serverless (WATCH sibling);
  MCP-content dashboard panels (unless the panel IA adopts them — owner fork territory).

## Dependencies

- External: Aspire 13.4.6 pin (verified); Turso Sync API (#E5); `deno desktop` (#E2/#E6); OpenTelemetry
  SDK (opt-in, OF-5); minimax M3 for PLAN-EVAL (stage G); WSL Codex daemon for F1 + implementation.
- Internal foundations: #393/#394 deploy-e2e harness (desktop #E7); the shipped `ServiceApp.fetch()`
  seam (#E1); the fresh-ui copy-source registry (DDX-0).

## Drift Watch (log to drift.md if these change)

- Aspire `app`-kind embedding availability at the pinned version (DDX-1 fallback trigger).
- Whether `@netscript/ai` publishes before the beta.7 window (gates C5/D9 docs form).
- MCP HTTP-transport traceparent propagation (T9) and the streams real-consumer wiring (T8) — the two
  corpus "unconfirmed" items Opus-B flagged.
- Owner ratification outcomes for OF-1…OF-9 (any change reshapes milestones/labels).
