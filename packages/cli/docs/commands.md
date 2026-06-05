# Command Reference

This page summarizes the public `netscript` commands. Run `netscript --help` or
`netscript <group> --help` for exact option spelling in your installed version.

When a scaffolded workspace contains a copied CLI package from a local checkout, use
`deno run -A packages/cli/bin/netscript-dev.ts ...` for local contributor workflows. The
`netscript.ts` binary mirrors the published public surface.

## Project

### `netscript init`

Creates a NetScript workspace with contracts, optional example service, optional database support,
frontend app scaffolding, and orchestration files.

Common options:

- `[name]`
- `--path <path>`
- `--db <engine>`
- `--service [enabled]`
- `--service-name <name>`
- `--no-aspire`
- `--dry-run`
- `--force`

## Contracts

### `netscript contract add`

Adds a versioned service contract to the workspace.

### `netscript contract list`

Lists available contracts.

## Databases

Local workspace invocation:

```bash
deno run -A packages/cli/bin/netscript-dev.ts db <command> [options]
```

### `netscript db add`

Adds database package configuration and generated helper files.

### `netscript db init`

Initializes database tooling for the current workspace.

### `netscript db generate`

Runs database code generation.

### `netscript db migrate`

Runs migrations.

### `netscript db seed`

Runs seed scripts.

### `netscript db status`

Shows database migration or tooling status.

### `netscript db studio`

Starts the database studio tool.

### `netscript db introspect`

Introspects the configured database.

### `netscript db reset`

Resets the configured database.

## Services

### `netscript service add`

Adds a service workspace member and its contract wiring.

### `netscript service list`

Lists configured services.

### `netscript service generate`

Regenerates Aspire helper files from service configuration.

## Plugins

### `netscript plugin add`

Adds a plugin package and updates workspace plugin registration.

### `netscript plugin list`

Lists registered plugins.

## Code Generation

### `netscript generate runtime-schemas`

Generates runtime configuration schemas from registered plugin metadata.

## Deployment

### `netscript deploy build`

Builds Windows Service deployment artifacts.

### `netscript deploy package-cli`

Compiles a deployment CLI artifact.

### `netscript deploy copy`

Copies prepared deployment output to the configured target location.

### `netscript deploy install`

Installs Windows Services from a deployment manifest.

### `netscript deploy start`

Starts installed Windows Services.

### `netscript deploy stop`

Stops installed Windows Services.

### `netscript deploy status`

Shows Windows Service status.

### `netscript deploy logs`

Prints deployment logs.

### `netscript deploy uninstall`

Uninstalls Windows Services from a deployment manifest.

### `netscript deploy upgrade`

Upgrades an installed deployment.
