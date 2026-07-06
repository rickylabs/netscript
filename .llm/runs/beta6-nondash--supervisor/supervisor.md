# Supervisor Identity — beta6-nondash--supervisor

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5[1m]`) |
| Session | https://claude.ai/code/session_01A1oJ8GtXwhXC4VnYomQb5m |
| Host | Windows 11 Home, user `chaut`, WSL companion `codex-wsl` (Ubuntu-24.04, gh under user `codex`) |
| Checkout | `C:\Dev\repos\netscript-framework` (main) |
| Worktree | supervisor stays on main; per-slice worktrees under `.worktrees/` (Windows) + WSL clones for Codex |
| Branch | main (run artifacts committed to `chore/beta6-nondash-supervisor-run`, then per-slice branches) |
| Baseline | origin/main `a1669f60` (2026-07-06, fresh-ui pixel polish + process-manager seed artifacts) |
| Run ID | `beta6-nondash--supervisor` |

## Charter

`charter.md` in this dir is the verbatim owner prompt (2026-07-06) — beta.6 **non-dashboard**
program supervisor. Merge-on-green granted for slice PRs; owner cuts the release; no force-push.
Re-read after every compaction; the merge grant does NOT survive compaction — re-anchor from
`charter.md` (prep-green + owner batch if unsure).

## HARD EXCLUSION (owner mandate)

Dev-dashboard epic **#400** and all DDX issues **#410–#431** are out of scope — an owner-mandated
rescope runs in a parallel session (`.llm/runs/dashboard-rescope--seed/`, PR #506). Do not touch,
close, re-label, or build against them. Exception awareness: telemetry T7 **#408** is a dashboard
*consumer* surface — implement against its own contract; leave dashboard-panel integration to the
rescope; log coupling in `drift.md`.

## Lane table in force

Per `workflow/lane-policy.md`, carrying forward the beta.5 owner routing override
(`design/ROUTING-ADJUSTMENTS.md`, 2026-07-06):

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Fable 5 (this session) | orchestration, briefs, GitHub surface, per-slice substantive review + sign-off, run-dir upkeep. Never writes framework code. |
| B | Opus 4.8 **high** sub-agents | UI-heavy fresh-ui slices (#257/#258 candidates), deep research/audit, harness-doc authoring (#306 remainder) |
| C | Sonnet 5 **high** dynamic Workflows | batch/mechanical fan-out only; `workflow.js` committed in run dir BEFORE execution; never Fable in fan-out |
| D | WSL Codex GPT-5.5 **high** (daemon-attached) | framework/plugin source slices (default implementation lane); launched ONLY via `.llm/tools/agentic/` with thread id + worktree + steering command recorded |
| E | OpenHands (separate session) | PLAN-EVAL minimax-M3 (before any implementation slice); IMPL-EVAL qwen-3.7-max, ONE eval loop per PR (fix and ship, no re-dispatch) |

## Recorded lane/eval overrides

- ONE IMPL-EVAL loop per PR (charter + `single-impl-eval-loop-fix-and-ship` owner rule).
- UI + complex-thinking implementation may route to Tier B Opus 4.8 high (beta.5 owner override,
  carried forward as configuration; recorded per lane-policy "deviations are configuration").
- Merge-on-green grant for slice PRs (charter). Squash + `--delete-branch`; retarget stacked
  children before merging their base (stacked-PR auto-close landmine).

## Landmines in force (charter + memory)

- Generators (`gen:assets-barrel`) run in **Linux only** (Windows embeds `\r\n` → CI-only parity
  failures; PR #547).
- Push from WSL with explicit `HEAD:refs/heads/<branch>`; gh from WSL via `cd /tmp` + `--body-file`.
- WSL `wsl.exe bash -lc '...$var...'` EMPTIES variables — script files only, no inline vars.
- Verify OpenHands commit-back file sets before merge (lock churn / junk files).
- `db generate` is Aspire-coupled; deno-only jobs use scaffolded `db:generate`.
- E2E type soundness: only the 2 accepted casts (contract `as unknown as`, top router `any`).
- Validation evidence ONLY from scoped wrappers (`run-deno-check|lint|fmt.ts --root <pkg> --ext ts,tsx`).
