# Resume from here

Issue #1367, PR #2520, branch orch/divybot-6542543055; baseline main
851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2. PLAN-EVAL PASS after one corrective round.
Current phase: implementation pushed and ready for review; CI follow-up refreshes the embedded
streams docs prose. Prior exact-head reviewer approved 57193c427042a6fdbc1ee1bcff6e61d2d55bf1ea.
Any new commit needs refreshed exact-head review and full runtime CI evidence.

Implementation: optional PluginEntry.DataDirectories map; generated registration provisions absolute
paths and binds env before launching; streams contribution optional dataDir emits the core directory
spec. Default remains memory. Manual Environment.STREAMS_DATA_DIR keeps its existing semantics.
Docs updated. Both runtime tiers now include fixture + restart gates.

Read runtime-proof.md and negative-controls.md: actual minimal generated Aspire proof passed,
reverted-binding control failed, restoration passed. Producer writes did not silently disappear.
Exact owned AppHost stopped; no full scaffold.runtime was run locally. CI e2e-cli verdict requires
coordinator arming e2e-cli-gate. No labels/milestones/merge/tag/release permitted to this leaf.

Final combined structured test gate: 258 pass, 0 failures/ignored; quality-gate PASS; scoped lint/fmt
15/15. Independent reviewer also reran four focused files (12 pass). See gate-evidence.md and
evaluate.md for verdict/limits. Raw local logs are intentionally outside Git. Re-steer the same independent evaluator
using the existing claude-print wrapper with the owner model/high effort and stdin closed.
Final evaluator must review exact pushed final head; preserve its verdict through public PR phase
comment and the excluded final report, without moving the head afterward.

Current CI issue: quality's agent-docs-prose freshness check. Native generators change only the
embedded streams page; no runtime changes or removed corpus entries. Close-gate's nine issue boxes
now carry executed evidence; only the full-runtime CI checkbox remains genuinely unproven. Existing
e2e-cli workflow was manually dispatched on GitHub-hosted VMs without labels, in response to owner
CI repair requests. New-head dispatch must supersede old-head CI after this prose-only commit.

Latest remediation: normal pending merge of main 15cffa2 (#2517/#2421); upstream native streams
service factory preserved, no custom source conflicts or lock edits. Native MCP export corpus
regenerated for directory signature changes; all derived asset freshness checks required as a
complete closure. Focused combined tests still 258/258. See drift/worklog. Awaiting independent
combined-artifact/slice review before commit/push, then E2E at the refreshed head and final review.

Latest follow-up: bfc3e92 passes all four asset freshness gates in CI. Native Aspire surface
inventory needed four rows for new task files. Generated without policy/version changes; parity
now passes with zero failure/missing paths. Push this derived-only fix and rerun current-head CI.
Local full publish dry-run is in progress; final exact-head reviewer pass is still reserved.

All locally remaining quality gates passed: full workspace publish dry-run, cold AI peer check,
critical audit, parity, and all generated freshness checks. Final docs-only precision distinguishes
creation failure (AppHost composition) from failed existing-directory write probe (service startup);
matching embedded prose regenerated. No further runtime changes. Final review is the reserved fifth
same-session IMPL-EVAL pass, to run against the exact final pushed head once CI results are available.
