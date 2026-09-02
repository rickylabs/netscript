# Evaluation: fix-readiness-fixture-app-identifier-collision--1898 (IMPL-EVAL)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-readiness-fixture-app-identifier-collision--1898` |
| Target         | `packages/cli/e2e` readiness fixture app injection (`prepare-readiness-fixture.ts`) — issue #1898 / draft PR #1899 |
| Evaluated head | `09e7b24b5fd2d4c2b24d018be81e93bc295afa89` (pushed head; matches PR `headRefOid`) |
| Baseline       | `7d18ef104824734932b5eac247637f4b9c770579` (`main` at dispatch) |
| Archetype      | `6 - CLI / Tooling` via `@netscript/cli` ownership; doctrine 06 §Archetype 6 and doctrine 09 §F-19 exclude the nested `packages/cli/e2e` workspace as an independent published doctrine root |
| Scope overlays | `none` |
| Evaluator      | Native Claude Fable 5.1, effort medium, fresh separate session, 2026-09-01. Opposite-family to the GPT-5.6 Sol generator and separate from the Fable-low slice review session `3ae23fa3-…`. Route: `formal_impl_evaluation` per `supervisor.md`. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` with justification is present in `worklog.md` §Plan-Gate as committed in the RED commit `ad53835ee` (line 59 of that revision), i.e. before any product change. Issue #1898 supplies contract, ceiling, RED/GREEN protocol and exact gates; N/A is justified. |
| Design section exists in worklog       | `PASS` | `## Design` in `worklog.md` with public surface, vocabulary, ports (none), constants (`readiness_fixture_` prefix), 2 commit slices, deferred scope, contributor path, Archetype-6 checkpoint applicability. |
| Commit slices match design plan        | `PASS` | Design names 2 slices; branch carries RED `ad53835ee` (test + run artifacts only), GREEN `38dab6c79` (injector + test + run artifacts), plus harness-only `09e7b24b5` (run-dir evidence). Order and content match. |
| Each slice has a passing gate          | `PASS` | RED: focused wrapper exit 1 (expected fail, reproduced independently — see Runtime Gates). GREEN: gates tests / check / fmt / focused lint all exit 0, re-run independently below. |
| No speculative seams (unused files)    | `PASS` | No new files. GREEN adds one constant and one private helper `namespaceFixtureAppBinding`, both reachable from `injectReadinessFixtureApps`. Test adds two helpers, both called by the new test. |
| Constants used for finite vocabularies | `PASS` | `FIXTURE_APP_IDENTIFIER_PREFIX = 'readiness_fixture_'` replaces what would otherwise be a literal; fixture resource names reuse the existing `fixtureNames` list. |
| RED commit is tests-only               | `PASS` | `git show --name-only ad53835ee` minus `.llm/runs/**` = exactly `packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts`. |
| Ceiling respected                      | `PASS` | `git diff --name-only 7d18ef104..HEAD` = the injector, its test, and `.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/**` only. |
| Generator / listener deadline untouched | `PASS` | `git diff --stat 7d18ef104..HEAD -- packages/cli/src …/generate-register-apps.ts …/listener-unreachable-fixture.ts` is empty; `REPORT_DEADLINE_MS = 30_000` still at `listener-unreachable-fixture.ts:22`. |
| `deno.lock` unchanged                  | `PASS` | Not in the baseline diff; sha256 `a269308a…2bcd` identical before and after my gate runs; `git status` clean apart from the pre-existing untracked `evaluate-prompt.md`. |
| Agent briefs carry `## SKILL`          | `PASS` | `implement.md`, `slice-review-prompt.md`, `evaluate-prompt.md` each open with a `## SKILL` chapter. |
| Slice review gate (A1)                 | `PASS` | Separate opposite-family Fable-low session PASS recorded in `worklog.md` §Slice Review before the sign-off commit; GREEN PR comment repeats the session id. |

## Static Gates

Run independently by this session from the worktree root at head `09e7b24b5`.

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts` | `PASS` | exit 0; 190 files, 2 batches, 0 failed batches, 0 diagnostics | Matches generator evidence. |
| Slice typecheck  | Emitted-module compile inside the test (`deno check --no-config` on the injected `register-apps.mts` with typed local stubs) | `PASS` | Runs as part of the gates test suite below; also exercised directly (see Consumer Gates). | This is the load-bearing assertion for the issue's "module parses" DoD item. |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts` | `PASS` | exit 0; 190 files, 0 findings, 0 refusals | |
| Lint             | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e/src/application/gates/scaffold/runtime --root packages/cli/e2e/tests/application/gates --ext ts` | `PASS` | exit 0; 36 files, 0 findings | Root E2E lint intentionally not run (brief records the pre-existing detached-fixture REFUSAL baseline; evaluator prompt prohibits it). |
| Tests            | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates` | `PASS` | exit 0; passed 120, failed 0, ignored 0 | Matches generator evidence (120/120). |
| Doc lint         | n/a | `N/A` | No published JSDoc surface changed; nested E2E harness is not a publish root. | |
| Publish dry-run  | n/a | `N/A` | No `packages/*` publish surface, `deno.json`, or dependency changed. | |
| Link/path check  | Run artifacts, PR body, issue | `PASS` | RED/GREEN SHAs in `worklog.md`, `context-pack.md`, PR body and both PR comments all resolve to commits on the branch; ceiling paths exist. | |

## Fitness Gates

The nested `packages/cli/e2e` workspace is excluded from the doctrine root set (doctrine 09 §F-19 text, doctrine 06 §Archetype 6). No `packages/cli/src` or published surface changed, so F-CLI-1…31 and the universal gates are not exercised by this slice.

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `N/A` | Injector grows by ~19 lines; no cap crossed in the touched files; `scaffold-runtime-a8-f16-1333` covers the directory-level cap and is not deepened (no new file or gate added). | none |
| F-2  | Helper-reinvention scan      | `PASS` | Uses `String.prototype.replaceAll` with a boundary regex; no local re-implementation of an `@std` helper. | none |
| F-3  | Layering check               | `N/A` | Harness-internal; no package layering touched. | |
| F-4  | Inheritance audit            | `N/A` | No classes. | |
| F-5  | Public surface audit         | `N/A` | Exported signature of `injectReadinessFixtureApps` unchanged. | |
| F-6  | JSR publishability gate      | `N/A` | Not a publish root. | |
| F-7  | Doc-score gate               | `N/A` | | |
| F-8  | Workspace `lib` override     | `N/A` | | |
| F-9  | Permission declaration check | `N/A` | Test already ran under `--allow-all`; the new `Deno.Command`/temp-dir use is inside the test only. | |
| F-10 | Test-shape audit             | `PASS` | New test asserts semantics over real generator output (no duplicate `const` bindings, module type-checks, both `apps.set` registrations, reinjection throws) rather than a snapshot. | none |
| F-11 | Forbidden-folder lint        | `N/A` | No new folders. | |
| F-12 | Naming-convention lint       | `PASS` | New identifiers follow existing file conventions (`SCREAMING_SNAKE` constant, camelCase helpers). | |
| F-13 | Saga and runtime invariants  | `N/A` | | |
| F-14 | Console-log lint             | `PASS` | No console output added to product code. | |
| F-15 | Re-export-of-upstream lint   | `N/A` | | |
| F-16 | Folder-cardinality lint      | `DEBT_ACCEPTED` | Existing entry `scaffold-runtime-a8-f16-1333` (arch-debt.md:2243) covers this directory; no file added, so not deepened. | |
| F-17 | Abstract-derived co-location | `N/A` | | |
| F-18 | Sub-barrel lint              | `N/A` | | |
| F-19 | Scoped source gate runners   | `PASS` | All four verdicts above came from the structured wrappers (`run-deno-test/check/fmt/lint.ts`), not raw CLI. | |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| RED reproduction (independent) | Checked out `ad53835ee` in a throwaway detached worktree (`/tmp/red-1898-eval`, removed afterwards) and ran the focused test wrapper on `prepare-readiness-fixture_test.ts`. | `PASS` (expected FAIL observed) | exit 1; passed 4, failed 1, uniqueFailures 1; actual duplicate bindings `["app_0_workdir","app_0","app_0_otel"]` vs expected `[]` — identical to the generator's recorded RED. |
| Real injected module shape | Ran the real generator (one-app host `app`, workdir `apps/app`) through `injectReadinessFixtureApps` at head and inspected the full output. | `PASS` | Host block keeps `app_0`, `app_0_workdir`, `app_0_otel`. Fixture blocks emit `readiness_fixture_app_0{,_workdir,_otel}` and `readiness_fixture_app_1{,_workdir,_otel}`; a scan of the fixture region for bare `app_<n>` / `app_<n>_<suffix>` identifiers returns `[]`. `apps.set("readiness-dead-port", readiness_fixture_app_0)` and `apps.set("listener-fault-controller", readiness_fixture_app_1)` are both present. |
| Suffix coverage vs generator | `grep -oE '\$\{id\}_[A-Za-z]+' generate-register-apps.ts` | `PASS` | Generator derives exactly `_workdir`, `_otel`, `_build` from the positional id. The rewrite regex `(?<![\w$])app_<n>(?=_|[^\w$]|$)` matches the root at identifier boundaries and any `_`-suffixed derivative, so `_build` (not emitted for `task` type apps) is covered without being enumerated. `app_0` cannot match inside `app_01` (lookahead rejects a following digit) or inside `apps.set` (literal `app_0` does not occur). Fixture workdir strings (`.netscript/e2e/readiness-dead-port`, `.netscript/e2e/listener-fault-controller`) contain no `app_<n>` text, so no string mutation occurs. |
| Full `deno task e2e:cli` / hosted `scaffold.runtime` tiers | prohibited for this leaf and for this evaluator | `NOT_RUN` | No runtime lease; explicitly excluded by the brief and the evaluator prompt. The issue's fourth DoD item (controller binds 18999, `runtime.health.listener-unreachable` green in both hosted tiers) remains supervisor-owned hosted evidence. PR CI checks currently show every job as `skipping` on the draft (`gh pr checks 1899`), so no hosted evidence exists on this head yet. |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| Emitted `register-apps.mts` type-checks (test helper `assertGeneratedModuleChecks`) | Verified the assertion is load-bearing: took the real injected output, simulated a partial rename (declaration `readiness_fixture_app_1_workdir` reverted to `app_1_workdir`, reference left intact), and ran the identical `deno check --no-config` stub layout from `/tmp`. | `PASS` | Good module: check exit 0. Dangling module: check exit 1 with `TS2552 Cannot find name 'readiness_fixture_app_1_workdir'`. The stub set (`../.aspire/modules/aspire.mts`, `./_aspire-compat.mts`, `./register-infrastructure.mts`) mirrors the generator's real local imports, so a dangling suffixed identifier cannot pass. |
| Reinjection fails closed | Existing `assertThrows(() => injectReadinessFixtureApps(injected), Error, 'readiness-dead-port fixture was already registered')` retained in the rewritten test; runs green in the 120/120 suite. | `PASS` | GREEN diff keeps the `assertThrows` block; the `appRegistrations` guard matches on the resource name string, which the rewrite does not alter. |
| `includeListenerFaultController = false` path | Existing test coverage unchanged; suite green. | `PASS` | Rewrite is applied per sliced block in `appBlock`, so the single-block path is namespaced identically. |
| Draft PR trail (`netscript-pr`) | PR #1899 body/labels/comments inspected read-only via `gh`. | `PASS` | Body carries `Closes #1898` verbatim, RED/GREEN SHAs, gate exit codes, ceiling; labels `type:fix, area:cli, area:tooling, area:aspire, gate:e2e, priority:p0, orchestrator:fixes, ci:full`, exactly one `status:` (`status:impl`), milestone `0.0.7`; two per-slice phase comments (RED, GREEN) with SHAs and wrapper counts; PR is still draft; DoD boxes are all unticked (supervisor-owned, correct). |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `N/A` | no published surface | |
| AP-2  | `N/A` | | |
| AP-3  | `N/A` | | |
| AP-4  | `N/A` | | |
| AP-5  | `N/A` | | |
| AP-6  | `CLEAR` | one small boundary-regex helper, justified by a stable generated-identifier invariant (plan A6) | |
| AP-7  | `N/A` | | |
| AP-8  | `N/A` | | |
| AP-9  | `N/A` | | |
| AP-10 | `N/A` | | |
| AP-11 | `N/A` | | |
| AP-12 | `N/A` | | |
| AP-13 | `N/A` | | |
| AP-14 | `CLEAR` | no `any`, no `as unknown as`; regex escape uses a typed string | |
| AP-15 | `N/A` | | |
| AP-16 | `N/A` | | |
| AP-17 | `N/A` | | |
| AP-18 | `CLEAR` | test builds the host with the real generator, asserts duplicate-binding set, compile result, and registrations; the four `assertStringIncludes` on `const readiness_fixture_app_<n>_<suffix>` are targeted identifier assertions, not a snapshot | |
| AP-19 | `N/A` | | |
| AP-20 | `N/A` | | |
| AP-21 | `N/A` | | |
| AP-22 | `N/A` | | |
| AP-23 | `N/A` | | |
| AP-24 | `N/A` | | |
| AP-25 | `N/A` | | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0 | `.llm/harness/debt/arch-debt.md` unchanged on the branch |
| Resolved entries      | 0 | |
| Deepened violations   | 0 | `scaffold-runtime-a8-f16-1333` (F-16 on this directory) not deepened: no new file, gate, or registry entry |
| Unrecorded violations | 0 | |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking) | The injected host now contains two `// --- app 0 ---` ordinal comments (host app 0 and fixture app 0) because the comment, unlike the bindings, is not namespaced. | Real injected output above. The only consumer that searches `// --- app ` is the injector itself, and it searches its own isolated generator output, not the host (`grep -rn -- "--- app " packages/cli/e2e/src` excluding the injector: no matches). | none for this slice; note for any future consumer that locates host app blocks by ordinal comment (the #1863 string-coupling class). |
| info | Hosted runtime evidence (issue DoD item 4, PR DoD item 5) is absent on this head: all PR CI jobs are `skipping` on the draft. | `gh pr checks 1899` | Supervisor-owned; must exist before `status:ready-merge` / close-gate mirroring. Not a defect of this leaf. |
| info | Issue #1898 still carries `status:plan` while the PR is `status:impl`. | `gh issue view 1898` labels | Supervisor reconcile step; no GitHub mutation performed by this evaluator. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence |
| --------- | ----------- | -------------- | ---------- |
| Namespace spliced generator output at identifier boundaries, and prove it by compiling the emitted module with typed local stubs | When a harness injects blocks produced by a positional generator into a host produced by the same generator, rewrite the block-local root binding with a boundary regex whose lookahead admits `_`-suffixed derivatives, then `deno check --no-config` the result against stubs mirroring the real imports. Text-diff assertions would pass a partial rename. | Archetype 6 E2E harnesses; any generated-module splice | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete within the ceiling: RED is tests-only and reproduces the three duplicate bindings independently; GREEN namespaces the root binding and every `_`-suffixed derivative (`_workdir`, `_otel`, and the unemitted `_build`) at identifier boundaries, block-locally, without touching the generator, the listener deadline file, or `deno.lock`. The emitted module is type-checked by the test, and I proved that assertion fails on a dangling partial rename. Both resource registrations and fail-closed reinjection remain tested. All four authorized structured-wrapper gates pass independently (tests 120/120, check 190 files/0 diagnostics, fmt 0 findings, focused lint 0 findings). Design checkpoint, PLAN-EVAL N/A (recorded before implementation), slice-review gate, PR trail, labels, milestone and closing keyword are all in order. No doctrine violation introduced; existing debt not deepened. Hosted `scaffold.runtime` evidence is intentionally outside this leaf and remains a supervisor-owned precondition for ready-merge and acceptance mirroring. |
