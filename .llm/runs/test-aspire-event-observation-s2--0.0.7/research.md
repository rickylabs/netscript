# Research — #1906 slice 2

## Re-baseline

The implementation brief is re-baselined against its pinned `main` commit `79adb103b`; the branch
contains only that baseline plus the brief commit before implementation. A newer `origin/main`
exists, but this run does not silently change the owner-selected base.

Issue #1906 and both owner comments were read in full. The decisive contract is the corrected one:
out-of-process repeated state/health observation uses the resource-scoped, buffered
`aspire describe <resource> --follow --format Json` stream. One-shot lifecycle events are suitable
only for first occurrence. `aspire wait` is coarse arrival gating and must not discover an induced
transition.

## Current-tree findings

- #1909's shared `runtime/resource-state-stream.ts` is present and owns scoped NDJSON parsing,
  buffering, failure ceilings, and follower cleanup. This slice consumes it and creates no second
  observer.
- `verify-endpoint-readiness.ts` is the remaining direct `aspire describe` deadline poll in the
  in-scope list.
- `verify-producer-reconnect.ts` discovers a stopped Aspire resource by repeatedly probing HTTP.
  Its `PROBE_TIMEOUT_MS` bounds the probe child reaching its backoff marker, not resource state.
- `generated-app-endpoint.ts` and `capture-db-endpoint-allocation.ts` take single snapshots but do
  not themselves establish endpoint-allocation observation. They can consume the shared follower;
  a snapshot, where still required for whole-topology evidence, is taken once after the event.
- `wait-for-workers-runtime.ts` is absent. `runtime-gates.ts` already uses #1760's structured
  `describe-follow.ts` receipts and no longer declares `KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS`.
- `service-env/verify-service-env.ts` already blocks on `aspire wait --status healthy` for each
  subject and reads one topology snapshot afterwards. `quickstart/aspire-walk.ts` likewise uses one
  coarse initial-arrival wait. Both need cap evidence, not rewrites.
- `runtime/probe-plugin-resource.ts` retries application HTTP behavior after resource endpoint
  resolution. The HTTP result (worker completion, trigger receipt, or route response) is not an
  Aspire resource-state assertion and remains timing-based per the issue's Bucket-B/C boundary.
- No fenced file needs modification for the planned conversions.

## Open questions

None that force architecture rework. Exact helper signatures and diagnostic wording are local
implementation details locked by focused tests. Hosted CI remains the live Aspire proof surface;
the brief forbids running scaffold-runtime locally.

