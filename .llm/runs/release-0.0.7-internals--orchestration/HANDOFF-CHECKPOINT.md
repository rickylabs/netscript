# Internals topic checkpoint — supervisor rotation

Rewritten 2026-09-02 on resume. **Ownership unchanged: `topic-internals-0.0.7`.**
The previous revision (2026-08-31) is superseded in full: every leaf it listed has landed or been
closed, and acting on its "immediate obligations" would re-chase finished work. Its *standing
hazards* section is preserved verbatim at the bottom — those are still live.

Base of record: `origin/main` = `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` (the #1910 merge).

## Everything the previous checkpoint listed is done

| Item | Disposition |
| --- | --- |
| #1751 / PR #1802 (the "DO NOT SHIP" root-suite failure) | **MERGED** |
| #1753 / PR #1823 (held behind the #1820 seam) | **MERGED** |
| #1827 / PR #1828 (P0, IMPL-EVAL running) | **MERGED** |
| #1737 (`fix/skills-canonical-tree-refs`, author active) | **CLOSED** |
| #1543, #1695, #1351 (remaining unstarted queue) | **CLOSED** |

Do not re-open, re-diagnose, or re-dispatch any of them.

## The `workflow` scope wall is gone

D-224 through D-226 were shaped by this session's token lacking PAT `workflow` scope, which made
`.github/workflows/**` authoring unpushable. `gh auth status` now reports
`gist, read:org, repo, workflow`. Both remaining issues are workflow changes and their authors can
push them. The taxonomy recorded on #1908 stays true as history; it is no longer a constraint.

## Live work

| # | Branch | Worktree | Thread | State |
| --- | --- | --- | --- | --- |
| 1905 | `ci/fresh-ui-lock-gate-triggers` | `worktrees/007-leaf-1905` | `01a06193-2960-7a30-8c87-3a8e12b57a6a` | **Author working** (openai/gpt-5.6-sol/high, route matched) |
| 1913 | `ci/repo-wide-concurrency-bounds` | `worktrees/007-leaf-1913` | none yet | **Briefed, dispatch held behind #1905 by ordering instruction** |

Both branches were cut at `77ad823dc`. Briefs:
`briefs/fresh-ui-lock-gate-triggers.md`, `briefs/repo-wide-concurrency-bounds.md`.

**#1641 is the coordinator umbrella — never edit, close, or merge it.** #1867 is milestone 0.0.8 and
outside this lane.

## Obligations this supervisor carries (not the authors')

1. **#1905 acceptance box 1 is not closable pre-merge.** GitHub evaluates a `pull_request` `paths:`
   filter from the base+head merge ref, and the trigger is `branches: [main]`. Every pre-merge PR
   carrying the fix also carries `.github/workflows/fresh-ui-quality.yml` in its own diff — already a
   triggering path — so no pre-merge PR can isolate the new trigger. After merge, open one PR whose
   diff is a single member manifest plus a deliberately stalened `packages/fresh-ui/deno.lock`,
   confirm `fresh-ui-quality` runs **and fails**, post the run id on #1905, then close the PR
   unmerged. **The issue does not close before that receipt exists.** Stated on the issue at
   dispatch, not discovered at close-gate.
2. **#1913 may need a supervisor decision.** The issue's acceptance assumes `queue: max` on both
   groups. For `release-canary` that is not obviously right: the group serializes *publishes* of one
   version against an immutable registry, where "replace the pending one" may be safer than "run
   them all". The author is instructed to stop and report if their analysis rejects `queue: max`
   rather than apply it.
3. **#1913's issue body contains a false premise.** It calls `pages-deploy` "dispatch-triggered
   rather than push-triggered" and rests its low-probability claim on that. `pages.yml` at
   `77ad823dc` declares `push: branches: [main]` as well, and the group
   `pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}` collapses every
   non-PR arm onto the literal. Exposure is ordinary main traffic. Correct the record when the slice
   lands.

## Standing hazards learned this run — carried forward verbatim

- **`pipe | tail` destroys exit codes.** Always `out=$(cmd); rc=$?`. This produced a false-green.
- **A passing RED is a red flag.** Verify RED by checking out the RED commit in a throwaway
  worktree, not in the live tree — one false RED came from a test edited between RED and GREEN, one
  from an uncommitted edit the test read off disk.
- **`ps`/`pgrep -f` self-matches your own grep.** Use `/proc/<pid>/cwd`, or rollout mtime.
- **Authors stall after completing work but before committing** (4× this release). Assess the
  working tree before assuming failure.
- **"docs-only" main advances are often not.** Diff before believing a characterization.
- **A `143` from `launch-codex-slice` does not mean the slice died.** The launcher blocks for the
  whole first turn; a supervisor-side timeout kills the launcher, not the daemon-hosted thread.
  Check `agentic:codex-status --user node` against the thread id in `codex-thread-ids.md` before
  relaunching — relaunching would duplicate the slice.
- **Never report a lane clear from a remembered offender set** (D-226). Re-derive from live runs.
- **`steps: 0` on a `cancelled` job is queue eviction, not a slice defect** (D-227). Enumerate
  candidates by job admission time, never run `created_at`.
