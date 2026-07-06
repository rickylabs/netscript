# #402 T1 Telemetry Worklog

## Design

### Public Surface

- `@netscript/telemetry/attributes`
  - `TelemetryConventionChecklist`
  - `NetScriptAttributeDomains`
  - `NETSCRIPT_ATTRIBUTE_ROOT`
  - `NETSCRIPT_ATTRIBUTE_ALIAS_MODE`
  - `NETSCRIPT_ATTRIBUTE_ALIAS_WINDOW`
  - `NETSCRIPT_SEMCONV_STABILITY_OPT_IN`
  - `OTEL_SEMCONV_STABILITY_OPT_IN`
  - `createJobAttributes`
  - `createMessagingAttributes`
  - `createSagaAttributes`
  - `createTriggerAttributes`
  - `createExecutionAttributes`
  - `createGenAiAttributes`
- `@netscript/telemetry/config`
  - `OTEL_ENV_VARS.OTEL_SEMCONV_STABILITY_OPT_IN`
  - `OTEL_SEMCONV_STABILITY_OPT_IN_VALUE`
  - `TelemetryConfig.semconvStabilityOptIn`
  - `TelemetryConfigDescription.semconvStabilityOptIn`

### Domain Vocabulary

- TC identifiers: `TC-1` through `TC-14`.
- Proprietary attribute root: `netscript.*`.
- Deprecated alias mode/window: `dup` through `0.0.1-beta.5`.
- Semconv opt-in: `messaging,rpc,gen_ai_latest_experimental`.

### Ports

- None introduced. This T1 slice is contract-only and deliberately avoids #403 ports/adapters
  restructuring.

### Constants

- `TelemetryConventionChecklist`
- `NetScriptAttributeDomains`
- `SpanNames`
- `NetScriptJobAttributes`
- `NetScriptExecutionAttributes`
- `SagaAttributes`
- `GenAiAttributes`
- `OTEL_ENV_VARS`

### Commit Slices

1. T1 convention contract: domain convention constants/checklist, span-name expansion, attribute
   builders, semconv config wiring, docs, tests, and slice-local artifacts.

### Deferred Scope

- No `packages/telemetry` ports/adapters restructure, no `./otel` or `./query` subpaths, no
  `src/core` folder moves, no consumer behavior changes beyond the new exported contract builders.
  Those are #403 and later telemetry issues.

### Contributor Path

- Add a telemetry convention rule in `src/domain/telemetry-convention.ts`.
- Add finite attribute key vocabulary in `src/attributes/<domain>.ts`.
- Add or extend a `createXAttributes` builder in `src/attributes/helpers.ts`.
- Prove canonical keys and deprecated aliases in `tests/attributes/helpers_test.ts`.
- Document user-facing convention changes in `docs/site/reference/telemetry/convention.md`.

## Evidence

| Gate                                                                                                                       | Result                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `deno check --unstable-kv packages/telemetry/attributes.ts packages/telemetry/config.ts`                                   | pass                                     |
| `deno test --allow-env packages/telemetry/tests/attributes/helpers_test.ts packages/telemetry/tests/config/config_test.ts` | pass, 5 tests                            |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --ext ts,tsx`                    | pass, 62 files                           |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --ext ts,tsx`                     | pass, 62 files                           |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/telemetry --ext ts,tsx`                      | pass, 62 files                           |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --ext ts,tsx`                              | pass, 1,914 files                        |
| `deno task doc:lint --root packages/telemetry --pretty`                                                                    | pass, full export map, 0 combined errors |
| `cd packages/telemetry && deno publish --dry-run --allow-dirty`                                                            | pass                                     |
| `deno task check`                                                                                                          | pass, 2,110 files                        |
| `deno task test`                                                                                                           | pass, 1,501 passed, 12 ignored           |

## Reconcile Note

- Related issues #403 through #409 were inspected and updated so their acceptance sections reference
  the published #402 TC-1..14 convention, including semconv, `netscript.*`, and span/link vocabulary
  where relevant.
