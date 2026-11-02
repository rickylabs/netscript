# Plan & Design — READY FOR REVIEW

Repair wiring through existing lifecycle and manifest consumer metadata.

1. Watch the seed handoff's parent directory using Deno.watchFs before checking existing intent.
   Dispatch existing and future publications through the same idempotent worker handoff. Tie
   watcher lifetime and failures to the combined worker process; no polling or request handlers.
2. Add an explicit `plugin install --service <name>` consumer selection alongside `--app`.
   Validate before writes, persist through the existing linking manifest and reconciler, and
   preserve it on reinstall. Document streams installation with that selection.
3. Add a clean documented-order runtime gate that runs before existing restart/link fixtures,
   verifies post-seed completion and stream-backed Activity, and exercises both negative controls.
4. Regenerate all affected carriers using their tasks, run scoped and broader gates, separate
   cross-family IMPL-EVAL, final-head runtime CI, then READY handoff. Do not merge.

PLAN-EVAL: N/A. Owner explicitly scopes this as wiring with no design changes. The solution
reuses filesystem notification, existing seed dispatch/idempotency, and existing manifest edges.
No public contract redesign, storage migration or release is planned.

Gates: Deno 2.9.7 structured scoped check/lint/fmt/tests; quality:gate; JSR audits for affected
packages; full carrier chain and every root check task; clean runtime gate and negative controls;
one-pass scaffold.runtime in CI at the final head. Tests must verify real execution and Activity.

Risks: missing watcher events (subscribe before read; atomic publication and lifecycle tests),
duplicate dispatch (existing stable seed identity and durable acceptance), unwanted linking
(explicit service selection, validation and reinstall preservation), runtime fixture masking
(independent pristine setup), unavailable local Docker (record unproven; CI runtime required).

Deferred: visual redesign, unrelated plugins, protocol/storage changes. No accepted product debt.
Open decisions: none that require owner input. Exact focused test list follows the implementation.
