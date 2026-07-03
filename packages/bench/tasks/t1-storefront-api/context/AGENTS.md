# NetScript lane — agent guidance for t1

You are solving this task in **NetScript**. Use the framework's primitives; do
not hand-roll what the framework provides. The building blocks below are the
public surface you need — reach for `deno doc <module>` to confirm exact
signatures before writing.

## Contracts first (`@netscript/contracts`)

- Define the API as an oRPC **contract** with zod schemas, then implement it.
- Use `baseContract` for the shared typed error map. It already defines
  `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`,
  and `SERVICE_UNAVAILABLE` — the frozen suite asserts these exact codes.
- Prefer `createCrudContract()` (from `@netscript/contracts/crud`) for the
  products resource — it emits `list` / `get` / `create` / `update` / `delete`
  operations from a single entity schema.
- Use the error factories `notFound()` and `validationFailed()` to raise typed
  errors; use the zod helpers (`boundedString()`, `positiveInt()`, etc.) for the
  field rules.
- Mark a contract server-ready with `implement()` (re-exported from
  `@orpc/server`).

## Service (`@netscript/service`)

- Compose your implemented contracts into a router, e.g.
  `{ v1: { products: ProductsImpl, orders: OrdersImpl } }`.
- Stand the service up with `defineService(router, { name, port })` — the
  one-call preset wires Hono + oRPC + OpenAPI + RPC + health + graceful
  shutdown. For finer control, `createService(router, config)` returns a fluent
  builder (`.withOpenAPI()`, `.withHealth()`, `.serve({ port })`).
- The router is oRPC, not plain Hono. Map your CRUD operations so they surface at
  the REST paths in `prompt.md` (`/api/products`, `/api/orders`).

## Persistence (`@netscript/kv`)

- Use `getKv()` for the shared KV adapter — it lazily auto-detects the provider
  and returns a `KvStore` (`.get` / `.set` / `.delete` / `.has` / `.list` /
  `.atomic`). Do **not** call `Deno.openKv()` directly, and do not add a
  relational database — KV persistence already survives a restart.
- Key products and orders under stable prefixes (e.g. `['products', id]`) so
  `list` can enumerate by prefix.
- Use `.atomic()` with `versionstamp` checks if you need compare-and-set.

## Typed client (optional, but rewarded)

- `@netscript/sdk`'s `defineServices({ products: { contract } })` produces typed
  clients and query factories from the same contract — a clean way to prove the
  wire contract matches the typed contract.

## Checklist

- Typed errors come from `baseContract`'s map, not ad-hoc JSON.
- Products and orders persist via `getKv()`.
- Orders validate that the referenced product exists before creating.
- The service starts with one command and binds a port.
