# Context pack — 0.0.6 fixes lane

Shared context handed to every slice in this lane. Slice briefs reference this file rather than
restating it.

## What this lane is

Six pre-specified defects in milestone 0.0.6, split across two topics that share one failure class:

- **Release blockers** — #1438, #1417, #1430
- **CLI/E2E truth** — #1397, #1399, #1428

## The failure class every issue in this lane belongs to

**A check that reports a clean-looking result while not doing its job.** This is not a coincidence
of scheduling — it is the lane's subject:

| Issue | What reports clean | What is actually happening |
| --- | --- | --- |
| #1438 | fails closed with a plausible message | the documented inheritance path is unreachable, so *every* release hits it |
| #1417 | `publish:dry-run` exits 0 | 18–19 manifests silently rewritten, `catalog:` opted out of central version control |
| #1430 | `closed issues since previous release: 0` | the query was never run |
| #1397 | green `scaffold.runtime` aggregate | `behavior.service-health` was never executed on mysql/mssql |
| #1399 | `suite-registry_test.ts` passes | the pin covers 2 suites out of all of them |
| #1428 | `3 passed` | the DB-backed island was never emitted, so its imports were never resolved |

**Direct consequence for every slice in this lane: a fix is not done until its failure is
demonstrated.** Show the check red before the change and green after, by execution. A test that
passes both before and after the fix is the exact defect this lane exists to remove — shipping one
here would be self-refuting. The 0.0.4 precedent is `milestone-run.md` § Gate integrity: two guards
shipped whose predicate could never fire, and both looked correct.

## Prior art worth reading before implementing

- #1433 / `assert-release-version.ts` — the precedent for **deriving a verifier's expectations from
  the code that writes the thing**, so generator and verifier cannot disagree. #1438 names this as
  the safest construction.
- #1395 — introduced the deferred-gate machinery #1399 must pin. Deferral is definition-time only;
  a deferred gate cannot be produced from a failing one.
- #1436 — same session, same shape: close-gate matching `fix` inside `pre-fix`. Not owned here.
- #778 / #775 (0.0.4) — the precedent both #1397 and #1399 cite: PRs that looked mergeable with
  every substantive check skipped.

## Hard constraints for every slice

1. **No local publish, ever.** Release fixes are proven with the canonical release tests and
   dry-runs. No slice runs a real publication, and no slice hand-runs a publish step.
2. **Lock hygiene.** Do not commit `deno.lock` unless the change genuinely requires it. Never run
   `deno cache --reload` and never delete lock files or caches. #1417's acceptance explicitly
   asserts `deno.lock` stays unmodified.
3. **Immutable versions and canary evidence are preserved.** No slice retags, rewrites, or
   re-points an existing canary or release artifact.
4. **Expensive gates are serialised.** `scaffold.runtime` is taken by one slice at a time. Ask the
   orchestrator before starting one; three concurrent runs in 0.0.4 produced two contention
   failures that were not defects.
5. **Wrapper-sourced evidence only.** Type-check / lint / format evidence comes from
   `.llm/tools/run-deno-{check,lint,fmt}.ts` or the `deno task` wrappers. Raw root `deno check .` /
   `deno fmt --check` / `deno lint` are **non-verdicts** (`tooling.md`). Slices touching
   `packages/**` or `plugins/**` additionally run `deno task quality:gate`.
6. **`deno doc` before broad reads.** For internal `@netscript/*` surfaces, `deno doc <module>` and
   `deno doc --filter <symbol>` are cheaper than opening source.
7. **`rtk` prefix** on read-heavy `git`/`gh`/`grep`/`ls`, `rtk proxy` for `deno task` runs.

## PR obligations (non-negotiable, `AGENTS.md`)

- **Closing keyword in the PR body** for each issue the PR fully resolves — `Closes #N`. A bare
  `#N` or `Refs #N` does **not** auto-close; that omission stranded 40+ merged PRs.
- **Namespaced labels** (`type:`/`area:`/`priority:`/exactly one `status:`) and **milestone
  `0.0.6`**.
- **The PR-body checklist must match what shipped** — pre-merge check 7. `close-gate` validates
  *issue* boxes, not PR-body claims; #1088 merged asserting a hard stop while shipping the change.
- **The honesty rule.** A criterion that cannot be truthfully ticked is never ticked to clear a
  gate — it moves with its issue, with a written reason.

## Reference paths

| Path | What |
| --- | --- |
| `.llm/tools/release/github-release.ts` | #1438 (`isVersionOnlyReleaseDiff` ~132, `isExactVersionReplacement` ~151), #1430 (`--prev-tag` ~522) |
| `.llm/tools/release/run-publish-dry-run.ts` | #1417 |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` | #1397 (`POSTGRES_ONLY_RUNTIME_GATES` 155-161, `runtimeGateIds` ~294) |
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | #1399 |
| `packages/cli/src/public/features/root/public-command-tree_test.ts` | #1428 (fixture `--db none` ~166) |
