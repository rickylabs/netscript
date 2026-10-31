# Issue 2155 — E2 documentation audit

- Baseline: `ad252e8c8ce14b05390d70d94fa876ae81376958` (`origin/main`, verified at intake).
- Branch: `orch/divybot-6538837985`; target: `main`.
- Implementation: Codex / OpenAI, feature tier, requested high effort.
- Evaluations: separate read-only Claude sessions, `claude-opus-5-5`, high effort; stdin closed, blockers only. Resume the same evaluator across repair rounds.
- Owner routing override: the assignment explicitly selects Claude Opus 5.5 high for both evaluation phases; the pinned feature matrix was queried with `deno task agentic:matrix --tier feature --json`.
- Allowed writes: `docs/site/**`, docs tooling under `.llm/tools/docs/**` only if necessary, and this run directory. Final report handoff is an excluded assignment artifact. No package/plugin source or generated package assets may change.
- Public evidence contains only repository-relative paths; no private infrastructure or session identifiers.
- PLAN-EVAL: required before implementation. IMPL-EVAL: required before readiness and on the final pushed head.
- PR ownership: implementer opens draft and marks ready; coordinator controls labels, milestone and merge. No local scaffold runtime E2E.

- Declared docs-tooling follow-up: `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`, regenerated after restoring the worker lesson. No scan policy changes; reason/evidence in drift.md.

## Coordinator generated-only exception

Authority: https://github.com/rickylabs/netscript/pull/2494#issuecomment-6539166396

**Authorized:** regenerate the generated documentation carriers that the docs freshness gates require, using only the canonical generator tasks. That means `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`, then rechecking `publish-assets` and `assets-barrel`, regenerating whatever they report stale.

Two limits:
- Commit generator output only. No hand edits, and no other `packages/**` or `plugins/**` changes.
- Name each regenerated file and the generator command that produced it in the READY reply.

Allowed package writes are only canonical generator output required by prose, publish-assets and assets-barrel freshness. Framework source remains excluded. Final exact-head evaluation is rerun after integration as explicitly requested.
