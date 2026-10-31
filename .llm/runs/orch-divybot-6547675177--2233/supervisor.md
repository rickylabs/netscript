# Run supervisor

Issue #2233; coordinator #2474 (mc009e). Branch `orch/divybot-6547675177`.
Baseline: `6c3f8a1182b8df89fbe3334fa81ce35f541c26ac` (current main at intake).
Implementation: OpenAI Codex, supplied session. Separate evaluation: Anthropic Claude.
Tier: feature. Queried `deno task agentic:matrix --tier feature --json`.
Owner override, verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
No model substitution authorized. Maximum two PLAN-EVAL and five IMPL-EVAL rounds;
two consecutive terminal failures stop the leaf.

## Authorized write surface

- `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts`
- `packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts`
- `.llm/tools/docs/generated-carriers.md`
- This run directory (plans, evidence, memory, dated lesson).
- Canonical generated carriers only if a freshness gate requires regeneration:
  `packages/cli/src/kernel/assets/*.generated.ts`,
  `packages/mcp/src/infrastructure/docs/*.generated.ts`,
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`,
  `packages/mcp/src/embedded-docs-corpus.generated.ts`, `.llm/assets/agent-docs/provenance.json`.

Never commit the assignment or lock churn. No labels or milestones; coordinator merges.

CI follow-up authorized by owner request to keep PR green: canonical generated inventory `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` is added to the write surface.
