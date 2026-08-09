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

| S1 gate | Result |
| --- | --- |
| Non-default client-symbol pre-fix | expected RED, raw exit 1; `orders.ts` lacked `ordersContract` and emitted `exampleService*` |
| Canonical asset generation | PASS, raw exit 0 |
| Client scaffolder + route templates | PASS, raw exit 0; 2 tests / 21 BDD steps |

S1 changed the canonical client template and all six default-scaffold consumers to use the same
`serviceName | camelCase` symbol family. No public command shape or module path changed.

| S2 gate | Result |
| --- | --- |
| Accuracy guard unit tests | PASS, raw exit 0; 2 passed |
| Retired-path scratch mutation | expected RED, raw exit 1; named `quickstart.vto` and `lib/api-clients.ts` |
| Extra-dialect-page scratch mutation | expected RED, raw exit 1; named SDK reference + quickstart |
| Clean `docs:accuracy` | PASS, raw exit 0; 192 published sources, one legacy API page |
| `docs/site` build | PASS, raw exit 0; source/rendered guards, 617 files, 220 HTML |
| `check:links` | PASS, raw exit 0; 32,772 links / 220 pages |
| `check:caveats` | PASS, raw exit 0; 18 markers / 14 pages |

S2 swept 192 published sources and changed 17 published pages. Final published counts: zero pages
with `lib/api-clients.ts`, `@contracts`, or `@/lib/`; one page with
`createServiceQueryUtils` (`reference/sdk/index.md`); four named discovery pages contain
`--with-client`. `_plan` retains historical evidence and was not edited.
