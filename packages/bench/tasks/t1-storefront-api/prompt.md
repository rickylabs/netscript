# Task t1 — Storefront products API

Build a small HTTP service for a storefront: a **products** catalog with
**orders** that reference products. Your solution is graded by an automated
black-box HTTP suite (which you cannot see) plus a rubric. Optimize for a
correct, typed, persistent service — not for cleverness.

## What to build

A single runnable service that, once started, serves the HTTP contract below on
its bound address. Persistence must survive a process restart (a fresh start of
the same service must still return previously created data).

You are working in the framework named in `context/AGENTS.md`. Read that file
first — it tells you which primitives to use for the router, the typed error
map, and persistence. Prefer the framework's own conventions over hand-rolled
code.

## HTTP contract

All bodies are JSON. Typed errors return an appropriate 4xx status with a body
`{ "code": "<ERROR_CODE>" }` drawn from the framework's shared error map.

### Products

- `POST /api/products` — body `{ name, priceCents, sku }`
  - `201` with the created `Product` (`{ id, name, priceCents, sku }`, `id`
    server-assigned).
  - Invalid input (empty `name`, negative `priceCents`, missing field) → `422`
    (or `400`) with code `VALIDATION_ERROR`.
- `GET /api/products/:id`
  - `200` with the `Product`; unknown id → `404` with code `NOT_FOUND`.
- `GET /api/products`
  - `200` with `{ "items": Product[] }`.
- `PATCH /api/products/:id` — body may set `name` and/or `priceCents`
  - `200` with the updated `Product`; unknown id → `404` `NOT_FOUND`.
- `DELETE /api/products/:id`
  - `204` (or `200`); a subsequent `GET` of that id → `404`.

### Orders

- `POST /api/orders` — body `{ productId, quantity }`
  - `201` with the created `Order` (`{ id, productId, quantity }`) when the
    product exists.
  - Unknown `productId` → `422` (or `404`) with a typed `code`.
- `GET /api/orders/:id`
  - `200` with the `Order`; unknown id → `404` `NOT_FOUND`.

## Field rules

- `name`: non-empty string.
- `priceCents`: non-negative integer.
- `sku`: non-empty string.
- `quantity`: positive integer.
- `id`, `productId`: server-assigned / referential strings.

## Constraints

- Persistence must survive a restart of the service (use the framework's
  key-value store; do not stand up an external database).
- Typed errors must use the framework's shared error map, not ad-hoc strings.
- Keep the surface minimal — only the endpoints above.

## Done when

- The service starts with a single command and serves the contract above.
- Creating, reading, updating, deleting products behaves per the contract.
- Orders correctly reference products and reject unknown products.
- Data persists across a restart.
