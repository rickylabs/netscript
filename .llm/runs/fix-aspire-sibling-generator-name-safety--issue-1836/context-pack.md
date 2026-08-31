# Context Pack: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Current phase | `implementation handoff — IMPL-EVAL pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The draft PR is open. All four production generators use ordinal bindings and JSON-rendered user
strings. The focused six-file generator suite passes 156/156, both required mutants fail all four
hostile-input contracts before restoration, and every requested non-runtime repository gate exits 0.

## Completed

- Loaded all requested skills plus the Deno inspection guide.
- Read the harness activation/run-loop/lane policy, Archetype 6, gate matrix, plan gate, and relevant
  doctrine rules/verdict/debt.
- Verified issue #1836, labels, milestone, current branch, remote baseline, and absence of an existing
  PR for this branch.
- Audited the four generators' user-string fields and the #1747 ordinal/escaping precedent.
- Locked the contract, hostile matrix, slice order, and validation plan.
- Opened draft PR #1837 with the requested labels, milestone `0.0.7`, and `Closes #1836` in Scope.
- Added the focused hostile-input parse contract and captured semantic RED evidence for all four
  generators.
- Committed and pushed the tests-only RED slice.
- Repaired all four generators and updated existing semantic assertions for ordinal bindings and
  JSON-rendered literals.
- Captured focused GREEN, scoped check/lint evidence, and both four-of-four mutation failures.
- Completed root check (`failedBatches: 0`), quality, architecture, asset-barrel, lock-hygiene, and
  generated-file checks with exit 0.

## In Progress

- Commit and push this final gate-evidence artifact update.

## Next Steps

1. Keep PR #1837 draft with `status:impl`.
2. Supervisor dispatches the mandatory separate-session IMPL-EVAL.
3. Address evaluator findings, if any, without self-certification.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Ordinal-only identifiers | issue #1836 / PR #1747 | No user text in generated bindings or comments. |
| Native JSON source literals | A7 / PR #1747 | `JSON.stringify` at every user-string emission site. |
| Parse-check contract | AP-18 / owner prompt | Deno lint on temp `.mts` files, not string matching alone. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-aspire-sibling-generator-name-safety--issue-1836/` | new | Harness bootstrap artifacts. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-source-safety_test.ts` | new | Four hostile-input Deno parse contracts. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | RED captured | Focused wrapper exit 1; 0 passed / 4 parser failures. |
| Fitness | implementation GREEN | Mutation, scoped, root quality, architecture, and asset gates pass; external IMPL-EVAL pending. |
| Runtime | N/A | Explicitly forbidden. |
| Consumer | RED | Every emitted module failed Deno parsing before repair. |

## Open Questions

- None.

## Drift and Debt

- Drift: #1747 is open, so the reference fix is read from its branch rather than `main`; `rtk` is
  unavailable.
- Debt: none created or deepened.

## Commits

- `e9439de34` — harness bootstrap and locked plan.
- `953271980` — tests-only hostile-input RED contract.
- `36292dde1` — four-generator repair, semantic test updates, mutation and scoped-gate evidence.
