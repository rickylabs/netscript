# Worklog — docs-v3-ia-plan--supervisor

Run type: **docs planning** (SCOPE-docs overlay; no archetype — no `packages/`/`plugins/` code change).
Deliverable: a locked, PLAN-EVAL-ready Information-Architecture plan. No prose authoring in this run.

## Phase log
- **Bootstrap / Research** — re-baselined to `origin/main` @ `5f273355`; discarded the stale-worktree
  "auth packages missing" false positive (`research.md` §2). Produced `research.md`, `doc-architecture-v3.md`,
  and grounding (`ground/leakage-diagram-barraising.md`, `ground/playground-showcase-map.md`).
- **Plan & Design** — `plan.md` v1 committed (`fc3ee159`).
- **Plan hardening (this pass)** — folded the unoriented WSL Codex adversarial panel findings
  (`codex-panel-findings.md`; committed WSL-only as `1cbe1875`, never pushed, reproduced into this branch)
  back into the plan; added the harness artifacts, full surface inventory, tutorial
  proof plans, hub content contracts, locked foundation decisions, and an executable gate table. See `drift.md`.
- **Plan-Gate** — **PASS** ✅. The first OpenHands minimax-M3 PLAN-EVAL **crashed** (workflow failure, not a
  verdict; comment 4762333961, run 27907934927). The clean re-dispatch (PR-comment 4762426764, run
  **27908862931**) rendered **`PASS`** — `plan-eval.md` committed to the branch. The evaluator independently
  cross-checked the live repo (counted `packages/`+`plugins/` dirs, summed every `deno.json` exports map,
  verified marketplace stubs, `TASK_TYPES`/`WORKER_RUNTIMES`) and confirmed all 10 panel findings
  (B1/B2/B3/M4–M9/m10) genuinely closed. Verdict carried **5 non-blocking bookkeeping follow-ups**, all applied
  in a post-PASS planning patch (see drift 2026-06-21 · PLAN-EVAL PASS): real surface count is **31 units /
  210 subpaths** (was mis-headlined 32 / 242 — every subpath was still classified; only the totals were wrong),
  `createJobTools` reclassified as a scaffold helper (not a published subpath), S12/§5 gate now asserts 210
  read live from the export maps, and the Track B proof gate now emits a mandatory recorded SCOPE verdict.
- **Implementation gate is now OPEN** — the build run may begin (separately, on the applied planning patch).
- **Competitor-inspiration deepening (post-PASS, user review note 2026-06-21)** — user ~90%-approved the plan but
  wanted more inspiration drawn from the competitor dossier. Applied an **additive** deepening (no locked decision
  or slice changed): vendored `ground/competitor-doc-research.md`; added the §0.5 front-door positioning contract
  (Integration-Tax / persona / 5 credibility anchors / comparison matrix), rewrote §8 into strict per-page-type
  section-order contracts + §8.1 code conventions, prioritized + extended the §5.1 component set
  (`comp.tabbedCode`/`comp.tabbedRuntime`-synced/`comp.learningPath`/line-highlight), added per-engine ERD
  diagrams (§5.3), and a §11 competitor-pattern adoption matrix; wired the new components + a page-structure audit
  gate into `plan.md` (WS4/WS8/S03/S18/S20/§5) and a hub structure rule into `hub-content-contracts.md`. See
  `drift.md` 2026-06-21 · competitor-inspiration deepening. **Ready for user re-review.**

## Design

**Decision baseline:** D1–D4 locked by the user (`research.md` §1) — multiple independent tutorial tracks; a
different real app per track; full design-system + rendered-diagram scope; layered unoriented eval.

**Open-decision sweep (resolved this pass — see `plan.md` §2a):** diagram render mode → **build-time render with
committed static SVG fallback** (no-JS accessible); xref surface → **dedicated `_data/xref.ts`** + `comp.xref`
filter with a locked key namespace; Pagefind index scope → **build `_site/**` including `reference/**`**; version
UI → **static "alpha" pill now, real switcher deferred to beta (debt)**; `archetype` → **internal contributor
doctrine, removed from all public vocabulary**; marketplace CLI → **documented as alpha/stub, excluded from the
"full CLI surface" claim**; production deployment → **local + Aspire-orchestrated this run; cloud-prod deferred
(debt)**.

**Surface completeness:** `surface-inventory.md` classifies all **210** public export subpaths across **31**
units (26 packages + 5 plugins, verified against the live export maps 2026-06-21) into narrative / how-to /
reference-only / testing-only / deferred. WS3 acceptance binds to it.

**Tutorial grounding:** Tracks A/D are playground-direct; Tracks B/C are NOT (no auth, no demonstrated polyglot
in the showcase) and each carries a pre-authoring proof-or-rescope gate (`tutorial-proof-plans.md`).

**Risk posture:** central design-system changes (D3) are additive + visual-diff-gated; tutorial accuracy is
proof-gated on `origin/main`; scope is sliced (≤30 ordered commit slices, `plan.md` §4) so no monolith.

**Checkpoint:** plan is internally consistent, grounded in the verified export surface, and every panel blocker
+ major has a concrete resolution. Ready for re-dispatch to PLAN-EVAL.

## Gate results
- Build/lint/fmt gates: N/A this run (no `docs/site/**` or code touched; only `.llm/tmp/run/**` planning
  artifacts, which do not deploy — `pages.yml` triggers only on `docs/site/**`).
- Executable gate **definitions** for the later build run: `plan.md` §5 (gate table + leakage-scanner spec).
