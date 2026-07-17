# Plan: exclude unconfigured adapters from service aggregate health

## Run Metadata

| Field          | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g1-826-health`                   |
| Branch         | `fix/826-aggregate-health`                                        |
| Phase          | `plan`                                                            |
| Target         | `packages/service` plus the CLI scaffold runtime health assertion |
| Archetype      | `4 - Public DSL / Builder`                                        |
| Scope overlays | `service`                                                         |

## Archetype

Archetype 4 is the doctrine verdict and smallest fitting profile because `@netscript/service` is a
public builder/primitive package. Runtime and consumer gates are additionally required because the
changed primitive determines live HTTP health and is used by generated services.

## Current Doctrine Verdict

`@netscript/service`: **Refactor** — `presets/` named and `assets/` clarified. This narrow change
does not restructure those pre-existing concerns and must not deepen them.

## Axioms in Play

| Axiom | Why it matters                                                                              |
| ----- | ------------------------------------------------------------------------------------------- |
| A1    | Extend the exported health contract before changing aggregation behavior.                   |
| A2    | Keep aggregate participation explicit at the published boundary.                            |
| A6    | Put the predicate on the existing contract; do not add a helper/registry abstraction.       |
| A11   | The extension axis is whether a declared check participates in this running app.            |
| A14   | Per-adapter tests, consumer compilation, and scaffold runtime assertions preserve behavior. |

## Goal

Aggregate service health executes and reduces only configured/used adapter checks, while preserving
existing behavior for consumers that omit the new optional signal.

## Scope

- Add an optional, documented aggregate-participation property to `HealthCheck`.
- Filter excluded checks before execution and aggregate reduction.
- Add unit coverage for included and excluded database, KV, external-service, and custom checks.
- Replace `defineService`'s first-query-capable-client selection for multi-adapter records with
  provider-aware health-check registration driven by `DB_PROVIDER` / `DATABASE_PROVIDER`.
- Mark query-capable adapters whose record key does not match the configured provider as
  `configured: false`; preserve direct single-client behavior.
- Add/extend the `scaffold.runtime` aggregate-health assertion without running the full expensive
  suite in this implementation loop.
- Run the service consumer-compile check and required scoped/framework gates.

## Non-Scope

- Do not infer configuration from adapter names or global environment variables.
- Do not alter liveness or readiness contracts.
- Do not change HTTP status rules for failing configured checks.
- Do not run the full `scaffold.runtime` suite; the supervisor owns the merge-readiness run.
- Do not restructure `packages/service`, dispatch evaluators, merge, publish, or close milestone 13.

## Hidden Scope

- The new public field must remain optional to preserve structural compatibility.
- Exclusion must happen before calling `check()`, not only before the final `every()` reduction.
- Generated runtime assertion code must distinguish aggregate-health correctness from a
  listener-only probe.

## Locked Decisions

| ID | Decision                                                                                                                                                               | Rationale                                                                                         |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| D1 | Add an optional boolean participation signal to `HealthCheck`, defaulting to included.                                                                                 | Additive compatibility; explicit host-owned configuration; no adapter-name coupling.              |
| D2 | Filter before `Promise.allSettled`.                                                                                                                                    | Unconfigured checks neither execute nor influence status/details.                                 |
| D3 | Excluded checks are absent from `HealthResponse.checks`.                                                                                                               | The response describes the aggregate's actual inputs and avoids false healthy/skipped results.    |
| D4 | Test all four built-in adapter classes with throwing/side-effect sentinels.                                                                                            | Proves exclusion behavior independently of external resources and prevents accidental invocation. |
| D5 | Keep the full runtime suite for supervisor merge readiness.                                                                                                            | Matches the explicit cost boundary in the implementation brief.                                   |
| D6 | `defineService` maps every query-capable member of a multi-adapter `db` record to a named database check and sets `configured` from the configured provider/key match. | Fixes the actual first-match composition defect instead of exposing an unused knob.               |
| D7 | A direct `$queryRaw` client remains one configured `database` check.                                                                                                   | Preserves the established single-database API and generated selected-engine facade.               |

## Open-Decision Sweep

| Decision                     | Status       | Notes                                                                                                                                                                      |
| ---------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact public property name   | resolved now | `configured`, matching issue vocabulary and caller intent.                                                                                                                 |
| Whether false means excluded | resolved now | Only explicit `false` excludes; absent/true preserves existing behavior.                                                                                                   |
| Scaffold assertion location  | resolved now | Extend `ScaffoldE2ETest.#exerciseApis` to parse the generated database-backed service aggregate response and assert configured-provider details exclude inactive adapters. |

## Risk Register

| Risk                                        | Mitigation                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Existing consumer literals break            | Optional property plus explicit consumer-compile fixture.                                                          |
| Excluded check still performs I/O           | Filter the check definitions before mapping/invocation; unit sentinel asserts zero calls.                          |
| A genuinely configured failure gets hidden  | Default included and test explicit configured failure remains 503.                                                 |
| Runtime smoke only proves listener liveness | Parse aggregate payload and assert the selected database check is present while inactive adapter names are absent. |
| Public docs/publish surface regresses       | Scoped docs/JSR audit gates and no inferred new return types.                                                      |

## Anti-Patterns to Resolve or Avoid

| AP    | Status            | Plan                                                                                             |
| ----- | ----------------- | ------------------------------------------------------------------------------------------------ |
| AP-9  | risk              | Use the existing `HealthCheck` contract rather than a new adapter registry/helper.               |
| AP-11 | risk              | Configuration is supplied by composition, not read from hidden globals.                          |
| AP-19 | risk              | Do not add permissions; excluded KV/service checks must not perform I/O.                         |
| AP-24 | risk              | No switch or name-based dispatch over adapter classes.                                           |
| AP-25 | existing boundary | Do not add new side effects; preserve existing adapter-edge calls and exclude before invocation. |

## Fitness Gates

| Gate                  | Required | Expected evidence                                                                                                                |
| --------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| F-1..F-12, F-14..F-19 | yes      | `deno task arch:check`, scoped wrappers, quality scan, and focused manual diff review.                                           |
| Runtime health        | yes      | Focused service unit/runtime tests plus scaffold assertion source test.                                                          |
| Consumer import       | yes      | Existing and new structural consumer compile test.                                                                               |
| JSR surface           | yes      | `deno task doc:lint --root packages/service --pretty` and package audit/publish evidence appropriate to existing slow-type debt. |

## Arch-Debt Implications

| Entry                                        | Action | Notes                                                     |
| -------------------------------------------- | ------ | --------------------------------------------------------- |
| `packages/service` doctrine verdict Refactor | none   | Narrow additive behavior; no new folder or shape debt.    |
| `packages/service` T4 slow-type carve-out    | none   | No new inferred public return type; do not claim closure. |

## Validation Plan

| Order | Gate                                | Command or check                                                                                                                                               | Expected result                                                                      |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1     | Focused unit behavior               | `deno test --allow-env --allow-net --allow-read --allow-run --unstable-kv packages/service/tests/health_test.ts packages/service/tests/define-service_test.ts` | All health adapter-class exclusion cases and multi-database provider selection pass. |
| 2     | Consumer compile                    | focused existing/new package consumer type test or `deno check --unstable-kv` on its fixture                                                                   | Existing `HealthCheck` literals compile unchanged; new field is typed.               |
| 3     | Service check                       | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx`                                                          | PASS                                                                                 |
| 4     | Service lint                        | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx`                                                           | PASS                                                                                 |
| 5     | Service format                      | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx`                                                            | PASS                                                                                 |
| 6     | Framework quality                   | `deno task quality:scan`                                                                                                                                       | PASS; no new `any`, lint ignores, or forbidden casts.                                |
| 7     | Doctrine fitness                    | `deno task arch:check`                                                                                                                                         | PASS                                                                                 |
| 8     | Scaffold assertion unit/source gate | narrow test owning `.llm/tools/e2e/scaffold-e2e-test.ts` health assertions                                                                                     | PASS; full `scaffold.runtime` NOT_RUN pending supervisor.                            |

## Dependencies

- Supervisor-provided PLAN-EVAL PASS before implementation.
- Supervisor substantive slice review and full `scaffold.runtime` merge-readiness execution.

## Drift Watch

- If aggregate health is assembled outside `packages/service`, or adapters expose an existing
  configuration discriminator, stop and update this plan before implementation.
- If scaffold runtime lacks a safe response-body assertion seam, record the required expansion
  before changing the E2E harness.
