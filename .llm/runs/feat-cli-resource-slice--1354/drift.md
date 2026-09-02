# Drift log — resource-slice plan (#1354)

## 2026-09-02 — three evaluator cycles produced no submission delta

- **Severity:** process.
- **Expected:** each `FAIL_PLAN` returns a concrete delta that is applied before the next PLAN-EVAL.
- **Observed:** three evaluator artifacts were added across consecutive cycles while `plan.md`
  remained byte-identical at `b210f9092`; the same plan-completion findings were therefore
  re-recorded instead of resolved.
- **Resolution:** this revision applies the fully specified cycle-3 delta before requesting another
  evaluator pass. D1–D9's architectural intent is preserved.
- **Lesson:** a new evaluator artifact is not progress by itself. Before dispatching another cycle,
  the supervisor must verify that `git diff <last-evaluated-head> -- plan.md` contains the required
  submission delta and record that verification in `worklog.md`.

## 2026-09-02 — D3 exceeded its declared touch-set capability

- **Severity:** scope.
- **Expected:** every planned behavior is implementable by a file and IO boundary named in a
  declared slice touch set.
- **Observed:** D3 grew four flags (`--keep`, `--replace`, `--abort`, `--recover`) and three IO
  adapter concerns (journal storage, invocation locking, and backup/restore), but no slice owned
  those adapters and #1354 acceptance does not require them.
- **Resolution:** coordinator-directed subtraction removed the mechanisms, preserved all pre-apply
  safety guarantees, and explicitly deferred crash/mid-rename atomicity and concurrent-invocation
  locking to a later issue with the necessary IO-adapter scope.
- **Lesson:** a plan may only promise behavior some slice's declared touch set can implement. A
  safety mechanism without an owning adapter, tests, and ceiling slot is deferred scope, not an
  implementation promise.

## 2026-09-02 — Slice F retire-set omitted surviving importers and orphans

- **Severity:** enumeration.
- **Expected:** retiring canonical templates also disposes every file that imports them and every
  file whose only consumer is retired.
- **Observed:** Slice F named the primary canonical removals but omitted three dependent importers
  and five newly orphaned templates that the init writer would continue rendering.
- **Resolution:** the eight files and their manifest/carrier keys are now explicit Slice-F removals;
  the real type consumers are named, and the ceiling grows by exactly eight.
- **Lesson:** a retire-set is only complete when every consumer of a retired file is either retired
  with it or has a named surviving consumer. Slice F's list was checked for what it removes and not
  for what still imports it.
