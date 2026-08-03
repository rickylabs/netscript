# Supervisor — ci-scope-expensive-jobs--1152

- **Model / session**: Claude Fable 5 (Claude Code), session `session_01PVEZJ1CBtRYNXzGQRZrTat`
- **Host / worktree**: WSL2, `/home/codex/repos/ns-ci-scope`
- **Branch**: `ci/scope-expensive-jobs` (base `origin/main`)
- **Scope**: #1152 — CI capability-vector redesign. `.github/scripts/` + workflow YAML only; no
  `packages/`/`plugins/` source.
- **Related**: #1151 shipped separately as PR #1153 (branch `fix/desktop-native-honors-classifier`).
- **Lanes**: This session generates research/plan and (post PLAN-EVAL PASS) implements — CI tooling,
  not framework source, per the owner brief `.llm/tmp/BRIEF.md` which delegates both issues to this
  session. PLAN-EVAL / IMPL-EVAL on the open-model evaluator lane per
  `.llm/harness/workflow/lane-policy.md`; the supervisor triggers, never auto-dispatched.
- **Constraints (owner-ratified, not relitigable)**: paths are the mechanism, labels are the
  override; label set stays exactly `ci:full`/`ci:skip-scaffold`/`ci:skip-e2e`; skipped jobs must
  still report; unrecognised paths always force the gate to run.
