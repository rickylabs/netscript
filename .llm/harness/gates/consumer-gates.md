# Consumer Gates

Consumer gates prove downstream code still works when a public surface changes.

## Required When

Run consumer gates when any of these change:

- `mod.ts` exports,
- `deno.json` exports or tasks,
- public types, schemas, builders, or runtime handles,
- service contracts or generated clients,
- plugin contribution contracts,
- CLI command names, help output, generated project shape,
- README examples that callers copy.

## Gate Definitions

| Consumer type | Validation |
|---------------|------------|
| Package imports | A focused downstream `deno check` or `deno doc` import test |
| Plugin host | Host loader or plugin verification check |
| Frontend | Route/client typecheck and browser validation for affected flow |
| Service | Contract/client check and representative request path |
| CLI generated project | Scaffold smoke check, generated file existence, focused typecheck |
| README examples | Copyable example compiles or has a documented reason it cannot |

## Evidence

Record:

- consumer path,
- command or manual check,
- result,
- notes about skipped consumers.

## Failure Handling

If a consumer gate fails because the public contract changed intentionally but
the migration is not documented, the verdict is `FAIL_FIX`. If many consumers
must be migrated and the plan omitted that work, use `FAIL_RESCOPE`.
