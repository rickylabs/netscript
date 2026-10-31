/** Public factory storage restart and precise fail-fast configuration qualification. @module */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { type ChildRun, createRuntimeSandbox } from './test_utils/service-runtime-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../../', import.meta.url));
const MARKER = 's6f-streams: storage assertions and native cleanup settled';
const RECEIPT = 's6f-replay:';
interface Replay {
  firstOffset: string;
  finalOffset: string;
  bytes: number[];
}
interface ProbeOptions {
  scratch: string;
  dataDir?: string;
  ports: readonly [number, number];
  row: string;
  path: string;
  replay?: Replay;
}

Deno.test({
  name: 'streams file storage survives orderly fresh-process restart; fresh memory returns 404',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    for (const mode of ['file', 'memory']) {
      await using sandbox = await createRuntimeSandbox('storage-' + mode);
      const dataDir = mode === 'file' ? sandbox.scratch + '/data' : undefined;
      if (dataDir !== undefined) await Deno.mkdir(dataDir);
      const path = '/v1/stream/s6f-' + crypto.randomUUID();
      let replay: Replay | undefined;
      for (const row of ['writer', 'reader']) {
        const ports = choosePorts();
        const run = await sandbox.run(
          storageProbe({
            scratch: sandbox.scratch,
            dataDir,
            ports,
            row,
            path,
            replay,
          }),
          { cwd: PLUGIN_ROOT, preferredPorts: [ports[0]] },
        );
        assertSuccess(run);
        if (row === 'writer') {
          const line = run.stdout.split('\n').find((line) => line.startsWith(RECEIPT));
          assert(line !== undefined, run.stdout);
          const value: unknown = JSON.parse(line.slice(RECEIPT.length));
          assert(typeof value === 'object' && value !== null);
          assert('firstOffset' in value && typeof value.firstOffset === 'string');
          assert('finalOffset' in value && typeof value.finalOffset === 'string');
          assert(value.firstOffset.length > 0 && value.finalOffset.length > 0);
          assert('bytes' in value && Array.isArray(value.bytes));
          const bytes = value.bytes.map((byte: unknown) => {
            assert(typeof byte === 'number' && Number.isInteger(byte) && byte >= 0 && byte <= 255);
            return byte;
          });
          assertEquals(bytes, Array.from(new TextEncoder().encode('before|after')));
          replay = { firstOffset: value.firstOffset, finalOffset: value.finalOffset, bytes };
        }
      }
    }
  },
});

Deno.test({
  name: 'streams configured empty, missing, regular-file and write-denied storage never falls back',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    for (const row of ['empty', 'missing', 'file-path', 'write-denied']) {
      await using sandbox = await createRuntimeSandbox('storage-' + row);
      const dataDir = row === 'empty' ? '' : sandbox.scratch + '/data';
      if (row === 'file-path') await Deno.writeTextFile(dataDir, 'owned regular-file fixture');
      if (row === 'write-denied') await Deno.mkdir(dataDir);
      const ports = choosePorts();
      const run = await sandbox.run(
        storageProbe({
          scratch: sandbox.scratch,
          dataDir,
          ports,
          row,
          path: '/v1/stream/never-started',
        }),
        { cwd: PLUGIN_ROOT, preferredPorts: [ports[0]], denyWrite: row === 'write-denied' },
      );
      assertSuccess(run);
      assertEquals(run.stderr.includes('Streams storage is ephemeral'), false, run.stderr);
      if (row === 'write-denied') assertEquals(Array.from(Deno.readDirSync(dataDir)), []);
    }
  },
});

function choosePorts(): readonly [number, number] {
  using upstream = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  using front = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  return [upstream.addr.port, front.addr.port];
}

function assertSuccess(run: ChildRun): void {
  assertEquals(run.code, 0, `${run.stderr}\n${run.stdout}`);
  assertEquals(run.stdout.split(MARKER).length - 1, 1, run.stdout);
  assertEquals(run.stdout.trimEnd().endsWith(MARKER), true, run.stdout);
}

/** Writer offsets cross the child boundary unchanged; only the public factory owns storage. */
function storageProbe(options: ProbeOptions): string {
  return `import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { basename, dirname, normalize } from 'jsr:@std/path@^1';
import type { RunningService } from '@netscript/plugin-streams/service';
const options: {
  scratch: string; dataDir?: string; ports: readonly [number, number]; row: string; path: string;
  replay?: { firstOffset: string; finalOffset: string; bytes: number[] };
} = ${JSON.stringify(options)};
const { scratch, dataDir, row, path } = options, [upstream, selectedFront] = options.ports;
const invalid = row !== 'writer' && row !== 'reader';
const ports = invalid ? [upstream, selectedFront] : [upstream];
const failures: unknown[] = [];
const observations: Record<string, unknown> = { row, mode: dataDir === undefined ? 'memory' : 'file' };
let running: RunningService | undefined, startupError: unknown;
let replay = options.replay;
async function request(port: number, path: string, init?: RequestInit) {
  const response = await fetch(\`http://127.0.0.1:\${port}\${path}\`, init);
  return { status: response.status, bytes: Array.from(new Uint8Array(await response.arrayBuffer())),
    offset: response.headers.get('stream-next-offset') };
}
try {
  Deno.chdir(scratch);
  Deno.env.set('STREAMS_INTERNAL_PORT', String(upstream));
  Deno.env.set('PORT', 'invalid ambient PORT');
  Deno.env.set('STREAMS_PORT', 'invalid ambient STREAMS_PORT');
  if (dataDir !== undefined) Deno.env.set('STREAMS_DATA_DIR', dataDir);
  const { startStreamsService } = await import('@netscript/plugin-streams/service');
  try {
    running = await startStreamsService({
      auth: { public: true, reason: 'S6f owned storage restart and refusal qualification' },
      serve: { hostname: '127.0.0.1', port: invalid ? selectedFront : 0, handleSignals: false },
    });
  } catch (error) { startupError = error; }
  if (running !== undefined) ports.push(running.addr.port);
  if (invalid) {
    observations.nativeError = startupError instanceof Error
      ? { name: startupError.name, message: startupError.message,
        cause: startupError.cause instanceof Error
          ? { name: startupError.cause.name, message: startupError.cause.message } : undefined }
      : String(startupError);
    console.log(JSON.stringify({ row, nativeError: observations.nativeError }));
    assertEquals(running, undefined, 'Invalid configured storage unexpectedly started');
    assert(startupError instanceof Error, String(startupError));
    if (row === 'write-denied') {
      assert(startupError instanceof Deno.errors.NotCapable, String(startupError));
      const denied = /^Requires write access to "([^"]+)"/.exec(startupError.message);
      assert(denied !== null, startupError.message);
      assert(dataDir !== undefined);
      assertEquals(normalize(dirname(denied[1])), normalize(dataDir));
      assert(/^\\.netscript-storage-probe-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(basename(denied[1])), denied[1]);
      observations.deniedProbe = denied[1];
    } else {
      assertEquals(startupError.message, 'STREAMS_DATA_DIR must name an existing directory.');
      if (row === 'missing') assert(startupError.cause instanceof Deno.errors.NotFound);
    }
  } else {
    if (startupError !== undefined) throw startupError;
    assert(running !== undefined);
    const front = running.addr.port;
    assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
    assert(Number.isInteger(front) && front > 0);
    const healthResponse = await request(front, '/health');
    assertEquals(healthResponse.status, 200);
    const health: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(healthResponse.bytes)));
    assert(typeof health === 'object' && health !== null && 'checks' in health);
    assert('status' in health && health.status === 'healthy');
    assert(Array.isArray(health.checks));
    const check: unknown = health.checks.find((entry: unknown) =>
      typeof entry === 'object' && entry !== null && 'name' in entry && entry.name === 'streams-storage');
    assert(typeof check === 'object' && check !== null && 'storage' in check);
    const storage = check.storage;
    assert(typeof storage === 'object' && storage !== null);
    assert('mode' in storage && 'durable' in storage && 'probe' in storage);
    assertEquals([storage.mode, storage.durable, storage.probe],
      dataDir === undefined ? ['memory', false, 'not-applicable'] : ['file', true, 'passed']);
    assertEquals('dataDir' in storage, false);
    observations.storage = storage;
    if (row === 'writer') {
      const headers = { 'content-type': 'text/plain' };
      const created = await request(front, path, { method: 'PUT', headers, body: 'before|' });
      assertEquals(created.status, 201);
      assert(typeof created.offset === 'string' && created.offset.length > 0);
      assertEquals((await request(front, path, { method: 'POST', headers, body: 'after' })).status, 204);
      const snapshot = await request(front, path + '?offset=-1');
      assertEquals(snapshot.status, 200);
      assertEquals(snapshot.bytes, Array.from(new TextEncoder().encode('before|after')));
      assert(typeof snapshot.offset === 'string' && snapshot.offset.length > 0);
      replay = { firstOffset: created.offset, finalOffset: snapshot.offset, bytes: snapshot.bytes };
      observations.snapshot = snapshot;
    } else {
      assert(replay !== undefined, 'Fresh reader requires actual writer receipt');
      const snapshot = await request(front, path + '?offset=-1');
      observations.snapshot = snapshot;
      if (dataDir === undefined) assertEquals(snapshot.status, 404);
      else {
        assertEquals(snapshot, { status: 200, bytes: replay.bytes, offset: replay.finalOffset });
        const tail = await request(front, path + '?offset=' + encodeURIComponent(replay.firstOffset));
        assertEquals(tail, { status: 200, bytes: Array.from(new TextEncoder().encode('after')),
          offset: replay.finalOffset });
        observations.tail = tail;
      }
    }
    const direct = await request(upstream, path + '?offset=-1');
    assertEquals(direct, observations.snapshot, 'actual loopback upstream matches front bytes/offset');
    observations.upstream = direct;
  }
} catch (error) { failures.push(error); }
try { await running?.stop(); await running?.stop(); } catch (error) { failures.push(error); }
for (const port of new Set(ports)) {
  try { Deno.listen({ hostname: '127.0.0.1', port }).close(); }
  catch (error) { failures.push(error); }
}
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log(JSON.stringify({ observations, reboundPorts: [...new Set(ports)] }));
if (row === 'writer') console.log('${RECEIPT}' + JSON.stringify(replay));
console.log('${MARKER}');
`;
}
