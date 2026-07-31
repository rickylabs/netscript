# Research — current-surface verification

## Findings

1. #965 was accurate when filed but is stale on the branch baseline. All public saga examples now
   use `defineSaga(id)` and the implementation is a generic function accepting `id: TId` and
   returning the fluent typestate builder. No object-form example remains.
2. #971 overstates the current omission. The named helpers already exist across focused guide and
   reference pages, but the cross-area recipe index does not put them on one preferred path. The
   discoverability defect is the missing route map, not missing API documentation.
3. #972 correctly identifies the missing blast-radius map, but universal `--dry-run` is not a
   documentation-only or uniformly safe contract. Some commands mutate external databases,
   deployment providers, or service managers. The accurate compact contract must state preview
   support explicitly rather than imply filesystem dry-run models external effects.
4. The shared root cause is absence of a checked documentation contract tying preferred routes and
   mutation families to the current public surface.

## Evidence sampled

- `packages/plugin-sagas-core/src/builders/define-saga.ts`
- Public saga guide, tutorial, architecture, and durability pages
- Web-layer, SDK, Fresh UI, deployment, and OpenAPI/Scalar guides
- Public CLI source plus live `--help` for root, init, config, contract, service, db, plugin,
  generate, ui:add, and deploy.
