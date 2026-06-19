You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run IMPL-EVAL (merge-readiness) for docs workstream **W3** on `docs/w3-prose-structure` (base `docs/user-site`). SEPARATE-session adversarial evaluator — do NOT author/fix. One verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT).

Verify:
1. The diff vs `docs/user-site` is **prose/structure only** — NO capability-claim changes: specifically no `/rpc`↔`/api/rpc` edits, and no altered status text for trigger `defer`, streams `publish`/`subscribe`, task/polyglot telemetry, or the Postgres queue adapter.
2. No new chapters, tutorial restructure, or xref/link-system work crept in (those are W4/W5/W6).
3. The Lume docs build is green with no Vento parse errors (no `function` keyword inside comp-tag args was introduced); touched-file Markdown fmt is clean.
4. Voice improvements are real (less mechanical, clearer flow) and didn't break headings/links.
Read `.llm/tmp/run/w3-prose/{brief.md,worklog.md,commits.md}`. The "component pages left unchanged" limitation is acceptable/documented — do not fail for it. W3 only.

Issue/PR title: docs: voice + structure pass on user docs (W3)

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
- Write /home/runner/work/_temp/openhands/27838693958-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27838693958-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-69/run-27838693958-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 69
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27838693958
