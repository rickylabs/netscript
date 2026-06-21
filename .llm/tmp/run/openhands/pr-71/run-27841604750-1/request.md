You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run IMPL-EVAL (merge-readiness) for capability-caveats slice **S5** on `fix/cap-caveat-s5-pg-queue`. SEPARATE-session adversarial evaluator — do NOT author/fix. One verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT).

Verify:
1. The `QueueProvider.Postgres` factory branch no longer rejects — it returns a real `PostgresAdapter` that satisfies the `MessageQueue<T>` contract (same shape as the Redis/RabbitMQ/DenoKV adapters). No silent stub remains.
2. The adapter test actually exercises publish -> claim -> handle -> ack and nack/requeue against a `pg` client double and would fail if the adapter regressed to the reject stub; the factory-regression assertion is real.
3. `pg` is used via the **already-catalogued** `pg ^8.21.0` — confirm NO new catalog entry, NO de-catalog, NO version-pin change, and that `deno.lock`'s delta is **pg-only** (`npm:pg@^8.21.0` + the `packages/queue` dep line) with NO unrelated workspace churn (`@prisma/client`, `amqplib@^2`, `clsx`, `tailwind-merge`).
4. Diff scoped to `packages/queue` (+ test, deno.json subpath, + harness artifacts); check/lint/fmt green. Watch for any stray/junk files in the changed-file set.
Read `.llm/tmp/run/cap-s5-pg-queue/{brief.md,worklog.md,drift.md,commits.md}` and check adversarially. S5 only.


Issue/PR title: feat(queue): implement PostgreSQL queue adapter (S5)

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
- Write /home/runner/work/_temp/openhands/27841604750-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27841604750-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-71/run-27841604750-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 71
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27841604750
