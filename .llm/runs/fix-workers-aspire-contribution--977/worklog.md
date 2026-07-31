# Worklog — workers Aspire contribution and plugin RPC seam

## Design

### Public surface

- A service-owned pure RPC-prefix derivation used by server and SDK client.
- `PluginServiceConfig.apiVersion?: string`, defaulting to the shared `v1` convention.
- No workers plugin export change; its Aspire declaration changes meaning from literal endpoint to
  resource endpoint.

### Domain vocabulary and ports

- Canonical RPC prefix: API base + API version + router name.
- Legacy RPC prefix: `/api/rpc`, registered as a compatibility alias.
- `EnvSource` resource reference names the `workers-api` endpoint; `AspireBuilder.waitFor` records
  the real startup edge.
- No new port: the existing `AspireBuilder` and service builder are the exercised seams.

### Constants

- Default RPC API path `/api/rpc`, default version `v1`.
- Workers API resource `workers-api`, default port `8091`, combined resource `workers-combined`.

### Commit slices

1. **S1 — lock and test the shared publication contract.** Change service/plugin/SDK route
   derivation, keep the legacy alias, replace the false-green SDK test with the real plugin factory,
   and prove red-before/green-after. Files: service RPC convention/wiring and exports, plugin factory
   and tests, SDK client/test and package imports. Gates: focused tests plus scoped check/lint/fmt.
2. **S2 — make the workers Aspire graph truthful.** Publish resource-backed env, derive health from
   allocated port, select one default runtime, and record wait/reference edges. Files: workers
   contribution/tests and run artifacts. Gates: workers focused test plus scoped check/lint/fmt.
3. **S3 — integration and publish evidence.** Run affected package/plugin tests, JSR audits,
   quality gate, doctrine gate, and required runtime/consumer smoke; update PR/run evidence. Files:
   run artifacts and PR metadata only unless a reviewed fix is required.

### Deferred scope

- General consumption of every plugin `declareEnv()` by generated AppHosts is not introduced here.
- Other plugins' hardcoded Aspire URLs are follow-up candidates, not silent scope expansion.
- Broad service/plugin doctrine debt is unchanged.

### Contributor path

Add or change an RPC route prefix in the service-owned convention, then consume it from both the
server factory and SDK link. Add a workers Aspire dependency through `AspireBuilder`, and keep
non-Aspire runtime fallback at the consumer edge.
