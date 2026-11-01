import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, toFileUrl } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import { createInstalledRuntimeRegistryGenerator } from './installed-runtime-registry-generator.ts';
import { checkRuntimeRegistryDrift } from '../../plugins/doctor/runtime-registry-drift.ts';
import { SAGAS_REGISTRY_PATH } from '../../../../../../../plugins/sagas/src/cli/registry-generator.ts';

const REPOSITORY_ROOT = fromFileUrl(new URL('../../../../../../../', import.meta.url));
const fs = new DenoFileSystem();
const generate = createInstalledRuntimeRegistryGenerator({
  fs,
  process: new DenoProcess(),
  fetchManifest: () => Promise.reject(new Error('local source manifest must win')),
});
const CONFIG = "export default defineSagaConfig('agent-action', 'sagas/agent-action.ts').build();";

Deno.test('installed declared agent-action factory generates a loadable registry and doctor agrees', async () => {
  await installedProject({
    'packages/operations-core/src/application/agent-action-saga.ts': `
import { defineSaga } from ${
      JSON.stringify(
        toFileUrl(join(REPOSITORY_ROOT, 'packages/plugin-sagas-core/src/builders/define-saga.ts'))
          .href,
      )
    };
export function defineAgentActionSaga() {
  return defineSaga('agent-action').durability('t1')
    .state({ operationId: '' }).on('ActionAdmitted', () => []).build();
}
`,
    'sagas/agent-action.ts': `
import { defineAgentActionSaga } from '../packages/operations-core/src/application/agent-action-saga.ts';
Deno.writeTextFileSync(new URL('../module-executed.txt', import.meta.url), 'executed');
export default defineAgentActionSaga();
`,
    'sagas/agent-action.config.ts': `throw new Error('config must never execute');\n${CONFIG}`,
    'sagas/notes.ts':
      'throw new Error("undeclared non-saga must never execute");\nexport default {};',
  }, async (projectRoot) => {
    // First generation prepares the consumer lock used by frozen doctor inspection.
    await generate({ dryRun: false, projectRoot });
    await write(join(projectRoot, SAGAS_REGISTRY_PATH), emptyRegistry());
    const inspected = await generate({ dryRun: true, projectRoot });
    assertEquals(inspected[0].sourceFiles, ['sagas/agent-action.ts']);
    assertEquals(inspected[0].sourceAuthority, 'generator');
    assertEquals(await Deno.readTextFile(join(projectRoot, SAGAS_REGISTRY_PATH)), emptyRegistry());
    assertEquals(await fs.exists(join(projectRoot, 'module-executed.txt')), false);

    // A structurally complete empty map must fail the same source check used by plugin doctor.
    let checks = await checkRuntimeRegistryDrift({ fs, projectRoot, registries: inspected });
    assertEquals(checks[0].status, 'error');
    assertStringIncludes(checks[0].message ?? '', 'Missing generated entry');
    assertStringIncludes(checks[0].message ?? '', 'sagas/agent-action.ts');

    const result = await generate({ dryRun: false, projectRoot });
    assertEquals(result[0].registrableItems, 1);
    assertEquals(await fs.exists(join(projectRoot, 'module-executed.txt')), false);
    checks = await checkRuntimeRegistryDrift({ fs, projectRoot, registries: inspected });
    assertEquals(checks[0].status, 'healthy');

    // Runtime import is deliberately separate from static discovery and generation.
    const loaded = await import(toFileUrl(join(projectRoot, SAGAS_REGISTRY_PATH)).href);
    assert(loaded.sagaRegistry instanceof Map);
    assertEquals([...loaded.sagaRegistry.keys()], ['agent-action']);
    assertEquals(loaded.sagaRegistry.get('agent-action').handledMessageTypes, ['ActionAdmitted']);
    assertEquals(await fs.exists(join(projectRoot, 'module-executed.txt')), true);
  });
});

Deno.test('installed root-config saga declaration outside scan roots is authoritative for doctor', async () => {
  await installedProject({
    'netscript.config.ts':
      "throw new Error('static only');\nexport const entry = defineSagaConfig('agent-action', './plugins/sagas/agent-action.ts').build();",
    'plugins/sagas/agent-action.ts': `export default {
      id: 'agent-action', durability: 't1', initialState: {}, handledMessageTypes: [], handlers: new Map(),
    };`,
  }, async (projectRoot) => {
    await generate({ dryRun: false, projectRoot });
    const registries = await generate({ dryRun: true, projectRoot });
    assertEquals(registries[0].sourceFiles, ['plugins/sagas/agent-action.ts']);
    const checks = await checkRuntimeRegistryDrift({ fs, projectRoot, registries });
    assertEquals(checks[0].status, 'healthy');
    const loaded = await import(toFileUrl(join(projectRoot, SAGAS_REGISTRY_PATH)).href);
    assertEquals([...loaded.sagaRegistry.keys()], ['agent-action']);
  });
});

Deno.test('installed generation rejects an unresolved declared saga without replacing existing output', async () => {
  await installedProject({}, async (projectRoot) => {
    await generate({ dryRun: false, projectRoot });
    const previous = await Deno.readTextFile(join(projectRoot, SAGAS_REGISTRY_PATH));
    await write(join(projectRoot, 'sagas/agent-action.config.ts'), CONFIG);
    for (const dryRun of [false, true]) {
      const error = await assertRejects(
        () => generate({ dryRun, projectRoot }),
        Error,
        'missing module sagas/agent-action.ts',
      );
      assertStringIncludes(error.message, 'agent-action.config.ts');
      assertStringIncludes(error.message, 'agent-action');
      assertEquals(await Deno.readTextFile(join(projectRoot, SAGAS_REGISTRY_PATH)), previous);
    }
  });
});

Deno.test('installed zero-declaration sagas registry remains valid empty output and doctor warning', async () => {
  await installedProject({
    'sagas/helper.ts': 'throw new Error("undeclared non-saga must never execute");',
  }, async (projectRoot) => {
    await generate({ dryRun: false, projectRoot });
    const registries = await generate({ dryRun: true, projectRoot });
    assertEquals(registries[0].sourceFiles, []);
    const loaded = await import(toFileUrl(join(projectRoot, SAGAS_REGISTRY_PATH)).href);
    assert(loaded.sagaRegistry instanceof Map);
    assertEquals(loaded.sagaRegistry.size, 0);
    const checks = await checkRuntimeRegistryDrift({ fs, projectRoot, registries });
    assertEquals(checks[0].status, 'warning');
    assertStringIncludes(checks[0].message ?? '', 'zero definitions');
  });
});

async function installedProject(
  sources: Readonly<Record<string, string>>,
  run: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'installed-saga-declarations-' });
  try {
    const config = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json')));
    await write(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: config.catalog,
        imports: {
          ...config.imports,
          '@netscript/plugin/cli':
            toFileUrl(join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts')).href,
          '@netscript/plugin-sagas/runtime':
            toFileUrl(join(REPOSITORY_ROOT, 'plugins/sagas/src/runtime/mod.ts')).href,
        },
      }),
    );
    await write(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          Plugins: { sagas: { Entrypoint: netscriptJsrSpecifier('plugin-sagas', '/services') } },
        },
      }),
    );
    for (const [path, source] of Object.entries(sources)) await write(join(root, path), source);
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function write(path: string, source: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, source);
}

function emptyRegistry(): string {
  return 'const entries = [];\nexport const sagaRegistry = new Map(entries);\nexport const registry = sagaRegistry;\n';
}
