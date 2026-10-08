import { assert, assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

async function run(args: string[], env: Record<string, string>, deadline: number): Promise<void> {
  const child = new Deno.Command(args[0], {
    args: args.slice(1),
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const output = child.output();
  const expired = Promise.withResolvers<never>();
  const timer = setTimeout(() => {
    child.kill('SIGKILL');
    expired.reject(new Error('Native regression subprocess deadline exceeded'));
  }, deadline);
  try {
    const result = await Promise.race([output, expired.promise]);
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  } finally {
    clearTimeout(timer);
    await output;
  }
}

Deno.test('actual native document reload retires pending receive and reconnects typed RPC', async () => {
  const root = fromFileUrl(new URL('../../../', import.meta.url));
  const fixtures = fromFileUrl(new URL('./desktop-reload/', import.meta.url));
  const scratch = await Deno.makeTempDir({ prefix: 'netscript-desktop-reload-' });
  const renderer = join(scratch, 'renderer.js');
  const receipt = join(scratch, 'receipt.json');
  const nativeOutput = join(scratch, 'native-reload');
  try {
    await run(
      [
        Deno.execPath(),
        'bundle',
        '--frozen',
        '--platform',
        'browser',
        '--config',
        join(root, 'deno.json'),
        '--output',
        renderer,
        join(fixtures, 'renderer.ts'),
      ],
      {},
      120000,
    );
    await run(
      [
        Deno.execPath(),
        'desktop',
        '--backend',
        'cef',
        '--frozen',
        '--config',
        join(root, 'deno.json'),
        '--exclude-unused-npm',
        '--allow-all',
        '--output',
        nativeOutput,
        join(fixtures, 'host.ts'),
      ],
      {},
      180000,
    );
    await run([join(nativeOutput, 'native-reload')], {
      NETSCRIPT_RELOAD_RENDERER: renderer,
      NETSCRIPT_RELOAD_RECEIPT: receipt,
    }, 40000);
    const result = JSON.parse(await Deno.readTextFile(receipt));
    assertEquals(result.documents.length, 2);
    assertEquals(result.documents.map((document: { value: string }) => document.value), [
      'native-pong',
      'native-pong',
    ]);
    assert(result.documents[1].epoch > result.documents[0].epoch);
    assertEquals(result.retiredClosed, 1);
    assertEquals(result.bindCalls, 1);
    assertEquals(result.unbindCalls, 1);
    assertEquals(result.pending, 0);
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
});
