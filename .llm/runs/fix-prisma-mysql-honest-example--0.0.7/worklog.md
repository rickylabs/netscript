# Worklog: prisma-mysql-honest-example (#1112)

## Run Metadata

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7` |
| Branch         | `fix/prisma-mysql-honest-example`        |
| Archetype      | `2 — Integration`                        |
| Scope overlays | `docs`                                   |

## Design

Recorded before any implementation file. This turn has no implementation grant.

### Public Surface

- `PrismaMySql` / `PrismaMySqlAdapterFactory` — Prisma 7 driver-adapter factory; Prisma owns its
  connected adapter lifecycle in the normal client flow.
- `MySqlConnectionConfig` — structured connection and pool/TLS configuration.
- `PrismaMySqlOptions` — Prisma schema metadata and contained connection-error observation.
- `PrismaMySqlConnectedAdapter` — directly connected adapter for internal/advanced callers; direct
  callers own `dispose()`.
- Site, README, root module JSDoc, and `examples/basic-usage.ts` — one synchronized executable
  manual for this surface.
- Legacy `DenoMySqlClient`, `DenoMySqlConnection`, and supporting result/field types — planned
  deletion because they do not model the shipped driver.

### Domain Vocabulary

- **Factory** — object passed to Prisma; exposes `connect()`.
- **Connected adapter** — owns one mysql2 pool and closes it through `dispose()`.
- **Structured config** — host/port/user/password/db/pool/timeout/TLS fields; no direct URL form.
- **Initial-connect timeout** — mysql2 `connectTimeout`, not an operation deadline.
- **Connection-error observer** — contained callback selected by the shipped closed classifier.
- **Identity verification mode** — amended plan maps it to mysql2 `ssl.verifyIdentity: true` and
  adds custom CA material only when supplied; base implementation does not satisfy the name.

### Ports

- Prisma `SqlDriverAdapterFactory` / `SqlDriverAdapter` — external consumed contract.
- mysql2 promise `Pool` / `PoolConnection` — external driver edge.
- Existing injectable `MysqlPoolClient` at `PrismaMySqlAdapter` construction — cleanup test seam.
- `toMysql2PoolOptions` — pure translator authorized for export from `src/adapter.ts` to the
  existing direct-source test only; it is not a package-root surface or runtime injection port.

### Constants

- `PACKAGE_NAME` remains `@netscript/prisma-adapter-mysql`.
- Debug namespace remains exactly `prisma:driver-adapter:deno-mysql` for compatibility.
- Provider remains exactly `mysql`.

### Commit Slices

| # | Slice                                                                               | Gate                                                                     | Files                                                                                |
| - | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1 | Honest option translation, internal-source seam, and cleanup evidence               | focused structured tests; package check/lint/fmt; quality/arch           | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`, run artifacts   |
| 2 | One live factory/query/finally-disconnect story across all consumer-facing surfaces | direct example check; docs format/accuracy; doc lint; publish/JSR/census | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`, run artifacts |

### Deferred Scope

- Any eighth product path, including the site doctest, a new package test, generated fixture,
  changelog, config, or tooling — coordinator rescope.
- Public-barrel translator/adapter exports and runtime pool injection — forbidden by the authorized
  seam shape.
- Connection-string support — different/higher-level surface.
- Live backend/runtime verification and `e2e:cli` — prohibited for this leaf.
- #1664 and #1293 issue wording/state — explicitly untouched.

### Contributor Path

A contributor starts at `src/mod.ts` / `deno doc`, follows `PrismaMySql` into `adapter.ts`, checks
`MySqlConnectionConfig` and `PrismaMySqlOptions` in `types.ts`, and keeps README/site examples in
the same factory → generated Prisma client → query → `$disconnect()` order.

## Progress Log

| Date       | Slice    | Step       | Notes                                                                                                                                       |
| ---------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28 | planning | Bootstrap  | Read live issue, verified exact base/branch/clean tree, loaded requested harness/doctrine/tooling/JSR/PR guidance.                          |
| 2026-08-28 | planning | Research   | Rendered `deno doc`, searched/read all seven paths, traced options, inspected Prisma/mysql2 declarations, and audited the prescribed seams. |
| 2026-08-28 | planning | Base gates | Ran only allowed non-runtime gates; tree remained clean.                                                                                    |
| 2026-08-28 | planning | Design     | Locked the seven-path plan, source-only translator seam, existing-test ownership, and TLS correction. No product mutation.                  |

## Decisions

| Decision                                   | Reason                                                                             | Source                          |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------- |
| PLAN-EVAL selected but not launched        | Product/test scope and TLS semantics need independent review; topic owns evaluator | user brief; harness separation  |
| No implementation                          | Explicit research+plan-only grant                                                  | user brief                      |
| No eighth path                             | Amended frozen envelope is a hard ceiling                                          | coordinator amendment           |
| Translator stays source-internal           | Direct test visibility without new published API or runtime injection              | coordinator amendment; doctrine |
| Extend existing connection-error test      | It already owns `FakePoolClient` cleanup behavior                                  | coordinator amendment           |
| Internal stale comments are in scope later | False maintenance guidance should not survive a systemic honesty sweep             | `adapter.ts:173,216`            |
| Debug namespace stays                      | Observable compatibility, not prose                                                | `adapter.ts:30`                 |

## Drift

| Drift                                                                     | Severity                     | Logged in drift.md |
| ------------------------------------------------------------------------- | ---------------------------- | ------------------ |
| Current TLS `verify_identity` mode does not set mysql2 `verifyIdentity`   | significant                  | yes                |
| Coordinator widened the product envelope 5 → 7 and prescribed the seam    | significant                  | yes                |
| User's five-artifact allowlist excludes harness-mandatory `supervisor.md` | significant process variance | yes                |

## Gate Results — immutable base

### Static / docs gates

| Gate                     | Command or check                                                                                           | Result         | Notes                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| Docs source format       | `deno task --cwd docs/site check:source-format`                                                            | PASS           | `Docs source format: OK`.                                                             |
| Docs accuracy            | `deno task docs:accuracy`                                                                                  | PASS           | 199 source pages; does not catch current false claims.                                |
| Existing page doctest    | structured `run-deno-check.ts --root docs/site/reference/prisma-adapter-mysql --ext ts`                    | PASS           | One file; only factory construction, not full Markdown example.                       |
| Actual package example   | structured `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts`       | PASS           | One file; false-green because its Prisma path is commented out.                       |
| Package check            | structured `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts`                               | PASS           | 12 files, zero diagnostics.                                                           |
| Package tests            | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`                           | PASS           | 46 passed, 0 failed.                                                                  |
| Focused connection tests | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts` | PASS           | 33 passed; mapping and positive close count are absent.                               |
| Full export-map doc lint | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                         | PASS           | Root `./mod.ts`, zero diagnostics.                                                    |
| Publish dry-run          | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                            | PASS           | Eight files, no real slow-type diagnostic.                                            |
| JSR audit                | `audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                                         | PASS with WARN | Exit 0; helper counts “Checking for slow types” banner; raw dry-run is authoritative. |

### Runtime gates

| Gate                                               | Result  | Notes                                                                   |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Live MySQL / Aspire / Docker / browser / `e2e:cli` | NOT RUN | Explicitly prohibited. Focused seam tests are the required future path. |

### New gates required on implementation head

- Direct check of the actual example after its Prisma path becomes live.
- Exact option-translation and successful exactly-once pool-close assertions in the existing test.
- Structured package lint/fmt, quality gate, internal-seam boundary check, and final seven-path
  falsehood census.
- Repeat all base static/publish/JSR gates.

## Handoff Notes

- Evaluator should inspect `research.md` option table and rows 8-11 of the falsehood census first.
- The highest-risk false-done is accepting the green existing doctest as example compilation.
- The TLS defect is owned by the amended plan; prose-only correction remains insufficient.
- An eighth product path is still a rescope.
- Fresh independent Tier-A follows. This generator has not self-reviewed or self-certified.
