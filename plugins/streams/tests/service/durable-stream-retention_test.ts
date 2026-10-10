import { assert, assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@^1/mock';
import { DurableStreamTestServer } from '@durable-streams/server';
import { DurableStreamProducerTransport } from '../../../../packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts';
import { DurableStreamAdmin } from '../../../../packages/plugin-streams-core/admin.ts';

for (const storage of ['memory', 'file-backed'] as const) {
  Deno.test(`retention guidance matches reference-server sliding TTL and hard expiry (${storage})`, async () => {
    const dataDir = storage === 'file-backed' ? await Deno.makeTempDir() : undefined;
    const server = new DurableStreamTestServer({ port: 0, dataDir });
    let now = Date.now();
    // Control only the server's wall clock; HTTP and the upstream adapters remain real.
    const clock = stub(Date, 'now', () => now);
    const transport = new DurableStreamProducerTransport();
    const admin = new DurableStreamAdmin();
    try {
      const baseUrl = await server.start();
      const ttl = { url: `${baseUrl}/retention/ttl`, headers: {}, requestTimeoutMs: 5000 };
      assertEquals(
        await transport.connect({ ...ttl, retention: { kind: 'ttl', ttlSeconds: 2 } }),
        { ok: true, value: undefined },
      );
      for (let sequence = 0; sequence < 4; sequence++) {
        now += 1000;
        assertEquals(
          await transport.append({
            ...ttl,
            body: JSON.stringify({ sequence }),
            identity: { producerId: 'retention-test', epoch: 0, sequence },
          }),
          { ok: true, value: { duplicate: false } },
        );
      }
      const active = await admin.head(ttl);
      assert(active.ok && active.value !== null, 'appends keep TTL alive beyond creation + TTL');
      now += 1500;
      const read = await fetch(ttl.url);
      assertEquals(read.status, 200);
      await read.text();
      now += 1500;
      const renewed = await admin.head(ttl);
      assert(renewed.ok && renewed.value !== null, 'reads also renew TTL');
      assertEquals(
        await transport.connect({ ...ttl, retention: { kind: 'ttl', ttlSeconds: 2 } }),
        { ok: true, value: undefined },
      );
      now += 1000;
      assertEquals(
        await admin.head(ttl),
        { ok: true, value: null },
        'HEAD and PUT do not renew TTL',
      );
      assertEquals(await admin.delete(ttl), { ok: true, value: { deleted: false } });

      const expiry = { ...ttl, url: `${baseUrl}/retention/expiry` };
      const expiresAt = new Date(now + 2000).toISOString();
      assertEquals(
        await transport.connect({ ...expiry, retention: { kind: 'expires-at', expiresAt } }),
        { ok: true, value: undefined },
      );
      now += 1500;
      assertEquals(
        await transport.append({
          ...expiry,
          body: '{"active":true}',
          identity: { producerId: 'expiry-test', epoch: 0, sequence: 0 },
        }),
        { ok: true, value: { duplicate: false } },
      );
      const expiresRead = await fetch(expiry.url);
      assertEquals(expiresRead.status, 200);
      await expiresRead.text();
      now += 1000;
      assertEquals(
        await admin.head(expiry),
        { ok: true, value: null },
        'absolute expiry never slides',
      );

      // Pin the guidance to the observed behavior; these assertions fail at the reviewed head.
      const recipe = await Deno.readTextFile(
        new URL(
          '../../../../docs/site/durable-workflows/how-to/bound-stream-retention.md',
          import.meta.url,
        ),
      );
      assert(recipe.includes('sliding inactivity window'));
      assert(recipe.includes('Absolute expiry does not slide'));
      assert(!recipe.includes('A TTL starts at creation'));
    } finally {
      await server.stop();
      clock.restore();
      if (dataDir) await Deno.remove(dataDir, { recursive: true });
    }
  });
}
