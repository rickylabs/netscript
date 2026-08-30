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
| S7 | Prove JSON-preserved rejection values are rejected or collapsed (RED) | real-transport focused test, expected FAIL | round-trip test + run dir |
| S8 | Preserve JSON rejection values through a type-honest `Error.cause` wrapper | focused/scoped/root static gates | `hydration.ts`, round-trip test, run dir |
| S9 | Prove absent mutation/query error keys and hostile coercion remain regressions (RED) | real-transport round-trip suite, expected FAIL | round-trip test + run dir |
| S10 | Replace the open-domain allowlist with a total non-throwing private reviver | focused suites + guard attacks | `hydration.ts`, round-trip test, run dir |
| S11 | Rebase onto the owner-pinned main and seal static/runtime evidence | full cycle-4 gate set + owned cleanup | run dir |

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
| 2026-08-30T08:38:40+02:00 | S5 | implementation | Replaced predicates that claimed wire records were upstream states with private normalizers that construct real `MutationState`/`QueryState` values. JSON-dropped optional data fields become `undefined`; plain error records become `Error` instances with retained string fields. Public types/exports remain untouched. |
| 2026-08-30T08:38:40+02:00 | S5 | focused gate | Required compat, hydration, and transport suites pass 11/11. The committed guard-attack test rejects all eight evaluator categories, additional non-record values in both lists, and non-array top-level lists without partial hydration or input mutation. Focused check/lint/fmt pass over 3 files. |
| 2026-08-30T08:38:40+02:00 | S5 | reconcile | PR #1736 remains draft at `status:impl`; F1 is the only authorized repair. No public-surface stop condition or rescope trigger fired. |
| 2026-08-30T08:52:35+02:00 | S6 | sealing gate | Focused/check/lint/fmt/quality/arch pass at product head `a1dc5fce65058ab47cd49c5af13d91c145f0d1cf`. Root test fired three times and is RED each time on the same two unrelated agentic host tests: 4,251 passed / 2 failed / 19 ignored. The Fresh repair tests remain green. |
| 2026-08-30T14:33:04Z | S7 | cycle-3 RED | At inherited head `eb765629206092f97b3dd8f76a64fa0c3769bcb8`, the real transport suite exited 1 with 6 passed / 5 failed. String, number, boolean, and array cases threw the same indexed hydration `TypeError`; the plain-object case hydrated but failed because the revived `Error.cause` was `undefined`, proving field loss independently. Production source remained untouched. |
| 2026-08-30T14:35:05Z | S8 | implementation | `reviveSerializedError` now accepts the JSON-preserved primitive/array shapes from cycle-2 F1 and wraps them in a real `Error` with the original value in `cause`. Plain records use the same cause preservation while retaining string `message`/`name`/`stack`; non-JSON host shapes remain invalid. No public type, export, or range file changed. |
| 2026-08-30T14:35:05Z | S8 | focused gate | The round-trip suite passes 11/11; the complete compat + hydration attacks + real-transport set passes 16/16. The sibling-query assertions prove supported values no longer reject the whole state, while the `cause` assertions prove primitive, array, and record content is retained. |
| 2026-08-30T14:35:05Z | S8 | reconcile | PR #1736 remains draft at `status:impl`; local, remote, and PR inherited heads matched before S7. Cycle 3 was explicitly owner-authorized after the prior supervisor park comment. No label, issue, milestone, readiness, or evaluator action is required from this lane. |
| 2026-08-30T17:54:35Z | S9 | cycle-4 RED | The structured real-transport round-trip suite exited 1 with 11 passed / 3 failed / 14 total. A bare mutation rejection and the query `error` / `fetchFailureReason` twins were omitted by JSON and rejected with indexed `TypeError`; a hostile array escaped as `Error: hostile Symbol.toPrimitive` through `String(value)`. Production source remained untouched. |
| 2026-08-30T17:54:35Z | S9 | direction check | The new sibling-success assertions cover the over-rejection direction on the real `QueryHydrationScript` wire. The existing evaluator guard-attack table remains the locked under-rejection/no-mutation direction and will be rerun after the total-reviver repair. |
| 2026-08-30T17:54:35Z | S10 | implementation | Removed the open-domain validity branch. The private reviver now returns an `Error` for every input, retains genuine `Error` identity, stores every other original value in `cause`, reads plain-record string fields defensively, and selects primitive/fallback messages without arbitrary object coercion. Call sites alone preserve TanStack's `null` no-error sentinel. |
| 2026-08-30T17:54:35Z | S10 | focused gate | The round-trip suite passes 14/14; compat + eight guard attacks + round-trip pass 19/19. The attack suite still rejects malformed envelopes without mutation or partial hydration. Scoped Fresh check/lint/fmt pass over 200 files, and the repair files contain no forbidden construct. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Retain `^5.101.0` | Both known minors will be explicitly supported. | plan D1; dependency wrapper |
| Preserve public readonly type | Private validation can restore sound assignability. | plan D2/D3; doctrine A1/A2 |
| Revive serialized error records | Upstream requires `Error \| null`; a JSON record cannot honestly satisfy that type without normalization. | FAIL_FIX R2; plan D5 |
| Remove query-state `data` ownership check | Query `data` admits `undefined` and JSON drops it just like mutation `data`; status/counters remain load-bearing. | FAIL_FIX R1; plan D6 |
| Preserve JSON rejection values in `Error.cause` | It keeps TanStack's declared `Error \| null` boundary honest, preserves primitive/array/record values, and avoids prototype-sensitive field copying. | Cycle-2 F1/F2; cycle-3 plan amendment |
| Make `reviveSerializedError` total | Rejection values are an open JavaScript domain; enumerating accepted shapes repeatedly narrowed behavior. The reviver returns `Error` for every non-null state value, uses non-throwing message selection, and keeps the original value in `cause`. | Owner cycle-4 ruling; cycle-3 F1/F2 |

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
| S7 cycle-3 rejection-value RED | `run-deno-test.ts -- --allow-all packages/fresh/tests/query-hydration-roundtrip_test.tsx` | FAIL (expected), exit 1 | 6 passed / 5 failed / 11 total; four indexed `TypeError` failures prove over-rejection, one `Error.cause === undefined` assertion proves plain-record field loss |
| S9 cycle-4 total-reviver RED | `run-deno-test.ts -- --allow-all packages/fresh/tests/query-hydration-roundtrip_test.tsx` | FAIL (expected), exit 1 | 11 passed / 3 failed / 14 total; omitted mutation and query error fields are over-rejected, and hostile coercion throws past the boundary |
| S10 focused Fresh suites | `run-deno-test.ts -- --allow-all` over compat, hydration, round-trip | PASS, exit 0 | 19 passed / 0 failed; supported values hydrate, all eight malformed attack families still reject without mutation or partial hydration |
| S10 scoped check / lint / fmt | structured wrappers with `--root packages/fresh --ext ts,tsx` | PASS, exits 0 / 0 / 0 | 200 files, 0 diagnostics/findings |
| S8 focused Fresh suites | `run-deno-test.ts -- --allow-all` over compat, hydration, round-trip | PASS, exit 0 | 16 passed / 0 failed; includes both exact versions, eight guard attacks, and all five real-transport rejection shapes |
| S5 focused suites | `run-deno-test.ts -- --allow-all ...version-compat... ...query-hydration... ...roundtrip...` | PASS, exit 0 | 11 passed / 0 failed; includes real serializer round trips and the eight guard-attack categories |
| S5 focused check | `run-deno-check.ts --file ...` | PASS, exit 0 | 3 files, 0 diagnostics |
| S5 focused lint | `run-deno-lint.ts --file ...` | PASS, exit 0 | 3 files, 0 findings |
| S5 focused fmt | `run-deno-fmt.ts --file ...` | PASS, exit 0 | 3 files, 0 findings |
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

## FAIL_FIX Repair Handoff

- **Product head:** `a1dc5fce65058ab47cd49c5af13d91c145f0d1cf` (`fix(fresh): normalize serialized hydration state`).
- **Final branch head:** the S6 run-artifact commit containing this handoff; its exact 40-character
  SHA is copied from `git log` into the PR body and `[PHASE: IMPL]` comment after the commit exists.
- **R2 decision:** revive a plain serialized error record into a real `Error`. This satisfies
  TanStack's `Error | null` fields without a cast or dishonest predicate; string `message`, `name`,
  and `stack` survive when present, while `{}` receives `Serialized hydration error`.
- **Supervisor probe:** reproduced. A default-dehydrated mutation paused after one failed attempt
  reached `failureCount === 1`, held the original `Error` in memory, and rendered through
  `QueryHydrationScript` with `failureReason: {}` plus absent `context`/`data`.
- **Public boundary:** `query-types.ts`, `query/mod.ts`, and `packages/fresh/deno.json` have no scope
  diff; the stop condition did not fire.

### FAIL_FIX Gate Table

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| RED transport regression | structured wrapper over `query-hydration-roundtrip_test.tsx` before S5 | EXPECTED FAIL, exit 1 | 1 passed / 4 failed; each paused-mutation case rejected index 0 |
| Focused Fresh suites | `run-deno-test.ts -- --allow-all` over compat, hydration, round-trip | PASS, exit 0 | 11 passed / 0 failed; includes exact 5.101.0 + 5.102.8 |
| Eight guard attacks | committed `query-hydration_test.ts` attack table | PASS, exit 0 | all eight categories reject with indexed `TypeError`; no input mutation or partial hydration |
| Focused check | `run-deno-check.ts --file` over repair source/tests | PASS, exit 0 | 3 files / 0 diagnostics |
| Focused lint | `run-deno-lint.ts --file` over repair source/tests | PASS, exit 0 | 3 files / 0 findings |
| Focused format | `run-deno-fmt.ts --file` over repair source/tests | PASS, exit 0 | 3 files / 0 findings |
| Root check | `deno task check` | PASS, exit 0 | 2,930 files / 25 batches / 0 diagnostics |
| Root test | `deno task test` (three attempts; third with `DENO_JOBS=1`) | **FAIL, exit 1** | 4,251 passed / 2 failed / 19 ignored; `codex-follow_test` hits host `Too many open files`, `hybrid-launcher_test` observes a surviving cancellation child |
| Root lint | `deno task lint` | PASS, exit 0 | 2,046 files / 0 findings |
| Root format | `deno task fmt:check` | PASS, exit 0 | 2,046 files / 0 findings |
| Quality scan | `deno task quality:scan` | PASS, exit 0 | 0 findings; `allowCount: 7` |
| Architecture | `deno task arch:check` | PASS, exit 0 | Fresh `FAIL=0/WARN=3/INFO=1`, unchanged inherited baseline |
| Forbidden constructs | `rg` over hydration repair source/tests | PASS (no match) | no `any`, `as unknown as`, suppression, lint-ignore, or quality allowance |
| Public contract/range | scope diff over `query-types.ts`, `query/mod.ts`, Fresh `deno.json` | PASS (empty) | public readonly state, exports, and `^5.101.0` unchanged |
| Runtime lease gates | Aspire/Docker/browser/`scaffold.runtime`/`e2e:cli` | NOT RUN (owner restriction) | explicitly outside this lane; absence is not a finding |

The root-test command is intentionally recorded as RED, not green. Both failures are outside the
scope diff and reproduce in a focused run of those two `.llm/tools/agentic/**` test modules on this
shared host. No foreign long-lived supervisor process was stopped to manufacture a green result.

## 2026-08-30 — Supervisor Tier-A sealing sign-off at `40ab61a7ef43633bf946af06f7f15c7e1fd567fd`

Recorded by the internals topic orchestrator after the cycle-3 sender was terminated (futex-stall,
no children, no output, 14+ minutes; PID proof taken before termination and before its stale thread
lock was removed). The leaf head was clean at termination, so nothing was lost.

**This entry seals the carrier.** The rows above stating that final sealing and root test were
pending, and the earlier rows recording root test RED on `codex-follow_test` /
`hybrid-launcher_test`, are **superseded** — not deleted, so the earlier decisions stay auditable.
Those failures belonged to the host zombie condition (~7.7k unreapable PID-1 zombies), which is
**retired**: PID 1 is now `tini` with **0 zombies** and `fs.inotify.max_user_instances` is 1024.

### Exact-head sealing set — every gate run by the supervisor in a detached throwaway worktree

| Gate | Command | Raw exit | Result |
| --- | --- | ---: | --- |
| Root test | `.llm/tools/run-deno-test.ts -- --allow-all` | **0** | **4,258 passed · 0 failed · 19 ignored · 4,277 total · 0 unique failures** |
| Scoped check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | **0** | 0 findings |
| Scoped lint | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | **0** | 0 findings |
| Scoped fmt | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | **0** | 0 findings |
| Asset barrel | `deno task check:assets-barrel` | **0** | |
| Quality scan | `deno task quality:scan` | **0** | `ok:true`, `allowCount` at baseline |
| Architecture | `deno task arch:check` | **0** | inherited warnings only |
| Focused repair suites | `query-hydration-roundtrip_test.tsx` / `packages/fresh/tests/` | **0 / 0** | **11 passed · 0 failed** / **19 passed · 0 failed** |

Root test being **green** at this head is the substantive change from every prior cycle in this leaf:
the two failures previously recorded as unavoidable host noise no longer occur, so no result here is
excused by an infrastructure caveat.

### Not run, and why

Aspire, Docker, browser, `e2e:cli`, `scaffold.runtime` — **NOT_RUN**, excluded by the
coordinator-owned serialized expensive-gate lease, which this leaf does not hold. The bare
`scaffold.runtime` rerun is the coordinator's, after this lands and after exact runtime zero.

### State

`local == remote == PR == 40ab61a7ef43633bf946af06f7f15c7e1fd567fd`, worktree clean, PR #1736 draft.
Scope versus the parked head `eb765629206092f97b3dd8f76a64fa0c3769bcb8`, outside run artifacts, is
exactly `packages/fresh/src/application/query/hydration.ts` and
`packages/fresh/tests/query-hydration-roundtrip_test.tsx` — no `query-types.ts`, no `query/mod.ts`,
no dependency-range change, zero forbidden constructs.

Base reference for the record: remote `main` is `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`.
`8b1e42f7` is an **older ancestor** (`fix(cli): fail fast on unresolved background references
(#1728)`), not current main.

**The carrier is sealed. Cycle-3 IMPL-EVAL judges this head.**
