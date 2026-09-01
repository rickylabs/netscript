# Aspire 13.5 — restack sequence + Phase-B manifest

Reconciled against live `origin/main` **`d2b33a09b`** on 2026-09-01. Every base and every conflict
below is **measured by a completed trial `rebase --onto` in a throwaway worktree**, not inferred.
Substitute the two fix SHAs and each slice's *actual* new parent head at dispatch time, and
**re-fetch `origin/main` immediately before every step** — it moved three times inside one replay on
2026-09-01.

## 0. Preconditions

- **`#1865`** (flow-B fixture — locate workers block semantically; closes issue **#1863**) merged —
  SHA `__SHA_1865__`.
  *Naming correction:* the earlier manifest listed `#1863`, which is the **issue**. The PR is
  **#1865** (`fix/flow-b-fixture-plugin-marker`). Substituting an issue number here would have
  produced a non-existent SHA.
- `#1858` (Garnet readiness determinism) merged — SHA `__SHA_1858__`
- Coordinator grants the single serialized runtime lease
- Preflight: `aspire ps` `[]`, containers 0, custom networks 0, volumes = the one known foreign
  `d33e5c2e…` (**foreign residue is left untouched; the proof is "unchanged", not "zero"**)

Live gate status at reconcile: **#1858 is CLEAN/MERGEABLE with all 21 checks green** — it is waiting
on the coordinator's merge action, not on work. **#1865 is the real gate**: `UNSTABLE`, with
`close-gate` FAILURE and `scaffold-runtime` FAILURE on **both** tiers. Both are Fixes-owned; this
lane does not touch them.

## 1. Restack order — dependency-exact, trial-verified

Each command replays **only that slice's own commits**. A plain `rebase origin/main` on any stacked
slice replays its parent's commits a second time.

| # | Slice | PR | Current head | `--onto` target | Branch point | Own commits |
| - | ----- | -- | ------------ | --------------- | ------------ | ----------: |
| 1 | S8 | #1754 | `7c6522951` | `origin/main` | — (behind main by docs/RFC commits only) | 26 |
| 2 | S9 | #1759 | `a8cf585b0` | S8 final | `d1c6d8b54` | 14 |
| 3 | S10 | #1760 | `21a0bfec6` | S8 final | `d1c6d8b54` | 13 |
| 4 | S11 | #1771 | `abe0fd6cc` | S10 final | `c9e3fcbe8` | 13 |
| 5 | **S13** | #1779 | `9b684e176` | **S10 final** | **`c9e3fcbe8`** | **9** |
| 6 | S7 | #1744 | `bd3dbc843` | `origin/main` (independent) | `bd9d463b4` | 17 |
| 7 | #1747 | #1747 | `2032d4ed7` | `origin/main` (independent) | `71d5fb8e0` | 15 |

```
# 1  S8 top-up
git fetch origin main && git rebase origin/main

# 2,3  S9 and S10 — siblings off S8, run in PARALLEL
git rebase --onto <S8-final> d1c6d8b54

# 4,5  S11 and S13 — siblings off S10, run in PARALLEL
git rebase --onto <S10-final> c9e3fcbe8

# 6,7  independent leaves
git fetch origin main && git rebase origin/main
```

**Ancestry assertion per slice** — assert against its **parent**, never `origin/main`, for stacked
slices: `git merge-base HEAD <parent-final> == <parent-final>`.

### 1a. S13 base CORRECTED — the previous entry would have duplicated 24 commits

The prior manifest recorded S13 as **independent**, `--onto main`, branch point `8a9257642`, **33**
own commits. That is wrong, and using it would have replayed S8's *and* S10's commits a second time
onto main — exactly the D-208 trap this document warns about one line above.

`8a9257642` **is** on main lineage, which is what made the "independent" reading look safe. But the
33 commits between it and S13's head are not all S13's:

| Commits | Owner | Evidence |
| ------- | ----- | -------- |
| 1–13 (`be7854bf5`…`bc838a0b3`) | **S8** | typed db resource commands, "S8 reconstruction evidence", and S8's own `.llm/runs/feat-aspire-13-5-s8-…--impl/` artifacts |
| 14–24 (`08e0804a8`…`c9e3fcbe8`) | **S10** | structured E2E gate contracts, doctor/describe-follow, cleanup ownership, "blocked S10 unstack" |
| 25–33 (`7bd5a0018`…`9b684e176`) | **S13** | stale-surface contracts, D-17 telemetry resolver, parity phase 2, MCP export corpus |

They are **rewritten copies** (different SHAs), which is why `merge-base --is-ancestor` reports that
S13 does not contain the current S8/S10 heads — and why an ancestry check alone did not catch it.

So S13's real branch point is **`c9e3fcbe8`** — the last S10-lineage commit in its chain, and the
**same base S11 already uses**. S11 and S13 are siblings off S10, which restores exactly the DAG
`lane-queue.md` has always recorded: **S8 → {S9, S10} → {S11, S13}**. The "independent"
reclassification was the error; the original DAG was right.

**Consequences of the correction, all measured:**

- S13's own work is **9 commits / 65 files**, not 33 / 150.
- S13 **no longer touches** `generate-register-tools.ts` or `generators-tools-db-index_test.ts`.
  Those were the duplicated S8 commits. The apparent "S13 vs A6" collision, and an apparent need to
  re-express 8 stale `prisma_studio_*` markers as `tool_0*`, were **artifacts of the wrong base** and
  do not exist in S13's own work.
- S13's conflict count drops from *three non-generated source files* (three would-be aborts) to
  **one generated carrier**.

## 2. Expected conflicts — every one now measured, not predicted

Each row below is the result of a **completed** trial `rebase --onto` in a throwaway worktree
(removed afterwards; no PR was touched, no runtime resource used).

| Slice | Own | Conflict stops | File(s) | Class | Ruling |
| ----- | --: | -------------: | ------- | ----- | ------ |
| S8 top-up | 26 | **0** | — | — | merge-tree probe is CLEAN against every main observed this session (`d2b33a09b`, `1e53e731a`); the intervening commits are docs/RFC only. Re-probe at dispatch rather than trusting a `behind` count — main moved five times during this reconcile. |
| S9 | 14 | **1** (commit 3/14) | `packages/cli/src/kernel/assets/embedded.generated.ts` | generated carrier | take upstream, **regenerate once at the end** |
| S10 | 13 | **2** (commits 2/13, 3/13; same file) | `packages/cli/e2e/…/runtime/verify-typed-db-phase-b.ts` | non-generated — **pre-ruled**, see 2a | canonical `./verify-listener-readiness.ts` wins |
| S11 | 13 | **0** | — | — | replays clean end-to-end |
| S13 | 9 | **1** (commit 3/9) | `packages/mcp/src/publish-assets.generated.ts` | generated carrier | take upstream, regenerate once |
| S7 | 17 | **1** (commit 3/17, one region) | `.llm/tools/agentic/teardown/teardown.ts` | non-generated — **pre-ruled**, see 2b | additive: both sides survive |
| #1747 | 15 | **0** | — | — | replays clean end-to-end |

**The standing rule "any non-generated source conflict → abort and report" still holds for anything
not listed in 2a/2b.** Those two are pre-ruled precisely so a dispatched agent does not abort three
times on collisions that are already settled by shipped-contract precedent.

### 2a. S10 — D-101 listener path (pre-ruled, not an abort)

S10's branch still imports the listener readiness module from `./evidence/listener-readiness.ts`;
the shipped canonical location is `./verify-listener-readiness.ts`, alongside
`listener-fault-controller.ts` and `listener-unreachable-fixture.ts`.

This is the **existing D-101 standing rule** — *shipped contracts win and consumers adapt forward* —
so: **take the parent (HEAD) side at both stops.** S10's own later commit
`f1e601160 fix(e2e): restore canonical listener readiness module after unstack` intends exactly this
end state; resolving toward canonical makes that commit partly a no-op and correctly deletes
`evidence/listener-readiness.ts`. Verified: after both stops the remaining 10 commits replay clean.

### 2b. S7 — #1840 task-separator contract (pre-ruled, not an abort)

Main commit `3b6386e14` (**#1840**, accept documented task separator in agentic launchers) touched
`teardown.ts` — S7's core file — after S7 was cut. This is why #1744 flipped to
`CONFLICTING/DIRTY`; it was clean when the previous manifest was written.

The collision is **one region in the `parseArgs` signature**, and the two sides are **additive, not
contradictory**:

- main adds `args = normalizeTaskArguments(args);` and drops the hand-rolled `if (args[i] === '--')`
  skip;
- S7 widens the return type with `forcePersistent: boolean`.

**Ruling — keep both:**

```ts
): {
  sliceDir: string;
  worktreeRoot: string;
  apply: boolean;
  forcePersistent: boolean;
  ownedRoots: string[];
} {
  args = normalizeTaskArguments(args);
```

Verified after resolution: S7 hand-skips `'--'` in **0** places, so the normalizer solely owns
separator handling with no duplicated logic, and commits 4–17 replay clean.

## 3. Verdict-carry rule

Re-run a bounded delta IMPL-EVAL **only where evaluated product bytes changed**. Carry an existing
verdict **only when blob identity proves it exact** — per file,
`git rev-parse <old>:<path>` vs `git rev-parse <new>:<path>`, over that slice's **own** changed-file
set. Range-diff `=` is **not** sufficient. **Absent-on-both counts as identical** (deletions), or
every deletion reads as a change forever.

**S7's carry is already computed** from the trial restack (`bd3dbc843` → trial head), over its 112
own files: **110 identical, 2 differ** — `teardown.ts` (the 2b resolution) and `leak-check.ts`
(auto-merged against main). So S7's existing PASS carries for 110/112, and the delta IMPL-EVAL scope
is **exactly those two files**. Recompute against the real post-fix head before relying on it.

## 4. Phase B — exactly four receipts needed

`#1720`'s six acceptance boxes: **A3 and A6 are already satisfied statically**, **re-verified at the
current S8 head `7c6522951`** (the earlier proof was taken at `854e45cb8`, which the force-push made
a non-ancestor — a static proof does not survive a head move and had to be retaken):

- **A6** — `PROCESS_COMMANDS_FLAG` → **0** files in `packages/cli/src`; `maybeWithProcessCommand` →
  **0** files in `packages/cli`. The single remaining `Aspire 13.4` hit is
  `render-ts-apphost.ts:81`, a **tsconfig-validation** comment, not the seam's — A6 says "the seam
  and *its* comment", so A6 is satisfied. That leftover is a stale version-bound claim owned by
  **S13 (#1724)**.
- **A3** — `.excludeFromMcp()` asserted in `generate-db-cli-mode_test.ts` (exact-count **and**
  placement assertions), `generated-helpers-compile_test.ts`, and `generators-tools-db-index_test.ts`.

The single serialized lease must therefore produce **only these four**:

| Box | Receipt required |
| --- | --- |
| A1 | `aspire resource <db>-cli --help` lists typed commands with argument docs |
| A2 | `aspire resource <db>-cli migrate --timeout 60` succeeds; `reset` without `--confirm true` refuses |
| A4 | `netscript db init` against an Unhealthy-but-Running Postgres exits within timeout |
| A5 | `scaffold.runtime` green on **both tiers**; no second AppHost spawned during `db` ops |

Also required in the same pass:

- **#1719 A1/A2** (S7): live kill receipt + foreign-AppHost preserved — captured once at
  `bd3dbc843`. **That head does move** (2b), so these two **must be re-verified**; the earlier
  "re-verify only if that head moves" condition is now met.
- **#1747**: the one remaining DoD box — hosted `scaffold.runtime` evidence. Its `database.seed`
  passes; its only failure was `runtime.wait.garnet`, i.e. #1858.

## 4a. Process-lifetime constraint on the lease — measured, and it changes how the pass is run

**Neither harness execution mode can host a long-running gate.** Foreground Bash caps at 10 minutes.
Background tasks are killed at **unpredictable** times — the same 480 s watcher script exited cleanly
on one run and was killed at **~6.5 minutes** on the next — arriving as `status: killed` with an
**empty** output file and no error.

**A `setsid`-detached process is unaffected.** A detached probe (`ppid=1`, own session id) **survived
the very kill event that took down a concurrently running background task**, and kept running past
it. That is the mechanism the lease must use.

**Recipe for the single serialized pass:**

1. **A5 stays on hosted CI.** `scaffold.runtime` on both tiers is a CI receipt, not a local one — it
   is far longer than any local execution window and hosted CI is already its authority.
2. **Start the AppHost detached**, never inside a reapable tree:
   ```
   setsid nohup bash -c '<aspire start …>' >/dev/null 2>&1 </dev/null & disown
   ```
   Confirm `ppid=1` and a distinct session id via `/proc/<pid>/stat` before probing.
3. **Run A1, A2 and A4 as separate short foreground calls** against the already-running AppHost —
   `aspire resource <db>-cli --help`, `migrate --timeout 60` plus the `reset` refusal, and
   `netscript db init` against Unhealthy-but-Running Postgres. Each is short; none needs to hold the
   AppHost open itself.
4. **Stop the AppHost explicitly.** A detached process is *not* cleaned up for you — a forgotten one
   is exactly the leak this run has been fighting.
5. **Tee every step to a log file.** The harness's own output is empty on a kill, so the log is the
   only evidence that survives one.

**If step 2 were skipped** and the AppHost ran inside a background task, an unpredictable kill would
terminate it mid-lease and strand its containers — the #1855 leak class, during the one pass that is
supposed to prove cleanliness.

Scripts under the scratchpad must be invoked as `bash <path>`: it is mounted **`noexec`**, so
`chmod +x` does nothing and a direct exec fails with `Permission denied`.

## 5. Lease release — proof shape

1. `aspire ps --format Json` → `[]`
2. `docker ps -aq` → 0
3. `docker volume ls -q` → **the known foreign volume only, unchanged**
4. `docker network ls` → `bridge`, `host`, `none` (+ any pre-existing foreign network **unchanged**)
5. `agentic:leak-check` output pasted

**Never remove a foreign or unknown-owner resource.** The exact-AppHost cleanup destroyed one on
2026-09-01 (#1855); until that lands, verify the foreign set by hand rather than trusting the
suite's own cleanup gate, which reported PASS while the network was being removed.

## 5a. Merge order — S8 first, and the rest do not go without it

Coordinator ruling: **S8 (#1754) merges before S9–S13**, after consuming the Fixes baseline merge and
passing its own Phase B. The chain's shape makes this mandatory rather than merely preferred — S9 and
S10 are based on S8's branch, and S11 and S13 on S10's, so any other order either duplicates S8's
commits onto main or strands the stack.

Order, with each slice's gating condition:

| # | Slice | PR | Gated on |
| - | ----- | -- | -------- |
| 1 | **S8** | #1754 | Fixes baseline merge (#1865 + the workers marker leaf) → consume → **its own Phase B** |
| 2 | S9 | #1759 | S8 merged; retarget base → `main`; bounded delta eval over its 5 product Δ |
| 3 | S10 | #1760 | S8 merged; retarget base → `main`; bounded delta eval over its 5 product Δ |
| 4 | S11 | #1771 | S10 merged; **no delta eval** — carry proven 24/24 blob-identical |
| 5 | S13 | #1779 | S10 merged **and S9 merged** (its boxes 1–2 need S9's skills corpus on main) |
| — | S7 | #1744 | independent of the chain; needs #1719 A1/A2 re-taken (its head moved) |
| — | #1747 | #1747 | independent; only its hosted-runtime DoD box, gated on the same baseline |

**#1865's integrated head `03def015b` is green on both hosted runtime tiers** (run `33534193166`), so
the consume step is a rebase onto the post-merge main, not a repair.

**Consume/rebase recipe at merge time** — re-fetch first; main has moved on every single pass:

```
git fetch origin main
# S8 first, alone:
cd <s8-worktree> && git rebase origin/main
#   re-gate: A6 grep (0/0), A3 assertions, check:assets-barrel, scoped deno check
#   re-prove carry: per-file blob identity over S8's own set vs the evaluated head
# only after S8 lands on main:
cd <s9-worktree>  && git rebase --onto <S8-final> <prev-S8-final>
cd <s10-worktree> && git rebase --onto <S8-final> <prev-S8-final>
cd <s11-worktree> && git rebase --onto <S10-final> <prev-S10-final>
cd <s13-worktree> && git rebase --onto <S10-final> <prev-S10-final>
```

**Do not retarget any PR base to `main` before its parent has actually merged** — a base retarget on an
unmerged parent makes the diff show the parent's commits as this slice's own.

## 6. Then

Tier-A delta review → supervisor-dispatched independent IMPL-EVAL (checked-in
`agentic:claude-openrouter` route; **never** infer evaluation from a `status:` label) → acceptance
mirror dry-run **before** `status:ready-merge` → threads answered → current CI → merge packet.
