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
| scoped check/lint/fmt | planned | NOT_RUN | Pending implementation. |
| doc-lint / publish dry-run | planned | NOT_RUN | Pending implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype-4 F-set | NOT_RUN | planned gates | Pending implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| docs-shaped numeric GET | NOT_RUN | focused test | Pending implementation. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `packages/service` suite | NOT_RUN | package task | Pending implementation. |

## Handoff Notes

- Review the test's observable numeric value first; it is the decisive acceptance property.

