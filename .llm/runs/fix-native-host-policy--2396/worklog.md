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
