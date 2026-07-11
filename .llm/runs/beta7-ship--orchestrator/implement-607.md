use harness

# Slice brief — #607: close-gate ergonomics — mirror PR gate evidence into issue checkboxes

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`
(close-gate section is canonical), `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (`df71d36c`). Do NOT open PRs.
  **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-607`, branch `feat/607-close-gate-evidence-mirror`.
- Push: `git push origin HEAD:refs/heads/feat/607-close-gate-evidence-mirror`.
- Worklog at `.llm/runs/feat-607-close-gate-mirror--codex/worklog.md`, committed with the slice.

## Task (issue #607, pilot-eval I7/D4)

close-gate correctly blocks merges on unchecked issue acceptance boxes, but evidence usually lands
in the PR; today a supervisor manually PATCHes the issue body. Keep the verified-acceptance
property, remove the manual step:

1. Study the current close-gate implementation (`.llm/tools/validation/check-close-gate.ts` + the
   CI workflow job that runs it) before designing.
2. Implement an evidence-mirroring path. Preferred shape (adapt if study shows a better fit):
   a structured `## Acceptance evidence` PR comment/body section with per-box lines
   (`- [x] <verbatim issue box text> — <evidence>`), and a repo tool
   (`.llm/tools/validation/mirror-acceptance-evidence.ts`) that validates the mapping (every
   unchecked issue box has a matching evidence line, verbatim text match) and PATCHes the issue
   body boxes + posts a provenance comment linking the PR. Wire it as an opt-in CI step or a
   labeled action (e.g. on `status:ready-merge`), whichever composes with the existing close-gate
   job — close-gate itself must still independently verify the boxes (no self-bypass: the mirror
   ticks boxes only from structured evidence, close-gate still gates on the issue state).
3. Unit-test the mapping/validation logic (mismatched text, extra boxes, already-ticked boxes,
   umbrella issues with no closing keyword must be untouched).
4. Update the netscript-pr skill's close-gate section with the new flow (source `.agents/skills/`,
   regenerate the `.claude/skills/` mirror via the documented tool; never hand-edit the mirror).

## Validation (evidence in worklog)

- Scoped check/lint on touched roots; `deno test` for new tests; existing validation-tool tests
  green. If you add/modify a workflow, `actionlint`-style validation if available in-repo,
  otherwise careful YAML review noted in the worklog.
- Do NOT run repo-wide mutations against live issues; demo the tool in --dry-run against a real
  PR/issue pair and paste the output.

## Done means

Tool + wiring + tests + skill update committed and pushed, worklog committed.
Report "DONE" or "BLOCKED: <why>".
