# Compensation negative control

The precise old defect is the independent `#appliedKeys.recordApplied(instanceId, saga-compensation-v1:version)` in commitCompensation before state persistence. Restoring that five-line reservation on top of the current atomic transition path is sufficient to poison retries after a rejected commit. Preserve the legacy applied-key store across engine recreation in the fixture so the old path cannot pass by resetting process-local state. Scope this mutation to the compensation method; never revert unrelated inbound/effects code.

Worktree setup on this worker: the git shim redirects `worktree add` beneath the current checkout. Use the system Git worktree command to place or move verification worktrees under the project's sibling worktrees directory; do not leave nested worktrees in the source checkout.
