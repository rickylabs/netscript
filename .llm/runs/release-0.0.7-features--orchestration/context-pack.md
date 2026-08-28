# Context pack — release-0.0.7 features topic supervisor

**Status: the #1664 lane is PARKED at a terminal FAIL_FIX checkpoint. No retry is authorized.**

Resume by reading this file, then `worklog.md` (2026-08-23 entries) and `drift.md` D-19/D-20.

## Where the lane stands

| Field | Value |
| --- | --- |
| Active leaf | PR **#1664**, `feat/app-service-client-wiring`, OPEN **draft** |
| Parked evidence head | `a257807d883ac9cd8d692d441bba1760290d4dab` |
| Product content head | `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c` |
| Leaf worktree | **GONE** (D-21) — swept after park; recreate at `a257807d8` to resume |
| Central close/release | `164c39241` `chore(harness): close #1664 runtime attempt 7` |
| Verdict | **FAIL_FIX** — cheap evidence green, runtime red |
| Closes | `#1355`, `#1360` |

## The one-paragraph version

F8 bounded the two unbounded CDP transport waits (`CdpClient.connect`, `CdpClient.send`) at 20 s
behind an injectable socket seam, with separately attributable diagnostics. Every cheap gate is green
at the content head and two fresh Tier-A reviews passed. The single leased `scaffold.runtime` attempt
7 still ended red — but red *differently*: 68/1/0 at 60,134 ms with a named stack trace, instead of
attempt 6's silent SIGTERM kill at 900,030 ms. Neither CDP bound fired, so F8 bought
**attributability**, not a fix, and the remaining stop is page behavior (the optimistic `Seed User*`
row never appears after Rename), not transport. The coordinator withheld IMPL-EVAL while the runtime
gate is red and authorized no retry.

## Green evidence at content head `4f50b5a02`

Focused probe file **25 passed / 0 failed**. `check`, `test` (4,240 passed / 0 failed),
`publish-dry-run`, `arch-check`, `lint`, `fmt-check` — all exact-head `PASS`, every receipt
`gitHead == actualGitHead`. Sufficiency recomputed `SUFFICIENT`, zero reasons, over the **explicitly
named** four-receipt attempt-2 set — never a glob. No `any`, `deno-lint-ignore`, or `as unknown as`
introduced. Attempt-1 receipts retained append-only.

## Red evidence — attempt 7

Exit `1`, **68 passed / 1 failed / 0 skipped**, sole red `behavior.service-client-refetch` at
`60,134 ms`. Stops at `waitUntil :623` → `waitForExpression :610` →
`collectBrowserRefetchEvidence :286`. Raw artifacts in `reports/`, SHA-256 recorded, hashes verified
after copy. **`fresh-browser` NOT_RUN** — the lease conditioned it on a `scaffold.runtime` PASS.

**Do not restate this as "F8 fixed the hang."** Zero CDP diagnostics fired; there is no evidence a
CDP wait was ever attempt 6's stopping stage. The corrected PR body preserves that caveat — keep it.

## Standing prohibitions

No retry of `scaffold.runtime`. No `fresh-browser`. No evaluator or IMPL-EVAL dispatch. No product or
test mutation. No label, readiness, merge, publish, metadata, or issue mutation. No lease. No next
features leaf from this lane. All prior quarantines, the seven S5 attempt histories,
`receipts/f6-test.json`, and `receipts/f7-test.json` are append-only.

## Resource state at park — all classes empty

unreadable `0` · processes in execution worktree `0` · Docker containers `0` · runtime ports `0` ·
`leak-check` aspire `ok` / docker `ok` / survivors `[]`. Execution worktree removed and pruned.

Quarantine `/tmp/netscript-s5-a7-quarantine.Cy2tNS` is **gone** — reaped by the 2026-08-28 10:44
host reboot, not deleted by this lane (D-21). It held only regenerable scaffold data; no unique
evidence was lost. The "recoverable" claim in the park record is corrected in D-21.

Re-verified 2026-08-28: Docker `0` containers / `0` running, no `aspire-managed`/`apphost`/`chrome`/
`dcp` process. The 5 `aspire mcp start` processes are pre-existing foreign MCP servers.

## Carried observations — none blocking, all for a later leaf

- **R1** `terminateBrowserProcess` `:448-449` awaits `child.status`/`drain` after SIGTERM with no
  timer. Attempt 7 supplied a live instance of the hazard class: three orphans ignored SIGTERM.
- **R3** the 20 s bound on `Runtime.evaluate` narrows one theoretical slow-but-successful case; the
  intended trade.
- **R4** `pendingCommandCountForTest` is a contained test-only accessor — `e2e/` is excluded from the
  `@netscript/cli` publish set, `@netscript/cli-e2e` is `"publish": false`, `e2e/mod.ts` does not
  re-export the probe.
- Two editorial notes carried from the #1502 IMPL-EVAL (`rfcs/0000:213`, `:918`) — fold
  opportunistically if a later leaf touches that RFC.

## Open drift

D-1, D-2, D-3, D-5, D-6, D-7, D-8, D-10, D-12 carried from earlier phases.
**D-22** — `main` is now `c73d361ee`; the leaf is 10 behind. Three landed SDK commits touch the
cache/query/service-client surface the attempt-7 red implicates (notably `0ef48c2ec`, cached-entry
fast path vs stale policy). Attempt 7 is evidence about base `3fc0f2f92`, **not** about current
`main`. Causation is unproven and untestable without an unauthorized retry.
**D-21** — leaf worktree and quarantine lost to reboot/sweep; all durable evidence intact on origin.
**D-19** — supervisor host audits must not write into the leaf worktree; point `--slice-dir` at a
supervisor-owned path. Honored throughout attempt 7; the leaf's `leak-report.md` was never
regenerated.
**D-20** — `cleanup.aspire-stop` PASS plus `leak-check survivors: []` is **not** a complete residue
verdict; add a cwd-containment process sweep and an unreadable-directory scan.
D-4, D-11 closed.

## If you resume this lane

1. **Recreate a checkout** — the leaf worktree is gone (D-21). `git worktree add <path>
   feat/app-service-client-wiring`, expect `a257807d8`.
2. **Settle the rebase question first** (D-22). The attempt-7 red predates three SDK cache/query
   fixes on `main`, one of which governs stale-vs-fastpath — the same mechanism the red implicates.
   Re-running the old base would answer a question nobody is asking.
3. The open product question is why the optimistic `Seed User*` row never appears after Rename. That
   needs a plan, a PLAN-EVAL, and a fresh lease — none of which exist, and none of which this
   supervisor may grant itself.
