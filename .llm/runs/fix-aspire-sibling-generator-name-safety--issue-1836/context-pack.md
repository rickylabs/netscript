# Context Pack: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The branch is clean at live `main` `71d5fb8e0`. Research confirms the four issue-named generators
retain unsafe name-derived bindings and raw user-string interpolation. The mechanical plan mirrors
draft PR #1747's current background-generator repair. PLAN-EVAL is recorded N/A; tests must land RED
before production edits.

## Completed

- Loaded all requested skills plus the Deno inspection guide.
- Read the harness activation/run-loop/lane policy, Archetype 6, gate matrix, plan gate, and relevant
  doctrine rules/verdict/debt.
- Verified issue #1836, labels, milestone, current branch, remote baseline, and absence of an existing
  PR for this branch.
- Audited the four generators' user-string fields and the #1747 ordinal/escaping precedent.
- Locked the contract, hostile matrix, slice order, and validation plan.

## In Progress

- Bootstrap commit, push, and draft PR creation.

## Next Steps

1. Commit and push the run bootstrap; open and label the draft PR with milestone `0.0.7`.
2. Add the parse-checking hostile-input tests and record their RED output.
3. Repair the four generators, prove mutations, and run all requested gates.

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

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | baseline PASS | Clean raw Git status and remote SHA check. |
| Fitness | planned | AP-18 strategy locked; quality and architecture gates pending. |
| Runtime | N/A | Explicitly forbidden. |
| Consumer | pending | Hostile generated-source parse tests are next. |

## Open Questions

- None.

## Drift and Debt

- Drift: #1747 is open, so the reference fix is read from its branch rather than `main`; `rtk` is
  unavailable.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after bootstrap.

