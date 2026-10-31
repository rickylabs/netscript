/** Native default-context compatibility of the public plural workers service entrypoint. */
import { assertEquals } from 'jsr:@std/assert@^1';
import { stripAnsiCode } from 'jsr:@std/fmt@1/colors';
import { fromFileUrl } from '@std/path';
import { createSandbox } from './test_utils/service-test-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../../', import.meta.url));
const SUCCESS_MARKER = 's3g-legacy: PORT precedence, fallback and missing PORT verified';
const CLEANUP_MARKER = 's3g-legacy: native listeners and owned KV cleanup settled';

Deno.test({
  name:
    'legacy default delegates with native public host and PORT semantics; wildcard permission is explicit',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    for (const legacyPublicHost of [true, false]) {
      await using sandbox = await createSandbox();
      const run = await sandbox.run(createLegacyProbe(sandbox.scratch, legacyPublicHost), {
        cwd: PLUGIN_ROOT,
        http: true,
        ...(legacyPublicHost ? { legacyPublicHost: true } : {}),
        deadlineMs: 30_000,
      });
      const evidence = JSON.stringify({ legacyPublicHost, ...run });
      console.log(evidence);
      assertEquals(run.code, legacyPublicHost ? 0 : 1, evidence);
      assertEquals(run.stdout.split(CLEANUP_MARKER).length - 1, 1, evidence);
      assertEquals(run.stdout.split(SUCCESS_MARKER).length - 1, legacyPublicHost ? 1 : 0, evidence);
      if (legacyPublicHost) {
        assertEquals(run.stdout.trimEnd().endsWith(SUCCESS_MARKER), true, evidence);
      } else {
        assertEquals(stripAnsiCode(run.stderr).match(/^error: .*$/gm), [
          'error: Uncaught (in promise) NotCapable: Requires net access to "0.0.0.0:0", run again with the --allow-net flag',
        ], evidence);
      }
    }
  },
});

/** Each fresh child uses the actual public default and native signal registration/manual stop. */
function createLegacyProbe(scratch: string, legacyPublicHost: boolean): string {
  return `import { closeKv, getRawKv } from '@netscript/kv';
import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { PluginServiceContext, RunningService } from '@netscript/plugin-workers/service';

const scratch = ${JSON.stringify(scratch)};
const failures: unknown[] = [];
let running: RunningService | undefined;
let kv: Deno.Kv | undefined;

function context(env: Readonly<Record<string, string>>): PluginServiceContext {
  return Object.freeze({
    db: {
      getClient: () => Promise.reject(new Error('fixture DB must not run')),
    },
    contracts: {},
    kv: {},
    logger: {},
    env: Object.freeze(env),
  });
}

async function releaseListener(): Promise<void> {
  if (running === undefined) return;
  const port = running.addr.port;
  await running.stop();
  await running.stop();
  const deadline = performance.now() + 2_000;
  while (true) {
    if (performance.now() >= deadline) throw new Error('LEGACY_LISTENER_DID_NOT_RELEASE');
    try {
      Deno.listen({ hostname: '127.0.0.1', port }).close();
      break;
    } catch (error) {
      if (!(error instanceof Deno.errors.AddrInUse)) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
  assert(kv !== undefined, 'started legacy listener has caller-owned KV');
  await kv.set(['s3g', 'after-stop'], port);
  assertEquals((await kv.get(['s3g', 'after-stop'])).value, port);
  running = undefined;
}

try {
  Deno.chdir(scratch);
  kv = await getRawKv({
    provider: 'deno-kv',
    path: scratch + '/owned.sqlite',
    skipServiceDiscovery: true,
  });
  const { default: createWorkersService } = await import('@netscript/plugin-workers/services');
  const rows = [
    { label: 'context-port', context: context({ PORT: '0' }), processPort: 'invalid' },
    { label: 'process-port', context: context({}), processPort: '0' },
  ];
  for (const row of rows) {
    Deno.env.set('PORT', row.processPort);
    running = await createWorkersService(row.context);
    const port = running.addr.port;
    assertEquals([running.addr.hostname, running.addr.transport], ['0.0.0.0', 'tcp']);
    assert(Number.isInteger(port) && port > 0, 'legacy PORT 0 must allocate a positive port');
    const response = await fetch(\`http://127.0.0.1:\${port}/api/v1/workers/describe\`);
    const body: unknown = await response.json();
    assertEquals(response.status, 200);
    assert(
      typeof body === 'object' && body !== null &&
      'capabilities' in body && Array.isArray(body.capabilities),
    );
    assert(
      body.capabilities.includes('background-processor'),
      'real unauthenticated legacy describe',
    );
    await releaseListener();
    console.log(JSON.stringify({
      legacyCase: row.label,
      port,
      listenerAndKvVerified: true,
    }));
  }
  Deno.env.delete('PORT');
  const missing = await assertRejects(() => createWorkersService(context({})), Error);
  assertEquals(missing.message, 'Workers API requires the host-provided PORT environment variable.');
} catch (error) {
  failures.push(error);
  if (!${legacyPublicHost}) {
    try {
      assert(error instanceof Deno.errors.NotCapable, 'negative must reach native net permission');
      assertEquals(
        error.message,
        'Requires net access to "0.0.0.0:0", run again with the --allow-net flag',
      );
    } catch (qualificationError) {
      failures.push(qualificationError);
    }
  }
}

const primaryFailures = failures.length;
try {
  await releaseListener();
} catch (error) {
  failures.push(error);
}
try {
  await closeKv();
} catch (error) {
  failures.push(error);
}
if (failures.length === primaryFailures) console.log('${CLEANUP_MARKER}');
if (failures.length === 1) throw failures[0];
if (failures.length > 1) {
  throw new AggregateError(failures, failures.map(String).join('\\n'));
}
console.log('${SUCCESS_MARKER}');
`;
}
