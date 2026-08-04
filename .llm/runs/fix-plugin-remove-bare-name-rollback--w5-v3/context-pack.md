# Context Pack — W5-V3 plugin remove

- Branch: `fix/plugin-remove-bare-name-rollback`
- Baseline: `3677973bc` / `origin/main`
- Issue: #1236; milestone 0.0.5; six unchecked acceptance boxes at bootstrap.
- Run phase: S4 local merge-readiness complete; independent draft→ready evaluation next.
- Archetype: 6 CLI/Tooling; existing package verdict `Restructure`.
- Formal PLAN-EVAL: composed per milestone-run + orchestrator D6, explicitly not self-certified.
- Locked implementation: resolve metadata/package and snapshot all owned state before dispatch;
  dispatch before host mutation; transactional cleanup with rollback; regenerate wiring; lifecycle
  proof and doctor clean.
- User-owned worktree state: modified `deno.lock`; never stage or overwrite it.
- Existing debt in scope: `ISSUE-167-PLUGIN-REMOVE-UNINSTALL`.
- RED command exited 1 and showed appsettings entries removed after dispatch failure; the test also
  requires the configured name to resolve to `@netscript/plugin-sagas`.
- Implementation commit: `fba403646`; preflight package resolution, filesystem rollback, symmetric
  owned-state cleanup, and public lifecycle/doctor proof.
- Gate summary: focused install/remove suite 4 passed (26 steps); quality/doc/JSR gates green; exact
  `scaffold.runtime` clean retry passed 71, failed 0. First real full run had one transient
  `workers-api` readiness timeout after 33 passes; cleanup and leak-check were clean.
