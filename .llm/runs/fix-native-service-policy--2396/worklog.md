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

S1: merged current main cleanly into original service branch, preserving all old evidence.
No manual source or workflow conflict resolution was needed. New merge-head gates follow;
historical tests do not certify this merge. All review-thread checks currently pass.

## S1 local gate completion

At source merge 24c73ee2f37c6c4257e3d245c3afda59cbd7d3d0, root `deno task check`
passes all 3828 selected files/32 batches. Complete service/plugin/docs-tool tests:
824 passed, 0 failed, 0 ignored. Service lint/fmt: 126 files each, 0 findings/drops.
Quality:gate (quality scan + architecture/dependency checks) passes with existing warnings.
Full service doc lint: all 8 entrypoints, zero findings. Service and MCP published-member
static dry-runs pass. JSR audit passes with existing sanctioned service slow-type INFO only.
All four canonical generated-doc freshness gates pass with no regeneration or lock churn.
See gate-summary.json for sanitized durable receipt results; raw output remains local.

Reconcile: original branch retained, main merged normally, no manual source/workflow conflict
resolutions; no labels or milestones changed. All review-thread gates pass with zero threads.
PR bodies now start with Refs and service/reader breaking migrations are explicit. The old
release/EIS checklist claims are outside this bounded leaf; they are not asserted complete.
Coordinator notified of 2422's missing runtime opt-in. Independent exact-head review is next;
required runtime CI remains unproven, and no release or merge readiness is claimed yet.

Independent implementation round 1 found no code blockers and returned CHANGES on exact head
7dd579d78bb7fe0cd498618b45f65f64e640ee69 because runtime/CI proof is pending. Verbatim
report is evaluate-round-1.md. Corrected its stale immediate-health documentation finding in
the service README, CHANGELOG and reference pipeline/rate-limit guide. No runtime source
change. Canonical prose regeneration and exact next-head evidence are required. This terminal
review leaves external gate proof pending; the independent S2 reader lane can proceed.

S1 documentation repair complete: README and reference guide now distinguish deferred health
from immediate service-info, and CHANGELOG describes middleware/body-limit ordering. Canonical
prose/build, assets-barrel and publish-assets generation succeeded; only the expected prose
carrier changed. Runtime source remains byte-identical to the already tested source merge.
Continue S2 while service runtime CI remains coordinator-owned and unproven.
