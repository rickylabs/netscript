import { assertEquals, assertThrows } from '@std/assert';
import { configure, createPackageLogger, type LogRecord, resetLogging } from '@netscript/logger';
import { createService, type ServiceApp } from '../mod.ts';
import { createMemoryRateLimitStore, type ServiceRateLimitOptions } from '../src/rate-limit/mod.ts';

function app(options: Partial<ServiceRateLimitOptions> = {}): ServiceApp {
  return createService({}, { name: 'address-quota' })
    .withRateLimit({
      routes: ['/a'],
      limit: 1,
      windowMs: 1000,
      now: () => 0,
      store: createMemoryRateLimitStore(),
      ...options,
    })
    .route('get', '/a', (c) => c.text('ok'))
    .build();
}

async function request(service: ServiceApp, hostname: string, xff?: string): Promise<number> {
  const response = await service.fetch(
    new Request('http://service.test/a', xff ? { headers: { 'x-forwarded-for': xff } } : undefined),
    { remoteAddr: { transport: 'tcp', hostname, port: 1234 } },
  );
  await response.body?.cancel();
  return response.status;
}

Deno.test('IPv6 /64 default prevents rotating interface IDs from evading quota or filling maxKeys', async () => {
  const service = app({ store: createMemoryRateLimitStore({ maxKeys: 2 }) });
  assertEquals(await request(service, '2001:db8:1:2::1'), 200);
  for (let id = 2; id < 20; id++) {
    assertEquals(await request(service, `2001:db8:1:2::${id.toString(16)}`), 429);
  }
  assertEquals(await request(service, '2001:0DB8:0001:0002:0000:0000:0000:0001'), 429);
  assertEquals(await request(service, '2001:db8:1:3::1'), 200);
  assertEquals(await request(service, '2001:db8:1:4::1'), 429);
});

Deno.test('IPv6 prefix applies to trusted XFF, while socket metadata remains unchanged', async () => {
  const service = app({ trustProxy: (address) => address === '192.0.2.10' });
  assertEquals(await request(service, '192.0.2.10', '2001:db8::1'), 200);
  assertEquals(await request(service, '192.0.2.10', '2001:db8::ffff'), 429);
});

Deno.test('IPv6 configurable prefixes mask partial hextets and support /0 and /128', async () => {
  const partial = app({ ipv6Prefix: 65 });
  assertEquals(await request(partial, '2001:db8:1:2:8000::1'), 200);
  assertEquals(await request(partial, '2001:db8:1:2:ffff::2'), 429);
  assertEquals(await request(partial, '2001:db8:1:2:7fff::1'), 200);
  const global = app({ ipv6Prefix: 0 });
  assertEquals(await request(global, '::1'), 200);
  assertEquals(await request(global, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'), 429);
  const host = app({ ipv6Prefix: 128 });
  assertEquals(await request(host, '2001:db8::1'), 200);
  assertEquals(await request(host, '2001:0DB8:0:0:0:0:0:1'), 429);
  assertEquals(await request(host, '2001:db8::2'), 200);
});

Deno.test('IPv6 address keys canonicalize mapped IPv4 forms and retain scope IDs', async () => {
  const mapped = app({ ipv6Prefix: 128 });
  assertEquals(await request(mapped, '::ffff:192.0.2.1'), 200);
  assertEquals(await request(mapped, '0:0:0:0:0:ffff:c000:201'), 429);
  const scoped = app();
  assertEquals(await request(scoped, 'fe80::1%eth0'), 200);
  assertEquals(await request(scoped, 'fe80::2%eth0'), 429);
  assertEquals(await request(scoped, 'fe80::1%eth1'), 200);
});

Deno.test('mapped IPv4 peers have independent native IPv4 quotas before prefix masking', async () => {
  for (const ipv6Prefix of [undefined, 0, 64, 128]) {
    const service = app({ ipv6Prefix });
    assertEquals(await request(service, '::ffff:192.0.2.1'), 200);
    assertEquals(await request(service, '::ffff:198.51.100.7'), 200);
    assertEquals(await request(service, '192.0.2.1'), 429);
    assertEquals(await request(service, '0:0:0:0:0:FFFF:c000:0201'), 429);
    assertEquals(await request(service, '198.51.100.7'), 429);
    // Similar-looking non-mapped addresses keep their IPv6 prefix policy.
    assertEquals(await request(service, '::fffe:c000:201'), 200);
  }
});

Deno.test('trusted mapped XFF addresses share only their corresponding native IPv4 quota', async () => {
  const service = app({ trustProxy: (address) => address === '192.0.2.10' });
  assertEquals(await request(service, '192.0.2.10', '::ffff:192.0.2.1'), 200);
  assertEquals(await request(service, '192.0.2.10', '::ffff:198.51.100.7'), 200);
  assertEquals(await request(service, '192.0.2.10', '192.0.2.1'), 429);
  assertEquals(await request(service, '192.0.2.10', '::ffff:c633:6407'), 429);
});

Deno.test('dual-stack listener keeps distinct mapped IPv4 socket peers in independent quotas', async () => {
  const running = await createService({}, { name: 'dual-stack-quota' })
    .withRateLimit({
      routes: ['/a'],
      limit: 1,
      windowMs: 1000,
      now: () => 0,
      store: createMemoryRateLimitStore(),
    })
    .route('get', '/a', (c) => c.json(c.env.remoteAddr))
    .serve({ hostname: '::', port: 0, handleSignals: false });
  const first = Deno.createHttpClient({ localAddress: '127.0.0.1' });
  const second = Deno.createHttpClient({ localAddress: '127.0.0.2' });
  try {
    const url = `http://127.0.0.1:${running.addr.port}/a`;
    for (
      const [client, address] of [[first, '::ffff:127.0.0.1'], [
        second,
        '::ffff:127.0.0.2',
      ]] as const
    ) {
      const init: RequestInit & { client: Deno.HttpClient } = { client };
      const response = await fetch(url, init);
      assertEquals(response.status, 200);
      assertEquals((await response.json()).hostname, address);
    }
    for (const client of [first, second]) {
      const init: RequestInit & { client: Deno.HttpClient } = { client };
      const response = await fetch(url, init);
      assertEquals(response.status, 429);
      await response.body?.cancel();
    }
  } finally {
    first.close();
    second.close();
    await running.stop();
  }
});

Deno.test('IPv4 and custom keys retain their individual quotas', async () => {
  const ipv4 = app({ ipv6Prefix: 0 });
  assertEquals(await request(ipv4, '192.0.2.1'), 200);
  assertEquals(await request(ipv4, '192.0.2.2'), 200);
  assertEquals(await request(ipv4, '192.0.2.1'), 429);
  const custom = app({ key: (c) => c.req.header('x-key')! });
  for (
    const [key, expected] of [['2001:db8::1', 200], ['2001:db8::2', 200], ['2001:db8::1', 429]]
  ) {
    const response = await custom.fetch(
      new Request('http://service.test/a', {
        headers: { 'x-key': String(key) },
      }),
    );
    assertEquals(response.status, expected);
    await response.body?.cancel();
  }
});

Deno.test('IPv6 prefix validation rejects non-integers and values outside 0–128 at construction', () => {
  for (const ipv6Prefix of [-1, 129, 64.5, NaN, Infinity]) {
    assertThrows(() => app({ ipv6Prefix }), RangeError, 'ipv6Prefix');
  }
});

Deno.test('missing peer warns once per stage through request logger or package fallback', async () => {
  const warnings: LogRecord[] = [];
  await resetLogging();
  await configure({
    sinks: {
      capture: (record) => {
        if (record.level === 'warning') warnings.push(record);
      },
    },
    loggers: [{ category: ['netscript'], sinks: ['capture'], lowestLevel: 'warning' }],
  });
  try {
    const metadata = app();
    await request(metadata, '192.0.2.1');
    const custom = app({ key: () => 'custom' });
    await custom.request('/a');
    const builder = createService({}, { name: 'warn-once' });
    const requestLogger = createPackageLogger('request-test');
    builder.use(async (c, next) => {
      c.set('logger', requestLogger);
      await next();
    });
    builder.withRateLimit({
      routes: ['/a'],
      limit: 1,
      windowMs: 1000,
      now: () => 0,
      store: createMemoryRateLimitStore(),
    }).route('get', '/a', (c) => c.text('ok'));
    await builder.build().request('/unmatched');
    assertEquals(warnings.length, 0);
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => builder.build().request('/a')),
    );
    assertEquals(responses.filter((response) => response.status === 200).length, 1);
    assertEquals(responses.filter((response) => response.status === 429).length, 4);
    assertEquals(warnings.length, 1);
    assertEquals(warnings[0]!.category, requestLogger.category);
    assertEquals(
      warnings[0]!.message.join('').includes('all clients share the unknown bucket'),
      true,
    );
    const fallback = app();
    await fallback.request('/a');
    await fallback.request('/a');
    assertEquals(warnings.length, 2);
    assertEquals(warnings[1]!.category, ['netscript', 'packages', 'service']);
  } finally {
    await resetLogging();
  }
});
