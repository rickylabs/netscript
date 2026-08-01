# Research — fix-1022-plugin-doctor-truth--codex

## Re-baseline

- Carried-in source: issue #1022 and owner-locked design.
- Re-derived against `main` at `3ab64720f` on 2026-08-01.
- The stated causes held: the runtime-config check is tautological; the command only renders;
  workers/sagas declare doctor specs without extra checks; the host never executes plugin checks.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Error aggregation exists but does not affect process status. | `doctor-plugin-command.ts` action renders and returns. |
| 2 | `checkRuntimeConfig` cannot fail. | `doctor-plugin-use-case.ts` uses healthy in both branches. |
| 3 | Plugin doctor contracts are unused by the host doctor. | `adapter/contract.ts`, `adapter/commands/doctor.ts`, and host use case. |
| 4 | Workers already owns the registry path and absent-state vocabulary. | `plugins/workers/src/runtime/generated-jobs.ts`. |

## jsr-audit surface scan

- Surface scanned: `@netscript/plugin` manifest/builder contribution surface and plugin public
  manifests.
- Risk: any new exported symbol needs explicit types, JSDoc, and `@example`; prefer extending the
  existing manifest contribution type/builder instead of creating a second public doctor contract.

## Open questions

- None. The owner locked scope and accepted the contribution bridge direction.
