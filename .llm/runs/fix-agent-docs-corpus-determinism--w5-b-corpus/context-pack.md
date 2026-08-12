# Context Pack: deterministic agent-docs corpus freshness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-docs-corpus-determinism--w5-b-corpus` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Current phase | `implement — supervisor review pending` |
| Archetype | N/A |
| Scope overlays | docs |

## Current State

The implementation slice is complete and left uncommitted for supervisor review. PLAN-EVAL is N/A
because the owner supplied a complete mechanical defect contract. Final root gates and IMPL-EVAL
remain pending.

## Completed

- Loaded requested harness/tooling/release/PR/RTK skills and required workflow references.
- Verified clean worktree, branch, baseline, and origin.
- Re-derived the compressed-byte coupling and affected consumer/release surfaces.
- Captured a named pre-fix assertion failure proving unchanged canonical content rewrote valid gzip
  transport bytes.
- Implemented canonical uncompressed identity, semantic non-mutating check mode, unchanged gzip
  preservation, and aligned CLI/release/publish consumers.
- Regenerated the owned corpus and CLI barrel through official tasks.
- Passed 36 focused tests, scoped check/lint/fmt, publish-asset check, and two consecutive semantic
  freshness runs with stable asset hashes.

## In Progress

- Tier-A supervisor review, explicit-path commit, and required full gates.

## Next Steps

1. Substantively review the uncommitted slice and `slices/w5-b-corpus/evidence.md`.
2. Run the required root `check`, `test`, `lint`, and `fmt:check` gates; rerun git-diff-based
   generated-asset gates after committing the intended generated migration.
3. Verify raw status/lock hygiene, explicitly stage owned paths, commit/push, and proceed to the
   normal automatic IMPL-EVAL handoff.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Canonical uncompressed SHA defines freshness. | owner brief / plan D1 | Transport bytes do not define corpus identity. |
| Preserve existing valid gzip for unchanged content. | owner release constraint / plan D2 | Keeps coordinated cut regeneration stable. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agent-docs-corpus-determinism--w5-b-corpus/*` | new | Harness activation artifacts. |
| `.llm/tools/docs/build-agent-docs-bundle.ts` + test | modified | Semantic check and stable transport behavior. |
| `.llm/tools/generate-{cli-assets-barrel,publish-assets}.ts` + tests | modified | Canonical-content provenance semantics. |
| `.llm/tools/release/github-release.ts` + test | modified | Coordinated-cut provenance derives content hash. |
| `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts` | modified | Runtime verifies decompressed canonical bytes. |
| `.llm/assets/agent-docs/provenance.json` | generated | SHA migrated; gzip itself unchanged. |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | generated | Embedded semantic SHA migrated. |
| `deno.json` | modified | Freshness task delegates to semantic non-mutating check. |
| `slices/w5-b-corpus/evidence.md` | new | Focused implementation evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | focused pass; full pending | scoped check/lint/fmt green; root gates for supervisor |
| Fitness | N/A | tooling-only slice |
| Runtime | focused pass | CLI runtime integrity tests green |
| Consumer | focused pass | semantic variance/staleness and release helper tests green |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
