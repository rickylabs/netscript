# Worklog: restore Zod-4 OpenAPI query coercion (#1250)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-onboarding-quickwin-1250--1250` |
| Branch | `fix/onboarding-quickwin-1250` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `service` |

## Design

### Public Surface

- `createOpenAPIHandler` remains unchanged; its documented coercion guarantee becomes true for
  scaffolded Zod-4 contracts.

### Domain Vocabulary

- HTTP query input — transport strings decoded by oRPC.
- smart coercion plugin — upstream schema-aware conversion before Zod validation.

### Ports

- `FetchHandler.handle(Request, options)` — existing Web Request boundary used for the regression.

### Constants

- None added.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Activate run and lock plan | artifact review | `.llm/runs/fix-onboarding-quickwin-1250--1250/**` |
| 1 | Prove inert plugin failure, then select Zod-4 adapter | focused red/green test | `packages/service/tests/handlers_test.ts`, `packages/service/src/primitives/handlers.ts` |
| 2 | Record package and doctrine gates | targeted gates | run artifacts only |

### Deferred Scope

- An MCP operation-execution tool — #1204 only exposes discovery/schema introspection.
- Full scaffold runtime E2E — explicitly owned by the milestone orchestrator gate.

### Contributor Path

Future handler adapter changes must keep the HTTP-boundary numeric query regression green; plugin
construction alone is not sufficient evidence.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 0 | bootstrap | Issue body read first; baseline, doctrine, upstream API, and inherited lock change recorded. |
| 2026-08-04 | 0 | draft | Bootstrap commit `cf773ec38` pushed explicitly; draft PR #1256 opened with milestone and taxonomy. |
| 2026-08-04 | 1 | RED | Focused test matched the route but received HTTP 400 with the Zod-3 plugin. |
| 2026-08-04 | 1 | GREEN | Zod-4 adapter alias made the unchanged request return HTTP 200 and numeric `cycleId: 1`. |
| 2026-08-04 | 1 | introspection | Generated OpenAPI declares `cycleId` as a numeric query parameter; #1204 read-tool suite is 5/5 green. |
| 2026-08-04 | 2 | gates | Scoped/package/doctrine/JSR gates completed; no new lock delta or debt. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Zod-4 plugin alias | Upstream publishes the compatible class under an experimental name. | `deno doc npm:@orpc/zod@1.14.6/zod4` |
| HTTP behavior test | Catches the silent no-op failure class. | issue #1250; plan D2–D3 |
| No local PLAN-EVAL | Milestone evaluation is composed. | owner ruling D6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Generic PLAN-EVAL replaced by milestone composition | minor / authorized | yes |
| Inherited `deno.lock` change | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| scoped check | `run-deno-check.ts --root packages/service --ext ts,tsx` | PASS | 42 files, 0 findings; uses `--unstable-kv`. |
| scoped lint | `run-deno-lint.ts --root packages/service --ext ts,tsx` | PASS | 42 files, 0 findings. |
| scoped fmt | `run-deno-fmt.ts --root packages/service --ext ts,tsx` | PASS | 42 files, 0 findings. |
| doc-lint | `deno task doc:lint --root packages/service --pretty` | PASS | 3 entrypoints, 0 diagnostics. |
| publish dry-run | `deno task --cwd packages/service publish:dry-run` | PASS | No slow types; intended publish set only. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| code quality | PASS | scanner `--root packages/service --max-allow 0` | 0 findings, 0 allowances. |
| doctrine | PASS with baseline warnings | `check-doctrine.ts --root packages/service --text` | 0 FAIL; existing Scalar-generated inheritance and builder-size warnings only. |
| repository `quality:gate` | PASS | task exit 0 | Existing repository dependency/doctrine warnings only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| pre-fix negative control | PASS | focused test before source edit | Route matched and returned 400 instead of expected 200. |
| docs-shaped numeric GET | PASS | `handlers_test.ts` | Generated schema says numeric query; HTTP string `1` reaches handler as number `1`. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `packages/service` suite | PASS | `deno task --cwd packages/service test` | 87 passed, 0 failed. |
| MCP OpenAPI read tools | PASS | `openapi-read-tools_test.ts` | 5 passed, 0 failed; schema projection and curl template remain green. |

## Handoff Notes

- Review the test's observable numeric value first; it is the decisive acceptance property.
