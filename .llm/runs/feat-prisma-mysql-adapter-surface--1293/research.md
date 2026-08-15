# Research — feat-prisma-mysql-adapter-surface--1293

## Re-baseline

- Carried-in source: issue #1293 plus the implementation-leaf brief from `topic-features-0.0.7`.
- Re-derived against live `origin/main` and local `HEAD` at
  `284dda90a17a13a7e5e8e9834e5411b58887131b` on 2026-08-15.
- Identity before research: worktree `/home/codex/repos/netscript-007-features-1293`, branch
  `feat/prisma-mysql-adapter-surface`, no upstream by design, clean tree, and both `HEAD` and
  `origin/main` equal to the required base.
- What changed versus the issue premise:
  - Gap 1 is real: `PrismaMySqlAdapter` is a private class and the root surface does not expose it.
  - Gap 2 is stale: `PrismaMySqlOptions.onConnectionError?: (err: Error) => void` is already in the
    published 0.0.6 surface, but no runtime path reads or calls it.
  - The current documentation baseline is not clean: `deno doc --lint` has six pre-existing
    `private-type-ref` failures unrelated to the missing callback invocation.

## Package and doctrine context

- Target: `packages/prisma-adapter-mysql`, one root export (`.` -> `./mod.ts`), package version
  `0.0.6`.
- Archetype: **2 — Integration**. It wraps the external `mysql2/promise` system behind a Prisma
  driver-adapter boundary. The doctrine's measured verdict is **Keep**: “Keep the MySQL
  implementation behind the database-owned port.”
- Scope overlays: none. The package-owned example is in scope as a consumer check; the site
  reference is docs-owned and is not an overlay for this leaf.
- Relevant axioms: A1/A2 (public contract first and small), A5 (composition over inheritance), A10
  (explicit construction seam), A11 (name the extension/error axis), A13 (failure boundary), and A14
  (publish surface is a proving gate).
- Relevant risks/anti-patterns: AP-3 (do not publish a god client port merely to make the class
  constructible), AP-4/AP-5 (do not widen the private inheritance hierarchy into the contract),
  AP-10 (do not add catch blocks that obscure the primary error), AP-11 (no hidden pool state),
  AP-14 (do not re-export Prisma/mysql2 merely to repair docs), AP-19 (runtime requirements remain
  explicit), and AP-25 (IO stays at the adapter edge).
- No open architecture-debt entry specifically covers `packages/prisma-adapter-mysql`; unrelated
  Prisma debt entries do not authorize debt here.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                  | How to verify                                                                                                     |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1  | `PrismaMySqlAdapter` is declared without `export` and is not re-exported.                                                                                                                                                                                                                                                                                                                                                                | `src/adapter.ts:319`; `src/mod.ts:40`                                                                             |
| 2  | `PrismaMySqlOptions.onConnectionError` is already a published, stable option and has no use site. Removing it would be a breaking change; wiring it is additive.                                                                                                                                                                                                                                                                         | `src/types.ts:35-40`; `src/mod.ts:51-58`; repo search has only the declaration, package example, and docs warning |
| 3  | The public surface already exposes `PrismaMySqlConnectedAdapter`, the structural instance contract returned by `connect()`. An example can name this type today.                                                                                                                                                                                                                                                                         | `src/adapter.ts:513-537`; `src/mod.ts:42-49`; `deno doc packages/prisma-adapter-mysql/src/mod.ts`                 |
| 4  | The literal issue checkbox is stronger than the practical need: it says the **class** must be exported. A type-only export (or the already-shipped connected interface) satisfies “name the result type,” but does not satisfy the checkbox's literal value/class export.                                                                                                                                                                | issue #1293 Acceptance box 1; compare `src/adapter.ts:319` and `src/adapter.ts:516`                               |
| 5  | Exporting the concrete class is a materially larger contract than exporting an interface. Its public constructor currently exposes private `MysqlPoolClient`; it extends private `MySqlQueryable<MysqlPoolClient>`; and direct callers would have to supply internal client/capability state. A literal class export therefore requires either new public client-port types or a class refactor that hides those implementation types.   | `src/adapter.ts:32-44`, `95-102`, `319-326`                                                                       |
| 6  | The upstream `@prisma/adapter-mariadb@7.8.0` does **not** export its connected adapter class. It exports the factory, keeps `PrismaMariaDbAdapter` private, and documents `onConnectionError` narrowly as a callback attached to transaction connection `error` events. That precedent supports keeping the class internal, but it conflicts with #1293's literal class-export box and its “pool fails” motivation.                      | `npm:@prisma/adapter-mariadb@7.8.0/dist/index.d.mts:37-63`; runtime `dist/index.mjs:377-410`                      |
| 7  | `createPool()` is lazy. `PrismaMySqlAdapterFactory.connect()` creates the pool, then `getCapabilities()` performs the first query. That query catches **every** failure and returns `{ supportsRelationJoins: false }`, so bad credentials/network may make `connect()` appear successful and no hook fires.                                                                                                                             | `src/adapter.ts:569-599`, `700-718`                                                                               |
| 8  | Ordinary `queryRaw`/`executeRaw` execution goes through `performIO()`. All query/execute failures call `onError()`, which converts recognized MySQL errors through `src/errors.ts` and throws Prisma's `DriverAdapterError`; non-driver errors are rethrown. This path already has a primary error contract. Calling a connection hook here without a predicate would also report constraint/query errors, not only connection failures. | `src/adapter.ts:107-187`, `235-241`; `src/errors.ts:22-35`, `40-190`                                              |
| 9  | `executeScript()` bypasses `performIO()` and rejects with the raw `mysql2` error. It is query execution, but not currently normalized through `errors.ts`.                                                                                                                                                                                                                                                                               | `src/adapter.ts:328-333`                                                                                          |
| 10 | Transaction start has several distinct failure points: `pool.getConnection()` (acquisition), optional `SET TRANSACTION ISOLATION LEVEL`, and `BEGIN`. They reject `connectionReady`; the awaiting `startTransaction()` receives the raw error. They do not call `onError()` or `convertDriverError()`. The background lifecycle `.catch()` logs and prevents an unhandled rejection but does not notify the option.                      | `src/adapter.ts:351-406`, especially `367-398`; acquisition is `624`                                              |
| 11 | Transaction query execution inherits `performIO()` and is normalized, but `commit()` and `rollback()` directly execute SQL and reject raw errors while always resolving cleanup.                                                                                                                                                                                                                                                         | `src/adapter.ts:247-295`                                                                                          |
| 12 | Disposal is a separate lifecycle boundary: `dispose()` -> `client.close()` -> `pool.end()`. It rejects raw on close failure and is not routed through `errors.ts`. A close failure is not automatically the same semantic event as a connection-establishment/loss hook.                                                                                                                                                                 | `src/adapter.ts:409-414`, `636-638`                                                                               |
| 13 | `src/errors.ts` classifies SQL/domain errors (constraints, missing DB/table/column), authentication/access errors, deadlocks, and capacity errors (1040/1203), with a generic MySQL fallback. It has no `isConnectionError` predicate and its current `MySqlError` shape omits transport-specific fields such as `fatal` as well as a closed set of Node error codes.                                                                    | `src/errors.ts:12-19`, `40-190`, `193-209`                                                                        |
| 14 | The only inferred `provider` / `adapterName` class members are the private base members `MySqlQueryable.provider` and `.adapterName`. The public factory members already have explicit annotations. If the connected concrete class becomes public, the inherited base members become publish-surface slow-type risks.                                                                                                                   | inferred: `src/adapter.ts:96-97`; annotated factory: `543-546`                                                    |
| 15 | Measured before any edit, raw `deno publish --dry-run --allow-dirty` exits 0 with no slow-type warning and publishes eight files. The JSR helper reports one `F-JSR-7` warning only because it counts the banner “Checking for slow types…”; the `jsr-audit` skill says raw dry-run output is authoritative, so that helper row is a baseline false positive rather than a real slow type today.                                         | package-root dry-run exit 0; `audit-jsr-package.ts --root packages/prisma-adapter-mysql --text` output            |
| 16 | Measured before any edit, `deno doc --lint packages/prisma-adapter-mysql/mod.ts` exits 1 with exactly six `private-type-ref` errors: transaction `options` -> private `TransactionOptions`; transaction `queryRaw` -> private `SqlQuery` and `SqlResultSet`; connected `queryRaw` -> private `SqlQuery` and `SqlResultSet`; connected `startTransaction` -> private `IsolationLevel`.                                                    | diagnostics at `src/adapter.ts:502`, `504` (2 refs), `522` (2 refs), and `530-532`                                |
| 17 | Package-owned public aliases already exist for query, result, and isolation level (`PrismaMySqlQuery`, `PrismaMySqlResultSet`, `PrismaMySqlIsolationLevel`) but the two public adapter interfaces mistakenly reference the upstream private imports instead. There is no package-owned transaction-options alias.                                                                                                                        | `src/adapter.ts:443-481` versus `496-532`                                                                         |
| 18 | `examples/basic-usage.ts` is not in the publish set. `publish.include` omits it and `publish.exclude` explicitly lists `examples/**`; the raw dry-run file list confirms exclusion. Its correction is still required as package-owned consumer evidence, but it does not alter the published artifact.                                                                                                                                   | `deno.json:14-29`; dry-run file list contains no `examples/` path                                                 |
| 19 | The package example imports `../src/mod.ts`, advertises the inert callback, catches query failure separately, and cannot prove callback behavior. It should consume `../mod.ts` and be aligned with the selected hook semantics.                                                                                                                                                                                                         | `examples/basic-usage.ts:21`, `37-42`, `66-79`                                                                    |
| 20 | The docs-owned reference currently says the hook is unsupported and blocked on #1293. It becomes false when the hook is wired, but this leaf must report it in future `drift.md`/PR handoff rather than edit it.                                                                                                                                                                                                                         | `docs/site/reference/prisma-adapter-mysql/index.md:23`                                                            |
| 21 | JSR dependency-pin risk is present but bounded: the package publishes external npm dependencies through `package.json` `catalog:` (`@prisma/driver-adapter-utils`, `mysql2`), materialized from root versions. No `@netscript/*` dependency is imported by any publishable member, so the exact-internal-pin subcheck is currently N/A rather than silently passed.                                                                      | `package.json:2-5`; root `deno.json:234,249`; source imports                                                      |
| 22 | The JSR runtime-asset/import-meta risk is absent in current publishable source: no publishable runtime asset reads or top-level `import.meta` path resolution are used. The only `import.meta.main` is in the excluded example.                                                                                                                                                                                                          | publish file list; `examples/basic-usage.ts:87-90`                                                                |

## What “connection error” can mean here

The current code does not support treating the hook as one mechanical override:

| Boundary                          | Current behavior                                                 | Already through `errors.ts`? | Hook-design consequence                                                                         |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Capability probe / first pool use | Failure swallowed; `connect()` returns conservative capabilities | No                           | Must decide whether to notify and preserve fallback, or reject `connect()`                      |
| Pooled `queryRaw` / `executeRaw`  | Throws mapped `DriverAdapterError` for recognized driver errors  | Yes                          | Hook requires a connection-vs-SQL predicate or it over-reports ordinary query failures          |
| `executeScript`                   | Raw rejection                                                    | No                           | Decide whether to normalize and/or notify consistently                                          |
| Transaction pool acquisition      | Raw rejection via deferred                                       | No                           | Unambiguously connection lifecycle; should be considered by the hook                            |
| Transaction isolation / `BEGIN`   | Raw rejection via deferred                                       | No                           | Connection/transaction-start failure; should be considered by the hook                          |
| Transaction queries               | Same mapped path as ordinary query                               | Yes                          | Same predicate problem as pooled queries                                                        |
| `COMMIT` / `ROLLBACK`             | Raw rejection, cleanup still runs                                | No                           | Transaction operation failure; not necessarily a connection-hook event                          |
| Disposal (`pool.end`)             | Raw rejection                                                    | No                           | Close failure is lifecycle failure, but not obviously the advertised connection-error predicate |

The already-published `(err: Error) => void` fixes the callback value shape only. It does not decide
the predicate, whether callback exceptions may mask the primary driver error, whether the callback
is observational or alters control flow, or whether capability-probe failure remains non-fatal.

## jsr-audit surface scan

- Surface scanned: full package export map (`.` -> `./mod.ts`) and the raw publish file list.
- `jsrAudit.applicable`: **true**.
- Named risks for the plan:
  1. intentional export-map/symbol delta and constructor/private-type leakage if the concrete class
     is exported;
  2. explicit annotations for inherited `provider` / `adapterName` before they become public;
  3. repair the six measured `private-type-ref` diagnostics rather than claiming they were clean;
  4. verify `catalog:` materialization and confirm there are no touched `@netscript/*` dependencies
     requiring exact pins;
  5. reject runtime asset reads, import attributes, and top-level `import.meta` filesystem paths in
     the publish dry-run/preflight review.
- Baseline slow-types verdict: raw package dry-run is green with no actual slow-type warning today;
  the helper's one banner-count warning is not authoritative.
- Baseline doc-lint verdict: **FAIL (6 pre-existing diagnostics)**, enumerated above.

## Acceptance implications

1. **Class/surface box:** a surface diff can prove either a value-class export or a type-only
   symbol, but the current checkbox explicitly demands the former. The plan cannot substitute the
   already-shipped interface without an owner/PLAN-EVAL acceptance ruling.
2. **Hook box:** the option is already named, typed, and published. Evidence must prove the selected
   predicate at every selected boundary and prove that the primary error still propagates.
3. **Annotations/doc-lint box:** explicit base-member annotations alone are insufficient; the six
   private upstream type references must also be replaced with public package-owned types for a
   clean doc-lint result.
4. **#1112 example box:** the features leaf can update and verify the package-owned example and hand
   a shipped surface to #1112. It cannot truthfully claim the docs-owned #1112 site rewrite is
   complete. The close-gate mapping therefore needs the owner/coordinator to reconcile the literal
   checkbox with the stated lane boundary before a PR carrying `Closes #1293` can become
   `status:ready-merge`.

## Open questions (must resolve before implementation)

1. Does the owner retain the literal value-class export requirement, accepting the constructor and
   client-port surface it entails, or revise the criterion to the already-shipped connected adapter
   interface/type contract?
2. Which predicate fires `onConnectionError`: only checked-out connection `error` events (upstream
   Prisma precedent), acquisition/start failures, classified transport/capacity/auth failures from
   queries, or every driver error? A blanket `onError()` override is not semantically equivalent to
   a connection-error hook.
3. Is capability-probe failure still deliberately non-fatal after notification, or should
   `connect()` reject?
4. Are callback-thrown errors swallowed/logged to preserve the primary driver error, or allowed to
   replace it? The recommendation is observational-only and never masks the primary error.
5. How will acceptance box 4 be reconciled with the explicit prohibition on editing #1112's
   docs-owned file while this PR must carry `Closes #1293`?
