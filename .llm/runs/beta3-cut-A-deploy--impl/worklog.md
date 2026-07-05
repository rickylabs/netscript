# Worklog: beta.3 deploy slices

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-A-deploy--impl` |
| Branch | `fix/deploy-compose-target-393` |
| Archetype | `7 - Deployment Target Adapter` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript deploy docker <verb>` — existing CLI command routed through `createTargetDeployCommand`.
- `netscript deploy compose <verb>` — existing CLI command routed through `createTargetDeployCommand`.
- `DEFAULT_DEPLOY_TARGETS` — internal first-party target registry seed.

### Domain Vocabulary

- `DeployTargetPort` — adapter contract for deploy target operations.
- `DeployTargetRegistry` — closed-on-key registry for the deploy target extension axis.
- `KnownDeployTargetKey` — first-party reserved target key union.
- `AspireComposeDeployTarget` — Aspire-backed adapter registered under `compose` and `docker`.

### Ports

- `ProcessPort` — consumed by `AspireComposeDeployTarget` through `DenoProcess`; no new port is introduced.

### Constants

- First-party deploy target keys: `windows-service`, `linux-service`, `deno-deploy`, `compose`, `docker`.
- Routed deploy operations: `plan`, `up`, `down`, `status`, `logs`, `rollback`, `secrets`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Register Docker/Compose in the default target registry and add resolution smoke coverage. | Scoped check/lint/fmt + targeted deploy target tests. | `deploy-target-registry.ts`, `deploy-target-registry-port.ts`, `public-command-dependencies.ts`, deploy target tests, run artifacts |

### Deferred Scope

- #394 deploy e2e suite — starts only after the #393 PR is opened and commented.
- Full scaffold runtime smoke — supervisor merge-readiness gate.
- Deploy core extraction — future deployment epic work, not needed for #393.

### Contributor Path

To add a first-party deploy target, implement `DeployTargetPort`, register it in `DEFAULT_DEPLOY_TARGETS`, add its key to `KnownDeployTargetKey`, and rely on the default registry tests to prove resolution plus operation-handler consistency.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-05 | #393 | research | Read harness, doctrine, CLI, tools, PR, Deno toolchain, rtk skills; read Arch 7/6/2 and deployment design context. |
| 2026-07-05 | #393 | baseline | Verified `DEFAULT_DEPLOY_TARGETS` omits `compose`/`docker` while public dependencies append them manually. |
| 2026-07-05 | #393 | implementation | Added `compose` and `docker` Aspire targets to `DEFAULT_DEPLOY_TARGETS`, removed duplicate public dependency registration, and expanded target resolution tests. |
| 2026-07-05 | #393 | reconcile | #393/#394 are both open on GitHub milestone `0.0.1-beta.3`; #327 remains an open epic and is referenced only. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Register `compose` and `docker` in defaults. | The registry is the target extension axis and must be the recurrence guard. | #393, Arch 7 |
| Remove public-dependency duplicate target entries. | Keeps default registry authoritative. | Code baseline |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Implementation lane proceeded from user launch without a local separate PLAN-EVAL pass. | significant | yes |
| Root Deno lint/fmt config excludes `packages/cli/`, causing scoped lint/fmt wrappers to exit 1 with zero findings for this requested root. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 589 files selected; 5 batches; 0 failed; 0 diagnostics. |
| lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | FAIL | Wrapper selected 589 files but Deno exited 1 with 0 findings because root `deno.json` excludes `packages/cli/`; recorded as drift. |
| lint changed files | `deno lint --no-config <6 changed ts files>` | PASS | `Checked 6 files`. |
| fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | FAIL | Wrapper selected 589 files but Deno exited 1 with 0 findings because root `deno.json` excludes `packages/cli/`; recorded as drift. |
| fmt changed files | `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote <6 changed ts files>` | PASS | `Checked 6 files`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-DEPLOY-1 | PASS | `deploy-target-port_test.ts` asserts every default target resolves and every advertised op has a handler. | Includes `compose` and `docker`. |
| F-DEPLOY-2 | PASS | `target-deploy-command_test.ts` asserts `deploy docker/compose` routers expose verbs from default registry targets. | Router remains target-agnostic. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| targeted deploy tests | PASS | `deno test --unstable-kv packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts packages/cli/src/kernel/domain/deploy/deno-deploy-target_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts` — 23 passed, 0 failed. | No external Aspire/Docker shelling. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| public deploy command router | PASS | `deploy docker/compose routers resolve their default registry targets` test. | Proves regression target. |

## Handoff Notes

- Inspect the registry diff first; it should be a narrow source-of-truth move.
- Confirm no full scaffold runtime e2e was run for #393 by design.
