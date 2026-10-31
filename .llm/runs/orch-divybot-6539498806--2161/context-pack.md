# Context pack

Issue #2161; baseline f89260ac93e7045fbf87e028b3e3e00b65dd68dd; branch orch/divybot-6539498806. Plan chooses exact first-line module opt-out shared across plugin renderers, with optional validated exclusion evidence surfaced by doctor. PLAN-EVAL PASS in round 2 with independent bootstrap sign-off; implementation has not started. See plan.md and worklog.md. Coordinator owns runtime CI label, acceptance closure and merge. #2162 owns later empty-saga behavior.

S1 implemented with 60 focused tests passing; all 19 changed TS files check/lint/fmt clean. Shared selector doc lint and quality gate pass; broad plugin doc/metadata findings are inherited in unchanged sources. S1 independent review pending. Targeted local install reproduction is being attempted without full scaffold.runtime or Aspire resources.

S1 independent review PASS; implementation is ready for signed-off commit. S2 remains: plugin docs, targeted actual installation/startup evidence, explicit configured-excluded-job negative control, final exact-head evaluation and READY handoff.

S2 complete and independently signed off after renaming the generated-project startup specimen to avoid root test discovery. All 91 selected tests and scoped static/quality/corpus gates pass. Actual installed-project acceptance is proved with isolated KV/streams dependencies. Full scaffold.runtime CI remains coordinator-owned. Commit/push S2 next, then independent exact-head IMPL-EVAL, ready transition, final same-head attestation and atomic READY handoff.
