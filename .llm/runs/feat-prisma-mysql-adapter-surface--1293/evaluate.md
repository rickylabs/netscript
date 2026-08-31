# Evaluation: prisma-mysql-adapter-surface (#1293 / PR #1662) — IMPL-EVAL

## Verdict

`PASS`

## Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `feat-prisma-mysql-adapter-surface--1293`                             |
| Target         | `packages/prisma-adapter-mysql`                                       |
| Archetype      | 2 — integration                                                       |
| Scope overlays | none                                                                  |
| Evaluator      | native Claude Fable 5, fresh bg session, 2026-08-15                   |

## Evaluator identity and lease (recorded before any mutation)

| Field                     | Value                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Session ID                | `e64f33f0-c88e-4fc7-9e79-63c01fed94db`                                                       |
| Bridge session ID         | `cse_01XrFMbPHpry6tL3v9ZmRsLK` (non-empty; `bridgeOutboundOnly: false`)                      |
| Remote Control URL        | `https://claude.ai/code/session_01XrFMbPHpry6tL3v9ZmRsLK`                                    |
| PID                       | 636730 (`claude bg-spare` process; job daemon `e64f33f0`)                                    |
| cwd                       | `/home/codex/repos/netscript-007-features-1293`                                              |
| Requested route           | native Claude Fable 5 · medium · Remote Control (`lane-policy.md:46`)                        |
| Observed route            | `respawnFlags`: `--model claude-fable-5 --effort medium --remote-control` (job `state.json`) |
| Route match               | **match** (read from `/home/codex/.claude/jobs/e64f33f0/state.json`, not argv)               |
| Lease                     | coordinator `codex-root-0.0.7`; one evaluator; PR #1662 / #1293; immutable head `d8d255bdc`  |
| Author thread (not mine)  | Codex `01a0048f-8d95-7682-a3ce-1c1926aba75c` — not resumed, not steered                      |

## Immutable identity check

| Check                                       | Observed                                                                 | Result |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| local `HEAD`                                | `d8d255bdc103eb120cc7b8835dfe3ce870017c32`                               | PASS   |
| `git ls-remote origin refs/heads/feat/prisma-mysql-adapter-surface` | `d8d255bdc103eb120cc7b8835dfe3ce870017c32`       | PASS   |
| PR #1662 `headRefOid`                       | `d8d255bdc103eb120cc7b8835dfe3ce870017c32`, `isDraft: true`, `OPEN`, milestone `0.0.7`, labels `status:impl` (single `status:`), `wave:v1 type:feat gate:jsr priority:p2 area:database area:packages` | PASS |
| clean tree                                  | `git status --porcelain` → 0 lines                                       | PASS   |
| content head ancestor of evidence head      | `git merge-base --is-ancestor 3dee41263 d8d255bdc` → true                | PASS   |
| delta `3dee41263..d8d255bdc`               | 7 files, all under `.llm/runs/feat-prisma-mysql-adapter-surface--1293/` (4 receipts, `acceptance-evidence.md`, `context-pack.md`, `worklog.md`) — no source | PASS |
| base                                        | `284dda90a` is the leaf base; note live `origin/main` has since moved to `729386c56` (informational, not a mismatch) | — |

## Process Verification

| Check                                  | Result | Evidence                                                                                          |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` § Verdict = `PASS` at `7780ba49e`, before first source commit `ecb98cc88`          |
| Design section exists                  | PASS (note) | Locked decisions D1–D11 in `plan.md` + PLAN-EVAL rulings; `worklog.md` has no literal `## Design` heading (editorial note E3) |
| Commit slices match design plan        | PASS   | S1 `ecb98cc88`, S1 fix-up `49fda0b77`, S2 `47ad48c9d`, S3 `3dee41263`, evidence `d8d255bdc`     |
| Each slice has a passing gate          | PASS   | worklog raw doc-lint / dry-run per slice; final four receipts at `3dee41263`                       |
| No speculative seams                   | PASS   | new exports (`isConnectionError`, `MYSQL_CONNECTION_ERROR_CODES`, `getCapabilities`, `PrismaMySqlAdapter`) are all consumed by tests or the factory |
| Constants for finite vocabularies      | PASS   | `MYSQL_CONNECTION_ERROR_CODES` `ReadonlySet` (`src/errors.ts:22-40`)                             |

## 1. R1–R3 compliance (read `src/adapter.ts`, `src/errors.ts`, `src/mod.ts`, `src/types.ts` at head)

| Ruling | Result | Evidence |
| ------ | ------ | -------- |
| R1.1 classifier | PASS | `src/errors.ts:46-56`: gated by `isDriverError`; true iff `fatal === true` ∨ `errno ∈ {1040,1203}` ∨ `code ∈ MYSQL_CONNECTION_ERROR_CODES`. `MySqlError.fatal?: boolean` at `errors.ts:17`. Not exported from `src/mod.ts`; `tests/surface_test.ts:18-19` asserts absence from root; my `deno doc --json` of `mod.ts` confirms only the listed symbols. |
| R1.2 | PASS | 1045/1044/1049 not in the errno set → fire only via `fatal === true`; `mapDriverError` cases 1044/1045/1049/1040/1203 unchanged vs base (diff `284dda90a..HEAD -- src/errors.ts` adds only `fatal`, the code set, and `isConnectionError`). Tests `connection_errors_test.ts:237-257` cover both fatal states per errno. |
| R1.6 single choke point | PASS | Only `notifyConnectionError` (`adapter.ts:34-47`) invokes `options.onConnectionError`; every boundary routes through the bound notifier. `startTransaction`: inner catch `adapter.ts:422-425` rejects + rethrows without notify; outer `.catch` `adapter.ts:429-434` is the sole notify. Duplicate property tested at `connection_errors_test.ts:259-288` (`assertSingleCall`) — I ran it: 46/46 pass. |
| R1.5 containment | PASS | try/catch around callback, failure to `debug` (`adapter.ts:42-46`), never rethrown/aggregated. Identity (`assertStrictEquals`) with a **throwing** callback asserted for `executeScript` (`:207-221`), commit/rollback (`:323-345`), dispose (`:369-385`); tx acquisition/isolation/BEGIN identity at `:280`. |
| R1.4 / R3 probe | PASS | `getCapabilities` `adapter.ts:764-785` returns `{ supportsRelationJoins: false }` on any failure and notifies inside the catch; awaited at `:655` before `connect()` returns. Test `:137-149` (fatal 1045, throwing callback, exactly one call) and `:151-161` (1146 → 0 calls). |
| R1.7 | PASS | `executeScript` `adapter.ts:364-371` notifies then rethrows raw (no `convertDriverError`); test `:207-235` asserts `rejection === error`. |
| R2.1 / R2.3 / R2.4 | PASS | `PrismaMySqlAdapter` is `export class` in `src/adapter.ts:351` but absent from `src/mod.ts`; `surface_test.ts:17` asserts `'PrismaMySqlAdapter' in publicApi === false`; tests construct it with `FakePoolClient` (`connection_errors_test.ts:111-116`). Publish dry-run surface: 8 files, no `tests/**`/`examples/**`. |

## 2. S1 query-contract compatibility

- `as SqlQuery` cast: gone from `src/` (`grep "as SqlQuery" src/ tests/` → only the intentional guard at `tests/surface_test.ts:9`). No `as unknown as`, no `deno-lint-ignore` in the package.
- `PrismaMySqlQuery` (`adapter.ts:487-513`): `scalarType` is the 12-member literal union, `arity: 'scalar' | 'list'` required, `dbType?: string`.
- Guards `_toUpstream`/`_fromUpstream` compile: `deno check --unstable-kv mod.ts tests/*.ts` → exit 0.
- **Guard falsifiability (ran myself)**: scratch file with `type Eq<A,B>` and a widened `argTypes: {scalarType: string; arity?: …}` control → `TS2322 Type 'Wide' is not assignable to type 'SqlQuery'`, and `Eq<PrismaMySqlQuery, SqlQuery>` = `true` type-checks. So the bidirectional guard would fail on the original defect. Also `Eq<PrismaMySqlTransactionOptions, TransactionOptions>`, `Eq<PrismaMySqlConnectionInfo, ConnectionInfo>`, `Eq<PrismaMySqlIsolationLevel, IsolationLevel>` all `true`.
- Same-class sweep result: `PrismaMySqlResultSet.columnTypes: number[]` is **wider than upstream** `ColumnType[]` (`Eq<PrismaMySqlResultSet, SqlResultSet>` = false; `PrismaMySqlTransactionAdapter` not assignable to `Transaction` for that reason). This is **pre-existing at base `284dda90a`** (`git show 284dda90a:…/adapter.ts` line 466), on the **output** side (no runtime conversion is skipped — the class still returns `mapColumnType` results), and not something the leaf added or PLAN-EVAL ruled on. Recorded as editorial note E1, not a finding against this leaf.

## 3. S2 notifier and classifier behaviour (`tests/connection_errors_test.ts`, 46 tests)

Capable of failing against a blanket `onError()` override: yes — `executeScript` (`:207`), tx acquisition (`:259`, `useConnection` rejects before `fn`), commit/rollback (`:323`), dispose (`:369`), post-ready lifecycle (`:347`) never pass through `onError`, and each asserts exactly one call with `assertStrictEquals(calls[0], error)`. Classifier-false negatives (errno 1146) asserted at every fired boundary. R1.8 table coverage: probe ✓, pooled query/execute ✓, `executeScript` ✓, acquisition/isolation/BEGIN ✓, tx query/execute ✓, COMMIT/ROLLBACK ✓, disposal ✓, successful disposal ✓. I found no boundary that fires twice or not at all; isolation/BEGIN failures pass both inner and outer catch and still count 1 (`:281-283`).

## 4. S3 example and split-close

- `examples/basic-usage.ts:21` imports `'../mod.ts'`; uses only `PrismaMySql`, `onConnectionError`, `connect()`, `getConnectionInfo()`, `queryRaw`, `dispose()` — all shipped. Excluded from publish (`deno.json` `publish.exclude: examples/**`; dry-run list has no examples file). Type-checked under the root `check` receipt.
- PR #1662 body: `Part of #1293.` — no `Closes/Fixes/Resolves` anywhere; #1112 referenced without keyword; "Remaining cross-lane scope" section present; `acceptance-evidence` block: box 1 "Not discharged as worded", box 4 "Blocked on #1112", boxes 2/3 with pointers to the test file and raw D7 evidence. No box is ticked without evidence. The box-1 framing is accurate under R2.1/R2.2 (owner-only wording, per brief — not treated as a defect). #1293 is `OPEN`, milestone `0.0.7`.
- `docs/site/reference/prisma-adapter-mysql/index.md:23` still reads "not supported … blocked on #1293"; last touched by `6c3b534fc` (pre-branch); named in PR body ("Remaining cross-lane scope") and `drift.md` § S3.

## 5. Four exact-head receipts (recomputed myself)

| Receipt file | `gateId` | `outcome` | `exitCode` | `gitHead` = `actualGitHead` | `allowGitHeadMismatch` |
| --- | --- | --- | --- | --- | --- |
| `receipts/prisma-mysql-1293-check.json` | `check` | PASS | 0 | `3dee41263…` = `3dee41263…` | null |
| `receipts/prisma-mysql-1293-test.json` | `test` | PASS | 0 | same | null |
| `receipts/prisma-mysql-1293-publish-dry-run.json` | `publish-dry-run` | PASS | 0 | same | null |
| `receipts/prisma-mysql-1293-arch-check.json` | `arch-check` | PASS | 0 | same | null |

Four distinct `gateId`s → no duplicate rule fires. `test` receipt tail: 4181 passed / 0 failed / 19 ignored (root-wide). Scoping judgment: `check`, `test`, `publish-dry-run`, `arch-check` cover the Archetype-2 static/fitness/publish bar for a package-only change; doc-lint and quality-scan are not receipted but are (a) recorded raw (D7) and (b) re-run by me below with exit 0. Honest scoping — no required gate left unproven.

## 6. Raw D7 evidence — re-run at head `d8d255bdc` (source identical to `3dee41263`)

- `deno doc --lint packages/prisma-adapter-mysql/mod.ts` → `Checked 1 file`, exit 0 — identical to `acceptance-evidence.md`.
- `deno publish --dry-run --allow-dirty` (cwd package) → same eight-file list (README.md, deno.json, mod.ts, src/adapter.ts, src/conversion.ts, src/errors.ts, src/mod.ts, src/types.ts), `Success Dry run complete`, exit 0 — identical to recorded.
- Recorded output is raw command output (file list + status lines + exit code), not a summary.

## Static / Fitness gates run by this evaluator (all at `d8d255bdc`)

| Gate | Command | Result |
| --- | --- | --- |
| Narrow typecheck | `deno check --unstable-kv packages/prisma-adapter-mysql/mod.ts packages/prisma-adapter-mysql/tests/*.ts` | exit 0 |
| Package tests | `deno test --allow-net --allow-env packages/prisma-adapter-mysql/tests/` | 46 passed, 0 failed |
| Doc lint | `deno doc --lint packages/prisma-adapter-mysql/mod.ts` | exit 0 |
| Publish dry-run | `deno publish --dry-run --allow-dirty` | exit 0, 8 files |
| Doctrine fitness | `deno task arch:check` | exit 0 (pre-existing WARN/INFO only, none in this package's diff) |
| Quality scan | `deno task quality:scan` | exit 0, `findings: []`, 7 pre-existing allowances (none in this package) |

## 7. Scope and lock hygiene (`git diff --name-only 284dda90a..d8d255bdc`)

19 files: 8 under `packages/prisma-adapter-mysql/` (src ×4, tests ×3, examples ×1), 11 under the leaf run dir. No `docs/**`, no `deno.lock`, no other package/plugin, no cluster-state file. PR timeline: never `ready_for_review`; issue #1293 open; no new issue in the diff or PR body. No expensive gate run (no `scaffold.runtime` receipt or worklog entry).

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-3/AP-4 private-type leakage into surface | CLEAR | concrete class + `MysqlPoolClient` kept out of root; `deno doc --lint` clean |
| `any` / `as unknown as` / new lint-ignore | CLEAR | grep on `src/`, `tests/` → none; quality:scan `findings: []` |
| Re-export of upstream (F-15) | CLEAR | package-owned types, structurally equal to upstream, no re-export |

## Arch-Debt Delta

None required. No doctrine violation introduced; E1 below is pre-existing and outside this leaf's plan.

## Findings

**Substantive (blocking): none.**

**Editorial notes (non-blocking):**

- **E1** — `PrismaMySqlResultSet.columnTypes: number[]` (`src/adapter.ts:522`) is wider than upstream `SqlResultSet.columnTypes: ColumnType[]`, so `PrismaMySqlConnectedAdapter`/`PrismaMySqlTransactionAdapter` are not assignable to `SqlDriverAdapter`/`Transaction`. Pre-existing at base, output-side, no runtime effect; candidate for a follow-up surface tightening (with a `_toUpstream` guard like the query one). Not ruled by PLAN-EVAL, so not a finding against R1–R3.
- **E2** — PR #1662 has zero per-slice comments (`gh api …/issues/1662/comments` → 0). The commit trail is carried by the PR body slice list + in-repo `worklog.md`; the harness commit-trail rule (`run-loop.md:117`) expects per-slice PR comments. Process deviation, evidence still complete.
- **E3** — `worklog.md` has no literal `## Design` checkpoint heading; the design lives in `plan.md` D1–D11 plus the PLAN-EVAL rulings.
- **E4** — `startTransaction` boundaries are tested only with a non-throwing callback; containment there is covered transitively by the single shared `notifyConnectionError` implementation.
