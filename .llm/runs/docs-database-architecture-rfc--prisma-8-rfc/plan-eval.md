# PLAN-EVAL — docs-database-architecture-rfc--prisma-8-rfc

- Plan evaluator session: native Claude Code, observed model `claude-fable-5`, effort `medium`,
  session `dd3cfbee-1a53-4dfd-84a3-e78e38ef5b22`, 2026-08-13 (UTC)
- Route: matches the required lane (`formal_plan_evaluation` — Anthropic · Fable 5 · medium); fresh
  session, separate from the Codex supervisor, Opus research lane, Qwen review, and all delegated
  research/synthesis agents
- Run: `docs-database-architecture-rfc--prisma-8-rfc`
- Worktree: `/home/codex/repos/netscript-db-rfc`
- Branch / evaluated commit: `docs/database-architecture-rfc` @ `3cbcfcec8`
  (`docs(rfc): lock database architecture plan`)
- Surface / archetype: docs-only RFC plan under `SCOPE-docs.md`, describing future A1/A2/A3/A4/A5/A6
  surfaces
- Scope overlays: `SCOPE-docs.md`; future packages evaluated against
  `gates/archetype-gate-matrix.md`
- Canonical RFC file `rfcs/0000-database-architecture.md`: **absent — correct** (verified by listing
  `rfcs/`; only `0000-template.md`, `0001`–`0005`, `README.md` exist)

## Rebaseline verification

- `research.md` lines 4–9 explicitly rebaseline to
  `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`, date 2026-08-13, with Prisma pins RC1
  `a76a6c5` and post-RC object `71e2e0d9…`. Verified: `cd720529` is an ancestor of HEAD and of
  `origin/main`; the pinned Prisma checkout at `.llm/tmp/prisma-v8-rc1` resolves HEAD
  `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5` and `git cat-file -t 71e2e0d9…` returns `commit`.
- Note (non-blocking): `origin/main` has since advanced by exactly one commit,
  `01e096049 ci: adopt structured check reports (#1639)`. The delta touches CI/check-report tooling
  only (no `packages/database`, no scaffold DB templates, no doctrine). The plan already commits to
  "a fresh pin check during RFC drafting" (plan.md § Dependencies and Drift Watch), which covers
  this.

## Spot-checks of load-bearing findings

1. **Current NetScript facts.**
   - `resolveTarget` ignores `PrimaryDatabase` and only defaults with exactly one enabled target —
     **confirmed** at `packages/cli/src/kernel/adapters/database/workspace-resolver.ts:66-86`.
   - AP-17 `interfaces/` rename debt for `packages/database` is stale — **confirmed**:
     `packages/database/ports/` exists (no `interfaces/`) while the debt entry at
     `.llm/harness/debt/arch-debt.md:316-324` remains open and still says "`interfaces/` should
     become `ports/`". The composition-root half of the entry remains live, as the plan states.
   - `DB-GENERATE-ASPIRE-COUPLING` is open — **confirmed** at
     `.llm/harness/debt/arch-debt.md:1954-1990` (status: open; `DbOperationRunner.executeDetached`
     always boots Aspire).
   - Root catalog uses caret `^7.8.0` while generated templates use `^7.4.2` — **confirmed**
     (`deno.json:231-235`; `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts`
     lines 36, 59, 122-124).
   - **"the generated workspace has exactly 30 `db:*` tasks" — REFUTED.** I executed
     `generateDatabaseDenoJson` from
     `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts` at the evaluated head for
     all four providers (`postgresProvider`, `sqliteProvider`, `mysqlProvider`, `mssqlProvider`):
     every engine emits **42** `db:*` task keys, not 30. The Qwen "correction"
     (`research/qwen-prisma-risk-review.md:64`, F3: "Exactly 30 unique `db:*` tasks") undercounts by
     omitting the twelve computed per-engine keys (`db:<op>:${provider.engine}`); its own inclusion
     list (14 base ops + 12 `:all` variants + `format`/`zod`/`patch-client`/`fix-zod`) sums to 30
     only without them. The original current-state claim "more than twenty database tasks"
     (`research/netscript-current-state.md:174`) was accurate. The false count was adopted as a
     rebaselined load-bearing finding in `research.md:34` (finding 2), restated as **[FACT]** in
     `research/architecture-plan-synthesis.md:70` and repeated at
     `architecture-plan-synthesis.md:681`, and copied into the plan itself at plan.md § Clean
     Cutover ("deletes the old engine workspaces, 30 tasks, …"). See Required fixes.
2. **Pinned Prisma RC/current-source facts.**
   - Model-first authoring (D-06/D-36): **confirmed** —
     `.llm/tmp/prisma-v8-rc1/packages/3-extensions/postgres/src/contract/define-contract.ts:91-105`
     is `defineContract(scaffold, (helpers: ComposedAuthoringHelpers<…>) => { types/models/enums })`
     with `const` generics preserving literal return types; no fluent target/table/column chain.
   - Namespace type-map flattening (D-37): **confirmed** —
     `.llm/tmp/prisma-v8-rc1/packages/2-sql/2-authoring/contract-ts/src/contract-types.ts:644-690`:
     comments state "the authoring path lumps every model under the default storage namespace";
     non-default namespaces receive `entries.table: Record<never, never>` (empty). The audit's cited
     line ranges (`typescript-schema-orpc-audit.md:629-645`) match. Withholding the `multiNamespace`
     capability claim is well-founded.
   - `@prisma/orm-postgres` 138 top-level export keys: pinned to the run's own audit
     (`research/prisma-8-deep-dive.md:98`), correcting Qwen's ~275; direction and provenance
     consistent.
3. **Doctrine / JSR / package-boundary facts.**
   - `isolatedDeclarations: true` — **confirmed** at root `deno.json:174`.
   - Slow-type exception is sanctioned only for oRPC-bound packages — **confirmed** at
     `docs/architecture/doctrine/02-public-surface.md:217-239`; the plan/JSR audit's rule that no
     database package inherits it is consistent.
   - Doctrine codifies plain `*.prisma` plugin fragments and does not register the proposed packages
     — **confirmed**: `docs/architecture/doctrine/06-archetypes.md:209`; zero hits for
     `database-contract|database-runtime|database-control` in `06-archetypes.md` and
     `10-codebase-verdict-and-handoff.md`. The plan's W0 doctrine-amendment obligation is correct.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | **FAIL** | `research.md` exists, is explicitly rebaselined to `cd720529` with pinned Prisma sources, and #313 is rebaselined as historical evidence only — but load-bearing finding 2 (`research.md:34`, "exactly 30 `db:*` tasks") is false at the pinned baseline (actual: 42 per engine, generator executed), and it was copied unverified from the Qwen independent report into research.md, the synthesis ([FACT] at `architecture-plan-synthesis.md:70`), and plan.md § Clean Cutover — violating the plan's own gate "corrected claims are not copied from independent reports" (plan.md § Plan and research gates). |
| Decisions locked                        | PASS     | plan.md § Locked Decision Ledger D-01–D-47 with rationale columns; expanded rationale in `architecture-plan-synthesis.md` §13.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Open-decision sweep                     | PASS     | plan.md § Open-Decision Sweep (must-resolve-now: none; per-wave items W1/W3/W4/W5/W7/W10; safe-to-defer list). My independent sweep (below) found no unflagged rework-forcing decision.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Commit slices (< 30, gate + files each) | PASS     | plan.md § RFC Commit Slices: eight ordered slices (0–7), each naming what it proves, its gate, and its files; mirrored in `worklog.md` § Commit Slices.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Risk register                           | PASS     | plan.md § Risk Register: 20 risks each with mitigation/kill response; § Kill and Switch Criteria adds adapter/subsystem/architecture kill tiers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Gate set selected                       | PASS     | plan.md § Gate Set: current docs/RFC gates match the `SCOPE-docs.md` overlay (source alignment, link integrity, terminology, drift log, fmt/diff); future units mapped to F-1…F-19 per `gates/archetype-gate-matrix.md`, A3 runtime gates required, A5 parity, A6 F-CLI family, release-gate class (`scaffold.runtime`, `e2e-cli-prod`) at W10.                                                                                                                                                                                                                                                                  |
| Deferred scope explicit                 | PASS     | plan.md § Deferred Implementation Scope and § Open-Decision Sweep "Safe to defer"; non-scope/refusal boundary in § Non-Scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| jsr-audit surface scan (pkg/plugin)     | PASS     | `research/planned-jsr-audit.md`: verdict `PASS-AS-PLANNED / NOT ACTUAL PUBLISH READINESS`; dry-run/doc-lint/packed/canary honestly `N/A` because the six packages do not exist (plan.md § Prospective JSR gates; worklog § Prospective JSR Verdict). Named risks (slow types, re-export, self-import, generated assets, duplicate Prisma components) each map to W1–W10 gates and kill criteria.                                                                                                                                                                                                                 |

## Directed challenges (per evaluator brief)

- **D-35 (production plan signatures, W5/W10).** Public semantics are locked (`ExecutablePlan` is a
  signed/versioned value; plan-status vocabulary includes approved/signed; production requires a
  signature). Only mechanism/algorithm/key custody is deferred, and W1 locks
  manifest/digest-encoding format-versioning first, so a later custody choice cannot rewrite package
  boundaries. **Deferral safe.**
- **D-37 (multi-namespace withheld).** Verified against pinned source (above). The kernel keeps
  `NamespaceRef` as a first-class axis; only the adapter's capability claim is withheld, with an
  explicit no-cast rule and a conformance gate. If upstream never fixes it, the kernel carries an
  unused axis — no rework. **Conditional classification correct.**
- **D-41 (Prisma import allowlist/compat window, W3).** Adapter-local by construction: the
  dependency law keeps every kernel package Prisma-free, the adapter stays experimental/unpublished
  until W3 gates pass, and the kill criteria keep W1–W2 valid if the adapter dies. Post-RC path
  churn is documented (`prisma-8-deep-dive.md` "Six days of post-RC churn"), which is precisely why
  pinning now would be designing to a moving surface. **Deferral safe.**
- **D-42 (advisory vs fenced-row lock).** Public lock semantics (owner, nonce, fencing evidence
  where used, timeout, force-unlock preconditions, refusal of uncertified adapters for
  concurrent-safe apply) are locked; only the per-provider mechanism is conformance-driven.
  **Deferral safe.**
- **D-01–D-47 existence/coherence.** All 47 present in plan.md § Locked Decision Ledger;
  classifications match `architecture-plan-synthesis.md` §13 (Locked / Pre-implementation W3–W10 /
  Conditional / Deferred). No contradiction found between the ledger, the open-decision sweep, and
  the wave exits.
- **Package graph.** Each unit has exactly one archetype; runtime is explicitly A3 with required
  runtime gates (matrix: F-13 + runtime/Aspire validation required for Arch 3). The dependency law
  forbids kernel→provider imports; concrete Prisma types are adapter-local; app-specific inferred
  bindings are generated app-local (consistent with `isolatedDeclarations` and the oRPC-only
  slow-type exception). No provider/query/slow-type leak path found. The testkit A6-vs-subpath
  question is explicitly bounded ("reconsider before W1"), pre-publication, and cannot rework other
  units.
- **Clean-break/data-safety, builder strategy, validation, lifecycle, recovery, waves, ordering.**
  Adoption is marker-only (zero DDL/DML) with hard-stop on unattributed objects, rehearsal gate, and
  forward-only recovery after first apply; the native-builder strategy matches the pinned source;
  validation is bounded with enumerated fail-closed cases and construction-time refusal; plugin
  removal guarantees only detach-and-retain; multi-target apply is a saga with `outcome_unknown` and
  inspect-before-resume; W0–W11 have explicit dependencies and exit evidence; slice 7 keeps
  owner-directed Fable 5 high as the absolute last substantive gate with only mechanical checks
  after. All coherent; no unstated open decision found.

## Open-decision sweep (evaluator-run)

No unflagged decision that would force rework if deferred. Candidates examined and dismissed:
testkit package-vs-subpath (flagged, bounded before W1, pre-publication); manifest/digest encoding
(W1-first, format-versioned); Grok 4.6 route availability for slice 5 (operational lane dependency,
live-route evidence recorded in `supervisor.md`; not an architecture decision); RFC
tracking-issue/label mechanics from `rfcs/README.md` (implementation-time process owned by
`netscript-pr`, not a plan decision).

## Verdict

`FAIL_PLAN`

### Required fixes

1. **[MEDIUM — factual integrity of a load-bearing rebaselined claim]** Correct the "exactly 30
   `db:*` tasks" count to the verified value (42 `db:*` tasks per generated engine workspace at
   baseline `cd720529`; counted by executing `generateDatabaseDenoJson` for all four providers) — or
   drop the exact number in favor of the accurate "more than twenty/forty-odd" formulation — in
   every location that carries it:
   - `research.md:34` (load-bearing finding 2);
   - `research/architecture-plan-synthesis.md:70` ([FACT] bullet) and `:681` (cutover step 9);
   - `plan.md` § Clean Cutover ("…deletes the old engine workspaces, 30 tasks, …");
   - record the disposition of Qwen finding F3 (`research/qwen-prisma-risk-review.md:64`) as an
     incorrect correction in `research.md`'s "Corrections and conflict resolutions" section, the
     same way the ~275-export claim was dispositioned. Rationale: the plan's own research gate
     states "Every load-bearing numeric/factual claim is pinned to NetScript baseline… corrected
     claims are not copied from independent reports" (plan.md § Plan and research gates). This
     number was copied from an independent report, labeled [FACT], and would be inherited by the
     canonical RFC's cutover/deletion inventory in slices 3–4. No architecture decision changes;
     this is a research-integrity fix only.

## Notes

- Non-blocking: `origin/main` advanced by one CI-only commit (`01e096049`) after the rebaseline; the
  plan's committed "fresh pin check during RFC drafting" covers it. No database surface is touched
  by that commit.
- All other spot-checked load-bearing claims held against the tree and the pinned Prisma source; the
  architecture, decision ledger, slices, gates, risks, JSR honesty, and deferral classifications are
  otherwise sound. A corrected resubmission should be a fast second cycle.
- Per the hard stop: no canonical RFC authorship until a PLAN-EVAL `PASS`.

PLAN-EVAL: FAIL_PLAN
