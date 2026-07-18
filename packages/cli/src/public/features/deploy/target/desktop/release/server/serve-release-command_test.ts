import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { createServeReleaseCommand } from './serve-release-command.ts';

Deno.test('release server parser forwards lifecycle, listener, root, and handler', async () => {
  const root = await Deno.makeTempDir();
  try {
    const route = join(root, 'artifacts', 'stable', 'linux-x86_64');
    await Deno.mkdir(route, { recursive: true });
    await Deno.writeTextFile(join(route, 'latest.json'), '{}');
    let captured:
      | {
        options: { readonly hostname: string; readonly port: number; readonly signal: AbortSignal };
        handler: (request: Request) => Response | Promise<Response>;
      }
      | undefined;
    const output: string[] = [];
    const command = createServeReleaseCommand({
      resolveProjectRoot: () => Promise.resolve(root),
      serve: (options, handler) => {
        captured = { options, handler };
        return { finished: Promise.resolve() };
      },
      print: (message) => output.push(message),
    });

    await command.parse([
      '--release-dir',
      'artifacts',
      '--hostname',
      '0.0.0.0',
      '--port',
      '9000',
      '--base-path',
      '/downloads',
    ]);

    assertEquals(captured?.options.hostname, '0.0.0.0');
    assertEquals(captured?.options.port, 9000);
    assertEquals(captured?.options.signal.aborted, false);
    const response = await captured?.handler(
      new Request('https://release.test/downloads/stable/linux-x86_64/latest.json'),
    );
    assertEquals(response?.status, 200);
    assertEquals(output.length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
