# Exact three-arrival runtime proof — captured evidence (#1839 / PR #1846)

Executed 2026-09-01 by the Internals topic supervisor after the coordinator's release ruling
("serialize immediately after the currently running #1858 hosted retry completes") and the gate3
drain proof. Sections track `exact-runtime-proof-procedure.md`.

## §1 Release and drain precondition

- Owner release: coordinator ruling, conditioned on #1858's hosted retry completing.
- Gate3 at release: `1858_real_terminal_tier_jobs=2/2 (run 33541672224) active_runtime_tier_jobs=0`.
  Terminality required a `success|failure` conclusion — `cancelled` is explicitly **not** terminal,
  which is the very defect #1839 fixes and which produced an earlier false positive in gate2.
- Immediately before release: `e2e-cli` active runs = **0**, captured `DRAIN_API_REAL_EXIT=0`;
  neither `scaffold-runtime (aspire + docker + postgres)` nor
  `scaffold-runtime-sqlite (aspire + sqlite + garnet)` was `requested|waiting|pending|queued|in_progress`.
  API response preserved.

## §2 Frozen base and heads

`PROOF_BASE_SHA = e0f5f4db76d757111e3cc0191fc117bd4530477c`

| Arrival | Branch | Frozen head | Remote ref equals |
| --- | --- | --- | --- |
| A | `test/e2e-runtime-queue-proof-1839-a` | `5ccece39af3a097f5938cfa1766dc5beb6dfd35c` | yes |
| B | `test/e2e-runtime-queue-proof-1839-b` | `40b379da582c1d4a0e7655dd1994041994d7ce30` | yes |
| C | `test/e2e-runtime-queue-proof-1839-c` | `51aa69d3de1fa8740ed93a997a25944c09dd5dc6` | yes |

Each branch is **exactly one commit** over the base and **exactly one file**
(`apps/e2e-runtime-queue-proof-1839/arrival-<x>.txt`), pushed **exactly once**. No `packages/**` or
`plugins/**` path is touched.

Fail-closed classifier preflight over `decide()` — captured exit **0** for all three:

```
runStatic=true runRuntimeSqlite=true runRuntime=true needsDocker=true needsDesktop=false docsOnly=false
```

## §3 Draft PRs, gate withheld

PRs **#1901 (A)**, **#1902 (B)**, **#1903 (C)**, base `ci/e2e-runtime-concurrency-queue`,
milestone `0.0.7`, labels `e2e-cli-gate, type:test, area:tooling, priority:p1, status:impl,
impl-eval:skip` — exactly one `status:`, and none of `ci:skip-e2e`, `ci:skip-scaffold`, `ci:full`,
`desktop-native-gate`. Bodies are evidence-only, carry `Refs #1839`, and **no closing keyword**.

Draft preparation dispatched **no runtime work**, as §3 requires. Label and milestone events did
create `e2e-cli` runs, and **every** `scaffold-runtime` / `scaffold-runtime-sqlite` job in every one
of them was `skipped` — verified job-by-job across all pre-arrival runs on all three branches, not
inferred from the run-level conclusion.

## §4 The three arrivals

The ready transition was the **only** arrival action — no label or branch change accompanied it.

| PR | Ready at (UTC) | Run ID | `head_sha` == frozen head | Status at capture |
| --- | --- | --- | --- | --- |
| #1901 A | 20:26:44Z | `33555354945` | **yes** | `in_progress` |
| #1902 B | 20:26:46Z | `33555358395` | **yes** | **`pending`** |
| #1903 C | 20:26:48Z | `33555360909` | **yes** | **`pending`** |

- `max(created_at) - min(created_at)` = **4.0 s** (bound: ≤ 60 s).
- **Exactly one run per branch** — no second run and no redispatch substituted for an evicted first
  run.
- **B and C are `pending`, not `cancelled`.** This is the observable inversion of the defect: under
  the previous default concurrency the second arrival evicted the first and the third evicted the
  second, so two of three runtime gates never executed while the workflow still reported a
  non-failing state. Deferral is now visible as `pending` on the original run and head SHA.

## §5–§7 pending

Six tier jobs must reach genuine terminal conclusions; serialization is then asserted from **API job
timestamps**, not workflow configuration, with `overlap_count: 0` reported separately per tier, and
head immutability re-proved against run, PR, and raw `git ls-remote` refs plus a `synchronize`-event
sweep. A real test failure remains distinguishable evidence that the gate ran — it is not merge
readiness and will be reported plainly.

---

## §5 Both runtime tiers reached genuine terminal conclusions — SATISFIED

All **six** tier jobs completed with conclusion `success`. None was `cancelled`, `skipped`,
`neutral`, `startup_failure`, or missing.

| Arrival | Run | Job | Tier | Conclusion | Started | Completed |
| --- | --- | --- | --- | --- | --- | --- |
| A | `33555354945` | `100014827074` | Docker | **success** | 20:27:11Z | 20:34:28Z |
| A | `33555354945` | `100014827001` | SQLite | **success** | 20:27:11Z | 20:33:25Z |
| C | `33555360909` | `100014849315` | Docker | **success** | 20:34:31Z | 20:42:38Z |
| C | `33555360909` | `100014849426` | SQLite | **success** | 20:33:28Z | 20:40:17Z |
| B | `33555358395` | `100014873724` | Docker | **success** | 20:42:41Z | 20:51:11Z |
| B | `33555358395` | `100014874060` | SQLite | **success** | 20:40:20Z | 20:46:30Z |

## §6 Serialization asserted from API job timestamps — `overlap_count: 0` on both tiers

Evaluated per tier independently, from `started_at`/`completed_at` returned by the API — **not** from
the workflow's concurrency configuration, which is the claim under test and cannot be its own
evidence.

**Docker tier** — A `→` C `→` B, each start after the previous completion:
`20:34:28Z → 20:34:31Z` (3 s), `20:42:38Z → 20:42:41Z` (3 s). **`overlap_count: 0`**

**SQLite tier** — A `→` C `→` B:
`20:33:25Z → 20:33:28Z` (3 s), `20:40:17Z → 20:40:20Z` (3 s). **`overlap_count: 0`**

At most one job per runtime tier executed repo-wide throughout. Admission followed FIFO **wait
order** (A, then C, then B), which is not arrival index — the acceptance property is non-overlap, not
ordering, and the sub-4-second handoffs show the mutex releasing directly into the next waiter rather
than a gap that could conceal a re-dispatch.

## §7 Head immutability after deferral — ALL THREE HOLD

| Arrival | PR | Run `head_sha` | PR head | Raw `git ls-remote` | Frozen head | `synchronize` events after ready |
| --- | --- | --- | --- | --- | --- | --- |
| A | #1901 | `5ccece39a` | `5ccece39a` | `5ccece39a` | `5ccece39a` | **0** |
| B | #1902 | `40b379da5` | `40b379da5` | `40b379da5` | `40b379da5` | **0** |
| C | #1903 | `51aa69d3d` | `51aa69d3d` | `51aa69d3d` | `51aa69d3d` | **0** |

B and C waited **13** and **6** minutes respectively before admission and executed on the identical
commit they were created with. No push, force-push, branch update, empty commit, or manual rerun was
used at any point — deferral required no head movement, which is the property that distinguishes this
fix from a redispatch-based one. A redispatch fix would have traded a CI defect for an evidence
defect.

## Result

All five acceptance boxes of #1839 are now satisfied by executed evidence. The previously deferred
box 1 is the one this run establishes: **three `e2e-cli-gate` PRs arrived within 4.0 s, all six
runtime-tier jobs executed to real `success` conclusions, and zero jobs were `cancelled`.**
