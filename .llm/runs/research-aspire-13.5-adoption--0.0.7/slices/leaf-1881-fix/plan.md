# Plan: readme.quickstart install-root isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix` |
| Branch | `fix/aspire-1881-readme-install-isolation` |
| Phase | `plan` |
| Target | `packages/cli/e2e` gate code |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype and Doctrine

The nested `packages/cli/e2e` workspace is the test harness owned by the Archetype 6 CLI package.
This slice changes only its command-edge gate code and tests. A7/A14 apply: use the platform command
environment directly and preserve the executable gate contract with semantic tests. The current
CLI doctrine verdict remains a migration concern outside this leaf; this slice neither deepens nor
attempts to resolve product-source debt.

## Goal

Make every verbatim root README Quickstart command execute with a run-owned `DENO_INSTALL_ROOT` and
PATH prefix, so command 1 installs an isolated `netscript` and later commands resolve that exact
binary, while preserving argv byte-for-byte except the existing placeholder substitutions.

## Scope

- Add the smallest injectable README spawn seam and a focused failing test.
- Persist `.deno-install` under `runRoot` in `ReadmeWalkState` from index 0.
- Pass the same environment to every spawned README command.
- Grant the walker only `--allow-env=PATH`, matching its ambient PATH read.
- Remove and recreate the run-owned install root at index 0 so reruns cannot reuse a stale binary.
- Extend `runAspireCommand` with an optional inherited-environment overlay.
- Add receipt environment evidence.

## Non-Scope

- No README, workflow, product behavior, cleanup, plugin, lockfile, Aspire runtime, Docker, retry,
  fallback, force flag, or ambient-install mutation.
- No `packages/*/src` outside `packages/cli/e2e`.
- Do not run `readme.quickstart`, `quickstart.walk`, `scaffold.runtime`, Aspire, or Docker.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Install root is `resolve(runRoot, '.deno-install')`. | Run-owned and deterministic. |
| D2 | Environment is `DENO_INSTALL_ROOT=<root>` and `PATH=<root>/bin<delimiter><ambient PATH>`. | Isolates install while retaining `deno`, `aspire`, and `curl`. |
| D3 | Every spawned README command receives the same environment. | Later `netscript` calls must resolve the installed binary. |
| D4 | Extend `runAspireCommand(..., env?)`; do not pass env from `quickstart.walk`. | Preserves existing walk behavior. |
| D5 | Receipt records `{ denoInstallRoot, pathPrepend }`; argv remains verbatim. | Hosted evidence proves isolation without changing the public command. |
| D6 | Index 0 removes the owned install root, tolerating only `NotFound`, then recreates it. | A same-runner rerun must not reproduce the existing-install collision. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Path delimiter | resolved now | Use `DELIMITER` from `@std/path`. |
| Missing ambient PATH | resolved now | Preserve the explicit prepend; append the ambient value when present. |
| Spawn seam shape | resolved now | Optional function parameter defaulting to `runAspireCommand`; no test branch. |
| PATH read permission | resolved now | Add only `--allow-env=PATH` to the README walker launcher. |

## Commit Slices

| # | Slice | Proving gate | Files |
| - | --- | --- | --- |
| 1 | RED: recording spawn seam and install-root propagation expectations | focused test must fail on missing environment | focused test, minimal seam, run artifacts |
| 2 | GREEN: persisted install root, env overlay, and receipt evidence | focused test and existing CLI E2E tests pass | `readme-command.ts`, `aspire-walk.ts`, run artifacts |
| 3 | Final gate evidence and evaluator artifact | all owner-scoped wrappers/listing plus separate IMPL-EVAL | run artifacts only |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| PATH replacement hides ambient tools. | Prefix the isolated bin and retain ambient PATH as the tail. |
| Only index 0 is isolated. | Test index 0 and index 1 through the same recorded spawn. |
| State from an earlier schema is accepted without isolation. | Validate `denoInstallRoot` when reading state. |
| Quickstart walk behavior changes. | Optional env defaults to undefined; existing caller passes no env. |
| Test accidentally executes a real command. | Inject a recording fake returning success. |

## Gates

The owner-scoped check, full nested test set, format, changed-file lint, and gate listing are the
authoritative evidence. Runtime gates are intentionally forbidden. `quality:gate`/full archetype
publish gates are not selected because this leaf changes only nested E2E gate code, not framework
product source or public package surface.

## Debt and Deferred Scope

- New/deepened architecture debt: none expected.
- Hosted Canary 9 rerun and issue closure are deferred to the release owner; #1881 closes only on a
  green hosted transcript.
