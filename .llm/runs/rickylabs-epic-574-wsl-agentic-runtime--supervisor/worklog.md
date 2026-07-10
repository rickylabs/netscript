# Worklog: epic #574 supervisor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `rickylabs-epic-574-wsl-agentic-runtime--supervisor` |
| Branch | `rickylabs-epic-574-wsl-agentic-runtime` |
| Archetype | Group-specific |
| Scope overlays | none |

## Design

### Public Surface

- GitHub epic, child issues, draft PRs, and phase comments.
- Tracked supervisor and child run artifacts.
- Checked-in agentic tools as the only Codex/OpenHands control surface.

### Domain Vocabulary

- **Phase group** — one child issue, branch, WSL worktree, nested run, draft PR, and evaluator pair.
- **Managed worker** — a Codex thread launched through `launch-codex-slice.ts` against the daemon.
- **Route identity** — provider, model, effort, worktree, branch, and thread/session identity.
- **Mobile proof** — managed daemon state, concrete thread ID, native worktree, and resume command.

### Ports

- GitHub issue/PR surface — canonical mobile-visible activity log.
- WSL Codex daemon — implementation dispatch and same-thread steering.
- OpenHands — separate PLAN-EVAL and IMPL-EVAL sessions.

### Constants

- `GROUP_ORDER` — `575, 576, 577, 578, 579, 580, 581, 582`.
- `FOUNDATION_MODEL` — `gpt-5.6-sol`, effort `high`.
- `PLAN_EVAL_MODEL` — `minimax/minimax-m3`.
- `IMPL_EVAL_MODEL` — `openrouter/qwen/qwen3.7-max`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Activate supervisor run and issue/PR surface | Harness artifact review | Supervisor run dir |
| 2 | Prepare and PLAN-EVAL PR 0A | OpenHands PLAN-EVAL PASS | #575 nested run dir |
| 3 | Launch and supervise the single PR 0A WSL worker | Managed daemon + thread + worktree + resume proof | #575 run artifacts and implementation |
| 4 | Evaluate and merge PR 0A | OpenHands IMPL-EVAL PASS and #575 acceptance evidence | #575 PR and run artifacts |
| 5 | Repeat the group protocol for #576-#582 | Per-group PLAN/IMPL-EVAL PASS | Child run dirs and PRs |

### Deferred Scope

- Child implementation details stay in each nested plan.
- Universal rollout stays blocked until #582 and owner approval.

### Contributor Path

Read `phase-registry.md`, then the active child run's `context-pack.md`, issue, and draft PR. Use
the checked-in agentic tools for status, launch, watch, resume, evaluator dispatch, and verdicts.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | 1 | bootstrap | Read #574-#582, all harness files, required skills, and agentic tooling. |
| 2026-07-10 | 1 | daemon preflight | Managed daemon reported CLI/Codex 0.144.1, app-server 0.142.5, known socket, and zero active app-server workers. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Keep implementation sequential by issue order. | The epic defines an explicit dependency order and each layer requires its own evaluator. | #574 |
| Treat GPT-5.6 Sol high as an authorized Tier-D override for #575. | Explicit owner directive. | Session directive |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Checked lane policy still names GPT-5.5-high. | significant | yes |
| Current Codex CLI and app-server versions differ. | minor | yes |

## Gate Results

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Harness activation | PASS | `supervisor.md` and mandatory run artifacts | Supervisor run active. |
| GitHub token | PASS | `deno task agentic:gh-token check` | Source/login only; token not printed. |
| Codex daemon passive status | PASS_WITH_SKEW | `deno task agentic:codex-status -- --pretty` | Managed socket present; version skew delegated to #575/#580. |

## Handoff Notes

- PR 0A must not launch Codex until its nested PLAN-EVAL artifact is committed with `PASS`.
- The first worker launch must be the only `send-message-v2` for its native WSL worktree.

