# Context Pack: published workers-api dependency-age hotfix

- Phase: gate complete; awaiting supervisor IMPL-EVAL/release verification.
- Current state: published-mode rewrite changes the config filename and conditionally inserts the
  dependency-age argument; beta.6/beta.7 shapes are covered and all requested gates pass.
- Next: supervisor review and orchestrator-owned published verification.
- Key decision: config-only rewrite followed by conditional flag insertion.
- Drift: D1 owner-waived PLAN-EVAL. Debt: none.
- Files changed: fixture call site, pure internal helper, focused unit test, and run artifacts.
- Gates: focused test 2/2; scoped check/lint 599 files with zero findings; focused format check green.
