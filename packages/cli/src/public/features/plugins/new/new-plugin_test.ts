import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { createNewPlugin, resolveNewPluginDescriptor } from './new-plugin-use-case.ts';
import { createNewPluginCommand } from './new-plugin-command.ts';
import { z } from 'zod';
import { JSR_SPECIFIERS } from '../../../../kernel/constants/jsr-specifiers.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';

describe('plugin new use case', () => {
  it('registers a generated plugin by default', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/workspace/app/deno.json', '{}');
    await fs.writeFile(
      '/workspace/app/netscript.config.ts',
      [
        "import { defineConfig } from '@netscript/config';",
        'export default defineConfig({',
        '  plugins: [],',
        '});',
        '',
      ].join('\n'),
    );
    const command = createNewPluginCommand({
      newPluginDependencies: { fs },
      resolveProjectRoot: (path) => Promise.resolve(path),
      workspaceMutator: new PluginWorkspaceMutator(fs),
      print: () => {},
    });
    await command.parse(['billing', '--project-root', '/workspace/app']);
    const workspace = z.object({ workspace: z.array(z.string()) }).parse(
      JSON.parse(await fs.readFile('/workspace/app/deno.json')),
    );
    assertEquals(workspace.workspace.includes('./packages/plugin-billing-core'), true);
    assertEquals(workspace.workspace.includes('./plugins/*'), true);
    assertStringIncludes(
      await fs.readFile('/workspace/app/netscript.config.ts'),
      "'./plugins/billing/mod.ts'",
    );
  });

  it('writes a dual-tier proxy plugin without template files', async () => {
    const fs = new MemoryFileSystemAdapter();

    const result = await createNewPlugin({
      name: '@acme/plugin-billing',
      projectRoot: '/workspace/app',
    }, { fs });

    const coreDenoJson = JSON.parse(
      await fs.readFile(
        '/workspace/app/packages/plugin-billing-core/deno.json',
      ),
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
    assertEquals(
      generatedPaths.some((path) => path.endsWith('.template')),
      false,
    );
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
    assertEquals(
      descriptor.coreRoot,
      '/workspace/app/packages/plugin-audit-log-core',
    );
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

    assertEquals(
      await fs.readFile('/workspace/app/plugins/billing/README.md'),
      'kept',
    );
    assertEquals(
      result.filesSkipped.map((path) => path.replace(/\\/g, '/')).includes(
        '/workspace/app/plugins/billing/README.md',
      ),
      true,
    );
  });
});

const importsSchema = z.object({ imports: z.record(z.string(), z.string()) });

for (const localSource of [false, true]) {
  it(`emits guarded plugin dependencies in ${localSource ? 'local-source' : 'published'} mode`, async () => {
    const fs = new MemoryFileSystemAdapter();
    if (localSource) await fs.writeFile('/workspace/app/packages/cli/deno.json', '{}');
    await createNewPlugin({ name: 'billing', projectRoot: '/workspace/app' }, { fs });
    const core = importsSchema.parse(
      JSON.parse(await fs.readFile('/workspace/app/packages/plugin-billing-core/deno.json')),
    );
    const connector = importsSchema.parse(
      JSON.parse(await fs.readFile('/workspace/app/plugins/billing/deno.json')),
    );
    assertEquals(
      core.imports['@netscript/contracts'],
      localSource ? undefined : JSR_SPECIFIERS.contracts,
    );
    assertEquals(
      core.imports['@netscript/plugin'],
      localSource ? undefined : JSR_SPECIFIERS.plugin,
    );
    assertEquals(
      connector.imports['@netscript/plugin-auth'],
      localSource ? undefined : JSR_SPECIFIERS['plugin-auth'],
    );
    assertEquals(
      connector.imports['@netscript/service'],
      localSource ? undefined : JSR_SPECIFIERS.service,
    );
    if (localSource) {
      assertEquals(
        Object.keys(connector.imports).some((name) => name.startsWith('@netscript/')),
        false,
      );
      assertEquals(Object.keys(core.imports).some((name) => name.startsWith('@netscript/')), false);
    }
    const main = await fs.readFile('/workspace/app/plugins/billing/services/src/main.ts');
    assertStringIncludes(
      main,
      "createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 })",
    );
    assertStringIncludes(
      main,
      'createContractAuthorizer(mountPluginContract(billingContractDefinition, billingContractMount))',
    );
    const handlers = await fs.readFile('/workspace/app/plugins/billing/services/src/handlers.ts');
    assertStringIncludes(
      handlers,
      "billingContractMount: PluginContractMount = { version: 'v1', namespace: 'billing' }",
    );
    assertStringIncludes(handlers, '...billingContractMount,');
    const manifest = await fs.readFile('/workspace/app/plugins/billing/mod.ts');
    assertStringIncludes(manifest, '.withDependencies({ auth: authPlugin })');
    const contract = await fs.readFile(
      '/workspace/app/packages/plugin-billing-core/src/contracts/v1/billing.contract.ts',
    );
    assertEquals(contract.match(/authentication: 'required'/g)?.length, 2);
    assertEquals(contract.match(/scopes: \['billing:read'\]/g)?.length, 2);
    assertEquals(contract.includes('as unknown as'), false);
  });
}
