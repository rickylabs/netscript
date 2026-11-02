# Preset and theming follow-ups

- Baseline: `6a1d84a6e04c0d39df3926528e0380e267316aee`
- Branch: `orch/divybot-6555223992`; worktree: `.`
- Implementer: Codex, OpenAI family; feature tier; high effort requested.
- Evaluator: separate read-only Claude session, Anthropic family.
- Owner override (verbatim): `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high, read-only.`
- Matrix queried with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Explicit owner route selects Claude Opus 5.5/high instead.
- Public evidence: repo-relative paths only; no session IDs. Assignment file never staged.
- Authorized write surface: this run directory; `packages/cli/src/kernel/domain/ui/ui-config.ts` and registry tests; CLI app scaffold AGENTS template/tests and ui:add hint/tests; `tools/figma-plugin/`; `packages/fresh-ui/src/tokens/` Figma round-trip implementation/tests; `packages/fresh-ui/deno.lock` only if provenance establishes unintended churn; scoped CLI quality gate/baseline/tests under `.llm/tools/`; root `deno.json`; `.github/workflows/ci.yml`; theming guide and a linked upgrade guide under `docs/site/web-layer/how-to/`; generated documentation/assets carriers required by root check tasks.
- Process: one scoped implementation slice plus generated-carrier/evidence commits; one draft PR, no labels; Refs #2516 and Refs #2556. Never rebase, force-push, merge, or self-certify. Stop at READY for Cockpit.
