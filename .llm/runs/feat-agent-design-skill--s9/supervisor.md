# Supervisor

S9 #2431, part of #2412. Baseline d6dfab0. Branch feat/agent-design-skill. Implementation: OpenAI Codex, feature tier; independent evaluator: separate read-only Anthropic Claude session, retaining the owner session preference. Model routing inspected through agentic:matrix; public records omit private machine/session identifiers.

Write surface: .llm/tools/docs/generate-design-skill.ts and its test; deno.json task aliases; skills/manifest.json, skills/netscript/SKILL.md and generated skills/netscript-design/**; packages/cli/src/kernel/assets/agent/guidance.md.template; relevant agent/init tests; native generated CLI/MCP carriers; this run. Canonical docs/design-system sources are read-only for implementation; the controlled guideline drift proof restores the exact original bytes in a finally block and commits no canonical edit. No dependency/version/lock change, registry theme installer or framework API addition.
