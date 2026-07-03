/**
 * Entry point for the golden `t1-storefront-api` reference service.
 *
 * A single command boots it:
 *
 * ```sh
 * PORT=8080 NETSCRIPT_BENCH_KV_PATH=./storefront.kv \
 *   deno run --allow-all --unstable-kv main.ts
 * ```
 *
 * `defineService` wires CORS, logging, the oRPC OpenAPI REST surface at `/api/*`
 * (so the router's `/products` and `/orders` routes are served under
 * `/api/products` and `/api/orders`), the RPC endpoint, health checks, and the
 * listener. `PORT` selects the bind port (0 lets the OS choose);
 * `NETSCRIPT_BENCH_KV_PATH` selects the persistent KV file so data survives a
 * restart.
 *
 * @module
 */

import { defineService } from '@netscript/service';
import { router } from './router.ts';

const port = Number.parseInt(Deno.env.get('PORT') ?? '0', 10);

await defineService(router, {
  name: 'storefront',
  port,
  openapi: {
    title: 'Storefront API',
    description: 'Golden NetScript reference for the t1-storefront-api bench task.',
  },
});
