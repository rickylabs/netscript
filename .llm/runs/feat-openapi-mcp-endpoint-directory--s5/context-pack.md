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

Research and design are locked at clean `origin/main` `2c8865e8c`. Slice 1 now implements the
contract-first endpoint vocabulary and all four source adapters. The focused source matrix is green
for every required carrier/failure branch. P1 precedence and P3 exact failure guidance remain
binding for slice 2.

## Completed

- Read issue #1131, RFC #1123, epic context, P1/P3 verdicts, canonical discovery design, required
  harness/doctrine/Aspire/JSR/PR/tooling authorities, and package consumers.
- Confirmed baseline doc lint and publish dry-run clean, no lock churn.
- Recorded Design checkpoint and the milestone-run PLAN-EVAL composed waiver.
- Implemented discriminated source/directory/probe contracts and the named source precedence.
- Implemented override, Aspire CLI, run-manifest, and appsettings sources with injected IO seams.
- Proved 6/6 source fixtures, scoped check/lint/fmt, package-specific quality scan, and
  `quality:gate` with no unsafe casts, lint ignores, or lock churn.

## In Progress

- Slice 2 composition and bounded probe implementation. The provided PR worktree remains owned by
  the Desktop supervisor session; this attached thread remains the sole staging sender.

## Next Steps

1. Compose the four outcomes under the locked precedence with visible conflicts/exclusions.
2. Implement the redirect-free, credential-free, bounded spec and identity probe.
3. Prove every status plus the hanging-row isolation case, then proceed to public exports/docs.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slice 1 PASS | focused test + scoped check/lint/fmt |
| Fitness | slice 1 PASS | package quality scan + `quality:gate` |
| Runtime | source matrix PASS; probe pending | 6/6 source fixtures |
| Consumer | pending | public exports/docs planned |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: composed evaluator waiver; true remote baseline; manifest run-id injection clarification.
- Drift: lint/fmt wrappers require the package config because the root workspace glob shape does not
  parse for those Deno subcommands in this worktree; no source/config mutation was made.
- Debt: preserve existing `MCP-A6-V2-SHAPE`; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
