import { assertEquals } from 'jsr:@std/assert@^1';

import type { HealthProbeSpec } from '../../domain/deploy/health-gate.ts';
import { FetchHealthProbe, resolveProbeUrl } from './fetch-health-probe.ts';

const baseSpec: HealthProbeSpec = {
  path: '/health',
  port: 8080,
  timeoutMs: 2_000,
  intervalMs: 1_000,
  retries: 5,
  expectStatus: 200,
};

Deno.test('resolveProbeUrl derives http://host:port/path when no url is given', () => {
  assertEquals(resolveProbeUrl(baseSpec, '127.0.0.1'), 'http://127.0.0.1:8080/health');
});

Deno.test('resolveProbeUrl prefers an explicit url over derived host/port/path', () => {
  assertEquals(
    resolveProbeUrl({ ...baseSpec, url: 'https://svc.internal/ready' }, '127.0.0.1'),
    'https://svc.internal/ready',
  );
});

Deno.test('probe is healthy when the observed status equals expectStatus', async () => {
  const seen: string[] = [];
  const probe = new FetchHealthProbe({
    host: '127.0.0.1',
    fetchFn: (input) => {
      seen.push(String(input));
      return Promise.resolve(new Response(null, { status: 200 }));
    },
  });

  const outcome = await probe.probe(baseSpec);

  assertEquals(outcome, { healthy: true, status: 200 });
  assertEquals(seen, ['http://127.0.0.1:8080/health']);
});

Deno.test('probe is unhealthy when the status differs from expectStatus', async () => {
  const probe = new FetchHealthProbe({
    fetchFn: () => Promise.resolve(new Response(null, { status: 503 })),
  });

  assertEquals(await probe.probe(baseSpec), { healthy: false, status: 503 });
});

Deno.test('a thrown fetch (timeout/refused) is a non-healthy outcome, not an error', async () => {
  const probe = new FetchHealthProbe({
    fetchFn: () => Promise.reject(new DOMException('timed out', 'TimeoutError')),
  });

  assertEquals(await probe.probe(baseSpec), { healthy: false });
});
