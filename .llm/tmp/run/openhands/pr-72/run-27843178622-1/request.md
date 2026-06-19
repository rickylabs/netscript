You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run IMPL-EVAL (merge-readiness) for the docs render-fix on `fix/docs-render-table-code` (base `docs/user-site`). SEPARATE-session adversarial evaluator — do NOT author/fix. One verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT).

Verify:
1. Build the site: from `docs/site`, run the build task in `docs/site/deno.json` (e.g. `deno task build`). It must succeed.
2. apiTable body cells now render LEGIBLE content — inspect rebuilt `_site` HTML + computed styles for a capabilities page (e.g. `capabilities/background-jobs`): the name/type `<code>` chips and the description text in `<tbody>` must have a color clearly distinct from their cell background, in BOTH dark and light themes. Confirm the fix is a real contrast fix, not hidden/removed content.
3. Tabbed/fenced code blocks preserve indentation: confirm `white-space: pre` applies to `.ns-prose pre`/`pre code` and that `tabbedCode.vto` does not trim leading whitespace or collapse newlines. Check a built page that uses `comp.tabbedCode(...)`.
4. Diff is scoped to `docs/site/**` (styles/docs.css + _components/tabbedCode.vto). No `packages/`/`plugins/` change, no `deno.lock` change, and NO unrelated churn or stray/junk files in the changed-file set.
Read `.llm/tmp/run/docs-render-fix/{brief.md,worklog.md,commits.md}` and check adversarially. Render-fix only.


Issue/PR title: fix(docs): restore api-table cell contrast + preserve tabbed-code formatting

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
- Write /home/runner/work/_temp/openhands/27843178622-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27843178622-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-72/run-27843178622-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 72
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27843178622
