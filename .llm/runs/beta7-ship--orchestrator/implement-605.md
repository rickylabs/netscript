use harness

# Slice brief — #605: terminal status label for the taxonomy

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`
(canonical label taxonomy home), `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (Claude session `df71d36c`).
  Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1).
- Worktree: `/home/codex/repos/ns-wt-605`, branch `chore/605-terminal-status-label`.
- Push: `git push origin HEAD:refs/heads/chore/605-terminal-status-label`.
- Worklog at `.llm/runs/chore-605-status-label--codex/worklog.md`, committed with the slice.

## Task (issue #605, pilot-eval I4)

Closed issues keep stale phase labels (e.g. `status:plan` on closed #407/#258). Fix the taxonomy:

1. Add `status:shipped` (terminal) to `.github/labels.yml` with a description that says it replaces
   the phase label at close; pick a distinct terminal color.
2. Update the netscript-pr skill (`.agents/skills/netscript-pr/SKILL.md` — and check whether
   `.claude/skills/netscript-pr` is a generated mirror; if so regenerate via the documented tool,
   never hand-edit the mirror) with the close-time rule: exactly one `status:` at all times;
   closing an issue swaps the phase label for `status:shipped` (or removes status entirely if the
   close is not-planned/wontfix — document the chosen rule).
3. If a label-sync workflow/tool applies `.github/labels.yml` to the repo, note in the worklog how
   sync happens (do not run repo-wide label mutations yourself; the orchestrator owns that).
4. Grep for other places that enumerate the status taxonomy (validation tools, close-gate) and
   update them consistently.

## Validation (evidence in worklog)

- `.github/labels.yml` parses (yaml lint or the repo's labels validation if one exists).
- Any taxonomy-enumerating tests still green; scoped lint on touched roots.
- `.llm/tools/agentic/claude/validate-claude-surface.ts` if `.claude/skills` mirror changed.

## Done means

Label + doctrine rule + consistent enumerations landed, committed + pushed, worklog updated.
Report "DONE" or "BLOCKED: <why>".
