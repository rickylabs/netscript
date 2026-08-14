# Context Pack: NetScript Database Architecture and Prisma 8 RFC

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`          |
| Branch         | `docs/database-architecture-rfc`                        |
| Current phase  | `closed — final gate passed`                            |
| Archetype      | Docs-only RFC describing future A1/A4/A3/A2/A2/A6 graph |
| Scope overlays | `SCOPE-docs.md`                                         |

## Current State

The clean-break database architecture RFC has passed its absolute-final substantive gate. Issue #313
remains historical evidence; its compatibility-first solution is superseded. PLAN-EVAL cycle 2
passed, Opus authored and consolidated the draft, Qwen and Grok reviewed it, root closed the
remaining semantic findings at `d28d8e779`, and the owner-reinstated one-shot fresh native Fable 5
high evaluator/refiner ran on 2026-08-15 from starting commit `a7a6887c2`. It returned **`PASS`** in
`evaluate.md` after re-verifying the pinned RC1 claims and applying one narrow example refinement
(Step 1 `pgvector()` — upstream-false extension-level `dimensions` removed). The earlier
cancellation is preserved as provenance; it was superseded for exactly this gate and all other
Claude use stays frozen. Draft PR #1640 awaits owner review and stays draft.

## Completed

- Loaded current repository, RFC process, harness, PR, doctrine-navigation, and docs-profile rules.
- Created an isolated worktree/branch from `origin/main` @ `cd7205293`.
- Read GitHub issue #313 and its comments through the connected GitHub surface.
- Selected and completed mandatory PLAN-EVAL; the later planned Fable refinement was superseded by
  the owner's Claude freeze before it ran.
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
- Completed author/editor dispositions and pushed `ad8effff9`.
- Root replaced the impossible extension and binding flows with one configured provider value and a
  compiler-emitted, canonical-space/snapshot-bound target descriptor; split emission from runtime
  module loading; unified `emit` authority; corrected branded IDs, examples, validation selection,
  plugin aggregate transport, and durable retained rollback semantics.
- TypeScript/API, prospective JSR, and architecture closure lanes all returned `PASS`; root ran
  targeted formatting, internal-link, whitespace, and fence checks and pushed `d28d8e779`. The
  consolidated receipt is `reviews/root-semantic-closure.md`.

- The final Fable 5 high gate ran 2026-08-15: starting commit `a7a6887c2`, verdict **`PASS`**, one
  narrow refinement, docs gates green post-edit; recorded in `evaluate.md` and committed/pushed with
  a PR #1640 comment.

## In Progress

- Nothing. The run is closed pending owner review of draft PR #1640.

## Next Steps

1. Owner reviews draft PR #1640 and decides on RFC acceptance (W0). The PR stays draft; no merge or
   ready transition is authorized from this run.

## Key Decisions

| Decision                       | Source          | Notes                                                                                              |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| No backward compatibility      | Owner directive | Migration safety is required; runtime compatibility shims are not.                                 |
| NetScript owns its DB concepts | Initial plan    | Prisma remains an adapter/engine target, not the framework-facing vocabulary.                      |
| Exact future package graph     | Plan lock       | A1 contract → A4 definition → A3 runtime → A2 control → A2 Prisma PostgreSQL adapter → A6 testkit. |
| Layered database adoption      | Owner override  | L1 preset/recipe uses L2 factories; L3 is native Prisma plus NetScript primitives/ports.           |
| App type flow                  | Owner override  | Erased `typeof definition` first; automatic atomic declaration only at a W3-proven boundary.       |
| Single final Fable gate        | Owner directive | Reinstates one fresh Fable 5 high evaluator/refiner; all other Claude usage remains frozen.        |
| Content, not a word target     | Owner directive | Consolidation serves clarity; length is not an acceptance metric.                                  |

## Files Changed

| Path                                                      | Status | Notes                                   |
| --------------------------------------------------------- | ------ | --------------------------------------- |
| `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/` | new    | Harness provenance and resumable state. |
| `rfcs/0000-database-architecture.md`                      | new    | Canonical RFC; semantic closure pushed. |

## Gates

| Gate family | Current status | Evidence                                                                |
| ----------- | -------------- | ----------------------------------------------------------------------- |
| Static      | PASS           | RFC format, `docs:links`, diff, balanced fences at semantic checkpoint. |
| Fitness     | PASS           | D-01–D-47, OWNER-DX-01, and three final closure audits.                 |
| Runtime     | N/A            | Docs-only RFC; future matrices are explicit implementation gates.       |
| Consumer    | PASS           | TypeScript/API, JSR, and architecture closure all passed `d28d8e779`.   |
| Evaluator   | PASS           | `evaluate.md` — final Fable 5 high gate, 2026-08-15, one refinement.    |

## Open Questions

- No must-resolve-now architecture decision remains; pre-implementation decisions stay assigned to
  their W1/W3/W4/W5/W7/W10 gates. W3 now includes direct-erasure and automatic-fallback proof.
- No review blocker/high remains. RFC implementation-time questions stay assigned to their
  W1/W3/W4/W5/W7/W10 gates and do not reopen the architecture.

## Drift and Debt

- Drift: #313 compatibility-first architecture is superseded; the numeric length target remains
  removed; the earlier final-Fable cancellation is historical and is superseded only for this one
  scheduled gate.
- Debt: pending targeted ledger scan.

## Commits

- Semantic review closure: `d28d8e779` (pushed).
- Final Fable gate + refinement: committed and pushed 2026-08-15 from starting commit `a7a6887c2`.
- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
