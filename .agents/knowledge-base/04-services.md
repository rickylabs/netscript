# Services Reference

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> How microservices are structured, implemented, and connected in NetScript.

## Service Architecture Pattern

All services follow the same three-file pattern:

```
services/{name}/
├── deno.json           # Workspace config, tasks, imports
└── src/
    ├── main.ts         # Entry point: defineService() or createService() builder
    ├── router.ts       # Combines versioned routers + health
    └── routers/
        ├── v1.ts       # Contract handler implementations
        └── health.ts   # Health check handlers
```

## Service Bootstrap

### Using defineService (Preset - Most Common)

```typescript
import { defineService } from '@netscript/service';
import { db } from '@database';
import { v1 } from './router.ts';

await defineService(v1, {
  name: 'users',
  version: '1.0.0',
  port: 3000,
  db: db.postgres,
  openapi: { title: 'Users API', description: 'User management service' },
  debug: true,
});
```

### Using createService (Builder - For Customization)

```typescript
import { createService } from '@netscript/service';

await createService(router, { name: 'workers', version: '1.0.0', port: 8091 })
  .withCors()
  .withLogger()
  .withOpenAPI({ title: 'Workers API' })
  .withDocs()
  .withDatabase(db.postgres)
  .withRPC({ traceContext: true })
  .withHealth()
  .withServiceInfo()
  .onStartup(async () => { ... })
  .serve();
```

## Router Composition

```typescript
// router.ts
import { os } from '@orpc/server';
import { health } from './routers/health.ts';
import { usersV1 } from './routers/v1.ts';

export const v1 = {
  health,
  users: usersV1,
};
```

## Handler Implementation Pattern

```typescript
// routers/v1.ts
import { v1 } from '@contracts';
import { notFound } from '@netscript/contracts';

// Context injection for database access
const router = v1.users.$context<{ db: DB['postgres'] }>();

export const usersV1 = {
  list: router.list.handler(async ({ input, context }) => {
    const { db } = context;
    const { limit, offset, role, status, search, sortBy, sortOrder } = input;

    // Build WHERE clause dynamically
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      db.user.findMany({ where, skip: offset, take: limit, orderBy: { [sortBy]: sortOrder } }),
      db.user.count({ where }),
    ]);

    return { items, total, limit, offset, hasMore: offset + limit < total };
  }),

  getById: router.getById.handler(async ({ input, context, errors, path }) => {
    const item = await context.db.user.findUnique({ where: { id: input.id } });
    if (!item) notFound({ errors, path, resourceId: input.id });
    return item;
  }),
};
```

## Service Inventory

### Users Service (Port 3000)

- **Handlers**: list, getById, create, update, delete, getStats
- **Special**: Saga integration (publishes `UserRegistered` event on create)
- **Database**: `db.user` model

### Products Service (Port 3001)

- **Handlers**: list, getById, create, update, delete, getStats
- **Special**: Decimal handling for price field (`toDecimal()` / `toNumber()`)
- **Database**: `db.product` model
- **Stats**: Calculates totalInventoryValue (sum of price * stock)

### Orders Service (Port 3002)

- **Handlers**: list, getById, create, update, delete, getByUserId, getByProductId, getStats
- **Special**:
  - Cross-service calls (validates user/product existence via oRPC clients)
  - Saga integration (publishes `OrderCreated` event)
  - Response transformers for Decimal -> Number conversion
  - Nested items relation handling
- **Database**: `db.order` and `db.orderItem` models
- **Clients**: `usersClient`, `productsClient` via `createServiceClient()`

## Service Endpoints (Each Service)

| Endpoint            | Purpose                      |
| ------------------- | ---------------------------- |
| `/api/rpc/*`        | oRPC RPC (type-safe clients) |
| `/api/*`            | OpenAPI REST (standard HTTP) |
| `/api/openapi.json` | OpenAPI 3.0 specification    |
| `/api/docs`         | Scalar API documentation UI  |
| `/health`           | Health check                 |
| `/health/live`      | Liveness probe               |
| `/health/ready`     | Readiness probe              |
| `/`                 | Service info                 |

## oRPC Plugins (Applied to All Services)

| Plugin                   | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `TracingPlugin`          | OpenTelemetry spans per RPC call          |
| `ErrorHandlingPlugin`    | Structured error logging with severity    |
| `LoggingPlugin`          | Request/response logging with duration    |
| `CORSPlugin`             | CORS headers                              |
| `ZodSmartCoercionPlugin` | Auto-coerce query strings to proper types |

## Cross-Service Communication

```typescript
// In orders service
import { createServiceClient } from '@netscript/sdk';
import { usersContractV1 } from '@contracts';

const usersClient = createServiceClient<typeof usersContract>({
  contract: usersContract,
  serviceName: 'users', // Resolved via Aspire: services__users__http__0
});

// Usage in handler
const user = await usersClient.getById({ id: input.userId });
```

## Saga Integration

```typescript
// In users service - create handler
import { createSagaPublisher } from '@netscript/plugin-sagas-core/integration/publisher';

const sagaPublisher = createSagaPublisher<UserRegistrationMessage>();

// After creating user
const newUser = await db.user.create({ data: input });
try {
  await sagaPublisher.publish({
    type: 'UserRegistered',
    userId: newUser.id.toString(),
    email: newUser.email,
    name: newUser.name,
  });
} catch (error) {
  console.warn('Saga publish failed (non-blocking):', error);
}
```

## Aspire Environment Variables

Services receive these from Aspire:

```
PORT=3000
services__users__http__0=http://localhost:3000
services__products__http__0=http://localhost:3001
services__orders__http__0=http://localhost:3002
OTEL_DENO=true
OTEL_SERVICE_NAME=users
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
ConnectionStrings__mysql=Server=...;Database=netscript;...
```
