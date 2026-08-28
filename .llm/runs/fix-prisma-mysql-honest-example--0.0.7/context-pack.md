# Context Pack: prisma-mysql-honest-example (#1112)

## Run Metadata

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Run ID          | `fix-prisma-mysql-honest-example--0.0.7`                   |
| Branch          | `fix/prisma-mysql-honest-example`                          |
| Base            | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                 |
| Current phase   | `plan` / cycle-1 `FAIL_PLAN` repaired; cycle 2 not granted |
| Archetype       | `2 — Integration` (doctrine verdict Keep)                  |
| Scope overlays  | `docs`                                                     |
| Product ceiling | Seven named paths; an eighth product path requires rescope |

## Current State

Research and planning only are complete; no product file changed. PLAN-EVAL cycle 1 returned
`FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`; its import finding has been resolved by
an exact detached scratch probe, but cycle 2 has not been granted or launched. The
coordinator-amended plan owns seven paths: site, README, adapter source, module docs/exports, public
types, the checked-in `basic-usage.ts`, and existing `connection_errors_test.ts`.

The census now contains 50 relevant occurrences/dispositions. It is the authority for the driver
claim sweep; no hard-coded count may substitute for applying every `Correct`/`Delete` row. The added
example is materially false: it calls the package a Deno MySQL adapter, comments out the entire
Prisma flow, and substitutes a connected-adapter raw query plus manual disposal. The corrected flow
imports a real generated client from exact `./.generated/client.ts`, passes the `PrismaMySql`
factory, makes one Prisma query, and calls `$disconnect()` in `finally`.

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

| Decision                                   | Source                                         | Notes                                                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic driver is npm `mysql2/promise`     | `adapter.ts:23,634`                            | Requires Deno npm resolution, Node-compatible socket APIs, and `--allow-net`.                                                                                                            |
| Factory goes to Prisma                     | Prisma 7 declarations; `PrismaMySql.connect()` | Do not pass a connected adapter to `PrismaClient`.                                                                                                                                       |
| Generated client is real                   | Exact detached scratch probe                   | Package example imports `./.generated/client.ts`; scratch-only Prisma 7.8 generation plus the wrapper checks the actual file. No ambient declaration, ignore, or ungenerated `any` stub. |
| Prisma adapter types are compatible        | Real generated-client wrapper probe            | Narrow `PrismaMySqlResultSet.columnTypes` to `SqlResultSet['columnTypes']`; runtime conversion is unchanged.                                                                             |
| Structured fields only                     | `MySqlConnectionConfig`; translator            | No direct connection string in this package.                                                                                                                                             |
| Hook wording comes from `types.ts:39-42`   | #1662 shipped source                           | Remove the stale unsupported warning.                                                                                                                                                    |
| Legacy TLS mode is deprecated, not changed | Coordinator TLS ruling; current translator     | State and characterize plaintext with no CAs and joined `ssl.ca` only with non-empty CAs; no hostname verification.                                                                      |
| Translator seam is source-internal         | Coordinator authorization                      | Export from `src/adapter.ts` only; no barrel export and no runtime injection.                                                                                                            |
| Existing test owns evidence                | `connection_errors_test.ts`                    | Extend its `FakePoolClient` mapping/cleanup coverage; no second test.                                                                                                                    |
| Legacy Deno-driver types are deleted       | Symbol-use census                              | Unused/stale types and root exports are removed in implementation.                                                                                                                       |
| Debug namespace remains                    | `adapter.ts:30`                                | Observable `DEBUG=` compatibility behavior.                                                                                                                                              |

## Option Findings

Host/port/user/password/database/poolSize/timeout all reach their named mysql2 fields. The adapter
defaults `connectionLimit` to 1. `PrismaMySqlOptions.database` affects Prisma `schemaName`, not the
driver database. `onConnectionError` is an adapter callback and is observable across classified
boundaries.

The only current option defect is `tls.mode: 'verify_identity'`. The plan deprecates that existing
member without changing runtime semantics. Without non-empty `caCerts`, `ssl` remains unset, so the
connection is plaintext and no TLS is requested. With non-empty `caCerts`, only joined `ssl.ca` is
forwarded; mysql2 hostname identity verification is not enabled. Focused characterization tests pin
both legacy branches. A behavior change or removal is deferred to a separately scoped breaking
change.

## Test Seams

- Cleanup seam already exists through the structural `MysqlPoolClient` accepted by the internal
  `PrismaMySqlAdapter` constructor. The existing test injects `FakePoolClient`.
- Translation has no seam at base: `toMysql2PoolOptions` is module-local at `adapter.ts:725-743`.
- Authorized minimum: export that pure function from `src/adapter.ts` for direct test import only.
- Forbidden: package-root re-export, public barrel exposure, `PrismaMySqlAdapter` public exposure,
  or a runtime pool-factory injection port.
- Extend `connection_errors_test.ts` with exact mapping characterization—including the unchanged
  plaintext/CA-only TLS branches—and successful close-count assertions.

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

- Scratch-generate a real Prisma 7.8 client from `.llm/tmp`, then directly structured-check the live
  `examples/basic-usage.ts` import `./.generated/client.ts` and remove all generated output.
- Structural proof that the factory is accepted by real Prisma types after the in-envelope
  `SqlResultSet['columnTypes']` declaration correction.
- Exact structured/default translation and legacy TLS characterization assertions through the
  source-only seam.
- Successful `FakePoolClient.close()` invocation exactly once.
- Source search proving every `Correct`/`Delete` census row is applied while only the allowlisted
  debug namespace remains.
- Export-map check proving the translator is absent from the package root.

## Files Changed This Phase

Only harness artifacts are amended. Product paths remain untouched:

- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/supervisor.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/research.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/plan.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/context-pack.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/worklog.md`
- `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/drift.md`

## Next Steps

1. Coordinator decides whether to grant PLAN-EVAL cycle 2; this generator does not launch it.
2. If granted, the topic orchestrator dispatches the final fresh independent cycle. #1112 remains
   selected under the critical/complex/decision-heavy policy because it coordinates published
   integration docs, a real generated-client import, lifecycle, public option truth, and TLS
   compatibility; routine/mechanical leaves instead record `PLAN-EVAL: N/A` plus Tier-A.
3. After terminal PLAN-EVAL PASS, obtain a separate implementation grant.
4. Implement the two planned slices within the exact seven-path ceiling.
5. Run all wrapper-sourced gates and mandatory independent IMPL-EVAL before readiness.

## Drift and Debt

- Significant authorized rescope: the coordinator added the package example and existing connection
  test, and prescribed the source-only translator seam.
- Significant product finding: advertised TLS identity verification is not implemented at base; this
  leaf owns deprecation/documentation/characterization, while runtime change or removal is deferred
  to a separately scoped breaking change.
- PLAN-EVAL cycle-1 finding repaired: the exact generated-client import and scratch validation setup
  are now locked, and the probe exposed a type-only result-set declaration correction within the
  existing seven paths. No eighth path is required.
- Resolved process variance: the original artifact allowlist omitted mandatory `supervisor.md`. The
  coordinator ruled no waiver and amended the allowlist by exactly that control-plane path; the
  seven-path product ceiling is unchanged.
- No new architecture debt accepted.

## Commits

See draft PR #1711's live commit list. No implementation commit exists.
