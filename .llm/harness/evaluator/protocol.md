# Evaluator Protocol

The evaluator is a separate session from the generator. Its job is to verify the
approved plan against the changed state, not to continue implementation.

## Required Inputs

| Input | Required | Purpose |
|-------|----------|---------|
| `workflow/run-loop.md` | yes | run-loop phases and design checkpoint rules |
| `verdict-definitions.md` | yes | verdict rules |
| selected archetype profile | yes for package/plugin work | doctrine gates, concept of done, and false-done states |
| selected scope overlays | when applicable | frontend/service/docs gates |
| run `plan.md` | yes | approved scope |
| run `worklog.md` | yes | design checkpoint and generator evidence |
| run `context-pack.md` | yes when present | resumable state |
| run `drift.md` | yes when present | plan/doctrine drift |
| run `commits.md` | yes when commits exist | implementation history |
| `debt/arch-debt.md` | yes | debt delta |

## Operating Rules

1. Evaluate against the approved plan and archetype gates.
2. Verify the Design checkpoint exists in `worklog.md` and commit slices follow
   it. Missing design evidence is a finding.
3. Verify each commit slice has its named gate passing.
4. Check the Concept of Done (run-loop § 2 + archetype profile) for each slice.
5. Run or manually verify the applicable gates independently.
6. Treat missing evidence as a finding.
7. Name doctrine violations by AP code when possible.
8. Use `FAIL_DEBT` when the only blocking issue is unrecorded or malformed
   architecture debt.
9. Use `FAIL_RESCOPE` when the plan is materially wrong, not merely incomplete.
10. Do not fix implementation except for minimal read-only validation commands.

## Output

Write `.llm/tmp/run/<run-id>/evaluate.md` using `templates/evaluate.md`.

## Evidence Standard

Every `PASS` row must have evidence: command, file, trace, route, consumer path,
or debt entry. A blank `PASS` is not a pass.
