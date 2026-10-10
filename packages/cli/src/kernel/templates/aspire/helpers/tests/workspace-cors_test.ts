/** Generated helper contract and service-policy integration; runtime is coordinator-owned. */
import { assertEquals } from '@std/assert';
import { createService } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import { allocatedValue, corsValue, registerWorkspace } from './workspace-cors-support.ts';
import {
  DESKTOP_APP,
  EMPTY_CONFIG,
  TASK_APP,
  TAURI_APP,
  UNPINNED_APP,
  UNPINNED_PLUGIN,
  UNPINNED_SERVICE,
} from './generators-test-support.ts';

const config = {
  ...EMPTY_CONFIG,
  Apps: {
    frontend: {
      ...UNPINNED_APP,
      ServiceReferences: ['users'],
      PluginReferences: ['auth'],
    },
    admin: UNPINNED_APP,
    disabled: { ...UNPINNED_APP, Enabled: false },
    task: TASK_APP,
    desktop: DESKTOP_APP,
    tauri: TAURI_APP,
  },
  Services: { users: UNPINNED_SERVICE, reports: UNPINNED_SERVICE },
  Plugins: { auth: UNPINNED_PLUGIN, workers: UNPINNED_PLUGIN },
};

Deno.test('rendered register-apps type-checks resources without Environment', async () => {
  assertEquals('Environment' in UNPINNED_SERVICE, false);
  assertEquals('Environment' in UNPINNED_PLUGIN, false);
  const registered = await registerWorkspace({
    ...EMPTY_CONFIG,
    Apps: {},
    Services: { users: UNPINNED_SERVICE },
    Plugins: { auth: UNPINNED_PLUGIN },
  });
  assertEquals(corsValue(registered.services.get('users')!), '');
  assertEquals(corsValue(registered.plugins.get('auth')!), '');
});

Deno.test('generated helper injects deferred app origins into every service and plugin', async () => {
  const registered = await registerWorkspace(config);
  // Deliberately allocated after registration; no fixed generator ports.
  const allocated = new Map([
    ['frontend', 'http://localhost:52137'],
    ['admin', 'https://admin.example'],
  ]);
  assertEquals(registered.apps.has('disabled'), false);
  for (
    const target of [
      ...registered.services.values(),
      ...registered.plugins.values(),
    ]
  ) {
    assertEquals(
      allocatedValue(corsValue(target), allocated),
      'http://localhost:52137,https://admin.example',
      target.name,
    );
    assertEquals(
      target.environment.filter((call) => call.key === 'NETSCRIPT_CORS_ORIGINS')
        .length,
      2,
    );
  }
  // Existing direct-browser discovery stays wired to endpoint references.
  assertEquals(
    allocatedValue(
      registered.apps.get('frontend')?.environment.find((call) =>
        call.key === 'services__users__http__0'
      )?.value,
      new Map([['users', 'http://localhost:52391']]),
    ),
    'http://localhost:52391',
  );
});

Deno.test('generated helper with no enabled web apps injects a deny-cross-origin allowlist', async () => {
  const registered = await registerWorkspace({
    ...config,
    Apps: { disabled: { ...UNPINNED_APP, Enabled: false }, task: TASK_APP },
  });
  for (
    const target of [
      ...registered.services.values(),
      ...registered.plugins.values(),
    ]
  ) {
    assertEquals(corsValue(target), '');
  }
});

Deno.test('services and plugins accept the generated app origins and refuse foreign origins', async () => {
  const registered = await registerWorkspace(config);
  const generated = allocatedValue(
    corsValue(registered.services.get('users')!),
    new Map([
      ['frontend', 'http://localhost:52137'],
      ['admin', 'https://admin.example'],
    ]),
  );
  // Process-global environment mutations stay serial within this module.
  const previous = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  Deno.env.set('NETSCRIPT_CORS_ORIGINS', generated);
  try {
    const service = createService({}, { name: 'generated-cors' }).withCors()
      .withHealth().build();
    const plugin = createPluginService({}, {
      name: 'generated-plugin-cors',
      serveRpc: false,
      auth: { public: true, reason: 'CORS integration fixture' },
    }).build();
    for (const app of [service, plugin]) {
      for (
        const [origin, expected] of [
          ['http://localhost:52137', 'http://localhost:52137'],
          ['https://admin.example', 'https://admin.example'],
          ['https://foreign.example', null],
        ]
      ) {
        for (const method of ['GET', 'OPTIONS']) {
          const response = await app.request('/health', {
            method,
            headers: {
              origin: origin!,
              'access-control-request-method': 'GET',
            },
          });
          assertEquals(
            response.headers.get('access-control-allow-origin'),
            expected,
          );
          await response.body?.cancel();
        }
      }
    }
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
    else Deno.env.set('NETSCRIPT_CORS_ORIGINS', previous);
  }
});

Deno.test('generated workspace app origins extend declared extra origins for services and plugins', async () => {
  const registered = await registerWorkspace({
    ...config,
    Services: {
      users: {
        ...UNPINNED_SERVICE,
        Environment: { NETSCRIPT_CORS_ORIGINS: 'https://extra.example' },
      },
    },
    Plugins: {
      auth: {
        ...UNPINNED_PLUGIN,
        Env: { NETSCRIPT_CORS_ORIGINS: 'https://admin-extra.example' },
      },
    },
  });
  const allocated = new Map([['frontend', 'http://localhost:52137'], [
    'admin',
    'https://admin.example',
  ]]);
  assertEquals(
    allocatedValue(corsValue(registered.services.get('users')!), allocated),
    'http://localhost:52137,https://admin.example,https://extra.example',
  );
  assertEquals(
    allocatedValue(corsValue(registered.plugins.get('auth')!), allocated),
    'http://localhost:52137,https://admin.example,https://admin-extra.example',
  );
});
