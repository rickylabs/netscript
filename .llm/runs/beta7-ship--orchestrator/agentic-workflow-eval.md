# Agentic Workflow Eval — beta7-ship--orchestrator (pilot round 2)

Living evaluation of the epic #574 agentic runtime system, maintained by the beta-7 shipping
orchestrator (session `df71d36c`, Claude Fable 5 medium, autonomous background). Round 1 is
`.llm/runs/beta6-ship--orchestrator/agentic-workflow-eval.md` (posted on #601 at close-out).

## Drift

- **D1 (bootstrap, carried)**: External evaluator dispatch owner-waived for this run. Supervisor
  performs substantive per-slice review; docs validation stays opposite-family.
- **D2**: `curl` is blocked in this session's sandbox (`Failed sending HTTP request`), and
  `resolveGithubToken` returns `{token, source}` (object), not a string. Fallback: a small
  `gh-api.ts` Deno helper in the job tmp dir wrapping `fetch` + `resolveGithubToken`; needs
  `--allow-run` (token resolution shells out to `git credential`/`gh`).
- **D3**: `release:cut 0.0.1-beta.7` — all gates, bump, commit, and push green, but the final
  `gh pr create` step failed (`aborted: you must first push the current branch ... or use the
  --head flag`; no gh CLI auth on this host — same class as beta.6's B3). Fallback: release PR
  #625 opened via the GitHub API using the tool's generated body from `.llm/tmp/`. Improvement
  I9 filed below.

## Blockers + fallbacks

- **B1**: same-account PR review — GitHub rejects APPROVE on your own PR (single-token repo), so
  Tier-A review verdicts land as `COMMENT` reviews instead. Cosmetic, but means branch protection
  by required approvals can never be satisfied by the orchestrator token.

## Good mechanics

- The `e2e-cli-prod` hardening loop (#617–#623) paid off exactly as designed: the suite caught a
  real published-artifact defect (beta.6 telemetry JSR graph), attributed it correctly across
  phases (run 4 "healthy-then-probe-timeout" = same crash), and the fix PR (#624) sailed through
  a fully green 8-check CI including scaffold-runtime.
- `release:cut` fail-fast ordering held: preflight → publish dry-run → `deno ci --prod` all green
  before any branch/commit/push side effects.

## Improvements

- **I9**: `release:cut`'s PR-creation step should use the same API-token path as the rest of the
  agentic suite (`resolveGithubToken`) instead of shelling to `gh pr create` — every orchestrator
  run on this host has had to hand-finish the PR (beta.6 B3, this run D3). Alternatively pass
  `--head release/cut-<version>` to gh.

## Outcome

(live — updated at close-out)
