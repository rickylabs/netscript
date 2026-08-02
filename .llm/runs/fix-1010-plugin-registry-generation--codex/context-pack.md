# Context Pack — fix-1010-plugin-registry-generation--codex

## Status

- Phase: merge-current-main follow-up planned; integration and push pending.
- Branch/worktree clean at baseline before run artifacts.
- Published 0.0.2 reproduction captured once in `.llm/tmp/issue-1010-clean-room-repro.log`.
- PLAN-EVAL passed in a separate Claude Code + OpenRouter Qwen session before implementation.
- Slice 1 implements manifest-driven authoritative generation; focused tests and targeted check pass.
- Slice 2 delegates sync and proves non-empty workers/sagas/triggers canonical registries with the real generators.
- Scoped check/lint/test/format, quality, JSR audit, and publish dry-run gates pass.
- Full runtime raw exit 1: 44 pass, only unrelated users-service health timeout; all registry-specific gates pass.
- Follow-up commits resolve workspace manifests before JSR, exclude trigger runtime glue, and replace
  hollow text checks with generated-module loading/rejection tests.
- Follow-up broad check, `ci:quality`, focused tests, and publish dry-run all exit 0. Full E2E was
  intentionally not rerun per supervisor instruction.
- Workers, sagas, and triggers now each have a generated-registry loading assertion with negative
  exclusion/suffix evidence; the focused suite passes 8 tests (4 steps), 0 failed.
- Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01).
- `behavior.ai-chat-route` reproduced from the retained failing scaffold with
  `AI tool module ai/tools/skill-loader.ts does not export an AiToolDefinition.`
- The AI manifest now excludes the scaffold-only skill-loader factory. Real registry generation and
  import tests resolve `e2e-tool` and `assistant`; retained-scaffold behavior re-verification exits 0.
- CLI check/lint/fmt, 15 focused tests, plugin AI publish dry-run, and `quality:gate` all exit 0.

## Root Cause

- `generate plugins` only runs the generic SDK walker and silently accepts zero emissions.
- Plugin-owned runtime generators and their canonical paths exist only behind each package's
  `scaffold.runtime.json` and are not invoked publicly.
- `plugin sync` loads config correctly in a project-rooted child but then imports project plugin
  modules in the parent CLI process, losing project import-map context and failing on `zod`.
- Canonical trigger registry generation exposed a separate latent manifest error: `runtime.ts` was
  included as a trigger. The old missing-registry fallback had hidden this defect.
- Local-source E2E still fetched the released manifest/generator, so an in-repo manifest correction
  could not affect workspace scaffolds before publication.
- AI manifest drift omitted `skill-loader.ts` from its tool exclusions even though the compiler's
  canonical target excluded it. Manifest-driven regeneration therefore imported a factory module
  as a concrete tool definition and threw before `e2e-tool` could be resolved.
- The initial workspace resolver inspected only import-map values. Scaffold projects declare copied
  plugins through `workspace: ["./plugins/*"]`; AI has no local package import, so it was missed and
  the released manifest won despite the local member.

## Locked Direction

- `generate plugins` authoritative; `plugin sync` delegates.
- Discover installed package runtime manifests generically; no official-plugin name switch.
- Execute generator child processes with project cwd and config.
- Validate each declared runtime target is non-empty and name failures by plugin.
- Preserve plugin-owned paths/export shapes.

## Next

1. Merge `origin/main`, regenerate the conflicted skills asset, and verify five carried invariants.
2. Run the four merge verification gates and record final Docker/Aspire state; do not run local E2E.
3. Push the branch as explicitly authorized and prove local/remote SHA equality. Do not edit the PR
   or issue; supervisor retains their lifecycle.
