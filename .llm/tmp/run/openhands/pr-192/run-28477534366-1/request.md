You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

IMPL-EVAL (harness, separate session). This is the final evaluator pass for the #181 Triggers
Feature-Backing program (PR #192, branch `feat/triggers-feature-backing`, tip `b82ca54b`). The
generator (WSL Codex) implemented all 6 slices. Do NOT implement or fix anything — evaluate the built
artifact and emit one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## SKILL

Activate and apply these repo skills before evaluating:
- `.agents/skills/netscript-harness` — run the IMPL-EVAL protocol: read
  `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`; you are a
  SEPARATE session and must not self-certify; eval loop limit is two failures before escalation.
- `.agents/skills/netscript-doctrine` — ARCHETYPE-3 (`@netscript/plugin-triggers-core` runtime engine)
  + ARCHETYPE-5 (thin `plugins/triggers` connector). Verify layering
  (`domain→ports→application/runtime→adapters`; presentation/connector reads ports only), A4/A5/A8/A11,
  the cast budget (no new `as unknown as` beyond sanctioned; NO new `any`), folder vocabulary, and that
  any new/deepened debt is recorded in `.llm/harness/debt/arch-debt.md`.
- `.agents/skills/jsr-audit` — confirm every new public export is JSR-clean (explicit return types /
  isolatedDeclarations-safe, no slow types, `@module`/symbol docs) and that `deno publish --dry-run`
  stays green for both `packages/plugin-triggers-core` and `plugins/triggers`.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` to ground-truth the realized public surface;
  scoped check/lint/fmt wrappers; `--unstable-kv` on workspace `deno check`.

## What to read
- `.llm/tmp/run/feat-triggers-feature-backing--181/plan.md` (THE SPEC — locked decisions L1–L13,
  Slices 1–6, Gates, coordination with #184).
- `.llm/tmp/run/feat-triggers-feature-backing--181/research.md` (base-truth + route table + smells).
- `.llm/tmp/run/feat-triggers-feature-backing--181/worklog.md`, `commits.md`, `drift.md`,
  `context-pack.md` (the generator's evidence).
- The realized source: `packages/plugin-triggers-core/src/**` and
  `plugins/triggers/services/src/**`, plus the touched tests.

## Per-slice / per-decision verification (the spec is locked — verify the artifact MATCHES it)

1. **The 6 deferred routes are genuinely backed** (not stubbed): definition `name`/`enabled` fields,
   enabled-state persistence, manual fire dispatch, webhook test delivery, schedule previews, event
   subscriptions. Confirm `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` (arch-debt) is legitimately CLOSED —
   i.e. each route now has a real backing implementation, not a 501/deferred shim.
2. **L1:** the ONLY `main.ts` edit is default-port construction inside `createTriggersServiceContext`;
   the `createPluginService(router,{...}).serve()` assembly is NOT restructured. (Note: `arch:check`
   warns `main.ts` > 500 lines — judge whether this is acceptable thinness debt for a feature-backing
   slice or a `FAIL_DEBT`; #184 plans to thin it. Likewise the `-core/src/runtime` immediate-child cap
   warning — judge accept-as-warning vs require-debt-entry.)
3. **L3:** `enabled?`/`name?` are OPTIONAL on `TriggerDefinitionBase`; the contract response `enabled`
   stays REQUIRED — `triggers-contract-soundness_test.ts:52` MUST be green.
4. **L4 (F5):** enabled-state store records OVERRIDES ONLY; a stale override (id in store, absent from
   current `definitions`) is filtered out BY THE CONNECTOR at response time, not by the store; mirrors
   `kv-worker-idempotency-store.ts`, prefix `['triggers','enabled-state']`.
5. **L9 (F2):** `testWebhook` genuinely HMAC-signs a synthetic canonical request and goes through
   `TriggerIngressPort.accept` — it must NOT call `verifier.verify` directly; honors `memory` vs
   `hmac-sha256`, resolves secret via `Deno.env.get(definition.secretEnv)` with `MemoryWebhookVerifier`
   fallback, sets `x-hub-signature-256: sha256=<hex>` over exact body bytes.
6. **L6 + S5 (F3):** `computeNextFireTimes(spec, count, from?)` is REAL 5-field cron iteration with
   timezone/DST (NOT cron's heuristic); the table-test covers the 8 enumerated cases (spring-forward
   skip, fall-back double, Asia/Tokyo, `from?` default, `spec.persistent`, leap-day, invalid-cron typed
   error, interval baseline). `CRON-NEXT-FIRE-ENGINE` upstream debt recorded.
7. **L13 (F4):** new public roots export FACTORIES as runtime values
   (`createManualDispatcher`/`createWebhookTestDelivery`/`computeNextFireTimes`/`createEventSubscription`/
   `createKvTriggerEnabledStateStore`); port interfaces (`TriggerEnabledStatePort`,
   `TriggerEventSubscriptionPort`) are `export type` only; memory testing adapters stay on the `testing`
   subpath, never `public/mod.ts`.
8. **L11:** `subscribeEvents` is in-process/single-replica; `TRIGGERS-SSE-MULTI-REPLICA` debt recorded.
9. **Casts/any:** NO new `as unknown as` beyond the sanctioned budget; NO new `any`. The triggers
   embedded-streams 2 casts handling is per plan.

## Gate re-confirmation (independently re-run the cheap ones)
- scoped `run-deno-check` (core + connector, `--unstable-kv`), `run-deno-lint`, `run-deno-fmt` → green.
- `deno task test` for the triggers-core + connector touched tests → green; contract-soundness green.
- `deno publish --dry-run --allow-dirty` both packages → green (no NEW slow types beyond the accepted
  T4 carve-out at arch-debt.md:346).
- `deno task arch:check` → `FAIL=0` (warnings allowed; flag any NEW warning not covered by a debt entry).
- Do NOT run the full `e2e-cli-prod` / `scaffold.runtime` JSR suite — that is post-publish only for #181.

## Output
Post a PR comment verdict on **PR #192**: `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` with
specific, actionable findings keyed to slice ids and L1–L13. Preserve lock hygiene: do not commit
`deno.lock` re-resolution or source churn — if you must run commands that touch the lock, do not commit
it. The supervisor reconciles the lock and merges on PASS.


Issue/PR title: Triggers feature-backing — net-new triggers-core runtime backs 6 deferred routes (PLANNING)

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
- Write /home/runner/work/_temp/openhands/28477534366-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28477534366-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-192/run-28477534366-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 192
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28477534366
