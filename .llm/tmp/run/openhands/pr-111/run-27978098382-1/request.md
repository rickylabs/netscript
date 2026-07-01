You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=300 use harness

# PLAN-EVAL — JSR-readiness additive valid set (PR-A, separate-session gate)

You are the **PLAN-EVAL evaluator** for PR-A of the JSR-readiness umbrella promotion, running in a
**separate session** from the planner. **You evaluate the PLAN and emit one verdict. You do NOT
implement, fix, or merge.** Implementation may not begin until your verdict is PASS.

## Context
The long-parked `release/jsr-readiness` umbrella was never promoted to `main`. Per a locked user
decision it is being re-landed as a FRESH branch off current `main`, dragging ONLY the valid set,
**split** into a non-breaking PR-A (this PR) and a breaking PR-B (prod-readiness API removals,
follows after a main-consumer check). Docs-v4 already landed on main separately (#110), so the
umbrella's old Lume docs site is dropped as superseded.

## What to read (on this branch)
- `.llm/tmp/run/jsr-readiness-additive/research.md` — re-baselined disposition vs current main
  (merge-base `cc3b8731`; per-file base==main blob comparison; valid/superseded/conflict classes).
- `.llm/tmp/run/jsr-readiness-additive/plan.md` — the plan under evaluation (scope, archetype,
  open-decision sweep, commit slices, risk register, gate set, jsr-audit rubric, deferred scope).

## Protocol
Read and apply:
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md` (the checklist you enforce)
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/harness/archetypes/SCOPE-docs.md` (READMEs/doctrine slices)
- `.agents/skills/jsr-audit/SKILL.md` (publishability rubric on the PLANNED surface)

## Hard criteria
1. **Re-baseline honesty.** Verify the research's central claim — that the umbrella's additive files
   are base==main (zero-conflict) — is plausible / spot-check a few via git (`git diff
   origin/main...origin/release/jsr-readiness -- <path>`). Flag any additive item that actually
   conflicts with main but is planned as clean.
2. **Scope split integrity.** Confirm PR-A contains NO breaking public-surface change (all G1-x
   prod-readiness removals are correctly deferred to PR-B). Any breaking removal smuggled into PR-A
   is a blocking finding.
3. **Plan-Gate checklist.** Every box in `plan-gate.md` must be satisfiable from the plan; name any
   unchecked box.
4. **Gate set adequacy.** The selected gates (check/lint/scoped-fmt/deps:check/arch:check/README
   doc-lint) must actually prove the slices. Flag missing gates (e.g. the arch:check reconcile risk).
5. **jsr-audit.** Confirm PR-A introduces no new slow-type/`any` publish-surface risk and that the
   fresh-ui export additions are publishability-neutral-to-positive.

## Deliverable
Write `.llm/tmp/run/jsr-readiness-additive/plan-eval.md` (verdict + criterion-by-criterion + any
FAIL items with the required fix), and post the verdict + summary as a **PR comment** (this run is
`output=pr-comment`). Emit exactly one verdict: **PASS** or **FAIL_PLAN** per
`verdict-definitions.md`. Do NOT modify the plan or implement anything. Do not churn `deno.lock`.

## SKILL
Activate and follow these repo skills before and during evaluation (read `.agents/skills/<name>/SKILL.md`
directly if no `.claude/skills/<name>/` mirror exists). Be generous:
- `netscript-harness` — PLAN-EVAL protocol, plan-gate, verdict definitions, evaluator separation, run artifacts.
- `jsr-audit` — publishability rubric applied to the planned surface; slow-type / export-surface risks.
- `netscript-doctrine` — package/plugin public-surface rules (fresh-ui export additions, README scope).
- `netscript-deno-toolchain` — `deno doc` / `deno why` to verify surface and dependency claims.
- `netscript-tools` — raw git verification of the base==main re-baseline claim, lock hygiene.
- `rtk` — prefix read-heavy `git`/`grep`/`ls` to cut output tokens.

If a named skill does not exist, note it and proceed — do not block.


Issue/PR title: JSR-readiness — additive valid set (non-breaking, PR-A of 2)

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
- Write /home/runner/work/_temp/openhands/27978098382-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27978098382-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-111/run-27978098382-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 111
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27978098382
