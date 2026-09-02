# Evaluation: bind the Fresh navigation platform fetch (#1900)

Formal IMPL-EVAL. Evaluated head `5a21b1013eaafb4aa3341704902b731e9b463ddc` against base
`e938ecd31fd1c909f23bb7dd60029a302ce8d428` (PR #1904, `Closes #1900`).

## Metadata

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Run ID         | `fix-fresh-navigation-fetch-binding--1900`                                                 |
| Target         | `packages/fresh/src/runtime/navigation` (coordinator receiver fix + regression)            |
| Archetype      | `4 — Public DSL / Builder`                                                                 |
| Scope overlays | `frontend`                                                                                 |
| Evaluator      | Claude · Anthropic · `claude-fable-5` · medium — fresh native session `session_01F8px5DXrKvzcD6PdYWbXDL` (background job `24a85855`) · 2026-09-01 |

Evaluator independence: separate session from the Codex generator (`01a05ea9-…2849a5`) and from the
Tier-A slice-review session (background job `e39b230c`). Route matches the
`formal_impl_evaluation` lane recorded in `supervisor.md` (native opposite-family Claude · Fable 5).

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                       |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `PLAN-EVAL: N/A` recorded in `worklog.md` Progress Log at 2026-09-01T20:33:46Z, before the S1 implement entry (20:39:04Z). Justified per run-loop §4: #1900 supplies a complete pre-diagnosed mechanical contract (defect lines, invariant, regression shape, 2-file bounds, gate ownership). No `plan-eval.md` is required. |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` names the unchanged 7-symbol public surface, `originalFetch`/`platformFetch` vocabulary, the existing `NavigationPlatform` port, no new constants, one commit slice, deferred scope, contributor path. |
| Commit slices match design plan        | PASS   | One slice planned; one sign-off commit `5a21b1013` touching exactly `coordinator.ts`, `coordinator_test.ts`, and the run dir. Prior commits `884dda6ad`/`8817656e8` are harness brief/plan artifacts only. |
| Each slice has a passing gate          | PASS   | Focused structured gates recorded in `worklog.md` and independently rerun by this evaluator (tables below).                                     |
| No speculative seams (unused files)    | PASS   | No new files; diff adds one field, one bind, two call-site edits, one test.                                                                    |
| Constants used for finite vocabularies | PASS   | No new finite vocabulary introduced; test literals are fixture URLs/body text.                                                                 |

## Static Gates

| Gate             | Command or check                                                | Result | Evidence                                                        | Notes |
| ---------------- | --------------------------------------------------------------- | ------ | --------------------------------------------------------------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root packages/fresh --ext ts,tsx` (rerun)  | PASS   | 207 files, 2 batches, 0 findings, exit 0                        | Evaluator rerun. |
| Slice typecheck  | covered by the same scoped check                                | PASS   | as above                                                        |       |
| Format           | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` (rerun)    | PASS   | 207/207 processed, 0 findings                                   |       |
| Lint             | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` (rerun)   | PASS   | 207/207 processed, 0 findings                                   |       |
| Doc lint         | `deno task doc:lint --root packages/fresh` (rerun)              | FAIL (pre-existing baseline) | 45 diagnostics: 28 `private-type-ref` + 17 `missing-jsdoc`, in builders(3)/query(8)/route(25)/streams(11); `./navigation` = 0 | See Findings F2 — not caused by this diff; no changed file implicated. |
| Publish dry-run  | `deno task publish:dry-run` from `packages/fresh` (rerun)       | PASS   | "Success Dry run complete", exit 0, `@netscript/fresh@0.0.6`    | Test file excluded from publish set. |
| Link/path check  | run-dir artifacts + PR body run-dir path                        | PASS   | `.llm/runs/fix-fresh-navigation-fetch-binding--1900/` exists and matches PR body |       |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                                                  | Violations |
| ---- | --------------------------------- | ------ | ----------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `deno task quality:gate` exit 0 (evaluator rerun); coordinator +6/−2 lines               | none       |
| F-2  | Helper-reinvention scan           | PASS   | Native `Function.prototype.bind`; no helper added                                          | none       |
| F-3  | Layering check                    | PASS   | Change confined to `runtime/navigation`; imports unchanged                                 | none       |
| F-4  | Inheritance audit                 | PASS   | No class hierarchy change                                                                  | none       |
| F-5  | Public surface audit              | PASS   | `deno doc packages/fresh/src/runtime/navigation/mod.ts` (evaluator rerun): exactly 7 symbols — 2 values (`KeyedPartial`, `installPartialNavigationCoordinator`), 3 interfaces, 2 type aliases | none |
| F-6  | JSR publishability gate           | PASS   | `audit-jsr-package.ts --root packages/fresh` exit 0; dry-run OK; `./navigation` surface = 2 value exports; 2 pre-existing WARNs (ai-dir cardinality, slow-types notice) untouched by this diff | none new |
| F-7  | Doc-score gate                    | FAIL (pre-existing baseline) | Structured doc-lint report above; `./navigation` clean                     | none in scope — see F2 |
| F-8  | Workspace `lib` override check    | N/A    | No config change                                                                           |            |
| F-9  | Permission declaration check      | N/A    | No permission change                                                                       |            |
| F-10 | Test-shape audit                  | PASS   | Regression is a colocated `_test.ts` using the existing `TestPlatform` seam                | none       |
| F-11 | Forbidden-folder lint             | PASS   | No folders added                                                                           | none       |
| F-12 | Naming-convention lint            | PASS   | `platformFetch` matches the existing `originalFetch`/`wrappedFetch` vocabulary             | none       |
| F-14 | Console-log lint                  | PASS   | No console output added (diff inspection)                                                  | none       |
| F-15 | Re-export-of-upstream lint        | PASS   | No export change                                                                           | none       |
| F-16 | Folder-cardinality lint           | PASS   | No files added; pre-existing ai-dir WARN unrelated                                         | none new   |
| F-17 | Abstract-derived co-location lint | N/A    | No class hierarchy change                                                                  |            |
| F-18 | Sub-barrel lint                   | PASS   | `mod.ts` untouched                                                                         | none       |
| F-19 | Scoped source gate runners        | PASS   | Structured check/test/lint/fmt reruns above, all exit 0                                    | none       |

Code-quality gate (`quality:scan` + `arch:check` via `deno task quality:gate`): PASS, exit 0
(evaluator rerun) — no `any`/casting, no new lint-ignores, warnings are pre-existing repo baseline
(A9/A12/A13 info-warns and `export default` WARNs in unrelated files).

## Runtime Gates

| Gate                              | Validation                                                                                                   | Result  | Evidence |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------- | -------- |
| Receiver preservation (both paths)| Independent code + test verification                                                                          | PASS    | `coordinator.ts:118` keeps `originalFetch` raw; `:119` `platformFetch = this.originalFetch.bind(globalThis)`; sole transport callable at pass-through `:238` and intercepted `:248`. `wrappedFetch` (`:122`) is an arrow, so reverting either site to `this.originalFetch(...)` yields `this = NavigationRuntime ≠ globalThis`. |
| Regression genuinely detach-sensitive | Test double inspection                                                                                    | PASS    | `coordinator_test.ts:248` double `throw new TypeError('detached platform fetch')` unless `this === globalThis`; module strict mode means a fully detached call (`this === undefined`) also throws. Covers intercepted (`partialUrl('/receiver-preserved')` after `stageAnchor`) and pass-through (`/asset.css`); asserts `calls === 2`; post-dispose asserts `platform.getFetch() === receiverSensitiveFetch` (raw-identity restoration). |
| Focused navigation tests          | `run-deno-test.ts -- --allow-all packages/fresh/src/runtime/navigation` (evaluator rerun)                     | PASS    | 9 passed / 0 failed, exit 0 |
| Drain-never-abort / EOF disposal  | Diff inspection + focused production scan (evaluator rerun)                                                   | PASS    | Zero `.abort(`/`AbortController`/`.cancel(` in non-test navigation source; `dispose()` EOF-await loop (`coordinator.ts:330-334`), `ManagedPartialBody` drain paths, history wrapper ownership guards, and unhandled-rejection handling all untouched by the diff. |
| Hosted `fresh-browser`            | Chromium gate                                                                                                | NOT_RUN | Supervisor-owned per the lane constraint (no local Chromium/Docker/Aspire/`e2e:cli` on this NAS lane). Known pre-fix failure: run `33542380097`. Not claimed as locally run anywhere in the run artifacts or PR. |

## Consumer Gates

| Consumer                  | Validation                                        | Result | Evidence |
| ------------------------- | ------------------------------------------------- | ------ | -------- |
| Navigation entrypoint     | `deno doc` symbol census (evaluator rerun)         | PASS   | Exactly 7 symbols, 2 values + 5 types; `mod.ts`, `types.ts`, `keyed-partial.tsx` have zero diff base→head (`git diff --name-only`). |
| Lock hygiene              | `git diff e938ecd31..5a21b1013 -- deno.lock` + worktree diff | PASS | Empty both ways. |
| SSR-inert import contract | Existing test rerun                                | PASS   | 'public navigation entrypoint imports without browser globals or global mutation' passes; the `bind(globalThis)` happens at construction (client install), not module load. |

## Anti-Pattern Check

| AP    | Status | Evidence                                                             | Notes |
| ----- | ------ | -------------------------------------------------------------------- | ----- |
| AP-1  | N/A    | No barrel change                                                     |       |
| AP-2  | CLEAR  | Native `bind`, no wrapper helper                                     | Plan risk resolved |
| AP-3  | N/A    | outside scope                                                        |       |
| AP-4  | N/A    | outside scope                                                        |       |
| AP-5  | N/A    | outside scope                                                        |       |
| AP-6  | N/A    | outside scope                                                        |       |
| AP-7  | N/A    | No constructor/factory signature change                              |       |
| AP-8  | N/A    | outside scope                                                        |       |
| AP-9  | CLEAR  | Minimum local change: one field, one bind, two call-site swaps       | Plan risk resolved |
| AP-10 | N/A    | outside scope                                                        |       |
| AP-11 | CLEAR  | Receiver captured explicitly at construction                         |       |
| AP-12 | N/A    | outside scope                                                        |       |
| AP-13 | N/A    | No boundary change                                                   |       |
| AP-14 | N/A    | No re-export change                                                  |       |
| AP-15 | CLEAR  | `platformFetch` uses caller vocabulary consistent with the file      |       |
| AP-16 | N/A    | outside scope                                                        |       |
| AP-17 | N/A    | outside scope                                                        |       |
| AP-18 | N/A    | outside scope                                                        |       |
| AP-19 | N/A    | outside scope                                                        |       |
| AP-20 | N/A    | outside scope                                                        |       |
| AP-21 | N/A    | outside scope                                                        |       |
| AP-22 | N/A    | No sub-barrel change                                                 |       |
| AP-23 | N/A    | No composition change                                                |       |
| AP-24 | N/A    | No variant switch introduced                                         |       |
| AP-25 | CLEAR  | No new load-time side effect; SSR-inert import test still passes     | Navigation remains the designated browser edge |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | None required; the defect is fixed, not deferred. |
| Resolved entries      | 0     | No debt entry existed for the receiver defect. |
| Deepened violations   | 0     | The 45-diagnostic doc-lint residue predates this branch (all in unchanged builders/query/route/streams files); this run neither introduced nor deepened it. |
| Unrecorded violations | 0     | Residue is recorded in this run's `drift.md` (significant); ownership sits with those surface owners. Note: arch-debt entry "F-7 full package doc-lint residue after 5d1" is marked RESOLVED (2026-06-14), so the current residue is a later regression by other waves — see F2. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low      | F1 — PR #1904 carries no per-slice `[PHASE: IMPL]` comment yet (0 comments), though the sign-off commit `5a21b1013` is pushed and is the PR head. The commit trail's comment half is pending. | `gh pr view 1904 --json comments` → 0 | Supervising session posts the structured IMPL phase comment (slice scope, commit hash, gate evidence) before any status advance / ready-for-review flip. Non-blocking: worklog/context-pack already sequence it as the next step and the evidence exists in the run dir. |
| low      | F2 — Full-package `doc:lint` red (45 = 28 private-type-ref + 17 missing-jsdoc; builders 3 / query 8 / route 25 / streams 11; navigation 0) is **baseline drift, not a blocker** under the approved bounded contract: no changed file is implicated, and widening into unrelated API/doc remediation would violate the run's locked non-scope. It does, however, contradict the RESOLVED state of the "F-7 full package doc-lint residue after 5d1" arch-debt entry. | Evaluator rerun of `deno task doc:lint --root packages/fresh`; `drift.md` entry 2026-09-01 | File a follow-up issue (or reopen/append the F-7 debt entry) assigning the residue to the builders/query/route/streams surface owners. Ownership: supervisor/orchestrator, outside this PR. |

No high or medium findings. Close-gate: issue #1900 contains zero markdown checkboxes (nothing
unchecked); PR #1904 DoD boxes are legitimately unchecked while the PR is `status:impl` draft — the
close-gate binds at `status:ready-merge`. PR metadata verified: draft, head `5a21b101…`, milestone
`0.0.7`, labels `type:fix` + `status:impl` (exactly one status) + `priority:p1` + `wave:v1` +
`area:fresh` + `orchestrator:features`, body carries `Closes #1900`, the #1895 handoff note, the
run-dir path, and states hosted `fresh-browser` is supervisor-owned (never claimed as locally run).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Receiver-sensitive doubles for captured platform functions | Unit doubles that are plain functions cannot catch `Illegal invocation`; a double asserting `this === globalThis` locks the receiver contract for any captured Web Platform callable (`fetch`, `pushState`, …) | Archetypes 3/4 browser-edge runtimes | medium |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete and exact: `originalFetch` stays raw for identity-preserving restoration (verified restored by identity post-dispose), a `globalThis`-bound `platformFetch` is the sole transport callable at both invocation sites, and the new regression genuinely fails on detached invocation across intercepted and pass-through paths. Drain-never-abort and EOF-awaited disposal are untouched; product scope is exactly the two files; the 7-symbol surface and `deno.lock` are unchanged. All required gates were independently rerun green (scoped check/test/lint/fmt, quality:gate, JSR audit, publish dry-run, doc census); the only red gate is pre-existing full-package doc-lint residue outside every changed file, correctly recorded as drift with deferred ownership. PLAN-EVAL N/A was recorded before implementation with valid justification; generator ≠ Tier-A reviewer ≠ evaluator sessions. Two low findings (pending IMPL phase comment; follow-up ownership for the doc-lint baseline) do not block. |
