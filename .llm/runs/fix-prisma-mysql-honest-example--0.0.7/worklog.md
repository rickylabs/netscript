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
- `PrismaMySqlResultSet.columnTypes` — public source declaration aligned to Prisma's actual
  `SqlResultSet['columnTypes']` so a real generated client accepts the factory; runtime mapping is
  unchanged.
- Legacy `DenoMySqlClient`, `DenoMySqlConnection`, and supporting result/field types — planned
  deletion because they do not model the shipped driver.

### Domain Vocabulary

- **Factory** — object passed to Prisma; exposes `connect()`.
- **Connected adapter** — owns one mysql2 pool and closes it through `dispose()`.
- **Structured config** — host/port/user/password/db/pool/timeout/TLS fields; no direct URL form.
- **Initial-connect timeout** — mysql2 `connectTimeout`, not an operation deadline.
- **Connection-error observer** — contained callback selected by the shipped closed classifier.
- **Deprecated legacy TLS mode** — `verify_identity` does not satisfy its name: without non-empty
  CAs it requests no TLS, while with non-empty CAs it forwards only joined `ssl.ca` and does not
  enable mysql2 hostname identity verification. This leaf documents and characterizes, but does not
  change, that behavior.

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

| # | Slice                                                                                                                         | Gate                                                                                                      | Files                                                                                |
| - | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1 | Legacy TLS deprecation/mapping characterization, Prisma result-type compatibility, internal-source seam, and cleanup evidence | focused structured tests; real generated-client compatibility check; package check/lint/fmt; quality/arch | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`, run artifacts   |
| 2 | One live factory/query/finally-disconnect story across all consumer-facing surfaces                                           | scratch generation plus direct actual-example check; docs format/accuracy; doc lint; publish/JSR/census   | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`, run artifacts |

### Deferred Scope

- Any eighth product path, including the site doctest, a new package test, generated fixture,
  changelog, config, or tooling — coordinator rescope.
- Public-barrel translator/adapter exports and runtime pool injection — forbidden by the authorized
  seam shape.
- Connection-string support — different/higher-level surface.
- TLS runtime behavior changes, a replacement mode, or removal of `verify_identity` — separately
  scoped breaking change.
- Live backend/runtime verification and `e2e:cli` — prohibited for this leaf.
- #1664 and #1293 issue wording/state — explicitly untouched.

### Contributor Path

A contributor starts at `src/mod.ts` / `deno doc`, follows `PrismaMySql` into `adapter.ts`, checks
`MySqlConnectionConfig` and `PrismaMySqlOptions` in `types.ts`, and keeps README/site examples in
the same factory → generated Prisma client → query → `$disconnect()` order.

## Progress Log

| Date       | Slice     | Step         | Notes                                                                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28 | planning  | Bootstrap    | Read live issue, verified exact base/branch/clean tree, loaded requested harness/doctrine/tooling/JSR/PR guidance.                                                                                                                                                                                                                           |
| 2026-08-28 | planning  | Research     | Rendered `deno doc`, searched/read all seven paths, traced options, inspected Prisma/mysql2 declarations, and audited the prescribed seams.                                                                                                                                                                                                  |
| 2026-08-28 | planning  | Base gates   | Ran only allowed non-runtime gates; tree remained clean.                                                                                                                                                                                                                                                                                     |
| 2026-08-28 | planning  | Design       | Locked the seven-path plan, source-only translator seam, existing-test ownership, and legacy TLS deprecation/characterization. No product mutation.                                                                                                                                                                                          |
| 2026-08-28 | planning  | Lock hygiene | Exact-pin mysql2 probing added one transient `deno.lock` resolution; gate 15 caught it before staging, and the targeted reversal restored a byte-identical base lock.                                                                                                                                                                        |
| 2026-08-28 | plan gate | Cycle 1      | Fresh opposite-family PLAN-EVAL returned `FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`: the generated-client import was not actually resolved; census expectation under-counted; PR phase comments were absent; JSR tool path was incomplete.                                                                                    |
| 2026-08-28 | planning  | F1 probe     | Detached scratch generation proved exact `./.generated/client.ts`. The wrapper reached a real `number[]` versus `ColumnType[]` adapter incompatibility, then exited 0 after a prospective `SqlResultSet['columnTypes']` type-only correction in approved `adapter.ts`. Scratch worktree/output was removed; leaf tree and lock stayed clean. |
| 2026-08-28 | planning  | Repair       | Amended D3, slice 2, gate 1, risk/census/context claims, the JSR path, and PLAN-EVAL policy together. No product mutation; cycle 2 remains unlaunched pending coordinator grant.                                                                                                                                                             |

## Decisions

| Decision                                                      | Reason                                                                                                                                                                                                                                                                                     | Source                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| PLAN-EVAL selected; cycle 1 failed, final cycle pending grant | Formal evaluation is reserved for critical/complex/decision-heavy work. #1112 qualifies because it combines published integration docs, a real generated-client import, lifecycle, public option truth, and TLS compatibility; routine/mechanical leaves use `PLAN-EVAL: N/A` plus Tier-A. | owner policy; cycle-1 verdict; harness separation |
| No implementation                                             | Explicit research+plan-only grant                                                                                                                                                                                                                                                          | user brief                                        |
| No eighth path                                                | Amended frozen envelope is a hard ceiling                                                                                                                                                                                                                                                  | coordinator amendment                             |
| Translator stays source-internal                              | Direct test visibility without new published API or runtime injection                                                                                                                                                                                                                      | coordinator amendment; doctrine                   |
| Extend existing connection-error test                         | It already owns `FakePoolClient` cleanup behavior                                                                                                                                                                                                                                          | coordinator amendment                             |
| Internal stale comments are in scope later                    | False maintenance guidance should not survive a systemic honesty sweep                                                                                                                                                                                                                     | `adapter.ts:173,216`                              |
| Debug namespace stays                                         | Observable compatibility, not prose                                                                                                                                                                                                                                                        | `adapter.ts:30`                                   |
| TLS runtime mapping stays unchanged                           | Tightening either legacy branch is breaking; deprecate/document/characterize instead                                                                                                                                                                                                       | coordinator TLS ruling                            |
| Exact package-example import is `./.generated/client.ts`      | Scratch generation resolves a real Prisma 7.8 Deno client without committing generated output or an eighth path                                                                                                                                                                            | cycle-1 repair probe                              |
| Result-set declaration narrows to Prisma type                 | Real generated-client checking exposed `number[]` as the sole adapter structural mismatch; `SqlResultSet['columnTypes']` passes without runtime change                                                                                                                                     | cycle-1 repair probe                              |

## Drift

| Drift                                                                                           | Severity                      | Logged in drift.md |
| ----------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| Current TLS `verify_identity` mode overstates its unchanged legacy mapping                      | significant                   | yes                |
| Coordinator widened the product envelope 5 → 7 and prescribed the seam                          | significant                   | yes                |
| Exact-pin mysql2 probe transiently added one `deno.lock` resolution                             | transient process side effect | yes                |
| Original five-artifact allowlist omitted `supervisor.md`; bounded amendment resolved it         | resolved process variance     | yes                |
| PLAN-EVAL cycle 1 exposed an unresolved generated-client import and public result-type mismatch | significant plan defect       | yes                |

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
| JSR audit                | `.llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                      | PASS with WARN | Exit 0; helper counts “Checking for slow types” banner; raw dry-run is authoritative. |

### Runtime gates

| Gate                                               | Result  | Notes                                                                   |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Live MySQL / Aspire / Docker / browser / `e2e:cli` | NOT RUN | Explicitly prohibited. Focused seam tests are the required future path. |

### Planning hygiene receipt

| Existing gate                 | Detection                                                                                                      | Remediation                                                        | Final evidence                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate 15 — git/lock/path truth | Direct status/diff found the transient `"npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3",` line before staging | Removed only that probe-generated line; no lockfile/cache deletion | `git diff --exit-code cf648f1ff973d74c213bb125a6f5f5b9328e693b -- deno.lock` returned zero before commit; `deno.lock` never entered history |

### New gates required on implementation head

- Scratch-generate a real Prisma 7.8 client, then directly check the actual example's exact
  `./.generated/client.ts` import and live Prisma path with the structured wrapper; remove generated
  output before handoff.
- Prove the source declaration uses Prisma's `SqlResultSet['columnTypes']` contract so the real
  generated client accepts the factory.
- Exact option-translation characterization—including plaintext with no CAs and CA-only forwarding
  with non-empty CAs—and successful exactly-once pool-close assertions in the existing test.
- Structured package lint/fmt, quality gate, internal-seam boundary check, and final seven-path
  falsehood census.
- Repeat all base static/publish/JSR gates.

## Handoff Notes

- Evaluator should inspect `research.md` option table and rows 8-11 of the falsehood census first.
- The highest-risk false-done is accepting either the green existing doctest or an ungenerated
  `@prisma/client` `any` stub as example compilation. Gate 1 must use the real scratch-generated
  `./.generated/client.ts` import.
- The TLS defect is owned through public deprecation, exact documentation, and characterization
  tests. Runtime change or removal remains deferred to a separately scoped breaking change.
- An eighth product path is still a rescope.
- Cycle 1 returned `FAIL_PLAN`; the repaired plan awaits a coordinator grant before the final
  independent PLAN-EVAL cycle. This generator has not self-reviewed or self-certified.
