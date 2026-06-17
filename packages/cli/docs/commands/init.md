# `netscript init`

`netscript init [name]` scaffolds a NetScript workspace from typed command input and an ordered
application pipeline. The public command maps Cliffy options into `InitOptions`, validates them into
`ValidatedInitOptions`, and then executes the scaffold phases in declaration order.

## Input Shape

| Field | Source | Notes |
| --- | --- | --- |
| `name` | positional `[name]` | Project name; defaults through the command dependency when omitted. |
| `appName` | `--app-name` | Fresh application workspace name. |
| `path` | `--path` | Parent output directory. |
| `dbEngine` | `--db` | One of the registered database engine choices. |
| `includeExampleService` | `--service`, `--service-name`, `--service-port` | Enabled when any service option is present. |
| `editor` | `--editor` | `none`, `zed`, or `vscode`. |
| `noAspire` | `--no-aspire` | Skips Aspire scaffold output. |
| `legacyAspire` | `--legacy-aspire` | Emits the legacy C# AppHost shape. |
| `noGit` | `--no-git` | Skips repository initialization. |
| `force` | `--force` | Allows overwriting an existing target directory. |
| `ci` | `--ci` | Runs without interactive prompts. |
| `yes` | `--yes` | Accepts default answers. |
| `dryRun` | `--dry-run` | Plans output without writing files. |
| `json` | `--json` | Emits one structured result object on stdout. |
| `from` | `--from` | Reserved preset seam; Wave 6 ships an empty registry. |

## Pipeline Steps

1. Validate raw command input into `ValidatedInitOptions`.
2. Scaffold the project root files.
3. Scaffold copied local packages when maintainer mode requests them.
4. Scaffold Aspire orchestration unless `--no-aspire` is present.
5. Scaffold database workspace files when `--db` is not `none`.
6. Scaffold the Fresh app workspace.
7. Scaffold contracts.
8. Scaffold the optional example service.
9. Scaffold the empty plugin registry.
10. Format generated output with `deno fmt` unless this is a dry run.
11. Initialize git unless `--no-git` or `--dry-run` is present.
12. Render the human summary or the `--json` result.

## JSON Output

`--json` suppresses progress text and emits one output event whose `value` contains:

| Field | Meaning |
| --- | --- |
| `command` | Always `init`. |
| `project` | Name, app name, target path, dry-run flag, import mode, and database engine. |
| `totals` | File, directory, and duration totals. |
| `phases` | Per-phase operation counts. |
| `plugins` | Installed plugin names; empty for the initial scaffold. |
| `aspire` | Aspire enabled flag, legacy flag, and expected resource count. |
| `nextSteps` | The same post-init command sequence shown in human output. |

## Exit Codes

| Category | Error classes | Exit |
| --- | --- | --- |
| Usage/config | `UsageError`, `ConfigError`, `ScaffoldValidationError`, `ConfigInvalidError` | non-zero |
| IO/scaffold | `IoError`, `ScaffoldError`, `ScaffoldDirExistsError`, `ScaffoldTemplateError` | non-zero |
| Remote/process | `RemoteError`, `ScaffoldGitError`, compile and deploy process errors | non-zero |
| Unknown | Unclassified thrown errors | non-zero |

The binary edge owns process exit mapping. The application pipeline throws typed `CliExitError`
subclasses where possible and lets the binary render the final failure.
