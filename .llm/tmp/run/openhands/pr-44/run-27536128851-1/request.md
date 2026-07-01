You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3-max output=pr-comment iterations=80 use harness

# PLAN-EVAL — Deno 2.8 + Aspire 13.4 toolchain upgrade (evaluator session)

You are the **evaluator**. This is a **separate session from the plan generator** — evaluate
independently, do not trust the plan's self-assessment. **Hard stop before any implementation:** you
write exactly one artifact and emit one verdict. **Do not edit `packages/`, configs, lockfiles, or
any file other than `plan-eval.md`.**

## Activate (read first, in this order)
- `.agents/skills/netscript-harness/SKILL.md`
- `.claude/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/aspire/SKILL.md`
- `.llm/harness/evaluator/plan-protocol.md` ← your protocol
- `.llm/harness/gates/plan-gate.md` ← your checklist (PASS / FAIL_PLAN)
- `.llm/harness/gates/archetype-gate-matrix.md`

## Inputs to review (write-artifact-first: open `plan-eval.md` and fill as you go)
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/research.md`
- `…/plan.md` (the definitive Phase T + Phase A plan)
- `…/phase-p-jsr-alpha-publish-plan.md` (the in-between JSR alpha.0 publish milestone)
- `…/worklog.md` (§Design)
- `…/drift.md` (D-1..D-5)
- `…/plan-eval.md` ← **your output skeleton; fill it**

## What to scrutinize hardest
1. **Plan-Gate checklist** — research current; LD-1..LD-9 locked; **open-decision sweep** (each item
   "safe to defer" or "must resolve now"; any deferred decision that would force rework ⇒ FAIL_PLAN);
   commit slices <30 each naming what-it-proves + gate + files; risk register; gate set; deferred
   scope explicit; jsr-audit surface scan for the Phase P publish set.
2. **The D-1/D-2 premise** — is it true that the Aspire bump lands in CLI scaffold constants
   (`scaffold-versions.ts`), not `dotnet/`? Verify against the repo. If false, the whole plan shape
   is wrong ⇒ FAIL_PLAN.
3. **Single-file ownership (LD-8)** — confirm this run and Wave 6 (#43) touch disjoint files. A
   collision is a FAIL_PLAN.
4. **E-12 preview guard (LD-7)** — is the decoupled-default / coupled-fallback fork sound and is the
   no-preview assertion implementable?
5. **Phase ordering** — does Phase P correctly depend on Phase T Slice 0 + the aspire-barrel fix?

## Output
Fill `…/plan-eval.md` with your checklist verdicts and emit **exactly** `PASS` or `FAIL_PLAN`. On
FAIL_PLAN, list the specific required changes and the cycle number (max 2 cycles, then escalate). Do
**not** start implementation under any circumstance. Commit `plan-eval.md` (LF line endings) and post
your verdict as a PR comment.

PLAN-EVAL COMPLETE — end with the verdict on its own final line.

Issue/PR title: [Toolchain] Deno 2.8.x + Aspire 13.4.x upgrade — PLAN phase

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
- Write /home/runner/work/_temp/openhands/27536128851-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27536128851-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-44/run-27536128851-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 44
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27536128851
