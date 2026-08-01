# Context Pack — fix-1010-plugin-registry-generation--codex

## Status

- Phase: Plan-Gate blocked on evaluator authentication.
- Branch/worktree clean at baseline before run artifacts.
- Published 0.0.2 reproduction captured once in `.llm/tmp/issue-1010-clean-room-repro.log`.
- No implementation has started.

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

1. Owner supplies OpenRouter evaluator credential or explicitly waives the Plan-Gate in writing.
2. Separate open-model PLAN-EVAL if credential is supplied.
3. Implement/commit slice 1, then slice 2 only after PASS/waiver.
4. Run required gates once, separate IMPL-EVAL, final local commit; never push/open PR.
