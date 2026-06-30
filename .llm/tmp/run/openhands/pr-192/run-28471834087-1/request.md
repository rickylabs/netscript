You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

PLAN-EVAL (harness, separate session). This is a **planning-only** PR. Do NOT implement anything. Evaluate the plan for PLAN-GATE readiness and emit a verdict.

## SKILL

Activate and apply these repo skills before evaluating:
- `.agents/skills/netscript-harness` — run the PLAN-EVAL protocol: read `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md`; emit `PASS` or `FAIL_PLAN`; you are a SEPARATE session and must not self-certify.
- `.agents/skills/netscript-doctrine` — archetype/axiom/layering/anti-pattern checks. Triggers-core = ARCHETYPE-3 (runtime/ports/adapters); connector = ARCHETYPE-5 (thin presentation). Verify layering (domain→ports→application/runtime→adapters; presentation reads ports only), A4/A5, no new `any`, the 2-cast limit, folder vocabulary.
- `.agents/skills/jsr-audit` — confirm the planned public surface (new `-core` exports: ports, runtime entrypoints, stores) is JSR-publishable (no slow types, explicit return types, `@module`/symbol docs planned).
- `.agents/skills/netscript-deno-toolchain` — for any dependency/version/`deno doc` surface questions.

## What to read

- `.llm/tmp/run/feat-triggers-feature-backing--181/research.md` (authoritative 11-route contract table, base-state correction, domain-type gaps, cron-preview capability gap).
- `.llm/tmp/run/feat-triggers-feature-backing--181/plan.md` (6 dependency-ordered slices S1–S6, 12 locked decisions L1–L12, gates, risks, new debt).
- Ground-truth the plan against the cited source: `packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts`, `packages/plugin-triggers-core/src/domain/trigger-definition.ts`, `packages/plugin-triggers-core/src/ports/mod.ts`, `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts`, `plugins/triggers/services/src/routers/v1.ts` + `v1-types.ts` + `main.ts`, `packages/cron/ports/types.ts` + `packages/cron/adapters/deno.adapter.ts`, `packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`.

## Grade specifically

1. **Base-state accuracy** — confirm the 3 corrected premises (connector already converged; KV already `@netscript/kv` so migration is a no-op; deferral = plain throw→500). Flag any remaining stale premise.
2. **Route→slice coverage** — every one of the 6 deferred routes + the 2 backed-route gaps maps to exactly one slice; no route left unbacked; soundness test (`enabled` required, :52) stays green under L3.
3. **Layering & axioms** — each net-new file (enabled-state port/store, manual-dispatcher, webhook-test-delivery, cron engine, subscription port/adapter) lands in the correct layer; no connector→core leak; no new casts (L10); A5 composition preserved.
4. **Highest-risk slice (S5 cron engine, L6)** — is a triggers-core-owned next-N-occurrences engine the right call vs upstreaming to `@netscript/cron`? Is the timezone/DST test strategy adequate? Confirm the capability gap (research §6) is real.
5. **L9 testWebhook semantics** — genuine HMAC-sign of a synthetic canonical body routed through real ingress: sound, or does it weaken the HMAC guarantee?
6. **#184 coordination (L12)** — is "#181 lands first, then #184 absorbs relocation" safe given the 4 hot shared files? Flag sequencing hazards.
7. **Debt** — are `CRON-NEXT-FIRE-ENGINE` and `TRIGGERS-SSE-MULTI-REPLICA` correctly scoped as new debt; is closing `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` justified at program end?

## Output

Post a PR comment verdict: `PASS` or `FAIL_PLAN` with specific, actionable findings keyed to slice/decision IDs. Do not commit source. Preserve lock hygiene: do not commit `deno.lock` or any source churn.


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
- Write /home/runner/work/_temp/openhands/28471834087-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28471834087-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-192/run-28471834087-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 192
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28471834087
