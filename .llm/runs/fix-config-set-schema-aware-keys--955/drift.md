# Drift — fix-config-set-schema-aware-keys--955

| ID | Drift                                                                                                          | Severity | Source                                    |
| -- | -------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| D1 | Harness requires PLAN-EVAL and IMPL-EVAL in separate sessions; this run had one session only.                    | minor    | `workflow/run-loop.md` §4, §7             |
| D2 | The issue reports one broken spelling; two are broken.                                                           | minor    | issue #955 vs `project-config-ops.ts:41`  |
| D3 | The scaffold emits a top-level `Parameters` block that `AppSettingsSchema` does not model.                       | minor    | `generate-appsettings.ts:320`             |
| D4 | `config get` loads `netscript.config.ts` before its appsettings fallback, so it needs that file to exist at all. | minor    | `project-config-command.ts` `get` action  |

## D1 — no separate evaluator session

`run-loop.md` makes the Plan-Gate a hard stop cleared by an independent PLAN-EVAL session, and the
final IMPL-EVAL likewise. This run was dispatched as a one-shot non-interactive fix with no second
session available, so neither `plan-eval.md` nor `evaluate.md` exists. The gate set named by the
dispatching brief was run directly instead, and the PR is the verdict surface. Recorded, not
silently skipped.

## D2 — the issue understates the defect

#955 reports that `NetScript.Databases.postgres.Persistent` becomes
`NetScript.NetScript.Databases.Postgres.Persistent`. Re-derivation showed the *documented* camelCase
spelling is broken too: `appsettingsPath()` capitalizes the first letter of **every** segment, so
`databases.postgres.persistent` became `NetScript.Databases.Postgres.Persistent` — right prefix,
wrong record key, equally dead. There was no spelling of that setting that worked. The fix targets
the root cause (no schema awareness) rather than the reported prefix symptom.

## D3 — `Parameters` is off-schema

`generateAppsettings()` emits a top-level `Parameters` block (the MSSQL SA password) for
`--db mssql`. `AppSettingsZod` models only `$schema`, `Logging`, and `NetScript`, so
`parseAppSettings()` strips `Parameters` and schema-aware resolution classes it as unknown. This is
why `config set --force` exists rather than a hard refusal. Worth its own issue: either model the
section or document it as host-side (.NET-consumed) configuration outside the NetScript schema.

## D4 — `config get` requires `netscript.config.ts`

`get` calls `dependencies.loadConfig()` first and only falls back to `appsettings.json` when that
returns `undefined`. In a project without `netscript.config.ts`, `loadConfig` throws before the
fallback is reached. Pre-existing behaviour, unchanged by this run — scaffolded projects always have
the file. Noted so it is not mistaken for a regression introduced here.
