## Summary

Separates the generated dev chain's dependency/startup allowance from the Fresh HTTP readiness budget, preserves prompt real child-exit reporting, and makes startup timeouts truthful.

## Scope

- Archetype / area: CLI E2E tooling
- Closes #1868

## Slices

- [x] RED: focused slow-preflight, child-exit, and timeout-reporting regression — `cd2337d36`
- [x] GREEN: phase-aware startup and HTTP readiness budgets — `04420a074`
- [x] FAIL_FIX RED: exact ANSI banner fails while plain text passes — `b9b2e9f0a`
- [ ] FAIL_FIX GREEN: ANSI-safe scan plus `NO_COLOR=1`
- [ ] Fresh-head separate-session IMPL-EVAL

## Validation

- Focused structured RED test — exit 1; 0 passed, 3 failed, 3 total.
- Focused structured GREEN test — exit 0; 3 passed, 0 failed, 3 total.
- Scoped structured check/lint/format — exit 0 each over the probe and focused test.
- FAIL_FIX focused GREEN test — exit 0; 5 passed, 0 failed.
- Whole `packages/cli/e2e` structured check — exit 0; 188 TypeScript files, 0 diagnostics.
- Whole `packages/cli/e2e` structured test — exit 0; 276 passed, 0 failed.
- `deno.lock` — unchanged.
- Local full `deno task e2e:cli` — NOT_RUN; this leaf has no runtime lease.
- Hosted run `33562257540` at pre-repair head `bdbaec12c` — FAILED `behavior.project-boundary-dev`; hosted CI owns the new-head verdict. No hosted green is claimed.

## Harness

- Run dir: `.llm/runs/fix-dev-probe-startup-budget--1868/`
- Phase: `impl` — RED landed; do not merge until the mandatory final evaluator pass is complete.

## Drift / Debt

- Significant implementation drift repaired: readiness scanning now normalizes ANSI color only for matching; mirrored output is unchanged.

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
