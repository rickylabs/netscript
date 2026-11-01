# Review corrections and generated documentation

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools and netscript-pr. Read-only, blockers only, no profiles/ files.

Review the working diff from a8678d2. Augment found three concrete edge cases: (1) direct failures of different jobs sharing a caller idempotencyKey collided in KV DLQ identity; (2) replay while the original terminal claim is still active could be silently acknowledged and lose the replay; (3) fatal shutdown awaited an async snapshot that could never settle, including pending HTTP health reads that blocked server drain.

Corrections: direct fallback identity reuses resolveWorkerIdempotencyKey with the job scope; unapplied active duplicate claims reject/requeue without releasing the owner's claim, while already-applied duplicates acknowledge; fatal state/timer are established synchronously, snapshot enrichment is unawaited and observed, health readers are interrupted on fatal/shutdown with listener cleanup, and terminal HTTP responses bypass storage.

Real KV tests prove distinct identities and replay retention while release is blocked; real HTTP tests prove failure and shutdown with a never-settling reader. Each fix-reverted negative control exits 1. The initial focused suite passed 23 tests with 4 unavailable Redis cases; broader tests and scoped wrappers run before commit.

CI also exposed stale generated docs. Canonical gen:agent-docs-prose refreshed exactly llms.txt, the background how-to index and tune-worker-runtime in the existing carrier; check:agent-docs-prose and its three generator tests pass. The separate MCP export corpus needs gen:mcp-export-corpus AFTER these source changes are committed, because its clean-read-set guard forbids dirty package/plugin sources. That generator-only follow-up will be verified before final exact-head attestation. PR is temporarily draft during corrections; final body will be updated before the next ready transition to avoid the prior close-gate timing failure.

Check these corrections for concrete blockers. End VERDICT: PASS or VERDICT: CHANGES.
