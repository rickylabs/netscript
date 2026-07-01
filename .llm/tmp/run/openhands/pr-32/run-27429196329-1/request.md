You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run the final IMPL-EVAL pass for Run 3 on this PR.

You are the separate evaluator session, not the implementation session. Do not merge.

Read the harness evaluator protocol, the plan of record, worklog, commits, drift, final readiness report, Slice 16 E2E proof report, and the PR comments for Run 3.

Verify these remote heads before evaluating:

- framework `feat/package-quality-wave5-apps-5c2-design-system`: `586a2fbac335bbc6b430bf7960de53c187472ba6`
- repo-genesis `feat/repo-genesis`: `189fa782fd0a4b72c8f1e8101b8e3f6a6ee2aa61`

Evaluate against the Run 3 definition of done and post one of: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with concrete findings and exact gates checked.

Important evaluator notes:
- Zag had already been proved working in a previous commit and is mentioned in this PR; validate the recorded ADR/policy rather than requiring a migration of the seven native-backed components.
- The generated frontend scaffold proof passed on a fresh app, including `/design/tokens`, `/design/components`, `/design/composition`, `/dashboard`, theme flip both ways, 390x844 no-overflow evidence, reduced motion, and zero browser errors.
- The full `scaffold.runtime` E2E smoke failed at `database.init` because Prisma Windows `schema-engine-windows.exe` exited with `ERR_STREAM_PREMATURE_CLOSE` after Aspire/Postgres readiness. Treat that as evaluator-visible drift and classify it according to the harness protocol.
- Preserve lock hygiene: do not commit `deno.lock` or source churn unless a reviewed fix is explicitly required.

Issue/PR title: Run 5c2: Official design system

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27429196329-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27429196329-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-32/run-27429196329-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 32
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27429196329
