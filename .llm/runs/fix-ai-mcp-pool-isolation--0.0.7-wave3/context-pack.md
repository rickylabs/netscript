# Context Pack: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Current phase | `plan` — amended contract re-locked; RED test next |
| Archetype | `2 — Integration` (coordinator-frozen leaf profile) |
| Scope overlays | `none` |

## Current State

The defect is reproduced red-first at immutable base `284dda90a`. Pool startup is sequential and
neither the pool nor the default TanStack connector settles when aborted during a never-ending
connect. No source has been changed. The live acceptance criteria require test, docs, port, and
lifecycle files outside the frozen writable surface, so the run stopped for a coordinator
amendment. The committed ruling now authorizes exactly eight package files and resolves the public
snapshot and cancellation decisions; prior evidence remains immutable.

## Completed

- Read all requested skills and harness/doctrine authorities.
- Read live issue #1448.
- Verified branch, worktree, immutable base, and absent remote leaf branch.
- Reproduced pool failure isolation and cancellation defects.
- Scanned the current `./mcp` JSR/public surface and upstream TanStack API.
- Recorded `PLAN-EVAL: BLOCKED / not launched`.
- Read the committed scope ruling and re-locked the plan against its exact eight-file surface.
- Recorded `PLAN-EVAL: N/A` after amendment because the remaining work is fully specified and
  mechanical.

## In Progress

- Preparing the committed healthy + never-settling RED regression before implementation.

## Next Steps

1. Commit and push the focused RED regression with its raw nonzero exit code.
2. Implement the pool/snapshot, cancellation, registration, and docs slices separately.
3. Run all structured, architecture, quality, JSR, doc-lint, and publish-dry-run gates.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stop rather than land a partial fix | user frozen contract | Test/docs/resource-read/close acceptance cannot fit. |
| No `Closes #1448` | netscript-pr + live acceptance | Bootstrap PR does not resolve the issue. |
| Synchronous snapshot; options-bag cancellation | committed scope ruling | Public and lifecycle decisions are coordinator-locked. |
| `PLAN-EVAL: N/A` | amended complete contract | No decision-heavy question remains; evaluator separation is preserved for IMPL-EVAL. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-ai-mcp-pool-isolation--0.0.7-wave3/*` | new | Bootstrap, research, plan, drift, and handoff artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | RED reproduced; implementation gates NOT_RUN | `research.md`, `worklog.md` |
| Fitness | NOT_RUN | stopped before source changes |
| Runtime | prohibited/no lease | no Aspire/Docker/E2E ran |
| Consumer | NOT_RUN | public contract unresolved |

## Open Questions

- None. A newly required file or public decision is drift and a stop boundary.

## Drift and Debt

- Drift: significant frozen-surface mismatch recorded in `drift.md`.
- Debt: none created; no implementation landed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
