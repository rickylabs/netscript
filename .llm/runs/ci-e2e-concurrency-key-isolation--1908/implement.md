use harness

## SKILL

Activate `netscript-harness` for this slice, plus `netscript-tools` (repo tooling, validation
evidence, real captured exits, lock hygiene) and `netscript-pr` (branch/PR/issue process: the closing
keyword is mandatory in the PR body, and exactly one `status:` label plus an explicit milestone).
`netscript-doctrine` is **not** engaged: this slice touches no `packages/**` or `plugins/**` path.

# Implementation brief — #1908

Read `plan.md` in this directory first; it carries the defect proof, the trade-off, and the slices.

You are implementing a **two-literal** change in `.github/workflows/e2e-cli.yml` plus a header
documentation extension. This is blocking PR #1889, whose runtime receipt this defect has already
destroyed twice.

## Do exactly this

1. Rename `group: e2e-scaffold-runtime-global` → `group: e2e-scaffold-runtime-global-v2`.
2. Rename `group: e2e-scaffold-runtime-sqlite-global` → `group: e2e-scaffold-runtime-sqlite-global-v2`.
3. Extend the existing "Queue policy" header paragraph — **do not replace it** — to state:
   - the tier group keys are **versioned**, so a pre-#1846 branch cannot share a mutex with a fixed
     branch and re-impose `cancel-in-progress: true` on it;
   - during the transition a `cancelled` runtime job on a **v1** (unfixed) branch means an unfixed
     branch is still live — it is **not** a defect in the queue policy;
   - the at-most-one-running-per-tier promise holds **within a key generation**, and is restored
     repo-wide once every live branch carries the v2 key.

## Hard constraints

- Change **nothing** else: not `cancel-in-progress`, not `queue: max`, not job names, not `if:`
  conditions, not the top-level per-ref group, not the classifier, not any other workflow.
- Touch no `packages/**` or `plugins/**` path.
- Do not push to any other topic's branch.

## Evidence to capture, with real exits

Use `out=$(cmd 2>&1); rc=$?` — a pipeline discards the exit code and has already produced one false
green in this release.

- `git diff` proving exactly two literals changed.
- Before/after listing of every `concurrency:` block, proving no other directive moved.
- Explicit YAML validity check of the workflow.

Write `worklog.md` (with a Design section and a slice table) and `drift.md` in this run directory.
Commit with a message stating the defect and the trade-off. Open a PR with `Closes #1908`, the
namespaced taxonomy labels, milestone `0.0.7`, and a Definition of Done. State the two-concurrent-jobs
transition trade-off in the PR body — do not omit it because it is inconvenient; it is the reason a
reviewer might reasonably object, so it must be the part they see first.
