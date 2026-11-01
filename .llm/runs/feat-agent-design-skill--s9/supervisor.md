# Supervisor

S9 #2431, part of #2412. Baseline d6dfab0. Branch feat/agent-design-skill. Implementation: OpenAI Codex, feature tier; independent evaluator: separate read-only Anthropic Claude session, retaining the owner session preference. Model routing inspected through agentic:matrix; public records omit private machine/session identifiers.

Write surface: .llm/tools/docs/generate-design-skill.ts and its test; deno.json task aliases; skills/manifest.json, skills/netscript/SKILL.md and generated skills/netscript-design/**; packages/cli/src/kernel/assets/agent/guidance.md.template; relevant agent/init tests; native generated CLI/MCP carriers; this run. Canonical docs/design-system sources are read-only for implementation; the controlled guideline drift proof restores the exact original bytes in a finally block and commits no canonical edit. No dependency/version/lock change, registry theme installer or framework API addition.

## Refresh — 2026-11-01

Resume PR #2456 on its existing `feat/agent-design-skill` branch at
`1b8cfeb80973c4333ee6cb19e01cc5de24d76bc6`; integration baseline
`origin/main` is `6a1d84a6e`. Implementation: this OpenAI Codex session, feature tier,
operator-requested high effort. Matrix queried as JSON before edits: implementation
`sol@xhigh` → `muse_spark_1_3@xhigh`; plan evaluation
`glm_5_3@provider_default` → `fable_5_1@low`; implementation evaluation
`muse_spark_1_3@xhigh` → `opus_5@xhigh`. The operator explicitly overrides
IMPL-EVAL to native `claude -p --model claude-opus-5-5 --effort high`, read-only,
a separate Anthropic session. Preserve that session for any repair review.

Authorized refresh write surface (all paths repo-relative): merge resolutions of
`deno.json` and generated carriers; `.llm/tools/docs/generate-design-skill.ts`
and its test; `skills/netscript-design/**`; `skills/netscript/SKILL.md`;
`skills/manifest.json`; `packages/cli/src/kernel/assets/agent/guidance.md.template`;
`packages/cli/tests/agent*`; `packages/cli/tests/skills*`;
`packages/cli/src/kernel/assets/**`; `packages/mcp/src/**/generated/**`;
`packages/mcp/src/**/docs-corpus.generated.ts`; `resources/**` generated carriers;
this run directory. Expand only with an explicit drift note for a demonstrated gate
repair. Canonical design documentation is read-only except a fully restored negative
control. No dependency, lock, version, or framework API changes intended.

Public run artifacts use repo-relative paths exclusively. Raw local execution logs
and reusable memory go in the project's external run evidence directory. Stop at
READY; Cockpit owns merge. Do not create a duplicate PR or push the dispatcher branch.
