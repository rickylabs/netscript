/** Host policy, native SDK/discovery and compatibility over the real workers listener. @module */
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createRuntimeSandbox } from '../../../streams/services/src/tests/test_utils/service-runtime-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const MARKER = 'workers host policy: native calls and cleanup complete';
const SYNTHETIC_SECRET = 'host-policy-fixture-material-00000000';

Deno.test({
  name: 'workers host policy preserves SDK credential owners, discovery, projections, CORS and SSE',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createRuntimeSandbox('worker-host');
    const upstream = choosePort();
    const run = await sandbox.run(source(sandbox.scratch, upstream), {
      cwd: PLUGIN_ROOT,
      preferredPorts: [upstream],
      unstableKv: true,
    });
    assertEquals(run.code, 0, run.stderr + run.stdout);
    assertStringIncludes(run.stdout, MARKER);
    assert(!run.stdout.includes(SYNTHETIC_SECRET), 'secret material must not enter logs');
    assert(!run.stderr.includes(SYNTHETIC_SECRET), 'secret material must not enter errors');
  },
});

/** The checked child uses only public package entrypoints and owns its KV and listeners. */
function choosePort(): number {
  using listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  return listener.addr.port;
}

/** The dependency and producer remain explicitly host-owned during worker shutdown. */
function source(scratch: string, upstream: number): string {
  return `import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { closeKv, getRawKv } from '@netscript/kv';
import { workersContract } from '@netscript/plugin-workers/contracts';
import createLegacyWorkersService from '@netscript/plugin-workers/services';
import { workersStreamSchema } from '@netscript/plugin-workers/streams';
import { buildStreamUrl, createDurableStream } from '@netscript/plugin-streams-core';
import { startStreamsService } from '@netscript/plugin-streams/service';
import { startWorkersService, type PluginServiceContext, type RunningService } from '@netscript/plugin-workers/service';
import {
  createCompositeAuthenticator, createInstallationSecret, createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator, deriveInternalCredential,
} from '@netscript/service/auth';
import {
  createInternalCredentialSdkClientContribution, createServiceClient,
  defineSdkClientContribution, SdkClientContributionError,
} from '@netscript/sdk/client';
import { getServiceUrl } from '@netscript/sdk/discovery';

const scratch = ${JSON.stringify(scratch)};
const material = ${JSON.stringify(SYNTHETIC_SECRET)};
const serviceName = 'workers';
const discoveryKey = 'services__workers__http__0';
const allowedOrigin = 'https://host.example';
const handles: RunningService[] = [];
const failures: unknown[] = [];
let dependency: RunningService | undefined;
let stopProducer: (() => Promise<void>) | undefined;
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('workers must not resolve the opaque host DB')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'host-default-must-not-win' },
};
try {
  Deno.chdir(scratch);
  const kv = await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
  Deno.env.set('PORT', 'process-default-must-not-win');
  Deno.env.set('NETSCRIPT_CORS_ORIGINS', allowedOrigin);
  Deno.env.set('STREAMS_INTERNAL_PORT', String(${upstream}));
  dependency = await startStreamsService({
    auth: { public: true, reason: 'Host-owned streams dependency for the workers fixture' },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false },
  });
  const streamsOrigin = 'http://127.0.0.1:' + dependency.addr.port;
  Deno.env.set('DURABLE_STREAMS_URL', streamsOrigin);
  const producer = createDurableStream({
    streamPath: '/workers/executions', schema: workersStreamSchema, producerId: 'workers-service',
  });
  stopProducer = () => producer.stop();
  await producer.waitUntilReady();
  const secret = await createInstallationSecret(material);
  const authenticator = createCompositeAuthenticator([
    createInternalCredentialAuthenticator({ secret, service: serviceName }),
    createStaticCredentialAuthenticator({
      credentials: { 'host-token': { subject: 'host', scopes: [], roles: [] } },
    }),
  ]);
  const running = await startWorkersService(context, {
    auth: { authn: { authenticator } },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false },
  });
  handles.push(running);
  assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
  assert(running.addr.port > 0);
  const origin = 'http://127.0.0.1:' + running.addr.port;
  Deno.env.set(discoveryKey, origin);
  assertEquals(getServiceUrl(serviceName), origin);
  const contribution = createInternalCredentialSdkClientContribution({ secret, service: serviceName });
  const client = createServiceClient({
    contract: workersContract, serviceName, contributions: [contribution] as const,
  });
  const description = await client.describe({});
  assert(description.capabilities.includes('background-processor'));
  const jobs = (await client.listJobs({ limit: 10, offset: 0 })).jobs;
  assert(jobs.length > 0, 'plugin-owned runtime context is present');
  await producer.flush();
  const published = await fetch(buildStreamUrl('/workers/executions', streamsOrigin) + '?offset=-1');
  assertEquals(published.status, 200);
  assert((await published.text()).includes(jobs[0].id), 'registered jobs reach the native streams dependency');
  const host = defineSdkClientContribution()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'host:existing-credential', context: {}, headerKeys: ['authorization'],
    responseCache: { mode: 'direct-only' },
    prepare: () => ({ headers: { authorization: 'Bearer host-token' } }),
  });
  const hostClient = createServiceClient({
    contract: workersContract, serviceName, contributions: [host] as const,
  });
  assertEquals((await hostClient.describe({})).pluginName, description.pluginName);
  const collision = assertThrows(() => Reflect.apply(createServiceClient, undefined, [{
    contract: workersContract, serviceName, contributions: [host, contribution],
  }]), SdkClientContributionError);
  assertEquals(collision.code, 'SDK_CONTRIBUTION_CONFLICT');
  assertEquals((await hostClient.describe({})).pluginName, description.pluginName);
  const wrongTarget = createServiceClient({
    contract: workersContract, serviceName,
    contributions: [createInternalCredentialSdkClientContribution({ secret, service: 'streams' })] as const,
  });
  assertEquals(Reflect.get(await assertRejects(() => wrongTarget.describe({}), Error), 'status'), 401);
  const bearer = await deriveInternalCredential(secret, serviceName);
  const authorization = 'Bearer ' + bearer;
  async function request(path: string, headers: HeadersInit = {}, method = 'GET') {
    const response = await fetch(origin + path, { method, headers });
    const body = await response.text();
    assert(!body.includes(material) && !body.includes(bearer), 'contract payload excludes credentials');
    return { response, body };
  }
  for (const path of ['/api/v1/workers/describe', '/api/rpc/v1/workers/describe', '/api/rpc/v1/describe']) {
    assertEquals((await request(path)).response.status, 401, path);
    assertEquals((await request(path, { authorization })).response.status, 200, path);
  }
  for (const path of ['/', '/health', '/health/live', '/health/ready']) {
    assertEquals((await request(path)).response.status, 200, path);
  }
  assertEquals((await request('/api/openapi.json')).response.status, 401);
  const legacy = await createLegacyWorkersService({ ...context, env: { PORT: '0' } });
  handles.push(legacy);
  const legacySpec = await fetch('http://127.0.0.1:' + legacy.addr.port + '/api/openapi.json');
  await legacySpec.text();
  // Main already returns500 for this router's OpenAPI document; startup must preserve parity.
  assertEquals((await request('/api/openapi.json', { authorization })).response.status, legacySpec.status);
  await legacy.stop();
  assertEquals((await hostClient.describe({})).pluginName, description.pluginName);
  assertEquals((await request('/api/docs', { authorization })).response.status, 404);
  assertEquals((await request('/missing')).response.status, 404);
  for (const candidate of [allowedOrigin, 'https://unrelated.example', 'https://host.example.evil', 'null', 'http://[']) {
    const { response } = await request('/api/v1/workers/describe', { authorization, origin: candidate });
    assertEquals(response.status, 200);
    assertEquals(response.headers.get('access-control-allow-origin'), candidate === allowedOrigin ? candidate : null);
  }
  const rejection = await request('/api/v1/workers/describe', { origin: allowedOrigin });
  assertEquals(rejection.response.status, 401);
  assertEquals(rejection.response.headers.get('access-control-allow-origin'), allowedOrigin);
  const preflight = await request('/api/v1/workers/describe', {
    origin: allowedOrigin, 'access-control-request-method': 'GET',
  }, 'OPTIONS');
  assertEquals(preflight.response.status, 204);
  assertEquals(preflight.response.headers.get('access-control-allow-origin'), allowedOrigin);
  const abort = new AbortController();
  const events = await fetch(origin + '/api/v1/workers/subscribe', { headers: { authorization }, signal: abort.signal });
  assertEquals(events.status, 200);
  assert(events.headers.get('content-type')?.includes('text/event-stream'));
  assert(events.body);
  const reader = events.body.getReader();
  try {
    const first = await reader.read();
    assert(!first.done && new TextDecoder().decode(first.value).includes('connected'));
    await reader.cancel();
  } finally {
    reader.releaseLock();
    abort.abort();
  }
  await running.stop();
  await running.stop();
  Deno.listen({ hostname: '127.0.0.1', port: running.addr.port }).close();
  await kv.set(['host-owned-after-stop'], 'usable');
  assertEquals((await kv.get<string>(['host-owned-after-stop']))?.value, 'usable');
  assert(!producer.closed, 'worker shutdown must not stop the host-owned stream producer');
} catch (error) {
  failures.push(error);
}
for (const handle of [...handles].reverse()) {
  try { await handle.stop(); } catch (error) { failures.push(error); }
}
try { await stopProducer?.(); } catch (error) { failures.push(error); }
try { await dependency?.stop(); } catch (error) { failures.push(error); }
try { await closeKv(); } catch (error) { failures.push(error); }
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures);
console.log(${JSON.stringify(MARKER)});
`;
}
