# Scope Lessons

## Design Phase Before Broad Implementation

Source run:

- `.llm/tmp/run/refactor-cli-e2e-validation-suite`

This lesson is now codified as a structural requirement in `workflow/run-loop.md` § 3b (Design
checkpoint). The run-loop enforces the design-before-implementation rule; this file records why.

### What went wrong

The implementation created 82 files in one commit without a design checkpoint. Speculative seams
(flow base classes, unused ports, runtime symbol plumbing) were created to satisfy a folder template
before the concepts were proven. Three correction passes were needed to reach acceptable quality.

### Root causes

- No intermediate checkpoint between plan and code expansion.
- Doctrine archetype treated as a folder template instead of a design constraint.
- Generic strings used where the domain has known constant vocabularies.
- All capability suites bundled into one commit without per-slice gates.

### How the harness now prevents this

- `workflow/run-loop.md` § 3b requires a Design section in `worklog.md` before files are created:
  public surface, domain vocabulary, ports, constants, commit slices with gates, deferred scope, and
  contributor path.
- `workflow/run-loop.md` § 5 requires sliced implementation: one commit per slice, each with its
  named gate.
- `workflow/run-loop.md` § 5 Concept of Done checklist applies to each slice.
- Each archetype profile has **Design Checkpoint Expectations** and **Concept of Done** sections.
- The evaluator verifies design evidence exists and commit slices follow it.
- `templates/evaluate.md` includes a Process Verification table that checks for design checkpoint,
  slice alignment, speculative seams, and constants.

### Core principle

Doctrine is a design constraint, not a folder template. A run passes doctrine only when the
resulting code is understandable, cohesive, and maintainable by a new contributor without
reverse-engineering private decisions from scattered files.
