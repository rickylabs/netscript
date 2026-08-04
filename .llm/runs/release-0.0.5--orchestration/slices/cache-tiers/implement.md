use harness

# Slice: #1252 — fresh/sdk cache-tier convergence

## SKILL

Activate `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `deno-fresh`. Per milestone
ruling D6: no local PLAN-EVAL; evaluation composes draft→ready augment + the orchestrator
pre-merge gate. Route: openai · gpt-5.6-sol · medium (owner-specified for this wave).

## The defect (issue #1252 is the specification — read it first)

Three divergences between cache tiers, found during a real onboarding build:
1. `queryOptions().queryFn` bypasses `CacheQuery`, so pages read around the very entry they
   just invalidated.
2. `IslandQueryOptions` rejects `initialDataUpdatedAt` even though the docs recommend it.
3. `QueryIsland`'s shared QueryClient loses to a pre-existing entry, so `initialData` is
   ignored on hydration — precedence is undocumented and surprising.

## The reference fix is committed and is your spec

`rickylabs/pulseboard` commit `56accbb` — 58 lines across three files, including an HTTP
route that exists ONLY to reach a server-only API from the browser. Fetch and read that
commit (gh api or clone read-only) before writing anything. Your job is to absorb into the
framework what that commit had to do in userland, so the next project never writes that
route. Where the userland workaround and a clean framework seam differ, choose the seam and
say so in the PR — do not transplant userland code verbatim into packages/fresh.

## Contract

- Worktree /home/codex/repos/ns005-cachetiers, branch fix/fresh-cache-tier-convergence
  (NO upstream; push explicit refspec).
- Contract first: state the intended cache-tier precedence (server cache → hydration
  initialData → client refetch) as types/docs, then implement, then test each of the three
  divergences RED-first against the current behavior.
- One PR, draft first, `Closes #1252`, acceptance-evidence YAML mirroring the issue's
  acceptance list, labels type:fix/area:fresh/area:sdk/priority:p1 + one status, milestone
  0.0.5. Tick only earned boxes. Smallest-proving validation (packages/fresh test task +
  scoped deno check); the orchestrator gate owns merge-readiness.
- If the framework absorption genuinely cannot land safely this milestone, deliver the
  honest partial (types + tests + the smallest safe subset) and say exactly what moves to
  0.0.6 and why — do not force it.
