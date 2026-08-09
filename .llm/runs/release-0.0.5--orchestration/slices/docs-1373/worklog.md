# Worklog: #1373

## Design

- Public surface: no new export or command; `service add --with-client` keeps its existing shape.
- Domain vocabulary: service-derived symbol family only; no new type or registry.
- Ports: existing `ScaffolderPort`, `FileSystemPort`, and template renderer remain unchanged.
- Constants: the docs accuracy guard owns one allow-listed published page for
  `createServiceQueryUtils`; no product constant is introduced.
- Commit slices: S0 harness, S1 scaffold symbols, S2 docs/guards, S3 aggregate gates.
- Deferred: #1374 code-block compilation, #1333 default app restructuring, #1335 inventory.
- Contributor path: edit the canonical app client template and its service-name-substituted
  consumers; docs use one per-service module and the SDK reference owns the legacy API distinction.

## Progress

- Clean branch created at `origin/main@2e7379b40`, upstream unset.
- Skills, run loop, docs overlay, doctrine, live issue, shipped APIs, generator, consumers, and all
  published naming/dialect hits opened before planning.
- `PLAN-EVAL: N/A` recorded before implementation.

## Gates

Pending implementation.

