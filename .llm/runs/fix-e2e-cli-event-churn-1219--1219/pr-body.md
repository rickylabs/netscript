## Summary

Stop PR label metadata from respawning and canceling the expensive e2e-cli workflow while preserving skip-label behavior on the next code/lifecycle trigger.

## Scope

- Area: CI event and classification policy
- Closes #1219

## Slices

- [x] S0 Issue-first research and draft surface — `79ada2deb`
- [ ] S1 Event policy and regression matrix
- [ ] S2 Targeted validation and ready handoff

## Validation

- Pending implementation.

## Harness

- Run dir: `.llm/runs/fix-e2e-cli-event-churn-1219--1219/`
- Route: openai / gpt-5.6-sol / medium
- D6 composed evaluation; no local PLAN-EVAL

```acceptance-evidence
issue: 1219
entries:
  - box-index: 1
    evidence: "Pending implementation."
  - box-index: 2
    evidence: "Pending implementation."
  - box-index: 3
    evidence: "Pending implementation."
```
