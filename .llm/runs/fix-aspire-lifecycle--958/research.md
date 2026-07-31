# Research — fix-aspire-lifecycle--958

## Re-baseline

- Carried-in source: `plan.md` and `context-pack.md` on PR #986.
- Re-derived against `main` at merge base `bd61d7ab3` on 2026-07-31, plus the installed Aspire
  CLI `13.4.6` and upstream tag `v13.4.6`.
- What changed vs the carried-in version:
  - Aspire 13.4.6 already makes detached AppHost startup timeout configurable through
    `ASPIRE_CLI_START_TIMEOUT`; this is not a missing NetScript contract.
  - Aspire communicates isolated mode to the AppHost as
    `DcpPublisher__RandomizePorts=true`. Generated AppHost code can therefore select session
    lifetime only for isolated starts while preserving ordinary persistent starts byte-for-byte.
  - Every generated database workspace defines `db:studio`; the absent-task hypothesis is false.
    The current generated tool is an auto-started `deno task db:studio` executable. The optional
    Aspire `withProcessCommand` command is disabled unless `NETSCRIPT_ASPIRE_PROCESS_COMMANDS=1`.
  - Phase/elapsed reporting and the boundary of the detached-start budget are implemented inside
    the upstream Aspire CLI launcher, not in `@netscript/cli`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Generated database containers apply `ContainerLifetime.Persistent` whenever the config entry is persistent, without consulting isolated mode. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` around the `entry.Persistent` branch. |
| 2 | Aspire 13.4.6 sets `DcpPublisher__RandomizePorts=true` for isolated AppHosts. | Upstream `v13.4.6`: `src/Aspire.Cli/Projects/DotNetAppHostProject.cs`; upstream `RunCommandTests` asserts the environment key. |
| 3 | Aspire 13.4.6 reads the positive integer `ASPIRE_CLI_START_TIMEOUT`, defaulting to 120 seconds. | Upstream `v13.4.6`: `src/Aspire.Cli/Commands/AppHostStartupTimeout.cs` and `src/Aspire.Cli/CliConfigNames.cs`. |
| 4 | NetScript's scaffold runtime runner already gives command gates 900 seconds; its own runtime gate is not the reported 120-second timeout. | `packages/cli/e2e/src/create-default-runner.ts` and `packages/cli/e2e/src/application/gates/command-gate.ts`. |
| 5 | `db:studio` is generated into each database workspace and invokes Prisma Studio on port 5555. | `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts`. |
| 6 | Prisma Studio is currently registered as an auto-started executable; `withProcessCommand` is a disabled optional seam and its default result handling can surface process output. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-tools.ts` and `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-tools-1.ts.template`; Aspire 13.4 `ProcessCommandOptions`. |
| 7 | Current Aspire documentation says meaningful configuration changes recreate a persistent resource and that persistent containers are keyed by resource name plus an AppHost-path hash. | `aspire docs get configure-resource-lifetimes-in-aspire`. |

## jsr-audit surface scan

- Surface scanned: N/A. The proposed work changes internal CLI scaffold generators and E2E
  behavior, not package exports or JSDoc.
- Slow-type / surface risks: N/A for this internal generator/runtime behavior slice.

## Open questions

- Does beta.12 accept a NetScript workaround that maps persistent containers to session lifetime
  whenever `DcpPublisher__RandomizePorts=true`, even though upstream Aspire documents/tests
  persistent lifetime with randomized ports as supported?
- Should Prisma Studio become an on-demand process command instead of an auto-started executable?
  This is a behavior change and differs from the binding plan's generation-time absent-task check.
- For #958, is the deliverable limited to generated guidance/default environment configuration for
  the already-supported `ASPIRE_CLI_START_TIMEOUT`, or must phase/elapsed reporting wait for an
  upstream Aspire change?

