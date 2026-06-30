import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { createNewPlugin, resolveNewPluginDescriptor } from './new-plugin-use-case.ts';

describe('plugin new use case', () => {
  it('writes a dual-tier proxy plugin without template files', async () => {
    const fs = new MemoryFileSystemAdapter();

    const result = await createNewPlugin({
      name: '@acme/plugin-billing',
      projectRoot: '/workspace/app',
    }, { fs });

    const coreDenoJson = JSON.parse(
      await fs.readFile('/workspace/app/packages/plugin-billing-core/deno.json'),
    );
    const connectorDenoJson = JSON.parse(
      await fs.readFile('/workspace/app/plugins/billing/deno.json'),
    );
    const scaffoldPluginJson = JSON.parse(
      await fs.readFile('/workspace/app/plugins/billing/scaffold.plugin.json'),
    );
    const serviceHandlers = await fs.readFile(
      '/workspace/app/plugins/billing/services/src/handlers.ts',
    );
    const generatedPaths = [...fs.getFiles().keys()].filter((path) =>
      path.startsWith('/workspace/app/')
    );

    assertEquals(coreDenoJson.name, '@netscript/plugin-billing-core');
    assertEquals(connectorDenoJson.name, '@netscript/plugin-billing');
    assertEquals(scaffoldPluginJson.kind, 'proxy');
    assertEquals(scaffoldPluginJson.capabilities.hasRoutes, false);
    assertEquals(scaffoldPluginJson.starterResources, []);
    assertEquals(result.filesCreated.length, 29);
    assertEquals(result.filesSkipped.length, 0);
    assertEquals(generatedPaths.some((path) => path.endsWith('.template')), false);
    assertStringIncludes(serviceHandlers, 'bindPluginContract(');
    assertStringIncludes(serviceHandlers, 'billingContractV1');
    assertStringIncludes(serviceHandlers, "namespace: 'billing'");
  });

  it('normalizes package names into deterministic tier paths', () => {
    const descriptor = resolveNewPluginDescriptor({
      name: '@acme/plugin-audit-log',
      projectRoot: '/workspace/app',
      kind: 'feature',
    });

    assertEquals(descriptor.name, 'audit-log');
    assertEquals(descriptor.pascalName, 'AuditLog');
    assertEquals(descriptor.camelName, 'auditLog');
    assertEquals(descriptor.coreRoot, '/workspace/app/packages/plugin-audit-log-core');
    assertEquals(descriptor.connectorRoot, '/workspace/app/plugins/audit-log');
    assertEquals(descriptor.kind, 'feature');
  });

  it('skips existing files unless overwrite is enabled', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/workspace/app/plugins/billing/README.md', 'kept');

    const result = await createNewPlugin({
      name: 'billing',
      projectRoot: '/workspace/app',
    }, { fs });

    assertEquals(await fs.readFile('/workspace/app/plugins/billing/README.md'), 'kept');
    assertEquals(
      result.filesSkipped.map((path) => path.replace(/\\/g, '/')).includes(
        '/workspace/app/plugins/billing/README.md',
      ),
      true,
    );
  });
});
