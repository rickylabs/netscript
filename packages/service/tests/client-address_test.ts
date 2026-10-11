import { assert, assertEquals } from '@std/assert';
import { createService } from '../mod.ts';
import { createMemoryRateLimitStore, resolveServiceClientAddress } from '../src/rate-limit/mod.ts';

const env = (hostname: string) => ({
  remoteAddr: { transport: 'tcp' as const, hostname, port: 1234 },
});
const proxy = (address: string) => ['127.0.0.1', '192.0.2.10'].includes(address);
const forwarded = (xff: string) =>
  new Request('http://service.test', { headers: { 'x-forwarded-for': xff } });

Deno.test('client address ignores spoofed XFF by default and from an untrusted socket', () => {
  assertEquals(
    resolveServiceClientAddress(forwarded('198.51.100.1'), env('192.0.2.1')),
    '192.0.2.1',
  );
  assertEquals(
    resolveServiceClientAddress(forwarded('198.51.100.1'), env('192.0.2.1'), proxy),
    '192.0.2.1',
  );
  assertEquals(resolveServiceClientAddress(forwarded('198.51.100.1'), undefined, proxy), undefined);
});

Deno.test('client address honours trusted hops only, stopping before spoofed leftmost XFF', () => {
  assertEquals(
    resolveServiceClientAddress(forwarded('198.51.100.1, 192.0.2.10'), env('127.0.0.1'), proxy),
    '198.51.100.1',
  );
  assertEquals(
    resolveServiceClientAddress(
      forwarded('203.0.113.99, 198.51.100.1, 192.0.2.10'),
      env('127.0.0.1'),
      proxy,
    ),
    '198.51.100.1',
  );
  assertEquals(
    resolveServiceClientAddress(forwarded('2001:db8::1'), env('127.0.0.1'), proxy),
    '2001:db8::1',
  );
});

Deno.test('client address rejects malformed, oversized and overlong XFF chains', () => {
  for (
    const xff of [
      '',
      'unknown',
      '192.0.2.1,',
      '192.0.2.1:1234',
      '127.1',
      '0x7f000001',
      '192.000.2.1',
      '192.0.2.256',
      '192.0.2.1/path',
      'user@192.0.2.1',
      '[2001:db8::1]',
      '2001:db8::1/path',
      '2001:db8::1junk',
      '2001::db8::1',
      'a'.repeat(8193),
      Array(33).fill('192.0.2.10').join(','),
    ]
  ) {
    assertEquals(resolveServiceClientAddress(forwarded(xff), env('127.0.0.1'), proxy), '127.0.0.1');
  }
});

Deno.test('listener exposes the direct socket address through ServiceEnvironment', async () => {
  const running = await createService({}, { name: 'socket-address' })
    .route('get', '/peer', (c) => c.json(c.env.remoteAddr))
    .serve({ hostname: '127.0.0.1', port: 0, handleSignals: false });
  try {
    const response = await fetch(`http://127.0.0.1:${running.addr.port}/peer`, {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    });
    const peer = await response.json();
    assertEquals(peer.hostname, '127.0.0.1');
    assert(Number.isInteger(peer.port) && peer.port > 0);
  } finally {
    await running.stop();
  }
});

for (const trusted of [false, true]) {
  Deno.test(`listener rate limit ${trusted ? 'honours trusted' : 'ignores spoofed'} XFF keys`, async () => {
    const running = await createService({}, { name: 'xff-quota' })
      .withRateLimit({
        routes: ['/a'],
        limit: 1,
        windowMs: 10_000,
        now: () => 0,
        store: createMemoryRateLimitStore(),
        trustProxy: trusted ? proxy : false,
      })
      .route('get', '/a', (c) => c.text('ok'))
      .serve({ hostname: '127.0.0.1', port: 0, handleSignals: false });
    try {
      const request = async (xff: string) => {
        const response = await fetch(`http://127.0.0.1:${running.addr.port}/a`, {
          headers: { 'x-forwarded-for': xff },
        });
        await response.body?.cancel();
        return response.status;
      };
      assertEquals(await request('198.51.100.1'), 200);
      assertEquals(await request('198.51.100.2'), trusted ? 200 : 429);
      assertEquals(await request('198.51.100.1'), 429);
    } finally {
      await running.stop();
    }
  });
}
