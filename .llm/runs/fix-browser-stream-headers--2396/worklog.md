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

S2 main integration: source merged cleanly. Debt conflict preserves both complete entries:
existing reader-header type closure and main's token-export cardinality debt. Prose carrier
conflict takes main's generated carrier, to be regenerated canonically for the merged authored
guide. No retained run evidence is removed; no debt scope, target or status is changed.

S2 integrated complete Fresh/workers suites pass: 460/0/0, including native wire/header
identity, reconnect/lifecycle and compiler controls. Scoped stream runtime/test lint and format
pass 16 files each with no dropped targets. Canonical authored-prose generation and dependent
barrel/publish-assets generation succeeded after the merge; only expected prose carrier differs.
Next: stable merged-head root/quality/publish/doc and canonical-corpus checks, then independent
exact-head implementation review. Required runtime CI remains an actual gate, not a local claim.

## S2 local gate completion

Source head e26aacb203b702cd776ac300d00da5656bebf44e: root check passes 3829 files/32
batches; complete Fresh/workers suites 460/0/0. All touched authored TypeScript lint/fmt pass
with no dropped targets. Quality:gate passes quality/architecture/dependency checks. Fresh,
workers, MCP and CLI member dry-runs pass. All four generated-doc freshness gates pass.

Full export doc lint is RED: Fresh45 and workers2. Both exactly match normalized main
per-file/rule-count fingerprints; Fresh source in the comparison checkout is identical to main,
and workers' two findings are in the unchanged core contract types. No waiver or diagnostic
reduction is claimed. The older Windows reports are preserved but are not current baseline.
Existing native type-closure debt and all original expiry dates remain unchanged.

Reconcile: original branch and evidence retained; main source merged without manual resolution.
Only debt-union and canonical prose-carrier conflicts required handling. PR already has its
breaking-migration note and existing e2e-cli opt-in; labels/milestone were not changed. Independent
exact-head review is next. Do not infer current-head CI/runtime results from historical green runs.
