# Context pack — topic-docs-0.0.7

**Lane status: EXHAUSTED / PARKED for milestone 0.0.7.** Every allocated issue is shipped. Nothing
is in flight. This file is the resumable record.

## Final state

| Fact                                             | Value                                                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Lane allocation (`milestone-cluster-state.json`) | `[1551]` — closed/completed, `status:shipped`                                                                          |
| Docs-lane issues still open                      | **none**                                                                                                               |
| Latest `main` (2026-08-15 reconciliation)        | `baf1cdf67a4e931af17b4772ddf6101f36152184` — this lane's last merge `729386c56` is three commits behind it            |
| Supervisor                                       | native Claude Opus 5 / high, session `fcf04b0f-3c2f-4844-9508-84c52ce8298c`, bridge `session_01SBHRTmr6ddueUYzCbcXrRV` |
| Topic branch                                     | `orchestrator/release-0.0.7-docs`, push by explicit refspec only                                                       |

## What shipped

**PR #1652** → `e090f894f`. Seeded the comparison programme: methodology page, evidence manifest and
measurement tool, a deferred Session case study, migration placeholders. Passed formal PLAN-EVAL
cycle 1 and IMPL-EVAL cycle 2 after a cycle-1 `FAIL_FIX`, plus three derived-asset amendments.

**PR #1660** → `729386c56`. Replaced almost all of it. The owner rejected the shipped surface as a
protocol rather than an argument. Deleted the 151-line methodology page, the 171-line case study,
372 lines of private-repository evidence JSON, a 718-line measurement tool with its 276-line test,
and both migration pages. Shipped two opinionated pages with a competitor selector:

- `/netscript/comparisons/frontend/` — Next.js · Nuxt · SvelteKit · TanStack Start
- `/netscript/comparisons/backend/` — Nest.js · Hono · Encore.dev

Both verified live at HTTP 200 with correct titles and the selector present; the deleted protocol
pages return 404.

**Issues.** #1551 closed/completed. #1659 filed and closed/completed, 8/8 acceptance boxes with
evidence. #1645–#1650 closed `not_planned` as superseded — the protocol backlog went with the
protocol.

## The lesson this lane paid for

The first attempt applied **evidence-integrity rigor to a positioning artifact**. That category
error produced a measurement protocol nobody needed, deleted the most communicative content in the
run (LOC comparison, ~12–15% route-code saving, ASC 87–93% vs 40–53%) because it was not
script-reproducible, and yielded pages that were accurate and lifeless. The estimates were recovered
from GitHub `userContentEdits` and restored as clearly-labelled architectural estimates.

The standard that worked: a positioning page must **argue**, and every claim must be carried by code
that is verified real. On the second attempt every API shown was confirmed against source and both
snippets were type-checked in scratch fixtures.

## Operating rules earned here

1. **Never run a mutating gate, generator, or cleanup in an author worktree while its thread is
   active.** Wait for `task_complete`, zero processes, local `==` remote, clean tree. Tier-A starts
   read-only.
2. **Never `git stash drop`/`pop`/`apply` without an explicit `stash@{n}`.** Stashes live in the
   shared `.git` and `stash@{0}` is usually another lane's. Recover a mistaken drop with
   `git stash store -m … <sha>`.
3. **A readiness claim needs the terminal state of the exact-head Actions run**, never an
   `agentic:pr-checks` snapshot — a snapshot taken seconds after a job completes can miss it.
4. **Check `fmt.exclude`/`lint.exclude` before prescribing a scoped wrapper.** Three stops in this
   run came from gates the repository excludes by configuration.
5. **A docs change invalidates three generated layers** — agent-docs bundle → CLI assets barrel →
   MCP publish assets. Regenerate all three in the same slice; do not let CI discover them one at a
   time.

## If this lane is reactivated

Branch from **current `origin/main`**, not from this lane's last merge — as of the 2026-08-15
reconciliation that is `baf1cdf67a4e931af17b4772ddf6101f36152184`; re-read it before dispatch rather
than trusting this line. `729386c567bfbd0b8c7f86a4ed09348f0a8a4ad8` is only the immutable head this
lane shipped. The preserved Codex author threads are
`019ffcc9-16c2-7573-b7f6-d627172408e8` (#1652 leaf, merged worktree) and
`01a0047a-aceb-7b53-9ba1-9191eedaaf1a` (#1660 leaf, worktree
`/home/codex/repos/netscript-007-docs-vs`) — both idle and intact. One sender per worktree: a new
leaf needs its own worktree and its own thread.

Merge authority rests with the coordinator, not this lane.
