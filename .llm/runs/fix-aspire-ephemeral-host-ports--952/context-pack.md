# Context Pack — fix-aspire-ephemeral-host-ports--952

## What this run is

Fixes #952: a pristine `netscript init` generates `.withHttpEndpoint({ port: N, env: 'PORT' })` for
service and app resources. `port` is the Aspire **host** port; `aspire start --isolated` cannot
randomise a port the AppHost pinned, so two NetScript workspaces on one machine collide and the
dashboard can advertise a URL owned by another instance.

## The one-paragraph root cause

The three register generators interpolate `entry.Port` into the endpoint options unconditionally.
Aspire's documented shape for a non-.NET executable resource is `.withHttpEndpoint({ env: 'PORT' })`
— no port — which lets Aspire allocate both the host and target port and inject the target into the
process. `packages/cli/.../generate-register-infrastructure.ts` already uses the isolation-safe
idiom for containers; the executable registrations were simply never updated.

## Load-bearing facts (do not re-derive)

- For `addExecutable` resources, **both** `port` and `targetPort` are host-machine ports. The issue's
  suggested `targetPort` fix moves the collision rather than removing it. → `research.md` §4 C-2.
- `aspire start --isolated` exports **no** env signal an AppHost can read, so a
  "pin unless isolated" design is not available. → `research.md` F-2.
- The scaffolded service and app templates already read `PORT` with a literal fallback, so
  un-pinning needs no runtime change. → `research.md` F-4.
- Cross-resource wiring uses `getEndpoint('http')` and never reads `Port`. → `research.md` F-5.
- `e2e/.../runtime-gates.ts` live-probes `127.0.0.1:8091–8094`; nothing probes `:3000` or `:8010`.
  This is why plugin API ports are out of scope and service/app ports are in. → `research.md` F-8.

## Contract shape after this run

`HostPort ?? Port ?? (no pin)`. `Port` keeps its exact current meaning as a deprecated alias, so
every workspace already on disk behaves identically. Only newly scaffolded workspaces get the
isolation-safe default.

## Where things live

| Thing                          | Path                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Endpoint rendering rule        | `packages/cli/src/kernel/templates/aspire/helpers/register/render-http-endpoint.ts` |
| The three register generators  | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-{services,plugins,apps}.ts` |
| Config contract                | `packages/aspire/config.ts` (types + zod)                                         |
| Scaffold plan                  | `packages/cli/src/kernel/application/scaffold/{validate-init,render-ts-apphost}.ts` |
| Pristine appsettings           | `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts`                |
| Regression guard               | `.llm/tools/validation/check-aspire-host-ports.ts` → `deno task check:aspire-host-ports` |

## Open after this run

- Plugin API resources (`8091–8094`) still pin host ports. Blocked on the `scaffold.runtime` gates
  resolving endpoints from the Aspire resource service. Follow-up issue.
- `scaffold.runtime` was not runnable in this worktree (needs Docker + dotnet). The release cut that
  picks this change up must run it. → `drift.md` D-5.
