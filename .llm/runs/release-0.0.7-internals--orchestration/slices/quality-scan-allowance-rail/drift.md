# Drift — quality-scan-allowance-rail

Append-only record. No product implementation may use an undeclared surface or weaken an acceptance
claim to conceal these divergences.

| ID  | Kind                 | Exact evidence                                                                                                                                                                                                                                                | Required disposition                                                                                                                                                                | State                                    |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| D-1 | Live baseline        | Both current scans report 7 allowances. `quality:scan` has max 7; `quality:scan:repo` has max 8. The eighth Fresh allowance named in #1545 is already gone.                                                                                                   | Implement against the measured population: both maxima 7, never higher. Topic should reconcile the stale “8” acceptance prose.                                                      | Escalated; independent planning complete |
| D-2 | Acceptance/ownership | #1545 asks all allowances to reference #1545, but this PR must `Closes #1545`; immediately after merge that owner would be closed and violate #1378's open-issue rule.                                                                                        | Topic/coordinator names or authorizes a separate durable open, milestoned debt issue, or explicitly amends the acceptance semantics.                                                | Must resolve before implementation       |
| D-3 | Contract surface     | RED-first proof requires `.llm/tools/quality/scan-code-quality_test.ts`. Scanner source is embedded in `packages/cli/src/kernel/assets/agent-tools.generated.ts`, with permissions in `.llm/tools/consumer-tools.json`. None is in the approved surface list. | Amend the leaf contract to include the focused test and required generated/manifest peers, or provide a truthful approved alternative. Never hand-edit generated output.            | Must resolve before implementation       |
| D-4 | JSR gate baseline    | `deno task doc:lint --root plugins/workers --pretty` fails with 20 pre-existing `private-type-ref` diagnostics across 13 export targets; no matching accepted debt entry was found. CLI full-export lint is clean.                                            | Coordinator accepts an explicit no-increase baseline with separately owned debt, or schedules a prerequisite repair. Do not absorb unrelated workers export repairs into this leaf. | Must resolve before final JSR claim      |
| D-5 | Prior landed scope   | Live #1378 comment says #1549 already delivered docs fences, docs fixtures/soundness preservation, max-budget wiring, and trigger typing in 0.0.6. Current-head inspection confirms those behaviors.                                                          | Preserve and regression-test; do not duplicate or revert the landed solution.                                                                                                       | Incorporated into plan                   |

The draft PR PLAN comment is the topic-orchestrator notification channel for D-1 through D-4.

## Coordinator disposition — 2026-08-13

The historical states above are preserved because this log is append-only. Coordinator comment
`5286261678` on PR #1653 and central commit `874eacc0d` supply the following superseding decisions:

| ID  | Resolves            | Authority decision                                                                                                                                                                                                                         | Current state                             |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| D-6 | D-1, D-2            | Bind all seven source allowances to open, milestoned #1276 T3 with their existing specific reasons. Live #1545 is reconciled to seven and may close; it is not a source owner.                                                             | Resolved before fresh PLAN-EVAL           |
| D-7 | D-3                 | Extend the leaf only to `.llm/tools/quality/scan-code-quality_test.ts`, `.llm/tools/consumer-tools.json`, `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and `.llm/harness/debt/arch-debt.md`.                                 | Resolved; no other widening               |
| D-8 | D-4                 | #1655 (milestone 0.0.8) owns the 20 Workers `private-type-ref` repairs. This leaf may record `DEBT_ACCEPTED` and prove strict no-increase across 13 export targets, but may not claim green lint or absorb repair.                         | Resolved before fresh PLAN-EVAL           |
| D-9 | Evaluator transport | The OpenRouter `FAIL_PLAN` at commit `8a4709afe` is advisory only. All Claude and Claude-compatible OpenRouter work is stopped until 2026-08-15 00:00 Europe/Zurich; a fresh formal opposite-family PLAN-EVAL remains mandatory afterward. | BLOCKED awaiting reset and formal verdict |

## Implementation drift — 2026-08-15

| ID | Kind | Exact evidence | Disposition | State |
| --- | --- | --- | --- | --- |
| D-10 | Live base movement | Pre-flight fetch resolved `origin/main` to `dd472102d`, one merged #1644 commit beyond immutable leaf base `01e096049`. `git diff 01e096049..dd472102d` shows no overlap with this leaf's authorized scanner, package/plugin registration, consumer manifest, generated asset, or run-artifact surfaces. | Retain the evaluator-approved base and head; do not rebase, absorb, mutate, or claim #1644. Stop if a later gate exposes a real interaction. | Recorded; independent Slice 1 work continued |

No product implementation, runtime lease, merge, publication, or central-state mutation is
authorized while D-9 is active.

## Tier-A evidence correction — 2026-08-15

| ID | Kind | Exact evidence | Disposition | State |
| --- | --- | --- | --- | --- |
| D-11 | Attestation durability | `receipts/slice-1/allowance-budget.json` passed against stash object `3136358e484f8df30b778d2ae838dd9103077d10`, which is not an ancestor of landed head `586b5513500caa1fd5ce07878f4ba96606064555` and is garbage-collectable. Tier-A review found no content diff between that probe and the landed slice. | Preserve the original receipt as superseded evidence. Use `receipts/slice-1/allowance-budget-landed-head.json`, which reruns the exact immutable-base-to-landed-commit comparison and exits 0, as the binding budget attestation. | Resolved; supervisor sign-off pending |
