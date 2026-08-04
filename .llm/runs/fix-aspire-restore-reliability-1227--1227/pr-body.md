## Summary

Bound the Aspire restore gate, reuse the exact pinned NuGet packages across CI runs, and classify restore/feed failures as infrastructure rather than product failures.

## Scope

- Archetype / area: E2E harness and release-runtime workflow
- Closes #1227

## Slices

- [x] S0 Issue-first research, locked design, draft surface — `e2c793d19`
- [ ] S1 Restore retry budget and infrastructure classification
- [ ] S2 Pinned NuGet cache and workflow regressions
- [ ] S3 Targeted validation and ready handoff

## Validation

- Pending implementation.

## Harness

- Run dir: `.llm/runs/fix-aspire-restore-reliability-1227--1227/`
- Route: openai / gpt-5.6-sol / medium
- D6: composed evaluation; no local PLAN-EVAL
- Phase: implementation

## Drift / Debt

- None recorded.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1227
entries:
  - box-index: 1
    evidence: "Pending implementation."
  - box-index: 2
    evidence: "Pending implementation."
  - box-index: 3
    evidence: "Pending implementation."
```
