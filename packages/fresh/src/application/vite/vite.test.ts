import { resolve } from '@std/path';
import {
  build,
  type ConfigEnv,
  defineConfig,
  normalizePath,
  type Plugin,
  type PluginOption,
  type UserConfig,
  type ViteDevServer,
} from 'vite';
import { createNetScriptVitePlugin } from './vite.ts';

const assignablePlugin = createNetScriptVitePlugin();
const pluginContract: Plugin = assignablePlugin;
const pluginOptionContract: PluginOption = assignablePlugin;
const defineConfigContract = defineConfig({ plugins: [createNetScriptVitePlugin()] });
void pluginContract;
void pluginOptionContract;
void defineConfigContract;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function asConfigHook(plugin: ReturnType<typeof createNetScriptVitePlugin>) {
  return plugin.config as unknown as (
    config: UserConfig,
    env: ConfigEnv,
  ) => UserConfig | void | null;
}

function asConfigureServerHook(plugin: ReturnType<typeof createNetScriptVitePlugin>) {
  return plugin.configureServer as unknown as (server: ViteDevServer) => void | Promise<void>;
}

function asBuildStartHook(plugin: ReturnType<typeof createNetScriptVitePlugin>) {
  return plugin.buildStart as unknown as () => void;
}

function asResolveIdHook(plugin: ReturnType<typeof createNetScriptVitePlugin>) {
  return plugin.resolveId as unknown as (
    source: string,
    importer?: string,
    options?: {
      attributes: Record<string, string>;
      custom?: Record<string, unknown>;
      isEntry: boolean;
      ssr?: boolean;
    },
  ) =>
    | string
    | { id: string; meta?: Record<string, unknown>; moduleSideEffects?: boolean }
    | null
    | undefined
    | Promise<
      | string
      | { id: string; meta?: Record<string, unknown>; moduleSideEffects?: boolean }
      | null
      | undefined
    >;
}

Deno.test('createNetScriptVitePlugin returns config through official plugin hooks', () => {
  const plugin = createNetScriptVitePlugin({
    appRoot: 'C:/repo/apps/playground',
    workspaceRoot: 'C:/repo',
    aliasDirectories: ['assets', 'routes'],
    watchPaths: ['C:/repo/packages', 'C:/repo/contracts'],
    env: {
      PORT: '6123',
      services__users__http__0: 'http://localhost:3000',
    },
    envMappings: [
      { source: 'services__users__http__0', target: 'VITE_USERS_URL' },
    ],
  });

  assert(typeof plugin.config === 'function', 'Expected plugin.config hook');
  const config = asConfigHook(plugin)(
    {} as UserConfig,
    { command: 'serve', mode: 'development' } as ConfigEnv,
  );
  assert(config !== undefined && config !== null, 'Expected config hook to return config');

  assert(config.resolve?.alias !== undefined, 'Expected resolve.alias entries');
  assert(
    config.resolve?.dedupe?.includes('preact'),
    'Expected Preact to be included in resolve.dedupe',
  );
  assert(config.server?.fs?.allow?.includes('C:/repo'), 'Expected workspace root in fs.allow');
  assert(
    config.define?.['import.meta.env.VITE_USERS_URL'] === '"http://localhost:3000"',
    'Expected env define entry',
  );
});

Deno.test('createNetScriptVitePlugin returns actual Vite-style plugin objects', () => {
  const plugin = createNetScriptVitePlugin({
    watchPaths: ['C:/repo/packages'],
    envMappings: [{ source: 'A', target: 'VITE_A' }],
    env: { A: 'value' },
  });

  const watchedPaths: string[] = [];
  assert(typeof plugin.configureServer === 'function', 'Expected plugin.configureServer hook');
  asConfigureServerHook(plugin)({
    watcher: {
      add(path: string) {
        watchedPaths.push(path);
      },
    },
  } as ViteDevServer);

  assert(plugin.name === 'vite-plugin-netscript', `Unexpected plugin name: ${plugin.name}`);
  assert(
    watchedPaths.includes('C:/repo/packages'),
    'Expected watch path to be registered via configureServer',
  );

  assert(typeof plugin.config === 'function', 'Expected plugin.config hook');
  const envConfig = asConfigHook(plugin)(
    {} as UserConfig,
    { command: 'serve', mode: 'development' } as ConfigEnv,
  );
  assert(envConfig?.define?.['import.meta.env.VITE_A'] === '"value"', 'Expected env config hook');
});

Deno.test('createNetScriptVitePlugin watches route roots when route manifest generation is enabled', () => {
  const appRoot = Deno.makeTempDirSync();
  Deno.mkdirSync(resolve(appRoot, 'routes'), { recursive: true });

  const plugin = createNetScriptVitePlugin({
    appRoot,
    routeManifest: {},
    watchPaths: ['C:/repo/packages'],
  });

  const watchedPaths: string[] = [];
  const watcherHandlers: Array<(event: string, path: string) => void> = [];
  assert(typeof plugin.configureServer === 'function', 'Expected plugin.configureServer hook');
  asConfigureServerHook(plugin)({
    watcher: {
      add(path: string) {
        watchedPaths.push(path);
      },
      on(_event: string, handler: (event: string, path: string) => void) {
        watcherHandlers.push(handler);
      },
    },
    ws: {
      send() {
        // noop
      },
    },
  } as unknown as ViteDevServer);

  assert(watchedPaths.includes('C:/repo/packages'), 'Expected custom watch path to be registered');
  assert(
    watchedPaths.includes(normalizePath(resolve(appRoot, 'routes'))),
    `Expected routes directory to be watched: ${watchedPaths.join(', ')}`,
  );
  assert(watcherHandlers.length > 0, 'Expected route manifest watcher handler registration');
});

Deno.test('createNetScriptVitePlugin resolves @app aliases via resolveId', async () => {
  const plugin = createNetScriptVitePlugin({
    appRoot: 'C:/repo/apps/playground',
    aliasDirectories: ['assets'],
  });

  assert(typeof plugin.resolveId === 'function', 'Expected plugin.resolveId hook');
  const resolved = await asResolveIdHook(plugin)('@app/assets/tokens.css', undefined, {
    attributes: {},
    custom: {},
    isEntry: false,
  });
  assert(
    resolved === 'C:/repo/apps/playground/assets/tokens.css',
    `Unexpected resolved path: ${resolved}`,
  );
});

Deno.test('createNetScriptVitePlugin delegates Preact and Fresh Signals imports', async () => {
  const plugin = createNetScriptVitePlugin({ appRoot: 'C:/repo/apps/chat' });
  assert(typeof plugin.resolveId === 'function', 'Expected plugin.resolveId hook');
  const delegatedId =
    'C:\\repo\\node_modules\\.deno\\preact@10.29.7\\node_modules\\preact\\hooks\\dist\\hooks.module.js';
  const signalsId =
    'C:\\repo\\node_modules\\.deno\\@preact+signals@2.9.1\\node_modules\\@preact\\signals\\dist\\signals.module.js';
  const delegatedSources: string[] = [];
  const delegatedImporters: Array<string | undefined> = [];
  const delegatedSkipSelf: Array<boolean | undefined> = [];
  const context = {
    resolve(
      source: string,
      importer: string | undefined,
      options: { skipSelf?: boolean },
    ) {
      delegatedSources.push(source);
      delegatedImporters.push(importer);
      delegatedSkipSelf.push(options.skipSelf);
      return Promise.resolve({
        id: source === '@preact/signals' ? signalsId : delegatedId,
        meta: { fixture: 'preact-hooks' },
        moduleSideEffects: true,
      });
    },
  };
  const preactSources = [
    'preact',
    'preact/hooks',
    'npm:preact@10.29.7/hooks',
    'npm:/preact@10.29.7/hooks',
  ];

  for (const source of preactSources) {
    const resolved = await asResolveIdHook(plugin).call(
      context,
      source,
      'C:/repo/apps/chat/islands/Chat.tsx',
      { attributes: {}, custom: {}, isEntry: false },
    );

    assert(typeof resolved === 'object' && resolved !== null, 'Expected a resolved Preact object');
    assert(resolved.id === normalizePath(delegatedId), `Unexpected resolved ID: ${resolved.id}`);
    assert(resolved.meta?.fixture === 'preact-hooks', 'Expected delegated metadata to be retained');
    assert(
      resolved.moduleSideEffects === true,
      'Expected module-side-effect metadata to be retained',
    );
  }

  const resolvedSignals = await asResolveIdHook(plugin).call(
    context,
    'npm:@preact/signals@^2.5.1',
    '\0deno::0::https://jsr.io/@fresh/core/2.3.3/src/runtime/client/reviver.ts',
    { attributes: {}, custom: {}, isEntry: false },
  );
  assert(
    typeof resolvedSignals === 'object' && resolvedSignals !== null,
    'Expected Fresh Signals to resolve through the consumer import map',
  );
  assert(resolvedSignals.id === normalizePath(signalsId), 'Expected a normalized Signals ID');

  const similarlyPrefixed = await asResolveIdHook(plugin).call(
    context,
    'preact-render-to-string',
    'C:/repo/apps/chat/routes/index.tsx',
    { attributes: {}, custom: {}, isEntry: false },
  );
  assert(similarlyPrefixed === null, 'Expected similarly prefixed packages to remain untouched');
  assert(
    JSON.stringify(delegatedSources) === JSON.stringify([...preactSources, '@preact/signals']),
    `Unexpected delegated sources: ${JSON.stringify(delegatedSources)}`,
  );
  assert(
    delegatedImporters.slice(0, preactSources.length).every((importer) =>
      importer === 'C:/repo/apps/chat/islands/Chat.tsx'
    ) && delegatedImporters.at(-1)?.includes('@fresh/core/2.3.3') === true,
    `Unexpected delegated importers: ${JSON.stringify(delegatedImporters)}`,
  );
  assert(
    delegatedSkipSelf.every((skipSelf) => skipSelf === true),
    `Expected all delegations to skip the NetScript resolver: ${JSON.stringify(delegatedSkipSelf)}`,
  );
});

Deno.test('createNetScriptVitePlugin collapses Windows Preact slash variants in production builds', async () => {
  const windowsHooksId =
    'C:\\repo\\node_modules\\.deno\\preact@10.29.7\\node_modules\\preact\\hooks\\dist\\hooks.module.js';
  const normalizedHooksId = normalizePath(windowsHooksId);
  const loadedHooksIds: string[] = [];
  const runtimeKey = `__netscriptPreactFixture${crypto.randomUUID().replaceAll('-', '')}`;
  const resultKey = `${runtimeKey}Result`;
  let resolvedDedupe: readonly string[] = [];

  const fixtureResolver: Plugin = {
    name: 'preact-windows-module-identity-fixture',
    enforce: 'pre',
    configResolved(config) {
      resolvedDedupe = config.resolve.dedupe;
    },
    resolveId(source) {
      if (source === 'virtual:entry') return '\0virtual:entry';
      if (source === 'virtual:preact-peer') return '\0virtual:preact-peer';
      if (source === 'preact/hooks') {
        return {
          id: windowsHooksId,
          meta: { fixture: 'direct' },
          moduleSideEffects: true,
        };
      }
      if (source === 'npm:/preact@10.29.7/hooks') {
        return {
          id: normalizedHooksId,
          meta: { fixture: 'peer' },
          moduleSideEffects: true,
        };
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:entry') {
        return [
          "import { hookPatchCount as directHookPatchCount } from 'preact/hooks';",
          "import { peerHookPatchCount } from 'virtual:preact-peer';",
          `globalThis[${JSON.stringify(resultKey)}] = [directHookPatchCount, peerHookPatchCount];`,
        ].join('\n');
      }
      if (id === '\0virtual:preact-peer') {
        return [
          "import { hookPatchCount } from 'npm:/preact@10.29.7/hooks';",
          'export { hookPatchCount as peerHookPatchCount };',
        ].join('\n');
      }
      if (id === windowsHooksId || id === normalizedHooksId) {
        loadedHooksIds.push(id);
        return [
          `const state = globalThis[${JSON.stringify(runtimeKey)}] ??= { patches: 0 };`,
          'state.patches += 1;',
          'export const hookPatchCount = state.patches;',
        ].join('\n');
      }
      return null;
    },
  };

  const result = await build({
    logLevel: 'silent',
    resolve: { dedupe: ['consumer-package'] },
    plugins: [
      createNetScriptVitePlugin({
        appRoot: 'C:/repo/apps/chat',
        aliasEntries: [],
      }),
      fixtureResolver,
    ],
    build: {
      minify: false,
      write: false,
      rollupOptions: { input: 'virtual:entry' },
    },
  });

  assert(!('on' in result), 'Expected a completed Vite production build, not a watcher');
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output)
    .filter((item) => item.type === 'chunk');
  const entryChunk = chunks.find((chunk) => chunk.isEntry);
  assert(entryChunk !== undefined, 'Expected one production entry chunk');

  try {
    await import(`data:text/javascript,${encodeURIComponent(entryChunk.code)}`);
    const hookPatchCounts = Reflect.get(globalThis, resultKey);
    assert(
      JSON.stringify(hookPatchCounts) === '[1,1]',
      `Expected one hooks runtime patch, received ${JSON.stringify(hookPatchCounts)}`,
    );
  } finally {
    Reflect.deleteProperty(globalThis, runtimeKey);
    Reflect.deleteProperty(globalThis, resultKey);
  }

  assert(
    loadedHooksIds.length === 1 && loadedHooksIds[0] === normalizedHooksId,
    `Expected one canonical hooks module ID, received ${JSON.stringify(loadedHooksIds)}`,
  );
  assert(
    resolvedDedupe.includes('consumer-package') && resolvedDedupe.includes('preact'),
    `Unexpected merged dedupe: ${JSON.stringify(resolvedDedupe)}`,
  );
});

Deno.test('createNetScriptVitePlugin rewrites page modules for route binding by default', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/orders');
  Deno.mkdirSync(routeDir, { recursive: true });
  const pagePath = resolve(routeDir, '[id].tsx');
  Deno.writeTextFileSync(
    pagePath,
    [
      "import { z } from 'zod';",
      "import { definePage } from '@app/utils.ts';",
      'export const ordersDetailPage = definePage()',
      '  .withRouteContract({ pathSchema: z.object({ id: z.string().min(1) }) })',
      '  .build();',
    ].join('\n'),
  );

  const plugin = createNetScriptVitePlugin({ appRoot, routeManifest: {} });
  asBuildStartHook(plugin)();

  const rewritten = Deno.readTextFileSync(pagePath);
  assert(
    rewritten.includes('$route: routePatterns.orders.$id.$route'),
    `Expected the inline $route field to be inserted: ${rewritten}`,
  );
  assert(
    rewritten.includes("import { routePatterns } from '@app/.generated/manifest.ts';"),
    `Expected the routePatterns import to be inserted: ${rewritten}`,
  );

  // Idempotency: a second build pass produces no further change.
  asBuildStartHook(plugin)();
  assert(
    Deno.readTextFileSync(pagePath) === rewritten,
    'Expected a second build pass to leave the page module unchanged',
  );
});

Deno.test('createNetScriptVitePlugin leaves page modules untouched when pageModuleRouteBinding is false', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes');
  Deno.mkdirSync(routeDir, { recursive: true });
  const pagePath = resolve(routeDir, 'about.tsx');
  const original = [
    "import { definePage } from '@app/utils.ts';",
    "export const aboutPage = definePage().withMeta(() => ({ title: 'About' })).build();",
  ].join('\n');
  Deno.writeTextFileSync(pagePath, original);

  const plugin = createNetScriptVitePlugin({
    appRoot,
    routeManifest: {},
    pageModuleRouteBinding: false,
  });
  asBuildStartHook(plugin)();

  assert(
    Deno.readTextFileSync(pagePath) === original,
    'Expected page module to be untouched when pageModuleRouteBinding is false',
  );
  // The generated routes module is still written.
  assert(
    Deno.readTextFileSync(resolve(appRoot, '.generated/routes.ts')).includes('export const routes'),
    'Expected the generated routes module to still be written',
  );
});

Deno.test('route manifest watch resyncs when helper TypeScript files move under routes', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/(dashboard)/dashboard/framework/wi-09');
  const helperDir = resolve(routeDir, '(_shared)');
  const manifestPath = resolve(appRoot, '.generated/manifest.ts');
  const routesPath = resolve(appRoot, '.generated/routes.ts');

  Deno.mkdirSync(routeDir, { recursive: true });
  Deno.mkdirSync(helperDir, { recursive: true });
  Deno.mkdirSync(resolve(appRoot, '.generated'), { recursive: true });
  Deno.writeTextFileSync(
    resolve(routeDir, '[section].tsx'),
    [
      'export const routeContract = {};',
      'export default function Page() { return null; }',
    ].join('\n'),
  );
  Deno.writeTextFileSync(
    manifestPath,
    '// stale\nexport const routePatterns = { dashboard: { framework: { wi09: { constants: { $route: "/dashboard/framework/wi-09/constants" } } } } } as const;\n',
  );
  Deno.writeTextFileSync(routesPath, '// stale\nexport const routes = {} as const;\n');

  const plugin = createNetScriptVitePlugin({
    appRoot,
    routeManifest: {},
  });

  const watcherHandlers: Array<(event: string, path: string) => void> = [];
  assert(typeof plugin.configureServer === 'function', 'Expected plugin.configureServer hook');
  asConfigureServerHook(plugin)({
    watcher: {
      add() {
        // noop
      },
      on(_event: string, handler: (event: string, path: string) => void) {
        watcherHandlers.push(handler);
      },
    },
    ws: {
      send() {
        // noop
      },
    },
  } as unknown as ViteDevServer);

  assert(watcherHandlers.length > 0, 'Expected a route manifest watcher handler');
  Deno.writeTextFileSync(resolve(helperDir, 'constants.ts'), 'export const META = {};');
  watcherHandlers[0]('add', resolve(helperDir, 'constants.ts'));

  return new Promise<void>((resolveTest, reject) => {
    setTimeout(() => {
      try {
        const manifestSource = Deno.readTextFileSync(manifestPath);
        const routesSource = Deno.readTextFileSync(routesPath);
        assert(
          !manifestSource.includes('constants: {'),
          `Did not expect stale helper route entries after resync: ${manifestSource}`,
        );
        assert(
          manifestSource.includes('$section'),
          `Expected the real WI-09 route to remain in manifest.ts: ${manifestSource}`,
        );
        assert(
          routesSource.includes("import { routePatterns } from './manifest.ts';"),
          `Expected routes.ts to bind generated routes against manifest.ts: ${routesSource}`,
        );
        resolveTest();
      } catch (error: unknown) {
        reject(error);
      }
    }, 75);
  });
});
