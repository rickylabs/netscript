# Resume from here

Issue #1367, PR #2520, branch orch/divybot-6542543055; baseline main
851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2. PLAN-EVAL PASS after one corrective round.
Current phase: independent slice/implementation review PASS; implementation ready for commit/push.

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
