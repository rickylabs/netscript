# Context Pack: G7 #457 native-first thin-client deploy E2E

## Run Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g7-457-e2e`                    |
| Branch         | `feat/desktop-frontend-457-e2e`                                 |
| Current phase  | `implement` — S1 complete locally, awaiting Tier-A slice review |
| Archetype      | `6 — CLI / Tooling`                                             |
| Scope overlays | `none`                                                          |

## Current State

The Tier-A group Plan-Gate passed with D1–D19 locked. S1 is implemented locally: platform-aware
gates emit structured `NOT_RUN`, the platform source is injected, and `deploy.desktop-native` is
registered with an honest preflight that fails until S2 creates the fixture. The full E2E test
directory is green at 47/47. The slice is paused before commit/push/PR for Tier-A review.

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
- Recorded the supplied Plan-Gate `PASS` in `plan-eval.md` before implementation.
- Implemented S1 platform applicability, `NOT_RUN` evidence, suite registration, and tests.
- Ran scoped check/lint/fmt (93 files, zero findings) and full E2E unit tests (47/47).

## In Progress

- Tier-A substantive S1 review. No implementation lane self-certification is claimed.

## Next Steps

1. Tier-A reviews the S1 diff and gate evidence.
2. On approval, commit the sign-off slice, push with an explicit refspec, open the draft sub-PR
   against `feat/desktop-frontend` with `Refs #457`, and post the gate-evidence comment.
3. Pause again; do not begin S2 without the next Tier-A instruction.

## Key Decisions

| Decision                                  | Source                      | Notes                                              |
| ----------------------------------------- | --------------------------- | -------------------------------------------------- |
| New `deploy.desktop-native` sibling suite | plan D1                     | Keeps cheap `deploy.targets` stable.               |
| First-class platform skip/`NOT_RUN`       | plan D2–D3                  | Prevents false greens.                             |
| Linux real dpkg transaction               | plan D13                    | Local mode is alternate-root and labeled honestly. |
| v1→v2 apply, then bad-v3→v2 rollback      | plan D14–D17                | Separates the two acceptance claims.               |
| Windows manual only                       | plan D18                    | Actual execution remains owner-hosted.             |
| No release publication                    | plan Non-Scope / Stop Lines | Ephemeral fixture only.                            |

## Files Changed

| Path                                                                               | Status       | Notes                                             |
| ---------------------------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/supervisor.md`               | new          | Run identity and route/attachment evidence.       |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/research.md`                 | new          | Re-baseline and findings.                         |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/plan.md`                     | new          | Locked Option-A plan.                             |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/worklog.md`                  | new          | Design checkpoint and plan evidence.              |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/context-pack.md`             | new          | Resumable Plan-Gate handoff.                      |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/drift.md`                    | new          | Append-only amendment/session drift.              |
| `.llm/runs/beta11-cli--orchestrator/slices/g7-457-e2e/plan-eval.md`                | new          | Tier-A group `PASS`.                              |
| `packages/cli/e2e/src/domain/platform.ts`                                          | new          | Finite platform/status vocabulary.                |
| `packages/cli/e2e/src/ports/platform.ts`                                           | new          | Injected host-platform seam.                      |
| `packages/cli/e2e/src/adapters/platform/deno-platform.ts`                          | new          | Deno platform adapter.                            |
| `packages/cli/e2e/suites/deploy/desktop-native-suite.ts`                           | new          | Registered suite contract + honest preflight.     |
| `packages/cli/e2e/src/application/runner/gate-runner.ts`                           | modified     | Applicability and structured skip result.         |
| `packages/cli/e2e/src/application/runner/suite-runner.ts`                          | modified     | Platform dependency propagation.                  |
| `packages/cli/e2e/src/domain/{cli-surface,gate-definition}.ts`                     | modified     | Stable suite/gate IDs and applicability metadata. |
| `packages/cli/e2e/src/{create-default-runner,presentation/cli/suites/registry}.ts` | modified     | Default adapter wiring and suite registration.    |
| `packages/cli/e2e/mod.ts`                                                          | modified     | Programmatic platform/deploy contract exports.    |
| `packages/cli/e2e/tests/**`                                                        | modified/new | Skip non-execution and registry coverage.         |

No fixture, workflow, dependency, or lock file has been changed. Product changes are confined to S1.

## Gates

| Gate family | Current status | Evidence                                                                                                          |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Static      | PASS           | Full CLI-E2E tests 47/47; scoped check/lint/fmt 93 files with zero findings.                                      |
| Fitness     | mixed baseline | Focused doctrine FAIL=0; repo arch gate has unrelated SDK-range baseline failure; doc lint retains baseline debt. |
| Runtime     | EXPECTED_FAIL  | New suite exits 1 at the S2 fixture preflight, preventing a false green before native work exists.                |
| Consumer    | NOT_RUN        | Plan-Gate hard stop.                                                                                              |

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
