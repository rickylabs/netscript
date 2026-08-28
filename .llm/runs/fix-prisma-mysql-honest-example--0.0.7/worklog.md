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
- `basic-usage.ts` stable shell — non-literal dynamic URL targets the generated client without a
  permanent tracked-tree import failure. Root checking leaves the dynamic client untyped;
  specialized scratch evidence owns its real Prisma contract.
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

| # | Slice                                                                                                                         | Gate                                                                                                                                                                      | Files                                                                                |
| - | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1 | Legacy TLS deprecation/mapping characterization, Prisma result-type compatibility, internal-source seam, and cleanup evidence | focused structured tests; real generated-client compatibility check; package check/lint/fmt; quality/arch                                                                 | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`, run artifacts   |
| 2 | One live factory/query/finally-disconnect story across all consumer-facing surfaces                                           | ordinary clean root check before/after scratch; static real-client compatibility wrapper; actual dynamic-import smoke; docs format/accuracy; doc lint; publish/JSR/census | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`, run artifacts |

### Deferred Scope

- Any eighth product path, including the site doctest, a new package test, generated fixture,
  changelog, config, or tooling — coordinator rescope.
- Public-barrel translator/adapter exports and runtime pool injection — forbidden by the authorized
  seam shape.
- Connection-string support — different/higher-level surface.
- TLS runtime behavior changes, a replacement mode, or removal of `verify_identity` — separately
  scoped breaking change.
- Live backend/service-runtime verification and `e2e:cli` — prohibited for this leaf. The bounded
  import-only smoke executes module loading after scratch generation but never runs the query or
  opens a MySQL connection.
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
| 2026-08-28 | Tier-A    | F1 fail      | Fresh Tier-A failed `3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone. In a pristine archive, the planned literal generated-client import left ordinary 12-file root checking permanently red with `TS2307` after cleanup; gate 5's `mod.ts` selection hid it. F2-F4 were accepted.                                                     |
| 2026-08-28 | planning  | F1 repair    | Re-derived a non-literal URL dynamic import in a tracked-files archive. Ordinary root checking selected 12 files and passed before generation and after cleanup. A static scratch wrapper passed real Prisma factory/query/disconnect types, and importing the actual example printed `dynamic-import-smoke:ok` without contacting MySQL.    |

## Decisions

| Decision                                                                          | Reason                                                                                                                                                                                                                                                                                     | Source                                            |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| PLAN-EVAL selected; cycle 1 failed, final cycle pending grant                     | Formal evaluation is reserved for critical/complex/decision-heavy work. #1112 qualifies because it combines published integration docs, a real generated-client import, lifecycle, public option truth, and TLS compatibility; routine/mechanical leaves use `PLAN-EVAL: N/A` plus Tier-A. | owner policy; cycle-1 verdict; harness separation |
| No implementation                                                                 | Explicit research+plan-only grant                                                                                                                                                                                                                                                          | user brief                                        |
| No eighth path                                                                    | Amended frozen envelope is a hard ceiling                                                                                                                                                                                                                                                  | coordinator amendment                             |
| Translator stays source-internal                                                  | Direct test visibility without new published API or runtime injection                                                                                                                                                                                                                      | coordinator amendment; doctrine                   |
| Extend existing connection-error test                                             | It already owns `FakePoolClient` cleanup behavior                                                                                                                                                                                                                                          | coordinator amendment                             |
| Internal stale comments are in scope later                                        | False maintenance guidance should not survive a systemic honesty sweep                                                                                                                                                                                                                     | `adapter.ts:173,216`                              |
| Debug namespace stays                                                             | Observable compatibility, not prose                                                                                                                                                                                                                                                        | `adapter.ts:30`                                   |
| TLS runtime mapping stays unchanged                                               | Tightening either legacy branch is breaking; deprecate/document/characterize instead                                                                                                                                                                                                       | coordinator TLS ruling                            |
| Package example uses a non-literal dynamic URL targeting `./.generated/client.ts` | Ordinary root checking must keep the example selected and resolvable after generated output is removed. Static scratch checking and an actual-module import smoke separately prove the real client.                                                                                        | Tier-A F1 repair probe                            |
| Root shell and generated-client gates make different claims                       | The clean root gate validates tracked shell/control flow but leaves `PrismaClient`/`prisma` untyped; only the specialized scratch gate proves factory/query/disconnect compatibility.                                                                                                      | Tier-A F1 ruling                                  |
| Result-set declaration narrows to Prisma type                                     | Real generated-client checking exposed `number[]` as the sole adapter structural mismatch; `SqlResultSet['columnTypes']` passes without runtime change                                                                                                                                     | cycle-1 repair probe                              |

## Drift

| Drift                                                                                           | Severity                      | Logged in drift.md |
| ----------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| Current TLS `verify_identity` mode overstates its unchanged legacy mapping                      | significant                   | yes                |
| Coordinator widened the product envelope 5 → 7 and prescribed the seam                          | significant                   | yes                |
| Exact-pin mysql2 probe transiently added one `deno.lock` resolution                             | transient process side effect | yes                |
| Original five-artifact allowlist omitted `supervisor.md`; bounded amendment resolved it         | resolved process variance     | yes                |
| PLAN-EVAL cycle 1 exposed an unresolved generated-client import and public result-type mismatch | significant plan defect       | yes                |
| Tier-A exposed permanent post-cleanup `TS2307` hidden by the narrowed package gate              | significant plan defect       | yes                |

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

### Tier-A F1 repair evidence — pristine archive, not implementation verdict

| Job                            | Condition / command                                                                                             | Measured result                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Stable shell before generation | No `.generated`; ordinary structured `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx`      | 12 selected, 0 failed batches, 0 diagnostics, exit 0                           |
| Static generated compatibility | Real Prisma 7.8 client plus structured check of `.llm/tmp/prisma-example-compatibility.ts`                      | 1 selected, 0 diagnostics, exit 0; factory/query/`finally` disconnect typed    |
| Actual dynamic import          | Import-only `deno eval --no-lock --config=.llm/tmp/prisma-example-check-deno.json` of `examples/basic-usage.ts` | Exit 0, `dynamic-import-smoke:ok`; `import.meta.main` false, so no query/MySQL |
| Stable shell after cleanup     | `.generated` moved out; repeat ordinary 12-file root wrapper                                                    | 12 selected, 0 failed batches, 0 diagnostics, exit 0                           |

These probes used a tracked-files-only `git archive` at failed head `3e0f2223a`; no untracked
residue could make the clean-shell jobs green. They validate the plan architecture only. No product
change was retained in the leaf worktree.

### New gates required on implementation head

- Ordinary package-root structured check selects all 12 files with no generated output; repeat it
  after specialized-gate cleanup. No exclusion is allowed.
- Scratch-generate a real Prisma 7.8 client, statically check factory/query/disconnect through the
  compatibility wrapper, then import the actual example module and require `dynamic-import-smoke:ok`
  without contacting MySQL.
- Prove the source declaration uses Prisma's `SqlResultSet['columnTypes']` contract so the real
  generated client accepts the factory.
- Exact option-translation characterization—including plaintext with no CAs and CA-only forwarding
  with non-empty CAs—and successful exactly-once pool-close assertions in the existing test.
- Structured package lint/fmt, quality gate, internal-seam boundary check, and final seven-path
  falsehood census.
- Repeat all base static/publish/JSR gates.

## Handoff Notes

- Evaluator should inspect `research.md` option table and rows 8-11 of the falsehood census first.
- The highest-risk false-done is calling the dynamic example fully type-checked. Gate 1 validates
  the stable tracked shell with `PrismaClient`/`prisma` untyped; gate 5 alone proves real generated
  factory/query/disconnect types and executes the dynamic import.
- The TLS defect is owned through public deprecation, exact documentation, and characterization
  tests. Runtime change or removal remains deferred to a separately scoped breaking change.
- An eighth product path is still a rescope.
- Cycle 1 returned `FAIL_PLAN`, and fresh Tier-A failed the first repair on F1. This repaired head
  requires a fresh Tier-A pass before any coordinator grant for PLAN-EVAL cycle 2. This generator
  has not self-reviewed or self-certified.
