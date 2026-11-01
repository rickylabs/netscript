import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderTemplate } from '../../../adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';

const variables = {
  name: 'fixture',
  appName: 'portal',
  serviceName: 'members',
  serviceQueryModule: '../routes/examples/members/(_lib)/service-query.ts',
};
const moduleUrl = (source: string) => `data:application/typescript,${encodeURIComponent(source)}`;

/** Evaluate the emitted capability logic with only filesystem discovery and live I/O replaced. */
async function capabilityFixture(root: string, app: string) {
  const contract = moduleUrl(
    renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract), variables),
  );
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldCapabilities),
    variables,
  )
    .replace(
      "import { findWorkspaceRoot } from '@netscript/config';",
      `const findWorkspaceRoot = () => Promise.resolve(${JSON.stringify(root)});`,
    )
    .replace(
      "import { probeScaffoldPlugin } from './scaffold-plugin-capabilities.ts';",
      "const probeScaffoldPlugin = async (_id: string, name: string) => ({state: 'ready' as const, description: name});",
    )
    .replaceAll('Deno.cwd()', JSON.stringify(app))
    .replace("'./scaffold-contract.ts'", JSON.stringify(contract))
    .replace("'zod'", JSON.stringify(import.meta.resolve('zod')));
  return await import(moduleUrl(source));
}

Deno.test('request-time topology follows service add and renamed plugin metadata in a custom app directory', async () => {
  const root = await Deno.makeTempDir();
  const app = `${root}/custom/portal`;
  await Deno.mkdir(app, { recursive: true });
  const module = await capabilityFixture(root, app);
  const settings = {
    NetScript: {
      Services: {} as Record<string, object>,
      Plugins: {} as Record<string, object>,
      Apps: { portal: { PluginReferences: [] as string[] } },
    },
  };
  const writeSettings = () =>
    Deno.writeTextFile(`${root}/appsettings.json`, JSON.stringify(settings));
  try {
    await writeSettings();
    assertEquals(
      (await module.readScaffoldCapabilities()).map((entry: { state: string }) => entry.state),
      ['absent', 'absent', 'absent', 'absent', 'absent'],
    );
    settings.NetScript.Services.members = { Enabled: true };
    await writeSettings();
    assertEquals((await module.readScaffoldCapabilities())[0].state, 'installed-unwired');
    assertStringIncludes((await module.readScaffoldCapabilities())[0].command, '--client members');
    assertEquals(
      (await module.readScaffoldCapabilities(undefined, {
        state: 'ready',
        message: 'Live records',
        rows: [],
      }))[0].state,
      'ready',
    );
    await Deno.mkdir(`${root}/plugins/renamed`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/plugins/renamed/scaffold.plugin.json`,
      JSON.stringify({
        linking: {
          canonicalName: 'auth',
          resourceConfigKey: 'identity',
          consumers: { apps: ['portal'] },
        },
      }),
    );
    settings.NetScript.Plugins.identity = { Enabled: true };
    await writeSettings();
    assertEquals((await module.readScaffoldCapabilities())[1].state, 'installed-unwired');
    await Deno.mkdir(`${app}/routes/auth`, { recursive: true });
    await Deno.writeTextFile(`${app}/routes/auth/[action].ts`, '');
    assertEquals((await module.readScaffoldCapabilities())[1].state, 'installed-unwired');
    settings.NetScript.Apps.portal.PluginReferences = ['identity'];
    await writeSettings();
    assertEquals((await module.readScaffoldCapabilities())[1].state, 'ready');
    settings.NetScript.Plugins.identity = { Enabled: false };
    await writeSettings();
    assertEquals((await module.readScaffoldCapabilities())[1].state, 'absent');
    await Deno.writeTextFile(
      `${root}/plugins/renamed/scaffold.plugin.json`,
      JSON.stringify({
        linking: {
          canonicalName: 'workers',
          resourceConfigKey: 'queue-api',
          consumers: { apps: ['portal'] },
        },
      }),
    );
    settings.NetScript.Plugins['queue-api'] = { Enabled: true };
    settings.NetScript.Apps.portal.PluginReferences = ['queue-api'];
    await writeSettings();
    const workers = (await module.readScaffoldCapabilities())[2];
    assertEquals(workers.state, 'ready');
    assertEquals(workers.description, 'queue-api');
    await Deno.writeTextFile(
      `${root}/plugins/renamed/scaffold.plugin.json`,
      JSON.stringify({
        linking: {
          canonicalName: 'workers',
          resourceConfigKey: 'queue-api',
          consumers: { apps: ['another-app'] },
        },
      }),
    );
    assertEquals((await module.readScaffoldCapabilities())[2].state, 'installed-unwired');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('memory detail pagination distinguishes found, missing and exhausted lookup budget', async () => {
  const contextUrl = moduleUrl(
    `let client: unknown; export function setClient(next: unknown) { client = next; } export const scaffoldServiceClient = async () => ({client, context: {}}); export const scaffoldReadFailure = () => ({state:'unavailable',rows:[],message:'Unavailable'});`,
  );
  const context = await import(contextUrl);
  const contract = moduleUrl(
    renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract), variables),
  );
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldRecordsMemory),
    variables,
  )
    .replace(
      /^import .* from '\.\.\/routes\/examples\/members\/\(_lib\)\/service-query.ts';/m,
      "const contract = {}; const serviceName = 'members'; const routerName = 'members';",
    )
    .replace("'./scaffold-service-context.ts'", JSON.stringify(contextUrl))
    .replace("'./scaffold-contract.ts'", JSON.stringify(contract));
  const module = await import(moduleUrl(source));
  const row = {
    id: 26,
    name: 'Actual record',
    summary: 'From typed fixture',
    status: 'paid',
    reference: 'REC-26',
    ownerName: 'Test Owner',
    ownerEmail: 'test@example.com',
    amount: 12500,
    currency: 'USD',
    updatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  };
  const calls: number[] = [];
  context.setClient({
    list: ({ offset }: { offset: number }) => {
      calls.push(offset);
      return Promise.resolve({ items: offset ? [row] : [], total: 26, hasMore: offset === 0 });
    },
  });
  const request = new Request('https://app.example/records/26');
  assertEquals((await module.loadScaffoldRecord(request, '26')).record.name, 'Actual record');
  assertEquals(calls, [0, 25]);
  assertEquals((await module.loadScaffoldRecord(request, '999')).notFound, true);
  calls.length = 0;
  context.setClient({
    list: ({ offset }: { offset: number }) => {
      calls.push(offset);
      return Promise.resolve({ items: [], total: 1000, hasMore: true });
    },
  });
  const exhausted = await module.loadScaffoldRecord(request, '999');
  assertEquals(exhausted.state, 'unavailable');
  assertEquals(exhausted.notFound, undefined);
  assertEquals(calls.length, 20);
  context.setClient({ list: () => Promise.resolve({ items: [], total: 0, hasMore: false }) });
  assertEquals((await module.loadScaffoldRecords(request)).state, 'empty');
  context.setClient({ list: () => Promise.reject(new Error('private error')) });
  assertEquals((await module.loadScaffoldRecords(request)).state, 'unavailable');
});

Deno.test('service failures distinguish access denial and never expose raw error messages', async () => {
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldServiceContext),
    variables,
  )
    .replace(
      /^import .* from '@netscript\/sdk\/client';/m,
      'const createServiceClient = () => ({});',
    )
    .replace("import.meta.glob<BrowserAuth>('../../../auth/bff.ts')", '{}');
  const module = await import(moduleUrl(source));
  const originalError = console.error;
  console.error = () => {};
  try {
    for (const status of [401, 403, 503]) {
      const result = module.scaffoldReadFailure(
        Object.assign(new Error('private-secret-path'), { status }),
      );
      assertEquals(result.state, status === 503 ? 'unavailable' : 'unauthorized');
      assertEquals(JSON.stringify(result).includes('private-secret-path'), false);
    }
  } finally {
    console.error = originalError;
  }
});

Deno.test('plugin projections read real result shapes and reject false stream readiness', async () => {
  const contextUrl = moduleUrl(
    `let jobs: unknown[] = []; let options: unknown; export function readOptions() { return options; } export function setJobs(next: unknown[]) { jobs = next; } export const scaffoldServiceClient = async (...args: unknown[]) => { options = args[4]; return {client: {listJobs: async () => ({jobs,total:jobs.length}), listExecutions: async () => ({executions:[{status:'running',progressPercent:37,progressMessage:'Processing records',triggeredAt:'2026-11-01T00:00:00Z'}]})},context:{}}; };`,
  );
  const context = await import(contextUrl);
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldPluginCapabilities),
    variables,
  )
    .replace(
      "import { getServiceUrl } from '@netscript/sdk/discovery';",
      "const getServiceUrl = () => 'https://streams.example';",
    )
    .replace(
      "import { workersContract } from '@netscript/plugin-workers-core/contracts/v1';",
      'const workersContract = {};',
    )
    .replace("'./scaffold-service-context.ts'", JSON.stringify(contextUrl))
    .replace("'zod'", JSON.stringify(import.meta.resolve('zod')))
    .replace(
      "import.meta.glob<AiModels>('../../../ai/models.ts')",
      "{models: async () => ({AI_MODELS: {chat: 'configured:model'}})}",
    )
    .replace("import.meta.glob<AiRuntime>('../../../ai/ai.ts')", '{runtime: async () => ({})}');
  const module = await import(moduleUrl(source));
  assertEquals((await module.probeScaffoldPlugin('workers', 'queue-api')).state, 'empty');
  assertEquals(context.readOptions(), { unmarked: 'optional' });
  context.setJobs([{ id: 'job-one', name: 'Configured job' }]);
  const workers = await module.probeScaffoldPlugin('workers', 'queue-api');
  assertEquals(workers.state, 'ready');
  assertEquals(workers.items, [{
    label: 'Configured job',
    detail: 'Processing records',
    state: 'running',
    progress: 37,
    timestamp: '2026-11-01T00:00:00Z',
  }]);
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  console.error = () => {};
  try {
    globalThis.fetch = (input) =>
      Promise.resolve(
        Response.json(
          String(input).includes('/health/ready') ? { ready: true } : [{
            type: 'execution',
            key: 'real-event',
            headers: { operation: 'upsert' },
            value: {
              jobId: 'job-one',
              status: 'running',
              progressMessage: 'Processing records',
              triggeredAt: '2026-11-01T00:00:00Z',
            },
          }],
          { headers: { 'Stream-Next-Offset': 'opaque-1', 'Stream-Up-To-Date': 'true' } },
        ),
      );
    const streams = await module.probeScaffoldPlugin('streams', 'events');
    assertEquals(streams.state, 'ready');
    assertEquals(streams.items[0], {
      label: 'job-one',
      detail: 'Processing records',
      state: 'running',
      timestamp: '2026-11-01T00:00:00Z',
    });
    const offsets: string[] = [];
    globalThis.fetch = (input, init) => {
      if (String(input).includes('/health/ready')) {
        return Promise.resolve(Response.json({ ready: true }));
      }
      assertEquals(new Headers(init?.headers).has('Authorization'), false);
      offsets.push(new URL(String(input)).searchParams.get('offset')!);
      return Promise.resolve(
        Response.json([], { headers: { 'Stream-Next-Offset': `batch-${offsets.length}` } }),
      );
    };
    const catchingUp = await module.probeScaffoldPlugin('streams', 'events');
    assertEquals(offsets, ['opaque-1', 'batch-1', 'batch-2']);
    assertStringIncludes(catchingUp.description, 'Catching up');
    let headRead = false;
    globalThis.fetch = (input, init) => {
      if (String(input).includes('/health/ready')) {
        return Promise.resolve(Response.json({ ready: true }));
      }
      if (init?.method === 'HEAD') {
        headRead = true;
        return Promise.resolve(
          new Response(null, { headers: { 'Stream-Next-Offset': 'current-head' } }),
        );
      }
      return Promise.resolve(
        Response.json([{
          type: 'execution',
          key: 'large',
          headers: { operation: 'upsert' },
          value: { progressMessage: 'x'.repeat(1024 * 1024) },
        }], { headers: { 'Stream-Next-Offset': 'huge-batch', 'Stream-Up-To-Date': 'true' } }),
      );
    };
    const bounded = await module.probeScaffoldPlugin('streams', 'events');
    assertEquals(bounded.state, 'empty');
    assertEquals(headRead, true);
    assertStringIncludes(bounded.description, 'preview budget');
    globalThis.fetch = (input) => {
      if (String(input).includes('/health/ready')) {
        return Promise.resolve(Response.json({ ready: true }));
      }
      assertEquals(new URL(String(input)).searchParams.get('offset'), 'current-head');
      return Promise.resolve(
        Response.json([{
          type: 'execution',
          key: 'new-event',
          headers: { operation: 'upsert' },
          value: { jobId: 'new-job', status: 'completed' },
        }], { headers: { 'Stream-Next-Offset': 'after-head', 'Stream-Up-To-Date': 'true' } }),
      );
    };
    const resumed = await module.probeScaffoldPlugin('streams', 'events');
    assertEquals(resumed.items[0].label, 'new-job');
    assertEquals(resumed.items.length, 1);
    assertStringIncludes(resumed.description, 'skipped earlier history');
    for (const status of [400, 410]) {
      const resetOffsets: string[] = [];
      globalThis.fetch = (input) => {
        if (String(input).includes('/health/ready')) {
          return Promise.resolve(Response.json({ ready: true }));
        }
        const offset = new URL(String(input)).searchParams.get('offset')!;
        resetOffsets.push(offset);
        return Promise.resolve(
          offset === '-1'
            ? Response.json([{
              type: 'execution',
              key: 'after-reset',
              headers: { operation: 'upsert' },
              value: { jobId: 'recovered-job' },
            }], {
              headers: { 'Stream-Next-Offset': 'recovered-head', 'Stream-Up-To-Date': 'true' },
            })
            : new Response(null, { status }),
        );
      };
      const recovered = await module.probeScaffoldPlugin('streams', 'events');
      assertEquals(resetOffsets.length, 2);
      assertEquals(resetOffsets[1], '-1');
      assertEquals(recovered.state, 'ready');
      assertEquals(recovered.items.length, 1);
      assertEquals(recovered.items[0].label, 'recovered-job');
    }
    for (const status of [401, 403]) {
      let calls = 0;
      globalThis.fetch = (input) => {
        if (String(input).includes('/health/ready')) {
          return Promise.resolve(Response.json({ ready: true }));
        }
        calls++;
        return Promise.resolve(new Response(null, { status }));
      };
      const denied = await module.probeScaffoldPlugin('streams', 'events');
      assertEquals(denied.state, 'unauthorized');
      assertEquals(denied.items, undefined);
      assertEquals(calls, 1);
    }
    globalThis.fetch = () => Promise.resolve(Response.json({ ready: false }));
    assertEquals((await module.probeScaffoldPlugin('streams', 'events')).state, 'unavailable');
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 401 }));
    assertEquals((await module.probeScaffoldPlugin('streams', 'events')).state, 'unauthorized');
    const ai = await module.probeScaffoldPlugin('ai', 'ai');
    assertEquals(ai.state, 'empty');
    assertEquals(ai.items, [{ label: 'chat', detail: 'configured:model' }]);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

Deno.test('service context forwards an explicit public-plugin fallback without changing guarded defaults', async () => {
  const authUrl = moduleUrl(`
let options: unknown;
export const readOptions = () => options;
export const createBrowserSessionClient = (_contract: unknown, _name: string, _router: string, next: unknown) => { options = next; return {}; };
export const browserSessionContext = (request: Request) => ({ signal: request.signal });
`);
  const source = renderTemplate(
    readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldServiceContext),
    variables,
  )
    .replace(
      /^import .* from '@netscript\/sdk\/client';/m,
      'const createServiceClient = () => ({});',
    )
    .replace(
      "import.meta.glob<BrowserAuth>('../../../auth/bff.ts')",
      `{ auth: () => import(${JSON.stringify(authUrl)}) }`,
    );
  const module = await import(moduleUrl(source));
  const auth = await import(authUrl);
  const request = new Request('https://app.example.test/');
  await module.scaffoldServiceClient({}, 'workers-api', 'workers', request, {
    unmarked: 'optional',
  });
  assertEquals(auth.readOptions(), { unmarked: 'optional' });
  await module.scaffoldServiceClient({}, 'users', 'users', request);
  assertEquals(auth.readOptions(), {});
});
