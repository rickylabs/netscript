import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { createService, defineService, type ServiceApp } from '../mod.ts';

const appOrigin = 'https://app.example';
const otherOrigin = 'https://other.example';

async function withOrigins(
  value: string | undefined,
  run: () => void | Promise<void>,
): Promise<void> {
  // These tests change process-global env and run serially within this module.
  const previous = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  if (value === undefined) Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
  else Deno.env.set('NETSCRIPT_CORS_ORIGINS', value);
  try {
    await run();
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
    else Deno.env.set('NETSCRIPT_CORS_ORIGINS', previous);
  }
}

async function assertOrigin(
  app: ServiceApp,
  origin: string,
  expected: string | null,
): Promise<void> {
  for (const method of ['GET', 'OPTIONS']) {
    const response = await app.request('/health', {
      method,
      headers: { origin, 'access-control-request-method': 'GET' },
      credentials: 'include',
    });
    assertEquals(response.headers.get('access-control-allow-origin'), expected, method);
    await response.body?.cancel();
  }
}

Deno.test('CORS default never grants a wildcard to a credentialed request', async () => {
  await withOrigins(undefined, async () => {
    const app = createService({}, { name: 'default-cors' }).withCors().withHealth().build();
    await assertOrigin(app, appOrigin, null);
    const response = await app.request('/health', {
      headers: { origin: appOrigin, cookie: '__Host-ns_session=fixture' },
      credentials: 'include',
    });
    assertEquals(response.headers.get('access-control-allow-origin'), null);
    assertEquals(response.headers.get('access-control-allow-credentials'), null);
    await response.body?.cancel();
  });
});

Deno.test('CORS environment allowlist refuses origins outside the allowlist', async () => {
  await withOrigins(` ${appOrigin},https://admin.example `, async () => {
    const app = createService({}, { name: 'workspace-cors' }).withCors().withHealth().build();
    await assertOrigin(app, otherOrigin, null);
    await assertOrigin(app, `${appOrigin}.attacker.example`, null);
  });
});

Deno.test('CORS environment allowlist grants the exact approved origins', async () => {
  await withOrigins(` ${appOrigin},https://admin.example `, async () => {
    const app = createService({}, { name: 'workspace-cors' }).withCors().withHealth().build();
    await assertOrigin(app, appOrigin, appOrigin);
    await assertOrigin(app, 'https://admin.example', 'https://admin.example');
  });
});

Deno.test('CORS explicit credentialed allowlist echoes only an approved origin', async () => {
  const app = createService({}, { name: 'credentialed-allowlist' })
    .withCors({ origin: [appOrigin], credentials: true }).withHealth().build();
  await assertOrigin(app, appOrigin, appOrigin);
  await assertOrigin(app, otherOrigin, null);
  const response = await app.request('/health', { headers: { origin: appOrigin } });
  assertEquals(response.headers.get('access-control-allow-credentials'), 'true');
  await response.body?.cancel();
});

Deno.test('CORS wildcard with credentials is rejected at build for literals and arrays', () => {
  for (const origin of ['*', ['*', appOrigin]]) {
    const builder = createService({}, { name: 'invalid-cors' }).withCors({
      origin,
      credentials: true,
    });
    assertThrows(() => builder.build(), TypeError, 'wildcard');
  }
});

Deno.test('CORS explicit noncredentialed wildcard remains an opt-in', async () => {
  const app = createService({}, { name: 'public-cors' })
    .withCors({ origin: '*' }).withHealth().build();
  await assertOrigin(app, otherOrigin, '*');
  const response = await app.request('/health', { headers: { origin: otherOrigin } });
  assertEquals(response.headers.get('access-control-allow-credentials'), null);
  await response.body?.cancel();
});

Deno.test('CORS partial options inherit the environment without per-request env reads', async () => {
  await withOrigins(appOrigin, async () => {
    const app = createService({}, { name: 'partial-cors' })
      .withCors({ credentials: true, allowHeaders: ['Authorization'] }).withHealth().build();
    Deno.env.set('NETSCRIPT_CORS_ORIGINS', otherOrigin);
    await assertOrigin(app, appOrigin, appOrigin);
    await assertOrigin(app, otherOrigin, null);
    const response = await app.request('/health', { headers: { origin: appOrigin } });
    assertEquals(response.headers.get('access-control-allow-credentials'), 'true');
    await response.body?.cancel();
  });
});

Deno.test('CORS explicit allowlist overrides env and snapshots caller configuration', async () => {
  await withOrigins('*', async () => {
    const options = { origin: [appOrigin], credentials: false };
    const builder = createService({}, { name: 'explicit-cors' }).withCors(options).withHealth();
    options.origin.push(otherOrigin);
    options.credentials = true;
    const app = builder.build();
    await assertOrigin(app, appOrigin, appOrigin);
    await assertOrigin(app, otherOrigin, null);
    const response = await app.request('/health', { headers: { origin: appOrigin } });
    assertEquals(response.headers.get('access-control-allow-credentials'), null);
    await response.body?.cancel();
    const denied = createService({}, { name: 'empty-cors' }).withCors({ origin: [] })
      .withHealth().build();
    await assertOrigin(denied, appOrigin, null);
  });
});

Deno.test('CORS invalid environment origins fail closed; blank denies all', async () => {
  for (const value of ['*', 'null', 'bad', `${appOrigin}/path`, `${appOrigin}/`, `${appOrigin},`]) {
    await withOrigins(value, () => {
      assertThrows(() => createService({}, { name: 'bad-env' }).withCors().build(), TypeError);
    });
  }
  await withOrigins('  ', async () => {
    const app = createService({}, { name: 'blank-env' }).withCors().withHealth().build();
    await assertOrigin(app, appOrigin, null);
  });
});

Deno.test('CORS credentialed origin callbacks cannot emit a wildcard', async () => {
  const app = createService({}, { name: 'dynamic-cors' })
    .withCors({ origin: () => Promise.resolve('*'), credentials: true }).withHealth().build();
  await assertOrigin(app, appOrigin, null);
  const allowed = createService({}, { name: 'dynamic-allowed' })
    .withCors({ origin: (origin) => origin === appOrigin ? origin : null, credentials: true })
    .withHealth().build();
  await assertOrigin(allowed, appOrigin, appOrigin);
  await assertOrigin(allowed, otherOrigin, null);
});

Deno.test('defineService inherits workspace origins and accepts an explicit override', async () => {
  await withOrigins(appOrigin, async () => {
    const running = await defineService({}, { name: 'preset-env', port: 0 });
    try {
      await assertOrigin(running.app, appOrigin, appOrigin);
      await assertOrigin(running.app, otherOrigin, null);
    } finally {
      await running.stop();
    }
    // Structural options keep this regression test compilable against main's old preset type.
    const options = { name: 'preset-explicit', port: 0, cors: { origin: [otherOrigin] } };
    const explicit = await defineService({}, options);
    try {
      await assertOrigin(explicit.app, otherOrigin, otherOrigin);
      await assertOrigin(explicit.app, appOrigin, null);
    } finally {
      await explicit.stop();
    }
  });
});

Deno.test('defineService rejects credentialed wildcards before opening a listener', async () => {
  const options = { name: 'preset-invalid', port: 0, cors: { origin: '*', credentials: true } };
  await assertRejects(
    async () => {
      const unexpected = await defineService({}, options);
      await unexpected.stop();
    },
    TypeError,
    'wildcard',
  );
});
