# Plan

## Design

Choose no jobs on draft PR pushes. Drafts cannot merge, and required contexts reliably materialize
on `ready_for_review`; retaining even a fast job would multiply cost across every slice push.

1. Add `ready_for_review` to every PR event-type list that also handles pushes/PR activity.
2. Gate core CI, e2e/scaffold/desktop, code quality, and surface analysis on `draft == false`.
3. Leave #1152 capability-vector expressions and label overrides unchanged beneath the guard.
4. Validate workflow syntax and focused workflow/classifier tests, then use this PR's draft/ready
   transitions as RED/AFTER evidence.

Archetype: repository process/tooling; no package archetype or doctrine gate applies. Debt: none.
