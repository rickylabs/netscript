# Context Pack: G7 #457 native-first thin-client deploy E2E

## Run Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g7-457-e2e`                    |
| Branch         | `feat/desktop-frontend-457-e2e`                                 |
| Current phase  | `implement` — S2 complete locally, awaiting Tier-A slice review |
| Archetype      | `6 — CLI / Tooling`                                             |
| Scope overlays | `none`                                                          |

## Current State

Tier-A passed S1 at commit `4ccfac47`. S2 now supplies the versioned desktop entrypoint, browser
bundle, #841 update seam, #842 typed Fresh/SDK RPC bridge, exact `services__remote__http__0` lookup,
renderer acknowledgement, and #456-compatible ephemeral Ed25519 signing material. The portable S2
contract and suite gates are green; no native-window or Linux update verdict is claimed yet. The
slice is paused after commit/push/PR evidence for Tier-A review.

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
- Recorded the user-supplied Tier-A S1 `PASS` for commit `4ccfac47`.
- Implemented S2 fixture/runtime/renderer/signing contracts and a real remote HTTP → RPC → renderer
  acknowledgement test.
- Proved the browser renderer bundles without ambient bindings and that the S2 suite passes 2/2.

## In Progress

- Tier-A substantive S2 review. No implementation lane self-certification is claimed.

## Next Steps

1. Tier-A reviews the S2 diff and gate evidence.
2. On approval/instruction, begin S3 Linux native packaging, real install, remote window, apply,
   failed-launch rollback, cleanup, and blocking CI.
3. Record the actual Linux result, including a failure if that is what the real run produces.

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

S2 adds `packages/cli/e2e/fixtures/desktop-native/**`, one fixture gate/ID, its registry assertion,
and the already-resolved `@orpc/server` dependency declaration plus matching workspace lock entry.
No published package export changes.

## Gates

| Gate family | Current status | Evidence                                                                                                       |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| Static      | PASS           | Full CLI-E2E tests 47/47; fixture 4/4; scoped check/lint/fmt 100 files, zero findings.                         |
| Fitness     | mixed baseline | Quality scans pass; focused doctrine FAIL=0; `arch:check` retains unrelated SDK-range baseline failure.        |
| Runtime     | PASS S2 only   | Suite preflight + portable fixture contract pass 2/2; Linux native apply/rollback remains `NOT_RUN`.           |
| Consumer    | PASS portable  | Real remote HTTP response crossed typed RPC and was renderer-acknowledged; native-window proof remains for S3. |

## Open Questions

- None that force implementation rework. Windows/macOS execution results are explicitly safe to
  defer and remain `NOT_RUN` in this host.

## Drift and Debt

- Drift: Option A supersedes older graph/snapshot authority for this window-only beta.11 slice;
  agentic runtime did not expose the current Codex thread identity.
- Debt: no new debt planned; do not claim the existing Linux systemd debt closes without its exact
  gate.

## Commits

- Planning: `9a77ee55`; S1: `4ccfac47`; S2: recorded in the draft PR commit list and S2 comment.
