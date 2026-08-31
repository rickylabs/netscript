# Internals topic checkpoint — supervisor rotation

Written 2026-08-31 at supervisor context exhaustion. **Ownership unchanged: `topic-internals-0.0.7`.**
Every thread below is LIVE or intentionally parked — **do not relaunch any of them.** Resume by
`codex-resume` on the recorded thread id, or read the recorded artifact.

Base of record: `main` = `eaea940bea4c19593b97b9895b09f512039f4e13`.

## Active leaves

| # | PR | Branch | Head (local == remote) | Thread | State |
| --- | --- | --- | --- | --- | --- |
| 1751 | #1802 | `fix/agentic-sender-lease-recovery` | `de24161b6b5bdee22fd942f6d776358e52eda2cb` | `01a054ff-9028-7333-a6f1-386b94308183` | **PARKED — open finding** |
| 1753 | #1823 | `fix/harness-cluster-state-liveness` | `930d37ea4d4d05e42728a3a59618ff4bd1b9b663` | `01a055b6-da11-7652-8942-c56deb75f3eb` (idle) | **Green, held behind #1820 seam** |
| 1827 | #1828 | `fix/cli-e2e-unstable-parity` | `1c08b8b0afe74c479bd0770c956204e7cad3a5bd` | `01a055f7-4afd-7922-bea7-f85136f59ceb` (idle) | **P0 — IMPL-EVAL RUNNING** |
| 1737 | none yet | `fix/skills-canonical-tree-refs` | `d338145da144f895d1696d77e25d161c7df3de61` | `01a055b6-e5ed-7e62-a47f-c8f278533a96` | **Author ACTIVE** (4 files dirty) |

## Immediate obligations for the next supervisor

1. **#1828 (P0, unblocks Features #1762)** — evaluator pid `1621621` running GLM 5.3 Flash/max
   against head `1c08b8b0a`, artifact due at
   `.llm/runs/fix-cli-e2e-unstable-parity--1827/impl-eval.md`, comment due on #1828. On PASS:
   ready-transition, fresh CI, packet. **Do not rerun the evaluator** — it is dispatched.
2. **#1823** — current-green (CI 7 SUCCESS/14 SKIPPED/0 FAIL at `930d37ea4`), IMPL-EVAL `PASS`,
   0 threads, sole `status:ready-merge`, 0 unchecked DoD. **Held behind the #1820 seam by owner
   instruction.** After #1820 merges: recut only the minimum current-main merge-ref CI, then surface
   the packet. Byte-identity of `validate-milestone-cluster.ts` (`23d2710ee…`) and its test
   (`1b07155e6…`) was already proven across the last merge, so **no evaluator rerun is needed**.
3. **#1751/#1802 — DO NOT SHIP.** All 7 slices are complete and its scoped gates are green
   (agentic 531/531, check/fmt/arch 0, lock unchanged), **but the root suite at `de24161b6` is
   `REAL_EXIT=1`, 4,463 passed / 1 failed / 19 ignored, and the single failure is NOT YET
   IDENTIFIED.** It appeared only after merging main (which lands #1792 routing into the same tree).
   Diagnosis was interrupted twice by higher-priority work. **This must be identified before #1802
   is treated as a candidate.**
4. **#1737** — author active on the resumed thread; boundary is `skills/**` + `.agents/skills/**`
   only. Needs PR opened with `Closes #1737` when it stops.

## Protected test ceilings (verify byte-identity before accepting any GREEN)

#1751 — six blobs, all verified intact through Slice 7:
`sender-ownership_test.ts=74b0ba6118ec4961ed50da639791fe52e3faa09a`,
`sender-lease-repair_test.ts=7be38302ac6ed20f29571213d18172283e1aded5`,
`local-sender-lease-repair-adapter_test.ts=2e2817d0c27628e0f9e1ca922c47ec35738102ce`,
`codex-thread-read_test.ts=d3ca0b51fcb87aeee81e4202e5f527ed569fba12`,
`agentic-runtime_test.ts=7113e271dfa15e9f2dc53b6922c4d5055e086430`,
`codex-resume_test.ts=546b5f0185876fd51c9b5ee28b57a19fe37562b7`.

## Queue (serial unless collision-checked; owner authorizes parallelism only for proven-disjoint slices)

Remaining unstarted: **#1543** (holds a `deno.lock` conflict with #1695 — serialize those two),
**#1695**, **#1351** (`status:plan`, needs its RFC-0001-Stage-3 plan read before an honest brief).
**#1429 is Aspire-owned** (PR #1744, `epic:aspire-13-5`) — labelled internals but not ours to execute.
**#1641 is coordinator-owned** — never edit or merge.

## Standing hazards learned this run — carry these forward

- **`pipe | tail` destroys exit codes.** Always `out=$(cmd); rc=$?`. This produced a false-green here.
- **A passing RED is a red flag.** Two false REDs occurred: one from a test edited between RED and
  GREEN, one from an uncommitted working-tree edit the test read from disk. **Verify RED by checking
  out the RED commit in a throwaway worktree**, not in the live tree.
- **`ps`/`pgrep -f` self-matches your own grep** and misses the real Codex child. Use rollout-file
  mtime plus `git log`, or `/proc/<pid>/cwd`.
- **Authors stall after completing work but before committing** (happened 3×). Assess the working
  tree before assuming failure; verify ceilings, then commit on their behalf with attribution stated.
- **"docs-only" main advances are often not** — several carried product source and generated corpora.
  Always diff before believing a characterization, and prove corpora freshness with `check:` variants
  rather than inferring it from a clean merge.
- **A stale MCP server is latent**: `007-internals`'s hybrid server (pid `5901`, parent `5498` — the
  OTHER Remote Control session) still serves pre-#1792 code and rejects GLM/Qwen. Code side is fixed
  and pushed (`6dfba5c1c`); the process restart is owned by that client, not by us. Evaluators
  dispatched via `agentic:claude-openrouter` from leaf worktrees are unaffected.
