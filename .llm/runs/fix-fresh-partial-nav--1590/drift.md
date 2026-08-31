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
