# Cut trace — 0.0.6 fixes lane

The instrumented merge record, captured **during the run from `git log origin/main`**, never
reconstructed from recollection. This lane declares no canary points and performs no cut (root owns
both); the trace exists so root can compute canary payload from merge history and so the next
milestone's rules are earned from evidence rather than memory.

## Merges

| # | Time (UTC) | Commit on `main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| _(none yet)_ | | | | | |

Baseline at run open: `origin/main@01aa12b67e36b643e1ca4f94421ecba07e030db5`
(`docs(harness): record FILING-LOG -- board migration executed once (#1523)`).

Rows are appended **only from live first-parent history** after a merge is observed, not when a
merge is requested. "Is it merged" uses **PR state, never commit ancestry** — under squash-merge a
merged commit is never an ancestor of the branch head, which is the defect that made 0.0.4's
`origin/main..HEAD` check unfireable.

## Re-planning events

| # | When | Event | Effect on the plan |
| --- | --- | --- | --- |
| _(none yet)_ | | | |

## Time-costing failures

| # | When | Failure | Cost | Rule earned / confirmed |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |

## Rules this run tests

Recorded at open so the run can falsify them rather than quietly patch over them. Each is
`[asserted]` until this lane's evidence moves it.

1. **Clustering two same-file release fixes into one PR costs less than the rebase it avoids**
   `[asserted]` — PR A clusters #1438 + #1430 in `github-release.ts`. Falsified if the focused
   IMPL-EVAL on #1438 is degraded by #1430 sharing the diff.
2. **The owner's E2E-guard IMPL-EVAL waiver is safe when negative tests are strong** `[asserted]` —
   PR C and D apply it conditionally. Falsified if a post-merge defect in either lands that a
   Fable 5 IMPL-EVAL would plausibly have caught.
3. **A fix whose issue carries no acceptance checkboxes is adequately close-gated by PR-body
   checklist + decisive-claim re-verification** `[asserted]` — #1438, #1430, #1428 have no boxes.
   Falsified if close-gate reports green on a PR whose stated acceptance was not actually met.
