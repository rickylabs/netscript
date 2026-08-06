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
consumer gate, unsupported PASS claims, and a mandatory unproven `scaffold.runtime` gate. Its
bounded repair is now clean and pushed at `18c7a7e79`: product `b29879e94`, corrected evidence
`91bc68099`, terminal handoff `18c7a7e79`. The repair reports every one of 19 parsed export roots at
or below canary.14 (287 to 279 root sum), Fresh detached/member checks green through fixture-owned
catalog plus root-CI wiring, serial publish dry-run green, and exact one-pass runtime 73/73 raw exit
0 with zero smoke-owned leaks. PR #1315 remains draft; issue/PR advance from `status:impl` to
`status:impl-eval` only for a fresh Qwen high repair evaluation. Two premature Qwen attempts remain
ineligible under C-D10. T1-B completed its
generic empty-Apps repair and isolated OTEL live proof at clean pushed head `53d6c278d`; its admissible
one-pass runtime rerun is 73/73 with raw exit 0, while the first interrupted attempt remains
diagnostic-only under C-D12. T1-B Qwen session `bd9e6431-23ac-4473-b331-3bc22333bf2e` launched from a
stale pre-adjudication prompt and is permanently ineligible under C-D15; its exact process group was
terminated before verdict. Corrected session `228b3382-c868-472b-8066-0af93d2ed01e` was later
failed closed under C-D17 when duplicate-root consolidation severed its output wrapper. The sole
admissible T1-B evaluator is Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7`, launched
from exact clean head `53d6c278d` through checked-in `openrouter-run.ts` with `deno run --no-lock`.
T1-B canonical Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7` returned `PASS` at
evaluated head `53d6c278d`; its artifact-only head is `31b898212`. All eight #1189 rows are
independently supported, the exact runtime smoke is 73/73 raw exit 0, post-run ownership is clean,
and the protected stash is intact. Local evidence-mirror dry-run, close-gate, prohibited-diff scan,
and review-thread gate pass at the artifact head. Issue/PR are `status:ready-merge`, the PR is no
longer draft, and the label-triggered current-head CI is pending; no merge is authorized until the
named contexts finish successfully and T1-A is repaired/evaluated. #1317/#1318 roll up green but
require current-base merge gates after T1.
Planned cuts are canary.14/.15/.16. Minimax PLAN and Qwen IMPL paid-transport canaries passed;
routing state has no persisted fallback.

T1-A fresh repair evaluator session `4c09a05f-a5da-4794-87e2-29b2d05f67f2` ran through the
checked-in `openrouter-run.ts` transport: Qwen 3.8 Max high, bypass, read-only, exact clean head
`18c7a7e79...`, with issue/PR at exactly `status:impl-eval`. It reproduced nearly all decisive
gates, including the exact one-pass smoke, but the provider rejected the first post-compaction
continuation before any verdict because its default output reservation exceeded remaining account
budget. Under C-D18 that interrupted turn is failed closed. A same-session retry through the same
checked-in route used a supported 16,000-token output cap and separate raw capture, but the sole
configured OpenRouter key had reached its monthly limit and inference did not begin. No route was
substituted and no verdict is inferred. T1-A remains draft at exactly `status:impl-eval`; its gate is
closed until the approved Qwen transport is funded/reset and emits the complete artifact plus
terminal verdict. Independent non-merge milestone work may continue meanwhile.

Immediate next action: hold T1-A's formal gate for approved Qwen transport recovery while preserving
its exact clean target and lifecycle. Cloud OpenHands is not an admissible substitute for this local
harness run. T1-B remains outside the train: it has zero classified current failures but a queued
visibility job and canceled runner-starved jobs, not a complete green current-head rollup. T2 PRs
#1317/#1318 remain green but are sequenced after T1 train mutations. No merge is authorized until
T1-A passes, both T1 PRs have current green required contexts outside draft policy, and the complete
milestone pre-merge gate passes.
