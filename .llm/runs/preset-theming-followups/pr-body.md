## Summary

Complete the remaining preset diagnostics, CLI CI coverage, Figma cleanup and theming guidance follow-ups in one PR.

## Scope

Archetype 6 CLI/tooling and existing token adapters. Refs #2516 and Refs #2556. Owner-directed draft PR with no labels; Cockpit owns merging.

## Slices

- [x] Plan & Design — READY FOR REVIEW
- [ ] Implement and independently review scoped fixes and regression tests
- [ ] Regenerate carriers and complete required gates under Deno 2.9.7

## Validation

Pending implementation. Do not merge until mandatory independent IMPL-EVAL and required checks pass.

## Harness

Run dir: `.llm/runs/preset-theming-followups/`. PLAN-EVAL: N/A for bounded owner-defined corrections. Independent read-only Claude Opus 5.5/high IMPL-EVAL required.

## Drift / Debt

Existing CLI lint/fmt findings will be captured in a strict content-hash baseline; no package-wide reformat. Lock provenance will be checked before any change.

## Definition of Done

- [ ] Regression tests and CLI suite pass
- [ ] Required docs, release preflight, carrier checks and docs build pass
- [ ] CLI lint/fmt coverage runs in CI with recorded baseline
- [ ] Independent implementation evaluation passes
- [ ] No unrelated source or lock churn

Refs #2516
Refs #2556
