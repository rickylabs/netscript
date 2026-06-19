You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run IMPL-EVAL (merge-readiness) for capability-caveats slice **S4** on `fix/cap-caveat-s4-task-otel`. SEPARATE-session adversarial evaluator — do NOT author/fix. One verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT).

Verify:
1. The bridge **reuses** `@netscript/telemetry` (`getTracer`/`withSpan`), it does not reinvent a tracer; pattern mirrors `packages/telemetry/src/instrumentation/worker.ts` `traceJobExecution`.
2. A task run actually emits an OTel span to an in-memory exporter with the claimed name (`task.execute`) and key attributes; the test asserts them and would fail if the span weren't exported.
3. The existing in-memory `TaskExecutorSpan` behavior is preserved (no regression to current callers).
4. Diff scoped to `packages/plugin-workers-core` (+ test, + harness artifacts); `deno.lock` unchanged; check/lint green.
Read `.llm/tmp/run/cap-s4-otel/{brief.md,worklog.md,commits.md}` and check adversarially. S4 only.

Issue/PR title: feat(workers-core): export task-executor spans via @netscript/telemetry (S4)

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
- Write /home/runner/work/_temp/openhands/27838691719-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27838691719-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-68/run-27838691719-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 68
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27838691719
