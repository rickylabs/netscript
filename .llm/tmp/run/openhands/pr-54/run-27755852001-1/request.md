You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=800 use harness

**ROLE: PLAN-EVAL (cycle 2)** — plan-gate evaluator for the `chore/prod-readiness` group of the `release/jsr-readiness` umbrella. You are a SEPARATE evaluator session — do NOT implement, edit framework code, or rewrite the plan. Judge the plan only.

**Context:** cycle 1 returned `FAIL_PLAN` (your prior `plan-eval.md`, commit 3e305a82) with 7 required fixes. The plan author has applied a remediation (commit 9ed3791b). Your job: re-walk the full Plan-Gate AND confirm each of the 7 fixes is genuinely resolved in the tree (not just asserted).

**Read first (authoritative protocol):**
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md`
- `.llm/harness/evaluator/verdict-definitions.md`

**Then read the run (this PR's branch, `chore/prod-readiness`):**
- `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` (your cycle-1 verdict — the 7 fixes)
- `.llm/tmp/run/chore-prod-readiness--cleanup/research.md`
- `.llm/tmp/run/chore-prod-readiness--cleanup/plan.md`
- `.llm/tmp/run/chore-prod-readiness--cleanup/worklog.md` (esp. `## Design` + the cycle-1 remediation progress rows)
- `.llm/harness/debt/arch-debt.md` (new entry `database-connectivity-legacy-connstring-alias`)

**Verify each cycle-1 fix against the tree (spot-check, do not take the plan's word):**
1. **F3** — confirm `ConnectionStrings__{provider}db` (`servy-environment.ts:139`) is READ by `packages/service/src/diagnostics/database-connectivity.ts:48,71,94`, so F3 is correctly classified FUNCTIONAL/off-limits, and the arch-debt entry exists.
2. **S4'/PR-7** — confirm `mysqlJsonExtension` (`packages/database/extensions/sql-json.extension.ts:571`) is NOT `@deprecated` on the branch and the plan DEPRECATES it (G1-3b) rather than deleting it; `mssqlJsonExtension` (@deprecated @554) is the only removal.
3. **S5/PR-7** — confirm `trustedConnection` is written at `mssql.adapter.ts:415-416`, so G1-3c is correctly a behavioural refactor (migrate to `authentication.type='ntlm'`) with its own adapter test, not a symbol delete.
4. **S6** — confirm `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` emits `.schedule(...)` and that it (plus its fixture) is in G1-5's touch list, gated on full `scaffold.runtime`.
5. Confirm G1-3a/b/c, G1-4, G1-5 each carry a `scaffold.runtime` smoke gate.
6. Confirm every slice (G1-0..G1-6) now names a file list + LOC budget, and each slice is single-concern (<~30 LOC except G1-5, which is flagged for sub-split).
7. Confirm G1-6 is bounded (touched surfaces + `.llm/tools/`; new dead surfaces deferred, not removed).

Also re-confirm the off-limits guardrail PASS (no edits to `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or catalog/`catalog:`).

**Verdict:** write `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` (the workflow commits it back to the branch; overwrite the cycle-1 file). Emit exactly one of **PASS** or **FAIL_PLAN** with specifics. Put the verdict + a one-paragraph rationale in `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow posts the status). No implementation slice may begin before PASS. This is cycle 2 of 2 before escalation.

Issue/PR title: chore/prod-readiness — repo cleanup (Group 1 of release/jsr-readiness)

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
- Write /home/runner/work/_temp/openhands/27755852001-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27755852001-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-54/run-27755852001-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 54
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27755852001
