You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=800 use harness

**ROLE: PLAN-EVAL** (plan-gate evaluator) for the `chore/deps-hygiene` group of the `release/jsr-readiness` umbrella. You are a SEPARATE evaluator session — do NOT implement, edit framework code, restructure the catalog, or rewrite the plan. Judge the plan only.

**Read first (authoritative protocol):**
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md`
- `.llm/harness/evaluator/verdict-definitions.md`

**Then read the run (this PR's branch, `chore/deps-hygiene`):**
- `.llm/tmp/run/chore-deps-hygiene--deps/research.md`
- `.llm/tmp/run/chore-deps-hygiene--deps/plan.md`
- `.llm/tmp/run/chore-deps-hygiene--deps/worklog.md` (especially the `## Design` section)
- `.llm/tmp/run/chore-deps-hygiene--deps/drift.md` (note: D-G2-1 is SUPERSEDED by D-G2-2 — read D-G2-2)
- the relevant archetype profile + `.llm/harness/debt/arch-debt.md`

**Task (follow plan-protocol.md exactly):**
1. Walk the Plan-Gate checklist box-by-box; mark each pass/fail with concrete evidence.
2. Open-decision sweep: every open question in `research.md` must be RESOLVED or explicitly deferred with rationale.
3. Confirm the slice list is ordered, each slice is small (single concern, < ~30 LOC), and each names its proving gate + the files it touches.
4. **CRITICAL load-bearing spot-check for this group** — drift entry D-G2-2 asserts the npm catalog IS live: workspace members declare npm deps as a `catalog:` value in their `package.json` (the Deno 2.8 `catalog:` protocol), resolved against the root `deno.json` `catalog` block — NOT via member `deno.json`. Verify this directly in the tree: grep `package.json` under `plugins/*` and `packages/*` for dependency values equal to `catalog:`, and confirm the root `deno.json` `catalog` block defines those versions. Then confirm the planned npm-catalog-compliance scanner enforces that LIVE invariant (flagging inline `npm:` pins where a `catalog:` ref is required — e.g. `npm:amqplib@^0.10.3` in the `queue` adapter — and stale catalog entries). Confirm JSR deps stay inline `jsr:` per member (Deno has no JSR catalog) and the JSR-centralization scanner is a report→FAIL gate. Confirm NOTHING in the plan de-catalogs, edits version pins, or touches `scaffold-versions.ts`, and that every scanner lands report-only before flipping to FAIL (no CI false-positive lockout).

**Verdict:** write `.llm/tmp/run/chore-deps-hygiene--deps/plan-eval.md` (the workflow commits it back to the branch). Emit exactly one of **PASS** or **FAIL_PLAN** with specifics. Put the verdict + a one-paragraph rationale in `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow posts the status). No implementation slice may begin before PASS.

Issue/PR title: chore/deps-hygiene — dependency-shape tooling (Group 2 of release/jsr-readiness)

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
- Write /home/runner/work/_temp/openhands/27755191977-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27755191977-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-55/run-27755191977-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 55
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27755191977
