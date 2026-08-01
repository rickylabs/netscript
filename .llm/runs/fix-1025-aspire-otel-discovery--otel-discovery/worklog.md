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
- Generated scaffold surface: authenticated dashboard URLs remain automatically discoverable.

### Domain Vocabulary

- `OutputAssertion` — an internal post-command semantic assertion for captured stdout.

### Ports

- Existing `Deno.Command` harness boundary only; no new port is warranted.

### Constants

- Telemetry export filename; no new extensible enum axis.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Bootstrap research/plan and obtain PLAN-EVAL | PLAN-EVAL PASS | `.llm/runs/.../*` |
| 2 | Remove anonymous dashboard mode at both generator sources | focused template tests + asset generation | `generate-aspire-config.ts`, `generate-aspire-config_test.ts`, `configure-dashboard.ts.template`, `generators-pipeline_test.ts`, `embedded.generated.ts`, `docs/site/explanation/aspire.md`, run artifacts |
| 3 | Strengthen automatic detached telemetry/export regression | scoped check/lint/fmt + focused tests | `.llm/tools/e2e/scaffold-e2e-test.ts`, tests, run artifacts |
| 4 | Execute one-pass runtime evidence and final evaluation | scaffold runtime + IMPL-EVAL | run artifacts and PR/issue evidence |

### Deferred Scope

- C# AppHost parity control — the NetScript A/B control directly established the cause.

### Contributor Path

Start at the dashboard environment variables in `generate-aspire-config.ts` and the dashboard helper
template; runtime proof lives at `#checkTelemetry()` in `.llm/tools/e2e/scaffold-e2e-test.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 21:21 CEST | 1 | research complete | Exact failure exit 12 and explicit-URL exit 0 reproduced on generated TS AppHost. |
| 2026-08-01 21:26 CEST | 1 | discriminator complete | Removing anonymous mode restored tokenized URL and automatic traces exit 0 under `--isolated`. |
| 2026-08-01 21:38 CEST | 1 | export amendment complete | Patched detached export saved a 12,857-byte zip and exited 0. |
| 2026-08-01 21:41 CEST | 1 | token blast-radius audit | 53 files matched dashboard/open/`:18888` guidance; wider alignment reported, not expanded. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| NetScript-side classification | Removing only anonymous mode changed automatic discovery from exit 12 to exit 0. | research F4, F7-F9 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| C# control template creation exceeded tool execution window | minor | yes |

## Gate Results

- PLAN-EVAL launch: BLOCKED before launch. Live provider canary reported absent OpenRouter
  credential (`auth_required`) for the canonical Qwen evaluator route. No implementation started.
- Separate owner-supervisor PLAN-EVAL at `575aea3fb`: FAIL_PLAN; required the anonymous-mode A/B
  control and an honest acceptance mapping. Both plan defects are now amended for cycle 2.
- Supervisor cycle-3 adjudication: conditional PASS. Findings A/B, token audit, and the published
  package gate-table amendment are complete; implementation is authorized.
