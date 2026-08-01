# Worklog: detached Aspire telemetry discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1025-aspire-otel-discovery--otel-discovery` |
| Branch | `fix/1025-aspire-otel-discovery` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- No NetScript public API or CLI verb changes.
- Repository E2E behavior: detached scaffold runtime telemetry becomes a semantic gate.
- Agent/documentation surface: literal-error troubleshooting recipe for `otel` and `export`.

### Domain Vocabulary

- `DashboardRunState` — the minimal `appHostPath`/`dashboardUrl` record parsed from `aspire ps`.
- `OutputAssertion` — an internal post-command semantic assertion for captured stdout.

### Ports

- Existing `Deno.Command` harness boundary only; no new port is warranted.

### Constants

- Telemetry export filename and literal dashboard error text; no new extensible enum axis.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Bootstrap research/plan and obtain PLAN-EVAL | PLAN-EVAL PASS | `.llm/runs/.../*` |
| 2 | Make workaround discoverable and sync skill mirror | sync check + docs gates | `.agents/skills/aspire/SKILL.md`, `.claude/skills/aspire/SKILL.md`, `docs/site/observability/telemetry.md`, run artifacts |
| 3 | Strengthen detached telemetry/export regression | scoped check/lint/fmt + focused tests | `.llm/tools/e2e/scaffold-e2e-test.ts`, tests, run artifacts |
| 4 | Execute one-pass runtime evidence and final evaluation | scaffold runtime + IMPL-EVAL | run artifacts and PR/issue evidence |

### Deferred Scope

- Upstream CLI implementation fix — owned by the upstream issue.
- C# AppHost parity control — not required to implement or validate the run-state workaround.

### Contributor Path

Start at `#checkTelemetry()` in `.llm/tools/e2e/scaffold-e2e-test.ts`; dashboard discovery stays next
to the commands that consume it. Agent-facing recovery starts at the literal error heading in the Aspire skill.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 21:21 CEST | 1 | research complete | Exact failure exit 12 and explicit-URL exit 0 reproduced on generated TS AppHost. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Upstream classification | Run-state has URL and dashboard serves; only automatic CLI lookup fails. | research F1-F4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| C# control template creation exceeded tool execution window | minor | yes |

## Gate Results

- Pending PLAN-EVAL.
