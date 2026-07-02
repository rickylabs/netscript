import { assert, assertEquals } from '@std/assert';
import { createService } from '../mod.ts';
import { buildListenerBanner, resolveTlsConfig } from '../src/builder/service-listener.ts';

const SAMPLE_CERT = '-----BEGIN CERTIFICATE-----\nMIItest\n-----END CERTIFICATE-----\n';
const SAMPLE_KEY = '-----BEGIN PRIVATE KEY-----\nMIItest\n-----END PRIVATE KEY-----\n';

const TLS_CERT_FILE_ENV = 'NETSCRIPT_TLS_CERT_FILE';
const TLS_KEY_FILE_ENV = 'NETSCRIPT_TLS_KEY_FILE';

function withClearedTlsEnv(): () => void {
  const priorCert = Deno.env.get(TLS_CERT_FILE_ENV);
  const priorKey = Deno.env.get(TLS_KEY_FILE_ENV);
  Deno.env.delete(TLS_CERT_FILE_ENV);
  Deno.env.delete(TLS_KEY_FILE_ENV);
  return () => {
    if (priorCert === undefined) Deno.env.delete(TLS_CERT_FILE_ENV);
    else Deno.env.set(TLS_CERT_FILE_ENV, priorCert);
    if (priorKey === undefined) Deno.env.delete(TLS_KEY_FILE_ENV);
    else Deno.env.set(TLS_KEY_FILE_ENV, priorKey);
  };
}

Deno.test('resolveTlsConfig returns undefined when no TLS is configured', () => {
  const restoreEnv = withClearedTlsEnv();
  try {
    assertEquals(resolveTlsConfig(undefined), undefined);
    assertEquals(resolveTlsConfig({ port: 0 }), undefined);
  } finally {
    restoreEnv();
  }
});

Deno.test('resolveTlsConfig prefers inline TLS material', () => {
  const restoreEnv = withClearedTlsEnv();
  try {
    const resolved = resolveTlsConfig({ tls: { cert: SAMPLE_CERT, key: SAMPLE_KEY } });
    assertEquals(resolved, { cert: SAMPLE_CERT, key: SAMPLE_KEY });
  } finally {
    restoreEnv();
  }
});

Deno.test('resolveTlsConfig reads env cert/key files when both are set', async () => {
  const restoreEnv = withClearedTlsEnv();
  const certFile = await Deno.makeTempFile({ suffix: '.pem' });
  const keyFile = await Deno.makeTempFile({ suffix: '.pem' });
  try {
    await Deno.writeTextFile(certFile, SAMPLE_CERT);
    await Deno.writeTextFile(keyFile, SAMPLE_KEY);
    Deno.env.set(TLS_CERT_FILE_ENV, certFile);
    Deno.env.set(TLS_KEY_FILE_ENV, keyFile);

    const resolved = resolveTlsConfig(undefined);
    assertEquals(resolved, { cert: SAMPLE_CERT, key: SAMPLE_KEY });
  } finally {
    restoreEnv();
    await Deno.remove(certFile);
    await Deno.remove(keyFile);
  }
});

Deno.test('resolveTlsConfig ignores env when only one file var is set', () => {
  const restoreEnv = withClearedTlsEnv();
  try {
    Deno.env.set(TLS_CERT_FILE_ENV, '/does/not/matter.pem');
    assertEquals(resolveTlsConfig(undefined), undefined);
  } finally {
    restoreEnv();
  }
});

Deno.test('buildListenerBanner uses the https scheme when TLS is active', () => {
  const banner = buildListenerBanner('https', { hostname: '127.0.0.1', port: 8443 });
  assertEquals(banner.origin, 'https://127.0.0.1:8443');
  assertEquals(banner.docs, 'https://127.0.0.1:8443/api/docs');
  assertEquals(banner.openapi, 'https://127.0.0.1:8443/api/openapi.json');
  assertEquals(banner.health, 'https://127.0.0.1:8443/health');
});

Deno.test('buildListenerBanner uses the http scheme without TLS', () => {
  const banner = buildListenerBanner('http', { hostname: '127.0.0.1', port: 8080 });
  assertEquals(banner.origin, 'http://127.0.0.1:8080');
  assertEquals(banner.health, 'http://127.0.0.1:8080/health');
});

/**
 * Captures the options passed to `Deno.serve` so the TLS branch can be asserted
 * without binding a real socket, mirroring how the runtime tests stub
 * `Deno.addSignalListener`.
 */
function stubServe(): {
  readonly restore: () => void;
  readonly capturedOptions: () =>
    | { cert?: string; key?: string; onListen?: (addr: Deno.NetAddr) => void }
    | null;
} {
  const originalServe = Deno.serve;
  let captured:
    | { cert?: string; key?: string; onListen?: (addr: Deno.NetAddr) => void }
    | null = null;

  const fakeServer = {
    addr: { hostname: '127.0.0.1', port: 8443, transport: 'tcp' } as Deno.NetAddr,
    shutdown: () => Promise.resolve(),
    finished: Promise.resolve(),
  };

  Deno.serve = ((options: unknown, _handler: unknown) => {
    captured = options as typeof captured;
    return fakeServer as unknown as ReturnType<typeof Deno.serve>;
  }) as typeof Deno.serve;

  return {
    restore: () => {
      Deno.serve = originalServe;
    },
    capturedOptions: () => captured,
  };
}

Deno.test('serve forwards inline TLS material to Deno.serve (https path)', async () => {
  const restoreEnv = withClearedTlsEnv();
  const serve = stubServe();
  try {
    const running = await createService({}, { name: 'tls-inline' })
      .serve({
        port: 0,
        handleSignals: false,
        tls: { cert: SAMPLE_CERT, key: SAMPLE_KEY },
      });

    const options = serve.capturedOptions();
    assertEquals(options?.cert, SAMPLE_CERT);
    assertEquals(options?.key, SAMPLE_KEY);
    // onListen must run without throwing using the https scheme banner.
    options?.onListen?.({ hostname: '127.0.0.1', port: 8443, transport: 'tcp' });

    await running.stop();
  } finally {
    serve.restore();
    restoreEnv();
  }
});

Deno.test('serve omits cert/key from Deno.serve when TLS is absent (http path)', async () => {
  const restoreEnv = withClearedTlsEnv();
  const serve = stubServe();
  try {
    const running = await createService({}, { name: 'tls-absent' })
      .serve({ port: 0, handleSignals: false });

    const options = serve.capturedOptions();
    assertEquals(options?.cert, undefined);
    assertEquals(options?.key, undefined);
    assert(typeof options?.onListen === 'function');

    await running.stop();
  } finally {
    serve.restore();
    restoreEnv();
  }
});
