# Final implementation evaluation / round 5

Reuse the same independent read-only Claude Opus session. This is one continuous round with two checkpoints to satisfy both per-slice review before commit and exact-pushed-head final attestation within the five-round limit.

1. Inspect all pending S3 CI repairs and gate evidence. Emit `S3 SIGNOFF: PASS` only if substantively approved, otherwise stop with FAIL_FIX. Do not commit, push, edit or launch resources.
2. Remain in the same invocation, waiting read-only for a private coordination record. The implementer commits and pushes only after the approval, then records exact head and current CI state privately. Reconcile commit vs approved diff, clean tree, remote branch and PR head; inspect the CI state and outstanding coordinator-owned runtime gate. End with `VERDICT: MERGE <full sha>` or `VERDICT: CHANGES <full sha>`.

The final output goes to the excluded final handoff and PR comment, avoiding an evidence commit that changes its own attested SHA. Public output must omit private paths, allocated endpoints and session IDs. Historical review artifacts are retained as historical snapshots, not fresh CI claims.
