# Context Pack: G7 #457 native-first thin-client deploy E2E

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g7-457-e2e` |
| Branch | `feat/desktop-frontend-457-e2e` |
| Current phase | `plan-eval` (awaiting supervisor-dispatched group Plan-Gate) |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Research, plan, and the Design checkpoint are complete on the exact integration baseline. No
implementation has started. The run is at the hard stop before group PLAN-EVAL. Baseline
`packages/cli/e2e/tests/` is green at 45/45.

## Completed

- Activated/read the named harness, CLI, tools, PR, and WSL-remote skills plus doctrine, rtk, and
  jsr-audit required by repo rules.
- Read `workflow/run-loop.md`, activation, lane policy, Plan-Gate, plan protocol, Archetype 6, gate
  matrix, current doctrine verdict, relevant debt, and templates.
- Read live #457 (both amendments and dependency comment), #393, #394 and its owner ratification.
- Proved `HEAD = origin/feat/desktop-frontend = merge-base = 1709dcba`.
- Inspected existing deploy suite/runner and landed #452/#841/#842/#456 production contracts.
- Read official Deno Desktop distribution/auto-update/TLS documentation and upstream confirmation
  ordering source.
- Wrote all mandatory nested run artifacts and locked four implementation slices.

## In Progress

- None. Work is intentionally stopped for the group Plan-Gate.

## Next Steps

1. Fable supervisor dispatches formal open-model PLAN-EVAL in a separate session.
2. Evaluator writes `plan-eval.md` with `PASS` or `FAIL_PLAN`.
3. Only after `PASS`, begin S1 platform verdict semantics.
4. After each slice: gates → Tier-A review → supervisor sign-off commit → push → PR comment → pause.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| New `deploy.desktop-native` sibling suite | plan D1 | Keeps cheap `deploy.targets` stable. |
| First-class platform skip/`NOT_RUN` | plan D2–D3 | Prevents false greens. |
| Linux real dpkg transaction | plan D13 | Local mode is alternate-root and labeled honestly. |
| v1→v2 apply, then bad-v3→v2 rollback | plan D14–D17 | Separates the two acceptance claims. |
| Windows manual only | plan D18 | Actual execution remains owner-hosted. |
| No release publication | plan Non-Scope / Stop Lines | Ephemeral fixture only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/supervisor.md` | new | Run identity and route/attachment evidence. |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/research.md` | new | Re-baseline and findings. |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/plan.md` | new | Locked Option-A plan. |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/worklog.md` | new | Design checkpoint and plan evidence. |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/context-pack.md` | new | Resumable Plan-Gate handoff. |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/drift.md` | new | Append-only amendment/session drift. |

No product, suite, fixture, workflow, or lock file has been changed.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | Full CLI-E2E tests 45/45; clean exact-base git state. |
| Fitness | planned / NOT_RUN | Commands locked in `plan.md`; no implementation yet. |
| Runtime | NOT_RUN | Plan-Gate hard stop. |
| Consumer | NOT_RUN | Plan-Gate hard stop. |

## Open Questions

- None that force implementation rework. Windows/macOS execution results are explicitly safe to
  defer and remain `NOT_RUN` in this host.

## Drift and Debt

- Drift: Option A supersedes older graph/snapshot authority for this window-only beta.11 slice;
  agentic runtime did not expose the current Codex thread identity.
- Debt: no new debt planned; do not claim the existing Linux systemd debt closes without its exact
  gate.

## Commits

- See the draft PR’s commit list + per-slice PR comments. No commit existed when this context pack
  was written.
