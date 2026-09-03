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

## 2026-09-03 — implementation exercised both stop-and-amend clauses

- **Severity:** bounded enumeration drift.
- **Expected:** a slice stops before touching a file outside its declared set, and the supervisor
  amends the plan before work resumes.
- **Observed (F):** the retire-set's surviving `serviceReferences()` consumer lived in
  `agent-conventions.ts`, outside the 32-file list. Amendment `36492718a` invoked the complete
  retire-set consumer clause, added item 33, and raised the ceiling to 33. F later absorbed Slice
  E's deferred `public-command-dependencies.ts` composition path; evaluator finding M-1 records the
  33-enumerated-plus-one-absorbed accounting, while M-2 records debt
  `cli-resource-composition-io-1354`.
- **Observed (G):** the reachable rerun gate's stdout assertion required the existing suite-runner
  nominal fake. Amendment `8896b3b76` invoked the captured-stdout/runtime-reachability clause,
  added item 8, and raised the ceiling to 8 before implementation resumed.
- **Resolution:** both discoveries were authorized before their slice continued; no public flag,
  recovery machinery, or template extension point was added.
- **Lesson:** stop-and-amend clauses are executable scope controls: discovering a necessary consumer
  pauses the slice, updates its enumeration, and preserves reviewable accounting.

## 2026-09-03 — runtime prerequisites were absent from Slice G's initial ordering

- **Severity:** implementation design drift, resolved in the slice.
- **Expected:** the resource acceptance pair is reachable before generated quality/type-check gates.
- **Observed:** procedure resolution imports generated database contracts, so the pair must run
  after `database.codegen` and its adjacency-protected service-client contract probe. The original
  resource name `users` also collided with init's existing `users` route alias.
- **Resolution:** G cycle 2 moved both gates after the prerequisite pair and changed only the
  generated resource label to `people`; client `users` and procedure `list` remain explicit. The
  suite-runner fake emits the amendment-authorized skip-only stdout. The final slice receipt is
  `PASS_IMPL` cycle 2.
- **Lesson:** E2E gate placement follows the runtime prerequisites of the command it invokes, not
  merely the source-order location where its gate object is composed; fixture aliases must also be
  checked before selecting generated names.

## 2026-09-03 — Slice E findings were dispositioned downstream

- **Severity:** bounded follow-up.
- **Observed:** E's evaluator left LOW-1 (positive ready-plan dry-run proof) and LOW-2
  (non-reconciler pre-apply error normalization).
- **Resolution:** F absorbed LOW-1. LOW-2 remains explicitly deferred with the composition/staging
  extraction under debt `cli-resource-composition-io-1354`; it is not silently marked complete.

## 2026-09-03 — pre-implementation handoff became false-done state

- **Severity:** process.
- **Expected:** the plan PR's run packet reflects the implementation fan-out it authorized.
- **Observed:** after B–E merged and A/F/G reached passing evaluator receipts, the master
  `context-pack.md`, `supervisor.md`, and `worklog.md` still said implementation had not started.
- **Resolution:** this append-only closeout records both amendments, every PR/head or merge SHA,
  every evaluator receipt, and the remaining open stack without rewriting the original chronology.
- **Reconciled ledger:** A #1950 open at `d55afbef5`; B #1943 merged as `3c8b0fd18`; C #1946
  merged as `e341c6f710`; D #1948 merged as `3a794be67b`; E #1954 merged as `a867ab9cba`; F #1956
  open at `0c95978c63`; G #1958 open at `bc116bb5df`. Their receipts are respectively `PASS_IMPL`,
  `PASS`, `PASS`, `PASS`, `PASS_IMPL_WITH_FINDINGS`, `PASS_IMPL_WITH_FINDINGS`, and `PASS_IMPL`
  cycle 2.
- **Lesson:** a planning packet is not complete when its plan passes; its closeout must reconcile
  the downstream slice ledger so historical launch state cannot masquerade as current truth.
