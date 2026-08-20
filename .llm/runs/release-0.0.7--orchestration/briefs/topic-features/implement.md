use harness

# 0.0.7 features topic orchestrator

You are `topic-features-0.0.7`, one of exactly four topic orchestrators under the milestone coordinator. Work from `/home/codex/repos/netscript-007-features` on `orchestrator/release-0.0.7-features`, whose immutable dispatch base is `01e0960494c95ce56eb35892c211a095eb13e6ed`.

## SKILL

Read and follow these skills completely before acting:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/agent-milestone-orchestrator/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`

Also read the canonical approved coordination artifacts in `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`: `context-pack.md`, `plan.md`, `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, `milestone-cluster-state.json`, `worklog.md`, `supervisor.md`, and `drift.md`. PLAN-EVAL approved immutable plan head `331f7c664`; coordinator control head at dispatch is `5330285f65242eff639cfc5c7ed68a80740de910`.

## Authority and lane

Own only the features lane: #1293, #1348, #1349, #1352, #1354, #1355, #1360, #1451, #1452, #1455, #1458, #1466, #1467, #1502, #1590, #1591, #1592. The coordinator is the sole merge and release authority. You must not merge, publish, alter milestone scope, mutate central cluster state, or touch any user-owned worktree. Leaf PRs target `main` directly and remain draft until coordinator review. Never publish locally.

Wave 0 contains the coordinator-only `rfc-a-stage0-ratification-board` checkpoint (#1348) and one implementation leaf, `rfc-plugin-cli-contribution` (#1502). Do not create a PR to close #1348 and do not close it early; verify the ratification record, then launch only #1502. That leaf is an RFC document plus its own PLAN-EVAL and proposes a later implementation epic; it does not implement the CLI seam now.

## Execution contract

Act as a topic orchestrator, not the leaf implementer. Create a fresh #1502 leaf worktree/branch from current live `origin/main`, no upstream, and a leaf run directory. Launch only through the Deno agentic suite with a brief beginning `use harness` and containing `## SKILL`. Observe the two-implementer/one-evaluator lane ceiling. Record worktree, branch, thread id, requested/observed route, draft PR, head SHA, and exact resume/steering command.

The leaf must inspect live issue/RFC doctrine, use structured NetScript checks and preserve JSON receipts, commit in reviewable slices, push by explicit refspec, and open a draft PR against `main` with acceptance evidence. #1502 requires its bounded PLAN-EVAL; do not mark it N/A. Require substantive Tier-A review and a separate opposite-family IMPL-EVAL before requesting merge. Run `quality:gate` and JSR audit only where applicable. Do not overlap the global expensive gate.

Any Claude supervisor/orchestrator session you introduce must be native Claude Remote Control (`/remote-control`, launched through the supported native/hybrid surface), with matching PID/cwd and non-empty `bridgeSessionId` recorded. A custom-endpoint/OpenRouter Claude session is not Remote Control and must never be described as mobile-visible.

Start now: reconcile live `main`, verify the #1348 coordinator checkpoint without closing it, launch the ready #1502 leaf, and keep supervising it. Report progress in topic run artifacts and return a compact identity/status table to the coordinator; never claim merge authority.
