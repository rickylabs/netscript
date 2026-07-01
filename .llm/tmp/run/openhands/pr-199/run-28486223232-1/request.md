You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

RE-IMPL-EVAL (cycle 2) for PR #199 — **Domain 2 only**. Your cycle-1 verdict was Domain 1 PASS, Domain 3 PASS, **Domain 2 FAIL_FIX** on the `plugin new` CLI flag names. The prescribed fix has been applied in commit `24556e8f`.

Verify **only** that Domain 2 is now correct, grounded against the actual CLI source (`packages/cli/src/public/features/plugins/new/new-plugin-command.ts`):

- The command defines boolean `--feature` (default `false` → `kind: options.feature ? 'feature' : 'proxy'`), boolean `--force` (default `false` → `overwrite`), and `--project-root <path>`.
- There is **no** `--kind feature|proxy` flag and **no** `--overwrite` flag.

Confirm both docs now match:
- `docs/site/cli-reference.md` — the `netscript plugin new` row: example `netscript plugin new billing` (proxy default); desc uses `--feature` / `--force`.
- `docs/site/how-to/author-a-plugin.md` — example `netscript plugin new notifier`; options prose uses `--feature` (route-backed feature connector vs default proxy), `--force` (overwrite), `--project-root <path>`.
- No stray `--kind` / `--overwrite` mention survives anywhere describing `plugin new`.

Also re-run the two docs gates from `docs/site/` and report raw exit codes:

deno task build
deno task check:links

Expected: build exit 0 (306 files); check:links exit 0 (18456 internal links across 130 pages resolve).

Constraints: docs-only PR — flag ANY change outside `docs/site/`. Do not commit lock churn or source changes. Report the Domain 2 verdict (PASS / FAIL_FIX) plus the raw build/link exit codes. If Domain 2 is now PASS, state the overall PR verdict is PASS (Domains 1+3 already passed in cycle 1).


Issue/PR title: docs(site): reconcile to merged #193/#183/#190 surface + fmt-guard config

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
- Write /home/runner/work/_temp/openhands/28486223232-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28486223232-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-199/run-28486223232-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 199
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28486223232
