# Callout and color-policy follow-ups

Issue #2466, part of #2412, release0.0.9. Fresh branch `fix/docs-callout-policy-2466` starts at
merged main `4a2dae3730a39199e3ea5aa2f55d6e1863252bbf` after #2582. No existing PR or worker owns #2466.

Feature tier; Codex implementation, OpenAI family. Matrix queried using
`deno task agentic:matrix --tier feature --json`. Continue the session owner override verbatim:
“IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.” Independent evaluator is a
separate Anthropic session, resumed for repairs. No target-repository profiles are read.

Permitted tracked writes:
- `.llm/runs/fix-docs-callout-policy-2466--delivery/**`
- `tools/docs-site/{callout-types.ts,callout-types_test.ts,style-policy.ts,README.md}`
- `tools/fresh-ui-browser/docs-tests/**` (actual browser policy/Markdown regressions)
- `docs/site/_plugins/**` and `docs/site/_components/callout.vto` if necessary for real export tests
- `docs/site/design-system/docs-kit/callouts.md` if contract clarification is required
- generated carrier outputs under `.llm/assets/agent-docs/**` and `packages/mcp/src/**`

Keep public evidence repository-relative. Raw logs and evaluator identity stay private. No labels,
no rebase/force-push, no merge. Do not reuse the previous assignment's bound final-report file for
this issue. Cockpit owns merges.
