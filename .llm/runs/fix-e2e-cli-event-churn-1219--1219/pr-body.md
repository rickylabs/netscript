## Summary

Stop PR label metadata from respawning and canceling the expensive e2e-cli workflow while preserving skip-label behavior on the next code/lifecycle trigger.

## Scope

- Area: CI event and classification policy
- Closes #1219

## Slices

- [x] S0 Issue-first research and draft surface — `79ada2deb`
- [x] S1 Event policy and regression matrix — `c70e24442`
- [x] S2 Targeted validation and ready handoff — `c70e24442`

## Validation

- Event/classifier/draft policy: 58 passed
- Workflow YAML parse: pass
- Scoped lint/fmt: 4 files, 0 findings

## Harness

- Run dir: `.llm/runs/fix-e2e-cli-event-churn-1219--1219/`
- Route: openai / gpt-5.6-sol / medium
- D6 composed evaluation; no local PLAN-EVAL

```acceptance-evidence
issue: 1219
entries:
  - box-index: 1
    evidence: "The e2e-cli pull_request types exclude labeled and unlabeled, so label metadata cannot schedule a replacement run or activate ref-scoped cancellation."
  - box-index: 2
    evidence: "The next-trigger matrix passes ci:skip-e2e plus ci:skip-scaffold through the existing classifier and proves static, sqlite-runtime, and runtime all remain false; the unlabelled control runs all three."
  - box-index: 3
    evidence: "The adjacent .github/scripts/e2e-cli-event-policy.test.ts covers the allowed event set, both forbidden metadata events, skip-label state, and the unlabelled control."
```
