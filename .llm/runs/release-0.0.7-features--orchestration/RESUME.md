# RESUME CHECKPOINT — features orchestrator (rewritten 2026-09-02 ~16:30Z)

## Identity and authority

| Thing | Value |
| --- | --- |
| Route | **Claude · `claude-fable-5-1` · low** · Remote Control attached · supervise-only · **never merges** (primary coordinator merges) |
| `origin/main` | **`850cc7757`** — moves fast, always re-fetch |
| Topic branch | `orchestrator/release-0.0.7-features`, worktree `007-features` |
| Eval routes | IMPL: `status:impl-eval` label cycle → OpenHands GLM · max. PLAN: **native Fable 5 · medium subagent** (OpenHands qwen is rate-limited upstream and pinned for the plan phase; the native lane is the policy default anyway) |

## Owned queue — every issue has a vehicle or a named, measured dependency

| Issue | State |
| --- | --- |
| #1349, #1352 | **CLOSED** via #1936 / #1931 (mirror ticked all boxes) |
| #1897 | **CLOSED** via #1918 |
| #1353, #1467 | merged (#1921, #1922) but **open, 7 unticked boxes each** — combined closeout audit running on `chore/sdk-client-s6-s7-closeout` (worktree `007-leaf-s6s7`); it carries `Closes` only for issues whose 7 rows it can defend |
| #1590 | PR **#1895** `d0bf0aebf` — `status:ready-merge`; exact-head `fresh-browser` green, IMPL-EVAL PASS, `close-gate` pass; runtime tiers are Aspire-lane flake (see below) |
| #1355 / #1360 | PR **#1664** `d155db116` — every branch-owned gate green; **sole red is #1845** in both tiers; routed (b) |
| #1354 | plan PR **#1891** `ae6e09caa` — **`PASS_PLAN_WITH_FINDINGS`**, amendment applied (HIGH-1 under settled D4, no re-gate); **Slices A/B gated on #1664 merge/rebase** |
| #1452 | Slice 2 merged (#1842); later slices remain; no worker |
| #1348 | epic — receives no leaf PR by design |

## The single remaining merge-packet gate on #1664

**#1845** ("generated showcase island never hydrates") cannot be waived by label per coordinator
ruling. Route (a) — prove the *generated* island hydrates — is not reachable from a focused fixture:
#1664's `query-hydration-age_browser.ts` proves the **framework** path hydrates (all four #1845
signals true), not the scaffold's emitted artifact. **The probe that observes #1845 exists only on
#1664's branch**, so no clean-main run has ever produced the comparable observation. The unblocking
experiment, posted to #1845: scaffold with **clean main's** CLI, run **#1664's** probe against it.
One hosted `scaffold.runtime` attempt; not this lane's to spend.

## Live workers

| Worktree | Thread | Slice |
| --- | --- | --- |
| `007-leaf-s6s7` | see `slices/s6s7/codex-thread-ids.md` | #1353/#1467 closeout audit |
| `007-leaf-1664` | `01a0585d-94e1-70b0-a1c2-6f9654179b0e` | idle; resume for any #1664 follow-up |
| `007-leaf-1354` | `01a05dc7-d630-7cc2-b155-2b150754d53c` | idle; resume for Slice A/B briefs |
| `007-leaf-1590-s2` | `01a060be-6b53-7962-88a2-f80a51a4010a` | idle |

## Mechanisms learned today — do not relearn

1. **Phase evals are label-triggered.** PLAN: `openhands` + **`status:plan-eval`**. IMPL: cycle
   **`status:impl-eval`** (or `ready_for_review`). `status:plan` triggers nothing. A hand-posted
   `dispatch-openhands --phase` can never carry the workflow's claim marker →
   `phase-generation-lookup-exhausted`. Runs API returns the un-interpolated name `"Phase eval PR"`.
2. **An acceptance-evidence block is inert without a closing keyword** — the mirror iterates the
   PR's *closing* issues. Sequence: verdict → `status:ready-merge` → rerun existing CI at the
   **unchanged** head → mirror ticks boxes → close-gate green. Never hand-tick, never push to retrigger.
3. **Two gates arrived on `main` mid-flight**: `check:mcp-export-corpus` inside `quality` (#1929)
   and README fence integrity (#1925, baseline now **7** after #1935). Every convergence must
   regenerate the corpus; every README fence must compile. A converged head re-runs the *current*
   gate set.
4. **Diff a leaf against its own base, not against a moved `main`** — and never truncate the
   touch-set read on a 160-file branch. Both produced confident wrong attributions today.
5. **Aspire runtime tiers are nondeterministic**: five failure modes across four branches touching no
   Aspire path, each also seen passing at an unchanged head. Attribute off feature PRs with evidence;
   exclusion of #1844/#1880 requires same-failure-on-main **and** delta-not-touching-paths.
6. Launchers block for the child's lifetime — always `setsid nohup … &`; recover by **resuming the
   same thread**. `--slice-dir` must exist; `--slug` hardcodes `/home/codex`, pass `--dest`.

## Standing rules

- Serial queues apply only within this orchestrator; exploit disjoint parallelism; no idle waits
  on routine decisions.
- Hand every **exact-green** packet to the primary coordinator immediately; withdraw
  `status:ready-merge` when a head moves without green evidence, restore on green.
- Closing keyword only when the issue is complete; never on the #1348 epic.
- Keep dispatching until every Features issue is merged and stable 0.0.7 is cut.
