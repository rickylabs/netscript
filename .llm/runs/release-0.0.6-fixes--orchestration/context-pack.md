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

---

# Closing record — 0.0.6 fixes lane

Written at lane close, 2026-08-12. Factual retrospective; **no workflow doctrine changed
mid-experiment**, per the owner's standing instruction.

## Delivered

All six originally-owned issues closed with verified acceptance, across four leaf PRs merged to
`main`, plus one green canary checkpoint.

| # | Commit | PR | Issues |
| --- | --- | --- | --- |
| 1 | `69485b8fd` | #1535 | #1428 |
| 2 | `cd24e1679` | #1534 | #1397, #1399 |
| 3 | `84dd44ae7` | #1538 | #1417 |
| 4 | `3c9dc1f39` | #1539 | #1438, #1430 |

Canary **`v0.0.6-canary.2`** from authorized source `e67c1ba13`, 35/35 members, `release/canary-pair`
green. All ten items (6 issues + 4 PRs) carry terminal `status:shipped`.

Filed from inside the run: **#1540** (interrupted publish/preflight tree safety, since triaged into
0.0.6) and **#1564** (stale `pull_request.base.sha`). Contributed to the internals lane's **#1403**.

## What this lane was actually about

Every owned issue was one failure class: **a check that reports a clean result while not doing its
job.** The lane then hit that same class *eleven more times in its own execution* — which is the
most useful thing it produced.

| Where it appeared | The false-clean signal |
| --- | --- |
| CI, all four PRs | every check `SKIPPED` while draft — merging would have looked identical to green |
| `scaffold-runtime` | `SUCCESS` by classifier short-circuit; only step 2 vs step 10 distinguishes it from a real 5-minute run |
| `scaffold-runtime` again | `CANCELLED` by repo-global contention — a did-not-run that reads as neutral |
| `close-gate` on #1535 | green on a box-less issue, asserting nothing (my falsification of this was itself overstated and corrected) |
| `quality:gate` on #1539 | `SUCCESS` while a new `as unknown as` sat in the diff |
| `code-quality.yml` | scanned **nine already-merged foreign files**, zero lines of the PR under review |
| #1438 cycle 1 | writer `--check` compared the prose blob **to itself**; injected content reached the published barrel |
| #1438 cycle 2 | same tautology one file over, in `provenance.json` |
| my changed-file audit | `origin/main..HEAD` rendered other lanes' merged work as deletions |
| my corpus probe | dict iterated as list → confident `0` where the truth was 60 |
| my member probe | glob-as-literal → `0 discovered`; then `urllib` rejected → `35 missing`; truth was 35/35 |

**Four of those were mine.** The orchestrator enforcing negative controls on every slice ran
unvalidated probes and believed their first answers. The lesson that generalises: *a probe that can
only return "clean" by silently doing nothing is not evidence* — print the container shape, the
count, the range form, before trusting the number.

## Rules this run tested

1. **Clustering two same-file release fixes into one PR** — `[confirmed]`. #1438 + #1430 shared
   `github-release.ts`; the focused evaluation was not degraded by the shared diff, and #1430 was
   judged correct and complete in every cycle while #1438 took three.
2. **The E2E-guard IMPL-EVAL waiver is safe with strong negative tests** — `[confirmed]`. PRs C and D
   both demonstrated red-before/green-after by execution; D showed the decisive control (the pre-fix
   break staying **green**, proving the gap was real). Nothing has surfaced against either since.
3. **A box-less issue is adequately close-gated by PR-body checklist + decisive-claim
   re-verification** — `[disproved, then corrected]`. close-gate *does* validate PR-body boxes; what
   it cannot do is verify a ticked box is true. For a box-less issue its signal reduces to the
   PR-body checklist with no issue-side cross-check. The correction is recorded next to the original
   because an overstated falsification quietly tidied away destroys the same evidence as a real one
   patched over.

## What cost the most time, in order

1. **Three evaluation cycles on #1438** (~3h). Two genuine holes, each admitting arbitrary
   non-version content for canary-pair inheritance. Found only by an adversary briefed to attack the
   inheritance path — seven green CI checks, 3188 tests and both runtime tiers missed both.
2. **Wrapping the slice launcher in `timeout`** (~16 min × 2 slices). Killed the turn ~25s later;
   both slices looked healthy inside that window. Recovered via `codex-resume` with work intact.
3. **Stale-base effects** (~30 min across two gates). One stale `pull_request.base.sha` broke
   evaluator prompt resolution *and* poisoned the quality scan's changed-file range.
4. **close-gate label ordering** (~20 min × 3 PRs). The mirror refuses to run without
   `status:ready-merge`, and `ci.yml` has no `labeled` trigger — so the working order is label first,
   then re-run `ci`.

## Cross-lane collaboration

Four corrections were exchanged with the internals and docs lanes, **each direction wrong at least
once**, and every one caught by the other lane forcing a probe rather than accepting a mechanism:
my roots-exclusion claim, their reconstruction of my case, my five-site blast radius, my
regeneration-is-a-rewrite remark. The operational rule that came out of it: *when a claim is about a
specific observed event, the probe must be that event's inputs, not the mechanism's source.*

Their D-24 hazard (a verdict read matching a superseded run) arrived hours before #1539's merge and
is the reason that merge is head-matched. This lane's step-2-vs-step-10 rule and stale-base finding
went the other way.

## Open, handed on

- **#1540, #1456, #1460, #1454** — triaged into this lane, planned as four separate connected PR
  groups (waves 3–4), **undispatched**. Branch from current `main`; re-sync immediately before
  draft→ready so the base is fresh when gates compute ranges.
- **#1564** — stale-base audit; one affected line (`code-quality.yml:39`), three sites verified safe
  by three-dot semantics, one already fixed by #1552.
- **Next publication should carry a material package/runtime delta** (owner, at close). `3c9dc1f39`
  is a checkpoint *candidate*, and it is materially different from the last: `isVersionOnlyReleaseDiff`
  now accepts a real coordinated cut, so the next canary can **inherit** its parent's pair rather
  than prove it directly — the path 0.0.5 paid an extra cycle for is live for the first time.
- The shipped MCP corpus remains a 0.0.5-era snapshot (60 `api-clients` references); the docs lane's
  **#1531** closes it and must land last among docs changes.
