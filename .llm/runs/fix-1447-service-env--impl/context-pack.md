# Context Pack — fix-1447-service-env--impl

## State

| Field             | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Issue             | rickylabs/netscript#1447 (P0, milestone 0.0.6)                  |
| Branch / worktree | `fix/1447-service-env` @ `/home/codex/repos/ns-1447-aspire-env` |
| Baseline          | `2256a67bf` (`origin/main`)                                     |
| Phase             | Implement + Gate complete (slices 1–6); awaiting IMPL-EVAL      |
| PLAN-EVAL         | `N/A` — justified in `plan.md` § PLAN-EVAL                      |
| PR                | #1449 (draft, `Closes #1447`, milestone 0.0.6, `status:impl`)   |

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
- **D4** — runtime proof in two legs: an executing test (generated module + recording builder + real
  subprocess) in `packages/cli`, and an E2E fixture + behavior gate in `scaffold.runtime`.

## Where things are

| What                        | Path                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Config contract             | `packages/aspire/config.ts` (`ServiceEntry` :161, `PluginEntry` :205, Zod :459 / :495)                                                       |
| Services generator          | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts`                                                    |
| Plugins generator           | `.../register/generate-register-plugins.ts` (`Environment` emission :100-105)                                                                |
| Alias-resolver precedent    | `.../register/render-http-endpoint.ts` (`resolveHostPort`)                                                                                   |
| Generator tests             | `.../helpers/tests/generators-service-plugin_test.ts`, `.../tests/generators-test-support.ts`                                                |
| Cross-seam precedent        | `packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` (#952)                                                            |
| E2E gate ids / defs / suite | `packages/cli/e2e/src/domain/cli-surface.ts`, `.../gates/scaffold/runtime-gates.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts` |

## Constraints on this run

No `any`, no casts, no `@ts-ignore`, no lint suppressions, no deleted or skipped tests, no hardcoded
resource names, `deno.lock` unchanged. The full `scaffold.runtime` E2E is the run supervisor's to
execute, not this session's.

## What landed

| Slice | Commit      | Content                                                                                                                      |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1     | `21cf655f5` | RED cross-seam generator test                                                                                                |
| 2–3   | `5df14ebc8` | contract (`Environment` + deprecated `Env` on both entries) + shared resolver + services emission, plugins routed through it |
| 4     | `41cf0075b` | executing runtime test: generated module + recording builder + real subprocess                                               |
| 5     | `fa9ba9573` | E2E `runtime.service-env-fixture` + `behavior.service-env` and their evidence unit tests                                     |
| 6     | see PR      | `packages/aspire/README.md` § Resource environment; repo quality gates                                                       |

## Next action

IMPL-EVAL in a **separate session** (`.llm/harness/evaluator/protocol.md`), and the
`scaffold.runtime` E2E executed by the run supervisor — this session was explicitly withheld from
running it. The new E2E gates (`runtime.service-env-fixture`, `behavior.service-env`) are part of
that suite in both the Postgres and SQLite tiers.
