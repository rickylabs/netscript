# Research — fix-config-set-schema-aware-keys--955

## Re-baseline

- Carried-in source: GitHub issue #955 (symptom report from a GPT-5.6 Sol application build).
- Re-derived against `main` @ `8e0bcef39`, 2026-07-31.
- What changed vs the carried-in version:
  - The issue reports one broken spelling (`NetScript.Databases.postgres.Persistent` → doubled
    prefix). Re-derivation shows the defect is **wider**: the *documented* camelCase spelling
    (`databases.postgres.persistent`) is broken too, because the mapper uppercases record **keys**
    as well as schema fields. Recorded as finding 2.
  - The issue asks for `config list`. No `config list` subcommand exists today — the config group
    has `inspect`, `get`, `set`, `override`, `runtime`. Recorded as finding 6.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                        | How to verify                                                                                                                       |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | `appsettingsPath()` is a blind textual heuristic: one hardcoded alias, then unconditional `NetScript` prefix + capitalize-first-letter on **every** segment. It never consults a schema.                                                                                                        | `packages/cli/src/public/features/config/project/project-config-ops.ts:41-45`                                                        |
| 2  | Because the mapper capitalizes every segment, it corrupts **record keys**, not just field names. `databases.postgres.persistent` → `NetScript.Databases.Postgres.Persistent`. `Databases` is `z.record(string, DatabaseEntry)`; `postgres` is a user-chosen key that must stay verbatim.        | `packages/aspire/config.ts:535` (`Databases: z.record(...)`); repro below                                                            |
| 3  | Passing the real appsettings path produces the doubled prefix reported in the issue.                                                                                                                                                                                                            | repro: `appsettingsPath('NetScript.Databases.postgres.Persistent')` → `NetScript.NetScript.Databases.Postgres.Persistent`             |
| 4  | `setProjectConfigValue()` **creates** every missing intermediate object (`current[part] = {}`), so a wrong path always succeeds structurally. Nothing reads the result back and nothing validates it. Hence exit 0 + "Set …".                                                                    | `project-config-ops.ts:28-37`; `project-config-command.ts:47-49`                                                                     |
| 5  | The generator's schema authority already exists and is machine-readable: `@netscript/aspire/config` defines the Zod `AppSettingsSchema` that `parseAppSettings()` validates with, and `@netscript/aspire/schema` exposes `generateAppSettingsJsonSchema()` — draft-7 JSON Schema from that Zod. | `packages/aspire/config.ts:555-565`, `packages/aspire/schema.ts:35-52`                                                               |
| 6  | JSON Schema shape distinguishes the two node kinds we need: closed objects emit `properties` + `additionalProperties: false`; records emit `additionalProperties: <schema>` + `propertyNames`.                                                                                                 | probe: `NetScript.additionalProperties === false`; `NetScript.properties.Databases.additionalProperties` is a `DatabaseEntry` object |
| 7  | `netscript config list` does not exist. The config group is `inspect`/`get`/`set`/`override`/`runtime`.                                                                                                                                                                                         | `packages/cli/src/public/features/config/config-group.ts:17-28`                                                                      |
| 8  | `config get`'s appsettings fallback uses the same broken `appsettingsPath()`, so the read path is wrong in the same way (it fails loudly rather than silently, but it fails on correct input).                                                                                                  | `project-config-command.ts:64-69`                                                                                                    |
| 9  | The AppHost reads `../appsettings.json` relative to the AppHost dir, i.e. the same project-root file `config set` writes. The file target is correct; only the key path is wrong.                                                                                                               | `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts:244`                                                              |
| 10 | The existing regression guard tests **only** the one hardcoded alias (`telemetry.otlpEndpoint`) and never a nested or record path — which is exactly why the defect shipped.                                                                                                                    | `project-config-ops_test.ts:14-26`                                                                                                   |
| 11 | The scaffold emits a top-level `Parameters` block (MSSQL SA password) that `AppSettingsSchema` does **not** model, so a strict schema check would call a legitimate host-side key "unknown".                                                                                                    | `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:320-325`                                                           |

### Reproduction (pre-fix, on `8e0bcef39`)

```text
"NetScript.Databases.postgres.Persistent" -> NetScript.NetScript.Databases.Postgres.Persistent
"databases.postgres.persistent"           -> NetScript.Databases.Postgres.Persistent
"telemetry.otlpEndpoint"                  -> NetScript.Otel.HttpEndpoint
"name"                                    -> NetScript.Name
```

Only rows 3 and 4 land on a key the generator reads. Rows 1 and 2 both write dead keys and both
exit 0.

## jsr-audit surface scan

- Surface scanned: `packages/cli` public feature surface (`config` group). The change adds no new
  entry to `packages/cli/mod.ts` and no new package export; it adds one command to an existing
  Cliffy group plus one internal module inside the existing feature folder.
- Slow-type / surface risks: none. All new exported functions have explicit return types and named
  interfaces; no inferred structural returns cross a package boundary.
- `@netscript/aspire` gains no new export — `./schema` and `./config` already exist.

## Open questions

1. **Unknown key → warning or error?** Issue says "a warning or an error, never a silent success".
   Resolved in plan (D3): error by default, `--force` to write anyway with a warning, because
   finding 11 shows a legitimate off-schema key exists.
2. **Where does the canonical path table come from?** Resolved (D1): derived at runtime from
   `generateAppSettingsJsonSchema()`, never hand-maintained, so it cannot drift from the parser.
3. **`config list` — new command or fold into `inspect`?** Resolved (D4): new `config list`, as the
   issue names it; `inspect` keeps its existing resolved-config summary contract.
