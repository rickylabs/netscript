You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=120 use harness

ROLE: **Scorecard exit-gate evaluator** for the `release/jsr-readiness` umbrella (PR #53 → main). You are the **separate evaluator session** that OWNS the PASS/FAIL verdict. The supervisor has NOT graded this — do not trust any supervisor/generator self-report. Grade only on raw evidence you verify on the umbrella tip.

UMBRELLA TIP UNDER TEST: PR #53 head (currently `b19b180a` — the only change since the last green CI is removal of `.llm/tmp/init-json-smoke/` scratch; no source/packages/plugins change). Compare against `origin/main`.

⚠️ ITERATION BUDGET — a prior run of this exact task hit the iteration limit (50) and produced NO verdict. Be economical and verdict-first:
- **Do NOT re-run the expensive gates from scratch.** CI already ran them as independent raw evidence on this tip. **CITE green CI run `27795718861`** (jobs `check-test` = `deno task check` + `deno task test`; `quality` = `deno task fmt:check` + the D1/D2/D3 scanners; `deps-report`). If that run is green, treat check-test / quality / deps-report dimensions as evidenced — confirm the run is on the PR #53 head SHA and conclusion=success, then move on. Do NOT run `deno task test`/`check`/`fmt:check` yourself.
- Spend your iterations ONLY on what CI does not cover: **A1, B1, D-arch:check, F1**, plus reading the A2/A3/sub-run-ledger evidence files.
- **Front-load the VERDICT line and the blocker list EARLY**, then elaborate. If you sense you are running low on iterations, WRITE THE VERDICT COMMENT IMMEDIATELY.

READ: `.llm/tmp/run/release-jsr-readiness--supervisor/scorecard.md` (dimensions A–F + exit rule) and `scorecard-status-2026-06-18.md` (prior evidence + the two blockers just fixed). Skim `.agents/skills/jsr-audit/SKILL.md` + `.llm/harness/evaluator/protocol.md`.

CONTEXT — two prior blockers + fixes (verify genuinely resolved, do not assume):
1. **check-test regression** (`: unknown` fresh-ui JSX): #58's A1 fix had rewritten 7 interactive runtime components to `(props: unknown): unknown`, satisfying `deno doc --lint` but breaking valid JSX + the consumer-render guard. Fix landed (7c29de5 restored prop surface via `_internal/public-props.ts` + 578883d). Verify via the GREEN CI `check-test` job (do not re-run) that A1 doc-lint AND test are green TOGETHER — A1 not satisfied at the cost of check-test.
2. **quality fmt drift**: formatting-only Codex slice (6350b544 + 53047555) greened `fmt:check` over packages/plugins TS. Verify via the GREEN CI `quality` job; the diff was formatting-only.

VERIFY YOURSELF (CI does not cover these — this is where your iterations go):
- **A1** — For each library unit, run `deno doc --lint` over the unit's **FULL export map** (not root mod.ts alone — sibling re-exports must be linted or they false-flag/mask). 0 warnings. Confirm reference docs meet the standardized template. (Memory: lint the full export set, not mod.ts alone.)
- **B1** — `deno task publish:dry-run` passes with **0 slow types** for the canonical **25-unit** simulation. FLAG the F-wave blind spot: the batch dry-run does NOT simulate `@netscript/cli`; cli's own `deno publish --dry-run` must run at F dispatch. Confirm the `: unknown` removal introduced no slow types.
- **D1/D2/D3 + arch wiring** — run `deno task arch:check`. Confirm JSR-version-drift scanner (0 drift), npm catalog-compliance (0 inline-pin violations), 0 `file:`/`link:` specifiers in publishable units, AND all three wired into CI `quality` + `arch:check`.
- **F1** — `deno run ... .llm/tools/agentic/validate-claude-surface.ts` green; `deno doc` documented in harness + jsr-audit skills; internal/contributor docs consolidated/prod-ready.

CONFIRM BY EVIDENCE READ (do not re-derive):
- **A2** — every library unit's README meets the standard (structure + threshold + doctested examples). Cross-check the #56 IMPL-EVAL 26/26 claim against the tip; spot-check 2–3 READMEs.
- **A3** — Diátaxis onboarding doc set builds with Lume → GitHub Pages, deploys green. Evidence in scorecard-status (Pages deploy run 27790127099 + live HTTP 200s) — confirm still valid; one live curl is enough.
- **C1** — zero dead code/temp cruft/stray root files; compat shims removed; `AGENTS-handoff.md` relocated; dead doc files deleted. (NOTE: the init-json-smoke scratch was just removed — confirm `.llm/tmp/init-json-smoke/` is gone.)
- **D4/D5** — `deno task` set pruned to production tasks; version-bump tooling is a thin wrapper over `deno bump-version` with structured output.
- **E1/E2** — doc-maintenance + doc-freshness fitness gates wired into the harness gate set.
- **SUB-RUN LEDGER** — confirm each shows plan-eval.md=PASS AND evaluate.md=PASS, no open FAIL_*: #54/#55 (C/D), #56 (F + A2 READMEs), #57 (A user-docs), #58 (A1 fresh-ui). No unresolved `architectural` drift.

OUTPUT — structured verdict comment:
- **VERDICT line FIRST**: `SCORECARD: PASS` (all dimensions A–F satisfied, program-level exit gate met, ready for the user to dispatch publish) or `SCORECARD: FAIL` (with the exact failing dimension(s) + evidence).
- Per-dimension table (A1/A2/A3/B1/C1/D1–D5/E1/E2/F1): PASS/FAIL + one-line evidence (cite CI run/job or your command output).
- Also write the full verdict to `.llm/tmp/run/release-jsr-readiness--supervisor/scorecard-eval-2026-06-19.md` and commit it to this branch.

HARD CONSTRAINTS:
- **Do NOT publish** anything to JSR. **Do NOT merge** PR #53. You are the gate, not the trigger.
- Do NOT edit `packages/`, `plugins/`, version pins, `scaffold-versions.ts`, `aspire/src/public/mod.ts`, the catalog, or lock files. Do NOT run `deno cache --reload`. Verification is read-only + the named gate commands.
- The verdict is yours alone; never echo a supervisor grade.

Report the workflow run's exit status and a one-line summary: PASS/FAIL + the single most important finding.


Issue/PR title: release/jsr-readiness — JSR publishing-readiness program (umbrella, draft)

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
- Write /home/runner/work/_temp/openhands/27795888733-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27795888733-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-53/run-27795888733-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 53
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27795888733
