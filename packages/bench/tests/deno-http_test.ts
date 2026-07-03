import { assertEquals } from '@std/assert';
import {
  type BootedService,
  DenoHttpTestRunner,
  type ServiceHarness,
  type SuiteLoader,
} from '../src/adapters/test-runner/deno-http.ts';
import { SystemClock } from '../src/adapters/clock/system-clock.ts';
import { suite } from '../tasks/t1-storefront-api/tests/frozen-suite.ts';
import type { FrozenSuite } from '../src/domain/frozen-suite.ts';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/ports/http-client.ts';
import type { CommandHandle } from '../src/ports/command-executor.ts';

interface Product {
  id: string;
  name: string;
  priceCents: number;
  sku: string;
}
interface Order {
  id: string;
  productId: string;
  quantity: number;
}

/** In-memory service implementing the t1 contract, driven over the HTTP port. */
class InMemoryStoreClient implements HttpClient {
  #products = new Map<string, Product>();
  #orders = new Map<string, Order>();
  #seq = 0;

  #id(prefix: string): string {
    this.#seq += 1;
    return `${prefix}-${this.#seq}`;
  }

  request(request: HttpRequest): Promise<HttpResponse> {
    return Promise.resolve(this.#route(request));
  }

  #json(status: number, json: unknown): HttpResponse {
    const text = JSON.stringify(json);
    return { status, ok: status >= 200 && status < 300, headers: {}, text, json };
  }

  #empty(status: number): HttpResponse {
    return { status, ok: status >= 200 && status < 300, headers: {}, text: '', json: undefined };
  }

  #route(req: HttpRequest): HttpResponse {
    const path = new URL(req.url).pathname;
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (req.method === 'POST' && path === '/api/products') {
      const name = body.name;
      const priceCents = body.priceCents;
      const sku = body.sku;
      if (
        typeof name !== 'string' || name.length === 0 || typeof priceCents !== 'number' ||
        priceCents < 0 || typeof sku !== 'string' || sku.length === 0
      ) {
        return this.#json(422, { code: 'VALIDATION_ERROR' });
      }
      const product: Product = { id: this.#id('prod'), name, priceCents, sku };
      this.#products.set(product.id, product);
      return this.#json(201, product);
    }

    if (req.method === 'GET' && path === '/api/products') {
      return this.#json(200, { items: [...this.#products.values()] });
    }

    const productMatch = path.match(/^\/api\/products\/(.+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const existing = this.#products.get(id);
      if (req.method === 'GET') {
        return existing ? this.#json(200, existing) : this.#json(404, { code: 'NOT_FOUND' });
      }
      if (req.method === 'PATCH') {
        if (!existing) return this.#json(404, { code: 'NOT_FOUND' });
        const updated: Product = {
          ...existing,
          name: typeof body.name === 'string' ? body.name : existing.name,
          priceCents: typeof body.priceCents === 'number' ? body.priceCents : existing.priceCents,
        };
        this.#products.set(id, updated);
        return this.#json(200, updated);
      }
      if (req.method === 'DELETE') {
        if (!existing) return this.#json(404, { code: 'NOT_FOUND' });
        this.#products.delete(id);
        return this.#empty(204);
      }
    }

    if (req.method === 'POST' && path === '/api/orders') {
      const productId = body.productId;
      const quantity = body.quantity;
      if (typeof productId !== 'string' || !this.#products.has(productId)) {
        return this.#json(422, { code: 'VALIDATION_ERROR' });
      }
      if (typeof quantity !== 'number' || quantity <= 0) {
        return this.#json(422, { code: 'VALIDATION_ERROR' });
      }
      const order: Order = { id: this.#id('ord'), productId, quantity };
      this.#orders.set(order.id, order);
      return this.#json(201, order);
    }

    const orderMatch = path.match(/^\/api\/orders\/(.+)$/);
    if (orderMatch && req.method === 'GET') {
      const order = this.#orders.get(orderMatch[1]);
      return order ? this.#json(200, order) : this.#json(404, { code: 'NOT_FOUND' });
    }

    return this.#json(404, { code: 'NOT_FOUND' });
  }
}

const noopHandle: CommandHandle = { stop: () => Promise.resolve() };

class FakeHarness implements ServiceHarness {
  boot(_workdir: string, _timeoutMs: number): Promise<BootedService> {
    const baseUrl = 'http://service.local';
    return Promise.resolve({
      baseUrl,
      handle: noopHandle,
      // In-memory store persists across "restart" (state lives in the client).
      restart: () => Promise.resolve(baseUrl),
    });
  }
}

class StaticSuiteLoader implements SuiteLoader {
  constructor(private readonly value: FrozenSuite) {}
  load(_suitePath: string): Promise<FrozenSuite> {
    return Promise.resolve(this.value);
  }
}

Deno.test('deno-http runner runs the frozen suite green against a compliant service', async () => {
  const runner = new DenoHttpTestRunner({
    loader: new StaticSuiteLoader(suite),
    harness: new FakeHarness(),
    http: new InMemoryStoreClient(),
    clock: new SystemClock(),
  });

  const result = await runner.run({
    taskId: 't1-storefront-api',
    workdir: '/fake',
    suitePath: '/fake/tests/frozen-suite.ts',
    timeoutMs: 10_000,
  });

  assertEquals(result.failed, 0, JSON.stringify(result.probes.filter((p) => p.verdict === 'fail')));
  assertEquals(result.green, true);
  assertEquals(result.passed, suite.probes.length);
  assertEquals(result.passRate, 1);
});

Deno.test('deno-http runner reports failures when the service violates the contract', async () => {
  // A broken client that 500s everything -> all probes fail, not green.
  const broken: HttpClient = {
    request: () =>
      Promise.resolve({ status: 500, ok: false, headers: {}, text: '', json: undefined }),
  };
  const runner = new DenoHttpTestRunner({
    loader: new StaticSuiteLoader(suite),
    harness: new FakeHarness(),
    http: broken,
    clock: new SystemClock(),
  });

  const result = await runner.run({
    taskId: 't1-storefront-api',
    workdir: '/fake',
    suitePath: '/fake/tests/frozen-suite.ts',
    timeoutMs: 10_000,
  });

  assertEquals(result.green, false);
  assertEquals(result.passed, 0);
});
