You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.6 output=pr-comment use harness proceed to PLAN-EVAL for this PR.

Scope:
- Treat this as a separate-session PLAN-EVAL only.
- Read the harness plan-gate protocol and the PR/run artifacts.
- Do not begin implementation slices.
- If the plan fails, write the specific FAIL_PLAN findings and required corrections.
- If the plan passes, write the PASS verdict and the concrete gate evidence checked.
- Write the final summary/verdict back to this PR comment thread.

Issue/PR title: [Wave 4 · 4b] workers — package quality (PREPARED, blocked on 4a pull-forward)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Write .llm/tmp/openhands/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- If output_mode is thread-replies, optionally write .llm/tmp/openhands/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 19
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.6
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27191329179
