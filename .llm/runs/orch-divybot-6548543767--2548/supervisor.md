# Supervisor

Issue: #2548. Branch: `orch/divybot-6548543767`.
Baseline: `43aa891ec0782a646c0986b5d5546b83a5774ca0`.
Implementation: Codex, feature tier, owner-requested high effort.
Matrix queried with `deno task agentic:matrix --tier feature --json`: implementation sol → muse_spark_1_3; implementation evaluation muse_spark_1_3 → opus_5; max rounds 5, with leaf stop after two consecutive terminal failures.
Owner override (verbatim): `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only. Separate Anthropic evaluator; no session identifiers in public artifacts.

## Authorized write surface

- `.llm/runs/orch-divybot-6548543767--2548/` (run artifacts, memory, evaluation, lesson).
- `.llm/tools/release/` (coordinated bump and residue regression).
- `.llm/tools/validation/check-netscript-jsr-specifiers*` (registry policy and tests).
- `packages/fresh-ui/registry.json`, `packages/fresh-ui/tests/registry/`, `packages/fresh-ui/registry.generated.ts`.
- Generated carriers under `packages/cli/src/kernel/assets/`, `packages/mcp/src/infrastructure/docs/`, `packages/plugin/src/kernel/assets/`, `packages/service/src/primitives/` only as required by generators.
- Relevant release/registry contributor documentation only if needed.

Disposable rehearsal is a separate clone under the project runs directory, never a worktree or the active checkout. Generated docs-site output is regenerated, not hand-edited; docs-site lock churn is restored.
Draft PR uses `Refs #2548` only, no labels. No publication or merge.

Scope correction before implementation: release bump implementation lives in `.llm/tools/deps/bump-version.ts`, not `.llm/tools/release/`. Add `.llm/tools/deps/bump-version.ts` and `.llm/tools/deps/bump-version_test.ts` to the write surface. Registry contributor guide: `packages/fresh-ui/src/registry/README.md`.

Focused regression write surface also includes `.llm/tools/deps/bump-version-registry_test.ts` and `packages/fresh-ui/tests/registry-authoring.test.ts`.

Final delivery surface required by assignment footer: `.divybot-final-report.tmp` atomically renamed to `.divybot-final-report.md`; both excluded from Git. The canonical READY report is handed to Orchid through this file, not posted directly with gh.

Review correction write surface: `.llm/tools/release/prepare-release.ts` and its existing test, plus registry embedded output `packages/fresh-ui/src/registry/assets/registry.generated.ts` only through the generator.

Second-review correction write surface: `.llm/tools/release/github-release.ts` and `.llm/tools/release/github-release_test.ts` (inside already declared release-tooling scope). Evaluator loop stopped after its second FAIL_FIX; no third pass or self-certification.

Owner explicitly resumed the blocked task to finish remaining work and mark PR ready. Final read-only evaluation uses the existing Claude Opus 5.5 high evaluator; original verdict history retained. Ready transition is now explicitly requested when gates are satisfied.
