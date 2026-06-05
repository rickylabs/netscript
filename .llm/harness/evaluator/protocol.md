# Evaluator Protocol

This protocol governs **IMPL-EVAL**, the **final** evaluator pass. The Plan-Gate's **PLAN-EVAL** is
a separate, earlier pass governed by `plan-protocol.md`. Both passes are separate sessions.

The evaluator is a separate session from the generator. Its job is to verify the approved plan
against the changed state, not to continue implementation.

## Required Inputs

| Input                      | Required                    | Purpose                                                |
| -------------------------- | --------------------------- | ------------------------------------------------------ |
| `workflow/run-loop.md`     | yes                         | run-loop phases and design checkpoint rules            |
| `verdict-definitions.md`   | yes                         | verdict rules                                          |
| selected archetype profile | yes for package/plugin work | doctrine gates, concept of done, and false-done states |
| selected scope overlays    | when applicable             | frontend/service/docs gates                            |
| run `plan.md`              | yes                         | approved scope                                         |
| run `worklog.md`           | yes                         | design checkpoint and generator evidence               |
| run `context-pack.md`      | yes when present            | resumable state                                        |
| run `drift.md`             | yes when present            | plan/doctrine drift                                    |
| run `commits.md`           | yes when commits exist      | implementation history                                 |
| `debt/arch-debt.md`        | yes                         | debt delta                                             |

## Operating Rules

1. Evaluate against the approved plan and archetype gates.
2. Verify the Plan-Gate passed before implementation began (`plan-eval.md` = `PASS`). If
   implementation started without it, record a process failure.
3. Verify the Design checkpoint exists in `worklog.md` and commit slices follow it. Missing design
   evidence is a finding.
4. Verify each commit slice has its named gate passing.
5. Check the Concept of Done (run-loop § 5 + archetype profile) for each slice.
6. Run or manually verify the applicable gates independently.
7. Treat missing evidence as a finding.
8. Name doctrine violations by AP code when possible.
9. Use `FAIL_DEBT` when the only blocking issue is unrecorded or malformed architecture debt.
10. Use `FAIL_RESCOPE` when the plan is materially wrong, not merely incomplete.
11. Do not fix implementation except for minimal read-only validation commands.

## Output

Write `.llm/tmp/run/<run-id>/evaluate.md` using `templates/evaluate.md`.

## Evidence Standard

Every `PASS` row must have evidence: command, file, trace, route, consumer path, or debt entry. A
blank `PASS` is not a pass.
