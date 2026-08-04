# Research

## Defect evidence

The #1190 protocol reached a real Redis queue and canonical saga store, then the runner failed at
the API projection boundary with:

> `metadata.createdAt.toISOString is not a function`

The canonical Redis state existed at version 1, while `saga_instances` was absent and `GET /sagas`
remained empty. The failing trace was `4d05a00e5e64b2404e18bb0c694f5395`.

## Boundary analysis

`KvSagaStore` persists envelopes through a JSON-backed KV adapter. Redis therefore returns date
fields as ISO strings at runtime even though the engine-facing `SagaStateEnvelope` contract keeps
them typed as `Date`. `saga-instance-projection.ts` immediately invokes `toISOString()` on those
values in both the nested projection state and KV read model.

The doctrine-consistent fix is private normalization at the persistence-to-projection boundary:
accept the runtime value as unknown inside a narrow helper, admit only a valid `Date` or valid date
string, and return its canonical ISO representation. The public projection contract remains strict;
invalid persisted values still fail loudly.

## Verification shape

- RED: real Redis round-trip through `KvSagaStore`, followed by `ProjectingSagaStore` projection.
- GREEN: same integration test plus focused plugin tests.
- Closure: fresh user scaffolds on Redis/Garnet and Deno KV, full publish/runner/query lifecycle,
  compensation, restart durability, populated health reports, and Aspire OTEL correlation.
