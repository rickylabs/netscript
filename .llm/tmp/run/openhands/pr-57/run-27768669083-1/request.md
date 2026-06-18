You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=500 use harness

**ROLE: PLAN-EVAL (cycle 2 of 2)** — plan-gate evaluator for the `docs/internal-overhaul` group (Group 4, internal/contributor docs) of the `release/jsr-readiness` umbrella. You are a SEPARATE evaluator session — do NOT implement, edit framework code, edit docs, or rewrite the plan. Judge the plan only.

**Context:** This is the **cycle-2** re-evaluation after a single-box `FAIL_PLAN` in cycle 1 (your verdict `plan-eval.md`, run `27766416302-1`). Cycle 1 PASSED 7 of 8 Plan-Gate boxes; the **only** FAIL was **"Commit slices (< 30, gate + files each)"** — the plan had Fitness Gates / Validation Plan / Risk Register but no `## Commit Slices` enumeration. All locked decisions (IO-2…IO-6), boundary, off-limits guardrail, risk register, gate set, and deferred-scope boxes were VERIFIED. Branch tip is now `565e672b`.

**The remediation under review (the ONLY change since cycle 1):**
- `plan.md` gained a **`## Commit Slices`** section: an ordered S0–S8 table; each slice names (a) **what it proves**, (b) the **proving gate** (drawn from the existing Fitness Gates table — keyed G-surface / G-mirror / G-links / G-doctrine), and (c) the **path-level files** it touches. A preamble ties authoring to **LD-DOCS-LANE** (Claude-workflow per-domain authoring; OpenHands validates per-domain) and re-states the off-limits guardrails.
- `plan.md` header + `## Dependencies` updated to record the cycle / lane.
- `worklog.md` gained cycle-1 FAIL + remediation rows.

**Read first (authoritative protocol):**
- `.llm/harness/gates/plan-gate.md` (the "Commit slices" row in particular)
- `.llm/harness/workflow/run-loop.md` §3b item 5
- `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`

**Then read the run (branch `docs/internal-overhaul` @ `565e672b`):**
- `.llm/tmp/run/docs-internal-overhaul--contributor/plan.md` (esp. the new `## Commit Slices`)
- `.llm/tmp/run/docs-internal-overhaul--contributor/worklog.md`
- your own cycle-1 `.llm/tmp/run/docs-internal-overhaul--contributor/plan-eval.md`

**Judge, narrowly:**
1. **Commit slices box (the failed box):** confirm `## Commit Slices` exists, is ordered, < 30 entries, and each slice names what-it-proves + a proving gate (from the Fitness Gates table) + path-level files. Confirm the slices cover the plan's named scope (harness `deno doc` doc, `jsr-audit` skill section, canonical-home/duplication map, doctrine ref, `.llm/` tooling/agentic doc, root ops, doc-maintenance gate) and that each gate cited is real.
2. **No regression:** confirm the remediation did **NOT** change any locked decision (IO-2…IO-6), the scope/non-scope, the gate set, or the risk register. The slice list must be a faithful decomposition of the already-VERIFIED plan, not new scope. Spot-check that no slice edits framework code, deletes doc *files*, changes a doctrine *decision*, or hand-edits `.claude/skills/`.
3. Re-confirm the off-limits guardrail PASS (no edits to `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or catalog/`catalog:`).

**Verdict:** overwrite `.llm/tmp/run/docs-internal-overhaul--contributor/plan-eval.md` (the workflow commits it back). Emit exactly one of **PASS** or **FAIL_PLAN** with specifics. Put the verdict + a one-paragraph rationale in `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow posts the status). No implementation slice may begin before PASS. **This is cycle 2 of 2** — a second `FAIL_PLAN` escalates to the user.


Issue/PR title: docs(internal-overhaul): consolidate contributor/harness docs + document deno doc (Group 4)

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
- Write /home/runner/work/_temp/openhands/27768669083-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27768669083-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-57/run-27768669083-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 57
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27768669083
