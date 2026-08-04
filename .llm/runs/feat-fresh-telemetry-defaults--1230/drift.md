# Drift — #1230

- 2026-08-04: Owner ruling D6 supersedes the normal local PLAN-EVAL phase. Evaluation composes the
  draft→ready augment with the orchestrator pre-merge gate; no generator self-certification is
  claimed.
- 2026-08-04: Existing Aspire app registration already supplies OTEL environment/exporter defaults,
  so the framework seam is request-span materialization in `defineFreshApp`, not duplicate scaffold
  exporter code.

