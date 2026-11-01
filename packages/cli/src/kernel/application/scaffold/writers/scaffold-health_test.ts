import { assert, assertEquals } from '@std/assert';
import { renderTemplate } from '../../../adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';

Deno.test('emitted no-Accept liveness renders without dependency calls; explicit status requests probe', async () => {
  const root = await Deno.makeTempDir();
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  try {
    await Deno.writeTextFile(
      `${root}/appsettings.json`,
      JSON.stringify({
        NetScript: { Services: { records: {} }, BackgroundProcessors: { workers: {} } },
      }),
    );
    const moduleUrl = (source: string) =>
      'data:application/typescript,' + encodeURIComponent(source);
    const shared = renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appRoutesSharedHealth), {
      appName: 'web',
    })
      .replace(
        "import { findWorkspaceRoot } from '@netscript/config';",
        `export let topologyReads = 0; const findWorkspaceRoot = async () => { topologyReads++; return ${
          JSON.stringify(root)
        }; };`,
      )
      .replace(
        "import { getServiceUrl } from '@netscript/sdk/discovery';",
        "const getServiceUrl = (name: string) => 'https://' + name + '.example';",
      )
      .replace(
        "import { readScaffoldPluginIdentities } from '../../lib/scaffold-capabilities.ts';",
        'const readScaffoldPluginIdentities = async () => new Map();',
      )
      .replace("'zod'", JSON.stringify(import.meta.resolve('zod')));
    const helper = await import(moduleUrl(shared));
    const route = renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appRoutesHealth), {
      name: 'fixture',
      appName: 'web',
    })
      .replace(
        "import HealthView from './(_components)/health-view.tsx';",
        'const HealthView = () => null;',
      )
      .replace("'./(_shared)/health.ts'", JSON.stringify(moduleUrl(shared)))
      .replace("import { appRoutes } from '@app/router.ts';", 'const appRoutes = {health: {}};')
      .replace(
        "import { definePage } from '@app/utils.ts';",
        `
        function definePage() {
          return {
            get: undefined, load: undefined,
            withRoute() { return this; }, withMeta() { return this; }, withLayout() { return this; },
            withLayer(_key, _view, load) { this.load = load; return this; },
            withHandler(_method, get) { this.get = get; return this; },
            build() { return {handler: {GET: this.get}, loader: this.load}; },
          };
        }
      `,
      );
    const module = await import(moduleUrl(route));
    globalThis.fetch = (input) => {
      requests.push(String(input));
      return Promise.resolve(
        Response.json({ state: 'ready', registryReady: true, dependencyReady: true }),
      );
    };
    for (const accept of [undefined, '*/*']) {
      const req = new Request('https://app.example/health', { headers: accept ? { accept } : {} });
      const result = await module.handler.GET({ req });
      assert(
        !(result instanceof Response),
        'liveness must still enter SSR to catch render failures',
      );
      assertEquals(requests, [], 'liveness must not call any dependency');
      assertEquals(helper.topologyReads, 0, 'liveness must not discover workspace topology');
      const data = await module.healthPage.loader({ req, data: result.data });
      assertEquals(data.payload.resources, [{
        name: 'web',
        kind: 'Web',
        state: 'healthy',
        latencyMs: 0,
      }]);
      await module.healthPage.loader({ req });
      assertEquals(requests, [], 'the SSR fallback must also remain local');
    }
    for (const accept of ['text/html', 'application/json', 'text/html, application/json']) {
      requests.length = 0;
      const req = new Request('https://app.example/health', { headers: { accept } });
      const result = await module.handler.GET({ req });
      const payload = result instanceof Response ? await result.json() : result.data.payload;
      assertEquals(result instanceof Response, accept === 'application/json');
      assertEquals(payload.resources.length, 3);
      assertEquals(requests.length, 2);
      if (!(result instanceof Response)) await module.healthPage.loader({ req, data: result.data });
      assertEquals(requests.length, 2, 'SSR must reuse the handler status result');
    }
  } finally {
    globalThis.fetch = originalFetch;
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('emitted health probes distinguish HTTP success, false readiness, denied access and disabled resources', async () => {
  const root = await Deno.makeTempDir();
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  try {
    await Deno.writeTextFile(
      `${root}/appsettings.json`,
      JSON.stringify({
        NetScript: {
          Services: { records: {}, falseReady: {}, denied: {}, unlinked: {} },
          Plugins: { events: {}, disabled: { Enabled: false } },
          BackgroundProcessors: { workers: {}, missingFlags: {}, falseFlags: {} },
        },
      }),
    );
    const source = renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appRoutesSharedHealth), {
      appName: 'web',
    })
      .replace(
        "import { findWorkspaceRoot } from '@netscript/config';",
        `const findWorkspaceRoot = () => Promise.resolve(${JSON.stringify(root)});`,
      )
      .replace(
        "import { getServiceUrl } from '@netscript/sdk/discovery';",
        "const getServiceUrl = (name: string) => { if (name === 'unlinked') throw new Error('Not discovered'); return 'https://' + name.toLowerCase() + '.example'; };",
      )
      .replace(
        "import { readScaffoldPluginIdentities } from '../../lib/scaffold-capabilities.ts';",
        "const readScaffoldPluginIdentities = async () => new Map([['streams', {name: 'events'}]]);",
      )
      .replace("'zod'", JSON.stringify(import.meta.resolve('zod')));
    const module = await import('data:application/typescript,' + encodeURIComponent(source));
    globalThis.fetch = (input) => {
      const url = String(input);
      requests.push(url);
      return Promise.resolve(
        url.includes('denied') ? new Response(null, { status: 401 }) : Response.json(
          url.includes('falseready')
            ? { status: 'healthy', ready: false }
            : url.includes('events')
            ? { ready: !url.endsWith('/health/ready'), status: 'healthy' }
            : url.includes('missingflags')
            ? { state: 'ready' }
            : url.includes('falseflags')
            ? { state: 'ready', registryReady: false, dependencyReady: false }
            : url.includes('workers')
            ? { state: 'ready', registryReady: true, dependencyReady: true }
            : { status: 'healthy' },
        ),
      );
    };
    const payload = await module.buildPayload('web');
    assertEquals(payload.status, 'degraded');
    assertEquals(payload.resources.map((item: { state: string }) => item.state), [
      'healthy',
      'healthy',
      'unavailable',
      'unauthorized',
      'unwired',
      'unavailable',
      'disabled',
      'healthy',
      'unavailable',
      'unavailable',
    ]);
    assertEquals(requests.length, 7);
    assert(requests.includes('https://events.example/health/ready'));
    assert(!JSON.stringify(payload).includes('https://'));
    assert(
      payload.resources.slice(0, 4).every((item: { latencyMs: number }) => item.latencyMs >= 0),
    );
    await Deno.writeTextFile(`${root}/appsettings.json`, 'invalid');
    assertEquals((await module.buildPayload()).resources[1].state, 'unavailable');
  } finally {
    globalThis.fetch = originalFetch;
    await Deno.remove(root, { recursive: true });
  }
});
