/** Shared reference-server harness for StreamDB contract tests. @module */

import { fromFileUrl } from '@std/path';
import { TextLineStream } from 'jsr:@std/streams@^1/text-line-stream';

/** Start the persistent upstream reference server used by StreamDB tests. */
export async function startReferenceServer(
  dataDir: string,
  port = 0,
): Promise<{ url: string; kill(): Promise<void> }> {
  const fixture = new URL('./stream-db-server.ts', import.meta.url);
  const config = new URL('../../../../deno.json', import.meta.url);
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-all',
      '--config',
      fromFileUrl(config),
      fromFileUrl(fixture),
      JSON.stringify({
        dataDir,
        port,
      }),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let stderr = '';
  const errors = child.stderr.pipeTo(
    new WritableStream<Uint8Array>({
      write(bytes) {
        stderr += new TextDecoder().decode(bytes);
      },
    }),
  );
  let resolveReady!: (url: string) => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<string>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const output = (async () => {
    for await (
      const line of child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
        new TextLineStream(),
      )
    ) {
      if (!line.startsWith('{')) continue;
      const message = JSON.parse(line);
      if (typeof message.ready === 'string') resolveReady(message.ready);
    }
    rejectReady(new Error(`Reference server exited before readiness: ${stderr}`));
  })();
  try {
    return {
      url: await Promise.race([
        ready,
        new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Reference server readiness deadline exceeded.')),
            10_000,
          );
          void ready.finally(() => clearTimeout(timer)).catch(() => {});
        }),
      ]),
      async kill() {
        child.kill('SIGKILL');
        await child.status;
        await Promise.all([output, errors]);
      },
    };
  } catch (error) {
    try {
      child.kill('SIGKILL');
    } catch { /* Child may already have exited. */ }
    await child.status;
    await Promise.all([output, errors]);
    throw error;
  }
}
