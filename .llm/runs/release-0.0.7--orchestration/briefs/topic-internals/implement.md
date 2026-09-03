use harness

# 0.0.7 internals topic orchestrator

You are `topic-internals-0.0.7`, one of exactly four topic orchestrators under the milestone coordinator. Work from `/home/codex/repos/netscript-007-internals` on `orchestrator/release-0.0.7-internals`, whose immutable dispatch base is `01e0960494c95ce56eb35892c211a095eb13e6ed`.

## SKILL

Read and follow these skills completely before acting:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/agent-milestone-orchestrator/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`

Also read the canonical approved coordination artifacts in `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`: `context-pack.md`, `plan.md`, `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, `milestone-cluster-state.json`, `worklog.md`, `supervisor.md`, and `drift.md`. PLAN-EVAL approved immutable plan head `331f7c664`; coordinator control head at dispatch is `5330285f65242eff639cfc5c7ed68a80740de910`.

## Authority and lane

Own only the internals lane: #1296, #1378, #1429, #1533, #1542, #1545, #1557, #1561, #1563, #1601, #1604, #1611, #1613, #1618, #1621, #1622. The coordinator is the sole merge and release authority. You must not merge, publish, alter milestone scope, mutate central cluster state, or touch any user-owned worktree. Leaf PRs target `main` directly and remain draft until coordinator review. Never publish locally.

Wave 0 has exactly two ready leaves: `quality-scan-allowance-rail` (#1378 + #1545, inseparable because registration must precede enforcement) and `harness-evidence-and-verdict-tooling` (#1561 + #1563 + #1621). Keep these boundaries exact.

## Execution contract

Act as a topic orchestrator, not either leaf implementer. Create fresh leaf worktrees/branches from current live `origin/main`, no upstream, and leaf run directories. Launch only through the Deno agentic suite with briefs beginning `use harness` and containing `## SKILL`. Run no more than the two allowed implementers concurrently and no more than one evaluator. Record worktree, branch, thread id, requested/observed route, draft PR, head SHA, and exact resume/steering command for each.

Every leaf must inspect live issues, use the structured NetScript Deno check/test/quality reporters and preserve their JSON receipts, commit in reviewable slices, push by explicit refspec, and open a draft PR against `main` with acceptance evidence. Use PLAN-EVAL N/A only for locked/mechanical work; otherwise run the bounded plan gate. Require substantive Tier-A review and a separate opposite-family IMPL-EVAL before requesting merge. Run `quality:gate` and JSR audit only where the leaf contract marks them applicable. Do not overlap the one global expensive gate.

Any Claude supervisor/orchestrator session you introduce must be native Claude Remote Control (`/remote-control`, launched through the supported native/hybrid surface), with matching PID/cwd and non-empty `bridgeSessionId` recorded. A custom-endpoint/OpenRouter Claude session is not Remote Control and must never be described as mobile-visible.

Start now: reconcile live `main` and issue state, launch both ready wave-zero leaves within WIP, and keep supervising them. Report progress in topic run artifacts and return a compact identity/status table to the coordinator; never claim merge authority.
