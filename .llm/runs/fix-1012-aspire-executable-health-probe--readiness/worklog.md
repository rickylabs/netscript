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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Include services/plugins | Their generated entrypoint families evidence `/health`; opt-out protects custom replacements. | service/plugin source inspection |
| One implementation slice | Contract, generated behavior, and tests form one atomic invariant. | plan |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | — | — |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Reproduction | focused `deno eval` generator call | PASS | Endpoint emitted; health probe absent before fix. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | PASS | `plan-eval.md` 2026-08-01 | Separate session · Claude Code + OpenRouter · Qwen preset. All Plan-Gate checklist items satisfied. Implementation may begin. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Live dead-port readiness | NOT_RUN | feasibility pending | No coverage claim. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated helper consumer | NOT_RUN | implementation pending | Semantic tests planned. |

## Handoff Notes

- PLAN-EVAL completed 2026-08-01. Verdict: PASS. All load-bearing claims verified: UNPINNED_APP emits endpoint but no probe; services and plugins evidence `/health`; `HealthCheckPath?: string | false` contract is complete; endpoint-before-probe ordering and tauri/desktop/task exclusions are protected; validation plan is honest about generator integration floor versus live AppHost dead-port test. Implementation may begin.

