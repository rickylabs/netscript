# Evaluator Protocol

This protocol governs **IMPL-EVAL**, the **final** evaluator pass. The Plan-Gate's **PLAN-EVAL** is
a separate, earlier pass governed by `plan-protocol.md`. Both passes are separate sessions.

The evaluator is a separate session from the generator. Its job is to verify the approved plan
against the changed state, not to continue implementation.

Select the evaluator from the run's workload tier in `workflow/lane-policy.md`. The typed resolver
must skip any candidate from the selected generator's vendor family, then choose the first healthy,
capable, allowance-proven transport in the canonical provider order. Never infer a model, effort,
transport, or fallback from historical lane names.

`complex` and `architecture` are privileged rows. Do not select either from inferred complexity: the
run must contain explicit owner or milestone-coordinator authorization and its rationale. When that
evidence is absent, evaluation is capped at the `feature` row.

The supervisor triggers the evaluator; a sub-agent never auto-dispatches one. Record the tier,
phase, fallback reason, requested and observed route identity, session, exact head, and expense
decision where a paid OpenCode route is selected. OpenRouter paid-training eligibility is allowed by
owner preference and is not a routing blocker.

IMPL-EVAL remains mandatory unless the owner explicitly waives it. Re-steer the same evaluator
session after a failure and obey the tier-specific loop limit:

- simple: the owner did not specify a maximum; record this explicitly rather than inventing one;
- straightforward, feature, complex: maximum five, notify the owner after three;
- architecture: maximum three, notify the owner after two;
- documentation: use the tier's policy with a hard maximum of two.

These notification points do not freeze unrelated work and do not replace a smaller explicit limit.
The selected generator and evaluator must remain different vendor families in every cycle.

## Required Inputs

| Input                                        | Required                    | Purpose                                                |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------ |
| `workflow/run-loop.md`                       | yes                         | run-loop phases and design checkpoint rules            |
| `verdict-definitions.md`                     | yes                         | verdict rules                                          |
| selected archetype profile                   | yes for package/plugin work | doctrine gates, concept of done, and false-done states |
| selected scope overlays                      | when applicable             | frontend/service/docs gates                            |
| run `plan.md`                                | yes                         | approved scope                                         |
| run `plan-eval.md`                           | when PLAN-EVAL selected     | conditional planning verdict                           |
| run `worklog.md`                             | yes                         | design checkpoint and generator evidence               |
| run `context-pack.md`                        | yes when present            | resumable state                                        |
| run `drift.md`                               | yes when present            | plan/doctrine drift                                    |
| draft-PR commit list + per-slice PR comments | yes when commits exist      | implementation history (the commit trail)              |
| `debt/arch-debt.md`                          | yes                         | debt delta                                             |

## Operating Rules

1. Evaluate against the approved plan and archetype gates.
2. Verify either the selected Plan-Gate passed before implementation (`plan-eval.md` = `PASS`) or
   the run recorded a justified `PLAN-EVAL: N/A` before implementation. Missing both is a process
   failure.
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
12. Verify the **close-gate** (`netscript-pr` → "Merge close-gate (#387)") is honored before any
    `status:ready-merge` / `Closes #N` merge: for every referenced issue, its acceptance criteria
    and every `gate:` checkbox are checked with linked evidence, and the PR's Definition-of-Done
    checklist is complete. An unchecked `gate:` box on a referenced issue (the #260 failure) blocks
    the pass.
13. Verify every agent brief/prompt (implementation, evaluation, side-fix) carries a `## SKILL`
    chapter naming the relevant skills (harness rule; a missing SKILL chapter in a brief is a
    finding). PR bodies are governed by the `netscript-pr` templates and do NOT require a `## SKILL`
    chapter — never raise its absence from a PR body as a finding.
14. For a **cut or release-gating run**, verify the **release-gate class** (`gates/release-gates.md`
    — `scaffold.runtime`, `e2e-cli-prod`, and the composite release gate) is green with
    raw-exit-code evidence before any `status:ready-merge` / release. A red or unrun release gate on
    a release cut blocks the pass. The gate definitions are owned by #309 release engineering (the
    `netscript-release` skill); the evaluator confirms they ran, it does not redefine them.
    Non-release runs treat this rule as `n/a`.

## Output

Write `.llm/runs/<run-id>/evaluate.md` using `templates/evaluate.md`.

## Evidence Standard

Every `PASS` row must have evidence: command, file, trace, route, consumer path, or debt entry. A
blank `PASS` is not a pass.
