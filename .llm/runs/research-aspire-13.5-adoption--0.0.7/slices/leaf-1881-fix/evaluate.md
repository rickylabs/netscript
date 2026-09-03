# Evaluation: readme.quickstart install-root isolation (PR #1975 / #1881)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix`                                             |
| Target         | `packages/cli/e2e` README Quickstart gate code (`readme-command.ts`, `aspire-walk.ts`, walker launcher)  |
| Archetype      | `6 - CLI / Tooling` (nested E2E gate workspace; product `src/` untouched)                               |
| Scope overlays | `none`                                                                                                  |
| Evaluator      | Claude Fable 5.1 (`claude-fable-5-1`), fresh native opposite-family session, 2026-09-03T02:23Z          |
| Evaluated head | `0650f6f7bda0f9241424cce9882b405f4e6b6d55` on `fix/aspire-1881-readme-install-isolation`; base `45e57377f` |
| Route          | `formal_impl_evaluation` local default per `lane-policy.md` (Fable evaluates Codex-authored work)       |

Evaluator constraints honored: read-only inspection plus owner-scoped static/unit/listing commands
only. `readme.quickstart`, `quickstart.walk`, `scaffold.runtime`, Aspire, and Docker were NOT_RUN.
No source, test, run-artifact, GitHub, or git mutation; this file is the sole write. A scratch
export of the RED commit under `.llm/tmp/` (git-ignored) was used to reproduce RED and was removed.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                                                   |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` recorded in `worklog.md` § Plan Gate and `supervisor.md` before RED commit `b1aafaaa6`; qualifies under the owner decision (2026-08-08) small/mechanical exception: contract, red, scope, gates, and assertions were owner-locked (plan D1–D6). |
| Design section exists in worklog       | `PASS` | `worklog.md` § Design: public surface, vocabulary, ports, constants, Archetype 6 checkpoint applicability, commit slices, deferred scope, contributor path.                                                                 |
| Commit slices match design plan        | `PASS` | Two commits in design order: `b1aafaaa6` RED (seam + failing test), `0650f6f7b` GREEN (env/state/receipt/launcher). Slice 3 is run artifacts + this evaluation. `git log 45e57377f..0650f6f7b` shows exactly these two.   |
| Each slice has a passing gate          | `PASS` | RED gate independently reproduced by this evaluator (see Fitness); GREEN gates independently re-run at head (see Static/Fitness). PR phase comments carry both slices with hashes and evidence.                              |
| No speculative seams (unused files)    | `PASS` | Only one new file (`tests/application/readme-command_test.ts`), exercised by the test runner. The `spawn` seam has a real default (`runAspireCommand`) and a test consumer. `AspireCommandRunner.env` is consumed by `readme-command.ts`. |
| Constants used for finite vocabularies | `PASS` | `DENO_INSTALL_DIRECTORY = '.deno-install'`; PATH separator from `@std/path` `DELIMITER` (no local platform branch).                                                                                                          |

## Static Gates

| Gate             | Command or check                                                                                                         | Result | Evidence                                                                                          | Notes                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`                    | `PASS` | exit 0; 234 files, 2 batches, 0 failed batches, 0 findings                                        | Re-run by evaluator at head.                     |
| Slice typecheck  | covered by the scoped root check above (all five changed TS files are inside `packages/cli/e2e`)                         | `PASS` | same run                                                                                          |                                                  |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`                      | `PASS` | exit 0; 234 files processed, 0 findings, 0 refusals                                               |                                                  |
| Lint             | `run-deno-lint.ts --file <5 changed TS files> --ext ts,tsx`                                                               | `PASS` | exit 0; 5 files processed, 0 findings                                                             |                                                  |
| Doc lint         | `deno doc --lint` on a published `mod.ts`                                                                                | `N/A`  | no published surface, exports, or JSDoc contract changed; nested E2E workspace only              |                                                  |
| Publish dry-run  | `deno task publish:dry-run`                                                                                              | `N/A`  | no `packages/*/src`, `deno.json` export, or lockfile change (`git diff --name-only` confirms)     |                                                  |
| Link/path check  | `git diff --check 45e57377f..0650f6f7b`; changed-file list                                                               | `PASS` | exit 0, no whitespace errors; 5 TS files + 6 run-dir files; no README/.github/deno.lock/plugin change |                                                  |

## Fitness Gates

| Gate      | Function                          | Result           | Evidence                                                                                                                                                                              | Violations |
| --------- | --------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1       | File-size lint                    | `PASS`           | `readme-command.ts` 380 LOC, `aspire-walk.ts` 145 LOC, test 87 LOC; `check-doctrine.ts --root packages/cli/e2e` reports F-1 warnings only on untouched scaffold files                | none new   |
| F-2       | Helper-reinvention scan           | `PASS`           | uses `@std/path` `DELIMITER`/`resolve`, `Deno.Command` `env`, `Deno.errors.NotFound`; no local PATH-join or platform helper                                                             | none       |
| F-3       | Layering check                    | `PASS`           | change confined to the existing `application/gates/quickstart` command edge and its `suites/` launcher; no new cross-layer import                                                       | none       |
| F-4       | Inheritance audit                 | `N/A`            | no classes touched                                                                                                                                                                    |            |
| F-5       | Public surface audit              | `PASS`           | no `mod.ts`/export change; `AspireCommandRunner` gains an optional trailing parameter (backward-compatible)                                                                             | none       |
| F-6       | JSR publishability gate           | `N/A`            | non-published nested workspace                                                                                                                                                        |            |
| F-7       | Doc-score gate                    | `N/A`            | no published docs surface                                                                                                                                                             |            |
| F-8       | Workspace `lib` override check    | `N/A`            | no `deno.json` change                                                                                                                                                                 |            |
| F-9       | Permission declaration check      | `PASS`           | walker launcher adds exactly `--allow-env=PATH`; presentation test asserts every walker command carries it; evaluator confirmed `NotCapable: Requires env access to "PATH"` when omitted | none       |
| F-10      | Test-shape audit                  | `PASS`           | semantic assertions on argv, env, persisted state, receipt, and stale-root removal via a recording fake; no snapshot, no real subprocess                                                | none       |
| F-11      | Forbidden-folder lint             | `PASS`           | no new directories                                                                                                                                                                    | none       |
| F-12      | Naming-convention lint            | `PASS`           | `readme-command_test.ts` mirrors `readme-command.ts`; `check-doctrine` raised no naming finding                                                                                        | none       |
| F-13      | Saga and runtime invariants       | `N/A`            |                                                                                                                                                                                       |            |
| F-14      | Console-log lint                  | `PASS`           | no new `console.*`                                                                                                                                                                    | none       |
| F-15      | Re-export-of-upstream lint        | `PASS`           | none added                                                                                                                                                                            | none       |
| F-16      | Folder-cardinality lint           | `PASS`           | `gates/quickstart` 4 children, `tests/application` 5 children; pre-existing over-cap scaffold dirs untouched (existing debt `scaffold-runtime-a8-f16-1333` not deepened)               | none new   |
| F-17      | Abstract-derived co-location lint | `N/A`            |                                                                                                                                                                                       |            |
| F-18      | Sub-barrel lint                   | `PASS`           | no barrel added                                                                                                                                                                       | none       |
| F-19      | Scoped source gate runners        | `PASS`           | check/fmt/lint wrappers above; `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/cli/e2e` exit 0, FAIL=0, WARN=14 all on untouched files          | none new   |
| F-CLI-*   | Archetype-6 specific gates        | `PENDING_SCRIPT` | no dedicated script (S9). Structural evidence: no `packages/cli/src` change, no command/composition/registry/kernel change; nested E2E gate only. Backed by `check-doctrine.ts` above. | none       |
| RED gate  | focused test fails without env    | `PASS`           | evaluator exported commit `b1aafaaa6` to a scratch dir and ran the focused test: exit 1, `not ok 1`, `Actual undefined / Expected "<tmp>/run/.deno-install"` — matches recorded RED   |            |
| GREEN gate| focused tests under narrow perms  | `PASS`           | `run-deno-test.ts -- --allow-read --allow-write --allow-env=PATH tests/application/readme-command_test.ts tests/presentation/readme-quickstart-suite_test.ts`: exit 0, 5 passed / 0 failed |            |
| Nested    | full `packages/cli/e2e/tests`     | `PASS`           | `run-deno-test.ts -- --allow-all packages/cli/e2e/tests`: exit 0, 327 passed / 0 failed / 0 ignored                                                                                    |            |

## Runtime Gates

| Gate                | Validation                                                     | Result    | Evidence                                                                                                                                       |
| ------------------- | -------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `readme.quickstart` | hosted Canary 9 walk                                           | `NOT_RUN` | forbidden by owner for this leaf; hosted `e2e-cli-prod` rerun from `main` with `published-version=0.0.7-canary.9` is the deferred proof that closes #1881 |
| `quickstart.walk`   | bounded Aspire walk                                            | `NOT_RUN` | forbidden; behavior preserved by construction (see Consumer Gates)                                                                              |
| `scaffold.runtime`  | merge-readiness runtime suite                                  | `NOT_RUN` | forbidden; no scaffold output, plugin, DB wiring, or Aspire helper generation changed                                                            |
| gate listing        | `deno task e2e:cli gates readme.quickstart`                    | `PASS`    | exit 0; 11 ordered README gates + `cleanup.aspire-stop`; command 1 listed verbatim as `deno install --global --allow-all --name netscript jsr:@netscript/cli@<version>` (no `-f`) |

## Consumer Gates

| Consumer                         | Validation                                                                                                    | Result | Evidence                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quickstart.walk` (3-arg runner) | existing callers unchanged                                                                                     | `PASS` | `aspire-walk.ts:86` `await run(command, cwd, timeoutMs)` is the only internal call; no env passed; `runBoundedAspireWalk` signature untouched. `runAspireCommand` passes `env` (undefined) through `Deno.Command`, which inherits the parent env when undefined. |
| README walker child (`import.meta.main`) | launcher argv contract                                                                                  | `PASS` | `readme-quickstart-suite.ts` passes 7 positional args unchanged; `runRoot` is the run-owned `smokeRoot`; state at `.llm/tmp/readme-quickstart/state.json`; only `--allow-env=PATH` added      |
| Receipt consumers                | `environment: { denoInstallRoot, pathPrepend }` present and frozen                                             | `PASS` | `readme-command.ts` receipt construction; focused test asserts `receipt.environment` deep-equals `{ denoInstallRoot, pathPrepend }` from `receipts/01.json`                                    |

## Acceptance-point verification (owner brief)

| Point                                                                                     | Result | Evidence                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Index 0 removes only `<runRoot>/.deno-install`, tolerates only `NotFound`, then recreates | `PASS` | `initializeState`: `Deno.remove(resolve(runRoot, DENO_INSTALL_DIRECTORY), { recursive: true })` in a `try` that rethrows unless `Deno.errors.NotFound`, then `Deno.mkdir(..., { recursive: true })`. Test seeds a stale `bin/netscript` and asserts `Deno.stat` rejects `NotFound` after index 0. Nothing outside the owned root is touched. |
| State persists `denoInstallRoot`; index >= 1 consumes persisted value                     | `PASS` | `ReadmeWalkState.denoInstallRoot` written by `writeState`; `readState` validates `typeof parsed.denoInstallRoot === 'string'` (else "malformed prior run receipt"). Test runs index 1 with a *different* `runRoot` and asserts `spawns[1].env` equals `spawns[0].env`. |
| Every spawned README command receives `DENO_INSTALL_ROOT` and `<root>/bin` + delimiter + ambient PATH | `PASS` | `readmeCommandEnvironment` builds `{ DENO_INSTALL_ROOT, PATH: \`${pathPrepend}${DELIMITER}${Deno.env.get('PATH') ?? ''}\` }` once per invocation and `runCommand` passes it to every non-`cd` spawn. Test asserts `PATH.startsWith(\`${pathPrepend}${DELIMITER}\`)`. |
| Launcher permission is narrowly `--allow-env=PATH`                                        | `PASS` | one-line launcher diff; presentation test asserts all 11 commands include it; evaluator ran the focused test without it and observed `NotCapable ... "PATH"` at `readme-command.ts:199`. |
| Install argv byte-identical after version substitution, no `-f`                           | `PASS` | argv path (`substituteReadmeQuickstartCommand` → `readmeQuickstartArgv`) unchanged in the diff; test asserts exact 7-element argv and `includes('-f') === false`; gate listing shows the verbatim command. |
| Receipts contain `environment: { denoInstallRoot, pathPrepend }`                          | `PASS` | `ReadmeCommandReceipt.environment` typed and `Object.freeze`d; test deep-equals the written `01.json`.                                                                                                       |
| `runAspireCommand(..., env?)` merges through `Deno.Command`; 3-arg `quickstart.walk` unchanged | `PASS` | `env` is passed as the `Deno.Command` `env` option (undefined ⇒ inherit); the sole walk-side call remains three-argument.                                                                                  |
| No README/workflow/cleanup/product/plugin/lockfile change; no runtime gate execution      | `PASS` | `git diff --name-only 45e57377f..0650f6f7b` = 5 files under `packages/cli/e2e` + 6 under the run dir; `README.md`, `.github/`, `deno.lock`, `packages/cli/src`, `plugins/` = 0 changes. Worklog, PR body, and both phase comments state runtime suites NOT_RUN; evaluator ran none. |

## Anti-Pattern Check

Only `CLEAR` where the run scope touched or could affect the pattern.

| AP    | Status  | Evidence                                                                   | Notes                                                              |
| ----- | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| AP-1  | `CLEAR` | touched files 380 / 145 LOC; no file crosses 500                           | pre-existing over-cap files in scaffold dirs are untouched         |
| AP-2  | `CLEAR` | no upstream helper reinvented (`DELIMITER`, `Deno.Command.env`)            |                                                                    |
| AP-3  | `N/A`   |                                                                            |                                                                    |
| AP-4  | `N/A`   |                                                                            |                                                                    |
| AP-5  | `CLEAR` | optional trailing params keep both public functions backward-compatible    |                                                                    |
| AP-6  | `N/A`   | no base classes                                                            |                                                                    |
| AP-7  | `CLEAR` | seam is a function parameter with a real default, not a test-mode branch  |                                                                    |
| AP-8  | `CLEAR` | no new module-level state; state is persisted JSON as before               |                                                                    |
| AP-9  | `CLEAR` | errors thrown/returned with line-aware messages; only `NotFound` swallowed |                                                                    |
| AP-10 | `N/A`   |                                                                            |                                                                    |
| AP-11 | `CLEAR` | no `any`; state parsed with runtime type guards                            |                                                                    |
| AP-12 | `N/A`   |                                                                            |                                                                    |
| AP-13 | `CLEAR` | no new `Deno.exit`; existing `import.meta.main` boundary unchanged         |                                                                    |
| AP-14 | `CLEAR` | executable gate contract preserved and covered by semantic tests           |                                                                    |
| AP-15 | `N/A`   |                                                                            |                                                                    |
| AP-16 | `CLEAR` | no `console.*` added                                                       |                                                                    |
| AP-17 | `N/A`   |                                                                            |                                                                    |
| AP-18 | `CLEAR` | no re-exports                                                              |                                                                    |
| AP-19 | `CLEAR` | no snapshot test; assertions are argv/env/state/receipt semantics          |                                                                    |
| AP-20 | `N/A`   |                                                                            |                                                                    |
| AP-21 | `CLEAR` | no directory grows; quickstart dir stays at 4 children                     |                                                                    |
| AP-22 | `N/A`   |                                                                            |                                                                    |
| AP-23 | `N/A`   | no composition file                                                        |                                                                    |
| AP-24 | `N/A`   |                                                                            |                                                                    |
| AP-25 | `N/A`   |                                                                            |                                                                    |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                                                              |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| New entries           | 0     | none required; no doctrine violation introduced                                                                                       |
| Resolved entries      | 0     |                                                                                                                                       |
| Deepened violations   | 0     | existing `scaffold-runtime-a8-f16-1333` (`.llm/harness/debt/arch-debt.md:2243`) concerns `gates/scaffold`; this slice touches `gates/quickstart` only and adds no child there |
| Unrecorded violations | 0     | `check-doctrine.ts --root packages/cli/e2e`: FAIL=0; all 14 WARN lines reference files outside the diff                               |

## Close-gate and PR-surface check (protocol rule 12)

| Check                                        | Result | Evidence                                                                                                                                                        |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No closing keyword on a partially-met issue  | `PASS` | PR body carries `Part of #1881` and `Part of #863` and states explicitly "This PR does not close #1881"; no `Closes/Fixes/Resolves` anywhere in the body         |
| Issue #1881 acceptance boxes                 | `N/A`  | all four boxes unchecked and correctly so: the hosted clean-machine transcript is deferred to the release owner; no mirror block is expected on a non-closing PR |
| Labels / milestone                           | `PASS` | `type:fix`, `area:cli`, `area:aspire`, `gate:e2e`, `priority:p0`, `orchestrator:aspire`, exactly one `status:` (`status:impl`); milestone `0.0.7`               |
| PR DoD                                       | `PASS` | four boxes checked with evidence in body; the fifth ("Separate-session IMPL-EVAL is recorded") is the one this file satisfies                                    |
| Brief carries `## SKILL` chapter (rule 13)   | `PASS` | `impl-eval-prompt.md` (untracked in the run dir) names the five skills                                                                                          |
| Release-gate class (rule 14)                 | `N/A`  | not a cut or release-gating run                                                                                                                                 |

## Findings

| Severity | Finding                                                                                                                                                                                          | Evidence                                                                                                            | Required action |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------- |
| `low`    | `context-pack.md` § In Progress still reads "commit and push the reviewed GREEN" although GREEN is the pushed head. The PR GREEN phase comment and `worklog.md` reconcile row supersede it, so resume is not blocked. | `context-pack.md` (committed inside `0650f6f7b`); PR comment 2026-09-03T02:17:58Z                                   | none required; refresh on the next run-dir touch |
| `low`    | A state file written by the pre-fix schema (no `denoInstallRoot`) is now rejected as "malformed prior run receipt". This is intended fail-closed behaviour (plan risk register) and cannot occur in a hosted run because index 0 always rewrites state. | `readState` guard                                                                                                   | none            |
| `low`    | `runAspireCommand` had no JSDoc one-liner before this slice and still has none; the new `env` parameter is therefore undocumented. Pre-existing, non-published surface.                          | `aspire-walk.ts:99`                                                                                                 | none required   |

No high or medium findings. No doctrine violation by AP code.

## Lessons for Promotion

| Lesson                                                                  | Pattern                                                                                                                                | Applies to | Confidence |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| Run the focused test under the launcher's exact permission set          | An env read added to a child gate silently widens its permission contract; a test run with `--allow-all` cannot catch it. The RED/GREEN drift here was found only by re-running under `--allow-env=PATH`. | A6 E2E gates | high       |
| Isolate hosted installs with `DENO_INSTALL_ROOT` + PATH prepend, not `-f` | Keeps README argv verbatim (the gate's whole point) while removing the ambient-install collision; the stale-root reset at index 0 makes same-runner reruns deterministic. | A6 E2E gates | high       |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                    |
| Rationale | Approved scope (plan D1–D6 plus the stale-root addendum) is complete at head `0650f6f7b`; every owner acceptance point is verified against the diff and by independently re-run gates (scoped check/fmt/lint/doctrine, 327/327 nested tests, 5/5 focused tests under the narrow `--allow-env=PATH` grant, `NotCapable` without it, gate listing, and an independent RED reproduction from `b1aafaaa6`). No README, workflow, cleanup, product, plugin, or lockfile change; no runtime gate ran; no debt introduced or deepened; PR carries no closing keyword and correct taxonomy. Hosted Canary 9 rerun remains the release owner's deferred proof for #1881. |
