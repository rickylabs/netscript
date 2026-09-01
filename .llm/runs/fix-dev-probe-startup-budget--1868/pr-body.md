## Summary

Separates the generated dev chain's dependency/startup allowance from the Fresh HTTP readiness budget, preserves prompt real child-exit reporting, and makes startup timeouts truthful.

## Scope

- Archetype / area: CLI E2E tooling
- Closes #1868

## Slices

- [x] RED: focused slow-preflight, child-exit, and timeout-reporting regression
- [x] GREEN: phase-aware startup and HTTP readiness budgets
- [ ] Mandatory separate-session IMPL-EVAL

## Validation

- Focused structured RED test — exit 1; 0 passed, 3 failed, 3 total.
- Focused structured GREEN test — exit 0; 3 passed, 0 failed, 3 total.
- Scoped structured check/lint/format — exit 0 each over the probe and focused test.
- `deno.lock` — unchanged.
- Full `deno task e2e:cli` — not run; this leaf has no runtime lease and hosted CI owns the canonical scaffold runtime.

## Harness

- Run dir: `.llm/runs/fix-dev-probe-startup-budget--1868/`
- Phase: `impl` — RED landed; do not merge until the mandatory final evaluator pass is complete.

## Drift / Debt

- None.

## Acceptance

- [ ] Slow dependency verification does not consume the entire Fresh HTTP readiness budget.
- [ ] A child process exit still fails promptly with its real exit status.
- [ ] Timeout output distinguishes startup/preflight timeout from a Fresh server failure.
- [ ] A focused regression reproduces the slow-preflight case without sleeping for the full production timeout.
- [ ] The canonical scaffold runtime reaches Flow-B on the NAS and remains green on hosted CI.

## Definition of Done

- [ ] Focused structured check, test, lint, and format gates pass.
- [ ] `deno.lock` remains unchanged.
- [ ] Separate-session IMPL-EVAL records a passing verdict.
