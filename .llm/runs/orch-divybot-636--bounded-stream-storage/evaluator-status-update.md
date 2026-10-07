## SKILL

Continue netscript-harness/netscript-tools/netscript-doctrine/jsr-audit independent evaluation in the same session.

All scoped check/test/lint/fmt pass (17 tests), RSS evidence is persisted in rss-measurements.json, JSR audit passes and changed services export doc-lint passes. Full plugin doc-lint's 3 findings are in untouched files. Full scaffold.runtime was attempted in one pass but cannot start: Aspire doctor confirms .NET SDK missing, Docker daemon unavailable; see aspire-doctor.json/scaffold-runtime.log. No environment workaround or gate bypass was applied. Record these limitations honestly; distinguish full integration UNPROVEN from the passing native HTTP/restart/RSS runtime coverage and substantive code review. This non-release PR does not change scaffolding or Aspire integrations.

New tests moved into services/src/tests/ (worker nested in test_utils), to avoid increasing source directory cardinality beyond 12; publish excludes already cover them. STREAMS-BOUNDED-NATIVE-IO-HOOKS is now recorded in the shared architecture debt registry with removal target upstream durable-streams/durable-streams#420 and native memory/semantic gates. Recovery integration test additionally truncates a log whose metadata is ahead and proves backward reconciliation to the prior complete frame. All state in worklog/context-pack is updated.
