/** Live assertions for the opt-in KV-only consumer proof. @module */
import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { resourceUrlsFromDescribeOutput } from '../../src/application/gates/scaffold/generated-app-endpoint.ts';
import { probeBackgroundChildren } from '../../src/application/gates/scaffold/runtime/probe-background-children.ts';
import { command, isDatabaseEnvironment } from './scaffold.ts';
import { PROOF } from './definitions.ts';

/** Sanitized resource evidence suitable for public run records. */
export interface ResourceEvidence {
  readonly name: string;
  readonly state: string;
  readonly health: string;
}

/** Invoke Aspire only against this proof's exact AppHost. */
export function aspire(root: string, args: readonly string[]): Promise<string> {
  return command('aspire', [
    ...args,
    '--apphost',
    join(root, 'aspire/apphost.mts'),
    '--non-interactive',
    '--nologo',
  ], join(root, 'aspire'));
}

/** Narrow parsed JSON at an external boundary. */
export function record(value: unknown): Record<string, unknown> {
  assert(typeof value === 'object' && value !== null && !Array.isArray(value));
  return value as Record<string, unknown>;
}

/** Read Aspire's documented top-level resource array without retaining sensitive values. */
export function resources(output: string): Record<string, unknown>[] {
  const parsed = record(JSON.parse(output.slice(output.indexOf('{'))));
  assert(Array.isArray(parsed.resources));
  return parsed.resources.map(record);
}

/** Bounded application-effect convergence; a condition that never becomes true fails. */
export async function eventually<T>(probe: () => Promise<T | undefined>): Promise<T> {
  for (let attempt = 0; attempt < 90; attempt++) {
    const result = await probe();
    if (result !== undefined) return result;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('KV consumer effect did not converge');
}

/** Require every registered application resource healthy and every background child ready. */
export async function healthyResources(root: string): Promise<ResourceEvidence[]> {
  // BrowserLogs represents an on-demand browser session, not an application process.
  const applicationResources = (items: Record<string, unknown>[]) =>
    items.filter((item) => item.resourceType !== 'BrowserLogs');
  const initial = applicationResources(
    resources(await aspire(root, ['describe', '--format', 'Json'])),
  );
  for (const resource of initial) {
    const name = String(resource.displayName ?? resource.name);
    await aspire(root, ['wait', name, '--status', 'healthy', '--timeout', '180']);
  }
  const settled = applicationResources(
    resources(await aspire(root, ['describe', '--format', 'Json'])),
  );
  for (
    const name of [
      'workers-api',
      'sagas-api',
      'triggers-api',
      'auth',
      'streams',
      'workers',
      'sagas',
      'triggers',
    ]
  ) {
    assert(
      settled.some((resource) => resource.displayName === name),
      `Missing exact resource ${name}`,
    );
  }
  const evidence = settled.map((resource) => {
    assertEquals(resource.state, 'Running');
    assertEquals(resource.healthStatus, 'Healthy');
    const environment = record(resource.environment ?? {});
    assert(!Object.keys(environment).some(isDatabaseEnvironment));
    return {
      name: String(resource.displayName),
      state: String(resource.state),
      health: String(resource.healthStatus),
    };
  });
  await probeBackgroundChildren(join(root, 'aspire/apphost.mts'));
  const streams = await endpoint(root, 'streams');
  assertEquals((await request(streams, '/health/ready')).ready, true);
  return evidence;
}

async function endpoint(root: string, name: string): Promise<string> {
  const raw = await aspire(root, ['describe', '--format', 'Json']);
  const urls = resourceUrlsFromDescribeOutput(raw, name);
  assert(urls.length > 0, `No declared endpoint for ${name}`);
  return urls[0]!;
}

async function request(
  base: string,
  path: string,
  body?: unknown,
  allowMissing = false,
): Promise<Record<string, unknown>> {
  const response = await fetch(new URL(path, base), {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (allowMissing && response.status === 404) {
    await response.body?.cancel();
    return {};
  }
  assert(response.ok, `${path} HTTP ${response.status}: ${await response.clone().text()}`);
  return record(await response.json());
}

/** Prove stored worker completion, not merely queue acceptance. */
export async function completedJobs(base: string, minimum: number): Promise<number> {
  return await eventually(async () => {
    const body = await request(base, '/api/v1/workers/executions?limit=100');
    assert(Array.isArray(body.executions));
    const count = body.executions.map(record).filter((entry) =>
      entry.jobId === PROOF.job && entry.status === 'completed'
    ).length;
    return count >= minimum ? count : undefined;
  });
}

/** Exercise HTTP ingress and read the corresponding completed KV event and job records. */
export async function proveJobAndTrigger(
  root: string,
): Promise<{ completedJobs: number; triggerEventId: string }> {
  const workers = await endpoint(root, 'workers-api');
  await request(workers, `/api/v1/workers/jobs/${PROOF.job}/trigger`, { payload: {} });
  const before = await completedJobs(workers, 1);
  const triggers = await endpoint(root, 'triggers-api');
  const accepted = await request(triggers, '/api/v1/webhooks/kv-proof', { proof: 'kv-only' });
  assertEquals(accepted.accepted, true);
  assert(typeof accepted.eventId === 'string');
  await eventually(async () => {
    const body = await request(triggers, '/api/v1/events?limit=100');
    assert(Array.isArray(body.events));
    return body.events.map(record).some((entry) =>
        entry.id === accepted.eventId && entry.status === 'completed'
      )
      ? true
      : undefined;
  });
  return {
    completedJobs: await completedJobs(workers, before + 1),
    triggerEventId: accepted.eventId,
  };
}

/** Verify saga persistence and replay with an Aspire child, then the same generated runner directly. */
export async function proveSaga(
  root: string,
): Promise<{ count: number; version: number; detached: boolean }> {
  const base = await endpoint(root, 'sagas-api');
  const publish = async (type: string, key: string) => {
    const result = await request(base, '/api/v1/sagas/publish', {
      type,
      payload: {},
      correlationId: PROOF.correlation,
      idempotencyKey: key,
    });
    assertEquals(result.published, true);
  };
  const instance = async (expected: number) =>
    await eventually(async () => {
      const body = await request(
        base,
        `/api/v1/sagas/instances/${PROOF.saga}/${PROOF.correlation}`,
        undefined,
        true,
      );
      return body.state && record(body.state).count === expected ? body : undefined;
    });
  await publish('KvProofStarted', 'kv-proof-start');
  await instance(1);
  const raw = await aspire(root, ['describe', '--format', 'Json']);
  const saga = resources(raw).find((resource) => resource.displayName === 'sagas');
  assert(saga);
  const environment = record(saga.environment);
  // Borrow only KV settings; the direct process has no Aspire or database bootstrap environment.
  const env: Record<string, string> = {
    NETSCRIPT_PROJECT_ROOT: root,
    NETSCRIPT_SAGA_STORE: 'kv',
    NETSCRIPT_SAGA_PROJECTION: 'kv',
    PORT: '0',
  };
  for (const [name, value] of Object.entries(environment)) {
    if (
      /^(CACHE_PROVIDER|REDIS_URI|GARNET_URI|DENO_KV_|KV_URL|ConnectionStrings__(garnet|redis)|services__(garnet|redis|kv)__)/
        .test(name) && typeof value === 'string'
    ) env[name] = value;
  }
  assert(
    Object.keys(env).some((name) => /URI|URL|ConnectionStrings|services__/.test(name)),
    'No live KV binding for detached runner',
  );
  await aspire(root, ['resource', 'sagas', 'stop']);
  const stopped = resources(await aspire(root, ['describe', '--format', 'Json'])).find((resource) =>
    resource.displayName === 'sagas'
  );
  assert(stopped && stopped.state !== 'Running', 'Aspire saga runner must be stopped');
  const proofDir = join(root, '.netscript/e2e');
  await Deno.mkdir(proofDir, { recursive: true });
  const readyFile = join(proofDir, 'detached-ready.json');
  await Deno.remove(readyFile).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });
  await Deno.copyFile(
    new URL('./detached.ts.template', import.meta.url),
    join(proofDir, 'detached.ts'),
  );
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--unstable-kv', '-A', '.netscript/e2e/detached.ts'],
    cwd: root,
    clearEnv: true,
    env: { PATH: Deno.env.get('PATH') ?? '', HOME: Deno.env.get('HOME') ?? '', ...env },
    stdin: 'null',
    stdout: 'null',
    stderr: 'inherit',
  }).spawn();
  let exited = false;
  void child.status.then(() => {
    exited = true;
  });
  try {
    await eventually(async () => {
      assert(!exited, 'Detached runner exited before readiness');
      try {
        const ready = record(JSON.parse(await Deno.readTextFile(readyFile)));
        assertEquals(ready.state, 'ready');
        assertEquals(ready.registryReady, true);
        assertEquals(ready.dependencyReady, true);
        return true;
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) return undefined;
        throw error;
      }
    });
    // Duplicate start plus a new barrier transition must produce count/version 2, never 3.
    await publish('KvProofStarted', 'kv-proof-start');
    await publish('KvProofAdvanced', 'kv-proof-advance');
    const advanced = await instance(2);
    assert(!exited, 'Detached runner exited before persisted progress');
    assertEquals(advanced.version, 2);
    await publish('KvProofAdvanced', 'kv-proof-advance');
    await publish('KvProofFinished', 'kv-proof-finish');
    const finished = await instance(3);
    assertEquals(finished.version, 3);
    assertEquals(record(finished.state).phase, 'completed');
    return { count: 3, version: 3, detached: true };
  } finally {
    if (!exited) child.kill('SIGTERM');
    await child.status;
    await aspire(root, ['resource', 'sagas', 'start']);
  }
}
