import { assertEquals, assertThrows } from '@std/assert';
import { createService } from '../mod.ts';

Deno.test('doctrine records owner-approved BFF topology and its composition boundaries', async () => {
  const decision = (await Deno.readTextFile(
    new URL(
      '../../../docs/architecture/doctrine/07-composition-and-extension.md',
      import.meta.url,
    ),
  )).replace(/\s+/g, ' ');
  for (
    const required of [
      '## Browser authentication topology (0.0.8, owner decision)',
      'https://github.com/rickylabs/netscript/issues/1386',
      'https://github.com/rickylabs/netscript/issues/2103',
      'The Fresh app owns sign-in, callback,',
      'Its server forwards a bearer to services',
      'Workers, sagas and triggers operate with a service identity',
    ]
  ) {
    if (!decision.includes(required)) throw new Error(`Missing topology decision: ${required}`);
  }
});

Deno.test('CORS breaking migration records exact environment and preset option snippets', async () => {
  const readme = await Deno.readTextFile(new URL('../README.md', import.meta.url));
  const changelog = await Deno.readTextFile(new URL('../CHANGELOG.md', import.meta.url));
  for (
    const required of [
      '## CORS migration (breaking in 0.0.8)',
      "export NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'",
      "cors: { origin: ['https://app.example'] }",
    ]
  ) {
    if (!readme.includes(required)) throw new Error(`Missing migration: ${required}`);
  }
  if (!changelog.includes('**Breaking (0.0.8):** CORS')) {
    throw new Error('Missing breaking changelog');
  }
});

Deno.test('CORS topology denies implicit cross-origin access and rejects credentialed wildcard', async () => {
  const previous = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
  try {
    const app = createService({}, { name: 'cors-default-conformance' }).withCors().withHealth()
      .build();
    const response = await app.request('/health', {
      headers: { origin: 'https://foreign.example' },
    });
    assertEquals(response.status, 200);
    assertEquals(response.headers.get('access-control-allow-origin'), null);
    assertEquals(response.headers.get('access-control-allow-credentials'), null);
    await response.body?.cancel();
    assertThrows(
      () =>
        createService({}, { name: 'cors-invalid-conformance' })
          .withCors({ origin: '*', credentials: true }).build(),
      Error,
    );
  } finally {
    if (previous !== undefined) Deno.env.set('NETSCRIPT_CORS_ORIGINS', previous);
  }
});

Deno.test('CORS allowlist refuses foreign simple and preflight origins without enabling credentialed reads', async () => {
  const appOrigin = 'https://app.example';
  const app = createService({}, { name: 'cors-allowlist-conformance' })
    .withCors({ origin: [appOrigin] }).withHealth().build();
  for (const method of ['GET', 'OPTIONS']) {
    for (const origin of [appOrigin, 'https://foreign.example']) {
      const response = await app.request('/health', {
        method,
        headers: {
          origin,
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'authorization',
        },
      });
      assertEquals(
        response.headers.get('access-control-allow-origin'),
        origin === appOrigin ? origin : null,
      );
      assertEquals(response.headers.get('access-control-allow-credentials'), null);
      await response.body?.cancel();
    }
  }
});
