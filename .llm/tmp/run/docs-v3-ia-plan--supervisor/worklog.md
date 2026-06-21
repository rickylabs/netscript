# Worklog — docs-v3-ia-plan--supervisor

Run type: **docs planning** (SCOPE-docs overlay; no archetype — no `packages/`/`plugins/` code change).
Deliverable: a locked, PLAN-EVAL-ready Information-Architecture plan. No prose authoring in this run.

## Phase log
- **Bootstrap / Research** — re-baselined to `origin/main` @ `5f273355`; discarded the stale-worktree
  "auth packages missing" false positive (`research.md` §2). Produced `research.md`, `doc-architecture-v3.md`,
  and grounding (`ground/leakage-diagram-barraising.md`, `ground/playground-showcase-map.md`).
- **Plan & Design** — `plan.md` v1 committed (`fc3ee159`).
- **Plan hardening (this pass)** — folded the unoriented WSL Codex adversarial panel findings (`1cbe1875`,
  `codex-panel-findings.md`) back into the plan; added the harness artifacts, full surface inventory, tutorial
  proof plans, hub content contracts, locked foundation decisions, and an executable gate table. See `drift.md`.
- **Plan-Gate** — PENDING. The first OpenHands minimax-M3 PLAN-EVAL **crashed** (workflow failure, not a
  verdict; comment 4762333961, run 27907934927). Re-dispatch after this hardening commit. No authoring/build
  before PASS.

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

**Surface completeness:** `surface-inventory.md` classifies all **242** public export subpaths across **32**
units into narrative / how-to / reference-only / testing-only / deferred. WS3 acceptance binds to it.

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
