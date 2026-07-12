# @netscript/contracts

[![JSR](https://jsr.io/badges/@netscript/contracts)](https://jsr.io/@netscript/contracts)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The contract-first vocabulary for NetScript boundaries: an oRPC base contract, Zod-backed
pagination and error schemas, and builders that keep service handlers and typed clients in sync.**

The base contract carries the standard error map; the reusable builder set covers CRUD, query, and
transform contracts.

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/contracts

# Node.js / Bun
npx jsr add @netscript/contracts
bunx jsr add @netscript/contracts
```

### Usage

```typescript
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/contracts';
import { z } from 'zod';

// Define a listing procedure on the shared base contract.
// The NetScript error map (NOT_FOUND, VALIDATION_ERROR, UNAUTHORIZED, ...) is already applied.
export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(
    z.object({
      items: z.array(z.unknown()),
      pagination: OffsetPaginationMetaSchema,
    }),
  );
```

---

## 📦 Key Capabilities

- **Base contract**: `baseContract` carries NetScript's common oRPC error map (`NOT_FOUND`,
  `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`), so every
  service starts from one shared error vocabulary.
- **Pagination schemas**: offset and cursor query/input/meta schemas (`OffsetPaginationQuerySchema`,
  `CursorPaginationMetaSchema`, and friends) with shared limit/offset defaults.
- **Schema factories**: `boundedString`, `positiveInt`, `paginationLimit`, `stringToInt`, and
  related helpers build reusable, validated contract values.
- **CRUD generators** (`@netscript/contracts/crud`): `createCrudContract`, `createReadOnlyContract`,
  and `createListOnlyContract` emit full list/get/create/update/delete oRPC contracts.
- **Query and transform helpers** (`@netscript/contracts/query`, `/transform`): `buildPrismaWhere`,
  `createPaginatedOutput`, and `createTransformer`/`composeTransformers` bridge contracts to Prisma
  queries and typed projections.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/contracts/](https://rickylabs.github.io/netscript/reference/contracts/)
- **Services & SDK**:
  [rickylabs.github.io/netscript/services-sdk/](https://rickylabs.github.io/netscript/services-sdk/)
- **Contracts to service to client**:
  [rickylabs.github.io/netscript/explanation/contracts/](https://rickylabs.github.io/netscript/explanation/contracts/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
