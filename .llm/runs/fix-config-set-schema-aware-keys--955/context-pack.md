# Context Pack: `netscript config` — schema-aware key resolution (#955)

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-config-set-schema-aware-keys--955` |
| Branch         | `fix/config-set-schema-aware-keys`      |
| Current phase  | `gate`                                  |
| Archetype      | `6 — CLI / Tooling`                     |
| Scope overlays | `none`                                  |

## Current State

`netscript config set` no longer guesses the appsettings key from the text of the path. Every path
is resolved against the JSON Schema `@netscript/aspire` generates from the same Zod definitions
`parseAppSettings()` validates with, so the CLI and the generator cannot disagree about which keys
exist. Unknown paths fail with suggestions; `--force` writes them with a warning. `config get` uses
the same resolution and `config list` prints the canonical paths.

## Completed

- Reproduced #955 end to end on `8e0bcef39` (dead key written, exit 0, original value untouched).
- Regression guard extended from one alias mapping to the semantic property that failed: after
  `set`, `parseAppSettings()` reads the value back.
- Schema-aware resolver, value validation, `set`/`get` migration, `config list`.
- Gate sweep (see Gates).

## In Progress

- Nothing; the run is at the PR hand-off.

## Next Steps

1. Open the PR with `Closes #955` and the harness phase comments.
2. File the follow-up issue for the off-schema `Parameters` block (drift D3).

## Key Decisions

| Decision                                                     | Source  | Notes                                                             |
| ------------------------------------------------------------ | ------- | ----------------------------------------------------------------- |
| Path space derived from the generator's own JSON Schema      | plan D1 | Removes the drift class the bug came from                          |
| Record keys never re-cased against the schema                | plan D2 | `postgres` is user data, not a schema field                        |
| Unknown path errors; `--force` warns and writes              | plan D3 | "never a silent success", with an escape for `Parameters.*`        |
| Section-relative shorthand only accepted when the section resolves | code | Stops `Parameters.x` being re-homed as `NetScript.Parameters.x`    |
| New modules in the feature folder, not `kernel/domain/`      | plan D7 | `kernel/domain/` sits at the 12-child R-A6-N1 cap                  |

## Files Changed

| Path                                                                          | Status  | Notes                                                     |
| ----------------------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| `packages/cli/src/public/features/config/project/read-appsettings-schema.ts`   | new     | Schema tree reader; closed-object vs record discrimination |
| `packages/cli/src/public/features/config/project/resolve-appsettings-path.ts`  | new     | Canonical path resolution + scoped value validation        |
| `packages/cli/src/public/features/config/project/list-appsettings-paths.ts`    | new     | `config list` enumeration, incl. off-schema keys           |
| `packages/cli/src/public/features/config/project/project-config-ops.ts`        | changed | `appsettingsPath()` heuristic removed; typed CLI errors    |
| `packages/cli/src/public/features/config/project/project-config-command.ts`    | changed | `--force`, canonical-path reporting, `list` command        |
| `packages/cli/src/public/features/config/config-group.ts`                      | changed | Registers `config list`                                    |
| `…/project-config-ops_test.ts`, `…/resolve-appsettings-path_test.ts`, `…/list-appsettings-paths_test.ts` | new/changed | 30 tests                              |

## Gates

| Gate family | Current status | Evidence                                                                 |
| ----------- | -------------- | ------------------------------------------------------------------------ |
| Static      | PASS           | `deno task check` / `lint` / `fmt:check` exit 0; `packages/cli` `deno task check` clean |
| Fitness     | PASS           | `deno task arch:check` exit 0, no new findings; `quality:scan` clean; LOC + cardinality under caps |
| Runtime     | N/A            | No scaffold output, template, or generated artifact changed              |
| Consumer    | N/A            | No generated-project contract change                                     |

## Open Questions

- Should `AppSettingsSchema` model the top-level `Parameters` block, or should it be documented as
  host-side .NET configuration outside the NetScript schema? (drift D3)

## Drift and Debt

- Drift: D1 single-session run (no separate evaluator sessions), D2 issue understates the defect,
  D3 off-schema `Parameters`, D4 pre-existing `config get` dependency on `netscript.config.ts`.
- Debt: none created; none closed.

## Commits

- See the PR's commit list + per-phase PR comments.
