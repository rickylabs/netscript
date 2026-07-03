You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Docs-only accuracy PR: dashboard scheme http->https on :18888, corpus-wide.
Validate:
1. From docs/site: `deno task verify` (build + check:links) must exit 0. If
   check:caveats exits non-zero from the docs/site cwd bug, re-run from repo
   root: `deno run --allow-read .llm/tools/docs/check-caveat-refs.ts docs/site`.
2. Confirm the diff is docs-only (all changed files under docs/site/) and
   touches no packages/ or plugins/ source.
3. Confirm zero bare `http://localhost:18888` remain in emitted docs
   (`grep -rn "http://localhost:18888" docs/site | grep -v /_plan/` returns
   nothing) AND that the `http://localhost:18889` combos on the deploy pages
   are preserved (deploy-local-aspire.md, erp-sync/05-deploy.md,
   storefront/06-deploy.md still contain :18889).
4. Confirm no non-dashboard URL was altered (service ports :3001/:8091-8093
   etc. unchanged) and no line-ending churn (numstat ~57/57).

Report the raw exit code and any failing check. Do not commit deno.lock or
source churn.


Issue/PR title: docs: correct Aspire dashboard scheme http->https on :18888 (corpus-wide)

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
- Write /home/runner/work/_temp/openhands/28632721061-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28632721061-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-326/run-28632721061-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 326
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28632721061
