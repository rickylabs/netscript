# Plan (Stage E lock) — plan-unified-runtime--seed (#824)

Integrated from `synthesis.md` + the three Stage-D packs (`design/D1-composition-host/`,
`design/D2-capability-matrix/`, `design/D3-board-mechanics/`). Authority: GitHub + owner
ratification win on conflict. DRAFTS-ONLY until Stage H.

## Locked decisions

| ID | Decision | Source |
| --- | --- | --- |
| L1 | Logical composition root is the universal invariant; physical one-process execution is a per-preset capability; the surviving cross-preset rule is "no application-created loopback". | synthesis §1/3; D1 proposal; drift D-01/D-02 |
| L2 | Nitro owns the sole listener/lifecycle; Fresh mounts via `app.handler()` (never `listen()`); disposal drains once via `close`. | D1 proposal; drift D-10 |
| L3 | oRPC bridge = in-process delegation over `ServiceApp.fetch` — invocation placement, no second codec; H3-bridge conformance gate; oRPC generation pinned (shipped ^1.14.6). | D1 proposal; drift D-07/D-11 |
| L4 | Sagas capability rule replaces the stale #327-D1 exclusion: in-process only via the NetScript saga runtime; per-preset `supported | externalized | rejected`; externalized = macro-service split, never Nitro-task substitution. | sagas-constraint.md; D2 proposal |
| L5 | Four v1 runtime cells: `deno_server`, `deno_deploy`, `node_server`, `cloudflare_module` (isolate representative — owner may swap, F-1). | D2 proposal; nitro-v3.md |
| L6 | NetScript ports stay authoritative; Nitro primitives are host bindings with L/P/U mappings; build-time hard-fail on `unsupported`, warn on `partial`, never silent downgrade. | D2 proposal; drift D-03/D-06 |
| L7 | Writer-ownership/locks (D-08) and offline sync (D-09) are declared database capabilities/profiles, not runtime invariants. | D2 proposal |
| L8 | Board language normalizes to shipped `@netscript/database`; no `@netscript/data` facade in v1 unless the owner commissions one (F-5). | adapter-mapping.md; drift D-12 |
| L9 | Epic #823 decomposes into the UR-1…UR-12 skeleton with the D3 DAG; supersession: #451 FOLD→UR-4, #453 FOLD→UR-7, #454 RE-SCOPE→UR-10, #455 FOLD→UR-8, #349 confirm-superseded (already closed — no reopen). Zero filing-time closes; folds via downstream PR keywords. | D3 proposal |
| L10 | One-shot Stage-H filing from `design/D3-board-mechanics/filing-manifest.md`, preceded by an `epic:unified-runtime` label-parity PR (live label missing from `.github/labels.yml`). | D3 manifest; OF-7 default yes |

## Owner-fork sweep (numbered, none silently taken — Stage-H decision brief)

Deduplicated across packs; defaults stated, every fork awaits the owner in-turn.

| F# | Fork | Default |
| --- | --- | --- |
| F-1 | v1 isolate cell: `cloudflare_module` vs vercel/netlify_edge/aws_lambda | keep cloudflare_module |
| F-2 | Milestone train: UR marquee anchored beta.13 (after PM #510 at beta.12); D2 split S1–S4→beta.12, S5–S6→beta.13; tier-3 serverless cell defer (OF-4) | as stated |
| F-3 | Static-asset ownership default (Fresh-owns-islands vs Nitro-owns-all) | Fresh-owns-islands |
| F-4 | WebSocket/upgrade scope in v1 vs deferred | defer to post-v1 cell proof |
| F-5 | `@netscript/database` normalization vs new `@netscript/data` facade card | normalize, no facade |
| F-6 | oRPC: hold ^1.14.x pin vs authorize v2-beta spike | hold pin |
| F-7 | Bounded-window sagas in v1: ship `externalized` macro-service path vs reject-only | reject-only v1, externalized v1.1 |
| F-8 | Offline-sync (#455/UR-8): track-only vs pull into beta train | track-only (`0.0.1-stable` per OF-5 default) |
| F-9 | Label-parity PR for `epic:unified-runtime` (OF-7) + #454 acceptance body edit (OF-9) | yes to both |
| F-10 | UR-6 capability matrix: single matrix card vs per-cell cards (OF-8) | single matrix card |
| SC-1..5 | Supersession confirmations exactly per L9 | confirm |

## Cross-epic DAG & milestone train

D3 proposal §DAG is normative: D1 cards (UR-1…UR-4, UR-10-part) precede D2 conformance cards
(UR-5…UR-9); UR-10 re-scope joins both; legacy chain #451→#454, #453→#454, #454→#455 maps to
UR-4→UR-10, UR-7→UR-10, UR-10→UR-8. Train: label-parity PR → beta.12 (S1–S4/UR core) → beta.13
(marquee + S5–S6) → stable (UR-8), subject to F-2.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Nitro v3 beta churn invalidates cards | version + compatibility-date pin card (UR gate); corpus evidence dated 2026-07-18 |
| oRPC v2 lands mid-train | F-6 pin + H3 conformance gate isolates |
| Preset capability claims rot | per-cell conformance gates executed per preset, not asserted |
| Board drift vs live issues | Stage-H manifest pre-flight re-verifies every live body; authority banners after filing |

## Gate matrix (seed run)

Stage-F adversarial review (distinct model, unoriented) → Stage-G PLAN-EVAL (open-model Qwen,
separate session, hard stop) → Stage-H owner ratification in-turn → one-shot filing →
FILING-LOG + supersession edits → Stage-I handoff briefs from GitHub + packs.
