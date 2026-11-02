/** Build the shipped scaffold loader without traversing optional server providers. */
import { join, toFileUrl } from '@std/path';
// deno-lint-ignore no-import-prefix -- Tool-only import uses the existing root catalog pin without changing consumer import maps.
import { build } from 'npm:vite@7.2.2';
import { readTemplateAssetSync } from '../../../packages/cli/src/kernel/adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../packages/cli/src/kernel/assets/manifest.ts';

const PROVIDER_SPECIFIER = 'npm:@tanstack/ai@0.68.0';
const RUNTIME_LOAD = "await loadAiModule<AiRuntime>(root, 'ai.ts')";
const REGRESSION_LOAD =
  "await Object.values(import.meta.glob<AiRuntime>('../../../ai/ai.ts'))[0]?.()";

/** Execute built output from a different directory, using only native request-time AI imports. */
async function checkBuiltLoader(root: string, code: string): Promise<void> {
  const output = join(root, 'dist', 'server', 'capabilities.mjs');
  await Deno.mkdir(join(root, 'dist', 'server'), { recursive: true });
  await Deno.writeTextFile(output, code);
  const loader: {
    probeScaffoldPlugin(
      id: 'ai',
      name: string,
      request?: Request,
      root?: string,
    ): Promise<{ state: string }>;
  } = await import(toFileUrl(output).href);
  const cases = [
    { models: undefined, runtime: undefined, state: 'installed-unwired' },
    { models: '{}', runtime: undefined, state: 'empty' },
    { models: "{chat: 'test:model'}", runtime: undefined, state: 'installed-unwired' },
    { models: "{chat: 'test:model'}", runtime: 'export {};', state: 'empty' },
    {
      models: "{chat: 'test:model'}",
      runtime: 'export let calls = 0; export async function chatModel() { calls++; return {}; }',
      state: 'ready',
    },
    {
      models: "{chat: 'test:model'}",
      runtime:
        "export async function chatModel() { throw Object.assign(new Error('denied'), { status: 401 }); }",
      state: 'unauthorized',
    },
  ];
  for (const [index, fixture] of cases.entries()) {
    const workspace = join(root, `runtime-${index}`);
    await Deno.mkdir(join(workspace, 'ai'), { recursive: true });
    if (fixture.models) {
      await Deno.writeTextFile(
        join(workspace, 'ai', 'models.ts'),
        `export const AI_MODELS = ${fixture.models};`,
      );
    }
    const runtime = join(workspace, 'ai', 'ai.ts');
    if (fixture.runtime) await Deno.writeTextFile(runtime, fixture.runtime);
    const originalError = console.error;
    let state: string;
    try {
      console.error = () => {};
      state = (await loader.probeScaffoldPlugin('ai', 'ai', undefined, workspace)).state;
    } finally {
      console.error = originalError;
    }
    if (state !== fixture.state) {
      throw new Error(`Built loader: expected ${fixture.state}, received ${state}`);
    }
    if (state === 'ready') {
      const provider: { calls: number } = await import(toFileUrl(runtime).href);
      if (provider.calls !== 1) throw new Error('Readiness did not invoke the native provider');
    }
  }
}

/** Isolate unrelated service dependencies while retaining the emitted AI loader and Vite glob paths. */
export function providerBoundaryFixture(source: string): string {
  return source
    .replace("import { getServiceUrl } from '@netscript/sdk/discovery';", '')
    .replace(
      "import { workersContract } from '@netscript/plugin-workers-core/contracts/v1';",
      'const workersContract = {};',
    )
    .replace("import { buildStreamUrl } from '@netscript/plugin-streams-core';", '')
    .replace("import { scaffoldServiceClient } from './scaffold-service-context.ts';", '')
    .replaceAll('{{serviceName}}', 'members')
    .replace("'zod'", JSON.stringify(import.meta.resolve('npm:zod@^4.6.5')));
}

/** Check the real Vite graph; the negative control restores the original provider glob edge. */
export async function checkScaffoldProviderBoundary(negativeControl = false): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'scaffold-provider-boundary-' });
  try {
    const app = join(root, 'apps', 'portal', 'lib');
    await Deno.mkdir(app, { recursive: true });
    await Deno.mkdir(join(root, 'ai'));
    await Deno.writeTextFile(join(root, 'ai', 'models.ts'), 'export const AI_MODELS = {};');
    // Published JSR turns bare imports into inline npm specifiers. Traversing this edge must fail.
    await Deno.writeTextFile(
      join(root, 'ai', 'ai.ts'),
      `import '${PROVIDER_SPECIFIER}'; export async function chatModel() { return {}; }`,
    );
    let source = readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldPluginCapabilities);
    if (negativeControl) {
      if (!source.includes(RUNTIME_LOAD)) {
        throw new Error('Negative-control mutation target missing');
      }
      source = source.replace(RUNTIME_LOAD, REGRESSION_LOAD);
    }
    const entry = join(app, 'scaffold-plugin-capabilities.ts');
    await Deno.writeTextFile(entry, providerBoundaryFixture(source));
    const providerModules: string[] = [];
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [{
        name: 'record-provider-traversal',
        load(id) {
          if (id === join(root, 'ai', 'ai.ts')) providerModules.push(id);
          return null;
        },
      }],
      build: {
        ssr: true,
        write: false,
        minify: false,
        rollupOptions: { input: entry, external: [import.meta.resolve('npm:zod@^4.6.5')] },
      },
    });
    if ('on' in result) throw new Error('Expected completed build, received watcher');
    const outputs = Array.isArray(result) ? result : [result];
    if (
      providerModules.length ||
      outputs.some((output) =>
        output.output.some((chunk) =>
          chunk.type === 'chunk' && chunk.code.includes(PROVIDER_SPECIFIER)
        )
      )
    ) throw new Error('Server provider reached the Vite graph');
    const entryChunk = outputs.flatMap((output) => output.output)
      .find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
    if (!entryChunk || entryChunk.type !== 'chunk') throw new Error('Missing built loader');
    await checkBuiltLoader(root, entryChunk.code);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function main(): Promise<void> {
  if (Deno.args.includes('--negative-control')) {
    await checkScaffoldProviderBoundary(true);
    return;
  }
  await checkScaffoldProviderBoundary();
  let rejected = false;
  try {
    await checkScaffoldProviderBoundary(true);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes(PROVIDER_SPECIFIER)) throw error;
    rejected = true;
  }
  if (!rejected) throw new Error('Negative control incorrectly passed');
  console.log(JSON.stringify({
    gate: 'scaffold-provider-boundary',
    ok: true,
    productionBuild: 'PASS',
    builtRuntime: 'PASS (6 capability states)',
    negativeControl: 'REJECTED',
    providerSpecifier: PROVIDER_SPECIFIER,
  }));
}

if (import.meta.main) await main();
