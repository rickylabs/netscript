# Context Pack: prisma-mysql-honest-example (#1112)

## Run Metadata

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Run ID          | `fix-prisma-mysql-honest-example--0.0.7`                   |
| Branch          | `fix/prisma-mysql-honest-example`                          |
| Base            | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                 |
| Current phase   | `plan` / Tier-A F1 repair; fresh Tier-A pending            |
| Archetype       | `2 — Integration` (doctrine verdict Keep)                  |
| Scope overlays  | `docs`                                                     |
| Product ceiling | Seven named paths; an eighth product path requires rescope |

## Current State

Research and planning only are complete; no product file changed. PLAN-EVAL cycle 1 returned
`FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`. Fresh Tier-A failed the first repair head
`3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone because the literal generated-client import
became a permanent `TS2307` after scratch cleanup; F2-F4 were accepted. The repaired plan now has
separate clean-shell and real-generated-client gates. Cycle 2 remains unlaunched. The
coordinator-amended plan owns seven paths: site, README, adapter source, module docs/exports, public
types, the checked-in `basic-usage.ts`, and existing `connection_errors_test.ts`.

The census now contains 50 relevant occurrences/dispositions. It is the authority for the driver
claim sweep; no hard-coded count may substitute for applying every `Correct`/`Delete` row. The added
example is materially false: it calls the package a Deno MySQL adapter, comments out the entire
Prisma flow, and substitutes a connected-adapter raw query plus manual disposal. The corrected flow
dynamically loads a real generated client at module scope from a non-literal URL targeting
`./.generated/client.ts`, passes the `PrismaMySql` factory, makes one Prisma query, and calls
`$disconnect()` in `finally`.

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

| Decision                                   | Source                                         | Notes                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic driver is npm `mysql2/promise`     | `adapter.ts:23,634`                            | Requires Deno npm resolution, Node-compatible socket APIs, and `--allow-net`.                                                                                                      |
| Factory goes to Prisma                     | Prisma 7 declarations; `PrismaMySql.connect()` | Do not pass a connected adapter to `PrismaClient`.                                                                                                                                 |
| Stable example shell remains resolvable    | Pristine tracked-files archive                 | Non-literal URL dynamic import keeps all 12 package files selected and green before generation and after cleanup; no exclusion. Root check leaves `PrismaClient`/`prisma` untyped. |
| Generated client is real                   | Specialized scratch static/import probe        | Real Prisma 7.8 client is statically checked through a compatibility wrapper; importing the actual example executes the dynamic import and prints `dynamic-import-smoke:ok`.       |
| Prisma adapter types are compatible        | Real generated-client wrapper probe            | Narrow `PrismaMySqlResultSet.columnTypes` to `SqlResultSet['columnTypes']`; runtime conversion is unchanged.                                                                       |
| Structured fields only                     | `MySqlConnectionConfig`; translator            | No direct connection string in this package.                                                                                                                                       |
| Hook wording comes from `types.ts:39-42`   | #1662 shipped source                           | Remove the stale unsupported warning.                                                                                                                                              |
| Legacy TLS mode is deprecated, not changed | Coordinator TLS ruling; current translator     | State and characterize plaintext with no CAs and joined `ssl.ca` only with non-empty CAs; no hostname verification.                                                                |
| Translator seam is source-internal         | Coordinator authorization                      | Export from `src/adapter.ts` only; no barrel export and no runtime injection.                                                                                                      |
| Existing test owns evidence                | `connection_errors_test.ts`                    | Extend its `FakePoolClient` mapping/cleanup coverage; no second test.                                                                                                              |
| Legacy Deno-driver types are deleted       | Symbol-use census                              | Unused/stale types and root exports are removed in implementation.                                                                                                                 |
| Debug namespace remains                    | `adapter.ts:30`                                | Observable `DEBUG=` compatibility behavior.                                                                                                                                        |

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

- Ordinary structured package-root check with no generated output, selecting all 12 files including
  the dynamic example shell; repeat it after specialized-gate cleanup.
- Scratch-generate a real Prisma 7.8 client, statically check factory/query/disconnect compatibility
  through a scratch wrapper, then import the actual example module to execute its dynamic import.
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

1. Fresh Tier-A reviews the pushed repair head; this generator does not self-certify it.
2. Only after Tier-A passes does the coordinator decide whether to grant PLAN-EVAL cycle 2.
3. If granted, the topic orchestrator dispatches the final fresh independent cycle. #1112 remains
   selected under the critical/complex/decision-heavy policy because it coordinates published
   integration docs, a real generated-client import, lifecycle, public option truth, and TLS
   compatibility; routine/mechanical leaves instead record `PLAN-EVAL: N/A` plus Tier-A.
4. After terminal PLAN-EVAL PASS, obtain a separate implementation grant.
5. Implement the two planned slices within the exact seven-path ceiling.
6. Run all wrapper-sourced gates and mandatory independent IMPL-EVAL before readiness.

## Drift and Debt

- Significant authorized rescope: the coordinator added the package example and existing connection
  test, and prescribed the source-only translator seam.
- Significant product finding: advertised TLS identity verification is not implemented at base; this
  leaf owns deprecation/documentation/characterization, while runtime change or removal is deferred
  to a separately scoped breaking change.
- PLAN-EVAL/Tier-A F1 repaired: the tracked example uses a stable dynamic shell, ordinary root
  checking remains green after cleanup, and specialized static/import evidence owns the real
  generated-client contract. The probe also retains the type-only result-set declaration correction
  within the existing seven paths. No eighth path is required.
- Resolved process variance: the original artifact allowlist omitted mandatory `supervisor.md`. The
  coordinator ruled no waiver and amended the allowlist by exactly that control-plane path; the
  seven-path product ceiling is unchanged.
- No new architecture debt accepted.

## Commits

See draft PR #1711's live commit list. No implementation commit exists.
