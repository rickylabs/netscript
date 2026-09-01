# PLAN-EVAL — docs-database-architecture-rfc--prisma-8-rfc (cycle 2)

- Plan evaluator session: native Claude Code, observed model `claude-fable-5`, effort `medium`,
  session `f3286656-7d0f-4da2-a22d-32897a5e6482`, 2026-08-13 (UTC)
- Route: matches the required lane (`formal_plan_evaluation` — Anthropic · Fable 5 · medium); fresh
  session, separate from cycle 1 (`dd3cfbee-1a53-4dfd-84a3-e78e38ef5b22`), the Codex supervisor, the
  Opus research lane, the Qwen review, and every delegated research/synthesis agent
- Run: `docs-database-architecture-rfc--prisma-8-rfc`
- Worktree: `/home/codex/repos/netscript-db-rfc`
- Branch / evaluated commit: `docs/database-architecture-rfc` @ `383170bbc`
  (`docs(rfc): record plan evaluation correction`)
- Surface / archetype: docs-only RFC plan under `SCOPE-docs.md`, describing future A1/A2/A3/A4/A5/A6
  surfaces
- Scope overlays: `SCOPE-docs.md`; future packages evaluated against
  `gates/archetype-gate-matrix.md`
- Canonical RFC file `rfcs/0000-database-architecture.md`: **absent — correct** (verified by listing
  `rfcs/`; only `0000-template.md`, `0001`–`0005`, `README.md` exist). The planned draft filename
  matches the RFC process rule "keep `0000` while drafting" (`rfcs/README.md` § Lifecycle).

## Cycle 1 disposition

Cycle 1 (session `dd3cfbee`, evaluated commit `3cbcfcec8`) returned `FAIL_PLAN` with seven passing
boxes and one required fix: the load-bearing claim of exactly 30 generated `db:*` tasks, copied from
the Qwen independent report into `research.md`, the synthesis, and `plan.md`. The cycle 1 artifact
is preserved in commit `383170bbc` (which added it alongside the corrections) and remains audit
evidence; this file replaces it as the current verdict per the harness single-artifact contract.

## Required-fix verification (independent)

- **Re-executed the generator myself at head `383170bbc`.** A scratch Deno script imported
  `generateDatabaseDenoJson` from
  `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts` and each of
  `postgresProvider`, `sqliteProvider`, `mysqlProvider`, `mssqlProvider` from
  `packages/cli/src/kernel/adapters/database/providers/database-providers.ts`, generated each
  workspace `deno.json`, and counted keys starting with `db:`. Result: **postgres 42, sqlite 42,
  mysql 42, mssql 42** — the corrected value is independently confirmed.
- **Every mutable occurrence is corrected, with no cross-workspace ambiguity.** Swept the run dir
  for `exactly 30`/`30 db:`/`30 task`/`30 unique`: the only remaining occurrences are (a) the
  immutable Qwen report (`research/qwen-prisma-risk-review.md:64,297`), (b) the immutable Opus
  review (`claude-opus-architecture-review.md:1710,1978`) and brief
  (`briefs/claude-opus-report-part-2.md:34`), and (c) the preserved cycle 1 artifact itself. The
  mutable records all carry the executed result phrased per-workspace, not as a total:
  `research.md:34-35` ("42 `db:*` task keys in every generated engine workspace"),
  `architecture-plan-synthesis.md:70` and `:682` ("42 `db:*` task keys in every generated engine
  workspace" / "the 42 per-workspace generated `db:*` task keys"), and `plan.md:310` ("the 42
  per-workspace generated `db:*` task keys").
- **Qwen F3 is dispositioned as an incorrect correction** in `research.md:61-67` ("Corrections and
  conflict resolutions"), the same way the ~275-export claim was dispositioned, and the copied
  premise in the immutable Opus review/briefs is explicitly marked non-authoritative there.
- **The correction commit is properly scoped.** `383170bbc` modified only the mutable records
  (`plan.md`, `research.md`, `architecture-plan-synthesis.md`, `supervisor.md`, `worklog.md`) and
  added the preserved evaluator artifact/brief; no independent model report was edited
  (`git show --name-status 383170bbc`).

## Rebaseline and drift verification

- `research.md:4-9` explicitly rebaselines to `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`
  with Prisma pins RC1 `a76a6c5` and post-RC object `71e2e0d9…`. Verified: `cd720529` is an ancestor
  of HEAD; the pinned checkout at `.llm/tmp/prisma-v8-rc1` resolves HEAD
  `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5` and `git cat-file -t 71e2e0d9…` returns `commit`.
- Fetched `origin/main`: it has advanced by **exactly one commit**,
  `01e096049 ci: adopt structured check reports (#1639)`. I inspected its full file list and the
  diffs to the two database-adjacent files it touches:
  `packages/cli/e2e/src/application/gates/
  scaffold/database-gates.ts` changes only how the E2E
  suite invokes generated-workspace type checks (gate mechanics, not scaffold output), and root
  `deno.json` changes wrapper permission flags for structured check reports. It touches no
  `packages/database`, no `packages/cli/src/kernel/adapters|templates/database`, no doctrine, no
  `rfcs/`. It invalidates no research, plan, archetype, gate, or RFC-authoring premise; the plan's
  committed "fresh pin check during RFC drafting" (plan.md § Dependencies and Drift Watch) covers
  residual drift. **Non-blocking.**

## Spot-checks of load-bearing findings (this cycle's independent set)

1. **Current NetScript facts.**
   - `resolveTarget` defaults only with exactly one enabled target and never consults
     `PrimaryDatabase` — confirmed at
     `packages/cli/src/kernel/adapters/database/workspace-resolver.ts:66-91` (matching on
     `configKey`/`databaseName` only; zero `PrimaryDatabase` references in the file).
   - Plugin schema contribution is file copy plus regex declaration scanning — confirmed:
     `packages/cli/src/kernel/adapters/plugin/prisma-declaration-scanner.ts:13` defines the
     `model|enum|type|view` header regex; `prisma-schema-writer.ts:19,100-122` performs the
     collision check by scanned declaration name (research finding 3).
   - Generated templates pin `npm:prisma@^7.4.2` (`generate-db-deno-json.ts:36,56,59,61,67`) while
     the root catalog pins `@prisma/*` at `^7.8.0` (`deno.json:231-236`) — the version-skew claim
     holds.
   - AP-17 debt is stale on its rename half — `packages/database/ports/` exists while
     `.llm/harness/debt/arch-debt.md:316-324` still says "`interfaces/` should become `ports/`";
     `DB-GENERATE-ASPIRE-COUPLING` remains open at `arch-debt.md:1954` and describes
     `DbOperationRunner.executeDetached` always booting Aspire — matching the plan's doctrine/debt
     section and D-26.
2. **Pinned Prisma RC/current-source facts.**
   - Model-first authoring (D-06/D-36): confirmed at
     `.llm/tmp/prisma-v8-rc1/packages/3-extensions/postgres/src/contract/define-contract.ts:91-105`
     — `defineContract(scaffold, factory)` with `const` generics preserving literal
     types/models/enums; no fluent target/table/column chain.
   - Namespace type-map flattening (D-37): confirmed at
     `.llm/tmp/prisma-v8-rc1/packages/2-sql/2-authoring/contract-ts/src/contract-types.ts:644-691` —
     comments state the authoring path "lumps every model under the default storage namespace", and
     non-default namespaces receive `entries.table: Record<never, never>`. Withholding the
     multi-namespace capability claim is well-founded.
   - `@prisma/orm-postgres` export breadth: counted `Object.keys(exports)` of
     `packages/9-public/@prisma/orm-postgres/package.json` at the pin — **138**, matching
     `prisma-8-deep-dive.md:98` and the synthesis's correction of Qwen's ~275.
3. **Doctrine / JSR / package-boundary facts.**
   - `isolatedDeclarations: true` at root `deno.json:174`.
   - Slow-type exception is sanctioned only for oRPC-bound packages
     (`docs/architecture/doctrine/02-public-surface.md:217-240`); the planned JSR audit's rule that
     no database package inherits it (`planned-jsr-audit.md:41-45`) is consistent.
   - Doctrine codifies plain `*.prisma` plugin fragments (`06-archetypes.md:209-211`) and contains
     zero references to `database-contract|database-runtime|database-control` in `06-archetypes.md`
     or `10-codebase-verdict-and-handoff.md` — the plan's W0 doctrine-amendment obligation is
     correct and required.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists, rebaselined to `cd720529` with pinned Prisma sources; #313 carried as historical evidence only; the cycle 1 false count is corrected to the executed 42-per-workspace result in every mutable record, with Qwen F3 dispositioned (`research.md:61-67`); the one-commit main delta is CI/gate tooling and invalidates nothing. |
| Decisions locked                        | PASS   | plan.md § Locked Decision Ledger D-01–D-47 with rationale; expanded rationale in `architecture-plan-synthesis.md` §13; the two tables are coherent (statuses match; no contradiction found).                                                                                                                                                        |
| Open-decision sweep                     | PASS   | plan.md § Open-Decision Sweep (must-resolve-now: none; per-wave W1/W3/W4/W5/W7/W10 items; safe-to-defer list). My independent sweep (below) found no unflagged rework-forcing decision.                                                                                                                                                             |
| Commit slices (< 30, gate + files each) | PASS   | plan.md § RFC Commit Slices: eight ordered slices (0–7), each naming what it proves, its gate, and its files; mirrored in `worklog.md` § Commit Slices.                                                                                                                                                                                             |
| Risk register                           | PASS   | plan.md § Risk Register: 20 risks each with mitigation/kill response; § Kill and Switch Criteria adds adapter/subsystem/architecture kill tiers.                                                                                                                                                                                                    |
| Gate set selected                       | PASS   | plan.md § Gate Set: current docs/RFC gates match `SCOPE-docs.md` (source alignment, link integrity, terminology, drift log, fmt/diff); future units mapped to F-1…F-19 per `gates/archetype-gate-matrix.md`; A3 runtime gates required (matrix: F-13 + runtime/Aspire validation required for Arch 3); release-gate class at W10.                   |
| Deferred scope explicit                 | PASS   | plan.md § Deferred Implementation Scope, § Open-Decision Sweep "Safe to defer", and the § Non-Scope refusal boundary.                                                                                                                                                                                                                               |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research/planned-jsr-audit.md`: verdict `PASS-AS-PLANNED / NOT ACTUAL PUBLISH READINESS`; dry-run/doc-lint/packed/canary honestly **N/A** because the six packages do not exist; named risks (slow types, re-export, self-import, generated assets, duplicate Prisma components) each map to W1–W10 gates and kill criteria.                       |

## Directed challenges (per evaluator brief)

- **D-35 (production plan signatures, W5/W10).** Public semantics are locked: `ExecutablePlan` is a
  signed/versioned value, the plan-status vocabulary includes approved/signature states, and
  signature policy enters only through an explicit port ("Clock/ID/signature policy" in the
  consumed-ports list). Only mechanism/algorithm/key custody is deferred, and W1 locks
  manifest/digest format-versioning first, so a later custody choice cannot rewrite package
  boundaries. **Deferral safe.**
- **D-37 (multi-namespace withheld).** Independently re-verified against the pinned source (above).
  The kernel keeps `NamespaceRef` as a first-class identity axis; only the adapter capability claim
  is withheld, with an explicit no-cast rule and a conformance parity gate. If upstream never fixes
  the flattening, the kernel carries an unused axis — no rework. **Conditional classification
  correct.**
- **D-41 (Prisma import allowlist/compat window, W3).** Adapter-local by construction: the
  dependency law keeps every kernel package Prisma-free, the adapter stays experimental until W3
  gates pass, and the kill criteria keep W1–W2 valid if the adapter dies. Post-RC path churn is
  documented (`prisma-8-deep-dive.md` § "Six days of post-RC churn"), which is exactly why pinning
  the spelling now would design to a moving surface. **Deferral safe.**
- **D-42 (advisory vs fenced-row lock).** Public lock semantics (owner, nonce, fencing evidence
  where used, timeout/force-unlock preconditions, refusal of uncertified adapters for
  concurrent-safe apply) are locked; only the per-provider mechanism is conformance-driven.
  **Deferral safe.**
- **D-01–D-47 existence/coherence.** All 47 present in plan.md § Locked Decision Ledger;
  classifications match `architecture-plan-synthesis.md` §13 (Locked / Pre-implementation W3–W10 /
  Conditional / Deferred) line for line. No contradiction between ledger, open-decision sweep, and
  wave exits.
- **Package graph.** Each unit has exactly one archetype; runtime is explicitly A3 with required
  runtime gates. The dependency law forbids kernel→provider imports; concrete Prisma types are
  adapter-local; app-specific inferred bindings are generated app-local, consistent with
  `isolatedDeclarations` and the oRPC-only slow-type exception. No provider/query/slow-type leak
  path found. The testkit A6-vs-subpath question is explicitly bounded ("reconsider before W1"),
  pre-publication, and cannot rework other units.
- **Clean-break/data-safety, builder strategy, validation, lifecycle, recovery, waves, ordering.**
  Adoption is marker-only (zero DDL/DML) with hard-stop on unattributed objects, a seeded
  production-shaped rehearsal gate, and forward-only recovery after first apply (synthesis §11); the
  native-builder strategy matches the pinned source; validation is bounded with enumerated
  fail-closed `DB_VALIDATION_UNSUPPORTED` cases and construction-time refusal; plugin removal
  guarantees only detach-and-retain; multi-target apply is a saga with `outcome-unknown` and
  inspect-before-resume; W0–W11 have explicit dependencies and exit evidence; slice 7 keeps
  owner-directed Fable 5 high as the absolute last substantive gate with only mechanical checks
  after. Coherent; no unstated open decision found.

## Open-decision sweep (evaluator-run)

No unflagged decision that would force rework if deferred. Candidates examined and dismissed:
testkit package-vs-subpath (flagged, bounded before W1, pre-publication); manifest/digest encoding
(W1-first, format-versioned); Grok 4.6 route availability for slice 5 (operational lane dependency
with live-route evidence in `supervisor.md`, not an architecture decision); RFC
tracking-issue/label/FCP mechanics from `rfcs/README.md` (implementation-time process owned by
`netscript-pr`; the planned `0000-database-architecture.md` filename already complies with the
draft-numbering rule); context-pack staleness (artifact hygiene, not a decision — see Notes).

## Verdict

`PASS`

## Notes

- Non-blocking hygiene: `context-pack.md` is stale (phase still `research`; its archetype line omits
  A3). It is not a Plan-Gate box, but it should be refreshed with the next slice commit so the run
  stays resumable, per the harness per-slice artifact rule.
- Non-blocking: `origin/main` advanced by one CI/gate-tooling commit (`01e096049`) after the
  rebaseline; independently inspected and found to touch no premise of this plan. The plan's
  committed fresh pin check during RFC drafting covers it.
- Per the hard stop: canonical RFC authorship (slice 3) may begin; slices must follow the locked
  order, and Fable 5 high remains the final substantive gate.

PLAN-EVAL: PASS
