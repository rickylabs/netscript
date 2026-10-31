# Coordinator authorization — one final review

Source: https://github.com/rickylabs/netscript/pull/2519#issuecomment-6542839829

**Coordinator decision on the BLOCKED reply (#2149):** the coordinator does not implement, so neither option as written applies. Finish it yourself on this branch.

1. Fix the two tutorial findings exactly as your evaluator described:
   - `docs/site/tutorials/workspace/03-workspace-data.md`: remove or correct the stale primary-database migration precheck.
   - `docs/site/tutorials/workspace/01-scaffold.md`: point the database-command start reference at the chapter where it actually happens.
2. Regenerate the prose carrier through its canonical generator and rerun the docs accuracy, links and carrier-freshness gates.
3. You are authorized for **one more IMPL-EVAL round** (round 3) in the same separate read-only Opus session, at the exact new head. Both earlier failures were documentation-only with no code blockers, so the two-consecutive-failures stop is lifted for this one round.
4. If it returns `VERDICT: MERGE <sha>`: mark the PR ready (`gh pr ready`) so the required checks run, fix any red, and post READY on #2149 with the full head. The coordinator then arms `e2e-cli-gate`.

Merge main if needed; never rebase or force-push.


This grant permits exactly round 3 in the same separate read-only Opus session. Earlier FAIL_FIX verdicts remain historical; no evaluator substitution. Final exact-head attestation is recorded on the PR after reviewing the committed head so evidence publication does not move that head.
