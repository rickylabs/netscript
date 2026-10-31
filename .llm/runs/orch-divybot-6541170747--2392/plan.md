# Plan & Design — READY FOR REVIEW

Archetype 5 plugin, runtime logging concern; docs overlay. Doctrine A5/A7/A10/A13/A14.
LOCKED: canonical @netscript/logger factory, one internal workers/runtime logger; no sinks,
console adapters, logging initialization or public options. Log routine lifecycle at debug with
jobId/jobName/workerId; move processing message after definition lookup to access name.
Duplicate skip receives resolved name. Tasks use taskId/taskName; task failures remain error.
Keep current warning/error diagnostics; failed task result currently printed at log becomes structured error.
Open decisions: none that force rework. Contributor path: worker/job-logger.ts.

Slices:
1. Plan artifacts, draft PR, independent PLAN-EVAL before source changes.
2. Internal logger + per-job callsites + adjacent regression tests + manifest dependency + docs.
   Prove debug records/category/properties on real in-process dispatch; default production info
   silence for all console methods; duplicate and task success/failure coverage. Run negative control
   by temporarily restoring old callsites, preserving tests, then restore fix.
3. Evaluator-reviewed validation/handoff artifacts and exact pushed-head final IMPL-EVAL.

Gates: structured test/check/lint/fmt wrappers on workers source; quality:gate;
JSR audit wrapper and doc:lint on plugin. Report pre-existing failures without weakening gates.
No local scaffold.runtime per operator instruction. This changes per-job logging and imports only,
not host/queue/runner wiring or scaffold; e2e-cli CI requirement to be confirmed by evaluator.
Risks: global logging tests must reset in finally; all-console capture avoids severity bypass;
negative control restores exact bytes; named and unnamed jobs cover fallback.
JSR risk: direct dependency must be declared, no public type/export additions or slow types.
Deferred: startup/shutdown/scheduler logging, unrelated listener/host option work, architectural refactors.
Debt: no new accepted architecture debt.
