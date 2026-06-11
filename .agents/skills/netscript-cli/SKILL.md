---
name: netscript-cli
description: NetScript CLI, scaffold, maintainer, plugin, and E2E command guide. Use whenever a task mentions netscript init, netscript-dev, maintainer CLI, scaffold output, generated projects, plugin add/sync/list/doctor, generate plugins/runtime-schemas, DB/service commands, Aspire scaffold validation, full CLI E2E, or OpenHands/Copilot requests to run CLI scaffold suites.
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

Inside a generated local-source scaffold, use the copied CLI through the relative repo path:

```powershell
deno run -A ../../packages/cli/bin/netscript-dev.ts <command>
```

`packages/cli/bin/netscript-dev.ts` is the local maintainer/contributor binary. It exposes public
commands plus repository-only `sync`, `probe`, `test`, and release workflows. `netscript.ts` mirrors
the published user-facing command surface.

## Full E2E Suites

Before merge-readiness for general CLI work:

```powershell
deno task e2e:cli
```

For scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, or official plugin
copy mode, run the stronger full scaffold/plugins smoke in one pass:

```powershell
deno task e2e:cli run scaffold.plugins --cleanup --format pretty
```

Do not replace that command with separate `gates` or individual scaffold commands when the user asks
for the full suite. Use `--format pretty` for manual runs. Keep `--cleanup` unless the user wants
the generated Aspire runtime left running for inspection.

OpenHands trigger template:

```text
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run the full scaffold/plugins E2E smoke for this PR.

Use this single one-pass command from the repository root:

deno task e2e:cli run scaffold.plugins --cleanup --format pretty

Do not split this into individual gate commands. Report the raw exit code and summarize failing suite/test names if any. Preserve lock hygiene: do not commit deno.lock or source churn unless the run explicitly requires a reviewed fix.
```

## Manual Full Scaffold Smoke

From the repo root:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init full-test `
  --path scaffold `
  --db postgres `
  --service --service-name users --service-port 3001 `
  --ci --yes --no-git --force

cd scaffold/full-test

deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add worker --name workers --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add saga --name sagas --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add trigger --name triggers --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add stream --name streams --project-root . --force

deno run -A ../../packages/cli/bin/netscript-dev.ts plugin list
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin doctor --project-root .
deno run -A ../../packages/cli/bin/netscript-dev.ts generate plugins --project-root .
deno task check
```

Expected plugin inventory: `workers`, `sagas`, `triggers`, and `streams`.

## Current Command Shapes

Use these as the baseline, and verify with `--help` if changing docs or automation:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init <name> --path <parent> --db <engine> --service --service-name <name> --service-port <port> --ci --yes --no-git --force
deno run -A packages/cli/bin/netscript-dev.ts sync packages --project-root <project>
deno run -A packages/cli/bin/netscript-dev.ts sync plugin <kind> [name] --project-root <project> --force
deno run -A packages/cli/bin/netscript-dev.ts sync templates --target-path <project>
deno run -A packages/cli/bin/netscript-dev.ts test scaffold scaffold.plugins --cleanup --format pretty
deno run -A packages/cli/bin/netscript-dev.ts plugin add <kind> --name <name> --project-root <project> --force
deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root <project>
```

Plugin kinds and conventional names:

| Kind      | Installed name |
| --------- | -------------- |
| `worker`  | `workers`      |
| `saga`    | `sagas`        |
| `trigger` | `triggers`     |
| `stream`  | `streams`      |

`plugin add` scaffolds/registers plugin workspace wiring. `sync plugin` copies official local plugin
implementation sources from the monorepo into an existing scaffold.

## Source Docs

Read these before updating command docs or diagnosing scaffold behavior:

- `packages/cli/docs/commands.md`
- `packages/cli/docs/maintainer-cli.md`
- `C:\Dev\repos\netscript\output\test-app\.claude\12-cli-scaffold.md` when available locally
- `packages/cli/e2e/cli.ts` and related e2e source when the suite behavior itself is in question
