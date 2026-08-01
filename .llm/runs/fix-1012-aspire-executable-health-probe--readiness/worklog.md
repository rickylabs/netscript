# Worklog: executable HTTP readiness reports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1012-aspire-executable-health-probe--readiness` |
| Branch | `fix/1012-aspire-executable-health-probe` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Design

### Public Surface

- `ServiceEntry.HealthCheckPath?: string | false`
- `PluginEntry.HealthCheckPath?: string | false`
- Existing internal generator entrypoints: `generateRegisterApps`, `generateRegisterServices`, `generateRegisterPlugins`

### Domain Vocabulary

- `HealthCheckPath` — HTTP readiness path, with `false` as the explicit no-route opt-out.
- HTTP endpoint name — existing constant value `http`, used to bind the probe to the advertised endpoint.

### Ports

- Aspire SDK resource builder — existing generated boundary providing `withHttpEndpoint` and `withHttpHealthCheck`.

### Constants

- `RESOURCE_DEFAULTS.AppHealthCheckPath` — `/health` default shared by generated HTTP executables.
- `RESOURCE_DEFAULTS.HttpEndpointName` — `http` endpoint binding.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Make readiness reports invariant for generated HTTP executables, with config opt-outs and semantic tests. | Six requested scoped gates + harness quality/doc gates | Aspire app/service/plugin generators; generator tests; `packages/aspire/config.ts`; Aspire schema tests; run artifacts |

### Deferred Scope

- Live AppHost dead-port integration — only if no stable existing fixture can exercise it honestly in this repository harness.
- Aspire upstream zero-report status semantics — not a NetScript-owned surface.

### Contributor Path

Adjust the resource entry contract in `packages/aspire/config.ts`, then follow the endpoint/probe
ordering assertions beside the corresponding generator tests under the Aspire helper test folder.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | planning | reproduction | `UNPINNED_APP` emitted an HTTP endpoint and no health probe; reported cause confirmed. |
| 2026-08-01 | planning | scope 2 evidence | Service builder registers three health routes; plugin factory unconditionally composes `.withHealth()`. |
| 2026-08-01 | implementation | readiness invariant | Apps, services, and plugins now emit an HTTP readiness probe after their endpoint unless `HealthCheckPath: false`. |
| 2026-08-01 | implementation | validation | All six requested scoped gates, `quality:gate`, and Aspire `doc:lint` passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Include services/plugins | Their generated entrypoint families evidence `/health`; opt-out protects custom replacements. | service/plugin source inspection |
| One implementation slice | Contract, generated behavior, and tests form one atomic invariant. | plan |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Evaluator routing record corrected by owner | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Reproduction | focused `deno eval` generator call | PASS | Endpoint emitted; health probe absent before fix. |
| CLI template check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/templates/aspire --ext ts` | PASS | 28 files; 0 failed batches; 0 findings. |
| Aspire check | `deno run -A .llm/tools/run-deno-check.ts --root packages/aspire --ext ts` | PASS | 45 files; 0 failed batches; 0 findings. |
| CLI template lint | `deno lint packages/cli/src/kernel/templates/aspire packages/aspire` | PASS | Checked 45 files. |
| CLI template format | `deno fmt --check packages/cli/src/kernel/templates/aspire packages/aspire` | PASS | Checked 48 files. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | PASS | `plan-eval.md` 2026-08-01 | Opus 5 supervisor evaluation; conditions C1 and C2 carried into implementation. |
| Framework quality | PASS | `deno task quality:gate` | Exit 0; architecture scan emitted existing warnings and no failures. |
| Aspire public docs | PASS | `deno task doc:lint --root packages/aspire --pretty` | 1 package; 0 errors. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CLI generator tests | PASS | `deno test -A packages/cli/src/kernel/templates/aspire/helpers/tests/` | 18 passed (159 steps), 0 failed. |
| Aspire tests | PASS | `deno test -A packages/aspire/tests/` | 18 passed (68 steps), 0 failed. |
| Live dead-port readiness | NOT_RUN | no stable existing fixture | The generator-level integration test is the strongest honest coverage in this focused helper-only slice; no live AppHost claim. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated helper consumer | PASS | generator test output | Unpinned app, service, and plugin output contains endpoint-bound probes in endpoint-before-probe order; custom paths and `false` opt-outs are covered. |

## Handoff Notes

- Implementation is complete and awaits the supervisor's separate IMPL-EVAL. PLAN-EVAL C1 is documented in the PR as a service/plugin custom-entrypoint behavior change with the `HealthCheckPath: false` migration; C2 is satisfied by correcting the shared default path JSDoc.
