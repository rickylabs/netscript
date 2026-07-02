You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Per-page validation of this docs-only PR (branch `docs/pr-c-workers-sdk`). Verify, do not self-certify.

## Gates
1. Docs-only: `git diff --name-only origin/main...HEAD` returns ONLY files under `docs/site/`.
2. From `docs/site`: `deno task build` and `deno task check:links` must pass. (`check:caveats` exits 2 only from the known Windows path-sep bug; confirm it passes on Linux CI.)

## Verify each claim against source on this branch (must match shipped reality)
- `triggerJob`/`triggerTask` path-id-authoritative + typed `VALIDATION_ERROR`: confirm at `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts` (routes `/jobs/{id}/trigger`, `/tasks/{id}/trigger`), `workers.contract-schemas.ts` (id optional, resolved from path), `plugins/workers/services/src/routers/jobs.ts` (fail-loud on missing id), `packages/contracts/src/domain/errors.ts` (VALIDATION_ERROR 422). The reference route table input/output must match the contract.
- `/api/rpc/*` typed client path: confirm `packages/service/src/builder/service-rpc.ts` mounts `/api/rpc`; the `createServiceClient` example shape must be valid.
- job-registry: confirm `plugins/workers/src/cli/registry-compiler.ts` scans `workers/jobs/*.ts` and keys id by filename, and that the API service loads generated jobs at startup (`plugins/workers/services/src/main.ts`). Confirm the doc no longer claims a `plugins/triggers/jobs` scan.

## Report (pr-comment)
Per-page PASS/FAIL with source file:line evidence, docs-only verdict, build/links result, and any code sample whose API shape mismatches source. Do not commit deno.lock or source churn.


Issue/PR title: docs(workers): triggerJob/triggerTask typed RPC routes, path-id semantics, job-registry discovery

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
- Write /home/runner/work/_temp/openhands/28625538238-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28625538238-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-297/run-28625538238-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 297
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28625538238
