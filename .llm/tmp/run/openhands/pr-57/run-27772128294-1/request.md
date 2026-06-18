You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500 use harness

## ROLE — IMPL-EVAL (final pass, Group 4 internal/contributor docs)

You are the **IMPL-EVAL** evaluator for `docs/internal-overhaul` (Group 4 of the `release/jsr-readiness` umbrella). This is a **separate evaluator session** from the generator (the docs were authored by a Claude dynamic workflow under the harness SKILL; you validate — never self-certify the generator's work). Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`, then the run artifacts on this branch: `plan.md`, `worklog.md`, `commits.md`, `drift.md`, and the Fitness Gates + `## Commit Slices` table in `plan.md`.

**Branch tip to evaluate:** `7a8b1c38` (docs/internal-overhaul).

### What landed (8 commits, one per slice + bookkeeping)

| Slice | Commit | Domain | Files |
|-------|--------|--------|-------|
| S1 | `17f658ed` | `deno doc` in jsr-audit | `.agents/skills/jsr-audit/SKILL.md` (+ regenerated mirror) |
| S2 | `ade81736` | `deno doc` in harness | `.llm/harness/tools-and-commands.md` (new) + `run-loop.md` pointer |
| S3 | `95b14136` | canonical-home de-dup | `AGENTS.md` + `.agents/skills/netscript-harness/SKILL.md` (+ mirror) |
| S4 | `b7baca34` | doctrine ref tidy | `.llm/harness/README.md` + doctrine `01`/`04` (dead-link de-link only) |
| S5 | `8073bb57` | `.llm/` tooling home | `.llm/tools/README.md` |
| S6 | `ad6d559f` | root-ops coherence | `README.md` + `CONTRIBUTING.md` |
| S7 | `42da427b` | doc-maintenance gate E1 | `check-internal-doc-links.ts` (new) + `deno.json` + `static-gates.md` |
| — | `6ae41fc3`/`7a8b1c38` | bookkeeping | worklog + arch-debt + commits.md |

### Supervisor-run gate evidence (re-verify, don't trust)

- **G-mirror** `deno task agentic:sync-claude:check` → PASS (17 skills OK; `.claude/skills/` regenerated from `.agents/skills/` for jsr-audit + netscript-harness).
- **G-surface** `deno task agentic:check-claude` → PASS (CLAUDE.md @AGENTS.md, settings JSON, gitignore, mirror, hook-lock all OK).
- **G-links** `deno task docs:links` → 26 broken links, **all pre-existing in the unrelated `impeccable` authoring skill** (`reference/*.md` never added). Group-4-owned surface (harness/doctrine/`.llm`/`AGENTS`/`CLAUDE`/root-ops) is link-clean; the doctrine `phase-0-research` links were fixed by S4.

### Required: per-domain verdict table

Emit a **per-slice (S1–S7) verdict** (PASS / FAIL) plus an overall verdict (`PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`). For each slice check it satisfies its proving gate and its `## Commit Slices` contract, honors locked decisions **IO-1…IO-6**, and crosses **no off-limits boundary** (no `packages/`/`plugins/` source; no doctrine *decision* text changed — S4 must be link/reference only; no hand-edited `.claude/skills/` mirror; no doc files deleted).

### Open question for you to rule on (the one known issue)

`deno task docs:maintenance` (the S7 composite) is currently **RED solely** because of the 26 pre-existing `impeccable`-skill dead links — recorded as arch-debt `impeccable-dead-reference-links`, outside Group 4's file scope. Rule on the resolution: **(a)** scope `check-internal-doc-links.ts` to exclude the incomplete vendored `impeccable` skill (supervisor's recommendation), **(b)** fix/prune `impeccable` in a follow-up slice, or **(c)** accept as recorded debt and gate only Group-4-owned surfaces. State which, and whether it blocks PASS.

### Constraints

Preserve lock hygiene — do **not** commit `deno.lock` or source churn unless a reviewed fix requires it. Do not change locked decisions. Report raw command output for any gate you re-run. Two `FAIL_*` cycles then escalate.


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
- Write /home/runner/work/_temp/openhands/27772128294-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27772128294-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-57/run-27772128294-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 57
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27772128294
