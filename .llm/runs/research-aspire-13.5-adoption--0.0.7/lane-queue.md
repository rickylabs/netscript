# Aspire lane — durable serial queue (`orchestrator:aspire`, milestone 0.0.7)

Authoritative source: `gh issue list --label orchestrator:aspire --state open` (12 open at
2026-08-31T00:5xZ). Re-query before trusting this file; it is a reconciled snapshot, not the record.

Main at reconcile time: `0ac06c5f10ac36cc672ed39b9e13640a03c6ea4b` (post-#1792 evaluator routing).

## Dependency shape (why the lane can stall if mismanaged)

`#1743 (S6)` is the keystone: **S8 → {S9, S10} → {S11, S13}** are all transitively stacked on it.
Only **S7** and the standalone docs/flake issues sit outside that chain.

```
main ──┬── #1743 S6  (ready-merge, coordinator-owned)  ──► #1754 S8 ──┬── #1759 S9
       │                                                              └── #1760 S10 ──┬── #1771 S11
       │                                                                              └── #1779 S13
       ├── #1744 S7  (base=main, clean)          ◄── INDEPENDENT
       └── #1747 → closes #1732 (base=main)      ◄── INDEPENDENT (D-119 in flight)
```

## Queue

| # | Issue | PR | Base | Status | Blocked by | Next action |
| - | ----- | -- | ---- | ------ | ---------- | ----------- |
| 1 | #1732 | #1747 | main | `status:ci-fail` | — | **ACTIVE** — D-119 bounded parser repair in flight (thread `01a05593…`). Then converge onto new main (1 behind), then runtime lease for `runtime.flow-b-fixture`. |
| 2 | #1718 | #1743 | main | `status:blocked` | — | S6 **ready-merge**, CI green, CLEAN/MERGEABLE. **Coordinator merges.** On merge: flip issue to `status:shipped`, and #1280 auto-closes. |
| 3 | #1280 | #1743 | — | `status:impl` | #1743 merge | Auto-closes via #1743's `Closes #1280`. Then `status:shipped`. |
| 4 | #1719 | #1744 | main | `status:triage` ⚠ | — | **INDEPENDENT / next executable.** PR clean+mergeable, still draft. Label is stale (`triage` despite an open impl PR) — needs `status:impl`. Assess remaining scope. |
| 5 | #1720 | #1754 | S6 branch | `status:impl` | #1743 merge | PR currently **`mergeable=false`, `dirty`**. On #1743 merge: retarget base→`main`, converge, re-verify. Unblocks the whole right-hand chain. |
| 6 | #1721 | #1759 | S8 branch | `status:impl` | #1754 | Retarget/converge after S8 lands. |
| 7 | #1722 | #1760 | S8 branch | `status:impl` | #1754 | Retarget/converge after S8 lands. |
| 8 | #1723 | #1771 | S10 branch | `status:impl` | #1760 | Retarget/converge after S10 lands. |
| 9 | #1724 | #1779 | S10 branch | `status:impl` | #1760 | Retarget/converge after S10 lands. |
| 10 | #863 | (#1754 partial) | — | `status:impl` | #1754 + S6 receipts | Per D-44: S8 owns gate 1 only; remaining evidence is the S6 listener receipts (now captured) + root-README clean-machine canary. Reconcile after S6/S8 land. |
| 11 | #1642 | none | — | `status:impl` | — | **INDEPENDENT, no PR yet.** Docs: detached non-TTY start state + dashboard-token discovery. Candidate to schedule once #1747/S7 clear. |
| 12 | #1712 | — | — | `status:triage` ⚠ | all children | Epic umbrella. Never gets a closing keyword; closes by hand when all children ship. Label stale (`triage`) — should track the epic's real phase. |

## Standing rules for this lane

- **Never globally idle on one Phase-B dependency.** When the keystone (#1743) is
  coordinator-owned/waiting, work the independent column (#1747, #1719/S7, #1642) instead.
- Runtime leases are serialized and coordinator-granted; four-part zero preflight
  (aspire/containers/volumes/non-default networks) before **and** after, every time.
- Every existing qualifying evaluation stays valid at its recorded head — never rerun/replace.
  New evaluations only, via the post-#1792 routes.
- Coordinator alone merges. Supervisor prepares merge packets.

## Label-hygiene deltas found at reconcile (not yet applied)

- #1719 — `status:triage` but has an open implementation PR (#1744) → should be `status:impl`.
- #1712 — epic carries `status:triage` → should reflect the epic's actual phase.

Both are metadata-only; flagged for coordinator ruling rather than changed unilaterally, since
`status:` is the board's single-source signal.

## Un-stack cascade map (computed 2026-08-31, D-124)

Every stacked slice has a **clean branch point** and a well-defined own-commit set, so each un-stack
is one `rebase --onto` — no archaeology needed at dispatch time. Verified by `git merge-base` /
`git rev-list --count` against each parent's pre-reconstruction head.

| Slice | PR | Branch point (parent commit) | Own commits | Un-stack command |
| --- | --- | --- | ---: | --- |
| S8 | #1754 | `01f27d4d4` (old S6 lineage) | 10 | `git rebase --onto origin/main 01f27d4d4` — **in flight (D-121/D-122)** |
| S9 | #1759 | `f23954658` (S8 commit 7) | 10 | `git rebase --onto <new-S8-head> f23954658` |
| S10 | #1760 | `f23954658` (S8 commit 7) | 9 | `git rebase --onto <new-S8-head> f23954658` |
| S11 | #1771 | `a46ea16d0` (S10 commit) | 11 | `git rebase --onto <new-S10-head> a46ea16d0` |
| S13 | #1779 | `a46ea16d0` (S10 commit) | 9 | `git rebase --onto <new-S10-head> a46ea16d0` |

Notes that matter at dispatch time:

- **S9 and S10 are siblings** off the same S8 commit and do not touch each other — once S8's new head
  exists, both can be un-stacked **in parallel** (separate worktrees, no collision). Same for
  **S11/S13** off S10.
- Neither S9 nor S10 currently contains S8's last three commits (`18923b54e`, `63e291f62`,
  `f06209d39`); replaying onto S8's *new* head gives them the complete S8 automatically.
- Expect the **same two conflict classes** S8 hit, and apply the same rules:
  1. generated files (`*.generated.ts`, generated `*.template` snapshots) → take the upstream side,
     never hand-merge, regenerate once at the end via `gen:assets-barrel` + `check:assets-barrel`;
  2. any non-generated source conflict → **abort and report**, do not force-resolve.
- After each un-stack: retarget the PR base to the new parent (or `main`), which is supervisor-owned
  PR metadata.
