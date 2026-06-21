You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Run **IMPL-EVAL** for the `sagas-prisma-store` prime-time slice on THIS PR branch (checked out for you). You are a SEPARATE evaluator session from the WSL Codex generator — do not trust the worklog; independently verify.

**Read first (in order):**
1. `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
2. `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-prisma-store/plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md`.
3. `.llm/harness/gates/archetype-gate-matrix.md` (ARCHETYPE-5 plugin runtime + ARCHETYPE-1 core; SCOPE-service overlay).
4. The diff vs the PR base; focus on `plugins/sagas/src/runtime/prisma-saga-store.ts`, `create-durable-saga-runtime.ts`, `saga-store-backend.ts`, `plugins/sagas/database/sagas.prisma`, and the `packages/cli` + `packages/aspire/config.ts` wiring.

**Production/enterprise bar to certify (NO stubs, NO no-ops):**
- `PrismaSagaStore` is a REAL durable implementation of `SagaStorePort` (save/load, transition ordering, correlation lookup, delete cascade) over Prisma delegates + `$transaction` — not an in-memory shim.
- **Optimistic-write parity is byte-exact**: `updateMany where {instanceId, version: expectedVersion}`; on `count===0 && rowExists` it throws `SagasError.validationFailed("Saga store version mismatch for <instanceId>.")` — confirm the message (including trailing period) is byte-identical to `KvSagaStore` and `MemorySagaStore`.
- **Back-compat**: `createDurableSagaRuntime()` called with zero args STILL defaults to the KV store; the locked #74 `SagaStorePort` contract and `KvSagaStore` behavior are UNCHANGED (additive only).
- `dispose()` teardown is wired into service + supervisor stop paths.
- Backend selection via `NETSCRIPT_SAGA_STORE` / appsettings `sagas.store.backend`, and the CLI `--saga-store-backend` option, actually flow through to generated saga executables (the Aspire config metadata-preservation repair).
- CATALOG LAW: `@prisma/client` stays `catalog:` (deno.json:106); confirm `deno.json`/`deno.lock`, `packages/aspire/src/public/mod.ts`, and `scaffold-versions.ts` are UNTOUCHED.

**Independently RE-RUN the gates. This IS an e2e-cli-gate slice (F-13):**
- `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — the merge-readiness verdict. Report raw exit code and any failing suite/test names. (The generator reported 41 passed / 0 failed.)
- `deno test --unstable-kv --allow-all plugins/sagas packages/plugin-sagas-core` (generator reported 66 passed).
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas --root packages/plugin-sagas-core --root packages/cli --ext ts,tsx`.
- Touched-file lint/fmt over the slice's changed TS files.

**Allowed deferrals (do not fail for these — confirm recorded in drift.md / arch-debt.md):** Prisma `SagaIdempotencyPort` parity (KV stays the applied-key backend); `.prisma` not fmt-able by `deno fmt`; pre-existing repo-wide `arch:check` baseline-red plus the one new accepted saga folder-cardinality WARN.

**Emit a verdict** of exactly `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` with file:line evidence. Preserve lock hygiene: do not commit `deno.lock` re-resolution or source churn unless an explicit reviewed fix requires it.

Issue/PR title: prime-time: sagas-prisma-store (Prisma durable backend parity)

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
- Write /home/runner/work/_temp/openhands/27867781018-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27867781018-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-84/run-27867781018-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 84
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27867781018
