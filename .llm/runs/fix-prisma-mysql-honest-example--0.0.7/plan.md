# Plan: honest executable MySQL Prisma adapter example (#1112)

## Run Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7`              |
| Branch         | `fix/prisma-mysql-honest-example`                     |
| Immutable base | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`            |
| Phase          | `plan` — implementation not granted                   |
| Target         | `@netscript/prisma-adapter-mysql` public docs/surface |
| Archetype      | `2 — Integration`                                     |
| Scope overlays | `docs`                                                |
| Issue          | `#1112`, milestone `0.0.7`                            |

> **HARD PATH CEILING:** implementation may modify only these seven product paths:
>
> 1. `docs/site/reference/prisma-adapter-mysql/index.md`
> 2. `packages/prisma-adapter-mysql/README.md`
> 3. `packages/prisma-adapter-mysql/src/adapter.ts`
> 4. `packages/prisma-adapter-mysql/src/mod.ts`
> 5. `packages/prisma-adapter-mysql/src/types.ts`
> 6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
> 7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`
>
> An eighth product path is a rescope. Stop and return to the topic coordinator; do not add another
> test, fixture, changelog, generated asset, config, lockfile, or tool path opportunistically.

## Archetype and doctrine verdict

This is Archetype 2 because the package adapts the external mysql2 system to Prisma's driver-adapter
port. The docs overlay applies because the implementation must tell one source-aligned story across
the site, README, module documentation, checked-in example, and focused test evidence. The current
doctrine verdict is **Keep**: preserve the MySQL integration behind its existing composition root.
A1/A2 require a truthful public contract; A10 requires explicit factory/pool ownership; A14 requires
direct example compilation, semantic tests, doc lint, and publish evidence.

The authorized translator seam is a pure source-internal export from `src/adapter.ts`. It is not
re-exported by `src/mod.ts` or the package root, so it does not create a consumer API or a second
composition mechanism. This avoids AP-14/API inflation and AP-8/runtime injection while giving the
existing direct-source test file the narrow observation point required by acceptance row 5.

## Goal

Make all seven paths tell the same executable truth: construct `PrismaMySql` from structured
options, pass the factory to a generated Prisma client, execute one Prisma query, and disconnect in
`finally`. State that npm `mysql2/promise` is dynamically imported, explain Deno's Node/npm runtime
requirements, document exact pool/timeout/TLS/hook behavior, deprecate the misleading legacy TLS
mode without changing runtime semantics, and prove structured-option translation and successful
cleanup without a live MySQL instance.

## Scope

- Correct every Deno-native / `deno_mysql` prose occurrence enumerated in `research.md`, including
  `examples/basic-usage.ts:4`.
- Replace the commented-out/raw-adapter example with live `PrismaClient` construction, one real
  query, and deterministic `$disconnect()` semantics.
- Compile-check `examples/basic-usage.ts` itself; a transcribed documentation snippet is not the
  gate.
- Remove unused legacy Deno-driver types and their root re-exports/site table.
- Keep the observable legacy debug namespace unchanged.
- Document structured options, pool ownership/default, initial-connect timeout semantics, dynamic
  npm loading, Node/npm compatibility, `--allow-net`, and deployment consequences consistently.
- Replace the false unsupported-hook warning with the exact `onConnectionError` contract from
  `types.ts:39-42`.
- Mark the existing `tls.mode: 'verify_identity'` public type with a JSDoc `@deprecated` tag and
  mark it deprecated in the documentation. State that without non-empty `caCerts` the translator
  leaves `ssl` unset, so the connection is plaintext and no TLS is requested; with non-empty
  `caCerts`, it forwards only joined `ssl.ca`, and mysql2 hostname identity verification is not
  enabled.
- Export `toMysql2PoolOptions` only from `src/adapter.ts` for direct source-level tests; extend
  `tests/connection_errors_test.ts` with characterization assertions for that exact legacy mapping
  and successful-close assertions.

## Non-Scope

- Any eighth product path, including the site `examples_test.ts`, a new package test, changelog,
  schema fixture, config, lockfile, generated client, or validation tooling.
- Re-exporting `toMysql2PoolOptions`, `PrismaMySqlAdapter`, or another testing seam from
  `src/mod.ts` or package-root `mod.ts`.
- A runtime pool factory, dependency-injection port, or other injection mechanism.
- Live MySQL, runtime integration, Aspire, Docker, browser, `e2e:cli`, release gates, or an
  expensive-gate lease.
- Connection-string support in this low-level factory. Higher-level `@netscript/database`
  normalization remains separate.
- Arbitrary Prisma adapters (#1101), #1664, or any mutation/rewording of #1293.
- Renaming `prisma:driver-adapter:deno-mysql`; it remains observable compatibility behavior.
- Changing TLS runtime semantics, enabling mysql2 hostname verification, adding a replacement TLS
  mode, or removing the deprecated mode. Any behavior change or removal requires a separately scoped
  breaking change.
- PLAN-EVAL dispatch from this generator session. The topic orchestrator owns the fresh Tier-A
  evaluator.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                  | Rationale                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Describe the driver as dynamically imported npm `mysql2/promise`, never Deno-native.                                                                                                                                                                                                                                                                                                                                                      | `adapter.ts:23,634` is the implementation authority.                                                                                                  |
| D2  | Pass the `PrismaMySql` factory directly to `new PrismaClient({ adapter })`; do not call `connect()` first.                                                                                                                                                                                                                                                                                                                                | Prisma 7 requires `SqlDriverAdapterFactory`.                                                                                                          |
| D3  | Documentation uses the NetScript generated-Deno-client shape ending in `schema/.generated/client.server.ts`; the checked-in package example uses its stated `prisma generate` prerequisite and a real generated `PrismaClient` import rather than an ambient declaration.                                                                                                                                                                 | Each context names the generated client it can actually resolve; no fake declaration hides import failures.                                           |
| D4  | Normal cleanup is `try/finally { await prisma.$disconnect(); }`; only direct `factory.connect()` callers own `connected.dispose()`.                                                                                                                                                                                                                                                                                                       | Prevents the current connected-adapter type error and double disposal.                                                                                |
| D5  | Direct constructor input remains structured `MySqlConnectionConfig`; no connection string is accepted.                                                                                                                                                                                                                                                                                                                                    | The public type and translator expose fields only.                                                                                                    |
| D6  | `timeout` maps only to mysql2 `connectTimeout`.                                                                                                                                                                                                                                                                                                                                                                                           | It is an initial connection deadline, not a query/transaction/idle deadline.                                                                          |
| D7  | `poolSize ?? 1` maps to `connectionLimit`; Prisma `$disconnect()` reaches `dispose()` → `client.close()` → `pool.end()`.                                                                                                                                                                                                                                                                                                                  | This is the existing ownership chain.                                                                                                                 |
| D8  | Site hook wording is derived from `types.ts:39-42` without broadening it.                                                                                                                                                                                                                                                                                                                                                                 | #1662 shipped the classifier and callback-containment contract.                                                                                       |
| D9  | Delete `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult`, `QueryResult`, and `FieldInfo`, plus stale root exports/site prose.                                                                                                                                                                                                                                                                                                     | They are unused residue from a driver the package no longer uses.                                                                                     |
| D10 | Correct the two internal `deno_mysql` comments.                                                                                                                                                                                                                                                                                                                                                                                           | They are false maintenance guidance inside an owned path.                                                                                             |
| D11 | Leave `Debug('prisma:driver-adapter:deno-mysql')` unchanged and call it a legacy namespace in review notes.                                                                                                                                                                                                                                                                                                                               | Renaming breaks existing `DEBUG=` filters.                                                                                                            |
| D12 | Add a JSDoc `@deprecated` tag to the existing `verify_identity` member in `src/types.ts`, mark it deprecated everywhere it is documented, and state its exact legacy behavior: no non-empty `caCerts` leaves `ssl` unset (plaintext, no TLS requested); non-empty `caCerts` forwards only joined `ssl.ca` (mysql2 hostname identity verification is not enabled). Do not change the translator. Characterization tests pin both branches. | Tightening either branch would break connections that currently succeed. A behavior change or removal belongs to a separately scoped breaking change. |
| D13 | Export `toMysql2PoolOptions` from `src/adapter.ts` only and import it directly in `connection_errors_test.ts`.                                                                                                                                                                                                                                                                                                                            | A pure translator is the minimum test seam and is outside the package-root export map.                                                                |
| D14 | Do not add a runtime injection port or export `PrismaMySqlAdapter`/the translator from the public barrel.                                                                                                                                                                                                                                                                                                                                 | Those would create unnecessary runtime architecture or published API for a documentation leaf.                                                        |
| D15 | Extend `connection_errors_test.ts`; do not create a parallel cleanup/translation test.                                                                                                                                                                                                                                                                                                                                                    | That file already owns `FakePoolClient` cleanup behavior, so one contract cannot drift across suites.                                                 |
| D16 | The checked-in example performs one schema-independent Prisma query and exits non-zero on an uncaught top-level failure.                                                                                                                                                                                                                                                                                                                  | It must be executable evidence, not commented prose or a raw-adapter substitute.                                                                      |

## Open-Decision Sweep

| Decision                             | Status                               | Notes                                                                                      |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Actual example path                  | Resolved: owned                      | `examples/basic-usage.ts` is authorized and directly compile-checked.                      |
| Translation seam                     | Resolved: internal-source export     | No package-root export and no runtime injection.                                           |
| Focused test location                | Resolved: extend existing file       | `connection_errors_test.ts` owns mapping and cleanup assertions.                           |
| TLS behavior                         | Resolved: deprecate and characterize | D12 documents and pins the exact legacy mapping without changing runtime semantics.        |
| Legacy public-type removal changelog | Safe to defer by coordinator ceiling | A changelog is an eighth path; the pre-1.0 deletion remains explicit in PR review/handoff. |
| Debug namespace rename               | Resolved: leave                      | Observable compatibility takes precedence over cosmetic consistency.                       |

No implementation-shaping decision remains open. Implementation is still blocked on the separate
PLAN-EVAL and a later implementation grant.

## Coherent example contract

The site, README, module JSDoc, adapter JSDoc where retained, and checked-in example share this
sequence:

1. Import `PrismaMySql` and a real generated `PrismaClient` for the stated generator/output mode.
2. Construct one factory from supported structured fields; show `timeout`, pool sizing, and optional
   `onConnectionError` without inventing connection-string support or promoting the deprecated TLS
   mode. Explain that mode's exact legacy behavior separately.
3. Pass the factory to `new PrismaClient({ adapter })`.
4. Execute one schema-independent Prisma query such as `$queryRawUnsafe('SELECT 1')`.
5. Call `$disconnect()` exactly once from `finally`.

The package example's Prisma block becomes live code. It does not call `factory.connect()`, access
`connectedAdapter.queryRaw()`, or manually dispose a connected adapter. Separate prose explains that
a rare direct-connect caller owns `dispose()`.

## Commit slices

| # | What the slice proves                                                                                                                                                                      | Seven-path files                                                                     | Proving gates                                                                                                        |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1 | The source contract deprecates the misleading TLS member, documents every accepted structured option honestly, and has a narrow non-public test seam with legacy-mapping/cleanup evidence. | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`; run artifacts   | Focused characterization tests; package check/lint/fmt; quality/architecture gate; debug-namespace assertion.        |
| 2 | The package example and every published explanation use the same factory/query/cleanup and mysql2/runtime story.                                                                           | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`; run artifacts | Direct example check; docs source/accuracy; full export-map doc lint; publish dry-run; JSR audit; seven-path census. |

No implementation slice starts in this planning turn. The topic's independent PLAN-EVAL must
evaluate this amended plan before a separate implementation grant.

## Gate Plan

| Order | Gate                    | Command/check                                                                                              | Expected result                                                                                                          | Base state / newness                                                                                            |
| ----- | ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1     | Actual example check    | structured `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts`       | Exactly one selected file; live generated-client import, factory construction, Prisma query, and cleanup type-check      | Base passes only because the Prisma block is commented; semantic evidence is new.                               |
| 2     | Focused adapter tests   | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts` | Exact full/default mapping, legacy TLS characterization, and successful `client.close()` invocation pass without MySQL   | Base 33/33; mapping characterization and positive close-count assertions are new.                               |
| 3     | Docs source format      | `deno task --cwd docs/site check:source-format`                                                            | `Docs source format: OK`                                                                                                 | Already green at base.                                                                                          |
| 4     | Docs accuracy           | `deno task docs:accuracy`                                                                                  | PASS                                                                                                                     | Already green but insufficient alone.                                                                           |
| 5     | Package check           | structured `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts`                               | Non-empty selection, zero diagnostics                                                                                    | Base green, 12 files; must include the live example after change.                                               |
| 6     | Package full tests      | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`                           | Existing 46 plus new cases pass without live MySQL                                                                       | Base 46/46; new cases extend the authorized file.                                                               |
| 7     | Package lint            | structured `run-deno-lint.ts --root packages/prisma-adapter-mysql --ext ts`                                | Zero findings                                                                                                            | Run on implementation head.                                                                                     |
| 8     | Package format          | structured `run-deno-fmt.ts --root packages/prisma-adapter-mysql --ext ts`                                 | Zero findings                                                                                                            | Run on implementation head; no mutating root format.                                                            |
| 9     | Full export-map docs    | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                         | Root `./mod.ts`, zero diagnostics                                                                                        | Base green but semantically false; must remain green.                                                           |
| 10    | Code quality/doctrine   | `deno task quality:gate` or its durable receipt equivalent                                                 | No new quality/doctrine findings                                                                                         | Required for `packages/**`; not measured as a claimed base fix.                                                 |
| 11    | Publish dry-run         | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                            | Success, intended published file list, no real slow-type diagnostic                                                      | Base green, 8 files. Internal translator must remain absent from package-root docs even though it is in source. |
| 12    | JSR audit               | `audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                                         | Exit 0; raw dry-run resolves any banner-count warning                                                                    | Base exit 0 with one known banner false-positive.                                                               |
| 13    | Driver falsehood census | Focused `rg` across exactly seven paths                                                                    | Eight Deno-native prose locations corrected; only the explicitly allowlisted legacy debug string remains                 | New leaf-specific manual/content gate.                                                                          |
| 14    | Internal seam boundary  | `deno doc`/export-map inspection plus source search                                                        | Translator is importable from `src/adapter.ts` by the owned test but absent from both barrels and published root surface | New architecture/public-surface gate.                                                                           |
| 15    | Git/lock/path truth     | Direct git status/diff against the immutable base                                                          | No lock churn and no eighth product path; run artifacts current                                                          | New leaf-specific handoff check.                                                                                |

No runtime, Aspire, Docker, browser, `e2e:cli`, or release gate is planned: the seam gives static
and unit evidence without a live backend, and this leaf does not alter scaffold/database wiring.

## Risk Register

| Risk                                                             | Mitigation                                                                                                                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver prose is corrected in only one surface                    | Treat the seven-path census as a slice contract and rerun the eight-location search.                                                                                       |
| Example type-checks while its Prisma code remains dead           | Require the actual file plus a content review proving live `PrismaClient`, query, and `finally` paths.                                                                     |
| Example recreates the connected-adapter mistake                  | Pass the factory directly; forbid `connect()` in the normal example.                                                                                                       |
| `$disconnect()` and manual `dispose()` both run                  | Use only `$disconnect()` in Prisma flow; document direct-connect ownership separately.                                                                                     |
| Translator becomes accidental public API                         | Export only from `src/adapter.ts`; assert no re-export from either barrel or package export map.                                                                           |
| A runtime injection port is introduced for testing               | D14 forbids it; direct-test the pure translator.                                                                                                                           |
| Docs imply the deprecated mode enables TLS/identity verification | State and characterize both legacy branches exactly: no CAs means plaintext/`ssl` unset; non-empty CAs means joined `ssl.ca` only, without hostname identity verification. |
| Cleanup test only proves absence of errors                       | Count `FakePoolClient.close()` calls and assert the successful invocation exactly once.                                                                                    |
| Legacy debug filters break during wording cleanup                | Exact-string assertion/search keeps the namespace unchanged.                                                                                                               |
| Removed legacy root types surprise consumers                     | Call out the pre-1.0 surface deletion in PR/evaluator handoff; changelog remains outside the ceiling.                                                                      |

## Architecture-debt implications

- No new port, adapter hierarchy, runtime state, or dependency is introduced.
- The source-only translator export is testability scaffolding for the existing adapter edge, not a
  published extension axis.
- Deprecating the misleading TLS member and characterizing its mapping adds no runtime behavior or
  replacement vocabulary.
- Deleting stale Deno-driver types reduces false public surface rather than adding architecture.
- The debug namespace remains intentional compatibility residue, not new debt.
- No new architecture debt is accepted.

## Deferred scope / coordinator rescope

An eighth product path remains a hard rescope. Specifically deferred:

1. `docs/site/reference/prisma-adapter-mysql/examples_test.ts`; the actual checked-in package
   example is the compile authority instead.
2. Any new test file; `connection_errors_test.ts` must own both translation and cleanup coverage.
3. Any generated schema/client fixture committed to the repository.
4. Any public-barrel translator/adapter export or runtime pool-factory injection.
5. `CHANGELOG.md` treatment for the pre-1.0 legacy-type deletion.
6. Live-MySQL integration behavior and higher-level connection-string normalization.
7. Any TLS behavior change, replacement mode, or removal of `verify_identity`; that requires a
   separately scoped breaking change.

## PLAN-EVAL handoff

PLAN-EVAL remains selected because the leaf changes a public type surface by deprecating a
misleading member, characterizes its unchanged legacy TLS mapping, introduces a deliberately
non-public test seam, and synchronizes seven representations of one lifecycle contract. The topic
orchestrator dispatches a fresh independent Tier-A evaluator; this generator does not launch or
perform that evaluation. Until it returns terminal PASS and a later implementation grant exists, no
product mutation is authorized.
