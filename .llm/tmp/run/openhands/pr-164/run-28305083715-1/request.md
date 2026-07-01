You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=500

use harness

**PLAN-EVAL cycle 2** for `chore/release-one-shot` (PR #164). You are a SEPARATE evaluator session
from the plan author — do NOT implement. Cycle 1 was `FAIL_PLAN` with a single blocker (D3); the plan
author has revised. Read the updated plan and emit exactly one verdict: `PASS` or `FAIL_PLAN`.

## SKILL
- `netscript-harness` — controlling skill; load `.llm/harness/evaluator/plan-protocol.md` +
  `gates/plan-gate.md`; preserve evaluator separation. This is PLAN-EVAL only.
- `netscript-tools` — `.llm/tools/` release tooling + gate-evidence approach.
- `netscript-deno-toolchain` — toolchain claims (deno ci, bump-version, dry-run, catalog law).
- `jsr-audit` — D3 encodes the "text imports, never readTextFile" locked rule against the publish surface.
- `netscript-pr` — branch/PR/commit mechanics.

## What changed since cycle 1 (focus here)
Read `.llm/tmp/run/chore-release-one-shot--tooling/plan.md` — the revision banner + **D3 (REVISED
cycle 2)**, plus the folded clarifications in D4 (artifact version handoff), D5 (`agentic:sync-claude`),
D2 (exact edit sites), S2 wording, and the Risks section. `research.md` is unchanged.

The cycle-1 verdict (D1/D2/D4/D5/D6 + scope/lane/slices/gates = PASS) stands unless the revision broke
something. Concentrate the pass on:

1. **D3 narrowing:** Confirm the pattern set is now ONLY `Deno.readTextFile(`/`Deno.readFile(` and that
   `fromFileUrl(`/`import.meta.resolve(`/bare `new URL(...,import.meta.url)` are dropped → no longer
   produces the ~21 constructor false-positives you found.
2. **D3 cross-line coverage:** Confirm the two-pass resolver (pass 1 collect `const x = new URL(<lit>,
   import.meta.url)`; pass 2 flag `Deno.readTextFile(x)`/`readFile(x)` + inline form) actually catches
   the `openapi.ts:29 → :155` break class, and that the required positive fixture mirrors it. Any
   residual miss class? (Verify the openapi.ts:29/155 line refs still hold on the branch.)
3. **Clarifications folded correctly:** D4 artifact (`version.txt` upload/download keyed on
   `workflow_run.id`) is non-racy and preserves `workflow_dispatch`; D5 uses `agentic:sync-claude`
   (+ `:check`) instead of hand-mirroring; D2 names `prod-install.ts:28`/`:6-7` + `README.md:99`.
4. Nothing else regressed (gates still complete; slices still independently committable).

## Output
Append/overwrite `.llm/tmp/run/chore-release-one-shot--tooling/plan-eval.md` with the cycle-2 verdict
(`PASS`/`FAIL_PLAN`), D3 re-assessment, and the run id. Post the `pr-comment` summary. This is cycle 2
of 2 — a second FAIL escalates. Do not commit source changes; plan evaluation only.


Issue/PR title: chore(release): one-shot deterministic release automation (plan) — #147

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
- Write /home/runner/work/_temp/openhands/28305083715-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28305083715-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-164/run-28305083715-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 164
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28305083715
