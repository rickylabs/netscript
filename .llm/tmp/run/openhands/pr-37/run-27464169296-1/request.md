You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit

**PLAN-EVAL (re-eval #3) — independent evaluator session for [5d4 defer + streams — PSR/RFC 13 + e2e telemetry].** The PLAN generator committed a revised `plan.md` (+ `design.md`, `research.md`, `context-pack.md`) to `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/` on this branch. You are the INDEPENDENT evaluator — you did not write these. NOTE: `plan-eval.md` from prior cycles was deleted on the branch; recreate it fresh.

This is the 2→3 revision cycle. The first eval raised FOUR blockers; the clock-port one is RESOLVED (L-5d4-7, supervisor-locked — accept it). Verify whether the revision resolved the OTHER THREE. Be specific and binary on each:

1. **Archetype-3 gate coverage (18 gates).** Read `.llm/harness/gates/archetype-gate-matrix.md` Archetype-3 row. Does plan.md map ALL required gates to slices? Count the gates actually mapped vs required. (The plan's "Fitness Gates" table currently lists 8 F-series gates — confirm whether that satisfies the archetype's full required set or leaves gates unmapped.)
2. **Doc-lint budget (113 errors).** Does the plan assign named doc-lint error buckets across the commit slices that sum to EXACTLY 113, reconciled against the committed `deno-doc-lint*` artifacts? Or is doc-lint handled only by a generic "doc sweep" slice with no arithmetic?
3. **jsr-audit publishability scan.** Was `deno publish --dry-run` actually RUN, with results recorded and a committed artifact, and each finding assigned to a slice? Or is it only referenced as a future validation step?

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`), and `handover-5d4-plan.md`.

Output: commit `plan-eval.md` to the run dir with a binary PASS/FAIL on EACH of the three blockers above + gate-by-gate findings. Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` followed by which of the 3 blockers remain. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d4] fresh defer + streams — PSR (RFC 13) + e2e streams (RFC 16) (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27464169296-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27464169296-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-37/run-27464169296-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 37
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27464169296
