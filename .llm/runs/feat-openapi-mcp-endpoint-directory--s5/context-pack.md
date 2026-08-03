# Context Pack: OMB S5 ServiceEndpointDirectoryPort + adapters

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-endpoint-directory--s5` |
| Branch | `feat/openapi-mcp-endpoint-directory` |
| Current phase | `implement` (plan locked via composed waiver) |
| Archetype | `2 — Integration` slice |
| Scope overlays | none |

## Current State

Research and design are locked at clean `origin/main` `2c8865e8c`. Slices 1–3 now implement the
contract-first endpoint vocabulary, all four source adapters, deterministic composition, and the
bounded spec-first identity probe, with the complete surface published and documented through both
entrypoints. All implementation, consumer, JSR, and publish gates are green; supervisor evaluation
and merge-readiness actions remain deliberately unstarted.

## Completed

- Read issue #1131, RFC #1123, epic context, P1/P3 verdicts, canonical discovery design, required
  harness/doctrine/Aspire/JSR/PR/tooling authorities, and package consumers.
- Confirmed baseline doc lint and publish dry-run clean, no lock churn.
- Recorded Design checkpoint and the milestone-run PLAN-EVAL composed waiver.
- Implemented discriminated source/directory/probe contracts and the named source precedence.
- Implemented override, Aspire CLI, run-manifest, and appsettings sources with injected IO seams.
- Proved 6/6 source fixtures, scoped check/lint/fmt, package-specific quality scan, and
  `quality:gate` with no unsafe casts, lint ignores, or lock churn.
- Implemented deterministic precedence/conflicts, exclusions before fetch, bounded concurrency,
  row-local timeout/error isolation, and parent abort propagation.
- Implemented credential-free, redirect-free OpenAPI-first probing, exact P3 401/403 guidance,
  identity verification, response bounds, and opaque spec preservation.
- Proved 12/12 endpoint tests, 78/78 package tests, and 79-file scoped check/lint/fmt.
- Published the complete S5 surface from `.` and transitively `./cli`, documented default adapter
  permissions/configuration, and regenerated the embedded README asset.
- Proved zero full-export doc diagnostics, JSR audit exit 0, clean publish dry run, and no dependency
  or lock churn. Grouping the adapters/port kept folder-cardinality debt at baseline.

## In Progress

- Implementation handoff after the Slice 3 commit/push/comment. The provided PR worktree remains
  owned by the Desktop supervisor session; this attached thread remains the sole staging sender.

## Next Steps

1. Supervisor performs substantive review and the composed evaluation protocol.
2. Supervisor decides when to update PR/issue acceptance state and mark the draft ready.
3. Keep S6 projection/tool registration and S7 run-token producer wiring in their owned slices.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `override > aspire-cli > run-manifest > appsettings` | P1 + RFC | CLI is primary live; explicit override remains supreme. |
| Manifest requires expected current run id | plan D4 | Missing/mismatch is visible failure. |
| No S4 imports | user coordinate rule | S6 composes later. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/` | updated | Slice 1 evidence, reconcile note, attached-thread metadata |
| `packages/mcp/src/ports/service-endpoint-directory-port.ts` | new | Discriminated contract and three consumed ports |
| `packages/mcp/src/infrastructure/service-endpoints/` | new | Four named sources, URL policy, and fetch probe |
| `packages/mcp/tests/service-endpoint-source*` | new | Aspire/source fixture matrix; 6/6 passing |
| `packages/mcp/src/application/service-endpoint-directory.ts` | new | Default composition, precedence, bounds, isolation |
| `packages/mcp/src/infrastructure/fetch-service-endpoint-probe.ts` | new | Spec-first identity probe and P3 mapping |
| `packages/mcp/tests/service-endpoint-directory_test.ts` | new | Complete status/timeout/probe fixture matrix |
| `packages/mcp/deno.json` | updated | Test-only write permission for existing temp-dir tests |
| `packages/mcp/mod.ts`, `README.md` | updated | Published S5 surface and consumer/config/permission docs |
| `packages/mcp/src/publish-assets.generated.ts` | updated | Regenerated embedded README corpus |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slices 1–3 PASS | 12 focused tests + 78 package tests + 79-file check/lint/fmt |
| Fitness | slices 1–3 PASS | package quality scan + `quality:gate` + JSR audit |
| Runtime | PASS | all source/status rows and hanging-row isolation fixture-proven |
| Consumer | PASS | both entrypoints check/doc-lint clean; publish dry run clean |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: composed evaluator waiver; true remote baseline; manifest run-id injection clarification.
- Drift: lint/fmt wrappers require the package config because the root workspace glob shape does not
  parse for those Deno subcommands in this worktree; no source/config mutation was made.
- Drift fixed: the package test task lacked the test-only write permission required by existing
  temporary-directory tests; adding it restored the exact locked task to 78/78.
- Drift fixed: flat owned files initially created a new infrastructure cardinality warning; the A2
  port and adapters are now grouped under `src/ports/` and `infrastructure/service-endpoints/`.
- Tooling note: the JSR helper counts Deno's neutral slow-type progress banner as a warning; raw doc
  lint and publish show no actual slow-type diagnostic.
- Debt: preserve existing `MCP-A6-V2-SHAPE`; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
