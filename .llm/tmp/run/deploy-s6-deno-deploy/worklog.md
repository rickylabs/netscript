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

## Blocker / NEEDS-USER (see drift.md)

- D-IMPL-1: no core `secrets`/`rollback` convention seam on branch → adapter declares the
  `plan/up/down/status/logs` subset and omits rollback/secrets (per port docstring + S0 precedent);
  do not fork. Surfaced, not worked around.
- D5 (CLI-push default) and non-interactive CI auth for `deno deploy` remain NEEDS-USER; proceeding on
  the plan's locked CLI-push default; a real push is manual/deferred.
