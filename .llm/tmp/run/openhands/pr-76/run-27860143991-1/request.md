You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness — run IMPL-EVAL for the `sagas-telemetry-spans` slice.

This branch was just **rebased onto the live umbrella** `feat/framework-prime-time` (merge-base `9b3bde45`, which now includes #74 SagaStorePort seam, #78, #79, #80, and #75 sagas-idempotency-e2e). The rebase integrated #75's durable applied-key idempotency guard WITH this slice's OTel telemetry spans in `packages/plugin-sagas-core/src/runtime/saga-engine.ts` (applied-key guard runs before handler/persist; accepted messages run the guarded transition inside the `saga.handle` span), and preserved both wirings in `plugins/sagas/services/src/main.ts` and `plugins/sagas/src/runtime/saga-supervisor.ts`. New tip `8084084632`.

Your **prior IMPL-EVAL produced no `evaluate.md` / verdict** — re-run the full IMPL-EVAL now. Read the plan/research/worklog/commits/drift under `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-telemetry-spans/`, evaluate against ARCHETYPE-5 + the sagas runtime gate set, verify the telemetry+idempotency integration is correct and complete (no dropped applied-key guards, no broken spans), run check + `deno test --allow-all --unstable-kv packages/plugin-sagas-core/ plugins/sagas/`, then write `evaluate.md` with PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT. Preserve lock hygiene: do NOT commit `deno.lock` or source churn unless a reviewed fix requires it.

Issue/PR title: [prime-time] Saga engine telemetry spans

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
- Write /home/runner/work/_temp/openhands/27860143991-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27860143991-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-76/run-27860143991-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 76
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27860143991
