# S5a supervisor

Baseline: c6bce8f86f5f9e0bf61d1b5bdb228b153de37d59.
Branch: orch/divybot-6539987500. Worktree: `.`. Tier: feature; leaf run.
Implementation: assigned Codex Sol, high effort (owner override).
Independent evaluations: native Claude Opus 5.5, high effort, read-only,
with the same evaluator resumed for repair rounds. No session identifiers are public.

## Routing

Resolved with `deno task agentic:matrix --tier feature --json` before edits.
Primary implementation: sol/xhigh. PLAN-EVAL: glm_5_3/provider_default → fable_5_1/low.
IMPL-EVAL: muse_spark_1_3/xhigh → opus_5/xhigh.
Owner override, verbatim: “PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
Separate vendor family and session remain mandatory.

## Authorized write surface

- `tools/figma-plugin/**`: licensed fork, plugin, build, tests, documentation.
- `packages/fresh-ui/src/tokens/**`, `packages/fresh-ui/tokens.ts`, token scripts,
  token tests and token documentation: shared Figma importer/export contract.
- `packages/cli/src/kernel/application/ui/v2/**`, init application and public
  init/UI features, their tests and help: URL preset installation via S2.
- `deno.json`, `.github/workflows/**`: token name validation and plugin CI.
- `docs/site/**`, CLI census files: public command documentation.
- Existing generated token, CLI, plugin and MCP carriers: regenerate only.
- This run directory and `.llm/2026-10-31-figma-round-trip.md`: public evidence,
  relative paths only. Private logs: project runs directory outside Git.

Do not commit `.divybot-goal.md`, credentials, private review transcripts, local
session metadata, or docs/site/deno.lock changes.
PR: draft, Refs #2418 only, no labels; Cockpit owns merge.
