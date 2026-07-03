# Worklog — deploy-s6-deno-deploy (Implement)

Implementer session (Opus 4.8 sub-agent, per plan D10). Separate evaluator (IMPL-EVAL) gates after.
Branch `feat/deploy-s6-deno-deploy` (PR #359, DRAFT). S0 7-op port merge (95576c44) verified present.

## S1 — Config member (`deploy.targets['deno-deploy']`)

- Files: `packages/config/src/domain/config-section-types.ts` (+`DenoDeployTarget`, `+'deno-deploy'`
  target key), `packages/config/src/domain/schemas/deploy-schema.ts` (`DenoDeployTargetSchema:
  z.ZodType<DenoDeployTarget>` spread on `deployTargetBaseShape`; `'deno-deploy'` in
  `DeployConfigSchema.targets`), `packages/config/src/public/mod.ts` (export type + schema),
  `packages/config/tests/schema/netscript_config_test.ts` (2 new tests).
- Validation: check 0 errors; `deno test` 8/8 green; wrapper lint 0 findings; wrapper fmt 0 findings;
  `deno publish --dry-run` on `@netscript/config` clean (only the pre-existing loader.ts
  unanalyzable-dynamic-import warning; no slow-type errors on the new surface).
- Commit: dc115f3a.

## S2 — Unstable-API preflight guard (pure domain)

- Files: `packages/cli/src/kernel/domain/deploy/unstable-api-guard.ts` (pure `scanUnstableApis`),
  `.../unstable-api-guard_test.ts` (6 tests).
- Design: pure — caller supplies already-read `deno.json` + source contents; FS access is deferred to
  an adapter (kept out of domain per A11/F-CLI-16). Detects declared `deno.json#unstable` features and
  direct unstable-API tokens (`Deno.openKv`→`--unstable-kv`, `Deno.cron`, `BroadcastChannel`,
  `Temporal`). Best-effort (no transitive graph walk) — bound recorded for arch-debt in S4.
- Validation: check 0 errors; `deno test` 6/6 green; direct `deno fmt --check` + `deno lint`
  conformant (packages/cli is workspace-excluded from the fmt/lint gates — see drift D-IMPL-2).
- Commit: (S2, below).

## S3 — Adapter (7-op subset) + process wrapper + registry

- Files (domain): `packages/cli/src/kernel/domain/deploy/deno-deploy-cli-port.ts` (ports:
  `DenoDeployCliPort` deploy/logs/remove/status + `DenoDeployPreflightPort.readGuardInputs`),
  `.../deno-deploy-target.ts` (`DenoDeployTarget implements DeployTargetPort`;
  key `deno-deploy`, operations `plan/up/down/status/logs`), `.../deno-deploy-target_test.ts` (9 tests).
- Files (kernel/adapters): `packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts`
  (`DenoDeployCliAdapter implements DenoDeployCliPort`, shells `deno deploy` through injected
  `ProcessPort` — F-CLI-16; exported `buildDeployArgs`/`buildLogsArgs`/`buildDeleteArgs`/`buildStatusArgs`),
  `.../deno-deploy-preflight.ts` (`DenoDeployPreflightReader`, FS read of `deno.json`+entrypoint feeding
  the pure guard), `.../deno-deploy-cli_test.ts` (5 tests, exact argv + exit-code mapping).
- Files (application): `packages/cli/src/kernel/application/registries/deploy-target-registry.ts`
  (`DENO_DEPLOY_TARGET` wired with concrete adapters at the composition layer; added to
  `DEFAULT_DEPLOY_TARGETS`). Domain target imports neither `Deno.Command` nor FS.
- Behaviour: `plan` runs the guard, never mutates; `up` runs the guard then `deno deploy [--prod]` —
  **refuses** production pushes with unstable-API violations (throw), warns-but-proceeds on preview;
  `down`/`status`/`logs` delegate to the CLI port; non-zero exit → throw with stderr. rollback/secrets
  omitted (D-IMPL-1).
- Validation: scoped `run-deno-check` 0 errors across domain/deploy + adapters/deno-deploy +
  application/registries (22 files); `deno test` 14/14 green; direct `deno fmt --check` + `deno lint`
  conformant (packages/cli workspace-excluded from the fmt/lint gates — drift D-IMPL-2).
- Commit: 06f595ff; pushed 34013a72..06f595ff.

## S4 — Config resolver + thin CLI router reach + README/debt

- Files (domain): `packages/cli/src/kernel/domain/resolved-config.ts` (+`ResolvedDenoDeployConfig`).
- Files (kernel/adapters): `.../adapters/config/deploy-config-resolvers.ts` (+`resolveDenoDeployTarget`:
  merge `deploy.targets['deno-deploy']` config with CLI flag overrides, flags win, `prod` default
  false), `.../adapters/config/deploy-config-resolvers.test.ts` (4 tests),
  `.../adapters/deno-deploy/create-deno-deploy-target.ts` (single composition factory wiring CLI
  adapter + preflight reader; registry refactored to use it).
- Files (surface): `.../public/features/deploy/deno-deploy/deno-deploy-command.ts`
  (`createDenoDeployCommand` — thin `deno-deploy plan|up|down|status|logs` group mapping
  `--org/--app/--prod/--entrypoint/--env-file/--dry-run` onto the resolved config; `up --dry-run`
  diverts to `plan`; no target logic in the surface, no `Deno.Command`), wired into
  `deploy-group.ts`.
- Docs/debt: `packages/cli/README.md` (Deno Deploy target section + permissions table
  `--allow-run/read/net/env` + unstable-API/auth caveats), `.llm/harness/debt/arch-debt.md`
  (`cli-deploy-artifacts-missing` advanced, not closed).
- Validation: scoped `run-deno-check` 0 errors across 72 files (adapters/deno-deploy + adapters/config
  + domain + public/features/deploy + application/registries); `deno test` 18/18 green (4 resolver +
  5 adapter + 9 target); direct `deno fmt --check` conformant on all 7 S4 TS files.
- Note (lint): the surface's cliffy `Command<any, …>` generics are the repo-standard, explicitly
  accepted "top-level router any" (packages/cli is excluded from the lint gate); `deno lint
  --no-config` flags them, but they match the established pattern in every `features/**` command and
  are not new type-soundness debt. No `any` in business logic (flag marshalling uses `unknown` +
  narrow casts).
- Commit: 2c93ce8d.

## Blocker / NEEDS-USER (see drift.md)

- D-IMPL-1: no core `secrets`/`rollback` convention seam on branch → adapter declares the
  `plan/up/down/status/logs` subset and omits rollback/secrets (per port docstring + S0 precedent);
  do not fork. Surfaced, not worked around.
- D5 (CLI-push default) and non-interactive CI auth for `deno deploy` remain NEEDS-USER; proceeding on
  the plan's locked CLI-push default; a real push is manual/deferred.
