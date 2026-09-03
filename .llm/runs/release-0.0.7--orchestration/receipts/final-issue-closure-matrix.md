# Final 0.0.7 issue closure matrix

Latest: 2026-09-03 10:54Z. #1455 is CLOSED by merged #1970 at d2af6e8b4 (10:43:28Z).
Five open issues remain. The original six-row accounting below is retained as the audit trail;
its #1455 row is now satisfied, not waiting. #1945 has both runtime tiers PASS and only a bounded
ordering-test/core-CI delta left. Cold-proof independent PASS is receipts/eval-readme-cold/.
Coordinator tracking #1641 contains historical maintainer-policy/skill edits as well as runs;
reconcile those against current main (never restore retired Claude mirrors) before closing it.
It is not a product implementation or a canary barrier; preserve all its accepted run context.

GitHub audit: 2026-09-03 10:30Z. Six open issues, zero unassigned. PRs are counted separately;
the GitHub milestone API's nine open items includes the three open PRs at this checkpoint.

| Issue | Accountable lane | Exact remaining closure proof | Close action |
| --- | --- | --- | --- |
| #1455 | Fixes; original author thread01a06201-d0b9-7cb1-afe6-8b071ca28012 | #1970 b5d23b051: independent scoped PASS, both hosted runtime tiers PASS33743065396; core final CI rerun and truthful final PR packet still pending | Closes #1455 in verified PR, then merge/status:shipped |
| #1481 | Fixes; original author thread01a06322-7bb5-7d80-badf-3068fb4942eb | #1945: dual structural/runtime exclusion, production build and mutation control, final main integration5243a19f9, separate PASS being finalized, exact hosted pair still pending | Closes #1481 in verified PR, then merge/status:shipped |
| #1971 | Same #1945 author | Main already contains catalog-resolution correction; final post-codegen build and unsuppressed production-exclusion gate in both exact-head tiers | Closes #1971 with #1945 after complete acceptance |
| #1881 | Aspire acceptance, primary executes release | Readme-cold proof832e53720 must be reviewed/pushed/merged; final canary's zero cold baseline, exact printed12 commands, no manual recovery and durable owned-cleanup receipts | Attach actual version/run/receipts; check only proven boxes and close |
| #863 | Aspire; primary closes parent | Gates1/2 already proven by #1754/#1952; gate3 is #1881 | Close immediately after #1881 passes |
| #1712 | Aspire; primary closes epic | S1–S11/S13 merged; latest parity/MCP evidence; final exact-content published-canary production pair and #863 complete | Close with actual final receipts before stable cut |

Closed children independently verified via GitHub closedByPullRequestsReferences:
1713→1727, 1714→1735, 1715→1741, 1716→1738, 1717→1740, 1718→1743,
1719→1744, 1720→1754, 1721→1759, 1722→1760, 1723→1771, 1724→1779, 1880→1952.
Each is CLOSED/COMPLETED with a merged closing PR. #1725 is CLOSED/NOT_PLANNED in0.0.8;
it is not implementation delivered by0.0.7. Historical research acceptance text is not rewritten
to imply its delivery. #1844 is owner-approved closed, mitigated/original-cause-unproven.

## Final release contract

Only final product PRs1970/1945 and the bounded cold-proof correction join the candidate. Run
composed publish:readiness before dispatch at the frozen source head; native release-canary.yml
checks authenticated rolling JSR attempt budget before minting. No ad-hoc registry publisher,
version reuse, hidden retry, or broad new scope. Only after exact published-version production
and cold-start acceptance are green do issues close and stable proceed. Both stable publish
and its pinned production E2E must then pass; a green canary is not already a stable release.

Auth-only boundary: current GitHub PAT has repo but not workflow, so it cannot publish the new
cold-proof workflow commit. Device authorization requested; independent PR work continues.
