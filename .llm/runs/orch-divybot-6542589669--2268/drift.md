# Drift

- RTK unavailable; focused raw reads and structured gate wrappers used.
- Owner's exact evaluator override: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only." This overrides phase routes while preserving vendor/session independence.
- Explicit issue operator rules take precedence over conflicting generic dispatcher defaults for closing keywords, labels, further work and final report publication. No labels/milestones or closing keywords will be added.

- Pre-implementation research found Aspire CLI's displayed JSON rounds duration and drops resource attributes. Plan refined to async Aspire ps through the existing command seam, raw supported dashboard API snapshots and CLI-identical login-token exchange. This is within the declared MCP/telemetry surface. PLAN-EVAL blockers require OTLP log normalization and truthful partial coverage before code.

- Existing CLI runtime-health tests import the telemetry flow directly with a query port. Preserved that explicit injection seam; production composition supplies the strict snapshot port. Provenance labels injected-query results separately.
- Public ToolError provenance requires a named TelemetryProvenance export (the per-entrypoint doc-lint gate caught the missing export). Kept the snapshot acquisition port internal; transport fixtures test the real CLI composition through its existing endpoint override. One additive evidence-type export and CHANGELOG entry are now in scope; export map and dependencies stay unchanged.
- Grouped existing telemetry summaries and query adapter under the new telemetry feature folders, and extracted analysis schemas from the already over-cap central registry. This avoids deepening pre-existing file/folder cardinality debt; no new architecture debt accepted.

- Source and documentation finish together in the implementation slice: required public-type docs and generated carriers must describe the same tree before review. Final verification/handoff is the remaining evidence-only slice.
- Regenerated the maintained Aspire surface manifest under .llm/tools/validation/fixtures after staging new source so the normal static scope includes it. No checker policy or exclusion changed.
- Full telemetry doc lint is a baseline failure: six private-type-ref findings and one missing JSDoc, identical by file/category/count in a detached baseline checkout. MCP's full export map and the changed telemetry/query entrypoint pass. No unrelated public-type remediation added.

- CI continuation: current test-5 shard failed only the real CLI stdio smoke, whose unreachable-endpoint assertion still expected the former health-summary shape. Extend this leaf's test surface to packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts and assert the approved telemetry_unavailable error/provenance contract. This does not change scaffold output or runtime wiring.
