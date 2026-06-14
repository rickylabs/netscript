You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run PLAN-EVAL for the fresh-ui Run 3 implementation plan.

Use the current branch head `b066935b984dec35fb2f83fac723ead052676edc` and evaluate this run directory:

`.llm/tmp/run/feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp/`

Read, in order:
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md`
- the run `research.md`, `plan.md`, and the `## Design` section of `worklog.md`
- `.llm/harness/archetypes/ARCHETYPE-3-runtime-behavior.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` for scaffold slices 12-16
- `.llm/harness/archetypes/SCOPE-frontend.md`
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/harness/debt/arch-debt.md`

Write the verdict to the run's `plan-eval.md` and comment the result on this PR as `PASS` or `FAIL_PLAN` with the unchecked Plan-Gate boxes.

Important context: Zag has already been proved working in a previous commit and is mentioned in this PR. The Run 3 artifacts were updated to reflect that Slice 7 should cite/validate the existing proof in the ADR rather than re-litigating basic viability. Do not treat the existence of Zag proof as an open blocker; evaluate whether the plan records and gates it correctly.

Do not implement any slice, do not self-evaluate implementation, and do not merge.

Issue/PR title: Run 5c2: Official design system

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27412819714-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27412819714-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-32/run-27412819714-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 32
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27412819714
