# @netscript/contracts

[![JSR](https://jsr.io/badges/@netscript/contracts)](https://jsr.io/@netscript/contracts)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Contract-first vocabulary for NetScript boundaries: an oRPC base contract with the standard error
map, NetScript-owned procedure metadata, Zod pagination and error schemas, and CRUD/query/transform
builders that keep services and clients in sync.**

In NetScript the contract comes first: services implement it, the SDK generates typed clients from
it, and both sides stay in sync because they share one definition. This package is that shared
definition's toolkit. `baseContract` carries the framework-wide oRPC error map so every procedure
starts from the same error vocabulary; the pagination and value schemas cover the recurring shapes;
and the subpath builders emit whole CRUD contracts, Prisma-ready query conditions, and typed
projections from a single entity schema.

## Why teams use it

- **Base contract** — `baseContract` carries NetScript's common oRPC error map (`NOT_FOUND`,
  `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`), so every
  service starts from one shared error vocabulary.
- **Procedure metadata** — `NetScriptProcedureMeta.access` is the single contract-local vocabulary
  for authentication plus optional scope and role requirements, without exposing oRPC's metadata
  types to consumers.
- **Pagination schemas** — offset and cursor query/input/meta schemas
  (`OffsetPaginationQuerySchema`, `CursorPaginationMetaSchema`, and friends) with shared
  limit/offset defaults and string-to-number coercion for query parameters.
- **Schema factories** — `boundedString`, `positiveInt`, `paginationLimit`, `stringToInt`, and
  related helpers build reusable, validated contract values.
- **CRUD generators** (`./crud`) — `createCrudContract`, `createReadOnlyContract`, and
  `createListOnlyContract` emit full list/get/create/update/delete oRPC contracts from an entity
  schema.
- **Query and transform helpers** (`./query`, `./transform`) — `buildPrismaWhere`,
  `createPaginatedOutput`, and `createTransformer` / `composeTransformers` bridge contracts to
  Prisma queries and typed projections.

## Install

```bash
deno add jsr:@netscript/contracts@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line. Contract outputs are composed with Zod, so most consumers also add
`jsr:@zod/zod@4`.

## Quick example

```typescript
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/contracts';
import { z } from 'jsr:@zod/zod@4';

// Define a listing procedure on the shared base contract. The NetScript
// error map (NOT_FOUND, VALIDATION_ERROR, UNAUTHORIZED, ...) is already applied.
export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .meta({
    access: {
      authentication: 'required',
      authorization: {
        scopes: ['items:read'],
        roles: ['operator'],
      },
    },
  })
  .input(OffsetPaginationQuerySchema)
  .output(
    z.object({
      items: z.array(z.unknown()),
      pagination: OffsetPaginationMetaSchema,
    }),
  );

// The query schema coerces raw string query parameters and applies defaults.
const query = OffsetPaginationQuerySchema.parse({ limit: '25' });
console.log(query); // { limit: 25, offset: 0 }
```

## Procedure access metadata

Declare access beside the procedure it governs with `.meta({ access: ... })`. Do not maintain a
second policy map keyed by a router key or URL: contract-local metadata follows the procedure when
that procedure is renamed, while a stale SDK reference to the old procedure key fails to
type-check.

| Field | Declaration |
| --- | --- |
| `authentication` | `'none' \| 'optional' \| 'required'` |
| `authorization.scopes` | Optional readonly list of required scopes |
| `authorization.roles` | Optional readonly list of required roles |

An absent `access` field is unspecified, not public. The service runtime leaves existing consumers
unchanged until an application explicitly opts into contract enforcement with
`createContractAuthorizer(contract, { fallback? })` and passes it to `.withAuthz()`.

`'optional'` is declared for future support, currently rejected. The OpenAPI projection can
represent the declaration, but `createContractAuthorizer()` throws the stable
`[netscript.service.contract-policy] optional authentication is unsupported: <procedure>` error
during construction, before the first request.

## Public surface

| Entry         | What it gives you                                                                     |
| ------------- | ------------------------------------------------------------------------------------- |
| `.`           | `baseContract`, procedure metadata, error + pagination schemas, schema factories      |
| `./crud`      | `createCrudContract`, `createReadOnlyContract`, `createListOnlyContract`              |
| `./query`     | Filter/search schemas, `buildPrismaWhere`, `createPaginatedOutput`, cursor pagination |
| `./transform` | `createTransformer`, `composeTransformers`, pick/omit transformer factories           |

The always-current symbol list is
[`deno doc jsr:@netscript/contracts@<version>`](https://jsr.io/@netscript/contracts/doc) (pin
`<version>` on the pre-release line, as above).

## Docs

- **Reference — base contract, schemas, and builders**:
  [rickylabs.github.io/netscript/reference/contracts/](https://rickylabs.github.io/netscript/reference/contracts/)
- **Services & SDK — the contract-to-client pipeline**:
  [rickylabs.github.io/netscript/services-sdk/](https://rickylabs.github.io/netscript/services-sdk/)
- **Explanation: contracts to service to client**:
  [rickylabs.github.io/netscript/explanation/contracts/](https://rickylabs.github.io/netscript/explanation/contracts/)
- **API docs on JSR**: [jsr.io/@netscript/contracts/doc](https://jsr.io/@netscript/contracts/doc)

## Compatibility

Runs on Deno, Node.js, and Bun — the package is pure schema and contract definitions with no runtime
APIs and no permissions. Contracts are built on [oRPC](https://orpc.unnoq.com/) (`@orpc/contract`)
and [Zod](https://zod.dev/) 4; any oRPC server/client stack can implement and consume them.

`NetScriptProcedureMeta` is owned and versioned by NetScript, independently of oRPC's public
metadata vocabulary. Its compatibility rule is additive-only optional readonly fields: existing
field names and meanings do not change within the current major line, and there is deliberately no
required version discriminant because unannotated procedures carry `{}`. Consumers should ignore
unknown fields and treat absent known fields as unspecified. That means runtime code cannot
distinguish “metadata absent” from a notional v1 marker; an incompatible semantic change requires a
new field name with deprecation guidance or a semver-major release.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
