# Evaluation: PR #2640 — issue #2632 (malformed form CSRF cookie)

## Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-fresh-malformed-csrf-cookie--issue-2632`                     |
| Target         | PR #2640, head `d0f5f0baeda86e848d5094ab3c8abb6bdc4d01da`       |
| Baseline       | `b0eb079575968e843b781579673c9fe2ae250e07` (origin/main)         |
| Archetype      | 4 — Public DSL / Builder (`packages/fresh`)                      |
| Scope overlays | frontend                                                         |
| Workload tier  | simple                                                           |
| Evaluator      | separate session, 2026-11-16; route `minimax_m3@provider_default` on the OpenCode Go transport; generator was Codex `gpt-6.1-sol` (different vendor family, different session) |

Route selection was read from the pinned Harness matrix (`deno task agentic:matrix --tier simple --impl-evaluator`): simple-tier IMPL-EVAL primary `minimax_m3@provider_default`, fallback `deepseek_v4_flash@provider_default`. The observed evaluator identity matched the requested primary route, so no fallback was used.

## Process Verification

| Check                                  | Result | Evidence                                                                    |
| -------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `worklog.md` records `PLAN-EVAL: N/A` with a concrete reason (bounded parser correction; no new public contract) before implementation |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` — public surface, domain, ports/constants, contributor path |
| Commit slices match design plan        | PASS   | 2 commits: `ce62cb3eb` (plan/bootstrap), `d0f5f0bae` (reader correction + regressions) |
| Each slice has a passing gate           | PASS   | Focused test 20/20, scoped check/lint/fmt 0, `quality:gate` 0, `release:preflight` 0, `docs:accuracy` 0, JSR audit 0 — all re-run independently below |
| No speculative seams (unused files)    | PASS   | Diff adds no file; 3 files touched, all consumed by the fix or its tests |
| Constants used for finite vocabularies | PASS   | `CSRF_COOKIE_NAME` retained; no new literal vocabulary introduced |

## Static Gates

| Gate             | Command or check                                                              | Result | Evidence                                                                              | Notes |
| ---------------- | ------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root packages/fresh --ext ts,tsx`                         | PASS   | exit 0, 258 files selected, 0 occurrences                                              | Package-wide |
| Slice typecheck  | `run-deno-check.ts --root <form/validation> --root <define-page> --ext ts,tsx`  | PASS   | exit 0, 38 files, 0 occurrences                                                         | Slice-wide |
| Format           | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx`                            | PASS   | exit 0, 258 files, 0 findings                                                           | Slice-scope run also exit 0 |
| Lint             | `run-deno-lint.ts --root packages/fresh --ext ts,tsx`                            | PASS   | exit 0, 258 files, 0 occurrences                                                        | Slice-scope run also exit 0 |
| Doc lint         | `run-deno-doc-lint.ts --root packages/fresh`                                    | FAIL (pre-existing) | exit 1, 47 diagnostics; form entrypoint `./src/application/form/mod.ts` = 0 | Baseline provenance proven below |
| Publish dry-run  | `deno publish --dry-run` in `packages/fresh`                                    | PASS   | exit 0, `Success Dry run complete`, 1 pre-existing slow-type warning                | Warning is in the `runtime/ai` surface |
| Link/path check  | `docs:exports-drift`, `docs:accuracy`                                           | PASS   | both exit 0                                                                            | One stale prose line found — see Findings |

### Doc-lint baseline provenance

The 47 diagnostics are **pre-existing and unchanged by this PR**. Measured on the base commit in a separate detached checkout of `b0eb079575968e843b781579673c9fe2ae250e07`: identical totals (47 = 30 privateTypeRef + 17 missingJSDoc) and identical per-entrypoint distribution (builders 3, query 8, route 25, ai 2, streams 11, **form 0**). None of the flagged files is in this diff (`git diff b0eb07957..HEAD -- <flagged paths>` is empty). The doctrine tracks this residue as known debt (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`, fresh Keep verdict preserved), so it is not a new violation and needs no new debt entry.

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                                                              | Violations |
| ---- | ---------------------------- | ------ | ----------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint               | PASS   | Changed files 78 / 57 / 444 LOC, all < 500 cap; `arch:check` fresh FAIL=0                              | none |
| F-2  | Helper-reinvention scan      | PASS   | No new helper; `readCsrfToken` reuses `@std/http` `getCookies`                                           | none |
| F-3  | Layering check               | PASS   | Change stays inside the existing `form/validation` seam; no new layer                                    | none |
| F-4  | Inheritance audit            | PASS   | No type added                                                                            | none |
| F-5  | Public surface audit         | PASS   | `readCsrfToken(request: Request): string \| undefined` byte-identical; export map unchanged; `docs:exports-drift` exit 0 | none |
| F-6  | JSR publishability gate      | PASS   | `audit-jsr-package.ts` exit 0, dry-run OK, 1 pre-existing slow-type warning outside the changed surface | none |
| F-7  | Doc-score gate               | FAIL (pre-existing) | Full-package doc lint exit 1 with 47 diagnostics, unchanged from base                            | pre-existing, tracked debt |
| F-8  | Workspace `lib` override check | PASS | No `lib` path introduced                                                                        | none |
| F-9  | Permission declaration check | PASS   | No new module permissions                                                                              | none |
| F-10 | Test-shape audit             | PASS   | Tests colocated with the changed seam; asserts real handler output, no mocks                           | none |
| F-11 | Forbidden-folder lint        | PASS   | No new folder                                                                                          | none |
| F-12 | Naming-convention lint       | PASS   | No new exported name                                                                                    | none |
| F-13 | Saga and runtime invariants  | N/A    | Out of scope                                                                                           | none |
| F-14 | Console-log lint             | PASS   | No console call in the changed source                                                                   | none |
| F-15 | Re-export-of-upstream lint   | PASS   | No re-export added                                                                                      | none |
| F-16 | Folder-cardinality lint      | PASS   | No new folder; fresh warnings pre-existing in `src/runtime/ai`                                           | none |
| F-17 | Abstract-derived co-location lint | PASS | No new file | none |
| F-18 | Sub-barrel lint              | PASS   | No new barrel                                                                                          | none |
| F-19 | Scoped source gate runners   | PASS   | `arch:check` exit 0 across all roots                                                                   | none |

## Runtime Gates

| Gate     | Validation                                                                                          | Result | Evidence                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Focused regression suite | `run-deno-test.ts -- --allow-all <csrf.test.ts> <runtime.test.tsx>`                       | PASS   | exit 0, 20 passed / 0 failed / 20 total                                                                   |
| Pre-fix reproduction | Same suite with the reader reverted to the base implementation                               | PASS   | exit 1, **10 passed / 10 failed**; all 10 failures are `SyntaxError: Cookie cannot start with '='` at the reader, GET loader and POST handler |
| Full fresh package suite | `run-deno-test.ts -- --allow-all packages/fresh/src`                                             | PASS   | exit 0, 315 passed / 0 failed                                                                              |
| Narrow-error probe | Injected non-`SyntaxError` failure from the header read                                       | PASS   | Propagates unchanged; only `SyntaxError` maps to `undefined`                                               |
| Verification-not-weakened probe | Valid token / mismatched token / absent cookie POSTs                                       | PASS   | valid → success; mismatched → error; absent → error; mutation runs only on valid                          |
| Mixed-header probe | Valid CSRF cookie alongside a malformed segment                                                 | PASS   | Rejected (`error`, no mutation) — fails closed, never weakens CSRF                                         |
| CLI E2E (`scaffold.runtime`) | Classifier analysis on this PR's changed-file set                                    | NOT_RUN | Not run locally. The CI classifier sets `runStatic`/`runRuntimeSqlite`/`runRuntime` for `packages/**` paths, so these tiers run in CI on `ready_for_review` |

## Consumer Gates

| Consumer     | Validation                                                    | Result | Evidence                                                                 |
| ------------ | ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `form-support.ts` (POST)  | Regression test through the real `definePage().withForm().build()` POST handler | PASS | Malformed cookie → CSRF rejection result, not a `Response`; `csrf:false` → mutation runs, status `success` |
| `define-page/builder/mod.tsx` (GET loader) | Regression test through the real GET handler            | PASS | 200 render, fresh non-empty token, `Set-Cookie` carries that token, `<form>` present |
| `form/mod.ts` public barrel | `docs:exports-drift` + package doc lint on the form entrypoint | PASS | Form entrypoint reports 0 diagnostics; export map unchanged                    |
| Downstream packages      | `run-deno-check.ts --root packages --root plugins` (repo scope) | PASS | exit 0 — no consumer broke on the unchanged public signature               |

## Anti-Pattern Check

Only patterns in scope are marked. The run scope touched `packages/fresh/src/application/form/validation/` and `packages/fresh/src/application/builders/define-page/tests/`.

| AP    | Status | Evidence                                                                        | Notes |
| ----- | ------ | ------------------------------------------------------------------------------- | ----- |
| AP-1  | CLEAR  | Changed files 78 / 57 / 444 LOC; no monolithic file introduced                   | Fresh's 4 pre-existing F-1 warnings are in unrelated files |
| AP-14 | CLEAR  | No upstream re-export added; `getCookies`/`setCookie` consumed, not re-exported | n/a |
| AP-25 | CLEAR  | No `console.*`, `Deno.env`, `fetch`, `Date.now`, `setTimeout` in the changed source | n/a |
| AP-2, AP-7, AP-9, AP-11, AP-13, AP-15, AP-16, AP-17, AP-19, AP-20, AP-22, AP-23, AP-24 | N/A | No builder API, typestate, folder or composition change | Out of scope |

No `any`, `as unknown as`, or new `deno-lint-ignore` was introduced in the diff (grep over the added lines returns nothing). `quality:scan` exit 0 with 7 pre-existing allowances, none in this surface.

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                     |
| --------------------- | ----- | -------------------------------------------------------------------------------------------- |
| New entries           | 0     | No new violation; `arch-debt.md` unchanged in the diff                                        |
| Resolved entries      | 0     | n/a                                                                                           |
| Deepened violations   | 0     | Changed surfaces show no new doctrine finding                                                 |
| Unrecorded violations | 0     | The 47 doc-lint diagnostics are pre-existing and already tracked by the doctrine's fresh route-documentation debt entry |

## Findings

| Severity | Finding                                                                                                                                                                                                              | Evidence                                                                                                                                                                | Required action |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| low      | The public docs reference still carries the pre-change one-line summary for `readCsrfToken` ("Read the current CSRF token from a request cookie header"), omitting the new malformed-cookie behavior. The signature is unchanged; only the descriptive sentence lags. | `docs/site/reference/fresh/index.md` line 376 vs. the updated JSDoc in `packages/fresh/src/application/form/validation/csrf.ts`. `docs:exports-drift` checks symbol coverage, not JSDoc prose, so no gate catches it. | fix — refresh the one-line summary in the same PR (docs-only, no public API change) |
| low      | The plan records "CLI E2E N/A" on the grounds that no scaffold/Aspire/runtime wiring changed. That is true semantically, but the CI classifier is path-based: any `packages/**` code path sets the scaffold and docker capabilities, so `scaffold-static`, `scaffold-runtime-sqlite` and `scaffold-runtime` will run in CI once the PR leaves draft. | Classifier run over this PR's changed-file set returns `runStatic: true`, `runRuntimeSqlite: true`, `runRuntime: true`, `needsDeno: true`, `needsFreshBrowser: true`, `needsSurface: true`. `ci.yml` header: "Draft PR pushes schedule no jobs." | fix — record the CI tiers that will materialize on `ready_for_review` in the run artifacts so the merge-readiness step is not surprised; no local CLI E2E is required |
| info    | Merge-readiness bookkeeping for the parent: the PR body has no closing keyword, 5 unchecked Definition-of-Done boxes, and issue #2632 has 4 unchecked acceptance boxes that are now satisfied. A fenced `acceptance-evidence` block mapping each issue box to evidence is required before `status:ready-merge`. | `gh pr view 2640 --json body` shows no `Closes`/`Fixes`/`Resolves` and 5 unchecked boxes; issue #2632 body shows 4 unchecked boxes under `## Acceptance`; `netscript-pr` "Merge close-gate (#387)" | fix — parent updates body/issue boxes and adds the evidence block before the ready-merge transition |

No finding blocks the implementation itself. The three items above are documentation and merge-bookkeeping work, all inside the parent's lane.

## Lessons for Promotion

| Lesson                                                                                  | Pattern                                        | Applies to                    | Confidence |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------- | ---------- |
| Verify a "narrow catch" against the pinned dependency's actual throw sites, not just the error class. `@std/http@1.1.4` `getCookies` has exactly one throw site (`SyntaxError` on an empty cookie key), which is what makes `instanceof SyntaxError` precise today; a future upstream throw site would widen the swallowed set silently. | narrow error handling coupled to a pinned dependency | Archetype 3/4 | medium |
| A CI lane skipped on a draft PR is not evidence that the lane will pass: the classifier is path-based, so a `packages/**` change schedules the scaffold and docker tiers on `ready_for_review` regardless of semantic impact. | draft-PR skip vs. classifier path rules | all | medium |
| A pre-existing red gate needs a measured baseline (same command on the base commit) before it can be classified as pre-existing rather than introduced. | baseline provenance for failing gates | all | high |

## Verdict

| Field     | Value                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verdict   | `PASS`                                                                                                                                                                                           |
| Rationale | The approved scope is complete and correct. All four issue #2632 acceptance criteria are satisfied and independently demonstrated: the reader returns `undefined` for an unparsable Cookie header, a POST with a malformed cookie receives the CSRF rejection result (not a `Response`/500), a `csrf: false` form accepts the POST with the mutation actually running, and a GET renders, issues a fresh token and sets the matching cookie. The fix is minimal (7 added / 2 removed lines in one function), keeps the public signature and export map byte-identical, catches only `SyntaxError` so unrelated failures still propagate, and fails closed — a malformed header can never weaken CSRF verification. The regression suite is genuine: reverting only the reader reproduces exactly 10 failures with the parser `SyntaxError` at all three call sites, and the suite passes 20/20 at head; the full `packages/fresh/src` suite passes 315/315. Independent re-runs of the scoped check/lint/fmt, `quality:gate`, `release:preflight`, `docs:accuracy`, JSR audit and `docs:exports-drift` gates all exit 0. The only red gate (full-package doc lint, 47 diagnostics) is proven pre-existing by measuring the identical result on the base commit in a separate checkout — the changed form entrypoint has zero diagnostics — and is already tracked by the doctrine's fresh route-documentation debt. No doctrine violation was introduced or deepened, no debt entry is missing, and no `any`, unsafe cast, or lint-ignore was added. The three findings above are low-severity documentation and merge-bookkeeping items for the parent; none blocks the implementation. |

## Notes and scope limits

- No product files were edited, no commits were made, no push, no merge, no label or readiness change was performed by this evaluation.
- The evaluation worktree was returned to a clean state at head `d0f5f0baeda86e848d5094ab3c8abb6bdc4d01da`; the temporary detached checkout used for the doc-lint baseline was removed.
- Gates that were not run are reported as `NOT_RUN` and are not claimed as passing. The CLI E2E scaffold tiers are left to CI.
