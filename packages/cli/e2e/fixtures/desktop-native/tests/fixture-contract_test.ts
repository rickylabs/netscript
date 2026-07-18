import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';
import { createDesktopServiceClient, type DesktopBindingHandler } from '@netscript/sdk/desktop';
import { REMOTE_SERVICE_ENV, RENDERER_EVIDENCE_ENV } from '../src/constants.ts';
import { createReleaseSigningFixture } from '../src/release-signing-fixture.ts';
import { desktopFixtureRouter } from '../src/router.ts';
import { desktopCommandArgs } from '../src/package.ts';
import {
  decodePkcs8Pem,
  importReleasePrivateKey,
  signReleaseString,
} from '../../../../src/public/features/deploy/target/desktop/release/sign-release.ts';

const DESKTOP_RUNTIME = { BrowserWindow: class BrowserWindow {} };

class ContractWindow {
  #handler: DesktopBindingHandler | undefined;

  bind(_name: string, handler: DesktopBindingHandler): void {
    this.#handler = handler;
  }

  unbind(): void {
    this.#handler = undefined;
  }

  invoke(operation: unknown, payload?: unknown): Promise<unknown> {
    if (this.#handler === undefined) {
      throw new Error('Fixture RPC binding is absent.');
    }
    return this.#handler(operation, payload as string | Uint8Array | undefined);
  }
}

Deno.test('renderer contract acknowledges a response fetched through services__remote__http__0', async () => {
  const evidencePath = await Deno.makeTempFile({
    prefix: 'netscript-desktop-evidence-',
  });
  const service = Deno.serve(
    { hostname: '127.0.0.1', port: 0 },
    () => Response.json({ value: 'remote-service-reached' }),
  );
  const remoteUrl = `http://127.0.0.1:${service.addr.port}`;
  const previousRemote = Deno.env.get(REMOTE_SERVICE_ENV);
  const previousEvidence = Deno.env.get(RENDERER_EVIDENCE_ENV);
  Deno.env.set(REMOTE_SERVICE_ENV, remoteUrl);
  Deno.env.set(RENDERER_EVIDENCE_ENV, evidencePath);

  const window = new ContractWindow();
  const binding = bindDesktopRpcWindow({
    window,
    router: desktopFixtureRouter,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const client = createDesktopServiceClient({
    contract: desktopFixtureRouter,
    invoke: window.invoke.bind(window),
  });
  try {
    const evidence = await client.remote.probe(undefined);
    assertEquals(evidence, {
      source: remoteUrl,
      value: 'remote-service-reached',
      version: '1.0.0',
    });
    await client.remote.acknowledge(evidence);
    assertEquals(JSON.parse(await Deno.readTextFile(evidencePath)), evidence);
  } finally {
    await binding.close();
    await service.shutdown();
    restoreEnvironment(REMOTE_SERVICE_ENV, previousRemote);
    restoreEnvironment(RENDERER_EVIDENCE_ENV, previousEvidence);
    await Deno.remove(evidencePath);
  }
});

Deno.test('release signing fixture exports PKCS8 PEM and verifiable raw public key', async () => {
  const fixture = await createReleaseSigningFixture();
  const value = JSON.stringify({ sequence: 1, version: '2.0.0' });
  const privateKey = await importReleasePrivateKey(
    decodePkcs8Pem(fixture.privateKeyPem),
  );
  const envelope = await signReleaseString(value, privateKey);
  const signature = Uint8Array.fromBase64(envelope.signature);
  const publicKey = await crypto.subtle.importKey(
    'raw',
    Uint8Array.fromBase64(fixture.publicKeyBase64),
    'Ed25519',
    false,
    ['verify'],
  );
  assertEquals(
    fixture.privateKeyPem.startsWith('-----BEGIN PRIVATE KEY-----\n'),
    true,
  );
  assertEquals(envelope.signed, value);
  assertEquals(
    await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      signature,
      new TextEncoder().encode(value),
    ),
    true,
  );
});

Deno.test('renderer entrypoint bundles for a browser without ambient binding declarations', async () => {
  const output = await Deno.makeTempFile({
    prefix: 'netscript-desktop-renderer-',
    suffix: '.js',
  });
  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'bundle',
        '--platform',
        'browser',
        '--output',
        output,
        fromFileUrl(new URL('../src/renderer.ts', import.meta.url)),
      ],
      stdout: 'piped',
      stderr: 'piped',
    });
    const result = await command.output();
    assertEquals(
      result.code,
      0,
      new TextDecoder().decode(result.stderr),
    );
    const bundle = await Deno.readTextFile(output);
    assertEquals(bundle.includes('__netscript_rpc__'), true);
    assertEquals(bundle.includes('services__remote__http__0'), true);
  } finally {
    await Deno.remove(output);
  }
});

Deno.test('desktop package task forwards target and output flags before the entrypoint', () => {
  const args = desktopCommandArgs([
    '--target',
    'x86_64-unknown-linux-gnu',
    '-o',
    '/tmp/netscript-desktop-e2e.deb',
  ]);
  assertEquals(args.slice(0, 3), ['desktop', '--allow-all', '--include']);
  assertEquals(args[3]?.endsWith('/dist/renderer.js'), true);
  assertEquals(args.slice(4, -1), [
    '--target',
    'x86_64-unknown-linux-gnu',
    '-o',
    '/tmp/netscript-desktop-e2e.deb',
  ]);
  assertEquals(args.at(-1)?.endsWith('/src/main.ts'), true);
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) Deno.env.delete(name);
  else Deno.env.set(name, value);
}
