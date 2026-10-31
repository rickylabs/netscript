Refs https://github.com/rickylabs/netscript/issues/2162

## Summary

Installing sagas, workers or triggers before the first definition now generates valid typed empty
registries. `plugin doctor` warns and exits 0, and the production startup APIs reach normal
readiness with zero definitions. Missing, incomplete and stale registry errors remain strict.

Workers also scans plugin-provided jobs when the local jobs directory is empty, and both worker
writers emit the explicit value typing needed for an empty generated object to type-check.

## Scope

CLI/tooling and first-party plugin registry seams. Part of #2474, group B2; builds on #2497.
No new exports, dependencies or lockfile changes. Only coordinator merges.

## Slices

- [x] S0 plan and separate PLAN-EVAL — 0c4a525.
- [x] S1 generation, doctor and regression coverage — d2dd7cc + fdb5b69.
- [x] S2 plugin docs, installed-project startup proof and independent implementation review.

## Validation

- 64 focused tests passed, zero failed or ignored. Both empty worker outputs are type-checked.
- Structured check/lint/format: 14 authored TS files, zero findings, full processing coverage.
- `quality:gate` passed. CLI/sagas/workers JSR audit dry-runs passed.
- Fresh no-DB, no-samples saga KV / worker / trigger installs, `generate plugins` and
  `plugin doctor` all exit 0; three typed empty registries written.
- Installed startup test: 1 passed, zero ignored, normal resource/operation sanitizers. Actual
  saga, trigger and worker startup APIs reach ready with zero definitions and
  registryReady/dependencyReady true. Isolated KV; streams is an HTTP test double.
- Full export-map doc lint retains existing private-type-ref findings: sagas 30, workers 2.
  No public type annotations/exports changed; these are recorded in the run.
- Full `scaffold.runtime` and actual Aspire startup acceptance remain **unproven**. Per owner,
  no local full runtime E2E was run. Coordinator must arm `e2e-cli-gate` for the required CI verdict.

[Commands, consumer proof and independent reviews](https://github.com/rickylabs/netscript/tree/orch/divybot-6541068260/.llm/runs/orch-divybot-6541068260--2162).

## Harness

Run `.llm/runs/orch-divybot-6541068260--2162/`. Separate native Claude Opus high PLAN-EVAL
and IMPL-EVAL passed; final exact-pushed-head attestation is recorded in the PR phase comment.
No labels or milestones changed.

## Drift / Debt

No new architecture debt. Existing doc-lint findings recorded. Owner requires Refs-only linkage,
coordinator-owned closure/merge, and CI-only full runtime validation.

## Definition of Done

- [x] Installed zero-item plugins generate importable typed registries without error.
- [x] Doctor warns for valid empty registries and preserves real wiring failures.
- [x] Focused production startup reaches normal readiness with zero definitions.
- [x] Scoped validation and separate implementation review are recorded.
- [ ] Required full scaffold runtime CI verdict and actual Aspire acceptance are recorded before merge.
