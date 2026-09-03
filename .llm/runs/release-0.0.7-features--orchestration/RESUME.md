# RESUME CHECKPOINT — features orchestrator (rewritten 2026-09-02 ~16:30Z)

## Identity and authority

| Thing | Value |
| --- | --- |
| Route | **Claude · `claude-fable-5-1` · low** · Remote Control attached · supervise-only · **never merges** (primary coordinator merges) |
| `origin/main` | **`262aa8fbe`** (#1895) — moves fast, always re-fetch; every convergence regenerates the corpus |
| Topic branch | `orchestrator/release-0.0.7-features`, worktree `007-features` |
| Eval routes | **Native Fable 5 subagent first** for both PLAN and IMPL — it writes `evaluate.md` itself (commit it as the receipt). The OpenHands lane lost 3/3 parsed PASSes today (`Expected exactly one changed evaluate.md; found 0`, reported on #1894); use it only for explicitly cloud-driven work |

## Owned queue — every issue has a vehicle or a named, measured dependency

| Issue | State |
| --- | --- |
| #1349, #1352 | **CLOSED** via #1936 / #1931 (mirror ticked all boxes) |
| #1897 | **CLOSED** via #1918 |
| #1353, #1467 | **CLOSED** via #1941 (merged; mirror 14/14) |
| #1590 | **CLOSED** via #1895 (merged `262aa8fbe`) |
| #1355 / #1360 | PR **#1664** `3b4e2b92b` — CDP target-selection repair (both tiers at 257963e0c showed the probe attached to a chrome-extension target; #1885 island gates pass first). Evals: product PASS, probe delta PASS_WF, CI-red delta PASS_WF, target delta eval running. Apply ready-merge only after tiers conclude → packet — every branch-owned gate green; **sole red is #1845** in both tiers; routed (b) |
| #1354 | plan PR **#1891** `61d7708f8` — `PASS_PLAN_WITH_FINDINGS`, amendment + carrier-exempt rule applied. **Slice B = #1943 MERGED** `3c8b0fd18` — **native PASS, `status:ready-merge`** (partial, `Refs`). **Slice C = #1946 MERGED** `e341c6f71`. **Slice D = #1948 MERGED** `3a794be67`, base main — **native PASS, `status:ready-merge`**. **Slice E dispatched** (`007-leaf-1354-e`, base `0faae3fde` = main+B+D; hard fence: no `public-command-dependencies.ts`). **Slice A = PR #1950** `d55afbef5` PASS_IMPL (stacked on #1664). **Slice E = #1954 MERGED** `a867ab9cb` (F absorbs LOW-1/LOW-2). **Slice F = PR #1956** `0c95978c6` PASS_IMPL_WITH_FINDINGS (stacked on #1664). **Slice G = PR #1958** `bc116bb5d` PASS_IMPL (stacked on F). Slice A gated on #1664 (`web-scaffold.ts`); C–G follow the plan order |
| #1452 | **CLOSED** via #1944 (merged `7d1faa352`) |
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
| `007-leaf-s6s7` | see `slices/s6s7/codex-thread-ids.md` | idle — #1941 open |
| `007-leaf-1354-b` | `01a062f4-9495-7563-8377-21e2b17ca2ee` | idle — #1943 open |
| `007-leaf-1452-s3` | `01a062f4-94d3-7852-a1a0-cdc406f23b24` | S3 finalising PR |
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
3. **Three gates arrived on `main` mid-flight** — plus Aspire version parity (S13): regenerate `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` via its `tools/aspire-surface-manifest.ts` when `manifest:freshness` fails. Original note:: `check:mcp-export-corpus` inside `quality` (#1929)
   and README fence integrity (#1925, baseline now **7** after #1935). Every convergence must
   regenerate the corpus; every README fence must compile. A converged head re-runs the *current*
   gate set.
4. **Diff a leaf against its own base, not against a moved `main`** — and never truncate the
   touch-set read on a 160-file branch. Both produced confident wrong attributions today.
5. **Aspire runtime tiers are nondeterministic**: five failure modes across four branches touching no
   Aspire path, each also seen passing at an unchanged head. Attribute off feature PRs with evidence;
   exclusion of #1844/#1880 requires same-failure-on-main **and** delta-not-touching-paths.
6. **Generated carriers are ceiling-exempt** (supervisor ruling, in `plan.md`). A phase-eval claim is
   **head-bound**: pushing during `authorize` skips the agent silently — cycle the label only on an
   idle lane, and confirm the *agent* job's conclusion, not the run's.
7. **Detached bash has no `jq`** — background waits must use `gh --jq` or `awk`, or they die silently.
8. Launchers block for the child's lifetime — always `setsid nohup … &`; recover by **resuming the
   same thread**. `--slice-dir` must exist; `--slug` hardcodes `/home/codex`, pass `--dest`.

## Standing rules

- Serial queues apply only within this orchestrator; exploit disjoint parallelism; no idle waits
  on routine decisions.
- Hand every **exact-green** packet to the primary coordinator immediately; withdraw
  `status:ready-merge` when a head moves without green evidence, restore on green.
- Closing keyword only when the issue is complete; never on the #1348 epic.
- Keep dispatching until every Features issue is merged and stable 0.0.7 is cut.
