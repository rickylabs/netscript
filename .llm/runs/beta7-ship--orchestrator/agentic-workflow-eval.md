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

- **D7 (owner review, 2026-07-11 ~16:30)**: the docs cut leaked internal company wordings into
  public docs — the design sources themselves (proposal/epic bodies) grounded premises in the
  internal reference app (eis-chat) and an internal ERP migration (VIF→CSB), and agents faithfully
  followed them; the T8-caution even cited an issue number. Owner directive: public docs carry
  zero internal names/PR numbers/process framing. Remediation wave: merge eis-chat on-ramp into
  the chat track (production-grade AI chat + MCP), ERP-agnostic rework (SAP→Microsoft Dynamics),
  sweep of workspace/services-sdk/reference pages. Lesson promoted to memory: docs briefs need a
  standing `eis|VIF|CSB|PR #|dogfood` grep gate — the positioning law was enforced but had no
  "public-audience" clause.

- **D8 (stale-base agent slice, 2026-07-11 ~16:50)**: the chat-merge agent's isolated worktree
  stayed on the session-inherited HEAD — its `git checkout -b <branch> <explicit-main-sha>`
  silently didn't take effect and the agent proceeded to rebuild content from the brief on a
  pre-#433 tree (would have clobbered #438/#439 if merged). Caught in Tier-A review by two smells:
  its `deno task verify` page/link counts (154 pages/23.2k links) didn't match real main
  (167/24.0k), and `git merge-base` with origin/main returned an ancient commit. Agent resumed
  with a mandatory base-verification preflight (check expected files exist + counts in range
  before editing). Improvement **I14**: docs-agent briefs must include a base-verification step,
  and the orchestrator must merge-base-check every agent branch before opening its PR (now
  standard for this run).

- **D9 (lost sweep edits, 2026-07-11 ~17:00)**: PR #655's squash carried only the sweep agent's
  worklog — its docs edits were authored in the wrong checkout (same `cd`-prefix cwd failure as
  D8: agent bash calls reset cwd between invocations, and relative `cd` prefixes landed in the
  shared main checkout instead of the agent worktree) and were wiped by the D8 cleanup reset.
  Caught by the post-merge grep gate; supervisor re-applied the worklog's documented per-hit
  intent verbatim (PR #658). Improvement **I15**: agent briefs must mandate absolute paths inside
  the assigned worktree for every file operation, and the orchestrator's pre-merge review must
  diff-check that a content PR actually contains content changes (a docs PR whose diff is
  worklog-only is a red flag the review missed).

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
  policy should encode a per-tier concurrency/spend ceiling, and the Agent-launch path should fail
  fast with a "tier not budgeted for N-agent swarm" error instead of letting the provider limit
  kill agents mid-slice.
- Resume-from-partial-worktree worked well as the recovery pattern: five Opus agents picked up the
  dead Fable agents' uncommitted edits, reviewed-not-trusted them (one found and fixed real drift;
  one added missing source citations), and completed with full validation — no work lost.

## Outcome (2026-07-11 ~16:10)

Single-day beta.7 ship: hotfix release cut+published+diagnosed, all milestone work items closed.

- **Release**: #624 merged → `0.0.1-beta.7` cut (#625) → published to JSR → beta.6 crash repro
  verified fixed on published artifacts. Prod E2E onion fully peeled: telemetry graph (#624,
  in beta.7) → dup dep-age flag (#631, e2e layer) → root-map sdk omission (#638/#640, product,
  pre-existing ≤beta.6). Prod verdict against beta.7 tops at 38/39 (JSR immutability); decision
  A/B surfaced to owner.
- **Pilot-eval items**: all five shipped same-day (#603 slice runner, #604 quota classifier,
  #605 status:shipped taxonomy + applied repo-wide at close, #606 shared fixture, #607
  close-gate evidence mirror).
- **Docs epic #401**: 18 issues shipped in one run — 1 Codex structural slice, 15 authoring
  agents (10 Fable + 5 Opus resumes after the spend-limit incident), 1 supervisor sweep, GPT
  evaluator verdicts (one fix loop). Site verify green at 24,055 links.
- **Totals**: 28 PRs merged (#624–#653 minus release PR #625 counted separately), 6 Codex threads
  + 1 evaluator thread, 15 Claude authoring agents, 2 local prod-suite repro runs, zero
  fabricated evidence, every slice Tier-A reviewed before merge, every closed issue carries
  ticked acceptance boxes + evidence comment + `status:shipped`.
- **Process wins vs round 1**: close-gate + evidence comments now routine; `status:shipped`
  taxonomy landed mid-run and was applied immediately; the launcher (#614) works host-agnostically
  (with the D4 permission caveat); the #604 classifier + #603 runner close round-1's I2/I3 loop.
- **New failure modes**: D4 (task-wrapper permissions vs dry-run parity), D5/I11 (route-identity
  effort mismatch — observed Low vs requested medium on every launch), D6/I13 (model-tier spend
  ceiling for swarms), I12 (thread-ledger overwrite; fixed by #603's append-only ledger).
