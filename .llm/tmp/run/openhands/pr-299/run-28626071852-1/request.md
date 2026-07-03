You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Per-page validation of this docs-only PR (branch `docs/pr-d-streams-query`). Verify, do not self-certify.

## Gates
1. Docs-only: `git diff --name-only origin/main...HEAD` returns ONLY files under `docs/site/`.
2. From `docs/site`: `deno task build` and `deno task check:links` must pass. (`check:caveats` exits 2 only from the known Windows path-sep bug; confirm it passes on Linux CI.)

## Verify each claim against source on this branch
- Streams reference accuracy: confirm `plugins/streams/src/public/stream-api.ts` shows `defineStreamProducer().publish()` rejects and `defineStreamConsumer().subscribe()` throws `StreamUnsupportedOperationError`. The updated `reference/streams/index.md` must NOT present them as functional and must match `capabilities/streams.md`.
- `createServiceStreamProducer` + `ServiceStreamProducerOptions` (`assertResolvable` default true): confirm at `packages/plugin-streams-core/src/application/create-service-stream-producer.ts` and its export in `src/public/mod.ts`. The documented example shape must be valid.
- `refetchInterval` (`number | false`) + `refetchIntervalInBackground` (`boolean`): confirm on `IslandQueryOptions` at `packages/fresh/src/application/query/query-types.ts`. The options table types must match.
- Voice: confirm `capabilities/streams.md` no longer contains candor-register framing ("real and shipping today", "genuine") and that the HTTP/1.1 ~6-connection SSE caveat is still present.

## Report (pr-comment)
Per-page PASS/FAIL with source file:line evidence, docs-only verdict, build/links result, any API-shape mismatch. Do not commit deno.lock or source churn.


Issue/PR title: docs(streams): reconcile reference with fail-loud reality, add createServiceStreamProducer + refetchInterval

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
- Write /home/runner/work/_temp/openhands/28626071852-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28626071852-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-299/run-28626071852-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 299
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28626071852
