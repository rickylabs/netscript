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
- Site, README, and root module JSDoc — one synchronized manual for this surface.
- Legacy `DenoMySqlClient`, `DenoMySqlConnection`, and supporting result/field types — planned
  deletion because they do not model the shipped driver.

### Domain Vocabulary

- **Factory** — object passed to Prisma; exposes `connect()`.
- **Connected adapter** — owns one mysql2 pool and closes it through `dispose()`.
- **Structured config** — host/port/user/password/db/pool/timeout/TLS fields; no direct URL form.
- **Initial-connect timeout** — mysql2 `connectTimeout`, not an operation deadline.
- **Connection-error observer** — contained callback selected by the shipped closed classifier.
- **Identity verification mode** — must map to mysql2 `ssl.verifyIdentity: true` or be removed/
  deprecated; current implementation does not satisfy the name.

### Ports

- Prisma `SqlDriverAdapterFactory` / `SqlDriverAdapter` — external consumed contract.
- mysql2 promise `Pool` / `PoolConnection` — external driver edge.
- Existing injectable `MysqlPoolClient` at `PrismaMySqlAdapter` construction — cleanup test seam.
- Missing pool-options/pool-factory injection — option-translation testability gap and rescope.

### Constants

- `PACKAGE_NAME` remains `@netscript/prisma-adapter-mysql`.
- Debug namespace remains exactly `prisma:driver-adapter:deno-mysql` for compatibility.
- Provider remains exactly `mysql`.

### Commit Slices

| # | Slice                                                                              | Gate                                                                               | Files                                                         |
| - | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1 | Honest source/public contract, legacy-type deletion, and authorized TLS correction | structured package gates; full export doc lint; quality/arch; publish; JSR         | `src/types.ts`, `src/mod.ts`, `src/adapter.ts`, run artifacts |
| 2 | One import-correct factory/query/finally-disconnect story across site and README   | full doctest after rescope; docs format/accuracy; final package/publish/JSR/census | site `index.md`, package `README.md`, run artifacts           |

### Deferred Scope

- Any sixth product path, including docs/package tests and changelog — coordinator rescope.
- Connection-string support — different/higher-level surface.
- Live backend/runtime verification and `e2e:cli` — prohibited for this leaf.
- #1664 and #1293 issue wording/state — explicitly untouched.

### Contributor Path

A contributor starts at `src/mod.ts` / `deno doc`, follows `PrismaMySql` into `adapter.ts`, checks
`MySqlConnectionConfig` and `PrismaMySqlOptions` in `types.ts`, and keeps README/site examples in
the same factory → generated Prisma client → query → `$disconnect()` order.

## Progress Log

| Date       | Slice    | Step       | Notes                                                                                                                                 |
| ---------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28 | planning | Bootstrap  | Read live issue, verified exact base/branch/clean tree, loaded requested harness/doctrine/tooling/JSR/PR guidance.                    |
| 2026-08-28 | planning | Research   | Rendered `deno doc`, searched/read all five paths, traced options, inspected Prisma/mysql2 installed declarations, and audited seams. |
| 2026-08-28 | planning | Base gates | Ran only allowed non-runtime gates; tree remained clean.                                                                              |
| 2026-08-28 | planning | Design     | Locked five-path plan and recorded test/TLS rescope. No product mutation.                                                             |

## Decisions

| Decision                                   | Reason                                                                             | Source                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------ |
| PLAN-EVAL selected but not launched        | Product/test scope and TLS semantics need independent review; topic owns evaluator | user brief; harness separation |
| No implementation                          | Explicit research+plan-only grant                                                  | user brief                     |
| No sixth path                              | Frozen envelope is a hard ceiling                                                  | user brief                     |
| Internal stale comments are in scope later | False maintenance guidance should not survive a systemic honesty sweep             | `adapter.ts:173,216`           |
| Debug namespace stays                      | Observable compatibility, not prose                                                | `adapter.ts:30`                |

## Drift

| Drift                                                                     | Severity                     | Logged in drift.md |
| ------------------------------------------------------------------------- | ---------------------------- | ------------------ |
| Current TLS `verify_identity` mode does not set mysql2 `verifyIdentity`   | significant                  | yes                |
| No translation seam and test/doctest files fall outside frozen paths      | significant                  | yes                |
| User's five-artifact allowlist excludes harness-mandatory `supervisor.md` | significant process variance | yes                |

## Gate Results — immutable base

### Static / docs gates

| Gate                     | Command or check                                                                        | Result         | Notes                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| Docs source format       | `deno task --cwd docs/site check:source-format`                                         | PASS           | `Docs source format: OK`.                                                             |
| Docs accuracy            | `deno task docs:accuracy`                                                               | PASS           | 199 source pages; does not catch current false claims.                                |
| Existing page doctest    | structured `run-deno-check.ts --root docs/site/reference/prisma-adapter-mysql --ext ts` | PASS           | One file; only factory construction, not full Markdown example.                       |
| Package check            | structured `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts`            | PASS           | 12 files, zero diagnostics.                                                           |
| Package tests            | structured `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`        | PASS           | 46 passed, 0 failed.                                                                  |
| Full export-map doc lint | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                      | PASS           | Root `./mod.ts`, zero diagnostics.                                                    |
| Publish dry-run          | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                         | PASS           | Eight files, no real slow-type diagnostic.                                            |
| JSR audit                | `audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                      | PASS with WARN | Exit 0; helper counts “Checking for slow types” banner; raw dry-run is authoritative. |

### Runtime gates

| Gate                                               | Result  | Notes                                                                   |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Live MySQL / Aspire / Docker / browser / `e2e:cli` | NOT RUN | Explicitly prohibited. Focused seam tests are the required future path. |

### New gates required on implementation head

- Exact full-example doctest (blocked pending sixth-path rescope).
- Focused option-translation and exactly-once pool-close tests (blocked pending rescope/seam).
- Structured package lint/fmt, quality gate, and final five-path falsehood census.
- Repeat all base static/publish/JSR gates.

## Handoff Notes

- Evaluator should inspect `research.md` option table and rows 8-11 of the falsehood census first.
- The highest-risk false-done is accepting the green existing doctest as example compilation.
- The product blocker is `tls.mode: 'verify_identity'`; prose-only correction cannot satisfy row 4.
- Fresh independent Tier-A follows. This generator has not self-reviewed or self-certified.
