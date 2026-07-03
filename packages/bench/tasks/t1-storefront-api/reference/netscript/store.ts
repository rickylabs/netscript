/**
 * Persistence adapter for the golden `t1-storefront-api` reference.
 *
 * Products and orders are persisted with `@netscript/kv` — the framework's
 * shared KV seam — so state survives a process restart (the frozen suite's
 * `persistence-across-restart` probe). The provider and file path are resolved
 * from the environment: the conformance harness passes a stable
 * `NETSCRIPT_BENCH_KV_PATH` across restarts so the reopened store sees the same
 * data. There is no hand-rolled file I/O and no external database here — the
 * repository speaks only to `KvStore`.
 *
 * @module
 */

import { getKv } from '@netscript/kv';
import type { Order, Product } from './router.ts';

const PRODUCTS_PREFIX = 'products';
const ORDERS_PREFIX = 'orders';

/** Lazily-opened shared KV store (one per process). */
let store: Awaited<ReturnType<typeof getKv>> | null = null;

async function kv(): Promise<Awaited<ReturnType<typeof getKv>>> {
  if (store === null) {
    const path = Deno.env.get('NETSCRIPT_BENCH_KV_PATH');
    store = await getKv(
      path !== undefined ? { provider: 'deno-kv', path } : { provider: 'deno-kv' },
    );
  }
  return store;
}

/** Persist (create or replace) a product keyed by its id. */
export async function putProduct(product: Product): Promise<void> {
  await (await kv()).set([PRODUCTS_PREFIX, product.id], product);
}

/** Read a product by id, or `null` when absent. */
export async function getProduct(id: string): Promise<Product | null> {
  const entry = await (await kv()).get<Product>([PRODUCTS_PREFIX, id]);
  return entry === null ? null : entry.value;
}

/** List every persisted product. */
export async function listProducts(): Promise<Product[]> {
  const items: Product[] = [];
  for await (const entry of (await kv()).list<Product>({ prefix: [PRODUCTS_PREFIX] })) {
    items.push(entry.value);
  }
  return items;
}

/** Remove a product by id (idempotent). */
export async function deleteProduct(id: string): Promise<void> {
  await (await kv()).delete([PRODUCTS_PREFIX, id]);
}

/** Persist an order keyed by its id. */
export async function putOrder(order: Order): Promise<void> {
  await (await kv()).set([ORDERS_PREFIX, order.id], order);
}

/** Read an order by id, or `null` when absent. */
export async function getOrder(id: string): Promise<Order | null> {
  const entry = await (await kv()).get<Order>([ORDERS_PREFIX, id]);
  return entry === null ? null : entry.value;
}
