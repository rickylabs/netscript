You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1000 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh

**PHASE 2 of 2 — DESIGN + PLAN for [5d1 support spine — error taxonomy + telemetry convention].** Phase-1 research is COMPLETE and committed on this branch (368 lines, no open measurement TODOs) — REUSE it, do not re-derive or re-measure.

Authority docs (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d1-plan.md` and the BINDING umbrella `plan.md` in the same dir.

REUSE: `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md` (cite its MEASURE-FIRST numbers — 113-combined doc-lint context, 25 missing-JSDoc symbols, 14 private-type-ref leaks of which 6 are in-scope, F-1 cap 500/800 LOC) + committed measurement artifacts. Do NOT re-run `deno doc --lint` / `deno check` / dry-run.

The research left explicit DESIGN decisions to make (resolve them in design.md): (1) the single cross-cutting telemetry convention reconciling `defer/telemetry.ts` vs `form/telemetry.ts`; (2) telemetry module location `telemetry.ts` vs `_internal/telemetry.ts` (confirm vs doctrine A8/AP-16); (3) `components/` dissolution target path + import migration map; (4) JSDoc remediation order for the 25 symbols; (5) the 6 in-scope private-type-ref fixes; (6) whether to drop `defer/` root re-exports now or defer to 5d4.

Deliver to `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/`: `design.md` (all required sections per handover "Concept of done (PLAN phase)"), `plan.md` (PROPOSED slice lock ≤30 — each slice: files touched + gates + the doc-lint/over-cap/private-type-ref budget it retires; map EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md` to a slice), `context-pack.md`, and update `drift.md` (`D-5d1-n`). plan.md MUST end with: Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger.

WRITE-EARLY: create skeleton design.md + plan.md within your first ~15 actions and append; the workflow auto-commits leftover files on cutoff. Stop exploring at ~55% budget; spend the rest writing the slice lock + gate map.

Output: artifacts committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` with artifact paths + commit hashes, MEASURE-FIRST table, slice count, gate-to-slice map, top decisions/risks, final line `READY FOR PLAN-EVAL`. Do NOT emit any `@openhands-agent` block — the supervisor triggers PLAN-EVAL. Hard rules: PLAN only — zero implementation, no self-eval, no merging, no lockfile changes, no `deno cache --reload`.

Issue/PR title: [5d1] fresh support spine — error · utils · vite config · interactive · mod skeleton (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27464673888-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27464673888-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-34/run-27464673888-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 34
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27464673888
