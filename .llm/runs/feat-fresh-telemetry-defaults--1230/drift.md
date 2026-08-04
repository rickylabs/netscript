# Drift — #1230

- 2026-08-04: Owner ruling D6 supersedes the normal local PLAN-EVAL phase. Evaluation composes the
  draft→ready augment with the orchestrator pre-merge gate; no generator self-certification is
  claimed.
- 2026-08-04: Existing Aspire app registration already supplies OTEL environment/exporter defaults,
  so the framework seam is request-span materialization in `defineFreshApp`, not duplicate scaffold
  exporter code.
- 2026-08-04: The required JSR gate exposed two public-entrypoint module-doc failures on Fresh's
  baseline. Moved the existing AI tag into the auditor's entrypoint header window and added the
  missing Vite tag; broader existing query/route/streams doc diagnostics remain unchanged.
