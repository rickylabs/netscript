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
