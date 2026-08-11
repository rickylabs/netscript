# Plan — docs-rfc-runtime-versioned-automation--supervisor

Status: **LOCKED** (fix cycle 1 after PLAN-EVAL cycle 1 FAIL_PLAN). Architecture decisions are
locked in the RFC itself (ownership §9; epoch consistency §5.2/5.3; fleet admission §5.3; adapter
parity/narrowing §5.2; T1 enforcement contract §5.4; cron ownership §5.1). PLAN-EVAL (Sol ·
xhigh, owner override D-2) is this run's formal gate; cycle 2 evaluates the fixed package.

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

## Risk register (expanded per PLAN-EVAL cycle 1)

| Risk | Mitigation (RFC §, owning slice) |
| --- | --- |
| RFC claims drift from code reality | status tags + path evidence; independent Codex derivation; supervisor spot-checks; F7 scope corrections applied |
| Over-design (faking certainty on staged questions) | §11 prerequisite RFCs with entry criteria; §15 classified deferrals |
| Cockpit dependency mis-modeled | live issue states verified; explicit A7 edges (#923–#932 + #934, plus A3b/A4b/A5b) |
| Cross-family partial activation observed by replicas | single transactional activation-set manifest + epoch (§5.2, A1a) |
| Out-of-order feed vs poll overwrites newer state | strictly monotonic epoch application, stale rejection (§5.3, A1c) |
| Schema-skew split fleet after partial deploy | fleet registration + admission-at-commit + convergence status/SLO + force-drain override (§5.3, A2b) |
| KV/Postgres semantic divergence | one adapter-conformance suite; KV narrowed to single-writer dev, refuses fleet features (§5.2, A1a/A1b) |
| Non-Deno T1 escape / overclaimed sandbox | T1 enforcement contract stated bluntly; per-runtime negative tests incl. honest non-enforcement pins; T2 required for untrusted polyglot (§5.4/§6, A5a) |
| Snapshot integrity vs malicious store/MITM | trust assumptions explicit (TLS + content hashes = integrity-of-identity); signed snapshots bundled with P-3 (§6) |
| Secret leakage via captured output | bounded best-effort redaction, residual risk documented (§6, A5b) |
| Control-plane child loader executes consumer code with net | TM9: lockfile-pinned + --cached-only default, warm-cache-offline acceptance gate (§6, A2a) |
| Cron subsystem duplication deepened | task@1 has no schedule; scheduled trigger is the only operator cron; CRON-SUBSYSTEM-DUP untouched for T0 (§5.1) |
| Sub-agent worktree contention | G1→G2 serialized; evaluator in dedicated worktree |
| Evaluator route blocked | record in drift + lane-policy fallbacks |

## Open-decision sweep (plan-gate requirement)

Must-resolve-now items are **resolved in the RFC** (ownership §9; activation consistency
§5.2/5.3; replica admission §5.3; store parity §5.2; T1 contract §5.4; cron ownership §5.1).
Remaining open decisions, each classified: naming → defer to A0 (safe; spelling only);
two-person activation default → defer to A2b (policy hook exists either way); retention defaults
→ defer to A3b (conservative caps shipped behind config). P-1..P-4 deferred with entry criteria
(§11). No open decision forces rework if deferred as classified.

## Commit slices (docs-only run; files + proving gate per slice)

1. **S1 bootstrap** — files: run dir (`supervisor.md`, `drift.md`, `phase-registry.md`, briefs,
   `1444-impact.md`); gate: harness activation checklist. DONE (`e7378bf7c`).
2. **S2 legacy evidence** — files: `evidence/legacy-capability-map.md`; gate: supervisor A1
   review + 2 verbatim spot-checks. DONE (`e7378bf7c`).
3. **S3 current evidence** — files: `evidence/current-state-matrix.md`, `evidence/current-state-probes/**`;
   gate: probe exit codes recorded + supervisor A1 review. DONE (`f5997b6a2`).
4. **S4 RFC** — files: `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`; gates:
   `docs:links`, `deno fmt --check` on the file, PR body reconciliation. DONE + fix cycle 1.
5. **S5 PLAN-EVAL cycles** — files: `plan-eval.md` (evaluator-written), fix-cycle diffs; gate:
   `PLAN-EVAL: PASS` (≤2 cycles then escalate). Cycle 1 FAIL_PLAN consumed; cycle 2 pending.

Each slice: commit → push (explicit refspec) → draft-PR comment with evidence.
