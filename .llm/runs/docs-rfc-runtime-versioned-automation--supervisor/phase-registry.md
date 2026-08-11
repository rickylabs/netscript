# Phase Registry — docs-rfc-runtime-versioned-automation--supervisor

RFC/decision-document run (SCOPE-docs overlay; research + architecture, no implementation).

| Group | Scope | Lane | Status | Evidence |
| --- | --- | --- | --- | --- |
| G0 Bootstrap | run dir, supervisor identity, overrides | Fable 5 supervisor | done | supervisor.md, drift.md |
| G1 Legacy archaeology | netscript-start-ref runtime-versioned workers/tasks/triggers capability map | archaeology sub-agents + supervisor synthesis | done | evidence/legacy-capability-map.md; slice review PASS |
| G2 Current-state matrix | runtime-config, runtime-schemas gen, workers/triggers runtimes, plugin trees, Aspire, tests/E2E | archaeology sub-agents + bounded disposable proofs | done | evidence/current-state-matrix.md + probes; slice review PASS |
| G3 #1443/#1444 interaction | control-plane vs runtime split; immediate constraints memo | supervisor (read-only peek at ns-1443 worktree + PR #1444) | done | 1444-impact.md + PR #1444 comment 5248826402 |
| G4 RFC synthesis | primary RFC, matrix, diagrams, threat model, migration, E2E acceptance, roadmap drafts | Fable 5 supervisor (authoring) | done | rfc-0001-runtime-versioned-automation.md @ f5997b6a2 |
| G5 Draft PR | draft PR vs main, labels/milestone/provenance, phase comments | supervisor | done | draft PR #1446, labels + Backlog/Triage milestone, phase comments |
| G6 PLAN-EVAL | fresh native Codex GPT-5.6 Sol · xhigh adversarial eval | separate Codex session | done (2× FAIL_PLAN → owner escalation) | plan-eval.md cycles 1+2; fixes e7378bf7c→af4f20f1e; PR comment 5249374911; eval worktree ns-rfc-plan-eval retained for a possible cycle 3 |

PLAN-EVAL is selected (decision-heavy RFC). IMPL-EVAL: the deliverable is the plan/RFC itself; the
final Sol · xhigh pass is the run's formal evaluator gate. No implementation phase exists to
IMPL-EVAL; if the owner later ratifies implementation, that work gets its own runs.
