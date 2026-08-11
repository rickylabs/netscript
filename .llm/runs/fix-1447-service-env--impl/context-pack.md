# Context Pack — fix-1447-service-env--impl

## State

| Field | Value |
| --- | --- |
| Issue | rickylabs/netscript#1447 (P0, milestone 0.0.6) |
| Branch / worktree | `fix/1447-service-env` @ `/home/codex/repos/ns-1447-aspire-env` |
| Baseline | `2256a67bf` (`origin/main`) |
| Phase | Bootstrap + Research + Plan complete; implementation starting at slice 1 |
| PLAN-EVAL | `N/A` — justified in `plan.md` § PLAN-EVAL |
| PR | (opened at slice 1) |

## The defect in one paragraph

`Services[].Env` in `appsettings.json` is stripped by Zod during `parseAppSettings` because
`ServiceEntry` declares no environment field at all. The service registration generator therefore
cannot apply it, and the generated Aspire resource starts with only generated OTel/database/`PORT`
values. `PluginEntry` already has the same concept under the name `Environment`.

## Decisions in force

- **D1 naming** — `Environment` canonical, `Env` a `@deprecated` alias read only when `Environment`
  is absent, on **both** `ServiceEntry` and `PluginEntry` (parity by construction). Mirrors the
  existing `HostPort` / `Port` pair.
- **D2 precedence** — declared environment is emitted **first**, generated
  telemetry/database/discovery values **after**; `withEnvironment` is last-write-wins, so generated
  values win a collision. `PORT` comes from Aspire endpoint allocation and is not overridable.
- **D3** — one resolver, `resolveResourceEnvironment`, used by both register generators.
- **D4** — runtime proof in two legs: an executing test (generated module + recording builder +
  real subprocess) in `packages/cli`, and an E2E fixture + behavior gate in `scaffold.runtime`.

## Where things are

| What | Path |
| --- | --- |
| Config contract | `packages/aspire/config.ts` (`ServiceEntry` :161, `PluginEntry` :205, Zod :459 / :495) |
| Services generator | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts` |
| Plugins generator | `.../register/generate-register-plugins.ts` (`Environment` emission :100-105) |
| Alias-resolver precedent | `.../register/render-http-endpoint.ts` (`resolveHostPort`) |
| Generator tests | `.../helpers/tests/generators-service-plugin_test.ts`, `.../tests/generators-test-support.ts` |
| Cross-seam precedent | `packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` (#952) |
| E2E gate ids / defs / suite | `packages/cli/e2e/src/domain/cli-surface.ts`, `.../gates/scaffold/runtime-gates.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts` |

## Constraints on this run

No `any`, no casts, no `@ts-ignore`, no lint suppressions, no deleted or skipped tests, no
hardcoded resource names, `deno.lock` unchanged. The full `scaffold.runtime` E2E is the run
supervisor's to execute, not this session's.

## Next action

Slice 1 — write the RED generator test and capture its failing output before any source change.
