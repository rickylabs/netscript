# Implementation Prompt: <target>

Use this prompt for the generator session.

## Required Reading

1. `.llm/harness/workflow/run-loop.md` — especially § 2a (Design) and § 2b
   (Sliced Implementation).
2. `.llm/harness/workflow/commit-tracking.md`
3. Selected archetype profile (read its **Design Checkpoint Expectations** and
   **Concept of Done** sections).
4. `.llm/harness/gates/archetype-gate-matrix.md`
5. `.llm/tmp/run/<run-id>/plan.md`
6. `.llm/tmp/run/<run-id>/context-pack.md` if present

## First Act: Design Checkpoint

Before creating implementation files, fill the `## Design` section in
`worklog.md`. This is mandatory. The evaluator will verify the design section
exists and that commit slices follow it. See `workflow/run-loop.md` § 2a for
the required structure.

## Operating Rules

- Implement only the approved scope.
- Follow the Design checkpoint's commit slices in order.
- Run each slice's named gate before committing.
- Apply the Concept of Done checklist (run-loop § 2) to each slice.
- Append `drift.md` when facts differ from the plan or doctrine.
- Append `commits.md` immediately after every commit.
- Update `context-pack.md` after each slice.

## Handoff Requirements

Before closing the generator session:

- `worklog.md` has a filled Design section and gate results per slice.
- `context-pack.md` can resume the run.
- `commits.md` lists every commit created in the run.
- `arch-debt.md` entries exist for deferred doctrine violations.
- The evaluator can fill `evaluate.md` without reading chat history.
