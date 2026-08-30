# Fixes-lane runtime queue — blocked on the singleton host lease

Lease is **held by the Aspire supervisor for Phase B**. Verified not free: `docker ps -a` shows live
`relay-s7-phase-b-*` containers. Nothing below has been started; no lease requested.

**Baseline update folded in:** main `52a881c588` carries the #1734 Fresh hydration fix. The #1734
TS2345 generated-project blocker is **cleared** and must not be cited again — it was the reason
#1758's bare `e2e:cli` was classified 26/1 baseline-blocked, and that classification is now stale.
D-42/D-43 are separately resolved (`DOCKER_HOST=tcp://netscript-dind:2375`, published ports at
`netscript-dind:<port>`, never `127.0.0.1`).

## Ownership check first — #1738 and #1740 are NOT this lane's

Both carry **`epic:aspire-13-5`** and sit on `chore/aspire-13-5-s4-*` / `fix/aspire-13-5-s5-*`
branches, both `status:ci-fail`, both `impl-eval:skip`. They belong to the **Aspire lane** — the same
lane that currently holds the runtime lease. Integrating or rerunning them from here would collide with
a live leaseholder and cross a lane boundary. **Not adopted.** Flagged to the coordinator rather than
silently actioned or silently skipped.

## This lane's serial runtime order, once Aspire returns exact zero

| # | PR | Issue | State | Runtime work required |
| --- | --- | --- | --- | --- |
| 1 | **#1764** | #1368 | `status:impl`, `PASS_IMPL` cycle 3 | **Flow-B** (`runtime.flow-b-fixture`) at exact head. Sole remaining blocker. Request per `flow-b-request-1764.md`. |
| 2 | **#1758** | #1462 | `status:impl`, parked on #1734 — **now unparked** | Integrate exact main `52a881c588`, then rerun bare `deno task e2e:cli`. Its 26/1 receipt is now a **stale** classification, not a standing blocker; the rerun must produce a fresh verdict, not inherit the old one. Renewed evaluator currency needed after. |
| 3 | **#1739** | #1673 | `status:impl-eval` | Integrate exact main, then the `scaffold.runtime` rerun that its single unticked acceptance box turns on. |
| 4 | **#1781** | #1357 | `status:impl`, S2D landed | `scaffold.runtime` including the new `scaffold.ui-data-screen` gate, after Tier-A and IMPL-EVAL. |

Order rationale: #1764 is closest to merge (one gate from ready), #1758 and #1739 both need an
integrate-then-rerun cycle, and #1781 is still pre-evaluator. Serial within this orchestrator only —
one runtime holder at a time, and never concurrent with another lane's lease.

## Standing rules for each rerun

- Integrate exact main by **merge, not rebase**; resolve any shared generated carrier **only through
  its generator**.
- Re-cut exact-head evidence after integration — a receipt from before the merge is not currency.
- Request the lease only when `docker ps -a` is empty and `aspire ps` reports no AppHost.
- On exit: scoped teardown, prove containers/volumes/AppHost back to exact zero, then release.
- Classify failures exactly; never retry into a different answer, and never waive.
