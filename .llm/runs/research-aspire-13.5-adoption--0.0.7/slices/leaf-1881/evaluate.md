# Evaluation: root README Quickstart clean-runner walk (leaf #1881, PR #1965)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881`                                 |
| Target         | `packages/cli/e2e` (`readme.quickstart` suite), root `README.md`, `.github/workflows/e2e-cli-prod.yml` |
| Archetype      | `6 - CLI / Tooling` (nested E2E gate workspace, not an independently published unit)    |
| Scope overlays | docs                                                                                    |
| Evaluator      | Claude · Anthropic · Fable 5.1 · medium · fresh native opposite-family session · 2026-09-03 |
| Generator      | Codex · OpenAI · GPT-5.6 Sol · medium (per `supervisor.md`)                              |
| Baseline       | `79adb103be568260e51b0eb3ba9fae281a5fe1f0` (`origin/main`)                               |
| Evaluated state | commits `75c41ee15` (S0) + `7729b9aa0` (S1/S2) + uncommitted S3 workflow diff + untracked `impl-eval-prompt.md`, `review-s3-prompt.md` |
| Route          | `formal_impl_evaluation` = Claude Fable 5 medium, as recorded in `supervisor.md`; no override |

Evaluation boundary as instructed by the coordinator: this is an **implementation-completeness**
verdict. No runtime suite (`scaffold.runtime`, `quickstart.walk`, `readme.quickstart`) was run, no
AppHost was started, and no GitHub state was changed. Canary/stable admission and merge
authorization are outside this evaluation.

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | `worklog.md` § Plan-Gate records `PLAN-EVAL: N/A` with justification (coordinator-supplied baseline, contract, substitutions, gates, ordering) before slice 1; `plan.md` § Open-Decision Sweep shows no unresolved design decision. PR body and the S0 PHASE: PLAN comment repeat it. |
| Design section exists in worklog       | `PASS` | `worklog.md` § Design: public surface, domain vocabulary, ports, constants, commit slices, deferred scope, contributor path, Archetype-6 spine/axes statement. |
| Commit slices match design plan        | `PASS` | Design lists S0–S3. PR commits: `75c41ee15` (S0, artifacts only), `7729b9aa0` (S1+S2 combined, 15 files). S3 is the uncommitted workflow diff by explicit coordinator design (D5, "isolated final commit"). S1/S2 were merged into one commit with a recorded rationale (`context-pack.md`: the `gates readme.quickstart` pre-push requirement needs both). Order matches. |
| Each slice has a passing gate          | `PASS` | S0/S1/S2 evidence in PR comments (check 229, tests 314/314, fmt 229, suites/gates, carrier, quality) independently reproduced below. S3: YAML parse OK, step order verified, full static set re-run on the S3 tree. |
| No speculative seams (unused files)    | `PASS` | `readme-quickstart.ts` ← `readme-command.ts`, suite, 2 tests. `readme-command.ts` ← suite command factory + `import.meta.main`. `readme-quickstart-suite.ts` ← `registry.ts` + suite test. `runAspireCommand` export ← `readme-command.ts`. No orphan file. |
| Constants used for finite vocabularies | `PASS` | Suite id/title in `QUICKSTART`/`QUICKSTART_TITLE`; 11 gate ids in `GATE.README_QUICKSTART_*`; phases from `GATE_PHASE`; command contract in `README_QUICKSTART_EXPECTED_COMMANDS`; `PACKAGE_SOURCE.JSR`. `'users'`, `jsr:@netscript/cli@` and timeouts are file-local `const`s. |
| `## SKILL` chapter on agent briefs     | `PASS` | All five briefs in the run dir open with `use harness` and carry `## SKILL`: `review-s1-s2-prompt.md`, `review-s1-s2-recheck-prompt.md`, `review-s1-s2-final-prompt.md`, `review-s3-prompt.md`, `impl-eval-prompt.md` (plus `impl-eval-recheck-prompt.md`). The two continuation prompts were corrected by the supervisor after the first pass; verified by direct file inspection on recheck. |
| Slice review gate (A1) honored         | `PASS` | Opposite-family Claude Fable 5.1 low review recorded in `worklog.md` (CHANGES_REQUIRED → PASS → narrow recheck PASS) and in the PHASE: IMPL comment; sign-off commit is the Codex supervisor's. Generator ≠ evaluator: this session is a fresh Claude session. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | `PASS` | 229 files, 2 batches, 0 diagnostics, exit 0 | Independently re-run on the S3 tree. |
| Slice typecheck  | same wrapper (covers all 9 new/changed `.ts` files) | `PASS` | as above | No separate narrower scope exists for the nested E2E workspace. |
| Tests            | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests` | `PASS` | 314 passed, 0 failed, 0 ignored, exit 0 | Focused re-run of the 3 new test files: 12 passed. Matches worklog 314/314. |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx` | `PASS` | 229/229 processed, 0 findings, 0 refusals | |
| Lint (findings)  | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx` | `PASS` | `totalOccurrences: 0`, `uniqueRules: 0`, `uniquePaths: 0`; 222 of 229 files processed clean | All nine slice files are in the processed set. |
| Lint (wrapper coverage) | same command | `FAIL` (pre-existing baseline refusal) | exit 2; `processed-count-unavailable`; batch 2 (7 files, all `packages/cli/e2e/fixtures/desktop-native/**`) fails with `Package 'zod' not found in catalog` because the fixture's own `deno.json` is not a workspace member | Verified, not concealed. None of the seven files is touched by this diff; `drift.md` records it (significant, defer). Not a lint finding and not attributable to the slice. |
| Doc lint         | `deno doc --lint` | `N/A` | no published surface, `mod.ts`, or `deno.json` export changed | `research.md` jsr-audit scan: N/A, confirmed by diff stat. |
| Publish dry-run  | `deno task publish:dry-run` | `N/A` | no publish surface changed | |
| Link/path check  | README links, e2e README table row, workflow artifact paths | `PASS` | README prose links unchanged; `packages/cli/e2e/README.md` gains `quickstart.walk` + `readme.quickstart` rows; workflow paths `.llm/tmp/readme-quickstart/{state.json,receipts/*.json}` match `readmeWalkerCommand` state path and `writeReceipt`; `.llm/tmp` is git-ignored (`git check-ignore`). | |
| Workflow YAML    | `deno eval` parse via pinned `jsr:@std/yaml@1` | `PASS` | `YAML_PARSE_OK`; step order `… → Quickstart walk E2E → Root README Quickstart E2E → Report production E2E failure → Upload production E2E artifacts` | README step condition mirrors the walk step (`always() && install_published_cli && install_workspace_dependencies`); uses `--source jsr --cli jsr:@netscript/cli@${{ steps.version.outputs.version }} --cleanup --report … --log-file …`; report joins the failure loop and upload list. |
| Carrier check    | `deno task check:agent-docs-prose` | `PASS` | `"fresh": true, "stalePaths": []`, exit 0 | Root README marker edit moves no generated carrier. |
| Quality gate     | `deno task quality:gate` (`quality:scan` + `arch:check`) | `PASS` | exit 0; `Doctrine readiness — cli: FAIL=0` | Only pre-existing WARN/INFO lines; no `any`, `as unknown as`, or `deno-lint-ignore` in the three new source files (grep count 0 each). |
| CLI surface      | `deno task e2e:cli suites` / `deno task e2e:cli gates readme.quickstart` | `PASS` | `readme.quickstart  Root README Quickstart walk` listed; 11 `readme.quickstart.NN-*` gates in README order + `cleanup.aspire-stop`, printed without starting any resource | Gate titles embed the exact printed command; phases preflight/scaffold/runtime/database/behavior/cleanup. |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | New files 344 / 135 / 115 LOC; `runtime-gates.ts` untouched (336 LOC on this baseline). Largest new file is an application IO-edge script under the 350 adapter bound and the 500 hard cap. | none |
| F-2  | Helper-reinvention scan      | `PASS` | Reuses `@std/path`, `runAspireCommand`, `resolveResourceUrlsFromAppHost`, `commandGate`, `createCleanupGates`, `defaultRunOptions`. `tail`/`errorMessage`/`isRecord` are 1–3 line file-local guards, not platform renames. | none |
| F-3  | Layering check               | `PASS` | `src/domain/readme-quickstart.ts` has zero `Deno.*`/`console.*`/`fetch` references (grep 0). All process/filesystem IO lives in `application/gates/quickstart/readme-command.ts` and existing edges. Suite composition imports domain + application only. | none |
| F-4  | Inheritance audit            | `N/A` | no classes added | |
| F-5  | Public surface audit         | `N/A` | no `mod.ts`/export-map change | |
| F-6  | JSR publishability gate      | `N/A` | nested E2E workspace is not published | |
| F-7  | Doc-score gate               | `N/A` | as above; every new exported symbol still carries a JSDoc one-liner | |
| F-8  | Workspace `lib` override check | `N/A` | no `deno.json` change | |
| F-9  | Permission declaration check | `PASS` | Child spawn declares `--allow-read --allow-write --allow-run` explicitly; cleanup keeps its own `--allow-run=aspire,docker` catalog entry. | none |
| F-10 | Test-shape audit             | `PASS` | Tests assert ordered command/line tuples, fail-closed errors by message, gate-id sequence, argv positions, retry `undefined`, and a live README drift pin — no giant snapshots. | none |
| F-11 | Forbidden-folder lint        | `PASS` | no `utils/helpers/common/lib/interfaces` folder introduced | none |
| F-12 | Naming-convention lint       | `PASS` | `readme-quickstart.ts`, `readme-command.ts`, `readme-quickstart-suite.ts`, `*_test.ts` follow sibling conventions (`aspire-walk.ts`, `quickstart-walk-suite.ts`). | none |
| F-13 | Saga and runtime invariants  | `N/A` | | |
| F-14 | Console-log lint             | `PASS` | `console.info/error` only in the `import.meta.main` process-edge script, matching the existing `aspire-walk.ts` pattern for child receipt emission; none in domain or suite files. | none |
| F-15 | Re-export-of-upstream lint   | `PASS` | no upstream re-export; `runAspireCommand` is a local function made exported | none |
| F-16 | Folder-cardinality lint      | `PASS` | `gates/quickstart`: 4 children; `suites/quickstart`: 2; `src/domain`: 10. The over-cap `gates/scaffold` directory (55) and `runtime-gates.ts` are **not** touched by this diff (diff stat confirms). | none new |
| F-17 | Abstract-derived co-location lint | `N/A` | no abstracts | |
| F-18 | Sub-barrel lint              | `PASS` | no new `mod.ts`/`index.ts` | none |
| F-19 | Scoped source gate runners   | `PASS` | check/test/fmt/lint wrappers run at `--root packages/cli/e2e --ext ts,tsx` (results above). | none |
| F-CLI-1…31 | Archetype-6 specific   | `PENDING_SCRIPT` | No dedicated script; manual evidence: no `Deno.exit` (uses `Deno.exitCode` like `aspire-walk.ts`), no `interface I*`, no `@cliffy` import, no `.template`, no ≥20-line backtick literal; `arch:check` (`deno task quality:gate`) exit 0. | none |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| `readme.quickstart` (hosted, published CLI, `--cleanup`) | Executes 11 README commands once each in order on the GitHub-hosted clean Ubuntu runner, then exact-AppHost ownership-proving cleanup | `NOT_RUN` (deferred by plan) | `plan.md` Validation Plan row 5: "Deferred, never run locally"; `plan.md` Non-Scope excludes local runtime execution; coordinator brief reserves runtime proof for the next canary. Workflow wiring is statically verified (YAML row above). |
| `scaffold.runtime` / `quickstart.walk` | unchanged sibling suites | `NOT_RUN` | Not in scope; their gates and `createCleanupGates()` are unchanged by this diff. |
| Aspire 13.5.3 semantics (static assessment, no AppHost started) | `aspire wait postgres --status healthy --timeout 60` is valid 13.5.3 syntax; exit 0/7/17/18 semantics per `.agents/skills/aspire` §4; `aspire start` detaches and returns (skill: restart-by-`start`, detached-AppHost notes); local `aspire --version` = 13.5.3 | `PASS` (static) | Child bound 65 s for `wait` (> 60 s CLI timeout) + 5 s wrapper grace; 180 s for `restore`/`start`; no retry policy on any of the 11 gates (`gate.retry === undefined` asserted by test). `wait` without `--apphost` resolves from cwd `my-app/aspire`, which is the single AppHost on a clean runner. Port evidence uses explicit `aspire describe --apphost <exact> --format Json --non-interactive --nologo`. |
| Clean-runner path safety (static) | README `netscript init my-app --yes` must not collide with earlier steps in the same job | `PASS` (static) | `quickstart.walk` scaffolds `context.project.projectName` (timestamped default) with `--force`; the earlier init smoke uses `cli-prod-init-smoke`; `readme.quickstart` pins `projectName: 'my-app'` under the same `smokeRoot`, so `projectRoot`/`appHost` handed to cleanup are exactly `my-app/aspire/apphost.mts`. `init` skips prompts when `--yes` or stdin is not a TTY (`init-interactive.ts:24`). |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| E2E CLI registry | `deno task e2e:cli suites` | `PASS` | `readme.quickstart` registered via `QUICKSTART.README`; `suite-registry_test.ts` updated for id list, deferred-gate map, and resolved options. |
| E2E CLI gate listing | `deno task e2e:cli gates readme.quickstart` | `PASS` | 11 command gates + cleanup, exact README text, no resource started. |
| Root README drift pin | `readme-quickstart-drift_test.ts` | `PASS` | Parses the live root README markers and equals `README_QUICKSTART_EXPECTED_COMMANDS` (11 commands). |
| `e2e-cli-prod.yml` | YAML parse + step/condition/path review | `PASS` | See Static Gates. Existing `scaffold.runtime` and `quickstart.walk` steps, failure reporting, and uploads are unchanged except for the added report/artifact entries. |
| Docs carrier chain | `check:agent-docs-prose` | `PASS` | fresh, no stale paths. |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `CLEAR` | max new file 344 LOC; no monolith grown | |
| AP-2  | `CLEAR` | no platform-primitive renames; `@std/path` used directly | |
| AP-3  | `N/A` | | |
| AP-4  | `N/A` | | |
| AP-5  | `N/A` | | |
| AP-6  | `N/A` | | |
| AP-7  | `N/A` | | |
| AP-8  | `N/A` | | |
| AP-9  | `CLEAR` | parser/substitution/argv/port helpers each have a concrete consumer and test | |
| AP-10 | `CLEAR` | `try/catch` only at the process edge to convert spawn/describe/read failures into receipts or line-named errors; no swallowed failures (each returns non-zero or throws) | |
| AP-11 | `CLEAR` | no hidden globals; state is an explicit JSON receipt at a path passed in argv | |
| AP-12 | `CLEAR` | `setTimeout` only inside the reused `runAspireCommand` abort bound; `performance.now()` for receipt duration at the edge, not in domain | |
| AP-13 | `N/A` | gate code is not published; console use is the edge script's receipt channel (matches `aspire-walk.ts`) | |
| AP-14 | `CLEAR` | no upstream re-export | |
| AP-15 | `CLEAR` | no `I*`/`*T` type names | |
| AP-16 | `CLEAR` | no forbidden folders | |
| AP-17 | `CLEAR` | no `interfaces/` folder | |
| AP-18 | `CLEAR` | semantic assertions, README drift pinned by ordered command list not a text snapshot | |
| AP-19 | `CLEAR` | spawn permissions explicit; cleanup catalog entry unchanged | |
| AP-20 | `N/A` | | |
| AP-21 | `CLEAR` | new files placed beside the existing quickstart suite/gate; scaffold gate folder not grown | |
| AP-22 | `CLEAR` | no barrel | |
| AP-23 | `N/A` | no CLI composition change | |
| AP-24 | `CLEAR` | suite registered through the existing `builtInSuites` registry; no switch over ids | |
| AP-25 | `CLEAR` | side effects confined to `readme-command.ts` (edge) and reused edges; domain file is pure | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `arch-debt.md` unchanged in diff; no new violation introduced (F-1/F-16 above). |
| Resolved entries      | 0     | none claimed. |
| Deepened violations   | 0     | `scaffold-runtime-a8-f16-1333` entry's files (`runtime-gates.ts`, `gates/scaffold/`) are untouched; `createCleanupGates()` is consumed, not edited. |
| Unrecorded violations | 0     | `quality:gate` cli root FAIL=0; grep for `any`/`as unknown as`/`deno-lint-ignore` in new files = 0. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| `low` | PR #1965 body still shows S1 and S2 slice boxes unchecked although `7729b9aa0` landed them (the PHASE: IMPL comment reports them as landed). | PR body "## Slices" vs commit list and comment trail. | Tick S1/S2 (and S3 once committed) in the body update that accompanies the isolated workflow commit. Non-blocking; the comment trail is complete. |
| `resolved` | Two follow-up reviewer prompts (`review-s1-s2-recheck-prompt.md`, `review-s1-s2-final-prompt.md`) originally lacked `use harness` and a `## SKILL` chapter. | Protocol rule 13; both files now carry both (uncommitted supervisor edit, inspected on recheck). | None remaining. Include the corrected prompt files in the isolated S3 commit. |
| `low` | The new workflow step omits `--format pretty`, which the two sibling suite steps pass, so the job log for this suite will be the default reporter while the JSON report/NDJSON are still captured. | `e2e-cli-prod.yml` README step vs walk step. | Optional cosmetic alignment in the S3 commit; the coordinator's S3 contract did not require the flag. |
| `info` | The exact scoped lint command exits 2 on seven unchanged `fixtures/desktop-native` files (`Package 'zod' not found in catalog`) with zero lint occurrences. | Reproduced this session; identical at baseline per `drift.md`. | None for this slice. Owner of the desktop-native fixture config should make the fixture lintable or exclude it from the scoped root; tracked as recorded drift, not debt. |
| `info` | README fidelity intentionally exposes the fresh-publication dependency-age policy and non-TTY Aspire behaviour to the hosted verdict (no `--minimum-dependency-age=0`, no `--non-interactive`). | `drift.md` entry 3; `README_QUICKSTART_EXPECTED_COMMANDS`. | None. This is the purpose of gate 3: a failure names the README line and drives a README/product fix. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Document-as-contract suites should parse marker-bounded fences and pin an ordered command constant, then execute one gate per line with the line number in the failure. | Pure parser in `domain/`, IO-edge script with a JSON state receipt, suite composition maps a constant tuple to `GATE.*` ids. | Archetype 6 (E2E/doc-walk gates), docs overlay | medium |
| A scoped lint wrapper "coverage refusal" with zero occurrences must be reported as a tooling gap on named files, not folded into PASS or FAIL. | Split lint into findings vs. coverage rows; name the unverified files. | all archetypes using `.llm/tools/run-deno-lint.ts` | high |

## Close-Gate State (rule 12, recorded, not evaluated as merge authorization)

- PR #1965: `OPEN`, `isDraft: true`, labels include `status:impl`, milestone `0.0.7`, base `main`, body carries `Closes #1881` and `Part of #863`.
- Issue #1881: `OPEN`, `status:impl`; all four acceptance boxes unchecked, including the hosted transcript box, which **must remain unticked** until the hosted `readme.quickstart` run at the next canary produces the transcript, receipts, and cleanup proof.
- PR Definition of Done: all four boxes unchecked; the "Separate-session IMPL-EVAL PASS is recorded" box may be mirrored from this artifact by the supervisor; the hosted transcript box may not.
- Consequence: **the PR is not ready to merge.** `Closes #1881` may only take effect after hosted evidence completes the close-gate; the PR must stay draft with `status:impl` until then. This evaluation neither authorizes `status:ready-merge` nor canary/stable admission.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The approved scope is complete against `plan.md` (markers + executable readiness, pure line-aware parser with fail-closed tests, `readme.quickstart` with one no-retry receipt gate per printed command, only `<version>`/`<port>` substitutions with receipt-backed port evidence, unchanged `createCleanupGates()`, e2e README row, isolated S3 workflow wiring with report/failure-summary/artifact entries). All required static, fitness, and consumer gates were independently re-run and pass; the one lint wrapper exit is a verified pre-existing coverage refusal on seven untouched fixture files with zero findings, recorded in `drift.md`. Runtime gates are `NOT_RUN` by explicit plan and coordinator boundary, not missing evidence. No doctrine violation is introduced or deepened and no debt bookkeeping is required. Findings are low/informational; the SKILL-chapter finding was resolved on recheck. **This PASS is implementation completeness only: PR #1965 remains draft/`status:impl` and is not ready to merge until the hosted `readme.quickstart` transcript at the next canary completes issue #1881's close-gate.** |

## Recheck 1 (same session, 2026-09-03)

- Trigger: supervisor added `use harness` and `## SKILL` chapters to `review-s1-s2-recheck-prompt.md` and `review-s1-s2-final-prompt.md`.
- Verified by reading both files; `git status` shows them as modified, uncommitted run artifacts.
- No implementation, workflow, or docs file changed since the first pass; no gate was re-run and no runtime suite was run.
- PR slice-box finding retained by design: boxes are updated only after the S3 commit is pushed.
- Close-gate boundary unchanged: PR #1965 stays draft/`status:impl`; hosted transcript box stays unticked; not ready to merge until hosted evidence completes the close-gate.
- Verdict after recheck: `PASS` (unchanged).
