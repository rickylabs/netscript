# Tokens v2 S1b supervisor

Tier: feature. Role: implementation. Supplied dispatcher leaf profile; repository profiles are not read.
Baseline: ad252e8c8ce14b05390d70d94fa876ae81376958.
Branch: orch/divybot-6538850770.
Implementer: Codex, OpenAI family. Evaluators: separate read-only Claude sessions, Anthropic family.
Owner override (verbatim): `PLAN-EVAL and IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high, read-only.`
Matrix queried with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh; declared fallback muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default then fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Owner evaluator override above applies. Plan max rounds 2; implementation max rounds 5; two consecutive terminal failures stop the leaf.

## Declared write surface
- `.llm/runs/orch-divybot-6538850770--s1b/`: plan, research, worklog, context, drift, evaluation, memory, contrast report, lesson and evidence.
- `.llm/runs/docs-fresh-ui-design-system--design-handoff/figma-variables/`: exact approved source PR export only, if needed for reproducibility.
- `packages/fresh-ui/`: token inputs, resolver/importer/quality/format/build source and tests, generated registry/theme/style assets, metadata, README and embedded carriers.
- `packages/cli/`: generated carriers and narrowly scoped preset contract consumers/tests, if required.
- `packages/mcp/`: generated documentation corpus/publish carriers only.
- `docs/site/`: token documentation/export inventory sources only; no lock churn.
- `.llm/tools/docs/`: narrowly scoped carrier inputs only if required.
- `.divybot-final-report.tmp` and `.divybot-final-report.md`: untracked publication handoff.

Owner process wins over generic assignment boilerplate: draft PR, Refs #2450 only, no labels, no public session identifiers; contrast burn-down remains open. READY requires exact-head required checks green. Cockpit merges.
