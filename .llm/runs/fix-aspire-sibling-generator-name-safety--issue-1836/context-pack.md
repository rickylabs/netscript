# Context Pack: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The draft PR is open from the bootstrap commit. The tests-only slice renders every generator with
reserved words, both normalization-collision pairs, and a quote/backslash/backtick/`${}`/newline
payload across its emitted string fields. The structured test wrapper produced the required RED:
exit 1, 0 passed, 4 failed, with Deno parser errors in all four emitted modules. Production files
remain unchanged.

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

## In Progress

- Commit and push the tests-only RED slice before production edits.

## Next Steps

1. Commit/push/comment the RED slice.
2. Repair the four generators using ordinal bindings and JSON literals.
3. Prove mutations and run all requested gates.

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
| Fitness | planned | AP-18 strategy locked; quality and architecture gates pending. |
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
