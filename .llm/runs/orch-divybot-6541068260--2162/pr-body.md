Refs https://github.com/rickylabs/netscript/issues/2162

## Summary

Plan & Design — READY FOR REVIEW. Allow installed sagas, workers and triggers plugins to
have zero definitions: generation writes typed empty registries, doctor warns, and runners
can start idle with normal readiness checks.

## Scope

CLI/tooling and first-party plugin registry seams. Part of #2474, group B2. Builds on #2497.
Do not merge until PLAN-EVAL and mandatory independent IMPL-EVAL complete. Only coordinator merges.

## Slices

- [x] S0 plan and design bootstrap.
- [ ] S1 empty registry generation, doctor behavior and regression coverage.
- [ ] S2 docs, installed consumer proof and final evaluation.

## Validation

Pending. Full `e2e:cli` / `scaffold.runtime` is CI-only per owner; coordinator must arm
`e2e-cli-gate`. Aspire runtime acceptance remains unproven until evidence is available.

## Harness

Run: `.llm/runs/orch-divybot-6541068260--2162/`. Separate native Claude Opus high PLAN-EVAL
and IMPL-EVAL; blockers only. No labels or milestones changed.

## Drift / Debt

No new architecture debt planned. Owner requires Refs-only linkage and coordinator-owned closure.

## Definition of Done

- [ ] Installed zero-item plugins generate importable typed registries without error.
- [ ] Doctor warns for valid empty registries and preserves real wiring failures.
- [ ] Focused production startup reaches normal readiness with zero definitions.
- [ ] Scoped validation and independent final pushed-head evaluation are recorded.
- [ ] Required full scaffold runtime CI verdict is recorded before merge.
