import { assert, assertEquals } from '@std/assert';
import { renderTemplate } from '../../../adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';

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
