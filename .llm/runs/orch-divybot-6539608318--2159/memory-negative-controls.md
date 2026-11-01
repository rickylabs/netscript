# Negative controls

Acceptance tests were run in a separate verification worktree to avoid mutating the reviewed tree.
Restoring the baseline engine + bridge with new adapters/tests retained produced 5 failures:
all four KV/Redis production-supervisor crash/orphan proofs and the persisted handler/store-failure
retry test. Both PostgreSQL process-kill tests also fail with the baseline reservation paths.
Removing the KV commit checks produces 3 failures (memory, persisted KV, real Redis): all twelve
writers commit instead of one. Bypassing the Prisma interactive callback produces a failing
real PostgreSQL write-seam rollback proof. These are intentional red controls, never green gates.
