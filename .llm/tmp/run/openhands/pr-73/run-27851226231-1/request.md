You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=400 use harness — run PLAN-EVAL for ONE prime-time blocker slice: `sagas-idempotency-e2e`.

You are **PLAN-EVAL**, a separate evaluator session. Judge the **plan only** — do not implement, do not run the implementation gate set, do not comment on code that does not yet exist. This run is read-only: **do NOT modify or commit any repository files**; your entire verdict goes in this PR comment (the run summary).

This PR's head branch `feat/framework-prime-time` is already checked out and contains the slice artifacts.

READ IN ORDER:
1. `.llm/harness/evaluator/plan-protocol.md` — your procedure.
2. `.llm/harness/gates/plan-gate.md` — the checklist you enforce, **box by box**.
3. `.llm/harness/evaluator/verdict-definitions.md` — verdict meanings.
4. `.llm/harness/gates/archetype-gate-matrix.md` + the selected archetype profile under `.llm/harness/archetypes/`.
5. **THIS SLICE ONLY:**
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-idempotency-e2e/research.md`
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-idempotency-e2e/plan.md`  (the `## Design` section lives **inside** this file)
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-idempotency-e2e/plan-meta.json`  (archetype, scopeOverlays, lockedDecisions, contracts, testPlan, planGateSelfCheck, openQuestions, risks)
6. `.llm/harness/debt/arch-debt.md` — relevant open debt.

BASELINE NOTE: current main already includes S2/S3/S5/OTel; the real tree is `f85da9c0`-based. A couple of plans cosmetically labeled the baseline SHA `cc3b8731` (the stale local main) — **ignore the label and verify against the actual files**. Per the protocol, spot-check at least one load-bearing `file:line` finding in `research.md` against the real tree.

PROCEDURE:
- Walk `plan-gate.md` **box by box**; for each, cite the plan location that satisfies it or mark it unchecked.
- Run the **open-decision sweep**: list any decision left open that would force rework if deferred. If the plan failed to flag one, that box is unchecked.
- Confirm commit slices are ordered, sized (< 30 files), and each names its proving gate and files.
- **Production / enterprise bar applies:** real durable persistence (no in-memory-only shipped default), real error handling + idempotency, observability/spans where relevant, graceful shutdown/drain where relevant, full unit + integration + failure-path tests. A plan that ships a stub / no-op / "reserved-for-future" advertised surface **fails**.

OUTPUT — emit **exactly one** verdict in this PR comment:
- `PASS` — every checklist box satisfied; include the per-box check table.
- `FAIL_PLAN` — list each unchecked box and the **specific** fix required.

Start the comment with a single line: `PLAN-EVAL sagas-idempotency-e2e: PASS` or `PLAN-EVAL sagas-idempotency-e2e: FAIL_PLAN`.

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
- Write /home/runner/work/_temp/openhands/27851226231-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27851226231-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-73/run-27851226231-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 73
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27851226231
