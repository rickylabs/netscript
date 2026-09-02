# Evaluation: fix-fresh-form-navigation-drop--0.0.7 (IMPL-EVAL)

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `fix-fresh-form-navigation-drop--0.0.7`                                      |
| Target         | `@netscript/fresh/form` published `FormCollectionStrategy` (issue #1609)     |
| Archetype      | `4 — Public DSL / Builder`                                                   |
| Scope overlays | `frontend`                                                                   |
| Evaluator      | Independent separate-session IMPL-EVAL, OpenRouter `z-ai/glm-5.3-flash` on Claude Code host, 2026-08-31, head `cfec41cb8`, base `dea449911` |

Leaf commits: `fd77505a4` (PLAN-EVAL artifact) → `f670dbebb` (S2 implementation) → `cfec41cb8`
(merge of `origin/main`, 411 files, none of them leaf work; inside `packages/fresh` it touches only
`src/runtime/ai/create-chat-connection{,_test}.ts`, matching the plan's re-baseline note).

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                     |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS` (commit `fd77505a4`, 2026-08-31) precedes implementation commit `f670dbebb` (2026-08-31 18:29).                                       |
| Design section exists in worklog       | PASS   | `worklog.md` "Design" (Public Surface / Domain Vocabulary / Ports / Constants / Validation Rules).                                                            |
| Commit slices match design plan        | PASS   | 2 slices, ordered: S1 artifacts, S2 two locked product files. `git diff --stat dea449911..f670dbebb` = 6 files (4 artifacts + the 2 locked paths).           |
| Each slice has a passing gate          | PASS   | S2 gates re-run independently by this evaluator — see Static/Fitness tables below. Worklog itself was NOT advanced to S2 (Finding 1).                         |
| No speculative seams (unused files)    | PASS   | Diff adds no files; only the union replaces the interface and one test is added.                                                                              |
| Constants used for finite vocabularies | PASS   | No new runtime constants; the union reuses the existing published `FormNavigationMode` alias (note Finding 3 on `FormCollectionStrategyMode`).               |

## Claim Table (brief items A–G)

| Claim | Result | Deciding evidence |
| ----- | ------ | ----------------- |
| A. Ceiling — exactly two product/test paths | UPHELD | `git diff --stat dea449911..f670dbebb`: only `…/_internal/runtime-types.ts`, `…/components/form.test.tsx` (+ 4 run artifacts). `enhancement.tsx` byte-identical to base (`git diff dea449911..cfec41cb8 -- …/enhancement.tsx` empty). No docs/generated/baseline/lock change by the leaf. |
| B. Invalid state actually unrepresentable | UPHELD | Independent probes (`.llm/tmp/impl-eval-1609-{negative,widening}.ts`, checked with `deno check --config .llm/tmp/eval-config.json`): annotation, `satisfies`, widened-`string` variable, `interface extends`, `class implements` all rejected; only `{mode:'client', navigation:undefined}` admitted (= omission). Error targets confirm `readonly navigation?: never`. |
| C. Compile-time witnesses compiled by a named gate | UPHELD | Named gate = `run-deno-check.ts --root packages/fresh --ext ts,tsx` (exit 0; 200 files, 2 batches, 0 occurrences). `collectRoot`/`collectFiles` (run-deno-check.ts:90-97, 317-356) exclude only `.git/.deno/.deploy/.output/node_modules/vendor` — no test-file exclusion, so `form.test.tsx` is in the 200; a future widening leaves `@ts-expect-error` unused → TS error → gate red. Negative probe independently proves the underlying error exists today, so the directive is live. |
| D. No capability lost | UPHELD | Positive probe exit 0: server/hybrid × client/document all compile; form-wide `FormNavigationStrategy` compiles. Runtime tests intact: `form.test.tsx:108-131` (form-wide document strategy renders opt-out), `:186-203` (server partial attrs), `:205-213` (resolver maps both), `:215-232` (server + document). Runtime early return unchanged (`enhancement.tsx:49-51`). |
| E. Blast radius honesty | UPHELD (with process gaps) | Plan D5 + Hidden Scope; research "Mark this as a potentially breaking surface change; do not describe it as an implementation-only fix"; worklog Design "JSR consequence: potentially breaking". Verified concretely: `interface ExtendsWitness extends FormCollectionStrategy` now fails TS2312 — exactly the consequence PLAN-EVAL told S2 to name. Gaps: worklog not advanced to S2; commit message carries no breaking marker; PR metadata obligation still open (no PR yet). |
| F. Deferred churn reported, not absorbed | UPHELD | `.llm/tools/release/baselines/public-surfaces.json` still holds the OLD hash `cddf9959…` for `/packages/@netscript/fresh/exports/./form/symbols/FormCollectionStrategy` (stale, untouched); `docs/site/reference/fresh/index.md:379` still labels the symbol `interface` (stale, untouched); MCP corpus untouched. All three reported as SCOPE DISCOVERY in worklog Consumer Gates. |
| G. Lock byte-identical | UPHELD | `sha256sum deno.lock` = `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` before and after every gate run (matches plan's locked hash). Leaf diff never touches `deno.lock`; even the full merge diff base→HEAD shows no lock change. |

## Static Gates

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | exit 0; 200 files, 2 batches, failedBatches 0, occurrences 0 |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | exit 0; 200/200 processed, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | exit 0; 200/200, 0 findings |
| `./form` doc-lint | `deno doc --lint packages/fresh/src/application/form/mod.ts` | PASS | exit 0; "Checked 1 file", 0 diagnostics |
| Full package doc-lint | not re-run in full (baseline RED, 45 diagnostics, untouched paths only) | N/A | `./form` row is the owned contract and is 0; no owned-path change can move the other entrypoints |
| Publish dry-run | `deno task --cwd packages/fresh publish:dry-run` | PASS | exit 0; "Success Dry run complete" |
| Runtime tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh` | PASS | exit 0; 268 passed, 0 failed, 0 ignored, 12.3s |

## Fitness Gates

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-6 | JSR publishability | PASS | `audit-jsr-package.ts --root packages/fresh --text` exit 0; exactly 2 WARN (F-DOCT-5 cardinality + slow-types banner), 16 exports, 166 files, `./form=28` — exact baseline |
| F-7 | Doc score | PASS | `./form` doc-lint 0 diagnostics (contract ≤ 0) |
| Doctrine | Package check | PASS | `check-doctrine.ts --root packages/fresh` exit 0; FAIL=0 WARN=3 INFO=1 — exact 3-WARN/1-INFO non-increase; oversized-file set now includes merged-in `runtime/ai/create-chat-connection.ts` (origin/main), none in owned form paths |
| Quality | Code-quality scan | PASS | `scan-code-quality.ts --root packages/fresh --max-allow 7 --pretty` → `ok:true`, 0 findings, 0 allowances |
| Consumer | Type contract witnesses | PASS | Negative/positive/widening probes + scoped check (see Claim B/C) |
| Frontend browser | Rendered behavior | N/A | Runtime byte-for-byte unchanged; PLAN-EVAL upheld this N/A |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Published `./form` surface | `deno doc` rendering | PASS (moved) | `type FormCollectionStrategy = {partial?; clientNav?} & ({mode:"client"; navigation?: never} | {mode:"server"|"hybrid"; navigation?: FormNavigationMode})` — exactly the planned union |
| Consumers who `extends` the symbol | TS2312 probe | BREAKING (disclosed) | `interface ExtendsWitness extends FormCollectionStrategy` → TS2312 "statically known members" |
| Release surface baseline | read-only inspection | STALE as predicted | old hash `cddf9959…` retained; regeneration is supervisor-owned follow-up |
| Site reference | read-only inspection | STALE as predicted | `docs/site/reference/fresh/index.md:379` still `interface` |

## Anti-Pattern Check (scoped to the change)

| AP | Status | Notes |
| -- | ------ | ----- |
| AP-9 premature abstraction | CLEAR | One closed inline union; no registry/helper/typestate. |
| AP-15 implementation-shaped public name | CLEAR | Caller vocabulary `mode`/`navigation` preserved; Fresh attrs stay internal. |
| AP-22 useless barrel | N/A | No barrel added. |
| AP-25 side effect in non-edge file | CLEAR | Type/test-only change. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No new doctrine violation; doctrine/quality/JSR at exact baselines. |
| Resolved entries | 0 | Existing fresh entries untouched. |
| Deepened violations | 0 | — |
| Unrecorded violations | 0 | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| Medium | `worklog.md` was never advanced to S2: "Current phase" still reads "S1 research/plan; stop before PLAN-EVAL", Progress Log stops at S1, Gate Results hold only base measurements, and the PLAN-EVAL-mandated F-2/F-4/F-8/F-9 disposition record is absent. The implementation commit `f670dbebb` contains no artifact update. | `worklog.md:12,78-88,108-148`; `git show --stat f670dbebb` (2 files, no artifacts) | Non-blocking (this evaluator independently reproduced every S2 gate — tables above — and this file now supplies the missing S2 evidence), but the worklog S2 rows/phase must be refreshed before merge so resume state is truthful. |
| Low | Commit message `fix(fresh): reject navigation for client collections` carries no breaking-change marker. The PLAN-EVAL supervisor obligation to label PR metadata potentially-breaking (including the `interface extends` consequence, verified real via TS2312) remains open — no PR exists yet. | `git log -1 --format=%B f670dbebb`; PLAN-EVAL Notes (1)/(2) | PR body must label the change potentially-breaking and name the `extends`/`implements` break; commit subject ideally amended or carried verbatim into release notes with the marker. |
| Low | `FormCollectionStrategyMode` is now a dangling published alias: `FormCollectionStrategy` hardcodes `'client'` / `'server' \| 'hybrid'` literals instead of deriving from it, so a future mode added to the mode alias will silently not be representable as a collection strategy (fails closed at consumer compile time, but the two published vocabularies can drift ungated). | runtime-types.ts:77 vs :99-112; `deno doc` shows both published | Follow-up (not this issue): derive the non-client branch via `Exclude<FormCollectionStrategyMode, 'client'>` or add a type-level parity witness. Plan-specified shape, so within plan. |
| Info | Residual representable state: `{ mode: 'client', navigation: undefined }` type-checks (`never` under an optional modifier admits `undefined`). Semantically identical to omission; no policy value can slip through. | widening probe: no error at `.llm/tmp/impl-eval-1609-widening.ts:26` | None; document if a follow-up tightens with `exactOptionalPropertyTypes`. |
| Info | The new test's runtime assertions are near-vacuous (literal-vs-literal `assertEquals`); their value is forcing module execution — the real evidence is compile-time, exactly as planned and as PLAN-EVAL ruled equivalent. A runtime RED is impossible for a type rejection (`deno test` does not type-check; a non-compiling test file cannot run), so the `@ts-expect-error` + scoped-check mechanism is the correct and genuinely equivalent evidence form. | form.test.tsx:13-37; scoped check includes the file via run-deno-check.ts:90-97 | None. |
| Info | No `drift.md` exists; drift rows live in `worklog.md` "Drift", authorized by the S1 three-file artifact ceiling. The evaluator brief expected a drift.md — surface rather than silently accept. | `worklog.md:100-107` | Supervisor may consolidate into drift.md at handoff if the harness expects the separate file. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Compile-time witnesses in test files are gate-enforced only because the scoped check wrapper selects test files with no test exclusion — keep that property when touching the wrapper. | `@ts-expect-error` witnesses + structured check wrapper | Archetype 4 type-contract leaves | high |
| Interface→union/alias moves break `extends`/`implements` consumers, not just object literals — name both in breaking-change labels. | Declaration-kind move blast radius | Any published type narrowing | high |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | Approved scope complete and ceiling-honored; the invalid combination is adversarially verified unrepresentable (annotation/satisfies/widened-variable/extends/implements all rejected; all supported shapes compile); every named S2 gate independently reproduced green at exact baselines; runtime byte-identical; lock byte-identical; deferred churn reported not absorbed. Findings are process/bookkeeping (stale S2 worklog rows, unlabeled commit subject) and do not block the product verdict, but the worklog refresh and PR breaking-change labeling are required before merge. |
