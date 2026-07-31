# beta.12 grouped fix — release-hygiene

Branch: `fix/release-specifier-ranges`
Milestone: 0.0.1-beta.12

## Issues in this slice

- #973 — fix(release): range-pinned `@netscript/*` specifiers still name alpha/beta releases

## Verified shared cause

Standalone follow-up to the merged #956. Eighteen `@netscript/*` specifiers across
`plugins/**`, `packages/cli` scaffold templates, `packages/fresh-ui/registry.manifest.ts`
and `packages/plugin` skeleton templates carry ranges anchored at earlier releases
(`^0.0.1-alpha.12`, `^0.0.1-alpha.18`, `^0.0.1-alpha.0`, `^0.0.1-beta.1`, `^0.0.1-beta.5`).

They resolve under SemVer, so nothing is broken at runtime — the defect is release hygiene:
a generated workspace pins a range naming a release older than the one the CLI reports.
`deno task check:netscript-jsr-specifiers` already surfaces them as non-failing
`NOTE JSR-NETSCRIPT-RANGE`.

Root cause is the absence of a written policy plus an enforcing guard: eighteen literals drift
independently instead of deriving from one source (`NETSCRIPT_RELEASE_VERSION` /
`netscriptJsrSpecifier`, the pattern already established in
`packages/cli/src/kernel/constants/jsr-specifiers.ts`).

The repository's established policy is exact coordinated-release pins. The implementation derives
emitted specifiers from generated package metadata / `netscriptJsrSpecifier`, records that policy in
the release skill, and promotes range notes to guard failures.

## Assessment

MECHANICAL — no plan document. Straight to implementation.

## Implementation status

- Implementation complete locally; targeted tests and scoped check/lint/fmt are green.
- Regression proof captured: stale range fails, restored derived pin passes.
- `quality:gate` and publish-asset freshness pass.
- Full `scaffold.runtime` ran: **FAIL**, exit 1, 44 passed / 1 failed. Only
  `behavior.service-health` failed (generated users service database health returned 503); cleanup
  passed and every specifier-sensitive scaffold/generated-workspace gate passed.
- Post-commit `check:assets-barrel`, `check:publish-assets`, and
  `check:netscript-jsr-specifiers` pass.
- Push/PR update remain.
- Separate-session IMPL-EVAL remains for the supervisor.
