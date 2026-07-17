# Plan (Stage E lock — Stage-F rework applied) — plan-unified-runtime--seed (#824)

Integrated from `synthesis.md` + the three Stage-D packs and the **Stage-F rework** (17 accepted
findings; dispositions in `adversarial-triage.md`). Authoritative issue bodies are
`design/canonical/UR-<n>.md` + `design/canonical/DD-RESEARCH.md`; draft→slot transforms in
`design/canonical/slot-map.md`; the resumable filer in `design/D3-board-mechanics/filing-manifest.md`.
Authority: GitHub + owner ratification win on conflict. DRAFTS-ONLY until Stage H.

## Locked decisions

| ID | Decision | Source |
| --- | --- | --- |
| L1 | Logical composition root is the universal invariant; physical one-process execution is a per-preset capability; the surviving cross-preset rule is "no application-created loopback". | synthesis §1/3; D1 proposal; drift D-01/D-02 |
| L2 | Nitro owns the sole listener/lifecycle; Fresh mounts via `app.handler()` (never `listen()`); disposal drains once via the Nitro `close` hook **through the UR-0 hostable-service lifecycle contract**, which reuses the shipped `ServiceShutdownCoordinator` policy (idempotency, bounded drain, LIFO, structured report) — not a bespoke second registry. | D1 proposal; drift D-10; Stage-F F5 |
| L3 | oRPC bridge = in-process delegation over `ServiceApp.fetch` — invocation placement, no second codec; H3-bridge conformance gate; oRPC generation pinned (shipped ^1.14.6). **UR-4 is the host-side bridge only — a subset of #451's SDK transport surface.** | D1 proposal; drift D-07/D-11; Stage-F F2 |
| L4 | Sagas capability rule replaces the stale #327-D1 exclusion: in-process only via the NetScript saga runtime; per-preset `supported \| externalized \| rejected`; externalized = macro-service split, never Nitro-task substitution. **#327 gets a non-closing addendum recording this.** | sagas-constraint.md; D2 proposal; Stage-F F13 |
| L5 | **Three** v1 runtime cells: `deno_server`, `node_server`, `cloudflare_module` (isolate representative — owner may swap, F-1). **`deno_deploy` is WITHDRAWN from v1** (Deno Deploy Classic/`deployctl` sunset 2026-07-20; new platform lacks Deno queues) → deferred to the **DD-RESEARCH** successor card; re-entry is fork **F-2**. | D2 proposal; nitro-v3.md; Stage-F F1 |
| L6 | NetScript ports stay authoritative; Nitro primitives are host bindings with L/P/U mappings; build-time hard-fail on `unsupported`, warn on `partial`, never silent downgrade. | D2 proposal; drift D-03/D-06 |
| L7 | Writer-ownership/locks (D-08) and offline sync (D-09) are declared database capabilities/profiles, not runtime invariants. | D2 proposal |
| L8 | Board + code language normalizes to shipped `@netscript/database`; no `@netscript/data` facade in v1 unless the owner commissions one (F-8). Naming ownership is recorded in the **UR-11 architecture-contracts** card. | adapter-mapping.md; drift D-12; Stage-F F14 |
| L9 | Epic #823 decomposes into the **UR-0…UR-12** skeleton (namespace normalized; UR-H → UR-12; new UR-0 lifecycle + UR-11 architecture-contracts prerequisites) with the D3 DAG. **Supersession: all KEEP, zero filing-time closes** — #451 KEEP (UR-4 subset), #453 KEEP (UR-7 foundation), #454 KEEP + non-closing addendum (UR-10 foundation), #455 KEEP (UR-8 foundation), #327 KEEP + non-closing addendum, #349 confirm-superseded + status-label fix. Folds land only via each issue's own downstream `Closes #N` PR. | D3 proposal; canonical/slot-map.md; Stage-F F2/F3/F4/F13/F16/F17 |
| L10 | Filing is a **resumable transaction** from `filing-manifest.md`: the `epic:unified-runtime` label-parity PR is a **gated prerequisite merged before filing**; each slot uses a stable marker + search-before-create, immediate per-slot FILING-LOG append, read-after-write verification, and compare-before-edit guards on legacy bodies. | D3 manifest; Stage-F F9/F10 |
| L11 | **One milestone train:** all UR-0…UR-12 at `0.0.1-beta.13`; deferred cells/impl (DD-RESEARCH, #455 offline-sync impl) split into separately-milestoned successors at `0.0.1-stable`. | D3 proposal §3; Stage-F F11 |
| L12 | Stage-I lanes get the **UR-11 architecture-contracts** prerequisite (package/export ownership, doctrine archetype + gate matrix, composition-compiler requirement schema + build seam) before starting. | Stage-F F14 |

## Owner-fork sweep (renumbered once — identical to `design/D3-board-mechanics/decision-brief.md`)

Defaults stated; every fork awaits the owner in-turn. Forks that change an issue **body** carry an
explicit A/B delta in the relevant `design/canonical/UR-<n>.md` under `## Fork deltas`.

| F# | Fork | Default |
| --- | --- | --- |
| F-1 | Isolate representative cell: `cloudflare_module` vs vercel/netlify_edge/aws_lambda | keep cloudflare_module |
| F-2 | v1 cell set: 3-cell vs re-proven `deno_deploy` (via DD-RESEARCH) later | 3-cell v1; DD-RESEARCH at stable |
| F-3 | Bounded-window sagas: ship `externalized` macro-service path vs reject-only | reject-only v1, externalized v1.1 |
| F-4 | WebSocket/upgrade scope in v1 vs deferred | defer to post-v1 cell proof |
| F-5 | Static-asset ownership (Fresh-owns-islands vs Nitro-owns-all) | Fresh-owns-islands |
| F-6 | oRPC: hold ^1.14.x pin vs authorize v2-beta spike | hold pin |
| F-7 | SDK↔service dependency direction (import `type` vs mirror structural shape) — restored #451 O-1 | import `type` (reuse shipped port) |
| F-8 | `@netscript/database` normalization vs new `@netscript/data` facade card | normalize, no facade |
| F-9 | One milestone train — all UR at beta.13; deferred cells/impl → separately-milestoned successors | as stated |
| F-10 | Offline-sync #455 **impl** home: `0.0.1-stable` vs `Backlog / Triage` (UR-8 profile ships beta.13) | `0.0.1-stable` |
| F-11 | Epic slug/label: `epic:unified-runtime` vs `epic:deployment` | unified-runtime (keep epic:deployment too) |
| F-12 | UR-6 granularity: single matrix card w/ per-cell acceptance vs one-per-cell | single matrix card |
| F-13 | `epic:unified-runtime` label-parity PR as a gated prerequisite (merged before filing) | yes |
| F-14 | Desktop consumer boundary: UR-7/UR-10 foundations; #453/#454/#455 KEEP; consumer on #830 | boundary holds; KEEP legacy issues |
| F-15 | Milestone inventory: create none beyond verifying 0.0.1-stable/beta.14 exist | create none |
| F-16 | #454 non-closing acceptance addendum (scope single-process to in-process-capable presets) | yes (append, not close) |
| F-17 | #327 non-closing saga-supersession addendum + #349 terminal status-label correction | yes to both |
| SC-1..6 | Supersession confirmations (#451/#453/#454/#455/#349/#327 — all KEEP, zero closes) | confirm |

## Cross-epic DAG & milestone train

`design/canonical/slot-map.md` + D3 proposal §4 are normative. Prerequisites: **UR-11** (architecture
contracts) precedes UR-1/UR-4/UR-5; **UR-0** (lifecycle) precedes UR-2. Spine (D1): UR-1→UR-2→UR-3;
UR-4 joins. Matrix (D2): UR-5→{UR-6, UR-7, UR-9}; UR-4+UR-7→UR-10→UR-8. Acceptance: UR-6+UR-10 + the
KEEP reconciliation → UR-12. The legacy dependency chain (#451→#454, #453→#454, #454→#455) maps to
the prerequisite edges UR-4→UR-10, UR-7→UR-10, UR-10→UR-8 (edges, not folds). **One train:** all
UR-0…UR-12 at `0.0.1-beta.13`; DD-RESEARCH and #455 offline-sync impl at `0.0.1-stable`.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Nitro v3 beta churn invalidates cards | version + compatibility-date pin card (UR-6 gate); corpus evidence re-fetched + committed (Stage-F F15 lane) |
| Deno Deploy new-platform reality (Classic/`deployctl` sunset) | `deno_deploy` withdrawn from v1; DD-RESEARCH re-proves before re-entry (F-2) |
| oRPC v2 lands mid-train | F-6 pin + H3 conformance gate isolates |
| Preset capability claims rot | per-cell conformance gates executed per preset, not asserted |
| Hosted service silently loses lifecycle hooks | UR-0 lifecycle contract precedes UR-2; reuses `ServiceShutdownCoordinator` |
| Filing leaves duplicates/half-edits on failure | resumable transaction: slot markers, search-before-create, per-slot log, read-after-write, compare-before-edit (L10) |
| Board drift vs live issues | Stage-H manifest pre-flight re-verifies every live body; authority banners after filing |

## Gate matrix (seed run)

Stage-F adversarial review (distinct model, unoriented) → **Stage-E rework** (this lock) → focused
Stage-F re-verification → Stage-G PLAN-EVAL (open-model, separate session, hard stop) → Stage-H owner
ratification in-turn → resumable filing (label-parity PR merged first) → FILING-LOG + KEEP-only
reconciliation edits → Stage-I handoff briefs from GitHub + packs. Per-package doctrine
archetype/fitness/JSR/E2E gates for the implementation lanes are defined in the UR-11
architecture-contracts card (Stage-F F14), not this seed-workflow matrix.
