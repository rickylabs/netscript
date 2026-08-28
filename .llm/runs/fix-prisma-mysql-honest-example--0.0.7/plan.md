# Plan: honest executable MySQL Prisma adapter example (#1112)

## Run Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7`              |
| Branch         | `fix/prisma-mysql-honest-example`                     |
| Immutable base | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`            |
| Phase          | `plan` — cycle-1 repair; implementation not granted   |
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
- At module scope, load the package example's generated client through an intentionally non-literal
  dynamic URL: `new URL('./.generated/client.ts', import.meta.url).href` followed by
  `await import(url)`. Keep the example selected by the ordinary clean package-root check before
  generation and after cleanup.
- Split evidence honestly: the ordinary root check validates the stable example shell, while a
  scratch-only static compatibility wrapper validates the real generated `PrismaClient` factory,
  query, and disconnect types and an import-only smoke executes the actual example's dynamic import.
  The root check does not type `PrismaClient` or `prisma`.
- Narrow `PrismaMySqlResultSet.columnTypes` to Prisma's `SqlResultSet['columnTypes']` contract so
  the factory is structurally accepted by a real Prisma 7 generated client; this is a type-only
  compatibility correction in the already-approved `src/adapter.ts` path.
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
- Live MySQL or service-runtime integration, Aspire, Docker, browser, `e2e:cli`, release gates, or
  an expensive-gate lease. The bounded gate-5 import-only smoke is allowed because it loads the
  generated module without running the query or opening a database connection.
- Connection-string support in this low-level factory. Higher-level `@netscript/database`
  normalization remains separate.
- Arbitrary Prisma adapters (#1101), #1664, or any mutation/rewording of #1293.
- Renaming `prisma:driver-adapter:deno-mysql`; it remains observable compatibility behavior.
- Changing TLS runtime semantics, enabling mysql2 hostname verification, adding a replacement TLS
  mode, or removing the deprecated mode. Any behavior change or removal requires a separately scoped
  breaking change.
- PLAN-EVAL cycle-2 dispatch from this generator session. Cycle 1 returned `FAIL_PLAN`; the topic
  orchestrator owns any final independent cycle and must grant it separately.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Rationale                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Describe the driver as dynamically imported npm `mysql2/promise`, never Deno-native.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `adapter.ts:23,634` is the implementation authority.                                                                                                                                                                                                 |
| D2  | Pass the `PrismaMySql` factory directly to `new PrismaClient({ adapter })`; do not call `connect()` first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Prisma 7 requires `SqlDriverAdapterFactory`.                                                                                                                                                                                                         |
| D3  | Documentation uses the NetScript generated-Deno-client shape ending in `schema/.generated/client.server.ts`. At module scope, the checked-in package example computes `const generatedClientUrl = new URL('./.generated/client.ts', import.meta.url).href` and runs `const { PrismaClient } = await import(generatedClientUrl)`. The non-literal specifier is deliberate: ordinary checking validates the tracked example shell without statically resolving absent generated output. Gate 5 separately generates a real client, statically checks a scratch compatibility wrapper, and executes an import-only smoke of the actual example. Ambient declarations, `// @ts-ignore`, the ungenerated `@prisma/client` stub, and excluding the example are forbidden. | A pristine tracked-files archive at `3e0f2223a` selected all 12 package files and passed both before generation and after cleanup. The specialized gate passed real-client type compatibility and printed `dynamic-import-smoke:ok`.                 |
| D4  | Normal cleanup is `try/finally { await prisma.$disconnect(); }`; only direct `factory.connect()` callers own `connected.dispose()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Prevents the current connected-adapter type error and double disposal.                                                                                                                                                                               |
| D5  | Direct constructor input remains structured `MySqlConnectionConfig`; no connection string is accepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | The public type and translator expose fields only.                                                                                                                                                                                                   |
| D6  | `timeout` maps only to mysql2 `connectTimeout`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | It is an initial connection deadline, not a query/transaction/idle deadline.                                                                                                                                                                         |
| D7  | `poolSize ?? 1` maps to `connectionLimit`; Prisma `$disconnect()` reaches `dispose()` → `client.close()` → `pool.end()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | This is the existing ownership chain.                                                                                                                                                                                                                |
| D8  | Site hook wording is derived from `types.ts:39-42` without broadening it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | #1662 shipped the classifier and callback-containment contract.                                                                                                                                                                                      |
| D9  | Delete `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult`, `QueryResult`, and `FieldInfo`, plus stale root exports/site prose.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | They are unused residue from a driver the package no longer uses.                                                                                                                                                                                    |
| D10 | Correct the two internal `deno_mysql` comments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | They are false maintenance guidance inside an owned path.                                                                                                                                                                                            |
| D11 | Leave `Debug('prisma:driver-adapter:deno-mysql')` unchanged and call it a legacy namespace in review notes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Renaming breaks existing `DEBUG=` filters.                                                                                                                                                                                                           |
| D12 | Add a JSDoc `@deprecated` tag to the existing `verify_identity` member in `src/types.ts`, mark it deprecated everywhere it is documented, and state its exact legacy behavior: no non-empty `caCerts` leaves `ssl` unset (plaintext, no TLS requested); non-empty `caCerts` forwards only joined `ssl.ca` (mysql2 hostname identity verification is not enabled). Do not change the translator. Characterization tests pin both branches.                                                                                                                                                                                                                                                                                                                           | Tightening either branch would break connections that currently succeed. A behavior change or removal belongs to a separately scoped breaking change.                                                                                                |
| D13 | Export `toMysql2PoolOptions` from `src/adapter.ts` only and import it directly in `connection_errors_test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | A pure translator is the minimum test seam and is outside the package-root export map.                                                                                                                                                               |
| D14 | Do not add a runtime injection port or export `PrismaMySqlAdapter`/the translator from the public barrel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Those would create unnecessary runtime architecture or published API for a documentation leaf.                                                                                                                                                       |
| D15 | Extend `connection_errors_test.ts`; do not create a parallel cleanup/translation test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | That file already owns `FakePoolClient` cleanup behavior, so one contract cannot drift across suites.                                                                                                                                                |
| D16 | The checked-in example performs one schema-independent Prisma query and exits non-zero on an uncaught top-level failure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | It must be executable evidence, not commented prose or a raw-adapter substitute.                                                                                                                                                                     |
| D17 | Change `PrismaMySqlResultSet.columnTypes` from the over-broad `number[]` declaration to `SqlResultSet['columnTypes']`; do not change runtime row conversion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | The exact generated-client probe found this as the sole remaining structural incompatibility between `PrismaMySqlAdapterFactory` and Prisma 7's `SqlDriverAdapterFactory`; the prospective one-line type correction makes the structured check pass. |

## Open-Decision Sweep

| Decision                             | Status                                      | Notes                                                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual example import                | Resolved: dynamic shell + specialized proof | The tracked file uses a non-literal URL dynamic import, so the clean root check selects it without resolving absent output. Gate 5 statically checks a real generated client in scratch and runs the actual dynamic import after generation. |
| Translation seam                     | Resolved: internal-source export            | No package-root export and no runtime injection.                                                                                                                                                                                             |
| Focused test location                | Resolved: extend existing file              | `connection_errors_test.ts` owns mapping and cleanup assertions.                                                                                                                                                                             |
| TLS behavior                         | Resolved: deprecate and characterize        | D12 documents and pins the exact legacy mapping without changing runtime semantics.                                                                                                                                                          |
| Legacy public-type removal changelog | Safe to defer by coordinator ceiling        | A changelog is an eighth path; the pre-1.0 deletion remains explicit in PR review/handoff.                                                                                                                                                   |
| Debug namespace rename               | Resolved: leave                             | Observable compatibility takes precedence over cosmetic consistency.                                                                                                                                                                         |

No implementation-shaping decision remains open. PLAN-EVAL cycle 1 returned `FAIL_PLAN`; this repair
is still blocked on a coordinator grant for the final cycle and on a later implementation grant.

## Coherent example contract

The site, README, module JSDoc, adapter JSDoc where retained, and checked-in example share this
sequence:

1. Import `PrismaMySql`. The checked-in file loads its generated client through the non-literal URL
   for `./.generated/client.ts`; NetScript application documentation uses its project generator's
   `schema/.generated/client.server.ts` output.
2. Construct one factory from supported structured fields; show `timeout`, pool sizing, and optional
   `onConnectionError` without inventing connection-string support or promoting the deprecated TLS
   mode. Explain that mode's exact legacy behavior separately.
3. Pass the factory to `new PrismaClient({ adapter })`.
4. Execute one schema-independent Prisma query such as `$queryRawUnsafe('SELECT 1')`.
5. Call `$disconnect()` exactly once from `finally`.

The package example's Prisma block becomes live code. It does not call `factory.connect()`, access
`connectedAdapter.queryRaw()`, or manually dispose a connected adapter. Separate prose explains that
a rare direct-connect caller owns `dispose()`. The checked-in dynamic import deliberately makes
`PrismaClient` and `prisma` untyped during the ordinary root check. That gate proves the stable
shell and its control-flow shape, not generated-client compatibility; gate 5 supplies the lost
static and runtime-import evidence against a real generated client.

## Commit slices

| # | What the slice proves                                                                                                                                                                                                                                                   | Seven-path files                                                                     | Proving gates                                                                                                                                                                                                                                         |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | The source contract deprecates the misleading TLS member, narrows the result-set declaration to Prisma's real `SqlResultSet` contract, documents every accepted structured option honestly, and has a narrow non-public test seam with legacy-mapping/cleanup evidence. | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`; run artifacts   | Focused characterization tests; generated-client compatibility probe; package check/lint/fmt; quality/architecture gate; debug-namespace assertion.                                                                                                   |
| 2 | The package example and every published explanation use the same factory/query/cleanup and mysql2/runtime story without leaving the tracked tree permanently unresolved.                                                                                                | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`; run artifacts | Ordinary clean root check before generation and after cleanup; scratch static real-client compatibility check plus actual-module dynamic-import smoke; docs source/accuracy; full export-map doc lint; publish dry-run; JSR audit; seven-path census. |

No implementation slice starts in this planning turn. The topic must separately grant PLAN-EVAL
cycle 2 for this repaired plan before any later implementation grant.

### Gate 5 scratch-generation protocol

The example's runtime target is exactly `./.generated/client.ts`, but its checked-in module-scope
import specifier is the non-literal `generatedClientUrl`. Gate 1 first runs with no generated
output. Then, for gate 5, create only untracked validation inputs under `.llm/tmp`. The exact
scratch schema is:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../../../packages/prisma-adapter-mysql/examples/.generated"
  runtime  = "deno"
}

datasource db {
  provider = "mysql"
}

model Example {
  id Int @id @default(autoincrement())
}
```

The exact `.llm/tmp/prisma-example-check-deno.json` is:

```json
{
  "imports": {
    "@prisma/client": "npm:@prisma/client@7.8.0",
    "@prisma/driver-adapter-utils": "npm:@prisma/driver-adapter-utils@7.8.0"
  },
  "compilerOptions": {
    "isolatedDeclarations": false,
    "strict": true,
    "lib": ["deno.ns", "deno.unstable", "dom"]
  }
}
```

Disabling `isolatedDeclarations` here matches a generated-client consumer rather than applying the
workspace's library-publication setting to generated code.

The exact `.llm/tmp/prisma-example-compatibility.ts` statically restores the type evidence that the
dynamic example shell intentionally cannot provide:

```ts
import { PrismaClient } from '../../packages/prisma-adapter-mysql/examples/.generated/client.ts';
import { PrismaMySql } from '../../packages/prisma-adapter-mysql/mod.ts';

const adapter = new PrismaMySql({
  hostname: 'localhost',
  username: 'root',
  db: 'test',
});

async function verifyGeneratedClientCompatibility(): Promise<void> {
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$queryRawUnsafe('SELECT 1 + 1 AS result');
  } finally {
    await prisma.$disconnect();
  }
}

void verifyGeneratedClientCompatibility;
```

Run generation with
`deno run -A --no-lock npm:prisma@7.8.0 generate --schema .llm/tmp/prisma-example/schema.prisma`,
then run the structured gate-5 check on the scratch compatibility wrapper. Next run the import-only
smoke
`deno eval --no-lock --config=.llm/tmp/prisma-example-check-deno.json 'await import(new URL("./packages/prisma-adapter-mysql/examples/basic-usage.ts", import.meta.url).href); console.log("dynamic-import-smoke:ok")'`.
Because the example is imported rather than run as main, this executes its generated-client dynamic
import without executing the query or contacting MySQL. Remove `.generated` and all scratch inputs,
then repeat gate 1. Gate 15 proves no generated/eighth path or lock churn survives.

## Gate Plan

| Order | Gate                           | Command/check                                                                                                                                                                                                                 | Expected result                                                                                                                                                                                                                                                                                              | Base state / newness                                                                                                                                                                                                                                        |
| ----- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Clean-root example shell       | with `.generated` absent, `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx`; repeat immediately after gate 5 cleanup                                         | Both invocations select all 12 tracked package files, including `examples/basic-usage.ts`, with zero failed batches/diagnostics. This validates adapter construction and the stable query/`finally`/disconnect shell, but `PrismaClient` and `prisma` are untyped because the dynamic import is non-literal. | Base is green because the Prisma path is commented. Tier-A repair probe on a pristine archive with the prospective dynamic shell passed before generation and again after cleanup: 12 selected, 0 failed batches, 0 diagnostics. No exclusion is permitted. |
| 2     | Focused adapter tests          | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts`                                                                                                                    | Exact full/default mapping, legacy TLS characterization, and successful `client.close()` invocation pass without MySQL                                                                                                                                                                                       | Base 33/33; mapping characterization and positive close-count assertions are new.                                                                                                                                                                           |
| 3     | Docs source format             | `deno task --cwd docs/site check:source-format`                                                                                                                                                                               | `Docs source format: OK`                                                                                                                                                                                                                                                                                     | Already green at base.                                                                                                                                                                                                                                      |
| 4     | Docs accuracy                  | `deno task docs:accuracy`                                                                                                                                                                                                     | PASS                                                                                                                                                                                                                                                                                                         | Already green but insufficient alone.                                                                                                                                                                                                                       |
| 5     | Generated-client compatibility | use the scratch protocol above; structured `run-deno-check.ts --file .llm/tmp/prisma-example-compatibility.ts --ext ts --deno-arg --config=.llm/tmp/prisma-example-check-deno.json`, then the actual-module import-only smoke | Static wrapper selects one file with zero diagnostics and proves factory/query/disconnect compatibility against a real Prisma 7 client; smoke exits 0 and prints `dynamic-import-smoke:ok`. It does not contact MySQL.                                                                                       | Cycle-1 probe found the `number[]`/`ColumnType[]` mismatch; the planned `SqlResultSet['columnTypes']` correction passes. Tier-A repair re-proved both the static wrapper and actual dynamic import.                                                         |
| 6     | Package full tests             | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`                                                                                                                                              | Existing 46 plus new cases pass without live MySQL                                                                                                                                                                                                                                                           | Base 46/46; new cases extend the authorized file.                                                                                                                                                                                                           |
| 7     | Package lint                   | structured `run-deno-lint.ts --root packages/prisma-adapter-mysql --ext ts`                                                                                                                                                   | Zero findings                                                                                                                                                                                                                                                                                                | Run on implementation head.                                                                                                                                                                                                                                 |
| 8     | Package format                 | structured `run-deno-fmt.ts --root packages/prisma-adapter-mysql --ext ts`                                                                                                                                                    | Zero findings                                                                                                                                                                                                                                                                                                | Run on implementation head; no mutating root format.                                                                                                                                                                                                        |
| 9     | Full export-map docs           | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                                                                                                                                            | Root `./mod.ts`, zero diagnostics                                                                                                                                                                                                                                                                            | Base green but semantically false; must remain green.                                                                                                                                                                                                       |
| 10    | Code quality/doctrine          | `deno task quality:gate` or its durable receipt equivalent                                                                                                                                                                    | No new quality/doctrine findings                                                                                                                                                                                                                                                                             | Required for `packages/**`; not measured as a claimed base fix.                                                                                                                                                                                             |
| 11    | Publish dry-run                | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                                                                                                                                               | Success, intended published file list, no real slow-type diagnostic                                                                                                                                                                                                                                          | Base green, 8 files. Internal translator must remain absent from package-root docs even though it is in source.                                                                                                                                             |
| 12    | JSR audit                      | `.llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                                                                                                                                         | Exit 0; raw dry-run resolves any banner-count warning                                                                                                                                                                                                                                                        | Base exit 0 with one known banner false-positive.                                                                                                                                                                                                           |
| 13    | Driver falsehood census        | Focused `rg` across exactly seven paths, read against every `Correct`/`Delete` disposition in the research census                                                                                                             | Every `Correct`/`Delete` row is applied; the repeated census grep leaves only the explicitly allowlisted legacy `adapter.ts:30` debug namespace                                                                                                                                                              | New leaf-specific manual/content gate; no hard-coded occurrence count can mask an omitted row.                                                                                                                                                              |
| 14    | Internal seam boundary         | `deno doc`/export-map inspection plus source search                                                                                                                                                                           | Translator is importable from `src/adapter.ts` by the owned test but absent from both barrels and published root surface                                                                                                                                                                                     | New architecture/public-surface gate.                                                                                                                                                                                                                       |
| 15    | Git/lock/path truth            | Direct git status/diff against the immutable base                                                                                                                                                                             | No lock churn and no eighth product path; run artifacts current                                                                                                                                                                                                                                              | New leaf-specific handoff check.                                                                                                                                                                                                                            |

No live-backend runtime, Aspire, Docker, browser, `e2e:cli`, or release gate is planned. Gate 5's
bounded import-only smoke executes module resolution without running the query or opening MySQL; the
remaining evidence is static/unit evidence, and this leaf does not alter scaffold/database wiring.

## Risk Register

| Risk                                                                          | Mitigation                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver prose is corrected in only one surface                                 | Apply every `Correct`/`Delete` census row, rerun the seven-path search, and require only the allowlisted debug namespace to remain.                                                                                                                                                         |
| Dynamic example shell passes while generated-client compatibility is unproved | Keep the two jobs separate and named: gate 1 selects the actual tracked shell before generation and after cleanup; gate 5 statically checks a real generated client plus factory/query/disconnect and executes the actual dynamic import. Never claim gate 1 types `PrismaClient`/`prisma`. |
| Package root is green only because the example was excluded                   | Gate 1 uses the ordinary package root with no `--exclude`, requires 12 selected files, and is repeated after cleanup. A `deno.json` exclusion is forbidden and outside the seven-path ceiling.                                                                                              |
| Example recreates the connected-adapter mistake                               | Pass the factory directly; forbid `connect()` in the normal example.                                                                                                                                                                                                                        |
| `$disconnect()` and manual `dispose()` both run                               | Use only `$disconnect()` in Prisma flow; document direct-connect ownership separately.                                                                                                                                                                                                      |
| Translator becomes accidental public API                                      | Export only from `src/adapter.ts`; assert no re-export from either barrel or package export map.                                                                                                                                                                                            |
| A runtime injection port is introduced for testing                            | D14 forbids it; direct-test the pure translator.                                                                                                                                                                                                                                            |
| Docs imply the deprecated mode enables TLS/identity verification              | State and characterize both legacy branches exactly: no CAs means plaintext/`ssl` unset; non-empty CAs means joined `ssl.ca` only, without hostname identity verification.                                                                                                                  |
| Cleanup test only proves absence of errors                                    | Count `FakePoolClient.close()` calls and assert the successful invocation exactly once.                                                                                                                                                                                                     |
| Legacy debug filters break during wording cleanup                             | Exact-string assertion/search keeps the namespace unchanged.                                                                                                                                                                                                                                |
| Removed legacy root types surprise consumers                                  | Call out the pre-1.0 surface deletion in PR/evaluator handoff; changelog remains outside the ceiling.                                                                                                                                                                                       |

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

1. `docs/site/reference/prisma-adapter-mysql/examples_test.ts`; the checked-in package shell plus
   scratch real-client compatibility/import evidence are the authorities instead.
2. Any new test file; `connection_errors_test.ts` must own both translation and cleanup coverage.
3. Any generated schema/client fixture committed to the repository.
4. Any public-barrel translator/adapter export or runtime pool-factory injection.
5. `CHANGELOG.md` treatment for the pre-1.0 legacy-type deletion.
6. Live-MySQL integration behavior and higher-level connection-string normalization.
7. Any TLS behavior change, replacement mode, or removal of `verify_identity`; that requires a
   separately scoped breaking change.

## PLAN-EVAL handoff

Owner policy now selects formal PLAN-EVAL only for genuinely critical, complex, or decision-heavy
topics; routine or mechanical leaves record `PLAN-EVAL: N/A` plus Tier-A. #1112 remains selected for
one final cycle because it coordinates published integration documentation, an executable real
generated-client import, adapter lifecycle and Prisma structural compatibility, public option truth,
and non-breaking TLS compatibility. Cycle 1 evaluated head
`069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` as `FAIL_PLAN`. Fresh Tier-A then failed first repair
head `3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone; F2-F4 remain accepted. This second
repair does not self-certify. Fresh Tier-A must pass the pushed head before the topic coordinator
may grant and dispatch cycle 2 in a separate session. Until cycle 2 returns terminal PASS and a
later implementation grant exists, no product mutation is authorized.
