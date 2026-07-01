You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3-max output=pr-comment iterations=80 use harness

# PLAN-EVAL — Wave 6 `@netscript/cli` A6-v2 promotion (evaluator session)

You are the **evaluator**. This is a **separate session from the plan generator** — evaluate
independently, do not trust the plan's self-assessment. **Hard stop before any implementation:** you
write exactly one artifact and emit one verdict. **Do not edit `packages/`, configs, lockfiles, or
any file other than `plan-eval.md`.**

## Activate (read first, in this order)
- `.agents/skills/netscript-harness/SKILL.md`
- `.claude/skills/netscript-doctrine/SKILL.md`
- `netscript-cli` skill (read BEFORE judging scaffold/CLI structure claims)
- `.llm/harness/evaluator/plan-protocol.md` ← your protocol
- `.llm/harness/gates/plan-gate.md` ← your checklist (PASS / FAIL_PLAN)
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` + `.llm/harness/gates/archetype-gate-matrix.md`

## Inputs to review (write-artifact-first: open `plan-eval.md` and fill as you go)
- `.llm/tmp/run/feat-package-quality-wave6-cli--research/research.md` (1,609 lines)
- `…/plan.md` (the definitive 7-slice A6-v2 plan)
- `…/worklog.md` (§Design)
- `…/drift.md` (W-1..W-5)
- `…/plan-eval.md` ← **your output skeleton; fill it**

## What to scrutinize hardest
1. **Plan-Gate checklist** — research current; LD-1..LD-8 locked; **open-decision sweep** (the 5
   maintainer Qs — confirm only Q2 is "must resolve now" and is resolved to slice 2; any other
   deferral that would force rework ⇒ FAIL_PLAN); commit slices <30 each naming what-it-proves + gate
   + files; risk register; A6 gate set; deferred scope explicit; jsr-audit (cli publish withheld but
   dry-run green).
2. **A6-v2 layering** — F-CLI-3 (no surface↔surface import; writers under
   `maintainer/features/codegen/`), F-CLI-4 (kernel never imports surfaces), F-CLI-27 (the concrete
   `CliCommandRegistry` actually replaces the hand-wired `public-command-tree.ts`).
3. **The load-bearing slice-2 gate** — is the "merge blocked without green `scaffold.runtime` 41/41"
   constraint actually wired into the plan, and is it sufficient to de-risk R-11/R-15?
4. **Single-file ownership (LD-8)** — confirm Wave 6 and the toolchain run (#44) touch disjoint files
   (`scaffold-files.ts` vs `scaffold-versions.ts`). A collision is a FAIL_PLAN.
5. **AP-1 closure** — does slice 6 provide a real verdict-entry exit path, or is AP-1 left open?

## Output
Fill `…/plan-eval.md` with your checklist verdicts and emit **exactly** `PASS` or `FAIL_PLAN`. On
FAIL_PLAN, list the specific required changes and the cycle number (max 2 cycles, then escalate). Do
**not** start implementation under any circumstance. Commit `plan-eval.md` (LF line endings) and post
your verdict as a PR comment.

PLAN-EVAL COMPLETE — end with the verdict on its own final line.

Issue/PR title: [Wave 6] @netscript/cli — PLAN phase (A6-v2 promotion, closes AP-1)

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
- Write /home/runner/work/_temp/openhands/27536139979-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27536139979-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-43/run-27536139979-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 43
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27536139979
