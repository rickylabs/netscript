You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PLAN-EVAL — independent evaluator session for [5d6 query + server + final surface — RFC 14/16].** The PLAN generator committed `design.md` (366 lines) + `plan.md` (366 lines, 30-slice lock) + `research.md` (430 lines) + measurement artifacts (`doc-lint-aggregate.json`, per-module doc-lint logs, `dry-run.log`) to `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/` on this branch. You are the INDEPENDENT evaluator — you did not write these. This is the FINAL unit in the chain.

Verify (binary PASS/FAIL each):
1. the typed island query bridge (server-loader -> island-props -> client-hook) is DECIDED with concrete types/flow, not left open.
2. the `createQueryFactories` + `createServiceClient` Transport seam is specified (boundary, types, who owns what).
3. `defineFreshApp` extension points are documented and backward-compatible, with alpha-surface protection scoped.
4. the RFC 14 seam audit is complete and its in-scope vs deferred items are explicit.
5. **OPEN-DECISION JUDGMENT (be strict & binary):** design.md line ~48 flags `createQueryOptionsFor` as "design TBD with supervisor", and plan.md §Questions for supervisor asks whether to keep backward-compatible `useQuery`/`useMutation` aliases. For EACH: is it a genuine BLOCKER (an unresolved design decision that leaks into implementation), or is it safe-to-defer WITH a documented default position the plan can proceed on? Rule explicitly — do not wave it through.

CRITICAL gate check (sibling 5d4 failure mode): does `plan.md`'s fitness-gate table list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`? Flag any required gate omitted WITHOUT N/A rationale. Confirm each applicable gate is mapped to a slice and the slice numbers match the actual commit-slice lock (no off-by-one). Reconcile the doc-lint / over-cap / private-type-ref budgets against the committed artifacts (`doc-lint-aggregate.json` reports a deduplicated 276 total / 115 / 157 / 4 split — confirm the plan's slice budgets sum/trace to these), and confirm drift.md does not reference sections/locks/slices absent from plan.md.

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`), and `handover-5d6-plan.md`.

Output: commit `plan-eval.md` to the run dir (binary PASS/FAIL per item + gate-by-gate findings + your ruling on the two open decisions). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d6] fresh query + server + final surface — RFC 17 bridge, defineFreshApp, RFC 14 seam audit (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27467844680-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27467844680-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27467844680-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27467844680
