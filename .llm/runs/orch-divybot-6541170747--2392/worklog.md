# Worklog

## Design

1. Public surface: no new exports/options; worker lifecycle logs obey existing logger configuration.
2. Vocabulary: routine job lifecycle records; jobId, jobName (definition name or id), workerId;
   taskId/taskName for tasks, duplicate skip preserves its span event.
3. Ports: existing @netscript/logger Logger, existing registries/state/runner; no custom logging port.
4. Constants: one canonical internal logger selects component runtime via createWorkerLogger.
5. Commit slices: plan artifacts; logging + tests + docs + manifest and run evidence; final handoff.
   Gates and file scope are in plan.md; every slice updates worklog/context-pack.
6. Deferred scope: startup/scheduler/listener/host settings and broader refactors are outside per-job logging.
7. Contributor path: plugins/workers/worker/job-logger.ts, then adjacent dispatcher regression tests.

## Routing override (verbatim owner grant)

"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

Feature matrix resolved; explicit owner route replaces evaluator defaults. Implementer effort medium per assignment.

## Reconcile — plan

No existing PR found for #2392. Main equals baseline. No labels/milestones changed.
Assignment has conflicting PR closure rules: operator says never Fixes/Closes, later dispatcher
requires final exact line Closes rickylabs/netscript#2392. Follow later explicit required line,
while preserving required opening Refs URL. Final canonical report uses excluded file handoff.
