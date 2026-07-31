# Context pack — workers-aspire-contribution (#977, #960)

Milestone: 0.0.1-beta.12
Branch: `fix/workers-aspire-contribution`

## Issues in this slice

- **#977** fix(plugin-workers): workers Aspire contribution declares `WORKERS_API_URL` as a
  literal, not a service reference. `plugins/workers/src/aspire/workers-contribution.ts`
  `declareEnv()` returns `WORKERS_API_URL: 'http://localhost:8091'` even though the signature
  admits `EnvSource`, so consumers get no `ServiceReferences` edge to `workers-api` — no
  dependency ordering, no health gating, no rewrite when the port moves. The same file's
  `declareHealthChecks()` hardcodes `http://localhost:8091/health` too, and `contribute()`
  registers `workers-combined` **and** `workers-scheduler` **and** `workers-worker`, which
  double-runs the scheduler and worker in a default graph.

- **#960** fix(sdk): plugin RPC route shape does not match `createServiceClient` `routerName` —
  404 on `triggerJob`. `createServiceClient` builds
  `${baseUrl}${apiPath}/${apiVersion}/${pathSegment}` = `/api/rpc/v1/workers/...`
  (`packages/sdk/src/client/http-client-link.ts:86`, `packages/sdk/src/client/service-client.ts:49`),
  while `createPluginService` calls `builder.withRPC({ traceContext })` with **no** `rpcPath`
  (`packages/plugin/src/service/presentation/create-plugin-service.ts:159`), so the server mounts
  at the `withRPC` default `/api/rpc` (`packages/service/src/builder/service-rpc.ts:41`) — no
  version segment, no router segment.

## Shared-cause hypothesis

Both defects are the same seam: **what a plugin publishes about itself versus what a generated
client is built to consume.** The workers plugin publishes a hand-written literal URL where the
Aspire builder owns the real endpoint, and publishes an RPC mount prefix that the SDK's
path-derivation rule never agreed to. In both cases a value that should be *derived from one
authority* is instead typed twice, in two places, and the copies drift the moment anything moves
(port relocation for #977, router naming for #960).

The fix should make the plugin side derive from the same authority the consumer side derives
from, rather than patching each literal.

## Pre-existing coverage worth reading first

`packages/sdk/tests/integration/workers-trigger-rpc_test.ts` already asserts that a
`createServiceClient({ serviceName, routerName })` call reaches a workers-style `triggerJob`
route — but it constructs the server with `createService(...).withRPC({ rpcPath: '/api/rpc/v1/workers' })`
by hand. That is exactly the mount the real `createPluginService` does **not** produce, so the
test passes while production 404s. Treat this test as a probable false-green, not as proof.

## Caveat

Neither reading has been verified against a live Aspire graph. Confirm the framing against the
code (and, where possible, a running graph) before choosing the fix — see non-negotiable 4.
