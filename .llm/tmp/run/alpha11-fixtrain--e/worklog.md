# Worklog: alpha.11 fix-train Slice E

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `alpha11-fixtrain--e` |
| Branch | `fix/service-health-e2e-alpha11-e` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `service` |

## Design

### Public Surface

- `scaffold.runtime` e2e suite gate list.
- CLI e2e gate id constants consumed by suite definitions and reports.

### Domain Vocabulary

- `behavior.service-health` — behavior-phase evidence that the generated `users` service serves plain `GET /health`.
- `users` Aspire resource — scaffolded service resource created by `netscript init --service-name users --service-port 3001`.

### Ports

- Aspire CLI `describe --format Json` — source of runtime endpoint truth for the generated service.
- Web Platform `fetch` — health probe transport.

### Constants

- `GATE.BEHAVIOR_SERVICE_HEALTH` — finite gate id added to the scaffold runtime suite.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Add the generated service `/health` behavior probe to `scaffold.runtime`. | Scoped CLI check/lint/fmt and full `scaffold.runtime` e2e. | `packages/cli/e2e/src/domain/cli-surface.ts`, `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts` |

### Deferred Scope

- Service template rewrite — deferred unless the new probe proves plain `/health` is not served.
- Broader service-runtime scaffold changes — out of scope unless the Linux `aspire start` probe is red.

### Contributor Path

Add future scaffold runtime behavior checks by defining a `GATE` id in `cli-surface.ts`, registering the gate in `runtime-gates.ts`, then inserting that id into the appropriate capability gate list.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-27 | 1 | Research | Confirmed `defineService()` calls `withHealth()` and `/health` is anonymous in `packages/service`. |
| 2026-06-27 | 1 | Implementation | Added `behavior.service-health` gate that discovers the `users` endpoint from `aspire describe --format Json` and probes `/health`. |
| 2026-06-27 | 1 | Static gates | Scoped check/lint/fmt passed for the touched CLI e2e files; full package check passed. |
| 2026-06-27 | 1 | Runtime gate | Full `scaffold.runtime` passed on Linux/WSL with `behavior.service-health` green. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use a command gate for service health. | Existing HTTP gates are synchronous fixed URLs; this probe needs Aspire JSON discovery before fetch. | `packages/cli/e2e/src/domain/gate-definition.ts` |
| Do not rewrite service health templates before running the probe. | Current service builder already registers `/health`, `/health/live`, and `/health/ready`. | `packages/service/src/presets/define-service.ts`, `packages/service/src/builder/service-builder-impl.ts`, `packages/service/src/auth/auth-middleware.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Run artifact directory was absent at slice start and was created for this implementation slice. | minor | yes |
| F-14 verified as no-op after Linux/WSL `aspire start` service `/health` probe passed. | minor | yes |
| F-13 appears Windows `aspire run`-specific because Linux/WSL `aspire start` served the generated service health endpoint. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| CLI check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts` | PASS | 524 files selected, 5 batches, 0 failed. |
| CLI touched-file check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts --include '<touched e2e files>'` | PASS | 3 files selected, 1 batch, 0 failed. |
| CLI touched-file lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts --include '<touched e2e files>'` | PASS | 3 files selected, 0 findings. Full-package wrapper returned exit 1 with 0 findings and is not used as this slice verdict. |
| CLI touched-file fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts --include '<touched e2e files>'` | PASS | 3 files selected, 0 failed batches. Full-package wrapper returned exit 1 with 0 findings and is not used as this slice verdict. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 6 relevant manual checks | PENDING_SCRIPT | Gate id and runtime behavior change remain in existing e2e structure. | Full scripted arch gate not required for this narrow slice. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Serialization guard | PASS | `aspire ps --format Json` returned `[]`; `ss` showed ports 18891 and 3001 free. | No concurrent fixed-port scaffold runtime run detected. |
| `scaffold.runtime` | PASS | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | Summary: passed=48 failed=0; `behavior.service-health` passed on Linux/WSL. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated scaffold runtime | PASS | Full e2e | `behavior.service-health` passed after topology discovery via `aspire describe --format Json`. |

## Handoff Notes

- `behavior.service-health` runs immediately after `runtime.aspire-describe`.
- F-14 is a no-op: the generated service served plain `/health` under Linux/WSL `aspire start`.
