You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=250

use harness

You are the IMPL-EVAL re-check evaluator (separate session) for **PR #117 —
`docs/readme-revamp`** of `rickylabs/netscript`. Your prior IMPL-EVAL pass returned **FAIL_FIX**
with 8/10 gates PASS and exactly two Gate-7 (publish-glob correctness) config-hygiene issues. The
generator has now applied the two fixes you specified (commit `a85d0fcd`). Re-verify and emit the
updated verdict. Do NOT re-author anything.

Your prior verdict and the full per-package table are in
`.llm/tmp/run/docs-readme-revamp/evaluate.md`. Your prior summary explicitly stated: "After fixing
the 2 publish-glob issues above, the verdict should upgrade directly to PASS with no further gate
changes required."

## SKILL

- `.agents/skills/netscript-harness` — IMPL-EVAL protocol + verdict definitions
  (`.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`).
- `.agents/skills/jsr-audit` — JSR publish-surface + the publish bar.
- `.agents/skills/netscript-deno-toolchain` — `deno doc`, `deno task publish:dry-run`.

## Re-verify (Gate 7 only — the rest already PASSed and are unchanged by these 2 edits)

1. **Issue A — `packages/cli/deno.json`:** confirm the file now parses as strict JSON
   (`python3 -c "import json; json.load(open('packages/cli/deno.json'))"` succeeds) and that
   `deno check` emits NO "Unsupported compiler options" warning for it.
2. **Issue B — `packages/fresh-ui/deno.json`:** confirm `publish.exclude` no longer contains
   `"!docs/**/*.md"` and the file is strict-JSON valid.
3. **Regression guard:** confirm no `deno.json` across the 24 target packages re-introduced a
   `docs/**/*.md` include glob, the 26 `/docs` folders are still gone, and
   `deno task publish:dry-run` still exits 0 (slow-types warnings accepted; report raw exit code).

## Output

- Update `.llm/tmp/run/docs-readme-revamp/evaluate.md` with a short "Re-check (a85d0fcd)" section.
- Emit a concise PR comment with the updated overall verdict: **PASS** or **FAIL_FIX**.
- Do NOT commit any source/lock change. Report findings only; if dry-run causes lock churn, report
  it but do not commit it.


Issue/PR title: docs(readme-revamp): package + framework README revamp (PR2)

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
- Write /home/runner/work/_temp/openhands/28107721013-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28107721013-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-117/run-28107721013-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 117
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28107721013
