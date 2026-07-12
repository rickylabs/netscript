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

1. Tier-A substantively review/reconcile combined implementation commit `1f17fbcd` and record sign-off or required fixes.
2. Run IMPL-EVAL cycle 2 after that evidence exists.
3. If PASS, push the artifact-only follow-up and hand off remote SHA.

## Gate Summary

Scoped check/lint/fmt, 14 tests, root architecture, direct MCP doctrine, full-export doc lint, package publish dry-run, and consumer smoke are PASS.

Implementation commit `1f17fbcd` and initial harness commit `ac22eba7` are pushed at remote SHA `ac22eba7972df0541ec97cdc2e0229a78837031b`. IMPL-EVAL cycle 1 is `FAIL_FIX` on process evidence only; product gates independently passed.
