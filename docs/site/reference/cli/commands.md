---
layout: layouts/base.vto
title: "netscript command reference"
---

# `netscript` command reference

The complete verb-and-flag surface of the published `netscript` binary
(`@netscript/cli`). The [CLI reference](/cli-reference/) is the curated
tour of the everyday path; this page is the exhaustive companion — every command group,
subcommand, and flag, spelled exactly as the installed CLI prints it. For the generated
package API surface (the embeddable helpers, not the command tree) see the
[`@netscript/cli` package page](/reference/cli/).

This page documents the **public `netscript` binary** — the CLI published as
`@netscript/cli` and installed on your PATH — not any maintainer-only tree. Everything here
is verified against `netscript <group> --help`. To confirm the exact spelling in your
installed version, run `netscript --help` or `netscript <group> --help`.

The top-level groups are `agent`, `config`, `deploy`, `init`, `contract`, `db`, `generate`,
`marketplace`, `plugin`, `service`, and the `ui:*` commands — each has a section below.

## `init` — scaffold a workspace

`netscript init [name]` scaffolds a new NetScript workspace. The everyday walk-through is in
the [quickstart](/quickstart/); every flag is:

| Flag | Description |
| --- | --- |
| `--app-name <name>` | Frontend application name (kebab-case). |
| `--db <engine>` | Database engine: `postgres`, `mysql`, `mssql`, `sqlite`, or `none`. |
| `--service [enabled]` | Scaffold an example oRPC service. |
| `--service-name <name>` | Example service name. |
| `--model-name <name>` | Prisma model name for the scaffolded CRUD surface. |
| `--service-port <port>` | Example service port. |
| `--cache [enabled]` | Scaffold a shared cache resource. |
| `--cache-backend <backend>` | Shared cache backend: `redis`, `garnet`, or `deno-kv`. |
| `--editor <editor>` | Editor config: `none`, `zed`, or `vscode`. |
| `--no-aspire` | Skip the Aspire orchestration layer. |
| `--no-git` | Skip `git init` after scaffolding. |
| `--force` | Overwrite an existing target directory (default `false`). |
| `--ci` | Non-interactive mode (default `false`). |
| `-y, --yes` | Accept defaults without prompting (default `false`). |
| `--path <path>` | Target directory for scaffold output. |
| `--dry-run` | Preview the scaffold plan without writing files (default `false`). |
| `--json` | Emit a single machine-readable JSON result (default `false`). |
| `--from <preset>` | Apply a named scaffold preset. |

## `agent` — install and run agent tooling

`netscript agent` installs and runs the shared CLI × skills × MCP tooling. See
[Agent tooling](/capabilities/agent-tooling/) for the mental model and the
[`@netscript/mcp` reference](/reference/mcp/) for the server's tool surface.

| Command | Description |
| --- | --- |
| `netscript agent init` | Install NetScript MCP and skills for detected agent hosts — writes `.mcp.json` (Claude Code) and/or `.vscode/mcp.json` (VS Code), installs the `netscript` / `netscript-build` / `netscript-operate` skills, and updates the marked NetScript section in `AGENTS.md`. Flag: `--host <host>` (`claude`, `vscode`, or `all`). |
| `netscript agent mcp` | Start the NetScript MCP server over standard input/output. Flags: `--endpoint <url>` (telemetry endpoint), `--project-root <path>`, `--docs-root <path>` (public documentation root). |

## `config` — inspect and mutate configuration

`netscript config` reads and writes the resolved project configuration and manages
runtime overrides.

| Command | Description |
| --- | --- |
| `netscript config inspect` | Inspect the resolved project configuration. Flags: `--project-root <path>`, `--json` (emit the JSON-stable inspection report). |
| `netscript config get <path>` | Read a resolved configuration value. Flags: `--project-root <path>`, `--json`. |
| `netscript config set <path> <value>` | Set a generated `appsettings` configuration value. Flag: `--project-root <path>`. |
| `netscript config override <sub>` | Manage runtime overrides (see below). |
| `netscript config runtime <sub>` | Compatibility lifecycle aliases for runtime override snapshots — carries the `publish` and `rollback` subcommands only. |

### `config override` subcommands

| Command | Description |
| --- | --- |
| `netscript config override publish <topic> <file>` | Publish and atomically activate a versioned runtime topic file. Flag: `--version <version>` (defaults to the source filename). |
| `netscript config override rollback <topic> <version>` | Atomically point a runtime topic at an existing version. |
| `netscript config override list` | List active versions and payloads. |
| `netscript config override get <path>` | Read an override value at `<path>`. |
| `netscript config override set <path> [value]` | Set an override value. Flag: `--rollout <percent>`. |
| `netscript config override clear <path> [value]` | Clear an override value. Flag: `--rollout <percent>`. |
| `netscript config override enable <path> [value]` | Enable an override. Flag: `--rollout <percent>`. |
| `netscript config override disable <path> [value]` | Disable an override. Flag: `--rollout <percent>`. |

`netscript config runtime publish <topic> <file>` and
`netscript config runtime rollback <topic> <version>` are lifecycle aliases for the
matching `config override` verbs.

## `marketplace` — discover and publish plugins

| Command | Description |
| --- | --- |
| `netscript marketplace search <query>` | Search the NetScript plugin marketplace. |
| `netscript marketplace publish` | Publish a NetScript plugin to the marketplace. |

## `generate` — code generation

Beyond `generate plugins` and `generate runtime-schemas` (covered in the
[CLI reference](/cli-reference/#code-generation)), the group also regenerates the Aspire
helper layer.

| Command | Description |
| --- | --- |
| `netscript generate aspire` | Regenerate Aspire AppHost helpers from `appsettings.json`. Flag: `--project-root <path>`. |
| `netscript generate runtime-schemas` | Generate JSON Schema files for runtime config topics. |
| `netscript generate plugins` | Generate plugin registries from project source. |

## `plugin` — extended verbs

The common `plugin` verbs (`install`, `new`, `list`, `doctor`, `info`, `remove`) are in
the [CLI reference](/cli-reference/#plugins). The full group also carries:

| Command | Description |
| --- | --- |
| `netscript plugin scaffold <name>` | Scaffold a NetScript plugin package. Flags: `--target <path>`, `--project-root <path>`, `--force`. |
| `netscript plugin sync` | Synchronize plugin contributions and generated registries. Flag: `--project-root <path>`. |
| `netscript plugin update <name>` | Re-pin and regenerate an installed plugin. Flag: `--project-root <path>`. |
| `netscript plugin item-add <name> <item> [args...]` | Scaffold an item with a custom plugin. Flag: `--project-root <path>`. |
| `netscript plugin enable <pkg> [args...]` | Run a plugin's published `enable` command. Flag: `--project-root <path>`. |
| `netscript plugin disable <pkg> [args...]` | Run a plugin's published `disable` command. Flag: `--project-root <path>`. |
| `netscript plugin setup <pkg> [args...]` | Run a plugin's published `setup` command. Flag: `--project-root <path>`. |
| `netscript plugin auth <sub>` | Configure auth and manage sessions (see below). |

### `plugin auth` subcommands

| Command | Description |
| --- | --- |
| `netscript plugin auth backend set <backend>` | Select the active auth backend. |
| `netscript plugin auth backend show` | Show the currently selected auth backend. |
| `netscript plugin auth provider set` | Configure an auth provider. |
| `netscript plugin auth secret generate [kind]` | Generate auth secret material. |
| `netscript plugin auth session list` | List auth sessions. |
| `netscript plugin auth session revoke <id>` | Revoke an auth session by id. |

The backends selectable here are the same ones read at runtime by
`NETSCRIPT_AUTH_BACKEND` — see [add authentication](/how-to/add-authentication/).

## `service` — extended verbs

The common `service add`, `service list`, and `service generate` verbs are in the
[CLI reference](/cli-reference/#services--contracts). The full group also carries:

| Command | Description |
| --- | --- |
| `netscript service add` | Add a service workspace, v1 contract, and Aspire registration. Flags: `--name <name>` (kebab-case), `--port <port>`, `--refs <refs>` (comma-separated service references), `--project-root <path>`, `--force`, `--with-client` (scaffold app-workspace client and query helpers). |
| `netscript service set <name>` | Update an existing service and regenerate Aspire helpers. Flags: `--port <port>`, `--enabled <enabled>`, `--project-root <path>`. |
| `netscript service remove <name>` | Remove a service workspace and reverse its registrations. Flags: `--keep-contract` (retain paired contract files), `--project-root <path>`. |
| `netscript service add-handler <service> <procedure>` | Bind a contract procedure with a compiling service handler stub. Flags: `--version <version>` (default `v1`), `--project-root <path>`. |
| `netscript service ref add <caller> <callee>` | Add a service reference from `<caller>` to `<callee>`. Flag: `--project-root <path>`. |
| `netscript service ref remove <caller> <callee>` | Remove a service reference. |

## `contract` — extended verbs

The common `contract add` and `contract list` verbs are in the
[CLI reference](/cli-reference/#contracts). The full group also carries:

| Command | Description |
| --- | --- |
| `netscript contract add-route <contract> <procedure> --method <method> --path <route>` | Append a typed oRPC procedure to a contract. Required flags: `--method <method>`, `--path <route>`. Optional: `--input <schema>`, `--output <schema>`, `--version <version>` (default `v1`), `--project-root <path>`. |
| `netscript contract inspect <name>` | Inspect contract procedures and schema expressions. Flags: `--version <version>` (default `v1`), `--json`, `--path <path>`. |
| `netscript contract remove <name>` | Remove a contract and regenerate version aggregates. Flags: `--version <version>` (remove only the named version), `--path <path>`. |
| `netscript contract version add <name> --from <version> --to <version>` | Promote a contract into a new version directory. Required flags: `--from <version>`, `--to <version>`. Optional: `--path <path>`, `--force`. |

## `db` — extended verbs

The everyday database workflow (`init`, `generate`, `migrate`, `seed`, `status`,
`studio`, `introspect`, `reset`) is in the
[CLI reference](/cli-reference/#database) — and all `db` commands require Aspire to be
running (`cd aspire && aspire start`) unless you scaffolded a file-backed `sqlite`
engine. The full group also carries the target-management and migration-history verbs:

| Command | Description |
| --- | --- |
| `netscript db add <engine>` | Add a database workspace to an existing project. `<engine>` is `postgres`, `mysql`, `mssql`, or `sqlite`. Flags: `--name <key>` (config key), `--project-root <path>`, `--force`. |
| `netscript db list` | List registered database targets. |
| `netscript db remove <configKey>` | Deregister a database target. Flags: `--project-root <path>`, `--purge` (delete the workspace when no target still uses it). |
| `netscript db deploy` | Apply pending migrations without creating one. Flags: `--db <target>` (config key, database name, or `all`), `--project-root <path>`. |
| `netscript db validate` | Validate database schemas. Flags: `--db <target>`, `--project-root <path>`. |
| `netscript db resolve` | Resolve migration history state. Flags: `--db <target>`, `--project-root <path>`, `--applied <migration>` (mark as applied), `--rolled-back <migration>` (mark as rolled back). |

## `ui:*` — Fresh UI registry

`ui:init` and `ui:add` are in the [CLI reference](/cli-reference/#fresh-ui). The full set
also lists, updates, and removes copied registry items:

| Command | Description |
| --- | --- |
| `netscript ui:list` | List Fresh UI registry items. Flags: `--project-root <path>`, `--json`, `--collections` (include collections). |
| `netscript ui:update [name]` | Update unmodified Fresh UI registry files. Flag: `--project-root <path>`. |
| `netscript ui:remove <name>` | Remove a copied Fresh UI registry item. Flag: `--project-root <path>`. |

Because Fresh UI is copy-source, `ui:update` only touches registry files you have not
modified — your edits are never overwritten. See
[customize Fresh UI](/how-to/customize-fresh-ui/).

## `deploy` — cloud and container targets

The [CLI reference](/cli-reference/#deploy) covers the wired Deno Deploy and Windows
Service (Servy) paths. The `deploy` group also exposes a family of cloud and container
targets, plus artifact-copy and log verbs.

### Cloud and container targets

Each target below shares the same three-verb lifecycle — `plan`, `up`, `down`:

| Command group | Description |
| --- | --- |
| `netscript deploy kubernetes <verb>` | Manage the Kubernetes deployment target. |
| `netscript deploy azure-aca <verb>` | Manage the Azure Container Apps deployment target. |
| `netscript deploy azure-app-service <verb>` | Manage the Azure App Service deployment target. |
| `netscript deploy azure-aks <verb>` | Manage the Azure Kubernetes Service deployment target. |
| `netscript deploy cloud-run <verb>` | Manage the Google Cloud Run deployment target. |

The three lifecycle verbs are:

| Verb | Description |
| --- | --- |
| `plan` | Emit or preflight deployment artifacts. |
| `up` | Bring the deployment up. |
| `down` | Bring the deployment down. |

Every verb on every target shares the same flags: `--project-root <dir>`,
`--output-dir <dir>` (directory for emitted deployment artifacts),
`--environment <name>` (deployment environment passed to the target), `--clear-cache`
(clear target deployment state and do not persist new values), and `--non-interactive`.

### Artifact copy, logs, and upgrade

| Command | Description |
| --- | --- |
| `netscript deploy copy` | Copy build artifacts to the install directory (no Servy registration). Flags: `--deploy-dir <path>` (default `./.deploy/windows`), `--install-dir <path>` (default auto-resolved from the manifest), `--verbose`, `--dry-run`. |
| `netscript deploy logs <service>` | Show recent logs for a service. Flags: `--install-dir <dir>`, `--deploy-dir <dir>` (default `./.deploy/windows`), `-n, --lines <n>` (default 50), `--errors` (show the error log instead of stdout), `--list` (list available log files), `-f, --follow` (tail the log). |
| `netscript deploy upgrade` | Build, sync, reinstall, and restart services in one step. Flags: `--deploy-dir <path>` (default `./.deploy/windows`), `--install-dir <path>`, `--servy-cli <path>`, `--skip-compile`, `--skip-install`, `--skip-start`, `--verbose`, `--dry-run`. |
