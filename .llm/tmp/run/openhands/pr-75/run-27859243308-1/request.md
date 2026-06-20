You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Act as the **IMPL-EVAL evaluator** (separate session from the generator) for harness run `feat-prime-time-sagas-idempotency-e2e--impl` on this PR branch. Do NOT implement features; evaluate and verify.

Read first, in order:
- `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/tmp/run/feat-prime-time-sagas-idempotency-e2e--impl/{plan.md,worklog.md,context-pack.md,drift.md,commits.md}`
- The selected archetype `ARCHETYPE-5` (plugin) for `@netscript/plugin-sagas` plus its sibling core `@netscript/plugin-sagas-core`, and the `SCOPE-service.md` overlay
- `.llm/harness/gates/archetype-gate-matrix.md`

This slice was just rebased onto the merged umbrella `feat/framework-prime-time` (durable-store #74 landed). Verify specifically:
1. It **consumes the locked durable-store contract** (`KvSagaStore`, `createDurableSagaRuntime`, `SagaStorePort`) and does NOT reintroduce a divergent one or drop #74/#78/#79/#80.
2. Durable idempotency is real and production-grade: idempotency roots are persisted in the KV store, replays are deduplicated correctly across process restarts (no in-memory-only shortcut, no no-op), with an end-to-end test covering the durable idempotency flow.

Re-run the slice gate set yourself and record verdict evidence: scoped check/lint/fmt for the touched roots, `deno test --unstable-kv --allow-all packages/plugin-sagas-core plugins/sagas` (generator reported 46 passed), `deno publish --dry-run`, JSR audit, consumer import probe, and scoped doctrine checks. Note the generator recorded root doctrine as baseline-red (pre-existing) and an existing non-slice plugin finding as baseline drift — confirm these are genuinely pre-existing and not introduced by this slice.

Emit one verdict — `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` — write `.llm/tmp/run/feat-prime-time-sagas-idempotency-e2e--impl/evaluate.md`, and summarize the verdict + evidence as your PR comment.

Lock hygiene: do NOT commit `deno.lock` re-resolution churn or unrelated files. If `deno install` mutates the lock, restore it before any commit. Keep commits to evaluator artifacts only.

Issue/PR title: [prime-time] Saga idempotency end-to-end (durable applied-key reservation)

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
- Write /home/runner/work/_temp/openhands/27859243308-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27859243308-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-75/run-27859243308-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 75
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27859243308
