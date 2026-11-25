import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@1';
import {
  App,
  type Context,
  type FreshConfig,
  HttpError,
  type Middleware,
  page,
  type PageProps,
  type RouteConfig,
} from 'jsr:@fresh/core@^2.3.3';
import { Partial } from 'jsr:@fresh/core@^2.3.3/runtime';
import { ProdBuildCache, setBuildCache } from 'jsr:@fresh/core@^2.3.3/internal';
import { Component, Fragment, h, options as preactOptions } from 'npm:preact@^10.29.2';
import 'npm:preact@^10.29.2/compat';
import { renderToString } from 'npm:preact-render-to-string@^6.8.0';

import * as hostAppWrapperMod from './probe-a-fixtures/host-app-wrapper.tsx';
import * as hostLayoutsMod from './probe-a-fixtures/host-layouts.tsx';
import * as hostFallbacksMod from './probe-a-fixtures/host-fallbacks.tsx';
import { getModuleLoadCount } from './probe-a-fixtures/load-counter.ts';

// -----------------------------------------------------------------------------
// Types & Helpers
// -----------------------------------------------------------------------------

interface ProbeState {
  trace?: string[];
  p1?: boolean;
  p2?: boolean;
  hostMw?: boolean;
  tenant?: string;
}

type RouteLike = Parameters<App<ProbeState>['route']>[1];
type RouteObj = Exclude<RouteLike, () => Promise<unknown>>;

interface ProbeResultRow {
  readonly id: string;
  readonly category: 'P0' | 'P1' | 'P2' | 'P4';
  readonly name: string;
  readonly status: 'PASS' | 'FAIL';
  readonly detail: string;
}

const results: ProbeResultRow[] = [];

async function runCase(
  id: string,
  category: ProbeResultRow['category'],
  name: string,
  fn: () => Promise<string> | string,
): Promise<void> {
  try {
    const detail = await fn();
    results.push({ id, category, name, status: 'PASS', detail });
    console.log(`[PASS] ${id} (${category}) — ${name}\n       ${detail}`);
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    results.push({ id, category, name, status: 'FAIL', detail });
    console.error(`[FAIL] ${id} (${category}) — ${name}\n       ${detail}`);
  }
}

// CommandType string enum values from @fresh/core@2.3.3/src/commands.ts
const CMD_APP = 'app' as const;
const CMD_LAYOUT = 'layout' as const;
const CMD_MIDDLEWARE = 'middleware' as const;
const CMD_ERROR = 'error' as const;
const CMD_NOT_FOUND = 'notFound' as const;
const CMD_ROUTE = 'route' as const;

interface HostFsOptions {
  appWrapper?: typeof hostAppWrapperMod.HostAppWrapper;
  rootLayout?: typeof hostLayoutsMod.HostRootLayout;
  pluginsLayout?: typeof hostLayoutsMod.NaiveShellPluginsLayout;
  notFound?: {
    component: typeof hostFallbacksMod.HostNotFoundPage;
    handler?: typeof hostFallbacksMod.hostNotFoundHandler;
  };
  errorPage?: {
    component: typeof hostFallbacksMod.HostErrorPage;
    config?: RouteConfig;
  };
  includeHostRoutes?: boolean;
  hostMiddleware?: Middleware<ProbeState>;
}

/**
 * Attach a real Fresh ProdBuildCache containing FS routes in canonical fs_crawl order
 * so `app.fsRoutes()` registers real CommandType.App / Layout / Middleware / Error / NotFound / Route items.
 */
function attachHostFsRoutes(app: App<ProbeState>, opts: HostFsOptions = {}): App<ProbeState> {
  // deno-lint-ignore no-explicit-any
  const fsRoutes: any[] = [];

  if (opts.appWrapper !== undefined) {
    fsRoutes.push({
      id: '/_app',
      filePath: 'routes/_app.tsx',
      mod: { default: opts.appWrapper },
      pattern: '*',
      type: CMD_APP,
      routePattern: '*',
      overrideConfig: undefined,
      css: [],
    });
  }

  const mw: Middleware<ProbeState> = opts.hostMiddleware ??
    (async (ctx) => {
      ctx.state.hostMw = true;
      ctx.state.trace = [...(ctx.state.trace ?? []), 'host-mw'];
      return await ctx.next();
    });

  fsRoutes.push({
    id: '/_middleware',
    filePath: 'routes/_middleware.ts',
    mod: { default: mw },
    pattern: '*',
    type: CMD_MIDDLEWARE,
    routePattern: '*',
    overrideConfig: undefined,
    css: [],
  });

  if (opts.rootLayout !== undefined) {
    fsRoutes.push({
      id: '/_layout',
      filePath: 'routes/_layout.tsx',
      mod: { default: opts.rootLayout },
      pattern: '*',
      type: CMD_LAYOUT,
      routePattern: '*',
      overrideConfig: undefined,
      css: [],
    });
  }

  if (opts.errorPage !== undefined) {
    fsRoutes.push({
      id: '/_error',
      filePath: 'routes/_error.tsx',
      mod: {
        default: opts.errorPage.component,
        config: opts.errorPage.config,
      },
      pattern: '*',
      type: CMD_ERROR,
      routePattern: '*',
      overrideConfig: undefined,
      css: [],
    });
  }

  if (opts.notFound !== undefined) {
    fsRoutes.push({
      id: '/_404',
      filePath: 'routes/_404.tsx',
      mod: {
        default: opts.notFound.component,
        handler: opts.notFound.handler,
      },
      pattern: '*',
      type: CMD_NOT_FOUND,
      routePattern: '*',
      overrideConfig: undefined,
      css: [],
    });
  }

  if (opts.pluginsLayout !== undefined) {
    fsRoutes.push({
      id: '/plugins/_layout',
      filePath: 'routes/plugins/_layout.tsx',
      mod: { default: opts.pluginsLayout },
      pattern: '/plugins',
      type: CMD_LAYOUT,
      routePattern: '/plugins',
      overrideConfig: undefined,
      css: [],
    });
  }

  if (opts.includeHostRoutes !== false) {
    fsRoutes.push({
      id: '/host-page',
      filePath: 'routes/host-page.tsx',
      mod: {
        handler: (ctx: Context<ProbeState>) => {
          ctx.state.trace = [...(ctx.state.trace ?? []), 'host-route'];
          return page({
            trace: ctx.state.trace,
            p1: ctx.state.p1 ?? null,
            p2: ctx.state.p2 ?? null,
          });
        },
        default: (props: PageProps<{ trace: string[]; p1: boolean | null; p2: boolean | null }>) =>
          h(
            'div',
            {
              'data-host-page': 'true',
              'data-trace': props.data.trace.join(','),
              'data-p1': String(props.data.p1),
              'data-p2': String(props.data.p2),
            },
            'Host Page',
          ),
      },
      pattern: '/host-page',
      type: CMD_ROUTE,
      routePattern: '/host-page',
      overrideConfig: undefined,
      css: [],
    });
  }

  setBuildCache(
    app,
    new ProdBuildCache<ProbeState>('.', {
      version: 'probe-build',
      clientEntry: '/_fresh/js/probe/fresh-runtime.js',
      fsRoutes,
      staticFiles: new Map(),
      islands: new Map(),
      entryAssets: [],
    }),
    'production',
  );

  return app;
}

const SHELL_CHROME_MARKERS = [
  'data-persistent-shell="true"',
  'data-shell-chrome="true"',
  'data-host-root-layout="true"',
  'data-host-app-chrome="true"',
];

function extractPartialRegion(
  html: string,
  partialName: string,
): { found: boolean; content: string; hasShellInPartial: boolean; rawBodyHasShellChrome: boolean } {
  const startPrefix = `<!--frsh:partial:${partialName}:`;
  const startIdx = html.indexOf(startPrefix);
  const rawBodyHasShellChrome = SHELL_CHROME_MARKERS.some((marker) => html.includes(marker));
  if (startIdx === -1) {
    return {
      found: false,
      content: '',
      hasShellInPartial: false,
      rawBodyHasShellChrome,
    };
  }

  const startCommentEnd = html.indexOf('-->', startIdx);
  if (startCommentEnd === -1) {
    return {
      found: false,
      content: '',
      hasShellInPartial: false,
      rawBodyHasShellChrome,
    };
  }

  const bodyStart = startCommentEnd + 3;
  // Walk nested partial comment depth so inner <Partial> markers do not cut off the outer partial early.
  let depth = 1;
  let cursor = bodyStart;
  while (cursor < html.length) {
    const nextOpen = html.indexOf('<!--frsh:partial:', cursor);
    const nextClose = html.indexOf('<!--/frsh:partial-->', cursor);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      const closeEnd = html.indexOf('-->', nextOpen);
      cursor = closeEnd === -1 ? nextOpen + 17 : closeEnd + 3;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      const content = html.slice(bodyStart, nextClose);
      const hasShellInPartial = SHELL_CHROME_MARKERS.some((marker) => content.includes(marker));
      return {
        found: true,
        content,
        hasShellInPartial,
        rawBodyHasShellChrome,
      };
    }
    cursor = nextClose + '<!--/frsh:partial-->'.length;
  }

  return {
    found: false,
    content: '',
    hasShellInPartial: false,
    rawBodyHasShellChrome,
  };
}

// -----------------------------------------------------------------------------
// P1g Guarded Sub-App Helper (Strip vs Reject child App-level commands)
// -----------------------------------------------------------------------------

type ForbiddenPluginCommand = 'notFound' | 'appWrapper' | 'onError';

class PluginMountCapabilityError extends Error {
  readonly code = 'FORBIDDEN_PLUGIN_APP_COMMAND';
  readonly command: ForbiddenPluginCommand;

  constructor(command: ForbiddenPluginCommand) {
    super(`Plugin sub-app cannot register host-level command "${command}"`);
    this.name = 'PluginMountCapabilityError';
    this.command = command;
  }
}

class GuardedPluginApp<State> extends App<State> {
  readonly blockedCommands: ForbiddenPluginCommand[] = [];
  readonly #mode: 'reject' | 'strip';

  constructor(mode: 'reject' | 'strip', config?: FreshConfig) {
    super(config);
    this.#mode = mode;
  }

  override notFound(
    routeOrMiddleware: Parameters<App<State>['notFound']>[0],
  ): this {
    if (this.#mode === 'reject') {
      throw new PluginMountCapabilityError('notFound');
    }
    this.blockedCommands.push('notFound');
    void routeOrMiddleware;
    return this;
  }

  override appWrapper(
    component: Parameters<App<State>['appWrapper']>[0],
  ): this {
    if (this.#mode === 'reject') {
      throw new PluginMountCapabilityError('appWrapper');
    }
    this.blockedCommands.push('appWrapper');
    void component;
    return this;
  }

  override onError(
    path: string,
    routeOrMiddleware: Parameters<App<State>['onError']>[1],
  ): this {
    if (this.#mode === 'reject') {
      throw new PluginMountCapabilityError('onError');
    }
    this.blockedCommands.push('onError');
    void path;
    void routeOrMiddleware;
    return this;
  }
}

// -----------------------------------------------------------------------------
// P2 Route Module Normalizer
// -----------------------------------------------------------------------------

const ALLOWED_ROUTE_EXPORTS = new Set([
  'default',
  'handler',
  'handlers',
  'config',
  'css',
]);

class FreshRouteModuleError extends Error {
  readonly code:
    | 'INVALID_MODULE_OBJECT'
    | 'UNKNOWN_ROUTE_EXPORTS'
    | 'EMPTY_ROUTE_MODULE'
    | 'AMBIGUOUS_HANDLERS'
    | 'INVALID_COMPONENT_EXPORT'
    | 'INVALID_HANDLER_EXPORT'
    | 'INVALID_CONFIG_EXPORT'
    | 'INVALID_CSS_EXPORT';
  readonly moduleId: string;
  readonly unknownExports?: readonly string[];

  constructor(
    code: FreshRouteModuleError['code'],
    moduleId: string,
    message: string,
    unknownExports?: readonly string[],
  ) {
    super(`[${code}] (${moduleId}) ${message}`);
    this.name = 'FreshRouteModuleError';
    this.code = code;
    this.moduleId = moduleId;
    this.unknownExports = unknownExports;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeFreshRouteModule<State>(
  mod: unknown,
  moduleId = '<route-module>',
): RouteObj {
  if (typeof mod !== 'object' || mod === null) {
    throw new FreshRouteModuleError(
      'INVALID_MODULE_OBJECT',
      moduleId,
      `Expected module namespace object, got ${typeof mod}`,
    );
  }

  const record = mod as Record<string, unknown>;
  const keys = Object.keys(record);
  const unknownExports = keys.filter((key) => !ALLOWED_ROUTE_EXPORTS.has(key));
  if (unknownExports.length > 0) {
    throw new FreshRouteModuleError(
      'UNKNOWN_ROUTE_EXPORTS',
      moduleId,
      `Unexpected route exports: ${unknownExports.join(', ')}`,
      unknownExports,
    );
  }

  if (record.handler !== undefined && record.handlers !== undefined) {
    throw new FreshRouteModuleError(
      'AMBIGUOUS_HANDLERS',
      moduleId,
      'Module cannot export both "handler" and "handlers"',
    );
  }

  const rawHandler = record.handlers ?? record.handler;
  const hasAnyRouteExport = record.default !== undefined ||
    rawHandler !== undefined ||
    record.config !== undefined;
  if (!hasAnyRouteExport) {
    throw new FreshRouteModuleError(
      'EMPTY_ROUTE_MODULE',
      moduleId,
      'Route module must export at least one of "default", "handler", "handlers", or "config"',
    );
  }

  if (record.default !== undefined && typeof record.default !== 'function') {
    throw new FreshRouteModuleError(
      'INVALID_COMPONENT_EXPORT',
      moduleId,
      `Expected "default" export to be a component function, got ${typeof record.default}`,
    );
  }

  if (rawHandler !== undefined) {
    if (typeof rawHandler !== 'function') {
      if (!isPlainRecord(rawHandler)) {
        throw new FreshRouteModuleError(
          'INVALID_HANDLER_EXPORT',
          moduleId,
          `Expected "handler"/"handlers" to be a function or method map`,
        );
      }
      for (const [method, fn] of Object.entries(rawHandler)) {
        if (fn !== undefined && typeof fn !== 'function') {
          throw new FreshRouteModuleError(
            'INVALID_HANDLER_EXPORT',
            moduleId,
            `Expected handler.${method} to be a function, got ${typeof fn}`,
          );
        }
      }
    }
  }

  if (record.config !== undefined && !isPlainRecord(record.config)) {
    throw new FreshRouteModuleError(
      'INVALID_CONFIG_EXPORT',
      moduleId,
      'Expected "config" export to be a plain object',
    );
  }

  if (
    record.css !== undefined &&
    (!Array.isArray(record.css) || record.css.some((entry) => typeof entry !== 'string'))
  ) {
    throw new FreshRouteModuleError(
      'INVALID_CSS_EXPORT',
      moduleId,
      'Expected "css" export to be an array of strings',
    );
  }

  return {
    component: record.default as RouteObj['component'],
    handler: rawHandler as RouteObj['handler'],
    config: record.config as RouteObj['config'],
    css: record.css as RouteObj['css'],
  };
}

// -----------------------------------------------------------------------------
// Probe Execution
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== NetScript Wave-0 Probe A: Fresh 2.3.3 Mount, Partials, Lazy Loaders & SSR Containment ===');
  console.log(`Deno: ${Deno.version.deno}, V8: ${Deno.version.v8}, TS: ${Deno.version.typescript}`);

  // P0: Verify single shared Preact instance & default errorBoundaries mode
  await runCase('P0.1', 'P0', 'Preact options.errorBoundaries default in Fresh 2.3.3', () => {
    const eb = (preactOptions as { errorBoundaries?: unknown }).errorBoundaries;
    assertEquals(eb, undefined);
    return `preactOptions.errorBoundaries=${String(eb)} (Fresh 2.3.3 does NOT enable errorBoundaries)`;
  });

  // ---------------------------------------------------------------------------
  // P1: Mount ordering & <Partial> boundary
  // ---------------------------------------------------------------------------

  await runCase('P1.0', 'P1', 'Pre-fsRoutes vs Post-fsRoutes mount ordering', async () => {
    // Pre-fsRoutes mountApp AND pre-fsRoutes app.route() both miss fsRoutes _app/_layout/_middleware
    const preHost = new App<ProbeState>();
    attachHostFsRoutes(preHost, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      rootLayout: hostLayoutsMod.HostRootLayout,
      pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
    });
    const preSub = new App<ProbeState>();
    preSub.route('/hello', {
      handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
      component: ({ data }: PageProps<{ trace: string[] }>) =>
        h('div', { 'data-pre-mount': data.trace.join(',') || 'empty' }, 'pre-mount'),
    });
    preHost.mountApp('/plugins/p1', preSub);
    preHost.route('/plugins/prefixed-pre', {
      handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
      component: ({ data }: PageProps<{ trace: string[] }>) =>
        h('div', { 'data-pre-route': data.trace.join(',') || 'empty' }, 'pre-route'),
    });
    preHost.fsRoutes();

    const preHandler = preHost.handler();
    const preMountHtml = await (await preHandler(new Request('http://localhost/plugins/p1/hello')))
      .text();
    const preRouteHtml =
      await (await preHandler(new Request('http://localhost/plugins/prefixed-pre'))).text();

    assert(!preMountHtml.includes('data-host-app="true"'), 'pre-fsRoutes mountApp missed _app');
    assert(
      !preMountHtml.includes('data-host-root-layout="true"'),
      'pre-fsRoutes mountApp missed _layout',
    );
    assert(preMountHtml.includes('data-pre-mount="empty"'), 'pre-fsRoutes mountApp missed _middleware');
    assert(!preRouteHtml.includes('data-host-app="true"'), 'pre-fsRoutes app.route missed _app');
    assert(preRouteHtml.includes('data-pre-route="empty"'), 'pre-fsRoutes app.route missed _middleware');

    // Post-fsRoutes mountApp AND post-fsRoutes app.route() both inherit fsRoutes _app/_layout/_middleware
    const postHost = new App<ProbeState>();
    attachHostFsRoutes(postHost, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      rootLayout: hostLayoutsMod.HostRootLayout,
      pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
    });
    postHost.fsRoutes();
    const postSub = new App<ProbeState>();
    postSub.route('/hello', {
      handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
      component: ({ data }: PageProps<{ trace: string[] }>) =>
        h('div', { 'data-post-mount': data.trace.join(',') }, 'post-mount'),
    });
    postHost.mountApp('/plugins/p1', postSub);
    postHost.route('/plugins/prefixed-post', {
      handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
      component: ({ data }: PageProps<{ trace: string[] }>) =>
        h('div', { 'data-post-route': data.trace.join(',') }, 'post-route'),
    });

    const postHandler = postHost.handler();
    const postMountHtml = await (await postHandler(new Request('http://localhost/plugins/p1/hello')))
      .text();
    const postRouteHtml =
      await (await postHandler(new Request('http://localhost/plugins/prefixed-post'))).text();

    assertStringIncludes(postMountHtml, 'data-host-app="true"');
    assertStringIncludes(postMountHtml, 'data-host-root-layout="true"');
    assertStringIncludes(postMountHtml, 'data-persistent-shell="true"');
    assertStringIncludes(postMountHtml, 'data-post-mount="host-mw"');

    assertStringIncludes(postRouteHtml, 'data-host-app="true"');
    assertStringIncludes(postRouteHtml, 'data-host-root-layout="true"');
    assertStringIncludes(postRouteHtml, 'data-persistent-shell="true"');
    assertStringIncludes(postRouteHtml, 'data-post-route="host-mw"');

    return 'Pre-fsRoutes missed _app/_layout/_middleware; post-fsRoutes mountApp & app.route both inherited all 3.';
  });

  await runCase('P1a', 'P1', 'Host _app wrapper wraps mounted plugin routes (mountApp vs app.route)', async () => {
    const app = new App<ProbeState>();
    attachHostFsRoutes(app, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      rootLayout: hostLayoutsMod.HostRootLayout,
    });
    app.fsRoutes();

    const p1 = new App<ProbeState>();
    p1.route('/hello', {
      component: () => h('section', { 'data-plugin': 'p1' }, 'P1 Hello'),
    });
    app.mountApp('/plugins/p1', p1);
    app.route('/plugins/p1-direct/hello', {
      component: () => h('section', { 'data-plugin': 'p1-direct' }, 'P1 Direct'),
    });

    const handler = app.handler();
    const mountRes = await handler(new Request('http://localhost/plugins/p1/hello'));
    const mountHtml = await mountRes.text();
    const directRes = await handler(new Request('http://localhost/plugins/p1-direct/hello'));
    const directHtml = await directRes.text();

    assertEquals(mountRes.status, 200);
    assertStringIncludes(mountHtml, 'data-host-app="true"');
    assertStringIncludes(mountHtml, 'data-host-app-chrome="true"');
    assertStringIncludes(mountHtml, 'f-client-nav="true"');
    assertStringIncludes(mountHtml, 'data-plugin="p1"');

    assertEquals(directRes.status, 200);
    assertStringIncludes(directHtml, 'data-host-app="true"');
    assertStringIncludes(directHtml, 'data-plugin="p1-direct"');

    return 'Both post-fsRoutes mountApp and prefixed app.route receive host _app wrapper (<html data-host-app>, <body f-client-nav>).';
  });

  await runCase(
    'P1b-naive',
    'P1',
    'Nested host _layout (<Partial name="main"> inside shell, WITHOUT isPartial guard) on ?fresh-partial',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.HostRootLayout,
        pluginsLayout: hostLayoutsMod.NaiveShellPluginsLayout,
      });
      app.fsRoutes();

      const p1 = new App<ProbeState>();
      p1.route('/view', {
        component: () => h('div', { 'data-plugin-view': 'naive-partial-test' }, 'Plugin Body'),
      });
      app.mountApp('/plugins/p1', p1);
      app.route('/plugins/direct-view', {
        component: () => h('div', { 'data-plugin-view': 'direct-naive-test' }, 'Direct Body'),
      });

      const handler = app.handler();
      const fullHtml = await (await handler(new Request('http://localhost/plugins/p1/view'))).text();
      assertStringIncludes(fullHtml, 'data-persistent-shell="true"');
      assertStringIncludes(fullHtml, '<!--frsh:partial:main:');

      // Test both `?fresh-partial` (bare) and `?fresh-partial=true`
      for (const qs of ['?fresh-partial', '?fresh-partial=true']) {
        const mountPartialRes = await handler(new Request(`http://localhost/plugins/p1/view${qs}`));
        const mountPartialHtml = await mountPartialRes.text();
        const mountExtract = extractPartialRegion(mountPartialHtml, 'main');

        assert(mountPartialRes.headers.get('X-Fresh-Id'), `Missing X-Fresh-Id for ${qs}`);
        assert(mountExtract.found, `Missing <!--frsh:partial:main:...--> in ${qs}`);
        assertEquals(mountExtract.hasShellInPartial, false);
        assertStringIncludes(mountExtract.content, 'data-plugin-view="naive-partial-test"');
        // Crucial Fresh 2.3.3 runtime truth: raw HTTP body STILL has outer shell when _layout ignores isPartial!
        assertEquals(mountExtract.rawBodyHasShellChrome, true);

        const directPartialRes = await handler(
          new Request(`http://localhost/plugins/direct-view${qs}`),
        );
        const directExtract = extractPartialRegion(await directPartialRes.text(), 'main');
        assert(directExtract.found);
        assertEquals(directExtract.hasShellInPartial, false);
      }

      return 'Inside <!--frsh:partial:main--> markers: hasShellInPartial===false for ?fresh-partial and ?fresh-partial=true; raw HTTP response still includes outer shell unless _layout/_app branch on ctx.isPartial.';
    },
  );

  await runCase(
    'P1b-aware',
    'P1',
    'Nested host _layout (<Partial name="main"> inside shell, WITH isPartial guard) on ?fresh-partial',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.PartialAwareHostAppWrapper,
        rootLayout: hostLayoutsMod.PartialAwareHostRootLayout,
        pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
      });
      app.fsRoutes();

      const p1 = new App<ProbeState>();
      p1.route('/view', {
        component: () => h('div', { 'data-plugin-view': 'aware-partial-test' }, 'Plugin Body'),
      });
      p1.route('/nested-subpartial', {
        component: () =>
          h(
            'div',
            { 'data-plugin-wrapper': 'true' },
            h(Partial, { name: 'p1-widget' }, h('span', null, 'inner widget')),
          ),
      });
      p1.route('/duplicate-partial', {
        component: () => h(Partial, { name: 'main' }, h('span', null, 'duplicate')),
      });
      app.mountApp('/plugins/p1', p1);
      app.route('/plugins/direct-view', {
        component: () => h('div', { 'data-plugin-view': 'direct-aware-test' }, 'Direct Body'),
      });

      const handler = app.handler();

      // Full request has persistent shell around <Partial name="main">
      const fullHtml = await (await handler(new Request('http://localhost/plugins/p1/view'))).text();
      assertStringIncludes(fullHtml, 'data-persistent-shell="true"');
      assertStringIncludes(fullHtml, 'data-host-root-layout="true"');
      assertStringIncludes(fullHtml, 'data-host-app-chrome="true"');
      assertStringIncludes(fullHtml, '<!--frsh:partial:main:');

      // Partial requests have ZERO shell chrome BOTH inside markers AND in the entire HTTP response body!
      for (const qs of ['?fresh-partial', '?fresh-partial=true']) {
        const mountRes = await handler(new Request(`http://localhost/plugins/p1/view${qs}`));
        const mountHtml = await mountRes.text();
        const mountExtract = extractPartialRegion(mountHtml, 'main');
        assert(mountRes.headers.get('X-Fresh-Id'), `Missing X-Fresh-Id for ${qs}`);
        assert(mountExtract.found, `Expected <!--frsh:partial:main--> in ${qs}`);
        assertEquals(mountExtract.hasShellInPartial, false);
        assertEquals(mountExtract.rawBodyHasShellChrome, false);
        assertStringIncludes(mountHtml, '__FRSH_STATE_');
        assert(!mountHtml.includes('boot('), 'Partial response must not emit full boot() script');

        const directRes = await handler(new Request(`http://localhost/plugins/direct-view${qs}`));
        const directExtract = extractPartialRegion(await directRes.text(), 'main');
        assert(directExtract.found);
        assertEquals(directExtract.hasShellInPartial, false);
        assertEquals(directExtract.rawBodyHasShellChrome, false);
      }

      // Distinct inner <Partial name="p1-widget"> inside host <Partial name="main"> succeeds
      const subPartialRes = await handler(
        new Request('http://localhost/plugins/p1/nested-subpartial?fresh-partial=true'),
      );
      const subPartialHtml = await subPartialRes.text();
      const subExtract = extractPartialRegion(subPartialHtml, 'main');
      assertEquals(subPartialRes.status, 200);
      assert(subExtract.found);
      assertEquals(subExtract.hasShellInPartial, false);
      assertStringIncludes(subExtract.content, '<!--frsh:partial:p1-widget:');

      // Duplicate <Partial name="main"> inside plugin route fails loudly (500)
      const dupRes = await handler(
        new Request('http://localhost/plugins/p1/duplicate-partial'),
      );
      assertEquals(dupRes.status, 500);

      // Anti-pattern control: <Partial name="main"> OUTSIDE shell leaks shell chrome into partial
      const antiApp = new App<ProbeState>();
      attachHostFsRoutes(antiApp, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        pluginsLayout: hostLayoutsMod.AntiPatternOuterPartialShellLayout,
      });
      antiApp.fsRoutes();
      antiApp.route('/plugins/p1/view', {
        component: () => h('div', null, 'inner'),
      });
      const antiHtml = await (await antiApp.handler()(
        new Request('http://localhost/plugins/p1/view?fresh-partial=true'),
      )).text();
      const antiExtract = extractPartialRegion(antiHtml, 'main');
      assertEquals(antiExtract.hasShellInPartial, true);

      return 'With isPartial-aware _layout/_app: hasShellInPartial===false AND rawBodyHasShellChrome===false across mountApp & app.route; inner distinct sub-partial works; duplicate "main" throws 500; outer-<Partial> anti-pattern proves hasShellInPartial===true.';
    },
  );

  await runCase('P1c', 'P1', 'Host basePath composition (mountApp vs app.route)', async () => {
    const app = new App<ProbeState>({ basePath: '/console' });
    attachHostFsRoutes(app, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      rootLayout: hostLayoutsMod.HostRootLayout,
      pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
    });
    app.fsRoutes();

    const p1 = new App<ProbeState>();
    p1.use(async (ctx) => {
      ctx.state.p1 = true;
      ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-mw'];
      return await ctx.next();
    });
    p1.route('/', {
      handler: (ctx) => page({ basePath: ctx.config.basePath, trace: ctx.state.trace ?? [] }),
      component: ({ data }: PageProps<{ basePath: string; trace: string[] }>) =>
        h(
          'div',
          {
            'data-p1-root': 'true',
            'data-base': data.basePath,
            'data-trace': data.trace.join(','),
          },
          'P1 Index',
        ),
    });
    p1.route('/items/:id', {
      handler: (ctx) =>
        page({
          id: ctx.params.id,
          basePath: ctx.config.basePath,
          trace: ctx.state.trace ?? [],
        }),
      component: ({ data }: PageProps<{ id: string; basePath: string; trace: string[] }>) =>
        h(
          'div',
          {
            'data-p1-item': data.id,
            'data-base': data.basePath,
            'data-trace': data.trace.join(','),
          },
          `Item ${data.id}`,
        ),
    });

    app.mountApp('/plugins/p1', p1);
    app.route('/plugins/direct/items/:id', {
      handler: (ctx) => page({ id: ctx.params.id, basePath: ctx.config.basePath }),
      component: ({ data }: PageProps<{ id: string; basePath: string }>) =>
        h('div', { 'data-direct-item': data.id, 'data-base': data.basePath }, data.id),
    });

    const handler = app.handler();

    const rootRes = await handler(new Request('http://localhost/console/plugins/p1'));
    const rootHtml = await rootRes.text();
    assertEquals(rootRes.status, 200);
    assertStringIncludes(rootHtml, 'data-p1-root="true"');
    assertStringIncludes(rootHtml, 'data-base="/console"');
    assertStringIncludes(rootHtml, 'data-trace="host-mw,p1-mw"');

    const itemRes = await handler(new Request('http://localhost/console/plugins/p1/items/42'));
    const itemHtml = await itemRes.text();
    assertEquals(itemRes.status, 200);
    assertStringIncludes(itemHtml, 'data-p1-item="42"');
    assertStringIncludes(itemHtml, 'data-base="/console"');
    assertStringIncludes(itemHtml, 'data-trace="host-mw,p1-mw"');

    const directRes = await handler(new Request('http://localhost/console/plugins/direct/items/99'));
    const directHtml = await directRes.text();
    assertEquals(directRes.status, 200);
    assertStringIncludes(directHtml, 'data-direct-item="99"');
    assertStringIncludes(directHtml, 'data-base="/console"');

    const unprefixed = await handler(new Request('http://localhost/plugins/p1'));
    assertEquals(unprefixed.status, 404);

    return 'Host basePath="/console" composes cleanly onto /console/plugins/p1, /console/plugins/p1/items/42, and prefixed app.route; unprefixed /plugins/p1 returns 404.';
  });

  await runCase(
    'P1d',
    'P1',
    'Plugin middleware execution order (mountApp vs prefixed app.route + /* trap)',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
      });
      app.fsRoutes();

      const p1 = new App<ProbeState>();
      p1.use(async (ctx) => {
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-mw'];
        const res = await ctx.next();
        res.headers.set('x-p1-mw', 'ran');
        return res;
      });
      p1.use('/nested', async (ctx) => {
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-nested-mw'];
        return await ctx.next();
      });
      p1.route('/items', {
        handler: (ctx) => {
          ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-items-handler'];
          return page({ trace: ctx.state.trace });
        },
        component: ({ data }: PageProps<{ trace: string[] }>) =>
          h('div', { 'data-trace': data.trace.join(',') }, 'items'),
      });
      p1.route('/nested/leaf', {
        handler: (ctx) => {
          ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-nested-leaf-handler'];
          return page({ trace: ctx.state.trace });
        },
        component: ({ data }: PageProps<{ trace: string[] }>) =>
          h('div', { 'data-trace': data.trace.join(',') }, 'leaf'),
      });
      app.mountApp('/plugins/p1', p1);

      // Prefixed app.route() pitfall comparison:
      // 1) `app.use('/plugins/direct-bad/*', mw)` registers literal '*' segment -> NEVER runs!
      app.use('/plugins/direct-bad/*', async (ctx) => {
        ctx.state.trace = [...(ctx.state.trace ?? []), 'direct-bad-mw'];
        return await ctx.next();
      });
      app.route('/plugins/direct-bad/items', {
        handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
        component: ({ data }: PageProps<{ trace: string[] }>) =>
          h('div', { 'data-direct-bad': data.trace.join(',') }, 'bad'),
      });

      // 2) `app.use('/plugins/direct-good', mw)` (without /*) IS required for manual prefixing
      app.use('/plugins/direct-good', async (ctx) => {
        ctx.state.trace = [...(ctx.state.trace ?? []), 'direct-good-mw'];
        return await ctx.next();
      });
      app.route('/plugins/direct-good/items', {
        handler: (ctx) => page({ trace: ctx.state.trace ?? [] }),
        component: ({ data }: PageProps<{ trace: string[] }>) =>
          h('div', { 'data-direct-good': data.trace.join(',') }, 'good'),
      });

      const handler = app.handler();

      const itemsRes = await handler(new Request('http://localhost/plugins/p1/items'));
      const itemsHtml = await itemsRes.text();
      assertEquals(itemsRes.headers.get('x-p1-mw'), 'ran');
      assertStringIncludes(itemsHtml, 'data-trace="host-mw,p1-mw,p1-items-handler"');

      const leafHtml = await (await handler(new Request('http://localhost/plugins/p1/nested/leaf')))
        .text();
      assertStringIncludes(
        leafHtml,
        'data-trace="host-mw,p1-mw,p1-nested-mw,p1-nested-leaf-handler"',
      );

      const badHtml = await (await handler(new Request('http://localhost/plugins/direct-bad/items')))
        .text();
      assertStringIncludes(badHtml, 'data-direct-bad="host-mw"');

      const goodHtml =
        await (await handler(new Request('http://localhost/plugins/direct-good/items'))).text();
      assertStringIncludes(goodHtml, 'data-direct-good="host-mw,direct-good-mw"');

      return 'mountApp preserves subApp.use() order (host-mw -> p1-mw -> nested-mw -> handler); prefixed app.route requires manual app.use("/prefix") and silently drops app.use("/prefix/*") due to patternToSegments creating literal "*" child segment.';
    },
  );

  await runCase('P1e', 'P1', 'Plugin 404 behavior inside mounted sub-app vs host 404', async () => {
    // 1) Component-only _404 quirk in Fresh 2.3.3: newNotFoundCmd calls renderRoute(ctx, route)
    //    without passing status=404, so component-only _404 returns HTTP 200 unless _404 provides a handler!
    const componentOnly404Host = new App<ProbeState>();
    attachHostFsRoutes(componentOnly404Host, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      notFound: { component: hostFallbacksMod.HostNotFoundPage },
    });
    componentOnly404Host.fsRoutes();
    const quirkRes = await componentOnly404Host.handler()(
      new Request('http://localhost/plugins/p1/missing'),
    );
    assertEquals(quirkRes.status, 200);
    assertStringIncludes(await quirkRes.text(), 'data-host-404="true"');

    // 2) Standard host _404 with handler returning page(null, { status: 404 })
    const app = new App<ProbeState>();
    attachHostFsRoutes(app, {
      appWrapper: hostAppWrapperMod.HostAppWrapper,
      rootLayout: hostLayoutsMod.HostRootLayout,
      pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
      notFound: {
        component: hostFallbacksMod.HostNotFoundPage,
        handler: hostFallbacksMod.hostNotFoundHandler,
      },
    });
    app.fsRoutes();

    const p1 = new App<ProbeState>();
    p1.use(async (ctx) => {
      ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-mw'];
      const res = await ctx.next();
      res.headers.set('x-p1-mw', 'ran');
      return res;
    });
    p1.route('/throws-404', {
      handler: () => {
        throw new HttpError(404, 'Plugin item missing');
      },
    });
    app.mountApp('/plugins/p1', p1);

    // Optional scoped catch-all plugin 404 on p2
    const p2 = new App<ProbeState>();
    p2.route('/exists', { component: () => h('div', null, 'exists') });
    p2.all('/*', (ctx) =>
      ctx.html(`<div data-p2-scoped-404="true">${ctx.url.pathname}</div>`, { status: 404 }));
    app.mountApp('/plugins/p2', p2);

    const handler = app.handler();

    // Unmatched path under /plugins/p1 falls through router -> rootHandler -> host _404 (not /plugins layout)
    const unmatchedP1 = await handler(new Request('http://localhost/plugins/p1/missing'));
    const unmatchedP1Html = await unmatchedP1.text();
    assertEquals(unmatchedP1.status, 404);
    assertStringIncludes(unmatchedP1Html, 'data-host-404="true"');
    assertStringIncludes(unmatchedP1Html, 'data-host-app="true"');
    assertEquals(unmatchedP1.headers.get('x-p1-mw'), null);

    // Matched plugin route throwing HttpError(404) hits host _404 (segments.ts checks root.notFound on status===404)
    const thrown404 = await handler(new Request('http://localhost/plugins/p1/throws-404'));
    const thrown404Html = await thrown404.text();
    assertEquals(thrown404.status, 404);
    assertStringIncludes(thrown404Html, 'data-host-404="true"');
    assertEquals(thrown404.headers.get('x-p1-mw'), 'ran');

    // Scoped catch-all on p2 handles /plugins/p2/missing without affecting host 404
    const scopedP2 = await handler(new Request('http://localhost/plugins/p2/missing'));
    assertEquals(scopedP2.status, 404);
    assertStringIncludes(await scopedP2.text(), 'data-p2-scoped-404="true"');

    const hostMissing = await handler(new Request('http://localhost/totally-missing'));
    assertEquals(hostMissing.status, 404);
    assertStringIncludes(await hostMissing.text(), 'data-host-404="true"');

    return 'Unmatched /plugins/p1/missing & HttpError(404) invoke host _404 (NOTE: component-only _404 without handler returns 200 in Fresh 2.3.3 newNotFoundCmd; handler returning status:404 gives 404); plugin can opt into scoped 404 via subApp.all("/*").';
  });

  await runCase(
    'P1f',
    'P1',
    'Two co-mounted plugins (/p1, /p2) without middleware bleed',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.HostRootLayout,
      });
      app.fsRoutes();

      const p1 = new App<ProbeState>();
      p1.use(async (ctx) => {
        ctx.state.p1 = true;
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-mw'];
        const res = await ctx.next();
        res.headers.set('x-plugin', 'p1');
        return res;
      });
      p1.route('/info', {
        handler: (ctx) =>
          page({
            trace: ctx.state.trace ?? [],
            p1: ctx.state.p1 ?? false,
            p2: ctx.state.p2 ?? false,
          }),
        component: ({ data }: PageProps<{ trace: string[]; p1: boolean; p2: boolean }>) =>
          h(
            'div',
            {
              'data-p1-info': data.trace.join(','),
              'data-flags': `p1=${data.p1},p2=${data.p2}`,
            },
            'p1',
          ),
      });

      const p2 = new App<ProbeState>();
      p2.use(async (ctx) => {
        ctx.state.p2 = true;
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p2-mw'];
        const res = await ctx.next();
        res.headers.set('x-plugin', 'p2');
        return res;
      });
      p2.route('/info', {
        handler: (ctx) =>
          page({
            trace: ctx.state.trace ?? [],
            p1: ctx.state.p1 ?? false,
            p2: ctx.state.p2 ?? false,
          }),
        component: ({ data }: PageProps<{ trace: string[]; p1: boolean; p2: boolean }>) =>
          h(
            'div',
            {
              'data-p2-info': data.trace.join(','),
              'data-flags': `p1=${data.p1},p2=${data.p2}`,
            },
            'p2',
          ),
      });

      app.mountApp('/p1', p1);
      app.mountApp('/p2', p2);

      const handler = app.handler();

      const r1 = await handler(new Request('http://localhost/p1/info'));
      const h1 = await r1.text();
      assertEquals(r1.headers.get('x-plugin'), 'p1');
      assertStringIncludes(h1, 'data-p1-info="host-mw,p1-mw"');
      assertStringIncludes(h1, 'data-flags="p1=true,p2=false"');

      const r2 = await handler(new Request('http://localhost/p2/info'));
      const h2 = await r2.text();
      assertEquals(r2.headers.get('x-plugin'), 'p2');
      assertStringIncludes(h2, 'data-p2-info="host-mw,p2-mw"');
      assertStringIncludes(h2, 'data-flags="p1=false,p2=true"');

      const rHost = await handler(new Request('http://localhost/host-page'));
      const hHost = await rHost.text();
      assertEquals(rHost.headers.get('x-plugin'), null);
      assertStringIncludes(hHost, 'data-trace="host-mw,host-route"');
      assertStringIncludes(hHost, 'data-p1="null"');
      assertStringIncludes(hHost, 'data-p2="null"');

      return 'Co-mounted /p1 and /p2 isolate middleware state and headers cleanly with zero bleed onto each other or /host-page.';
    },
  );

  await runCase(
    'P1g',
    'P1',
    'Raw App.mountApp child command leak vs GuardedPluginApp reject/strip enforcement',
    async () => {
      // 1) Prove raw Fresh 2.3.3 mountApp leaks child appWrapper + notFound globally onto host:
      //    - CommandType.NotFound overwrites root.notFound globally for all 404s
      //    - CommandType.App overwrites root.app for all routes/plugins applied AFTER that mountApp!
      const rawHost = new App<ProbeState>();
      attachHostFsRoutes(rawHost, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        notFound: {
          component: hostFallbacksMod.HostNotFoundPage,
          handler: hostFallbacksMod.hostNotFoundHandler,
        },
        errorPage: { component: hostFallbacksMod.HostErrorPage },
      });
      rawHost.fsRoutes();

      const rogueRawChild = new App<ProbeState>();
      assertEquals(
        Reflect.ownKeys(rogueRawChild).filter((k) => String(k).includes('command')).length,
        0,
        'App.#commands is private ES field',
      );
      rogueRawChild.appWrapper(({ Component }) =>
        h('html', { 'data-rogue-app': 'true' }, h('body', null, h(Component, null)))
      );
      rogueRawChild.notFound(() => new Response('rogue child 404', { status: 404 }));
      rogueRawChild.onError('*', () => new Response('rogue child onError', { status: 500 }));
      rogueRawChild.route('/boom', {
        handler: () => {
          throw new Error('child boom');
        },
      });
      rawHost.mountApp('/plugins/rogue', rogueRawChild);

      // Sibling plugin mounted AFTER rogueRawChild AND host route registered AFTER rogueRawChild:
      const siblingAfterRogue = new App<ProbeState>();
      siblingAfterRogue.route('/ok', {
        component: () => h('div', { 'data-sibling-after': 'true' }, 'sibling'),
      });
      rawHost.mountApp('/plugins/sibling', siblingAfterRogue);
      rawHost.route('/host-after-mount', {
        component: () => h('div', { 'data-host-after': 'true' }, 'host-after'),
      });

      const rawHandler = rawHost.handler();
      // Routes compiled BEFORE mountApp kept HostAppWrapper, while sibling plugin & host routes AFTER mountApp got hijacked by rogueRawChild.appWrapper!
      const hijackedSibling =
        await (await rawHandler(new Request('http://localhost/plugins/sibling/ok'))).text();
      assertStringIncludes(hijackedSibling, 'data-rogue-app="true"');
      assert(!hijackedSibling.includes('data-host-app="true"'));

      const hijackedHostAfter =
        await (await rawHandler(new Request('http://localhost/host-after-mount'))).text();
      assertStringIncludes(hijackedHostAfter, 'data-rogue-app="true"');
      assert(!hijackedHostAfter.includes('data-host-app="true"'));

      const hijacked404 = await (await rawHandler(new Request('http://localhost/nonexistent')))
        .text();
      assertEquals(hijacked404, 'rogue child 404');

      const scopedChildError =
        await (await rawHandler(new Request('http://localhost/plugins/rogue/boom'))).text();
      assertEquals(scopedChildError, 'rogue child onError');

      // 2) Prove GuardedPluginApp(mode='reject') throws structured errors on notFound/appWrapper/onError
      const rejectSub = new GuardedPluginApp<ProbeState>('reject');
      for (const cmd of ['notFound', 'appWrapper', 'onError'] as const) {
        const thrown = assertThrows(() => {
          if (cmd === 'notFound') rejectSub.notFound(() => new Response('no'));
          if (cmd === 'appWrapper') rejectSub.appWrapper(({ Component }) => h(Component, null));
          if (cmd === 'onError') rejectSub.onError('*', () => new Response('no'));
        }, PluginMountCapabilityError);
        assertEquals(thrown.code, 'FORBIDDEN_PLUGIN_APP_COMMAND');
        assertEquals(thrown.command, cmd);
      }

      // 3) Prove GuardedPluginApp(mode='strip') drops notFound/appWrapper/onError so host owns all three
      const safeHost = new App<ProbeState>();
      attachHostFsRoutes(safeHost, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        notFound: {
          component: hostFallbacksMod.HostNotFoundPage,
          handler: hostFallbacksMod.hostNotFoundHandler,
        },
        errorPage: { component: hostFallbacksMod.HostErrorPage },
      });
      safeHost.fsRoutes();

      const strippedSub = new GuardedPluginApp<ProbeState>('strip');
      strippedSub.appWrapper(({ Component }) =>
        h('html', { 'data-rogue-app': 'true' }, h('body', null, h(Component, null)))
      );
      strippedSub.notFound(() => new Response('rogue child 404', { status: 404 }));
      strippedSub.onError('*', () => new Response('rogue child onError', { status: 500 }));
      strippedSub.route('/ok', { component: () => h('div', { 'data-safe-ok': 'true' }, 'ok') });
      strippedSub.route('/boom', {
        handler: () => {
          throw new Error('safe child boom');
        },
      });
      assertEquals(strippedSub.blockedCommands, ['appWrapper', 'notFound', 'onError']);

      safeHost.mountApp('/plugins/safe', strippedSub);
      safeHost.route('/host-after-safe', {
        component: () => h('div', { 'data-host-after-safe': 'true' }, 'ok'),
      });
      const safeHandler = safeHost.handler();

      const safeHostPage = await (await safeHandler(new Request('http://localhost/host-after-safe')))
        .text();
      assertStringIncludes(safeHostPage, 'data-host-app="true"');
      assert(!safeHostPage.includes('data-rogue-app'));

      const safe404 = await (await safeHandler(new Request('http://localhost/nonexistent'))).text();
      assertStringIncludes(safe404, 'data-host-404="true"');

      const safeBoom =
        await (await safeHandler(new Request('http://localhost/plugins/safe/boom'))).text();
      assertStringIncludes(safeBoom, 'data-host-error="true"');
      assertStringIncludes(safeBoom, 'safe child boom');

      return 'Raw App.mountApp clobbers root.notFound globally and overwrites root.app for all subsequent routes/plugins (App.#commands is private ES field); GuardedPluginApp rejects or strips notFound/appWrapper/onError leaving host shell/404/onError intact.';
    },
  );

  // ---------------------------------------------------------------------------
  // P2: Literal lazy route loaders & normalizer
  // ---------------------------------------------------------------------------

  await runCase(
    'P2a',
    'P2',
    'Literal dynamic import().then(normalizeFreshRouteModule) end-to-end on mounted plugin route (css + handlers + caching)',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.PartialAwareHostRootLayout,
        pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
      });
      app.fsRoutes();

      const p1 = new GuardedPluginApp<ProbeState>('reject');
      p1.use(async (ctx) => {
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-mw'];
        return await ctx.next();
      });

      p1.route(
        '/widget',
        () =>
          import('./probe-a-fixtures/plugin-route-full.tsx').then((mod) =>
            normalizeFreshRouteModule<ProbeState>(mod, 'plugin-route-full.tsx')
          ),
      );
      p1.route(
        '/singular',
        () =>
          import('./probe-a-fixtures/plugin-route-singular.tsx').then((mod) =>
            normalizeFreshRouteModule<ProbeState>(mod, 'plugin-route-singular.tsx')
          ),
      );
      p1.route(
        '/bare',
        () =>
          import('./probe-a-fixtures/plugin-route-skip-app.tsx').then((mod) =>
            normalizeFreshRouteModule<ProbeState>(mod, 'plugin-route-skip-app.tsx')
          ),
      );

      app.mountApp('/plugins/p1', p1);

      // Module must NOT be loaded before the first HTTP request!
      assertEquals(getModuleLoadCount('plugin-route-full'), 0);

      const handler = app.handler();
      assertEquals(getModuleLoadCount('plugin-route-full'), 0);

      // First GET triggers dynamic import + normalizer + GET handler + CSS injection + host wrappers
      const firstRes = await handler(new Request('http://localhost/plugins/p1/widget'));
      const firstHtml = await firstRes.text();
      assertEquals(firstRes.status, 200);
      assertEquals(getModuleLoadCount('plugin-route-full'), 1);
      assertEquals(firstRes.headers.get('x-plugin-handler'), 'GET');
      assertStringIncludes(firstHtml, 'data-host-app="true"');
      assertStringIncludes(firstHtml, 'data-persistent-shell="true"');
      assertMatch(firstHtml, /<link rel="stylesheet" href="\/assets\/plugin-widget\.css"\s*\/?>/);
      assertStringIncludes(firstHtml, 'Widget Loaded via Lazy Normalizer');
      assertStringIncludes(firstHtml, 'data-trace="host-mw,p1-mw,plugin-full-GET"');

      // Second GET reuses cached Route definition (load count remains 1) and still injects css
      const secondRes = await handler(new Request('http://localhost/plugins/p1/widget'));
      const secondHtml = await secondRes.text();
      assertEquals(secondRes.status, 200);
      assertEquals(getModuleLoadCount('plugin-route-full'), 1);
      assertMatch(secondHtml, /<link rel="stylesheet" href="\/assets\/plugin-widget\.css"\s*\/?>/);

      // POST hits handlers.POST
      const postRes = await handler(
        new Request('http://localhost/plugins/p1/widget', { method: 'POST' }),
      );
      assertEquals(postRes.status, 200);
      assertEquals(await postRes.json(), {
        ok: true,
        method: 'POST',
        path: '/plugins/p1/widget',
      });

      // Singular `handler` fixture works too
      const singularHtml = await (await handler(new Request('http://localhost/plugins/p1/singular')))
        .text();
      assertStringIncludes(singularHtml, 'singular-handler:/plugins/p1/singular');

      // Lazy `config.skipAppWrapper` + `config.skipInheritedLayouts` + `css` works at render time
      const bareHtml = await (await handler(new Request('http://localhost/plugins/p1/bare'))).text();
      assertStringIncludes(bareHtml, 'data-bare-fragment="true"');
      assertMatch(bareHtml, /<link rel="stylesheet" href="\/assets\/bare-fragment\.css"\s*\/?>/);
      assert(!bareHtml.includes('data-host-app="true"'));
      assert(!bareHtml.includes('data-persistent-shell="true"'));

      return 'Literal lazy import().then(normalizeFreshRouteModule) loads lazily on 1st request (count 0->1->1), runs GET/POST handlers, injects route.css <link> into <head>, and honors lazy config.skipAppWrapper/skipInheritedLayouts.';
    },
  );

  await runCase(
    'P2c',
    'P2',
    'Fresh-3-compatible middleware -> handler({ data }) -> pure page shape (no inline ctx.render()) via normalizer + mountApp',
    async () => {
      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.PartialAwareHostAppWrapper,
        rootLayout: hostLayoutsMod.PartialAwareHostRootLayout,
        pluginsLayout: hostLayoutsMod.PartialAwareShellPluginsLayout,
      });
      app.fsRoutes();

      const p1 = new GuardedPluginApp<ProbeState>('reject');
      p1.use(async (ctx) => {
        ctx.state.tenant = 'acme-corp';
        ctx.state.trace = [...(ctx.state.trace ?? []), 'p1-tenant-mw'];
        return await ctx.next();
      });
      p1.route(
        '/records/:id',
        () =>
          import('./probe-a-fixtures/plugin-route-pure-data.tsx').then((mod) =>
            normalizeFreshRouteModule<ProbeState>(mod, 'plugin-route-pure-data.tsx')
          ),
      );
      app.mountApp('/plugins/p1', p1);

      const handler = app.handler();

      // Full navigation: middleware -> handlers.GET returning raw { data } -> pure page -> host shell + css
      const fullRes = await handler(new Request('http://localhost/plugins/p1/records/ord-7'));
      const fullHtml = await fullRes.text();
      assertEquals(fullRes.status, 200);
      assertStringIncludes(fullHtml, 'data-host-app="true"');
      assertStringIncludes(fullHtml, 'data-persistent-shell="true"');
      assertMatch(fullHtml, /<link rel="stylesheet" href="\/assets\/pure-data-page\.css"\s*\/?>/);
      assertStringIncludes(fullHtml, 'data-pure-plugin-page="true"');
      assertStringIncludes(fullHtml, 'data-tenant="acme-corp"');
      assertStringIncludes(fullHtml, 'data-item-id="ord-7"');
      assertStringIncludes(fullHtml, 'data-trace="host-mw,p1-tenant-mw,pure-handler-GET"');
      assertStringIncludes(fullHtml, 'data-is-partial="false"');

      // Partial navigation: returns ONLY partial content inside <!--frsh:partial:main--> with zero shell chrome
      const partialRes = await handler(
        new Request('http://localhost/plugins/p1/records/ord-7?fresh-partial=true'),
      );
      const partialHtml = await partialRes.text();
      const partialExtract = extractPartialRegion(partialHtml, 'main');
      assertEquals(partialRes.status, 200);
      assert(partialExtract.found);
      assertEquals(partialExtract.hasShellInPartial, false);
      assertEquals(partialExtract.rawBodyHasShellChrome, false);
      assertStringIncludes(partialExtract.content, 'data-pure-plugin-page="true"');
      assertStringIncludes(partialExtract.content, 'data-is-partial="true"');

      return 'Fresh-3-compatible middleware -> handler({ data }) -> pure page (zero inline ctx.render()) works cleanly through normalizeFreshRouteModule + mountApp on both full and ?fresh-partial=true requests.';
    },
  );

  await runCase(
    'P2b',
    'P2',
    'normalizeFreshRouteModule rejects unknown/invalid/empty/ambiguous exports with structured errors',
    async () => {
      const unknownErr = assertThrows(
        () =>
          normalizeFreshRouteModule(
            { default: () => h('div', null, 'x'), rogueExport: 42 },
            'inline-unknown',
          ),
        FreshRouteModuleError,
      );
      assertEquals(unknownErr.code, 'UNKNOWN_ROUTE_EXPORTS');
      assertEquals(unknownErr.unknownExports, ['rogueExport']);

      // Verify end-to-end on real dynamic import + Fresh lazy route
      const unknownMod = await import('./probe-a-fixtures/plugin-route-unknown-export.tsx');
      const dynUnknownErr = assertThrows(
        () => normalizeFreshRouteModule(unknownMod, 'plugin-route-unknown-export.tsx'),
        FreshRouteModuleError,
      );
      assertEquals(dynUnknownErr.code, 'UNKNOWN_ROUTE_EXPORTS');
      assertEquals(dynUnknownErr.unknownExports, ['rogueExport']);

      const bothMod = await import('./probe-a-fixtures/plugin-route-both-handlers.tsx');
      const bothErr = assertThrows(
        () => normalizeFreshRouteModule(bothMod, 'plugin-route-both-handlers.tsx'),
        FreshRouteModuleError,
      );
      assertEquals(bothErr.code, 'AMBIGUOUS_HANDLERS');

      const emptyMod = await import('./probe-a-fixtures/plugin-route-empty.ts');
      const emptyErr = assertThrows(
        () => normalizeFreshRouteModule(emptyMod, 'plugin-route-empty.ts'),
        FreshRouteModuleError,
      );
      assertEquals(emptyErr.code, 'EMPTY_ROUTE_MODULE');

      const cssMod = await import('./probe-a-fixtures/plugin-route-invalid-css.tsx');
      const cssErr = assertThrows(
        () => normalizeFreshRouteModule(cssMod, 'plugin-route-invalid-css.tsx'),
        FreshRouteModuleError,
      );
      assertEquals(cssErr.code, 'INVALID_CSS_EXPORT');

      // Also verify that when a lazy App.route() fails normalization on request, Fresh catches it as 500 via onError
      let capturedErr: unknown = null;
      const app = new App<ProbeState>();
      app.onError('*', (ctx) => {
        capturedErr = ctx.error;
        return new Response(
          ctx.error instanceof FreshRouteModuleError ? ctx.error.code : 'unexpected',
          { status: 500 },
        );
      });
      app.route(
        '/bad-lazy',
        () =>
          import('./probe-a-fixtures/plugin-route-unknown-export.tsx').then((mod) =>
            normalizeFreshRouteModule(mod, 'plugin-route-unknown-export.tsx')
          ),
      );
      const res = await app.handler()(new Request('http://localhost/bad-lazy'));
      assertEquals(res.status, 500);
      assertEquals(await res.text(), 'UNKNOWN_ROUTE_EXPORTS');
      assert(capturedErr instanceof FreshRouteModuleError);

      return 'Rejected unknownExports=[rogueExport], ambiguous handler+handlers, empty module, and invalid css with structured FreshRouteModuleError (surfaced cleanly in lazy route onError).';
    },
  );

  // ---------------------------------------------------------------------------
  // P4: SSR failure containment
  // ---------------------------------------------------------------------------

  await runCase(
    'P4a',
    'P4',
    'Host-side pre-render data-phase resolver try/catch renders quarantine fallback card cleanly',
    async () => {
      type ZoneResult =
        | { ok: true; htmlText: string }
        | { ok: false; errorMessage: string };

      async function resolveZone(fn: () => Promise<string>): Promise<ZoneResult> {
        try {
          return { ok: true, htmlText: await fn() };
        } catch (err) {
          return {
            ok: false,
            errorMessage: err instanceof Error ? err.message : String(err),
          };
        }
      }

      const app = new App<ProbeState>();
      attachHostFsRoutes(app, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.HostRootLayout,
      });
      app.fsRoutes();

      app.route('/dashboard', {
        handler: async () => {
          const [healthy, failing] = await Promise.all([
            resolveZone(() => Promise.resolve('Metrics OK: 42')),
            resolveZone(() => Promise.reject(new Error('downstream telemetry timeout'))),
          ]);
          return page({ healthy, failing });
        },
        component: ({ data }: PageProps<{ healthy: ZoneResult; failing: ZoneResult }>) =>
          h(
            'div',
            { 'data-dashboard': 'true' },
            data.healthy.ok
              ? h('section', { 'data-zone': 'healthy' }, data.healthy.htmlText)
              : h('section', { 'data-quarantine': 'healthy' }, 'Quarantined'),
            data.failing.ok
              ? h('section', { 'data-zone': 'failing' }, data.failing.htmlText)
              : h(
                'section',
                { 'data-quarantine': 'failing', role: 'alert' },
                `Plugin zone unavailable: ${data.failing.errorMessage}`,
              ),
          ),
      });

      const res = await app.handler()(new Request('http://localhost/dashboard'));
      const html = await res.text();
      assertEquals(res.status, 200);
      assertStringIncludes(html, 'data-host-app="true"');
      assertStringIncludes(html, 'data-zone="healthy">Metrics OK: 42</section>');
      assertStringIncludes(
        html,
        'data-quarantine="failing" role="alert">Plugin zone unavailable: downstream telemetry timeout</section>',
      );

      return 'Pre-render Promise.all + try/catch returned HTTP 200 with healthy sibling zone intact and quarantined fallback card for failing zone.';
    },
  );

  await runCase(
    'P4b',
    'P4',
    'Sync throw inside a zone SSR component during render (Fresh default vs explicit errorBoundaries=true)',
    async () => {
      interface BoundaryProps {
        children?: unknown;
      }
      interface BoundaryState {
        error: Error | null;
      }
      class ZoneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
        override state: BoundaryState = { error: null };
        static override getDerivedStateFromError(error: unknown): BoundaryState {
          return { error: error instanceof Error ? error : new Error(String(error)) };
        }
        override componentDidCatch(_error: Error): void {}
        override render() {
          if (this.state.error) {
            return h(
              'div',
              { 'data-eb-fallback': 'true' },
              `Caught: ${this.state.error.message}`,
            );
          }
          return this.props.children;
        }
      }

      function SyncThrowingZone(): never {
        throw new Error('sync zone render crash');
      }

      function HealthySiblingZone() {
        return h('div', { 'data-healthy-sibling': 'true' }, 'Sibling OK');
      }

      // 1) Direct preact-render-to-string with Fresh default (options.errorBoundaries === undefined)
      assertEquals(
        (preactOptions as { errorBoundaries?: unknown }).errorBoundaries,
        undefined,
      );
      const directErr = assertThrows(
        () =>
          renderToString(
            h(
              'div',
              null,
              h(HealthySiblingZone, null),
              h(ZoneErrorBoundary, null, h(SyncThrowingZone, null)),
            ),
          ),
        Error,
        'sync zone render crash',
      );
      assertEquals(directErr.message, 'sync zone render crash');

      // 2) Full Fresh 2.3.3 App.handler() WITHOUT onError -> returns HTTP 500, entire page aborted
      const appNoErrorRoute = new App<ProbeState>();
      appNoErrorRoute.route('/zone-crash', {
        component: () =>
          h(
            'div',
            null,
            h(HealthySiblingZone, null),
            h(ZoneErrorBoundary, null, h(SyncThrowingZone, null)),
          ),
      });
      const res500 = await appNoErrorRoute.handler()(new Request('http://localhost/zone-crash'));
      const body500 = await res500.text();
      assertEquals(res500.status, 500);
      assertEquals(body500, 'Internal server error');
      assert(!body500.includes('data-healthy-sibling'));
      assert(!body500.includes('data-eb-fallback'));

      // 3) Check what happens if global preactOptions.errorBoundaries = true is set (then restored!)
      const opts = preactOptions as { errorBoundaries?: boolean };
      const prevErrorBoundaries = opts.errorBoundaries;
      let ebRendered = '';
      let partialCorruptionErr: unknown = null;
      try {
        opts.errorBoundaries = true;
        ebRendered = await (await appNoErrorRoute.handler()(
          new Request('http://localhost/zone-crash'),
        )).text();
        assertStringIncludes(ebRendered, 'data-healthy-sibling="true"');
        assertStringIncludes(ebRendered, 'data-eb-fallback="true">Caught: sync zone render crash');

        // Also test if a <Partial> throwing inside ErrorBoundary interacts with Fresh preact_hooks
        const partialEbApp = new App<ProbeState>();
        partialEbApp.route('/eb-partial', {
          component: () =>
            h(
              ZoneErrorBoundary,
              null,
              h(Partial, { name: 'broken-zone' }, h(SyncThrowingZone, null)),
            ),
        });
        const partialEbRes = await partialEbApp.handler()(
          new Request('http://localhost/eb-partial'),
        );
        const partialEbBody = await partialEbRes.text();
        if (partialEbRes.status !== 200) {
          partialCorruptionErr = `status=${partialEbRes.status} body=${partialEbBody}`;
        }
      } finally {
        opts.errorBoundaries = prevErrorBoundaries;
      }

      return `Under Fresh 2.3.3 default (options.errorBoundaries=undefined), Preact ErrorBoundary does NOT catch sync SSR throws — renderToString throws and App.handler() fails whole page with HTTP 500 "Internal server error". Only explicit global preactOptions.errorBoundaries=true catches sync class-boundary throws (partial-inside-EB status=${
        partialCorruptionErr ?? '200'
      }).`;
    },
  );

  await runCase(
    'P4c',
    'P4',
    'Async throw inside top-level async component vs child async component in render path',
    async () => {
      // 1) Top-level async route component IS awaited by Fresh's renderRouteComponent -> caught by onError / 500
      const topAsyncApp = new App<ProbeState>();
      topAsyncApp.onError('*', (ctx) => {
        const msg = ctx.error instanceof Error ? ctx.error.message : String(ctx.error);
        return new Response(`top-async-caught:${msg}`, { status: 500 });
      });
      topAsyncApp.route('/top-async-throw', {
        component: async () => {
          await Promise.resolve();
          throw new Error('top-level async component blew up');
        },
      });
      const topRes = await topAsyncApp.handler()(new Request('http://localhost/top-async-throw'));
      assertEquals(topRes.status, 500);
      assertEquals(await topRes.text(), 'top-async-caught:top-level async component blew up');

      // 2) Async child component inside JSX passed to ctx.render / renderToString is NOT awaited by Fresh 2.3.3!
      // Instead, preact-render-to-string sees a Promise object (e.constructor !== undefined -> renders "") and leaks an unhandled rejection!
      const capturedRejections: unknown[] = [];
      const onUnhandled = (event: PromiseRejectionEvent) => {
        capturedRejections.push(event.reason);
        event.preventDefault();
      };
      globalThis.addEventListener('unhandledrejection', onUnhandled);
      try {
        async function AsyncChildZone() {
          await Promise.resolve();
          throw new Error('async child zone rejected');
        }

        const childAsyncApp = new App<ProbeState>();
        childAsyncApp.route('/child-async-throw', {
          component: () =>
            h(
              'div',
              { 'data-parent': 'alive' },
              // deno-lint-ignore no-explicit-any
              h(AsyncChildZone as any, null),
            ),
        });

        const childRes = await childAsyncApp.handler()(
          new Request('http://localhost/child-async-throw'),
        );
        const childHtml = await childRes.text();
        // Flush microtask queue so the rejected async child promise fires unhandledrejection
        await new Promise((r) => setTimeout(r, 10));

        assertEquals(childRes.status, 200);
        assertStringIncludes(childHtml, '<div data-parent="alive"></div>');
        assertEquals(capturedRejections.length, 1);
        assertMatch(String(capturedRejections[0]), /async child zone rejected/);
      } finally {
        globalThis.removeEventListener('unhandledrejection', onUnhandled);
      }

      return 'Top-level async route component rejection is awaited by Fresh renderRouteComponent and caught by onError (500); nested <AsyncChildZone /> is NOT awaited by sync renderToString — renders empty <div></div> (200) and leaks an unhandledrejection!';
    },
  );

  await runCase(
    'P4d',
    'P4',
    'Route-level onError behavior for plugin routes vs host shell (_layout / _app)',
    async () => {
      // 1) Host onError('*', ...) catches plugin route throws; nested /plugins layout was popped before root errorRoute renders
      const app1 = new App<ProbeState>();
      attachHostFsRoutes(app1, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.HostRootLayout,
        pluginsLayout: hostLayoutsMod.NaiveShellPluginsLayout,
        errorPage: { component: hostFallbacksMod.HostErrorPage },
      });
      app1.fsRoutes();

      const p1 = new GuardedPluginApp<ProbeState>('reject');
      p1.route('/fail-503', {
        handler: () => {
          throw new HttpError(503, 'upstream down');
        },
      });
      app1.mountApp('/plugins/p1', p1);

      // Scoped host.onError('/plugins/p2', ...) vs broken '/plugins/p2/*'
      app1.onError('/plugins/p2', (ctx) => {
        const msg = ctx.error instanceof Error ? ctx.error.message : String(ctx.error);
        return new Response(`scoped-p2-error:${msg}`, { status: 502 });
      });
      app1.onError('/plugins/p3/*', () => new Response('never-reached-wildcard', { status: 500 }));
      app1.route('/plugins/p2/fail', {
        handler: () => {
          throw new Error('p2 boom');
        },
      });
      app1.route('/plugins/p3/fail', {
        handler: () => {
          throw new Error('p3 boom');
        },
      });

      const h1 = app1.handler();
      const r503 = await h1(new Request('http://localhost/plugins/p1/fail-503'));
      const b503 = await r503.text();
      assertEquals(r503.status, 503);
      assertStringIncludes(b503, 'data-host-error="true"');
      assertStringIncludes(b503, 'upstream down');
      assertStringIncludes(b503, 'data-host-app="true"');
      assertStringIncludes(b503, 'data-host-root-layout="true"');
      assert(!b503.includes('data-persistent-shell="true"'));

      const rP2 = await h1(new Request('http://localhost/plugins/p2/fail'));
      assertEquals(rP2.status, 502);
      assertEquals(await rP2.text(), 'scoped-p2-error:p2 boom');

      // '/plugins/p3/*' failed to match '/plugins/p3/fail' due to patternToSegments('*') -> fell back to root _error!
      const rP3 = await h1(new Request('http://localhost/plugins/p3/fail'));
      assertEquals(rP3.status, 500);
      assertStringIncludes(await rP3.text(), 'data-host-error="true"');

      // 2) Host shell throw: nested /plugins _layout throw is caught by root _error; root _app throw cascades to 500 unless errorRoute sets skipAppWrapper+skipInheritedLayouts!
      const appBrokenNestedLayout = new App<ProbeState>();
      attachHostFsRoutes(appBrokenNestedLayout, {
        appWrapper: hostAppWrapperMod.HostAppWrapper,
        rootLayout: hostLayoutsMod.HostRootLayout,
        pluginsLayout: hostLayoutsMod.ThrowingLayout,
        errorPage: { component: hostFallbacksMod.HostErrorPage },
      });
      appBrokenNestedLayout.fsRoutes();
      appBrokenNestedLayout.route('/plugins/p1/ok', {
        component: () => h('div', null, 'unreachable'),
      });
      const rBrokenNested = await appBrokenNestedLayout.handler()(
        new Request('http://localhost/plugins/p1/ok'),
      );
      const bBrokenNested = await rBrokenNested.text();
      assertEquals(rBrokenNested.status, 500);
      assertStringIncludes(bBrokenNested, 'data-host-error="true"');
      assertStringIncludes(bBrokenNested, 'host _layout blew up');

      // Root _app throwing WITHOUT skipAppWrapper on _error -> double throw -> DEFAULT_ERROR_HANDLER
      const appBrokenRootAppCascade = new App<ProbeState>();
      attachHostFsRoutes(appBrokenRootAppCascade, {
        appWrapper: hostAppWrapperMod.ThrowingHostAppWrapper,
        errorPage: { component: hostFallbacksMod.HostErrorPage },
      });
      appBrokenRootAppCascade.fsRoutes();
      appBrokenRootAppCascade.route('/plugins/p1/ok', {
        component: () => h('div', null, 'unreachable'),
      });
      const rCascade = await appBrokenRootAppCascade.handler()(
        new Request('http://localhost/plugins/p1/ok'),
      );
      assertEquals(rCascade.status, 500);
      assertEquals(await rCascade.text(), 'Internal server error');

      // Root _app throwing WITH skipAppWrapper+skipInheritedLayouts on _error -> renders isolated error page cleanly!
      const appBrokenRootAppIsolated = new App<ProbeState>();
      attachHostFsRoutes(appBrokenRootAppIsolated, {
        appWrapper: hostAppWrapperMod.ThrowingHostAppWrapper,
        errorPage: {
          component: hostFallbacksMod.IsolatedHostErrorPage,
          config: hostFallbacksMod.isolatedErrorConfig,
        },
      });
      appBrokenRootAppIsolated.fsRoutes();
      appBrokenRootAppIsolated.route('/plugins/p1/ok', {
        component: () => h('div', null, 'unreachable'),
      });
      const rIsolated = await appBrokenRootAppIsolated.handler()(
        new Request('http://localhost/plugins/p1/ok'),
      );
      const bIsolated = await rIsolated.text();
      assertEquals(rIsolated.status, 500);
      assertStringIncludes(bIsolated, 'data-isolated-host-error="true"');
      assertStringIncludes(bIsolated, 'host _app blew up');

      return 'Root onError catches plugin errors (popping /plugins layout); scoped onError("/plugins/p2") isolates per-plugin; onError("/plugins/p3/*") misses due to patternToSegments; _error needs skipAppWrapper+skipInheritedLayouts to survive root _app/_layout throws.';
    },
  );

  await runCase(
    'P4e',
    'P4',
    'Confirm exact Fresh 2.3.3 + preact-render-to-string SSR containment contract',
    () => {
      const contract = {
        freshCoreVersion: '2.3.3',
        preactRenderToStringVersion: '6.8.0',
        freshEnablesPreactErrorBoundaries: false,
        preactOptionsErrorBoundariesDefault: (preactOptions as { errorBoundaries?: unknown })
          .errorBoundaries,
        freshCtxRenderUsesSyncRenderToString: true,
        syncRenderThrowContainedByErrorBoundary: false,
        asyncChildComponentAwaitedByCtxRender: false,
        topLevelAsyncComponentAwaitedByFresh: true,
        hostPreRenderDataTryCatchContainment: true,
      };
      assertEquals(contract.preactOptionsErrorBoundariesDefault, undefined);
      return JSON.stringify(contract);
    },
  );

  // ---------------------------------------------------------------------------
  // Summary Matrix
  // ---------------------------------------------------------------------------
  console.log('\n=== PROBE A SUMMARY MATRIX ===');
  for (const row of results) {
    console.log(`${row.status.padEnd(4)} | ${row.id.padEnd(10)} | ${row.name} :: ${row.detail}`);
  }

  const failed = results.filter((r) => r.status === 'FAIL');
  console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
