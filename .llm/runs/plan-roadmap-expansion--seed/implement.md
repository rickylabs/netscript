# Implementation Prompt: <target>

Use this prompt for the generator session.

## Required Reading

1. `.llm/harness/workflow/run-loop.md` — especially § 3b (Design checkpoint) and § 5 (Implement, incl.
   the per-slice commit trail).
2. Selected archetype profile (read its **Design Checkpoint Expectations** and **Concept of Done**
   sections).
3. `.llm/harness/gates/archetype-gate-matrix.md`
4. `.llm/runs/<run-id>/plan.md`
5. `.llm/runs/<run-id>/context-pack.md` if present

## First Act: Design Checkpoint

Before creating implementation files, fill the `## Design` section in `worklog.md`. This is
mandatory. The evaluator will verify the design section exists and that commit slices follow it. See
`workflow/run-loop.md` § 3b for the required structure.

## Operating Rules

- Implement only the approved scope.
- Follow the Design checkpoint's commit slices in order.
- Run each slice's named gate before committing.
- Apply the Concept of Done checklist (run-loop § 5) to each slice.
- Append `drift.md` when facts differ from the plan or doctrine.
- After every commit, push and comment on the draft PR with the slice scope, commit hash, and gate
  evidence — the draft-PR commit list + per-slice PR comments are the commit trail (no `commits.md`).
- Update `worklog.md` + `context-pack.md` after each slice.
- The run dir starts with `supervisor.md` (agent identity + lane table); a run dir without it is not
  activated (see `workflow/lane-policy.md` § Supervisor identity).
- If a slice runs a Tier C Workflow, commit its generated `workflow.js` to
  `<run-dir>/workflows/<slice>-workflow.js` before executing it.

## Handoff Requirements

Before closing the generator session:

- `worklog.md` has a filled Design section and gate results per slice.
- `context-pack.md` can resume the run.
- The draft PR's commit list + per-slice PR comments cover every commit created in the run.
- `arch-debt.md` entries exist for deferred doctrine violations.
- The evaluator can fill `evaluate.md` without reading chat history.
