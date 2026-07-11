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

- **D4**: `deno task agentic:launch-codex-slice` (non-dry-run path) crashes with
  `NotCapable: Requires env access to "HOME"` — the task definition grants
  `--allow-read --allow-write --allow-run` but the sender-registry code path
  (`~/.config/netscript-agentic/runtime/senders`) needs `--allow-env`, which `--dry-run` never
  reaches. Owner granted full access; fallback: invoke
  `.llm/tools/agentic/codex/launch-codex-slice.ts` directly with `-A`. The #614 host-agnostic fix
  itself works (dry-run validated, threads launch from inside WSL). Improvement I10 below.

## Blockers + fallbacks

- **B1**: same-account PR review — GitHub rejects APPROVE on your own PR (single-token repo), so
  Tier-A review verdicts land as `COMMENT` reviews instead. Cosmetic, but means branch protection
  by required approvals can never be satisfied by the orchestrator token.

- **D6 (owner lane correction, 2026-07-11 ~15:15)**: the 15-agent docs swarm was launched on
  Fable 5 (per the launch brief's "Docs lane: Claude sub-agents (Fable, low)"); 10 completed but
  the run hit the **Anthropic monthly spend limit** mid-swarm — 5 agents (#434 #444 #445 #447
  #448) terminated with partial work stranded in their worktrees. Owner corrected the lane live:
  **Opus 4.8 for docs swarms (high for complex docs); Fable prohibited for swarm use** (single
  complex engineering delegation only). Relaunched the 5 dead slices on Opus 4.8 high against the
  same partial worktrees. Lane-policy docs row should be updated to encode this.

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

- **I10**: add `--allow-env` to the `agentic:launch-codex-slice` task definition (deno.json) so the
  non-dry-run sender-registry path works; dry-run's permission surface should match the real run's
  (a dry-run that passes while the real run crashes on permissions defeats its purpose).

- **I11 / D5**: launcher route-identity validation reported `Observed route: effort=low` vs
  requested `medium` on ns-606 (`-c model_reasoning_effort=medium` passed). Either the config
  override isn't honored by `debug app-server send-message-v2` or the observed-identity probe reads
  a different scope. Needs a runtime fix — this is exactly the drift the RouteIdentity contract
  exists to catch, and today it only warns.
- **I12**: `launch-codex-slice.ts` overwrites `codex-thread-ids.md` per launch (last-writer-wins
  when several slices share a run dir). It should append/merge per-slice sections.

- **I13**: the harness needs a budget-aware swarm planner — the docs fan-out was correct
  work-shape-wise but the model tier (Fable) blew the monthly spend cap mid-swarm (D6). Lane
  policy should encode a per-tier concurrency/спend ceiling, and the Agent-launch path should fail
  fast with a "tier not budgeted for N-agent swarm" error instead of letting the provider limit
  kill agents mid-slice.
- Resume-from-partial-worktree worked well as the recovery pattern: five Opus agents picked up the
  dead Fable agents' uncommitted edits, reviewed-not-trusted them (one found and fixed real drift;
  one added missing source citations), and completed with full validation — no work lost.

## Outcome

(live — updated at close-out)
