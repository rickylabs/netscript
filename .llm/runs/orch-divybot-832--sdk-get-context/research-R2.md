# R2 research additions — unchanged product baseline

Full independent R1 verdict read and verified against the supplied hash before
plan editing. It is only the single complete verdict file; no additional report
was assumed. The retained copy and original sealed R1 set remain byte-identical.
Current branch head at intake is e3b5ff75ba65ee15347504896df38262332d4755;
remote main remains 12c981104c1d13812d7119798911a0937e74348c.

## B1: real public paths, not an inferred corner case

- SDK create-service-query-utils.ts delegates to the released oRPC/TanStack
  utility. oRPC 1.15.5's queryOptions queryFn destructures TanStack's signal and
  passes it as the client's top-level signal on every actual execution. It also
  places operation/query-key metadata in context. The wrapper already selects
  top-level signal ahead of context.signal.
- TanStack QueryObserver/QueryClient executions therefore are signalled even
  when the caller did not set context.signal. With the proposed independent
  signalled transport policy, separate keys or QueryClients deliberately yield
  two Fetch calls. Sharing within the same QueryClient/key happens before the
  SDK and still yields one query execution/fetch.
- SDK query-factory.ts currently generates queryFn with no signal parameter and
  invokes the client with only explicit context, if present. Without that context
  signal the calls remain unsignalled and can still coalesce at transport level.
  Its missing TanStack cancellation bridge is pre-existing and deferred, not
  repaired or promised by this issue.
- New api-path-controls-R2_test.ts uses the actual public SDK factories, a public
  invariant contribution, real QueryObservers and QueryClients and only the final
  network-boundary replacement. It does not start an application/service, access
  a DB or change dependency manifests/locks. Both Deno sanitizers are explicitly
  true. Different-key and different-QueryClient cases each reach two prepared
  signals but currently one wire call: the expected-two-fetch assertion is RED.
  Unsignalled queries and same-key TanStack execution-sharing controls are GREEN.
- Structured result: **2 PASS / 2 semantic FAIL / 0 ignored**, exit 1. No process,
  compiler, timeout, skip or sanitizer failure supplies the semantic RED. The
  subsequent independent-wire-cancellation assertions are present but unproven
  until the product fix lets those tests advance beyond the failing count.

## A1: actual released upstream comparison

Read-only Deno info queries inspect the public plugins exports at exact 1.15.5
and 1.16.1 with no config/lock writes. Package manifests confirm each name/version.
upstream-comparison-R2.json records full module/declaration and excerpt hashes,
package-relative export paths, extraction boundaries and the actual empty diffs.
The relevant DedupeRequestsPlugin code, public group/filter declarations,
LinkFetchClient and toBatchAbortSignal excerpts are byte-identical. Their enclosing
JavaScript files can differ elsewhere; no full-version parity is asserted.
Actual SDK behavior here still uses the repository's locked 1.15.5 graph.

## A2: Fetch-mode boundary

A local Web Request constructor check on Deno 2.9.7 (no fetch/network) confirms
only-if-cached without compatible mode raises TypeError, while same-origin mode
constructs with only-if-cached intact. The SDK fix must forward the explicitly
requested cache and preserve the native constraint/error; changing request mode
or silently coercing to no-store would redefine existing behavior. This is not
browser cache or authenticated-response caching acceptance. The explicit
required-auth metadata precedence matrix is locked in plan-R2.md for later tests.

## Scope and qualification limits

R2 implements only plan/evidence corrections, with a new content scanner and
new run-local API controls. Framework source, existing tests, dependencies and
R1 sealed files stay unchanged. Mutation experiments, product/restored GREEN,
independent exact-R2 PASS, explicit product continuation, broader/runtime/CI,
published cohort and unchanged consumer acceptance are still unproven.
