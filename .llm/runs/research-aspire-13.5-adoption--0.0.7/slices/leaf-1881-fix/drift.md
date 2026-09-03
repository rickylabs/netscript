# Drift Log: readme.quickstart install-root isolation

## 2026-09-03 — Walker permission and stale-root reset

- **What:** Live diff review found the initial GREEN attempt read ambient `PATH` without granting
  the walker env permission, and the owner addendum required resetting a pre-existing owned install
  root before recreation.
- **Source:** Review of `readme-quickstart-suite.ts`; focused invocation under the real walker
  permission set raised `NotCapable` for `PATH`; owner addendum in the resumed task.
- **Expected:** The initial plan covered environment propagation and root creation.
- **Actual:** Hosted execution also requires narrow `--allow-env=PATH`; creation without removal
  permits a stale same-runner binary to reproduce the collision.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Add a launcher assertion, stale-binary RED/GREEN coverage, and exercise
  `deno task e2e:cli gates readme.quickstart` before the GREEN commit.

## 2026-09-03 — Evaluator route alias

- **What:** The first formal IMPL-EVAL launch used the lane-policy model id `fable-5`, which the
  installed native Claude CLI 2.1.258 rejected as an unrecognized model before evaluation began.
- **Source:** Native evaluator launcher exit 1, session
  `500f9d7b-9c3d-4a92-9f54-43331555404b`.
- **Expected:** The configured routing id would be accepted directly by the installed CLI.
- **Actual:** The CLI accepts the native alias `fable`, which resolved to `claude-fable-5-1`.
- **Severity:** minor tooling drift
- **Action:** retry the same formal lane with native alias `fable`; no implementation or gate
  scope changed.
- **Evidence:** Successful separate session `c74d687f-4c79-4f44-a79b-d844085dc27a`, medium effort,
  completed with PASS and wrote `evaluate.md` only.
