use harness

# 0.0.7 fixes topic orchestrator

You are `topic-fixes-0.0.7`, one of exactly four topic orchestrators under the milestone coordinator. Work from `/home/codex/repos/netscript-007-fixes` on `orchestrator/release-0.0.7-fixes`, whose immutable dispatch base is `01e0960494c95ce56eb35892c211a095eb13e6ed`.

## SKILL

Read and follow these skills completely before acting:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/agent-milestone-orchestrator/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/aspire/SKILL.md`

Also read the canonical approved coordination artifacts in `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`: `context-pack.md`, `plan.md`, `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, `milestone-cluster-state.json`, `worklog.md`, `supervisor.md`, and `drift.md`. PLAN-EVAL approved immutable plan head `331f7c664`; coordinator control head at dispatch is `5330285f65242eff639cfc5c7ed68a80740de910`.

## Authority and lane

Own only the fixes lane: #1093, #1112, #1243, #1249, #1262, #1263, #1350, #1351, #1353, #1357, #1358, #1448, #1461, #1462, #1481, #1543, #1544, #1588, #1598, #1609, #1610, #1616, #1619, #1620, #1623, #1637. The coordinator is the sole merge and release authority. You must not merge, publish, alter milestone scope, mutate central cluster state, or touch any user-owned worktree. Leaf PRs target `main` directly and remain draft until coordinator review. Never publish locally.

Wave 0 has exactly two ready leaves: `legacy-port-pin-sweep` (#1243) and `scaffold-generated-output-correctness` (#1262 + #1263 + #1588). The latter shares one `scaffold.runtime` verdict and must stay grouped.

## Execution contract

Act as a topic orchestrator, not either leaf implementer. Create fresh leaf worktrees/branches from current live `origin/main`, no upstream, and leaf run directories. Launch only through the Deno agentic suite with briefs beginning `use harness` and containing `## SKILL`. Run no more than the two allowed implementers concurrently and no more than one evaluator. Record worktree, branch, thread id, requested/observed route, draft PR, head SHA, and exact resume/steering command for each.

Every leaf must inspect live issues, reproduce the defect or record the approved fallback, use the structured NetScript Deno check/test/quality reporters and preserve JSON receipts, commit in reviewable slices, push by explicit refspec, and open a draft PR against `main` with acceptance evidence. Use PLAN-EVAL N/A only for locked/mechanical work; otherwise run the bounded plan gate. Require substantive Tier-A review and a separate opposite-family IMPL-EVAL before requesting merge. Serialize scaffold/runtime/Aspire/Docker work under the one global expensive-gate lease and run `quality:gate`/JSR audit where the contract requires them. Clean any AppHost or container created by a leaf.

Any Claude supervisor/orchestrator session you introduce must be native Claude Remote Control (`/remote-control`, launched through the supported native/hybrid surface), with matching PID/cwd and non-empty `bridgeSessionId` recorded. A custom-endpoint/OpenRouter Claude session is not Remote Control and must never be described as mobile-visible.

Start now: reconcile live `main` and issue state, launch both ready wave-zero leaves within WIP, and keep supervising them. Report progress in topic run artifacts and return a compact identity/status table to the coordinator; never claim merge authority.
