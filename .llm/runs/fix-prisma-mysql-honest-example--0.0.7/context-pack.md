# Context Pack: prisma-mysql-honest-example (#1112)

## Run Metadata

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Run ID          | `fix-prisma-mysql-honest-example--0.0.7`                   |
| Branch          | `fix/prisma-mysql-honest-example`                          |
| Base            | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                 |
| Current phase   | `plan` / awaiting independent Tier-A PLAN-EVAL             |
| Archetype       | `2 — Integration` (doctrine verdict Keep)                  |
| Scope overlays  | `docs`                                                     |
| Product ceiling | Seven named paths; an eighth product path requires rescope |

## Current State

Research and planning only are complete; no product file changed. The coordinator-authorized plan
owns seven paths: site, README, adapter source, module docs/exports, public types, the checked-in
`basic-usage.ts`, and existing `connection_errors_test.ts`.

The census now contains 49 relevant occurrences/dispositions and exactly eight Deno-native driver
prose locations. The added example is materially false: it calls the package a Deno MySQL adapter,
comments out the entire Prisma flow, and substitutes a connected-adapter raw query plus manual
disposal. The corrected flow passes the `PrismaMySql` factory to a generated client, makes one
Prisma query, and calls `$disconnect()` in `finally`.

## Seven-Path Ceiling

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`
6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

An eighth product path is a hard rescope.

## Key Decisions

| Decision                                 | Source                                         | Notes                                                                                         |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dynamic driver is npm `mysql2/promise`   | `adapter.ts:23,634`                            | Requires Deno npm resolution, Node-compatible socket APIs, and `--allow-net`.                 |
| Factory goes to Prisma                   | Prisma 7 declarations; `PrismaMySql.connect()` | Do not pass a connected adapter to `PrismaClient`.                                            |
| Generated client is real                 | Generator convention plus example prerequisite | No ambient declarations or fictional imports; the actual package example is directly checked. |
| Structured fields only                   | `MySqlConnectionConfig`; translator            | No direct connection string in this package.                                                  |
| Hook wording comes from `types.ts:39-42` | #1662 shipped source                           | Remove the stale unsupported warning.                                                         |
| TLS identity mode is implemented         | mysql2 `SslOptions` plus current translator    | Set `verifyIdentity: true`; add custom `ca` only when present.                                |
| Translator seam is source-internal       | Coordinator authorization                      | Export from `src/adapter.ts` only; no barrel export and no runtime injection.                 |
| Existing test owns evidence              | `connection_errors_test.ts`                    | Extend its `FakePoolClient` mapping/cleanup coverage; no second test.                         |
| Legacy Deno-driver types are deleted     | Symbol-use census                              | Unused/stale types and root exports are removed in implementation.                            |
| Debug namespace remains                  | `adapter.ts:30`                                | Observable `DEBUG=` compatibility behavior.                                                   |

## Option Findings

Host/port/user/password/database/poolSize/timeout all reach their named mysql2 fields. The adapter
defaults `connectionLimit` to 1. `PrismaMySqlOptions.database` affects Prisma `schemaName`, not the
driver database. `onConnectionError` is an adapter callback and is observable across classified
boundaries.

The only current option defect is `tls.mode: 'verify_identity'`: base code sets `ssl.ca` only when
custom CAs exist and never enables mysql2 identity verification. The plan corrects that behavior and
tests mappings with no TLS, disabled TLS, identity verification with platform roots, and identity
verification with joined custom CAs.

## Test Seams

- Cleanup seam already exists through the structural `MysqlPoolClient` accepted by the internal
  `PrismaMySqlAdapter` constructor. The existing test injects `FakePoolClient`.
- Translation has no seam at base: `toMysql2PoolOptions` is module-local at `adapter.ts:725-743`.
- Authorized minimum: export that pure function from `src/adapter.ts` for direct test import only.
- Forbidden: package-root re-export, public barrel exposure, `PrismaMySqlAdapter` public exposure,
  or a runtime pool-factory injection port.
- Extend `connection_errors_test.ts` with exact mapping and successful close-count assertions.

## Base Gates

| Gate family             | Status            | Evidence                                                                       |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------ |
| Docs source/accuracy    | PASS at base      | Source format OK; accuracy scanned 199 pages but misses these contradictions.  |
| Existing site doctest   | PASS false-green  | Checks construction only, not the complete example.                            |
| Actual package example  | PASS false-green  | Structured direct check selected 1 file; required Prisma lines are comments.   |
| Focused connection test | PASS 33/33        | Existing error behavior passes; mapping and positive close count are absent.   |
| Package check/test      | PASS              | Structured check 12 files; full structured tests 46/46.                        |
| Full export doc lint    | PASS              | Root `./mod.ts`, zero diagnostics despite false prose.                         |
| Publish                 | PASS              | Raw dry-run, 8 files, no real slow-type diagnostic.                            |
| JSR                     | Exit 0 + one WARN | Helper counts the normal slow-type-check banner; raw dry-run is authoritative. |

## Planned New Evidence

- Direct structured check of the live `examples/basic-usage.ts` Prisma path.
- Exact structured/default/TLS translation assertions through the source-only seam.
- Successful `FakePoolClient.close()` invocation exactly once.
- Source search proving all eight Deno-native prose locations are corrected while the debug
  namespace remains unchanged.
- Export-map check proving the translator is absent from the package root.

## Files Changed This Phase

Only harness artifacts are amended. Product paths remain untouched:

- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/research.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/plan.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/context-pack.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/worklog.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/drift.md`

## Next Steps

1. Topic orchestrator dispatches fresh independent Tier-A PLAN-EVAL; this generator does not.
2. After terminal PLAN-EVAL PASS, obtain a separate implementation grant.
3. Implement the two planned slices within the exact seven-path ceiling.
4. Run all wrapper-sourced gates and mandatory independent IMPL-EVAL before readiness.

## Drift and Debt

- Significant authorized rescope: the coordinator added the package example and existing connection
  test, and prescribed the source-only translator seam.
- Significant product finding: advertised TLS identity verification is not implemented at base; it
  is now owned rather than deferred.
- Process variance: the explicit artifact allowlist omits mandatory `supervisor.md`; recorded in
  `drift.md` and not overridden.
- No new architecture debt accepted.

## Commits

See draft PR #1711's live commit list. No implementation commit exists.
