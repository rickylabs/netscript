# Worklog

## Design

1. **Public surface:** adopt startWorkersService and startStreamsService on singular service
subpaths, required native auth plus optional native CORS/listener options; preserve legacy
plural exports. Adopt exact anonymous rules and native reader headers from prerequisite PRs.
2. **Domain vocabulary:** native guarded/public policy, native principal, exact anonymous
request, workspace CORS origins, factory-owned upstream, caller-owned listener/KV, reader
headers. No new authorization system or process-manager vocabulary.
3. **Ports:** existing native authenticator/authorizer, listener, SDK contribution, plugin
context, KV runtime and durable-streams storage/proxy/client. No new universal interfaces.
4. **Constants:** preserve existing plugin identifiers, protocol method/header lists, legacy
public reasons and native environment keys. Exact origins/credentials are test-owned values.
5. **Commit slices:** S0 audit/plan, S1 service, S2 reader headers, S3 startup factories,
S4 exact-head handoffs, with owners and proving gates in plan.md.
6. **Deferred scope:** #829 process-manager migration, #2364 resolver, automatic credential
adoption, release and downstream certification; these are not prerequisites for this seam.
7. **Contributor path:** the host startup guide explains native types, explicit SDK identity,
reader credentials, defaults, migration boundaries and lifecycle ownership in one place.

## Bootstrap

Read complete assignment, live issue/comments and all three PRs. Asked native MCP guidance
then documentation search. Consulted shared NetScript memory. Resolved feature route; recorded
owner evaluator override verbatim. Audited real merge-base footprints and all eight acceptance
entries in research.md. No product edits yet. Existing draft 2421 is the early review surface;
2422 and 2423 remain non-draft by owner instruction. No acceptance is marked complete yet.

## PLAN-EVAL round 1

FAIL_PLAN; report preserved verbatim in plan-eval-round-1.md. Corrected the four concrete
plan gaps, verified workflow push capability without storing credentials, and recorded
exact added paths before implementation. All three native review-thread gates pass (0 threads).
Re-steering the same independent evaluator for round 2. No product edits.

PLAN-EVAL round 2: PASS, separate Anthropic session on the owner-requested model.
Implementation may begin. Next: S1 on original branch fix/native-service-policy.

S3 research qualification of the adopted, not-yet-integrated factories: 57 pass, 1 fail,
0 ignored. The sole failure is a 10-second checked compiler-child deadline; 57 runtime,
permission, TLS, durability and cleanup controls pass on Linux. Recheck the failing control
on the integrated graph with no concurrent heavy compiler jobs before changing any deadline.
S2 independent exact-head review returned MERGE on7421a60f2, with current CI/runtime explicitly
pending. S1 has no code blockers, but coordinator runtime arming and final CI proof are pending.

S3 main merge preserves both complete debt groups and main reference navigation links,
adding only the new singular service table row. No runtime source conflict resolution.

S3 prerequisite integration: merged original service branch at
0e24d2d67ec746fdb57100568a1ed1120b15bac3, whose runtime source was independently reviewed
without code blockers at7dd579d7. The later delta is its reviewed documentation repair and
canonical prose carrier. Required service CI/runtime proof is still pending, not inherited as
PASS by this integration. No source conflict required manual resolution.

S3 prerequisite integration: original reader-header branch at
7421a60f2ec0395a7e0f0ce76cbe9a24dd25980b is integrated. Its independent exact-head MERGE
verdict is source acceptance with explicit pending CI/runtime qualification. Debt conflict
preserves all complete factory/header/main entries without expiry or scope changes. No
auth/header implementation conflict resolution was required. Final union gates are next.

S3 native contract integration: merged service head37f26c1dc07da57a83a7cfbccc5344a349d1414c.
Its anonymous-request contract keeps one native structural owner and derived aliases, removing
the downstream private-reference finding without adding facade exports, casts or debt. Service
root check, quality and service/MCP static publish gates pass at that source head. Incoming
source and generated corpus merged without manual conflict resolution. Final union gates remain
necessary; no prerequisite runtime CI result is inherited as PASS.

S3 baseline memory: workers OpenAPI document returnsHTTP500 on exact main
6a71cd0599673d70cd6311de3bb20b2d6a9dde2c using the public legacy factory and owned KV.
The host-policy test compares legacy/factory parity; it does not assert a healthy document.
SDK describe/listJobs, REST, canonical/deprecated RPC, actual SSE and stream publication pass.
Missing guarded credentials still401 before OpenAPI handling. This inherited router defect is
not introduced or fixed by startup policy. No secret material is published in evidence.

Native auth defaults protect/api only. Raw streams hosts must explicitly selectprotect:['/']
or their intended prefix. All singular examples and the one host guide now say so; factories
forward native policy unchanged. Shared runtime sandbox flags are opt-in for DenoKV and native
self-signal only; negative permission controls and existing budgets remain unchanged. Checked
workers compiler consumers alone use30s after two isolated10s deadline failures.

Full initial integrated plugin suite230/1/0: only failure was the stale exact export list;
all native host, lifecycle, TLS, storage and compiler controls passed. Corrected that list
without removing any target; complete suite is rerunning. Plugin lint/fmt204 files pass;
quality/architecture passes, full JSDoc examples479 checked/no exemptions pass, site snippets
26 pass, all three new guide examples compile with root lock unchanged. Docs links and
exports drift pass. Singular factory doc lint0 each; full packages workers2/streams3 match
main, as measured by normalized per-file/rule counts. See final gate summary when complete.

S3 authored source slice is complete: final full workers/streams suite231 passed,0 failed,
0 ignored. The only prior full-suite failure was repaired by retaining all legacy published
export targets and adding./service to the exact expected list. Both package JSR static audits
have no FAIL findings; raw publication dry-runs follow source freeze. Native lint/fmt204/204
pass, including the export-list repair. Quality/architecture, all479 JSDoc examples, all26 site
snippets, three new guide examples, docs links and export drift pass. New factory facades have
zero doc diagnostics and normalized full-package findings equal exact main. Canonical prose,
asset-barrel and publish-asset generation succeeded; only owning carriers changed. Root check
is still running, publication checks and final generated-corpus freshness remain next.

Reconcile: streams legacy now delegates with unchanged public reason/wildcard CORS, while
the singular factory keeps native workspace defaults. The combined worker fixture uses a real
stream server and producer; no fake transport, cast or suppression was added. All new test flags
are opt-in and do not change permission-negative defaults. Source and evidence are preserved
on the adopted branch; no assignment/lock/private transcript is staged.

Final union root check PASS:3849 selected TypeScript files,33 batches,0 diagnostics.
Canonical export-corpus regeneration PASS:35 packages,303 subpaths,8977 symbols. New singular
service entrypoints are in the public corpus; no export-facade closure cap was increased.
Integrated the original service branch's final record-only head
b2e31245020b651a32eb3b476c61a8198a1b42c0; its source equals the already integrated37f26c1d.
S1 independent round2 still found no code/architecture/migration blocker and returned
VERDICT: CHANGES b2e31245020b651a32eb3b476c61a8198a1b42c0 because coordinator runtime
CI was unarmed. Round1 was also CHANGES on7dd579d7 for external proof; prescribed two-terminal
failure limit ends S1 evaluator loop. Both decisions were surfaced on its PR and coordinator.
S2 exact7421a60f2 now has real green core/build/quality/close and both runtime tiers, plus
its independent exact-head MERGE. The existing READY comment was updated, without moving head.
Final factory publication/freshness gates and independent source review remain next.

S3 layout slice PASS: complete native workers/streams suite231/0/0 after grouping adopted and
new service tests under services/src/tests/. All19 moved-test/helper files type-check; plugin
lint/fmt still covers204/204 files with no drops, and quality/architecture passes. Both service
source directories now have exactly12 immediate entries. Workers JSR audit retains only root
metadata20 (main19), worker22 and src/cli13 advisories; streams has no cardinality advisory.
The required workers CHANGELOG is the sole new metadata entry, recorded as proposed bounded
WORKERS-HOST-METADATA-CARDINALITY-2396 debt for independent acceptance; no public export,
source cap, permission, budget, assertion or scan exclusion changed. Package layout migration
of existing public roots is separate from this bounded startup seam.

Reconcile: thirteen renames retain fixture content and all test names/controls. Only parent
module URLs, plugin-root resolution and fixture imports change. Historical paths remain in
old run evidence. Final current paths are under services/src/tests/. Two member dry-runs and
canonical freshness follow this clean checkpoint; other member source remains identical.

S3 final local gate checkpoint: all six published-member dry-runs and four canonical freshness
gates PASS. The relocated service test slice has final231/0/0 plugin tests, scoped19-file check,
204-file lint/fmt and full quality/architecture PASS. Native SDK credential/discovery/ownership
controls add137/0/0. Sanitized durable gate evidence is gate-summary.json; unchanged baseline
documentation errors remain explicitly FAIL, with exact normalized comparison. No local
scaffold runtime, label edit, lock churn, release, merge or private transcript is included.
Source is ready for independent preliminary implementation review. Final review will use the
exact pushed head; CI cannot be claimed green while draft.

Independent IMPL round1: CHANGES at6a6e390fcdaf8bab60d5cf1a1c1e280e9ab83a8e.
The sole blocker is workers service-test-fixture.ts matching services/**/*.ts but missing
existing publish exclusions. All other source/migration behavior was accepted; draft CI was
correctly unproven and not counted as a source blocker. Both proposed postpublish/metadata
debts and unchanged native facade debts were accepted. Exact fix scope before editing: move
services/src/tests/service-test-fixture.ts into that directory's test_utils/ child and update
its four local imports. This reuses existing publish exclusions without adding any filter or
changing fixture logic, tests, source cap or API. Re-run native worker tests, scoped wrappers,
workers dry-run and native pack file-list inspection, then re-steer the same evaluator.

IMPL round1 blocker repaired: workers helper now lives under the existing excluded
services/src/tests/test_utils/ convention. No publication filter was changed. Native JSR
dry-run debug included-file inspection proves92 intended files, both factory/legacy entries
and no tests/helper; sanitized list is publish-file-list.json. Full workers tests148/0/0,
all6 current worker helper/test files check, worker lint/fmt131/131 and full quality/architecture
PASS. Streams source/tests remain byte-identical to the83 passing controls in the prior full
231/0/0 union. Both proposed debt entries are now marked independently DEBT_ACCEPTED at
the exact round1 head; no bounds, expiry, runtime gate or numeric facade verdict was relaxed.

Same independent evaluator must now review this corrected pushed head. Round1 found no other
source blocker. CI is still draft/unproven. Final acceptance-evidence.md maps all eight issue
entries, with published graph and runtime CI limits explicit.

Independent source review round2: VERDICT: MERGE
ac50f54502dd5d2f07a62cdd2b562094eb5dee21. The reviewer verified the byte-identical
helper move, four imports, native included-file list, unchanged factory behavior and accepted
debt limits. No source/architecture/publication-shape/migration blocker remains. This final
record checkpoint changes only run context, not source, tests, exports, generated data or debt.
After push, mark the original draft ready, notify the coordinator to arm required runtime CI,
and run final exact-head evaluation in this same session. Terminal CI/final verdicts are
published on the PR and canonical final file handoff; they must not be inferred from this
pre-readiness checkpoint. No merge readiness is claimed while required CI is unproven.

IMPL round3 CHANGES at2a9efb05bcb49e38f5c6bbba454e0a51db5b595c: source remains
accepted, but current main advanced and conflicts prevent core pull_request CI from starting.
Fetched current main4aa734e2b6ca93119462ec2e0cd34b729df51bfd (telemetry/locked fixture
repair #2476 and worker retry/dead-letter #2481). Merge conflicts affect only canonical prose
and publish-asset carriers. No authored runtime conflict. Resolve carriers from incoming main
then regenerate canonically over the union; also regenerate the auto-merged export corpus.
Incoming root/member/fixture lock changes are exact main, not local dependency churn. Both
prerequisite PRs still merge cleanly, so their stable reviewed heads are not rewritten.
Broaden final union validation for the new worker runtime and telemetry interactions. Record
current-main documentation baseline separately; preserve initial6a71cd05 comparison history.

Current-main merge source reconciliation:4aa734e2b6ca93119462ec2e0cd34b729df51bfd is
integrated with no authored runtime/test conflict. Canonical prose regeneration and both
asset generators pass over both main's worker retry docs and the host guide. Only generated
carrier conflicts needed resolution; incoming source/locks were retained exactly. Commit the
merge locally so the export-corpus generator can inspect a clean source tree, regenerate its
auto-merged carrier, then push the complete coherent union. Local runtime/tests/quality and
publication gates must be refreshed for new main before the final same-session evaluation.

Current-main union validation PASS at sourcea45a1db4014e3a8f987497a80a8bb2d7875af693:
root3857/33, combined tests1504/0/4, lint/fmt333/333 with no drops, quality/architecture,
six member publication dry-runs, four canonical freshness gates,479 JSDoc examples and export
drift. Four ignored tests are unchanged main Redis retry variants requiring an explicit test
Redis URL; no skip was added by this lane. Native JSR includes93 intended files/no helper.
Full doc findings exactly match refreshed main4aa734e2 (service0,workers2,streams3,Fresh45);
both new factory paths0. Native mergeability confirms MERGEABLE, so the prior conflict blocker
is fixed. Main was fetched again and remains4aa734e2. Only run evidence changes next; final
same-session round4 must review the exact pushed head and current CI without waiting for CI.

2026-10-31 continuation: previous goal turn made implementation progress and published the
READY handoff. Current-state audit found one newly completed CI failure at exacta4dc7053:
quality job124412622901 fails only Aspire manifest freshness (phase1, expected13.5.3).
Current main4aa734e2 quality job124403708041 passes that same parity step. CI's durable
quality receipt confirms no pin violation; inventory freshness is the sole failure. The
remaining test shard has now succeeded. No source/milestone/label change is inferred.

Exact scope addition before regeneration: .llm/tools/validation/fixtures/aspire-surface-manifest.tsv,
through its existing aspire-surface-manifest.ts generator only, plus this run's evidence.
No checker, scan scope, classification, toolchain pin, fixture compatibility rule or runtime
gate may be weakened. Apply aspire-upgrade's canonical inventory procedure without a version
bump. Reproduce native parity, inspect the exact diff, then run all remaining quality steps
that CI skipped after parity so the final fifth evaluator round is not spent prematurely.
The fourth implementation verdict is MERGE at a4dc70531c3e3a8c3139ecfa16419126c9551463;
only one owner-authorized feature evaluation round remains. Reuse the same independent session.

Continuation quality repair complete: canonical Aspire inventory adds exactly one S11
public-doc row for the new host guide. No framework source, checker, scan exclusion, pin,
manifest classifier or runtime gate changed. Native parity PASS: expected13.5.3,993 paths,
0 failures, unchanged14 deferred/4 informational/3 skipped, fresh=true. Full workspace publish
dry-run, cold AI peers and critical advisory audit all PASS with durable receipts. Parent
CI now has all core test/check/browser shards and check-test SUCCESS; quality failed only
at the stale inventory step. Its earlier steps all passed and its skipped trailing steps
are now proven locally. See continuation-quality-evidence.json; no skipped runtime is green.

Reconcile: this one-row maintained-inventory correction plus run evidence is the only delta
from accepted a4dc7053. Push the coherent correction, keep both prerequisite heads stable,
and re-steer the same evaluator for feature round5 at the exact new head. This is the final
allowed round; no fresh evaluator or sixth review is authorized. Existing runtime opt-in
and postpublish proof remain coordinator-owned and unproven.

Current-state continuation after prerequisite merges: the coordinator merged #2422 and
#2423 into main, alongside reviewed Fresh UI contracts #2467. Main is now
204a71b1ef0133faa07ce5c191e4170b5cb76171. Exact94393bc8 code and fifth independent
MERGE remain historical proof; live #2421 is now CONFLICTING. Read-only merge-tree preview
finds only debt-registry and generated export-corpus conflicts. All main integration remains
authorized under the original scope. Resolve both canonically, preserve every accepted debt
entry, retain all incoming main source and refresh the relevant union gates.

Evaluation boundary: all five owner-authorized feature rounds are spent. Do not launch a
sixth round, reset the counter, replace the evaluator, or claim94393bc8's exact-head verdict
as acceptance of a new commit. The concrete current-main integration and its tests can be
prepared/pushed, but its new exact-head independent sign-off must stay UNPROVEN and be
surfaced to the coordinator as an authorization/process decision. Source behavior itself
was accepted in round5; a source equivalence claim is narrower than a new-head MERGE verdict.

Post-prerequisite integration resolution: retained the complete workers22/streams21 native
closure entries at the sole debt conflict (incoming side empty), without expiry/scope edits.
Other main debt entries merged untouched. Took incoming generated export corpus only as a
generation seed; canonical regeneration follows this clean merge checkpoint. Canonical prose,
asset-barrel and publish-asset generation succeeded; Aspire inventory regenerated. No authored
feature/runtime/test conflict exists. Workers/streams service source, worker reader source,
native service, Fresh stream runtime and both plugin export maps are byte-identical to the
previously reviewed94393bc8; new UI source comes directly from reviewed main #2467.

Both prerequisites are now merged by the coordinator: #2422 runtime reports120/0/0 and
113/0/0 and close-gate/core CI PASS; #2423 all required CI/runtime PASS. This run performed
no main merge or label edit. New integration independent sign-off remains UNPROVEN because
the feature's five evaluator rounds are exhausted. Prepare source and gates for coordinator
review; preserve94393bc8's final MERGE as historical/source-equivalence evidence only.

Canonical post-prerequisite export corpus regeneration PASS:35 packages,305 subpaths,9003
symbols (new main includes the Fresh UI contracts exports). The feature service/runtime/test
paths and both plugin export maps remain byte-identical to reviewed94393bc8. Incoming UI
source is retained exactly from main. This carrier-only continuation finalizes the coherent
merge tree; post-merge root/union tests/quality are running. Its new exact-head independent
sign-off remains unproven at the spent5-round cap and must be decided by the coordinator.


## Design — reconciliation relaunch mc009d-r2-2396

1. Public surface: existing workers/streams native factory contracts unchanged.
2. Vocabulary: merge reconciliation and generated carriers; no new domain terms.
3. Ports: existing generators, native service runtime and wrapper test runners.
4. Constants: existing task/gate IDs reused; no new product constants.
5. Commit slices: one coherent main merge/carrier refresh plus run evidence; gates and files
   enumerated in reconciliation-plan.md. No history rewrite or intermediate broken push.
6. Deferred scope: hosted scaffold.runtime to coordinator; published graph to release captain.
7. Contributor path: this run context-pack.md links source, tests, acceptance and current gates.

Selected PLAN-EVAL is mandatory under the relaunch brief; waiting for its independent verdict
before merging. Matrix resolved; owner evaluator override recorded verbatim in supervisor.md.

Independent reconciliation PLAN-EVAL: PASS before merge. Requested/observed model claude-opus-5-5, high effort, separate Anthropic session, read-only tools and closed stdin. See reconciliation-plan-eval.md.

Merge started against7ee9c3ed04607eb0967f9ef0ef4cd874652817aa. Exactly three non-source conflicts. Debt conflict resolved by retaining both complete blocks, unchanged. Generated files will be overwritten solely by generators. Regenerate prose and publish-assets before corpus so Deno documentation never parses conflict markers in a carrier.

Canonical chain completed: prose → publish-assets → corpus (--allow-dirty during merge) →
assets barrel. Four freshness checks, quality:gate, Aspire parity, docs accuracy and release
preflight PASS. Structured lint has zero occurrences; fmt365 selected, zero findings.
Both parents' debt headings retained; workers/streams services source matches accepted PR.
Run-wide git diff --check flags whitespace only in incoming main's retained historical run
artifacts; no cleanup is authorized or needed for this bounded reconciliation.
Reconcile: live main advanced to1d274c16bd3163eb72a40ea3f2e3f0523861159f (KV pagination
and workflow docs). Preserve first merge's checks, then take that main through a second normal
merge before final push/review. No feature scope expansion or lock churn is inferred.

Combined suite terminal:1526 passed/1 failed/16 ignored. Sole failure is workers non-contract
entrypoint doc lint, private-type-ref: native AuthzDecision now references ProcedureErrorCode
(introduced on incoming main). Full original test remains red; no test assertion or export/debt
bound is changed. Both factories still preserve their reviewed source. This merge-only brief
expressly forbids reimplementation; closure repair would grow the exact22/21 named surfaces
and requires coordinator disposition. Report acceptance8 and complete-suite proof as unproven.

Slice1 committed/pushed2d62297b0 with root4034/34/zero diagnostics. Reconciled PR comment and review-thread gate. Slice2 merges main1d274c16bd3163eb72a40ea3f2e3f0523861159f normally: only prose/publish generated conflicts. Incoming KV source/lock state preserved exactly. Regenerate same four carriers; rerun root/combined union tests and freshness/quality gates.

Structured singular-factory doc lint reproduced the integration defect in BOTH workers and streams: one private-type-ref each, zero missing JSDoc. No test or source changed. Final source union retains incoming KV byte-for-byte; no source conflict or leaf lock churn. Updated four-carrier and quality/Aspire/docs checks all PASS after the follow-up merge.


## Final reconciliation source checkpoint — mc009d-r2-2396

Current main1d274c16bd3163eb72a40ea3f2e3f0523861159f integrated normally; first merge
2d62297b0db8b85be3c5ad9a7ba1f95d8bc9d4e3 already pushed/commented. Second merge only
needed generated prose/publish resolution; all four canonical generators rerun. Factory
runtime/export/test source unchanged; incoming KV and lockfiles match main exactly. Debt rows
from both parents and exact22/21 facade bounds retained unchanged. No goal/report file tracked.

Final gates: root4039 files/34 batches/zero diagnostics; all four freshness gates;
quality/architecture; Aspire parity; docs accuracy PASS. Release preflight PASS on this
reconciliation (incoming follow-up has no import-attribute changes). Scoped lint/fmt365/365,
zero findings/no dropped targets. Final combined suite1872 passed/1 failed/18 ignored,
exit1, duration691998ms. All actual runtime/lifecycle/SDK/FreshUI/KV controls passed; the sole
failure is workers non-contract entrypoint doc lint at type-refs_test.ts. Independently
reproduced BOTH singular factory doc-lint checks: one private-type-ref each, zero missing
JSDoc. AuthzDecision references main's new ProcedureErrorCode. No diagnostic suppression,
assertion removal, export addition or debt-cap change was made. This is an actual integration
blocker, not a dependency warning. See memory-authz-doc-closure.md and reconciliation-gates.json.

Acceptance1–7 retain their runtime evidence and original limits; acceptance8 remains unproven
for native documentation closure as well as the separately retained published graph debt.
Hosted scaffold runtime and required same-head CI remain unproven; coordinator alone arms
runtime/labels and merges. No local scaffold.runtime, new PR, rebase, force-push, release or tag.

Next: push this source checkpoint and run only the one explicitly owner-authorized independent
merge-delta evaluation at the exact pushed head. Publish its truthful verdict on PR2421. The
final verdict and CI snapshot belong on the exact-head PR comment and canonical report; do not
create another commit solely to store them, which would invalidate their head binding.
Use the final-report file handoff for the canonical issue reply; queueing is not publication
confirmation. Every acceptance entry must retain its stated limitations.

## Design — finishing relaunch mc009e-r3-2396 (before implementation)

1. Public surface: existing workers/streams ./service signatures retain native identity;
   close the AuthzDecision public error-code reference, conditionally one export each.
2. Domain vocabulary: ProcedureErrorCode is the native service authorization denial code,
   introduced into AuthzDecision by main #2492; no new local vocabulary or representation.
3. Ports: existing @netscript/service/auth type identity; no new runtime dependency or port.
4. Constants: existing named debt IDs and gate catalog IDs, no new runtime string literal.
5. Commit slices: one finishing source/debt/carrier/evidence slice, exact files and gate set
   in finishing-plan.md; separate evaluator review required before its commit. A normal main
   merge checkpoint may precede it and must include the same run's context/worklog update.
6. Deferred scope: #829, #2364, broader signature redesign and actual published canary graph
   remain their existing owners' work; required hosted e2e-cli remains coordinator-owned.
7. Contributor path: plugins/workers/services/mod.ts shows the native closure pattern and
   linked F-5 debt; streams uses the same pattern without PluginServiceContext.

Owner routing override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after,
both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only,
stdin closed, blockers only." The pinned matrix was queried as JSON; this owner-specific
route preserves independent sessions and different vendor families. All prior verdicts stay
historical; the relaunch expressly authorizes one finishing-delta evaluation.

### PLAN-EVAL round 1: FAIL_PLAN, one blocker

Independent Claude review identified the same transitive dependency as the scratch probes:
ProcedureErrorCode refers to native PROCEDURE_ERROR_CODES. No implementation edits made.
finishing-plan.md now explicitly stops if the approved single re-export remains red.
All existing native names tested are still required; none is redundant. A second independent
plan round reviews that stop branch; no fallback export or native source redesign is inferred.

### Finishing merge-only slice: stop condition confirmed

Same-session independent PLAN-EVAL round2 PASS authorizes only the conditional plan and
its explicit STOP branch. Normally merged mainf6839463668c5dae4ca7234d26909e74e10b89c0
from baseline d3a52cb1bf09e9baf0faf857a76e5102fa3c60a4 with no conflicts. All53 incoming
changed paths match main except the canonical corpus union and the retained host-guide
Aspire inventory row. Both factories and all their tests, native auth, accepted debt22/21
and locks are unchanged. All four canonical generation tasks succeed; corpus generation
uses its documented --allow-dirty on the coherent uncommitted merge, freshness uses --check.

Gate receipts: all four carrier freshness checks and quality:gate PASS. Original public
workers test remains3 passed/1 failed/0 ignored, exit1; the sole failing assertion is the
same real documentation closure. Both actual facade doc-lint commands fail1. Post-merge
scratch one-name candidates fail on PROCEDURE_ERROR_CODES; two type-only native names pass
at24/23. All43 individual native-name omission controls fail (22 workers,21 streams).
No production repair, assertion reduction, debt expansion or native representation change.
Full combined suite, root check and publish revalidation were not rerun after this explicit
STOP condition; no new-head proof is inferred from historical results. Review-thread gate0.

Reconcile: current PR #2421 remains the sole branch/PR. Its prior supplementary research
comment6541305379 independently documented this same two-name need. This run reconfirms it
at the latest main union. Owner's one-name23/22 approval does not include24/23. The final
canonical handoff must be BLOCKED with the one bounded disposition question and options.
finishing-proposed-closure.patch is unapplied research; it does not amend accepted debt.

Independent substantive checkpoint review: CHECKPOINT: PASS. The separate Anthropic reviewer
verified all53 incoming paths, exact51 main-owned files plus the two carrier/inventory unions,
unchanged factories/auth/tests/debt/locks, no unmerged files, and candid blocked evidence.
finishing-checkpoint-review.md records that review. This is approval to commit the merge-only
BLOCKED checkpoint, not feature acceptance. Final exact-head IMPL-EVAL follows in that same
separate evaluator session after push; no later commit solely for its verdict.

## Design — coordinator-authorized native-source repair (before code)

1. Public surface: same native ProcedureErrorCode union/constant and root/auth exports;
   singular workers/streams add only the native type, reaching23/22 doc-complete names.
2. Vocabulary: unchanged two procedure availability codes; no new domain concept.
3. Ports: existing native auth identity and service public surface-diff tool; no runtime port.
4. Constants: unchanged PROCEDURE_ERROR_CODES, checked against the canonical union.
5. Slice: native declaration and existing availability test, two facades, two debt entries,
   canonical carriers if stale and run evidence. All gates in native-source-repair-plan.md.
6. Deferred: hosted runtime arming and actual published graph remain existing owners' work;
   unrelated plugin runtime and framework startup APIs are unchanged.
7. Contributor path: packages/service/src/auth/types.ts owns the contract, constant and
   explanation for keeping aliases independently re-exportable.

Coordinator #2474 comment6541660112 resolves the prior genuine blocker and explicitly
requests a fresh source repair. Prior stop-branch PLAN rounds remain immutable; this new
phase re-steers the same independent plan evaluator for its newly authorized source scope.
No source changes before this phase's PLAN-EVAL PASS.

Native source first check: both actual facade doc-lint commands now exit0. Initial targeted
test process correctly failed compilation at isolatedDeclarations TS9010/TS9027 rather than
running tests. Explicitly annotated the exported constant with its unchanged readonly
literal shape; as const satisfies still checks every value against ProcedureErrorCode.
Raw full-service snapshot initially reported exactly the expected two ProcedureErrorCode
representation changes at root/auth and no other signature changes; repeat after annotation.

Native repair targeted tests PASS15/0/0, including the original public documentation check.
Actual baseline-vs-current root/auth compatibility fixture PASS1/0/0: both native code types,
full readonly const shapes and runtime objects remain exactly equal. Full eight-entrypoint
inventory retains every exported name. Raw signature hash diff reports FOUR representation
changes, alias+const at root/auth; before doc inference incorrectly widened as-const properties,
where explicit annotations now render their actual readonly literal types. The raw report is
retained transparently in native-source-api-diff.json; no scanner or baseline is modified.
The semantic compatibility proof passes; no24/23 fallback is used.

Independent amended F-5 debt re-review PASS recorded in native-source-debt-eval.md. Exact
inventories23/22, native ProcedureErrorCode identity, #2492 cause, owners,2026-11-10 deadline,
no extension/growth and existing closing gates all verified. This is numeric DEBT_ACCEPTED,
not numeric F-5 PASS or source/runtime acceptance.

All four canonical carrier generations and freshness gates PASS; quality:gate PASS. Scoped
four-file check/lint/fmt PASS; native service eight-entrypoint and both actual facade
structured doc-lint reports contain zero findings. All three service/workers/streams member
publication dry-runs and JSR audits exit0. Complete combined tests and root check still run;
terminal results must be recorded before source review/commit. No lockfile changed.

Preliminary substantive source review: NO_SOURCE_BLOCKERS. Same independent implementation
reviewer verifies source authority, semantically identical native API and exact23/22 closure.
It reserves slice signoff until the combined suite is terminal. Corrected its two stale
"derived type" documentation references to "union" under the recorded scope addition;
canonical prose/carrier regeneration follows. No code/test change after the passed gates.

Final prose/reference wording refresh regenerated canonically. Final four freshness checks,
docs accuracy and final root check PASS. Concurrent final quality scan failed NotFound on a
worker u3-headers negative-control fixture deleted by the combined suite between enumeration
and read. This is a concrete source-sweep/test scheduling race, not a source quality finding.
Preserve its receipt; rerun final quality and root check only after full tests clean up.
No scanner/exclusion/suppression change is authorized or needed. See memory-sweep-test-order.md.

First complete suite exits1:1872 passed/1 failed/18 ignored. The original public-doc test
now passes; sole failure is the trusted-TLS child denying a read of native scalar.generated.ts
while asset generators were being run concurrently. Investigate with the unchanged focused
control on stable source, then rerun the FULL requested scope without generators/sweeps.
No test permission, assertion, timeout or source code is weakened. First failed receipt is
preserved. The tentative source-generation race must not be relabeled as proven causation.

Stable-source focused TLS retry PASS1/0/0 with unchanged source and original child permissions.
Stable quality:gate and root check PASS after fixture cleanup. The full exact combined scope
is rerunning sequentially, with no source writers/generators/broad sweeps; its result, not the
focused retry, is required for full-suite acceptance. No new ignore or filter in the full run.

Final stable FULL exact combined suite PASS1873 passed/0 failed/18 inherited ignored,
exit0,549185ms. No filter or permission/assertion/timeout/ignore edits. All generators and
broad sweeps completed before this rerun. Original public-doc test passes; unchanged TLS
control passes both focused and final full scope. First failed full attempt is retained.

All required local source gates now terminal green: stable root4045/34/0; scoped4-file
check/lint/fmt0; full service8+both facade docs0; actual-baseline compatibility1/0/0;
four canonical freshness gates; quality/architecture; docsaccuracy; service/workers/streams
member dry-runs3/3 and JSR audits exit0 with recorded existing warnings. Native source API
semantics are unchanged despite four transparently retained syntax-hash representation
changes. Exact facade inventory23/22; independent amended F5 reviewPASS; fixed deadline.
Evidence/native source hashes in native-source-gates.json; original acceptance mapping now
reconciled in native-source-acceptance-evidence.md. No lock changes. Next: SAME independent
source reviewer final slice signoff, then commit/push and exact pushed-head delta review.

Independent substantive slice gate CHECKPOINT: PASS, recorded in native-source-slice-review.md.
Reviewer recomputed all9 source hashes, checked full suite receipt timing/scope, exact native
API equality/debt bounds and unweakened assertions. Source slice may now commit and push.

Reconcile before final delivery: main advanced to4e018ad0bab9b9b90daf4764a035fd3ff879b9fa
with #2510 producer epochs, #2482 listener recovery and #2513 render provenance docs. These
include worker/stream runtime paths inside the full test scope. Finish this reviewed native
slice, then normal-merge that exact main, preserve incoming authored source, regenerate only
canonical carriers, and rerun union gates before the final exact-head review. No force push
or rebase, no merge to main. Extra consumer probe: incoming producer-session_test.ts.

Native source slice committed/pushed76bf7ee14921cb86f9c0d7f6363a1f8b88185021; PR phase
comment6541994907 records its full local source proof and independent slice/debt review.
Normal main merge4e018ad0bab9b9b90daf4764a035fd3ff879b9fa has NO conflicts. Native auth,
strengthened test, both facades and entire debt ledger are byte-identical to reviewed76bf7ee.
No lock changes. All four carriers regenerated canonically. Final four freshness checks
finish before other sweeps; all source writers/sweeps finish before the combined union run.

Final current-main union full combined PASS1897/0/19, exit0,477856ms. Scope retains the
entire original14-root suite plus incoming producer-session_test.ts. Added ignored case is
main's Redis listener recovery control without its test URL; none was added by this leaf.
All27 frozen source hashes match before/after; native repair and debt unchanged. No locks.

Final union all local gates terminalPASS: root4048/34/0, quality/architecture, docsaccuracy,
Aspire parity, full service8+both structured/raw facade docs0, four freshness gates, allFIVE
changed-package publication dry-runs (service/workers/streams/MCP/CLI). Fresh JSR audits0 with
recorded inherited warnings. See final-union-gates.json and final-union-acceptance-evidence.md.
Next: same independent source reviewer merge-slice signoff, then normal merge commit/push,
final exact-head IMPL-EVAL on complete delta since d3a52cb1b. Pending/skipped external gates
remain unproven; no new source writers or untracked tests were retained.

Independent final union substantive slice CHECKPOINT: PASS, recorded in final-union-slice-
review.md. Reviewer verified all27 source hashes, native repair identity, all63 incoming
paths (61 exactmain plus2 canonical carriers), unchanged locks/debt and the complete suite
scope/timing. All required local gates pass; unproven external gates remain explicit.
Clarified publication scope: FIVE dry-runs, three source-member JSR audits. Durations are
explicitly child477856ms versus gate478001ms (startup/receipt overhead), not conflicting data.
Reconcile: final target main4e018ad0b is fully integrated with no authored conflict resolution.
Commit/push this coherent merge, then same-session exact-head review; preserve that head.

Final exact-head IMPL-EVAL MERGE at32264fc11dbc3b1bbd044ba8010c0f4848fab506 accepted all
source and verified all27 hashes. PR comment6542261032 records it. Final GitHub audit then
found the PR CONFLICTING: main advanced during evaluation toabe9d3e43. Thus READY was NOT
queued and no merge permission inferred from the accepted source head. New main changes
only docs/docs tooling, test fixtures and image pre-pull helper, plus generated carriers;
no production framework runtime/config/lock change. A normal refresh and focused new-delta
validation can preserve the existing complete runtime proof by exact source identity.

New-main diff classification: all15 prescribed complete runtime/test roots are BYTE-IDENTICAL
to tested32264fc11, including all runtime/test source; manifests and locks unchanged. The
changed docs-policy/image-prepull helpers are not imported by these source roots. Thus the
complete1897/0/19 runtime evidence remains valid by exact source identity, while changed
new-main docs/tool/saga-test paths need focused fresh validation. No broad runtime rerun is
claimed at a different source snapshot. Two conflicts are generated prose/publish assets;
ours is only a temporary generator seed, never a hand resolution. Regenerate canonically.

Fresh incoming docs/tool/saga tests initially35/1/6, stable retry35/1/6. Sole failure is the
new snippet interruption probe failing to start. Exact fixture startup reproduced EACCES:
the platform default TMPDIR is noexec. A project-run-owned executable task TMPDIR starts
the exact same shebang probe; rerun unchanged test command in that task environment. No
assertion, timing, skip, source or permissions are relaxed. No local scaffold.runtime run.

Docs-only refresh validation complete: root4050/34/0; all four freshness gates; quality/
architecture, docsaccuracy, Aspire parity, native service8+both facades docs0; five member
publication dry-runs allPASS. Fresh changed-delta tests36/0/6 PASS with executable taskTMPDIR;
original assertions/deadlines/permissions unchanged. Failed default-noexec attempts retained.
ALL15 entire prescribed runtime/test roots and workspace manifest/lock remain byte-identical
to actual1897/0/19 tested32264fc11; reuse that complete proof by exact identity, not a claimed
new runtime-suite execution. Docs/e2e helpers are not imported by those roots. Main authored
source retained; service reference union word and two canonical carrier unions are the only
main-source differences. Source hashes, immutable root Git objects and outcomes recorded in
doc-refresh-gates.json; plan in doc-refresh-plan.md. Need independent refresh slice review.

Independent docs-refresh CHECKPOINT: PASS; source equivalence accepted. Reviewer verified
all15 immutable root objects and27 hashes. One root test reads outbound-webhooks.md at
runtime; incoming edit is prose links outside its two identical TS fences/asserted phrases,
so its observed inputs remain unchanged. This exception is explicit in the evidence.

Main advanced again toaec75e4d947dcf7c83b9f7dd4b6444abe430f18b (#2511 structured worker log
levels), now including worker runtime/manifest changes and two main-owned private locks.
Finish/push this reviewed docs merge, then normally merge that exact main and do fresh
complete runtime validation rather than reusing prior inputs. PR coordination comment
6542465797 requests a shared-carrier landing window; continue without awaiting a reply.

Whole staged merge whitespace inspection flags a context-only blank line in incoming
orch-divybot-6541471368--2383/negative-control.patch. It is byte-identical to approved main
and belongs to retained run evidence. Preserve it unchanged; owned run/reference/carrier
paths pass their scoped diff whitespace check. This is not a TypeScript quality failure
or a waived source gate, and no incoming patch/evidence is reformatted or stripped.
