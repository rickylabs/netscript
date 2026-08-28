# Research — fix-prisma-mysql-honest-example--0.0.7

## Re-baseline

- Carried-in sources: the topic brief, coordinator envelope amendment, live issue #1112, the
  verified anchors at `cf648f1ff973d74c213bb125a6f5f5b9328e693b`, and the completed #1293/#1662
  handoff under `.llm/runs/feat-prisma-mysql-adapter-surface--1293/`.
- Re-derived against immutable `main` / leaf base `cf648f1ff973d74c213bb125a6f5f5b9328e693b` on
  2026-08-28.
- Git truth: `HEAD`, the requested base commit, and their merge-base are the same SHA; branch is
  `fix/prisma-mysql-honest-example`; the branch has no upstream by design; the tree was clean before
  research and after all read-only/base-gate commands.
- Live issue authority: #1112 is OPEN, milestone `0.0.7`, with `type:docs`, `status:triage`,
  `priority:p1`, and `area:database`. Its five acceptance boxes require corrected driver claims, a
  complete import-correct example, runtime/connection/pooling/timeout documentation, observable
  option behavior, and compile/test evidence.
- What changed versus the carried-in warning: #1662 has shipped
  `PrismaMySqlOptions.onConnectionError`; the site warning that the hook is unsupported is now
  false. No #1664 or #1293 issue text was modified or reinterpreted.
- Coordinator amendment re-baseline: `examples/basic-usage.ts` and `tests/connection_errors_test.ts`
  are now owned. The example preserves the same false driver story and comments out its entire
  Prisma path; the existing test owns injected pool-client cleanup behavior but has no translator
  access or positive close-count assertion.
- Coordinator TLS ruling: the option defect remains real, but tightening mysql2 TLS behavior is a
  breaking change outside this documentation leaf. The settled remedy is deprecation plus exact
  legacy-behavior documentation and characterization tests, with no runtime semantic change.
- PLAN-EVAL cycle 1 evaluated plan head `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` as `FAIL_PLAN`.
  Its blocking import finding was reproduced and resolved through an exact detached scratch probe;
  no product or lockfile mutation occurred in this worktree.
- Fresh Tier-A then failed repaired head `3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone:
  deleting the scratch-generated output left the tracked static import permanently unresolved under
  the ordinary 12-file package-root check. F2-F4 were accepted.
- PLAN-EVAL cycle 2 evaluated `da769cd7c8e0438f2317ed761ec10bce15692d03` as terminal `FAIL_PLAN` on
  F1-b. It proved on Deno 2.9.5 that literal dynamic `await import('./.generated/client.ts')`
  remains green with generated output absent and retains real generated types when output is
  present. The owner accepted the finding and authorized this bounded plan correction; no cycle 3 or
  third evaluator follows.

## Derivation method

The falsehood census and executable-example evidence were derived in seven passes rather than copied
from the supplied anchors:

1. Rendered the root public surface with `deno doc packages/prisma-adapter-mysql/src/mod.ts` and
   filtered `PrismaMySql` / `PrismaMySqlOptions` before broad source reads.
2. Searched all seven frozen paths case-insensitively for the driver/runtime vocabulary (`native`,
   `deno_mysql`, `mysql2`, `mariadb`, `driver`, `socket`), lifecycle vocabulary (`connect`,
   `dispose`, `disconnect`, `pool`), and every public option name.
3. Read all seven paths with line numbers and traced every public type and option into `adapter.ts`;
   then searched the package for every legacy driver-type use.
4. Compared the examples with Prisma 7's installed `PrismaClientOptions` and
   `SqlDriverAdapterFactory` declarations. Prisma requires the factory in `adapter:`; the site
   currently passes the already-connected adapter. The repo's generated Deno client convention is
   `schema/.generated/client.server.ts`, not the README's fictional `generated/client/mod.ts`.
5. Direct-check measured `examples/basic-usage.ts` as green at base only because lines 53-62 are
   comments; the focused `connection_errors_test.ts` baseline is 33/33 and proves error paths but
   not structured translation or successful close invocation.
6. Reproduced Tier-A F1 from a pristine `git archive` of `3e0f2223a`: a static import from
   `./.generated/client.ts` fails the ordinary root wrapper after cleanup. The first repair used a
   non-literal URL dynamic import to keep all 12 package files selected and green, but that form
   erased generated-client typing in the shipped example.
7. Read PLAN-EVAL cycle 2's exact artifact and accepted Deno 2.9.5 probes: literal dynamic
   `await import('./.generated/client.ts')` also keeps all 12 package files selected and green
   before generation and after cleanup. With a real Prisma 7.8.0 client present under the scratch
   config, the actual example retains generated types; a deliberate misuse produced `TS2322` rather
   than passing as `any`.

## False or stale line census

`Correct` means rewrite the occurrence in the later implementation grant. `Delete` means remove the
stale occurrence/surface. `Leave` means retain it deliberately; where relevant the reason is a
compatibility constraint. Adjacent lines are grouped only when they make one indivisible claim.

| #  | Path:line(s)                                                            | Current claim or surface                                                                                                             | Disposition                    | Evidence / rationale                                                                                                                                                                                                                                                                                                                                                                       |
| -- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | `docs/site/reference/prisma-adapter-mysql/index.md:8`                   | The adapter dynamically imports npm `mysql2/promise` rather than using native Deno TCP directly.                                     | Leave                          | Accurate against `adapter.ts:23,634`; keep as the site summary.                                                                                                                                                                                                                                                                                                                            |
| 2  | `docs/site/reference/prisma-adapter-mysql/index.md:14`                  | `mysql2/promise` is dynamically imported at runtime.                                                                                 | Leave                          | Accurate at `adapter.ts:634`.                                                                                                                                                                                                                                                                                                                                                              |
| 3  | `docs/site/reference/prisma-adapter-mysql/index.md:15`                  | “Fully compatible” with Deno's Node layer/npm resolution.                                                                            | Correct                        | “Fully” is an unbounded claim. State the requirement: a runtime/deployment must provide Deno's npm resolution and Node-compat socket APIs.                                                                                                                                                                                                                                                 |
| 4  | `docs/site/reference/prisma-adapter-mysql/index.md:16`                  | The connected adapter owns the pool and callers should call `dispose()`.                                                             | Correct                        | Ownership is context-sensitive: Prisma receives the factory, calls `connect()`, and disposes the connected adapter through `$disconnect()`; a caller that invokes `connect()` directly owns `dispose()`.                                                                                                                                                                                   |
| 5  | `docs/site/reference/prisma-adapter-mysql/index.md:17`                  | `timeout` maps to mysql2 `connectTimeout`.                                                                                           | Leave, expand                  | Accurate at `adapter.ts:735`; clarify it covers initial connection establishment, not query/transaction/idle timeout, and mysql2 supplies its default when omitted.                                                                                                                                                                                                                        |
| 6  | `docs/site/reference/prisma-adapter-mysql/index.md:18`                  | Direct connection strings are unsupported; structured fields are required.                                                           | Leave, expand                  | The constructor accepts only `MySqlConnectionConfig`; `toMysql2PoolOptions` maps fields. Do not imply the higher-level `@netscript/database` wrapper has the same restriction.                                                                                                                                                                                                             |
| 7  | `docs/site/reference/prisma-adapter-mysql/index.md:22-23`               | `onConnectionError` is unsupported and blocked on #1293.                                                                             | Delete/replace                 | False after #1662. Replace with the exact published `types.ts:39-42` contract; do not alter #1293's owner-only wording.                                                                                                                                                                                                                                                                    |
| 8  | `docs/site/reference/prisma-adapter-mysql/index.md:26`                  | Import `PrismaClient` from `@prisma/client`.                                                                                         | Correct                        | A pasteable NetScript/Deno example imports the generated client at its actual `schema/.generated/client.server.ts` path.                                                                                                                                                                                                                                                                   |
| 9  | `docs/site/reference/prisma-adapter-mysql/index.md:40-47`               | Manually connect the factory and pass `PrismaMySqlConnectedAdapter` to `PrismaClient`.                                               | Correct                        | Prisma 7 `PrismaClientOptions.adapter` requires `SqlDriverAdapterFactory`; pass `new PrismaMySql(...)` directly and let Prisma call `connect()`.                                                                                                                                                                                                                                           |
| 10 | `docs/site/reference/prisma-adapter-mysql/index.md:49-57`               | Query then call both `$disconnect()` and `adapter.dispose()`.                                                                        | Correct                        | Use `try/finally` with `$disconnect()` for the factory-owned Prisma flow; avoid manual double-disposal. Explain direct-connect ownership separately.                                                                                                                                                                                                                                       |
| 11 | `docs/site/reference/prisma-adapter-mysql/index.md:61-62`               | The connected adapter is what callers pass to Prisma.                                                                                | Correct                        | The factory is passed to Prisma; `connect()` returns the internal lifecycle object Prisma owns.                                                                                                                                                                                                                                                                                            |
| 12 | `docs/site/reference/prisma-adapter-mysql/index.md:94`                  | Config table lists the eight structured option groups.                                                                               | Leave, expand                  | The list is complete, but must mark `verify_identity` deprecated and state both branches of its exact legacy mysql2 mapping.                                                                                                                                                                                                                                                               |
| 13 | `docs/site/reference/prisma-adapter-mysql/index.md:95`                  | `PrismaMySqlOptions` contains only `database?`.                                                                                      | Correct                        | It omits the shipped `onConnectionError?` option.                                                                                                                                                                                                                                                                                                                                          |
| 14 | `docs/site/reference/prisma-adapter-mysql/index.md:98-106`              | Public driver interfaces describe a wrapped `deno_mysql` client.                                                                     | Delete                         | The adapter wraps mysql2, and the three exported legacy types are unused by implementation. Remove the section with the stale exports.                                                                                                                                                                                                                                                     |
| 15 | `packages/prisma-adapter-mysql/README.md:7-8`                           | Deno-native MySQL driver with no Node socket internals.                                                                              | Correct                        | False: mysql2 uses the runtime's Node-compatible socket path.                                                                                                                                                                                                                                                                                                                              |
| 16 | `packages/prisma-adapter-mysql/README.md:10-16`                         | The package replaces mariadb with a Deno-native client and works with any Prisma Client on Deno.                                     | Correct                        | Preserve the relevant mariadb contrast, but name dynamic mysql2 and narrow compatibility to generated Prisma 7 clients in a Deno runtime/deployment with npm/Node compatibility.                                                                                                                                                                                                           |
| 17 | `packages/prisma-adapter-mysql/README.md:20-22`                         | “Deno-native driver” feature.                                                                                                        | Correct                        | Replace with an honest mysql2/npm feature and deployment consequence.                                                                                                                                                                                                                                                                                                                      |
| 18 | `packages/prisma-adapter-mysql/README.md:25-27`                         | Pool opens when Prisma connects; connected adapter exposes disposal.                                                                 | Correct                        | Core fact is right; add the factory-versus-connected ownership rule and deterministic cleanup path.                                                                                                                                                                                                                                                                                        |
| 19 | `packages/prisma-adapter-mysql/README.md:45-53`                         | Quick example substitutes a `declare const PrismaClient` and points to `generated/client/mod.ts`.                                    | Delete/replace                 | This masks import/type errors and is not pasteable. Use the repo's generated Deno client import convention.                                                                                                                                                                                                                                                                                |
| 20 | `packages/prisma-adapter-mysql/README.md:55-70`                         | Factory → one query → trailing disconnect.                                                                                           | Correct                        | Keep the factory flow but add real import, `try/finally`, timeout/hook configuration, and deterministic `$disconnect()`.                                                                                                                                                                                                                                                                   |
| 21 | `packages/prisma-adapter-mysql/README.md:97-100`                        | Deno + `--allow-net` compatibility note.                                                                                             | Correct                        | Add the dynamic npm/Node-compat requirement, no direct connection-string form, and timeout/pool/TLS constraints.                                                                                                                                                                                                                                                                           |
| 22 | `packages/prisma-adapter-mysql/src/mod.ts:4-10`                         | Published module JSDoc says Deno-native mysql replaces npm mariadb.                                                                  | Correct                        | This is the JSR/`deno doc` landing page and is currently the most visible false claim.                                                                                                                                                                                                                                                                                                     |
| 23 | `packages/prisma-adapter-mysql/src/mod.ts:14`                           | Module example imports generic `@prisma/client`.                                                                                     | Correct                        | Use an import-shaped generated-client example consistent with NetScript's Deno generator output.                                                                                                                                                                                                                                                                                           |
| 24 | `packages/prisma-adapter-mysql/src/mod.ts:17-35`                        | Incomplete example without `try/finally`.                                                                                            | Correct                        | Keep factory construction but make query and cleanup deterministic and consistent with README/site.                                                                                                                                                                                                                                                                                        |
| 25 | `packages/prisma-adapter-mysql/src/mod.ts:53-55`                        | Root exports `DenoMySqlClient`, `DenoMySqlConnection`, and `ExecuteResult`.                                                          | Delete                         | They model a driver no longer used and create a false published surface.                                                                                                                                                                                                                                                                                                                   |
| 26 | `packages/prisma-adapter-mysql/src/adapter.ts:2`                        | “for Deno” title.                                                                                                                    | Leave                          | The package targets Deno; this does not claim a Deno-native driver.                                                                                                                                                                                                                                                                                                                        |
| 27 | `packages/prisma-adapter-mysql/src/adapter.ts:4-7`                      | Vague Deno-compatible driver / adapted mariadb story.                                                                                | Correct                        | Name the dynamically imported mysql2 driver and Node/npm compatibility boundary.                                                                                                                                                                                                                                                                                                           |
| 28 | `packages/prisma-adapter-mysql/src/adapter.ts:30`                       | Debug namespace `prisma:driver-adapter:deno-mysql`.                                                                                  | Leave                          | This is observable `DEBUG=` filter behavior, not prose. Renaming it would silently break existing filters; retain as a legacy compatibility namespace and call that out in the plan.                                                                                                                                                                                                       |
| 29 | `packages/prisma-adapter-mysql/src/adapter.ts:173-175`                  | Internal comment attributes `query`/`execute` selection to `deno_mysql`.                                                             | Correct                        | Internal, but directly false and inside the frozen path. An honesty sweep should not leave misleading maintenance instructions.                                                                                                                                                                                                                                                            |
| 30 | `packages/prisma-adapter-mysql/src/adapter.ts:214-217`                  | Internal field-metadata workaround is attributed to `deno_mysql`.                                                                    | Correct                        | Same judgment as row 29; rewrite against the actual wrapper behavior.                                                                                                                                                                                                                                                                                                                      |
| 31 | `packages/prisma-adapter-mysql/src/adapter.ts:331-334`                  | Adapter JSDoc says it wraps `deno_mysql`.                                                                                            | Correct                        | False against imports and runtime loading.                                                                                                                                                                                                                                                                                                                                                 |
| 32 | `packages/prisma-adapter-mysql/src/adapter.ts:336-349`                  | JSDoc example imports generic Prisma client and omits cleanup.                                                                       | Correct                        | Keep one coherent factory example or remove duplication; no contradictory lifecycle example may remain.                                                                                                                                                                                                                                                                                    |
| 33 | `packages/prisma-adapter-mysql/src/adapter.ts:468-485`                  | “Factory” JSDoc/example is attached to `PrismaMySqlQuery`.                                                                           | Delete/replace                 | `deno doc` currently renders this wrong description under the query interface. Replace with query-shape documentation; do not preserve the misplaced example.                                                                                                                                                                                                                              |
| 34 | `packages/prisma-adapter-mysql/src/adapter.ts:644`                      | Catch comment mentions connection-string parsing.                                                                                    | Correct                        | This factory accepts no string. Describe pool-construction/configuration errors without inventing a string form.                                                                                                                                                                                                                                                                           |
| 35 | `packages/prisma-adapter-mysql/src/types.ts:5-30`                       | Structured connection option surface.                                                                                                | Correct/deprecate              | Every top-level field is read, but `verify_identity` overstates current forwarding. Add a JSDoc `@deprecated` tag to that existing member and document its unchanged legacy behavior; add no replacement mode.                                                                                                                                                                             |
| 36 | `packages/prisma-adapter-mysql/src/types.ts:32-44`                      | `database` plus the exact `onConnectionError` contract.                                                                              | Leave, expand surrounding docs | Both are observable. The hook paragraph is the authority the site must reproduce accurately.                                                                                                                                                                                                                                                                                               |
| 37 | `packages/prisma-adapter-mysql/src/types.ts:55-89`                      | `ExecuteResult`, `QueryResult`, and `FieldInfo` legacy result/metadata shapes.                                                       | Delete                         | Repo-wide symbol tracing finds no implementation/test consumers; `ExecuteResult` only supports the stale Deno client interfaces, while the other two are dead published-source residue.                                                                                                                                                                                                    |
| 38 | `packages/prisma-adapter-mysql/src/types.ts:91-134`                     | `deno_mysql` client/connection interfaces.                                                                                           | Delete                         | False driver surface; only self-references and the root re-export remain.                                                                                                                                                                                                                                                                                                                  |
| 39 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:4`               | Calls the package the “Deno MySQL adapter.”                                                                                          | Correct                        | Name the mysql2-backed adapter and runtime boundary; this is another false driver occurrence owned by the census.                                                                                                                                                                                                                                                                          |
| 40 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:11-18`           | Generation/run commands imply the checked-in file is a complete executable Prisma example.                                           | Correct                        | State the real generated-client/schema prerequisite and minimum Deno permissions; do not imply the package carries a schema/client.                                                                                                                                                                                                                                                        |
| 41 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:21`              | Imports only `PrismaMySql`.                                                                                                          | Correct                        | At module scope, add literal dynamic `const { PrismaClient } = await import('./.generated/client.ts');`. Deno 2.9.5 keeps the clean root check green while output is absent; with output present, gate 5 types this actual file against the generated client. The example/README prerequisites must say `@prisma/client` is consumer-resolvable through an import map or `npm:` specifier. |
| 42 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:23-31`           | Structured configuration omits timeout/TLS explanation.                                                                              | Leave, expand                  | The fields are valid; demonstrate supported timeout/pool behavior without inventing a connection string or promoting the deprecated TLS mode. Document its exact legacy behavior in prose instead.                                                                                                                                                                                         |
| 43 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:36-51`           | Calls `factory.connect()` and treats the connected adapter as the normal Prisma path.                                                | Correct                        | The ordinary application path passes the factory directly to `PrismaClient`; direct connect is a separate ownership case.                                                                                                                                                                                                                                                                  |
| 44 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:53-62`           | Entire Prisma import/client/query/disconnect path is commented out, uses the connected adapter, and has no `finally`.                | Delete/replace                 | Make the literal dynamic client load, factory construction, Prisma query, and `$disconnect()` in `finally` live. Ordinary root checking proves the stable shell only while output is absent; gate 5 types the actual example with output present, retains the D17 wrapper, and runs the guarded import smoke.                                                                              |
| 45 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:64-80`           | Raw connected-adapter query stands in for Prisma usage.                                                                              | Delete/replace                 | Acceptance requires a Prisma query; remove the substitute path.                                                                                                                                                                                                                                                                                                                            |
| 46 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:82-85`           | Manually disposes the connected adapter.                                                                                             | Correct                        | The Prisma flow owns cleanup through `$disconnect()` in `finally`.                                                                                                                                                                                                                                                                                                                         |
| 47 | `packages/prisma-adapter-mysql/examples/basic-usage.ts:88-90`           | Top-level failure is only logged.                                                                                                    | Correct                        | Preserve the error and set a failing exit status so the executable example does not report success after failure.                                                                                                                                                                                                                                                                          |
| 48 | `packages/prisma-adapter-mysql/tests/connection_errors_test.ts:4`       | Test imports adapter internals directly.                                                                                             | Leave, expand                  | This is the prescribed source-level boundary. Add `toMysql2PoolOptions` here, not to either package barrel.                                                                                                                                                                                                                                                                                |
| 49 | `packages/prisma-adapter-mysql/tests/connection_errors_test.ts:387-393` | Successful disposal asserts only that the hook was not notified.                                                                     | Leave, extend                  | Count `FakePoolClient.close()` and assert successful cleanup invocation exactly once.                                                                                                                                                                                                                                                                                                      |
| 50 | `packages/prisma-adapter-mysql/src/adapter.ts:518-523`                  | Public `PrismaMySqlResultSet.columnTypes` is declared as `number[]`, wider than Prisma 7's `SqlResultSet.columnTypes: ColumnType[]`. | Correct                        | Narrow the declaration to `SqlResultSet['columnTypes']`. The runtime implementation already returns mapped Prisma column types; the correction is type-only and makes `PrismaMySqlAdapterFactory` structurally compatible with a real generated client.                                                                                                                                    |

### Driver-claim census authority

The table—not a hard-coded occurrence count—is the acceptance authority. In particular, census row
15 owns the README summary at `README.md:7`, and row 14 owns the site driver table at
`index.md:98-106` including its `deno_mysql` references, in addition to the more isolated
occurrences elsewhere. The implementation gate applies every `Correct`/`Delete` row and repeats the
same seven-path vocabulary search. Only the runtime debug string at `src/adapter.ts:30` may remain;
it is an intentionally retained compatibility namespace rather than prose.

## Public option audit

All line numbers are at immutable base `cf648f1ff`. “Reaches mysql2” distinguishes driver config
from adapter/Prisma metadata behavior.

| Public option                           | Read by `adapter.ts`                                                                       | Reaches mysql2?                                  | Observable behavior / finding                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hostname?`                             | `toMysql2PoolOptions`, `:727`                                                              | Yes, `host`                                      | mysql2 defaults to localhost when omitted.                                                                                                                                                                                                                                        |
| `port?`                                 | `:728`                                                                                     | Yes, `port`                                      | mysql2 defaults to 3306 when omitted.                                                                                                                                                                                                                                             |
| `username?`                             | `:729`                                                                                     | Yes, `user`                                      | Direct rename into mysql2.                                                                                                                                                                                                                                                        |
| `password?`                             | `:730`                                                                                     | Yes, `password`                                  | Direct mapping into mysql2.                                                                                                                                                                                                                                                       |
| `db?`                                   | `:731`; fallback at `:626`                                                                 | Yes, `database`                                  | Selects the mysql2 database and becomes Prisma `schemaName` unless the adapter-level `database` override is supplied.                                                                                                                                                             |
| `poolSize?`                             | `:733`                                                                                     | Yes, `connectionLimit`                           | Adapter deliberately overrides mysql2's default 10 with its own default 1.                                                                                                                                                                                                        |
| `timeout?`                              | `:735`                                                                                     | Yes, `connectTimeout`                            | Initial connection establishment only; it is not a query, transaction, queue, idle, or total-operation timeout. mysql2 defaults to 10 seconds when omitted.                                                                                                                       |
| `tls.mode?: 'disabled'`                 | condition at `:738`                                                                        | By omission                                      | Leaves `ssl` unset, so TLS is not requested. This is observable and intentional.                                                                                                                                                                                                  |
| `tls.mode?: 'verify_identity'`          | condition at `:738`                                                                        | Partially                                        | **Finding and settled disposition:** deprecate the member. Without non-empty `caCerts`, `ssl` remains unset, so the connection is plaintext and no TLS is requested. With non-empty CAs, only joined `ssl.ca` is forwarded; mysql2 hostname identity verification is not enabled. |
| `tls.caCerts?`                          | `:738-739`                                                                                 | Yes, `ssl.ca` when paired with `verify_identity` | Joined with newlines. Supplied alone, with `mode: 'disabled'`, or as an empty list it is ignored and `ssl` remains unset. Document and characterize this legacy behavior; do not change it in this leaf.                                                                          |
| `PrismaMySqlOptions.database?`          | normalized at `:624-627`, read at `:378`                                                   | No                                               | Observable as Prisma connection metadata `schemaName`; overrides only reported schema metadata, not mysql2's selected `config.db`.                                                                                                                                                |
| `PrismaMySqlOptions.onConnectionError?` | notifier at `:34-52`; propagated to query/script/transaction/dispose/capability boundaries | No                                               | Observable adapter callback with the exact classifier/containment contract in `types.ts:39-42`; it is not a mysql2 option and is not dropped.                                                                                                                                     |

The only accepted option whose name is not honestly implemented is `tls.mode: 'verify_identity'`.
The finding stands, but the non-breaking remedy is now settled as deprecation in the existing public
type and docs, not implementation. Without non-empty `caCerts`, the translator leaves `ssl` unset:
the connection is plaintext and no TLS is requested. With non-empty `caCerts`, it forwards only the
joined `ssl.ca`; mysql2 hostname identity verification is not enabled. Characterization tests will
pin both branches through the internal-source translator seam, including the existing behavior that
CAs supplied with `mode: 'disabled'` are ignored. Any behavior change or removal is deferred to a
separately scoped breaking change.

## Example and lifecycle findings

1. `PrismaMySql` is a class/factory alias, not a plain factory function. Its constructor accepts
   `MySqlConnectionConfig` plus optional `PrismaMySqlOptions`; all option names in the module
   example exist.
2. Prisma 7 requires a `SqlDriverAdapterFactory` in `new PrismaClient({ adapter })`. The correct
   application flow passes the `PrismaMySql` factory directly. The site is wrong to call `connect()`
   first and pass `PrismaMySqlConnectedAdapter`.
3. NetScript-generated application clients are imported from a schema-specific
   `schema/.generated/client.server.ts`. The standalone package example targets
   `./.generated/client.ts`, matching Prisma's `provider = "prisma-client"`, `runtime = "deno"`
   output, through literal dynamic `await import('./.generated/client.ts')`. The README's ambient
   declaration and fictional `generated/client/mod.ts` path hide import failures. Both the example
   and README must state that generated output needs `@prisma/client` resolvable through the
   consumer's import map or an `npm:` specifier; the root catalog is not an import map.
4. In the normal Prisma flow, `$disconnect()` triggers disposal of the connected driver adapter and
   therefore `pool.end()` through `adapter.ts:451-458,700-702`. A direct caller of
   `factory.connect()` owns the returned adapter and must call its `dispose()` itself.
5. Connection strings are not a form of this low-level package's constructor. Only structured
   options are accepted. Higher-level `@netscript/database` may normalize a connection string before
   constructing this factory; that is a separate surface.
6. The checked-in `basic-usage.ts` is not merely incomplete documentation: its Prisma import,
   construction, query, and disconnect are comments, while the live path manually connects and calls
   `connectedAdapter.queryRaw()`. Its direct base check selects one file and reports zero
   diagnostics precisely because the required Prisma path is dead text.
7. A corrected checked-in example can use the stated `prisma generate` prerequisite and literal
   dynamic `await import('./.generated/client.ts')`; site/README/module examples use the NetScript
   Deno generated-client location appropriate to those contexts. Every form passes the factory and
   uses the same Prisma query/cleanup semantics. This is temporary Prisma 7 correctness work ahead
   of Prisma 8 and the Prisma-next database-layer rewrite, not a new abstraction or durable design
   commitment.

## Generated-client probes and Tier-A F1 repair

The first evaluator finding was correct: no generated client exists in the repository,
`@prisma/client` is catalog-only rather than an import-map entry, and its ungenerated Prisma 7 stub
would not provide semantic evidence. The first repair found the real adapter mismatch but used a
static import that only resolved while generated output existed. Tier-A then measured the missing
post-cleanup condition: in a pristine tracked-files archive, the ordinary package-root wrapper
selected 12 files and failed `TS2307` after generated output was absent. Scoping gate 5 to `mod.ts`
hid that permanent failure. Excluding `examples/**` would merely stop checking the example and is
rejected.

The second repair used a non-literal URL and restored the clean-root result, but PLAN-EVAL cycle 2
proved that it unnecessarily erased the generated type in the actual example. At module scope, the
owner-authorized corrected shell instead uses a literal dynamic import:

```ts
const { PrismaClient } = await import('./.generated/client.ts');
```

On Deno 2.9.5, an unresolved literal dynamic import is deferred to runtime; only a static import
fails `TS2307`. From a pristine archive of exact head `da769cd7c8e0438f2317ed761ec10bce15692d03`,
with no generated output and no untracked residue possible, the ordinary structured command

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts \
  --root packages/prisma-adapter-mysql --ext ts,tsx
```

selected all 12 files, reported zero failed batches/diagnostics, and exited 0. After the specialized
gate generated and then removed the client, the same ordinary command again selected 12 files and
exited 0. No exclude was used. This evidence validates the stable tracked example shell. Because the
client is absent, `PrismaClient` and `prisma` remain untyped at this root-check level; the result is
not described as full generated-client type checking. Gate 1 is undefined while `.generated` exists,
when the root walk would include generated files and encounter the consumer import-map gap.

The specialized job supplies real generated evidence. An uncommitted `.llm/tmp` schema generates a
real Prisma 7.8.0 Deno client into `examples/.generated`; the scratch consumer config maps the
Prisma runtime packages and disables `isolatedDeclarations` for generated code. With that client
present, the structured wrapper checks the actual `examples/basic-usage.ts` and must select one file
with zero diagnostics. Cycle-2 misuse probes confirm this is the real type rather than `any`: a
deliberate number assignment produced `TS2322`, and passing the connected adapter produced `TS2741`
because its required factory `connect` method is missing. A scratch-only compatibility wrapper also
statically imports the real client and package factory; it remains focused evidence for the D17
`SqlResultSet['columnTypes']` correction rather than a substitute for checking the shipped example.

Finally, this import-only smoke executed the actual tracked module's dynamic import after
generation:

```text
deno eval --no-lock --config=.llm/tmp/prisma-example-check-deno.json \
  'await import(new URL("./packages/prisma-adapter-mysql/examples/basic-usage.ts", import.meta.url).href); console.log("dynamic-import-smoke:ok")'
```

It exited 0 and printed `dynamic-import-smoke:ok`. The smoke is safe only because the module keeps
the `main()` invocation exclusively inside its `import.meta.main` guard; importing leaves that
condition false, so the Prisma query and MySQL connection did not run. No ambient declaration,
`// @ts-ignore`, ungenerated `@prisma/client` stub, exclusion, checked-in schema/client/config, or
eighth product path is involved. The scratch output is removed before the repeated clean-root gate.

## Testability seam audit

- **Cleanup seam exists:** `PrismaMySqlAdapter` constructor injection at `adapter.ts:353-358`
  accepts the structural `MysqlPoolClient`; `dispose()` delegates to `client.close()` at `:451-458`.
  Existing tests import the internal class directly and inject `FakePoolClient`, proving the seam is
  usable without MySQL. Current cleanup coverage checks notification/error preservation and a
  successful no-notification path, but does not assert exactly-once pool closure.
- **Connection-option translation seam does not exist at base:** `toMysql2PoolOptions` is a private
  local function at `adapter.ts:725-743`, and `PrismaMySqlAdapterFactory.connect()` hard-wires the
  dynamic `import('mysql2/promise')` and `createPool` at `:634-642`. No exported/injected pool
  factory or translation function can be replaced by a focused test.
- **Authorized minimum seam:** export `toMysql2PoolOptions` from `src/adapter.ts` for direct-source
  import by `connection_errors_test.ts`. Do not re-export it from `src/mod.ts` or package-root
  `mod.ts`, and do not add a pool factory/runtime injection port. Because the export is unreachable
  from the package export map, it is test visibility rather than new published API.
- **Authorized test ownership:** extend `connection_errors_test.ts`, which already owns
  `FakePoolClient` and cleanup behavior. Add exact structured/default/TLS mapping and successful
  exactly-once close assertions there; the TLS cases characterize the unchanged plaintext/CA-only
  legacy mapping rather than a desired future behavior. Do not create another test file.
- The site `examples_test.ts`, a new test file, or any other product path would be an eighth path
  and remains a coordinator rescope.

## Base gate measurements

These are baseline facts, not implementation verdicts. No runtime, Aspire, Docker, browser,
`e2e:cli`, or expensive-gate lease was used.

| Gate                     | Base command                                                                                               | Base result                                      | Classification                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs source format       | `deno task --cwd docs/site check:source-format`                                                            | PASS, `Docs source format: OK`                   | Already green at base.                                                                                                                                              |
| Docs accuracy            | `deno task docs:accuracy`                                                                                  | PASS; 199 published source pages scanned         | Already green but does not detect this page's false driver/lifecycle claims.                                                                                        |
| Existing page doctest    | structured `run-deno-check.ts --root docs/site/reference/prisma-adapter-mysql --ext ts`                    | PASS; exactly 1 file selected                    | Already green false-done: `examples_test.ts` checks only config/factory construction, not the Markdown example, Prisma import/query, or cleanup.                    |
| Actual package example   | structured `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts`       | PASS; exactly 1 file selected                    | Newly measured false-green: the Prisma import/client/query/disconnect block is commented out. The implementation gate must check this file after that path is live. |
| Package check            | structured `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts`                               | PASS; 12 files                                   | Already green at base.                                                                                                                                              |
| Package tests            | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`                           | PASS; 46/46                                      | Already green; no option-translation test.                                                                                                                          |
| Focused connection tests | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts` | PASS; 33/33                                      | Newly measured baseline: error/notification paths pass, but exact option translation and positive close count are absent.                                           |
| Full export-map doc lint | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                         | PASS; root `./mod.ts`, 0 diagnostics             | Already green despite technically false module prose.                                                                                                               |
| Publish dry-run          | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                            | PASS; 8 published files, no slow-type diagnostic | Already green and authoritative for slow types.                                                                                                                     |
| JSR audit                | `.llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                      | Exit 0; one `F-JSR-7` WARN                       | Existing helper counts the normal “Checking for slow types” banner as one warning; raw dry-run above proves no actual slow-type failure.                            |

The plan-repair probes are not base verdicts or implementation gates. They are design evidence. The
first exposed the real `number[]`/`ColumnType[]` contract mismatch. Fresh Tier-A exposed the literal
import's post-cleanup `TS2307`. The final pristine-archive probe passed both honest jobs: ordinary
12-file root selection without generated output, and specialized real-client static/import evidence
after generation. No product change from any probe was retained.

## JSR surface scan

- Export map: one root export, `.` → `./mod.ts`; full export-map doc lint is clean.
- README, description, license, publish include/exclude, and module docs are present.
- JSR risk is semantic rather than syntactic: the module documentation scores clean while making a
  false Deno-native-driver claim, and stale unused Deno driver interfaces inflate the published
  surface.
- Planned removal of root-exported legacy types is a public-surface change on the pre-1.0 line and
  must be made explicit in the PR; no unrelated export or package version work is authorized.

## Open questions and rescope

The coordinator amendments and owner-authorized cycle-2 correction resolve the example import,
focused test path, TLS disposition, seam shape, and test ownership. The tracked example dynamically
targets literal `./.generated/client.ts`; the ordinary root gate selects its stable shell without
generated output, while gate 5 checks the actual example with generated output present, retains the
D17 wrapper, and runs the guarded import smoke. The necessary `SqlResultSet['columnTypes']`
correction stays inside approved `src/adapter.ts`. This is a temporary Prisma 7 correctness measure
ahead of Prisma 8/Prisma-next, not expanded database-layer investment. The leaf deprecates and
characterizes the existing TLS mode without changing it; a TLS behavior change or removal remains a
separately scoped breaking change. No implementation-shaping research question remains open inside
this seven-path envelope.

An eighth product path remains a hard rescope. That includes the site `examples_test.ts`, a new
package test, a checked-in generated client/schema fixture, package-root seam exports, runtime pool
injection, and `CHANGELOG.md`. The pre-1.0 legacy-type deletion must therefore be explicit in PR and
evaluator handoff rather than silently described as a prose-only change.
