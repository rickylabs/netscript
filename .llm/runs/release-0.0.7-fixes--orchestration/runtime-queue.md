# Fixes-lane runtime queue — blocked on the singleton host lease

**LEASE NOW APPEARS FREE — verified exact zero at 2026-08-30:** `docker ps -aq` count **0** and
`aspire ps --format Json --nologo --non-interactive` returns **`[]`**. That is the documented exact-zero
baseline, so the precondition for requesting the singleton lease is met. The lease is
coordinator-granted, not self-taken, so **nothing has been started and the lease is requested, not
assumed** — awaiting an explicit grant naming the PR and head.

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

## READY — all four leaves integrated onto main `9710a2898` and refrozen

Lease is with the **Aspire supervisor** for the 13.5 Phase-B re-prove. Nothing runtime has been
started here. Every leaf below is integrated, gated green, pushed, and frozen at an exact head, so each
runs the instant the lease frees — no preparation remains.

| Order | PR | Issue | **Ready exact head** | Command to run under lease |
| --- | --- | --- | --- | --- |
| 1 | **#1764** | #1368 | **`5b526e4bc`** | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — must show gate **`runtime.flow-b-fixture`** executing, with TC-6/TC-7 (`saga.handle` + `saga.compensate` carry one shared `netscript.correlation.id`) and TC-9 parent edges |
| 2 | **#1758** | #1462 | **`aab3376cc`** | `deno task e2e:cli` (bare) — fresh verdict required; the 26/1 receipt is a **stale** classification now that #1734 is fixed |
| 3 | **#1739** | #1673 | **`9900007f7`** | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — for its single unticked acceptance box |
| 4 | **#1781** | #1357 | **`487eaf141`** | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — must show the new gate **`scaffold.ui-data-screen`** executing |

Refreeze evidence at those heads, all clean-tree:

| PR | Suites | Checks | Lock | Ceiling |
| --- | --- | --- | --- | --- |
| #1764 `5b526e4bc` | `plugins/sagas` 51/0/1 · `plugin-sagas-core` 84/0/3 | arch, corpus, publish-assets, core JSR all 0 | unchanged | 19 |
| #1758 `aab3376cc` | `packages/sdk` 79/0 | arch, agent-docs-prose, publish-assets, corpus all 0 | unchanged | 19 |
| #1739 `9900007f7` | generate feature 25/0 | arch, corpus, publish-assets all 0 | unchanged | 11 |
| #1781 `487eaf141` | `packages/cli` 1388/0 · e2e 171/0 | arch, agent-docs-prose, publish-assets, corpus, CLI JSR all 0 | unchanged | 12 |

Integration was **inert for every leaf** — `comm` of main's changed paths against each leaf's owned
paths returned empty in all four cases — so the `PASS_IMPL` verdicts on **#1764** (`14889037`) and
**#1781** (`2991113a6`) carry forward as MECHANICAL_PASS rather than needing a re-cut.

### Carrier regeneration has a dependency order

#1758's merge conflicted on four generated carriers. Resolved through generators only, but the first
pass ran them in the wrong order and left `check:publish-assets` **exit 1** despite every generator
exiting 0. Correct order is **`gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`**;
the later generators rewrite inputs the earlier one consumes. A generator's exit 0 is not evidence of
freshness — only the `check:` variant run afterwards is.

## Standing rules for each rerun

- Integrate exact main by **merge, not rebase**; resolve any shared generated carrier **only through
  its generator**.
- Re-cut exact-head evidence after integration — a receipt from before the merge is not currency.
- Request the lease only when `docker ps -a` is empty and `aspire ps` reports no AppHost.
- On exit: scoped teardown, prove containers/volumes/AppHost back to exact zero, then release.
- Classify failures exactly; never retry into a different answer, and never waive.
