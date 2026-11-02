# S3 integration scope conflict — stopped pending owner decision

Refs #2416. The same separate read-only Claude Opus 5.5 evaluator, requested high
effort, returned **FAIL_PLAN**, then **FAIL_RESCOPE**. Consecutive terminal failure
count: 2. The assignment's leaf profile ends this loop; no third attempt or new
evaluator is allowed. This is a scope decision, not a request to bypass CI.

Main PR #2558 introduced an absolute component-CSS guard: 220000 raw / 27000 gzip
bytes, with its stated purpose to remain below PR #2503's payload. Measurements
use that guard's sorted non-theme inventory, UTF-8/newline join and native gzip.

| Tree | Files | Raw bytes | Gzip bytes | Evidence |
| --- | ---: | ---: | ---: | --- |
| PR #2503 final head 028cfa15 | 52 | 270183 | 27152 | Measured baseline |
| Main 0af8fd9e | 52 | 215981 | 26527 | Measured baseline |
| Rebased parent | 74 | 281179 | 36011 | Actual configured gate FAIL |
| Composed full child | 90 | 344825 | 44998 | Read-only estimate, not a gate |

The baseline contains 66 components; the approved additions are 21 parent and
17 child. Initial proposed rates 3500/500 were rejected before implementation.
Actual baseline divided by 66, floored, gives 3272/401. Even those rates produce
parent ceilings 288712/35421 and full ceilings 344336/42238, above both PR #2503
bounds. The current parent gzip also exceeds that derived parent ceiling.
No budget code, threshold, credit, exclusion, skip or allowance was changed.
The five-MB native package gate passes; that does not make the CSS gate green.

The owner must choose the policy before integration can continue:

1. Ratify explicit higher aggregate limits or component rates for the frozen
   approved 21+17 inventory, knowingly exceeding PR #2503's payload. Retain the
   frozen-list/census/registry/non-empty-matching-CSS intersection, all-byte
   accounting, negative controls and explicit gate-policy disclosure in both PRs.
2. Approve a different measurement contract, such as a baseline cap plus a
   separately bounded S3 aggregate, or a per-install/per-collection budget.
3. Reduce the CSS-shipping S3 scope, explicitly changing the full assignment.
4. Keep the existing absolute cap and require lossless CSS reduction to fit it.
   The measured gzip gap is substantial; no success is promised.

## Preserved state

- Remote parent remains c5877ff8 and remote child remains a9078d68; no push or
  force-push was made in this reconciliation. Both PRs remain draft.
- Rebased parent 0d8cb882 is retained on a local backup branch. The canonical,
  uncommitted registry.generated.ts is left intact; exact bytes and its hash
  are saved privately. Prior parent c5877ff8 also has a local backup.
- Reviewed Desktop window/tray source c3dba2ce remains on its local backup.
  Its unit SOURCE round-1 review passed with zero blockers. The new child
  worktree exists only to record this stop; no child rebase or product edit ran.
- Main-only/non-CSS preservation and three unchanged locks are verified.
  Ordered browser CSSOM parity covers 74 files / 1589 rules / 0 differences.
- Old-base Desktop executions are historical: 863 package, 791 Chromium,
  72 affected Firefox/WebKit, 140 docs, 200 native-tab and 20 wheel cases passed.
  They do not establish new-base acceptance or exact-head green CI.
- The evaluator print process exited 0 after its terminal FAIL_RESCOPE; its
  read-only turn is closed and no evaluator request remains active. This helper
  acquired no persistent scheduling lease. Private resume identity is preserved
  for owner-authorized recovery, never published.

The phase state is stopped-for-owner-decision. Four remaining Desktop audits,
production declared x extensions, all-style base/extension/browser coverage and
whole-phase runtime/final evaluation/exact-head CI remain unfinished. The existing
owner x-extension decision remains binding; no extension implementation is claimed.
There is no READY, final-report handoff, merge, tag, release, label or closing keyword.
Resume only under an owner-authorized new leaf or loop, with fresh integrated
gates and separate review. The completed loop must not be silently reset.
