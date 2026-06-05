# Contracts & Type System

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> How types flow end-to-end in NetScript: from Zod schemas through oRPC contracts to service
> handlers and frontend clients.

## Contract-First Development

Contracts are the **single source of truth**. The type flow is:

```
Prisma Schema -> Generated Zod Schemas (@database/zod)
                            |
                    Contract Schemas (contracts/versions/v1/)
                            |
                    oRPC Contracts (baseContract + route definitions)
                            |
              ┌─────────────┴─────────────┐
              |                           |
    Service Handlers (.handler())    Service Clients (createServiceClient)
                                          |
                                    Query Factories (createQueryFactories)
                                          |
                                    Frontend Components
```

## Shared Foundations (`packages/contracts/mod.ts`)

### Base Contract

All contracts inherit 6 standard error types:

| Error                 | Status | Data Schema                                                          |
| --------------------- | ------ | -------------------------------------------------------------------- |
| `NOT_FOUND`           | 404    | `{ resourceType, resourceId }`                                       |
| `VALIDATION_ERROR`    | 422    | `{ formErrors[], fieldErrors: Record<string, string[]> }`            |
| `UNAUTHORIZED`        | 401    | `{ reason?: 'missing_token' \| 'invalid_token' \| 'expired_token' }` |
| `FORBIDDEN`           | 403    | `{ requiredRole?, userRole? }`                                       |
| `RATE_LIMITED`        | 429    | `{ retryAfter, limit }`                                              |
| `SERVICE_UNAVAILABLE` | 503    | `{ retryAfter?, reason? }`                                           |

### Pagination Schemas

**Offset-Based** (primary pattern):

- `OffsetPaginationQuerySchema` - For GET requests (string coercion: `"10"` -> `10`)
- `OffsetPaginationInputSchema` - For POST requests (native types)
- `OffsetPaginationMetaSchema` - Response: `{ total, limit, offset, hasMore }`

**Cursor-Based** (alternative):

- `CursorPaginationQuerySchema` - `{ limit, cursor? }`
- `CursorPaginationMetaSchema` - `{ limit, nextCursor, hasMore }`

### Common Schemas

- `IdQuerySchema` - `{ id: stringToInt(positiveInt()) }` for GET
- `IdParamSchema` - `{ id: positiveInt() }` for POST
- `SuccessSchema` - `{ success: boolean, message?: string }`

## Versioned Contracts (v1)

### Users Contract

```
Schemas: UsersSchemaV1, UserFiltersSchemaV1, CreateUsersSchemaV1, UpdateUsersSchemaV1, UserStatsSchemaV1
Methods: list, getById, create, update, delete, getStats
Filters: role, status, search, sortBy, sortOrder
```

### Products Contract

```
Schemas: ProductsSchemaV1, ProductFiltersSchemaV1, CreateProductsSchemaV1, UpdateProductsSchemaV1, ProductStatsSchemaV1
Methods: list, getById, create, update, delete, getStats
Filters: category, inStock, minPrice, maxPrice, search, sortBy, sortOrder
Special: Decimal handling for price field (toDecimal/toNumber conversions)
```

### Orders Contract

```
Schemas: OrdersSchemaV1, OrderFiltersSchemaV1, CreateOrdersSchemaV1, UpdateOrdersSchemaV1, OrderStatsSchemaV1
Methods: list, getById, create, update, delete, getByUserId, getByProductId, getStats
Filters: status, userId, minTotal, maxTotal, startDate, endDate, search, sortBy, sortOrder
Special: Nested items array, cross-service validation (users + products)
```

### Health Contract

```
Schemas: HealthCheckSchemaV1, PingSchemaV1
Methods: check (GET), ping (POST)
```

### Jobs Contract

```
Schemas: JobMessageSchemaV1, ExecutionRecordSchemaV1, JobDefinitionSchemaV1, JobStatsSchemaV1
          JobTriggerEventSchemaV1, JobCompletionEventSchemaV1, ExecutionUpdateSchemaV1
Enums: ExecutionStatus (pending|queued|running|completed|failed|cancelled|timeout)
       TriggerType (cron|manual|api|event|retry|queue)
KV Keys: JobKvKeys helper for KV key construction
```

## Plugin Contracts

### Workers Plugin Contract

```
Jobs: listJobs, getJob, createJob, updateJob, deleteJob, triggerJob
Executions: listExecutions, getExecution, batchQueryExecutions, listExecutionsByCorrelationId
Tasks: listTasks
Admin: cleanup, cleanupDbExecutions, archiveExecutions, seed
SSE: subscribe (eventIterator with heartbeat, jobs, executions events)
Topics: listTopics
```

### Sagas Plugin Contract

```
Sagas: listSagas, getSaga
Instances: listInstances, getInstance, getInstanceHistory
Messaging: publish (type + payload + correlationId)
SSE: subscribe (saga:started, saga:state_changed, saga:completed, saga:failed)
```

### Triggers Plugin Contract

```
Triggers: listTriggers, getTrigger, createTrigger, updateTrigger, deleteTrigger, enableTrigger, disableTrigger, fireTrigger
Events: listEvents, getEvent
Webhooks: ingestWebhook (POST /webhooks/{path} — match and ingest against registered triggers)
SSE: subscribe (eventIterator filterable by triggerId, topic)
Topics: listTopics (topic name, trigger count, event count)
Filters: type, enabled, topic, tags (triggers); triggerId, status, triggerType (events)
Detail: getTrigger returns full config (file, fileLifecycle, middleware, retry, actionChain), stats, and runtimeOverrides
```

## Shared Utilities (`@netscript/contracts`)

### Validators

- `positiveInt()` - min:1, max:2147483647
- `nonNegativeInt()` - min:0, max:2147483647
- `paginationLimit()` - min:1, max:1000, default:10
- `paginationOffset()` - min:0, default:0

### Codecs (Bi-directional transforms via Zod v4)

Codecs define **bidirectional** transformations with `decode()` (input → output) and `encode()`
(output → input), validated both ways. Prefer codecs over one-way `.transform()`.

- `stringToInt()` / `stringToNumber()` - Query param coercion
- `decimalToNumber` / `toNumber()` / `toDecimal()` - Prisma Decimal handling
- `isoDatetimeToDate` / `epochSecondsToDate` / `epochMillisToDate` - Date handling
- `jsonCodec()` / `utf8ToBytes` / `base64ToBytes` - Encoding

See also Zod's built-in codecs: `stringToURL`, `stringToHttpURL`, `base64urlToBytes`, `hexToBytes`,
`uriComponent`, `z.stringbool()` — [zod.dev/codecs](https://zod.dev/codecs)

### Error Helpers

- `notFound({ errors, path, resourceId })` - Throws typed NOT_FOUND error
- `getResourceType({ path })` - Extracts resource type from oRPC path

## Database Schema (Prisma)

### Core Models

- **User** - id, email, name, role (enum), avatar, status (enum), lastLogin, timestamps
- **Product** - id, name, description, price (Decimal), category (enum), stock, image, sku,
  timestamps
- **Order** - id, userId, status (enum), total (Decimal), shipping address fields, timestamps
- **OrderItem** - id, orderId, productId, quantity, price (Decimal)

### Plugin Models

- **SagaInstance** - id, correlationId, sagaName, state JSON, version, isCompleted, timestamps
- **SagaExecutionHistory** - Timeline of saga transitions with state diffs

### Enums

- `UserRole`: admin, moderator, user, guest
- `UserStatus`: active, inactive, suspended
- `ProductCategory`: electronics, clothing, food, books
- `OrderStatus`: pending, processing, shipped, delivered, cancelled, returned, failed

### Generated Zod Schemas

- Location: `database/postgres/schema/.generated/zod/schemas/`
- Import alias: `@database/zod`
- Used in contracts for schema composition (e.g., `UsersSchemaV1 = UserSchema`)

## Type Inference Pattern

```typescript
// In contracts - define schema
export const UsersSchemaV1 = UserSchema;
export type UsersV1 = z.infer<typeof UsersSchemaV1>;

// In frontend - infer from client
type User = Awaited<ReturnType<typeof usersClient.getById>>;
type UserListItem = Awaited<ReturnType<typeof usersClient.list>>['items'][number];
```

## Contract Versioning

```typescript
// contracts/mod.ts
export { v1 } from './versions/v1/mod.ts'; // Router contracts
export * from './versions/v1/index.ts'; // Schema types
export { plugins } from './plugins/mod.ts'; // Plugin contracts

export const API_VERSIONS = {
  v1: { status: 'stable', releaseDate: '...' },
} as const;
```

Future versions (v2, v3) follow the same pattern in `contracts/versions/v2/`.
