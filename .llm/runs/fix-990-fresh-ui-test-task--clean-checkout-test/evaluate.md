# Evaluation: fresh-ui clean-checkout test task (issue #990)

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `fix-990-fresh-ui-test-task--clean-checkout-test` |
| Target         | `packages/fresh-ui` test infrastructure |
| Archetype      | `4 - Public DSL / Builder`     |
| Scope overlays | `none`                         |
| Evaluator      | Claude Opus 5, fresh IMPL-EVAL session, 2026-08-01 (owner-authorized fallback for the 404'd open-model lane; generator was OpenAI GPT-5 Codex — opposite family, separation invariant holds) |
| Evaluated state | Uncommitted working tree at baseline `3ab64720f`; `HEAD == origin/main`; run dir untracked |
| Passes         | Pass 1 → `FAIL_FIX` (five record/cosmetic fixes). Pass 2 (recheck, 2026-08-01) → **final verdict below**. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | **FAIL** | `plan-eval.md` verdict line 74 reads `**FAIL**`. No PASS record exists anywhere in the run. Implementation proceeded after the generator amended its own plan. See Finding 1 — the amendments themselves are verified landed. |
| Design section exists in worklog       | PASS   | `worklog.md` §`## Design` with Public Surface / Domain Vocabulary / Ports and Constants / Commit Slices / Deferred Scope / Contributor Path. |
| Commit slices match design plan        | PASS   | One slice in `plan.md` (line 46) and `worklog.md` (line 33); the working diff is exactly the two named files. |
| Each slice has a passing gate          | PASS   | `worklog.md` Gate Results: full suite `ok | 166 passed | 0 failed (5m59s)` on a removed `.llm/tmp`, scoped check 149 files, lint 149 files, publish dry-run, publish readiness, publish assets. |
| Commit trail (commit / push / PR comment) | NOT_RUN | No commit exists: `git log --oneline origin/main..HEAD` is empty and both files are unstaged. Coherent with `context-pack.md` "In Progress" and `drift.md` entry 3 (owner reserved push/PR). Not a contradiction; the trail is simply still pending. |
| No speculative seams (unused files)    | PASS   | Diff adds no files, no symbols, no exports. `tempRoot` is consumed on the next line. |
| Constants used for finite vocabularies | PASS   | `tempRoot` reuses the existing literal rather than duplicating it; `REPO_ROOT`/`CLI_ENTRY`/`REGISTRY_ROOT` untouched. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno run -A .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx` | PASS | Generator: 149 files, 2 batches, 0 failed batches/diagnostics. | Correctly invoked without `--unstable-kv` per the wrapper contract. |
| Slice typecheck  | covered by the above | PASS | Same run; both changed files are inside the root. | |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx` | PASS | **Re-run by this evaluator**: `{"filesSelected":149,"batches":1,"failedBatches":0,"findings":0}`, exit 0. | Gate was absent from the plan's validation list (Archetype 4 requires fmt); filled here, no defect. |
| Lint             | `deno lint packages/fresh-ui` | PASS | Generator: `Checked 149 files`. | |
| Doc lint         | — | N/A | No exported symbol, entrypoint, or doc comment changed. | Pre-existing fresh-ui private-type doc-lint debt is baseline and untouched. |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` from `packages/fresh-ui` | PASS (stale-ordered) | Generator: `Success Dry run complete`. | Ran **before** the JSONC comment was removed. `deno task check:publish-assets` was re-run after removal (exit 0, `worklog.md:65`). Removal strictly narrows the manifest toward baseline JSON, so the verdict carries — but the record should say so. See Finding 3. |
| Publish readiness | `deno task publish:readiness` | PASS | `{"gate":"publish-readiness","ok":true,"version":"0.0.2"}`. | This is the gate the earlier blocker broke; it is green on the final state. |
| Manifest strictness | `JSON.parse(packages/fresh-ui/deno.json)` | PASS | **Re-run by this evaluator**: `STRICT_JSON_OK`. Confirms the earlier strict-parse blocker is gone. | |
| Repo quality scan | `deno task quality:scan` | PASS | **Re-run by this evaluator**: `{"ok":true,...,"findings":[],"allowCount":7}`, exit 0. Allowances are all pre-existing `packages/cli`/`plugins` entries. | Scans `packages/cli/src` + `plugins` only, so fresh-ui is out of its roots; run as a no-regression check. |
| Doctrine fitness | `deno task arch:check` | N/A | The task enumerates auth/plugin roots only; `packages/fresh-ui` is not among them. | No fresh-ui doctrine runner exists to run; not a gap introduced by this run. |
| Link/path check  | `.llm/tmp` literal, `.gitignore` | PASS | `git check-ignore -v .llm/tmp` → `.gitignore:17:.llm/tmp/`. The parent is genuinely ignored, which is exactly why the test must create it. | |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | N/A    | No file grew materially (2 lines + 1 comment). | none |
| F-2  | Helper-reinvention scan      | PASS   | Uses `Deno.mkdir({recursive:true})` rather than a hand-rolled exists-check. | none |
| F-3  | Layering check               | N/A    | Test-only change. | none |
| F-4  | Inheritance audit            | N/A    | — | none |
| F-5  | Public surface audit         | PASS   | `exports` and `publish` in `deno.json` byte-unchanged; only `tasks.test` differs. | none |
| F-6  | JSR publishability gate      | PASS   | Publish dry-run + readiness green; manifest is strict JSON. | none |
| F-7  | Doc-score gate               | N/A    | No exported symbol changed. | none |
| F-8  | Workspace `lib` override     | N/A    | — | none |
| F-9  | Permission declaration check | PASS   | Task now declares `--allow-read --allow-write --allow-run`. Each is empirically grounded: read (suite/files), write (`makeTempDir`/`mkdir`), run (`Deno.Command(Deno.execPath())` at line 20). No `--allow-env`, no `--allow-net`, no `-A`. Full 166-test suite passes on exactly this set (`research.md` finding 6). | none |
| F-10 | Test-shape audit             | PASS   | The second test establishes its own ignored parent (`markdown-renderer.test.ts:134-137`) before `makeTempDir`, removing the ambient-state dependency. Verified by inspection: `tempRoot` is created, then passed as `dir`. | none |
| F-11 | Forbidden-folder lint        | N/A    | No folder added. | none |
| F-12 | Naming-convention lint       | PASS   | `tempRoot` matches surrounding `parent`/`projectRoot`/`dashboardRoot` vocabulary. | none |
| F-14 | Console-log lint             | N/A    | None added. | none |
| F-15 | Re-export-of-upstream lint   | N/A    | — | none |
| F-16 | Folder-cardinality lint      | N/A    | — | none |
| F-17 | Abstract-derived co-location | N/A    | — | none |
| F-18 | Sub-barrel lint              | N/A    | — | none |
| F-19 | Scoped source gate runners   | PASS   | check/fmt evidence comes from `.llm/tools/run-deno-*.ts`, not raw root CLI. | none |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| Clean-checkout acceptance (#990 box 1) | Delete `.llm/tmp`, then one full `deno task test` | PASS | `ok | 166 passed | 0 failed (5m59s)`. Ordering is correct: the parent was removed *before* the run, so the run genuinely proves the clean-checkout condition rather than benefiting from it. |
| Permission justification (#990 box 2) | Scoped set + rationale comment | PASS (with a cosmetic defect) | Set is measured, not reflexive — `plan-eval.md` Finding A is fully remediated in `plan.md` D1. Comment placement is poor; see Finding 4. |
| Scaffold runtime E2E | `deno task e2e:cli run scaffold.runtime` | NOT_RUN | Owner constraint (`supervisor.md` overrides, `drift.md` entry 3). Non-release run, no scaffold output changed; rule 14 is `n/a`. Correctly recorded rather than silently skipped. |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| `deno task test` (contributor-facing) | Full suite on a clean parent | PASS | 166 passed. This *is* the changed surface. |
| Published package consumers | Publish surface diff | N/A | `tasks` is not part of the published contract; `exports`/`publish` unchanged. |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | N/A    | No barrel touched. | |
| AP-2  | N/A    | | |
| AP-3  | N/A    | | |
| AP-4  | N/A    | | |
| AP-5  | N/A    | | |
| AP-6  | N/A    | | |
| AP-7  | N/A    | | |
| AP-8  | N/A    | | |
| AP-9  | N/A    | | |
| AP-10 | N/A    | | |
| AP-11 | N/A    | | |
| AP-12 | N/A    | | |
| AP-13 | N/A    | | |
| AP-14 | N/A    | No upstream re-export. | |
| AP-15 | CLEAR  | `tempRoot` is caller vocabulary, not an implementation role. | |
| AP-16 | N/A    | | |
| AP-17 | N/A    | | |
| AP-18 | N/A    | | |
| AP-19 | CLEAR  | Permission declaration is explicit and minimal; the widening reflex the issue targets was actively resisted (`--allow-all` rejected at PLAN-EVAL, measured set adopted). | The strongest result in this run. |
| AP-20 | N/A    | | |
| AP-21 | N/A    | | |
| AP-22 | N/A    | | |
| AP-23 | N/A    | | |
| AP-24 | N/A    | | |
| AP-25 | CLEAR  | `Deno.mkdir` runs inside the test body, not at module load. | Correct placement; a load-time `mkdir` would have been a violation. |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No doctrine violation introduced; diff is test-infrastructure only. |
| Resolved entries      | 0     | The F-9/F-10 defects fixed here were baseline test-shape defects, not registered `arch-debt.md` entries. |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | Verified against the two-file diff and the `quality:scan` result. |

## Lock Hygiene

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No lockfile churn | PASS | `git status --porcelain` lists exactly `packages/fresh-ui/deno.json`, `packages/fresh-ui/tests/registry/markdown-renderer.test.ts`, and the untracked run dir. No `deno.lock` at any level is modified, despite the full suite, publish dry-run, and readiness gates having run. Risk Register row 3 mitigation held. |

## Findings (pass 1 — all closed, see Recheck)

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium | **The Plan-Gate record still reads `FAIL` and was never closed.** `plan-eval.md:74` is the run's only Plan-Gate artifact and its verdict is `**FAIL**`. Implementation proceeded on the generator's own judgement that its amendments satisfied the required changes — i.e. the generator self-certified the gate. Protocol rule 2 requires this be recorded as a process failure. **Mitigating and material:** this evaluator independently verified all three amendments landed — Finding A: `plan.md` D1 now grants the measured `--allow-read --allow-write --allow-run` with capability-naming rationale, no `--allow-all`; Finding B: D2 and `research.md` finding 5 both mark the `.llm/tmp` location "owner-imposed, unverified"; Finding C: `plan.md` validation step 4 adds the publish dry-run, which ran and passed. The substance is remediated; only the record is not. | `plan-eval.md:74`; `plan.md:31,32,72`; `research.md:18`; `worklog.md:49` | fix (record) — append a dated closure note to `plan-eval.md` stating the amendments were verified landed by this IMPL-EVAL and the Plan-Gate is cleared retrospectively. No re-plan. |
| medium | **Stale run-record language survives in `context-pack.md`.** Line 46 reads `Publish dry-run: PASS — JSONC accepted, dry run complete.` The final `deno.json` contains no JSONC — this evaluator confirmed `JSON.parse` succeeds (`STRICT_JSON_OK`) and the diff shows the manifest change is confined to the `test` task string. `worklog.md`, `plan.md`, `research.md`, and `drift.md` were all corrected to describe the strict-JSON outcome; `context-pack.md` was missed. A reader resuming from the context pack would believe the shipped manifest carries a comment — the exact belief the earlier blocker disproved. | `context-pack.md:46` vs. verified `STRICT_JSON_OK` and `plan.md:52` | fix (record) — rewrite the line to state the manifest stayed strict JSON and the rationale lives in the test file. |
| low | **Publish dry-run evidence predates the fix it is cited against.** The dry-run ran while the JSONC comment was still present; only `check:publish-assets` was re-run afterwards. The conclusion still holds (removing a comment strictly narrows the manifest toward valid JSON, and `publish:readiness` is green on the final state), but the worklog presents the dry-run without noting the ordering. | `worklog.md:52-53,63,65` | fix (record) — note the ordering, or re-run `deno publish --dry-run --allow-dirty` on the final tree. Non-blocking either way. |
| low | **Capability comment is orphaned from what it documents.** `markdown-renderer.test.ts:9` sits immediately above `interface CommandResult`, so it reads as documentation of that interface rather than of the package test task. The comment's content is correct and well-scoped; only its position is wrong. | `packages/fresh-ui/tests/registry/markdown-renderer.test.ts:9-10` | fix (cosmetic) — move it to the file header above the imports, or directly above the `run()` helper it actually explains. |
| low | **IMPL-EVAL route override is not yet in `drift.md`.** `drift.md` records the `qwen/qwen3.7-max` 404 for PLAN-EVAL only. This IMPL-EVAL ran on a closed model (Claude Opus 5) under explicit owner authorization — a deviation from the open-models-only evaluator lane that must be recorded, not assumed inherited from the PLAN-EVAL entry. | `drift.md:35-44`; this session | fix (record) — append a drift entry for the IMPL-EVAL route override. |

## Recheck (pass 2 — 2026-08-01)

Scope of this pass, per owner instruction: the five pass-1 record/cosmetic findings only, plus a
drift check. The full suite and the broad gates were **not** re-run — their pass-1 evidence stands
approved and nothing in the remediation diff can invalidate it (see "No new drift" below).

| # | Pass-1 finding | Status | Verification |
| - | -------------- | ------ | ------------ |
| 1 | Plan-Gate record still `FAIL`, never closed | **CLOSED** | `plan-eval.md:88-100` now carries a dated `## 2026-08-01 — Amendment closure` section: it names all three amendments (A/B/C), attributes verification to the separate IMPL-EVAL rather than to the generator, records `Amended Plan-Gate disposition: PASS`, and explicitly preserves the original `**FAIL**` at line 74 as authoritative history. This is the required shape — retrospective closure with an audit trail, not a rewrite. No re-plan occurred. |
| 2 | `context-pack.md` still asserted a JSONC manifest | **CLOSED** | `context-pack.md:46-47` now reads "PASS on the pre-final-fix tree; the final manifest remains strict JSON, the capability rationale lives in the test file, and final-state publish readiness/assets checks pass." The stale "JSONC accepted" claim is gone. `context-pack.md:15-17` was also corrected to say the capability comment lives in the affected test file. Re-verified against the tree: `JSON.parse(packages/fresh-ui/deno.json)` → `STRICT_JSON_OK`. |
| 3 | Publish dry-run evidence predated the fix it was cited against | **CLOSED** | `worklog.md:63` now reports the gate as `PASS (pre-final-fix)` with the note "Ran before the JSONC comment was removed. Removing the comment narrows toward baseline strict JSON; final-state `publish:readiness`, `check:publish-assets`, and evaluator `JSON.parse` all pass." The ordering is now stated rather than implied. The record route was taken instead of a re-run, which the finding permitted. |
| 4 | Capability comment orphaned from what it documents | **CLOSED** | The comment moved from line 9 (glued to `interface CommandResult`) to line 4, immediately after the imports and above the constant block — a file-scope preamble position. This is not one of the two positions the finding literally suggested, but it removes the defect the finding named: at line 9 the phrase "run for Deno subprocesses" plausibly read as documentation *of* a command-result type, an actively misleading attachment. Above a group of path constants no such false reading is available, so it functions as the file-level note it is. Accepted as remediated. |
| 5 | IMPL-EVAL route override missing from `drift.md` | **CLOSED** | `drift.md:46-56` adds `## 2026-08-01 — Owner-authorized IMPL-EVAL fallback`: expected open-model Qwen, actual closed-model Claude Opus 5, severity `significant`, action "accept for this run under the owner's explicit evaluator-lane waiver". The override is now recorded in its own right rather than inherited from the PLAN-EVAL entry — which was the point of the finding. |

### No new drift

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Implementation scope unchanged | PASS | `git status --porcelain` still lists exactly `packages/fresh-ui/deno.json`, `packages/fresh-ui/tests/registry/markdown-renderer.test.ts`, and the untracked run dir. `git diff` is byte-identical to the pass-1 diff except for the comment's line position — the `deno.json` `tasks.test` string and the `tempRoot` + `Deno.mkdir` lines are unchanged. No new file, symbol, export, or dependency. |
| Gate evidence still valid | PASS | The only implementation edit since pass 1 is a comment relocation within one file. It cannot affect type-check, lint, or test behaviour; the one gate it could plausibly disturb is formatting, and that was re-run — `{"filesSelected":149,"batches":1,"failedBatches":0,"findings":0}`, exit 0. Re-running the 5m59s suite would prove nothing further. |
| Manifest strictness | PASS | **Re-run**: `STRICT_JSON_OK`. |
| Lock hygiene | PASS | `git status --porcelain --untracked-files=all | grep -i lock` → no match at any workspace level. Unchanged from pass 1. |

### Non-blocking observation

`context-pack.md:51-52` under "Drift and Debt" still summarises only the PLAN-EVAL route failure;
the IMPL-EVAL override is fully recorded in `drift.md` (finding 5's required destination) but is not
mirrored into the resume summary. Finding 5 required the `drift.md` entry and that entry exists, so
this does not affect the verdict. Worth a one-line addition whenever the run dir is next touched.

## What Is Correct In This Run

Recorded so the required fixes are not mistaken for a weak implementation — they are all bookkeeping.

- The earlier blocker is genuinely gone, verified independently rather than taken on report: the
  manifest strict-parses, and `publish:readiness` (the gate the JSONC comment broke) is green.
- The permission set is measured, not reflexive. The run rejected `--allow-all` at the Plan-Gate,
  measured the minimum against *both* subprocess tests, and proved it with the full 166-test suite.
  This is precisely what #990's second acceptance box asks for, and it is the part of the run most
  likely to have been fudged.
- Clean-checkout proof ordering is correct — the ignored parent was deleted *before* the single full
  run, not after, so the pass means what it claims.
- Lock hygiene is clean despite three lock-touching gate families having run.
- Scope is exactly the two planned files. No product source, no exports, no CI, no scaffold.
- The expensive suite ran once, as planned.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Deno's JSONC tolerance is not the repo's manifest contract — release/readiness tooling `JSON.parse`es package manifests, so rationale comments belong in source files, never in `deno.json`. | Manifest comments pass `deno test`/`check`/`publish` and still break `publish:readiness`. | all archetypes with published packages | high |
| A permission grant measured against *one* test is not measured — widen the probe to every test the task runs before locking the set. | `research.md` finding 3 covered one test; finding 6 was needed to make the claim true for the task. | Archetype 4/5/6, any package with subprocess tests | high |
| When a PLAN-EVAL returns FAIL-with-amendments, the amended plan needs an explicit closure record before implementation; otherwise the generator silently self-certifies the Plan-Gate. | This run: correct amendments, no closure artifact, gate record still reads FAIL at IMPL-EVAL time. | all harness runs | high |

## Verdict

This is the final authoritative verdict for the run, superseding the pass-1 `FAIL_FIX`.

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Pass 1    | `FAIL_FIX` — five record/cosmetic findings, no code change required. Retained above as history. |
| Rationale | All five pass-1 findings are closed and verified against the tree, not taken on report: the Plan-Gate is retrospectively cleared in `plan-eval.md` with the original `FAIL` preserved; `context-pack.md` no longer claims a JSONC manifest; the publish dry-run's ordering is stated at `worklog.md:63`; the capability comment no longer attaches to an unrelated declaration; and the IMPL-EVAL route override is recorded in `drift.md` in its own right. No new drift: scope is still exactly the two planned files, the remediation touched only a comment's position, formatting and strict-JSON parsing were re-run green, and no lockfile at any level is modified. The substance was already approved in pass 1 — both #990 acceptance boxes are satisfied, the permission set is measured rather than reflexive, the clean-checkout proof ordering is correct, and the public/JSR surface is byte-unchanged. The run now also meets the record bar: a resuming reader is told the truth about what is being shipped. |
| Recorded process failure | Implementation began before a `PASS` Plan-Gate record existed (protocol rule 2). This is closed retrospectively, not erased — the amendments were verified landed and the original `FAIL` remains in `plan-eval.md`. It stands as this run's process lesson, already promoted below. |
| Outstanding | Commit, push, and PR creation remain deliberately with the owner (`drift.md` entry 3). That is a reserved action, not an evaluator blocker. |
