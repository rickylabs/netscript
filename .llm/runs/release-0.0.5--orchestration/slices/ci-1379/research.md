# Research: #1379

Baseline: `origin/main@2e7c845ada054d678b58594673cc70697a373bd0` on
`fix/gate-fresh-ui-package`.

## Findings

1. `@netscript/fresh-ui` is a published Archetype-4 package with six export subpaths. Doctrine
   verdict 10 is **Keep**; this slice changes its fitness coverage, not its public API.
2. Root `check` excludes `packages/fresh-ui`; root `lint` excludes `packages/fresh-ui` and
   `packages/cli`. No workflow names `fresh-ui`.
3. The package is a root-workspace member but owns `packages/fresh-ui/deno.lock`. Its check task
   explicitly selects that lock. The only other tracked locks are the root and docs-site locks.
4. The package manifest deliberately pins `@netscript/sdk/auto-update` and
   `@netscript/sdk/desktop` to `jsr:@netscript/sdk@0.0.4` subpaths. Joining the root lock would
   expand this slice into a dependency-resolution change.
5. Current package check exits 0 but rewrites the private lock: SHA-256
   `499bbc205b3448c393e807b8220e3c1581a1a1ed739e899cea535c8c2565309c` to
   `79097acf20de876869f065809f208e721e817a7e198734d180fad085bde5754b` (197 insertions,
   61 deletions). The lock was restored explicitly after research.
6. The same check with Deno 2.9.5 `--frozen` exits 1 with `The lockfile is out of date` and leaves
   the SHA-256 byte-identical. This is the native exact enforcement required by rows 4, 5, and 9.
7. A scoped lint of all 150 Fresh UI TypeScript/TSX files exits 0 today, so removing the root lint
   exclusion does not require an allowance or rule narrowing.
8. CI change classification already treats `packages/**` as Deno-relevant. A dedicated
   path-filtered workflow is the smallest explicit receipt that both package gates execute whenever
   `packages/fresh-ui/**` changes.

## Live acceptance rows

Quoted from `gh issue view 1379 --repo rickylabs/netscript` on 2026-08-09:

1. `packages/fresh-ui` is type-checked by a CI job on PRs that touch it.
2. `packages/fresh-ui` is linted by a CI job on PRs that touch it.
3. The lock policy is recorded in the PR body as (a) join-root-lock or (b) frozen-private-lock.
4. Running the new CI step leaves `git status --porcelain` empty.
5. A lock rewrite during the check fails the job instead of being committed.
6. A deliberately broken type in `packages/fresh-ui/registry.ts` fails the new job (red-first).
7. A deliberately introduced lint violation in `packages/fresh-ui` fails the new job.
8. `deno.json:34` and `deno.json:143` no longer exclude `packages/fresh-ui`, or the remaining
   exclusion names the specific rule and a linked issue.
9. Tests cover the frozen-lock failure path if option (b) is chosen.
10. `gate:` root `deno task check`, `deno task lint`, and `deno task fmt:check` stay green.

## Lock decision

**LOCKED: frozen-private-lock.** Refresh the existing private lock once, then run the package check
with native Deno `--frozen`. This preserves the package's published-SDK compatibility graph, avoids
an unrelated import-policy migration, makes graph drift fail before mutation, and permits a final
whole-worktree cleanliness assertion. `join-root-lock` remains a possible future dependency-policy
change, but is larger and not needed to satisfy the defect.

## Scope boundaries

- No Fresh UI product source or export changes.
- No `/design/components` registry/gallery synchronization.
- No widening of `quality:scan` roots (#1378).
- No `packages/cli` lint-exclusion change.
- No Aspire, containers, or CLI E2E.
