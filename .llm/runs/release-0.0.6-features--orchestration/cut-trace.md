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
