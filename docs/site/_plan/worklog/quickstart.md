# Quickstart — code/API/CLI proof log (B2 floor)

Every command, subcommand, and flag shown on the page, verified against the real
CLI surface (deno doc did not resolve workspace-relative `@netscript/*` in this
env, so per the contract I read mod.ts / command-definition source directly).

| Claim on page | Verification (command run / file read) | Symbol / flag | Found | Note |
| --- | --- | --- | --- | --- |
| `netscript init` exists; description "Scaffold a new NetScript workspace" | read `packages/cli/src/public/features/init/init-command.ts` | `.name('init')` | yes | Cliffy command; arg `[name:string]`. |
| `--dry-run` flag on init | read `init-command.ts` L59 | `--dry-run` | yes | "Preview scaffold plan without writing files", default false; maps to `dryRun`. |
| `--no-aspire` flag on init | read `init-command.ts` L52 | `--no-aspire` | yes | "Skip Aspire orchestration layer"; surfaces as `options.aspire === false` → `noAspire`. |
| `init my-app` positional name | read `init-command.ts` L45,76 | `[name:string]` | yes | `name: nameArg ?? defaultProjectName()`. |
| Start flow `cd aspire` → `aspire restore` → `aspire run` | read `init-orchestrator.ts` `initNextSteps()` L86-119 and `generate-readme.ts` L59-65,120-121 | next-steps strings | yes | TS AppHost path emits exactly these three lines (verbatim wording lifted into the output block). |
| `--no-aspire` alt start: `deno task --cwd apps/<app> dev` | read `init-orchestrator.ts` L109; `generate-readme.ts` L67-68 | next-step string | yes | Default app folder is `apps/dashboard` (see appName note). |
| Init success output: banner, "Creating project", "Project scaffolded successfully in Xs", "Created: N files, M directories", "Next steps:" numbered list | read `init-orchestrator.ts` L26-29,75-79 + `console-logger.ts` `printBanner`/`printCompletionSuccess`/`printNextSteps` L43-54,203-226 | output strings | yes | Output block on page reproduces this exact shape (banner glyphs, ✅ line, numbered steps). Banner title "NetScript — Scaffold New Project". |
| Aspire dashboard port 18888 | read `packages/cli/src/kernel/constants/port-ranges.ts` L13 | `ASPIRE_DASHBOARD: 18888` | yes | Used http://localhost:18888. |
| Fresh app port 8000 | read `port-ranges.ts` L10 `APP { start: 8000 }`; appPort = PORT_RANGES.APP.start in `render-init.ts` L47 | `APP.start` | yes | Used http://localhost:8000. |
| Default app name `dashboard` | read `scaffold-plan_test.ts` L9 + `generators_test.ts` (appName: 'dashboard'); README/orchestrator reference `apps/${appName}` | `appName` default | yes | Tests fix the scaffolded app to `dashboard`; `/design` and `/examples` served by it. |
| Routes `/design`, `/examples/{crud,service,telemetry}`, `/health` | globbed `packages/cli/src/kernel/assets/app/routes/**/*.template` | route templates | yes | `(design)/design/index.tsx.template`, `examples/{crud,service,telemetry}/index.tsx.template`, `health.tsx.template`, `examples/(_shared)/service-showcase.ts.template`. `/design` showcases tokens + copied components. |
| Install: published JSR pkg `@netscript/cli` | read `packages/cli/README.md` L7-9 and `packages/cli/deno.json` name/version | `@netscript/cli` | yes | v0.0.1-alpha.0. README documents `deno add jsr:@netscript/cli`. |
| Install: bin entry `bin/netscript.ts` ships in published package | read `packages/cli/deno.json` publish.include L58 | `bin/netscript.ts` | yes | File is published (and excluded from `exports`). |
| Global install `deno install -A --global --name netscript jsr:@netscript/cli/bin/netscript.ts` | derived from deno.json `install` task (`deno install --allow-all --name=netscript bin/netscript.ts`) + the file being published | install invocation | partial | The repo task installs the **local** bin; JSR install targets the **published file path**. `bin/netscript.ts` is NOT in the `exports` map (only `.`, `./scaffolding`, `./testing`), so it is referenced by raw published-file path. Deno serves published files by path, so this resolves, but the package does not declare a formal bin export. See sourceBlocker note. |
| Ad-hoc run `deno run -A jsr:@netscript/cli/bin/netscript.ts --help` | same as above | run invocation | partial | Same caveat: raw published-file path, not an `exports` entry. |

## Code-proof requirement
Quickstart is a procedural page (no API symbol usage); the runnable proof is the
copy-paste command flow + the single verbatim init **output block** reproduced from
`console-logger.ts` + `initNextSteps()`. This is the working code path a reader
verifies success against ("this replaces hand-wiring an app, contracts, a plugin
host, and an Aspire dashboard yourself").