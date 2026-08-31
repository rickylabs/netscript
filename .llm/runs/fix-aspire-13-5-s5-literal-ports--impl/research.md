# Research: Aspire 13.5 S5 literal ports

## Authorities

- Issues #1717, #1365, #1370, #979 and epic #1712.
- Ratified parent plan D-14 and OF-3a on `origin/research/aspire-13.5-0.0.7`.
- Parent research §15 JSR baseline for the sagas public surface.
- S2 V3 receipts on `origin/test/aspire-13-5-s2-runtime-verification`.

## Findings

- D-14 is locked: a publisher without an explicit/service-discovered endpoint returns the existing
  `SagaPublisherRejected` shape with `reason: 'no-endpoint'` and `retryable: false`.
- `SAGAS_API_DEFAULT_PORT` remains value `8092` and exported from root, public, runtime, and Aspire
  entry points, but no runtime path may read it.
- S2's two isolated describes both advertised PostgreSQL at `tcp://localhost:14428`; the second live
  endpoint verification failed. Infrastructure pins/default allocation must therefore be opt-in.
- Current contributions supply fallback ports and publish loopback URLs. CLI E2E behavior gates also
  compute deterministic ports or embed 8091/8093/8094 rather than consuming `urls[].url` from
  `aspire describe --format Json`.
- Baseline sagas JSR evidence is a successful dry run with three existing dynamic-import warnings;
  doc lint has the existing `private-type-ref` tracked by #1708.

## Architecture

Composite ARCHETYPE-5/ARCHETYPE-6 slice. Plugin contributions remain thin declarative seams; the
CLI generator owns configuration translation and E2E endpoint discovery. Public types are unchanged.
