# IMPL-EVAL cycle 1 — #1112 / draft PR #1711

## Verdict: `PASS_IMPL`

No blocking findings. Every plan gate (1–15) re-derived green from a pristine tracked-files-only
archive of the evaluated head; gate 5 was probed and is load-bearing. Four advisories, none of
which change the verdict.

## Head identity

| Field            | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Run              | `fix-prisma-mysql-honest-example--0.0.7` · issue #1112 · draft PR #1711  |
| Evaluated head   | `cd69eb7cbb35fffdd16dba3f68dc26311a45699b` (PR `headRefOid` matches)     |
| Base             | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`                          |
| PR state at eval | draft, `status:plan`, milestone `0.0.7`                                  |
| Evaluator        | Claude Fable 5, fresh session, detached evaluator worktree               |
| Author (not me)  | Codex `gpt-5.6-sol`, thread `01a047f1-…`; not resumed or messaged        |
| Surface          | `@netscript/prisma-adapter-mysql` · Archetype 2 (Integration) · docs overlay |

## Reproduction environment

| Item                 | Value                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Deno                 | 2.9.5 (stable, x86_64-unknown-linux-gnu), TypeScript 6.0.3                                                                 |
| Prisma               | `npm:prisma@7.8.0` generate; `npm:@prisma/client@7.8.0`; `npm:@prisma/driver-adapter-utils@7.8.0`                          |
| Archive `headA`      | `git archive cd69eb7cb \| tar -x` → job tmp; used for gate 1, gate 5 + probes, gates 2/6/7/8/9/14 (lock-tolerant group)    |
| Archive `headB`      | second pristine archive of the same head; used for the lock-sensitive group: gates 3/4/10/11/12                           |
| Archive `base`       | `git archive cf648f1ff` (control; not needed — no red was observed)                                                        |
| Lock sha (all three) | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` before and after every command (head == base)          |
| Residue             | `examples/.generated`, `.llm/tmp/prisma-example*`, and the smoke wrappers were deleted after each generated window; evaluator worktree `git status` clean |

## Re-derived gate table

All commands were run from the archive root. "sel/fb/diag" = files selected / failed batches /
diagnostics from the structured wrappers.

| #  | Gate                          | Command                                                                                                                                              | Result                                                                                                                                                                 |
| -- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Clean-root shell, pre-gen     | `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx` (no `.generated`)                                                              | **PASS** 12/0/0, exit 0                                                                                                                                                |
| 1′ | Clean-root shell, post-clean  | same, repeated after each of three gate-5 windows                                                                                                    | **PASS** 12/0/0 ×3, exit 0                                                                                                                                             |
| 2  | Focused adapter tests         | `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts`                                                      | **PASS** 38 passed / 0 failed                                                                                                                                          |
| 3  | Docs source format            | `deno task --cwd docs/site check:source-format` (headB)                                                                                              | **PASS** `Docs source format: OK`                                                                                                                                      |
| 4  | Docs accuracy                 | `deno task docs:accuracy` (headB)                                                                                                                    | **PASS** 199 published source pages                                                                                                                                    |
| 5a | Scratch generate              | plan schema + `prisma-example-check-deno.json` verbatim; `deno run -A --no-lock npm:prisma@7.8.0 generate --schema .llm/tmp/prisma-example/schema.prisma` | exit 0; `examples/.generated/client.ts` produced                                                                                                                       |
| 5b | Actual example, real client   | `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts --deno-arg --config=.llm/tmp/prisma-example-check-deno.json` | **PASS** 1/0/0, exit 0                                                                                                                                                 |
| 5c | Guarded import-only smoke     | `deno eval --no-lock --config=… 'await import(new URL("./packages/prisma-adapter-mysql/examples/basic-usage.ts", import.meta.url).href); console.log("dynamic-import-smoke:ok")'` | **PASS** exit 0, printed `dynamic-import-smoke:ok`; no query / no MySQL                                                                                 |
| 6  | Package full tests            | `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests`                                                                                | **PASS** 51 passed / 0 failed                                                                                                                                          |
| 7  | Package lint                  | `run-deno-lint.ts --root packages/prisma-adapter-mysql --ext ts,tsx`                                                                                 | **PASS** 12 selected, 0 findings                                                                                                                                       |
| 8  | Package format                | `run-deno-fmt.ts --root packages/prisma-adapter-mysql --ext ts,tsx`                                                                                  | **PASS** 12 selected, 0 findings                                                                                                                                       |
| 9  | Full export-map doc lint      | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty`                                                                                   | **PASS** `./mod.ts` exit 0; `combinedPrivateTypeRef=0`, `combinedMissingJSDoc=0`                                                                                       |
| 10 | Code quality / doctrine       | `deno task quality:gate` (headB, untouched lock)                                                                                                     | **PASS** exit 0; only pre-existing WARN/INFO on other packages (`workers`, etc.); nothing on `prisma-adapter-mysql`                                                     |
| 11 | Publish dry-run               | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run`                                                                                      | **PASS** `Dry run complete`, 8 files (README, deno.json, mod.ts, src/{adapter,conversion,errors,mod,types}.ts); no `examples/`, no test files                          |
| 12 | JSR audit                     | `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text`                                                    | **PASS** exit 0; single `WARN F-JSR-7` is the known banner-count false positive (`dry-run: OK slowTypeWarnings=1` counts the "Checking for slow types" line)            |
| 13 | Driver falsehood census       | `grep -n -i -E "deno_mysql\|deno-native\|deno native\|Deno MySQL\|native MySQL\|native driver\|@prisma/client[\"']\|adapter\.dispose\|connectedAdapter\|DenoMySql\|ExecuteResult\|FieldInfo\|QueryResult\|blocked on #1293\|not supported"` across the seven paths, every hit read | **PASS** — zero prose falsehoods remain. All hits are legitimate identifiers: `PrismaMySqlConnectedAdapter`, internal `Mysql2ExecuteResult`/`QueryResultWithMeta`/`MySqlFieldInfo` (from `conversion.ts`), test `FakeExecuteResult`. Only `adapter.ts:30` `Debug('prisma:driver-adapter:deno-mysql')` remains, as allowlisted |
| 14 | Internal seam boundary        | `deno doc --json packages/prisma-adapter-mysql/mod.ts \| grep -c toMysql2PoolOptions` → `0`; repo grep                                              | **PASS** translator exported from `src/adapter.ts` only; consumed only by `tests/connection_errors_test.ts`; absent from both barrels, `deno doc` root, and publish file list |
| 15 | Git / lock / path truth       | `git diff --name-only base..HEAD`; `git diff --exit-code base..HEAD -- deno.lock`; `sha256sum deno.lock` (head vs base archive)                     | **PASS** exactly the 7 product paths + 6 `.llm/runs/...` artifacts (13 total); `deno.lock` byte-identical to base                                                       |
| —  | Site doctest (out of envelope) | `run-deno-check.ts --root docs/site/reference/prisma-adapter-mysql --ext ts`                                                                        | **PASS** 1/0/0; `examples_test.ts` only constructs the factory and stays consistent with the rewritten page                                                            |

Gate 1 was also observed *during* the generated window for the record: 21 files selected, 1 failed
batch, 50 diagnostics (`TS9010` isolatedDeclarations etc. on generated files). That is the
documented "undefined during the window" behavior, not a defect.

## Is gate 5 load-bearing? — probes (archive only, product restored after each)

| Probe | Mutation (in `headA` only)                                                        | Expected if load-bearing         | Observed                                                                                                                       |
| ----- | --------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P1    | `new PrismaClient({ adapter: await adapter.connect() })`                          | fail                             | `TS2741` "Property 'connect' is missing in type 'PrismaMySqlConnectedAdapter' but required in type 'SqlDriverAdapterFactory'"  |
| P2    | `const probeN: number = PrismaClient;`                                            | fail (proves not `any`)          | `TS2322` "Type 'PrismaClientConstructor' is not assignable to type 'number'"                                                   |
| P3    | `prisma.$queryRawUnsafe(123, …)`                                                  | fail (instance typed)            | `TS2345` "Argument of type 'number' is not assignable to parameter of type 'string'"                                           |
| P4    | revert D17: `columnTypes: number[]` in `src/adapter.ts`                           | fail                             | `TS2322` "Type 'PrismaMySqlAdapterFactory' is not assignable to type 'SqlDriverAdapterFactory'"                                |
| P5    | restore all                                                                       | pass                             | 1/0/0                                                                                                                          |
| P6    | inline union vs real `ColumnTypeEnum` from `@prisma/driver-adapter-utils@7.8.0`   | sets equal                       | both `[0..15, 64..78, 128]` — 32 values, identical                                                                             |
| P7    | `grep -n "main("` in the example                                                  | one call, inside guard           | line 36 definition; line 60 `await main();` inside `if (import.meta.main)` — sole call site                                    |
| P8    | move `await main()` outside the guard, rerun the import smoke                     | smoke fails                      | exit 1 — `main()` ran, Prisma attempted connect and failed (no server). Guard is load-bearing. *See A4: evaluator deviation.*  |
| P9    | root check during generated window                                                | undefined/red                    | 21 selected, 1 failed batch (documented)                                                                                       |
| P10   | delete `.generated`, rerun the smoke                                              | smoke fails                      | exit 1 at `basic-usage.ts:23` (module-not-found on the dynamic import) — the smoke genuinely resolves the generated client     |
| P11b  | static-import wrapper of the example under `--no-prompt --allow-env --allow-net` (the header's documented flags), client present | pass at module init | `static-wrapper-smoke:ok`, exit 0 — no read/sys/ffi permission needed before `connect()`                                       |
| P12b  | same wrapper with no permissions                                                   | fail                             | exit 1 — `@prisma/debug` reads env at import; `--allow-env` is genuinely required, so the header is minimal, not padded        |

Conclusion: gate 5b catches the factory-vs-connected mistake, the D17 regression, and the loss of
generated typing; gate 5c fails when the generated client is absent and when `main()` escapes the
guard. Neither passes while broken.

## Plan-conformance checklist

| Decision | Status | Evidence                                                                                                                                                        |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 mysql2, never Deno-native | met | census gate 13; README/site/mod.ts/adapter.ts/example headers all say "dynamically imported npm `mysql2/promise`"                                          |
| D2 factory passed directly   | met | site, README, mod.ts JSDoc, example all `new PrismaClient({ adapter })` with the factory; P1 proves the alternative is rejected                            |
| D3 literal dynamic import    | met | `examples/basic-usage.ts:23` `const { PrismaClient } = await import('./.generated/client.ts');` at module scope; docs use `schema/.generated/client.server.ts` (matches CLI scaffolder convention in `packages/cli/src/kernel/adapters/database/`) |
| D4 `try/finally $disconnect` | met | all four consumer surfaces; direct-`connect()` ownership documented separately in site + README                                                           |
| D5 structured config only    | met | site "Connection Strings" bullet, README Compatibility                                                                                                     |
| D6 `timeout` → `connectTimeout` only | met | site/README wording; test `structured connection config maps exactly to mysql2 pool options` asserts `connectTimeout: 12_345`                       |
| D7 `poolSize ?? 1`           | met | test `defaults pool size to one`; README states default 1                                                                                                  |
| D8 hook wording from `types.ts` | met | site NOTE text is the `PrismaMySqlOptions.onConnectionError` JSDoc verbatim; matches `errors.ts` (`fatal`, 1040/1203, 1049/1044/1045 cases, code set) |
| D9 delete legacy types       | met | `types.ts` no longer declares `ExecuteResult`/`QueryResult`/`FieldInfo`/`DenoMySqlClient`/`DenoMySqlConnection`; `mod.ts` re-exports only the three live types; site "Driver interfaces" section removed |
| D10 two internal comments    | met | `adapter.ts:173-174` and `:214-216` rewritten                                                                                                              |
| D11 debug namespace kept     | met | `adapter.ts:30` unchanged                                                                                                                                  |
| D12 `@deprecated` + exact legacy behavior, no translator change | met | JSDoc on `tls.mode`; both branches characterized by tests; `toMysql2PoolOptions` body unchanged vs base (diff shows only the `export` + JSDoc) — see A1 |
| D13 translator source-only export | met | gate 14                                                                                                                                             |
| D14 no injection port / barrel export | met | gate 14, publish file list                                                                                                                       |
| D15 extend existing test only | met | gate 15: no new test file                                                                                                                                 |
| D16 one schema-independent query, non-zero exit on failure | met | `$queryRawUnsafe('SELECT 1 + 1 AS result, NOW() AS current_time')`; `Deno.exitCode = 1` in the guard's catch                              |
| D17 narrow `columnTypes`     | met (spelling drifted, recorded) | inline 32-literal union == Prisma 7.8 `ColumnTypeEnum` (P6); `SqlResultSet['columnTypes']` spelling fails `private-type-ref` — drift.md 2026-08-29 |
| Seven-path ceiling           | met | gate 15                                                                                                                                                    |
| Two-slice order              | met | `69f4ab932` (source/test), `30cc8d084` (docs/example), then artifact-only commits `dd91bf1b4`, `cd69eb7cb`                                                 |
| Drift recorded               | met | D17 spelling, slice-1 temporary retention, dropped optional D17 wrapper — all in `drift.md`                                                                |
| Generator ≠ evaluator        | met | this session is neither the author nor either PLAN-EVAL session                                                                                            |

## Findings

No `BLOCKING` findings.

### A1 — ADVISORY — `@deprecated` lands on the whole `tls.mode` property

`src/types.ts:32-37`: the `@deprecated` tag is attached to `mode?: 'disabled' | 'verify_identity'`,
so `deno doc` and editors strike through `mode` itself, including the still-valid `'disabled'`
selection. D12 says "the existing `verify_identity` member", but a union literal cannot carry JSDoc,
so this is the closest expressible form and the tag text does scope the deprecation to
`verify_identity`. Evidence: `deno task doc:lint` exit 0 (accepts it); README/site prose correctly
scopes the deprecation. No action required inside this leaf; a future breaking-change slice that
replaces the mode is the natural place to fix the granularity.

### A2 — ADVISORY — example header under-specifies how `.generated/client.ts` is produced

`examples/basic-usage.ts:9-18` states the prerequisite ("A Prisma client generated to
`examples/.generated/client.ts`") and the run command, but the `prisma generate` line does not say
the schema needs `provider = "prisma-client"`, `runtime = "deno"`, and an `output` pointing at
`examples/.generated`. A reader with a default `prisma-client-js` schema would not get that file.
Evidence: only the plan's scratch schema (with those three settings) produced `client.ts` there
(gate 5a). The claim is true, just incomplete; the README's `schema/.generated/client.server.ts`
form is the NetScript CLI convention (`packages/cli/src/kernel/adapters/database/scaffolder.ts`).
Also minor: the site page imports `../../schema/.generated/client.server.ts` while the README uses
`./schema/...` — both valid at different depths, but the two pages read as inconsistent.

### A3 — ADVISORY — PR label is still `status:plan`

PR #1711 carries `status:plan` although IMPL has landed and this IMPL-EVAL is complete. Per
boundaries I did not touch labels; the topic supervisor should advance the single `status:` label
when acting on this verdict.

### A4 — ADVISORY — evaluator deviation note (not a leaf defect)

Probe P8 deliberately moved `main()` outside the guard to prove the guard is load-bearing. That
caused `main()` to execute once in the archive: Prisma called `connect()` and the attempt to reach
`localhost:3306` failed with no server present, exiting 1. No MySQL, Docker, or Aspire resource
existed or was started; nothing was reachable. Recorded here because the brief named the import-only
smoke as the sole intended execution. The probe result stands (guard is load-bearing); the product
file was restored byte-for-byte and re-verified (P5).

## What the evidence does not cover

- No live MySQL/MariaDB query was executed; the example's runtime path beyond `connect()` (mysql2
  dynamic import, pool open, `$queryRawUnsafe`) is proven only by types (5b) and unit tests (2/6).
- The documented run permissions are verified only up to module initialization (P11b); `connect()`
  may need nothing more than `--allow-net`, but that was not executed.

## Verdict

**`PASS_IMPL`** at `cd69eb7cbb35fffdd16dba3f68dc26311a45699b`. The implementation is honest across
all seven paths, complete against every locked decision (D17 by its recorded inline spelling),
adequately gated, and the specialized gate is demonstrably load-bearing. Residue: none in any
checkout; `deno.lock` untouched.
