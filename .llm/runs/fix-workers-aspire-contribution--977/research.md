# Research — workers Aspire contribution and plugin RPC seam

Re-baselined 2026-07-31 against the checked-out beta.12 branch and `origin/main`. The carried-in
context and plan were hypotheses, not verdicts.

## Findings

1. **#960 is correctly framed, but the existing regression is false-green.**
   `createServiceClient` defaults to `/api/rpc/v1/<routerName>`, while `createPluginService` calls
   `withRPC()` without a path and therefore mounts `/api/rpc`. The SDK integration test manually
   supplies the desired server path and never exercises the production plugin factory.
2. **#977 overstates what `EnvSource` currently does.** `declareEnv()` is not consumed outside
   contribution tests, and a resource-shaped `EnvSource` does not itself create an Aspire builder
   reference. References are created only by `builder.reference()` / `builder.waitFor()`. The fix
   must therefore publish the resource-shaped value *and* record graph dependencies explicitly.
3. **The port allocator is the available endpoint authority.** `ctx.port('workers-api', 8091)`
   determines the service port. Health-check URLs can derive from the same call. A resource env
   source `{ kind: 'resource', resource: 'workers-api', key: 'url' }` preserves endpoint indirection
   for an adapter that resolves real Aspire endpoints.
4. **The default workers graph double-runs work.** The contribution unconditionally registers the
   combined process plus standalone scheduler and worker. The combined entrypoint starts both
   functions; there is no enablement condition in the contribution. The manifest can continue to
   advertise standalone entrypoints, but the default Aspire graph should select only the combined
   process and make it wait for the API.
5. **RPC compatibility is implementable additively.** The service builder can register one oRPC
   router under multiple prefixes. The canonical prefix should be derived from shared service-owned
   path logic; `/api/rpc` remains a beta.12 legacy alias and emits a once-per-process deprecation.
6. **Blast radius is all `createPluginService` users.** Auth, sagas, streams, triggers, and workers
   use or are expected to use the factory. The canonical route must default from `config.name`, with
   optional `apiVersion`, so existing callers require no source change.

## Doctrine / JSR surface scan

- Effective profile: Archetype 5 (plugin), with `packages/plugin`, `packages/service`, and
  `packages/sdk` shared convention surfaces involved. The plugin thinness law requires the route
  convention to live in core, not in workers.
- Current verdicts: SDK `Keep`; service `Refactor`; plugin historical restructure is recorded in
  doctrine/debt; workers plugin `Refactor`. This slice does not attempt those broad remediations.
- Public-surface risk: any new shared path builder must have explicit types/JSDoc and be exported
  from the service package; plugin config gains only an optional field. No slow-type inference is
  planned.
- Publish checks must cover `packages/service`, `packages/plugin`, `packages/sdk`, and
  `plugins/workers`; existing sanctioned debt remains unchanged.

## Issue corrections required

- Comment on #977 that resource-shaped env declarations alone do not create `ServiceReferences`;
  the builder dependency edge is a separate operation.
- Confirm on #977 that the triple registration is a real duplicate default runtime, while the
  standalone manifest entries remain valid explicit modes.

## Open questions resolved

- `v1` is the shared default in the service-owned RPC path convention; SDK and plugin factory both
  call it. Callers may override `apiVersion` on both sides.
- Legacy `/api/rpc` remains additive for beta.12 and is deprecated, not removed.
- Plain-process `WORKERS_API_URL` consumers retain their existing `http://localhost:8091` fallback;
  Aspire declarations become resource-backed without making non-Aspire runs depend on a graph.
