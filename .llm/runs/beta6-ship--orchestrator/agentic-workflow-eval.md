# Agentic Workflow Eval — beta6-ship--orchestrator (pilot)

Living evaluation of the epic #574 agentic runtime system, maintained by the beta-6 shipping
orchestrator (session `fb43bc3e`, Claude Fable 5 low, overnight autonomous).

## Drift

- **D1 (bootstrap)**: External evaluator dispatch (OpenHands PLAN-EVAL/IMPL-EVAL sessions) is
  owner-waived for this run. Fallback: supervisor performs substantive review per slice; GPT lanes
  review Claude-authored work where launchable.
- **D2 (bootstrap)**: Launch checkout was detached-HEAD; work moved to worktree
  `beta6-ship-orchestrator` under `netscript-547-lffix`. Default worktree baseline was stale
  (`f7898dba`); `git fetch origin main` did not advance `refs/remotes/origin/main` (known
  refspec gotcha) — reset to `b13ca0fa` by explicit sha.
- **D3**: `launch-codex-slice.ts` is Windows-host-only (drives `wsl.exe`); from inside WSL the
  interop call fails (`Exec format error`), so git-safety reads empty branch/upstream and refuses
  to launch. Fallback (owner brief sanctioned the alternative path): direct
  `codex debug app-server send-message-v2` from each worktree with the launcher's exact route
  identity flags (`--model gpt-5.6-sol -c model_reasoning_effort=medium`) and brief rules
  (`use harness` first line, `## SKILL` section). Threads in `codex-thread-ids.md`. Owner's
  mobile screenshot later CONFIRMED these threads are mobile-visible with worktree + thread id.
- **D4**: #258's `gate:e2e`/`ui:add` acceptance boxes were deferred-by-design to the #561/#564
  slice; CI `close-gate` blocked PR #594 until every box was checked, so the e2e slice was stacked
  on `feat/258` and #594 merged after its evidence landed. Merge order re-sequenced, not skipped.
- **D5**: T8 slice rescoped once (Tier-A authorization): generated scaffold resolved published
  beta.5 telemetry, so the new callback-leg assertion was legitimately red; authorized
  per-resource local-source fixture mapping in the e2e layer only (pattern of
  `scaffold.ui-local-source` from #597). Product source untouched.
- **D6**: Model-capacity error (gpt-5.6-sol "at capacity") interrupted T8 mid-turn once; retry on
  the same route succeeded (Luna fallback staged but not needed).

## Blockers + fallbacks

- **B1**: stale `refs/remotes/origin/main` after fetch — fallback `git ls-remote` + explicit-sha
  reset.
- **B2**: agentic Codex launcher unusable from a WSL-resident supervisor (D3) — fallback manual
  replication of its launch command minus the `wsl.exe` wrapper, identity + brief validation
  preserved.
- **B3**: local `close-gate` replay needs `GITHUB_TOKEN` — resolved via `resolveGithubToken` from
  `agentic-lib.ts` (`deno eval` one-liner); this is how #594's close-gate failure was diagnosed
  without burning CI cycles.
- **B4**: Codex 5-hour quota exhausted at ~03:30 (owner screenshot; resets 05:42) with T8 mid-slice.
  Fallbacks: (a) resume process left alive (internal retry), (b) one-shot cron wakeup at 05:44 to
  rearm the thread, (c) meantime work shifted to Fable-lane subagents: milestone board audit,
  FAI-9 fixture-contract design prep, and release pre-gates on main (publish:dry-run, fmt, lint —
  all green).
- **B5**: #464 agent turn-1 correctly refused: T8 not merged (shared suite files) and no MCP server
  exists in the scaffold to round-trip against. Fallback: Fable subagent produced a verified
  fixture-MCP-server contract (`implement-464-fixture-brief.md`); agent resumes with it post-T8.

## Good mechanics

- CI runs the full `scaffold.runtime` (aspire+docker+postgres) job per PR — independent runtime
  verdicts on #568/#594/#597 at zero supervisor cost.
- `close-gate` verified-acceptance enforcement caught a real process gap (unchecked #258 boxes)
  before a merge could strand the issue; local replay made the fix loop cheap.
- Scoped check/lint/fmt wrappers emit compact JSON verdicts — ideal for supervisor loops.
- Codex agents honored harness discipline unprompted: T8 hard-stopped on missing PLAN-EVAL
  artifacts and asked for an explicit waiver; #464 refused to invent an MCP contract against the
  wrong baseline. Exactly the right failure modes.
- send-message-v2 + `codex exec resume` gave a workable supervise/steer loop with per-turn exit —
  each turn returns control to the supervisor, which composes well with background-task
  notifications.
- The `worklog in the implementation worktree, committed with the slice` convention meant slice
  evidence traveled with the branch (survives supervisor context loss).
- Guard tests as contracts: the workspace-mutator rewrite-map guard caught the missing
  `telemetry/hono` mapping instantly with an actionable message.

## Improvements

- **I1**: Make `launch-codex-slice.ts` host-agnostic — detect running inside WSL and exec locally
  instead of via `wsl.exe` (B2/D3). Same for `wslGitInfo` and the runtime repair path.
- **I2**: `send-message-v2` is single-turn; a slice needs N resumes. Provide a
  `codex exec run-slice` wrapper (or extend the launcher) that loops resume-until-done with
  quota/capacity-aware backoff and a wake-file for `watch-run.ts`.
- **I3**: Quota exhaustion (B4) should be a classified, machine-readable signal
  (`quota_exhausted` with reset timestamp) surfaced by codex-status so supervisors can schedule
  the rearm automatically instead of screenshot-driven steering.
- **I4**: Add a terminal `status:done`/`status:shipped` label to the taxonomy — closed issues
  currently keep stale phase labels (status:plan on closed #407/#258 etc.).
- **I5**: `agents --json` name field for background sessions is derived from the prompt head —
  give supervisors a way to set a stable display name for attach UX.
- **I6**: The e2e local-source mapping is being reinvented per gate (#597 ai mapping, T8 telemetry
  mapping). Promote a shared "local-source preparation" fixture helper in the e2e layer.
- **I7**: close-gate requires checked boxes on the ISSUE while the evidence often lands in the PR;
  a bot that mirrors PR-body gate evidence into issue checkboxes (or accepts PR-comment evidence)
  would remove a manual supervisor step.

## Outcome (2026-07-11 ~04:25, close-out)

Milestone 8 `0.0.1-beta.6` is RELEASE-READY. All 8 target issues resolved via 6 merged PRs
(#568→#407, #571→#569, #594→#258, #597→#561+#564, #598→#409, #600→#464); epic #399 closed with
all T-handles landed; product-gap follow-up #599 filed (found by the T8 gate, not masked).
Release gates: scaffold.runtime 58/58 (local + CI), repo check green, 1782 tests passed,
lint/fmt clean, publish:dry-run green. Publish deliberately NOT executed (owner hard stop).

Quota timeline: one 5-hour Codex window exhausted mid-T8 (~03:30–05:42); bridged with Fable-lane
subagents (board audit, FAI-9 fixture design, release pre-gates) and a scheduled rearm. Total
orchestration: 3 Codex threads, 2 Claude subagents, ~10 CI waits, zero fabricated evidence.

## Post-release addendum (owner-prompted, 2026-07-11 morning)

- **I8 (owner note)**: doc-only PRs should carry `ci:skip-e2e`/`ci:skip-scaffold` — the labels and
  skill guidance exist, but (a) this supervisor did not apply them to the #610 README pass (process
  miss), and (b) the CI docs-only classifier (`ci-classify-changes.ts`) treats ANY `packages/` path
  as non-docs, so `packages/**/*.md`-only diffs (README passes) always run the full aspire/docker
  scaffold gate. Fix: classify `*.md(x)`-only diffs as docs-only regardless of directory; harness
  skill: apply the skip labels when opening doc-only PRs. Filed as a #601 sub-issue.
- **Release-cut version drift (owner-spotted)**: markdown version mentions are outside the cut's
  bump surface, and `@netscript/ai`'s beta line was never in the publish set (JSR latest =
  0.0.1-alpha.0). Filed as #609; README-layer instances fixed in PR #610.
