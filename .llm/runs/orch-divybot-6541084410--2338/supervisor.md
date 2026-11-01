# Streams restart run — 2026-10-31

- Issue: #2338; coordinator #2474 (mc009e), group C1, milestone 0.0.9.
- Branch: `orch/divybot-6541084410`; baseline `f6839463668c5dae4ca7234d26909e74e10b89c0` (main).
- Implementation: assigned Codex, OpenAI family, feature tier, owner-requested high effort.
- Independent reviewer: separate Claude session, Anthropic family, read-only, blockers only.
- Owner route override (verbatim): “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Pinned matrix inspected with `deno task agentic:matrix --tier feature --json`; feature implementation sol/xhigh; plan evaluation glm_5_3/provider_default; implementation evaluation muse_spark_1_3/xhigh. Owner's explicit review route and effort take precedence. Limits: 2 plan rounds, 5 implementation rounds; stop after two consecutive terminal failures.
- Allowed writes: `packages/plugin-streams-core/`, `docs/site/durable-workflows/streams.md`, this run directory, a dated lesson under `.llm/`, and generated docs only if the freshness gate requires them. Excluded assignment/final-report files are operational inputs and handoff only.
- No label/milestone changes; no local scaffold runtime; coordinator owns e2e-cli CI and merge.
- Privacy: public artifacts use repository-relative paths, no machine identifiers or raw reviewer events.
- Scope refinement before planning: extend existing reference-server suite at `plugins/streams/tests/service/durable-stream-producer-idempotency_test.ts`; this is test-only, no streams server implementation changes.
- Freshness scope refinement before generation: `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/cli/src/kernel/assets/embedded.generated.ts`, and any generator-owned publish twins for this API/docs change. Native freshness checks require these outputs; no handwritten bundle edits.
