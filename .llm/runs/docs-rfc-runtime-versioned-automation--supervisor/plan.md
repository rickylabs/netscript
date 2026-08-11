# Plan — docs-rfc-runtime-versioned-automation--supervisor

Status: **provisional draft** — locks after G1/G2 evidence lands. PLAN-EVAL (Sol · xhigh, owner
override D-2) runs at the end against the finished RFC package; it is this run's formal gate.

## Profile

- Intent: RFC / decision document (research + architecture, no implementation).
- Overlay: `SCOPE-docs`. Archetypes described (not modified): ARCHETYPE-1 (runtime-config,
  plugin-workers-core, plugin-triggers-core contracts), ARCHETYPE-4 (packages/plugin),
  ARCHETYPE-5 (plugins/workers, plugins/triggers), ARCHETYPE-6 (packages/cli).
- Gates: docs-source gates (doc-lint, scoped fmt/check where applicable), CI docs lane
  (`ci:skip-e2e` + `ci:skip-scaffold` on the draft PR — docs-only diff), final Sol·xhigh PLAN-EVAL.

## Deliverable set (locked)

1. `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` — primary RFC, status
   `Proposed`. (Locked decision: create `docs/architecture/rfc/` as the RFC home; no prior
   RFC/ADR tree exists in-repo; the #890 precedent lived only in a run dir, which made it hard to
   cite — this RFC establishes the in-repo location and back-links #890's record.)
2. Capability matrix (legacy → current → gap → recommendation) — RFC appendix, sourced from
   `evidence/legacy-capability-map.md` + `evidence/current-state-matrix.md`.
3. `1444-impact.md` — delivered early (PR #1444 comment 5248826402). Folded into the RFC.
4. Architecture + deployment diagrams (mermaid, in-RFC), API/config examples, threat model,
   **replacement/cleanup plan** (obsolete packages/commands/types/docs/generated files/tests to
   remove or rewrite — D-5: no consumer migration/compat layer), E2E acceptance model, phased
   roadmap with **draft** epic/issue graph (not filed — owner ratification required).
5. Design-depth core (D-4): runtime **contribution model** (extract the #890 pattern — contracts
   package, thin pointer axis, generated registries — test whether runtime automation needs one
   or several contribution families; no hardcoded topic switch statements), control/data-plane
   boundaries, execution/sandbox **port + adapters over established isolation tech** (survey with
   primary sources: Deno permissions/subprocess, containers/rootless, gVisor, Firecracker/microVM,
   WASM/WASI/component model, isolates, managed sandbox products; bespoke isolation only on an
   evidenced market gap), version/promotion consistency, multi-instance propagation, security,
   observability, and a five-option package/plugin ownership comparison (extend-existing / neutral
   core package / split contracts+control+client+runtime / thin connector plugin / host-composed
   aggregation) judged against doctrine, DX, JSR packaging, deployment topology, trust boundaries.

## Hard constraints (owner)

- Preserve the differentiating capability: runtime-versioned tasks/triggers on a running stack
  (D-10 standing constraint). No static-config collapse; legacy design not assumed correct.
- **Complete redesign in scope** (D-4): legacy = outcome evidence + three representative operator
  journeys only; current mechanisms = candidate seams, not foundations; compare evolutionary vs
  clean-sheet vs hybrid honestly.
- **No backward-compatibility/migration layer** (D-5): clean break authorized; transition plan is
  a codebase replacement/cleanup plan with an explicit obsolete-surface inventory; compatibility
  only with stable doctrine and active framework seams.
- Cockpit = downstream consumer of Frontend Contribution Layer: RFC PR #890 (merged), epic #922
  (open). Minimum dependency cut to evaluate: #923–#927 (Wave-0 proofs), #928–#932 (contracts /
  pointer / registry / host runtime / scaffold wiring), #934 (procedure gateway); #933 workers
  dogfood as adjacency. No parallel Fresh/dashboard seam. (Drift D-3.)
- Draft PR only; no epic/issue filing; no ready-for-review until owner ratifies.
- #1444 keeps its D-10 boundary; this RFC does not ask it for redesign work.

## Risk register

| Risk | Mitigation |
| --- | --- |
| RFC claims drift from code reality | every capability claim carries a status tag + path evidence; Codex Sol sub-agents independently derived; 5-weakest-claims lists re-verified by supervisor |
| Over-design (faking certainty on staged questions) | explicit "prerequisite RFC required" markers; staged decisions with entry criteria |
| Cockpit dependency mis-modeled | dependency cut cites live issue states (verified OPEN 2026-08-11); roadmap edges explicit |
| Sub-agent worktree contention (one Codex thread per worktree) | G1 → G2 serialized; supervisor works read-only in between |
| Evaluator route blocked | record in drift + escalate per lane-policy fallbacks |

## Commit slices (docs-only)

1. Run-dir bootstrap + research + briefs (this scaffolding).
2. Evidence: legacy capability map (G1 report + supervisor review note).
3. Evidence: current-state matrix (G2 report + supervisor review note).
4. RFC document + matrix + diagrams + roadmap.
5. PLAN-EVAL verdict + any FAIL_PLAN fix cycles.

Each slice: commit → push (explicit refspec) → draft-PR comment with evidence.
