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
- `basic-usage.ts` stable shell — literal dynamic `await import('./.generated/client.ts')` avoids a
  permanent tracked-tree import failure on Deno 2.9.5. With output absent, root checking leaves the
  client untyped; with output present, gate 5 types the actual example against the real Prisma 7
  client. This is temporary Prisma 7 correctness ahead of Prisma 8/Prisma-next, not new
  architecture.
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

| # | Slice                                                                                                                         | Gate                                                                                                                                                                                            | Files                                                                                |
| - | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1 | Legacy TLS deprecation/mapping characterization, Prisma result-type compatibility, internal-source seam, and cleanup evidence | focused structured tests; real generated-client compatibility check; package check/lint/fmt; quality/arch                                                                                       | `src/adapter.ts`, `src/types.ts`, `tests/connection_errors_test.ts`, run artifacts   |
| 2 | One live factory/query/finally-disconnect story across all consumer-facing surfaces                                           | ordinary clean root check before/after scratch; gate-5 actual-example check; guarded dynamic-import smoke; docs format/accuracy; doc lint; publish/JSR/census | `src/mod.ts`, `README.md`, `examples/basic-usage.ts`, site `index.md`, run artifacts |

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

| Date       | Slice     | Step            | Notes                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28 | planning  | Bootstrap       | Read live issue, verified exact base/branch/clean tree, loaded requested harness/doctrine/tooling/JSR/PR guidance.                                                                                                                                                                                                                                                    |
| 2026-08-28 | planning  | Research        | Rendered `deno doc`, searched/read all seven paths, traced options, inspected Prisma/mysql2 declarations, and audited the prescribed seams.                                                                                                                                                                                                                           |
| 2026-08-28 | planning  | Base gates      | Ran only allowed non-runtime gates; tree remained clean.                                                                                                                                                                                                                                                                                                              |
| 2026-08-28 | planning  | Design          | Locked the seven-path plan, source-only translator seam, existing-test ownership, and legacy TLS deprecation/characterization. No product mutation.                                                                                                                                                                                                                   |
| 2026-08-28 | planning  | Lock hygiene    | Exact-pin mysql2 probing added one transient `deno.lock` resolution; gate 15 caught it before staging, and the targeted reversal restored a byte-identical base lock.                                                                                                                                                                                                 |
| 2026-08-28 | plan gate | Cycle 1         | Fresh opposite-family PLAN-EVAL returned `FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`: the generated-client import was not actually resolved; census expectation under-counted; PR phase comments were absent; JSR tool path was incomplete.                                                                                                             |
| 2026-08-28 | planning  | F1 probe        | Detached scratch generation proved exact `./.generated/client.ts`. The wrapper reached a real `number[]` versus `ColumnType[]` adapter incompatibility, then exited 0 after a prospective `SqlResultSet['columnTypes']` type-only correction in approved `adapter.ts`. Scratch worktree/output was removed; leaf tree and lock stayed clean.                          |
| 2026-08-28 | planning  | Repair          | Amended D3, slice 2, gate 1, risk/census/context claims, the JSR path, and PLAN-EVAL policy together. No product mutation; cycle 2 remains unlaunched pending coordinator grant.                                                                                                                                                                                      |
| 2026-08-28 | Tier-A    | F1 fail         | Fresh Tier-A failed `3e0f2223ac7bed9068ecc033c92da7ffbed83711` on F1 alone. In a pristine archive, the planned static generated-client import left ordinary 12-file root checking permanently red with `TS2307` after cleanup; gate 5's `mod.ts` selection hid it. F2-F4 were accepted.                                                                               |
| 2026-08-28 | planning  | F1 repair       | Re-derived a non-literal URL dynamic import in a tracked-files archive. Ordinary root checking selected 12 files and passed before generation and after cleanup. A static scratch wrapper passed real Prisma factory/query/disconnect types, and importing the actual example printed `dynamic-import-smoke:ok` without contacting MySQL.                             |
| 2026-08-28 | plan gate | Cycle 2         | Fresh PLAN-EVAL returned terminal `FAIL_PLAN` at `da769cd7c8e0438f2317ed761ec10bce15692d03` on F1-b. Deno 2.9.5 literal dynamic import preserved both clean-root behavior and real generated typing, proving the non-literal premise unnecessary; advisories required consumer import-map wording, generated-window semantics, and a pinned `import.meta.main` guard. |
| 2026-08-28 | planning  | Owner amendment | Owner accepted F1-b and authorized only the literal-dynamic-import correction inside the existing seven paths. No cycle 3, third evaluator, implementation, architecture expansion, or product mutation is authorized; focused Tier-A follows this pushed artifact head.                                                                                              |
| 2026-08-29 | impl      | Grant           | Coordinator granted implementation at Tier-A-passed plan head `6ae7113eb4636972ef1df80fc08e6e3a0390d3fb`; the seven-path ceiling and two-slice order remain fixed. |
| 2026-08-29 | slice 1   | Load-bearing D17 check | Generated a real Prisma 7.8 client in scratch and checked the actual edited example. Before D17 it failed once with `TS2322` (`PrismaMySqlAdapterFactory` not assignable to `SqlDriverAdapterFactory`); after narrowing `columnTypes` it selected one file with zero diagnostics. The guarded import-only smoke printed `dynamic-import-smoke:ok`. |
| 2026-08-29 | slice 1   | Source contract | Added the source-only translator seam, exact structured-to-mysql2 characterization (including both legacy TLS branches), deprecated the misleading mode without runtime change, and asserted successful pool cleanup exactly once. Focused tests passed 38/38. |
| 2026-08-29 | slice 1   | D17 wrapper choice | Dropped the optional scratch compatibility wrapper. The actual-example check exercises the same factory construction, Prisma client construction, query, and `finally` disconnect with the real generated client, and caught the identical D17 defect; retaining a second scratch program would duplicate evidence and add drift surface. |
| 2026-08-29 | slice 1   | Scratch cleanup | Removed `examples/.generated` and all `.llm/tmp/prisma-example*` inputs after the green actual-file check and smoke. The ordinary package-root wrapper then selected 12 files with zero diagnostics; `deno.lock` remained unchanged. |
| 2026-08-29 | slice 1   | Reconcile       | Pushed `69f4ab932`, confirmed PR #1711 remained draft at that head, read the existing evaluator/supervisor trail, and posted the slice evidence without changing labels, readiness, checkboxes, or issue state. A shell-quoting mistake transiently expanded Markdown backticks and produced a malformed comment; the same comment was rewritten in place as `issuecomment-5461874377` with the intended bounded evidence. |
| 2026-08-29 | slice 2   | Coherent surface | Replaced stale driver/lifecycle claims across the module docs, README, site page, and executable example; removed dead Deno-driver types and their root re-exports. The example now performs a live Prisma query and disconnects in `finally`, with `main()` exclusively guarded by `import.meta.main`. |
| 2026-08-29 | slice 2   | Generated-client proof | Regenerated the scratch Prisma 7.8 client after the final public-type shape, checked the actual example with 1 selected and 0 diagnostics, ran the guarded import-only smoke successfully, and removed all generated/scratch output. |
| 2026-08-29 | slice 2   | Static/publish gates | Clean-root check selected 12/12; package tests passed 51/51; docs format/accuracy, full export-map doc lint, publish dry-run, and JSR audit exited 0. Final exact-head reruns remain required after commit. |

## Implementation Evidence

### Slice 1 — source contract and characterization

| Evidence | Result |
| --- | --- |
| Actual example before D17 | Structured real-client check exited 1 with one `TS2322` at `new PrismaClient({ adapter })`. |
| Actual example after D17 | Structured real-client check selected 1 file, 0 diagnostics, exit 0. |
| Guarded import-only smoke | Exit 0; printed `dynamic-import-smoke:ok`; `main()` remained exclusively under `import.meta.main`. |
| Focused adapter test | 38 passed, 0 failed, including exact option mapping, both legacy TLS branches, and exactly-once successful close. |
| Clean package check | 12 selected, 0 failed batches, 0 diagnostics after scratch cleanup. |
| Package lint / format | 12 selected with zero lint findings; 12 selected with zero format findings after targeted formatting. |
| Code quality / doctrine | `deno task quality:gate` exit 0; repository scan had no findings and doctrine reported only existing warnings. |

This is generator-run evidence, not Tier-A review or self-certification.

### Slice 2 — coherent published and executable story

| Evidence | Result |
| --- | --- |
| Actual generated example | 1 selected, 0 diagnostics with real Prisma 7.8 output present. |
| Guarded import-only smoke | Exit 0; `dynamic-import-smoke:ok`; no MySQL operation ran. |
| Clean package shell | 12 selected, 0 diagnostics after generated/scratch cleanup. |
| Package tests | 51 passed, 0 failed. |
| Docs source / accuracy | `Docs source format: OK`; docs accuracy PASS across 199 published pages. |
| Full export-map docs | 1 entrypoint, 0 private-type/missing-doc diagnostics after the inline Prisma 7 column-type correction. |
| Publish / JSR | Dry-run success with 8 intended files; JSR audit exit 0 with the known banner-only slow-type warning. |
| Driver census | Every Correct/Delete row applied; only `adapter.ts:30` legacy debug namespace remains. |

These working-tree results are slice evidence. Gates 1–15 are rerun after the slice commit so the
final report refers to the exact final head.

### CI agent-docs corpus freshness follow-up

| Evidence | Result |
| --- | --- |
| Corpus regeneration | `deno task gen:agent-docs-prose` exited 0 and regenerated only `.llm/assets/agent-docs/prose.json.gz` and `.llm/assets/agent-docs/provenance.json`. |
| Corpus freshness | `deno task check:agent-docs-prose` exited 0 with `fresh: true` and no stale paths. |

CI exposed this omitted generated-cascade gate after IMPL-EVAL cycle 1 had passed. The source page is
listed in `provenance.json`, so its checked-in corpus assets are part of the required consequence of
the owned documentation edit.

## Decisions

| Decision                                                                      | Reason                                                                                                                                                                                                                         | Source                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| PLAN-EVAL completed with two terminal failures; owner settled F1-b            | Cycle 2 found the avoidable non-literal typing loss. The two-cycle limit is exhausted; the owner authorized a bounded amendment and focused Tier-A, with no cycle 3 or third evaluator.                                        | owner ruling; cycle-2 verdict; harness separation |
| No implementation                                                             | Explicit research+plan-only grant                                                                                                                                                                                              | user brief                                        |
| No eighth path                                                                | Amended frozen envelope is a hard ceiling                                                                                                                                                                                      | coordinator amendment                             |
| Translator stays source-internal                                              | Direct test visibility without new published API or runtime injection                                                                                                                                                          | coordinator amendment; doctrine                   |
| Extend existing connection-error test                                         | It already owns `FakePoolClient` cleanup behavior                                                                                                                                                                              | coordinator amendment                             |
| Internal stale comments are in scope later                                    | False maintenance guidance should not survive a systemic honesty sweep                                                                                                                                                         | `adapter.ts:173,216`                              |
| Debug namespace stays                                                         | Observable compatibility, not prose                                                                                                                                                                                            | `adapter.ts:30`                                   |
| TLS runtime mapping stays unchanged                                           | Tightening either legacy branch is breaking; deprecate/document/characterize instead                                                                                                                                           | coordinator TLS ruling                            |
| Package example uses literal dynamic `await import('./.generated/client.ts')` | On Deno 2.9.5, unresolved dynamic imports defer to runtime, keeping gate 1 green; with the client present, gate 5 gives the actual shipped example real generated types.                                                       | cycle-2 F1-b; owner ruling                        |
| Root shell and generated-client gates make different claims                   | With output absent, gate 1 validates tracked shell/control flow but leaves `PrismaClient`/`prisma` untyped. With output present, gate 5 checks the actual example and runs the guarded import smoke. The optional duplicate D17 wrapper was dropped during implementation. | cycle-2 F1-b; implementation discretion           |
| Generated client needs consumer dependency resolution                         | Root `catalog:` is not an import map; owned example/README prose must require `@prisma/client` resolution through a consumer import map or `npm:` specifier.                                                                   | cycle-2 advisory A1                               |
| Result-set declaration narrows to Prisma type                                 | Real generated-client checking exposed `number[]` as the sole adapter structural mismatch; `SqlResultSet['columnTypes']` passes without runtime change                                                                         | cycle-1 repair probe                              |

## Drift

| Drift                                                                                           | Severity                      | Logged in drift.md |
| ----------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| Current TLS `verify_identity` mode overstates its unchanged legacy mapping                      | significant                   | yes                |
| Coordinator widened the product envelope 5 → 7 and prescribed the seam                          | significant                   | yes                |
| Exact-pin mysql2 probe transiently added one `deno.lock` resolution                             | transient process side effect | yes                |
| Original five-artifact allowlist omitted `supervisor.md`; bounded amendment resolved it         | resolved process variance     | yes                |
| PLAN-EVAL cycle 1 exposed an unresolved generated-client import and public result-type mismatch | significant plan defect       | yes                |
| Tier-A exposed permanent post-cleanup `TS2307` hidden by the narrowed package gate              | significant plan defect       | yes                |
| PLAN-EVAL cycle 2 exposed avoidable `any` from the non-literal import premise                   | significant plan defect       | yes                |
| Plan gates omitted agent-docs corpus freshness for an in-corpus documentation page              | generated-cascade gate gap     | yes                |

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

### PLAN-EVAL cycle-2 F1-b evidence — evaluator/supervisor measurement, not author certification

| Job                                   | Condition / command                                                                                                  | Measured result                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Literal dynamic shell, output absent  | Deno 2.9.5 ordinary structured package-root check                                                                    | 12 selected, 0 failed batches, 0 diagnostics, exit 0                                                  |
| Actual example, generated client live | Structured `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts` under the scratch config | Real generated type retained; deliberate number misuse produced `TS2322` rather than passing as `any` |
| Connected-adapter misuse              | Actual example with `adapter: await factory.connect()` under the same generated window                               | `TS2741`, required factory `connect` method missing                                                   |
| Guarded import smoke                  | Import the example module with generated output present while `main()` stays exclusively inside `import.meta.main`   | `dynamic-import-smoke:ok`; no query or MySQL connection                                               |
| Literal dynamic shell after cleanup   | Remove generated/scratch output and repeat the ordinary package-root check                                           | 12 selected, 0 failed batches, 0 diagnostics, exit 0                                                  |

The cycle-2 artifact is commit `60cf79ee54ca17dfaa7d62c609290993040539f9`, file
`plan-eval-cycle-2.md`. The owner accepted its blocking finding. These measurements justify the
bounded plan correction but are not this generator's Tier-A verdict.

### New gates required on implementation head

- Ordinary package-root structured check selects all 12 files with no generated output; repeat it
  after specialized-gate cleanup. No exclusion is allowed, and gate 1 is undefined while
  `.generated` exists.
- Scratch-generate a real Prisma 7.8 client, check the actual example under the scratch config,
  then import the actual module and require
  `dynamic-import-smoke:ok`. `main()` invocation must stay exclusively inside `import.meta.main`, so
  the smoke cannot contact MySQL.
- Prove the source declaration uses Prisma's `SqlResultSet['columnTypes']` contract so the real
  generated client accepts the factory.
- Exact option-translation characterization—including plaintext with no CAs and CA-only forwarding
  with non-empty CAs—and successful exactly-once pool-close assertions in the existing test.
- Structured package lint/fmt, quality gate, internal-seam boundary check, and final seven-path
  falsehood census.
- Repeat all base static/publish/JSR gates.

## Handoff Notes

- Evaluator should inspect `research.md` option table and rows 8-11 of the falsehood census first.
- The highest-risk false-done is calling gate 1 a full client type check. With output absent, it
  validates the stable tracked shell while `PrismaClient`/`prisma` remain untyped. Gate 5 checks the
  actual example itself with real generated types and executes the guarded
  dynamic import.
- The TLS defect is owned through public deprecation, exact documentation, and characterization
  tests. Runtime change or removal remains deferred to a separately scoped breaking change.
- An eighth product path is still a rescope.
- Cycle 2 returned terminal `FAIL_PLAN`; the owner accepted F1-b and authorized this bounded
  amendment. There is no cycle 3 or third evaluator. A fresh focused Tier-A reviews the pushed head;
  this generator has not self-reviewed or self-certified.
