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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Retain `^5.101.0` | Both known minors will be explicitly supported. | plan D1; dependency wrapper |
| Preserve public readonly type | Private validation can restore sound assignability. | plan D2/D3; doctrine A1/A2 |

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
| S2 focused test | `run-deno-test.ts -- --allow-all ...version-compat... ...query-hydration...` | PASS, exit 0 | 4 passed: exact 5.101.0, exact 5.102.8, valid readonly hydration, invalid-entry rejection |
| S2 focused check | `run-deno-check.ts --file ...` | PASS, exit 0 | 3 files, 0 diagnostics |
| S2 focused lint | `run-deno-lint.ts --file ...` | PASS, exit 0 | 3 files, 0 findings |
| S2 focused fmt | `run-deno-fmt.ts --file ...` | PASS, exit 0 | 5 files, 0 findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| JSR surface scan | baseline recorded | `audit-jsr-package.ts --root packages/fresh --text` | 2 inherited warnings |
| Doc lint | baseline recorded | `deno task doc:lint --root packages/fresh --pretty` | 45 inherited diagnostics |
| Quality scan | PASS | `deno task quality:scan` | 0 findings; `allowCount` remains 7 |
| Architecture | PASS | `deno task arch:check` | exit 0; Fresh remains FAIL=0/WARN=3/INFO=1 after test relocation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/browser/E2E | N/A | owner restriction | No runtime lease; remain empty. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 5.101.x | PASS | exact 5.101.0 version fixture | corrected by S2; independently configured no-lock child check |
| 5.102.8 | FAIL (baseline) | exact reproduction | corrected by S2; see focused test |
| Exact 5.101.0 | PASS | version compatibility test | independently configured `--no-lock` child check |
| Exact 5.102.8 | PASS | version compatibility test | independently configured `--no-lock` child check |

## Handoff Notes

- Tier-A and IMPL-EVAL must inspect exact-head dual-version evidence and confirm no public type/export drift.
