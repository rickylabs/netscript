# Phase Group Registry — milestone cluster harness

| Group | Status | Owner | Output |
| --- | --- | --- | --- |
| Profile and templates | active | coordinator + audit-profile | harness/skill contract |
| Gate receipts | active | coordinator + audit-receipts | runner/schema/CI contract |
| Evaluator lifecycle | active | coordinator + audit-actions | exact-once workflow hardening |
| Validation and publication | planned | coordinator | gates + draft PR |

## Invariants

- One writer integrates changes in this worktree.
- Audit agents are read-only.
- No evaluator or live release workflow is triggered during authoring.
- Product and release mechanics remain out of scope.
