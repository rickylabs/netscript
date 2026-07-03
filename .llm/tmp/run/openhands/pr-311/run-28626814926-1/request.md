You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Docs-only voice pass. Validate the two changed pages only:
- docs/site/explanation/durability-model.md
- docs/site/explanation/auth-model.md

Checks:
1. From docs/site: `deno task verify` (build + check:links) must exit 0. If
   check:caveats exits 2 from docs/site cwd, re-run from repo root:
   `deno run --allow-read .llm/tools/docs/check-caveat-refs.ts docs/site`.
2. Confirm the diff is docs-only (only the two files above), touches no
   `packages/`/`plugins/` source, and introduces no dead links or Vento
   breakage.
3. Confirm no banned voice terms (honest/honesty/honestly/candor) were
   introduced and the reworded sentences read as plain factual prose.

Report the raw exit code and any failing check. Do not commit deno.lock or
source churn.


Issue/PR title: docs(voice): flatten candor-register phrasing in auth + durability explainers

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
- Write /home/runner/work/_temp/openhands/28626814926-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28626814926-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-311/run-28626814926-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 311
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28626814926
