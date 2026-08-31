# Features queue — every open milestone-0.0.7 issue assigned, 2026-08-31

Live source: `gh issue list --milestone 0.0.7 --state open --label orchestrator:features` → **12 open**.
No issue is idle; each row names the lane and the one thing that moves it.

## Shipped this session

| Issue | PR | Landed |
| --- | --- | --- |
| #1591 | #1805 | `dea44991` |
| #1458 | #1810 | `eaea940b` |
| #1452 **Slice 1** | #1820 | `26e1b486` — #1452 correctly left **open** |
| #1592 **Slice 1** | #1814 | merged partial — #1592 correctly left **open** |
| #1349 **Slice 1** | #1834 | `58a4a10e` — the epic's structural entry point |

## In flight

| Issue | Lane | Blocked on |
| --- | --- | --- |
| **#1387** | PR #1762, seventh integration on post-#1828 `main`; `TS2551` **cleared** | exact CI + hosted auth/policy `scaffold.runtime` |
| **#1355** | PR #1664, `--client` selector landed; 71/72 runtime | two stale test expectations (dispatched) + the optimistic-render question |
| **#1349** | **Slice 2 dispatched** — `feat/sdk-client-contribution-adapter`, worktree `007-leaf-1349-s2` off `58a4a10eb` | in progress |
| **#1592 S2 + #1451** | **clustered plan dispatched** — `feat/workers-runtime-plan`, worktree `007-leaf-workers`; thread `01a05848…` alive | plan → PLAN-EVAL → implement |

## Assigned, ordered behind a named dependency — not idle

| Issue | Assignment | Why it waits |
| --- | --- | --- |
| **#1349 Slice 3** | queued directly behind Slice 2 | **Not surface-disjoint.** Slice 3 extends `prepared-call.ts` and `client/service-client.ts`, which Slice 2 creates. Running both now would race the same files. Serialized on evidence, not caution. |
| **#1352** (S5 credentials) | behind Slice 2 | Credential contributions are a *consumer* of the contribution seam; the seam is only runtime-real after Slice 2. |
| **#1353** (S6 trace propagation) | behind Slice 2 | Same — trace propagation is expressed *as* a contribution. |
| **#1467** (S7 locale) | behind Slice 2 | Same — the non-auth contribution proof needs the adapter. |
| **#1348** (epic) | coordinator checkpoint | Stays open until every child is verified; receives no leaf PR. |
| **#1354** | behind #1664 | Its surface is `packages/cli` generate/scaffold, which #1664 is actively rewriting. Dispatching now would collide. |
| **#1452 Slice 2** | **needs an owner ruling** | May `@netscript/plugin` depend on `@netscript/kv`? Plus the db-resolver injection shape and the undefined `appsettings` scope. Slice 1 shipped precisely because it needed none of these. |
| **#1590** | **needs a browser-capable lane** | Fresh partial-navigation ordering/remount identity. Client-runtime behaviour this lane cannot verify; the same capability gap #1664's optimistic-render question now needs. |

## Two standing asks for the coordinator

1. **#1452 Slice 2's dependency-edge ruling** — the only thing between it and a dispatchable slice.
2. **A browser-capable lane.** Two separate issues now need it: #1590, and #1664's remaining
   `behavior.service-client-refetch` question, where the SDK/helper layer has been **exonerated by
   measurement** and the failure is downstream in Fresh/Preact render propagation.
