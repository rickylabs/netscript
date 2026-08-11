# Plan — docs-rfc-runtime-versioned-automation--supervisor

Status: **LOCKED** (post owner-authorized PLAN-EVAL cycles 3–6 + fix cycles; cycle 6 found no
unresolved architecture decision — remaining findings were record bookkeeping, fixed in this slice).
Architecture decisions locked in the RFC: ownership §9; epoch consistency + complete-desired-state
§5.2/5.3; fleet admission + leased registration §5.3; **control-plane-outage availability contract
§5.3-8 (**indefinite** last-good serving, never self-drain, idle-and-loud cold start; pinned-lookup
transient/terminal classes)**; adapter parity/narrowing §5.2; T1 enforcement contract §5.4; cron
ownership §5.1; competitive positioning §14.1 (D-8 study: adopted patterns / non-goals /
differentiators; benchmark gates §13.1; P-5 staged). PLAN-EVAL (Sol·xhigh, D-2): cycles 1–4 all
FAIL_PLAN with monotonically narrowing findings; every finding of every cycle is fixed in-tree;
cycle 5 (owner-ordered "one more eval") is the deciding pass, and on PASS the RFC is produced for
the owner. PR stays draft until ratification.

## Profile

- Intent: RFC / decision document (research + architecture, no implementation).
- Overlay: `SCOPE-docs`. Archetypes the RFC **selects for the future waves**: ARCHETYPE-1
  (`automation-core`, contracts only), ARCHETYPE-2/3 (`automation-runtime`, behavior + ports +
  adapters), ARCHETYPE-5 (thin `plugins/automation` connector; plus existing workers/triggers
  connectors), ARCHETYPE-6 (`packages/cli` command group). Existing archetypes it _describes_: the
  current workers/triggers cores and CLI surfaces under evidence.
- Gates: docs-source gates (doc-lint, scoped fmt/check where applicable), CI docs lane
  (`ci:skip-e2e` + `ci:skip-scaffold` on the draft PR — docs-only diff), final Sol·xhigh PLAN-EVAL.

## Deliverable set (locked)

1. `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` — primary RFC, status
   `Proposed`. (Locked decision: create `docs/architecture/rfc/` as the RFC home; no prior RFC/ADR
   tree exists in-repo; the #890 precedent lived only in a run dir, which made it hard to cite —
   this RFC establishes the in-repo location and back-links #890's record.)
2. Capability matrix (legacy → current → gap → recommendation) — RFC appendix, sourced from
   `evidence/legacy-capability-map.md` + `evidence/current-state-matrix.md`.
3. `1444-impact.md` — delivered early (PR #1444 comment 5248826402). Folded into the RFC.
4. Architecture + deployment diagrams (mermaid, in-RFC), API/config examples, threat model,
   **replacement/cleanup plan** (obsolete packages/commands/types/docs/generated files/tests to
   remove or rewrite — D-5: no consumer migration/compat layer), E2E acceptance model, phased
   roadmap with **draft** epic/issue graph (not filed — owner ratification required).
5. Design-depth core (D-4): runtime **contribution model** (extract the #890 pattern — contracts
   package, thin pointer axis, generated registries — test whether runtime automation needs one or
   several contribution families; no hardcoded topic switch statements), control/data-plane
   boundaries, execution/sandbox **port + adapters over established isolation tech** (survey with
   primary sources: Deno permissions/subprocess, containers/rootless, gVisor, Firecracker/microVM,
   WASM/WASI/component model, isolates, managed sandbox products; bespoke isolation only on an
   evidenced market gap), version/promotion consistency, multi-instance propagation, security,
   observability, and a five-option package/plugin ownership comparison (extend-existing / neutral
   core package / split contracts+control+client+runtime / thin connector plugin / host-composed
   aggregation) judged against doctrine, DX, JSR packaging, deployment topology, trust boundaries.

## Hard constraints (owner)

- Preserve the differentiating capability: runtime-versioned tasks/triggers on a running stack (D-10
  standing constraint). No static-config collapse; legacy design not assumed correct.
- **Complete redesign in scope** (D-4): legacy = outcome evidence + three representative operator
  journeys only; current mechanisms = candidate seams, not foundations; compare evolutionary vs
  clean-sheet vs hybrid honestly.
- **No backward-compatibility/migration layer** (D-5): clean break authorized; transition plan is a
  codebase replacement/cleanup plan with an explicit obsolete-surface inventory; compatibility only
  with stable doctrine and active framework seams.
- Frontend sequencing (D-3, refined by D-9): #890/#922 (minimum cut #923–#932 + #934; #933
  adjacency) are sufficient **only** for the production/admin userland automation console (RFC §8.2
  surface 1). Developer DevTools (diagnostics, live definitions/state, execution journeys, dev
  management affordances) are a distinct host/contribution surface behind the staged P-6 DevTools
  RFC, which re-evaluates epic #400 (+ #685/#780/#506 as evidence, not ratified architecture) and
  consumes this RFC's management/observability contracts. Two hosts decided, not one ambiguous
  cockpit. No parallel Fresh/dashboard seam; backend slices stay frontend-independent.
- Draft PR only; no epic/issue filing; no ready-for-review until owner ratifies.
- #1444 keeps its D-10 boundary; this RFC does not ask it for redesign work.

## Risk register (expanded per PLAN-EVAL cycle 1)

| Risk                                                       | Mitigation (RFC §, owning slice)                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RFC claims drift from code reality                         | status tags + path evidence; independent Codex derivation; supervisor spot-checks; F7 scope corrections applied                                                                                                                                                                                                           |
| Over-design (faking certainty on staged questions)         | §11 prerequisite RFCs with entry criteria; §15 classified deferrals                                                                                                                                                                                                                                                       |
| Cockpit dependency mis-modeled                             | live issue states verified; explicit A7 edges (#923–#932 + #934, plus A3b/A4b/A5b)                                                                                                                                                                                                                                        |
| Cross-family partial activation observed by replicas       | single transactional activation-set manifest + epoch (§5.2, A1a)                                                                                                                                                                                                                                                          |
| Out-of-order feed vs poll overwrites newer state           | strictly monotonic epoch application, stale rejection (§5.3, A1c)                                                                                                                                                                                                                                                         |
| Schema-skew split fleet after partial deploy               | fleet registration + admission-at-commit + convergence status/SLO + force-drain override (§5.3, A2b)                                                                                                                                                                                                                      |
| KV/Postgres semantic divergence                            | one adapter-conformance suite; KV narrowed to single-writer dev, refuses fleet features (§5.2, A1a/A1b)                                                                                                                                                                                                                   |
| Non-Deno T1 escape / overclaimed sandbox                   | T1 enforcement contract stated bluntly; per-runtime negative tests incl. honest non-enforcement pins; T2 required for untrusted polyglot (§5.4/§6, A5a)                                                                                                                                                                   |
| Snapshot integrity vs malicious store/MITM                 | trust assumptions explicit (TLS + content hashes = integrity-of-identity); signed snapshots bundled with P-3 (§6)                                                                                                                                                                                                         |
| Secret leakage via captured output                         | bounded best-effort redaction, residual risk documented (§6, A5b)                                                                                                                                                                                                                                                         |
| Control-plane child loader executes consumer code with net | TM9: lockfile-pinned + --cached-only default, warm-cache-offline acceptance gate (§6, A2a)                                                                                                                                                                                                                                |
| Cron subsystem duplication deepened                        | task@1 has no schedule; scheduled trigger is the only operator cron; CRON-SUBSYSTEM-DUP untouched for T0 (§5.1)                                                                                                                                                                                                           |
| Sub-agent worktree contention                              | G1→G2 serialized; evaluator in dedicated worktree                                                                                                                                                                                                                                                                         |
| Evaluator route blocked                                    | record in drift + lane-policy fallbacks                                                                                                                                                                                                                                                                                   |
| Management/feed outage → lease expiry or pinned-lookup DLQ | §5.3-8 availability contract: **indefinite** last-good serving, never drains (the staleness SLO bounds silence, not serving); idle-and-loud cold start; lookup failures classified transient (queue retry) vs terminal (DLQ); revision cache pre-warmed by snapshots; outage E2E is §13 test 8, exercised in A8 with BG-1 |

## Open-decision sweep (plan-gate requirement)

Must-resolve-now items are **resolved in the RFC** (ownership §9; activation consistency §5.2/5.3;
replica admission §5.3; store parity §5.2; T1 contract §5.4; cron ownership §5.1). Remaining open
decisions, each classified: naming → defer to A0 (safe; spelling only); two-person activation
default → defer to A2b (policy hook exists either way); retention defaults → defer to A3b
(conservative caps shipped behind config). **P-1..P-6 deferred with entry criteria (§11)** — P-6
(DevTools RFC, owner directive D-9) is safe to defer because its rationale, the stable contracts it
consumes (A2b management, A3b history, A2d convergence, §7 OTel vocabulary), and its entry criterion
(after those land) are explicit in RFC §11, and no runtime slice depends on its outcome. The cycle-3
must-resolve item — execution-plane availability during control-plane outage + pinned-lookup failure
classes — is **resolved** in §5.3 steps 6–8 (indefinite last-good serving with no expiry transition;
local validation gates serving, currentness gates convergence; transient-vs-terminal classification;
revision cache). The two-frontend boundary (D-9) is **decided** in §8.2. No open decision forces
rework if deferred as classified.

## Commit slices (docs-only run; files + proving gate per slice)

1. **S1 bootstrap** — files: run dir (`supervisor.md`, `drift.md`, `phase-registry.md`, briefs,
   `1444-impact.md`); gate: harness activation checklist. DONE (`e7378bf7c`).
2. **S2 legacy evidence** — files: `evidence/legacy-capability-map.md`; gate: supervisor A1 review +
   2 verbatim spot-checks. DONE (`e7378bf7c`).
3. **S3 current evidence** — files: `evidence/current-state-matrix.md`,
   `evidence/current-state-probes/**`; gate: probe exit codes recorded + supervisor A1 review. DONE
   (`f5997b6a2`).
4. **S4 RFC** — files: `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`; gates:
   `docs:links`, `deno fmt --check` on the file, PR body reconciliation. DONE + fix cycle 1.
5. **S5 PLAN-EVAL cycles** — files: `plan-eval.md` (evaluator-written, cycles 1–5), fix-cycle diffs;
   gate: verdict recorded per cycle. Cycles 1–2 FAIL_PLAN → protocol escalation; owner authorized
   cycle 3; cycle 3 FAIL_PLAN with 6 findings → all fixed (worklog). Owner ratification is the
   closing gate per D-8 directive.
6. **S6 competitive study (D-8)** — files: `evidence/competitive-architecture-study.md`, RFC
   §14.1/§13.1/P-5, wording corrections; gates: `docs:links` + fmt + cycle-3 evaluator review of the
   study. DONE (`811373a87` + fix commit).

Each slice: commit → push (explicit refspec) → draft-PR comment with evidence.
