You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1000 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PHASE 2 COMPLETION — DESIGN + PLAN for [5d3 route — manifest + contract runtime].** A prior phase-2 run committed the section structure but hit its iteration budget, leaving `design.md` and `plan.md` as TODO skeletons (every body is "TODO."). Your ONLY job: FILL every TODO in both files with real content. Phase-1 research is COMPLETE and committed — REUSE it; do NOT re-run measurements.

Authority docs (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d3-plan.md` and the BINDING umbrella `plan.md` in the same dir.

REUSE (do not redo): `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/research.md` + the committed measurement artifacts in that dir (`deno-doc-lint.txt`, `deno-doc-lint-raw.txt`, `deno-doc-route.json`, `dry-run-raw.txt`). Cite their numbers; do NOT re-measure.

FILL `plan.md`: the MEASURE-FIRST table (from the committed artifacts), the Slice lock (≤30 slices — each slice: files touched + gates + the doc-lint/over-cap budget it retires), Review map, Assumptions, Questions for supervisor, Dependencies & merge impact, Side-effect ledger. FILL `design.md`: all required sections (decomposition, public-surface verdicts, manifest/contract-runtime seams, RFC alignment) per handover §"Concept of done (PLAN phase)". Per-slice gates must collectively cover EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md` — map each required gate to the slice that satisfies it.

WRITE-EARLY: edit design.md + plan.md in place and save after each section you fill; the workflow auto-commits leftover files on cutoff. Keep `drift.md` (`D-5d3-n`) current. Stop exploring at ~55% budget; spend the rest writing.

Output: design.md + plan.md with ZERO remaining TODO markers + updated drift.md committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` with the MEASURE-FIRST table, slice count, gate-to-slice map, top decisions/risks, final line `READY FOR PLAN-EVAL`. Do NOT emit any `@openhands-agent` block. Hard rules: PLAN only — zero implementation, no self-eval, no merging, no lockfile changes, no `deno cache --reload`.

Issue/PR title: [5d3] fresh route — manifest + contract runtime (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27464169182-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27464169182-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-36/run-27464169182-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 36
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27464169182
