/**
 * FROZEN black-box suite for `t1-storefront-api`.
 *
 * This suite is the ground truth for task correctness. It is NEVER shown to the
 * agent and NEVER copied into the sandbox. It probes only the public HTTP
 * contract described in `../prompt.md`; it makes no assumption about internal
 * structure, storage, or framework wiring beyond that contract. Do not edit it
 * to accommodate a solution — a failing probe is a failing solution.
 *
 * Contract under test (see prompt.md for the authoritative spec):
 *   POST   /api/products            {name, priceCents, sku}      -> 201 Product
 *   GET    /api/products/:id                                     -> 200 Product | 404
 *   GET    /api/products                                         -> 200 {items: Product[]}
 *   PATCH  /api/products/:id        {name?, priceCents?}         -> 200 Product | 404
 *   DELETE /api/products/:id                                     -> 204 | 404
 *   POST   /api/orders             {productId, quantity}         -> 201 Order | 422
 *   GET    /api/orders/:id                                        -> 200 Order | 404
 * Typed errors carry a JSON body `{ code: string }` from the shared error map.
 *
 * @module
 */

import type {
  FrozenSuite,
  ProbeContext,
  ProbeDefinition,
} from '../../../src/domain/frozen-suite.ts';
import type { HttpResponse } from '../../../src/ports/http-client.ts';

const TIMEOUT_MS = 10_000;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  assert(typeof value === 'object' && value !== null, message);
  return value as Record<string, unknown>;
}

async function createProduct(
  ctx: ProbeContext,
  body: Record<string, unknown>,
): Promise<HttpResponse> {
  return await ctx.http.request({
    method: 'POST',
    url: `${ctx.baseUrl}/api/products`,
    body,
    timeoutMs: TIMEOUT_MS,
  });
}

const sampleProduct = (): Record<string, unknown> => ({
  name: 'Aeron Chair',
  priceCents: 129900,
  sku: `SKU-${crypto.randomUUID().slice(0, 8)}`,
});

const probes: ProbeDefinition[] = [
  {
    id: 'create-product',
    title: 'POST /api/products creates and echoes a typed product',
    async run(ctx) {
      const res = await createProduct(ctx, sampleProduct());
      assert(res.status === 201, `expected 201, got ${res.status}`);
      const product = asRecord(res.json, 'create response must be a JSON object');
      assert(
        typeof product.id === 'string' && product.id.length > 0,
        'product.id must be a non-empty string',
      );
      assert(product.name === 'Aeron Chair', 'product.name must round-trip');
      assert(product.priceCents === 129900, 'product.priceCents must round-trip');
    },
  },
  {
    id: 'get-product',
    title: 'GET /api/products/:id returns the created product',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const id = asRecord(created.json, 'create response object').id;
      const res = await ctx.http.request({
        method: 'GET',
        url: `${ctx.baseUrl}/api/products/${id}`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(res.status === 200, `expected 200, got ${res.status}`);
      const product = asRecord(res.json, 'get response object');
      assert(product.id === id, 'returned id must match');
    },
  },
  {
    id: 'list-products',
    title: 'GET /api/products lists created products under items[]',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const id = asRecord(created.json, 'create response object').id;
      const res = await ctx.http.request({
        method: 'GET',
        url: `${ctx.baseUrl}/api/products`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(res.status === 200, `expected 200, got ${res.status}`);
      const body = asRecord(res.json, 'list response object');
      const items = body.items;
      assert(Array.isArray(items), 'list response must expose an items array');
      const found = (items as unknown[]).some(
        (item) =>
          typeof item === 'object' && item !== null && (item as Record<string, unknown>).id === id,
      );
      assert(found, 'created product must appear in the list');
    },
  },
  {
    id: 'update-product',
    title: 'PATCH /api/products/:id updates fields',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const id = asRecord(created.json, 'create response object').id;
      const res = await ctx.http.request({
        method: 'PATCH',
        url: `${ctx.baseUrl}/api/products/${id}`,
        body: { priceCents: 99900 },
        timeoutMs: TIMEOUT_MS,
      });
      assert(res.status === 200, `expected 200, got ${res.status}`);
      const product = asRecord(res.json, 'update response object');
      assert(product.priceCents === 99900, 'priceCents must reflect the update');
    },
  },
  {
    id: 'delete-product',
    title: 'DELETE /api/products/:id removes the product (then 404)',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const id = asRecord(created.json, 'create response object').id;
      const del = await ctx.http.request({
        method: 'DELETE',
        url: `${ctx.baseUrl}/api/products/${id}`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(del.status === 204 || del.status === 200, `expected 200/204, got ${del.status}`);
      const after = await ctx.http.request({
        method: 'GET',
        url: `${ctx.baseUrl}/api/products/${id}`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(after.status === 404, `expected 404 after delete, got ${after.status}`);
    },
  },
  {
    id: 'validation-error',
    title: 'POST invalid product yields a typed VALIDATION_ERROR',
    async run(ctx) {
      const res = await createProduct(ctx, { name: '', priceCents: -5 });
      assert(res.status === 422 || res.status === 400, `expected 400/422, got ${res.status}`);
      const body = asRecord(res.json, 'error response object');
      assert(
        body.code === 'VALIDATION_ERROR',
        `expected VALIDATION_ERROR code, got ${String(body.code)}`,
      );
    },
  },
  {
    id: 'not-found-error',
    title: 'GET missing product yields a typed NOT_FOUND',
    async run(ctx) {
      const res = await ctx.http.request({
        method: 'GET',
        url: `${ctx.baseUrl}/api/products/does-not-exist`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(res.status === 404, `expected 404, got ${res.status}`);
      const body = asRecord(res.json, 'error response object');
      assert(body.code === 'NOT_FOUND', `expected NOT_FOUND code, got ${String(body.code)}`);
    },
  },
  {
    id: 'referential-integrity',
    title: 'Orders reference real products; unknown product is rejected',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const productId = asRecord(created.json, 'create response object').id;

      const ok = await ctx.http.request({
        method: 'POST',
        url: `${ctx.baseUrl}/api/orders`,
        body: { productId, quantity: 2 },
        timeoutMs: TIMEOUT_MS,
      });
      assert(ok.status === 201, `expected 201 for valid order, got ${ok.status}`);
      const order = asRecord(ok.json, 'order response object');
      assert(order.productId === productId, 'order must reference the product');

      const bad = await ctx.http.request({
        method: 'POST',
        url: `${ctx.baseUrl}/api/orders`,
        body: { productId: 'ghost', quantity: 1 },
        timeoutMs: TIMEOUT_MS,
      });
      assert(
        bad.status === 422 || bad.status === 404,
        `expected 422/404 for unknown product, got ${bad.status}`,
      );
      const body = asRecord(bad.json, 'order error object');
      assert(typeof body.code === 'string', 'referential error must carry a typed code');
    },
  },
  {
    id: 'persistence-across-restart',
    title: 'A created product survives a service restart',
    async run(ctx) {
      const created = await createProduct(ctx, sampleProduct());
      const id = asRecord(created.json, 'create response object').id;
      await ctx.restart();
      const res = await ctx.http.request({
        method: 'GET',
        url: `${ctx.baseUrl}/api/products/${id}`,
        timeoutMs: TIMEOUT_MS,
      });
      assert(res.status === 200, `expected product to persist across restart, got ${res.status}`);
    },
  },
  {
    id: 'typed-contract-roundtrip',
    title: 'Create response validates against the typed product shape',
    async run(ctx) {
      const res = await createProduct(ctx, sampleProduct());
      const product = asRecord(res.json, 'create response object');
      assert(typeof product.id === 'string', 'id must be string');
      assert(typeof product.name === 'string', 'name must be string');
      assert(typeof product.priceCents === 'number', 'priceCents must be number');
      assert(typeof product.sku === 'string', 'sku must be string');
    },
  },
];

/** The frozen suite export consumed by the test runner. */
export const suite: FrozenSuite = {
  taskId: 't1-storefront-api',
  probes,
};
