# Saga atomic persistence — #2159

Baseline: 4060d1e61da0a8324e77ed351b05a343d746a188 (main).
Branch: orch/divybot-6539608318. Implementation: Codex, feature tier, xhigh.
Run mode: dispatcher-supplied leaf; repository profiles are not used.

Write surface: packages/plugin-sagas-core/**; plugins/sagas/src/runtime/**;
plugins/sagas/database/**; plugins/sagas/tests/**; .llm/runs/orch-divybot-6539608318--2159/**.
Documentation may change in packages/plugin-sagas-core/README.md only.
No lock, cache, unrelated source, taxonomy, or milestone mutation. Do not commit assignment files.

Matrix queried with `deno task agentic:matrix --tier feature --json`.
Implementation primary sol/xhigh, fallback muse_spark_1_3/xhigh.
Plan evaluator primary glm_5_3/provider_default, fallback fable_5_1/low.
Implementation evaluator primary muse_spark_1_3/xhigh, fallback opus_5/xhigh.
Owner override, verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
This override preserves separate sessions and different vendor families. Maximum rounds: plan 2,
implementation 5. Reuse evaluator across rounds; final evaluation names exact pushed SHA.

Generated write-surface extension: packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts.
The existing public-export freshness gate requires regenerating this artifact after the source
commit; no MCP behavior or unrelated export changes are authorized.

CI repair write-surface extension: plugins/sagas/services/src/prisma-retention_test.ts.
The service/API regression must use the atomic-capability-preserving projection factory.
