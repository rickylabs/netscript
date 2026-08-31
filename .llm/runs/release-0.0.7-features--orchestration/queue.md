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
