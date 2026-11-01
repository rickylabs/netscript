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

## Immutable implementation-head proof

Strict checker PASS at committed head `5e77d73e1ffcb4176978e875ba66940ab4726806`, all1116 files, zero differences and no allowances. Worktree was clean and main1e4e58f remained an ancestor. Proof and raw log hash in exact-implementation-proof.json. Only after this result did slice3 start deleting bounded CI/tool behavior.

## Slice3 strict CI policy

After immutable5e77d73 proof: removed bounded mode from checker/workflow/README, wired real shuffled native regression into Pages CI, updated existing classifier test to require strict command and reject allowance. Workflow contracts72/0/0, scoped2-file check/lint/fmt PASS. Obsolete bypass argument negative control exits nonzero before build. Separate read-only slice3 content review running; final exact-head strict/browser/native quality evidence and formal IMPL remain pending.

Fresh-cache native `deno ci` with copied exact site manifest/lock succeeds without minimum-age bypass and preserves lock bytes. `deno ci` is inherently frozen on2.9.7; an additional --frozen flag is not accepted. No system/cache deletion, root lock untouched.

Slice3 independent content review **PASS**. Adopted its nonblocking README suggestion: link retained evidence through durable PR2575 rather than a removable run path. All4native carrier freshness gates PASS (agent-docs-prose, MCP export corpus, assets barrel, publish assets); no generated source or root-lock churn. PR thread gate PASS0threads. Commit slice3 with this worklog/context and dated lesson, then run exact-head strict/browser/quality/fixtures/workflow gates and formal IMPL evaluation.

Reconcile3: main remains1e4e58f; no competing2453 implementation, related token/layout issues remain out of scope. Draft PR2575 carries Refs-only/no labels per explicit owner policy; no merge/close action. Original failed proof and first plan failure retained.

## Strict-CI source-head gates

At b756ee6: strict all-output PASS1116/differences[]; complete browser PASS158/6existing census skips/0failed/0flaky,72axe reports/zero serious-critical; quality:gate PASS;94combined tooling/workflow/bridge tests and39source fixtures PASS; all4native carrier freshness receipts PASS. Root lock/generated source unchanged. Exact receipt heads/hashes in gate-evidence-strict-ci.json; raw receipts private. Final independent IMPL evaluation running in the same read-only Opus5.5/high session. Its observed model matches requested model in every transport.

Actual classifier selects all impacts because its contract test changed. Hosted core/scaffold/Fresh lanes are currently draft-policy skipped, Pages build succeeds and browser runs; no runtime pass inferred. Repo pr-checks can return PASS with pending jobs, so readiness requires inspecting all current rows.

## Final scoped evaluation

Mandatory independent IMPL-EVAL **PASS** at b756ee6 in the same read-only Anthropic Opus5.5/high session. Evaluator independently checked receipt hashes/heads and full browser results; reran native shuffle, root bridge,70classifier tests and obsolete-flag rejection, with locks unchanged. No implementation findings. CLI runtime remains unproven without Docker and hosted readiness is separate. Close-gate PASS with Refs-only/no closing issues; thread gate PASS0threads.

This evidence-only sign-off commits evaluate.md and compact exact-source-head gate hashes. Product surface stays identical to b756ee6. Final head must be rebound by strict two-build comparison plus byte-for-byte equality to the browser-tested1116-file manifest, and a short same-session read-only attestation published as a PR phase comment. This avoids committing an ever-moving self-referential attestation. Current-head hosted checks are assessed after that; do not infer all-green from pr-checks exit0 when any row is pending.

Close: dated lesson and several specific memory notes retained. No accepted debt or independent remainder to fan out. Owner owns issue disposition, run cleanup and merge. Original strict failure and first plan failure preserved.
