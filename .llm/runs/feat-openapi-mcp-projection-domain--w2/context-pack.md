# Context Pack: OMB S4 OpenAPI projection domain

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-projection-domain--w2` |
| Branch | `feat/openapi-mcp-projection-domain` |
| Current phase | `plan` → `implement` under milestone waiver |
| Archetype | `2 — Integration` (pure domain slice) |
| Scope overlays | none |

## Current State

The branch began as a clean exact child of current `origin/main`. Live issue/RFC and the complete P2
no-DB proof/evidence have been consumed. The plan and Design checkpoint are locked. Formal local
PLAN-EVAL is intentionally composed/waived by the milestone-run rule. Slice 1 is implemented and
focused-green in the milestone orchestrator's already-owned single Codex sender.

## Completed

- Required skills and harness/doctrine/evaluator workflow read.
- Live issue `#1130` and merged RFC `#1123` read.
- P2 verdict, structured evidence, and raw no-DB spec read.
- Current `@netscript/mcp` surface inspected with `deno doc`.
- Baseline doc-lint and package publish dry-run passed.
- JSR baseline warnings recorded without changing debt.

## In Progress

- Supervisor Slice 1 sign-off, commit, explicit-refspec push, and PR evidence comment.

## Next Steps

1. Sign off and push Slice 1.
2. Implement/review Slices 2–4 at stopped checkpoints.
3. Run the full Slice 5 merge-readiness gates and composed independent evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| New `./openapi-projection` subpath | plan D1 / doctrine 02 | Default MCP surface remains unchanged. |
| Exact identity only | RFC S-2 / plan D3 | Fuzzy matching is suggestions-only. |
| Errors derive from declared responses | P2 / plan D6 | Empty non-2xx set is exactly `{}`. |
| Command domain regroup | F-16 baseline / Hidden Scope | Preserves API while avoiding cardinality deepening. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-projection-domain--w2/*` | new | Harness research, locked plan, design, waiver, and handoff. |
| `packages/mcp/src/domain/command/*` | moved | Existing command contracts/policy regrouped to preserve direct-child cardinality. |
| `packages/mcp/src/domain/openapi/operation-index.ts` | new | Pure deterministic structural operation index. |
| `packages/mcp/openapi-projection.ts` | new | Curated public projection subpath. |
| `packages/mcp/tests/operation-index_test.ts` | new | Public-consumer index contract tests. |
| `packages/mcp/{deno.json,README.md}` | modified | Export/check surface and domain-subpath documentation. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | composed/authorized | `plan-eval.md`, user milestone directive |
| Static | baseline green | doc-lint + package publish dry-run |
| Fitness | baseline recorded | structured JSR audit |
| Runtime | N/A | pure domain scope |
| Consumer | Slice 1 green | public entrypoint import test + scoped check |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: authorized PLAN-EVAL composition only.
- Debt: `MCP-A6-V2-SHAPE` remains untouched; baseline cardinality is addressed without a new entry.

## Commits

- See the draft PR's commit list + per-slice PR comments.
