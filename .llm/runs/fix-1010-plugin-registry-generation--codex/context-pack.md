# Context Pack — fix-1010-plugin-registry-generation--codex

## Status

- Phase: Gate — implementation slices complete; evaluation pending.
- Branch/worktree clean at baseline before run artifacts.
- Published 0.0.2 reproduction captured once in `.llm/tmp/issue-1010-clean-room-repro.log`.
- PLAN-EVAL passed in a separate Claude Code + OpenRouter Qwen session before implementation.
- Slice 1 implements manifest-driven authoritative generation; focused tests and targeted check pass.
- Slice 2 delegates sync and proves non-empty workers/sagas/triggers canonical registries with the real generators.
- Scoped check/lint/test/format, quality, JSR audit, and publish dry-run gates pass.
- Full runtime raw exit 1: 44 pass, only unrelated users-service health timeout; all registry-specific gates pass.

## Root Cause

- `generate plugins` only runs the generic SDK walker and silently accepts zero emissions.
- Plugin-owned runtime generators and their canonical paths exist only behind each package's
  `scaffold.runtime.json` and are not invoked publicly.
- `plugin sync` loads config correctly in a project-rooted child but then imports project plugin
  modules in the parent CLI process, losing project import-map context and failing on `zod`.

## Locked Direction

- `generate plugins` authoritative; `plugin sync` delegates.
- Discover installed package runtime manifests generically; no official-plugin name switch.
- Execute generator child processes with project cwd and config.
- Validate each declared runtime target is non-empty and name failures by plugin.
- Preserve plugin-owned paths/export shapes.

## Next

1. Commit validation artifacts locally.
2. Run ordinary opposite-family slice review and separate open-model IMPL-EVAL.
3. Apply evaluator fixes if any, final local commit; never push/open PR.
