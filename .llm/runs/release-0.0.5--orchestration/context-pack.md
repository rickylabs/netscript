# Context pack — release-0.0.5 continuation

Current state on 2026-08-06: continuation is activated at `origin/main@2508eb8c`. #1331 is merged
and independently evaluated. Live 0.0.5 scope is 42 open items (38 issues, PRs #1315–#1318). Future
milestones were renamed collision-safely through `0.0.13`; new milestone 25 `0.0.6` holds the
fourteen non-frontend open rows moved from old milestone 24, while renamed milestone 24 `0.0.7`
retains #922–#941 and all six closed historical assignments. Wave plan v3 now dispositions all 38
issues: 30 retained and eight approved moves (#1085, #1093, #1112, #1139, #1201, #1210, #1260,
#1293). Separate Minimax M3 PLAN-EVAL session `567e3125-0fe9-4637-b0bb-30c20f9d3c26` returned
`PASS`; no new implementation lane has yet been dispatched.

Legacy authoritative evidence remains at local branch `orchestrator/0.0.5@8399126ef` and path
`/home/codex/repos/ns-005/.llm/runs/release-0.0.5--orchestration/`; do not reconstruct its merge or
canary history from memory. Latest legacy canary evidence is 0.0.5-canary.13, content `57c9b5ab3`,
publish run 31051176983 and pinned E2E 31051492054, pending live re-verification before it is used
as a current gate.

The development train is `canary/0.0.5-canary.14`; #1315–#1318 target it. #1315 is red on child
project `catalog:zod`; #1316 is red on empty `Apps: {}` cleanup and missing isolated OTEL evidence;
#1317/#1318 roll up green but require current-base merge gates. Planned cuts are canary.14/.15/.16.
Minimax PLAN and Qwen IMPL paid-transport canaries passed; routing state has no persisted fallback.

Immediate next action: record the PASS, execute and verify the eight milestone moves, reconcile
terminal labels on #1331/#1336, update PR #1337 to `status:impl`, then dispatch T1 through the
supported agentic runtime.
