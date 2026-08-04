# Context Pack: MCP generated export-surface corpus

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-mcp-export-surface-corpus--1201` |
| Branch | `feat/mcp-export-surface-corpus` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Live issue truth and current main are re-baselined. The baseline MCP has no export-surface path;
the mirror-free RED is recorded. The contract-first plan is locked under the milestone evaluator
waiver. No product source has been changed yet.

## Completed

- Read required harness/PR/doctrine/Deno/JSR/tooling skills and relevant authority files.
- Read live issue #1201 and owner comment; routed the canary measurement out of local closure.
- Inspected `@netscript/mcp` with normal and JSON `deno doc` before source reads.
- Counted 35 publishable packages / 268 subpaths; identified `definePage` in `./builders`.
- Demonstrated baseline empty-workspace RED.
- Ran baseline doc lint, package publish dry-run, and JSR audit.
- Wrote Design, plan, waiver, worklog, context, and drift artifacts.

## In Progress

- Slice 0 bootstrap commit / draft PR opening, then contract-first implementation.

## Next Steps

1. Commit/push slice 0 with explicit refspec and open the draft PR with `Refs #1201`.
2. Implement port, query engine, four tool contracts/flows, generator, and real doc fixtures.
3. Generate/pin corpus, wire receipts, prove mirror-free GREEN, and run the full gate set.
4. Hand off to milestone evaluation composition; do not claim the adoption box.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| New corpus type | owner frame / plan D2 | Never extends prose ranking |
| Four tools | issue / plan D1 | Priority order preserved |
| Embedded deterministic payload | JSR + plan D3/D4 | No runtime filesystem dependency |
| `Refs #1201` | live owner comment | Orchestrator hand-closes after measurement |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-mcp-export-surface-corpus--1201/*` | new | Harness bootstrap/plan artifacts |
| `deno.lock` | pre-existing, unowned | Never stage or change |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | doc lint + package dry-run |
| Fitness | planned | full Archetype-2 column selected |
| Runtime | RED demonstrated | empty workspace returns `tool_not_found` |
| Consumer | pending | slice 2 |

## Open Questions

- None that block implementation. Canary adoption is explicitly deferred/orchestrator-owned.

## Drift and Debt

- Drift: 35-vs-36 current count; pre-existing lockfile; evaluator composition waiver.
- Debt: existing `MCP-A6-V2-SHAPE` remains unchanged; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments after slice 0 is pushed.
