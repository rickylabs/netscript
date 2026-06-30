# Maintainer CLI

`netscript-dev` is the local contributor and maintainer binary for working inside the NetScript
repository. It uses local monorepo sources and copies unpublished packages/plugins into generated
workspaces. It is not exported by the published package.

The public CLI is `netscript` (`packages/cli/bin/netscript.ts` in this repo). Once all NetScript
packages are published on JSR, end users should run public `netscript ...` commands against JSR
packages instead of maintainer `netscript-dev` local-source commands. Release CI must cover that
public JSR-backed path.

## Entry Point

```bash
deno run -A packages/cli/bin/netscript-dev.ts <command>
```

## Commands

`netscript-dev` exposes the full public project command set (`db`, `deploy`, `generate`, `plugin`,
`service`, `contract`) plus maintainer-only commands that depend on local repository state.

### `netscript-dev init`

Creates a scaffolded workspace using local repository package sources.

```bash
deno run -A packages/cli/bin/netscript-dev.ts init demo --path ./tmp --ci --yes --no-git
```

### `netscript-dev sync packages`

Copies local package sources into an existing scaffolded workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync packages --project-root ./tmp/demo
```

### `netscript-dev sync plugin`

Copies an official plugin source tree from the repository into a workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync plugin worker workers --project-root ./tmp/demo
```

Official local-copy kinds are `worker`, `saga`, `trigger`, and `stream`. The optional second
argument is the installed plugin name, conventionally `workers`, `sagas`, `triggers`, or `streams`.

### `netscript-dev sync templates`

Regenerates helper templates in a workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync templates --target-path ./tmp/demo
```

### `netscript-dev probe monorepo`

Reports repository-local capabilities and source roots.

```bash
deno run -A packages/cli/bin/netscript-dev.ts probe monorepo
```

### `netscript-dev test scaffold`

Runs scaffold validation for a selected fixture.

```bash
deno run -A packages/cli/bin/netscript-dev.ts test scaffold scaffold.runtime --cleanup --format pretty
```

This command delegates to the root E2E runner. From the repository root, the equivalent one-pass
full scaffold runtime smoke is:

```bash
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Use this suite before merging scaffold output, plugin scaffolding, DB wiring, Aspire helper
generation, or official plugin copy-mode changes. `scaffold.plugins` is narrower: it stops after
plugin scaffold, registry generation, and plugin doctor.

## Manual Full Scaffold Smoke

For local maintainer review, create a generated project under the gitignored `scaffold/` directory
from the repository root:

```bash
deno run -A packages/cli/bin/netscript-dev.ts init full-test \
  --path scaffold \
  --db postgres \
  --service --service-name users --service-port 3001 \
  --editor zed \
  --ci --yes --no-git --force
```

Add the official plugins using the same cwd-sensitive shape as the E2E runtime suite:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --project-root scaffold/full-test --samples --force

Push-Location scaffold/full-test
deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --project-root . --samples --force
deno run -A ..\..\packages\cli\bin\netscript-dev.ts plugin install trigger --name triggers --project-root . --samples --force
Pop-Location

deno run -A packages/cli/bin/netscript-dev.ts plugin install stream --name streams --project-root scaffold/full-test --samples --force

deno run -A packages/cli/bin/netscript-dev.ts plugin list --project-root scaffold/full-test
```

Run the database and generated-registry workflow:

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

Expected plugin inventory: `workers`, `sagas`, `triggers`, and `streams`.
`--editor zed` writes `.zed/settings.json`, `.zed/tasks.json`, and `.zed/debug.json` in the
generated project.

## Boundary

Maintainer commands may inspect repository layout, copy local package sources, and invoke local
generation scripts. Public `netscript` commands do not depend on those capabilities.
