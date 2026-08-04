# Research

- Issue #1219 was read first and is the specification.
- `e2e-cli.yml` still subscribes to `labeled` and `unlabeled`; its ref-scoped concurrency cancels the executing run when either event respawns the workflow.
- `ci.yml` already removed metadata events in #1214 and retains opened/synchronize/reopened/ready_for_review.
- The classifier reads the complete label set on the next trigger, so removing label events does not remove skip semantics.

