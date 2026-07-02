You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=800

use harness

Run the IMPL-EVAL pass for PR #226. This is the separate evaluator session for slice #212. Read the PR branch and the run artifacts at `.llm/tmp/run/fix-prompt-input-field-sizing--212/` if present in the checkout; if those artifacts are unavailable because `.llm/tmp` is local-only, evaluate from the committed diff and PR body.

## SKILL

- `netscript-harness` — enforce IMPL-EVAL protocol and verdict discipline.
- `netscript-doctrine` — confirm the `fresh-ui` Archetype 4 / frontend CSS-only package constraints.
- `netscript-tools` — verify gate evidence, lock hygiene, and raw git status.
- `netscript-deno-toolchain` — run/interpret Deno check/test/fmt evidence for touched files.
- `netscript-pr` — comment a structured IMPL-EVAL verdict on the PR.
- `rtk` — use token-saving wrappers for read-heavy git/grep and `rtk proxy` for Deno tasks when available.

## Task

Evaluate whether PR #226 correctly moves `field-sizing: content` into the `PromptInput` primitive CSS, preserves the existing min/max height behavior, avoids JS autosize, keeps generated registry content aligned, and has adequate focused validation.

Expected verdict format: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with concrete findings if not PASS.


Issue/PR title: fix(fresh-ui): auto-grow prompt-input via CSS field-sizing:content (#212)

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
- Write /home/runner/work/_temp/openhands/28554471536-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28554471536-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-226/run-28554471536-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 226
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28554471536
