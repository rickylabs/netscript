You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

**PLAN-EVAL (read-only) — slice `sagas-prisma-store`** (Track-3, Prisma durable `SagaStorePort` backend parity).

This is a harness PLAN-EVAL pass, identical protocol to the Wave-A blocker batch you already evaluated on this PR. Do NOT implement; do NOT modify source. Read-only verdict only.

Checkout: this PR's branch `feat/framework-prime-time` (umbrella; already contains the merged #74 `sagas-durable-store` seam this slice extends).

Read, in order:
1. `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` (the gate you enforce).
2. `.llm/harness/gates/archetype-gate-matrix.md` plus `.llm/harness/archetypes/ARCHETYPE-2.md` and `.llm/harness/archetypes/ARCHETYPE-5.md` (this slice is ARCHETYPE-2 integration + ARCHETYPE-5 plugin, SCOPE-service overlay, plus a `@netscript/cli` scaffold touch).
3. The slice artifacts under `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-prisma-store/`:
   - `research.md` (post-#74-merge grounded findings: the locked `SagaStorePort`, the `KvSagaStore` reference impl, the `createDurableSagaRuntime` selection seam that currently force-opens `Deno.Kv`, the `ctx.db.getClient()` Prisma wiring, and the schema-reconciliation recommendation),
   - `plan.md` (goal/scope, archetype/overlays, contract-first/no-port-change, Design §4.1–§4.5, 6 commit slices, gate set, debt, risks, production bar),
   - `plan-meta.json` (locked decisions, contracts, test plan, plan-gate self-check, open questions, risks).

Re-verify the cited `file:line` anchors against the checked-out tree (`packages/plugin-sagas-core/src/ports/saga-store-port.ts`, `plugins/sagas/src/runtime/kv-saga-store.ts`, `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`, `plugins/sagas/services/src/main.ts`, `plugins/sagas/database/sagas.prisma`). Confirm the plan is additive (no #74 rework, no `SagaStorePort` change), that error-shape parity (`SagasError.validationFailed("Saga store version mismatch for <instanceId>")`) is specified, that the backend-selection/teardown seam refactor is backward-compatible, that catalog law is honored (`@prisma/client` via `catalog:`, no de-catalog / version-pin change), that the deferred Prisma idempotency-port scope is explicit (not a silent drop), and that the gate set is correct for ARCHETYPE-2 + ARCHETYPE-5 + SCOPE-service including the `e2e:cli scaffold.runtime` requirement + `e2e-cli-gate` label (scaffold output changes).

Two specific open decisions need your ratification (the plan proposes an answer for each — confirm or require a change):
- **Dedicated durable runtime tables** (`saga_runtime_state` / `saga_runtime_transition` / `saga_runtime_correlation`, keyed to match the port's `instanceId`-primary semantics) **vs** promoting the existing projection `SagaInstance` (PK `[sagaName, id]`). Plan recommends dedicated tables.
- **No-implicit-default vs back-compat**: plan retains the zero-arg `createDurableSagaRuntime()` KV default for existing internal callers while scaffold + docs always present an explicit KV/Prisma choice. Confirm this reconciliation is acceptable, or require a hard explicit-choice error everywhere.

Emit the verdict (`PASS` or `FAIL_PLAN`) as a PR comment with the plan-gate checkbox table and per-box justification, and write `plan-eval.md` into the slice directory. If `FAIL_PLAN`, name exactly which plan-gate box(es) fail and the minimal fix — do not rewrite the plan yourself.

Issue/PR title: Framework Prime-Time Hardening (umbrella)

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
- Write /home/runner/work/_temp/openhands/27859602970-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27859602970-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-73/run-27859602970-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 73
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27859602970
