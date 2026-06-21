You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment run PLAN-EVAL for the NetScript "capability caveats fix track". You are the EVALUATOR in a SEPARATE session from the planner/implementers — do NOT author, edit, or implement anything. Emit exactly one PLAN-EVAL verdict (`PASS` or `FAIL_PLAN`).

Read in this order:
1. `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md`
2. The plan: `.llm/tmp/run/fix-capability-caveats--w2fixes/plan.md`
3. The supporting evidence: `.llm/tmp/run/fix-capability-caveats--w2fixes/audit/{capability-truth-matrix,caveats-and-gaps,missing-and-miscategorized}.md`
4. Spot-check the cited code so the problem statements are real (e.g. `packages/service/src/builder/service-rpc.ts:41`, `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94`, `plugins/streams/src/public/stream-api.ts:28`, `packages/plugin-streams-core/src/.../create-durable-stream.ts:118`, `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:147`, `packages/queue/factory/create-queue.ts:221`).

Evaluate against the Plan-Gate: are the 5 slices correctly scoped, contract-first, with verifiable acceptance gates and the right archetypes/overlays? Is the sequencing sound? Are the doctrine constraints (no catalog/version-pin/lock changes except a reviewed S5 dep; Option-A catalog law; LD-7 CLI publishes last) respected? Flag any slice whose stated fix is under-specified, risks scope creep, or whose acceptance gate would not actually prove the fix. Do not run the implementation; this is a plan review only.


Issue/PR title: plan: capability-caveats fix track (W2) — PLAN-EVAL

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
- Write /home/runner/work/_temp/openhands/27830366220-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27830366220-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-65/run-27830366220-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 65
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27830366220
