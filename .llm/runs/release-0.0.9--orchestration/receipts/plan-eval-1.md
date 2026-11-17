**BLOCKERS**

1. **#2396 has a draft/CI deadlock.** The [brief](/home/agent/projects/orchid/worktrees/issue-6534794312/.llm/runs/release-0.0.9--orchestration/briefs/2396.md:30) keeps adopted PRs draft until the coordinator merges them, yet demands green E2E on each head. [CI skips draft PRs](/home/agent/projects/orchid/worktrees/issue-6534794312/.github/workflows/ci.yml:29), and [E2E additionally requires an opt-in label](/home/agent/projects/orchid/worktrees/issue-6534794312/.github/workflows/e2e-cli.yml:140). **Fix:** introduce an explicit “ready for CI” handoff: the coordinator applies the required gate label, promotes the PR, waits for actual gate success at the evaluated SHA, then merges. This currently blocks canary .1 by construction.

2. **The DAG does not enforce B1 → B2 qualification.** [#2108 is scheduled in W4](/home/agent/projects/orchid/worktrees/issue-6534794312/.llm/runs/release-0.0.9--orchestration/plan.md:19), while B1 finishes with #2382 in W6. Its only prerequisites are #2162 and #2149. Because waves are priorities rather than barriers, the clean KV workflow/replay proof can finish before the saga fixes it should qualify. **Fix:** retain those two prerequisites, add a B1-completion gate for #2108, and move its proof to a later topological wave. Also gate #2390 on completed B1 if it remains described as an “after B1” recheck.

3. **#2268 cannot merge from its assigned lane.** The [plan assigns it to docs](/home/agent/projects/orchid/worktrees/issue-6534794312/.llm/runs/release-0.0.9--orchestration/plan.md:11), whose merge gate forbids `packages/**` and `plugins/**` changes. Its acceptance requires live AppHost binding, telemetry retrieval, and actionable failure behavior implemented under `packages/mcp/**` and related adapters. **Fix:** move #2268 to internals or features in inventory, DAG, and cluster state. Resolve #2269’s embedded-corpus decision before assigning its implementation; any required package-code portion needs the same reassignment.

4. **#2144’s proof changes the retry contract and contradicts its permitted partial delivery.** The [brief requires DLQ after `maxRetries` attempts](/home/agent/projects/orchid/worktrees/issue-6534794312/.llm/runs/release-0.0.9--orchestration/briefs/2144.md:35), but the published field counts retries; zero retries must still execute once. It also permits retry-only delivery while retaining mandatory DLQ proof. **Fix:** specify one initial attempt plus at most `maxRetries` retries, including a zero-retry case. Make DLQ evidence conditional on shipping that slice; explicitly record remaining acceptance when delivering retry-only scope.

**NON-BLOCKING notes**

- A2’s #2395 → #2351 edge and the B1 serial chain are sound. The current DAG also contains #2161 → #2162.
- A1’s split is workable by function ownership: #2165 owns key resolution/wiring; #2187 owns event construction and `resolveDedupTtl`. Both touch `trigger-processor.ts`, so describe this as function ownership.
- For #2187, clarify that duplicate rejection under the default zero completed TTL means **concurrent in-flight claims**. A later event after completion is eligible again.
- W1 respects the caps: fixes 2, features 2, internals 1; five builders total. Keep adopted #2396 PRs under one implementing owner.

VERDICT: CHANGES