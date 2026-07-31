# fix-scaffold-hygiene — context pack

Grouped beta.12 fix covering 4 issues, all in `netscript init` / CLI scaffold output.

| Issue | Title |
|---|---|
| #966 | generated `.gitignore` excludes `appsettings.json`, which a clean clone needs |
| #975 | scaffold writes a top-level `Parameters` block the appsettings schema drops |
| #967 | `init` nests a project directory when the cwd is already the target |
| #968 | non-interactive invocations still hit selection prompts |

## Shared-cause hypothesis

All four are defects in what the scaffold emits and how `init` is driven, over the same set of
generated files (`.gitignore`, `appsettings.json`, project layout). They share one fresh-clone
verification: scaffold a project non-interactively, clone it clean, and start it.

- #966 and #975 are both "the generator writes a file the rest of the toolchain then disagrees
  with" — ignore rules vs. build inputs, and emitted keys vs. `AppSettingsSchema`.
- #967 and #968 are both "`init` assumes an interactive human in a fresh empty parent" — cwd
  handling and prompt handling.

Whether that is one root cause or two is for the implementation to determine and state in the PR.

## Assessment

MECHANICAL. No plan document; straight to implementation.

Milestone: 0.0.1-beta.12
