import { assertEquals } from '@std/assert';

const root = new URL('../../../', import.meta.url);

Deno.test('RPC and query dependency floors qualify the canary.5 family together', async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
  for (const name of ['client', 'contract', 'openapi', 'otel', 'server', 'tanstack-query', 'zod']) {
    assertEquals(config.catalog[`@orpc/${name}`], '^1.15.5', `@orpc/${name}`);
  }
  for (const name of ['query-core', 'preact-query']) {
    assertEquals(config.catalog[`@tanstack/${name}`], '^5.104.1', name);
  }
  assertEquals(config.catalog.zod, '^4.6.5');
  for (const path of ['packages/service/deno.json', 'packages/logger/deno.json']) {
    const member = JSON.parse(await Deno.readTextFile(new URL(path, root)));
    assertEquals(member.imports.hono, 'jsr:@hono/hono@4.13.13', path);
  }
  const telemetry = JSON.parse(
    await Deno.readTextFile(new URL('packages/telemetry/deno.json', root)),
  );
  assertEquals(telemetry.imports['@hono/otel'], 'jsr:@hono/otel@^1.2.0');
  assertEquals(
    telemetry.imports['@opentelemetry/semantic-conventions'],
    'npm:@opentelemetry/semantic-conventions@1.43.0',
  );
});
