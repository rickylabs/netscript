---
name: netscript-cli
description: NetScript CLI, scaffold, maintainer, plugin, and E2E command guide. Use whenever a task mentions netscript init, netscript-dev, maintainer CLI, scaffold output, generated projects, plugin install/sync/list/doctor, generate plugins/runtime-schemas, DB/service commands, Aspire scaffold validation, full CLI E2E, or OpenHands/Copilot requests to run CLI scaffold suites.
---

# NetScript CLI

Use this skill before running or recommending NetScript CLI commands. Prefer live `--help` output
for final option spelling, but start from the command map below so agents do not rediscover the
basics.

## Entry Points

From the repository root:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts <command>
```

`packages/cli/bin/netscript-dev.ts` is the local maintainer/contributor binary. It uses local
monorepo sources, copies unpublished packages/plugins into generated workspaces, and exposes
maintainer-only `sync`, `probe`, `test`, and release workflows.

The public binary is `packages/cli/bin/netscript.ts`, published as the user-facing `netscript`
command. End users ultimately run `netscript ...` against JSR packages, not local source copies.
Release CI must validate that public surface once all packages are published on JSR.

Inside a generated local-source scaffold, the maintainer init copies a local CLI package, so these
commands are valid from the generated project root:

```powershell
deno run -A ../../packages/cli/bin/netscript-dev.ts <command>
deno run -A packages/cli/bin/netscript-dev.ts <command>
```

## Full E2E Suites

Before merge-readiness for general CLI work:

```powershell
deno task e2e:cli
```

For scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, official plugin copy
mode, or release readiness, run the stronger full runtime smoke in one pass:

```powershell
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Do not replace that command with separate `gates` or individual scaffold commands when the user asks
for the full suite. Use `--format pretty` for manual runs. Keep `--cleanup` unless the user wants
the generated Aspire runtime left running for inspection. `scaffold.plugins` is only the narrower
plugin scaffold and diagnostic suite; it does not run DB init/generate/seed or Aspire runtime
behavior.

OpenHands trigger template:

```text
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run the full scaffold runtime E2E smoke for this PR.

Use this single one-pass command from the repository root:

deno task e2e:cli run scaffold.runtime --cleanup --format pretty

Do not split this into individual gate commands. Report the raw exit code and summarize failing suite/test names if any. Preserve lock hygiene: do not commit deno.lock or source churn unless the run explicitly requires a reviewed fix.
```

## Manual Full Scaffold Smoke

From the repo root:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init full-test `
  --path scaffold `
  --db postgres `
  --service --service-name users --service-port 3001 `
  --editor zed `
  --ci --yes --no-git --force

deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --project-root scaffold/full-test --samples --force

Push-Location scaffold/full-test
deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --project-root . --samples --force
deno run -A ..\..\packages\cli\bin\netscript-dev.ts plugin install trigger --name triggers --project-root . --samples --force
Pop-Location

deno run -A packages/cli/bin/netscript-dev.ts plugin install stream --name streams --project-root scaffold/full-test --samples --force

deno run -A packages/cli/bin/netscript-dev.ts plugin list --project-root scaffold/full-test

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

Expected plugin inventory: `workers`, `sagas`, `triggers`, and `streams`. The generated Zed config
lives under `scaffold/full-test/.zed/` when `--editor zed` is used.

## Current Command Shapes

Use these as the baseline, and verify with `--help` if changing docs or automation:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init <name> --path <parent> --db <engine> --service --service-name <name> --service-port <port> --editor zed --ci --yes --no-git --force
deno run -A packages/cli/bin/netscript-dev.ts sync packages --project-root <project>
deno run -A packages/cli/bin/netscript-dev.ts sync plugin <kind> [name] --project-root <project> --force
deno run -A packages/cli/bin/netscript-dev.ts sync templates --target-path <project>
deno run -A packages/cli/bin/netscript-dev.ts test scaffold scaffold.runtime --cleanup --format pretty
deno run -A packages/cli/bin/netscript-dev.ts plugin install <kind> --name <name> --project-root <project> --force
deno run -A packages/cli/bin/netscript-dev.ts db init --project-root <project> --db <engine> --name init
deno run -A packages/cli/bin/netscript-dev.ts db generate --project-root <project> --db <engine>
deno run -A packages/cli/bin/netscript-dev.ts db seed --project-root <project> --db <engine>
deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root <project>
```

Plugin kinds and conventional names:

| Kind      | Installed name |
| --------- | -------------- |
| `worker`  | `workers`      |
| `saga`    | `sagas`        |
| `trigger` | `triggers`     |
| `stream`  | `streams`      |

`plugin install` scaffolds/registers plugin workspace wiring. `sync plugin` copies official local plugin
implementation sources from the monorepo into an existing scaffold.

## Source Docs

Read these before updating command docs or diagnosing scaffold behavior:

- `commands.md` (alongside this skill) — the command contract
- `maintainer-cli.md` (alongside this skill) — the maintainer CLI surface
- `C:\Dev\repos\netscript\output\test-app\.claude\12-cli-scaffold.md` when available locally
- `packages/cli/e2e/cli.ts` and related e2e source when the suite behavior itself is in question
