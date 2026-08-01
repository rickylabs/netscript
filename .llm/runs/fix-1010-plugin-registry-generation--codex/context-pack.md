# Context Pack — fix-1010-plugin-registry-generation--codex

## Status

- Phase: Implement — slice 1 complete.
- Branch/worktree clean at baseline before run artifacts.
- Published 0.0.2 reproduction captured once in `.llm/tmp/issue-1010-clean-room-repro.log`.
- PLAN-EVAL passed in a separate Claude Code + OpenRouter Qwen session before implementation.
- Slice 1 implements manifest-driven authoritative generation; focused tests and targeted check pass.

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

1. Commit slice 1 locally.
2. Delegate plugin sync and add clean workers/sagas/triggers integration evidence in slice 2.
3. Run required gates once, separate IMPL-EVAL, final local commit; never push/open PR.
