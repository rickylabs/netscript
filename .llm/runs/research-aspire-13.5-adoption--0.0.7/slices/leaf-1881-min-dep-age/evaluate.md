# Evaluation: leaf-1881 README minimum dependency age (IMPL-EVAL)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Run ID         | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-min-dep-age`            |
| Target         | head `957cff9ff4e682e60a67e6e902f720f54e7e494a` vs baseline `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a` |
| Archetype      | 6 - CLI / Tooling                                                              |
| Scope overlays | docs                                                                           |
| Evaluator      | Claude Fable 5.1 (`claude-fable-5-1`), fresh opposite-family session, 2026-09-03, worktree `007-aspire-leaf-1881-fix` |
| Mode           | read-only; only this file written; no Aspire/Docker/runtime suite started      |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                       |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `worklog.md` §Plan gate records `PLAN-EVAL: N/A` with the small/mechanical justification in commit `33083a6f0`, before any implementation commit |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` with public surface, constants, ports/generated outputs, Archetype 6 checkpoint, slices, deferred scope               |
| Commit slices match design plan        | `PASS` | 5 commits, baseline is ancestor: `33083a6f0` plan, `a3f929c23` RED (3 test files only), `86c71bc97` GREEN (3 doc files only), `e6dbee80d` carriers (4 generated files only), `957cff9ff` evidence + manifest |
| Each slice has a passing gate          | `FAIL` | Slices 1-3 verified green (below). Slice `957cff9ff` claims `check:aspire-version-parity` exit 0 / `manifestFresh:true`; independent rerun at head exits 1 with `manifest:freshness` fail (see Findings F-1) |
| No speculative seams (unused files)    | `PASS` | Diff adds no new source files; only constants, one test, three doc surfaces, generator-owned carriers, run artifacts                            |
| Constants used for finite vocabularies | `PASS` | Command contract lives in `README_QUICKSTART_EXPECTED_COMMANDS` and `QUICKSTART_DOCUMENTED_COMMANDS`; drift tests compare docs to those constants |

## Requirement coverage (owner contract)

| Requirement                                                                                      | Result | Evidence                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Exact command `deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>` | `PASS` | Byte-identical in `README.md:38`, `packages/cli/README.md:55`, `readme-quickstart.ts:21`, `quickstart-walk-suite.ts:21`; `docs/site/quickstart.vto:23` uses the same prefix with `{{ releaseSpecifier }}` in place of `@<version>` (template contract) |
| Flag immediately before the specifier in all five surfaces                                        | `PASS` | `git diff 3149d18e1..957cff9ff` on the five files: token order `--name netscript --minimum-dependency-age=0 jsr:@netscript/cli...` in each |
| Root README retains `# 1.` and adds a single-line explanation                                     | `PASS` | `README.md:37` `# 1. Install the NetScript CLI on your PATH` unchanged; `README.md:44` one line: "Deno 2.9 refuses packages published in the last 24 hours by default; `--minimum-dependency-age=0` lets a same-day release install." |
| Docs callout says command already handles same-day and keeps `-f` guidance                        | `PASS` | `quickstart.vto:29-30`: "the command above already overrides that policy. Add `-f` only to replace an existing global executable" plus the `-f` example line retained |
| Flag parsed from README text and passed verbatim; harness does not inject it                     | `PASS` | `readme-quickstart.ts` `parseReadmeQuickstartCommands` -> `readmeQuickstartArgv` is a whitespace split; `readme-command.ts` builds `argv` from `entry.command` and records `sourceCommand: entry.command`; `grep minimum` over `readme-command.ts` and `readme-quickstart-suite.ts` returns nothing |
| Test asserts flag exactly once in argv and exactly once in `sourceCommand`                         | `PASS` | `readme-command_test.ts:78-81` (argv filter length 1) and `:88-91` (`sourceCommand.split(flag).length - 1 === 1`); `EXPECTED_INSTALL_ARGV` includes the flag between `netscript` and the exact specifier |
| No workflow, publication, republish, shim, fallback, env workaround, or runtime behavior change   | `PASS` | `git diff --name-only 3149d18e1..957cff9ff -- deno.lock '**/deno.lock' .github/` is empty; no `packages/*/src` handwritten change; only `*.generated.ts` carriers changed |
| No lockfile change                                                                                 | `PASS` | same command as above, empty                                                                                                          |
| Derived carriers regenerated and fresh                                                             | `PASS` | `check:agent-docs-prose` exit 0 (`fresh:true`, `sourceCommit:86c71bc97`), `check:assets-barrel` exit 0, `check:publish-assets` exit 0, `check:mcp-export-corpus` exit 0; working tree unchanged after the generator-backed checks |

## Static Gates

| Gate             | Command or check                                                                                                              | Result | Evidence                                                              | Notes |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- | ----- |
| Narrow typecheck | recorded scoped E2E `run-deno-check.ts` (236 files, 2 batches)                                                                | `PASS` | worklog exit 0; evaluator relied on the focused tests type-checking at runtime (`deno test` performs type-check) | not independently re-run in full |
| Slice typecheck  | same                                                                                                                          | `PASS` | as above                                                              |       |
| Format           | `run-deno-fmt.ts --ext ts,tsx --file <3 handwritten TS>`                                                                       | `PASS` | independent rerun: 3 processed, 0 findings, exit 0                   |       |
| Lint             | `run-deno-lint.ts --ext ts,tsx --file <3 handwritten TS>`                                                                      | `PASS` | independent rerun: 3 processed, 0 occurrences, exit 0                |       |
| Doc lint         | `deno task docs:accuracy`                                                                                                     | `PASS` | independent rerun: PASS, 200 pages, 91/91 root/direct public commands, exit 0 |       |
| Doc links        | `deno task docs:links` (recorded)                                                                                             | `PASS` | worklog: 105 docs, 0 broken                                           | not re-run |
| README standard  | `deno task docs:readme:check` (recorded)                                                                                      | `N/A`  | exit 1 solely from untouched baseline `packages/bench/README.md`; not worsened by this diff | documented in `drift.md` |
| Publish dry-run  | n/a                                                                                                                           | `N/A`  | no publishable source change                                          |       |
| Link/path check  | five printed surfaces + two constants                                                                                         | `PASS` | see requirement table                                                 |       |

## Focused tests (independent rerun)

| Command                                                                                                                                                                              | Result | Evidence                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------- |
| `run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/readme-command_test.ts packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts packages/cli/e2e/tests/presentation/readme-quickstart-drift_test.ts` | `PASS` | exit 0, 3 passed, 0 failed, 772 ms |
| RED verification                                                                                                                                                                     | `PASS` | `a3f929c23` changes only expectations; the drift tests compare docs to the changed constants, so they necessarily fail against unchanged docs (worklog records exit 1, 7/3) | reasoning from diff; RED not re-executed |

The recorded GREEN count (10 passed) exceeds the 3 tests in these three files; the implementer's focused selection was evidently wider. Not a defect.

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                    | Violations |
| ---- | --------------------------------- | ------ | ----------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | `N/A`  | +9 lines in one test file                                   | 0          |
| F-2  | Helper-reinvention scan           | `N/A`  | no new helpers                                              | 0          |
| F-3  | Layering check                    | `N/A`  | no source layering change                                   | 0          |
| F-4  | Inheritance audit                 | `N/A`  |                                                             | 0          |
| F-5  | Public surface audit              | `PASS` | no TypeScript export change; public printed command changed deliberately per owner contract | 0 |
| F-6  | JSR publishability gate           | `N/A`  | no package source change                                    | 0          |
| F-7  | Doc-score gate                    | `PASS` | `docs:accuracy` exit 0                                      | 0          |
| F-8  | Workspace `lib` override check    | `N/A`  |                                                             | 0          |
| F-9  | Permission declaration check      | `N/A`  |                                                             | 0          |
| F-10 | Test-shape audit                  | `PASS` | assertions target the recording spawn seam and receipt; no runtime dependency | 0 |
| F-11 | Forbidden-folder lint             | `N/A`  |                                                             | 0          |
| F-12 | Naming-convention lint            | `N/A`  |                                                             | 0          |
| F-13 | Saga and runtime invariants       | `N/A`  |                                                             | 0          |
| F-14 | Console-log lint                  | `N/A`  |                                                             | 0          |
| F-15 | Re-export-of-upstream lint        | `N/A`  |                                                             | 0          |
| F-16 | Folder-cardinality lint           | `N/A`  |                                                             | 0          |
| F-17 | Abstract-derived co-location lint | `N/A`  |                                                             | 0          |
| F-18 | Sub-barrel lint                   | `N/A`  |                                                             | 0          |
| F-19 | Scoped source gate runners        | `PASS` | fmt/lint wrappers over the 3 handwritten files, exit 0      | 0          |

## Runtime Gates

| Gate                              | Validation                                                       | Result    | Evidence                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `readme.quickstart` listing       | `deno task e2e:cli gates readme.quickstart`                       | `PASS`    | exit 0; `01-install-cli` displays `README command 1/11: deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>` |
| `e2e-cli-prod` / runtime suites   | forbidden for this evaluation                                     | `NOT_RUN` | owner contract; production proof is deferred to the post-push `e2e-cli-prod` run                          |
| `check:aspire-version-parity`     | `deno task check:aspire-version-parity` at head                   | `FAIL`    | exit 1, `ok:false`, `counts.fail:1`, `manifestFresh:false`, finding `manifest:freshness` on the manifest path; all other findings are pre-existing `deferred`/`info` |

## Consumer Gates

| Consumer                    | Validation                                        | Result | Evidence                                                              |
| --------------------------- | ------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| CLI embedded agent docs     | `check:assets-barrel`, `check:agent-docs-prose`   | `PASS` | exit 0 each; provenance `sourceCommit` advanced to `86c71bc97`         |
| MCP embedded publish assets | `check:publish-assets`, `check:mcp-export-corpus` | `PASS` | exit 0 each                                                            |
| Docs site quickstart        | `docs:accuracy` rendered-output step               | `PASS` | 228 HTML files rendered OK inside `check:agent-docs-prose`            |

## Anti-Pattern Check

| AP    | Status  | Evidence                                                                 | Notes |
| ----- | ------- | ------------------------------------------------------------------------ | ----- |
| AP-18 | `CLEAR` | tests assert a deliberately public literal command contract              | per plan |
| AP-1..17, 19..25 | `N/A` | no framework source, plugin, or architecture change              |       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                    |
| --------------------- | ----- | ----------------------------------------------------------- |
| New entries           | 0     | `git diff --stat 3149d18e1..957cff9ff -- .llm/harness/debt/` empty |
| Resolved entries      | 0     | same                                                        |
| Deepened violations   | 0     | none introduced                                             |
| Unrecorded violations | 0     | none found                                                  |

## Findings

| ID  | Severity | Finding | Evidence | Required action |
| --- | -------- | ------- | -------- | --------------- |
| F-1 | high (blocking) | `check:aspire-version-parity` is red at head `957cff9ff`, while `worklog.md` records it as exit 0 with `manifestFresh:true`. The manifest committed in `957cff9ff` was generated before that same commit's worklog edit added the lines "Aspire version parity" and "No runtime suite, Aspire process, ..."; `worklog.md` therefore matches the generator's `git grep -il aspire` but has no manifest row. This gate runs in CI (`ci.yml:443`, `quality-aspire-version-parity`), so the PR would open red. | `git grep -il --extended-regexp aspire 957cff9ff -- <slice dir>` lists `context-pack.md`, `plan.md`, `supervisor.md`, `worklog.md`; manifest rows for the slice contain only the first three. `git show 957cff9ff -- worklog.md` shows the added Aspire lines. Independent `deno task check:aspire-version-parity` exit 1, `counts.fail:1`, only fail is `manifest:freshness`. Untracked files are not the cause: the generator uses `git grep`, which ignores untracked paths. | fix: rerun `.llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts` after `evaluate.md` (this file, which also mentions Aspire) is tracked, commit the manifest delta, rerun the parity check to exit 0, and correct the worklog gate row to cite the final green run. Mechanical; no implementation or docs change. |
| F-2 | low (informational) | Recorded focused GREEN count (10 passed) does not match the 3 tests in the three named contract/drift files; the implementer's selection was wider. | evaluator rerun: 3 passed in the three files | none; optional worklog clarification of the focused file set |
| F-3 | low (informational) | `docs/site/tutorials/storefront/01-scaffold.md:46` prints the `-f` short-flag variant with the age flag. Consistent with the contract and outside the five named surfaces. | grep at head | none |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Regenerate the Aspire surface manifest as the last step of the evidence commit | Any run artifact edited after manifest generation that mentions "aspire" (worklog gate tables do) re-stales the manifest; generate, then `git grep`-verify, then commit together | runs under `research-aspire-13.5-adoption--0.0.7` | high |

## Initial verdict (cycle 1, head `957cff9ff`, superseded below)

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` (historical; see Focused re-evaluation) |
| Rationale | The owner contract is fully met: exact command spelling and flag position on all five surfaces, root README `# 1.` retained plus one-line explanation, docs callout rewritten with `-f` retained, harness parses and passes the flag verbatim with no injection, once-only assertions on argv and `sourceCommand`, carriers regenerated and fresh, no workflow/lockfile/runtime change, focused tests and docs accuracy independently green. The single blocking defect is process evidence: the required `check:aspire-version-parity` gate (in the plan gate set and in CI) is red at head because the final commit's worklog edit post-dated manifest generation, and the worklog records a green result that is not true at head. The fix is one manifest regeneration and a corrected evidence row; no implementation change is required. Re-evaluation can be limited to confirming parity exit 0 at the new head. |

## Focused re-evaluation (cycle 2, repaired head `a074ba2a9f7da3c92432788a40631b3a9f7ba186`)

Evaluator: same Claude Fable 5.1 opposite-family session, 2026-09-03, read-only except this file.

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Repair commit is evidence-only | `PASS` | `git show --stat a074ba2a9`: parent `957cff9ff`; 6 files, all under `.llm/runs/research-aspire-13.5-adoption--0.0.7/` (manifest `+3` rows, `context-pack.md`, `evaluate.md`, `impl-eval-prompt.md`, `supervisor.md`, `worklog.md`). `git diff --name-only 957cff9ff..a074ba2a9` excluding `.llm/runs/` is empty: no product, test, README, docs, carrier, workflow, or lockfile change |
| Manifest covers every tracked Aspire-mentioning slice artifact | `PASS` | `diff` of `git grep -il aspire a074ba2a9 -- <slice dir>` against manifest rows for the slice: identical set (`context-pack.md`, `evaluate.md`, `impl-eval-prompt.md`, `plan.md`, `supervisor.md`, `worklog.md`) |
| `check:aspire-version-parity` at repaired head | `PASS` | independent rerun exit 0: `ok:true`, `manifestFresh:true`, counts `checked:945, fail:0, deferred:16, info:5, skipped:1, missing:0`, matching the recorded values |
| Worklog evidence corrected (F-1 required action) | `PASS` | `a074ba2a9` rewrites the Aspire parity gate row to cite the final green run and adds two Progress rows recording the `FAIL_FIX` and the repair ordering (artifacts tracked, then `rows=946 unmatched=0` regeneration) |
| Implementation evidence from cycle 1 still valid | `PASS` | no non-run-artifact file changed between `957cff9ff` and `a074ba2a9`, so every cycle-1 requirement, static, carrier, and test result carries over unchanged |
| Working tree | note | one uncommitted delta: `impl-eval-prompt.md` (+12 lines, the focused re-evaluation brief). The path is already a manifest row, so its content does not affect parity; commit it with this file |

F-1 is resolved. F-2 and F-3 remain informational and non-blocking.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The owner contract was fully met at `957cff9ff` and is untouched by the repair. The only blocking finding, stale Aspire surface manifest evidence, is fixed by an evidence-only commit whose parity gate now independently exits 0 with a fresh manifest and zero failures, and whose worklog row cites that final run. No unresolved blocking findings remain. Runtime proof of the same-day install is deliberately deferred to the post-push `e2e-cli-prod` run per the owner contract. |
