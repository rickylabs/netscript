# S8c supervisor contract

- Baseline: `d6dfab0cb0e57f76b5d976f59e3603d8fff3dce0` (main).
- Branch: `orch/divybot-6470427461`.
- Implementer: OpenAI Codex, feature tier, implementation role (matrix primary `sol`).
- Independent reviewer: native Claude, owner-requested `claude-opus-5-5`, high effort, read-only. Separate vendor family and session. Re-steer the same evaluator for repair rounds.
- Owner override: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.” This overrides the feature evaluator cells; no inferred promotion or alternative model.
- Public evidence uses repository-relative paths and excludes private runtime identity.

## Declared write surface

`docs/site/` (components, configuration, styles, enhancement scripts, fixture galleries and generated tracked content if required); `tools/docs-site/`; `tools/fresh-ui-browser/docs-tests/`; `.github/workflows/pages.yml`; `.github/scripts/ci-classify-changes.ts`; `.github/scripts/ci-classify-changes.test.ts`; `.llm/tools/docs/` (existing follow-up tests/helpers only); `.llm/runs/orch-divybot-6470427461--s8c/`; `.llm/runs/orch-divybot-6463056924--s8/drift.md` (the explicitly requested stale-note repair); generated documentation carriers under `packages/cli/src/kernel/assets/`, `packages/mcp/src/publish-assets.generated.ts`, and `.llm/assets/agent-docs/provenance.json` only through native generators. Ignored docs build, browser results and temporary reports are outputs, not source.

No package API, dependency upgrade, labels, merge, tag or release is authorized. Do not stage the assignment or final-publication handoff files.

The native publish-assets task may write the exact checked-in paths in `PUBLISH_ASSET_OUTPUTS` in `.llm/tools/generate-publish-assets.ts`, solely to regenerate existing assets. Inspect every resulting diff; unrelated generator drift is not silently accepted.
