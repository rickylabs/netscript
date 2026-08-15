# Wave 0 leaf registry — fixes topic

| Leaf | Issues | Worktree | Branch | Base | Route | Thread | Draft PR | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `legacy-port-pin-sweep` | #1243 | `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep` | `fix/legacy-port-pin-sweep` | `e6ba15ec6` | Codex · `gpt-5.6-sol` · low | `019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f` (idle) | [#1643](https://github.com/rickylabs/netscript/pull/1643) **MERGED** `0b3ed5d5a` @ 2026-08-14T23:39:37Z | **TERMINAL/SHIPPED** — IMPL-EVAL `PASS` at `e6ba15ec6`; #1243 `CLOSED/COMPLETED`. The lifecycle-label gap reported 2026-08-14 is **closed**: PR and issue are both exactly `status:shipped` (re-verified 2026-08-15). |
| `scaffold-generated-output-correctness` | #1262, #1263, #1588 | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness` | `fix/scaffold-generated-output-correctness` | `14d8b38b4` | Codex · `gpt-5.6-sol` · high | `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` (idle) | [#1654](https://github.com/rickylabs/netscript/pull/1654) **MERGED** `da574111a` @ 2026-08-15T05:36:48Z | **TERMINAL** — Tier-A `PASS` + IMPL-EVAL `PASS` at `f178ac663`; leased `scaffold.runtime` `suite-end` `ok:true` 88/0; all three issues `CLOSED/COMPLETED` at `status:shipped`. Receipts preserved in-tree on `main`. |
| `design-registry-catalog-drift-gate` | #1358 | `/home/codex/repos/netscript-007-leaf-design-registry-drift` | `fix/design-registry-catalog-drift-gate` | `da574111a` | Codex · `gpt-5.6-sol` · medium | `01a003f0-7821-7a10-a555-e619a9280479` (idle) | [#1657](https://github.com/rickylabs/netscript/pull/1657) **MERGED** `6917c656e` @ 2026-08-15T08:27:20Z | **TERMINAL/SHIPPED** — squash-merged from exact head `b71c1ee72`; #1358 `CLOSED`/`COMPLETED` with **7/7** acceptance boxes checked; PR and issue both exactly `status:shipped`; `impl-eval:skip` removed. IMPL-EVAL cycle 2 `PASS` at `3d7819203`; body recheck `PASS` at `b71c1ee72`. |
| `ai-mcp-pool-isolation` | #1448 | `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` | `fix/ai-mcp-pool-isolation` | `284dda90a` | Codex · `gpt-5.6-sol` · medium | `01a0048d-61b0-76a2-8117-5f8ce0466495` (idle) | [#1661](https://github.com/rickylabs/netscript/pull/1661) **MERGED** `baf1cdf67` @ 2026-08-15T10:54:05Z | **TERMINAL/SHIPPED** — squash-merged from exact head `f74695bc4`; #1448 `CLOSED`/`COMPLETED` at 10:54:06Z; PR and issue both exactly `status:shipped`. Terminal CI at the merged head: `pr-checks PASS`, `checks=31`, `currentFailures=0`; threads 0/0; PR **0 unchecked**, #1448 **9/9 checked**. Gate history: Tier-A + IMPL-EVAL cycle 1 `FAIL_FIX` (F-1 signal scoping) → bounded repair → cycle 2 `PASS` at `4766b258f` → post-readiness `check-test` regression (O-3 computed imports) → repair `45aca4adc` → fresh Tier-A `de8944011` → proportionate repair-delta IMPL-EVAL `PASS` at `f74695bc4` (comment 5301873258), full root `4152/0/19`. |
| `sdk-cache-surface-and-telemetry` | #1598, #1619, #1620, #1623, #1637 | `/home/codex/repos/netscript-007-leaf-sdk-cache` | `fix/sdk-cache-surface-and-telemetry` | `baf1cdf67` | Codex · `gpt-5.6-sol` · medium (`normal_implementation`) | `01a00516-2033-7ed3-936a-a616cee47447` (launched 2026-08-15T13:02:11Z, route **matched**) | [#1665](https://github.com/rickylabs/netscript/pull/1665) **draft** @ `0fed4d7ff`, `status:plan`, `MERGEABLE`/`CLEAN` | **IMPL-EVAL PASS — implementation complete, awaiting coordinator readiness/merge.** S1/S2/S3 each Tier-A PASS; IMPL-EVAL PASS at `9a26c107a` (artifact-only commit `0fed4d7ff` preserves the binding). Blockers are coordinator-owned: draft, `status:plan` label, 5 PR + 13 issue acceptance boxes, and a real (non-skipped) CI run after ready. Fresh leaf: no prior run-dir, thread, branch, or worktree existed, so no author was displaced. Worktree cut from `origin/main` at the #1661 merge commit; clean, no upstream. Sole author; **no implementation until PLAN-EVAL passes**. PLAN-EVAL is warranted rather than `N/A` (lane-policy 2026-08-08): #1619 asks to overturn a contract pinned by a passing test, #1620 chooses between a breaking type-level bound and a runtime bound, #1637 may need a public `QueryParams` opt-out. Expensive Aspire/Docker/E2E gates prohibited without a fresh coordinator lease. |

Every branch has no upstream by design. Pushes must use an explicit refspec. Exact observed route,
thread id, current head, and same-thread resume command are filled from the agentic launch records.

## Same-thread steering through the agentic suite

```bash
deno task agentic:codex-resume --thread-id 01a00516-2033-7ed3-936a-a616cee47447 --worktree /home/codex/repos/netscript-007-leaf-sdk-cache --message "<follow-up>"

deno task agentic:codex-resume --thread-id 01a0048d-61b0-76a2-8117-5f8ce0466495 --worktree /home/codex/repos/netscript-007-leaf-ai-mcp-pool --message "<follow-up>"

deno task agentic:codex-resume --thread-id 01a003f0-7821-7a10-a555-e619a9280479 --worktree /home/codex/repos/netscript-007-leaf-design-registry-drift --message "<follow-up>"

deno task agentic:codex-resume --thread-id 019ffcca-8bdc-7fb3-98c5-df90e2ae3b1f --worktree /home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep --message "<follow-up>"

deno task agentic:codex-resume --thread-id 019ffcca-8be0-74c2-bb0e-c82cf5ce3c85 --worktree /home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness --message "<follow-up>"
```

Do not send a second launch to either worktree. The agentic sender registry owns both worktrees for
the lifetime of these threads.
