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
