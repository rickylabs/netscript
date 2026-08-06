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

The development train is `canary/0.0.5-canary.14`; #1315–#1318 target it. T1-A formal Qwen session
`f516aada-2a74-4dad-821e-b20963fe2983` returned `FAIL_FIX` at evaluated head `9f5ef7dcb`: 70 new
private-type-ref errors across eight publish roots, a baseline-green/head-red Fresh detached
consumer gate, unsupported PASS claims, and a mandatory unproven `scaffold.runtime` gate. The
verbatim artifact is committed on PR #1315 at `d0aa6a22d`; issue and PR are back at `status:impl`
for the bounded repair. Two premature Qwen attempts remain ineligible under C-D10. T1-B completed its
generic empty-Apps repair and isolated OTEL live proof at clean pushed head `53d6c278d`; its admissible
one-pass runtime rerun is 73/73 with raw exit 0, while the first interrupted attempt remains
diagnostic-only under C-D12. T1-B Qwen session `bd9e6431-23ac-4473-b331-3bc22333bf2e` launched from a
stale pre-adjudication prompt and is permanently ineligible under C-D15; its exact process group was
terminated before verdict. Corrected session `228b3382-c868-472b-8066-0af93d2ed01e` was later
failed closed under C-D17 when duplicate-root consolidation severed its output wrapper. The sole
admissible T1-B evaluator is Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7`, launched
from exact clean head `53d6c278d` through checked-in `openrouter-run.ts` with `deno run --no-lock`.
#1317/#1318 roll up green but require current-base merge gates after T1.
Planned cuts are canary.14/.15/.16. Minimax PLAN and Qwen IMPL paid-transport canaries passed;
routing state has no persisted fallback.

Immediate next action: resume T1-A's sole durable implementation owner on the formal findings while
T1-B finishes its sole admissible evaluation. Neither draft PR may enter the train until its own
fresh separate evaluation and the milestone pre-merge gate pass.
