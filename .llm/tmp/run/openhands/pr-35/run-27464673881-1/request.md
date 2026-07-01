You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit

**PLAN-EVAL — independent evaluator session for [5d2 builders — definePage DSL decomposition].** The PLAN generator committed a REVISED `plan.md` (689 lines) + `design.md` (236 lines) + `research.md` + `context-pack.md` to `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/` on this branch. You are the INDEPENDENT evaluator — you did not write these. The prior eval was FAIL_PLAN with four blockers; verify whether the revision resolved EACH, binary PASS/FAIL:

1. **One-plan-vs-two decision made?** (Plan claims L-6 "One plan, not two" with a 28-slice rationale under the 30 cap — confirm it is decided with measurement-grounded rationale, not left open.)
2. **Actionable implementation sequence?** (A real PROPOSED slice lock ≤30, each slice naming files touched + gates + the doc-lint/over-cap/private-type-ref budget it retires — not a structural sketch.)
3. **Slow-type risk listing?** (Confirm the §Slow-type risk listing table enumerates which private-type-refs are slow types and which block JSR publishing.)
4. **design.md complete?** (All required sections per handover §"Concept of done (PLAN phase)" — decomposition + DSL gap verdicts + island/RFC-14 seams + the rest.)

ALSO check the standard plan-gate items: archetype + public-surface correctness; per-slice gates real and mapped to the archetype's REQUIRED gate set per `.llm/harness/gates/archetype-gate-matrix.md` (note which required gates, if any, are unmapped without N/A rationale — this was the failure mode on the sibling 5d4 unit); doc-lint / over-cap budgets reconciled against committed measurement artifacts; the required plan.md tail sections present (Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger); divergences from the umbrella logged as drift; drift.md does NOT reference sections/locks/slices absent from plan.md.

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`), and `handover-5d2-plan.md`.

Output: commit `plan-eval.md` to the run dir (binary PASS/FAIL on each of the 4 blockers + gate-by-gate findings). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` followed by the remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d2] fresh builders — definePage DSL decomposition (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27464673881-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27464673881-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-35/run-27464673881-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 35
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27464673881
