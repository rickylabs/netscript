# Durable queue — `orchestrator:features`, milestone 0.0.7

Authoritative source: `gh issue list --repo rickylabs/netscript --milestone 0.0.7 --state open
--label orchestrator:features --limit 100` — **14 open issues**, reconciled here.

**Correction to my earlier ad-hoc audit.** I previously excluded the `#1348` sdk-client-contrib epic
and its children as "another supervisor's accepted topic" on the strength of a run directory existing
on `main`. **That was wrong** — they carry `orchestrator:features` and belong to this lane. A
run-dir's existence is evidence of prior *research*, not of another lane's ownership; the label is the
ownership signal. Corrected below.

## Shipped this session — Tier-A ACCEPTED, awaiting evaluation only

| Issue | PR | Content head | State |
| --- | --- | --- | --- |
| #1591 | #1805 | `ff7d2de60` | Tier-A ACCEPTED · IMPL-EVAL pending (GLM route now unblocked) |
| #1458 | #1810 | `acb096a94` | Tier-A ACCEPTED · IMPL-EVAL pending |
| #1592 (partial) | #1814 | `7270cc7f7` | Tier-A ACCEPTED · Slice 1 only; runtime wiring deferred |
| #1452 (partial) | #1820 | `7feedee77` | Tier-A ACCEPTED · Slice 1 only; host-factory deferred |
| #1387 | #1762 | `ce0c0ebcb` | Slices 1–9 Tier-A ACCEPTED · integrated to `main` twice · **Slice 9 IMPL-EVAL dispatched on GLM 5.3 Flash** |

## Blocked on another lane's PR, not on this lane

| Issue | Blocker |
| --- | --- |
| #1354, #1355 | Owned by open PR #1781 (`fix/ui-add-data-screen-triad`) — **#1781 has now merged as `65cd8a077`**; re-audit both at the next boundary to see whether they are fully resolved or have residual scope. |

## Deferred with recorded reasons — not idle, not forgotten

| Issue | Why |
| --- | --- |
| #1451 | Genuinely complex. The workers registry generator has **no access to loaded project config** today (`{manifestPath, profile, projectRoot}` only, filesystem-scanned). Needs config-loading plumbing, a file↔config matching strategy, a precedence rule between `groups[].jobs[]` and legacy flat `jobs[]`, plus schema additions for `priority`/`retryDelay`/`maxConcurrency`/`persist`. Real design questions → wants a bounded plan and probably PLAN-EVAL. |
| #1590 | Fresh partial-navigation ordering/remount identity. Client-runtime behaviour needing browser-level verification this lane cannot perform (no runtime lease). |
| #1452 Slice 2 | Architecture decision: may `@netscript/plugin` depend on `@netscript/kv`? Plus db-resolver injection shape and the undefined `appsettings` contract. |
| #1592 Slice 2 | `ctx.reportProgress()` → `ExecutionState.progress()` runtime wiring; the message protocol type exists with **no found consumer**. |

## Next executable — the sdk-client-contrib epic

`#1348` (epic) with children `#1349` (S3), `#1352` (S5), `#1353` (S6), `#1467` (S7) — all
`status:plan`, `priority:p1`. **Dependency note:** `#1352` (typed credential contributions) is the
declared home of SDK credential injection, which `#1387`'s own research explicitly deferred to it —
so #1352 is downstream of #1387's contract work now landing. #1349 (S3, expose the typed oRPC
client-contribution surface) is the epic's structural entry point and the natural first leaf.

**Next action after the current #1387 evaluation returns:** research #1349 against the shipped
contract surface, scope it, and dispatch — following the same slice-and-defer discipline used for
#1452/#1592 rather than assuming the epic's plan labels mean it is fully specified.

---

# PR control plane — all six `orchestrator:features` PRs, exact next gate

Reconciled live. **No silent parked state**: every row names the one thing that must happen next.

| PR | Issue | Head | Merge state | Exact next gate |
| --- | --- | --- | --- | --- |
| **#1762** | #1387 | `ffd380532` | **MERGEABLE / CLEAN** | Slice 9 IMPL-EVAL **running now** (GLM 5.3 Flash, task `bogxei74n`). On PASS → hand packet immediately. |
| **#1805** | #1591 | `ff991165f` | MERGEABLE / CLEAN | IMPL-EVAL **dispatched now** (GLM, task `bgykgtbq1`). On PASS → hand packet. |
| **#1810** | #1458 | `c438c82db` | MERGEABLE / CLEAN | IMPL-EVAL — dispatch next as evaluator capacity frees. |
| **#1814** | #1592 (partial) | `af6f16916` | MERGEABLE / CLEAN | IMPL-EVAL — then packet. Merging must **not** close #1592. |
| **#1820** | #1452 (partial) | `03392e186` | was CONFLICTING → **integrated + re-pushed**, awaiting recompute | IMPL-EVAL — then packet. Merging must **not** close #1452. |
| **#1664** | #1355/#1360 | `a257807d8` | **CONFLICTING / DIRTY** | **Needs an owner decision before any work** — see below. |

## #1664 — stated plainly rather than left parked

`feat(cli): generate collision-safe service query wiring`, conflicting against current `main`, and
this lane's standing instruction has been **"#1664 parked, no retry authorized."** Two things have
changed since that instruction: the coordinator now says all six PRs are this lane's with no silent
parked state, and **PR #1781 — which overlapped its issues #1355/#1360 — has merged** (as
`65cd8a077`).

**Concrete next gate, needing one owner ruling:** does #1664 still have residual scope after #1781
merged, or is it now redundant and closable? I can answer that with a measurement (diff #1664's
branch against current `main` and check whether its intended behaviour already shipped), but
**reviving a PR whose parking was explicitly instructed is not mine to decide unilaterally** — that
is a genuine coordinator boundary, and it is the only one currently open in this lane. Everything
else above proceeds without confirmation.

## Deadline posture

With full-milestone completion targeted for tomorrow evening: evaluations are the throughput
bottleneck, not implementation. Four PRs need one evaluation each and are otherwise green and
conflict-free. Running them strictly one-at-a-time behind a slow evaluator would not finish, so
independent leaves are being evaluated concurrently — they share no worktree, head, or artifact.
Implementation dispatch remains serial.

## Clustering for the remaining unimplemented issues

Where acceptance shares a surface, cluster rather than dispatch separately:

- **`#1349`/`#1352`/`#1353`/`#1467`** — all four are the `#1348` sdk-client-contrib epic over the same
  `CreateServiceClientOptions`/`ServiceClientContext` surface. #1349 establishes the descriptor/tuple
  algebra the other three build on, so it strictly precedes them. **PLAN-EVAL dispatched** (Qwen
  3.8-flash, task `bqykbr99q`) — this one is genuinely complex and carries two contradictions in its
  own issue body.
- **`#1592` Slice 2 + `#1451`** — both are workers-runtime surface (`ctx.reportProgress()` wiring and
  project job-policy metadata reaching the generated registry). Both need runtime plumbing the
  generator/dispatcher does not have today; cluster them behind one plan rather than two.
- **`#1452` Slice 2** — stands alone; blocked on the `@netscript/plugin` → `@netscript/kv` dependency
  decision.
- **`#1590`** — stands alone; needs browser-level verification this lane cannot perform.
