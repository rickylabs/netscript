import { assertEquals } from '@std/assert';
import { join } from '@std/path';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { mutateServiceReference, setServiceConfig } from './mutate-service-config.ts';

Deno.test('service ref add/remove mutates appsettings and regenerates in one operation', async () => {
  await withProject(async (root, dependencies, generated) => {
    await mutateServiceReference(dependencies, root, 'api', 'users', 'add');
    assertEquals((await services(root)).api.ServiceReferences, ['users']);
    await mutateServiceReference(dependencies, root, 'api', 'users', 'remove');
    assertEquals((await services(root)).api.ServiceReferences, []);
    assertEquals(generated, [root, root]);
  });
});

Deno.test('service set updates port/enabled and regenerates helpers', async () => {
  await withProject(async (root, dependencies, generated) => {
    await setServiceConfig(dependencies, root, 'api', { port: 4010, enabled: false });
    assertEquals((await services(root)).api, { Port: 4010, Enabled: false, ServiceReferences: [] });
    assertEquals(generated, [root]);
  });
});

async function withProject(
  run: (
    root: string,
    dependencies: ReturnType<typeof dependenciesFor>,
    generated: string[],
  ) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir();
  const generated: string[] = [];
  await Deno.writeTextFile(join(root, 'appsettings.json'), JSON.stringify({
    NetScript: {
      Services: {
        api: { Port: 3000, Enabled: true, ServiceReferences: [] },
        users: { Port: 3001, Enabled: true },
      },
    },
  }));
  try {
    await run(root, dependenciesFor(generated), generated);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

function dependenciesFor(generated: string[]) {
  return {
    fs: new DenoFileSystem(),
    scaffolder: {} as ScaffolderPort,
    templateAdapter: {} as TemplatePort,
    regenerateHelpers: (root: string) => {
      generated.push(root);
      return Promise.resolve<readonly string[]>(['aspire/apphost.mts']);
    },
  };
}

async function services(root: string): Promise<Record<string, Record<string, unknown>>> {
  const document = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json'))) as {
    NetScript: { Services: Record<string, Record<string, unknown>> };
  };
  return document.NetScript.Services;
}
