# Cut trace — 0.0.6 runtime / public-surface lane

Merge-derived record. Every row is captured **from `git log origin/main` after the merge**, never
from recollection or from the dispatch plan. This lane does not cut or publish; root orchestration
owns the canary and the stable cut.

## Baseline

| Field | Value |
| --- | --- |
| Lane opened | 2026-08-12 |
| `origin/main` at open | `01aa12b67` — `docs(harness): record FILING-LOG -- board migration executed once (#1523)` |
| Owned issues | #1405, #1398 |

## Merges

| # | UTC | Merge commit on `origin/main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-12T08:20:29Z | `8ff1bcb8fc741db17a765a1965861828e0ae6171` (`8ff1bcb8f`) — `fix(streams): distinguish producer refusal reasons (#1528)` | #1528 | **#1405** (auto-closed `COMPLETED` by the body's `Closes #1405`) | `slices/pre-merge-gate-1528.md` — all 7 checks PASS |

| 2 | 2026-08-12T10:27:26Z | `d7e2b67b2be535c9ca13449f97f8f4585344030a` (`d7e2b67b2`) — `fix(workers): publish job executions to the durable stream on the job.execute trace (#1536)` | #1536 | **#1398** (auto-closed `COMPLETED` by the body's `Closes #1398`) | `slices/pre-merge-gate-1536.md` — all 7 checks PASS at head `f7d503fee` |

| 3 | 2026-08-12T11:40:14Z | `5db37e7bb` — `fix(fresh): forward durable State-Protocol query parameters through the chat stream proxy (#1556)` | #1556 | **#1457** (auto-closed `COMPLETED`) | `slices/pre-merge-gate-1556.md` — all 7 checks PASS |

| 4 | 2026-08-12T12:03:55Z | `59e435c5d` — `fix(streams): resolve Aspire VITE service references in the browser stream resolver (#1559)` | #1559 | **#1548** (auto-closed `COMPLETED`) | `slices/pre-merge-gate-1559.md` — all 7 checks PASS at head `ccfa5407e` |

| 5 | 2026-08-12T13:11:29Z | `5705aeb19` — `fix(fresh): hydrate the deferred refresh coordinator so partial-miss regions settle (#1558)` | #1558 | **#1459** (closed by hand — PR carried `Refs`, observational criterion routed to #1557) | `slices/pre-merge-gate-1558.md` — 7 checks PASS at head `2d515de75` |

| 6 | 2026-08-12T13:59:13Z | `a553afef4` — `fix(release): regenerate the deno.lock closure for the packages/fresh plugin-vite dependency (#1572)` | #1572 | **none** — carries `Refs #1571`, which stays open pending Canary.3 | `slices/pre-merge-gate-1558.md` pattern; overlap guard clean, 387/9 lock-only |

| 7 | 2026-08-12T14:11:23Z | `50739a7ae` — `fix(fresh-ui): regenerate the stale private lock for the plugin-vite dependency (#1581)` | #1581 | **none** — carries `Refs #1580`, which stays open pending #1570's green proof | one-line derived lock; `impl-eval:skip` attributed, zero evaluator spend |

| 8 | 2026-08-12T15:24:59Z | `fc312f211` — `fix(e2e): retry quickstart aspire restore on timeout and cancellation (#1584)` | #1584 | **#1227** (auto-closed `COMPLETED`) | `slices/pre-merge-gate-1584.md` — 7 checks PASS; **canary.4 cut from this SHA reached terminal green** |

Rows captured from `git log origin/main --first-parent -1` **after** each merge, per the
profile's merge-derived rule. Issue states re-read live: both `CLOSED` / `COMPLETED`, with
`status:shipped` applied to each issue and PR.

**First pass complete** (#1405, #1398). **Reopened 2026-08-12** for #1457, #1459, #1548 — #1457 row 3, #1548 row 4, #1459 row 5. **All three reopen issues landed.** #1562 is queued next.

## Re-planning events

| # | Date | Event | Decision |
| --- | --- | --- | --- |
| 1 | 2026-08-12 | #1536's head changed mid-flight, `e4319c685` → `f7d503fee` | The phase-eval dispatcher (#1524) merged **after** the branch's last `main` sync, so `openhands-phase-eval.yml` was absent from the PR's merge ref and no label cycling could trigger it. Owner approved syncing the branch, accepting a full CI re-run. All gate evidence was then re-read against the new head; no pre-sync evidence was carried forward. |
| 2 | 2026-08-12 | Evaluation route changed twice mid-run | D-3 removed formal IMPL-EVAL for the small deterministic class (after #1405 had already merged); D-4/D-5 moved phase evaluation to the automatic label-driven dispatcher. #1398's IMPL-EVAL consequently ran on the automatic route rather than a manual launch. |

## Failure modes that cost real time

| # | Date | Failure | Cost | Mitigation recorded |
| --- | --- | --- | --- | --- |
| 1 | 2026-08-12 | **Dispatcher absent from the PR's merge ref.** #1524 merged 38 min after #1536's branch last synced with `main`, so `openhands-phase-eval.yml` did not exist for that PR. Labels were cycled correctly and produced **no run at all**; the only runs were the older `openhands-agent.yml`, all `skipped`. | One wasted label re-entry, plus a full CI re-run (~20 min, both `scaffold-runtime` tiers) after the branch sync. | For `pull_request` events GitHub resolves workflows from the **merge ref**. A newly merged workflow cannot fire on a PR whose head predates it. **Check the workflow exists in the PR head before concluding a trigger failed.** Diagnosed by `git cat-file -e <head>:<workflow>` → ABSENT, with the post-sync run succeeding as the control. |
| 2 | 2026-08-12 | **Draft PRs report every check as `skipping`.** #1528 looked "clean" while nothing substantive had run. | None — caught by pre-merge check 4 before merge. | This is the #778/#775 class, alive and current. Absence of red is not green. The blocking tier only runs after draft→ready. |
| 3 | 2026-08-12 | **Two live `scaffold.runtime` runs died before reaching the gates under test** — run 1 on a transient `generate plugins: fetch failed`, run 2 on a `triggers-api` health timeout at 120 s. | ~25 min of local runtime, no verdict produced. | Local WSL was not a usable arbiter for this suite. CI ran the same suite with the same change to a clean finish on both tiers, which is the control that established the local failures as environmental. **Do not label a local red a "flake" without that control.** |
| 4 | 2026-08-12 | **A counting watcher would never have fired.** OpenHands updates its summary comment **in place** (`openhands-agent-summary` marker, `"conclusion"` field), so a watcher keyed on comment count polls to timeout while the verdict sits in an edited comment. | None — caught before arming, on inspecting the posted comment's markers. | Watch the **run status** and the comment's `conclusion` marker, never comment count. |
| 5 | 2026-08-12 | **Stale check summary read as current.** `gh pr checks` reported `close-gate` red from a job that ran 40 min earlier, before the label and body changes it was complaining about. | None — caught by reading the job log, which carried the mirror's own "skipped because labels do not include status:ready-merge" notice. | Compare a check's run time to the change it is judging. The gate-integrity rule already says merge-history audits must take the latest run per check name; the same applies pre-merge. |
| 6 | 2026-08-12 | **Automation added a second `status:` label.** `status:augment-review` was applied 1 s after the orchestrator moved off `status:impl-eval`, breaching the exactly-one-status invariant. | None — caught while verifying labels before merge. | Re-verify the `status:` set after any automated phase transition, not only after manual edits. |
| 7 | 2026-08-12 | **Orchestrator's own slice brief named a broken gate command.** `deno test packages/plugin-streams-core` exits 1 with 19 `NotCapable` errors for want of `--allow-env`. | Minor; the implementer reported the red with its cause rather than hiding or working around it. | Use the package-declared `deno task --cwd <pkg> test`. Corrected in the #1398 brief rather than repeated. |
| 8 | 2026-08-12 | **One unnecessary evaluator dispatch.** The lane brief's IMPL-EVAL waiver for the #1405 class was read as a blocked-transport fallback rather than the class default. | One DeepSeek IMPL-EVAL run (~643 s) that the owner did not want. | Recorded as D-3. "A waiver is available" and "the waiver is the default" are different instructions; resolve the ambiguity before spending. |

### Merge — #1593 (#1583) duplicate durable SSE subscriptions

| Field | Value |
| --- | --- |
| Merged at | `f542f31cbea383f28dd2ea8ebc7ac99697c147a2` |
| Evaluated head | `308bcea57` (correction cycle 2) |
| Evaluation | automatic DeepSeek IMPL-EVAL run `31619302966` → `OPENHANDS_VERDICT: PASS` |
| Prior cycle | fallback IMPL-EVAL at `b96b5a58e` → `FAIL_FIX`, one blocking finding |
| Issue | #1583 closed, 3/3 acceptance boxes ticked by the mirror |

**What the FAIL_FIX caught, and why it was worth a cycle.** The implementation was accepted on the
first pass — one physical subscription, correct retirement barrier, byte-equivalent SR2, no surface
growth. What was missing was coverage that consumers *receive data*: every in-tree hub test used a
probe that blocks until abort and only yields **after** the hold, so no value was ever emitted while
two subscribers were attached. `publish` and the `wake` handshake — the reason the hub exists — were
asserted by nothing, and a refactor dropping all but the first subscriber would have left 230 tests
green. Cycle 2 added an emitting probe and two assertions; production behaviour did not change.

**Redness was reported honestly and needs preserving as precedent.** The new tests are red without the
hub **only on the physical-count assertion**, because the emitting probe broadcasts into every
physical stream, so pre-hub both collectors still received values. The value/terminal assertions guard
a different regression — the hub's fan-out breaking — which removing the hub cannot demonstrate. The
implementer stated this rather than claiming full redness.

### Time-costing failure — infrastructure red read as product red

Two of three current CI failures on #1593 were **infrastructure**: `build` died on `socket hang up`
and `quality` on `Unexpected HTTP response: 503`, both fetching Deno 2.9.5 in `setup-deno`. Both
passed on rerun with no code change. The third, `close-gate`, was **correctly** red — it named a DoD
box ("IMPL-EVAL records PASS") that was not yet true and issue boxes the mirror ticks at
`status:ready-merge`. Establishing currency first (`agentic:pr-checks`) and reading each log before
reacting kept this to two reruns instead of a diagnosis of the product.

### Trap — the `status:ready-merge` label does not re-run CI

Applying `status:ready-merge` triggered only the OpenHands workflows; the CI workflow carrying
close-gate did **not** re-run, so close-gate kept reporting its pre-label verdict and looked stuck.
The fix is **not** an empty commit — that would move the head away from the evaluated one. Because the
mirror and checker read labels, body, and issues **live** at execution time, re-running the existing
close-gate job after labeling is sufficient and preserves head immutability. It passed in 18s.

### Filed from inside the run

- **#1598** — SDK cache-provider throw should name its `import.meta.url` (PLAN-EVAL C6 for #1589):
  the only remedy reaching already-generated consumers, whom a build-time gate structurally cannot.
- **#1601** — `defer-island-client-bundle_test.ts` resolves `npm:vite@7.2.2` over the network with
  `--no-lock` at test time, so the package verdict depends on registry reachability. Observed as
  `232/0` locally and `231/1` in the evaluator session **for the same head**. Both reports were
  accurate; without the mechanism that reads as one agent misreporting, and the natural response —
  re-running until they agree — wastes a cycle and teaches the wrong lesson.

---

# Lane retrospective — 0.0.6 runtime / public-surface

Written at lane close. Release ownership hands to **ns006-fixes**; this lane dispatched no release.

## What landed

| PR | Issues | Merge |
| --- | --- | --- |
| #1593 | #1583 | `f542f31cb` |
| #1595 | #1589 | `4dc4d8262` |
| #1607 | #1577 | `1f9efb4d` |
| #1600 | #1569 | `6aee2b414` |
| #1602 | #1576, #1568 | `1ed78f508` |
| #1605 | #1562 | `bfcf4ed11` |

Earlier in the run: #1457, #1459, #1548, #1571, #1580, #1227, plus Canary.3 and the terminal-green
Canary.4.

## What the evaluators caught that the lane did not

This is the part worth keeping. In every case the implementation was accepted and the finding was
about whether the evidence meant what it claimed.

- **#1583** — one physical subscription was enforced, but every hub test used a probe that yields only
  *after* the hold, so `publish` and the wake handshake were asserted by nothing. A refactor dropping
  all but the first subscriber would have left 230 tests green.
- **#1576** — the fix was correct, and the *sibling* `withRouteContract` path had the identical defect
  one builder method away: typed `ctx.path.id` resolving `{}`. Reproduced by probe, not inferred.
- **#1569** — the browser regression passed by hand and was wired into nothing, so the acceptance box
  claiming browser coverage was satisfied by a test that would never run again.
- **#1562** — the C1 code fix was right and the published README still documented the deleted
  behaviour, which would have had consumers alerting on `outcome=error` for healthy reads. And the
  regression test added for C2 **passed with its own fix reverted**.

The pattern: a green gate is not evidence that the gate can fail.

## What this lane got wrong

- **D-11 → D-12.** I inferred from `run.headSha` that draft→ready evaluations were unbound to the PR
  head. That field is the merge ref by GitHub's design and never described the evaluator's checkout.
  The inference cost a rollback of #1595 and a cancelled #1602 run, both on valid verdicts. Corrected
  rule: authority is the verdict's declared head.
- **D-13 → corrected.** I declared #1576 criterion 5 "unsatisfiable as worded" after searching
  `packages/cli` and finding only static route patterns. The route-manifest generator inside
  `packages/fresh` handles dynamic segments, so the criterion is satisfiable under the
  generator-output reading. Searching one package and concluding about the repo.
- **D-14.** My briefs used issue numbers as shorthand and asked for the reasoning to be recorded in
  source. `#1589` reached published JSDoc twice, breaking CI both times.
- **A fabricated SHA.** I handed an evaluator a 40-character hash padded from a short prefix. It ran
  `git rev-parse`, got `fatal: bad object`, resolved the real head, and said so. Caught by
  verification, not by me.

Each of these is the same shape as the findings above: a claim that looked checkable and was not.

## Infrastructure, quantified

- **Ten `setup-deno` `socket hang up` / HTTP 503 failures across six PRs in one day**, every one green
  on rerun with no code change.
- **Three cloud evaluators stalled past 20 minutes with no verdict** (#1593, #1595, #1605), each
  replaced by an authorized native fallback.

The cost is not the reruns. It is that the reflex they train — rerun red without reading it — would
have buried two real failures that looked identical at a glance: the `#1589` codename conflict between
#1595 and #1587, and the nine-symbol docs drift on #1605.

## Filed from inside the run

#1542, #1543, #1557, #1561, #1563, #1571, #1580, #1597, #1598, #1601, #1604, #1609, #1610, #1616,
#1619, #1620, #1621, #1623.

Four of these — #1601, #1604, #1616, #1621 — are gate-integrity defects: tests or tooling that report
a verdict the codebase does not support. #1621 in particular cost a cycle on four separate PRs before
being named.

## Handover

Canary.5's blockers are both cleared: #1599 merged with `canary:0.0.6-canary.5`, and #1605 merged at
`bfcf4ed11`. **The runtime / public-surface lane is empty.**

0.0.6 now holds one open issue, docs-owned **#1531**, with its PR **#1608** non-draft.

**No release was dispatched from this lane**, and none should be inferred from these artifacts.
Release ownership hands to **ns006-fixes**.

## Control PR #1555 — closed, not merged

Closed as a non-merge orchestration record at owner direction, so it does not sit open against the
milestone. It carried **only** `.llm/runs/**` — verified at `4560ef9e5`, 72 commits ahead of `main`,
with **0** non-run-artifact files in its diff.

**Consequence worth stating: the artifacts live only on `chore/release-0.0.6-runtime-reopen`.** The
lane's first control PR (#1525) was merged at `0f0b6b6a3`, so that evidence reached `main`; this one
did not. Deleting the branch would destroy the whole reopen evidence trail — every drift entry (D-1
through D-14), every slice brief, every pre-merge gate record, and this retrospective. **Do not prune
it as a stale chore branch.**
