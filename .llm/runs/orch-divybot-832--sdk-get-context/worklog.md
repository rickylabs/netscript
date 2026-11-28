# Worklog — source #2610

## Design

1. **Public surface:** unchanged `createServiceClient`, `ServiceClientContext`,
   native GET contracts and canonical bearer contribution. This checkpoint adds
   only review artifacts and a run-local reproducer.
2. **Domain vocabulary:** logical call/epoch (one prepared public invocation),
   effective signal (the existing top-level-or-context selection), effective
   cache (explicit Fetch mode or resolved metadata), cache group (immutable
   equivalent transport policy), eligible GET (safe unsignalled coalescing).
3. **Ports:** existing package-owned client-link/prepared-call/transport-policy
   contracts, released oRPC filter/groups and the Web Fetch boundary. No new
   public port or cancellation engine. Composition remains service-client factory
   plus the existing HTTP link and stable-v1 adapter.
4. **Constants:** preserve named GET URL limit/native fallback. Cache group
   identifiers derive from the existing `SdkClientPolicyCache` union; use named
   immutable descriptors, not scattered policy literals. Reproducer constants
   name synthetic reply, deadline and observation bounds.
5. **Commit slices:** S0 this run's checkpoint; S1 internal cache/eligibility
   contract + policy tests; S2 transport/preparation + integration regressions;
   S3 SDK documentation + full qualification. Exact files/gates are in `plan.md`.
   Only S0 is authorized now.
6. **Deferred scope:** shared signalled dedupe redesign, upstream rewrite, public
   SDK extension, consumer workaround, unrelated debt, runtime/release operations.
   The existing public filter can retain correctness with a smaller change.
7. **Contributor path:** read `packages/sdk/src/internal/transport-policy.ts`
   first to extend policy; its HTTP adapter translates into released oRPC APIs.

## Evidence and decisions

- Native ACK was delivered for source, own current directory, branch, head and
  planning-only fence. Requested model/effort is recorded in supervisor.md;
  actual runtime attestation is unavailable and is not invented.
- Matrix resolved at feature tier. Parent alone dispatches independent review;
  PLAN-EVAL **PENDING**, product continuation **ABSENT**.
- Initial baseline/default branch verified; ownership searches found no competing
  repair. Public consumer reproducer and maintainer handoff read in full where
  relevant; no consumer or protected service was touched.
- Actual SDK/locked oRPC reproducer: 5 positive controls, 5 named semantic
  assertion failures, no ignored tests. Repeated only after the final test-seam
  adjustment and for a durable allowlisted receipt; no source mutation.
- Structured check, lint and format for the reproducer pass with full one-file
  selection. Run-local lint config copies root rules and clears path exclusions;
  no source lint suppression is added.
- Root RTK binary is unavailable. Direct noninteractive commands used. A check
  wrapper call with `--deno-arg=--frozen` was rejected by its CLI; the corrected
  `--deno-arg --frozen` call passed. Gate runner has no `--help` option; its
  documented source/catalog supplied the allowed invocation. Neither CLI error
  is counted as a semantic RED or a successful gate.
- The latest-stable tool reported 1.16.2, whereas actual local client is 1.15.5
  and consumer report is 1.16.1. No version was changed or claimed corrective.

## Reconcile

S0 changes only this scoped run directory. Production source, existing tests,
all dependency manifests and locks remain at baseline. The assignment file and
private raw artifacts are excluded from staging. This is a plan checkpoint
commit, not implementation sign-off. Final source equality and remote ownership
recheck are recorded in the sealed evidence and handoff.

## Unproven

Exact-plan PASS, explicit parent continuation, product implementation, mutation
RED/restored-GREEN qualification, broader quality/architecture/package gates,
full CLI runtime and production E2E, independent exact-head IMPL-EVAL, current-head
CI, release publication and unchanged consumer acceptance. None is implied by
the passing reproducer controls or by opening a draft PR.
