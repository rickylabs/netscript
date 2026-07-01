You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500

use harness

You are the **IMPL-EVAL** evaluator (separate session, final post-implementation pass) for the spurious-MySQL-probe fix on branch `fix/175-sqlite-mysql-probe` (PR #196, closes #175). Do NOT implement or rewrite — independently verify the implementation against the gates and emit a verdict (`PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`).

## SKILL
- `netscript-harness` — you are running IMPL-EVAL; read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` + the relevant `gates/*`, and honor the evaluator-separation contract (the generator does not self-certify; you are independent).
- `netscript-cli` — domain checks for this PR.

## Scope to verify
`@netscript/service`'s startup DB-reachability probe now respects the configured engine via `resolveProbeEngine` (sqlite → skip, unrecognized → skip, unset → legacy mysql default) instead of always probing MySQL. Verify the new connectivity tests incl. the `sqlite → skip` regression + env-resolution cases; confirm the mysql path is unchanged. Gates: service `check` + `test`.

Run the package gates yourself, diff the change against the issue + the archetype/L0 contract, confirm no regressions, then post the verdict as a PR comment.

Issue/PR title: fix(service): spurious MySQL reachability probe under --db sqlite (#175)

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
- Write /home/runner/work/_temp/openhands/28478152433-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28478152433-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-196/run-28478152433-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 196
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28478152433
