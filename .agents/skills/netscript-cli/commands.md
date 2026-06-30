# Command Reference

This page summarizes the public `netscript` commands. Run `netscript --help` or
`netscript <group> --help` for exact option spelling in your installed version.

When a scaffolded workspace contains copied packages from a local checkout, use
`deno run -A packages/cli/bin/netscript-dev.ts ...` for maintainer/local-source workflows only.
End users ultimately run public `netscript ...` commands backed by published JSR packages; release
CI must validate that public path once all packages are published.

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
- `--service-port <port>`
- `--editor <none|zed|vscode>`
- `--no-aspire`
- `--legacy-aspire`
- `--ci`
- `--yes`
- `--no-git`
- `--dry-run`
- `--force`

## Contracts

### `netscript contract add`

Adds a versioned service contract to the workspace.

### `netscript contract list`

Lists available contracts.

## Databases

Maintainer/local-source invocation:

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

### `netscript plugin install`

Adds a plugin package and updates workspace plugin registration.

Supported local contributor kinds are:

- `worker` -> conventional installed name `workers`
- `saga` -> conventional installed name `sagas`
- `trigger` -> conventional installed name `triggers`
- `stream` -> conventional installed name `streams`

Common options:

- `--name <name>`
- `--port <port>`
- `--service-refs <refs>`
- `--plugin-refs <refs>`
- `--db <engine-or-key>`
- `--no-db`
- `--samples` / `--no-samples`
- `--project-root <path>`
- `--force`

### `netscript plugin list`

Lists registered plugins.

### `netscript plugin info`

Runs a plugin info command through the plugin's published CLI.

### `netscript plugin update`

Runs a plugin update command through the plugin's published CLI.

### `netscript plugin remove`

Removes a configured plugin.

### `netscript plugin doctor`

Checks installed NetScript plugin health.

## Code Generation

### `netscript generate runtime-schemas`

Generates runtime configuration schemas from registered plugin metadata.

### `netscript generate plugins`

Generates plugin registries from project source.

## Local Maintainer Scaffolding

When testing scaffold output from this monorepo, use the maintainer binary rather than the public
JSR-backed binary shape:

```bash
deno run -A packages/cli/bin/netscript-dev.ts init full-test \
  --path scaffold \
  --db postgres \
  --service --service-name users --service-port 3001 \
  --editor zed \
  --ci --yes --no-git --force
```

Then add the first-party plugins with the same cwd-sensitive shape as the E2E runtime suite:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --project-root scaffold/full-test --samples --force

Push-Location scaffold/full-test
deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --project-root . --samples --force
deno run -A ..\..\packages\cli\bin\netscript-dev.ts plugin install trigger --name triggers --project-root . --samples --force
Pop-Location

deno run -A packages/cli/bin/netscript-dev.ts plugin install stream --name streams --project-root scaffold/full-test --samples --force

deno run -A packages/cli/bin/netscript-dev.ts plugin list --project-root scaffold/full-test
```

Run the DB, generated registry, generated check, plugin doctor, and Aspire restore steps:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts db init --project-root scaffold/full-test --db postgres --name init
deno run -A packages/cli/bin/netscript-dev.ts db generate --project-root scaffold/full-test --db postgres
deno run -A packages/cli/bin/netscript-dev.ts db seed --project-root scaffold/full-test --db postgres

deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root scaffold/full-test

Push-Location scaffold/full-test
deno check --unstable-kv ./packages ./plugins ./workers ./sagas ./triggers ./services ./database
Pop-Location

deno run -A packages/cli/bin/netscript-dev.ts plugin doctor --project-root scaffold/full-test

Push-Location scaffold/full-test/aspire
aspire restore
Pop-Location
```

The full one-pass scaffold runtime E2E smoke from the repository root is:

```bash
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

`scaffold.plugins` is a narrower suite for plugin scaffold and host diagnostics only.

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
