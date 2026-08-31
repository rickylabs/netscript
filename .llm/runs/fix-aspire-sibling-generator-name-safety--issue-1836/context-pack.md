# Context Pack: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Current phase | `corrective implementation handoff — IMPL-EVAL pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The earlier implementation handoff was false-green because its focused test list omitted two
existing generated-output consumers. The exact full-directory run reproduced 2 failed files / 5
failed steps. Both failures were stale expectations around intended JSON literals and ordinal
comments—not behavior regressions. The corrected directory now passes 30 files / 218 steps / 0
failed (structured wrapper: 248 results / 0 failed), with all non-runtime repository gates green.

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
- Invalidated the prior focused-only green claim after reproducing the owner-reported directory
  failure.
- Proved pipeline resource semantics and plugin #1447 environment ordering/PORT refusal remained
  correct before editing expectations.
- Updated the two stale downstream tests without removing or weakening their behavior assertions.
- Re-ran the exact full directory, structured directory wrapper, scoped wrappers, root check,
  quality, architecture, and asset gates successfully.

## In Progress

- Commit the corrective consumer-contract slice and push with an explicit fresh remote lease.

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
| `packages/cli/src/kernel/templates/aspire/helpers/generate-register-apps.ts` | modified | Ordinal app bindings and JSON string literals. |
| `packages/cli/src/kernel/templates/aspire/helpers/generate-register-plugins.ts` | modified | Ordinal plugin-reference bindings and JSON string literals. |
| `packages/cli/src/kernel/templates/aspire/helpers/generate-register-tools.ts` | modified | Ordinal tool bindings and JSON string literals. |
| `packages/cli/src/kernel/templates/aspire/helpers/generate-register-infrastructure.ts` | modified | Ordinal infrastructure bindings and JSON string literals. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-source-safety_test.ts` | new | Four hostile-input Deno parse contracts. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts` | modified | Intended ordinal and JSON-rendered source assertions. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts` | modified | Corrected JSON-rendered pipeline source expectations. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment_test.ts` | modified | Plugin block lookup follows ordinal comments and the semantic map-write boundary. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | correction GREEN | Exact directory: 30/30 files and 218/218 steps; structured wrapper: 248/248 results. |
| Fitness | corrected implementation GREEN | Mutation evidence preserved; scoped, root quality, architecture, and asset gates pass; external IMPL-EVAL pending. |
| Runtime | N/A | Explicitly forbidden. |
| Consumer | GREEN | Hostile modules parse and the full helper-generator directory passes; plugin #1447 parity remains intact. |

## Open Questions

- None.

## Drift and Debt

- Drift: #1747 is open, so the reference fix is read from its branch rather than `main`; `rtk` is
  unavailable; the original focused-only gate set missed two downstream consumer tests and its
  green handoff was invalidated.
- Debt: none created or deepened.

## Commits

- `e9439de34` — harness bootstrap and locked plan.
- `953271980` — tests-only hostile-input RED contract.
- `36292dde1` — four-generator repair, semantic test updates, mutation and scoped-gate evidence.
- `94a2ef1a0` — original gate-evidence handoff, subsequently invalidated by the full-directory failure.
