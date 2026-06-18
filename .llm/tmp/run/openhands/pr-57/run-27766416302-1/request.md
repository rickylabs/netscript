You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=500 use harness

**ROLE: PLAN-EVAL (cycle 1)** — plan-gate evaluator for the `docs/internal-overhaul` group (Group 4, internal/contributor docs) of the `release/jsr-readiness` umbrella. You are a SEPARATE evaluator session — do NOT implement, edit framework code, edit docs, or rewrite the plan. Judge the plan only.

**Context:** docs run (no package archetype; `SCOPE-docs.md` overlay). The IMPL gate (Groups 1+2 merged into the umbrella) is already satisfied. No prior FAIL_PLAN — this is cycle 1. This run consolidates/rewrites internal-doc **content**; deleting dead doc **files** was Group 1's job (PR #54, merged).

**Read first (authoritative protocol):**
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/SCOPE-docs.md` (if present; else the docs overlay referenced by the harness)

**Then read the run (this PR's branch, `docs/internal-overhaul`):**
- `.llm/tmp/run/docs-internal-overhaul--contributor/research.md`
- `.llm/tmp/run/docs-internal-overhaul--contributor/plan.md`
- `.llm/tmp/run/docs-internal-overhaul--contributor/worklog.md` (esp. the `plan & design` Design-checkpoint row)

**Verify each locked decision against the tree (spot-check, do not take the plan's word):**
1. **IO-5 (functional IA, NOT Diátaxis):** confirm the rationale holds — internal docs are reference/procedure for contributors and are already function-organized; Diátaxis is reserved for the Group 3 user site. Confirm this is consistent with `CLAUDE.md` Supervisor Rules and `AGENTS.md` Read Order.
2. **IO-6 (canonical-home rubric):** confirm each home in the rubric maps to a real path — `docs/architecture/doctrine/`, `AGENTS.md`, `.agents/skills/<name>`, `CLAUDE.md`, `.llm/harness/` all exist. The exhaustive concept→home map is deferred to Design; confirm the rubric is deterministic enough to make that map mechanical.
3. **IO-2 (generated mirrors):** confirm `.claude/skills/` is a generated mirror of `.agents/skills/` and that `.llm/tools/agentic/validate-claude-surface.ts` exists and is named as the gate. The plan must NOT hand-edit `.claude/skills/`.
4. **IO-4 / Group-1 coordination (RESOLVED claim):** spot-check that Group 1 (PR #54, merged) deleted only `AGENTS-handoff.md` and that its content was relocated into `.agents/skills/openhands-handoff/SKILL.md` — i.e. confirm `AGENTS-handoff.md` is gone and the skill file exists, so there is no delete-vs-consolidate conflict.
5. **IO-3 (`deno doc` documentation):** confirm the planned `deno doc` doc scope (harness docs + `jsr-audit` skill section: npm-dep rendering, JSX/TSX, npm-without-types workaround, `deno doc --lint` as the publish bar) is concrete.
6. **Gates concrete:** confirm the Fitness Gates + Validation Plan are checkable (`validate-claude-surface.ts` green; internal link/anchor check; `.claude/skills/` regen-diff clean; doc-maintenance gate).
7. **Boundary:** confirm Non-Scope vs Group 3 (user docs) is clean; no framework-code edits; no doctrine-**decision** changes (doc hygiene only).

Also re-confirm the off-limits guardrail PASS (no edits to `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or catalog/`catalog:`).

**Verdict:** write `.llm/tmp/run/docs-internal-overhaul--contributor/plan-eval.md` (the workflow commits it back to the branch). Emit exactly one of **PASS** or **FAIL_PLAN** with specifics. Put the verdict + a one-paragraph rationale in `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow posts the status). No implementation slice may begin before PASS. This is cycle 1 of 2 before escalation.


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
- Write /home/runner/work/_temp/openhands/27766416302-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27766416302-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-57/run-27766416302-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 57
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27766416302
