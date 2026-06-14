You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- frontend-design
- ux-patterns

**PLAN-EVAL — independent evaluator session for [5d5 form — RFC 15 forms consuming fresh-ui].** The PLAN generator committed `design.md` (147 lines) + `plan.md` (305 lines) + `research.md` + `context-pack.md` to `.llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/` on this branch. You are the INDEPENDENT evaluator — you did not write these.

Verify (binary PASS/FAIL each):
1. the `form/` decomposition target is DECIDED (module split + file responsibilities), not left as options.
2. the fresh<->fresh-ui SEAM is specified: `form-field.tsx` / `control-props.ts` / `l0-conventions.md` state + the data-*/ARIA contract between the form layer and the UI primitives.
3. the Standard Schema interop choice is MADE (zod / valibot / arktype) with measurement-grounded rationale and a single canonical adapter, not deferred.
4. the progressive-enhancement strategy (no-JS form submit + island hydration) is decided and consistent with RFC 15.
5. design.md resolves every D-5d5-n decision the research handed off (no open decisions leaking into IMPL), and the plan's slices retire the doc-lint / private-type-ref budgets cited in research.md.

CRITICAL gate check (this was the sibling 5d4 failure mode): does `plan.md`'s fitness-gate table list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`? Flag any required gate omitted WITHOUT N/A rationale. Confirm each applicable gate is mapped to a slice and the slice numbers in the gate table match the actual commit-slice lock (no off-by-one). Reconcile the doc-lint / over-cap / private-type-ref budgets against the committed measurement artifacts, and confirm drift.md does not reference sections/locks/slices absent from plan.md.

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`), and `handover-5d5-plan.md`.

Output: commit `plan-eval.md` to the run dir (binary PASS/FAIL per item + gate-by-gate findings). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d5] fresh form — RFC 15 forms consuming fresh-ui seams (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27466343559-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27466343559-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-38/run-27466343559-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 38
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27466343559
