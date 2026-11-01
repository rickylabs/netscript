# Worklog

## Owner override

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

## Intake

- Full assignment read; live issue and comments inspected. No orchid-triage comment and no covering PR found.
- Current checkout and fetched main both `14816a409e31505bc528714332b0bf4670be2fcb`.
- Consulted prior run environment and launcher memory. RTK unavailable; plain focused reads and repository structured wrappers used. No connected memory tool exposed; use focused run memory notes.
- NetScript MCP find_guidance followed by search_docs consulted before source design. Generated static registries are the existing declaration-to-runtime seam; application modules must never execute during discovery.

## Design

1. **Public surface:** declared factory saga modules appear in generated runtime maps and root doctor source comparison. Inspector gains explicit declaration metadata; existing options remain compatible.
2. **Domain vocabulary:** saga declaration = config id + project-relative entrypoint; legacy candidate = native-builder module; active declaration excludes opted-out config files.
3. **Ports:** existing ProjectFiles, protocol-2 renderer, host FileSystemPort/ProcessPort and root doctor drift check. No application imports during discovery.
4. **Constants:** existing SAGAS_REGISTRY_PATH and REGISTRY_IGNORE_DIRECTIVE; use named constants for config suffix and declaration callee; existing ProjectFiles.resolve/relative for path policy.
5. **Commit slices:** S0 plan/bootstrap; S1 inspector/generator/docs and proving tests; S2 evidence/handoff. See plan.md for files and gates.
6. **Deferred scope:** evaluating configs/factories and changing host/runtime architecture; declared exports have runtime shape validation at registry load.
7. **Contributor path:** plugins/sagas/src/cli/saga-inspector.ts explains static declaration contract; README documents author usage.

## Reconciliation

Initial fetched main equals checkout; #2509/#2162 empty output and #2161 shared first-line ignore behavior present. No source changes yet.

## PLAN-EVAL round 1

FAIL_PLAN: documented root netscript.config.ts declarations would be skipped; @std/path is not declared by the plugin. Corrected the plan before source edits: include direct static root-config declarations and resolve explicit project-contained paths outside conventional scan roots. Reuse ProjectFiles.resolve/relative rather than adding a package dependency. Also accept supported export-list aliases/re-exports and reject conflicting duplicate identities. Evaluator confirmed protocol-2/doctor parity and static approach.

## PLAN-EVAL round 2

PASS before implementation. Final plan includes root-config/static companion parity, explicit project paths, no added dependency, duplicate identity rejection, export-list support and generated-source rejection. Baseline focused tests: 14 passed, 0 failures. Baseline full quality:gate: exit 0. Baseline plugin JSR audit: exit 0 with existing directory-cardinality/slow-types notices; no new debt accepted.

## S1 implementation and evidence

- Added static config declaration metadata to inspector, including documented root config and named aliases. Added bounded declaration/export tokenization, skipping comments and quoted/regex contents. No application code executes.
- Generator unions validated explicit entrypoints with conventional candidates, deduplicates, preserves filename/first-line exclusions, and fails with config/id/path remediation before writes. Invalid targets, conflicting identities and missing value exports are rejected. Existing generated module bytes remain identical for legacy sources (golden test passes).
- Source write surface: saga CLI inspector, generator, CLI type barrel, new saga-declarations module; plugin README, new direct plugin test and separate new CLI integration test. No host production source, schema, dependency or lock changed.
- Local evidence: 81 tests passed; scoped checks/lint/fmt passed; full quality:gate passed; JSR audit matches baseline. Full doc-lint remains baseline-red with exactly the same 30 private-type-ref diagnostics, changed CLI entrypoint clean. See evidence.md.
- Negative controls: full baseline source replay gives 3/4 installed integration failures (empty install remains valid); generator-only revert gives 27 failures; helper-inclusion and empty-rejection mutants each fail their protection test. Source bytes restored and positive suite rerun.
- Reconciliation: behavior matches PLAN-EVAL-approved declaration seam and no unrelated source drift. No new accepted architectural debt; existing full-package doc-lint findings are unchanged and outside assigned generator scope.

## IMPL-EVAL round 1

FAIL_FIX: new root-config metadata reached existing update/remove path selection, risking deletion of the shared root file. Repaired before commit by refusing both commands for root-declared ids, with manual-edit remediation before any writes. Four regression cases cover root-only and root-plus-companion for both commands, requiring all source bytes unchanged. Fixed the tokenizer's division context and import-only alias detection; added a same-line division/declaration regression. README documents error behavior. Independent review is resumed in the same session after updated gates.

## IMPL-EVAL round 2 and final reconciliation

PASS from the same independent evaluator before implementation commit. All blocker/advisory repairs reviewed; 81 focused tests, source checks, lint/fmt and full root quality gate pass. Old-backend mutation makes all four safety tests fail; restored-source suite passes. Prepush review-thread gate: PASS, zero threads/unanswered. The coordinator retains supervisor merge sign-off.

S1 implementation and S2 evidence/handoff content are one coherent signed-off slice below 30 files; bootstrap S0 is already pushed. Final source tree reconciles with the approved plan plus explicit root-consumer safety drift. No new debt, source suppressions, dependency, lock or unrelated files. After push, use PR commit list and slice comment for full immutable hash, flip ready, then final same-session exact-head review; record its verdict and CI snapshot on PR/issue without creating another commit. The required full scaffold.runtime CI remains unproven until coordinator supplies it.

## CI quality repair after READY

The exact-head CI quality job failed README fence integrity: the new runtime example imported an application-owned operations-core file that the README did not define. This added one TS2307, increasing the ratchet from its five known errors/four READMEs to six/five. Repair the example as a complete multi-file set: add the actual application-core factory in its own checked TypeScript fence with the existing first-line module-path convention. Keep the runtime import and config declaration intact. No compiler exemption, ratchet change or runtime source change. Run the exact README gate plus later freshness gates that CI had skipped after failure; renew same-session exact-pushed-head review after committing.

CI repair gates pass: README fence census 112 checked/0 exemptions with only baseline five type errors; native MCP corpus regeneration changes exactly the saga CLI row; corpus freshness, agent docs, asset/publish freshness, 48 emitted samples, source check and eight corpus consumer tests pass. This follow-up contains README/example and generated API data only, plus run context. No runtime source changes. Same evaluator session reviews the slice before commit and the exact new pushed head afterwards; prior 621f5df9 verdict applies only to that old head.

Same-session IMPL-EVAL round 4 PASS before committing the CI correction. Full local quality:gate, README ratchet, corpus/freshness checks, corpus consumer tests and emitted samples pass. No exemptions, ceiling changes, runtime source edits or lock churn. Reconciliation: only the saga CLI row changes in decoded embedded data; the real README factory matches the issue's tested factory. Commit/push this slice, then round 5 reviews the exact pushed head. Canonical final report stays a draft until the fresh handoff is ready.
