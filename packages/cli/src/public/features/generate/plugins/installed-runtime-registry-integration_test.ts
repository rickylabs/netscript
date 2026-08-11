import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { copy } from '@std/fs';
import { dirname, fromFileUrl, join, toFileUrl } from '@std/path';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import {
  netscriptJsrSpecifier,
  NETSCRIPT_RELEASE_VERSION,
} from '../../../../kernel/constants/jsr-specifiers.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../kernel/constants/scaffold/scaffold-app-catalog.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';
import { createInstalledRuntimeRegistryGenerator } from './installed-runtime-registry-generator.ts';

const REPOSITORY_ROOT = fromFileUrl(new URL('../../../../../../..', import.meta.url));
const TRIGGER_REGISTRY_PATH = '.netscript/generated/plugin-triggers/triggers.registry.ts';
const WORKERS_REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';
const SAGAS_REGISTRY_PATH = '.netscript/generated/plugin-sagas/sagas.registry.ts';
const AI_TOOLS_REGISTRY_PATH = '.netscript/generated/plugin-ai/tools.registry.ts';
const AI_AGENTS_REGISTRY_PATH = '.netscript/generated/plugin-ai/agents.registry.ts';
type RuntimePluginPackage = 'plugin-ai' | 'plugin-workers' | 'plugin-sagas' | 'plugin-triggers';
const VALID_TRIGGER = `
export default {
  id: 'generic-inbound-webhook',
  kind: 'webhook',
  handler: async () => new Response(null, { status: 204 }),
};
`;
const RUNTIME_GLUE = `
import { startCombinedProcess } from '@netscript/plugin-triggers/runtime';

if (import.meta.main) {
  await startCombinedProcess();
}
`;

Deno.test('generated trigger registry loads definitions and excludes control-plane and runtime modules', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkspaceProject(projectRoot, ['plugin-triggers'], {
      'triggers/generic-inbound-webhook.ts': VALID_TRIGGER,
      'triggers/plugin.ts': `
export const triggersPlugin = {
  name: '@netscript/plugin-triggers',
  version: '0.0.5',
  contributions: {},
};
`,
      'triggers/runtime.ts': RUNTIME_GLUE,
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => Promise.reject(new Error('workspace generation must not fetch')),
    });

    await generate({ dryRun: false, projectRoot });

    const module = await import(`${toFileUrl(join(projectRoot, TRIGGER_REGISTRY_PATH)).href}?loading`);
    assert(module.registry instanceof Map);
    assertEquals(module.registry.has('generic-inbound-webhook'), true);
    assertEquals(module.registry.size, 1);
    const source = await Deno.readTextFile(join(projectRoot, TRIGGER_REGISTRY_PATH));
    assertEquals(source.includes('triggers/plugin.ts'), false);
    assertEquals(source.includes('triggers/runtime.ts'), false);
  });
});

Deno.test('generated trigger registry rejects a non-definition module that is not excluded', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkspaceProject(projectRoot, ['plugin-triggers'], {
      'triggers/not-a-trigger.ts': 'export default { id: "missing-kind-and-handler" };\n',
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => Promise.reject(new Error('workspace generation must not fetch')),
    });

    await generate({ dryRun: false, projectRoot });

    await assertRejects(
      () => import(`${toFileUrl(join(projectRoot, TRIGGER_REGISTRY_PATH)).href}?invalid`),
      Error,
      'does not export a TriggerDefinition',
    );
  });
});

Deno.test('workspace import resolves the on-disk trigger manifest without fetching JSR', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkspaceProject(
      projectRoot,
      ['plugin-triggers'],
      { 'triggers/generic.ts': VALID_TRIGGER },
    );
    const process = new RecordingGeneratorProcess();
    let fetchCalls = 0;
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process,
      fetchManifest: () => {
        fetchCalls++;
        return Promise.reject(new Error('workspace manifest must win'));
      },
    });

    await generate({ dryRun: false, projectRoot });

    assertEquals(fetchCalls, 0);
    assertEquals(
      process.generator,
      join(REPOSITORY_ROOT, 'plugins/triggers/src/cli/generate-runtime-registries.ts'),
    );
  });
});

Deno.test('generated workers registry loads a custom-only job and excludes job tools', async () => {
  await withTempProject(async (projectRoot) => {
    await writeWorkspaceProject(projectRoot, ['plugin-workers'], {
      'workers/jobs/custom-claim-job.ts': `
export const customClaimJob = async () => undefined;
`,
      'workers/jobs/job-tools.ts': `
const handler = Object.assign(async () => undefined, { id: 'excluded-job-tools' });
export default handler;
`,
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => Promise.reject(new Error('workspace generation must not fetch')),
    });

    await generate({ dryRun: false, projectRoot });

    const module = await import(`${toFileUrl(join(projectRoot, WORKERS_REGISTRY_PATH)).href}?workers`);
    assert(module.registry instanceof Map);
    assertEquals(module.registry.has('custom-claim-job'), true);
    assertEquals(module.registry.has('excluded-job-tools'), false);
    assertEquals(module.registry.size, 1);
  });
});

Deno.test('generated sagas registry loads saga definitions and ignores other TypeScript files', async () => {
  await withTempProject(async (projectRoot) => {
    const sagaSource = (id: string) => `
function defineSaga(id: string) {
  return {
    id,
    durability: 't1',
    initialState: {},
    handledMessageTypes: [],
    handlers: new Map(),
  };
}
export default defineSaga('${id}');
`;
    await writeWorkspaceProject(projectRoot, ['plugin-sagas'], {
      'sagas/order-processing-saga.ts': sagaSource('order-processing'),
      'sagas/saga-tools.ts': sagaSource('wrong-suffix'),
    });
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => Promise.reject(new Error('workspace generation must not fetch')),
    });

    await generate({ dryRun: false, projectRoot });

    const module = await import(`${toFileUrl(join(projectRoot, SAGAS_REGISTRY_PATH)).href}?sagas`);
    assert(module.sagaRegistry instanceof Map);
    assertEquals(module.sagaRegistry.has('order-processing'), true);
    assertEquals(module.sagaRegistry.has('wrong-suffix'), false);
    assertEquals(module.sagaRegistry.size, 1);
  });
});

// Resolves the same public `/runtime` export subpath consumers install, but from the
// repository workspace instead of `jsr:@netscript/plugin-sagas@<release version>`. Resolving
// the registry artifact at the workspace's own declared version is circular on a release
// branch (the version is not published until the release merges), so registry-artifact
// resolution is owned by the post-publish production smoke (`e2e-cli-prod.yml`), not this lane.
Deno.test('packaged runtime export starts a saga runtime with a project-owned non-empty registry', async () => {
  await withTempProject(async (projectRoot) => {
    await write(join(projectRoot, SAGAS_REGISTRY_PATH), `
const definition = {
  id: 'published-dependency',
  durability: 't1',
  initialState: {},
  handledMessageTypes: [],
  handlers: new Map(),
};
export const sagaRegistry = new Map([[definition.id, definition]]);
`);
    await write(join(projectRoot, 'run-published-saga.ts'), `
import { startSagaRunner } from '@netscript/plugin-sagas/runtime';
let stopListening = () => {};
const deliveryQueue = {
  nativeRetrial: true,
  enqueue: () => Promise.resolve(),
  listen: (_handler: unknown, options?: { signal?: AbortSignal }) =>
    new Promise<void>((resolve) => {
      stopListening = resolve;
      options?.signal?.addEventListener('abort', () => resolve(), { once: true });
    }),
  stop: () => {
    stopListening();
    return Promise.resolve();
  },
};
const supervisor = await startSagaRunner({ cwd: () => Deno.cwd(), deliveryQueue });
console.log(JSON.stringify(supervisor.snapshot()));
await supervisor.stop('dependency integration complete');
`);

    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--unstable-kv',
        '--allow-read',
        '--allow-env',
        '--allow-net',
        '--config',
        join(REPOSITORY_ROOT, 'deno.json'),
        'run-published-saga.ts',
      ],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    assertEquals(result.code, 0, stderr);
    const snapshot = JSON.parse(stdout.trim()) as { definitionCount: number };
    assertEquals(snapshot.definitionCount, 1);
  });
});

Deno.test('generated AI registries load resources and exclude the skill-loader factory', async () => {
  await withTempProject(async (projectRoot) => {
    await writeScaffoldWorkspaceAiProject(projectRoot, {
      'ai/tools/e2e-tool.ts': `
export default {
  descriptor: { name: 'e2e-tool' },
  schema: {},
  execute: async () => ({ state: 'output-available', output: { ok: true } }),
};
`,
      'ai/tools/skill-loader.ts': `
export function createSkillLoaderTool(skills: unknown) {
  return { skills };
}
`,
      'ai/agents/assistant.ts': 'export default function assistant() { return {}; }\n',
    });
    let fetchCalls = 0;
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => {
        fetchCalls++;
        return Promise.reject(new Error('scaffold workspace manifest must win'));
      },
    });

    await generate({ dryRun: false, projectRoot });

    const tools = await import(
      `${toFileUrl(join(projectRoot, AI_TOOLS_REGISTRY_PATH)).href}?ai-tools`
    );
    const agents = await import(
      `${toFileUrl(join(projectRoot, AI_AGENTS_REGISTRY_PATH)).href}?ai-agents`
    );
    assert(tools.registry instanceof Map);
    assertEquals(tools.registry.has('e2e-tool'), true);
    assertEquals(tools.registry.has('skill-loader'), false);
    assertEquals(tools.registry.size, 1);
    assert(agents.registry instanceof Map);
    assertEquals(agents.registry.has('assistant'), true);
    assertEquals(agents.registry.size, 1);
    assertEquals(fetchCalls, 0);
  });
});

Deno.test('marked source workspace wins for a published-shaped AI project', async () => {
  await withTempProject(async (projectRoot) => {
    await writeMarkedSourceAiProject(projectRoot, {
      'ai/tools/e2e-tool.ts': `
export default {
  descriptor: { name: 'e2e-tool' },
  schema: {},
  execute: async () => ({ state: 'output-available', output: { ok: true } }),
};
`,
      'ai/tools/skill-loader.ts': `
export function createSkillLoaderTool(skills: unknown) {
  return { skills };
}
`,
      'ai/agents/assistant.ts': 'export default function assistant() { return {}; }\n',
    });
    let fetchCalls = 0;
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process: new DenoProcess(),
      fetchManifest: () => {
        fetchCalls++;
        return Promise.reject(new Error('marked source workspace must win'));
      },
    });

    await generate({ dryRun: false, projectRoot });

    const tools = await import(
      `${toFileUrl(join(projectRoot, AI_TOOLS_REGISTRY_PATH)).href}?marked-source-tools`
    );
    assert(tools.registry instanceof Map);
    assertEquals(tools.registry.has('e2e-tool'), true);
    assertEquals(tools.registry.has('skill-loader'), false);
    assertEquals(tools.registry.size, 1);
    assertEquals(fetchCalls, 0);
  });
});

Deno.test('JSR-only imports retain the published manifest and generator fallback', async () => {
  await withTempProject(async (projectRoot) => {
    await writePublishedProject(projectRoot);
    const process = new RecordingGeneratorProcess();
    const fetched: string[] = [];
    const generate = createInstalledRuntimeRegistryGenerator({
      fs: new DenoFileSystem(),
      process,
      fetchManifest: (url) => {
        fetched.push(url);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(testManifest()),
        });
      },
    });

    await generate({ dryRun: false, projectRoot });

    const manifestUrl =
      `https://jsr.io/@netscript/plugin-triggers/${NETSCRIPT_RELEASE_VERSION}/scaffold.runtime.json`;
    assertEquals(fetched, [manifestUrl]);
    assertEquals(
      process.generator,
      new URL('src/cli/generate-runtime-registries.ts', manifestUrl).href,
    );
  });
});

class RecordingGeneratorProcess implements ProcessPort {
  generator?: string;

  async exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
  ): Promise<ProcessResult> {
    assertEquals(command, 'deno');
    assertEquals(options?.cwd !== undefined, true);
    this.generator = args[args.indexOf('--allow-write') + 1];
    const projectRoot = args[args.indexOf('--project-root') + 1];
    await write(
      join(projectRoot, TRIGGER_REGISTRY_PATH),
      'export const registry = new Map();\n',
    );
    return { code: 0, stdout: '', stderr: '' };
  }
}

async function writeWorkspaceProject(
  projectRoot: string,
  packages: readonly RuntimePluginPackage[],
  files: Readonly<Record<string, string>>,
): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    imports: Record<string, string>;
  };
  const workspaceImports = Object.fromEntries(packages.map((packageName) => [
    `@netscript/${packageName}/runtime`,
    toFileUrl(join(REPOSITORY_ROOT, runtimeEntrypoint(packageName))).href,
  ]));
  await writeProjectConfig(projectRoot, {
    ...rootConfig.imports,
    '@netscript/plugin/cli': toFileUrl(
      join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts'),
    ).href,
    ...workspaceImports,
  });
  await writeAppSettings(projectRoot, packages);
  for (const [path, source] of Object.entries(files)) await write(join(projectRoot, path), source);
}

async function writeScaffoldWorkspaceAiProject(
  projectRoot: string,
  files: Readonly<Record<string, string>>,
): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    imports: Record<string, string>;
  };
  await writeProjectConfig(
    projectRoot,
    {
      ...rootConfig.imports,
      '@netscript/plugin/cli': toFileUrl(
        join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts'),
      ).href,
    },
    ['./plugins/*'],
  );
  await copy(join(REPOSITORY_ROOT, 'plugins/ai'), join(projectRoot, 'plugins/ai'));
  await writeAppSettings(projectRoot, ['plugin-ai']);
  for (const [path, source] of Object.entries(files)) await write(join(projectRoot, path), source);
}

async function writeMarkedSourceAiProject(
  projectRoot: string,
  files: Readonly<Record<string, string>>,
): Promise<void> {
  const rootConfig = JSON.parse(await Deno.readTextFile(join(REPOSITORY_ROOT, 'deno.json'))) as {
    imports: Record<string, string>;
  };
  await writeProjectConfig(projectRoot, {
    ...rootConfig.imports,
    '@netscript/plugin/cli': toFileUrl(
      join(REPOSITORY_ROOT, 'packages/plugin/src/cli/mod.ts'),
    ).href,
  });
  await write(join(projectRoot, '.netscript-source-root'), `${REPOSITORY_ROOT}\n`);
  await writeAppSettings(projectRoot, ['plugin-ai']);
  for (const [path, source] of Object.entries(files)) await write(join(projectRoot, path), source);
}

async function writePublishedProject(projectRoot: string): Promise<void> {
  await writeProjectConfig(projectRoot, {
    '@netscript/plugin-triggers/runtime': netscriptJsrSpecifier('plugin-triggers', '/runtime'),
  });
  await writeAppSettings(projectRoot, ['plugin-triggers']);
  await write(join(projectRoot, 'triggers/generic.ts'), VALID_TRIGGER);
}

async function writeProjectConfig(
  projectRoot: string,
  imports: Readonly<Record<string, string>>,
  workspace?: readonly string[],
): Promise<void> {
  await write(
    join(projectRoot, 'deno.json'),
    `${JSON.stringify({ catalog: SCAFFOLD_WORKSPACE_CATALOG, imports, workspace })}\n`,
  );
}

async function writeAppSettings(
  projectRoot: string,
  packages: readonly RuntimePluginPackage[],
): Promise<void> {
  const plugins = Object.fromEntries(packages.map((packageName) => [
    packageName.slice('plugin-'.length),
    { Entrypoint: netscriptJsrSpecifier(packageName, '/services') },
  ]));
  await write(
    join(projectRoot, 'appsettings.json'),
    `${JSON.stringify({
      NetScript: {
        Plugins: plugins,
      },
    })}\n`,
  );
}

function runtimeEntrypoint(packageName: RuntimePluginPackage): string {
  if (packageName === 'plugin-ai') return 'plugins/ai/cli.ts';
  if (packageName === 'plugin-workers') return 'plugins/workers/bin/runtime.ts';
  return `plugins/${packageName.slice('plugin-'.length)}/src/runtime/mod.ts`;
}

function testManifest(): unknown {
  return {
    runtimeRegistryGenerator: { command: 'src/cli/generate-runtime-registries.ts' },
    runtimeRegistries: [{
      dir: 'triggers',
      registryPath: TRIGGER_REGISTRY_PATH,
      fileSuffixes: ['.ts'],
    }],
  };
}

async function withTempProject(run: (projectRoot: string) => Promise<void>): Promise<void> {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-trigger-registry-' });
  try {
    await run(projectRoot);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
