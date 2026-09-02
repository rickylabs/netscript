# Plan — #1908: isolate the runtime concurrency keys across the #1846 transition

## The defect, precisely

#1846 (merged `6bb9c00f9`) changed both runtime tiers in `.github/workflows/e2e-cli.yml` from
`cancel-in-progress: true` to `cancel-in-progress: false` + bounded `queue: max`, so an overflowing
runtime gate **defers** instead of being cancelled.

GitHub applies **the arriving run's own** concurrency configuration. The tier groups are **repo-wide
literals**:

- `e2e-scaffold-runtime-global`
- `e2e-scaffold-runtime-sqlite-global`

A run from a **pre-#1846 branch** therefore joins the *same* group as a run from a fixed branch and
brings `cancel-in-progress: true` with it — cancelling whatever is in progress, **including branches
that already carry the fix**. One stale branch re-imposes the old behaviour on the entire repository.

## Proof this is real, not theoretical

PR #1889 (`refactor/sdk-transport-policy`), branch carrying the fix, run `33592310517`, head
`1154800b9`:

| Attempt | Job | Started | Cancelled |
| --- | --- | --- | --- |
| 1 | `scaffold-runtime-sqlite` | `04:50:48Z` | `04:51:13Z` |
| 1 | `scaffold-runtime (docker)` | `04:50:48Z` | `04:54:51Z` |
| 2 | `scaffold-runtime-sqlite` | `04:56:57Z` | `04:58:36Z` |

No newer run existed on that branch in either window, so per-ref supersession is excluded. Attempt 1's
docker cancellation lands seconds after `feat/aspire-13-5-s8-typed-resource-commands` arrived
(`04:54:28Z`); attempt 2's sqlite cancellation lands while that same run is `in_progress`.

Confirmed by reading `.github/workflows/e2e-cli.yml` on each concurrent branch — all forked from
`e938ecd31`, all `queue: max` **absent** and `cancel-in-progress: true` **present**:
`feat/aspire-13-5-s8-typed-resource-commands`, `test/aspire-13-5-s10-e2e-gate-upgrades`,
`docs/aspire-13-5-s11-public-docs-refresh`. `main` and #1889 both have `queue: max` (3 occurrences).

## The repair — smallest change that isolates the keys

Rename both repo-wide tier group literals so a fixed workflow and a stale workflow **cannot share a
mutex**:

| Job | From | To |
| --- | --- | --- |
| `scaffold-runtime` | `e2e-scaffold-runtime-global` | `e2e-scaffold-runtime-global-v2` |
| `scaffold-runtime-sqlite` | `e2e-scaffold-runtime-sqlite-global` | `e2e-scaffold-runtime-sqlite-global-v2` |

Stale branches keep the v1 key and cancel only each other. Fixed branches share v2 and defer under
`queue: max`. Nothing else about the queue policy changes.

## The trade-off — state it, do not hide it

During the transition this permits **one v1 job plus one v2 job per tier — up to two concurrent
runtime jobs**, where the header currently promises at most one repo-wide. That promise is #1839's
acceptance box 2, so the change must not silently contradict it.

It is acceptable, and the reason is specific: both tiers are `runs-on: ubuntu-latest`, i.e. **isolated
GitHub-hosted VMs**. The header's "contend for host resources" is therefore a cost/quota control, not
a correctness one — two concurrent jobs cannot collide on a host. The single-job invariant is restored
**exactly** once every live branch carries the v2 key, with no further change.

The alternative — waiting for every branch to integrate main — needs no code but leaves every topic's
runtime verdict destructible in the meantime, with no completion date. It is being pursued in parallel
via the Aspire lane and is not a substitute.

## Slices

**Slice 1 — rename the two group keys.** Exactly two literal changes in `e2e-cli.yml`. No change to
`cancel-in-progress`, `queue: max`, job names, `if:` conditions, or the classifier.

**Slice 2 — document the transition in the workflow header.** The header is the acceptance surface of
#1839 box 4 and is where the next reader will look. It must state: why the key is versioned; that a
`cancelled` runtime job seen on a **v1** branch during the transition means "an unfixed branch is
still live", not a defect in the queue policy; and that the at-most-one-per-tier promise holds within
a key generation and is restored globally once every branch carries v2. Do not overwrite the existing
queue-policy paragraph — extend it.

**Slice 3 — evidence.** Record the before/after group literals and a grep proving exactly two
occurrences changed and no other concurrency directive moved.

## Non-scope

- The `queue: max` bound, `cancel-in-progress: false`, and the tier group **semantics** — #1846's
  behaviour on a uniformly-updated repo is correct and independently proven. Do not revisit it.
- The top-level per-ref group (`e2e-cli-${{ github.workflow }}-${{ github.ref }}`,
  `cancel-in-progress: true`). Per-ref supersession on push is intended and disclosed (#1846 F-3).
- Any other workflow, the classifier, and every `packages/**` and `plugins/**` path.
- Do **not** push to another topic's branches to update them.

## Acceptance

- [ ] Both runtime tier groups use a v2 key; exactly two literals changed, proven by diff.
- [ ] `cancel-in-progress: false` and `queue: max` are unchanged on both tiers.
- [ ] The header documents the versioned key, the transition semantics of a `cancelled` v1 job, and
      the scope of the at-most-one-per-tier promise.
- [ ] The workflow remains valid YAML and the file parses (`deno task check` unaffected; validate the
      YAML explicitly).
- [ ] No file outside `.github/workflows/e2e-cli.yml` and the run artifacts is modified.

## Required evidence

- [ ] `git diff` showing exactly the two key literals changed.
- [ ] A grep of all `concurrency:` blocks before and after, proving no other directive moved.
- [ ] Real captured exits (`out=$(cmd 2>&1); rc=$?`) — never a pipeline, which discards exit codes.
