# Context pack — release-0.0.5 continuation

Current state on 2026-08-06: continuation is activated at `origin/main@2508eb8c`. #1331 is merged
and independently evaluated. Live 0.0.5 scope is 42 open items (38 issues, PRs #1315–#1318). Future
milestones were renamed collision-safely through `0.0.13`; new milestone 25 `0.0.6` holds the
fourteen non-frontend open rows moved from old milestone 24, while renamed milestone 24 `0.0.7`
retains #922–#941 and all six closed historical assignments. Wave plan v3 now dispositions all 38
issues: 30 retained; the eight approved moves (#1085, #1093, #1112, #1139, #1201, #1210, #1260,
#1293) now reside in milestone 25 with per-issue rationale. Separate Minimax M3 PLAN-EVAL session
`567e3125-0fe9-4637-b0bb-30c20f9d3c26` returned `PASS`. T1-A and T1-B are the active inherited-train
repair supervisors.

Legacy authoritative evidence remains at local branch `orchestrator/0.0.5@8399126ef` and path
`/home/codex/repos/ns-005/.llm/runs/release-0.0.5--orchestration/`; do not reconstruct its merge or
canary history from memory. Latest legacy canary evidence is 0.0.5-canary.13, content `57c9b5ab3`,
publish run 31051176983 and pinned E2E 31051492054, pending live re-verification before it is used
as a current gate.

The development train is `canary/0.0.5-canary.14`; #1315–#1318 target it. T1-A repaired #1315 at
head `9f5ef7dcb`; its current-SHA hosted CI is green, while its implementation thread finishes the
terminal handoff. Two premature Qwen attempts are ineligible under C-D10, so a single fresh formal
evaluation remains pending. T1-B has the generic empty-Apps repair and isolated OTEL live proof in
its worktree. Its first full runtime smoke reached Aspire cleanup but has no captured exit due C-D11,
so the durable T1-B thread is rerunning the exact one-pass gate under C-D12. #1317/#1318 roll up
green but require current-base merge gates after T1. Planned cuts are canary.14/.15/.16. Minimax
PLAN and Qwen IMPL paid-transport canaries passed; routing state has no persisted fallback.

Immediate next action: obtain terminal pushed handoffs from both T1 supervisors, launch one fresh
Qwen evaluator per PR, record both IMPL-EVAL artifacts, then run the milestone pre-merge gate before
either draft PR can advance.
