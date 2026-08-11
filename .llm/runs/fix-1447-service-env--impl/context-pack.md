# Context Pack — fix-1447-service-env--impl

## State

| Field             | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Issue             | rickylabs/netscript#1447 (P0, milestone 0.0.6)                  |
| Branch / worktree | `fix/1447-service-env` @ `/home/codex/repos/ns-1447-aspire-env` |
| Baseline          | `2256a67bf` (`origin/main`)                                     |
| Phase             | IMPL-EVAL cycle 1 `FAIL_FIX` remediated (slices 7–10); slice 11 fixes the `scaffold.runtime` gate failure at `48bee97b2`; awaiting re-evaluation |
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
  values win a collision. **Amended in slice 8:** `PORT` is now *refused* by the generator rather than
  emitted-and-overridden — it comes from the endpoint binding, a different mechanism than
  `withEnvironment`, so relying on their relative order was a promise this generator cannot keep.
  Refusal is named in a generated comment; consumers pin ports with `HostPort`.
- **D3** — one resolver, `resolveResourceEnvironment`, used by both register generators.
- **D4** — runtime proof in two legs: an executing test (generated module + recording builder + real
  subprocess) in `packages/cli`, and an E2E fixture + behavior gate in `scaffold.runtime`.

## Where things are

| What                        | Path                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Config contract             | `packages/aspire/config.ts` — `ServiceEntry`, `PluginEntry`, and their Zod schemas. Line offsets are not recorded: they move on every edit to the file and were already stale here                                                       |
| Services generator          | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts`                                                    |
| Plugins generator           | `.../register/generate-register-plugins.ts` (`Environment` emission :100-105)                                                                |
| Alias-resolver precedent    | `.../register/render-http-endpoint.ts` (`resolveHostPort`)                                                                                   |
| Generator tests             | `.../helpers/tests/generators-service-plugin_test.ts`, `.../tests/generators-test-support.ts`                                                |
| Cross-seam precedent        | `packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` (#952)                                                            |
| E2E gate ids / suite lists  | `packages/cli/e2e/src/domain/cli-surface.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts`                                        |
| #1447 E2E surface           | `packages/cli/e2e/src/application/gates/scaffold/service-env/` — gates, discovery, contract, process evidence, verdicts, and their tests      |

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
| 6     | `dbd7cd9d1` | `packages/aspire/README.md` § Resource environment; repo quality gates                                                       |
| 7     | `b7a5e55e4` | F4: `runtime-gates.ts` back to its baseline 906 lines; #1447 gates behind `service-env/`; the 44-child count belongs to the **parent** `gates/scaffold/` directory, not to `service-env/`, which held 6 files at this slice and 12 at head                        |
| 8     | `2297651c7` | F2: one executed test per documented category, real `@netscript/aspire` helpers in the double, `PORT` refused                 |
| 9     | `e9d22d9b5` | F1/F3: `aspire wait --status healthy`, state allowlist, `/proc/<pid>/environ` evidence, discovery + negative discovery        |
| 10    | `48bee97b2` | F4/F5 records: debt stop-condition note, new `aspire-config-length-1447` entry, A6 archetype correction + gate evidence, slice/commit reconciliation |
| 11    | `2781bb2b1` | `behavior.service-env` carries the permissions `/proc` actually requires, plus the regression that proves any gate command's flags satisfy its script |

## Next action

IMPL-EVAL cycle 2 in a **separate session** (`.llm/harness/evaluator/protocol.md`) at the new
immutable head, and the `scaffold.runtime` E2E executed by the run supervisor — this session was
explicitly withheld from running it. The new E2E gates (`runtime.service-env-fixture`,
`behavior.service-env`) are part of that suite in both the Postgres and SQLite tiers.

**Read before re-evaluating:** `behavior.service-env` now needs `/proc`, so it is Linux-only and
throws by name elsewhere; the suites already run Linux-only. It also carries `--allow-all`, which is
the *measured minimum* for `/proc` on Deno 2.9.5 and not a relaxation — Deno gates `/proc` on
`check_all`, so `--allow-read`, `--allow-read=/proc`, and any scoped or partial set are all refused.
See `drift.md` and worklog slice 11 for the leave-one-out measurement, and
`service-env-gates_test.ts` for the regression that fails if any flag is dropped or narrowed. The fixture declares a colliding
`OTEL_SERVICE_NAME`, `DB_PROVIDER`, engine URI, discovery key and `PORT` on the discovered service —
if any of those documented rules does not hold on the live AppHost, the gate is designed to fail
loudly rather than to be trimmed.
