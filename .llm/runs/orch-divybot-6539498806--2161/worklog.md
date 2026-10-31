# Worklog

## Intake and routing

- Assignment and repository instructions read. Existing memory consulted before source research.
- Issue comments and PR search show no existing covering PR; no leftover issue branch exists. Assigned branch starts at current main.
- NetScript MCP find_guidance then search_docs consulted: plugin discovery is static generation; selectors and inspection share authority.
- Feature matrix queried with --json: implementation sol/xhigh; default plan evaluator glm_5_3/provider_default; default implementation evaluator muse_spark_1_3/xhigh. Owner-selected override supersedes these evaluator cells.
- Owner matrix override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
- Feature limits: at most two PLAN-EVAL and five IMPL-EVAL rounds; assignment also stops after two consecutive terminal leaf failures. No local scaffold.runtime; request coordinator-owned CI verdict.

## Design checkpoint

1. Public surface: a first-line `// @netscript-registry-ignore` directive excludes a module from runtime registry imports. Generation and read-only inspection report the same excluded project-relative paths, which plugin doctor names. Existing unmarked-module validation stays strict.
2. Vocabulary: candidate = module eligible under existing manifest scan rules; excluded source = candidate carrying the directive; selected source = remaining candidate. The directive changes registry membership only, not ordinary application imports.
3. Ports: reuse ProjectFiles.readTextFile for pure shared selection; use existing Deno adapters at generator boundaries and existing process/inspection and doctor ports. No new services or runtime scanning.
4. Constants: one exported REGISTRY_IGNORE_DIRECTIVE owns the exact marker; shared selector owns matching policy. Optional excludedSourceFiles on protocol-2 entries preserves older producers without this evidence.
5. Commit slices: S0 plan/run bootstrap (this directory; PLAN-EVAL). S1 shared selection, three plugin scans, optional protocol evidence and doctor reporting (declared TS files; focused semantic tests, scoped check/lint/fmt, quality:gate, JSR surface audit). S2 installed-project reproduction, strict negative controls and plugin documentation (tests/readmes; focused installed fixture tests and docs validation). Commit/push each slice after independent review; keep worklog/context current.
6. Deferred scope: empty saga semantics #2162, general recursive scan changes, config globs, implicit skipping of invalid modules, full runtime E2E locally. CI runtime smoke is a required external merge gate, never claimed by unit tests.
7. Contributor path: packages/plugin/src/cli/application/registry-source-selection.ts documents the common directive contract; plugin renderers consume its selection result.

## Reconcile

Intake head equals origin/main; no implementation changes yet.

## PLAN-EVAL round 1

FAIL_PLAN: evaluator identified the second registry writers used by ordinary plugin commands. Research independently found these during review; plan now explicitly names both trigger writers and both worker writers and requires rewrite/parity tests. No implementation started. Re-steer same evaluator for round 2.

## S0 completion

PLAN-EVAL round 2 PASS and independent bootstrap sign-off. Baseline quality:gate exits 0 (existing warnings only). Context updated; no implementation files changed. Ready to commit and open draft. Reconcile: assigned branch still at current main baseline.

## S1 implementation in progress

Draft PR #2497 opened after signed-off bootstrap. Implemented shared first-line selector, all trigger/worker writers, sagas/AI scans, optional protocol-2 exclusion evidence and doctor messages. Structured root formatter correctly refused CLI files excluded by root config; rerun CLI-owned files with their scoped config rather than count a partial selection as a pass.

### S1 verification findings

Initial 39 regression tests passed; new installed proof initially used saga filenames outside the manifest -saga.ts suffix, corrected the fixture to remain eligible (no scan-rule change). 13 installed/protocol tests then passed. Scoped check passed 15 TS files; lint/format covered all 19 then-current TS files. Full plugin doc lint reports 18 pre-existing private-type-ref findings exclusively in unchanged contract/service/auth sources; new selector direct doc lint revealed ProjectFiles needed a same-package type export, now added. JSR audit dry-run succeeds; audit also reports pre-existing missing @module tags in abstracts/config/testing (CLI tag fixed on touched surface). These broader baseline findings are reported rather than concealed.

### S1 gate summary

- Aggregate structured test wrapper: 60 passed, 0 failed/ignored, exit 0.
- Structured check: 19 TS files, zero findings, exit 0.
- Structured lint and fmt: 19/19 files processed, zero findings, exit 0 (style-only config preserving root rules).
- quality:gate: durable receipt PASS, exit 0; inherited warnings only.
- New selector public documentation lint: durable receipt PASS, exit 0.
- Full shared plugin doc lint: 18 private-type-ref findings; every diagnostic source is byte-identical to baseline main. JSR publish dry-run succeeds; broader audit retains inherited missing @module tags in untouched entrypoints.
- Independent S1 review requested; no implementation commit until sign-off.

## S1 sign-off and reconcile

Independent S1 review PASS with substantive confirmation of each writer, protocol bounds, doctor output and test semantics. All conditional local gates are complete: 60 tests, 19-file check/lint/fmt, quality and new-selector doc lint. No source/lock changes outside the declared surface. Preserve version-coupled release and excluded-worker-policy edge case for S2 documentation/proof.
