# Worklog: `netscript config` — schema-aware key resolution (#955)

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-config-set-schema-aware-keys--955` |
| Branch         | `fix/config-set-schema-aware-keys`      |
| Archetype      | `6 — CLI / Tooling`                     |
| Scope overlays | `none`                                  |

## Design

### Public Surface

CLI commands (the only user-facing surface; no new package export):

- `netscript config set <path> <value> [--force]` — writes the canonical key, reports it, errors on
  an unknown path.
- `netscript config get <path>` — reads through the same resolution.
- `netscript config list [prefix] [--json]` — **new**; prints canonical case-sensitive paths.

Module exports (internal to `public/features/config/project/`):

- `resolveAppsettingsPath(input, document?): ResolvedAppsettingsPath`
- `collectSchemaIssues(document, segments): readonly string[]`
- `appsettingsSchemaRoot(): SchemaNode` / `schemaChildren(node): SchemaChildren` (shared walker
  primitives, consumed by the listing module)
- `listAppsettingsPaths(document?, prefix?): readonly AppsettingsPathEntry[]`
- `setProjectConfigValue(fs, root, path, value, options?): Promise<SetProjectConfigResult>`
- `readAppsettingsValue(fs, root, path): Promise<unknown>`

### Domain Vocabulary

- `ResolvedAppsettingsPath` — `{ input, segments, canonical, status, reason?, suggestions }`. The
  single answer to "what key does the generator actually read for what the user typed".
- `AppsettingsPathStatus` — `'known' | 'unknown'`. `'unknown'` means the generator's own parser does
  not model this path.
- `SchemaChildren` — `{ fields: Record<string, SchemaNode>; record?: SchemaNode }`. The two node
  kinds the JSON Schema distinguishes: a closed field set vs an open record.
- `AppsettingsPathEntry` — `{ path, status, value? }` for `config list`.
- `SetProjectConfigResult` — `{ requestedPath, canonicalPath, forced }` so the command can report
  the canonical key it wrote without re-deriving it.

### Ports

No new port. Filesystem access stays on the existing `FileSystemPort`; the resolver is pure.

### Constants

- `APPSETTINGS_PATH_ALIASES` — `{ 'telemetry.otlpEndpoint': ['NetScript','Otel','HttpEndpoint'] }`.
  The one documented shorthand, held as an explicit table instead of a string heuristic (D5).
- `ROOT_SECTION` — `'NetScript'`. The section a bare, section-relative path is resolved under.
- `RECORD_KEY_PLACEHOLDER` — `'<key>'`. Rendered by `config list` where a record has no entries yet.
- `MAX_SUGGESTIONS` — `8`.

### Commit Slices

| # | Slice                                                                                                                        | Gate                                                            | Files                                                                                                                    |
| - | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1 | Failing regression guard: the reported path, the camelCase path, and a record-key path must land where the generator reads. | `deno test packages/cli/src/public/features/config` → FAIL       | `project-config-ops_test.ts`                                                                                             |
| 2 | Schema-aware resolver + value validation, derived from `generateAppSettingsJsonSchema()`.                                    | slice-1 tests → PASS                                             | `resolve-appsettings-path.ts`, `resolve-appsettings-path_test.ts`                                                        |
| 3 | Move `set`/`get` onto the resolver; unknown path errors; `--force` warns and writes.                                          | `deno test …/config` → PASS                                      | `project-config-ops.ts`, `project-config-command.ts`                                                                     |
| 4 | `netscript config list` with canonical case-sensitive paths.                                                                  | `deno test …/config` → PASS                                      | `list-appsettings-paths.ts`, `list-appsettings-paths_test.ts`, `project-config-command.ts`, `config-group.ts`            |
| 5 | Gates + run artifacts.                                                                                                        | `check`, `lint`, `fmt:check`, `test`, `arch:check`               | run dir                                                                                                                  |

### Deferred Scope

- Modelling the scaffold's top-level `Parameters` block in `AppSettingsSchema` — cross-package
  schema change; `--force` covers it today (research finding 11).
- `config override` / `config runtime` key spaces — different store, different key vocabulary.
- Interactive tab-completion of config paths — `config list` gives the same information without a
  shell-integration surface.

### Contributor Path

Adding a settable key requires **no CLI change**: add the field to the Zod schema in
`packages/aspire/config.ts`, and `config set` / `get` / `list` pick it up on the next run because
every key name is read from `generateAppSettingsJsonSchema()` at call time. To change how a path is
*spelled* by users (a new alias), add one entry to `APPSETTINGS_PATH_ALIASES` in
`resolve-appsettings-path.ts` — the same file, the same table, one line.

## Progress Log

| Time  | Slice | Step                                                          | Notes                                                                             |
| ----- | ----- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| T0    | —     | Reproduced #955 against `8e0bcef39`                            | Doubled prefix confirmed; camelCase spelling found broken too (research finding 2) |
| T1    | 1     | Regression guard extended to nested + record paths             | Fails on baseline                                                                  |
| T2    | 2     | Resolver landed                                                | Path space derived from the generator's own JSON Schema                            |
| T3    | 3     | `set`/`get` moved onto the resolver; unknown path now errors   | `--force` retained for off-schema host keys                                        |
| T4    | 4     | `config list` added                                            | Canonical case-sensitive paths, `--json`, optional prefix filter                   |
| T5    | 5     | Gate sweep                                                     | See Gate Results                                                                   |

## Decisions

| Decision                                                 | Reason                                                                  | Source        |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | ------------- |
| Derive the path space from the generator's JSON Schema   | Makes "the generator knows this key" true by construction, not by table | plan D1       |
| Records keep verbatim keys; only closed fields canonicalize | Record keys are user data — capitalizing them was half the bug          | plan D2, code |
| Unknown path errors; `--force` warns                     | "never a silent success", with an escape for `Parameters.*`             | plan D3       |
| New module in the feature folder, not `kernel/domain/`   | `kernel/domain/` sits at the 12-child R-A6-N1 cap                       | plan D7       |

## Drift

| Drift                                                                        | Severity | Logged in drift.md |
| ---------------------------------------------------------------------------- | -------- | ------------------ |
| PLAN-EVAL / IMPL-EVAL not run as separate sessions                            | minor    | yes (D1)           |
| Issue understates the defect (camelCase spelling broken too)                  | minor    | yes (D2)           |
| Scaffold emits a top-level `Parameters` block absent from `AppSettingsSchema` | minor    | yes (D3)           |

## Gate Results

### Static Gates

| Gate      | Command or check       | Result | Notes                        |
| --------- | ---------------------- | ------ | ---------------------------- |
| check     | `deno task check`      | PASS   | see PR body for raw evidence |
| lint      | `deno task lint`       | PASS   |                              |
| fmt:check | `deno task fmt:check`  | PASS   |                              |
| test      | `deno task test`       | PASS   |                              |

### Fitness Gates

| Gate               | Result         | Evidence               | Notes                                                     |
| ------------------ | -------------- | ---------------------- | --------------------------------------------------------- |
| F-3 layering       | PASS           | `deno task arch:check` | no new findings vs baseline                               |
| F-CLI-1 / F-CLI-2  | PASS           | LOC scan               | all new/changed files under the per-layer caps            |
| F-CLI-25           | PASS           | folder scan            | `config/project/` at 7 children                           |
| F-CLI-26           | PASS           | grep                   | no `console.*` added                                      |
| F-CLI-16           | PASS           | grep                   | no `Deno.*` in the new modules (test files excepted)      |
| F-CLI-* (rest)     | PENDING_SCRIPT | `arch:check`           | no dedicated script per the archetype profile             |

### Runtime Gates

| Gate                        | Result | Evidence | Notes                                                                  |
| --------------------------- | ------ | -------- | ---------------------------------------------------------------------- |
| `e2e:cli scaffold.runtime`  | N/A    | —        | Run changes no scaffold output, template, or generated file.           |

### Consumer Gates

| Consumer          | Result | Evidence | Notes                                                       |
| ----------------- | ------ | -------- | ----------------------------------------------------------- |
| generated project | N/A    | —        | No generated artifact changes; only CLI-side key resolution. |

## Handoff Notes

- Follow-up: the scaffold writes a top-level `Parameters` block (MSSQL SA password) that
  `AppSettingsSchema` does not model, so `parseAppSettings()` strips it and `config set` treats it as
  off-schema. Worth its own issue.
