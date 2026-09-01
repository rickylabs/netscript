# Evaluation: NetScript Database Architecture RFC — final Fable 5 high gate

Final owner-authorized evaluation **plus refinement** gate. This session is the one-shot fresh
native Fable 5 high launch reinstated by the owner on 2026-08-14 (unit
`netscript-db-rfc-final-fable-20260815`); it supersedes the earlier Claude/Fable freeze for exactly
this gate. The evaluator read the complete RFC at the starting commit, the governing run artifacts,
the three review receipts, and the three research audits, and independently re-verified the
load-bearing pinned-source claims against the local RC1 checkout.

## Metadata

| Field           | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Run ID          | `docs-database-architecture-rfc--prisma-8-rfc`                               |
| Target          | `rfcs/0000-database-architecture.md` (canonical RFC), draft PR #1640         |
| Archetype       | N/A — docs-only RFC describing the future A1/A4/A3/A2/A2/A6 graph            |
| Scope overlays  | `SCOPE-docs.md`                                                              |
| Evaluator       | Native Claude Code · `claude-fable-5` · high · fresh session · 2026-08-15    |
| Starting commit | `a7a6887c228f2a908f8a5998129678c1f307e034` = remote tip (verified via fetch) |
| Route authority | Owner directive 2026-08-14; recorded in `drift.md` and `supervisor.md`       |

Constraints honored: no subagents, no workflows, no session resume, no fallback model. The evaluated
content is the checked-out worktree at the starting commit, not a remembered draft.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                     |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` (Fable 5 medium, session `f3286656…`, commit `383170bbc`); cycle 1 `FAIL_PLAN` preserved       |
| Design section exists in worklog       | PASS   | `worklog.md` § Design — locked, evaluator-approved, `OWNER-DX-01` recorded as an explicit post-eval owner override           |
| Commit slices match design plan        | PASS   | Slices 0–7 in `plan.md`/`worklog.md` match the branch history through `d28d8e779`/`a7a6887c2`; this gate is the terminal one |
| Each slice has a passing gate          | PASS   | `worklog.md` § Gate Results: bootstrap, compact-RFC, semantic-RFC, and final-schedule static gates all PASS with commands    |
| Review chain honored                   | PASS   | Root review → Qwen `PASS_WITH_CHANGES` → Grok `PASS_WITH_REFINEMENTS` (0 blockers) → dispositions → root semantic closure    |
| Owner supersession provenance          | PASS   | `drift.md` 2026-08-14 entry preserves the cancellation and records this one reinstated gate                                  |

## Substantive Evaluation Against the Eight Focus Criteria

1. **Layered DX as one progressive surface — PASS.** Step 2 shows L1 `defineSingleTargetDatabase`
   literally calling the L2 `defineDatabase*` factories and returning the same `DatabaseDefinition`;
   L3 is native Prisma plus kernel primitives with the emission/runtime module graphs honestly
   split. "The normal loop has no manual type generation" commits `dev/start/test/build` to
   content-hash compile, watch, verify, and atomic swap, with `db emit --verify` in CI and `db emit`
   demoted to an escape hatch. A one-database app pays: one 3-line provider module, one native
   contract, one L1 call — no enterprise ceremony before benefit.
2. **Prisma authority, no mirrored vocabulary — PASS.** Step 1 authors through the pinned RC1
   `defineContract(scaffold, callback)`; every helper spelling in the example was re-verified this
   session against `examples/prisma-8-demo/prisma/contract.ts` in the pinned checkout
   (`field.id.uuidv4String()`, `field.temporal.createdAt()`, `type.pgvector.Vector(1536)`,
   `field.namedType(…).optional()`, `rel.hasMany/belongsTo` coordinates — all exact). No NetScript
   schema/query DSL, no re-export, no copied overloads anywhere in the surface.
3. **Contract-first end-to-end type safety — PASS.** Erased `typeof definition` inference is the
   default for app-authored spaces (backed by the phantom `_contract?: TContract` and no-emit
   evidence, re-verified: `TypeMapsPhantomKey` at `2-sql/1-core/contract/src/types.ts:207`);
   generated declarations are bounded to pinned artifact-only spaces and publishable exports, both
   W3-proved; `FieldValueOf` keeps branded values (`Char<36>` UUID) honest at the boundary. The four
   inference rules each name a conformance fixture; the one soundness seam at `runtime.bind` is
   named, mitigated, and gated.
4. **One plugin contribution value fanning out — PASS.** `definePluginSpace` (Step 5) is one
   callable descriptor carrying id/owner/version/capabilities/grants/policy plus a statically
   imported aggregate; one `PostgresExtension` bundle registered once on the configured provider
   (Step 6) fans authoring/control/runtime/validation, with `db.compose.extension.facet-mismatch`
   refusing skew. Providers are composition-root values; no service locator or global registry.
5. **Validation derived where provable, fail-closed elsewhere — PASS.** Three schema classes with
   distinct guarantees; operation grammar comes only from contributed packs (`ormCollection@1`)
   whose identity/version enter manifest and cache key; `DB_VALIDATION_UNSUPPORTED` at construction
   with coordinates; invalid values return Standard Schema issues, never throw; representations are
   exactly `runtime`/`json` with driver wire internal — matching the runtime-validation source audit
   §3/§4/§7 precisely (the earlier QF-05 conflation is fixed in the current text).
6. **Manifest → plan → receipt authority chain — PASS.** The six-value authority table is disjoint;
   `DatabaseDefinition` is consumed only by `compileDatabase`; there is no `control.emit`; the apply
   state machine, lock scope `(target, physical database)` with fencing, inspect-before-resume, and
   the total two-level rollup function (mixed spaces never make a target "partially successful"; a
   run with no succeeded target is never `partial-success`) are all explicit. Retained detach is a
   receipt-backed, verify-only tombstone under the provider lock. PostgreSQL-first scope is honest:
   SQLite/MongoDB/MySQL/MSSQL refuse with `db.target.unsupported`, and the namespace capability is
   withheld on re-verified upstream evidence (`contract-types.ts:644+` flattening comment confirmed
   in the pinned checkout).
7. **Clean break with adoption safety — PASS.** The no-compatibility law enumerates every banned
   survival; `db adopt` is a seven-step marker-metadata-only protocol (zero application-schema DDL,
   zero application-data DML) with per-target statuses, rehearsal/backup/preflight requirements, and
   forward-only recovery after first apply; parallel branches without co-composition.
8. **Examples internally complete and RC1-faithful — PASS after one narrow repair.** The emitted
   binding is now a real value module; `manifest`/`postgres`/`connections`/`runId`/`policy` are
   bound or explicitly named across Steps 3 and 7; the configured-provider value is used
   consistently at every call site. One residual defect found and fixed this session (below). The
   138-export claim was independently re-counted this session: `python3` over the pinned
   `packages/9-public/@prisma/orm-postgres/package.json` returns exactly 138 export keys at
   `a76a6c5` (`v8.0.0-rc.1`).

### Prior-review disposition spot-audit

QF-01/GR-01 (declare-only binding), QF-02/GR-02 (bundle authorship vs import law), GR-03 (per-space
evidence, no merged contract), GR-04 (emit authority), GR-05 (retained tombstone), GR-06 (rollup
totality), GR-07 (factory vs configured value), QF-04 (Prisma path attribution), and QF-05
(paramsSchema vs conversion channels) were each re-checked in the current text and are genuinely
closed, consistent with `reviews/root-semantic-closure.md`.

## Refinements Applied by This Gate

| # | Location                      | Defect                                                                                                                                                                                                                                                                                                                                                              | Repair                                                                                              |
| - | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1 | Step 1 `database/provider.ts` | `pgvector({ dimensions: 1536 })` invented extension-level dimension configuration. pgvector has no such parameter — dimension is a per-column type modifier — and the pinned demo registers the pack with no configuration (`extensions: { pgvector }`). The duplicated `1536` invited implementing a conflicting config axis against `type.pgvector.Vector(1536)`. | `const vector = pgvector();` — dimensions now appear only in the per-column type call, as upstream. |
| 2 | Step 6 declaration            | `pgvector(options: PgVectorOptions)` required an argument the corrected Step 1 call no longer passes.                                                                                                                                                                                                                                                               | `options?: PgVectorOptions` — declaration and flagship call site agree.                             |

Affected end-to-end flow (Step 1 provider creation → Step 2 targets → Step 6 registration →
validation codec `pgvector.vector@1`) was reread after the edit; no cross-section contradiction was
introduced, and no prose anywhere referenced extension-level dimensions. No other correction was
warranted: no factual contradiction, incomplete value/type flow, or missing DX commitment survived
the full read. The package graph, compatibility posture, native-Prisma authority, and fail-closed
validation boundary were not reopened; D-01–D-47 and `OWNER-DX-01` are untouched.

## Static Gates (docs-only mechanical set, run this session)

| Gate            | Command or check                                      | Result | Evidence                                                       |
| --------------- | ----------------------------------------------------- | ------ | -------------------------------------------------------------- |
| Format          | `deno fmt --check rfcs/0000-database-architecture.md` | PASS   | "Checked 1 file", post-refinement                              |
| Link/path check | `deno task docs:links`                                | PASS   | 103 docs, 0 broken links, 0 broken anchors, 0 enforced orphans |
| Diff hygiene    | `git diff --check`                                    | PASS   | No whitespace errors                                           |
| Fence balance   | count of `` ``` `` lines                              | PASS   | 40 fences, balanced                                            |
| Run artifacts   | `deno fmt --check` over mutated run Markdown          | PASS   | Recorded at commit time                                        |
| Clean close     | `git status` clean; local HEAD equals pushed remote   | PASS   | Recorded at commit time                                        |

Package/runtime E2E, publish dry-run, doc-lint, and F-1…F-19 fitness functions are **N/A** for this
docs-only RFC gate; they are named as future implementation gates in the RFC and `plan.md`, and the
RFC claims none of them have run.

## Runtime Gates

| Gate             | Validation          | Result | Evidence                                                        |
| ---------------- | ------------------- | ------ | --------------------------------------------------------------- |
| Runtime behavior | Docs-only Plan-Gate | N/A    | Future A3/provider/control matrices remain explicit in the plan |

## Consumer Gates

| Consumer               | Validation                                          | Result | Evidence                                                          |
| ---------------------- | --------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| RFC reader/implementer | Can build the system without inventing architecture | PASS   | Eight-criteria evaluation above; every API/state machine is named |
| Pinned-source claims   | Independent re-verification                         | PASS   | 138 exports, phantom type maps, namespace flattening, demo shapes |

## Anti-Pattern Check

Docs-only scope: the RFC prescribes rejection of the applicable patterns rather than shipping code.
AP-3 (god ports — capped at 3–4 methods), AP-14 (re-export — banned with the 138-export evidence),
AP-24 (engine switch — the motivating counter-example), and AP-25 (side effects outside edges —
pure/offline split) are addressed in the text; all 25 are `N/A` as code checks for this changeset.

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                        |
| --------------------- | ----- | ------------------------------------------------------------------------------- |
| New entries           | 0     | Docs-only; no doctrine violation introduced                                     |
| Resolved entries      | 0     | `DB-GENERATE-ASPIRE-COUPLING` closure is _designed_ (structural), not yet coded |
| Deepened violations   | 0     | —                                                                               |
| Unrecorded violations | 0     | —                                                                               |

## Findings

| Severity | Finding                                                                 | Evidence                                                          | Required action                |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| low      | Step 1 pgvector example implied extension-level dimension configuration | Pinned demo `extensions: { pgvector }`; per-column `Vector(1536)` | Fixed this session (see above) |

No high or medium finding. No `FAIL_RESCOPE` trigger: the package graph, clean-break posture,
native-Prisma authority, and fail-closed boundary are sound as written.

## Lessons for Promotion

| Lesson                                                     | Pattern                                                                                  | Applies to | Confidence |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- | ---------- |
| Flagship examples must not invent upstream config surfaces | Every option shown on a wrapper of a pinned upstream must exist upstream or be specified | docs runs  | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | **PASS**                                                                                                                                                                                                                                                                                                                                  |
| Rationale | The RFC is implementation-grade against all eight owner criteria: an implementer can build the layered surface, type flow, plugin fan-out, bounded validation, and control chain without inventing architecture. The single defect found was example-level, repaired within refinement authority, and all resulting docs gates are green. |
