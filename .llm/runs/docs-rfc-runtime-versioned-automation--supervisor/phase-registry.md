# Phase Registry — docs-rfc-runtime-versioned-automation--supervisor

RFC/decision-document run (SCOPE-docs overlay; research + architecture, no implementation).

| Group                      | Scope                                                                                           | Lane                                                       | Status                                                                                                     | Evidence                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| G0 Bootstrap               | run dir, supervisor identity, overrides                                                         | Fable 5 supervisor                                         | done                                                                                                       | supervisor.md, drift.md                                                          |
| G1 Legacy archaeology      | netscript-start-ref runtime-versioned workers/tasks/triggers capability map                     | archaeology sub-agents + supervisor synthesis              | done                                                                                                       | evidence/legacy-capability-map.md; slice review PASS                             |
| G2 Current-state matrix    | runtime-config, runtime-schemas gen, workers/triggers runtimes, plugin trees, Aspire, tests/E2E | archaeology sub-agents + bounded disposable proofs         | done                                                                                                       | evidence/current-state-matrix.md + probes; slice review PASS                     |
| G3 #1443/#1444 interaction | control-plane vs runtime split; immediate constraints memo                                      | supervisor (read-only peek at ns-1443 worktree + PR #1444) | done                                                                                                       | 1444-impact.md + PR #1444 comment 5248826402                                     |
| G4 RFC synthesis           | primary RFC, matrix, diagrams, threat model, migration, E2E acceptance, roadmap drafts          | Fable 5 supervisor (authoring)                             | done                                                                                                       | rfc-0001-runtime-versioned-automation.md @ f5997b6a2                             |
| G5 Draft PR                | draft PR vs main, labels/milestone/provenance, phase comments                                   | supervisor                                                 | done                                                                                                       | draft PR #1446, labels + Backlog/Triage milestone, phase comments                |
| G6 PLAN-EVAL               | fresh native Codex GPT-5.6 Sol · xhigh adversarial eval                                         | separate Codex session                                     | running (cycles 1–6; cycle 6: architecture clean, record-bookkeeping findings fixed; cycle 7 = final pass) | plan-eval.md cycles 1–6; eval thread `019fef2b-…03fc`; worktree ns-rfc-plan-eval |

| G7 Competitive study (D-8) | 9-system primary-source comparison, RFC §14.1/§13.1/P-5 integration,
wording scope fixes | Fable 5 supervisor | done | evidence/competitive-architecture-study.md;
commits 811373a87 + 3c918a64e |

PLAN-EVAL is selected (decision-heavy RFC). IMPL-EVAL: the deliverable is the plan/RFC itself; the
final Sol · xhigh pass is the run's formal evaluator gate. No implementation phase exists to
IMPL-EVAL; if the owner later ratifies implementation, that work gets its own runs.
