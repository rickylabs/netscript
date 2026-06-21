You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

use harness. Act as the **PLAN-EVAL evaluator** (separate session) for the AS8
`auth-audit-observability` slice. This is the Plan-Gate **hard stop before any implementation** — no
source changes, no generator work.

## SKILL

Read each before evaluating:

- `netscript-harness` — `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
  `.llm/harness/gates/archetype-gate-matrix.md`, `.llm/harness/evaluator/verdict-definitions.md`.
- `netscript-doctrine` — ARCHETYPE-5 (plugin `plugins/auth`) + supporting ARCHETYPE-2/3 packages
  (`packages/plugin-auth-core`), `SCOPE-service.md` overlay.
- `netscript-deno-toolchain`, `jsr-audit` (A1 doc-lint full export set), `netscript-tools`, `rtk`.

## Inputs (committed on THIS PR branch `feat/prime-time/auth-s8-audit-observability`)

- `.llm/tmp/run/auth-s8-audit-observability/research.md`
- `.llm/tmp/run/auth-s8-audit-observability/plan.md`

Branch base is `main` @ `6f1c40f0` (the auth umbrella merged via #73; this plan was re-baselined from
the umbrella tip to `main`).

## Task

1. Read the harness plan-protocol + plan-gate checklist + both artifacts.
2. Evaluate against the plan-gate:
   - archetype + scope selection correct (ARCHETYPE-5 + supporting 2/3, SCOPE-service);
   - contract-first ordering (typed `AuthAttributes`/`AuthSpanNames`/`AuthErrorCode` → `createAuthTelemetry()`
     → service wiring → tests);
   - **zero-cast compliance** (no new `any`/`as unknown as` outside the two sanctioned exemplars,
     neither of which is in scope);
   - gate set adequacy (scoped check/lint/fmt + scoped test + jsr-audit A1; scaffold.runtime deferred);
   - the **16 referenced file:line anchors resolve on this branch** and the telemetry surface is net-new
     (`packages/plugin-auth-core` has no existing `telemetry/`);
   - soundness of D2 salted HMAC subject-hash, D3 mandatory tested redaction, D5 durable-event
     `traceparent` propagation against the AS4 emit seam, D6 typed error taxonomy via `ErrorHandlingPlugin`.
3. Emit **PASS** or **FAIL_PLAN** with concrete, file-anchored reasons. Two FAIL_PLAN cycles → escalate.
4. Write `.llm/tmp/run/auth-s8-audit-observability/plan-eval.md` and post the verdict as a PR comment.
5. Do **NOT** implement, modify source, or commit `deno.lock` churn / junk files.

Issue/PR title: AS8 — Auth Audit Observability (plan-of-record + PLAN-EVAL gate)

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
- Write /home/runner/work/_temp/openhands/27899218985-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27899218985-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-103/run-27899218985-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 103
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27899218985
