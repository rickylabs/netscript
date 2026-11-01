# Supervisor

- Assignment: #2569, feature tier, supplied leaf profile (not repository profiles).
- Branch: `orch/divybot-6558729485`; worktree: `.`.
- Baseline: `125c26fce7513180ec8c3676d04239794010cd25`.
- Implementation: Codex, requested `gpt-6.1-sol`, effort `xhigh`.
- Routing: `deno task agentic:matrix --tier feature --json` resolved implementation `sol` / `xhigh` (fallback `muse_spark_1_3` / `xhigh`).
- Matrix evaluator route: `muse_spark_1_3` / `xhigh`, then `opus_5` / `xhigh`.
- Owner override, verbatim: **IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.** Separate Anthropic evaluation of OpenAI implementation; no public session identifiers.
- Write surface: `docs/site/`, `.llm/tools/docs/`, `.llm/tools/mcp/`, `deno.json`, `.llm/runs/orch-divybot-6558729485--create-followups/`, and any focused routing/test file discovered under `tools/` (record exact paths before edits). Existing generated carrier targets may change only through their declared generators.
- Public artifacts: repository-relative paths only. No secrets, local host paths, or session identifiers.
- Delivery: draft PR, `Refs #2569`, no labels; normal pushes, merge `origin/main` if needed; stop at READY for Cockpit.
- Refined write surface before implementation: `tools/docs-site/fresh-ui/**`, `tools/fresh-ui-browser/docs-tests/components.spec.ts`, `docs/site/design-system/components.page.ts`, `packages/mcp/src/domain/docs/component-guidance.ts`, `packages/mcp/tests/component-guidance_test.ts`, `packages/fresh-ui/tests/publish-size.test.ts`, and generator-owned carriers from the documented chain. No CLI runtime implementation edits planned.
- Routing refinement: `packages/mcp/src/domain/docs/guidance-index.ts` also belongs to the write surface: generic ranker must not select component pages when no component identity was recognized.
