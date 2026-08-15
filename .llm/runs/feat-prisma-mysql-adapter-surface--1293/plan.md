# Plan: `prisma-adapter-mysql` public surface and connection-error hook

## Run Metadata

| Field             | Value                                      |
| ----------------- | ------------------------------------------ |
| Run ID            | `feat-prisma-mysql-adapter-surface--1293`  |
| Branch            | `feat/prisma-mysql-adapter-surface`        |
| Base              | `284dda90a17a13a7e5e8e9834e5411b58887131b` |
| Phase             | `plan` — hard stop before implementation   |
| Target            | `packages/prisma-adapter-mysql`            |
| Archetype         | `2 — Integration`                          |
| Scope overlays    | none                                       |
| Issue / milestone | `#1293` / `0.0.7`                          |

## Archetype and current verdict

Archetype 2 applies because this package is an adapter over the external `mysql2/promise` system and
implements Prisma's driver-adapter boundary. The 2026-08-12 doctrine verdict is **Keep**: preserve
the MySQL implementation behind the database-owned port. This leaf changes the public surface and
failure observation contract; it does not authorize a package restructure.

## Goal

Make the already-published `onConnectionError` option honest and observable, intentionally expose
the connected-adapter surface selected by the owner, repair the full root export's measured doc-lint
failures, add explicit slow-type annotations, and prove the 0.0.7 package artifact without crossing
into #1112's docs-owned site file.

## Scope

- `packages/prisma-adapter-mysql/src/adapter.ts`
  - selected public adapter contract;
  - explicit `provider` / `adapterName` annotations;
  - package-owned public types in public method signatures;
  - connection-error notification at the owner-approved boundaries.
- `packages/prisma-adapter-mysql/src/types.ts`
  - document the already-published hook's exact predicate and observational semantics;
  - add only the public type(s) required to make the selected adapter contract doc-lint clean.
- `packages/prisma-adapter-mysql/src/mod.ts`
  - intentional root re-export(s), separated into value and type exports.
- `packages/prisma-adapter-mysql/tests/`
  - focused fake-client tests for every selected hook boundary and primary-error preservation;
  - public import/shape test for the selected adapter export.
- `packages/prisma-adapter-mysql/examples/basic-usage.ts`
  - consume `../mod.ts`, advertise only the behavior selected in this plan, and remain outside the
    publish set.
- Run artifacts for slice evidence, drift, exact receipts, and #1112 handoff.

## Non-Scope

- No edit to `docs/site/reference/prisma-adapter-mysql/index.md`; record its line-23 stale statement
  in `drift.md` and the PR handoff.
- No closure keyword for #1112 and no claim that this leaf completes #1112's docs-owned example.
- No issue filing/closure, publication, merge, ready-for-review flip, central-cluster mutation,
  expensive-gate lease, or `scaffold.runtime`.
- No dependency upgrade, lock deletion/reload, or `deno.lock` churn.
- No broad error-system rewrite or unrelated adapter refactor.

## Proposed public-surface delta

The delta below is precise about what is invariant and what requires the owner's PLAN-EVAL ruling.
Implementation may not start while either must-resolve row remains open.

### Invariant delta

| Symbol/member                                       | Current                                                                            | Planned delta                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PrismaMySqlOptions.onConnectionError`              | Already published as `(err: Error) => void`, undocumented predicate, never invoked | Keep the name and type (no breaking removal); expand JSDoc to state the exact selected predicate and that it is observational and does not replace the primary rejection |
| `MySqlQueryable.provider`                           | inferred `'mysql' as const`                                                        | Annotate `readonly provider: 'mysql' = 'mysql'` before any connected implementation becomes publish-facing                                                               |
| `MySqlQueryable.adapterName`                        | inferred from `PACKAGE_NAME`                                                       | Annotate `readonly adapterName: string = PACKAGE_NAME`                                                                                                                   |
| `PrismaMySqlTransactionAdapter.queryRaw/executeRaw` | public interface refers to private upstream `SqlQuery` / `SqlResultSet`            | Use public package-owned `PrismaMySqlQuery` / `PrismaMySqlResultSet`                                                                                                     |
| `PrismaMySqlConnectedAdapter.queryRaw/executeRaw`   | public interface refers to private upstream `SqlQuery` / `SqlResultSet`            | Use public package-owned `PrismaMySqlQuery` / `PrismaMySqlResultSet`                                                                                                     |
| `PrismaMySqlConnectedAdapter.startTransaction`      | refers to private upstream `IsolationLevel`                                        | Use public package-owned `PrismaMySqlIsolationLevel`                                                                                                                     |
| transaction `options` type                          | refers to private upstream `TransactionOptions`                                    | Add and root type-export `PrismaMySqlTransactionOptions` with the currently promised `usePhantomQuery: boolean` shape, then use it in `PrismaMySqlTransactionAdapter`    |

No `@netscript/*` dependency is introduced or touched by this delta. External `catalog:`
materialization remains subject to JSR audit but is not a planned version change.

### Must-resolve adapter symbol

| Choice                          | Exact delta                                                                                                                                      | Consequence                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — literal issue wording**   | Add a root **value and type** export named `PrismaMySqlAdapter`                                                                                  | Its constructor and private base/client types become stable surface. The implementation must first replace private inheritance leakage and either publish a narrowly named client injection contract or redesign construction. This is more than a one-line `export`. |
| **B — doctrine/upstream shape** | Keep the concrete class internal and retain `PrismaMySqlConnectedAdapter` as the public result type; optionally add no new adapter symbol at all | Satisfies the practical example/type need and matches Prisma's upstream adapter, but does not satisfy #1293 Acceptance box 1 as currently written.                                                                                                                    |

**Recommendation for PLAN-EVAL:** choose B and have the owner revise the acceptance wording, unless
runtime construction or `instanceof` is a demonstrated consumer requirement. Publishing an
implementation class solely because an example wants to name a type violates the small-surface rule
and creates constructor/port commitments the factory already avoids. If the owner retains A,
PLAN-EVAL must approve the exact constructor/client-port contract before implementation.

## Locked decisions

| ID | Decision                                                                                                                | Rationale                                                                                                                         |
| -- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1 | **Coordinator ruling:** wire the already-published hook; do not remove it.                                              | Removal from 0.0.6 is breaking; wiring is additive.                                                                               |
| D2 | The hook is observational: invoke it without allowing callback failure to mask the original driver/Prisma error.        | An error callback must not rewrite the driver-adapter rejection contract.                                                         |
| D3 | Existing SQL/domain error conversion remains authoritative.                                                             | `queryRaw` / `executeRaw` callers already receive `DriverAdapterError`; the hook adds observation, not a replacement error model. |
| D4 | Repair all six measured root doc-lint failures in owned public interfaces.                                              | Acceptance requires clean doc lint; pre-existing failures cannot be relabelled as a generated success.                            |
| D5 | The package example imports the package root and remains excluded from publication.                                     | It is consumer evidence, not artifact content.                                                                                    |
| D6 | No site-doc edit; record `docs/site/reference/prisma-adapter-mysql/index.md:23` as docs-lane drift/handoff.             | Explicit lane boundary.                                                                                                           |
| D7 | Final proving evidence consists of exactly four durable receipts: `check`, `test`, `publish-dry-run`, and `arch-check`. | Leaf contract. Supporting surface/doc/JSR checks do not silently become extra contracted receipt IDs.                             |
| D8 | **Coordinator ruling:** split-close is the cross-lane close contract; this leaf does not reopen or reinterpret it.      | The product PR is `Part of #1293`; #1293 stays open until #1112 completes acceptance box 4.                                       |

## Open-decision sweep

| Decision                                                               | Status                                         | Notes                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Value-class export versus existing public connected interface          | **must resolve now**                           | Deferral changes implementation shape, public symbol set, tests, and doc-lint work. Recommendation: keep class internal and revise acceptance.                                                                                          |
| Hook predicate across pool/query/transaction/disposal boundaries       | **must resolve now**                           | A blanket `onError()` override reports SQL errors; upstream event-only behavior does not meet the issue's pool-failure motivation.                                                                                                      |
| Capability probe failure: notify-and-fallback versus notify-and-reject | **must resolve now**                           | Changes `connect()` behavior. Current code silently falls back.                                                                                                                                                                         |
| Acceptance box 4 versus #1112/docs ownership                           | **RESOLVED — coordinator ruling: split-close** | Preserve box 4 unchanged. The product PR is `Part of #1293` without a closing keyword and may merge on product gates; #1293 remains open and does not become `status:shipped` until #1112 rewrites and verifies the executable example. |
| Commit/rollback/disposal notification                                  | safe to defer only after predicate is fixed    | Expected recommendation: preserve normal rejection/cleanup and do not call a connection hook unless the selected predicate classifies the error as connection loss.                                                                     |
| Dependency versions                                                    | safe to defer                                  | No dependency change is needed; audit only.                                                                                                                                                                                             |

## Proposed hook contract for evaluator review

The proposed semantic baseline is:

1. `onConnectionError` receives an `Error` when a failure is classified as connection establishment,
   pool acquisition/capacity, transport loss, or checked-out connection error.
2. SQL/domain errors already represented by `src/errors.ts` (constraint, missing table/column, value
   errors, deadlock) do not fire it merely because they occurred during a query.
3. Authentication/access/missing-database and capacity errors need an explicit ruling because they
   are both mapped Prisma errors and connection-establishment failures.
4. The original operation still rejects with its existing mapped/raw error; callback failure is
   contained and never replaces it.
5. Capability probing either (recommended) notifies once and preserves today's conservative
   fallback, or—only by explicit owner decision—changes `connect()` to reject.
6. No notification is emitted for successful disposal. Disposal failure follows the selected
   connection predicate rather than being included by method name alone.

This contract needs a named classifier or event seam; an `onError()` override alone is rejected as
over-broad.

## Proposed PLAN-EVAL determination

**Proposed: PLAN-EVAL required (owner decision pending).**

Reasoning:

- The hook is not mechanical: at least four error boundaries have different propagation shapes, only
  some use `errors.ts`, and the already-published signature does not define its predicate.
- The literal class export conflicts with the existing sufficient interface, upstream Prisma's
  private connected class, and doc-lint/private-constructor constraints.
- Capability probing currently swallows the first likely connection failure, so wiring can alter
  `connect()` semantics.
- Acceptance box 4 conflicts with the explicit lane-ownership boundary and the PR close-gate.

Per the leaf brief, this session does **not** decide the determination and has no evaluator-dispatch
grant. It stops for the owner/orchestrator ruling and will not launch an evaluator.

## Slice breakdown proposed for Phase 2

Each slice ends at a Tier-A stop. No next slice begins until the topic orchestrator substantively
reviews the slice and releases it.

### S1 — Lock and expose the public contract

- Proves: the owner-selected adapter symbol is intentional; public signatures contain no private
  upstream type references; slow-type annotations are explicit.
- Files: `src/adapter.ts`, `src/types.ts`, `src/mod.ts`, focused public-surface test, run artifacts.
- Supporting checks: scoped check, raw/structured full-export doc lint, JSR audit, and
  `surface:diff` showing the exact intentional minor delta.
- Tier-A stop: review constructor/type commitments and the surface diff before behavior wiring.

### S2 — Wire the connection-error predicate and regression tests

- Proves: every selected boundary fires exactly as designed; excluded SQL/domain errors do not;
  callback exceptions do not mask the primary error; existing error mapping and cleanup remain.
- Files: `src/adapter.ts`, `src/errors.ts` only if a focused classifier belongs there,
  `tests/*connection*`, run artifacts.
- Supporting checks: focused structured test wrapper plus package check/quality scan.
- Tier-A stop: review predicate coverage, duplicate-notification risk, and primary-error identity.

### S3 — Package consumer example and handoff

- Proves: `examples/basic-usage.ts` consumes `../mod.ts`, advertises observable shipped behavior,
  and type-checks/executes to the boundary possible without a live MySQL service; #1112 and the
  stale docs sentence are named without editing/closing docs scope.
- Files: `examples/basic-usage.ts`, `drift.md`, `worklog.md`, `context-pack.md`, PR handoff text.
- Supporting checks: example check/test selected in S1/S2; confirm raw publish file list still
  excludes `examples/**`.
- Tier-A stop: verify no docs-owned file changed; the product PR is `Part of #1293` with no closing
  keyword, names box 4 as blocked on #1112, and states that product merge satisfies #1112's
  implementation prerequisite without closing or shipping #1293.

### Final evidence pass at committed content head

Preconditions: all owned changes committed; raw Git ground truth says clean; actual `HEAD` is the
content head; no `--allow-git-head-mismatch`; no lock churn.

Run `.llm/tools/gates/run-gate.ts` with four distinct IDs and explicit output files under the run
directory:

| Contracted gate   | Invocation ID                       | Planned receipt file                              |
| ----------------- | ----------------------------------- | ------------------------------------------------- |
| `check`           | `prisma-mysql-1293-check`           | `receipts/prisma-mysql-1293-check.json`           |
| `test`            | `prisma-mysql-1293-test`            | `receipts/prisma-mysql-1293-test.json`            |
| `publish-dry-run` | `prisma-mysql-1293-publish-dry-run` | `receipts/prisma-mysql-1293-publish-dry-run.json` |
| `arch-check`      | `prisma-mysql-1293-arch-check`      | `receipts/prisma-mysql-1293-arch-check.json`      |

The sufficiency verdict will recompute from those four exact files and name them individually.
Supporting `surface:diff`, doc-lint, raw package dry-run review, quality scan, and JSR-audit outputs
remain required acceptance/fitness evidence but do not replace or ambiguously expand the contracted
four-receipt set.

## Acceptance evidence map

| #1293 checkbox                                                    | Planned evidence                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrismaMySqlAdapter` exported ... surface-diff green              | Owner-approved Choice A value export plus `surface:diff` minor row, public-import test, and clean `deno doc`; **or** owner revises the checkbox before Choice B can discharge it. No incidental export.                                                                                                                                                                                                               |
| Connection-error hook named, typed, documented, regression-tested | Existing `PrismaMySqlOptions.onConnectionError` JSDoc plus focused boundary/predicate tests that fail if notification stops, over-fires, duplicates, or masks the primary error.                                                                                                                                                                                                                                      |
| Explicit annotations; `deno doc --lint` clean                     | Explicit base-member annotations, replacement of all six measured private refs, raw and structured full-export doc-lint exit 0, and publish dry-run with no real slow-type warning.                                                                                                                                                                                                                                   |
| #1112 example rewritten and executable                            | **Blocked on #1112 under the coordinator's split-close contract.** This leaf updates and verifies only the package-owned example, and its product merge satisfies #1112's implementation prerequisite. The PR references #1112 without a closing keyword, states the remaining docs-owned rewrite and executable verification explicitly, does not claim box 4, and does not close or move #1293 to `status:shipped`. |

## Fitness gates and JSR applicability

- Archetype-2 required families: F-1..F-12, F-14..F-19, static gates, and consumer import
  validation. `arch-check`, JSR audit, surface diff/doc lint, and targeted review cover the
  applicable automated/manual portions.
- `jsrAudit.applicable = true`.
- Audit the full root export, exact published file list, external catalog materialization, absence
  of touched `@netscript/*` dependencies, isolated declarations/no slow types, and absence of
  runtime asset/import-attribute/top-level `import.meta` reads.
- `surface-diff` must identify every new or changed public symbol intentionally.
- Runtime/Aspire validation and `scaffold.runtime` are N/A/prohibited for this leaf; focused fake
  client tests prove the adapter behavior without an external service.

## Risk register

| Risk                                                                            | Mitigation                                                                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook reports every SQL error under a misleading name                            | Lock a classifier/event predicate and negative-test constraint/query errors.                                                                            |
| Callback throws and masks the driver's primary error                            | Contain callback failure; assert original rejection identity/mapping.                                                                                   |
| Same transaction failure notifies twice through lifecycle and operation catches | Centralize notification and assert exact call count.                                                                                                    |
| Exporting class leaks private constructor/base types                            | PLAN-EVAL Choice A/B; no implementation until public signature is explicitly approved and doc-lintable.                                                 |
| `connect()` silently succeeds after capability-query failure                    | Explicit owner ruling; regression test chosen behavior.                                                                                                 |
| Pre-existing doc-lint failures are misreported as new success baseline          | Preserve the measured six-error baseline and enumerate the owned repairs.                                                                               |
| JSR helper banner is mistaken for a real slow type                              | Use raw dry-run as authority and record helper discrepancy.                                                                                             |
| Example or tests accidentally enter publish artifact                            | Review raw dry-run file list and preserve `publish.exclude`.                                                                                            |
| Docs warning becomes false                                                      | Record `docs/site/...:23` in `drift.md`/PR handoff; do not edit it.                                                                                     |
| Product evidence cannot discharge acceptance box 4                              | Apply the decided split-close contract: product PR uses `Part of #1293`; box 4 remains blocked on #1112, and #1293 stays open and not `status:shipped`. |
| Validation churns `deno.lock`                                                   | Inspect raw Git status/diff after every command; do not accept unrelated lock changes.                                                                  |

## Arch-debt implications

- No new debt is planned or accepted.
- If a literal class export cannot be made doc-lint clean without publishing an unjustified client
  port or widening the inheritance surface, that is a plan failure/rescope—not permission to add an
  unreviewed debt entry.

## Deferred scope and drift watch

- #1112 owns the docs-site rewrite and executable site example after this surface ships.
- Watch and record if the selected hook predicate diverges from this plan, if capability probing
  changes fatality, if any public client type becomes necessary, if publish membership changes, or
  if the docs-owned line 23 is modified by another lane.
- The PR body carries `Part of #1293` with no closing keyword, references #1112 without a closing
  keyword, and states the remaining scope explicitly rather than relying on the absence of a keyword
  to communicate it. It uses milestone `0.0.7`, taxonomy labels including exactly one `status:`, and
  an exact fenced `acceptance-evidence` block that mirrors only the boxes this leaf can truthfully
  discharge, naming box 4 as blocked on #1112 and stating that this product merge satisfies #1112's
  implementation prerequisite. The product merge does not move #1293 to `status:shipped`.
