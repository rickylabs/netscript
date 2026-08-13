# Context Pack: NetScript Database Architecture and Prisma 8 RFC

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`          |
| Branch         | `docs/database-architecture-rfc`                        |
| Current phase  | `rfc-authoring`                                         |
| Archetype      | Docs-only RFC describing future A1/A4/A3/A2/A2/A6 graph |
| Scope overlays | `SCOPE-docs.md`                                         |

## Current State

A clean-break database architecture RFC run is active. Issue #313 is historical evidence; its
compatibility-first solution is superseded. Native Fable 5 medium PLAN-EVAL cycle 2 session
`f3286656-7d0f-4da2-a22d-32897a5e6482` passed commit `383170bbc`. Native Claude Code Opus 5 high
authored an evidence-complete 28,194-word raw draft, pushed as `05e5fbac2`. Opus 5 high
consolidation session `de518f07-68e0-4f77-9cb5-e59dc3e81ebc` resolved root findings R1–R10 and
reduced it to 11,205 words. Root read the entire compact RFC, added three narrow correctness fixes,
and pushed it as `5dfc4e8eb`. Qwen 3.8 Max reviewed that frozen commit without edits and returned
`PASS_WITH_CHANGES`. Grok 4.6 high then reviewed the same byte-identical RFC without edits and
returned `PASS_WITH_REFINEMENTS` with zero blockers. QF-01–QF-05 and GR-01–GR-08 remain open. It is
not finally accepted. After PLAN-EVAL and these reviews, the owner issued `OWNER-DX-01`: D-07/D-08/
D-36 now require L1 preset/recipe → L2 public factories → L3 native Prisma plus NetScript
primitives, with source-native app inference preferred over generated type bindings. This is an
owner override, not a new PLAN-EVAL cycle. Current-main commit `01e096049` remains nonblocking
CI/gate-tooling drift.

## Completed

- Loaded current repository, RFC process, harness, PR, doctrine-navigation, and docs-profile rules.
- Created an isolated worktree/branch from `origin/main` @ `cd7205293`.
- Read GitHub issue #313 and its comments through the connected GitHub surface.
- Selected mandatory PLAN-EVAL and the owner-directed Fable 5 high final refinement override.
- Completed the research corpus, D-01–D-47 lock, prospective JSR audit, and architecture synthesis.
- Preserved cycle 1 `FAIL_PLAN`, corrected the task finding to 42 keys per generated engine
  workspace, and obtained cycle 2 `PASS`.
- Authored and pushed the evidence-complete raw RFC draft.
- Completed root personal source/doctrine/API review and wrote the Opus consolidation contract.
- Completed the Opus 5 high consolidation from 28,194 to 11,205 words and resolved R1–R10.
- Clarified that runtime consumes the manifest rather than `DatabaseDefinition`, kept artifact/value
  authority explicit, and restricted `partial-success` to mixed target outcomes.
- Root read the complete compact RFC and accepted commit `5dfc4e8eb` for focused review after
  targeted fmt, `docs:links`, and diff checks passed.
- Completed the 2,181-word Qwen focused review through requested/observed `qwen/qwen3.8-max`, effort
  `max`, session `3d1277dd-be6a-44af-9e98-4560d8aaf1b7`. It made no edits and returned
  `PASS_WITH_CHANGES` with QF-01 high, QF-02 medium, and QF-03–QF-05 low.
- Qwen passed architecture/type model, Standard Schema boundary, control/recovery, migration/plugin
  safety, and market/upstream claims. Its narrow failures affect TypeScript/API examples and one
  package/dependency example only.
- Completed the Grok whole-RFC review through requested/observed `x-ai/grok-4.6`, variant `high`,
  session `ses_003644aeaffeSm3UCAW9xUqRIK`. It evaluated byte-identical blob `f46040d8...` from RFC
  commit `5dfc4e8eb` at HEAD `be83301c6`, used no subagents, made no edits, and returned
  `PASS_WITH_REFINEMENTS`, zero blockers, and GR-01–GR-08.
- Grok passed axes 2, 3, 4, and 6. Abstraction, public API/DX/types, and economy failed narrowly;
  the architecture stands.
- Completed `research/layered-dx-api-audit.md`: shipped service/Hono uses preset → factory → native
  primitives; SDK and Fresh preserve inferred lower-layer values; pinned Prisma separates runtime
  `contractJson` from its phantom compile-time contract generic. The audit recommends erased
  `typeof definition` for app-owned contracts and automatic atomic launcher-integrated declarations
  only for W3-proven publish/artifact-only boundaries.

## In Progress

- Opus 5 high author/editor dispositions and consolidation, including `OWNER-DX-01` exact API
  selection and type-boundary proof. The RFC remains frozen at 11,205 words and the run remains in
  `rfc-authoring`; no QF/GR finding has been dispositioned yet.

## Next Steps

1. Use Opus 5 high for author/editor disposition of every QF/GR finding, integrate `OWNER-DX-01`,
   choose the exact layered API, and state how W3 proves direct inference versus fallback while
   consolidating to at most 10,000 words. Preserve Qwen's must-not-cut contracts; Grok projects a
   net approximately 1,040–1,200-word cut plus another safe approximately 80 words if needed.
2. Root checks the consolidated result.
3. Run one final Fable 5 high substantive refinement.
4. Run mechanical checks only, then commit/push and update the PR trail.

## Key Decisions

| Decision                       | Source          | Notes                                                                                              |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| No backward compatibility      | Owner directive | Migration safety is required; runtime compatibility shims are not.                                 |
| NetScript owns its DB concepts | Initial plan    | Prisma remains an adapter/engine target, not the framework-facing vocabulary.                      |
| Exact future package graph     | Plan lock       | A1 contract → A4 definition → A3 runtime → A2 control → A2 Prisma PostgreSQL adapter → A6 testkit. |
| Layered database adoption      | Owner override  | L1 preset/recipe uses L2 factories; L3 is native Prisma plus NetScript primitives/ports.           |
| App type flow                  | Owner override  | Erased `typeof definition` first; automatic atomic declaration only at a W3-proven boundary.       |
| Fable 5 high is last           | Owner directive | Final gate includes refinement, not only critique.                                                 |

## Files Changed

| Path                                                      | Status | Notes                                   |
| --------------------------------------------------------- | ------ | --------------------------------------- |
| `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/` | new    | Harness provenance and resumable state. |

## Gates

| Gate family | Current status | Evidence                                              |
| ----------- | -------------- | ----------------------------------------------------- |
| Static      | PASS           | Compact RFC fmt, `docs:links`, diff.                  |
| Fitness     | owner override | Cycle 2 PASS; D-01–D-47 plus post-eval `OWNER-DX-01`. |
| Runtime     | N/A            | Docs-only RFC run.                                    |
| Consumer    | changes open   | Qwen/Grok reviews complete; Opus dispositions next.   |

## Open Questions

- No must-resolve-now architecture decision remains; pre-implementation decisions stay assigned to
  their W1/W3/W4/W5/W7/W10 gates. W3 now includes direct-erasure and automatic-fallback proof.
- QF-01–QF-05 are review findings, not reopened architecture decisions; they await author/editor
  disposition together with GR-01–GR-08.
- Exact L1/L2 API spelling is an Opus author/editor task under the owner override; it may not add a
  mirrored Prisma schema/query DSL or change the six-package graph.

## Drift and Debt

- Drift: #313 compatibility-first architecture is superseded; final-gate effort is owner-overridden.
- Debt: pending targeted ledger scan.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
