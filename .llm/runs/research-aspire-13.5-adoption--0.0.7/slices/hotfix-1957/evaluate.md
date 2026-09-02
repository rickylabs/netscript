# Evaluation: IMPL-EVAL — PR #1957 release hotfix (typed-db Phase-B departure observation)

Scope judged: exactly the seven changed paths between `308d99c78` and head `e23dc30c2`
(`git diff --stat 308d99c78..HEAD` — 6 TS files + one `aspire-surface-manifest.tsv` row; no other
file changed). Read-only evaluation; no tracked file modified (worktree clean after validation).

## Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7/hotfix-1957`         |
| Target         | PR #1957 hotfix at `e23dc30c2cd50807d8304e975f464306087a24c1` |
| Archetype      | N/A (e2e test-observer hotfix only)                        |
| Scope overlays | none (test-observer)                                       |
| Evaluator      | separate-session IMPL-EVAL, OpenRouter z-ai/glm-5.3-flash xhigh, 2026-09-03 |

## Process Verification

| Check                                  | Result | Evidence                                                                              |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | N/A    | Coordinator-specified design supplied in the eval brief; hosted evidence already obtained |
| Design section exists in worklog       | N/A    | Design ruling recorded in the brief (coordinator), not re-derived here                 |
| Commit slices match design plan        | PASS   | Single hotfix head `e23dc30c2`; diff stat matches the mandated 7-file scope exactly     |
| Each slice has a passing gate          | PASS   | `e2e-cli` run 33686579366 at this exact head (pre-existing, not rerun): scaffold-runtime + scaffold-runtime-sqlite SUCCESS |
| No speculative seams (unused files)    | PASS   | `controlled-follower.ts` is imported by both `resource-state-stream_test.ts` and `listener-unreachable-fixture_test.ts`; `observeInducedListenerDeparture` consumed by phase-B and the new tests |
| Constants used for finite vocabularies | PASS   | `EXPECTED_FAILURE_CODES` (`listener-unreachable-fixture.ts:271`); `DatabaseEngine` axis replaces the free-text `database: string` param (`verify-typed-db-phase-b.ts:30`) |

## Static Gates

| Gate             | Command or check                        | Result | Evidence                                | Notes |
| ---------------- | --------------------------------------- | ------ | --------------------------------------- | ----- |
| Narrow typecheck | covered by hosted `check-test` at head  | PASS   | run 33686579366 (`check-test` SUCCESS) — not rerun per brief |       |
| Slice typecheck  | covered by hosted `check-test` at head  | PASS   | run 33686579366                         |       |
| Format           | `deno fmt --check` (6 TS files)          | PASS   | `Checked 6 files` / FMT_OK              |       |
| Lint             | `deno lint` (6 TS files)                 | PASS   | `Checked 6 files` / LINT_OK             |       |
| Doc lint         | N/A                                     | N/A    | no Markdown/doc surface touched         |       |
| Publish dry-run  | N/A                                     | N/A    | e2e harness package, not a publish target |     |
| Link/path check  | N/A                                     | N/A    | no doc links touched                    |       |

## Fitness Gates

| Gate | Function                        | Result | Evidence                                                                                   | Violations |
| ---- | ------------------------------- | ------ | ------------------------------------------------------------------------------------------ | ---------- |
| F-1  | File-size lint                  | PASS   | `deno lint` clean; largest touched file 575 lines (pre-existing fixture)                     |            |
| F-2  | Helper-reinvention scan         | PASS   | duplicate in-file `createControlledFollower` deleted and shared via `controlled-follower.ts` |            |
| F-3  | Layering check                  | PASS   | phase-B (gate) consumes the fixture (shared fixture layer); no upward import                |            |
| F-4  | Inheritance audit               | PASS   | no classes introduced                                                                       |            |
| F-5  | Public surface audit            | PASS   | new exports are e2e-fixture-internal (`RESOURCE_TRANSITION_FAILURE_CEILING_MS`, evidence types, observer fn) |  |
| F-6  | JSR publishability gate         | N/A    | no publishable package touched                                                              |            |
| F-7  | Doc-score gate                  | N/A    | no docs touched                                                                             |            |
| F-8  | Workspace `lib` override check  | N/A    | no workspace config touched                                                                 |            |
| F-9  | Permission declaration check    | PASS   | tests run under `--allow-all` per suite convention; no new spawn surface beyond existing `aspire`/`deno` |   |
| F-10 | Test-shape audit                | PASS   | 208 passed / 0 failed in the scoped run; new cases are deterministic, in-memory, no Docker/Aspire |      |
| F-11 | Forbidden-folder lint           | PASS   | no `packages/*/src` product code in the diff (only `packages/cli/e2e/**`)                   |            |
| F-12 | Naming-convention lint          | PASS   | `deno lint` clean                                                                           |            |
| F-13 | Saga and runtime invariants     | N/A    | no saga/runtime code touched                                                                |            |
| F-14 | Console-log lint                | PASS   | `console.info` only in receipt paths (pre-existing pattern)                                 |            |
| F-15 | Re-export-of-upstream lint      | PASS   | no re-exports added                                                                         |            |
| F-16 | Folder-cardinality lint         | PASS   | one new file in an existing test folder                                                     |            |
| F-17 | Abstract-derived co-location    | N/A    | no abstract classes                                                                         |            |
| F-18 | Sub-barrel lint                 | N/A    | no barrels touched                                                                          |            |
| F-19 | Scoped source gate runners      | PASS   | validation run through the exact scoped command mandated by the brief                        |            |

## Runtime Gates

| Gate                     | Validation                                                                                   | Result | Evidence |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------ | -------- |
| Scoped gates unit suite  | `deno test --allow-all packages/cli/e2e/tests/application/gates/ packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | PASS | `ok | 208 passed (10 steps) | 0 failed (2s)` |
| Hosted exact-head E2E    | `scaffold-runtime (aspire+docker+postgres)` and `scaffold-runtime-sqlite (aspire+sqlite+garnet)` at `e23dc30c2` | PASS (pre-existing, not rerun) | `e2e-cli` run 33686579366, plus `quality`/`check-test`/`code-quality`/`scaffold-static` SUCCESS |

## Consumer Gates

Not in scope: this hotfix changes no consumer-facing surface.

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1 (helper duplication) | CLEAR | private `createControlledFollower` deleted from `resource-state-stream_test.ts:155-196` (old), shared in `controlled-follower.ts:10` | |
| AP-2 (duplicated budget/deadline) | CLEAR | `REPORT_DEADLINE_MS`/`REPORT_POLL_MS`/`UNHEALTHY_DESCRIPTION` removed from `verify-typed-db-phase-b.ts`; source-shape test forbids their return (`runtime-gates_test.ts:150-152`) | |
| AP-3 (poll-then-assert) | CLEAR | single scoped `describeResource` snapshot after the stream event (`listener-unreachable-fixture.ts:391-436`); no poll loop in phase-B | |
| AP-4..AP-25 | N/A | patterns outside this hotfix's scope | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | no debt recorded by this hotfix |
| Resolved entries      | 0     | |
| Deepened violations   | 0     | |
| Unrecorded violations | 0     | |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | The scaled delayed-transition case exercises the `options.ceilingMs` test seam (120 ms), not the production default ceiling; the 120 s production default is pinned only by composition (constant-value test + the Phase-B call passing no options object). | `listener-unreachable-fixture_test.ts:214-221` (`scaledCeilingMs = RESOURCE_TRANSITION_FAILURE_CEILING_MS / DELAY_SCALE`, passed via `{ ceilingMs: scaledCeilingMs }`); production call `verify-typed-db-phase-b.ts:111-117` passes no options; `listener-unreachable-fixture_test.ts:193-196` pins `120_000 > 30_000`. The scaled model is honest and clearly labelled (`Scaled 1:1000 so the case stays deterministic`, `DELAY_SCALE` documented as "one unit stands for one second of the shared ceiling"), and the mechanism claim (wait returns on the event, no internal boundary) is exactly what the scaled case can prove. | none — informational; the seam is documented as test-only in `InducedDepartureOptions` (`listener-unreachable-fixture.ts:189`) |
| low | The source-shape assertion pins the Phase-B call prefix but not the absence of a fourth `options` argument, so a future options object would not be caught by that string assertion. | `runtime-gates_test.ts:149` asserts `observeInducedListenerDeparture(appHost, expectation, async () =>` — a substring that would still match with a trailing options arg; today no options arg is passed (`verify-typed-db-phase-b.ts:111-117`), so the 120 s default is in force. | none — informational; constant-value test keeps the default ceiling correct regardless |

No high or medium findings. Checks 1, 2, 3, 4, 5 all verified as detailed below.

## Check-by-check evidence

**Check 1 — `verify-typed-db-phase-b.ts`:** PASS. Subscription-before-close via
`observeInducedListenerDeparture(appHost, expectation, async () => { await
commandListenerFaultController(projectRoot, { postgresOpen: false, garnetOpen: true }); ... })`
(`verify-typed-db-phase-b.ts:111-117`); the observer establishes `watchResourceUpdates` before
running `induce` (`listener-unreachable-fixture.ts:212-218`). No `REPORT_DEADLINE_MS`,
`REPORT_POLL_MS`, `UNHEALTHY_DESCRIPTION`, or `'describe',` remains in the file (full read; the
only `aspire` subcommands used are `resource`, `ps`). `WAIT_TIMEOUT_SECONDS = 10`
(`verify-typed-db-phase-b.ts:15`) and the `db init` bounded block (`:121-149`, env
`ASPIRE_CLI_START_TIMEOUT`, duration bound, `requireText([database, String(WAIT_TIMEOUT_SECONDS)])`)
are byte-identical to `308d99c78` (absent from the diff). Receipt records
`failureCode` (from `departure.testOnly.data`), `realBacking` key+status, `transitionEvidence`
source, `departureCeilingMs`, plus `healthCheckKey` (`:180-190`). Database parsed via
`parseListenerFaultDatabase` at the `import.meta.main` boundary (`:307`) and the parameter is now
the closed `DatabaseEngine` type (`:30`).

**Check 2 — `listener-unreachable-fixture.ts`:** PASS. `RESOURCE_TRANSITION_FAILURE_CEILING_MS =
120_000` exported (`:43`); `observeInducedListenerDeparture` subscribes before `induce()`
(`:212-218`), waits with `resourceHealthIs(update, 'Unhealthy')` (`:219-221`), attributes through
`reportsAfterTransition` (`:223`), closes the subscription in `finally` (`:225-227`).
`reportsAfterTransition` asserts the structured code via `assertExpectedListenerFailure` for the
Unhealthy case (`:419`) and requires the real backing report Healthy (`:426-431`).
`verifyListenerFailureRecovery`'s D-101 flow is otherwise unchanged (diff touches only the import
block, the ceiling comment/export, and the appended observer section).

**Check 3 — tests:** PASS. Shared `controlled-follower.ts` (new, 43 lines) imported by both
`resource-state-stream_test.ts:5` and `listener-unreachable-fixture_test.ts:8`; the in-file copy was
deleted, nothing else changed in `resource-state-stream_test.ts`. New cases cover:
subscribe-before-close ordering (`order === ['close-after-subscribe']` plus `followerStarted` flag,
`listener-unreachable-fixture_test.ts:199-227`); delayed transition past the retired 30 s boundary
via the labelled 1:1000 scale, 45 ms departure under a 120 ms ceiling (`:229-253`); non-vacuous
ceiling failure asserting the real timeout message and `20ms` (`:255-273`, matches
`resource-state-stream.ts:146-151`); real-backing continuity rejection (`:275-293`); structured-code
requirement rejection (`:295-315`). `runtime-gates_test.ts:146-153` forbids the private poll
(`REPORT_DEADLINE_MS`, `REPORT_POLL_MS`, `'describe',`) and pins `const WAIT_TIMEOUT_SECONDS = 10;`
and the observer call shape.

**Check 4 — validation:** PASS. Ran exactly
`deno test --allow-all packages/cli/e2e/tests/application/gates/
packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` → `ok | 208 passed (10 steps) |
0 failed (2s)`; named new tests all ok (subsequent subset run listed them: shared ceiling,
subscribe-before-close, past-30s, non-vacuous, real-backing, structured-code). `deno fmt --check`
and `deno lint` on the six TS files: both `Checked 6 files`, exit 0. No Aspire/Docker/scaffold
runtime suite was started, and no broader `deno task` was run.

**Check 5 — doctrine:** PASS. Diff stat shows only `packages/cli/e2e/**` and the run-directory TSV;
no `packages/*/src` product code, no `listener-fault-controller.ts`, no `owned-container-log`, no
#1952 prose, no lockfile change, no generated carrier. The TSV adds exactly one row in alphabetical
position for the new test file (1 occurrence in the manifest). Fault-injection invariant preserved:
`assertOwnedListenerFaultExpectation` still refuses non-test-only targets (`:247-261`) and Phase-B
selects only the controller-owned Postgres expectation (`verify-typed-db-phase-b.ts:201-211`).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Event subscriptions must be established before the action that causes the transition; a poll deadline set by a second consumer re-introduces the race the subscription removed | subscribe-then-induce, attribute from the stream or one settled snapshot | e2e runtime gates observing Aspire resource transitions | high |
| Second independent timeout budgets around the same transition will drift apart; budgets must be shared and exported, not re-declared per consumer | shared exported ceiling constant + source-shape test forbidding private deadlines | any gate suite with multiple observers of one event | high |

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | PASS                                     |
| Rationale | The hotfix implements exactly the coordinator-mandated design (subscribe-before-close, shared 120 s ceiling, single snapshot attribution, preserved 10 s `db init` bound, structured receipt) with no scope creep into product code, the fault controller, or #1952 prose; hosted exact-head evidence (run 33686579366) plus the mandated scoped test run (208/0) and fmt/lint are all green. The two low findings are informational test-model notes, not defects. |

VERDICT: PASS
