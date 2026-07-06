import { resolve } from '@std/path';
import {
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
  ) => string | null | undefined | Promise<string | null | undefined>;
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
