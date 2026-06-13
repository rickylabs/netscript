You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1200 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PHASE 2 COMPLETION — WRITE design.md + plan.md for [5d6 query + server + final surface — RFC 14/16].** A prior design+plan run did ALL the measurement work and committed it, then hit its iteration budget WITHOUT writing the two deliverables. `design.md` and `plan.md` DO NOT EXIST yet on this branch — your job is to CREATE and fully write both. Phase-1 research is COMPLETE — REUSE it; do NOT re-run any measurement.

Authority docs (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d6-plan.md` and the BINDING umbrella `plan.md` in the same dir.

REUSE (do NOT redo — cite their numbers): in `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`:
- `research.md` (430 lines, complete) — the MEASURE-FIRST baseline.
- `doc-lint-aggregate.json` + the per-module `doc-lint-*.log` files (note: `query/mod.ts` is the largest doc-lint surface ~83KB of findings; `config/vite.ts` ~38KB; `form`/`defer`/`streams` ~28-32KB each).
- `dry-run.log` (jsr publish dry-run output, ~38KB).
- `drift.md` (existing `D-5d6-n` entries) — keep current.
Do NOT re-run `deno doc --lint`, `deno check`, or `deno publish --dry-run`.

Resolve in design.md the open design decisions: the typed island query bridge (server-loader -> island-props -> client-hook), the `createQueryFactories` + `createServiceClient` Transport seam, the `defineFreshApp` extension points / alpha-surface protection, the RFC 14 seam audit, and any Questions/blockers for supervisor left open in research.md.

Deliver to `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`: `design.md` (all required sections per handover "Concept of done (PLAN phase)") and `plan.md` (PROPOSED slice lock ≤30 — each slice: files touched + gates + the doc-lint/over-cap/private-type-ref budget it retires). CRITICAL gate rule (sibling 5d4 FAILED on this): the plan's fitness-gate table must list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`; gates that do not apply are marked N/A WITH rationale (never silently omitted); each applicable gate mapped to the slice(s) that retire it; slice numbers in the gate table MUST match the actual commit-slice lock (no off-by-one). plan.md MUST end with: Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger.

WRITE-EARLY (the prior run's failure mode — do NOT repeat it): your FIRST ~10 actions must create `design.md` and `plan.md` as section skeletons, then append content section-by-section, saving after each. The workflow auto-commits whatever exists on cutoff. Do NOT spend budget re-reading the whole package — the measurements are already done. Aim to have both files substantially complete by ~60% budget.

Output: design.md + plan.md (ZERO TODO markers, full tail sections) + updated drift.md committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` with artifact paths + commit hashes, MEASURE-FIRST table (from committed artifacts), slice count, gate-to-slice map, top decisions/risks, final line `READY FOR PLAN-EVAL`. Do NOT emit any `@openhands-agent` block — the supervisor triggers PLAN-EVAL. Hard rules: PLAN only — zero implementation, no self-eval, no merging, no lockfile changes, no `deno cache --reload`.

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
- Write /home/runner/work/_temp/openhands/27467331167-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27467331167-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27467331167-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27467331167
