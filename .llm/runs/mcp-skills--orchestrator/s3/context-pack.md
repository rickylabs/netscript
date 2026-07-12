# Context Pack: `@netscript/mcp` S3

## State

Run `mcp-skills--orchestrator/s3` targets branch `feat/netscript-mcp-skills-s3-telemetry` at baseline `3870c553`. Archetype 6, no overlay. PLAN-EVAL cycle 3 passed; implementation and requested gates are complete.

## Locked Scope

Shared endpoint discovery plus `get_app_status`, `list_runs`, `get_run`, and `get_recent_errors`. No S4 analytics, docs, CLI trigger, scaffold, PR, or merge.

## Key Decisions

- Reuse upstream query port/factory; use telemetry constants for specific values and one prefix table for domain classification.
- One pure endpoint resolver shared with doctor: explicit → NetScript env → Aspire port over HTTP → default; optional HTTPS probe fallback.
- Pure bounded aggregations tested over in-memory telemetry fixtures.
- Existing horizontal-shape debt remains the only accepted architecture deviation.

## Next

1. Inspect diff and lock hygiene.
2. Commit logical S3 implementation/evidence with `#727` and no closing keyword.
3. Push exact requested refspec and verify remote SHA.

## Gate Summary

Scoped check/lint/fmt, 14 tests, root architecture, direct MCP doctrine, full-export doc lint, package publish dry-run, and consumer smoke are PASS.
