# Plan: beta.3 deploy slices

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-A-deploy--impl` |
| Branch | `fix/deploy-compose-target-393` |
| Phase | `implement` |
| Target | `packages/cli` deploy target registry |
| Archetype | `7 - Deployment Target Adapter` composite over `6 - CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 7 applies because the deploy feature routes multiple deploy targets through a registry-backed adapter seam and a thin `netscript deploy <target> <verb>` CLI router. The implementation lives in `packages/cli`, whose current package archetype is Archetype 6, so the slice must preserve the CLI thin-router rules while fixing the deployment target adapter registry.

## Current Doctrine Verdict

`@netscript/cli` is `Restructure` in doctrine file 10, with existing debt around the broader CLI shape. This slice is a narrow registry/test fix and does not deepen the structural debt.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A7 | Docker/Compose deployment delegates to Aspire and Docker commands through the existing adapter; this slice must not author compose YAML. |
| A11 | Deploy target is the named extension axis; first-party target keys belong in the deploy target registry. |
| A14 | A regression smoke must prove default target resolution so missing future registrations fail in tests. |

## Goal

Fix #393 by registering the Aspire Docker/Compose deploy target in `DEFAULT_DEPLOY_TARGETS` and proving `deploy docker/compose <verb>` target resolution in focused tests.

## Scope

- Add `compose` and `docker` default deploy targets.
- Keep `deploy-group.ts` as a thin router.
- Remove duplicate public dependency graph target appends.
- Expand tests so every default target resolves and every advertised operation has a handler.

## Non-Scope

- No full `scaffold.runtime` e2e run; the supervisor owns that merge-readiness gate.
- No #394 e2e framework work until PR #393 is opened and commented.
- No deploy verb vocabulary redesign.

## Hidden Scope

- `KnownDeployTargetKey` must include all first-party reserved keys to avoid runtime/type drift.
- The public command dependency graph must not re-register targets already present in defaults.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-393-1 | `DEFAULT_DEPLOY_TARGETS` is the single first-party deploy target source. | Prevents the exact recurrence where command wiring and registry defaults diverge. |
| LD-393-2 | The Aspire adapter is registered twice, once under `compose` and once under `docker`. | The adapter's own key-specific behavior already owns the target distinction and keeps the router thin. |
| LD-393-3 | Tests assert all default targets resolve and every advertised op has a callable handler. | This catches missing registrations and partial adapter descriptors. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Whether #394 uses Deno Deploy or bare-metal as the e2e production path | safe to defer | #393 does not choose the e2e target; #394 owns that decision. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Default registry instantiates process-backed adapters at module load. | Existing Deno Deploy default uses the same lazy-process pattern; `DenoProcess` only shells when an operation runs. |
| Public command dependencies might duplicate target keys. | Remove manual `compose`/`docker` appends and rely on `new DeployTargetRegistry()`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-24 | risk | Use the existing `DeployTargetRegistry`, not a switch in the deploy command surface. |
| Thin-router violation | risk | Leave `deploy-group.ts` routing unchanged; target behavior stays in the adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-DEPLOY-1 | yes | Manual/test evidence that registered targets advertise implemented operation subsets. |
| F-DEPLOY-2 | yes | Manual/test evidence that router verbs are derived from registry targets. |
| F-19 | yes | Scoped wrapper evidence for check/lint/fmt. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `packages/cli` restructure verdict | none | Narrow fix does not deepen existing CLI restructuring debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS |
| 2 | lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | PASS |
| 3 | fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS |
| 4 | targeted tests | `deno test --unstable-kv packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts packages/cli/src/kernel/domain/deploy/deno-deploy-target_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts` | PASS |

## Dependencies

- Existing `AspireComposeDeployTarget`.
- Existing `DenoProcess` process adapter.

## Drift Watch

- If adding targets to `DEFAULT_DEPLOY_TARGETS` causes process or lock churn, record in `drift.md`.
- If validation requires broad e2e or scaffold runtime, stop #393 and record rescope.
