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

Research and design are locked at clean `origin/main` `2c8865e8c`. Slices 1–2 now implement the
contract-first endpoint vocabulary, all four source adapters, deterministic composition, and the
bounded spec-first identity probe. The source/status matrix, hanging-row isolation case, and full
package tests are green. Public exports/docs and JSR fitness remain for slice 3.

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

## In Progress

- Slice 3 public exports, docs, and consumer/JSR gates. The provided PR worktree remains owned by
  the Desktop supervisor session; this attached thread remains the sole staging sender.

## Next Steps

1. Export the complete directory/source/probe surface through both package entrypoints.
2. Document composition, carrier/permission expectations, status behavior, and S6 usage.
3. Run full scoped, doc-lint, JSR audit, publish dry-run, and lock-hygiene gates.

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
| `packages/mcp/src/domain/service-endpoint-*` | new | Discriminated contract and discovered-URL policy |
| `packages/mcp/src/infrastructure/*endpoint-source.ts` | new | Four named source adapters |
| `packages/mcp/tests/service-endpoint-source*` | new | Aspire/source fixture matrix; 6/6 passing |
| `packages/mcp/src/application/service-endpoint-directory.ts` | new | Default composition, precedence, bounds, isolation |
| `packages/mcp/src/infrastructure/fetch-service-endpoint-probe.ts` | new | Spec-first identity probe and P3 mapping |
| `packages/mcp/tests/service-endpoint-directory_test.ts` | new | Complete status/timeout/probe fixture matrix |
| `packages/mcp/deno.json` | updated | Test-only write permission for existing temp-dir tests |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slices 1–2 PASS | 12 focused tests + 78 package tests + scoped check/lint/fmt |
| Fitness | slices 1–2 PASS | package quality scan + `quality:gate` |
| Runtime | PASS | all source/status rows and hanging-row isolation fixture-proven |
| Consumer | pending | public exports/docs planned |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: composed evaluator waiver; true remote baseline; manifest run-id injection clarification.
- Drift: lint/fmt wrappers require the package config because the root workspace glob shape does not
  parse for those Deno subcommands in this worktree; no source/config mutation was made.
- Drift fixed: the package test task lacked the test-only write permission required by existing
  temporary-directory tests; adding it restored the exact locked task to 78/78.
- Debt: preserve existing `MCP-A6-V2-SHAPE`; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
