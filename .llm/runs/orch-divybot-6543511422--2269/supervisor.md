# Issue 2269 leaf

Baseline: 46b22e63608eb4ba067145445b523536d6e48aa9 (main ancestry).
Branch: orch/divybot-6543511422. Implementer: Codex, OpenAI family.
Tier: feature. Supplied leaf profile governs; repository profiles are not read.
Write surface: this run directory; packages/mcp/**; packages/cli/** docs carrier consumers;
packages/agent-docs/** if a shared corpus package is required; .llm/tools/docs/**;
.llm/tools/generate-publish-assets.ts and its tests; deno.json; relevant docs carrier
and package architecture inventories, tests, and documentation. No runtime resources planned.

Matrix queried using `deno task agentic:matrix --tier feature --json`.
Owner override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
Owner requested implementer effort: high. Evaluators are Anthropic family, separate from OpenAI.
PLAN-EVAL limit 2; IMPL-EVAL limit 5; two consecutive terminal failures stop the loop.
Use repository claude-print launcher. Preserve evaluator across repair rounds with resume.
Public records omit private operational metadata per assignment. Raw evaluator streams stay outside Git.

S2 write surface also includes docs/site/reference/mcp/index.md and its export-coverage inventory,
required by CI to document the new public docs subpath.
