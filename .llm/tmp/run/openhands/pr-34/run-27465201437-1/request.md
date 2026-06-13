You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit

**PLAN-EVAL — independent evaluator session for [5d1 support spine — error taxonomy + telemetry convention].** The PLAN generator committed `design.md` (267 lines) + `plan.md` (265 lines) + `research.md` + `context-pack.md` to `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/` on this branch. You are the INDEPENDENT evaluator — you did not write these.

Verify (binary PASS/FAIL each): (1) the SINGLE cross-cutting telemetry convention is defined and reconciles `defer/telemetry.ts` vs `form/telemetry.ts`; (2) telemetry module LOCATION decided vs doctrine A8/AP-16; (3) `components/` dissolution target + import migration map present; (4) JSDoc remediation sequence for the 25 symbols; (5) the 6 in-scope private-type-ref fixes specified (8 others umbrella-deferred); (6) `defer/` root re-export decision made.

CRITICAL gate check (this was the sibling 5d4 failure mode): does `plan.md`'s fitness-gate table list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`? Flag any required gate omitted WITHOUT N/A rationale. Confirm each applicable gate is mapped to a slice and the slice numbers in the gate table match the actual commit-slice lock (no off-by-one). Also reconcile the doc-lint / over-cap / private-type-ref budgets against the committed measurement artifacts, and confirm drift.md does not reference sections/locks/slices absent from plan.md.

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`), and `handover-5d1-plan.md`.

Output: commit `plan-eval.md` to the run dir (binary PASS/FAIL per item + gate-by-gate findings). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d1] fresh support spine — error · utils · vite config · interactive · mod skeleton (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27465201437-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27465201437-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-34/run-27465201437-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 34
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27465201437
