# CLI Permissions

The repository tasks run both binaries with `--allow-all` for development convenience:

- `packages/cli/bin/netscript.ts`
- `packages/cli/bin/netscript-dev.ts`

The tables below describe the effective permissions consumed by each command group.

## Public Binary

| Command                                                                         | Effective permissions         | Why                                                      |
| ------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `init`                                                                          | `read`, `write`, `run`, `env` | Creates files and may run formatting or setup commands.  |
| `contract add`                                                                  | `read`, `write`               | Updates contract files.                                  |
| `contract list`                                                                 | `read`                        | Reads contract workspace state.                          |
| `db add`                                                                        | `read`, `write`               | Writes database configuration and helper files.          |
| `db init`, `db generate`, `db migrate`, `db seed`, `db reset`                   | `read`, `write`, `run`, `env` | Reads config and invokes database tooling.               |
| `db status`, `db studio`, `db introspect`                                       | `read`, `run`, `env`          | Reads config and invokes database tooling.               |
| `plugin add`                                                                    | `read`, `write`               | Writes plugin package files and registration.            |
| `plugin list`                                                                   | `read`                        | Reads plugin registration.                               |
| `service add`                                                                   | `read`, `write`               | Writes service and contract files.                       |
| `service list`                                                                  | `read`                        | Reads service configuration.                             |
| `service generate`                                                              | `read`, `write`               | Regenerates helper files.                                |
| `generate runtime-schemas`                                                      | `read`, `write`               | Reads plugin config and writes schema files.             |
| `deploy build`, `deploy package-cli`                                            | `read`, `write`, `run`, `env` | Compiles binaries and writes deployment artifacts.       |
| `deploy copy`                                                                   | `read`, `write`               | Copies deployment output.                                |
| `deploy install`, `deploy uninstall`                                            | `read`, `write`, `run`, `env` | Reads manifests and invokes the service manager.         |
| `deploy start`, `deploy stop`, `deploy status`, `deploy logs`, `deploy upgrade` | `read`, `write`, `run`, `env` | Reads deployment state and delegates to service tooling. |

## Maintainer Binary

| Command          | Effective permissions         | Why                                            |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| `init`           | `read`, `write`, `run`, `env` | Creates workspaces from local package sources. |
| `sync packages`  | `read`, `write`               | Copies local package sources.                  |
| `sync plugin`    | `read`, `write`               | Copies official plugin source.                 |
| `sync templates` | `read`, `write`, `run`, `env` | Invokes template-generation tooling.           |
| `probe monorepo` | `read`                        | Detects repository layout.                     |
| `test scaffold`  | `read`, `write`, `run`, `env` | Runs scaffold validation fixtures.             |

## Current Non-Requirements

No current command requires `net` or `ffi`.
