import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { DenoFileSystem } from '../../runtime/file-system/deno-file-system.ts';
import {
  refreshGeneratedClientConsumers,
  type RefreshGeneratedClientConsumersOptions,
} from './refresh-generated-client-consumers.ts';

async function fixture() {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(join(root, 'database/sqlite'), { recursive: true });
  await Deno.mkdir(join(root, 'database/postgres'), { recursive: true });
  for (const file of ['database/mod.ts', 'database/sqlite/mod.ts', 'database/postgres/mod.ts']) {
    await Deno.writeTextFile(join(root, file), '');
  }
  const services = {
    orders: {},
    memory: {},
    stopped: {},
    disabled: { Enabled: false },
    sibling: {},
    direct: {},
    missing: {},
  };
  await Deno.writeTextFile(
    join(root, 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        PrimaryDatabase: 'sqlite',
        Databases: { sqlite: {}, postgres: {} },
        Services: services,
      },
    }),
  );
  for (const name of Object.keys(services)) {
    if (name === 'missing') continue;
    await Deno.mkdir(join(root, 'services', name), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'services', name, 'deno.json'),
      JSON.stringify({
        imports: name === 'memory' ? {} : {
          '@database': name === 'direct'
            ? '../../database/postgres/mod.ts'
            : '../../database/mod.ts',
        },
      }),
    );
  }
  const calls: string[][] = [];
  const resources = ['orders', 'memory', 'stopped', 'disabled', 'sibling-extra', 'direct'].map((
    name,
  ) => ({
    displayName: name,
    name: name + '-replica',
    resourceType: 'Executable',
    state: name === 'stopped' ? 'Finished' : 'Running',
  }));
  let failure = '';
  const options: RefreshGeneratedClientConsumersOptions = {
    projectRoot: root,
    database: {
      configKey: 'sqlite',
      engine: 'sqlite',
      databaseName: 'shop.db',
      workspaceDir: 'database/sqlite',
      enabled: true,
    },
    apphostPath: join(root, 'aspire/apphost.mts'),
    aspireDir: join(root, 'aspire'),
    fs: new DenoFileSystem(),
    realPath: Deno.realPath,
    timeoutMs: 1000,
    signal: new AbortController().signal,
    refreshed: new Set(),
    executor: {
      output: (args, command) => {
        assertEquals(command.signal?.aborted, false);
        calls.push([...args]);
        return Promise.resolve({
          code: failure && args.includes(failure) ? 9 : 0,
          stdout: args[0] === 'describe' ? JSON.stringify({ resources }) : '',
          stderr: '',
        });
      },
      spawn: () => {
        throw new Error('unexpected spawn');
      },
      stream: () => {
        throw new Error('unexpected stream');
      },
    },
  };
  return {
    root,
    calls,
    resources,
    options,
    fail: (value: string) => {
      failure = value;
    },
  };
}

Deno.test('generated client refresh selects exact running declared consumers once across databases', async () => {
  const f = await fixture();
  try {
    await refreshGeneratedClientConsumers(f.options);
    assertEquals(f.calls.map((args) => args.slice(0, 3)), [['describe', '--format', 'Json'], [
      'resource',
      'orders',
      'restart',
    ], ['wait', 'orders', '--status']]);
    assertEquals(f.calls.every((args) => args.includes(f.options.apphostPath)), true);
    await refreshGeneratedClientConsumers(f.options);
    await refreshGeneratedClientConsumers({
      ...f.options,
      database: {
        ...f.options.database,
        configKey: 'postgres',
        engine: 'postgres',
        workspaceDir: 'database/postgres',
      },
    });
    assertEquals(f.calls.filter((args) => args[0] === 'resource').map((args) => args[1]), [
      'orders',
      'direct',
    ]);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('ambiguous logical identities fail before any restart', async () => {
  const f = await fixture();
  try {
    f.resources.push({
      displayName: 'orders',
      name: 'orders-other',
      resourceType: 'Executable',
      state: 'Running',
    });
    await assertRejects(() => refreshGeneratedClientConsumers(f.options), Error, 'Ambiguous');
    assertEquals(f.calls.length, 1);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('restart and health failures fail completion with a scoped manual remedy', async () => {
  for (const failure of ['restart', 'wait']) {
    const f = await fixture();
    try {
      f.fail(failure);
      await assertRejects(
        () => refreshGeneratedClientConsumers(f.options),
        Error,
        'aspire resource orders restart --apphost',
      );
      assertEquals(f.calls.some((args) => args[0] === 'start' || args[0] === 'stop'), false);
    } finally {
      await Deno.remove(f.root, { recursive: true });
    }
  }
});

Deno.test({
  name: 'a database import symlink escaping the project is never a refresh target',
  ignore: Deno.build.os === 'windows',
  fn: async () => {
    const f = await fixture();
    const outside = await Deno.makeTempDir();
    try {
      await Deno.writeTextFile(join(outside, 'mod.ts'), '');
      await Deno.remove(join(f.root, 'database/mod.ts'));
      await Deno.symlink(join(outside, 'mod.ts'), join(f.root, 'database/mod.ts'));
      await refreshGeneratedClientConsumers(f.options);
      assertEquals(f.calls, []);
    } finally {
      await Deno.remove(f.root, { recursive: true });
      await Deno.remove(outside, { recursive: true });
    }
  },
});

Deno.test('consumer refresh bounds an unresponsive Aspire command and forwards cancellation', async () => {
  const f = await fixture();
  try {
    const executor = {
      ...f.options.executor,
      output: (_args: readonly string[], command: { signal?: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          const fail = () => reject(command.signal?.reason);
          if (command.signal?.aborted) fail();
          else command.signal?.addEventListener('abort', fail, { once: true });
        }),
    };
    await assertRejects(
      () => refreshGeneratedClientConsumers({ ...f.options, executor, timeoutMs: 10 }),
      Error,
      'timed out',
    );
    const controller = new AbortController();
    controller.abort(new Error('owner cancelled'));
    await assertRejects(
      () => refreshGeneratedClientConsumers({ ...f.options, executor, signal: controller.signal }),
      Error,
      'owner cancelled',
    );
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

interface AppDeclaration {
  Enabled?: boolean;
  Type?: string;
  Workdir?: string;
  ServiceReferences?: string[];
}

async function configureApps(
  f: Awaited<ReturnType<typeof fixture>>,
  apps: Record<string, AppDeclaration>,
) {
  const path = join(f.root, 'appsettings.json');
  const settings = JSON.parse(await Deno.readTextFile(path));
  settings.NetScript.Apps = apps;
  await Deno.writeTextFile(path, JSON.stringify(settings));
  for (const name of Object.keys(apps)) {
    await Deno.mkdir(join(f.root, 'apps', name), { recursive: true });
    await Deno.writeTextFile(
      join(f.root, 'apps', name, 'deno.json'),
      JSON.stringify({
        imports: {
          '@contracts': '../../contracts/mod.ts',
          '@netscript/fresh': '../../../framework/mod.ts',
        },
      }),
    );
    f.resources.push({
      displayName: name,
      name: name + '-replica',
      resourceType: 'Executable',
      state: 'Running',
    });
  }
}

function restarted(f: Awaited<ReturnType<typeof fixture>>): string[] {
  return f.calls.filter((args) => args[2] === 'restart').map((args) => args[1]);
}

Deno.test('database-specific web apps refresh after their verified services', async () => {
  const f = await fixture();
  try {
    await configureApps(f, {
      shop: { ServiceReferences: ['orders'] },
      admin: { ServiceReferences: ['direct'] },
    });
    await refreshGeneratedClientConsumers(f.options);
    assertEquals(restarted(f), ['orders', 'shop']);
    await refreshGeneratedClientConsumers({
      ...f.options,
      database: { ...f.options.database, configKey: 'postgres', workspaceDir: 'database/postgres' },
    });
    assertEquals(restarted(f), ['orders', 'shop', 'direct', 'admin']);
    assertEquals(f.calls.every((args) => args.includes(f.options.apphostPath)), true);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('batch refresh orders all services before apps, deduplicates references and handles pre-refreshed services', async () => {
  const f = await fixture();
  try {
    await configureApps(f, {
      dashboard: { ServiceReferences: ['orders', 'orders', 'direct'] },
      admin: { ServiceReferences: ['direct'] },
    });
    const options = {
      ...f.options,
      databases: [f.options.database, {
        ...f.options.database,
        configKey: 'postgres',
        workspaceDir: 'database/postgres',
      }],
    };
    await refreshGeneratedClientConsumers(options);
    assertEquals(restarted(f), ['direct', 'orders', 'admin', 'dashboard']);
    f.calls.length = 0;
    f.options.refreshed.clear();
    f.options.refreshed.add('orders');
    await refreshGeneratedClientConsumers(f.options);
    assertEquals(restarted(f), ['dashboard']);
    f.calls.length = 0;
    const empty = { ...options, databases: [] };
    await refreshGeneratedClientConsumers(empty);
    assertEquals(f.calls, []);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('app refresh excludes disabled, non-web, unrelated, stopped and unverifiable declarations', async () => {
  const f = await fixture();
  try {
    await configureApps(f, {
      disabledApp: { Enabled: false, ServiceReferences: ['orders'] },
      task: { Type: 'task', ServiceReferences: ['orders'] },
      tauri: { Type: 'tauri', ServiceReferences: ['orders'] },
      desktop: { Type: 'desktop', ServiceReferences: ['orders'] },
      unrelated: { ServiceReferences: ['memory', 'disabled', 'missing'] },
      empty: {},
      stoppedApp: { ServiceReferences: ['orders'] },
      container: { ServiceReferences: ['orders'] },
      missingApp: { ServiceReferences: ['orders'] },
      corrupt: { ServiceReferences: ['orders'] },
      escaped: { Workdir: '../outside', ServiceReferences: ['orders'] },
      good: { ServiceReferences: ['orders'] },
    });
    f.resources.find((r) => r.displayName === 'stoppedApp')!.state = 'Finished';
    f.resources.find((r) => r.displayName === 'container')!.resourceType = 'Container';
    await Deno.remove(join(f.root, 'apps/missingApp/deno.json'));
    await Deno.writeTextFile(join(f.root, 'apps/corrupt/deno.json'), '{');
    await refreshGeneratedClientConsumers(f.options);
    assertEquals(restarted(f), ['orders', 'good']);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('canonical app workdir and config escapes are excluded on every platform', async () => {
  for (const suffix of ['apps/portal', 'apps/portal/deno.json']) {
    const f = await fixture();
    try {
      await configureApps(f, { portal: { ServiceReferences: ['orders'] } });
      const realPath = async (path: string) =>
        path.replaceAll('\\', '/').endsWith(suffix)
          ? join(f.root, '../outside')
          : await Deno.realPath(path);
      await refreshGeneratedClientConsumers({ ...f.options, realPath });
      assertEquals(restarted(f), ['orders']);
    } finally {
      await Deno.remove(f.root, { recursive: true });
    }
  }
});

Deno.test('an app cannot inherit a database dependency from an escaped service', async () => {
  const f = await fixture();
  try {
    await configureApps(f, { portal: { ServiceReferences: ['orders'] } });
    const realPath = async (path: string) =>
      path.replaceAll('\\', '/').endsWith('services/orders')
        ? join(f.root, '../outside')
        : await Deno.realPath(path);
    await refreshGeneratedClientConsumers({ ...f.options, realPath });
    assertEquals(restarted(f), []);
  } finally {
    await Deno.remove(f.root, { recursive: true });
  }
});

Deno.test('config and live app identity collisions fail before any service restart', async () => {
  for (const collision of ['live', 'service', 'plugin', 'worker', 'desktop', 'disabled-desktop']) {
    const f = await fixture();
    try {
      const name = collision === 'service' ? 'orders' : 'portal';
      await configureApps(f, { [name]: { ServiceReferences: ['orders'] } });
      const path = join(f.root, 'appsettings.json');
      const settings = JSON.parse(await Deno.readTextFile(path));
      if (collision === 'live') f.resources.push({ ...f.resources.at(-1)!, name: 'duplicate' });
      if (collision === 'plugin') settings.NetScript.Plugins = { portal: {} };
      if (collision === 'worker') settings.NetScript.BackgroundProcessors = { portal: {} };
      if (collision === 'desktop' || collision === 'disabled-desktop') {
        settings.NetScript.Apps.orders = {
          Type: 'desktop',
          Enabled: collision === 'desktop' ? true : undefined,
        };
      }
      await Deno.writeTextFile(path, JSON.stringify(settings));
      if (collision === 'disabled-desktop') {
        await refreshGeneratedClientConsumers(f.options);
        assertEquals(restarted(f), ['orders', 'portal']);
      } else {
        await assertRejects(() => refreshGeneratedClientConsumers(f.options), Error, 'Ambiguous');
        assertEquals(restarted(f), []);
      }
    } finally {
      await Deno.remove(f.root, { recursive: true });
    }
  }
});

Deno.test('app restart and health failures propagate the exact scoped remedy', async () => {
  for (const failure of ['restart', 'wait']) {
    const f = await fixture();
    try {
      await configureApps(f, { portal: { ServiceReferences: ['orders'] } });
      f.options.refreshed.add('orders');
      f.fail(failure);
      await assertRejects(
        () => refreshGeneratedClientConsumers(f.options),
        Error,
        'aspire resource portal restart --apphost',
      );
    } finally {
      await Deno.remove(f.root, { recursive: true });
    }
  }
});
