# Context Pack — W5-V3 plugin remove

- Branch: `fix/plugin-remove-bare-name-rollback`
- Baseline: `3677973bc` / `origin/main`
- Issue: #1236; milestone 0.0.5; six unchecked acceptance boxes at bootstrap.
- Run phase: locked plan; implementation next.
- Archetype: 6 CLI/Tooling; existing package verdict `Restructure`.
- Formal PLAN-EVAL: composed per milestone-run + orchestrator D6, explicitly not self-certified.
- Locked implementation: resolve metadata/package and snapshot all owned state before dispatch;
  dispatch before host mutation; transactional cleanup with rollback; regenerate wiring; lifecycle
  proof and doctor clean.
- User-owned worktree state: modified `deno.lock`; never stage or overwrite it.
- Existing debt in scope: `ISSUE-167-PLUGIN-REMOVE-UNINSTALL`.
