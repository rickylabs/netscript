# Worklog: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Design

### Public Surface

- `DehydratedState`, `dehydrateQueryClient`, and `hydrateFromDehydrated` remain unchanged.
- `@netscript/fresh/query` exports remain unchanged.

### Domain Vocabulary

- TanStack dehydrated mutation/query records — private validated values accepted by upstream hydrate.
- Package `DehydratedState` — unchanged readonly transport envelope.

### Ports

- TanStack `hydrate` is the existing external boundary; no new port is introduced for one call site.

### Constants

- Mutation/query/fetch status finite sets remain private guard constants if needed.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S0 | Activate harness and lock the unchanged public contract/range decision | artifact review | run dir |
| S1 | Prove 5.102.8 compile regression (RED) | focused structured check/test, expected FAIL | Fresh type fixture/config + run dir |
| S2 | Validate and copy readonly hydration state into TanStack's mutable input | focused wrappers + exact 5.101/5.102 checks | `hydration.ts`, focused tests, run dir |
| S3 | Record final static receipts and evaluator handoff | full requested static suite | run dir |
| S4 | Pin the shipped JSON hydration regression at the evaluator-artifact head (RED) | focused structured round-trip test, expected FAIL | new Fresh round-trip test + run plan/worklog |
| S5 | Normalize JSON-compatible hydration state and revive serialized errors | focused suites + eight guard attacks | `hydration.ts`, focused tests, run dir |
| S6 | Record and publish exact-final-head static evidence | complete owner-required static suite | run dir |

### Deferred Scope

- Runtime/scaffold validation — no lease; CI owns `scaffold.runtime` restoration evidence.
- Existing Fresh doc-lint and JSR residue — unrelated baseline debt.

### Contributor Path

Future TanStack hydration signature changes are exercised by the exact-version fixture; boundary
shape changes belong beside `hydrateFromDehydrated` and must preserve the package-owned public type.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30T00:34:50+02:00 | S0 | research | Exact 5.102.8 reproduction failed with TS2345; range restored cleanly. |
| 2026-08-30T00:34:50+02:00 | S0 | plan gate | `PLAN-EVAL: N/A` — small mechanical issue with fixed contract, explicit acceptance, exact reproduction, locked two-version gate, and no public-surface decision remaining. |
| 2026-08-30T00:41:00+02:00 | S1 | RED | Structured focused test exited 1 with the single expected TS2345 readonly/mutable incompatibility under exact query-core 5.102.8. Production source was still untouched. |
| 2026-08-30T00:49:00+02:00 | S2 | implementation | Private guards validate upstream mutation/query records and copy them into fresh mutable arrays; public types, exports, and the dependency range are unchanged. |
| 2026-08-30T00:52:00+02:00 | S2 | gate | Focused test 4/4, check, lint, fmt, quality scan, and arch check pass. Initial colocated test placement raised Fresh F-16 from 3 to 4 warnings; moving it to `tests/` restored the 3-warning baseline before commit. |
| 2026-08-30T00:52:00+02:00 | S2 | reconcile | Issue #1734 and draft PR #1736 remain open at `status:impl`, required labels/milestone are present, and no evaluator/reviewer comments have arrived. No plan readjustment is required. |
| 2026-08-30T01:10:00+02:00 | S3 | preliminary full gate | All owner-required static gates pass; Fresh doc-lint/JSR findings match the inherited baseline, publish dry-run succeeds, and validation leaves the worktree clean. |
| 2026-08-30T08:34:23+02:00 | S4 | FAIL_FIX reproduction | The real `QueryHydrationScript` serializer produced default-dehydrated paused mutation wire records with absent `context`/`data` (and absent `variables` for the void case). A paused retry after one failure reproduced `failureReason: {}` through the package API. |
| 2026-08-30T08:34:23+02:00 | S4 | RED | Structured round-trip suite exited 1: success query passed; all four mutation cases failed with `TypeError: Invalid dehydrated mutation at index 0` from `hydration.ts`. Result: 1 passed / 4 failed / 5 total. Production source remained untouched. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Retain `^5.101.0` | Both known minors will be explicitly supported. | plan D1; dependency wrapper |
| Preserve public readonly type | Private validation can restore sound assignability. | plan D2/D3; doctrine A1/A2 |
| Revive serialized error records | Upstream requires `Error \| null`; a JSON record cannot honestly satisfy that type without normalization. | FAIL_FIX R2; plan D5 |
| Remove query-state `data` ownership check | Query `data` admits `undefined` and JSON drops it just like mutation `data`; status/counters remain load-bearing. | FAIL_FIX R1; plan D6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline Fresh doc-lint is 45, despite a historical resolved debt note saying zero | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline reproduction | exact no-lock check with temporary 5.102.8 pin | FAIL (expected) | TS2345 at `hydration.ts:43`; package range restored |
| S1 RED regression | `run-deno-test.ts -- --allow-all packages/fresh/tests/query-hydration-version-compat_test.ts` | FAIL (expected), exit 1 | 0 passed / 1 failed; child check reports only TS2345 at `hydration.ts:43` |
| S4 JSON-transport RED | `run-deno-test.ts -- --allow-all packages/fresh/tests/query-hydration-roundtrip_test.tsx` | FAIL (expected), exit 1 | 1 passed / 4 failed / 5 total; four paused-mutation paths reject index 0; default prior-failure wire value independently asserted equal to `{}` before hydration |
| S2 focused test | `run-deno-test.ts -- --allow-all ...version-compat... ...query-hydration...` | PASS, exit 0 | 4 passed: exact 5.101.0, exact 5.102.8, valid readonly hydration, invalid-entry rejection |
| S2 focused check | `run-deno-check.ts --file ...` | PASS, exit 0 | 3 files, 0 diagnostics |
| S2 focused lint | `run-deno-lint.ts --file ...` | PASS, exit 0 | 3 files, 0 findings |
| S2 focused fmt | `run-deno-fmt.ts --file ...` | PASS, exit 0 | 5 files, 0 findings |
| Root check | `deno task check` | PASS, exit 0 | structured wrapper; cached confirmation after successful 37-member run |
| Root test | `deno task test` | PASS, exit 0 | 4,246 passed / 0 failed / 19 ignored / 4,265 total |
| Root lint | `deno task lint` | PASS, exit 0 | 2,045 files, 0 findings |
| Root fmt | `deno task fmt:check` | PASS, exit 0 | 2,045 files, 0 findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| JSR surface scan | baseline recorded | `audit-jsr-package.ts --root packages/fresh --text` | 2 inherited warnings |
| Doc lint | baseline recorded | `deno task doc:lint --root packages/fresh --pretty` | 45 inherited diagnostics |
| Quality scan | PASS | `deno task quality:scan` | 0 findings; `allowCount` remains 7 |
| Architecture | PASS | `deno task arch:check` | exit 0; Fresh remains FAIL=0/WARN=3/INFO=1 after test relocation |
| Fresh publish dry-run | PASS | `deno task --cwd packages/fresh publish:dry-run` | `Success Dry run complete` |
| Fresh JSR audit | baseline unchanged | `audit-jsr-package.ts --root packages/fresh --text` | 2 inherited warnings; no new surface finding |
| Fresh doc lint | baseline unchanged | `deno task doc:lint --root packages/fresh --pretty` | exit 1 with the same 45 inherited diagnostics |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/browser/E2E | N/A | owner restriction | No runtime lease; remain empty. |
| Generated assets barrel | N/A | clean status after gates | No generated asset moved. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 5.101.x | PASS | exact 5.101.0 version fixture | corrected by S2; independently configured no-lock child check |
| 5.102.8 | FAIL (baseline) | exact reproduction | corrected by S2; see focused test |
| Exact 5.101.0 | PASS | version compatibility test | independently configured `--no-lock` child check |
| Exact 5.102.8 | PASS | version compatibility test | independently configured `--no-lock` child check |

## Handoff Notes

- Tier-A and IMPL-EVAL must inspect exact-head dual-version evidence and confirm no public type/export drift.
- `scaffold.runtime` restoration is CI-owned; it was not run locally without a lease.
- S3 results above are the pre-receipt pass. After the S3 artifact commit is pushed, the complete
  owner-required receipt set is rerun without further file changes and posted to PR #1736 at the
  exact final 40-character head.
