# Context pack

Issue #2392, E1 workers per-job logging. Baseline/main f6839463668c5dae4ca7234d26909e74e10b89c0.
Plan ready; independent PLAN-EVAL required before implementation.
Canonical factory createWorkerLogger('runtime') shares app LogTape config. No existing injected logger.
Scope: per-job worker modules/tests, plugin manifest dependency, workers docs, this run.
No local scaffold.runtime; no listener/host-option edits. No labels/milestones/merge.
