# Drift Log — Fresh partial-navigation Slice 1

Append-only.

## 2026-08-31 — inherited Fresh export-map doc findings

- **Expected:** run full export-map `deno doc --lint` and add zero findings for the new surface.
- **Observed:** the full package scan exits 1 with 45 findings: builders 3, query 8, route 25, and
  streams 11. All are in untouched entrypoints. The new `./navigation` entrypoint reports zero
  private-type, missing-JSDoc, or other findings and independently passes public doc lint.
- **Severity:** minor, pre-existing baseline.
- **Decision:** retain the failing full receipt as evidence, report the baseline explicitly, and do
  not exceed the locked Slice 1 ceiling to repair unrelated public surfaces. The plan's
  zero-new-findings condition is satisfied.

## 2026-08-31 — JSR audit counts a Deno progress line

- **Expected:** the package audit distinguishes slow-type diagnostics from ordinary dry-run status.
- **Observed:** raw package publish dry-run succeeds without a slow-type diagnostic, while the audit
  reports Deno's `Checking for slow types in the public API...` progress line as one F-JSR-7
  warning. It also reports the existing `src/runtime/ai` 13-child doctrine warning.
- **Severity:** minor, pre-existing/tooling.
- **Decision:** preserve the raw passing publish receipt and zero-finding navigation doc receipt as
  authoritative evidence; do not change repository audit tooling from this package slice.

## 2026-09-01 — IMPL-EVAL found two stale cross-package subpath consumers

- **Expected:** the Slice 1 package diff would be sufficient, with its contingency slot available
  for one narrow consumer discovered during evaluation.
- **Observed:** IMPL-EVAL returned `FAIL_FIX` at `f3b50149e` with two HIGH, PR-introduced findings:
  the CLI web-runtime closure registry omitted `./navigation`, and the generated agent-docs export
  carrier had not been regenerated after the Fresh manifest gained that subpath.
- **Severity:** significant but mechanical; no architecture or plan decision changed.
- **Decision:** use the contingency for the one-line closure-registry parity entry and regenerate
  the carrier through `deno task gen:assets-barrel`. Product edits are limited to those two
  consumer files; no dependency, Fresh implementation, or browser-test change is permitted.
- **Remedy evidence:** the named parity test passes; `check:assets-barrel` exits 0 with zero-byte
  stdout and no unstaged carrier diff; repo-wide tests move from 4467/1/19 to 4468/0/19
  passed/failed/ignored; `deno.lock` retains its recorded SHA-256.

## 2026-09-01 — evaluator-host Rollup failure did not reproduce locally

- **Expected:** the evaluator reported `defer-island-client-bundle_test.ts` failing identically at
  the PR head and base because Rollup could not resolve the OpenTelemetry npm specifier from Fresh.
- **Observed:** both local repo-wide censuses ran that untouched test without failure; the only
  pre-repair local failure was closure parity, and the post-repair local census is fully green.
- **Severity:** minor, environmental and pre-existing by the evaluator's attribution evidence.
- **Decision:** do not edit the test, Vite configuration, dependencies, or lockfile. Preserve the
  evaluator's base attribution and report this host's exact non-reproduction.

## 2026-09-01 — root-excluded CLI source retains an inherited format finding

- **Expected:** repair-scoped wrapper receipts cover the owned CLI and Fresh TypeScript files with
  non-empty stdout.
- **Observed:** check and lint pass all nine owned TypeScript files. The format wrapper reports one
  finding on an unchanged type-alias line in the closure-registry file, which the root format
  configuration intentionally excludes; the other eight owned files pass a clean format receipt.
- **Severity:** minor, pre-existing baseline outside the mechanical line repair.
- **Decision:** retain both receipts for attribution and do not reformat the unrelated line. Doing
  so would exceed the evaluator's exact one-line remedy.
