import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import {
  createService,
  defineService,
  type ServiceTlsOptions,
  type ShutdownContext,
} from '../mod.ts';
import { shutdownSignalsForCurrentPlatform } from '../src/builder/service-listener.ts';

const LOOPBACK = '127.0.0.1';
const ALL_INTERFACES = '0.0.0.0';

/**
 * Returns a non-loopback IPv4 address of this host, or `undefined` when the host
 * only has loopback. The non-loopback dial assertions are skipped in that case.
 */
function nonLoopbackIPv4(): string | undefined {
  return Deno.networkInterfaces().find((iface) =>
    iface.family === 'IPv4' && !iface.address.startsWith('127.')
  )?.address;
}

/** Opens a raw TCP connection and reports whether anything accepted it. */
async function dial(hostname: string, port: number): Promise<'accepted' | 'refused'> {
  try {
    const conn = await Deno.connect({ hostname, port });
    conn.close();
    return 'accepted';
  } catch (error) {
    if (error instanceof Deno.errors.ConnectionRefused) return 'refused';
    throw error;
  }
}

/**
 * Asserts how a dial to this host's non-loopback address is answered. Reported as
 * an ignored step on hosts that only have loopback, so a skip stays visible.
 */
async function assertNonLoopbackDial(
  t: Deno.TestContext,
  port: number,
  expected: 'accepted' | 'refused',
): Promise<void> {
  const external = nonLoopbackIPv4();
  await t.step({
    name: `a non-loopback dial is ${expected}`,
    ignore: external === undefined,
    fn: async () => {
      assertEquals(await dial(external ?? LOOPBACK, port), expected);
    },
  });
}

async function assertHealthy(
  url: string,
  init?: RequestInit & { client?: Deno.HttpClient },
): Promise<void> {
  const response = await fetch(url, init);
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
}

function derElement(tag: number, ...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const header = length < 0x80
    ? [length]
    : length < 0x100
    ? [0x81, length]
    : [0x82, length >> 8, length & 0xff];
  const out = new Uint8Array(1 + header.length + length);
  out[0] = tag;
  out.set(header, 1);
  let offset = 1 + header.length;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function derSequence(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  return derElement(0x30, ...parts);
}

function derUtcTime(date: Date): Uint8Array<ArrayBuffer> {
  const text = `${date.toISOString().replace(/[-:T]/g, '').slice(2, 14)}Z`;
  return derElement(0x17, new TextEncoder().encode(text));
}

function toPem(label: string, der: Uint8Array): string {
  const lines = der.toBase64().match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

/**
 * Mints a throwaway self-signed Ed25519 certificate for `localhost` / `127.0.0.1`
 * in memory, so the TLS branch binds a real socket without a checked-in key or
 * an `openssl` dependency.
 */
async function selfSignedLoopbackCertificate(): Promise<ServiceTlsOptions> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));

  const ed25519 = derSequence(derElement(0x06, new Uint8Array([0x2b, 0x65, 0x70])));
  const commonName = derElement(0x06, new Uint8Array([0x55, 0x04, 0x03]));
  const name = derSequence(
    derElement(
      0x31,
      derSequence(commonName, derElement(0x0c, new TextEncoder().encode('localhost'))),
    ),
  );
  const now = Date.now();
  const validity = derSequence(
    derUtcTime(new Date(now - 60_000)),
    derUtcTime(new Date(now + 3_600_000)),
  );
  const subjectAltName = derSequence(
    derElement(0x82, new TextEncoder().encode('localhost')),
    derElement(0x87, new Uint8Array([127, 0, 0, 1])),
  );
  const extensions = derElement(
    0xa3,
    derSequence(
      derSequence(
        derElement(0x06, new Uint8Array([0x55, 0x1d, 0x11])),
        derElement(0x04, subjectAltName),
      ),
    ),
  );
  const tbsCertificate = derSequence(
    derElement(0xa0, derElement(0x02, new Uint8Array([2]))),
    derElement(0x02, new Uint8Array([1])),
    ed25519,
    name,
    validity,
    name,
    spki,
    extensions,
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('Ed25519', pair.privateKey, tbsCertificate),
  );
  const certificate = derSequence(
    tbsCertificate,
    ed25519,
    derElement(0x03, new Uint8Array([0]), signature),
  );

  return { cert: toPem('CERTIFICATE', certificate), key: toPem('PRIVATE KEY', pkcs8) };
}

Deno.test('serve binds only the requested loopback hostname', async (t) => {
  const running = await createService({}, { name: 'hostname-loopback' })
    .withHealth()
    .serve({ hostname: LOOPBACK, port: 0, handleSignals: false });

  try {
    assertEquals(running.addr.hostname, LOOPBACK);
    assertEquals(running.addr.transport, 'tcp');
    await assertHealthy(`http://${LOOPBACK}:${running.addr.port}/health`);

    await assertNonLoopbackDial(t, running.addr.port, 'refused');
  } finally {
    await running.stop();
  }
});

Deno.test('serve keeps the all-interfaces default when hostname is omitted', async (t) => {
  const running = await createService({}, { name: 'hostname-default' })
    .withHealth()
    .serve({ port: 0, handleSignals: false });

  try {
    assertEquals(running.addr.hostname, ALL_INTERFACES);
    await assertHealthy(`http://${LOOPBACK}:${running.addr.port}/health`);

    await assertNonLoopbackDial(t, running.addr.port, 'accepted');
  } finally {
    await running.stop();
  }
});

Deno.test('port 0 resolves to a distinct ephemeral port on the requested hostname', async () => {
  // One listener takes port 0 from serve(), the other from the service config default.
  const fromServe = await createService({}, { name: 'hostname-port0-serve' })
    .withHealth()
    .serve({ hostname: LOOPBACK, port: 0, handleSignals: false });
  const fromConfig = await createService({}, { name: 'hostname-port0-config', port: 0 })
    .withHealth()
    .serve({ hostname: LOOPBACK, handleSignals: false });

  try {
    for (const running of [fromServe, fromConfig]) {
      assertEquals(running.addr.hostname, LOOPBACK);
      assert(running.addr.port > 0, 'port 0 reports the port the OS assigned');
      await assertHealthy(`http://${LOOPBACK}:${running.addr.port}/health`);
    }
    assertNotEquals(fromServe.addr.port, fromConfig.addr.port);
  } finally {
    await fromServe.stop();
    await fromConfig.stop();
  }
});

Deno.test('serve binds the requested hostname on the TLS branch', async (t) => {
  const tls = await selfSignedLoopbackCertificate();
  const client = Deno.createHttpClient({ caCerts: [tls.cert] });
  const running = await createService({}, { name: 'hostname-tls-loopback' })
    .withHealth()
    .serve({ hostname: LOOPBACK, port: 0, handleSignals: false, tls });

  try {
    assertEquals(running.addr.hostname, LOOPBACK);
    assertEquals(running.addr.transport, 'tcp');
    await assertHealthy(`https://${LOOPBACK}:${running.addr.port}/health`, { client });

    await assertNonLoopbackDial(t, running.addr.port, 'refused');
  } finally {
    await running.stop();
    client.close();
  }
});

Deno.test('serve keeps the all-interfaces default on the TLS branch when hostname is omitted', async (t) => {
  const tls = await selfSignedLoopbackCertificate();
  const client = Deno.createHttpClient({ caCerts: [tls.cert] });
  const running = await createService({}, { name: 'hostname-tls-default' })
    .withHealth()
    .serve({ port: 0, handleSignals: false, tls });

  try {
    assertEquals(running.addr.hostname, ALL_INTERFACES);
    await assertHealthy(`https://${LOOPBACK}:${running.addr.port}/health`, { client });

    await assertNonLoopbackDial(t, running.addr.port, 'accepted');
  } finally {
    await running.stop();
    client.close();
  }
});

Deno.test('a loopback listener drains once and closes on manual stop', async () => {
  const contexts: ShutdownContext[] = [];
  const running = await createService({}, { name: 'hostname-manual-stop' })
    .withHealth()
    .onShutdown((context) => {
      contexts.push(context);
    })
    .serve({ hostname: LOOPBACK, port: 0, handleSignals: false });
  const origin = `http://${LOOPBACK}:${running.addr.port}`;

  assertEquals(running.addr.hostname, LOOPBACK);
  await assertHealthy(`${origin}/health`);

  await running.stop();
  await running.stop();

  assertEquals(contexts, [{ reason: 'manual', signal: undefined }]);
  await assertRejects(() => fetch(`${origin}/health`), TypeError);
});

Deno.test('a loopback listener stops when its external signal aborts', async () => {
  const controller = new AbortController();
  const contexts: ShutdownContext[] = [];
  const running = await createService({}, { name: 'hostname-external-signal' })
    .withHealth()
    .onShutdown((context) => {
      contexts.push(context);
    })
    .serve({ hostname: LOOPBACK, port: 0, handleSignals: false, signal: controller.signal });
  const origin = `http://${LOOPBACK}:${running.addr.port}`;

  try {
    assertEquals(running.addr.hostname, LOOPBACK);
    await assertHealthy(`${origin}/health`, { signal: AbortSignal.timeout(10_000) });

    controller.abort();

    // There is no completion promise on RunningService. Observe closure before
    // stop() can trigger the same shutdown and mask a missing abort handler.
    const deadline = AbortSignal.timeout(10_000);
    let closed = false;
    while (!deadline.aborted) {
      try {
        const response = await fetch(`${origin}/health`, { signal: deadline });
        await response.body?.cancel();
      } catch (error) {
        if (deadline.aborted) break;
        assert(error instanceof TypeError, 'health fetch must fail because the listener closed');
        closed = true;
        break;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }
    assert(closed && !deadline.aborted, 'external abort must close the listener within 10 seconds');

    assertEquals(contexts, [{ reason: 'manual', signal: undefined }]);
    await assertRejects(
      () => fetch(`${origin}/health`, { signal: AbortSignal.timeout(10_000) }),
      TypeError,
    );
  } finally {
    // Also cleans up the still-running listener when the abort regression fails.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        running.stop(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('stop exceeded 10 seconds')), 10_000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  assertEquals(contexts, [{ reason: 'manual', signal: undefined }]);
});

Deno.test('a loopback listener installs, runs, and removes its OS signal handlers', async () => {
  const originalAdd = Deno.addSignalListener;
  const originalRemove = Deno.removeSignalListener;
  const added = new Map<Deno.Signal, () => void>();
  const removed: Deno.Signal[] = [];

  Deno.addSignalListener = ((signal, handler) => {
    added.set(signal, handler);
  }) as typeof Deno.addSignalListener;
  Deno.removeSignalListener = ((signal, handler) => {
    assertEquals(added.get(signal), handler);
    removed.push(signal);
  }) as typeof Deno.removeSignalListener;

  try {
    const contexts: ShutdownContext[] = [];
    const running = await createService({}, { name: 'hostname-os-signal' })
      .withHealth()
      .onShutdown((context) => {
        contexts.push(context);
      })
      .serve({ hostname: LOOPBACK, port: 0 });
    const origin = `http://${LOOPBACK}:${running.addr.port}`;
    const platformSignals = [...shutdownSignalsForCurrentPlatform()];

    assertEquals(running.addr.hostname, LOOPBACK);
    assertEquals([...added.keys()], platformSignals);
    await assertHealthy(`${origin}/health`);

    const [signal] = platformSignals;
    added.get(signal)?.();
    await running.stop();

    assertEquals(contexts, [{ reason: 'signal', signal }]);
    assertEquals(removed, platformSignals);
    await assertRejects(() => fetch(`${origin}/health`), TypeError);
  } finally {
    Deno.addSignalListener = originalAdd;
    Deno.removeSignalListener = originalRemove;
  }
});

Deno.test('defineService forwards hostname to the listener', async (t) => {
  const running = await defineService({}, {
    auth: { public: true, reason: 'Public fixture for behavior unrelated to authentication' },
    name: 'define-service-hostname',
    port: 0,
    hostname: LOOPBACK,
  });

  try {
    assertEquals(running.addr.hostname, LOOPBACK);
    await assertHealthy(`http://${LOOPBACK}:${running.addr.port}/health`);

    await assertNonLoopbackDial(t, running.addr.port, 'refused');
  } finally {
    await running.stop();
  }
});
