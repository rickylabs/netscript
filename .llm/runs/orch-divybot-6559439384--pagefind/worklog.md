# Worklog

## Design

1. **Public surface:** existing docs build, generated Pagefind JS API and strict reproducibility CLI. Caller-visible search/fallback/filter/count/hash behavior remains covered by browser tests.
2. **Vocabulary:** native filter, metadata and entry serialization; stable ingestion order means URL order before addHTMLFile. No new domain types.
3. **Ports:** existing Lume Pagefind processor and native npm Pagefind API, Deno build processes/filesystem, Playwright browser. No replacement abstractions.
4. **Constants:** exact Pagefind release 1.6.0 in site import map; stable comparator uses UTF-16 code-unit URL order (not locale-dependent ordering). Existing lane definitions unchanged.
5. **Commit slices:** bootstrap/research → native reproducibility integration + full proof → strict CI policy removal after exact-head proof. Files and gates in plan.md; one subsystem, no sibling fanout.
6. **Deferred scope:** upstream generic CLI traversal fix, all token/layout/registry work, and binary postprocessing.
7. **Contributor path:** `tools/docs-site/README.md` documents the override, native ordering rationale and strict/browser commands.

## Bootstrap

Read assignment in full, issue/comments, AGENTS and harness/toolchain/PR/tools skills, existing retained memory. RTK absent; direct focused commands used. Fetched main equals baseline. Strict failure reproduced and retained. Toolbelt reports 1.6.0 stable; upstream #1124 explains the native defect. PLAN-EVAL selected because choosing/qualifying a new native release and removing a CI exception warrants separate-family review.

Owner evaluator override verbatim: `Independent separate-family read-only PLAN/IMPL evaluation as applicable; continue owner preference `claude -p --model claude-opus-5-5 --effort high`.`
Owner-specific PR instruction (draft, Refs #2453, no labels, cockpit owns merge) overrides generic closing-keyword/label/readiness boilerplate. Public artifacts omit host paths/session IDs; private transport evidence remains local. No questions needed.

## PLAN review cycle 1

Separate Anthropic evaluator returned FAIL_PLAN: explicitly lock allPages sorting and downstream effect, add real shuffled-ingestion proof, name the frozen command, decide obsolete mode deletion, and include the classifier contract test. All are corrected in plan.md before implementation. Add a narrow composed Pagefind plugin plus native Lume integration fixture/bridge; no binary postprocessing. Delete bounded CLI mode after proof. Capture baseline non-search hashes to verify downstream ordering does not change rendered output. Re-steer the same evaluator for the final permitted PLAN round.

## PLAN review cycle 2

PASS from the same independent Anthropic Opus 5.5/high session, read-only. All gaps corrected before source editing. Non-blocking clarifications addressed: root scan line reconciled; pre-edit baseline manifest retained/hash recorded; shuffled-input fixture includes an unsorted negative control; make ordinary Lume task frozen too, so strict builds use reviewed lock without age-policy bypass.

Read-only leak reporter auto-wrote its raw host-context report into the run directory; relocated it intact to local project evidence to honor the owner's no-public-host-paths rule. Reviewed all 24 survivors: all ownership unproven and predating this run; no resource was mutated. Docker inventory remains unavailable, so this is not a clean-runtime claim.

## Slice 2 integration checks

Working tree atop ed7d08a: native strict two-build **PASS**,1116 files/316 HTML/262 twins/311 search, zero differences/allowances. Native shuffled-ingestion test **PASS** including unsorted negative control; frozen remote Lume command with explicit config **PASS**; no obsolete1.3.0 lock entries. Structured docs tooling22 tests and site fixtures39 tests PASS; scoped docs/site/browser check-lint-fmt PASS. quality:gate PASS including root dependency and architecture scans. Built links33127 and caveats13 markers PASS; generated token freshness PASS; docs:links and docs:accuracy PASS. Independent read-only slice content review PASS in slice-review-native.md. Full browser rerun in progress with isolated libs; no source/build activity while it reads output.

One workflow test invocation omitted fixture write permission (71 pass/1 capability error); final corrected command includes --allow-write. This is an invocation issue, no source adjustment. The optional high audit reports the same pre-existing advisory IDs as baseline. CLI E2E attempted exactly once and fails at Aspire preflight/cleanup without Docker; not runtime proof. Raw transport receipts stay local to honor privacy. See gate-evidence-integration.json for compact hashes/results.

Full Utility browser gate with isolated runtime libs **PASS**:158 passed,6 existing conditional skips,0 failed,0 flaky, all4 scheme/viewport projects; no accessibility allowances added. Receipt captures raw exit0 and fresh child report. Initial launch-only failure preserved privately. Refetched main remains baseline1e4e58f. Slice2 is now gated and independently reviewed; sign-off commit follows.
