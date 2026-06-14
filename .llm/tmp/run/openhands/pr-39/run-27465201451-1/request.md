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

**PHASE 2 of 2 — DESIGN + PLAN for [5d6 query + server + final surface — RFC 14/16].** Phase-1 research is COMPLETE and committed on this branch (no open markers) — REUSE it, do not re-derive or re-measure.

Authority docs (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d6-plan.md` and the BINDING umbrella `plan.md` in the same dir.

REUSE: `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/research.md` (cite its MEASURE-FIRST numbers) + the committed measurement artifacts in that dir. Do NOT re-run `deno doc --lint` / `deno check` / dry-run.

Resolve in design.md the open design decisions the research handed off: the typed island query bridge design (server-loader -> island-props -> client-hook), the createQueryFactories + createServiceClient Transport seam, the defineFreshApp extension points / alpha-surface protection, the RFC 14 seam audit, and any Questions/blockers for supervisor left open in research.md.

Deliver to `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`: `design.md` (all required sections per handover "Concept of done (PLAN phase)"), `plan.md` (PROPOSED slice lock ≤30 — each slice: files touched + gates + the doc-lint/over-cap/private-type-ref budget it retires), `context-pack.md`, and update `drift.md` (`D-5d6-n`). CRITICAL gate rule (learn from sibling 5d4's FAIL): the plan's fitness-gate table must list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`; gates that do not apply must be marked N/A WITH rationale (not silently omitted); each applicable gate must be mapped to the slice(s) that retire it, and slice numbers in the gate table must match the actual commit-slice lock. plan.md MUST end with: Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger.

WRITE-EARLY: create skeleton design.md + plan.md within your first ~15 actions and append; the workflow auto-commits leftover files on cutoff. Stop exploring at ~55% budget; spend the rest writing the slice lock + gate map.

Output: artifacts committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` with artifact paths + commit hashes, MEASURE-FIRST table, slice count, gate-to-slice map, top decisions/risks, final line `READY FOR PLAN-EVAL`. Do NOT emit any `@openhands-agent` block — the supervisor triggers PLAN-EVAL. Hard rules: PLAN only — zero implementation, no self-eval, no merging, no lockfile changes, no `deno cache --reload`.

Issue/PR title: [5d6] fresh query + server + final surface — RFC 17 bridge, defineFreshApp, RFC 14 seam audit (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27465201451-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27465201451-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27465201451-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27465201451
